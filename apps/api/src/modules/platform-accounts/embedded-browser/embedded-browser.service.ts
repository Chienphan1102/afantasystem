/**
 * AFANTA — Embedded Browser Service
 *
 * @security-critical
 * Phase 1 MVP: chạy ngay trong API process (worker chạy local).
 * Phase 2 sẽ tách sang `apps/worker-yt/src/login/embedded-browser.ts`
 * và giao tiếp qua BullMQ + Redis native protocol.
 *
 * NGUYÊN TẮC TUYỆT ĐỐI:
 *   1. Browser hiển thị (`headless: false`) — user TỰ NHẬP user/pass trên giao diện gốc Google
 *   2. KHÔNG inject script đọc password
 *   3. KHÔNG log session bundle / cookies plaintext
 *   4. Bundle chỉ tồn tại trong RAM của process này, được seal bằng @afanta/crypto trước khi lưu DB
 */

import { Injectable, Logger } from '@nestjs/common';
import { chromium, type BrowserContext, type Page } from 'playwright';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { SessionBundle } from '@afanta/crypto';

const HARVEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 phút cho user thao tác login

export type HarvestResult = {
  bundle: SessionBundle;
  channelExternalId: string;
  channelName: string;
  channelUrl: string;
  channelThumbnailUrl?: string;
};

@Injectable()
export class EmbeddedBrowserService {
  private readonly logger = new Logger(EmbeddedBrowserService.name);

  /**
   * @security-critical
   * Mở Chromium thật (visible) → user tự đăng nhập Google → harvest session bundle.
   * Returns sau khi đóng browser.
   */
  async harvestYouTubeSession(): Promise<HarvestResult> {
    const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'afanta-yt-'));
    this.logger.log(`Launching Chromium at ${userDataDir} (headless=false)`);

    const context: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      viewport: { width: 1280, height: 800 },
      locale: 'vi-VN',
      timezoneId: 'Asia/Ho_Chi_Minh',
      // Use Chrome stable channel (more believable than playwright's bundled chromium)
      // If not available, falls back to bundled
      channel: 'chrome',
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    try {
      const page = context.pages()[0] ?? (await context.newPage());

      // Navigate to Google sign-in with continue → YouTube
      await page.goto(
        'https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fwww.youtube.com%2F',
        { waitUntil: 'domcontentloaded', timeout: 30_000 },
      );

      this.logger.log('Waiting for user to complete Google login (≤5 min)...');

      // Wait for redirect to YouTube homepage (URL pattern indicates login OK)
      await page.waitForURL(/^https:\/\/(www\.)?youtube\.com\/?(\?.*)?$/, {
        timeout: HARVEST_TIMEOUT_MS,
      });

      // Wait for avatar button to ensure DOM is ready (extra safety)
      await page
        .waitForSelector(
          'button[aria-label*="account" i], button[aria-label*="tài khoản" i], #avatar-btn',
          { timeout: 30_000 },
        )
        .catch(() => undefined);

      this.logger.log('Login detected — harvesting session bundle...');

      // Channel info (try internal API for stability; fallback to DOM)
      const channelInfo = await this.extractChannelInfo(page);

      // Harvest cookies (all domains in this context)
      const cookies = await context.cookies();

      // Harvest localStorage + sessionStorage from the YouTube page
      await page.goto('https://www.youtube.com/', { waitUntil: 'domcontentloaded' });
      const storage = await page.evaluate(() => {
        const ls: Record<string, string> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) ls[k] = window.localStorage.getItem(k) ?? '';
        }
        const ss: Record<string, string> = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k) ss[k] = window.sessionStorage.getItem(k) ?? '';
        }
        return {
          localStorage: ls,
          sessionStorage: ss,
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          acceptLanguage: navigator.language,
        };
      });

      const bundle: SessionBundle = {
        cookies: cookies as unknown as SessionBundle['cookies'],
        localStorage: storage.localStorage,
        sessionStorage: storage.sessionStorage,
        userAgent: storage.userAgent,
        viewport: storage.viewport,
        timezone: storage.timezone,
        acceptLanguage: storage.acceptLanguage,
        fingerprintSeed: this.generateFingerprintSeed(storage.userAgent, storage.viewport),
      };

      this.logger.log(
        `Harvested ${cookies.length} cookies, ${Object.keys(storage.localStorage).length} ls keys`,
      );

      return {
        bundle,
        channelExternalId: channelInfo.externalId,
        channelName: channelInfo.name,
        channelUrl: channelInfo.url,
        channelThumbnailUrl: channelInfo.thumbnailUrl,
      };
    } finally {
      // Best-effort: keep browser open 2s so user sees "Logged in" then close
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await context.close().catch(() => undefined);
      // Cleanup user-data-dir
      await fs.rm(userDataDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  private async extractChannelInfo(page: Page): Promise<{
    externalId: string;
    name: string;
    url: string;
    thumbnailUrl?: string;
  }> {
    // Try to read from YouTube's hydrated initial data on /
    try {
      await page.goto('https://www.youtube.com/account', { waitUntil: 'domcontentloaded' });
      const info = await page.evaluate(() => {
        const ytData = (
          window as unknown as { ytInitialData?: { header?: unknown; metadata?: unknown } }
        ).ytInitialData;
        if (!ytData) return null;

        // The account page header includes the active channel
        const activeAccount = (
          ytData as unknown as {
            header?: {
              activeAccountHeaderRenderer?: {
                accountName?: { simpleText?: string };
                channelHandle?: { simpleText?: string };
                accountPhoto?: { thumbnails?: Array<{ url: string }> };
              };
            };
          }
        ).header?.activeAccountHeaderRenderer;

        if (activeAccount) {
          return {
            name: activeAccount.accountName?.simpleText ?? 'YouTube Channel',
            handle: activeAccount.channelHandle?.simpleText ?? '',
            thumbnailUrl: activeAccount.accountPhoto?.thumbnails?.[0]?.url,
          };
        }
        return null;
      });

      if (info) {
        return {
          externalId: info.handle ?? `yt-${Date.now()}`,
          name: info.name,
          url: info.handle ? `https://www.youtube.com/${info.handle}` : 'https://www.youtube.com/',
          thumbnailUrl: info.thumbnailUrl,
        };
      }
    } catch (err) {
      this.logger.warn(`Could not extract channel info from /account: ${String(err)}`);
    }

    // Fallback: just record a placeholder; user can rename later
    return {
      externalId: `yt-${Date.now()}`,
      name: 'YouTube Account',
      url: 'https://www.youtube.com/',
    };
  }

  private generateFingerprintSeed(userAgent: string, viewport: string): string {
    // Deterministic seed from UA + viewport — Phase 2 worker reuses to spoof same fingerprint
    let hash = 0;
    const input = `${userAgent}|${viewport}`;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) | 0;
    }
    return `fp_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
  }
}
