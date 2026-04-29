import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentTenant,
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: '4 con số tổng quan: kênh, subs, scans 24h, alerts' })
  stats(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<unknown> {
    return this.dashboard.getStats(user.userId, tenantId);
  }

  @Get('activity')
  @ApiOperation({ summary: '10 hoạt động scan gần nhất' })
  activity(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<unknown> {
    return this.dashboard.getRecentActivity(user.userId, tenantId);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Tổng subscribers theo ngày (30 ngày gần nhất)' })
  trend(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
    @Query('days') days?: string,
  ): Promise<unknown> {
    const d = days ? Math.min(90, Math.max(1, parseInt(days, 10))) : 30;
    return this.dashboard.getSubscribersTrend(user.userId, tenantId, d);
  }
}
