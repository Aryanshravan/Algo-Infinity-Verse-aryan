document.addEventListener('DOMContentLoaded', function() {
  chtInit();
});

var chtState = { lines: [], hull: [], winnerLine: null };
var lcState = { lines: [], size: 60, tree: {}, winnerNode: null };
var dpState = { items: [], results: [] };

function chtEvalLine(l, x) { return l.m * x + l.b; }

function chtBad(l1, l2, l3) {
  return (l3.b - l1.b) * (l1.m - l2.m) <= (l2.b - l1.b) * (l1.m - l3.m);
}

function chtRebuildHull(log) {
  var sorted = chtState.lines.slice().sort(function(a, b) { return b.m - a.m; });
  var hull = [];
  var discarded = [];

  sorted.forEach(function(line) {
    while (hull.length >= 2 && chtBad(hull[hull.length - 2], hull[hull.length - 1], line)) {
      discarded.push(hull.pop());
    }
    if (hull.length > 0 && hull[hull.length - 1].m === line.m) {
      if (hull[hull.length - 1].b <= line.b) { discarded.push(line); return; }
      discarded.push(hull.pop());
    }
    hull.push(line);
  });

  chtState.hull = hull;
  if (log && discarded.length > 0) {
    discarded.forEach(function(d) { log.push('Line y=' + d.m + 'x+' + d.b + ' discarded — permanently dominated, never optimal at any x.'); });
  }
  return hull;
}

function chtQueryBinary(hull, x) {
  if (hull.length === 0) return null;
  var lo = 0, hi = hull.length - 1, res = 0;
  while (lo <= hi) {
    var mid = (lo + hi) >> 1;
    var y1 = chtEvalLine(hull[mid], x);
    var y2 = mid + 1 < hull.length ? chtEvalLine(hull[mid + 1], x) : Infinity;
    if (y1 <= y2) { res = mid; hi = mid - 1; } else lo = mid + 1;
  }
  return { line: hull[res], value: chtEvalLine(hull[res], x), steps: Math.ceil(Math.log2(hull.length + 1)) };
}

function chtRenderPlane(canvasId, lines, hull, highlightLine, queryX) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 380;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var W = canvas.width; var H = canvas.height;
  var cx = W / 2; var cy = H / 2;
  var scale = 10;

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

  function toScreenX(x) { return cx + x * scale; }
  function toScreenY(y) { return cy - y * scale; }

  var hullSet = {};
  hull.forEach(function(l) { hullSet[l.m + ',' + l.b] = true; });

  lines.forEach(function(l) {
    var key = l.m + ',' + l.b;
    var isInHull = hullSet[key];
    var isHighlight = highlightLine && highlightLine.m === l.m && highlightLine.b === l.b;

    ctx.strokeStyle = isHighlight ? '#22c55e' : isInHull ? '#06b6d4' : 'rgba(239,68,68,0.2)';
    ctx.lineWidth = isHighlight ? 3 : isInHull ? 1.8 : 1;
    ctx.beginPath();
    var x1 = -cx / scale; var x2 = (W - cx) / scale;
    ctx.moveTo(toScreenX(x1), toScreenY(chtEvalLine(l, x1)));
    ctx.lineTo(toScreenX(x2), toScreenY(chtEvalLine(l, x2)));
    ctx.stroke();
  });

  if (queryX !== undefined && queryX !== null) {
    ctx.strokeStyle = 'rgba(245,158,11,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(toScreenX(queryX), 0); ctx.lineTo(toScreenX(queryX), H); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 10px Fira Code,monospace'; ctx.textAlign = 'center';
    ctx.fillText('x=' + queryX, toScreenX(queryX), 14);
  }

  ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '9px Fira Code,monospace'; ctx.textAlign = 'left';
  ctx.fillText('■ envelope', 10, H - 10);
  ctx.fillStyle = 'rgba(239,68,68,0.5)';
  ctx.fillText('■ discarded', 90, H - 10);
}

function chtRenderHullList() {
  var container = document.getElementById('chtHullList');
  if (!container) return;
  if (chtState.hull.length === 0) { container.innerHTML = '<div class="cht-empty">No lines yet.</div>'; return; }

  container.innerHTML = chtState.hull.map(function(l) {
    var cls = 'cht-hull-item' + (chtState.winnerLine && chtState.winnerLine.m === l.m && chtState.winnerLine.b === l.b ? ' winner' : '');
    return '<div class="' + cls + '"><span>y = ' + l.m + 'x + ' + l.b + '</span></div>';
  }).join('');
}

function chtAddLog(msg, cls) {
  var log = document.getElementById('chtLog');
  if (!log) return;
  var empty = log.querySelector('.cht-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'cht-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function chtSetStatus(msg, cls) {
  var el = document.getElementById('chtStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'cht-status ' + (cls || '');
}

function chtUpdateStats() {
  var linesEl = document.getElementById('chtLinesAdded');
  var envEl = document.getElementById('chtEnvelopeSize');
  var naiveEl = document.getElementById('chtNaiveCost');
  var hullEl = document.getElementById('chtHullCost');

  if (linesEl) linesEl.textContent = chtState.lines.length;
  if (envEl) envEl.textContent = chtState.hull.length;
  if (naiveEl) naiveEl.textContent = chtState.lines.length + ' evaluations per query';
  if (hullEl) hullEl.textContent = chtState.hull.length > 0 ? Math.ceil(Math.log2(chtState.hull.length + 1)) + ' evaluations per query (binary search)' : '—';
}

function chtAddLineHandler() {
  var mInput = document.getElementById('chtSlopeInput');
  var bInput = document.getElementById('chtInterceptInput');
  var m = parseFloat(mInput.value); var b = parseFloat(bInput.value);
  if (isNaN(m) || isNaN(b)) { chtSetStatus('Enter valid slope and intercept.', ''); return; }

  chtState.lines.push({ m: m, b: b });
  var log = [];
  chtRebuildHull(log);

  chtState.winnerLine = null;
  chtRenderPlane('chtPlaneCanvas', chtState.lines, chtState.hull, null, null);
  chtRenderHullList();
  chtUpdateStats();

  chtAddLog('Added y = ' + m + 'x + ' + b + '. Envelope now has ' + chtState.hull.length + ' line(s).', '');
  log.forEach(function(msg) { chtAddLog(msg, 'discard'); });

  chtSetStatus(log.length > 0 ? log.length + ' line(s) discarded as permanently dominated.' : 'Line added to the envelope — currently optimal somewhere.', log.length > 0 ? 'discard' : 'good');
}

function chtRandomLinesHandler() {
  for (var i = 0; i < 6; i++) {
    chtState.lines.push({ m: -6 + Math.floor(Math.random() * 13), b: -10 + Math.floor(Math.random() * 21) });
  }
  var log = [];
  chtRebuildHull(log);
  chtState.winnerLine = null;
  chtRenderPlane('chtPlaneCanvas', chtState.lines, chtState.hull, null, null);
  chtRenderHullList();
  chtUpdateStats();
  chtAddLog('6 random lines added. ' + chtState.hull.length + ' survived into the envelope.', '');
  chtSetStatus('6 random lines added. Envelope reduced ' + chtState.lines.length + ' total lines down to ' + chtState.hull.length + '.', 'good');
}

function chtQueryHandler() {
  if (chtState.hull.length === 0) { chtSetStatus('Add lines first.', ''); return; }
  var xInput = document.getElementById('chtQueryInput');
  var x = parseFloat(xInput.value);
  if (isNaN(x)) { chtSetStatus('Enter a valid query x.', ''); return; }

  var result = chtQueryBinary(chtState.hull, x);
  var bruteMin = Math.min.apply(null, chtState.lines.map(function(l) { return chtEvalLine(l, x); }));

  chtState.winnerLine = result.line;
  chtRenderPlane('chtPlaneCanvas', chtState.lines, chtState.hull, result.line, x);
  chtRenderHullList();

  chtAddLog('Query x=' + x + ': binary search over ' + chtState.hull.length + ' hull lines (' + result.steps + ' step(s)) → min y = ' + result.value.toFixed(2) + '.', 'done');
  chtSetStatus('At x=' + x + ', minimum y = ' + result.value.toFixed(2) + ' (line y=' + result.line.m + 'x+' + result.line.b + '). Verified against brute force: ' + (Math.abs(result.value - bruteMin) < 1e-9 ? 'match ✅' : 'mismatch ❌') + '.', 'good');
}

function chtResetHandler() {
  chtState.lines = [];
  chtState.hull = [];
  chtState.winnerLine = null;
  chtRenderPlane('chtPlaneCanvas', [], [], null, null);
  chtRenderHullList();
  chtUpdateStats();
  var log = document.getElementById('chtLog');
  if (log) log.innerHTML = '<div class="cht-empty">No activity yet.</div>';
  chtSetStatus('Reset. Add lines to build the envelope.', '');
}

function lcInsert(node, lo, hi, newLine, log) {
  if (!lcState.tree[node]) lcState.tree[node] = null;
  var mid = Math.floor((lo + hi) / 2);
  var cur = lcState.tree[node];

  if (!cur) { lcState.tree[node] = newLine; if (log) log.push('Node [' + lo + ',' + hi + ']: empty — stores y=' + newLine.m + 'x+' + newLine.b + '.'); return; }

  var curAtMid = chtEvalLine(cur, mid);
  var newAtMid = chtEvalLine(newLine, mid);
  var curLeft = chtEvalLine(cur, lo) > chtEvalLine(newLine, lo);
  var curRight = chtEvalLine(cur, hi) > chtEvalLine(newLine, hi);

  if (newAtMid < curAtMid) {
    lcState.tree[node] = newLine;
    if (log) log.push('Node [' + lo + ',' + hi + ']: new line better at midpoint ' + mid + ' — swaps in, old line pushed down.');
    newLine = cur;
  }

  if (lo === hi) return;

  if (chtEvalLine(newLine, lo) < chtEvalLine(lcState.tree[node], lo)) lcInsert(node * 2, lo, mid, newLine, log);
  else lcInsert(node * 2 + 1, mid + 1, hi, newLine, log);
}

function lcQuery(node, lo, hi, x) {
  if (!lcState.tree[node]) return Infinity;
  var best = chtEvalLine(lcState.tree[node], x);
  if (lo === hi) return best;
  var mid = Math.floor((lo + hi) / 2);
  if (x <= mid) return Math.min(best, lcQuery(node * 2, lo, mid, x));
  return Math.min(best, lcQuery(node * 2 + 1, mid + 1, hi, x));
}

function lcRenderPlane(highlightX) {
  var lines = lcState.lines;
  chtRenderPlane('lcPlaneCanvas', lines, lines, null, highlightX);
}

function lcRenderTreeList() {
  var container = document.getElementById('lcTreeList');
  if (!container) return;
  var entries = Object.keys(lcState.tree).filter(function(k) { return lcState.tree[k]; });
  if (entries.length === 0) { container.innerHTML = '<div class="cht-empty">No lines yet.</div>'; return; }
  container.innerHTML = entries.map(function(node) {
    var l = lcState.tree[node];
    return '<div class="cht-hull-item"><span>node ' + node + ': y=' + l.m + 'x+' + l.b + '</span></div>';
  }).join('');
}

function lcAddLog(msg, cls) {
  var log = document.getElementById('lcLog');
  if (!log) return;
  var empty = log.querySelector('.cht-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'cht-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function lcSetStatus(msg, cls) {
  var el = document.getElementById('lcStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'cht-status ' + (cls || '');
}

function lcAddLineHandler() {
  var mInput = document.getElementById('lcSlopeInput');
  var bInput = document.getElementById('lcInterceptInput');
  var m = parseFloat(mInput.value); var b = parseFloat(bInput.value);
  if (isNaN(m) || isNaN(b)) { lcSetStatus('Enter valid slope and intercept.', ''); return; }

  var line = { m: m, b: b };
  lcState.lines.push(line);
  var log = [];
  lcInsert(1, -lcState.size, lcState.size, line, log);

  lcRenderPlane(null);
  lcRenderTreeList();
  log.forEach(function(msg) { lcAddLog(msg, ''); });
  lcSetStatus('Inserted y=' + m + 'x+' + b + ' — Li Chao Tree correctly handles any insertion order, no sorting required.', 'good');
}

function lcRandomLinesHandler() {
  var order = [];
  for (var i = 0; i < 6; i++) order.push({ m: -8 + Math.floor(Math.random() * 17), b: -15 + Math.floor(Math.random() * 31) });
  order.forEach(function(line) {
    lcState.lines.push(line);
    lcInsert(1, -lcState.size, lcState.size, line, null);
  });
  lcRenderPlane(null);
  lcRenderTreeList();
  lcAddLog('6 lines inserted in random slope order (non-monotonic) — Li Chao Tree handles this correctly, unlike the sorted-envelope Convex Hull Trick.', '');
  lcSetStatus('6 random lines inserted in arbitrary order.', 'good');
}

function lcQueryHandler() {
  if (lcState.lines.length === 0) { lcSetStatus('Insert lines first.', ''); return; }
  var xInput = document.getElementById('lcQueryInput');
  var xRaw = parseFloat(xInput.value);
  if (isNaN(xRaw)) { lcSetStatus('Enter a valid query x.', ''); return; }
  var x = Math.round(xRaw);

  var result = lcQuery(1, -lcState.size, lcState.size, x);
  var bruteMin = Math.min.apply(null, lcState.lines.map(function(l) { return chtEvalLine(l, x); }));

  lcRenderPlane(x);
  lcAddLog('Query x=' + x + ' → min y = ' + result.toFixed(2) + ' via O(log(range)) tree descent.', 'done');
  lcSetStatus('At x=' + x + ', minimum y = ' + result.toFixed(2) + '. Verified against brute force: ' + (Math.abs(result - bruteMin) < 1e-6 ? 'match ✅' : 'mismatch ❌') + '.', 'good');
}

function lcResetHandler() {
  lcState.lines = [];
  lcState.tree = {};
  lcRenderPlane(null);
  lcRenderTreeList();
  var log = document.getElementById('lcLog');
  if (log) log.innerHTML = '<div class="cht-empty">No activity yet.</div>';
  lcSetStatus('Reset. Insert lines in any order.', '');
}

function dpGenerateItems() {
  var items = [];
  for (var i = 0; i < 10; i++) items.push(1 + Math.floor(Math.random() * 9));
  return items;
}

function dpSolveNaive(items) {
  var n = items.length;
  var prefix = [0];
  for (var i = 0; i < n; i++) prefix.push(prefix[i] + items[i]);
  var OPT = new Array(n + 1).fill(Infinity);
  OPT[0] = 0;
  var ops = 0;
  for (var i = 1; i <= n; i++) {
    for (var j = 0; j < i; j++) {
      ops++;
      var cost = OPT[j] + Math.pow(prefix[i] - prefix[j], 2) + 5;
      if (cost < OPT[i]) OPT[i] = cost;
    }
  }
  return { OPT: OPT, ops: ops };
}

function dpSolveCHT(items) {
  var n = items.length;
  var prefix = [0];
  for (var i = 0; i < n; i++) prefix.push(prefix[i] + items[i]);
  var OPT = new Array(n + 1).fill(Infinity);
  OPT[0] = 0;

  var hullLines = [];
  var ops = 0;

  function addLineToHull(line) {
    hullLines.push(line);
    hullLines.sort(function(a, b) { return b.m - a.m; });
    var newHull = [];
    hullLines.forEach(function(l) {
      while (newHull.length >= 2 && chtBad(newHull[newHull.length - 2], newHull[newHull.length - 1], l)) newHull.pop();
      if (newHull.length > 0 && newHull[newHull.length - 1].m === l.m) {
        if (newHull[newHull.length - 1].b <= l.b) return;
        newHull.pop();
      }
      newHull.push(l);
    });
    hullLines = newHull;
  }

  addLineToHull({ m: -2 * prefix[0], b: OPT[0] + prefix[0] * prefix[0] });

  for (var j = 1; j <= n; j++) {
    var x = prefix[j];
    var q = chtQueryBinary(hullLines, x);
    ops += q.steps;
    OPT[j] = q.value + prefix[j] * prefix[j] + 5;
    addLineToHull({ m: -2 * prefix[j], b: OPT[j] + prefix[j] * prefix[j] });
  }

  return { OPT: OPT, ops: ops };
}

function dpRenderItems() {
  var container = document.getElementById('chtDpItems');
  if (!container) return;
  container.innerHTML = dpState.items.map(function(v, i) {
    return '<div class="cht-dp-item">' + v + '</div>';
  }).join('');
}

function dpRenderTable(naiveOPT, chtOPT) {
  var container = document.getElementById('chtDpTable');
  if (!container) return;
  container.innerHTML = naiveOPT.map(function(v, i) {
    var isFilled = v !== Infinity;
    return '<div class="cht-dp-cell' + (isFilled ? ' filled' : '') + '">OPT[' + i + ']<br>' + (isFilled ? v.toFixed(0) : '∞') + '</div>';
  }).join('');
}

function dpRandomizeHandler() {
  dpState.items = dpGenerateItems();
  dpRenderItems();
  var container = document.getElementById('chtDpTable');
  if (container) container.innerHTML = '';
  document.getElementById('chtDpNaiveOps').textContent = '—';
  document.getElementById('chtDpChtOps').textContent = '—';
  document.getElementById('chtDpMatch').textContent = '—';
}

function dpRunHandler() {
  if (dpState.items.length === 0) dpState.items = dpGenerateItems();
  dpRenderItems();

  var naiveResult = dpSolveNaive(dpState.items);
  var chtResult = dpSolveCHT(dpState.items);

  dpRenderTable(naiveResult.OPT, chtResult.OPT);

  var naiveOpsEl = document.getElementById('chtDpNaiveOps');
  var chtOpsEl = document.getElementById('chtDpChtOps');
  var matchEl = document.getElementById('chtDpMatch');

  if (naiveOpsEl) naiveOpsEl.textContent = naiveResult.ops + ' line evaluations';
  if (chtOpsEl) chtOpsEl.textContent = chtResult.ops + ' line evaluations';

  var lastNaive = naiveResult.OPT[naiveResult.OPT.length - 1];
  var lastCht = chtResult.OPT[chtResult.OPT.length - 1];
  var matches = Math.abs(lastNaive - lastCht) < 1e-6;

  if (matchEl) { matchEl.textContent = matches ? 'Yes ✅ (' + lastNaive.toFixed(1) + ')' : 'No ❌'; }

  document.getElementById('chtDpStatus').textContent = 'Solved! Naive used ' + naiveResult.ops + ' evaluations, CHT used ' + chtResult.ops + '. Final answer: ' + lastNaive.toFixed(1) + '. ' + (matches ? 'Both approaches agree exactly.' : 'Mismatch detected!');
  document.getElementById('chtDpStatus').className = 'cht-status good';
}

function chtInit() {
  document.querySelectorAll('.cht-mode-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.cht-mode-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var mode = tab.getAttribute('data-mode');
      document.querySelectorAll('.cht-panel').forEach(function(p) { p.classList.remove('active'); });
      var panelId = mode === 'hull' ? 'chtPanelHull' : mode === 'lichao' ? 'chtPanelLichao' : 'chtPanelDp';
      var panel = document.getElementById(panelId);
      if (panel) panel.classList.add('active');
    });
  });

  var addLineBtn = document.getElementById('chtAddLineBtn');
  var randomBtn = document.getElementById('chtRandomBtn');
  var resetBtn = document.getElementById('chtResetBtn');
  var queryBtn = document.getElementById('chtQueryBtn');
  if (addLineBtn) addLineBtn.addEventListener('click', chtAddLineHandler);
  if (randomBtn) randomBtn.addEventListener('click', chtRandomLinesHandler);
  if (resetBtn) resetBtn.addEventListener('click', chtResetHandler);
  if (queryBtn) queryBtn.addEventListener('click', chtQueryHandler);

  var lcAddBtn = document.getElementById('lcAddLineBtn');
  var lcRandomBtn = document.getElementById('lcRandomBtn');
  var lcResetBtn = document.getElementById('lcResetBtn');
  var lcQueryBtn = document.getElementById('lcQueryBtn');
  if (lcAddBtn) lcAddBtn.addEventListener('click', lcAddLineHandler);
  if (lcRandomBtn) lcRandomBtn.addEventListener('click', lcRandomLinesHandler);
  if (lcResetBtn) lcResetBtn.addEventListener('click', lcResetHandler);
  if (lcQueryBtn) lcQueryBtn.addEventListener('click', lcQueryHandler);

  var dpRandomBtn = document.getElementById('chtDpRandomBtn');
  var dpRunBtn = document.getElementById('chtDpRunBtn');
  if (dpRandomBtn) dpRandomBtn.addEventListener('click', dpRandomizeHandler);
  if (dpRunBtn) dpRunBtn.addEventListener('click', dpRunHandler);

  chtRenderPlane('chtPlaneCanvas', [], [], null, null);
  lcRenderPlane(null);
  dpRandomizeHandler();

  chtInitHeroCanvas();
  window.addEventListener('resize', function() {
    chtRenderPlane('chtPlaneCanvas', chtState.lines, chtState.hull, chtState.winnerLine, null);
    lcRenderPlane(null);
  });
}

function chtInitHeroCanvas() {
  var canvas = document.getElementById('chtHeroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var t = 0;

  function resize() { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    var W = canvas.width; var H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    t += 0.006;

    var cx = W / 2; var cy = H / 2;
    for (var i = -6; i <= 6; i++) {
      var m = i * 1.5 + Math.sin(t + i) * 0.8;
      var b = Math.sin(t * 0.7 + i * 2) * 60;
      ctx.strokeStyle = 'rgba(6,182,212,' + (0.04 + Math.abs(Math.sin(t + i)) * 0.05) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, cy - (m * (-cx / 8) + b));
      ctx.lineTo(W, cy - (m * (cx / 8) + b));
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }
  draw();
}