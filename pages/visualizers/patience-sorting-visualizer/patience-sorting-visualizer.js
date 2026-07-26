const U=document.getElementById.bind(document);
const C=document.createElement.bind(document);
let seq=[];
let piles=[];
let cards=[];
let activeIdx=0;
let playing=false;
let timer=null;

function initHeroCanvas(){
    const c=U('psHeroCanvas');
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
        ctx.strokeStyle='rgba(34,197,94,0.2)';
        ctx.lineWidth=2;
        for(let i=0;i<5;i++){
            let h=40+Math.sin(t+i)*20;
            ctx.strokeRect(c.width/2 - 100 + i*40, c.height/2 - h/2, 30, h);
        }
        requestAnimationFrame(draw);
    }
    draw();
}

function randSeq(){
    let a=[];
    for(let i=0;i<12;i++) a.push(Math.floor(Math.random()*90)+10);
    return a;
}

function ascSeq(){
    return [10,20,30,40,50,60,70,80,90,100,110,120];
}

function descSeq(){
    return [120,110,100,90,80,70,60,50,40,30,20,10];
}

function parseCustom(s){
    let p=s.split(',').map(x=>parseInt(x.trim())).filter(x=>!isNaN(x));
    return p.length?p:randSeq();
}

function resetArena(){
    clearTimeout(timer);
    playing=false;
    U('btnPlay').innerHTML='<i class="fas fa-play"></i> Auto Deal';
    U('btnPlay').disabled=false;
    U('btnStep').disabled=false;
    U('lisResult').style.display='none';
    U('lisSequenceBox').innerHTML='';
    U('pileCountBadge').innerText='0 Piles';
    
    let sel=U('selSeq').value;
    if(sel==='random') seq=randSeq();
    else if(sel==='asc') seq=ascSeq();
    else if(sel==='desc') seq=descSeq();
    else seq=parseCustom(U('customInput').value);
    
    piles=[];
    cards=[];
    activeIdx=0;
    
    const dc=U('deckContainer');
    dc.innerHTML='';
    seq.forEach((val,i)=>{
        let d=C('div');
        d.className='ps-card';
        d.id=`deck-card-${i}`;
        d.innerText=val;
        dc.appendChild(d);
        cards.push({val, deckEl:d, pileIdx:-1, backPtr:null, el:null});
    });
    
    U('pilesContainer').innerHTML='';
    document.querySelectorAll('.ps-pointer').forEach(e=>e.remove());
    U('psStatus').className='ps-status';
    U('psStatus').innerText='Ready to deal. Click Step or Auto Deal to begin.';
}

U('selSeq').addEventListener('change',(e)=>{
    U('customInput').style.display=e.target.value==='custom'?'inline-block':'none';
    resetArena();
});
U('btnNew').addEventListener('click',resetArena);

function renderPiles(){
    const pc=U('pilesContainer');
    pc.innerHTML='';
    piles.forEach((p,pi)=>{
        let pEl=C('div');
        pEl.className='ps-pile';
        pEl.id=`pile-${pi}`;
        let pTitle=C('div');
        pTitle.className='ps-pile-idx';
        pTitle.innerText=`Pile ${pi+1}`;
        pEl.appendChild(pTitle);
        
        p.forEach((cItem,ci)=>{
            let wp=C('div');
            wp.className='ps-card-in-pile';
            let crd=C('div');
            crd.className='ps-card';
            crd.innerText=cItem.val;
            crd.id=`pile-card-${pi}-${ci}`;
            cItem.el=crd;
            wp.appendChild(crd);
            pEl.appendChild(wp);
        });
        pc.appendChild(pEl);
    });
    U('pileCountBadge').innerText=`${piles.length} Piles`;
}

function drawPointers(){
    document.querySelectorAll('.ps-pointer').forEach(e=>e.remove());
    let cardEls = [];
    piles.forEach(p=>p.forEach(c=>{if(c.el) cardEls.push(c);}));
    
    cardEls.forEach(c=>{
        if(c.backPtr && c.backPtr.el && c.el){
            let r1=c.el.getBoundingClientRect();
            let r2=c.backPtr.el.getBoundingClientRect();
            let pc=U('pilesContainer').getBoundingClientRect();
            
            let x1=r1.left-pc.left + r1.width/2;
            let y1=r1.top-pc.top + r1.height/2;
            let x2=r2.left-pc.left + r2.width/2;
            let y2=r2.top-pc.top + r2.height/2;
            
            let len=Math.hypot(x2-x1, y2-y1);
            let ang=Math.atan2(y2-y1, x2-x1);
            
            let pLine=C('div');
            pLine.className='ps-pointer';
            pLine.style.width=`${len}px`;
            pLine.style.left=`${x1}px`;
            pLine.style.top=`${y1}px`;
            pLine.style.transform=`rotate(${ang}rad)`;
            if(c.el.classList.contains('lis-path')) pLine.classList.add('active');
            
            U('pilesContainer').appendChild(pLine);
        }
    });
}

function reconstructLIS(){
    if(!piles.length) return;
    let curr = piles[piles.length-1][piles[piles.length-1].length-1];
    let lis=[];
    while(curr){
        curr.el.classList.add('lis-path');
        lis.push(curr.val);
        curr=curr.backPtr;
    }
    lis.reverse();
    drawPointers();
    
    U('lisResult').style.display='block';
    const lb=U('lisSequenceBox');
    lb.innerHTML='';
    lis.forEach(v=>{
        let d=C('div');
        d.className='ps-lis-item';
        d.innerText=v;
        lb.appendChild(d);
    });
    U('psStatus').className='ps-status good';
    U('psStatus').innerHTML=`<b>Complete!</b> Final pile count is ${piles.length}, so LIS length is ${piles.length}. Tracing back-pointers reveals the exact sequence.`;
}

function doStep(){
    if(activeIdx >= cards.length){
        playing=false;
        U('btnPlay').innerHTML='<i class="fas fa-play"></i> Auto Deal';
        U('btnPlay').disabled=true;
        U('btnStep').disabled=true;
        reconstructLIS();
        return;
    }
    
    if(activeIdx>0){
        cards[activeIdx-1].deckEl.classList.remove('active');
        cards[activeIdx-1].deckEl.classList.add('done');
    }
    
    let cur = cards[activeIdx];
    cur.deckEl.classList.add('active');
    
    let l=0, r=piles.length-1;
    let ans=piles.length;
    let steps=[];
    
    while(l<=r){
        let m=Math.floor((l+r)/2);
        steps.push(m);
        let topCard = piles[m][piles[m].length-1];
        if(topCard.val >= cur.val){
            ans=m;
            r=m-1;
        }else{
            l=m+1;
        }
    }
    
    cur.pileIdx=ans;
    if(ans>0) cur.backPtr = piles[ans-1][piles[ans-1].length-1];
    
    let animLoop = (stepIdx) => {
        if(stepIdx < steps.length){
            let m=steps[stepIdx];
            let msg=`Binary Search: Checking Pile ${m+1} top card (${piles[m][piles[m].length-1].val}) against ${cur.val}.`;
            U('psStatus').innerText=msg;
            
            document.querySelectorAll('.ps-card').forEach(e=>e.classList.remove('checking'));
            let crd = piles[m][piles[m].length-1].el;
            if(crd) crd.classList.add('checking');
            
            if(playing) timer=setTimeout(()=>animLoop(stepIdx+1), 600);
        } else {
            document.querySelectorAll('.ps-card').forEach(e=>e.classList.remove('checking'));
            if(ans===piles.length){
                piles.push([cur]);
                U('psStatus').innerText=`Placed ${cur.val} in a NEW Pile ${ans+1} (no existing pile top was >= ${cur.val}).`;
            }else{
                piles[ans].push(cur);
                U('psStatus').innerText=`Placed ${cur.val} on Pile ${ans+1} (leftmost pile with top >= ${cur.val}).`;
            }
            renderPiles();
            setTimeout(drawPointers, 50);
            activeIdx++;
            if(playing) timer=setTimeout(doStep, 600);
        }
    };
    
    animLoop(0);
}

U('btnStep').addEventListener('click',()=>{
    playing=false;
    clearTimeout(timer);
    U('btnPlay').innerHTML='<i class="fas fa-play"></i> Auto Deal';
    doStep();
});

U('btnPlay').addEventListener('click',()=>{
    if(playing){
        playing=false;
        clearTimeout(timer);
        U('btnPlay').innerHTML='<i class="fas fa-play"></i> Auto Deal';
    }else{
        playing=true;
        U('btnPlay').innerHTML='<i class="fas fa-pause"></i> Pause';
        doStep();
    }
});

document.addEventListener('DOMContentLoaded', ()=>{
    initHeroCanvas();
    resetArena();
});
