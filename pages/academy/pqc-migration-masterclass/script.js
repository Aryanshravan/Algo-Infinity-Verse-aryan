(function () {
  'use strict';

  var STORAGE_KEY = 'pqc-migration-masterclass-progress';

  var MODULES = [
    {
      id: 'nist-pqc-overview',
      title: 'NIST PQC Overview (FIPS 203/204)',
      short: 'Standards landscape',
      html:
        '<p>In August 2024, NIST published the first finalized post-quantum cryptography (PQC) standards. <strong>FIPS 203</strong> specifies <code>ML-KEM</code> (Module-Lattice-Based Key-Encapsulation Mechanism, formerly Kyber) for key establishment. <strong>FIPS 204</strong> specifies <code>ML-DSA</code> (Module-Lattice-Based Digital Signature Algorithm, formerly Dilithium) for digital signatures. A companion standard, FIPS 205, covers the hash-based signature scheme SPHINCS+ (<code>SLH-DSA</code>).</p>' +
        '<p>These algorithms are designed to resist attacks from both classical and large-scale quantum computers. They replace (or hybridize with) RSA and elliptic-curve schemes for long-term confidentiality and authenticity.</p>' +
        '<ul>' +
        '<li><strong>ML-KEM</strong> — primary KEM for TLS, VPN, and application key exchange.</li>' +
        '<li><strong>ML-DSA</strong> — primary general-purpose signature scheme.</li>' +
        '<li><strong>SLH-DSA (SPHINCS+)</strong> — conservative hash-based signatures for high-assurance use.</li>' +
        '<li>Parameter sets map to NIST security categories 1–5 (roughly AES-128 through AES-256).</li>' +
        '</ul>' +
        '<p>Migration is not “swap one library call.” Inventory crypto usage, plan hybrid transitions, and update certificates, protocols, and hardware roots of trust.</p>'
    },
    {
      id: 'shor-threat',
      title: "Shor's Algorithm Threat to RSA/ECC",
      short: 'Factoring & discrete log',
      html:
        '<p><strong>Shor’s algorithm</strong> (1994) efficiently factors large integers and solves discrete logarithms on a sufficiently large, fault-tolerant quantum computer. That breaks the hardness assumptions behind RSA, Diffie–Hellman, and elliptic-curve cryptography (including ECDSA and ECDH on NIST/SEC curves and Curve25519).</p>' +
        '<p>Classically, RSA-2048 and P-256 are considered strong. Quantumly, the asymptotic cost becomes polynomial in the key size — once enough logical qubits and low error rates exist.</p>' +
        '<ul>' +
        '<li><strong>Harvest-now, decrypt-later</strong> — adversaries can store ciphertext today and decrypt when CRQCs arrive.</li>' +
        '<li>Long-lived secrets (PII, state secrets, medical records) are most at risk.</li>' +
        '<li>Signatures already verified are fine historically, but future authenticity needs PQC.</li>' +
        '<li>Timeline uncertainty is high; migration lead times are long — start early.</li>' +
        '</ul>' +
        '<p>Symmetric crypto is not broken by Shor; see the Grover module for that threat model.</p>'
    },
    {
      id: 'grover-symmetric',
      title: "Grover's Algorithm & Symmetric Keys",
      short: 'Quadratic search speedup',
      html:
        '<p><strong>Grover’s algorithm</strong> provides a quadratic speedup for unstructured search. Against an <em>n</em>-bit symmetric key, brute force drops from roughly 2<sup>n</sup> to about 2<sup>n/2</sup> oracle queries (with substantial quantum resource overhead in practice).</p>' +
        '<p>Practical guidance: AES-128 remains usable for many short-lived secrets under current estimates, but AES-256 is preferred for long-term confidentiality under a conservative quantum threat model. Hash functions similarly benefit from larger outputs (e.g., SHA-384/512) for collision resistance.</p>' +
        '<ul>' +
        '<li>Double key length is the classic “Grover mitigation” rule of thumb.</li>' +
        '<li>Grover does <em>not</em> break AES the way Shor breaks RSA — it halves effective security bits.</li>' +
        '<li>AEAD modes (AES-GCM, ChaCha20-Poly1305) remain the right constructions; only parameters may grow.</li>' +
        '<li>Combine stronger symmetric crypto with PQC KEMs for transport security.</li>' +
        '</ul>' +
        '<p>Use the timeline estimator below to explore educational Shor vs Grover impact heuristics.</p>'
    },
    {
      id: 'ml-kem-kyber',
      title: 'ML-KEM / Kyber',
      short: 'Lattice KEM (FIPS 203)',
      html:
        '<p><strong>ML-KEM</strong> is a lattice-based key-encapsulation mechanism standardized as FIPS 203. It is derived from CRYSTALS-Kyber. A KEM lets one party encapsulate a shared secret to another’s public key, producing a ciphertext the peer can decapsulate.</p>' +
        '<p>Common parameter sets: <code>ML-KEM-512</code>, <code>ML-KEM-768</code>, and <code>ML-KEM-1024</code> (NIST categories 1, 3, and 5). Kyber-768 / ML-KEM-768 is a popular default for TLS hybrids.</p>' +
        '<ul>' +
        '<li>Public keys and ciphertexts are larger than ECDH (kilobytes, not 32 bytes).</li>' +
        '<li>Performance is typically competitive with classical ECC on modern CPUs.</li>' +
        '<li>Security rests on Module-LWE / Module-SIS hardness assumptions.</li>' +
        '<li>Use vetted libraries (e.g., liboqs, BoringSSL PQC, OpenSSL providers) — do not roll your own.</li>' +
        '</ul>' +
        '<p>In hybrid designs, ML-KEM is combined with X25519 so the session remains secure if either primitive holds.</p>'
    },
    {
      id: 'ml-dsa-dilithium',
      title: 'ML-DSA / Dilithium',
      short: 'Lattice signatures (FIPS 204)',
      html:
        '<p><strong>ML-DSA</strong> (CRYSTALS-Dilithium) is NIST’s primary lattice-based digital signature algorithm under FIPS 204. It signs messages with module-lattice techniques and offers parameter sets such as <code>ML-DSA-44</code>, <code>ML-DSA-65</code>, and <code>ML-DSA-87</code>.</p>' +
        '<p>Signatures and public keys are substantially larger than ECDSA/Ed25519. Protocol designers must account for certificate chain size, OCSP stapling, and handshake bandwidth.</p>' +
        '<ul>' +
        '<li>Good all-around choice for code signing, TLS certificates, and software updates.</li>' +
        '<li>Fast verification relative to many hash-based alternatives.</li>' +
        '<li>Pair with careful PKI rollout: dual certificates, hybrid certs, or phased trust anchors.</li>' +
        '<li>Hardware security modules and smart cards need firmware support for new algorithms.</li>' +
        '</ul>' +
        '<p>Compare sizes and quantum posture in the suite auditor on this page.</p>'
    },
    {
      id: 'sphincs-plus',
      title: 'SPHINCS+',
      short: 'Hash-based signatures (FIPS 205)',
      html:
        '<p><strong>SPHINCS+</strong> (standardized as <code>SLH-DSA</code> in FIPS 205) is a stateless hash-based signature scheme. Its security reduces primarily to the underlying hash function — a conservative assumption many organizations prefer for root-of-trust and long-lived code signing.</p>' +
        '<p>Trade-offs: signatures are much larger and signing is slower than ML-DSA. Verification is also heavier. Choose SPHINCS+ when conservative assumptions outweigh bandwidth and CPU costs.</p>' +
        '<ul>' +
        '<li>Stateless — avoids the catastrophic reuse bugs of stateful hash schemes (LMS/XMSS).</li>' +
        '<li>Parameter sets trade signature size vs. security vs. speed (e.g., SHA2/SHAKE variants).</li>' +
        '<li>Ideal for firmware, document signing, and high-assurance anchors.</li>' +
        '<li>Often used alongside ML-DSA rather than as the sole everyday signature.</li>' +
        '</ul>' +
        '<p>Include SPHINCS+ in crypto inventories even if ML-DSA is your primary path.</p>'
    },
    {
      id: 'hybrid-x25519-kyber',
      title: 'Hybrid Key Exchange (X25519 + Kyber768)',
      short: 'Classical + PQC KEM',
      html:
        '<p>A <strong>hybrid key exchange</strong> combines a classical ECDH (commonly X25519) with a PQC KEM (commonly Kyber-768 / ML-KEM-768). Both shared secrets are mixed with a KDF (typically HKDF). The resulting session keys remain secret if <em>at least one</em> of the component algorithms is unbroken.</p>' +
        '<p>This design hedges against cryptanalytic surprises in new PQC schemes while defending against harvest-now-decrypt-later attacks on classical ECDH alone.</p>' +
        '<ul>' +
        '<li>Wire format: classical share + Kyber ciphertext (and often negotiation of hybrid groups).</li>' +
        '<li>TLS 1.3 hybrids (e.g., X25519Kyber768Draft / MLKEM variants) follow this pattern.</li>' +
        '<li>Ensure constant-time implementations and proper domain separation in the KDF.</li>' +
        '<li>Plan fallbacks for peers that only speak classical or only speak PQC.</li>' +
        '</ul>' +
        '<p>Use the hybrid handshake simulator below to visualize the step flow.</p>'
    },
    {
      id: 'migration-playbook',
      title: 'Migration Playbook for Apps',
      short: 'Practical rollout steps',
      html:
        '<p>A practical PQC migration playbook for application teams:</p>' +
        '<ul>' +
        '<li><strong>Inventory</strong> — find TLS libraries, JWT/signing code, VPN, SSH, disk encryption, HSM usage, and stored ciphertexts.</li>' +
        '<li><strong>Classify data</strong> — prioritize secrets with long confidentiality lifetimes (harvest-now risk).</li>' +
        '<li><strong>Upgrade crypto stacks</strong> — OpenSSL 3.x providers, BoringSSL, liboqs, language bindings, cloud KMS PQC support.</li>' +
        '<li><strong>Hybrid first</strong> — enable hybrid KEMs in TLS/VPN before pure-PQC cutovers.</li>' +
        '<li><strong>Certificates</strong> — dual-chain or hybrid certificates; test middleboxes for large handshake failures.</li>' +
        '<li><strong>Performance budgets</strong> — measure latency, CPU, and bandwidth on constrained devices.</li>' +
        '<li><strong>Crypto agility</strong> — abstract algorithms behind interfaces; avoid hard-coded RSA/ECDSA assumptions.</li>' +
        '<li><strong>Retire</strong> — schedule deprecation of pure RSA/ECC key exchange once peers support PQC.</li>' +
        '</ul>' +
        '<p>Complete the quiz to validate your mental model, and revisit modules as standards and library support evolve.</p>'
    }
  ];

  var ALGORITHMS = [
    {
      id: 'rsa-2048',
      name: 'RSA-2048',
      short: 'Classical public-key (factoring)',
      publicKey: '~256–294 bytes (DER varies)',
      privateKey: '~1.2 KB',
      ciphertextOrSig: '256-byte signatures / encrypt blocks',
      quantumSafe: false,
      posture: 'unsafe',
      postureLabel: 'Not quantum-safe',
      advice:
        'Vulnerable to Shor’s algorithm. Prefer hybrid or PQC KEMs/signatures for new systems. Migrate TLS key exchange away from RSA; keep RSA only for legacy interoperability with a sunset date.'
    },
    {
      id: 'ecc-p256',
      name: 'ECC P-256',
      short: 'NIST P-256 ECDH / ECDSA',
      publicKey: '32–65 bytes (compressed/uncompressed)',
      privateKey: '32 bytes',
      ciphertextOrSig: '~64-byte ECDSA signatures',
      quantumSafe: false,
      posture: 'unsafe',
      postureLabel: 'Not quantum-safe',
      advice:
        'Broken by Shor via elliptic-curve discrete log. Excellent classical efficiency — pair with ML-KEM in hybrids (or migrate signatures to ML-DSA/SLH-DSA). Do not rely on P-256 alone for long-term confidentiality.'
    },
    {
      id: 'kyber-768',
      name: 'Kyber-768 / ML-KEM-768',
      short: 'Lattice KEM (FIPS 203)',
      publicKey: '1184 bytes',
      privateKey: '2400 bytes',
      ciphertextOrSig: '1088-byte ciphertext',
      quantumSafe: true,
      posture: 'safe',
      postureLabel: 'Quantum-safe (KEM)',
      advice:
        'Primary NIST KEM choice for many apps. Deploy in hybrid with X25519 for crypto-agile defense-in-depth. Watch handshake size on constrained links; verify library FIPS 203 compliance.'
    },
    {
      id: 'dilithium',
      name: 'Dilithium / ML-DSA',
      short: 'Lattice signatures (FIPS 204)',
      publicKey: '~1312–2592 bytes (param-dependent)',
      privateKey: '~2528–4896 bytes',
      ciphertextOrSig: '~2420–4627 byte signatures',
      quantumSafe: true,
      posture: 'safe',
      postureLabel: 'Quantum-safe (signature)',
      advice:
        'Default PQC signature for TLS certs and general signing. Plan for larger certificates and chains. For ultra-conservative roots, consider dual-signing with SPHINCS+ / SLH-DSA.'
    }
  ];

  var HANDSHAKE_DETAILS = [
    {
      status: 'Step 1/4 — Classical ECDH',
      html:
        '<span class="pqc-wire">→ ClientHello / key_share: X25519 public (32 B)</span><br>' +
        '<span class="pqc-wire">← Server key_share: X25519 public (32 B)</span><br>' +
        '<span class="pqc-secret">★ shared_classical = X25519(sk_c, pk_s) = X25519(sk_s, pk_c)</span>'
    },
    {
      status: 'Step 2/4 — Kyber encapsulate',
      html:
        '<span class="pqc-wire">← Server ML-KEM-768 public key (or pre-provisioned)</span><br>' +
        '<span class="pqc-secret">★ (ct, shared_kem) = Encaps(pk_kem)</span><br>' +
        '<span class="pqc-wire">→ Client sends Kyber ciphertext (~1088 B)</span><br>' +
        '<span class="pqc-secret">★ Server: shared_kem = Decaps(sk_kem, ct)</span>'
    },
    {
      status: 'Step 3/4 — Combine secrets',
      html:
        '<span class="pqc-secret">★ hybrid_ikm = shared_classical || shared_kem</span><br>' +
        '<span class="pqc-muted">(Some designs use dual PRF / transcript-bound mix — same idea: both must contribute.)</span>'
    },
    {
      status: 'Step 4/4 — Derive session keys',
      html:
        '<span class="pqc-secret">★ traffic_secrets = HKDF-Expand(HKDF-Extract(salt, hybrid_ikm), …)</span><br>' +
        '<span class="pqc-ok">✓ Secure if X25519 <em>or</em> Kyber remains unbroken — hybrid hedge complete.</span>'
    }
  ];

  var QUIZ = [
    {
      id: 'q1',
      question: 'Which NIST standard specifies ML-KEM (Kyber)?',
      options: ['FIPS 197', 'FIPS 203', 'FIPS 186-5', 'SP 800-90A'],
      answer: 1
    },
    {
      id: 'q2',
      question: 'Shor’s algorithm primarily threatens:',
      options: [
        'AES-GCM confidentiality via quadratic key search',
        'RSA and ECC by efficient factoring / discrete log',
        'Only MD5 collision resistance',
        'HMAC with SHA-256 exclusively'
      ],
      answer: 1
    },
    {
      id: 'q3',
      question: 'Grover’s algorithm against an n-bit symmetric key roughly reduces brute-force work to:',
      options: ['2ⁿ operations', '2ⁿ/² operations', 'n² operations', 'Constant time'],
      answer: 1
    },
    {
      id: 'q4',
      question: 'ML-KEM is best categorized as a:',
      options: [
        'Hash-based signature',
        'Key-encapsulation mechanism (KEM)',
        'Block cipher mode',
        'Password hashing function'
      ],
      answer: 1
    },
    {
      id: 'q5',
      question: 'A hybrid X25519 + Kyber-768 exchange is valuable because:',
      options: [
        'It halves ciphertext size versus Kyber alone',
        'Session keys stay secret if at least one component algorithm remains secure',
        'It removes the need for certificates',
        'It disables Grover entirely'
      ],
      answer: 1
    },
    {
      id: 'q6',
      question: 'SPHINCS+ / SLH-DSA is primarily chosen when you want:',
      options: [
        'The smallest possible signatures',
        'Conservative hash-based security assumptions',
        'Faster signing than Dilithium in all cases',
        'A drop-in replacement for AES-128'
      ],
      answer: 1
    },
    {
      id: 'q7',
      question: '“Harvest now, decrypt later” motivates migrating:',
      options: [
        'Only UI themes',
        'Long-lived confidentiality (stored ciphertext) to PQC/hybrid KEMs sooner',
        'Only logging formats',
        'DNS TTL values'
      ],
      answer: 1
    }
  ];

  var state = {
    completed: {},
    quizBest: null,
    activeModule: 0,
    handshakeStep: -1,
    handshakeTimer: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        state.completed = data.completed && typeof data.completed === 'object' ? data.completed : {};
        if (typeof data.quizBest === 'number') state.quizBest = data.quizBest;
      }
    } catch (e) {
      /* ignore corrupt storage */
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          completed: state.completed,
          quizBest: state.quizBest
        })
      );
    } catch (e) {
      /* quota / private mode */
    }
  }

  function completedCount() {
    var n = 0;
    for (var i = 0; i < MODULES.length; i++) {
      if (state.completed[MODULES[i].id]) n += 1;
    }
    return n;
  }

  function updateHeroStats() {
    var done = completedCount();
    var total = MODULES.length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    var doneEl = $('statModulesDone');
    var pctEl = $('statProgressPct');
    var bestEl = $('statQuizBest');
    var fill = $('heroProgressFill');
    var bar = $('heroProgressBar');

    if (doneEl) doneEl.textContent = String(done);
    if ($('statModulesTotal')) $('statModulesTotal').textContent = String(total);
    if (pctEl) pctEl.textContent = pct + '%';
    if (bestEl) {
      bestEl.textContent =
        state.quizBest === null ? '—' : state.quizBest + '/' + QUIZ.length;
    }
    if (fill) fill.style.width = pct + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
  }

  /* ---- Modules ---- */

  function renderModuleNav() {
    var list = $('moduleList');
    if (!list) return;
    list.innerHTML = '';

    MODULES.forEach(function (mod, index) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pqc-module-btn';
      btn.setAttribute('data-index', String(index));
      btn.setAttribute('aria-current', index === state.activeModule ? 'true' : 'false');
      if (index === state.activeModule) btn.classList.add('is-active');
      if (state.completed[mod.id]) btn.classList.add('is-complete');

      var check = document.createElement('span');
      check.className = 'pqc-module-check';
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = state.completed[mod.id]
        ? '<i class="fas fa-circle-check"></i>'
        : '<i class="far fa-circle"></i>';

      var meta = document.createElement('span');
      meta.className = 'pqc-module-meta';
      meta.innerHTML =
        '<strong>' +
        escapeHtml(mod.title) +
        '</strong><span>Module ' +
        (index + 1) +
        ' · ' +
        escapeHtml(mod.short) +
        '</span>';

      btn.appendChild(check);
      btn.appendChild(meta);
      btn.addEventListener('click', function () {
        showModule(index);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function showModule(index) {
    if (index < 0 || index >= MODULES.length) return;
    state.activeModule = index;
    var mod = MODULES[index];
    var title = $('lessonTitle');
    var body = $('lessonBody');
    var badge = $('lessonBadge');
    var markBtn = $('markCompleteBtn');
    var prevBtn = $('prevModuleBtn');
    var nextBtn = $('nextModuleBtn');

    if (title) title.textContent = mod.title;
    if (body) body.innerHTML = mod.html;
    if (badge) {
      badge.hidden = !state.completed[mod.id];
    }
    if (markBtn) {
      markBtn.disabled = false;
      markBtn.innerHTML = state.completed[mod.id]
        ? '<i class="fas fa-rotate-left" aria-hidden="true"></i> Mark incomplete'
        : '<i class="fas fa-check" aria-hidden="true"></i> Mark complete';
    }
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === MODULES.length - 1;
    renderModuleNav();
  }

  function toggleComplete() {
    var mod = MODULES[state.activeModule];
    if (!mod) return;
    if (state.completed[mod.id]) {
      delete state.completed[mod.id];
    } else {
      state.completed[mod.id] = true;
    }
    saveProgress();
    updateHeroStats();
    showModule(state.activeModule);
  }

  /* ---- Cryptographic suite auditor ---- */

  function renderAlgoPicks() {
    var host = $('algoPicks');
    if (!host) return;
    host.innerHTML = '';
    ALGORITHMS.forEach(function (algo) {
      var label = document.createElement('label');
      label.className = 'pqc-algo-pick';
      label.innerHTML =
        '<input type="checkbox" name="algo" value="' +
        escapeHtml(algo.id) +
        '" checked />' +
        '<span><strong>' +
        escapeHtml(algo.name) +
        '</strong><span>' +
        escapeHtml(algo.short) +
        '</span></span>';
      host.appendChild(label);
    });
  }

  function getSelectedAlgos() {
    var checks = document.querySelectorAll('#algoPicks input[name="algo"]:checked');
    var ids = {};
    for (var i = 0; i < checks.length; i++) {
      ids[checks[i].value] = true;
    }
    return ALGORITHMS.filter(function (a) {
      return ids[a.id];
    });
  }

  function compareAlgos() {
    var selected = getSelectedAlgos();
    var host = $('auditorResults');
    if (!host) return;

    if (!selected.length) {
      host.innerHTML = '<p class="pqc-muted">Select at least one algorithm to compare.</p>';
      return;
    }

    var html = '';
    selected.forEach(function (algo) {
      var badgeClass =
        algo.posture === 'safe'
          ? 'pqc-badge-safe'
          : algo.posture === 'hybrid'
            ? 'pqc-badge-hybrid'
            : 'pqc-badge-unsafe';
      html +=
        '<article class="pqc-compare-card">' +
        '<h4>' +
        escapeHtml(algo.name) +
        ' <span class="pqc-badge ' +
        badgeClass +
        '">' +
        escapeHtml(algo.postureLabel) +
        '</span></h4>' +
        '<dl class="pqc-compare-meta">' +
        '<dt>Public key</dt><dd>' +
        escapeHtml(algo.publicKey) +
        '</dd>' +
        '<dt>Private key</dt><dd>' +
        escapeHtml(algo.privateKey) +
        '</dd>' +
        '<dt>CT / signature</dt><dd>' +
        escapeHtml(algo.ciphertextOrSig) +
        '</dd>' +
        '<dt>Quantum safety</dt><dd>' +
        (algo.quantumSafe ? 'Designed for PQC threat models' : 'Broken by large-scale Shor machine') +
        '</dd>' +
        '</dl>' +
        '<p class="pqc-advice">' +
        escapeHtml(algo.advice) +
        '</p>' +
        '</article>';
    });

    var classical = selected.filter(function (a) {
      return !a.quantumSafe;
    });
    var pqc = selected.filter(function (a) {
      return a.quantumSafe;
    });
    if (classical.length && pqc.length) {
      html +=
        '<p class="pqc-advice"><strong>Migration tip:</strong> Pair a classical algorithm with a PQC KEM/signature in hybrid mode during transition, then retire pure classical key exchange once peers support PQC.</p>';
    } else if (classical.length && !pqc.length) {
      html +=
        '<p class="pqc-advice"><strong>Migration tip:</strong> All selected suites are classical-only. Add ML-KEM (Kyber) and/or ML-DSA (Dilithium) to your comparison and plan a hybrid rollout.</p>';
    }

    host.innerHTML = html;
  }

  function selectAllAlgos() {
    var checks = document.querySelectorAll('#algoPicks input[name="algo"]');
    for (var i = 0; i < checks.length; i++) {
      checks[i].checked = true;
    }
    compareAlgos();
  }

  /* ---- Quantum timeline estimator (educational heuristics) ---- */

  function bindSliders() {
    var pairs = [
      ['qubitsNow', 'qubitsNowVal', function (v) {
        return String(v);
      }],
      ['qubitsPerYear', 'qubitsPerYearVal', function (v) {
        return String(v);
      }],
      ['errorRateImprove', 'errorRateImproveVal', function (v) {
        return v + '×';
      }],
      ['rsaBits', 'rsaBitsVal', function (v) {
        return String(v);
      }]
    ];
    pairs.forEach(function (p) {
      var input = $(p[0]);
      var out = $(p[1]);
      if (!input || !out) return;
      var sync = function () {
        out.textContent = p[2](input.value);
      };
      input.addEventListener('input', sync);
      sync();
    });
  }

  function estimateTimeline() {
    var qubitsNow = Number(($('qubitsNow') || {}).value) || 200;
    var growth = Number(($('qubitsPerYear') || {}).value) || 400;
    var errImprove = Number(($('errorRateImprove') || {}).value) || 5;
    var rsaBits = Number(($('rsaBits') || {}).value) || 2048;

    /* Educational heuristics only — not scientific forecasts.
       Rough logical-qubit demand scales with RSA bits; error correction
       multiplies physical resources. We model "effective capability" growth. */
    var logicalNeeded = Math.round(rsaBits * 1.5 + 1000);
    var effectiveNow = qubitsNow * (1 + Math.log10(errImprove + 1));
    var yearsToShor = 0;
    var effective = effectiveNow;
    while (effective < logicalNeeded && yearsToShor < 80) {
      yearsToShor += 1;
      effective += growth * (1 + yearsToShor * 0.02) * (1 + Math.log10(errImprove + 1) * 0.15);
    }

    var aes128GroverBits = 64;
    var aes256GroverBits = 128;
    var groverYears128 = Math.max(5, Math.round(yearsToShor * 1.4 + 15));
    var groverYears256 = Math.max(groverYears128 + 20, Math.round(yearsToShor * 2.2 + 40));

    var urgency =
      yearsToShor <= 15
        ? 'High — accelerate hybrid/PQC migration for long-lived data.'
        : yearsToShor <= 30
          ? 'Moderate — begin inventory and hybrid pilots now.'
          : 'Lower near-term CRQC likelihood under these assumptions — still build crypto agility.';

    var host = $('timelineResults');
    if (!host) return;

    if (yearsToShor >= 80) {
      host.innerHTML =
        '<p>Under these optimistic-for-defender settings, modeled RSA-' +
        rsaBits +
        ' Shor capability stays beyond an 80-year horizon. Treat as <strong>illustrative</strong> only.</p>' +
        '<p class="pqc-muted">Still migrate: harvest-now-decrypt-later does not wait for your slider values.</p>';
      return;
    }

    host.innerHTML =
      '<div class="pqc-timeline-grid">' +
      '<div class="pqc-timeline-card">' +
      '<h4>Shor vs RSA-' +
      rsaBits +
      '</h4>' +
      '<div class="pqc-big">~' +
      yearsToShor +
      ' yrs</div>' +
      '<p>Heuristic years until modeled logical capacity ≈ ' +
      logicalNeeded.toLocaleString() +
      ' qubits.</p>' +
      '</div>' +
      '<div class="pqc-timeline-card">' +
      '<h4>Grover / AES-128</h4>' +
      '<div class="pqc-big">~' +
      groverYears128 +
      ' yrs</div>' +
      '<p>Illustrative horizon for ~2<sup>' +
      aes128GroverBits +
      '</sup>-scale search being “in reach” under loose assumptions.</p>' +
      '</div>' +
      '<div class="pqc-timeline-card">' +
      '<h4>Grover / AES-256</h4>' +
      '<div class="pqc-big">~' +
      groverYears256 +
      ' yrs</div>' +
      '<p>Much larger margin (~2<sup>' +
      aes256GroverBits +
      '</sup> queries) — prefer AES-256 for long-term secrets.</p>' +
      '</div>' +
      '<div class="pqc-timeline-card">' +
      '<h4>Suggested urgency</h4>' +
      '<div class="pqc-big" style="font-size:1rem;line-height:1.35">' +
      escapeHtml(urgency) +
      '</div>' +
      '</div>' +
      '</div>' +
      '<p><strong>Effective capacity now (model):</strong> ~' +
      Math.round(effectiveNow).toLocaleString() +
      ' · <strong>Growth/yr:</strong> ' +
      growth +
      ' · <strong>Error improve:</strong> ' +
      errImprove +
      '×/decade</p>' +
      '<p class="pqc-muted">These numbers teach relative risk (Shor ≫ Grover for public-key break). They are not forecasts.</p>';
  }

  function resetTimeline() {
    var defaults = {
      qubitsNow: 200,
      qubitsPerYear: 400,
      errorRateImprove: 5,
      rsaBits: 2048
    };
    Object.keys(defaults).forEach(function (id) {
      var el = $(id);
      if (el) {
        el.value = String(defaults[id]);
        el.dispatchEvent(new Event('input'));
      }
    });
    var host = $('timelineResults');
    if (host) {
      host.innerHTML =
        '<p class="pqc-muted">Defaults restored. Adjust sliders and estimate. Results are illustrative teaching aids only.</p>';
    }
  }

  /* ---- Hybrid handshake simulator ---- */

  function stopHandshakeAuto() {
    if (state.handshakeTimer) {
      clearInterval(state.handshakeTimer);
      state.handshakeTimer = null;
    }
  }

  function paintHandshakeSteps() {
    var steps = document.querySelectorAll('.pqc-hs-step');
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.remove('is-active', 'is-done');
      if (i < state.handshakeStep) steps[i].classList.add('is-done');
      if (i === state.handshakeStep) steps[i].classList.add('is-active');
    }
  }

  function showHandshakeStep(index) {
    state.handshakeStep = index;
    paintHandshakeSteps();
    var status = $('handshakeStatus');
    var detail = $('handshakeDetail');
    var nextBtn = $('nextHandshakeBtn');

    if (index < 0) {
      if (status) status.textContent = 'Idle';
      if (detail) {
        detail.innerHTML =
          '<p class="pqc-muted">Press Start to begin the visual hybrid handshake flow.</p>';
      }
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    var info = HANDSHAKE_DETAILS[index];
    if (status) status.textContent = info.status;
    if (detail) detail.innerHTML = info.html;
    if (nextBtn) nextBtn.disabled = index >= HANDSHAKE_DETAILS.length - 1;
  }

  function startHandshake() {
    stopHandshakeAuto();
    showHandshakeStep(0);
    var nextBtn = $('nextHandshakeBtn');
    if (nextBtn) nextBtn.disabled = false;
  }

  function nextHandshake() {
    if (state.handshakeStep < 0) {
      startHandshake();
      return;
    }
    if (state.handshakeStep >= HANDSHAKE_DETAILS.length - 1) {
      stopHandshakeAuto();
      var status = $('handshakeStatus');
      if (status) status.textContent = 'Complete';
      return;
    }
    showHandshakeStep(state.handshakeStep + 1);
    if (state.handshakeStep >= HANDSHAKE_DETAILS.length - 1) {
      stopHandshakeAuto();
      var st = $('handshakeStatus');
      if (st) st.textContent = 'Complete — hybrid keys derived';
    }
  }

  function autoHandshake() {
    stopHandshakeAuto();
    startHandshake();
    state.handshakeTimer = setInterval(function () {
      if (state.handshakeStep >= HANDSHAKE_DETAILS.length - 1) {
        stopHandshakeAuto();
        var st = $('handshakeStatus');
        if (st) st.textContent = 'Complete — hybrid keys derived';
        return;
      }
      nextHandshake();
    }, 1400);
  }

  /* ---- Quiz ---- */

  function renderQuiz() {
    var host = $('quizQuestions');
    if (!host) return;
    host.innerHTML = '';

    QUIZ.forEach(function (q, qi) {
      var fieldset = document.createElement('fieldset');
      fieldset.className = 'pqc-quiz-q';
      fieldset.setAttribute('data-qid', q.id);

      var legend = document.createElement('legend');
      legend.textContent = qi + 1 + '. ' + q.question;
      fieldset.appendChild(legend);

      var opts = document.createElement('div');
      opts.className = 'pqc-quiz-options';

      q.options.forEach(function (opt, oi) {
        var label = document.createElement('label');
        label.className = 'pqc-quiz-option';
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = q.id;
        input.value = String(oi);
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + opt));
        opts.appendChild(label);
      });

      fieldset.appendChild(opts);
      host.appendChild(fieldset);
    });
  }

  function submitQuiz(e) {
    e.preventDefault();
    var score = 0;
    var unanswered = 0;

    QUIZ.forEach(function (q) {
      var fieldset = document.querySelector('.pqc-quiz-q[data-qid="' + q.id + '"]');
      if (!fieldset) return;
      var options = fieldset.querySelectorAll('.pqc-quiz-option');
      var selected = fieldset.querySelector('input[name="' + q.id + '"]:checked');
      for (var i = 0; i < options.length; i++) {
        options[i].classList.remove('is-correct', 'is-wrong');
      }
      if (!selected) {
        unanswered += 1;
        options[q.answer].classList.add('is-correct');
        return;
      }
      var chosen = Number(selected.value);
      if (chosen === q.answer) {
        score += 1;
        options[chosen].classList.add('is-correct');
      } else {
        options[chosen].classList.add('is-wrong');
        options[q.answer].classList.add('is-correct');
      }
    });

    if (unanswered > 0) {
      var warn = $('quizResult');
      if (warn) {
        warn.hidden = false;
        warn.innerHTML =
          '<p>Please answer all questions (' +
          unanswered +
          ' unanswered). Correct answers are highlighted for review.</p>';
      }
    }

    if (state.quizBest === null || score > state.quizBest) {
      state.quizBest = score;
      saveProgress();
      updateHeroStats();
    }

    var result = $('quizResult');
    if (result) {
      result.hidden = false;
      var pct = Math.round((score / QUIZ.length) * 100);
      var msg =
        pct === 100
          ? 'Outstanding — PQC migration concepts locked in.'
          : pct >= 70
            ? 'Solid grasp. Revisit any missed modules, then retry.'
            : 'Keep studying the modules and labs, then try again.';
      result.innerHTML =
        '<p><strong>Score: ' +
        score +
        ' / ' +
        QUIZ.length +
        ' (' +
        pct +
        '%)</strong></p>' +
        '<p>' +
        msg +
        '</p>' +
        '<p class="pqc-muted">Best score saved: ' +
        state.quizBest +
        ' / ' +
        QUIZ.length +
        '</p>';
    }
  }

  function resetQuiz() {
    var form = $('quizForm');
    if (form) form.reset();
    var options = document.querySelectorAll('.pqc-quiz-option');
    for (var i = 0; i < options.length; i++) {
      options[i].classList.remove('is-correct', 'is-wrong');
    }
    var result = $('quizResult');
    if (result) {
      result.hidden = true;
      result.innerHTML = '';
    }
  }

  /* ---- Init ---- */

  function init() {
    loadProgress();
    renderModuleNav();
    showModule(0);
    updateHeroStats();
    renderAlgoPicks();
    compareAlgos();
    bindSliders();
    renderQuiz();

    var markBtn = $('markCompleteBtn');
    if (markBtn) markBtn.addEventListener('click', toggleComplete);
    var prevBtn = $('prevModuleBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        showModule(state.activeModule - 1);
      });
    }
    var nextBtn = $('nextModuleBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        showModule(state.activeModule + 1);
      });
    }

    var compareBtn = $('compareAlgosBtn');
    if (compareBtn) compareBtn.addEventListener('click', compareAlgos);
    var selectAllBtn = $('selectAllAlgosBtn');
    if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllAlgos);

    var estimateBtn = $('estimateTimelineBtn');
    if (estimateBtn) estimateBtn.addEventListener('click', estimateTimeline);
    var resetTlBtn = $('resetTimelineBtn');
    if (resetTlBtn) resetTlBtn.addEventListener('click', resetTimeline);

    var startHs = $('startHandshakeBtn');
    if (startHs) startHs.addEventListener('click', startHandshake);
    var nextHs = $('nextHandshakeBtn');
    if (nextHs) nextHs.addEventListener('click', nextHandshake);
    var autoHs = $('autoHandshakeBtn');
    if (autoHs) autoHs.addEventListener('click', autoHandshake);

    var quizForm = $('quizForm');
    if (quizForm) quizForm.addEventListener('submit', submitQuiz);
    var resetQuizBtn = $('resetQuizBtn');
    if (resetQuizBtn) resetQuizBtn.addEventListener('click', resetQuiz);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
