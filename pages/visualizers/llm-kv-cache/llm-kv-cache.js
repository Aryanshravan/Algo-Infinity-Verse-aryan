/**
 * llm-kv-cache.js
 * Interactive LLM KV-Cache & vLLM PagedAttention Simulator
 */

document.addEventListener('DOMContentLoaded', () => {
  initKVCacheVisualizer();
});

// Mock Vocabulary for autoregressive generation
const MOCK_WORDS = [
  'is',
  'the',
  'key',
  'to',
  'unlocking',
  'high-performance',
  'serving',
  'in',
  'large',
  'language',
  'models.',
  'This',
  'technique',
  'dynamically',
  'maps',
  'logical',
  'token',
  'blocks',
  'into',
  'non-contiguous',
  'physical',
  'VRAM',
  'pages,',
  'entirely',
  'eliminating',
  'external',
  'fragmentation',
  'and',
  'reducing',
  'internal',
  'fragmentation',
  'to',
  'less',
  'than',
  '4%.',
];

const els = {
  promptInput: document.getElementById('promptInput'),
  allocationMode: document.getElementById('allocationMode'),
  blockSizeSlider: document.getElementById('blockSizeSlider'),
  blockSizeVal: document.getElementById('blockSizeVal'),
  vramLimitSlider: document.getElementById('vramLimitSlider'),
  vramLimitVal: document.getElementById('vramLimitVal'),
  nextBtn: document.getElementById('nextBtn'),
  autoBtn: document.getElementById('autoBtn'),
  resetBtn: document.getElementById('resetBtn'),
  tokensStat: document.getElementById('tokensStat'),
  vramStat: document.getElementById('vramStat'),
  fragStat: document.getElementById('fragStat'),
  blocksStat: document.getElementById('blocksStat'),
  generationContainer: document.getElementById('generationContainer'),
  mappingTable: document.getElementById('mappingTable'),
  vramGrid: document.getElementById('vramGrid'),
};

let promptTokens = [];
let generatedTokens = [];
let physicalBlocks = []; // Array of physical blocks: { id, tokens: [] }
let blockTable = {}; // Logical block index -> Physical block index
let isAutoRunning = false;
let autoInterval = null;

function initKVCacheVisualizer() {
  bindEvents();
  resetSimulator();
}

function bindEvents() {
  els.blockSizeSlider.addEventListener('input', (e) => {
    els.blockSizeVal.textContent = e.target.value;
    resetSimulator();
  });

  els.vramLimitSlider.addEventListener('input', (e) => {
    els.vramLimitVal.textContent = e.target.value;
    resetSimulator();
  });

  els.allocationMode.addEventListener('change', resetSimulator);

  els.nextBtn.addEventListener('click', generateNextToken);
  els.autoBtn.addEventListener('click', toggleAutoRun);
  els.resetBtn.addEventListener('click', resetSimulator);
}

function resetSimulator() {
  if (isAutoRunning) stopAutoRun();

  const text = els.promptInput.value.trim() || 'Deep learning';
  promptTokens = text.split(/\s+/).filter(Boolean);
  generatedTokens = [];

  const maxBlocks = parseInt(els.vramLimitSlider.value);

  // Initialize physical VRAM blocks
  physicalBlocks = [];
  for (let i = 0; i < maxBlocks; i++) {
    physicalBlocks.push({ id: i, tokens: [] });
  }

  // Clear mapping table
  blockTable = {};

  // Pre-allocate prompt tokens into cache
  allocateTokens(promptTokens);

  updateUI();
}

function allocateTokens(tokensList) {
  const blockSize = parseInt(els.blockSizeSlider.value);
  const mode = els.allocationMode.value;

  if (mode === 'paged') {
    // PagedAttention Block Allocation
    for (let i = 0; i < tokensList.length; i++) {
      const token = tokensList[i];
      const totalAllocated = generatedTokens.length + i;
      const logicalBlockIdx = Math.floor(totalAllocated / blockSize);

      // Check if logical block needs a physical page
      if (blockTable[logicalBlockIdx] === undefined) {
        // Find first free physical page
        const freePhysicalIdx = physicalBlocks.findIndex((b) => b.tokens.length === 0);
        if (freePhysicalIdx !== -1) {
          blockTable[logicalBlockIdx] = freePhysicalIdx;
        } else {
          console.warn('GPU Out of Memory (VRAM Exhausted)');
          return false;
        }
      }

      // Append token to physical page
      const physicalIdx = blockTable[logicalBlockIdx];
      physicalBlocks[physicalIdx].tokens.push(token);
    }
  } else {
    // Contiguous Allocation
    const totalTokens = generatedTokens.length + tokensList.length;
    const requiredBlocks = Math.ceil(totalTokens / blockSize);
    const maxBlocks = physicalBlocks.length;

    // Reset current blocks
    physicalBlocks.forEach((b) => {
      b.tokens = [];
    });
    blockTable = {};

    if (requiredBlocks > maxBlocks) {
      console.warn('GPU Out of Memory (Contiguous VRAM Exhausted)');
      return false;
    }

    // Allocate contiguous block space
    let tokenIdx = 0;
    const allTokens = [...generatedTokens, ...tokensList];
    for (let b = 0; b < requiredBlocks; b++) {
      blockTable[b] = b; // Logical index matches physical index directly
      for (let s = 0; s < blockSize; s++) {
        if (tokenIdx < allTokens.length) {
          physicalBlocks[b].tokens.push(allTokens[tokenIdx]);
          tokenIdx++;
        }
      }
    }
  }
  return true;
}

function generateNextToken() {
  if (generatedTokens.length >= 35) {
    if (isAutoRunning) stopAutoRun();
    return;
  }

  const nextWord = MOCK_WORDS[generatedTokens.length % MOCK_WORDS.length];
  const success = allocateTokens([nextWord]);

  if (success) {
    generatedTokens.push(nextWord);
    updateUI();
  } else {
    if (isAutoRunning) stopAutoRun();
  }
}

function toggleAutoRun() {
  if (isAutoRunning) {
    stopAutoRun();
  } else {
    isAutoRunning = true;
    els.autoBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    els.autoBtn.classList.remove('btn-secondary');
    els.autoBtn.classList.add('btn-outline');
    autoInterval = setInterval(generateNextToken, 800);
  }
}

function stopAutoRun() {
  isAutoRunning = false;
  clearInterval(autoInterval);
  els.autoBtn.innerHTML = '<i class="fas fa-play"></i> Auto Run';
  els.autoBtn.classList.remove('btn-outline');
  els.autoBtn.classList.add('btn-secondary');
}

function updateUI() {
  const blockSize = parseInt(els.blockSizeSlider.value);
  const maxBlocks = physicalBlocks.length;

  // 1. Update stats
  const totalTokens = promptTokens.length + generatedTokens.length;
  els.tokensStat.textContent = totalTokens;

  // VRAM Utilized
  const allocatedBlocks = physicalBlocks.filter((b) => b.tokens.length > 0).length;
  const utilPercent = Math.round((allocatedBlocks / maxBlocks) * 100);
  els.vramStat.textContent = `${utilPercent}%`;
  els.blocksStat.textContent = `${allocatedBlocks} / ${maxBlocks}`;

  // Internal Fragmentation
  // (wasted slots in active blocks)
  let activeSlots = 0;
  let filledSlots = 0;
  physicalBlocks.forEach((b) => {
    if (b.tokens.length > 0) {
      activeSlots += blockSize;
      filledSlots += b.tokens.length;
    }
  });
  const fragPercent =
    activeSlots > 0 ? Math.round(((activeSlots - filledSlots) / activeSlots) * 100) : 0;
  els.fragStat.textContent = `${fragPercent}%`;

  // 2. Render Text Trace
  let traceHTML = `<span class="prompt-text" style="color: #64748b;">`;
  promptTokens.forEach((t) => {
    traceHTML += t + ' ';
  });
  traceHTML += `</span>`;

  generatedTokens.forEach((t) => {
    traceHTML += `<span class="token-highlight">${t}</span> `;
  });
  els.generationContainer.innerHTML = traceHTML;

  // 3. Render Logical mapping
  let mappingHTML = ``;
  const logicalCount = Math.ceil(totalTokens / blockSize);
  for (let i = 0; i < logicalCount; i++) {
    const physIdx = blockTable[i];
    mappingHTML += `
      <div class="mapping-row">
        <span>Logical Block #${i}</span>
        <span style="color: #10b981;"><i class="fas fa-arrow-right"></i> Physical Page #${physIdx !== undefined ? physIdx : '?'}</span>
      </div>
    `;
  }
  els.mappingTable.innerHTML = mappingHTML;

  // 4. Render Physical Grid
  let gridHTML = ``;
  const mode = els.allocationMode.value;

  physicalBlocks.forEach((b) => {
    let blockClass = 'vram-block';
    if (b.tokens.length > 0) {
      blockClass += mode === 'paged' ? ' allocated' : ' contiguous-allocated';
    }

    gridHTML += `
      <div class="${blockClass}">
        <div class="vram-block-header">
          <span>Page #${b.id}</span>
          <span>${b.tokens.length}/${blockSize}</span>
        </div>
        <div class="vram-block-body">
    `;

    for (let s = 0; s < blockSize; s++) {
      const token = b.tokens[s];
      if (token) {
        gridHTML += `<div class="vram-slot filled" title="${token}">${token[0]}</div>`;
      } else {
        gridHTML += `<div class="vram-slot"></div>`;
      }
    }

    gridHTML += `
        </div>
      </div>
    `;
  });
  els.vramGrid.innerHTML = gridHTML;
}
