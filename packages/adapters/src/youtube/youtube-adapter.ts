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

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
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
  TopVideoItem,
} from '../types';
import { parseYouTubeCount } from './parsers';

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
  async scrapeChannel(ctx: BrowserContext, channel: ChannelRef): Promise<ChannelInsightResult> {
    const channelUrl = this.buildChannelUrl(channel);
    const page = await ctx.newPage();
    try {
      this.logger.log(`[YT] Scraping ${channelUrl}`);

      // ── About page → subs + total views ──────────────────────
      await page.goto(`${channelUrl}/about`, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT_MS,
      });
      // YT loads about info in modal; alternatively we can read from initial data
      const aboutData = await this.extractAboutData(page);

      // ── Videos tab → top 10 recent videos ────────────────────
      await page.goto(`${channelUrl}/videos`, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT_MS,
      });
      // Wait for video grid (best effort)
      await page
        .waitForSelector('ytd-rich-item-renderer, ytd-grid-video-renderer', {
          timeout: 15_000,
        })
        .catch(() => undefined);

      // Small scroll to trigger lazy-load
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(2_000);

      const topVideos = await this.extractTopVideos(page);

      const result: ChannelInsightResult = {
        scrapedAt: new Date(),
        subscriberCount: aboutData.subscriberCount,
        totalViews: aboutData.totalViews,
        watchTimeMinutes: 0, // Phase 2: từ Studio Analytics
        topVideos,
        rawData: {
          channelHandle: aboutData.handle,
          channelDescription: aboutData.description,
          videoCountSeen: topVideos.length,
        },
      };

      this.logger.log(
        `[YT] Done: subs=${result.subscriberCount}, views=${result.totalViews}, top=${topVideos.length}`,
      );
      return result;
    } finally {
      await page.close().catch(() => undefined);
    }
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

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  private buildChannelUrl(channel: ChannelRef): string {
    if (channel.url) {
      // Strip trailing slash + any sub-path
      return channel.url.replace(/\/$/, '').replace(/\/(about|videos|community|playlists).*$/, '');
    }
    if (channel.externalId.startsWith('UC')) {
      return `https://www.youtube.com/channel/${channel.externalId}`;
    }
    if (channel.externalId.startsWith('@')) {
      return `https://www.youtube.com/${channel.externalId}`;
    }
    return `https://www.youtube.com/${channel.externalId}`;
  }

  private async extractAboutData(page: Page): Promise<{
    subscriberCount: number;
    totalViews: number;
    handle: string;
    description: string;
  }> {
    // Strategy 1: read from ytInitialData (most reliable when populated)
    const fromInitialData = await page.evaluate(() => {
      const w = window as unknown as { ytInitialData?: unknown };
      const data = w.ytInitialData as
        | {
            metadata?: {
              channelMetadataRenderer?: {
                title?: string;
                description?: string;
                vanityChannelUrl?: string;
                channelId?: string;
              };
            };
            header?: {
              c4TabbedHeaderRenderer?: {
                subscriberCountText?: { simpleText?: string };
                channelHandleText?: { runs?: Array<{ text?: string }> };
              };
              pageHeaderRenderer?: {
                content?: {
                  pageHeaderViewModel?: {
                    metadata?: {
                      contentMetadataViewModel?: {
                        metadataRows?: Array<{
                          metadataParts?: Array<{ text?: { content?: string } }>;
                        }>;
                      };
                    };
                  };
                };
              };
            };
            onResponseReceivedEndpoints?: unknown;
          }
        | undefined;

      if (!data) return null;
      const c4 = data.header?.c4TabbedHeaderRenderer;
      const pageHeader =
        data.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.metadata
          ?.contentMetadataViewModel?.metadataRows;

      let subsText = '';
      let viewsText = '';

      if (c4?.subscriberCountText?.simpleText) {
        subsText = c4.subscriberCountText.simpleText;
      }

      if (pageHeader) {
        for (const row of pageHeader) {
          for (const part of row.metadataParts ?? []) {
            const text = part.text?.content;
            if (!text) continue;
            if (/(subscriber|người đăng ký)/i.test(text)) subsText = text;
            if (/(view|lượt xem)/i.test(text)) viewsText = text;
          }
        }
      }

      return {
        subsText,
        viewsText,
        handle: c4?.channelHandleText?.runs?.[0]?.text ?? '',
        title: data.metadata?.channelMetadataRenderer?.title ?? '',
        description: data.metadata?.channelMetadataRenderer?.description ?? '',
      };
    });

    if (fromInitialData) {
      return {
        subscriberCount: parseYouTubeCount(fromInitialData.subsText),
        totalViews: parseYouTubeCount(fromInitialData.viewsText),
        handle: fromInitialData.handle,
        description: fromInitialData.description,
      };
    }

    return { subscriberCount: 0, totalViews: 0, handle: '', description: '' };
  }

  private async extractTopVideos(page: Page): Promise<TopVideoItem[]> {
    const items = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll('ytd-rich-item-renderer, ytd-grid-video-renderer'),
      ).slice(0, 10);

      return cards
        .map((card) => {
          const titleEl = card.querySelector(
            'a#video-title-link, a#video-title',
          ) as HTMLAnchorElement | null;
          const url = titleEl?.href ?? '';
          const title = titleEl?.title?.trim() ?? titleEl?.textContent?.trim() ?? '';
          const idMatch = url.match(/[?&]v=([\w-]{11})|\/shorts\/([\w-]{11})/);
          const externalId = (idMatch?.[1] ?? idMatch?.[2] ?? '').trim();

          const metaSpans = Array.from(card.querySelectorAll('#metadata-line span')).map(
            (s) => s.textContent?.trim() ?? '',
          );
          const viewsText = metaSpans.find((s) => /view|xem/i.test(s)) ?? '';
          const publishedAt = metaSpans.find((s) => /ago|trước|tháng|năm|tuần/i.test(s));

          const thumbEl = card.querySelector('img#img') as HTMLImageElement | null;

          return {
            externalId,
            title,
            url,
            thumbnailUrl: thumbEl?.src ?? undefined,
            viewsText,
            publishedAt,
          };
        })
        .filter((v) => v.externalId.length > 0);
    });

    // Parse views client-side
    return items.map((v) => ({
      externalId: v.externalId,
      title: v.title,
      url: v.url,
      thumbnailUrl: v.thumbnailUrl,
      views: parseYouTubeCount(v.viewsText),
      publishedAt: v.publishedAt,
    }));
  }
}
