/**
 * bezier-curve.js
 * Interactive Bézier Curve & De Casteljau Algorithm Sandbox
 */

document.addEventListener('DOMContentLoaded', () => {
  initBezierVisualizer();
});

// Presets for control points (normalized coordinates 0 to 1)
const PRESETS = {
  quadratic: [
    { x: 0.15, y: 0.8 },
    { x: 0.5, y: 0.15 },
    { x: 0.85, y: 0.8 },
  ],
  cubic: [
    { x: 0.15, y: 0.75 },
    { x: 0.35, y: 0.2 },
    { x: 0.65, y: 0.85 },
    { x: 0.85, y: 0.25 },
  ],
  scurve: [
    { x: 0.15, y: 0.2 },
    { x: 0.4, y: 0.9 },
    { x: 0.6, y: 0.1 },
    { x: 0.85, y: 0.8 },
  ],
  loop: [
    { x: 0.2, y: 0.7 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.7 },
  ],
  fontGlyph: [
    { x: 0.2, y: 0.85 },
    { x: 0.2, y: 0.15 },
    { x: 0.8, y: 0.15 },
    { x: 0.8, y: 0.5 },
    { x: 0.5, y: 0.5 },
  ],
};

const els = {
  canvas: document.getElementById('bezierCanvas'),
  wrapper: document.getElementById('canvasWrapper'),
  presetSelect: document.getElementById('presetSelect'),
  tSlider: document.getElementById('tSlider'),
  tVal: document.getElementById('tVal'),
  speedSlider: document.getElementById('speedSlider'),
  speedVal: document.getElementById('speedVal'),
  showDeCasteljauToggle: document.getElementById('showDeCasteljauToggle'),
  showPolygonToggle: document.getElementById('showPolygonToggle'),
  showTangentsToggle: document.getElementById('showTangentsToggle'),
  animateBtn: document.getElementById('animateTBtn'),
  addPointBtn: document.getElementById('addPointBtn'),
  resetBtn: document.getElementById('resetBtn'),
  pointCountStat: document.getElementById('pointCountStat'),
  degreeStat: document.getElementById('degreeStat'),
};

let ctx;
let points = [];
let draggingPointIdx = -1;
let animId = null;
let isAnimating = false;

function initBezierVisualizer() {
  ctx = els.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  bindEvents();
  loadPreset('cubic');
}

function resizeCanvas() {
  const rect = els.wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  els.canvas.width = rect.width * dpr;
  els.canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  render();
}

function bindEvents() {
  els.presetSelect.addEventListener('change', (e) => {
    if (e.target.value !== 'custom') {
      loadPreset(e.target.value);
    }
  });

  els.tSlider.addEventListener('input', (e) => {
    els.tVal.textContent = parseFloat(e.target.value).toFixed(2);
    render();
  });

  els.speedSlider.addEventListener('input', (e) => {
    els.speedVal.textContent = parseFloat(e.target.value).toFixed(1) + 'x';
  });

  els.showDeCasteljauToggle.addEventListener('change', render);
  els.showPolygonToggle.addEventListener('change', render);
  els.showTangentsToggle.addEventListener('change', render);

  els.animateBtn.addEventListener('click', toggleAnimation);

  els.addPointBtn.addEventListener('click', () => {
    const rect = els.wrapper.getBoundingClientRect();
    // Add point near center
    const lastPt = points[points.length - 1] || { x: rect.width / 2, y: rect.height / 2 };
    points.push({
      x: Math.min(rect.width - 40, lastPt.x + 50),
      y: Math.max(40, lastPt.y - 30),
    });
    els.presetSelect.value = 'custom';
    updateStats();
    render();
  });

  els.resetBtn.addEventListener('click', () => {
    if (isAnimating) stopAnimation();
    loadPreset(els.presetSelect.value === 'custom' ? 'cubic' : els.presetSelect.value);
  });

  // Canvas Interactions
  els.canvas.addEventListener('mousedown', handleMouseDown);
  els.canvas.addEventListener('mousemove', handleMouseMove);
  els.canvas.addEventListener('mouseup', handleMouseUp);
  els.canvas.addEventListener('dblclick', handleDoubleClick);
}

function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;

  const rect = els.wrapper.getBoundingClientRect();
  points = preset.map((p) => ({
    x: p.x * rect.width,
    y: p.y * rect.height,
  }));

  updateStats();
  render();
}

function updateStats() {
  els.pointCountStat.textContent = points.length;
  const degree = points.length - 1;
  const degreeNames = ['Constant', 'Linear', 'Quadratic', 'Cubic', 'Quartic', 'Quintic'];
  const name = degreeNames[degree] || `${degree}-th Degree`;
  els.degreeStat.textContent = `${degree} (${name})`;
}

// ==========================================
// INTERACTION HANDLERS
// ==========================================

function getCanvasCoords(e) {
  const rect = els.canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function handleMouseDown(e) {
  const mouse = getCanvasCoords(e);
  const hitRadius = 15;

  for (let i = 0; i < points.length; i++) {
    const dx = points[i].x - mouse.x;
    const dy = points[i].y - mouse.y;
    if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
      draggingPointIdx = i;
      return;
    }
  }
}

function handleMouseMove(e) {
  if (draggingPointIdx !== -1) {
    const mouse = getCanvasCoords(e);
    const rect = els.wrapper.getBoundingClientRect();

    // Clamp to canvas padding
    points[draggingPointIdx].x = Math.max(15, Math.min(rect.width - 15, mouse.x));
    points[draggingPointIdx].y = Math.max(15, Math.min(rect.height - 15, mouse.y));

    els.presetSelect.value = 'custom';
    render();
  }
}

function handleMouseUp() {
  draggingPointIdx = -1;
}

function handleDoubleClick(e) {
  const mouse = getCanvasCoords(e);
  const hitRadius = 15;

  for (let i = 0; i < points.length; i++) {
    const dx = points[i].x - mouse.x;
    const dy = points[i].y - mouse.y;
    if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
      if (points.length > 2) {
        points.splice(i, 1);
        els.presetSelect.value = 'custom';
        updateStats();
        render();
      }
      return;
    }
  }
}

// ==========================================
// DE CASTELJAU ALGORITHM & RENDERING
// ==========================================

function deCasteljau(pts, t) {
  // Returns array of intermediate levels of points
  const levels = [pts];
  let current = pts;

  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];
      next.push({
        x: (1 - t) * p0.x + t * p1.x,
        y: (1 - t) * p0.y + t * p1.y,
      });
    }
    levels.push(next);
    current = next;
  }

  return levels;
}

function render() {
  const rect = els.wrapper.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  if (points.length < 2) return;

  const t = parseFloat(els.tSlider.value);
  const levels = deCasteljau(points, t);

  // 1. Draw Control Polygon
  if (els.showPolygonToggle.checked) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2. Draw Full Bézier Curve
  ctx.beginPath();
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const sampleT = i / steps;
    const sampleLevels = deCasteljau(points, sampleT);
    const curvePt = sampleLevels[sampleLevels.length - 1][0];
    if (i === 0) {
      ctx.moveTo(curvePt.x, curvePt.y);
    } else {
      ctx.lineTo(curvePt.x, curvePt.y);
    }
  }
  ctx.strokeStyle = '#3b82f6'; // Neon Blue
  ctx.lineWidth = 3;
  ctx.stroke();

  // 3. Draw De Casteljau Intermediate Constructions
  if (els.showDeCasteljauToggle.checked && levels.length > 1) {
    const levelColors = [
      'rgba(245, 158, 11, 0.7)', // Orange
      'rgba(16, 185, 129, 0.7)', // Green
      'rgba(168, 85, 247, 0.7)', // Purple
      'rgba(236, 72, 153, 0.7)', // Pink
      'rgba(14, 165, 233, 0.7)', // Light Blue
    ];

    for (let l = 1; l < levels.length - 1; l++) {
      const lvlPts = levels[l];
      const color = levelColors[(l - 1) % levelColors.length];

      // Draw construction lines
      ctx.beginPath();
      ctx.moveTo(lvlPts[0].x, lvlPts[0].y);
      for (let i = 1; i < lvlPts.length; i++) {
        ctx.lineTo(lvlPts[i].x, lvlPts[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw intermediate dots
      for (const pt of lvlPts) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  }

  // 4. Draw Tangent Vector
  const finalPt = levels[levels.length - 1][0];
  if (els.showTangentsToggle.checked && levels.length >= 2) {
    const penultLvl = levels[levels.length - 2];
    if (penultLvl.length >= 2) {
      const dx = penultLvl[1].x - penultLvl[0].x;
      const dy = penultLvl[1].y - penultLvl[0].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const normX = (dx / len) * 50;
        const normY = (dy / len) * 50;

        ctx.beginPath();
        ctx.moveTo(finalPt.x, finalPt.y);
        ctx.lineTo(finalPt.x + normX, finalPt.y + normY);
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(normY, normX);
        ctx.beginPath();
        ctx.moveTo(finalPt.x + normX, finalPt.y + normY);
        ctx.lineTo(
          finalPt.x + normX - 10 * Math.cos(angle - Math.PI / 6),
          finalPt.y + normY - 10 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          finalPt.x + normX - 10 * Math.cos(angle + Math.PI / 6),
          finalPt.y + normY - 10 * Math.sin(angle + Math.PI / 6)
        );
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      }
    }
  }

  // 5. Draw Final Point on Curve
  ctx.beginPath();
  ctx.arc(finalPt.x, finalPt.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981'; // Green accent
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#10b981';
  ctx.fill();
  ctx.shadowBlur = 0;

  // 6. Draw Control Points & Handles
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = i === draggingPointIdx ? '#ec4899' : '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Label P0, P1, P2...
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Fira Code", monospace';
    ctx.fillText(`P${i}`, pt.x + 12, pt.y - 12);
  }
}

// ==========================================
// ANIMATION LOGIC
// ==========================================

function toggleAnimation() {
  if (isAnimating) {
    stopAnimation();
  } else {
    startAnimation();
  }
}

function startAnimation() {
  isAnimating = true;
  els.animateBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
  els.animateBtn.classList.remove('btn-primary');
  els.animateBtn.classList.add('btn-outline');

  let currentT = parseFloat(els.tSlider.value);
  if (currentT >= 1) currentT = 0;

  let lastTimestamp = performance.now();

  function step(timestamp) {
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    const speed = parseFloat(els.speedSlider.value);
    currentT += dt * 0.3 * speed;

    if (currentT >= 1) {
      currentT = 1;
      els.tSlider.value = currentT;
      els.tVal.textContent = '1.00';
      render();
      stopAnimation();
      return;
    }

    els.tSlider.value = currentT;
    els.tVal.textContent = currentT.toFixed(2);
    render();

    animId = requestAnimationFrame(step);
  }

  animId = requestAnimationFrame(step);
}

function stopAnimation() {
  isAnimating = false;
  if (animId) cancelAnimationFrame(animId);
  els.animateBtn.innerHTML = '<i class="fas fa-play"></i> Animate (t)';
  els.animateBtn.classList.remove('btn-outline');
  els.animateBtn.classList.add('btn-primary');
}
