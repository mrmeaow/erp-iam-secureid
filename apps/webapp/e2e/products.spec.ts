import { expect, test } from '@playwright/test';

test.describe('Product Management', () => {
  const testUser = `owner-${Date.now()}@test.local`;
  const companyName = `E2E Corp ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Register a fresh tenant for isolation
    await page.goto('/auth/register');
    await page.fill('#name', 'E2E Owner');
    await page.fill('#companyName', companyName);
    await page.fill('#email', testUser);
    await page.fill('#password', 'password123');
    await page.check('#terms');
    await page.click('button:has-text("Initialize Identity")');

    // Wait for dashboard and PERMISSIONS to hydrate
    await page.waitForURL('/dashboard', { timeout: 15000 });
    // Navigate to products (the link should be visible now)
    await page.getByText('Products').click();
    await expect(page.locator('h2')).toContainText(/Products/i);
  });

  test('should list products (empty state)', async ({ page }) => {
    await expect(page.getByText('No products found in this tenant.')).toBeVisible();
  });

  test('should create a new product via prompts', async ({ page }) => {
    const productName = `E2E ${Date.now()}`;

    // Setup dialog handlers sequentially
    let dialogCount = 0;
    const dialogResponses = [productName, 'E2E-PROD-001', '150.50'];

    page.on('dialog', async (dialog) => {
      if (dialogCount < dialogResponses.length) {
        await dialog.accept(dialogResponses[dialogCount]);
        dialogCount++;
      }
    });

    // We click and wait for the POST API call to finish
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/v1/products') &&
          resp.request().method() === 'POST' &&
          resp.status() === 201,
      ),
      page.click('text=Add Product'),
    ]);

    // Wait for the new item to appear in table
    await expect(page.locator('table')).toContainText(productName);
    await expect(page.locator('table')).toContainText('E2E-PROD-001');
    await expect(page.locator('table')).toContainText('$150.5');
  });

  test('should delete a product via confirm', async ({ page }) => {
    const productName = `DEL-${Date.now()}`;

    // 1. Create a product first
    let dialogIndex = 0;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        const responses = [productName, 'SKU-DEL', '99'];
        await dialog.accept(responses[dialogIndex++] || '');
      } else if (dialog.type() === 'confirm') {
        await dialog.accept();
      }
    });

    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/v1/products') &&
          resp.request().method() === 'POST' &&
          resp.status() === 201,
      ),
      page.click('text=Add Product'),
    ]);

    await expect(page.locator('table')).toContainText(productName);

    // 2. Delete it
    const row = page.locator('table tbody tr').filter({ hasText: productName });
    await Promise.all([
      // Wait for the DELETE request
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/v1/products') &&
          resp.request().method() === 'DELETE' &&
          resp.status() === 200,
      ),
      row.locator('button[title="Delete Product"]').click(),
    ]);

    await expect(page.locator('table')).not.toContainText(productName);
  });
});
