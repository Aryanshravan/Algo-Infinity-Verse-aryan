(function () {
  'use strict';

  var STORAGE_KEY = 'saga-outbox-compensation-lab-progress';

  var MODULES = [
    {
      id: 'choreo-vs-orch',
      title: 'Choreography vs orchestration',
      short: 'Who coordinates?',
      html:
        '<p><strong>Orchestration</strong> uses a central saga coordinator that tells each service when to act and when to compensate. <strong>Choreography</strong> lets services react to each other\'s domain events without a single conductor.</p>' +
        '<ul>' +
        '<li>Orchestration: easier visibility and compensation order; coordinator can become a hotspot.</li>' +
        '<li>Choreography: looser coupling; harder to reason about global state and failure paths.</li>' +
        '<li>Pick orchestration when compensation graphs are complex or audits matter.</li>' +
        '<li>Use the simulator below in both modes to compare failure stories.</li>' +
        '</ul>'
    },
    {
      id: 'compensation',
      title: 'Compensation',
      short: 'Undo forward work',
      html:
        '<p>A <strong>compensating transaction</strong> semantically undoes a completed local step (release stock, refund charge) — it is not a distributed ACID rollback.</p>' +
        '<ul>' +
        '<li>Compensate in <strong>reverse</strong> order of successful forward steps.</li>' +
        '<li>Compensations must be designed for business meaning (refund ≠ delete charge row blindly).</li>' +
        '<li>Partial failures mid-compensation need retries with idempotency.</li>' +
        '<li>Never leave “half compensated” without a dead-letter / ops path.</li>' +
        '</ul>'
    },
    {
      id: 'idempotency',
      title: 'Idempotency',
      short: 'Safe retries',
      html:
        '<p>Network timeouts make at-least-once delivery the default. Every forward step and compensation must tolerate duplicate execution.</p>' +
        '<ul>' +
        '<li>Key compensations by <code>sagaId + step + attempt</code> or business natural keys.</li>' +
        '<li>Store “already compensated” markers before side effects when possible.</li>' +
        '<li>Replaying a compensation twice should be a no-op, not a double refund.</li>' +
        '<li>Toggle the simulator\'s idempotency probe to see unsafe vs safe outcomes.</li>' +
        '</ul>'
    },
    {
      id: 'dual-write',
      title: 'Dual-write hazard',
      short: 'DB + broker drift',
      html:
        '<p><strong>Dual-write</strong> updates a database and publishes a message in separate operations. Either can succeed alone → lost events or phantom messages.</p>' +
        '<ul>' +
        '<li>Classic failure: commit order row, crash before <code>publish(OrderCreated)</code>.</li>' +
        '<li>Inverse failure: publish then crash before commit → consumers act on ghosts.</li>' +
        '<li>Retries without idempotency amplify duplicates.</li>' +
        '<li>Prefer transactional outbox or CDC over ad-hoc dual-write.</li>' +
        '</ul>'
    },
    {
      id: 'outbox',
      title: 'Transactional outbox',
      short: 'Commit then relay',
      html:
        '<p>The <strong>transactional outbox</strong> writes business rows and an outbox row in the <em>same</em> DB transaction. A relay publishes outbox rows to the broker and marks them sent.</p>' +
        '<ul>' +
        '<li>Guarantees: if the business commit happened, the intent to publish is durable.</li>' +
        '<li>Relay must be idempotent toward the broker (dedupe keys).</li>' +
        '<li>Polling vs log-tailing CDC are both valid relay strategies.</li>' +
        '<li>Still need consumer idempotency — outbox solves producer atomicity, not exactly-once end-to-end.</li>' +
        '</ul>'
    },
    {
      id: 'failure-injection',
      title: 'Failure injection',
      short: 'Break mid-saga',
      html:
        '<p>Production sagas fail between steps. Chaos drills should inject timeouts, broker lag, and step exceptions after N successes.</p>' +
        '<ul>' +
        '<li>Inject after reserve, charge, or ship in the lab to force compensation.</li>' +
        '<li>Assert compensation order and final business invariants (no charge without stock hold, etc.).</li>' +
        '<li>Verify metrics: open sagas, compensation lag, poison messages.</li>' +
        '<li>Include “compensate failed” paths — nested recovery matters.</li>' +
        '</ul>'
    },
    {
      id: 'ordering',
      title: 'Message ordering',
      short: 'Per-aggregate keys',
      html:
        '<p>Choreographed sagas often assume <strong>per-aggregate order</strong>. Partition keys (e.g. <code>orderId</code>) keep related events sequential on one partition.</p>' +
        '<ul>' +
        '<li>Global broker order is usually unavailable — design for causal keys.</li>' +
        '<li>Out-of-order <code>Shipped</code> before <code>Paid</code> needs guards / version checks.</li>' +
        '<li>Compensations must not race ahead of late forward events (fencing tokens help).</li>' +
        '<li>Document which streams are ordered and which are best-effort.</li>' +
        '</ul>'
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      short: 'Practical defaults',
      html:
        '<p>Starting points teams adopt successfully:</p>' +
        '<ul>' +
        '<li>Default to <strong>orchestration + outbox</strong> for money / inventory workflows.</li>' +
        '<li>Make every compensation idempotent before enabling automatic retries.</li>' +
        '<li>Replace dual-write with outbox or CDC when “lost event” is unacceptable.</li>' +
        '<li>Use the recommendation engine below to match constraints to a pattern.</li>' +
        '</ul>'
    }
  ];

  var QUIZ = [
    {
      q: 'In an orchestration saga, who typically decides the next step and compensation order?',
      choices: [
        'Each service independently with no shared state',
        'A central saga coordinator / orchestrator',
        'Only the message broker partition leader',
        'The database foreign-key cascade'
      ],
      answer: 1
    },
    {
      q: 'Compensation transactions should usually run…',
      choices: [
        'In the same order as forward steps',
        'In reverse order of successful forward steps',
        'Only on the first failed step',
        'After a full ACID distributed rollback'
      ],
      answer: 1
    },
    {
      q: 'Why is dual-write risky?',
      choices: [
        'Because SQL cannot join tables',
        'DB commit and broker publish are not atomic — one can succeed alone',
        'Because Kafka forbids producers',
        'Because compensations cannot be coded'
      ],
      answer: 1
    },
    {
      q: 'Transactional outbox primarily guarantees…',
      choices: [
        'Exactly-once processing at every consumer',
        'That the intent to publish is committed with the business data',
        'Global total order of all topics',
        'That compensations are unnecessary'
      ],
      answer: 1
    },
    {
      q: 'Replaying a non-idempotent refund compensation twice typically causes…',
      choices: [
        'A harmless no-op',
        'Double refund / incorrect financial state',
        'Automatic outbox compaction',
        'Stronger isolation levels'
      ],
      answer: 1
    },
    {
      q: 'Per-aggregate ordering is commonly achieved by…',
      choices: [
        'Using a single global queue for the whole company',
        'Partitioning / keying messages by aggregate id (e.g. orderId)',
        'Disabling retries forever',
        'Writing only to Redis'
      ],
      answer: 1
    },
    {
      q: 'When “no lost domain events after commit” is required and you currently dual-write, you should…',
      choices: [
        'Add more dual-write retries only',
        'Move to transactional outbox (or CDC) plus consumer idempotency',
        'Delete the database',
        'Switch to choreography without changing writes'
      ],
      answer: 1
    }
  ];

  var SAGA_STEPS = [
    { id: 'create', label: '1 Create order', comp: 'Cancel order' },
    { id: 'reserve', label: '2 Reserve stock', comp: 'Release stock' },
    { id: 'charge', label: '3 Charge payment', comp: 'Refund payment' },
    { id: 'ship', label: '4 Create shipment', comp: 'Cancel shipment' }
  ];

  var state = {
    activeModule: 0,
    completed: {},
    quizBest: null
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

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        state.completed = data.completed || {};
        state.quizBest = typeof data.quizBest === 'number' ? data.quizBest : null;
        if (typeof data.activeModule === 'number') state.activeModule = data.activeModule;
      }
    } catch (e) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completed: state.completed,
        quizBest: state.quizBest,
        activeModule: state.activeModule
      }));
    } catch (e) {}
  }

  function completedCount() {
    var n = 0;
    MODULES.forEach(function (m) {
      if (state.completed[m.id]) n += 1;
    });
    return n;
  }

  function updateHeroStats() {
    var done = completedCount();
    var pct = Math.round((done / MODULES.length) * 100);
    $('statModulesDone').textContent = String(done);
    $('statModulesTotal').textContent = String(MODULES.length);
    $('statProgressPct').textContent = pct + '%';
    $('statQuizBest').textContent = state.quizBest == null ? '—' : state.quizBest + '/' + QUIZ.length;
    $('heroProgressFill').style.width = pct + '%';
    var bar = $('heroProgressBar');
    bar.setAttribute('aria-valuenow', String(pct));
  }

  function renderModuleNav() {
    $('moduleList').innerHTML = MODULES.map(function (m, idx) {
      var classes = 'saga-module-btn';
      if (idx === state.activeModule) classes += ' is-active';
      if (state.completed[m.id]) classes += ' is-done';
      return '<li><button type="button" class="' + classes + '" data-idx="' + idx + '">' +
        '<span class="saga-module-title">' + escapeHtml(m.title) + '</span>' +
        '<span class="saga-module-short">' + escapeHtml(m.short) + '</span>' +
        '</button></li>';
    }).join('');
  }

  function showModule(idx) {
    if (idx < 0 || idx >= MODULES.length) return;
    state.activeModule = idx;
    var m = MODULES[idx];
    $('lessonTitle').textContent = m.title;
    $('lessonBody').innerHTML = m.html;
    var done = !!state.completed[m.id];
    $('lessonBadge').hidden = !done;
    $('markCompleteBtn').disabled = done;
    $('prevModuleBtn').disabled = idx === 0;
    $('nextModuleBtn').disabled = idx === MODULES.length - 1;
    renderModuleNav();
    saveProgress();
    updateHeroStats();
  }

  function markComplete() {
    var m = MODULES[state.activeModule];
    state.completed[m.id] = true;
    saveProgress();
    showModule(state.activeModule);
  }

  function renderStepRail(statuses) {
    $('sagaStepRail').innerHTML = SAGA_STEPS.map(function (s) {
      var st = statuses[s.id] || 'pending';
      return '<li class="saga-step-chip is-' + st + '">' + escapeHtml(s.label) + '</li>';
    }).join('');
  }

  function runSaga() {
    var styleEl = document.querySelector('input[name="sagaStyle"]:checked');
    var style = styleEl ? styleEl.value : 'orchestration';
    var failAt = $('failStep').value;
    var idempotent = $('simIdempotent').checked;
    var replay = $('simReplayComp').checked;

    var statuses = {};
    SAGA_STEPS.forEach(function (s) { statuses[s.id] = 'pending'; });

    var log = [];
    log.push('Starting order saga (' + style + ')…');

    var completedForward = [];
    var failed = false;
    var failLabel = '';

    for (var i = 0; i < SAGA_STEPS.length; i++) {
      var step = SAGA_STEPS[i];
      if (failAt !== 'none' && step.id === failAt) {
        statuses[step.id] = 'fail';
        failed = true;
        failLabel = step.label;
        log.push('✗ ' + step.label + ' failed (injected).');
        break;
      }
      statuses[step.id] = 'ok';
      completedForward.push(step);
      log.push('✓ ' + step.label + ' succeeded.');
    }

    var out = $('sagaSimOut');
    var compEl = $('sagaCompCheck');
    renderStepRail(statuses);

    if (!failed) {
      out.className = 'saga-outcome-box is-ok';
      out.innerHTML = '<p><span class="saga-tag saga-tag-ok">' + escapeHtml(style) + '</span></p>' +
        '<p>' + log.map(escapeHtml).join('<br>') + '</p>' +
        '<p><strong>Saga completed.</strong> No compensation required.</p>';
      compEl.innerHTML = '<p class="saga-muted">Compensation order N/A — all forward steps succeeded.</p>';
      return;
    }

    var comps = completedForward.slice().reverse();
    var expectedOrder = comps.map(function (s) { return s.comp; });
    var orderOk = true;

    comps.forEach(function (s, idx) {
      statuses[s.id] = 'comp';
      var line = '↩ Compensate: ' + s.comp + ' (reverse #' + (idx + 1) + ')';
      if (replay) {
        if (idempotent) {
          line += ' — replay #2 is no-op (idempotent ✓)';
        } else {
          line += ' — replay #2 DOUBLE side-effect (unsafe ✗)';
          orderOk = false;
        }
      }
      log.push(line);
    });

    renderStepRail(statuses);

    out.className = 'saga-outcome-box is-warn';
    out.innerHTML = '<p><span class="saga-tag saga-tag-warn">' + escapeHtml(style) + '</span></p>' +
      '<p>' + log.map(escapeHtml).join('<br>') + '</p>' +
      '<p>Failure at <strong>' + escapeHtml(failLabel) + '</strong>. ' +
      (style === 'choreography'
        ? 'Choreography emits compensating events; peers must still preserve reverse order per aggregate.'
        : 'Orchestrator issues compensate commands in reverse order.') +
      '</p>';

    var checks = [];
    checks.push('<p><strong>Compensation order:</strong> ' +
      escapeHtml(expectedOrder.join(' → ')) + '</p>');
    checks.push('<p><span class="saga-tag saga-tag-ok">Order check</span> Reverse of successful forwards — OK.</p>');
    if (replay) {
      if (idempotent) {
        checks.push('<p><span class="saga-tag saga-tag-ok">Idempotency</span> Duplicate compensations are safe no-ops.</p>');
      } else {
        checks.push('<p><span class="saga-tag saga-tag-bad">Idempotency</span> Duplicate compensations cause double side effects — fix before prod retries.</p>');
      }
    } else {
      checks.push('<p class="saga-muted">Enable “Replay compensation twice” to probe idempotency.</p>');
    }
    if (!orderOk) {
      checks.push('<p><span class="saga-tag saga-tag-bad">Invariant risk</span> Unsafe replay breaks financial/inventory correctness.</p>');
    }
    compEl.innerHTML = checks.join('');
  }

  function resetSaga() {
    $('failStep').value = 'none';
    $('simIdempotent').checked = true;
    $('simReplayComp').checked = false;
    $('styleOrch').checked = true;
    var statuses = {};
    SAGA_STEPS.forEach(function (s) { statuses[s.id] = 'pending'; });
    renderStepRail(statuses);
    $('sagaSimOut').className = 'saga-outcome-box';
    $('sagaSimOut').innerHTML = '<p class="saga-muted">Configure failure injection, then run the saga.</p>';
    $('sagaCompCheck').innerHTML = '';
  }

  function recommend() {
    var patternEl = document.querySelector('input[name="writePattern"]:checked');
    var pattern = patternEl ? patternEl.value : 'dual';
    var needExact = $('reqExactlyOnce').checked;
    var needOrder = $('reqOrder').checked;
    var multiDb = $('reqMultiDb').checked;
    var lowOps = $('reqLowOps').checked;

    var title = '';
    var tags = [];
    var body = [];

    if (pattern === 'dual' && needExact) {
      title = 'Migrate off dual-write → transactional outbox';
      tags.push('<span class="saga-tag saga-tag-bad">Dual-write unsafe</span>');
      tags.push('<span class="saga-tag saga-tag-ok">Outbox</span>');
      body.push('You require no lost events after commit. Dual-write cannot provide that atomicity.');
      body.push('Write business rows + outbox row in one transaction; relay to the broker with publish dedupe keys.');
    } else if (pattern === 'outbox') {
      title = 'Keep transactional outbox; harden relay & consumers';
      tags.push('<span class="saga-tag saga-tag-ok">Outbox</span>');
      body.push('Outbox already addresses producer atomicity. Focus on relay lag SLOs and consumer idempotency.');
    } else if (pattern === 'cdc') {
      title = 'CDC is fine — treat offsets & schema as first-class';
      tags.push('<span class="saga-tag saga-tag-ok">CDC</span>');
      body.push('CDC avoids app dual-write but needs careful ordering, schema evolution, and tombstone handling.');
    } else {
      title = 'Dual-write only if loss is acceptable';
      tags.push('<span class="saga-tag saga-tag-warn">Best-effort</span>');
      body.push('Without a “no lost events” requirement, dual-write may be tolerable for low-stakes notifications — still document the failure mode.');
    }

    if (needOrder) {
      body.push('Key messages by aggregate id so saga steps stay ordered per entity.');
    }
    if (multiDb) {
      body.push('Polyglot stores: prefer per-service outbox (or orchestration that does not assume one shared DB transaction across services).');
      tags.push('<span class="saga-tag saga-tag-warn">Multi-DB</span>');
    }
    if (lowOps && pattern !== 'dual') {
      body.push('Ops tip: managed CDC or a simple outbox poller with metrics beats custom dual-write heal jobs.');
    } else if (lowOps && pattern === 'dual') {
      body.push('Low-ops goal conflicts with dual-write healing — expect more pages for lost/duplicate events.');
    }

    body.push('Always pair with idempotent compensations in your saga steps.');

    $('recResults').innerHTML =
      '<p>' + tags.join(' ') + '</p>' +
      '<h4 style="margin:0.5rem 0;font-family:Orbitron,sans-serif;">' + escapeHtml(title) + '</h4>' +
      '<ul>' + body.map(function (b) { return '<li>' + escapeHtml(b) + '</li>'; }).join('') + '</ul>';
  }

  function resetRec() {
    $('wpDual').checked = true;
    $('reqExactlyOnce').checked = true;
    $('reqOrder').checked = true;
    $('reqMultiDb').checked = false;
    $('reqLowOps').checked = false;
    $('recResults').innerHTML = '<p class="saga-muted">Select requirements and click Recommend.</p>';
  }

  function renderQuiz() {
    $('quizQuestions').innerHTML = QUIZ.map(function (item, qi) {
      var opts = item.choices.map(function (c, ci) {
        var id = 'q' + qi + 'c' + ci;
        return '<label class="saga-quiz-option" for="' + id + '">' +
          '<input type="radio" name="q' + qi + '" id="' + id + '" value="' + ci + '" />' +
          '<span>' + escapeHtml(c) + '</span></label>';
      }).join('');
      return '<div class="saga-quiz-q"><fieldset>' +
        '<legend>' + (qi + 1) + '. ' + escapeHtml(item.q) + '</legend>' +
        opts + '</fieldset></div>';
    }).join('');
  }

  function submitQuiz(e) {
    e.preventDefault();
    var score = 0;
    var unanswered = 0;
    QUIZ.forEach(function (item, qi) {
      var picked = document.querySelector('input[name="q' + qi + '"]:checked');
      if (!picked) {
        unanswered += 1;
        return;
      }
      if (Number(picked.value) === item.answer) score += 1;
    });
    if (unanswered) {
      $('quizResult').hidden = false;
      $('quizResult').className = 'saga-quiz-result is-fail';
      $('quizResult').textContent = 'Answer all questions before submitting (' + unanswered + ' left).';
      return;
    }
    if (state.quizBest == null || score > state.quizBest) {
      state.quizBest = score;
      saveProgress();
      updateHeroStats();
    }
    var pass = score >= Math.ceil(QUIZ.length * 0.7);
    $('quizResult').hidden = false;
    $('quizResult').className = 'saga-quiz-result ' + (pass ? 'is-pass' : 'is-fail');
    $('quizResult').textContent = 'Score: ' + score + '/' + QUIZ.length +
      (pass ? ' — Nice work. Review any misses, then mark remaining modules complete.'
        : ' — Revisit compensation, outbox, and dual-write modules, then retry.');
  }

  function resetQuiz() {
    $('quizForm').reset();
    $('quizResult').hidden = true;
    $('quizResult').textContent = '';
  }

  function init() {
    loadProgress();
    renderModuleNav();
    showModule(state.activeModule);
    renderQuiz();
    resetSaga();
    updateHeroStats();

    $('moduleList').addEventListener('click', function (e) {
      var btn = e.target.closest('.saga-module-btn');
      if (!btn) return;
      showModule(Number(btn.getAttribute('data-idx')));
    });
    $('markCompleteBtn').addEventListener('click', markComplete);
    $('prevModuleBtn').addEventListener('click', function () { showModule(state.activeModule - 1); });
    $('nextModuleBtn').addEventListener('click', function () { showModule(state.activeModule + 1); });
    $('runSagaBtn').addEventListener('click', runSaga);
    $('resetSagaBtn').addEventListener('click', resetSaga);
    $('recommendBtn').addEventListener('click', recommend);
    $('resetRecBtn').addEventListener('click', resetRec);
    $('quizForm').addEventListener('submit', submitQuiz);
    $('resetQuizBtn').addEventListener('click', resetQuiz);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
