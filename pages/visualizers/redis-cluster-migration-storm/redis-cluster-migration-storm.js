/**
 * Redis Cluster Hash Slot Migration Storm Visualizer
 */

document.addEventListener('DOMContentLoaded', () => {
  const nodeLayer = document.getElementById('rcNodeLayer');
  const connections = document.getElementById('rcConnections');
  const failBtn = document.getElementById('rcFailNodeBtn');
  const resetBtn = document.getElementById('rcResetBtn');
  const statusIcon = document.getElementById('rcStatusIcon');
  const statusText = document.getElementById('rcStatusText');
  const statusContainer = document.querySelector('.rc-status-container');

  let state = 'HEALTHY'; // HEALTHY, FAILING, PROMOTING, RECOVERING, RECOVERED
  let particles = [];
  let animFrameId = null;

  // Nodes Data
  const nodesData = [
    { id: 'm1', type: 'master', group: 1, title: 'Master A', slots: '0 - 5460' },
    { id: 's1', type: 'slave', group: 1, title: 'Slave A', slots: 'Follows A' },
    { id: 'm2', type: 'master', group: 2, title: 'Master B', slots: '5461 - 10922' },
    { id: 's2', type: 'slave', group: 2, title: 'Slave B', slots: 'Follows B' },
    { id: 'm3', type: 'master', group: 3, title: 'Master C', slots: '10923 - 16383' },
    { id: 's3', type: 'slave', group: 3, title: 'Slave C', slots: 'Follows C' },
  ];

  // DOM Elements for nodes
  const nodeEls = {};
  const lines = [];

  function init() {
    renderNodes();
    window.addEventListener('resize', drawConnections);
    setTimeout(drawConnections, 100);

    failBtn.addEventListener('click', handleFailNode);
    resetBtn.addEventListener('click', handleReset);
  }

  function renderNodes() {
    nodeLayer.innerHTML = '';

    // Group into columns
    const columns = [
      nodesData.filter((n) => n.group === 1),
      nodesData.filter((n) => n.group === 2),
      nodesData.filter((n) => n.group === 3),
    ];

    columns.forEach((colNodes) => {
      const colDiv = document.createElement('div');
      colDiv.className = 'rc-node-col';

      colNodes.forEach((n) => {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = `rc-node ${n.type}`;
        nodeDiv.id = `node-${n.id}`;

        let iconClass = n.type === 'master' ? 'fa-server' : 'fa-database';

        nodeDiv.innerHTML = `
          <div class="rc-node-icon"><i class="fas ${iconClass}"></i></div>
          <div class="rc-node-title">${n.title}</div>
          <div class="rc-node-type">${n.type}</div>
          <div class="rc-node-slots">${n.slots}</div>
        `;

        nodeEls[n.id] = nodeDiv;
        colDiv.appendChild(nodeDiv);
      });

      nodeLayer.appendChild(colDiv);
    });
  }

  function drawConnections() {
    connections.innerHTML = '';
    lines.length = 0;

    const ns = 'http://www.w3.org/2000/svg';

    // Connect Master -> Slave
    [1, 2, 3].forEach((group) => {
      const m = nodesData.find((n) => n.group === group && n.type === 'master');
      const s = nodesData.find((n) => n.group === group && n.type === 'slave');

      if (m && s) {
        drawLine(`node-${m.id}`, `node-${s.id}`, 'master-slave');
      }
    });

    // Connect Master -> Master (Gossip/Quorum ring)
    const m1 = nodesData.find((n) => n.group === 1 && n.type === 'master');
    const m2 = nodesData.find((n) => n.group === 2 && n.type === 'master');
    const m3 = nodesData.find((n) => n.group === 3 && n.type === 'master');

    if (m1 && m2 && m3) {
      drawLine(`node-${m1.id}`, `node-${m2.id}`, 'cluster');
      drawLine(`node-${m2.id}`, `node-${m3.id}`, 'cluster');
      drawLine(`node-${m1.id}`, `node-${m3.id}`, 'cluster');
    }

    function drawLine(id1, id2, typeClass) {
      const el1 = document.getElementById(id1);
      const el2 = document.getElementById(id2);

      if (!el1 || !el2) return;

      const rect1 = el1.getBoundingClientRect();
      const rect2 = el2.getBoundingClientRect();

      const parentRect = connections.getBoundingClientRect();

      const x1 = rect1.left + rect1.width / 2 - parentRect.left;
      const y1 = rect1.top + rect1.height / 2 - parentRect.top;
      const x2 = rect2.left + rect2.width / 2 - parentRect.left;
      const y2 = rect2.top + rect2.height / 2 - parentRect.top;

      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('class', `rc-conn-line ${typeClass}`);

      connections.appendChild(line);
      lines.push({ x1, y1, x2, y2, element: line });
    }
  }

  function setStatus(status, text, type) {
    statusText.innerText = text;
    statusContainer.className = `rc-status-container status-${type}`;

    if (type === 'healthy') statusIcon.className = 'fas fa-check-circle';
    else if (type === 'fail') statusIcon.className = 'fas fa-times-circle';
    else if (type === 'recover') statusIcon.className = 'fas fa-exclamation-triangle';
  }

  async function handleFailNode() {
    if (state !== 'HEALTHY') return;
    state = 'FAILING';
    failBtn.disabled = true;
    resetBtn.disabled = true;

    // Pick a master to fail (let's say Master A)
    const m = nodesData.find((n) => n.group === 1 && n.type === 'master');
    const el = nodeEls[m.id];

    el.classList.remove('master');
    el.classList.add('failed');
    el.querySelector('.rc-node-icon i').className = 'fas fa-skull-crossbones';

    setStatus(
      'FAILING',
      'Master A has crashed! Cluster has lost quorum for slots 0 - 5460.',
      'fail'
    );

    await sleep(2000);

    state = 'PROMOTING';
    setStatus(
      'PROMOTING',
      'Slave A detects failure via Gossip protocol. Initiating failover election...',
      'recover'
    );

    const s = nodesData.find((n) => n.group === 1 && n.type === 'slave');
    const sEl = nodeEls[s.id];

    sEl.classList.add('promoting');

    await sleep(2500);

    state = 'RECOVERING';
    sEl.classList.remove('promoting', 'slave');
    sEl.classList.add('master');
    sEl.querySelector('.rc-node-type').innerText = 'master (Promoted)';
    sEl.querySelector('.rc-node-icon i').className = 'fas fa-server';

    // Assign slots to promoted slave
    const oldSlots = m.slots;
    sEl.querySelector('.rc-node-slots').innerText = oldSlots;
    s.type = 'master'; // logically update for drawing connections
    m.type = 'failed';

    drawConnections();

    setStatus(
      'RECOVERING',
      'Slave A promoted to Master. Migration Storm begins to sync cluster topology and re-establish quorum.',
      'recover'
    );

    // Start Migration Storm animation
    startMigrationStorm();

    await sleep(4000);

    stopMigrationStorm();
    state = 'RECOVERED';
    setStatus(
      'RECOVERED',
      'Migration Storm complete. Cluster has recovered and is healthy.',
      'healthy'
    );

    resetBtn.disabled = false;
  }

  function handleReset() {
    if (state === 'FAILING' || state === 'PROMOTING' || state === 'RECOVERING') return;

    // Reset Data
    nodesData.forEach((n) => {
      if (n.id.startsWith('m')) {
        n.type = 'master';
      } else {
        n.type = 'slave';
      }
    });

    renderNodes();
    drawConnections();

    failBtn.disabled = false;
    resetBtn.disabled = false;
    state = 'HEALTHY';
    setStatus(
      'HEALTHY',
      'Cluster is healthy. 16,384 hash slots distributed evenly across 3 Masters.',
      'healthy'
    );
  }

  function startMigrationStorm() {
    lines.forEach((l) => l.element.classList.add('migrating'));

    // Spawn particles
    const ns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 30; i++) {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('r', '4');
      circle.setAttribute('class', 'rc-particle');
      connections.appendChild(circle);

      const line = lines[Math.floor(Math.random() * lines.length)];

      particles.push({
        element: circle,
        line: line,
        progress: Math.random(),
        speed: 0.01 + Math.random() * 0.02,
        direction: Math.random() > 0.5 ? 1 : -1,
      });
    }

    animateParticles();
  }

  function stopMigrationStorm() {
    lines.forEach((l) => l.element.classList.remove('migrating'));
    particles.forEach((p) => p.element.remove());
    particles = [];
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function animateParticles() {
    particles.forEach((p) => {
      p.progress += p.speed * p.direction;
      if (p.progress >= 1) {
        p.progress = 0;
        p.line = lines[Math.floor(Math.random() * lines.length)];
      }
      if (p.progress <= 0) {
        p.progress = 1;
        p.line = lines[Math.floor(Math.random() * lines.length)];
      }

      const x = p.line.x1 + (p.line.x2 - p.line.x1) * p.progress;
      const y = p.line.y1 + (p.line.y2 - p.line.y1) * p.progress;

      p.element.setAttribute('cx', x);
      p.element.setAttribute('cy', y);
    });

    animFrameId = requestAnimationFrame(animateParticles);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  init();
});
