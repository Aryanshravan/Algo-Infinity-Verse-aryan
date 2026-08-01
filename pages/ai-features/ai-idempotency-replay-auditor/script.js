(function () {
  'use strict';

  var lastReport = null;
  var lastAuditMeta = null;

  
  var DEMO_CLIENT =
    "async function pay(orderId, amount) {\n" +
    "  for (let attempt = 1; attempt <= 5; attempt++) {\n" +
    "    try {\n" +
    "      // BUG: new UUID every retry → server treats each as a new charge\n" +
    "      const key = crypto.randomUUID();\n" +
    "      const res = await fetch('/api/charges', {\n" +
    "        method: 'POST',\n" +
    "        headers: {\n" +
    "          'Content-Type': 'application/json',\n" +
    "          // sometimes omitted on retry path:\n" +
    "          ...(attempt === 1 ? { 'Idempotency-Key': key } : {}),\n" +
    "        },\n" +
    "        body: JSON.stringify({ orderId, amount }),\n" +
    "      });\n" +
    "      if (!res.ok) throw new Error('retry');\n" +
    "      return res.json();\n" +
    "    } catch (e) {\n" +
    "      await sleep(200 * attempt);\n" +
    "    }\n" +
    "  }\n" +
    "}\n";

  var DEMO_SERVER =
    "app.post('/api/charges', async (req, res) => {\n" +
    "  const userId = req.user.id;\n" +
    "  // BUG: scope is only userId — two carts collide\n" +
    "  const idemKey = req.headers['idempotency-key'] || userId;\n" +
    "\n" +
    "  // BUG: check-then-act without lock → concurrent double charge\n" +
    "  const existing = await db.charges.findOne({ userId });\n" +
    "  if (existing) return res.json(existing);\n" +
    "\n" +
    "  const charge = await stripe.charges.create({\n" +
    "    amount: req.body.amount,\n" +
    "    currency: 'usd',\n" +
    "    // no stripe idempotency key passed\n" +
    "  });\n" +
    "  await db.charges.insert({ userId, chargeId: charge.id, amount: req.body.amount });\n" +
    "  res.status(201).json(charge);\n" +
    "});\n";

  var HARDENED_PATCH =
    "// === Client (hardened) ===\n" +
    "async function pay(orderId, amount) {\n" +
    "  // Stable key for the whole retry budget (client-generated once)\n" +
    "  const idempotencyKey = `charge:${orderId}:${amount}`;\n" +
    "  for (let attempt = 1; attempt <= 5; attempt++) {\n" +
    "    const res = await fetch('/api/charges', {\n" +
    "      method: 'POST',\n" +
    "      headers: {\n" +
    "        'Content-Type': 'application/json',\n" +
    "        'Idempotency-Key': idempotencyKey,\n" +
    "      },\n" +
    "      body: JSON.stringify({ orderId, amount }),\n" +
    "    });\n" +
    "    if (res.ok || res.status === 409) return res.json();\n" +
    "    await sleep(200 * 2 ** (attempt - 1));\n" +
    "  }\n" +
    "}\n\n" +
    "// === Server (hardened) ===\n" +
    "app.post('/api/charges', async (req, res) => {\n" +
    "  const key = req.headers['idempotency-key'];\n" +
    "  if (!key) return res.status(400).json({ error: 'Idempotency-Key required' });\n" +
    "\n" +
    "  const scope = `tenant:${req.tenantId}:user:${req.user.id}:charge`;\n" +
    "  const recordKey = `${scope}:${key}`;\n" +
    "  const TTL_SEC = 24 * 60 * 60; // 24h for payment intents\n" +
    "\n" +
    "  const acquired = await redis.set(recordKey + ':lock', '1', 'EX', 30, 'NX');\n" +
    "  if (!acquired) {\n" +
    "    const cached = await waitForResult(recordKey, 5000);\n" +
    "    if (cached) return res.status(200).json(cached);\n" +
    "    return res.status(409).json({ error: 'in_progress' });\n" +
    "  }\n" +
    "\n" +
    "  try {\n" +
    "    const prior = await redis.get(recordKey);\n" +
    "    if (prior) return res.status(200).json(JSON.parse(prior));\n" +
    "\n" +
    "    const charge = await stripe.charges.create(\n" +
    "      { amount: req.body.amount, currency: 'usd' },\n" +
    "      { idempotencyKey: key }\n" +
    "    );\n" +
    "    await redis.set(recordKey, JSON.stringify(charge), 'EX', TTL_SEC);\n" +
    "    await db.charges.insert({ key, userId: req.user.id, chargeId: charge.id });\n" +
    "    return res.status(201).json(charge);\n" +
    "  } finally {\n" +
    "    await redis.del(recordKey + ':lock');\n" +
    "  }\n" +
    "});\n";

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, kind) {
    var el = $('idemStatus');
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

  function analyzeCode(client, server) {
    var findings = [];
    var c = String(client || '');
    var s = String(server || '');
    var combined = c + '\n' + s;

    var clientHasRetry = /\b(for|while)\b[\s\S]{0,120}\b(fetch|axios|request|retry)\b/i.test(c) ||
      /\bretry|attempt\b/i.test(c);
    var clientMentionsKey = /idempotency[-_ ]?key/i.test(c);
    var clientRegenKey = /randomUUID\s*\(|uuidv4\s*\(|nanoid\s*\(/i.test(c) &&
      /(for|while|attempt|retry)/i.test(c);
    var clientOmitsOnRetry = /attempt\s*===\s*1[\s\S]{0,80}Idempotency-Key/i.test(c) ||
      /\.\.\.\s*\([^)]*attempt[^)]*Idempotency-Key/i.test(c);

    if (clientHasRetry && !clientMentionsKey) {
      findings.push({
        severity: 'critical',
        id: 'missing-client-key',
        title: 'Client retries without Idempotency-Key',
        body: 'Retry loop detected but no Idempotency-Key header. Each attempt can create a new side effect (charge, order, email).'
      });
    }
    if (clientRegenKey) {
      findings.push({
        severity: 'critical',
        id: 'regen-key',
        title: 'Idempotency key regenerated per attempt',
        body: 'crypto.randomUUID()/uuid inside the retry loop defeats idempotency — the server sees unique keys and may double-charge.'
      });
    }
    if (clientOmitsOnRetry) {
      findings.push({
        severity: 'high',
        id: 'omit-on-retry',
        title: 'Key only sent on first attempt',
        body: 'Conditional header spread omits Idempotency-Key on retries. Network failures after accept still replay as new requests.'
      });
    }

    var serverReadsKey = /idempotency[-_ ]?key|idemKey|idempotencyKey/i.test(s);
    var serverFallbackUser = /idempotency[-_ ]?key['"]?\s*\|\|\s*(userId|req\.user|customerId)/i.test(s) ||
      /=\s*(userId|req\.user\.id)\s*;?\s*$/im.test(s) && /idem/i.test(s);
    var serverKeyIsUserOnly = /(?:idemKey|idempotencyKey|key)\s*=\s*(userId|req\.user\.id)/i.test(s);
    var checkThenAct = /findOne|findUnique|exists\s*\(/i.test(s) &&
      /(insert|create|charges\.create|stripe\.)/i.test(s) &&
      !/(SET\s+.*NX|setnx|acquireLock|withLock|transaction|serializable)/i.test(s);
    var noStripeIdem = /stripe\.[a-zA-Z]+\.create\s*\(/.test(s) &&
      !/idempotencyKey|idempotency_key/i.test(s);
    var hasTtl = /\bTTL\b|EX\s*,?\s*\d+|expires?(At|In)?|setex/i.test(s);
    var hasLock = /NX\b|setnx|redlock|acquireLock|FOR UPDATE|serializable/i.test(s);

    if (!serverReadsKey && (c || s)) {
      findings.push({
        severity: 'critical',
        id: 'missing-server-key',
        title: 'Server does not read an idempotency key',
        body: 'Handler never inspects Idempotency-Key (or equivalent). Replays always execute the side-effect path.'
      });
    }
    if (serverFallbackUser || serverKeyIsUserOnly) {
      findings.push({
        severity: 'high',
        id: 'scope-user-only',
        title: 'Key scope too coarse (userId)',
        body: 'Falling back to or using only userId as the key collides unrelated operations (two checkouts, refund + charge). Scope must include operation + resource.'
      });
    }
    if (checkThenAct) {
      findings.push({
        severity: 'critical',
        id: 'check-then-act',
        title: 'Check-then-act without lock',
        body: 'find/exists then create/charge without NX lock or serializable transaction — concurrent retries both pass the check and double-write.'
      });
    }
    if (noStripeIdem) {
      findings.push({
        severity: 'high',
        id: 'psp-no-key',
        title: 'Payment provider call lacks idempotency key',
        body: 'stripe.*.create (or similar) without passing the same idempotency key upstream can charge twice even if your DB later dedupes.'
      });
    }
    if (serverReadsKey && !hasTtl) {
      findings.push({
        severity: 'medium',
        id: 'missing-ttl',
        title: 'No TTL on idempotency records',
        body: 'Stored keys without expiry grow unboundedly and can block legitimate retries after crashes. Prefer 24h for payments, 1–24h for POSTs.'
      });
    }
    if (serverReadsKey && !hasLock && !checkThenAct) {
      findings.push({
        severity: 'medium',
        id: 'no-inflight-lock',
        title: 'No in-flight lock detected',
        body: 'Without a short-lived lock (SET NX) concurrent identical keys may both execute before the result is cached.'
      });
    }

    if (!findings.length && (c.trim() || s.trim())) {
      findings.push({
        severity: 'ok',
        id: 'looks-ok',
        title: 'No classic weak-idempotency patterns matched',
        body: 'Heuristics found no missing keys, per-retry UUID regen, user-only scope, or unlocked check-then-act. Still verify with load tests.'
      });
    }

    var score = 0;
    findings.forEach(function (f) {
      if (f.severity === 'critical') score += 28;
      else if (f.severity === 'high') score += 18;
      else if (f.severity === 'medium') score += 10;
    });
    if (/charge|payment|stripe|paypal|billing/i.test(combined)) score += 8;
    if (score > 100) score = 100;
    var band = score < 30 ? 'low' : score < 65 ? 'mid' : 'high';

    var strategy = {
      weakKey: !clientMentionsKey || clientRegenKey || !serverReadsKey || serverFallbackUser || serverKeyIsUserOnly,
      hasLock: hasLock,
      hasTtl: hasTtl,
      paymentSurface: /charge|payment|stripe/i.test(combined)
    };

    return { findings: findings, score: score, band: band, strategy: strategy };
  }

  function recommend(strategy, score) {
    var ttl = strategy.paymentSurface ? '24 hours (payment / money movement)' : '1–24 hours (general POST)';
    var keyDesign =
      'tenantId + userId + operation + natural resource id\n' +
      'Example: `charge:{tenant}:{orderId}:{amountCents}` or opaque ULID minted once client-side.';
    var tips = [
      'Generate the idempotency key once outside the retry loop; send it on every attempt.',
      'Reject requests missing the key for unsafe methods (POST/PUT/PATCH) that create side effects.',
      'Store request hash + response under the key; return the cached response on replay.',
      'Use SET key NX EX ' + (strategy.paymentSurface ? '86400' : '3600') + ' (or DB unique constraint) for atomic claim.',
      'Propagate the same key to Stripe/PSP and message brokers.',
      'Recommended TTL: ' + ttl + '.'
    ];
    return { ttl: ttl, keyDesign: keyDesign, tips: tips, score: score };
  }

  function simulateCollisions(n, strategy) {
    n = Math.max(2, Math.min(50, n | 0));
    var results = [];
    var successCount = 0;
    var collisionCount = 0;
    var duplicateReturn = 0;

    if (strategy.weakKey || !strategy.hasLock) {
      /* Model: unlocked check-then-act — most parallels "succeed" as new charges */
      for (var i = 0; i < n; i++) {
        var roll = Math.random();
        if (i === 0) {
          results.push('success');
          successCount++;
        } else if (!strategy.hasLock && roll < 0.72) {
          results.push('collision');
          collisionCount++;
          successCount++;
        } else if (strategy.weakKey && roll < 0.55) {
          results.push('collision');
          collisionCount++;
          successCount++;
        } else {
          results.push('dup');
          duplicateReturn++;
        }
      }
    } else {
      /* Safe: first wins, others get cached/dup */
      for (var j = 0; j < n; j++) {
        if (j === 0) {
          results.push('success');
          successCount++;
        } else {
          results.push('dup');
          duplicateReturn++;
        }
      }
      /* tiny chance of lock timeout treated as soft collision */
      if (n > 10 && Math.random() < 0.08) {
        results[results.length - 1] = 'collision';
        collisionCount = 1;
        duplicateReturn = Math.max(0, duplicateReturn - 1);
      }
    }

    return {
      n: n,
      results: results,
      successCount: successCount,
      collisionCount: collisionCount,
      duplicateReturn: duplicateReturn,
      doubleChargeRisk: collisionCount > 0
    };
  }

  function renderFindings(findings) {
    var list = $('idemFindingList');
    list.innerHTML = findings.map(function (f) {
      var sev = f.severity === 'ok' ? 'ok' : f.severity;
      return (
        '<li class="idem-finding is-' + sev + '">' +
        '<span class="idem-badge is-' + (f.severity === 'critical' ? 'critical' : f.severity === 'ok' ? 'ok' : '') + '">' +
        escapeHtml(f.severity) + '</span>' +
        '<p class="idem-finding-title">' + escapeHtml(f.title) + '</p>' +
        '<p class="idem-finding-body">' + escapeHtml(f.body) + '</p>' +
        '</li>'
      );
    }).join('');
  }

  function renderSim(sim) {
    var bars = sim.results.map(function (r) {
      var cls = r === 'collision' ? 'is-collision' : r === 'dup' ? 'is-dup' : '';
      return '<span class="idem-sim-bar ' + cls + '" title="' + r + '"></span>';
    }).join('');
    $('idemSimOut').innerHTML =
      '<p><strong>' + sim.n + '</strong> parallel submits → ' +
      '<strong>' + sim.successCount + '</strong> side-effect executions, ' +
      '<strong>' + sim.collisionCount + '</strong> collision(s), ' +
      '<strong>' + sim.duplicateReturn + '</strong> safe duplicate response(s).</p>' +
      '<div class="idem-sim-bars" role="img" aria-label="Per-request simulation outcomes">' + bars + '</div>' +
      '<p class="idem-muted">' +
      (sim.doubleChargeRisk
        ? 'Double-charge risk: YES — concurrent workers both observed “no prior record”.'
        : 'Double-charge risk: NO — lock/key strategy collapsed parallels to one execution.') +
      '</p>';
  }

  function renderRecs(rec) {
    $('idemRecs').innerHTML =
      '<h4>Recommended key design</h4>' +
      '<p><code>' + escapeHtml(rec.keyDesign.split('\n')[0]) + '</code></p>' +
      '<p class="idem-muted">' + escapeHtml(rec.keyDesign.split('\n').slice(1).join(' ')) + '</p>' +
      '<h4 style="margin-top:0.85rem">TTL</h4>' +
      '<p>' + escapeHtml(rec.ttl) + '</p>' +
      '<ul>' + rec.tips.map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('') + '</ul>';
  }

  function updateHero(findingsCount, riskLabel, collisions) {
    $('statFindings').textContent = String(findingsCount);
    $('statRisk').textContent = riskLabel;
    $('statCollisions').textContent = String(collisions);
  }

  function runAudit(alsoSim) {
    var client = $('idemClientCode').value;
    var server = $('idemServerCode').value;
    if (!client.trim() && !server.trim()) {
      setStatus('Paste client and/or server snippets, or load the weak demo.', 'is-error');
      return;
    }

    var analysis = analyzeCode(client, server);
    var rec = recommend(analysis.strategy, analysis.score);
    var n = parseInt($('idemParallelN').value, 10) || 8;
    var sim = alsoSim !== false
      ? simulateCollisions(n, analysis.strategy)
      : (lastReport && lastReport.simulation) || simulateCollisions(n, analysis.strategy);

    var actionable = analysis.findings.filter(function (f) { return f.severity !== 'ok'; });

    lastAuditMeta = analysis;
    lastReport = {
      generatedAt: new Date().toISOString(),
      risk: { score: analysis.score, band: analysis.band },
      findings: analysis.findings,
      recommendations: rec,
      simulation: sim,
      strategyFlags: analysis.strategy
    };

    $('idemEmpty').hidden = true;
    $('idemResults').hidden = false;
    $('idemExportBtn').disabled = false;

    $('idemScoreVal').textContent = String(analysis.score);
    var ring = $('idemScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add('is-' + analysis.band);
    $('idemRiskBlurb').textContent =
      analysis.band === 'high'
        ? 'High replay / double-charge risk — harden keys, locks, and PSP propagation before production traffic.'
        : analysis.band === 'mid'
          ? 'Moderate risk — fix scope/TTL/lock gaps to make retries safe under concurrency.'
          : 'Low risk — keep stable keys and verify with a collision sim under load.';

    renderFindings(analysis.findings);
    renderSim(sim);
    renderRecs(rec);

    $('idemBefore').innerHTML = '<code>' + escapeHtml(
      '// --- client ---\n' + (client.trim() || '(empty)') +
      '\n\n// --- server ---\n' + (server.trim() || '(empty)')
    ) + '</code>';
    $('idemAfter').innerHTML = '<code>' + escapeHtml(HARDENED_PATCH) + '</code>';

    updateHero(actionable.length, analysis.score + '/100', sim.collisionCount);
    setStatus(
      'Audit complete — ' + actionable.length + ' finding(s), risk ' + analysis.score +
      '/100, sim collisions ' + sim.collisionCount + '.',
      'is-ok'
    );
  }

  function loadDemo() {
    $('idemClientCode').value = DEMO_CLIENT;
    $('idemServerCode').value = DEMO_SERVER;
    setStatus('Loaded weak idempotency demo. Click Audit idempotency.', 'is-ok');
  }

  function clearAll() {
    $('idemClientCode').value = '';
    $('idemServerCode').value = '';
    $('idemEmpty').hidden = false;
    $('idemResults').hidden = true;
    $('idemExportBtn').disabled = true;
    $('idemBefore').innerHTML = '<code>Run an audit to capture the original snippets.</code>';
    $('idemAfter').innerHTML = '<code>Hardened client + server patches appear here.</code>';
    lastReport = null;
    lastAuditMeta = null;
    updateHero(0, '—', 0);
    setStatus('');
  }

  function exportReport() {
    if (!lastReport) return;
    var r = lastReport;
    var lines = [];
    lines.push('# Idempotency Replay Audit Report');
    lines.push('Generated: ' + r.generatedAt);
    lines.push('');
    lines.push('## Summary');
    lines.push('- Replay / double-charge risk: ' + r.risk.score + '/100 (' + r.risk.band + ')');
    lines.push('- Simulation N: ' + r.simulation.n);
    lines.push('- Side-effect executions: ' + r.simulation.successCount);
    lines.push('- Collisions: ' + r.simulation.collisionCount);
    lines.push('- Safe duplicate returns: ' + r.simulation.duplicateReturn);
    lines.push('');
    lines.push('## Findings');
    r.findings.forEach(function (f) {
      lines.push('- [' + f.severity + '] ' + f.title + ': ' + f.body);
    });
    lines.push('');
    lines.push('## Key design & TTL');
    lines.push(r.recommendations.keyDesign);
    lines.push('TTL: ' + r.recommendations.ttl);
    r.recommendations.tips.forEach(function (t) { lines.push('- ' + t); });
    lines.push('');
    lines.push('## Hardening patch');
    lines.push('```javascript');
    lines.push(HARDENED_PATCH);
    lines.push('```');
    lines.push('');
    lines.push('## Machine-readable JSON');
    lines.push('```json');
    lines.push(JSON.stringify(r, null, 2));
    lines.push('```');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'idempotency-audit-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Downloaded idempotency-audit-report.md', 'is-ok');
  }

  function bind() {
    $('idemLoadDemoBtn').addEventListener('click', loadDemo);
    $('idemAuditBtn').addEventListener('click', function () { runAudit(true); });
    $('idemSimBtn').addEventListener('click', function () {
      if (!lastAuditMeta) {
        runAudit(true);
        return;
      }
      var n = parseInt($('idemParallelN').value, 10) || 8;
      var sim = simulateCollisions(n, lastAuditMeta.strategy);
      if (lastReport) lastReport.simulation = sim;
      renderSim(sim);
      $('statCollisions').textContent = String(sim.collisionCount);
      setStatus('Collision sim refreshed — ' + sim.collisionCount + ' collision(s) of ' + sim.n + '.', 'is-ok');
    });
    $('idemClearBtn').addEventListener('click', clearAll);
    $('idemExportBtn').addEventListener('click', exportReport);

    var scrollBtn = $('scrollTopBtn');
    if (scrollBtn) {
      window.addEventListener('scroll', function () {
        scrollBtn.classList.toggle('visible', window.scrollY > 400);
      });
      scrollBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
