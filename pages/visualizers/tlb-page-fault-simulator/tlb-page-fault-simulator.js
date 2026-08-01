document.addEventListener('DOMContentLoaded', () => {
  // Configuration constants
  const NUM_VIRTUAL_PAGES = 64;
  const NUM_PHYSICAL_FRAMES = 16;
  const TLB_SIZE = 4;

  // State
  let tlb = []; // Array of objects { vpn, pfn, lastAccess }
  let pageTable = new Array(NUM_VIRTUAL_PAGES).fill(null); // Maps vpn -> { present, pfn, diskBlock }
  let physicalMemory = new Array(NUM_PHYSICAL_FRAMES).fill(null); // Maps pfn -> vpn

  let stats = { accesses: 0, hits: 0, misses: 0, faults: 0 };
  let isRunning = false;
  let isPaused = false;
  let animationId = null;
  let currentVpn = 0;
  let clock = 0;
  let accessMode = 'contiguous'; // 'contiguous' or 'stride'

  // DOM Elements
  const els = {
    tlbSlots: document.getElementById('tlb-slots'),
    ptEntries: document.getElementById('pt-entries'),
    ramFrames: document.getElementById('ram-frames'),
    diskPages: document.getElementById('disk-pages'),
    currentVa: document.getElementById('current-va'),
    tlbStatus: document.getElementById('tlb-status'),
    ptStatus: document.getElementById('pt-status'),
    log: document.getElementById('system-log'),
    statAccesses: document.getElementById('stat-accesses'),
    statHits: document.getElementById('stat-hits'),
    statMisses: document.getElementById('stat-misses'),
    statFaults: document.getElementById('stat-faults'),
    btnContiguous: document.getElementById('btn-contiguous'),
    btnStride: document.getElementById('btn-stride'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),
  };

  function initSystem() {
    tlb = [];
    pageTable = new Array(NUM_VIRTUAL_PAGES).fill(null).map((_, i) => ({
      vpn: i,
      present: false,
      pfn: -1,
      diskBlock: i, // simplify: disk block matches VPN initially
    }));
    physicalMemory = new Array(NUM_PHYSICAL_FRAMES).fill(null);
    stats = { accesses: 0, hits: 0, misses: 0, faults: 0 };
    clock = 0;
    currentVpn = 0;
    updateUI();
    log('System reset. Memory initialized.');
  }

  function formatHex(num) {
    return '0x' + num.toString(16).padStart(2, '0').toUpperCase();
  }

  function updateUI() {
    // Render TLB
    els.tlbSlots.innerHTML = '';
    for (let i = 0; i < TLB_SIZE; i++) {
      const entry = tlb[i];
      const div = document.createElement('div');
      div.className = 'memory-slot';
      div.id = `tlb-slot-${i}`;
      if (entry) {
        div.innerHTML = `VPN: ${formatHex(entry.vpn)}<br>PFN: ${formatHex(entry.pfn)}`;
      } else {
        div.innerHTML = `Empty`;
        div.style.opacity = '0.5';
      }
      els.tlbSlots.appendChild(div);
    }

    // Render PT
    els.ptEntries.innerHTML = '';
    for (let i = 0; i < NUM_VIRTUAL_PAGES; i++) {
      const entry = pageTable[i];
      const div = document.createElement('div');
      div.className = 'memory-slot';
      div.id = `pt-entry-${i}`;
      div.innerHTML = `VPN ${formatHex(i)}<br>${entry.present ? 'RAM PFN ' + formatHex(entry.pfn) : 'Disk'}`;
      if (!entry.present) div.style.opacity = '0.6';
      els.ptEntries.appendChild(div);
    }

    // Render RAM
    els.ramFrames.innerHTML = '';
    for (let i = 0; i < NUM_PHYSICAL_FRAMES; i++) {
      const vpn = physicalMemory[i];
      const div = document.createElement('div');
      div.className = 'memory-slot';
      div.id = `ram-frame-${i}`;
      if (vpn !== null) {
        div.innerHTML = `PFN ${formatHex(i)}<br>VPN ${formatHex(vpn)}`;
      } else {
        div.innerHTML = `Free`;
        div.style.opacity = '0.5';
      }
      els.ramFrames.appendChild(div);
    }

    // Render Disk
    els.diskPages.innerHTML = '';
    for (let i = 0; i < NUM_VIRTUAL_PAGES; i++) {
      const div = document.createElement('div');
      div.className = 'memory-slot';
      div.id = `disk-page-${i}`;
      div.innerHTML = `Disk ${formatHex(i)}`;
      const inRam = pageTable[i].present;
      if (inRam) div.style.opacity = '0.3';
      els.diskPages.appendChild(div);
    }

    // Update Stats
    els.statAccesses.textContent = stats.accesses;
    els.statHits.textContent = stats.hits;
    els.statMisses.textContent = stats.misses;
    els.statFaults.textContent = stats.faults;
  }

  function log(msg) {
    const div = document.createElement('div');
    div.textContent = `[${stats.accesses}] ${msg}`;
    els.log.appendChild(div);
    els.log.scrollTop = els.log.scrollHeight;
  }

  function highlight(id, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hit', 'miss', 'fault');
    void el.offsetWidth; // trigger reflow
    el.classList.add(type);
    setTimeout(() => {
      if (el) el.classList.remove('hit', 'miss', 'fault');
    }, 800);
  }

  function setStatus(el, text, type) {
    el.textContent = text;
    el.className = 'status-indicator ' + type;
    setTimeout(() => {
      el.textContent = 'Idle';
      el.className = 'status-indicator';
    }, 800);
  }

  // Core simulation step
  async function simulateAccess() {
    if (!isRunning || isPaused) return;

    stats.accesses++;
    clock++;

    // Determine next VPN based on mode
    if (accessMode === 'contiguous') {
      currentVpn = (currentVpn + 1) % NUM_VIRTUAL_PAGES;
    } else {
      // Stride access (e.g. jumping by 8 pages to guarantee thrashing)
      currentVpn = (currentVpn + 8) % NUM_VIRTUAL_PAGES;
      if (currentVpn === 0) currentVpn = 1; // Slight offset to cover more pages
    }

    els.currentVa.textContent = formatHex(currentVpn);

    // 1. Check TLB
    let tlbHit = false;
    let tlbIndex = -1;
    for (let i = 0; i < tlb.length; i++) {
      if (tlb[i].vpn === currentVpn) {
        tlbHit = true;
        tlbIndex = i;
        break;
      }
    }

    if (tlbHit) {
      stats.hits++;
      tlb[tlbIndex].lastAccess = clock;
      log(`TLB Hit for VPN ${formatHex(currentVpn)} -> PFN ${formatHex(tlb[tlbIndex].pfn)}`);
      setStatus(els.tlbStatus, 'Hit', 'success');
      highlight(`tlb-slot-${tlbIndex}`, 'hit');
      highlight(`ram-frame-${tlb[tlbIndex].pfn}`, 'hit');
    } else {
      stats.misses++;
      setStatus(els.tlbStatus, 'Miss', 'warning');
      log(`TLB Miss for VPN ${formatHex(currentVpn)}. Checking Page Table...`);

      await new Promise((r) => setTimeout(r, 400)); // Simulate delay for PT walk

      // 2. Check Page Table
      let ptEntry = pageTable[currentVpn];
      highlight(`pt-entry-${currentVpn}`, 'warning');

      if (ptEntry.present) {
        log(`Page Table Hit for VPN ${formatHex(currentVpn)} -> PFN ${formatHex(ptEntry.pfn)}`);
        setStatus(els.ptStatus, 'Hit', 'success');
        updateTLB(currentVpn, ptEntry.pfn);
        highlight(`ram-frame-${ptEntry.pfn}`, 'hit');
      } else {
        // 3. Page Fault!
        stats.faults++;
        setStatus(els.ptStatus, 'Fault', 'danger');
        log(`PAGE FAULT! VPN ${formatHex(currentVpn)} not in RAM. Fetching from Disk...`);
        highlight(`disk-page-${currentVpn}`, 'fault');

        await new Promise((r) => setTimeout(r, 600)); // Simulate slow disk IO

        let pfn = allocateFrame(currentVpn);
        ptEntry.present = true;
        ptEntry.pfn = pfn;

        updateTLB(currentVpn, pfn);
        highlight(`ram-frame-${pfn}`, 'hit');
        updateUI(); // Refresh to show new mappings
      }
    }

    if (isRunning && !isPaused) {
      animationId = setTimeout(simulateAccess, 1000);
    }
  }

  function updateTLB(vpn, pfn) {
    if (tlb.length < TLB_SIZE) {
      tlb.push({ vpn, pfn, lastAccess: clock });
    } else {
      // LRU Eviction
      tlb.sort((a, b) => a.lastAccess - b.lastAccess);
      log(`TLB Evicting VPN ${formatHex(tlb[0].vpn)}`);
      tlb[0] = { vpn, pfn, lastAccess: clock };
    }
    updateUI(); // Reflect TLB change
  }

  function allocateFrame(vpn) {
    // Find free frame
    for (let i = 0; i < NUM_PHYSICAL_FRAMES; i++) {
      if (physicalMemory[i] === null) {
        physicalMemory[i] = vpn;
        return i;
      }
    }

    // RAM is full, need to evict a page (FIFO for simplicity)
    // Find victim frame (we'll just use a simple round-robin / FIFO approach)
    let victimPfn = clock % NUM_PHYSICAL_FRAMES;
    let victimVpn = physicalMemory[victimPfn];

    log(`RAM Full! Evicting VPN ${formatHex(victimVpn)} from PFN ${formatHex(victimPfn)} to Disk`);

    // Invalidate PT entry for victim
    pageTable[victimVpn].present = false;
    pageTable[victimVpn].pfn = -1;

    // Also remove from TLB if present
    tlb = tlb.filter((entry) => entry.vpn !== victimVpn);

    physicalMemory[victimPfn] = vpn;
    return victimPfn;
  }

  // Event Listeners
  els.btnContiguous.addEventListener('click', () => {
    accessMode = 'contiguous';
    startSimulation();
  });

  els.btnStride.addEventListener('click', () => {
    accessMode = 'stride';
    startSimulation();
  });

  els.btnPause.addEventListener('click', () => {
    if (isPaused) {
      isPaused = false;
      els.btnPause.innerHTML = '<i class="fas fa-pause"></i> Pause';
      els.btnPause.classList.replace('primary', 'secondary');
      simulateAccess();
    } else {
      isPaused = true;
      els.btnPause.innerHTML = '<i class="fas fa-play"></i> Resume';
      els.btnPause.classList.replace('secondary', 'primary');
    }
  });

  els.btnReset.addEventListener('click', () => {
    isRunning = false;
    isPaused = false;
    clearTimeout(animationId);
    els.btnPause.disabled = true;
    els.btnPause.innerHTML = '<i class="fas fa-pause"></i> Pause';
    initSystem();
  });

  function startSimulation() {
    if (!isRunning) {
      isRunning = true;
      isPaused = false;
      els.btnPause.disabled = false;
      log(`Starting ${accessMode} access simulation...`);
      simulateAccess();
    } else {
      log(`Switched to ${accessMode} access mode.`);
    }
  }

  // Initialize
  initSystem();
});
