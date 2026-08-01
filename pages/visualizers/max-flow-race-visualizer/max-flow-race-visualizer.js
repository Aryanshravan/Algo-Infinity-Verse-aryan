// ============================================
// MAX FLOW RACE VISUALIZER
// ============================================

let abortController = null;
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function getSpeed() { return parseInt(document.getElementById('speedRange').value); }
document.getElementById('speedRange').addEventListener('input', function() {
    document.getElementById('speedLabel').textContent = this.value + 'ms';
});

// Graph definitions
function generateGraph(preset) {
    let nodes = [];
    let edges = [];
    
    if (preset === 'classic') {
        nodes = [
            { id: 0, label: 'S', x: 50, y: 175 },
            { id: 1, label: 'A', x: 200, y: 75 },
            { id: 2, label: 'B', x: 200, y: 275 },
            { id: 3, label: 'C', x: 350, y: 75 },
            { id: 4, label: 'D', x: 350, y: 275 },
            { id: 5, label: 'T', x: 500, y: 175 }
        ];
        edges = [
            { u: 0, v: 1, cap: 10 }, { u: 0, v: 2, cap: 10 },
            { u: 1, v: 2, cap: 2 },  { u: 1, v: 3, cap: 4 },
            { u: 1, v: 4, cap: 8 },  { u: 2, v: 4, cap: 9 },
            { u: 3, v: 5, cap: 10 }, { u: 4, v: 3, cap: 6 },
            { u: 4, v: 5, cap: 10 }
        ];
    } else if (preset === 'adversarial') {
        // Bipartite EK trap (many paths needed)
        nodes = [
            { id: 0, label: 'S', x: 50, y: 175 },
            { id: 1, label: 'L1', x: 180, y: 60 }, { id: 2, label: 'L2', x: 180, y: 140 },
            { id: 3, label: 'L3', x: 180, y: 220 }, { id: 4, label: 'L4', x: 180, y: 300 },
            { id: 5, label: 'R1', x: 350, y: 60 }, { id: 6, label: 'R2', x: 350, y: 140 },
            { id: 7, label: 'R3', x: 350, y: 220 }, { id: 8, label: 'R4', x: 350, y: 300 },
            { id: 9, label: 'T', x: 480, y: 175 }
        ];
        // S to L
        for(let i=1; i<=4; i++) edges.push({u: 0, v: i, cap: 100});
        // R to T
        for(let i=5; i<=8; i++) edges.push({u: i, v: 9, cap: 100});
        // L to R (cross edges of capacity 1)
        for(let i=1; i<=4; i++) {
            for(let j=5; j<=8; j++) {
                edges.push({u: i, v: j, cap: 1});
            }
        }
    } else if (preset === 'dense') {
        nodes = [
            { id: 0, label: 'S', x: 50, y: 175 },
            { id: 1, label: '1', x: 150, y: 80 }, { id: 2, label: '2', x: 150, y: 270 },
            { id: 3, label: '3', x: 275, y: 175 },
            { id: 4, label: '4', x: 400, y: 80 }, { id: 5, label: '5', x: 400, y: 270 },
            { id: 6, label: 'T', x: 500, y: 175 }
        ];
        edges = [
            { u:0, v:1, cap:15 }, { u:0, v:2, cap:12 },
            { u:1, v:2, cap:5 }, { u:1, v:3, cap:10 }, { u:1, v:4, cap:7 },
            { u:2, v:3, cap:9 }, { u:2, v:5, cap:14 },
            { u:3, v:4, cap:6 }, { u:3, v:5, cap:8 },
            { u:4, v:5, cap:4 }, { u:4, v:6, cap:18 }, { u:5, v:6, cap:15 }
        ];
    }
    
    // Scale node positions to roughly fit 550x350
    return { nodes, edges };
}

// Graph Deep Copy for isolated state
function createGraphState(graphData) {
    let state = {
        nodes: JSON.parse(JSON.stringify(graphData.nodes)),
        edges: [],
        adj: {}
    };
    
    state.nodes.forEach(n => {
        state.adj[n.id] = [];
        // UI states
        n.height = 0; n.excess = 0;
        n.highlight = false;
    });
    
    graphData.edges.forEach(e => {
        let fwd = { u: e.u, v: e.v, cap: e.cap, flow: 0, isRev: false, highlight: false, pushing: false };
        let rev = { u: e.v, v: e.u, cap: 0, flow: 0, isRev: true, highlight: false, pushing: false };
        fwd.rev = rev; rev.rev = fwd;
        state.edges.push(fwd);
        state.edges.push(rev);
        state.adj[e.u].push(fwd);
        state.adj[e.v].push(rev);
    });
    
    return state;
}

// Canvas Drawing Engine
function drawGraph(ctx, w, h, state, mode) {
    ctx.clearRect(0, 0, w, h);
    const paddingX = w / 600; // rough scale
    const paddingY = h / 400;
    
    // Draw edges
    state.edges.forEach(e => {
        if (e.cap === 0 && e.flow === 0 && !e.isRev) return; // Hide empty reverse edges
        if (e.isRev && e.cap === 0) return;
        
        let n1 = state.nodes.find(n => n.id === e.u);
        let n2 = state.nodes.find(n => n.id === e.v);
        
        let px1 = n1.x * paddingX + 20;
        let py1 = n1.y * paddingY + 25;
        let px2 = n2.x * paddingX + 20;
        let py2 = n2.y * paddingY + 25;
        
        ctx.beginPath();
        ctx.moveTo(px1, py1);
        ctx.lineTo(px2, py2);
        
        // Edge styling
        if (e.pushing) {
            ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 4;
        } else if (e.highlight) {
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
        }
        ctx.stroke();
        
        // Flow Text
        if (!e.isRev) {
            let cx = (px1 + px2) / 2;
            let cy = (py1 + py2) / 2;
            ctx.fillStyle = e.highlight || e.pushing ? '#fff' : 'rgba(255,255,255,0.6)';
            ctx.font = '600 10px "Fira Code"';
            ctx.textAlign = 'center';
            ctx.fillText(`${e.flow}/${e.cap}`, cx, cy - 8);
        }
    });
    
    // Draw nodes
    state.nodes.forEach(n => {
        let px = n.x * paddingX + 20;
        let py = n.y * paddingY + 25;
        
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = n.highlight ? '#f59e0b' : '#1e1e1e';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = n.id === 0 ? '#3b82f6' : (n.label === 'T' ? '#ef4444' : '#a855f7');
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '600 12px "Orbitron"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label, px, py);
        
        if (mode === 'PR') {
            ctx.fillStyle = '#06b6d4';
            ctx.font = '400 9px "Fira Code"';
            ctx.fillText(`h:${n.height}`, px, py + 22);
            if (n.excess > 0 && n.id !== 0 && n.label !== 'T') {
                ctx.fillStyle = '#22c55e';
                ctx.fillText(`+${n.excess}`, px, py - 22);
            }
        }
    });
}

// Global state
let currentGraph = null;
let ekState = null;
let prState = null;
let ekCanvas = document.getElementById('ekCanvas');
let prCanvas = document.getElementById('prCanvas');

function renderEK() { if(ekState) drawGraph(ekCanvas.getContext('2d'), ekCanvas.width, ekCanvas.height, ekState, 'EK'); }
function renderPR() { if(prState) drawGraph(prCanvas.getContext('2d'), prCanvas.width, prCanvas.height, prState, 'PR'); }

function updateStatus(msg, type='normal') {
    const el = document.getElementById('mfrStatus');
    el.innerHTML = msg;
    el.className = 'mfr-status';
    if(type === 'good') el.classList.add('good');
    if(type === 'error') el.classList.add('error');
}

function setBadge(id, state) {
    const el = document.getElementById(id);
    el.className = `badge badge-${state}`;
    el.innerText = state.toUpperCase();
}

function resizeCanvases() {
    [ekCanvas, prCanvas].forEach(c => {
        c.width = c.parentElement.clientWidth;
        c.height = c.parentElement.clientHeight;
    });
    renderEK(); renderPR();
}
window.addEventListener('resize', resizeCanvases);

// Initialization
document.getElementById('btnInit').addEventListener('click', () => {
    if(abortController) abortController.abort();
    let preset = document.getElementById('presetSelect').value;
    currentGraph = generateGraph(preset);
    
    ekState = createGraphState(currentGraph);
    prState = createGraphState(currentGraph);
    
    document.getElementById('ekFlow').innerText = '0';
    document.getElementById('ekPaths').innerText = '0';
    document.getElementById('ekOps').innerText = '0';
    document.getElementById('prFlow').innerText = '0';
    document.getElementById('prPushes').innerText = '0';
    document.getElementById('prRelabels').innerText = '0';
    
    setBadge('ekBadge', 'waiting');
    setBadge('prBadge', 'waiting');
    
    resizeCanvases();
    updateStatus('Graph loaded. Ready to race!');
});

// Race Logic
document.getElementById('btnRace').addEventListener('click', async () => {
    if(!ekState || !prState) { updateStatus('Load a graph first.', 'error'); return; }
    if(abortController) abortController.abort();
    abortController = new AbortController();
    let signal = abortController.signal;
    
    document.querySelectorAll('.mfr-btn, .mfr-select').forEach(el => el.disabled = true);
    updateStatus('Race is on!', 'good');
    
    // Clear flows
    ekState = createGraphState(currentGraph);
    prState = createGraphState(currentGraph);
    resizeCanvases();
    
    let ekPromise = runEdmondsKarp(signal);
    let prPromise = runPushRelabel(signal);
    
    await Promise.all([ekPromise, prPromise]);
    
    if(!signal.aborted) {
        updateStatus('Race Finished! Compare the macroscopic operations.', 'good');
    }
    document.querySelectorAll('.mfr-btn, .mfr-select').forEach(el => el.disabled = false);
});

document.getElementById('btnReset').addEventListener('click', () => {
    if(abortController) abortController.abort();
    document.getElementById('btnInit').click();
});

// Edmonds-Karp Implementation
async function runEdmondsKarp(signal) {
    setBadge('ekBadge', 'running');
    let S = 0; 
    let T = ekState.nodes[ekState.nodes.length-1].id;
    let maxFlow = 0;
    let pathsFound = 0;
    let ops = 0;
    
    while(true) {
        if(signal.aborted) return;
        
        // BFS
        let parent = {};
        let q = [S];
        let visited = new Set([S]);
        
        while(q.length > 0) {
            let u = q.shift();
            for(let edge of ekState.adj[u]) {
                if(!visited.has(edge.v) && edge.cap - edge.flow > 0) {
                    visited.add(edge.v);
                    parent[edge.v] = edge;
                    q.push(edge.v);
                    ops++;
                }
            }
        }
        
        document.getElementById('ekOps').innerText = ops;
        
        if(!visited.has(T)) break; // No augmenting path
        
        // Trace path and bottleneck
        let pathEdges = [];
        let curr = T;
        let bottleneck = Infinity;
        while(curr !== S) {
            let e = parent[curr];
            pathEdges.push(e);
            bottleneck = Math.min(bottleneck, e.cap - e.flow);
            curr = e.u;
        }
        
        pathsFound++;
        document.getElementById('ekPaths').innerText = pathsFound;
        
        // Highlight path
        pathEdges.forEach(e => e.highlight = true);
        renderEK();
        await delay(getSpeed());
        
        // Push flow
        pathEdges.forEach(e => {
            e.highlight = false;
            e.pushing = true;
            e.flow += bottleneck;
            e.rev.flow -= bottleneck;
        });
        
        maxFlow += bottleneck;
        document.getElementById('ekFlow').innerText = maxFlow;
        renderEK();
        await delay(getSpeed());
        
        pathEdges.forEach(e => e.pushing = false);
        renderEK();
    }
    
    if(!signal.aborted) setBadge('ekBadge', 'done');
}

// Push-Relabel Implementation
async function runPushRelabel(signal) {
    setBadge('prBadge', 'running');
    let S = 0;
    let T = prState.nodes[prState.nodes.length-1].id;
    
    let n = prState.nodes.length;
    let pushes = 0;
    let relabels = 0;
    
    prState.nodes[S].height = n;
    
    // Initial push from S
    for(let edge of prState.adj[S]) {
        if(edge.cap > 0) {
            edge.flow = edge.cap;
            edge.rev.flow = -edge.cap;
            prState.nodes[edge.v].excess += edge.cap;
            prState.nodes[S].excess -= edge.cap;
            edge.pushing = true;
        }
    }
    renderPR();
    await delay(getSpeed());
    prState.edges.forEach(e => e.pushing = false);
    
    const getActiveNode = () => {
        return prState.nodes.find(node => node.id !== S && node.id !== T && node.excess > 0);
    };
    
    while(true) {
        if(signal.aborted) return;
        let u = getActiveNode();
        if(!u) break; // done
        
        u.highlight = true;
        renderPR();
        await delay(getSpeed() / 2);
        
        // Try to push
        let pushed = false;
        for(let edge of prState.adj[u.id]) {
            let v = prState.nodes.find(node => node.id === edge.v);
            let resCap = edge.cap - edge.flow;
            
            if(resCap > 0 && u.height === v.height + 1) {
                // PUSH
                let delta = Math.min(u.excess, resCap);
                edge.flow += delta;
                edge.rev.flow -= delta;
                u.excess -= delta;
                v.excess += delta;
                
                pushes++;
                document.getElementById('prPushes').innerText = pushes;
                document.getElementById('prFlow').innerText = prState.nodes[T].excess;
                
                edge.pushing = true;
                renderPR();
                await delay(getSpeed());
                edge.pushing = false;
                pushed = true;
                break;
            }
        }
        
        if(!pushed) {
            // RELABEL
            let minH = Infinity;
            for(let edge of prState.adj[u.id]) {
                let v = prState.nodes.find(node => node.id === edge.v);
                let resCap = edge.cap - edge.flow;
                if(resCap > 0) {
                    minH = Math.min(minH, v.height);
                }
            }
            u.height = minH + 1;
            relabels++;
            document.getElementById('prRelabels').innerText = relabels;
            renderPR();
            await delay(getSpeed());
        }
        
        u.highlight = false;
        renderPR();
    }
    
    if(!signal.aborted) setBadge('prBadge', 'done');
}

// Hero particle background
const heroCanvas = document.getElementById('mfrHeroCanvas');
const hctx = heroCanvas.getContext('2d');
let particles = [];
function initHeroCanvas() {
    const resizeHero = () => {
        heroCanvas.width = heroCanvas.clientWidth;
        heroCanvas.height = heroCanvas.clientHeight;
    };
    window.addEventListener('resize', resizeHero);
    resizeHero();
    
    for(let i=0; i<60; i++) {
        particles.push({
            x: Math.random() * heroCanvas.width,
            y: Math.random() * heroCanvas.height,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            size: Math.random() * 2 + 1
        });
    }
    
    function animateHero() {
        hctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
        hctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
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
        
        hctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
        hctx.lineWidth = 1;
        for(let i=0; i<particles.length; i++) {
            for(let j=i+1; j<particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                if(dx*dx + dy*dy < 10000) {
                    hctx.beginPath();
                    hctx.moveTo(particles[i].x, particles[i].y);
                    hctx.lineTo(particles[j].x, particles[j].y);
                    hctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animateHero);
    }
    animateHero();
}

initHeroCanvas();
document.getElementById('btnInit').click();
