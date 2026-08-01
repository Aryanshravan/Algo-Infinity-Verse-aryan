document.addEventListener('DOMContentLoaded', () => {
  initTransformer();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
const D_MODEL = 3; // Embedding dimension for visual simplicity

let state = {
  words: [], // Array of strings
  embeddings: [], // Array of length-3 vectors (randomly generated or preset)

  // Q, K, V are arrays of vectors, one per word
  Q: [],
  K: [],
  V: [],

  rawScores: [], // 2D array [i][j] = Q[i] dot K[j]
  scaledScores: [], // rawScores / sqrt(d_k)
  softmaxScores: [], // Softmax applied across rows
  outputs: [], // Final contextual vectors

  temp: 1.0,
  useScale: true,
};

// DOM
const els = {
  input: document.getElementById('sentenceInput'),
  btnProc: document.getElementById('btnProcess'),

  btnRiver: document.getElementById('btnPresetRiver'),
  btnMoney: document.getElementById('btnPresetMoney'),

  sliderT: document.getElementById('sliderTemp'),
  valT: document.getElementById('valTemp'),
  tglScale: document.getElementById('tglScale'),

  qkvBox: document.getElementById('qkvRender'),

  gridKeys: document.getElementById('attnKeys'),
  gridQueries: document.getElementById('attnQueries'),
  gridAttn: document.getElementById('attentionGrid'),
  tooltip: document.getElementById('mathTooltip'),

  outBox: document.getElementById('outRender'),
};

// Mock weight matrices (normally learned). For the visualizer we use identity or simple mapping.
// To demonstrate polysemy visually, we'll actually hardcode the 'bank' vectors depending on context
// to ensure the dot product clearly forces the heat map to behave as expected.

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initTransformer() {
  els.btnProc.addEventListener('click', () => processSentence(els.input.value));

  els.btnRiver.addEventListener('click', () => {
    els.input.value = 'i sit by river bank';
    processSentence('i sit by river bank', 'river');
  });

  els.btnMoney.addEventListener('click', () => {
    els.input.value = 'i deposit money in bank';
    processSentence('i deposit money in bank', 'money');
  });

  els.sliderT.addEventListener('input', (e) => {
    state.temp = parseFloat(e.target.value);
    els.valT.textContent = state.temp.toFixed(1);
    calculateAttention();
  });

  els.tglScale.addEventListener('change', (e) => {
    state.useScale = e.target.checked;
    calculateAttention();
  });

  // Grid hover delegated listener
  els.gridAttn.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('attn-cell')) {
      const r = parseInt(e.target.dataset.r);
      const c = parseInt(e.target.dataset.c);
      showTooltip(r, c, e);
    }
  });
  els.gridAttn.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('attn-cell')) {
      els.tooltip.classList.remove('visible');
    }
  });

  // Initial run
  processSentence(els.input.value);
}

// ==========================================
// 3. PIPELINE MATH
// ==========================================

function processSentence(text, contextHint = null) {
  // 1. Tokenize (max 5 words to fit visualizer)
  const rawWords = text.trim().toLowerCase().split(/\s+/).slice(0, 5);
  if (rawWords.length === 0) return;

  state.words = rawWords;
  const N = state.words.length;

  // 2. Generate MOCK Embeddings & QKV
  state.Q = [];
  state.K = [];
  state.V = [];

  for (let i = 0; i < N; i++) {
    let w = state.words[i];

    // We artificially sculpt the QKV vectors to guarantee visually pleasing dot products
    // that demonstrate contextual attention.
    let q = [Math.random(), Math.random(), Math.random()];
    let k = [Math.random(), Math.random(), Math.random()];
    let v = [Math.random(), Math.random(), Math.random()];

    if (w === 'bank') {
      q = [0.8, 0.5, 0.2]; // Bank looks for specific context
      v = [0.1, 0.9, 0.1]; // Bank's core value
    }

    if (contextHint === 'river') {
      if (w === 'river') {
        k = [0.9, 0.6, 0.1];
      } // Strongly aligns with 'bank' Q
    }
    if (contextHint === 'money') {
      if (w === 'money') {
        k = [0.9, 0.6, 0.1];
      } // Strongly aligns with 'bank' Q
      if (w === 'deposit') {
        k = [0.7, 0.5, 0.3];
      } // Also somewhat aligns
    }

    // Normalize Q and K for cleaner raw scores
    q = normalize(q);
    k = normalize(k);
    v = normalize(v);

    state.Q.push(q);
    state.K.push(k);
    state.V.push(v);
  }

  calculateAttention();
}

function normalize(vec) {
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (mag === 0) return vec;
  return vec.map((v) => v / mag);
}

function calculateAttention() {
  const N = state.words.length;

  state.rawScores = [];
  state.scaledScores = [];
  state.softmaxScores = [];
  state.outputs = [];

  // Math Phase 1: Q * K^T
  for (let i = 0; i < N; i++) {
    let rawRow = [];
    let scaledRow = [];

    for (let j = 0; j < N; j++) {
      // Dot product Q[i] • K[j]
      let dot = 0;
      for (let d = 0; d < D_MODEL; d++) {
        dot += state.Q[i][d] * state.K[j][d];
      }
      rawRow.push(dot);

      // Scale and Temp
      let scaled = dot;
      if (state.useScale) scaled = scaled / Math.sqrt(D_MODEL);
      scaled = scaled / state.temp;
      scaledRow.push(scaled);
    }
    state.rawScores.push(rawRow);
    state.scaledScores.push(scaledRow);

    // Softmax across row
    const maxScore = Math.max(...scaledRow); // for numerical stability
    const expRow = scaledRow.map((s) => Math.exp(s - maxScore));
    const sumExp = expRow.reduce((a, b) => a + b, 0);
    const smRow = expRow.map((e) => e / sumExp);
    state.softmaxScores.push(smRow);

    // Math Phase 2: Softmax * V
    let outVec = [0, 0, 0];
    for (let j = 0; j < N; j++) {
      const weight = smRow[j];
      for (let d = 0; d < D_MODEL; d++) {
        outVec[d] += weight * state.V[j][d];
      }
    }
    state.outputs.push(outVec);
  }

  renderUI();
}

// ==========================================
// 4. RENDERING & TOOLTIPS
// ==========================================

function renderUI() {
  const N = state.words.length;

  // 1. Render QKV Block
  els.qkvBox.innerHTML = '';
  for (let i = 0; i < N; i++) {
    const row = document.createElement('div');
    row.className = 'word-block';

    // Render vectors as small blocks
    const qHtml = state.Q[i].map((v) => `<div class="vec-cell">${v.toFixed(1)}</div>`).join('');
    const kHtml = state.K[i].map((v) => `<div class="vec-cell">${v.toFixed(1)}</div>`).join('');
    const vHtml = state.V[i].map((v) => `<div class="vec-cell">${v.toFixed(1)}</div>`).join('');

    row.innerHTML = `
            <div class="word-label">${state.words[i]}</div>
            <div class="vector-group">
                <div class="vector-col v-q"><div class="vec-head hq">Q</div>${qHtml}</div>
                <div class="vector-col v-k"><div class="vec-head hk">K</div>${kHtml}</div>
                <div class="vector-col v-v"><div class="vec-head hv">V</div>${vHtml}</div>
            </div>
        `;
    els.qkvBox.appendChild(row);
  }

  // 2. Render Attention Grid
  els.gridKeys.innerHTML = '';
  els.gridQueries.innerHTML = '';
  els.gridAttn.innerHTML = '';
  els.gridAttn.style.gridTemplateColumns = `repeat(${N}, 60px)`;

  for (let i = 0; i < N; i++) {
    // Top Labels (Keys)
    const kLab = document.createElement('div');
    kLab.className = 'attn-key-label';
    kLab.textContent = state.words[i];
    els.gridKeys.appendChild(kLab);

    // Left Labels (Queries)
    const qLab = document.createElement('div');
    qLab.className = 'attn-q-label';
    qLab.textContent = state.words[i];
    els.gridQueries.appendChild(qLab);
  }

  // Grid Cells
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cell = document.createElement('div');
      cell.className = 'attn-cell';
      cell.dataset.r = r;
      cell.dataset.c = c;

      const weight = state.softmaxScores[r][c];
      cell.textContent = weight.toFixed(2);

      // Map weight (0 to 1) to heat color (Black -> Purple -> White/Yellow)
      // Weight 0 = rgb(0,0,0)
      // Weight 1 = rgb(245, 158, 11) (Yellow/Warning)

      const intensity = Math.floor(weight * 255);
      // Red-ish / Gold heat map
      cell.style.background = `rgb(${intensity}, ${Math.floor(intensity * 0.5)}, ${Math.floor(intensity * 0.1)})`;
      if (weight < 0.3) cell.style.color = '#94a3b8'; // grey out low values for contrast

      els.gridAttn.appendChild(cell);
    }
  }

  // 3. Render Final Output
  els.outBox.innerHTML = '';
  for (let i = 0; i < N; i++) {
    const row = document.createElement('div');
    row.className = 'word-block';

    const outHtml = state.outputs[i]
      .map((v) => `<div class="vec-cell">${v.toFixed(2)}</div>`)
      .join('');

    row.innerHTML = `
            <div class="word-label text-success">${state.words[i]}</div>
            <div class="vector-group">
                <div class="vector-col v-out"><div class="vec-head" style="color:var(--tf-out)">Context Vec</div>${outHtml}</div>
            </div>
        `;
    els.outBox.appendChild(row);
  }
}

function showTooltip(r, c, e) {
  const qW = state.words[r];
  const kW = state.words[c];

  const qV = state.Q[r];
  const kV = state.K[c];

  let html = `<strong>Q("${qW}") • K("${kW}")</strong><hr style="border-color:var(--tf-border);margin:4px 0">`;

  html += `<div style="text-align:left">`;
  html += `Q = [${qV.map((v) => v.toFixed(2)).join(', ')}]<br>`;
  html += `K = [${kV.map((v) => v.toFixed(2)).join(', ')}]<br>`;
  html += `<hr style="border-color:var(--tf-border);margin:4px 0">`;
  html += `Raw Dot Product: <span style="color:var(--tf-k)">${state.rawScores[r][c].toFixed(3)}</span><br>`;

  if (state.useScale) {
    html += `Scaled (÷√3): <span style="color:var(--tf-k)">${(state.rawScores[r][c] / Math.sqrt(3)).toFixed(3)}</span><br>`;
  }
  html += `Temp (÷${state.temp.toFixed(1)}): <span style="color:var(--tf-k)">${state.scaledScores[r][c].toFixed(3)}</span><br>`;
  html += `<hr style="border-color:var(--tf-border);margin:4px 0">`;
  html += `<strong>Softmax Weight: <span style="color:var(--tf-out)">${(state.softmaxScores[r][c] * 100).toFixed(1)}%</span></strong>`;
  html += `</div>`;

  els.tooltip.innerHTML = html;
  els.tooltip.classList.add('visible');
}
