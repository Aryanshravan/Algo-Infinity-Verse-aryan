/**
 * l-system-fractal.js
 * Interactive Formal Grammar & Turtle Graphics Engine
 */

const PRESETS = {
  fractalTree: {
    axiom: 'X',
    rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' },
    iterations: 6,
    angle: 25,
  },
  fractalCanopy: {
    axiom: 'F',
    rules: { F: 'F[+F]F[-F]F' },
    iterations: 5,
    angle: 25,
  },
  barnsleyFern: {
    axiom: 'X',
    rules: { X: 'F-[[X]+X]+F[+FX]-X', F: 'FF' },
    iterations: 6,
    angle: 22,
  },
  kochSnowflake: {
    axiom: 'F--F--F',
    rules: { F: 'F+F--F+F' },
    iterations: 4,
    angle: 60,
  },
  sierpinskiTriangle: {
    axiom: 'F-G-G',
    rules: { F: 'F-G+F+G-F', G: 'GG' },
    iterations: 6,
    angle: 120,
  },
  dragonCurve: {
    axiom: 'FX',
    rules: { X: 'X+YF+', Y: '-FX-Y' },
    iterations: 10,
    angle: 90,
  },
  hilbertCurve: {
    axiom: 'A',
    rules: { A: '-BF+AFA+FB-', B: '+AF-BFB-FA+' },
    iterations: 5,
    angle: 90,
  },
};

const els = {
  canvas: document.getElementById('fractalCanvas'),
  wrapper: document.getElementById('canvasWrapper'),
  presetSelect: document.getElementById('presetSelect'),
  axiomInput: document.getElementById('axiomInput'),
  rulesContainer: document.getElementById('rulesContainer'),
  addRuleBtn: document.getElementById('addRuleBtn'),
  iterSlider: document.getElementById('iterationsSlider'),
  iterVal: document.getElementById('iterationsVal'),
  angleSlider: document.getElementById('angleSlider'),
  angleVal: document.getElementById('angleVal'),
  thicknessSlider: document.getElementById('thicknessSlider'),
  thicknessVal: document.getElementById('thicknessVal'),
  colorSlider: document.getElementById('colorSlider'),
  colorVal: document.getElementById('colorVal'),
  drawBtn: document.getElementById('drawInstantBtn'),
  animateBtn: document.getElementById('animateBtn'),
  growStepBtn: document.getElementById('growStepBtn'),
  strLengthStat: document.getElementById('strLengthStat'),
};

let ctx;
let currentString = '';
let animationId = null;

// Drawing state
let rulesObj = {};

document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  bindEvents();
  loadPreset('fractalTree'); // Load default
});

function initCanvas() {
  ctx = els.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const rect = els.wrapper.getBoundingClientRect();
  // High DPI support
  const dpr = window.devicePixelRatio || 1;
  els.canvas.width = rect.width * dpr;
  els.canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
}

function bindEvents() {
  els.presetSelect.addEventListener('change', (e) => {
    if (e.target.value !== 'custom') {
      loadPreset(e.target.value);
    }
  });

  els.addRuleBtn.addEventListener('click', () => {
    addRuleRow('', '');
    els.presetSelect.value = 'custom';
  });

  els.iterSlider.addEventListener('input', (e) => {
    els.iterVal.textContent = e.target.value;
    els.presetSelect.value = 'custom';
  });

  els.angleSlider.addEventListener('input', (e) => {
    els.angleVal.textContent = e.target.value + '°';
    els.presetSelect.value = 'custom';
  });

  els.thicknessSlider.addEventListener('input', (e) => {
    els.thicknessVal.textContent = parseFloat(e.target.value).toFixed(2);
    els.presetSelect.value = 'custom';
  });

  els.colorSlider.addEventListener('input', (e) => {
    els.colorVal.textContent = parseFloat(e.target.value).toFixed(1);
    els.presetSelect.value = 'custom';
  });

  els.drawBtn.addEventListener('click', () => {
    draw(false);
  });
  els.animateBtn.addEventListener('click', () => {
    draw(true);
  });
  els.growStepBtn.addEventListener('click', () => {
    growStep();
  });

  els.axiomInput.addEventListener('input', () => (els.presetSelect.value = 'custom'));
}

async function growStep() {
  let axiom = currentString || els.axiomInput.value.trim();
  if (!axiom) return;

  if (axiom.length >= 5000000) {
    console.warn('L-System reached memory limit');
    return;
  }
  // Disable buttons
  els.drawBtn.disabled = true;
  els.animateBtn.disabled = true;
  els.growStepBtn.disabled = true;
  els.strLengthStat.textContent = 'Generating 1 Step...';

  parseRules();

  let next = '';
  let t0 = performance.now();
  for (let j = 0; j < axiom.length; j++) {
    const c = axiom[j];
    next += rulesObj[c] || c;

    if (j % 50000 === 0 && performance.now() - t0 > 16) {
      await new Promise((r) => setTimeout(r, 0));
      t0 = performance.now();
    }
  }

  currentString = next;

  // Update iterations counter if it's matching
  let currentIter = parseInt(els.iterSlider.value);
  if (currentIter < parseInt(els.iterSlider.max)) {
    els.iterSlider.value = currentIter + 1;
    els.iterVal.textContent = els.iterSlider.value;
  }

  els.strLengthStat.textContent = currentString.length.toLocaleString();
  els.drawBtn.disabled = false;
  els.animateBtn.disabled = false;
  els.growStepBtn.disabled = false;

  draw(false, true); // redraw with current string, avoid re-expanding
}

function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;

  els.axiomInput.value = preset.axiom;

  els.rulesContainer.innerHTML = '';
  for (const [char, replacement] of Object.entries(preset.rules)) {
    addRuleRow(char, replacement);
  }

  els.iterSlider.value = preset.iterations;
  els.iterVal.textContent = preset.iterations;

  els.angleSlider.value = preset.angle;
  els.angleVal.textContent = preset.angle + '°';

  draw(false);
}

function addRuleRow(char, replacement) {
  const row = document.createElement('div');
  row.className = 'rule-row';

  row.innerHTML = `
        <input type="text" class="styled-input rule-char" maxlength="1" value="${char}" placeholder="A">
        <span class="rule-arrow">-></span>
        <input type="text" class="styled-input rule-expansion" value="${replacement}" placeholder="AB">
        <button class="remove-rule-btn" title="Remove rule"><i class="fas fa-times"></i></button>
    `;

  row.querySelector('.remove-rule-btn').addEventListener('click', () => {
    row.remove();
    els.presetSelect.value = 'custom';
  });

  row.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('input', () => (els.presetSelect.value = 'custom'));
  });

  els.rulesContainer.appendChild(row);
}

function parseRules() {
  rulesObj = {};
  const rows = els.rulesContainer.querySelectorAll('.rule-row');
  rows.forEach((row) => {
    const char = row.querySelector('.rule-char').value.trim();
    const replacement = row.querySelector('.rule-expansion').value.trim();
    if (char && replacement) {
      rulesObj[char] = replacement;
    }
  });
}

async function expandLSystem() {
  let axiom = els.axiomInput.value.trim();
  const iterations = parseInt(els.iterSlider.value);

  els.drawBtn.disabled = true;
  els.animateBtn.disabled = true;
  els.growStepBtn.disabled = true;
  els.strLengthStat.textContent = 'Generating String...';

  let curr = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = '';
    let t0 = performance.now();
    for (let j = 0; j < curr.length; j++) {
      const c = curr[j];
      next += rulesObj[c] || c;

      if (j % 50000 === 0 && performance.now() - t0 > 16) {
        els.strLengthStat.textContent = `Generating (Iter ${i + 1}/${iterations})...`;
        await new Promise((r) => setTimeout(r, 0));
        t0 = performance.now();
      }
    }
    curr = next;

    if (curr.length > 5000000) {
      console.warn('L-System reached memory limit');
      break;
    }
  }

  currentString = curr;
  els.strLengthStat.textContent = currentString.length.toLocaleString();
  els.drawBtn.disabled = false;
  els.animateBtn.disabled = false;
  els.growStepBtn.disabled = false;
}

// ==========================================
// TURTLE GRAPHICS ENGINE
// ==========================================

async function calculateBounds(commands, angleRad) {
  let x = 0,
    y = 0,
    currentAngle = -Math.PI / 2; // Face UP initially
  let minX = 0,
    maxX = 0,
    minY = 0,
    maxY = 0;
  const stack = [];
  const step = 1; // Arbitrary unit

  els.strLengthStat.textContent = 'Calculating Bounds...';
  let t0 = performance.now();

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    if (cmd === 'F' || cmd === 'G') {
      x += Math.cos(currentAngle) * step;
      y += Math.sin(currentAngle) * step;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    } else if (cmd === 'f') {
      x += Math.cos(currentAngle) * step;
      y += Math.sin(currentAngle) * step;
    } else if (cmd === '+') {
      currentAngle += angleRad;
    } else if (cmd === '-') {
      currentAngle -= angleRad;
    } else if (cmd === '[') {
      stack.push({ x, y, a: currentAngle });
    } else if (cmd === ']') {
      const state = stack.pop();
      if (state) {
        x = state.x;
        y = state.y;
        currentAngle = state.a;
      }
    }

    if (i % 50000 === 0 && performance.now() - t0 > 16) {
      await new Promise((r) => setTimeout(r, 0));
      t0 = performance.now();
    }
  }

  els.strLengthStat.textContent = currentString.length.toLocaleString();
  return { minX, maxX, minY, maxY };
}

async function draw(animate = false, skipExpand = false) {
  if (animationId) cancelAnimationFrame(animationId);

  parseRules();
  if (!skipExpand) {
    await expandLSystem();
  }

  const canvasWidth = els.canvas.clientWidth;
  const canvasHeight = els.canvas.clientHeight;

  // Clear Canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (!currentString) return;

  const angleDeg = parseFloat(els.angleSlider.value);
  const angleRad = angleDeg * (Math.PI / 180);

  // Dry Run to auto-scale
  const bounds = await calculateBounds(currentString, angleRad);

  const bWidth = bounds.maxX - bounds.minX;
  const bHeight = bounds.maxY - bounds.minY;

  // Add 10% padding
  const padding = 40;
  const scaleX = (canvasWidth - padding * 2) / (bWidth || 1);
  const scaleY = (canvasHeight - padding * 2) / (bHeight || 1);

  const scale = Math.min(scaleX, scaleY);

  // Calculate offsets to center the bounding box
  const offsetX = (canvasWidth - bWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = (canvasHeight - bHeight * scale) / 2 - bounds.minY * scale;

  const thicknessDecay = parseFloat(els.thicknessSlider.value);
  const colorShift = parseFloat(els.colorSlider.value);

  // Context setup
  let currentLw = 2.0;
  let currentColorH = 150; // Starting hue (green)
  ctx.strokeStyle = `hsl(${currentColorH}, 80%, 50%)`;
  ctx.lineWidth = currentLw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let x = offsetX;
  let y = offsetY;
  let currentAngle = -Math.PI / 2; // Face UP
  const stack = [];
  const step = scale; // Actual line length

  if (!animate) {
    // Draw Instantaneously but yielding to prevent UI lockup
    ctx.beginPath();
    ctx.moveTo(x, y);

    let t0 = performance.now();
    els.strLengthStat.textContent = 'Drawing...';

    for (let i = 0; i < currentString.length; i++) {
      const cmd = currentString[i];
      if (cmd === 'F' || cmd === 'G') {
        x += Math.cos(currentAngle) * step;
        y += Math.sin(currentAngle) * step;
        ctx.lineTo(x, y);
      } else if (cmd === 'f') {
        x += Math.cos(currentAngle) * step;
        y += Math.sin(currentAngle) * step;
        ctx.moveTo(x, y); // Move without drawing
      } else if (cmd === '+') {
        currentAngle += angleRad;
      } else if (cmd === '-') {
        currentAngle -= angleRad;
      } else if (cmd === '[') {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        stack.push({ x, y, a: currentAngle, lw: currentLw, h: currentColorH });
        currentLw = Math.max(0.1, currentLw * thicknessDecay);
        currentColorH = (currentColorH + colorShift * 50) % 360;
        ctx.lineWidth = currentLw;
        ctx.strokeStyle = `hsl(${currentColorH}, 80%, 50%)`;
      } else if (cmd === ']') {
        ctx.stroke();
        ctx.beginPath();
        const state = stack.pop();
        if (state) {
          x = state.x;
          y = state.y;
          currentAngle = state.a;
          currentLw = state.lw;
          currentColorH = state.h;
          ctx.lineWidth = currentLw;
          ctx.strokeStyle = `hsl(${currentColorH}, 80%, 50%)`;
          ctx.moveTo(x, y); // Jump back
        }
      }

      if (i % 20000 === 0 && performance.now() - t0 > 16) {
        ctx.stroke();
        await new Promise((r) => setTimeout(r, 0));
        ctx.beginPath();
        ctx.lineWidth = currentLw;
        ctx.strokeStyle = `hsl(${currentColorH}, 80%, 50%)`;
        ctx.moveTo(x, y);
        t0 = performance.now();
      }
    }
    ctx.stroke();
    els.strLengthStat.textContent = currentString.length.toLocaleString();
  } else {
    // Animated Drawing
    let index = 0;

    // Speed scaling based on string length (to avoid 5 minute animations)
    const commandsPerFrame = Math.max(1, Math.floor(currentString.length / 300));

    ctx.beginPath();
    ctx.moveTo(x, y);

    const drawFrame = () => {
      let ops = 0;
      while (index < currentString.length && ops < commandsPerFrame) {
        const cmd = currentString[index];
        if (cmd === 'F' || cmd === 'G') {
          x += Math.cos(currentAngle) * step;
          y += Math.sin(currentAngle) * step;
          ctx.lineTo(x, y);
        } else if (cmd === 'f') {
          x += Math.cos(currentAngle) * step;
          y += Math.sin(currentAngle) * step;
          ctx.moveTo(x, y);
        } else if (cmd === '+') {
          currentAngle += angleRad;
        } else if (cmd === '-') {
          currentAngle -= angleRad;
        } else if (cmd === '[') {
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
          stack.push({ x, y, a: currentAngle, lw: currentLw, h: currentColorH });
          currentLw = Math.max(0.1, currentLw * thicknessDecay);
          currentColorH = (currentColorH + colorShift * 50) % 360;
          ctx.lineWidth = currentLw;
          ctx.strokeStyle = `hsl(${currentColorH}, 80%, 50%)`;
        } else if (cmd === ']') {
          ctx.stroke();
          ctx.beginPath();
          const state = stack.pop();
          if (state) {
            x = state.x;
            y = state.y;
            currentAngle = state.a;
            currentLw = state.lw;
            currentColorH = state.h;
            ctx.lineWidth = currentLw;
            ctx.strokeStyle = `hsl(${currentColorH}, 80%, 50%)`;
            ctx.moveTo(x, y);
          }
        }
        index++;

        // Only count actual drawing/moving ops towards speed limit to prevent stalling on brackets
        if (cmd === 'F' || cmd === 'G' || cmd === 'f') ops++;
      }

      ctx.stroke();
      ctx.beginPath(); // Prepare for next frame
      ctx.lineWidth = currentLw;
      ctx.strokeStyle = `hsl(${currentColorH}, 80%, 50%)`;
      ctx.moveTo(x, y);

      if (index < currentString.length) {
        animationId = requestAnimationFrame(drawFrame);
      }
    };

    animationId = requestAnimationFrame(drawFrame);
  }
}
