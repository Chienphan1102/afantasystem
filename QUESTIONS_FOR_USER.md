# ❓ QUESTIONS FOR USER — Trước khi bắt đầu code (Prompt 2)

> **Quy ước:**
>
> - Mỗi câu có **gợi ý mặc định** (Claude khuyến nghị) — nếu user lười, cứ chọn mặc định.
> - User trả lời theo format `Q[số]: <câu trả lời>` rồi paste lại cho Claude Code.
> - Câu nào quan trọng đặc biệt sẽ đánh dấu 🚨 (không thể bỏ qua).
> - Câu nào có thể quyết sau (Phase 2+) sẽ đánh dấu ⏳.

---

## 🅰️ NHÓM A — DANH TÍNH & THƯƠNG HIỆU

### 🚨 Q1: Tên domain dự kiến?

- **Mặc định:** `afanta.com` (theo Master Plan)
- **Cần biết để:** Cấu hình CORS, OAuth redirect, email sender, branding UI
- **Bạn trả lời:** **\*\***\_**\*\***

### Q2: Tên hiển thị thương hiệu trên UI?

- **Mặc định:** `AFANTA` (chữ in hoa, không dấu)
- **Bạn trả lời:** **\*\***\_**\*\***

### Q3: Email sender mặc định cho hệ thống (gửi alert, OTP, báo cáo)?

- **Mặc định:** `noreply@afanta.com` (cần setup sau, Phase 1 dùng tài khoản Gmail App Password tạm)
- **Bạn trả lời:** **\*\***\_**\*\***

---

## 🅱️ NHÓM B — HẠ TẦNG DEV

### 🚨 Q4: Database trong Phase 1 dùng gì?

- **(a)** Postgres trong Docker local — **Claude khuyến nghị**, miễn phí, chủ động
- **(b)** Supabase free tier ngay từ đầu — quen interface từ sớm, có RLS sẵn
- **Bạn chọn:** **\*\***\_**\*\***
- _Nếu chọn (b), cần URL + ANON_KEY + SERVICE_ROLE_KEY của project Supabase_

### 🚨 Q5: GitHub repo URL?

- **Mặc định:** Tạo mới `https://github.com/<your-username>/afanta`
- **Cần biết để:** Cấu hình CI/CD ở Prompt 2, push code backup cuối ngày
- **Nếu chưa có:** Trả lời "Chưa có, cứ tạo mới giúp tôi tên `afanta`" và Claude sẽ hướng dẫn `gh repo create`
- **Bạn trả lời:** **\*\***\_**\*\***

### Q6: GitHub username + email Git config?

- **Mặc định:** Lấy từ `git config --global user.name` / `user.email` đã có trên máy
- **Cần biết để:** Commit message ghi đúng tác giả
- **Bạn trả lời:** **\*\***\_**\*\***

### ⏳ Q7: Có dùng Vercel/Cloudflare Pages cho Frontend không (Phase 2 mới deploy)?

- **Mặc định:** Vercel — free tier rộng, tích hợp GitHub mượt
- **Bạn trả lời:** **\*\***\_**\*\*** (có thể bỏ qua, quyết Phase 2)

---

## 🅲 NHÓM C — TÀI KHOẢN & QUYỀN HẠN

### 🚨 Q8: Email Owner mặc định để seed (super admin đầu tiên)?

- **Đề xuất:** Dùng email cá nhân của bạn — `bepbalieu.jup@gmail.com`?
- **Cần biết để:** Tạo tài khoản Owner trong DB seed, login lần đầu
- **Bạn trả lời:** **\*\***\_**\*\***

### 🚨 Q9: Master Password ban đầu cho Owner?

- **Lưu ý:** Đây là mật khẩu **không thể khôi phục** nếu quên (Zero-knowledge). Phải cực kỳ chắc tay.
- **Mặc định:** Để user TỰ ĐẶT khi login lần đầu, KHÔNG seed cứng vào code
- **Bạn trả lời:** **\*\***\_**\*\*** (chọn "tự đặt khi login lần đầu" là an toàn nhất)

### Q10: Phase 1 có cần multi-tenant chưa?

- **(a)** KHÔNG — chỉ 1 tenant duy nhất (đơn giản hơn) — **Claude khuyến nghị**
- **(b)** CÓ — chuẩn bị multi-tenant từ Phase 1 (DB schema có `tenant_id` everywhere)
- **Bạn chọn:** **\*\***\_**\*\***

---

## 🅳 NHÓM D — CẤU HÌNH NGHIỆP VỤ

### 🚨 Q11: Múi giờ mặc định?

- **Mặc định:** `Asia/Ho_Chi_Minh`
- **Cần biết để:** Cron 6h/lần chạy theo giờ VN, format ngày trên UI
- **Bạn trả lời:** **\*\***\_**\*\***

### Q12: Ngôn ngữ mặc định Phase 1?

- **Mặc định:** Tiếng Việt — Phase 1 chỉ làm 1 ngôn ngữ
- **Bạn trả lời:** **\*\***\_**\*\***

### Q13: Tài khoản YouTube test để demo cuối Phase 1?

- **Cần biết để:** Bạn tự test luồng Add Account ở Prompt 7, demo end-to-end ở Prompt 9
- **Đề xuất:** Tạo 1 kênh YouTube cá nhân của bạn, hoặc dùng kênh sandbox
- **Bạn trả lời:** **\*\***\_**\*\*** (có/chưa, tên kênh nếu có)

### ⏳ Q14: Tài khoản Facebook Page test?

- **Phase 1 cuối mới cần** — có thể quyết sau
- **Bạn trả lời:** **\*\***\_**\*\***

---

## 🅴 NHÓM E — NHÂN LỰC & BUDGET

### Q15: Bạn làm solo hay có team?

- **Mặc định:** Solo + Claude Code (vibe-coding)
- **Cần biết để:** Quyết định độ phức tạp setup CI/CD, doc phải đầy đủ ra sao
- **Bạn trả lời:** **\*\***\_**\*\***

### Q16: Có DevOps engineer hỗ trợ Phase 2-3 không?

- **Cần biết để:** Phase 1 chỉ dùng Docker Compose local; Phase 2 mới quyết Kubernetes hay PaaS
- **Bạn trả lời:** **\*\***\_**\*\***

### ⏳ Q17: Ngân sách proxy hằng tháng (USD)?

- **Phase 1 KHÔNG cần proxy** (test local) — câu này chỉ để biết Phase 2+ tính toán pool
- **Mức tham khảo:**
  - Khởi nghiệp: $50-100/tháng (5-10 IP residential)
  - Vừa: $200-500/tháng (50 IP)
  - Lớn: $1000+/tháng (mobile + ISP proxy cho VIP)
- **Bạn trả lời:** **\*\***\_**\*\***

### ⏳ Q18: Có muốn dùng Claude API hoặc OpenAI cho AI Insights (Phase 3)?

- **Bạn trả lời:** **\*\***\_**\*\***

---

## 🅵 NHÓM F — RỦI RO & PHÁP LÝ

### 🚨 Q19: Bạn có biết việc dùng Cookie scraping VI PHẠM Terms of Service của Meta/Google không?

- **(a)** Biết, chấp nhận rủi ro, vẫn làm cho mục đích nội bộ doanh nghiệp
- **(b)** Không biết, muốn Claude giải thích kỹ trước khi quyết
- **(c)** Chỉ làm với Official API (không scraping) — **an toàn nhất, nhưng giới hạn data**
- **Bạn chọn:** **\*\***\_**\*\***
- _Master Plan đề xuất chiến lược HYBRID — mặc định Official API, fallback scraping khi cần._

### 🚨 Q20: Có cần tuân thủ Nghị định 13/2023 (Bảo vệ dữ liệu cá nhân Việt Nam) ngay từ Phase 1?

- **(a)** Có — phải có DPO, consent form, data residency tại VN ngay
- **(b)** Phase 1 chỉ test nội bộ, Phase 3 mới chuẩn hoá khi go-to-market — **Claude khuyến nghị**
- **Bạn chọn:** **\*\***\_**\*\***

### Q21: Có cần SSO (đăng nhập 1 lần với Google/Microsoft) ngay Phase 1?

- **Mặc định:** KHÔNG — Phase 1 chỉ cần email/password + 2FA TOTP. SSO đẩy Phase 3.
- **Bạn trả lời:** **\*\***\_**\*\***

---

## 🅶 NHÓM G — UX & DEMO

### Q22: Embedded Browser (Add Account flow Prompt 7) chạy thế nào?

- **(a)** Electron desktop app — tốt nhất cho UX, nhưng phức tạp hơn
- **(b)** Playwright UI mode chạy local + WebSocket bridge tới web UI — **Claude khuyến nghị Phase 1**, nhanh + ít code hơn
- **Bạn chọn:** **\*\***\_**\*\***

### Q23: Khi demo cuối Phase 1, bạn show cho ai?

- **Cần biết để:** Quyết định độ "đẹp" của UI (rough hay polish)
- **Bạn trả lời:** **\*\***\_**\*\*** (vd: tự xem, demo cho 1 khách, demo cho team 5 người, …)

---

## 📦 TÓM TẮT — Câu hỏi TỐI THIỂU phải trả lời để bắt đầu Prompt 2

Nếu bận, chỉ cần trả lời 6 câu BẮT BUỘC này thôi (đánh dấu 🚨):

```
Q1: <domain>
Q4: <Postgres Docker / Supabase>
Q5: <GitHub repo URL hoặc "tạo mới">
Q8: <email Owner>
Q11: <múi giờ>
Q19: <chấp nhận rủi ro ToS hay chỉ Official API>
```

Các câu còn lại Claude sẽ dùng mặc định (đã liệt kê) — bạn có thể chỉnh sau.

---

_Tạo lần đầu: 2026-04-29 (Prompt 1 — Onboarding)_
