import { test, expect } from '@playwright/test';

test.describe('NY Legislature Plugin E2E Integration', () => {
  test('should load NY state dashboard using leg-us-ny plugin', async ({
    page,
  }) => {
    await page.goto('/ny');
    await expect(page).toHaveURL(/\/ny$/);
  });
});
