/**
 * Scroll-Driven Motion A11y Auditor
 * prefers-reduced-motion gaps, scroll risk, compositor hints, before/after.
 */
(function () {
  'use strict';

  var DEMO_SCROLL = [
    '.hero-visual {',
    '  animation: parallax linear;',
    '  animation-timeline: scroll();',
    '  animation-range: 0% 100%;',
    '}',
    '@keyframes parallax {',
    '  from { transform: translateY(0) scale(1); filter: blur(0); opacity: 1; }',
    '  to { transform: translateY(-40vh) scale(1.2); filter: blur(8px); opacity: 0.2; }',
    '}',
    '.marquee {',
    '  animation: slide 12s linear infinite;',
    '}',
    '@keyframes slide {',
    '  from { transform: translateX(0); }',
    '  to { transform: translateX(-50%); }',
    '}',
  ].join('\n');

  var DEMO_PARALLAX = [
    'window.addEventListener("scroll", () => {',
    '  const y = window.scrollY;',
    '  document.querySelectorAll("[data-parallax]").forEach((el) => {',
    '    el.style.top = y * el.dataset.speed + "px";',
    '    el.style.left = Math.sin(y / 40) * 20 + "px";',
    '  });',
    '});',
    '',
    '// continuous spin for "delight"',
    'setInterval(() => {',
    '  badge.style.transform = `rotate(${Date.now() / 10}deg)`;',
    '}, 16);',
  ].join('\n');

  var DEMO_SAFE = [
    '@media (prefers-reduced-motion: no-preference) {',
    '  .reveal {',
    '    animation: fade-in 0.4s ease-out both;',
    '  }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .reveal { animation: none; transition: none; }',
    '  .marquee { animation: none; }',
    '}',
    '@keyframes fade-in {',
    '  from { opacity: 0; transform: translateY(8px); }',
    '  to { opacity: 1; transform: translateY(0); }',
    '}',
  ].join('\n');

  var AFTER_SNIPPET = [
    '@media (prefers-reduced-motion: reduce) {',
    '  *, *::before, *::after {',
    '    animation-duration: 0.01ms !important;',
    '    animation-iteration-count: 1 !important;',
    '    transition-duration: 0.01ms !important;',
    '    scroll-behavior: auto !important;',
    '  }',
    '}',
    '',
    '/* Prefer opacity/transform only; avoid top/left/filter on scroll */',
    '@media (prefers-reduced-motion: no-preference) {',
    '  .reveal {',
    '    animation: fade-in 0.35s ease-out both;',
    '  }',
    '}',
    '',
    '/* Optional: CSS scroll-driven only when motion is OK */',
    '@media (prefers-reduced-motion: no-preference) {',
    '  .hero-visual {',
    '    animation: lift linear;',
    '    animation-timeline: view();',
    '    animation-range: entry 0% cover 40%;',
    '  }',
    '}',
    '@keyframes lift {',
    '  from { opacity: 0.6; transform: translateY(12px); }',
    '  to { opacity: 1; transform: translateY(0); }',
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
    var scrollRisk = 0;
    var mainThread = 0;
    var prmGaps = 0;

    var hasPrm = /prefers-reduced-motion/.test(lower);
    var hasScrollTimeline = /animation-timeline\s*:\s*scroll|animation-timeline\s*:\s*view|scroll-timeline/.test(lower);
    var hasScrollListener = /addEventListener\s*\(\s*['"]scroll['"]/.test(src);
    var hasInfinite = /animation:[^;]*infinite|iteration-count\s*:\s*infinite/.test(lower);
    var layoutProps = /(style\.(top|left|width|height|margin)|offset(Top|Left)|getBoundingClientRect)/.test(src);
    var filterAnim = /filter\s*:|blur\(/.test(lower);
    var setIntervalAnim = /setInterval/.test(src);

    if (!hasPrm && (hasScrollTimeline || hasScrollListener || hasInfinite || /@keyframes/.test(lower))) {
      prmGaps++;
      findings.push({
        sev: 'high',
        title: 'Missing prefers-reduced-motion guard',
        detail: 'Motion styles/scripts run without a reduced-motion media query or matchMedia branch.',
      });
    }

    if (hasScrollTimeline) {
      scrollRisk += 35;
      findings.push({
        sev: 'med',
        title: 'Scroll-/view-driven animation timeline',
        detail: 'Scroll-linked timelines can still trigger vestibular issues — gate with prefers-reduced-motion: no-preference.',
      });
    }

    if (hasScrollListener) {
      scrollRisk += 40;
      mainThread += 40;
      findings.push({
        sev: 'high',
        title: 'scroll event handler mutates layout/style',
        detail: 'Main-thread scroll listeners often cause jank and continuous motion. Prefer IntersectionObserver or CSS timelines behind PRM.',
      });
    }

    if (layoutProps) {
      mainThread += 30;
      scrollRisk += 15;
      findings.push({
        sev: 'high',
        title: 'Non-compositor properties animated',
        detail: 'top/left/width/height force layout. Prefer transform and opacity on the compositor.',
      });
    }

    if (filterAnim) {
      mainThread += 15;
      findings.push({
        sev: 'med',
        title: 'filter / blur in motion path',
        detail: 'Filters are often more expensive than transform/opacity and can amplify nausea when scroll-linked.',
      });
    }

    if (hasInfinite && !hasPrm) {
      scrollRisk += 20;
      prmGaps++;
      findings.push({
        sev: 'med',
        title: 'Infinite animation without reduced-motion opt-out',
        detail: 'Looping marquees/spinners should pause or stop under prefers-reduced-motion: reduce.',
      });
    }

    if (setIntervalAnim) {
      mainThread += 25;
      findings.push({
        sev: 'high',
        title: 'setInterval-driven animation',
        detail: 'Timer loops ignore frame pacing and reduced-motion. Use CSS or WAAPI with cancel on PRM.',
      });
    }

    if (hasPrm && /prefers-reduced-motion\s*:\s*reduce/.test(lower)) {
      findings.push({
        sev: 'low',
        title: 'Reduced-motion branch present',
        detail: 'Good — verify it disables scroll-driven and infinite animations, not only transitions.',
      });
    }

    if (!findings.length) {
      findings.push({
        sev: 'low',
        title: 'No major motion hazards detected',
        detail: 'Still verify vestibular impact manually and test with OS reduced-motion enabled.',
      });
    }

    scrollRisk = Math.min(100, scrollRisk);
    mainThread = Math.min(100, mainThread);
    var penalty = scrollRisk * 0.45 + mainThread * 0.25 + prmGaps * 12;
    var score = Math.max(0, Math.round(100 - penalty));

    var hints = [];
    if (mainThread >= 40) {
      hints.push('Move motion to transform/opacity; avoid reading layout in scroll handlers.');
    } else {
      hints.push('Compositor-friendly properties look mostly OK — keep animating transform/opacity only.');
    }
    hints.push('CSS scroll-driven animations still need @media (prefers-reduced-motion: no-preference).');
    hints.push('Replace scroll listeners with IntersectionObserver for reveal-on-view.');
    hints.push('Offer a visible “reduce motion” control that mirrors the media query for users who need it mid-session.');
    if (hasInfinite) {
      hints.push('Pause infinite marquees when offscreen (content-visibility / IntersectionObserver).');
    }

    return {
      source: src,
      findings: findings,
      scrollRisk: scrollRisk,
      mainThread: mainThread,
      prmGaps: prmGaps,
      score: score,
      hints: hints,
      before: src.slice(0, 1200) || '(empty)',
      after: AFTER_SNIPPET,
    };
  }

  function render(result) {
    state.lastResult = result;
    $('motion-statScore').textContent = result.score + '/100';
    $('motion-statRisk').textContent = result.scrollRisk + '%';
    $('motion-statPrm').textContent = String(result.prmGaps);
    $('motion-statThread').textContent = result.mainThread >= 40 ? 'Heavy' : result.mainThread >= 20 ? 'Mixed' : 'Light';

    $('motion-riskFill').style.width = result.scrollRisk + '%';
    $('motion-riskGauge').setAttribute('aria-valuenow', String(result.scrollRisk));
    $('motion-riskPct').textContent = result.scrollRisk + '%';

    $('motion-findings').innerHTML = result.findings
      .map(function (f) {
        return (
          '<div class="motion-finding"><span class="motion-finding-sev ' +
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

    $('motion-threadHints').innerHTML = result.hints
      .map(function (h) {
        return '<li>' + escapeHtml(h) + '</li>';
      })
      .join('');

    $('motion-before').textContent = result.before;
    $('motion-after').textContent = result.after;
    $('motion-exportBtn').disabled = false;
    $('motion-status').textContent =
      'Audit complete — score ' + result.score + '/100, scroll risk ' + result.scrollRisk + '%.';
  }

  function exportReport() {
    var r = state.lastResult;
    if (!r) return;
    var lines = [
      '# Scroll-Driven Motion Accessibility Audit',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Summary',
      '- A11y score: ' + r.score + '/100',
      '- Scroll-linked risk: ' + r.scrollRisk + '%',
      '- prefers-reduced-motion gaps: ' + r.prmGaps,
      '- Main-thread pressure: ' + r.mainThread + '/100',
      '',
      '## Findings',
    ];
    r.findings.forEach(function (f) {
      lines.push('- [' + f.sev.toUpperCase() + '] ' + f.title + ' — ' + f.detail);
    });
    lines.push('', '## Compositor / main-thread hints');
    r.hints.forEach(function (h) {
      lines.push('- ' + h);
    });
    lines.push('', '## Before', '```', r.before, '```', '', '## After (safer)', '```', r.after, '```');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scroll-driven-motion-a11y-audit.md';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function init() {
    $('motion-input').value = DEMO_SCROLL;

    $('motion-demoScroll').addEventListener('click', function () {
      $('motion-input').value = DEMO_SCROLL;
      $('motion-status').textContent = 'Scroll-driven demo loaded.';
    });
    $('motion-demoParallax').addEventListener('click', function () {
      $('motion-input').value = DEMO_PARALLAX;
      $('motion-status').textContent = 'Parallax JS demo loaded.';
    });
    $('motion-demoSafe').addEventListener('click', function () {
      $('motion-input').value = DEMO_SAFE;
      $('motion-status').textContent = 'Safer demo loaded.';
    });

    $('motion-auditBtn').addEventListener('click', function () {
      render(audit($('motion-input').value));
    });
    $('motion-exportBtn').addEventListener('click', exportReport);

    $('motion-statScore').textContent = '—';
    $('motion-statRisk').textContent = '—';
    $('motion-statPrm').textContent = '—';
    $('motion-statThread').textContent = '—';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
