# Continue Fix — CÒN 1 TASK (2026-04-07)

## ✅ Đã hoàn thành (session trước)

| # | Item | Priority | Trạng thái |
|---|---|---|---|
| A1 | multiverse.js — try/catch ai_full, validate parent.content, guard empty content | P0 | ✅ DONE |
| A4 | TeacherMultiverse.tsx — viết lại: GET /api/multiverse, bỏ UI tạo, class/student filter | P0 | ✅ DONE |
| B1 | grade-preview.js — load rubric_criteria từ DB, pass vào AI prompt | P0 | ✅ DONE |
| B2 | Grading.tsx — map AI scores by name (semantic match), hiển thị aiComment | P1 | ✅ DONE |
| P4 | Cleanup 7 dead files (storylines.js, ai-multiverse.js, teacher/storylines.js, multiverse-preview/approve/reject, constants/storylines.ts) | P2 | ✅ DONE |

## ❌ Còn lại — P3: Results.tsx rubric breakdown cho học sinh

**Task:** Khi student xem kết quả bài → hiển thị rubric breakdown (điểm + comment theo từng tiêu chí)

### Phân tích từ session bị interrupted

**Vấn đề hiện tại:**
- Results.tsx chỉ hiển thị điểm tổng + comment chung
- Không có rubric breakdown cho student
- `submissions` table KHÔNG có column lưu rubric breakdown
- KV grade-preview hết hạn sau 30 phút → không dùng được

**Kế hoạch đã brainstorm:**

1. **Schema:** Thêm column `ai_rubric TEXT` vào bảng `submissions` (lưu JSON)
2. **Backend:** `submissions.js` PATCH → accept + save `ai_rubric` field
3. **Grading.tsx:** Khi teacher "Trả bài" (`handleReturn`) → gửi kèm `rubricScores` JSON
4. **submissions.js GET:** Trả về thêm `ai_rubric` cho student
5. **Results.tsx:** Parse `ai_rubric` JSON → hiển thị breakdown:
   ```
   [████████░░] Nội dung 40% — 8/10 — "Phân tích đúng yêu cầu..."
   [██████░░░░] Lập luận 25% — 6/10 — "Logic chưa rời rạc..."
   ```

### Files cần sửa

| File | Thay đổi |
|------|----------|
| `database/schema/05-exams.sql` | Thêm `ai_rubric TEXT` vào `submissions` |
| `functions/api/submissions.js` | PATCH: accept + save ai_rubric; GET: return ai_rubric |
| `src/pages/teacher/Grading.tsx` | handleReturn: gửi kèm rubricScores |
| `src/pages/student/Results.tsx` | Parse + hiển thị rubric breakdown |
| Remote D1 | `ALTER TABLE submissions ADD COLUMN ai_rubric TEXT;` |

### Session info
- Session ID: `af92a249-dedd-4cb4-9a29-988310eb20a7`
- Interrupted tại: đang đọc submissions.js để implement
- Thời điểm: 2026-04-07 ~11:31 UTC
