/**
 * WebGPU KV-Cache Profiler
 * Math-based LLM KV cache VRAM estimator (WebGPU detection optional).
 */
(function () {
  'use strict';

  var MODEL_DEFAULTS = {
    '1.5B': { layers: 24, heads: 16, headDim: 64 },
    '7B': { layers: 32, heads: 32, headDim: 128 },
    '13B': { layers: 40, heads: 40, headDim: 128 },
    '70B': { layers: 80, heads: 8, headDim: 128 }, /* GQA-style fewer KV heads */
  };

  var QUANT_BYTES = {
    fp32: 4,
    fp16: 2,
    int8: 1,
    int4: 0.5,
  };

  var QUANT_LABELS = {
    fp32: 'FP32',
    fp16: 'FP16',
    int8: 'INT8',
    int4: 'INT4',
  };

  /** Context slider index 11..17 → 2^n tokens */
  function ctxFromSlider(index) {
    return Math.pow(2, Number(index));
  }

  var state = {
    lastReport: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes.toFixed(0) + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KiB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MiB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(3) + ' GiB';
  }

  function formatMiB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  function getQuant() {
    var el = document.querySelector('input[name="quant"]:checked');
    return el ? el.value : 'fp16';
  }

  function getConfig() {
    return {
      model: $('modelSelect').value,
      layers: clamp(Number($('layersInput').value) || 1, 1, 128),
      heads: clamp(Number($('headsInput').value) || 1, 1, 128),
      headDim: clamp(Number($('headDimInput').value) || 8, 8, 512),
      seq: ctxFromSlider($('ctxSlider').value),
      quant: getQuant(),
      bytes: QUANT_BYTES[getQuant()] || 2,
      paged: $('pagedToggle').checked,
      batch: clamp(Number($('batchInput').value) || 1, 1, 1024),
      vramGb: clamp(Number($('vramBudget').value) || 24, 1, 192),
    };
  }

  /**
   * KV cache bytes ≈ 2 * layers * seq * heads * head_dim * bytes * batch
   * (K and V tensors)
   */
  function kvBytes(cfg, bytesOverride, batchOverride) {
    var bytes = bytesOverride != null ? bytesOverride : cfg.bytes;
    var batch = batchOverride != null ? batchOverride : cfg.batch;
    return 2 * cfg.layers * cfg.seq * cfg.heads * cfg.headDim * bytes * batch;
  }

  function maxBatchForBudget(cfg, bytesPerElem, budgetBytes) {
    var perBatch = kvBytes(cfg, bytesPerElem, 1);
    if (perBatch <= 0) return 0;
    return Math.max(0, Math.floor(budgetBytes / perBatch));
  }

  /**
   * Fragmentation heuristic:
   * - Contiguous: waste from padding to max seq / reserved slabs (~12–35%)
   * - Paged: block utilization typically 85–97% depending on seq vs block size
   */
  function fragmentation(cfg) {
    var blockTokens = 16;
    var rem = cfg.seq % blockTokens;
    var lastBlockFill = rem === 0 ? 1 : rem / blockTokens;
    var pagedUtil = clamp(0.82 + lastBlockFill * 0.12 + (cfg.paged ? 0.04 : 0), 0.75, 0.98);
    var contiguousWaste = clamp(0.1 + Math.log2(cfg.seq / 2048) * 0.035 + (cfg.batch > 4 ? 0.04 : 0), 0.08, 0.4);
    if (cfg.paged) {
      contiguousWaste = contiguousWaste * 0.35;
    }
    return {
      contiguousWastePct: Math.round(contiguousWaste * 1000) / 10,
      pagedUtilPct: Math.round(pagedUtil * 1000) / 10,
    };
  }

  function applyModelDefaults() {
    var model = $('modelSelect').value;
    var d = MODEL_DEFAULTS[model] || MODEL_DEFAULTS['7B'];
    $('layersInput').value = d.layers;
    $('headsInput').value = d.heads;
    $('headDimInput').value = d.headDim;
  }

  function updateCtxLabel() {
    var seq = ctxFromSlider($('ctxSlider').value);
    $('ctxValue').textContent = seq >= 1024 ? (seq / 1024) + 'k' : String(seq);
    var slider = $('ctxSlider');
    slider.setAttribute('aria-valuenow', String(seq));
    slider.setAttribute('aria-valuetext', seq + ' tokens');
  }

  function updateLayoutHint() {
    var paged = $('pagedToggle').checked;
    $('layoutHint').textContent = paged
      ? 'Block-wise allocation (vLLM-style)'
      : 'Single contiguous KV tensors';
  }

  function calculate() {
    var cfg = getConfig();
    var budgetBytes = cfg.vramGb * 1024 * 1024 * 1024;
    var bytes = kvBytes(cfg);
    var maxBatch = maxBatchForBudget(cfg, cfg.bytes, budgetBytes);
    var frag = fragmentation(cfg);
    var utilPct = clamp((bytes / budgetBytes) * 100, 0, 999);

    var effectiveUtil = cfg.paged ? frag.pagedUtilPct : clamp(100 - frag.contiguousWastePct, 0, 100);

    $('statKvMib').textContent = formatMiB(bytes);
    $('statMaxBatch').textContent = String(maxBatch);
    $('statUtil').textContent = (Math.min(utilPct, 100)).toFixed(1) + '%';

    $('wasteBar').style.width = frag.contiguousWastePct + '%';
    $('pagedBar').style.width = frag.pagedUtilPct + '%';
    $('wastePct').textContent = frag.contiguousWastePct.toFixed(1) + '%';
    $('pagedPct').textContent = frag.pagedUtilPct.toFixed(1) + '%';
    $('fragNote').textContent = cfg.paged
      ? 'PagedAttention active: block util ~' + frag.pagedUtilPct.toFixed(1) + '%; contiguous waste estimate reduced.'
      : 'Contiguous layout: expected reserved/padded waste ~' + frag.contiguousWastePct.toFixed(1) + '%.';

    renderSummary(cfg, bytes, maxBatch, utilPct, effectiveUtil, frag);
    renderMatrix(cfg, budgetBytes);
    updateExport(cfg, bytes, maxBatch, utilPct, frag);

    var exportBtn = $('exportReportBtn');
    if (exportBtn) exportBtn.disabled = false;
  }

  function renderSummary(cfg, bytes, maxBatch, utilPct, effectiveUtil, frag) {
    var el = $('kvSummary');
    if (!el) return;

    var overBudget = utilPct > 100;
    el.innerHTML =
      '<div class="kv-summary-grid">' +
      metric('KV cache size', formatBytes(bytes)) +
      metric('Elements (K+V)', formatCount(2 * cfg.layers * cfg.seq * cfg.heads * cfg.headDim * cfg.batch)) +
      metric('Max batch @ ' + cfg.vramGb + ' GB', String(maxBatch)) +
      metric('Budget fill', (Math.min(utilPct, 999)).toFixed(1) + '%' + (overBudget ? ' (over)' : '')) +
      metric('Layout', cfg.paged ? 'PagedAttention' : 'Contiguous') +
      metric('Effective util.', effectiveUtil.toFixed(1) + '%') +
      '</div>' +
      '<div class="kv-formula" aria-label="Formula used">' +
      '2 × layers(' + cfg.layers + ') × seq(' + cfg.seq + ') × heads(' + cfg.heads +
      ') × dim(' + cfg.headDim + ') × bytes(' + cfg.bytes + ') × batch(' + cfg.batch + ')' +
      '</div>';
  }

  function metric(label, value) {
    return (
      '<div class="kv-metric">' +
      '<span class="kv-metric-label">' + escapeHtml(label) + '</span>' +
      '<span class="kv-metric-val">' + escapeHtml(value) + '</span></div>'
    );
  }

  function formatCount(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }

  function renderMatrix(cfg, budgetBytes) {
    var body = $('quantTableBody');
    if (!body) return;

    var fp16Bytes = kvBytes(cfg, QUANT_BYTES.fp16);
    var rows = Object.keys(QUANT_BYTES).map(function (key) {
      var bpe = QUANT_BYTES[key];
      var size = kvBytes(cfg, bpe);
      var maxB = maxBatchForBudget(cfg, bpe, budgetBytes);
      var vs = fp16Bytes > 0 ? (size / fp16Bytes) : 1;
      var active = key === cfg.quant;
      return (
        '<tr class="' + (active ? 'is-active' : '') + '">' +
        '<td>' + QUANT_LABELS[key] + (active ? ' ●' : '') + '</td>' +
        '<td>' + bpe + '</td>' +
        '<td>' + formatBytes(size) + '</td>' +
        '<td>' + maxB + '</td>' +
        '<td>' + (vs * 100).toFixed(0) + '%</td>' +
        '</tr>'
      );
    });

    body.innerHTML = rows.join('');
  }

  function updateExport(cfg, bytes, maxBatch, utilPct, frag) {
    state.lastReport = {
      timestamp: new Date().toISOString(),
      webgpu: !!(navigator.gpu),
      config: cfg,
      kvBytes: bytes,
      maxBatch: maxBatch,
      utilPct: utilPct,
      frag: frag,
      matrix: Object.keys(QUANT_BYTES).map(function (key) {
        return {
          format: QUANT_LABELS[key],
          bytesPerElem: QUANT_BYTES[key],
          kvBytes: kvBytes(cfg, QUANT_BYTES[key]),
          maxBatch: maxBatchForBudget(cfg, QUANT_BYTES[key], cfg.vramGb * 1024 * 1024 * 1024),
        };
      }),
    };
  }

  function exportReport() {
    var r = state.lastReport;
    if (!r) return;
    var c = r.config;

    var lines = [
      '# KV-Cache Profiler Benchmark Report',
      '',
      '- Generated: ' + r.timestamp,
      '- WebGPU (navigator.gpu): ' + (r.webgpu ? 'available' : 'not available'),
      '- Model preset: ' + c.model,
      '- Layers / KV heads / head dim: ' + c.layers + ' / ' + c.heads + ' / ' + c.headDim,
      '- Context length: ' + c.seq + ' tokens',
      '- Quantization: ' + QUANT_LABELS[c.quant] + ' (' + c.bytes + ' bytes/elem)',
      '- Layout: ' + (c.paged ? 'PagedAttention' : 'Contiguous'),
      '- Batch size: ' + c.batch,
      '- VRAM budget: ' + c.vramGb + ' GB',
      '',
      '## Results',
      '',
      '- KV cache: ' + formatBytes(r.kvBytes) + ' (' + formatMiB(r.kvBytes) + ' MiB)',
      '- Max batch @ budget: ' + r.maxBatch,
      '- Budget utilization: ' + r.utilPct.toFixed(2) + '%',
      '- Contiguous waste estimate: ' + r.frag.contiguousWastePct.toFixed(1) + '%',
      '- Paged block utilization: ' + r.frag.pagedUtilPct.toFixed(1) + '%',
      '',
      '## Formula',
      '',
      '`2 * layers * seq * heads * head_dim * bytes * batch`',
      '',
      '## Quantization matrix',
      '',
      '| Format | Bytes/elem | KV cache | Max batch |',
      '| --- | --- | --- | --- |',
    ];

    r.matrix.forEach(function (row) {
      lines.push(
        '| ' + row.format + ' | ' + row.bytesPerElem + ' | ' +
        formatBytes(row.kvBytes) + ' | ' + row.maxBatch + ' |'
      );
    });

    lines.push('', '---', '_Algo Infinity Verse · WebGPU KV-Cache Profiler_', '');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'kv-cache-benchmark-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function detectWebGPU() {
    var badge = $('webgpuBadge');
    if (!badge) return;

    var available = typeof navigator !== 'undefined' && !!navigator.gpu;
    if (available) {
      badge.className = 'kv-webgpu-badge available';
      badge.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> WebGPU available';
      /* Optional: probe adapter without failing the page */
      if (navigator.gpu.requestAdapter) {
        navigator.gpu.requestAdapter().then(function (adapter) {
          if (!adapter) {
            badge.className = 'kv-webgpu-badge unavailable';
            badge.innerHTML = '<i class="fas fa-circle-info" aria-hidden="true"></i> WebGPU API present — no adapter';
            return;
          }
          var name = (adapter.info && adapter.info.device) || 'GPU adapter ready';
          badge.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> WebGPU · ' + escapeHtml(String(name).slice(0, 40));
        }).catch(function () {
          badge.className = 'kv-webgpu-badge available';
          badge.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> WebGPU available';
        });
      }
    } else {
      badge.className = 'kv-webgpu-badge unavailable';
      badge.innerHTML = '<i class="fas fa-ban" aria-hidden="true"></i> WebGPU not available';
    }
  }

  function bind() {
    $('modelSelect').addEventListener('change', function () {
      applyModelDefaults();
      calculate();
    });

    $('ctxSlider').addEventListener('input', function () {
      updateCtxLabel();
    });
    $('ctxSlider').addEventListener('change', calculate);

    $('pagedToggle').addEventListener('change', function () {
      updateLayoutHint();
      calculate();
    });

    document.querySelectorAll('input[name="quant"]').forEach(function (r) {
      r.addEventListener('change', calculate);
    });

    ['layersInput', 'headsInput', 'headDimInput', 'batchInput', 'vramBudget'].forEach(function (id) {
      var el = $(id);
      if (el) {
        el.addEventListener('change', calculate);
      }
    });

    $('calculateBtn').addEventListener('click', calculate);
    $('exportReportBtn').addEventListener('click', exportReport);
  }

  function init() {
    applyModelDefaults();
    updateCtxLabel();
    updateLayoutHint();
    detectWebGPU();
    bind();
    calculate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
