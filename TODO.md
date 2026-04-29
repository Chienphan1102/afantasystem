# ✅ TODO — Phase 1 MVP (3 tháng)

> **Quy ước:**
>
> - `[ ]` = chưa làm
> - `[~]` = đang làm (in-progress)
> - `[x]` = đã xong
> - `[!]` = blocker / cần user trả lời / cần quyết định
>
> Mỗi Prompt = 1 commit Git. Cập nhật file này CUỐI MỖI PROMPT.

---

## 🟢 Prompt 1 — Onboarding (Tuần 1) [x] DONE

> **Quy tắc đặc biệt:** KHÔNG code, chỉ đọc & lập plan.

- [x] Đọc toàn bộ AFANTA_MASTER_PLAN_v2.md
- [x] Tạo file `PROJECT_STATUS.md`
- [x] Tạo file `TODO.md` (chính file này)
- [x] Tạo file `ARCHITECTURE.md` (cây thư mục chi tiết level 3)
- [x] Tạo file `QUESTIONS_FOR_USER.md`
- [x] Báo cáo Checkpoint cho user
- [x] User trả lời 6 câu BẮT BUỘC + setup Supabase/Upstash/GitHub
- [x] Đổi chiến lược **Cloud-first** (do PC không có Docker)
- [x] Sẵn sàng sang Prompt 2

---

## 🟢 Prompt 2 — Setup hạ tầng dev (Cloud-first) [x] DONE

> **Mục tiêu:** Tạo skeleton monorepo + Git + cloud test (đã đổi từ Docker sang Supabase/Upstash do PC user không có Docker).

- [x] Khởi tạo monorepo với pnpm workspaces (`pnpm-workspace.yaml`)
- [x] Tạo cấu trúc folder theo `ARCHITECTURE.md` (apps/, packages/, infra/, prisma/)
- [x] Cấu hình `tsconfig.base.json` (strict: true, paths alias `@afanta/*`)
- [x] Cấu hình ESLint v9 flat config + Prettier + commitlint + Husky pre-commit
- [x] Tạo `.gitignore` chuẩn (node_modules, .env, .claude, dist, …)
- [x] Khởi tạo Git repo + main branch
- [x] ~~`docker-compose.dev.yml`~~ → đổi thành `infra/scripts/test-cloud-connection.ts` (Supabase + Upstash)
- [x] Tạo `.env.example` + `.env` (giá trị thật cloud)
- [x] Verify: `pnpm install` + `pnpm typecheck` + `pnpm format:check` + `pnpm lint` + `pnpm cloud:test` PASS hết
- [x] Cập nhật `PROJECT_STATUS.md`, commit
- [ ] **CHỜ USER:** Tạo repo GitHub `Chienphan1102/afantasystem` + push (xem `PROJECT_STATUS.md` cuối Prompt 2)

---

## 🟢 Prompt 3 — Database & Prisma Schema [x] DONE

> **Mục tiêu:** Có Prisma schema enterprise đầy đủ, migrate xong, seed data mẫu.

- [x] Cài Prisma 6.19.3 + @prisma/client + bcrypt
- [x] Schema 19 models: Tenant, User, Group, Team, GroupMember, Role, Permission, RolePermission, UserRole, PlatformAccount, Channel, ChannelAssignment, ScrapeJob, ChannelInsight, ProxyPool, ProxyAssignment, AuditLog, AlertRule, AlertEvent
- [x] 9 enums: PlatformName, RoleType, JobStatus, JobPriority, ProxyType, ProxyStatus, AccountStatus, ChannelStatus, AuditResult
- [x] Cấu hình DATABASE_URL (transaction pooler 6543) + DIRECT_URL (session pooler 5432) cho Supabase region Sydney
- [x] `prisma migrate dev --name init` → migration `20260429103508_init` đã apply lên Supabase
- [x] Seed: 37 Permissions, 1 Tenant, 7 Roles (97 RolePermission), 1 Group, 1 Owner User
- [x] Script `prisma.seed: tsx prisma/seed.ts` trong package.json
- [x] Verify count records bằng `infra/scripts/verify-db.ts`
- [x] Cập nhật trạng thái, commit

---

## 🟢 Prompt 4 — Backend Core (NestJS + Auth + RBAC) [x] DONE

> **Mục tiêu:** API server chạy được, login/register/refresh hoạt động, JWT, RBAC guards.

- [x] NestJS 11 app trong `apps/api/` (bypass nest CLI scaffold, tạo manual)
- [x] Cài Passport + JWT + bcrypt + class-validator + nestjs-pino + Upstash Redis client
- [x] **AuthModule**: POST /login, /register, /refresh, /logout, GET /me — bcrypt + JWT access (1h) + refresh (7d)
- [x] **TenantsModule**: GET /me, DELETE /:id (yêu cầu `tenant:delete` permission)
- [x] **UsersModule, RolesModule, GroupsModule**: GET list trong tenant
- [x] **HealthModule**: GET /health (public, kiểm tra DB)
- [x] 3 Guards global: JwtAuthGuard (with @Public opt-out), RolesGuard, PermissionsGuard
- [x] 5 Decorators: @Public, @CurrentUser, @CurrentTenant, @RequireRoles, @RequirePermissions
- [x] AllExceptionsFilter (JSON chuẩn + traceId)
- [x] TraceIdMiddleware (UUID per request)
- [x] Refresh token blacklist qua Upstash Redis
- [x] Swagger docs ở `/docs` với Bearer auth
- [x] nestjs-pino logger (pretty dev, JSON prod, includes traceId + userId)
- [x] Đổi port API 3000 → 3001 (xung đột với service khác trên máy user)
- [x] ~~2FA TOTP~~ → để Prompt 5 hoặc Phase 2 (Master Plan đề cập 2FA TOTP nhưng Phase 1 không cần demo)
- [x] Verify cả AC test (login/me/tenants/me/403 fake user/swagger)
- [x] Cập nhật trạng thái, commit

---

## 🟢 Prompt 5 — Crypto Module (Envelope Encryption) [x] DONE

> **Mục tiêu:** Package `@afanta/crypto` xử lý Argon2id KDF + AES-256-GCM + AES-KW. Test đầy đủ.

- [x] Cài `argon2`, `vitest`, `@vitest/coverage-v8`
- [x] `packages/crypto/{tsconfig.json, vitest.config.ts}`
- [x] `argon2.ts`: `deriveUDK()`, `generateSalt()` — 64MB/3iter/4parallelism
- [x] `aes-gcm.ts`: `generateDEK()`, `encrypt()`, `decrypt()` — IV random 12 bytes, auth tag 16 bytes
- [x] `aes-kw.ts`: `wrapKey()`, `unwrapKey()` — RFC 3394 native Node
- [x] `vault-client.ts`: `KEKProvider` interface + `EnvKekProvider` (Phase 1 fallback)
- [x] `envelope.ts`: `sealSession()`, `unsealSession()` với AAD chống replay + best-effort buffer wipe
- [x] 5 test files / **31 tests** bao 7 test case bắt buộc + 24 edge case
- [x] Coverage **100% lines / 100% functions / 90.47% branches**
- [x] Document `@security-critical` ở mọi function nhạy cảm
- [x] VIỆC 8 (integrate vào API) đẩy sang Prompt 7 — Login Center
- [x] Cập nhật trạng thái, commit

---

## 🟢 Prompt 6 — Frontend Core (Vite + React + Tailwind + i18n + Theme) [x] DONE

> **Mục tiêu:** App React chạy được, layout đầy đủ, login → dashboard, i18n VI/EN, theme Light/Dark/System.

- [x] Vite 8 + React 18 + TypeScript strict trong `apps/web/`
- [x] TailwindCSS v3.4 + CSS variables theme (light + dark) theo G.2 Master Plan
- [x] 8 shadcn-style UI components viết tay: Button, Input, Label, Card, Avatar, DropdownMenu, Separator, Skeleton
- [x] React Router 7 + AuthLayout + AppLayout (Sidebar + Topbar + responsive drawer mobile)
- [x] react-i18next với 3 namespaces (common/auth/dashboard) — VI + EN
- [x] ThemeProvider Light/Dark/System với prefers-color-scheme listener
- [x] Login form với React Hook Form + Zod + sonner toast
- [x] API client axios + interceptors (auto-refresh trên 401)
- [x] Zustand auth store (persist localStorage)
- [x] ProtectedRoute redirect logic
- [x] TanStack Query setup
- [x] Dashboard placeholder: 4 stat cards + Recharts LineChart + empty state
- [x] 404 page
- [x] Build production OK: 1.13s, gzip 345KB
- [x] Verify: API + Web cùng chạy, login flow E2E, i18n toggle, theme switch, responsive
- [x] Cập nhật trạng thái, commit

---

## 🟢 Prompt 7 — Login Center (Add Account Flow) [x] DONE

> **Mục tiêu:** User bấm "Thêm tài khoản YouTube" → mở Chromium thật → user tự đăng nhập Google → harvest session → encrypt envelope → lưu DB.

- [x] Cài Playwright + Chromium binary
- [x] EmbeddedBrowserService chạy ngay trong API process (Phase 1 simplified — worker local)
- [x] Harvest cookies + localStorage + sessionStorage + UA + viewport + timezone + fingerprintSeed
- [x] Master password gửi qua REST API (TLS) — Phase 3 sẽ chuyển client-side
- [x] sealSession qua @afanta/crypto + lưu DB transaction (PlatformAccount + Channel)
- [x] Schema migration thêm `salt` và `tag` columns (Prompt 3 schema thiếu)
- [x] FE: AddAccountModal multi-step + MasterPasswordModal + Zustand store TTL 30 min
- [x] FE: AccountsPage với list cards + status badges + verify/delete actions
- [x] 4 API endpoints mới: POST `/platform-accounts`, GET, POST `/:id/verify`, DELETE `/:id`
- [x] Verify build + typecheck + lint + format pass
- [x] Cập nhật trạng thái, commit

---

## 🟢 Prompt 8 — YouTube Adapter + Worker [x] DONE

> **Mục tiêu:** Worker scrape Subscribers + Views + top 10 video, push về ChannelInsight.

- [x] Package `@afanta/adapters` với `IPlatformAdapter` + `YouTubeAdapter` + parsers + selectors
- [x] Module `channels/` trong API: bind URL, list, detail, latest insight, jobs, rescan, delete
- [x] Module `scrape-jobs/` trong API: in-memory queue concurrency 2, priority-aware
- [x] Pipeline: unseal session → init context → verify → scrape → save Insight + update Channel cache + ScrapeJob
- [x] Hash dedup `sha256(channelId:minute)` trên ChannelInsight
- [x] FE: trang `/channels` list cards + Add Channel modal + rescan + auto-refresh 10s
- [x] FE: trang `/channels/:id` detail với LineChart subscribers history + table top videos
- [x] ~~BullMQ~~ → in-memory queue (Upstash REST không support; Phase 2 chuyển)
- [x] ~~Cron 6h~~ → đẩy Phase 2 (Zero-Knowledge cần master password runtime)
- [x] ~~playwright-extra stealth~~ → đẩy Phase 2 (anti-detection level 1)
- [x] Verify build + typecheck + lint + format pass; 19 endpoints in Swagger
- [x] Cập nhật trạng thái, commit

---

## 🟢 Prompt 9 — Dashboard MVP + End-to-end Demo [x] DONE (PHASE 1 COMPLETE 🎉)

> **Mục tiêu:** Hoàn thiện Dashboard real data + Settings + USER_GUIDE + Retrospective.

- [x] Backend `DashboardModule`: 3 endpoints (stats, activity, trend)
- [x] FE `/dashboard`: refactor với 4 stat cards data thật + LineChart trend + Recent activity (auto refresh 10s)
- [x] FE `/channels` + `/channels/:id`: đã làm Prompt 8 (list cards + chart subs history + top videos)
- [x] FE `/settings`: Profile + Preferences + Security (clear master password) + Team placeholder
- [x] React Error Boundary + improve NotFoundPage (đã có)
- [x] Tài liệu user `USER_GUIDE.md` tiếng Việt — đầy đủ cài đặt, hướng dẫn từng bước, troubleshooting, FAQ
- [x] Retrospective `PHASE1_RETROSPECTIVE.md` — 6 win + 8 lesson + 15 trade-off
- [x] ~~WebSocket realtime~~ → đẩy Phase 2 (TanStack Query refetchInterval 10s đủ)
- [x] ~~Cron 6h auto-rescan~~ → đẩy Phase 2 (Zero-Knowledge cần master password runtime)
- [x] ~~Onboarding wizard~~ → USER_GUIDE.md đủ Phase 1
- [x] ~~Notification center~~ → đẩy Phase 2 (chưa có alerts data)
- [x] Verify build + typecheck + lint + format pass
- [x] Cập nhật trạng thái, commit FINAL, **đóng Phase 1** 🎉

---

## 🚪 Cổng kiểm tra (Acceptance Gate) cuối Phase 1

User phải làm được TẤT CẢ:

1. Mở app local → register tài khoản Owner
2. Login với 2FA
3. Bấm "Thêm kênh YouTube" → đăng nhập Google trên Embedded Browser → quay về Tools
4. Thấy kênh xuất hiện trong list
5. Bấm "Quét lại" → trong < 90s thấy số liệu Subs/Views/Top videos
6. Sau 6h, hệ thống tự quét lại — kiểm tra trong audit log

Nếu pass hết 6 bước → Phase 1 DONE → mới sang Phase 2.

---

_Cập nhật lần cuối: 2026-04-29 (cuối Prompt 1 — Onboarding)_
