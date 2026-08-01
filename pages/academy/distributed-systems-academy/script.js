/* ============================================================
   Distributed Systems & High-Availability DB Academy JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const capGoalSelect = document.getElementById('capGoalSelect');
  const capEvaluationResult = document.getElementById('capEvaluationResult');
  const btnSimSplitBrain = document.getElementById('btnSimSplitBrain');
  const btnSimNetworkCut = document.getElementById('btnSimNetworkCut');
  const scenarioOutput = document.getElementById('scenarioOutput');
  const moduleCards = document.querySelectorAll('.ds-module-card');

  function init() {
    setupEventListeners();
    evaluateCapGoal();
  }

  function setupEventListeners() {
    capGoalSelect.addEventListener('change', evaluateCapGoal);

    moduleCards.forEach(card => {
      card.addEventListener('click', () => {
        moduleCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });

    btnSimSplitBrain.addEventListener('click', () => {
      scenarioOutput.innerHTML = `
        <div style="color:var(--ds-warning)">
          <strong><i class="fas fa-triangle-exclamation"></i> SPLIT-BRAIN CONDITION DETECTED</strong>
          <p style="margin:4px 0 0 0; font-size:0.8rem;">Network partition split 5 nodes into two isolated groups (3 nodes &amp; 2 nodes). Group A (3 nodes) formed a valid Raft quorum. Group B (2 nodes) dropped requests to prevent stale writes.</p>
        </div>
      `;
    });

    btnSimNetworkCut.addEventListener('click', () => {
      scenarioOutput.innerHTML = `
        <div style="color:var(--ds-danger)">
          <strong><i class="fas fa-skull"></i> LEADER NODE ISOLATED</strong>
          <p style="margin:4px 0 0 0; font-size:0.8rem;">Node 1 (Leader) disconnected. Remaining nodes triggered Raft election timer, incremented term counter, and elected Node 3 as new Leader in 150ms.</p>
        </div>
      `;
    });
  }

  function evaluateCapGoal() {
    const val = capGoalSelect.value;
    if (val === 'CP') {
      capEvaluationResult.innerHTML = `
        <div style="color:var(--ds-accent)">
          <strong>CP (Consistency &amp; Partition Tolerance)</strong>
          <ul style="margin:8px 0 0 0; padding-left:20px; font-size:0.8rem;">
            <li><strong>Behavior:</strong> Rejects writes/reads if a majority quorum cannot be reached during network split.</li>
            <li><strong>Example DBs:</strong> Google Spanner, CockroachDB, HBase, Redis Sentinel.</li>
            <li><strong>PACELC Extension:</strong> PC/EC (If Partition: Consistency; Else: Consistency).</li>
          </ul>
        </div>
      `;
    } else {
      capEvaluationResult.innerHTML = `
        <div style="color:var(--ds-success)">
          <strong>AP (Availability &amp; Partition Tolerance)</strong>
          <ul style="margin:8px 0 0 0; padding-left:20px; font-size:0.8rem;">
            <li><strong>Behavior:</strong> Accepts local writes on isolated nodes during network split. Uses eventual consistency.</li>
            <li><strong>Example DBs:</strong> Apache Cassandra, Amazon DynamoDB, CouchDB.</li>
            <li><strong>PACELC Extension:</strong> PA/EL (If Partition: Availability; Else: Latency).</li>
          </ul>
        </div>
      `;
    }
  }

  init();
});
