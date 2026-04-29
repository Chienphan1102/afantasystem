# 📘 AFANTA — Hướng Dẫn Sử Dụng (Phase 1 MVP)

> Tài liệu cho người dùng cuối, viết bằng tiếng Việt đời thường, không cần biết code.

---

## 🎯 AFANTA là gì?

AFANTA là **dashboard quản lý đa kênh mạng xã hội** dành cho doanh nghiệp Media Việt Nam. Phase 1 MVP hỗ trợ **YouTube** với các tính năng cốt lõi:

- ✅ **Bảo mật cấp ngân hàng**: bạn tự đăng nhập Google trên trình duyệt thật, hệ thống KHÔNG biết password của bạn
- ✅ **Theo dõi nhiều kênh** YouTube cùng lúc trên 1 dashboard
- ✅ **Tự động quét** subscribers, views, top 10 videos
- ✅ **Mã hoá AES-256-GCM + Argon2id** — kể cả admin hệ thống cũng không đọc được session của bạn

---

## 🚀 Cài đặt lần đầu (1 lần duy nhất)

### Bước 1: Yêu cầu máy tính

Máy tính của bạn cần:

- **Windows 10/11**, macOS 13+, hoặc Ubuntu 22.04+
- **Node.js 20+** — tải tại https://nodejs.org (chọn LTS)
- **Git** — tải tại https://git-scm.com
- **VS Code** (khuyến nghị) — tải tại https://code.visualstudio.com
- **Tài khoản Google** test (đừng dùng tài khoản chính lần đầu)

### Bước 2: Clone code

Mở **Git Bash** (chuột phải vào thư mục bất kỳ → "Open Git Bash here"):

```bash
git clone https://github.com/Chienphan1102/afantasystem.git
cd afantasystem
```

### Bước 3: Tạo file `.env`

Trong thư mục dự án:

```bash
cp .env.example .env
```

Mở file `.env` bằng VS Code, điền các giá trị:

- `DATABASE_URL`, `DIRECT_URL` — lấy từ Supabase dashboard (Connect → ORMs → Prisma)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase Settings → API
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Upstash Console → REST API
- `JWT_SECRET`, `KEK_DEV` — sinh tự động:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `SEED_OWNER_EMAIL` — email bạn muốn dùng làm Owner

### Bước 4: Cài dependencies + setup DB

```bash
# Cài cả monorepo (mất ~3 phút lần đầu)
pnpm install

# Test cloud connection
pnpm cloud:test
# → Phải thấy "Tất cả cloud services đã sẵn sàng!"

# Apply database schema
pnpm exec prisma migrate deploy

# Seed data ban đầu (tenant + roles + owner)
pnpm prisma db seed
# → Đăng nhập lần đầu: email seed + password "ChangeMe123!"

# Cài browser cho Playwright (~150MB, mất ~2 phút)
pnpm --filter @afanta/api exec playwright install chromium
```

---

## ▶️ Khởi động hằng ngày

Mở **2 cửa sổ Git Bash** trong thư mục dự án:

**Cửa sổ 1** — Backend API:

```bash
pnpm --filter @afanta/api dev
```

Đợi đến khi thấy `🚀 AFANTA API listening on http://localhost:3001`.

**Cửa sổ 2** — Frontend web:

```bash
pnpm --filter @afanta/web dev
```

Đợi đến khi thấy `Local: http://localhost:5173/` (hoặc 5174 nếu 5173 bận).

Mở trình duyệt → http://localhost:5173 (hoặc 5174).

---

## 🎬 Hướng dẫn dùng từng bước

### 1. Đăng nhập

- Mở app → tự redirect về `/login`
- Email: `chienphan.jup@gmail.com` (hoặc email seed của bạn)
- Password: `ChangeMe123!` (lần đầu)

### 2. Thêm tài khoản YouTube đầu tiên

1. Sidebar bên trái → bấm **"Tài khoản đã login"**
2. Bấm **"+ Thêm tài khoản"**
3. Chọn **YouTube**
4. Đặt nhãn (vd "Kênh chính") → bấm Tiếp tục
5. Modal hỏi **Master Password** (lần đầu): nhập 1 mật khẩu MẠNH (≥12 ký tự, có chữ + số + ký tự đặc biệt)
   > ⚠️ **CỰC KỲ QUAN TRỌNG**: Lưu master password vào trình quản lý mật khẩu (Bitwarden/1Password). Quên là **mất hết** session đã lưu!
6. Một **cửa sổ Chrome thật** sẽ mở ở trang đăng nhập Google
7. **Bạn tự đăng nhập** Google: email + password + 2FA. Hệ thống KHÔNG nhìn thấy password của bạn.
8. Sau khi đăng nhập thành công, cửa sổ sẽ tự đóng sau ~2 giây
9. Quay về `/accounts` — thấy 1 row YouTube với badge **ACTIVE** màu xanh

### 3. Bind kênh YouTube đầu tiên

1. Sidebar → **"Kênh"**
2. Bấm **"+ Thêm kênh"**
3. Chọn account vừa add → paste URL kênh YouTube của bạn (hỗ trợ `youtube.com/@handle`, `youtube.com/channel/UC...`, `youtube.com/c/name`)
4. Bấm **"Bind + scan"**
5. Modal master password popup (nếu hết TTL 30 phút) → nhập lại
6. Đợi **30-60 giây** — hệ thống tự mở Chromium ẩn, load session, scrape data
7. List `/channels` tự refresh → kênh xuất hiện với **subscribers + total views thật**

### 4. Xem chi tiết kênh

- Bấm **"Chi tiết"** trên row kênh → trang `/channels/:id`
- Thấy:
  - 2 stat cards (Subscribers + Total Views)
  - Line chart subscribers history (sau 2+ lần scan)
  - Table top 10 videos với thumbnail + title + view count

### 5. Quét lại thủ công

- Trên trang Kênh, bấm **"Quét lại"** ở row kênh
- Toast "Đã đưa vào hàng đợi"
- 30-60s sau, list tự refresh với số liệu mới
- Lịch sử các lần scan: vào chi tiết kênh → Tab "History" (Phase 2)

### 6. Đọc Dashboard

- Sidebar → **"Tổng quan"**
- 4 stat cards (số kênh, tổng followers, scan 24h, alert)
- Line chart subscribers theo ngày (sau 2+ ngày scan)
- "Hoạt động gần đây" — auto refresh 10s — click vào row để jump tới kênh

### 7. Đổi giao diện / ngôn ngữ

- Topbar góc phải:
  - **VI/EN** — bấm dropdown đổi ngôn ngữ
  - **Sun/Moon/Monitor** — đổi theme Light / Dark / theo OS

### 8. Cài đặt

- Sidebar → **Cài đặt**
- Tab Hồ sơ: xem email, role
- Tab Tuỳ chỉnh: ngôn ngữ + theme
- Tab Bảo mật: nút "Xoá master password khỏi RAM ngay" (logout cứng)
- Phase 2: đổi mật khẩu, 2FA, team management

### 9. Đăng xuất

- Avatar góc phải → **Đăng xuất**
- Token bị xoá, master password cũng bị clear khỏi RAM

---

## 🆘 Khắc phục sự cố

### ❌ "Tenant or user not found" khi `prisma migrate`

Region Supabase trong DATABASE_URL sai. Vào Supabase → Connect → ORMs → Prisma, copy lại URL chính xác.

### ❌ Frontend mở localhost:5173 nhưng thấy trang khác

Port 5173 đã bị process khác chiếm. Vite tự fallback sang 5174 — kiểm tra terminal Vite log để biết port thật.

### ❌ Add YouTube account: cửa sổ Chrome mở nhưng không tự đóng

- Kiểm tra bạn đã được redirect về `youtube.com` chưa (đăng nhập đầy đủ + qua 2FA)
- Đôi khi Google hỏi xác nhận checkpoint — hoàn tất thủ công, hệ thống sẽ detect

### ❌ Quét kênh báo "Session EXPIRED"

Cookie hết hạn (~6 tháng cho YouTube). Vào `/accounts`, xoá account cũ, add lại từ đầu.

### ❌ Quét kênh báo "Master password sai"

Bạn nhập sai master password. Note: master password do **chính bạn đặt** lúc add account đầu tiên — không phải password Google.

### ❌ Số liệu chậm cập nhật

Phase 1 dùng polling 10s/30s. Phase 2 sẽ dùng WebSocket realtime tức thì.

### ❌ Lỗi khác

Chụp ảnh terminal + screenshot, gửi cho Claude Code prompt mới — sẽ debug từng bước.

---

## ❓ FAQ

**Q: AFANTA có biết password Google của tôi không?**
A: KHÔNG. Bạn tự nhập trên giao diện gốc của Google, hệ thống chỉ harvest cookies sau khi bạn đăng nhập thành công.

**Q: Quên master password thì sao?**
A: **Mất toàn bộ session đã lưu.** Phải re-login lại từng tài khoản. Đây là tradeoff của Zero-Knowledge Architecture — giống 1Password / Bitwarden.

**Q: Dùng được trên Mac/Linux không?**
A: Code chạy được trên cả 3 OS. Phase 1 chỉ test trên Windows. Phase 2 sẽ verify Mac/Linux.

**Q: Có dùng được offline không?**
A: KHÔNG. Phase 1 dùng Supabase + Upstash cloud. Cần Internet ổn định.

**Q: Bao nhiêu kênh là tối đa?**
A: Phase 1 chưa giới hạn cứng. Khuyến nghị < 20 kênh để Chromium không nuốt RAM.

**Q: Tôi xoá account, data có bị xoá không?**
A: Có. Xoá `PlatformAccount` → cascade xoá `Channel` → cascade xoá `ChannelInsight`.

---

## 📝 Phản hồi & lỗi

- **Bug / yêu cầu tính năng**: tạo issue trên GitHub repo
- **Câu hỏi nhanh**: hỏi Claude Code trong cuộc hội thoại
- **Tài liệu kiến trúc đầy đủ**: [AFANTA_MASTER_PLAN_v2.md](./AFANTA_MASTER_PLAN_v2.md)

---

_Tài liệu này thuộc về Phase 1 MVP — sẽ cập nhật khi tính năng mới được triển khai (Phase 2: i18n, multi-platform, real-time, alerts)._
