// modules/visualizer-keyboard.js
//
// Shared keyboard shortcuts for algorithm visualizer playback controls
// (Issue #2567). Follows the API pattern of modules/keyboard-shortcuts.js
// (a single init function, a document-level keydown listener, ignores
// shortcuts while the user is typing in a form field).
//
// Unlike the global shortcuts module, visualizer playback button IDs are
// NOT standardized across the 200+ visualizer pages (e.g. sorting-visualizer
// uses #startBtn/#pauseBtn/#resetBtn while bfs-dfs-visualizer uses
// #bdRunBtn/#bdPauseBtn/#bdResetBtn and dp-visualizer combines play/pause
// into a single #btnPlayPause). So this module takes a small config object
// mapping each action to that page's actual selector, rather than assuming
// fixed IDs. Sensible defaults matching the sorting-visualizer convention
// are provided for pages that already follow it.

const DEFAULT_CONFIG = {
  play: '#startBtn',
  pause: '#pauseBtn',
  // A single combined play/pause toggle button, for pages that don't have
  // separate play and pause buttons (e.g. dp-visualizer's #btnPlayPause).
  playPause: null,
  reset: '#resetBtn',
  newItem: '#newArrayBtn',
  stepBack: '#dbgPrevBtn',
  stepForward: '#dbgNextBtn',
  speedRange: '#speedRange',
  // Whether a smaller `speedRange.value` means faster playback (e.g. a
  // "step delay in ms" slider) or slower playback (e.g. a direct "speed"
  // slider). Determines which direction +/- should move the value.
  speedRangeLowerIsFaster: true,
  soundToggle: '#soundToggle',
};

function isTypingTarget(target) {
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function click(selector) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (el && !el.disabled) {
    el.click();
    return true;
  }
  return false;
}

function adjustRange(selector, direction, lowerIsFaster) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return false;

  const step = Number(el.step) || 1;
  const min = el.min !== '' ? Number(el.min) : -Infinity;
  const max = el.max !== '' ? Number(el.max) : Infinity;
  // "Increase speed" should move the value in whichever direction makes
  // playback faster, which depends on the slider's own convention.
  const delta = (lowerIsFaster ? -1 : 1) * direction * step;

  const next = Math.min(max, Math.max(min, Number(el.value) + delta));
  if (next === Number(el.value)) return false;

  el.value = String(next);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

function buildHelpBadgeHtml(config) {
  const rows = [];
  if (config.playPause) rows.push(['Space', 'Play / Pause']);
  else if (config.play || config.pause) rows.push(['Space', 'Play / Pause']);
  if (config.reset || config.newItem) rows.push(['R', 'Reset / New']);
  if (config.stepBack) rows.push(['←', 'Step back']);
  if (config.stepForward) rows.push(['→', 'Step forward']);
  if (config.speedRange) rows.push(['+ / -', 'Speed']);
  if (config.soundToggle) rows.push(['S', 'Toggle sound']);

  const rowsHtml = rows
    .map(([key, label]) => `<div class="visualizer-shortcuts-row"><kbd>${key}</kbd><span>${label}</span></div>`)
    .join('');

  return `
    <button type="button" class="visualizer-shortcuts-toggle" aria-expanded="false" aria-label="Keyboard shortcuts">
      <i class="fas fa-keyboard" aria-hidden="true"></i>
    </button>
    <div class="visualizer-shortcuts-panel" hidden>
      <div class="visualizer-shortcuts-title">Keyboard Shortcuts</div>
      ${rowsHtml}
    </div>
  `;
}

function injectHelpBadgeStyles() {
  if (document.getElementById('visualizer-shortcuts-styles')) return;
  const style = document.createElement('style');
  style.id = 'visualizer-shortcuts-styles';
  style.textContent = `
    .visualizer-shortcuts-badge {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 9997;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }
    .visualizer-shortcuts-toggle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid var(--glass-border, rgba(255,255,255,0.15));
      background: var(--dark-surface, #1a1a3e);
      color: var(--text-primary, #fff);
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .visualizer-shortcuts-toggle:hover { transform: translateY(-2px); }
    .visualizer-shortcuts-panel {
      background: var(--dark-surface, #1a1a3e);
      border: 1px solid var(--glass-border, rgba(255,255,255,0.15));
      border-radius: 10px;
      padding: 12px 14px;
      min-width: 180px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.35);
    }
    .visualizer-shortcuts-title {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 8px;
      color: var(--text-primary, #fff);
    }
    .visualizer-shortcuts-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
      padding: 3px 0;
      color: var(--text-secondary, #a1a1aa);
    }
    .visualizer-shortcuts-row kbd {
      background: rgba(255,255,255,0.08);
      border: 1px solid var(--glass-border, rgba(255,255,255,0.15));
      border-radius: 4px;
      padding: 1px 6px;
      font-family: monospace;
      color: var(--text-primary, #fff);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Render a small floating badge listing the shortcuts available on this
 * page (only the ones that resolved to a real element in the config).
 */
function renderHelpBadge(config) {
  if (document.querySelector('.visualizer-shortcuts-badge')) return;
  injectHelpBadgeStyles();

  const badge = document.createElement('div');
  badge.className = 'visualizer-shortcuts-badge';
  badge.innerHTML = buildHelpBadgeHtml(config);
  document.body.appendChild(badge);

  const toggle = badge.querySelector('.visualizer-shortcuts-toggle');
  const panel = badge.querySelector('.visualizer-shortcuts-panel');
  toggle.addEventListener('click', () => {
    const isHidden = panel.hasAttribute('hidden');
    if (isHidden) panel.removeAttribute('hidden');
    else panel.setAttribute('hidden', '');
    toggle.setAttribute('aria-expanded', String(isHidden));
  });
}

/**
 * Initialize visualizer playback keyboard shortcuts on the current page.
 *
 * @param {Partial<typeof DEFAULT_CONFIG>} [userConfig] - selector overrides;
 *   any action can be set to `null`/omitted to disable that shortcut.
 * @param {Object} [options]
 * @param {boolean} [options.showHelpBadge=true] - render the floating shortcuts badge
 */
export function initVisualizerKeyboardShortcuts(userConfig = {}, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const { showHelpBadge = true } = options;

  document.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.key) {
      case ' ': {
        const handled = config.playPause
          ? click(config.playPause)
          : click(config.pause) || click(config.play);
        if (handled) e.preventDefault();
        break;
      }
      case 'r':
      case 'R': {
        if (click(config.reset) || click(config.newItem)) e.preventDefault();
        break;
      }
      case 'ArrowLeft': {
        if (click(config.stepBack)) e.preventDefault();
        break;
      }
      case 'ArrowRight': {
        if (click(config.stepForward)) e.preventDefault();
        break;
      }
      case '+':
      case '=': {
        if (adjustRange(config.speedRange, 1, config.speedRangeLowerIsFaster)) e.preventDefault();
        break;
      }
      case '-': {
        if (adjustRange(config.speedRange, -1, config.speedRangeLowerIsFaster)) e.preventDefault();
        break;
      }
      case 's':
      case 'S': {
        if (click(config.soundToggle)) e.preventDefault();
        break;
      }
      default:
        break;
    }
  });

  if (showHelpBadge) {
    renderHelpBadge(config);
  }
}
