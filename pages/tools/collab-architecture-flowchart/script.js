// Collaborative Architecture Diagrammer Script

const ICONS = {
  loadbalancer: "fa-scale-balanced",
  gateway: "fa-torii-gate",
  service: "fa-server",
  database: "fa-database",
  cache: "fa-bolt",
  queue: "fa-list-ol",
  storage: "fa-box-archive",
  cdn: "fa-globe"
};

class ArchitectureDiagrammerApp {
  constructor() {
    this.nodes = [
      { id: "n1", type: "gateway", label: "API Gateway", x: 60, y: 150 },
      { id: "n2", type: "service", label: "User Service", x: 280, y: 80 },
      { id: "n3", type: "service", label: "Order Service", x: 280, y: 220 },
      { id: "n4", type: "database", label: "PostgreSQL DB", x: 500, y: 80 },
      { id: "n5", type: "cache", label: "Redis Cluster", x: 500, y: 220 }
    ];

    this.connections = [
      { from: "n1", to: "n2" },
      { from: "n1", to: "n3" },
      { from: "n2", to: "n4" },
      { from: "n3", to: "n5" }
    ];

    this.draggedNode = null;
    this.dragOffset = { x: 0, y: 0 };
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderNodes();
    this.renderConnectors();
  }

  bindEvents() {
    // Theme Toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-mode');
    });

    // Palette Items
    document.querySelectorAll('.caf-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        this.addNode(type, item.innerText.trim());
      });
    });

    // Actions
    document.getElementById('btnClearCanvas').addEventListener('click', () => {
      this.nodes = [];
      this.connections = [];
      this.renderNodes();
      this.renderConnectors();
    });

    document.getElementById('btnExportJson').addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes: this.nodes, connections: this.connections }));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = "architecture_diagram.json";
      a.click();
    });

    document.getElementById('btnExportPng').addEventListener('click', () => {
      alert("Exporting architecture diagram to PNG canvas snapshot...");
    });

    document.getElementById('btnCopyInvite').addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      alert("P2P Collaboration link copied to clipboard!");
    });
  }

  addNode(type, label) {
    const newId = "n_" + Date.now();
    this.nodes.push({
      id: newId,
      type: type,
      label: label,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200
    });

    // Connect to last node if exists
    if (this.nodes.length > 1) {
      this.connections.push({
        from: this.nodes[this.nodes.length - 2].id,
        to: newId
      });
    }

    this.renderNodes();
    this.renderConnectors();
  }

  deleteNode(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
    this.renderNodes();
    this.renderConnectors();
  }

  renderNodes() {
    const container = document.getElementById('nodesContainer');
    container.innerHTML = this.nodes.map(node => `
      <div class="caf-node" id="node_${node.id}" style="left: ${node.x}px; top: ${node.y}px;">
        <div class="caf-node-delete" data-id="${node.id}">&times;</div>
        <div class="caf-node-header">
          <i class="fas ${ICONS[node.type] || 'fa-cube'}"></i> ${node.label}
        </div>
      </div>
    `).join('');

    // Attach Drag & Delete events
    container.querySelectorAll('.caf-node-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteNode(btn.dataset.id);
      });
    });

    container.querySelectorAll('.caf-node').forEach(nodeEl => {
      nodeEl.addEventListener('mousedown', (e) => {
        const id = nodeEl.id.replace('node_', '');
        this.draggedNode = this.nodes.find(n => n.id === id);
        this.dragOffset.x = e.clientX - this.draggedNode.x;
        this.dragOffset.y = e.clientY - this.draggedNode.y;
      });
    });

    document.addEventListener('mousemove', (e) => {
      if (this.draggedNode) {
        this.draggedNode.x = e.clientX - this.dragOffset.x;
        this.draggedNode.y = e.clientY - this.dragOffset.y;
        const nodeEl = document.getElementById(`node_${this.draggedNode.id}`);
        if (nodeEl) {
          nodeEl.style.left = `${this.draggedNode.x}px`;
          nodeEl.style.top = `${this.draggedNode.y}px`;
        }
        this.renderConnectors();
      }
    });

    document.addEventListener('mouseup', () => {
      this.draggedNode = null;
    });
  }

  renderConnectors() {
    const svg = document.getElementById('svgConnectors');
    let svgContent = `<defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1"/>
      </marker>
    </defs>`;

    this.connections.forEach(conn => {
      const fromNode = this.nodes.find(n => n.id === conn.from);
      const toNode = this.nodes.find(n => n.id === conn.to);

      if (fromNode && toNode) {
        const x1 = fromNode.x + 80;
        const y1 = fromNode.y + 25;
        const x2 = toNode.x + 80;
        const y2 = toNode.y + 25;

        svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6366f1" stroke-width="2" marker-end="url(#arrow)" stroke-dasharray="4 4" />`;
      }
    });

    svg.innerHTML = svgContent;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ArchitectureDiagrammerApp();
});
