import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (a11y) Audits', () => {
  test('home/dashboard page should satisfy WCAG 2.1 AA accessibility standards', async ({
    page,
  }) => {
    await page.goto('/us-ny');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('about page should satisfy WCAG 2.1 AA accessibility standards', async ({
    page,
  }) => {
    await page.goto('/about');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should satisfy WCAG 2.1 AA accessibility standards', async ({
    page,
  }) => {
    await page.goto('/login');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('states directory page should satisfy WCAG 2.1 AA accessibility standards', async ({
    page,
  }) => {
    await page.goto('/states');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
