import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should show login page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/SECURE.ID/i);
    await expect(page.getByText('Welcome back! Sign in to continue')).toBeVisible();
  });

  test('should allow navigating to register', async ({ page }) => {
    await page.click('text=Register Organization');
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.locator('h1')).toContainText(/SECURE.ID/i);
    await expect(page.getByText('Onboard your organization securely')).toBeVisible();
  });

  test('should show validation error on empty fields', async ({ page }) => {
    // Fill with invalid email
    const emailInput = page.locator('#email');
    await emailInput.fill('invalid-email');
    // Blur to trigger validation if needed, though Angular often does it on input
    await emailInput.blur();

    const emailError = page.getByText('Please enter a valid business email address.');
    await expect(emailError).toBeVisible();

    // Ensure button is disabled
    const loginBtn = page.getByRole('button', { name: 'Identify & Access' });
    await expect(loginBtn).toBeDisabled();
  });
});
