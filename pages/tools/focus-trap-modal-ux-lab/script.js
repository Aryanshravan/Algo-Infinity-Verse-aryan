/**
 * Focus Trap Modal UX Lab
 * Focus trap completeness, Esc/initial/return focus, scroll-lock/inert, Tab simulation.
 */
(function () {
  'use strict';

  var DEMO_BROKEN = [
    '<!-- Broken modal: no trap, no Esc, focus escapes -->',
    '<div class="modal open" id="promoModal">',
    '  <div class="modal-content">',
    '    <h2>Subscribe</h2>',
    '    <input type="email" placeholder="Email" />',
    '    <button onclick="closeModal()">Close</button>',
    '    <a href="/pricing">See pricing</a>',
    '  </div>',
    '</div>',
    '',
    '<script>',
    'function openModal() {',
    '  document.getElementById("promoModal").classList.add("open");',
    '  // missing: initial focus, inert background, scroll lock',
    '}',
    'function closeModal() {',
    '  document.getElementById("promoModal").classList.remove("open");',
    '  // missing: return focus to opener',
    '}',
    'document.querySelector(".open-btn").addEventListener("click", openModal);',
    '// no keydown for Escape',
    '// no Tab wrap between first/last focusable',
    '</' + 'script>',
  ].join('\n');

  var AFTER_SNIPPET = [
    '<button type="button" id="openDialog">Open</button>',
    '<div',
    '  id="dialog"',
    '  role="dialog"',
    '  aria-modal="true"',
    '  aria-labelledby="dialog-title"',
    '  hidden',
    '>',
    '  <h2 id="dialog-title">Subscribe</h2>',
    '  <button type="button" data-close>Close</button>',
    '  <input type="email" />',
    '</div>',
    '',
    '<script>',
    '(function () {',
    '  var dialog = document.getElementById("dialog");',
    '  var opener = document.getElementById("openDialog");',
    '  var main = document.getElementById("app-main");',
    '  var lastFocus = null;',
    '',
    '  function focusables(root) {',
    '    return root.querySelectorAll(',
    '      \'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])\'',
    '    );',
    '  }',
    '',
    '  function open() {',
    '    lastFocus = document.activeElement;',
    '    dialog.hidden = false;',
    '    document.body.style.overflow = "hidden";',
    '    if (main) main.inert = true;',
    '    var nodes = focusables(dialog);',
    '    (nodes[0] || dialog).focus();',
    '  }',
    '',
    '  function close() {',
    '    dialog.hidden = true;',
    '    document.body.style.overflow = "";',
    '    if (main) main.inert = false;',
    '    if (lastFocus) lastFocus.focus();',
    '  }',
    '',
    '  dialog.addEventListener("keydown", function (e) {',
    '    if (e.key === "Escape") { close(); return; }',
    '    if (e.key !== "Tab") return;',
    '    var nodes = Array.prototype.slice.call(focusables(dialog));',
    '    if (!nodes.length) return;',
    '    var first = nodes[0], last = nodes[nodes.length - 1];',
    '    if (e.shiftKey && document.activeElement === first) {',
    '      e.preventDefault(); last.focus();',
    '    } else if (!e.shiftKey && document.activeElement === last) {',
    '      e.preventDefault(); first.focus();',
    '    }',
    '  });',
    '',
    '  opener.addEventListener("click", open);',
    '  dialog.querySelector("[data-close]").addEventListener("click", close);',
    '})();',
    '</' + 'script>',
  ].join('\n');

  var CHECKLIST_ITEMS = [
    { id: 'role', label: 'role="dialog" (or <dialog>) present' },
    { id: 'modal', label: 'aria-modal="true" or native dialog modal' },
    { id: 'label', label: 'Accessible name (aria-labelledby / aria-label)' },
    { id: 'trap', label: 'Focus trap wraps Tab at first/last focusable' },
    { id: 'esc', label: 'Escape closes the dialog' },
    { id: 'initial', label: 'Initial focus moves into the dialog on open' },
    { id: 'return', label: 'Focus returns to opener on close' },
    { id: 'scroll', label: 'Background scroll locked while open' },
    { id: 'inert', label: 'Background marked inert or aria-hidden' },
  ];

  var state = {
    analyzed: false,
    score: 0,
    trapGaps: 0,
    keyChecks: 0,
    checklistPass: 0,
    findings: [],
    validators: [],
    checklist: [],
    simSteps: [],
    before: '',
    after: AFTER_SNIPPET,
    flags: {},
  };

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

  function detect(code) {
    var c = code;
    var flags = {
      roleDialog: /role\s*=\s*["']dialog["']/i.test(c) || /<dialog[\s>]/i.test(c),
      ariaModal: /aria-modal\s*=\s*["']true["']/i.test(c) || /showModal\s*\(/i.test(c),
      labelled:
        /aria-labelledby\s*=/i.test(c) ||
        /aria-label\s*=/i.test(c) ||
        (/<dialog/i.test(c) && /<h[1-6]/i.test(c)),
      esc:
        /Escape|Esc['"]\s*===|key\s*===\s*['"]Escape['"]|keyCode\s*===\s*27/i.test(c),
      focusCall: /\.focus\s*\(/i.test(c),
      returnFocus:
        /(lastFocus|previousFocus|opener|trigger|activeElement)[\s\S]*?\.focus\s*\(/i.test(c) ||
        /returnFocus|restoreFocus/i.test(c),
      initialFocus:
        /(open|show)[\s\S]{0,400}?\.focus\s*\(/i.test(c) ||
        /focusables?\s*\([^)]*\)\s*\[[^\]]*\]\.focus/i.test(c) ||
        /autofocus/i.test(c),
      tabTrap:
        (/Tab/.test(c) && /shiftKey/i.test(c) && /preventDefault/i.test(c)) ||
        /focus-trap|createFocusTrap|FocusTrap/i.test(c),
      scrollLock:
        /overflow\s*=\s*["']hidden["']/i.test(c) ||
        /document\.body\.style\.overflow/i.test(c) ||
        /scroll-lock|overscroll-behavior/i.test(c),
      inert:
        /\.inert\s*=/i.test(c) ||
        /\binert\b/i.test(c) ||
        /aria-hidden\s*=\s*["']true["']/i.test(c),
      focusableQuery:
        /querySelectorAll\s*\([^)]*(button|a\[href\]|tabindex)/i.test(c) ||
        /focusable/i.test(c),
    };
    return flags;
  }

  function buildValidators(flags) {
    return [
      {
        id: 'esc',
        pass: flags.esc,
        label: 'Esc closes dialog',
        hint: flags.esc
          ? 'Escape handler detected'
          : 'Add keydown listener for Escape → close()',
      },
      {
        id: 'initial',
        pass: flags.initialFocus || (flags.focusCall && flags.roleDialog),
        label: 'Initial focus into dialog',
        hint: flags.initialFocus
          ? 'Focus move on open looks present'
          : 'On open, focus first focusable or a sensible control inside the dialog',
      },
      {
        id: 'return',
        pass: flags.returnFocus,
        label: 'Return focus to opener',
        hint: flags.returnFocus
          ? 'Return-focus pattern detected'
          : 'Store document.activeElement before open; .focus() it on close',
      },
      {
        id: 'trap',
        pass: flags.tabTrap,
        label: 'Focus trap (Tab wrap)',
        hint: flags.tabTrap
          ? 'Tab / Shift+Tab wrap logic found'
          : 'Prevent Tab from leaving: wrap first↔last focusable',
      },
      {
        id: 'scroll',
        pass: flags.scrollLock,
        label: 'Background scroll lock',
        hint: flags.scrollLock
          ? 'Overflow lock detected'
          : 'Set document.body.style.overflow = "hidden" while open',
      },
      {
        id: 'inert',
        pass: flags.inert,
        label: 'Background inert / aria-hidden',
        hint: flags.inert
          ? 'Background isolation detected'
          : 'Prefer inert on the page root behind the dialog (with aria-hidden fallback)',
      },
    ];
  }

  function buildFindings(flags, validators) {
    var findings = [];
    if (!flags.roleDialog) {
      findings.push({
        severity: 'high',
        title: 'Missing dialog role',
        detail: 'Use role="dialog" or the native <dialog> element so AT announce a modal.',
        meta: 'Semantics',
      });
    }
    if (!flags.ariaModal) {
      findings.push({
        severity: 'medium',
        title: 'aria-modal not set',
        detail: 'Set aria-modal="true" (or use showModal()) so assistive tech treat content as modal.',
        meta: 'Semantics',
      });
    }
    if (!flags.labelled) {
      findings.push({
        severity: 'high',
        title: 'Missing accessible name',
        detail: 'Wire aria-labelledby to the title, or aria-label on the dialog container.',
        meta: 'Naming',
      });
    }
    validators.forEach(function (v) {
      if (!v.pass) {
        findings.push({
          severity: v.id === 'trap' || v.id === 'esc' ? 'high' : 'medium',
          title: 'Gap: ' + v.label,
          detail: v.hint,
          meta: 'Validator',
        });
      }
    });
    if (!flags.focusableQuery && !flags.tabTrap) {
      findings.push({
        severity: 'medium',
        title: 'No focusable collection for trap',
        detail: 'Query focusable descendants to implement Tab wrapping reliably.',
        meta: 'Trap',
      });
    }
    if (!findings.length) {
      findings.push({
        severity: 'pass',
        title: 'Strong modal focus patterns detected',
        detail: 'Still verify with keyboard + screen reader in a real browser.',
        meta: 'OK',
      });
    }
    return findings;
  }

  function buildChecklist(flags) {
    var map = {
      role: flags.roleDialog,
      modal: flags.ariaModal,
      label: flags.labelled,
      trap: flags.tabTrap,
      esc: flags.esc,
      initial: flags.initialFocus || (flags.focusCall && flags.roleDialog),
      return: flags.returnFocus,
      scroll: flags.scrollLock,
      inert: flags.inert,
    };
    return CHECKLIST_ITEMS.map(function (item) {
      return {
        id: item.id,
        label: item.label,
        pass: !!map[item.id],
      };
    });
  }

  function scoreFrom(checklist, validators) {
    var pass = checklist.filter(function (c) {
      return c.pass;
    }).length;
    var total = checklist.length;
    var score = Math.round((pass / total) * 100);
    var trapGaps = validators.filter(function (v) {
      return !v.pass;
    }).length;
    var keyChecks = validators.filter(function (v) {
      return v.id === 'esc' || v.id === 'trap' || v.id === 'initial' || v.id === 'return';
    }).length;
    return {
      score: score,
      trapGaps: trapGaps,
      keyChecks: keyChecks,
      checklistPass: pass + '/' + total,
      passCount: pass,
    };
  }

  function inertGuidance(flags) {
    var lines = [];
    lines.push(
      '<strong>Scroll lock:</strong> while open, freeze <code>document.body</code> overflow (and restore on close). Avoid only CSS <code>position: fixed</code> on the overlay without restoring scroll position.'
    );
    lines.push(
      '<strong>Inert:</strong> mark the app root behind the dialog with <code>inert</code> (polyfill if needed) so pointer and focus cannot reach background controls. Fallback: <code>aria-hidden="true"</code> on siblings — never hide the dialog itself.'
    );
    if (!flags.scrollLock) {
      lines.push('<em>Your snippet does not show scroll lock yet.</em>');
    }
    if (!flags.inert) {
      lines.push('<em>Your snippet does not show inert / aria-hidden on the background.</em>');
    }
    return lines.join('<br /><br />');
  }

  function simulateKeys(flags) {
    var steps = [];
    var hasTrap = flags.tabTrap;
    var hasEsc = flags.esc;
    var hasInitial = flags.initialFocus || flags.focusCall;

    steps.push({
      ok: hasInitial,
      text: 'Open → focus moves into dialog' + (hasInitial ? '' : ' (FAIL: stays on opener / body)'),
    });
    steps.push({
      ok: hasTrap,
      text: 'Tab from last focusable → wraps to first' + (hasTrap ? '' : ' (FAIL: focus escapes to page)'),
    });
    steps.push({
      ok: hasTrap,
      text: 'Shift+Tab from first → wraps to last' + (hasTrap ? '' : ' (FAIL: focus escapes backward)'),
    });
    steps.push({
      ok: hasEsc,
      text: 'Esc → closes dialog' + (hasEsc ? '' : ' (FAIL: Esc ignored)'),
    });
    steps.push({
      ok: flags.returnFocus,
      text:
        'After close → focus returns to opener' +
        (flags.returnFocus ? '' : ' (FAIL: focus lost to body)'),
    });
    steps.push({
      ok: flags.inert || flags.scrollLock,
      text:
        'While open → background not interactive / not scrolling' +
        (flags.inert || flags.scrollLock ? '' : ' (WARN: no inert or scroll lock)'),
    });
    return steps;
  }

  function extractBefore(code) {
    var lines = code.trim().split('\n').slice(0, 18);
    return lines.join('\n') || '<!-- paste modal markup -->';
  }

  function setStats(s) {
    $('statScore').textContent = String(s.score);
    $('statTrap').textContent = String(s.trapGaps);
    $('statKeys').textContent = String(s.keyChecks);
    $('statPass').textContent = s.checklistPass;
  }

  function renderFindings(list) {
    var root = $('findingsList');
    root.innerHTML = list
      .map(function (f) {
        return (
          '<article class="focus-finding sev-' +
          escapeHtml(f.severity) +
          '">' +
          '<p class="focus-finding-meta">' +
          escapeHtml(f.meta || f.severity) +
          '</p>' +
          '<h3 class="focus-finding-title">' +
          escapeHtml(f.title) +
          '</h3>' +
          '<p>' +
          escapeHtml(f.detail) +
          '</p></article>'
        );
      })
      .join('');
  }

  function renderValidators(validators) {
    var ul = $('validatorList');
    ul.innerHTML = validators
      .map(function (v) {
        return (
          '<li class="' +
          (v.pass ? 'is-pass' : 'is-fail') +
          '">' +
          (v.pass ? '✓ ' : '✗ ') +
          escapeHtml(v.label) +
          ' — ' +
          escapeHtml(v.hint) +
          '</li>'
        );
      })
      .join('');
  }

  function renderChecklist(items) {
    var ul = $('checklist');
    ul.innerHTML = items
      .map(function (c) {
        return (
          '<li class="focus-check-item ' +
          (c.pass ? 'is-pass' : 'is-fail') +
          '">' +
          '<i class="fas ' +
          (c.pass ? 'fa-circle-check' : 'fa-circle-xmark') +
          '" aria-hidden="true"></i>' +
          '<span>' +
          escapeHtml(c.label) +
          '</span></li>'
        );
      })
      .join('');
  }

  function renderSim(steps) {
    var ol = $('simResults');
    ol.innerHTML = steps
      .map(function (s) {
        return (
          '<li class="' +
          (s.ok ? 'sim-ok' : 'sim-bad') +
          '">' +
          escapeHtml(s.text) +
          '</li>'
        );
      })
      .join('');
  }

  function buildReport(asMarkdown) {
    var lines = [];
    var h = function (t) {
      return asMarkdown ? '## ' + t : t.toUpperCase() + '\n' + Array(t.length + 1).join('=');
    };
    lines.push(asMarkdown ? '# Focus Trap Modal UX Audit' : 'FOCUS TRAP MODAL UX AUDIT');
    lines.push('');
    lines.push('UX score: ' + state.score);
    lines.push('Trap gaps: ' + state.trapGaps);
    lines.push('Checklist: ' + state.checklistPass);
    lines.push('');
    lines.push(h('Findings'));
    state.findings.forEach(function (f) {
      lines.push('- [' + f.severity + '] ' + f.title + ' — ' + f.detail);
    });
    lines.push('');
    lines.push(h('Validators'));
    state.validators.forEach(function (v) {
      lines.push('- ' + (v.pass ? 'PASS' : 'FAIL') + ': ' + v.label + ' — ' + v.hint);
    });
    lines.push('');
    lines.push(h('Keyboard regression checklist'));
    state.checklist.forEach(function (c) {
      lines.push('- [' + (c.pass ? 'x' : ' ') + '] ' + c.label);
    });
    lines.push('');
    lines.push(h('Key simulation'));
    state.simSteps.forEach(function (s) {
      lines.push('- ' + (s.ok ? 'OK' : 'FAIL') + ': ' + s.text);
    });
    lines.push('');
    lines.push(h('Before'));
    lines.push(asMarkdown ? '```html\n' + state.before + '\n```' : state.before);
    lines.push('');
    lines.push(h('After'));
    lines.push(asMarkdown ? '```html\n' + state.after + '\n```' : state.after);
    lines.push('');
    return lines.join('\n');
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function setExportEnabled(on) {
    $('exportMdBtn').disabled = !on;
    $('exportTxtBtn').disabled = !on;
  }

  function analyze() {
    var code = $('modalInput').value || '';
    if (!code.trim()) {
      $('analysisStatus').textContent = 'Paste modal code first';
      return;
    }
    var flags = detect(code);
    var validators = buildValidators(flags);
    var findings = buildFindings(flags, validators);
    var checklist = buildChecklist(flags);
    var scores = scoreFrom(checklist, validators);
    var before = extractBefore(code);

    state.analyzed = true;
    state.flags = flags;
    state.findings = findings;
    state.validators = validators;
    state.checklist = checklist;
    state.score = scores.score;
    state.trapGaps = scores.trapGaps;
    state.keyChecks = scores.keyChecks;
    state.checklistPass = scores.checklistPass;
    state.before = before;
    state.after = AFTER_SNIPPET;
    state.simSteps = simulateKeys(flags);

    setStats(scores);
    renderFindings(findings);
    renderValidators(validators);
    renderChecklist(checklist);
    $('inertGuidance').innerHTML = inertGuidance(flags);
    $('beforeOut').textContent = before;
    $('afterOut').textContent = AFTER_SNIPPET;
    renderSim(state.simSteps);
    $('analysisStatus').textContent =
      'Score ' + scores.score + ' · ' + scores.trapGaps + ' gaps';
    setExportEnabled(true);
  }

  function simulateOnly() {
    var code = $('modalInput').value || '';
    if (!code.trim()) {
      $('analysisStatus').textContent = 'Load demo or paste code first';
      return;
    }
    if (!state.analyzed) {
      analyze();
      return;
    }
    state.simSteps = simulateKeys(state.flags);
    renderSim(state.simSteps);
    $('analysisStatus').textContent = 'Key sequence simulated';
  }

  function clearAll() {
    $('modalInput').value = '';
    state.analyzed = false;
    state.findings = [];
    state.validators = [];
    state.checklist = [];
    state.simSteps = [];
    ['statScore', 'statTrap', 'statKeys', 'statPass'].forEach(function (id) {
      $(id).textContent = '—';
    });
    $('findingsList').innerHTML =
      '<p class="focus-empty">Load the broken demo or paste modal code, then audit.</p>';
    $('validatorList').innerHTML =
      '<li class="focus-empty-li">Validators run after analysis.</li>';
    $('inertGuidance').innerHTML =
      '<p class="focus-empty">Scroll-lock &amp; inert guidance appears here.</p>';
    $('simResults').innerHTML =
      '<li class="focus-empty-li">Run “Simulate keys” after audit (or with demo loaded).</li>';
    $('checklist').innerHTML =
      '<li class="focus-empty-li">Checklist fills after analysis.</li>';
    $('beforeOut').textContent = '—';
    $('afterOut').textContent = '—';
    $('analysisStatus').textContent = 'Ready';
    setExportEnabled(false);
  }

  function init() {
    $('loadDemoBtn').addEventListener('click', function () {
      $('modalInput').value = DEMO_BROKEN;
      $('analysisStatus').textContent = 'Broken demo loaded';
    });
    $('analyzeBtn').addEventListener('click', analyze);
    $('simulateBtn').addEventListener('click', simulateOnly);
    $('clearBtn').addEventListener('click', clearAll);
    $('exportMdBtn').addEventListener('click', function () {
      if (!state.analyzed) return;
      download('modal-ux-audit.md', buildReport(true));
    });
    $('exportTxtBtn').addEventListener('click', function () {
      if (!state.analyzed) return;
      download('modal-ux-audit.txt', buildReport(false));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
