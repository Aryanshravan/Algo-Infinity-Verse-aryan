// ============================================
// CHINESE REMAINDER THEOREM VISUALIZER
// ============================================

let moduli = [3, 5, 7];
let N = 105;
let secretX = 52;
let remainders = [];
let clocks = [];

function gcd(a, b) {
    while(b !== 0) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

// Extended Euclidean Algorithm to find modular inverse
// Returns [g, x, y] such that a*x + m*y = g
function eea(a, m) {
    if(a === 0) return [m, 0, 1];
    let [g, x1, y1] = eea(m % a, a);
    let x = y1 - Math.floor(m / a) * x1;
    let y = x1;
    return [g, x, y];
}

function modInverse(a, m) {
    let [g, x, y] = eea(a, m);
    if(g !== 1) return null; // No inverse
    return (x % m + m) % m; // Ensure positive
}

function updateStatus(msg, type='normal') {
    const el = document.getElementById('crtStatus');
    el.innerHTML = msg;
    el.className = 'crt-status';
    if(type === 'good') el.classList.add('good');
    if(type === 'error') el.classList.add('error');
}

function validateInputs() {
    let mStr = document.getElementById('moduliInput').value;
    let xStr = document.getElementById('secretInput').value;
    
    let mArr = mStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 1);
    if(mArr.length < 2) {
        updateStatus('Please enter at least two valid integer moduli > 1.', 'error');
        return false;
    }
    
    // Check pairwise coprime
    for(let i=0; i<mArr.length; i++) {
        for(let j=i+1; j<mArr.length; j++) {
            if(gcd(mArr[i], mArr[j]) !== 1) {
                updateStatus(`Moduli must be pairwise coprime. ${mArr[i]} and ${mArr[j]} share a factor!`, 'error');
                return false;
            }
        }
    }
    
    let x = parseInt(xStr);
    if(isNaN(x) || x < 0) {
        updateStatus('Secret X must be a non-negative integer.', 'error');
        return false;
    }
    
    moduli = mArr;
    N = moduli.reduce((acc, val) => acc * val, 1);
    document.getElementById('maxNVal').innerText = N;
    
    let slider = document.getElementById('xSlider');
    slider.max = N - 1;
    
    if(x >= N) {
        x = x % N; // Secret X must be within range for unique reconstruction
        document.getElementById('secretInput').value = x;
        updateStatus(`Secret X was >= N. Reduced to ${x} (since CRT reconstructs mod N).`, 'normal');
    }
    
    secretX = x;
    return true;
}

// Clock UI
function initClocks() {
    let container = document.getElementById('clocksContainer');
    container.innerHTML = '';
    clocks = [];
    
    moduli.forEach((m, idx) => {
        let clockDiv = document.createElement('div');
        clockDiv.className = 'crt-clock';
        clockDiv.innerHTML = `
            <canvas id="clockCanvas-${idx}" class="clock-canvas" width="140" height="140"></canvas>
            <div class="clock-label">x ≡ <span id="clockVal-${idx}">?</span> (mod ${m})</div>
        `;
        container.appendChild(clockDiv);
        
        clocks.push({
            canvas: document.getElementById(`clockCanvas-${idx}`),
            ctx: document.getElementById(`clockCanvas-${idx}`).getContext('2d'),
            m: m
        });
    });
}

function drawClock(clockObj, currentX, highlight = false) {
    let ctx = clockObj.ctx;
    let w = clockObj.canvas.width;
    let h = clockObj.canvas.height;
    let cx = w/2;
    let cy = h/2;
    let r = w/2 - 15;
    
    ctx.clearRect(0, 0, w, h);
    
    let m = clockObj.m;
    let rem = currentX % m;
    
    // Draw ticks
    for(let i=0; i<m; i++) {
        let angle = -Math.PI/2 + (i * 2 * Math.PI / m);
        let tx = cx + (r) * Math.cos(angle);
        let ty = cy + (r) * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(tx, ty, i === 0 ? 4 : 2, 0, 2*Math.PI);
        ctx.fillStyle = i === 0 ? '#22c55e' : 'rgba(255,255,255,0.4)';
        ctx.fill();
        
        // Labels for small moduli
        if(m <= 15) {
            let lx = cx + (r - 15) * Math.cos(angle);
            let ly = cy + (r - 15) * Math.sin(angle);
            ctx.fillStyle = i === rem && highlight ? '#06b6d4' : 'rgba(255,255,255,0.2)';
            ctx.font = '10px "Fira Code"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i, lx, ly);
        }
    }
    
    // Draw Hand
    let targetAngle = -Math.PI/2 + (rem * 2 * Math.PI / m);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (r - 20) * Math.cos(targetAngle), cy + (r - 20) * Math.sin(targetAngle));
    ctx.lineWidth = 3;
    ctx.strokeStyle = highlight ? '#06b6d4' : '#a855f7';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2*Math.PI);
    ctx.fillStyle = highlight ? '#06b6d4' : '#a855f7';
    ctx.fill();
}

function updateClocks(x, isEncoded) {
    document.getElementById('lblLiveX').innerText = x;
    document.getElementById('xSlider').value = x;
    
    clocks.forEach((c, idx) => {
        drawClock(c, x, isEncoded);
        if(isEncoded) {
            document.getElementById(`clockVal-${idx}`).innerText = x % c.m;
        } else {
            document.getElementById(`clockVal-${idx}`).innerText = '?';
        }
    });
}

document.getElementById('xSlider').addEventListener('input', function() {
    let val = parseInt(this.value);
    document.getElementById('secretInput').value = val; // sync back
    secretX = val;
    updateClocks(secretX, false);
    document.getElementById('btnReconstruct').disabled = true;
});

// Logic
document.getElementById('btnCast').addEventListener('click', () => {
    if(!validateInputs()) return;
    initClocks();
    remainders = moduli.map(m => secretX % m);
    
    updateClocks(secretX, true);
    
    // Reset Math Panel
    document.getElementById('mathN').innerText = '-';
    document.getElementById('crtTbody').innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Run CRT to view breakdown</td></tr>';
    document.getElementById('mathFinal').innerHTML = '$$ X = (\\sum a_i N_i y_i) \\pmod N = ? $$';
    
    document.getElementById('btnReconstruct').disabled = false;
    updateStatus(`Cast shadows (computed remainders). Notice how ${secretX} lands on exactly those ticks.`, 'good');
});

document.getElementById('btnReconstruct').addEventListener('click', () => {
    document.getElementById('mathN').innerText = `${N} (Max possible unique number)`;
    
    let tbody = document.getElementById('crtTbody');
    tbody.innerHTML = '';
    
    let totalSum = 0;
    
    for(let i=0; i<moduli.length; i++) {
        let m_i = moduli[i];
        let a_i = remainders[i];
        let N_i = N / m_i;
        let y_i = modInverse(N_i, m_i);
        
        let term = a_i * N_i * y_i;
        totalSum += term;
        
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i+1}</td>
            <td>${m_i}</td>
            <td class="hl">${a_i}</td>
            <td>${N_i}</td>
            <td class="hl">${y_i}</td>
            <td class="sum-hl">${term}</td>
        `;
        tbody.appendChild(tr);
    }
    
    let finalX = totalSum % N;
    
    document.getElementById('mathFinal').innerHTML = `
        $$ X = (${totalSum}) \\pmod{${N}} = <span style="color:#22c55e">${finalX}</span> $$
    `;
    
    if(finalX === secretX) {
        updateStatus(`CRT successfully reconstructed ${secretX} using ONLY the remainders and moduli!`, 'good');
    } else {
        updateStatus('Reconstruction mismatch! (This should not happen mathematically).', 'error');
    }
});


// Hero Animation
const heroCanvas = document.getElementById('crtHeroCanvas');
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
        
        hctx.lineWidth = 1;
        // Draw orbital rings representing moduli
        for(let i=1; i<=3; i++) {
            hctx.beginPath();
            hctx.arc(cx, cy, 50 * i, 0, 2*Math.PI);
            hctx.strokeStyle = `rgba(6, 182, 212, ${0.2 / i})`;
            hctx.stroke();
            
            // Draw a spinning dot
            let speed = 0.05 / i;
            let angle = t * speed;
            let dx = cx + 50*i * Math.cos(angle);
            let dy = cy + 50*i * Math.sin(angle);
            
            hctx.beginPath();
            hctx.arc(dx, dy, 4, 0, 2*Math.PI);
            hctx.fillStyle = 'rgba(34, 197, 94, 0.5)';
            hctx.fill();
        }
        
        t += 1;
        requestAnimationFrame(animateHero);
    }
    animateHero();
}

initHeroCanvas();
setTimeout(() => {
    validateInputs();
    initClocks();
    updateClocks(secretX, false);
}, 100);
