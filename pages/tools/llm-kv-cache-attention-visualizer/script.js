/* ============================================================
   LLM Multi-Head Attention & KV-Cache Memory Studio JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // DOM ELEMENTS
  const llmPromptInput = document.getElementById('llmPromptInput');
  const btnComputeAttention = document.getElementById('btnComputeAttention');
  const btnGenerateToken = document.getElementById('btnGenerateToken');
  const headSelect = document.getElementById('headSelect');
  const tokensDisplay = document.getElementById('tokensDisplay');
  const heatmapGrid = document.getElementById('heatmapGrid');
  const hoverInfoBox = document.getElementById('hoverInfoBox');
  const tabBtns = document.querySelectorAll('.llm-tab-btn');
  const tabContents = document.querySelectorAll('.llm-tab-content');
  const vramUsageVal = document.getElementById('vramUsageVal');
  const seqLenVal = document.getElementById('seqLenVal');
  const vramSavingsVal = document.getElementById('vramSavingsVal');
  const kvCacheTableBody = document.getElementById('kvCacheTableBody');
  const pagedBlocksGrid = document.getElementById('pagedBlocksGrid');
  const blockTableBody = document.getElementById('blockTableBody');
  const qkvMatricesContainer = document.getElementById('qkvMatricesContainer');
  const llmConsole = document.getElementById('llmConsole');

  // STATE DATA
  let tokens = [];
  let attentionMatrix = [];
  let kvCache = [];
  let generatedCount = 0;
  const d_k = 64; // Head dimension
  const numLayers = 32;
  const numHeads = 32;

  // VOCAB PRESET & TOKENIZER
  const vocabulary = ['The', 'cat', 'sat', 'on', 'the', 'mat', 'and', 'slept', 'peacefully', 'under', 'sunlight'];

  // INITIALIZATION
  function init() {
    setupEventListeners();
    processPrompt();
    log('LLM Multi-Head Attention & KV-Cache Studio initialized.', 'info');
  }

  function setupEventListeners() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    btnComputeAttention.addEventListener('click', processPrompt);

    btnGenerateToken.addEventListener('click', () => {
      generatedCount++;
      const nextWord = vocabulary[(tokens.length) % vocabulary.length] + `_${generatedCount}`;
      tokens.push(nextWord);
      log(`Auto-regressive decoding: Generated token #${tokens.length}: '${nextWord}'`, 'success');
      recalculateAttention();
    });

    headSelect.addEventListener('change', () => {
      log(`Switched to Attention Head #${headSelect.value}`, 'info');
      recalculateAttention();
    });

    document.getElementById('btnClearConsole').addEventListener('click', () => {
      llmConsole.innerHTML = '';
    });
  }

  function processPrompt() {
    const text = llmPromptInput.value.trim();
    if (!text) return;
    tokens = text.split(/\s+/);
    generatedCount = 0;
    log(`Tokenized prompt '${text}' into ${tokens.length} tokens.`, 'info');
    recalculateAttention();
  }

  // ATTENTION & Q/K/V COMPUTATION
  function recalculateAttention() {
    const N = tokens.length;

    // Build KV-Cache entries
    kvCache = tokens.map((tok, i) => ({
      pos: i,
      token: tok,
      keyVec: generateMockVector(i, 'K'),
      valVec: generateMockVector(i, 'V')
    }));

    // Compute Scaled Dot-Product Attention S_ij = (Q_i . K_j) / sqrt(d_k)
    attentionMatrix = [];
    const headMultiplier = headSelect.value === '1' ? 1.0 : 1.4;

    for (let i = 0; i < N; i++) {
      const row = [];
      let rowExpSum = 0;

      for (let j = 0; j < N; j++) {
        if (j > i) { // Causal Masking (auto-regressive decoder)
          row.push(0);
        } else {
          // Similarity score inversely proportional to distance + semantic weight
          const dist = i - j;
          const score = Math.exp(-dist * 0.4 * headMultiplier + (i === j ? 0.8 : 0));
          row.push(score);
          rowExpSum += score;
        }
      }

      // Softmax normalization per row
      const normalizedRow = row.map(val => val > 0 ? (val / rowExpSum) : 0);
      attentionMatrix.push(normalizedRow);
    }

    renderTokensBar();
    renderHeatmap();
    renderKvCacheTable();
    renderPagedAttention();
    renderQkvMatrices();
    updateVramStats();
  }

  // RENDER TOKEN CHIPS
  function renderTokensBar() {
    tokensDisplay.innerHTML = '';
    tokens.forEach((tok, idx) => {
      const chip = document.createElement('div');
      chip.className = 'llm-chip';
      chip.innerHTML = `<span>'${tok}'</span> <span class="llm-chip-id">T<sub>${idx}</sub></span>`;
      tokensDisplay.appendChild(chip);
    });
  }

  // RENDER ATTENTION HEATMAP GRID
  function renderHeatmap() {
    heatmapGrid.innerHTML = '';
    const N = tokens.length;

    const table = document.createElement('table');
    table.className = 'llm-heatmap-table';

    // Header Row (Keys)
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // Top-left blank
    tokens.forEach((tok, j) => {
      const th = document.createElement('th');
      th.className = 'llm-heatmap-header';
      th.textContent = `K:${tok}`;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Matrix Rows (Queries)
    for (let i = 0; i < N; i++) {
      const tr = document.createElement('tr');

      // Query Label
      const th = document.createElement('th');
      th.className = 'llm-heatmap-header';
      th.textContent = `Q:${tokens[i]}`;
      tr.appendChild(th);

      for (let j = 0; j < N; j++) {
        const weight = attentionMatrix[i][j];
        const td = document.createElement('td');
        const cell = document.createElement('div');
        cell.className = 'llm-heatmap-cell';

        if (j > i) {
          cell.style.background = 'rgba(255, 255, 255, 0.03)';
          cell.textContent = 'MASK';
          cell.style.color = 'var(--llm-text-muted-dark)';
        } else {
          // Color opacity scale based on attention weight
          cell.style.background = `rgba(139, 92, 246, ${Math.max(0.15, weight)})`;
          cell.textContent = weight.toFixed(2);
        }

        // Cell Hover Info
        cell.addEventListener('mouseenter', () => {
          if (j <= i) {
            hoverInfoBox.innerHTML = `
              <i class="fas fa-crosshairs"></i> <strong>Query Token Q<sub>${i}</sub> ('${tokens[i]}')</strong> → <strong>Key Token K<sub>${j}</sub> ('${tokens[j]}')</strong> | Attention Weight: <strong class="llm-green">${(weight * 100).toFixed(1)}%</strong>
            `;
          } else {
            hoverInfoBox.innerHTML = `<i class="fas fa-eye-slash"></i> <strong>Causal Masked Token Pair:</strong> Token T<sub>${i}</sub> cannot attend to future token T<sub>${j}</sub>.`;
          }
        });

        td.appendChild(cell);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    heatmapGrid.appendChild(table);
  }

  // RENDER KV-CACHE TABLE & STATS
  function renderKvCacheTable() {
    kvCacheTableBody.innerHTML = '';
    kvCache.forEach(entry => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Pos <code>#${entry.pos}</code></td>
        <td><strong>'${entry.token}'</strong></td>
        <td><code>[${entry.keyVec.slice(0, 3).join(', ')}...]</code></td>
        <td><code>[${entry.valVec.slice(0, 3).join(', ')}...]</code></td>
      `;
      kvCacheTableBody.appendChild(tr);
    });
  }

  function updateVramStats() {
    const N = tokens.length;
    seqLenVal.textContent = `${N} Tokens`;

    // Formula: 2 * numLayers * numHeads * d_k * seqLen * 2_bytes (fp16)
    const bytes = 2 * numLayers * numHeads * d_k * N * 2;
    const mb = (bytes / (1024 * 1024)).toFixed(3);
    vramUsageVal.textContent = `${mb} MB`;

    // Naive recalculation recomputes N*(N+1)/2 vs KV-cache N
    const naiveFlops = (N * (N + 1)) / 2;
    const cacheFlops = N;
    const savings = (((naiveFlops - cacheFlops) / naiveFlops) * 100).toFixed(0);
    vramSavingsVal.textContent = `${savings}% FLOPs`;
  }

  // RENDER PAGED ATTENTION (vLLM BLOCK ALLOCATION)
  function renderPagedAttention() {
    pagedBlocksGrid.innerHTML = '';
    blockTableBody.innerHTML = '';

    const blockSize = 2;
    const numBlocks = Math.ceil(tokens.length / blockSize);

    for (let b = 0; b < numBlocks; b++) {
      const blockTokens = tokens.slice(b * blockSize, (b + 1) * blockSize);
      
      // Block Card
      const card = document.createElement('div');
      card.className = 'llm-block-card';
      card.innerHTML = `
        <div>Block <code>#${b}</code></div>
        <div>[${blockTokens.map(t => `'${t}'`).join(', ')}]</div>
      `;
      pagedBlocksGrid.appendChild(card);

      // Block Table Row
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Logical Block <code>#${b}</code></td>
        <td>${blockTokens.join(', ')}</td>
        <td>Physical GPU Page <code>Frame-${(b * 3 + 1) % 16}</code></td>
        <td><span class="llm-chip-id" style="color:var(--llm-success)">ALLOCATED</span></td>
      `;
      blockTableBody.appendChild(tr);
    }
  }

  // RENDER Q/K/V PROJECTIONS
  function renderQkvMatrices() {
    qkvMatricesContainer.innerHTML = '';

    const html = `
      <div class="llm-callout llm-callout-success">
        <h4>Query, Key, and Value Tensor Dimensions</h4>
        <p>Input Embedding Matrix X ∈ ℝ<sup>N × ${d_k}</sup> multiplied by Weights W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub> ∈ ℝ<sup>${d_k} × ${d_k}</sup>.</p>
        <ul>
          <li><strong>Query Tensor Q:</strong> [${tokens.length} × ${d_k}]</li>
          <li><strong>Key Tensor K:</strong> [${tokens.length} × ${d_k}]</li>
          <li><strong>Value Tensor V:</strong> [${tokens.length} × ${d_k}]</li>
        </ul>
      </div>
    `;
    qkvMatricesContainer.innerHTML = html;
  }

  // UTILS
  function generateMockVector(seed, prefix) {
    const vec = [];
    for (let k = 0; k < 4; k++) {
      const val = (Math.sin(seed + k * 1.5) * 0.9).toFixed(2);
      vec.push(`${prefix}:${val}`);
    }
    return vec;
  }

  function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `llm-log-entry ${type}`;
    div.textContent = `[${time}] ${msg}`;
    llmConsole.appendChild(div);
    llmConsole.scrollTop = llmConsole.scrollHeight;
  }

  init();
});
