document.addEventListener('DOMContentLoaded', () => {
  initECC();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
let state = {
  a: -1,
  b: 1,
  p: 17,
  isModulo: false,

  points: {
    P: { x: 0, y: 1 },
    Q: { x: 2, y: -2 }, // In modulo, this might be adjusted
    R: null, // Result of P+Q
  },

  dragTarget: null, // 'P' or 'Q'

  // Canvas mapping
  scale: 40, // pixels per unit
  offsetX: 400, // center
  offsetY: 300,

  // Hacking state
  hackInterval: null,
  isHacking: false,
};

// DOM
const els = {
  cvs: document.getElementById('eccCanvas'),
  valA: document.getElementById('valA'),
  valB: document.getElementById('valB'),
  valP: document.getElementById('valP'),
  sliderA: document.getElementById('sliderA'),
  sliderB: document.getElementById('sliderB'),
  sliderP: document.getElementById('sliderP'),

  tglMod: document.getElementById('toggleModulo'),
  primeGrp: document.getElementById('primeGroup'),

  eqSlope: document.getElementById('eqSlope'),
  eqX3: document.getElementById('eqX3'),
  eqY3: document.getElementById('eqY3'),
  eqRes: document.getElementById('eqResult'),

  modInvBox: document.getElementById('modInvInspector'),
  modInvMath: document.getElementById('modInvMath'),

  tooltip: document.getElementById('coordTooltip'),

  btnReset: document.getElementById('btnReset'),
  btnDouble: document.getElementById('btnDouble'),
  btnHack: document.getElementById('btnHack'),

  tdP: document.getElementById('tdP'),
  tdQ: document.getElementById('tdQ'),
  hackStat: document.getElementById('hackStatus'),
  hackN: document.getElementById('hackN'),
  hackFill: document.getElementById('hackFill'),
  hackRes: document.getElementById('hackResult'),
};

let ctx;

// Primes for slider snapping
const PRIMES = [
  7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
];

// ==========================================
// 2. INITIALIZATION
// ==========================================
function initECC() {
  ctx = els.cvs.getContext('2d');

  // Bind controls
  els.sliderA.addEventListener('input', (e) => {
    state.a = parseInt(e.target.value);
    els.valA.textContent = state.a;
    validateAndRender();
  });

  els.sliderB.addEventListener('input', (e) => {
    state.b = parseInt(e.target.value);
    els.valB.textContent = state.b;
    validateAndRender();
  });

  els.sliderP.addEventListener('input', (e) => {
    // Snap to nearest prime
    const val = parseInt(e.target.value);
    let closest = PRIMES.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
    );
    state.p = closest;
    els.sliderP.value = closest;
    els.valP.textContent = state.p;

    // Adjust scale so the grid fits
    state.scale = Math.min(30, 800 / (state.p + 2));
    // Offset to bottom left corner for modulo
    state.offsetX = 50;
    state.offsetY = 550;

    validateAndRender();
  });

  els.tglMod.addEventListener('change', (e) => {
    state.isModulo = e.target.checked;
    els.primeGrp.style.opacity = state.isModulo ? '1' : '0.3';
    els.primeGrp.style.pointerEvents = state.isModulo ? 'auto' : 'none';

    if (state.isModulo) {
      state.scale = Math.min(30, 800 / (state.p + 2));
      state.offsetX = 50;
      state.offsetY = 550;
      els.modInvBox.style.display = 'block';
    } else {
      state.scale = 40;
      state.offsetX = 400;
      state.offsetY = 300;
      els.modInvBox.style.display = 'none';
    }

    // Find valid points for the new mode
    resetPoints();
  });

  els.btnReset.addEventListener('click', resetPoints);

  els.btnDouble.addEventListener('click', () => {
    state.points.Q = { x: state.points.P.x, y: state.points.P.y };
    validateAndRender();
  });

  els.btnHack.addEventListener('click', startTrapdoorRace);

  // Canvas interactions
  els.cvs.addEventListener('mousedown', handleMouseDown);
  els.cvs.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  resetPoints();
}

function resetPoints() {
  if (state.isModulo) {
    // Find two distinct valid points on the modulo curve
    const valid = getFiniteFieldPoints();
    if (valid.length >= 2) {
      state.points.P = valid[0];
      state.points.Q = valid[1];
    }
  } else {
    // Find point around x=0
    const y0 = Math.sqrt(0 + state.a * 0 + state.b);
    if (!isNaN(y0)) {
      state.points.P = { x: 0, y: y0 };
    } else {
      state.points.P = { x: 2, y: Math.sqrt(8 + 2 * state.a + state.b) }; // Fallback
    }
    state.points.Q = { x: 3, y: Math.sqrt(27 + 3 * state.a + state.b) };
  }
  validateAndRender();
}

// ==========================================
// 3. MATH ENGINE (CONTINUOUS & MODULO)
// ==========================================

function getFiniteFieldPoints() {
  const points = [];
  for (let x = 0; x < state.p; x++) {
    const rhs = mod(Math.pow(x, 3) + state.a * x + state.b, state.p);
    // Check for quadratic residue
    for (let y = 0; y < state.p; y++) {
      if (mod(y * y, state.p) === rhs) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

// True mathematical modulo (handles negative numbers)
function mod(n, p) {
  return ((n % p) + p) % p;
}

// Extended Euclidean Algorithm to find modular multiplicative inverse
function modInverse(a, m) {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x;
  }
  return null; // Should not happen for prime fields unless a=0
}

function calculateAddition() {
  const P = state.points.P;
  const Q = state.points.Q;
  let R = null;
  let mStr = '',
    x3Str = '',
    y3Str = '',
    invStr = '';

  // Check if points are valid on curve (approx for continuous, exact for mod)

  if (state.isModulo) {
    // Modulo Arithmetic
    if (P.x === Q.x && mod(P.y + Q.y, state.p) === 0) {
      // Point at infinity
      R = null; // Infinity
      mStr = 'm = ∞ (Vertical Line)';
      x3Str = 'x₃ = ∞';
      y3Str = 'y₃ = ∞';
    } else {
      let m;
      let dy, dx, invDx;
      if (P.x === Q.x && P.y === Q.y) {
        // Tangent (Point Doubling)
        dy = mod(3 * Math.pow(P.x, 2) + state.a, state.p);
        dx = mod(2 * P.y, state.p);
        invDx = modInverse(dx, state.p);
        m = mod(dy * invDx, state.p);
        mStr = `m = (3(${P.x})² + ${state.a}) / (2(${P.y})) mod ${state.p} = ${dy} * ${invDx} = ${m}`;
        invStr = `Inverse of ${dx} mod ${state.p} is ${invDx} (since ${dx}*${invDx} ≡ 1 mod ${state.p})`;
      } else {
        // Secant
        dy = mod(Q.y - P.y, state.p);
        dx = mod(Q.x - P.x, state.p);
        invDx = modInverse(dx, state.p);
        m = mod(dy * invDx, state.p);
        mStr = `m = (${Q.y} - ${P.y}) / (${Q.x} - ${P.x}) mod ${state.p} = ${dy} * ${invDx} = ${m}`;
        invStr = `Inverse of ${dx} mod ${state.p} is ${invDx} (since ${dx}*${invDx} ≡ 1 mod ${state.p})`;
      }

      const x3 = mod(Math.pow(m, 2) - P.x - Q.x, state.p);
      const y3 = mod(m * (P.x - x3) - P.y, state.p);

      x3Str = `x₃ = ${m}² - ${P.x} - ${Q.x} mod ${state.p} = ${x3}`;
      y3Str = `y₃ = ${m}(${P.x} - ${x3}) - ${P.y} mod ${state.p} = ${y3}`;

      R = { x: x3, y: y3 };
    }
  } else {
    // Continuous Arithmetic
    // In continuous mode, if P is close to Q, we snap them to simulate doubling
    let isDoubling = false;
    if (Math.abs(P.x - Q.x) < 0.2 && Math.abs(P.y - Q.y) < 0.2) {
      isDoubling = true;
      Q.x = P.x;
      Q.y = P.y;
    }

    if (Math.abs(P.x - Q.x) < 0.01 && !isDoubling) {
      R = null; // Vertical line
      mStr = 'm = ∞ (Vertical Line)';
      x3Str = 'x₃ = ∞';
      y3Str = 'y₃ = ∞';
    } else {
      let m;
      if (isDoubling) {
        m = (3 * Math.pow(P.x, 2) + state.a) / (2 * P.y);
        mStr = `m = (3(${P.x.toFixed(2)})² + ${state.a}) / (2(${P.y.toFixed(2)})) = ${m.toFixed(2)}`;
      } else {
        m = (Q.y - P.y) / (Q.x - P.x);
        mStr = `m = (${Q.y.toFixed(2)} - ${P.y.toFixed(2)}) / (${Q.x.toFixed(2)} - ${P.x.toFixed(2)}) = ${m.toFixed(2)}`;
      }

      const x3 = Math.pow(m, 2) - P.x - Q.x;
      const y3 = m * (P.x - x3) - P.y;

      x3Str = `x₃ = ${m.toFixed(2)}² - ${P.x.toFixed(2)} - ${Q.x.toFixed(2)} = ${x3.toFixed(2)}`;
      y3Str = `y₃ = ${m.toFixed(2)}(${P.x.toFixed(2)} - ${x3.toFixed(2)}) - ${P.y.toFixed(2)} = ${y3.toFixed(2)}`;

      R = { x: x3, y: y3 };
    }
  }

  state.points.R = R;

  // Update UI
  els.eqSlope.textContent = mStr;
  els.eqX3.textContent = x3Str;
  els.eqY3.textContent = y3Str;

  if (R) {
    els.eqRes.textContent = `R = (${R.x.toFixed(state.isModulo ? 0 : 2)}, ${R.y.toFixed(state.isModulo ? 0 : 2)})`;
  } else {
    els.eqRes.textContent = `R = Point at Infinity (O)`;
  }

  els.modInvMath.textContent = invStr;
}

// ==========================================
// 4. RENDERING ENGINE
// ==========================================
function toScr(x, y) {
  return {
    sx: state.offsetX + x * state.scale,
    sy: state.offsetY - y * state.scale,
  };
}

function fromScr(sx, sy) {
  return {
    x: (sx - state.offsetX) / state.scale,
    y: (state.offsetY - sy) / state.scale,
  };
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  if (state.isModulo) {
    // Draw grid bounding box for Prime
    for (let i = 0; i <= state.p; i++) {
      const p1 = toScr(i, 0);
      const p2 = toScr(i, state.p);
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);

      const p3 = toScr(0, i);
      const p4 = toScr(state.p, i);
      ctx.moveTo(p3.sx, p3.sy);
      ctx.lineTo(p4.sx, p4.sy);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    const o = toScr(0, 0);
    const pMax = toScr(state.p, state.p);
    ctx.beginPath();
    ctx.moveTo(o.sx, o.sy);
    ctx.lineTo(pMax.sx, o.sy); // X
    ctx.moveTo(o.sx, o.sy);
    ctx.lineTo(o.sx, pMax.sy); // Y
    ctx.stroke();
  } else {
    // Cartesian grid
    const w = els.cvs.width;
    const h = els.cvs.height;
    ctx.moveTo(0, state.offsetY);
    ctx.lineTo(w, state.offsetY); // X axis
    ctx.moveTo(state.offsetX, 0);
    ctx.lineTo(state.offsetX, h); // Y axis
    ctx.stroke();
  }
}

function drawContinuousCurve() {
  ctx.strokeStyle = 'var(--ecc-curve)';
  ctx.lineWidth = 2;
  ctx.beginPath();

  // Draw upper and lower halves
  const steps = 400;
  const startX = -10;
  const endX = 15;

  let startedUpper = false;
  let startedLower = false;

  for (let i = 0; i <= steps; i++) {
    const x = startX + (endX - startX) * (i / steps);
    const rhs = Math.pow(x, 3) + state.a * x + state.b;

    if (rhs >= 0) {
      const y = Math.sqrt(rhs);
      const pUp = toScr(x, y);
      if (!startedUpper) {
        ctx.moveTo(pUp.sx, pUp.sy);
        startedUpper = true;
      } else {
        ctx.lineTo(pUp.sx, pUp.sy);
      }
    } else {
      startedUpper = false;
    }
  }
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = startX + (endX - startX) * (i / steps);
    const rhs = Math.pow(x, 3) + state.a * x + state.b;

    if (rhs >= 0) {
      const y = -Math.sqrt(rhs);
      const pDn = toScr(x, y);
      if (!startedLower) {
        ctx.moveTo(pDn.sx, pDn.sy);
        startedLower = true;
      } else {
        ctx.lineTo(pDn.sx, pDn.sy);
      }
    } else {
      startedLower = false;
    }
  }
  ctx.stroke();
}

function drawFiniteFieldPoints() {
  const points = getFiniteFieldPoints();

  ctx.fillStyle = 'var(--ecc-curve)';
  points.forEach((pt) => {
    const p = toScr(pt.x, pt.y);
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawAdditionGeom() {
  const P = state.points.P;
  const Q = state.points.Q;
  const R = state.points.R;

  // Draw Secant Line
  if (R) {
    ctx.strokeStyle = 'var(--ecc-danger)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (state.isModulo) {
      // Draw wrap-around line? Very hard to draw exact toroidal wrap.
      // We'll just draw a line connecting P, Q, and the "unwrapped" R, or just highlight R
      const pS = toScr(P.x, P.y);
      const qS = toScr(Q.x, Q.y);
      ctx.beginPath();
      ctx.moveTo(pS.sx, pS.sy);
      ctx.lineTo(qS.sx, qS.sy);
      ctx.stroke();

      // Draw vertical reflection line
      ctx.strokeStyle = 'var(--ecc-success)';
      const rS = toScr(R.x, R.y);
      const negRS = toScr(R.x, mod(-R.y, state.p));
      ctx.beginPath();
      ctx.moveTo(rS.sx, rS.sy);
      ctx.lineTo(negRS.sx, negRS.sy);
      ctx.stroke();
    } else {
      // Continuous straight line passing through P and Q extended
      const m = Q.x === P.x ? (3 * P.x * P.x + state.a) / (2 * P.y) : (Q.y - P.y) / (Q.x - P.x);
      // Draw line across screen
      const xLeft = -10;
      const yLeft = P.y + m * (xLeft - P.x);
      const xRight = 15;
      const yRight = P.y + m * (xRight - P.x);

      const pL = toScr(xLeft, yLeft);
      const pR = toScr(xRight, yRight);

      ctx.beginPath();
      ctx.moveTo(pL.sx, pL.sy);
      ctx.lineTo(pR.sx, pR.sy);
      ctx.stroke();

      // Draw reflection vertical line
      ctx.strokeStyle = 'var(--ecc-success)';
      const rS = toScr(R.x, R.y);
      const negRS = toScr(R.x, -R.y);
      ctx.beginPath();
      ctx.moveTo(rS.sx, rS.sy);
      ctx.lineTo(negRS.sx, negRS.sy);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Draw Points
  drawPoint(P, 'var(--ecc-primary)', 'P');
  if (P.x !== Q.x || P.y !== Q.y) drawPoint(Q, 'var(--ecc-warning)', 'Q');
  if (R) {
    // Draw -R
    if (state.isModulo) {
      drawPoint({ x: R.x, y: mod(-R.y, state.p) }, 'rgba(16, 185, 129, 0.4)', '-R');
    } else {
      drawPoint({ x: R.x, y: -R.y }, 'rgba(16, 185, 129, 0.4)', '-R');
    }
    // Draw R
    drawPoint(R, 'var(--ecc-success)', 'R = P+Q');
  }
}

function drawPoint(pt, color, label) {
  const s = toScr(pt.x, pt.y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(s.sx, s.sy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = '12px Orbitron';
  ctx.fillText(label, s.sx + 10, s.sy - 10);
}

function validateAndRender() {
  calculateAddition();

  ctx.clearRect(0, 0, els.cvs.width, els.cvs.height);
  drawGrid();

  if (state.isModulo) {
    drawFiniteFieldPoints();
  } else {
    drawContinuousCurve();
  }

  drawAdditionGeom();
}

// ==========================================
// 5. INTERACTION LOGIC
// ==========================================
function getDist(pt1, pt2) {
  return Math.sqrt(Math.pow(pt1.sx - pt2.sx, 2) + Math.pow(pt1.sy - pt2.sy, 2));
}

function handleMouseDown(e) {
  const rect = els.cvs.getBoundingClientRect();
  const mouse = { sx: e.clientX - rect.left, sy: e.clientY - rect.top };

  const pS = toScr(state.points.P.x, state.points.P.y);
  const qS = toScr(state.points.Q.x, state.points.Q.y);

  if (getDist(mouse, pS) < 15) state.dragTarget = 'P';
  else if (getDist(mouse, qS) < 15) state.dragTarget = 'Q';
}

function handleMouseMove(e) {
  const rect = els.cvs.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;

  // Tooltip
  const pos = fromScr(sx, sy);
  els.tooltip.textContent = `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`;
  els.tooltip.style.left = `${e.clientX + 10}px`;
  els.tooltip.style.top = `${e.clientY + 10}px`;
  els.tooltip.classList.add('visible');

  if (!state.dragTarget) return;

  if (state.isModulo) {
    // Snap to nearest valid finite field point
    const valid = getFiniteFieldPoints();
    let closest = valid[0];
    let minDist = Infinity;
    valid.forEach((pt) => {
      const ptS = toScr(pt.x, pt.y);
      const dist = Math.sqrt(Math.pow(ptS.sx - sx, 2) + Math.pow(ptS.sy - sy, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = pt;
      }
    });
    state.points[state.dragTarget] = closest;
  } else {
    // Continuous: snap to curve. For a given X, calculate Y
    let newX = pos.x;
    const rhs = Math.pow(newX, 3) + state.a * newX + state.b;
    if (rhs >= 0) {
      let newY = Math.sqrt(rhs);
      if (pos.y < 0) newY = -newY;
      state.points[state.dragTarget] = { x: newX, y: newY };
    }
  }

  validateAndRender();
}

function handleMouseUp() {
  state.dragTarget = null;
}

els.cvs.addEventListener('mouseout', () => {
  state.dragTarget = null;
  els.tooltip.classList.remove('visible');
});

// ==========================================
// 6. TRAPDOOR RACE SIMULATOR
// ==========================================
// Q = n * P. Hacker tries to find n.

async function startTrapdoorRace() {
  if (state.isHacking) return;
  state.isHacking = true;

  // Setup a small prime for demo, e.g. p=97
  els.sliderP.value = 97;
  els.sliderP.dispatchEvent(new Event('input'));
  if (!state.isModulo) els.tglMod.click();

  await sleep(500); // let UI update

  const P = getFiniteFieldPoints()[0];
  els.tdP.textContent = `(${P.x}, ${P.y})`;

  // Pick a secret n
  const secretN = Math.floor(Math.random() * 50) + 20;

  // Instantly calculate Q = nP using double-and-add (we'll just use our addition logic iteratively for simplicity here since n is small)
  let Q = { x: P.x, y: P.y };
  for (let i = 2; i <= secretN; i++) {
    state.points.P = Q;
    state.points.Q = P;
    calculateAddition(); // sets R
    Q = state.points.R;
    if (!Q) break; // hit infinity
  }

  els.tdQ.textContent = `(${Q.x}, ${Q.y})`;

  els.hackStat.style.display = 'block';
  els.hackRes.textContent = 'Brute Forcing...';
  els.hackRes.className = 'text-xs mt-1 text-center font-fira text-warning';

  let currentN = 1;
  let testQ = { x: P.x, y: P.y };

  // Visual hacking loop
  state.hackInterval = setInterval(() => {
    els.hackN.textContent = currentN;
    els.hackFill.style.width = `${(currentN / 97) * 100}%`;

    // Add P to testQ
    state.points.P = testQ;
    state.points.Q = P;
    calculateAddition();
    testQ = state.points.R;

    validateAndRender(); // physically animate the point jumping!

    if (!testQ || (testQ.x === Q.x && testQ.y === Q.y) || currentN > 97) {
      clearInterval(state.hackInterval);
      els.hackRes.textContent = `Hacked! Secret n = ${currentN + 1}`;
      els.hackRes.className = 'text-xs mt-1 text-center font-fira text-success';
      state.isHacking = false;
    }

    currentN++;
  }, 100);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
