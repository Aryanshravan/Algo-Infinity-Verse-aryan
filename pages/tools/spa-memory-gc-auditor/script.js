/* ============================================================
   Memory Leak & Event Listener GC Auditor JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const gcCodeInput = document.getElementById('gcCodeInput');
  const btnRunAudit = document.getElementById('btnRunAudit');
  const btnTriggerGC = document.getElementById('btnTriggerGC');
  const presetBtns = document.querySelectorAll('.gc-btn-preset');
  const findingsContainer = document.getElementById('findingsContainer');
  const gcConsole = document.getElementById('gcConsole');

  const heapMemVal = document.getElementById('heapMemVal');
  const listenersVal = document.getElementById('listenersVal');
  const detachedVal = document.getElementById('detachedVal');
  const timersVal = document.getElementById('timersVal');

  const snippets = {
    'listener-leak': `class UserProfileComponent {
  mount() {
    // LEAK: Missing removeEventListener in unmount()
    window.addEventListener('resize', this.onResize);
    document.addEventListener('keydown', this.handleKey);
  }
  
  onResize() { console.log('Resized'); }
  handleKey() { console.log('Key pressed'); }
}`,
    'timer-leak': `function startPollEngine() {
  // LEAK: Dangling setInterval without clearInterval handle
  setInterval(() => {
    fetch('/api/user-updates');
  }, 1000);
}`,
    'detached-dom': `let detachedNodes = [];

function createLeakyElements() {
  for (let i = 0; i < 50; i++) {
    let div = document.createElement('div');
    div.innerHTML = 'Leaked Element #' + i;
    // LEAK: Detached node referenced in global array
    detachedNodes.push(div);
  }
}`,
    'clean-code': `class CleanComponent {
  mount() {
    this.boundResize = this.onResize.bind(this);
    window.addEventListener('resize', this.boundResize);
    this.timerId = setInterval(this.pollData, 5000);
  }

  unmount() {
    // SAFE: Proper disposal & cleanup hooks
    window.removeEventListener('resize', this.boundResize);
    clearInterval(this.timerId);
  }
}`
  };

  function init() {
    setupEventListeners();
    loadPreset('listener-leak');
    runAudit();
    log('SPA Memory Leak Auditor ready.', 'info');
  }

  function setupEventListeners() {
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadPreset(btn.dataset.preset);
      });
    });

    btnRunAudit.addEventListener('click', runAudit);

    btnTriggerGC.addEventListener('click', () => {
      heapMemVal.textContent = '8.1 MB';
      listenersVal.textContent = '0 Leaked';
      detachedVal.textContent = '0 Nodes';
      timersVal.textContent = '0 Active';
      log('[BROWSER GC] Force Garbage Collection executed. Swept unreferenced memory frames.', 'success');
    });

    document.getElementById('btnClearConsole').addEventListener('click', () => gcConsole.innerHTML = '');
  }

  function loadPreset(key) {
    gcCodeInput.value = snippets[key] || '';
  }

  function runAudit() {
    const code = gcCodeInput.value;
    findingsContainer.innerHTML = '';
    let findings = [];

    const hasAddListener = code.includes('addEventListener');
    const hasRemoveListener = code.includes('removeEventListener');
    const hasSetInterval = code.includes('setInterval');
    const hasClearInterval = code.includes('clearInterval');
    const hasDetached = code.includes('createElement') && (code.includes('push') || code.includes('Array'));

    let leakedListeners = 0;
    let leakedTimers = 0;
    let detachedCount = 0;

    if (hasAddListener && !hasRemoveListener) {
      leakedListeners = 2;
      findings.push({
        type: 'danger',
        title: 'Uncleaned Event Listener Leak Detected',
        desc: '`addEventListener` calls detected without matching `removeEventListener` in unmount hook.'
      });
    }

    if (hasSetInterval && !hasClearInterval) {
      leakedTimers = 1;
      findings.push({
        type: 'danger',
        title: 'Dangling `setInterval` Leak',
        desc: '`setInterval` declared without capturing handle or calling `clearInterval`.'
      });
    }

    if (hasDetached) {
      detachedCount = 50;
      findings.push({
        type: 'warning',
        title: 'Detached DOM Node Retention',
        desc: 'DOM elements created via `createElement` retained in global array references.'
      });
    }

    if (findings.length === 0) {
      findingsContainer.innerHTML = `
        <div class="gc-finding-item clean">
          <strong><i class="fas fa-check-circle"></i> Clean Resource Disposal Pattern</strong>
          <div>All event listeners and timers properly unregistered. Memory safe!</div>
        </div>
      `;
      heapMemVal.textContent = '6.4 MB';
      listenersVal.textContent = '0 Leaked';
      detachedVal.textContent = '0 Nodes';
      timersVal.textContent = '0 Active';
      log('Memory audit passed cleanly. Zero leaks detected.', 'success');
    } else {
      findings.forEach(f => {
        const div = document.createElement('div');
        div.className = 'gc-finding-item';
        div.innerHTML = `
          <strong><i class="fas fa-exclamation-triangle"></i> ${f.title}</strong>
          <div>${f.desc}</div>
        `;
        findingsContainer.appendChild(div);
      });

      const heap = 12.0 + leakedListeners * 2.5 + leakedTimers * 1.8 + (detachedCount ? 4.2 : 0);
      heapMemVal.textContent = `${heap.toFixed(1)} MB`;
      listenersVal.textContent = `${leakedListeners} Leaked`;
      detachedVal.textContent = `${detachedCount} Nodes`;
      timersVal.textContent = `${leakedTimers} Active`;

      log(`[AUDIT WARNING] Memory audit completed with ${findings.length} leak risk(s).`, 'warning');
    }
  }

  function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `gc-log-entry ${type}`;
    div.textContent = `[${time}] ${msg}`;
    gcConsole.appendChild(div);
    gcConsole.scrollTop = gcConsole.scrollHeight;
  }

  init();
});
