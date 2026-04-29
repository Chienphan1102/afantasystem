import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { parseYouTubeChannelUrl } from '@afanta/adapters';
import { ChannelStatus, PlatformName } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  async createFromUrl(input: {
    userId: string;
    tenantId: string;
    platformAccountId: string;
    channelUrl: string;
  }) {
    const account = await this.prisma.platformAccount.findFirst({
      where: { id: input.platformAccountId, tenantId: input.tenantId, ownerUserId: input.userId },
    });
    if (!account) {
      throw new NotFoundException('PlatformAccount không tồn tại hoặc không thuộc user này');
    }
    if (account.platform !== PlatformName.YOUTUBE) {
      throw new BadRequestException('Phase 1 chỉ hỗ trợ YouTube channels');
    }

    const parsed = parseYouTubeChannelUrl(input.channelUrl);
    if (!parsed.externalId && !parsed.handle) {
      throw new BadRequestException(
        'URL không hợp lệ — chấp nhận youtube.com/channel/UC..., @handle, c/name, user/name',
      );
    }
    const externalId = parsed.externalId ?? parsed.handle ?? `yt-${Date.now()}`;

    // Idempotent: nếu đã có channel với externalId này cho account này, return existing
    const existing = await this.prisma.channel.findUnique({
      where: {
        platformAccountId_externalId: {
          platformAccountId: input.platformAccountId,
          externalId,
        },
      },
    });
    if (existing) return existing;

    const channel = await this.prisma.channel.create({
      data: {
        tenantId: input.tenantId,
        platformAccountId: input.platformAccountId,
        externalId,
        name: parsed.handle ?? externalId,
        url: input.channelUrl.replace(/\/$/, ''),
        status: ChannelStatus.ACTIVE,
      },
    });
    this.logger.log(`Created channel ${channel.id} (${externalId}) for account ${account.id}`);
    return channel;
  }

  // ─────────────────────────────────────────────────────────────
  async listForUser(userId: string, tenantId: string) {
    return this.prisma.channel.findMany({
      where: {
        tenantId,
        platformAccount: { ownerUserId: userId },
      },
      include: {
        platformAccount: { select: { id: true, platform: true, accountLabel: true, status: true } },
        insights: { orderBy: { capturedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByIdForUser(id: string, userId: string, tenantId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, tenantId, platformAccount: { ownerUserId: userId } },
      include: {
        platformAccount: { select: { id: true, platform: true, accountLabel: true, status: true } },
        insights: { orderBy: { capturedAt: 'desc' }, take: 30 },
      },
    });
    if (!channel) throw new NotFoundException('Channel không tồn tại');
    return channel;
  }

  async getLatestInsight(channelId: string, userId: string, tenantId: string) {
    await this.getByIdForUser(channelId, userId, tenantId);
    return this.prisma.channelInsight.findFirst({
      where: { channelId },
      orderBy: { capturedAt: 'desc' },
    });
  }

  async deleteForUser(id: string, userId: string, tenantId: string): Promise<void> {
    const channel = await this.prisma.channel.findFirst({
      where: { id, tenantId, platformAccount: { ownerUserId: userId } },
    });
    if (!channel) throw new NotFoundException('Channel không tồn tại');
    await this.prisma.channel.delete({ where: { id } });
    this.logger.log(`Deleted channel ${id}`);
  }
}
