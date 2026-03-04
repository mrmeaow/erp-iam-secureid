import { expect, test } from '@playwright/test';

test.describe('Tenant & Management', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = `admin-${Date.now()}@test.local`;
    await page.goto('/auth/register');
    await page.fill('#name', 'Admin User');
    await page.fill('#companyName', 'Mgmt Test Corp');
    await page.fill('#email', testUser);
    await page.fill('#password', 'password123');
    await page.check('#terms');
    await page.click('button:has-text("Initialize Identity")');
    await page.waitForURL('/dashboard', { timeout: 15000 });
  });

  test('should navigate through management sections', async ({ page }) => {
    // Wait for side menu items to hydrate based on permissions
    const usersLink = page.getByText('Users & Teams');
    await expect(usersLink).toBeVisible({ timeout: 10000 });

    // Navigate to Users & Teams
    await usersLink.click();
    await expect(page).toHaveURL(/\/dashboard\/users/);
    await expect(page.locator('h2')).toContainText(/Users/i);

    // Navigate to Roles & Permissions
    const rolesLink = page.getByText('Roles & Permissions');
    await rolesLink.click();
    await expect(page).toHaveURL(/\/dashboard\/roles/);
    await expect(page.locator('h2')).toContainText(/Roles/i);

    // Navigate to Audit Logs
    const auditLink = page.getByText('Audit Logs');
    await auditLink.click();
    await expect(page).toHaveURL(/\/dashboard\/audit/);
    await expect(page.locator('h2')).toContainText(/Audit Logs/i);
  });

  test('should show user profile dropdown', async ({ page }) => {
    // Look for the user avatar (initial)
    const profileTrigger = page.locator('.w-8.h-8.rounded-full');
    await expect(profileTrigger).toBeVisible();
    await profileTrigger.hover();

    // The dropdown is triggered by hover (group-hover:visible in HTML)
    await expect(page.locator('text=Profile Settings')).toBeVisible();
    await expect(page.locator('text=Sign Out Account')).toBeVisible();
  });
});
