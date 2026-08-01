/**
 * pqc-tls13.js
 * Interactive Hybrid Post-Quantum Cryptography & TLS 1.3 Handshake Simulator
 */

document.addEventListener('DOMContentLoaded', () => {
  initPQCTLSVisualizer();
});

const STATES = {
  START: { label: 'START', desc: 'No active connection. Ready to initiate handshake.' },
  CLIENT_HELLO: {
    label: 'CLIENT_HELLO',
    desc: 'Client sends list of supported cipher suites, PQC groups, and public key shares.',
  },
  SERVER_HELLO: {
    label: 'SERVER_HELLO',
    desc: 'Server selects PQC scheme, returns ServerHello with its public key share.',
  },
  ENCRYPTED_EXTENSIONS: {
    label: 'ENCRYPTED_EXTENSIONS',
    desc: 'Server sends encrypted extensions and certificates.',
  },
  FINISHED: {
    label: 'FINISHED',
    desc: 'Handshake complete. Derived Handshake Traffic Keys verified.',
  },
  CONNECTED: { label: 'CONNECTED', desc: 'Application Traffic Keys active. Handshake secure.' },
  COMPROMISED: {
    label: 'COMPROMISED',
    desc: 'Quantum computer decrypted classical ECDHE keys! Connection hijacked.',
  },
};

const els = {
  canvas: document.getElementById('handshakeCanvas'),
  wrapper: document.getElementById('canvasWrapper'),
  handshakeMode: document.getElementById('handshakeMode'),
  nextStepBtn: document.getElementById('nextStepBtn'),
  autoBtn: document.getElementById('autoBtn'),
  quantumAttackBtn: document.getElementById('quantumAttackBtn'),
  stateStat: document.getElementById('stateStat'),
  strengthStat: document.getElementById('strengthStat'),
  sizeStat: document.getElementById('sizeStat'),
  hkdfEntropy: document.getElementById('hkdfEntropy'),
  hkdfEarly: document.getElementById('hkdfEarly'),
  hkdfHandshake: document.getElementById('hkdfHandshake'),
  hkdfTraffic: document.getElementById('hkdfTraffic'),
  pubKeyMatrix: document.getElementById('pubKeyMatrix'),
  cipherMatrix: document.getElementById('cipherMatrix'),
  decryptEquation: document.getElementById('decryptEquation'),
};

let ctx;
let currentState = 'START';
let clientPos = { x: 100, y: 150 };
let serverPos = { x: 500, y: 150 };
let flyingPackets = [];
let _animId = null;
let lastTime = performance.now();
let isAutoRunning = false;
let autoInterval = null;

// Kyber (ML-KEM) lattice parameters
let matrixA = [];
let secretS = [];
let errorE = [];
let vectorT = [];
let ciphertextU = [];
let ciphertextV = 0;
let recoveredSecret = 0;

function initPQCTLSVisualizer() {
  ctx = els.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  bindEvents();
  generateKyberKeys();
  updateUI();

  _animId = requestAnimationFrame(simulatorLoop);
}

function resizeCanvas() {
  const rect = els.wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  els.canvas.width = rect.width * dpr;
  els.canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // Position client and server nodes
  clientPos = { x: 100, y: rect.height / 2 - 20 };
  serverPos = { x: rect.width - 100, y: rect.height / 2 - 20 };
}

function bindEvents() {
  els.handshakeMode.addEventListener('change', resetHandshake);
  els.nextStepBtn.addEventListener('click', stepHandshake);
  els.autoBtn.addEventListener('click', toggleAutoRun);
  els.quantumAttackBtn.addEventListener('click', triggerQuantumAttack);
}

function resetHandshake() {
  if (isAutoRunning) stopAutoRun();
  currentState = 'START';
  flyingPackets = [];
  recoveredSecret = 0;
  generateKyberKeys();
  updateUI();
}

function toggleAutoRun() {
  if (isAutoRunning) {
    stopAutoRun();
  } else {
    isAutoRunning = true;
    els.autoBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    els.autoBtn.classList.remove('btn-secondary');
    els.autoBtn.classList.add('btn-outline');
    autoInterval = setInterval(stepHandshake, 1800);
  }
}

function stopAutoRun() {
  isAutoRunning = false;
  clearInterval(autoInterval);
  els.autoBtn.innerHTML = '<i class="fas fa-play"></i> Auto Run';
  els.autoBtn.classList.remove('btn-outline');
  els.autoBtn.classList.add('btn-secondary');
}

// ==========================================
// NIST ML-KEM / KYBER TOY IMPLEMENTATION
// ==========================================

function generateKyberKeys() {
  const q = 3329; // Standard Kyber Prime

  // Generate 3x3 Matrix A (values from -10 to 10 for display simplicity)
  matrixA = [];
  for (let i = 0; i < 9; i++) {
    matrixA.push(Math.floor(Math.random() * 21) - 10);
  }

  // Secret vector s (values -2 to 2)
  secretS = [
    Math.floor(Math.random() * 5) - 2,
    Math.floor(Math.random() * 5) - 2,
    Math.floor(Math.random() * 5) - 2,
  ];

  // Error vector e
  errorE = [
    Math.floor(Math.random() * 3) - 1,
    Math.floor(Math.random() * 3) - 1,
    Math.floor(Math.random() * 3) - 1,
  ];

  // Compute public key vector t = A * s + e
  vectorT = [];
  for (let r = 0; r < 3; r++) {
    let val = 0;
    for (let c = 0; c < 3; c++) {
      val += matrixA[r * 3 + c] * secretS[c];
    }
    val += errorE[r];
    vectorT.push((val + q) % q);
  }

  // Encapsulate random secret (mock bit message m = 1)
  const m = 1;
  const r = [1, -1, 0]; // Random coin vector
  const e1 = [1, 0, -1];
  const e2 = 2;

  // Ciphertext u = A^T * r + e1
  ciphertextU = [];
  for (let c = 0; c < 3; c++) {
    let val = 0;
    for (let rIdx = 0; rIdx < 3; rIdx++) {
      val += matrixA[rIdx * 3 + c] * r[rIdx]; // Matrix transpose multiplication
    }
    val += e1[c];
    ciphertextU.push((val + q) % q);
  }

  // Ciphertext v = t^T * r + e2 + m * round(q/2)
  let vt = 0;
  for (let i = 0; i < 3; i++) {
    vt += vectorT[i] * r[i];
  }
  vt += e2 + m * Math.round(q / 2);
  ciphertextV = (vt + q) % q;

  // Decapsulate: m_recovered = round( (v - s^T * u) / (q/2) )
  let su = 0;
  for (let i = 0; i < 3; i++) {
    su += secretS[i] * ciphertextU[i];
  }
  const decVal = (ciphertextV - su + q * 2) % q;
  recoveredSecret = decVal > q / 4 && decVal < (3 * q) / 4 ? 1 : 0;
}

// ==========================================
// HANDSHAKE STEP LOGIC
// ==========================================

function stepHandshake() {
  if (currentState === 'CONNECTED' || currentState === 'COMPROMISED') {
    resetHandshake();
    return;
  }

  if (currentState === 'START') {
    currentState = 'CLIENT_HELLO';
    sendPacket('CLIENT_HELLO', clientPos, serverPos);
  } else if (currentState === 'CLIENT_HELLO') {
    currentState = 'SERVER_HELLO';
    sendPacket('SERVER_HELLO', serverPos, clientPos);
  } else if (currentState === 'SERVER_HELLO') {
    currentState = 'ENCRYPTED_EXTENSIONS';
    sendPacket('ENCRYPTED_EXTENSIONS', serverPos, clientPos);
  } else if (currentState === 'ENCRYPTED_EXTENSIONS') {
    currentState = 'FINISHED';
    sendPacket('FINISHED', clientPos, serverPos);
  } else if (currentState === 'FINISHED') {
    currentState = 'CONNECTED';
    sendPacket('CONNECTED', clientPos, serverPos);
  }

  updateUI();
}

function sendPacket(label, from, to) {
  flyingPackets.push({
    label,
    from,
    to,
    x: from.x,
    y: from.y,
    progress: 0,
  });
}

function triggerQuantumAttack() {
  if (currentState !== 'CONNECTED') return;

  const mode = els.handshakeMode.value;
  if (mode === 'classical') {
    currentState = 'COMPROMISED';
    updateUI();
  } else {
    // Hybrid blocks quantum attack
    flyingPackets.push({
      label: 'ATTACK BLOCKED',
      from: { x: clientPos.x + (serverPos.x - clientPos.x) / 2, y: clientPos.y - 60 },
      to: { x: clientPos.x + (serverPos.x - clientPos.x) / 2, y: clientPos.y },
      x: clientPos.x + (serverPos.x - clientPos.x) / 2,
      y: clientPos.y - 60,
      progress: 0,
      isAttack: true,
    });
  }
}

function updateUI() {
  els.stateStat.textContent = STATES[currentState].label;

  // Config values
  const mode = els.handshakeMode.value;
  els.strengthStat.textContent = mode === 'hybrid' ? 'Hybrid PQC' : 'Classical 128-bit';
  els.sizeStat.textContent = mode === 'hybrid' ? '1,248 bytes' : '32 bytes';

  // Highlight HKDF Tree Node active
  document.querySelectorAll('.hkdf-node').forEach((n) => n.classList.remove('active'));
  if (currentState === 'CLIENT_HELLO' || currentState === 'SERVER_HELLO') {
    els.hkdfEntropy.classList.add('active');
  } else if (currentState === 'ENCRYPTED_EXTENSIONS') {
    els.hkdfEarly.classList.add('active');
  } else if (currentState === 'FINISHED') {
    els.hkdfHandshake.classList.add('active');
  } else if (currentState === 'CONNECTED') {
    els.hkdfTraffic.classList.add('active');
  }

  // Render Kyber matrix values
  if (mode === 'hybrid') {
    let pubHTML = ``;
    matrixA.forEach((v) => {
      pubHTML += `<div class="matrix-cell">${v}</div>`;
    });
    els.pubKeyMatrix.innerHTML = pubHTML;

    els.cipherMatrix.innerHTML = `
            <div class="matrix-cell">${ciphertextU[0]}</div>
            <div class="matrix-cell">${ciphertextU[1]}</div>
            <div class="matrix-cell">${ciphertextU[2]}</div>
            <div class="matrix-cell" style="grid-column: span 3; background: rgba(230,186,255,0.15)">v = ${ciphertextV}</div>
        `;

    els.decryptEquation.innerHTML = `
            <div>v - s^T * u = ${ciphertextV} - (${secretS.join('*')}) = ${recoveredSecret ? '1 (Match)' : '0'}</div>
            <div style="color: #10b981; margin-top: 0.2rem;">Shared Key K derived successfully.</div>
        `;
  } else {
    els.pubKeyMatrix.innerHTML = `<div style="grid-column: span 3; color:#64748b; font-size:0.75rem;">Kyber Matrix Disabled (Classical Mode)</div>`;
    els.cipherMatrix.innerHTML = `<div style="grid-column: span 3; color:#64748b; font-size:0.75rem;">No lattice cipher generated</div>`;
    els.decryptEquation.innerHTML = `<div style="color:#64748b; font-size:0.75rem;">Classical ECDHE scalar multiplication active</div>`;
  }
}

// ==========================================
// SIMULATOR LOOP & RENDERING
// ==========================================

function updateSimulator(dt) {
  flyingPackets.forEach((p, idx) => {
    p.progress += dt * 1.5;
    if (p.progress > 1) p.progress = 1;
    p.x = p.from.x + (p.to.x - p.from.x) * p.progress;
    p.y = p.from.y + (p.to.y - p.from.y) * p.progress;

    if (p.progress >= 1) {
      flyingPackets.splice(idx, 1);
    }
  });
}

function drawSimulator() {
  const rect = els.wrapper.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Client/Server Nodes
  ctx.beginPath();
  ctx.arc(clientPos.x, clientPos.y, 30, 0, Math.PI * 2);
  ctx.fillStyle = currentState === 'COMPROMISED' ? '#ef4444' : '#1e293b';
  ctx.strokeStyle = '#e6baff';
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "Fira Code", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Client', clientPos.x, clientPos.y + 4);

  ctx.beginPath();
  ctx.arc(serverPos.x, serverPos.y, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#e6baff';
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillText('Server', serverPos.x, serverPos.y + 4);

  // Flying packets
  flyingPackets.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = p.isAttack ? '#f43f5e' : '#e6baff';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '9px "Fira Code", monospace';
    ctx.fillText(p.label, p.x, p.y - 12);
  });

  // Draw status connection line
  ctx.beginPath();
  ctx.moveTo(clientPos.x + 30, clientPos.y);
  ctx.lineTo(serverPos.x - 30, serverPos.y);
  ctx.lineWidth = 2;
  if (currentState === 'CONNECTED') {
    ctx.strokeStyle = '#10b981'; // Secured Green
    ctx.setLineDash([]);
    ctx.stroke();
  } else if (currentState === 'COMPROMISED') {
    ctx.strokeStyle = '#ef4444'; // Hacked Red
    ctx.setLineDash([]);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function simulatorLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  updateSimulator(dt);
  drawSimulator();

  _animId = requestAnimationFrame(simulatorLoop);
}
