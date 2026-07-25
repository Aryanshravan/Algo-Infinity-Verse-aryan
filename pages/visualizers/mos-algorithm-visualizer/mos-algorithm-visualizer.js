document.addEventListener('DOMContentLoaded', function() {
  moInit();
});

var moState = {
  arr: [],
  queries: [],
  sortedQueries: [],
  n: 18,
  freq: {},
  distinctCount: 0,
  curL: 0,
  curR: -1,
  movements: 0,
  answers: [],
  autoTimer: null,
  playing: false,
  stepQueue: [],
  stepIdx: 0,
};

function moGenerateArray() {
  var arr = [];
  for (var i = 0; i < moState.n; i++) arr.push(1 + Math.floor(Math.random() * 6));
  return arr;
}

function moGenerateQueries() {
  var qs = [];
  for (var i = 0; i < 7; i++) {
    var l = Math.floor(Math.random() * moState.n);
    var r = l + Math.floor(Math.random() * (moState.n - l));
    qs.push({ l: l, r: r, idx: i });
  }
  return qs;
}

function moSortQueries(queries, n) {
  var blockSize = Math.max(1, Math.floor(Math.sqrt(n)));
  var indexed = queries.map(function(q) { return { l: q.l, r: q.r, idx: q.idx }; });
  indexed.sort(function(a, b) {
    var ba = Math.floor(a.l / blockSize), bb = Math.floor(b.l / blockSize);
    if (ba !== bb) return ba - bb;
    return (ba % 2 === 0) ? a.r - b.r : b.r - a.r;
  });
  return indexed;
}

function moAdd(x) {
  if (moState.freq[x] === undefined) moState.freq[x] = 0;
  if (moState.freq[x] === 0) moState.distinctCount++;
  moState.freq[x]++;
}

function moRemove(x) {
  moState.freq[x]--;
  if (moState.freq[x] === 0) moState.distinctCount--;
}

function moRenderArray(movingIdx, movingType) {
  var track = document.getElementById('moArrayTrack');
  if (!track) return;
  track.innerHTML = moState.arr.map(function(v, i) {
    var inWindow = i >= moState.curL && i <= moState.curR;
    var cls = 'mo-array-cell' + (inWindow ? ' in-window' : '') + (i === movingIdx ? (movingType === 'in' ? ' moving-in' : ' moving-out') : '');
    var pointerLabel = '';
    if (i === moState.curL && moState.curR >= moState.curL) pointerLabel += '<span class="mo-array-pointer left">L</span>';
    if (i === moState.curR && moState.curR >= moState.curL) pointerLabel += '<span class="mo-array-pointer right">R</span>';
    return '<div class="' + cls + '">' + pointerLabel + v + '<span class="mo-array-cell-idx">' + i + '</span></div>';
  }).join('');

  var infoEl = document.getElementById('moWindowInfo');
  if (infoEl) infoEl.textContent = 'Window: [' + (moState.curR >= moState.curL ? moState.curL : '—') + ', ' + (moState.curR >= moState.curL ? moState.curR : '—') + '] · Distinct count: ' + moState.distinctCount;
}

function moRenderQueryLists(executingIdx) {
  var origEl = document.getElementById('moOriginalList');
  var sortedEl = document.getElementById('moSortedList');
  if (!origEl || !sortedEl) return;

  origEl.innerHTML = moState.queries.map(function(q) {
    return '<div class="mo-query-item">Q' + q.idx + ': [' + q.l + ', ' + q.r + ']</div>';
  }).join('');

  sortedEl.innerHTML = moState.sortedQueries.map(function(q, i) {
    var cls = 'mo-query-item' + (i === executingIdx ? ' executing' : (executingIdx !== undefined && i < executingIdx ? ' done' : ''));
    return '<div class="' + cls + '">Q' + q.idx + ': [' + q.l + ', ' + q.r + ']</div>';
  }).join('');
}

function moRenderAnswers() {
  var grid = document.getElementById('moAnswersGrid');
  if (!grid) return;
  grid.innerHTML = moState.queries.map(function(q) {
    var ans = moState.answers[q.idx];
    return '<div class="mo-answer-row"><span>Q' + q.idx + ' [' + q.l + ',' + q.r + ']</span><span>' + (ans !== undefined ? ans : '—') + '</span></div>';
  }).join('');
}

function moAddLog(msg) {
  var el = document.getElementById('moStatus');
  if (el) { el.textContent = msg; el.className = 'mo-status good'; }
}

function moBuildStepQueue() {
  var queue = [];
  moState.sortedQueries.forEach(function(q, qi) {
    queue.push({ type: 'query-start', qi: qi, q: q });
    while (moState.curR < q.r || moState.curL > q.l || moState.curR > q.r || moState.curL < q.l) {
      break;
    }
  });
  return queue;
}

function moResetSweep() {
  moState.freq = {};
  moState.distinctCount = 0;
  moState.curL = 0;
  moState.curR = -1;
  moState.movements = 0;
  moState.answers = [];
}

function moRunFullSync() {
  moResetSweep();
  moState.sortedQueries.forEach(function(q) {
    while (moState.curR < q.r) { moState.curR++; moAdd(moState.arr[moState.curR]); moState.movements++; }
    while (moState.curL > q.l) { moState.curL--; moAdd(moState.arr[moState.curL]); moState.movements++; }
    while (moState.curR > q.r) { moRemove(moState.arr[moState.curR]); moState.curR--; moState.movements++; }
    while (moState.curL < q.l) { moRemove(moState.arr[moState.curL]); moState.curL++; moState.movements++; }
    moState.answers[q.idx] = moState.distinctCount;
  });
}

function moUpdateStats() {
  var moveEl = document.getElementById('moMoveCount');
  var boundEl = document.getElementById('moBound');
  var naiveEl = document.getElementById('moNaiveCost');
  var n = moState.n; var Q = moState.queries.length;

  if (moveEl) moveEl.textContent = moState.movements;
  if (boundEl) boundEl.textContent = '~' + Math.round((n + Q) * Math.sqrt(n));
  if (naiveEl) {
    var naiveCost = moState.queries.reduce(function(sum, q) { return sum + (q.r - q.l + 1); }, 0);
    naiveEl.textContent = naiveCost + ' (O(range length) per query, recomputed from scratch)';
  }
}

function moRunAnimated() {
  if (moState.playing) return;
  moResetSweep();
  moState.playing = true;

  var qi = 0;

  function processNextQuery() {
    if (qi >= moState.sortedQueries.length) {
      moState.playing = false;
      moRenderQueryLists(moState.sortedQueries.length);
      moUpdateStats();
      moRenderAnswers();
      moAddLog('All ' + moState.queries.length + ' queries answered. Total pointer movements: ' + moState.movements + '.');
      return;
    }

    var q = moState.sortedQueries[qi];
    moRenderQueryLists(qi);

    var moves = [];
    while (moState.curR < q.r) { moState.curR++; moves.push({ i: moState.curR, type: 'in' }); }
    while (moState.curL > q.l) { moState.curL--; moves.push({ i: moState.curL, type: 'in' }); }
    while (moState.curR > q.r) { moves.push({ i: moState.curR, type: 'out', removeAfter: true }); moState.curR--; }
    while (moState.curL < q.l) { moves.push({ i: moState.curL, type: 'out', removeAfter: true }); moState.curL++; }

    var mi = 0;
    function processMove() {
      if (mi >= moves.length) {
        moState.answers[q.idx] = moState.distinctCount;
        qi++;
        setTimeout(processNextQuery, 300);
        return;
      }
      var m = moves[mi];
      if (m.type === 'in') { moAdd(moState.arr[m.i]); moState.movements++; }
      else { moRemove(moState.arr[m.i]); moState.movements++; }

      moRenderArray(m.i, m.type);
      moUpdateStats();
      mi++;
      setTimeout(processMove, 90);
    }
    processMove();
  }

  processNextQuery();
}

function moCompareHandler() {
  var card = document.getElementById('moCompareCard');
  if (card) card.classList.remove('hidden');

  moResetSweep();
  moRunFullSync();
  var sortedMovements = moState.movements;

  moResetSweep();
  var originalOrder = moState.queries.slice();
  originalOrder.forEach(function(q) {
    while (moState.curR < q.r) { moState.curR++; moAdd(moState.arr[moState.curR]); moState.movements++; }
    while (moState.curL > q.l) { moState.curL--; moAdd(moState.arr[moState.curL]); moState.movements++; }
    while (moState.curR > q.r) { moRemove(moState.arr[moState.curR]); moState.curR--; moState.movements++; }
    while (moState.curL < q.l) { moRemove(moState.arr[moState.curL]); moState.curL++; moState.movements++; }
  });
  var originalMovements = moState.movements;

  moDrawCompareChart(sortedMovements, originalMovements);

  moResetSweep();
  moRunFullSync();
  moRenderArray();
  moUpdateStats();
  moRenderAnswers();
}

function moDrawCompareChart(sortedMoves, originalMoves) {
  var canvas = document.getElementById('moCompareCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 220;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var W = canvas.width; var H = canvas.height;
  var pad = { top: 30, right: 40, bottom: 40, left: 40 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;
  var maxVal = Math.max(sortedMoves, originalMoves) * 1.2;

  var barW = plotW / 4;

  function drawBar(x, val, color, label) {
    var h = (val / maxVal) * plotH;
    var y = pad.top + plotH - h;
    ctx.fillStyle = color + '55';
    ctx.fillRect(x, y, barW, h);
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barW, h);

    ctx.fillStyle = color; ctx.font = 'bold 14px Fira Code,monospace'; ctx.textAlign = 'center';
    ctx.fillText(val, x + barW / 2, y - 8);

    ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px Poppins,sans-serif';
    ctx.fillText(label, x + barW / 2, H - 15);
  }

  drawBar(pad.left + barW * 0.4, sortedMoves, '#22c55e', "Mo's sorted order");
  drawBar(pad.left + barW * 2.2, originalMoves, '#ef4444', 'Original arrival order');

  ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '9px Poppins,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('total pointer movements', pad.left, 15);
}

function moStepHandler() {
  if (moState.stepQueue.length === 0) {
    moResetSweep();
    moState.stepQueue = moState.sortedQueries.slice();
    moState.stepIdx = 0;
  }

  if (moState.stepIdx >= moState.stepQueue.length) {
    moAddLog('All queries complete. Click Run for a fresh animated pass, or Randomize to start over.');
    return;
  }

  var q = moState.stepQueue[moState.stepIdx];
  while (moState.curR < q.r) { moState.curR++; moAdd(moState.arr[moState.curR]); moState.movements++; }
  while (moState.curL > q.l) { moState.curL--; moAdd(moState.arr[moState.curL]); moState.movements++; }
  while (moState.curR > q.r) { moRemove(moState.arr[moState.curR]); moState.curR--; moState.movements++; }
  while (moState.curL < q.l) { moRemove(moState.arr[moState.curL]); moState.curL++; moState.movements++; }
  moState.answers[q.idx] = moState.distinctCount;

  moRenderArray();
  moRenderQueryLists(moState.stepIdx);
  moUpdateStats();
  moRenderAnswers();
  moAddLog('Executed query [' + q.l + ', ' + q.r + '] → distinct count = ' + moState.distinctCount + '.');

  moState.stepIdx++;
}

function moBuildAndRender() {
  moState.arr = moGenerateArray();
  moState.queries = moGenerateQueries();
  moState.sortedQueries = moSortQueries(moState.queries, moState.n);
  moState.stepQueue = [];
  moState.stepIdx = 0;
  moResetSweep();

  moRenderArray();
  moRenderQueryLists();
  moUpdateStats();
  moRenderAnswers();

  var card = document.getElementById('moCompareCard');
  if (card) card.classList.add('hidden');

  moAddLog('Array and queries generated. Run Mo\'s Algorithm to watch the sweep, or Step through manually.');
  document.getElementById('moStatus').className = 'mo-status';
}

function moInit() {
  moBuildAndRender();

  var randomizeBtn = document.getElementById('moRandomizeBtn');
  var genQueriesBtn = document.getElementById('moGenQueriesBtn');
  var runBtn = document.getElementById('moRunBtn');
  var stepBtn = document.getElementById('moStepBtn');
  var compareBtn = document.getElementById('moCompareBtn');

  if (randomizeBtn) randomizeBtn.addEventListener('click', moBuildAndRender);
  if (genQueriesBtn) genQueriesBtn.addEventListener('click', function() {
    moState.queries = moGenerateQueries();
    moState.sortedQueries = moSortQueries(moState.queries, moState.n);
    moState.stepQueue = [];
    moState.stepIdx = 0;
    moResetSweep();
    moRenderArray();
    moRenderQueryLists();
    moUpdateStats();
    moRenderAnswers();
  });
  if (runBtn) runBtn.addEventListener('click', moRunAnimated);
  if (stepBtn) stepBtn.addEventListener('click', moStepHandler);
  if (compareBtn) compareBtn.addEventListener('click', moCompareHandler);

  window.addEventListener('resize', function() {
    var card = document.getElementById('moCompareCard');
    if (card && !card.classList.contains('hidden')) moCompareHandler();
  });

  moInitHeroCanvas();
}

function moInitHeroCanvas() {
  var canvas = document.getElementById('moHeroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var t = 0;

  function resize() { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    var W = canvas.width; var H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    t += 0.015;

    var cellCount = 24;
    var cellW = W / cellCount;
    for (var i = 0; i < cellCount; i++) {
      var wobble = Math.sin(t + i * 0.4) * 0.5 + 0.5;
      ctx.fillStyle = 'rgba(6,182,212,' + (0.03 + wobble * 0.06) + ')';
      ctx.fillRect(i * cellW, H / 2 - 20 - wobble * 15, cellW - 3, 40 + wobble * 30);
    }

    var lx = (Math.sin(t * 0.5) * 0.5 + 0.5) * W * 0.6;
    var rx = lx + W * 0.15 + Math.sin(t * 0.7) * 30;
    ctx.strokeStyle = 'rgba(168,85,247,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
    ctx.strokeStyle = 'rgba(245,158,11,0.3)';
    ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, H); ctx.stroke();

    requestAnimationFrame(draw);
  }
  draw();
}