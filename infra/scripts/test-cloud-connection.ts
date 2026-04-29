/**
 * AFANTA — Cloud Connection Test
 *
 * Kiểm tra Supabase REST API + Upstash Redis có connect được không.
 * Chạy: pnpm cloud:test
 *
 * Phase 1 Cloud-first: KHÔNG cần Docker. Chỉ cần Supabase + Upstash account.
 */

import 'dotenv/config';

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(line: string): void {
  // eslint-disable-next-line no-console
  console.log(line);
}

function require_env(key: string): string {
  const v = process.env[key];
  if (!v || v.length === 0) {
    throw new Error(`Missing env var: ${key}`);
  }
  return v;
}

async function testSupabase(): Promise<CheckResult> {
  try {
    const url = require_env('SUPABASE_URL');
    const anonKey = require_env('SUPABASE_ANON_KEY');
    // Auth health endpoint — Supabase yêu cầu apikey header.
    const healthRes = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: anonKey },
    });

    if (!healthRes.ok) {
      return {
        name: 'Supabase REST API',
        ok: false,
        detail: `Health endpoint trả HTTP ${healthRes.status} ${healthRes.statusText}`,
      };
    }

    const healthJson = (await healthRes.json()) as { name?: string; version?: string };
    if (healthJson.name !== 'GoTrue') {
      return {
        name: 'Supabase REST API',
        ok: false,
        detail: `Phản hồi không khớp dạng GoTrue: ${JSON.stringify(healthJson)}`,
      };
    }

    // Verify ANON_KEY có format JWT đúng (3 phần, decode được).
    const parts = anonKey.split('.');
    if (parts.length !== 3) {
      return {
        name: 'Supabase REST API',
        ok: false,
        detail: 'SUPABASE_ANON_KEY không phải JWT hợp lệ (cần 3 phần)',
      };
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8')) as {
      role?: string;
      ref?: string;
    };
    if (payload.role !== 'anon') {
      return {
        name: 'Supabase REST API',
        ok: false,
        detail: `ANON_KEY có role="${payload.role}", không phải "anon"`,
      };
    }

    return {
      name: 'Supabase REST API',
      ok: true,
      detail: `Project ref="${payload.ref}", GoTrue v${healthJson.version}`,
    };
  } catch (err) {
    return {
      name: 'Supabase REST API',
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function testUpstashRedis(): Promise<CheckResult> {
  try {
    const url = require_env('UPSTASH_REDIS_REST_URL');
    const token = require_env('UPSTASH_REDIS_REST_TOKEN');

    // Gọi /ping — endpoint health check của Upstash Redis REST.
    const res = await fetch(`${url}/ping`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return {
        name: 'Upstash Redis',
        ok: false,
        detail: `HTTP ${res.status} ${res.statusText}`,
      };
    }

    const json = (await res.json()) as { result?: string };
    const ok = json.result === 'PONG';
    return {
      name: 'Upstash Redis',
      ok,
      detail: ok ? `Phản hồi PONG từ ${url}` : `Phản hồi không phải PONG: ${JSON.stringify(json)}`,
    };
  } catch (err) {
    return {
      name: 'Upstash Redis',
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main(): Promise<void> {
  log('');
  log(`${ANSI.bold}${ANSI.cyan}━━━ AFANTA Cloud Connection Test ━━━${ANSI.reset}`);
  log('');

  const results = await Promise.all([testSupabase(), testUpstashRedis()]);

  for (const r of results) {
    const icon = r.ok ? `${ANSI.green}✓${ANSI.reset}` : `${ANSI.red}✗${ANSI.reset}`;
    const label = r.ok ? `${ANSI.green}OK${ANSI.reset}` : `${ANSI.red}FAIL${ANSI.reset}`;
    log(`  ${icon} ${ANSI.bold}${r.name}${ANSI.reset}: ${label}`);
    log(`     └─ ${r.detail}`);
  }

  log('');
  const allOk = results.every((r) => r.ok);
  if (allOk) {
    log(`${ANSI.green}${ANSI.bold}🎉 Tất cả cloud services đã sẵn sàng!${ANSI.reset}`);
    log(
      `${ANSI.yellow}Lưu ý:${ANSI.reset} DATABASE_URL chưa kết nối được vì password DB còn placeholder.`,
    );
    log('       Sẽ điền ở Prompt 3 khi bạn reset password Supabase.');
    log('');
    return;
  }
  log(`${ANSI.red}${ANSI.bold}❌ Có ít nhất 1 service lỗi. Kiểm tra .env.${ANSI.reset}`);
  process.exitCode = 1;
}

main().catch((err: unknown) => {
  log(`${ANSI.red}Lỗi không xác định:${ANSI.reset}`);
  log(String(err));
  process.exitCode = 1;
});
