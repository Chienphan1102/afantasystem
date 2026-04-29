/**
 * AFANTA — YouTube Adapter
 *
 * Phase 1 MVP scope:
 *   - Load context với session đã decrypt từ envelope
 *   - Verify session bằng cách check user avatar / signed-in state
 *   - Scrape subscriber count, total views (từ /about page)
 *   - Top 10 videos gần nhất (/videos tab)
 *
 * Phase 2 sẽ mở rộng:
 *   - Studio Analytics (watch time, RPM, audience demographics)
 *   - Per-video retention curve
 *   - Anti-detection cấp độ 2 (mouse jitter, scroll quán tính)
 */

import { chromium, type Browser, type BrowserContext } from 'playwright';
import type { SessionBundle } from '@afanta/crypto';
import type {
  AdapterLogger,
  ChannelInsightResult,
  ChannelRef,
  CheckpointStatus,
  IPlatformAdapter,
  PlatformName,
  ProxyConfig,
  SessionStatus,
} from '../types';

const NOOP_LOGGER: AdapterLogger = {
  log: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

const NAV_TIMEOUT_MS = 30_000;

type ContextHandle = {
  browser: Browser;
  context: BrowserContext;
};

const HANDLES = new WeakMap<BrowserContext, ContextHandle>();

export class YouTubeAdapter implements IPlatformAdapter {
  readonly platform: PlatformName = 'YOUTUBE';

  constructor(private readonly logger: AdapterLogger = NOOP_LOGGER) {}

  // ─────────────────────────────────────────────────────────────
  async initContext(session: SessionBundle, proxy?: ProxyConfig): Promise<BrowserContext> {
    this.logger.log(`[YT] Launching headless context (proxy=${proxy?.server ?? 'none'})`);
    const browser = await chromium.launch({
      headless: true,
      proxy: proxy
        ? { server: proxy.server, username: proxy.username, password: proxy.password }
        : undefined,
    });

    // Build viewport from session
    const viewportMatch = /^(\d+)x(\d+)$/.exec(session.viewport);
    const viewport = viewportMatch
      ? { width: parseInt(viewportMatch[1], 10), height: parseInt(viewportMatch[2], 10) }
      : { width: 1280, height: 800 };

    const context = await browser.newContext({
      userAgent: session.userAgent,
      viewport,
      timezoneId: session.timezone,
      locale: session.acceptLanguage.split(',')[0] ?? 'vi-VN',
    });

    // Restore cookies
    const cookies = session.cookies as Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'Strict' | 'Lax' | 'None';
    }>;
    if (cookies.length > 0) {
      // Playwright cookies type — cast through unknown to avoid wrestling with its strict signature
      await context.addCookies(cookies as unknown as Parameters<BrowserContext['addCookies']>[0]);
    }

    // Restore localStorage by visiting youtube origin and injecting
    if (Object.keys(session.localStorage).length > 0) {
      const initPage = await context.newPage();
      try {
        await initPage.goto('https://www.youtube.com/', {
          waitUntil: 'domcontentloaded',
          timeout: NAV_TIMEOUT_MS,
        });
        await initPage.evaluate((entries: [string, string][]) => {
          for (const [k, v] of entries) {
            try {
              window.localStorage.setItem(k, v);
            } catch {
              /* ignored — quota exceeded etc. */
            }
          }
        }, Object.entries(session.localStorage));
      } finally {
        await initPage.close().catch(() => undefined);
      }
    }

    HANDLES.set(context, { browser, context });
    return context;
  }

  // ─────────────────────────────────────────────────────────────
  async verifySession(ctx: BrowserContext): Promise<SessionStatus> {
    const page = await ctx.newPage();
    try {
      await page.goto('https://www.youtube.com/', {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT_MS,
      });

      // Heuristic: if logged in, the page exposes avatar button
      const signedIn = await page.evaluate(() => {
        const w = window as unknown as {
          ytcfg?: { data_?: { LOGGED_IN?: boolean; LOGGED_IN_BOOL?: boolean } };
        };
        if (w.ytcfg?.data_?.LOGGED_IN === true || w.ytcfg?.data_?.LOGGED_IN_BOOL === true) {
          return true;
        }
        const avatar = document.querySelector('button#avatar-btn, ytd-topbar-menu-button-renderer');
        return Boolean(avatar);
      });

      if (signedIn) {
        return { ok: true, verifiedAt: new Date() };
      }

      // Check checkpoint
      const checkpoint = await this.detectCheckpoint(ctx);
      if (checkpoint.detected) return { ok: false, reason: 'CHECKPOINT' };

      return { ok: false, reason: 'EXPIRED' };
    } catch (err) {
      this.logger.error('[YT] verifySession failed', err);
      return { ok: false, reason: 'INVALID' };
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  // ─────────────────────────────────────────────────────────────
  async detectCheckpoint(ctx: BrowserContext): Promise<CheckpointStatus> {
    const url = ctx.pages()[0]?.url() ?? '';
    if (
      /\/(checkpoint|verify|signin\/identifier|identifier\/challenge)/i.test(url) ||
      /accounts\.google\.com\/(signin|v3\/signin)/i.test(url)
    ) {
      return { detected: true, detectedAt: new Date(), hint: 'URL pattern matched challenge' };
    }
    return { detected: false };
  }

  // ─────────────────────────────────────────────────────────────
  // Phase 1.1: scrape via YouTube Data API v3 (Q19=a Hybrid).
  // The browser context is kept by the caller for verifySession only;
  // public metrics (subs/views/videos) come from the official API
  // because YouTube's headless DOM scrape was unreliable on modern UI.
  // BrowserContext intentionally unused here.
  async scrapeChannel(_ctx: BrowserContext, channel: ChannelRef): Promise<ChannelInsightResult> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error(
        'YOUTUBE_API_KEY missing in env. Get one at https://console.cloud.google.com — enable YouTube Data API v3, create API key, paste into .env',
      );
    }

    this.logger.log(`[YT] Scraping via API for ${channel.url ?? channel.externalId}`);

    // ── Step 1: resolve channelId (UCxxxx) ──────────────────────
    const channelId = await this.resolveChannelId(channel, apiKey);
    if (!channelId) {
      throw new Error(`Could not resolve channelId for ${channel.url ?? channel.externalId}`);
    }

    // ── Step 2: fetch channel statistics + snippet ──────────────
    const channelData = await this.ytApi<{
      items?: Array<{
        id: string;
        snippet: {
          title: string;
          customUrl?: string;
          description?: string;
          thumbnails?: { default?: { url: string }; high?: { url: string } };
        };
        statistics: {
          viewCount: string;
          subscriberCount: string;
          videoCount: string;
        };
      }>;
    }>(
      `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=statistics,snippet&key=${apiKey}`,
    );

    const channelItem = channelData.items?.[0];
    if (!channelItem) {
      throw new Error(`Channel ${channelId} not found via API`);
    }

    const subs = parseInt(channelItem.statistics.subscriberCount ?? '0', 10);
    const views = parseInt(channelItem.statistics.viewCount ?? '0', 10);
    const videoCount = parseInt(channelItem.statistics.videoCount ?? '0', 10);

    // ── Step 3: latest 10 videos ────────────────────────────────
    const searchData = await this.ytApi<{
      items?: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          publishedAt: string;
          thumbnails?: { medium?: { url: string }; high?: { url: string } };
        };
      }>;
    }>(
      `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&order=date&maxResults=10&type=video&part=snippet&key=${apiKey}`,
    );

    const videoIds = (searchData.items ?? []).map((i) => i.id.videoId).filter(Boolean);

    let topVideos: ChannelInsightResult['topVideos'] = [];
    if (videoIds.length > 0) {
      const videosData = await this.ytApi<{
        items?: Array<{
          id: string;
          snippet: {
            title: string;
            publishedAt: string;
            thumbnails?: { medium?: { url: string }; high?: { url: string } };
          };
          statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
        }>;
      }>(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoIds.join(',')}&part=snippet,statistics&key=${apiKey}`,
      );

      topVideos = (videosData.items ?? []).map((v) => ({
        externalId: v.id,
        title: v.snippet.title,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        thumbnailUrl: v.snippet.thumbnails?.medium?.url ?? v.snippet.thumbnails?.high?.url,
        views: v.statistics?.viewCount ? parseInt(v.statistics.viewCount, 10) : undefined,
        likes: v.statistics?.likeCount ? parseInt(v.statistics.likeCount, 10) : undefined,
        comments: v.statistics?.commentCount ? parseInt(v.statistics.commentCount, 10) : undefined,
        publishedAt: v.snippet.publishedAt,
      }));
    }

    const result: ChannelInsightResult = {
      scrapedAt: new Date(),
      subscriberCount: subs,
      totalViews: views,
      watchTimeMinutes: 0, // Phase 2: requires OAuth + YouTube Analytics API
      topVideos,
      rawData: {
        channelTitle: channelItem.snippet.title,
        channelHandle: channelItem.snippet.customUrl ?? '',
        channelDescription: channelItem.snippet.description ?? '',
        thumbnailUrl:
          channelItem.snippet.thumbnails?.high?.url ??
          channelItem.snippet.thumbnails?.default?.url ??
          null,
        videoCountTotal: videoCount,
      },
    };

    this.logger.log(
      `[YT] Done: subs=${result.subscriberCount.toLocaleString()}, views=${result.totalViews.toLocaleString()}, top=${topVideos.length}`,
    );
    return result;
  }

  // ─────────────────────────────────────────────────────────────
  private async ytApi<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`YouTube API ${res.status}: ${body.substring(0, 200)}`);
    }
    return (await res.json()) as T;
  }

  private async resolveChannelId(channel: ChannelRef, apiKey: string): Promise<string | null> {
    // Already a UC-prefixed channel ID
    if (/^UC[\w-]{20,}$/.test(channel.externalId)) {
      return channel.externalId;
    }

    // Try as @handle via forHandle param (works for /@handle URLs)
    if (channel.externalId.startsWith('@')) {
      const data = await this.ytApi<{ items?: Array<{ id: string }> }>(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(channel.externalId)}&key=${apiKey}`,
      );
      if (data.items?.[0]?.id) return data.items[0].id;
    }

    // Try as legacy username
    const data = await this.ytApi<{ items?: Array<{ id: string }> }>(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${encodeURIComponent(channel.externalId.replace(/^@/, ''))}&key=${apiKey}`,
    );
    if (data.items?.[0]?.id) return data.items[0].id;

    return null;
  }

  // ─────────────────────────────────────────────────────────────
  async teardown(ctx: BrowserContext): Promise<void> {
    const handle = HANDLES.get(ctx);
    HANDLES.delete(ctx);
    await ctx.close().catch(() => undefined);
    if (handle) {
      await handle.browser.close().catch(() => undefined);
    }
  }

  // Phase 1.0 DOM-scrape helpers (extractAboutData, extractTopVideos,
  // buildChannelUrl) removed in Phase 1.1 — replaced by YouTube Data API.
  // If we ever need a non-API fallback in Phase 2, restore from git history
  // commit b660bb9.
}
