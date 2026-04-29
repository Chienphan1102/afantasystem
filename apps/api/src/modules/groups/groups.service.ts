import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async listInTenant(tenantId: string): Promise<
    Array<{
      id: string;
      name: string;
      description: string | null;
      memberCount: number;
    }>
  > {
    const groups = await this.prisma.group.findMany({
      where: { tenantId },
      include: { _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    });
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      memberCount: g._count.members,
    }));
  }
}
