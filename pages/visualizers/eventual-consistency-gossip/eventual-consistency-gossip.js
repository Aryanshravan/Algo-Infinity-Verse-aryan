/* global d3 */
const NODES_COUNT = 30;
let nodes = [];
let links = [];
let currentDataVersion = 0;
let gossipInterval = null;
let gossipSpeed = 800;
let simulation;

const svg = d3.select('#meshSvg');
const width = 900,
  height = 480;
const g = svg.append('g');

let linkElements, nodeElements, labelElements;

function initNetwork() {
  nodes = Array.from({ length: NODES_COUNT }, (_, i) => ({
    id: i,
    state: 'online', // online, offline, stale, merging
    dataVersion: currentDataVersion,
    x: Math.random() * width,
    y: Math.random() * height,
  }));

  links = [];
  for (let i = 0; i < NODES_COUNT; i++) {
    for (let j = i + 1; j < NODES_COUNT; j++) {
      if (Math.random() < 0.15) {
        links.push({ source: i, target: j, active: false, merkle: false });
      }
    }
  }

  // Ensure connected graph roughly
  for (let i = 1; i < NODES_COUNT; i++) {
    links.push({ source: i, target: Math.floor(Math.random() * i), active: false, merkle: false });
  }

  simulation = d3
    .forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-150))
    .force('link', d3.forceLink(links).distance(70))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', ticked);

  draw();
}

function ticked() {
  linkElements
    .attr('x1', (d) => d.source.x)
    .attr('y1', (d) => d.source.y)
    .attr('x2', (d) => d.target.x)
    .attr('y2', (d) => d.target.y);

  nodeElements.attr('cx', (d) => d.x).attr('cy', (d) => d.y);

  labelElements.attr('x', (d) => d.x).attr('y', (d) => d.y + 3);
}

function draw() {
  g.selectAll('*').remove();

  linkElements = g
    .append('g')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'mesh-link');

  const nodeGroup = g
    .append('g')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node-group')
    .on('click', toggleNodeState)
    .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended));

  nodeElements = nodeGroup
    .append('circle')
    .attr('r', 16)
    .attr('class', (d) => `mesh-node ${d.state}`);

  labelElements = nodeGroup
    .append('text')
    .attr('class', 'mesh-node-label')
    .text((d) => `v${d.dataVersion}`);
}

function dragstarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function toggleNodeState(event, d) {
  if (d.state === 'online' || d.state === 'stale') {
    d.state = 'offline';
  } else if (d.state === 'offline') {
    d.state = d.dataVersion < currentDataVersion ? 'stale' : 'online';
  }
  updateNodeStyles();
  updateStatus(`Node ${d.id} is now ${d.state}.`);
}

function updateNodeStyles() {
  nodeElements.attr('class', (d) => `mesh-node ${d.state}`);
  labelElements.text((d) => `v${d.dataVersion}`);
}

function updateLinkStyles() {
  linkElements.attr('class', (d) => {
    if (d.merkle) return 'merkle-link';
    if (d.active) return 'gossip-link';
    return 'mesh-link';
  });
}

function writeData() {
  currentDataVersion++;
  let written = 0;
  nodes.forEach((n) => {
    if (n.state === 'online' || n.state === 'stale') {
      n.dataVersion = currentDataVersion;
      n.state = 'online';
      written++;
    }
  });
  updateNodeStyles();
  updateStatus(`Wrote v${currentDataVersion} to ${written} online nodes.`);
}

function startGossip() {
  if (gossipInterval) {
    clearInterval(gossipInterval);
    gossipInterval = null;
    document.getElementById('btnGossip').textContent = '▶ Start Gossip (Anti-Entropy)';
    return;
  }
  document.getElementById('btnGossip').textContent = '⏸ Pause Gossip';
  gossipInterval = setInterval(gossipRound, gossipSpeed);
}

function gossipRound() {
  links.forEach((l) => {
    l.active = false;
    l.merkle = false;
  });
  nodes.forEach((n) => {
    if (n.state === 'merging') n.state = n.dataVersion < currentDataVersion ? 'stale' : 'online';
  });

  const onlineNodes = nodes.filter((n) => n.state !== 'offline');
  if (onlineNodes.length < 2) return;

  onlineNodes.forEach((n) => {
    const peers = onlineNodes.filter((p) => p.id !== n.id);
    const peer = peers[Math.floor(Math.random() * peers.length)];

    let link = links.find(
      (l) =>
        (l.source.id === n.id && l.target.id === peer.id) ||
        (l.source.id === peer.id && l.target.id === n.id)
    );
    if (!link) {
      link = { source: n, target: peer, active: true, merkle: false };
      links.push(link);
      draw();
      simulation.nodes(nodes);
      simulation.force('link').links(links);
      simulation.alpha(0.1).restart();
    } else {
      link.active = true;
    }

    if (n.dataVersion !== peer.dataVersion) {
      link.merkle = true;
      const maxV = Math.max(n.dataVersion, peer.dataVersion);
      n.dataVersion = maxV;
      peer.dataVersion = maxV;
      n.state = 'merging';
      peer.state = 'merging';
      setTimeout(() => {
        if (n.state === 'merging')
          n.state = n.dataVersion < currentDataVersion ? 'stale' : 'online';
        if (peer.state === 'merging')
          peer.state = peer.dataVersion < currentDataVersion ? 'stale' : 'online';
        updateNodeStyles();
      }, gossipSpeed * 0.8);
    }
  });

  updateLinkStyles();
  updateNodeStyles();

  const allOnline = nodes.filter((n) => n.state !== 'offline');
  const converged = allOnline.every((n) => n.dataVersion === currentDataVersion);
  if (converged) {
    updateStatus(`Gossip round complete. All online nodes converged to v${currentDataVersion}.`);
  } else {
    updateStatus(`Gossip round complete. Exchanging Merkle trees for anti-entropy...`);
  }
}

function updateStatus(msg) {
  document.getElementById('statusLine').textContent = msg;
}

document.getElementById('btnInject').addEventListener('click', writeData);
document.getElementById('btnGossip').addEventListener('click', startGossip);
document.getElementById('btnReset').addEventListener('click', () => {
  if (gossipInterval) startGossip();
  currentDataVersion = 0;
  initNetwork();
  updateStatus('Cluster reset. Ready.');
});
document.getElementById('speedSlider').addEventListener('input', (e) => {
  gossipSpeed = parseInt(e.target.value);
  document.getElementById('speedVal').textContent = gossipSpeed + 'ms';
  if (gossipInterval) {
    clearInterval(gossipInterval);
    gossipInterval = setInterval(gossipRound, gossipSpeed);
  }
});

initNetwork();
