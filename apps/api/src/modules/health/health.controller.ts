import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check (liveness + database connectivity)' })
  async check(): Promise<{
    status: 'ok' | 'degraded';
    uptimeSeconds: number;
    database: 'ok' | 'fail';
    timestamp: string;
  }> {
    let database: 'ok' | 'fail' = 'fail';
    try {
      await this.prisma.$queryRawUnsafe<Array<{ now: Date }>>('SELECT now()');
      database = 'ok';
    } catch {
      database = 'fail';
    }
    return {
      status: database === 'ok' ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
