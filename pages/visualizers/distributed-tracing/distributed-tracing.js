/**
 * distributed-tracing.js
 * Simulate Jaeger/OpenTelemetry span propagation across microservices.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTracing();
});

const els = {
  btnTrigger: document.getElementById('btnTriggerRequest'),
  waterfallBody: document.getElementById('waterfallBody'),
  currentTraceId: document.getElementById('currentTraceId'),
  nodes: {
    gw: document.getElementById('node-gateway'),
    auth: document.getElementById('node-auth'),
    billing: document.getElementById('node-billing'),
    db: document.getElementById('node-db'),
  },
};

let currentTrace = [];
let TOTAL_TIMELINE_MS = 200; // Dynamically computed per trace

function initTracing() {
  els.btnTrigger.addEventListener('click', triggerRequest);
}

function generateId() {
  return Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
}

function triggerRequest() {
  // Reset state
  els.waterfallBody.innerHTML = '';
  currentTrace = [];
  const traceId = generateId();
  els.currentTraceId.textContent = traceId;

  els.btnTrigger.disabled = true;

  // Simulate dynamic trace timings
  const timings = generateTraceTimings();
  TOTAL_TIMELINE_MS = timings.gwEnd;

  // Update timeline header dynamically
  const timelineHeader = document.getElementById('timelineHeader');
  if (timelineHeader) {
    timelineHeader.innerHTML = '';
    for (let i = 0; i <= 4; i++) {
      const span = document.createElement('span');
      span.textContent = Math.floor((TOTAL_TIMELINE_MS * i) / 4) + 'ms';
      timelineHeader.appendChild(span);
    }
  }

  const VISUAL_MULTIPLIER = 10; // Slow down for visualization
  const gwSpanId = generateId();

  // Start GW span
  addSpan('gw', 'GET /api/checkout', traceId, gwSpanId, null, 0, timings.gwEnd);
  animateNode('gw', 0, timings.gwEnd);

  // Auth Service Call
  setTimeout(() => {
    animatePacket('gw', 'auth', () => {
      const authSpanId = generateId();
      addSpan(
        'auth',
        'POST /verify_token',
        traceId,
        authSpanId,
        gwSpanId,
        timings.authStart,
        timings.authProc
      );
      animateNode('auth', timings.authStart, timings.authProc);
    });
  }, timings.authStart * VISUAL_MULTIPLIER);

  // Billing Service Call
  setTimeout(() => {
    animatePacket('gw', 'billing', () => {
      const billingSpanId = generateId();
      addSpan(
        'billing',
        'POST /process_payment',
        traceId,
        billingSpanId,
        gwSpanId,
        timings.billStart,
        timings.billEnd - timings.billStart
      );
      animateNode('billing', timings.billStart, timings.billEnd - timings.billStart);

      // DB Service Call
      setTimeout(
        () => {
          animatePacket('billing', 'db', () => {
            const dbSpanId = generateId();
            addSpan(
              'db',
              'UPDATE users_balance',
              traceId,
              dbSpanId,
              billingSpanId,
              timings.dbStart,
              timings.dbProc
            );
            animateNode('db', timings.dbStart, timings.dbProc);
          });
        },
        (timings.dbStart - timings.billStart) * VISUAL_MULTIPLIER
      );
    });
  }, timings.billStart * VISUAL_MULTIPLIER);

  // Re-enable button after trace completes
  setTimeout(
    () => {
      els.btnTrigger.disabled = false;
    },
    timings.gwEnd * VISUAL_MULTIPLIER + 500
  );
}

function generateTraceTimings() {
  const authNetReq = 5 + Math.floor(Math.random() * 15);
  const authProc = 20 + Math.floor(Math.random() * 30);
  const authNetRes = 5 + Math.floor(Math.random() * 15);

  const authStart = authNetReq;
  const authEnd = authStart + authProc;
  const gwAfterAuth = authEnd + authNetRes;

  const billNetReq = 5 + Math.floor(Math.random() * 15);
  const billStart = gwAfterAuth + billNetReq;

  const dbNetReq = 5 + Math.floor(Math.random() * 10);
  const dbStart = billStart + dbNetReq;
  const dbProc = 30 + Math.floor(Math.random() * 40);
  const dbEnd = dbStart + dbProc;
  const dbNetRes = 5 + Math.floor(Math.random() * 10);

  const billEnd = dbEnd + dbNetRes + 5 + Math.floor(Math.random() * 15);
  const billNetRes = 5 + Math.floor(Math.random() * 15);

  const gwEnd = billEnd + billNetRes + Math.floor(Math.random() * 10);

  return {
    authStart,
    authProc,
    authEnd,
    billStart,
    billEnd,
    dbStart,
    dbProc,
    dbEnd,
    gwEnd,
  };
}

function addSpan(serviceId, operationName, traceId, spanId, parentId, startMs, durationMs) {
  const span = { serviceId, operationName, traceId, spanId, parentId, startMs, durationMs };
  currentTrace.push(span);

  const row = document.createElement('div');
  row.className = 'span-row';

  // Calculate indentation based on parent (simplified: gw = 0, auth/billing = 1, db = 2)
  let indent = 0;
  if (parentId) {
    if (serviceId === 'db') indent = 30;
    else indent = 15;
  }

  const info = document.createElement('div');
  info.className = 'span-info';
  info.style.paddingLeft = `${indent}px`;
  info.innerHTML = `<strong>${serviceId.toUpperCase()}</strong>: ${operationName}`;

  const barContainer = document.createElement('div');
  barContainer.className = 'span-bar-container';

  const bar = document.createElement('div');
  bar.className = `span-bar span-${serviceId}`;

  // Calculate left percentage and width percentage relative to TOTAL_TIMELINE_MS
  const leftPct = (startMs / TOTAL_TIMELINE_MS) * 100;
  const widthPct = (durationMs / TOTAL_TIMELINE_MS) * 100;

  bar.style.left = `${leftPct}%`;
  bar.style.width = `${widthPct}%`;
  bar.textContent = `${durationMs}ms`;

  barContainer.appendChild(bar);
  row.appendChild(info);
  row.appendChild(barContainer);

  els.waterfallBody.appendChild(row);
}

// Visual animations on the architecture graph
function animateNode(serviceId, startMs, durationMs) {
  const node = els.nodes[serviceId];
  node.classList.add('active');

  // Convert simulated ms to actual visual ms (slowed down by 10x for visual clarity)
  setTimeout(() => {
    node.classList.remove('active');
  }, durationMs * 10);
}

function animatePacket(fromId, toId, onComplete) {
  const packet = document.getElementById(`packet-${fromId}-${toId}`);
  if (!packet) {
    onComplete();
    return;
  }

  const line = document.getElementById(`edge-${fromId}-${toId}`);
  const x1 = line.getAttribute('x1');
  const y1 = line.getAttribute('y1');
  const x2 = line.getAttribute('x2');
  const y2 = line.getAttribute('y2');

  packet.setAttribute('cx', x1);
  packet.setAttribute('cy', y1);
  packet.classList.remove('hidden');

  // Animate via Web Animations API
  const animation = packet.animate(
    [
      { cx: x1, cy: y1 },
      { cx: x2, cy: y2 },
    ],
    {
      duration: 300,
      easing: 'ease-in-out',
    }
  );

  animation.onfinish = () => {
    packet.classList.add('hidden');
    onComplete();
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateTraceTimings,
    addSpan,
    generateId,
    getTrace: () => currentTrace,
  };
}
