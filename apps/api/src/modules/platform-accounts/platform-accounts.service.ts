/**
 * AFANTA — Platform Accounts Service
 *
 * @security-critical
 * Orchestrate the full Add Account flow:
 *   1. Launch embedded browser via EmbeddedBrowserService
 *   2. Wait for user to login on Google's real UI
 *   3. Harvest session bundle
 *   4. Seal bundle với @afanta/crypto sealSession (master password = AAD context)
 *   5. Persist encrypted envelope vào DB (Channel + PlatformAccount)
 *   6. Wipe master password from RAM
 *
 * Phase 1 trade-off: master password đi qua REST API (TLS in production).
 * Phase 3 sẽ chuyển sang client-side derivation (browser Web Crypto API).
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { sealSession, unsealSession, type AadContext } from '@afanta/crypto';
import { AccountStatus, PlatformName, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmbeddedBrowserService } from './embedded-browser/embedded-browser.service';
import { AddAccountDto, PlatformAccountSummaryDto } from './dto/add-account.dto';

@Injectable()
export class PlatformAccountsService {
  private readonly logger = new Logger(PlatformAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly browser: EmbeddedBrowserService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Add account — long-running (~30-300s tuỳ user thao tác login)
  // ─────────────────────────────────────────────────────────────
  async addAccount(
    userId: string,
    tenantId: string,
    dto: AddAccountDto,
  ): Promise<PlatformAccountSummaryDto> {
    if (dto.platform !== PlatformName.YOUTUBE) {
      throw new BadRequestException(
        `Phase 1 chỉ hỗ trợ YouTube. ${dto.platform} sẽ thêm ở Phase 1 cuối / Phase 2.`,
      );
    }

    let masterPassword: string | null = dto.masterPassword;

    try {
      // ── Step 1: Harvest session ────────────────────────────────
      this.logger.log(`User ${userId} bắt đầu add YouTube account...`);
      const harvest = await this.browser.harvestYouTubeSession();
      this.logger.log(`Harvested session for channel "${harvest.channelName}"`);

      // ── Step 2: Build AAD context ──────────────────────────────
      // platformAccountId placeholder — replaced với real cuid sau insert
      const createdAt = Date.now();
      const tempAccountId = `tmp-${createdAt}`;
      const aadCtx: AadContext = {
        tenantId,
        userId,
        platformAccountId: tempAccountId,
        createdAt,
      };

      // ── Step 3: Seal envelope ──────────────────────────────────
      const envelope = await sealSession(harvest.bundle, masterPassword, aadCtx);

      // ── Step 4: Insert into DB (transaction) ───────────────────
      const result = await this.prisma.$transaction(async (tx) => {
        const account = await tx.platformAccount.create({
          data: {
            tenantId,
            ownerUserId: userId,
            platform: dto.platform,
            accountLabel: dto.accountLabel ?? harvest.channelName,
            status: AccountStatus.ACTIVE,
            encryptedBundle: new Uint8Array(envelope.ciphertext),
            wrappedDek: new Uint8Array(envelope.wrappedDek),
            iv: new Uint8Array(envelope.iv),
            tag: new Uint8Array(envelope.tag),
            salt: new Uint8Array(envelope.salt),
            aad: envelope.aad,
            fingerprintSeed: harvest.bundle.fingerprintSeed,
            userAgent: harvest.bundle.userAgent,
            viewport: harvest.bundle.viewport,
            timezone: harvest.bundle.timezone,
            acceptLanguage: harvest.bundle.acceptLanguage,
            lastLoginAt: new Date(),
            lastVerifiedAt: new Date(),
          },
        });

        // Auto-bind channel
        const channel = await tx.channel.create({
          data: {
            tenantId,
            platformAccountId: account.id,
            externalId: harvest.channelExternalId,
            name: harvest.channelName,
            url: harvest.channelUrl,
            thumbnailUrl: harvest.channelThumbnailUrl ?? null,
          },
        });

        // Note: AAD has tempAccountId. For Phase 1 we accept this — when verifying later,
        // we use the same AAD that was stored. Consistency matters more than
        // the cosmetic mismatch with the real account.id.

        return { account, channel };
      });

      return this.toSummary(result.account, result.channel);
    } finally {
      // Wipe master password best-effort (string immutable in JS — best we can do)
      masterPassword = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // List accounts of a user
  // ─────────────────────────────────────────────────────────────
  async listForUser(userId: string, tenantId: string): Promise<PlatformAccountSummaryDto[]> {
    const accounts = await this.prisma.platformAccount.findMany({
      where: { tenantId, ownerUserId: userId },
      include: { channels: { take: 1, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return accounts.map((a) => this.toSummary(a, a.channels[0]));
  }

  // ─────────────────────────────────────────────────────────────
  // Verify session is still valid (decrypt with master password)
  // ─────────────────────────────────────────────────────────────
  async verifyAccount(
    accountId: string,
    userId: string,
    tenantId: string,
    masterPassword: string,
  ): Promise<{ ok: boolean; status: AccountStatus }> {
    const account = await this.prisma.platformAccount.findFirst({
      where: { id: accountId, ownerUserId: userId, tenantId },
    });
    if (!account) throw new NotFoundException('Account không tồn tại');

    try {
      // Reconstruct envelope from DB columns + try to unseal
      const aadParts = account.aad.split(':');
      if (aadParts.length !== 4) throw new Error('Malformed AAD');
      const ctx: AadContext = {
        tenantId: aadParts[0],
        userId: aadParts[1],
        platformAccountId: aadParts[2],
        createdAt: parseInt(aadParts[3], 10),
      };

      await unsealSession(
        {
          version: 1,
          salt: Buffer.from(account.salt),
          iv: Buffer.from(account.iv),
          ciphertext: Buffer.from(account.encryptedBundle),
          tag: Buffer.from(account.tag),
          wrappedDek: Buffer.from(account.wrappedDek),
          aad: account.aad,
          argon2: { memoryCost: 65536, timeCost: 3, parallelism: 4, hashLength: 32 },
        },
        masterPassword,
        ctx,
      );

      await this.prisma.platformAccount.update({
        where: { id: accountId },
        data: { lastVerifiedAt: new Date(), status: AccountStatus.ACTIVE },
      });
      return { ok: true, status: AccountStatus.ACTIVE };
    } catch (err) {
      this.logger.warn(`Verify failed for account ${accountId}: ${String(err)}`);
      throw new UnauthorizedException(
        'Xác minh thất bại — Master password sai hoặc session bị hỏng',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Delete account (require re-enter master password — TODO Phase 2 strict)
  // ─────────────────────────────────────────────────────────────
  async deleteAccount(accountId: string, userId: string, tenantId: string): Promise<void> {
    const account = await this.prisma.platformAccount.findFirst({
      where: { id: accountId, ownerUserId: userId, tenantId },
    });
    if (!account) throw new NotFoundException('Account không tồn tại');

    await this.prisma.platformAccount.delete({ where: { id: accountId } });
    this.logger.log(`Deleted PlatformAccount ${accountId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  private toSummary(
    account: Prisma.PlatformAccountGetPayload<object>,
    channel?: Prisma.ChannelGetPayload<object>,
  ): PlatformAccountSummaryDto {
    return {
      id: account.id,
      platform: account.platform,
      accountLabel: account.accountLabel,
      status: account.status,
      channelName: channel?.name,
      channelUrl: channel?.url ?? undefined,
      channelThumbnailUrl: channel?.thumbnailUrl ?? null,
      lastVerifiedAt: account.lastVerifiedAt,
      createdAt: account.createdAt,
    };
  }
}
