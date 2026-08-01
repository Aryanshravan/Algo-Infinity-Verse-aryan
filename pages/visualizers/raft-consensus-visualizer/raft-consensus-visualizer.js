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
let commandCounter = 0;
let termCounter = 0;
let partitionedIds = new Set();
let preVoteEnabled = true;

let canvas, ctx;
let packets = []; // flying messages
let electionTimers = {};
let heartbeatTimer = null;
let lastTime = performance.now();

let firewallLine = null;
let isDrawingFirewall = false;
let firewallStartX = 0;
let firewallStartY = 0;

const MAX_LOG_BEFORE_SNAPSHOT = 8;

const els = {
  btnInit: document.getElementById('btnInit'),
  btnAppendLog: document.getElementById('btnAppendLog'),
  btnPartitionLeader: document.getElementById('btnPartitionLeader'),
  btnSimulateSplitBrain: document.getElementById('btnSimulateSplitBrain'),
  btnHealPartition: document.getElementById('btnHealPartition'),
  btnCompactLog: document.getElementById('btnCompactLog'),
  btnElectionRace: document.getElementById('btnElectionRace'),
  nodeCountSelect: document.getElementById('nodeCountSelect'),
  electionTimeout: document.getElementById('electionTimeout'),
  electionTimeoutVal: document.getElementById('electionTimeoutVal'),
  networkLatency: document.getElementById('networkLatency'),
  networkLatencyVal: document.getElementById('networkLatencyVal'),
  packetLoss: document.getElementById('packetLoss'),
  packetLossVal: document.getElementById('packetLossVal'),
  preVoteToggle: document.getElementById('preVoteToggle'),
  preVoteDesc: document.getElementById('preVoteDesc'),
  statTerm: document.getElementById('statTerm'),
  statLeader: document.getElementById('statLeader'),
  statQuorum: document.getElementById('statQuorum'),
  statSnapshot: document.getElementById('statSnapshot'),
  logEntries: document.getElementById('logEntries'),
  logCount: document.getElementById('logCount'),
  eventLog: document.getElementById('eventLog'),
  engineBadge: document.getElementById('engineBadge'),
  btnClearFirewall: document.getElementById('btnClearFirewall'),
};

function getActiveLeaders() {
  return nodes.filter((n) => n.role === ROLES.LEADER && !n.isCrashed);
}

function sendPacket(from, to, type, color) {
  if (from.isCrashed || to.isCrashed) return;
  const lossChance = parseInt(els.packetLoss.value);
  if (Math.random() * 100 < lossChance) {
    log(`[Packet Drop] ${type} from ${from.name} to ${to.name} lost due to jitter.`, 'warn');
    return; // Dropped
  }
  packets.push(new Packet(from, to, type, color));
}

function canCommunicate(a, b) {
  if (a.isCrashed || b.isCrashed) return false;
  if (a.role === ROLES.PARTITIONED || b.role === ROLES.PARTITIONED) return false;
  if (partitionedIds.has(a.id) || partitionedIds.has(b.id)) return false;
  if (firewallLine) {
    return !lineSegmentsIntersect(
      a.baseX,
      a.baseY,
      b.baseX,
      b.baseY,
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
    this.baseX = x;
    this.baseY = y;
    this.visualX = x;
    this.visualY = y;
    this.radius = 38;
    this.role = ROLES.FOLLOWER;
    this.isCrashed = false;
    this.term = 0;
    this.votedFor = null;
    this.votesReceived = 0;
    this.preVotesReceived = 0;
    this.log = [];
    this.snapshotIndex = null;
    this.pulse = 0;
  }

  draw(ctx) {
    // Update physical position via spring
    this.visualX += (this.baseX - this.visualX) * 0.1;
    this.visualY += (this.baseY - this.visualY) * 0.1;

    let color = this.isCrashed ? '#374151' : COLORS[this.role];

    if (
      electionTimers[this.id] &&
      this.role !== ROLES.LEADER &&
      this.role !== ROLES.PARTITIONED &&
      !this.isCrashed
    ) {
      const remaining = electionTimers[this.id].remaining;
      const total = electionTimers[this.id].total;
      const frac = 1 - remaining / total;
      ctx.beginPath();
      ctx.arc(
        this.visualX,
        this.visualY,
        this.radius + 8,
        -Math.PI / 2,
        -Math.PI / 2 + frac * 2 * Math.PI
      );
      ctx.strokeStyle = `rgba(59,130,246,0.5)`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (this.role === ROLES.LEADER && !this.isCrashed) {
      this.pulse = (this.pulse + 0.05) % (Math.PI * 2);
      const pAlpha = 0.2 + 0.2 * Math.sin(this.pulse);
      ctx.beginPath();
      ctx.arc(this.visualX, this.visualY, this.radius + 12, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(245,158,11,${pAlpha})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(this.visualX, this.visualY, this.radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
      this.visualX - 8,
      this.visualY - 8,
      4,
      this.visualX,
      this.visualY,
      this.radius
    );
    grad.addColorStop(0, color + '55');
    grad.addColorStop(1, color + '18');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = this.role === ROLES.LEADER && !this.isCrashed ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = this.isCrashed ? '#94a3b8' : '#f1f5f9';
    ctx.font = 'bold 14px Poppins';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.name, this.visualX, this.visualY - 6);

    ctx.font = '9px Fira Code';
    ctx.fillStyle = color;
    ctx.fillText(
      this.isCrashed ? 'CRASHED' : this.role === ROLES.PARTITIONED ? 'ISOLATED' : this.role,
      this.visualX,
      this.visualY + 9
    );

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
    const baseLatency = parseInt(els.networkLatency.value);
    this.speed = 0.05 / (baseLatency / 10);
    this.progress += this.speed;
    return this.progress >= 1;
  }

  draw(ctx) {
    const px = this.from.visualX + (this.to.visualX - this.from.visualX) * this.progress;
    const py = this.from.visualY + (this.to.visualY - this.from.visualY) * this.progress;

    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(this.from.visualX, this.from.visualY);
    ctx.lineTo(this.to.visualX, this.to.visualY);
    ctx.strokeStyle = this.color + '22';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

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
  els.networkLatency.addEventListener('input', (e) => {
    els.networkLatencyVal.textContent = `${e.target.value}ms`;
  });
  els.packetLoss.addEventListener('input', (e) => {
    els.packetLossVal.textContent = `${e.target.value}%`;
  });

  els.preVoteToggle.addEventListener('change', () => {
    preVoteEnabled = els.preVoteToggle.checked;
    els.preVoteDesc.textContent = preVoteEnabled ? 'Enabled' : 'Disabled';
    els.preVoteDesc.style.color = preVoteEnabled ? '#10b981' : '#ef4444';
  });

  els.btnInit.addEventListener('click', startCluster);
  els.btnAppendLog.addEventListener('click', clientAppendCommand);
  els.btnPartitionLeader.addEventListener('click', partitionLeader);
  els.btnSimulateSplitBrain.addEventListener('click', simulateSplitBrainInteractive);
  els.btnHealPartition.addEventListener('click', healPartition);
  els.btnCompactLog.addEventListener('click', triggerSnapshot);
  els.btnClearFirewall.addEventListener('click', () => {
    firewallLine = null;
    log('Firewall cleared. Partitions resolving...', 'info');

    // Move nodes back to base formation
    const count = nodes.length;
    const cw = canvas.width,
      ch = canvas.height;
    const cx = cw / 2,
      cy = ch / 2;
    const r = Math.min(cw, ch) * 0.32;
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      n.baseX = cx + r * Math.cos(angle);
      n.baseY = cy + r * Math.sin(angle);
    });
    updateStats();
  });
  els.btnElectionRace.addEventListener('click', simulateElectionRace);

  canvas.addEventListener('click', (e) => {
    if (e.shiftKey) {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      nodes.forEach((n) => {
        const dist = Math.hypot(n.visualX - clickX, n.visualY - clickY);
        if (dist < n.radius) {
          n.isCrashed = !n.isCrashed;
          if (n.isCrashed) {
            log(`${n.name} CRASHED!`, 'warn');
            if (n.role === ROLES.LEADER) {
              n.role = ROLES.FOLLOWER;
              updateStats();
            }
          } else {
            log(`${n.name} RECOVERED!`, 'info');
            n.term = termCounter;
            resetElectionTimer(n.id);
          }
        }
      });
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    isDrawingFirewall = true;
    const rect = canvas.getBoundingClientRect();
    firewallStartX = e.clientX - rect.left;
    firewallStartY = e.clientY - rect.top;
    firewallLine = {
      x1: firewallStartX,
      y1: firewallStartY,
      x2: firewallStartX,
      y2: firewallStartY,
    };
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawingFirewall) return;
    const rect = canvas.getBoundingClientRect();
    firewallLine.x2 = e.clientX - rect.left;
    firewallLine.y2 = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseup', () => {
    isDrawingFirewall = false;
    log('Firewall deployed. Network partitioned.', 'warn');
  });

  lastTime = performance.now();
  animFrame = requestAnimationFrame(renderLoop);
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
  partitionedIds = new Set();
  renderLogPanel();
  updateStats();

  const count = parseInt(els.nodeCountSelect.value);
  spawnNodes(count);

  nodes.forEach((n) => resetElectionTimer(n.id));

  log('Cluster initialized with ' + count + ' nodes. Waiting for election...', 'info');

  els.btnAppendLog.disabled = false;
  els.btnPartitionLeader.disabled = false;
  els.btnHealPartition.disabled = false;
  els.btnCompactLog.disabled = false;
  els.btnElectionRace.disabled = false;
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
  if (candidate.isCrashed) return;

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
      sendPacket(candidate, peer, 'PRE-VOTE', '#38bdf8');

      // Simulate peers responding — they grant if they haven't seen a leader recently
      setTimeout(
        () => {
          if (nodes[candidateId].role === ROLES.PARTITIONED || nodes[candidateId].isCrashed) return;
          sendPacket(peer, candidate, 'PRV-OK', '#38bdf8');
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
    sendPacket(candidate, peer, 'REQ-VOTE', '#3b82f6');

    setTimeout(
      () => {
        if (candidate.role !== ROLES.CANDIDATE || candidate.isCrashed) return;
        // Grant vote if peer hasn't voted in this term
        if (
          peer.term < candidate.term ||
          (peer.term === candidate.term && peer.votedFor === null)
        ) {
          peer.votedFor = candidateId;
          peer.term = candidate.term;
          sendPacket(peer, candidate, 'VOTE✓', '#10b981');

          candidate.votesReceived++;
          log(`${peer.name} → ${candidate.name}: Vote GRANTED (term ${candidate.term})`, 'elect');

          if (candidate.votesReceived > nodes.length / 2 && candidate.role === ROLES.CANDIDATE) {
            becomeLeader(candidateId);
          }
        } else {
          sendPacket(peer, candidate, 'VOTE✗', '#ef4444');
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
  // Find if there's an existing leader in this partition
  const leader = nodes[nodeId];

  // Demote any leader that can communicate with us
  const activeLeaders = getActiveLeaders();
  activeLeaders.forEach((l) => {
    if (canCommunicate(leader, l)) {
      l.role = ROLES.FOLLOWER;
    }
  });

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
  const activeLeaders = getActiveLeaders();
  if (activeLeaders.length === 0) return;

  activeLeaders.forEach((leader) => {
    const followers = nodes.filter((n) => n.id !== leader.id && canCommunicate(leader, n));
    followers.forEach((f) => {
      sendPacket(leader, f, 'HB', '#10b981');

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
  });
}

function clientAppendCommand() {
  const activeLeaders = getActiveLeaders();
  if (activeLeaders.length === 0) {
    log('No leader elected yet!', 'warn');
    return;
  }

  commandCounter++;
  const cmd = `set:x=${commandCounter}`;

  activeLeaders.forEach((leader) => {
    const entry = { index: logEntries.length + 1, term: leader.term, cmd, committed: false };
    logEntries.push(entry);

    log(`Client → ${leader.name}: Append [${cmd}]`, 'repl');

    const followers = nodes.filter((n) => n.id !== leader.id && canCommunicate(leader, n));
    const quorumReq = Math.floor(nodes.length / 2) + 1;
    let acks = 1;

    followers.forEach((f) => {
      sendPacket(leader, f, 'AppEnt', '#0ea5e9');

      setTimeout(
        () => {
          sendPacket(f, leader, 'ACK', '#10b981');
          f.log.push(entry);
          acks++;

          if (acks >= quorumReq && !entry.committed) {
            entry.committed = true;
            leader.log.push(entry);
            log(`Entry [${cmd}] committed by ${leader.name} (majority ACK)`, 'repl');
            renderLogPanel();
            updateStats();

            if (
              logEntries.filter((e) => e.committed && e.index > (snapshotIndex || 0)).length >=
              MAX_LOG_BEFORE_SNAPSHOT
            ) {
              setTimeout(() => triggerSnapshot(), 500);
            }
          }
        },
        300 + Math.random() * 200
      );
    });
  });

  renderLogPanel();
  updateStats();
}

// ══════════════════════════════════════════════
// 7. PARTITION & HEAL
// ══════════════════════════════════════════════

function partitionLeader() {
  const activeLeaders = getActiveLeaders();
  if (activeLeaders.length === 0) {
    log('No leader to partition!', 'warn');
    return;
  }

  const leader = activeLeaders[0];
  partitionedIds.add(leader.id);
  leader.role = ROLES.PARTITIONED;

  log(`⚠ ${leader.name} partitioned from cluster!`, 'warn');
  updateStats();

  // Remaining nodes trigger new election after a delay
  const remaining = nodes.filter(
    (n) => n.role !== ROLES.PARTITIONED && !partitionedIds.has(n.id) && !n.isCrashed
  );
  if (remaining.length > 0) {
    const nextCandidate = remaining[Math.floor(Math.random() * remaining.length)];
    setTimeout(() => startElection(nextCandidate.id), 1200);
  }
}

function simulateSplitBrainInteractive() {
  log('Simulating Split-Brain (Network Partition)...', 'warn');

  firewallLine = {
    x1: canvas.width / 2,
    y1: 0,
    x2: canvas.width / 2,
    y2: canvas.height,
  };

  // Physically repel nodes
  nodes.forEach((n) => {
    if (n.baseX < canvas.width / 2) {
      n.baseX -= 70;
    } else {
      n.baseX += 70;
    }
  });

  clearAllTimers();

  // Force elections on both sides
  let leftNodes = nodes.filter((n) => n.baseX < canvas.width / 2 && !n.isCrashed);
  let rightNodes = nodes.filter((n) => n.baseX > canvas.width / 2 && !n.isCrashed);

  nodes.forEach((n) => {
    if (n.role === ROLES.LEADER) n.role = ROLES.FOLLOWER;
  });

  if (leftNodes.length > 0) setTimeout(() => startElection(leftNodes[0].id), 500);
  if (rightNodes.length > 0) setTimeout(() => startElection(rightNodes[0].id), 900);
}

function simulateElectionRace() {
  const activeLeaders = getActiveLeaders();
  if (activeLeaders.length > 0) {
    const leader = activeLeaders[0];
    partitionedIds.add(leader.id);
    leader.role = ROLES.PARTITIONED;
    log(`⚠ Leader partitioned for election race!`, 'warn');
    updateStats();
  }

  const remaining = nodes.filter(
    (n) => n.role !== ROLES.PARTITIONED && !partitionedIds.has(n.id) && !n.isCrashed
  );
  if (remaining.length > 1) {
    log(`🏁 Triggering simultaneous election timeout for ${remaining.length} nodes!`, 'warn');
    remaining.forEach((node) => {
      startElection(node.id);
    });
  } else {
    log('Not enough nodes to simulate an election race.', 'warn');
  }
}

function healPartition() {
  partitionedIds.forEach((id) => {
    const node = nodes[id];
    if (node && !node.isCrashed) {
      node.role = ROLES.FOLLOWER;
      const activeLeaders = getActiveLeaders();
      if (activeLeaders.length > 0) {
        node.term = activeLeaders[0].term;
      }
      node.votedFor = null;
      log(`${node.name} rejoined cluster. Catching up via InstallSnapshot...`, 'snap');

      // Send InstallSnapshot from leader to reconnected node
      if (activeLeaders.length > 0) {
        const leader = activeLeaders[0];
        sendPacket(leader, node, 'SNAPSHOT', '#a855f7');

        setTimeout(() => {
          node.snapshotIndex = snapshotIndex;
          node.log = logEntries.filter((e) => e.committed).slice();
          sendPacket(node, leader, 'SNAP-OK', '#a855f7');
          log(`${node.name} snapshot installed. Log synced to index ${snapshotIndex || 0}`, 'snap');
        }, 800);
      }
    }
  });

  partitionedIds.clear();
  firewallLine = null;
  // Move nodes back to base formation
  const count = nodes.length;
  const cw = canvas.width,
    ch = canvas.height;
  const cx = cw / 2,
    cy = ch / 2;
  const r = Math.min(cw, ch) * 0.32;
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    n.baseX = cx + r * Math.cos(angle);
    n.baseY = cy + r * Math.sin(angle);
  });

  updateStats();
}

// ══════════════════════════════════════════════
// 8. LOG COMPACTION (SNAPSHOTTING)
// ══════════════════════════════════════════════

function triggerSnapshot() {
  const committed = logEntries.filter((e) => e.committed);
  if (committed.length === 0) {
    log('No committed entries to snapshot.', 'warn');
    return;
  }

  snapshotIndex = committed[committed.length - 1].index;

  // Mark snapshotted entries visually
  logEntries.forEach((e) => {
    if (e.committed && e.index <= snapshotIndex) {
      e.snapshotted = true;
    }
  });

  // Update all nodes
  nodes.forEach((n) => {
    if (n.role !== ROLES.PARTITIONED) {
      n.snapshotIndex = snapshotIndex;
    }
  });

  log(
    `📦 Snapshot taken at index ${snapshotIndex}. Discarding ${committed.length} old log entries.`,
    'snap'
  );
  renderLogPanel();
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
      if (a.isCrashed) return;
      nodes.forEach((b) => {
        if (b.id <= a.id || b.isCrashed) return;
        const isPartitioned = !canCommunicate(a, b);
        ctx.beginPath();
        ctx.moveTo(a.visualX, a.visualY);
        ctx.lineTo(b.visualX, b.visualY);
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
  const activeLeaders = getActiveLeaders();
  els.statTerm.textContent = termCounter;
  els.statLeader.textContent =
    activeLeaders.length > 0 ? activeLeaders.map((l) => l.name).join(', ') : '–';

  const totalAlive = nodes.filter((n) => !n.isCrashed).length;
  // Quorum is based on TOTAL nodes, even if crashed
  els.statQuorum.textContent = Math.floor(nodes.length / 2) + 1;
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
