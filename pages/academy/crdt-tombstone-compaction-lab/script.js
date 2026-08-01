(function () {
  'use strict';

  var STORAGE_KEY = 'crdt-tombstone-compaction-lab-progress';

  var MODULES = [
    {
      id: 'lww',
      title: 'LWW Register',
      short: 'Last-write-wins',
      html:
        '<p>A <strong>Last-Write-Wins (LWW)</strong> register keeps a value plus a logical timestamp (or wall clock + unique id). Concurrent updates pick the higher timestamp.</p>' +
        '<ul>' +
        '<li>Simple and fast for single fields (title, status).</li>' +
        '<li>Clock skew and equal timestamps need a deterministic tie-break (replica id).</li>' +
        '<li>LWW does <em>not</em> merge field-level concurrent edits — one side wins wholly.</li>' +
        '<li>Use the simulator with different <code>@t=</code> values to see winners.</li>' +
        '</ul>'
    },
    {
      id: 'or-set',
      title: 'OR-Set',
      short: 'Observed-remove set',
      html:
        '<p>An <strong>OR-Set</strong> (Observed-Remove Set) tags each add with a unique tag. Removes only tombstone tags the remover has observed.</p>' +
        '<ul>' +
        '<li>Concurrent add + remove of the same element: add usually wins if the removers never saw that add tag.</li>' +
        '<li>Tombstones (or compacted equivalents) remember removed tags.</li>' +
        '<li>Great for tags, members, reactions — not for ordered lists without extra structure.</li>' +
        '<li>Inject concurrent <code>add</code>/<code>remove</code> lines in the lab to see resurrection vs clean remove.</li>' +
        '</ul>'
    },
    {
      id: 'conflicts',
      title: 'Conflicts',
      short: 'When ops diverge',
      html:
        '<p>CRDT “conflicts” are resolved by type rules, not by locking. Design for <strong>semantic</strong> outcomes users expect.</p>' +
        '<ul>' +
        '<li>LWW: one value survives — fine for “last editor” semantics.</li>' +
        '<li>OR-Set: membership converges; UI may still surprise if tombstones lag.</li>' +
        '<li>Document which fields are LWW vs multi-value vs set.</li>' +
        '<li>Prefer smaller CRDT grains so concurrent edits collide less.</li>' +
        '</ul>'
    },
    {
      id: 'tombstones',
      title: 'Tombstones',
      short: 'Deleted but remembered',
      html:
        '<p><strong>Tombstones</strong> mark deleted identities so late ops cannot resurrect removed state incorrectly.</p>' +
        '<ul>' +
        '<li>OR-Set remove creates tombstones for observed add-tags.</li>' +
        '<li>Without tombstones (or equivalent proofs), offline peers reintroduce deleted items.</li>' +
        '<li>Tombstones grow with churn — the core memory-pressure problem of this lab.</li>' +
        '<li>Watch the pressure meter after injecting a remove burst.</li>' +
        '</ul>'
    },
    {
      id: 'compaction',
      title: 'Compaction',
      short: 'GC safely',
      html:
        '<p><strong>Compaction</strong> drops tombstones (or compresses history) once it is safe — typically after a causal cutoff or ack from all replicas.</p>' +
        '<ul>' +
        '<li>Unsafe GC → deleted keys reappear when stale replicas sync.</li>' +
        '<li>Epoch / generation counters, version vectors, or “purge watermark” are common tools.</li>' +
        '<li>Aggressive compaction helps memory; long offline windows need longer retention.</li>' +
        '<li>Use the recommendation engine to match policy to workload.</li>' +
        '</ul>'
    },
    {
      id: 'memory-pressure',
      title: 'Memory pressure',
      short: 'Tombstone bloat',
      html:
        '<p>High-churn delete workloads (chat, presence, ephemeral tags) can make tombstones dominate live state.</p>' +
        '<ul>' +
        '<li>Track tombstone:live ratio and bytes, not just op count.</li>' +
        '<li>Alert when pressure crosses a budget before OOM / quota failures.</li>' +
        '<li>Compaction cadence should scale with churn, not a fixed daily job alone.</li>' +
        '<li>The lab meter approximates pressure from burst size vs live elements.</li>' +
        '</ul>'
    },
    {
      id: 'merge-strategies',
      title: 'Merge strategies',
      short: 'How states join',
      html:
        '<p>Merging is associative/commutative/idempotent for true CRDTs. Strategy choice is about <em>which CRDT</em>, not ad-hoc “take A or B”.</p>' +
        '<ul>' +
        '<li>LWW merge: max timestamp (then replica id).</li>' +
        '<li>OR-Set merge: union adds, union tombstones; drop covered adds.</li>' +
        '<li>Maps: per-key CRDT merge (often LWW values + OR-Set keys).</li>' +
        '<li>Never “last sync wins” the whole document unless that is an explicit product rule.</li>' +
        '</ul>'
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      short: 'Practical defaults',
      html:
        '<p>Starting points that keep sync correct under tombstone growth:</p>' +
        '<ul>' +
        '<li>Prefer OR-Set for membership; LWW for scalars; avoid giant monolithic LWW blobs.</li>' +
        '<li>Gate tombstone GC on a causal watermark when offline windows exist.</li>' +
        '<li>Measure pressure; compact more often under high churn.</li>' +
        '<li>Use the engine below before shipping a purge policy.</li>' +
        '</ul>'
    }
  ];

  var QUIZ = [
    {
      q: 'In an LWW register, concurrent updates are resolved by…',
      choices: [
        'Always keeping both values forever',
        'Choosing the update with the higher timestamp (plus tie-break)',
        'Taking the alphabetically first string',
        'Blocking until a lock is granted'
      ],
      answer: 1
    },
    {
      q: 'OR-Set remove tombstones exist primarily to…',
      choices: [
        'Speed up CSS rendering',
        'Prevent late/unobserved adds from incorrectly resurrecting removed elements',
        'Encrypt payloads at rest',
        'Replace the need for any timestamps'
      ],
      answer: 1
    },
    {
      q: 'Unsafe tombstone compaction can cause…',
      choices: [
        'Stronger ACID isolation',
        'Deleted items reappearing when stale replicas sync',
        'Automatic OAuth refresh',
        'Smaller DNS TTLs'
      ],
      answer: 1
    },
    {
      q: 'Memory pressure in CRDT stores often comes from…',
      choices: [
        'Too many CSS animations',
        'Tombstone accumulation under high delete churn',
        'Missing HTTPS certificates',
        'Using Orbitron font'
      ],
      answer: 1
    },
    {
      q: 'A good default for collaborative “tags on a card” is…',
      choices: [
        'One LWW blob for the whole card JSON',
        'OR-Set (or similar) for membership of tags',
        'Last HTTP response wins the whole database',
        'Disable sync entirely'
      ],
      answer: 1
    },
    {
      q: 'Devices offline for days imply compaction should…',
      choices: [
        'Purge all tombstones every minute',
        'Retain tombstones (or proofs) past the maximum offline window / watermark',
        'Ignore causal history',
        'Only use wall-clock without replica ids'
      ],
      answer: 1
    },
    {
      q: 'True CRDT merge should be…',
      choices: [
        'Order-dependent and non-idempotent',
        'Associative, commutative, and idempotent',
        'Handled only by a single leader lock',
        'Impossible without SQL transactions'
      ],
      answer: 1
    }
  ];

  var state = {
    activeModule: 0,
    completed: {},
    quizBest: null,
    lastPressure: 0
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
    $('heroProgressBar').setAttribute('aria-valuenow', String(pct));
  }

  function renderModuleNav() {
    $('moduleList').innerHTML = MODULES.map(function (m, idx) {
      var classes = 'crdt-module-btn';
      if (idx === state.activeModule) classes += ' is-active';
      if (state.completed[m.id]) classes += ' is-done';
      return '<li><button type="button" class="' + classes + '" data-idx="' + idx + '">' +
        '<span class="crdt-module-title">' + escapeHtml(m.title) + '</span>' +
        '<span class="crdt-module-short">' + escapeHtml(m.short) + '</span>' +
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

  function parseOps(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(Boolean);
  }

  function parseSetOp(line) {
    var m = /^set:([^=]+)=(.+?)(?:@t=(\d+))?$/i.exec(line);
    if (!m) return null;
    return { key: m[1].trim(), value: m[2].trim(), t: m[3] ? Number(m[3]) : 0 };
  }

  function parseAdd(line) {
    var m = /^add:(.+)$/i.exec(line);
    return m ? m[1].trim() : null;
  }

  function parseRemove(line) {
    var m = /^remove:(.+)$/i.exec(line);
    return m ? m[1].trim() : null;
  }

  function setPressure(pct, note) {
    var p = Math.max(0, Math.min(100, Math.round(pct)));
    state.lastPressure = p;
    $('pressurePct').textContent = p + '%';
    $('pressureFill').style.width = p + '%';
    $('pressureMeter').setAttribute('aria-valuenow', String(p));
    $('pressureNote').textContent = note || '';
  }

  function runMerge() {
    var type = $('crdtType').value;
    var aOps = parseOps($('replicaAOps').value);
    var bOps = parseOps($('replicaBOps').value);
    var burst = Number($('injectBurst').value) || 0;
    var log = [];
    var out = $('mergeOut');

    if (type === 'lww' || type === 'lww-map') {
      var map = {};
      function applySet(op, replica) {
        if (!op) return;
        var cur = map[op.key];
        if (!cur || op.t > cur.t || (op.t === cur.t && replica === 'B')) {
          map[op.key] = { value: op.value, t: op.t, from: replica };
          log.push('LWW ' + op.key + ' ← "' + op.value + '" @t=' + op.t + ' (' + replica + ')');
        } else {
          log.push('LWW ' + op.key + ' ignored "' + op.value + '" @t=' + op.t + ' (' + replica + ') — kept @t=' + cur.t);
        }
      }
      aOps.forEach(function (line) { applySet(parseSetOp(line), 'A'); });
      bOps.forEach(function (line) { applySet(parseSetOp(line), 'B'); });

      var keys = Object.keys(map);
      var tombstones = burst;
      var live = Math.max(keys.length, 1);
      var pressure = Math.min(100, (tombstones / (live + tombstones)) * 100 + (tombstones > 200 ? 15 : 0));

      out.className = 'crdt-outcome-box is-ok';
      out.innerHTML =
        '<p><span class="crdt-tag crdt-tag-ok">' + escapeHtml(type) + '</span></p>' +
        '<p>' + log.map(escapeHtml).join('<br>') + '</p>' +
        '<p><strong>Merged map:</strong></p><ul>' +
        keys.map(function (k) {
          return '<li><code>' + escapeHtml(k) + '</code> = ' + escapeHtml(map[k].value) +
            ' <span class="crdt-muted">(@t=' + map[k].t + ', ' + map[k].from + ')</span></li>';
        }).join('') + '</ul>' +
        (tombstones
          ? '<p><span class="crdt-tag crdt-tag-warn">Burst</span> Injected ~' + tombstones + ' synthetic tombstones for pressure modeling.</p>'
          : '');
      setPressure(pressure, 'LWW maps keep little membership history; pressure here models adjacent set tombstones / history.');
      return;
    }

    // OR-Set
    var adds = {};
    var tombs = {};
    var tagSeq = 0;

    function addElem(name, replica) {
      tagSeq += 1;
      var tag = replica + '-' + tagSeq;
      if (!adds[name]) adds[name] = {};
      adds[name][tag] = true;
      log.push('ADD ' + name + ' tag=' + tag + ' (' + replica + ')');
    }

    function removeElem(name, replica) {
      var tags = adds[name] ? Object.keys(adds[name]) : [];
      if (!tags.length) {
        log.push('REMOVE ' + name + ' (' + replica + ') — no observed tags (no-op / empty observe)');
        return;
      }
      tags.forEach(function (tag) {
        tombs[tag] = true;
        delete adds[name][tag];
      });
      if (!Object.keys(adds[name] || {}).length) delete adds[name];
      log.push('REMOVE ' + name + ' tombstoned ' + tags.length + ' tag(s) (' + replica + ')');
    }

    aOps.forEach(function (line) {
      var a = parseAdd(line);
      var r = parseRemove(line);
      if (a) addElem(a, 'A');
      if (r) removeElem(r, 'A');
      var s = parseSetOp(line);
      if (s) log.push('Note: set: ops ignored in OR-Set mode (' + s.key + ')');
    });
    bOps.forEach(function (line) {
      var a = parseAdd(line);
      var r = parseRemove(line);
      if (a) addElem(a, 'B');
      if (r) removeElem(r, 'B');
    });

    for (var i = 0; i < burst; i++) {
      tombs['burst-' + i] = true;
    }

    var liveElems = Object.keys(adds);
    var tombCount = Object.keys(tombs).length;
    var pressure = Math.min(100, (tombCount / (liveElems.length + tombCount + 1)) * 100);

    var members = liveElems.map(function (name) {
      return name + ' [' + Object.keys(adds[name]).join(', ') + ']';
    });

    var cls = pressure > 70 ? 'is-bad' : pressure > 40 ? 'is-warn' : 'is-ok';
    out.className = 'crdt-outcome-box ' + cls;
    out.innerHTML =
      '<p><span class="crdt-tag crdt-tag-ok">OR-Set</span></p>' +
      '<p>' + log.map(escapeHtml).join('<br>') + '</p>' +
      '<p><strong>Live members:</strong> ' +
      (members.length ? members.map(escapeHtml).join('; ') : '<span class="crdt-muted">(none)</span>') +
      '</p>' +
      '<p><strong>Tombstones:</strong> ' + tombCount +
      (burst ? ' (includes ' + burst + ' injected)' : '') + '</p>';

    setPressure(
      pressure,
      pressure > 70
        ? 'High pressure — prioritize causal watermark compaction before OOM/quota issues.'
        : 'Tombstone ratio drives pressure; compact only past acknowledged causal frontiers.'
    );
  }

  function resetMerge() {
    $('crdtType').value = 'orset';
    $('replicaAOps').value = 'set:title=Hello@t=10\nadd:tag=alpha';
    $('replicaBOps').value = 'set:title=World@t=12\nremove:tag=alpha\nadd:tag=beta';
    $('injectBurst').value = '50';
    $('burstLabel').textContent = '50 removals';
    $('injectBurst').setAttribute('aria-valuenow', '50');
    $('mergeOut').className = 'crdt-outcome-box';
    $('mergeOut').innerHTML = '<p class="crdt-muted">Configure ops and run a merge.</p>';
    setPressure(0, 'Pressure rises with live tombstones vs live elements.');
  }

  function recommend() {
    var wlEl = document.querySelector('input[name="workload"]:checked');
    var wl = wlEl ? wlEl.value : 'chat';
    var causal = $('reqCausal').checked;
    var lowMem = $('reqLowMem').checked;
    var offline = $('reqOffline').checked;
    var simple = $('reqSimple').checked;

    var title = '';
    var tags = [];
    var body = [];

    if (wl === 'chat') {
      title = 'Aggressive tombstone GC with short watermark';
      tags.push('<span class="crdt-tag crdt-tag-warn">High churn</span>');
      body.push('Presence/chat deletes accumulate fast — compact frequently on acknowledged epochs.');
    } else if (wl === 'doc') {
      title = 'Per-key LWW + selective OR-Set; moderate compaction';
      tags.push('<span class="crdt-tag crdt-tag-ok">Doc sync</span>');
      body.push('Long-lived document keys: prefer fine-grained LWW fields; avoid whole-doc LWW.');
    } else {
      title = 'Conservative retention past max offline window';
      tags.push('<span class="crdt-tag crdt-tag-warn">Offline</span>');
      body.push('Multi-device sync needs tombstones retained until the slowest peer acks the purge watermark.');
    }

    if (causal) {
      body.push('Never drop tombstones without a causal / version-vector cutoff — prevents resurrection bugs.');
      tags.push('<span class="crdt-tag crdt-tag-ok">Causal-safe</span>');
    }
    if (lowMem) {
      body.push('Budget tombstone:live ratio; trigger compaction earlier under memory pressure (see lab meter).');
    }
    if (offline) {
      body.push('Set retention ≥ maximum expected offline duration (+ safety margin).');
      tags.push('<span class="crdt-tag crdt-tag-warn">Long retention</span>');
    }
    if (simple && !offline) {
      body.push('Ops simplicity: fixed daily compaction + metrics often beats bespoke GC if churn is moderate.');
    } else if (simple && offline) {
      body.push('Simplicity conflicts with long offline — prefer a clear watermark policy over ad-hoc deletes.');
    }
    body.push('Validate with concurrent add/remove in the merge simulator before shipping.');

    $('recResults').innerHTML =
      '<p>' + tags.join(' ') + '</p>' +
      '<h4 style="margin:0.5rem 0;font-family:Orbitron,sans-serif;">' + escapeHtml(title) + '</h4>' +
      '<ul>' + body.map(function (b) { return '<li>' + escapeHtml(b) + '</li>'; }).join('') + '</ul>';
  }

  function resetRec() {
    $('wlChat').checked = true;
    $('reqCausal').checked = true;
    $('reqLowMem').checked = true;
    $('reqOffline').checked = false;
    $('reqSimple').checked = false;
    $('recResults').innerHTML = '<p class="crdt-muted">Select constraints and click Recommend.</p>';
  }

  function renderQuiz() {
    $('quizQuestions').innerHTML = QUIZ.map(function (item, qi) {
      var opts = item.choices.map(function (c, ci) {
        var id = 'q' + qi + 'c' + ci;
        return '<label class="crdt-quiz-option" for="' + id + '">' +
          '<input type="radio" name="q' + qi + '" id="' + id + '" value="' + ci + '" />' +
          '<span>' + escapeHtml(c) + '</span></label>';
      }).join('');
      return '<div class="crdt-quiz-q"><fieldset>' +
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
      $('quizResult').className = 'crdt-quiz-result is-fail';
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
    $('quizResult').className = 'crdt-quiz-result ' + (pass ? 'is-pass' : 'is-fail');
    $('quizResult').textContent = 'Score: ' + score + '/' + QUIZ.length +
      (pass ? ' — Solid. Finish remaining modules and re-run the merge simulator under pressure.'
        : ' — Revisit tombstones, compaction, and OR-Set modules, then retry.');
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
    resetMerge();
    updateHeroStats();

    $('moduleList').addEventListener('click', function (e) {
      var btn = e.target.closest('.crdt-module-btn');
      if (!btn) return;
      showModule(Number(btn.getAttribute('data-idx')));
    });
    $('markCompleteBtn').addEventListener('click', markComplete);
    $('prevModuleBtn').addEventListener('click', function () { showModule(state.activeModule - 1); });
    $('nextModuleBtn').addEventListener('click', function () { showModule(state.activeModule + 1); });
    $('injectBurst').addEventListener('input', function () {
      var v = $('injectBurst').value;
      $('burstLabel').textContent = v + ' removals';
      $('injectBurst').setAttribute('aria-valuenow', v);
    });
    $('runMergeBtn').addEventListener('click', runMerge);
    $('resetMergeBtn').addEventListener('click', resetMerge);
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
