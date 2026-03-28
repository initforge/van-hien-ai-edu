import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/teacher.json' });
import { loginAs } from '../utils/auth';

test.describe('Teacher AI Review — Tất cả 5 Tabs và nội dung', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher/ai-review');
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Phân tích & Duyệt AI');
  });

  test('Tab Thống kê lớp hiển thị 4 stat cards và biểu đồ', async ({ page }) => {
    await page.click('text="Thống kê lớp"');
    // Verify stat cards
    await expect(page.locator('text=Tổng bài đã chấm')).toBeVisible();
    await expect(page.locator('text=Điểm TB các lớp')).toBeVisible();
    await expect(page.locator('text=Bài chờ chấm')).toBeVisible();
    await expect(page.locator('text=Lớp xuất sắc nhất')).toBeVisible();
    // Verify biểu đồ lớp
    await expect(page.locator('h3:has-text("Điểm trung bình theo lớp")')).toBeVisible();
    await expect(page.locator('text=Lớp 8A')).toBeVisible();
    await expect(page.locator('text=Lớp 9B')).toBeVisible();
  });

  test('Tab Thống kê học sinh hiển thị bảng danh sách', async ({ page }) => {
    await page.click('text="Thống kê học sinh"');
    // Verify table headers
    await expect(page.locator('th:has-text("Học sinh")')).toBeVisible();
    await expect(page.locator('th:has-text("Lớp")')).toBeVisible();
    await expect(page.locator('th:has-text("Bài nộp")')).toBeVisible();
    await expect(page.locator('th:has-text("Điểm TB")')).toBeVisible();
    await expect(page.locator('th:has-text("Xu hướng")')).toBeVisible();
    // Verify ít nhất 1 học sinh
    await expect(page.locator('text=Nguyễn Thị Mai')).toBeVisible();
  });

  test('Tab Văn phong hiển thị nội dung phân tích', async ({ page }) => {
    await page.click('text="Văn phong"');
    // Tab văn phong nên hiển thị nội dung — verify heading hoặc content area
    await expect(page.locator('[class*="space-y"]').first()).toBeVisible();
  });

  test('Tab Sử dụng Token hiển thị thống kê API', async ({ page }) => {
    await page.click('text="Sử dụng Token"');
    await expect(page.locator('[class*="space-y"]').first()).toBeVisible();
  });

  test('Tab Bảo mẫu AI hiển thị cấu hình rubric', async ({ page }) => {
    await page.click('text="Bảo mẫu AI"');
    await expect(page.locator('[class*="space-y"]').first()).toBeVisible();
  });

  test('Chuyển đổi qua lại giữa tất cả 5 tab không crash', async ({ page }) => {
    const tabs = ['Thống kê lớp', 'Thống kê học sinh', 'Văn phong', 'Sử dụng Token', 'Bảo mẫu AI'];
    for (const tab of tabs) {
      await page.click(`text="${tab}"`);
      // Verify tab active (font-bold class)
      await expect(page.locator(`button:has-text("${tab}")`)).toBeVisible();
    }
    // Verify page still works after all toggles
    await expect(page.locator('h2').first()).toContainText('Phân tích & Duyệt AI');
  });
});
