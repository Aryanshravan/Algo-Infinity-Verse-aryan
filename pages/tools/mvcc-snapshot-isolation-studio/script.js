/* Interactive MVCC & Snapshot Isolation Engine Logic */

document.addEventListener('DOMContentLoaded', () => {
  const isolationLevelSelect = document.getElementById('isolationLevelSelect');
  const anomalyPresetSelect = document.getElementById('anomalyPresetSelect');
  const btnResetMvcc = document.getElementById('btnResetMvcc');

  const t1Log = document.getElementById('t1Log');
  const t2Log = document.getElementById('t2Log');
  const tupleVersionContainer = document.getElementById('tupleVersionContainer');
  const anomalyAlertBox = document.getElementById('anomalyAlertBox');
  const activeSnapshotsList = document.getElementById('activeSnapshotsList');

  // Tuple Storage
  let tuples = [
    { id: 1, name: 'Alice', on_call: true, xmin: 100, xmax: 0 },
    { id: 2, name: 'Bob', on_call: true, xmin: 100, xmax: 0 }
  ];

  let t1History = [];
  let t2History = [];

  function renderTuples() {
    tupleVersionContainer.innerHTML = '';
    tuples.forEach(t => {
      const card = document.createElement('div');
      card.className = 'tuple-card';
      card.innerHTML = `
        <div>
          <strong>Row #${t.id}: ${t.name}</strong> (on_call: ${t.on_call})
        </div>
        <div class="tuple-headers">
          xmin: ${t.xmin} | xmax: ${t.xmax === 0 ? 'inf (active)' : t.xmax}
        </div>
      `;
      tupleVersionContainer.appendChild(card);
    });
  }

  function appendLog(lane, msg) {
    const target = lane === 'T1' ? t1Log : t2Log;
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    target.appendChild(line);
    target.scrollTop = target.scrollHeight;
  }

  window.execTxn = function(lane, op) {
    const txId = lane === 'T1' ? 101 : 102;
    appendLog(lane, `Executed ${op}`);

    if (op === 'UPDATE') {
      if (lane === 'T1') {
        tuples[0].xmax = 101;
        tuples.push({ id: 1, name: 'Alice', on_call: false, xmin: 101, xmax: 0 });
        t1History.push('UPDATE_ALICE');
      } else {
        tuples[1].xmax = 102;
        tuples.push({ id: 2, name: 'Bob', on_call: false, xmin: 102, xmax: 0 });
        t2History.push('UPDATE_BOB');
      }
      renderTuples();
    }

    if (t1History.includes('UPDATE_ALICE') && t2History.includes('UPDATE_BOB')) {
      anomalyAlertBox.innerHTML = `
        <span class="anomaly-badge triggered">
          ⚠️ WRITE SKEW ANOMALY DETECTED! Both Doctors turned off on_call (0 Doctors Left)!
        </span>
      `;
    }
  };

  btnResetMvcc.addEventListener('click', () => {
    tuples = [
      { id: 1, name: 'Alice', on_call: true, xmin: 100, xmax: 0 },
      { id: 2, name: 'Bob', on_call: true, xmin: 100, xmax: 0 }
    ];
    t1History = [];
    t2History = [];
    t1Log.innerHTML = '';
    t2Log.innerHTML = '';
    anomalyAlertBox.innerHTML = '<span class="anomaly-badge idle">NO CONCURRENCY ANOMALY DETECTED</span>';
    renderTuples();
  });

  renderTuples();
});
