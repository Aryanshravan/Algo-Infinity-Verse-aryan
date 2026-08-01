class CacheStampedeSimulator {
  constructor() {
    this.edgeLocations = [
      { id: 'us-east', name: 'US East', x: 20, y: 30 },
      { id: 'us-west', name: 'US West', x: 15, y: 45 },
      { id: 'eu', name: 'Europe', x: 45, y: 20 },
      { id: 'asia', name: 'Asia', x: 70, y: 35 },
      { id: 'au', name: 'Australia', x: 85, y: 60 },
    ];

    this.originServer = { x: 50, y: 70, name: 'Origin Server', capacity: 50 }; // Origin can handle 50 requests
    this.isAnimating = false;
    this.isCrashed = false;

    this.stats = {
      userRequests: 0,
      originRequests: 0,
      originLoad: 0,
    };

    this.init();
  }

  init() {
    this.bindControls();
    this.renderGraph();
    this.updateStats();
    this.addLog('🚀 Simulator initialized', 'info');
  }

  bindControls() {
    document.getElementById('simulateBtn').addEventListener('click', () => {
      this.simulateSpike();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.reset();
    });
  }

  simulateSpike() {
    if (this.isAnimating) return;
    if (this.isCrashed) {
      this.addLog('❌ Origin is crashed! Reset the server first.', 'error');
      return;
    }

    this.isAnimating = true;
    const collapsingEnabled = document.getElementById('requestCollapsingToggle').checked;
    const userCount = parseInt(document.getElementById('userCount').value) || 50;

    this.addLog(
      `🌩️ Simulating spike: ${userCount * this.edgeLocations.length} total users requesting expired asset...`,
      'warning'
    );
    this.addLog(`🔒 Request Collapsing: ${collapsingEnabled ? 'ENABLED' : 'DISABLED'}`, 'info');

    // Reset stats for the run
    this.stats.userRequests = 0;
    this.stats.originRequests = 0;
    this.updateStats();

    const svg = document.getElementById('cdnFlow');

    // Simulate Users hitting edges
    this.edgeLocations.forEach((edge, index) => {
      setTimeout(() => {
        this.addLog(`👥 ${userCount} users hit ${edge.name}`, 'info');
        this.stats.userRequests += userCount;
        this.updateStats();

        // Show user requests to edge
        for (let i = 0; i < Math.min(userCount, 20); i++) {
          this.animateUserToEdge(edge, svg);
        }

        setTimeout(() => {
          if (collapsingEnabled) {
            // Collapsing: Edge forwards only ONE request
            this.addLog(`🛡️ ${edge.name} collapsed ${userCount} requests into 1`, 'success');
            this.sendToOrigin(edge, 1, userCount);
          } else {
            // Stampede: Edge forwards ALL requests
            this.addLog(`⚠️ ${edge.name} forwarded all ${userCount} requests!`, 'error');
            this.sendToOrigin(edge, userCount, userCount);
          }
        }, 800);
      }, index * 200);
    });
  }

  animateUserToEdge(edge, svg) {
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 500;
    const ex = (edge.x / 100) * width;
    const ey = (edge.y / 100) * height;

    // Random user position near edge
    const ux = ex + (Math.random() * 80 - 40);
    const uy = ey - 40 - Math.random() * 40;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', ux);
    circle.setAttribute('cy', uy);
    circle.setAttribute('r', '3');
    circle.setAttribute('fill', '#9C27B0');
    svg.appendChild(circle);

    // Animate to edge
    const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    anim.setAttribute('attributeName', 'cy');
    anim.setAttribute('to', ey);
    anim.setAttribute('dur', '0.5s');
    anim.setAttribute('fill', 'freeze');
    circle.appendChild(anim);

    const animX = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animX.setAttribute('attributeName', 'cx');
    animX.setAttribute('to', ex);
    animX.setAttribute('dur', '0.5s');
    animX.setAttribute('fill', 'freeze');
    circle.appendChild(animX);

    setTimeout(() => circle.remove(), 600);
  }

  sendToOrigin(edge, requests, totalWaitingUsers) {
    if (this.isCrashed) return;

    const svg = document.getElementById('cdnFlow');
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 500;
    const ex = (edge.x / 100) * width;
    const ey = (edge.y / 100) * height;
    const ox = (this.originServer.x / 100) * width;
    const oy = (this.originServer.y / 100) * height;

    this.stats.originRequests += requests;

    // Animate requests to origin
    for (let i = 0; i < Math.min(requests, 30); i++) {
      setTimeout(() => {
        const reqDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        reqDot.setAttribute('r', '4');
        reqDot.setAttribute('fill', '#f44336');
        svg.appendChild(reqDot);

        const motion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        motion.setAttribute('path', `M ${ex} ${ey} L ${ox} ${oy}`);
        motion.setAttribute('dur', '0.8s');
        motion.setAttribute('fill', 'freeze');
        reqDot.appendChild(motion);

        setTimeout(() => reqDot.remove(), 900);
      }, i * 15);
    }

    setTimeout(() => {
      this.evaluateOriginLoad(totalWaitingUsers, edge, ex, ey, ox, oy);
    }, 1000);
  }

  evaluateOriginLoad(totalWaitingUsers, edge, ex, ey, ox, oy) {
    if (this.isCrashed) return;

    this.stats.originLoad = Math.round(
      (this.stats.originRequests / this.originServer.capacity) * 100
    );
    this.updateStats();

    const originRect = document.getElementById('originRect');

    if (this.stats.originLoad > 100) {
      this.crashOrigin(originRect);
    } else {
      originRect.setAttribute('fill', '#FF9800'); // normal working state
      setTimeout(() => {
        if (this.isCrashed) return;
        this.addLog(`✅ Origin served ${edge.name}`, 'success');
        this.respondToEdge(edge, totalWaitingUsers, ex, ey, ox, oy);

        // Cooldown origin
        setTimeout(() => {
          if (!this.isCrashed) originRect.setAttribute('fill', '#4CAF50'); // healthy
        }, 500);
      }, 500);
    }
  }

  crashOrigin(originRect) {
    if (this.isCrashed) return;
    this.isCrashed = true;
    this.isAnimating = false;

    this.addLog('💥 ORIGIN SERVER CRASHED DUE TO CACHE STAMPEDE!', 'error');

    originRect.setAttribute('fill', '#f44336');
    originRect.classList.add('shake');

    const statusEl = document.getElementById('originStatus');
    statusEl.textContent = 'CRASHED';
    statusEl.className = 'stat-value status-crashed';

    document.getElementById('serverStatusCard').classList.add('crashed');
  }

  respondToEdge(edge, totalWaitingUsers, ex, ey, ox, oy) {
    const svg = document.getElementById('cdnFlow');
    // Response to edge
    const resDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    resDot.setAttribute('r', '6');
    resDot.setAttribute('fill', '#4CAF50');
    svg.appendChild(resDot);

    const motion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    motion.setAttribute('path', `M ${ox} ${oy} L ${ex} ${ey}`);
    motion.setAttribute('dur', '0.6s');
    motion.setAttribute('fill', 'freeze');
    resDot.appendChild(motion);

    setTimeout(() => {
      resDot.remove();
      this.addLog(`🟢 ${edge.name} fulfilled ${totalWaitingUsers} waiting promises`, 'success');

      // Edge fulfills users
      for (let i = 0; i < Math.min(totalWaitingUsers, 20); i++) {
        const uRes = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        uRes.setAttribute('r', '3');
        uRes.setAttribute('fill', '#4CAF50');
        svg.appendChild(uRes);

        const ux = ex + (Math.random() * 80 - 40);
        const uy = ey - 40 - Math.random() * 40;

        const motionU = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        motionU.setAttribute('path', `M ${ex} ${ey} L ${ux} ${uy}`);
        motionU.setAttribute('dur', '0.4s');
        motionU.setAttribute('fill', 'freeze');
        uRes.appendChild(motionU);

        setTimeout(() => uRes.remove(), 500);
      }

      // Check if all edges are done
      setTimeout(() => {
        this.isAnimating = false; // Simplified
      }, 500);
    }, 600);
  }

  reset() {
    this.isCrashed = false;
    this.isAnimating = false;
    this.stats = { userRequests: 0, originRequests: 0, originLoad: 0 };

    document.getElementById('logMessages').innerHTML = '';
    this.addLog('🔄 Origin Server Rebooted', 'info');

    const statusEl = document.getElementById('originStatus');
    statusEl.textContent = 'HEALTHY';
    statusEl.className = 'stat-value status-healthy';
    document.getElementById('serverStatusCard').classList.remove('crashed');

    this.renderGraph();
    this.updateStats();
  }

  renderGraph() {
    const svg = document.getElementById('cdnFlow');
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 500;

    svg.innerHTML = '';

    const grid = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    grid.setAttribute('width', '100%');
    grid.setAttribute('height', '100%');
    grid.setAttribute('fill', '#fafafa');
    grid.setAttribute('rx', '8');
    svg.appendChild(grid);

    // Draw lines
    this.edgeLocations.forEach((edge) => {
      const edgeX = (edge.x / 100) * width;
      const edgeY = (edge.y / 100) * height;
      const originX = (this.originServer.x / 100) * width;
      const originY = (this.originServer.y / 100) * height;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', edgeX);
      line.setAttribute('y1', edgeY);
      line.setAttribute('x2', originX);
      line.setAttribute('y2', originY);
      line.setAttribute('stroke', '#ddd');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '4,4');
      svg.appendChild(line);
    });

    // Draw edges
    this.edgeLocations.forEach((edge) => {
      const x = (edge.x / 100) * width;
      const y = (edge.y / 100) * height;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '25');
      circle.setAttribute('fill', '#2196F3');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '3');
      svg.appendChild(circle);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', y + 40);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '12');
      label.setAttribute('fill', '#333');
      label.setAttribute('font-weight', 'bold');
      label.textContent = edge.name;
      svg.appendChild(label);
    });

    // Origin Server
    const ox = (this.originServer.x / 100) * width;
    const oy = (this.originServer.y / 100) * height;

    const originRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    originRect.setAttribute('id', 'originRect');
    originRect.setAttribute('x', ox - 50);
    originRect.setAttribute('y', oy - 30);
    originRect.setAttribute('width', '100');
    originRect.setAttribute('height', '60');
    originRect.setAttribute('fill', '#4CAF50'); // healthy
    originRect.setAttribute('rx', '8');
    originRect.setAttribute('stroke', '#fff');
    originRect.setAttribute('stroke-width', '4');
    svg.appendChild(originRect);

    const originLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    originLabel.setAttribute('x', ox);
    originLabel.setAttribute('y', oy + 5);
    originLabel.setAttribute('text-anchor', 'middle');
    originLabel.setAttribute('font-size', '14');
    originLabel.setAttribute('fill', '#fff');
    originLabel.setAttribute('font-weight', 'bold');
    originLabel.textContent = 'Origin Server';
    svg.appendChild(originLabel);
  }

  updateStats() {
    document.getElementById('userRequestsCount').textContent = this.stats.userRequests;
    document.getElementById('originRequestsCount').textContent = this.stats.originRequests;
    document.getElementById('originLoadValue').textContent = `${this.stats.originLoad}%`;
  }

  addLog(message, type = 'info') {
    const container = document.getElementById('logMessages');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
    container.prepend(entry);

    while (container.children.length > 50) {
      container.removeChild(container.lastChild);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CacheStampedeSimulator();
});
