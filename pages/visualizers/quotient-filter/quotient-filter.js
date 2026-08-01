/**
 * quotient-filter.js
 * Visualizes a Quotient Filter with 16 slots (q=4 bits, r=4 bits).
 */

document.addEventListener('DOMContentLoaded', () => {
  initFilter();
});

const els = {
  strInput: document.getElementById('strInput'),
  btnInsert: document.getElementById('btnInsert'),
  btnQuery: document.getElementById('btnQuery'),
  btnReset: document.getElementById('btnReset'),
  hashDisplay: document.getElementById('hashDisplay'),
  qfTableBody: document.getElementById('qfTableBody'),
  loadFactor: document.getElementById('loadFactor'),
};

const Q = 16; // 4-bit quotient
let filter = Array(Q)
  .fill(null)
  .map(() => ({
    is_occupied: false,
    is_continuation: false,
    is_shifted: false,
    remainder: null,
  }));
let numItems = 0;

function initFilter() {
  renderTable();

  els.btnInsert.addEventListener('click', () => {
    const str = els.strInput.value.trim();
    if (str) insertItem(str);
    els.strInput.value = '';
  });

  els.btnQuery.addEventListener('click', () => {
    const str = els.strInput.value.trim();
    if (str) queryItem(str);
    els.strInput.value = '';
  });

  els.btnReset.addEventListener('click', () => {
    filter = Array(Q)
      .fill(null)
      .map(() => ({
        is_occupied: false,
        is_continuation: false,
        is_shifted: false,
        remainder: null,
      }));
    numItems = 0;
    els.hashDisplay.innerHTML =
      '<div class="empty-state">Enter a string to see how it hashes.</div>';
    renderTable();
  });
}

function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i); /* hash * 33 + c */
  }
  // Return an 8-bit hash (0-255)
  return Math.abs(hash) % 256;
}

function displayHashProcess(str, h, q, r, isQuery = false) {
  const binStr = h.toString(2).padStart(8, '0');
  const qBin = binStr.substring(0, 4);
  const rBin = binStr.substring(4, 8);

  els.hashDisplay.innerHTML = `
        <div class="hash-step">
            <div class="hash-label">Input String</div>
            <div class="hash-val">${str}</div>
        </div>
        <div class="hash-step">
            <div class="hash-label">8-bit Hash</div>
            <div class="hash-val">${binStr} (Decimal: ${h})</div>
        </div>
        <div class="hash-split">
            <div class="split-box">
                <div class="hash-label">Quotient (Index)</div>
                <div class="hash-val q-part">${qBin} (idx ${q})</div>
            </div>
            <div class="split-box">
                <div class="hash-label">Remainder (Data)</div>
                <div class="hash-val r-part">${rBin}</div>
            </div>
        </div>
    `;

  if (isQuery) {
    els.hashDisplay.innerHTML =
      `<h3 style="color:#fbbf24;margin-top:0;">Querying...</h3>` + els.hashDisplay.innerHTML;
  } else {
    els.hashDisplay.innerHTML =
      `<h3 style="color:#f43f5e;margin-top:0;">Inserting...</h3>` + els.hashDisplay.innerHTML;
  }
}

// Complex QF logic simplified for 16 slots visualization
function insertItem(str) {
  if (numItems >= Q) {
    alert('Filter is full! (Load Factor 100%)');
    return;
  }

  const h = djb2Hash(str);
  const q = h >> 4; // top 4 bits
  const r = h & 0x0f; // bottom 4 bits

  displayHashProcess(str, h, q, r);

  // Check if slot empty
  if (filter[q].remainder === null) {
    filter[q].remainder = r;
    filter[q].is_occupied = true;
    numItems++;
    renderTable(q);
    return;
  }

  // Collision handling (shifting)
  // Find the end of the cluster
  let i = q;
  let shifts = 0;
  while (filter[i].remainder !== null) {
    i = (i + 1) % Q;
    shifts++;
    if (shifts > Q) break; // Should not happen if size checked
  }

  const emptySlot = i;

  // Simplification for visualization:
  // Just find the empty slot and shift everything down from q
  // This is a naive linear probing approximation of QF shifting for visual purposes

  // We mark the canonical slot as occupied
  filter[q].is_occupied = true;

  // Store remainder in the empty slot
  filter[emptySlot].remainder = r;
  filter[emptySlot].is_shifted = emptySlot !== q;

  // If we shifted, it's part of a continuation (simplified)
  if (emptySlot !== q) {
    filter[emptySlot].is_continuation = true;
  }

  numItems++;
  renderTable(q, emptySlot);
}

function queryItem(str) {
  const h = djb2Hash(str);
  const q = h >> 4;
  const r = h & 0x0f;

  displayHashProcess(str, h, q, r, true);

  // Is occupied bit set?
  if (!filter[q].is_occupied) {
    alert(`"${str}" is DEFINITELY NOT in the filter.`);
    renderTable(q);
    return;
  }

  // Scan cluster
  let found = false;
  let i = q;
  let count = 0;

  while (count < Q) {
    if (filter[i].remainder === r) {
      found = true;
      break;
    }
    // Simplified stop condition: if not continuation and not q
    if (i !== q && !filter[i].is_continuation) {
      break;
    }
    i = (i + 1) % Q;
    count++;
  }

  renderTable(q, i);

  setTimeout(() => {
    if (found) {
      alert(`"${str}" is PROBABLY in the filter.`);
    } else {
      alert(`"${str}" is DEFINITELY NOT in the filter.`);
    }
  }, 100);
}

function renderTable(targetIdx = -1, highlightIdx = -1) {
  els.qfTableBody.innerHTML = '';

  for (let i = 0; i < Q; i++) {
    const row = document.createElement('tr');
    if (i === targetIdx) row.classList.add('target');
    if (i === highlightIdx) row.classList.add('highlight');

    const slot = filter[i];

    // binary remainder string
    const rStr = slot.remainder !== null ? slot.remainder.toString(2).padStart(4, '0') : '----';

    row.innerHTML = `
            <td class="idx-col">${i}</td>
            <td class="${slot.is_occupied ? 'bit-on' : 'bit-off'}">${slot.is_occupied ? 1 : 0}</td>
            <td class="${slot.is_continuation ? 'bit-on' : 'bit-off'}">${slot.is_continuation ? 1 : 0}</td>
            <td class="${slot.is_shifted ? 'bit-on' : 'bit-off'}">${slot.is_shifted ? 1 : 0}</td>
            <td class="remainder-val">${rStr}</td>
        `;

    els.qfTableBody.appendChild(row);
  }

  const load = ((numItems / Q) * 100).toFixed(0);
  els.loadFactor.textContent = `${load}%`;
}
