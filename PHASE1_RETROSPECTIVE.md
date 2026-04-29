# 🎬 AFANTA Phase 1 — Retrospective

> **Hoàn thành:** 2026-04-29 (cùng ngày bắt đầu — vibe-coding intensive sprint)
> **Tổng cam kết:** 9 commits trên `main`, ~80 source files, ~6000 dòng code
> **Stack:** Monorepo pnpm + NestJS 11 + Prisma 6 + React 18 + Vite 8 + Tailwind 3 + Playwright 1.59 + Argon2id + AES-256-GCM

---

## 🎯 Tóm tắt Phase 1

Build được **MVP working end-to-end**:

- User login → add YouTube account (Embedded Browser, Zero-Knowledge) → bind channel → scrape thật → xem dashboard
- 14+19 = **23 endpoints** API
- 19 Prisma models + 9 enums
- 31/31 unit tests crypto pass, coverage 100% lines
- ESLint + Prettier + Husky + Conventional Commits từ commit đầu tiên

---

## ✅ What went well

### 1. **Master Plan kim chỉ nam**

Đọc `AFANTA_MASTER_PLAN_v2.md` (1366 dòng) trước khi code 1 dòng nào. Mọi quyết định technical được đối chiếu với Master Plan → ít drift, ít refactor.

### 2. **Cloud-first nhanh chóng pivot**

Khi user báo "PC không cài được Docker", chuyển ngay sang Supabase + Upstash thay vì cố ép Docker. Quyết định nhanh, không lãng phí thời gian.

### 3. **Crypto module sạch sẽ**

- Tách `@afanta/crypto` package độc lập với 31 unit tests, coverage 100% lines
- Mỗi function nhạy cảm có comment `@security-critical`
- Nguyên tắc bất biến: KHÔNG sửa package này không có user duyệt

### 4. **Conventional Commits ngay từ Prompt 2**

Husky + commitlint config từ đầu → 100% commits theo `feat:/fix:/chore:/feat(api):` chuẩn. Git log dễ đọc, dễ rollback.

### 5. **Verify từng bước**

Cuối mỗi prompt: `pnpm typecheck + lint + format:check + build` đều pass trước khi commit. Không tích lũy nợ kỹ thuật.

### 6. **User-driven login flow ấn tượng**

Embedded Browser bật chrome thật, user tự đăng nhập Google trên giao diện gốc — đúng tinh thần Zero-Trust + Zero-Knowledge của Master Plan. Đây là moment "WOW" của AFANTA.

---

## ⚠️ What was hard / lessons learned

### 1. **Schema thiếu `salt` + `tag` ở Prompt 3**

Đến Prompt 7 mới phát hiện schema PlatformAccount thiếu 2 cột này → phải tạo migration mới `add_envelope_salt_tag`. Bài học: **review schema xong PHẢI test round-trip với crypto module ngay**.

### 2. **Prisma Bytes vs Buffer type mismatch**

Prisma trả `Uint8Array`, crypto module dùng `Buffer`. Phải convert qua lại bằng `Buffer.from()` / `new Uint8Array()`. Bài học: chuẩn hoá kiểu binary từ đầu.

### 3. **Prisma 7 vừa ra → cú pháp `url = env(...)` bị bỏ**

Cài v7 latest, schema validate fail. Downgrade về v6.19.3 stable. Bài học: **major version mới release < 3 tháng → tránh ở MVP**.

### 4. **Lucide-react v1+ bỏ brand icons**

Youtube/Facebook/Instagram icon biến mất. Phải thay bằng `Video`/`Share2` generic. Bài học: brand icons biến mất do trademark → dùng inline SVG cho brand sau.

### 5. **Port 3000/5173 conflict**

Process khác trên máy user đã chiếm port → Vite/Nest fallback. Phải đổi cấu hình `.env` để allow nhiều origin trong CORS. Bài học: dùng port không-mainstream từ đầu (3001 thay vì 3000).

### 6. **Tooling drift sau từng prompt**

- TypeScript root config không có `experimentalDecorators` → API compile fail (Prompt 4)
- Root tsconfig không có `jsx` → Web typecheck fail (Prompt 6)
- API tsconfig không có `lib: DOM` → Playwright `page.evaluate` reference `window` fail (Prompt 7)

Bài học: **Setup tsconfig đầy đủ ngay từ Prompt 2** sẽ tiết kiệm 3 lần fix sau.

### 7. **Bracketed paste mode cản trở user paste GitHub PAT**

Git Bash + Windows Terminal kết hợp gây ra `^[[200~` escape sequences leak → user phải gõ tay. Bài học: không hướng dẫn user paste credentials, dùng `gh auth login` web flow.

### 8. **Master password trong RAM 30 phút — UX trade-off**

Mỗi action quan trọng (rescan, verify) hỏi lại master password sau 30 phút → friction. Phase 2 cần cân bằng UX và security.

---

## 🚧 Phase 1 Trade-offs (acknowledged debt)

Các thứ Phase 1 cố tình **chưa làm** vì scope hoặc complexity, đã ghi rõ trong code và status:

| Trade-off                           | Lý do Phase 1                              | Plan Phase 2                                                   |
| ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| **Vault thật → KEK_DEV trong .env** | Không có Docker                            | HashiCorp Cloud Vault hoặc AWS KMS, Shamir Secret Sharing      |
| **Worker chạy trong API process**   | Đơn giản, in-memory queue                  | Tách `apps/worker-yt` + BullMQ + Redis native                  |
| **Skip BullMQ**                     | Upstash REST không support                 | Migrate sang Upstash Native Redis (TLS port)                   |
| **Skip cron 6h auto-rescan**        | Zero-Knowledge cần master password runtime | "Scrape token" derive từ master password (như 1Password Cloud) |
| **Skip playwright-extra stealth**   | Phase 1 chỉ test với 1-2 kênh              | Anti-detection level 1 (UA spoofing, fingerprint consistent)   |
| **Skip behavior simulation**        | Phase 4 mới cần                            | Mouse jitter, scroll quán tính, Bezier curves                  |
| **Master password gửi qua API**     | Đơn giản hoá flow                          | Client-side derivation qua Web Crypto API                      |
| **Skip WebSocket realtime**         | TanStack Query refetchInterval đủ Phase 1  | Socket.IO + tenant rooms + event broadcast                     |
| **Skip alert system**               | Chưa có data lịch sử để trigger rule       | AlertRule + AlertEvent + multi-channel notify                  |
| **Skip Studio Analytics scrape**    | UI Studio quá phức tạp                     | YouTube Analytics API official + retention curves              |
| **Skip Facebook Page**              | Tập trung 1 nền tảng cho chuẩn             | Phase 1 cuối / Phase 2 mở rộng                                 |
| **Skip Onboarding wizard**          | Tài liệu USER_GUIDE.md đủ Phase 1          | Phase 2 multi-step welcome                                     |
| **Skip Notification center**        | Chưa có alerts data                        | Topbar bell + dropdown + mark-as-read                          |
| **Skip 2FA TOTP**                   | Email/password đủ Phase 1 dev              | speakeasy + QR code + backup codes                             |
| **Skip Settings tab Team/Billing**  | Chỉ 1 owner Phase 1                        | Phase 2 invite users, Phase 3 billing                          |

**Tổng:** ~15 trade-offs đã được ghi rõ + có plan upgrade.

---

## 📊 Stats Phase 1

```
Commits:        9 commits (chore + 8 feat)
Files:          ~80 source files
LOC:            ~6,000 lines TypeScript/TSX
Tests:          31 unit tests (crypto)
Coverage:       100% lines (crypto module)
Endpoints:      14 API endpoints (Auth, Tenants, Users, Roles, Groups,
                Health, PlatformAccounts, Channels, ScrapeJobs, Dashboard)
DB models:      19 Prisma models + 9 enums
Migrations:     2 migrations applied to Supabase
Frontend:       9 pages, 8 shadcn-style UI components, 4 layout components,
                3 i18n namespaces × 2 languages
Browser deps:   Chromium 1217 (Playwright)
Cloud services: Supabase (Postgres + Auth) + Upstash (Redis)
Time:           ~8 hours total wall-clock (1 day vibe-code intensive)
```

---

## 🗺️ Roadmap dự đoán Phase 2 (3 tháng tiếp theo)

Theo Master Plan Phần K:

1. **Multi-platform**: Facebook Page, Instagram, TikTok, Telegram (4 nền tảng mới)
2. **Anti-detection level 1**: stealth plugin, fingerprint consistent, proxy pool basic
3. **RBAC 6 cấp đầy đủ** + Group/Team management
4. **i18n EN hoàn thiện** + Dark mode polish
5. **Alert system**: in-app + email + Telegram bot
6. **Audit log UI** với filter + export
7. **Báo cáo PDF/Excel cơ bản**
8. **Mobile responsive polish + PWA**
9. **WebSocket realtime** thay polling
10. **Tách worker process** + BullMQ + Redis native
11. **2FA TOTP + IP whitelist**
12. **Cron auto-rescan** với scrape token mechanism

**Deliverable Phase 2:** Bản v1.0 chính thức trên domain `afantaAi.com` với SSL.

---

## 💡 Recommendations cho user (vibe-coder)

1. **Backup `.env` ra ngoài máy** — nếu mất, mất hết keys. Lưu vào Bitwarden hoặc encrypted USB.
2. **Đặt master password thật mạnh** + lưu vào trình quản lý mật khẩu. Quên = mất hết session.
3. **Rotate Supabase + Upstash keys trước Phase 3** (production launch). Keys hiện tại đã paste trong chat lịch sử.
4. **Thử nghiệm với 1-2 kênh test** trước khi bind kênh thật của doanh nghiệp.
5. **Đọc lại Master Plan v2.0** trước khi sang Phase 2 — kiến trúc 6 cấp RBAC + 15 nền tảng phức tạp hơn nhiều.
6. **Tuyển 1 lawyer review ToS** Meta/Google trước khi go-to-market.

---

## 🙏 Cảm ơn

- **User**: Đã kiên nhẫn vibe-coding qua 9 prompt, paste GitHub PAT khi bị bracketed paste, reset Supabase password 2 lần, tạo Supabase + Upstash + GitHub trong 15 phút. Phase 1 không thể done mà không có sự chủ động của user.
- **Master Plan v2.0**: Tài liệu kim chỉ nam giúp mọi quyết định technical đều có cơ sở.
- **Open-source ecosystem**: NestJS, Prisma, React, Vite, Tailwind, shadcn/ui, Radix UI, Playwright, Argon2, ... tất cả miễn phí, chất lượng cao.

---

**Phase 1 — DONE 🎉**

> "Đừng cố làm 15 nền tảng cùng lúc. Phase 1 chỉ làm YouTube cho thật chuẩn. Khi đã ổn định, thêm 1 nền tảng/tháng. Đốt cháy giai đoạn = sản phẩm rác."
> — Master Plan, lời khuyên cuối cùng

---

_Soạn ngày 2026-04-29, sau khi commit cuối Phase 1._
