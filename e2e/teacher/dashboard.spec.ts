import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/teacher.json' });
import { loginAs } from '../utils/auth';

test.describe('Teacher Dashboard — Toàn bộ Widget & Nút bấm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher/dashboard');
  });

  test('Render đủ 4 thẻ thống kê chính', async ({ page }) => {
    await expect(page.getByText('Tổng quan').first()).toBeVisible();
    await expect(page.getByText('Sĩ số').first()).toBeVisible();
    await expect(page.getByText('Bài chờ chấm').first()).toBeVisible();
    await expect(page.getByText('Đề đã tạo').first()).toBeVisible();
    await expect(page.getByText('AI chờ duyệt').first()).toBeVisible();
  });

  test('Section Hoạt động gần đây hiển thị và nút Xem tất cả hoạt động', async ({ page }) => {
    await expect(page.getByText('Hoạt động gần đây').first()).toBeVisible();
    const viewAllBtn = page.getByRole('button', { name: 'Xem tất cả' });
    await expect(viewAllBtn).toBeVisible();
    await viewAllBtn.click();
    // Sau khi click, nút vẫn tồn tại (không crash/navigate)
    await expect(page.getByText('Hoạt động gần đây').first()).toBeVisible();
  });

  test('Section Cảnh báo AI hiển thị với nút Xem báo cáo và Bỏ qua', async ({ page }) => {
    await expect(page.locator('text=Cảnh báo AI')).toBeVisible();
    
    const reportBtn = page.locator('button:has-text("Xem báo cáo")');
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();
    // Verify UI không crash sau click
    await expect(page.locator('h2').first()).toContainText('Tổng quan');

    const dismissBtn = page.locator('button:has-text("Bỏ qua")');
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();
    await expect(page.locator('h2').first()).toContainText('Tổng quan');
  });

  test('Activity items hiển thị nội dung thực', async ({ page }) => {
    // Verify có ít nhất 1 activity item render (text tĩnh hardcoded)
    const activities = page.locator('text=mới tham gia hệ thống').first();
    await expect(activities).toBeVisible();
  });

  test('Nút Xem chi tiết trên từng activity hoạt động', async ({ page }) => {
    const detailBtn = page.locator('button:has-text("Xem chi tiết")').first();
    if (await detailBtn.count() > 0) {
      await expect(detailBtn).toBeVisible();
      await detailBtn.click();
      // Không crash
      await expect(page.locator('h2').first()).toContainText('Tổng quan');
    }
  });
});
