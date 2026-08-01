/**
 * tls13-simulator.js
 * Simulate the TLS 1.3 Handshake (1-RTT and 0-RTT).
 * eslint-disable no-unused-vars
 */
/* eslint-disable no-unused-vars */

document.addEventListener('DOMContentLoaded', () => {
  initTLS();
});

const els = {
  btnStart: document.getElementById('btnNextStep'),
  btnReset: document.getElementById('btnReset'),
  explanationText: document.getElementById('explanationText'),

  cKeyShare1: document.getElementById('clientKeyShare1RTT'),
  sKeyShare1: document.getElementById('serverKeyShare1RTT'),
  cMaster1: document.getElementById('clientMasterSecret1RTT'),
  sMaster1: document.getElementById('serverMasterSecret1RTT'),
  msg1RTT: document.getElementById('messagesArea1RTT'),

  cMaster0: document.getElementById('clientMasterSecret0RTT'),
  sMaster0: document.getElementById('serverMasterSecret0RTT'),
  msg0RTT: document.getElementById('messagesArea0RTT'),

  time1RTT: document.getElementById('time1RTT'),
  time0RTT: document.getElementById('time0RTT'),
  bar1RTT: document.getElementById('bar1RTT'),
  bar0RTT: document.getElementById('bar0RTT'),
  val1RTT: document.getElementById('val1RTT'),
  val0RTT: document.getElementById('val0RTT'),
  latencyDiff: document.getElementById('latencyDiff'),
};

let isAnimating = false;
let startTime;
let time1RTTFinished = null;
let time0RTTFinished = null;
let reqAnimFrameId;

function initTLS() {
  els.btnStart.addEventListener('click', startHandshake);
  els.btnReset.addEventListener('click', resetSimulation);
}

function resetSimulation() {
  cancelAnimationFrame(reqAnimFrameId);
  els.msg1RTT.innerHTML = '';
  els.msg0RTT.innerHTML = '';

  els.cKeyShare1.classList.add('hidden');
  els.sKeyShare1.classList.add('hidden');
  els.cMaster1.classList.add('hidden');
  els.sMaster1.classList.add('hidden');

  els.cMaster0.classList.add('hidden');
  els.sMaster0.classList.add('hidden');

  els.time1RTT.textContent = '0ms';
  els.time0RTT.textContent = '0ms';
  els.val1RTT.textContent = '0ms';
  els.val0RTT.textContent = '0ms';
  els.bar1RTT.style.width = '0%';
  els.bar0RTT.style.width = '0%';
  els.latencyDiff.textContent = '';

  els.btnStart.disabled = false;
  els.btnStart.innerHTML = 'Start TLS Race <i class="fas fa-flag-checkered"></i>';
  els.explanationText.innerHTML =
    'Click "Start TLS Race" to begin. The visualizer will concurrently run both protocols and measure the precise latency difference.';

  isAnimating = false;
}

function animateMessage(options) {
  return new Promise((resolve) => {
    const msg = document.createElement('div');
    msg.className = `message-box ${options.classes || ''}`;
    msg.innerHTML = `${options.icon ? `<i class="${options.icon}"></i> ` : ''}${options.text}`;

    msg.style.top = `${options.yOffset}px`;

    if (options.dir === 'c2s') {
      msg.classList.add('client-to-server');
      msg.style.left = '0%';
      msg.style.transform = 'translate(-50%, -50%)';
    } else {
      msg.classList.add('server-to-client');
      msg.style.right = '0%';
      msg.style.transform = 'translate(50%, -50%)';
    }

    options.targetArea.appendChild(msg);

    msg.animate([{ opacity: 1 }, { opacity: 1 }], { duration: options.duration, fill: 'forwards' });

    const animation = msg.animate(
      [
        { [options.dir === 'c2s' ? 'left' : 'right']: '0%' },
        { [options.dir === 'c2s' ? 'left' : 'right']: '100%' },
      ],
      {
        duration: options.duration,
        easing: 'ease-in-out',
        fill: 'forwards',
      }
    );

    animation.onfinish = () => {
      resolve(msg);
    };
  });
}

async function startHandshake() {
  if (isAnimating) return;
  isAnimating = true;
  els.btnStart.disabled = true;

  els.msg1RTT.innerHTML = '';
  els.msg0RTT.innerHTML = '';

  startTime = performance.now();
  time1RTTFinished = null;
  time0RTTFinished = null;
  els.latencyDiff.textContent = '';

  reqAnimFrameId = requestAnimationFrame(updateLatencyChart);

  await Promise.all([run1RTT(), run0RTT()]);

  els.btnStart.innerHTML = '<i class="fas fa-check"></i> Race Finished';
}

function updateLatencyChart() {
  if (!isAnimating) return;

  const now = performance.now();
  const elapsed = now - startTime;

  if (!time1RTTFinished) {
    const val1 = Math.floor(elapsed);
    els.time1RTT.textContent = `${val1}ms`;
    els.val1RTT.textContent = `${val1}ms`;
    els.bar1RTT.style.width = `${Math.min(100, val1 / 50)}%`;
  }

  if (!time0RTTFinished) {
    const val0 = Math.floor(elapsed);
    els.time0RTT.textContent = `${val0}ms`;
    els.val0RTT.textContent = `${val0}ms`;
    els.bar0RTT.style.width = `${Math.min(100, val0 / 50)}%`;
  }

  if (time1RTTFinished && time0RTTFinished) {
    const diff = time1RTTFinished - time0RTTFinished;
    els.latencyDiff.innerHTML = `<i class="fas fa-bolt"></i> 0-RTT was <strong>${Math.floor(diff)}ms</strong> faster!`;
    return;
  }

  reqAnimFrameId = requestAnimationFrame(updateLatencyChart);
}

async function run1RTT() {
  els.cKeyShare1.textContent = 'g^a';
  els.cKeyShare1.classList.remove('hidden');

  await animateMessage({
    text: 'ClientHello + Key Share',
    icon: 'fas fa-handshake',
    dir: 'c2s',
    yOffset: 30,
    duration: 1500,
    targetArea: els.msg1RTT,
  });

  if (!isAnimating) return; // Mid-race reset

  els.sKeyShare1.textContent = 'g^b';
  els.sKeyShare1.classList.remove('hidden');
  setTimeout(() => {
    if (!isAnimating) return;
    els.sMaster1.classList.remove('hidden');
    els.sMaster1.style.color = 'var(--color-encrypt)';
  }, 500);

  await Promise.all([
    animateMessage({
      text: 'ServerHello + Key Share',
      icon: 'fas fa-server',
      dir: 's2c',
      yOffset: 80,
      duration: 1500,
      targetArea: els.msg1RTT,
    }),
    animateMessage({
      text: 'EncryptedExtensions, Finished',
      icon: 'fas fa-lock',
      dir: 's2c',
      yOffset: 120,
      duration: 1500,
      classes: 'encrypted',
      targetArea: els.msg1RTT,
    }),
  ]);

  if (!isAnimating) return;

  els.cMaster1.classList.remove('hidden');
  els.cMaster1.style.color = 'var(--color-encrypt)';

  await animateMessage({
    text: 'Finished',
    icon: 'fas fa-lock',
    dir: 'c2s',
    yOffset: 170,
    duration: 1200,
    classes: 'encrypted',
    targetArea: els.msg1RTT,
  });

  if (!isAnimating) return;

  await animateMessage({
    text: 'Application Data (HTTP)',
    icon: 'fas fa-database',
    dir: 'c2s',
    yOffset: 210,
    duration: 1000,
    classes: 'encrypted',
    targetArea: els.msg1RTT,
  });

  if (isAnimating) time1RTTFinished = performance.now() - startTime;
}

async function run0RTT() {
  els.cMaster0.classList.remove('hidden');
  els.cMaster0.style.color = 'var(--color-early)';

  await Promise.all([
    animateMessage({
      text: 'ClientHello + PSK',
      icon: 'fas fa-ticket-alt',
      dir: 'c2s',
      yOffset: 30,
      duration: 1500,
      targetArea: els.msg0RTT,
    }),
    animateMessage({
      text: 'Early Data (HTTP Request)',
      icon: 'fas fa-bolt',
      dir: 'c2s',
      yOffset: 70,
      duration: 1500,
      classes: 'early-data',
      targetArea: els.msg0RTT,
    }),
  ]);

  if (!isAnimating) return;

  els.sMaster0.classList.remove('hidden');
  els.sMaster0.style.color = 'var(--color-early)';

  await Promise.all([
    animateMessage({
      text: 'ServerHello + EncryptedExtensions',
      icon: 'fas fa-lock',
      dir: 's2c',
      yOffset: 120,
      duration: 1500,
      classes: 'encrypted',
      targetArea: els.msg0RTT,
    }),
    animateMessage({
      text: 'Application Data (HTTP Response)',
      icon: 'fas fa-database',
      dir: 's2c',
      yOffset: 160,
      duration: 1500,
      classes: 'early-data',
      targetArea: els.msg0RTT,
    }),
  ]);

  if (isAnimating) time0RTTFinished = performance.now() - startTime;
}
