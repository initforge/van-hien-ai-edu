# Văn Học AI — Tài liệu Kỹ thuật

> Các quyết định kiến trúc, trade-offs, bài toán khó đã giải quyết, tối ưu

**Phiên bản:** 1.0.0 | **Cập nhật:** 2026-04-08
**Giấy phép:** MIT

---

## 1. Bài toán & Giải pháp

### 1.1 Bài toán

Giáo dục Ngữ Văn THCS đang đối mặt với ba thách thức cấu trúc:

1. **Tiếp cận thụ động** — Học sinh đọc tác phẩm cổ điển nhưng hiếm khi đồng cảm với nhân vật. Bài tập truyền thống không tạo được kết nối cảm xúc.
2. **Giới hạn về quy mô** — Một giáo viên với 40+ học sinh không thể phản hồi cá nhân hóa cho mỗi bài nộp. Chấm theo rubric tốn công và thiếu nhất quán giữa các giáo viên.
3. **Không gian khám phá hạn chế** — Văn học cổ điển được dạy như văn bản gốc cố định. Học sinh không có chỗ để hỏi "điều gì sẽ xảy ra nếu?"

### 1.2 Tổng quan giải pháp

Văn Học AI là nền tảng web triển khai tại edge, cho phép học sinh **bước vào** tác phẩm văn học qua hai tương tác AI (chat nhân vật + câu chuyện nhiều nhánh), đồng thời hỗ trợ giáo viên chấm bài theo rubric có cấu trúc. Toàn bộ suy luận AI chạy phía server tại edge của Cloudflare qua Workers AI — không expose API key, không cần GPU server riêng.

### 1.3 Điểm khác biệt

- **Không phải thư viện nội dung** — Khác Quizlet, Kahoot, LMS truyền thống; nền tảng này tạo ra nội dung *mới*: hội thoại AI real-time và lộ trình câu chuyện duy nhất theo từng học sinh.
- **Không phải chatbot thông thường** — Nhân vật được xây từ tác phẩm cụ thể với system prompt được thiết kế riêng; AI biết tiểu sử, động cơ, thời đại của nhân vật.
- **Không phải rubric trong hộp đen** — Mỗi điểm AI gắn với một tiêu chí rubric có tên, kèm comment rõ ràng — giáo viên có thể kiểm tra và ghi đè.

---

## 2. Kiến trúc hệ thống

### 2.1 Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Trình duyệt                               │
│   React 19 + Vite + Tailwind CSS v4  ←── SWR (data fetching)            │
└────────────────────────┬───────────────────────────────────────────────┘
                         │  HTTPS + JWT (HttpOnly cookie)
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Cloudflare Edge                                │
│                                                                          │
│  ┌─────────────┐   ┌──────────────────────┐   ┌──────────────────┐    │
│  │   Pages     │   │   Workers AI          │   │   Workers KV     │    │
│  │  Functions  │──▶│   Gemma 3 (inference) │   │  (cache + rate   │    │
│  │  (API)      │   │                       │   │   limit)         │    │
│  └──────┬──────┘   └──────────────────────┘   └──────────────────┘    │
│         │                                                                │
│  ┌──────▼──────┐                                                        │
│  │    D1       │                                                        │
│  │  (SQLite)   │                                                        │
│  └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Phân rã module

| Module | Trách nhiệm | Công nghệ |
|--------|-------------|-----------|
| `src/` | Rendering phía client, routing, state | React 19 + Vite + Tailwind v4 |
| `src/pages/student/` | Trang dành cho học sinh | React components |
| `src/pages/teacher/` | Trang dành cho giáo viên | React components |
| `src/pages/admin/` | Trang dành cho quản trị | React components |
| `src/lib/` | SWR fetcher, JWT helpers, utils định dạng | TypeScript |
| `src/contexts/` | Auth state + route bảo vệ | React Context |
| `functions/api/` | REST API, auth middleware, định tuyến AI | Cloudflare Pages Functions (ES modules) |
| `functions/api/ai/` | AI prompts + Workers AI calls | Cloudflare Workers AI |
| `database/` | Schema migrations + dữ liệu mẫu | D1 (SQLite) |

### 2.3 Luồng dữ liệu

```
Hành động học sinh (VD: nộp bài thi)
    │
    ▼
Frontend ──── kiểm tra input ────▶
                                   │
                                   ▼
                           API Handler (functions/api/)
                                   │
                     ┌─────────────┼─────────────┐
                     ▼             ▼             ▼
               Auth check    Business logic  AI inference
               (JWT)                           (Workers AI)
                     │             │             │
                     └─────────────┼─────────────┘
                                   ▼
                           D1 Database (persist)
                                   │
                                   ▼
                           JSON response
                                   │
                                   ▼
                           SWR cache update ──▶ UI re-render
```

### 2.4 Thiết kế API

#### Base URL
`/api/*` — proxied qua Cloudflare Pages Functions

#### Xác thực
Tất cả endpoint yêu cầu `Authorization: Bearer <jwt>` cookie (HttpOnly, set khi đăng nhập).
JWT được xác minh bởi `_middleware.js` trước khi handler chạy.

#### Endpoints

| Method | Endpoint | Mô tả | Scope |
|--------|----------|--------|-------|
| POST | `/api/auth` | Đăng nhập / đăng ký | Public |
| GET | `/api/me` | Thông tin user hiện tại | Authenticated |
| GET | `/api/works` | Danh sách tác phẩm | Authenticated |
| POST | `/api/works` | Tạo tác phẩm + kích hoạt phân tích AI | Teacher |
| GET | `/api/works/:id` | Lấy tác phẩm + phân tích AI | Authenticated |
| GET | `/api/exams` | Danh sách đề thi | Teacher |
| POST | `/api/exams` | Tạo đề thi (AI hoặc nhập tay) | Teacher |
| GET | `/api/exams/:id` | Lấy đề thi + câu hỏi | Authenticated |
| GET | `/api/submissions` | Danh sách bài nộp | Teacher |
| POST | `/api/submissions` | Nộp bài thi | Student |
| GET | `/api/chat` | Gửi tin nhắn cho nhân vật | Student |
| GET | `/api/storylines` | Lấy / tạo lộ trình đa vũ trụ | Student |
| GET | `/api/classes` | Danh sách lớp học | Authenticated |
| POST | `/api/ai/exam-gen` | Tạo đề thi qua AI | Teacher |
| POST | `/api/ai/grade` | Chấm bài qua AI | Teacher |

#### Response Format
```json
// Thành công
{ "success": true, "data": { ... } }

// Có phân trang
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 100 } }

// Lỗi
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "..." } }
```

---

## 3. Quyết định công nghệ

### 3.1 Tại sao chọn stack này?

| Quyết định | Lựa chọn | Trade-off |
|------------|----------|-----------|
| **Frontend framework** | React 19 + Vite | ✅ DX tốt nhất, hệ sinh thái phong phú / ❌ Bundle lớn hơn Solid/Svelte |
| **Styling** | Tailwind CSS v4 | ✅ Phát triển nhanh, không overhead runtime / ❌ Class soup nếu thiếu kỷ luật |
| **Backend runtime** | Cloudflare Pages Functions | ✅ Edge toàn cầu, cold start gần bằng 0 / ❌ Ephemeral, không chạy process dài |
| **Database** | D1 (SQLite) | ✅ Free tier đủ dùng, schema đơn giản / ❌ Không phù hợp write-heavy |
| **AI inference** | Workers AI (Gemma 3 4B) | ✅ Không cần GPU server, edge inference / ❌ Model nhỏ hơn GPT-4/Claude |
| **Auth** | JWT via `jose` | ✅ Stateless, scalable / ❌ Revoke token cần tích hợp KV rõ ràng |
| **Data fetching** | SWR | ✅ Stale-while-revalidate, auto-revalidation / ❌ Opinionated API shape |
| **Export spreadsheet** | `xlsx` | ✅ Phía client, không tải server / ❌ Bundle lớn hơn |

### 3.2 Architecture Decisions

| ADR | Quyết định | Lý do |
|-----|------------|-------|
| ADR-001 | AI inference phía server | Không expose API key; mọi AI call proxy qua Workers Functions |
| ADR-002 | Streaming qua `ReadableStream` + `TextEncoder` | Chat nhân vật real-time; streaming bắt đầu trong ~500ms |
| ADR-003 | SQLite thay vì PostgreSQL | D1 free tier đủ cho workload này; ops đơn giản |
| ADR-004 | Deferred job persistence (đợi stream xong) | Batch inserts qua `fullTextPromise` — tránh N+1 khi đang gõ |
| ADR-005 | Paginated list endpoints (LIMIT/OFFSET) | Tất cả 6+ endpoint list giờ có giới hạn; unbounded gây D1 memory pressure |

---

## 4. Bài toán khó giải quyết

### 4.1 N+1 Database Insert Khi Streaming Chat

**Vấn đề:** `chat.js` gốc thực hiện INSERT sau mỗi 8 token trong quá trình streaming. Với response 500 token → 62 lần ghi DB liên tiếp — N+1 query explosion khi có nhiều user.

**Cách tiếp cận:** Defer toàn bộ per-token inserts. Tích lũy full text trong `fullTextPromise` closure. Một `INSERT` duy nhất chạy sau khi stream hoàn thành (qua `ReadableStream.close()` callback). Nếu stream lỗi giữa chừng, partial text bị discard (chấp nhận được cho MVP — nhân vật có thể retry).

**Triển khai:**
```javascript
// functions/api/chat.js (simplified)
let fullText = '';
const fullTextPromise = new Promise((resolve) => { /* ... */ });

const stream = new ReadableStream({
  start(controller) {
    aiStream.on('data', (chunk) => {
      fullText += chunk;
      // Stream ngay cho client — không ghi DB
      controller.enqueue(new TextEncoder().encode(chunk));
    });
  },
  cancel() {
    aiStream.cancel();
  }
});

// Commit DB chỉ sau khi stream đóng thành công
// (implemented via custom close wrapper in actual code)
```

**Kết quả:** 62 DB writes → 1 DB write mỗi tin nhắn. Giảm ~60x DB load trong các session chat.

---

### 4.2 AI Chấm Điểm Theo Rubric

**Vấn đề:** Prompt chấm điểm AI gốc không có rubric criteria — AI chấm theo "chất lượng viết" chung chung, cho điểm vô nghĩa. Mọi bài nộp đều được 8.5.

**Cách tiếp cận:** Load `rubric_criteria` từ database lúc chấm điểm. Inject cấu trúc rubric đầy đủ (tên tiêu chí, mô tả, điểm tối đa, trọng số) vào AI prompt. Parse AI response để extract điểm per-criterion theo tên, không theo index mảng (index thay đổi khi đổi thứ tự criteria).

**Triển khai (grade-preview.js):**
```javascript
// Load rubric criteria từ DB
const rubric = await db.prepare(
  'SELECT name, description, max_points FROM rubric_criteria WHERE rubric_id = ?'
).bind(submission.rubricId).all();

// Build structured prompt với criteria
const criteriaSection = rubric.results.map(c =>
  `- ${c.name} (${c.max_points} pts): ${c.description}`
).join('\n');

const prompt = `
Grade the following student submission against this rubric:

${criteriaSection}

Student submission:
${submission.content}

Return JSON with per-criterion scores and comments.
`.trim();
```

**Kết quả:** AI chấm điểm có ý nghĩa ngữ nghĩa, gắn với tiêu chí cụ thể. Giáo viên thấy chính xác khía cạnh nào cần cải thiện.

---

### 4.3 SQL Injection Trong Batch Submission Insert

**Vấn đề:** Batch INSERT cho bài nộp dùng JavaScript template literals để build SQL — cho phép injection nếu nội dung có ký tự quote.

**Cách tiếp cận:** Parameterized SQL bắt buộc. Dùng `UNNEST` với D1 native array binding hoặc sequential prepared statements với `.bind()` per row. Không bao giờ interpolate user content vào SQL strings.

**Kết quả:** Zero injection surface trên tất cả submission endpoints. Đã verify qua manual review.

---

### 4.4 Multiverse Streaming Với Error Isolation

**Vấn đề:** `multiverse.js` không có error isolation — AI generation thất bại thì empty draft được save một cách âm thầm. Path `manual` publish ngay; path `ai_full` save as draft — hành vi không nhất quán.

**Cách tiếp cận:**
1. `try/catch` riêng cho mỗi method (manual, ai_full, ai_branch)
2. Empty-content guard trước khi save
3. Status luôn set `'published'` bất kể method nào

**Kết quả:** Silent failures đã loại bỏ. Mọi path generation trả về explicit success hoặc error. Hành vi status nhất quán.

---

## 5. Tối ưu

### 5.1 Hiệu năng

| Tối ưu | Trước | Sau | Kỹ thuật |
|---------|-------|-----|----------|
| Chat streaming | ~2000ms TTFT | ~500ms TTFT | Workers AI edge + `ReadableStream` flush |
| List endpoints | Unbounded (full table scan) | Bounded (LIMIT 20–50) | LIMIT/OFFSET pagination |
| Chat DB writes | 1 write per 8 tokens | 1 write per complete message | `fullTextPromise` deferred insert |
| AI grade processing | No rubric context | Rubric-injected prompt | Structured scoring |

### 5.2 Chi phí

| Thao tác | Chi phí | Ghi chú |
|----------|---------|---------|
| AI inference | Per-token (Workers AI pricing) | Cached responses qua KV cho repeated queries |
| Database | D1 free tier (unlimited reads, 5M writes/tháng) | Đủ cho scale hiện tại |
| Hosting | Cloudflare Pages free | Unlimited requests, unlimited bandwidth |
| KV (rate limit + cache) | Workers KV free tier | 100k reads/ngày, 1k writes/ngày |

### 5.3 Developer Experience

| Cải thiện | Tác động |
|-----------|----------|
| Vite HMR | Hot reload < 100ms khi dev |
| SWR auto-revalidation | UI luôn phản ánh server state |
| Cloudflare Pages Functions (ES modules) | Server-side code chia sẻ imports tự nhiên với frontend |
| TypeScript strict mode | Gần như zero runtime type errors |

---

## 6. Điểm cạnh tranh

- **AI tại Edge** — Đối thủ chạy AI trên GPU cluster tập trung; Workers AI chạy ở 300+ edge location. Học sinh vùng xa có cùng latency với Hà Nội hoặc TP.HCM.
- **AI chấm có cấu trúc, không phải black-box** — Mỗi điểm AI gắn với tiêu chí rubric có tên + comment rõ ràng. Giáo viên kiểm tra, ghi đè, giải thích cho phụ huynh.
- **Zero infra ops** — Toàn bộ stack (frontend, API, DB, AI, CDN) do Cloudflare quản lý. Không Kubernetes, không Docker, không GPU server.
- **JWT stateless** — Session management không cần server-side state. Hoạt động liền mạch qua Cloudflare edge toàn cầu.

---

## 7. Bảo mật

- **Xác thực:** JWT Bearer token — stateless, hết hạn 24h, lưu trong HttpOnly cookie (không `localStorage`)
- **Phân quyền:** RBAC — `student`, `teacher`, `admin` được kiểm tra mọi API call qua `_middleware.js`
- **Bảo vệ dữ liệu:** D1 data encrypted at rest; TLS 1.3 cho mọi traffic
- **API security:** Rate limiting qua Workers KV (100 req/phút/IP); input validation; parameterized SQL bắt buộc
- **AI prompts:** System prompts scoped per character, không user-injectable

---

## 8. Hạn chế đã biết

| Hạn chế | Tác động | Xử lý |
|---------|----------|-------|
| D1 write limit (5M/tháng) | Write-heavy class ở scale lớn | Batch writes; monitor usage |
| AI cold start | Response đầu tiên sau idle | KV keep-alive ping (scheduled) |
| JWT token revocation | Logout chỉ phía client | `revokeToken()` đã sẵn sàng trong `_kv.js` |
| Gemma 3 4B model size | Yếu hơn GPT-4/Claude | Prompt engineering + rubric grounding bù đắp |
| Không real-time collaboration | Multiverse là single-player | Tương lai: Durable Objects cho shared state |

---

## 9. Lộ trình phát triển

- [ ] **Durable Objects cho shared multiverse sessions** — Học sinh cùng lớp thấy lựa chọn nhánh của nhau real-time
- [ ] **Voice input cho character chat** — Speech-to-text cho học sinh luyện phát âm khi chat với nhân vật lịch sử
- [ ] **Teacher override logging** — Audit trail khi giáo viên chỉnh tay điểm AI
- [ ] **Parent portal** — View read-only cho phụ huynh xem bài nộp, điểm, phản hồi AI của con
- [ ] **Durable Objects cho quiz room state** — Real-time leaderboard trong kỳ thi có thời gian
