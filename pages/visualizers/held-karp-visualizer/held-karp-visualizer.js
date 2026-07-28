const U = document.getElementById.bind(document);
const C = document.createElement.bind(document);

let nodes = [];
let dist = [];
let bestCost = Infinity;
let bestPath = [];
let currBfPath = [];
let currHkPath = [];
let bfOps = 0;
let hkOps = 0;
let isRunning = false;
let animFrame = null;
let genSolver = null;
let activeSolver = '';

function fact(n){
    let res = 1;
    for(let i=2; i<=n; i++) res *= i;
    return res;
}

function initHeroCanvas(){
    const c = U('heroCanvas');
    if(!c) return;
    const ctx = c.getContext('2d');
    let t = 0;
    function resize(){ c.width = c.parentElement.clientWidth; c.height = c.parentElement.clientHeight; }
    window.addEventListener('resize', resize);
    resize();
    function draw(){
        ctx.clearRect(0,0,c.width,c.height);
        t += 0.02;
        let cx = c.width/2, cy = c.height/2;
        for(let i=0; i<15; i++){
            let a = t + i*Math.PI*2/15;
            let r = 50 + Math.sin(t*2 + i)*20;
            let x = cx + Math.cos(a)*r;
            let y = cy + Math.sin(a)*r;
            ctx.fillStyle = '#10b981';
            ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
            for(let j=0; j<15; j++){
                if(i===j) continue;
                let a2 = t + j*Math.PI*2/15;
                let r2 = 50 + Math.sin(t*2 + j)*20;
                let x2 = cx + Math.cos(a2)*r2;
                let y2 = cy + Math.sin(a2)*r2;
                ctx.strokeStyle = 'rgba(139,92,246,0.05)';
                ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x2,y2); ctx.stroke();
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
}

function initChart(){
    const ctx = U('complexityChart').getContext('2d');
    let labels = [];
    let dFact = [];
    let dExp = [];
    
    for(let n=4; n<=15; n++){
        labels.push(n);
        dFact.push(fact(n));
        dExp.push(n * n * Math.pow(2, n));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Brute Force O(N!)',
                    data: dFact,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Held-Karp O(N²·2ᴺ)',
                    data: dExp,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'logarithmic',
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af', callback: function(value){ return Number(value).toExponential(); } }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af' },
                    title: { display: true, text: 'Number of Cities (N)', color: '#fff' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff', font: { family: 'Fira Code' } } }
            }
        }
    });
}

function logMsg(msg, type='info'){
    const lc = U('logConsole');
    if(!lc) return;
    let d = C('div');
    d.className = 'log-entry ' + type;
    d.innerHTML = msg;
    lc.appendChild(d);
    lc.scrollTop = lc.scrollHeight;
}

function updateStatus(msg, cls=''){
    const sb = U('hkStatus');
    const sm = U('statusMsg');
    if(!sb || !sm) return;
    sb.className = 'hk-status-bar ' + cls;
    sm.innerHTML = msg;
}

function getCanvasDims(id){
    const cvs = U(id);
    return { w: cvs.clientWidth, h: cvs.clientHeight };
}

function generateGraph(){
    let N = parseInt(U('sliderNodes').value);
    nodes = [];
    dist = Array(N).fill(0).map(()=>Array(N).fill(0));
    
    let dims = getCanvasDims('graphCanvasWrap');
    let pad = 40;
    
    for(let i=0; i<N; i++){
        nodes.push({
            x: pad + Math.random()*(dims.w - 2*pad),
            y: pad + Math.random()*(dims.h - 2*pad)
        });
    }
    
    for(let i=0; i<N; i++){
        for(let j=i+1; j<N; j++){
            let dx = nodes[i].x - nodes[j].x;
            let dy = nodes[i].y - nodes[j].y;
            let d = Math.floor(Math.sqrt(dx*dx + dy*dy));
            dist[i][j] = d;
            dist[j][i] = d;
        }
    }
    
    bestCost = Infinity;
    bestPath = [];
    currBfPath = [];
    currHkPath = [];
    bfOps = 0;
    hkOps = 0;
    U('statBfOps').innerText = '0';
    U('statHkOps').innerText = '0';
    U('statOptimal').innerText = '-';
    
    drawGraph();
}

function drawGraph(){
    const cvs = U('graphCanvas');
    let dims = getCanvasDims('graphCanvasWrap');
    cvs.width = dims.w;
    cvs.height = dims.h;
    let ctx = cvs.getContext('2d');
    let N = nodes.length;
    
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<N; i++){
        for(let j=i+1; j<N; j++){
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
            
            let mx = (nodes[i].x + nodes[j].x)/2;
            let my = (nodes[i].y + nodes[j].y)/2;
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '9px "Fira Code"';
            ctx.textAlign = 'center';
            ctx.fillText(dist[i][j], mx, my);
        }
    }
    
    let drawPath = activeSolver === 'bf' ? currBfPath : currHkPath;
    let pathColor = activeSolver === 'bf' ? '#ef4444' : '#8b5cf6';
    
    if(!isRunning && bestPath.length > 0){
        drawPath = bestPath;
        pathColor = '#10b981';
    }
    
    if(drawPath.length > 0){
        ctx.strokeStyle = pathColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(nodes[drawPath[0]].x, nodes[drawPath[0]].y);
        for(let i=1; i<drawPath.length; i++){
            ctx.lineTo(nodes[drawPath[i]].x, nodes[drawPath[i]].y);
        }
        ctx.stroke();
        
        for(let i=0; i<drawPath.length-1; i++){
            let n1 = drawPath[i], n2 = drawPath[i+1];
            let mx = (nodes[n1].x + nodes[n2].x)/2;
            let my = (nodes[n1].y + nodes[n2].y)/2;
            ctx.fillStyle = pathColor;
            ctx.font = 'bold 11px "Fira Code"';
            ctx.fillText(dist[n1][n2], mx, my - 8);
        }
    }
    
    for(let i=0; i<N; i++){
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 12, 0, Math.PI*2);
        ctx.fillStyle = i===0 ? '#f59e0b' : '#1f2937';
        ctx.fill();
        ctx.strokeStyle = pathColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Fira Code"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, nodes[i].x, nodes[i].y);
    }
}

function permute(arr){
    let res = [];
    function p(curr, rest){
        if(rest.length === 0) res.push(curr);
        for(let i=0; i<rest.length; i++){
            p(curr.concat([rest[i]]), rest.slice(0,i).concat(rest.slice(i+1)));
        }
    }
    p([], arr);
    return res;
}

function* bruteForceGen(){
    let N = nodes.length;
    let cities = [];
    for(let i=1; i<N; i++) cities.push(i);
    
    let allPerms = permute(cities);
    let batchSize = Math.max(1, Math.floor(allPerms.length / 100));
    
    logMsg(`[BruteForce] Starting generation of ${allPerms.length} permutations...`, 'bf');
    yield;
    
    for(let i=0; i<allPerms.length; i++){
        bfOps++;
        let p = allPerms[i];
        let path = [0, ...p, 0];
        currBfPath = path;
        
        let cost = 0;
        for(let j=0; j<path.length-1; j++) cost += dist[path[j]][path[j+1]];
        
        if(cost < bestCost){
            bestCost = cost;
            bestPath = [...path];
            logMsg(`[BruteForce] New best tour found: ${bestPath.join('→')} (Cost: ${bestCost})`, 'success');
        }
        
        if(i % batchSize === 0){
            U('statBfOps').innerText = bfOps;
            yield;
        }
    }
    U('statBfOps').innerText = bfOps;
    logMsg(`[BruteForce] Finished in ${bfOps} operations.`, 'bf');
}

function* heldKarpGen(){
    let N = nodes.length;
    let maxMask = 1 << N;
    let dp = Array(maxMask).fill(0).map(()=>Array(N).fill(Infinity));
    let parent = Array(maxMask).fill(0).map(()=>Array(N).fill(-1));
    
    let batchSize = Math.max(1, Math.floor((N * N * (1 << N)) / 100));
    
    logMsg(`[HeldKarp] Starting bitmask DP for ${maxMask} states...`, 'hk');
    yield;
    
    dp[1][0] = 0;
    
    for(let mask=1; mask<maxMask; mask+=2){
        for(let i=0; i<N; i++){
            if(!(mask & (1 << i))) continue;
            
            for(let j=0; j<N; j++){
                if(!(mask & (1 << j)) && i !== j){
                    hkOps++;
                    let nextMask = mask | (1 << j);
                    let ncost = dp[mask][i] + dist[i][j];
                    if(ncost < dp[nextMask][j]){
                        dp[nextMask][j] = ncost;
                        parent[nextMask][j] = i;
                    }
                    
                    if(hkOps % batchSize === 0){
                        currHkPath = reconstructTempPath(parent, nextMask, j);
                        U('statHkOps').innerText = hkOps;
                        yield;
                    }
                }
            }
        }
    }
    
    let finalMask = maxMask - 1;
    let minFinalCost = Infinity;
    let lastNode = -1;
    
    for(let i=1; i<N; i++){
        hkOps++;
        if(dp[finalMask][i] + dist[i][0] < minFinalCost){
            minFinalCost = dp[finalMask][i] + dist[i][0];
            lastNode = i;
        }
    }
    
    currHkPath = reconstructTempPath(parent, finalMask, lastNode);
    currHkPath.push(0);
    
    U('statHkOps').innerText = hkOps;
    logMsg(`[HeldKarp] Reconstructed optimal tour: ${currHkPath.join('→')} (Cost: ${minFinalCost})`, 'success');
    logMsg(`[HeldKarp] Finished in ${hkOps} operations.`, 'hk');
}

function reconstructTempPath(parent, mask, lastNode){
    let p = [];
    let curr = lastNode;
    let currMask = mask;
    while(curr !== -1){
        p.push(curr);
        let next = parent[currMask][curr];
        currMask = currMask ^ (1 << curr);
        curr = next;
    }
    return p.reverse();
}

function animLoop(){
    if(!isRunning) return;
    
    if(activeSolver === 'bf'){
        if(genSolver && !genSolver.next().done){
            drawGraph();
            let speed = 105 - parseInt(U('sliderSpeed').value);
            animFrame = requestAnimationFrame(()=>{ setTimeout(animLoop, speed); });
        } else {
            activeSolver = 'hk';
            genSolver = heldKarpGen();
            U('badgeBf').classList.remove('active');
            U('badgeHk').classList.add('active');
            animFrame = requestAnimationFrame(animLoop);
        }
    } else if(activeSolver === 'hk'){
        if(genSolver && !genSolver.next().done){
            drawGraph();
            let speed = 105 - parseInt(U('sliderSpeed').value);
            animFrame = requestAnimationFrame(()=>{ setTimeout(animLoop, speed); });
        } else {
            isRunning = false;
            U('badgeHk').classList.remove('active');
            drawGraph();
            U('statOptimal').innerText = bestCost;
            updateStatus(`Race complete! Brute Force: ${bfOps} ops. Held-Karp: ${hkOps} ops.`, 'done');
        }
    }
}

U('btnGenerate').addEventListener('click', ()=>{
    U('lblNodes').innerText = U('sliderNodes').value;
    U('logConsole').innerHTML = '';
    generateGraph();
    updateStatus(`Graph generated with ${U('sliderNodes').value} cities. Ready to race.`);
});

U('sliderNodes').addEventListener('change', ()=>{
    U('lblNodes').innerText = U('sliderNodes').value;
    U('btnGenerate').click();
});

U('btnRace').addEventListener('click', ()=>{
    isRunning = false;
    cancelAnimationFrame(animFrame);
    clearTimeout(animTimer);
    
    U('logConsole').innerHTML = '';
    bestCost = Infinity;
    bestPath = [];
    bfOps = 0;
    hkOps = 0;
    U('statOptimal').innerText = '-';
    
    activeSolver = 'bf';
    genSolver = bruteForceGen();
    U('badgeBf').classList.add('active');
    U('badgeHk').classList.remove('active');
    
    updateStatus(`Racing solvers... Brute Force running first...`, 'warn');
    isRunning = true;
    animLoop();
});

window.addEventListener('resize', drawGraph);

document.addEventListener('DOMContentLoaded', ()=>{
    initHeroCanvas();
    try {
        if(typeof Chart === 'function') initChart();
        else logMsg('[Chart] Chart.js failed to load; complexity chart disabled.', 'warn');
    } catch (err) {
        console.error('Chart init failed', err);
    }
    generateGraph();
});
