import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/student.json' });
import { loginAs } from '../utils/auth';

test.describe('Student Exam — Làm bài và Nộp bài (Strict Mode)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('Vào phòng thi, chọn đề và xem chi tiết', async ({ page }) => {
    await page.goto('/student/exam-room');
    await expect(page.locator('h2').first()).toContainText('Chọn phòng thi');

    const examCard = page.locator('.grid h3').first();
    if (await examCard.count()) {
      const examTitle = await examCard.textContent();
      await examCard.click();
      await expect(page.locator(`h3:has-text("${examTitle}")`).last()).toBeVisible();
    }
  });

  test('ExamDetail page render và nút Nộp bài hoạt động', async ({ page }) => {
    await page.goto('/student/exam-room/demo-exam');
    await expect(page.locator('text=Phần I: Đọc hiểu').first()).toBeVisible({ timeout: 15000 });

    const submitBtn = page.locator('button:has-text("Nộp bài")');
    await expect(submitBtn).toBeVisible();

    const answerInput = page.locator('input[placeholder*="Nhập câu trả lời"]').first();
    if (await answerInput.count()) {
      await answerInput.fill('Phương thức biểu đạt chính: Tự sự. E2E Test.');
    }

    await submitBtn.click();
    await page.waitForURL(/.*\/student\/results/, { timeout: 15000 });
  });
});
