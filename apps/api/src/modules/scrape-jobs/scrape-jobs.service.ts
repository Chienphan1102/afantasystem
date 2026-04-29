/**
 * AFANTA — Scrape Jobs Service
 *
 * Phase 1 MVP: chạy trong API process với in-memory queue.
 * Phase 2 sẽ tách sang apps/worker-yt + BullMQ qua Redis native protocol.
 *
 * Pipeline:
 *   1. Pop job from in-memory queue
 *   2. Load Channel + PlatformAccount
 *   3. Unseal session (master password yêu cầu khi enqueue)
 *   4. YouTubeAdapter.initContext + verifySession + scrapeChannel
 *   5. Persist ChannelInsight + cache mới nhất vào Channel
 *   6. Update ScrapeJob status SUCCESS / FAILED
 *
 * Concurrency: 2 jobs đồng thời (limit RAM Playwright).
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unsealSession, type AadContext, type SessionBundle } from '@afanta/crypto';
import { YouTubeAdapter, type ChannelRef } from '@afanta/adapters';
import { AccountStatus, JobPriority, JobStatus, PlatformName, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

type EnqueueInput = {
  channelId: string;
  userId: string;
  tenantId: string;
  masterPassword: string;
  priority?: JobPriority;
};

type QueuedJob = {
  jobId: string;
  channelId: string;
  userId: string;
  masterPassword: string;
  priority: JobPriority;
};

const CONCURRENCY = 2;

@Injectable()
export class ScrapeJobsService {
  private readonly logger = new Logger(ScrapeJobsService.name);
  private readonly queue: QueuedJob[] = [];
  private activeCount = 0;

  constructor(
    private readonly prisma: PrismaService,
    _config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  async enqueueRescan(input: EnqueueInput): Promise<{ jobId: string }> {
    // Verify channel ownership
    const channel = await this.prisma.channel.findFirst({
      where: {
        id: input.channelId,
        tenantId: input.tenantId,
        platformAccount: { ownerUserId: input.userId },
      },
      include: { platformAccount: true },
    });
    if (!channel) throw new NotFoundException('Channel không tồn tại');

    if (channel.platformAccount.status !== AccountStatus.ACTIVE) {
      throw new NotFoundException(
        `PlatformAccount status=${channel.platformAccount.status} (cần ACTIVE để scrape)`,
      );
    }

    const job = await this.prisma.scrapeJob.create({
      data: {
        channelId: channel.id,
        triggeredByUserId: input.userId,
        priority: input.priority ?? JobPriority.NORMAL,
        status: JobStatus.PENDING,
      },
    });

    this.queue.push({
      jobId: job.id,
      channelId: channel.id,
      userId: input.userId,
      masterPassword: input.masterPassword,
      priority: job.priority,
    });
    this.tick();

    return { jobId: job.id };
  }

  async listJobsForChannel(
    channelId: string,
    userId: string,
    tenantId: string,
  ): Promise<unknown[]> {
    return this.prisma.scrapeJob.findMany({
      where: {
        channelId,
        channel: { tenantId, platformAccount: { ownerUserId: userId } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // In-memory worker loop
  // ─────────────────────────────────────────────────────────────
  private tick(): void {
    while (this.activeCount < CONCURRENCY && this.queue.length > 0) {
      // Pop highest-priority first
      this.queue.sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority));
      const job = this.queue.shift();
      if (!job) break;
      this.activeCount += 1;
      void this.runJob(job).finally(() => {
        this.activeCount -= 1;
        this.tick();
      });
    }
  }

  private priorityWeight(p: JobPriority): number {
    return p === JobPriority.HIGH ? 3 : p === JobPriority.NORMAL ? 2 : 1;
  }

  private async runJob(job: QueuedJob): Promise<void> {
    const startedAt = new Date();
    await this.prisma.scrapeJob.update({
      where: { id: job.jobId },
      data: { status: JobStatus.RUNNING, startedAt, workerId: `inproc-${process.pid}` },
    });

    const adapter = new YouTubeAdapter({
      log: (m) => this.logger.log(m),
      warn: (m) => this.logger.warn(m),
      error: (m, e) => this.logger.error(m, e instanceof Error ? e.stack : String(e)),
    });

    try {
      const channel = await this.prisma.channel.findUniqueOrThrow({
        where: { id: job.channelId },
        include: { platformAccount: true },
      });

      if (channel.platformAccount.platform !== PlatformName.YOUTUBE) {
        throw new Error(`Unsupported platform: ${channel.platformAccount.platform}`);
      }

      // ── Unseal session ──────────────────────────────────────
      const aadParts = channel.platformAccount.aad.split(':');
      if (aadParts.length !== 4) throw new Error('Malformed AAD');
      const ctx: AadContext = {
        tenantId: aadParts[0],
        userId: aadParts[1],
        platformAccountId: aadParts[2],
        createdAt: parseInt(aadParts[3], 10),
      };

      const sessionBundle = (await unsealSession(
        {
          version: 1,
          salt: Buffer.from(channel.platformAccount.salt),
          iv: Buffer.from(channel.platformAccount.iv),
          ciphertext: Buffer.from(channel.platformAccount.encryptedBundle),
          tag: Buffer.from(channel.platformAccount.tag),
          wrappedDek: Buffer.from(channel.platformAccount.wrappedDek),
          aad: channel.platformAccount.aad,
          argon2: { memoryCost: 65536, timeCost: 3, parallelism: 4, hashLength: 32 },
        },
        job.masterPassword,
        ctx,
      )) as SessionBundle;

      // ── Init adapter context ────────────────────────────────
      const browserCtx = await adapter.initContext(sessionBundle);

      try {
        const status = await adapter.verifySession(browserCtx);
        if (!status.ok) {
          if (status.reason === 'CHECKPOINT') {
            await this.prisma.platformAccount.update({
              where: { id: channel.platformAccount.id },
              data: { status: AccountStatus.CHECKPOINT },
            });
            throw new Error('Session bị CHECKPOINT — user cần re-login');
          }
          if (status.reason === 'EXPIRED') {
            await this.prisma.platformAccount.update({
              where: { id: channel.platformAccount.id },
              data: { status: AccountStatus.EXPIRED },
            });
            throw new Error('Session EXPIRED — user cần re-login');
          }
          throw new Error(`Verify failed: ${status.reason}`);
        }

        const channelRef: ChannelRef = {
          id: channel.id,
          externalId: channel.externalId,
          url: channel.url,
          name: channel.name,
        };

        const result = await adapter.scrapeChannel(browserCtx, channelRef);

        // ── Persist insight (transaction) ─────────────────────
        const minuteBucket = Math.floor(result.scrapedAt.getTime() / 60_000);
        const hash = createHash('sha256').update(`${channel.id}:${minuteBucket}`).digest('hex');

        await this.prisma.$transaction(async (tx) => {
          await tx.channelInsight.create({
            data: {
              channelId: channel.id,
              scrapeJobId: job.jobId,
              subscriberCount: BigInt(result.subscriberCount),
              totalViews: BigInt(result.totalViews),
              watchTimeMinutes: BigInt(result.watchTimeMinutes ?? 0),
              estimatedRevenueUsd: result.estimatedRevenueUsd
                ? new Prisma.Decimal(result.estimatedRevenueUsd)
                : null,
              rawData: {
                topVideos: result.topVideos,
                ...(result.rawData ?? {}),
              } as Prisma.JsonObject,
              capturedAt: result.scrapedAt,
              hash,
            },
          });

          // Update Channel cached counters
          await tx.channel.update({
            where: { id: channel.id },
            data: {
              subscriberCount: BigInt(result.subscriberCount),
              totalViews: BigInt(result.totalViews),
              name: channel.name === channel.externalId ? channel.name : channel.name,
            },
          });

          await tx.scrapeJob.update({
            where: { id: job.jobId },
            data: { status: JobStatus.SUCCESS, finishedAt: new Date() },
          });
        });

        this.logger.log(
          `[Job ${job.jobId}] DONE — subs=${result.subscriberCount}, views=${result.totalViews}`,
        );
      } finally {
        await adapter.teardown(browserCtx).catch(() => undefined);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Job ${job.jobId}] FAILED: ${msg}`);
      await this.prisma.scrapeJob.update({
        where: { id: job.jobId },
        data: {
          status: JobStatus.FAILED,
          finishedAt: new Date(),
          errorMsg: msg.substring(0, 1000),
        },
      });
    }
  }
}
