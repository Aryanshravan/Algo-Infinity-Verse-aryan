document.addEventListener('DOMContentLoaded', () => {
  initLSM();
});

// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
const MEM_CAPACITY = 5;
const L0_CAPACITY = 4; // SSTables in L0 before compaction
const BLOOM_SIZE = 8;
const HASH_FNS = 2;

let state = {
  wal: [], // [{op: 'PUT'|'DEL', k, v}]
  memtable: new Map(), // sorted visually
  levels: {
    0: [], // Array of SSTable objects { id, bloom:[], data: [{k, v, tomb}] }
    1: [],
    2: [],
  },
};

let sstCounter = 0;
let isCompacting = false;
let isReading = false;

// DOM Elements
const els = {
  k: document.getElementById('inputKey'),
  v: document.getElementById('inputValue'),
  btnPut: document.getElementById('btnPut'),
  btnDel: document.getElementById('btnDelete'),
  btnBulk: document.getElementById('btnBulkLoad'),
  btnCrash: document.getElementById('btnCrash'),

  rKey: document.getElementById('readKey'),
  btnGet: document.getElementById('btnGet'),
  readLog: document.getElementById('readPathLog'),

  memList: document.getElementById('memTableList'),
  memCap: document.getElementById('memCapacity'),
  walTrack: document.getElementById('walTrack'),
  status: document.getElementById('statusBoard'),

  tracks: {
    0: document.getElementById('track-L0'),
    1: document.getElementById('track-L1'),
    2: document.getElementById('track-L2'),
  },

  bloom: {
    overlay: document.getElementById('bloomOverlay'),
    targetKey: document.getElementById('bloomTargetKey'),
    targetSST: document.getElementById('bloomTargetSST'),
    bits: document.getElementById('bloomBitArray'),
    result: document.getElementById('bloomResult'),
  },
};

// ==========================================
// 2. CORE LOGIC (WRITE PATH)
// ==========================================

function initLSM() {
  els.btnPut.addEventListener('click', () => handleWrite('PUT'));
  els.btnDel.addEventListener('click', () => handleWrite('DEL'));
  els.btnBulk.addEventListener('click', bulkLoad);
  els.btnCrash.addEventListener('click', simulateCrash);
  els.btnGet.addEventListener('click', handleRead);

  renderMemTable();
  renderLevels();
}

function updateStatus(msg, isWarn = false) {
  els.status.textContent = msg;
  if (isWarn) {
    els.status.classList.add('status-compaction');
  } else {
    els.status.classList.remove('status-compaction');
  }
}

async function handleWrite(op) {
  if (isCompacting) return;

  let key = els.k.value.trim();
  let val = els.v.value.trim();
  if (!key) return;
  if (op === 'DEL') val = 'TOMBSTONE';

  // 1. Write to WAL
  state.wal.push({ op, k: key, v: val });
  renderWAL();

  // 2. Write to MemTable
  state.memtable.set(key, { v: val, tomb: op === 'DEL' });
  renderMemTable();

  els.k.value = '';
  els.v.value = '';

  // 3. Check Capacity
  if (state.memtable.size >= MEM_CAPACITY) {
    await flushMemTable();
  }
}

async function bulkLoad() {
  if (isCompacting) return;
  const items = 10;
  for (let i = 0; i < items; i++) {
    els.k.value = `key${Math.floor(Math.random() * 100)}`;
    els.v.value = `val${Math.floor(Math.random() * 1000)}`;
    await handleWrite('PUT');
    // small delay for visual if needed, but synchronous flush will block
  }
}

async function simulateCrash() {
  if (isCompacting) return;

  // Wipe RAM
  state.memtable.clear();
  renderMemTable();

  updateStatus('POWER OUTAGE! Wiping RAM...', true);
  await sleep(1000);

  updateStatus('Rebuilding from WAL...', true);

  // Replay WAL
  for (let entry of state.wal) {
    state.memtable.set(entry.k, { v: entry.v, tomb: entry.op === 'DEL' });
    renderMemTable();
    await sleep(200);
  }

  updateStatus('System Recovered.');

  if (state.memtable.size >= MEM_CAPACITY) {
    await flushMemTable();
  }
}

async function flushMemTable() {
  isCompacting = true;
  updateStatus('Flushing MemTable to L0...', true);
  await sleep(800);

  // Sort memtable
  const sortedData = Array.from(state.memtable.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, meta]) => ({ k, v: meta.v, tomb: meta.tomb }));

  // Build SSTable
  const id = `SST-${++sstCounter}`;
  const bloom = buildBloomFilter(sortedData);

  const sst = { id, bloom, data: sortedData };

  // Clear RAM
  state.memtable.clear();
  state.wal = [];
  renderMemTable();
  renderWAL();

  // Add to L0
  state.levels[0].unshift(sst); // newest first (L0 reads reverse chrono)
  renderLevels();

  await sleep(500);
  updateStatus('System Idle...');
  isCompacting = false;

  // Trigger compaction if L0 full
  if (state.levels[0].length >= L0_CAPACITY) {
    await triggerCompaction(0);
  }
}

// ==========================================
// 3. COMPACTION ENGINE
// ==========================================

async function triggerCompaction(level) {
  if (level > 1) return; // L2 is our max for visualization
  isCompacting = true;
  updateStatus(`Compacting L${level} -> L${level + 1}...`, true);

  // Highlight SSTables participating
  const tracksEl = els.tracks[level];
  Array.from(tracksEl.children).forEach((c) => c.classList.add('compacting'));
  if (els.tracks[level + 1]) {
    Array.from(els.tracks[level + 1].children).forEach((c) => c.classList.add('compacting'));
  }

  await sleep(1000);

  // In a real system, we select overlapping SSTs. Here we just merge all L_n + L_{n+1}
  const allSsts = [...state.levels[level], ...state.levels[level + 1]];

  // Merge all data, resolving versions (newer wins)
  // To resolve, we must process from newest to oldest.
  // Since L0 is [newest, oldest] and L1 is older, we reverse to process oldest to newest so newest overwrites.
  allSsts.reverse();

  const mergedMap = new Map();
  allSsts.forEach((sst) => {
    sst.data.forEach((item) => {
      mergedMap.set(item.k, item); // latest overrides
    });
  });

  // Sort
  let mergedArray = Array.from(mergedMap.values()).sort((a, b) => a.k.localeCompare(b.k));

  // If compacting into deep level (L2), physically purge Tombstones!
  if (level + 1 === 2) {
    mergedArray = mergedArray.filter((i) => !i.tomb);
  }

  // Chunk into new SSTables (Max 5 keys per SST for visual)
  const newSSTs = [];
  for (let i = 0; i < mergedArray.length; i += 5) {
    const chunk = mergedArray.slice(i, i + 5);
    newSSTs.push({
      id: `SST-${++sstCounter}`,
      bloom: buildBloomFilter(chunk),
      data: chunk,
    });
  }

  // Update levels
  state.levels[level] = [];
  state.levels[level + 1] = newSSTs;

  renderLevels();
  updateStatus('System Idle...');
  isCompacting = false;

  // Cascade if needed (Visual limits)
  if (level + 1 === 1 && state.levels[1].length > 4) {
    await triggerCompaction(1);
  }
}

// ==========================================
// 4. READ PATH & BLOOM FILTERS
// ==========================================

// Simple pseudo-hash
function hashKey(key, seed) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i) + seed;
    hash = hash & hash; // Convert to 32bit int
  }
  return Math.abs(hash) % BLOOM_SIZE;
}

function buildBloomFilter(data) {
  const bits = new Array(BLOOM_SIZE).fill(0);
  data.forEach((item) => {
    if (!item.tomb) {
      for (let i = 1; i <= HASH_FNS; i++) {
        bits[hashKey(item.k, i)] = 1;
      }
    }
  });
  return bits;
}

function checkBloomFilter(key, bloomArray) {
  const checks = [];
  let maybe = true;
  for (let i = 1; i <= HASH_FNS; i++) {
    const idx = hashKey(key, i);
    checks.push(idx);
    if (bloomArray[idx] === 0) maybe = false;
  }
  return { maybe, checks };
}

function logRead(msg, type = 'info') {
  const div = document.createElement('div');
  div.className = `log-step`;
  if (type === 'hit') div.classList.add('log-hit');
  if (type === 'miss') div.classList.add('log-miss');
  if (type === 'bloom') div.classList.add('log-bloom');
  div.textContent = msg;
  els.readLog.appendChild(div);
  els.readLog.scrollTop = els.readLog.scrollHeight;
}

async function handleRead() {
  if (isCompacting || isReading) return;
  const key = els.rKey.value.trim();
  if (!key) return;

  isReading = true;
  els.readLog.innerHTML = ''; // clear
  logRead(`GET: Searching for '${key}'`);

  // 1. Check MemTable
  logRead(`Checking MemTable (RAM)...`);
  await sleep(400);
  if (state.memtable.has(key)) {
    const item = state.memtable.get(key);
    if (item.tomb) {
      logRead(`HIT (Tombstone): '${key}' was explicitly deleted.`, 'hit');
    } else {
      logRead(`HIT: Found in MemTable! Value: ${item.v}`, 'hit');
    }
    isReading = false;
    return;
  }

  logRead(`MISS: Not in MemTable. Falling back to Disk.`, 'miss');

  // 2. Check Disk Levels (L0, then L1, then L2)
  for (let L = 0; L <= 2; L++) {
    const ssts = state.levels[L];
    if (ssts.length === 0) continue;

    logRead(`Scanning Level ${L}...`);

    for (let sst of ssts) {
      // Highlight SST
      const blockId = `ui-${sst.id}`;
      const blockEl = document.getElementById(blockId);
      if (blockEl) blockEl.classList.add('reading');

      // Bloom Check
      logRead(`Checking Bloom Filter for ${sst.id}...`, 'bloom');
      const { maybe, checks } = checkBloomFilter(key, sst.bloom);
      await animateBloomModal(key, sst.id, sst.bloom, checks, maybe);

      if (!maybe) {
        logRead(`Bloom Result: Definitive NOT PRESENT. Skipped Disk Read!`, 'bloom');
        if (blockEl) blockEl.classList.remove('reading');
        continue; // Skip disk read
      }

      logRead(`Bloom Result: MAYBE. Performing expensive Disk Binary Search...`, 'miss');
      await sleep(600);

      // Binary search in sorted array
      const found = sst.data.find((i) => i.k === key);

      if (found) {
        // Highlight row
        if (blockEl) {
          const rId = `row-${sst.id}-${key}`;
          const rEl = document.getElementById(rId);
          if (rEl) rEl.classList.add('highlight');
        }

        if (found.tomb) {
          logRead(`HIT (Tombstone): '${key}' was deleted.`, 'hit');
        } else {
          logRead(`HIT: Found on Disk! Value: ${found.v}`, 'hit');
        }
        setTimeout(() => {
          if (blockEl) blockEl.classList.remove('reading');
        }, 1000);
        isReading = false;
        return;
      } else {
        logRead(`FALSE POSITIVE! Wasted disk read. Key not found.`, 'miss');
      }
      if (blockEl) blockEl.classList.remove('reading');
    }
  }

  logRead(`404 NOT FOUND: Key '${key}' does not exist in DB.`, 'miss');
  isReading = false;
}

async function animateBloomModal(key, sstId, bloomArray, checks, isMaybe) {
  const o = els.bloom.overlay;
  els.bloom.targetKey.textContent = key;
  els.bloom.targetSST.textContent = sstId;

  // Render bits
  els.bloom.bits.innerHTML = '';
  const bitEls = [];
  for (let i = 0; i < BLOOM_SIZE; i++) {
    const b = document.createElement('div');
    b.className = 'b-box';
    b.textContent = bloomArray[i];
    els.bloom.bits.appendChild(b);
    bitEls.push(b);
  }

  els.bloom.result.textContent = 'Hashing...';
  els.bloom.result.className = 'lsm-bloom-result';

  o.classList.add('visible');

  // Animate checks
  for (let i = 0; i < checks.length; i++) {
    await sleep(300);
    const idx = checks[i];
    bitEls[idx].classList.add('hit');
  }

  await sleep(500);
  if (isMaybe) {
    els.bloom.result.textContent = 'Result: MAYBE';
    els.bloom.result.classList.add('res-maybe');
  } else {
    els.bloom.result.textContent = 'Result: ABSOLUTELY NOT';
    els.bloom.result.classList.add('res-miss');
  }

  await sleep(1200);
  o.classList.remove('visible');
}

// ==========================================
// 5. RENDERING ENGINE
// ==========================================

function renderMemTable() {
  els.memList.innerHTML = '';
  const sortedKeys = Array.from(state.memtable.keys()).sort();

  sortedKeys.forEach((k) => {
    const item = state.memtable.get(k);
    const row = document.createElement('div');
    row.className = 'data-row';
    if (item.tomb) row.classList.add('tombstone');

    row.innerHTML = `<span>${k}</span><span>${item.v}</span>`;
    els.memList.appendChild(row);
  });

  els.memCap.textContent = `${state.memtable.size} / ${MEM_CAPACITY}`;
}

function renderWAL() {
  els.walTrack.innerHTML = '';
  // Show last 10 for visual constraints
  const visibleWal = state.wal.slice(-10);
  visibleWal.forEach((e) => {
    const d = document.createElement('div');
    d.className = `wal-entry ${e.op === 'DEL' ? 'tomb' : ''}`;
    d.textContent = e.k;
    els.walTrack.appendChild(d);
  });
  els.walTrack.scrollLeft = els.walTrack.scrollWidth;
}

function renderLevels() {
  for (let L = 0; L <= 2; L++) {
    const track = els.tracks[L];
    track.innerHTML = '';

    state.levels[L].forEach((sst) => {
      const block = document.createElement('div');
      block.className = 'sstable-block';
      block.id = `ui-${sst.id}`;

      // Header
      let html = `<div class="sst-header">${sst.id}</div>`;

      // Bloom
      html += `<div class="sst-bloom">`;
      sst.bloom.forEach((bit) => {
        html += `<div class="bloom-bit ${bit === 1 ? 'on' : ''}"></div>`;
      });
      html += `</div>`;

      // Body
      html += `<div class="sst-body">`;
      sst.data.forEach((d) => {
        html += `<div class="sst-row ${d.tomb ? 'tomb' : ''}" id="row-${sst.id}-${d.k}">
                    <span>${d.k}</span>
                    <span>${d.tomb ? 'DEL' : d.v.substring(0, 4)}</span>
                </div>`;
      });
      html += `</div>`;

      block.innerHTML = html;
      track.appendChild(block);
    });
  }
}

// Utils
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
