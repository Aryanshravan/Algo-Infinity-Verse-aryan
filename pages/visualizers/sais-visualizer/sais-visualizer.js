const U=document.getElementById.bind(document);
const C=document.createElement.bind(document);

let S = "";
let N = 0;
let types = []; 
let lms = [];
let buckets = [];
let SA = [];
let writes = 0;

let state={
    mode: 'IDLE',
    idx: 0,
    playing: false,
    timer: null,
    stepGen: null,
    bucketHeads: [],
    bucketTails: []
};

function initHeroCanvas(){
    const c=U('saisHeroCanvas');
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
        t+=0.03;
        
        ctx.font = 'bold 16px "Fira Code"';
        ctx.textAlign = 'center';
        
        for(let i=0; i<20; i++){
            let x = (c.width/20)*i + 15;
            let y = c.height/2 + Math.sin(t+i*0.5)*30;
            let col = i%3===0 ? '#10b981' : (i%2===0 ? '#f43f5e' : '#3b82f6');
            ctx.fillStyle = col;
            ctx.fillText(String.fromCharCode(97+(i%26)), x, y);
        }
        requestAnimationFrame(draw);
    }
    draw();
}

function logMsg(msg, type='info'){
    const lc=U('saisLogConsole');
    if(!lc)return;
    let d=C('div');
    d.className='log-entry '+type;
    d.innerHTML=msg;
    lc.appendChild(d);
    lc.scrollTop=lc.scrollHeight;
}

function updateStatus(msg, cls=''){
    const sb = U('saisStatus');
    const sm = U('statusMsg');
    if(!sb || !sm) return;
    sb.className = 'sais-status-bar ' + cls;
    sm.innerHTML = msg;
}

function calcBuckets(){
    let count = {};
    for(let i=0; i<N; i++){
        let c = S[i];
        count[c] = (count[c]||0)+1;
    }
    let keys = Object.keys(count).sort();
    let sum = 0;
    buckets = [];
    keys.forEach(k=>{
        buckets.push({ char: k, start: sum, end: sum+count[k]-1, count: count[k] });
        sum += count[k];
    });
}

function drawStringGrid(activeIndex = -1){
    const grid = U('stringGrid');
    grid.innerHTML = '';
    for(let i=0; i<N; i++){
        let col = C('div');
        col.className = 'char-col' + (i===activeIndex ? ' active' : '');
        
        let idx = C('div');
        idx.className = 'char-idx';
        idx.innerText = i;
        
        let box = C('div');
        box.className = 'char-box';
        box.innerText = S[i];
        
        let tLbl = C('div');
        tLbl.className = 'type-lbl ' + (types[i]||'');
        tLbl.innerText = types[i]||'';
        
        col.appendChild(idx);
        col.appendChild(box);
        col.appendChild(tLbl);
        grid.appendChild(col);
    }
}

function drawSABuckets(activeSAIndex = -1){
    const hdr = U('bucketHeaders');
    const saGrid = U('saArray');
    hdr.innerHTML = '';
    saGrid.innerHTML = '';
    
    let bucketPtr = 0;
    for(let i=0; i<N; i++){
        while(bucketPtr < buckets.length && i > buckets[bucketPtr].end) bucketPtr++;
        
        let b = buckets[bucketPtr];
        let col = C('div');
        col.className = 'sa-cell-col';
        
        let cell = C('div');
        cell.className = 'sa-cell';
        if(SA[i] !== -1){
            cell.classList.add('filled');
            cell.classList.add(types[SA[i]]);
            cell.innerText = SA[i];
        }
        if(i === activeSAIndex) cell.classList.add('active');
        
        col.appendChild(cell);
        
        let idx = C('div');
        idx.className = 'char-idx';
        idx.innerText = i;
        col.appendChild(idx);
        
        saGrid.appendChild(col);
    }
    
    buckets.forEach(b=>{
        let w = (b.count * 38) - 2; 
        let d = C('div');
        d.className = 'bucket-hdr';
        d.style.width = w + 'px';
        d.style.borderColor = '#10b981';
        d.innerText = `'${b.char}'`;
        hdr.appendChild(d);
    });
}

function drawAll(stIdx=-1, saIdx=-1){
    drawStringGrid(stIdx);
    drawSABuckets(saIdx);
    U('statWrites').innerText = writes;
}

function* saisGenerator(){
    logMsg('<span class="log-entry phase">Phase 1: S/L Classification</span>');
    updateStatus('Classifying S-type and L-type suffixes right-to-left.', 'warn');
    
    types = new Array(N).fill('');
    types[N-1] = 'S';
    types[N-2] = 'L'; 
    drawAll(N-1); yield;
    drawAll(N-2); yield;
    
    for(let i = N-2; i >= 0; i--){
        if(S[i] < S[i+1]){
            types[i] = 'S';
        } else if(S[i] > S[i+1]){
            types[i] = 'L';
        } else {
            types[i] = types[i+1];
        }
        
        if(i > 0 && types[i] === 'S' && types[i-1] === 'L'){
            types[i] = 'LMS';
        }
        
        drawAll(i);
        logMsg(`Pos ${i} ('${S[i]}') classified as ${types[i]}`, types[i].toLowerCase()+'type');
        yield;
    }
    types[N-1] = 'LMS';
    drawAll();
    
    lms = [];
    for(let i=1; i<N; i++){
        if(types[i] === 'LMS') lms.push(i);
    }
    
    U('lmsBox').style.display = 'block';
    let lmsHtml = lms.map(idx => `<div class="lms-item">${idx}: ${S.substring(idx, Math.min(idx+3, N))}...</div>`).join('');
    U('lmsList').innerHTML = lmsHtml;
    
    logMsg('<span class="log-entry phase">Phase 2: Bucket Allocation</span>');
    updateStatus('Counting characters and allocating buckets.');
    calcBuckets();
    U('bucketStatus').innerText = 'Buckets Allocated';
    drawAll(); yield;
    
    logMsg('<span class="log-entry phase">Phase 3: Place LMS</span>');
    updateStatus('Placing LMS suffixes at the TAILS of their buckets.');
    
    state.bucketTails = new Array(256).fill(0);
    buckets.forEach(b => state.bucketTails[b.char.charCodeAt(0)] = b.end);
    
    for(let i=0; i<lms.length; i++){
        let p = lms[i];
        let cCode = S.charCodeAt(p);
        let tail = state.bucketTails[cCode];
        SA[tail] = p;
        state.bucketTails[cCode]--;
        writes++;
        drawAll(p, tail);
        logMsg(`Placed LMS pos ${p} into tail of '${S[p]}' bucket (SA[${tail}])`, 'lms');
        yield;
    }
    
    logMsg('<span class="log-entry phase">Phase 4: Induce L-types</span>');
    updateStatus('Left-to-Right pass inducing L-types at the HEADS of buckets.');
    
    state.bucketHeads = new Array(256).fill(0);
    buckets.forEach(b => state.bucketHeads[b.char.charCodeAt(0)] = b.start);
    
    U('indAnimBox').style.display = 'block';
    
    for(let i=0; i<N; i++){
        if(SA[i] <= 0) continue;
        let p = SA[i] - 1;
        if(types[p] === 'L'){
            let cCode = S.charCodeAt(p);
            let head = state.bucketHeads[cCode];
            SA[head] = p;
            state.bucketHeads[cCode]++;
            writes++;
            
            U('indSource').innerText = `SA[${i}]=${SA[i]}`;
            U('indDest').innerText = `SA[${head}]=${p}`;
            
            drawAll(p, head);
            logMsg(`Induced L-type ${p} from SA[${i}] into SA[${head}]`, 'ltype');
            yield;
        }
    }
    
    logMsg('<span class="log-entry phase">Phase 5: Induce S-types</span>');
    updateStatus('Right-to-Left pass inducing S-types at the TAILS of buckets.', 'warn');
    
    state.bucketTails = new Array(256).fill(0);
    buckets.forEach(b => state.bucketTails[b.char.charCodeAt(0)] = b.end);
    
    for(let i=N-1; i>=0; i--){
        if(SA[i] <= 0) continue;
        let p = SA[i] - 1;
        if(types[p] === 'S' || types[p] === 'LMS'){
            let cCode = S.charCodeAt(p);
            let tail = state.bucketTails[cCode];
            SA[tail] = p;
            state.bucketTails[cCode]--;
            writes++;
            
            U('indSource').innerText = `SA[${i}]=${SA[i]}`;
            U('indDest').innerText = `SA[${tail}]=${p}`;
            
            drawAll(p, tail);
            logMsg(`Induced S-type ${p} from SA[${i}] into SA[${tail}]`, 'stype');
            yield;
        }
    }
    
    U('indAnimBox').style.display = 'none';
    updateStatus('SA-IS Complete! The Suffix Array is fully built in O(n).', 'done');
    logMsg('<b>Algorithm Finished!</b>', 'done');
    state.mode = 'DONE';
    drawAll();
}

function resetAll(){
    let sel = U('selString').value;
    if(sel === 'custom'){
        S = U('customInput').value;
        if(!S.endsWith('$')) S += '$';
    } else {
        S = sel;
    }
    
    N = S.length;
    SA = new Array(N).fill(-1);
    types = [];
    lms = [];
    buckets = [];
    writes = 0;
    
    U('statLen').innerText = N;
    U('statWrites').innerText = '0';
    let theoCmp = Math.floor(N * Math.log2(N) * 2);
    U('statCmp').innerText = theoCmp;
    U('statDepth').innerText = '0 (Simulated)';
    
    U('lmsBox').style.display = 'none';
    U('indAnimBox').style.display = 'none';
    U('bucketStatus').innerText = 'Awaiting classification';
    U('saisLogConsole').innerHTML = '';
    
    clearTimeout(state.timer);
    state.playing = false;
    U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
    
    state.mode = 'RUNNING';
    state.stepGen = saisGenerator();
    
    updateStatus('Ready. S string initialized.');
    drawAll();
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
        state.timer = setTimeout(runLoop, speed*2);
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
