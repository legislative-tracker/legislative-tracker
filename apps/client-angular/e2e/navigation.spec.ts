import { test, expect } from '@playwright/test';

test.describe('Navigation & Static Pages', () => {
  test('should display States Directory page on home /', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('.branding-container')).toBeVisible();
    await expect(page.locator('h1')).toContainText('State Legislatures');
    await expect(page.locator('.jurisdiction-card').first()).toBeVisible();
    await expect(page.locator('.toolbar-state-btn')).toContainText('Select...');
  });

  test('should display About page', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL('/about');
    await expect(page.locator('h1')).toContainText('About');
  });

  test('should display Privacy policy page', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveURL('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy');
  });

  test('should display Login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
  });

  test('should display Toolbar State Picker and navigate on click', async ({
    page,
  }) => {
    await page.goto('/us-ny');
    const stateBtn = page.locator('.toolbar-state-btn');
    await expect(stateBtn).toBeVisible();
    await expect(stateBtn).toContainText('New York');
    await stateBtn.click();
    await expect(page.locator('.state-picker-menu')).toBeVisible();
  });

  test('should render 404 page for invalid route', async ({ page }) => {
    await page.goto('/invalid-route-xyz');
    await expect(page).toHaveURL('/404');
    await expect(page.locator('h1')).toContainText('404');
  });
});
