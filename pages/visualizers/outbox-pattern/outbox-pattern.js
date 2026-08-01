/**
 * outbox-pattern.js
 * Simulate the Transactional Outbox Pattern.
 * eslint-disable no-unused-vars
 */
/* eslint-disable no-unused-vars */

document.addEventListener('DOMContentLoaded', () => {
  initOutbox();
});

const els = {
  btnCreate: document.getElementById('btnCreateOrder'),
  btnReset: document.getElementById('btnReset'),
  modeCrash: document.getElementById('modeCrash'),
  modeLabel: document.getElementById('modeLabel'),

  appProcess: document.getElementById('appProcess'),
  relayProcess: document.getElementById('relayProcess'),
  txBadge: document.querySelector('.tx-badge'),

  ordersTable: document.getElementById('ordersTable'),
  outboxTable: document.getElementById('outboxTable'),
  kafkaStream: document.getElementById('kafkaStream'),

  animLayer: document.getElementById('animationLayer'),
  expTitle: document.getElementById('expTitle'),
  expText: document.getElementById('expText'),

  btnDropMsg: document.getElementById('btnDropMsg'),
  lagA: document.getElementById('lagA'),
  lagB: document.getElementById('lagB'),
  statusA: document.getElementById('statusA'),
  statusB: document.getElementById('statusB'),
  logA: document.getElementById('logA'),
  logB: document.getElementById('logB'),
};

let orderCount = 0;
let isProcessing = false;
let isPublishing = false; // Guard: prevents relay from publishing the same event twice concurrently
let relayInterval = null;

let kafkaEvents = []; // stores objects { id: 'ORD-1001', payload: '...' }
let consumerA = { offset: 0, cache: new Set(), interval: null, name: 'Inventory' };
let consumerB = { offset: 0, cache: new Set(), interval: null, name: 'Notification' };
let simulateDropMsg = false;

function initOutbox() {
  els.btnCreate.addEventListener('click', handleCreateOrder);
  els.btnReset.addEventListener('click', resetAll);

  els.modeCrash.addEventListener('change', () => {
    if (els.modeCrash.checked) {
      els.modeLabel.innerHTML =
        '<strong style="color:var(--color-error)">Crash Enabled</strong>: App will crash before Kafka publish.';
    } else {
      els.modeLabel.innerHTML = 'Normal Mode: Outbox Relay will poll automatically.';
    }
  });

  if (els.btnDropMsg) {
    els.btnDropMsg.addEventListener('click', () => {
      simulateDropMsg = true;
      alert(
        'Next message to consumers will be dropped (simulating network issue). Wait for redelivery!'
      );
    });
  }

  // Start relay background process
  startRelay();
  startConsumers();
}

function resetAll() {
  // Stop any running relay before resetting state to avoid race conditions
  // where a mid-flight publish cycle mutates DOM that has already been cleared.
  stopRelay();

  orderCount = 0;
  isProcessing = false;
  isPublishing = false; // Reset publish guard so the fresh relay starts clean
  els.ordersTable.innerHTML = '<div class="empty-state">No orders</div>';
  els.outboxTable.innerHTML = '<div class="empty-state">No pending events</div>';
  els.kafkaStream.innerHTML = '';
  els.appProcess.className = 'process-box';
  els.appProcess.querySelector('.status-text').textContent = 'Idle';
  els.txBadge.classList.remove('tx-active');

  els.expTitle.innerHTML = '<i class="fas fa-info-circle"></i> What is happening?';
  els.expText.innerHTML = `
        Without the outbox pattern, an app might commit to the DB and then crash before publishing to Kafka (or vice versa), leading to data inconsistency.
        By writing the Order and the Event to an <strong>Outbox table in a single local transaction</strong>, we guarantee atomicity. 
        A separate relay process then reads the Outbox and publishes to Kafka.
    `;

  els.btnCreate.disabled = false;

  kafkaEvents = [];
  consumerA = { offset: 0, cache: new Set(), interval: null, name: 'Inventory' };
  consumerB = { offset: 0, cache: new Set(), interval: null, name: 'Notification' };
  if (els.logA) els.logA.innerHTML = '';
  if (els.logB) els.logB.innerHTML = '';
  updateLag();

  startRelay();
  startConsumers();
}

async function handleCreateOrder() {
  if (isProcessing) return;
  isProcessing = true;
  els.btnCreate.disabled = true;

  orderCount++;
  const orderId = `ORD-${1000 + orderCount}`;

  els.appProcess.className = 'process-box process-active';
  els.appProcess.querySelector('.status-text').textContent = 'Processing...';

  els.expTitle.innerHTML = '<i class="fas fa-database"></i> 1. Database Transaction';
  els.expText.innerHTML = `The Order Service begins a local database transaction. It will write to both the <code>Orders</code> table and the <code>Outbox</code> table simultaneously.`;

  // Simulate DB Tx
  els.txBadge.classList.add('tx-active');

  await sleep(1000);

  // Write to Orders
  removeEmpty(els.ordersTable);
  const orderRow = document.createElement('div');
  orderRow.className = 'db-row';
  orderRow.textContent = `ID: ${orderId} | Status: CREATED`;
  els.ordersTable.appendChild(orderRow);

  // Write to Outbox
  removeEmpty(els.outboxTable);
  const outboxRow = document.createElement('div');
  outboxRow.className = 'db-row outbox-row';
  outboxRow.id = `evt-${orderId}`;
  outboxRow.dataset.status = 'PENDING';
  outboxRow.dataset.payload = `{"order_id": "${orderId}"}`;
  outboxRow.textContent = `Event: OrderCreated | ID: ${orderId} | PENDING`;
  els.outboxTable.appendChild(outboxRow);

  await sleep(1000);
  els.txBadge.classList.remove('tx-active');

  if (els.modeCrash.checked) {
    // Simulate crash
    els.appProcess.className = 'process-box process-crashed';
    els.appProcess.querySelector('.status-text').textContent = 'CRASHED!';
    els.expTitle.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color:var(--color-error)"></i> 2. Application Crashed!';
    els.expText.innerHTML = `
            The Order Service crashed immediately after the DB commit! 
            <strong>If we didn't use the Outbox pattern</strong>, the event would be lost forever, and other microservices would never know about <code>${orderId}</code>. 
            <br><br>But because the event is safely in the Outbox table, the Relay will eventually pick it up.
        `;

    // Wait a bit to let the user read
    await sleep(3000);
  } else {
    els.appProcess.className = 'process-box';
    els.appProcess.querySelector('.status-text').textContent = 'Idle';
  }

  isProcessing = false;
  els.btnCreate.disabled = false;
}

function stopRelay() {
  if (relayInterval) {
    clearInterval(relayInterval);
    relayInterval = null;
  }
}

function startRelay() {
  stopRelay(); // Always clear the previous interval before starting a new one

  relayInterval = setInterval(async () => {
    // Skip this tick if the main order flow is animating or a publish is already in-flight.
    // Without the isPublishing guard the same PENDING row can be picked up by two
    // consecutive ticks when the animation takes longer than the poll interval (2 s).
    if (isProcessing || isPublishing) return;

    const pending = els.outboxTable.querySelector('.outbox-row[data-status="PENDING"]');
    if (pending) {
      isPublishing = true; // Acquire publish lock
      els.relayProcess.className = 'relay-process relay-active';
      els.relayProcess.querySelector('.status-text').textContent = 'Publishing...';

      pending.dataset.status = 'PROCESSING';
      pending.style.opacity = '0.7';

      const payload = pending.dataset.payload;

      // Animate packet to Kafka
      await animatePacket(pending, els.kafkaStream, `Publish ${payload}`);

      // Mark processed
      pending.dataset.status = 'PROCESSED';
      pending.className = 'db-row outbox-row processed';
      pending.textContent = pending.textContent.replace('PENDING', 'PROCESSED');

      // Add to Kafka
      const kEvent = document.createElement('div');
      kEvent.className = 'kafka-event';
      kEvent.textContent = payload;
      els.kafkaStream.prepend(kEvent);

      const parsed = JSON.parse(payload);
      kafkaEvents.push({ id: parsed.order_id, payload: payload });
      updateLag();

      els.relayProcess.className = 'relay-process';
      els.relayProcess.querySelector('.status-text').textContent = 'Polling Outbox...';

      isPublishing = false; // Release publish lock
    }
  }, 2000);
}

function removeEmpty(container) {
  const empty = container.querySelector('.empty-state');
  if (empty) empty.remove();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animatePacket(fromEl, toEl, text) {
  return new Promise((resolve) => {
    const r1 = fromEl.getBoundingClientRect();
    const r2 = toEl.getBoundingClientRect();

    const packet = document.createElement('div');
    packet.className = 'flying-packet';
    packet.textContent = text;
    packet.style.borderColor = 'var(--color-relay)';
    packet.style.color = 'var(--color-relay)';

    els.animLayer.appendChild(packet);

    // Start pos (center of fromEl)
    const startX = r1.left + r1.width / 2;
    const startY = r1.top + r1.height / 2;

    // End pos (center of toEl)
    const endX = r2.left + r2.width / 2;
    const endY = r2.top + r2.height / 2;

    packet.style.left = `${startX}px`;
    packet.style.top = `${startY}px`;
    packet.style.transform = 'translate(-50%, -50%)';

    const animation = packet.animate(
      [
        { left: `${startX}px`, top: `${startY}px` },
        { left: `${endX}px`, top: `${endY}px` },
      ],
      {
        duration: 1200,
        easing: 'ease-in-out',
      }
    );

    animation.onfinish = () => {
      packet.remove();
      resolve();
    };
  });
}

function updateLag() {
  if (els.lagA) els.lagA.textContent = Math.max(0, kafkaEvents.length - consumerA.offset);
  if (els.lagB) els.lagB.textContent = Math.max(0, kafkaEvents.length - consumerB.offset);
}

function logConsumer(logEl, msg, isDup = false) {
  if (!logEl) return;
  const div = document.createElement('div');
  div.className = 'log-entry' + (isDup ? ' dup' : '');
  div.textContent = msg;
  logEl.prepend(div);
}

function startConsumers() {
  if (consumerA.interval) clearInterval(consumerA.interval);
  if (consumerB.interval) clearInterval(consumerB.interval);

  const poll = async (consumer, statusEl, logEl) => {
    if (consumer.offset < kafkaEvents.length) {
      if (statusEl) statusEl.textContent = 'Processing...';
      const event = kafkaEvents[consumer.offset];

      if (simulateDropMsg) {
        logConsumer(logEl, `[ERROR] Dropped msg ${event.id}. Lag increases.`);
        simulateDropMsg = false;
        if (statusEl) statusEl.textContent = 'Polling...';
        updateLag();
        return; // Missed the message, offset does not advance
      }

      await sleep(500); // Simulate processing time

      if (consumer.cache.has(event.id)) {
        logConsumer(logEl, `[IDEMPOTENT] Ignored dup ${event.id}`, true);
      } else {
        consumer.cache.add(event.id);
        logConsumer(logEl, `[OK] Processed ${event.id}`);
      }

      consumer.offset++;
      updateLag();
      if (statusEl) statusEl.textContent = 'Polling...';
    } else {
      // Redelivery simulation chance (if caught up)
      if (kafkaEvents.length > 0 && Math.random() < 0.05) {
        // 5% chance of redelivery
        const randomEvt = kafkaEvents[Math.floor(Math.random() * kafkaEvents.length)];
        logConsumer(logEl, `[REDELIVERY] Rcvd ${randomEvt.id}`, true);
        if (consumer.cache.has(randomEvt.id)) {
          logConsumer(logEl, `[IDEMPOTENT] Ignored dup ${randomEvt.id}`, true);
        }
      }
    }
  };

  consumerA.interval = setInterval(() => poll(consumerA, els.statusA, els.logA), 1500);
  consumerB.interval = setInterval(() => poll(consumerB, els.statusB, els.logB), 2500); // slower consumer
}
