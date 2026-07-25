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
};

let orderCount = 0;
let isProcessing = false;
let relayInterval = null;

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

  // Start relay background process
  startRelay();
}

function resetAll() {
  orderCount = 0;
  isProcessing = false;
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
  startRelay();
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

function startRelay() {
  if (relayInterval) clearInterval(relayInterval);

  relayInterval = setInterval(async () => {
    if (isProcessing) return; // don't poll while animating main flow to avoid visual clutter

    const pending = els.outboxTable.querySelector('.outbox-row[data-status="PENDING"]');
    if (pending) {
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

      els.relayProcess.className = 'relay-process';
      els.relayProcess.querySelector('.status-text').textContent = 'Polling Outbox...';

      els.expTitle.innerHTML =
        '<i class="fas fa-check-circle" style="color:var(--color-relay)"></i> 3. Message Relayed';
      els.expText.innerHTML = `The background Message Relay (e.g., a cron job or Debezium CDC) read the pending event from the Outbox and published it to the Kafka Broker successfully.`;
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
