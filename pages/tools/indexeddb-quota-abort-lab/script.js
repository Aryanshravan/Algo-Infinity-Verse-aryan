/**
 * IndexedDB Quota Abort Lab
 * Store budgets, write bursts, quota/abort/versionchange races, recovery report.
 */
(function () {
  'use strict';

  var lastReport = null;

  var PRESETS = {
    lesson: { budget: 40, used: 22, burst: 80, payload: 16 },
    quiz: { budget: 30, used: 18, burst: 120, payload: 8 },
    offline: { budget: 100, used: 72, burst: 500, payload: 48 },
    media: { budget: 250, used: 180, burst: 40, payload: 512 }
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

  function setStatus(msg, kind) {
    var el = $('idbStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function num(id, fallback) {
    var v = Number($(id).value);
    return isFinite(v) ? v : fallback;
  }

  function applyPreset() {
    var key = $('writePreset').value;
    if (key === 'custom' || !PRESETS[key]) {
      setStatus('Custom mode — edit fields manually.', 'is-ok');
      return;
    }
    var p = PRESETS[key];
    $('storeBudget').value = String(p.budget);
    $('usedMb').value = String(p.used);
    $('burstCount').value = String(p.burst);
    $('avgPayload').value = String(p.payload);
    setStatus('Applied “' + key + '” progress-store write preset.', 'is-ok');
  }

  function estimateBurstMb() {
    var burst = num('burstCount', 0);
    var kb = num('avgPayload', 0);
    return (burst * kb) / 1024;
  }

  function simulateBurstOnly() {
    var budget = num('storeBudget', 50);
    var used = num('usedMb', 0);
    var need = estimateBurstMb();
    var headroom = budget - used;
    var timeline = [];
    timeline.push('Burst request ≈ ' + need.toFixed(2) + ' MB against ' + headroom.toFixed(2) + ' MB headroom.');
    var quotaHits = 0;
    var risk = 10;

    if (need > headroom) {
      quotaHits = 1;
      risk = Math.min(95, 55 + ((need - headroom) / Math.max(budget, 1)) * 100);
      timeline.push('Would exceed budget mid-burst → QuotaExceededError likely.');
      setStatus('Burst exceeds remaining quota.', 'is-error');
    } else {
      risk = Math.min(40, (need / Math.max(headroom, 0.01)) * 35);
      timeline.push('Burst fits in budget if the transaction completes uninterrupted.');
      setStatus('Burst fits under current budget (no injected races).', 'is-ok');
    }

    renderResults({
      risk: Math.round(risk),
      quotaHits: quotaHits,
      aborts: 0,
      recovery: quotaHits ? 'Evict + retry' : 'Monitor',
      timeline: timeline,
      recommendations: buildRecovery({
        quota: quotaHits > 0,
        abort: false,
        version: false,
        partial: false,
        risk: risk
      }),
      config: snapshotConfig()
    });
  }

  function snapshotConfig() {
    return {
      budgetMb: num('storeBudget', 50),
      usedMb: num('usedMb', 0),
      burst: num('burstCount', 0),
      payloadKb: num('avgPayload', 0),
      preset: $('writePreset').value,
      failAtPct: Number($('failAtPct').value) || 60,
      injQuota: $('injQuota').checked,
      injAbort: $('injAbort').checked,
      injVersion: $('injVersion').checked,
      injPartial: $('injPartial').checked
    };
  }

  function buildRecovery(flags) {
    var recs = [];
    if (flags.quota) {
      recs.push('Catch QuotaExceededError; evict LRU / completed caches; retry with smaller chunks.');
      recs.push('Prefer estimate + persist() awareness; degrade non-critical stores first.');
    }
    if (flags.abort) {
      recs.push('Treat AbortError as retryable with idempotent writes (same primary keys / revision).');
      recs.push('Avoid long-lived transactions; keep put batches short to reduce abort windows.');
    }
    if (flags.version) {
      recs.push('On versionchange, close the DB promptly; queue writes until reopen at new version.');
      recs.push('Never start a write tx while an upgrade is pending without a blocked handler.');
    }
    if (flags.partial) {
      recs.push('Assume partial visibility: use per-record revisions or a write-ahead outbox store.');
      recs.push('Reconcile with a checksum / watermark after failed bursts.');
    }
    if (flags.risk >= 70) {
      recs.push('High loss risk: dual-write critical progress to a small durable store + server sync.');
    } else if (!recs.length) {
      recs.push('Keep monitoring headroom; add structured error handlers before shipping offline mode.');
    }
    return recs;
  }

  function runScenario() {
    var cfg = snapshotConfig();
    var need = estimateBurstMb();
    var headroom = cfg.budgetMb - cfg.usedMb;
    var failAt = Math.round(cfg.burst * (cfg.failAtPct / 100));
    var timeline = [];
    var quotaHits = 0;
    var aborts = 0;
    var risk = 15;

    timeline.push('Open readwrite transaction on progress store (budget ' + cfg.budgetMb + ' MB, used ' + cfg.usedMb + ' MB).');
    timeline.push('Enqueue burst of ' + cfg.burst + ' puts (~' + need.toFixed(2) + ' MB).');

    if (cfg.injPartial) {
      timeline.push('Ops 1…' + failAt + ' appear committed from the app’s perspective (cursors / in-memory cache).');
      risk += 18;
    } else {
      timeline.push('Holding all puts until transaction complete (atomic batch).');
    }

    var failed = false;
    if (cfg.injQuota || need > headroom) {
      quotaHits = 1;
      failed = true;
      risk += 30;
      if (need > headroom) risk += 15;
      timeline.push('At ~' + cfg.failAtPct + '%: QuotaExceededError — transaction aborts.');
    }
    if (cfg.injAbort) {
      aborts = 1;
      failed = true;
      risk += 22;
      timeline.push('AbortError: transaction aborted (blocked upgrade, explicit abort, or browser thrash).');
    }
    if (cfg.injVersion) {
      failed = true;
      risk += 20;
      aborts += 1;
      timeline.push('versionchange fired on open connection — pending upgrade races with in-flight writes.');
    }

    if (!failed) {
      timeline.push('Transaction completed successfully; headroom remaining ≈ ' + (headroom - need).toFixed(2) + ' MB.');
      risk = Math.max(5, Math.min(35, (need / Math.max(headroom, 0.01)) * 30));
      setStatus('Scenario completed without injected failures.', 'is-ok');
    } else {
      if (cfg.injPartial) {
        timeline.push('DATA-LOSS RISK: UI may show ' + failAt + ' writes that never durably landed.');
        risk += 12;
      } else {
        timeline.push('Atomic abort: none of the burst should be durable (verify with getAll after reopen).');
      }
      setStatus('Scenario produced failure paths — review recovery guidance.', 'is-error');
    }

    risk = Math.max(0, Math.min(100, Math.round(risk)));
    var recoveryLabel = risk >= 70 ? 'Critical' : risk >= 40 ? 'Harden' : 'Watch';

    renderResults({
      risk: risk,
      quotaHits: quotaHits,
      aborts: aborts,
      recovery: recoveryLabel,
      timeline: timeline,
      recommendations: buildRecovery({
        quota: cfg.injQuota || need > headroom,
        abort: cfg.injAbort || cfg.injVersion,
        version: cfg.injVersion,
        partial: cfg.injPartial && failed,
        risk: risk
      }),
      config: cfg,
      failed: failed,
      failAt: failAt,
      needMb: need
    });
  }

  function renderResults(report) {
    lastReport = report;
    $('exportBtn').disabled = false;
    $('analysisStatus').textContent = 'Updated';

    $('statRisk').textContent = report.risk + '%';
    $('statQuota').textContent = String(report.quotaHits);
    $('statAborts').textContent = String(report.aborts);
    $('statRecovery').textContent = report.recovery;

    $('riskScoreVal').textContent = String(report.risk);
    var ring = $('riskRing');
    ring.classList.remove('is-high', 'is-mid', 'is-low');
    if (report.risk >= 70) ring.classList.add('is-high');
    else if (report.risk >= 40) ring.classList.add('is-mid');
    else ring.classList.add('is-low');

    $('riskHeading').textContent = 'Risk score';
    $('riskBlurb').textContent = report.risk >= 70
      ? 'High probability of silent progress loss under these faults.'
      : report.risk >= 40
        ? 'Moderate risk — add idempotent retries and eviction before launch.'
        : 'Lower risk under this configuration; keep handlers wired.';

    $('timelineOut').innerHTML = report.timeline.map(function (line) {
      return '<li>' + escapeHtml(line) + '</li>';
    }).join('');

    var tags = [];
    if (report.quotaHits) tags.push('<span class="idb-tag idb-tag-bad">Quota</span>');
    if (report.aborts) tags.push('<span class="idb-tag idb-tag-warn">Abort</span>');
    if (report.risk < 40) tags.push('<span class="idb-tag idb-tag-ok">Recoverable</span>');

    $('recoveryOut').innerHTML =
      '<p>' + tags.join(' ') + '</p>' +
      '<ul>' + report.recommendations.map(function (r) {
        return '<li>' + escapeHtml(r) + '</li>';
      }).join('') + '</ul>';
  }

  function clearAll() {
    lastReport = null;
    $('exportBtn').disabled = true;
    $('writePreset').value = 'custom';
    $('storeBudget').value = '50';
    $('usedMb').value = '38';
    $('burstCount').value = '200';
    $('avgPayload').value = '64';
    $('injQuota').checked = true;
    $('injAbort').checked = false;
    $('injVersion').checked = false;
    $('injPartial').checked = true;
    $('failAtPct').value = '60';
    $('failAtLabel').textContent = '60%';
    $('statRisk').textContent = '—';
    $('statQuota').textContent = '—';
    $('statAborts').textContent = '—';
    $('statRecovery').textContent = '—';
    $('riskScoreVal').textContent = '—';
    $('riskRing').classList.remove('is-high', 'is-mid', 'is-low');
    $('riskBlurb').textContent = 'Run a scenario to estimate loss probability.';
    $('timelineOut').innerHTML = '<li class="idb-empty-li">Scenario timeline appears here.</li>';
    $('recoveryOut').innerHTML = '<p class="idb-empty">Recovery guidance appears after a scenario run.</p>';
    $('analysisStatus').textContent = 'Ready';
    setStatus('');
  }

  function exportReport() {
    if (!lastReport) return;
    var c = lastReport.config || {};
    var lines = [
      '# IndexedDB Reliability Report',
      '',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Configuration',
      '- Store budget: ' + c.budgetMb + ' MB',
      '- Current usage: ' + c.usedMb + ' MB',
      '- Burst: ' + c.burst + ' ops × ' + c.payloadKb + ' KB',
      '- Preset: ' + c.preset,
      '- Fail after: ' + c.failAtPct + '%',
      '- Injections: quota=' + !!c.injQuota + ', abort=' + !!c.injAbort +
        ', versionchange=' + !!c.injVersion + ', partial=' + !!c.injPartial,
      '',
      '## Scores',
      '- Data-loss risk: ' + lastReport.risk + '%',
      '- Quota hits: ' + lastReport.quotaHits,
      '- Aborts: ' + lastReport.aborts,
      '- Recovery posture: ' + lastReport.recovery,
      '',
      '## Timeline',
      lastReport.timeline.map(function (t) { return '- ' + t; }).join('\n'),
      '',
      '## Recovery recommendations',
      lastReport.recommendations.map(function (r) { return '- ' + r; }).join('\n'),
      ''
    ];
    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'indexeddb-reliability-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Exported indexeddb-reliability-report.md', 'is-ok');
  }

  function init() {
    $('failAtPct').addEventListener('input', function () {
      $('failAtLabel').textContent = $('failAtPct').value + '%';
    });
    $('applyPresetBtn').addEventListener('click', applyPreset);
    $('runBurstBtn').addEventListener('click', simulateBurstOnly);
    $('runScenarioBtn').addEventListener('click', runScenario);
    $('clearBtn').addEventListener('click', clearAll);
    $('exportBtn').addEventListener('click', exportReport);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
