// Simple hash function for string to 0-359 angle
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

document.addEventListener('DOMContentLoaded', () => {
  const addNodeBtn = document.getElementById('add-node-btn');
  const removeNodeBtn = document.getElementById('remove-node-btn');
  const routeKeyBtn = document.getElementById('route-key-btn');
  const keyInput = document.getElementById('key-input');
  const logsArea = document.getElementById('logs-area');
  const ringContainer = document.getElementById('ring-container');
  const statNodes = document.getElementById('stat-nodes');
  const statKeys = document.getElementById('stat-keys');

  const boundedLoadsToggle = document.getElementById('bounded-loads-toggle');
  const cFactorGroup = document.getElementById('c-factor-group');
  const cFactorSlider = document.getElementById('c-factor-slider');
  const cFactorVal = document.getElementById('c-factor-val');

  const RING_RADIUS = 160;
  let nodes = [];
  let keys = [];
  let nextNodeId = 1;

  boundedLoadsToggle.addEventListener('change', (e) => {
    cFactorGroup.style.display = e.target.checked ? 'block' : 'none';
    rebalanceKeys();
    updateStats();
  });

  cFactorSlider.addEventListener('input', (e) => {
    cFactorVal.textContent = e.target.value;
    rebalanceKeys();
    updateStats();
  });

  function logMessage(msg) {
    const entry = document.createElement('div');
    entry.textContent = `> ${msg}`;
    entry.style.marginBottom = '4px';
    logsArea.appendChild(entry);
    logsArea.scrollTop = logsArea.scrollHeight;
  }

  function getCoords(angle, radius = RING_RADIUS) {
    const rad = (angle - 90) * (Math.PI / 180);
    // Center is 200, 200 in the container
    return {
      x: 200 + radius * Math.cos(rad),
      y: 200 + radius * Math.sin(rad),
    };
  }

  function renderNode(node) {
    const coords = getCoords(node.angle);

    const el = document.createElement('div');
    el.className = 'server-node';
    el.id = `node-${node.id}`;
    el.style.left = `${coords.x}px`;
    el.style.top = `${coords.y}px`;

    el.innerHTML = `
            <i class="fa-solid fa-server"></i>
            <div class="node-label">Node ${node.id}</div>
        `;

    ringContainer.appendChild(el);
    node.el = el;
  }

  function findTargetNode(keyAngle, currentLoads, capacity) {
    if (nodes.length === 0) return null;

    let sortedNodes = [...nodes].sort((a, b) => a.angle - b.angle);
    
    // Find the primary target index
    let startIndex = 0;
    for (let i = 0; i < sortedNodes.length; i++) {
      if (sortedNodes[i].angle >= keyAngle) {
        startIndex = i;
        break;
      }
    }

    const useBounded = boundedLoadsToggle && boundedLoadsToggle.checked;

    // Search for a node with capacity
    for (let i = 0; i < sortedNodes.length; i++) {
      const idx = (startIndex + i) % sortedNodes.length;
      const node = sortedNodes[idx];
      
      if (!useBounded) return node; // Standard consistent hashing
      
      const load = currentLoads.get(node.id) || 0;
      if (load < capacity) {
        return node;
      }
    }
    
    // Fallback if all nodes are at capacity (shouldn't happen with valid c > 1, but just in case)
    return sortedNodes[startIndex];
  }

  function updateStats() {
    statNodes.textContent = nodes.length;
    statKeys.textContent = keys.length;

    // Compute variance
    const varianceChart = document.getElementById('variance-chart');
    const varianceStats = document.getElementById('variance-stats');
    if (varianceChart && varianceStats) {
      if (nodes.length === 0 || keys.length === 0) {
        varianceChart.innerHTML = '';
        varianceStats.textContent = 'Variance: 0.00';
      } else {
        const counts = new Map(nodes.map((n) => [n.id, 0]));
        keys.forEach((k) => {
          if (k.targetId !== undefined) {
            counts.set(k.targetId, (counts.get(k.targetId) || 0) + 1);
          }
        });

        const countValues = Array.from(counts.values());
        const mean = countValues.reduce((a, b) => a + b, 0) / nodes.length;
        const squaredDiffs = countValues.map((c) => Math.pow(c - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / nodes.length;

        varianceStats.textContent = `Variance: ${variance.toFixed(2)}`;

        // Draw bars
        varianceChart.innerHTML = '';
        const maxCount = Math.max(...countValues, 1);
        nodes.forEach((n) => {
          const count = counts.get(n.id);
          const heightPct = (count / maxCount) * 100;
          const bar = document.createElement('div');
          bar.style.flex = '1';
          bar.style.backgroundColor = '#4facfe';
          bar.style.height = `${heightPct}%`;
          bar.style.minHeight = '1px';
          bar.style.transition = 'height 0.3s ease';
          bar.style.borderRadius = '4px 4px 0 0';
          bar.title = `Node ${n.id}: ${count} keys`;

          // Add text label inside bar if tall enough, else use title
          if (heightPct > 20) {
            bar.style.display = 'flex';
            bar.style.alignItems = 'flex-end';
            bar.style.justifyContent = 'center';
            bar.style.color = '#fff';
            bar.style.fontSize = '0.75rem';
            bar.style.paddingBottom = '4px';
            bar.textContent = count;
          }

          varianceChart.appendChild(bar);
        });
      }
    }
  }

  function rebalanceKeys() {
    if (nodes.length === 0) {
      keys.forEach((k) => (k.el.style.display = 'none'));
      return;
    }

    const currentLoads = new Map(nodes.map((n) => [n.id, 0]));
    const cFactor = parseFloat(cFactorSlider.value);
    const capacity = Math.ceil((keys.length / nodes.length) * cFactor) + 1; // +1 to avoid 0 capacity lockouts

    keys.forEach((keyObj) => {
      keyObj.el.style.display = 'flex';
      const target = findTargetNode(keyObj.angle, currentLoads, capacity);
      keyObj.targetId = target.id;
      currentLoads.set(target.id, (currentLoads.get(target.id) || 0) + 1);

      const targetCoords = getCoords(target.angle, RING_RADIUS);
      // Small delay for smooth animation
      setTimeout(() => {
        keyObj.el.style.left = `${targetCoords.x}px`;
        keyObj.el.style.top = `${targetCoords.y}px`;
      }, 50);
    });
  }

  addNodeBtn.addEventListener('click', () => {
    const id = nextNodeId++;
    const angle = Math.floor(Math.random() * 360);
    const node = { id, angle };
    nodes.push(node);
    renderNode(node);
    logMessage(`Added Node ${id} at angle ${angle}°`);
    rebalanceKeys();
    updateStats();
  });

  removeNodeBtn.addEventListener('click', () => {
    if (nodes.length === 0) return;
    const node = nodes.pop();
    node.el.remove();
    logMessage(`Removed Node ${node.id}. Rebalancing keys...`);
    rebalanceKeys();
    updateStats();
  });

  routeKeyBtn.addEventListener('click', () => {
    if (nodes.length === 0) {
      alert('Add at least one node first!');
      return;
    }
    const key = keyInput.value.trim() || `data_${Math.floor(Math.random() * 1000)}`;
    const angle = simpleHash(key);
    const keyObj = { key, angle };
    
    const coords = getCoords(keyObj.angle, RING_RADIUS - 30);
    const el = document.createElement('div');
    el.className = 'data-key';
    el.style.left = `${coords.x}px`;
    el.style.top = `${coords.y}px`;
    el.innerHTML = `<div class="key-label">${keyObj.key}</div>`;
    
    ringContainer.appendChild(el);
    keyObj.el = el;
    keys.push(keyObj);

    logMessage(`Added Key '${key}'`);
    rebalanceKeys();
    updateStats();
    keyInput.value = '';
  });

  // Init with 3 nodes
  for (let i = 0; i < 3; i++) {
    addNodeBtn.click();
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    simpleHash,
    findTargetNode: (keyAngle, nodeList) => {
      if (nodeList.length === 0) return null;
      let sortedNodes = [...nodeList].sort((a, b) => a.angle - b.angle);
      for (let node of sortedNodes) {
        if (node.angle >= keyAngle) return node;
      }
      return sortedNodes[0];
    },
  };
}
