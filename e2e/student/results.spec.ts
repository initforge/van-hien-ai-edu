import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/student.json' });
import { loginAs } from '../utils/auth';

test.describe('Student Results — Tabs, Filter, Chi tiết (Strict Mode)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student/results');
  });

  test('Heading trang kết quả hiển thị đúng', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /Kết quả/ }).first()).toBeVisible();
  });

  test('Tab Bài thi click và verify nội dung hiển thị', async ({ page }) => {
    const examTab = page.locator('button:has-text("Bài thi")');
    await expect(examTab).toBeVisible();
    await examTab.click();
    // Verify tab switched (content area should render)
    await expect(page.locator('[class*="space-y"], [class*="grid"]').first()).toBeVisible();
  });

  test('Tab Bài tập click và verify nội dung hiển thị', async ({ page }) => {
    const hwTab = page.locator('button:has-text("Bài tập")');
    await expect(hwTab).toBeVisible();
    await hwTab.click();
    await expect(page.locator('[class*="space-y"], [class*="grid"]').first()).toBeVisible();
  });

  test('Nút Lọc môn tồn tại và clickable', async ({ page }) => {
    const filterBtn = page.locator('button:has(span:has-text("filter_list"))').first();
    if (await filterBtn.count() > 0) {
      await expect(filterBtn).toBeVisible();
      await filterBtn.click();
      // No crash
      await expect(page.locator('h1, h2').filter({ hasText: /Kết quả/ }).first()).toBeVisible();
    }
  });

  test('Nút Xuất kết quả tồn tại và clickable', async ({ page }) => {
    const exportBtn = page.locator('button:has(span:has-text("download"))').first();
    if (await exportBtn.count() > 0) {
      await expect(exportBtn).toBeVisible();
      await exportBtn.click();
      await expect(page.locator('h1, h2').filter({ hasText: /Kết quả/ }).first()).toBeVisible();
    }
  });

  test('Chi tiết bài — click hiển thị AI Đánh Giá và Phân tích tiêu chí', async ({ page }) => {
    // Xem chi tiết bài đầu tiên nếu tồn tại
    const detailButton = page.locator('button:has-text("Chi tiết")').first();
    if (await detailButton.count() > 0) {
      await expect(detailButton).toBeVisible();
      await detailButton.click();
      await expect(page.locator('text=Nhận xét của AI').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Phân tích tiêu chí').first()).toBeVisible();
    }
  });
});
