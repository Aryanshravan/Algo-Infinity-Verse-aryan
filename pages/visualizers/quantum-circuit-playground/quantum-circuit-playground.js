document.addEventListener('DOMContentLoaded', () => {
  initQuantumCircuit();
});

// ==========================================
// 1. STATE & CONSTANTS (MATH ENGINE)
// ==========================================
// A 2-qubit system is described by a 4x1 column vector: [|00>, |01>, |10>, |11>]
// We use simple arrays of complex numbers. For this educational visualizer, we
// stick to real numbers to make the matrix multiplication simpler to digest,
// as real amplitudes are sufficient for H, X, CX, and Measure.

let stateVector = [1, 0, 0, 0]; // |00>

// Circuit representation: 2 wires, 5 slots.
// Null = no gate. 'H', 'X', 'CNOT', 'M'
let circuit = [
  [null, null, null, null, null], // Q0
  [null, null, null, null, null], // Q1
];

// Matrices (Real numbers)
const I = [
  [1, 0],
  [0, 1],
];
const H = [
  [1 / Math.SQRT2, 1 / Math.SQRT2],
  [1 / Math.SQRT2, -1 / Math.SQRT2],
];
const X = [
  [0, 1],
  [1, 0],
];
const CX = [
  // Control=Q0, Target=Q1 (in |q0q1> ordering)
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 1],
  [0, 0, 1, 0],
];

// DOM
const els = {
  draggables: document.querySelectorAll('.q-gate'),
  slots: document.querySelectorAll('.gate-slot'),
  btnClear: document.getElementById('btnClear'),
  btnTutSuper: document.getElementById('btnTutSuper'),
  btnTutBell: document.getElementById('btnTutBell'),

  vec0: document.getElementById('vec0'),
  vec1: document.getElementById('vec1'),
  bs0: document.getElementById('bs0'),
  bs1: document.getElementById('bs1'),

  mathVector: document.getElementById('mathVector'),
  entAlert: document.getElementById('entAlert'),

  probs: {
    '00': { bar: document.getElementById('prob00'), val: document.getElementById('val00') },
    '01': { bar: document.getElementById('prob01'), val: document.getElementById('val01') },
    10: { bar: document.getElementById('prob10'), val: document.getElementById('val10') },
    11: { bar: document.getElementById('prob11'), val: document.getElementById('val11') },
  },
};

// ==========================================
// 2. INITIALIZATION & DRAG-AND-DROP
// ==========================================
function initQuantumCircuit() {
  // Drag start
  els.draggables.forEach((gate) => {
    gate.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', gate.dataset.type);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  // Drop zones
  els.slots.forEach((slot) => {
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');

      const gateType = e.dataTransfer.getData('text/plain');
      const wire = parseInt(slot.dataset.wire);
      const col = parseInt(slot.dataset.col);

      placeGate(gateType, wire, col, slot);
    });

    // Remove gate on click
    slot.addEventListener('click', () => {
      if (slot.innerHTML !== '') {
        const wire = parseInt(slot.dataset.wire);
        const col = parseInt(slot.dataset.col);
        circuit[wire][col] = null;
        slot.innerHTML = '';
        evaluateCircuit();
      }
    });
  });

  els.btnClear.addEventListener('click', clearCircuit);
  els.btnTutSuper.addEventListener('click', () => {
    clearCircuit();
    placeGate('H', 0, 0, document.querySelector('.gate-slot[data-wire="0"][data-col="0"]'));
  });
  els.btnTutBell.addEventListener('click', () => {
    clearCircuit();
    placeGate('H', 0, 0, document.querySelector('.gate-slot[data-wire="0"][data-col="0"]'));
    placeGate('CNOT', 0, 1, document.querySelector('.gate-slot[data-wire="0"][data-col="1"]'));
  });

  evaluateCircuit(); // Initial draw
}

function placeGate(type, wire, col, slotDOM) {
  if (type === 'CNOT') {
    // CNOT takes up both wires. For visualizer simplicity, we force CNOT control to always be Q0
    if (wire !== 0) {
      logMsg('CNOT must be placed on Q0 (Control).', 'warning');
      return;
    }
    circuit[0][col] = 'CNOT_C';
    circuit[1][col] = 'CNOT_T';

    slotDOM.innerHTML =
      '<div class="q-gate gate-cnot" style="position:static; width:100%; height:100%">CX</div>';
    const targetSlot = document.querySelector(`.gate-slot[data-wire="1"][data-col="${col}"]`);
    targetSlot.innerHTML =
      '<div class="q-gate gate-cnot" style="position:static; width:100%; height:100%; border-style:dashed">⊕</div>';
  } else {
    // Clear if CNOT was there
    if (circuit[wire][col] && circuit[wire][col].startsWith('CNOT')) {
      circuit[0][col] = null;
      circuit[1][col] = null;
      document.querySelector(`.gate-slot[data-wire="0"][data-col="${col}"]`).innerHTML = '';
      document.querySelector(`.gate-slot[data-wire="1"][data-col="${col}"]`).innerHTML = '';
    }

    circuit[wire][col] = type;
    const colorClass = type === 'H' ? 'gate-h' : type === 'X' ? 'gate-x' : 'gate-m';
    slotDOM.innerHTML = `<div class="q-gate ${colorClass}" style="position:static; width:100%; height:100%">${type}</div>`;
  }

  evaluateCircuit();
}

function clearCircuit() {
  circuit = [
    [null, null, null, null, null],
    [null, null, null, null, null],
  ];
  els.slots.forEach((s) => (s.innerHTML = ''));
  evaluateCircuit();
}

// ==========================================
// 3. MATRIX MATH ENGINE
// ==========================================
function tensorProduct(A, B) {
  // 2x2 kron 2x2 = 4x4
  let C = [];
  for (let i = 0; i < 4; i++) {
    C.push(new Array(4).fill(0));
    for (let j = 0; j < 4; j++) {
      C[i][j] = A[Math.floor(i / 2)][Math.floor(j / 2)] * B[i % 2][j % 2];
    }
  }
  return C;
}

function multiplyMatrixVector(M, V) {
  let result = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i] += M[i][j] * V[j];
    }
  }
  return result;
}

function evaluateCircuit() {
  // Reset global state
  stateVector = [1, 0, 0, 0]; // |00>

  // Evaluate column by column
  for (let col = 0; col < 5; col++) {
    const g0 = circuit[0][col];
    const g1 = circuit[1][col];

    if (g0 === 'CNOT_C') {
      stateVector = multiplyMatrixVector(CX, stateVector);
      continue;
    }

    // Single qubit gates
    let m0 = I;
    let m1 = I;

    if (g0 === 'H') m0 = H;
    if (g0 === 'X') m0 = X;

    if (g1 === 'H') m1 = H;
    if (g1 === 'X') m1 = X;

    // Measurement triggers probabilistic collapse
    if (g0 === 'M' || g1 === 'M') {
      collapseState(g0 === 'M', g1 === 'M');
      continue;
    }

    if (m0 !== I || m1 !== I) {
      const combinedOperator = tensorProduct(m0, m1);
      stateVector = multiplyMatrixVector(combinedOperator, stateVector);
    }
  }

  updateUI();
}

function collapseState(meas0, meas1) {
  // Calculate probabilities
  const p00 = stateVector[0] * stateVector[0];
  const p01 = stateVector[1] * stateVector[1];
  const p10 = stateVector[2] * stateVector[2];
  const p11 = stateVector[3] * stateVector[3];

  const probQ0_is_1 = p10 + p11;
  const probQ1_is_1 = p01 + p11;

  const rand = Math.random();

  if (meas0 && meas1) {
    // Measure both
    if (rand < p00) stateVector = [1, 0, 0, 0];
    else if (rand < p00 + p01) stateVector = [0, 1, 0, 0];
    else if (rand < p00 + p01 + p10) stateVector = [0, 0, 1, 0];
    else stateVector = [0, 0, 0, 1];
  } else if (meas0) {
    if (rand < probQ0_is_1) {
      // Q0 collapsed to 1. Zero out the Q0=0 states, normalize the rest
      const norm = Math.sqrt(p10 + p11);
      stateVector = [0, 0, stateVector[2] / norm, stateVector[3] / norm];
    } else {
      // Q0 collapsed to 0
      const norm = Math.sqrt(p00 + p01);
      stateVector = [stateVector[0] / norm, stateVector[1] / norm, 0, 0];
    }
  } else if (meas1) {
    if (rand < probQ1_is_1) {
      // Q1 collapsed to 1
      const norm = Math.sqrt(p01 + p11);
      stateVector = [0, stateVector[1] / norm, 0, stateVector[3] / norm];
    } else {
      // Q1 collapsed to 0
      const norm = Math.sqrt(p00 + p10);
      stateVector = [stateVector[0] / norm, 0, stateVector[2] / norm, 0];
    }
  }
}

// ==========================================
// 4. UI RENDERER & BLOCH SPHERES
// ==========================================
function updateUI() {
  // Probabilities
  const p00 = (stateVector[0] * stateVector[0] * 100).toFixed(0);
  const p01 = (stateVector[1] * stateVector[1] * 100).toFixed(0);
  const p10 = (stateVector[2] * stateVector[2] * 100).toFixed(0);
  const p11 = (stateVector[3] * stateVector[3] * 100).toFixed(0);

  els.probs['00'].val.textContent = `${p00}%`;
  els.probs['00'].bar.style.width = `${p00}%`;
  els.probs['01'].val.textContent = `${p01}%`;
  els.probs['01'].bar.style.width = `${p01}%`;
  els.probs['10'].val.textContent = `${p10}%`;
  els.probs['10'].bar.style.width = `${p10}%`;
  els.probs['11'].val.textContent = `${p11}%`;
  els.probs['11'].bar.style.width = `${p11}%`;

  // Text Vector
  els.mathVector.innerHTML = `|ψ⟩ = <br>
      [ ${stateVector[0].toFixed(2)} ] |00⟩<br>
      [ ${stateVector[1].toFixed(2)} ] |01⟩<br>
      [ ${stateVector[2].toFixed(2)} ] |10⟩<br>
      [ ${stateVector[3].toFixed(2)} ] |11⟩
    `;

  // Check Entanglement (Are they separable?)
  // A state is separable if a*d == b*c  (stateVector[0]*stateVector[3] == stateVector[1]*stateVector[2])
  const ad = stateVector[0] * stateVector[3];
  const bc = stateVector[1] * stateVector[2];
  const isEntangled = Math.abs(ad - bc) > 0.01;

  if (isEntangled) {
    els.entAlert.style.display = 'block';
    els.bs0.classList.add('entangled');
    els.bs1.classList.add('entangled');
    // Visual hack for entangled Bloch spheres: point them rapidly spinning or locked together
    els.vec0.style.transform = `translate(-50%, 0) rotateX(90deg) rotateZ(45deg)`;
    els.vec0.style.boxShadow = `0 0 15px var(--qc-warning)`;

    els.vec1.style.transform = `translate(-50%, 0) rotateX(90deg) rotateZ(45deg)`;
    els.vec1.style.boxShadow = `0 0 15px var(--qc-warning)`;
  } else {
    els.entAlert.style.display = 'none';
    els.bs0.classList.remove('entangled');
    els.bs1.classList.remove('entangled');
    els.vec0.style.boxShadow = `0 0 5px var(--qc-cyan)`;
    els.vec1.style.boxShadow = `0 0 5px var(--qc-cyan)`;

    // Calculate partial traces (independent probabilities)
    const probQ0_is_0 = stateVector[0] * stateVector[0] + stateVector[1] * stateVector[1];
    const probQ1_is_0 = stateVector[0] * stateVector[0] + stateVector[2] * stateVector[2];

    updateBlochSphere(els.vec0, probQ0_is_0);
    updateBlochSphere(els.vec1, probQ1_is_0);
  }
}

function updateBlochSphere(vecEl, prob0) {
  // Map probability of 0 to a Theta angle on the Bloch sphere.
  // P(0) = cos^2(theta/2) -> theta = 2 * arccos(sqrt(P(0)))
  const p0 = Math.max(0, Math.min(1, prob0)); // clamp
  const thetaRad = 2 * Math.acos(Math.sqrt(p0));
  const thetaDeg = thetaRad * (180 / Math.PI);

  // Vector starts pointing UP (0deg). We rotate it down around X axis by Theta.
  vecEl.style.transform = `translate(-50%, 0) rotateX(${thetaDeg}deg) rotateZ(0deg)`;
}

function logMsg(msg) {
  // A simple toast hook if available
  if (window.showToast) window.showToast(msg);
  else console.log(msg);
}
