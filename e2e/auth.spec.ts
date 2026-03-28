import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('Student login redirects to student dashboard', async ({ page }) => {
    await page.goto('/login');
    // Click student login button
    await page.click('button:has-text("Đăng nhập Học sinh")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/student/dashboard');
    await expect(page).toHaveURL(/.*\/student\/dashboard/);
    await expect(page.locator('h2', { hasText: 'Chào buổi sáng' })).toBeVisible();
  });

  test('Teacher login redirects to teacher dashboard', async ({ page }) => {
    await page.goto('/login');
    // Click teacher login button
    await page.click('button:has-text("Đăng nhập Giáo viên")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/teacher/dashboard');
    await expect(page).toHaveURL(/.*\/teacher\/dashboard/);
    await expect(page.locator('h2', { hasText: 'Tổng quan' })).toBeVisible();
  });
});
