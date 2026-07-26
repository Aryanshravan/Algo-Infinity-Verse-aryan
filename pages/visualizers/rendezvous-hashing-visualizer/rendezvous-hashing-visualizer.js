// ============================================
// RENDEZVOUS HASHING VISUALIZER
// ============================================

// Utility: Deterministic Hash (Murmur-like) yielding [0, 1) float
function simpleHash(str) {
    let h = 0x811c9dc5;
    for(let i=0; i<str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0) / 4294967296;
}

// Global State
let servers = ['Server-A', 'Server-B', 'Server-C'];
let nextServerCode = 68; // 'D'
let keys = [];

// Models State
let mapHRW = new Map(); // key -> server
let mapCHBase = new Map();
let mapCHVNode = new Map();

// Stats
let statsHRW = { migrations: 0 };
let statsCHBase = { migrations: 0 };
let statsCHVNode = { migrations: 0 };

// Colors
const serverColors = {
    'Server-A': '#ef4444',
    'Server-B': '#3b82f6',
    'Server-C': '#22c55e',
    'Server-D': '#a855f7',
    'Server-E': '#f59e0b',
    'Server-F': '#06b6d4',
    'Server-G': '#ec4899',
    'Server-H': '#6366f1'
};
function getColor(s) {
    return serverColors[s] || '#aaa';
}

function updateStatus(msg, type='normal') {
    const el = document.getElementById('hrwStatus');
    el.innerHTML = msg;
    el.className = 'hrw-status';
    if(type === 'good') el.classList.add('good');
    if(type === 'warn') el.classList.add('warn');
}

// --- ALGORITHMS ---

// Rendezvous Hashing (HRW)
function getHRWOwner(keyId) {
    if(servers.length === 0) return null;
    let maxScore = -1;
    let winner = null;
    for(let s of servers) {
        let score = simpleHash(keyId + "|" + s);
        if(score > maxScore) {
            maxScore = score;
            winner = s;
        }
    }
    return winner;
}

// Consistent Hashing Builder
function buildCHRing(vNodesPerServer) {
    let ring = [];
    for(let s of servers) {
        for(let i=0; i<vNodesPerServer; i++) {
            // For no vnodes, just use 1 and suffix it
            let nodeStr = s + "#" + i;
            let h = simpleHash(nodeStr);
            ring.push({hash: h, server: s});
        }
    }
    ring.sort((a, b) => a.hash - b.hash);
    return ring;
}

function getCHOwner(keyId, ring) {
    if(ring.length === 0) return null;
    let h = simpleHash(keyId);
    let low = 0;
    let high = ring.length;
    while (low < high) {
        const mid = low + Math.floor((high - low) / 2);
        if (ring[mid].hash < h) low = mid + 1;
        else high = mid;
    }
    return ring[low % ring.length].server;
}

// --- RECOMPUTATION ---

function recomputeAll() {
    let chBaseRing = buildCHRing(1);
    let chVNodeRing = buildCHRing(100);
    
    let mHRW = 0;
    let mCHBase = 0;
    let mCHVNode = 0;
    
    for(let k of keys) {
        // HRW
        let newOwner = getHRWOwner(k);
        if(mapHRW.get(k) && mapHRW.get(k) !== newOwner) mHRW++;
        mapHRW.set(k, newOwner);
        
        // CH Base
        newOwner = getCHOwner(k, chBaseRing);
        if(mapCHBase.get(k) && mapCHBase.get(k) !== newOwner) mCHBase++;
        mapCHBase.set(k, newOwner);
        
        // CH VNode
        newOwner = getCHOwner(k, chVNodeRing);
        if(mapCHVNode.get(k) && mapCHVNode.get(k) !== newOwner) mCHVNode++;
        mapCHVNode.set(k, newOwner);
    }
    
    statsHRW.migrations += mHRW;
    statsCHBase.migrations += mCHBase;
    statsCHVNode.migrations += mCHVNode;
    
    updateScoreboards();
    drawCharts();
    
    if(keys.length > 0) {
        updateStatus(`Topology changed! Migrations occurred. HRW: ${mHRW}, CH(No V-Nodes): ${mCHBase}, CH(100 V-Nodes): ${mCHVNode}.`, 'warn');
    }
}


// --- UI RENDERING ---

function updateScoreboards() {
    let container = document.getElementById('scoreboardsContainer');
    container.innerHTML = '';
    
    if(keys.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color:var(--text-secondary); width: 100%;">Generate keys to see the scoring mechanism.</div>';
        return;
    }
    
    // Pick the first 4 keys to show as examples
    let sampleKeys = keys.slice(0, 4);
    
    for(let k of sampleKeys) {
        let card = document.createElement('div');
        card.className = 'hrw-key-card';
        card.innerHTML = `<div class="hrw-key-title">${k}</div>`;
        
        let scores = [];
        for(let s of servers) {
            scores.push({server: s, score: simpleHash(k + "|" + s)});
        }
        scores.sort((a,b) => b.score - a.score);
        
        for(let i=0; i<scores.length; i++) {
            let row = document.createElement('div');
            row.className = 'hrw-score-row';
            if(i === 0) row.classList.add('winner'); // Highest score
            
            row.innerHTML = `
                <span><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${getColor(scores[i].server)}; margin-right:4px;"></span> ${scores[i].server}</span>
                <span>${scores[i].score.toFixed(4)}</span>
            `;
            card.appendChild(row);
        }
        
        container.appendChild(card);
    }
}

function drawChart(canvasId, ownershipMap, stats, label) {
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');
    
    // Ensure accurate sizing
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    let w = canvas.width;
    let h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    if(servers.length === 0 || keys.length === 0) return;
    
    // Aggregate load
    let load = {};
    for(let s of servers) load[s] = 0;
    
    for(let k of keys) {
        let owner = ownershipMap.get(k);
        if(owner && load[owner] !== undefined) load[owner]++;
    }
    
    // Find max for scaling
    let maxLoad = 0;
    for(let s of servers) {
        if(load[s] > maxLoad) maxLoad = load[s];
    }
    let targetAvg = keys.length / servers.length;
    let scaleMax = Math.max(maxLoad * 1.1, targetAvg * 1.5);
    
    // Draw target average line
    let avgY = h - 20 - (targetAvg / scaleMax) * (h - 40);
    ctx.beginPath();
    ctx.moveTo(0, avgY);
    ctx.lineTo(w, avgY);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px "Fira Code"';
    ctx.fillText('Ideal Avg', 5, avgY - 5);
    
    // Draw Bars
    let padX = 20;
    let barSpacing = 15;
    let totalBarWidth = w - 2*padX;
    let barWidth = (totalBarWidth / servers.length) - barSpacing;
    
    for(let i=0; i<servers.length; i++) {
        let s = servers[i];
        let val = load[s];
        
        let bx = padX + i * (barWidth + barSpacing) + barSpacing/2;
        let bh = (val / scaleMax) * (h - 40);
        let by = h - 20 - bh;
        
        ctx.fillStyle = getColor(s);
        ctx.fillRect(bx, by, barWidth, bh);
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = '10px "Fira Code"';
        ctx.fillText(s.split('-')[1], bx + barWidth/2, h - 5);
        ctx.fillText(val, bx + barWidth/2, by - 5);
    }
    
    // Update Stats text
    document.getElementById(label).innerHTML = `
        <div>Keys: ${keys.length}</div>
        <div>Total Migrations: <span style="color:#f59e0b; font-weight:700;">${stats.migrations}</span></div>
    `;
}

function drawCharts() {
    drawChart('chartHRW', mapHRW, statsHRW, 'statsHRW');
    drawChart('chartCHBase', mapCHBase, statsCHBase, 'statsCHBase');
    drawChart('chartCHVNode', mapCHVNode, statsCHVNode, 'statsCHVNode');
}


// --- CONTROLS ---

document.getElementById('btnGenKeys').addEventListener('click', () => {
    keys = [];
    for(let i=0; i<1000; i++) {
        keys.push("Key-" + Math.floor(Math.random()*1000000));
    }
    // reset migrations
    statsHRW.migrations = 0;
    statsCHBase.migrations = 0;
    statsCHVNode.migrations = 0;
    
    recomputeAll();
    updateStatus(`1,000 unique keys generated and assigned across ${servers.length} servers.`, 'good');
});

document.getElementById('btnAddServer').addEventListener('click', () => {
    if(servers.length >= 8) {
        updateStatus("Max 8 servers for visualization purposes.", 'warn');
        return;
    }
    let sName = 'Server-' + String.fromCharCode(nextServerCode++);
    servers.push(sName);
    recomputeAll();
});

document.getElementById('btnRemoveServer').addEventListener('click', () => {
    if(servers.length <= 1) {
        updateStatus("Cannot remove the last server.", 'warn');
        return;
    }
    // Remove a random server to show resilience
    let idx = Math.floor(Math.random() * servers.length);
    let removed = servers.splice(idx, 1)[0];
    updateStatus(`Removing ${removed}...`, 'warn');
    recomputeAll();
});

document.getElementById('btnReset').addEventListener('click', () => {
    servers = ['Server-A', 'Server-B', 'Server-C'];
    nextServerCode = 68;
    keys = [];
    mapHRW.clear();
    mapCHBase.clear();
    mapCHVNode.clear();
    statsHRW.migrations = 0;
    statsCHBase.migrations = 0;
    statsCHVNode.migrations = 0;
    updateScoreboards();
    drawCharts();
    updateStatus('System reset.', 'normal');
});

// Hero Animation
const heroCanvas = document.getElementById('hrwHeroCanvas');
const hctx = heroCanvas.getContext('2d');
function initHeroCanvas() {
    const resizeHero = () => {
        heroCanvas.width = heroCanvas.clientWidth;
        heroCanvas.height = heroCanvas.clientHeight;
    };
    window.addEventListener('resize', resizeHero);
    resizeHero();
    
    let t = 0;
    function animateHero() {
        hctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
        let cx = heroCanvas.width/2;
        let cy = heroCanvas.height/2;
        
        let nodes = [
            {x: cx - 150, y: cy},
            {x: cx + 150, y: cy},
            {x: cx, y: cy + 150}
        ];
        
        // Draw key
        let kx = cx + Math.sin(t*0.02) * 50;
        let ky = cy + Math.cos(t*0.03) * 50 - 50;
        
        hctx.beginPath();
        hctx.arc(kx, ky, 8, 0, 2*Math.PI);
        hctx.fillStyle = '#fff';
        hctx.fill();
        hctx.shadowBlur = 15;
        hctx.shadowColor = '#fff';
        
        // Draw lines from key to servers evaluating scores
        let bestScore = -1;
        let bestIdx = -1;
        let scores = [
            Math.abs(Math.sin(t*0.02 + 1)),
            Math.abs(Math.sin(t*0.02 + 2)),
            Math.abs(Math.sin(t*0.02 + 3))
        ];
        
        for(let i=0; i<3; i++) {
            if(scores[i] > bestScore) {
                bestScore = scores[i];
                bestIdx = i;
            }
        }
        
        for(let i=0; i<3; i++) {
            hctx.beginPath();
            hctx.moveTo(kx, ky);
            hctx.lineTo(nodes[i].x, nodes[i].y);
            hctx.lineWidth = i === bestIdx ? 4 : 1;
            hctx.strokeStyle = i === bestIdx ? 'rgba(6,182,212,0.8)' : 'rgba(255,255,255,0.1)';
            hctx.stroke();
            
            // server nodes
            hctx.beginPath();
            hctx.arc(nodes[i].x, nodes[i].y, 20, 0, 2*Math.PI);
            hctx.fillStyle = '#0f172a';
            hctx.fill();
            hctx.strokeStyle = i === bestIdx ? '#06b6d4' : '#555';
            hctx.lineWidth = 2;
            hctx.stroke();
            
            hctx.fillStyle = i === bestIdx ? '#06b6d4' : '#555';
            hctx.font = '10px "Fira Code"';
            hctx.textAlign = 'center';
            hctx.fillText(scores[i].toFixed(2), nodes[i].x, nodes[i].y + 4);
        }
        hctx.shadowBlur = 0;
        
        t += 1;
        requestAnimationFrame(animateHero);
    }
    animateHero();
}

window.addEventListener('resize', () => {
    drawCharts();
});

// Init
initHeroCanvas();
setTimeout(() => {
    updateScoreboards();
    drawCharts();
}, 100);
