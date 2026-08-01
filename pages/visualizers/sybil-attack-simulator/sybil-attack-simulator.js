/* ============================================
   PoW vs PoS Sybil Simulator JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const btnModePoW = document.getElementById('btnModePoW');
  const btnModePoS = document.getElementById('btnModePoS');
  const btnReset = document.getElementById('btnReset');
  const btnAddSybil = document.getElementById('btnAddSybil');
  const btnBuyResource = document.getElementById('btnBuyResource');
  const btnAttemptAttack = document.getElementById('btnAttemptAttack');

  const nodesContainer = document.getElementById('nodesContainer');
  const nodeCountEl = document.getElementById('nodeCount');

  const powerHonest = document.getElementById('powerHonest');
  const powerAttacker = document.getElementById('powerAttacker');

  const honestResourceVal = document.getElementById('honestResourceVal');
  const honestResourceUnit = document.getElementById('honestResourceUnit');
  const attackerResourceVal = document.getElementById('attackerResourceVal');
  const attackerResourceUnit = document.getElementById('attackerResourceUnit');
  const attackerCost = document.getElementById('attackerCost');
  const resourceLabel = document.getElementById('resourceLabel');

  const costInfo = document.getElementById('costInfo');
  const statusLog = document.getElementById('statusLog');
  const algoDetails = document.getElementById('algoDetails');

  // State
  let mode = 'pow'; // 'pow' or 'pos'
  let state = {
    honestNodes: 10,
    sybilNodes: 0,
    honestResource: 1000,
    attackerResource: 0,
    attackerSpent: 0,
  };

  // Constants
  const CONFIG = {
    pow: {
      unit: 'TH/s',
      resourceName: 'Hashpower',
      buyAction: 'Buy ASICs (Hashpower)',
      sybilCost: 10, // $10 to spin up a fake IP/node
      sybilResource: 1, // 1 TH/s from a basic laptop CPU
      buyResourceCost: 10000, // $10,000 for 100 TH/s
      buyResourceAmount: 100,
      descTitle: 'Proof-of-Work Defense:',
      descText:
        'In PoW, voting power is proportional to computational power (Hash Rate), not the number of node identities. An attacker can easily spoof thousands of IP addresses (Sybil nodes), but without physical ASICs and electricity, they cannot out-hash the honest network to rewrite the chain.',
      costDesc:
        'Fake Nodes are cheap ($10) but add negligible Hashpower (1 TH/s). ASICs cost money ($10k) but add 100 TH/s.',
    },
    pos: {
      unit: 'ETH',
      resourceName: 'Stake',
      buyAction: 'Buy Crypto (Stake)',
      sybilCost: 10, // $10 to spin up a fake IP/node
      sybilResource: 0, // 0 ETH staked by default
      buyResourceCost: 200000, // $200k for 100 ETH (assume $2k/ETH)
      buyResourceAmount: 100,
      descTitle: 'Proof-of-Stake Defense (Slashing):',
      descText:
        'In PoS, voting power is proportional to economic stake (e.g. ETH). Fake Sybil identities with 0 stake have 0 power. To get 51% power, the attacker must buy massive amounts of crypto. If the attack fails or is detected, their stake is "slashed" (burned), resulting in massive economic loss.',
      costDesc:
        'Fake Nodes are cheap ($10) but have 0 Stake. Buying Stake is extremely expensive ($200k for 100 ETH).',
    },
  };

  // Initialize
  function init() {
    state = {
      honestNodes: 10,
      sybilNodes: 0,
      honestResource: 1000,
      attackerResource: 0,
      attackerSpent: 0,
    };
    statusLog.innerHTML = '';
    logMessage(
      `System initialized in ${mode === 'pow' ? 'Proof-of-Work' : 'Proof-of-Stake'} mode.`,
      'system'
    );
    updateUI();
  }

  // Update UI
  function updateUI() {
    const c = CONFIG[mode];

    // Nodes
    nodeCountEl.textContent = state.honestNodes + state.sybilNodes;
    nodesContainer.innerHTML = '';
    for (let i = 0; i < state.honestNodes; i++) {
      const el = document.createElement('div');
      el.className = 'node honest';
      el.innerHTML = '<i class="fas fa-shield-alt"></i>';
      nodesContainer.appendChild(el);
    }
    for (let i = 0; i < state.sybilNodes; i++) {
      const el = document.createElement('div');
      el.className = 'node sybil';
      el.innerHTML = '<i class="fas fa-ghost"></i>';
      nodesContainer.appendChild(el);
    }

    // Resources
    honestResourceVal.textContent = state.honestResource;
    honestResourceUnit.textContent = c.unit;
    attackerResourceVal.textContent = state.attackerResource;
    attackerResourceUnit.textContent = c.unit;
    attackerCost.textContent = `$${state.attackerSpent.toLocaleString()}`;

    // Text & Labels
    resourceLabel.textContent = c.buyAction;
    algoDetails.innerHTML = `<h3>${c.descTitle}</h3><p>${c.descText}</p>`;
    costInfo.textContent = c.costDesc;

    // Power Bar
    const totalResource = state.honestResource + state.attackerResource;
    let honestPct = 100;
    let attackerPct = 0;

    if (totalResource > 0) {
      honestPct = (state.honestResource / totalResource) * 100;
      attackerPct = (state.attackerResource / totalResource) * 100;
    }

    powerHonest.style.width = `${honestPct}%`;
    powerHonest.textContent = `${honestPct.toFixed(1)}%`;
    powerAttacker.style.width = `${attackerPct}%`;
    if (attackerPct > 5) {
      powerAttacker.textContent = `${attackerPct.toFixed(1)}%`;
    } else {
      powerAttacker.textContent = '';
    }
  }

  function logMessage(msg, type = 'system') {
    const el = document.createElement('div');
    el.className = `log-entry ${type}`;
    el.textContent = `> ${msg}`;
    statusLog.appendChild(el);
    statusLog.scrollTop = statusLog.scrollHeight;
  }

  // Event Listeners
  btnModePoW.addEventListener('click', () => {
    mode = 'pow';
    btnModePoW.classList.add('active');
    btnModePoW.classList.replace('btn-outline', 'btn-primary');
    btnModePoS.classList.remove('active');
    btnModePoS.classList.replace('btn-primary', 'btn-outline');
    init();
  });

  btnModePoS.addEventListener('click', () => {
    mode = 'pos';
    btnModePoS.classList.add('active');
    btnModePoS.classList.replace('btn-outline', 'btn-primary');
    btnModePoW.classList.remove('active');
    btnModePoW.classList.replace('btn-primary', 'btn-outline');
    init();
  });

  btnReset.addEventListener('click', init);

  btnAddSybil.addEventListener('click', () => {
    const c = CONFIG[mode];
    const amount = 10;
    state.sybilNodes += amount;
    state.attackerSpent += c.sybilCost * amount;
    state.attackerResource += c.sybilResource * amount;

    logMessage(
      `Added ${amount} Sybil identities. Cost: $${c.sybilCost * amount}. Gained: ${c.sybilResource * amount} ${c.unit}.`,
      'sybil'
    );
    updateUI();
  });

  btnBuyResource.addEventListener('click', () => {
    const c = CONFIG[mode];
    state.attackerSpent += c.buyResourceCost;
    state.attackerResource += c.buyResourceAmount;

    logMessage(
      `Bought ${c.buyResourceAmount} ${c.unit}. Cost: $${c.buyResourceCost.toLocaleString()}.`,
      'attack'
    );
    updateUI();
  });

  btnAttemptAttack.addEventListener('click', () => {
    const totalResource = state.honestResource + state.attackerResource;
    const attackerPct = (state.attackerResource / totalResource) * 100;

    if (attackerPct > 50) {
      logMessage(
        `ATTACK SUCCESSFUL! Attacker controls ${attackerPct.toFixed(1)}% of consensus power. The blockchain has been reorganized!`,
        'attack'
      );
      // Shake animation
      nodesContainer.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => (nodesContainer.style.animation = ''), 500);
    } else {
      logMessage(
        `ATTACK FAILED! Attacker only controls ${attackerPct.toFixed(1)}% of consensus power (< 51%).`,
        'system'
      );

      if (mode === 'pos' && state.attackerResource > 0) {
        logMessage(
          `SLASHING ENFORCED: Attacker's stake of ${state.attackerResource} ETH has been burned!`,
          'success'
        );
        state.attackerResource = 0;
      }

      // Shake button
      btnAttemptAttack.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => (btnAttemptAttack.style.animation = ''), 500);
    }
    updateUI();
  });

  // Add shake keyframes to head dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-5px); }
      40%, 80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);

  // Start
  init();
});
