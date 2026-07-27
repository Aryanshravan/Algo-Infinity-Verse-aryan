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

const ROLES = { FOLLOWER: 'FOLLOWER', CANDIDATE: 'CANDIDATE', LEADER: 'LEADER', PARTITIONED: 'PARTITIONED' };

const COLORS = {
  [ROLES.FOLLOWER]:    '#10b981',
  [ROLES.CANDIDATE]:  '#3b82f6',
  [ROLES.LEADER]:     '#f59e0b',
  [ROLES.PARTITIONED]:'#ef4444',
};

let nodes = [];      // Array of RaftNode
let logEntries = []; // Shared committed log (visual)
let snapshotIndex = null; // last snapshotted index
let commandCounter = 0;
let termCounter = 0;
let leaderId = null;
let partitionedIds = new Set();
let preVoteEnabled = true;

let canvas, ctx, animFrame;
let packets = []; // flying messages
let electionTimers = {};
let heartbeatTimer = null;

const MAX_LOG_BEFORE_SNAPSHOT = 8;

const els = {
  btnInit:           document.getElementById('btnInit'),
  btnAppendLog:      document.getElementById('btnAppendLog'),
  btnPartitionLeader:document.getElementById('btnPartitionLeader'),
  btnHealPartition:  document.getElementById('btnHealPartition'),
  btnCompactLog:     document.getElementById('btnCompactLog'),
  nodeCountSelect:   document.getElementById('nodeCountSelect'),
  electionTimeout:   document.getElementById('electionTimeout'),
  electionTimeoutVal:document.getElementById('electionTimeoutVal'),
  preVoteToggle:     document.getElementById('preVoteToggle'),
  preVoteDesc:       document.getElementById('preVoteDesc'),
  statTerm:          document.getElementById('statTerm'),
  statLeader:        document.getElementById('statLeader'),
  statLog:           document.getElementById('statLog'),
  statSnapshot:      document.getElementById('statSnapshot'),
  logEntries:        document.getElementById('logEntries'),
  logCount:          document.getElementById('logCount'),
  eventLog:          document.getElementById('eventLog'),
  engineBadge:       document.getElementById('engineBadge'),
};

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
      const frac = 1 - (remaining / total);
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
  els.btnAppendLog.addEventListener('click', clientAppendCommand);
  els.btnPartitionLeader.addEventListener('click', partitionLeader);
  els.btnHealPartition.addEventListener('click', healPartition);
  els.btnCompactLog.addEventListener('click', triggerSnapshot);

  renderLoop();
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
  commandCounter = 0;
  termCounter = 0;
  leaderId = null;
  partitionedIds = new Set();
  renderLogPanel();
  updateStats();

  const count = parseInt(els.nodeCountSelect.value);
  spawnNodes(count);
  log('Cluster initialized with ' + count + ' nodes. Waiting for election...', 'info');

  // Elect an initial leader quickly
  setTimeout(() => startElection(0), 600);

  els.btnAppendLog.disabled = false;
  els.btnPartitionLeader.disabled = false;
  els.btnHealPartition.disabled = false;
  els.btnCompactLog.disabled = false;
}

function spawnNodes(count) {
  const cw = canvas.width, ch = canvas.height;
  const cx = cw / 2, cy = ch / 2;
  const r = Math.min(cw, ch) * 0.32;

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i / count) - Math.PI / 2;
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
    const peers = nodes.filter(n => n.id !== candidateId && n.role !== ROLES.PARTITIONED && !partitionedIds.has(n.id));

    peers.forEach(peer => {
      packets.push(new Packet(candidate, peer, 'PRE-VOTE', '#38bdf8'));

      // Simulate peers responding — they grant if they haven't seen a leader recently
      setTimeout(() => {
        if (nodes[candidateId].role === ROLES.PARTITIONED) return;
        packets.push(new Packet(peer, candidate, 'PRV-OK', '#38bdf8'));
        preVoteCount++;
        if (preVoteCount > nodes.length / 2) {
          log(`[Pre-Vote] ${candidate.name} received majority Pre-Votes. Upgrading to Candidate.`, 'prevote');
          promoteToCandidateAndVote(candidateId);
        }
      }, 300 + Math.random() * 200);
    });

    if (peers.length === 0) {
      // No peers to ask — isolated, don't inflate term
      log(`[Pre-Vote] ${candidate.name} is isolated. Term NOT incremented (Pre-Vote protection).`, 'warn');
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
  const peers = nodes.filter(n => n.id !== candidateId && n.role !== ROLES.PARTITIONED && !partitionedIds.has(n.id));

  peers.forEach(peer => {
    packets.push(new Packet(candidate, peer, 'REQ-VOTE', '#3b82f6'));

    setTimeout(() => {
      if (candidate.role !== ROLES.CANDIDATE) return;
      // Grant vote if peer hasn't voted in this term
      if (peer.term < candidate.term || (peer.term === candidate.term && peer.votedFor === null)) {
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
      }
    }, 400 + Math.random() * 300);
  });

  // Timeout if no majority
  setTimeout(() => {
    if (candidate.role === ROLES.CANDIDATE) {
      log(`${candidate.name} election timed out. Retrying...`, 'warn');
      startElection(candidateId);
    }
  }, 2500);
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

  // All other non-partitioned become followers
  nodes.forEach(n => {
    if (n.id !== nodeId && n.role !== ROLES.PARTITIONED) {
      n.role = ROLES.FOLLOWER;
      n.term = leader.term;
      n.votedFor = null;
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

  const followers = nodes.filter(n => n.id !== leaderId && n.role !== ROLES.PARTITIONED && !partitionedIds.has(n.id));
  followers.forEach(f => {
    packets.push(new Packet(leader, f, 'HB', '#10b981'));
  });
}

function clientAppendCommand() {
  if (leaderId === null) { log('No leader elected yet!', 'warn'); return; }
  const leader = nodes[leaderId];
  if (!leader || leader.role !== ROLES.LEADER) { log('Leader not available!', 'warn'); return; }

  commandCounter++;
  const cmd = `set:x=${commandCounter}`;
  const entry = { index: logEntries.length + 1, term: leader.term, cmd, committed: false };
  logEntries.push(entry);

  log(`Client → ${leader.name}: Append [${cmd}]`, 'repl');

  // Replicate to followers
  const followers = nodes.filter(n => n.id !== leaderId && !partitionedIds.has(n.id) && n.role !== ROLES.PARTITIONED);
  let acks = 1; // leader counts itself

  followers.forEach(f => {
    packets.push(new Packet(leader, f, 'AppEnt', '#0ea5e9'));

    setTimeout(() => {
      packets.push(new Packet(f, leader, 'ACK', '#10b981'));
      f.log.push(entry);
      acks++;

      if (acks > nodes.length / 2 && !entry.committed) {
        entry.committed = true;
        leader.log.push(entry);
        log(`Entry [${cmd}] committed (majority ACK)`, 'repl');
        renderLogPanel();
        updateStats();

        // Auto-snapshot if log is too large
        if (logEntries.filter(e => e.committed && e.index > (snapshotIndex || 0)).length >= MAX_LOG_BEFORE_SNAPSHOT) {
          setTimeout(() => triggerSnapshot(), 500);
        }
      }
    }, 300 + Math.random() * 200);
  });

  renderLogPanel();
  updateStats();
}

// ══════════════════════════════════════════════
// 7. PARTITION & HEAL
// ══════════════════════════════════════════════

function partitionLeader() {
  if (leaderId === null) { log('No leader to partition!', 'warn'); return; }

  const leader = nodes[leaderId];
  partitionedIds.add(leaderId);
  leader.role = ROLES.PARTITIONED;

  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  leaderId = null;

  log(`⚠ ${leader.name} partitioned from cluster!`, 'warn');
  updateStats();

  // Remaining nodes trigger new election after a delay
  const remaining = nodes.filter(n => n.role !== ROLES.PARTITIONED && !partitionedIds.has(n.id));
  if (remaining.length > 0) {
    const nextCandidate = remaining[Math.floor(Math.random() * remaining.length)];
    setTimeout(() => startElection(nextCandidate.id), 1200);
  }
}

function healPartition() {
  partitionedIds.forEach(id => {
    const node = nodes[id];
    if (node) {
      node.role = ROLES.FOLLOWER;
      if (leaderId !== null) {
        node.term = nodes[leaderId].term;
      }
      node.votedFor = null;
      log(`${node.name} rejoined cluster. Catching up via InstallSnapshot...`, 'snap');

      // Send InstallSnapshot from leader to reconnected node
      if (leaderId !== null) {
        const leader = nodes[leaderId];
        packets.push(new Packet(leader, node, 'SNAPSHOT', '#a855f7'));

        setTimeout(() => {
          node.snapshotIndex = snapshotIndex;
          node.log = logEntries.filter(e => e.committed).slice();
          packets.push(new Packet(node, leader, 'SNAP-OK', '#a855f7'));
          log(`${node.name} snapshot installed. Log synced to index ${snapshotIndex || 0}`, 'snap');
        }, 800);
      }
    }
  });

  partitionedIds.clear();
  updateStats();
}

// ══════════════════════════════════════════════
// 8. LOG COMPACTION (SNAPSHOTTING)
// ══════════════════════════════════════════════

function triggerSnapshot() {
  const committed = logEntries.filter(e => e.committed);
  if (committed.length === 0) { log('No committed entries to snapshot.', 'warn'); return; }

  snapshotIndex = committed[committed.length - 1].index;

  // Mark snapshotted entries visually
  logEntries.forEach(e => {
    if (e.committed && e.index <= snapshotIndex) {
      e.snapshotted = true;
    }
  });

  // Update all nodes
  nodes.forEach(n => {
    if (n.role !== ROLES.PARTITIONED) {
      n.snapshotIndex = snapshotIndex;
    }
  });

  log(`📦 Snapshot taken at index ${snapshotIndex}. Discarding ${committed.length} old log entries.`, 'snap');
  renderLogPanel();
  updateStats();
}

// ══════════════════════════════════════════════
// 9. RENDER LOOP
// ══════════════════════════════════════════════

function renderLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw connections
  if (nodes.length > 1) {
    nodes.forEach(a => {
      nodes.forEach(b => {
        if (b.id <= a.id) return;
        const isPartitioned = partitionedIds.has(a.id) || partitionedIds.has(b.id);
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
  packets.forEach((p, i) => { if (p.update()) toRemove.push(i); else p.draw(ctx); });
  toRemove.reverse().forEach(i => packets.splice(i, 1));

  // Draw nodes
  nodes.forEach(n => n.draw(ctx));

  animFrame = requestAnimationFrame(renderLoop);
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
  const visible = logEntries.filter(e => !e.snapshotted);
  visible.forEach(e => {
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
  els.statLog.textContent = logEntries.filter(e => e.committed).length;
  els.statSnapshot.textContent = snapshotIndex !== null ? `idx ${snapshotIndex}` : 'None';
}

function log(msg, type = 'info') {
  const div = document.createElement('div');
  div.className = `log-line ${type}`;
  const time = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  div.textContent = `[${time}] ${msg}`;
  els.eventLog.appendChild(div);
  els.eventLog.scrollTop = els.eventLog.scrollHeight;

  // Keep log from growing too large
  while (els.eventLog.children.length > 120) {
    els.eventLog.removeChild(els.eventLog.firstChild);
  }
}

function clearAllTimers() {
  Object.values(electionTimers).forEach(t => clearTimeout(t.id));
  electionTimers = {};
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}
