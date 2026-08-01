/**
 * CSS Anchor Positioning Fallback Lab
 * position-try / fallback detection, collision risk, accessible placement.
 */
(function () {
  'use strict';

  var DEMO_FRAGILE = [
    '.trigger { anchor-name: --menu-btn; }',
    '.menu {',
    '  position: absolute;',
    '  position-anchor: --menu-btn;',
    '  top: anchor(bottom);',
    '  left: anchor(left);',
    '  /* no position-try / fallback — clips at viewport edges */',
    '}',
    '[popover] {',
    '  margin: 0;',
    '}',
  ].join('\n');

  var DEMO_TRY = [
    '.trigger { anchor-name: --tip; }',
    '.tooltip {',
    '  position: absolute;',
    '  position-anchor: --tip;',
    '  position-area: block-end span-inline-end;',
    '  position-try-fallbacks: flip-block, flip-inline, --corner;',
    '}',
    '@position-try --corner {',
    '  position-area: block-start span-inline-start;',
    '}',
  ].join('\n');

  var DEMO_SAFE = [
    '.trigger { anchor-name: --menu; }',
    '.menu[popover] {',
    '  position: absolute;',
    '  position-anchor: --menu;',
    '  position-area: block-end span-all;',
    '  position-try-fallbacks: flip-block, flip-inline;',
    '  inset-area: auto; /* progressive */',
    '  max-width: min(20rem, 100vw - 1rem);',
    '  max-height: min(70vh, 24rem);',
    '  overflow: auto;',
    '}',
    '@supports not (anchor-name: --x) {',
    '  .menu { /* JS Floating UI / Popover polyfill path */ }',
    '}',
  ].join('\n');

  var AFTER_SNIPPET = [
    '.trigger { anchor-name: --menu-btn; }',
    '',
    '.menu[popover] {',
    '  position: absolute;',
    '  position-anchor: --menu-btn;',
    '  position-area: block-end span-inline-end;',
    '  position-try-fallbacks: flip-block, flip-inline, --menu-corner;',
    '  max-width: min(22rem, calc(100vw - 1rem));',
    '  max-height: min(70vh, 28rem);',
    '  overflow: auto;',
    '}',
    '',
    '@position-try --menu-corner {',
    '  position-area: block-start span-inline-start;',
    '}',
    '',
    '/* Focus: keep first focusable inside popover; Esc closes; return focus to trigger */',
    '@supports not (anchor-name: --x) {',
    '  .menu { /* fallback: fixed + JS collision middleware */ }',
    '}',
  ].join('\n');

  var state = { lastResult: null };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function audit(source) {
    var src = String(source || '');
    var lower = src.toLowerCase();
    var findings = [];
    var collision = 0;
    var gaps = 0;
    var fallbacks = 0;

    var usesAnchor =
      /anchor-name|position-anchor|anchor\(|position-area|inset-area/.test(lower);
    var hasTry =
      /position-try|position-try-fallbacks|@position-try/.test(lower);
    var hasPopover = /popover|\[popover\]/.test(lower);
    var hasMaxSize = /max-width|max-height|min\(/.test(lower);
    var hasOverflow = /overflow\s*:\s*(auto|scroll|hidden)/.test(lower);
    var hasSupports = /@supports/.test(lower);
    var fixedOnly = /position\s*:\s*fixed/.test(lower) && !usesAnchor;

    if (usesAnchor) {
      if (hasTry) {
        fallbacks += (lower.match(/flip-block|flip-inline|@position-try|position-try-fallbacks/g) || []).length;
        findings.push({
          sev: 'low',
          title: 'position-try / fallbacks declared',
          detail: 'Good — verify flip-block and flip-inline cover your edge cases.',
        });
      } else {
        gaps++;
        collision += 45;
        findings.push({
          sev: 'high',
          title: 'Missing position-try fallbacks',
          detail: 'Anchored UI without flip/try options will clip or overflow at viewport edges.',
        });
      }
    } else if (hasPopover || fixedOnly) {
      gaps++;
      collision += 30;
      findings.push({
        sev: 'med',
        title: 'No CSS anchor positioning detected',
        detail: 'Popover/fixed layers still need collision middleware or try-fallbacks when adopting anchors.',
      });
    }

    if (usesAnchor && !hasMaxSize) {
      gaps++;
      collision += 20;
      findings.push({
        sev: 'med',
        title: 'No viewport-aware max size',
        detail: 'Use max-width/max-height with min(..., 100vw/vh) so menus remain usable on small screens.',
      });
    }

    if (usesAnchor && !hasOverflow) {
      gaps++;
      collision += 10;
      findings.push({
        sev: 'med',
        title: 'Missing overflow strategy',
        detail: 'Tall menus should scroll inside the layer (overflow: auto) instead of growing off-screen.',
      });
    }

    if (usesAnchor && !hasSupports) {
      gaps++;
      findings.push({
        sev: 'med',
        title: 'No @supports fallback path',
        detail: 'Provide a JS floating library or static placement when anchor positioning is unsupported.',
      });
    }

    if (hasPopover && !/focus|esc|aria|role\s*=/.test(lower)) {
      findings.push({
        sev: 'med',
        title: 'Popover a11y not described in CSS sample',
        detail: 'Pair popovers with focus trap / Esc / aria-expanded on the trigger (behavior lives in JS/HTML).',
      });
    }

    if (!findings.length) {
      findings.push({
        sev: 'low',
        title: 'No critical placement gaps',
        detail: 'Still test near each viewport edge and with zoomed text.',
      });
    }

    collision = Math.min(100, collision);
    var score = Math.max(0, Math.round(100 - collision * 0.55 - gaps * 8));

    var suggestions = [
      'Declare position-try-fallbacks: flip-block, flip-inline (plus a custom @position-try corner).',
      'Keep the trigger discoverable: aria-expanded, aria-controls, and return focus on close.',
      'Ensure the floating layer stays in the reading order / top layer (popover) without covering critical content permanently.',
      'Cap size with min(…, 100vw/vh) and overflow: auto for long lists.',
      'Ship an @supports not (anchor-name: --x) path with JS middleware (shift/flip).',
      'Test keyboard: Tab into menu, Esc closes, focus returns to the anchor control.',
    ];
    if (!hasTry && usesAnchor) {
      suggestions.unshift('Highest priority: add position-try-fallbacks before shipping edge-of-screen menus.');
    }

    return {
      source: src,
      findings: findings,
      collision: collision,
      gaps: gaps,
      fallbacks: fallbacks,
      score: score,
      suggestions: suggestions,
      before: src.slice(0, 1200) || '(empty)',
      after: AFTER_SNIPPET,
    };
  }

  function render(result) {
    state.lastResult = result;
    $('anchor-statScore').textContent = result.score + '/100';
    $('anchor-statCollision').textContent = result.collision + '%';
    $('anchor-statFallback').textContent = String(result.fallbacks);
    $('anchor-statGaps').textContent = String(result.gaps);

    $('anchor-riskFill').style.width = result.collision + '%';
    $('anchor-riskGauge').setAttribute('aria-valuenow', String(result.collision));
    $('anchor-riskPct').textContent = result.collision + '%';

    $('anchor-findings').innerHTML = result.findings
      .map(function (f) {
        return (
          '<div class="anchor-finding"><span class="anchor-finding-sev ' +
          escapeHtml(f.sev) +
          '">' +
          escapeHtml(f.sev) +
          '</span><div><strong>' +
          escapeHtml(f.title) +
          '</strong><br />' +
          escapeHtml(f.detail) +
          '</div></div>'
        );
      })
      .join('');

    $('anchor-suggestions').innerHTML = result.suggestions
      .map(function (s) {
        return '<li>' + escapeHtml(s) + '</li>';
      })
      .join('');

    $('anchor-before').textContent = result.before;
    $('anchor-after').textContent = result.after;
    $('anchor-exportBtn').disabled = false;
    $('anchor-status').textContent =
      'Audit complete — UX score ' + result.score + '/100, collision risk ' + result.collision + '%.';
  }

  function exportReport() {
    var r = state.lastResult;
    if (!r) return;
    var lines = [
      '# CSS Anchor Positioning UX Audit',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Summary',
      '- UX score: ' + r.score + '/100',
      '- Viewport collision risk: ' + r.collision + '%',
      '- Fallback signals: ' + r.fallbacks,
      '- Gaps: ' + r.gaps,
      '',
      '## Findings',
    ];
    r.findings.forEach(function (f) {
      lines.push('- [' + f.sev.toUpperCase() + '] ' + f.title + ' — ' + f.detail);
    });
    lines.push('', '## Accessible placement suggestions');
    r.suggestions.forEach(function (s) {
      lines.push('- ' + s);
    });
    lines.push('', '## Before', '```css', r.before, '```', '', '## After', '```css', r.after, '```');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'css-anchor-positioning-ux-audit.md';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function init() {
    $('anchor-input').value = DEMO_FRAGILE;

    $('anchor-demoFragile').addEventListener('click', function () {
      $('anchor-input').value = DEMO_FRAGILE;
      $('anchor-status').textContent = 'Fragile demo loaded.';
    });
    $('anchor-demoTry').addEventListener('click', function () {
      $('anchor-input').value = DEMO_TRY;
      $('anchor-status').textContent = 'position-try demo loaded.';
    });
    $('anchor-demoSafe').addEventListener('click', function () {
      $('anchor-input').value = DEMO_SAFE;
      $('anchor-status').textContent = 'Accessible demo loaded.';
    });

    $('anchor-auditBtn').addEventListener('click', function () {
      render(audit($('anchor-input').value));
    });
    $('anchor-exportBtn').addEventListener('click', exportReport);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
