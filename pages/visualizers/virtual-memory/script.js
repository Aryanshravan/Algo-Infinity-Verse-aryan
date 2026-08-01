class VirtualMemory {
  constructor() {
    this.pageTable = {};
    this.frames = [];
    this.tlb = [];
    this.pageFaults = 0;
    this.hits = 0;
    this.clockHand = 0;
    this.currentPage = 0;
    this.algorithm = 'fifo';
    this.framesCount = 4;
    this.pageSize = 4;
    this.logs = [];
  }

  init(framesCount, algorithm) {
    this.framesCount = framesCount;
    this.algorithm = algorithm;
    this.pageTable = {};
    this.frames = [];
    this.tlb = [];
    this.pageFaults = 0;
    this.hits = 0;
    this.clockHand = 0;
    this.currentPage = 0;
    this.logs = [];
    this.render();
  }

  accessPage(pageNum) {
    this.currentPage = pageNum;
    this.addLog(`Accessing page ${pageNum}`, 'info');
    
    // Check TLB
    if (this.tlb.includes(pageNum)) {
      this.hits++;
      this.addLog(`TLB hit! Page ${pageNum} found`, 'hit');
      this.render();
      return;
    }
    
    // Check page table
    if (this.pageTable[pageNum] !== undefined) {
      this.hits++;
      this.addLog(`Page ${pageNum} found in page table`, 'hit');
      // Update TLB
      if (!this.tlb.includes(pageNum)) {
        this.tlb.push(pageNum);
        if (this.tlb.length > 4) this.tlb.shift();
      }
      this.render();
      return;
    }
    
    // Page fault
    this.pageFaults++;
    this.addLog(`PAGE FAULT: Page ${pageNum} not in memory`, 'fault');
    
    // Page replacement
    if (this.frames.length < this.framesCount) {
      this.frames.push(pageNum);
      this.pageTable[pageNum] = this.frames.length - 1;
    } else {
      const replaced = this.replacePage(pageNum);
      this.addLog(`Replaced page ${replaced} with ${pageNum}`, 'info');
    }
    
    // Update TLB
    this.tlb.push(pageNum);
    if (this.tlb.length > 4) this.tlb.shift();
    
    this.render();
  }

  replacePage(pageNum) {
    let replaced = -1;
    
    if (this.algorithm === 'fifo') {
      replaced = this.frames[0];
      this.frames.shift();
      this.frames.push(pageNum);
    } else if (this.algorithm === 'lru') {
      // Simple LRU: remove from end
      replaced = this.frames[this.frames.length - 1];
      this.frames.pop();
      this.frames.push(pageNum);
    } else if (this.algorithm === 'clock') {
      // Clock algorithm
      while (true) {
        const idx = this.clockHand % this.frames.length;
        if (this.frames[idx] === -1) {
          replaced = this.frames[idx];
          this.frames[idx] = pageNum;
          this.clockHand = (idx + 1) % this.frames.length;
          break;
        }
        this.clockHand++;
      }
    }
    
    // Remove from page table
    for (const [key, val] of Object.entries(this.pageTable)) {
      if (val === this.frames.indexOf(replaced)) {
        delete this.pageTable[key];
        break;
      }
    }
    this.pageTable[pageNum] = this.frames.indexOf(pageNum);
    
    return replaced;
  }

  addLog(msg, type = 'info') {
    this.logs.push({ msg, type });
    if (this.logs.length > 50) this.logs.shift();
  }

  render() {
    // Render page table
    const tableEl = document.getElementById('pageTable');
    tableEl.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const div = document.createElement('div');
      div.className = 'page-entry';
      if (this.pageTable[i] !== undefined) {
        div.classList.add('present');
        div.textContent = `P${i} → F${this.pageTable[i]}`;
      } else {
        div.textContent = `P${i}`;
      }
      tableEl.appendChild(div);
    }

    // Render frames
    const framesEl = document.getElementById('framesContainer');
    framesEl.innerHTML = '';
    for (let i = 0; i < this.framesCount; i++) {
      const div = document.createElement('div');
      div.className = 'frame';
      if (i < this.frames.length) {
        div.textContent = `P${this.frames[i]}`;
      } else {
        div.classList.add('empty');
        div.textContent = 'Empty';
      }
      framesEl.appendChild(div);
    }

    // Render TLB
    const tlbEl = document.getElementById('tlb');
    tlbEl.innerHTML = this.tlb.map(p => 
      `<span class="tlb-entry">P${p}</span>`
    ).join('');

    // Render translation
    const transEl = document.getElementById('translation');
    transEl.innerHTML = `
      Virtual Address: Page ${this.currentPage}<br>
      Page Table Entry: ${this.pageTable[this.currentPage] !== undefined ? `Frame ${this.pageTable[this.currentPage]}` : 'Not in memory'}<br>
      Physical Address: ${this.pageTable[this.currentPage] !== undefined ? `Frame ${this.pageTable[this.currentPage]}` : 'Page Fault!'}
    `;

    // Render stats
    document.getElementById('faults').textContent = this.pageFaults;
    document.getElementById('hits').textContent = this.hits;
    const total = this.pageFaults + this.hits;
    document.getElementById('hitRatio').textContent = total > 0 ? `${Math.round((this.hits / total) * 100)}%` : '0%';

    // Render log
    const logEl = document.getElementById('log');
    logEl.innerHTML = this.logs.slice(-10).map(l => 
      `<div class="log-entry ${l.type}">${l.msg}</div>`
    ).join('');
  }
}

// Initialize
const vm = new VirtualMemory();
let simulationRunning = false;
let simulationInterval = null;

document.addEventListener('DOMContentLoaded', function() {
  vm.init(4, 'fifo');

  document.getElementById('runBtn').addEventListener('click', function() {
    if (simulationRunning) {
      clearInterval(simulationInterval);
      simulationRunning = false;
      this.textContent = '▶️ Run Simulation';
      return;
    }
    
    simulationRunning = true;
    this.textContent = '⏹️ Stop';
    
    const refInput = document.getElementById('refString').value;
    const pages = refInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    let idx = 0;
    
    simulationInterval = setInterval(() => {
      if (idx < pages.length) {
        vm.accessPage(pages[idx]);
        idx++;
      } else {
        clearInterval(simulationInterval);
        simulationRunning = false;
        document.getElementById('runBtn').textContent = '▶️ Run Simulation';
      }
    }, 800);
  });

  document.getElementById('stepBtn').addEventListener('click', function() {
    const refInput = document.getElementById('refString').value;
    const pages = refInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (pages.length === 0) return;
    const idx = vm.logs.length % pages.length;
    vm.accessPage(pages[idx]);
  });

  document.getElementById('resetBtn').addEventListener('click', function() {
    if (simulationRunning) {
      clearInterval(simulationInterval);
      simulationRunning = false;
      document.getElementById('runBtn').textContent = '▶️ Run Simulation';
    }
    const frames = parseInt(document.getElementById('frames').value) || 4;
    const algo = document.getElementById('algorithm').value;
    vm.init(frames, algo);
  });

  document.getElementById('algorithm').addEventListener('change', function() {
    const frames = parseInt(document.getElementById('frames').value) || 4;
    vm.init(frames, this.value);
  });

  document.getElementById('frames').addEventListener('change', function() {
    const frames = parseInt(this.value) || 4;
    const algo = document.getElementById('algorithm').value;
    vm.init(frames, algo);
  });

  // Belady's Anomaly Plotter Logic
  let anomalyChart = null;

  document.getElementById('anomalyBtn').addEventListener('click', function() {
    const refInput = document.getElementById('refString').value;
    const pages = refInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (pages.length === 0) {
      alert("Please enter a valid reference string (comma separated numbers).");
      return;
    }

    const algo = document.getElementById('algorithm').value;
    const maxFrames = 10;
    let faultCounts = [];
    let frameLabels = [];
    let pointColors = [];

    // Headless simulation
    for (let f = 1; f <= maxFrames; f++) {
      let sim = new VirtualMemory();
      sim.render = function(){}; // Muck the render method for headless speed
      sim.addLog = function(){};
      sim.init(f, algo);
      
      for (let p of pages) {
        sim.accessPage(p);
      }
      
      faultCounts.push(sim.pageFaults);
      frameLabels.push(f + " Frames");

      // Anomaly detection: if faults increased compared to f-1
      if (f > 1 && faultCounts[f - 1] > faultCounts[f - 2]) {
        pointColors.push('#ef4444'); // Red for anomaly
      } else {
        pointColors.push('#10b981'); // Green for normal
      }
    }

    // Custom segment coloring for line
    const colorCallback = (ctx) => {
      // ctx.p0DataIndex, ctx.p1DataIndex
      if (ctx.p0DataIndex !== undefined && ctx.p1DataIndex !== undefined) {
        if (faultCounts[ctx.p1DataIndex] > faultCounts[ctx.p0DataIndex]) {
          return '#ef4444'; // Belady's Anomaly!
        }
      }
      return '#3b82f6'; // Standard blue
    };

    if (anomalyChart) {
      anomalyChart.destroy();
    }

    const ctx = document.getElementById('anomalyChart').getContext('2d');
    anomalyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: frameLabels,
        datasets: [{
          label: 'Page Faults',
          data: faultCounts,
          borderColor: '#3b82f6',
          segment: {
            borderColor: colorCallback,
            borderDash: ctx => faultCounts[ctx.p1DataIndex] > faultCounts[ctx.p0DataIndex] ? [5, 5] : undefined,
          },
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: pointColors,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                let text = `Faults: ${context.raw}`;
                if (context.dataIndex > 0 && context.raw > faultCounts[context.dataIndex - 1]) {
                  text += ' (BELADY\'S ANOMALY DETECTED!)';
                }
                return text;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Total Page Faults', color: '#9ca3af' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', stepSize: 1 }
          },
          x: {
            title: { display: true, text: 'Number of Frames allocated', color: '#9ca3af' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af' }
          }
        }
      }
    });

    // Auto-scroll to anomaly chart
    document.querySelector('.anomaly-layout').scrollIntoView({ behavior: 'smooth' });
  });
});