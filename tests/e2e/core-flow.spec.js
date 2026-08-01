import { test, expect } from '@playwright/test';

test.describe('Core User Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Block ServiceWorker registration to prevent caching issues in tests
    await page.context().route('**/sw.js', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'text/javascript',
        body: 'console.log("SW blocked in tests");',
      });
    });

    // Mock API session request to return authenticated: true
    await page.context().route('**/api/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user: { sub: 'test-user', name: 'Test User', email: 'test@example.com' },
        }),
      });
    });

    // Mock other initial API requests
    await page.context().route('**/api/problem-notes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, notes: {} }),
      });
    });
    await page.context().route('**/api/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    await page.context().route('**/api/spaced-repetition', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, cards: {} }),
      });
    });
    await page.context().route('**/api/leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, leaderboard: [] }),
      });
    });
    await page.context().route('**/api/battles/history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ history: [] }),
      });
    });
  });

  test('simulate real user interactions in a headless browser', async ({ page }) => {
    // 1. Log in (using Guest Login to simulate interaction if UI is needed, or just rely on session mock)
    // The issue says "logging in, joining a WebRTC room, writing code, and submitting it."
    await page.goto('/pages/auth/login.html');
    await page.waitForLoadState('networkidle');

    // Mock guest login response
    await page.context().route('**/api/guest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { sub: 'guest-test', name: 'Guest Test' } }),
      });
    });

    // Click "Continue as Guest"
    const guestBtn = page.locator('[data-auth-guest]');
    if (await guestBtn.isVisible()) {
      await guestBtn.click();
    }

    // Navigate to Battle Mode (WebRTC Room)
    await page.goto('/pages/Dsa-Battle/dsa-battle-mode.html');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the lobby to appear
    await expect(page.locator('#battle-lobby')).toBeVisible();

    // Mock the socket.io logic directly in the browser to simulate server response for battle finding
    await page.addInitScript(() => {
      window.io = function () {
        return {
          on: function (event, callback) {
            this[event] = callback;
          },
          emit: function (event, data) {
            if (event === 'find-match') {
              // Simulate server finding a match
              setTimeout(() => {
                if (this['match-found']) {
                  this['match-found']({
                    battleId: 'TEST-BATTLE',
                    battleData: {
                      problemTitle: 'Two Sum',
                      problemDescription: 'Find two numbers that add up to target',
                      difficulty: 'Easy',
                    },
                    opponentName: { 'guest-test': 'Opponent Bot' },
                  });
                }
              }, 500);
            }
            if (event === 'battle-join') {
              setTimeout(() => {
                if (this['battle-init-state']) {
                  this['battle-init-state']({ updates: [] });
                }
              }, 100);
            }
            if (event === 'battle-submit') {
              // Simulate code evaluation success
              setTimeout(() => {
                if (this['battle-over']) {
                  this['battle-over']({
                    winnerId: data.userId,
                    xpAwarded: 50,
                    badge: 'First Blood',
                  });
                }
              }, 500);
            }
          },
        };
      };
    });

    // Reload the page to inject the mock socket
    await page.goto('/pages/Dsa-Battle/dsa-battle-mode.html');
    await page.waitForLoadState('domcontentloaded');

    // Click 'Find Match'
    await page.click('#findMatchBtn');

    // Wait for the battle to start (active-battle section becomes visible)
    await expect(page.locator('#active-battle')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#problemTitle')).toContainText('Two Sum');

    // 3. Write code
    await page.evaluate(() => {
      if (window.editor) {
        window.editor.setValue('function twoSum(nums, target) {\n  return [0, 1];\n}');
      } else {
        const solCode = document.getElementById('solutionCode');
        solCode.value = 'function twoSum(nums, target) {\n  return [0, 1];\n}';
        solCode.dispatchEvent(new Event('input'));
      }
    });

    // 4. Submit it
    await page.click('#submitSolutionBtn');

    // Check that submit status message appears indicating win
    const statusMsg = page.locator('#submitStatusMsg');
    await expect(statusMsg).toBeVisible();
    await expect(statusMsg).toContainText('You won the battle', { timeout: 10000 });
  });
});
