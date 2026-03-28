import { test as setup, expect } from '@playwright/test';

const authFileTeacher = 'e2e/.auth/teacher.json';
const authFileStudent = 'e2e/.auth/student.json';

setup('authenticate teacher', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000); // Give React Router SPA time to mount
  
  // Populate email via pure HTML selector
  await page.locator('input[type="email"]').fill('an@vanhocai.edu.vn');
  
  // Click login button by strict text rather than accessibility role
  await page.locator('button:has-text("Đăng nhập Giáo")').click();

  // Wait for Dashboard
  await page.waitForSelector('text=Tổng quan', { timeout: 15000 });

  // Save auth state
  await page.context().storageState({ path: authFileTeacher });
});

setup('authenticate student', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000); // Give React Router SPA time to mount

  await page.locator('input[type="email"]').fill('mai@vanhocai.edu.vn');
  
  await page.locator('button:has-text("Đăng nhập Học sinh")').click();

  await page.waitForSelector('text=Tổng quan', { timeout: 15000 });

  await page.context().storageState({ path: authFileStudent });
});
