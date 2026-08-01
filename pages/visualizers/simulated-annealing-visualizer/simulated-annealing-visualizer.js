const U=document.getElementById.bind(document);

let points = [];
let states = [];
let running = false;
let reqId = null;
let maxT = 10000;
let iter = 0;
let maxIter = 50000;

function initHeroCanvas(){
    const c=U('saHeroCanvas');
    if(!c)return;
    const ctx=c.getContext('2d');
    let t=0;
    function resize(){
        c.width=c.parentElement.clientWidth;
        c.height=c.parentElement.clientHeight;
    }
    window.addEventListener('resize',resize);
    resize();
    let pts=[];
    for(let i=0;i<20;i++) pts.push({x:Math.random(), y:Math.random()});
    
    function draw(){
        ctx.clearRect(0,0,c.width,c.height);
        t+=0.015;
        ctx.strokeStyle='rgba(239,68,68,0.3)';
        ctx.lineWidth=2;
        ctx.beginPath();
        for(let i=0;i<pts.length;i++){
            let p1=pts[i];
            let x1=p1.x*c.width + Math.sin(t+i)*15;
            let y1=p1.y*c.height + Math.cos(t+i)*15;
            if(i===0) ctx.moveTo(x1,y1);
            else ctx.lineTo(x1,y1);
            if(i===pts.length-1) ctx.lineTo(pts[0].x*c.width + Math.sin(t)*15, pts[0].y*c.height + Math.cos(t)*15);
        }
        ctx.stroke();
        requestAnimationFrame(draw);
    }
    draw();
}

function dist(p1, p2){
    return Math.hypot(p1.x-p2.x, p1.y-p2.y);
}

function calcCost(path){
    let d=0;
    for(let i=0;i<path.length;i++){
        d += dist(points[path[i]], points[path[(i+1)%path.length]]);
    }
    return d;
}

function genPoints(){
    let scenario = U('selScenario').value;
    points=[];
    if(scenario === 'standard'){
        for(let i=0;i<50;i++) points.push({x:0.05+Math.random()*0.9, y:0.05+Math.random()*0.9});
    }else{
        for(let i=0;i<20;i++) points.push({x:0.1+Math.random()*0.3, y:0.1+Math.random()*0.8});
        for(let i=0;i<20;i++) points.push({x:0.6+Math.random()*0.3, y:0.1+Math.random()*0.8});
    }
    
    let basePath=[];
    for(let i=0;i<points.length;i++) basePath.push(i);
    
    states = [
        {name: 'Linear', id: 'Linear', color: '#ef4444', path:[...basePath], cost:calcCost(basePath), bestCost:Infinity, bestPath:[], T:maxT, acceptCount:0, tryCount:0, probHist:[], costHist:[]},
        {name: 'Exp', id: 'Exp', color: '#06b6d4', path:[...basePath], cost:calcCost(basePath), bestCost:Infinity, bestPath:[], T:maxT, acceptCount:0, tryCount:0, probHist:[], costHist:[]},
        {name: 'Log', id: 'Log', color: '#22c55e', path:[...basePath], cost:calcCost(basePath), bestCost:Infinity, bestPath:[], T:maxT, acceptCount:0, tryCount:0, probHist:[], costHist:[]},
        {name: 'Adapt', id: 'Adapt', color: '#a855f7', path:[...basePath], cost:calcCost(basePath), bestCost:Infinity, bestPath:[], T:maxT, acceptCount:0, tryCount:0, probHist:[], costHist:[], stuckCount:0}
    ];
    
    states.forEach(s => {
        s.bestCost = s.cost;
        s.bestPath = [...s.path];
    });
    
    iter = 0;
    running = false;
    if(reqId) cancelAnimationFrame(reqId);
    drawAllScenarios();
    drawChart();
    U('saStatus').innerText = "Generated new scenario. Ready to run.";
    U('saStatus').className = "sa-status";
    U('btnRun').innerHTML = '<i class="fas fa-play"></i> Run All Schedules';
    U('btnRun').disabled = false;
}

function updateT(){
    let progress = iter/maxIter;
    
    states[0].T = Math.max(0.01, maxT * (1 - progress));
    
    states[1].T = Math.max(0.01, maxT * Math.pow(0.99975, iter));
    
    states[2].T = (maxT * 2) / Math.log(2 + iter);
    
    if(iter % 500 === 0 && iter > 0){
        let ar = states[3].acceptCount / (states[3].tryCount+1);
        if(ar < 0.05) states[3].stuckCount++;
        else states[3].stuckCount = 0;
        
        if(states[3].stuckCount > 3 && progress < 0.8) {
            states[3].T = Math.min(maxT, states[3].T * 4); 
            states[3].stuckCount = 0;
        }
    }
    states[3].T = Math.max(0.01, states[3].T * 0.9998);
}

function stepSA(s){
    s.tryCount++;
    let i = Math.floor(Math.random()*points.length);
    let j = Math.floor(Math.random()*points.length);
    if(i===j) return 0;
    
    let nPath = [...s.path];
    let temp = nPath[i]; nPath[i] = nPath[j]; nPath[j] = temp;
    
    let nCost = calcCost(nPath);
    let delta = nCost - s.cost;
    
    let accept = false;
    let prob = 0;
    if(delta < 0){
        accept = true;
        prob = 1;
    } else {
        prob = Math.exp(-delta / (s.T + 0.0001));
        if(Math.random() < prob) accept = true;
    }
    
    if(accept){
        s.path = nPath;
        s.cost = nCost;
        s.acceptCount++;
        if(nCost < s.bestCost){
            s.bestCost = nCost;
            s.bestPath = [...nPath];
        }
    }
    return prob;
}

function runLoop(){
    if(iter >= maxIter){
        running = false;
        U('saStatus').innerText = "Complete! Compare the final costs and the acceptance probability charts.";
        U('saStatus').className = "sa-status good";
        U('btnRun').innerHTML = '<i class="fas fa-redo"></i> Restart';
        drawAllScenarios();
        drawChart();
        return;
    }
    
    let batch = 500;
    let pSums = [0,0,0,0];
    
    for(let b=0; b<batch; b++){
        updateT();
        states.forEach((s, idx) => {
            pSums[idx] += stepSA(s);
        });
        iter++;
        if(iter >= maxIter) break;
    }
    
    states.forEach((s, idx) => {
        s.probHist.push(pSums[idx] / batch);
        s.costHist.push(s.bestCost);
    });
    
    drawAllScenarios();
    drawChart();
    
    if(running) reqId = requestAnimationFrame(runLoop);
}

function drawAllScenarios(){
    states.forEach(s => {
        let cvs = U(`canvas${s.id}`);
        if(!cvs) return;
        let w = cvs.parentElement.clientWidth;
        let h = cvs.parentElement.clientHeight;
        if(cvs.width !== w || cvs.height !== h){
            cvs.width = w; cvs.height = h;
        }
        let ctx = cvs.getContext('2d');
        ctx.clearRect(0,0,w,h);
        
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for(let i=0; i<s.bestPath.length; i++){
            let p = points[s.bestPath[i]];
            if(i===0) ctx.moveTo(p.x*w, p.y*h);
            else ctx.lineTo(p.x*w, p.y*h);
        }
        let f = points[s.bestPath[0]];
        ctx.lineTo(f.x*w, f.y*h);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        for(let i=0; i<points.length; i++){
            ctx.beginPath();
            ctx.arc(points[i].x*w, points[i].y*h, 3, 0, Math.PI*2);
            ctx.fill();
        }
        
        U(`cost${s.id}`).innerText = `Cost: ${s.bestCost.toFixed(2)}`;
        U(`temp${s.id}`).innerText = s.T.toFixed(1);
        
        let ar = (s.tryCount>0) ? (s.acceptCount / s.tryCount) : 0;
        U(`prob${s.id}`).innerText = (ar*100).toFixed(1)+'%';
    });
}

function drawChart(){
    let cvs = U('chartCanvas');
    if(!cvs) return;
    let w = cvs.parentElement.clientWidth;
    let h = cvs.parentElement.clientHeight;
    if(cvs.width !== w || cvs.height !== h){
        cvs.width = w; cvs.height = h;
    }
    let ctx = cvs.getContext('2d');
    ctx.clearRect(0,0,w,h);
    
    if(!states[0].probHist.length) return;
    
    ctx.lineWidth = 2;
    states.forEach(s => {
        ctx.strokeStyle = s.color;
        ctx.beginPath();
        for(let i=0; i<s.probHist.length; i++){
            let x = (i / (maxIter/500)) * w;
            let y = h - s.probHist[i] * h;
            if(i===0) ctx.moveTo(x,y);
            else ctx.lineTo(x,y);
        }
        ctx.stroke();
    });
}

U('btnNew').addEventListener('click', genPoints);
U('selScenario').addEventListener('change', genPoints);
U('btnRun').addEventListener('click', ()=>{
    if(iter >= maxIter) genPoints();
    if(running){
        running = false;
        U('btnRun').innerHTML = '<i class="fas fa-play"></i> Resume';
    }else{
        running = true;
        U('saStatus').innerText = "Running optimization races...";
        U('saStatus').className = "sa-status warn";
        U('btnRun').innerHTML = '<i class="fas fa-pause"></i> Pause';
        runLoop();
    }
});

document.addEventListener('DOMContentLoaded', ()=>{
    initHeroCanvas();
    genPoints();
});
