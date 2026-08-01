document.addEventListener('DOMContentLoaded', () => {
  initZKP();
});

// ==========================================
// 1. STATE & TABS
// ==========================================
let currentTab = 'colorblind';
let roundsPassed = 0;

const els = {
  tabs: document.querySelectorAll('.zkp-tab-btn'),
  contents: document.querySelectorAll('.zkp-tab-content'),
  statRounds: document.getElementById('statRounds'),
  statConfidence: document.getElementById('statConfidence'),
  statCheatProb: document.getElementById('statCheatProb'),
  graphCanvas: document.getElementById('confidenceGraph'),
};

// ==========================================
// 2. PROBABILITY ENGINE & GRAPH
// ==========================================
let graphCtx;
let dataPoints = [];

function initGraph() {
  els.graphCanvas.width = els.graphCanvas.parentElement.clientWidth;
  els.graphCanvas.height = 150;
  graphCtx = els.graphCanvas.getContext('2d');
  drawGraph();
}

function updateProbability(passed) {
  if (passed) {
    roundsPassed++;
  } else {
    roundsPassed = 0; // Failed challenge resets everything
  }

  let confidence = 0;
  let cheatProb = 100;

  if (roundsPassed > 0) {
    cheatProb = Math.pow(0.5, roundsPassed) * 100;
    confidence = 100 - cheatProb;
  }

  els.statRounds.textContent = roundsPassed;
  els.statConfidence.textContent = confidence.toFixed(roundsPassed > 10 ? 5 : 2) + '%';
  els.statCheatProb.textContent = cheatProb.toFixed(roundsPassed > 10 ? 5 : 2) + '%';

  if (!passed) {
    els.statConfidence.classList.remove('text-success');
    els.statConfidence.classList.add('text-danger');
  } else {
    els.statConfidence.classList.add('text-success');
    els.statConfidence.classList.remove('text-danger');
  }

  dataPoints.push({ x: dataPoints.length, y: confidence });
  if (dataPoints.length > 50) dataPoints.shift(); // Keep last 50 points

  drawGraph();
}

function resetProbability() {
  roundsPassed = 0;
  dataPoints = [];
  updateProbability(false); // reset UI
  els.statConfidence.classList.remove('text-danger');
  els.statConfidence.classList.add('text-success');
}

function drawGraph() {
  if (!graphCtx) return;
  const w = els.graphCanvas.width;
  const h = els.graphCanvas.height;

  graphCtx.clearRect(0, 0, w, h);

  // Draw axes
  graphCtx.strokeStyle = 'rgba(255,255,255,0.2)';
  graphCtx.lineWidth = 1;
  graphCtx.beginPath();
  graphCtx.moveTo(40, 10);
  graphCtx.lineTo(40, h - 20);
  graphCtx.lineTo(w - 10, h - 20);
  graphCtx.stroke();

  // Labels
  graphCtx.fillStyle = '#94a3b8';
  graphCtx.font = '10px "Fira Code"';
  graphCtx.fillText('100%', 10, 15);
  graphCtx.fillText('50%', 15, h / 2);
  graphCtx.fillText('0%', 20, h - 20);

  if (dataPoints.length === 0) return;

  // Draw Curve
  graphCtx.strokeStyle = '#10b981';
  graphCtx.lineWidth = 3;
  graphCtx.beginPath();

  const xStep = (w - 60) / 50;

  dataPoints.forEach((pt, i) => {
    const px = 40 + i * xStep;
    const py = h - 20 - (pt.y / 100) * (h - 30);

    if (i === 0) graphCtx.moveTo(px, py);
    else graphCtx.lineTo(px, py);
  });

  graphCtx.stroke();

  // Fill under curve
  graphCtx.lineTo(40 + (dataPoints.length - 1) * xStep, h - 20);
  graphCtx.lineTo(40, h - 20);
  graphCtx.fillStyle = 'rgba(16, 185, 129, 0.1)';
  graphCtx.fill();
}

// ==========================================
// 3. COLORBLIND FRIEND PROTOCOL
// ==========================================
const cb = {
  malicious: document.getElementById('cbMaliciousToggle'),
  btnSingle: document.getElementById('btnCbSingleRound'),
  btnBatch: document.getElementById('btnCbBatchRun'),
  btnReset: document.getElementById('btnCbReset'),
  log: document.getElementById('cbLog'),
  ball1: document.getElementById('cbBall1'),
  ball2: document.getElementById('cbBall2'),
  vDialog: document.getElementById('cbVerifierDialog'),
  pDialog: document.getElementById('cbProverDialog'),
};

let cbAnimating = false;
let cbSwapped = false; // Tracks if balls were physically swapped in animation

function logCb(msg, type = 'info') {
  const div = document.createElement('div');
  div.className = `log-line log-${type}`;
  div.textContent = `> ${msg}`;
  cb.log.appendChild(div);
  cb.log.scrollTop = cb.log.scrollHeight;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showDialog(el, text, duration = 2000) {
  el.textContent = text;
  el.classList.add('visible');
  if (duration > 0) {
    setTimeout(() => el.classList.remove('visible'), duration);
  }
}

async function runCbSingleRound() {
  if (cbAnimating) return;
  cbAnimating = true;
  cb.btnSingle.disabled = true;
  cb.btnBatch.disabled = true;

  const isLying = cb.malicious.checked;

  logCb('--- Starting New Round ---', 'info');
  if (isLying) {
    logCb('Prover is lying (Using two green balls)', 'fail');
    cb.ball1.style.background = '#10b981'; // Fake red to green
  } else {
    cb.ball1.style.background = '#ef4444';
  }

  // Step 1: Hide Balls
  showDialog(cb.vDialog, 'Hide the balls!', 1500);
  logCb('Verifier puts balls behind their back.', 'verifier');
  cb.ball1.classList.add('ball-hidden');
  cb.ball2.classList.add('ball-hidden');
  await sleep(1500);

  // Step 2: Shuffle (or not)
  const didSwitch = Math.random() > 0.5;
  if (didSwitch) {
    logCb('Verifier secretly switches hands.', 'verifier');
    showDialog(cb.vDialog, '*Shuffles*', 1500);

    // Visual physical swap of div positions
    cb.ball1.classList.add('swapping-1');
    cb.ball2.classList.add('swapping-2');
    await sleep(500);

    // Hard swap positions in DOM order implicitly by swapping classes
    if (!cbSwapped) {
      cb.ball1.style.left = 'calc(50% + 10px)';
      cb.ball2.style.left = 'calc(50% - 70px)';
    } else {
      cb.ball1.style.left = 'calc(50% - 70px)';
      cb.ball2.style.left = 'calc(50% + 10px)';
    }
    cbSwapped = !cbSwapped;

    cb.ball1.classList.remove('swapping-1');
    cb.ball2.classList.remove('swapping-2');
  } else {
    logCb('Verifier does NOT switch hands.', 'verifier');
    showDialog(cb.vDialog, '*Waits*', 1500);
  }
  await sleep(1500);

  // Step 3: Reveal and Challenge
  showDialog(cb.vDialog, 'Did I switch them?', 0); // Keep visible
  logCb('Verifier reveals balls: "Did I switch them?"', 'verifier');
  cb.ball1.classList.remove('ball-hidden');
  cb.ball2.classList.remove('ball-hidden');
  await sleep(1500);

  // Step 4: Prover Answers
  let proverAnswer = didSwitch; // Honest prover knows!
  if (isLying) {
    // Lying prover has to guess because balls are identical colors to them too!
    proverAnswer = Math.random() > 0.5;
    logCb('Prover panics. They cannot tell! Guessing blindly...', 'fail');
  }

  const ansText = proverAnswer ? 'Yes, you switched!' : 'No, you did not!';
  showDialog(cb.pDialog, ansText, 2500);
  logCb(`Prover answers: "${ansText}"`, 'prover');
  await sleep(1500);

  // Step 5: Verification
  cb.vDialog.classList.remove('visible');
  const passed = proverAnswer === didSwitch;

  if (passed) {
    logCb('Result: Correct! Prover passes this round.', 'success');
    updateProbability(true);
  } else {
    logCb('Result: WRONG! Prover caught lying!', 'fail');
    updateProbability(false);
  }

  cb.btnSingle.disabled = false;
  cb.btnBatch.disabled = false;
  cbAnimating = false;
}

async function runCbBatch() {
  if (cbAnimating) return;
  cbAnimating = true;
  cb.btnSingle.disabled = true;
  cb.btnBatch.disabled = true;

  const isLying = cb.malicious.checked;
  logCb('--- Starting 100 Rounds Batch ---', 'info');

  for (let i = 1; i <= 100; i++) {
    const didSwitch = Math.random() > 0.5;
    let proverAnswer = didSwitch;
    if (isLying) proverAnswer = Math.random() > 0.5;

    const passed = proverAnswer === didSwitch;
    updateProbability(passed);

    if (!passed) {
      logCb(`Failed at round ${i}. Prover caught lying!`, 'fail');
      break;
    }

    if (i % 10 === 0) {
      logCb(
        `Passed ${i} rounds. Confidence: ${document.getElementById('statConfidence').textContent}`,
        'success'
      );
      await sleep(50); // tiny visual delay to see graph update
    }
  }

  if (roundsPassed === 100) {
    logCb('Passed 100 rounds successfully!', 'success');
  }

  cb.btnSingle.disabled = false;
  cb.btnBatch.disabled = false;
  cbAnimating = false;
}

// ==========================================
// 4. ALI BABA CAVE PROTOCOL
// ==========================================
const ab = {
  malicious: document.getElementById('abMaliciousToggle'),
  btnSingle: document.getElementById('btnAbSingleRound'),
  btnBatch: document.getElementById('btnAbBatchRun'),
  btnReset: document.getElementById('btnAbReset'),
  log: document.getElementById('abLog'),
  prover: document.getElementById('abProver'),
  door: document.getElementById('abMagicDoor'),
  vDialog: document.getElementById('abVerifierDialog'),
};

let abAnimating = false;

function logAb(msg, type = 'info') {
  const div = document.createElement('div');
  div.className = `log-line log-${type}`;
  div.textContent = `> ${msg}`;
  ab.log.appendChild(div);
  ab.log.scrollTop = ab.log.scrollHeight;
}

async function runAbSingleRound() {
  if (abAnimating) return;
  abAnimating = true;
  ab.btnSingle.disabled = true;
  ab.btnBatch.disabled = true;

  const isLying = ab.malicious.checked;

  logAb('--- Starting New Cave Round ---', 'info');

  // Step 1: Prover enters A or B
  const enteredA = Math.random() > 0.5;
  logAb(`Prover secretly enters Path ${enteredA ? 'A' : 'B'}.`, 'prover');

  // Animate Prover moving
  ab.prover.style.transform = `translate(${enteredA ? '-60px' : '60px'}, -140px)`;
  await sleep(1000);

  // Step 2: Verifier challenges
  const challengeA = Math.random() > 0.5;
  showDialog(ab.vDialog, `Exit via Path ${challengeA ? 'A' : 'B'}!`, 2500);
  logAb(`Verifier challenges: "Exit via Path ${challengeA ? 'A' : 'B'}!"`, 'verifier');
  await sleep(1500);

  // Step 3: Prover attempts to exit
  let passed = false;

  if (!isLying) {
    // Honest prover knows the password. They can traverse the door if needed.
    if (enteredA !== challengeA) {
      logAb('Prover uses Magic Door password to cross paths.', 'success');
      ab.door.classList.add('open');
      await sleep(500);
    }
    passed = true;
  } else {
    // Lying prover does NOT know the password.
    if (enteredA !== challengeA) {
      logAb('Prover is trapped! Does not know magic word.', 'fail');
      passed = false;
    } else {
      logAb('Prover got lucky! Already on the correct path.', 'warning');
      passed = true;
    }
  }

  // Animate Exit
  if (passed) {
    // Move to exit via challenge path
    ab.prover.style.transform = `translate(${challengeA ? '-60px' : '60px'}, -60px)`;
    await sleep(500);
    ab.prover.style.transform = `translate(0px, 0px)`; // Back to start
    logAb('Result: Correct! Prover exits correctly.', 'success');
    updateProbability(true);
  } else {
    // Stuck!
    logAb('Result: FAILED! Prover caught lying!', 'fail');
    updateProbability(false);
    await sleep(1000);
    ab.prover.style.transform = `translate(0px, 0px)`; // Force reset
  }

  ab.door.classList.remove('open');

  ab.btnSingle.disabled = false;
  ab.btnBatch.disabled = false;
  abAnimating = false;
}

async function runAbBatch() {
  if (abAnimating) return;
  abAnimating = true;
  ab.btnSingle.disabled = true;
  ab.btnBatch.disabled = true;

  const isLying = ab.malicious.checked;
  logAb('--- Starting 100 Rounds Batch ---', 'info');

  for (let i = 1; i <= 100; i++) {
    const enteredA = Math.random() > 0.5;
    const challengeA = Math.random() > 0.5;

    let passed = true;
    if (isLying && enteredA !== challengeA) {
      passed = false;
    }

    updateProbability(passed);

    if (!passed) {
      logAb(`Failed at round ${i}. Prover caught lying without password!`, 'fail');
      break;
    }

    if (i % 10 === 0) {
      logAb(
        `Passed ${i} rounds. Confidence: ${document.getElementById('statConfidence').textContent}`,
        'success'
      );
      await sleep(50);
    }
  }

  ab.btnSingle.disabled = false;
  ab.btnBatch.disabled = false;
  abAnimating = false;
}

// ==========================================
// 5. R1CS SNARK MATRIX PROTOCOL
// ==========================================
const r1cs = {
  x: document.getElementById('inputX'),
  y: document.getElementById('inputY'),
  calc: document.getElementById('proverCalculation'),
  btnWit: document.getElementById('btnGenerateWitness'),
  witCont: document.getElementById('witnessContainer'),
  witVec: document.getElementById('witnessVector'),
  matDisp: document.getElementById('r1csMatrices'),
  res: document.getElementById('r1csResult'),
};

function initR1CS() {
  // Generate static Matrices for f(x,y) = x*y+2
  // witness s = [1, out, x, y, v1]
  // where v1 = x * y
  // Constraint 1: x * y = v1 => A=[0,0,1,0,0], B=[0,0,0,1,0], C=[0,0,0,0,1]
  // Constraint 2: v1 + 2 = out => (v1 + 2) * 1 = out => A=[2,0,0,0,1], B=[1,0,0,0,0], C=[0,1,0,0,0]

  const A = [
    [0, 0, 1, 0, 0],
    [2, 0, 0, 0, 1],
  ];
  const B = [
    [0, 0, 0, 1, 0],
    [1, 0, 0, 0, 0],
  ];
  const C = [
    [0, 0, 0, 0, 1],
    [0, 1, 0, 0, 0],
  ];

  r1cs.matDisp.innerHTML = `
        <div class="matrix-wrapper"><span class="matrix-label">Matrix A</span>${buildMatrixHTML(A)}</div>
        <div class="matrix-operator">*</div>
        <div class="matrix-wrapper"><span class="matrix-label">Matrix B</span>${buildMatrixHTML(B)}</div>
        <div class="matrix-operator">=</div>
        <div class="matrix-wrapper"><span class="matrix-label">Matrix C</span>${buildMatrixHTML(C)}</div>
    `;

  r1cs.btnWit.addEventListener('click', () => {
    const x = parseInt(r1cs.x.value);
    const y = parseInt(r1cs.y.value);
    const out = (x * y + 2) % 97;
    const v1 = (x * y) % 97;

    r1cs.calc.textContent = `out = (${x} * ${y}) + 2 = ${out} (Mod 97)`;
    r1cs.witVec.textContent = `s = [1, ${out}, ${x}, ${y}, ${v1}]`;
    r1cs.witCont.classList.remove('hidden');

    setTimeout(() => {
      r1cs.res.classList.remove('hidden');
    }, 1000);
  });
}

function buildMatrixHTML(matrix) {
  let html = '<div class="matrix">';
  matrix.forEach((row) => {
    html += '<div class="matrix-row">';
    row.forEach((val) => {
      html += `<div class="matrix-cell">${val}</div>`;
    });
    html += '</div>';
  });
  html += '</div>';
  return html;
}

// ==========================================
// 6. INITIALIZATION & TABS BINDINGS
// ==========================================

function initZKP() {
  els.tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');

      // UI switch
      els.tabs.forEach((t) => t.classList.remove('active'));
      els.contents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
      currentTab = tabId;

      // Reset prob engine when switching to active visualizers
      if (tabId === 'colorblind' || tabId === 'alibaba') {
        resetProbability();
        document.getElementById('sharedProbabilityPanel').style.display = 'block';
      } else {
        document.getElementById('sharedProbabilityPanel').style.display = 'none';
      }
    });
  });

  initGraph();
  window.addEventListener('resize', initGraph); // Handle resize redraw

  // Bind Colorblind
  cb.btnSingle.addEventListener('click', runCbSingleRound);
  cb.btnBatch.addEventListener('click', runCbBatch);
  cb.btnReset.addEventListener('click', () => {
    cb.log.innerHTML = '';
    cb.malicious.checked = false;
    cb.ball1.style.background = '#ef4444';
    cb.ball2.style.background = '#10b981';
    cbSwapped = false;
    cb.ball1.style.left = 'calc(50% - 70px)';
    cb.ball2.style.left = 'calc(50% + 10px)';
    resetProbability();
  });

  // Bind Alibaba
  ab.btnSingle.addEventListener('click', runAbSingleRound);
  ab.btnBatch.addEventListener('click', runAbBatch);
  ab.btnReset.addEventListener('click', () => {
    ab.log.innerHTML = '';
    ab.malicious.checked = false;
    ab.prover.style.transform = 'translate(0px, 0px)';
    ab.door.classList.remove('open');
    resetProbability();
  });

  // Bind R1CS
  initR1CS();
}
