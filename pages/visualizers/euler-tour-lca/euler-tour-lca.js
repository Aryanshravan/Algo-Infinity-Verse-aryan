// ============================================
// EULER TOUR + SPARSE TABLE LCA VISUALIZER
// ============================================

let tree = [];
let nodesCount = 0;
let tour = [];
let depthArr = [];
let firstOccurrence = [];
let sparseTable = [];
let logTable = [];
let treeLayout = [];

let abortController = null;

// Tree layout settings
let canvas, ctx;
const nodeRadius = 18;

// Colors matching the theme
const COLOR_DEF = 'rgba(255, 255, 255, 0.4)';
const COLOR_ACTIVE = '#a855f7'; // Purple
const COLOR_HIGHLIGHT = '#f59e0b'; // Amber
const COLOR_LCA = '#22c55e'; // Green

// Node states for canvas drawing
let nodeStates = []; 
let edgeStates = []; 

function initCanvas() {
    canvas = document.getElementById('treeCanvas');
    ctx = canvas.getContext('2d');
    
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    
    window.addEventListener('resize', () => {
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
        if(nodesCount > 0) {
            calculateTreeLayout();
            updateCanvasStatesPositions();
        }
    });

    renderLoop();
}

const heroCanvas = document.getElementById('elcaHeroCanvas');
const hctx = heroCanvas.getContext('2d');
let particles = [];
function initHeroCanvas() {
    const resizeHero = () => {
        heroCanvas.width = heroCanvas.clientWidth;
        heroCanvas.height = heroCanvas.clientHeight;
    };
    window.addEventListener('resize', resizeHero);
    resizeHero();
    
    for(let i=0; i<40; i++) {
        particles.push({
            x: Math.random() * heroCanvas.width,
            y: Math.random() * heroCanvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1
        });
    }
    
    function animateHero() {
        hctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
        hctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if(p.x < 0) p.x = heroCanvas.width;
            if(p.x > heroCanvas.width) p.x = 0;
            if(p.y < 0) p.y = heroCanvas.height;
            if(p.y > heroCanvas.height) p.y = 0;
            hctx.beginPath();
            hctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            hctx.fill();
        });
        requestAnimationFrame(animateHero);
    }
    animateHero();
}

function getSpeed() {
    return parseInt(document.getElementById('speedRange').value);
}

document.getElementById('speedRange').addEventListener('input', function() {
    document.getElementById('speedLabel').textContent = this.value + 'ms';
});

const delay = (ms) => new Promise(res => setTimeout(res, ms));

function updateStatus(msg, type='normal') {
    const el = document.getElementById('elcaStatus');
    el.innerHTML = msg;
    el.className = 'elca-status';
    if(type === 'good') el.classList.add('good');
    if(type === 'error') el.classList.add('error');
}

function logQuery(msg) {
    const log = document.getElementById('queryLog');
    const div = document.createElement('div');
    div.className = 'elca-answer-row';
    div.innerHTML = msg;
    log.prepend(div);
}

function enableBtn(id, enable = true) {
    document.getElementById(id).disabled = !enable;
}

// Tree generation
function generateTree() {
    if(abortController) {
        abortController.abort();
        abortController = null;
    }
    
    nodesCount = Math.floor(Math.random() * 6) + 8; // 8 to 13 nodes
    tree = Array.from({length: nodesCount}, () => []);
    
    for (let i = 1; i < nodesCount; i++) {
        const parent = Math.floor(Math.random() * i);
        tree[parent].push(i);
        tree[i].push(parent);
    }
    
    resetUI();
    calculateTreeLayout();
    initCanvasStates();
    
    updateStatus(`Generated random tree with ${nodesCount} nodes. Ready to build Euler Tour.`, 'normal');
    enableBtn('btnEulerTour', true);
}

function resetUI() {
    document.getElementById('firstArrayTrack').innerHTML = '';
    document.getElementById('tourArrayTrack').innerHTML = '';
    document.getElementById('depthArrayTrack').innerHTML = '';
    document.getElementById('sparseTableContainer').innerHTML = '<table class="elca-sparse-table" id="sparseTable"></table>';
    document.getElementById('queryLog').innerHTML = '<div class="elca-answer-row"><span>Ready for queries.</span></div>';
    
    enableBtn('btnEulerTour', false);
    enableBtn('btnSparseTable', false);
    enableBtn('btnQueryLCA', false);
    
    nodeStates.forEach(n => { n.color = COLOR_DEF; n.scale = 1; n.targetColor = COLOR_DEF; n.targetScale = 1; });
    edgeStates.forEach(e => { e.color = 'rgba(255,255,255,0.1)'; e.width = 2; e.targetColor = 'rgba(255,255,255,0.1)'; e.targetWidth = 2; });
}

function calculateTreeLayout() {
    treeLayout = Array(nodesCount).fill(null);
    let nodeLevels = {};
    let maxD = 0;
    
    function dfsLevels(u, p, d) {
        nodeLevels[u] = d;
        maxD = Math.max(maxD, d);
        for (let v of tree[u]) {
            if (v !== p) dfsLevels(v, u, d + 1);
        }
    }
    dfsLevels(0, -1, 0);
    
    const w = canvas.width;
    const h = canvas.height;
    const hGap = h / (maxD + 2);
    
    for (let d = 0; d <= maxD; d++) {
        let nodesAtDepth = [];
        for (let i = 0; i < nodesCount; i++) if (nodeLevels[i] === d) nodesAtDepth.push(i);
        let wGap = w / (nodesAtDepth.length + 1);
        nodesAtDepth.forEach((u, idx) => {
            treeLayout[u] = {
                x: (idx + 1) * wGap,
                y: (d + 1) * hGap
            };
        });
    }
}

function initCanvasStates() {
    nodeStates = [];
    for(let i=0; i<nodesCount; i++) {
        nodeStates.push({
            id: i,
            x: treeLayout[i].x, y: treeLayout[i].y,
            color: COLOR_DEF, targetColor: COLOR_DEF,
            scale: 1, targetScale: 1
        });
    }
    
    edgeStates = [];
    for(let u=0; u<nodesCount; u++) {
        for(let v of tree[u]) {
            if(u < v) {
                edgeStates.push({
                    u: u, v: v,
                    color: 'rgba(255,255,255,0.1)', targetColor: 'rgba(255,255,255,0.1)',
                    width: 2, targetWidth: 2
                });
            }
        }
    }
}

function updateCanvasStatesPositions() {
    nodeStates.forEach(n => {
        n.x = treeLayout[n.id].x;
        n.y = treeLayout[n.id].y;
    });
}

function hexToRgb(hex) {
    if(hex.startsWith('rgba')) {
        let parts = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if(parts) return {r: +parts[1], g: +parts[2], b: +parts[3], a: +parts[4]};
    }
    if(hex.startsWith('#')) {
        let r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
        return {r, g, b, a:1};
    }
    return {r:255,g:255,b:255,a:1};
}

function lerpColor(c1, c2, t) {
    let rgb1 = hexToRgb(c1);
    let rgb2 = hexToRgb(c2);
    let r = rgb1.r + (rgb2.r - rgb1.r) * t;
    let g = rgb1.g + (rgb2.g - rgb1.g) * t;
    let b = rgb1.b + (rgb2.b - rgb1.b) * t;
    let a = rgb1.a + (rgb2.a - rgb1.a) * t;
    return `rgba(${r},${g},${b},${a})`;
}

function renderLoop() {
    if(!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    edgeStates.forEach(e => {
        e.width += (e.targetWidth - e.width) * 0.2;
        e.color = lerpColor(e.color, e.targetColor, 0.2);
        
        let p1 = treeLayout[e.u], p2 = treeLayout[e.v];
        if(!p1 || !p2) return;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = e.color;
        ctx.lineWidth = e.width;
        ctx.stroke();
    });
    
    nodeStates.forEach(n => {
        n.scale += (n.targetScale - n.scale) * 0.2;
        n.color = lerpColor(n.color, n.targetColor, 0.2);
        
        ctx.beginPath();
        ctx.arc(n.x, n.y, nodeRadius * n.scale, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a'; // tailwind slate-900 like
        ctx.fill();
        ctx.lineWidth = 2 * n.scale;
        ctx.strokeStyle = n.color;
        ctx.stroke();
        
        if(n.targetColor !== COLOR_DEF) {
            ctx.fillStyle = n.color.replace(/[\d.]+\)$/g, '0.2)');
            ctx.fill();
        }
        
        ctx.fillStyle = '#fff';
        ctx.font = `600 ${11 * n.scale}px "Fira Code", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.id, n.x, n.y);
    });
    
    requestAnimationFrame(renderLoop);
}

function setNodeState(id, color, scale=1) {
    let n = nodeStates.find(n => n.id === id);
    if(n) { n.targetColor = color; n.targetScale = scale; }
}
function setEdgeState(u, v, color, width=2) {
    let e = edgeStates.find(e => (e.u===u && e.v===v) || (e.u===v && e.v===u));
    if(e) { e.targetColor = color; e.targetWidth = width; }
}

function createArrayCell(containerId, value, index, extraClass='') {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = `elca-array-cell ${extraClass}`;
    div.id = `${containerId}-cell-${index}`;
    div.innerHTML = `${value}<div class="elca-array-cell-idx">${index}</div>`;
    container.appendChild(div);
}

document.getElementById('btnGenTree').addEventListener('click', generateTree);

document.getElementById('btnEulerTour').addEventListener('click', async () => {
    enableBtn('btnGenTree', false);
    enableBtn('btnEulerTour', false);
    
    abortController = new AbortController();
    const signal = abortController.signal;
    
    tour = [];
    depthArr = [];
    firstOccurrence = Array(nodesCount).fill(-1);
    
    document.getElementById('firstArrayTrack').innerHTML = '';
    document.getElementById('tourArrayTrack').innerHTML = '';
    document.getElementById('depthArrayTrack').innerHTML = '';
    
    updateStatus('Building Euler Tour... tracking node visits and depth.', 'normal');
    
    try {
        await dfsEulerTour(0, -1, 0, signal);
        if (signal.aborted) return;
        
        document.getElementById('firstArrayTrack').innerHTML = '';
        for(let i=0; i<nodesCount; i++) {
            createArrayCell('firstArrayTrack', firstOccurrence[i] === -1 ? '-' : firstOccurrence[i], `n${i}`);
        }
        
        updateStatus('Euler Tour Built! Now build the Sparse Table to enable fast queries.', 'good');
        enableBtn('btnGenTree', true);
        enableBtn('btnEulerTour', true);
        enableBtn('btnSparseTable', true);
    } catch (e) {
        if(e.name !== 'AbortError') console.error(e);
    }
});

async function dfsEulerTour(u, p, d, signal) {
    if (signal.aborted) return;
    
    tour.push(u);
    depthArr.push(d);
    const idx = tour.length - 1;
    if (firstOccurrence[u] === -1) firstOccurrence[u] = idx;
    
    setNodeState(u, COLOR_ACTIVE, 1.2);
    if(p !== -1) setEdgeState(u, p, COLOR_ACTIVE, 3);
    
    createArrayCell('tourArrayTrack', u, idx, 'active');
    createArrayCell('depthArrayTrack', d, idx, 'active');
    
    await delay(getSpeed());
    if (signal.aborted) return;
    
    setNodeState(u, COLOR_DEF, 1);
    if(p !== -1) setEdgeState(u, p, 'rgba(255,255,255,0.1)', 2);
    
    document.getElementById(`tourArrayTrack-cell-${idx}`)?.classList.remove('active');
    document.getElementById(`depthArrayTrack-cell-${idx}`)?.classList.remove('active');
    
    for (let v of tree[u]) {
        if (v !== p) {
            await dfsEulerTour(v, u, d + 1, signal);
            if (signal.aborted) return;
            
            tour.push(u);
            depthArr.push(d);
            const bIdx = tour.length - 1;
            
            setNodeState(u, COLOR_ACTIVE, 1.2);
            setEdgeState(u, v, COLOR_ACTIVE, 3);
            
            createArrayCell('tourArrayTrack', u, bIdx, 'active');
            createArrayCell('depthArrayTrack', d, bIdx, 'active');
            
            await delay(getSpeed());
            if (signal.aborted) return;
            
            setNodeState(u, COLOR_DEF, 1);
            setEdgeState(u, v, 'rgba(255,255,255,0.1)', 2);
            document.getElementById(`tourArrayTrack-cell-${bIdx}`)?.classList.remove('active');
            document.getElementById(`depthArrayTrack-cell-${bIdx}`)?.classList.remove('active');
        }
    }
}

document.getElementById('btnSparseTable').addEventListener('click', async () => {
    enableBtn('btnGenTree', false);
    enableBtn('btnEulerTour', false);
    enableBtn('btnSparseTable', false);
    
    abortController = new AbortController();
    const signal = abortController.signal;
    updateStatus('Building Sparse Table (RMQ on Depth Array)...', 'normal');
    
    const n = tour.length;
    logTable = Array(n + 1).fill(0);
    for (let i = 2; i <= n; i++) logTable[i] = logTable[Math.floor(i / 2)] + 1;
    
    const maxK = logTable[n];
    sparseTable = Array.from({length: n}, () => Array(maxK + 1).fill(0));
    
    const tableEl = document.getElementById('sparseTable');
    tableEl.innerHTML = '';
    
    let trHead = document.createElement('tr');
    trHead.innerHTML = '<th>i \\ j</th>' + Array.from({length: maxK + 1}, (_, j) => `<th>${j}<br><small>(len ${1<<j})</small></th>`).join('');
    tableEl.appendChild(trHead);
    
    for (let i = 0; i < n; i++) {
        let tr = document.createElement('tr');
        tr.innerHTML = `<th>${i}</th>` + Array.from({length: maxK + 1}, (_, j) => `<td id="st-${i}-${j}">-</td>`).join('');
        tableEl.appendChild(tr);
    }
    
    try {
        for (let i = 0; i < n; i++) {
            sparseTable[i][0] = i; 
            const cell = document.getElementById(`st-${i}-0`);
            if(cell) {
                cell.innerHTML = `${i}<br><small>d=${depthArr[i]}</small>`;
                cell.classList.add('active');
            }
            document.getElementById(`depthArrayTrack-cell-${i}`)?.classList.add('active');
            
            await delay(getSpeed() / 4);
            if (signal.aborted) return;
            
            if(cell) cell.classList.remove('active');
            document.getElementById(`depthArrayTrack-cell-${i}`)?.classList.remove('active');
        }
        
        for (let j = 1; j <= maxK; j++) {
            const len = 1 << j;
            for (let i = 0; i + len <= n; i++) {
                const leftIdx = sparseTable[i][j - 1];
                const rightIdx = sparseTable[i + (1 << (j - 1))][j - 1];
                
                if (depthArr[leftIdx] < depthArr[rightIdx]) {
                    sparseTable[i][j] = leftIdx;
                } else {
                    sparseTable[i][j] = rightIdx;
                }
                
                const cell = document.getElementById(`st-${i}-${j}`);
                if(cell) {
                    cell.innerHTML = `${sparseTable[i][j]}<br><small>d=${depthArr[sparseTable[i][j]]}</small>`;
                    cell.classList.add('active');
                }
                
                document.getElementById(`st-${i}-${j-1}`)?.classList.add('highlight-query');
                document.getElementById(`st-${i + (1 << (j - 1))}-${j-1}`)?.classList.add('highlight-query');
                
                await delay(getSpeed() / 2);
                if (signal.aborted) return;
                
                if(cell) cell.classList.remove('active');
                document.getElementById(`st-${i}-${j-1}`)?.classList.remove('highlight-query');
                document.getElementById(`st-${i + (1 << (j - 1))}-${j-1}`)?.classList.remove('highlight-query');
            }
        }
        
        updateStatus('Sparse Table Built! You can now query LCA in O(1).', 'good');
        enableBtn('btnGenTree', true);
        enableBtn('btnEulerTour', true);
        enableBtn('btnSparseTable', true);
        enableBtn('btnQueryLCA', true);
    } catch (e) {
        if(e.name !== 'AbortError') console.error(e);
    }
});

document.getElementById('btnQueryLCA').addEventListener('click', async () => {
    enableBtn('btnGenTree', false);
    enableBtn('btnEulerTour', false);
    enableBtn('btnSparseTable', false);
    enableBtn('btnQueryLCA', false);
    
    document.querySelectorAll('.highlight-range, .lca-result, .active').forEach(el => el.classList.remove('highlight-range', 'lca-result', 'active'));
    nodeStates.forEach(n => { n.color = COLOR_DEF; n.scale = 1; n.targetColor = COLOR_DEF; n.targetScale = 1; });
    
    abortController = new AbortController();
    const signal = abortController.signal;
    
    let u = Math.floor(Math.random() * nodesCount);
    let v = Math.floor(Math.random() * nodesCount);
    while (u === v) v = Math.floor(Math.random() * nodesCount);
    
    updateStatus(`Querying LCA(${u}, ${v})... finding first occurrences.`, 'normal');
    setNodeState(u, COLOR_HIGHLIGHT, 1.2);
    setNodeState(v, COLOR_HIGHLIGHT, 1.2);
    
    try {
        await delay(getSpeed());
        
        let l = firstOccurrence[u];
        let r = firstOccurrence[v];
        
        if (l > r) { [l, r] = [r, l]; }
        
        for (let i = l; i <= r; i++) {
            document.getElementById(`tourArrayTrack-cell-${i}`)?.classList.add('highlight-range');
            document.getElementById(`depthArrayTrack-cell-${i}`)?.classList.add('highlight-range');
        }
        updateStatus(`Querying LCA(${u}, ${v})... RMQ in range [${l}, ${r}]`, 'normal');
        
        await delay(getSpeed());
        if (signal.aborted) return;
        
        const len = r - l + 1;
        const j = logTable[len];
        
        const leftCandidate = sparseTable[l][j];
        const rightCandidate = sparseTable[r - (1 << j) + 1][j];
        
        document.getElementById(`st-${l}-${j}`)?.classList.add('highlight-query');
        document.getElementById(`st-${r - (1 << j) + 1}-${j}`)?.classList.add('highlight-query');
        
        updateStatus(`Comparing min depth of blocks at indices ${leftCandidate} and ${rightCandidate}`, 'normal');
        await delay(getSpeed() * 1.5);
        if (signal.aborted) return;
        
        let minIdx = leftCandidate;
        if (depthArr[rightCandidate] < depthArr[leftCandidate]) {
            minIdx = rightCandidate;
        }
        
        document.getElementById(`st-${l}-${j}`)?.classList.remove('highlight-query');
        document.getElementById(`st-${r - (1 << j) + 1}-${j}`)?.classList.remove('highlight-query');
        
        for (let i = l; i <= r; i++) {
            document.getElementById(`tourArrayTrack-cell-${i}`)?.classList.remove('highlight-range');
            document.getElementById(`depthArrayTrack-cell-${i}`)?.classList.remove('highlight-range');
        }
        
        document.getElementById(`depthArrayTrack-cell-${minIdx}`)?.classList.add('lca-result');
        document.getElementById(`tourArrayTrack-cell-${minIdx}`)?.classList.add('lca-result');
        
        const lcaNode = tour[minIdx];
        setNodeState(lcaNode, COLOR_LCA, 1.4);
        
        updateStatus(`LCA of ${u} and ${v} is Node ${lcaNode}!`, 'good');
        logQuery(`LCA(<span class="highlight">${u}</span>, <span class="highlight">${v}</span>) &rarr; <span class="success">Node ${lcaNode}</span> <br><small>RMQ in [${l}, ${r}] gave index ${minIdx}</small>`);
        
        enableBtn('btnGenTree', true);
        enableBtn('btnEulerTour', true);
        enableBtn('btnSparseTable', true);
        enableBtn('btnQueryLCA', true);
        
    } catch(e) {
        if(e.name !== 'AbortError') console.error(e);
    }
});

document.getElementById('btnReset').addEventListener('click', () => {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
    resetUI();
    enableBtn('btnGenTree', true);
    if(nodesCount > 0) enableBtn('btnEulerTour', true);
    updateStatus('Reset complete. Build Euler tour to start again.', 'normal');
});

initCanvas();
initHeroCanvas();
generateTree();
