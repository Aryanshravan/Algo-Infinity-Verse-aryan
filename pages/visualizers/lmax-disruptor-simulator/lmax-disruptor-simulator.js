document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('disruptorCanvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const publishBtn = document.getElementById('publishBtn');
  const consumeBtn = document.getElementById('consumeBtn');
  const resetBtn = document.getElementById('resetBtn');
  const ringSizeSelect = document.getElementById('ringSizeSelect');
  const cachePaddingToggle = document.getElementById('cachePaddingToggle');
  const cachePaddingState = document.getElementById('cachePaddingState');

  const cursorStat = document.getElementById('cursorStat');
  const consumerStat = document.getElementById('consumerStat');
  const throughputStat = document.getElementById('throughputStat');

  const cacheView = document.getElementById('cacheView');
  const falseSharingAlert = document.getElementById('falseSharingAlert');
  const opLog = document.getElementById('opLog');
  const statusMsg = document.getElementById('disruptorStatus');

  // State
  let ringSize = 16;
  let cursor = 0; // Producer sequence
  let consumerSeq = 0; // Consumer sequence
  let slots = new Array(ringSize).fill(null);
  let cachePadding = true;

  // Setup Canvas
  function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight || 400;
    draw();
  }

  window.addEventListener('resize', resizeCanvas);

  function init() {
    ringSize = parseInt(ringSizeSelect.value, 10);
    cursor = 0;
    consumerSeq = 0;
    slots = new Array(ringSize).fill(null);
    cachePadding = cachePaddingToggle.checked;

    updateStats();
    renderCacheView();
    clearLog();
    logMsg('sys', 'Simulator initialized');
    statusMsg.innerText = "Ready. Click 'Publish Event' to start filling the Ring Buffer.";

    resizeCanvas();
  }

  // Ring Buffer Math
  function getSlotIndex(seq) {
    // Usually bitwise AND is used (seq & (ringSize - 1)), but modulo works here
    return seq % ringSize;
  }

  // Draw Ring Buffer
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const isDark =
      document.documentElement.getAttribute('data-color-mode') === 'dark' ||
      document.body.classList.contains('dark-mode');

    const textColor = isDark ? '#e5e7eb' : '#1f2937';
    const emptyColor = isDark ? '#374151' : '#e5e7eb';
    const filledColor = '#22c55e';
    const producerColor = '#3b82f6';
    const consumerColor = '#ef4444';

    // Draw slots
    for (let i = 0; i < ringSize; i++) {
      const angle = (i / ringSize) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Slot background
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = slots[i] !== null ? filledColor : emptyColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isDark ? '#4b5563' : '#d1d5db';
      ctx.stroke();

      // Slot index text
      ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i.toString(), x, y);
    }

    // Draw Consumer cursor (inner circle)
    const consIdx = getSlotIndex(consumerSeq);
    const consAngle = (consIdx / ringSize) * Math.PI * 2 - Math.PI / 2;
    const consX = centerX + Math.cos(consAngle) * (radius - 30);
    const consY = centerY + Math.sin(consAngle) * (radius - 30);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(consX, consY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = consumerColor;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(consX, consY, 8, 0, Math.PI * 2);
    ctx.fillStyle = consumerColor;
    ctx.fill();

    // Draw Producer cursor (outer circle)
    const prodIdx = getSlotIndex(cursor);
    const prodAngle = (prodIdx / ringSize) * Math.PI * 2 - Math.PI / 2;
    const prodX = centerX + Math.cos(prodAngle) * (radius + 30);
    const prodY = centerY + Math.sin(prodAngle) * (radius + 30);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(prodX, prodY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = producerColor;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(prodX, prodY, 8, 0, Math.PI * 2);
    ctx.fillStyle = producerColor;
    ctx.fill();

    // Draw Center text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('LMAX Disruptor', centerX, centerY - 10);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
    ctx.fillText(`Size: ${ringSize}`, centerX, centerY + 10);
  }

  // Actions
  function publishEvent() {
    if (cursor - consumerSeq >= ringSize) {
      statusMsg.innerText = 'Ring Buffer is FULL! Consumer must process events first.';
      statusMsg.style.borderColor = '#ef4444';
      logMsg('sys', 'Publish failed: Buffer Full');
      return;
    }

    const idx = getSlotIndex(cursor);
    slots[idx] = `Event-${cursor}`;

    logMsg('pub', `Published event at sequence ${cursor} (slot ${idx})`);
    cursor++;

    updateStats();
    draw();
    renderCacheView();
    checkFalseSharing();
  }

  function consumeEvent() {
    if (consumerSeq >= cursor) {
      statusMsg.innerText = 'Ring Buffer is EMPTY! Waiting for Producer.';
      statusMsg.style.borderColor = '#3b82f6';
      logMsg('sys', 'Consume failed: Buffer Empty');
      return;
    }

    const idx = getSlotIndex(consumerSeq);
    const event = slots[idx];
    slots[idx] = null; // clear slot

    logMsg('sub', `Consumed ${event} at sequence ${consumerSeq} (slot ${idx})`);
    consumerSeq++;

    updateStats();
    draw();
    renderCacheView();
    checkFalseSharing();
  }

  // Cache Line Visualization
  function renderCacheView() {
    cacheView.innerHTML = '';

    // We visualize two cache lines.
    // If padding is ON, cursor and consumerSeq are in different cache lines.
    // If OFF, they share the same cache line.

    if (cachePadding) {
      // Line 1: cursor + padding
      const line1 = document.createElement('div');
      line1.className = 'cache-line';

      const cursorBlock = document.createElement('div');
      cursorBlock.className = 'cache-block active-cursor';
      cursorBlock.innerText = `cursor: ${cursor}`;
      line1.appendChild(cursorBlock);

      for (let i = 0; i < 7; i++) {
        const pad = document.createElement('div');
        pad.className = 'cache-block padding';
        pad.innerText = 'pad';
        line1.appendChild(pad);
      }
      cacheView.appendChild(line1);

      // Line 2: consumerSeq + padding
      const line2 = document.createElement('div');
      line2.className = 'cache-line';

      const consBlock = document.createElement('div');
      consBlock.className = 'cache-block active-consumer';
      consBlock.innerText = `consSeq: ${consumerSeq}`;
      line2.appendChild(consBlock);

      for (let i = 0; i < 7; i++) {
        const pad = document.createElement('div');
        pad.className = 'cache-block padding';
        pad.innerText = 'pad';
        line2.appendChild(pad);
      }
      cacheView.appendChild(line2);
    } else {
      // Line 1: cursor + consumerSeq shared
      const line1 = document.createElement('div');
      line1.className = 'cache-line';

      const cursorBlock = document.createElement('div');
      cursorBlock.className = 'cache-block active-cursor';
      cursorBlock.innerText = `cursor: ${cursor}`;
      line1.appendChild(cursorBlock);

      const consBlock = document.createElement('div');
      consBlock.className = 'cache-block active-consumer';
      consBlock.innerText = `consSeq: ${consumerSeq}`;
      line1.appendChild(consBlock);

      for (let i = 0; i < 6; i++) {
        const other = document.createElement('div');
        other.className = 'cache-block';
        other.innerText = 'data';
        line1.appendChild(other);
      }
      cacheView.appendChild(line1);
    }
  }

  function checkFalseSharing() {
    if (!cachePadding) {
      falseSharingAlert.classList.remove('hidden');
      throughputStat.innerText = 'Low (False Sharing)';
      throughputStat.style.color = '#ef4444';
      statusMsg.innerText = 'False sharing occurs! CPU must invalidate cache line repeatedly.';
      statusMsg.style.borderColor = '#ef4444';
    } else {
      falseSharingAlert.classList.add('hidden');
      throughputStat.innerText = '6M+ op/s (Optimal)';
      throughputStat.style.color = '#22c55e';
      statusMsg.innerText = 'Mechanical Sympathy achieved. Sequences are on separate cache lines.';
      statusMsg.style.borderColor = '#22c55e';
    }
  }

  function updateStats() {
    cursorStat.innerText = cursor;
    consumerStat.innerText = consumerSeq;
  }

  function logMsg(type, msg) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const time = document.createElement('span');
    time.className = 'log-time';
    const now = new Date();
    time.innerText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const text = document.createElement('span');
    text.className = `log-action ${type}`;
    text.innerText = msg;

    entry.appendChild(time);
    entry.appendChild(text);

    if (opLog.querySelector('.disruptor-log-empty')) {
      opLog.innerHTML = '';
    }

    opLog.prepend(entry);

    // Keep only last 50 logs
    while (opLog.children.length > 50) {
      opLog.removeChild(opLog.lastChild);
    }
  }

  function clearLog() {
    opLog.innerHTML = '<div class="disruptor-log-empty">No operations yet.</div>';
  }

  // Event Listeners
  publishBtn.addEventListener('click', publishEvent);
  consumeBtn.addEventListener('click', consumeEvent);

  resetBtn.addEventListener('click', init);

  ringSizeSelect.addEventListener('change', init);

  cachePaddingToggle.addEventListener('change', (e) => {
    cachePadding = e.target.checked;
    cachePaddingState.innerText = cachePadding ? 'Cache-Line Padding ON' : 'Cache-Line Padding OFF';
    renderCacheView();
    checkFalseSharing();
  });

  // Init
  init();
});
