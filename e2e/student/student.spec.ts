import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/student.json' });

test.describe('Student Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student/dashboard');
  });

  test('Dashboard loads correctly and displays greetings and sections', async ({ page }) => {
    await expect(page.getByText('Chào buổi sáng').first()).toBeVisible();
    await expect(page.getByText('Bài sắp tới').first()).toBeVisible();
    await expect(page.getByText('Kết quả mới').first()).toBeVisible();
  });

  test('Navigate to Exam Room correctly', async ({ page }) => {
    // Click on the first "Làm bài ->" button
    const examCard = page.locator('text=Làm bài →').first();
    await examCard.click();
    
    // Check if it redirects to the exam room
    await page.waitForURL(/.*\/student\/exam-room\/.+/);
    await expect(page).toHaveURL(/.*\/student\/exam-room\/.+/);
  });
  
  test('Expand recent results shows scores', async ({ page }) => {
    // Click the first recent result card by targeting the inner text or the card surface
    const firstResult = page.locator('.group').filter({ hasText: 'Đã trả kết quả' }).first();
    await firstResult.click();
    
    // Should reveal "AI Đánh Giá" and "Giáo viên chấm" blocks
    await expect(firstResult.locator('text=AI Đánh Giá')).toBeVisible();
    await expect(firstResult.locator('text=Giáo viên chấm')).toBeVisible();
  });
});
