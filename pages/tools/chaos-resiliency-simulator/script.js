/**
 * Chaos Resiliency Simulator
 * Deterministic multi-region DR / fault-injection lab.
 */
(function () {
  'use strict';

  var DEFAULT_REGIONS = [
    { id: 'r1', name: 'us-east-1', latencyMs: 45, capacityPct: 100, lagMs: 80 },
    { id: 'r2', name: 'eu-west-1', latencyMs: 120, capacityPct: 80, lagMs: 150 },
    { id: 'r3', name: 'ap-south-1', latencyMs: 180, capacityPct: 60, lagMs: 220 },
  ];

  var state = {
    regions: cloneRegions(DEFAULT_REGIONS),
    faults: {},
    lastResult: null,
  };

  function cloneRegions(list) {
    return list.map(function (r) {
      return {
        id: r.id,
        name: r.name,
        latencyMs: r.latencyMs,
        capacityPct: r.capacityPct,
        lagMs: r.lagMs,
      };
    });
  }

  function $(id) {
    return document.getElementById(id);
  }

  function getArchMode() {
    var checked = document.querySelector('input[name="archMode"]:checked');
    return checked ? checked.value : 'active-active';
  }

  function selectedFaults() {
    return Object.keys(state.faults).filter(function (k) {
      return state.faults[k];
    });
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function formatSeconds(s) {
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    var rem = s % 60;
    return rem ? m + 'm ' + rem + 's' : m + 'm';
  }

  function renderRegions() {
    var container = $('regionsList');
    if (!container) return;
    container.innerHTML = '';

    state.regions.forEach(function (region, index) {
      var card = document.createElement('div');
      card.className = 'chaos-region-card';
      card.dataset.id = region.id;

      var canRemove = state.regions.length > 2;
      card.innerHTML =
        '<div class="chaos-region-head">' +
        '<span class="chaos-region-name">' + escapeHtml(region.name) + '</span>' +
        (canRemove
          ? '<button type="button" class="chaos-region-remove" data-remove="' + region.id + '" aria-label="Remove ' + escapeHtml(region.name) + '"><i class="fas fa-trash" aria-hidden="true"></i></button>'
          : '') +
        '</div>' +
        '<div class="chaos-region-fields">' +
        fieldHtml('Latency (ms)', 'latency', region.id, region.latencyMs, 1, 500) +
        fieldHtml('Capacity (%)', 'capacity', region.id, region.capacityPct, 10, 100) +
        fieldHtml('Replication lag (ms)', 'lag', region.id, region.lagMs, 0, 5000) +
        '</div>';

      container.appendChild(card);

      if (index === 0 && !region._named) {
        /* name stays editable via data attrs only for defaults */
      }
    });

    container.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-remove');
        if (state.regions.length <= 2) return;
        state.regions = state.regions.filter(function (r) {
          return r.id !== id;
        });
        renderRegions();
        renderStatusCards(null);
      });
    });

    container.querySelectorAll('input[data-field]').forEach(function (input) {
      input.addEventListener('change', onRegionFieldChange);
      input.addEventListener('input', onRegionFieldChange);
    });
  }

  function fieldHtml(label, field, id, value, min, max) {
    var inputId = 'chaos-' + field + '-' + id;
    return (
      '<div class="chaos-field">' +
      '<label for="' + inputId + '">' + label + '</label>' +
      '<input type="number" id="' + inputId + '" data-field="' + field + '" data-id="' + id +
      '" value="' + value + '" min="' + min + '" max="' + max + '" step="1" />' +
      '</div>'
    );
  }

  function onRegionFieldChange(e) {
    var input = e.target;
    var id = input.getAttribute('data-id');
    var field = input.getAttribute('data-field');
    var region = state.regions.find(function (r) {
      return r.id === id;
    });
    if (!region) return;
    var val = Number(input.value);
    if (Number.isNaN(val)) return;
    if (field === 'latency') region.latencyMs = clamp(val, 1, 500);
    if (field === 'capacity') region.capacityPct = clamp(val, 10, 100);
    if (field === 'lag') region.lagMs = clamp(val, 0, 5000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStatusCards(statuses) {
    var grid = $('statusCards');
    if (!grid) return;
    grid.innerHTML = '';

    state.regions.forEach(function (region) {
      var status = (statuses && statuses[region.id]) || 'HEALTHY';
      var card = document.createElement('article');
      card.className = 'chaos-status-card';
      card.dataset.status = status;
      card.setAttribute('aria-label', region.name + ' status ' + status);

      var icon =
        status === 'FAILED' ? 'fa-xmark' :
        status === 'DEGRADED' ? 'fa-triangle-exclamation' : 'fa-check';

      card.innerHTML =
        '<div class="chaos-status-name">' + escapeHtml(region.name) + '</div>' +
        '<div class="chaos-status-badge"><i class="fas ' + icon + '" aria-hidden="true"></i> ' + status + '</div>' +
        '<div class="chaos-status-meta">' +
        '<span>Latency: ' + region.latencyMs + ' ms</span>' +
        '<span>Capacity: ' + region.capacityPct + '%</span>' +
        '<span>Repl. lag: ' + region.lagMs + ' ms</span>' +
        '</div>';

      grid.appendChild(card);
    });
  }

  function flipStatusCards(statuses) {
    var cards = document.querySelectorAll('.chaos-status-card');
    cards.forEach(function (card, i) {
      window.setTimeout(function () {
        card.classList.add('is-flipping');
        var region = state.regions[i];
        if (region && statuses[region.id]) {
          card.dataset.status = statuses[region.id];
          var badge = card.querySelector('.chaos-status-badge');
          var status = statuses[region.id];
          var icon =
            status === 'FAILED' ? 'fa-xmark' :
            status === 'DEGRADED' ? 'fa-triangle-exclamation' : 'fa-check';
          if (badge) {
            badge.innerHTML = '<i class="fas ' + icon + '" aria-hidden="true"></i> ' + status;
          }
          card.setAttribute('aria-label', region.name + ' status ' + status);
        }
        window.setTimeout(function () {
          card.classList.remove('is-flipping');
        }, 560);
      }, i * 80);
    });
  }

  /**
   * Deterministic simulation from architecture + faults + region metrics.
   */
  function runSimulation() {
    var mode = getArchMode();
    var faults = selectedFaults();
    var regions = state.regions;
    var n = regions.length;

    if (faults.length === 0) {
      $('simStatus').textContent = 'Select at least one fault to inject.';
      return;
    }

    var avgLag = regions.reduce(function (s, r) { return s + r.lagMs; }, 0) / n;
    var avgLatency = regions.reduce(function (s, r) { return s + r.latencyMs; }, 0) / n;
    var totalCapacity = regions.reduce(function (s, r) { return s + r.capacityPct; }, 0);
    var sortedByCapacity = regions.slice().sort(function (a, b) {
      return b.capacityPct - a.capacityPct;
    });
    var primary = sortedByCapacity[0];
    var standby = sortedByCapacity[1] || primary;

    var statuses = {};
    regions.forEach(function (r) {
      statuses[r.id] = 'HEALTHY';
    });

    var rto = 0;
    var rpo = Math.round(avgLag / 1000);
    var score = 100;
    var policies = [];
    var recommendations = [];

    var hasOutage = faults.indexOf('outage') !== -1;
    var hasReplication = faults.indexOf('replication') !== -1;
    var hasSplitBrain = faults.indexOf('splitbrain') !== -1;
    var hasDns = faults.indexOf('dns') !== -1;

    /* --- Region outage --- */
    if (hasOutage) {
      statuses[primary.id] = 'FAILED';
      if (mode === 'active-active') {
        rto += Math.round(30 + avgLatency * 0.4);
        score -= 18;
        var remaining = totalCapacity - primary.capacityPct;
        if (remaining < 70) {
          regions.forEach(function (r) {
            if (r.id !== primary.id) statuses[r.id] = 'DEGRADED';
          });
          score -= 10;
          recommendations.push('Add capacity headroom so surviving regions retain ≥70% aggregate capacity during primary loss.');
        }
        policies.push({
          name: 'Multi-region load shedding',
          pass: remaining >= 50,
          desc: remaining >= 50
            ? 'Surviving regions absorb traffic (' + remaining + '% capacity remaining).'
            : 'Insufficient spare capacity (' + remaining + '%) after primary outage.',
        });
        policies.push({
          name: 'Active-Active failover',
          pass: true,
          desc: 'Traffic rebalanced across healthy peers without cold standby promotion.',
        });
      } else {
        rto += Math.round(90 + standby.latencyMs * 0.6 + (100 - standby.capacityPct));
        score -= 28;
        statuses[standby.id] = statuses[standby.id] === 'FAILED' ? 'FAILED' : 'DEGRADED';
        policies.push({
          name: 'Active-Passive failover',
          pass: standby.capacityPct >= 50,
          desc: standby.capacityPct >= 50
            ? 'Standby ' + standby.name + ' promoted; capacity ' + standby.capacityPct + '%.'
            : 'Standby capacity too low (' + standby.capacityPct + '%) for full failover.',
        });
        recommendations.push('Pre-warm standby capacity and automate DNS/health-check cutover to cut Active-Passive RTO.');
      }
    }

    /* --- Replication lag spike --- */
    if (hasReplication) {
      var lagSpike = Math.round(avgLag * 4 + 2000);
      rpo = Math.max(rpo, Math.round(lagSpike / 1000));
      rto += mode === 'active-active' ? 20 : 45;
      score -= 15;
      regions.forEach(function (r) {
        if (statuses[r.id] === 'HEALTHY') statuses[r.id] = 'DEGRADED';
      });
      var lagPass = avgLag < 200 && mode === 'active-active';
      policies.push({
        name: 'Async replication lag budget',
        pass: lagPass,
        desc: lagPass
          ? 'Baseline lag under 200 ms; spike contained with peer reads.'
          : 'Replication lag spike ~' + lagSpike + ' ms threatens RPO target.',
      });
      recommendations.push('Tighten replication SLO and add lag-aware circuit breakers that shed writes before lag exceeds RPO.');
      recommendations.push('Consider semi-sync or quorum writes for critical tables to bound RPO during lag spikes.');
    }

    /* --- Split-brain --- */
    if (hasSplitBrain) {
      rto += mode === 'active-active' ? 120 : 180;
      rpo = Math.max(rpo, Math.round(avgLag / 500) + 30);
      score -= 25;
      if (n >= 2) {
        statuses[regions[0].id] = 'DEGRADED';
        statuses[regions[1].id] = 'DEGRADED';
      }
      var quorumPass = mode === 'active-passive';
      policies.push({
        name: 'Split-brain / fencing policy',
        pass: quorumPass,
        desc: quorumPass
          ? 'Single writer (passive standby) reduces dual-primary risk; fencing assumed.'
          : 'Active-Active without fencing may accept divergent writes across partitions.',
      });
      recommendations.push('Enforce STONITH / lease-based fencing and a single writable primary (or consensus) during partitions.');
      if (mode === 'active-active') {
        recommendations.push('Add quorum membership and reject writes when majority cannot be formed.');
      }
    }

    /* --- DNS stale records --- */
    if (hasDns) {
      var dnsTtlPenalty = mode === 'active-passive' ? 300 : 180;
      rto += dnsTtlPenalty;
      score -= 12;
      regions.forEach(function (r, i) {
        if (i === 0 && statuses[r.id] !== 'FAILED') statuses[r.id] = 'DEGRADED';
      });
      policies.push({
        name: 'DNS TTL & health routing',
        pass: false,
        desc: 'Stale DNS keeps clients on unhealthy endpoints for ~' + dnsTtlPenalty + 's of effective RTO.',
      });
      recommendations.push('Lower DNS TTL for failover records and prefer health-checked anycast / GSLB over static A records.');
      recommendations.push('Pair DNS with application-level service discovery that reacts faster than TTL expiry.');
    }

    /* Circuit breaker evaluation */
    var healthyCount = regions.filter(function (r) {
      return statuses[r.id] === 'HEALTHY';
    }).length;
    var cbPass = healthyCount > 0 || (mode === 'active-passive' && !hasSplitBrain);
    policies.push({
      name: 'Circuit breaker open/close',
      pass: cbPass,
      desc: cbPass
        ? 'Breaker can isolate failed regions and route to ' + Math.max(healthyCount, 1) + ' viable path(s).'
        : 'No healthy region remaining; breaker cannot restore traffic without manual intervention.',
    });

    if (healthyCount === 0 && hasOutage) {
      score -= 20;
      recommendations.push('Ensure at least one geographically independent region remains outside the blast radius of a single AZ/region failure.');
    }

    score = clamp(Math.round(score - avgLatency / 50 - avgLag / 400), 0, 100);
    rto = Math.max(0, Math.round(rto));
    rpo = Math.max(0, Math.round(rpo));

    if (score >= 75) {
      recommendations.push('Maintain chaos drills quarterly and document runbooks for the faults you just simulated.');
    } else if (recommendations.length === 0) {
      recommendations.push('Raise spare capacity, shorten DNS TTL, and add automated failover health checks.');
    }

    /* Dedupe recommendations */
    recommendations = recommendations.filter(function (item, idx, arr) {
      return arr.indexOf(item) === idx;
    });

    state.lastResult = {
      mode: mode,
      faults: faults.slice(),
      regions: cloneRegions(regions),
      statuses: statuses,
      rto: rto,
      rpo: rpo,
      score: score,
      policies: policies,
      recommendations: recommendations,
      timestamp: new Date().toISOString(),
    };

    $('statRto').textContent = formatSeconds(rto);
    $('statRpo').textContent = formatSeconds(rpo);
    $('statScore').textContent = String(score);

    $('simStatus').textContent =
      'Simulated ' + faults.length + ' fault(s) in ' + mode + ' mode — score ' + score + '/100';

    flipStatusCards(statuses);
    renderPolicies(policies);
    renderRecommendations(recommendations);

    var exportBtn = $('exportBtn');
    if (exportBtn) exportBtn.disabled = false;
  }

  function renderPolicies(policies) {
    var el = $('policyResults');
    if (!el) return;
    if (!policies.length) {
      el.innerHTML = '<p class="chaos-empty">No policies evaluated.</p>';
      return;
    }
    el.innerHTML = policies.map(function (p) {
      return (
        '<div class="chaos-policy-item">' +
        '<div><div class="chaos-policy-name">' + escapeHtml(p.name) + '</div>' +
        '<div class="chaos-policy-desc">' + escapeHtml(p.desc) + '</div></div>' +
        '<span class="chaos-policy-verdict ' + (p.pass ? 'pass' : 'fail') + '">' +
        (p.pass ? 'Pass' : 'Fail') + '</span></div>'
      );
    }).join('');
  }

  function renderRecommendations(recs) {
    var list = $('recommendationsList');
    if (!list) return;
    if (!recs.length) {
      list.innerHTML = '<li class="chaos-empty-li">No recommendations.</li>';
      return;
    }
    list.innerHTML = recs.map(function (r) {
      return '<li>' + escapeHtml(r) + '</li>';
    }).join('');
  }

  function exportAudit() {
    var result = state.lastResult;
    if (!result) return;

    var lines = [
      '# Chaos Resilience Audit',
      '',
      '- Generated: ' + result.timestamp,
      '- Architecture: ' + result.mode,
      '- Faults: ' + result.faults.join(', '),
      '- RTO: ' + formatSeconds(result.rto) + ' (' + result.rto + 's)',
      '- RPO: ' + formatSeconds(result.rpo) + ' (' + result.rpo + 's)',
      '- Resilience score: ' + result.score + '/100',
      '',
      '## Regions',
      '',
    ];

    result.regions.forEach(function (r) {
      lines.push(
        '- **' + r.name + '**: status=' + result.statuses[r.id] +
        ', latency=' + r.latencyMs + 'ms, capacity=' + r.capacityPct +
        '%, lag=' + r.lagMs + 'ms'
      );
    });

    lines.push('', '## Policy evaluation', '');
    result.policies.forEach(function (p) {
      lines.push('- [' + (p.pass ? 'PASS' : 'FAIL') + '] ' + p.name + ' — ' + p.desc);
    });

    lines.push('', '## Hardening recommendations', '');
    result.recommendations.forEach(function (r, i) {
      lines.push((i + 1) + '. ' + r);
    });

    lines.push('', '---', '_Algo Infinity Verse · Chaos Resiliency Simulator_', '');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'chaos-resilience-audit.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function bindFaultButtons() {
    document.querySelectorAll('.chaos-fault-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var fault = btn.getAttribute('data-fault');
        var next = !state.faults[fault];
        state.faults[fault] = next;
        btn.setAttribute('aria-pressed', next ? 'true' : 'false');
        updateFaultHint();
      });
    });
  }

  function updateFaultHint() {
    var faults = selectedFaults();
    var hint = $('faultHint');
    if (!hint) return;
    if (!faults.length) {
      hint.textContent = 'Select one or more faults, then run the simulation.';
    } else {
      hint.textContent = 'Active faults: ' + faults.join(', ') + '.';
    }
  }

  function clearFaults() {
    state.faults = {};
    document.querySelectorAll('.chaos-fault-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', 'false');
    });
    updateFaultHint();
  }

  function addRegion() {
    if (state.regions.length >= 3) {
      $('simStatus').textContent = 'Maximum of 3 regions supported in this simulator.';
      return;
    }
    var names = ['us-west-2', 'eu-central-1', 'ap-northeast-1', 'sa-east-1'];
    var used = state.regions.map(function (r) { return r.name; });
    var name = names.find(function (n) { return used.indexOf(n) === -1; }) || ('region-' + (state.regions.length + 1));
    state.regions.push({
      id: 'r' + Date.now(),
      name: name,
      latencyMs: 100 + state.regions.length * 40,
      capacityPct: 70,
      lagMs: 100 + state.regions.length * 50,
    });
    renderRegions();
    renderStatusCards(null);
  }

  function resetRegions() {
    state.regions = cloneRegions(DEFAULT_REGIONS);
    renderRegions();
    renderStatusCards(null);
    $('simStatus').textContent = 'Regions reset to defaults.';
  }

  function init() {
    renderRegions();
    renderStatusCards(null);
    bindFaultButtons();

    var simulateBtn = $('simulateBtn');
    var clearBtn = $('clearFaultsBtn');
    var exportBtn = $('exportBtn');
    var addBtn = $('addRegionBtn');
    var resetBtn = $('resetRegionsBtn');

    if (simulateBtn) simulateBtn.addEventListener('click', runSimulation);
    if (clearBtn) clearBtn.addEventListener('click', clearFaults);
    if (exportBtn) exportBtn.addEventListener('click', exportAudit);
    if (addBtn) addBtn.addEventListener('click', addRegion);
    if (resetBtn) resetBtn.addEventListener('click', resetRegions);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
