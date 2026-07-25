import { test, expect } from '@playwright/test';

test.describe('Skip to main content link (#2564)', () => {
  test.beforeEach(async ({ page }) => {
    // Block ServiceWorker registration
    await page.context().route('**/sw.js', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'text/javascript',
        body: 'console.log("SW blocked in tests");',
      });
    });

    await page.context().route('**/api/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false, user: null }),
      });
    });
  });

  test('skip link is present, visually hidden until focused, and points to #main', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const skipLink = page.locator('a.skip-link', { hasText: 'Skip to main content' });
    await expect(skipLink).toHaveAttribute('href', '#main');

    // Off-screen (top: -100%) until focused.
    const topBeforeFocus = await skipLink.evaluate((el) => getComputedStyle(el).top);
    expect(topBeforeFocus).not.toBe('0px');

    await skipLink.focus();
    const topAfterFocus = await skipLink.evaluate((el) => getComputedStyle(el).top);
    expect(topAfterFocus).toBe('0px');
  });

  test('activating the skip link moves focus to the main content landmark', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const skipLink = page.locator('a.skip-link', { hasText: 'Skip to main content' });
    await skipLink.focus();
    await page.keyboard.press('Enter');

    const main = page.locator('main#main');
    await expect(main).toBeVisible();
    await expect(main).toBeFocused();
  });

  test('skip link is the first focusable element on the page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.className || '');
    expect(focused).toContain('skip-link');
  });
});
