(function () {
  'use strict';

  var lastAnalysis = null;
  var allSpans = [];

  var DEMO_TRACE = [
    {
      traceId: 'demo-trace-001',
      spanId: 'root',
      parentSpanId: '',
      name: 'HTTP POST /checkout',
      serviceName: 'api-gateway',
      startTimeUnixNano: '1000000000',
      endTimeUnixNano: '1000000000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'auth',
      parentSpanId: 'root',
      name: 'RPC Auth.Verify',
      serviceName: 'auth-service',
      startTimeUnixNano: '1000000000',
      endTimeUnixNano: '1000450000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'cart',
      parentSpanId: 'root',
      name: 'RPC Cart.Get',
      serviceName: 'cart-service',
      startTimeUnixNano: '1000500000',
      endTimeUnixNano: '1001200000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'inventory',
      parentSpanId: 'root',
      name: 'RPC Inventory.Reserve',
      serviceName: 'inventory-service',
      startTimeUnixNano: '1001250000',
      endTimeUnixNano: '1003800000',
      status: { code: 2 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'inv-db',
      parentSpanId: 'inventory',
      name: 'DB SELECT stock',
      serviceName: 'inventory-db',
      startTimeUnixNano: '1001300000',
      endTimeUnixNano: '1001800000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'inv-rpc-warehouse',
      parentSpanId: 'inventory',
      name: 'RPC Warehouse.Lock',
      serviceName: 'warehouse-service',
      startTimeUnixNano: '1001850000',
      endTimeUnixNano: '1003700000',
      status: { code: 2 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'wh-timeout',
      parentSpanId: 'inv-rpc-warehouse',
      name: 'RPC Region.Sync',
      serviceName: 'region-service',
      startTimeUnixNano: '1001900000',
      endTimeUnixNano: '1003650000',
      status: { code: 2 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'orders',
      parentSpanId: 'root',
      name: 'RPC Orders.Create',
      serviceName: 'order-service',
      startTimeUnixNano: '1003850000',
      endTimeUnixNano: '1009000000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'db1',
      parentSpanId: 'orders',
      name: 'DB SELECT product',
      serviceName: 'order-db',
      startTimeUnixNano: '1003900000',
      endTimeUnixNano: '1004200000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'db2',
      parentSpanId: 'orders',
      name: 'DB SELECT product',
      serviceName: 'order-db',
      startTimeUnixNano: '1004250000',
      endTimeUnixNano: '1004550000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'db3',
      parentSpanId: 'orders',
      name: 'DB SELECT product',
      serviceName: 'order-db',
      startTimeUnixNano: '1004600000',
      endTimeUnixNano: '1004900000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'db4',
      parentSpanId: 'orders',
      name: 'DB SELECT product',
      serviceName: 'order-db',
      startTimeUnixNano: '1004950000',
      endTimeUnixNano: '1005250000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'db5',
      parentSpanId: 'orders',
      name: 'DB SELECT product',
      serviceName: 'order-db',
      startTimeUnixNano: '1005300000',
      endTimeUnixNano: '1005600000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'db6',
      parentSpanId: 'orders',
      name: 'DB SELECT product',
      serviceName: 'order-db',
      startTimeUnixNano: '1005650000',
      endTimeUnixNano: '1005950000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'payment',
      parentSpanId: 'orders',
      name: 'RPC Payment.Charge',
      serviceName: 'payment-service',
      startTimeUnixNano: '1006000000',
      endTimeUnixNano: '1008800000',
      status: { code: 1 }
    },
    {
      traceId: 'demo-trace-001',
      spanId: 'pay-db',
      parentSpanId: 'payment',
      name: 'DB INSERT payment',
      serviceName: 'payment-db',
      startTimeUnixNano: '1006100000',
      endTimeUnixNano: '1007000000',
      status: { code: 1 }
    }
  ];

  // Fix root end time to cover children (900ms total from start)
  DEMO_TRACE[0].endTimeUnixNano = '1009000000';

  function $(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    var n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function attrGet(span, key) {
    var attrs = span.attributes;
    if (!attrs) return null;
    if (Array.isArray(attrs)) {
      for (var i = 0; i < attrs.length; i++) {
        if (attrs[i] && attrs[i].key === key) {
          var v = attrs[i].value;
          if (v && typeof v === 'object') {
            return v.stringValue || v.intValue || v.doubleValue || v.boolValue || null;
          }
          return v;
        }
      }
      return null;
    }
    if (typeof attrs === 'object') return attrs[key] != null ? attrs[key] : null;
    return null;
  }

  function normalizeSpan(raw, index) {
    var start =
      toNumber(raw.startTimeUnixNano) != null ? toNumber(raw.startTimeUnixNano) :
      toNumber(raw.startTimeMs) != null ? toNumber(raw.startTimeMs) * 1e6 :
      toNumber(raw.startTime) != null ? toNumber(raw.startTime) : 0;

    var end = toNumber(raw.endTimeUnixNano);
    if (end == null) {
      var duration = toNumber(raw.durationUnixNano);
      if (duration == null && toNumber(raw.durationMs) != null) duration = toNumber(raw.durationMs) * 1e6;
      if (duration == null && toNumber(raw.duration) != null) {
        var d = toNumber(raw.duration);
        // Heuristic: values < 1e7 treated as ms, else ns
        duration = d < 1e7 ? d * 1e6 : d;
      }
      if (duration != null) end = start + duration;
    }
    if (end == null) end = start;

    var statusCode = 1;
    if (raw.status) {
      if (typeof raw.status === 'object') {
        statusCode = toNumber(raw.status.code);
        if (statusCode == null) {
          var st = String(raw.status.status || raw.status.message || '').toUpperCase();
          statusCode = st.indexOf('ERROR') >= 0 || st === 'STATUS_CODE_ERROR' ? 2 : 1;
        }
      } else {
        statusCode = toNumber(raw.status) != null ? toNumber(raw.status) : 1;
      }
    }

    var service =
      raw.serviceName ||
      (raw.resource && (raw.resource.serviceName || (raw.resource.attributes && raw.resource.attributes['service.name']))) ||
      attrGet(raw, 'service.name') ||
      'unknown';

    var durationNs = Math.max(0, end - start);
    return {
      index: index,
      traceId: String(raw.traceId || ''),
      spanId: String(raw.spanId || ('span-' + index)),
      parentSpanId: raw.parentSpanId == null || raw.parentSpanId === '' ? null : String(raw.parentSpanId),
      name: String(raw.name || raw.operationName || 'unnamed'),
      serviceName: String(service),
      startNs: start,
      endNs: end,
      durationNs: durationNs,
      durationMs: durationNs / 1e6,
      statusCode: statusCode,
      isError: statusCode === 2 || statusCode === 'ERROR' || Number(statusCode) === 2,
      raw: raw
    };
  }

  function parseSpans(text) {
    var raw;
    try {
      raw = JSON.parse(String(text || '').trim());
    } catch (err) {
      return { error: 'Invalid JSON: ' + (err.message || 'parse error') };
    }
    if (!Array.isArray(raw)) {
      if (raw && Array.isArray(raw.spans)) raw = raw.spans;
      else if (raw && raw.data && Array.isArray(raw.data)) {
        // Jaeger UI-ish: data[0].spans
        var first = raw.data[0];
        raw = first && Array.isArray(first.spans) ? first.spans : null;
      } else if (raw && typeof raw === 'object' && raw.spanId) {
        raw = [raw];
      } else {
        return { error: 'Expected a JSON array of spans (or { spans: [...] } / Jaeger data[].spans).' };
      }
    }
    if (!raw || !raw.length) return { error: 'Span array is empty.' };
    var spans = raw.map(normalizeSpan);
    return { spans: spans };
  }

  function buildTree(spans) {
    var byId = {};
    spans.forEach(function (s) { byId[s.spanId] = s; });
    var children = {};
    spans.forEach(function (s) {
      var parent = s.parentSpanId;
      if (parent && byId[parent]) {
        if (!children[parent]) children[parent] = [];
        children[parent].push(s);
      }
    });
    Object.keys(children).forEach(function (k) {
      children[k].sort(function (a, b) { return a.startNs - b.startNs; });
    });
    var roots = spans.filter(function (s) {
      return !s.parentSpanId || !byId[s.parentSpanId];
    }).sort(function (a, b) { return a.startNs - b.startNs; });
    return { byId: byId, children: children, roots: roots };
  }

  function computeCriticalPath(tree) {
    var best = { durationMs: 0, path: [] };

    if (!tree.roots.length && tree.byId) {
      var all = Object.keys(tree.byId).map(function (k) { return tree.byId[k]; });
      all.sort(function (a, b) { return b.durationMs - a.durationMs; });
      if (all[0]) best = { durationMs: all[0].durationMs, path: [all[0]] };
      return best;
    }

    // Longest root-to-leaf by wall time (leaf.end - root.start)
    tree.roots.forEach(function (root) {
      (function walk(span, path) {
        var kids = tree.children[span.spanId] || [];
        var p = path.concat([span]);
        if (!kids.length) {
          var wall = (span.endNs - root.startNs) / 1e6;
          if (wall >= best.durationMs) {
            best = { durationMs: wall, path: p.slice() };
          }
          return;
        }
        kids.forEach(function (c) { walk(c, p); });
      })(root, []);
    });

    return best;
  }

  function detectCascadingTimeouts(tree, spans) {
    var findings = [];
    spans.forEach(function (span) {
      if (!span.isError) return;
      var kids = tree.children[span.spanId] || [];
      var errorKids = kids.filter(function (k) { return k.isError; });
      if (errorKids.length) {
        findings.push({
          type: 'timeout',
          title: 'Cascading RPC timeout at ' + span.name,
          body: 'Service "' + span.serviceName + '" failed with ' + errorKids.length +
            ' error child span(s): ' + errorKids.map(function (k) { return k.name + ' (' + k.serviceName + ')'; }).join(', ') +
            '. Likely deadline propagation / cascading failure.'
        });
      } else if (/rpc|http|grpc|client/i.test(span.name) || /service$/i.test(span.serviceName)) {
        findings.push({
          type: 'timeout',
          title: 'Error span: ' + span.name,
          body: 'Status error on "' + span.serviceName + '" (' + span.durationMs.toFixed(1) + ' ms). Check timeouts and retries.'
        });
      }
    });
    return findings;
  }

  function normalizeDbName(name) {
    return String(name || '')
      .replace(/\s+/g, ' ')
      .replace(/\d+/g, '#')
      .replace(/\{[^}]+\}/g, '{id}')
      .trim()
      .toLowerCase();
  }

  function detectNPlusOne(tree, spans) {
    var findings = [];
    spans.forEach(function (parent) {
      var kids = tree.children[parent.spanId] || [];
      var dbKids = kids.filter(function (k) {
        return /^db\b/i.test(k.name) || /\b(select|insert|update|delete|query)\b/i.test(k.name) ||
          /db|postgres|mysql|mongo|redis|sql/i.test(k.serviceName);
      });
      if (dbKids.length < 4) return;
      var groups = {};
      dbKids.forEach(function (k) {
        var key = normalizeDbName(k.name);
        if (!groups[key]) groups[key] = [];
        groups[key].push(k);
      });
      Object.keys(groups).forEach(function (key) {
        if (groups[key].length >= 4) {
          var sample = groups[key][0];
          findings.push({
            type: 'nplus1',
            title: 'N+1 pattern under ' + parent.name,
            body: groups[key].length + ' similar DB spans ("' + sample.name + '") under parent "' +
              parent.name + '" on ' + parent.serviceName +
              '. Batch/join queries or use a DataLoader instead of per-item fetches.'
          });
        }
      });
    });
    return findings;
  }

  function buildRemediations(bottlenecks, critical) {
    var tips = [];
    var hasCascade = bottlenecks.some(function (b) { return b.type === 'timeout'; });
    var hasN1 = bottlenecks.some(function (b) { return b.type === 'nplus1'; });

    if (hasCascade) {
      tips.push({
        type: 'remediation',
        title: 'Contain cascading timeouts',
        body:
          '• Set explicit per-hop deadlines shorter than the parent budget.\n' +
          '• Use bulkheads / circuit breakers so Region.Sync failures fail fast.\n' +
          '• Prefer hedged requests only on idempotent reads.\n' +
          'AI note: Propagate a remaining-deadline budget (e.g. grpc-timeout) instead of fixed long timeouts.'
      });
    }
    if (hasN1) {
      tips.push({
        type: 'remediation',
        title: 'Eliminate N+1 DB access',
        body:
          '• Replace repeated "DB SELECT product" with one IN (...) / JOIN.\n' +
          '• Add caching for hot product rows within the request scope.\n' +
          '• Instrument ORM query counts in CI to catch regressions.\n' +
          'AI note: If GraphQL or nested serializers caused this, introduce batching (DataLoader).'
      });
    }
    if (critical && critical.path && critical.path.length) {
      var heavy = critical.path.slice().sort(function (a, b) { return b.durationMs - a.durationMs; })[0];
      tips.push({
        type: 'remediation',
        title: 'Optimize critical path hotspot',
        body:
          'Longest span on the critical path: "' + heavy.name + '" @ ' + heavy.serviceName +
          ' (' + heavy.durationMs.toFixed(1) + ' ms).\n' +
          '• Profile that service, add caching, or move work off the request path.\n' +
          '• Consider parallelizing independent siblings instead of sequential RPC chains.\n' +
          'AI note: Critical path wall time is ' + critical.durationMs.toFixed(1) + ' ms — target p95 under your SLO.'
      });
    }
    if (!tips.length) {
      tips.push({
        type: 'remediation',
        title: 'Trace looks healthy',
        body: 'AI note: No cascading timeouts or N+1 patterns detected. Keep watching critical-path growth as traffic increases.'
      });
    }
    return tips;
  }

  function passesFilters(span) {
    var service = $('filterService').value;
    var status = $('filterStatus').value;
    var minMs = toNumber($('filterMinLatency').value) || 0;
    if (service && span.serviceName !== service) return false;
    if (status === 'ok' && span.isError) return false;
    if (status === 'error' && !span.isError) return false;
    if (span.durationMs < minMs) return false;
    return true;
  }

  function populateServiceFilter(spans) {
    var select = $('filterService');
    var current = select.value;
    var services = [];
    spans.forEach(function (s) {
      if (services.indexOf(s.serviceName) === -1) services.push(s.serviceName);
    });
    services.sort();
    select.innerHTML = '<option value="">All services</option>';
    services.forEach(function (svc) {
      var opt = document.createElement('option');
      opt.value = svc;
      opt.textContent = svc;
      select.appendChild(opt);
    });
    if (current && services.indexOf(current) !== -1) select.value = current;
  }

  function renderCriticalPath(critical) {
    var ol = $('criticalPathList');
    ol.innerHTML = '';
    if (!critical.path.length) {
      var li = document.createElement('li');
      li.textContent = 'No critical path computed.';
      ol.appendChild(li);
      return;
    }
    critical.path.forEach(function (span) {
      var li = document.createElement('li');
      li.innerHTML = '';
      var text = document.createTextNode(span.serviceName + ' · ' + span.name + ' ');
      var ms = document.createElement('span');
      ms.className = 'trace-ms';
      ms.textContent = span.durationMs.toFixed(1) + ' ms';
      li.appendChild(text);
      li.appendChild(ms);
      ol.appendChild(li);
    });
  }

  function renderWaterfall(spans, criticalIds) {
    var root = $('waterfall');
    root.innerHTML = '';
    var filtered = spans.filter(passesFilters).slice().sort(function (a, b) { return a.startNs - b.startNs; });
    if (!filtered.length) {
      root.innerHTML = '<p class="trace-hint">No spans match the current filters.</p>';
      return;
    }
    var minStart = filtered.reduce(function (m, s) { return Math.min(m, s.startNs); }, filtered[0].startNs);
    var maxEnd = filtered.reduce(function (m, s) { return Math.max(m, s.endNs); }, filtered[0].endNs);
    var windowNs = Math.max(1, maxEnd - minStart);

    filtered.forEach(function (span) {
      var row = document.createElement('div');
      row.className = 'trace-wf-row';

      var label = document.createElement('div');
      label.className = 'trace-wf-label';
      label.innerHTML = '<strong></strong><span></span>';
      label.querySelector('strong').textContent = span.name;
      label.querySelector('span').textContent = span.serviceName;
      label.title = span.name + ' · ' + span.serviceName;

      var track = document.createElement('div');
      track.className = 'trace-wf-track';
      var bar = document.createElement('div');
      bar.className = 'trace-wf-bar';
      if (span.isError) bar.classList.add('is-error');
      else if (/^db\b/i.test(span.name) || /db|sql|mongo|redis/i.test(span.serviceName)) bar.classList.add('is-db');
      else bar.classList.add('is-ok');
      if (criticalIds[span.spanId]) bar.classList.add('is-critical');

      var left = ((span.startNs - minStart) / windowNs) * 100;
      var width = Math.max(0.4, (span.durationNs / windowNs) * 100);
      bar.style.left = left + '%';
      bar.style.width = width + '%';
      bar.textContent = span.durationMs >= 1 ? span.durationMs.toFixed(0) + 'ms' : span.durationMs.toFixed(1) + 'ms';
      bar.title = span.name + ' — ' + span.durationMs.toFixed(2) + ' ms';

      track.appendChild(bar);
      row.appendChild(label);
      row.appendChild(track);
      root.appendChild(row);
    });
  }

  function renderFindings(list, ul, badgeClassFor) {
    ul.innerHTML = '';
    if (!list.length) {
      var empty = document.createElement('li');
      empty.className = 'trace-finding';
      empty.innerHTML = '<p class="trace-finding-body">None detected.</p>';
      ul.appendChild(empty);
      return;
    }
    list.forEach(function (f) {
      var li = document.createElement('li');
      li.className = 'trace-finding is-' + f.type;
      var badge = badgeClassFor(f);
      li.innerHTML = '<span class="trace-badge ' + badge.cls + '">' + badge.label + '</span>' +
        '<p class="trace-finding-title"></p><p class="trace-finding-body"></p>';
      li.querySelector('.trace-finding-title').textContent = f.title;
      li.querySelector('.trace-finding-body').textContent = f.body;
      ul.appendChild(li);
    });
  }

  function setStatus(msg, kind) {
    var el = $('traceStatus');
    el.textContent = msg || '';
    el.className = 'trace-status' + (kind ? ' is-' + kind : '');
  }

  function updateHero(spanCount, criticalMs, bottleneckCount) {
    $('statSpans').textContent = String(spanCount);
    $('statCriticalMs').textContent = criticalMs == null ? '—' : String(Math.round(criticalMs));
    $('statBottlenecks').textContent = String(bottleneckCount);
  }

  function analyze() {
    var parsed = parseSpans($('traceJson').value);
    if (parsed.error) {
      setStatus(parsed.error, 'error');
      return;
    }
    allSpans = parsed.spans;
    populateServiceFilter(allSpans);
    var tree = buildTree(allSpans);
    var critical = computeCriticalPath(tree);
    var timeouts = detectCascadingTimeouts(tree, allSpans);
    var nplus1 = detectNPlusOne(tree, allSpans);
    var bottlenecks = timeouts.concat(nplus1);
    var remediations = buildRemediations(bottlenecks, critical);

    var criticalIds = {};
    critical.path.forEach(function (s) { criticalIds[s.spanId] = true; });

    lastAnalysis = {
      generatedAt: new Date().toISOString(),
      spanCount: allSpans.length,
      criticalPathMs: critical.durationMs,
      criticalPath: critical.path.map(function (s) {
        return { name: s.name, service: s.serviceName, ms: s.durationMs };
      }),
      bottlenecks: bottlenecks,
      remediations: remediations
    };

    $('traceEmpty').hidden = true;
    $('traceResults').hidden = false;
    renderCriticalPath(critical);
    renderWaterfall(allSpans, criticalIds);
    renderFindings(bottlenecks, $('bottleneckList'), function (f) {
      return f.type === 'nplus1'
        ? { cls: 'trace-badge-nplus1', label: 'N+1' }
        : { cls: 'trace-badge-timeout', label: 'Timeout' };
    });
    renderFindings(remediations, $('remediationList'), function () {
      return { cls: 'trace-badge-fix', label: 'AI fix' };
    });
    updateHero(allSpans.length, critical.durationMs, bottlenecks.length);
    $('exportTraceBtn').disabled = false;
    setStatus('Analyzed ' + allSpans.length + ' spans. Critical path ≈ ' + critical.durationMs.toFixed(1) + ' ms.', 'ok');
  }

  function reapplyFilters() {
    if (!lastAnalysis || !allSpans.length) return;
    var criticalIds = {};
    var tree = buildTree(allSpans);
    var critical = computeCriticalPath(tree);
    critical.path.forEach(function (s) { criticalIds[s.spanId] = true; });
    renderWaterfall(allSpans, criticalIds);
  }

  function exportSummary() {
    if (!lastAnalysis) return;
    var lines = [];
    lines.push('# Distributed Tracing Analysis Summary');
    lines.push('');
    lines.push('- Generated: ' + lastAnalysis.generatedAt);
    lines.push('- Total spans: ' + lastAnalysis.spanCount);
    lines.push('- Critical path: ' + Math.round(lastAnalysis.criticalPathMs) + ' ms');
    lines.push('- Bottlenecks: ' + lastAnalysis.bottlenecks.length);
    lines.push('');
    lines.push('## Critical path');
    lastAnalysis.criticalPath.forEach(function (s, i) {
      lines.push((i + 1) + '. ' + s.service + ' · ' + s.name + ' (' + s.ms.toFixed(1) + ' ms)');
    });
    lines.push('');
    lines.push('## Bottlenecks');
    lastAnalysis.bottlenecks.forEach(function (b) {
      lines.push('- [' + b.type + '] ' + b.title + ': ' + b.body.replace(/\n/g, ' '));
    });
    if (!lastAnalysis.bottlenecks.length) lines.push('- None');
    lines.push('');
    lines.push('## AI remediation suggestions');
    lastAnalysis.remediations.forEach(function (r) {
      lines.push('### ' + r.title);
      lines.push(r.body);
      lines.push('');
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'trace-analysis-summary.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function loadDemo() {
    $('traceJson').value = JSON.stringify(DEMO_TRACE, null, 2);
    setStatus('Demo trace loaded: cascading timeout chain + N+1 DB SELECT product pattern.', 'ok');
  }

  function clearAll() {
    $('traceJson').value = '';
    allSpans = [];
    lastAnalysis = null;
    $('traceEmpty').hidden = false;
    $('traceResults').hidden = true;
    $('exportTraceBtn').disabled = true;
    $('filterService').innerHTML = '<option value="">All services</option>';
    $('filterStatus').value = '';
    $('filterMinLatency').value = '0';
    updateHero(0, null, 0);
    setStatus('');
  }

  function init() {
    $('loadDemoTraceBtn').addEventListener('click', loadDemo);
    $('analyzeTraceBtn').addEventListener('click', analyze);
    $('clearTraceBtn').addEventListener('click', clearAll);
    $('exportTraceBtn').addEventListener('click', exportSummary);
    $('filterService').addEventListener('change', reapplyFilters);
    $('filterStatus').addEventListener('change', reapplyFilters);
    $('filterMinLatency').addEventListener('input', reapplyFilters);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
