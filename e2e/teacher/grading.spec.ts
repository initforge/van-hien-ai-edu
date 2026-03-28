import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/teacher.json' });
import { loginAs } from '../utils/auth';
import { executeD1Query, cleanupTestData } from '../utils/db';

test.describe('Teacher Grading (Chấm bài)', () => {
  test.beforeAll(() => {
    // Seed CSDL mồi để Teacher có Lớp và Bài nộp để tự test (Thay cho Data do Học sinh tạo)
    executeD1Query(`INSERT OR REPLACE INTO classes (id, name, teacher_id, created_at) VALUES ('class-8a-grading', '8A', 'teacher-1', '2026-03-27T00:00:00.000Z');`);
    executeD1Query(`INSERT OR REPLACE INTO exams (id, title, class_id, type, teacher_id, created_at) VALUES ('exam-1-grading', 'Đề E2E Grading', 'class-8a-grading', 'exam', 'teacher-1', '2026-03-27T00:00:00.000Z');`);
    executeD1Query(`INSERT OR REPLACE INTO submissions (id, exam_id, student_id, status, submitted_at) VALUES ('sub-1-grading', 'exam-1-grading', 'student-1', 'submitted', '2026-03-27T00:00:00.000Z');`);
  });

  test.afterAll(() => {
    executeD1Query(`DELETE FROM submissions WHERE id = 'sub-1-grading';`);
    executeD1Query(`DELETE FROM exams WHERE id = 'exam-1-grading';`);
    executeD1Query(`DELETE FROM classes WHERE id = 'class-8a-grading';`);
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000); // Tăng timeout để đề phòng Edge Cache hoặc mạng chậm
    await page.goto('/teacher/dashboard');
  });

  test('Duyệt danh sách bài nộp và thực hiện chấm điểm', async ({ page }) => {
    // Navigate to Grading
    await page.click('a[href="/teacher/grading"]');
    await expect(page.locator('h2').first()).toContainText('Chọn lớp học');

    // Chọn lớp 8A
    await page.waitForSelector('h3:has-text("8A")', { timeout: 15000 });
    await page.locator('h3:has-text("8A")').first().click();
    
    // Bước 2: Chọn đề thi
    await expect(page.locator('h2').first()).toContainText('Chọn đề thi', { timeout: 15000 });
    const examCard = page.locator('h3:has-text("Đề E2E Grading")').first();
    await examCard.waitFor({ state: 'visible', timeout: 15000 });
    await examCard.click();
    
    // Bước 3: Chọn học sinh
    await expect(page.locator('table button', { hasText: /Chấm bài|Xem lại/i }).first()).toBeVisible({ timeout: 15000 });
    await page.locator('table button', { hasText: /Chấm bài|Xem lại/i }).first().click();
    
    // Bước 4: Chấm bài chi tiết
    await expect(page.locator('h3').filter({ hasText: 'Kết quả chấm AI' })).toBeVisible({ timeout: 15000 });
    
    // Form nhận xét
    await page.fill('textarea[placeholder="Nhập nhận xét..."]', 'Bài làm tốt, E2E test passed!');
    
    // Bấm nút Trả bài
    await page.click('button:has-text("Trả bài")');
    
    // Kiểm tra UI quay lại danh sách học sinh (hoặc danh sách đề)
    await expect(page.locator('h2').first()).toContainText('Đề E2E Grading', { timeout: 15000 });
  });
});
