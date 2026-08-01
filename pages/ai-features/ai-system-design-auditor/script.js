/* ============================================================
   AI System Design Architecture Evaluator JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const dauInput = document.getElementById('dauInput');
  const rwRatioSelect = document.getElementById('rwRatioSelect');
  const btnRunAiAudit = document.getElementById('btnRunAiAudit');

  
  const avgRpsVal = document.getElementById('avgRpsVal');
  const peakRpsVal = document.getElementById('peakRpsVal');
  const writeIopsVal = document.getElementById('writeIopsVal');
  const p99Val = document.getElementById('p99Val');
  const auditReportContainer = document.getElementById('auditReportContainer');

  function init() {
    setupEventListeners();
    calculateMetrics();
  }

  function setupEventListeners() {
    btnRunAiAudit.addEventListener('click', calculateMetrics);
    dauInput.addEventListener('input', calculateMetrics);
    rwRatioSelect.addEventListener('change', calculateMetrics);
  }

  function calculateMetrics() {
    const dau = parseInt(dauInput.value) || 1000000;
    const readPct = parseInt(rwRatioSelect.value) / 100;
    const writePct = 1 - readPct;

    // RPS calculation: DAU * 20 actions / 86400 sec
    const avgRps = Math.round((dau * 20) / 86400);
    const peakRps = avgRps * 3;
    const writeIops = Math.round(peakRps * writePct);

    avgRpsVal.textContent = `${avgRps.toLocaleString()} RPS`;
    peakRpsVal.textContent = `${peakRps.toLocaleString()} RPS`;
    writeIopsVal.textContent = `${writeIops.toLocaleString()} IOPS`;

    if (writeIops > 2000) {
      p99Val.textContent = '480 ms (DEGRADED)';
      p99Val.className = 'sda-val sda-danger';
    } else {
      p99Val.textContent = '45 ms (HEALTHY)';
      p99Val.className = 'sda-val sda-accent';
    }

    renderAuditReport(writeIops);
  }

  function renderAuditReport(writeIops) {
    auditReportContainer.innerHTML = `
      <div class="sda-report-item" style="border-color:var(--sda-danger); background:rgba(239,68,68,0.08)">
        <strong style="color:var(--sda-danger)"><i class="fas fa-triangle-exclamation"></i> Single Point of Failure (SPOF): PostgreSQL Primary</strong>
        <div>Architecture relies on a single un-sharded database instance for writes. A primary outage halts all user writes.</div>
      </div>
      <div class="sda-report-item" style="border-color:var(--sda-warning)">
        <strong style="color:var(--sda-warning)"><i class="fas fa-gauge-high"></i> DB Write Bottleneck at Peak Traffic (${writeIops.toLocaleString()} Write IOPS)</strong>
        <div>Single DB disk I/O saturated. Recommended action: Introduce Kafka Message Queue + Read Replicas.</div>
      </div>
      <div class="sda-report-item" style="border-color:var(--sda-accent)">
        <strong style="color:var(--sda-accent)"><i class="fas fa-lightbulb"></i> AI Recommendation: Implement Database Sharding &amp; Write Buffer</strong>
        <div>Partition PostgreSQL by <code>user_id</code> hash ring and add Redis write-behind caching to drop p99 latency to &lt;50ms.</div>
      </div>
    `;
  }

  init();
});
