/* global lazyVisualizer, Chart */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lazyVisualizer !== 'undefined' && lazyVisualizer.loadChartJs) {
    lazyVisualizer.loadChartJs(() => initVisualizer());
  } else {
    // Fallback if lazyVisualizer isn't available
    initVisualizer();
  }
});

let cwnd = 1;
let ssthresh = 64;
let time = 0;
let isRunning = false;
let intervalId = null;
let chart = null;

const chartData = {
  labels: [0],
  datasets: [
    {
      label: 'CWND',
      data: [1],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.1,
    },
    {
      label: 'ssthresh',
      data: [64],
      borderColor: '#a855f7',
      borderDash: [5, 5],
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
    },
  ],
};

function initVisualizer() {
  const ctx = document.getElementById('cwndChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      scales: {
        x: {
          title: { display: true, text: 'Time (RTTs)', color: '#94a3b8' },
          ticks: { color: '#94a3b8' },
          grid: { color: '#334155' },
        },
        y: {
          title: { display: true, text: 'Window Size (Segments)', color: '#94a3b8' },
          min: 0,
          max: 100,
          ticks: { color: '#94a3b8' },
          grid: { color: '#334155' },
        },
      },
      plugins: {
        legend: { labels: { color: '#f8fafc' } },
      },
    },
  });

  document.getElementById('btnStart').addEventListener('click', toggleSimulation);
  document.getElementById('btnDropPacket').addEventListener('click', triggerPacketDrop);
  document.getElementById('btnReset').addEventListener('click', resetSimulation);
}

function toggleSimulation() {
  const btnStart = document.getElementById('btnStart');
  if (isRunning) {
    isRunning = false;
    clearInterval(intervalId);
    btnStart.innerHTML = '<i class="fas fa-play"></i> Resume Transmission';
    btnStart.classList.replace('btn-secondary', 'btn-primary');
    document.getElementById('btnDropPacket').disabled = true;
  } else {
    isRunning = true;
    intervalId = setInterval(tick, 1000);
    btnStart.innerHTML = '<i class="fas fa-pause"></i> Pause Transmission';
    btnStart.classList.replace('btn-primary', 'btn-secondary');
    document.getElementById('btnDropPacket').disabled = false;
  }
}

function resetSimulation() {
  isRunning = false;
  clearInterval(intervalId);
  cwnd = 1;
  ssthresh = 64;
  time = 0;

  chartData.labels = [0];
  chartData.datasets[0].data = [1];
  chartData.datasets[1].data = [64];
  chart.update();

  updateUI();

  const btnStart = document.getElementById('btnStart');
  btnStart.innerHTML = '<i class="fas fa-play"></i> Start Transmission';
  btnStart.classList.replace('btn-secondary', 'btn-primary');
  document.getElementById('btnDropPacket').disabled = true;
  document.getElementById('tcpPipe').innerHTML = '';
}

function triggerPacketDrop() {
  if (!isRunning) return;
  // AIMD: Multiplicative Decrease
  ssthresh = Math.max(2, Math.floor(cwnd / 2));
  cwnd = ssthresh; // Fast Recovery behavior (halving window and resuming linear)

  updateUI();

  // Show a dropped packet animation
  spawnPacket(true);
}

function tick() {
  time++;

  // Slow Start vs Congestion Avoidance
  if (cwnd < ssthresh) {
    // Exponential Growth
    cwnd *= 2;
    if (cwnd > ssthresh) cwnd = ssthresh;
  } else {
    // Additive Increase
    cwnd += 1;
  }

  // Cap cwnd for visualization scale
  if (cwnd > 100) cwnd = 100;

  chartData.labels.push(time);
  chartData.datasets[0].data.push(cwnd);
  chartData.datasets[1].data.push(ssthresh);

  // Keep last 30 RTTs
  if (chartData.labels.length > 30) {
    chartData.labels.shift();
    chartData.datasets[0].data.shift();
    chartData.datasets[1].data.shift();
  }

  chart.update();
  updateUI();

  // Spawn successful packet animations based on cwnd size
  const numPackets = Math.min(5, Math.ceil(cwnd / 10));
  for (let i = 0; i < numPackets; i++) {
    setTimeout(() => spawnPacket(false), i * 150);
  }
}

function updateUI() {
  document.getElementById('currentCwnd').textContent = cwnd;
  document.getElementById('currentSsthresh').textContent = ssthresh;

  const phaseBadge = document.getElementById('phaseBadge');
  if (cwnd < ssthresh) {
    phaseBadge.textContent = 'Slow Start';
    phaseBadge.style.color = '#3b82f6';
    phaseBadge.style.background = 'rgba(59, 130, 246, 0.2)';
  } else {
    phaseBadge.textContent = 'Congestion Avoidance';
    phaseBadge.style.color = '#10b981';
    phaseBadge.style.background = 'rgba(16, 185, 129, 0.2)';
  }
}

function spawnPacket(isDrop) {
  const pipe = document.getElementById('tcpPipe');
  const pkt = document.createElement('div');
  pkt.className = 'packet' + (isDrop ? ' drop' : '');
  pipe.appendChild(pkt);

  let start = 0;
  let end = pipe.clientWidth - 20;
  if (isDrop) {
    end = end / 2; // stops in the middle
  }

  let pos = start;
  const speed = isDrop ? 3 : 5;

  function animate() {
    pos += speed;
    if (pos >= end) {
      if (isDrop) {
        pkt.style.opacity = '0';
        setTimeout(() => pkt.remove(), 200);
      } else {
        pkt.remove();
      }
      return;
    }
    pkt.style.left = pos + 'px';
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
