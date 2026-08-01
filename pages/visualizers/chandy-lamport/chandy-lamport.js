/**
 * chandy-lamport.js
 * Visualizes the Chandy-Lamport distributed snapshot algorithm on a canvas.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSimulation();
});

const els = {
  canvas: document.getElementById('networkCanvas'),
  btnStartTraffic: document.getElementById('btnStartTraffic'),
  btnInitiateSnapshot: document.getElementById('btnInitiateSnapshot'),
  btnReset: document.getElementById('btnReset'),
  systemTotal: document.getElementById('systemTotal'),
  snapshotStatus: document.getElementById('snapshotStatus'),
  recordedStates: document.getElementById('recordedStates'),
};

let ctx;
let _animationId;
let lastTime = 0;

// Simulation State
let isTrafficRunning = false;
let snapshotActive = false;
let trafficInterval;

const INITIAL_TOKENS = 500;
let nodes = [];
let channels = [];
let messages = []; // tokens and markers in flight

class Node {
  constructor(id, label, x, y) {
    this.id = id;
    this.label = label;
    this.x = x;
    this.y = y;
    this.radius = 35;
    this.balance = INITIAL_TOKENS;

    // Snapshot state
    this.hasRecordedState = false;
    this.recordedBalance = 0;
    this.recordingChannels = new Set(); // channel ids it is recording
    this.savedChannelStates = {}; // channel_id -> tokens
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.hasRecordedState ? '#10b981' : '#1e293b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.hasRecordedState ? '#059669' : '#38bdf8';
    if (snapshotActive && !this.hasRecordedState) {
      // Waiting for marker
      ctx.strokeStyle = '#fbbf24';
    }
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px Poppins';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, this.x, this.y - 10);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '14px Fira Code';
    ctx.fillText(`$${this.balance}`, this.x, this.y + 12);
  }
}

class Channel {
  constructor(id, source, target) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.recordedState = null; // will be a number when snapshot complete
  }

  draw(ctx) {
    const dx = this.target.x - this.source.x;
    const dy = this.target.y - this.source.y;
    const angle = Math.atan2(dy, dx);

    // Offset start/end by node radius
    const startX = this.source.x + Math.cos(angle) * this.source.radius;
    const startY = this.source.y + Math.sin(angle) * this.source.radius;
    const endX = this.target.x - Math.cos(angle) * this.target.radius;
    const endY = this.target.y - Math.sin(angle) * this.target.radius;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = 2;

    // Is target recording this channel?
    if (this.target.recordingChannels.has(this.id)) {
      ctx.strokeStyle = '#fbbf24'; // yellow means recording
      ctx.setLineDash([5, 5]);
    } else if (this.recordedState !== null) {
      ctx.strokeStyle = '#10b981'; // green means done
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = '#475569';
      ctx.setLineDash([]);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - 10 * Math.cos(angle - Math.PI / 6),
      endY - 10 * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - 10 * Math.cos(angle + Math.PI / 6),
      endY - 10 * Math.sin(angle + Math.PI / 6)
    );
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }
}

class Message {
  constructor(type, channel, amount = 0) {
    this.type = type; // 'token' or 'marker'
    this.channel = channel;
    this.amount = amount;
    this.progress = 0; // 0.0 to 1.0
    this.speed = 0.5 + Math.random() * 0.5; // per second
  }

  update(dt) {
    this.progress += this.speed * dt;
    return this.progress >= 1.0;
  }

  draw(ctx) {
    const dx = this.channel.target.x - this.channel.source.x;
    const dy = this.channel.target.y - this.channel.source.y;

    const x = this.channel.source.x + dx * this.progress;
    const y = this.channel.source.y + dy * this.progress;

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);

    if (this.type === 'token') {
      ctx.fillStyle = '#38bdf8'; // blue token
    } else {
      ctx.fillStyle = '#ef4444'; // red marker
    }

    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }
}

function initSimulation() {
  ctx = els.canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  setupNetwork();

  els.btnStartTraffic.addEventListener('click', toggleTraffic);
  els.btnInitiateSnapshot.addEventListener('click', initiateSnapshot);
  els.btnReset.addEventListener('click', resetSimulation);

  lastTime = performance.now();
  _animationId = requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const parent = els.canvas.parentElement;
  els.canvas.width = parent.clientWidth;
  els.canvas.height = parent.clientHeight;
}

function setupNetwork() {
  nodes = [];
  channels = [];
  messages = [];
  snapshotActive = false;
  isTrafficRunning = false;
  els.recordedStates.innerHTML = '';
  updateStatus('Waiting to start snapshot...', 'waiting');

  els.btnStartTraffic.innerHTML = '<i class="fas fa-random"></i> Start Token Traffic';
  els.btnInitiateSnapshot.disabled = false;

  const w = els.canvas.width;
  const h = els.canvas.height;

  // Triangle layout
  const nA = new Node('A', 'Node A', w / 2, 60);
  const nB = new Node('B', 'Node B', w / 2 - 120, h - 80);
  const nC = new Node('C', 'Node C', w / 2 + 120, h - 80);

  nodes.push(nA, nB, nC);

  // Full duplex (A-B, B-C, C-A)
  channels.push(new Channel('AB', nA, nB));
  channels.push(new Channel('BA', nB, nA));
  channels.push(new Channel('BC', nB, nC));
  channels.push(new Channel('CB', nC, nB));
  channels.push(new Channel('CA', nC, nA));
  channels.push(new Channel('AC', nA, nC));
}

function toggleTraffic() {
  isTrafficRunning = !isTrafficRunning;
  if (isTrafficRunning) {
    els.btnStartTraffic.innerHTML = '<i class="fas fa-pause"></i> Pause Traffic';
    trafficInterval = setInterval(sendRandomToken, 1000);
  } else {
    els.btnStartTraffic.innerHTML = '<i class="fas fa-random"></i> Resume Traffic';
    clearInterval(trafficInterval);
  }
}

function sendRandomToken() {
  const src = nodes[Math.floor(Math.random() * nodes.length)];
  if (src.balance < 10) return;

  const amount = 10;
  src.balance -= amount;

  // Find outgoing channels
  const outChannels = channels.filter((c) => c.source === src);
  const ch = outChannels[Math.floor(Math.random() * outChannels.length)];

  messages.push(new Message('token', ch, amount));
  updateTotal();
}

function initiateSnapshot() {
  if (snapshotActive) return;
  snapshotActive = true;
  els.btnInitiateSnapshot.disabled = true;
  updateStatus('Snapshot in progress...', 'in-progress');

  // Node A initiates
  const initiator = nodes[0];
  recordNodeState(initiator);
}

function recordNodeState(node) {
  node.hasRecordedState = true;
  node.recordedBalance = node.balance;

  logState(`node-state`, `[Node ${node.label}] recorded state: $${node.balance}`);

  // Start recording on all incoming channels
  const incomingChannels = channels.filter((c) => c.target === node);
  for (let c of incomingChannels) {
    node.recordingChannels.add(c.id);
    node.savedChannelStates[c.id] = 0;
  }

  // Send Markers on all outgoing channels
  const outChannels = channels.filter((c) => c.source === node);
  for (let c of outChannels) {
    messages.push(new Message('marker', c, 0));
  }

  checkSnapshotCompletion();
}

function processMessageArrival(msg) {
  const target = msg.channel.target;

  if (msg.type === 'token') {
    target.balance += msg.amount;

    // If target is recording this channel, capture the token
    if (target.recordingChannels.has(msg.channel.id)) {
      target.savedChannelStates[msg.channel.id] += msg.amount;
    }
    updateTotal();
  } else if (msg.type === 'marker') {
    if (!target.hasRecordedState) {
      // First marker received!
      recordNodeState(target);
      // By rule, the channel on which first marker arrives is empty
      target.recordingChannels.delete(msg.channel.id);
      msg.channel.recordedState = 0;
      logState('channel-state', `[Channel ${msg.channel.source.id}->${target.id}] state: $0`);
    } else {
      // Subsequent marker received. Stop recording this channel.
      if (target.recordingChannels.has(msg.channel.id)) {
        target.recordingChannels.delete(msg.channel.id);
        const captured = target.savedChannelStates[msg.channel.id];
        msg.channel.recordedState = captured;
        logState(
          'channel-state',
          `[Channel ${msg.channel.source.id}->${target.id}] state: $${captured} (in-flight tokens)`
        );
      }
    }
    checkSnapshotCompletion();
  }
}

function checkSnapshotCompletion() {
  const allNodesRecorded = nodes.every((n) => n.hasRecordedState);
  const allChannelsRecorded = channels.every((c) => c.recordedState !== null);

  if (allNodesRecorded && allChannelsRecorded && snapshotActive) {
    // We are done!
    snapshotActive = false;

    let totalRecorded = 0;
    nodes.forEach((n) => (totalRecorded += n.recordedBalance));
    channels.forEach((c) => (totalRecorded += c.recordedState));

    updateStatus(`Snapshot Complete! Total Captured: $${totalRecorded}`, 'complete');

    if (isTrafficRunning) {
      toggleTraffic(); // pause to observe
    }
  }
}

function logState(type, text) {
  const el = document.createElement('div');
  el.className = `log-entry ${type}`;
  el.textContent = text;
  els.recordedStates.prepend(el);
}

function updateStatus(text, className) {
  els.snapshotStatus.innerHTML = `<div class="status-indicator ${className}">${text}</div>`;
}

function updateTotal() {
  let total = 0;
  nodes.forEach((n) => (total += n.balance));
  messages.forEach((m) => {
    if (m.type === 'token') total += m.amount;
  });
  els.systemTotal.textContent = total;
}

function resetSimulation() {
  if (trafficInterval) clearInterval(trafficInterval);
  setupNetwork();
}

function gameLoop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  update(dt);
  draw();

  _animationId = requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Cap dt for lag spikes
  const safeDt = Math.min(dt, 0.1);

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.update(safeDt)) {
      processMessageArrival(msg);
      messages.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);

  channels.forEach((c) => c.draw(ctx));
  messages.forEach((m) => m.draw(ctx));
  nodes.forEach((n) => n.draw(ctx));
}
