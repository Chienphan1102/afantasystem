import { Injectable } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export type DashboardStats = {
  totalChannels: number;
  totalSubscribers: string; // BigInt → string for JSON
  scansLast24h: number;
  unreadAlerts: number;
};

export type RecentActivity = {
  id: string;
  type: 'scrape_success' | 'scrape_failed';
  channelId: string;
  channelName: string;
  occurredAt: Date;
  detail: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string, tenantId: string): Promise<DashboardStats> {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalChannels, channelAggregate, scansLast24h, unreadAlerts] = await Promise.all([
      this.prisma.channel.count({
        where: { tenantId, platformAccount: { ownerUserId: userId } },
      }),
      this.prisma.channel.aggregate({
        where: { tenantId, platformAccount: { ownerUserId: userId } },
        _sum: { subscriberCount: true },
      }),
      this.prisma.scrapeJob.count({
        where: {
          channel: { tenantId, platformAccount: { ownerUserId: userId } },
          status: JobStatus.SUCCESS,
          createdAt: { gte: since24h },
        },
      }),
      // Phase 1 chưa có alert system → return 0
      Promise.resolve(0),
    ]);

    const totalSubs = channelAggregate._sum.subscriberCount ?? BigInt(0);

    return {
      totalChannels,
      totalSubscribers: totalSubs.toString(),
      scansLast24h,
      unreadAlerts,
    };
  }

  async getRecentActivity(userId: string, tenantId: string, limit = 10): Promise<RecentActivity[]> {
    const jobs = await this.prisma.scrapeJob.findMany({
      where: {
        channel: { tenantId, platformAccount: { ownerUserId: userId } },
        status: { in: [JobStatus.SUCCESS, JobStatus.FAILED] },
      },
      include: { channel: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return jobs.map((j) => ({
      id: j.id,
      type: j.status === JobStatus.SUCCESS ? 'scrape_success' : 'scrape_failed',
      channelId: j.channelId,
      channelName: j.channel.name,
      occurredAt: j.finishedAt ?? j.createdAt,
      detail:
        j.status === JobStatus.SUCCESS
          ? `Scan thành công`
          : (j.errorMsg ?? 'Scan thất bại').substring(0, 200),
    }));
  }

  async getSubscribersTrend(
    userId: string,
    tenantId: string,
    days = 30,
  ): Promise<Array<{ day: string; subscribers: string }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const insights = await this.prisma.channelInsight.findMany({
      where: {
        capturedAt: { gte: since },
        channel: { tenantId, platformAccount: { ownerUserId: userId } },
      },
      select: { capturedAt: true, subscriberCount: true, channelId: true },
      orderBy: { capturedAt: 'asc' },
    });

    // Group by day, latest snapshot per channel per day, then sum
    const perDayPerChannel = new Map<string, Map<string, bigint>>();
    for (const ins of insights) {
      const day = ins.capturedAt.toISOString().slice(0, 10);
      let dayMap = perDayPerChannel.get(day);
      if (!dayMap) {
        dayMap = new Map();
        perDayPerChannel.set(day, dayMap);
      }
      // Last write wins per channel-day (records are ASC)
      dayMap.set(ins.channelId, ins.subscriberCount);
    }

    const result: Array<{ day: string; subscribers: string }> = [];
    for (const [day, dayMap] of [...perDayPerChannel.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      let sum = BigInt(0);
      for (const v of dayMap.values()) sum += v;
      result.push({ day, subscribers: sum.toString() });
    }
    return result;
  }
}
