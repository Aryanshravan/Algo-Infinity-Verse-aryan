(function () {
  'use strict';

  var STORAGE_KEY = 'quorum-latency-budget-lab-progress';

  var MODULES = [
    {
      id: 'quorum-math',
      title: 'Quorum math: R + W > N',
      short: 'Overlap guarantee',
      html:
        '<p>In a replica set of size <strong>N</strong>, a <strong>read quorum R</strong> and <strong>write quorum W</strong> guarantee that every successful read intersects every successful write when <code>R + W &gt; N</code>.</p>' +
        '<ul>' +
        '<li>Classic Dynamo-style tunable consistency.</li>' +
        '<li>Example: N=5, R=3, W=3 → strong overlap; N=5, R=1, W=1 → stale reads possible.</li>' +
        '<li>W=N is “write all”; R=1 is fastest reads but weakest freshness unless W is large.</li>' +
        '<li>Use the simulator below to watch availability break when healthy replicas &lt; R or W.</li>' +
        '</ul>'
    },
    {
      id: 'consistency-availability',
      title: 'Consistency vs availability',
      short: 'Tunable tradeoffs',
      html:
        '<p>Raising R and W improves freshness but shrinks the failure budget: fewer replicas can be down before quorums stall.</p>' +
        '<ul>' +
        '<li><strong>CP-leaning:</strong> large R/W, refuse ops without quorum.</li>' +
        '<li><strong>AP-leaning:</strong> small R/W, serve stale or divergent data under partition.</li>' +
        '<li>Client-visible “available” ≠ “consistent” — measure both SLOs.</li>' +
        '<li>Hints/read-repair and anti-entropy recover eventual systems after partitions heal.</li>' +
        '</ul>'
    },
    {
      id: 'leader-timeouts',
      title: 'Leader election timeouts',
      short: 'Heartbeat safety',
      html:
        '<p>Consensus systems (Raft/Paxos variants) detect leader failure via <strong>election timeouts</strong> that must exceed heartbeat/RTT jitter.</p>' +
        '<ul>' +
        '<li>Timeout ≫ heartbeat interval + network delay → fewer false elections.</li>' +
        '<li>Timeout too short under lossy links → unnecessary leadership churn.</li>' +
        '<li>Randomize timeouts across nodes to reduce split votes.</li>' +
        '<li>Cross-region clusters need larger timeouts or regional leaders.</li>' +
        '</ul>'
    },
    {
      id: 'election-storms',
      title: 'Election storms',
      short: 'Split votes &amp; churn',
      html:
        '<p>An <strong>election storm</strong> happens when many nodes time out together, vote for different candidates, fail to reach majority, and restart — amplifying load.</p>' +
        '<ul>' +
        '<li>Correlated timeouts (shared packet-loss spike) are a common trigger.</li>' +
        '<li>Mitigations: randomized backoff, longer timeouts, sticky leader preference.</li>' +
        '<li>Storms raise p99 latency even if the cluster eventually elects.</li>' +
        '<li>Observe the election panel: high loss + tight timeout → storm risk.</li>' +
        '</ul>'
    },
    {
      id: 'packet-loss',
      title: 'Packet loss &amp; quorum health',
      short: 'Partial failure',
      html:
        '<p>Packet loss turns healthy processes into “slow/failed” from a quorum perspective — heartbeats and ACK paths time out.</p>' +
        '<ul>' +
        '<li>Lossy paths shrink effective healthy count for R/W.</li>' +
        '<li>Slow replicas (high RTT) can block write quorums if W includes them.</li>' +
        '<li>Prefer hedging / speculative retries carefully to avoid thundering herds.</li>' +
        '<li>Mark replicas failed in the simulator to see availability flip.</li>' +
        '</ul>'
    },
    {
      id: 'cap-tradeoffs',
      title: 'CAP tradeoffs in practice',
      short: 'Partitions are real',
      html:
        '<p>CAP says under a <strong>network partition</strong> you choose consistency or availability for a given operation — not a permanent architecture label.</p>' +
        '<ul>' +
        '<li>Quorum systems often choose CP for writes and soften reads (or vice versa).</li>' +
        '<li>“Availability” means continuing without a majority; “consistency” means refusing unsafe ops.</li>' +
        '<li>Latency budgets interact with CAP: waiting for distant replicas is a soft partition.</li>' +
        '<li>Document which ops are CP vs AP for your product SLOs.</li>' +
        '</ul>'
    },
    {
      id: 'latency-budgets',
      title: 'Latency budgets',
      short: 'p99 math',
      html:
        '<p>A write quorum latency is roughly governed by the <strong>W-th fastest</strong> healthy replica ACK — not the mean RTT.</p>' +
        '<ul>' +
        '<li>Budget: client SLO − serialization − queueing − retries ≥ quorum wait.</li>' +
        '<li>Cross-region W&gt;1 can blow p99 unless you use regional W + async replicate.</li>' +
        '<li>Election timeout should sit outside the steady-state latency budget.</li>' +
        '<li>Use the recommendation engine to map p99 + RTT to N/R/W suggestions.</li>' +
        '</ul>'
    },
    {
      id: 'recommendations',
      title: 'Operational recommendations',
      short: 'Practical defaults',
      html:
        '<p>Starting points that teams commonly adopt:</p>' +
        '<ul>' +
        '<li><strong>N=3, R=2, W=2</strong> — simple strong quorum for single-region.</li>' +
        '<li><strong>N=5, R=3, W=3</strong> — tolerate 2 failures with overlap.</li>' +
        '<li>Need write speed: lower W but raise R (or accept stale reads).</li>' +
        '<li>Need availability under loss: smaller quorums + repair, or AP reads.</li>' +
        '<li>Always load-test election timeout under injected packet loss.</li>' +
        '</ul>'
    }
  ];

  var QUIZ = [
    {
      q: 'When does R + W > N guarantee that every successful read sees every successful write?',
      choices: [
        'Only when all replicas are in the same AZ',
        'When read and write quorums must intersect in at least one replica',
        'Only for leader-based consensus, never quorum stores',
        'When R = 1 and W = 1'
      ],
      answer: 1
    },
    {
      q: 'For N=5, which pair provides strong overlap (R+W>N)?',
      choices: ['R=1, W=2', 'R=2, W=2', 'R=3, W=3', 'R=1, W=1'],
      answer: 2
    },
    {
      q: 'Raising W while keeping N fixed typically…',
      choices: [
        'Improves write availability under replica failure',
        'Reduces write availability but can improve durability/freshness',
        'Has no effect on availability',
        'Removes the need for anti-entropy'
      ],
      answer: 1
    },
    {
      q: 'Election storms are most likely when…',
      choices: [
        'Heartbeats are frequent and timeouts are much larger than RTT',
        'Many nodes share correlated timeouts under high packet loss',
        'Only one node ever times out',
        'Quorum math uses R=W=N'
      ],
      answer: 1
    },
    {
      q: 'Under a hard partition of a majority quorum system, CAP says you must…',
      choices: [
        'Always serve stale data',
        'Choose whether to refuse unsafe ops (C) or continue without majority (A)',
        'Ignore latency budgets',
        'Set R=0'
      ],
      answer: 1
    },
    {
      q: 'Write quorum p99 latency is best thought of as…',
      choices: [
        'The mean RTT to all N replicas',
        'Waiting for the W-th fastest healthy ACK (order statistic)',
        'Always equal to the slowest replica forever',
        'Independent of packet loss'
      ],
      answer: 1
    },
    {
      q: 'A safe relationship for Raft-style timeouts is usually…',
      choices: [
        'election timeout ≪ heartbeat interval',
        'election timeout ≈ 0',
        'election timeout ≫ heartbeat interval + delay/jitter',
        'timeouts must be identical and synchronized on all nodes'
      ],
      answer: 2
    }
  ];

  var state = {
    activeModule: 0,
    completed: {},
    quizBest: null,
    replicaStatus: []
  };

  function $(id) {
    return document.getElementById(id);
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        state.completed = data.completed || {};
        state.quizBest = typeof data.quizBest === 'number' ? data.quizBest : null;
      }
    } catch (e) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ completed: state.completed, quizBest: state.quizBest })
      );
    } catch (e) {}
  }

  function completedCount() {
    return MODULES.filter(function (m) {
      return state.completed[m.id];
    }).length;
  }

  function updateHeroStats() {
    var done = completedCount();
    var pct = Math.round((done / MODULES.length) * 100);
    $('statModulesDone').textContent = String(done);
    $('statModulesTotal').textContent = String(MODULES.length);
    $('statProgressPct').textContent = pct + '%';
    $('statQuizBest').textContent =
      state.quizBest === null ? '—' : state.quizBest + '/' + QUIZ.length;
    $('heroProgressFill').style.width = pct + '%';
    $('heroProgressBar').setAttribute('aria-valuenow', String(pct));
  }

  function renderModuleList() {
    var ul = $('moduleList');
    ul.innerHTML = '';
    MODULES.forEach(function (mod, idx) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quorum-module-btn';
      if (idx === state.activeModule) btn.classList.add('is-active');
      if (state.completed[mod.id]) btn.classList.add('is-done');
      btn.innerHTML =
        '<span class="quorum-module-title">' +
        escapeHtml(mod.title) +
        '</span><span class="quorum-module-short">' +
        escapeHtml(mod.short) +
        '</span>';
      btn.addEventListener('click', function () {
        state.activeModule = idx;
        renderModuleList();
        renderLesson();
      });
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderLesson() {
    var mod = MODULES[state.activeModule];
    $('lessonTitle').textContent = mod.title;
    $('lessonBody').innerHTML = mod.html;
    var badge = $('lessonBadge');
    var done = !!state.completed[mod.id];
    badge.hidden = !done;
    $('markCompleteBtn').disabled = done;
    $('prevModuleBtn').disabled = state.activeModule === 0;
    $('nextModuleBtn').disabled = state.activeModule === MODULES.length - 1;
  }

  function syncQuorumSliders() {
    var n = Number($('simN').value);
    var r = $('simR');
    var w = $('simW');
    r.max = String(n);
    w.max = String(n);
    if (Number(r.value) > n) r.value = String(n);
    if (Number(w.value) > n) w.value = String(n);
    $('simNVal').textContent = String(n);
    $('simRVal').textContent = r.value;
    $('simWVal').textContent = w.value;
    $('simN').setAttribute('aria-valuetext', String(n));
    rebuildReplicaFaults(n);
  }

  function rebuildReplicaFaults(n) {
    var prev = state.replicaStatus.slice();
    state.replicaStatus = [];
    var wrap = $('replicaFaults');
    wrap.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var status = prev[i] || 'healthy';
      state.replicaStatus.push(status);
      var card = document.createElement('div');
      card.className = 'quorum-replica-card';
      var id = 'replicaStatus' + i;
      card.innerHTML =
        '<label for="' +
        id +
        '">Replica ' +
        (i + 1) +
        '</label>' +
        '<select id="' +
        id +
        '" data-idx="' +
        i +
        '" aria-label="Status for replica ' +
        (i + 1) +
        '">' +
        '<option value="healthy">Healthy</option>' +
        '<option value="slow">Slow</option>' +
        '<option value="failed">Failed</option>' +
        '</select>';
      wrap.appendChild(card);
      var sel = card.querySelector('select');
      sel.value = status;
      sel.addEventListener('change', function (ev) {
        var idx = Number(ev.target.getAttribute('data-idx'));
        state.replicaStatus[idx] = ev.target.value;
      });
    }
  }

  function runSimulation() {
    var n = Number($('simN').value);
    var r = Number($('simR').value);
    var w = Number($('simW').value);
    var healthy = 0;
    var slow = 0;
    var failed = 0;
    state.replicaStatus.forEach(function (s) {
      if (s === 'healthy') healthy += 1;
      else if (s === 'slow') slow += 1;
      else failed += 1;
    });
    var usable = healthy + slow;
    var strictHealthy = healthy;
    var overlap = r + w > n;
    var readOk = usable >= r;
    var writeOk = usable >= w;
    var writeFast = strictHealthy >= w;

    $('simQuorumRule').textContent = overlap ? 'YES' : 'NO';
    $('simHealthy').textContent = usable + ' / ' + n;
    $('simReadAvail').textContent = readOk ? 'YES' : 'NO';
    $('simWriteAvail').textContent = writeOk ? 'YES' : 'NO';

    var box = $('simOutcome');
    var parts = [];
    if (overlap) {
      parts.push(
        '<span class="quorum-tag quorum-tag-ok">Consistent overlap</span> R+W&gt;N holds — successful reads intersect writes.'
      );
    } else {
      parts.push(
        '<span class="quorum-tag quorum-tag-warn">Weak overlap</span> R+W≤N — stale or divergent reads are possible.'
      );
    }
    if (!readOk || !writeOk) {
      parts.push(
        '<p><span class="quorum-tag quorum-tag-bad">Unavailable</span> Usable replicas (' +
          usable +
          ') cannot form ' +
          (!readOk && !writeOk ? 'read or write' : !readOk ? 'read' : 'write') +
          ' quorum. Failed: ' +
          failed +
          ', slow: ' +
          slow +
          '.</p>'
      );
      box.className = 'quorum-outcome-box is-bad';
    } else if (!writeFast) {
      parts.push(
        '<p><span class="quorum-tag quorum-tag-warn">Degraded latency</span> Writes may wait on slow replicas to reach W=' +
          w +
          '. Prefer hedging or excluding slow nodes from the fast path.</p>'
      );
      box.className = 'quorum-outcome-box is-warn';
    } else {
      parts.push(
        '<p><span class="quorum-tag quorum-tag-ok">Available</span> Read and write quorums can form on healthy/slow set. Consistency: ' +
          (overlap ? 'strong overlap' : 'eventual / possible stale') +
          '.</p>'
      );
      box.className = 'quorum-outcome-box is-ok';
    }
    box.innerHTML = parts.join('');
  }

  function runElection() {
    var timeout = Number($('electionTimeout').value);
    var hb = Number($('heartbeatInterval').value);
    var loss = Number($('packetLoss').value);
    var size = Number($('clusterSize').value);
    var margin = timeout - hb;
    var stormScore = 0;
    if (timeout < hb * 2) stormScore += 40;
    if (margin < 80) stormScore += 25;
    stormScore += Math.min(40, loss * 0.7);
    if (size >= 7 && loss > 15) stormScore += 10;
    stormScore = Math.min(100, Math.round(stormScore));

    var risk =
      stormScore >= 70 ? 'high' : stormScore >= 40 ? 'moderate' : 'low';
    var tag =
      risk === 'high'
        ? 'quorum-tag-bad'
        : risk === 'moderate'
          ? 'quorum-tag-warn'
          : 'quorum-tag-ok';

    var html =
      '<p><span class="quorum-tag ' +
      tag +
      '">Storm risk: ' +
      risk +
      '</span> Score ' +
      stormScore +
      '/100</p>' +
      '<ul>' +
      '<li>Safety margin (timeout − heartbeat): <strong>' +
      margin +
      ' ms</strong></li>' +
      '<li>Majority needed: <strong>' +
      (Math.floor(size / 2) + 1) +
      '</strong> of ' +
      size +
      '</li>' +
      '<li>Packet loss ' +
      loss +
      '% ' +
      (loss > 20
        ? 'likely causes false leader failure detection.'
        : 'is within a typical lab range.') +
      '</li>' +
      '</ul>';

    if (risk === 'high') {
      html +=
        '<p>Recommendation: raise election timeout, keep heartbeats stable, and randomize timeouts to avoid correlated elections.</p>';
    } else if (risk === 'moderate') {
      html +=
        '<p>Recommendation: increase timeout/heartbeat ratio and validate under chaos packet-loss tests.</p>';
    } else {
      html +=
        '<p>Recommendation: configuration looks stable for steady-state; still load-test failover latency.</p>';
    }

    $('electionResult').innerHTML = html;
  }

  function recommendBudget() {
    var p99 = Number($('budgetP99').value) || 120;
    var rtt = Number($('budgetReplicaRtt').value) || 15;
    var strong = $('budgetStrongConsistency').checked;
    var avail = $('budgetHighAvailability').checked;
    var lowWrite = $('budgetLowWriteLatency').checked;
    var cross = $('budgetCrossRegion').checked;

    var n = cross ? 5 : 3;
    var w = lowWrite ? 1 : strong ? Math.ceil(n / 2) + (n >= 5 ? 0 : 0) : 2;
    var r = strong ? n - w + 1 : 1;
    if (strong) {
      while (r + w <= n) r += 1;
    }
    if (avail && !strong) {
      r = 1;
      w = Math.min(w, 2);
    }
    if (lowWrite) w = Math.min(w, cross ? 2 : 1);
    if (strong && r + w <= n) r = n - w + 1;

    var quorumWait = Math.ceil(w * rtt * (cross ? 1.8 : 1.2));
    var election = Math.max(hbSafe(rtt), Math.round(p99 * 0.8));
    var okBudget = quorumWait < p99 * 0.6;

    var html =
      '<p><strong>Suggested:</strong> N=' +
      n +
      ', R=' +
      r +
      ', W=' +
      w +
      ' (' +
      (r + w > n ? 'R+W&gt;N ✓' : 'R+W≤N — tunable/eventual') +
      ')</p>' +
      '<ul>' +
      '<li>Estimated quorum wait ≈ <strong>' +
      quorumWait +
      ' ms</strong> vs p99 target <strong>' +
      p99 +
      ' ms</strong> — ' +
      (okBudget ? 'fits budget' : 'may miss p99; lower W or keep replicas closer') +
      '.</li>' +
      '<li>Election timeout starting point ≈ <strong>' +
      election +
      ' ms</strong> (≫ local RTT ' +
      rtt +
      ' ms).</li>' +
      '<li>' +
      (strong
        ? 'Strong consistency prioritized — expect lower availability under multi-replica loss.'
        : 'Availability prioritized — document stale-read windows for clients.') +
      '</li>' +
      (cross
        ? '<li>Cross-region: consider regional W=1 + async replicate, or accept higher write latency.</li>'
        : '') +
      '</ul>';

    $('budgetResults').innerHTML = html;
  }

  function hbSafe(rtt) {
    return Math.max(150, Math.round(rtt * 8));
  }

  function renderQuiz() {
    var wrap = $('quizQuestions');
    wrap.innerHTML = '';
    QUIZ.forEach(function (item, idx) {
      var field = document.createElement('div');
      field.className = 'quorum-quiz-q';
      var fs = document.createElement('fieldset');
      var leg = document.createElement('legend');
      leg.textContent = idx + 1 + '. ' + item.q;
      fs.appendChild(leg);
      item.choices.forEach(function (choice, cIdx) {
        var id = 'quorum-q' + idx + '-' + cIdx;
        var label = document.createElement('label');
        label.className = 'quorum-quiz-option';
        label.setAttribute('for', id);
        label.innerHTML =
          '<input type="radio" name="quorum-q' +
          idx +
          '" id="' +
          id +
          '" value="' +
          cIdx +
          '" /> ' +
          escapeHtml(choice);
        fs.appendChild(label);
      });
      field.appendChild(fs);
      wrap.appendChild(field);
    });
  }

  function submitQuiz(ev) {
    ev.preventDefault();
    var score = 0;
    var unanswered = 0;
    QUIZ.forEach(function (item, idx) {
      var selected = document.querySelector('input[name="quorum-q' + idx + '"]:checked');
      if (!selected) {
        unanswered += 1;
        return;
      }
      if (Number(selected.value) === item.answer) score += 1;
    });
    var result = $('quizResult');
    result.hidden = false;
    if (unanswered) {
      result.className = 'quorum-quiz-result is-fail';
      result.textContent = 'Please answer all questions (' + unanswered + ' left).';
      return;
    }
    if (state.quizBest === null || score > state.quizBest) {
      state.quizBest = score;
      saveProgress();
      updateHeroStats();
    }
    var pass = score >= Math.ceil(QUIZ.length * 0.7);
    result.className = 'quorum-quiz-result ' + (pass ? 'is-pass' : 'is-fail');
    result.textContent =
      'Score: ' +
      score +
      ' / ' +
      QUIZ.length +
      '. Best: ' +
      state.quizBest +
      ' / ' +
      QUIZ.length +
      '. ' +
      (pass ? 'Solid grasp of quorum & latency tradeoffs.' : 'Review the modules and retry.');
  }

  function bindSlider(id, labelId, extra) {
    var el = $(id);
    var lab = $(labelId);
    function sync() {
      lab.textContent = el.value;
      if (extra) extra();
    }
    el.addEventListener('input', sync);
    sync();
  }

  function init() {
    loadProgress();
    renderModuleList();
    renderLesson();
    updateHeroStats();
    renderQuiz();
    syncQuorumSliders();

    $('simN').addEventListener('input', syncQuorumSliders);
    $('simR').addEventListener('input', syncQuorumSliders);
    $('simW').addEventListener('input', syncQuorumSliders);
    $('runSimBtn').addEventListener('click', runSimulation);
    $('resetSimBtn').addEventListener('click', function () {
      state.replicaStatus = state.replicaStatus.map(function () {
        return 'healthy';
      });
      rebuildReplicaFaults(Number($('simN').value));
      runSimulation();
    });

    bindSlider('electionTimeout', 'electionTimeoutVal');
    bindSlider('heartbeatInterval', 'heartbeatIntervalVal');
    bindSlider('packetLoss', 'packetLossVal');
    bindSlider('clusterSize', 'clusterSizeVal');
    $('runElectionBtn').addEventListener('click', runElection);

    $('recommendBtn').addEventListener('click', recommendBudget);
    $('resetBudgetBtn').addEventListener('click', function () {
      $('budgetP99').value = '120';
      $('budgetReplicaRtt').value = '15';
      $('budgetStrongConsistency').checked = true;
      $('budgetHighAvailability').checked = false;
      $('budgetLowWriteLatency').checked = false;
      $('budgetCrossRegion').checked = false;
      $('budgetResults').innerHTML =
        '<p class="quorum-muted">Set latency targets and click Recommend.</p>';
    });

    $('markCompleteBtn').addEventListener('click', function () {
      var mod = MODULES[state.activeModule];
      state.completed[mod.id] = true;
      saveProgress();
      updateHeroStats();
      renderModuleList();
      renderLesson();
    });
    $('prevModuleBtn').addEventListener('click', function () {
      if (state.activeModule > 0) {
        state.activeModule -= 1;
        renderModuleList();
        renderLesson();
      }
    });
    $('nextModuleBtn').addEventListener('click', function () {
      if (state.activeModule < MODULES.length - 1) {
        state.activeModule += 1;
        renderModuleList();
        renderLesson();
      }
    });

    $('quizForm').addEventListener('submit', submitQuiz);
    $('resetQuizBtn').addEventListener('click', function () {
      $('quizForm').reset();
      $('quizResult').hidden = true;
    });

    runSimulation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
