# docs/format.md — Blueprint cho Thư viện Docs

## Mục đích

File này là blueprint/chỉ dẫn định hướng cho toàn bộ thư viện tài liệu trong `docs/`. Mỗi section ghi rõ **file nào chứa gì**, **đối tượng đọc là ai**, và **cần update khi nào**.

---

## Cấu trúc thư viện docs

```
docs/
├── README.md                        ← Chỉ mục + đường dẫn nhanh
├── format.md                       ← [BẠN ĐANG ĐỌC] Blueprint này
│
├── README.md (gateway)
│   └── [1] GATEWAY — giới thiệu ngắn + links tới 2/3/4
│
├── technical-spec.md               ← [2] KỸ THUẬT (EN) — dev, recruiter
├── vi-technical-spec.md           ← [2] KỸ THUẬT (VN) — dev, recruiter
│
├── user-guide.md                   ← [3] TRẢI NGHIỆM (EN) — end-user
├── vi-user-guide.md               ← [3] TRẢI NGHIỆM (VN) — end-user
│
├── report/
│   ├── abstract.md                 ← Tóm tắt 150-300 từ
│   ├── report.md                  ← Báo cáo đồ án 7 chương
│   └── figures/                   ← Ảnh màn hình minh họa
│
└── slides/
    └── slides.md                   ← Slide dạng Markdown (Marp format)
```

---

## [1] GATEWAY — README.md

> **Đối tượng:** Recruiter, PM, stakeholder, người mới nhìn lần đầu
> **Mục đích:** "Cái gì, tại sao, dùng cái gì" — gây ấn tượng đầu tiên

**Giới hạn:** ~50 dòng. Không Tech Debt. Không Structure tree. Không Recent Changes.

**Bắt buộc có:**
- Tagline 1-2 dòng
- Tech stack badge table
- "Tại sao có hệ thống này?" (2-3 câu)
- 3-4 Highlights (mỗi dòng 1 feature chính)
- Quick Start: `npm install && npm run dev`
- Bảng Documentation links ở cuối

**Luôn 2 ngôn ngữ:** `README.md` (EN) + `README-vi.md` (VN)

**Update khi:** Tech stack đổi, feature lớn merge, hoặc rename project

---

## [2] TECHNICAL SPEC — docs/technical-spec.md / vi-technical-spec.md

> **Đối tượng:** Developer, recruiter, tech lead, reviewer
> **Mục đích:** Show kiến trúc, bài toán khó, tối ưu, điểm cạnh tranh

**Độ dài:** ~30-40 trang khi export PDF

### Cấu trúc bắt buộc

```
1. Problem & Solution
   1.1 Problem Statement
   1.2 Solution Overview
   1.3 Key Differentiators

2. System Architecture
   2.1 High-Level Architecture         ← ASCII diagram
   2.2 Module Breakdown                 ← Bảng: module / trách nhiệm / tech
   2.3 Data Flow                        ← ASCII diagram: request → storage → response
   2.4 API Design                       ← Bảng endpoints + response format + error format

3. Technology Decisions
   3.1 Why This Stack?                  ← Bảng: decision / choice / trade-off
   3.2 Architecture Decisions (ADR)     ← Bảng: ADR / decision / rationale

4. Hard Problems Solved
   4.1 [Bài toán 1]                     ← Problem / Approach / Code snippet / Result
   4.2 [Bài toán 2]
   4.3 [Bài toán 3]
   4.4 [Bài toán 4]                     ← Tối thiểu 4 bài toán khó nhất

5. Optimizations
   5.1 Performance                      ← Bảng: before / after / technique
   5.2 Cost                             ← Bảng: operation / cost method
   5.3 Developer Experience             ← Bảng: improvement / impact

6. Competitive Advantages
   ← 3-5 điểm cạnh tranh, mỗi điểm 1-2 câu

7. Security Model
   ← Auth, authorization, data protection, API security

8. Known Limitations
   ← Bảng: limitation / impact / workaround

9. Future Roadmap
   ← 5-7 checkbox items
```

**Điểm nhấn cho recruiter (Section 4 + 5):**
- Section 4: bài toán khó + cách giải → show tư duy
- Section 5: con số cụ thể → show đo lường
- Section 6: điểm khác biệt → show giá trị

**Luôn 2 ngôn ngữ:** EN + VN, đồng bộ cấu trúc, chỉ thay ngôn ngữ mô tả, KHÔNG dịch code

**Update khi:** Feature lớn merge, tech stack đổi, bài toán khó mới được giải, tối ưu mới

---

## [3] USER GUIDE — docs/user-guide.md / vi-user-guide.md

> **Đối tượng:** End-user, non-tech reader, HR, recruiter
> **Mục đích:** Hình dung được hệ thống làm gì, dùng thế nào — không cần nhìn code

**Độ dài:** ~15-20 trang khi export PDF

### Cấu trúc bắt buộc

```
1. What Is This?
   ← 2-3 đoạn ngắn, so sánh với thứ người đọc đã biết
   ← ASCII diagram đơn giản: User → System → Result

2. Features
   2.1 [Tính năng 1] — Chat nhân vật
   2.2 [Tính năng 2] — Phòng thi
   2.3 [Tính năng 3] — Chấm điểm AI
   2.4 [Tính năng 4] — Đa vũ trụ
   Mỗi tính năng:
     - What it does: 1-2 câu
     - How to use: 3-4 bước
     - Result: màn hình gì / thông báo gì

3. Step-by-Step Walkthrough
   3.1 First-time setup
   3.2 Core workflow (5-7 bước)
   3.3 Advanced features

4. Screenshots
   ← Mô tả từng screenshot: "Màn hình hiển thị A, B, C..."
   ← [PLACEHOLDER: đường dẫn ảnh cụ thể]

5. Troubleshooting
   ← Bảng: problem / solution

6. FAQ
   ← 5-7 Q&A
```

**Nguyên tắc viết:**
- Không code, không jargon
- Nhiều hình ảnh/ASCII diagram
- Ngôn ngữ đơn giản

**Luôn 2 ngôn ngữ:** EN + VN, đồng bộ cấu trúc

**Update khi:** Tính năng mới được thêm, UI thay đổi lớn

---

## [4] REPORT — docs/report/

> **Đối tượng:** Thầy/cô hội đồng chấm đồ án, người đọc non-tech
> **Mục đích:** Báo cáo đồ án chuẩn 7 chương, ai đọc cũng hiểu

**Độ dài:** ~45-60 trang khi export

### Cấu trúc bắt buộc

```
PHẦN MỞ ĐẦU
├── Trang bìa                           ← Template của trường
├── Lời cam đoan                        ← Template của trường
├── Lời cảm ơn                          ← Tự viết
├── Mục lục + Danh mục hình/bảng        ← Tự động từ Markdown
├── abstract.md (tóm tắt)               ← [Để riêng hoặc dán vào đầu Chương 1]
│
CHƯƠNG 1: GIỚI THIỆU                    (~5 trang)
├── 1.1 Thực trạng dạy & học Ngữ Văn THCS
├── 1.2 Mục tiêu đề tài
├── 1.3 Phạm vi & Giới hạn
├── 1.4 Kết cấu báo cáo
│
CHƯƠNG 2: CƠ SỞ LÝ THUYẾT & CÔNG NGHỆ  (~6-8 trang)
├── 2.1 Trí tuệ nhân tạo trong giáo dục (AI-Ed)
├── 2.2 Các công nghệ sử dụng
│   ├── 2.2.1 React 19 + Vite + Tailwind CSS v4
│   ├── 2.2.2 Cloudflare Pages Functions + D1 + Workers KV
│   └── 2.2.3 Workers AI & Gemma 3
├── 2.3 So sánh với giải pháp hiện có
│
CHƯƠNG 3: KHẢO SÁT & PHÂN TÍCH YÊU CẦU  (~6-8 trang)
├── 3.1 Khảo sát nhu cầu
├── 3.2 Phân tích tác nhân (Actor)
├── 3.3 Yêu cầu chức năng
├── 3.4 Yêu cầu phi chức năng
├── 3.5 Biểu đồ Use-case
│
CHƯƠNG 4: THIẾT KẾ HỆ THỐNG             (~6-8 trang)
├── 4.1 Sơ đồ kiến trúc tổng quan
├── 4.2 Luồng dữ liệu
├── 4.3 Thiết kế cơ sở dữ liệu (ER)
├── 4.4 Thiết kế API
├── 4.5 Thiết kế giao diện
│
CHƯƠNG 5: CÀI ĐẶT HỆ THỐNG              (~6-8 trang)
├── 5.1 Môi trường phát triển
├── 5.2 Triển khai module Frontend
├── 5.3 Triển khai module Backend
├── 5.4 Triển khai module AI
├── 5.5 Triển khai cơ sở dữ liệu
│
CHƯƠNG 6: KẾT QUẢ & THỬ NGHIỆM          (~8-10 trang)  ← NẶNG NHẤT
├── 6.1 Kết quả giao diện từng tính năng
│   ├── 6.1.1 Chat nhân vật              [PLACEHOLDER: ảnh chụp màn hình]
│   ├── 6.1.2 Phòng thi                 [PLACEHOLDER: ảnh chụp màn hình]
│   ├── 6.1.3 Chấm điểm AI              [PLACEHOLDER: ảnh chụp màn hình]
│   └── 6.1.4 Đa vũ trụ                [PLACEHOLDER: ảnh chụp màn hình]
├── 6.2 Các bài toán khó đã giải quyết
│   ├── Bài toán 1: N+1 DB insert trong streaming chat
│   ├── Bài toán 2: AI chấm điểm không có rubric context
│   ├── Bài toán 3: SQL injection trong batch submission
│   └── Bài toán 4: Multiverse error isolation
├── 6.3 Đánh giá hệ thống
│
CHƯƠNG 7: KẾT LUẬN & HƯỚNG PHÁT TRIỂN   (~2-3 trang)
├── 7.1 Tổng kết
├── 7.2 Hạn chế
├── 7.3 Hướng phát triển
│
TÀI LIỆU THAM KHẢO
PHỤ LỤC
    ├── A. Mã nguồn quan trọng
    └── B. Bảng câu hỏi khảo sát (nếu có)
```

### Quy ước placeholder cho ảnh

```
[PLACEHOLDER: docs/report/figures/login-page.png]
[PLACEHOLDER: docs/report/figures/student-dashboard.png]
[PLACEHOLDER: docs/report/figures/teacher-library.png]
[PLACEHOLDER: docs/report/figures/character-chat.png]
[PLACEHOLDER: docs/report/figures/exam-room.png]
[PLACEHOLDER: docs/report/figures/grading-rubric.png]
[PLACEHOLDER: docs/report/figures/multiverse-branching.png]
[PLACEHOLDER: docs/report/figures/architecture-diagram.png]
[PLACEHOLDER: docs/report/figures/er-diagram.png]
```

### abstract.md — Yêu cầu

- **Độ dài:** 150-300 từ
- **Ngôn ngữ:** Tiếng Việt (có thể copy/paste dịch sang EN nếu cần)
- **Cấu trúc:**
  1. Bài toán (1-2 câu): thực trạng Ngữ Văn THCS
  2. Cách tiếp cận (2-3 câu): platform gì, dùng tech gì
  3. Tính năng chính (2-3 câu): chat nhân vật, đa vũ trụ, chấm AI
  4. Kết quả (1-2 câu): đã đạt được gì, hạn chế gì
  5. Từ khóa: AI, Vietnamese literature, Cloudflare, Workers AI

---

## [5] SLIDES — docs/slides/slides.md

> **Đối tượng:** Hội đồng chấm (trình chiếu), buổi thuyết trình
> **Format:** Marp Markdown (https://marp.app/)
> **Mục đích:** Slide ngắn gọn, trực quan, dùng được ngay

### Cấu trúc gợi ý

```
---marp---
theme: default
paginate: true
---

# Slide 1: Tên đề tài
# Slide 2: Mục lục
# Slide 3: Thực trạng
# Slide 4: Mục tiêu
# Slide 5: Sơ đồ kiến trúc      ← [PLACEHOLDER: hình kiến trúc]
# Slide 6: Demo: Login
# Slide 7: Demo: Chat nhân vật
# Slide 8: Demo: Phòng thi
# Slide 9: Demo: Chấm điểm AI
# Slide 10: Demo: Đa vũ trụ
# Slide 11: Kết quả đạt được
# Slide 12: Hạn chế & Hướng phát triển
# Slide 13: Cảm ơn
```

**Update khi:** Báo cáo hoàn thành, trước buổi thuyết trình

---

## Tổng hợp bảng: Doc / File / Audience / Update trigger

| Layer | File | Audience | Update trigger |
|-------|------|----------|----------------|
| Gateway | `README.md`, `README-vi.md` | Recruiter, PM, stakeholder | Tech stack đổi, feature lớn |
| Technical Spec | `technical-spec.md`, `vi-technical-spec.md` | Dev, tech lead, recruiter | Bài toán khó mới, tối ưu mới, tech đổi |
| User Guide | `user-guide.md`, `vi-user-guide.md` | End-user, HR | Tính năng mới, UI thay đổi lớn |
| Report | `report/abstract.md`, `report/report.md` | Hội đồng, thầy/cô | Hoàn thành báo cáo |
| Slides | `slides/slides.md` | Hội đồng, thuyết trình | Trước buổi bảo vệ |

---

## Nguyên tắc chung cho toàn bộ docs

### Một số quy tắc vàng

1. **Tech Debt + Recent Changes** — ghi vào `CLAUDE.md`, KHÔNG ghi trong README/report
2. **Luôn 2 ngôn ngữ** (EN+VN) cho mọi user-facing doc (gateway, user-guide, tech-spec)
3. **Không dịch code** — giữ nguyên code snippet trong cả 2 ngôn ngữ
4. **Đồng bộ format** giữa bản EN và VN (cùng số mục, cùng cấu trúc bảng)
5. **PLACEHOLDER** dùng dấu ngoặc vuông `[]` ghi rõ đường dẫn ảnh thật
6. **Báo cáo viết 1 bản tiếng Việt** — ai đọc cũng hiểu, không cần bản EN

### Tỷ lệ ước tính (tổng ~150-200 trang docs khi export)

```
README (gateway)          ~2 trang
Technical Spec (EN+VI)    ~60 trang
User Guide (EN+VI)        ~30 trang
Report                    ~60 trang
Slides                   ~20 slides
─────────────────────────
TỔNG                     ~150-200 trang
```

### Tỷ lệ độ quan trọng

```
[5] Chương 6 (Kết quả) — chiếm 25-30% toàn bộ báo cáo
[4] Chương 4 (Thiết kế) + Chương 5 (Cài đặt) — mỗi chương 15-20%
[3] Chương 2 (Lý thuyết) + Chương 3 (Yêu cầu) — mỗi chương 10-15%
[2] Chương 1 (Giới thiệu) — 5-8%
[1] Chương 7 (Kết luận) — 3-5%
```
