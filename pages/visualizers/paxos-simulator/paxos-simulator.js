/* paxos-simulator.js */

const UI = {
    proposerSelect: document.getElementById('proposerSelect'),
    proposalVal: document.getElementById('proposalVal'),
    btnPropose: document.getElementById('btnPropose'),
    btnDuel: document.getElementById('btnDuel'),
    btnPartition: document.getElementById('btnPartition'),
    btnHeal: document.getElementById('btnHeal'),
    statRound: document.getElementById('statRound'),
    statConsensus: document.getElementById('statConsensus'),
    logTerminal: document.getElementById('logTerminal'),
    canvas: document.getElementById('paxosCanvas')
};

const ctx = UI.canvas.getContext('2d');
let cw, ch;

function resize() {
    cw = UI.canvas.width = UI.canvas.parentElement.clientWidth;
    ch = UI.canvas.height = UI.canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resize);
resize();

function log(msg, type = '') {
    const div = document.createElement('div');
    div.className = `log-entry ${type ? 'log-' + type : ''}`;
    div.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    UI.logTerminal.appendChild(div);
    UI.logTerminal.scrollTop = UI.logTerminal.scrollHeight;
}

// Network state & layout
let nodes = [];
let packets = [];
let networkPartitioned = false;

// Consensus variables
let consensusValue = null;

class Node {
    constructor(id, name, type, x, y) {
        this.id = id;
        this.name = name;
        this.type = type; // 'proposer', 'acceptor', 'learner'
        this.x = x;
        this.y = y;
        this.radius = 25;
        
        // Paxos states
        this.ballotNum = 0;
        this.proposalVal = null;
        this.promises = []; // for proposers: array of Promise replies
        this.accepts = [];  // for learners: array of Accept replies
        
        // Acceptor Paxos states
        this.promisedBallot = 0;
        this.acceptedBallot = 0;
        this.acceptedValue = null;
        
        this.status = 'active'; // 'active', 'partitioned'
        this.isLeader = false; // Multi-Paxos stable leader
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        if (this.type === 'proposer') ctx.fillStyle = '#0366d6';
        else if (this.type === 'acceptor') ctx.fillStyle = '#f05033';
        else ctx.fillStyle = '#3fb950';
        
        ctx.fill();
        ctx.strokeStyle = this.status === 'partitioned' ? '#d73a49' : '#fff';
        ctx.lineWidth = this.status === 'partitioned' ? 3 : 1;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Poppins';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, this.x, this.y - 5);

        // Subtext / State details below node
        ctx.font = '9px Fira Code';
        if (this.type === 'proposer') {
            ctx.fillText(`Bal: ${this.ballotNum}`, this.x, this.y + 12);
            if (this.isLeader) {
                ctx.fillStyle = '#f1e05a'; // Gold star for leader
                ctx.fillText('★ LEADER', this.x, this.y + 22);
            }
        } else if (this.type === 'acceptor') {
            ctx.fillText(`P:${this.promisedBallot} A:${this.acceptedBallot}`, this.x, this.y + 10);
            ctx.fillText(this.acceptedValue ? `V:${this.acceptedValue}` : 'V:null', this.x, this.y + 18);
        } else if (this.type === 'learner') {
            ctx.fillText(consensusValue ? `Val: ${consensusValue}` : 'Val: none', this.x, this.y + 12);
        }
    }
}

class Packet {
    constructor(fromNode, toNode, phase, data, color) {
        this.from = fromNode;
        this.to = toNode;
        this.phase = phase; // 'prepare', 'promise', 'accept', 'accepted'
        this.data = data;
        this.progress = 0;
        this.color = color;
    }
    
    update() {
        this.progress += 0.02; // Packet Speed
        if (this.progress >= 1) {
            deliverPacket(this);
            return true; // Remove packet
        }
        return false;
    }

    draw(ctx) {
        // Draw dashed connection line
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        const px = this.from.x + (this.to.x - this.from.x) * this.progress;
        const py = this.from.y + (this.to.y - this.from.y) * this.progress;
        
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.font = '8px Fira Code';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.phase.toUpperCase(), px, py - 10);
    }
}

function initCluster() {
    nodes = [];
    packets = [];
    consensusValue = null;
    networkPartitioned = false;
    UI.statConsensus.innerText = '-';
    UI.statRound.innerText = '0';

    // Layout (Proposers on Left, Acceptors in Center, Learner on Right)
    nodes.push(new Node(1, 'P1', 'proposer', 100, 150));
    nodes.push(new Node(2, 'P2', 'proposer', 100, 300));
    
    nodes.push(new Node(3, 'A1', 'acceptor', 300, 100));
    nodes.push(new Node(4, 'A2', 'acceptor', 300, 225));
    nodes.push(new Node(5, 'A3', 'acceptor', 300, 350));
    
    nodes.push(new Node(6, 'L1', 'learner', 500, 225));
    
    log("Paxos cluster initialized.");
}

function sendPacket(from, to, phase, data, color) {
    // If partitioned, don't allow crossing the barrier
    if (networkPartitioned) {
        // Acceptor 3 (A3) is partitioned from P1, A1, A2
        if ((from.name === 'A3' || to.name === 'A3') && (from.name === 'P1' || to.name === 'P1' || from.name === 'A1' || to.name === 'A1' || from.name === 'A2' || to.name === 'A2')) {
            log(`Network Partition: Message ${phase.toUpperCase()} between ${from.name} and ${to.name} was dropped.`, "error");
            return;
        }
    }
    packets.push(new Packet(from, to, phase, data, color));
}

function startPaxosRound(proposerId, val) {
    const proposer = nodes.find(n => n.id === proposerId);
    proposer.proposalVal = val;
    proposer.promises = [];
    
    // Multi-Paxos: If this proposer is already the stable leader, skip PREPARE
    if (proposer.isLeader) {
        log(`[Multi-Paxos] Proposer ${proposer.name} is stable leader. Skipping PREPARE phase.`, "info");
        log(`[Phase 2a] Proposer ${proposer.name} broadcasts ACCEPT(${proposer.ballotNum}, "${proposer.proposalVal}")`, "info");
        
        nodes.filter(n => n.type === 'acceptor').forEach(acceptor => {
            sendPacket(proposer, acceptor, 'accept', { ballot: proposer.ballotNum, value: proposer.proposalVal }, '#0366d6');
        });
        return;
    }
    
    proposer.ballotNum = proposer.ballotNum + Math.floor(Math.random() * 3) + 1; // Increment ballot
    
    log(`[Phase 1a] Proposer ${proposer.name} broadcasts PREPARE with Ballot ID: ${proposer.ballotNum}`, "info");
    UI.statRound.innerText = proposer.ballotNum;

    // Send PREPARE to all Acceptors
    nodes.filter(n => n.type === 'acceptor').forEach(acceptor => {
        sendPacket(proposer, acceptor, 'prepare', { ballot: proposer.ballotNum }, '#0366d6');
    });
}

function deliverPacket(packet) {
    const to = packet.to;
    const from = packet.from;
    const data = packet.data;

    if (packet.phase === 'prepare') {
        // Acceptor receives PREPARE
        log(`Acceptor ${to.name} received PREPARE(${data.ballot}) from ${from.name}`);
        if (data.ballot > to.promisedBallot) {
            to.promisedBallot = data.ballot;
            log(`Acceptor ${to.name} promises not to accept ballots < ${data.ballot}`, "success");
            // Reply with PROMISE containing highest accepted ballot and value
            sendPacket(to, from, 'promise', { 
                promisedBallot: to.promisedBallot,
                acceptedBallot: to.acceptedBallot,
                acceptedValue: to.acceptedValue
            }, '#f05033');
        } else {
            log(`Acceptor ${to.name} rejected PREPARE(${data.ballot}) (already promised to ${to.promisedBallot})`, "error");
        }
    } 
    else if (packet.phase === 'promise') {
        // Proposer receives PROMISE
        to.promises.push(data);
        log(`Proposer ${to.name} received PROMISE from Acceptor ${from.name} (Count: ${to.promises.length}/3)`);

            const majority = 2;
        if (to.promises.length === majority) {
            // Upon achieving majority, this proposer becomes the stable leader (Multi-Paxos)
            to.isLeader = true;
            log(`Proposer ${to.name} achieved majority promises. Elected as Stable Leader!`, "success");
            
            // Find promise with highest acceptedBallot
            let highestBallot = -1;
            let valueToPropose = to.proposalVal;
            to.promises.forEach(p => {
                if (p.acceptedBallot > highestBallot && p.acceptedValue !== null) {
                    highestBallot = p.acceptedBallot;
                    valueToPropose = p.acceptedValue;
                }
            });

            if (valueToPropose !== to.proposalVal && highestBallot !== -1) {
                log(`[Phase 2a] Proposer ${to.name} must respect previous value: ${valueToPropose} (overriding local choice ${to.proposalVal})`, "warn");
                to.proposalVal = valueToPropose;
            } else {
                log(`[Phase 2a] No previous values accepted. Proposer ${to.name} broadcasts ACCEPT(${to.ballotNum}, "${to.proposalVal}")`, "info");
            }

            // Send ACCEPT to all Acceptors
            nodes.filter(n => n.type === 'acceptor').forEach(acceptor => {
                sendPacket(to, acceptor, 'accept', { ballot: to.ballotNum, value: to.proposalVal }, '#0366d6');
            });
        }
    } 
    else if (packet.phase === 'accept') {
        // Acceptor receives ACCEPT
        log(`Acceptor ${to.name} received ACCEPT(${data.ballot}, "${data.value}") from ${from.name}`);
        if (data.ballot >= to.promisedBallot) {
            to.promisedBallot = data.ballot;
            to.acceptedBallot = data.ballot;
            to.acceptedValue = data.value;
            log(`Acceptor ${to.name} accepted ballot ${data.ballot} with value "${data.value}"`, "success");

            // Broadcast ACCEPTED to Learner
            const learner = nodes.find(n => n.type === 'learner');
            sendPacket(to, learner, 'accepted', { ballot: data.ballot, value: data.value }, '#3fb950');
        } else {
            log(`Acceptor ${to.name} rejected ACCEPT (ballot ${data.ballot} is less than promised ${to.promisedBallot})`, "error");
            // If an ACCEPT is rejected, it means another proposer became leader with a higher ballot.
            if (from.isLeader) {
                from.isLeader = false;
                log(`Proposer ${from.name} lost leadership status!`, "error");
            }
        }
    } 
    else if (packet.phase === 'accepted') {
        // Learner receives ACCEPTED
        if (!to.accepts[data.ballot]) to.accepts[data.ballot] = [];
        to.accepts[data.ballot].push(data);
        
        log(`Learner ${to.name} received ACCEPTED from ${from.name} (Count: ${to.accepts[data.ballot].length}/3)`);
        
        const majority = 2;
        if (to.accepts[data.ballot].length === majority && !consensusValue) {
            consensusValue = data.value;
            UI.statConsensus.innerText = consensusValue;
            log(`CONSENSUS ACHIEVED! Node cluster agreed on value: "${consensusValue}"`, "success");
        }
    }
}

// Simulation loop
function render() {
    ctx.clearRect(0, 0, cw, ch);
    
    // Draw partition line if active
    if (networkPartitioned) {
        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.moveTo(0, 290);
        ctx.lineTo(cw, 290);
        ctx.strokeStyle = '#d73a49';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#d73a49';
        ctx.font = '10px Fira Code';
        ctx.fillText("NETWORK PARTITION", 70, 280);
    }

    // Update packets; new packets created during delivery are pushed
    // to the new `packets` array by sendPacket, so they survive the frame.
    const currentPackets = packets;
    packets = [];
    for (const p of currentPackets) {
        if (!p.update()) {
            packets.push(p);
        }
    }
    packets.forEach(p => p.draw(ctx));

    // Draw nodes
    nodes.forEach(n => n.draw(ctx));

    requestAnimationFrame(render);
}

// Wire Event Listeners
UI.btnPropose.addEventListener('click', () => {
    const propId = parseInt(UI.proposerSelect.value);
    const val = UI.proposalVal.value.trim();
    if (!val) return;
    startPaxosRound(propId, val);
});

UI.btnDuel.addEventListener('click', () => {
    log("Dueling Proposers Scenario triggered!", "warn");
    // Trigger P1 and P2 in rapid succession to create continuous ballot collisions
    startPaxosRound(1, "Val_P1");
    setTimeout(() => {
        startPaxosRound(2, "Val_P2");
    }, 800);
});

UI.btnPartition.addEventListener('click', () => {
    networkPartitioned = true;
    nodes.find(n => n.name === 'A3').status = 'partitioned';
    UI.btnPartition.style.display = 'none';
    UI.btnHeal.style.display = 'block';
    log("Acceptor A3 has been partitioned from Proposer P1 and Acceptors A1/A2.", "error");
});

UI.btnHeal.addEventListener('click', () => {
    networkPartitioned = false;
    nodes.find(n => n.name === 'A3').status = 'active';
    UI.btnPartition.style.display = 'block';
    UI.btnHeal.style.display = 'none';
    log("Network partition healed. Full connectivity restored.", "success");
});

// Init
initCluster();
render();
