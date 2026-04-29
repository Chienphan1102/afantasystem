import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CurrentTenant,
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AddChannelDto } from './dto/add-channel.dto';
import { ChannelsService } from './channels.service';
import { ScrapeJobsService } from '../scrape-jobs/scrape-jobs.service';

class RescanDto {
  @ApiPropertyOptional({ description: 'Master password (cần để decrypt session)', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  masterPassword?: string;
}

@ApiTags('Channels')
@ApiBearerAuth()
@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly scrape: ScrapeJobsService,
  ) {}

  @Post()
  @RequirePermissions('channel:create')
  @ApiOperation({ summary: 'Bind 1 kênh YouTube vào PlatformAccount đã có' })
  async create(
    @Body() dto: AddChannelDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<unknown> {
    const channel = await this.channels.createFromUrl({
      userId: user.userId,
      tenantId,
      platformAccountId: dto.platformAccountId,
      channelUrl: dto.channelUrl,
    });

    // Auto-trigger first scrape if user supplied master password
    if (dto.masterPassword) {
      await this.scrape.enqueueRescan({
        channelId: channel.id,
        userId: user.userId,
        tenantId,
        masterPassword: dto.masterPassword,
      });
    }
    return channel;
  }

  @Get()
  @ApiOperation({ summary: 'Liệt kê channels của user hiện tại' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<unknown> {
    return this.channels.listForUser(user.userId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 channel + 30 insight gần nhất' })
  getDetail(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<unknown> {
    return this.channels.getByIdForUser(id, user.userId, tenantId);
  }

  @Get(':id/insights/latest')
  @ApiOperation({ summary: 'Insight mới nhất của channel' })
  getLatestInsight(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<unknown> {
    return this.channels.getLatestInsight(id, user.userId, tenantId);
  }

  @Get(':id/jobs')
  @ApiOperation({ summary: 'Lịch sử ScrapeJob của channel' })
  listJobs(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<unknown[]> {
    return this.scrape.listJobsForChannel(id, user.userId, tenantId);
  }

  @Post(':id/rescan')
  @RequirePermissions('channel:rescan:single')
  @ApiOperation({
    summary: 'Quét lại channel (priority HIGH) — yêu cầu master password',
  })
  rescan(
    @Param('id') id: string,
    @Body() dto: RescanDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<{ jobId: string }> {
    if (!dto.masterPassword) {
      throw new Error('masterPassword bắt buộc');
    }
    return this.scrape.enqueueRescan({
      channelId: id,
      userId: user.userId,
      tenantId,
      masterPassword: dto.masterPassword,
      priority: 'HIGH',
    });
  }

  @Delete(':id')
  @RequirePermissions('channel:delete')
  @ApiOperation({ summary: 'Xoá channel' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<{ deletedChannelId: string }> {
    await this.channels.deleteForUser(id, user.userId, tenantId);
    return { deletedChannelId: id };
  }
}
