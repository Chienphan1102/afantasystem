import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentTenant,
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin tenant của user hiện tại' })
  getMyTenant(@CurrentTenant() tenantId: string): Promise<unknown> {
    return this.tenants.findById(tenantId);
  }

  @Delete(':id')
  @RequirePermissions('tenant:delete')
  @ApiOperation({
    summary: 'Xoá tenant — chỉ Owner có permission "tenant:delete" mới làm được',
  })
  deleteTenant(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    // Sanity: chỉ cho phép xoá chính tenant của user (không cross-tenant)
    if (id !== user.tenantId) {
      return Promise.reject(new Error('Không thể xoá tenant khác'));
    }
    return this.tenants.deleteById(id);
  }
}
