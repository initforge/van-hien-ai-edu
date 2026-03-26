-- Set up foundational data for the Hackathon MVP
-- Clear existing tables if any (Optional but good for fresh seed)
DELETE FROM users;
DELETE FROM works;
DELETE FROM storylines;
DELETE FROM exams;
DELETE FROM submissions;

-- 1. Create Core Users (Teacher & Student)
INSERT INTO users (id, name, email, role) VALUES 
('teacher_1', 'Giáo sư Văn học', 'teacher@example.com', 'teacher'),
('student_1', 'Trần Văn Học Sinh', 'student@example.com', 'student');

-- 2. Create Literary Works
INSERT INTO works (id, title, author, description, content) VALUES
('work_1', 'Truyện Kiều', 'Nguyễn Du', 'Tuyệt tác nền văn học', 'Trăm năm trong cõi người ta...'),
('work_2', 'Lão Hạc', 'Nam Cao', 'Tác phẩm hiện thực', 'Bao giờ lão chết, lão sẽ bán chó...'),
('work_3', 'Vợ Nhặt', 'Kim Lân', 'Nạn đói năm 1945', 'Giữa một ngày đói khát...');

-- 3. Create Default Storylines (Multiverse Nodes)
INSERT INTO storylines (id, workId, branchPoint) VALUES
('storyline_1', 'work_1', 'Khởi tạo bối cảnh Thúy Kiều ở lầu Ngưng Bích'),
('storyline_2', 'work_2', 'Lão Hạc không bán cậu Vàng, quyết định lên tỉnh tìm việc');

-- 4. Create an Initial Exam
INSERT INTO exams (id, title, description, teacherId, status) VALUES
('exam_1', 'Phân tích nhân vật Lão Hạc', 'Viết bài luận 500 chữ phân tích tâm lý Lão Hạc', 'teacher_1', 'published'),
('exam_2', 'Đề thi Thử - Truyện Kiều', 'Trắc nghiệm và tự luận', 'teacher_1', 'draft');

-- 5. Create Mock Submissions for the Dashboards to not be empty
INSERT INTO submissions (id, examId, studentId, studentName, content, score, aiScore, feedback, status) VALUES
('sub_1', 'exam_1', 'student_2', 'Nguyễn Thị B', 'Bài làm còn sơ sài...', 6.5, 7.0, 'Cần thêm dẫn chứng', 'graded'),
('sub_2', 'exam_1', 'student_3', 'Lê Văn C', 'Bài làm vô cùng xuất sắc...', 9.0, 9.5, 'Lập luận sắc bén', 'graded');
