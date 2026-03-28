import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/teacher.json' });
import { loginAs } from '../utils/auth';

test.describe('Teacher Characters — Nhân vật AI (Mọi nút bấm)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher/characters');
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Nhân vật AI');
  });

  test('Chuyển tab Danh sách nhân vật và verify bảng hiển thị', async ({ page }) => {
    await page.click('text="Danh sách nhân vật"');
    await expect(page.locator('table')).toBeVisible();
    // Verify có cột header
    await expect(page.locator('th:has-text("Nhân vật")')).toBeVisible();
    await expect(page.locator('th:has-text("Tác phẩm")')).toBeVisible();
  });

  test('Chuyển tab Lịch sử chat HS và verify nội dung', async ({ page }) => {
    await page.click('text="Lịch sử chat HS"');
    await expect(page.locator('text=/\\d+ tin nhắn/').first()).toBeVisible();
    // Verify có tên học sinh hiển thị
    await expect(page.locator('text=Nguyễn Thị Mai').first()).toBeVisible();
  });

  test('Mở form Thêm nhân vật, điền thông tin và submit', async ({ page }) => {
    await page.click('text="Thêm nhân vật"');
    await expect(page.locator('h3').first()).toContainText('Thêm nhân vật mới');
    
    // Verify các input fields tồn tại
    const nameInput = page.locator('input[placeholder="VD: Chí Phèo"]');
    await expect(nameInput).toBeVisible();
    
    const workInput = page.locator('input[placeholder="VD: Chí Phèo — Nam Cao"]');
    await expect(workInput).toBeVisible();
    
    const personaTextarea = page.locator('textarea[placeholder*="Mô tả tính cách"]');
    await expect(personaTextarea).toBeVisible();
    
    // Điền form
    await nameInput.fill('Chí Phèo E2E');
    await workInput.fill('Chí Phèo — Nam Cao');
    await personaTextarea.fill('Lương thiện bị tha hóa, giọng nói thô kệch nhưng khát khao đổi đời');
    
    // Submit form
    await page.click('button:has-text("Tạo nhân vật")');
    
    // Verify form đóng lại (ẩn h3 Thêm nhân vật mới)
    await expect(page.locator('h3').filter({ hasText: 'Thêm nhân vật mới' })).not.toBeVisible();
  });

  test('Nút Hủy đóng form Thêm nhân vật', async ({ page }) => {
    await page.click('text="Thêm nhân vật"');
    await expect(page.locator('h3').first()).toContainText('Thêm nhân vật mới');
    
    await page.click('button:has-text("Hủy")');
    await expect(page.locator('h3').filter({ hasText: 'Thêm nhân vật mới' })).not.toBeVisible();
  });

  test('Nút Sửa và Tắt/Bật trên từng nhân vật trong bảng', async ({ page }) => {
    await page.click('text="Danh sách nhân vật"');
    await expect(page.locator('table')).toBeVisible();
    
    // Verify nút Sửa tồn tại
    const editBtn = page.locator('button:has-text("Sửa")').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    // Không crash
    await expect(page.locator('table')).toBeVisible();
    
    // Verify nút Tắt/Bật tồn tại
    const toggleBtn = page.getByRole('button', { name: /Tắt|Bật/i }).first();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    // Không crash
    await expect(page.locator('table')).toBeVisible();
  });
});
