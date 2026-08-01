/**
 * Generational GC Profiler Visualizer
 * Simulates CMS vs G1 Garbage Collection and plots STW pause times.
 */

document.addEventListener('DOMContentLoaded', () => {
  const algoSelect = document.getElementById('algoSelect');
  const allocRateSlider = document.getElementById('allocRate');
  const btnToggleSim = document.getElementById('btnToggleSim');
  const btnReset = document.getElementById('btnReset');
  const gcStatusDisplay = document.getElementById('gcStatusDisplay');
  const algoDescription = document.getElementById('algoDescription');

  const cmsLayout = document.getElementById('cmsLayout');
  const g1Layout = document.getElementById('g1Layout');
  const g1Grid = document.getElementById('g1Grid');

  const profilerContainer = document.getElementById('profilerContainer');
  const avgPauseEl = document.getElementById('avgPause');
  const maxPauseEl = document.getElementById('maxPause');

  let isRunning = false;
  let simInterval = null;
  let pauseList = []; // list of pause times in ms

  // CMS State
  let cmsState = {
    eden: 0,
    survivor: 0,
    tenured: 0,
  };

  // G1 State
  const TOTAL_REGIONS = 64;
  let g1Regions = Array(TOTAL_REGIONS).fill('free');
  // Initialize grid UI
  for (let i = 0; i < TOTAL_REGIONS; i++) {
    const r = document.createElement('div');
    r.className = 'g1-region free';
    g1Grid.appendChild(r);
  }

  // --- UI Updates ---
  function updateLayoutVisibility() {
    if (algoSelect.value === 'cms') {
      cmsLayout.style.display = 'flex';
      g1Layout.style.display = 'none';
      algoDescription.innerHTML =
        '<strong>CMS (Concurrent Mark-Sweep):</strong> Uses continuous memory spaces for generations. Old generation collection can cause significant Stop-The-World (STW) pauses when memory gets fragmented or full.';
    } else {
      cmsLayout.style.display = 'none';
      g1Layout.style.display = 'flex';
      algoDescription.innerHTML =
        '<strong>G1 (Garbage First):</strong> Divides heap into equal-sized regions. Predictable pause times by collecting only a subset of regions with the most garbage.';
    }
  }

  function updateCMSView() {
    document.querySelector('#cmsEden .fill').style.width = `${cmsState.eden}%`;
    document.querySelector('#cmsSurvivor .fill').style.width = `${cmsState.survivor}%`;
    document.querySelector('#cmsTenured .fill').style.width = `${cmsState.tenured}%`;
  }

  function updateG1View() {
    const regionEls = g1Grid.querySelectorAll('.g1-region');
    for (let i = 0; i < TOTAL_REGIONS; i++) {
      regionEls[i].className = `g1-region ${g1Regions[i]}`;
      // Add a small initial to make it clearer
      if (g1Regions[i] === 'eden') regionEls[i].innerText = 'E';
      else if (g1Regions[i] === 'survivor') regionEls[i].innerText = 'S';
      else if (g1Regions[i] === 'tenured') regionEls[i].innerText = 'T';
      else regionEls[i].innerText = '';
    }
  }

  function addPauseBar(type, duration) {
    pauseList.push(duration);

    // Update stats
    const max = Math.max(...pauseList);
    const avg = Math.round(pauseList.reduce((a, b) => a + b, 0) / pauseList.length);
    maxPauseEl.innerText = max;
    avgPauseEl.innerText = avg;

    const wrapper = document.createElement('div');
    wrapper.className = 'pause-bar-wrapper';

    const lbl = document.createElement('div');
    lbl.className = 'pause-bar-label';
    lbl.innerText = type;

    const track = document.createElement('div');
    track.className = 'pause-bar-track';

    const fill = document.createElement('div');
    fill.className = 'pause-bar-fill';
    // Let's cap max visual width at 300ms
    const widthPct = Math.min((duration / 300) * 100, 100);
    fill.style.width = `${widthPct}%`;
    if (duration > 150) {
      fill.style.backgroundColor = 'var(--accent-red)';
    } else if (duration > 50) {
      fill.style.backgroundColor = 'var(--accent-yellow)';
    } else {
      fill.style.backgroundColor = 'var(--accent-green)';
    }

    const val = document.createElement('div');
    val.className = 'pause-bar-value';
    val.innerText = `${duration}ms`;

    track.appendChild(fill);
    wrapper.appendChild(lbl);
    wrapper.appendChild(track);
    wrapper.appendChild(val);

    profilerContainer.appendChild(wrapper);
    profilerContainer.scrollTop = profilerContainer.scrollHeight;

    // keep only last 20
    if (profilerContainer.children.length > 20) {
      profilerContainer.removeChild(profilerContainer.firstChild);
    }
  }

  function setStatus(text, stw = false) {
    gcStatusDisplay.innerText = `Status: ${text}`;
    if (stw) {
      gcStatusDisplay.classList.add('paused');
    } else {
      gcStatusDisplay.classList.remove('paused');
    }
  }

  // --- Simulation Logic ---

  function triggerCMSGC(allocRate) {
    // Check if Minor GC needed
    if (cmsState.eden >= 100) {
      // STW Pause
      let pauseTime = 20 + Math.floor(Math.random() * 10);

      cmsState.eden = 0;
      cmsState.survivor += 30; // some survive

      if (cmsState.survivor >= 100) {
        cmsState.survivor = 0;
        cmsState.tenured += 40;
      }

      if (cmsState.tenured >= 100) {
        // Major GC (Full STW)
        // CMS gets fragmented, if tenured is full, fallback to Full GC
        cmsState.tenured = 10; // clears most
        pauseTime = 180 + Math.floor(Math.random() * 50) + allocRate * 5; // Huge pause
        addPauseBar('Full', pauseTime);
        setStatus('Full GC (STW)', true);
      } else {
        addPauseBar('Minor', pauseTime);
        setStatus('Minor GC (STW)', true);
      }

      updateCMSView();
      return true; // We paused
    }
    return false; // No pause
  }

  function triggerG1GC() {
    const edenCount = g1Regions.filter((r) => r === 'eden').length;
    const usedCount = g1Regions.filter((r) => r !== 'free').length;

    // Target threshold for GC
    if (edenCount >= 10 || usedCount > 50) {
      // G1 Pause: bounded by targeting specific regions
      // Predictable, ~30-50ms
      let pauseTime = 30 + Math.floor(Math.random() * 20);

      // Collect Eden
      for (let i = 0; i < TOTAL_REGIONS; i++) {
        if (g1Regions[i] === 'eden') {
          // 30% chance to survive
          g1Regions[i] = Math.random() < 0.3 ? 'survivor' : 'free';
        }
      }

      // Promote Survivor to Tenured
      for (let i = 0; i < TOTAL_REGIONS; i++) {
        if (g1Regions[i] === 'survivor' && Math.random() < 0.5) {
          g1Regions[i] = 'tenured';
        }
      }

      // If heap is getting full, do Mixed GC (Collect Eden + some Tenured)
      if (usedCount > 40) {
        // Collect only a bounded number of tenured regions to meet pause time goal!
        let collected = 0;
        for (let i = 0; i < TOTAL_REGIONS; i++) {
          if (g1Regions[i] === 'tenured' && collected < 5) {
            g1Regions[i] = 'free';
            collected++;
          }
        }
        pauseTime += 10; // slight overhead for mixed
        addPauseBar('Mixed', pauseTime);
        setStatus('Mixed GC (STW)', true);
      } else {
        addPauseBar('Minor', pauseTime);
        setStatus('Minor GC (STW)', true);
      }

      updateG1View();
      return true; // We paused
    }
    return false;
  }

  function stepSimulation() {
    const algo = algoSelect.value;
    const rate = parseInt(allocRateSlider.value, 10);
    let stwOccurred = false;

    if (algo === 'cms') {
      cmsState.eden += rate * 2;
      stwOccurred = triggerCMSGC(rate);
      updateCMSView();
    } else {
      // Allocate to free regions
      let allocated = 0;
      let toAllocate = Math.ceil(rate / 3);
      for (let i = 0; i < TOTAL_REGIONS && allocated < toAllocate; i++) {
        if (g1Regions[i] === 'free') {
          g1Regions[i] = 'eden';
          allocated++;
        }
      }
      stwOccurred = triggerG1GC();
      updateG1View();
    }

    if (!stwOccurred) {
      setStatus('Running App (Mutator)', false);
    }
  }

  // --- Events ---
  algoSelect.addEventListener('change', () => {
    resetSimulation();
    updateLayoutVisibility();
  });

  btnToggleSim.addEventListener('click', () => {
    isRunning = !isRunning;
    if (isRunning) {
      btnToggleSim.innerHTML = '<i class="fas fa-pause"></i> Pause Simulation';
      btnToggleSim.classList.remove('btn-primary');
      btnToggleSim.classList.add('btn-warning');
      simInterval = setInterval(stepSimulation, 200); // 5 ticks a second
    } else {
      btnToggleSim.innerHTML = '<i class="fas fa-play"></i> Start Simulation';
      btnToggleSim.classList.remove('btn-warning');
      btnToggleSim.classList.add('btn-primary');
      clearInterval(simInterval);
      setStatus('IDLE');
    }
  });

  function resetSimulation() {
    if (isRunning) {
      btnToggleSim.click(); // will pause it
    }
    cmsState = { eden: 0, survivor: 0, tenured: 0 };
    g1Regions.fill('free');
    pauseList = [];
    profilerContainer.innerHTML = '';
    avgPauseEl.innerText = '0';
    maxPauseEl.innerText = '0';
    updateCMSView();
    updateG1View();
    setStatus('IDLE');
  }

  btnReset.addEventListener('click', resetSimulation);

  // Init
  updateLayoutVisibility();
  updateCMSView();
  updateG1View();
});
