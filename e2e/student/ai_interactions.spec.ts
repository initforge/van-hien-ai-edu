import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/student.json' });
import { loginAs } from '../utils/auth';

test.describe('Student AI Interactions — Chat Nhân Vật & Đa Vũ Trụ', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
  });

  test('Chat với nhân vật AI — Full flow 3 bước', async ({ page }) => {
    await page.goto('/student/character-chat');
    await expect(page.locator('h2').first()).toContainText('Chọn tác phẩm');

    // Bước 1: Chọn tác phẩm Lão Hạc
    await page.locator('h3:has-text("Lão Hạc")').first().click();
    
    // Bước 2: Chọn nhân vật Lão Hạc
    await expect(page.locator('text=Chọn nhân vật').first()).toBeVisible({ timeout: 10000 });
    await page.locator('h4:has-text("Lão Hạc")').first().click();

    // Bước 3: Giao diện Chat hiển thị
    await expect(page.locator('input[type="text"], textarea').first()).toBeVisible({ timeout: 15000 });
    
    // Gửi tin nhắn
    await page.locator('input[type="text"], textarea').first().fill('Lão Hạc ơi, tại sao Lão lại chọn cái chết đau đớn như vậy?');
    await page.locator('button:has(span:has-text("send"))').click();
    
    // Verify tin nhắn user xuất hiện
    await expect(page.locator('text=Lão Hạc ơi, tại sao').first()).toBeVisible();
  });

  test('Nút Quay lại hoạt động trong Chat flow', async ({ page }) => {
    await page.goto('/student/character-chat');
    await page.locator('h3:has-text("Lão Hạc")').first().click();
    await expect(page.locator('text=Chọn nhân vật').first()).toBeVisible({ timeout: 10000 });
    
    // Quay lại về bước chọn tác phẩm
    const backBtn = page.locator('button:has-text("Quay lại"), button:has(span:has-text("arrow_back"))').first();
    await backBtn.click();
    await expect(page.locator('h2').first()).toContainText('Chọn tác phẩm');
  });

  test('Nút Xem cuộc hội thoại mẫu hiển thị sample messages', async ({ page }) => {
    await page.goto('/student/character-chat');
    await page.locator('h3:has-text("Lão Hạc")').first().click();
    await page.locator('h4:has-text("Lão Hạc")').first().click();
    
    // Tìm nút mẫu
    const sampleBtn = page.locator('button:has-text("Xem cuộc hội thoại mẫu")');
    if (await sampleBtn.count() > 0) {
      await sampleBtn.click();
      // Sample messages should appear
      await expect(page.locator('text=Tại sao ông lại phải bán cậu Vàng').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Chọn nhiều tác phẩm khác nhau', async ({ page }) => {
    await page.goto('/student/character-chat');
    
    // Chọn Tắt đèn
    await page.locator('h3:has-text("Tắt đèn")').first().click();
    await expect(page.locator('h4:has-text("Chị Dậu")').first()).toBeVisible({ timeout: 10000 });
    
    // Quay lại
    const backBtn = page.locator('button:has-text("Quay lại"), button:has(span:has-text("arrow_back"))').first();
    await backBtn.click();
    
    // Chọn Truyện Kiều  
    await page.locator('h3:has-text("Truyện Kiều")').first().click();
    await expect(page.locator('h4:has-text("Thuý Kiều")').first()).toBeVisible({ timeout: 10000 });
  });
});
