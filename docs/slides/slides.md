---
marp: true
theme: default
paginate: true
marpOptions:
  html: true
  style: |
    section {
      background-color: #0f172a;
      color: #f1f5f9;
    }
    h1 { color: #38bdf8; }
    h2 { color: #7dd3fc; }
    strong { color: #fde047; }
    code { color: #86efac; }
    section.title {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    }
---

<!-- _class: title -->

# [TÊN ĐỀ TÀI]

### [TÊN ĐỀ TÀI ĐẦY ĐỦ]

**[Họ và tên SV] — [Mã số sinh viên]**

*GV hướng dẫn: [Tên GV]*

**[Logo trường / Tên trường] — [Năm]**

---

## Nội dung trình bày

1. Thực trạng & Mục tiêu
2. Kiến trúc hệ thống
3. Tính năng chính
4. Kết quả đạt được
5. Hạn chế & Hướng phát triển

---

## 1. Thực trạng

- **Thực trạng:** Học sinh THCS tiếp cận văn học một cách **thụ động**
- Giáo viên khó cung cấp **phản hồi cá nhân hóa** cho từng học sinh
- Ít công cụ cho phép khám phá **"điều gì sẽ xảy ra nếu?"**

> [PLACEHOLDER: Biểu đồ thực trạng — có thể dùng hình từ báo cáo Chương 1]

---

## 2. Mục tiêu đề tài

Xây dựng **nền tảng Văn Học AI** — hệ thống web hỗ trợ dạy và học Ngữ Văn THCS có trợ giúp AI, với ba tính năng cốt lõi:

- 🤖 Chat nhân vật văn học real-time
- 🌌 Đa vũ trụ — khám phá câu chuyện theo nhiều nhánh
- 📝 Chấm điểm AI theo rubric có cấu trúc

---

## 3. Kiến trúc hệ thống

```
[PLACEHOLDER: Sơ đồ kiến trúc — dán hình từ docs/report/figures/architecture-diagram.png]

Browser (React 19)
        │  HTTPS + JWT
        ▼
Cloudflare Edge
├─ Pages Functions (API)
├─ Workers AI (Gemma 3)
├─ Workers KV (cache + rate limit)
└─ D1 (SQLite)
```

---

## 4. Tính năng 1 — Chat nhân vật

> [PLACEHOLDER: Ảnh chụp màn hình Chat nhân vật — docs/report/figures/character-chat.png]

- Học sinh chọn tác phẩm → chọn nhân vật → trò chuyện real-time
- AI phản hồi **trong nhân vật** — biết tiểu sử, động cơ, thời đại
- Streaming response: phản hồi hiện từng chữ một
- Lịch sử hội thoại được lưu lại

---

## 5. Tính năng 2 — Phòng thi

> [PLACEHOLDER: Ảnh chụp màn hình Phòng thi — docs/report/figures/exam-room.png]

- Học sinh làm bài thi với **tự động lưu**
- Không mất bài khi đóng trình duyệt
- Nộp bài → AI chấm theo rubric

---

## 6. Tính năng 3 — Chấm điểm AI

> [PLACEHOLDER: Ảnh chụp màn hình Grading — docs/report/figures/grading-rubric.png]

- Mỗi tiêu chí rubric: điểm số **+ comment rõ ràng**
- Giáo viên có thể kiểm tra, ghi đè từng điểm
- Không phải black-box — **minh bạch**

---

## 7. Tính năng 4 — Đa vũ trụ

> [PLACEHOLDER: Ảnh chụp màn hình Multiverse — docs/report/figures/multiverse-branching.png]

- Giáo viên tạo nhiều kết thúc thay thế cho tác phẩm
- Học sinh chọn nhánh → đọc kịch bản mới
- Khám phá "**What if?**" — điều gì xảy ra nếu?

---

## 8. Công nghệ sử dụng

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Cloudflare Pages Functions (ES modules) |
| Database | Cloudflare D1 (SQLite) |
| AI | Workers AI — Gemma 3 4B |
| Auth | JWT via `jose` |

---

## 9. Các bài toán khó đã giải quyết

| Bài toán | Giải pháp |
|----------|-----------|
| N+1 DB insert khi streaming | Defer insert — 1 write thay vì 62 writes |
| AI chấm không có rubric | Load criteria từ DB → inject vào prompt |
| SQL injection in batch insert | Parameterized SQL (D1 UNNEST) |
| Multiverse silent failure | try/catch riêng mỗi method + empty-content guard |

---

## 10. Kết quả đạt được

- ✅ Hoàn thành **4 tính năng** cốt lõi theo thiết kế
- ✅ Tích hợp **AI real-time** tại edge (không GPU riêng)
- ✅ Chi phí vận hành **gần bằng không** (Cloudflare free tier)
- ✅ Triển khai thực tế tại Cloudflare Pages

> [PLACEHOLDER: Thêm số liệu cụ thể nếu có: số user, số bài nộp, thời gian AI response...]

---

## 11. Hạn chế

- ⚠️ Gemma 3 4B có giới hạn suy luận (yếu hơn GPT-4/Claude)
- ⚠️ Chưa hỗ trợ real-time collaboration trên cùng nhánh đa vũ trụ
- ⚠️ JWT revocation chỉ phía client (server-side revoke pending)

---

## 12. Hướng phát triển

- 🔮 Durable Objects cho **shared multiverse sessions** (nhiều HS cùng nhìn 1 nhánh)
- 🔮 Voice input cho **character chat** (luyện phát âm)
- 🔮 Parent portal — **phụ huynh** xem kết quả con em
- 🔮 Teacher override logging — **audit trail** khi GV đổi điểm AI

---

<!-- _class: title -->

# Cảm ơn thầy/cô đã lắng nghe

**[Họ tên SV] — [Mã số sinh viên]**

*GV hướng dẫn: [Tên GV]*

**Câu hỏi?** 🎤
