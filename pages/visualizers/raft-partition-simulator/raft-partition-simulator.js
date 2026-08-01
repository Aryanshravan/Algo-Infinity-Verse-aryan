document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    raftSimInit();
  } catch (e) {
    console.error('RaftSimInit Error:', e);
  }
});

/**
 * Hides loading screen.
 */
function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById('loading-screen');
    if (s) s.classList.add('hidden');
  }, 1000);
}

/**
 * Initializes scroll to top button.
 */
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/**
 * Initializes mobile navigation toggle using delegated document click listener.
 */
function initNavbar() {
  document.addEventListener('click', (e) => {
    const menuToggle = e.target.closest('#menuToggle');
    if (menuToggle) {
      const navLinks = document.getElementById('navLinks');
      if (!navLinks) return;
      e.stopPropagation();
      let overlay = document.querySelector('.nav-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
      }
      const isOpen = !navLinks.classList.contains('active');
      navLinks.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen);
      overlay.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
      }
    }
    if (e.target.classList.contains('nav-overlay')) {
      const navLinks = document.getElementById('navLinks');
      const menuToggle = document.getElementById('menuToggle');
      if (navLinks && menuToggle) {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        e.target.classList.remove('active');
        document.body.style.overflow = '';
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-times');
        }
      }
    }
  });
}

/* ─── Raft Consensus Engine Implementation ─── */

/**
 * Log entry schema in Raft logs.
 * @typedef {Object} LogEntry
 * @property {number} term
 * @property {number} index
 * @property {string} command
 * @property {boolean} committed
 * @property {boolean} [truncated]
 */

/**
 * Individual Node executing the Raft protocol.
 */
class RaftNode {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;

    // Server state
    this.state = 'Follower'; // 'Follower', 'Candidate', 'Leader', 'Dead'
    this.currentTerm = 0;
    this.votedFor = null;
    this.log = []; // Array of LogEntry objects (1-indexed conceptually)

    // Volatile state on all servers
    this.commitIndex = 0;
    this.lastApplied = 0;

    // Volatile state on leaders
    this.nextIndex = {};
    this.matchIndex = {};

    // Timers
    this.electionTimeout = this.getRandomTimeout();
    this.timeSinceLastHeartbeat = 0;
    this.timeSinceLastElectionReset = 0;
    this.heartbeatInterval = 180; // ms

    this.votesReceived = 0;
  }

  /**
   * Generates randomized election timeout between 250ms and 450ms.
   */
  getRandomTimeout() {
    return 250 + Math.random() * 200;
  }

  /**
   * Reverts node back to follower role under specified term.
   */
  becomeFollower(term) {
    this.state = 'Follower';
    this.currentTerm = term;
    this.votedFor = null;
    this.votesReceived = 0;
    this.timeSinceLastElectionReset = 0;
    this.electionTimeout = this.getRandomTimeout();
  }

  /**
   * Initiates election campaign.
   */
  becomeCandidate() {
    this.state = 'Candidate';
    this.currentTerm++;
    this.votedFor = this.id;
    this.votesReceived = 1; // Vote for self
    this.timeSinceLastElectionReset = 0;
    this.electionTimeout = this.getRandomTimeout();
  }

  /**
   * Promotes candidate to cluster leader.
   */
  becomeLeader(nodeCount) {
    this.state = 'Leader';
    this.votesReceived = 0;

    // Initialize leader state indexes
    for (let i = 1; i <= nodeCount; i++) {
      if (i !== this.id) {
        this.nextIndex[i] = this.log.length + 1;
        this.matchIndex[i] = 0;
      }
    }
  }
}

/**
 * Handles communication channels and packet animations.
 */
class NetworkController {
  constructor() {
    this.nodes = [];
    this.partitionSetA = new Set([1, 2]);
    this.partitionSetB = new Set([3, 4, 5]);
    this.isPartitioned = false;

    // Active packets moving on canvas
    this.inFlightMessages = [];
  }

  /**
   * Returns true if both nodes are in the same partition sub-network.
   * @param {number} fromId
   * @param {number} toId
   */
  canCommunicate(fromId, toId) {
    if (!this.isPartitioned) return true;
    const a = this.partitionSetA.has(fromId);
    const b = this.partitionSetA.has(toId);
    return a === b; // True if both in Set A or both in Set B
  }

  /**
   * Emits a message packet across the network canvas.
   * @param {number} from
   * @param {number} to
   * @param {string} type - 'RV' (RequestVote), 'RVR' (RequestVoteResponse), 'AE' (AppendEntries), 'AER' (AppendEntriesResponse)
   * @param {Object} payload
   */
  send(from, to, type, payload) {
    const fromNode = this.nodes.find((n) => n.id === from);
    const toNode = this.nodes.find((n) => n.id === to);
    if (!fromNode || !toNode) return;

    // Immediately drop if network partition blocks communication
    if (!this.canCommunicate(from, to)) return;

    this.inFlightMessages.push({
      from,
      to,
      type,
      payload,
      x: fromNode.x,
      y: fromNode.y,
      progress: 0,
    });
  }
}

/* ─── Simulation States ─── */

let nodes = [];
let network = null;
let canvas = null;
let ctx = null;

let isSimRunning = true;
let speedFactor = 1.0;
let lastTime = 0;

let selectedNode = null;
let oldWidth = 0;
const oldHeight = 480;

// Keyboard navigation cursor
const keyboardCursor = { id: 1, active: false };

/**
 * Initializes simulation controller handles.
 */
function raftSimInit() {
  canvas = document.getElementById('raftCanvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');

  // Control bindings
  document.getElementById('btnPause').addEventListener('click', togglePause);
  document.getElementById('btnStep').addEventListener('click', triggerSingleStep);
  document.getElementById('btnHeal').addEventListener('click', healNetwork);
  document.getElementById('btnPartition').addEventListener('click', triggerForcePartition);
  document.getElementById('btnWrite').addEventListener('click', handleClientWrite);
  document.getElementById('btnReset').addEventListener('click', resetCluster);

  document.getElementById('simSpeed').addEventListener('change', (e) => {
    speedFactor = parseFloat(e.target.value);
  });

  // Canvas Click to select target nodes
  canvas.addEventListener('click', handleCanvasClick);

  // Keyboard navigation on Canvas focus
  canvas.addEventListener('focus', () => {
    keyboardCursor.active = true;
    drawAll();
  });
  canvas.addEventListener('blur', () => {
    keyboardCursor.active = false;
    drawAll();
  });
  canvas.addEventListener('keydown', handleKeyDown);

  window.addEventListener('resize', () => {
    const newWidth = canvas.parentElement.clientWidth;
    const newHeight = 480;

    if (oldWidth > 0) {
      const scaleX = newWidth / oldWidth;
      const scaleY = newHeight / oldHeight;
      nodes.forEach((n) => {
        n.x *= scaleX;
        n.y *= scaleY;
      });
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    oldWidth = newWidth;
    drawAll();
  });

  resetCluster();

  // Begin simulation loop
  lastTime = performance.now();
  requestAnimationFrame(simulationLoop);
}

/**
 * Resizes canvas dimensions for Retina/HiDPI scaling.
 * @param {HTMLCanvasElement} c
 */
function resizeCanvas(c) {
  const rect = c.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  c.width = rect.width * dpr;
  c.height = 480 * dpr;
  c.style.width = `${rect.width}px`;
  c.style.height = '480px';
  const context = c.getContext('2d');
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Re-initializes cluster nodes and network matrix.
 */
function resetCluster() {
  nodes = [];
  network = new NetworkController();

  const log = document.getElementById('raftLogBody');
  if (log) {
    log.innerHTML = '';
    const placeholder = document.createElement('span');
    placeholder.className = 'raft-log-placeholder';
    placeholder.textContent = 'Simulation logs will stream here...';
    log.appendChild(placeholder);
  }

  resizeCanvas(canvas);
  oldWidth = canvas.width / (window.devicePixelRatio || 1);

  const cx = canvas.width / (window.devicePixelRatio || 1) / 2;
  const cy = canvas.height / (window.devicePixelRatio || 1) / 2;
  const radius = 130;

  // Build 5 nodes in circle
  for (let i = 1; i <= 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const n = new RaftNode(i, cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    nodes.push(n);
  }

  network.nodes = nodes;
  selectedNode = nodes[0];
  document.getElementById('writeNodeSel').value = '1';

  logTrace('Cluster initialized: 5 Follower nodes started under term 0.');
  updateTelemetry();
  drawAll();
}

/**
 * Pauses/Resumes simulation.
 */
function togglePause() {
  isSimRunning = !isSimRunning;
  const btn = document.getElementById('btnPause');
  const stepBtn = document.getElementById('btnStep');

  if (isSimRunning) {
    btn.innerHTML = '';
    const icon = document.createElement('i');
    icon.className = 'fas fa-pause';
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(' Pause Sim'));
    stepBtn.disabled = true;
    document.getElementById('simStatusText').textContent = 'Status: Running';
  } else {
    btn.innerHTML = '';
    const icon = document.createElement('i');
    icon.className = 'fas fa-play';
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(' Resume Sim'));
    stepBtn.disabled = false;
    document.getElementById('simStatusText').textContent = 'Status: Paused';
  }
}

/**
 * Triggers single step iteration updates.
 */
function triggerSingleStep() {
  if (isSimRunning) return;
  updateSimulation(40); // Tick 40ms forwards
  drawAll();
}

/**
 * Heals active network partitions.
 */
function healNetwork() {
  network.isPartitioned = false;
  logTrace('<span class="highlight">Network Healed</span>: Full communication channels restored.');
  updateTelemetry();
  drawAll();
}

/**
 * Splits network into Partition A (1,2) and Partition B (3,4,5).
 */
function triggerForcePartition() {
  network.isPartitioned = true;
  logTrace(
    '<span class="highlight">Network Partitioned</span>: Cluster split into isolated subnets {Node 1, 2} and {Node 3, 4, 5}.'
  );
  updateTelemetry();
  drawAll();
}

/**
 * Simulates a client writing database updates.
 */
function handleClientWrite() {
  const targetId = parseInt(document.getElementById('writeNodeSel').value);
  const targetNode = nodes.find((n) => n.id === targetId);
  if (!targetNode || targetNode.state === 'Dead') return;

  if (targetNode.state !== 'Leader') {
    logTrace(
      `Write rejected: Target <span class="highlight">Node ${targetId}</span> is not leader.`
    );
    return;
  }

  // Insert entry locally on leader
  const newIndex = targetNode.log.length + 1;
  const val = `SET x = ${Math.floor(Math.random() * 100)}`;
  const entry = {
    term: targetNode.currentTerm,
    index: newIndex,
    command: val,
    committed: false,
  };
  targetNode.log.push(entry);

  logTrace(
    `Leader <span class="highlight">Node ${targetId}</span> accepted client write: <code>${val}</code> at term ${targetNode.currentTerm}.`
  );
  updateTelemetry();
  drawAll();
}

/**
 * Handles canvas clicks to target selection.
 * @param {MouseEvent} e
 */
function handleCanvasClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clicked = nodes.find((n) => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 25);

  if (clicked) {
    selectedNode = clicked;
    document.getElementById('writeNodeSel').value = clicked.id;
    drawAll();
  }
}

/**
 * Keyboard input parser.
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  if (!keyboardCursor.active) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    keyboardCursor.id = keyboardCursor.id === 5 ? 1 : keyboardCursor.id + 1;
    selectedNode = nodes.find((n) => n.id === keyboardCursor.id);
    document.getElementById('writeNodeSel').value = selectedNode.id;
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    // Toggle crash / reboot selected node
    if (selectedNode.state === 'Dead') {
      selectedNode.becomeFollower(selectedNode.currentTerm);
      logTrace(`Rebooted <span class="highlight">Node ${selectedNode.id}</span>.`);
    } else {
      selectedNode.state = 'Dead';
      logTrace(`Crashed <span class="highlight">Node ${selectedNode.id}</span>.`);
    }
  } else if (e.key === 'c' || e.key === 'C') {
    // Initiate election
    if (selectedNode.state !== 'Dead') {
      selectedNode.becomeCandidate();
      logTrace(
        `Forced candidate election on <span class="highlight">Node ${selectedNode.id}</span>.`
      );
    }
  }
  drawAll();
}

/**
 * safe DOM logging traces log content.
 * @param {string} msg
 */
function logTrace(msg) {
  const log = document.getElementById('raftLogBody');
  const placeholder = log.querySelector('.raft-log-placeholder');
  if (placeholder) placeholder.remove();

  const el = document.createElement('span');
  el.className = 'raft-log-line';

  const parts = msg.split(/(<span class="highlight">.*?<\/span>)/g);
  parts.forEach((part) => {
    if (part.startsWith('<span class="highlight">') && part.endsWith('</span>')) {
      const clean = part.replace('<span class="highlight">', '').replace('</span>', '');
      const span = document.createElement('span');
      span.className = 'highlight';
      span.textContent = clean;
      el.appendChild(span);
    } else {
      el.appendChild(document.createTextNode(part));
    }
  });

  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

/**
 * Main simulation step controller loop.
 */
function simulationLoop(now) {
  const dt = now - lastTime;
  lastTime = now;

  if (isSimRunning) {
    updateSimulation(dt * speedFactor);
  }

  drawAll();
  requestAnimationFrame(simulationLoop);
}

/**
 * Advances simulation step progress time frames.
 * @param {number} dt
 */
function updateSimulation(dt) {
  // 1. Progress timers on all active nodes
  nodes.forEach((n) => {
    if (n.state === 'Dead') return;

    if (n.state === 'Follower' || n.state === 'Candidate') {
      n.timeSinceLastElectionReset += dt;
      if (n.timeSinceLastElectionReset >= n.electionTimeout) {
        // Trigger Candidate Election campaign!
        n.becomeCandidate();
        logTrace(
          `Node ${n.id} election timer expired. Candidate campaign initiated for Term ${n.currentTerm}.`
        );
        // Broadcast votes request
        nodes.forEach((target) => {
          if (target.id !== n.id && target.state !== 'Dead') {
            const lastLogIndex = n.log.length;
            const lastLogTerm = lastLogIndex > 0 ? n.log[lastLogIndex - 1].term : 0;
            network.send(n.id, target.id, 'RV', {
              term: n.currentTerm,
              candidateId: n.id,
              lastLogIndex,
              lastLogTerm,
            });
          }
        });
      }
    }

    if (n.state === 'Leader') {
      n.timeSinceLastHeartbeat += dt;
      if (n.timeSinceLastHeartbeat >= n.heartbeatInterval) {
        n.timeSinceLastHeartbeat = 0;
        // Broadcast Heartbeat AppendEntries
        nodes.forEach((target) => {
          if (target.id !== n.id && target.state !== 'Dead') {
            const nextIdx = n.nextIndex[target.id] || 1;
            const prevLogIndex = nextIdx - 1;
            const prevLogTerm = prevLogIndex > 0 ? n.log[prevLogIndex - 1].term : 0;
            const entries = n.log.slice(prevLogIndex);

            network.send(n.id, target.id, 'AE', {
              term: n.currentTerm,
              leaderId: n.id,
              prevLogIndex,
              prevLogTerm,
              entries: entries.map((e) => ({ ...e })),
              leaderCommit: n.commitIndex,
            });
          }
        });
      }
    }
  });

  // 2. Advance In-Flight Packet Progress Animations
  network.inFlightMessages.forEach((msg) => {
    msg.progress += dt * 0.003; // Speed coefficient
  });

  // Process completed packets
  const completed = network.inFlightMessages.filter((m) => m.progress >= 1.0);
  network.inFlightMessages = network.inFlightMessages.filter((m) => m.progress < 1.0);

  completed.forEach((msg) => {
    handleReceivedRPC(msg);
  });

  // 3. Resolve commit indexing matching updates on Leader node
  const activeLeader = nodes.find((n) => n.state === 'Leader' && n.state !== 'Dead');
  if (activeLeader) {
    // Determine majority commits index
    for (let idx = activeLeader.log.length; idx > activeLeader.commitIndex; idx--) {
      // Leader can only commit entries from its current term directly
      if (activeLeader.log[idx - 1].term === activeLeader.currentTerm) {
        let matchCount = 1; // Include leader itself
        nodes.forEach((other) => {
          if (other.id !== activeLeader.id) {
            if (activeLeader.matchIndex[other.id] >= idx) {
              matchCount++;
            }
          }
        });

        // 3 out of 5 majority threshold
        if (matchCount >= 3) {
          activeLeader.commitIndex = idx;
          // Apply to local log
          for (let i = 0; i < idx; i++) {
            activeLeader.log[i].committed = true;
          }
          logTrace(`Majority replication quorum reached. Committed entries up to index ${idx}.`);
          break;
        }
      }
    }
  }

  updateTelemetry();
  updateLogsGrid();
}

/**
 * Core RPC dispatcher handlers.
 * @param {Object} msg
 */
function handleReceivedRPC(msg) {
  const receiver = nodes.find((n) => n.id === msg.to);
  const sender = nodes.find((n) => n.id === msg.from);
  if (!receiver || receiver.state === 'Dead' || !sender || sender.state === 'Dead') return;

  const payload = msg.payload;

  if (msg.type === 'RV') {
    // RequestVote RPC Handler
    if (payload.term > receiver.currentTerm) {
      receiver.becomeFollower(payload.term);
    }

    let voteGranted = false;
    const canVote = receiver.votedFor === null || receiver.votedFor === payload.candidateId;

    // Candidate log must be at least as up-to-date as receiver log
    const localLastIndex = receiver.log.length;
    const localLastTerm = localLastIndex > 0 ? receiver.log[localLastIndex - 1].term : 0;

    const logUpToDate =
      payload.lastLogTerm > localLastTerm ||
      (payload.lastLogTerm === localLastTerm && payload.lastLogIndex >= localLastIndex);

    if (payload.term === receiver.currentTerm && canVote && logUpToDate) {
      voteGranted = true;
      receiver.votedFor = payload.candidateId;
      receiver.timeSinceLastElectionReset = 0; // Reset election timer
    }

    network.send(receiver.id, sender.id, 'RVR', {
      term: receiver.currentTerm,
      voteGranted,
    });
  } else if (msg.type === 'RVR') {
    // RequestVoteResponse handler
    if (receiver.state === 'Candidate' && payload.term === receiver.currentTerm) {
      if (payload.voteGranted) {
        receiver.votesReceived++;
        if (receiver.votesReceived >= 3) {
          receiver.becomeLeader(nodes.length);
          logTrace(
            `Majority votes won! Promoted <span class="highlight">Node ${receiver.id}</span> to Leader for Term ${receiver.currentTerm}.`
          );
        }
      }
    } else if (payload.term > receiver.currentTerm) {
      receiver.becomeFollower(payload.term);
    }
  } else if (msg.type === 'AE') {
    // AppendEntries RPC Handler
    if (payload.term > receiver.currentTerm) {
      receiver.becomeFollower(payload.term);
    }

    let success = false;
    if (payload.term === receiver.currentTerm) {
      receiver.state = 'Follower';
      receiver.timeSinceLastElectionReset = 0; // Reset timer

      // Verify log matches prevLogIndex and prevLogTerm
      const prevIdx = payload.prevLogIndex;
      const prevMatch =
        prevIdx === 0 ||
        (receiver.log.length >= prevIdx && receiver.log[prevIdx - 1].term === payload.prevLogTerm);

      if (prevMatch) {
        success = true;
        // Replicate and overwrite any mismatched entries
        let localIdx = prevIdx;
        payload.entries.forEach((newEntry) => {
          if (receiver.log.length > localIdx) {
            if (receiver.log[localIdx].term !== newEntry.term) {
              // Highlight conflict and truncate
              const truncatedEntry = { ...receiver.log[localIdx], truncated: true };
              receiver.log[localIdx] = truncatedEntry;
              logTrace(
                `Conflict detected at index ${localIdx + 1}. Log entry truncated on Node ${receiver.id}.`
              );
              receiver.log = receiver.log.slice(0, localIdx);
              receiver.log.push(newEntry);
            }
          } else {
            receiver.log.push(newEntry);
          }
          localIdx++;
        });

        // Update commitIndex to min(leaderCommit, index of last new entry)
        if (payload.leaderCommit > receiver.commitIndex) {
          receiver.commitIndex = Math.min(payload.leaderCommit, receiver.log.length);
          for (let i = 0; i < receiver.commitIndex; i++) {
            receiver.log[i].committed = true;
          }
        }
      }
    }

    network.send(receiver.id, sender.id, 'AER', {
      term: receiver.currentTerm,
      success,
      matchIndex: receiver.log.length,
    });
  } else if (msg.type === 'AER') {
    // AppendEntriesResponse handler
    if (payload.term > receiver.currentTerm) {
      receiver.becomeFollower(payload.term);
      return;
    }

    if (receiver.state === 'Leader' && payload.term === receiver.currentTerm) {
      if (payload.success) {
        // Log replicated successfully
        receiver.matchIndex[msg.from] = Math.max(
          receiver.matchIndex[msg.from] || 0,
          payload.matchIndex
        );
        receiver.nextIndex[msg.from] = payload.matchIndex + 1;
      } else {
        // Mismatch, decrement nextIndex and retry on next tick
        receiver.nextIndex[msg.from] = Math.max(1, (receiver.nextIndex[msg.from] || 1) - 1);
      }
    }
  }
}

/**
 * Refreshes telemetry panel stats.
 */
function updateTelemetry() {
  const activeLeader = nodes.find((n) => n.state === 'Leader' && n.state !== 'Dead');
  const telLeader = document.getElementById('telLeader');

  if (telLeader) {
    if (activeLeader) {
      telLeader.textContent = `Node ${activeLeader.id}`;
      telLeader.className = 'value text-success';
    } else {
      telLeader.textContent = 'None';
      telLeader.className = 'value';
    }
  }

  const terms = nodes.map((n) => n.currentTerm);
  document.getElementById('telTerm').textContent = Math.max(...terms, 0);

  const partitionState = document.getElementById('telPartitionState');
  if (partitionState) {
    partitionState.textContent = network.isPartitioned
      ? 'Split-Brain Partition Active'
      : 'Fully Connected';
    partitionState.className = network.isPartitioned ? 'value text-error' : 'value';
  }

  document.getElementById('telInFlightCount').textContent = network.inFlightMessages.length;
}

/**
 * Redraws visual canvas layers.
 */
function drawAll() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw partition line if active
  if (network.isPartitioned) {
    const dpr = window.devicePixelRatio || 1;
    const cx = canvas.width / dpr / 2;
    const cy = canvas.height / dpr;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Partition labels
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.font = 'bold 12px "Orbitron", sans-serif';
    ctx.fillText('Partition Set A', cx - 110, 30);
    ctx.fillText('Partition Set B', cx + 20, 30);
  }

  // 2. Draw in-flight message packets
  network.inFlightMessages.forEach((msg) => {
    const fromNode = nodes.find((n) => n.id === msg.from);
    const toNode = nodes.find((n) => n.id === msg.to);
    if (!fromNode || !toNode) return;

    // Linear interpolation
    const px = fromNode.x + (toNode.x - fromNode.x) * msg.progress;
    const py = fromNode.y + (toNode.y - fromNode.y) * msg.progress;

    ctx.beginPath();
    ctx.arc(px, py, 7, 0, 2 * Math.PI);

    if (msg.type === 'RV')
      ctx.fillStyle = '#eab308'; // Gold
    else if (msg.type === 'AE')
      ctx.fillStyle = '#a855f7'; // Purple
    else ctx.fillStyle = '#60a5fa'; // Blue (responses)

    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '8px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg.type, px, py);
  });

  // 3. Draw nodes
  nodes.forEach((n) => {
    const isSelected = selectedNode === n;
    const isFocused = keyboardCursor.active && keyboardCursor.id === n.id;

    // Draw active timer ring (election timer)
    if (n.state === 'Follower' || n.state === 'Candidate') {
      const pct = Math.min(1.0, n.timeSinceLastElectionReset / n.electionTimeout);
      ctx.beginPath();
      ctx.arc(n.x, n.y, 30, -Math.PI / 2, -Math.PI / 2 + pct * 2 * Math.PI);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(n.x, n.y, 24, 0, 2 * Math.PI);

    // Color code roles
    if (n.state === 'Leader') {
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#3b82f6';
    } else if (n.state === 'Candidate') {
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#eab308';
    } else if (n.state === 'Dead') {
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#ef4444';
    } else {
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#a855f7';
    }

    if (isSelected || isFocused) {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#ffffff';
    } else {
      ctx.lineWidth = 2.5;
    }

    ctx.fill();
    ctx.stroke();

    // Text labels inside nodes
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`N${n.id}`, n.x, n.y - 4);

    ctx.fillStyle = n.state === 'Dead' ? '#f87171' : '#cbd5e1';
    ctx.font = '8px "Fira Code", monospace';
    ctx.fillText(n.state === 'Dead' ? 'DEAD' : `T:${n.currentTerm}`, n.x, n.y + 7);
  });
}

/**
 * Updates vertical node log grids.
 */
function updateLogsGrid() {
  const container = document.getElementById('nodeLogsGrid');
  if (!container) return;

  container.innerHTML = '';

  nodes.forEach((n) => {
    const col = document.createElement('div');
    col.className = 'node-log-column';

    const h4 = document.createElement('h4');
    h4.textContent = `Node ${n.id} (${n.state})`;
    col.appendChild(h4);

    const slots = document.createElement('div');
    slots.className = 'log-slots';

    if (n.log.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'log-entry-item';
      empty.style.color = '#64748b';
      empty.textContent = '(Empty)';
      slots.appendChild(empty);
    } else {
      n.log.forEach((entry) => {
        const item = document.createElement('div');
        item.className =
          'log-entry-item ' +
          (entry.committed
            ? 'entry-committed'
            : entry.truncated
              ? 'entry-truncated'
              : 'entry-uncommitted');
        item.textContent = `[${entry.index}] T:${entry.term} ${entry.command}`;
        slots.appendChild(item);
      });
    }

    col.appendChild(slots);
    container.appendChild(col);
  });
}

/* ─── ESM Module Exports for testing ─── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RaftNode,
    NetworkController,
  };
}
