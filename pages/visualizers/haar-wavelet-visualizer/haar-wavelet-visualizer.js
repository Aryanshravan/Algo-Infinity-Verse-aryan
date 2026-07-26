// ============================================
// HAAR WAVELET TRANSFORM VISUALIZER
// ============================================

const N = 16;
let originalSignal = new Float32Array(N);
let currentSignal = new Float32Array(N);
let currentLevel = 0; // 0 to 4 (since log2(16)=4)
const MAX_LEVEL = Math.log2(N);

let sigCanvas = document.getElementById('signalCanvas');
let wavCanvas = document.getElementById('waveletCanvas');
let sigCtx = sigCanvas.getContext('2d');
let wavCtx = wavCanvas.getContext('2d');

function updateStatus(msg, type='normal') {
    const el = document.getElementById('hwvStatus');
    el.innerHTML = msg;
    el.className = 'hwv-status';
    if(type === 'good') el.classList.add('good');
    if(type === 'error') el.classList.add('error');
}

function getThreshold() { return parseInt(document.getElementById('threshRange').value); }
document.getElementById('threshRange').addEventListener('input', function() {
    document.getElementById('threshLabel').textContent = this.value;
});

function resizeCanvases() {
    [sigCanvas, wavCanvas].forEach(c => {
        c.width = c.parentElement.clientWidth;
        c.height = c.parentElement.clientHeight;
    });
    drawSignal();
    drawWavelet();
}
window.addEventListener('resize', resizeCanvases);

// Presets
function loadPreset(type) {
    for(let i=0; i<N; i++) {
        if(type === 'sine') {
            originalSignal[i] = Math.sin(i * 2 * Math.PI / N) * 40;
        } else if(type === 'step') {
            originalSignal[i] = (i >= N/2) ? 40 : -40;
        } else if(type === 'spiky') {
            let val = Math.sin(i * 2 * Math.PI / N) * 20;
            if(i % 4 === 0) val += 30;
            if(i % 5 === 0) val -= 20;
            originalSignal[i] = val;
        } else if(type === 'random') {
            originalSignal[i] = (Math.random() * 80) - 40;
        }
    }
    // Deep copy
    currentSignal.set(originalSignal);
    currentLevel = 0;
    
    document.getElementById('statLevel').innerText = currentLevel;
    calculateStats();
    
    resizeCanvases();
    updateStatus('Signal loaded. Showing Level 0.');
}

document.getElementById('btnInit').addEventListener('click', () => {
    loadPreset(document.getElementById('presetSelect').value);
});

// Haar Transform Logic
function fwdStep() {
    if(currentLevel >= MAX_LEVEL) {
        updateStatus('Maximum decomposition level reached.', 'error');
        return;
    }
    
    let L = N / Math.pow(2, currentLevel); // Length of current approximation segment
    let nextArr = new Float32Array(N);
    nextArr.set(currentSignal); // copy untouched details
    
    for(let i = 0; i < L/2; i++) {
        let left = currentSignal[2*i];
        let right = currentSignal[2*i + 1];
        let avg = (left + right) / 2;
        let diff = (left - right) / 2;
        
        nextArr[i] = avg;           // Approx goes to first half
        nextArr[L/2 + i] = diff;    // Detail goes to second half
    }
    
    currentSignal.set(nextArr);
    currentLevel++;
    
    document.getElementById('statLevel').innerText = currentLevel;
    updateStatus(`Decomposed Level ${currentLevel}. The first ${L/2} elements are now Averages.`, 'good');
    
    calculateStats();
    drawSignal();
    drawWavelet();
}

function invStep() {
    if(currentLevel <= 0) {
        updateStatus('Signal is already fully reconstructed.', 'error');
        return;
    }
    
    let L = N / Math.pow(2, currentLevel - 1); // Length of the segment we are reconstructing to
    let nextArr = new Float32Array(N);
    nextArr.set(currentSignal);
    
    for(let i = 0; i < L/2; i++) {
        let avg = currentSignal[i];
        let diff = currentSignal[L/2 + i];
        
        nextArr[2*i] = avg + diff;
        nextArr[2*i + 1] = avg - diff;
    }
    
    currentSignal.set(nextArr);
    currentLevel--;
    
    document.getElementById('statLevel').innerText = currentLevel;
    updateStatus(`Reconstructed down to Level ${currentLevel}.`, 'normal');
    
    calculateStats();
    drawSignal();
    drawWavelet();
}

// Button Events
document.getElementById('btnFwdStep').addEventListener('click', fwdStep);

document.getElementById('btnFwdAll').addEventListener('click', () => {
    let steps = MAX_LEVEL - currentLevel;
    for(let i=0; i<steps; i++) fwdStep();
    updateStatus('Full Haar Transform applied. Array is fully in the Wavelet Domain.', 'good');
});

document.getElementById('btnInverse').addEventListener('click', () => {
    let steps = currentLevel;
    for(let i=0; i<steps; i++) invStep();
    if(steps > 0) updateStatus('Fully reconstructed back to original Time Domain.', 'good');
});

document.getElementById('btnCompress').addEventListener('click', () => {
    // To compress properly, we must fully decompose, threshold, then reconstruct.
    let thresh = getThreshold();
    
    // Auto-decompose to full if not already
    while(currentLevel < MAX_LEVEL) fwdStep();
    
    // Threshold details (everything except index 0, which is the global average)
    for(let i=1; i<N; i++) {
        if(Math.abs(currentSignal[i]) < thresh) {
            currentSignal[i] = 0; // Zero it out!
        }
    }
    
    drawWavelet();
    calculateStats();
    
    // Reconstruct
    while(currentLevel > 0) invStep();
    
    updateStatus(`Compressed using threshold ${thresh}. Details below ${thresh} were discarded!`, 'good');
});

// Stats Calculation
function calculateStats() {
    let nonZero = 0;
    for(let i=0; i<N; i++) {
        if(Math.abs(currentSignal[i]) > 0.001) nonZero++;
    }
    document.getElementById('statCoeffs').innerText = `${nonZero} / 16`;
    
    if(currentLevel === 0) {
        // Compute MSE
        let mse = 0;
        for(let i=0; i<N; i++) {
            let err = currentSignal[i] - originalSignal[i];
            mse += err * err;
        }
        mse /= N;
        document.getElementById('statMSE').innerText = mse.toFixed(2);
    } else {
        document.getElementById('statMSE').innerText = '-';
    }
}

// Drawing Logic
function drawSignal() {
    let w = sigCanvas.width;
    let h = sigCanvas.height;
    sigCtx.clearRect(0, 0, w, h);
    
    let midY = h / 2;
    let barW = (w - 40) / N;
    
    // Draw grid
    sigCtx.beginPath();
    sigCtx.moveTo(20, midY);
    sigCtx.lineTo(w - 20, midY);
    sigCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    sigCtx.lineWidth = 1;
    sigCtx.stroke();
    
    // Draw Original Signal (Faded)
    for(let i=0; i<N; i++) {
        let x = 20 + i * barW + barW*0.1;
        let bw = barW * 0.8;
        let bh = (originalSignal[i] / 50) * (midY - 20); // Scale
        
        sigCtx.fillStyle = 'rgba(255,255,255,0.1)';
        sigCtx.fillRect(x, midY, bw, -bh);
    }
    
    // Draw Current Signal if we are at level 0 (Time domain)
    if(currentLevel === 0) {
        for(let i=0; i<N; i++) {
            let x = 20 + i * barW + barW*0.1;
            let bw = barW * 0.8;
            let bh = (currentSignal[i] / 50) * (midY - 20);
            
            // Reconstructed color
            let err = Math.abs(currentSignal[i] - originalSignal[i]);
            sigCtx.fillStyle = err > 0.1 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(6, 182, 212, 0.8)';
            sigCtx.fillRect(x, midY, bw, -bh);
            
            // Outline
            sigCtx.strokeStyle = '#06b6d4';
            sigCtx.lineWidth = 1;
            sigCtx.strokeRect(x, midY, bw, -bh);
        }
        
        // Draw Line overlay
        sigCtx.beginPath();
        for(let i=0; i<N; i++) {
            let x = 20 + i * barW + barW/2;
            let bh = (currentSignal[i] / 50) * (midY - 20);
            if(i===0) sigCtx.moveTo(x, midY - bh);
            else sigCtx.lineTo(x, midY - bh);
        }
        sigCtx.strokeStyle = '#22c55e';
        sigCtx.lineWidth = 2;
        sigCtx.stroke();
    }
}

function drawWavelet() {
    let w = wavCanvas.width;
    let h = wavCanvas.height;
    wavCtx.clearRect(0, 0, w, h);
    
    // Draw cells representing the 1D array
    let padX = 20;
    let cellW = (w - padX*2) / N;
    let cellH = 50;
    let startY = h/2 - cellH/2;
    
    let approxEnd = N / Math.pow(2, currentLevel);
    
    for(let i=0; i<N; i++) {
        let x = padX + i * cellW;
        
        // Coloring based on Approx vs Detail
        let isApprox = i < approxEnd;
        let isZero = Math.abs(currentSignal[i]) < 0.001;
        
        wavCtx.fillStyle = isZero ? 'rgba(0,0,0,0.5)' : (isApprox ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)');
        wavCtx.fillRect(x, startY, cellW - 2, cellH);
        
        wavCtx.strokeStyle = isApprox ? '#06b6d4' : '#f59e0b';
        if(isZero) wavCtx.strokeStyle = '#444';
        wavCtx.lineWidth = 1;
        wavCtx.strokeRect(x, startY, cellW - 2, cellH);
        
        // Value Text
        let val = currentSignal[i].toFixed(1);
        if(isZero) val = "0";
        wavCtx.fillStyle = isZero ? '#666' : '#fff';
        wavCtx.font = '600 11px "Fira Code"';
        wavCtx.textAlign = 'center';
        wavCtx.textBaseline = 'middle';
        wavCtx.fillText(val, x + cellW/2, startY + cellH/2);
        
        // Label
        wavCtx.fillStyle = 'rgba(255,255,255,0.4)';
        wavCtx.font = '10px "Fira Code"';
        wavCtx.fillText(i, x + cellW/2, startY + cellH + 15);
    }
    
    // Bracket labels above
    if(currentLevel > 0) {
        wavCtx.fillStyle = '#06b6d4';
        wavCtx.font = '600 12px "Orbitron"';
        wavCtx.textAlign = 'center';
        let approxW = cellW * approxEnd;
        wavCtx.fillText('Averages', padX + approxW/2, startY - 15);
        
        wavCtx.fillStyle = '#f59e0b';
        if(approxEnd < N) {
            wavCtx.fillText('Details', padX + approxW + (w-padX*2-approxW)/2, startY - 15);
        }
    }
}

// Hero Canvas
const heroCanvas = document.getElementById('hwvHeroCanvas');
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
        
        // Draw some sine waves superimposed
        hctx.beginPath();
        for(let i=0; i<heroCanvas.width; i+=5) {
            let y = Math.sin(i*0.02 + t)*20 + Math.sin(i*0.05 + t*1.5)*10;
            if(i===0) hctx.moveTo(i, heroCanvas.height/2 + y);
            else hctx.lineTo(i, heroCanvas.height/2 + y);
        }
        hctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        hctx.lineWidth = 2;
        hctx.stroke();
        
        // Draw step-like wavelet blocks over it
        let bw = 80;
        for(let i=0; i<heroCanvas.width; i+=bw) {
            let y = Math.sin(i*0.02 + t)*20;
            hctx.fillStyle = (i/bw)%2===0 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(245, 158, 11, 0.15)';
            hctx.fillRect(i, heroCanvas.height/2 + y, bw, (i/bw)%2===0 ? -30 : 30);
        }
        
        t += 0.05;
        requestAnimationFrame(animateHero);
    }
    animateHero();
}

initHeroCanvas();
resizeCanvases(); // Explicitly force dimensions before drawing
loadPreset('spiky');
