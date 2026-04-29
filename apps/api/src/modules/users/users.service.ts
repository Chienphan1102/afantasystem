import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listInTenant(tenantId: string): Promise<
    Array<{
      id: string;
      email: string;
      fullName: string | null;
      isActive: boolean;
      lastLoginAt: Date | null;
      roles: string[];
    }>
  > {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      include: { userRoles: { include: { role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      roles: [...new Set(u.userRoles.map((ur) => ur.role.type as string))],
    }));
  }
}
