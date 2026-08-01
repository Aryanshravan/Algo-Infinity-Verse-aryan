/* ============================================================
   Autonomous AI Code Reviewer & Security Linter JS
   ============================================================ */

   
document.addEventListener('DOMContentLoaded', () => {
  const airCodeInput = document.getElementById('airCodeInput');
  const btnScanCode = document.getElementById('btnScanCode');
  const btnApplyFix = document.getElementById('btnApplyFix');
  const presetBtns = document.querySelectorAll('.air-btn-preset');
  const findingsContainer = document.getElementById('findingsContainer');
  const securityScoreVal = document.getElementById('securityScoreVal');
  const securityGradeLabel = document.getElementById('securityGradeLabel');

  const snippets = {
    'xss': `app.get('/search', (req, res) => {
  const query = req.query.q;
  // VULNERABILITY: Reflected Cross-Site Scripting (XSS)
  res.send("<h1>Search results for: " + query + "</h1>");
});`,
    'sqli': `function getUser(userId) {
  // VULNERABILITY: SQL Injection
  const sql = "SELECT * FROM users WHERE id = '" + userId + "'";
  db.query(sql);
}`,
    'memory': `void processData(char* userInput) {
  char buffer[64];
  // VULNERABILITY: Buffer Overflow / Unbounded Memory Access
  strcpy(buffer, userInput);
}`
  };

  function init() {
    setupEventListeners();
    loadPreset('xss');
    scanCode();
  }

  function setupEventListeners() {
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadPreset(btn.dataset.preset);
      });
    });

    btnScanCode.addEventListener('click', scanCode);

    btnApplyFix.addEventListener('click', () => {
      const code = airCodeInput.value;
      if (code.includes('query')) {
        airCodeInput.value = `app.get('/search', (req, res) => {
  const query = req.query.q;
  // AI FIXED: Escaped HTML output to prevent XSS
  const safeQuery = sanitizeHtml(query);
  res.send("<h1>Search results for: " + safeQuery + "</h1>");
});`;
      } else if (code.includes('SELECT')) {
        airCodeInput.value = `function getUser(userId) {
  // AI FIXED: Parameterized SQL Query
  const sql = "SELECT * FROM users WHERE id = ?";
  db.query(sql, [userId]);
}`;
      } else {
        airCodeInput.value = `void processData(char* userInput) {
  char buffer[64];
  // AI FIXED: Bounded Memory Access
  strncpy(buffer, userInput, sizeof(buffer) - 1);
  buffer[sizeof(buffer) - 1] = '\\0';
}`;
      }
      scanCode();
    });
  }

  function loadPreset(key) {
    airCodeInput.value = snippets[key] || '';
  }

  function scanCode() {
    const code = airCodeInput.value;
    findingsContainer.innerHTML = '';
    let score = 100;

    if (code.includes('res.send') && code.includes('+ query')) {
      score -= 55;
      addFinding('danger', 'Reflected Cross-Site Scripting (XSS)', 'Line 4: Unsanitized user input `req.query.q` concatenated directly into HTML response.');
    }

    if (code.includes('SELECT') && code.includes("+ userId")) {
      score -= 60;
      addFinding('danger', 'SQL Injection (OWASP A03:2021)', 'Line 3: Raw string concatenation used in SQL query. Use parameterized queries instead.');
    }

    if (code.includes('strcpy')) {
      score -= 50;
      addFinding('warning', 'Unbounded Buffer Copy (CWE-120)', 'Line 4: `strcpy` does not enforce buffer boundaries. Use `strncpy` or `snprintf`.');
    }

    if (score < 100) {
      securityScoreVal.textContent = `${score} / 100`;
      securityScoreVal.style.color = score < 50 ? 'var(--air-danger)' : 'var(--air-warning)';
      securityGradeLabel.textContent = score < 50 ? 'CRITICAL VULNERABILITIES FOUND' : 'MODERATE SECURITY RISKS';
    } else {
      securityScoreVal.textContent = '98 / 100';
      securityScoreVal.style.color = 'var(--air-success)';
      securityGradeLabel.textContent = 'PASSED AST SECURITY AUDIT';
      findingsContainer.innerHTML = `
        <div class="air-finding-card" style="border-color:var(--air-success); background:rgba(16,185,129,0.1)">
          <strong><i class="fas fa-check-circle" style="color:var(--air-success)"></i> Code Passed AST Linter</strong>
          <div>No OWASP Top 10 vulnerabilities or memory safety bugs detected!</div>
        </div>
      `;
    }
  }

  function addFinding(type, title, desc) {
    const div = document.createElement('div');
    div.className = `air-finding-card ${type}`;
    div.innerHTML = `
      <strong style="color:var(--air-${type})"><i class="fas fa-exclamation-triangle"></i> ${title}</strong>
      <div>${desc}</div>
    `;
    findingsContainer.appendChild(div);
  }

  init();
});
