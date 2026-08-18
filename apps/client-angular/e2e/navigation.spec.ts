import { test, expect } from '@playwright/test';

test.describe('Navigation & Static Pages', () => {
  test('should navigate to home and redirect to /us-ny', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/us-ny/);
    await expect(page.locator('.branding-container')).toBeVisible();
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

  test('should render 404 page for invalid route', async ({ page }) => {
    await page.goto('/invalid-route-xyz');
    await expect(page).toHaveURL('/404');
    await expect(page.locator('h1')).toContainText('404');
  });
});
