# 🏛️ AFANTA — Omni-Channel Platform

> **Hệ thống Enterprise SaaS** quản lý đa kênh mạng xã hội (YouTube, Facebook, TikTok, Instagram, ...) cho doanh nghiệp Media Việt Nam, với bảo mật cấp ngân hàng (Zero-knowledge + Envelope Encryption).

---

## 1️⃣ Dự án là gì? (3 câu)

AFANTA là một **dashboard tổng hợp** giúp doanh nghiệp Media quản lý hàng trăm tài khoản mạng xã hội cùng lúc — quét số liệu (subscribers, views, doanh thu), nhận cảnh báo bất thường, xuất báo cáo tự động. Khác với Hootsuite/Buffer, AFANTA **không lưu password** của user; thay vào đó user tự đăng nhập trên Embedded Browser, hệ thống harvest session và mã hoá theo chuẩn ngân hàng — **kể cả Super Admin cũng không thể đọc được Cookie nếu không có Master Password của chủ tài khoản**. Roadmap 12 tháng chia 4 phase, Phase 1 MVP tập trung 2 nền tảng quan trọng nhất: **YouTube + Facebook Page**.

> 📜 **Tài liệu thiết kế đầy đủ:** [AFANTA_MASTER_PLAN_v2.md](./AFANTA_MASTER_PLAN_v2.md) (1366 dòng, 14 phần)

---

## 2️⃣ Yêu cầu máy tính

| Phần mềm    | Version      | Cài ở đâu                     |
| ----------- | ------------ | ----------------------------- |
| **Node.js** | ≥ 20 LTS     | https://nodejs.org            |
| **pnpm**    | ≥ 9          | `npm install -g pnpm`         |
| **Git**     | Bản mới nhất | https://git-scm.com           |
| **VS Code** | Bản mới nhất | https://code.visualstudio.com |

> 💡 **KHÔNG cần Docker** ở Phase 1. Hệ thống dùng **Supabase + Upstash** (cloud) thay thế.

### Tài khoản cloud cần có (đã setup ở Prompt 1)

- ✅ **Supabase** (database PostgreSQL): https://supabase.com
- ✅ **Upstash** (Redis queue): https://upstash.com
- ✅ **GitHub** (lưu code): https://github.com

---

## 3️⃣ Cài đặt lần đầu

```bash
# 1. Clone repo (lần đầu)
git clone https://github.com/Chienphan1102/afantasystem.git
cd afantasystem

# 2. Tạo file .env từ template
cp .env.example .env
# Sau đó mở .env và điền các giá trị thật (Supabase URL, Anon Key, Upstash, ...)

# 3. Cài tất cả dependencies cho monorepo
pnpm install

# 4. Test kết nối cloud
pnpm cloud:test
# Phải thấy: ✓ Supabase REST API: OK   ✓ Upstash Redis: OK
```

---

## 4️⃣ Chạy ứng dụng (Dev mode)

⏳ **Phase 1 hiện đang ở Prompt 2** — code chưa đủ để run app. Khi xong các Prompt sau sẽ có:

```bash
# Prompt 4 trở đi
pnpm --filter @afanta/api dev      # Backend chạy ở http://localhost:3000
pnpm --filter @afanta/web dev      # Frontend chạy ở http://localhost:5173
pnpm --filter @afanta/worker-yt dev  # Worker quét YouTube
```

---

## 5️⃣ Troubleshooting (xử lý lỗi cơ bản)

### ❌ Lỗi "pnpm: command not found"

- Cài lại pnpm: `npm install -g pnpm`
- Đóng terminal, mở lại

### ❌ Lỗi "Cannot find module 'dotenv'" khi chạy `pnpm cloud:test`

- Bạn chưa chạy `pnpm install`. Chạy lại lệnh này.

### ❌ `pnpm cloud:test` báo "Missing env var: SUPABASE_URL"

- File `.env` chưa được tạo. Copy `cp .env.example .env`, rồi điền giá trị thật vào.

### ❌ `pnpm cloud:test` báo HTTP 401 hoặc 403

- Key trong `.env` sai. Vào Supabase/Upstash dashboard copy lại key.

### ❌ `pnpm cloud:test` báo timeout / network error

- Kiểm tra Internet. Test ping `supabase.com`.

### ❌ Port 3000 / 5173 bị chiếm khi chạy dev

- Tìm process đang dùng port: `netstat -ano | findstr :3000` (Windows)
- Kill process đó bằng Task Manager hoặc `taskkill /PID <số> /F`

### ❌ Husky không chạy pre-commit hook

- Chạy lại: `pnpm prepare`
- Nếu vẫn lỗi: `pnpm exec husky install`

### ❓ Lỗi khác

- Chụp ảnh terminal, paste vào prompt mới gửi Claude Code — sẽ debug từng bước.

---

## 📁 Cấu trúc thư mục

```
afanta/
├── apps/                # Ứng dụng chạy được (web, api, worker)
├── packages/            # Code dùng chung (shared-types, crypto, adapters, ...)
├── prisma/              # Database schema (Prompt 3)
├── infra/scripts/       # Script tiện ích (cloud-test, ...)
├── .env                 # Bí mật — KHÔNG commit
├── .env.example         # Template cho .env
└── AFANTA_MASTER_PLAN_v2.md  # Tài liệu kiến trúc tổng thể
```

> 📐 **Chi tiết kiến trúc:** [ARCHITECTURE.md](./ARCHITECTURE.md)
> 📊 **Trạng thái hiện tại:** [PROJECT_STATUS.md](./PROJECT_STATUS.md)
> ✅ **Việc cần làm tiếp:** [TODO.md](./TODO.md)

---

## 🔒 Bảo mật

- File `.env` **KHÔNG BAO GIỜ** được commit (nằm trong `.gitignore`)
- Master Password của user **không lưu ở server** — chỉ dùng để derive UDK trên máy client
- Session tài khoản mạng xã hội **mã hoá AES-256-GCM** trước khi lưu DB
- DEK được wrap bằng UDK theo chuẩn AES-KW (Envelope Encryption)
- Phase 3 sẽ chuyển KEK sang **HashiCorp Cloud Vault** + **Shamir Secret Sharing** (chia khoá 5 mảnh)

> ⚠️ **Phase 1 hiện tại:** KEK được lưu tạm trong `.env` (`KEK_DEV`). Đây là **nợ kỹ thuật** đã ghi nhận, sẽ nâng cấp Phase 3.

---

## 📅 Roadmap

| Phase                     | Thời gian   | Mục tiêu                                                |
| ------------------------- | ----------- | ------------------------------------------------------- |
| **1 — MVP**               | Tháng 1-3   | YouTube + Facebook Page, Auth, Dashboard cơ bản         |
| 2 — Stable Multi-Platform | Tháng 4-6   | Thêm 6 nền tảng, Anti-detection cấp 1, i18n + Dark mode |
| 3 — Enterprise            | Tháng 7-9   | Multi-tenant, AI Insights, Public API, Webhook          |
| 4 — Commerce & Scale      | Tháng 10-12 | Sàn TMĐT, K8s, 50.000+ kênh                             |

---

## 📝 License

UNLICENSED — Internal project, all rights reserved.

---

**Tác giả:** Afanta Team với Claude Code
**Cập nhật lần cuối:** 2026-04-29
