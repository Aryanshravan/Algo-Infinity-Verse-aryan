const U=document.getElementById.bind(document);
const C=document.createElement.bind(document);

let N = 341n;
let R = 0n;
let D = 0n;
let currA = 2n;
let rounds = 0;
let fpp = 1.0;
let seq = [];
let seqIdx = 0;
let mrTimer = null;

const PRIMES = {
    'prime1': 1009n,
    'prime2': 8191n,
    'comp1': 1000n,
    'pseudo1': 341n,
    'pseudo2': 561n
};

function initHeroCanvas(){
    const c=U('primeHeroCanvas');
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
        t+=0.01;
        
        ctx.font = '20px "Fira Code"';
        ctx.textAlign = 'center';
        
        for(let i=0; i<15; i++){
            for(let j=0; j<10; j++){
                let x = c.width*0.1 + i*80 + Math.sin(t+i+j)*20;
                let y = c.height*0.1 + j*60 + Math.cos(t+i+j)*20;
                
                let isP = (i+j)%7 === 0;
                if(isP){
                    ctx.fillStyle = `rgba(16,185,129,${0.2 + Math.sin(t*3+i)*0.1})`;
                    ctx.fillText('P', x, y);
                } else {
                    ctx.fillStyle = `rgba(255,255,255,0.05)`;
                    ctx.fillText('C', x, y);
                }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
}

function modPow(b, e, m) {
    if (m === 1n) return 0n;
    let r = 1n;
    b = b % m;
    while (e > 0n) {
        if (e % 2n === 1n) r = (r * b) % m;
        e = e / 2n;
        b = (b * b) % m;
    }
    return r;
}

function isPrime(n) {
    if (n <= 1n) return false;
    if (n <= 3n) return true;
    if (n % 2n === 0n || n % 3n === 0n) return false;
    for (let i = 5n; i * i <= n; i += 6n) {
        if (n % i === 0n || n % (i + 2n) === 0n) return false;
    }
    return true;
}

function updateStats(){
    U('statN').innerText = N.toString();
    U('statRounds').innerText = rounds;
    if(rounds === 0) {
        U('statProb').innerText = '100%';
    } else {
        U('statProb').innerText = `< 1/${4**rounds}`;
    }
    
    let truth = isPrime(N);
    U('statTruth').innerText = truth ? 'Prime' : 'Composite';
    U('statTruth').className = truth ? 'stat-val highlight' : 'stat-val highlight-danger';
}

function logMsg(msg, type='info'){
    const lc=U('mrLogConsole');
    if(!lc)return;
    let d=C('div');
    d.className='log-entry '+type;
    d.innerHTML=msg;
    lc.appendChild(d);
    lc.scrollTop=lc.scrollHeight;
}

function resetAll(){
    let sel = U('selNumber').value;
    if(sel === 'custom'){
        N = BigInt(U('customInput').value.replace(/[^0-9]/g, '') || '341');
    } else {
        N = PRIMES[sel];
    }
    
    R = 0n; D = 0n; rounds = 0; fpp = 1.0;
    clearTimeout(mrTimer);
    
    U('decompText').innerText = 'Waiting for decomposition...';
    U('mr-r').innerText = 'r';
    U('mr-d').innerText = 'd';
    U('sequenceGrid').innerHTML = '';
    U('mrVerdictBox').innerHTML = '<i class="fas fa-question-circle"></i> Awaiting witness test...';
    U('mrVerdictBox').className = 'mr-verdict';
    U('mrLogConsole').innerHTML = '';
    U('btnWitness').disabled = true;
    
    U('currWitnessBadge').innerText = 'Current Witness a = ?';
    
    updateStats();
    
    U('primeStatus').className = 'prime-status-bar';
    U('statusMsg').innerText = `Selected N = ${N}. Step 1: Click Decompose.`;
    
    U('aksResult').style.display = 'none';
}

function doDecompose(){
    if(N <= 2n){
        logMsg('Number must be > 2 for Miller-Rabin.', 'comp');
        return;
    }
    if(N % 2n === 0n){
        logMsg(`N=${N} is EVEN. It is trivially composite.`, 'comp');
        U('primeStatus').className = 'prime-status-bar danger';
        U('statusMsg').innerText = `Even number detected.`;
        return;
    }
    
    let n1 = N - 1n;
    D = n1;
    R = 0n;
    while(D % 2n === 0n){
        D /= 2n;
        R++;
    }
    
    U('mr-r').innerText = R.toString();
    U('mr-d').innerText = D.toString();
    U('decompText').innerText = `N-1 = ${n1} = 2^${R} × ${D}`;
    
    logMsg(`Decomposed N-1 (${n1}) into 2^${R} × ${D}.`);
    
    U('btnWitness').disabled = false;
    U('primeStatus').className = 'prime-status-bar';
    U('statusMsg').innerText = `Decomposition complete. Step 2: Select a witness and test.`;
}

function testWitness(){
    U('btnWitness').disabled = true;
    
    let selA = U('selWitness').value;
    if(selA === 'random'){
        let min = 2n;
        let max = N - 2n;
        if(max < min) currA = 2n;
        else {
            let rnd = BigInt(Math.floor(Math.random() * Number(max - min + 1n)));
            currA = min + rnd;
        }
    } else {
        currA = BigInt(selA);
        if(currA >= N-1n){
            currA = 2n;
        }
    }
    
    U('currWitnessBadge').innerText = `Current Witness a = ${currA}`;
    U('sequenceGrid').innerHTML = '';
    U('mrVerdictBox').className = 'mr-verdict';
    U('mrVerdictBox').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Computing squarings...';
    
    logMsg(`--- Starting Round ${rounds+1} with Witness a = ${currA} ---`);
    
    seq = [];
    let x = modPow(currA, D, N);
    seq.push({exp: D, val: x, p: 0});
    
    for(let i = 1n; i <= R; i++){
        x = modPow(x, 2n, N);
        seq.push({exp: D * (2n**i), val: x, p: i});
    }
    
    seqIdx = 0;
    animateSequence();
}

function animateSequence(){
    let grid = U('sequenceGrid');
    
    if(seqIdx >= seq.length){
        evalVerdict();
        return;
    }
    
    let item = seq[seqIdx];
    let d = C('div');
    d.className = 'sq-block';
    
    let pTxt = seqIdx===0 ? `a^d` : `a^(d·2^${item.p})`;
    d.innerHTML = `<span class="sq-lbl">${pTxt} mod N</span><span class="sq-val">${item.val}</span>`;
    
    if(item.val === 1n && seqIdx === 0){
        d.classList.add('hit1');
        grid.appendChild(d);
        logMsg(`a^d ≡ 1 mod N. Condition passed early.`, 'prime');
        evalVerdict(true);
        return;
    }
    if(item.val === N - 1n && seqIdx < seq.length - 1){
        d.classList.add('hit-1');
        grid.appendChild(d);
        logMsg(`Found a^(d·2^${item.p}) ≡ -1 mod N. Condition passed.`, 'prime');
        evalVerdict(true);
        return;
    }
    
    grid.appendChild(d);
    logMsg(`Computed ${pTxt} ≡ ${item.val}`);
    
    seqIdx++;
    mrTimer = setTimeout(animateSequence, 600);
}

function evalVerdict(passed = false){
    rounds++;
    updateStats();
    let vb = U('mrVerdictBox');
    
    if(passed){
        vb.className = 'mr-verdict prime';
        vb.innerHTML = '<i class="fas fa-check-circle"></i> Probably Prime (Strong Pseudoprime)';
        logMsg(`Witness ${currA} declares N is PROBABLY PRIME.`, 'prime');
        U('primeStatus').className = 'prime-status-bar';
        U('statusMsg').innerText = `Passed witness ${currA}. Run more rounds to reduce false positive probability.`;
    } else {
        vb.className = 'mr-verdict comp';
        vb.innerHTML = '<i class="fas fa-times-circle"></i> Definitely Composite (Witness found)';
        logMsg(`Witness ${currA} proves N is COMPOSITE.`, 'comp');
        U('primeStatus').className = 'prime-status-bar danger';
        U('statusMsg').innerText = `Composite proven by witness ${currA}! Absolute certainty reached.`;
    }
    
    U('btnWitness').disabled = false;
}

function runAKS(){
    let resBox = U('aksResult');
    resBox.style.display = 'block';
    resBox.className = 'aks-result';
    resBox.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running AKS Check (Simulated)...';
    
    setTimeout(() => {
        let truth = isPrime(N);
        if(truth){
            resBox.className = 'aks-result prime';
            resBox.innerHTML = `Polynomial expansion (X+a)ⁿ ≡ Xⁿ+a holds. <br/> <b>N is Deterministically PRIME.</b>`;
        } else {
            resBox.className = 'aks-result comp';
            resBox.innerHTML = `Polynomial expansion failed congruency. <br/> <b>N is Deterministically COMPOSITE.</b>`;
        }
    }, 1500);
}

U('selNumber').addEventListener('change', (e) => {
    U('customInput').style.display = e.target.value === 'custom' ? 'inline-block' : 'none';
    resetAll();
});
U('btnReset').addEventListener('click', resetAll);
U('btnDecompose').addEventListener('click', doDecompose);
U('btnWitness').addEventListener('click', testWitness);
U('btnAKS').addEventListener('click', runAKS);
U('customInput').addEventListener('keyup', (e)=>{
    if(e.key==='Enter') resetAll();
});

document.addEventListener('DOMContentLoaded', ()=>{
    initHeroCanvas();
    resetAll();
});
