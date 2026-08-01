// ============================================
// SKIP LIST VISUALIZERS (DETERMINISTIC vs RANDOMIZED)
// ============================================

const MAX_LEVEL = 10;
let randList = []; // Array of nodes (sorted) for rendering. A node: {val, height}
let detList = [];
let insertQueue = [];
let currentStep = 0;
let isPlaying = false;
let playInterval = null;

// Track history of heights for the chart
let randHeightHistory = [];
let detHeightHistory = [];
let globalRandMaxHeight = 1;
let globalDetMaxHeight = 1;

let cRand = document.getElementById('randCanvas');
let cDet = document.getElementById('detCanvas');
let cChart = document.getElementById('chartCanvas');

function resizeCanvases() {
    [cRand, cDet, cChart].forEach(c => {
        c.width = c.parentElement.clientWidth;
        c.height = c.parentElement.clientHeight;
    });
    drawAll();
}
window.addEventListener('resize', resizeCanvases);

function updateStatus(msg, type='normal') {
    const el = document.getElementById('dslStatus');
    el.innerHTML = msg;
    el.className = 'dsl-status';
    if(type === 'good') el.classList.add('good');
    if(type === 'error') el.classList.add('error');
}

// Logical structure for Deterministic Skip List to check invariant
// Since nodes are maintained in an ordered array, we can check gaps directly on the array!
function enforceDeterministicInvariant() {
    let changed = false;
    let maxLvl = 1;
    // We check level by level, starting from checking height-1 nodes between height-2 nodes.
    // In our array `detList`, `node.height` is the actual height.
    for(let lvl = 1; lvl < MAX_LEVEL; lvl++) {
        let gapCount = 0;
        let gapStartIndex = 0;
        
        for(let i=0; i <= detList.length; i++) {
            let isBoundary = (i === detList.length) || (detList[i].height > lvl);
            if(isBoundary) {
                if(gapCount === 4) {
                    // We found exactly 4 nodes of height exactly `lvl` with no taller nodes between them!
                    // Let's promote the 2nd one. (index: gapStartIndex + 1)
                    // Wait, gap nodes are those with height >= lvl.
                    // Actually, let's collect all nodes in this gap that have height EXACTLY `lvl`.
                    let gapNodes = [];
                    for(let k=gapStartIndex; k<i; k++) {
                        if(detList[k].height === lvl) gapNodes.push(detList[k]);
                    }
                    if(gapNodes.length === 4) {
                        gapNodes[1].height++; // Promote!
                        changed = true;
                        break;
                    }
                }
                gapCount = 0;
                gapStartIndex = i + 1;
            } else if (detList[i].height === lvl) {
                gapCount++;
            }
        }
        if(changed) break; // restart the whole process to ensure structural integrity
    }
    
    // Compute max height
    detList.forEach(n => maxLvl = Math.max(maxLvl, n.height));
    globalDetMaxHeight = maxLvl;
    
    return changed;
}

function processDeterministicInsert(val) {
    let node = {val: val, height: 1, newlyPromoted: true};
    
    // Ordered insert
    let idx = 0;
    while(idx < detList.length && detList[idx].val < val) idx++;
    detList.splice(idx, 0, node);
    
    // Cascade rebalance
    let changes = 0;
    while(enforceDeterministicInvariant()) {
        changes++;
    }
    return changes;
}

function processRandomizedInsert(val, forceUnlucky) {
    let h = 1;
    let flips = [];
    
    if(forceUnlucky) {
        // Unlucky streak: immediate tails (height 1)
        flips.push('T');
    } else {
        while(Math.random() > 0.5 && h < MAX_LEVEL) {
            h++;
            flips.push('H');
        }
        flips.push('T');
    }
    
    let node = {val: val, height: h, newlyPromoted: true};
    
    // Ordered insert
    let idx = 0;
    while(idx < randList.length && randList[idx].val < val) idx++;
    randList.splice(idx, 0, node);
    
    globalRandMaxHeight = Math.max(globalRandMaxHeight, h);
    return {h, flips};
}

// Stepping logic
function resetState() {
    if (isPlaying) togglePlay();

    let rawStr = document.getElementById('insertSeq').value;
    insertQueue = rawStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    currentStep = 0;
    randList = [];
    detList = [];
    randHeightHistory = [];
    detHeightHistory = [];
    globalRandMaxHeight = 1;
    globalDetMaxHeight = 1;
    
    document.getElementById('btnStep').disabled = false;
    document.getElementById('btnPlay').disabled = false;
    
    updateStatus(`Ready to insert ${insertQueue.length} elements.`);
    updateStats();
    drawAll();
}

function stepForward() {
    if(currentStep >= insertQueue.length) {
        updateStatus('All elements inserted.', 'good');
        document.getElementById('btnStep').disabled = true;
        if(isPlaying) togglePlay();
        return;
    }
    
    let val = insertQueue[currentStep];
    let unlucky = document.getElementById('chkUnlucky').checked;
    
    // Clear highlights
    randList.forEach(n => n.newlyPromoted = false);
    detList.forEach(n => n.newlyPromoted = false);
    
    let randRes = processRandomizedInsert(val, unlucky);
    let detChanges = processDeterministicInsert(val);
    
    randHeightHistory.push(globalRandMaxHeight);
    detHeightHistory.push(globalDetMaxHeight);
    
    let statMsg = `Inserted <strong>${val}</strong>.<br>`;
    if(unlucky) statMsg += `Randomized: Forced Tails (Height 1). `;
    else statMsg += `Randomized coin flips: ${randRes.flips.join(', ')} -> Height ${randRes.h}. `;
    
    if(detChanges > 0) statMsg += `Deterministic: Cascaded ${detChanges} promotions to maintain invariant!`;
    else statMsg += `Deterministic: No invariant violations (gap <= 3).`;
    
    updateStatus(statMsg, detChanges > 0 ? 'good' : 'normal');
    
    currentStep++;
    updateStats();
    drawAll();
}

function updateStats() {
    document.getElementById('rndStat').innerText = `Count: ${randList.length} | Max Depth: ${globalRandMaxHeight}`;
    document.getElementById('detStat').innerText = `Count: ${detList.length} | Max Depth: ${globalDetMaxHeight}`;
}

// Drawing Logic
function drawSkipList(ctx, list, w, h, isDeterministic) {
    ctx.clearRect(0, 0, w, h);
    if(list.length === 0) return;
    
    let padX = 30;
    let padY = 20;
    let availableW = w - 2*padX;
    
    // Determine cell dimensions
    let cellW = Math.min(40, availableW / list.length);
    let gap = (availableW - cellW * list.length) / Math.max(1, list.length - 1);
    
    let maxH = isDeterministic ? globalDetMaxHeight : globalRandMaxHeight;
    let cellH = (h - 2*padY - 20) / maxH;
    
    // Base Y is the bottom of the canvas
    let baseY = h - padY;
    
    // Draw horizontal wires for levels
    for(let lvl=0; lvl<maxH; lvl++) {
        let y = baseY - lvl * cellH - cellH/2;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(w - padX, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Draw nodes
    for(let i=0; i<list.length; i++) {
        let node = list[i];
        let cx = padX + i * (cellW + gap) + cellW/2;
        
        // Draw vertical pillar
        let topY = baseY - node.height * cellH;
        let pillarW = cellW * 0.8;
        
        ctx.fillStyle = node.newlyPromoted ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(cx - pillarW/2, topY, pillarW, node.height * cellH);
        
        ctx.strokeStyle = node.newlyPromoted ? '#22c55e' : (isDeterministic ? '#06b6d4' : '#f59e0b');
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - pillarW/2, topY, pillarW, node.height * cellH);
        
        // Draw links (dots at each level)
        for(let lvl=0; lvl<node.height; lvl++) {
            let y = baseY - lvl * cellH - cellH/2;
            ctx.beginPath();
            ctx.arc(cx, y, 4, 0, 2*Math.PI);
            ctx.fillStyle = isDeterministic ? '#06b6d4' : '#f59e0b';
            ctx.fill();
        }
        
        // Value text at bottom
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Fira Code"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.val, cx, baseY + 4);
    }
}

function drawChart() {
    let ctx = cChart.getContext('2d');
    let w = cChart.width;
    let h = cChart.height;
    ctx.clearRect(0, 0, w, h);
    
    if(randHeightHistory.length === 0) return;
    
    let pad = 30;
    let maxH = Math.max(MAX_LEVEL, Math.max(...randHeightHistory), Math.max(...detHeightHistory));
    
    let stepX = (w - 2*pad) / Math.max(1, randHeightHistory.length - 1);
    let scaleY = (h - 2*pad) / maxH;
    
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    for(let i=0; i<=maxH; i+=2) {
        let y = h - pad - i * scaleY;
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px "Fira Code"';
        ctx.textAlign = 'right';
        ctx.fillText(i, pad - 5, y + 3);
    }
    ctx.stroke();
    
    // Plot Rand
    ctx.beginPath();
    for(let i=0; i<randHeightHistory.length; i++) {
        let x = pad + i * stepX;
        let y = h - pad - randHeightHistory[i] * scaleY;
        if(i===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Plot Det
    ctx.beginPath();
    for(let i=0; i<detHeightHistory.length; i++) {
        let x = pad + i * stepX;
        let y = h - pad - detHeightHistory[i] * scaleY;
        if(i===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawAll() {
    drawSkipList(cRand.getContext('2d'), randList, cRand.width, cRand.height, false);
    drawSkipList(cDet.getContext('2d'), detList, cDet.width, cDet.height, true);
    drawChart();
}


// Controls
document.getElementById('btnReset').addEventListener('click', resetState);
document.getElementById('btnStep').addEventListener('click', stepForward);

function togglePlay() {
    isPlaying = !isPlaying;
    let btn = document.getElementById('btnPlay');
    
    if(isPlaying) {
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        let speed = 101 - document.getElementById('speedRange').value;
        playInterval = setInterval(stepForward, speed * 10);
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Auto Play Full Sequence';
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

// Hero Animation
const heroCanvas = document.getElementById('dslHeroCanvas');
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
        
        let nodes = 15;
        let spacing = 40;
        let startX = cx - (nodes * spacing)/2;
        
        for(let lvl=0; lvl<4; lvl++) {
            hctx.beginPath();
            hctx.moveTo(startX, cy - lvl*20);
            hctx.lineTo(startX + nodes*spacing, cy - lvl*20);
            hctx.strokeStyle = 'rgba(6,182,212,0.1)';
            hctx.stroke();
        }
        
        for(let i=0; i<nodes; i++) {
            let ht = (i%4 === 2) ? 3 : ((i%2 === 1) ? 2 : 1);
            let x = startX + i*spacing;
            hctx.fillStyle = `rgba(6,182,212,${Math.sin(t*0.05 + i)*0.3 + 0.1})`;
            hctx.fillRect(x - 10, cy - ht*20, 20, ht*20);
            hctx.strokeStyle = 'rgba(6,182,212,0.5)';
            hctx.strokeRect(x - 10, cy - ht*20, 20, ht*20);
        }
        
        t += 1;
        requestAnimationFrame(animateHero);
    }
    animateHero();
}

// Init
initHeroCanvas();
setTimeout(() => {
    resizeCanvases();
    resetState();
    stepForward();
}, 100);
