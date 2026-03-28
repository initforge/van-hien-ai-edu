import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/teacher.json' });
import { loginAs } from '../utils/auth';

test.describe('Teacher Exam Bank — Ngân hàng đề thi (Toàn bộ nút bấm)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/teacher/exam-bank');
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Ngân hàng Đề');
  });

  test('Nút Tạo đề mở form và submit thành công', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /Tạo đề mới/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    await expect(
      page.getByRole('heading', { name: /Tạo đề (thi|bài tập) mới/i }).first()
    ).toBeVisible({ timeout: 10000 });

    await page.locator('input[name="title"]').fill('Đề E2E Expanded Test');

    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(
      page.getByRole('heading', { name: /Tạo đề (thi|bài tập) mới/i })
    ).not.toBeVisible();
  });

  test('Nút AI gợi ý đề tồn tại và clickable', async ({ page }) => {
    const aiBtn = page.getByRole('button', { name: /AI gợi ý đề/i });
    await expect(aiBtn).toBeVisible();
    await aiBtn.click();
    await expect(page.locator('h2').first()).toContainText('Ngân hàng Đề');
  });

  test('Nút Hủy đóng form tạo đề', async ({ page }) => {
    await page.getByRole('button', { name: /Tạo đề mới/i }).click();
    await expect(
      page.getByRole('heading', { name: /Tạo đề (thi|bài tập) mới/i }).first()
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Hủy/i }).click();
    await expect(
      page.getByRole('heading', { name: /Tạo đề (thi|bài tập) mới/i })
    ).not.toBeVisible();
  });

  test('Tab Bài tập và Bài thi chuyển đổi được', async ({ page }) => {
    const examTab = page.getByRole('button', { name: /^Bài thi$/ });
    await expect(examTab).toBeVisible();
    await examTab.click();
    await expect(page.locator('h2').first()).toContainText('Ngân hàng Đề');

    const exerciseTab = page.getByRole('button', { name: /^Bài tập$/ });
    await expect(exerciseTab).toBeVisible();
    await exerciseTab.click();
    await expect(page.locator('h2').first()).toContainText('Ngân hàng Đề');
  });

  test('Nút Xem và Duyệt/Sửa trên từng đề thi trong bảng', async ({ page }) => {
    const viewBtn = page.getByRole('button', { name: /^Xem$/ }).first();
    if (await viewBtn.count()) {
      await expect(viewBtn).toBeVisible();
      await viewBtn.click();
      await expect(page.locator('h2').first()).toContainText('Ngân hàng Đề');
    }

    const editBtn = page.getByRole('button', { name: /Duyệt|Sửa/i }).first();
    if (await editBtn.count()) {
      await expect(editBtn).toBeVisible();
      await editBtn.click();
      await expect(page.locator('h2').first()).toContainText('Ngân hàng Đề');
    }
  });

  test('Pagination buttons hoạt động', async ({ page }) => {
    const prevBtn = page.locator('button:has(span:has-text("chevron_left"))').first();
    const nextBtn = page.locator('button:has(span:has-text("chevron_right"))').first();

    if (await nextBtn.count()) {
      await nextBtn.click();
      await expect(page.locator('h2').first()).toContainText('Ngân hàng Đề');
    }
    if (await prevBtn.count()) {
      await prevBtn.click();
      await expect(page.locator('h2').first()).toContainText('Ngân hàng Đề');
    }
  });

  test('Sidebar AI — nút Tùy chỉnh cấu trúc và Thử ngay', async ({ page }) => {
    const customizeBtn = page.getByRole('button', { name: /Tùy chỉnh cấu trúc/i });
    if (await customizeBtn.count()) {
      await customizeBtn.click();
      await expect(page.locator('h2').first()).toContainText('Ngân hàng Đề');
    }

    const tryNowBtn = page.getByRole('button', { name: /Thử ngay/i });
    if (await tryNowBtn.count()) {
      await tryNowBtn.click();
      await expect(page.locator('h2').first()).toContainText('Ngân hàng Đề');
    }
  });
});
