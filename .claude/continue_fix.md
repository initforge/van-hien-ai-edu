# Continue Fix — 2026-04-05

## Trạng thái: Đang dở — cần tiếp tục từ đây

---

## 1. Lỗi [AI stub] — ĐÃ FIX (1 dòng)

**File**: `functions/api/_ai.js`

**Vấn đề**: `aiCall()` trả `{ text: '[AI stub] Model not configured...' }` khi AI binding chưa config → frontend tưởng thành công → hiện ngu.

**Fix đã apply**:
- `aiCall()`: throw error thay vì return stub
- Streaming: gửi error message thay vì stub text

**Còn thiếu**: Kiểm tra `analyze.js` catch error từ `aiCall` đúng chưa. Khi `aiCall` throw, `contextResult` undefined → `contextResult.inputTokens` crash.

---

## 2. work_analysis là write-only — CẦN REFACTOR TẤT CẢ

**Audit kết quả**:
- `work_analysis` có 6 sections: `summary`, `characters`, `art_features`, `content_value`, `themes`, `context`
- **5/6 consumer files** đều dùng `work.content` gốc (tốn token + lặp lại)
- **0 consumer** đọc `work_analysis` — nó là bảng write-only vô dụng

### Mục đích đúng của work_analysis

`work_analysis` = cached structured analysis (viết 1 lần, dùng cho tất cả AI features):

| Feature | Sections cần | Cách dùng |
|---|---|---|
| **exam-preview** (gợi ý đề) | ALL 6 | summary + themes + characters cho đề nghị luận; art_features cho đề cảm thụ |
| **grade-preview** (chấm bài) | ALL 6 | summary + art_features để đánh giá viết; content_value + characters để nhận xét |
| **multiverse-preview** | ALL 6 | summary + context (bối cảnh lịch sử) + themes + characters |
| **chat.js** (nhân vật) | ALL 6 | characters + summary + themes + context |
| **analyze.js** | Tất cả 6 | Generate (đúng rồi) |

### Priority refactor

1. **exam-preview.js** — dùng work_analysis thay work.content
2. **grade-preview.js** — dùng work_analysis thay work.content
3. **multiverse-preview.js** — dùng work_analysis thay work.content
4. **chat.js** — dùng work_analysis thay work.content
5. **ai-exam-gen.js** — dùng work_analysis thay work.content
6. **analyze.js** — kiểm tra catch error đúng

### Cách load work_analysis

```js
// Helper pattern dùng chung
async function getWorkAnalysis(env, workId) {
  const { results } = await env.DB.prepare(
    `SELECT section, content FROM work_analysis WHERE work_id = ? ORDER BY section`
  ).bind(workId).all();
  const map = {};
  for (const r of results) map[r.section] = r.content;
  return map;
}

// Dùng trong consumer:
const analysis = await getWorkAnalysis(env, workId);
// analysis.summary, analysis.characters, analysis.themes, ...
```

---

## 3. Chunks — BỎ TAB CHUNKS

**File**: `src/pages/teacher/Library.tsx`

**Vấn đề**: Tab "Chunks" trong WorkDetailPanel là sản phẩm phụ không dùng ở đâu:
- `chat.js` → dùng `work.content` gốc (2000 chars)
- `exam-preview.js` → dùng `work.content` gốc (3000 chars)
- `grade-preview.js` → dùng `work.content` gốc (3000 chars)
- `multiverse-preview.js` → dùng `work.content` gốc (4000 chars)
- **Không có file nào dùng `work_chunks`**

**Actions**:
1. Xóa tab "Chunks" khỏi `ANALYSIS_TABS` trong Library.tsx
2. Xóa `ChunksTab` component và `chunks` state trong WorkDetailPanel
3. Xóa `/api/works/:id/chunks` endpoint hoặc giữ lại cho sau này (không xóa vội)
4. Chỉ cần: bỏ tab UI + useSWR chunks trong panel

---

## 4. Analyze.js — Error Handling + Real-time Update

**File**: `functions/api/works/[id]/analyze.js`

**Vấn đề 1**: Khi `aiCall` throw (AI not configured), `contextResult` undefined → crash ở `contextResult.inputTokens`.

**Fix cần apply**:
```js
// Step 1: wrap try/catch riêng — KHÔNG throw ra ngoài
let workContext = '';
let contextTokens = { input: 0, output: 0 };
try {
  const contextResult = await aiCall(...);
  totalInputTokens += contextResult.inputTokens;
  totalOutputTokens += contextResult.outputTokens;
  // ...
} catch (e) {
  console.warn('Context failed:', e.message);
  workContext = '';
}
// KHÔNG throw — continue without context

// Tương tự Step 2 và Step 3
```

**Vấn đề 2**: Panel không tự điền kết quả sau khi analyze xong.

**Nguyên nhân**: `handleAnalyze` gọi POST → API trả ngay (async job) → `mutateAnalysis()` trigger revalidate → analysis chưa xong nên revalidate trả dữ liệu cũ → teacher thấy trống.

**Fix UX**:
- Sau khi analyze xong, status = 'done' → SWR cache key `/api/works/${work.id}/analysis` được revalidate tự động
- Thêm loading state đẹp hơn: thay vì chỉ pulsing dot, hiện "Đang phân tích... X" với số mục đã xong
- SWR `mutateAnalysis()` trong `handleAnalyze` → `onMutate()` → `mutateWorks()` đúng rồi

**Thực tế**: analyze là async job phía server — POST trả ngay, server chạy AI rồi update DB. Client phải poll hoặc dùng SSE. Fix đơn giản nhất:
- Sau POST thành công → set `analyzing = false` + show "Đang phân tích..." message
- Bật polling: `setInterval(() => mutateAnalysis(), 5000)` cho đến khi `analysisStatus === 'done'`

---

## 5. ExamBank — Thiết kế Form Tách Đề Thi

**File**: `src/pages/teacher/ExamBank.tsx`

**Vấn đề**: Form bài tập và đề thi gần như giống hệt nhau (chỉ khác duration + deadline). Không phản ánh bản chất khác nhau.

### Khác biệt cần có:

| | Bài tập | Đề thi |
|---|---|---|
| Mục đích | Luyện tập, không tính điểm | Kiểm tra, có tính điểm |
| Thời gian | Không giới hạn | Bắt buộc chọn |
| Hạn nộp | Tùy chọn | Nên có |
| Giao lớp | Tùy chọn | Bắt buộc |
| Rubric | Không cần | Bắt đầu từ mẫu rubric có sẵn |
| Tạo thủ công | Có | Có |

### Form nên tách rõ:

**Bài tập**:
- Tên, Tác phẩm, Lớp (tùy), Deadline
- AI gợi ý HOẶC nhập tay câu hỏi
- Câu hỏi: nội dung + loại (essay/ngắn/trắc nghiệm) + điểm
- Không cần rubric

**Đề thi**:
- Tên, Tác phẩm, Lớp (bắt buộc), Thời lượng, Deadline
- AI gợi ý HOẶC nhập tay câu hỏi
- Câu hỏi: nội dung + loại + điểm + rubric
- Bắt đầu từ rubric có sẵn

### Mode tạo:

Hiện tại chỉ có 1 mode: AI tạo → preview → duyệt.

Cần thêm:
1. **AI tạo** (đang có) → preview → duyệt
2. **Nhập tay** (mới) → nhập câu hỏi trực tiếp → lưu

---

## 6. AI Analysis Tự Động

**Trigger**: Khi teacher nhập xong content (đủ dài, đủ metadata).

**Logic**:
```
content.trim().split(/\s+/).length >= 200
+ title.trim().length >= 3
+ author.trim().length >= 3
+ analysis_status === 'none'
→ Gợi ý: "Có muốn phân tích bằng AI?"
```

**Cách implement**:
- Thêm debounce 3s sau khi content thay đổi
- Kiểm tra đủ điều kiện
- Hiện banner gợi ý nhỏ dưới textarea
- Teacher bấm "Phân tích" → chạy analyze (không block UI)

---

## 7. Đổi Model AI (ĐÃ LÀM)

**Trạng thái**: ĐÃ FIX trong session này

- `analyze.js`: qwen2.5-coder → mistral-small-3.1-24b
- `exam-preview.js`: qwen2.5-coder → mistral-small-3.1-24b
- `ai-exam-gen.js`: qwen2.5-coder → mistral-small-3.1-24b
- `multiverse.js`: qwen2.5-72b (không confirmed) → qwen3-30b-a3b-fp8
- `_ai.js`: comment table cập nhật

**Còn check**: model có thực sự chạy không? `[AI stub]` có thể vẫn còn do wrangler.toml chưa config AI binding.

---

## 8. Auth Race Condition (ĐÃ FIX)

**File**: `src/contexts/AuthContext.tsx`

**Vấn đề**: Teacher đăng nhập → hiện "Phiên hết hạn" → reload mới được.

**Fix đã apply**:
```js
// Trước: setUser(null) → clearTokens() → navigate → token vẫn còn
// Sau: clearTokens() → setUser(null) → navigate → token đã xóa
if (res.status === 401) {
  clearTokens(); // ← xóa trước
  setUser(null);
}
```

---

## 9. ExamBank CRUD Optimistic Updates (ĐÃ FIX)

**Trạng thái**: ĐÃ FIX

- Publish/ Unpublish: optimistic update
- Delete: optimistic update + rollback
- AI approve: optimistic

---

## 10. Các File Đã Sửa Gần Đây

| File | Thay đổi |
|---|---|
| `functions/api/_ai.js` | AI stub → throw error |
| `functions/api/ai/exam-preview.js` | Thêm deadline |
| `functions/api/ai/exam-approve.js` | Ghi deadline vào DB |
| `src/pages/teacher/ExamBank.tsx` | Form tách rõ hơn, optimistic, deadline cả 2 tab |
| `src/pages/teacher/Library.tsx` | Bỏ tab upload, thêm useEffect import, bỏ useEffect thừa |
| `src/pages/teacher/Grading.tsx` | Endpoint đúng: /ai/grade-preview, optimistic return |
| `src/pages/teacher/Characters.tsx` | Optimistic updates |
| `src/pages/teacher/TeacherMultiverse.tsx` | Optimistic approve |
| `src/pages/teacher/ClassManagement.tsx` | Optimistic create/delete |
| `src/contexts/AuthContext.tsx` | Race condition fix |

---

## Thứ tự ưu tiên khi tiếp tục

1. **work_analysis refactor** (nhất — business logic sai hoàn toàn)
2. **Chucks tab bỏ** (dễ, nhanh)
3. **Analyze.js error handling** (tránh crash khi AI not configured)
4. **AI stub verify** (kiểm tra wrangler.toml có AI binding chưa)
5. **Form ExamBank nâng cao** (nhập tay + tách bài tập/đề thi)
6. **AI analysis tự động gợi ý** (UX improvement)

---

## Notes

- Frontend deploy: https://33aad699.van-hien.pages.dev
- Backend auto-deploy qua Cloudflare Pages Git integration
- Mỗi khi push → functions tự deploy
- Muốn deploy frontend thủ công: `npx wrangler pages deploy dist/`
