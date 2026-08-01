(function () {
  'use strict';

  var lastReport = null;

  
  var PROJECTION_SNIPPET =
    "const projection = {\n" +
    "  when('OrderPlaced', (state, e) => ({ ...state, status: 'placed', total: e.payload.total })),\n" +
    "  when('OrderPaid', (state, e) => ({ ...state, status: 'paid', paidAt: e.timestamp })),\n" +
    "  // missing: OrderCancelled, PaymentRefunded\n" +
    "  on(OrderShipped, (state, e) => ({ ...state, status: 'shipped', tracking: e.payload.tracking })),\n" +
    "};\n\n" +
    "// Dual-write smell (do not do this):\n" +
    "// await db.orders.insert(order);\n" +
    "// await bus.publish(new OrderPlaced(order));\n";

  var PRESETS = {
    skipped: {
      events: [
        { eventId: 'e1', aggregateId: 'ord-100', type: 'OrderPlaced', sequence: 1, timestamp: '2026-03-01T10:00:00Z', payload: { total: 49.99 } },
        { eventId: 'e2', aggregateId: 'ord-100', type: 'OrderPaid', sequence: 2, timestamp: '2026-03-01T10:01:00Z', payload: { method: 'card' } },
        { eventId: 'e4', aggregateId: 'ord-100', type: 'OrderShipped', sequence: 4, timestamp: '2026-03-01T12:00:00Z', payload: { tracking: 'TRK-9' } },
        { eventId: 'e5', aggregateId: 'ord-100', type: 'OrderDelivered', sequence: 5, timestamp: '2026-03-02T09:00:00Z', payload: {} },
        { eventId: 'e1b', aggregateId: 'ord-200', type: 'OrderPlaced', sequence: 1, timestamp: '2026-03-01T11:00:00Z', payload: { total: 12 } },
        { eventId: 'e3b', aggregateId: 'ord-200', type: 'OrderCancelled', sequence: 3, timestamp: '2026-03-01T11:30:00Z', payload: { reason: 'fraud' } }
      ],
      projection: PROJECTION_SNIPPET
    },
    ooo: {
      events: [
        { eventId: 'e1', aggregateId: 'cart-7', type: 'ItemAdded', sequence: 1, timestamp: '2026-03-01T10:00:00Z', payload: { sku: 'A' } },
        { eventId: 'e3', aggregateId: 'cart-7', type: 'CheckoutStarted', sequence: 3, timestamp: '2026-03-01T10:02:00Z', payload: {} },
        { eventId: 'e2', aggregateId: 'cart-7', type: 'ItemAdded', sequence: 2, timestamp: '2026-03-01T10:01:00Z', payload: { sku: 'B' } },
        { eventId: 'e4', aggregateId: 'cart-7', type: 'OrderPlaced', sequence: 4, timestamp: '2026-03-01T10:03:00Z', payload: { total: 30 } },
        { eventId: 'e5', aggregateId: 'cart-7', type: 'OrderPaid', sequence: 5, timestamp: '2026-03-01T10:04:00Z', payload: {} }
      ],
      projection:
        "when('ItemAdded', reduce);\n" +
        "when('CheckoutStarted', reduce);\n" +
        "when('OrderPlaced', reduce);\n" +
        "when('OrderPaid', reduce);\n"
    },
    duplicates: {
      events: [
        { eventId: 'pay-1', aggregateId: 'pay-88', type: 'PaymentAuthorized', sequence: 1, timestamp: '2026-03-01T10:00:00Z', payload: { amount: 100 } },
        { eventId: 'pay-2', aggregateId: 'pay-88', type: 'PaymentCaptured', sequence: 2, timestamp: '2026-03-01T10:01:00Z', payload: { amount: 100 } },
        { eventId: 'pay-2-retry', aggregateId: 'pay-88', type: 'PaymentCaptured', sequence: 2, timestamp: '2026-03-01T10:01:05Z', payload: { amount: 100 } },
        { eventId: 'pay-1-dup', aggregateId: 'pay-88', type: 'PaymentAuthorized', sequence: 1, timestamp: '2026-03-01T10:00:02Z', payload: { amount: 100 } },
        { eventId: 'pay-3', aggregateId: 'pay-88', type: 'ReceiptEmailed', sequence: 3, timestamp: '2026-03-01T10:02:00Z', payload: {} }
      ],
      projection:
        "handles(PaymentAuthorized);\n" +
        "handles(PaymentCaptured);\n" +
        "handles(ReceiptEmailed);\n"
    },
    dualwrite: {
      events: [
        {
          eventId: 'dw-1',
          aggregateId: 'user-42',
          type: 'UserRegistered',
          sequence: 1,
          timestamp: '2026-03-01T09:00:00Z',
          payload: { email: 'a@b.co' },
          writes: { db: 'users.insert', bus: 'UserRegistered.publish' }
        },
        {
          eventId: 'dw-2',
          aggregateId: 'user-42',
          type: 'ProfileUpdated',
          sequence: 2,
          timestamp: '2026-03-01T09:05:00Z',
          payload: { name: 'Ada' },
          writes: { db: 'users.update', cache: 'profile.set', bus: 'ProfileUpdated.publish' }
        },
        {
          eventId: 'dw-3',
          aggregateId: 'inv-9',
          type: 'StockReserved',
          sequence: 1,
          timestamp: '2026-03-01T09:10:00Z',
          payload: { qty: 2 },
          writes: { db: 'inventory.decrement', search: 'products.reindex' }
        }
      ],
      projection:
        PROJECTION_SNIPPET +
        "\n// Also in service:\n" +
        "await db.users.insert(user);\n" +
        "await eventBus.publish(new UserRegistered(user));\n" +
        "await cache.set('user:' + user.id, user);\n"
    }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, kind) {
    var el = $('cqrsStatus');
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

  function seqOf(ev) {
    var n = ev.sequence != null ? Number(ev.sequence) : Number(ev.version);
    return Number.isFinite(n) ? n : null;
  }

  function parseEvents(raw) {
    var data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      if (data && Array.isArray(data.events)) data = data.events;
      else throw new Error('Event log must be a JSON array (or { "events": [...] }).');
    }
    return data.map(function (ev, i) {
      if (!ev || typeof ev !== 'object') {
        throw new Error('Event at index ' + i + ' is not an object.');
      }
      var type = ev.type || ev.eventType || ev.name;
      var aggregateId = ev.aggregateId || ev.streamId || ev.entityId || 'unknown';
      var eventId = ev.eventId || ev.id || ('idx-' + i);
      return {
        eventId: String(eventId),
        aggregateId: String(aggregateId),
        type: type ? String(type) : 'UnknownEvent',
        sequence: seqOf(ev),
        timestamp: ev.timestamp || ev.occurredAt || null,
        payload: ev.payload || ev.data || null,
        writes: ev.writes || null,
        raw: ev
      };
    });
  }

  function extractHandlers(code) {
    var handlers = {};
    var text = String(code || '');
    if (!text.trim()) return { list: [], source: 'empty' };

    try {
      var maybeJson = JSON.parse(text);
      if (Array.isArray(maybeJson)) {
        maybeJson.forEach(function (t) {
          if (t) handlers[String(t)] = true;
        });
        return { list: Object.keys(handlers), source: 'json' };
      }
      if (maybeJson && Array.isArray(maybeJson.handlers)) {
        maybeJson.handlers.forEach(function (t) {
          if (t) handlers[String(t)] = true;
        });
        return { list: Object.keys(handlers), source: 'json' };
      }
    } catch (e) {
      /* not JSON — continue with regex */
    }

    var patterns = [
      /\bwhen\s*\(\s*['"]([A-Za-z_][\w]*)['"]/g,
      /\bon\s*\(\s*([A-Za-z_][\w]*)\s*[,)]/g,
      /\bhandles?\s*\(\s*([A-Za-z_][\w]*)\s*\)/g,
      /\bcase\s+['"]([A-Za-z_][\w]*)['"]\s*:/g,
      /\bsubscribe\s*\(\s*['"]([A-Za-z_][\w]*)['"]/g,
      /eventType\s*[:=]\s*['"]([A-Za-z_][\w]*)['"]/g
    ];

    patterns.forEach(function (re) {
      var m;
      while ((m = re.exec(text)) !== null) {
        handlers[m[1]] = true;
      }
    });

    return { list: Object.keys(handlers), source: 'code' };
  }

  function detectDualWriteInCode(code) {
    var findings = [];
    var text = String(code || '');
    var hasDb = /\b(db|repository|orm|prisma|sequelize|knex)\b[\s\S]{0,80}\.(insert|update|save|create|write)\b/i.test(text);
    var hasBus = /\b(bus|eventBus|publisher|outbox|kafka|sns|rabbit)\b[\s\S]{0,80}\.(publish|send|emit|produce)\b/i.test(text);
    var hasCache = /\b(cache|redis|memcached)\b[\s\S]{0,60}\.(set|setex|hset|put)\b/i.test(text);

    if (hasDb && hasBus) {
      findings.push({
        severity: 'high',
        title: 'DB write + message publish in same flow',
        body: 'Projection/service code appears to write to a database and publish an event without an outbox. Partial failures create read-model divergence.'
      });
    }
    if (hasDb && hasCache) {
      findings.push({
        severity: 'medium',
        title: 'DB + cache dual write',
        body: 'Updating DB and cache in one path risks stale cache if either side fails. Prefer cache-aside invalidation from the event stream.'
      });
    }
    if (/dual[- ]?write/i.test(text)) {
      findings.push({
        severity: 'info',
        title: 'Dual-write mentioned in comments',
        body: 'Comments acknowledge dual-write — treat as a known hazard and migrate toward transactional outbox.'
      });
    }
    return findings;
  }

  function analyzeStream(events) {
    var byAgg = {};
    var gaps = [];
    var ooo = [];
    var dups = [];
    var viz = {};

    events.forEach(function (ev, idx) {
      if (!byAgg[ev.aggregateId]) byAgg[ev.aggregateId] = [];
      byAgg[ev.aggregateId].push({ ev: ev, idx: idx });
    });

    Object.keys(byAgg).forEach(function (agg) {
      var items = byAgg[agg];
      var seqs = items.map(function (x) { return x.ev.sequence; });
      var seenIds = {};
      var seenSeq = {};
      var chips = [];
      var lastSeen = null;
      var ordered = items.slice().sort(function (a, b) {
        var sa = a.ev.sequence;
        var sb = b.ev.sequence;
        if (sa == null && sb == null) return a.idx - b.idx;
        if (sa == null) return 1;
        if (sb == null) return -1;
        return sa - sb || a.idx - b.idx;
      });

      items.forEach(function (item) {
        var ev = item.ev;
        if (seenIds[ev.eventId]) {
          dups.push({
            kind: 'eventId',
            aggregateId: agg,
            eventId: ev.eventId,
            type: ev.type,
            detail: 'Duplicate eventId "' + ev.eventId + '" on ' + agg
          });
        }
        seenIds[ev.eventId] = true;

        if (ev.sequence != null) {
          if (seenSeq[ev.sequence]) {
            dups.push({
              kind: 'sequence',
              aggregateId: agg,
              eventId: ev.eventId,
              type: ev.type,
              detail: 'Duplicate sequence ' + ev.sequence + ' on ' + agg + ' (' + ev.type + ')'
            });
            chips.push({ seq: ev.sequence, state: 'dup', label: String(ev.sequence) });
          } else {
            seenSeq[ev.sequence] = true;
          }

          if (lastSeen != null && item.idx > 0) {
            var prev = items[items.indexOf(item) - 1];
            /* arrival order vs sequence — check stream order as pasted */
          }
        }
      });

      /* Arrival (paste) order vs sequence */
      var arrivalSeqs = items.map(function (x) { return x.ev.sequence; }).filter(function (s) { return s != null; });
      for (var i = 1; i < arrivalSeqs.length; i++) {
        if (arrivalSeqs[i] < arrivalSeqs[i - 1]) {
          ooo.push({
            aggregateId: agg,
            detail: 'Out-of-order arrival on ' + agg + ': sequence ' + arrivalSeqs[i] + ' arrived after ' + arrivalSeqs[i - 1]
          });
          break;
        }
      }

      var numeric = ordered
        .map(function (x) { return x.ev.sequence; })
        .filter(function (s) { return s != null; });

      if (numeric.length) {
        var min = Math.min.apply(null, numeric);
        var max = Math.max.apply(null, numeric);
        var present = {};
        numeric.forEach(function (s) { present[s] = true; });

        for (var s = min; s <= max; s++) {
          if (!present[s]) {
            gaps.push({
              aggregateId: agg,
              sequence: s,
              detail: 'Missing sequence ' + s + ' on aggregate ' + agg + ' (gap between ' + min + '–' + max + ')'
            });
            chips.push({ seq: s, state: 'gap', label: String(s) + '?' });
          } else if (!chips.some(function (c) { return c.seq === s && c.state === 'dup'; })) {
            var isOooChip = false;
            /* mark if this seq appeared before a lower one in arrival */
            chips.push({ seq: s, state: 'ok', label: String(s) });
          }
        }

        /* Mark OOO chips from arrival */
        var seenMax = -Infinity;
        items.forEach(function (item) {
          var seq = item.ev.sequence;
          if (seq == null) return;
          if (seq < seenMax) {
            chips.forEach(function (c) {
              if (c.seq === seq && c.state === 'ok') c.state = 'ooo';
            });
          }
          if (seq > seenMax) seenMax = seq;
        });
      } else {
        items.forEach(function (item, i2) {
          chips.push({ seq: i2 + 1, state: 'ok', label: '?' });
        });
        gaps.push({
          aggregateId: agg,
          sequence: null,
          detail: 'No sequence/version fields on ' + agg + ' — gap analysis limited to eventId duplicates.'
        });
      }

      viz[agg] = chips.sort(function (a, b) { return a.seq - b.seq; });
    });

    return { gaps: gaps, ooo: ooo, dups: dups, viz: viz, aggregates: Object.keys(byAgg).length };
  }

  function scoreRisk(analysis, missingHandlers, dualFindings) {
    var score = 0;
    score += analysis.gaps.filter(function (g) { return g.sequence != null; }).length * 18;
    score += analysis.ooo.length * 14;
    score += analysis.dups.length * 12;
    score += missingHandlers.length * 10;
    score += dualFindings.length * 15;
    if (score > 100) score = 100;
    var band = score < 30 ? 'low' : score < 65 ? 'mid' : 'high';
    return { score: score, band: band };
  }

  function buildCoach(risk, analysis, missingHandlers) {
    var gapCount = analysis.gaps.filter(function (g) { return g.sequence != null; }).length;
    var strategy;
    var steps;

    if (risk.score >= 65 || gapCount >= 3 || missingHandlers.length >= 2) {
      strategy = 'Prefer full rebuild';
      steps = [
        'Freeze consumers or switch to a new projection version (vN+1).',
        'Replay the full event store from origin (or last snapshot) into a fresh read model.',
        'Validate row counts / checksums against aggregates before cutover.',
        'Only then retire the old projection — catch-up alone will not heal structural gaps.'
      ];
    } else if (risk.score >= 30 || gapCount >= 1 || analysis.ooo.length) {
      strategy = 'Catch-up with selective rebuild';
      steps = [
        'Replay only affected aggregates from the first gap sequence.',
        'Buffer out-of-order events until the expected sequence arrives (or timeout → alert).',
        'Idempotently apply duplicates (upsert by eventId).',
        'Schedule a weekend full rebuild if gap rate stays elevated.'
      ];
    } else {
      strategy = 'Stay on catch-up';
      steps = [
        'Continue live subscription with idempotent handlers.',
        'Keep sequence checkpoints per aggregate.',
        'Alert on any gap &gt; 1 or dual-write signals in deploy diffs.',
        'Periodic sampling rebuild for confidence, not emergency recovery.'
      ];
    }

    return { strategy: strategy, steps: steps };
  }

  function findingHtml(badgeClass, badgeLabel, title, body, extraClass) {
    return (
      '<li class="cqrs-finding ' + (extraClass || '') + '">' +
      '<span class="cqrs-badge ' + badgeClass + '">' + escapeHtml(badgeLabel) + '</span>' +
      '<p class="cqrs-finding-title">' + escapeHtml(title) + '</p>' +
      '<p class="cqrs-finding-body">' + body + '</p>' +
      '</li>'
    );
  }

  function renderViz(viz) {
    var root = $('cqrsStreamViz');
    var aggs = Object.keys(viz);
    if (!aggs.length) {
      root.innerHTML = '<p class="cqrs-muted">No aggregates to visualize.</p>';
      return;
    }
    root.innerHTML = aggs.map(function (agg) {
      var chips = viz[agg].map(function (c) {
        return '<span class="cqrs-seq-chip is-' + c.state + '" title="' + escapeHtml(c.state) + '">' +
          escapeHtml(c.label) + '</span>';
      }).join('');
      return (
        '<div class="cqrs-agg-row">' +
        '<div class="cqrs-agg-label" title="' + escapeHtml(agg) + '">' + escapeHtml(agg) + '</div>' +
        '<div class="cqrs-seq-track">' + chips + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function updateHero(events, issueCount, riskLabel) {
    $('statEvents').textContent = String(events.length);
    $('statIssues').textContent = String(issueCount);
    $('statRisk').textContent = riskLabel;
  }

  function loadPreset(name) {
    var preset = PRESETS[name];
    if (!preset) return;
    $('cqrsEventLog').value = JSON.stringify(preset.events, null, 2);
    $('cqrsProjectionCode').value = preset.projection;
    setStatus('Loaded "' + name + '" demo preset. Click Analyze consistency.', 'is-ok');
  }

  function runAnalysis() {
    var rawEvents = $('cqrsEventLog').value.trim();
    var code = $('cqrsProjectionCode').value;
    if (!rawEvents) {
      setStatus('Paste an event log JSON array (or load a demo preset).', 'is-error');
      return;
    }

    var events;
    try {
      events = parseEvents(rawEvents);
    } catch (err) {
      setStatus(err.message || 'Invalid event JSON.', 'is-error');
      return;
    }

    var stream = analyzeStream(events);
    var handlers = extractHandlers(code);
    var eventTypes = {};
    events.forEach(function (e) { eventTypes[e.type] = true; });
    var typeList = Object.keys(eventTypes);
    var missingHandlers = [];
    if (handlers.list.length) {
      typeList.forEach(function (t) {
        if (handlers.list.indexOf(t) === -1) {
          missingHandlers.push(t);
        }
      });
    } else if (code.trim()) {
      missingHandlers = typeList.slice();
    }

    var dualFromEvents = [];
    events.forEach(function (ev) {
      if (!ev.writes || typeof ev.writes !== 'object') return;
      var keys = Object.keys(ev.writes);
      if (keys.length >= 2) {
        dualFromEvents.push({
          eventId: ev.eventId,
          aggregateId: ev.aggregateId,
          type: ev.type,
          targets: keys,
          detail: ev.type + ' (' + ev.eventId + ') writes to: ' + keys.join(', ')
        });
      }
    });
    var dualFromCode = detectDualWriteInCode(code);
    var dualAll = dualFromEvents.length + dualFromCode.length;

    var risk = scoreRisk(stream, missingHandlers, dualFromCode.concat(
      dualFromEvents.map(function () { return { severity: 'high' }; })
    ));
    var coach = buildCoach(risk, stream, missingHandlers);

    var issueCount =
      stream.gaps.filter(function (g) { return g.sequence != null; }).length +
      stream.ooo.length +
      stream.dups.length +
      missingHandlers.length +
      dualAll;

    lastReport = {
      generatedAt: new Date().toISOString(),
      eventCount: events.length,
      aggregates: stream.aggregates,
      divergenceRisk: risk,
      gaps: stream.gaps,
      outOfOrder: stream.ooo,
      duplicates: stream.dups,
      missingHandlers: missingHandlers,
      handlersFound: handlers.list,
      dualWriteEvents: dualFromEvents,
      dualWriteCode: dualFromCode,
      strategy: coach,
      events: events.map(function (e) {
        return {
          eventId: e.eventId,
          aggregateId: e.aggregateId,
          type: e.type,
          sequence: e.sequence,
          timestamp: e.timestamp
        };
      })
    };

    /* Render */
    $('cqrsEmpty').hidden = true;
    $('cqrsResults').hidden = false;
    $('cqrsExportBtn').disabled = false;

    $('cqrsScoreVal').textContent = String(risk.score);
    var ring = $('cqrsScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add('is-' + risk.band);
    $('cqrsRiskBlurb').textContent =
      risk.band === 'high'
        ? 'High divergence risk — projections likely diverge from the write model.'
        : risk.band === 'mid'
          ? 'Elevated risk — repair gaps and harden handlers before traffic grows.'
          : 'Low risk — keep idempotent catch-up and monitor for new gaps.';

    renderViz(stream.viz);

    var gapList = $('cqrsGapList');
    var gapItems = [];
    stream.gaps.forEach(function (g) {
      gapItems.push(findingHtml('cqrs-badge-gap', 'Gap', 'Sequence gap', escapeHtml(g.detail), 'is-gap'));
    });
    stream.ooo.forEach(function (o) {
      gapItems.push(findingHtml('cqrs-badge-ooo', 'Out-of-order', 'Ordering anomaly', escapeHtml(o.detail), 'is-ooo'));
    });
    stream.dups.forEach(function (d) {
      gapItems.push(findingHtml('cqrs-badge-dup', 'Duplicate', 'Duplicate delivery', escapeHtml(d.detail), 'is-dup'));
    });
    if (!gapItems.length) {
      gapItems.push(findingHtml('cqrs-badge-gap', 'OK', 'Stream looks contiguous', 'No gaps, out-of-order arrivals, or duplicates detected in sequenced aggregates.', 'is-ok'));
    }
    gapList.innerHTML = gapItems.join('');

    var handlerList = $('cqrsHandlerList');
    if (!code.trim()) {
      handlerList.innerHTML = findingHtml(
        'cqrs-badge-handler',
        'Skipped',
        'No projection code provided',
        'Paste handler code or a JSON list of handled event types to detect missing projections.',
        'is-handler'
      );
    } else if (!handlers.list.length) {
      handlerList.innerHTML = findingHtml(
        'cqrs-badge-handler',
        'Warn',
        'No handlers recognized',
        'Could not extract when()/on()/handles()/case patterns. Event types in log: ' +
          escapeHtml(typeList.join(', ') || '(none)'),
        'is-handler'
      );
    } else if (!missingHandlers.length) {
      handlerList.innerHTML = findingHtml(
        'cqrs-badge-handler',
        'OK',
        'All event types have handlers',
        'Recognized handlers: ' + escapeHtml(handlers.list.join(', ')),
        'is-ok'
      );
    } else {
      handlerList.innerHTML = missingHandlers.map(function (t) {
        return findingHtml(
          'cqrs-badge-handler',
          'Missing',
          'No handler for ' + t,
          'Event type appears in the log but was not found in projection rules. Reads will silently ignore it.',
          'is-handler'
        );
      }).join('');
    }

    var dualList = $('cqrsDualList');
    var dualHtml = [];
    dualFromEvents.forEach(function (d) {
      dualHtml.push(findingHtml(
        'cqrs-badge-dual',
        'Dual-write',
        d.type + ' multi-target write',
        escapeHtml(d.detail) + '. Prefer a single transactional outbox as the source of truth.',
        'is-dual'
      ));
    });
    dualFromCode.forEach(function (d) {
      dualHtml.push(findingHtml(
        'cqrs-badge-dual',
        d.severity || 'Warn',
        d.title,
        escapeHtml(d.body),
        'is-dual'
      ));
    });
    if (!dualHtml.length) {
      dualHtml.push(findingHtml(
        'cqrs-badge-dual',
        'OK',
        'No dual-write signals',
        'No multi-target writes[] on events and no DB+bus/cache patterns in projection code.',
        'is-ok'
      ));
    }
    dualList.innerHTML = dualHtml.join('');

    var coachEl = $('cqrsCoach');
    coachEl.innerHTML =
      '<h4>' + escapeHtml(coach.strategy) + '</h4>' +
      '<p>Based on risk score <strong>' + risk.score + '</strong> (' + risk.band + '), ' +
      issueCount + ' issue(s), and ' + missingHandlers.length + ' missing handler(s).</p>' +
      '<ul>' + coach.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';

    updateHero(events, issueCount, risk.score + '/100');
    setStatus('Analysis complete — ' + issueCount + ' consistency issue(s), risk ' + risk.score + '/100.', 'is-ok');
  }

  function clearAll() {
    $('cqrsEventLog').value = '';
    $('cqrsProjectionCode').value = '';
    $('cqrsEmpty').hidden = false;
    $('cqrsResults').hidden = true;
    $('cqrsExportBtn').disabled = true;
    lastReport = null;
    updateHero([], 0, '—');
    setStatus('');
  }

  function exportReport() {
    if (!lastReport) return;
    var lines = [];
    lines.push('# CQRS Consistency Report');
    lines.push('Generated: ' + lastReport.generatedAt);
    lines.push('');
    lines.push('## Summary');
    lines.push('- Events: ' + lastReport.eventCount);
    lines.push('- Aggregates: ' + lastReport.aggregates);
    lines.push('- Divergence risk: ' + lastReport.divergenceRisk.score + '/100 (' + lastReport.divergenceRisk.band + ')');
    lines.push('- Strategy: ' + lastReport.strategy.strategy);
    lines.push('');
    lines.push('## Gaps');
    if (!lastReport.gaps.length) lines.push('- None');
    lastReport.gaps.forEach(function (g) { lines.push('- ' + g.detail); });
    lines.push('');
    lines.push('## Out-of-order');
    if (!lastReport.outOfOrder.length) lines.push('- None');
    lastReport.outOfOrder.forEach(function (o) { lines.push('- ' + o.detail); });
    lines.push('');
    lines.push('## Duplicates');
    if (!lastReport.duplicates.length) lines.push('- None');
    lastReport.duplicates.forEach(function (d) { lines.push('- ' + d.detail); });
    lines.push('');
    lines.push('## Missing projection handlers');
    if (!lastReport.missingHandlers.length) lines.push('- None');
    lastReport.missingHandlers.forEach(function (t) { lines.push('- ' + t); });
    lines.push('');
    lines.push('## Dual-write warnings');
    lastReport.dualWriteEvents.forEach(function (d) { lines.push('- EVENT: ' + d.detail); });
    lastReport.dualWriteCode.forEach(function (d) { lines.push('- CODE: ' + d.title + ' — ' + d.body); });
    if (!lastReport.dualWriteEvents.length && !lastReport.dualWriteCode.length) lines.push('- None');
    lines.push('');
    lines.push('## Strategy steps');
    lastReport.strategy.steps.forEach(function (s) { lines.push('- ' + s.replace(/&gt;/g, '>')); });
    lines.push('');
    lines.push('## Machine-readable JSON');
    lines.push('```json');
    lines.push(JSON.stringify(lastReport, null, 2));
    lines.push('```');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'cqrs-consistency-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Downloaded cqrs-consistency-report.md', 'is-ok');
  }

  function bind() {
    document.querySelectorAll('.cqrs-preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadPreset(btn.getAttribute('data-preset'));
      });
    });
    $('cqrsAnalyzeBtn').addEventListener('click', runAnalysis);
    $('cqrsClearBtn').addEventListener('click', clearAll);
    $('cqrsExportBtn').addEventListener('click', exportReport);

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
