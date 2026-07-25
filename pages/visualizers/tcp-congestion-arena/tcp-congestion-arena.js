/**
 * tcp-congestion-arena.js
 * Simulate CUBIC vs BBR congestion control.
 * eslint-disable no-unused-vars
 */
/* global Chart */
/* eslint-disable no-unused-vars */

document.addEventListener('DOMContentLoaded', () => {
  initTCP();
});

const els = {
  btnStart: document.getElementById('btnStart'),
  btnDrop: document.getElementById('btnDropPacket'),
  btnReset: document.getElementById('btnReset'),

  cubicCwnd: document.getElementById('cubicCwnd'),
  bbrCwnd: document.getElementById('bbrCwnd'),

  cubicPipe: document.getElementById('cubicPipe'),
  bbrPipe: document.getElementById('bbrPipe'),

  chartCtx: document.getElementById('cwndChart').getContext('2d'),
};

let simInterval = null;
let chart = null;
let timeStep = 0;
let isRunning = false;

// Simulation State
let state = {
  cubic: { cwnd: 1, maxCwnd: 0, ssthresh: 64, mode: 'slow_start' },
  bbr: { cwnd: 1, maxBw: 10, minRtt: 50, mode: 'startup' },
};

let chartData = {
  labels: [],
  cubic: [],
  bbr: [],
};

function initTCP() {
  initChart();

  els.btnStart.addEventListener('click', toggleSimulation);
  els.btnReset.addEventListener('click', resetSimulation);
  els.btnDrop.addEventListener('click', injectPacketLoss);
}

function initChart() {
  chart = new Chart(els.chartCtx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: 'CUBIC cwnd',
          data: chartData.cubic,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'BBR cwnd',
          data: chartData.bbr,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#94a3b8' },
        },
        x: { grid: { display: false }, ticks: { color: '#94a3b8', maxTicksLimit: 20 } },
      },
      plugins: {
        legend: { labels: { color: '#f8fafc' } },
      },
    },
  });
}

function toggleSimulation() {
  if (isRunning) {
    clearInterval(simInterval);
    isRunning = false;
    els.btnStart.innerHTML = '<i class="fas fa-play"></i> Resume Simulation';
    els.btnDrop.disabled = true;
  } else {
    isRunning = true;
    els.btnStart.innerHTML = '<i class="fas fa-pause"></i> Pause Simulation';
    els.btnDrop.disabled = false;

    simInterval = setInterval(tick, 500);
  }
}

function resetSimulation() {
  clearInterval(simInterval);
  isRunning = false;
  timeStep = 0;

  state.cubic = { cwnd: 1, maxCwnd: 0, ssthresh: 64, mode: 'slow_start' };
  state.bbr = { cwnd: 1, maxBw: 10, minRtt: 50, mode: 'startup' };

  chartData.labels = [];
  chartData.cubic = [];
  chartData.bbr = [];
  updateChart();

  els.cubicCwnd.textContent = '1';
  els.bbrCwnd.textContent = '1';

  els.btnStart.innerHTML = '<i class="fas fa-play"></i> Start Simulation';
  els.btnDrop.disabled = true;

  els.cubicPipe.innerHTML = '';
  els.bbrPipe.innerHTML = '';
}

function tick() {
  timeStep++;

  // Update CUBIC
  if (state.cubic.mode === 'slow_start') {
    state.cubic.cwnd *= 2; // exponential growth
    if (state.cubic.cwnd >= state.cubic.ssthresh) {
      state.cubic.mode = 'congestion_avoidance';
    }
  } else {
    // approximate cubic growth
    state.cubic.cwnd += 2;
  }

  // Update BBR
  if (state.bbr.mode === 'startup') {
    state.bbr.cwnd *= 2;
    if (state.bbr.cwnd >= 50) {
      state.bbr.mode = 'probe_bw';
    }
  } else {
    // BBR fluctuates slightly to probe, but stays stable
    let probe = timeStep % 10 === 0 ? 1.25 : timeStep % 10 === 5 ? 0.75 : 1;
    state.bbr.cwnd = 50 * probe;
  }

  updateUI();
  spawnPackets();
}

function injectPacketLoss() {
  if (!isRunning) return;

  // CUBIC reacts aggressively (Multiplicative Decrease)
  state.cubic.maxCwnd = state.cubic.cwnd;
  state.cubic.ssthresh = Math.max(2, Math.floor(state.cubic.cwnd * 0.7)); // 30% reduction (CUBIC factor)
  state.cubic.cwnd = state.cubic.ssthresh;
  state.cubic.mode = 'congestion_avoidance';

  // BBR ignores random loss, maintains pacing based on BW
  // (BBR cwnd remains unaffected by isolated loss)

  updateUI();

  // Visual effect
  dropRandomPacket(els.cubicPipe);
  dropRandomPacket(els.bbrPipe); // Still drops visually, but doesn't affect cwnd
}

function updateUI() {
  els.cubicCwnd.textContent = Math.floor(state.cubic.cwnd);
  els.bbrCwnd.textContent = Math.floor(state.bbr.cwnd);

  chartData.labels.push(timeStep);
  chartData.cubic.push(state.cubic.cwnd);
  chartData.bbr.push(state.bbr.cwnd);

  // Keep window size manageable
  if (chartData.labels.length > 50) {
    chartData.labels.shift();
    chartData.cubic.shift();
    chartData.bbr.shift();
  }

  updateChart();
}

function updateChart() {
  chart.update();
}

function spawnPackets() {
  const cCount = Math.min(Math.ceil(state.cubic.cwnd / 5), 15);
  const bCount = Math.min(Math.ceil(state.bbr.cwnd / 5), 15);

  for (let i = 0; i < cCount; i++) {
    setTimeout(() => animatePacket(els.cubicPipe, 'cubic-pkt'), Math.random() * 400);
  }

  for (let i = 0; i < bCount; i++) {
    setTimeout(() => animatePacket(els.bbrPipe, 'bbr-pkt'), Math.random() * 400);
  }
}

function animatePacket(pipe, className) {
  if (!isRunning) return;

  const packet = document.createElement('div');
  packet.className = `packet ${className}`;

  // Random vertical offset
  const yOffset = Math.random() * (pipe.clientHeight - 20);
  packet.style.top = `${yOffset}px`;

  pipe.appendChild(packet);

  const animation = packet.animate([{ left: '0%' }, { left: '100%' }], {
    duration: 1500 + Math.random() * 500,
    easing: 'linear',
  });

  animation.onfinish = () => {
    if (packet.parentNode) packet.remove();
  };
}

function dropRandomPacket(pipe) {
  const packets = Array.from(pipe.getElementsByClassName('packet'));
  if (packets.length > 0) {
    // Pick a random packet in flight
    const target = packets[Math.floor(Math.random() * packets.length)];
    // Stop its animation (rough hack: replace node)
    const clone = target.cloneNode(true);
    const rect = target.getBoundingClientRect();
    const pipeRect = pipe.getBoundingClientRect();

    clone.style.left = `${rect.left - pipeRect.left}px`;
    clone.classList.add('dropped');

    target.remove();
    pipe.appendChild(clone);

    setTimeout(() => {
      if (clone.parentNode) clone.remove();
    }, 500);
  }
}
