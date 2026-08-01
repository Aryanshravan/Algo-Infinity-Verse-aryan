/**
 * zkp-visualizer.js
 * Educational Simulation of a Zero-Knowledge Proof constraint system.
 * Converts the circuit f(x) = x^3 + x + 5 into Rank-1 Constraint System (R1CS) matrices,
 * generates a witness vector based on a finite prime field, and mathematically verifies it.
 */

document.addEventListener('DOMContentLoaded', () => {
  initZKPVisualizer();
});

// ==========================================
// 1. ZKP MATHEMATICS & STATE
// ==========================================
const PRIME = 97; // Finite field modulo

// Modular Arithmetic Helpers
const mod = (n, p = PRIME) => ((n % p) + p) % p;
const addMod = (a, b) => mod(a + b);
const mulMod = (a, b) => mod(a * b);

// R1CS Matrices for the equation: out = x^3 + x + 5
// Gates:
// 1. sym_1 = x * x
// 2. y = sym_1 * x
// 3. sym_2 = (y + x) * 1
// 4. out = (sym_2 + 5) * 1
// Witness vector s = [1, out, x, sym_1, y, sym_2]
const A = [
  [0, 0, 1, 0, 0, 0], // x
  [0, 0, 0, 1, 0, 0], // sym_1
  [0, 0, 1, 0, 1, 0], // y + x
  [5, 0, 0, 0, 0, 1], // sym_2 + 5
];
const B = [
  [0, 0, 1, 0, 0, 0], // x
  [0, 0, 1, 0, 0, 0], // x
  [1, 0, 0, 0, 0, 0], // 1
  [1, 0, 0, 0, 0, 0], // 1
];
const C = [
  [0, 0, 0, 1, 0, 0], // sym_1
  [0, 0, 0, 0, 1, 0], // y
  [0, 0, 0, 0, 0, 1], // sym_2
  [0, 1, 0, 0, 0, 0], // out
];

let state = {
  x: 3,
  out: 0,
  witness: [], // s
  isProofGenerated: false,
};

// DOM Elements
const els = {
  inputX: document.getElementById('inputX'),
  proverCalculation: document.getElementById('proverCalculation'),

  btnGenerateWitness: document.getElementById('btnGenerateWitness'),
  witnessContainer: document.getElementById('witnessContainer'),
  witnessVector: document.getElementById('witnessVector'),
  btnGenerateProof: document.getElementById('btnGenerateProof'),

  matrixA: document.getElementById('matrixA'),
  matrixB: document.getElementById('matrixB'),
  matrixC: document.getElementById('matrixC'),
  networkAnim: document.getElementById('networkAnim'),

  verifierOutput: document.getElementById('verifierOutput'),
  verifierProofStatus: document.getElementById('verifierProofStatus'),
  btnVerify: document.getElementById('btnVerify'),

  verificationResults: document.getElementById('verificationResults'),
  checkGate1: document.getElementById('checkGate1'),
  checkGate2: document.getElementById('checkGate2'),
  checkGate3: document.getElementById('checkGate3'),
  checkGate4: document.getElementById('checkGate4'),
  finalVerdict: document.getElementById('finalVerdict'),
};

// ==========================================
// 2. INITIALIZATION & UI BINDING
// ==========================================
function initZKPVisualizer() {
  renderMatrices();
  updateProverCalculation();

  // Bind Inputs
  els.inputX.addEventListener('input', updateProverCalculation);

  // Bind Buttons
  els.btnGenerateWitness.addEventListener('click', handleGenerateWitness);
  els.btnGenerateProof.addEventListener('click', handleGenerateProof);
  els.btnVerify.addEventListener('click', handleVerification);
}

function renderMatrices() {
  renderMatrix(A, els.matrixA);
  renderMatrix(B, els.matrixB);
  renderMatrix(C, els.matrixC);
}

function renderMatrix(matrix, container) {
  container.innerHTML = '';
  matrix.forEach((row) => {
    row.forEach((val) => {
      const cell = document.createElement('div');
      cell.className = `m-cell ${val > 0 ? 'active val-' + val : ''}`;
      cell.textContent = val;
      container.appendChild(cell);
    });
  });
}

// ==========================================
// 3. THE PROVER (Generating Witness & Proof)
// ==========================================
function updateProverCalculation() {
  const x = parseInt(els.inputX.value) || 0;

  // Reset down-stream UI
  els.witnessContainer.classList.add('hidden');
  els.networkAnim.classList.add('hidden');
  els.verificationResults.classList.add('hidden');
  els.verifierOutput.textContent = '?';
  els.verifierProofStatus.textContent = 'Waiting...';
  els.verifierProofStatus.className = 'text-secondary';
  els.btnVerify.disabled = true;
  state.isProofGenerated = false;

  // Modulo arithmetic
  const sym_1 = mulMod(x, x);
  const y_val = mulMod(sym_1, x);
  const sym_2 = addMod(y_val, x);
  const out = addMod(sym_2, 5);

  els.proverCalculation.innerHTML = `
        sym_1 = (${x} * ${x}) mod 97 = ${sym_1}<br>
        y = (${sym_1} * ${x}) mod 97 = ${y_val}<br>
        sym_2 = (${y_val} + ${x}) mod 97 = ${sym_2}<br>
        out = (${sym_2} + 5) mod 97 = ${out}
    `;

  state.x = x;
  state.out = out;
}

function handleGenerateWitness() {
  const sym_1 = mulMod(state.x, state.x);
  const y_val = mulMod(sym_1, state.x);
  const sym_2 = addMod(y_val, state.x);

  // Construct Witness Vector s = [1, out, x, sym_1, y, sym_2]
  state.witness = [1, state.out, state.x, sym_1, y_val, sym_2];

  els.witnessVector.innerHTML = '';
  state.witness.forEach((val) => {
    const span = document.createElement('span');
    span.className = 'vec-element';
    span.textContent = val;
    els.witnessVector.appendChild(span);
  });

  els.witnessContainer.classList.remove('hidden');
}

function handleGenerateProof() {
  // Simulate complex proof generation & network transfer
  els.btnGenerateProof.disabled = true;
  els.btnGenerateProof.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating SNARK...';

  setTimeout(() => {
    els.btnGenerateProof.innerHTML = '<i class="fas fa-check"></i> Proof Generated';

    // Trigger Animation
    els.networkAnim.classList.remove('hidden');

    // Update Verifier after animation completes
    setTimeout(() => {
      state.isProofGenerated = true;
      els.verifierOutput.textContent = state.out;
      els.verifierProofStatus.textContent = 'Proof π Received';
      els.verifierProofStatus.className = 'text-success';
      els.btnVerify.disabled = false;

      els.btnGenerateProof.disabled = false;
      els.btnGenerateProof.innerHTML = '<i class="fas fa-magic"></i> Generate Cryptographic Proof';
      els.networkAnim.classList.add('hidden');
    }, 2000);
  }, 800);
}

// ==========================================
// 4. THE VERIFIER (Mathematical Checking)
// ==========================================

// Dot product of two vectors modulo P
function dotProductMod(vec1, vec2) {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum = addMod(sum, mulMod(vec1[i], vec2[i]));
  }
  return sum;
}

function handleVerification() {
  if (!state.isProofGenerated) return;

  els.btnVerify.disabled = true;
  els.btnVerify.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
  els.verificationResults.classList.add('hidden');

  setTimeout(() => {
    // Mathematical Verification of R1CS: A.s * B.s == C.s
    const s = state.witness;

    // Gate 1 Check
    const a1 = dotProductMod(A[0], s);
    const b1 = dotProductMod(B[0], s);
    const c1 = dotProductMod(C[0], s);
    const isValid1 = mulMod(a1, b1) === c1;
    els.checkGate1.innerHTML = `(${a1} * ${b1}) mod 97 == ${c1} <i class="fas ${isValid1 ? 'fa-check valid-math' : 'fa-times invalid-math'}"></i>`;

    // Gate 2 Check
    const a2 = dotProductMod(A[1], s);
    const b2 = dotProductMod(B[1], s);
    const c2 = dotProductMod(C[1], s);
    const isValid2 = mulMod(a2, b2) === c2;
    els.checkGate2.innerHTML = `(${a2} * ${b2}) mod 97 == ${c2} <i class="fas ${isValid2 ? 'fa-check valid-math' : 'fa-times invalid-math'}"></i>`;

    // Gate 3 Check
    const a3 = dotProductMod(A[2], s);
    const b3 = dotProductMod(B[2], s);
    const c3 = dotProductMod(C[2], s);
    const isValid3 = mulMod(a3, b3) === c3;
    els.checkGate3.innerHTML = `(${a3} * ${b3}) mod 97 == ${c3} <i class="fas ${isValid3 ? 'fa-check valid-math' : 'fa-times invalid-math'}"></i>`;

    // Gate 4 Check
    const a4 = dotProductMod(A[3], s);
    const b4 = dotProductMod(B[3], s);
    const c4 = dotProductMod(C[3], s);
    const isValid4 = mulMod(a4, b4) === c4;
    els.checkGate4.innerHTML = `(${a4} * ${b4}) mod 97 == ${c4} <i class="fas ${isValid4 ? 'fa-check valid-math' : 'fa-times invalid-math'}"></i>`;

    // Final Verdict
    els.verificationResults.classList.remove('hidden');
    if (isValid1 && isValid2 && isValid3 && isValid4) {
      els.finalVerdict.className = 'verdict-box success';
      els.finalVerdict.innerHTML =
        '<i class="fas fa-shield-check"></i> PROOF VALID! The prover knows the secret input.';
    } else {
      els.finalVerdict.className = 'verdict-box error';
      els.finalVerdict.innerHTML =
        '<i class="fas fa-ban"></i> PROOF INVALID! The equations do not hold.';
    }

    els.btnVerify.disabled = false;
    els.btnVerify.innerHTML = '<i class="fas fa-check-double"></i> Run Verification';
  }, 1000);
}
