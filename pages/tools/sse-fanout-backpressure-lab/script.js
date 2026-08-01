/**
 * SSE Fan-out Backpressure Lab
 * Multi-client fan-out, drop policies, Last-Event-ID replay gaps.
 */
(function () {
  'use strict';

  var state = {
    preset: null,
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

  function readConfig() {
    return {
      clients: clamp(Number($('sse-clients').value) || 25, 1, 500),
      rate: clamp(Number($('sse-rate').value) || 40, 1, 1000),
      buf: clamp(Number($('sse-buf').value) || 64, 1, 10000),
      policy: $('sse-policy').value,
      retain: clamp(Number($('sse-retain').value) || 200, 0, 100000),
      lastId: clamp(Number($('sse-lastId').value) || 0, 0, 1000000),
      preset: state.preset,
    };
  }

  function simulate(cfg) {
    var log = [];
    var ticks = 20;
    var produced = 0;
    var dropped = 0;
    var disconnected = 0;
    var blockedTicks = 0;
    var peakFill = 0;
    var fillSum = 0;
    var slowShare = cfg.preset === 'stall' ? 0.45 : cfg.preset === 'burst' ? 0.2 : 0.15;
    var burstMul = cfg.preset === 'burst' ? 3.2 : 1;
    var buffers = [];
    var i;
    var c;

    for (c = 0; c < cfg.clients; c++) {
      buffers.push(0);
    }

    var nextId = 1;
    var oldestRetained = 1;

    for (i = 0; i < ticks; i++) {
      var eventsThisTick = Math.round(cfg.rate * burstMul * (0.7 + (i % 5) * 0.08));
      var j;

      for (j = 0; j < eventsThisTick; j++) {
        produced++;
        var id = nextId++;
        oldestRetained = Math.max(1, id - cfg.retain + 1);

        for (c = 0; c < cfg.clients; c++) {
          var isSlow = c / cfg.clients < slowShare;
          var drain = isSlow ? 0.15 : 1.1;
          buffers[c] = Math.max(0, buffers[c] - drain);

          if (buffers[c] >= cfg.buf) {
            if (cfg.policy === 'drop-oldest') {
              dropped++;
              log.push('t=' + i + ' client#' + c + ' DROP oldest (buf full) id=' + id);
            } else if (cfg.policy === 'drop-newest') {
              dropped++;
              log.push('t=' + i + ' client#' + c + ' DROP newest id=' + id);
            } else if (cfg.policy === 'disconnect') {
              disconnected++;
              buffers[c] = 0;
              log.push('t=' + i + ' client#' + c + ' DISCONNECT slow consumer');
            } else {
              blockedTicks++;
              log.push('t=' + i + ' PRODUCER BLOCKED waiting on client#' + c);
            }
          } else {
            buffers[c] += 1;
          }
        }
      }

      var avg = 0;
      for (c = 0; c < cfg.clients; c++) avg += buffers[c];
      avg = avg / cfg.clients;
      fillSum += avg;
      peakFill = Math.max(peakFill, avg);
    }

    var avgFill = fillSum / ticks;
    var pressurePct = Math.round(clamp((avgFill / cfg.buf) * 100, 0, 100));
    var peakPct = Math.round(clamp((peakFill / cfg.buf) * 100, 0, 100));

    // Replay gap: client reconnects with Last-Event-ID
    var serverHead = nextId - 1;
    var requested = cfg.lastId;
    var gap = 0;
    var gapKind = 'none';
    var canReplay = true;

    if (requested < oldestRetained) {
      gap = oldestRetained - requested - 1;
      gapKind = 'retention';
      canReplay = false;
      log.push(
        'REPLAY GAP: Last-Event-ID=' +
          requested +
          ' older than retain window (oldest=' +
          oldestRetained +
          ') — ' +
          gap +
          '+ events lost'
      );
    } else if (requested > serverHead) {
      gapKind = 'future';
      canReplay = false;
      gap = requested - serverHead;
      log.push('REPLAY ERROR: Last-Event-ID=' + requested + ' ahead of server head=' + serverHead);
    } else if (cfg.preset === 'disconnect' || disconnected > 0) {
      gapKind = 'transient';
      gap = Math.max(0, Math.round(dropped / Math.max(1, cfg.clients)));
      log.push('Reconnect after disconnect; cursor ' + requested + ' within window — replay from ' + (requested + 1));
    } else {
      log.push('Last-Event-ID=' + requested + ' within retain window [' + oldestRetained + '…' + serverHead + ']');
    }

    var recs = [
      'Emit monotonic id: fields on every event and honor Last-Event-ID on reconnect.',
      'Keep a bounded retain/replay buffer (or durable log) sized for your max disconnect RTO.',
      'Prefer drop-oldest or disconnect-slow over unbounded producer blocking in fan-out hubs.',
      'Backoff reconnects with jitter; avoid thundering herds after regional blips.',
      'Surface a gap signal to clients when Last-Event-ID is older than retention — trigger full resync.',
    ];
    if (!canReplay && gapKind === 'retention') {
      recs.unshift('Increase retain window or switch to durable cursor storage — clients must resync from source of truth.');
    }
    if (cfg.policy === 'block' && blockedTicks > 0) {
      recs.unshift('Blocking producers couples slow clients to everyone — switch to drop or isolate slow consumers.');
    }
    if (pressurePct >= 70) {
      recs.unshift('Backpressure is high — lower fan-out rate, raise buffers, or shard by topic/tenant.');
    }

    return {
      cfg: cfg,
      produced: produced,
      dropped: dropped,
      disconnected: disconnected,
      blockedTicks: blockedTicks,
      pressurePct: pressurePct,
      peakPct: peakPct,
      gap: gap,
      gapKind: gapKind,
      canReplay: canReplay,
      oldestRetained: oldestRetained,
      serverHead: serverHead,
      log: log.slice(-40),
      recs: recs,
    };
  }

  function updateStats(r) {
    $('sse-statClients').textContent = r ? String(r.cfg.clients) : '—';
    $('sse-statPressure').textContent = r ? r.pressurePct + '%' : '—';
    $('sse-statDropped').textContent = r ? String(r.dropped) : '—';
    $('sse-statGap').textContent = r ? (r.gap > 0 ? String(r.gap) : '0') : '—';
  }

  function render(r) {
    state.lastResult = r;
    updateStats(r);

    $('sse-gaugeFill').style.width = r.pressurePct + '%';
    $('sse-gauge').setAttribute('aria-valuenow', String(r.pressurePct));
    $('sse-pressureLabel').textContent = r.pressurePct + '%';

    $('sse-policyOut').innerHTML =
      '<p><strong>Policy:</strong> ' +
      escapeHtml(r.cfg.policy) +
      '</p>' +
      '<p>Produced <strong>' +
      r.produced +
      '</strong> · Dropped <strong>' +
      r.dropped +
      '</strong> · Disconnected <strong>' +
      r.disconnected +
      '</strong> · Blocked ticks <strong>' +
      r.blockedTicks +
      '</strong></p>' +
      '<p>Peak buffer fill ≈ <strong>' +
      r.peakPct +
      '%</strong></p>';

    var badge =
      r.gapKind === 'none' || (r.canReplay && r.gap === 0)
        ? '<span class="sse-badge ok">No gap</span>'
        : r.gapKind === 'retention'
          ? '<span class="sse-badge danger">Retention gap</span>'
          : '<span class="sse-badge warn">Replay issue</span>';

    $('sse-replayOut').innerHTML =
      badge +
      '<p>Last-Event-ID <code>' +
      r.cfg.lastId +
      '</code> · Retain window oldest <code>' +
      r.oldestRetained +
      '</code> · Head <code>' +
      r.serverHead +
      '</code></p>' +
      '<p>' +
      (r.canReplay
        ? 'Client can resume from id ' + (r.cfg.lastId + 1) + '.'
        : 'Client cannot fully resume — gap ≈ ' + r.gap + ' event(s). Trigger snapshot/resync.') +
      '</p>';

    $('sse-eventLog').textContent = r.log.join('\n') || 'No events logged.';
    $('sse-recs').innerHTML = r.recs
      .map(function (t) {
        return '<li>' + escapeHtml(t) + '</li>';
      })
      .join('');

    $('sse-exportBtn').disabled = false;
    $('sse-status').textContent =
      'Done — pressure ' + r.pressurePct + '%, dropped ' + r.dropped + ', gap ' + r.gap + '.';
  }

  function applyPreset(name) {
    state.preset = name;
    document.querySelectorAll('.sse-preset-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-preset') === name ? 'true' : 'false');
    });

    if (name === 'stall') {
      $('sse-clients').value = '40';
      $('sse-rate').value = '30';
      $('sse-buf').value = '32';
      $('sse-policy').value = 'drop-oldest';
      $('sse-retain').value = '300';
      $('sse-lastId').value = '280';
    } else if (name === 'burst') {
      $('sse-clients').value = '50';
      $('sse-rate').value = '80';
      $('sse-buf').value = '48';
      $('sse-policy').value = 'drop-newest';
      $('sse-retain').value = '500';
      $('sse-lastId').value = '400';
    } else if (name === 'disconnect') {
      $('sse-clients').value = '20';
      $('sse-rate').value = '50';
      $('sse-buf').value = '24';
      $('sse-policy').value = 'disconnect';
      $('sse-retain').value = '100';
      $('sse-lastId').value = '20';
    }
    $('sse-status').textContent = 'Preset "' + name + '" loaded — run fan-out.';
  }

  function exportReport() {
    var r = state.lastResult;
    if (!r) return;
    var lines = [
      '# SSE Fan-out Reliability Report',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Summary',
      '- Clients: ' + r.cfg.clients,
      '- Backpressure (avg fill): ' + r.pressurePct + '%',
      '- Peak fill: ' + r.peakPct + '%',
      '- Produced: ' + r.produced,
      '- Dropped: ' + r.dropped,
      '- Disconnected: ' + r.disconnected,
      '- Replay gap: ' + r.gap + ' (' + r.gapKind + ')',
      '',
      '## Config',
      '- Rate: ' + r.cfg.rate + ' evt/s',
      '- Buffer: ' + r.cfg.buf,
      '- Policy: ' + r.cfg.policy,
      '- Retain: ' + r.cfg.retain,
      '- Last-Event-ID: ' + r.cfg.lastId,
      '- Preset: ' + (r.cfg.preset || 'none'),
      '',
      '## Timeline (tail)',
    ];
    r.log.forEach(function (l) {
      lines.push('- ' + l);
    });
    lines.push('', '## Recommendations');
    r.recs.forEach(function (t) {
      lines.push('- ' + t);
    });

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sse-fanout-reliability-report.md';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function init() {
    document.querySelectorAll('.sse-preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyPreset(btn.getAttribute('data-preset'));
      });
    });

    $('sse-runBtn').addEventListener('click', function () {
      render(simulate(readConfig()));
    });

    $('sse-clearBtn').addEventListener('click', function () {
      state.preset = null;
      document.querySelectorAll('.sse-preset-btn').forEach(function (btn) {
        btn.setAttribute('aria-pressed', 'false');
      });
      $('sse-status').textContent = 'Preset cleared.';
    });

    $('sse-exportBtn').addEventListener('click', exportReport);
    updateStats(null);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
