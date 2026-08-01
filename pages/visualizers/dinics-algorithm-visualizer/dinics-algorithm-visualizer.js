const U=document.getElementById.bind(document);
const C=document.createElement.bind(document);

let nodes=[];
let edges=[];
let G=[];

let levelGraphNodes=[];
let levelGraphEdges=[];

let sourceId=0;
let sinkId=0;

let state={
    mode: 'IDLE',
    phase: 1,
    maxFlow: 0,
    dinicOps: 0,
    ffOps: 0,
    q: [],
    level: [],
    ptrs: [],
    stack: [],
    pathEdges: [],
    activeNode: null,
    activeEdge: null,
    bottleneck: Infinity,
    timer: null,
    playing: false
};

const cMain=U('mainCanvas');
const ctxMain=cMain?cMain.getContext('2d'):null;
const cLevel=U('levelCanvas');
const ctxLevel=cLevel?cLevel.getContext('2d'):null;

function initHeroCanvas(){
    const c=U('dinicHeroCanvas');
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
        ctx.lineWidth=2;
        for(let i=0;i<8;i++){
            let p1={x: c.width*0.2 + (i%3)*100, y: c.height*0.3 + Math.floor(i/3)*80 + Math.sin(t+i)*15};
            let p2={x: c.width*0.8 - (i%2)*80, y: c.height*0.2 + i*40 + Math.cos(t+i)*15};
            ctx.strokeStyle='rgba(139,92,246,0.15)';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            
            let flowPos = (t*0.5 + i*0.1)%1;
            ctx.fillStyle='#3b82f6';
            ctx.beginPath();
            ctx.arc(p1.x + (p2.x-p1.x)*flowPos, p1.y + (p2.y-p1.y)*flowPos, 4, 0, Math.PI*2);
            ctx.fill();
        }
        requestAnimationFrame(draw);
    }
    draw();
}

function logMsg(msg, type=''){
    const lc=U('logConsole');
    if(!lc)return;
    let d=C('div');
    d.className='log-entry '+type;
    d.innerHTML=msg;
    lc.appendChild(d);
    lc.scrollTop=lc.scrollHeight;
}

function addNode(id, label, x, y, isSource=false, isSink=false){
    nodes.push({id, label, x, y, isSource, isSink});
    G[id]=[];
}

function addEdge(u, v, cap){
    let e1 = {u, v, cap, flow:0, isDead:false, rev:null};
    let e2 = {u:v, v:u, cap:0, flow:0, isDead:false, rev:null};
    e1.rev=e2; e2.rev=e1;
    edges.push(e1, e2);
    G[u].push(e1);
    G[v].push(e2);
}

function buildGraph(type){
    nodes=[]; edges=[]; G=[];
    
    if(type==='standard'){
        for(let i=0;i<6;i++) G[i]=[];
        addNode(0,'S', 0.1, 0.5, true, false);
        addNode(1,'A', 0.4, 0.2);
        addNode(2,'B', 0.4, 0.8);
        addNode(3,'C', 0.6, 0.2);
        addNode(4,'D', 0.6, 0.8);
        addNode(5,'T', 0.9, 0.5, false, true);
        addEdge(0,1,10); addEdge(0,2,10);
        addEdge(1,2,2); addEdge(1,3,4); addEdge(1,4,8);
        addEdge(2,4,9);
        addEdge(3,5,10); addEdge(4,3,6); addEdge(4,5,10);
        sourceId=0; sinkId=5;
    } else if(type==='bipartite'){
        for(let i=0;i<8;i++) G[i]=[];
        addNode(0,'S', 0.1, 0.5, true, false);
        addNode(1,'L1', 0.35, 0.2); addNode(2,'L2', 0.35, 0.5); addNode(3,'L3', 0.35, 0.8);
        addNode(4,'R1', 0.65, 0.2); addNode(5,'R2', 0.65, 0.5); addNode(6,'R3', 0.65, 0.8);
        addNode(7,'T', 0.9, 0.5, false, true);
        addEdge(0,1,1); addEdge(0,2,1); addEdge(0,3,1);
        addEdge(1,4,1); addEdge(1,5,1);
        addEdge(2,5,1); addEdge(2,6,1);
        addEdge(3,4,1); addEdge(3,6,1);
        addEdge(4,7,1); addEdge(5,7,1); addEdge(6,7,1);
        sourceId=0; sinkId=7;
    } else if(type==='worstcase'){
        for(let i=0;i<4;i++) G[i]=[];
        addNode(0,'S', 0.2, 0.5, true, false);
        addNode(1,'A', 0.5, 0.2);
        addNode(2,'B', 0.5, 0.8);
        addNode(3,'T', 0.8, 0.5, false, true);
        addEdge(0,1,1000); addEdge(0,2,1000);
        addEdge(1,2,1);
        addEdge(1,3,1000); addEdge(2,3,1000);
        sourceId=0; sinkId=3;
    } else if(type==='bottleneck'){
        for(let i=0;i<5;i++) G[i]=[];
        addNode(0,'S', 0.1, 0.5, true, false);
        addNode(1,'A', 0.4, 0.2); addNode(2,'B', 0.4, 0.8);
        addNode(3,'C', 0.7, 0.5);
        addNode(4,'T', 0.9, 0.5, false, true);
        addEdge(0,1,50); addEdge(0,2,50);
        addEdge(1,3,50); addEdge(2,3,50);
        addEdge(3,4,1); 
        sourceId=0; sinkId=4;
    }
}

function simFF(){
    let eCopy = JSON.parse(JSON.stringify(edges));
    let gCopy = [];
    for(let i=0;i<nodes.length;i++) gCopy[i]=[];
    eCopy.forEach(e => {
        let rev = eCopy.find(r => r.u===e.v && r.v===e.u && r.cap===0); 
        e.rev = rev;
        gCopy[e.u].push(e);
    });
    
    let ops = 0;
    let totalFlow = 0;
    
    while(true){
        let q = [sourceId];
        let parent = new Array(nodes.length).fill(null);
        let visited = new Array(nodes.length).fill(false);
        visited[sourceId] = true;
        
        let found = false;
        while(q.length > 0){
            let u = q.shift();
            ops++; 
            if(u === sinkId){ found=true; break; }
            for(let e of gCopy[u]){
                ops++;
                if(!visited[e.v] && e.cap - e.flow > 0){
                    visited[e.v] = true;
                    parent[e.v] = e;
                    q.push(e.v);
                }
            }
        }
        
        if(!found) break;
        
        let push = Infinity;
        let curr = sinkId;
        while(curr !== sourceId){
            ops++;
            let e = parent[curr];
            push = Math.min(push, e.cap - e.flow);
            curr = e.u;
        }
        
        curr = sinkId;
        while(curr !== sourceId){
            ops++;
            let e = parent[curr];
            e.flow += push;
            e.rev.flow -= push;
            curr = e.u;
        }
        totalFlow += push;
    }
    return ops;
}

function resetAlg(){
    edges.forEach(e => { e.flow = 0; e.isDead = false; });
    state.mode = 'BFS_INIT';
    state.phase = 1;
    state.maxFlow = 0;
    state.dinicOps = 0;
    state.ffOps = simFF();
    state.level = new Array(nodes.length).fill(-1);
    
    U('statFlow').innerText = '0';
    U('statPhase').innerText = '1';
    U('statDinicOps').innerText = '0';
    U('statFFOps').innerText = state.ffOps;
    U('logConsole').innerHTML = '';
    
    updateStatus('Network reset. Starting Phase 1 BFS.');
    drawAll();
}

function updateStatus(msg, cls=''){
    const sb = U('dinicStatus');
    const sm = U('statusMsg');
    if(!sb || !sm) return;
    sb.className = 'dinic-status-bar ' + cls;
    sm.innerHTML = msg;
}

function buildLevelGraphDisplay(){
    levelGraphNodes = [];
    levelGraphEdges = [];
    
    let maxL = Math.max(...state.level);
    if(maxL === -1) maxL = 0;
    
    let counts = new Array(maxL+1).fill(0);
    nodes.forEach(n => {
        if(state.level[n.id] !== -1){
            let l = state.level[n.id];
            levelGraphNodes.push({
                orig: n,
                l: l,
                idx: counts[l]++
            });
        }
    });
    
    levelGraphNodes.forEach(ln => {
        let maxCount = counts[ln.l];
        ln.cx = 0.1 + (ln.l / (maxL===0?1:maxL)) * 0.8;
        ln.cy = 0.5 + (ln.idx - (maxCount-1)/2) * 0.25;
    });
    
    edges.forEach(e => {
        if(e.cap > 0 && state.level[e.u] !== -1 && state.level[e.v] !== -1 && state.level[e.v] === state.level[e.u] + 1){
            levelGraphEdges.push(e);
        }
    });
}

function drawArrow(ctx, x1, y1, x2, y2, isCurved=false, flowRatio=0, isActive=false, isDead=false){
    let dx = x2 - x1;
    let dy = y2 - y1;
    let dist = Math.hypot(dx, dy);
    let nDx = dx/dist; let nDy = dy/dist;
    
    let sx = x1 + nDx*20; let sy = y1 + nDy*20;
    let ex = x2 - nDx*20; let ey = y2 - nDy*20;
    
    ctx.beginPath();
    let cx = (sx+ex)/2; let cy = (sy+ey)/2;
    
    if(isCurved){
        let cv = 25;
        cx -= nDy*cv; cy += nDx*cv;
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
    } else {
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
    }
    
    if(isDead){
        ctx.strokeStyle = 'rgba(239,68,68,0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
    } else if(isActive){
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.setLineDash([]);
    } else {
        ctx.strokeStyle = flowRatio>0 ? '#3b82f6' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = flowRatio>0 ? 2 + flowRatio*2 : 1;
        ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    let ang = Math.atan2(ey-(isCurved?cy:sy), ex-(isCurved?cx:sx));
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 10*Math.cos(ang-Math.PI/6), ey - 10*Math.sin(ang-Math.PI/6));
    ctx.lineTo(ex - 10*Math.cos(ang+Math.PI/6), ey - 10*Math.sin(ang+Math.PI/6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    
    return {cx, cy};
}

function drawAll(){
    if(ctxMain){
        let w = cMain.parentElement.clientWidth;
        let h = cMain.parentElement.clientHeight;
        cMain.width=w; cMain.height=h;
        ctxMain.clearRect(0,0,w,h);
        
        edges.forEach(e => {
            if(e.cap > 0){
                let p1 = nodes[e.u]; let p2 = nodes[e.v];
                let isCurved = edges.some(r => r.u===e.v && r.v===e.u && r.cap>0);
                let isActive = state.pathEdges.includes(e);
                let flowRatio = e.flow / e.cap;
                
                let pt = drawArrow(ctxMain, p1.x*w, p1.y*h, p2.x*w, p2.y*h, isCurved, flowRatio, isActive);
                
                ctxMain.font = '10px "Fira Code"';
                ctxMain.fillStyle = '#fff';
                ctxMain.textAlign = 'center';
                let lbl = `${e.flow}/${e.cap}`;
                ctxMain.fillText(lbl, pt.cx, pt.cy - 8);
            } else if(e.cap===0 && e.flow < 0 && state.mode.startsWith('DFS')){
                let p1 = nodes[e.u]; let p2 = nodes[e.v];
                let isActive = state.pathEdges.includes(e);
                if(isActive){
                    drawArrow(ctxMain, p1.x*w, p1.y*h, p2.x*w, p2.y*h, true, 0, true);
                }
            }
        });
        
        nodes.forEach(n => {
            ctxMain.beginPath();
            ctxMain.arc(n.x*w, n.y*h, 20, 0, Math.PI*2);
            if(n.id === state.activeNode) ctxMain.fillStyle = '#ec4899';
            else if(n.isSource) ctxMain.fillStyle = '#10b981';
            else if(n.isSink) ctxMain.fillStyle = '#ef4444';
            else ctxMain.fillStyle = '#1e293b';
            
            ctxMain.fill();
            ctxMain.strokeStyle = '#cbd5e1';
            ctxMain.lineWidth = 2;
            ctxMain.stroke();
            
            ctxMain.fillStyle = '#fff';
            ctxMain.font = 'bold 12px Orbitron';
            ctxMain.textAlign = 'center';
            ctxMain.textBaseline = 'middle';
            ctxMain.fillText(n.label, n.x*w, n.y*h);
        });
    }
    
    if(ctxLevel){
        let w = cLevel.parentElement.clientWidth;
        let h = cLevel.parentElement.clientHeight;
        cLevel.width=w; cLevel.height=h;
        ctxLevel.clearRect(0,0,w,h);
        
        if(state.level[sourceId] !== -1){
            levelGraphEdges.forEach(e => {
                let ln1 = levelGraphNodes.find(n => n.orig.id === e.u);
                let ln2 = levelGraphNodes.find(n => n.orig.id === e.v);
                if(ln1 && ln2){
                    let isActive = state.pathEdges.includes(e);
                    drawArrow(ctxLevel, ln1.cx*w, ln1.cy*h, ln2.cx*w, ln2.cy*h, false, 0, isActive, e.isDead);
                }
            });
            
            levelGraphNodes.forEach(ln => {
                ctxLevel.beginPath();
                ctxLevel.arc(ln.cx*w, ln.cy*h, 15, 0, Math.PI*2);
                
                let col = '#8b5cf6';
                if(ln.l%3===1) col = '#3b82f6';
                if(ln.l%3===2) col = '#ec4899';
                
                ctxLevel.fillStyle = col;
                ctxLevel.globalAlpha = 0.2;
                ctxLevel.fill();
                ctxLevel.globalAlpha = 1.0;
                ctxLevel.strokeStyle = col;
                ctxLevel.lineWidth = 2;
                ctxLevel.stroke();
                
                ctxLevel.fillStyle = '#fff';
                ctxLevel.font = '10px "Fira Code"';
                ctxLevel.textAlign = 'center';
                ctxLevel.textBaseline = 'middle';
                ctxLevel.fillText(`L${ln.l}`, ln.cx*w, ln.cy*h);
            });
        }
    }
}

function doStep(){
    state.dinicOps++;
    U('statDinicOps').innerText = state.dinicOps;
    
    if(state.mode === 'BFS_INIT'){
        state.level = new Array(nodes.length).fill(-1);
        state.level[sourceId] = 0;
        state.q = [sourceId];
        edges.forEach(e => e.isDead = false);
        logMsg(`<span class="log-entry phase">Phase ${state.phase}</span> Starting BFS Level Graph construction...`);
        updateStatus(`Phase ${state.phase}: BFS Building Level Graph`, 'bfs');
        U('levelGraphStatus').innerText = `Building L0...`;
        state.mode = 'BFS_STEP';
    } 
    else if(state.mode === 'BFS_STEP'){
        if(state.q.length === 0){
            buildLevelGraphDisplay();
            if(state.level[sinkId] === -1){
                state.mode = 'DONE';
                logMsg(`Sink is unreachable in residual graph. <b>Max Flow Found: ${state.maxFlow}</b>`, 'flow');
                updateStatus('Algorithm Complete! No more augmenting paths.', 'done');
                U('levelGraphStatus').innerText = 'Disconnected';
            } else {
                state.mode = 'DFS_INIT';
                logMsg(`BFS Complete. Sink found at Level ${state.level[sinkId]}.`, 'bfs');
                updateStatus(`Phase ${state.phase}: BFS Complete. Starting DFS Blocking Flow.`, 'bfs');
                U('levelGraphStatus').innerText = `Sink at L${state.level[sinkId]}`;
            }
        } else {
            let u = state.q.shift();
            state.activeNode = u;
            for(let e of G[u]){
                state.dinicOps++; 
                if(e.cap - e.flow > 0 && state.level[e.v] === -1){
                    state.level[e.v] = state.level[u] + 1;
                    state.q.push(e.v);
                    logMsg(`BFS: Node ${nodes[e.v].label} assigned Level ${state.level[e.v]}`, 'bfs');
                }
            }
            buildLevelGraphDisplay();
        }
    }
    else if(state.mode === 'DFS_INIT'){
        state.ptrs = new Array(nodes.length).fill(0);
        state.stack = [{u: sourceId, e: null, bn: Infinity}];
        state.pathEdges = [];
        logMsg(`Starting DFS for Blocking Flow...`, 'dfs');
        updateStatus(`Phase ${state.phase}: DFS Searching for paths`, 'dfs');
        state.mode = 'DFS_STEP';
    }
    else if(state.mode === 'DFS_STEP'){
        if(state.stack.length === 0){
            state.phase++;
            U('statPhase').innerText = state.phase;
            logMsg(`DFS blocked. Phase ${state.phase-1} complete.`, 'dfs');
            state.mode = 'BFS_INIT';
            doStep();
            return;
        }
        
        let curr = state.stack[state.stack.length-1];
        state.activeNode = curr.u;
        
        if(curr.u === sinkId){
            let pushed = curr.bn;
            state.maxFlow += pushed;
            U('statFlow').innerText = state.maxFlow;
            logMsg(`DFS reached Sink! Pushing ${pushed} flow.`, 'flow');
            
            for(let i=1; i<state.stack.length; i++){
                let edge = state.stack[i].e;
                edge.flow += pushed;
                edge.rev.flow -= pushed;
            }
            
            while(state.stack.length > 1){
                let top = state.stack[state.stack.length-1];
                if(top.e.cap - top.e.flow === 0){
                    logMsg(`Edge ${nodes[top.e.u].label}→${nodes[top.e.v].label} saturated. Backtracking.`, 'dfs');
                    break;
                }
                state.stack.pop();
                state.pathEdges.pop();
            }
            state.stack.pop();
            state.pathEdges.pop();
            return;
        }
        
        let advanced = false;
        for(; state.ptrs[curr.u] < G[curr.u].length; state.ptrs[curr.u]++){
            state.dinicOps++;
            let e = G[curr.u][state.ptrs[curr.u]];
            if(e.cap - e.flow > 0 && state.level[e.v] === state.level[curr.u] + 1 && !e.isDead){
                let nextBn = Math.min(curr.bn, e.cap - e.flow);
                state.stack.push({u: e.v, e: e, bn: nextBn});
                state.pathEdges.push(e);
                logMsg(`DFS: Advancing ${nodes[curr.u].label} → ${nodes[e.v].label}`, 'dfs');
                advanced = true;
                break;
            }
        }
        
        if(!advanced){
            state.stack.pop();
            let popE = state.pathEdges.pop();
            if(popE) {
                popE.isDead = true; 
                logMsg(`Dead end at ${nodes[curr.u].label}. Crossing off edge ${nodes[popE.u].label}→${nodes[popE.v].label} (Pointer Adv)`, 'dead');
            }
        }
    }
    
    drawAll();
}

function runLoop(){
    if(state.mode === 'DONE'){
        state.playing = false;
        U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
        return;
    }
    
    doStep();
    
    if(state.playing){
        let speed = 101 - parseInt(U('speedSlider').value);
        state.timer = setTimeout(runLoop, speed);
    }
}

U('btnStep').addEventListener('click', ()=>{
    state.playing = false;
    clearTimeout(state.timer);
    U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
    doStep();
});

U('btnPlay').addEventListener('click', ()=>{
    if(state.playing){
        state.playing = false;
        clearTimeout(state.timer);
        U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
    }else{
        state.playing = true;
        U('btnPlay').innerHTML = '<i class="fas fa-pause"></i> Pause';
        runLoop();
    }
});

U('btnReset').addEventListener('click', ()=>{
    state.playing = false;
    clearTimeout(state.timer);
    U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
    resetAlg();
});

U('selGraph').addEventListener('change', (e)=>{
    state.playing = false;
    clearTimeout(state.timer);
    U('btnPlay').innerHTML = '<i class="fas fa-play"></i> Auto Run';
    buildGraph(e.target.value);
    resetAlg();
});

document.addEventListener('DOMContentLoaded', ()=>{
    initHeroCanvas();
    buildGraph('standard');
    resetAlg();
});
