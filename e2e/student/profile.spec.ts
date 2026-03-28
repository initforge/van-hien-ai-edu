import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/student.json' });
import { loginAs } from '../utils/auth';

test.describe('Student Profile — Hồ sơ, Radar Chart & Kỹ năng', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student/profile');
  });

  test('Heading và thông tin cá nhân hiển thị', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /Nguyễn Thị Mai/i })).toBeVisible({ timeout: 10000 });
  });

  test('Biểu đồ Radar SVG render thành công', async ({ page }) => {
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('Section Điểm mạnh hiển thị nội dung', async ({ page }) => {
    await expect(page.getByText('Điểm mạnh')).toBeVisible();
  });

  test('Section Cần cải thiện hiển thị nội dung', async ({ page }) => {
    await expect(page.getByText('Cần cải thiện')).toBeVisible();
  });

  test('Trang Profile không crash khi scroll', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText(/Digital Scholar/i)).toBeVisible();
  });
});
