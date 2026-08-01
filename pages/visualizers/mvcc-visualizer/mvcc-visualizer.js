// mvcc-visualizer.js

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tupleContainer = document.getElementById('tupleContainer1');
  const logsContainer = document.getElementById('logsContainer');
  const dbStatusDisplay = document.getElementById('dbStatusDisplay');

  // Buttons
  const btnUpdateRow1 = document.getElementById('btnUpdateRow1');
  const btnUpdateRow2 = document.getElementById('btnUpdateRow2');
  const btnRunVacuum = document.getElementById('btnRunVacuum');
  const btnReset = document.getElementById('btnReset');

  // State
  const MAX_TUPLES_PER_PAGE = 5;
  let globalTxId = 100;
  let tuples = [];

  // Initialize
  function initDB() {
    tuples = [
      { id: 'row1_v1', rowId: 1, val: 'A', xmin: 98, xmax: null, isDead: false },
      { id: 'row2_v1', rowId: 2, val: 'X', xmin: 99, xmax: null, isDead: false },
    ];
    globalTxId = 100;
    renderPage();
    clearLogs();
    log('sys', '>> Database initialized. Page has 2 live tuples.');
    updateStatus('IDLE');
  }

  function updateStatus(status) {
    dbStatusDisplay.textContent = `Status: ${status}`;
  }

  function log(type, message) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    logsContainer.appendChild(entry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  function clearLogs() {
    logsContainer.innerHTML = '';
  }

  function renderPage() {
    tupleContainer.innerHTML = '';

    // Render existing tuples
    tuples.forEach((t) => {
      const el = document.createElement('div');
      el.className = `tuple ${t.isDead ? 'dead animate-die' : 'animate-spawn'}`;
      el.id = t.id;

      el.innerHTML = `
        <div class="tuple-id">Row ${t.rowId}</div>
        <div class="tuple-data">Val: ${t.val}</div>
        <div class="tuple-meta">
          <span>xmin: ${t.xmin}</span>
          <span>xmax: ${t.xmax || 'inf'}</span>
        </div>
      `;
      tupleContainer.appendChild(el);
    });

    // Render empty slots if any
    const emptyCount = MAX_TUPLES_PER_PAGE - tuples.length;
    for (let i = 0; i < emptyCount; i++) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'tuple empty';
      emptyEl.textContent = 'Free Space';
      tupleContainer.appendChild(emptyEl);
    }
  }

  function updateRow(rowId) {
    if (tuples.length >= MAX_TUPLES_PER_PAGE) {
      log('sys', `>> ERROR: Page is full. Run Vacuum to free up space!`);
      return;
    }

    updateStatus(`UPDATING ROW ${rowId}`);
    const txId = globalTxId++;

    // Find current live version
    const currentVersion = tuples.find((t) => t.rowId === rowId && !t.isDead);

    if (currentVersion) {
      // Mark old as dead
      currentVersion.xmax = txId;
      currentVersion.isDead = true;

      // Create new version
      const newVal = currentVersion.val + '*';
      const newVersion = {
        id: `row${rowId}_v${txId}`,
        rowId: rowId,
        val: newVal,
        xmin: txId,
        xmax: null,
        isDead: false,
      };

      tuples.push(newVersion);

      log(
        'update',
        `Tx ${txId}: Updated Row ${rowId}. Created new tuple version, old version marked dead.`
      );
      renderPage();

      setTimeout(() => updateStatus('IDLE'), 1000);
    }
  }

  function runVacuum() {
    updateStatus('VACUUMING');
    log('vacuum', '>> Vacuum process started. Scanning for dead tuples...');

    // Visual effect on page
    const pageEl = document.getElementById('page1');
    pageEl.classList.add('animate-vacuum');

    setTimeout(() => {
      pageEl.classList.remove('animate-vacuum');

      const beforeCount = tuples.length;
      tuples = tuples.filter((t) => !t.isDead);
      const reclaimed = beforeCount - tuples.length;

      if (reclaimed > 0) {
        log('vacuum', `>> Vacuum complete. Reclaimed ${reclaimed} dead tuple(s).`);
      } else {
        log('vacuum', `>> Vacuum complete. No dead tuples found.`);
      }

      renderPage();
      updateStatus('IDLE');
    }, 800);
  }

  // Event Listeners
  btnUpdateRow1.addEventListener('click', () => updateRow(1));
  btnUpdateRow2.addEventListener('click', () => updateRow(2));
  btnRunVacuum.addEventListener('click', runVacuum);
  btnReset.addEventListener('click', initDB);

  // Initial render
  initDB();
});
