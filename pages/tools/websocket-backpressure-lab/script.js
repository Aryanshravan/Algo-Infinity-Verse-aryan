/**
 * WebSocket Backpressure Lab
 * Deterministic heartbeat / buffer / reconnect-storm simulator.
 */
(function () {
  'use strict';

  var SCENARIO_HINTS = {
    stall: 'Stall: peer stops reading — outbound buffer climbs until backpressure or close.',
    flood: 'Flood: client emits messages faster than the peer can drain.',
    'half-open': 'Half-open: TCP looks up but heartbeats never return — timeout must reclaim.',
  };

  var state = {
    scenario: null,
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

  function readConfig() {
    return {
      heartbeatMs: clamp(Number($('heartbeatMs').value) || 15000, 500, 120000),
      timeoutMs: clamp(Number($('heartbeatTimeoutMs').value) || 45000, 1000, 180000),
      bufferLimitKb: clamp(Number($('bufferLimitKb').value) || 512, 8, 65536),
      serverBufKb: clamp(Number($('serverBufKb').value) || 1024, 8, 65536),
      maxMsgKb: clamp(Number($('maxMsgKb').value) || 64, 1, 8192),
      reconnectBaseMs: clamp(Number($('reconnectBaseMs').value) || 500, 50, 30000),
      scenario: state.scenario,
    };
  }

  function simulate(cfg) {
    var scenario = cfg.scenario || 'baseline';
    var log = [];
    var ticks = 24;
    var tickMs = Math.max(500, Math.floor(cfg.heartbeatMs / 3));
    var bufferKb = 0;
    var lastPong = 0;
    var lastPing = -Infinity;
    var missedHeartbeats = 0;
    var closed = false;
    var closeCode = null;
    var closeReason = '';
    var peakBuffer = 0;
    var backpressureEvents = 0;
    var reconnectAttempts = 0;
    var reconnectTimes = [];
    var health = 100;

    function pingAt(t) {
      return t - lastPing >= cfg.heartbeatMs;
    }

    for (var i = 0; i < ticks; i++) {
      var t = i * tickMs;
      if (closed) break;

      // Application traffic by scenario
      if (scenario === 'flood') {
        bufferKb += cfg.maxMsgKb * (2 + (i % 3));
        log.push('t=' + t + 'ms  FLOOD enqueue +' + cfg.maxMsgKb * 2 + 'KB  buf=' + round1(bufferKb) + 'KB');
      } else if (scenario === 'stall') {
        bufferKb += Math.max(8, cfg.maxMsgKb * 0.5);
        // Peer not draining
        log.push('t=' + t + 'ms  STALL peer not reading  buf=' + round1(bufferKb) + 'KB');
      } else if (scenario === 'half-open') {
        // No drain, no pong ever
        bufferKb += 2;
      } else {
        // Baseline: gentle traffic + drain
        bufferKb += 4;
        bufferKb = Math.max(0, bufferKb - 6);
      }

      // Drain model (except stall / half-open)
      if (scenario === 'flood') {
        bufferKb = Math.max(0, bufferKb - cfg.maxMsgKb * 0.4);
      } else if (scenario !== 'stall' && scenario !== 'half-open') {
        bufferKb = Math.max(0, bufferKb - 8);
      }

      if (bufferKb > cfg.bufferLimitKb * 0.8) {
        backpressureEvents += 1;
        health -= 4;
        log.push('t=' + t + 'ms  BACKPRESSURE high-water  fill=' + pct(bufferKb, cfg.bufferLimitKb) + '%');
      }

      if (bufferKb >= cfg.bufferLimitKb) {
        closed = true;
        closeCode = 1009;
        closeReason = 'Message buffer / size limit exceeded (simulated)';
        bufferKb = cfg.bufferLimitKb;
        log.push('t=' + t + 'ms  CLOSE ' + closeCode + ' — buffer limit hit');
        peakBuffer = Math.max(peakBuffer, bufferKb);
        break;
      }

      // Heartbeats
      if (pingAt(t)) {
        lastPing = t;
        log.push('t=' + t + 'ms  PING sent');
        if (scenario === 'half-open') {
          missedHeartbeats += 1;
          log.push('t=' + t + 'ms  PONG missing (half-open)');
        } else if (scenario === 'stall' && bufferKb > cfg.bufferLimitKb * 0.5) {
          // Delayed pong under stall
          if (t - lastPing > cfg.timeoutMs * 0.6) {
            missedHeartbeats += 1;
          } else {
            lastPong = t + Math.floor(cfg.heartbeatMs * 0.3);
            log.push('t=' + (t + Math.floor(cfg.heartbeatMs * 0.3)) + 'ms  PONG delayed');
          }
        } else {
          lastPong = t + Math.floor(cfg.heartbeatMs * 0.05);
          log.push('t=' + (t + Math.floor(cfg.heartbeatMs * 0.05)) + 'ms  PONG ok');
          missedHeartbeats = 0;
        }
      }

      if (lastPing > lastPong && t - lastPing >= cfg.timeoutMs) {
        closed = true;
        closeCode = 1001;
        closeReason = 'Heartbeat timeout — going away / dead peer';
        log.push('t=' + t + 'ms  CLOSE ' + closeCode + ' — heartbeat timeout');
        health -= 25;
        break;
      }

      // Server buffer pressure hint
      if (bufferKb > cfg.serverBufKb) {
        health -= 3;
        log.push('t=' + t + 'ms  WARN server send buffer exceeded client view');
      }

      peakBuffer = Math.max(peakBuffer, bufferKb);
    }

    if (!closed && scenario === 'baseline') {
      closeCode = 1000;
      closeReason = 'Normal closure after healthy run';
      log.push('END  CLOSE 1000 — healthy baseline');
    } else if (!closed) {
      closeCode = 1000;
      closeReason = 'Simulation ended without forced close';
      log.push('END  still open — peak buffer ' + round1(peakBuffer) + 'KB');
    }

    // Reconnect storm model after abnormal close
    var storm = false;
    var stormRate = 0;
    if (closeCode && closeCode !== 1000 && closeCode !== 1001) {
      reconnectAttempts = estimateReconnects(cfg, 8);
      reconnectTimes = backoffSeries(cfg.reconnectBaseMs, reconnectAttempts);
      stormRate = reconnectAttempts / 8;
      storm = cfg.reconnectBaseMs < 300 || reconnectAttempts >= 6;
      log.push(
        'RECONNECT attempts=' +
          reconnectAttempts +
          ' base=' +
          cfg.reconnectBaseMs +
          'ms storm=' +
          (storm ? 'YES' : 'no')
      );
    } else if (closeCode === 1001) {
      reconnectAttempts = estimateReconnects(cfg, 5);
      reconnectTimes = backoffSeries(cfg.reconnectBaseMs, reconnectAttempts);
      stormRate = reconnectAttempts / 10;
      storm = cfg.reconnectBaseMs < 200;
      log.push(
        'RECONNECT after timeout attempts=' +
          reconnectAttempts +
          ' storm=' +
          (storm ? 'YES' : 'no')
      );
    }

    var fillPct = pct(peakBuffer, cfg.bufferLimitKb);
    health = clamp(Math.round(health - (storm ? 15 : 0) - fillPct * 0.15), 0, 100);

    // Ratio check: timeout vs heartbeat
    var ratio = cfg.timeoutMs / cfg.heartbeatMs;
    var heartbeatOk = ratio >= 2 && ratio <= 5;

    return {
      cfg: cfg,
      scenario: scenario,
      peakBuffer: round1(peakBuffer),
      fillPct: fillPct,
      backpressureEvents: backpressureEvents,
      missedHeartbeats: missedHeartbeats,
      closeCode: closeCode,
      closeReason: closeReason,
      health: health,
      storm: storm,
      stormRate: round1(stormRate * 100),
      reconnectAttempts: reconnectAttempts,
      reconnectTimes: reconnectTimes,
      heartbeatOk: heartbeatOk,
      ratio: round1(ratio),
      log: log.slice(0, 50),
      closeGuidance: buildCloseGuidance(closeCode, cfg, storm),
      recs: buildRecs(cfg, scenario, fillPct, storm, heartbeatOk, closeCode, health),
    };
  }

  function pct(part, whole) {
    if (!whole) return 0;
    return clamp(Math.round((part / whole) * 100), 0, 100);
  }

  function estimateReconnects(cfg, clients) {
    // Aggressive base backoff ⇒ more overlapping reconnects in a fixed window
    var windowMs = 8000;
    var count = 0;
    for (var c = 0; c < clients; c++) {
      var delay = cfg.reconnectBaseMs * Math.pow(1.6, c % 4);
      if (cfg.reconnectBaseMs < 250) delay *= 0.5;
      var t = delay;
      while (t < windowMs) {
        count += 1;
        t += delay * Math.pow(2, 0.3);
        if (count > 40) break;
      }
    }
    return count;
  }

  function backoffSeries(base, n) {
    var out = [];
    var max = Math.min(n, 8);
    for (var i = 0; i < max; i++) {
      var ms = Math.min(30000, Math.round(base * Math.pow(2, i)));
      // full jitter recommendation shown as range
      out.push({ attempt: i + 1, min: Math.round(ms * 0.5), max: ms });
    }
    return out;
  }

  function buildCloseGuidance(code, cfg, storm) {
    var items = [
      {
        code: '1000',
        text: 'Normal closure — safe for intentional shutdown; clients should not auto-reconnect aggressively.',
      },
      {
        code: '1001',
        text: 'Going away — use after heartbeat timeout or deploy; reconnect with exponential backoff + jitter.',
      },
      {
        code: '1008',
        text: 'Policy violation — good for auth/idle policy; include a machine-readable reason when possible.',
      },
      {
        code: '1009',
        text: 'Message too big / buffer overflow — lower max frame size and apply sender-side backpressure.',
      },
      {
        code: '1011',
        text: 'Internal error — log server-side; clients may retry once then back off.',
      },
    ];

    var suggested = [
      'Recommended backoff: full-jitter exponential starting at ' +
        Math.max(500, cfg.reconnectBaseMs) +
        'ms, cap 30s.',
      storm
        ? 'Storm detected — add reconnect budget (e.g. max 5 / minute) and stagger by connection id.'
        : 'No severe storm in this run — still publish a max reconnect rate in client SDKs.',
      'Prefer application pings over TCP keepalive alone; align timeout ≥ 2× heartbeat (yours: ' +
        round1(cfg.timeoutMs / cfg.heartbeatMs) +
        '×).',
    ];

    return { codes: items, suggested: suggested, observed: code };
  }

  function buildRecs(cfg, scenario, fillPct, storm, heartbeatOk, closeCode, health) {
    var recs = [];

    if (!heartbeatOk) {
      recs.push(
        'Heartbeat timeout / interval ratio is ' +
          round1(cfg.timeoutMs / cfg.heartbeatMs) +
          '× — target 2–3× to survive jitter without slow death detection.'
      );
    } else {
      recs.push(
        'Heartbeat ratio looks healthy (' +
          round1(cfg.timeoutMs / cfg.heartbeatMs) +
          '×). Keep ping payloads tiny and idle-only when the socket is quiet.'
      );
    }

    if (scenario === 'flood' || fillPct > 80) {
      recs.push(
        'Enable client-side send queue limits and pause producers when bufferedAmount exceeds ~' +
          Math.round(cfg.bufferLimitKb * 0.7) +
          'KB.'
      );
    }

    if (scenario === 'stall') {
      recs.push(
        'On stall, stop enqueueing, signal backpressure upstream, and close with 1001/1011 if the peer never drains.'
      );
    }

    if (scenario === 'half-open') {
      recs.push(
        'Half-open links need application heartbeats — TCP alone will not notice a black-holed peer quickly.'
      );
    }

    if (storm) {
      recs.push(
        'Reconnect storm risk: raise base backoff (≥500ms), use full jitter, and cap concurrent reconnects per host.'
      );
    }

    if (cfg.maxMsgKb > cfg.bufferLimitKb / 4) {
      recs.push(
        'Max message size (' +
          cfg.maxMsgKb +
          'KB) is large vs buffer (' +
          cfg.bufferLimitKb +
          'KB) — a few frames can exhaust the limit.'
      );
    }

    if (closeCode === 1009) {
      recs.push('Observed 1009 — document max frame size and reject oversized messages before buffering.');
    }

    if (health < 50) {
      recs.push(
        'Health score ' +
          health +
          ' — prioritize heartbeat tuning and reconnect budgets before adding more fan-out.'
      );
    } else {
      recs.push(
        'Health score ' +
          health +
          ' — export this report with your gateway idle timeouts (LB/proxy) to ensure they exceed app heartbeat timeout.'
      );
    }

    return recs;
  }

  function runLab() {
    var cfg = readConfig();
    var result = simulate(cfg);
    state.lastResult = result;
    state.analyzed = true;
    renderAll();
  }

  function renderStats() {
    var r = state.lastResult;
    if (!r) {
      $('statHealth').textContent = '—';
      $('statBuffer').textContent = '—';
      $('statStorm').textContent = '—';
      $('statClose').textContent = '—';
      return;
    }
    $('statHealth').textContent = r.health + '%';
    $('statBuffer').textContent = r.fillPct + '%';
    $('statStorm').textContent = r.storm ? 'YES' : 'No';
    $('statClose').textContent = String(r.closeCode || '—');
  }

  function renderGauge() {
    var r = state.lastResult;
    var pctVal = r ? r.fillPct : 0;
    $('gaugeFill').style.width = pctVal + '%';
    $('backpressureGauge').setAttribute('aria-valuenow', String(pctVal));
    $('pressureLabel').textContent = pctVal + '%';
  }

  function renderHeartbeat() {
    var el = $('heartbeatPanel');
    var r = state.lastResult;
    if (!r) {
      el.innerHTML =
        '<p class="wsbp-empty">Run the simulator to see heartbeat timeout outcomes.</p>';
      return;
    }
    var ratioTag = r.heartbeatOk ? 'ok' : 'warn';
    el.innerHTML =
      '<div class="wsbp-hb-row"><span>Interval / timeout</span><span class="tag ' +
      ratioTag +
      '">' +
      r.cfg.heartbeatMs +
      ' / ' +
      r.cfg.timeoutMs +
      ' ms (' +
      r.ratio +
      '×)</span></div>' +
      '<div class="wsbp-hb-row"><span>Missed heartbeats</span><span class="tag ' +
      (r.missedHeartbeats ? 'danger' : 'ok') +
      '">' +
      r.missedHeartbeats +
      '</span></div>' +
      '<div class="wsbp-hb-row"><span>Backpressure events</span><span class="tag ' +
      (r.backpressureEvents > 2 ? 'warn' : 'ok') +
      '">' +
      r.backpressureEvents +
      '</span></div>' +
      '<div class="wsbp-hb-row"><span>Peak buffer</span><span class="tag ' +
      (r.fillPct > 80 ? 'danger' : r.fillPct > 50 ? 'warn' : 'ok') +
      '">' +
      r.peakBuffer +
      ' KB</span></div>';
  }

  function renderStorm() {
    var el = $('stormPanel');
    var r = state.lastResult;
    if (!r) {
      el.innerHTML = '<p class="wsbp-empty">Storm metrics appear after a run.</p>';
      return;
    }
    var series = (r.reconnectTimes || [])
      .map(function (s) {
        return '#' + s.attempt + ': ' + s.min + '–' + s.max + 'ms';
      })
      .join(' · ');

    el.innerHTML =
      '<div class="wsbp-storm-card' +
      (r.storm ? ' storm-yes' : '') +
      '"><strong>Storm verdict: ' +
      (r.storm ? 'DETECTED' : 'Clear') +
      '</strong><span>Reconnect pressure index ' +
      r.stormRate +
      '% · attempts modeled: ' +
      r.reconnectAttempts +
      '</span></div>' +
      (series
        ? '<div class="wsbp-storm-card"><strong>Suggested backoff schedule</strong><span>' +
          escapeHtml(series) +
          '</span></div>'
        : '<div class="wsbp-storm-card"><strong>Reconnect</strong><span>No abnormal reconnect loop for this close.</span></div>');
  }

  function renderClose() {
    var el = $('closeCodes');
    var r = state.lastResult;
    if (!r) {
      el.innerHTML =
        '<p class="wsbp-empty">Close-code and backoff guidance appear after a run.</p>';
      return;
    }
    var g = r.closeGuidance;
    var html =
      '<div class="wsbp-close-item"><code>Observed: ' +
      escapeHtml(String(g.observed)) +
      '</code><p>' +
      escapeHtml(r.closeReason) +
      '</p></div>';

    g.codes.forEach(function (c) {
      var active = String(c.code) === String(g.observed);
      html +=
        '<div class="wsbp-close-item"' +
        (active ? ' style="border-color: rgba(167,139,250,0.55)"' : '') +
        '><code>' +
        escapeHtml(c.code) +
        (active ? ' ← observed' : '') +
        '</code><p>' +
        escapeHtml(c.text) +
        '</p></div>';
    });

    g.suggested.forEach(function (s) {
      html +=
        '<div class="wsbp-close-item"><code>Backoff</code><p>' +
        escapeHtml(s) +
        '</p></div>';
    });

    el.innerHTML = html;
  }

  function renderRecs() {
    var el = $('recommendationsList');
    var r = state.lastResult;
    if (!r || !r.recs.length) {
      el.innerHTML =
        '<li class="wsbp-empty-li">Recommendations appear after a simulation.</li>';
      return;
    }
    el.innerHTML = r.recs
      .map(function (t) {
        return '<li>' + escapeHtml(t) + '</li>';
      })
      .join('');
  }

  function renderLog() {
    var r = state.lastResult;
    $('eventLog').textContent = r ? r.log.join('\n') : 'Awaiting simulation…';
  }

  function renderAll() {
    renderStats();
    renderGauge();
    renderHeartbeat();
    renderStorm();
    renderClose();
    renderRecs();
    renderLog();
    $('exportBtn').disabled = !state.analyzed;
    var r = state.lastResult;
    if (r) {
      $('labStatus').textContent =
        'Run complete · scenario ' +
        r.scenario +
        ' · health ' +
        r.health +
        '% · close ' +
        r.closeCode;
    }
  }

  function exportReport() {
    var r = state.lastResult;
    if (!r) return;
    var c = r.cfg;
    var lines = [
      'Algo Infinity Verse — WebSocket Reliability Report',
      'Generated: ' + new Date().toISOString(),
      '',
      '== Configuration ==',
      'Scenario: ' + r.scenario,
      'Heartbeat interval: ' + c.heartbeatMs + ' ms',
      'Heartbeat timeout: ' + c.timeoutMs + ' ms (' + r.ratio + '×)',
      'Client buffer limit: ' + c.bufferLimitKb + ' KB',
      'Server send buffer: ' + c.serverBufKb + ' KB',
      'Max message size: ' + c.maxMsgKb + ' KB',
      'Reconnect base backoff: ' + c.reconnectBaseMs + ' ms',
      '',
      '== Results ==',
      'Health: ' + r.health + '%',
      'Peak buffer: ' + r.peakBuffer + ' KB (' + r.fillPct + '%)',
      'Backpressure events: ' + r.backpressureEvents,
      'Missed heartbeats: ' + r.missedHeartbeats,
      'Close code: ' + r.closeCode + ' — ' + r.closeReason,
      'Reconnect storm: ' + (r.storm ? 'YES' : 'No') + ' (index ' + r.stormRate + '%)',
      'Reconnect attempts modeled: ' + r.reconnectAttempts,
      '',
      '== Close codes & backoff ==',
    ];
    r.closeGuidance.codes.forEach(function (item) {
      lines.push(item.code + ': ' + item.text);
    });
    r.closeGuidance.suggested.forEach(function (s, i) {
      lines.push('Tip ' + (i + 1) + ': ' + s);
    });
    lines.push('', '== Recommendations ==');
    r.recs.forEach(function (t, i) {
      lines.push(i + 1 + '. ' + t);
    });
    lines.push('', '== Event log ==');
    lines = lines.concat(r.log);
    lines.push('', '— End of report —');

    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'websocket-reliability-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function updateScenarioHint() {
    if (!state.scenario) {
      $('scenarioHint').textContent =
        'Pick a preset (or leave unset for baseline heartbeat), then run the lab.';
      return;
    }
    $('scenarioHint').textContent = SCENARIO_HINTS[state.scenario] || state.scenario;
  }

  function bind() {
    document.querySelectorAll('.wsbp-preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sc = btn.getAttribute('data-scenario');
        var turningOn = btn.getAttribute('aria-pressed') !== 'true';
        document.querySelectorAll('.wsbp-preset-btn').forEach(function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        if (turningOn) {
          btn.setAttribute('aria-pressed', 'true');
          state.scenario = sc;
        } else {
          state.scenario = null;
        }
        updateScenarioHint();
      });
    });

    $('runLabBtn').addEventListener('click', runLab);
    $('clearScenarioBtn').addEventListener('click', function () {
      state.scenario = null;
      document.querySelectorAll('.wsbp-preset-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
      });
      updateScenarioHint();
    });
    $('exportBtn').addEventListener('click', exportReport);

    updateScenarioHint();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
