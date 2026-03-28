import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/teacher.json' });
import { loginAs } from '../utils/auth';
import { executeD1Query } from '../utils/db';

test.describe('Teacher Multiverse — Quản lý Đa vũ trụ cốt truyện', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await loginAs(page, 'teacher');
  });

  test('Render trang và hiển thị heading chính', async ({ page }) => {
    await page.goto('/teacher/multiverse');
    await expect(page.locator('h2').first()).toContainText('Quản lý Đa vũ trụ cốt truyện');
    await expect(page.locator('text=Thiết lập các điểm rẽ nhánh')).toBeVisible();
  });

  test('Nút Tạo nhánh mới mở panel sáng tạo', async ({ page }) => {
    await page.goto('/teacher/multiverse');
    await expect(page.locator('h2').first()).toContainText('Quản lý Đa vũ trụ');
    
    const createBtn = page.locator('button:has-text("Tạo nhánh mới")');
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    
    // Verify creation panel mở
    await expect(page.locator('h3:has-text("Tạo nhánh mới")')).toBeVisible();
    // Verify select Tác phẩm gốc
    await expect(page.locator('select')).toBeVisible();
    // Verify textarea AI Prompt
    await expect(page.locator('textarea')).toBeVisible();
    // Verify submit button
    await expect(page.locator('button:has-text("Khởi tạo Đa vũ trụ")')).toBeVisible();
  });

  test('Đóng panel sáng tạo bằng nút X', async ({ page }) => {
    await page.goto('/teacher/multiverse');
    await page.locator('button:has-text("Tạo nhánh mới")').click();
    await expect(page.locator('h3:has-text("Tạo nhánh mới")')).toBeVisible();
    
    // Click nút close (icon X)
    await page.locator('button:has(span:has-text("close"))').click();
    await expect(page.locator('h3:has-text("Tạo nhánh mới")')).not.toBeVisible();
  });

  test('Điền form và submit tạo storyline mới vào API', async ({ page }) => {
    await page.goto('/teacher/multiverse');
    await page.locator('button:has-text("Tạo nhánh mới")').click();
    
    // Chọn tác phẩm
    await page.locator('select').selectOption('work-2'); // Lão Hạc
    
    // Điền prompt 
    await page.locator('textarea').fill('Lão Hạc không bán cậu Vàng mà quyết định dẫn cậu Vàng trốn vào rừng sâu. E2E Test.');
    
    // Submit
    await page.locator('button:has-text("Khởi tạo Đa vũ trụ")').click();
    
    // Verify panel đóng lại (form submission thành công)
    await expect(page.locator('h3:has-text("Tạo nhánh mới")')).not.toBeVisible({ timeout: 15000 });
  });

  test.afterAll(() => {
    // Cleanup storylines tạo bởi test
    try {
      executeD1Query(`DELETE FROM storylines WHERE branch_point LIKE '%E2E Test%';`);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
});
