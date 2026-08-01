/**
 * Trace Context Propagation Lab
 * W3C Trace Context modules, multi-hop simulator, fix engine, quiz + localStorage.
 */
(function () {
  'use strict';

  
  var STORAGE_KEY = 'trace-context-propagation-lab-progress';

  var MODULES = [
    {
      id: 'w3c-trace',
      title: 'W3C Trace Context',
      short: 'traceparent / tracestate',
      html:
        '<p><strong>W3C Trace Context</strong> standardizes distributed tracing headers: <code>traceparent</code> (version-traceId-spanId-flags) and optional <code>tracestate</code> for vendor data.</p>' +
        '<ul>' +
        '<li><code>trace-id</code> ties every span in a request graph together.</li>' +
        '<li><code>parent-id</code> / span id creates the causal parent → child edge.</li>' +
        '<li>Sampling flag (<code>sampled</code>) must stay consistent across hops when continuing a trace.</li>' +
        '<li>Prefer the W3C fields over proprietary-only headers for interop.</li>' +
        '</ul>',
    },
    {
      id: 'baggage',
      title: 'Baggage',
      short: 'Cross-cutting context',
      html:
        '<p><strong>Baggage</strong> (W3C Baggage / OpenTelemetry baggage) carries application key/values across process boundaries for correlation — not for secrets.</p>' +
        '<ul>' +
        '<li>Use for tenant id, feature flags, release version — never passwords or raw PII.</li>' +
        '<li>Size and cardinality matter: baggage is copied on every hop.</li>' +
        '<li>Gate keys with an allowlist at ingress; strip unknown keys.</li>' +
        '<li>Do not confuse baggage with span attributes — baggage is for propagation, attributes for local telemetry.</li>' +
        '</ul>',
    },
    {
      id: 'async-pitfalls',
      title: 'Async pitfalls',
      short: 'Lost context',
      html:
        '<p>Thread pools, <code>setTimeout</code>, fire-and-forget tasks, and manual threads often <strong>drop the active context</strong> unless you use context APIs (ALS, OpenTelemetry Context, async hooks).</p>' +
        '<ul>' +
        '<li>Capture context before scheduling; restore inside the worker callback.</li>' +
        '<li>Library wrappers (HTTP clients, DB drivers) should auto-instrument with the current span.</li>' +
        '<li>“Detached” spans with new trace ids look like broken causality in UIs.</li>' +
        '<li>Use the simulator\'s async-lost scenario to see orphan consumers.</li>' +
        '</ul>',
    },
    {
      id: 'queues',
      title: 'Queues & messaging',
      short: 'Broker hops',
      html:
        '<p>Message brokers are classic context black holes: producers must inject <code>traceparent</code> into message headers/metadata; consumers extract and continue.</p>' +
        '<ul>' +
        '<li>Map W3C fields into Kafka headers / SQS message attributes / AMQP headers consistently.</li>' +
        '<li>Create a <em>consumer</em> span as child of the producer span (or link if batch semantics require).</li>' +
        '<li>Retries should reuse or correctly parent spans — avoid a new root per attempt unless intentional.</li>' +
        '<li>Dead-letter paths still need correlation ids for ops.</li>' +
        '</ul>',
    },
    {
      id: 'browser-api',
      title: 'Browser → API',
      short: 'Frontend hops',
      html:
        '<p>SPAs can start a trace and send <code>traceparent</code> on <code>fetch</code>/<code>XHR</code>, but <strong>CORS</strong> and reverse proxies often strip custom headers.</p>' +
        '<ul>' +
        '<li>Expose and allow <code>traceparent</code> / <code>tracestate</code> / <code>baggage</code> in CORS.</li>' +
        '<li>Gate sampling in the browser to avoid flooding backends.</li>' +
        '<li>Never put auth tokens in baggage; use Authorization normally.</li>' +
        '<li>CDN/WAF rules must forward tracing headers to origin.</li>' +
        '</ul>',
    },
    {
      id: 'broken-causality',
      title: 'Broken causality',
      short: 'Orphan spans',
      html:
        '<p>Broken causality shows up as disconnected traces, missing parents, or duplicate roots for one user action.</p>' +
        '<ul>' +
        '<li>Symptoms: “span with unknown parent”, waterfall gaps, queue consumer as new root.</li>' +
        '<li>Causes: stripped headers, clock skew (less common for ids), regenerating trace ids on retry.</li>' +
        '<li>Validate with multi-hop tests and header dumps at each boundary.</li>' +
        '<li>Prefer continuing traces over inventing new roots mid-flow.</li>' +
        '</ul>',
    },
    {
      id: 'fixes',
      title: 'Fixes',
      short: 'Repair playbook',
      html:
        '<p>Repair propagation with instrumentation, header policy, and context APIs — not by logging harder alone.</p>' +
        '<ul>' +
        '<li>Inject/extract W3C at every network and queue boundary.</li>' +
        '<li>Wrap executors / promise queues to propagate context.</li>' +
        '<li>Allowlist tracing headers on mesh, ingress, and CORS.</li>' +
        '<li>Add synthetic multi-hop canaries that assert one shared <code>trace-id</code>.</li>' +
        '</ul>',
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      short: 'Practical defaults',
      html:
        '<p>Team defaults that keep traces trustworthy:</p>' +
        '<ul>' +
        '<li>Standardize on W3C Trace Context + OpenTelemetry SDKs.</li>' +
        '<li>Baggage allowlist; reject PII at the edge.</li>' +
        '<li>Document every hop (browser, API, worker, queue) in an architecture diagram with header ownership.</li>' +
        '<li>Use the recommendation engine below when diagnosing a break point.</li>' +
        '</ul>',
    },
  ];

  var QUIZ = [
    {
      q: 'What does the W3C traceparent header primarily carry?',
      choices: [
        'Only the service name and region',
        'Version, trace-id, parent span-id, and flags',
        'JWT claims for authentication',
        'SQL query fingerprints',
      ],
      answer: 1,
    },
    {
      q: 'Baggage is best used for…',
      choices: [
        'Passwords and session cookies',
        'Small cross-cutting correlation keys with an allowlist',
        'Replacing span events entirely',
        'Storing full request bodies',
      ],
      answer: 1,
    },
    {
      q: 'A common async pitfall is…',
      choices: [
        'Context not restored when work hops threads/promises',
        'Too many trace ids being UUID v4',
        'Using HTTPS',
        'Having a single span per process',
      ],
      answer: 0,
    },
    {
      q: 'Across a message queue you should…',
      choices: [
        'Never send headers; regenerate a root on consume',
        'Inject/extract trace context in message metadata and continue the trace',
        'Put the entire span tree in the payload JSON only',
        'Disable sampling forever',
      ],
      answer: 1,
    },
    {
      q: 'Browser → API tracing often fails because…',
      choices: [
        'Browsers cannot generate UUIDs',
        'CORS / proxies strip traceparent unless allowlisted',
        'HTTP/2 forbids custom headers',
        'SPAs cannot call fetch',
      ],
      answer: 1,
    },
    {
      q: 'Broken causality in a trace UI usually means…',
      choices: [
        'The dashboard theme is wrong',
        'Parent/child links were lost (orphans / new roots mid-flow)',
        'Disk is full on the collector only',
        'DNS TTL is too low',
      ],
      answer: 1,
    },
    {
      q: 'A solid default repair strategy is…',
      choices: [
        'Log more stack traces without ids',
        'W3C inject/extract at every hop + context-aware executors + header allowlists',
        'Delete all spans shorter than 1ms',
        'Use only proprietary headers forever',
      ],
      answer: 1,
    },
  ];

  var HOPS = [
    { id: 'browser', label: '1 Browser' },
    { id: 'api', label: '2 API' },
    { id: 'worker', label: '3 Worker' },
    { id: 'queue', label: '4 Queue' },
    { id: 'consumer', label: '5 Consumer' },
  ];

  var state = {
    activeModule: 0,
    completed: {},
    quizBest: null,
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
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          completed: state.completed,
          quizBest: state.quizBest,
          activeModule: state.activeModule,
        })
      );
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
    $('tctx-statModulesDone').textContent = String(done);
    $('tctx-statModulesTotal').textContent = String(MODULES.length);
    $('tctx-statProgressPct').textContent = pct + '%';
    $('tctx-statQuizBest').textContent =
      state.quizBest == null ? '—' : state.quizBest + '/' + QUIZ.length;
    $('tctx-heroProgressFill').style.width = pct + '%';
    $('tctx-heroProgressBar').setAttribute('aria-valuenow', String(pct));
  }

  function renderModuleNav() {
    $('tctx-moduleList').innerHTML = MODULES.map(function (m, idx) {
      var classes = 'tctx-module-btn';
      if (idx === state.activeModule) classes += ' is-active';
      if (state.completed[m.id]) classes += ' is-done';
      return (
        '<li><button type="button" class="' +
        classes +
        '" data-idx="' +
        idx +
        '">' +
        '<span class="tctx-module-title">' +
        escapeHtml(m.title) +
        '</span>' +
        '<span class="tctx-module-short">' +
        escapeHtml(m.short) +
        '</span>' +
        '</button></li>'
      );
    }).join('');
  }

  function showModule(idx) {
    if (idx < 0 || idx >= MODULES.length) return;
    state.activeModule = idx;
    var m = MODULES[idx];
    $('tctx-lessonTitle').textContent = m.title;
    $('tctx-lessonBody').innerHTML = m.html;
    var done = !!state.completed[m.id];
    $('tctx-lessonBadge').hidden = !done;
    $('tctx-markCompleteBtn').disabled = done;
    $('tctx-prevModuleBtn').disabled = idx === 0;
    $('tctx-nextModuleBtn').disabled = idx === MODULES.length - 1;
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

  function renderHopRail(statuses) {
    $('tctx-hopRail').innerHTML = HOPS.map(function (h) {
      var st = statuses[h.id] || 'pending';
      return '<li class="tctx-hop-chip is-' + st + '">' + escapeHtml(h.label) + '</li>';
    }).join('');
  }

  function runSim() {
    var scenarioEl = document.querySelector('input[name="tctx-scenario"]:checked');
    var scenario = scenarioEl ? scenarioEl.value : 'none';
    var w3c = $('tctx-injectW3c').checked;
    var baggage = $('tctx-injectBaggage').checked;

    var statuses = {};
    HOPS.forEach(function (h) {
      statuses[h.id] = 'pending';
    });

    var log = [];
    var traceId = w3c ? '4bf92f3577b34da6a3ce929d0e0e4736' : '(none)';
    var broken = false;
    var warn = false;

    function ok(id, msg) {
      statuses[id] = 'ok';
      log.push('✓ ' + msg);
    }
    function fail(id, msg) {
      statuses[id] = 'fail';
      broken = true;
      log.push('✗ ' + msg);
    }
    function soft(id, msg) {
      statuses[id] = 'warn';
      warn = true;
      log.push('! ' + msg);
    }

    ok('browser', 'Browser starts span; trace-id=' + traceId.slice(0, 8) + '…');

    if (scenario === 'browser-drop') {
      fail('api', 'API ingress stripped traceparent (CORS/proxy) — new root created');
      soft('worker', 'Worker continues orphan root');
      soft('queue', 'Queue metadata has no parent link');
      soft('consumer', 'Consumer cannot join original browser trace');
    } else if (scenario === 'async-lost') {
      ok('api', 'API received traceparent');
      fail('worker', 'Async executor lost context — worker span is a new root');
      soft('queue', 'Producer injects wrong/new trace-id');
      soft('consumer', 'Consumer tree disconnected from API request');
    } else if (scenario === 'queue-drop') {
      ok('api', 'API received and continued trace');
      ok('worker', 'Worker context intact');
      fail('queue', 'Broker hop dropped message tracing headers');
      soft('consumer', 'Consumer starts new trace — causality broken');
    } else if (scenario === 'baggage-leak') {
      ok('api', 'API continued W3C trace');
      ok('worker', 'Worker continued trace');
      ok('queue', 'Queue preserved traceparent');
      ok('consumer', 'Consumer joined same trace-id');
      if (baggage) {
        soft('consumer', 'Baggage includes email=user@example.com — PII propagated');
      } else {
        soft('api', 'Baggage not enabled; PII not in headers (good) but scenario assumed leak elsewhere');
      }
    } else {
      if (!w3c) {
        fail('api', 'No W3C headers emitted — each hop invents ids');
        fail('worker', 'No shared trace-id');
        fail('queue', 'No inject');
        fail('consumer', 'No extract');
      } else {
        ok('api', 'API extracted/injected traceparent');
        ok('worker', 'Worker restored context via ALS/OTel');
        ok('queue', 'Producer wrote traceparent to message headers');
        ok('consumer', 'Consumer continued parent span — causality intact');
        if (baggage) {
          soft('consumer', 'Baggage propagated — ensure allowlist (no PII)');
        }
      }
    }

    renderHopRail(statuses);

    var box = $('tctx-simOut');
    box.className = 'tctx-outcome-box ' + (broken ? 'is-bad' : warn ? 'is-warn' : 'is-ok');
    var tag = broken
      ? '<span class="tctx-tag tctx-tag-bad">Broken causality</span>'
      : warn
        ? '<span class="tctx-tag tctx-tag-warn">Review</span>'
        : '<span class="tctx-tag tctx-tag-ok">Healthy</span>';
    box.innerHTML =
      tag +
      '<p><strong>Scenario:</strong> ' +
      escapeHtml(scenario) +
      '</p><ul>' +
      log
        .map(function (l) {
          return '<li>' + escapeHtml(l) + '</li>';
        })
        .join('') +
      '</ul>';
  }

  function resetSim() {
    document.querySelector('input[name="tctx-scenario"][value="none"]').checked = true;
    $('tctx-injectW3c').checked = true;
    $('tctx-injectBaggage').checked = false;
    renderHopRail({});
    $('tctx-simOut').className = 'tctx-outcome-box';
    $('tctx-simOut').innerHTML = '<p class="tctx-muted">Pick a scenario and run the simulator.</p>';
  }

  function recommend() {
    var breakEl = document.querySelector('input[name="tctx-break"]:checked');
    var br = breakEl ? breakEl.value : 'browser';
    var cors = $('tctx-reqCors').checked;
    var pii = $('tctx-reqPii').checked;
    var sample = $('tctx-reqSample').checked;

    var title = '';
    var items = [];

    if (br === 'browser') {
      title = 'Browser → API repair';
      items.push('Emit traceparent from the SPA SDK on fetch/XHR.');
      if (cors) {
        items.push('CORS: Access-Control-Allow-Headers / Expose-Headers must include traceparent, tracestate, baggage.');
      }
      items.push('Confirm CDN/WAF forwards tracing headers to origin.');
      if (sample) {
        items.push('Apply head-based sampling in the browser to avoid flooding; keep decision in flags.');
      }
    } else if (br === 'async') {
      title = 'Async / executor repair';
      items.push('Wrap thread pools and promise queues to capture/restore OpenTelemetry (or ALS) context.');
      items.push('Avoid fire-and-forget without attaching context; prefer instrumented schedulers.');
      items.push('Add a unit test that asserts child spans share the parent trace-id after await.');
    } else if (br === 'queue') {
      title = 'Queue hop repair';
      items.push('Inject W3C fields into message headers on produce; extract on consume.');
      items.push('Standardize header names across Kafka/SQS/AMQP adapters.');
      items.push('Create consumer spans as children (or links for batches) — do not silently mint new roots.');
    } else {
      title = 'Mesh / ingress repair';
      items.push('Allowlist traceparent/tracestate/baggage on Envoy/NGINX/ingress.');
      items.push('Disable policies that strip “unknown” headers in front proxies.');
      items.push('Verify hop-by-hop with a canary that dumps incoming headers.');
    }

    if (pii) {
      items.push('Baggage allowlist only; strip emails, phones, tokens at the edge.');
    }

    $('tctx-recResults').innerHTML =
      '<p><strong>' +
      escapeHtml(title) +
      '</strong></p><ul>' +
      items
        .map(function (i) {
          return '<li>' + escapeHtml(i) + '</li>';
        })
        .join('') +
      '</ul>';
  }

  function resetRec() {
    document.querySelector('input[name="tctx-break"][value="browser"]').checked = true;
    $('tctx-reqCors').checked = true;
    $('tctx-reqPii').checked = true;
    $('tctx-reqSample').checked = false;
    $('tctx-recResults').innerHTML = '<p class="tctx-muted">Select a break point and click Recommend.</p>';
  }

  function renderQuiz() {
    $('tctx-quizQuestions').innerHTML = QUIZ.map(function (item, qi) {
      var opts = item.choices
        .map(function (c, ci) {
          var id = 'tctx-q' + qi + '-' + ci;
          return (
            '<label class="tctx-quiz-option" for="' +
            id +
            '">' +
            '<input type="radio" name="tctx-q' +
            qi +
            '" id="' +
            id +
            '" value="' +
            ci +
            '" />' +
            '<span>' +
            escapeHtml(c) +
            '</span></label>'
          );
        })
        .join('');
      return (
        '<div class="tctx-quiz-q"><fieldset><legend>' +
        (qi + 1) +
        '. ' +
        escapeHtml(item.q) +
        '</legend>' +
        opts +
        '</fieldset></div>'
      );
    }).join('');
  }

  function submitQuiz(e) {
    e.preventDefault();
    var score = 0;
    var missing = 0;
    QUIZ.forEach(function (item, qi) {
      var sel = document.querySelector('input[name="tctx-q' + qi + '"]:checked');
      if (!sel) {
        missing += 1;
        return;
      }
      if (Number(sel.value) === item.answer) score += 1;
    });
    if (missing) {
      $('tctx-quizResult').hidden = false;
      $('tctx-quizResult').className = 'tctx-quiz-result is-fail';
      $('tctx-quizResult').textContent = 'Please answer all questions (' + missing + ' left).';
      return;
    }
    if (state.quizBest == null || score > state.quizBest) {
      state.quizBest = score;
      saveProgress();
      updateHeroStats();
    }
    var pass = score >= Math.ceil(QUIZ.length * 0.7);
    $('tctx-quizResult').hidden = false;
    $('tctx-quizResult').className = 'tctx-quiz-result ' + (pass ? 'is-pass' : 'is-fail');
    $('tctx-quizResult').textContent =
      'Score: ' + score + '/' + QUIZ.length + (pass ? ' — Nice work.' : ' — Review modules and retry.') +
      ' Best: ' +
      state.quizBest +
      '/' +
      QUIZ.length;
  }

  function resetQuiz() {
    $('tctx-quizForm').reset();
    $('tctx-quizResult').hidden = true;
    $('tctx-quizResult').textContent = '';
  }

  function init() {
    loadProgress();
    renderQuiz();
    renderHopRail({});
    showModule(state.activeModule);

    $('tctx-moduleList').addEventListener('click', function (e) {
      var btn = e.target.closest('.tctx-module-btn');
      if (!btn) return;
      showModule(Number(btn.getAttribute('data-idx')));
    });

    $('tctx-markCompleteBtn').addEventListener('click', markComplete);
    $('tctx-prevModuleBtn').addEventListener('click', function () {
      showModule(state.activeModule - 1);
    });
    $('tctx-nextModuleBtn').addEventListener('click', function () {
      showModule(state.activeModule + 1);
    });

    $('tctx-runSimBtn').addEventListener('click', runSim);
    $('tctx-resetSimBtn').addEventListener('click', resetSim);
    $('tctx-recommendBtn').addEventListener('click', recommend);
    $('tctx-resetRecBtn').addEventListener('click', resetRec);
    $('tctx-quizForm').addEventListener('submit', submitQuiz);
    $('tctx-resetQuizBtn').addEventListener('click', resetQuiz);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
