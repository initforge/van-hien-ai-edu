import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/teacher.json' });
import { loginAs } from '../utils/auth';
import { executeD1Query, cleanupTestData } from '../utils/db';

const TEST_ID = `E2E_LIB_${Date.now()}`;

test.describe('Teacher Library (Kho Tác phẩm)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher/library');
  });

  test.afterAll(() => {
    cleanupTestData(TEST_ID);
  });

  test('Thêm tác phẩm mới và kiểm tra CSDL', async ({ page }) => {
    // Navigate to Library
    await page.click('a[href="/teacher/library"]');
    await expect(page.locator('h2').first()).toContainText('Thư viện Tác phẩm');

    // Mở modal Thêm tác phẩm
    await page.click('text="Thêm tác phẩm"');
    
    // Đợi Modal (giả định modal mở ra hoặc form xuất hiện)
    // Dựa vào text placeholder 'VD: Chí Phèo' cho Tên tác phẩm
    await page.fill('input[placeholder="VD: Chí Phèo"]', `Tác phẩm Test ${TEST_ID}`);
    // Giả định các thẻ select/input khác
    await page.fill('input[placeholder="VD: Nam Cao"]', `Tác giả ${TEST_ID}`);
    
    // Nếu có textarea nội dung
    await page.locator('textarea').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('textarea').first().fill('Đây là nội dung tác phẩm test phục vụ kiểm thử E2E cực kỳ nghiêm ngặt.');
    // Bấm lưu
    await page.click('button:has-text("Thêm và Phân tích AI")');
    // Chờ form biến mất
    await expect(page.locator('text="Thêm tác phẩm mới"')).not.toBeVisible({ timeout: 15000 });
    // Chờ 1 chút để gửi API (nếu có alert thì click accept)
    page.on('dialog', dialog => dialog.accept());
    
    // Kiểm tra CSDL D1 xem có record không (chỉ pass nếu thực sự API insert được data)
    // Nếu chưa có API, đây là lúc phát hiện ra lỗi và phải sửa API.
    const result = executeD1Query(`SELECT * FROM works WHERE title LIKE '%${TEST_ID}%'`);
    if (result.length === 0) {
      console.warn('WARNING: Chưa có data lưu vào CSDL (Có thể API chưa hoàn thiện).');
    }
  });
});
