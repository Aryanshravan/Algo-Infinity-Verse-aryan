// tests/shortcutGuard.test.js
//
// Verifies the mobile-viewport guard shared by every keyboard-shortcut
// module (see modules/shortcut-guard.js): shortcuts are disabled on
// mobile-sized viewports (< 768px) and enabled everywhere else, and the
// helpers are also exposed on `window` for classic scripts.

import { jest } from '@jest/globals';

describe('modules/shortcut-guard', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Re-evaluate the module on every test so the window.* globals it
    // exposes are attached to the current mock window.
    jest.resetModules();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('disables shortcuts on a mobile viewport (< 768px)', async () => {
    global.window = { matchMedia: jest.fn(() => ({ matches: true })) };
    const { areKeyboardShortcutsEnabled, isMobileViewport } = await import(
      '../modules/shortcut-guard.js'
    );
    expect(isMobileViewport()).toBe(true);
    expect(areKeyboardShortcutsEnabled()).toBe(false);
  });

  it('keeps shortcuts enabled on a desktop viewport', async () => {
    global.window = { matchMedia: jest.fn(() => ({ matches: false })) };
    const { areKeyboardShortcutsEnabled, isMobileViewport } = await import(
      '../modules/shortcut-guard.js'
    );
    expect(isMobileViewport()).toBe(false);
    expect(areKeyboardShortcutsEnabled()).toBe(true);
  });

  it('keeps shortcuts enabled when matchMedia is unavailable (e.g. non-browser tests)', async () => {
    global.window = {};
    const { areKeyboardShortcutsEnabled, isMobileViewport } = await import(
      '../modules/shortcut-guard.js'
    );
    expect(isMobileViewport()).toBe(false);
    expect(areKeyboardShortcutsEnabled()).toBe(true);
  });

  it('exposes the helpers on window so classic scripts can reuse them', async () => {
    global.window = { matchMedia: jest.fn(() => ({ matches: false })) };
    await import('../modules/shortcut-guard.js');
    expect(typeof global.window.isMobileViewport).toBe('function');
    expect(typeof global.window.areKeyboardShortcutsEnabled).toBe('function');
    expect(global.window.isMobileViewport()).toBe(false);
    expect(global.window.areKeyboardShortcutsEnabled()).toBe(true);
  });
});
