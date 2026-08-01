(function () {
  'use strict';

  var lastReport = null;

  var DEMO_CODE =
    "// Classic concatenation\n" +
    "app.get('/users', (req, res) => {\n" +
    "  const q = \"SELECT * FROM users WHERE email = '\" + req.query.email + \"'\";\n" +
    "  db.query(q).then(rows => res.json(rows));\n" +
    "});\n\n" +
    "// Second-order: store then reuse unsafely\n" +
    "async function saveNote(userId, title) {\n" +
    "  await db.query(\"INSERT INTO notes(user_id, title) VALUES (\" + userId + \", '\" + title + \"')\");\n" +
    "}\n" +
    "async function searchNotes(keyword) {\n" +
    "  // title previously attacker-controlled; concatenated again\n" +
    "  const rows = await knex.raw(\"SELECT * FROM notes WHERE title LIKE '%\" + keyword + \"%'\");\n" +
    "  return rows;\n" +
    "}\n\n" +
    "// ORDER BY / LIMIT injection\n" +
    "function listProducts(sort, limit) {\n" +
    "  return sequelize.query(\n" +
    "    `SELECT * FROM products ORDER BY ${sort} LIMIT ${limit}`,\n" +
    "    { type: QueryTypes.SELECT }\n" +
    "  );\n" +
    "}\n\n" +
    "// ORM raw leak\n" +
    "const report = await prisma.$queryRawUnsafe(\n" +
    "  \"SELECT * FROM invoices WHERE org_id = \" + orgId + \" AND status = '\" + status + \"'\"\n" +
    ");\n";

  var REWRITE_SUGGESTIONS =
    "// === Parameterized / safe rewrites ===\n\n" +
    "// Classic SELECT — use placeholders\n" +
    "app.get('/users', async (req, res) => {\n" +
    "  const rows = await db.query(\n" +
    "    'SELECT * FROM users WHERE email = $1',\n" +
    "    [req.query.email]\n" +
    "  );\n" +
    "  res.json(rows);\n" +
    "});\n\n" +
    "// INSERT — bind both columns\n" +
    "async function saveNote(userId, title) {\n" +
    "  await db.query(\n" +
    "    'INSERT INTO notes(user_id, title) VALUES ($1, $2)',\n" +
    "    [userId, title]\n" +
    "  );\n" +
    "}\n\n" +
    "// LIKE — bind pattern; escape %/_ in app layer if needed\n" +
    "async function searchNotes(keyword) {\n" +
    "  return knex('notes').where('title', 'like', '%' + escapeLike(keyword) + '%');\n" +
    "}\n\n" +
    "// ORDER BY / LIMIT — allowlist columns + numeric cast\n" +
    "const SORT_WHITELIST = { price: 'price', name: 'name', created: 'created_at' };\n" +
    "function listProducts(sort, limit) {\n" +
    "  const col = SORT_WHITELIST[sort] || 'created_at';\n" +
    "  const lim = Math.min(100, Math.max(1, Number(limit) || 20));\n" +
    "  return sequelize.query(\n" +
    "    `SELECT * FROM products ORDER BY ${col} LIMIT :lim`,\n" +
    "    { replacements: { lim }, type: QueryTypes.SELECT }\n" +
    "  );\n" +
    "}\n\n" +
    "// Prisma — prefer tagged template $queryRaw, never $queryRawUnsafe with concat\n" +
    "const report = await prisma.$queryRaw`\n" +
    "  SELECT * FROM invoices WHERE org_id = ${orgId} AND status = ${status}\n" +
    "`;\n";

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
    var el = $('sqliStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function analyze(code) {
    var src = String(code || '');
    var findings = [];
    var ormLeaks = [];
    var rewrites = 0;

    // Classic SQLi: string concat into SQL
    if (/['"`]\s*\+\s*\w+|\$\{[^}]+\}/.test(src) &&
        /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b/i.test(src)) {
      findings.push({
        severity: 'critical',
        id: 'classic-concat',
        title: 'Classic SQLi via string concatenation / interpolation',
        body: 'SQL keywords appear with + or template ${} interpolation. User-controlled fragments can alter query structure (OR 1=1, UNION, etc.).'
      });
      rewrites += 1;
    }

    // Second-order indicators
    if (/\bINSERT\b[\s\S]{0,200}\+\s*\w+/i.test(src) &&
        /\b(SELECT|LIKE|WHERE)\b[\s\S]{0,120}\+\s*\w+/i.test(src)) {
      findings.push({
        severity: 'critical',
        id: 'second-order',
        title: 'Possible second-order SQLi',
        body: 'Data is written with concatenation and later reused in another query. Stored payloads (notes, names, titles) can fire on a later SELECT/LIKE.'
      });
      rewrites += 1;
    } else if (/second[- ]order|previously|stored.*concat/i.test(src)) {
      findings.push({
        severity: 'high',
        id: 'second-order-hint',
        title: 'Second-order risk hinted in comments/flow',
        body: 'Comments or flow suggest stored input is reused. Ensure every read path also parameterizes.'
      });
    }

    // ORDER BY injection
    if (/ORDER\s+BY\s*(\$\{|\+|`[^`]*\$\{)/i.test(src) ||
        /ORDER\s+BY\s*['"]?\s*\+/i.test(src) ||
        /ORDER BY \$\{/i.test(src)) {
      findings.push({
        severity: 'high',
        id: 'order-by',
        title: 'ORDER BY injection',
        body: 'Dynamic ORDER BY cannot be parameterized like values in most engines. Use an allowlist of column names / directions.'
      });
      rewrites += 1;
    }

    // LIMIT injection
    if (/LIMIT\s*(\$\{|\+)/i.test(src) || /LIMIT\s*`[^`]*\$\{/i.test(src)) {
      findings.push({
        severity: 'high',
        id: 'limit-inj',
        title: 'LIMIT / OFFSET injection',
        body: 'Interpolated LIMIT can break out of numeric context in some drivers. Cast to integer and clamp bounds in application code.'
      });
      rewrites += 1;
    }

    // LIKE injection
    if (/LIKE\s*['"%].*\+|LIKE\s*`[^`]*\$\{|LIKE\s*['"]\s*\+/i.test(src) ||
        /LIKE '%"\s*\+/i.test(src)) {
      findings.push({
        severity: 'high',
        id: 'like-inj',
        title: 'LIKE pattern injection',
        body: 'Concatenating into LIKE patterns enables wildcard abuse and, with poor quoting, full SQLi. Bind the pattern and escape % / _.'
      });
      rewrites += 1;
    }

    // ORM raw leaks
    var rawPatterns = [
      { re: /\$queryRawUnsafe\s*\(/, name: 'Prisma $queryRawUnsafe' },
      { re: /\.queryRawUnsafe\s*\(/, name: 'queryRawUnsafe' },
      { re: /knex\.raw\s*\(\s*[`'"][^`'"]*[+`$\{]/, name: 'knex.raw with concat' },
      { re: /knex\.raw\s*\(\s*`[^`]*\$\{/, name: 'knex.raw template interpolate' },
      { re: /sequelize\.query\s*\(\s*`[^`]*\$\{/, name: 'sequelize.query template interpolate' },
      { re: /\.query\s*\(\s*['"][^'"]*['"]\s*\+/, name: 'db.query string concat' },
      { re: /TypeORM[\s\S]{0,40}createQueryBuilder[\s\S]{0,80}\.where\s*\(\s*`[^`]*\$\{/, name: 'TypeORM where interpolate' },
      { re: /execute\s*\(\s*`[^`]*\$\{/, name: 'execute template interpolate' }
    ];

    rawPatterns.forEach(function (p) {
      if (p.re.test(src)) {
        ormLeaks.push(p.name);
        findings.push({
          severity: 'critical',
          id: 'orm-' + p.name.replace(/\W+/g, '-').toLowerCase(),
          title: 'ORM raw-query leak: ' + p.name,
          body: 'Raw/unsafe ORM APIs bypass query builders. Prefer parameterized APIs ($queryRaw tagged template, knex bindings, sequelize replacements).'
        });
        rewrites += 1;
      }
    });

    // Generic raw() with user input smell
    if (/\.raw\s*\(/i.test(src) && !ormLeaks.length) {
      ormLeaks.push('Generic .raw() usage');
      findings.push({
        severity: 'medium',
        id: 'raw-generic',
        title: 'ORM/driver .raw() present',
        body: 'Review every .raw() call site. Bind arguments via the driver bindings array; never concatenate request input.'
      });
    }

    if (!findings.length) {
      findings.push({
        severity: 'ok',
        id: 'clean',
        title: 'No obvious SQLi construction patterns',
        body: 'Heuristics found no classic concat, ORDER BY/LIMIT/LIKE interpolation, or known unsafe ORM raw APIs. Still review dynamic identifiers and second-order flows manually.'
      });
    }

    var sevRank = { critical: 4, high: 3, medium: 2, ok: 0 };
    var top = 'ok';
    var score = 5;
    findings.forEach(function (f) {
      if ((sevRank[f.severity] || 0) > (sevRank[top] || 0)) top = f.severity;
      if (f.severity === 'critical') score += 22;
      else if (f.severity === 'high') score += 14;
      else if (f.severity === 'medium') score += 8;
    });
    score = Math.min(99, score);

    return {
      findings: findings,
      ormLeaks: ormLeaks,
      rewrites: rewrites,
      topSeverity: top === 'ok' ? 'none' : top,
      score: score,
      source: src,
      generatedAt: new Date().toISOString()
    };
  }

  function updateHero(report) {
    $('statFindings').textContent = String(report.findings.filter(function (f) { return f.severity !== 'ok'; }).length);
    $('statSeverity').textContent = report.topSeverity === 'none' ? '—' : report.topSeverity;
    $('statRawLeaks').textContent = String(report.ormLeaks.length);
    $('statRewrites').textContent = String(report.rewrites);
  }

  function renderReport(report) {
    $('sqliEmpty').hidden = true;
    $('sqliResults').hidden = false;
    $('sqliRewritePanel').hidden = false;

    var blurb = report.score >= 70
      ? 'Critical injection surface — treat as ship blocker until parameterization lands.'
      : report.score >= 40
        ? 'Meaningful SQLi / ORM raw risk — prioritize allowlists and bound parameters.'
        : 'Low heuristic signal — keep reviewing dynamic SQL identifiers.';

    $('sqliRiskBlurb').textContent = blurb;
    $('sqliScoreVal').textContent = String(report.score);

    var ring = $('sqliScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add(report.score >= 70 ? 'is-high' : report.score >= 40 ? 'is-mid' : 'is-low');

    $('sqliFindingList').innerHTML = report.findings.map(function (f) {
      return '<li class="sqli-finding is-' + escapeHtml(f.severity) + '">' +
        '<span class="sqli-badge is-' + escapeHtml(f.severity) + '">' + escapeHtml(f.severity) + '</span>' +
        '<p class="sqli-finding-title">' + escapeHtml(f.title) + '</p>' +
        '<p class="sqli-finding-body">' + escapeHtml(f.body) + '</p>' +
        '</li>';
    }).join('');

    if (report.ormLeaks.length) {
      $('sqliOrmOut').innerHTML =
        '<p>Unsafe or concat-based raw APIs detected:</p><ul>' +
        report.ormLeaks.map(function (n) { return '<li>' + escapeHtml(n) + '</li>'; }).join('') +
        '</ul><p class="sqli-muted">Replace with bound parameters or tagged-template safe raw APIs.</p>';
    } else {
      $('sqliOrmOut').innerHTML = '<p class="sqli-muted">No known unsafe ORM raw patterns matched.</p>';
    }

    $('sqliBefore').innerHTML = '<code>' + escapeHtml(report.source || '(empty)') + '</code>';
    $('sqliAfter').innerHTML = '<code>' + escapeHtml(REWRITE_SUGGESTIONS) + '</code>';

    updateHero(report);
    $('sqliExportBtn').disabled = false;
  }

  function exportReport(report) {
    var lines = [];
    lines.push('# SQLi & ORM Leak Audit Report');
    lines.push('Generated: ' + report.generatedAt);
    lines.push('Risk score: ' + report.score + '/100');
    lines.push('Top severity: ' + report.topSeverity);
    lines.push('ORM raw leaks: ' + (report.ormLeaks.join(', ') || 'none'));
    lines.push('');
    lines.push('## Findings');
    report.findings.forEach(function (f, i) {
      lines.push((i + 1) + '. [' + f.severity + '] ' + f.title);
      lines.push('   ' + f.body);
    });
    lines.push('');
    lines.push('## Parameterization rewrite guidance');
    lines.push('- Use positional/named bind parameters for all values.');
    lines.push('- Allowlist ORDER BY columns; never interpolate identifiers from input.');
    lines.push('- Cast/clamp LIMIT/OFFSET to integers.');
    lines.push('- Escape LIKE metacharacters when building patterns.');
    lines.push('- Prefer Prisma `$queryRaw` tagged templates; avoid `$queryRawUnsafe` with concat.');
    lines.push('- Prefer knex/sequelize bindings / replacements over string-built SQL.');
    lines.push('');
    lines.push('## Source snippet');
    lines.push('```');
    lines.push(report.source);
    lines.push('```');
    lines.push('');
    lines.push('## Suggested rewrites');
    lines.push('```');
    lines.push(REWRITE_SUGGESTIONS);
    lines.push('```');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'sqli-orm-audit-report.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function runAudit() {
    var code = $('sqliCodeInput').value;
    if (!String(code || '').trim()) {
      setStatus('Paste SQL/ORM code or load the vulnerable demos.', 'is-error');
      return;
    }
    lastReport = analyze(code);
    renderReport(lastReport);
    setStatus('Audit complete — ' + lastReport.findings.length + ' finding(s), top severity: ' +
      lastReport.topSeverity + '.', 'is-ok');
  }

  function clearAll() {
    $('sqliCodeInput').value = '';
    lastReport = null;
    $('sqliEmpty').hidden = false;
    $('sqliResults').hidden = true;
    $('sqliRewritePanel').hidden = true;
    $('sqliExportBtn').disabled = true;
    $('statFindings').textContent = '0';
    $('statSeverity').textContent = '—';
    $('statRawLeaks').textContent = '0';
    $('statRewrites').textContent = '0';
    setStatus('Cleared.');
  }

  function init() {
    $('sqliLoadDemoBtn').addEventListener('click', function () {
      $('sqliCodeInput').value = DEMO_CODE;
      setStatus('Loaded classic + second-order + ORDER BY/LIMIT/LIKE + ORM raw demos.', 'is-ok');
    });
    $('sqliAuditBtn').addEventListener('click', runAudit);
    $('sqliClearBtn').addEventListener('click', clearAll);
    $('sqliExportBtn').addEventListener('click', function () {
      if (!lastReport) return;
      exportReport(lastReport);
      setStatus('Downloaded sqli-orm-audit-report.md', 'is-ok');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
