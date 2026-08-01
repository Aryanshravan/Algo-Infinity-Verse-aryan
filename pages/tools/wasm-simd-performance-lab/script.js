/**
 * WASM SIMD Performance Lab
 * Pure JS matmul vs Float32Array blocked path labeled "WASM SIMD path (emulated)".
 */
(function () {
  'use strict';

  var history = [];
  var lastResult = null;

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, kind) {
    var el = $('wasmStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'wasm-status' + (kind ? ' is-' + kind : '');
  }

  function formatMs(ms) {
    if (ms < 1) return ms.toFixed(3);
    if (ms < 10) return ms.toFixed(2);
    return ms.toFixed(1);
  }

  function formatNum(n) {
    if (!isFinite(n)) return '—';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'e9';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'e6';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'e3';
    return n.toFixed(2);
  }

  /**
   * Minimal wasm module bytes (empty module) + SIMD opcode probe via validate.
   * Real SIMD128 matmul modules are heavy; we detect feature support then emulate.
   */
  function detectWasmFeatures() {
    var hasWasm = typeof WebAssembly === 'object' && typeof WebAssembly.validate === 'function';
    var simd = false;

    if (hasWasm) {
      // WASM SIMD v128.const i32x4 probe (known feature-detection bytes)
      try {
        var simdBytes = new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60,
          0x00, 0x01, 0x7b, 0x03, 0x02, 0x01, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00,
          0x41, 0x00, 0xfd, 0x0c, 0x00, 0x0b
        ]);
        simd = WebAssembly.validate(simdBytes);
      } catch (e) {
        simd = false;
      }

      // Also try compiling a tiny empty module when feasible
      try {
        var empty = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
        if (WebAssembly.validate(empty) && typeof WebAssembly.Module === 'function') {
          // Keep a Module instance to prove compile path works (unused for matmul).
          window.__wasmSimdLabModule = new WebAssembly.Module(empty);
        }
      } catch (e2) {
        // ignore
      }
    }

    return { hasWasm: hasWasm, simd: simd };
  }

  function fillMatrix(n, seed) {
    var a = new Float64Array(n * n);
    var s = seed || 1;
    for (var i = 0; i < a.length; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      a[i] = (s % 1000) / 1000;
    }
    return a;
  }

  function fillMatrix32(n, seed) {
    var a = new Float32Array(n * n);
    var s = seed || 1;
    for (var i = 0; i < a.length; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      a[i] = (s % 1000) / 1000;
    }
    return a;
  }

  /** Naive pure JS matmul (row-major). */
  function matmulJs(A, B, n) {
    var C = new Float64Array(n * n);
    var i;
    var j;
    var k;
    var sum;
    var iBase;
    for (i = 0; i < n; i++) {
      iBase = i * n;
      for (j = 0; j < n; j++) {
        sum = 0;
        for (k = 0; k < n; k++) {
          sum += A[iBase + k] * B[k * n + j];
        }
        C[iBase + j] = sum;
      }
    }
    return C;
  }

  /**
   * WASM SIMD path (emulated): blocked Float32Array matmul with micro-unroll,
   * mimicking SIMD128 lane packing over contiguous loads.
   */
  function matmulSimdEmulated(A, B, n, block) {
    var C = new Float32Array(n * n);
    var BT = new Float32Array(n * n);
    var i;
    var j;
    var k;
    var ii;
    var jj;
    var kk;
    var iMax;
    var jMax;
    var kMax;
    var sum0;
    var sum1;
    var sum2;
    var sum3;
    var a0;
    var iBase;

    // Transpose B for contiguous SIMD-style loads
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        BT[j * n + i] = B[i * n + j];
      }
    }

    for (ii = 0; ii < n; ii += block) {
      iMax = Math.min(ii + block, n);
      for (jj = 0; jj < n; jj += block) {
        jMax = Math.min(jj + block, n);
        for (kk = 0; kk < n; kk += block) {
          kMax = Math.min(kk + block, n);
          for (i = ii; i < iMax; i++) {
            iBase = i * n;
            for (j = jj; j < jMax; j += 4) {
              sum0 = j < jMax ? C[iBase + j] : 0;
              sum1 = j + 1 < jMax ? C[iBase + j + 1] : 0;
              sum2 = j + 2 < jMax ? C[iBase + j + 2] : 0;
              sum3 = j + 3 < jMax ? C[iBase + j + 3] : 0;
              for (k = kk; k < kMax; k++) {
                a0 = A[iBase + k];
                // Emulated 4-wide FMA lane over transposed B
                if (j < jMax) sum0 += a0 * BT[j * n + k];
                if (j + 1 < jMax) sum1 += a0 * BT[(j + 1) * n + k];
                if (j + 2 < jMax) sum2 += a0 * BT[(j + 2) * n + k];
                if (j + 3 < jMax) sum3 += a0 * BT[(j + 3) * n + k];
              }
              if (j < jMax) C[iBase + j] = sum0;
              if (j + 1 < jMax) C[iBase + j + 1] = sum1;
              if (j + 2 < jMax) C[iBase + j + 2] = sum2;
              if (j + 3 < jMax) C[iBase + j + 3] = sum3;
            }
          }
        }
      }
    }
    return C;
  }

  function cacheHeuristic(n, block) {
    // Heuristic: better scores when block fits L1-ish working set and stride is friendly.
    var elemBytes = 4;
    var workingSet = 3 * block * block * elemBytes;
    var l1ish = 32 * 1024;
    var fit = workingSet <= l1ish ? 1 : l1ish / workingSet;
    var alignment = block % 16 === 0 ? 1 : block % 8 === 0 ? 0.85 : 0.65;
    var stridePenalty = n % block === 0 ? 1 : 0.9;
    var missRisk = Math.min(1, workingSet / (l1ish * 2));
    var score = Math.round(100 * fit * alignment * stridePenalty * (1 - 0.35 * missRisk));
    score = Math.max(5, Math.min(100, score));

    var label =
      'score ' +
      score +
      '/100 — block ' +
      block +
      ', working set ~' +
      Math.round(workingSet / 1024) +
      ' KiB, stride ' +
      n +
      (n % block === 0 ? ' (aligned tiles)' : ' (ragged edge tiles)');
    if (missRisk > 0.55) {
      label += '; elevated cache-miss risk for this block vs n';
    }
    return { score: score, label: label };
  }

  function updateBars(jsMs, simdMs) {
    var slower = Math.max(jsMs, simdMs, 0.0001);
    var jsPct = Math.max(4, (jsMs / slower) * 100);
    var simdPct = Math.max(4, (simdMs / slower) * 100);
    $('barJs').style.width = jsPct + '%';
    $('barSimd').style.width = simdPct + '%';
    $('barJsLabel').textContent = formatMs(jsMs) + ' ms';
    $('barSimdLabel').textContent = formatMs(simdMs) + ' ms';
    $('wasmBars').setAttribute('aria-hidden', 'false');
  }

  function renderHistory() {
    var body = $('historyBody');
    if (!body) return;
    if (!history.length) {
      body.innerHTML = '<tr class="wasm-empty-row"><td colspan="7">No runs yet.</td></tr>';
      return;
    }
    body.innerHTML = history
      .map(function (r) {
        return (
          '<tr>' +
          '<td>' +
          r.n +
          '</td>' +
          '<td>' +
          r.block +
          '</td>' +
          '<td>' +
          formatMs(r.jsMs) +
          '</td>' +
          '<td>' +
          formatMs(r.simdMs) +
          '</td>' +
          '<td>' +
          r.speedup.toFixed(2) +
          '×</td>' +
          '<td>' +
          r.gflops.toFixed(3) +
          '</td>' +
          '<td>' +
          r.cacheScore +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function renderResult(r) {
    lastResult = r;
    history.unshift(r);
    if (history.length > 20) history.pop();

    $('statJsMs').textContent = formatMs(r.jsMs);
    $('statSimdMs').textContent = formatMs(r.simdMs);
    $('statSpeedup').textContent = r.speedup.toFixed(2) + '×';
    $('statGflops').textContent = r.gflops.toFixed(3);

    $('wasmEmpty').hidden = true;
    $('wasmMetrics').hidden = false;
    $('metricOps').textContent = formatNum(r.ops);
    $('metricJsFlops').textContent = formatNum(r.jsFlops) + ' FLOPS';
    $('metricSimdFlops').textContent = formatNum(r.simdFlops) + ' FLOPS';
    $('metricCache').textContent = r.cacheLabel;
    $('metricPath').textContent = 'WASM SIMD path (emulated) · Float32Array blocked matmul';

    updateBars(r.jsMs, r.simdMs);
    renderHistory();
    $('exportCsvBtn').disabled = false;
  }

  function runBenchmark() {
    var n = parseInt($('matrixSize').value, 10) || 256;
    var block = parseInt($('blockSize').value, 10) || 16;

    if (n >= 2048) {
      setStatus('n=2048 may be slow and allocate large arrays — running anyway…', 'warn');
    } else {
      setStatus('Running dual benchmark…', '');
    }

    // Yield so status paints
    setTimeout(function () {
      try {
        var A64 = fillMatrix(n, 42);
        var B64 = fillMatrix(n, 99);
        var A32 = fillMatrix32(n, 42);
        var B32 = fillMatrix32(n, 99);

        var t0 = performance.now();
        matmulJs(A64, B64, n);
        var jsMs = performance.now() - t0;

        var t1 = performance.now();
        matmulSimdEmulated(A32, B32, n, block);
        var simdMs = performance.now() - t1;

        var ops = 2 * n * n * n;
        var jsFlops = ops / (jsMs / 1000);
        var simdFlops = ops / (simdMs / 1000);
        var speedup = jsMs / Math.max(simdMs, 1e-9);
        var gflops = Math.max(jsFlops, simdFlops) / 1e9;
        var cache = cacheHeuristic(n, block);

        var result = {
          n: n,
          block: block,
          jsMs: jsMs,
          simdMs: simdMs,
          ops: ops,
          jsFlops: jsFlops,
          simdFlops: simdFlops,
          speedup: speedup,
          gflops: gflops,
          cacheScore: cache.score,
          cacheLabel: cache.label,
          ts: new Date().toISOString()
        };

        renderResult(result);
        setStatus(
          'Done — JS ' +
            formatMs(jsMs) +
            ' ms vs SIMD path ' +
            formatMs(simdMs) +
            ' ms (' +
            speedup.toFixed(2) +
            '×).',
          'ok'
        );
      } catch (err) {
        setStatus('Benchmark failed: ' + (err && err.message ? err.message : String(err)), 'error');
      }
    }, 30);
  }

  function exportCsv() {
    if (!history.length) return;
    var lines = ['n,block,js_ms,simd_ms,speedup,ops,js_flops,simd_flops,gflops,cache_score,timestamp'];
    history.forEach(function (r) {
      lines.push(
        [
          r.n,
          r.block,
          r.jsMs.toFixed(4),
          r.simdMs.toFixed(4),
          r.speedup.toFixed(4),
          r.ops,
          r.jsFlops.toFixed(2),
          r.simdFlops.toFixed(2),
          r.gflops.toFixed(4),
          r.cacheScore,
          r.ts
        ].join(',')
      );
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'wasm-simd-benchmark.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('CSV exported (' + history.length + ' row(s)).', 'ok');
  }

  function initFeatures() {
    var feat = detectWasmFeatures();
    var w = $('featWasm');
    var s = $('featSimd');
    if (w) {
      w.textContent = 'WebAssembly: ' + (feat.hasWasm ? 'yes' : 'no');
      w.className = 'wasm-feature ' + (feat.hasWasm ? 'is-yes' : 'is-no');
    }
    if (s) {
      s.textContent = 'SIMD validate: ' + (feat.simd ? 'supported' : 'not detected');
      s.className = 'wasm-feature ' + (feat.simd ? 'is-yes' : 'is-no');
    }
  }

  function init() {
    initFeatures();
    var runBtn = $('runBenchBtn');
    var exportBtn = $('exportCsvBtn');
    var sizeSelect = $('matrixSize');

    if (runBtn) runBtn.addEventListener('click', runBenchmark);
    if (exportBtn) exportBtn.addEventListener('click', exportCsv);
    if (sizeSelect) {
      sizeSelect.addEventListener('change', function () {
        if (parseInt(sizeSelect.value, 10) === 2048) {
          setStatus('Warning: 2048×2048 may be slow and memory-heavy.', 'warn');
        } else {
          setStatus('');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
