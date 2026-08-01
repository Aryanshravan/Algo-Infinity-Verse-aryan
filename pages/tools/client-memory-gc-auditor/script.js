/**
 * Client Memory GC Auditor
 * Static-analysis leak detector + mount/unmount heap simulation (heuristics only).
 */
(function () {
  'use strict';

  var DEMO_LEAKY = [
    'class LeakyWidget {',
    '  constructor(root) {',
    '    this.root = root;',
    '    this.cache = new Array(50000).fill({ payload: "x".repeat(64) });',
    '    this.onResize = () => this.render();',
    '    window.addEventListener("resize", this.onResize);',
    '    document.addEventListener("click", this.handleClick);',
    '    this.timer = setInterval(() => this.poll(), 1000);',
    '    this.timeout = setTimeout(() => this.warmup(), 500);',
    '    const detached = document.createElement("div");',
    '    detached.textContent = "orphan";',
    '    root.appendChild(detached);',
    '    root.removeChild(detached);',
    '    this.orphanNode = detached;',
    '  }',
    '  handleClick = (e) => { this.lastEvent = e; };',
    '  poll() { console.log("tick", this.cache.length); }',
    '  warmup() { this.buffer = new Array(10000).fill(0); }',
    '  render() { /* redraw */ }',
    '  // BUG: destroy() never clears interval, listeners, or DOM refs',
    '  destroy() {',
    '    // missing clearInterval / removeEventListener / nulling refs',
    '  }',
    '}',
  ].join('\n');

  var state = {
    findings: [],
    recommendations: [],
    metrics: {
      leaks: 0,
      timers: 0,
      listeners: 0,
      heapDeltaKb: 0,
      mountKb: 0,
      unmountKb: 0,
    },
    analyzed: false,
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

  function stripComments(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
  }

  function lineOf(code, index) {
    return code.slice(0, index).split('\n').length;
  }

  function snippetAround(code, index, len) {
    var start = Math.max(0, code.lastIndexOf('\n', index - 1) + 1);
    var end = code.indexOf('\n', index + (len || 0));
    if (end === -1) end = Math.min(code.length, index + 120);
    return code.slice(start, end).trim();
  }

  function countMatches(re, text) {
    var m = text.match(re);
    return m ? m.length : 0;
  }

  function analyzeCode(raw) {
    var code = stripComments(raw || '');
    var findings = [];
    var recs = [];

    var setIntervalCount = countMatches(/\bsetInterval\s*\(/g, code);
    var clearIntervalCount = countMatches(/\bclearInterval\s*\(/g, code);
    var setTimeoutCount = countMatches(/\bsetTimeout\s*\(/g, code);
    var clearTimeoutCount = countMatches(/\bclearTimeout\s*\(/g, code);
    var addListenerCount = countMatches(/\.addEventListener\s*\(/g, code);
    var removeListenerCount = countMatches(/\.removeEventListener\s*\(/g, code);
    var appendCount = countMatches(/\.appendChild\s*\(/g, code);
    var removeChildCount = countMatches(/\.removeChild\s*\(/g, code);
    var abortController = /\bAbortController\b/.test(code);
    var largeArray = /\bnew\s+Array\s*\(\s*(\d+)\s*\)/g;
    var fillLarge = /\.fill\s*\(/g;

    var unclearedIntervals = Math.max(0, setIntervalCount - clearIntervalCount);
    var unclearedTimeouts = Math.max(0, setTimeoutCount - clearTimeoutCount);
    var orphanListeners = Math.max(0, addListenerCount - removeListenerCount);

    if (unclearedIntervals > 0) {
      var ivIdx = code.search(/\bsetInterval\s*\(/);
      findings.push({
        id: 'uncleared-interval',
        severity: 'high',
        category: 'Timers',
        title: unclearedIntervals + ' uncleared setInterval call(s)',
        detail:
          'Found ' +
          setIntervalCount +
          ' setInterval and ' +
          clearIntervalCount +
          ' clearInterval. Uncleared intervals keep closures and component state alive after unmount.',
        line: ivIdx >= 0 ? lineOf(code, ivIdx) : null,
        snippet: ivIdx >= 0 ? snippetAround(code, ivIdx) : '',
        heapKb: unclearedIntervals * 48,
      });
      recs.push({
        key: 'clearInterval',
        html:
          '<strong>clearInterval</strong> — store the handle and call <code>clearInterval(this.timer)</code> in destroy/cleanup (or use a shared teardown helper).',
      });
    }

    if (unclearedTimeouts > 0) {
      var toIdx = code.search(/\bsetTimeout\s*\(/);
      findings.push({
        id: 'uncleared-timeout',
        severity: 'medium',
        category: 'Timers',
        title: unclearedTimeouts + ' potentially uncleared setTimeout call(s)',
        detail:
          'Found ' +
          setTimeoutCount +
          ' setTimeout vs ' +
          clearTimeoutCount +
          ' clearTimeout. Long-lived or repeating patterns can retain component closures.',
        line: toIdx >= 0 ? lineOf(code, toIdx) : null,
        snippet: toIdx >= 0 ? snippetAround(code, toIdx) : '',
        heapKb: unclearedTimeouts * 16,
      });
      recs.push({
        key: 'clearTimeout',
        html:
          '<strong>clearTimeout</strong> — clear pending timeouts on unmount; prefer cancellable patterns for chained work.',
      });
    }

    if (orphanListeners > 0) {
      var alIdx = code.search(/\.addEventListener\s*\(/);
      findings.push({
        id: 'orphan-listeners',
        severity: 'high',
        category: 'Event listeners',
        title: orphanListeners + ' addEventListener without matching removeEventListener',
        detail:
          'Detected ' +
          addListenerCount +
          ' addEventListener vs ' +
          removeListenerCount +
          ' removeEventListener. Listeners on window/document retain the component and its closed-over data.',
        line: alIdx >= 0 ? lineOf(code, alIdx) : null,
        snippet: alIdx >= 0 ? snippetAround(code, alIdx) : '',
        heapKb: orphanListeners * 36,
      });
      if (!abortController) {
        recs.push({
          key: 'AbortController',
          html:
            '<strong>AbortController</strong> — pass <code>{ signal }</code> to <code>addEventListener</code> and call <code>controller.abort()</code> on unmount to remove all listeners at once.',
        });
      }
      recs.push({
        key: 'removeEventListener',
        html:
          '<strong>removeEventListener</strong> — keep a stable function reference and remove it in destroy/useEffect cleanup.',
      });
    }

    if (appendCount > 0 && removeChildCount > 0) {
      var holdsRef =
        /\b(this|self)\.\w+\s*=\s*\w+/.test(code) &&
        (/\.removeChild\s*\(/.test(code) || /\.remove\s*\(/.test(code));
      var nulling = /\.\w+\s*=\s*null\b/.test(code);
      if (holdsRef && !nulling) {
        var apIdx = code.search(/\.appendChild\s*\(/);
        findings.push({
          id: 'detached-dom',
          severity: 'high',
          category: 'Detached DOM',
          title: 'Potential detached DOM retained via component refs',
          detail:
            'Code appends then removes nodes but appears to keep instance properties pointing at them. Detached subtrees stay in memory until refs are cleared.',
          line: apIdx >= 0 ? lineOf(code, apIdx) : null,
          snippet: apIdx >= 0 ? snippetAround(code, apIdx) : '',
          heapKb: 64 + appendCount * 12,
        });
        recs.push({
          key: 'null-refs',
          html:
            '<strong>Null detached refs</strong> — after <code>removeChild</code>/<code>remove()</code>, set <code>this.orphanNode = null</code> (and drop parent closures holding the node).',
        });
      }
    }

    var arrayMatch;
    var largeClosures = 0;
    var largeHeap = 0;
    largeArray.lastIndex = 0;
    while ((arrayMatch = largeArray.exec(code)) !== null) {
      var size = parseInt(arrayMatch[1], 10);
      if (size >= 1000) {
        largeClosures += 1;
        largeHeap += Math.round(size * 0.008);
        findings.push({
          id: 'large-closure-' + size + '-' + arrayMatch.index,
          severity: size >= 10000 ? 'high' : 'medium',
          category: 'Large closures',
          title: 'Large array allocation (new Array(' + size + '))',
          detail:
            'Large arrays closed over by listeners/timers/methods are retained for the lifetime of those callbacks. Prefer streaming, pagination, or WeakRef/weak maps where appropriate.',
          line: lineOf(code, arrayMatch.index),
          snippet: snippetAround(code, arrayMatch.index),
          heapKb: Math.round(size * 0.008),
        });
      }
    }

    fillLarge.lastIndex = 0;
    if (largeClosures === 0 && fillLarge.test(code) && /new\s+Array/.test(code)) {
      findings.push({
        id: 'large-fill',
        severity: 'low',
        category: 'Large closures',
        title: 'Array fill pattern may retain bulky payloads',
        detail: 'Detected Array construction with .fill — verify payloads are not retained by long-lived event/timer closures.',
        line: null,
        snippet: '',
        heapKb: 24,
      });
      largeHeap += 24;
    }

    if (largeClosures > 0 || largeHeap > 0) {
      recs.push({
        key: 'closure-trim',
        html:
          '<strong>Trim closures</strong> — avoid capturing large arrays in listeners; copy only needed fields, or move data out of the closure before registering callbacks.',
      });
    }

    if (findings.length === 0) {
      findings.push({
        id: 'clean',
        severity: 'low',
        category: 'Clean',
        title: 'No common leak patterns detected',
        detail:
          'Heuristics found balanced timers/listeners or no matching APIs. This is not a guarantee — profile with Chrome Memory tools for real heap graphs.',
        line: null,
        snippet: '',
        heapKb: 0,
      });
      recs.push({
        key: 'baseline',
        html:
          '<strong>Keep cleanup habits</strong> — pair every <code>setInterval</code>/<code>addEventListener</code> with teardown; prefer <code>AbortController</code> for listener groups.',
      });
    }

    var uniqRecs = [];
    var seen = {};
    recs.forEach(function (r) {
      if (!seen[r.key]) {
        seen[r.key] = true;
        uniqRecs.push(r);
      }
    });

    var leakFindings = findings.filter(function (f) {
      return f.id !== 'clean';
    });
    var heapFromFindings = leakFindings.reduce(function (sum, f) {
      return sum + (f.heapKb || 0);
    }, 0);

    var mountKb = 120 + setIntervalCount * 8 + addListenerCount * 6 + largeHeap;
    var retainedKb = heapFromFindings;
    var unmountKb = Math.max(40, mountKb - Math.max(0, mountKb - retainedKb - 40));

    return {
      findings: findings,
      recommendations: uniqRecs,
      metrics: {
        leaks: leakFindings.length,
        timers: unclearedIntervals + unclearedTimeouts,
        listeners: orphanListeners,
        heapDeltaKb: retainedKb,
        mountKb: mountKb,
        unmountKb: unmountKb,
        setIntervalCount: setIntervalCount,
        addListenerCount: addListenerCount,
      },
    };
  }

  function updateHero(metrics) {
    $('statLeaks').textContent = String(metrics.leaks);
    $('statTimers').textContent = String(metrics.timers);
    $('statListeners').textContent = String(metrics.listeners);
    $('statHeap').textContent = metrics.heapDeltaKb ? '+' + metrics.heapDeltaKb + ' KB' : '0 KB';
  }

  function renderFindings(findings) {
    var root = $('findingsList');
    if (!root) return;
    root.innerHTML = '';
    findings.forEach(function (f) {
      var el = document.createElement('article');
      el.className = 'memgc-finding';
      el.setAttribute('data-severity', f.severity);
      el.innerHTML =
        '<p class="memgc-finding-meta">' +
        escapeHtml(f.category) +
        ' · ' +
        escapeHtml(f.severity) +
        (f.line ? ' · line ~' + f.line : '') +
        '</p>' +
        '<h3 class="memgc-finding-title">' +
        escapeHtml(f.title) +
        '</h3>' +
        '<p class="memgc-finding-detail">' +
        escapeHtml(f.detail) +
        '</p>' +
        (f.snippet
          ? '<pre class="memgc-finding-snippet"><code>' + escapeHtml(f.snippet) + '</code></pre>'
          : '');
      root.appendChild(el);
    });
  }

  function renderRecs(recs) {
    var list = $('recsList');
    if (!list) return;
    list.innerHTML = '';
    if (!recs.length) {
      list.innerHTML = '<li class="memgc-empty-li">No recommendations.</li>';
      return;
    }
    recs.forEach(function (r) {
      var li = document.createElement('li');
      li.innerHTML = r.html;
      list.appendChild(li);
    });
  }

  function setLifecycleIdle() {
    $('mountHeap').textContent = '0 KB';
    $('unmountHeap').textContent = '0 KB';
    $('heapFill').style.width = '0%';
    $('phaseMount').classList.remove('is-active', 'is-leaking');
    $('phaseUnmount').classList.remove('is-active', 'is-leaking');
    $('lifecycleStatus').textContent = 'Idle';
    $('heapHint').textContent = 'Run analyze to simulate mount → unmount retained heap.';
  }

  function runAnalyze() {
    var code = ($('codeInput').value || '').trim();
    if (!code) {
      $('lifecycleStatus').textContent = 'Paste code first';
      return;
    }
    var result = analyzeCode(code);
    state.findings = result.findings;
    state.recommendations = result.recommendations;
    state.metrics = result.metrics;
    state.analyzed = true;

    updateHero(result.metrics);
    renderFindings(result.findings);
    renderRecs(result.recommendations);

    $('mountHeap').textContent = result.metrics.mountKb + ' KB';
    $('unmountHeap').textContent = '—';
    $('heapFill').style.width = '0%';
    $('phaseMount').classList.remove('is-active', 'is-leaking');
    $('phaseUnmount').classList.remove('is-active', 'is-leaking');
    $('lifecycleStatus').textContent = 'Analyzed — ready to simulate';
    $('heapHint').textContent =
      'Estimated retained after unmount: +' + result.metrics.heapDeltaKb + ' KB (heuristic).';

    $('simulateBtn').disabled = false;
    $('exportMdBtn').disabled = false;
    $('exportTxtBtn').disabled = false;
  }

  function runSimulate() {
    if (!state.analyzed) return;
    var m = state.metrics;
    var mount = $('phaseMount');
    var unmount = $('phaseUnmount');
    var fill = $('heapFill');
    var status = $('lifecycleStatus');

    mount.classList.add('is-active');
    unmount.classList.remove('is-active', 'is-leaking');
    $('mountHeap').textContent = m.mountKb + ' KB';
    $('unmountHeap').textContent = '…';
    status.textContent = 'Mounting…';
    fill.style.width = Math.min(100, (m.mountKb / Math.max(m.mountKb, 1)) * 55) + '%';

    window.setTimeout(function () {
      mount.classList.remove('is-active');
      unmount.classList.add('is-active');
      if (m.heapDeltaKb > 0) unmount.classList.add('is-leaking');
      $('unmountHeap').textContent = m.unmountKb + ' KB retained';
      var pct = Math.min(100, 20 + (m.heapDeltaKb / Math.max(m.mountKb, 1)) * 80);
      fill.style.width = pct + '%';
      status.textContent =
        m.heapDeltaKb > 0
          ? 'Unmounted with leak — Δ +' + m.heapDeltaKb + ' KB'
          : 'Unmounted cleanly — negligible retention';
      $('heapHint').textContent =
        'Simulated retained heap delta: +' +
        m.heapDeltaKb +
        ' KB based on ' +
        m.leaks +
        ' leak finding(s).';
    }, 650);
  }

  function buildReport(format) {
    var m = state.metrics;
    var lines = [];
    var isMd = format === 'md';
    var h = function (t, level) {
      if (!isMd) return t.toUpperCase();
      return Array(level + 1).join('#') + ' ' + t;
    };
    var bullet = function (t) {
      return (isMd ? '- ' : '• ') + t;
    };

    lines.push(h('Client Memory GC Audit Summary', 1));
    lines.push('');
    lines.push('Generated: ' + new Date().toISOString());
    lines.push('Mode: static analysis + heuristic heap simulation (no Chrome heap API)');
    lines.push('');
    lines.push(h('Hero metrics', 2));
    lines.push(bullet('Leaks found: ' + m.leaks));
    lines.push(bullet('Uncleared timers: ' + m.timers));
    lines.push(bullet('Orphan listeners: ' + m.listeners));
    lines.push(bullet('Estimated heap delta: +' + m.heapDeltaKb + ' KB'));
    lines.push(bullet('Simulated mount heap: ' + m.mountKb + ' KB'));
    lines.push(bullet('Simulated unmount retained: ' + m.unmountKb + ' KB'));
    lines.push('');
    lines.push(h('Findings', 2));
    state.findings.forEach(function (f) {
      lines.push(bullet('[' + f.severity + '] ' + f.category + ' — ' + f.title));
      lines.push((isMd ? '  ' : '  ') + f.detail);
      if (f.line) lines.push((isMd ? '  ' : '  ') + 'Approx. line: ' + f.line);
      if (f.snippet) lines.push((isMd ? '  `' : '  ') + f.snippet + (isMd ? '`' : ''));
      lines.push('');
    });
    lines.push(h('Patch recommendations', 2));
    state.recommendations.forEach(function (r) {
      var text = r.html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      lines.push(bullet(text));
    });
    lines.push('');
    lines.push(h('Notes', 2));
    lines.push(bullet('Use Chrome DevTools Memory / Allocation instrumentation for ground truth.'));
    lines.push(bullet('Prefer AbortController, clearInterval/clearTimeout, and nulling detached DOM refs.'));
    return lines.join('\n');
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function onClear() {
    $('codeInput').value = '';
    state.findings = [];
    state.recommendations = [];
    state.analyzed = false;
    state.metrics = {
      leaks: 0,
      timers: 0,
      listeners: 0,
      heapDeltaKb: 0,
      mountKb: 0,
      unmountKb: 0,
    };
    updateHero({ leaks: '—', timers: '—', listeners: '—', heapDeltaKb: 0 });
    $('statLeaks').textContent = '—';
    $('statTimers').textContent = '—';
    $('statListeners').textContent = '—';
    $('statHeap').textContent = '—';
    $('findingsList').innerHTML =
      '<p class="memgc-empty">Paste code and click Analyze to detect leak patterns.</p>';
    $('recsList').innerHTML =
      '<li class="memgc-empty-li">Recommendations appear after analysis.</li>';
    setLifecycleIdle();
    $('simulateBtn').disabled = true;
    $('exportMdBtn').disabled = true;
    $('exportTxtBtn').disabled = true;
  }

  function init() {
    var loadDemo = $('loadDemoBtn');
    var analyze = $('analyzeBtn');
    var clear = $('clearBtn');
    var simulate = $('simulateBtn');
    var exportMd = $('exportMdBtn');
    var exportTxt = $('exportTxtBtn');

    if (loadDemo) {
      loadDemo.addEventListener('click', function () {
        $('codeInput').value = DEMO_LEAKY;
        $('lifecycleStatus').textContent = 'Demo loaded';
      });
    }
    if (analyze) analyze.addEventListener('click', runAnalyze);
    if (clear) clear.addEventListener('click', onClear);
    if (simulate) simulate.addEventListener('click', runSimulate);
    if (exportMd) {
      exportMd.addEventListener('click', function () {
        if (!state.analyzed) return;
        download('memory-leak-audit.md', buildReport('md'), 'text/markdown;charset=utf-8');
      });
    }
    if (exportTxt) {
      exportTxt.addEventListener('click', function () {
        if (!state.analyzed) return;
        download('memory-leak-audit.txt', buildReport('txt'), 'text/plain;charset=utf-8');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
