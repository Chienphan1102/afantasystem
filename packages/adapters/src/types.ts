/**
 * AFANTA — Platform Adapter Types
 *
 * Reference: AFANTA_MASTER_PLAN_v2.md Phần D.3 (Adapter Pattern).
 */

import type { BrowserContext } from 'playwright';
import type { SessionBundle } from '@afanta/crypto';

/** Mirror Prisma's PlatformName enum (re-defined here to avoid circular dep). */
export type PlatformName =
  | 'YOUTUBE'
  | 'FACEBOOK_PAGE'
  | 'FACEBOOK_GROUP'
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'TIKTOK_SHOP'
  | 'TELEGRAM'
  | 'X_TWITTER'
  | 'LINKEDIN'
  | 'PINTEREST'
  | 'THREADS'
  | 'WHATSAPP_BUSINESS'
  | 'ZALO_OA'
  | 'SHOPEE'
  | 'LAZADA'
  | 'TIKI';

/** Channel reference passed to adapters when scraping. */
export type ChannelRef = {
  id: string;
  externalId: string;
  url: string | null;
  name: string;
};

/** Result of verifySession. */
export type SessionStatus =
  | { ok: true; verifiedAt: Date }
  | { ok: false; reason: 'EXPIRED' | 'CHECKPOINT' | 'INVALID' };

/** Result of detectCheckpoint. */
export type CheckpointStatus =
  | { detected: false }
  | { detected: true; detectedAt: Date; hint?: string };

/** Top video item — common across platforms. */
export type TopVideoItem = {
  externalId: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  views?: number;
  likes?: number;
  comments?: number;
  publishedAt?: string;
};

/** Channel-level scraped insight (cross-platform shape). */
export type ChannelInsightResult = {
  scrapedAt: Date;
  subscriberCount: number;
  totalViews: number;
  watchTimeMinutes?: number;
  estimatedRevenueUsd?: number;
  topVideos: TopVideoItem[];
  rawData?: Record<string, unknown>;
};

export type ProxyConfig = {
  server: string; // host:port
  username?: string;
  password?: string;
};

/**
 * Optional logger interface — adapter caller can inject pino/console.
 * Adapter should never log secrets (cookies, tokens).
 */
export type AdapterLogger = {
  log: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string, err?: unknown) => void;
};

/**
 * Common interface every platform adapter must implement.
 * Lifecycle: initContext → verifySession → (detectCheckpoint) → scrapeChannel → teardown.
 */
export interface IPlatformAdapter {
  readonly platform: PlatformName;

  initContext(session: SessionBundle, proxy?: ProxyConfig): Promise<BrowserContext>;
  verifySession(ctx: BrowserContext): Promise<SessionStatus>;
  detectCheckpoint(ctx: BrowserContext): Promise<CheckpointStatus>;
  scrapeChannel(ctx: BrowserContext, channel: ChannelRef): Promise<ChannelInsightResult>;
  teardown(ctx: BrowserContext): Promise<void>;
}
