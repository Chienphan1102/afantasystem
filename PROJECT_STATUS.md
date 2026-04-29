# 📊 PROJECT_STATUS — AFANTA Omni-Channel Platform

> File này là "bảng đèn báo" của dự án. Bất kỳ ai (kể cả bạn 3 tháng sau) mở file này ra phải biết ngay: dự án đang ở đâu, sắp làm gì, đang vướng gì.
> **Nguyên tắc:** Cập nhật cuối mỗi Prompt. Không bỏ sót.

---

## 🪪 Thông tin cơ bản

| Trường               | Giá trị                                              |
| -------------------- | ---------------------------------------------------- |
| **Tên dự án**        | AFANTA Omni-Channel Platform                         |
| **Mã nội bộ**        | AFANTA v2                                            |
| **Ngày bắt đầu**     | 2026-04-29                                           |
| **Tài liệu gốc**     | [AFANTA_MASTER_PLAN_v2.md](AFANTA_MASTER_PLAN_v2.md) |
| **Người chỉ huy**    | Owner (vibe-coder, không biết code)                  |
| **AI thực thi**      | Claude Code (Senior Full-stack 30 năm)               |
| **Múi giờ làm việc** | Asia/Ho_Chi_Minh (sẽ xác nhận với user)              |

---

## 🚦 Trạng thái hiện tại

| Trường                    | Giá trị                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase hiện tại**        | Phase 1 — MVP Core (Tháng 1-3)                                                                                                                  |
| **Prompt hiện tại**       | Prompt 5 — Crypto Module ✅ DONE (sẵn sàng sang Prompt 6)                                                                                       |
| **Tình trạng Prompt 5**   | 🟢 Hoàn thành — 31/31 tests pass, coverage 100% statements/functions/lines, 90.47% branches                                                     |
| **% hoàn thành Phase 1**  | 55%                                                                                                                                             |
| **% hoàn thành cả dự án** | ~14%                                                                                                                                            |
| **Cảnh báo nóng**         | ⚠️ KHÔNG cài được Docker trên PC user → đã đổi sang **Cloud-first** (Supabase + Upstash). Vault tạm dùng `.env` Phase 1, phải nâng cấp Phase 3. |

---

## ✅ Câu trả lời từ user (Prompt 1)

| Q   | Câu hỏi      | Trả lời                                             |
| --- | ------------ | --------------------------------------------------- |
| Q1  | Domain       | **afantaAi.com**                                    |
| Q4  | Database     | **Supabase free tier** (Phương án 1 — Cloud)        |
| Q5  | GitHub repo  | Tạo mới tên **afantasystem** (chờ username)         |
| Q8  | Email Owner  | **bepbalieu.jup@gmail.com**                         |
| Q11 | Múi giờ      | **Asia/Ho_Chi_Minh**                                |
| Q19 | ToS Strategy | **(a) Hybrid** — Official API trước, scrape khi cần |
| —   | Docker       | **Không cài được trên PC** → cloud thay thế         |

### Đã nhận đủ từ user (cuối Prompt 1):

- [x] GitHub username: **Chienphan1102**
- [x] Supabase URL: **https://cjpywhzfjanenuchvyqf.supabase.co** (đã verify)
- [x] Supabase ANON_KEY + SERVICE_ROLE_KEY (paste trong chat, sẽ lưu `.env` ở Prompt 2)
- [x] Upstash REST_URL: https://master-shiner-109265.upstash.io
- [x] Upstash REST_TOKEN (paste trong chat, sẽ lưu `.env`)
- [x] Đã cài Git + Node.js + VS Code

### Lưu ý nợ kỹ thuật:

- 🔐 Keys đã paste trong chat → coi là **dev-only**, rotate trước Phase 3
- 🔐 Vault tạm = `.env` Phase 1 → upgrade HashiCorp Cloud Vault Phase 3
- 🐳 Không có Docker → workers chạy native trên PC. Phase 2 deploy phải có VPS Linux có Docker
- 🔑 DB password Supabase đã paste trong chat (cuối Prompt 2) → coi là **dev-only**, **rotate trước Phase 3**

---

## ✅ Prompt 2 — Setup hạ tầng dev (DONE)

**Đã làm:**

- Init pnpm monorepo workspaces (`pnpm-workspace.yaml`)
- Tạo skeleton folder: `apps/web`, `apps/api`, `apps/worker-yt`, `packages/{shared-types,crypto,adapters,proxy-manager}`, `prisma/`, `infra/scripts/`
- TypeScript strict (`tsconfig.base.json` + `tsconfig.json` với path aliases `@afanta/*`)
- ESLint v9 flat config + Prettier 3 + commitlint conventional + Husky pre-commit + commit-msg hooks
- `.gitignore`, `.prettierignore`, `.editorconfig`, `.nvmrc`, `.vscode/{settings,extensions}.json`
- `.env.example` (template) + `.env` (giá trị thật cloud, đã ignored)
- Script `pnpm cloud:test` verify Supabase + Upstash kết nối được (REST API)
- README.md hướng dẫn cho người không biết code (5 mục)
- Git init + main branch + first commit với Conventional Commits

**Verify đã pass:**

- ✓ `pnpm install` (276 packages, 5.6s)
- ✓ `pnpm typecheck` (TypeScript strict 0 errors)
- ✓ `pnpm format:check` (All matched files use Prettier code style)
- ✓ `pnpm lint` (ESLint 0 errors)
- ✓ `pnpm cloud:test`: Supabase REST OK, Upstash Redis PONG OK
- ✓ `git status`: `.env` đúng nằm trong gitignore, không bị track

---

## ✅ Prompt 3 — Database & Prisma Schema (DONE)

**Đã làm:**

- Cài Prisma 6.19.3 (downgrade từ v7 vì v7 bỏ cú pháp `url = env(...)` trong schema)
- Cài `@prisma/client`, `bcrypt`, `@types/bcrypt`
- Viết `prisma/schema.prisma` với **19 models** + **9 enums**:
  - 19 models: Tenant, User, Group, Team, GroupMember, Role, Permission, RolePermission, UserRole, PlatformAccount, Channel, ChannelAssignment, ScrapeJob, ChannelInsight, ProxyPool, ProxyAssignment, AuditLog, AlertRule, AlertEvent
  - 9 enums: PlatformName, RoleType, JobStatus, JobPriority, ProxyType, ProxyStatus, AccountStatus, ChannelStatus, AuditResult
- Cấu hình Supabase URLs (region `aws-1-ap-southeast-2` Sydney, KHÔNG phải Singapore):
  - DATABASE_URL: transaction pooler (port 6543) + `?pgbouncer=true`
  - DIRECT_URL: session pooler (port 5432) — dùng cho migrations
- Chạy `prisma migrate dev --name init` → tạo migration `20260429103508_init` lên Supabase
- Viết `prisma/seed.ts` (idempotent, dùng upsert):
  - 37 Permissions (theo Phần E.2 của MASTER_PLAN)
  - Tenant `Demo Media Co.` (slug `demo-media-co`)
  - 7 Roles hệ thống (Owner, SuperAdmin, GroupAdmin, TeamLead, User, Viewer, Custom)
  - 97 RolePermission rows (mapping Role↔Permission)
  - Group `Marketing Team`
  - Owner User `chienphan.jup@gmail.com` (password `ChangeMe123!`, mustChangePassword=true)
- Đăng ký script `prisma.seed: tsx prisma/seed.ts` trong root `package.json`

**Verify đã pass:**

- ✓ `pnpm exec prisma validate` (Schema valid)
- ✓ `pnpm exec prisma migrate dev` (1 migration applied)
- ✓ `pnpm prisma db seed` (Owner user, role, group đều OK)
- ✓ `pnpm exec tsx infra/scripts/verify-db.ts` đếm chính xác record
- ✓ `pnpm typecheck` + `pnpm lint` + `pnpm format:check` pass

**Cách user verify:**

1. Vào Supabase Dashboard → Table Editor → thấy 19 bảng
2. Bảng `Tenant` có 1 record "Demo Media Co."
3. Bảng `User` có 1 record `chienphan.jup@gmail.com`
4. Bảng `Permission` có 37 record
5. Hoặc chạy `pnpm exec prisma studio` (mở port 5555) để browse data trực quan

---

## ✅ Prompt 4 — Backend Core (NestJS + Auth + RBAC) (DONE)

**Đã làm:**

- Cài 30+ deps vào `apps/api` workspace (NestJS 11, Passport, JWT, Pino, Swagger, Upstash Redis client, ...)
- Cấu hình NestJS: `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`, scripts `dev`/`build`/`start`
- Tạo **common infrastructure**:
  - `PrismaModule` + `PrismaService` (global, OnModuleInit/Destroy)
  - `RedisModule` + `RedisService` (Upstash REST client, blacklist refresh tokens)
  - 5 decorators: `@Public`, `@CurrentUser`, `@CurrentTenant`, `@RequireRoles`, `@RequirePermissions`
  - 3 guards: `JwtAuthGuard` (global), `RolesGuard` (global), `PermissionsGuard` (global)
  - `AllExceptionsFilter` trả JSON chuẩn `{statusCode, error, message, traceId, path, timestamp}`
  - `TraceIdMiddleware` gắn UUID vào mỗi request + header `X-Trace-Id`
- **6 modules nghiệp vụ:**
  - `auth/`: POST `/api/auth/{login, register, refresh, logout}`, GET `/api/auth/me` (5 endpoints)
  - `tenants/`: GET `/api/tenants/me`, DELETE `/api/tenants/:id` (yêu cầu permission `tenant:delete`)
  - `users/`, `roles/`, `groups/`: GET list trong tenant
  - `health/`: GET `/health` (public, kiểm tra DB connectivity)
- **Bootstrap (`main.ts`):**
  - ValidationPipe global (whitelist + transform + forbidNonWhitelisted)
  - CORS (cho `CORS_ORIGIN` từ env)
  - API prefix `/api` (exclude `health` và `docs`)
  - Swagger UI ở `/docs` với Bearer auth
  - nestjs-pino logger (JSON prod, pretty dev) với traceId + userId in mỗi log
- **Đổi port API: 3000 → 3001** (vì máy user đã có service khác chạy port 3000)
- **JWT payload:** `{sub, tenantId, email, roles, permissions, type, jti, iat, exp}` — encode đầy đủ permissions để guard không cần query DB mỗi request
- **Refresh token blacklist** qua Upstash Redis với TTL = remaining lifetime

**Verify đã pass:**

- ✓ `pnpm --filter @afanta/api build` (TypeScript compile thành công)
- ✓ `pnpm typecheck` + `pnpm lint` + `pnpm format:check` pass
- ✓ Server start: connected DB, mapped 11 routes, listening port 3001
- ✓ `GET /health` → `{status: ok, database: ok, ...}`
- ✓ `POST /api/auth/login` với Owner → trả accessToken + refreshToken + 37 permissions
- ✓ `GET /api/auth/me` (with Bearer) → trả Owner info đầy đủ
- ✓ `GET /api/tenants/me` → trả "Demo Media Co."
- ✓ `GET /api/auth/me` (no token) → 401 Unauthorized
- ✓ `DELETE /api/tenants/{id}` với fake regular-user JWT → **403 Forbidden** với message "Missing permissions: tenant:delete" 🎯
- ✓ Swagger `/docs` render OK với 11 endpoints + Authorize button

**Cách user verify (làm trong Git Bash):**

1. `cd "d:/Media_hethong/AFANTA_System_v2"`
2. `pnpm --filter @afanta/api dev` — server chạy ở `http://localhost:3001`
3. Mở trình duyệt http://localhost:3001/docs → thấy Swagger UI
4. Click **POST /api/auth/login** → Try it out → body:
   ```json
   { "email": "chienphan.jup@gmail.com", "password": "ChangeMe123!" }
   ```
5. Copy `accessToken` trong response → bấm **Authorize** (góc phải) → paste với prefix `Bearer ` → Authorize
6. Test `GET /api/auth/me` và `GET /api/tenants/me` → đều trả OK
7. Health check không cần auth: http://localhost:3001/health

---

## ✅ Prompt 5 — Crypto Module (Envelope Encryption) (DONE)

**Đã làm:**

- Cài `argon2@0.44.0` (native binding, 64MB Argon2id) + `vitest@4.1.5` + `@vitest/coverage-v8`
- Package `@afanta/crypto` v0.1.0 — 6 source files:
  - `types.ts`: `SessionBundle`, `AadContext`, `EncryptedEnvelope`, `Argon2Params` + `DEFAULT_ARGON2_PARAMS` (memoryCost=64MB, timeCost=3, parallelism=4)
  - `argon2.ts`: `generateSalt()` (16 bytes), `deriveUDK()` raw output 32 bytes
  - `aes-gcm.ts`: `generateDEK()`, `generateIV()` (12 bytes), `encrypt()`, `decrypt()` AES-256-GCM với 16-byte tag
  - `aes-kw.ts`: `wrapKey()`, `unwrapKey()` RFC 3394 qua Node native `id-aes256-wrap`
  - `vault-client.ts`: `KEKProvider` interface + `EnvKekProvider` (Phase 1 dev, đọc `KEK_DEV` từ env, log cảnh báo đỏ; rotate intentionally throws)
  - `envelope.ts`: orchestrator `sealSession()` + `unsealSession()` với best-effort `wipe()` Buffer trong `finally`
- Mỗi function nhạy cảm có comment `@security-critical`
- AAD format: `${tenantId}:${userId}:${platformAccountId}:${createdAt}` — chống replay + cross-tenant attack
- 5 test files / **31 test cases** bao trọn yêu cầu Prompt:
  - **Test 1**: seal → unseal cùng password → bundle gốc ✓
  - **Test 2**: seal → unseal sai password → throw ✓
  - **Test 3**: tampered ciphertext (1 byte) → throw ✓
  - **Test 4**: AAD sai → throw ✓
  - **Test 5**: cùng password + cùng salt → cùng UDK ✓
  - **Test 6**: cùng password + khác salt → khác UDK ✓
  - **Test 7**: 100 lần encrypt cùng plaintext → 100 IV duy nhất ✓
  - - 24 edge case khác: short salt, wrong key length, AAD createdAt mismatch, tampered wrappedDek, version mismatch, EnvKekProvider validations, ...
- VIỆC 8 (tích hợp `PlatformAccountsService`) **đẩy sang Prompt 7** — Login Center sẽ là nơi `sealSession` được gọi lần đầu

**Verify đã pass:**

- ✓ `pnpm --filter @afanta/crypto test` → **5 test files / 31 tests pass / 278ms**
- ✓ Coverage v8: **Statements 100% / Functions 100% / Lines 100% / Branches 90.47%** (vượt threshold 90%)
- ✓ `pnpm typecheck` + `pnpm lint` + `pnpm format:check` pass
- ✓ Source code không log secret: chỉ 1 `console.warn` trong `vault-client.ts` cảnh báo dùng EnvKekProvider — KHÔNG lộ key

**Cách user verify:**

```bash
# Chạy tất cả tests crypto:
pnpm --filter @afanta/crypto test
# → "Test Files 5 passed (5)" và "Tests 31 passed (31)"

# Coverage:
pnpm --filter @afanta/crypto test:coverage
# → Statements 100% / Functions 100% / Lines 100% / Branches 90.47%
```

**🚨 Nguyên tắc bất biến (đặt từ Prompt 5):**

> **KHÔNG bao giờ sửa file trong `packages/crypto/` mà không có sự đồng ý rõ ràng của user.**
> Nếu cần sửa: BẮT BUỘC tăng version (`0.1.0` → `0.2.0`) + giữ backward-compat với envelope `version: 1` (decrypt được data legacy).

---

## 🎯 Mục tiêu Phase 1 — MVP (3 tháng)

App chạy được trên máy local, demo được cho khách đầu tiên với:

- ✅ Đăng ký + login + 2FA TOTP
- ✅ RBAC rút gọn 3 cấp (Admin / Manager / User)
- ✅ Module Crypto Envelope Encryption (Argon2id + AES-256-GCM + AES-KW)
- ✅ Login Center cho **YouTube + Facebook Page** (chỉ 2 nền tảng — KHÔNG đốt cháy giai đoạn)
- ✅ Worker quét cơ bản: subscribers, views, top 10 video
- ✅ Dashboard 1 trang, list kênh, click → detail
- ✅ Quét thủ công + Cron 6h/lần
- ✅ Tiếng Việt + Light mode (i18n EN + Dark mode đẩy sang Phase 2)

**Deliverable cuối Phase 1:** Web app chạy trên 1 server VPS, 5-10 user thử nghiệm.

---

## 🧱 Stack đã quyết (trích từ Phần I — MASTER_PLAN)

### Frontend

- **Framework:** React 18 + Vite
- **Language:** TypeScript 5+ (strict mode)
- **Styling:** TailwindCSS 3 + shadcn/ui
- **State:** Zustand (local) + TanStack Query (server cache)
- **Form:** React Hook Form + Zod
- **Chart:** Recharts (đơn giản) + Apache ECharts (heatmap, geo)
- **i18n:** react-i18next
- **Realtime:** Socket.IO Client
- **Router:** React Router 6
- **Test:** Vitest + Playwright (E2E)

### Backend / API

- **Framework:** NestJS 10 (Node.js)
- **Language:** TypeScript
- **ORM:** Prisma (ưu tiên — đã quen) hoặc Drizzle
- **Auth:** Passport.js + JWT + OAuth (Google/FB cho user nội bộ)
- **Validation:** class-validator + Zod
- **API Docs:** OpenAPI/Swagger
- **Realtime Server:** Socket.IO

### Worker / Crawler

- **Browser:** Playwright (stable hơn Puppeteer)
- **Stealth:** playwright-extra + stealth plugin
- **Queue Consumer:** BullMQ Worker
- **Sandboxing:** 1 Docker container = 1 worker
- **MTProto (Telegram):** gramjs

### Data Layer

- **RDBMS:** PostgreSQL 16 qua **Supabase free tier** (cloud, KHÔNG dùng Docker)
- **Cache & Queue:** Redis 7 qua **Upstash free tier** (cloud)
- **Object Storage:** Cloudflare R2 (Phase 2+)
- **Time-series (optional Phase 4):** TimescaleDB
- **Search:** Meilisearch (Phase 2+)
- **Vault:** **Tạm dùng `.env` (Phase 1)** ⚠️ → HashiCorp Cloud Vault (Phase 3)

### DevOps / Infra

- **Containerization:** Docker + Docker Compose (dev)
- **Orchestration:** Kubernetes (k3s startup, EKS/GKE khi scale)
- **CI/CD:** GitHub Actions
- **IaC:** Terraform + Ansible (Phase 3+)
- **Monitoring:** Prometheus + Grafana + Loki + Tempo
- **Error tracking:** Sentry
- **Backup:** Restic

### Bảo mật (cấp ngân hàng)

- **KDF:** Argon2id (memory=64MB, iterations=3, parallelism=4)
- **Symmetric:** AES-256-GCM (data) + AES-KW (key wrap)
- **2FA:** TOTP (Google Authenticator) + Hardware Key (YubiKey — Phase 3)
- **Architecture:** Zero-knowledge + Envelope Encryption (3 tầng)

---

## 📐 Kiến trúc tóm tắt — 7 lớp (Phần B.1)

```
LỚP 1: PRESENTATION    (React UI)
LỚP 2: EDGE/CDN        (Cloudflare)
LỚP 3: API GATEWAY     (NestJS)
LỚP 4: BUSINESS LOGIC  (Microservices nội bộ)
LỚP 5: MESSAGE QUEUE   (Redis + BullMQ)
LỚP 6: WORKER FARM     (Cluster Playwright)
LỚP 7: DATA & INFRA    (Postgres / Redis / R2 / Vault / Loki+Grafana)
```

Chi tiết folder: xem [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📅 Lịch trình Phase 1 (đề xuất, 8-12 tuần)

| Tuần  | Prompt  | Mục tiêu                               |
| ----- | ------- | -------------------------------------- |
| 1     | P1 + P2 | Onboarding + Setup hạ tầng dev         |
| 2     | P3      | Database & Prisma Schema               |
| 3-4   | P4      | Backend Core (Auth + RBAC)             |
| 5     | P5      | Crypto Module                          |
| 6     | P6      | Frontend Core (Vite + Tailwind + i18n) |
| 7     | P7      | Login Center (Add Account Flow)        |
| 8-10  | P8      | YouTube Adapter + Worker               |
| 11-12 | P9      | Dashboard MVP + End-to-end Demo        |

> Linh hoạt theo tốc độ vibe-coding; có thể giãn ra nếu cần.

---

## 📌 Ghi chú quan trọng

1. **Prompt 1 hôm nay KHÔNG code.** Chỉ đọc tài liệu, lập plan, hỏi user.
2. **Trước khi sang Prompt 2**, user phải trả lời các câu hỏi ở [QUESTIONS_FOR_USER.md](QUESTIONS_FOR_USER.md).
3. **Cuối mỗi Prompt**, phải commit Git với message Conventional Commits.
4. **Backup cuối ngày**: push lên GitHub (sẽ setup ở Prompt 2).

---

_Cập nhật lần cuối: 2026-04-29 (cuối Prompt 1 — Onboarding)_
