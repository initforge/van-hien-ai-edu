import { test, expect } from '@playwright/test';

test.describe('Cross-Role Integration Lifecycle (Strict Mode)', () => {
  test('Teacher login và Student login đồng thời vào 2 Dashboards', async ({ browser }) => {
    test.setTimeout(60000);

    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();

    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    await teacherPage.goto('/login');
    await teacherPage.fill('input[type="email"]', 'teacher@vanhien.edu.vn');
    await teacherPage.fill('input[type="password"]', 'password123');
    await teacherPage.click('button:has-text("Đăng nhập Giáo viên")');
    await teacherPage.waitForURL('**/teacher/dashboard');
    await expect(teacherPage.locator('text=Tổng quan').first()).toBeVisible();

    await studentPage.goto('/login');
    await studentPage.fill('input[type="email"]', 'student@vanhien.edu.vn');
    await studentPage.fill('input[type="password"]', 'password123');
    await studentPage.click('button:has-text("Đăng nhập Học sinh")');
    await studentPage.waitForURL('**/student/dashboard');
    await expect(studentPage.locator('h2').first()).toHaveText(/Chào buổi/);

    await studentPage.goto('/student/exam-room');
    await expect(studentPage.locator('h2').first()).toContainText('Chọn phòng thi');

    await teacherPage.reload();
    await expect(teacherPage.locator('text=Tổng quan').first()).toBeVisible();
    await expect(teacherPage.locator('text=Bài chờ chấm')).toBeVisible();

    await teacherContext.close();
    await studentContext.close();
  });
});
