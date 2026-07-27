const U = document.getElementById.bind(document);
const C = document.createElement.bind(document);

let S = "";
let N = 0;
let rotations = [];
let bwtOut = "";
let alphabet = [];
let mtfOut = [];
let rleOut = [];

let state = {
    mode: 'IDLE',
    playing: false,
    timer: null,
    stepGen: null
};

function initHeroCanvas(){
    const c=U('bwtHeroCanvas');
    if(!c)return;
    const ctx=c.getContext('2d');
    let t=0;
    function resize(){
        c.width=c.parentElement.clientWidth;
        c.height=c.parentElement.clientHeight;
    }
    window.addEventListener('resize',resize);
    resize();
    function draw(){
        ctx.clearRect(0,0,c.width,c.height);
        t+=0.02;
        ctx.font = 'bold 24px "Fira Code"';
        ctx.textAlign = 'center';
        for(let i=0; i<15; i++){
            let x = (c.width/15)*i + 20;
            let y = c.height/2 + Math.sin(t+i*0.3)*40;
            ctx.fillStyle = i%4===0 ? '#d946ef' : 'rgba(255,255,255,0.1)';
            ctx.fillText('0', x, y);
        }
        requestAnimationFrame(draw);
    }
    draw();
}

function logMsg(msg, type='info'){
    const lc=U('bwtLogConsole');
    if(!lc)return;
    let d=C('div');
    d.className='log-entry '+type;
    d.innerHTML=msg;
    lc.appendChild(d);
    lc.scrollTop=lc.scrollHeight;
}

function updateStatus(msg, cls=''){
    const sb = U('bwtStatus');
    const sm = U('statusMsg');
    if(!sb || !sm) return;
    sb.className = 'bwt-status-bar ' + cls;
    sm.innerHTML = msg;
}

function drawMatrix(activeRow = -1){
    const mx = U('bwtMatrix');
    mx.innerHTML = '';
    
    rotations.forEach((r, i) => {
        let row = C('div');
        row.className = 'matrix-row' + (i === activeRow ? ' active' : '');
        
        for(let j=0; j<N; j++){
            let cell = C('div');
            cell.className = 'matrix-cell';
            if(j === 0) cell.classList.add('first-col');
            if(j === N-1) cell.classList.add('last-col');
            cell.innerText = r[j];
            row.appendChild(cell);
        }
        mx.appendChild(row);
    });
}

function drawAlphabet(activeIdx = -1, moving = false){
    const list = U('mtfList');
    list.innerHTML = '';
    
    alphabet.forEach((ch, idx) => {
        let item = C('div');
        item.className = 'mtf-item' + (idx === activeIdx ? (moving ? ' moving' : ' active') : '');
        
        let iSpan = C('span');
        iSpan.className = 'mtf-idx';
        iSpan.innerText = idx;
        
        let cSpan = C('span');
        cSpan.className = 'mtf-char';
        cSpan.innerText = ch;
        
        item.appendChild(iSpan);
        item.appendChild(cSpan);
        list.appendChild(item);
    });
}

function drawMtfOutput(activeOut = -1){
    const out = U('mtfOutput');
    out.innerHTML = '';
    
    mtfOut.forEach((val, i) => {
        let cell = C('div');
        cell.className = 'mtf-out-cell' + (val === 0 ? ' zero' : '');
        cell.innerText = val;
        if(i === activeOut) cell.style.transform = 'scale(1.2)';
        out.appendChild(cell);
    });
}

function drawRleOutput(){
    const out = U('rleOutput');
    out.innerHTML = '';
    
    let totalLen = 0;
    
    rleOut.forEach(pair => {
        let p = C('div');
        p.className = 'rle-pair' + (pair.count > 1 ? ' squashed' : '');
        
        let v = C('div');
        v.className = 'rle-val';
        v.innerText = pair.val;
        
        let c = C('div');
        c.className = 'rle-count';
        c.innerText = `x${pair.count}`;
        
        p.appendChild(v);
        p.appendChild(c);
        out.appendChild(p);
        
        totalLen += 2;
    });
    
    U('statComp').innerText = totalLen + ' tokens';
    let ratio = (N / (totalLen||1)).toFixed(2);
    U('statRatio').innerText = ratio + 'x';
}

function* pipelineGenerator(){
    logMsg('<span class="log-entry phase">Stage 1: Burrows-Wheeler Transform</span>');
    updateStatus('Generating all cyclic rotations of the input string.');
    
    rotations = [];
    for(let i=0; i<N; i++){
        let r = S.substring(i) + S.substring(0, i);
        rotations.push(r);
    }
    
    drawMatrix(); yield;
    
    updateStatus('Sorting rotations lexicographically (alphabetically).');
    rotations.sort();
    
    drawMatrix(); yield;
    
    updateStatus('Extracting the last column (L) to form the BWT output.', 'warn');
    bwtOut = "";
    
    for(let i=0; i<N; i++){
        bwtOut += rotations[i][N-1];
        drawMatrix(i);
        U('bwtOutputStr').innerText = bwtOut;
        if(i%2===0) yield;
    }
    
    drawMatrix();
    logMsg(`BWT Output generated. Notice the grouped characters!`, 'info');
    yield;
    
    logMsg('<span class="log-entry phase">Stage 2: Move-to-Front (MTF)</span>');
    updateStatus('Initializing alphabet list with unique characters from input.');
    
    let unique = [...new Set(S.split(''))].sort();
    alphabet = unique;
    mtfOut = [];
    
    drawAlphabet(); yield;
    
    for(let i=0; i<N; i++){
        let char = bwtOut[i];
        let idx = alphabet.indexOf(char);
        
        updateStatus(`Encoding '${char}'. Found at index ${idx}.`);
        drawAlphabet(idx); yield;
        
        mtfOut.push(idx);
        drawMtfOutput(i);
        logMsg(`MTF: Output index ${idx} for char '${char}'`, 'mtf');
        yield;
        
        if(idx > 0){
            updateStatus(`Moving '${char}' to the front (index 0).`, 'warn');
            alphabet.splice(idx, 1);
            alphabet.unshift(char);
            drawAlphabet(0, true); yield;
        }
    }
    
    drawAlphabet();
    logMsg(`MTF Complete. Output contains many runs of zeros.`, 'mtf');
    yield;
    
    logMsg('<span class="log-entry phase">Stage 3: Run-Length Encoding (RLE)</span>');
    updateStatus('Compressing consecutive identical numbers into (value, count) pairs.');
    
    rleOut = [];
    if(mtfOut.length > 0){
        let currVal = mtfOut[0];
        let count = 1;
        
        for(let i=1; i<=mtfOut.length; i++){
            if(i < mtfOut.length && mtfOut[i] === currVal){
                count++;
            } else {
                rleOut.push({val: currVal, count: count});
                if(count > 1) logMsg(`RLE: Squashed ${count} copies of '${currVal}'`, 'rle');
                if(i < mtfOut.length){
                    currVal = mtfOut[i];
                    count = 1;
                }
            }
        }
    }
    
    drawRleOutput();
    updateStatus('BWT + MTF + RLE Pipeline Complete!', 'done');
    logMsg('<b>Pipeline Finished! Lossless compression achieved.</b>', 'done');
    state.mode = 'DONE';
}

function resetAll(){
    let sel = U('selString').value;
    if(sel === 'custom'){
        S = U('customInput').value;
        if(!S.includes('^')) S += '^';
    } else {
        S = sel;
    }
    
    N = S.length;
    rotations = [];
    bwtOut = "";
    alphabet = [];
    mtfOut = [];
    rleOut = [];
    
    U('statOrig').innerText = N + ' chars';
    U('statComp').innerText = '0 tokens';
    U('statRatio').innerText = '1.00x';
    
    U('bwtMatrix').innerHTML = '';
    U('bwtOutputStr').innerText = '';
    U('mtfList').innerHTML = '';
    U('mtfOutput').innerHTML = '';
    U('rleOutput').innerHTML = '';
    U('bwtLogConsole').innerHTML = '';
    
    clearTimeout(state.timer);
    state.playing = false;
    U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
    
    state.mode = 'RUNNING';
    state.stepGen = pipelineGenerator();
    
    updateStatus('Ready. Input string loaded.');
}

function runLoop(){
    if(state.mode === 'DONE'){
        state.playing = false;
        U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
        return;
    }
    
    if(state.stepGen){
        let res = state.stepGen.next();
        if(res.done) state.mode = 'DONE';
    }
    
    if(state.playing){
        let speed = 101 - parseInt(U('speedSlider').value);
        state.timer = setTimeout(runLoop, speed*5);
    }
}

U('btnStep').addEventListener('click', ()=>{
    state.playing = false;
    clearTimeout(state.timer);
    U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
    if(state.stepGen && state.mode !== 'DONE') state.stepGen.next();
});

U('btnPlay').addEventListener('click', ()=>{
    if(state.playing){
        state.playing = false;
        clearTimeout(state.timer);
        U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
    }else{
        if(state.mode === 'DONE') resetAll();
        state.playing = true;
        U('btnPlay').innerHTML = '<i class="fas fa-pause"></i> Pause';
        runLoop();
    }
});

U('selString').addEventListener('change', (e) => {
    U('customInput').style.display = e.target.value === 'custom' ? 'inline-block' : 'none';
    resetAll();
});
U('btnReset').addEventListener('click', resetAll);
U('customInput').addEventListener('keyup', (e)=>{
    if(e.key==='Enter') resetAll();
});

document.addEventListener('DOMContentLoaded', ()=>{
    initHeroCanvas();
    resetAll();
});
