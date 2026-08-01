(function () {
  'use strict';

  var lastReport = null;

  var PRESETS = {
    alias: {
      code:
        '// Shared WASM heap alias — views go stale after memory.grow\n' +
        'const memory = new WebAssembly.Memory({ initial: 1, maximum: 16 });\n' +
        'const heap = new Uint8Array(memory.buffer);\n' +
        'const view = new Float32Array(memory.buffer, 0, 256);\n' +
        '\n' +
        'function writePixels(offset, rgba) {\n' +
        '  // heap and view alias the same ArrayBuffer\n' +
        '  for (let i = 0; i < rgba.length; i++) heap[offset + i] = rgba[i];\n' +
        '  return view; // returned alias may outlive a grow()\n' +
        '}\n' +
        '\n' +
        'memory.grow(1);\n' +
        '// BUG: heap/view still point at detached old buffer\n' +
        'heap[0] = 255;\n'
    },
    transfer: {
      code:
        'async function sendFrame(canvas) {\n' +
        '  const bitmap = await createImageBitmap(canvas);\n' +
        '  const buf = await bitmapToArrayBuffer(bitmap);\n' +
        '  const u8 = new Uint8Array(buf);\n' +
        '\n' +
        '  // Missing transfer list — structured clone copies, then both sides mutate\n' +
        '  worker.postMessage({ frame: u8.buffer, width: canvas.width });\n' +
        '  // Continues using buf after send\n' +
        '  u8.fill(0);\n' +
        '  return u8.buffer.byteLength;\n' +
        '}\n' +
        '\n' +
        'function bitmapToArrayBuffer(bitmap) {\n' +
        '  const ab = new ArrayBuffer(bitmap.width * bitmap.height * 4);\n' +
        '  // pretend paint into ab\n' +
        '  return Promise.resolve(ab);\n' +
        '}\n'
    },
    lifetime: {
      code:
        'let shared = null;\n' +
        '\n' +
        'export function borrowScratch(n) {\n' +
        '  if (!shared || shared.length < n) {\n' +
        '    shared = new Uint8Array(n);\n' +
        '  }\n' +
        '  return shared; // callers keep references across awaits\n' +
        '}\n' +
        '\n' +
        'export async function encode(chunk) {\n' +
        '  const scratch = borrowScratch(chunk.length);\n' +
        '  scratch.set(chunk);\n' +
        '  await compressAsync(scratch); // another call may reuse scratch\n' +
        '  const other = borrowScratch(chunk.length * 2);\n' +
        '  other[0] = 1; // may alias same buffer if grown in place\n' +
        '  return scratch.slice(); // slice after concurrent reuse — race\n' +
        '}\n' +
        '\n' +
        '// No dispose / free for wasm module exports\n' +
        'const ptr = wasm.exports.alloc(4096);\n' +
        'const region = new Uint8Array(wasm.exports.memory.buffer, ptr, 4096);\n' +
        'region.fill(0xff);\n' +
        '// forgot: wasm.exports.free(ptr)\n'
    },
    concurrent: {
      code:
        'const sab = new SharedArrayBuffer(1024);\n' +
        'const atoms = new Int32Array(sab);\n' +
        'const bytes = new Uint8Array(sab);\n' +
        '\n' +
        'worker.postMessage(sab);\n' +
        '\n' +
        'function tick() {\n' +
        '  // Mutating SharedArrayBuffer from main without Atomics\n' +
        '  for (let i = 0; i < bytes.length; i++) {\n' +
        '    bytes[i] = (bytes[i] + 1) & 0xff;\n' +
        '  }\n' +
        '  atoms[0] = Date.now(); // torn write vs worker reader\n' +
        '}\n' +
        '\n' +
        'setInterval(tick, 16);\n' +
        '\n' +
        '// Worker (conceptually):\n' +
        '// const w = new Uint8Array(sab);\n' +
        '// while (true) { process(w); }\n'
    }
  };

  var RULES = [
    {
      id: 'wasm-alias',
      severity: 'critical',
      title: 'WASM memory view alias after grow',
      test: function (code) {
        return /memory\.grow\s*\(/.test(code) && /new\s+(Uint8Array|Float32Array|Int32Array)\s*\(\s*memory\.buffer/.test(code);
      },
      detail: 'TypedArray views over wasm.memory.buffer become detached after Memory.grow. Re-create views after every grow.'
    },
    {
      id: 'shared-heap-return',
      severity: 'critical',
      title: 'Returning live heap / scratch alias',
      test: function (code) {
        return /return\s+(heap|view|scratch|shared)\b/.test(code) || /borrowScratch/.test(code);
      },
      detail: 'Exporting a reusable buffer lets callers hold aliases across reallocations. Prefer copy-out (slice/sliceInto) or explicit ownership transfer.'
    },
    {
      id: 'missing-transfer',
      severity: 'critical',
      title: 'postMessage without transfer list',
      test: function (code) {
        return /postMessage\s*\(/.test(code) && !/postMessage\s*\([^)]+,\s*\[/.test(code) && /\.buffer\b/.test(code);
      },
      detail: 'Sending ArrayBuffer via postMessage without a transfer list clones data and leaves both sides free to mutate. Use transfer: [buf].'
    },
    {
      id: 'use-after-send',
      severity: 'warn',
      title: 'Buffer used after postMessage',
      test: function (code) {
        return /postMessage\s*\(/.test(code) && /\.fill\s*\(|\[0\]\s*=/.test(code);
      },
      detail: 'Mutating a buffer after an intended transfer is a use-after-neuter hazard. Treat transfer as move semantics.'
    },
    {
      id: 'missing-free',
      severity: 'critical',
      title: 'WASM alloc without free/dispose',
      test: function (code) {
        return /\.alloc\s*\(/.test(code) && !/\.free\s*\(/.test(code) && !/dispose\s*\(/.test(code);
      },
      detail: 'Linear memory allocations need a matching free (or RAII-style disposer). Leaks fragment the WASM heap.'
    },
    {
      id: 'sab-no-atomics',
      severity: 'critical',
      title: 'SharedArrayBuffer mutation without Atomics',
      test: function (code) {
        return /SharedArrayBuffer/.test(code) && !/Atomics\./.test(code);
      },
      detail: 'Non-atomic reads/writes on SharedArrayBuffer are data races. Use Atomics or confine mutation to one agent.'
    },
    {
      id: 'dual-view-sab',
      severity: 'warn',
      title: 'Overlapping TypedArray views on SAB',
      test: function (code) {
        return /SharedArrayBuffer/.test(code) && /Int32Array/.test(code) && /Uint8Array/.test(code);
      },
      detail: 'Byte and word views on the same SAB amplify tearing. Document ownership lanes or pack with Atomics.'
    },
    {
      id: 'await-shared-scratch',
      severity: 'warn',
      title: 'Await while holding shared scratch',
      test: function (code) {
        return /await\s+\w*\(/.test(code) && /(scratch|shared|borrow)/i.test(code);
      },
      detail: 'Yielding across await with a pooled buffer invites concurrent re-entry. Snapshot before await or take a lock.'
    },
    {
      id: 'imagebitmap-no-close',
      severity: 'info',
      title: 'ImageBitmap may need close()',
      test: function (code) {
        return /createImageBitmap/.test(code) && !/\.close\s*\(/.test(code);
      },
      detail: 'ImageBitmap holds GPU/CPU resources until close(). Dispose after transfer or encode.'
    }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, kind) {
    var el = $('memsafeStatus');
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

  function analyzeCode(code) {
    var hazards = [];
    RULES.forEach(function (rule) {
      if (rule.test(code)) {
        hazards.push({
          id: rule.id,
          severity: rule.severity,
          title: rule.title,
          detail: rule.detail
        });
      }
    });
    return hazards;
  }

  function safetyScore(hazards) {
    var critical = hazards.filter(function (h) {
      return h.severity === 'critical';
    }).length;
    var warn = hazards.filter(function (h) {
      return h.severity === 'warn';
    }).length;
    var info = hazards.filter(function (h) {
      return h.severity === 'info';
    }).length;
    var penalty = critical * 22 + warn * 10 + info * 4;
    var score = Math.max(0, 100 - penalty);
    var band = score >= 75 ? 'high' : score >= 45 ? 'mid' : 'low';
    return { score: score, band: band, critical: critical, warn: warn, info: info };
  }

  function buildRewrite(hazards, code) {
    var lines = [];
    lines.push('// Ownership-oriented rewrite suggestions');
    lines.push('// (illustrative — adapt names to your module)');
    lines.push('');

    var ids = {};
    hazards.forEach(function (h) {
      ids[h.id] = true;
    });

    if (ids['wasm-alias'] || /memory\.buffer/.test(code)) {
      lines.push('function getHeapU8(memory) {');
      lines.push('  // Always re-wrap after grow / imports that may grow');
      lines.push('  return new Uint8Array(memory.buffer);');
      lines.push('}');
      lines.push('');
    }

    if (ids['missing-transfer'] || ids['use-after-send']) {
      lines.push('function sendOwned(worker, buffer) {');
      lines.push('  worker.postMessage({ frame: buffer }, [buffer]); // move');
      lines.push('  // buffer is neutered here — do not touch');
      lines.push('}');
      lines.push('');
    }

    if (ids['missing-free'] || ids['shared-heap-return']) {
      lines.push('function withWasmRegion(wasm, nbytes, fn) {');
      lines.push('  const ptr = wasm.exports.alloc(nbytes);');
      lines.push('  try {');
      lines.push('    const view = new Uint8Array(wasm.exports.memory.buffer, ptr, nbytes);');
      lines.push('    return fn(view); // do not return `view` to callers');
      lines.push('  } finally {');
      lines.push('    wasm.exports.free(ptr);');
      lines.push('  }');
      lines.push('}');
      lines.push('');
    }

    if (ids['sab-no-atomics'] || ids['dual-view-sab']) {
      lines.push('function publishFlag(atoms, index, value) {');
      lines.push('  Atomics.store(atoms, index, value);');
      lines.push('  Atomics.notify(atoms, index, 1);');
      lines.push('}');
      lines.push('');
    }

    if (ids['await-shared-scratch']) {
      lines.push('async function encodeOwned(chunk) {');
      lines.push('  const owned = chunk.slice(); // unique ownership');
      lines.push('  await compressAsync(owned);');
      lines.push('  return owned;');
      lines.push('}');
      lines.push('');
    }

    if (ids['imagebitmap-no-close']) {
      lines.push('async function encodeBitmap(source) {');
      lines.push('  const bitmap = await createImageBitmap(source);');
      lines.push('  try {');
      lines.push('    return await encode(bitmap);');
      lines.push('  } finally {');
      lines.push('    bitmap.close();');
      lines.push('  }');
      lines.push('}');
      lines.push('');
    }

    if (lines.length <= 3) {
      lines.push('// No structural rewrites required — keep single-owner buffers and document lifetimes.');
    }

    return lines.join('\n');
  }

  function buildChecklist(hazards) {
    var checks = [
      { id: 'views-after-grow', title: 'Re-create TypedArray views after Memory.grow', done: !hazards.some(function (h) { return h.id === 'wasm-alias'; }) },
      { id: 'transfer-list', title: 'Use postMessage transfer lists for ArrayBuffers', done: !hazards.some(function (h) { return h.id === 'missing-transfer'; }) },
      { id: 'no-use-after-move', title: 'Never mutate buffers after transfer', done: !hazards.some(function (h) { return h.id === 'use-after-send'; }) },
      { id: 'pair-alloc-free', title: 'Pair WASM alloc with free/dispose (try/finally)', done: !hazards.some(function (h) { return h.id === 'missing-free'; }) },
      { id: 'atomics-sab', title: 'Coordinate SharedArrayBuffer with Atomics', done: !hazards.some(function (h) { return h.id === 'sab-no-atomics'; }) },
      { id: 'no-export-scratch', title: 'Do not return pooled scratch aliases', done: !hazards.some(function (h) { return h.id === 'shared-heap-return'; }) },
      { id: 'await-ownership', title: 'Snapshot or lock buffers across await', done: !hazards.some(function (h) { return h.id === 'await-shared-scratch'; }) },
      { id: 'close-bitmaps', title: 'Close ImageBitmap / release GPU resources', done: !hazards.some(function (h) { return h.id === 'imagebitmap-no-close'; }) }
    ];
    return checks;
  }

  function renderFindings(listEl, items, emptyMsg) {
    listEl.innerHTML = '';
    if (!items.length) {
      listEl.innerHTML =
        '<li class="memsafe-finding is-ok"><p class="memsafe-finding-title">Clean scan</p>' +
        '<p class="memsafe-finding-body">' +
        escapeHtml(emptyMsg) +
        '</p></li>';
      return;
    }
    items.forEach(function (item, idx) {
      var li = document.createElement('li');
      var sev = item.severity || 'info';
      li.className = 'memsafe-finding is-' + (sev === 'critical' ? 'critical' : sev === 'warn' ? 'warn' : sev === 'check' ? 'check' : 'info');
      li.style.animationDelay = idx * 0.04 + 's';
      var badge =
        sev === 'critical'
          ? 'memsafe-badge-critical'
          : sev === 'warn'
            ? 'memsafe-badge-warn'
            : 'memsafe-badge-info';
      var status = item.done === true ? ' [pass]' : item.done === false ? ' [fail]' : '';
      li.innerHTML =
        '<span class="memsafe-badge ' +
        badge +
        '">' +
        escapeHtml(sev) +
        status +
        '</span>' +
        '<p class="memsafe-finding-title">' +
        escapeHtml(item.title) +
        '</p>' +
        '<p class="memsafe-finding-body">' +
        escapeHtml(item.detail || '') +
        '</p>';
      listEl.appendChild(li);
    });
  }

  function renderReport(report) {
    $('memsafeEmpty').hidden = true;
    $('memsafeResults').hidden = false;

    $('statHazards').textContent = String(report.hazards.length);
    $('statCritical').textContent = String(report.score.critical);
    $('statSafety').textContent = String(report.score.score);

    $('memsafeScoreVal').textContent = String(report.score.score);
    var ring = $('memsafeScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add('is-' + report.score.band);
    $('memsafeScoreBlurb').textContent =
      report.score.critical +
      ' critical, ' +
      report.score.warn +
      ' warning, ' +
      report.score.info +
      ' info finding(s). ' +
      (report.score.band === 'high'
        ? 'Ownership patterns look solid.'
        : report.score.band === 'mid'
          ? 'Tighten transfers and lifetimes before shipping.'
          : 'High risk of races, leaks, or use-after-neuter.');

    renderFindings($('memsafeHazardList'), report.hazards, 'No alias, transfer, or concurrency heuristics matched.');
    $('memsafeRewrite').textContent = report.rewrite;
    renderFindings(
      $('memsafeCheckList'),
      report.checklist.map(function (c) {
        return {
          severity: c.done ? 'info' : 'warn',
          title: c.title,
          detail: c.done ? 'Satisfied by current snippet heuristics.' : 'Address this before considering the buffer ownership model safe.',
          done: c.done
        };
      }),
      'Checklist empty.'
    );

    $('memsafeExportBtn').disabled = false;
  }

  function analyze() {
    var code = String($('memsafeCode').value || '');
    if (!code.trim()) {
      setStatus('Paste a JavaScript snippet or load a demo preset.', 'is-error');
      return;
    }
    var hazards = analyzeCode(code);
    var score = safetyScore(hazards);
    var rewrite = buildRewrite(hazards, code);
    var checklist = buildChecklist(hazards);
    lastReport = {
      generatedAt: new Date().toISOString(),
      code: code,
      hazards: hazards,
      score: score,
      rewrite: rewrite,
      checklist: checklist
    };
    renderReport(lastReport);
    setStatus('Found ' + hazards.length + ' memory-safety hazard(s).', hazards.length ? 'is-ok' : 'is-ok');
  }

  function loadPreset(name) {
    var preset = PRESETS[name];
    if (!preset) return;
    $('memsafeCode').value = preset.code;
    setStatus('Loaded "' + name + '" unsafe preset.', 'is-ok');
    analyze();
  }

  function clearAll() {
    $('memsafeCode').value = '';
    lastReport = null;
    $('memsafeEmpty').hidden = false;
    $('memsafeResults').hidden = true;
    $('memsafeExportBtn').disabled = true;
    $('statHazards').textContent = '0';
    $('statCritical').textContent = '0';
    $('statSafety').textContent = '—';
    setStatus('Cleared.');
  }

  function downloadReport() {
    if (!lastReport) return;
    var payload = {
      tool: 'ai-js-memory-safety-coach',
      generatedAt: lastReport.generatedAt,
      score: lastReport.score,
      hazards: lastReport.hazards,
      checklist: lastReport.checklist,
      ownershipRewrite: lastReport.rewrite,
      sourceSnippet: lastReport.code
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'memory-safety-checklist-' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Memory-safety checklist/report downloaded.', 'is-ok');
  }

  function init() {
    $('memsafeAnalyzeBtn').addEventListener('click', analyze);
    $('memsafeClearBtn').addEventListener('click', clearAll);
    $('memsafeExportBtn').addEventListener('click', downloadReport);
    Array.prototype.forEach.call(document.querySelectorAll('.memsafe-preset-btn'), function (btn) {
      btn.addEventListener('click', function () {
        loadPreset(btn.getAttribute('data-preset'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
