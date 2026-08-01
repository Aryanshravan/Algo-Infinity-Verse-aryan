(function () {
  'use strict';

  var STORAGE_KEY = 'dbi-isolation-anomaly-lab-progress';

  var MODULES = [
    {
      id: 'dirty-read',
      title: 'Dirty Read Anomaly',
      short: 'Uncommitted visibility',
      html:
        '<p>A <strong>dirty read</strong> occurs when transaction T1 reads a value written by T2 <em>before</em> T2 commits. If T2 later rolls back, T1 based decisions on data that never officially existed.</p>' +
        '<ul>' +
        '<li>Classic under <code>READ UNCOMMITTED</code>.</li>' +
        '<li>Prevented by <code>READ COMMITTED</code> and stronger levels.</li>' +
        '<li>Dangerous for balances, inventory, and any “read-then-act” logic.</li>' +
        '<li>MVCC engines often avoid dirty reads even when locks are light.</li>' +
        '</ul>' +
        '<p>Use the simulator’s Dirty Read scenario under READ UNCOMMITTED to watch T1 see T2’s uncommitted write.</p>'
    },
    {
      id: 'non-repeatable',
      title: 'Non-Repeatable Read',
      short: 'Same row, new value',
      html:
        '<p>A <strong>non-repeatable read</strong> happens when T1 reads row X, T2 commits an update to X, then T1 reads X again and sees a different committed value — within the same transaction.</p>' +
        '<ul>' +
        '<li>Allowed under <code>READ COMMITTED</code> (each statement sees latest committed data).</li>' +
        '<li>Prevented by <code>REPEATABLE READ</code> / snapshot isolation (same row version).</li>' +
        '<li>Breaks assumptions like “I already checked stock = 5.”</li>' +
        '<li>Often fixed with stronger isolation or explicit row locks / optimistic versioning.</li>' +
        '</ul>' +
        '<p>Step the Non-Repeatable scenario under READ COMMITTED vs REPEATABLE READ to compare outcomes.</p>'
    },
    {
      id: 'phantom',
      title: 'Phantom Read',
      short: 'New rows in a range',
      html:
        '<p>A <strong>phantom</strong> appears when T1 runs a range/predicate query (e.g. <code>WHERE status = \'open\'</code>), T2 inserts (or deletes) a row matching that predicate and commits, then T1 re-runs the query and sees a different set.</p>' +
        '<ul>' +
        '<li>Not the same as non-repeatable: the row identity set changes, not just column values.</li>' +
        '<li>ANSI: prevented by <code>SERIALIZABLE</code>; some engines use predicate/gap locks under RR.</li>' +
        '<li>MySQL InnoDB <code>REPEATABLE READ</code> often blocks phantoms via next-key locking — not universal.</li>' +
        '<li>Critical for “count then insert”, unique business rules, and reports.</li>' +
        '</ul>' +
        '<p>The Phantom scenario models a range count that changes after a concurrent insert.</p>'
    },
    {
      id: 'lost-update',
      title: 'Lost Update',
      short: 'Overwrite without merge',
      html:
        '<p>A <strong>lost update</strong> occurs when two transactions read the same value, each computes a new value, and both write — the second write silently overwrites the first’s effect.</p>' +
        '<ul>' +
        '<li>Example: both read balance 100, both add 50, both write 150 → one +50 is lost.</li>' +
        '<li>Isolation alone may not save you; use <code>UPDATE … WHERE version = ?</code>, <code>SELECT FOR UPDATE</code>, or atomic <code>SET bal = bal + 50</code>.</li>' +
        '<li>SERIALIZABLE / strict locking reduces the race window when reads hold locks.</li>' +
        '<li>Application-level optimistic concurrency is a common fix at READ COMMITTED.</li>' +
        '</ul>' +
        '<p>Run the Lost Update scenario and observe how isolation and write patterns interact.</p>'
    },
    {
      id: 'isolation-ladder',
      title: 'READ UNCOMMITTED → SERIALIZABLE',
      short: 'ANSI isolation ladder',
      html:
        '<p>ANSI SQL defines four isolation levels that trade consistency for concurrency:</p>' +
        '<ul>' +
        '<li><code>READ UNCOMMITTED</code> — dirty reads possible; rarely used in production OLTP.</li>' +
        '<li><code>READ COMMITTED</code> — no dirty reads; non-repeatable &amp; phantoms possible. Default in Postgres/Oracle/SQL Server.</li>' +
        '<li><code>REPEATABLE READ</code> — stable row versions/locks within the txn; phantoms may still appear (engine-dependent).</li>' +
        '<li><code>SERIALIZABLE</code> — effect equivalent to some serial order of transactions; strongest, most contention.</li>' +
        '</ul>' +
        '<p>Real engines implement these with locks, MVCC snapshots, or SSI (Postgres Serializable Snapshot Isolation). Always verify vendor docs — names match ANSI imperfectly.</p>'
    },
    {
      id: 'locking',
      title: 'Locking Strategies',
      short: 'Shared, exclusive, gaps',
      html:
        '<p><strong>Locking</strong> coordinates concurrent access so writers and readers do not corrupt each other’s view.</p>' +
        '<ul>' +
        '<li><strong>Shared (S)</strong> — multiple readers; blocks exclusive writers.</li>' +
        '<li><strong>Exclusive (X)</strong> — writer lock; blocks other X and usually S.</li>' +
        '<li><strong>Intent locks</strong> — hierarchy (table → page → row) for efficient conflict detection.</li>' +
        '<li><strong>Gap / next-key locks</strong> — lock ranges to prevent phantoms (InnoDB).</li>' +
        '<li><strong>Deadlocks</strong> — cycles of wait-for; engines abort one victim.</li>' +
        '</ul>' +
        '<p>Long transactions that hold locks hurt throughput. Prefer short critical sections and indexes that narrow lock scope.</p>'
    },
    {
      id: 'mvcc',
      title: 'MVCC Overview',
      short: 'Versioned rows',
      html:
        '<p><strong>Multi-Version Concurrency Control (MVCC)</strong> keeps multiple row versions so readers can see a consistent snapshot without blocking writers (and vice versa, in many cases).</p>' +
        '<ul>' +
        '<li>Postgres: each txn has a snapshot; visibility rules use xmin/xmax.</li>' +
        '<li>InnoCC: undo logs reconstruct older versions for consistent reads.</li>' +
        '<li>Readers avoid dirty reads under RC+ without locking writers out.</li>' +
        '<li>Trade-off: storage/vacuum/purge overhead; write-write conflicts still need detection.</li>' +
        '</ul>' +
        '<p>MVCC explains why READ COMMITTED feels “light” yet still never shows uncommitted data in these engines.</p>'
    },
    {
      id: 'recommendations',
      title: 'Choosing Isolation Levels',
      short: 'Practical guidance',
      html:
        '<p>Pick isolation based on anomaly risk, latency budget, and engine behavior:</p>' +
        '<ul>' +
        '<li><strong>Default RC</strong> for most CRUD apps; add optimistic versioning for critical updates.</li>' +
        '<li><strong>Repeatable / snapshot</strong> for multi-statement reads that must be stable (checkout totals).</li>' +
        '<li><strong>Serializable</strong> for financial ledgers, uniqueness invariants across ranges, or when bugs from phantoms are costly.</li>' +
        '<li>Long reports: use read-only snapshots / replicas rather than SERIALIZABLE on OLTP primaries.</li>' +
        '<li>Always measure contention (lock waits, SSI aborts) after raising isolation.</li>' +
        '</ul>' +
        '<p>Use the recommendation engine below to map workload checkboxes to a starting level.</p>'
    }
  ];

  var SCENARIOS = [
    {
      id: 'dirty',
      name: 'Dirty read (T2 writes, T1 reads, T2 rolls back)',
      steps: [
        { tx: 'T1', op: 'BEGIN', detail: 'T1 starts.' },
        { tx: 'T2', op: 'BEGIN', detail: 'T2 starts.' },
        { tx: 'T2', op: 'WRITE', detail: 'T2: UPDATE accounts SET bal = 50 WHERE id = X (uncommitted).', write: 50, uncommitted: true },
        { tx: 'T1', op: 'READ', detail: 'T1: SELECT bal FROM accounts WHERE id = X.', read: true },
        { tx: 'T2', op: 'ROLLBACK', detail: 'T2 rolls back — write never committed.', rollback: true },
        { tx: 'T1', op: 'COMMIT', detail: 'T1 commits (may have acted on dirty data).' }
      ],
      anomaly: 'dirty_read',
      anomalyAt: 3
    },
    {
      id: 'nonrep',
      name: 'Non-repeatable read (T2 commits between T1 reads)',
      steps: [
        { tx: 'T1', op: 'BEGIN', detail: 'T1 starts.' },
        { tx: 'T1', op: 'READ', detail: 'T1 first read of X.', read: true, tag: 'first' },
        { tx: 'T2', op: 'BEGIN', detail: 'T2 starts.' },
        { tx: 'T2', op: 'WRITE', detail: 'T2: UPDATE X SET bal = 200.', write: 200, uncommitted: true },
        { tx: 'T2', op: 'COMMIT', detail: 'T2 commits bal = 200.', commitWrite: true },
        { tx: 'T1', op: 'READ', detail: 'T1 second read of X.', read: true, tag: 'second' },
        { tx: 'T1', op: 'COMMIT', detail: 'T1 commits.' }
      ],
      anomaly: 'non_repeatable',
      anomalyAt: 5
    },
    {
      id: 'phantom',
      name: 'Phantom read (insert appears in T1 range)',
      steps: [
        { tx: 'T1', op: 'BEGIN', detail: 'T1 starts.' },
        { tx: 'T1', op: 'RANGE', detail: 'T1: COUNT(*) WHERE status = open → 2 rows.', rangeCount: 2 },
        { tx: 'T2', op: 'BEGIN', detail: 'T2 starts.' },
        { tx: 'T2', op: 'INSERT', detail: 'T2 inserts a new open order.', insert: true },
        { tx: 'T2', op: 'COMMIT', detail: 'T2 commits insert.', commitInsert: true },
        { tx: 'T1', op: 'RANGE', detail: 'T1 re-runs COUNT(*) WHERE status = open.', rangeCount: null },
        { tx: 'T1', op: 'COMMIT', detail: 'T1 commits.' }
      ],
      anomaly: 'phantom',
      anomalyAt: 5
    },
    {
      id: 'lost',
      name: 'Lost update (two read-modify-write writers)',
      steps: [
        { tx: 'T1', op: 'BEGIN', detail: 'T1 starts.' },
        { tx: 'T2', op: 'BEGIN', detail: 'T2 starts.' },
        { tx: 'T1', op: 'READ', detail: 'T1 reads bal = 100.', read: true, stash: 't1' },
        { tx: 'T2', op: 'READ', detail: 'T2 reads bal = 100.', read: true, stash: 't2' },
        { tx: 'T1', op: 'WRITE', detail: 'T1 writes 100 + 50 = 150.', write: 150, uncommitted: true },
        { tx: 'T1', op: 'COMMIT', detail: 'T1 commits 150.', commitWrite: true },
        { tx: 'T2', op: 'WRITE', detail: 'T2 writes 100 + 50 = 150 (based on stale read).', write: 150, uncommitted: true },
        { tx: 'T2', op: 'COMMIT', detail: 'T2 commits 150 — T1’s increment effect is lost.', commitWrite: true }
      ],
      anomaly: 'lost_update',
      anomalyAt: 7
    }
  ];

  var QUIZ = [
    {
      id: 'q1',
      question: 'A dirty read means a transaction reads data that:',
      options: [
        'Was committed by another transaction yesterday',
        'Was written by another transaction that has not yet committed',
        'Is locked exclusively by the same transaction',
        'Exists only in a covering index'
      ],
      answer: 1
    },
    {
      id: 'q2',
      question: 'Non-repeatable reads are typically allowed under which ANSI level?',
      options: ['SERIALIZABLE only', 'READ COMMITTED', 'Only READ UNCOMMITTED', 'Never under any level'],
      answer: 1
    },
    {
      id: 'q3',
      question: 'A phantom read differs from a non-repeatable read because:',
      options: [
        'Only column values change on the same row set',
        'The set of rows matching a predicate changes (insert/delete)',
        'It only happens on ROLLBACK',
        'It requires dirty uncommitted data'
      ],
      answer: 1
    },
    {
      id: 'q4',
      question: 'Lost updates are best prevented by:',
      options: [
        'Using SELECT without a WHERE clause',
        'Atomic SQL updates, version columns, or SELECT FOR UPDATE',
        'Always using READ UNCOMMITTED',
        'Disabling primary keys'
      ],
      answer: 1
    },
    {
      id: 'q5',
      question: 'MVCC primarily helps by:',
      options: [
        'Deleting all indexes',
        'Serving readers from row versions/snapshots without blocking writers as much',
        'Guaranteeing no write-write conflicts ever',
        'Replacing the need for ACID'
      ],
      answer: 1
    },
    {
      id: 'q6',
      question: 'Which isolation level is strongest in the ANSI ladder?',
      options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
      answer: 3
    },
    {
      id: 'q7',
      question: 'For a high-throughput OLTP app that still must avoid dirty reads, a common starting point is:',
      options: [
        'READ UNCOMMITTED',
        'READ COMMITTED (plus app-level concurrency control where needed)',
        'Always SERIALIZABLE for every query',
        'No transactions at all'
      ],
      answer: 1
    }
  ];

  var ALLOWED = {
    READ_UNCOMMITTED: { dirty_read: true, non_repeatable: true, phantom: true, lost_update: true },
    READ_COMMITTED: { dirty_read: false, non_repeatable: true, phantom: true, lost_update: true },
    REPEATABLE_READ: { dirty_read: false, non_repeatable: false, phantom: true, lost_update: true },
    SERIALIZABLE: { dirty_read: false, non_repeatable: false, phantom: false, lost_update: false }
  };

  var state = {
    completed: {},
    quizBest: null,
    activeModule: 0,
    simStep: -1,
    simTimer: null,
    committed: 100,
    uncommitted: null,
    t1Reads: [],
    t2Reads: [],
    rangeFirst: null,
    rangeSecond: null,
    insertCommitted: false,
    blocked: false
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
        state.completed = data.completed && typeof data.completed === 'object' ? data.completed : {};
        if (typeof data.quizBest === 'number') state.quizBest = data.quizBest;
      }
    } catch (e) {
      /* ignore */
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completed: state.completed, quizBest: state.quizBest })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function completedCount() {
    var n = 0;
    for (var i = 0; i < MODULES.length; i++) {
      if (state.completed[MODULES[i].id]) n += 1;
    }
    return n;
  }

  function updateHeroStats() {
    var done = completedCount();
    var total = MODULES.length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    if ($('statModulesDone')) $('statModulesDone').textContent = String(done);
    if ($('statModulesTotal')) $('statModulesTotal').textContent = String(total);
    if ($('statProgressPct')) $('statProgressPct').textContent = pct + '%';
    if ($('statQuizBest')) {
      $('statQuizBest').textContent =
        state.quizBest === null ? '—' : state.quizBest + '/' + QUIZ.length;
    }
    if ($('heroProgressFill')) $('heroProgressFill').style.width = pct + '%';
    if ($('heroProgressBar')) $('heroProgressBar').setAttribute('aria-valuenow', String(pct));
  }

  function renderModuleNav() {
    var list = $('moduleList');
    if (!list) return;
    list.innerHTML = '';
    MODULES.forEach(function (mod, index) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dbi-module-btn';
      btn.setAttribute('aria-current', index === state.activeModule ? 'true' : 'false');
      if (index === state.activeModule) btn.classList.add('is-active');
      if (state.completed[mod.id]) btn.classList.add('is-complete');

      var check = document.createElement('span');
      check.className = 'dbi-module-check';
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = state.completed[mod.id]
        ? '<i class="fas fa-circle-check"></i>'
        : '<i class="far fa-circle"></i>';

      var meta = document.createElement('span');
      meta.className = 'dbi-module-meta';
      meta.innerHTML =
        '<strong>' +
        escapeHtml(mod.title) +
        '</strong><span>Module ' +
        (index + 1) +
        ' · ' +
        escapeHtml(mod.short) +
        '</span>';

      btn.appendChild(check);
      btn.appendChild(meta);
      btn.addEventListener('click', function () {
        showModule(index);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function showModule(index) {
    if (index < 0 || index >= MODULES.length) return;
    state.activeModule = index;
    var mod = MODULES[index];
    if ($('lessonTitle')) $('lessonTitle').textContent = mod.title;
    if ($('lessonBody')) $('lessonBody').innerHTML = mod.html;
    if ($('lessonBadge')) $('lessonBadge').hidden = !state.completed[mod.id];
    if ($('markCompleteBtn')) {
      $('markCompleteBtn').disabled = false;
      $('markCompleteBtn').innerHTML = state.completed[mod.id]
        ? '<i class="fas fa-rotate-left" aria-hidden="true"></i> Mark incomplete'
        : '<i class="fas fa-check" aria-hidden="true"></i> Mark complete';
    }
    if ($('prevModuleBtn')) $('prevModuleBtn').disabled = index === 0;
    if ($('nextModuleBtn')) $('nextModuleBtn').disabled = index === MODULES.length - 1;
    renderModuleNav();
  }

  function toggleComplete() {
    var mod = MODULES[state.activeModule];
    if (!mod) return;
    if (state.completed[mod.id]) delete state.completed[mod.id];
    else state.completed[mod.id] = true;
    saveProgress();
    updateHeroStats();
    showModule(state.activeModule);
  }

  function currentScenario() {
    var sel = $('scenarioSelect');
    var id = sel ? sel.value : 'dirty';
    for (var i = 0; i < SCENARIOS.length; i++) {
      if (SCENARIOS[i].id === id) return SCENARIOS[i];
    }
    return SCENARIOS[0];
  }

  function currentLevel() {
    var sel = $('isolationLevel');
    return sel ? sel.value : 'READ_COMMITTED';
  }

  function visibleValue() {
    var level = currentLevel();
    if (level === 'READ_UNCOMMITTED' && state.uncommitted !== null) {
      return state.uncommitted;
    }
    return state.committed;
  }

  function fillScenarios() {
    var sel = $('scenarioSelect');
    if (!sel) return;
    sel.innerHTML = '';
    SCENARIOS.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });
  }

  function renderScheduleSkeleton() {
    var scenario = currentScenario();
    var list = $('simSchedule');
    if (!list) return;
    list.innerHTML = '';
    scenario.steps.forEach(function (step, i) {
      var li = document.createElement('li');
      li.className = 'dbi-sched-step';
      li.id = 'sched-step-' + i;
      li.innerHTML =
        '<span class="dbi-sched-num">' +
        (i + 1) +
        '</span>' +
        '<div class="dbi-sched-body">' +
        '<span class="dbi-sched-tx ' +
        (step.tx === 'T1' ? 't1' : 't2') +
        '">' +
        step.tx +
        '</span>' +
        '<code>' +
        escapeHtml(step.op) +
        '</code> — ' +
        escapeHtml(step.detail) +
        '</div>';
      list.appendChild(li);
    });
  }

  function updateSimHud() {
    var scenario = currentScenario();
    var total = scenario.steps.length;
    if ($('simRowX')) {
      var shown = state.uncommitted !== null ? state.committed + ' (dirty: ' + state.uncommitted + ')' : String(state.committed);
      if (currentLevel() !== 'READ_UNCOMMITTED' || state.uncommitted === null) {
        shown = String(state.committed);
      } else {
        shown = state.committed + ' · dirty ' + state.uncommitted;
      }
      $('simRowX').textContent = shown;
    }
    if ($('simT1View')) {
      $('simT1View').textContent = state.t1Reads.length
        ? state.t1Reads.join(' → ')
        : '—';
    }
    if ($('simT2View')) {
      $('simT2View').textContent = state.t2Reads.length
        ? state.t2Reads.join(' → ')
        : '—';
    }
    if ($('simStepLabel')) {
      $('simStepLabel').textContent =
        state.simStep < 0 ? '0 / ' + total : Math.min(state.simStep + 1, total) + ' / ' + total;
    }
  }

  function setAnomalyBox(html, mode) {
    var box = $('simAnomaly');
    if (!box) return;
    box.className = 'dbi-anomaly-box';
    if (mode) box.classList.add(mode);
    box.innerHTML = html;
  }

  function anomalyAllowed(type) {
    var map = ALLOWED[currentLevel()];
    return map ? !!map[type] : true;
  }

  function resetSimState() {
    if (state.simTimer) {
      clearInterval(state.simTimer);
      state.simTimer = null;
    }
    state.simStep = -1;
    state.committed = 100;
    state.uncommitted = null;
    state.t1Reads = [];
    state.t2Reads = [];
    state.rangeFirst = null;
    state.rangeSecond = null;
    state.insertCommitted = false;
    state.blocked = false;
  }

  function startSim() {
    resetSimState();
    renderScheduleSkeleton();
    updateSimHud();
    setAnomalyBox('<p class="dbi-muted">Simulation ready. Press Step to advance.</p>', '');
    if ($('simDetail')) {
      $('simDetail').innerHTML =
        '<p class="dbi-muted">Isolation: <strong>' +
        escapeHtml(currentLevel().replace(/_/g, ' ')) +
        '</strong> · Scenario loaded.</p>';
    }
    if ($('stepSimBtn')) $('stepSimBtn').disabled = false;
    if ($('autoSimBtn')) $('autoSimBtn').disabled = false;
    document.querySelectorAll('.dbi-sched-step').forEach(function (el) {
      el.classList.remove('is-done', 'is-current');
    });
  }

  function markSchedule(i, current) {
    var el = $('sched-step-' + i);
    if (!el) return;
    el.classList.add('is-done');
    if (current) el.classList.add('is-current');
    document.querySelectorAll('.dbi-sched-step').forEach(function (node, idx) {
      if (idx !== i) node.classList.remove('is-current');
    });
  }

  function detectAfterStep(scenario, stepIndex) {
    var type = scenario.anomaly;
    if (stepIndex < scenario.anomalyAt) return;

    if (type === 'dirty_read') {
      var sawDirty =
        state.t1Reads.indexOf(50) !== -1 && state.uncommitted === null && state.committed === 100;
      if (sawDirty || (stepIndex >= scenario.anomalyAt && state.t1Reads[0] === 50)) {
        if (anomalyAllowed('dirty_read')) {
          setAnomalyBox(
            '<p><strong>Anomaly: Dirty read</strong> — T1 observed T2’s uncommitted value (50). After rollback, committed state is still 100.</p>',
            'is-anomaly'
          );
        } else {
          setAnomalyBox(
            '<p><strong>Blocked / prevented</strong> — Under ' +
              escapeHtml(currentLevel().replace(/_/g, ' ')) +
              ', T1 cannot see uncommitted writes. No dirty read.</p>',
            'is-safe'
          );
        }
      }
    }

    if (type === 'non_repeatable' && state.t1Reads.length >= 2) {
      if (state.t1Reads[0] !== state.t1Reads[1]) {
        if (anomalyAllowed('non_repeatable')) {
          setAnomalyBox(
            '<p><strong>Anomaly: Non-repeatable read</strong> — T1 saw ' +
              state.t1Reads[0] +
              ' then ' +
              state.t1Reads[1] +
              ' for the same row.</p>',
            'is-anomaly'
          );
        } else {
          setAnomalyBox(
            '<p><strong>Prevented</strong> — Snapshot/locks keep T1’s view stable at ' +
              state.t1Reads[0] +
              '.</p>',
            'is-safe'
          );
        }
      } else if (!anomalyAllowed('non_repeatable')) {
        setAnomalyBox(
          '<p><strong>Stable reads</strong> — Both of T1’s reads returned ' +
            state.t1Reads[0] +
            ' under ' +
            escapeHtml(currentLevel().replace(/_/g, ' ')) +
            '.</p>',
          'is-safe'
        );
      }
    }

    if (type === 'phantom' && state.rangeFirst !== null && state.rangeSecond !== null) {
      if (state.rangeFirst !== state.rangeSecond) {
        if (anomalyAllowed('phantom')) {
          setAnomalyBox(
            '<p><strong>Anomaly: Phantom</strong> — Range count changed from ' +
              state.rangeFirst +
              ' to ' +
              state.rangeSecond +
              '.</p>',
            'is-anomaly'
          );
        } else {
          setAnomalyBox(
            '<p><strong>Prevented</strong> — Predicate/gap protection kept the range at ' +
              state.rangeFirst +
              '.</p>',
            'is-safe'
          );
        }
      } else if (!anomalyAllowed('phantom')) {
        setAnomalyBox(
          '<p><strong>No phantoms</strong> — Count stayed ' + state.rangeFirst + '.</p>',
          'is-safe'
        );
      }
    }

    if (type === 'lost_update' && stepIndex >= scenario.anomalyAt) {
      if (anomalyAllowed('lost_update') && state.committed === 150) {
        setAnomalyBox(
          '<p><strong>Anomaly: Lost update</strong> — Both txns intended +50 from 100, but final bal is 150 (one increment lost).</p>',
          'is-anomaly'
        );
      } else if (!anomalyAllowed('lost_update')) {
        setAnomalyBox(
          '<p><strong>Conflict handled</strong> — Under SERIALIZABLE-style protection, T2’s stale write would abort or re-read. Final intended total is 200.</p>',
          'is-safe'
        );
      }
    }
  }

  function applyStep(step) {
    var level = currentLevel();
    var scenario = currentScenario();
    var note = step.detail;

    if (step.write !== undefined && step.uncommitted) {
      if (
        scenario.anomaly === 'lost_update' &&
        step.tx === 'T2' &&
        !anomalyAllowed('lost_update')
      ) {
        state.blocked = true;
        note =
          'T2 write conflict — SERIALIZABLE/locking would abort or force refresh (stale RMW blocked).';
        state.committed = 200;
        state.uncommitted = null;
      } else {
        state.uncommitted = step.write;
      }
    }

    if (step.commitWrite) {
      if (!(state.blocked && step.tx === 'T2')) {
        if (state.uncommitted !== null) {
          state.committed = state.uncommitted;
        }
      }
      state.uncommitted = null;
    }

    if (step.rollback) {
      state.uncommitted = null;
    }

    if (step.read) {
      var val;
      if (level === 'READ_UNCOMMITTED' || anomalyAllowed('dirty_read')) {
        val = visibleValue();
      } else {
        val = state.committed;
      }

      if (
        scenario.anomaly === 'non_repeatable' &&
        step.tx === 'T1' &&
        step.tag === 'second' &&
        !anomalyAllowed('non_repeatable')
      ) {
        val = state.t1Reads[0];
        note = 'T1 second read returns snapshot value ' + val + ' (repeatable).';
      }

      if (step.tx === 'T1') state.t1Reads.push(val);
      else state.t2Reads.push(val);
      note += ' → observed ' + val;
    }

    if (step.rangeCount !== undefined) {
      var count;
      if (step.rangeCount !== null) {
        count = step.rangeCount;
        state.rangeFirst = count;
      } else {
        if (!anomalyAllowed('phantom')) {
          count = state.rangeFirst;
          note = 'T1 re-count still ' + count + ' (phantoms prevented).';
        } else {
          count = state.insertCommitted ? state.rangeFirst + 1 : state.rangeFirst;
        }
        state.rangeSecond = count;
      }
      note += ' → count = ' + count;
    }

    if (step.insert) {
      /* pending insert */
    }
    if (step.commitInsert) {
      state.insertCommitted = true;
    }

    return note;
  }

  function stepSim() {
    var scenario = currentScenario();
    if (state.simStep >= scenario.steps.length - 1) {
      if ($('stepSimBtn')) $('stepSimBtn').disabled = true;
      if ($('autoSimBtn')) $('autoSimBtn').disabled = true;
      if (state.simTimer) {
        clearInterval(state.simTimer);
        state.simTimer = null;
      }
      return;
    }

    state.simStep += 1;
    var step = scenario.steps[state.simStep];
    var note = applyStep(step);
    markSchedule(state.simStep, true);
    updateSimHud();
    if ($('simDetail')) {
      $('simDetail').innerHTML =
        '<span class="dbi-sched-tx ' +
        (step.tx === 'T1' ? 't1' : 't2') +
        '">' +
        step.tx +
        '</span> ' +
        escapeHtml(note);
    }
    detectAfterStep(scenario, state.simStep);

    if (state.simStep >= scenario.steps.length - 1) {
      if ($('stepSimBtn')) $('stepSimBtn').disabled = true;
      if ($('autoSimBtn')) $('autoSimBtn').disabled = true;
      if (state.simTimer) {
        clearInterval(state.simTimer);
        state.simTimer = null;
      }
    }
  }

  function autoSim() {
    if (state.simTimer) {
      clearInterval(state.simTimer);
      state.simTimer = null;
      if ($('autoSimBtn')) {
        $('autoSimBtn').innerHTML = '<i class="fas fa-bolt" aria-hidden="true"></i> Auto-play';
      }
      return;
    }
    if ($('autoSimBtn')) {
      $('autoSimBtn').innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> Pause';
    }
    state.simTimer = setInterval(function () {
      stepSim();
      if (state.simStep >= currentScenario().steps.length - 1) {
        clearInterval(state.simTimer);
        state.simTimer = null;
        if ($('autoSimBtn')) {
          $('autoSimBtn').innerHTML = '<i class="fas fa-bolt" aria-hidden="true"></i> Auto-play';
        }
      }
    }, 900);
  }

  function recommend() {
    var noDirty = $('recDirtyRisk') && $('recDirtyRisk').checked;
    var stable = $('recStableReads') && $('recStableReads').checked;
    var noPhantom = $('recNoPhantoms') && $('recNoPhantoms').checked;
    var lost = $('recLostUpdate') && $('recLostUpdate').checked;
    var throughput = $('recHighThroughput') && $('recHighThroughput').checked;
    var reporting = $('recReporting') && $('recReporting').checked;

    var level = 'READ_COMMITTED';
    var reasons = [];

    if (!noDirty && throughput && !stable && !noPhantom) {
      level = 'READ_UNCOMMITTED';
      reasons.push('Maximum visibility concurrency — only if dirty reads are truly acceptable (rare).');
    } else if (noPhantom || (stable && noPhantom)) {
      level = 'SERIALIZABLE';
      reasons.push('Range/predicate stability and full anomaly prevention call for SERIALIZABLE (or engine SSI).');
    } else if (stable) {
      level = 'REPEATABLE_READ';
      reasons.push('Stable row reads within a transaction → REPEATABLE READ / snapshot isolation.');
    } else {
      level = 'READ_COMMITTED';
      reasons.push('Avoid dirty reads with good concurrency — industry default for many OLTP systems.');
    }

    if (lost && level !== 'SERIALIZABLE') {
      reasons.push(
        'Lost-update risk remains: add optimistic versioning, SELECT FOR UPDATE, or atomic UPDATE expressions.'
      );
    }
    if (lost && level === 'SERIALIZABLE') {
      reasons.push('SERIALIZABLE reduces lost-update races; still prefer atomic increments where possible.');
    }
    if (throughput && (level === 'SERIALIZABLE' || level === 'REPEATABLE_READ')) {
      reasons.push('Higher isolation may increase lock waits or SSI aborts — measure under load.');
    }
    if (reporting) {
      reasons.push(
        'For long analytics, prefer read replicas / snapshot read-only transactions rather than raising OLTP isolation globally.'
      );
    }
    if (noDirty && level === 'READ_UNCOMMITTED') {
      level = 'READ_COMMITTED';
      reasons = ['Dirty reads disallowed → at least READ COMMITTED.'].concat(reasons.slice(1));
    }

    var host = $('recResults');
    if (!host) return;
    host.innerHTML =
      '<div class="dbi-rec-level">' +
      escapeHtml(level.replace(/_/g, ' ')) +
      '</div>' +
      '<p>Starting recommendation for your selected constraints:</p>' +
      '<ul class="dbi-rec-tradeoffs">' +
      reasons
        .map(function (r) {
          return '<li>' + escapeHtml(r) + '</li>';
        })
        .join('') +
      '</ul>' +
      '<p class="dbi-muted" style="margin-top:0.75rem">Validate against your RDBMS docs — Postgres SSI, InnoDB next-key locks, and SQL Server locking differ.</p>';
  }

  function resetRec() {
    var ids = [
      'recDirtyRisk',
      'recStableReads',
      'recNoPhantoms',
      'recLostUpdate',
      'recHighThroughput',
      'recReporting'
    ];
    ids.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.checked = id === 'recStableReads' || id === 'recLostUpdate';
    });
    if ($('recResults')) {
      $('recResults').innerHTML =
        '<p class="dbi-muted">Select workload constraints and click Recommend.</p>';
    }
  }

  function renderQuiz() {
    var host = $('quizQuestions');
    if (!host) return;
    host.innerHTML = '';
    QUIZ.forEach(function (q, qi) {
      var fs = document.createElement('fieldset');
      fs.className = 'dbi-quiz-q';
      var legend = document.createElement('legend');
      legend.textContent = qi + 1 + '. ' + q.question;
      fs.appendChild(legend);
      q.options.forEach(function (opt, oi) {
        var label = document.createElement('label');
        label.className = 'dbi-quiz-opt';
        label.innerHTML =
          '<input type="radio" name="' +
          escapeHtml(q.id) +
          '" value="' +
          oi +
          '" />' +
          '<span>' +
          escapeHtml(opt) +
          '</span>';
        fs.appendChild(label);
      });
      host.appendChild(fs);
    });
  }

  function submitQuiz(e) {
    e.preventDefault();
    var score = 0;
    QUIZ.forEach(function (q) {
      var selected = document.querySelector('input[name="' + q.id + '"]:checked');
      var opts = document.querySelectorAll('input[name="' + q.id + '"]');
      opts.forEach(function (input) {
        var lab = input.closest('.dbi-quiz-opt');
        if (!lab) return;
        lab.classList.remove('is-correct', 'is-wrong');
        var val = Number(input.value);
        if (val === q.answer) lab.classList.add('is-correct');
        else if (selected && input === selected) lab.classList.add('is-wrong');
      });
      if (selected && Number(selected.value) === q.answer) score += 1;
    });

    if (state.quizBest === null || score > state.quizBest) {
      state.quizBest = score;
      saveProgress();
      updateHeroStats();
    }

    var result = $('quizResult');
    if (result) {
      result.hidden = false;
      var pass = score >= Math.ceil(QUIZ.length * 0.7);
      result.className = 'dbi-quiz-result ' + (pass ? 'is-pass' : 'is-fail');
      result.innerHTML =
        '<strong>Score: ' +
        score +
        ' / ' +
        QUIZ.length +
        '</strong> — Best saved: ' +
        state.quizBest +
        '/' +
        QUIZ.length +
        '. ' +
        (pass
          ? 'Solid grasp of isolation anomalies.'
          : 'Review the modules and re-run the simulator, then try again.');
    }
  }

  function resetQuiz() {
    renderQuiz();
    var result = $('quizResult');
    if (result) {
      result.hidden = true;
      result.innerHTML = '';
    }
  }

  function bind() {
    if ($('markCompleteBtn')) $('markCompleteBtn').addEventListener('click', toggleComplete);
    if ($('prevModuleBtn')) {
      $('prevModuleBtn').addEventListener('click', function () {
        showModule(state.activeModule - 1);
      });
    }
    if ($('nextModuleBtn')) {
      $('nextModuleBtn').addEventListener('click', function () {
        showModule(state.activeModule + 1);
      });
    }
    if ($('startSimBtn')) $('startSimBtn').addEventListener('click', startSim);
    if ($('stepSimBtn')) $('stepSimBtn').addEventListener('click', stepSim);
    if ($('autoSimBtn')) $('autoSimBtn').addEventListener('click', autoSim);
    if ($('isolationLevel')) {
      $('isolationLevel').addEventListener('change', function () {
        startSim();
      });
    }
    if ($('scenarioSelect')) {
      $('scenarioSelect').addEventListener('change', function () {
        startSim();
      });
    }
    if ($('recommendBtn')) $('recommendBtn').addEventListener('click', recommend);
    if ($('resetRecBtn')) $('resetRecBtn').addEventListener('click', resetRec);
    if ($('quizForm')) $('quizForm').addEventListener('submit', submitQuiz);
    if ($('resetQuizBtn')) $('resetQuizBtn').addEventListener('click', resetQuiz);
  }

  function init() {
    loadProgress();
    fillScenarios();
    renderModuleNav();
    showModule(0);
    renderQuiz();
    updateHeroStats();
    renderScheduleSkeleton();
    updateSimHud();
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
