// Smart Contract Security Masterclass Script

const VECTORS = [
  {
    id: "reentrancy",
    title: "1. Reentrancy Vulnerability (DAO)",
    sol_vuln: `// VULNERABLE CONTRACT
contract VulnerableBank {
    mapping(address => uint) public balances;
    
    function withdraw() public {
        uint amount = balances[msg.sender];
        // ❌ State updated AFTER external call!
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] = 0;
    }
}`,
    sol_secure: `// SECURED WITH CHECKS-EFFECTS-INTERACTIONS
contract SecureBank {
    mapping(address => uint) public balances;
    
    function withdraw() public {
        uint amount = balances[msg.sender];
        require(amount > 0, "Zero balance");
        
        // ✅ 1. Effects: Update state FIRST
        balances[msg.sender] = 0;
        
        // ✅ 2. Interactions: External call last
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}`
  },
  {
    id: "overflow",
    title: "2. Integer Overflow / Underflow",
    sol_vuln: `// VULNERABLE (Solidity < 0.8)
contract Timelock {
    mapping(address => uint) public lockTime;
    
    function increaseLockTime(uint _seconds) public {
        // ❌ Overflow risk!
        lockTime[msg.sender] += _seconds;
    }
}`,
    sol_secure: `// SECURED (Solidity 0.8+ or SafeMath)
contract SecureTimelock {
    mapping(address => uint) public lockTime;
    
    function increaseLockTime(uint _seconds) public {
        // ✅ Solidity 0.8.0+ automatically reverts on arithmetic overflow
        lockTime[msg.sender] = lockTime[msg.sender] + _seconds;
    }
}`
  },
  {
    id: "flashloan",
    title: "3. Flash Loan Price Oracle Manipulation",
    sol_vuln: `// VULNERABLE: Direct DEX spot price usage
function getAssetPrice() public view returns (uint) {
    // ❌ Spot price manipulated via single-block flash loan!
    return pair.getReserves();
}`,
    sol_secure: `// SECURED: Time-Weighted Average Price (TWAP) / Chainlink
function getAssetPrice() public view returns (uint) {
    // ✅ Chainlink Decentralized Oracle
    (, int price,,,) = priceFeed.latestRoundData();
    return uint(price);
}`
  }
];

const TRACE_STEPS = [
  { step: 1, text: "Attacker executes attack() sending 1 ETH deposit", storage: "slot[balances][attacker] = 1 ETH", gas: "290,000" },
  { step: 2, text: "Attacker calls withdraw()", storage: "slot[balances][attacker] = 1 ETH", gas: "275,000" },
  { step: 3, text: "Bank executes raw call msg.sender.call{value: 1 ETH}()", storage: "slot[balances][attacker] = 1 ETH (Unchanged!)", gas: "260,000" },
  { step: 4, text: "Attacker fallback() receives ETH and re-enters withdraw()!", storage: "REENTRANCY LOOP TRIGGERED", gas: "220,000" },
  { step: 5, text: "Bank drains balance repeatedly until gas runs out!", storage: "Bank Contract Drained to 0 ETH", gas: "15,000" }
];

const CHECKLIST_ITEMS = [
  "Enforce Checks-Effects-Interactions pattern for all Ether transfers",
  "Use ReentrancyGuard modifier (OpenZeppelin) for external state calls",
  "Verify compiler version >= 0.8.0 to prevent integer overflows",
  "Use Chainlink Oracles or TWAP instead of DEX spot reserves",
  "Replace tx.origin with msg.sender for authorization checks",
  "Audit fallback() and receive() functions for unexpected ETH inputs",
  "Conduct Slither static analysis and Echidna fuzz testing",
  "Implement circuit breakers / emergency pause functionality"
];

class SmartContractApp {
  constructor() {
    this.currentVector = VECTORS[0];
    this.currentTraceIdx = 0;
    this.checkedItems = new Set(JSON.parse(localStorage.getItem('scs_checklist') || '[]'));
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderVectors();
    this.renderTraceStep();
    this.renderChecklist();
  }

  bindEvents() {
    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-mode');
    });

    // Tabs
    document.querySelectorAll('.scs-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.scs-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.scs-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    // Trace Controls
    document.getElementById('btnPrevStep').addEventListener('click', () => {
      if (this.currentTraceIdx > 0) {
        this.currentTraceIdx--;
        this.renderTraceStep();
      }
    });

    document.getElementById('btnNextStep').addEventListener('click', () => {
      if (this.currentTraceIdx < TRACE_STEPS.length - 1) {
        this.currentTraceIdx++;
        this.renderTraceStep();
      }
    });
  }

  renderVectors() {
    const listEl = document.getElementById('vectorList');
    listEl.innerHTML = VECTORS.map(v => `
      <div class="scs-vector-item ${v.id === this.currentVector.id ? 'active' : ''}" data-id="${v.id}">
        ${v.title}
      </div>
    `).join('');

    listEl.querySelectorAll('.scs-vector-item').forEach(item => {
      item.addEventListener('click', () => {
        this.currentVector = VECTORS.find(v => v.id === item.dataset.id);
        this.renderVectors();
        this.renderCode();
      });
    });

    this.renderCode();
  }

  renderCode() {
    document.getElementById('vectorTitle').innerText = this.currentVector.title;
    document.getElementById('vulnCodeArea').value = this.currentVector.sol_vuln;
    document.getElementById('secureCodeArea').value = this.currentVector.sol_secure;
  }

  renderTraceStep() {
    const container = document.getElementById('traceStepsContainer');
    container.innerHTML = TRACE_STEPS.map((s, idx) => `
      <div class="scs-step-item ${idx === this.currentTraceIdx ? 'active' : ''}">
        <strong>Step ${s.step}:</strong> ${s.text}
      </div>
    `).join('');

    const currentStep = TRACE_STEPS[this.currentTraceIdx];
    document.getElementById('evmStateBox').innerHTML = `
      <div><strong>Current EVM Gas:</strong> ${currentStep.gas}</div>
      <div style="margin-top: 8px;"><strong>Storage State:</strong></div>
      <div style="color: #ef4444; margin-top: 4px;">${currentStep.storage}</div>
    `;
  }

  renderChecklist() {
    const container = document.getElementById('checklistContainer');
    container.innerHTML = CHECKLIST_ITEMS.map((item, idx) => `
      <label class="scs-check-item">
        <input type="checkbox" ${this.checkedItems.has(idx) ? 'checked' : ''} data-idx="${idx}" />
        <span>${item}</span>
      </label>
    `).join('');

    container.querySelectorAll('input').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (e.target.checked) this.checkedItems.add(idx);
        else this.checkedItems.delete(idx);
        localStorage.setItem('scs_checklist', JSON.stringify([...this.checkedItems]));
        document.getElementById('checklistProgress').innerText = `${this.checkedItems.size} / ${CHECKLIST_ITEMS.length} Completed`;
      });
    });

    document.getElementById('checklistProgress').innerText = `${this.checkedItems.size} / ${CHECKLIST_ITEMS.length} Completed`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SmartContractApp();
});
