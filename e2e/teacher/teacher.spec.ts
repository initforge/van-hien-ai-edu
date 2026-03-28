import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/teacher.json' });

test.describe('Teacher Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher/dashboard');
  });

  test('Dashboard loads statistics widgets correctly', async ({ page }) => {
    await expect(page.getByText('Tổng quan').first()).toBeVisible();
    // Validate 4 key widgets exist
    await expect(page.getByText('Sĩ số').first()).toBeVisible();
    await expect(page.getByText('Bài chờ chấm').first()).toBeVisible();
    await expect(page.getByText('Đề đã tạo').first()).toBeVisible();
    await expect(page.getByText('AI chờ duyệt').first()).toBeVisible();
  });

  test('Alerts and Recent Activity feeds render', async ({ page }) => {
    await expect(page.locator('text=Hoạt động gần đây')).toBeVisible();
    await expect(page.locator('text=Cảnh báo AI')).toBeVisible();
    
    // Just verify the sections have content items
    const activities = page.locator('text=mới tham gia hệ thống').first();
    await expect(activities).toBeVisible();
  });
});
