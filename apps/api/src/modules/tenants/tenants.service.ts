import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<{
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    logoUrl: string | null;
    createdAt: Date;
  }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} không tồn tại`);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      logoUrl: tenant.logoUrl,
      createdAt: tenant.createdAt,
    };
  }

  async deleteById(id: string): Promise<{ deletedTenantId: string }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} không tồn tại`);
    await this.prisma.tenant.delete({ where: { id } });
    return { deletedTenantId: id };
  }
}
