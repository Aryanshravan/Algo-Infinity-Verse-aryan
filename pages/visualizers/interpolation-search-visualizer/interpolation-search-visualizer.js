const U = document.getElementById.bind(document);
const C = document.createElement.bind(document);

let arr = [];
let targetVal = 0;
let bsState = { lo: 0, hi: 0, mid: -1, found: -1, done: false, probes: 0 };
let isState = { lo: 0, hi: 0, pos: -1, found: -1, done: false, probes: 0 };
let genBs = null;
let genIs = null;
let animFrame = null;
let isRunning = false;

function initHeroCanvas(){
    const c = U('heroCanvas');
    if(!c) return;
    const ctx = c.getContext('2d');
    let t = 0;
    
    function resize(){
        c.width = c.parentElement.clientWidth;
        c.height = c.parentElement.clientHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    
    function draw(){
        ctx.clearRect(0,0,c.width,c.height);
        t += 0.05;
        
        ctx.beginPath();
        for(let i=0; i<c.width; i+=5){
            let y = c.height/2 + Math.sin(i*0.01 + t)*50;
            if(i===0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }
        ctx.strokeStyle = 'rgba(245,158,11,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        for(let i=0; i<c.width; i+=5){
            let y = c.height/2 + Math.sin(i*0.02 - t)*30;
            if(i===0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }
        ctx.strokeStyle = 'rgba(59,130,246,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        requestAnimationFrame(draw);
    }
    draw();
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
    const sb = U('isvStatus');
    const sm = U('statusMsg');
    if(!sb || !sm) return;
    sb.className = 'isv-status-bar ' + cls;
    sm.innerHTML = msg;
}

function getCanvasDims(id){
    const cvs = U(id);
    return { w: cvs.clientWidth, h: cvs.clientHeight };
}

function generateArray(){
    let size = parseInt(U('sliderSize').value);
    let dist = U('selDistribution').value;
    arr = [];
    
    if(dist === 'uniform'){
        for(let i=0; i<size; i++) arr.push(i * 10 + Math.floor(Math.random()*5));
    } else if(dist === 'exponential'){
        for(let i=0; i<size; i++) arr.push(Math.floor(Math.pow(1.05, i) * 10));
    } else if(dist === 'logarithmic'){
        for(let i=0; i<size; i++) arr.push(Math.floor(Math.log(i+2) * 1000));
    }
    
    let targetIdx = parseInt(U('sliderTarget').value);
    if(targetIdx >= size) targetIdx = size - 1;
    targetVal = arr[targetIdx];
    
    U('statTargetVal').innerText = targetVal;
    
    bsState = { lo: 0, hi: size-1, mid: -1, found: -1, done: false, probes: 0 };
    isState = { lo: 0, hi: size-1, pos: -1, found: -1, done: false, probes: 0 };
    
    U('statBsProbes').innerText = '0';
    U('statIsProbes').innerText = '0';
    
    drawCanvases();
}

function* binarySearchGen(){
    let size = arr.length;
    bsState.lo = 0;
    bsState.hi = size - 1;
    bsState.probes = 0;
    
    while(bsState.lo <= bsState.hi){
        bsState.mid = Math.floor((bsState.lo + bsState.hi) / 2);
        bsState.probes++;
        U('statBsProbes').innerText = bsState.probes;
        
        logMsg(`[Binary] Probe ${bsState.probes}: Check index ${bsState.mid}, val=${arr[bsState.mid]}`, 'bs');
        yield;
        
        if(arr[bsState.mid] === targetVal){
            bsState.found = bsState.mid;
            logMsg(`[Binary] Target found at index ${bsState.mid} in ${bsState.probes} probes.`, 'success');
            bsState.done = true;
            return;
        } else if(arr[bsState.mid] < targetVal){
            bsState.lo = bsState.mid + 1;
        } else {
            bsState.hi = bsState.mid - 1;
        }
        yield;
    }
    bsState.done = true;
    logMsg(`[Binary] Target not found.`, 'warn');
}

function* interpolationSearchGen(){
    let size = arr.length;
    isState.lo = 0;
    isState.hi = size - 1;
    isState.probes = 0;
    
    while(isState.lo <= isState.hi && targetVal >= arr[isState.lo] && targetVal <= arr[isState.hi]){
        if(isState.lo === isState.hi){
            if(arr[isState.lo] === targetVal){
                isState.pos = isState.lo;
                isState.probes++;
                U('statIsProbes').innerText = isState.probes;
                isState.found = isState.lo;
                logMsg(`[Interpolation] Target found at index ${isState.lo} in ${isState.probes} probes.`, 'success');
                isState.done = true;
                return;
            }
            break;
        }
        
        let p1 = targetVal - arr[isState.lo];
        let p2 = arr[isState.hi] - arr[isState.lo];
        let p3 = isState.hi - isState.lo;
        
        if (p2 === 0) {
            // All values in [lo, hi] are identical; avoid dividing by zero.
            if (arr[isState.lo] !== targetVal) {
                isState.done = true;
                logMsg(`[Interpolation] Target not found.`, 'warn');
                return;
            }
            isState.pos = isState.lo;
        } else {
            isState.pos = isState.lo + Math.floor((p1 / p2) * p3);
        }
        isState.probes++;
        U('statIsProbes').innerText = isState.probes;
        
        logMsg(`[Interpolation] Probe ${isState.probes}: Interpolated index ${isState.pos}, val=${arr[isState.pos]}`, 'is');
        yield;
        
        if(arr[isState.pos] === targetVal){
            isState.found = isState.pos;
            logMsg(`[Interpolation] Target found at index ${isState.pos} in ${isState.probes} probes.`, 'success');
            isState.done = true;
            return;
        } else if(arr[isState.pos] < targetVal){
            isState.lo = isState.pos + 1;
        } else {
            isState.hi = isState.pos - 1;
        }
        yield;
    }
    isState.done = true;
    logMsg(`[Interpolation] Target not found.`, 'warn');
}

function drawCanvases(){
    const bsCvs = U('bsCanvas');
    const isCvs = U('isCanvas');
    
    let bsDims = getCanvasDims('bsCanvasWrap');
    bsCvs.width = bsDims.w;
    bsCvs.height = bsDims.h;
    
    let isDims = getCanvasDims('isCanvasWrap');
    isCvs.width = isDims.w;
    isCvs.height = isDims.h;
    
    let bctx = bsCvs.getContext('2d');
    let ictx = isCvs.getContext('2d');
    
    let n = arr.length;
    let maxVal = Math.max(...arr);
    
    bctx.clearRect(0,0,bsDims.w,bsDims.h);
    let barW = bsDims.w / n;
    
    for(let i=0; i<n; i++){
        let barH = (arr[i] / maxVal) * (bsDims.h - 30);
        let x = i * barW;
        let y = bsDims.h - barH;
        
        if(i >= bsState.lo && i <= bsState.hi) bctx.fillStyle = 'rgba(59,130,246,0.3)';
        else bctx.fillStyle = 'rgba(255,255,255,0.05)';
        
        if(i === bsState.mid) bctx.fillStyle = '#3b82f6';
        if(i === bsState.found) bctx.fillStyle = '#10b981';
        
        bctx.fillRect(x, y, barW - 1, barH);
    }
    
    if(bsState.lo <= bsState.hi && !bsState.done){
        let loX = bsState.lo * barW;
        let hiX = bsState.hi * barW + barW;
        bctx.strokeStyle = 'rgba(255,255,255,0.5)';
        bctx.lineWidth = 2;
        bctx.beginPath();
        bctx.moveTo(loX, bsDims.h-5); bctx.lineTo(hiX, bsDims.h-5);
        bctx.stroke();
    }
    
    ictx.clearRect(0,0,isDims.w,isDims.h);
    let dx = isDims.w / n;
    
    ictx.beginPath();
    ictx.moveTo(0, isDims.h - (arr[0]/maxVal)*isDims.h);
    for(let i=1; i<n; i++){
        ictx.lineTo(i*dx, isDims.h - (arr[i]/maxVal)*isDims.h);
    }
    ictx.strokeStyle = 'rgba(255,255,255,0.2)';
    ictx.lineWidth = 2;
    ictx.stroke();
    
    let ty = isDims.h - (targetVal/maxVal)*isDims.h;
    ictx.beginPath();
    ictx.moveTo(0, ty);
    ictx.lineTo(isDims.w, ty);
    ictx.strokeStyle = 'rgba(16,185,129,0.5)';
    ictx.setLineDash([5,5]);
    ictx.stroke();
    ictx.setLineDash([]);
    
    if(isState.lo <= isState.hi && !isState.done && isState.lo < n && isState.hi < n){
        let x1 = isState.lo * dx;
        let y1 = isDims.h - (arr[isState.lo]/maxVal)*isDims.h;
        let x2 = isState.hi * dx;
        let y2 = isDims.h - (arr[isState.hi]/maxVal)*isDims.h;
        
        ictx.beginPath();
        ictx.moveTo(x1, y1);
        ictx.lineTo(x2, y2);
        ictx.strokeStyle = '#f59e0b';
        ictx.lineWidth = 2;
        ictx.stroke();
        
        ictx.beginPath();
        ictx.arc(x1, y1, 4, 0, Math.PI*2);
        ictx.arc(x2, y2, 4, 0, Math.PI*2);
        ictx.fillStyle = '#f59e0b';
        ictx.fill();
        
        if(isState.pos >= 0){
            let px = isState.pos * dx;
            let py = isDims.h - (arr[isState.pos]/maxVal)*isDims.h;
            ictx.beginPath();
            ictx.arc(px, py, 6, 0, Math.PI*2);
            ictx.fillStyle = '#ef4444';
            ictx.fill();
            
            ictx.beginPath();
            ictx.moveTo(px, ty);
            ictx.lineTo(px, py);
            ictx.strokeStyle = '#ef4444';
            ictx.setLineDash([2,2]);
            ictx.stroke();
            ictx.setLineDash([]);
        }
    }
    
    if(isState.found >= 0){
        let fx = isState.found * dx;
        let fy = isDims.h - (arr[isState.found]/maxVal)*isDims.h;
        ictx.beginPath();
        ictx.arc(fx, fy, 8, 0, Math.PI*2);
        ictx.fillStyle = '#10b981';
        ictx.fill();
    }
}

let raceToken = 0;

function stopRace(){
    isRunning = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    raceToken++;
}

function animLoop(token){
    if(!isRunning || token !== raceToken) return;
    
    let bsAlive = false;
    let isAlive = false;
    
    if(genBs && !bsState.done){
        let res = genBs.next();
        if(!res.done) bsAlive = true;
    }
    if(genIs && !isState.done){
        let res = genIs.next();
        if(!res.done) isAlive = true;
    }
    
    drawCanvases();
    
    if(bsAlive || isAlive){
        let speed = 105 - parseInt(U('sliderSpeed').value);
        setTimeout(()=>{ if (token === raceToken) animFrame = requestAnimationFrame(()=>animLoop(token)); }, speed * 10);
    } else {
        isRunning = false;
        
        if(isState.probes > bsState.probes){
            updateStatus(`Race finished! Binary Search won. Interpolation search degraded to O(n) due to skew.`, 'warn');
        } else if(isState.probes < bsState.probes){
            updateStatus(`Race finished! Interpolation Search won easily on uniform data.`, 'done');
        } else {
            updateStatus(`Race finished! It was a tie.`);
        }
    }
}

U('btnRace').addEventListener('click', ()=>{
    stopRace();
    U('logConsole').innerHTML = '';
    generateArray();
    updateStatus('Race in progress...');
    
    genBs = binarySearchGen();
    genIs = interpolationSearchGen();
    
    isRunning = true;
    const token = raceToken;
    animLoop(token);
});

U('sliderSize').addEventListener('input', (e)=>{
    stopRace();
    U('lblSize').innerText = e.target.value;
    U('sliderTarget').max = e.target.value - 1;
    if(parseInt(U('sliderTarget').value) >= e.target.value){
        U('sliderTarget').value = e.target.value - 1;
        U('lblTarget').innerText = e.target.value - 1;
    }
    generateArray();
});

U('sliderTarget').addEventListener('input', (e)=>{
    stopRace();
    U('lblTarget').innerText = e.target.value;
    generateArray();
});

U('selDistribution').addEventListener('change', ()=>{
    stopRace();
    generateArray();
});

window.addEventListener('resize', drawCanvases);

document.addEventListener('DOMContentLoaded', ()=>{
    initHeroCanvas();
    generateArray();
});
