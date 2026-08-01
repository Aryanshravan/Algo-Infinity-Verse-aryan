// tests/keyboardShortcutsMobile.test.js
//
// Verifies that the global keyboard-shortcut module does not bind its
// document keydown listener on mobile-sized viewports (< 768px) while still
// binding it on desktop viewports.

import { jest } from '@jest/globals';

describe('modules/keyboard-shortcuts mobile guard', () => {
  const originalDocument = global.document;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    jest.clearAllMocks();
  });

  function mockDom() {
    global.document = {
      getElementById: jest.fn(() => null),
      querySelectorAll: jest.fn(() => []),
      addEventListener: jest.fn(),
    };
  }

  it('does not bind the keydown shortcut listener on a mobile viewport (< 768px)', async () => {
    global.window = { matchMedia: jest.fn(() => ({ matches: true })) };
    mockDom();

    const { initKeyboardShortcuts } = await import('../modules/keyboard-shortcuts.js');
    initKeyboardShortcuts();

    expect(global.document.addEventListener).not.toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });

  it('binds the keydown shortcut listener on a desktop viewport', async () => {
    global.window = { matchMedia: jest.fn(() => ({ matches: false })) };
    mockDom();

    const { initKeyboardShortcuts } = await import('../modules/keyboard-shortcuts.js');
    initKeyboardShortcuts();

    expect(global.document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });
});
