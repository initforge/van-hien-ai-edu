-- 006-rubric.sql — Default Rubric Criteria (run AFTER schema + users exist)
-- 4 criteria × 100% weight, default for teacher-1

INSERT OR IGNORE INTO rubric_criteria (id, teacher_id, name, description, weight, hint_prompt, order_index) VALUES
  ('rub-1', 'teacher-1', 'Nội dung',
   'Đánh giá tính đầy đủ, chính xác, sâu sắc của nội dung bài viết.',
   40,
   'Chấm Nội dung: độ chính xác, độ sâu phân tích, bố cục, dẫn chứng. Trừ điểm nếu lạc đề, thiếu dẫn chứng, hoặc bố cục rời rạc.',
   1),

  ('rub-2', 'teacher-1', 'Lập luận',
   'Đánh giá tính mạch lạc, chặt chẽ của lập luận.',
   25,
   'Chấm Lập luận: luận điểm rõ ràng, lý lẽ thuyết phục, cách triển khai từng bước, không mâu thuẫn. Trừ điểm nếu lập luận lộn xộn, thiếu logic.',
   2),

  ('rub-3', 'teacher-1', 'Diễn đạt',
   'Đánh giá cách sử dụng ngôn ngữ: từ vựng, câu văn, không lỗi chính tả/ngữ pháp.',
   20,
   'Chấm Diễn đạt: từ ngữ phong phú, câu văn trôi chảy, không lỗi. Trừ điểm nếu từ ngữ nghèo nàn, lặp từ, sai ngữ pháp.',
   3),

  ('rub-4', 'teacher-1', 'Hình thức',
   'Đánh giá cách trình bày: đúng chuẩn, sạch sẽ, có đoạn văn, đủ số từ.',
   15,
   'Chấm Hình thức: trình bày sạch sẽ, đúng quy cách, có đoạn văn rõ ràng. Trừ điểm nếu bài quá ngắn, trình bày bẩn, thiếu đoạn văn.',
   4);
