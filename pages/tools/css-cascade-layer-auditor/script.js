/**
 * CSS Cascade Layer Auditor
 * Specificity conflicts, !important debt, @layer migration, :has() risk hints.
 */
(function () {
  'use strict';

  var DEMO_CSS = [
    '/* Demo: specificity wars, !important debt, deep :has() */',
    '.card .title { color: #333; }',
    '.card .title.featured { color: #0066cc !important; }',
    '#app .card .title.featured span { color: red !important; }',
    '',
    'nav ul li a.button.active {',
    '  background: navy !important;',
    '  padding: 8px;',
    '}',
    '',
    '.btn { padding: 4px; }',
    'button.btn.primary { padding: 12px !important; }',
    '',
    'form:has(input:invalid) .submit { opacity: 0.5; }',
    'main:has(.sidebar:has(.widget:hover)) .content { margin-left: 0; }',
    '.grid:has(> .item:nth-child(n+20):has(.badge)) { gap: 0; }',
    '',
    '.legacy-theme * * * * * .deep { font-size: 14px !important; }',
  ].join('\n');

  var state = {
    analyzed: false,
    debtScore: 0,
    conflicts: [],
    findings: [],
    hasHints: [],
    layerPlan: [],
    importantCount: 0,
    deepCount: 0,
    hasCount: 0,
    before: '',
    after: '',
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

  function stripComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  function lineOf(text, index) {
    return text.slice(0, index).split('\n').length;
  }

  /**
   * Rough specificity: (a,b,c) for ids / classes|attrs|pseudos / elements|pseudo-elements
   */
  function specificity(selector) {
    var sel = selector
      .replace(/::?[a-zA-Z-]+(\([^)]*\))?/g, function (m) {
        return m.indexOf('::') === 0 ? ' PE ' : ' PS ';
      })
      .replace(/\[[^\]]*]/g, ' AT ')
      .replace(/#[\w-]+/g, function () {
        return ' ID ';
      })
      .replace(/\.[\w-]+/g, function () {
        return ' CL ';
      })
      .replace(/:has\s*\(/gi, ' PS (');

    var a = (sel.match(/\bID\b/g) || []).length;
    var b =
      (sel.match(/\bCL\b/g) || []).length +
      (sel.match(/\bAT\b/g) || []).length +
      (sel.match(/\bPS\b/g) || []).length;
    var c = (sel.match(/\bPE\b/g) || []).length;
    var elements = sel
      .replace(/\b(ID|CL|AT|PS|PE)\b/g, ' ')
      .replace(/[>+~*,()]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(function (t) {
        return t && !/^(not|is|where|has|nth-child|nth-of-type|n)$/i.test(t);
      });
    c += elements.length;
    return { a: a, b: b, c: c, score: a * 10000 + b * 100 + c, text: a + ',' + b + ',' + c };
  }

  function selectorDepth(selector) {
    var parts = selector
      .replace(/:[a-zA-Z-]+(\([^)]*\))?/g, '')
      .split(/[\s>+~]+/)
      .filter(Boolean);
    return parts.length;
  }

  function parseRules(css) {
    var clean = stripComments(css);
    var rules = [];
    var re = /([^{}@]+)\{([^{}]*)\}/g;
    var m;
    while ((m = re.exec(clean)) !== null) {
      var selectors = m[1].split(',').map(function (s) {
        return s.trim();
      }).filter(Boolean);
      var body = m[2];
      var important = (body.match(/!important/gi) || []).length;
      selectors.forEach(function (sel) {
        if (!sel || sel.charAt(0) === '@') return;
        rules.push({
          selector: sel,
          body: body.trim(),
          important: important,
          specificity: specificity(sel),
          depth: selectorDepth(sel),
          hasHas: /:has\s*\(/i.test(sel),
          line: lineOf(clean, m.index),
          index: m.index,
        });
      });
    }
    return rules;
  }

  function propertyKeys(body) {
    return body
      .split(';')
      .map(function (d) {
        return d.split(':')[0].trim().toLowerCase();
      })
      .filter(Boolean);
  }

  function findConflicts(rules) {
    var conflicts = [];
    var byProp = {};
    rules.forEach(function (r) {
      propertyKeys(r.body).forEach(function (prop) {
        if (!byProp[prop]) byProp[prop] = [];
        byProp[prop].push(r);
      });
    });
    Object.keys(byProp).forEach(function (prop) {
      var list = byProp[prop];
      if (list.length < 2) return;
      for (var i = 0; i < list.length; i++) {
        for (var j = i + 1; j < list.length; j++) {
          var a = list[i];
          var b = list[j];
          var sa = a.specificity.score;
          var sb = b.specificity.score;
          var impDelta = (a.important > 0 ? 1 : 0) - (b.important > 0 ? 1 : 0);
          if (Math.abs(sa - sb) <= 50 || (impDelta !== 0 && sa !== sb)) {
            conflicts.push({
              prop: prop,
              a: a,
              b: b,
              reason:
                impDelta !== 0
                  ? '!important flips winner despite specificity'
                  : 'Near-equal specificity on shared property',
            });
          }
        }
      }
    });
    return conflicts.slice(0, 24);
  }

  function analyzeHas(rules) {
    var hints = [];
    rules.forEach(function (r) {
      if (!r.hasHas) return;
      var nested = (r.selector.match(/:has\s*\(/gi) || []).length;
      var sev = 'low';
      var msg = 'Prefer scoped :has() near leaf nodes; avoid document-wide ancestors.';
      if (nested >= 2) {
        sev = 'high';
        msg = 'Nested :has(:has()) multiplies matching work — flatten or move logic to a class.';
      } else if (/:has\s*\([^)]*:hover/i.test(r.selector) || /:has\s*\([^)]*:focus/i.test(r.selector)) {
        sev = 'high';
        msg = ':has() with :hover/:focus can invalidate large subtrees on every pointer move.';
      } else if (r.depth >= 4 || /:nth-child/i.test(r.selector)) {
        sev = 'medium';
        msg = 'Deep or nth-child :has() widens invalidation — add a containing class gate.';
      }
      hints.push({
        severity: sev,
        title: ':has() on ' + r.selector.slice(0, 64) + (r.selector.length > 64 ? '…' : ''),
        detail: msg,
        line: r.line,
        snippet: r.selector,
      });
    });
    return hints;
  }

  function buildFindings(rules, conflicts, hasHints) {
    var findings = [];
    var importantRules = rules.filter(function (r) {
      return r.important > 0;
    });
    if (importantRules.length) {
      findings.push({
        severity: importantRules.length >= 3 ? 'high' : 'medium',
        title: importantRules.length + ' rule(s) use !important',
        detail: 'Each !important raises cascade debt and blocks orderly @layer migration.',
        meta: 'Debt',
        snippet: importantRules
          .slice(0, 3)
          .map(function (r) {
            return r.selector;
          })
          .join('\n'),
      });
    }
    var deep = rules.filter(function (r) {
      return r.depth >= 5;
    });
    if (deep.length) {
      findings.push({
        severity: 'medium',
        title: deep.length + ' deep selector(s) (depth ≥ 5)',
        detail: 'Deep chains couple markup structure to style and inflate specificity.',
        meta: 'Specificity',
        snippet: deep[0].selector,
      });
    }
    conflicts.slice(0, 6).forEach(function (c) {
      findings.push({
        severity: c.a.important || c.b.important ? 'high' : 'medium',
        title: 'Conflict on `' + c.prop + '`',
        detail: c.reason + ': ' + c.a.selector + ' (' + c.a.specificity.text + ') vs ' + c.b.selector + ' (' + c.b.specificity.text + ')',
        meta: 'Line ~' + c.a.line,
        snippet: c.a.selector + ' { … }\n' + c.b.selector + ' { … }',
      });
    });
    hasHints.forEach(function (h) {
      findings.push({
        severity: h.severity,
        title: h.title,
        detail: h.detail,
        meta: 'Line ~' + h.line,
        snippet: h.snippet,
      });
    });
    if (!findings.length) {
      findings.push({
        severity: 'low',
        title: 'No major cascade red flags',
        detail: 'Still consider declaring @layer order early for predictable growth.',
        meta: 'OK',
        snippet: '',
      });
    }
    return findings;
  }

  function debtScore(rules) {
    var important = 0;
    var deep = 0;
    var ids = 0;
    rules.forEach(function (r) {
      important += r.important;
      if (r.depth >= 5) deep += 1;
      if (r.specificity.a > 0) ids += 1;
    });
    var score = Math.min(100, important * 12 + deep * 8 + ids * 6 + Math.min(30, rules.length));
    return { score: score, important: important, deep: deep, ids: ids };
  }

  function buildLayerPlan(rules) {
    var plan = [
      { layer: 'reset', why: 'Normalize / reboot — lowest cascade layer' },
      { layer: 'tokens', why: 'Custom properties and design tokens' },
      { layer: 'base', why: 'Element defaults (type selectors)' },
      { layer: 'components', why: 'Class-based UI blocks (.card, .btn)' },
      { layer: 'utilities', why: 'Single-purpose helpers' },
      { layer: 'overrides', why: 'Rare exceptions — prefer fewer !important' },
    ];
    var hasId = rules.some(function (r) {
      return r.specificity.a > 0;
    });
    var hasImp = rules.some(function (r) {
      return r.important > 0;
    });
    if (hasId) {
      plan.push({
        layer: 'note',
        why: 'ID selectors detected — demote to classes inside @layer components',
      });
    }
    if (hasImp) {
      plan.push({
        layer: 'note',
        why: 'Replace !important with higher layer placement or more specific unlayered utilities last',
      });
    }
    return plan;
  }

  function buildRefactor(rules) {
    var sample = rules
      .filter(function (r) {
        return r.important > 0 || r.depth >= 4 || r.hasHas;
      })
      .slice(0, 4);
    if (!sample.length) sample = rules.slice(0, 3);
    var before = sample
      .map(function (r) {
        return r.selector + ' {\n  ' + r.body.replace(/;\s*/g, ';\n  ').trim() + '\n}';
      })
      .join('\n\n');

    var afterParts = [
      '@layer reset, tokens, base, components, utilities, overrides;',
      '',
      '@layer components {',
    ];
    sample.forEach(function (r) {
      var sel = r.selector
        .replace(/#[\w-]+/g, function (id) {
          return '.' + id.slice(1);
        })
        .replace(/\s+/g, ' ');
      var body = r.body.replace(/\s*!important/gi, '');
      var depthParts = sel.split(/[\s>+~]+/).filter(Boolean);
      if (depthParts.length > 3) {
        sel = depthParts.slice(-2).join(' ');
      }
      afterParts.push('  ' + sel + ' {');
      afterParts.push('    ' + body.replace(/;\s*/g, ';\n    ').trim());
      afterParts.push('  }');
    });
    afterParts.push('}');
    if (sample.some(function (r) {
      return r.important > 0;
    })) {
      afterParts.push('');
      afterParts.push('/* Prefer layer order over !important for intentional wins */');
      afterParts.push('@layer overrides {');
      afterParts.push('  /* intentional exceptions only */');
      afterParts.push('}');
    }
    return { before: before || '/* no rules */', after: afterParts.join('\n') };
  }

  function setStats(debt, conflicts, hasHints, plan) {
    $('statDebt').textContent = String(debt.score);
    $('statConflicts').textContent = String(conflicts.length);
    $('statHasRisk').textContent = String(hasHints.length);
    var layers = plan.filter(function (p) {
      return p.layer !== 'note';
    }).length;
    $('statLayers').textContent = String(layers);
  }

  function renderFindings(list) {
    var root = $('findingsList');
    if (!list.length) {
      root.innerHTML = '<p class="cascade-empty">No findings.</p>';
      return;
    }
    root.innerHTML = list
      .map(function (f) {
        return (
          '<article class="cascade-finding sev-' +
          escapeHtml(f.severity) +
          '">' +
          '<p class="cascade-finding-meta">' +
          escapeHtml(f.meta || f.severity) +
          '</p>' +
          '<h3 class="cascade-finding-title">' +
          escapeHtml(f.title) +
          '</h3>' +
          '<p>' +
          escapeHtml(f.detail) +
          '</p>' +
          (f.snippet
            ? '<pre>' + escapeHtml(f.snippet) + '</pre>'
            : '') +
          '</article>'
        );
      })
      .join('');
  }

  function renderDebt(debt, conflicts) {
    var el = $('debtSummary');
    el.innerHTML =
      '<div class="cascade-debt-meter">' +
      '<span class="cascade-debt-label">Debt</span>' +
      '<div class="cascade-debt-track"><div class="cascade-debt-fill" style="width:' +
      debt.score +
      '%"></div></div>' +
      '<span>' +
      debt.score +
      '</span></div>' +
      '<p class="cascade-hint">' +
      debt.important +
      ' !important · ' +
      debt.deep +
      ' deep selectors · ' +
      debt.ids +
      ' ID-based rules</p>';

    var ul = $('conflictList');
    if (!conflicts.length) {
      ul.innerHTML = '<li class="cascade-empty-li">No near-equal specificity conflicts detected.</li>';
      return;
    }
    ul.innerHTML = conflicts
      .slice(0, 12)
      .map(function (c) {
        return (
          '<li><code>' +
          escapeHtml(c.prop) +
          '</code>: ' +
          escapeHtml(c.a.selector) +
          ' (' +
          escapeHtml(c.a.specificity.text) +
          ') vs ' +
          escapeHtml(c.b.selector) +
          ' (' +
          escapeHtml(c.b.specificity.text) +
          ') — ' +
          escapeHtml(c.reason) +
          '</li>'
        );
      })
      .join('');
  }

  function renderHas(hints) {
    var root = $('hasHints');
    if (!hints.length) {
      root.innerHTML = '<p class="cascade-empty">No :has() selectors found.</p>';
      return;
    }
    root.innerHTML = hints
      .map(function (h) {
        return (
          '<article class="cascade-finding sev-' +
          escapeHtml(h.severity) +
          '">' +
          '<p class="cascade-finding-meta">Line ~' +
          h.line +
          ' · ' +
          escapeHtml(h.severity) +
          '</p>' +
          '<h3 class="cascade-finding-title">' +
          escapeHtml(h.title) +
          '</h3>' +
          '<p>' +
          escapeHtml(h.detail) +
          '</p>' +
          '<pre>' +
          escapeHtml(h.snippet) +
          '</pre></article>'
        );
      })
      .join('');
  }

  function renderLayerPlan(plan) {
    var ol = $('layerPlan');
    ol.innerHTML = plan
      .map(function (p) {
        if (p.layer === 'note') {
          return '<li>' + escapeHtml(p.why) + '</li>';
        }
        return (
          '<li><strong>@layer ' +
          escapeHtml(p.layer) +
          '</strong> — ' +
          escapeHtml(p.why) +
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
    lines.push(asMarkdown ? '# CSS Cascade Layer Audit' : 'CSS CASCADE LAYER AUDIT');
    lines.push('');
    lines.push('Debt score: ' + state.debtScore);
    lines.push('Specificity conflicts: ' + state.conflicts.length);
    lines.push(':has() risks: ' + state.hasHints.length);
    lines.push('!important count: ' + state.importantCount);
    lines.push('');
    lines.push(h('Findings'));
    state.findings.forEach(function (f) {
      lines.push('- [' + f.severity + '] ' + f.title + ' — ' + f.detail);
    });
    lines.push('');
    lines.push(h('Layer plan'));
    state.layerPlan.forEach(function (p) {
      lines.push('- ' + (p.layer === 'note' ? 'Note' : '@layer ' + p.layer) + ': ' + p.why);
    });
    lines.push('');
    lines.push(h('Before'));
    lines.push(asMarkdown ? '```css\n' + state.before + '\n```' : state.before);
    lines.push('');
    lines.push(h('After'));
    lines.push(asMarkdown ? '```css\n' + state.after + '\n```' : state.after);
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
    var css = $('cssInput').value || '';
    if (!css.trim()) {
      $('analysisStatus').textContent = 'Paste CSS first';
      return;
    }
    var rules = parseRules(css);
    var conflicts = findConflicts(rules);
    var hasHints = analyzeHas(rules);
    var debt = debtScore(rules);
    var findings = buildFindings(rules, conflicts, hasHints);
    var plan = buildLayerPlan(rules);
    var refactor = buildRefactor(rules);

    state.analyzed = true;
    state.debtScore = debt.score;
    state.conflicts = conflicts;
    state.findings = findings;
    state.hasHints = hasHints;
    state.layerPlan = plan;
    state.importantCount = debt.important;
    state.deepCount = debt.deep;
    state.hasCount = hasHints.length;
    state.before = refactor.before;
    state.after = refactor.after;

    setStats(debt, conflicts, hasHints, plan);
    renderFindings(findings);
    renderDebt(debt, conflicts);
    renderHas(hasHints);
    renderLayerPlan(plan);
    $('beforeOut').textContent = refactor.before;
    $('afterOut').textContent = refactor.after;
    $('analysisStatus').textContent =
      rules.length + ' selectors · debt ' + debt.score;
    setExportEnabled(true);
  }

  function clearAll() {
    $('cssInput').value = '';
    state.analyzed = false;
    state.findings = [];
    state.conflicts = [];
    state.hasHints = [];
    state.layerPlan = [];
    ['statDebt', 'statConflicts', 'statHasRisk', 'statLayers'].forEach(function (id) {
      $(id).textContent = '—';
    });
    $('findingsList').innerHTML =
      '<p class="cascade-empty">Load demo CSS or paste a stylesheet, then audit.</p>';
    $('debtSummary').innerHTML =
      '<p class="cascade-empty">Debt score and conflict pairs appear after analysis.</p>';
    $('conflictList').innerHTML = '';
    $('hasHints').innerHTML =
      '<p class="cascade-empty">:has() risk notes appear after analysis.</p>';
    $('layerPlan').innerHTML =
      '<li class="cascade-empty-li">Suggested layer order appears after analysis.</li>';
    $('beforeOut').textContent = '—';
    $('afterOut').textContent = '—';
    $('analysisStatus').textContent = 'Ready';
    setExportEnabled(false);
  }

  function init() {
    $('loadDemoBtn').addEventListener('click', function () {
      $('cssInput').value = DEMO_CSS;
      $('analysisStatus').textContent = 'Demo loaded';
    });
    $('analyzeBtn').addEventListener('click', analyze);
    $('clearBtn').addEventListener('click', clearAll);
    $('exportMdBtn').addEventListener('click', function () {
      if (!state.analyzed) return;
      download('cascade-audit.md', buildReport(true));
    });
    $('exportTxtBtn').addEventListener('click', function () {
      if (!state.analyzed) return;
      download('cascade-audit.txt', buildReport(false));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
