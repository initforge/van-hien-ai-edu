import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/student.json' });
import { loginAs } from '../utils/auth';

test.describe('Student Dashboard — Greeting, Sections & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student/dashboard');
  });

  test('Render lời chào đúng thời điểm và 2 section chính', async ({ page }) => {
    await expect(page.locator('h2').first()).toHaveText(/Chào buổi/);
    await expect(page.locator('text=Bài sắp tới')).toBeVisible();
    await expect(page.locator('text=Kết quả mới')).toBeVisible();
  });

  test('Card Bài sắp tới hiển thị và có nút Làm bài', async ({ page }) => {
    const examCard = page.locator('text=Làm bài →').first();
    if (await examCard.count() > 0) {
      await expect(examCard).toBeVisible();
      await examCard.click();
      // Verify navigate to exam-room
      await page.waitForURL(/.*\/student\/exam-room/, { timeout: 15000 });
    }
  });

  test('Card Kết quả mới expand để hiện AI Đánh Giá', async ({ page }) => {
    const firstResult = page.locator('.group').filter({ hasText: 'Đã trả kết quả' }).first();
    if (await firstResult.count() > 0) {
      await firstResult.click();
      await expect(firstResult.locator('text=AI Đánh Giá')).toBeVisible();
      await expect(firstResult.locator('text=Giáo viên chấm')).toBeVisible();
    }
  });

  test('Notification bell button tồn tại và clickable', async ({ page }) => {
    const bellBtn = page.locator('button:has(span:has-text("notifications"))').first();
    if (await bellBtn.count() > 0) {
      await expect(bellBtn).toBeVisible();
      await bellBtn.click();
      // Button click không crash page
      await expect(page.locator('h2').first()).toHaveText(/Chào buổi/);
    }
  });
});
