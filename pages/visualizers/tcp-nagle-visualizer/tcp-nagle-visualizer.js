document.addEventListener('DOMContentLoaded', () => {
  initVisualizer();
});

let nagleEnabled = true;
let delayedAckEnabled = true;

let unackedCount = 0;
let senderBuffer = 0;
let delayedAckTimer = 0;
let delayedAckInterval = null;
let isDeadlock = false;

// DOM Elements
let elUnackedCount, elSenderBuffer, elAckTimer;
let elSenderState, elReceiverState, elDeadlockAlert;
let elDataPipe, elAckPipe;

function initVisualizer() {
  elUnackedCount = document.getElementById('unackedCount');
  elSenderBuffer = document.getElementById('senderBuffer');
  elAckTimer = document.getElementById('ackTimer');
  elSenderState = document.getElementById('senderState');
  elReceiverState = document.getElementById('receiverState');
  elDeadlockAlert = document.getElementById('deadlockAlert');
  elDataPipe = document.getElementById('dataPipe');
  elAckPipe = document.getElementById('ackPipe');

  document.getElementById('btnSendChunk').addEventListener('click', onSendChunk);

  const btnNagle = document.getElementById('btnToggleNagle');
  btnNagle.addEventListener('click', () => {
    nagleEnabled = !nagleEnabled;
    const span = document.getElementById('nagleStatus');
    span.textContent = nagleEnabled ? 'ON' : 'OFF';
    span.className = nagleEnabled ? 'status-on' : 'status-off';
    checkSenderBuffer();
  });

  const btnDelayed = document.getElementById('btnToggleDelayedAck');
  btnDelayed.addEventListener('click', () => {
    delayedAckEnabled = !delayedAckEnabled;
    const span = document.getElementById('delayedAckStatus');
    span.textContent = delayedAckEnabled ? 'ON' : 'OFF';
    span.className = delayedAckEnabled ? 'status-on' : 'status-off';
    if (!delayedAckEnabled && delayedAckTimer > 0) {
      triggerAck();
    }
    checkDeadlock();
  });

  document.getElementById('btnReset').addEventListener('click', resetSimulation);
}

function onSendChunk() {
  senderBuffer++;
  updateUI();
  checkSenderBuffer();
}

function checkSenderBuffer() {
  if (senderBuffer === 0) return;

  if (nagleEnabled && unackedCount > 0) {
    // Nagle's rule: wait for ACK if there is unacked data
    setSenderState('Buffering (Nagle)', 'badge-warning');
  } else {
    // Can send
    const chunksToSend = senderBuffer;
    senderBuffer = 0;
    unackedCount++;
    setSenderState('Sending', 'badge-info');
    spawnPacket(chunksToSend, false);

    setTimeout(() => {
      if (senderBuffer > 0 && nagleEnabled && unackedCount > 0) {
        setSenderState('Buffering (Nagle)', 'badge-warning');
      } else {
        setSenderState('Idle', 'badge-info');
      }
    }, 500);

    updateUI();
  }
  checkDeadlock();
}

function onPacketReceived() {
  if (delayedAckEnabled) {
    if (delayedAckTimer === 0) {
      // Start delayed ACK timer (simulate 200ms with a countdown, we'll use a slower interval for visual clarity)
      delayedAckTimer = 200;
      setReceiverState('Delayed ACK Timer', 'badge-warning');
      updateUI();

      delayedAckInterval = setInterval(() => {
        delayedAckTimer -= 10; // Decrease timer for visual effect
        if (delayedAckTimer <= 0) {
          triggerAck();
        }
        updateUI();
        checkDeadlock();
      }, 100);
    } else {
      // Second packet received, send ACK immediately (Delayed ACK rule)
      triggerAck();
    }
  } else {
    // Send ACK immediately
    triggerAck();
  }
  checkDeadlock();
}

function triggerAck() {
  if (delayedAckInterval) {
    clearInterval(delayedAckInterval);
    delayedAckInterval = null;
  }
  delayedAckTimer = 0;
  setReceiverState('Sending ACK', 'badge-info');
  spawnPacket(1, true);

  setTimeout(() => {
    if (delayedAckTimer === 0) {
      setReceiverState('Idle', 'badge-info');
    }
  }, 500);

  updateUI();
}

function onAckReceived() {
  unackedCount = Math.max(0, unackedCount - 1);
  updateUI();
  checkSenderBuffer(); // Now that we have an ACK, we can send buffered data
}

function setSenderState(text, cls) {
  elSenderState.textContent = text;
  elSenderState.className = `badge ${cls}`;
}

function setReceiverState(text, cls) {
  elReceiverState.textContent = text;
  elReceiverState.className = `badge ${cls}`;
}

function checkDeadlock() {
  const senderWaiting = nagleEnabled && unackedCount > 0 && senderBuffer > 0;
  const receiverWaiting = delayedAckEnabled && delayedAckTimer > 0;

  if (senderWaiting && receiverWaiting && !isDeadlock) {
    isDeadlock = true;
    elDeadlockAlert.style.display = 'block';
  } else if ((!senderWaiting || !receiverWaiting) && isDeadlock) {
    isDeadlock = false;
    elDeadlockAlert.style.display = 'none';
  }
}

function updateUI() {
  elUnackedCount.textContent = unackedCount;
  elSenderBuffer.textContent = senderBuffer;
  elAckTimer.textContent = delayedAckTimer > 0 ? delayedAckTimer : 0;
}

function resetSimulation() {
  unackedCount = 0;
  senderBuffer = 0;
  delayedAckTimer = 0;
  if (delayedAckInterval) clearInterval(delayedAckInterval);
  delayedAckInterval = null;
  isDeadlock = false;

  document.querySelectorAll('.packet').forEach((p) => p.remove());

  setSenderState('Idle', 'badge-info');
  setReceiverState('Idle', 'badge-info');
  elDeadlockAlert.style.display = 'none';

  updateUI();
}

function spawnPacket(chunks, isAck) {
  const pipe = isAck ? elAckPipe : elDataPipe;
  const pkt = document.createElement('div');
  pkt.className = 'packet' + (isAck ? ' ack' : '');
  if (!isAck) {
    pkt.textContent = chunks; // show number of chunks
  } else {
    pkt.textContent = 'A';
  }
  pipe.appendChild(pkt);

  const startX = isAck ? pipe.clientWidth - 30 : 10;
  const endX = isAck ? 10 : pipe.clientWidth - 30;
  let pos = startX;
  const speed = isAck ? -4 : 4; // animation speed

  function animate() {
    pos += speed;
    const reachedEnd = isAck ? pos <= endX : pos >= endX;

    if (reachedEnd) {
      pkt.remove();
      if (isAck) {
        onAckReceived();
      } else {
        onPacketReceived();
      }
      return;
    }
    pkt.style.left = pos + 'px';
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
