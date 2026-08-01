(function () {
  'use strict';

  var DEMO_UNSAFE =
    '<!-- Demo: unsafe DOM sinks -->\n' +
    '<div id="banner"></div>\n' +
    '<script>\n' +
    '  var q = new URLSearchParams(location.search).get("msg") || "<img src=x onerror=alert(1)>";\n' +
    '  document.getElementById("banner").innerHTML = q;\n' +
    '  document.write("<p>Welcome " + q + "</p>");\n' +
    '  banner.insertAdjacentHTML("beforeend", "<span>" + q + "</span>");\n' +
    '  var html = "<b>" + q + "</b>";\n' +
    '  banner.outerHTML = html;\n' +
    '  setTimeout("console.log(\'" + q + "\')", 0);\n' +
    '  eval("var x = " + q);\n' +
    '  new Function("return " + q)();\n' +
    '  el.srcdoc = q;\n' +
    '</' +
    'script>';

  var SINK_RULES = [
    {
      id: 'innerHTML',
      name: 'innerHTML assignment',
      severity: 'high',
      re: /\.innerHTML\s*=/g,
      tip: 'Prefer textContent for plain text, or sanitize then assign via a TrustedHTML policy.',
      after: 'el.textContent = userInput;\n// or:\nel.innerHTML = policy.createHTML(sanitizer.sanitize(userInput));'
    },
    {
      id: 'outerHTML',
      name: 'outerHTML assignment',
      severity: 'high',
      re: /\.outerHTML\s*=/g,
      tip: 'Avoid replacing nodes with raw HTML strings; rebuild with createElement / textContent.',
      after: 'const safe = document.createElement("div");\nsafe.textContent = userInput;\nel.replaceWith(safe);'
    },
    {
      id: 'document.write',
      name: 'document.write / writeln',
      severity: 'high',
      re: /document\.write(?:ln)?\s*\(/g,
      tip: 'Remove document.write; use DOM APIs after parse. TT blocks write with TrustedHTML requirement.',
      after: 'const p = document.createElement("p");\np.textContent = "Welcome " + userInput;\ndocument.body.appendChild(p);'
    },
    {
      id: 'insertAdjacentHTML',
      name: 'insertAdjacentHTML',
      severity: 'high',
      re: /\.insertAdjacentHTML\s*\(/g,
      tip: 'Use insertAdjacentText or sanitized TrustedHTML from a named policy.',
      after: 'el.insertAdjacentText("beforeend", userInput);\n// or policy.createHTML after sanitize'
    },
    {
      id: 'eval',
      name: 'eval()',
      severity: 'high',
      re: /\beval\s*\(/g,
      tip: 'Never eval user data. Parse JSON with JSON.parse or use explicit function maps.',
      after: 'const data = JSON.parse(userInput); // not eval'
    },
    {
      id: 'function-ctor',
      name: 'Function constructor',
      severity: 'high',
      re: /\bnew\s+Function\s*\(/g,
      tip: 'Function() is eval-equivalent; block with script Trusted Types / CSP.',
      after: '// Use a allowlisted handler map instead of new Function(...)'
    },
    {
      id: 'settimeout-string',
      name: 'setTimeout/setInterval string',
      severity: 'medium',
      re: /\bset(?:Timeout|Interval)\s*\(\s*['"`]/g,
      tip: 'Pass a function reference, never a string that becomes eval.',
      after: 'setTimeout(() => console.log(userInput), 0);'
    },
    {
      id: 'srcdoc',
      name: 'iframe srcdoc',
      severity: 'medium',
      re: /\.srcdoc\s*=/g,
      tip: 'srcdoc requires TrustedHTML under TT. Prefer sandboxed iframe with controlled content.',
      after: 'iframe.srcdoc = policy.createHTML(sanitizer.sanitize(html));'
    },
    {
      id: 'jquery-html',
      name: 'jQuery .html() / $.parseHTML',
      severity: 'medium',
      re: /(?:\$\([^)]*\)\.html\s*\(|\$\.parseHTML\s*\()/g,
      tip: 'jQuery HTML APIs are sinks; migrate to text() or DOMPurify + TT policy.',
      after: '$el.text(userInput);\n// or $el.html(policy.createHTML(DOMPurify.sanitize(...)))'
    }
  ];

  var state = {
    findings: [],
    gaps: [],
    roadmap: [],
    tips: [],
    before: '',
    after: '',
    report: ''
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

  function lineNumberAt(src, index) {
    return src.slice(0, index).split(/\r?\n/).length;
  }

  function snippetAround(src, index) {
    var start = src.lastIndexOf('\n', index - 1) + 1;
    var end = src.indexOf('\n', index);
    if (end === -1) end = src.length;
    return src.slice(start, end).trim().slice(0, 160);
  }

  function scan(source) {
    var findings = [];
    SINK_RULES.forEach(function (rule) {
      rule.re.lastIndex = 0;
      var m;
      while ((m = rule.re.exec(source)) !== null) {
        findings.push({
          id: rule.id,
          name: rule.name,
          severity: rule.severity,
          line: lineNumberAt(source, m.index),
          snippet: snippetAround(source, m.index),
          tip: rule.tip,
          after: rule.after,
          match: m[0]
        });
        if (m.index === rule.re.lastIndex) rule.re.lastIndex += 1;
      }
    });
    return findings;
  }

  function analyzeGaps(findings, source) {
    var gaps = [];
    var hasCreatePolicy = /trustedTypes\.createPolicy\s*\(/i.test(source);
    var hasRequireFor = /require-trusted-types-for/i.test(source);
    var hasMetaCsp = /http-equiv\s*=\s*["']Content-Security-Policy["']/i.test(source);
    var sinkTypes = {};

    findings.forEach(function (f) {
      sinkTypes[f.id] = (sinkTypes[f.id] || 0) + 1;
    });

    if (findings.length && !hasCreatePolicy) {
      gaps.push({
        severity: 'high',
        title: 'No Trusted Types policy factory',
        detail: 'Code uses DOM sinks but never calls trustedTypes.createPolicy(...).'
      });
    }
    if (findings.length && !hasRequireFor && !hasMetaCsp) {
      gaps.push({
        severity: 'high',
        title: 'Missing require-trusted-types-for CSP',
        detail: 'Enforce with Content-Security-Policy: require-trusted-types-for \'script\'.'
      });
    }
    if (sinkTypes.innerHTML || sinkTypes.outerHTML || sinkTypes.insertAdjacentHTML || sinkTypes['document.write']) {
      gaps.push({
        severity: 'medium',
        title: 'HTML sink policy gap',
        detail: 'Define a default (or named) policy that only returns TrustedHTML from a sanitizer allowlist.'
      });
    }
    if (sinkTypes.eval || sinkTypes['function-ctor'] || sinkTypes['settimeout-string']) {
      gaps.push({
        severity: 'high',
        title: 'Script sink / eval gap',
        detail: 'Trusted Types does not make eval safe — remove string-based code execution entirely.'
      });
    }
    if (hasCreatePolicy && /createPolicy\s*\(\s*['"]default['"]/i.test(source) === false) {
      gaps.push({
        severity: 'low',
        title: 'No default policy',
        detail: 'Libraries often expect a default policy; add one carefully or configure trusted-types CSP allowlist.'
      });
    }
    if (!gaps.length && findings.length) {
      gaps.push({
        severity: 'low',
        title: 'Review policy purity',
        detail: 'Policies must not become passthrough createHTML(s){return s} — always sanitize or reject.'
      });
    }
    if (!findings.length) {
      gaps.push({
        severity: 'low',
        title: 'No classic sinks detected',
        detail: 'Still enable TT in report-only first, then enforce — dynamic sinks may hide behind helpers.'
      });
    }
    return gaps;
  }

  function buildRoadmap(findings, gaps) {
    var steps = [
      'Inventory all DOM sinks (this scan) and tag owners per module',
      'Ship CSP report-only: require-trusted-types-for \'script\' + trusted-types *',
      'Introduce a sanitizer-backed createPolicy (DOMPurify / sanitizer API)',
      'Replace text-only sinks with textContent / insertAdjacentText',
      'Migrate HTML sinks to policy.createHTML after sanitize',
      'Eliminate eval / Function / string timers',
      'Switch CSP from report-only to enforce; remove wildcard trusted-types',
      'Add CI grep / ESLint for innerHTML and document.write regressions'
    ];
    if (!findings.length) {
      steps = [
        'Enable Trusted Types report-only in staging',
        'Add default deny policy and monitor violations',
        'Document approved policies for design-system HTML helpers',
        'Enforce require-trusted-types-for \'script\' in production'
      ];
    }
    if (gaps.some(function (g) {
      return /eval/i.test(g.title);
    })) {
      steps.splice(5, 0, 'Priority: delete eval-ish sinks before enabling enforce mode');
    }
    return steps;
  }

  function buildTips(findings) {
    var seen = {};
    var tips = [];
    findings.forEach(function (f) {
      if (seen[f.id]) return;
      seen[f.id] = true;
      tips.push({ name: f.name, tip: f.tip });
    });
    if (!tips.length) {
      tips.push({
        name: 'General',
        tip: 'Default to textContent; treat any HTML assignment as requiring a Trusted Types policy + sanitizer.'
      });
    }
    tips.push({
      name: 'Sanitizer',
      tip: 'DOMPurify.sanitize(dirty, {RETURN_TRUSTED_TYPE: true}) or Sanitizer API — never concatenate untrusted strings into HTML.'
    });
    return tips;
  }

  function pickSnippet(findings, source) {
    if (!findings.length) {
      return {
        before: '// No unsafe sink snippet selected',
        after: '// Prefer textContent and Trusted Types policies for any HTML needs'
      };
    }
    var f = findings[0];
    var before = f.snippet || source.slice(0, 200);
    return { before: before, after: f.after };
  }

  function updateStats() {
    var high = state.findings.filter(function (f) {
      return f.severity === 'high';
    }).length;
    $('statSinks').textContent = String(state.findings.length);
    $('statHigh').textContent = String(high);
    $('statGaps').textContent = String(state.gaps.length);
    $('statRoadmap').textContent = String(state.roadmap.length);
  }

  function renderFindings() {
    var wrap = $('ttFindings');
    if (!state.findings.length) {
      wrap.innerHTML = '<p class="tt-empty">No classic sinks matched. Try the unsafe demo.</p>';
      return;
    }
    wrap.innerHTML = state.findings
      .map(function (f) {
        return (
          '<article class="tt-finding">' +
          '<div class="tt-finding-head">' +
          '<span class="tt-sev tt-sev-' +
          f.severity +
          '">' +
          f.severity +
          '</span>' +
          '<span class="tt-finding-title">' +
          escapeHtml(f.name) +
          '</span>' +
          '<span class="tt-finding-meta">line ' +
          f.line +
          '</span>' +
          '</div>' +
          '<pre class="tt-finding-snip">' +
          escapeHtml(f.snippet) +
          '</pre>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderGaps() {
    var wrap = $('ttPolicyGaps');
    wrap.innerHTML = state.gaps
      .map(function (g) {
        return (
          '<article class="tt-finding">' +
          '<div class="tt-finding-head">' +
          '<span class="tt-sev tt-sev-' +
          g.severity +
          '">' +
          g.severity +
          '</span>' +
          '<span class="tt-finding-title">' +
          escapeHtml(g.title) +
          '</span>' +
          '</div>' +
          '<p class="tt-finding-meta">' +
          escapeHtml(g.detail) +
          '</p>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderRoadmap() {
    var ul = $('ttRoadmap');
    ul.innerHTML = '';
    state.roadmap.forEach(function (step, idx) {
      var li = document.createElement('li');
      li.className = 'tt-roadmap-item';
      var id = 'tt-road-' + idx;
      li.innerHTML =
        '<input type="checkbox" id="' +
        id +
        '" />' +
        '<label for="' +
        id +
        '">' +
        escapeHtml(step) +
        '</label>';
      ul.appendChild(li);
    });
  }

  function renderTips() {
    var html =
      '<ul>' +
      state.tips
        .map(function (t) {
          return '<li><strong>' + escapeHtml(t.name) + ':</strong> ' + escapeHtml(t.tip) + '</li>';
        })
        .join('') +
      '</ul>';
    $('ttTips').innerHTML = html;
  }

  function buildReport(fmt) {
    var lines = [];
    lines.push('Trusted Types Migration Audit');
    lines.push('Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('Summary');
    lines.push('- Sinks: ' + state.findings.length);
    lines.push(
      '- High risk: ' +
        state.findings.filter(function (f) {
          return f.severity === 'high';
        }).length
    );
    lines.push('- Policy gaps: ' + state.gaps.length);
    lines.push('');
    lines.push('Findings');
    state.findings.forEach(function (f, i) {
      lines.push(
        i +
          1 +
          '. [' +
          f.severity +
          '] ' +
          f.name +
          ' (line ' +
          f.line +
          ')'
      );
      lines.push('   ' + f.snippet);
    });
    lines.push('');
    lines.push('Policy gaps');
    state.gaps.forEach(function (g, i) {
      lines.push(i + 1 + '. [' + g.severity + '] ' + g.title + ' — ' + g.detail);
    });
    lines.push('');
    lines.push('Migration roadmap');
    state.roadmap.forEach(function (s, i) {
      lines.push(i + 1 + '. [ ] ' + s);
    });
    lines.push('');
    lines.push('Before');
    lines.push(state.before);
    lines.push('');
    lines.push('After');
    lines.push(state.after);

    if (fmt === 'md') {
      return (
        '# Trusted Types Migration Audit\n\n' +
        '_Generated: ' +
        new Date().toISOString() +
        '_\n\n' +
        '## Summary\n\n' +
        '- **Sinks:** ' +
        state.findings.length +
        '\n' +
        '- **High risk:** ' +
        state.findings.filter(function (f) {
          return f.severity === 'high';
        }).length +
        '\n' +
        '- **Policy gaps:** ' +
        state.gaps.length +
        '\n\n' +
        '## Findings\n\n' +
        state.findings
          .map(function (f, i) {
            return (
              (i + 1) +
              '. **[' +
              f.severity +
              '] ' +
              f.name +
              '** (line ' +
              f.line +
              ')\n\n```\n' +
              f.snippet +
              '\n```\n'
            );
          })
          .join('\n') +
        '\n## Policy gaps\n\n' +
        state.gaps
          .map(function (g, i) {
            return (i + 1) + '. **[' + g.severity + '] ' + g.title + '** — ' + g.detail;
          })
          .join('\n') +
        '\n\n## Migration roadmap\n\n' +
        state.roadmap
          .map(function (s, i) {
            return (i + 1) + '. [ ] ' + s;
          })
          .join('\n') +
        '\n\n## Before\n\n```js\n' +
        state.before +
        '\n```\n\n## After\n\n```js\n' +
        state.after +
        '\n```\n'
      );
    }
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

  function runScan() {
    var source = $('ttInput').value || '';
    state.findings = scan(source);
    state.gaps = analyzeGaps(state.findings, source);
    state.roadmap = buildRoadmap(state.findings, state.gaps);
    state.tips = buildTips(state.findings);
    var snip = pickSnippet(state.findings, source);
    state.before = snip.before;
    state.after = snip.after;

    renderFindings();
    renderGaps();
    renderRoadmap();
    renderTips();
    $('ttBefore').textContent = state.before;
    $('ttAfter').textContent = state.after;
    updateStats();

    var enabled = state.findings.length > 0 || state.gaps.length > 0;
    $('ttExportMdBtn').disabled = !enabled;
    $('ttExportTxtBtn').disabled = !enabled;
    $('ttStatus').textContent =
      'Scan complete — ' +
      state.findings.length +
      ' sink(s), ' +
      state.gaps.length +
      ' gap(s).';
  }

  function init() {
    $('ttLoadDemoBtn').addEventListener('click', function () {
      $('ttInput').value = DEMO_UNSAFE;
      $('ttStatus').textContent = 'Unsafe demo loaded.';
    });
    $('ttScanBtn').addEventListener('click', runScan);
    $('ttClearBtn').addEventListener('click', function () {
      $('ttInput').value = '';
      state = {
        findings: [],
        gaps: [],
        roadmap: [],
        tips: [],
        before: '',
        after: '',
        report: ''
      };
      $('ttFindings').innerHTML = '<p class="tt-empty">Run a scan to list DOM XSS sinks.</p>';
      $('ttPolicyGaps').innerHTML = '<p class="tt-empty">Gaps appear after scan.</p>';
      $('ttRoadmap').innerHTML = '<li class="tt-empty">Checklist builds after scan.</li>';
      $('ttTips').innerHTML =
        '<p class="tt-empty">Tips for textContent / sanitizer rewrites show after scan.</p>';
      $('ttBefore').textContent = '—';
      $('ttAfter').textContent = '—';
      $('ttExportMdBtn').disabled = true;
      $('ttExportTxtBtn').disabled = true;
      updateStats();
      $('statSinks').textContent = '—';
      $('statHigh').textContent = '—';
      $('statGaps').textContent = '—';
      $('statRoadmap').textContent = '—';
      $('ttStatus').textContent = 'Cleared.';
    });
    $('ttExportMdBtn').addEventListener('click', function () {
      download('trusted-types-audit.md', buildReport('md'));
    });
    $('ttExportTxtBtn').addEventListener('click', function () {
      download('trusted-types-audit.txt', buildReport('txt'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
