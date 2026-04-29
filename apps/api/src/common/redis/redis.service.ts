import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('UPSTASH_REDIS_REST_URL');
    const token = config.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN');
    this.client = new Redis({ url, token });
  }

  async setWithTtl(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, { ex: ttlSeconds });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get<string>(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const v = await this.client.get(`blacklist:refresh:${jti}`);
    return v !== null;
  }

  async blacklistRefreshToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.setWithTtl(`blacklist:refresh:${jti}`, '1', ttlSeconds);
    this.logger.log(`Refresh token blacklisted: ${jti.substring(0, 8)}... (ttl=${ttlSeconds}s)`);
  }
}
