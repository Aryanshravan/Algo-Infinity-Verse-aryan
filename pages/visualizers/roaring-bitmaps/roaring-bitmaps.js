/**
 * roaring-bitmaps.js
 * Visualizes the inner workings of a Roaring Bitmap (Array, Bitmap, and Run containers).
 */

document.addEventListener('DOMContentLoaded', () => {
  initRoaring();
});

const els = {
  numInput: document.getElementById('numInput'),
  btnInsert: document.getElementById('btnInsert'),
  btnInsertRandom: document.getElementById('btnInsertRandom'),
  btnInsertRun: document.getElementById('btnInsertRun'),
  btnReset: document.getElementById('btnReset'),
  containersGrid: document.getElementById('containersGrid'),
  emptyState: document.getElementById('emptyState'),
  arrayMem: document.getElementById('arrayMem'),
  roaringMem: document.getElementById('roaringMem'),
  compressionRatio: document.getElementById('compressionRatio'),
};

// State
let bitset = new Set();
let containers = {}; // key (top 16 bits) -> sorted array of 16-bit integers

function initRoaring() {
  els.btnInsert.addEventListener('click', () => {
    const val = parseInt(els.numInput.value);
    if (!isNaN(val) && val >= 0) insertValue(val);
    els.numInput.value = '';
  });

  els.btnInsertRandom.addEventListener('click', () => {
    const base = Math.floor(Math.random() * 60000); // clump them together
    for (let i = 0; i < 100; i++) {
      insertValue(base + Math.floor(Math.random() * 5000));
    }
  });

  els.btnInsertRun.addEventListener('click', () => {
    const base = Math.floor(Math.random() * 60000);
    for (let i = 0; i < 5000; i++) {
      insertValue(base + i);
    }
  });

  els.btnReset.addEventListener('click', () => {
    bitset.clear();
    containers = {};
    updateVisuals();
  });
}

function insertValue(val) {
  if (bitset.has(val)) return;
  bitset.add(val);

  const key = val >>> 16;
  const lower = val & 0xffff;

  if (!containers[key]) {
    containers[key] = [];
  }

  // Insert sorted
  const arr = containers[key];
  let i = 0;
  while (i < arr.length && arr[i] < lower) i++;
  arr.splice(i, 0, lower);

  // Throttle rendering for bulk inserts
  if (!window.renderTimeout) {
    window.renderTimeout = setTimeout(() => {
      updateVisuals();
      window.renderTimeout = null;
    }, 50);
  }
}

function updateVisuals() {
  if (bitset.size === 0) {
    els.containersGrid.innerHTML =
      '<div class="empty-state" id="emptyState">No integers inserted yet.</div>';
    updateStats();
    return;
  }

  els.containersGrid.innerHTML = '';

  const keys = Object.keys(containers)
    .map(Number)
    .sort((a, b) => a - b);
  let totalRoaringBytes = 0;

  for (let key of keys) {
    const arr = containers[key];

    // Determine container type
    const runCount = countRuns(arr);
    const arrayBytes = arr.length * 2;
    const bitmapBytes = 8192; // 2^16 bits = 8KB
    const runBytes = runCount * 4; // 2 bytes start, 2 bytes length per run

    let type = 'array';
    let bytes = arrayBytes;

    if (runBytes < arrayBytes && runBytes < bitmapBytes) {
      type = 'run';
      bytes = runBytes;
    } else if (bitmapBytes < arrayBytes) {
      type = 'bitmap';
      bytes = bitmapBytes;
    }

    totalRoaringBytes += bytes;

    renderContainer(key, arr, type, bytes, runCount);
  }

  updateStats(totalRoaringBytes);
}

function countRuns(arr) {
  if (arr.length === 0) return 0;
  let runs = 1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1] + 1) runs++;
  }
  return runs;
}

function renderContainer(key, arr, type, bytes, runs) {
  const el = document.createElement('div');
  el.className = 'r-container';

  const header = document.createElement('div');
  header.className = 'r-header';
  header.innerHTML = `
        <span class="r-key">Key: ${key}</span>
        <span class="badge badge-${type}">${type}</span>
    `;

  const visual = document.createElement('div');
  visual.className = 'r-visual';

  if (type === 'array') {
    const vArr = document.createElement('div');
    vArr.className = 'visual-array';
    // show up to 10 items
    for (let i = 0; i < Math.min(arr.length, 12); i++) {
      const span = document.createElement('span');
      span.className = 'val-box';
      span.textContent = arr[i];
      vArr.appendChild(span);
    }
    if (arr.length > 12) {
      const span = document.createElement('span');
      span.className = 'val-box';
      span.textContent = '...';
      vArr.appendChild(span);
    }
    visual.appendChild(vArr);
  } else if (type === 'bitmap') {
    const vBit = document.createElement('div');
    vBit.className = 'visual-bitmap';
    visual.appendChild(vBit);
  } else {
    const vRun = document.createElement('div');
    vRun.className = 'visual-run';
    // show up to 5 runs as blocks
    for (let i = 0; i < Math.min(runs, 5); i++) {
      const block = document.createElement('div');
      block.className = 'run-block';
      block.style.width = '20px';
      vRun.appendChild(block);
    }
    visual.appendChild(vRun);
  }

  const stats = document.createElement('div');
  stats.className = 'r-stats';
  stats.innerHTML = `
        <span>Items: ${arr.length}</span>
        <span>Size: ${formatBytes(bytes)}</span>
    `;

  el.appendChild(header);
  el.appendChild(visual);
  el.appendChild(stats);

  els.containersGrid.appendChild(el);
}

function updateStats(roaringBytes = 0) {
  const arrayBytes = bitset.size * 4; // 32-bit ints
  const _naiveBitsetBytes = 536870912; // 2^32 bits = 512MB

  els.arrayMem.textContent = formatBytes(arrayBytes);
  els.roaringMem.textContent = formatBytes(roaringBytes);

  if (arrayBytes > 0) {
    const ratio = ((1 - roaringBytes / arrayBytes) * 100).toFixed(1);
    els.compressionRatio.textContent = `Compression vs Array: ${ratio > 0 ? ratio : 0}%`;
  } else {
    els.compressionRatio.textContent = `Compression: 0%`;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
