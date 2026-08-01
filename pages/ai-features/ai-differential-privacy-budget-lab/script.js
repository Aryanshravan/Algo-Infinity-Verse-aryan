(function () {
  'use strict';

  var lastReport = null;

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
    var el = $('dpbudStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function laplaceNoise(scale) {
    // Inverse CDF of Laplace(0, b)
    var u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  function readInputs() {
    return {
      epsTotal: Number($('dpbudEpsilonTotal').value) || 0,
      delta: Number($('dpbudDelta').value) || 0,
      queries: Math.max(1, Math.floor(Number($('dpbudQueries').value) || 1)),
      perQuery: Number($('dpbudPerQuery').value) || 0,
      sensitivity: Math.max(1, Number($('dpbudSensitivity').value) || 1),
      trueCount: Math.max(0, Number($('dpbudTrueCount').value) || 0)
    };
  }

  function analyze(cfg) {
    var epsUsed = cfg.queries * cfg.perQuery;
    var epsRemain = cfg.epsTotal - epsUsed;
    var exhausted = epsRemain < 0;
    var scale = cfg.sensitivity / Math.max(cfg.perQuery, 1e-9);
    var noise = laplaceNoise(scale);
    var noisy = Math.max(0, Math.round(cfg.trueCount + noise));
    var absErr = Math.abs(noisy - cfg.trueCount);
    var relErr = cfg.trueCount > 0 ? absErr / cfg.trueCount : 0;
    var utility = Math.max(0, Math.min(100, Math.round((1 - relErr) * 100)));

    var warnings = [];
    if (exhausted) {
      warnings.push({
        severity: 'critical',
        title: 'Privacy budget exhausted',
        body: 'Basic composition uses ε≈' + epsUsed.toFixed(3) + ' against a total of ' +
          cfg.epsTotal.toFixed(3) + '. Stop releasing aggregates or raise the budget with governance approval.'
      });
    } else if (epsRemain / cfg.epsTotal < 0.2) {
      warnings.push({
        severity: 'high',
        title: 'Budget nearly depleted',
        body: 'Only ' + epsRemain.toFixed(3) + ' ε remains (~' +
          Math.round((epsRemain / cfg.epsTotal) * 100) + '%). Prioritize high-value queries.'
      });
    } else {
      warnings.push({
        severity: 'ok',
        title: 'Budget within envelope',
        body: 'Used ' + epsUsed.toFixed(3) + ' of ' + cfg.epsTotal.toFixed(3) +
          ' ε under basic composition (k·ε_query). Advanced accountants (RDP/zCDP) may be tighter.'
      });
    }

    if (cfg.delta > 1e-5) {
      warnings.push({
        severity: 'high',
        title: 'δ is relatively large',
        body: 'δ=' + cfg.delta + ' may be too loose for large user bases. Prefer δ ≪ 1/n for population size n.'
      });
    }

    if (utility < 60) {
      warnings.push({
        severity: 'high',
        title: 'Utility degraded by noise',
        body: 'Relative error ≈' + (relErr * 100).toFixed(1) +
          '%. Consider fewer queries, larger ε_query (with budget trade-off), or aggregated cohorts.'
      });
    }

    if (cfg.queries > 50) {
      warnings.push({
        severity: 'high',
        title: 'Many composed queries',
        body: 'k=' + cfg.queries + ' under basic composition burns budget quickly. Batch / reuse releases or use advanced composition.'
      });
    }

    var release = 'hold';
    if (!exhausted && utility >= 70 && epsRemain / cfg.epsTotal >= 0.2) release = 'safe';
    else if (!exhausted && utility >= 50) release = 'caution';
    else release = 'hold';

    var recs = [];
    if (release === 'safe') {
      recs.push('Safe to publish this noisy quiz-attempt count with the stated (ε,δ) accounting.');
      recs.push('Log the spend in a budget ledger and freeze identical re-queries without new spend.');
    } else if (release === 'caution') {
      recs.push('Publish only if stakeholders accept higher noise; prefer weekly rollups over per-user slices.');
      recs.push('Reduce k or ε_query, or switch to advanced composition / Gaussian with RDP accounting.');
    } else {
      recs.push('Do not release — budget exhausted or utility too low for trustworthy analytics.');
      recs.push('Fall back to non-sensitive aggregates (coarse bins) or synthetic demo stats.');
    }
    recs.push('Demo note: Laplace mechanism with sensitivity Δ=' + cfg.sensitivity +
      ', scale b=Δ/ε_query≈' + scale.toFixed(3) + '.');

    var health = exhausted ? 92 : (epsRemain / Math.max(cfg.epsTotal, 1e-9) < 0.2 ? 68 : 28);
    if (utility < 60) health = Math.max(health, 55);

    return {
      cfg: cfg,
      epsUsed: epsUsed,
      epsRemain: epsRemain,
      scale: scale,
      noise: noise,
      noisy: noisy,
      trueCount: cfg.trueCount,
      absErr: absErr,
      relErr: relErr,
      utility: utility,
      warnings: warnings,
      recommendations: recs,
      release: release,
      health: Math.min(99, Math.round(health)),
      generatedAt: new Date().toISOString()
    };
  }

  function updateHero(report) {
    $('statEpsilon').textContent = report.epsUsed.toFixed(2);
    $('statRemain').textContent = report.epsRemain.toFixed(2);
    $('statUtility').textContent = String(report.utility);
    $('statRelease').textContent = report.release;
  }

  function renderReport(report) {
    $('dpbudEmpty').hidden = true;
    $('dpbudResults').hidden = false;

    var blurb = report.release === 'safe'
      ? 'Budget healthy and utility acceptable for a cautious public release.'
      : report.release === 'caution'
        ? 'Release with caveats — noise or remaining budget is tight.'
        : 'Hold the release — exhausted budget or unusable utility.';

    $('dpbudRiskBlurb').textContent = blurb;
    $('dpbudScoreVal').textContent = String(report.health);

    var ring = $('dpbudScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add(report.health >= 70 ? 'is-high' : report.health >= 40 ? 'is-mid' : 'is-low');

    $('dpbudNoiseOut').innerHTML =
      '<p><strong>True count:</strong> ' + report.trueCount +
      ' &nbsp;|&nbsp; <strong>Noisy release:</strong> ' + report.noisy +
      ' &nbsp;|&nbsp; <strong>|error|:</strong> ' + report.absErr +
      ' &nbsp;|&nbsp; <strong>b (Laplace):</strong> ' + report.scale.toFixed(3) + '</p>' +
      '<p class="dpbud-muted">ε_used ≈ k·ε_query = ' + report.cfg.queries + ' · ' +
      report.cfg.perQuery + ' = ' + report.epsUsed.toFixed(3) +
      '; δ≈' + report.cfg.delta + '</p>';

    var maxVal = Math.max(report.trueCount, report.noisy, 1);
    $('dpbudBarTrue').style.width = Math.min(100, (report.trueCount / maxVal) * 100) + '%';
    $('dpbudBarNoisy').style.width = Math.min(100, (report.noisy / maxVal) * 100) + '%';

    $('dpbudWarningList').innerHTML = report.warnings.map(function (w) {
      return '<li class="dpbud-finding is-' + escapeHtml(w.severity) + '">' +
        '<span class="dpbud-badge is-' + escapeHtml(w.severity) + '">' + escapeHtml(w.severity) + '</span>' +
        '<p class="dpbud-finding-title">' + escapeHtml(w.title) + '</p>' +
        '<p class="dpbud-finding-body">' + escapeHtml(w.body) + '</p>' +
        '</li>';
    }).join('');

    $('dpbudRecOut').innerHTML = '<ul>' + report.recommendations.map(function (r) {
      return '<li>' + escapeHtml(r) + '</li>';
    }).join('') + '</ul>';

    updateHero(report);
    $('dpbudExportBtn').disabled = false;
  }

  function exportReport(report) {
    var c = report.cfg;
    var lines = [];
    lines.push('# Differential Privacy Budget Report');
    lines.push('Generated: ' + report.generatedAt);
    lines.push('Mechanism: Laplace (demo), basic composition');
    lines.push('ε_total: ' + c.epsTotal);
    lines.push('δ: ' + c.delta);
    lines.push('queries k: ' + c.queries);
    lines.push('ε_per_query: ' + c.perQuery);
    lines.push('ε_used: ' + report.epsUsed.toFixed(4));
    lines.push('ε_remaining: ' + report.epsRemain.toFixed(4));
    lines.push('sensitivity Δ: ' + c.sensitivity);
    lines.push('Laplace scale b: ' + report.scale.toFixed(4));
    lines.push('true_count: ' + report.trueCount);
    lines.push('noisy_release: ' + report.noisy);
    lines.push('abs_error: ' + report.absErr);
    lines.push('utility_pct: ' + report.utility);
    lines.push('release_advice: ' + report.release);
    lines.push('');
    lines.push('## Composition warnings');
    report.warnings.forEach(function (w, i) {
      lines.push((i + 1) + '. [' + w.severity + '] ' + w.title);
      lines.push('   ' + w.body);
    });
    lines.push('');
    lines.push('## Safe release recommendations');
    report.recommendations.forEach(function (r, i) {
      lines.push((i + 1) + '. ' + r);
    });

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'dp-budget-report.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function runLab() {
    var cfg = readInputs();
    if (cfg.epsTotal <= 0 || cfg.perQuery <= 0) {
      setStatus('ε_total and ε_per_query must be positive.', 'is-error');
      return;
    }
    lastReport = analyze(cfg);
    renderReport(lastReport);
    setStatus('Lab run complete — release advice: ' + lastReport.release +
      ', utility ' + lastReport.utility + '%.', 'is-ok');
  }

  function applyPreset(kind) {
    if (kind === 'strict') {
      $('dpbudEpsilonTotal').value = '1.0';
      $('dpbudDelta').value = '0.0000001';
      $('dpbudQueries').value = '4';
      $('dpbudPerQuery').value = '0.15';
      $('dpbudSensitivity').value = '1';
      $('dpbudTrueCount').value = '1240';
      setStatus('Applied strict privacy preset (small ε, few queries).', 'is-ok');
    } else {
      $('dpbudEpsilonTotal').value = '4.0';
      $('dpbudDelta').value = '0.00001';
      $('dpbudQueries').value = '20';
      $('dpbudPerQuery').value = '0.35';
      $('dpbudSensitivity').value = '1';
      $('dpbudTrueCount').value = '1240';
      setStatus('Applied loose analytics preset (more queries / larger ε).', 'is-ok');
    }
  }

  function clearAll() {
    $('dpbudEpsilonTotal').value = '2.0';
    $('dpbudDelta').value = '0.000001';
    $('dpbudQueries').value = '8';
    $('dpbudPerQuery').value = '0.25';
    $('dpbudSensitivity').value = '1';
    $('dpbudTrueCount').value = '1240';
    lastReport = null;
    $('dpbudEmpty').hidden = false;
    $('dpbudResults').hidden = true;
    $('dpbudExportBtn').disabled = true;
    $('statEpsilon').textContent = '—';
    $('statRemain').textContent = '—';
    $('statUtility').textContent = '—';
    $('statRelease').textContent = '—';
    setStatus('Reset to defaults.');
  }

  function init() {
    $('dpbudPresetStrictBtn').addEventListener('click', function () { applyPreset('strict'); });
    $('dpbudPresetLooseBtn').addEventListener('click', function () { applyPreset('loose'); });
    $('dpbudRunBtn').addEventListener('click', runLab);
    $('dpbudClearBtn').addEventListener('click', clearAll);
    $('dpbudExportBtn').addEventListener('click', function () {
      if (!lastReport) return;
      exportReport(lastReport);
      setStatus('Downloaded dp-budget-report.md', 'is-ok');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
