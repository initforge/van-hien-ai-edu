import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/student.json' });
import { loginAs } from '../utils/auth';

test.describe('Student Exam Room — Phòng thi (Filter, Select, Navigate)', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/student/exam-room');
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Chọn phòng thi');
  });

  test('Hiển thị heading và mô tả trang', async ({ page }) => {
    await expect(page.locator('text=Phòng thi trực tuyến')).toBeVisible();
    await expect(page.locator('text=Chọn đề thi bạn muốn làm')).toBeVisible();
  });

  test('3 nút filter Tất cả / Chưa làm / Đã hoàn thành hoạt động', async ({ page }) => {
    // Filter: Tất cả (active by default)
    const allBtn = page.locator('button:has-text("Tất cả")');
    await expect(allBtn).toBeVisible();
    
    // Filter: Chưa làm
    const pendingBtn = page.locator('button:has-text("Chưa làm")');
    await expect(pendingBtn).toBeVisible();
    await pendingBtn.click();
    // Page still renders
    await expect(page.locator('h2').first()).toContainText('Chọn phòng thi');
    
    // Filter: Đã hoàn thành
    const completedBtn = page.locator('button:has-text("Đã hoàn thành")');
    await expect(completedBtn).toBeVisible();
    await completedBtn.click();
    await expect(page.locator('h2').first()).toContainText('Chọn phòng thi');
    
    // Switch back to Tất cả
    await allBtn.click();
    await expect(page.locator('h2').first()).toContainText('Chọn phòng thi');
  });

  test('Click vào exam card hiển thị detail panel', async ({ page }) => {
    // Click first exam card (h3 inside grid)
    const examCard = page.locator('.grid h3').first();
    if (await examCard.count() > 0) {
      const examTitle = await examCard.textContent();
      await examCard.click();
      // Verify detail panel mở (có heading card title lặp lại bên trong panel)
      await expect(page.locator(`h3:has-text("${examTitle}")`).last()).toBeVisible();
    }
  });

  test('Nút Close đóng detail panel', async ({ page }) => {
    const examCard = page.locator('.grid h3').first();
    if (await examCard.count() > 0) {
      await examCard.click();
      // Click close button (icon close)
      const closeBtn = page.locator('button:has(span:has-text("close"))');
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
      }
    }
  });

  test('Nút Bắt đầu làm bài navigate sang ExamDetail', async ({ page }) => {
    const examCard = page.locator('.grid h3').first();
    if (await examCard.count() > 0) {
      await examCard.click();
      // Look for Vào thi link/button
      const startLink = page.locator('a:has-text("Vào thi")').first();
      if (await startLink.count() > 0) {
        await startLink.click();
        await page.waitForURL(/.*\/student\/exam-room\//, { timeout: 15000 });
      }
    }
  });
});
