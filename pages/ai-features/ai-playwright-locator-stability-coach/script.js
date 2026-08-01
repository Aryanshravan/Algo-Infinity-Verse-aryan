(function () {
  'use strict';

  var lastReport = null;

  var DEMO_CODE = [
    "// Flake-prone Playwright / CSS locators",
    "await page.locator('.btn-primary:nth-child(3)').click();",
    "await page.locator('div > div > span.user-name').fill('Ada');",
    "await page.locator('xpath=//*[@id=\"root\"]/div[2]/div/button').click();",
    "await page.click('#app > div.sc-aBYyz > button');",
    "await page.locator('text=Submit').click();",
    "await page.locator('[class*=\"Button-module\"]' ).click();",
    "await page.locator('css=button.MuiButton-root').nth(2).click();",
    "const row = page.locator('table tr:nth-of-type(4) td:nth-child(2)');",
    "await page.locator('.css-1a2b3c').click();"
  ].join('\n');

  var REWRITE_SNIPPET = [
    "// Accessibility-oriented Playwright rewrites",
    "await page.getByRole('button', { name: 'Primary action' }).click();",
    "await page.getByLabel('User name').fill('Ada');",
    "await page.getByRole('button', { name: 'Continue' }).click();",
    "await page.getByTestId('checkout-submit').click();",
    "await page.getByRole('button', { name: 'Submit' }).click();",
    "await page.getByRole('button', { name: /save/i }).click();",
    "await page.getByRole('button', { name: 'Create' }).click();",
    "const cell = page.getByRole('row').nth(3).getByRole('cell').nth(1);",
    "await page.getByTestId('hero-cta').click();"
  ].join('\n');

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

  function setStatus(msg, kind) {
    var el = $('locStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function analyze(code) {
    var src = String(code || '');
    var findings = [];
    var rewrites = 0;

    function add(severity, id, title, detail) {
      findings.push({ severity: severity, id: id, title: title, detail: detail });
    }

    if (/:nth-child\s*\(|:nth-of-type\s*\(/i.test(src)) {
      add('critical', 'nth-child', 'Positional :nth-child / :nth-of-type',
        'DOM order shifts break these selectors. Prefer role + name or test id.');
      rewrites += 1;
    }
    if (/nth\s*\(\s*\d+\s*\)/i.test(src)) {
      add('high', 'locator-nth', 'locator.nth(index) / chained index',
        'Index-based targeting is flake-prone when lists reorder. Filter by accessible name.');
      rewrites += 1;
    }
    if (/xpath\s*=|\/\/\*\[@id|\/div\[\d+\]/i.test(src)) {
      add('critical', 'xpath-deep', 'Deep XPath / absolute path',
        'Absolute XPaths couple tests to structure. Switch to getByRole / getByTestId.');
      rewrites += 1;
    }
    if (/#[\w-]+\s*>|\\\.sc-[a-zA-Z]|css-[a-z0-9]+|styled|emotion|MuiButton|module__/i.test(src)) {
      add('high', 'css-modules-hash', 'Hashed / styled-component / MUI class coupling',
        'Generated class names change across builds. Use roles, labels, or stable data-testid.');
      rewrites += 1;
    }
    if (/locator\(\s*['"`][^'"`]*\s*>\s*[^'"`]*\s*>\s*/i.test(src) ||
        /div\s*>\s*div\s*>\s*/i.test(src)) {
      add('medium', 'deep-css', 'Deep CSS descendant chains',
        'Long CSS paths are brittle. Target the interactive element by role/label.');
      rewrites += 1;
    }
    if (/locator\(\s*['"`]text=/i.test(src) || /\.locator\(\s*['"`][^'"`]*Submit/i.test(src)) {
      add('medium', 'raw-text', 'Raw text= / ambiguous text locator',
        'Visible text can duplicate. Prefer getByRole with accessible name.');
      rewrites += 1;
    }
    if (/page\.click\(\s*['"`][^'"`]+['"`]\s*\)/i.test(src) && !/getBy(Role|Label|TestId|Text)/.test(src)) {
      add('medium', 'page-click-css', 'page.click with CSS string',
        'Legacy CSS click helpers hide intent. Migrate to locator APIs with roles.');
      rewrites += 1;
    }
    if (/\[class\*=/.test(src)) {
      add('high', 'class-substring', 'Substring class attribute selectors',
        'Partial class matches are unstable under CSS modules. Prefer data-testid.');
      rewrites += 1;
    }
    if (/getByRole|getByLabel|getByTestId/.test(src)) {
      add('low', 'good-patterns', 'Some resilient Playwright APIs present',
        'Keep expanding getByRole / getByLabel / getByTestId coverage.');
    }
    if (!findings.length) {
      add('low', 'clean', 'No classic brittle patterns detected',
        'Still verify uniqueness and wait strategies in CI.');
    }

    var penalty = 0;
    findings.forEach(function (f) {
      if (f.severity === 'critical') penalty += 22;
      else if (f.severity === 'high') penalty += 14;
      else if (f.severity === 'medium') penalty += 8;
      else penalty += 2;
    });
    var score = Math.max(0, Math.min(100, 100 - penalty));
    if (/getByRole|getByLabel|getByTestId/.test(src)) score = Math.min(100, score + 8);

    var grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
    var rationale = [];
    rationale.push('Started at 100 and subtracted weight by finding severity.');
    rationale.push('Critical positional/XPath issues dominate flake risk.');
    if (/getByRole|getByLabel|getByTestId/.test(src)) {
      rationale.push('Bonus applied for existing getByRole/Label/TestId usage.');
    }
    rationale.push('Grade ' + grade + ' reflects residual brittleness after heuristic audit.');

    return {
      findings: findings,
      rewrites: rewrites,
      score: score,
      grade: grade,
      rationale: rationale,
      before: src,
      after: buildAfter(src, rewrites)
    };
  }

  function buildAfter(src, rewriteCount) {
    if (!rewriteCount) {
      return src.trim()
        ? src + '\n\n// No automatic rewrites suggested — keep resilient APIs.\n'
        : REWRITE_SNIPPET;
    }
    return REWRITE_SNIPPET +
      '\n\n// --- Notes ---\n' +
      '// Replace positional CSS/XPath with role+name or data-testid.\n' +
      '// Ensure accessible names exist in the product UI.\n';
  }

  function updateHero(report) {
    $('statScore').textContent = report ? report.score + '%' : '—';
    $('statBrittle').textContent = report
      ? String(report.findings.filter(function (f) {
        return f.severity === 'critical' || f.severity === 'high' || f.severity === 'medium';
      }).length)
      : '0';
    $('statRewrites').textContent = report ? String(report.rewrites) : '0';
    $('statGrade').textContent = report ? report.grade : '—';
  }

  function render(report) {
    lastReport = report;
    $('exportBtn').disabled = false;
    $('locEmpty').hidden = true;
    $('locResults').hidden = false;
    $('rewritePanel').hidden = false;

    updateHero(report);

    $('scoreVal').textContent = String(report.score);
    var ring = $('scoreRing');
    ring.classList.remove('is-high', 'is-mid', 'is-low');
    if (report.score >= 75) ring.classList.add('is-high');
    else if (report.score >= 50) ring.classList.add('is-mid');
    else ring.classList.add('is-low');

    $('scoreHeading').textContent = 'Stability score';
    $('scoreBlurb').textContent = 'Grade ' + report.grade + ' — ' +
      (report.score >= 75
        ? 'Mostly resilient patterns; tighten remaining brittle hits.'
        : report.score >= 50
          ? 'Mixed stability — prioritize critical/high findings.'
          : 'High flake risk — rewrite positional and hashed selectors first.');

    $('findingList').innerHTML = report.findings.map(function (f) {
      return '<li class="loc-finding">' +
        '<span class="loc-finding-sev ' + escapeHtml(f.severity) + '">' + escapeHtml(f.severity) + '</span>' +
        '<strong>' + escapeHtml(f.title) + '</strong>' +
        '<div class="loc-muted" style="margin-top:0.35rem">' + escapeHtml(f.detail) + '</div></li>';
    }).join('');

    $('rationaleOut').innerHTML = '<ul>' +
      report.rationale.map(function (r) { return '<li>' + escapeHtml(r) + '</li>'; }).join('') +
      '</ul>';

    $('beforeOut').innerHTML = '<code>' + escapeHtml(report.before) + '</code>';
    $('afterOut').innerHTML = '<code>' + escapeHtml(report.after) + '</code>';
  }

  function runAudit() {
    var code = $('locatorInput').value;
    if (!String(code).trim()) {
      setStatus('Paste locators or load flake demos first.', 'is-error');
      return;
    }
    var report = analyze(code);
    render(report);
    setStatus('Audit complete — ' + report.findings.length + ' finding(s), score ' + report.score + '.', 'is-ok');
  }

  function loadDemo() {
    $('locatorInput').value = DEMO_CODE;
    setStatus('Loaded flake-prone locator demos.', 'is-ok');
  }

  function clearAll() {
    lastReport = null;
    $('locatorInput').value = '';
    $('exportBtn').disabled = true;
    $('locEmpty').hidden = false;
    $('locResults').hidden = true;
    $('rewritePanel').hidden = true;
    $('findingList').innerHTML = '';
    $('rationaleOut').innerHTML = '';
    $('beforeOut').innerHTML = '<code>Run an audit to capture the original snippet.</code>';
    $('afterOut').innerHTML = '<code>Stable getByRole / getByLabel / getByTestId rewrites appear here.</code>';
    updateHero(null);
    $('scoreVal').textContent = '0';
    $('scoreRing').classList.remove('is-high', 'is-mid', 'is-low');
    setStatus('');
  }

  function exportReport() {
    if (!lastReport) return;
    var r = lastReport;
    var lines = [
      '# Playwright Locator Stability Audit',
      '',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Summary',
      '- Stability score: ' + r.score + '%',
      '- Grade: ' + r.grade,
      '- Brittle findings: ' + r.findings.length,
      '- Suggested rewrite clusters: ' + r.rewrites,
      '',
      '## Findings',
      r.findings.map(function (f) {
        return '### [' + f.severity + '] ' + f.title + '\n' + f.detail + '\n';
      }).join('\n'),
      '## Score rationale',
      r.rationale.map(function (x) { return '- ' + x; }).join('\n'),
      '',
      '## Before',
      '```js',
      r.before,
      '```',
      '',
      '## After (suggested)',
      '```js',
      r.after,
      '```',
      ''
    ];
    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'playwright-locator-audit.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Downloaded playwright-locator-audit.md', 'is-ok');
  }

  function init() {
    $('loadDemoBtn').addEventListener('click', loadDemo);
    $('analyzeBtn').addEventListener('click', runAudit);
    $('clearBtn').addEventListener('click', clearAll);
    $('exportBtn').addEventListener('click', exportReport);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
