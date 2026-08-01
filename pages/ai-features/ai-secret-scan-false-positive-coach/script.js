(function () {
  'use strict';

  var lastReport = null;

  // Assemble demo tokens at runtime so git history never stores provider-looking literals.
  var DEMO_STRIPE_LIVE = ['sk', 'live', 'DEMOONLY' + '00000000000000000000'].join('_');
  var DEMO_STRIPE_MASKED = ['sk', 'test', '************************'].join('_');
  var DEMO_AWS_DOC_EXAMPLE = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCY' + 'EXAMPLEKEY';

  
  var DEMO_DIFF =
    "@@ -12,6 +12,14 @@ module.exports = {\n" +
    "+  # DEMO LEAK SAMPLE — synthetic only, rotate if ever real\n" +
    "+  AWS_SECRET_ACCESS_KEY=" + DEMO_AWS_DOC_EXAMPLE + "\n" +
    "+  STRIPE_SECRET=" + DEMO_STRIPE_LIVE + "\n" +
    "+\n" +
    "+  # Likely false positives\n" +
    "+  EXAMPLE_AWS_KEY=AKIAIOSFODNN7EXAMPLE\n" +
    "+  const PLACEHOLDER = '" + DEMO_STRIPE_MASKED + "';\n" +
    "+  // docs: set GITHUB_TOKEN=ghp_xxxxxxxx in CI secrets, never commit\n" +
    "+  const publicPem = '-----BEGIN PUBLIC KEY-----\\nMFwwDQYJ...\\n-----END PUBLIC KEY-----';\n" +
    "+  HASH_SAMPLE=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n";

  var ENV_TIPS =
    "# Safe .env rewrite tips\n" +
    "# 1. Never commit real .env — keep .env in .gitignore\n" +
    "# 2. Commit .env.example with empty or placeholder values only\n" +
    "AWS_ACCESS_KEY_ID=\n" +
    "AWS_SECRET_ACCESS_KEY=\n" +
    "STRIPE_SECRET=\n" +
    "GITHUB_TOKEN=\n\n" +
    "# 3. Load secrets from the platform vault / CI secret store at runtime\n" +
    "# 4. Use short-lived credentials (STS, OIDC) where possible\n" +
    "# 5. If a live key hit git history: rotate, purge history, notify owners\n";

  var PATTERNS = [
    { id: 'aws-secret', name: 'AWS secret access key', re: /(?:AWS_SECRET_ACCESS_KEY|aws_secret_access_key)\s*[=:]\s*([A-Za-z0-9/+=]{30,})/g },
    { id: 'aws-akia', name: 'AWS access key id', re: /\b(AKIA[0-9A-Z]{16})\b/g },
    { id: 'stripe', name: 'Stripe secret key', re: /\b(sk_(?:live|test)_[A-Za-z0-9]{16,})\b/g },
    { id: 'github', name: 'GitHub token', re: /\b(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g },
    { id: 'jwt', name: 'JWT-like token', re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g }
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
    var el = $('secretStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function shannonEntropy(s) {
    var freq = {};
    var i;
    for (i = 0; i < s.length; i++) {
      freq[s[i]] = (freq[s[i]] || 0) + 1;
    }
    var h = 0;
    var len = s.length;
    Object.keys(freq).forEach(function (ch) {
      var p = freq[ch] / len;
      h -= p * Math.log2(p);
    });
    return h;
  }

  function redact(val) {
    var v = String(val || '');
    if (v.length <= 8) return '****';
    return v.slice(0, 4) + '…' + v.slice(-4);
  }

  function contextFpScore(line, value) {
    var ctx = String(line || '').toLowerCase();
    var val = String(value || '').toLowerCase();
    var fp = 0;
    if (/example|placeholder|sample|dummy|fake|xxxx|\*{4,}|redacted|docs?:|never commit|\.example/.test(ctx)) fp += 45;
    if (/example|placeholder|xxxx|fake|dummy/.test(val)) fp += 30;
    if (/akiaiosfodnn7example/.test(val)) fp += 40;
    if (/sk_test_/.test(val) && /\*/.test(val)) fp += 35;
    if (/public key|begin public/.test(ctx)) fp += 50;
    if (/e3b0c44298fc1c149afbf4c8996fb924/.test(val)) fp += 55;
    if (/sk_live_|ghp_|github_pat_|aws_secret_access_key\s*=\s*[^e\s]/.test(ctx) && fp < 40) fp = Math.max(0, fp - 25);
    return Math.min(95, fp);
  }

  function analyze(text) {
    var src = String(text || '');
    var lines = src.split(/\r?\n/);
    var findings = [];
    var seen = {};

    function pushFinding(f) {
      var key = f.id + '|' + f.sample;
      if (seen[key]) return;
      seen[key] = true;
      findings.push(f);
    }

    lines.forEach(function (line, idx) {
      PATTERNS.forEach(function (p) {
        var re = new RegExp(p.re.source, p.re.flags);
        var m;
        while ((m = re.exec(line)) !== null) {
          var value = m[1] || m[0];
          var fp = contextFpScore(line, value);
          var entropy = shannonEntropy(value.replace(/[^A-Za-z0-9]/g, ''));
          var kind = fp >= 55 ? 'fp' : (fp >= 30 ? 'review' : 'leak');
          var action = kind === 'leak' ? 'rotate' : (kind === 'fp' ? 'allowlist' : 'review');
          pushFinding({
            severity: kind,
            id: p.id,
            title: p.name,
            sample: redact(value),
            line: idx + 1,
            entropy: Math.round(entropy * 100) / 100,
            fpScore: fp,
            action: action,
            body: 'Line ' + (idx + 1) + ': entropy≈' + entropy.toFixed(2) +
              ', FP score ' + fp + '/100. Context suggests ' +
              (kind === 'fp' ? 'false positive' : kind === 'leak' ? 'real leak' : 'manual review') + '.'
          });
        }
      });

      // High-entropy assignment heuristic
      var assign = line.match(/(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD)\s*[=:]\s*['"]?([A-Za-z0-9/+=_\-.]{24,})/i);
      if (assign) {
        var tok = assign[1];
        var ent = shannonEntropy(tok);
        if (ent >= 4.2) {
          var fp2 = contextFpScore(line, tok);
          var kind2 = fp2 >= 55 ? 'fp' : (fp2 >= 30 ? 'review' : 'leak');
          pushFinding({
            severity: kind2,
            id: 'entropy-token',
            title: 'High-entropy credential-like token',
            sample: redact(tok),
            line: idx + 1,
            entropy: Math.round(ent * 100) / 100,
            fpScore: fp2,
            action: kind2 === 'leak' ? 'rotate' : (kind2 === 'fp' ? 'allowlist' : 'review'),
            body: 'Line ' + (idx + 1) + ': Shannon entropy ' + ent.toFixed(2) +
              ' on a SECRET/KEY/TOKEN assignment. FP score ' + fp2 + '.'
          });
        }
      }
    });

    if (!findings.length) {
      findings.push({
        severity: 'ok',
        id: 'clean',
        title: 'No secret-like tokens detected',
        sample: '—',
        line: 0,
        entropy: 0,
        fpScore: 0,
        action: 'none',
        body: 'No pattern or high-entropy hits. Still avoid committing real .env files.'
      });
    }

    var leaks = findings.filter(function (f) { return f.severity === 'leak'; });
    var fps = findings.filter(function (f) { return f.severity === 'fp'; });
    var topAction = leaks.length ? 'rotate' : (fps.length && !findings.some(function (f) { return f.severity === 'review'; }) ? 'allowlist' : (findings[0].action || 'review'));
    if (topAction === 'none') topAction = '—';

    var score = Math.min(99, 10 + leaks.length * 28 + findings.filter(function (f) { return f.severity === 'review'; }).length * 12);

    return {
      findings: findings,
      leaks: leaks.length,
      fps: fps.length,
      topAction: topAction,
      score: score,
      source: src,
      envTips: ENV_TIPS,
      generatedAt: new Date().toISOString()
    };
  }

  function updateHero(report) {
    var hits = report.findings.filter(function (f) { return f.severity !== 'ok'; }).length;
    $('statHits').textContent = String(hits);
    $('statLikely').textContent = String(report.leaks);
    $('statFp').textContent = String(report.fps);
    $('statAction').textContent = report.topAction;
  }

  function renderReport(report) {
    $('secretEmpty').hidden = true;
    $('secretResults').hidden = false;
    $('secretRewritePanel').hidden = false;

    var blurb = report.leaks
      ? 'Likely real secrets present — rotate and purge before merging.'
      : report.fps
        ? 'Mostly false positives — allowlist carefully with scoped paths.'
        : 'Low signal — keep scanning CI secrets out of the repo.';

    $('secretRiskBlurb').textContent = blurb;
    $('secretScoreVal').textContent = String(report.score);

    var ring = $('secretScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add(report.score >= 70 ? 'is-high' : report.score >= 40 ? 'is-mid' : 'is-low');

    $('secretFindingList').innerHTML = report.findings.map(function (f) {
      return '<li class="secret-finding is-' + escapeHtml(f.severity) + '">' +
        '<span class="secret-badge is-' + escapeHtml(f.severity) + '">' + escapeHtml(f.severity) + '</span>' +
        '<span class="secret-badge">' + escapeHtml(f.action) + '</span>' +
        '<p class="secret-finding-title">' + escapeHtml(f.title) + ' <code>' + escapeHtml(f.sample) + '</code></p>' +
        '<p class="secret-finding-body">' + escapeHtml(f.body) + '</p>' +
        '</li>';
    }).join('');

    var coachBits = [];
    if (report.leaks) {
      coachBits.push('Rotate every likely-leak credential in the provider console, then revoke old versions.');
      coachBits.push('Assume git history is compromised — rewrite or use a secrets-purge tool, then force-protect main.');
    }
    if (report.fps) {
      coachBits.push('Allowlist only documented placeholders (EXAMPLE keys, masked sk_test_, public PEMs) with path-scoped rules.');
      coachBits.push('Prefer scanner baselines that ignore .md / docs fixtures rather than global suppressions.');
    }
    if (!coachBits.length) {
      coachBits.push('No rotate/allowlist pressure — keep .env out of VCS and use vault injection.');
    }

    $('secretCoachOut').innerHTML = '<ul>' + coachBits.map(function (c) {
      return '<li>' + escapeHtml(c) + '</li>';
    }).join('') + '</ul>';

    $('secretEnvTips').innerHTML = '<code>' + escapeHtml(report.envTips) + '</code>';
    $('secretActionSummary').innerHTML =
      '<p><strong>Top action:</strong> ' + escapeHtml(report.topAction) + '</p>' +
      '<ul>' +
      '<li>Likely leaks: ' + report.leaks + '</li>' +
      '<li>Likely FPs: ' + report.fps + '</li>' +
      '<li>Findings: ' + report.findings.length + '</li>' +
      '</ul>';

    updateHero(report);
    $('secretExportBtn').disabled = false;
  }

  function exportReport(report) {
    var lines = [];
    lines.push('# Secret Scan False-Positive Triage Report');
    lines.push('Generated: ' + report.generatedAt);
    lines.push('Triage score: ' + report.score + '/100');
    lines.push('Likely leaks: ' + report.leaks);
    lines.push('Likely FPs: ' + report.fps);
    lines.push('Top action: ' + report.topAction);
    lines.push('');
    lines.push('## Findings');
    report.findings.forEach(function (f, i) {
      lines.push((i + 1) + '. [' + f.severity + '/' + f.action + '] ' + f.title + ' (' + f.sample + ')');
      lines.push('   ' + f.body);
    });
    lines.push('');
    lines.push('## Safe .env tips');
    lines.push('```');
    lines.push(report.envTips);
    lines.push('```');
    lines.push('');
    lines.push('## Source');
    lines.push('```');
    lines.push(report.source);
    lines.push('```');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'secret-scan-triage-report.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function runScan() {
    var text = $('secretDiffInput').value;
    if (!String(text || '').trim()) {
      setStatus('Paste diff hunks or load the leak + FP demos.', 'is-error');
      return;
    }
    lastReport = analyze(text);
    renderReport(lastReport);
    setStatus('Triage complete — ' + lastReport.findings.length + ' finding(s), top action: ' +
      lastReport.topAction + '.', 'is-ok');
  }

  function clearAll() {
    $('secretDiffInput').value = '';
    lastReport = null;
    $('secretEmpty').hidden = false;
    $('secretResults').hidden = true;
    $('secretRewritePanel').hidden = true;
    $('secretExportBtn').disabled = true;
    $('statHits').textContent = '0';
    $('statLikely').textContent = '0';
    $('statFp').textContent = '0';
    $('statAction').textContent = '—';
    setStatus('Cleared.');
  }

  function init() {
    $('secretLoadDemoBtn').addEventListener('click', function () {
      $('secretDiffInput').value = DEMO_DIFF;
      setStatus('Loaded AWS/Stripe leak samples plus EXAMPLE / placeholder / public-key FPs.', 'is-ok');
    });
    $('secretScanBtn').addEventListener('click', runScan);
    $('secretClearBtn').addEventListener('click', clearAll);
    $('secretExportBtn').addEventListener('click', function () {
      if (!lastReport) return;
      exportReport(lastReport);
      setStatus('Downloaded secret-scan-triage-report.md', 'is-ok');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
