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
| **Prompt hiện tại**       | Prompt 9 — Dashboard + Demo ✅ DONE (PHASE 1 COMPLETE 🎉)                                                                                       |
| **Tình trạng Phase 1**    | 🎉 **HOÀN THÀNH 100%** — MVP working end-to-end, sẵn sàng Phase 2                                                                               |
| **% hoàn thành Phase 1**  | **100% ✅**                                                                                                                                     |
| **% hoàn thành cả dự án** | ~25% (Phase 2-4 còn ~9 tháng)                                                                                                                   |
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

## ✅ Prompt 6 — Frontend Core (Vite + React + Tailwind + i18n + Theme) (DONE)

**Đã làm:**

- Cài React 18 + Vite 8 + TypeScript trong `apps/web/` (manual setup, không dùng `pnpm create vite` để tránh đè skeleton)
- 30+ deps: react-router-dom, @tanstack/react-query, axios, zustand, react-hook-form, zod, react-i18next, recharts, lucide-react, sonner, class-variance-authority, tailwind-merge, 7 Radix UI primitives
- TailwindCSS v3.4 với CSS variables theme (light + dark) theo Master Plan G.2:
  - Light: bg `#FAFAFA` / fg `#0F172A` / accent `#2563EB`
  - Dark: bg `#0B1220` / fg `#E2E8F0` / accent `#3B82F6`
  - Smooth transition 200ms khi đổi mode
- Font Inter từ Google Fonts
- **8 shadcn-style UI components** (viết tay, không dùng `npx shadcn init`): Button, Input, Label, Card (+ Header/Title/Description/Content/Footer), Avatar, DropdownMenu, Separator, Skeleton
- **i18n VI/EN** với 3 namespaces (common, auth, dashboard) + browser language detector + lưu vào localStorage `afanta_lang`
- **ThemeProvider** Light/Dark/System với listener cho `prefers-color-scheme` (đổi OS theme tự reflect)
- **API client (axios)** với:
  - Request interceptor tự gắn `Bearer token` từ Zustand store
  - Response interceptor auto-refresh khi 401 + queue requests đang chờ refresh
  - Typed endpoints: `authApi.{login, logout, me}`, `tenantsApi.me`
- **Auth store** dùng Zustand + `persist` (localStorage) — `accessToken`, `refreshToken`, `user`
- **ProtectedRoute** redirect về `/login` nếu chưa auth
- **Layouts:**
  - `AuthLayout`: gradient blob background, center form
  - `AppLayout`: Sidebar 64 collapsible + Topbar (search disabled placeholder, language toggle, theme toggle với 3 mode, notification bell disabled, user avatar dropdown với logout)
  - **Mobile responsive**: < 768px sidebar thành drawer (hamburger menu)
- **Pages:**
  - `LoginPage`: form email + password + remember + Zod validation + react-hook-form + sonner toast cho lỗi/success
  - `DashboardPage`: 4 stat cards + Recharts LineChart placeholder + empty state Top channels
  - `PlaceholderPage` cho `/channels`, `/accounts`, `/reports`, `/settings`
  - `NotFoundPage` (404)
- **TanStack Query** đã setup `QueryClient` (staleTime 30s, retry 1)
- Build production thành công: 1.13s, gzip 345KB

**Verify đã pass:**

- ✓ `pnpm --filter @afanta/web typecheck` (zero errors)
- ✓ `pnpm --filter @afanta/web build` (Vite build OK, 1.13s)
- ✓ `pnpm --filter @afanta/web dev` chạy ở http://localhost:5174 (port 5173 đã bị service khác chiếm, Vite tự fallback)
- ✓ HTML response chứa đúng `<title>AFANTA — Omni-Channel Platform</title>` và `lang="vi"`
- ✓ API server chạy port 3001 + CORS allow `http://localhost:5174`
- ✓ `POST /api/auth/login` từ Origin `http://localhost:5174` trả accessToken (CORS OK)
- ✓ Root `pnpm typecheck` + `pnpm lint` + `pnpm format:check` pass

**Cách user verify (đầy đủ AC test):**

Mở **2 Git Bash** terminal trong thư mục dự án:

```bash
# Terminal 1: chạy API
pnpm --filter @afanta/api dev
# → http://localhost:3001 + Swagger /docs

# Terminal 2: chạy Frontend
pnpm --filter @afanta/web dev
# → http://localhost:5173 (hoặc 5174 nếu 5173 bị chiếm)
```

Trên trình duyệt:

1. Mở `http://localhost:5173` (hoặc 5174) → tự redirect về `/login`
2. Login với:
   - Email: `chienphan.jup@gmail.com`
   - Password: `ChangeMe123!`
3. Vào `/dashboard` → thấy sidebar (Tổng quan, Kênh, Tài khoản, Báo cáo, Cài đặt) + topbar
4. Bấm dropdown chữ "VI" trên topbar → chọn English → mọi text đổi sang EN
5. Bấm icon Sun/Moon/Monitor → chọn Dark → giao diện chuyển sang dark mode (mượt 200ms)
6. Resize trình duyệt < 768px → sidebar biến thành hamburger menu, bấm vào mở drawer từ trái
7. Bấm avatar góc phải → Đăng xuất → quay về `/login`, token bị clear
8. Refresh trang `/dashboard` khi đã logout → tự redirect về `/login`

---

## ✅ Prompt 7 — Login Center (Add Account Flow + Session Harvesting) (DONE)

**Đã làm:**

- Cài `playwright@1.59.1` + tải Chromium 1217 (~150MB) trong `apps/api`
- Link `@afanta/crypto` workspace package vào `apps/api` (`pnpm add @afanta/crypto@workspace:*`)
- Compile `@afanta/crypto` package, đổi `main`/`types` từ `src/index.ts` → `dist/index.js` (Node ESM resolver yêu cầu)
- Thêm 2 cột vào schema `PlatformAccount`: `salt Bytes` (Argon2 salt) + `tag Bytes` (AES-GCM auth tag) — migration `20260429135839_add_envelope_salt_tag`
- **Backend** `apps/api/src/modules/platform-accounts/`:
  - `EmbeddedBrowserService` — launch Chromium thật (`headless: false`) qua `chromium.launchPersistentContext`, navigate Google sign-in, đợi user login (timeout 5 phút), harvest cookies + localStorage + sessionStorage + UA + viewport + timezone + acceptLanguage + fingerprintSeed, extract channel info từ `ytInitialData`
  - `PlatformAccountsService` — orchestrator: harvest → seal qua `@afanta/crypto sealSession` (AAD `tenantId:userId:tempId:createdAt`) → lưu transaction PlatformAccount + Channel
  - `PlatformAccountsController` — 4 endpoints: POST add (gated `channel:create`), GET list, POST `:id/verify`, DELETE `:id` (gated `channel:delete`)
  - DTOs: `AddAccountDto` (platform + masterPassword + accountLabel), `VerifyAccountDto`
- **Frontend** `apps/web/src/`:
  - `useMasterPasswordStore` — Zustand IN-MEMORY only (KHÔNG persist), TTL 30 phút auto-clear
  - `MasterPasswordModal` — reusable modal nhập master password (Radix Dialog + cảnh báo Zero-Knowledge "quên = mất hết")
  - `AddAccountModal` — multi-step wizard: choose platform → label → master password → launching (5min loading) → done
  - `AccountsPage` — list cards với status badges (ACTIVE green, CHECKPOINT yellow, EXPIRED red), nút Verify + Delete, empty state với CTA
  - Wire `/accounts` route từ Placeholder → `AccountsPage` thật

**Phase 1 Trade-offs (đã ghi chú trong code):**

- Browser launch chạy ngay trong API process (worker chạy local) — Phase 2 sẽ tách ra apps/worker-yt + giao tiếp qua BullMQ
- Master password gửi qua REST API (TLS) — Phase 3 sẽ derive client-side bằng Web Crypto API
- Chỉ hỗ trợ YouTube — Facebook Page sẽ thêm ở Phase 1 cuối / Phase 2

**Verify đã pass:**

- ✓ `pnpm --filter @afanta/api build` (TypeScript compile OK với DOM lib trong tsconfig)
- ✓ `pnpm --filter @afanta/web build` (1.14s, gzip 360KB)
- ✓ `pnpm typecheck` + `pnpm lint` + `pnpm format:check` pass
- ✓ Server start: 14 endpoints (4 endpoints platform-accounts mới: POST/GET/POST verify/DELETE)
- ✓ `GET /api/platform-accounts` (with Bearer) → trả `[]` đúng (chưa có account nào)
- ✓ Swagger `/docs` show tag "Platform Accounts" với 4 endpoints

**Cách user verify đầy đủ AC test:**

```bash
# Terminal 1: API
pnpm --filter @afanta/api dev

# Terminal 2: Frontend
pnpm --filter @afanta/web dev
```

Trình duyệt:

1. Login với `chienphan.jup@gmail.com` / `ChangeMe123!`
2. Sidebar bấm **"Tài khoản đã login"** (`/accounts`) → empty state
3. Bấm **"+ Thêm tài khoản"** → chọn **YouTube**
4. Đặt nhãn (vd "Kênh test của tôi") → bấm Tiếp tục
5. Modal Master Password mở → nhập **mật khẩu master** mạnh (≥6 ký tự — Phase 1 dev) → bấm Xác nhận
6. **Cửa sổ Chrome thật mở** ở Google sign-in → bạn **tự nhập email Google + password thật + 2FA** trên giao diện gốc Google
7. Sau khi login thành công → URL chuyển về youtube.com → cửa sổ tự đóng sau 2s
8. Toast "Thêm tài khoản thành công" → modal đóng → list refresh hiện 1 row YouTube với status **ACTIVE**
9. Bấm **Verify** → modal master password popup (nếu hết TTL) hoặc verify ngay → toast "Session vẫn hợp lệ ✓"
10. Vào Supabase Table Editor → bảng `PlatformAccount` thấy 1 row với `encryptedBundle`, `wrappedDek`, `iv`, `tag`, `salt` đều là **binary không đọc được** → ✓ Zero-Knowledge OK

---

## ✅ Prompt 8 — YouTube Adapter + Worker (DONE)

**Đã làm:**

- **Package `@afanta/adapters` v0.1.0** — public API + IPlatformAdapter interface:
  - `types.ts`: `IPlatformAdapter` interface + types (PlatformName, ChannelRef, ChannelInsightResult, TopVideoItem, SessionStatus, CheckpointStatus, ProxyConfig, AdapterLogger)
  - `youtube/youtube-adapter.ts`: full implementation cho YouTube (5 methods: initContext, verifySession, detectCheckpoint, scrapeChannel, teardown)
  - `youtube/parsers.ts`: `parseYouTubeCount("1.2M") → 1200000`, `parseYouTubeChannelUrl()`
  - `youtube/selectors.ts`: DOM selectors tách riêng cho dễ update
- **API `apps/api/src/modules/`:**
  - `channels/` — POST bind URL, GET list, GET detail (30 insights), GET `/insights/latest`, POST `/rescan`, GET `/jobs`, DELETE
  - `scrape-jobs/` — `ScrapeJobsService` với in-memory queue (concurrency 2, priority HIGH/NORMAL/LOW), pipeline: unseal session → init context → verifySession → scrapeChannel → save ChannelInsight + update Channel cache + update ScrapeJob
- **Frontend `apps/web/src/`:**
  - `pages/channels-page.tsx` — list cards (avatar + subs + views + status + 3 actions), auto-refresh 10s, Add Channel modal
  - `pages/channel-detail-page.tsx` — header + 2 stat cards + LineChart subscribers history + table top videos
  - `components/add-channel-modal.tsx` — chọn account ACTIVE + paste URL + master password → bind + auto first scan

**Phase 1 Trade-offs (đã ghi rõ trong code + status):**

- **Skip BullMQ** vì Upstash REST không support — Phase 1 dùng in-memory queue trong API process
- **Skip cron 6h** vì Zero-Knowledge architecture cần master password (không có cách unattended) — Phase 2 sẽ dùng "scrape token" mechanism (tradeoff như 1Password Cloud)
- **Skip anti-detection plugins** (playwright-extra stealth) — Phase 2 sẽ thêm
- **Skip behavior simulation** (mouse jitter, scroll quán tính) — Phase 4
- **Worker chạy trong API process** — Phase 2 tách ra `apps/worker-yt` với BullMQ thật

**Verify đã pass:**

- ✓ `pnpm --filter @afanta/adapters build` — tsc OK
- ✓ `pnpm --filter @afanta/api build` — nest build OK
- ✓ `pnpm --filter @afanta/web build` — vite build 1.18s, gzip 363KB
- ✓ `pnpm typecheck` + `pnpm lint` + `pnpm format:check` pass
- ✓ Server: 19 endpoints (5 channels + scrape mới)
- ✓ `GET /api/channels` (with Bearer) → trả `[]`
- ✓ Swagger docs hiển thị tag "Channels" với 7 endpoints

**Cách user verify đầy đủ E2E (cuối Phase 1):**

```bash
# Terminal 1: API
pnpm --filter @afanta/api dev

# Terminal 2: Frontend
pnpm --filter @afanta/web dev
```

**Trên trình duyệt:**

1. Login + add YouTube account (Prompt 7 flow) — đảm bảo có 1 PlatformAccount status `ACTIVE`
2. Vào sidebar **Kênh** → bấm **+ Thêm kênh**
3. Chọn account vừa add → paste URL kênh YouTube của bạn (vd `https://www.youtube.com/@MrBeast`) → bấm **Bind + scan**
4. Master password modal popup (nếu hết TTL) → nhập mật khẩu master → Xác nhận
5. Background: API mở Chromium headless → load session bundle → navigate to channel /about + /videos → scrape
6. Sau 30-60s, list `/channels` tự refresh → kênh xuất hiện với **subscribers + total views thật**
7. Bấm **Chi tiết** → trang `/channels/:id` thấy 2 stat cards + line chart (sau 2+ scans) + table top 10 videos với thumbnail
8. Bấm **Quét lại** trên kênh → toast "Đã đưa vào hàng đợi" → 30-60s sau số liệu update
9. Vào Supabase Table Editor → bảng `ChannelInsight` thấy nhiều rows (mỗi lần scan 1 row), bảng `ScrapeJob` thấy status SUCCESS

---

## 🎉 Prompt 9 — Dashboard MVP + Demo (PHASE 1 COMPLETE)

**Đã làm:**

- **Backend `DashboardModule`** (3 endpoints aggregate stats):
  - `GET /api/dashboard/stats`: tổng kênh + tổng subscribers + scans 24h + unread alerts
  - `GET /api/dashboard/activity`: 10 scan jobs gần nhất với detail
  - `GET /api/dashboard/trend?days=30`: tổng subscribers theo ngày (latest snapshot per channel/day)
- **Frontend Dashboard refactor** (`pages/dashboard-page.tsx`):
  - 4 stat cards với data thật (Tổng kênh, Tổng followers, Quét 24h, Alert chưa đọc)
  - LineChart subscribers theo ngày (refetch 60s)
  - Card "Hoạt động gần đây" — list 10 jobs với link tới channel (refetch 10s)
- **Frontend Settings page** (`pages/settings-page.tsx`):
  - Tab Hồ sơ: email, fullName, role, tenantId (read-only Phase 1)
  - Tab Tuỳ chỉnh: language toggle (VI/EN) + theme toggle (Light/Dark/System)
  - Tab Bảo mật: button "Xoá master password khỏi RAM" + Phase 2 placeholder
  - Tab Team: placeholder Phase 2
- **Error Boundary** (`components/error-boundary.tsx`):
  - Wrap toàn app trong `main.tsx`
  - Fallback UI thân thiện với stack trace details (collapse) + reload button
- **Tài liệu cuối Phase 1:**
  - `USER_GUIDE.md` (250+ dòng): cài đặt, khởi động, hướng dẫn 9 bước E2E, troubleshooting, FAQ — TIẾNG VIỆT
  - `PHASE1_RETROSPECTIVE.md`: 6 win + 8 lesson + 15 trade-off documented + Phase 2 roadmap

**Trade-offs Phase 1 (đẩy Phase 2):**

- ❌ ~~WebSocket realtime~~ → TanStack Query refetchInterval 10s/30s đủ
- ❌ ~~Cron 6h auto-rescan~~ → Zero-Knowledge cần master password runtime; Phase 2 implement scrape token
- ❌ ~~Onboarding wizard 4 bước~~ → USER_GUIDE.md đủ
- ❌ ~~Notification center bell~~ → chưa có alerts data
- ❌ ~~2FA TOTP setup UI~~ → Phase 2
- ❌ ~~Settings Team/Billing tabs~~ → Phase 2/3
- ❌ ~~E2E test Playwright tự động~~ → Phase 2 (Phase 1 đã verify thủ công)

**Verify cuối Phase 1:**

- ✓ `pnpm --filter @afanta/api build` (nest build OK)
- ✓ `pnpm --filter @afanta/web build` (vite build 1.18s, gzip 366KB)
- ✓ `pnpm typecheck` + `pnpm lint` + `pnpm format:check` ALL PASS
- ✓ Server start: **22 endpoints** total (3 dashboard mới)
- ✓ `GET /api/dashboard/stats` (with Bearer) → trả `{totalChannels:0, totalSubscribers:"0", ...}`
- ✓ Swagger `/docs` hiển thị tag "Dashboard"

---

## 🏁 Phase 1 — TỔNG KẾT

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
