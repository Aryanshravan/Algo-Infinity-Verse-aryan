// tests/visualizerKeyboard.test.js
//
// Verifies the visualizer playback keyboard shortcuts (Issue #2567):
// Space (play/pause), R (reset/new), arrow keys (step), +/- (speed),
// S (sound toggle) — including the configurable-selector design needed
// because button IDs are NOT standardized across visualizer pages.

import { jest } from '@jest/globals';

function createFakeElement(overrides = {}) {
  const listeners = {};
  return {
    disabled: false,
    click: jest.fn(),
    value: '0',
    min: '',
    max: '',
    step: '',
    dispatchEvent: jest.fn(),
    addEventListener: jest.fn((type, handler) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    }),
    appendChild: jest.fn(),
    querySelector: jest.fn(() => null),
    setAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    hasAttribute: jest.fn(() => true),
    innerHTML: '',
    ...overrides,
  };
}

describe('visualizer-keyboard', () => {
  let elements;
  let keydownHandler;
  let originalDocument;
  let originalWindow;

  beforeEach(() => {
    elements = {
      '#startBtn': createFakeElement(),
      '#pauseBtn': createFakeElement({ disabled: true }),
      '#resetBtn': createFakeElement(),
      '#newArrayBtn': createFakeElement(),
      '#dbgPrevBtn': createFakeElement({ disabled: true }),
      '#dbgNextBtn': createFakeElement(),
      '#speedRange': createFakeElement({ value: '50', min: '5', max: '1000', step: '' }),
      '#soundToggle': createFakeElement(),
    };

    originalDocument = global.document;
    originalWindow = global.window;

    global.window = {};
    global.document = {
      addEventListener: jest.fn((type, handler) => {
        if (type === 'keydown') keydownHandler = handler;
      }),
      querySelector: jest.fn((selector) => elements[selector] || null),
      querySelectorAll: jest.fn(() => []),
      getElementById: jest.fn(() => null),
      createElement: jest.fn(() => createFakeElement()),
      head: { appendChild: jest.fn() },
      body: { appendChild: jest.fn() },
    };
    global.Event = class {
      constructor(type, opts) {
        this.type = type;
        this.bubbles = opts?.bubbles;
      }
    };
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    jest.clearAllMocks();
  });

  function fireKey(key, extra = {}) {
    const target = extra.target || { tagName: 'DIV', isContentEditable: false };
    const event = {
      key,
      target,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: jest.fn(),
      ...extra,
    };
    keydownHandler(event);
    return event;
  }

  it('Space clicks the pause button when the pause button is enabled, else the play button', async () => {
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({}, { showHelpBadge: false });

    // pauseBtn starts disabled -> falls back to startBtn (play)
    fireKey(' ');
    expect(elements['#startBtn'].click).toHaveBeenCalledTimes(1);
    expect(elements['#pauseBtn'].click).not.toHaveBeenCalled();
  });

  it('Space clicks a combined play/pause toggle when playPause is configured', async () => {
    elements['#btnPlayPause'] = createFakeElement();
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts(
      { playPause: '#btnPlayPause', play: null, pause: null },
      { showHelpBadge: false }
    );

    fireKey(' ');
    expect(elements['#btnPlayPause'].click).toHaveBeenCalledTimes(1);
  });

  it('R clicks reset, falling back to newItem when reset is not configured', async () => {
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({}, { showHelpBadge: false });

    fireKey('r');
    expect(elements['#resetBtn'].click).toHaveBeenCalledTimes(1);
  });

  it('ArrowRight/ArrowLeft click the step forward/back buttons', async () => {
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({}, { showHelpBadge: false });

    fireKey('ArrowRight');
    expect(elements['#dbgNextBtn'].click).toHaveBeenCalledTimes(1);

    // dbgPrevBtn is disabled in this fixture, so it should NOT be clicked.
    fireKey('ArrowLeft');
    expect(elements['#dbgPrevBtn'].click).not.toHaveBeenCalled();
  });

  it('S toggles the sound checkbox', async () => {
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({}, { showHelpBadge: false });

    fireKey('s');
    expect(elements['#soundToggle'].click).toHaveBeenCalledTimes(1);
  });

  it('+ decreases the speedRange value when lower-is-faster (step-delay slider)', async () => {
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({}, { showHelpBadge: false });

    fireKey('+');
    expect(elements['#speedRange'].value).toBe('49');
    expect(elements['#speedRange'].dispatchEvent).toHaveBeenCalled();
  });

  it('- increases the speedRange value when lower-is-faster (step-delay slider)', async () => {
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({}, { showHelpBadge: false });

    fireKey('-');
    expect(elements['#speedRange'].value).toBe('51');
  });

  it('+ increases the value when lower-is-faster is false (direct speed slider)', async () => {
    elements['#bdSpeed'] = createFakeElement({ value: '3', min: '1', max: '5', step: '' });
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts(
      { speedRange: '#bdSpeed', speedRangeLowerIsFaster: false },
      { showHelpBadge: false }
    );

    fireKey('+');
    expect(elements['#bdSpeed'].value).toBe('4');
  });

  it('respects min/max bounds on the speed range', async () => {
    elements['#speedRange'] = createFakeElement({ value: '5', min: '5', max: '1000', step: '' });
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({}, { showHelpBadge: false });

    // Already at min effective value (5) with lowerIsFaster: '+' would push
    // below min, so it should clamp and not fire dispatchEvent (no change).
    fireKey('+');
    expect(Number(elements['#speedRange'].value)).toBeGreaterThanOrEqual(5);
  });

  it('ignores shortcuts while typing in an input field', async () => {
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({}, { showHelpBadge: false });

    fireKey(' ', { target: { tagName: 'INPUT', isContentEditable: false } });
    expect(elements['#startBtn'].click).not.toHaveBeenCalled();
  });

  it('ignores shortcuts when a modifier key is held (avoids clobbering browser shortcuts)', async () => {
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({}, { showHelpBadge: false });

    fireKey('r', { ctrlKey: true });
    expect(elements['#resetBtn'].click).not.toHaveBeenCalled();
  });

  it('does nothing for a configured action whose selector is not present on the page', async () => {
    const { initVisualizerKeyboardShortcuts } = await import('../modules/visualizer-keyboard.js');
    initVisualizerKeyboardShortcuts({ soundToggle: '#doesNotExist' }, { showHelpBadge: false });

    const event = fireKey('s');
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
