// ============================================
// BITMASK DP VISUALIZER (TSP)
// ============================================

const N = 5;
let nodes = [];
let dist = [];
let dp = [];
let parent = []; // to trace paths
let validMasks = [];
let transitionsQueue = [];
let currentTransitionIndex = 0;
let isPlaying = false;
let playInterval = null;

let canvas = document.getElementById('graphCanvas');
let ctx = canvas.getContext('2d');

function updateStatus(msg, type='normal') {
    const el = document.getElementById('bdpStatus');
    el.innerHTML = msg;
    el.className = 'bdp-status';
    if(type === 'good') el.classList.add('good');
    if(type === 'error') el.classList.add('error');
}

function resizeCanvases() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    drawGraph();
}
window.addEventListener('resize', resizeCanvases);

// Graph Generation
function generateGraph(type) {
    nodes = [];
    dist = [];
    let w = canvas.width;
    let h = canvas.height;
    let cx = w/2, cy = h/2;
    let r = Math.min(w, h)/2 - 40;
    
    for(let i=0; i<N; i++) {
        if(type === 'pentagon') {
            let angle = -Math.PI/2 + (i * 2 * Math.PI / N);
            nodes.push({x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle)});
        } else if(type === 'star') {
            let angle = -Math.PI/2 + (i * 2 * Math.PI / N);
            let rad = (i%2 === 0) ? r : r*0.4;
            nodes.push({x: cx + rad * Math.cos(angle), y: cy + rad * Math.sin(angle)});
        } else {
            // Random, but ensure they aren't too close
            nodes.push({
                x: 40 + Math.random()*(w-80),
                y: 40 + Math.random()*(h-80)
            });
        }
    }
    
    // Distances
    for(let i=0; i<N; i++) {
        dist[i] = [];
        for(let j=0; j<N; j++) {
            if(i === j) dist[i][j] = 0;
            else {
                let dx = nodes[i].x - nodes[j].x;
                let dy = nodes[i].y - nodes[j].y;
                dist[i][j] = Math.round(Math.sqrt(dx*dx + dy*dy) / 10); // scale down so numbers are small
            }
        }
    }
}

// DP Initialization
function initDP() {
    // Generate valid masks (masks that have bit 0 set, i.e., start at city 0)
    validMasks = [];
    for(let m=1; m<(1<<N); m++) {
        if(m & 1) { // must include city 0
            // count set bits
            let pop = 0;
            for(let i=0; i<N; i++) if(m & (1<<i)) pop++;
            validMasks.push({mask: m, pop: pop});
        }
    }
    // Sort by population count to guarantee topological dependency
    validMasks.sort((a,b) => a.pop - b.pop);
    
    dp = Array(1<<N).fill().map(() => Array(N).fill(Infinity));
    parent = Array(1<<N).fill().map(() => Array(N).fill(-1));
    
    dp[1][0] = 0; // Base case: mask 00001 ending at city 0 is cost 0
    
    buildTableUI();
    computeTransitions();
    
    currentTransitionIndex = 0;
    updateBitmaskVisual(1, -1, -1);
    
    document.getElementById('btnTour').disabled = true;
    document.getElementById('btnStep').disabled = false;
    document.getElementById('btnPlay').disabled = false;
    document.getElementById('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Play Full DP';
    isPlaying = false;
    clearInterval(playInterval);
    
    updateStatus('DP Initialized. Base case dp[1][0] = 0.', 'normal');
    drawGraph();
}

// Queue all valid transitions in order
function computeTransitions() {
    transitionsQueue = [];
    // Just build a queue of the state transitions we want to animate
    let tempDP = Array(1<<N).fill().map(() => Array(N).fill(Infinity));
    tempDP[1][0] = 0;
    
    for(let mObj of validMasks) {
        let mask = mObj.mask;
        for(let u=0; u<N; u++) {
            if(mask & (1<<u)) { // u is in mask
                if(tempDP[mask][u] !== Infinity) {
                    for(let v=0; v<N; v++) {
                        if(!(mask & (1<<v))) { // v not in mask
                            let nextMask = mask | (1<<v);
                            let cost = tempDP[mask][u] + dist[u][v];
                            transitionsQueue.push({
                                mask: mask, u: u, nextMask: nextMask, v: v, 
                                cost: cost, edgeCost: dist[u][v],
                                isImprovement: cost < tempDP[nextMask][v]
                            });
                            if(cost < tempDP[nextMask][v]) {
                                tempDP[nextMask][v] = cost;
                            }
                        }
                    }
                }
            }
        }
    }
}

// UI Building
function buildTableUI() {
    let tbody = document.getElementById('dpTbody');
    tbody.innerHTML = '';
    
    let lastPop = -1;
    for(let mObj of validMasks) {
        let mask = mObj.mask;
        
        if(mObj.pop !== lastPop) {
            let tr = document.createElement('tr');
            tr.className = 'group-border';
            tr.innerHTML = `<td colspan="8" style="text-align:left; font-weight:700; color:#06b6d4; padding-left:10px;">Population: ${mObj.pop} Cities</td>`;
            tbody.appendChild(tr);
            lastPop = mObj.pop;
        }
        
        let tr = document.createElement('tr');
        tr.id = `row-${mask}`;
        
        let binaryStr = mask.toString(2).padStart(N, '0');
        let html = `
            <td>${mObj.pop}</td>
            <td style="color:var(--text-primary)">${mask}</td>
            <td style="color:#a855f7">${binaryStr}</td>
        `;
        
        for(let i=0; i<N; i++) {
            if(!(mask & (1<<i))) {
                html += `<td class="inf">-</td>`; // Invalid state
            } else {
                let val = dp[mask][i] === Infinity ? '∞' : dp[mask][i];
                let cls = dp[mask][i] === Infinity ? 'inf' : 'val';
                html += `<td id="cell-${mask}-${i}" class="${cls}">${val}</td>`;
            }
        }
        
        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

function updateBitmaskVisual(mask, highlightBit, tryingBit) {
    let strip = document.getElementById('bmStrip');
    strip.innerHTML = '';
    
    for(let i=N-1; i>=0; i--) {
        let isSet = (mask & (1<<i)) !== 0;
        let isHigh = (i === highlightBit);
        let isTrying = (i === tryingBit);
        
        let cls = 'bdp-bit';
        if(isSet) cls += ' active';
        if(isHigh || isTrying) cls += ' highlight';
        
        let val = isSet ? '1' : '0';
        if(isTrying) val = '1'; // Show it turning into 1
        
        strip.innerHTML += `
            <div class="${cls}" data-bit="${i}">
                <div class="bit-val">${val}</div>
                <div class="bit-lbl">C${i}</div>
            </div>
        `;
    }
    
    document.getElementById('bmMath').innerHTML = `Integer Value: <span class="highlight">${mask}</span>`;
    
    if(tryingBit !== -1) {
        document.getElementById('bmTransition').innerHTML = `Next: ${mask} | (1 << ${tryingBit}) = ${mask | (1<<tryingBit)}`;
    } else {
        document.getElementById('bmTransition').innerHTML = `&nbsp;`;
    }
}

// Animation Step
function stepForward() {
    if(currentTransitionIndex >= transitionsQueue.length) {
        updateStatus('DP Table Complete! You can now Extract the Optimal Tour.', 'good');
        document.getElementById('btnTour').disabled = false;
        document.getElementById('btnStep').disabled = true;
        if(isPlaying) togglePlay();
        drawGraph();
        return;
    }
    
    // Clear previous cell styles
    document.querySelectorAll('.src-cell, .dst-cell').forEach(el => {
        el.classList.remove('src-cell', 'dst-cell');
    });
    
    let t = transitionsQueue[currentTransitionIndex];
    
    // Highlight table
    let srcCell = document.getElementById(`cell-${t.mask}-${t.u}`);
    let dstCell = document.getElementById(`cell-${t.nextMask}-${t.v}`);
    if(srcCell) srcCell.classList.add('src-cell');
    
    // Update value if improvement
    if(t.isImprovement) {
        dp[t.nextMask][t.v] = t.cost;
        parent[t.nextMask][t.v] = t.u;
        if(dstCell) {
            dstCell.classList.add('dst-cell');
            dstCell.classList.remove('inf');
            dstCell.innerText = t.cost;
        }
        updateStatus(`New best path to state ${t.nextMask} ending at C${t.v} with cost ${t.cost}.`, 'good');
    } else {
        updateStatus(`Transition to C${t.v} cost ${t.cost}, which is not better than existing. Ignored.`);
        if(dstCell) dstCell.classList.add('src-cell'); // just a mild highlight
    }
    
    // Scroll table to show the destination row
    let dstRow = document.getElementById(`row-${t.nextMask}`);
    if(dstRow) {
        let container = document.querySelector('.bdp-table-container');
        let offset = dstRow.offsetTop - container.offsetTop - (container.clientHeight/2);
        container.scrollTo({top: offset, behavior: 'smooth'});
    }
    
    updateBitmaskVisual(t.mask, t.u, t.v);
    
    currentTransitionIndex++;
    drawGraph(t.mask, t.u, t.v);
}

function extractTour() {
    let fullMask = (1<<N) - 1; // 11111 (31)
    
    // For classic TSP, we want to return to start. But our DP is shortest Hamiltonian Path from 0.
    // Let's find the best ending node, plus distance back to 0.
    let bestCost = Infinity;
    let bestEnd = -1;
    
    for(let i=1; i<N; i++) {
        let totalCost = dp[fullMask][i] + dist[i][0];
        if(totalCost < bestCost) {
            bestCost = totalCost;
            bestEnd = i;
        }
    }
    
    if(bestEnd === -1) return;
    
    // Trace back
    let path = [0]; // return to 0
    let curr = bestEnd;
    let currMask = fullMask;
    
    document.querySelectorAll('.optimal').forEach(el => el.classList.remove('optimal'));
    
    while(curr !== -1) {
        path.push(curr);
        let cell = document.getElementById(`cell-${currMask}-${curr}`);
        if(cell) cell.classList.add('optimal');
        
        let p = parent[currMask][curr];
        currMask = currMask ^ (1<<curr); // turn off bit
        curr = p;
    }
    path.reverse(); // [0, ..., bestEnd, 0]
    
    updateStatus(`Optimal Tour Cost: ${bestCost}. Path: ${path.map(n => 'C'+n).join(' → ')}`, 'good');
    
    // Draw the final tour on graph
    drawFinalTour(path);
}

// Drawing Graph
function drawGraph(activeMask = -1, activeNode = -1, tryingNode = -1) {
    let w = canvas.width;
    let h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Draw all edges faded
    ctx.lineWidth = 1;
    for(let i=0; i<N; i++) {
        for(let j=i+1; j<N; j++) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.stroke();
            
            // Dist label
            let mx = (nodes[i].x + nodes[j].x)/2;
            let my = (nodes[i].y + nodes[j].y)/2;
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '10px "Fira Code"';
            ctx.fillText(dist[i][j], mx, my);
        }
    }
    
    // Draw active path (we can trace back from activeNode in activeMask to show the path leading up to here!)
    if(activeMask !== -1 && activeNode !== -1) {
        let curr = activeNode;
        let cMask = activeMask;
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#a855f7';
        
        while(curr !== -1) {
            let p = parent[cMask][curr];
            if(p !== -1) {
                ctx.beginPath();
                ctx.moveTo(nodes[curr].x, nodes[curr].y);
                ctx.lineTo(nodes[p].x, nodes[p].y);
                ctx.stroke();
            }
            cMask = cMask ^ (1<<curr);
            curr = p;
        }
    }
    
    // Draw trying edge
    if(activeNode !== -1 && tryingNode !== -1) {
        ctx.beginPath();
        ctx.moveTo(nodes[activeNode].x, nodes[activeNode].y);
        ctx.lineTo(nodes[tryingNode].x, nodes[tryingNode].y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#06b6d4';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Draw nodes
    for(let i=0; i<N; i++) {
        let inMask = activeMask !== -1 && (activeMask & (1<<i));
        let isActive = (i === activeNode);
        let isTrying = (i === tryingNode);
        
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 16, 0, 2*Math.PI);
        
        if(isActive) ctx.fillStyle = '#a855f7';
        else if(isTrying) ctx.fillStyle = '#06b6d4';
        else if(inMask) ctx.fillStyle = 'rgba(168,85,247,0.3)';
        else ctx.fillStyle = 'rgba(255,255,255,0.1)';
        
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = (isActive || isTrying) ? '#fff' : (inMask ? '#a855f7' : '#555');
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`C${i}`, nodes[i].x, nodes[i].y);
    }
}

function drawFinalTour(path) {
    let w = canvas.width;
    let h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#22c55e';
    
    for(let i=0; i<path.length - 1; i++) {
        let u = path[i];
        let v = path[i+1];
        
        ctx.beginPath();
        ctx.moveTo(nodes[u].x, nodes[u].y);
        ctx.lineTo(nodes[v].x, nodes[v].y);
        ctx.stroke();
        
        // Draw directional arrow
        let mx = (nodes[u].x + nodes[v].x)/2;
        let my = (nodes[u].y + nodes[v].y)/2;
        let angle = Math.atan2(nodes[v].y - nodes[u].y, nodes[v].x - nodes[u].x);
        
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-5, 5);
        ctx.lineTo(-5, -5);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        ctx.restore();
    }
    
    // Draw nodes
    for(let i=0; i<N; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 16, 0, 2*Math.PI);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`C${i}`, nodes[i].x, nodes[i].y);
    }
}

// Controls
document.getElementById('btnInit').addEventListener('click', () => {
    generateGraph(document.getElementById('presetSelect').value);
    initDP();
});

document.getElementById('presetSelect').addEventListener('change', () => {
    generateGraph(document.getElementById('presetSelect').value);
    initDP();
});

document.getElementById('btnStep').addEventListener('click', stepForward);

function togglePlay() {
    isPlaying = !isPlaying;
    let btn = document.getElementById('btnPlay');
    
    if(isPlaying) {
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        let speed = 101 - document.getElementById('speedRange').value;
        playInterval = setInterval(stepForward, speed * 10);
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Auto Play Full DP';
        clearInterval(playInterval);
    }
}
document.getElementById('btnPlay').addEventListener('click', togglePlay);

document.getElementById('speedRange').addEventListener('input', () => {
    if(isPlaying) {
        clearInterval(playInterval);
        let speed = 101 - document.getElementById('speedRange').value;
        playInterval = setInterval(stepForward, speed * 10);
    }
});

document.getElementById('btnTour').addEventListener('click', extractTour);

// Hero Canvas
const heroCanvas = document.getElementById('bdpHeroCanvas');
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
        
        hctx.fillStyle = `rgba(168, 85, 247, ${Math.abs(Math.sin(t))*0.1 + 0.05})`;
        hctx.font = '900 120px "Fira Code"';
        hctx.textAlign = 'center';
        hctx.textBaseline = 'middle';
        
        // Draw a giant bitmask fading in and out
        let bits = ['1','0','1','1','0'];
        for(let i=0; i<5; i++) {
            if(Math.sin(t*2 + i) > 0) bits[i] = '1';
        }
        hctx.fillText(bits.join(''), cx, cy);
        
        t += 0.02;
        requestAnimationFrame(animateHero);
    }
    animateHero();
}

// Init
initHeroCanvas();
// Wait briefly for layout to settle before sizing canvases
setTimeout(() => {
    resizeCanvases();
    generateGraph('random');
    initDP();
}, 100);
