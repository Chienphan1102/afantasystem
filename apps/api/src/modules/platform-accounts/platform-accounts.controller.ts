import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  CurrentTenant,
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AddAccountDto, PlatformAccountSummaryDto } from './dto/add-account.dto';
import { PlatformAccountsService } from './platform-accounts.service';

class VerifyAccountDto {
  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  masterPassword!: string;
}

@ApiTags('Platform Accounts')
@ApiBearerAuth()
@Controller('platform-accounts')
export class PlatformAccountsController {
  constructor(private readonly accounts: PlatformAccountsService) {}

  @Post()
  @RequirePermissions('channel:create')
  @ApiOperation({
    summary:
      'Thêm tài khoản nền tảng mới — mở Embedded Browser thật, user tự đăng nhập, hệ thống harvest session',
  })
  add(
    @Body() dto: AddAccountDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<PlatformAccountSummaryDto> {
    return this.accounts.addAccount(user.userId, tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liệt kê PlatformAccount của user hiện tại' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<PlatformAccountSummaryDto[]> {
    return this.accounts.listForUser(user.userId, tenantId);
  }

  @Post(':id/verify')
  @ApiOperation({
    summary: 'Verify session còn valid (decrypt thử với master password)',
  })
  verify(
    @Param('id') id: string,
    @Body() dto: VerifyAccountDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<{ ok: boolean; status: string }> {
    return this.accounts.verifyAccount(id, user.userId, tenantId, dto.masterPassword);
  }

  @Delete(':id')
  @RequirePermissions('channel:delete')
  @ApiOperation({ summary: 'Xoá PlatformAccount (Phase 1 không yêu cầu master password)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId: string,
  ): Promise<{ deletedAccountId: string }> {
    await this.accounts.deleteAccount(id, user.userId, tenantId);
    return { deletedAccountId: id };
  }
}
