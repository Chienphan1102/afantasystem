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

## ⚪ Prompt 3 — Database & Prisma Schema [ ]

> **Mục tiêu:** Có Prisma schema đủ cho Phase 1: User, Role, Permission, Tenant, Channel, Session, Insight, AuditLog.

- [ ] Cài `prisma` ở root, init schema
- [ ] Định nghĩa model: `User`, `Tenant`, `Role`, `Permission`
- [ ] Định nghĩa model: `Channel`, `Platform` (enum: YOUTUBE, FACEBOOK)
- [ ] Định nghĩa model: `EncryptedSession` (cho Envelope Encryption — chứa wrappedDek, encryptedBundle, iv, aad)
- [ ] Định nghĩa model: `ChannelSnapshot` (timestamp + metrics: subscribers, views, ...)
- [ ] Định nghĩa model: `AuditLog` (append-only, indexed theo userId/tenantId)
- [ ] Chạy `prisma migrate dev` tạo migration đầu tiên
- [ ] Tạo seed file: 1 Tenant mặc định + 1 Owner user
- [ ] Verify: `prisma studio` mở được, thấy data seed
- [ ] Cập nhật trạng thái, commit

---

## ⚪ Prompt 4 — Backend Core (NestJS + Auth + RBAC) [ ]

> **Mục tiêu:** API có thể đăng ký, login, JWT, kiểm RBAC. 2FA TOTP setup.

- [ ] Init NestJS app trong `apps/api/`
- [ ] Cài Passport + JWT + bcrypt + speakeasy (TOTP)
- [ ] Module `AuthModule`: register / login / refresh token / logout
- [ ] Module `UserModule`: CRUD user (cho Admin)
- [ ] Module `RbacModule`: Guard kiểm permission theo role (3 cấp Phase 1)
- [ ] Endpoint `/auth/2fa/enable` + `/auth/2fa/verify`
- [ ] Swagger docs tự sinh ở `/api/docs`
- [ ] Test endpoint qua Thunder Client / Postman
- [ ] Verify: register → login → gọi protected endpoint với JWT → trả 200
- [ ] Cập nhật trạng thái, commit

---

## ⚪ Prompt 5 — Crypto Module (Envelope Encryption) [ ]

> **Mục tiêu:** Package `@afanta/crypto` xử lý Argon2id KDF + AES-256-GCM + AES-KW. Test unit đầy đủ.

- [ ] Tạo package `packages/crypto/`
- [ ] Implement `deriveUDK(masterPassword, salt)` — Argon2id với param chuẩn
- [ ] Implement `generateDEK()` — random 256-bit
- [ ] Implement `encryptBundle(bundle, dek, aad)` — AES-256-GCM với IV random
- [ ] Implement `wrapDEK(dek, udk)` — AES-KW
- [ ] Implement bộ giải mã đối xứng: `decryptBundle`, `unwrapDEK`
- [ ] Test unit cho TỪNG hàm (Vitest), edge cases: tampered AAD, wrong key, replay
- [ ] Document API trong README package
- [ ] Verify: tất cả test pass, coverage ≥ 90%
- [ ] Cập nhật trạng thái, commit

---

## ⚪ Prompt 6 — Frontend Core (Vite + React + Tailwind + i18n + Theme) [ ]

> **Mục tiêu:** App React chạy được, có sidebar + topbar, login form, theme Light, i18n tiếng Việt.

- [ ] Init Vite + React + TS trong `apps/web/`
- [ ] Cấu hình TailwindCSS + shadcn/ui + import font
- [ ] Setup React Router 6 với layout: `AuthLayout` (login/register) + `AppLayout` (sidebar/topbar)
- [ ] Setup react-i18next với namespace `common.json` + `auth.json` (chỉ tiếng Việt Phase 1)
- [ ] Setup theme provider Light mode (Dark mode để Phase 2)
- [ ] Trang Login: form với React Hook Form + Zod, gọi API `/auth/login`
- [ ] Lưu JWT vào httpOnly cookie hoặc localStorage (sẽ thảo luận)
- [ ] TanStack Query setup với base URL từ env
- [ ] Verify: chạy `pnpm dev`, mở http://localhost:5173, login thành công, thấy AppLayout
- [ ] Cập nhật trạng thái, commit

---

## ⚪ Prompt 7 — Login Center (Add Account Flow) [ ]

> **Mục tiêu:** User bấm "Thêm kênh YouTube" → mở Embedded Browser → tự nhập user/pass trên giao diện gốc Google → harvest session bundle → mã hoá envelope → lưu DB.

- [ ] Quyết định runtime cho Embedded Browser:
  - Phương án A: Electron BrowserWindow (nếu user muốn desktop app)
  - Phương án B: Playwright UI mode chạy local + WebSocket bridge tới UI web
- [ ] Triển khai phương án đã chọn
- [ ] Implement harvesting: cookies + localStorage + sessionStorage + indexedDB + UA + viewport + timezone + fingerprint seed
- [ ] Yêu cầu user nhập Master Password lần đầu, derive UDK
- [ ] Mã hoá Session Bundle bằng `@afanta/crypto`, lưu DB
- [ ] UI: list account, status (active / checkpoint / expired)
- [ ] Verify: thêm 1 account YouTube test → bundle encrypted lưu DB → KHÔNG plaintext
- [ ] Cập nhật trạng thái, commit

---

## ⚪ Prompt 8 — YouTube Adapter + Worker [ ]

> **Mục tiêu:** Worker pickup job từ BullMQ, mở Playwright với session đã giải mã, scrape Subscribers + Views + top 10 video, push về DB.

- [ ] Tạo `apps/worker-yt/` skeleton
- [ ] Cài Playwright + playwright-extra + stealth plugin
- [ ] Implement `IPlatformAdapter` cho YouTube (Studio + youtubei/v1 internal API)
- [ ] BullMQ consumer: lắng job `channel.rescan`
- [ ] Worker giải mã session trong RAM, không log/disk
- [ ] Scrape: Subscribers, Total Views, Top 10 video gần nhất (title, views, like, comment)
- [ ] Push snapshot vào `ChannelSnapshot` với hash dedup
- [ ] Emit Socket.IO event `channel.rescan.done`
- [ ] Verify: enqueue job → worker pick up → DB có record mới trong < 90s
- [ ] Cập nhật trạng thái, commit

---

## ⚪ Prompt 9 — Dashboard MVP + End-to-end Demo [ ]

> **Mục tiêu:** Trang Dashboard hiển thị list kênh, click vô xem detail (số liệu + biểu đồ). Cron 6h/lần. Bấm "Quét lại" thủ công update realtime qua Socket.IO.

- [ ] Trang `/dashboard`: card overview (số kênh, tổng sub, tổng view)
- [ ] Trang `/channels`: list kênh + nút "Quét lại"
- [ ] Trang `/channels/:id`: line chart sub theo thời gian + table top 10 video
- [ ] WebSocket listener: khi nhận `channel.rescan.done` → invalidate query → reload data
- [ ] Cron job 6h/lần: enqueue rescan cho tất cả kênh active
- [ ] Empty state + skeleton loading + toast notification
- [ ] E2E test Playwright: register → login → add YT account → rescan → see data
- [ ] Demo cho user: ghi 1 video < 5 phút walkthrough toàn bộ flow
- [ ] Cập nhật trạng thái, commit, **đóng Phase 1** 🎉

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
