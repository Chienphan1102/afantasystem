# 🏗️ ARCHITECTURE — Cấu trúc Monorepo AFANTA

> Tài liệu này mở rộng phần **J.5** của [AFANTA_MASTER_PLAN_v2.md](AFANTA_MASTER_PLAN_v2.md), vẽ chi tiết cây thư mục tới level 3 cho toàn bộ dự án.
> **Triết lý:** Một **monorepo** (nhiều app + nhiều package dùng chung) với **pnpm workspaces** — chuẩn industry hiện đại (Vercel, Linear, Cal.com đều dùng).

---

## 📐 Vì sao monorepo?

1. **Type-safe end-to-end:** API định nghĩa DTO → Frontend dùng cùng type → đổi field một lần, cả 2 nơi cùng update.
2. **Tái sử dụng code:** Adapter, Crypto, Proxy Manager dùng chung giữa API và Worker — không copy-paste.
3. **Build tăng tốc:** pnpm + Turborepo cache theo package, chỉ build cái thay đổi.
4. **Quản trị dễ:** 1 repo, 1 PR review thay đổi nhiều phần liên quan.

---

## 🌳 Cây thư mục đầy đủ (level 3)

```
afanta/
│
├── apps/                                 # Các ứng dụng độc lập, deploy riêng
│   │
│   ├── web/                              # 🖥️ Frontend React + Vite
│   │   ├── src/
│   │   │   ├── components/               # UI components (shadcn-based)
│   │   │   ├── features/                 # Feature modules (auth, dashboard, channels, ...)
│   │   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── layouts/                  # AuthLayout, AppLayout, ...
│   │   │   ├── lib/                      # Utilities (api client, formatter, ...)
│   │   │   ├── locales/                  # i18n JSON (vi/, en/)
│   │   │   ├── pages/                    # Route pages (login, dashboard, ...)
│   │   │   ├── stores/                   # Zustand stores
│   │   │   ├── types/                    # Local TS types
│   │   │   └── main.tsx                  # Entry point
│   │   ├── public/                       # Static assets (favicon, og:image)
│   │   ├── .env.example
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── api/                              # ⚙️ Backend NestJS API Gateway
│   │   ├── src/
│   │   │   ├── modules/                  # NestJS modules: auth, user, channel, audit, ...
│   │   │   ├── common/                   # Guards, interceptors, decorators, filters
│   │   │   ├── config/                   # Config services (env, database, redis, ...)
│   │   │   ├── prisma/                   # Prisma service wrapper
│   │   │   ├── queue/                    # BullMQ producer (enqueue jobs)
│   │   │   ├── websocket/                # Socket.IO gateway
│   │   │   └── main.ts                   # Bootstrap NestJS
│   │   ├── test/                         # E2E test (Jest/Vitest + supertest)
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── worker-yt/                        # 🟥 Worker quét YouTube
│   │   ├── src/
│   │   │   ├── jobs/                     # Job handler (rescan, refresh, ...)
│   │   │   ├── adapters/                 # Local adapter wrapper (gọi @afanta/adapters)
│   │   │   ├── browser/                  # Playwright launcher với stealth + proxy
│   │   │   ├── lifecycle/                # Boot / shutdown / health check
│   │   │   └── main.ts
│   │   ├── Dockerfile                    # Image cho production worker
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── worker-fb/                        # 🟦 Worker quét Facebook (cấu trúc giống worker-yt)
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── worker-tt/                        # 🟧 Worker TikTok (Phase 2 — đã chuẩn bị skeleton)
│   │   └── (placeholder)
│   │
│   └── worker-tg/                        # 🟦 Worker Telegram qua gramjs (Phase 2)
│       └── (placeholder)
│
├── packages/                             # Code dùng chung (không deploy độc lập)
│   │
│   ├── shared-types/                     # 📦 Type definitions chung
│   │   ├── src/
│   │   │   ├── platform.ts               # PlatformName enum, ChannelInsight, ...
│   │   │   ├── auth.ts                   # JWT payload, RBAC enums
│   │   │   ├── api.ts                    # Request/Response DTOs (mirror NestJS)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── adapters/                         # 🔌 IPlatformAdapter implementations
│   │   ├── src/
│   │   │   ├── base/                     # Interface IPlatformAdapter + abstract base class
│   │   │   ├── youtube/                  # YouTubeAdapter (Phase 1)
│   │   │   ├── facebook/                 # FacebookAdapter (Phase 1 cuối)
│   │   │   ├── tiktok/                   # TikTokAdapter (Phase 2)
│   │   │   ├── instagram/                # InstagramAdapter (Phase 2)
│   │   │   └── index.ts
│   │   ├── tests/                        # Mock browser + integration test
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── crypto/                           # 🔐 Argon2id + AES-256-GCM + AES-KW
│   │   ├── src/
│   │   │   ├── kdf.ts                    # deriveUDK (Argon2id)
│   │   │   ├── symmetric.ts              # encryptBundle / decryptBundle (AES-GCM)
│   │   │   ├── keywrap.ts                # wrapDEK / unwrapDEK (AES-KW)
│   │   │   ├── random.ts                 # CSPRNG helpers
│   │   │   └── index.ts
│   │   ├── tests/                        # Vitest unit tests (coverage ≥ 90%)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── proxy-manager/                    # 🌐 Proxy pool, health check, geo matching
│   │   ├── src/
│   │   │   ├── pool.ts                   # ProxyPool class
│   │   │   ├── health.ts                 # Latency + reputation check
│   │   │   ├── geo.ts                    # Geo matching logic
│   │   │   └── providers/                # BrightData, Smartproxy, IPRoyal adapters
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui-components/                    # 🎨 shadcn/ui shared (Phase 2 mới tách)
│   │   ├── src/
│   │   │   ├── primitives/               # Button, Input, Dialog, ...
│   │   │   ├── charts/                   # ChartWrapper (Recharts/ECharts)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── eslint-config/                    # 🧹 ESLint config dùng chung
│   │   ├── base.js
│   │   ├── react.js
│   │   ├── nest.js
│   │   └── package.json
│   │
│   └── tsconfig/                         # 📝 Base tsconfig dùng chung
│       ├── base.json                     # strict: true, target: ES2022
│       ├── react.json
│       ├── node.json
│       └── package.json
│
├── infra/                                # 🏗️ Hạ tầng triển khai
│   │
│   ├── docker/                           # Dockerfile chung + helper script
│   │   ├── postgres.Dockerfile
│   │   ├── vault.Dockerfile
│   │   └── healthcheck.sh
│   │
│   ├── docker-compose.dev.yml            # Stack local: postgres + redis + vault + meili
│   ├── docker-compose.prod.yml           # Stack production (Phase 2+)
│   │
│   ├── kubernetes/                       # K8s manifests (Phase 3+)
│   │   ├── base/                         # Kustomize base
│   │   ├── overlays/                     # Per-env overlays (dev/staging/prod)
│   │   └── README.md
│   │
│   ├── terraform/                        # IaC cho cloud resources (Phase 3+)
│   │   ├── modules/
│   │   ├── envs/
│   │   └── README.md
│   │
│   └── scripts/                          # Bash/PowerShell utility scripts
│       ├── dev-up.sh                     # One-command bring up dev stack
│       ├── dev-down.sh
│       └── reset-db.sh
│
├── prisma/                               # 🗃️ Database schema (Prisma)
│   ├── schema.prisma                     # Single source of truth cho DB
│   ├── migrations/                       # Migration history (auto-generated)
│   └── seed.ts                           # Seed data ban đầu (Owner user, role mẫu)
│
├── docs/                                 # 📚 Tài liệu nội bộ (Phase 2+)
│   ├── api/                              # OpenAPI snapshots
│   ├── adr/                              # Architecture Decision Records
│   └── runbooks/                         # On-call runbooks (Phase 3+)
│
├── .github/                              # 🤖 GitHub config
│   ├── workflows/                        # CI/CD pipelines
│   │   ├── ci.yml                        # Lint + Type check + Unit test
│   │   ├── e2e.yml                       # Playwright E2E
│   │   └── deploy.yml                    # Deploy production (Phase 2)
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
│
├── .vscode/                              # ⚙️ VSCode workspace settings
│   ├── settings.json                     # Format on save, recommended extensions
│   └── extensions.json
│
├── .husky/                               # 🐶 Git hooks (Husky)
│   ├── pre-commit                        # lint-staged
│   └── commit-msg                        # commitlint (Conventional Commits)
│
├── AFANTA_MASTER_PLAN_v2.md              # 📜 Tài liệu gốc (kim chỉ nam)
├── ARCHITECTURE.md                       # 🏗️ File này
├── PROJECT_STATUS.md                     # 📊 Trạng thái dự án
├── TODO.md                               # ✅ Danh sách việc cần làm
├── QUESTIONS_FOR_USER.md                 # ❓ Câu hỏi chờ user trả lời
├── README.md                             # 📖 Hướng dẫn cài đặt + chạy
├── CHANGELOG.md                          # 📝 Lịch sử thay đổi (Phase 2+)
├── .env.example                          # Template biến môi trường
├── .gitignore                            # node_modules, .env, dist, ...
├── .editorconfig                         # Quy ước indent/encoding cho mọi editor
├── .nvmrc                                # Pin Node version (v20)
├── package.json                          # Root package (scripts chung)
├── pnpm-workspace.yaml                   # Khai báo workspace
├── pnpm-lock.yaml                        # Lockfile (commit lên Git)
├── turbo.json                            # Turborepo build pipeline (Phase 2)
└── tsconfig.json                         # Root tsconfig (extends @afanta/tsconfig/base)
```

---

## 🧩 Quan hệ phụ thuộc giữa các package

```
                    ┌───────────────────┐
                    │  shared-types     │ ◄────────────┐
                    │  (zero deps)      │              │
                    └─────────┬─────────┘              │
                              │ used by                │
              ┌───────────────┼───────────────────┐    │
              ▼               ▼                   ▼    │
        ┌──────────┐   ┌──────────┐         ┌──────────┐
        │ apps/web │   │ apps/api │         │  workers │
        └──────────┘   └─────┬────┘         └─────┬────┘
                             │                    │
                             ▼                    ▼
                       ┌──────────┐         ┌──────────┐
                       │  crypto  │ ◄──────►│ adapters │
                       └──────────┘         └─────┬────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ proxy-manager│
                                          └──────────────┘
```

- **shared-types:** Lá phổi của monorepo. Mọi nơi import.
- **crypto:** Dùng bởi `api` (mã hoá lúc lưu DB) và `workers` (giải mã lúc dùng).
- **adapters:** Dùng bởi `workers` (chính) và `api` (chỉ để gọi `verifySession`).
- **proxy-manager:** Chủ yếu dùng bởi `workers`.

---

## 📦 Quy ước đặt tên package

Mọi package nội bộ đều có scope `@afanta/...`:

- `@afanta/web`, `@afanta/api`, `@afanta/worker-yt`, `@afanta/worker-fb`
- `@afanta/shared-types`, `@afanta/adapters`, `@afanta/crypto`, `@afanta/proxy-manager`
- `@afanta/eslint-config`, `@afanta/tsconfig`, `@afanta/ui-components`

---

## 🔁 Lifecycle dev (developer chạy local)

1. `pnpm install` — cài tất cả workspace deps
2. `pnpm dev:up` — script wrap `docker compose -f infra/docker-compose.dev.yml up -d`
3. `pnpm db:migrate` — chạy Prisma migrations
4. `pnpm db:seed` — seed data
5. `pnpm dev` — chạy song song `web` + `api` + `worker-yt` (qua Turborepo)
6. Mở `http://localhost:5173` (web) + `http://localhost:3000/api/docs` (Swagger)

---

## 🚧 Phase nào tạo gì?

| Folder/File                                   | Phase tạo        | Ghi chú                                   |
| --------------------------------------------- | ---------------- | ----------------------------------------- |
| `apps/web`, `apps/api`, `apps/worker-yt`      | **Phase 1**      | Bắt buộc cho MVP                          |
| `apps/worker-fb`                              | **Phase 1 cuối** | Sau khi YouTube ổn định                   |
| `apps/worker-tt`, `apps/worker-tg`            | **Phase 2**      | Skeleton để Phase 2 dễ thêm               |
| `packages/shared-types`, `crypto`, `adapters` | **Phase 1**      | Cốt lõi                                   |
| `packages/proxy-manager`                      | **Phase 2**      | Phase 1 chạy no-proxy local trước         |
| `packages/ui-components`                      | **Phase 2**      | Phase 1 inline component trong `apps/web` |
| `infra/kubernetes`, `infra/terraform`         | **Phase 3**      | Khi deploy production scale               |
| `docs/adr`, `docs/runbooks`                   | **Phase 2+**     | Khi đã có quyết định cần ghi lại          |

---

_Cập nhật lần cuối: 2026-04-29 (cuối Prompt 1 — Onboarding)_
