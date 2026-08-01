/**
 * raft-consensus-visualizer.js
 * Implements Raft Leader Election, Log Replication,
 * Pre-Vote Extension, and Log Compaction (Snapshotting).
 *
 * References:
 *  - Ongaro & Ousterhout (2014) "In Search of an Understandable Consensus Algorithm"
 *  - Ongaro Dissertation §9.6 Pre-Vote extension
 *  - §7 Log Compaction
 */

document.addEventListener('DOMContentLoaded', () => {
  initRaft();
});

// ══════════════════════════════════════════════
// 1. CONSTANTS & STATE
// ══════════════════════════════════════════════

const ROLES = {
  FOLLOWER: 'FOLLOWER',
  CANDIDATE: 'CANDIDATE',
  LEADER: 'LEADER',
  PARTITIONED: 'PARTITIONED',
};

const COLORS = {
  [ROLES.FOLLOWER]: '#10b981',
  [ROLES.CANDIDATE]: '#3b82f6',
  [ROLES.LEADER]: '#f59e0b',
  [ROLES.PARTITIONED]: '#ef4444',
};

let nodes = []; // Array of RaftNode
let logEntries = []; // Shared committed log (visual)
let snapshotIndex = null; // last snapshotted index
let termCounter = 0;
let leaderId = null;
let partitionedIds = new Set();
let preVoteEnabled = true;

let canvas, ctx;
let packets = []; // flying messages
let electionTimers = {};
let heartbeatTimer = null;
let lastTime = performance.now();

let firewallLine = null;

const els = {
  btnInit: document.getElementById('btnInit'),
  btnSplitBrain: document.getElementById('btnSplitBrain'),
  btnHealPartition: document.getElementById('btnHealPartition'),
  nodeCountSelect: document.getElementById('nodeCountSelect'),
  electionTimeout: document.getElementById('electionTimeout'),
  electionTimeoutVal: document.getElementById('electionTimeoutVal'),
  preVoteToggle: document.getElementById('preVoteToggle'),
  preVoteDesc: document.getElementById('preVoteDesc'),
  statTerm: document.getElementById('statTerm'),
  statLeader: document.getElementById('statLeader'),
  statLog: document.getElementById('statLog'),
  statSnapshot: document.getElementById('statSnapshot'),
  logEntries: document.getElementById('logEntries'),
  logCount: document.getElementById('logCount'),
  eventLog: document.getElementById('eventLog'),
  engineBadge: document.getElementById('engineBadge'),
};

function canCommunicate(a, b) {
  if (a.role === ROLES.PARTITIONED || b.role === ROLES.PARTITIONED) return false;
  if (partitionedIds.has(a.id) || partitionedIds.has(b.id)) return false;
  if (firewallLine) {
    return !lineSegmentsIntersect(
      a.x,
      a.y,
      b.x,
      b.y,
      firewallLine.x1,
      firewallLine.y1,
      firewallLine.x2,
      firewallLine.y2
    );
  }
  return true;
}

function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const det = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
  if (det === 0) return false;
  const lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
  const gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det;
  return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
}

// ══════════════════════════════════════════════
// 2. NODE CLASS
// ══════════════════════════════════════════════

class RaftNode {
  constructor(id, x, y) {
    this.id = id;
    this.name = `N${id + 1}`;
    this.x = x;
    this.y = y;
    this.radius = 38;
    this.role = ROLES.FOLLOWER;
    this.term = 0;
    this.votedFor = null;
    this.votesReceived = 0;
    this.preVotesReceived = 0;
    this.log = []; // local log copy
    this.snapshotIndex = null;
    this.pulse = 0; // animation ring
  }

  draw(ctx) {
    const color = COLORS[this.role];

    // Election timeout ring (only for followers/candidates)
    if (electionTimers[this.id] && this.role !== ROLES.LEADER && this.role !== ROLES.PARTITIONED) {
      const remaining = electionTimers[this.id].remaining;
      const total = electionTimers[this.id].total;
      const frac = 1 - remaining / total;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 8, -Math.PI / 2, -Math.PI / 2 + frac * 2 * Math.PI);
      ctx.strokeStyle = `rgba(59,130,246,0.5)`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Pulse ring for leader
    if (this.role === ROLES.LEADER) {
      this.pulse = (this.pulse + 0.05) % (Math.PI * 2);
      const pAlpha = 0.2 + 0.2 * Math.sin(this.pulse);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 12, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(245,158,11,${pAlpha})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(this.x - 8, this.y - 8, 4, this.x, this.y, this.radius);
    grad.addColorStop(0, color + '55');
    grad.addColorStop(1, color + '18');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = this.role === ROLES.LEADER ? 3 : 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 14px Poppins';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.name, this.x, this.y - 6);

    // Role badge
    ctx.font = '9px Fira Code';
    ctx.fillStyle = color;
    ctx.fillText(this.role === ROLES.PARTITIONED ? 'ISOLATED' : this.role, this.x, this.y + 9);

    // Term
    ctx.font = '8px Fira Code';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`term:${this.term}`, this.x, this.y + 20);

    // Snapshot icon
    if (this.snapshotIndex !== null) {
      ctx.font = '10px sans-serif';
      ctx.fillText('📦', this.x + this.radius - 6, this.y - this.radius + 6);
    }
  }
}

// ══════════════════════════════════════════════
// 3. PACKET (FLYING MESSAGES)
// ══════════════════════════════════════════════

class Packet {
  constructor(fromNode, toNode, type, color) {
    this.from = fromNode;
    this.to = toNode;
    this.type = type;
    this.color = color;
    this.progress = 0;
    this.speed = 0.025;
  }

  update() {
    this.progress += this.speed;
    return this.progress >= 1;
  }

  draw(ctx) {
    const px = this.from.x + (this.to.x - this.from.x) * this.progress;
    const py = this.from.y + (this.to.y - this.from.y) * this.progress;

    // trail
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(this.from.x, this.from.y);
    ctx.lineTo(this.to.x, this.to.y);
    ctx.strokeStyle = this.color + '22';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // dot
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // label
    ctx.fillStyle = this.color;
    ctx.font = '8px Fira Code';
    ctx.textAlign = 'center';
    ctx.fillText(this.type, px, py - 9);
  }
}

// ══════════════════════════════════════════════
// 4. INIT
// ══════════════════════════════════════════════

function initRaft() {
  canvas = document.getElementById('raftCanvas');
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  els.electionTimeout.addEventListener('input', (e) => {
    els.electionTimeoutVal.textContent = `${e.target.value}ms`;
  });

  els.preVoteToggle.addEventListener('change', () => {
    preVoteEnabled = els.preVoteToggle.checked;
    els.preVoteDesc.textContent = preVoteEnabled ? 'Enabled' : 'Disabled';
    els.preVoteDesc.style.color = preVoteEnabled ? '#10b981' : '#ef4444';
  });

  els.btnInit.addEventListener('click', startCluster);
  els.btnSplitBrain.addEventListener('click', triggerSplitBrain);
  els.btnHealPartition.addEventListener('click', healPartition);

  lastTime = performance.now();
  requestAnimationFrame(renderLoop);
}

function resizeCanvas() {
  const wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}

function startCluster() {
  // Clear everything
  clearAllTimers();
  nodes = [];
  packets = [];
  logEntries = [];
  snapshotIndex = null;
  termCounter = 0;
  leaderId = null;
  partitionedIds = new Set();
  renderLogPanel();
  updateStats();

  const count = parseInt(els.nodeCountSelect.value);
  spawnNodes(count);

  nodes.forEach((n) => resetElectionTimer(n.id));

  log('Cluster initialized with ' + count + ' nodes. Waiting for election...', 'info');

  els.btnSplitBrain.disabled = false;
  els.btnHealPartition.disabled = false;
}

function spawnNodes(count) {
  const cw = canvas.width,
    ch = canvas.height;
  const cx = cw / 2,
    cy = ch / 2;
  const r = Math.min(cw, ch) * 0.32;

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    nodes.push(new RaftNode(i, x, y));
  }
}

// ══════════════════════════════════════════════
// 5. ELECTION (with Pre-Vote)
// ══════════════════════════════════════════════

function startElection(candidateId) {
  if (!nodes[candidateId] || nodes[candidateId].role === ROLES.PARTITIONED) return;

  termCounter++;
  const candidate = nodes[candidateId];
  candidate.term = termCounter;
  candidate.votedFor = candidateId;
  candidate.votesReceived = 0;
  candidate.preVotesReceived = 0;

  if (preVoteEnabled) {
    // Phase 0: Pre-Vote — ask peers "would you vote for me?"
    candidate.role = ROLES.FOLLOWER; // stays follower during pre-vote
    log(`[Pre-Vote] ${candidate.name} soliciting Pre-Vote at term ${termCounter}`, 'prevote');

    let preVoteCount = 1; // votes for itself
    const peers = nodes.filter((n) => n.id !== candidateId && canCommunicate(candidate, n));

    peers.forEach((peer) => {
      packets.push(new Packet(candidate, peer, 'PRE-VOTE', '#38bdf8'));

      // Simulate peers responding — they grant if they haven't seen a leader recently
      setTimeout(
        () => {
          if (nodes[candidateId].role === ROLES.PARTITIONED) return;
          packets.push(new Packet(peer, candidate, 'PRV-OK', '#38bdf8'));
          preVoteCount++;
          if (preVoteCount > nodes.length / 2) {
            log(
              `[Pre-Vote] ${candidate.name} received majority Pre-Votes. Upgrading to Candidate.`,
              'prevote'
            );
            promoteToCandidateAndVote(candidateId);
          }
        },
        300 + Math.random() * 200
      );
    });

    if (peers.length === 0) {
      // No peers to ask — isolated, don't inflate term
      log(
        `[Pre-Vote] ${candidate.name} is isolated. Term NOT incremented (Pre-Vote protection).`,
        'warn'
      );
      termCounter--; // revert term increment
      candidate.term = termCounter;
    }
  } else {
    // Skip Pre-Vote — directly become candidate
    promoteToCandidateAndVote(candidateId);
  }
}

function promoteToCandidateAndVote(candidateId) {
  const candidate = nodes[candidateId];
  if (!candidate || candidate.role === ROLES.PARTITIONED) return;

  candidate.role = ROLES.CANDIDATE;
  candidate.votesReceived = 1; // votes for itself
  log(`${candidate.name} becomes Candidate for term ${candidate.term}`, 'elect');
  updateStats();

  // Send RequestVote to all peers
  const peers = nodes.filter((n) => n.id !== candidateId && canCommunicate(candidate, n));

  peers.forEach((peer) => {
    packets.push(new Packet(candidate, peer, 'REQ-VOTE', '#3b82f6'));

    setTimeout(
      () => {
        if (candidate.role !== ROLES.CANDIDATE) return;
        // Grant vote if peer hasn't voted in this term
        if (
          peer.term < candidate.term ||
          (peer.term === candidate.term && peer.votedFor === null)
        ) {
          peer.votedFor = candidateId;
          peer.term = candidate.term;
          packets.push(new Packet(peer, candidate, 'VOTE✓', '#10b981'));

          candidate.votesReceived++;
          log(`${peer.name} → ${candidate.name}: Vote GRANTED (term ${candidate.term})`, 'elect');

          if (candidate.votesReceived > nodes.length / 2 && candidate.role === ROLES.CANDIDATE) {
            becomeLeader(candidateId);
          }
        } else {
          packets.push(new Packet(peer, candidate, 'VOTE✗', '#ef4444'));
          log(`${peer.name} → ${candidate.name}: Vote DENIED`, 'info');

          // STEP DOWN LOGIC
          if (peer.term > candidate.term) {
            candidate.term = peer.term;
            candidate.role = ROLES.FOLLOWER;
            candidate.votedFor = null;
            resetElectionTimer(candidateId);
            log(`${candidate.name} stepped down (saw higher term ${peer.term})`, 'warn');
            updateStats();
          }
        }
      },
      400 + Math.random() * 300
    );
  });

  // Timeout if no majority (using configured timeout + random jitter to resolve split votes)
  const baseTimeout = parseInt(els.electionTimeout.value, 10) || 2500;
  const jitter = Math.random() * 1000;
  setTimeout(() => {
    if (candidate.role === ROLES.CANDIDATE) {
      log(`${candidate.name} election timed out. Retrying...`, 'warn');
      startElection(candidateId);
    }
  }, baseTimeout + jitter);
}

function becomeLeader(nodeId) {
  // Demote previous leader
  if (leaderId !== null && nodes[leaderId]) {
    if (nodes[leaderId].role === ROLES.LEADER) {
      nodes[leaderId].role = ROLES.FOLLOWER;
    }
  }

  leaderId = nodeId;
  const leader = nodes[nodeId];
  leader.role = ROLES.LEADER;
  leader.votesReceived = 0;
  delete electionTimers[nodeId];

  // All other non-partitioned become followers
  nodes.forEach((n) => {
    if (n.id !== nodeId && canCommunicate(leader, n)) {
      n.role = ROLES.FOLLOWER;
      n.term = leader.term;
      n.votedFor = null;
      resetElectionTimer(n.id);
    }
  });

  log(`🏆 ${leader.name} elected LEADER for term ${leader.term}`, 'leader');
  updateStats();
  sendHeartbeats();
  scheduleHeartbeat();
}

// ══════════════════════════════════════════════
// 6. HEARTBEATS & REPLICATION
// ══════════════════════════════════════════════

function scheduleHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(sendHeartbeats, 1200);
}

function sendHeartbeats() {
  if (leaderId === null) return;
  const leader = nodes[leaderId];
  if (!leader || leader.role !== ROLES.LEADER) return;

  const followers = nodes.filter((n) => n.id !== leaderId && canCommunicate(leader, n));
  followers.forEach((f) => {
    packets.push(new Packet(leader, f, 'HB', '#10b981'));

    // Simulate follower receiving heartbeat
    setTimeout(
      () => {
        if (!canCommunicate(leader, f)) return;
        if (leader.term >= f.term) {
          f.term = leader.term;
          if (f.role !== ROLES.FOLLOWER) {
            f.role = ROLES.FOLLOWER;
            f.votedFor = null;
            log(
              `${f.name} stepped down to FOLLOWER (received heartbeat from ${leader.name})`,
              'warn'
            );
          }
          resetElectionTimer(f.id);
          // TRUNCATE CONFLICTING LOGS (visual simplification)
          if (
            f.log.length > leader.log.length ||
            (f.log.length > 0 &&
              leader.log.length > 0 &&
              f.log[f.log.length - 1].term !== leader.log[leader.log.length - 1].term)
          ) {
            f.log = leader.log.slice();
          }
          updateStats();
        }
      },
      400 + Math.random() * 200
    );
  });
}

function triggerSplitBrain() {
  if (nodes.length < 5) {
    log('Need at least 5 nodes for a proper 3v2 Split-Brain simulation.', 'warn');
    return;
  }

  // Clear any existing firewall
  partitionedIds.clear();

  // For 5 nodes, we partition 3 vs 2.
  // Nodes are in a circle. Node 0 is at top (x=cx), Nodes 1,2 are right, Nodes 3,4 are left.
  // We draw a vertical line slightly to the left of center to separate {3,4} from {0,1,2}.
  const cw = canvas.width,
    ch = canvas.height;
  const cx = cw / 2;
  const r = Math.min(cw, ch) * 0.32;

  firewallLine = {
    x1: cx - r * 0.25,
    y1: 0,
    x2: cx - r * 0.25,
    y2: ch,
  };

  log('✂️ Network Severed! Partition 1 (N1, N2, N3) vs Partition 2 (N4, N5)', 'warn');

  // Demote leader if any to restart election and show the timeout loop
  if (leaderId !== null) {
    if (nodes[leaderId]) {
      nodes[leaderId].role = ROLES.FOLLOWER;
    }
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    leaderId = null;
  }
  updateStats();

  // Trigger elections by resetting timers
  nodes.forEach((n) => {
    resetElectionTimer(n.id);
  });
}

function healPartition() {
  firewallLine = null;
  partitionedIds.clear();
  log('🩹 Network Healed! Partitions resolving...', 'info');

  // Trigger elections by resetting timers
  nodes.forEach((n) => {
    if (n.role !== ROLES.LEADER) {
      resetElectionTimer(n.id);
    }
  });

  updateStats();
}

// ══════════════════════════════════════════════
// 9. RENDER LOOP
// ══════════════════════════════════════════════

function renderLoop(time) {
  if (!time) time = performance.now();
  const dt = time - lastTime;
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Decrease election timers
  Object.keys(electionTimers).forEach((id) => {
    const t = electionTimers[id];
    t.remaining -= dt;
    if (t.remaining <= 0) {
      delete electionTimers[id];
      startElection(parseInt(id));
    }
  });

  if (firewallLine) {
    ctx.beginPath();
    ctx.moveTo(firewallLine.x1, firewallLine.y1);
    ctx.lineTo(firewallLine.x2, firewallLine.y2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw connections
  if (nodes.length > 1) {
    nodes.forEach((a) => {
      nodes.forEach((b) => {
        if (b.id <= a.id) return;
        const isPartitioned = !canCommunicate(a, b);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isPartitioned ? 'rgba(239,68,68,0.2)' : 'rgba(31,41,55,0.8)';
        ctx.lineWidth = isPartitioned ? 1 : 1.5;
        ctx.setLineDash(isPartitioned ? [5, 5] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });
  }

  // Draw packets
  const toRemove = [];
  packets.forEach((p, i) => {
    if (p.update()) toRemove.push(i);
    else p.draw(ctx);
  });
  toRemove.reverse().forEach((i) => packets.splice(i, 1));

  // Draw nodes
  nodes.forEach((n) => n.draw(ctx));

  requestAnimationFrame(renderLoop);
}

// ══════════════════════════════════════════════
// 10. UI HELPERS
// ══════════════════════════════════════════════

function renderLogPanel() {
  const container = els.logEntries;
  container.innerHTML = '';

  // Show snapshot block if compaction happened
  if (snapshotIndex !== null) {
    const marker = document.createElement('div');
    marker.className = 'snapshot-marker';
    marker.innerHTML = `📦 Snapshot<br><span style="font-size:0.65rem">idx ≤ ${snapshotIndex}</span>`;
    container.appendChild(marker);
  }

  // Show non-snapshotted entries
  const visible = logEntries.filter((e) => !e.snapshotted);
  visible.forEach((e) => {
    const div = document.createElement('div');
    div.className = `log-entry ${e.committed ? 'committed' : 'uncommitted'}`;
    div.innerHTML = `<div class="entry-term">term ${e.term}</div><div>#${e.index}</div><div>${e.cmd}</div>`;
    container.appendChild(div);
  });

  els.logCount.textContent = `${logEntries.length} entries`;
}

function updateStats() {
  const leader = leaderId !== null ? nodes[leaderId] : null;
  els.statTerm.textContent = termCounter;
  els.statLeader.textContent = leader ? leader.name : '–';
  els.statLog.textContent = logEntries.filter((e) => e.committed).length;
  els.statSnapshot.textContent = snapshotIndex !== null ? `idx ${snapshotIndex}` : 'None';
}

function log(msg, type = 'info') {
  const div = document.createElement('div');
  div.className = `log-line ${type}`;
  const time = new Date().toLocaleTimeString('en', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  div.textContent = `[${time}] ${msg}`;
  els.eventLog.appendChild(div);
  els.eventLog.scrollTop = els.eventLog.scrollHeight;

  // Keep log from growing too large
  while (els.eventLog.children.length > 120) {
    els.eventLog.removeChild(els.eventLog.firstChild);
  }
}

function clearAllTimers() {
  electionTimers = {};
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function resetElectionTimer(nodeId) {
  const baseTimeout = parseInt(els.electionTimeout.value);
  const total = baseTimeout + Math.random() * baseTimeout;
  electionTimers[nodeId] = { total: total, remaining: total };
}
