(function () {
  'use strict';

  var lastReport = null;

  var TAXONOMY = [
    {
      id: 'auth',
      label: 'Auth / session',
      weight: 28,
      patterns: [/auth/i, /session/i, /login/i, /oauth/i, /jwt/i, /passport/i, /rbac/i, /permission/i, /middleware\/.*guard/i],
      noteHints: [/auth/i, /jwt/i, /session/i, /login/i, /rbac/i, /permission/i]
    },
    {
      id: 'crypto',
      label: 'Crypto / secrets',
      weight: 30,
      patterns: [/crypto/i, /encrypt/i, /decrypt/i, /hash/i, /secret/i, /keystore/i, /tls/i, /cert/i, /\.pem$/i, /kdf/i],
      noteHints: [/crypto/i, /secret/i, /encrypt/i, /hash/i, /key/i]
    },
    {
      id: 'migration',
      label: 'Migrations / data',
      weight: 26,
      patterns: [/migration/i, /migrate/i, /schema\.sql/i, /\.sql$/i, /flyway/i, /liquibase/i, /prisma\/.*migration/i, /alembic/i],
      noteHints: [/migration/i, /schema/i, /backfill/i, /irreversible/i, /rollback/i]
    },
    {
      id: 'ci',
      label: 'CI / deploy',
      weight: 22,
      patterns: [/\.github\/workflows/i, /gitlab-ci/i, /Jenkinsfile/i, /Dockerfile/i, /deploy/i, /terraform/i, /helm/i, /k8s/i],
      noteHints: [/ci/i, /workflow/i, /deploy/i, /pipeline/i, /skip.*test/i]
    },
    {
      id: 'other',
      label: 'App / other',
      weight: 8,
      patterns: [/.+/],
      noteHints: []
    }
  ];

  var PRESETS = {
    auth: {
      paths: [
        'src/auth/session.js',
        'src/auth/jwt.js',
        'src/middleware/requireAuth.js',
        'src/routes/login.js',
        'tests/unit/ui-button.test.js',
        'README.md'
      ].join('\n'),
      notes:
        'Changes JWT validation and cookie flags. No new tests for refresh-token rotation. Rate-limit middleware untouched.'
    },
    crypto: {
      paths: [
        'src/crypto/aesgcm.js',
        'src/crypto/keyring.js',
        'config/secrets.example.env',
        'src/utils/legacy-md5.js',
        'docs/security.md'
      ].join('\n'),
      notes:
        'Swaps hashing for password reset tokens. Mentions temporary hard-coded secret for local demo. TLS pin list updated.'
    },
    migrations: {
      paths: [
        'migrations/20260315_add_roles.sql',
        'migrations/20260315_backfill_roles.sql',
        'src/models/User.js',
        'src/api/admin/roles.js',
        'package.json'
      ].join('\n'),
      notes:
        'Non-reversible DROP COLUMN in follow-up. Backfill runs online without lock timeout. No down migration.'
    },
    ci: {
      paths: [
        '.github/workflows/ci.yml',
        '.github/workflows/deploy-prod.yml',
        'Dockerfile',
        'scripts/skip-flaky.sh',
        'src/app.js'
      ].join('\n'),
      notes:
        'Continues on error for security job. Disables e2e on PRs. Deploy workflow uses broad GITHUB_TOKEN permissions.'
    }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, kind) {
    var el = $('blindStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parsePaths(raw) {
    return String(raw || '')
      .split(/\r?\n/)
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean)
      .map(function (line) {
        return line.replace(/^[AMD]\s+/, '').replace(/^"|"$/g, '');
      });
  }

  function classifyPath(path) {
    var i;
    for (i = 0; i < TAXONOMY.length; i++) {
      var cat = TAXONOMY[i];
      if (cat.id === 'other') continue;
      var matched = cat.patterns.some(function (re) {
        return re.test(path);
      });
      if (matched) return cat.id;
    }
    return 'other';
  }

  function noteBoost(notes, cat) {
    if (!notes) return 0;
    var hits = 0;
    cat.noteHints.forEach(function (re) {
      if (re.test(notes)) hits += 1;
    });
    return Math.min(12, hits * 4);
  }

  function scoreCategories(paths, notes) {
    var buckets = {};
    TAXONOMY.forEach(function (c) {
      buckets[c.id] = { id: c.id, label: c.label, files: [], base: 0, boost: 0, score: 0 };
    });

    paths.forEach(function (p) {
      var id = classifyPath(p);
      buckets[id].files.push(p);
    });

    TAXONOMY.forEach(function (cat) {
      var b = buckets[cat.id];
      if (!b.files.length && cat.id !== 'other') {
        b.boost = noteBoost(notes, cat);
        b.score = b.boost;
        return;
      }
      if (!b.files.length) {
        b.score = 0;
        return;
      }
      var fileScore = Math.min(cat.weight, 6 + b.files.length * Math.round(cat.weight / 4));
      b.base = fileScore;
      b.boost = noteBoost(notes, cat);
      b.score = Math.min(100, fileScore + b.boost);
    });

    return buckets;
  }

  function aggregateRisk(buckets, paths) {
    var weighted = 0;
    var maxCat = 0;
    Object.keys(buckets).forEach(function (id) {
      if (id === 'other') return;
      weighted += buckets[id].score;
      if (buckets[id].score > maxCat) maxCat = buckets[id].score;
    });
    var sizeFactor = Math.min(20, paths.length * 2);
    var score = Math.min(100, Math.round(weighted * 0.55 + maxCat * 0.35 + sizeFactor * 0.3));
    var band = score >= 65 ? 'high' : score >= 35 ? 'mid' : 'low';
    var label = band === 'high' ? 'High' : band === 'mid' ? 'Medium' : 'Low';
    return { score: score, band: band, label: label };
  }

  function detectBlindspots(paths, notes, buckets) {
    var warnings = [];
    var pathStr = paths.join('\n');
    var hasTests = paths.some(function (p) {
      return /(^|\/)(tests?|__tests__|spec)\//i.test(p) || /\.(test|spec)\.[jt]sx?$/i.test(p);
    });
    var riskyFiles = paths.filter(function (p) {
      var id = classifyPath(p);
      return id === 'auth' || id === 'crypto' || id === 'migration' || id === 'ci';
    });

    if (riskyFiles.length && !hasTests) {
      warnings.push({
        severity: 'high',
        title: 'High-risk paths without matching tests',
        detail: 'Changed ' + riskyFiles.length + ' sensitive file(s) but no test/spec paths appear in the PR file list.'
      });
    }

    if (buckets.auth.files.length && !/(refresh|rotate|csrf|ratelimit|rate-limit)/i.test(pathStr + '\n' + notes)) {
      warnings.push({
        severity: 'high',
        title: 'Auth change may skip adjacent controls',
        detail: 'Session/JWT files changed without obvious CSRF, refresh-token, or rate-limit companions — common blind spots.'
      });
    }

    if (buckets.crypto.files.length && /(md5|sha1|hard-?coded|temporary secret)/i.test(pathStr + '\n' + notes)) {
      warnings.push({
        severity: 'high',
        title: 'Weak or temporary crypto cues in notes/paths',
        detail: 'Legacy digests or temporary secrets in the diff notes/paths need explicit threat-model review.'
      });
    }

    if (buckets.migration.files.length && /(irreversible|no down|drop column|non-reversible)/i.test(notes)) {
      warnings.push({
        severity: 'high',
        title: 'Irreversible migration flagged in notes',
        detail: 'Confirm expand/contract deploy order, backups, and a rollback story before merge.'
      });
    } else if (buckets.migration.files.length && !/down|rollback/i.test(notes)) {
      warnings.push({
        severity: 'mid',
        title: 'Migration without rollback mention',
        detail: 'Ask for a down migration or documented forward-fix plan; data PRs often miss this in review.'
      });
    }

    if (buckets.ci.files.length && /(continue-on-error|skip.*test|disable.*e2e|permissions:\s*write-all)/i.test(notes + '\n' + pathStr)) {
      warnings.push({
        severity: 'high',
        title: 'CI safety nets weakened',
        detail: 'Workflow changes that skip tests or broaden tokens are classic merge-time blind spots.'
      });
    }

    if (buckets.ci.files.length && buckets.ci.files.some(function (p) {
      return /deploy/i.test(p);
    })) {
      warnings.push({
        severity: 'mid',
        title: 'Deploy workflow in the same PR',
        detail: 'Review environment protection rules and required reviewers separately from app logic.'
      });
    }

    var onlyDocs = paths.length > 0 && paths.every(function (p) {
      return /\.(md|txt)$/i.test(p) || /docs\//i.test(p);
    });
    if (onlyDocs) {
      warnings.push({
        severity: 'low',
        title: 'Docs-only change',
        detail: 'Low runtime risk — still check for copied secrets or incorrect security guidance.'
      });
    }

    if (!warnings.length) {
      warnings.push({
        severity: 'low',
        title: 'No major blind spots heuristically flagged',
        detail: 'Still walk the highest-scoring taxonomy category first and confirm tests cover the happy path + failure modes.'
      });
    }

    return warnings;
  }

  function reviewOrder(paths, buckets) {
    var scored = paths.map(function (p) {
      var id = classifyPath(p);
      var cat = buckets[id];
      var fileBoost = id === 'other' ? 1 : 10;
      return {
        path: p,
        category: id,
        label: cat.label,
        priority: cat.score + fileBoost
      };
    });
    scored.sort(function (a, b) {
      return b.priority - a.priority;
    });
    return scored;
  }

  function testFocus(buckets, warnings) {
    var focus = [];
    if (buckets.auth.score > 0) {
      focus.push({
        severity: 'test',
        title: 'Auth test focus',
        detail: 'Expired tokens, refresh rotation, cookie Secure/HttpOnly/SameSite, and unauthorized route matrix.'
      });
    }
    if (buckets.crypto.score > 0) {
      focus.push({
        severity: 'test',
        title: 'Crypto test focus',
        detail: 'Known-answer vectors, key rotation, failure on wrong tag/nonce, and secret redaction in logs.'
      });
    }
    if (buckets.migration.score > 0) {
      focus.push({
        severity: 'test',
        title: 'Migration test focus',
        detail: 'Apply on a prod-like snapshot, verify backfill idempotency, and rehearse rollback or expand/contract.'
      });
    }
    if (buckets.ci.score > 0) {
      focus.push({
        severity: 'test',
        title: 'CI test focus',
        detail: 'Ensure required checks cannot be skipped; run the disabled job locally; audit token permissions.'
      });
    }
    if (warnings.some(function (w) {
      return /without matching tests/i.test(w.title);
    })) {
      focus.push({
        severity: 'test',
        title: 'Add coverage before approve',
        detail: 'Block merge until at least one targeted regression test exists for the highest-risk path.'
      });
    }
    if (!focus.length) {
      focus.push({
        severity: 'test',
        title: 'Smoke + regression',
        detail: 'Run unit smoke for touched modules and one end-to-end path that exercises the change.'
      });
    }
    return focus;
  }

  function renderFindings(listEl, items) {
    listEl.innerHTML = '';
    items.forEach(function (item, idx) {
      var li = document.createElement('li');
      var sev = item.severity || 'mid';
      var cls = sev === 'test' ? 'test' : sev === 'high' ? 'high' : sev === 'low' ? 'low' : sev === 'ok' ? 'ok' : 'mid';
      li.className = 'blind-finding is-' + cls;
      li.style.animationDelay = idx * 0.04 + 's';
      var badge =
        sev === 'high' ? 'blind-badge-high' : sev === 'low' || sev === 'test' ? 'blind-badge-low' : 'blind-badge-mid';
      li.innerHTML =
        '<span class="blind-badge ' +
        badge +
        '">' +
        escapeHtml(sev) +
        '</span>' +
        '<p class="blind-finding-title">' +
        escapeHtml(item.title) +
        '</p>' +
        '<p class="blind-finding-body">' +
        escapeHtml(item.detail) +
        '</p>';
      listEl.appendChild(li);
    });
  }

  function renderReport(report) {
    $('blindEmpty').hidden = true;
    $('blindResults').hidden = false;

    $('statFiles').textContent = String(report.paths.length);
    $('statBlindspots').textContent = String(
      report.warnings.filter(function (w) {
        return w.severity === 'high' || w.severity === 'mid';
      }).length
    );
    $('statRisk').textContent = report.risk.label;

    $('blindScoreVal').textContent = String(report.risk.score);
    var ring = $('blindScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add('is-' + report.risk.band);
    $('blindRiskBlurb').textContent =
      'Aggregate risk ' +
      report.risk.score +
      '/100 across ' +
      report.paths.length +
      ' file(s). Review highest taxonomy scores first; do not rubber-stamp CI or migration side-effects.';

    var taxHtml = '';
    TAXONOMY.forEach(function (cat) {
      var b = report.buckets[cat.id];
      taxHtml +=
        '<div class="blind-tax-card is-' +
        cat.id +
        '"><h4>' +
        escapeHtml(cat.label) +
        '<span class="blind-tax-score">' +
        b.score +
        '</span></h4><p>' +
        (b.files.length
          ? b.files.length + ' file(s): ' + escapeHtml(b.files.slice(0, 3).join(', ')) + (b.files.length > 3 ? '…' : '')
          : b.boost
            ? 'No paths — boosted from diff notes'
            : 'No matching paths') +
        '</p></div>';
    });
    $('blindTaxonomy').innerHTML = taxHtml;

    renderFindings($('blindWarnList'), report.warnings);

    var orderEl = $('blindOrderList');
    orderEl.innerHTML = '';
    report.order.slice(0, 12).forEach(function (item, idx) {
      var li = document.createElement('li');
      li.style.animationDelay = idx * 0.04 + 's';
      li.innerHTML =
        '<code>' +
        escapeHtml(item.path) +
        '</code>' +
        '<span class="blind-order-meta">' +
        escapeHtml(item.label) +
        ' · priority ' +
        item.priority +
        '</span>';
      orderEl.appendChild(li);
    });

    renderFindings($('blindTestList'), report.testFocus);
    $('blindExportBtn').disabled = false;
  }

  function analyze() {
    var paths = parsePaths($('blindPaths').value);
    var notes = String($('blindNotes').value || '').trim();
    if (!paths.length) {
      setStatus('Add at least one changed file path (or load a preset).', 'is-error');
      return;
    }
    var buckets = scoreCategories(paths, notes);
    var risk = aggregateRisk(buckets, paths);
    var warnings = detectBlindspots(paths, notes, buckets);
    var order = reviewOrder(paths, buckets);
    var tests = testFocus(buckets, warnings);
    lastReport = {
      generatedAt: new Date().toISOString(),
      paths: paths,
      notes: notes,
      buckets: buckets,
      risk: risk,
      warnings: warnings,
      order: order,
      testFocus: tests
    };
    renderReport(lastReport);
    setStatus(
      'Scored ' + paths.length + ' path(s); ' + warnings.length + ' blind-spot warning(s).',
      'is-ok'
    );
  }

  function loadPreset(name) {
    var preset = PRESETS[name];
    if (!preset) return;
    $('blindPaths').value = preset.paths;
    $('blindNotes').value = preset.notes;
    setStatus('Loaded "' + name + '" risky PR preset.', 'is-ok');
    analyze();
  }

  function clearAll() {
    $('blindPaths').value = '';
    $('blindNotes').value = '';
    lastReport = null;
    $('blindEmpty').hidden = false;
    $('blindResults').hidden = true;
    $('blindExportBtn').disabled = true;
    $('statFiles').textContent = '0';
    $('statBlindspots').textContent = '0';
    $('statRisk').textContent = '—';
    setStatus('Cleared.');
  }

  function downloadReport() {
    if (!lastReport) return;
    var taxonomy = {};
    Object.keys(lastReport.buckets).forEach(function (id) {
      var b = lastReport.buckets[id];
      taxonomy[id] = { label: b.label, score: b.score, files: b.files, noteBoost: b.boost };
    });
    var payload = {
      tool: 'ai-pr-review-blindspot-finder',
      generatedAt: lastReport.generatedAt,
      risk: lastReport.risk,
      paths: lastReport.paths,
      notes: lastReport.notes,
      taxonomy: taxonomy,
      blindspotWarnings: lastReport.warnings,
      suggestedReviewOrder: lastReport.order,
      testFocus: lastReport.testFocus
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pr-review-coverage-report-' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Review coverage report downloaded.', 'is-ok');
  }

  function init() {
    $('blindAnalyzeBtn').addEventListener('click', analyze);
    $('blindClearBtn').addEventListener('click', clearAll);
    $('blindExportBtn').addEventListener('click', downloadReport);
    Array.prototype.forEach.call(document.querySelectorAll('.blind-preset-btn'), function (btn) {
      btn.addEventListener('click', function () {
        loadPreset(btn.getAttribute('data-preset'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
