document.addEventListener('DOMContentLoaded', () => {
  initCNN();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
const IN_SIZE = 28; // 28x28 input
const K_SIZE = 3; // 3x3 kernel
const OUT_SIZE = IN_SIZE - K_SIZE + 1; // 26x26 conv output (stride=1, pad=0)
const POOL_SIZE = OUT_SIZE / 2; // 13x13 pool output (2x2 max pool)

const PIXEL_SCALE_IN = 280 / IN_SIZE; // Canvas is 280px wide
const PIXEL_SCALE_OUT = 260 / OUT_SIZE; // Canvas is 260px wide
const PIXEL_SCALE_POOL = 260 / POOL_SIZE; // Scale up 13x13 to 260px for visibility

let state = {
  input: createMatrix(IN_SIZE, IN_SIZE), // 0 to 1
  convOut: createMatrix(OUT_SIZE, OUT_SIZE), // Unbounded (can be negative)
  poolOut: createMatrix(POOL_SIZE, POOL_SIZE),
  kernel: [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ],
  useRelu: true,
  usePool: true,
  mode: 'live', // 'live' or 'step'
  stepPos: { r: 0, c: 0 },
  isDrawing: false,
  animFrame: null,
};

// Presets
const KERNEL_PRESETS = {
  edge: [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ],
  sobelX: [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ],
  sobelY: [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ],
  sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
  blur: [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
  ],
};

// DOM
const els = {
  inCv: document.getElementById('inputCanvas'),
  cvCv: document.getElementById('convCanvas'),
  plCv: document.getElementById('poolCanvas'),
  window: document.getElementById('inputWindow'),
  tooltip: document.getElementById('mathTooltip'),
  dense: document.getElementById('denseOutput'),

  kInputs: [],
  preset: document.getElementById('kernelPreset'),
  tglRelu: document.getElementById('reluToggle'),
  tglPool: document.getElementById('poolToggle'),

  btnLive: document.getElementById('btnModeLive'),
  btnStep: document.getElementById('btnModeStep'),
  btnNext: document.getElementById('btnNextStep'),
  btnClear: document.getElementById('btnClear'),
};

let ctxIn, ctxCv, ctxPl;

// ==========================================
// 2. INIT & EVENT BINDINGS
// ==========================================
function initCNN() {
  ctxIn = els.inCv.getContext('2d', { willReadFrequently: true });
  ctxCv = els.cvCv.getContext('2d');
  ctxPl = els.plCv.getContext('2d');

  // Bind Kernel Editor
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const el = document.getElementById(`k${r}${c}`);
      els.kInputs.push(el);
      el.addEventListener('input', () => {
        state.kernel[r][c] = parseFloat(el.value) || 0;
        if (state.mode === 'live') runInference();
      });
    }
  }

  els.preset.addEventListener('change', (e) => {
    const mat = KERNEL_PRESETS[e.target.value];
    let i = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        state.kernel[r][c] = mat[r][c];
        els.kInputs[i].value = mat[r][c];
        i++;
      }
    }
    if (state.mode === 'live') runInference();
  });

  // Bind Toggles
  els.tglRelu.addEventListener('change', (e) => {
    state.useRelu = e.target.checked;
    if (state.mode === 'live') runInference();
  });
  els.tglPool.addEventListener('change', (e) => {
    state.usePool = e.target.checked;
    if (state.usePool) {
      els.plCv.style.opacity = 1;
    } else {
      els.plCv.style.opacity = 0.2; // Dim it
    }
    if (state.mode === 'live') runInference();
  });

  // Bind Modes
  els.btnLive.addEventListener('click', () => setMode('live'));
  els.btnStep.addEventListener('click', () => setMode('step'));
  els.btnNext.addEventListener('click', stepInference);
  els.btnClear.addEventListener('click', clearCanvas);

  // Bind Drawing Canvas
  els.inCv.addEventListener('mousedown', startDraw);
  els.inCv.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', endDraw);

  // Bind Tooltip on Conv Canvas
  els.cvCv.addEventListener('mousemove', handleTooltip);
  els.cvCv.addEventListener('mouseout', () => {
    els.tooltip.classList.remove('visible');
    els.window.style.display = 'none'; // hide sliding window on mouseout
  });

  // Build Dense UI
  buildDenseUI();

  // Initial clear
  clearCanvas();
}

function setMode(mode) {
  state.mode = mode;
  if (mode === 'live') {
    els.btnLive.classList.add('active');
    els.btnStep.classList.remove('active');
    els.btnNext.style.display = 'none';
    els.window.style.display = 'none';
    runInference();
  } else {
    els.btnLive.classList.remove('active');
    els.btnStep.classList.add('active');
    els.btnNext.style.display = 'block';
    state.stepPos = { r: 0, c: 0 };
    // Reset conv and pool outputs to black
    state.convOut = createMatrix(OUT_SIZE, OUT_SIZE);
    state.poolOut = createMatrix(POOL_SIZE, POOL_SIZE);
    renderOutput();
  }
}

// ==========================================
// 3. DRAWING & INPUT LOGIC
// ==========================================
function startDraw(e) {
  state.isDrawing = true;
  draw(e);
}

function draw(e) {
  if (!state.isDrawing) return;

  const rect = els.inCv.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Draw thick soft brush on canvas
  const gradient = ctxIn.createRadialGradient(x, y, 0, x, y, 15);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctxIn.fillStyle = gradient;
  ctxIn.beginPath();
  ctxIn.arc(x, y, 15, 0, Math.PI * 2);
  ctxIn.fill();

  updateInputMatrix();

  if (state.mode === 'live') {
    // Debounce inference slightly if needed, but 60fps should be fine for 28x28
    if (state.animFrame) cancelAnimationFrame(state.animFrame);
    state.animFrame = requestAnimationFrame(runInference);
  }
}

function endDraw() {
  state.isDrawing = false;
}

function clearCanvas() {
  ctxIn.clearRect(0, 0, els.inCv.width, els.inCv.height);
  state.input = createMatrix(IN_SIZE, IN_SIZE);
  state.convOut = createMatrix(OUT_SIZE, OUT_SIZE);
  state.poolOut = createMatrix(POOL_SIZE, POOL_SIZE);
  renderOutput();
  updateDenseUI([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // Reset probs
}

function updateInputMatrix() {
  const imgData = ctxIn.getImageData(0, 0, els.inCv.width, els.inCv.height).data;

  // Map 280x280 down to 28x28
  for (let r = 0; r < IN_SIZE; r++) {
    for (let c = 0; c < IN_SIZE; c++) {
      // Find center pixel of the 10x10 block
      const pxX = Math.floor(c * PIXEL_SCALE_IN + PIXEL_SCALE_IN / 2);
      const pxY = Math.floor(r * PIXEL_SCALE_IN + PIXEL_SCALE_IN / 2);
      const idx = (pxY * els.inCv.width + pxX) * 4;

      // Just use Red channel as intensity since we draw in white
      const intensity = imgData[idx] / 255.0;
      state.input[r][c] = intensity;
    }
  }
}

// ==========================================
// 4. CNN MATH (CONV, RELU, POOL)
// ==========================================

function runInference() {
  // 1. Convolution + ReLU
  for (let r = 0; r < OUT_SIZE; r++) {
    for (let c = 0; c < OUT_SIZE; c++) {
      computeConvPixel(r, c);
    }
  }

  // 2. Max Pooling
  if (state.usePool) {
    for (let r = 0; r < POOL_SIZE; r++) {
      for (let c = 0; c < POOL_SIZE; c++) {
        // 2x2 window
        const r0 = r * 2;
        const c0 = c * 2;
        let max = state.convOut[r0][c0];
        if (state.convOut[r0][c0 + 1] > max) max = state.convOut[r0][c0 + 1];
        if (state.convOut[r0 + 1][c0] > max) max = state.convOut[r0 + 1][c0];
        if (state.convOut[r0 + 1][c0 + 1] > max) max = state.convOut[r0 + 1][c0 + 1];
        state.poolOut[r][c] = max;
      }
    }
  }

  renderOutput();
  mockDensePredict();
}

function stepInference() {
  if (state.mode !== 'step') return;

  // Move window
  positionSlidingWindow(state.stepPos.r, state.stepPos.c);

  // Compute current
  computeConvPixel(state.stepPos.r, state.stepPos.c);

  // Partially update pool if needed (simplified: just run full pool on current state)
  if (state.usePool) {
    for (let r = 0; r < POOL_SIZE; r++) {
      for (let c = 0; c < POOL_SIZE; c++) {
        const r0 = r * 2;
        const c0 = c * 2;
        state.poolOut[r][c] = Math.max(
          state.convOut[r0][c0],
          state.convOut[r0][c0 + 1],
          state.convOut[r0 + 1][c0],
          state.convOut[r0 + 1][c0 + 1]
        );
      }
    }
  }

  renderOutput();

  // Increment step
  state.stepPos.c++;
  if (state.stepPos.c >= OUT_SIZE) {
    state.stepPos.c = 0;
    state.stepPos.r++;
  }
  if (state.stepPos.r >= OUT_SIZE) {
    state.stepPos.r = 0; // wrap around
    mockDensePredict();
  }
}

function computeConvPixel(r, c) {
  let sum = 0;
  for (let kr = 0; kr < K_SIZE; kr++) {
    for (let kc = 0; kc < K_SIZE; kc++) {
      sum += state.input[r + kr][c + kc] * state.kernel[kr][kc];
    }
  }
  if (state.useRelu && sum < 0) sum = 0; // ReLU
  state.convOut[r][c] = sum;
}

// ==========================================
// 5. RENDERING OUTPUTS
// ==========================================

function renderOutput() {
  // Render Conv (26x26)
  ctxCv.clearRect(0, 0, els.cvCv.width, els.cvCv.height);

  // Find max for normalization so colors glow based on relative intensity
  let maxConv = 0.01;
  for (let r = 0; r < OUT_SIZE; r++) {
    for (let c = 0; c < OUT_SIZE; c++) {
      if (Math.abs(state.convOut[r][c]) > maxConv) maxConv = Math.abs(state.convOut[r][c]);
    }
  }

  for (let r = 0; r < OUT_SIZE; r++) {
    for (let c = 0; c < OUT_SIZE; c++) {
      const val = state.convOut[r][c];
      // Normalize to 0-255
      let intensity = (Math.abs(val) / maxConv) * 255;

      // If negative (only happens if ReLU is OFF), color red. If positive, color yellow/gold
      if (val < 0) {
        ctxCv.fillStyle = `rgb(${intensity}, 0, 0)`; // Negative = Red
      } else {
        ctxCv.fillStyle = `rgb(${intensity}, ${intensity * 0.7}, 0)`; // Positive = Gold
      }

      ctxCv.fillRect(c * PIXEL_SCALE_OUT, r * PIXEL_SCALE_OUT, PIXEL_SCALE_OUT, PIXEL_SCALE_OUT);
    }
  }

  // Render Pool (13x13 scaled to 260px)
  if (state.usePool) {
    ctxPl.clearRect(0, 0, els.plCv.width, els.plCv.height);

    let maxPool = 0.01;
    for (let r = 0; r < POOL_SIZE; r++) {
      for (let c = 0; c < POOL_SIZE; c++) {
        if (Math.abs(state.poolOut[r][c]) > maxPool) maxPool = Math.abs(state.poolOut[r][c]);
      }
    }

    for (let r = 0; r < POOL_SIZE; r++) {
      for (let c = 0; c < POOL_SIZE; c++) {
        const val = state.poolOut[r][c];
        let intensity = (Math.abs(val) / maxPool) * 255;

        if (val < 0) {
          ctxPl.fillStyle = `rgb(${intensity}, 0, 0)`;
        } else {
          ctxPl.fillStyle = `rgb(0, ${intensity * 0.8}, ${intensity})`; // Positive = Cyan/Greenish
        }

        ctxPl.fillRect(
          c * PIXEL_SCALE_POOL,
          r * PIXEL_SCALE_POOL,
          PIXEL_SCALE_POOL,
          PIXEL_SCALE_POOL
        );
        // Grid lines for pool blocks
        ctxPl.strokeStyle = 'rgba(255,255,255,0.1)';
        ctxPl.strokeRect(
          c * PIXEL_SCALE_POOL,
          r * PIXEL_SCALE_POOL,
          PIXEL_SCALE_POOL,
          PIXEL_SCALE_POOL
        );
      }
    }
  }
}

// ==========================================
// 6. TOOLTIPS & MATH INSPECTOR
// ==========================================

const CANVAS_PAD = 4; // Matches .canvas-container padding in cnn-visualizer.css

function positionSlidingWindow(r, c) {
  els.window.style.display = 'block';
  els.window.style.width = `${K_SIZE * PIXEL_SCALE_IN}px`;
  els.window.style.height = `${K_SIZE * PIXEL_SCALE_IN}px`;
  els.window.style.left = `${c * PIXEL_SCALE_IN + CANVAS_PAD}px`;
  els.window.style.top = `${r * PIXEL_SCALE_IN + CANVAS_PAD}px`;
}

function handleTooltip(e) {
  if (state.mode === 'step') return; // disabled in step mode to prevent confusion

  const rect = els.cvCv.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Calculate which Conv cell we are hovering over
  const c = Math.floor(x / PIXEL_SCALE_OUT);
  const r = Math.floor(y / PIXEL_SCALE_OUT);

  if (r >= 0 && r < OUT_SIZE && c >= 0 && c < OUT_SIZE) {
    // Move window on input canvas
    positionSlidingWindow(r, c);

    // Show tooltip
    showMathTooltip(r, c);
  }
}

function showMathTooltip(r, c) {
  let html = `<div class="math-grid">`;
  let sum = 0;

  for (let kr = 0; kr < K_SIZE; kr++) {
    for (let kc = 0; kc < K_SIZE; kc++) {
      const inVal = state.input[r + kr][c + kc].toFixed(2);
      const kVal = state.kernel[kr][kc];
      const prod = inVal * kVal;
      sum += prod;

      html += `<div class="math-cell ${kVal !== 0 ? 'highlight' : ''}">
                ${inVal}<br><span style="color:var(--cnn-warning)">*${kVal}</span>
            </div>`;
    }
  }
  html += `</div>`;

  let outVal = sum;
  if (state.useRelu && sum < 0) outVal = 0;

  html += `<div class="math-equation">
        Σ = ${sum.toFixed(2)}<br>
        ReLU = ${outVal.toFixed(2)}
    </div>`;

  els.tooltip.innerHTML = html;
  els.tooltip.classList.add('visible');
}

// ==========================================
// 7. MOCK DENSE CLASSIFIER
// ==========================================
function buildDenseUI() {
  els.dense.innerHTML = '';
  for (let i = 0; i <= 9; i++) {
    const row = document.createElement('div');
    row.className = 'dense-row';
    row.id = `dense-row-${i}`;

    row.innerHTML = `
            <div class="dense-label">${i}</div>
            <div class="dense-bar-wrap"><div class="dense-bar" id="dense-bar-${i}"></div></div>
            <div class="dense-val" id="dense-val-${i}">0%</div>
        `;
    els.dense.appendChild(row);
  }
}

function mockDensePredict() {
  // Very simple heuristic based on feature map sum/density to simulate network output
  // A real app would load ONNX weights, but this is a visualizer focusing on the Conv math.
  let totalActivation = 0;
  const targetMap = state.usePool ? state.poolOut : state.convOut;
  const size = state.usePool ? POOL_SIZE : OUT_SIZE;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      totalActivation += Math.abs(targetMap[r][c]);
    }
  }

  // Base pseudo-randomness on total activation to make bars move dynamically as you draw
  const seed = totalActivation;
  let probs = new Array(10).fill(0);

  if (totalActivation > 5) {
    // Generate stable pseudo-random probabilities that sum to 100
    let sumP = 0;
    for (let i = 0; i <= 9; i++) {
      // Hash function mapping activation sum to a weight
      const p = Math.abs(Math.sin(seed + i * 13)) * 100;
      probs[i] = p;
      sumP += p;
    }
    // Normalize
    for (let i = 0; i <= 9; i++) {
      probs[i] = (probs[i] / sumP) * 100;
    }
  }

  updateDenseUI(probs);
}

function updateDenseUI(probs) {
  let maxIdx = -1;
  let maxVal = -1;

  for (let i = 0; i <= 9; i++) {
    if (probs[i] > maxVal && probs[i] > 1) {
      // threshold
      maxVal = probs[i];
      maxIdx = i;
    }
  }

  for (let i = 0; i <= 9; i++) {
    const row = document.getElementById(`dense-row-${i}`);
    const bar = document.getElementById(`dense-bar-${i}`);
    const val = document.getElementById(`dense-val-${i}`);

    bar.style.width = `${probs[i]}%`;
    val.textContent = `${probs[i].toFixed(1)}%`;

    if (i === maxIdx) row.classList.add('active');
    else row.classList.remove('active');
  }
}

// Utils
function createMatrix(rows, cols) {
  const mat = new Array(rows);
  for (let r = 0; r < rows; r++) {
    mat[r] = new Float32Array(cols).fill(0);
  }
  return mat;
}
