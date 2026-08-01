// graph-worker.js
// High-Performance Web Worker for Graph Layouts
// Computes a Force-Directed layout in the background so the main thread remains unblocked

self.onmessage = function (e) {
  const { nodes, edges, iterations, width, height } = e.data;

  // Simple Force-Directed Graph implementation (Fruchterman-Reingold inspired)
  const area = width * height;
  const k = Math.sqrt(area / nodes.length);
  const repulse = (x) => (k * k) / x;
  const attract = (x) => (x * x) / k;

  let currentNodes = JSON.parse(JSON.stringify(nodes));
  const disp = currentNodes.map(() => ({ x: 0, y: 0 }));

  for (let i = 0; i < iterations; i++) {
    // 1. Calculate repulsive forces
    for (let v = 0; v < currentNodes.length; v++) {
      disp[v].x = 0;
      disp[v].y = 0;
      for (let u = 0; u < currentNodes.length; u++) {
        if (u !== v) {
          const dx = currentNodes[v].x - currentNodes[u].x;
          const dy = currentNodes[v].y - currentNodes[u].y;
          let deltaLength = Math.sqrt(dx * dx + dy * dy);
          if (deltaLength === 0) deltaLength = 0.01; // prevent division by zero
          
          const force = repulse(deltaLength);
          disp[v].x += (dx / deltaLength) * force;
          disp[v].y += (dy / deltaLength) * force;
        }
      }
    }

    // 2. Calculate attractive forces
    for (const edge of edges) {
      const uIndex = currentNodes.findIndex((n) => n.id === edge.source);
      const vIndex = currentNodes.findIndex((n) => n.id === edge.target);
      if (uIndex === -1 || vIndex === -1) continue;

      const dx = currentNodes[vIndex].x - currentNodes[uIndex].x;
      const dy = currentNodes[vIndex].y - currentNodes[uIndex].y;
      let deltaLength = Math.sqrt(dx * dx + dy * dy);
      if (deltaLength === 0) deltaLength = 0.01;

      const force = attract(deltaLength);
      const fx = (dx / deltaLength) * force;
      const fy = (dy / deltaLength) * force;

      disp[uIndex].x += fx;
      disp[uIndex].y += fy;
      disp[vIndex].x -= fx;
      disp[vIndex].y -= fy;
    }

    // 3. Limit maximum displacement and apply
    // Cool down the temperature over iterations
    const temperature = Math.max(10, (width / 10) * (1 - i / iterations));
    
    for (let v = 0; v < currentNodes.length; v++) {
      const dx = disp[v].x;
      const dy = disp[v].y;
      let dispLength = Math.sqrt(dx * dx + dy * dy);
      if (dispLength > 0) {
        currentNodes[v].x += (dx / dispLength) * Math.min(dispLength, temperature);
        currentNodes[v].y += (dy / dispLength) * Math.min(dispLength, temperature);
      }
      
      // Constrain to frame bounds (with some padding)
      const padding = 30;
      currentNodes[v].x = Math.max(padding, Math.min(width - padding, currentNodes[v].x));
      currentNodes[v].y = Math.max(padding, Math.min(height - padding, currentNodes[v].y));
    }
  }

  // Send the calculated node positions back
  self.postMessage({ nodes: currentNodes });
};
