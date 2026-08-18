import { test, expect } from '@playwright/test';

test.describe('Member Detail Feature', () => {
  test('should render member detail route for given member ID', async ({
    page,
  }) => {
    await page.goto('/us-ny/ocd-person/ocd-person-test');
    await expect(page).toHaveURL('/us-ny/ocd-person/ocd-person-test');
    await expect(page.locator('.app-header')).toBeVisible();
  });
});
