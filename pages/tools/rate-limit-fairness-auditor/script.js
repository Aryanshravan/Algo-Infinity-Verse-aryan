/**
 * Rate Limit Fairness Auditor
 * Deterministic algorithm / keying / bypass simulation lab.
 */
(function () {
  'use strict';

  var ALGO_HINTS = {
    'fixed-window': 'Fixed windows are cheap but allow boundary bursts near window edges.',
    'sliding-window': 'Sliding windows smooth boundary bursts at the cost of more state.',
    'token-bucket': 'Token buckets absorb short bursts via capacity while enforcing average rate.',
  };

  var SIM_HINTS = {
    burst: 'Burst: clients slam the limit at the start of a window.',
    multikey: 'Multi-key: attacker fans out across user/route keys to multiply quota.',
    rotate: 'IP rotation: attacker cycles source IPs to reset IP-only counters.',
    legit: 'Shared NAT: many legitimate users share one egress IP (false-block risk).',
  };

  var state = {
    sims: {},
    analyzed: false,
    lastResult: null,
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

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function getAlgo() {
    var el = document.querySelector('input[name="rlimAlgo"]:checked');
    return el ? el.value : 'fixed-window';
  }

  function getKeying() {
    var el = document.querySelector('input[name="rlimKeying"]:checked');
    return el ? el.value : 'ip';
  }

  function selectedSims() {
    return Object.keys(state.sims).filter(function (k) {
      return state.sims[k];
    });
  }

  function readConfig() {
    return {
      algo: getAlgo(),
      keying: getKeying(),
      limit: clamp(Number($('limitRps').value) || 100, 1, 10000),
      windowSec: clamp(Number($('windowSec').value) || 60, 1, 3600),
      burst: clamp(Number($('burstAllow').value) || 0, 0, 5000),
      refill: clamp(Number($('refillRate').value) || 1.5, 0.1, 1000),
      clients: clamp(Number($('clientCount').value) || 40, 1, 500),
      reqPerClient: clamp(Number($('reqPerClient').value) || 30, 1, 500),
      sims: selectedSims(),
    };
  }

  /* ---- Deterministic limiters ---- */

  function FixedWindowLimiter(limit, windowSec, burst) {
    this.limit = limit + burst;
    this.windowSec = windowSec;
    this.buckets = {};
  }

  FixedWindowLimiter.prototype.allow = function (key, t) {
    var w = Math.floor(t / this.windowSec);
    var bk = key + '|' + w;
    if (!this.buckets[bk]) this.buckets[bk] = 0;
    if (this.buckets[bk] >= this.limit) return false;
    this.buckets[bk] += 1;
    return true;
  };

  function SlidingWindowLimiter(limit, windowSec, burst) {
    this.limit = limit + burst;
    this.windowSec = windowSec;
    this.events = {};
  }

  SlidingWindowLimiter.prototype.allow = function (key, t) {
    if (!this.events[key]) this.events[key] = [];
    var arr = this.events[key];
    var cutoff = t - this.windowSec;
    while (arr.length && arr[0] < cutoff) arr.shift();
    if (arr.length >= this.limit) return false;
    arr.push(t);
    return true;
  };

  function TokenBucketLimiter(capacity, refillPerSec) {
    this.capacity = capacity;
    this.refill = refillPerSec;
    this.state = {};
  }

  TokenBucketLimiter.prototype.allow = function (key, t) {
    var s = this.state[key];
    if (!s) {
      s = { tokens: this.capacity, last: t };
      this.state[key] = s;
    }
    var elapsed = Math.max(0, t - s.last);
    s.tokens = Math.min(this.capacity, s.tokens + elapsed * this.refill);
    s.last = t;
    if (s.tokens < 1) return false;
    s.tokens -= 1;
    return true;
  };

  function createLimiter(cfg) {
    if (cfg.algo === 'sliding-window') {
      return new SlidingWindowLimiter(cfg.limit, cfg.windowSec, cfg.burst);
    }
    if (cfg.algo === 'token-bucket') {
      var cap = cfg.limit + cfg.burst;
      return new TokenBucketLimiter(cap, cfg.refill);
    }
    return new FixedWindowLimiter(cfg.limit, cfg.windowSec, cfg.burst);
  }

  function makeKey(cfg, client) {
    if (cfg.keying === 'user-route-ip') {
      return client.user + '|' + client.route + '|' + client.ip;
    }
    return client.ip;
  }

  function buildClients(cfg) {
    var sims = cfg.sims;
    var list = [];
    var i;
    var hasRotate = sims.indexOf('rotate') !== -1;
    var hasMultikey = sims.indexOf('multikey') !== -1;
    var hasLegit = sims.indexOf('legit') !== -1;
    var hasBurst = sims.indexOf('burst') !== -1;

    for (i = 0; i < cfg.clients; i++) {
      var isAttacker = hasRotate || hasMultikey ? i % 5 === 0 : false;
      var ip = hasLegit && !isAttacker
        ? '203.0.113.10'
        : hasRotate && isAttacker
          ? '198.51.100.' + ((i % 40) + 1)
          : '203.0.113.' + ((i % 50) + 20);

      list.push({
        id: i,
        ip: ip,
        user: hasMultikey && isAttacker ? 'atk_' + i : 'user_' + (i % 12),
        route: hasMultikey && isAttacker ? '/api/v' + (i % 8) : '/api/resource',
        role: isAttacker ? 'attacker' : hasLegit && ip === '203.0.113.10' ? 'nat-user' : 'legit',
        bursty: hasBurst && (isAttacker || i % 3 === 0),
      });
    }
    return list;
  }

  function scheduleRequests(cfg, clients) {
    var events = [];
    var c;
    var r;
    for (c = 0; c < clients.length; c++) {
      var client = clients[c];
      for (r = 0; r < cfg.reqPerClient; r++) {
        var t;
        if (client.bursty) {
          // Cluster near window boundary for fixed-window pain, or t=0 for burst
          t = r < Math.ceil(cfg.reqPerClient * 0.7)
            ? r * 0.02
            : cfg.windowSec - 0.5 + r * 0.01;
        } else {
          t = (r / cfg.reqPerClient) * cfg.windowSec * 1.4 + (c % 7) * 0.3;
        }
        if (client.role === 'attacker' && cfg.sims.indexOf('rotate') !== -1 && r % 4 === 0) {
          client = Object.assign({}, client, {
            ip: '198.51.100.' + (((c + r) % 40) + 1),
          });
        }
        events.push({ t: t, client: client });
      }
    }
    events.sort(function (a, b) {
      return a.t - b.t;
    });
    return events;
  }

  function runAudit() {
    var cfg = readConfig();
    if (!cfg.sims.length) {
      cfg.sims = ['burst'];
      state.sims.burst = true;
      var btn = document.querySelector('.rlim-sim-btn[data-sim="burst"]');
      if (btn) btn.setAttribute('aria-pressed', 'true');
    }

    var limiter = createLimiter(cfg);
    var clients = buildClients(cfg);
    var events = scheduleRequests(cfg, clients);

    var allowed = 0;
    var blocked = 0;
    var falseAllow = 0;
    var falseBlock = 0;
    var attackerAllowed = 0;
    var attackerTotal = 0;
    var legitBlocked = 0;
    var legitTotal = 0;
    var natBlocked = 0;
    var natTotal = 0;
    var log = [];
    var maxLog = 40;

    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      var key = makeKey(cfg, ev.client);
      var ok = limiter.allow(key, ev.t);
      var role = ev.client.role;

      if (ok) allowed += 1;
      else blocked += 1;

      if (role === 'attacker') {
        attackerTotal += 1;
        if (ok) {
          attackerAllowed += 1;
          falseAllow += 1;
        }
      } else if (role === 'nat-user') {
        natTotal += 1;
        legitTotal += 1;
        if (!ok) {
          natBlocked += 1;
          legitBlocked += 1;
          falseBlock += 1;
        }
      } else {
        legitTotal += 1;
        if (!ok) {
          legitBlocked += 1;
          falseBlock += 1;
        }
      }

      if (log.length < maxLog && (i % Math.max(1, Math.floor(events.length / maxLog)) === 0 || !ok)) {
        log.push(
          't=' +
            round1(ev.t) +
            's  ' +
            (ok ? 'ALLOW' : 'BLOCK') +
            '  key=' +
            key +
            '  role=' +
            role
        );
      }
    }

    var total = events.length || 1;
    var falseAllowRate = round1((falseAllow / total) * 100);
    var falseBlockRate = round1((falseBlock / total) * 100);

    // Fairness: high when legit traffic is served and attackers are constrained
    var attackerBlockRate = attackerTotal
      ? (attackerTotal - attackerAllowed) / attackerTotal
      : 1;
    var legitServeRate = legitTotal ? (legitTotal - legitBlocked) / legitTotal : 1;
    var algoBonus =
      cfg.algo === 'sliding-window' ? 6 : cfg.algo === 'token-bucket' ? 4 : 0;
    var keyingBonus = cfg.keying === 'user-route-ip' && cfg.sims.indexOf('legit') !== -1 ? 8 : 0;
    var keyingPenalty =
      cfg.keying === 'ip' &&
      (cfg.sims.indexOf('rotate') !== -1 || cfg.sims.indexOf('legit') !== -1)
        ? 12
        : 0;
    var burstPenalty =
      cfg.algo === 'fixed-window' && cfg.sims.indexOf('burst') !== -1 ? 10 : 0;

    var fairness = clamp(
      Math.round(
        legitServeRate * 55 +
          attackerBlockRate * 35 +
          algoBonus +
          keyingBonus -
          keyingPenalty -
          burstPenalty -
          falseAllowRate * 0.35 -
          falseBlockRate * 0.4
      ),
      0,
      100
    );

    var bypassRisk = clamp(
      Math.round(
        (cfg.sims.indexOf('rotate') !== -1 && cfg.keying === 'ip' ? 40 : 0) +
          (cfg.sims.indexOf('multikey') !== -1 && cfg.keying === 'user-route-ip' ? 35 : 10) +
          (cfg.sims.indexOf('burst') !== -1 && cfg.algo === 'fixed-window' ? 25 : 5) +
          falseAllowRate * 0.8
      ),
      0,
      100
    );

    var result = {
      cfg: cfg,
      total: total,
      allowed: allowed,
      blocked: blocked,
      falseAllow: falseAllow,
      falseBlock: falseBlock,
      falseAllowRate: falseAllowRate,
      falseBlockRate: falseBlockRate,
      fairness: fairness,
      bypassRisk: bypassRisk,
      attackerAllowed: attackerAllowed,
      attackerTotal: attackerTotal,
      natBlocked: natBlocked,
      natTotal: natTotal,
      log: log,
      tips: buildTips(cfg, fairness, falseAllowRate, falseBlockRate, bypassRisk),
      recs: buildRecs(cfg, fairness, falseAllowRate, falseBlockRate, bypassRisk),
    };

    state.lastResult = result;
    state.analyzed = true;
    renderAll();
  }

  function buildTips(cfg, fairness, fa, fb, bypass) {
    var tips = [];
    var suggestedBurst = Math.max(5, Math.round(cfg.limit * 0.15));
    var suggestedCap = cfg.limit + suggestedBurst;

    if (cfg.burst > cfg.limit * 0.5) {
      tips.push(
        'Burst allowance (' +
          cfg.burst +
          ') is >50% of limit — attackers can front-load quota; try ~' +
          suggestedBurst +
          '.'
      );
    } else if (cfg.burst < Math.max(3, cfg.limit * 0.05)) {
      tips.push(
        'Burst is very tight (' +
          cfg.burst +
          '). Legitimate UI bursts may false-block; consider ~' +
          suggestedBurst +
          '.'
      );
    } else {
      tips.push(
        'Burst allowance looks balanced relative to limit. Keep capacity near ' +
          suggestedCap +
          ' for token-bucket style limits.'
      );
    }

    if (cfg.algo === 'token-bucket') {
      tips.push(
        'Refill ' +
          cfg.refill +
          '/s ≈ ' +
          round1(cfg.refill * cfg.windowSec) +
          ' tokens per window. Align refill × window with your advertised limit.'
      );
    }

    if (cfg.algo === 'fixed-window' && cfg.sims.indexOf('burst') !== -1) {
      tips.push(
        'Fixed-window + burst traffic: prefer sliding-window or add jittered admission at window edges.'
      );
    }

    if (fb > 8) {
      tips.push(
        'False-block rate ' +
          fb +
          '% — raise burst slightly or switch keying from IP-only if NAT sharing is common.'
      );
    }

    if (bypass > 50) {
      tips.push(
        'Bypass risk is elevated. Composite keys and device/session binding reduce IP-rotation abuse.'
      );
    }

    if (!tips.length) {
      tips.push('No urgent burst tuning issues detected for this run.');
    }
    return tips;
  }

  function buildRecs(cfg, fairness, fa, fb, bypass) {
    var recs = [];

    if (cfg.keying === 'ip') {
      recs.push(
        'Prefer user+route+IP (or API key + route) for authenticated APIs to avoid shared-NAT false blocks and IP-rotation bypass.'
      );
    } else {
      recs.push(
        'Composite keying is enabled — monitor cardinality and apply hierarchical limits (global IP + per-user).'
      );
    }

    if (cfg.algo === 'fixed-window') {
      recs.push(
        'Migrate high-value endpoints to sliding-window or token-bucket to reduce boundary double-spend.'
      );
    } else if (cfg.algo === 'sliding-window') {
      recs.push(
        'Sliding window selected — ensure store supports efficient range queries or approximate counters at scale.'
      );
    } else {
      recs.push(
        'Token bucket selected — expose Retry-After based on deficit and document burst capacity clearly.'
      );
    }

    if (cfg.sims.indexOf('multikey') !== -1) {
      recs.push(
        'Against multi-key fan-out: add a coarse IP / ASN quota on top of fine-grained keys.'
      );
    }

    if (cfg.sims.indexOf('rotate') !== -1 && cfg.keying === 'ip') {
      recs.push(
        'IP rotation defeated IP-only limits in this sim — require auth, cookies, or proof-of-work for sensitive routes.'
      );
    }

    if (fairness < 60) {
      recs.push(
        'Fairness score is low (' +
          fairness +
          '). Re-run with sliding-window + composite keys and a modest burst (~15% of limit).'
      );
    } else {
      recs.push(
        'Fairness score ' +
          fairness +
          ' — document the policy (limit, window, burst) in API docs and return consistent 429 bodies.'
      );
    }

    if (fa > 5) {
      recs.push(
        'False-allow ' +
          fa +
          '% — tighten burst, shorten window, or add secondary anomaly detection for attacker roles.'
      );
    }

    recs.push(
      'Export this audit with your gateway config (nginx, Envoy, API gateway) for peer review before production changes.'
    );

    return recs;
  }

  function scoreClass(val, invert) {
    if (invert) {
      if (val <= 10) return 'ok';
      if (val <= 25) return 'warn';
      return 'danger';
    }
    if (val >= 75) return 'ok';
    if (val >= 50) return 'warn';
    return 'danger';
  }

  function renderStats() {
    var r = state.lastResult;
    if (!r) {
      $('statFairness').textContent = '—';
      $('statFalseAllow').textContent = '—';
      $('statFalseBlock').textContent = '—';
      $('statBypass').textContent = '—';
      return;
    }
    $('statFairness').textContent = r.fairness + '%';
    $('statFalseAllow').textContent = r.falseAllowRate + '%';
    $('statFalseBlock').textContent = r.falseBlockRate + '%';
    $('statBypass').textContent = r.bypassRisk + '%';
  }

  function renderScores() {
    var el = $('scoreCards');
    var r = state.lastResult;
    if (!r) {
      el.innerHTML =
        '<p class="rlim-empty">Run an audit to see fairness and false-positive/negative scores.</p>';
      $('fairnessFill').style.width = '0%';
      $('fairnessMeter').setAttribute('aria-valuenow', '0');
      return;
    }

    var cards = [
      {
        title: 'Fairness score',
        desc: 'Legit serve rate vs attacker containment',
        val: r.fairness + '%',
        cls: scoreClass(r.fairness, false),
      },
      {
        title: 'False allow',
        desc: r.falseAllow + ' attacker requests admitted',
        val: r.falseAllowRate + '%',
        cls: scoreClass(r.falseAllowRate, true),
      },
      {
        title: 'False block',
        desc: r.falseBlock + ' legit/NAT requests denied',
        val: r.falseBlockRate + '%',
        cls: scoreClass(r.falseBlockRate, true),
      },
      {
        title: 'Bypass risk',
        desc: 'Composite of keying, algo, and sims',
        val: r.bypassRisk + '%',
        cls: scoreClass(r.bypassRisk, true),
      },
      {
        title: 'Throughput',
        desc: 'Allowed / blocked of ' + r.total + ' requests',
        val: r.allowed + ' / ' + r.blocked,
        cls: 'ok',
      },
    ];

    el.innerHTML = cards
      .map(function (c) {
        return (
          '<div class="rlim-score-card">' +
          '<div><strong>' +
          escapeHtml(c.title) +
          '</strong><span>' +
          escapeHtml(c.desc) +
          '</span></div>' +
          '<div class="rlim-score-val ' +
          c.cls +
          '">' +
          escapeHtml(String(c.val)) +
          '</div></div>'
        );
      })
      .join('');

    $('fairnessFill').style.width = r.fairness + '%';
    $('fairnessMeter').setAttribute('aria-valuenow', String(r.fairness));
  }

  function renderLog() {
    var r = state.lastResult;
    $('decisionLog').textContent = r
      ? r.log.join('\n')
      : 'Awaiting simulation…';
  }

  function renderList(id, items, emptyText) {
    var el = $(id);
    if (!items || !items.length) {
      el.innerHTML = '<li class="rlim-empty-li">' + escapeHtml(emptyText) + '</li>';
      return;
    }
    el.innerHTML = items
      .map(function (t) {
        return '<li>' + escapeHtml(t) + '</li>';
      })
      .join('');
  }

  function renderAll() {
    renderStats();
    renderScores();
    renderLog();
    var r = state.lastResult;
    renderList('tuningTips', r && r.tips, 'Tuning tips appear after an audit.');
    renderList(
      'recommendationsList',
      r && r.recs,
      'Recommendations appear after an audit.'
    );
    $('exportBtn').disabled = !state.analyzed;
    if (r) {
      $('auditStatus').textContent =
        'Audit complete · ' +
        r.cfg.algo +
        ' · fairness ' +
        r.fairness +
        '% · bypass risk ' +
        r.bypassRisk +
        '%';
    }
  }

  function exportReport() {
    var r = state.lastResult;
    if (!r) return;
    var c = r.cfg;
    var lines = [
      'Algo Infinity Verse — Rate Limit Fairness Audit Report',
      'Generated: ' + new Date().toISOString(),
      '',
      '== Configuration ==',
      'Algorithm: ' + c.algo,
      'Keying: ' + c.keying,
      'Limit: ' + c.limit + ' / ' + c.windowSec + 's',
      'Burst allowance: ' + c.burst,
      'Token refill/sec: ' + c.refill,
      'Clients: ' + c.clients + ' × ' + c.reqPerClient + ' requests',
      'Simulations: ' + (c.sims.join(', ') || 'none'),
      '',
      '== Scores ==',
      'Fairness: ' + r.fairness + '%',
      'False allow: ' + r.falseAllowRate + '% (' + r.falseAllow + ' req)',
      'False block: ' + r.falseBlockRate + '% (' + r.falseBlock + ' req)',
      'Bypass risk: ' + r.bypassRisk + '%',
      'Allowed / blocked: ' + r.allowed + ' / ' + r.blocked + ' of ' + r.total,
      '',
      '== Burst tuning tips ==',
    ];
    r.tips.forEach(function (t, i) {
      lines.push(i + 1 + '. ' + t);
    });
    lines.push('', '== Recommendations ==');
    r.recs.forEach(function (t, i) {
      lines.push(i + 1 + '. ' + t);
    });
    lines.push('', '== Sample decision log ==');
    lines = lines.concat(r.log);
    lines.push('', '— End of report —');

    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'rate-limit-fairness-audit.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function updateAlgoHint() {
    var algo = getAlgo();
    $('algoHint').textContent = ALGO_HINTS[algo] || '';
  }

  function updateSimHint() {
    var sims = selectedSims();
    if (!sims.length) {
      $('simHint').textContent =
        'Select one or more attack/load profiles, then run the audit.';
      return;
    }
    $('simHint').textContent = sims
      .map(function (s) {
        return SIM_HINTS[s] || s;
      })
      .join(' ');
  }

  function bind() {
    document.querySelectorAll('input[name="rlimAlgo"]').forEach(function (el) {
      el.addEventListener('change', updateAlgoHint);
    });

    document.querySelectorAll('.rlim-sim-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sim = btn.getAttribute('data-sim');
        var next = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', next ? 'true' : 'false');
        state.sims[sim] = next;
        updateSimHint();
      });
    });

    $('runAuditBtn').addEventListener('click', runAudit);
    $('clearSimsBtn').addEventListener('click', function () {
      state.sims = {};
      document.querySelectorAll('.rlim-sim-btn').forEach(function (btn) {
        btn.setAttribute('aria-pressed', 'false');
      });
      updateSimHint();
    });
    $('exportBtn').addEventListener('click', exportReport);

    updateAlgoHint();
    updateSimHint();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
