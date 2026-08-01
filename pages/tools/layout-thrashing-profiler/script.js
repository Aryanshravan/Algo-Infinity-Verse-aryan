/**
 * Layout Thrashing Profiler
 * Heuristic scan for interleaved layout reads / style writes + rAF batch suggestions.
 */
(function () {
  'use strict';

  var DEMO_THRASH = [
    'function measureAndResize(items) {',
    '  for (var i = 0; i < items.length; i++) {',
    '    var el = items[i];',
    '    var w = el.offsetWidth;',
    '    var h = el.clientHeight;',
    '    var style = getComputedStyle(el);',
    '    el.style.width = (w / 2) + "px";',
    '    el.classList.add("resized");',
    '    el.style.height = (h + 8) + "px";',
    '    parent.appendChild(document.createElement("span"));',
    '  }',
    '}',
    '',
    'function syncLayout() {',
    '  box.style.display = "block";',
    '  var top = box.offsetTop;',
    '  box.style.marginTop = top + "px";',
    '  var cs = window.getComputedStyle(box);',
    '  box.classList.toggle("open", cs.display !== "none");',
    '}',
  ].join('\n');

  var READ_PATTERNS = [
    { re: /\.offsetWidth\b/g, name: 'offsetWidth' },
    { re: /\.offsetHeight\b/g, name: 'offsetHeight' },
    { re: /\.offsetTop\b/g, name: 'offsetTop' },
    { re: /\.offsetLeft\b/g, name: 'offsetLeft' },
    { re: /\.clientWidth\b/g, name: 'clientWidth' },
    { re: /\.clientHeight\b/g, name: 'clientHeight' },
    { re: /\.scrollWidth\b/g, name: 'scrollWidth' },
    { re: /\.scrollHeight\b/g, name: 'scrollHeight' },
    { re: /\.scrollTop\b/g, name: 'scrollTop' },
    { re: /\.getBoundingClientRect\s*\(/g, name: 'getBoundingClientRect' },
    { re: /\bgetComputedStyle\s*\(/g, name: 'getComputedStyle' },
    { re: /\.innerText\b/g, name: 'innerText' },
  ];

  var WRITE_PATTERNS = [
    { re: /\.style\.[a-zA-Z]+\s*=/g, name: 'style.*=' },
    { re: /\.style\.setProperty\s*\(/g, name: 'style.setProperty' },
    { re: /\.classList\.(add|remove|toggle|replace)\s*\(/g, name: 'classList' },
    { re: /\.className\s*=/g, name: 'className' },
    { re: /\.appendChild\s*\(/g, name: 'appendChild' },
    { re: /\.insertBefore\s*\(/g, name: 'insertBefore' },
    { re: /\.removeChild\s*\(/g, name: 'removeChild' },
    { re: /\.innerHTML\s*=/g, name: 'innerHTML' },
    { re: /\.textContent\s*=/g, name: 'textContent' },
  ];

  var state = {
    analyzed: false,
    risk: 0,
    severity: '—',
    thrashPairs: 0,
    reads: 0,
    writes: 0,
    findings: [],
    timeline: [],
    before: '',
    after: '',
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

  function snippetAround(code, index) {
    var start = Math.max(0, code.lastIndexOf('\n', index - 1) + 1);
    var end = code.indexOf('\n', index);
    if (end === -1) end = Math.min(code.length, index + 100);
    return code.slice(start, end).trim();
  }

  function collectOps(code, patterns, kind) {
    var ops = [];
    patterns.forEach(function (p) {
      var re = new RegExp(p.re.source, p.re.flags);
      var m;
      while ((m = re.exec(code)) !== null) {
        ops.push({
          kind: kind,
          name: p.name,
          index: m.index,
          line: lineOf(code, m.index),
          snippet: snippetAround(code, m.index),
        });
      }
    });
    return ops;
  }

  function findThrashPairs(ops) {
    var pairs = [];
    var sorted = ops.slice().sort(function (a, b) {
      return a.index - b.index;
    });
    for (var i = 0; i < sorted.length - 1; i++) {
      var a = sorted[i];
      var b = sorted[i + 1];
      if (
        (a.kind === 'write' && b.kind === 'read') ||
        (a.kind === 'read' && b.kind === 'write' && a.line === b.line)
      ) {
        pairs.push({ from: a, to: b });
      }
      if (a.kind === 'read' && b.kind === 'write') {
        var nextRead = null;
        for (var j = i + 2; j < Math.min(sorted.length, i + 6); j++) {
          if (sorted[j].kind === 'read') {
            nextRead = sorted[j];
            break;
          }
          if (sorted[j].kind === 'write') continue;
        }
        if (nextRead && a.line !== nextRead.line) {
          pairs.push({ from: a, to: nextRead, via: b });
        }
      }
    }
    return pairs;
  }

  function severityFromRisk(risk) {
    if (risk >= 75) return 'Critical';
    if (risk >= 50) return 'High';
    if (risk >= 25) return 'Medium';
    if (risk > 0) return 'Low';
    return 'None';
  }

  function buildRefactor(code, reads, writes) {
    var before = code.trim().slice(0, 900) || '// (empty)';
    var after = [
      '// Batched: measure all layout reads, then apply writes in rAF',
      'function measureAndResizeBatched(items) {',
      '  var measurements = items.map(function (el) {',
      '    return {',
      '      el: el,',
      '      w: el.offsetWidth,',
      '      h: el.clientHeight,',
      '      cs: getComputedStyle(el)',
      '    };',
      '  });',
      '',
      '  requestAnimationFrame(function () {',
      '    measurements.forEach(function (m) {',
      '      m.el.style.width = (m.w / 2) + "px";',
      '      m.el.style.height = (m.h + 8) + "px";',
      '      m.el.classList.add("resized");',
      '    });',
      '  });',
      '}',
      '',
      '// Tip: never interleave .style / classList / appendChild with',
      '// offset*/client*/getComputedStyle inside the same loop.',
      '// Reads found: ' + reads + ' | Writes found: ' + writes,
    ].join('\n');
    return { before: before, after: after };
  }

  function analyze(raw) {
    var code = stripComments(raw || '');
    var readOps = collectOps(code, READ_PATTERNS, 'read');
    var writeOps = collectOps(code, WRITE_PATTERNS, 'write');
    var allOps = readOps.concat(writeOps).sort(function (a, b) {
      return a.index - b.index;
    });
    var pairs = findThrashPairs(allOps);

    var uniquePairKeys = {};
    var deduped = [];
    pairs.forEach(function (p) {
      var key = p.from.line + ':' + p.from.name + '->' + p.to.line + ':' + p.to.name;
      if (!uniquePairKeys[key]) {
        uniquePairKeys[key] = true;
        deduped.push(p);
      }
    });

    var findings = [];
    deduped.forEach(function (p, idx) {
      var sev = p.from.kind !== p.to.kind ? 'high' : 'medium';
      findings.push({
        id: 'thrash-' + idx,
        severity: sev,
        title: 'Interleaved ' + p.from.name + ' → ' + p.to.name,
        detail:
          'Layout/' +
          p.from.kind +
          ' at line ' +
          p.from.line +
          ' followed by ' +
          p.to.kind +
          ' at line ' +
          p.to.line +
          '. This pattern often forces synchronous reflow.',
        line: p.from.line,
        snippet: p.from.snippet,
      });
    });

    if (readOps.length > 0 && writeOps.length > 0 && deduped.length === 0) {
      findings.push({
        id: 'mixed-ops',
        severity: 'low',
        title: 'Reads and writes both present',
        detail:
          'Found ' +
          readOps.length +
          ' layout read(s) and ' +
          writeOps.length +
          ' write(s). No tight interleave detected, but keep batching habits.',
        line: readOps[0].line,
        snippet: readOps[0].snippet,
      });
    }

    if (/\bfor\s*\(/.test(code) && readOps.length && writeOps.length) {
      findings.push({
        id: 'loop-risk',
        severity: 'high',
        title: 'Loop with mixed layout I/O',
        detail:
          'A for-loop combined with layout reads and DOM writes is a classic thrashing hotspot. Batch measurements outside the write phase.',
        line: lineOf(code, code.search(/\bfor\s*\(/)),
        snippet: snippetAround(code, code.search(/\bfor\s*\(/)),
      });
    }

    var risk = Math.min(
      100,
      deduped.length * 18 +
        (readOps.length > 3 ? 10 : 0) +
        (writeOps.length > 3 ? 10 : 0) +
        (/\bfor\s*\(/.test(code) && deduped.length ? 15 : 0)
    );

    var timeline = allOps.slice(0, 24).map(function (op, i) {
      return {
        order: i + 1,
        kind: op.kind,
        name: op.name,
        line: op.line,
        weight: op.kind === 'read' ? 70 : 90,
      };
    });

    var refactor = buildRefactor(raw || '', readOps.length, writeOps.length);

    state.analyzed = true;
    state.risk = risk;
    state.severity = severityFromRisk(risk);
    state.thrashPairs = deduped.length;
    state.reads = readOps.length;
    state.writes = writeOps.length;
    state.findings = findings;
    state.timeline = timeline;
    state.before = refactor.before;
    state.after = refactor.after;
  }

  function renderStats() {
    $('statRisk').textContent = state.analyzed ? String(state.risk) : '—';
    $('statThrash').textContent = state.analyzed ? String(state.thrashPairs) : '—';
    $('statReads').textContent = state.analyzed ? String(state.reads) : '—';
    $('statSeverity').textContent = state.analyzed ? state.severity : '—';
  }

  function renderFindings() {
    var el = $('findingsList');
    if (!state.findings.length) {
      el.innerHTML = '<p class="thrash-empty">No thrashing patterns detected.</p>';
      return;
    }
    el.innerHTML = state.findings
      .map(function (f) {
        return (
          '<article class="thrash-finding sev-' +
          escapeHtml(f.severity) +
          '">' +
          '<p class="thrash-finding-meta">' +
          escapeHtml(f.severity) +
          (f.line ? ' · line ' + f.line : '') +
          '</p>' +
          '<h3 class="thrash-finding-title">' +
          escapeHtml(f.title) +
          '</h3>' +
          '<p>' +
          escapeHtml(f.detail) +
          '</p>' +
          (f.snippet ? '<pre>' + escapeHtml(f.snippet) + '</pre>' : '') +
          '</article>'
        );
      })
      .join('');
  }

  function renderTimeline() {
    var bars = $('timelineBars');
    var list = $('timelineList');
    if (!state.timeline.length) {
      bars.innerHTML = '<p class="thrash-empty">Timeline appears after analysis.</p>';
      list.innerHTML = '';
      return;
    }
    bars.innerHTML = state.timeline
      .map(function (t) {
        return (
          '<div class="thrash-bar-row" role="listitem">' +
          '<span class="thrash-bar-label">L' +
          t.line +
          '</span>' +
          '<div class="thrash-bar-track" aria-hidden="true">' +
          '<div class="thrash-bar-fill is-' +
          t.kind +
          '" style="width:' +
          t.weight +
          '%"></div>' +
          '</div>' +
          '<span>' +
          escapeHtml(t.kind) +
          '</span>' +
          '</div>'
        );
      })
      .join('');
    list.innerHTML = state.timeline
      .map(function (t) {
        return (
          '<li>#' +
          t.order +
          ' <strong>' +
          escapeHtml(t.kind) +
          '</strong> ' +
          escapeHtml(t.name) +
          ' (line ' +
          t.line +
          ')</li>'
        );
      })
      .join('');
  }

  function renderRefactor() {
    $('beforeOut').textContent = state.before || '—';
    $('afterOut').textContent = state.after || '—';
  }

  function setExportEnabled(on) {
    $('exportMdBtn').disabled = !on;
    $('exportTxtBtn').disabled = !on;
  }

  function buildReport(asMd) {
    var lines = [];
    var h = asMd ? '## ' : '';
    var b = asMd ? '**' : '';
    lines.push(asMd ? '# Layout Thrashing Audit' : 'Layout Thrashing Audit');
    lines.push('');
    lines.push(h + 'Summary');
    lines.push(
      '- Risk score: ' +
        state.risk +
        ' (' +
        state.severity +
        ')'
    );
    lines.push('- Thrash pairs: ' + state.thrashPairs);
    lines.push('- Layout reads: ' + state.reads);
    lines.push('- DOM writes: ' + state.writes);
    lines.push('');
    lines.push(h + 'Findings');
    state.findings.forEach(function (f, i) {
      lines.push(
        (i + 1) +
          '. [' +
          f.severity +
          '] ' +
          f.title +
          (f.line ? ' (line ' + f.line + ')' : '')
      );
      lines.push('   ' + f.detail);
    });
    lines.push('');
    lines.push(h + 'Suggested batched refactor');
    lines.push(asMd ? '```js' : '---');
    lines.push(state.after);
    lines.push(asMd ? '```' : '---');
    lines.push('');
    lines.push(b + 'Generated by Algo Infinity Verse — Layout Thrashing Profiler' + b);
    return lines.join('\n');
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function runAnalyze() {
    var raw = ($('codeInput').value || '').trim();
    if (!raw) {
      $('analysisStatus').textContent = 'Paste code first';
      return;
    }
    analyze(raw);
    renderStats();
    renderFindings();
    renderTimeline();
    renderRefactor();
    setExportEnabled(true);
    $('analysisStatus').textContent =
      state.thrashPairs + ' thrash pair(s) · risk ' + state.risk;
  }

  function init() {
    $('loadDemoBtn').addEventListener('click', function () {
      $('codeInput').value = DEMO_THRASH;
      $('analysisStatus').textContent = 'Demo loaded';
    });
    $('analyzeBtn').addEventListener('click', runAnalyze);
    $('clearBtn').addEventListener('click', function () {
      $('codeInput').value = '';
      state.analyzed = false;
      state.findings = [];
      state.timeline = [];
      state.before = '';
      state.after = '';
      renderStats();
      $('findingsList').innerHTML =
        '<p class="thrash-empty">Load demo code or paste a snippet, then analyze.</p>';
      $('timelineBars').innerHTML =
        '<p class="thrash-empty">Timeline appears after analysis.</p>';
      $('timelineList').innerHTML = '';
      $('beforeOut').textContent = '—';
      $('afterOut').textContent = '—';
      setExportEnabled(false);
      $('analysisStatus').textContent = 'Cleared';
    });
    $('exportMdBtn').addEventListener('click', function () {
      download('layout-thrashing-audit.md', buildReport(true));
    });
    $('exportTxtBtn').addEventListener('click', function () {
      download('layout-thrashing-audit.txt', buildReport(false));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
