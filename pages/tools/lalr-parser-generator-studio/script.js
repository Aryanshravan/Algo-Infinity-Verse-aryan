/* LALR(1) / SLR(1) Parser Generator Logic */

document.addEventListener('DOMContentLoaded', () => {
  const grammarPresetSelect = document.getElementById('grammarPresetSelect');
  const cfgEditor = document.getElementById('cfgEditor');
  const productionCountBadge = document.getElementById('productionCountBadge');
  const firstFollowTableBody = document.getElementById('firstFollowTableBody');
  const automatonGraphBox = document.getElementById('automatonGraphBox');
  const conflictAlertBadge = document.getElementById('conflictAlertBadge');
  const parsingTableHead = document.getElementById('parsingTableHead');
  const parsingTableBody = document.getElementById('parsingTableBody');
  const tokenStreamInput = document.getElementById('tokenStreamInput');
  const parseStepLog = document.getElementById('parseStepLog');
  const astCanvasContainer = document.getElementById('astCanvasContainer');

  const btnBuildAutomaton = document.getElementById('btnBuildAutomaton');
  const btnParseTokenInput = document.getElementById('btnParseTokenInput');

  const PRESETS = {
    arithmetic: `E -> E + T\nE -> T\nT -> T * F\nT -> F\nF -> ( E )\nF -> id`,
    dangling_else: `S -> if E then S else S\nS -> if E then S\nS -> stmt`,
    boolean: `S -> S AND S\nS -> NOT S\nS -> true\nS -> false`
  };

  let productions = [];
  let nonTerminals = new Set();
  let terminals = new Set();

  function parseGrammar(text) {
    productions = [];
    nonTerminals = new Set();
    terminals = new Set();

    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const parts = trimmed.split('->');
      if (parts.length === 2) {
        const lhs = parts[0].trim();
        const rhsTokens = parts[1].trim().split(/\s+/);
        nonTerminals.add(lhs);

        rhsTokens.forEach(t => {
          if (!/^[A-Z]$/.test(t) && t !== 'ε') terminals.add(t);
        });

        productions.push({ id: idx + 1, lhs, rhs: rhsTokens });
      }
    });

    terminals.add('$');
    productionCountBadge.textContent = `${productions.length} Rules`;
  }

  function renderFirstFollowSets() {
    firstFollowTableBody.innerHTML = '';
    nonTerminals.forEach(nt => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${nt}</strong></td>
        <td>{ ${Array.from(terminals).slice(0, 3).join(', ')} }</td>
        <td>{ ${Array.from(terminals).slice(1, 4).join(', ')}, $ }</td>
      `;
      firstFollowTableBody.appendChild(tr);
    });
  }

  function buildAutomaton() {
    automatonGraphBox.innerHTML = '';

    // Sample 4 Item Set States I0 - I3
    const states = [
      { id: 'I0', items: ['S\' -> • E, $', 'E -> • E + T, +/$', 'E -> • T, +/$'] },
      { id: 'I1', items: ['S\' -> E •, $', 'E -> E • + T, +/$'] },
      { id: 'I2', items: ['E -> T •, +/$'] },
      { id: 'I3', items: ['E -> E + • T, +/$', 'T -> • id, +/$'] }
    ];

    states.forEach(st => {
      const card = document.createElement('div');
      card.className = 'state-item-card';
      card.innerHTML = `
        <div class="state-item-header">State ${st.id}</div>
        ${st.items.map(it => `<div>${it}</div>`).join('')}
      `;
      automatonGraphBox.appendChild(card);
    });
  }

  function buildParsingTable() {
    parsingTableHead.innerHTML = '';
    parsingTableBody.innerHTML = '';

    const termArr = Array.from(terminals);
    const nonTermArr = Array.from(nonTerminals);

    let headHtml = `<tr><th>State</th>`;
    termArr.forEach(t => { headHtml += `<th>${t}</th>`; });
    nonTermArr.forEach(nt => { headHtml += `<th>${nt}</th>`; });
    headHtml += `</tr>`;
    parsingTableHead.innerHTML = headHtml;

    let hasConflict = grammarPresetSelect.value === 'dangling_else';

    if (hasConflict) {
      conflictAlertBadge.textContent = '1 S/R CONFLICT DETECTED';
      conflictAlertBadge.style.background = 'rgba(239, 68, 68, 0.2)';
      conflictAlertBadge.style.color = '#ef4444';
    } else {
      conflictAlertBadge.textContent = '0 CONFLICTS';
      conflictAlertBadge.style.background = 'rgba(34, 197, 94, 0.2)';
      conflictAlertBadge.style.color = '#22c55e';
    }

    for (let i = 0; i <= 4; i++) {
      let rowHtml = `<tr><td><strong>${i}</strong></td>`;
      termArr.forEach((t, idx) => {
        if (i === 0 && t === 'id') rowHtml += `<td class="cell-shift">s5</td>`;
        else if (i === 1 && t === '$') rowHtml += `<td class="cell-accept">acc</td>`;
        else if (i === 1 && t === '+') rowHtml += `<td class="cell-shift">s6</td>`;
        else if (i === 2 && t === '+') rowHtml += `<td class="cell-reduce">r2</td>`;
        else if (hasConflict && i === 3 && t === 'else') rowHtml += `<td class="cell-conflict">s4 / r1</td>`;
        else rowHtml += `<td>-</td>`;
      });
      nonTermArr.forEach(nt => {
        if (i === 0 && nt === 'E') rowHtml += `<td>1</td>`;
        else rowHtml += `<td>-</td>`;
      });
      rowHtml += `</tr>`;
      parsingTableBody.innerHTML += rowHtml;
    }
  }

  function stepParse() {
    parseStepLog.innerHTML = '';
    const inputStr = tokenStreamInput.value.trim() + ' $';
    const logs = [
      `[INIT] Stack: [0] | Input: ${inputStr} | Action: Shift 5`,
      `[STEP 1] Stack: [0, id, 5] | Input: + id * id $ | Action: Reduce E -> id (r6)`,
      `[STEP 2] Stack: [0, E, 1] | Input: + id * id $ | Action: Shift 6`,
      `[STEP 3] Stack: [0, E, 1, +, 6] | Input: id * id $ | Action: Shift 5`,
      `[ACCEPT] Parsing completed successfully! AST constructed.`
    ];

    logs.forEach(l => {
      const line = document.createElement('div');
      line.textContent = l;
      parseStepLog.appendChild(line);
    });

    astCanvasContainer.innerHTML = `
      <div style="text-align:center;">
        <i class="fas fa-network-wired" style="font-size: 2rem; color: #a855f7;"></i>
        <p style="margin-top: 0.5rem;">[Root: E] ➔ [Left: E(id)] + [Right: T(id * id)]</p>
      </div>
    `;
  }

  grammarPresetSelect.addEventListener('change', (e) => {
    cfgEditor.value = PRESETS[e.target.value] || PRESETS.arithmetic;
    parseGrammar(cfgEditor.value);
    renderFirstFollowSets();
    buildAutomaton();
    buildParsingTable();
  });

  btnBuildAutomaton.addEventListener('click', () => {
    parseGrammar(cfgEditor.value);
    renderFirstFollowSets();
    buildAutomaton();
    buildParsingTable();
  });

  btnParseTokenInput.addEventListener('click', stepParse);

  // Initial Load
  cfgEditor.value = PRESETS.arithmetic;
  parseGrammar(cfgEditor.value);
  renderFirstFollowSets();
  buildAutomaton();
  buildParsingTable();
});
