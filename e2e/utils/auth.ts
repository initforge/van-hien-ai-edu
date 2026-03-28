import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, role: 'teacher' | 'student') {
  await page.goto('/login');
  
  // Wait for the login page to load by waiting for the email input
  await page.waitForSelector('input[type="email"]');

  // Determine which credentials to use based on role
  const email = role === 'teacher' ? 'teacher@vanhien.edu.vn' : 'student@vanhien.edu.vn';
  const password = 'password123';

  // Fill in coordinates
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Click specific login button based on role
  if (role === 'teacher') {
    await page.click('button:has-text("Đăng nhập Giáo viên")');
  } else {
    await page.click('button:has-text("Đăng nhập Học sinh")');
  }

  // Wait for the specific dashboard to ensure successful login
  const dashboardPath = `/${role}/dashboard`;
  await page.waitForURL(dashboardPath, { timeout: 30000 });
}
