(function () {
  'use strict';

  var lastReport = null;

  var DEMO_MANIFEST =
    "{\n" +
    "  \"name\": \"algo-infinity-web\",\n" +
    "  \"dependencies\": {\n" +
    "    \"react\": \"^18.2.0\",\n" +
    "    \"lodash\": \"^4.17.21\",\n" +
    "    \"lodahs\": \"^4.17.21\",\n" +
    "    \"react-dom\": \"^18.2.0\",\n" +
    "    \"algo-infinity-core\": \"1.4.2\",\n" +
    "    \"algoinfinity-auth\": \"0.9.0\",\n" +
    "    \"internal-quiz-engine\": \"2.1.0\",\n" +
    "    \"@company/ui-kit\": \"3.0.1\",\n" +
    "    \"expresss\": \"4.18.2\",\n" +
    "    \"webpack-dev-svr\": \"4.0.0\"\n" +
    "  },\n" +
    "  \"devDependencies\": {\n" +
    "    \"typescript\": \"^5.0.0\",\n" +
    "    \"aiv-build-tools\": \"0.3.1\"\n" +
    "  }\n" +
    "}\n\n" +
    "# yarn.lock excerpt\n" +
    "algo-infinity-core@1.4.2:\n" +
    "  version \"1.4.2\"\n" +
    "  resolved \"https://registry.npmjs.org/algo-infinity-core/-/algo-infinity-core-1.4.2.tgz\"\n";

  var POPULAR = [
    'lodash', 'react', 'react-dom', 'express', 'webpack', 'typescript',
    'axios', 'jquery', 'moment', 'underscore', 'chalk', 'debug',
    'commander', 'request', 'vue', 'angular', 'next', 'vite'
  ];

  var INTERNAL_HINTS = [
    /^(algo|aiv|internal|company|corp|private|intranet|acme)/i,
    /infinity|quiz-engine|build-tools|auth-sdk|monorepo/i
  ];

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
    var el = $('depconfStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function levenshtein(a, b) {
    var s = String(a);
    var t = String(b);
    var m = s.length;
    var n = t.length;
    var i;
    var j;
    var prev = [];
    var cur = [];
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        var cost = s.charAt(i - 1) === t.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      var tmp = prev;
      prev = cur;
      cur = tmp;
    }
    return prev[n];
  }

  function extractPackages(text) {
    var names = {};
    var src = String(text || '');

    // JSON-ish "name": "version"
    var reJson = /["'](@?[a-z0-9][\w.-]*\/[\w.-]+|[a-z0-9][\w.-]*)["']\s*:\s*["'][^"']+["']/gi;
    var m;
    while ((m = reJson.exec(src)) !== null) {
      var n = m[1];
      if (!/^(name|version|main|license|description|author|private)$/i.test(n)) {
        names[n] = true;
      }
    }

    // lockfile package@ver headers
    var reLock = /^(@?[a-z0-9][\w.-]*\/[\w.-]+|[a-z0-9][\w.-]+)@/gim;
    while ((m = reLock.exec(src)) !== null) {
      names[m[1]] = true;
    }

    // bare dependency lines: "pkg":
    var reBare = /^\s*["'](@?[a-z0-9][\w.-]*\/[\w.-]+|[a-z0-9][\w.-]*)["']\s*:/gim;
    while ((m = reBare.exec(src)) !== null) {
      names[m[1]] = true;
    }

    return Object.keys(names);
  }

  function isScoped(name) {
    return name.charAt(0) === '@' && name.indexOf('/') > 0;
  }

  function looksInternal(name) {
    var base = isScoped(name) ? name.split('/')[1] : name;
    return INTERNAL_HINTS.some(function (re) { return re.test(name) || re.test(base); });
  }

  function findTyposquat(name) {
    if (isScoped(name)) return null;
    var best = null;
    POPULAR.forEach(function (pop) {
      if (name === pop) return;
      var d = levenshtein(name.toLowerCase(), pop);
      var maxLen = Math.max(name.length, pop.length);
      if (d > 0 && d <= 2 && maxLen >= 4) {
        if (!best || d < best.distance) {
          best = { popular: pop, distance: d };
        }
      }
    });
    return best;
  }

  function analyze(text) {
    var src = String(text || '');
    var packages = extractPackages(src);
    var findings = [];
    var unscopedInternal = [];
    var typos = [];
    var resolvedPublicInternal = /registry\.npmjs\.org\/(algo|aiv|internal)/i.test(src);

    packages.forEach(function (pkg) {
      var scoped = isScoped(pkg);
      var internal = looksInternal(pkg);

      if (!scoped && internal) {
        unscopedInternal.push(pkg);
        findings.push({
          severity: 'critical',
          id: 'unscoped-' + pkg,
          title: 'Unscoped internal-looking package: ' + pkg,
          body: 'Name suggests a private/internal library but is unscoped. Attackers can publish the same name on the public registry and win install races (dependency confusion).'
        });
      }

      var typo = findTyposquat(pkg);
      if (typo) {
        typos.push({ name: pkg, popular: typo.popular, distance: typo.distance });
        findings.push({
          severity: typo.distance === 1 ? 'critical' : 'high',
          id: 'typo-' + pkg,
          title: 'Possible typosquat: ' + pkg + ' ≈ ' + typo.popular,
          body: 'Levenshtein distance ' + typo.distance + ' from popular package "' + typo.popular +
            '". Confirm intentional fork vs typo / malicious lookalike.'
        });
      }
    });

    if (resolvedPublicInternal) {
      findings.push({
        severity: 'critical',
        id: 'public-resolve',
        title: 'Internal-looking package resolved from registry.npmjs.org',
        body: 'Lockfile shows a private-sounding name fetched from the public npm registry — classic confusion indicator. Pin to a private registry / Verdaccio / Artifactory instead.'
      });
    }

    if (!findings.length) {
      findings.push({
        severity: 'ok',
        id: 'clean',
        title: 'No obvious confusion / typosquat signals',
        body: 'No unscoped internal-looking names or near-miss popular packages detected. Still enforce scope + registry policy in CI.'
      });
    }

    var score = Math.min(99, 8 + unscopedInternal.length * 26 + typos.length * 18 + (resolvedPublicInternal ? 20 : 0));
    var risk = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';

    var policy = [
      'Publish all private packages under a reserved scope (e.g. @algo-infinity/*) and claim the scope on npm.',
      'Configure .npmrc / yarnrc to route @scope/* exclusively to the private registry; never fall back to public for that scope.',
      'Block installs of unscoped packages that match internal naming conventions in CI policy checks.',
      'Prefer lockfile integrity hashes and --frozen-lockfile / npm ci in pipelines.',
      'Consider npm package allowlists or tools that detect dependency confusion in PRs.'
    ];

    return {
      packages: packages,
      findings: findings,
      unscopedInternal: unscopedInternal,
      typos: typos,
      score: score,
      risk: risk,
      policy: policy,
      source: src,
      generatedAt: new Date().toISOString()
    };
  }

  function updateHero(report) {
    $('statPackages').textContent = String(report.packages.length);
    $('statUnscoped').textContent = String(report.unscopedInternal.length);
    $('statTypos').textContent = String(report.typos.length);
    $('statRisk').textContent = report.risk;
  }

  function renderReport(report) {
    $('depconfEmpty').hidden = true;
    $('depconfResults').hidden = false;

    var blurb = report.score >= 70
      ? 'Critical confusion surface — scope internals and pin private registries before merge.'
      : report.score >= 40
        ? 'Elevated risk — review typosquats and unscoped internal names.'
        : 'Low heuristic risk — keep registry/scope policy enforced in CI.';

    $('depconfRiskBlurb').textContent = blurb;
    $('depconfScoreVal').textContent = String(report.score);

    var ring = $('depconfScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add(report.score >= 70 ? 'is-high' : report.score >= 40 ? 'is-mid' : 'is-low');

    $('depconfFindingList').innerHTML = report.findings.map(function (f) {
      return '<li class="depconf-finding is-' + escapeHtml(f.severity) + '">' +
        '<span class="depconf-badge is-' + escapeHtml(f.severity) + '">' + escapeHtml(f.severity) + '</span>' +
        '<p class="depconf-finding-title">' + escapeHtml(f.title) + '</p>' +
        '<p class="depconf-finding-body">' + escapeHtml(f.body) + '</p>' +
        '</li>';
    }).join('');

    $('depconfPolicyOut').innerHTML =
      '<p>Recommended registry / scope controls:</p><ul>' +
      report.policy.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('') +
      '</ul>';

    updateHero(report);
    $('depconfExportBtn').disabled = false;
  }

  function exportReport(report) {
    var lines = [];
    lines.push('# Dependency Confusion Audit Report');
    lines.push('Generated: ' + report.generatedAt);
    lines.push('Risk score: ' + report.score + '/100 (' + report.risk + ')');
    lines.push('Packages parsed: ' + report.packages.length);
    lines.push('Unscoped internal-looking: ' + (report.unscopedInternal.join(', ') || 'none'));
    lines.push('Typosquat candidates: ' + (report.typos.map(function (t) {
      return t.name + '~' + t.popular + '(d=' + t.distance + ')';
    }).join(', ') || 'none'));
    lines.push('');
    lines.push('## Findings');
    report.findings.forEach(function (f, i) {
      lines.push((i + 1) + '. [' + f.severity + '] ' + f.title);
      lines.push('   ' + f.body);
    });
    lines.push('');
    lines.push('## Registry / scope policy recommendations');
    report.policy.forEach(function (p, i) {
      lines.push((i + 1) + '. ' + p);
    });
    lines.push('');
    lines.push('## Source excerpt');
    lines.push('```');
    lines.push(report.source);
    lines.push('```');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'dependency-confusion-report.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function runAudit() {
    var text = $('depconfManifestInput').value;
    if (!String(text || '').trim()) {
      setStatus('Paste a package.json/lock excerpt or load the vulnerable demos.', 'is-error');
      return;
    }
    lastReport = analyze(text);
    renderReport(lastReport);
    setStatus('Audit complete — ' + lastReport.packages.length + ' package(s), risk: ' +
      lastReport.risk + '.', 'is-ok');
  }

  function clearAll() {
    $('depconfManifestInput').value = '';
    lastReport = null;
    $('depconfEmpty').hidden = false;
    $('depconfResults').hidden = true;
    $('depconfExportBtn').disabled = true;
    $('statPackages').textContent = '0';
    $('statUnscoped').textContent = '0';
    $('statTypos').textContent = '0';
    $('statRisk').textContent = '—';
    setStatus('Cleared.');
  }

  function init() {
    $('depconfLoadDemoBtn').addEventListener('click', function () {
      $('depconfManifestInput').value = DEMO_MANIFEST;
      setStatus('Loaded unscoped internals, typosquats, and public-registry resolve demo.', 'is-ok');
    });
    $('depconfAuditBtn').addEventListener('click', runAudit);
    $('depconfClearBtn').addEventListener('click', clearAll);
    $('depconfExportBtn').addEventListener('click', function () {
      if (!lastReport) return;
      exportReport(lastReport);
      setStatus('Downloaded dependency-confusion-report.md', 'is-ok');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
