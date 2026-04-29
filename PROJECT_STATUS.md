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
| **Prompt hiện tại**       | Prompt 2 — Setup hạ tầng dev ✅ DONE (sẵn sàng sang Prompt 3)                                                                                   |
| **Tình trạng Prompt 2**   | 🟢 Hoàn thành — monorepo + Git + cloud test pass                                                                                                |
| **% hoàn thành Phase 1**  | 22%                                                                                                                                             |
| **% hoàn thành cả dự án** | ~6%                                                                                                                                             |
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
- 🔑 DB password Supabase chưa có → DATABASE_URL trong `.env` còn placeholder, sẽ điền ở Prompt 3

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
