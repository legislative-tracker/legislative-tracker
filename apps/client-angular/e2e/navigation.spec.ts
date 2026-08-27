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
    await expect(stateBtn).toContainText('US-NY');
    await stateBtn.click();
    await expect(page.locator('.state-picker-menu')).toBeVisible();
  });

  test('should display active jurisdiction button in sidenav and persist when navigating outside jurisdiction', async ({
    page,
  }) => {
    await page.goto('/us-ny');
    const jurisdictionNavItem = page.locator(
      'mat-sidenav .jurisdiction-nav-item',
    );
    await expect(jurisdictionNavItem).toBeVisible();
    await expect(jurisdictionNavItem).toContainText('US-NY');
    await expect(jurisdictionNavItem).toHaveAttribute('href', '/us-ny');

    // Navigate to /about (outside jurisdiction)
    await page.goto('/about');
    await expect(jurisdictionNavItem).toBeVisible();
    await expect(jurisdictionNavItem).toContainText('US-NY');
    await expect(jurisdictionNavItem).toHaveAttribute('href', '/us-ny');

    // Clicking it should navigate back to /us-ny
    await jurisdictionNavItem.click();
    await expect(page).toHaveURL('/us-ny');
  });

  test('should render 404 page for invalid route', async ({ page }) => {
    await page.goto('/invalid-route-xyz');
    await expect(page).toHaveURL('/404');
    await expect(page.locator('h1')).toContainText('404');
  });
});
