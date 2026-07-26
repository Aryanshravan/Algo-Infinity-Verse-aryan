const N = 8;
const K = 2;
let nodes = [];
let animQueue = [];
let isAnimating = false;
let canvas = document.getElementById('swimCanvas');
let ctx = canvas.getContext('2d');
let animFrame = null;
let currentDemo = null;

function initNodes() {
    nodes = [];
    for(let i=0; i<N; i++) {
        nodes.push({ id: i, state: 'ALIVE', x: 0, y: 0, rad: 0 });
    }
    recalcNodePositions();
}

function recalcNodePositions() {
    let w = canvas.width;
    let h = canvas.height;
    let cx = w/2;
    let cy = h/2;
    let r = Math.min(w, h)/2 - 40;
    
    for(let i=0; i<N; i++) {
        let angle = -Math.PI/2 + (i * 2 * Math.PI / N);
        nodes[i].x = cx + r * Math.cos(angle);
        nodes[i].y = cy + r * Math.sin(angle);
        nodes[i].rad = angle;
    }
}

window.addEventListener('resize', () => {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    recalcNodePositions();
    drawStatic();
});

function logEvent(msg, type='neutral') {
    let log = document.getElementById('swimLog');
    let entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = msg;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function updateStatus(msg, type='normal') {
    const el = document.getElementById('swimStatus');
    el.innerHTML = msg;
    el.className = 'swim-status';
    if(type === 'good') el.classList.add('good');
    if(type === 'warn') el.classList.add('warn');
    if(type === 'err') el.classList.add('err');
}

function drawStatic() {
    let w = canvas.width;
    let h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    ctx.lineWidth = 1;
    for(let i=0; i<N; i++) {
        for(let j=i+1; j<N; j++) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.stroke();
        }
    }
    
    for(let i=0; i<N; i++) {
        let n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, 22, 0, 2*Math.PI);
        
        if(n.state === 'ALIVE') ctx.fillStyle = '#22c55e';
        else if(n.state === 'SUSPECT') ctx.fillStyle = '#f59e0b';
        else if(n.state === 'DEAD') ctx.fillStyle = '#ef4444';
        else if(n.state === 'GLITCH') ctx.fillStyle = '#a855f7'; 
        
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px "Orbitron"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`N${n.id}`, n.x, n.y);
    }
}

function processAnimQueue() {
    if(animQueue.length === 0) {
        isAnimating = false;
        drawStatic();
        document.getElementById('stateBadge').innerText = 'Idle';
        document.getElementById('stateBadge').style.borderColor = 'var(--glass-border)';
        document.getElementById('stateBadge').style.color = 'var(--text-secondary)';
        toggleButtons(false);
        
        if(currentDemo === 'fail') {
            updateStatus('Node permanently declared DEAD. Gossip will now propagate this state.', 'err');
        } else if(currentDemo === 'glitch') {
            updateStatus('False positive prevented! The indirect relay found a working path.', 'good');
        } else if(currentDemo === 'normal') {
            updateStatus('Direct ping successful. Cluster is healthy.', 'good');
        }
        return;
    }
    
    isAnimating = true;
    let anim = animQueue.shift();
    let duration = anim.dur || 1000;
    let startTime = performance.now();
    
    if(anim.preLog) logEvent(anim.preLog, anim.logType);
    if(anim.badge) {
        document.getElementById('stateBadge').innerText = anim.badge;
        document.getElementById('stateBadge').style.borderColor = anim.badgeColor;
        document.getElementById('stateBadge').style.color = anim.badgeColor;
    }
    
    function renderFrame(now) {
        let p = (now - startTime) / duration;
        if(p > 1) p = 1;
        
        drawStatic();
        
        if(anim.type === 'direct') {
            drawPacket(nodes[anim.src], nodes[anim.dst], p, anim.color, anim.label);
            ctx.beginPath();
            ctx.arc(nodes[anim.src].x, nodes[anim.src].y, 25, 0, 2*Math.PI);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else if(anim.type === 'fanout') {
            for(let d of anim.dsts) {
                drawPacket(nodes[anim.src], nodes[d], p, anim.color, anim.label);
            }
            ctx.beginPath();
            ctx.arc(nodes[anim.src].x, nodes[anim.src].y, 25, 0, 2*Math.PI);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else if(anim.type === 'timeout') {
            ctx.beginPath();
            ctx.arc(nodes[anim.dst].x, nodes[anim.dst].y, 30 + p*20, 0, 2*Math.PI);
            ctx.strokeStyle = `rgba(239, 68, 68, ${1-p})`;
            ctx.lineWidth = 5;
            ctx.stroke();
            
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 16px "Fira Code"';
            ctx.textAlign = 'center';
            ctx.fillText("X TIMEOUT", nodes[anim.dst].x, nodes[anim.dst].y - 35);
        } else if(anim.type === 'state_change') {
            nodes[anim.target].state = anim.newState;
            drawStatic();
            p = 1; 
        }
        
        if(p < 1) {
            animFrame = requestAnimationFrame(renderFrame);
        } else {
            if(anim.postLog) logEvent(anim.postLog, anim.logType);
            processAnimQueue();
        }
    }
    animFrame = requestAnimationFrame(renderFrame);
}

function drawPacket(n1, n2, p, color, label) {
    let px = n1.x + (n2.x - n1.x)*p;
    let py = n1.y + (n2.y - n1.y)*p;
    
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, 2*Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    
    ctx.fillStyle = color;
    ctx.font = '10px "Fira Code"';
    ctx.textAlign = 'center';
    ctx.fillText(label, px, py - 12);
    ctx.shadowBlur = 0;
}

function toggleButtons(disabled) {
    document.getElementById('btnPingNormal').disabled = disabled;
    document.getElementById('btnPingGlitch').disabled = disabled;
    document.getElementById('btnPingFail').disabled = disabled;
    document.getElementById('btnReset').disabled = disabled;
}

document.getElementById('btnPingNormal').addEventListener('click', () => {
    toggleButtons(true);
    currentDemo = 'normal';
    animQueue = [
        { type: 'direct', src: 0, dst: 4, color: '#06b6d4', label: 'PING', dur: 800, preLog: 'Node 0 initiates direct PING to Node 4', logType: 'info', badge: 'Direct Probing', badgeColor: '#06b6d4' },
        { type: 'direct', src: 4, dst: 0, color: '#22c55e', label: 'ACK', dur: 800, postLog: 'Node 4 responds with ACK. Target healthy.', logType: 'good' }
    ];
    processAnimQueue();
});

document.getElementById('btnPingGlitch').addEventListener('click', () => {
    toggleButtons(true);
    currentDemo = 'glitch';
    
    let kNodes = [2, 6];
    
    animQueue = [
        { type: 'direct', src: 0, dst: 3, color: '#06b6d4', label: 'PING', dur: 800, preLog: 'Node 0 initiates direct PING to Node 3', logType: 'info', badge: 'Direct Probing', badgeColor: '#06b6d4' },
        { type: 'timeout', dst: 3, dur: 1000, preLog: 'Direct connection glitch! PING dropped.', logType: 'warn', badge: 'Timeout', badgeColor: '#ef4444' },
        { type: 'fanout', src: 0, dsts: kNodes, color: '#f59e0b', label: 'PING-REQ', dur: 800, preLog: `Node 0 asks K=${K} peers to relay ping to Node 3`, logType: 'warn', badge: 'Indirect Relays', badgeColor: '#f59e0b' }
    ];
    
    for(let k of kNodes) {
        animQueue.push({ type: 'direct', src: k, dst: 3, color: '#06b6d4', label: 'PING', dur: 600 });
    }
    for(let k of kNodes) {
        animQueue.push({ type: 'direct', src: 3, dst: k, color: '#22c55e', label: 'ACK', dur: 600 });
    }
    
    animQueue.push({ type: 'fanout', src: 3, dsts: [0], color: '#22c55e', label: 'ACK (Relayed)', dur: 800, preLog: 'Peers successfully relayed ACK back to Node 0', logType: 'good' });
    
    processAnimQueue();
});

document.getElementById('btnPingFail').addEventListener('click', () => {
    toggleButtons(true);
    currentDemo = 'fail';
    
    let kNodes = [1, 7];
    
    animQueue = [
        { type: 'state_change', target: 5, newState: 'GLITCH', dur: 0, preLog: 'Node 5 suffers catastrophic failure.', logType: 'err' },
        { type: 'direct', src: 0, dst: 5, color: '#06b6d4', label: 'PING', dur: 800, preLog: 'Node 0 initiates direct PING to Node 5', logType: 'info', badge: 'Direct Probing', badgeColor: '#06b6d4' },
        { type: 'timeout', dst: 5, dur: 1000, preLog: 'Direct PING timeout.', logType: 'warn', badge: 'Timeout', badgeColor: '#ef4444' },
        { type: 'fanout', src: 0, dsts: kNodes, color: '#f59e0b', label: 'PING-REQ', dur: 800, preLog: `Node 0 asks K=${K} peers to relay ping`, logType: 'warn', badge: 'Indirect Relays', badgeColor: '#f59e0b' }
    ];
    
    for(let k of kNodes) {
        animQueue.push({ type: 'direct', src: k, dst: 5, color: '#06b6d4', label: 'PING', dur: 600 });
    }
    
    animQueue.push({ type: 'timeout', dst: 5, dur: 1000, preLog: 'ALL indirect PINGs timeout.', logType: 'err', badge: 'Timeout', badgeColor: '#ef4444' });
    animQueue.push({ type: 'state_change', target: 5, newState: 'SUSPECT', dur: 0, preLog: 'Node 5 marked as SUSPECTED. Waiting for refutation...', logType: 'warn', badge: 'Suspicion', badgeColor: '#f59e0b' });
    
    animQueue.push({ type: 'timeout', dst: 5, dur: 1500, preLog: 'Suspicion timeout expires.', logType: 'err' });
    animQueue.push({ type: 'state_change', target: 5, newState: 'DEAD', dur: 0, preLog: 'Node 5 officially declared DEAD.', logType: 'err', badge: 'Dead', badgeColor: '#ef4444' });
    
    processAnimQueue();
});

document.getElementById('btnReset').addEventListener('click', () => {
    initNodes();
    document.getElementById('swimLog').innerHTML = '<div class="log-entry log-neutral">System reset. Waiting for events...</div>';
    updateStatus('Cluster reset.', 'normal');
    if(animFrame) cancelAnimationFrame(animFrame);
    animQueue = [];
    isAnimating = false;
    drawStatic();
    document.getElementById('stateBadge').innerText = 'Idle';
    document.getElementById('stateBadge').style.borderColor = 'var(--glass-border)';
    document.getElementById('stateBadge').style.color = 'var(--text-secondary)';
    toggleButtons(false);
});

const heroCanvas = document.getElementById('swimHeroCanvas');
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
        
        let p = (t % 100) / 100;
        let px = cx - 100 + 200*p;
        let py = cy;
        
        hctx.beginPath();
        hctx.arc(cx - 100, cy, 20, 0, 2*Math.PI);
        hctx.fillStyle = '#0f172a';
        hctx.fill();
        hctx.strokeStyle = '#06b6d4';
        hctx.lineWidth = 2;
        hctx.stroke();
        
        hctx.beginPath();
        hctx.arc(cx + 100, cy, 20, 0, 2*Math.PI);
        hctx.fillStyle = '#0f172a';
        hctx.fill();
        hctx.strokeStyle = '#22c55e';
        hctx.lineWidth = 2;
        hctx.stroke();
        
        hctx.beginPath();
        hctx.arc(px, py, 5, 0, 2*Math.PI);
        hctx.fillStyle = '#06b6d4';
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
    initNodes();
    drawStatic();
}, 100);
