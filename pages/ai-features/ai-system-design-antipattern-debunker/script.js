(function () {
  'use strict';

  var lastReport = null;

  var DEMO_ANSWER =
    "## URL shortener at 100M QPS\n\n" +
    "Put everything behind one API gateway that also runs the shortener logic.\n" +
    "Use a single MySQL primary for reads and writes — no replicas.\n\n" +
    "Services call each other synchronously over HTTP for every redirect:\n" +
    "gateway → auth → analytics → billing → shortener → DB.\n\n" +
    "We push every click event to an unbounded Kafka topic with no consumer lag alerts,\n" +
    "no DLQ, and infinite retention. Kafka will scale forever so we do not need backpressure.\n\n" +
    "Caching is optional; the DB can handle all traffic.\n";

  var REDESIGN_SKETCH =
    "## Redesign sketch (interview-ready)\n\n" +
    "1. Split read path (redirect) from write path (create).\n" +
    "2. Active-active edge + multi-AZ; remove single gateway SPOF.\n" +
    "3. Primary + read replicas (or partitioned key→URL store) with cache (Redis) on hot keys.\n" +
    "4. Collapse chatty sync hops: redirect should be gateway → cache/DB only.\n" +
    "5. Bounded queues: topic retention + max lag SLO + DLQ + producer backpressure.\n" +
    "6. Treat Kafka as a log with contracts (schema, consumer groups), not magic scale.\n" +
    "7. Call out failure modes: replica lag, cache stampede, partition hot keys.\n";

  var CATALOG = [
    {
      id: 'spof',
      severity: 'critical',
      title: 'Single point of failure (SPOF)',
      re: /\b(single|one)\s+(api\s+)?gateway\b|\bone\s+primary\b|\bno\s+replicas?\b|\bsingle\s+mysql\b|\beverything\s+behind\s+one\b/i,
      body: 'A lone gateway, primary DB, or region-less deployment fails the availability deep-dive. Interviewers expect multi-AZ, failover, and blast-radius limits.',
      fix: 'Add redundancy (multi-AZ, standby/replica, health-checked failover) and state how clients survive partial outages.'
    },
    {
      id: 'chatty',
      severity: 'high',
      title: 'Chatty service mesh on the hot path',
      re: /synchronously|gateway\s*[→->].*[→->]|every\s+redirect|call(s|ing)?\s+each\s+other|hop(s)?\s+for\s+every/i,
      body: 'Long sync call chains amplify latency and cascade failures. Hot paths should minimize network hops.',
      fix: 'Collapse the read path; push non-critical work (analytics, billing) async; use timeouts + circuit breakers where sync remains.'
    },
    {
      id: 'unbounded-queue',
      severity: 'critical',
      title: 'Unbounded queues / no backpressure',
      re: /unbounded|infinite\s+retention|no\s+(consumer\s+)?lag|no\s+dlq|no\s+backpressure|scale\s+forever/i,
      body: 'Infinite buffers hide overload until memory/disk explode. Production designs need bounds, lag SLOs, and load shedding.',
      fix: 'Cap retention/partition size, alert on lag, add DLQ, and apply producer throttling or drop policies under load.'
    },
    {
      id: 'single-db',
      severity: 'high',
      title: 'Single shared database for all load',
      re: /single\s+(mysql|postgres|database|db)\b|one\s+db\b|db\s+can\s+handle\s+all|no\s+replicas|caching\s+is\s+optional/i,
      body: 'One OLTP instance for 100M QPS-style claims is a classic interview red flag. Scaling needs partitioning, caching, or CQRS.',
      fix: 'Introduce read replicas / sharding by key, cache hot mappings, and separate write vs read workloads.'
    },
    {
      id: 'fake-kafka',
      severity: 'medium',
      title: 'Fake Kafka — bus as magic scalability',
      re: /kafka\s+will\s+scale|magic\s+bus|kafka\s+so\s+we\s+do\s+not|just\s+use\s+kafka|kafka\s+forever/i,
      body: 'Naming Kafka without partitions, consumer groups, ordering, or failure modes signals buzzword design.',
      fix: 'Specify topics, keys, consumer groups, exactly-once vs at-least-once, and what happens when consumers stall.'
    }
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
    var el = $('sdapStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function analyze(text) {
    var src = String(text || '');
    var findings = [];
    var suggestions = [];

    CATALOG.forEach(function (item) {
      if (item.re.test(src)) {
        findings.push({
          severity: item.severity,
          id: item.id,
          title: item.title,
          body: item.body
        });
        suggestions.push(item.fix);
      }
    });

    if (!findings.length) {
      findings.push({
        severity: 'ok',
        id: 'clean',
        title: 'No catalog antipatterns matched',
        body: 'Heuristics did not flag SPOF, chatty hops, unbounded queues, single-DB, or fake-Kafka. Still probe capacity math and failure modes manually.'
      });
    }

    var sevRank = { critical: 4, high: 3, medium: 2, ok: 0 };
    var top = 'ok';
    var score = 8;
    findings.forEach(function (f) {
      if ((sevRank[f.severity] || 0) > (sevRank[top] || 0)) top = f.severity;
      if (f.severity === 'critical') score += 24;
      else if (f.severity === 'high') score += 16;
      else if (f.severity === 'medium') score += 10;
    });
    score = Math.min(99, score);

    var interviewLabel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

    return {
      findings: findings,
      suggestions: suggestions,
      topSeverity: top === 'ok' ? 'none' : top,
      interviewRisk: interviewLabel,
      score: score,
      source: src,
      redesign: REDESIGN_SKETCH,
      generatedAt: new Date().toISOString()
    };
  }

  function updateHero(report) {
    $('statPatterns').textContent = String(report.findings.filter(function (f) { return f.severity !== 'ok'; }).length);
    $('statSeverity').textContent = report.topSeverity === 'none' ? '—' : report.topSeverity;
    $('statInterview').textContent = report.interviewRisk;
    $('statFixes').textContent = String(report.suggestions.length);
  }

  function renderReport(report) {
    $('sdapEmpty').hidden = true;
    $('sdapResults').hidden = false;
    $('sdapRewritePanel').hidden = false;

    var blurb = report.score >= 70
      ? 'High interview risk — expect follow-ups on availability and overload.'
      : report.score >= 40
        ? 'Moderate risk — clarify scaling and failure modes before the deep-dive.'
        : 'Low heuristic risk — keep capacity numbers and trade-offs crisp.';

    $('sdapRiskBlurb').textContent = blurb;
    $('sdapScoreVal').textContent = String(report.score);

    var ring = $('sdapScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add(report.score >= 70 ? 'is-high' : report.score >= 40 ? 'is-mid' : 'is-low');

    $('sdapFindingList').innerHTML = report.findings.map(function (f) {
      return '<li class="sdap-finding is-' + escapeHtml(f.severity) + '">' +
        '<span class="sdap-badge is-' + escapeHtml(f.severity) + '">' + escapeHtml(f.severity) + '</span>' +
        '<p class="sdap-finding-title">' + escapeHtml(f.title) + '</p>' +
        '<p class="sdap-finding-body">' + escapeHtml(f.body) + '</p>' +
        '</li>';
    }).join('');

    if (report.suggestions.length) {
      $('sdapSuggestOut').innerHTML =
        '<p>Prioritized redesign moves:</p><ul>' +
        report.suggestions.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join('') +
        '</ul>';
    } else {
      $('sdapSuggestOut').innerHTML = '<p class="sdap-muted">No redesign tips — catalog was clean.</p>';
    }

    $('sdapBefore').innerHTML = '<code>' + escapeHtml(report.source || '(empty)') + '</code>';
    $('sdapAfter').innerHTML = '<code>' + escapeHtml(report.redesign) + '</code>';

    updateHero(report);
    $('sdapExportBtn').disabled = false;
  }

  function exportReport(report) {
    var lines = [];
    lines.push('# System Design Antipattern Critique Report');
    lines.push('Generated: ' + report.generatedAt);
    lines.push('Interview-risk score: ' + report.score + '/100 (' + report.interviewRisk + ')');
    lines.push('Top severity: ' + report.topSeverity);
    lines.push('');
    lines.push('## Catalog findings');
    report.findings.forEach(function (f, i) {
      lines.push((i + 1) + '. [' + f.severity + '] ' + f.title);
      lines.push('   ' + f.body);
    });
    lines.push('');
    lines.push('## Redesign suggestions');
    if (report.suggestions.length) {
      report.suggestions.forEach(function (s, i) {
        lines.push((i + 1) + '. ' + s);
      });
    } else {
      lines.push('(none)');
    }
    lines.push('');
    lines.push('## Before');
    lines.push('```');
    lines.push(report.source);
    lines.push('```');
    lines.push('');
    lines.push('## After (redesign sketch)');
    lines.push('```');
    lines.push(report.redesign);
    lines.push('```');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'system-design-antipattern-critique.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function runAudit() {
    var text = $('sdapAnswerInput').value;
    if (!String(text || '').trim()) {
      setStatus('Paste a system-design answer or load the weak-answer demos.', 'is-error');
      return;
    }
    lastReport = analyze(text);
    renderReport(lastReport);
    setStatus('Critique complete — ' + lastReport.findings.length + ' finding(s), interview risk: ' +
      lastReport.interviewRisk + '.', 'is-ok');
  }

  function clearAll() {
    $('sdapAnswerInput').value = '';
    lastReport = null;
    $('sdapEmpty').hidden = false;
    $('sdapResults').hidden = true;
    $('sdapRewritePanel').hidden = true;
    $('sdapExportBtn').disabled = true;
    $('statPatterns').textContent = '0';
    $('statSeverity').textContent = '—';
    $('statInterview').textContent = '—';
    $('statFixes').textContent = '0';
    setStatus('Cleared.');
  }

  function init() {
    $('sdapLoadDemoBtn').addEventListener('click', function () {
      $('sdapAnswerInput').value = DEMO_ANSWER;
      setStatus('Loaded weak answer covering SPOF, chatty hops, unbounded queues, single DB, fake Kafka.', 'is-ok');
    });
    $('sdapAuditBtn').addEventListener('click', runAudit);
    $('sdapClearBtn').addEventListener('click', clearAll);
    $('sdapExportBtn').addEventListener('click', function () {
      if (!lastReport) return;
      exportReport(lastReport);
      setStatus('Downloaded system-design-antipattern-critique.md', 'is-ok');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
