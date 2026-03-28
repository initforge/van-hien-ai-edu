import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/student.json' });
import { loginAs } from '../utils/auth';

test.describe('Student Multiverse — Đa vũ trụ Văn học (Mọi nút bấm)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student/multiverse');
    await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('Khám phá các kết thúc khác', { timeout: 15000 });
  });

  test('Header và mô tả hiển thị đúng', async ({ page }) => {
    await expect(page.getByText('Đa Vũ Trụ Văn học')).toBeVisible();
    await expect(page.getByText(/Nếu nhân vật chọn con đường khác/i)).toBeVisible();
  });

  test('Nút Tạo storyline mới mở modal', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /Tạo storyline mới/i }).first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    await expect(page.getByRole('heading', { name: /Tạo Storyline mới/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Tác phẩm gốc/i)).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('Modal Tạo storyline — Hủy đóng modal', async ({ page }) => {
    await page.getByRole('button', { name: /Tạo storyline mới/i }).first().click();
    await expect(page.getByRole('heading', { name: /Tạo Storyline mới/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Huỷ|Hủy/i }).click();
    await expect(page.getByRole('heading', { name: /Tạo Storyline mới/i })).not.toBeVisible();
  });

  test('Storyline selector cards chuyển đổi storyline', async ({ page }) => {
    const tatDenCard = page.getByRole('button', { name: /Tắt đèn — Chị Dậu có tiền sưu/i }).first();
    if (await tatDenCard.count()) {
      await tatDenCard.click();
      await expect(page.getByText('Chị Dậu').first()).toBeVisible();
    }

    const kieuCard = page.getByRole('button', { name: /Truyện Kiều — Kiều không bán mình/i }).first();
    if (await kieuCard.count()) {
      await kieuCard.click();
      await expect(page.getByText('Kiều').first()).toBeVisible();
    }
  });

  test('Điểm rẽ vũ trụ hiển thị đúng nội dung', async ({ page }) => {
    await expect(page.getByText(/Điểm rẽ vũ trụ/i).first()).toBeVisible();
  });

  test('Expand/Collapse Node Cards và nút bên trong', async ({ page }) => {
    await page.getByText(/Nhánh 1/i).first().click();

    const writeBtn = page.getByRole('button', { name: /Viết bài phân tích/i }).first();
    await expect(writeBtn).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Tạo nhánh con/i }).first()).toBeVisible();

    await writeBtn.click();
    await expect(page.getByRole('heading', { name: /Viết bài phân tích/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Huỷ|Hủy/i }).first().click();
  });

  test('Bottom bar — So sánh nhánh, Viết bài phân tích, Xuất PDF', async ({ page }) => {
    const compareBtn = page.getByRole('button', { name: /So sánh nhánh/i });
    await expect(compareBtn).toBeVisible();
    await compareBtn.click();
    await expect(page.getByRole('heading', { name: /So sánh các nhánh/i })).toBeVisible({ timeout: 10000 });
    await page.locator('button:has(span:has-text("close"))').first().click();

    const writeBtn = page.getByRole('button', { name: /Viết bài phân tích/i }).last();
    await expect(writeBtn).toBeVisible();
    await writeBtn.click();
    await expect(page.getByRole('heading', { name: /Viết bài phân tích/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Huỷ|Hủy/i }).first().click();

    const exportBtn = page.getByRole('button', { name: /Xuất PDF/i });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    await expect(page.locator('h2').first()).toContainText('Khám phá');
  });

  test('Dashed placeholder button mở modal tạo storyline', async ({ page }) => {
    const placeholderBtn = page.getByRole('button', { name: /Storyline mới/i }).last();
    if (await placeholderBtn.count()) {
      await placeholderBtn.click();
      await expect(page.getByRole('heading', { name: /Tạo Storyline mới/i })).toBeVisible({ timeout: 10000 });
      await page.getByRole('button', { name: /Huỷ|Hủy/i }).click();
    }
  });
});
