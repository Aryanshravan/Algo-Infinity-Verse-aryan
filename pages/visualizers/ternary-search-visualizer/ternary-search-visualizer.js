let canvas = document.getElementById('tsCanvas');
let ctx = canvas.getContext('2d');
let animFrame = null;
let isPlaying = false;

let funcs = {
    'unimodal': (x) => -Math.pow(x - 63.4, 2) + 3000,
    'trap': (x) => 1500 * Math.sin(x/8) - Math.pow(x-50, 2)*2 + 2000,
    'app': (x) => {
        let costA = 2 * Math.pow(x, 2);
        let costB = Math.pow(100 - x, 2) + 1500;
        return -Math.max(costA, costB);
    }
};

let currentFuncStr = 'unimodal';
let f = funcs[currentFuncStr];

let L = 0;
let R = 100;
let m1 = 0;
let m2 = 0;
let iter = 0;

let stepPhase = 0;

function updateStatus(msg, type='normal') {
    const el = document.getElementById('tsStatus');
    el.innerHTML = msg;
    el.className = 'ts-status';
    if(type === 'good') el.classList.add('good');
    if(type === 'warn') el.classList.add('warn');
    if(type === 'err') el.classList.add('err');
}

function updateStats() {
    document.getElementById('valIter').innerText = iter;
    document.getElementById('valRange').innerText = (R - L).toFixed(6);
}

function resetSearch() {
    currentFuncStr = document.getElementById('funcSelect').value;
    f = funcs[currentFuncStr];
    L = 0;
    R = 100;
    iter = 0;
    stepPhase = 0;
    isPlaying = false;
    document.getElementById('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Search';
    updateStats();
    updateStatus(`Reset. Range [0, 100]. Mode: ${currentFuncStr}`);
    drawStatic();
}

window.addEventListener('resize', () => {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    drawStatic();
});

function drawStatic(m1_eval = false, m2_eval = false, discardL = null, discardR = null) {
    let w = canvas.parentElement.clientWidth;
    let h = canvas.parentElement.clientHeight;
    if(canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);
    
    let yMin = 9999999, yMax = -9999999;
    for(let i=0; i<=100; i+=0.5) {
        let v = f(i);
        if(v < yMin) yMin = v;
        if(v > yMax) yMax = v;
    }
    
    let yPad = (yMax - yMin) * 0.2;
    yMin -= yPad;
    yMax += yPad;
    
    function getX(val) { return (val / 100) * w; }
    function getY(val) { return h - ((val - yMin) / (yMax - yMin)) * h; }
    
    ctx.fillStyle = 'rgba(6,182,212,0.1)';
    ctx.fillRect(getX(L), 0, getX(R) - getX(L), h);
    
    if (discardL !== null && discardR !== null) {
        ctx.fillStyle = 'rgba(239,68,68,0.2)';
        ctx.fillRect(getX(discardL), 0, getX(discardR) - getX(discardL), h);
    }
    
    ctx.beginPath();
    for(let i=0; i<=100; i+=0.5) {
        let px = getX(i);
        let py = getY(f(i));
        if(i===0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(128,128,128,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    ctx.moveTo(getX(L), 0); ctx.lineTo(getX(L), h);
    ctx.moveTo(getX(R), 0); ctx.lineTo(getX(R), h);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Fira Code"';
    ctx.textAlign = 'center';
    ctx.fillText('L', getX(L), h - 10);
    ctx.fillText('R', getX(R), h - 10);
    
    if(stepPhase > 0 || m1_eval) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(getX(m1), getY(f(m1)));
        ctx.lineTo(getX(m1), h);
        ctx.stroke();
        
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(getX(m1), getY(f(m1)), 6, 0, 2*Math.PI);
        ctx.fill();
        ctx.fillText('m1', getX(m1), h - 25);
    }
    if(stepPhase > 0 || m2_eval) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(getX(m2), getY(f(m2)));
        ctx.lineTo(getX(m2), h);
        ctx.stroke();
        
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(getX(m2), getY(f(m2)), 6, 0, 2*Math.PI);
        ctx.fill();
        ctx.fillText('m2', getX(m2), h - 25);
    }
}

function doStep() {
    if((R - L) < 0.000001) {
        updateStatus(`Converged at x = ${L.toFixed(6)}`, 'good');
        isPlaying = false;
        document.getElementById('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Search';
        return;
    }
    
    if(stepPhase === 0) {
        m1 = L + (R - L) / 3;
        m2 = R - (R - L) / 3;
        drawStatic(true, true);
        
        let msg = `Probing m1 = ${m1.toFixed(2)}, m2 = ${m2.toFixed(2)}. `;
        let f1 = f(m1);
        let f2 = f(m2);
        if(f1 < f2) msg += `f(m1) < f(m2). Peak cannot be in [L, m1].`;
        else msg += `f(m1) >= f(m2). Peak cannot be in [m2, R].`;
        updateStatus(msg, 'info');
        
        stepPhase = 1;
        if(isPlaying) setTimeout(doStep, 800);
    } else {
        let f1 = f(m1);
        let f2 = f(m2);
        
        let dl, dr;
        if(f1 < f2) {
            dl = L; dr = m1;
            L = m1;
        } else {
            dl = m2; dr = R;
            R = m2;
        }
        
        drawStatic(false, false, dl, dr);
        iter++;
        updateStats();
        
        if(currentFuncStr === 'trap' && R < 40 && iter > 2) {
            updateStatus('TRAP: Found the wrong local maximum due to non-unimodal rippling!', 'err');
        } else {
            updateStatus(`Discarded [${dl.toFixed(2)}, ${dr.toFixed(2)}]. Range is now exactly 2/3 of previous size.`);
        }
        
        stepPhase = 0;
        if(isPlaying) setTimeout(doStep, 800);
    }
}

document.getElementById('funcSelect').addEventListener('change', resetSearch);
document.getElementById('btnReset').addEventListener('click', resetSearch);
document.getElementById('btnStep').addEventListener('click', () => {
    isPlaying = false;
    document.getElementById('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Search';
    doStep();
});
document.getElementById('btnPlay').addEventListener('click', () => {
    if(isPlaying) {
        isPlaying = false;
        document.getElementById('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Search';
    } else {
        isPlaying = true;
        document.getElementById('btnPlay').innerHTML = '<i class="fas fa-pause"></i> Pause';
        doStep();
    }
});

const heroCanvas = document.getElementById('tsHeroCanvas');
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
        let w = heroCanvas.parentElement.clientWidth;
        let h = heroCanvas.parentElement.clientHeight;
        if(heroCanvas.width !== w || heroCanvas.height !== h) {
            heroCanvas.width = w;
            heroCanvas.height = h;
        }
        hctx.clearRect(0, 0, w, h);
        
        hctx.beginPath();
        for(let i=0; i<w; i+=5) {
            let y = h/2 - Math.sin(i/w * Math.PI) * 100;
            if(i===0) hctx.moveTo(i, y);
            else hctx.lineTo(i, y);
        }
        hctx.strokeStyle = 'rgba(168,85,247,0.3)';
        hctx.lineWidth = 4;
        hctx.stroke();
        
        let p1 = w/3 + Math.sin(t*0.02)*20;
        let p2 = 2*w/3 - Math.sin(t*0.02)*20;
        
        let y1 = h/2 - Math.sin(p1/w * Math.PI) * 100;
        let y2 = h/2 - Math.sin(p2/w * Math.PI) * 100;
        
        hctx.beginPath();
        hctx.arc(p1, y1, 8, 0, 2*Math.PI);
        hctx.fillStyle = '#06b6d4';
        hctx.fill();
        
        hctx.fillStyle = '#f59e0b';
        hctx.beginPath();
        hctx.arc(p2, y2, 8, 0, 2*Math.PI);
        hctx.fillStyle = '#a855f7';
        hctx.fill();
        
        t += 1;
        requestAnimationFrame(animateHero);
    }
    animateHero();
}

initHeroCanvas();
setTimeout(() => {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    resetSearch();
}, 100);
