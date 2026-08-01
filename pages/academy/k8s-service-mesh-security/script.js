// K8s & Service Mesh Security Masterclass Script

const MODULES_DATA = [
  {
    id: 1,
    title: "1. Kubernetes RBAC & Least Privilege",
    icon: "fa-user-shield",
    content: `
      <h2>1. Kubernetes Role-Based Access Control (RBAC)</h2>
      <p>Kubernetes RBAC regulates access to API resources based on user roles and service accounts. Enforcing the Principle of Least Privilege prevents lateral movement if a pod or account is compromised.</p>
      
      <h3>Key Concepts:</h3>
      <ul>
        <li><strong>Role vs ClusterRole:</strong> Roles grant permissions within a specific namespace; ClusterRoles apply cluster-wide across all namespaces.</li>
        <li><strong>RoleBinding vs ClusterRoleBinding:</strong> Binds subjects (Users, Groups, ServiceAccounts) to a Role or ClusterRole.</li>
        <li><strong>Wildcard Prevention:</strong> Avoid using <code>verbs: ["*"]</code> or <code>resources: ["*"]</code> in production roles.</li>
      </ul>

      <h3>Hardened Role Example:</h3>
      <pre><code>apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: prod
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]</code></pre>
    `
  },
  {
    id: 2,
    title: "2. Pod Security Standards (PSS)",
    icon: "fa-shield-halved",
    content: `
      <h2>2. Pod Security Standards (PSS) & Admission</h2>
      <p>Pod Security Standards define three policy levels to restrict pod capabilities and prevent host node takeover: <strong>Privileged</strong>, <strong>Baseline</strong>, and <strong>Restricted</strong>.</p>
      
      <h3>Restricted PSS Enforcement:</h3>
      <ul>
        <li><code>mustRunAsNonRoot: true</code> — Ensures containers do not execute as UID 0 (root).</li>
        <li><code>readOnlyRootFilesystem: true</code> — Prevents attackers from modifying binary dependencies on disk.</li>
        <li><code>allowPrivilegeEscalation: false</code> — Disables child process privilege escalation via SUID binaries.</li>
        <li><code>capabilities.drop: ["ALL"]</code> — Drops all Linux kernel capabilities.</li>
      </ul>
    `
  },
  {
    id: 3,
    title: "3. mTLS & Envoy Sidecar Traffic Encryption",
    icon: "fa-network-wired",
    content: `
      <h2>3. Mutual TLS (mTLS) in Istio & Linkerd</h2>
      <p>Service meshes like Istio inject an Envoy sidecar proxy into every pod, automatically encrypting pod-to-pod communications with mutual TLS (mTLS) without requiring code changes in microservices.</p>
      
      <h3>SPIFFE / SPIRE Identity:</h3>
      <p>Every pod receives a cryptographic identity document (SVID) formatted as a X.509 certificate: <code>spiffe://cluster.local/ns/{namespace}/sa/{serviceaccount}</code>.</p>
    `
  },
  {
    id: 4,
    title: "4. Network Policies & Microsegmentation",
    icon: "fa-border-all",
    content: `
      <h2>4. Kubernetes Network Policies</h2>
      <p>By default, all pods in a Kubernetes cluster can communicate with each other (flat network). Network Policies enforce a zero-trust default-deny ingress and egress firewall rule.</p>
    `
  },
  {
    id: 5,
    title: "5. Container Image Vulnerability Scanning",
    icon: "fa-bug",
    content: `
      <h2>5. Container Image Security & Signing</h2>
      <p>Scan container images in CI/CD pipelines using tools like Trivy or Grype. Cryptographically sign container images using <strong>Cosign (Sigstore)</strong> to ensure image integrity.</p>
    `
  },
  {
    id: 6,
    title: "6. Secrets Management & Vault Integration",
    icon: "fa-key",
    content: `
      <h2>6. Kubernetes Secrets & External Vault</h2>
      <p>K8s secrets are base64 encoded by default. Enable envelope encryption at rest with KMS providers (AWS KMS, GCP KMS, Vault) or sync dynamically via External Secrets Operator.</p>
    `
  },
  {
    id: 7,
    title: "7. Admission Controllers (OPA/Gatekeeper)",
    icon: "fa-filter",
    content: `
      <h2>7. Admission Controllers & Kyverno</h2>
      <p>Validating and Mutating Webhooks intercept API requests before objects are saved to etcd. Policy engines like OPA Gatekeeper and Kyverno enforce organizational compliance rules automatically.</p>
    `
  },
  {
    id: 8,
    title: "8. Control Plane & API Server Hardening",
    icon: "fa-server",
    content: `
      <h2>8. Hardening etcd & Kube-APIServer</h2>
      <p>Restrict access to the API server using authorization modes (Node, RBAC), disable anonymous authentication, and encrypt etcd storage at rest.</p>
    `
  },
  {
    id: 9,
    title: "9. Runtime Threat Detection (Falco)",
    icon: "fa-eye",
    content: `
      <h2>9. Runtime Security with Falco & eBPF</h2>
      <p>Use eBPF-powered runtime security tools like Falco to detect suspicious behavior, such as shell spawning inside a pod or unauthorized file modifications in <code>/etc/</code>.</p>
    `
  },
  {
    id: 10,
    title: "10. Zero-Trust Mesh Architecture",
    icon: "fa-lock",
    content: `
      <h2>10. Zero-Trust Architecture & Authorization</h2>
      <p>Combine mTLS layer 4 transport security with Istio AuthorizationPolicy layer 7 JWT authentication and path-based RBAC for complete defense-in-depth.</p>
    `
  }
];

const PRESET_YAMLS = {
  vulnerable: `apiVersion: v1
kind: Pod
metadata:
  name: payment-gateway
spec:
  containers:
  - name: payment-app
    image: payment-app:v1.0
    securityContext:
      privileged: true
      runAsUser: 0
      allowPrivilegeEscalation: true
      readOnlyRootFilesystem: false
    ports:
    - containerPort: 8080
  hostNetwork: true
  hostPID: true`,

  secure: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-gateway-secure
spec:
  replicas: 3
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        fsGroup: 20000
      containers:
      - name: payment-app
        image: payment-app:v1.0-signed
        securityContext:
          privileged: false
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "128Mi"`,

  rbac: `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: risky-admin-binding
subjects:
- kind: ServiceAccount
  name: default
  namespace: default
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io`
};

const QUIZ_QUESTIONS = [
  {
    q: "Which Pod Security Standard context parameter prevents containers from executing with Root UID 0?",
    options: ["readOnlyRootFilesystem: true", "runAsNonRoot: true", "allowPrivilegeEscalation: false", "hostNetwork: false"],
    answer: 1,
    desc: "runAsNonRoot: true forces Kubernetes to validate at pod admission that the container image does not run as root."
  },
  {
    q: "What protocol does an Envoy sidecar proxy use to encrypt pod-to-pod communications automatically?",
    options: ["SSH", "Plain TLS 1.2", "Mutual TLS (mTLS) with SPIFFE X.509 SVIDs", "IPsec Tunnel"],
    answer: 2,
    desc: "Service meshes utilize mTLS combined with SPIFFE cryptographic IDs for mutual authentication and encryption."
  },
  {
    q: "What is the security risk of configuring hostNetwork: true in a Kubernetes Pod manifest?",
    options: ["Increases RAM consumption", "Exposes node network interfaces and bypasses K8s NetworkPolicies", "Slows down pod scheduling", "Breaks cluster DNS"],
    answer: 1,
    desc: "hostNetwork: true attaches the pod directly to the underlying host's network namespace, bypassing network microsegmentation."
  },
  {
    q: "Which Linux security module mechanism does Falco leverage for high-performance runtime syscall auditing?",
    options: ["iptables", "eBPF (Extended Berkeley Packet Filter)", "Cron jobs", "Docker Socket polling"],
    answer: 1,
    desc: "Falco uses eBPF probes to capture kernel syscall events in real time with near-zero performance overhead."
  },
  {
    q: "What is the recommended approach for managing sensitive API keys inside Kubernetes?",
    options: ["Hardcode in Dockerfile", "Store base64 encoded in plain ConfigMaps", "Use External Secrets Operator integrated with HashiCorp Vault / AWS KMS", "Commit to GitHub in YAML files"],
    answer: 2,
    desc: "External Secrets Operator dynamically injects encrypted secrets from external KMS vaults directly into pods."
  }
];

class K8sSecurityApp {
  constructor() {
    this.currentModuleIdx = 0;
    this.completedModules = new Set(JSON.parse(localStorage.getItem('k8s_completed_modules') || '[]'));
    this.mtlsMode = 'plain'; // 'plain' or 'mtls'
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderModuleList();
    this.renderModuleContent();
    this.updateStats();

    // Set default YAML
    document.getElementById('yamlInput').value = PRESET_YAMLS.vulnerable;
    this.auditYaml();
    this.renderQuiz();
  }

  bindEvents() {
    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-mode');
      const isLight = document.documentElement.classList.contains('light-mode');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    // Navigation Tabs
    document.querySelectorAll('.ksm-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ksm-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.ksm-tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(`tab-${tabId}`).classList.add('active');
      });
    });

    // Module Controls
    document.getElementById('btnPrevModule').addEventListener('click', () => this.changeModule(-1));
    document.getElementById('btnNextModule').addEventListener('click', () => this.changeModule(1));
    document.getElementById('btnMarkComplete').addEventListener('click', () => this.toggleModuleComplete());

    // Linter Controls
    document.getElementById('btnAuditYaml').addEventListener('click', () => this.auditYaml());
    document.getElementById('btnAutoFixYaml').addEventListener('click', () => this.autoFixYaml());

    document.querySelectorAll('.ksm-preset-selector button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.ksm-preset-selector button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('yamlInput').value = PRESET_YAMLS[btn.dataset.preset];
        this.auditYaml();
      });
    });

    // mTLS Visualizer Controls
    document.getElementById('btnModePlain').addEventListener('click', () => this.setMtlsMode('plain'));
    document.getElementById('btnModeMtls').addEventListener('click', () => this.setMtlsMode('mtls'));
    document.getElementById('btnSimulatePacket').addEventListener('click', () => this.animatePacket());
    document.getElementById('btnRotateCerts').addEventListener('click', () => this.rotateCertificates());

    // Quiz Controls
    document.getElementById('btnSubmitQuiz').addEventListener('click', () => this.submitQuiz());
    document.getElementById('btnResetQuiz').addEventListener('click', () => this.renderQuiz());
  }

  renderModuleList() {
    const listEl = document.getElementById('moduleList');
    listEl.innerHTML = MODULES_DATA.map((mod, idx) => `
      <div class="ksm-module-item ${idx === this.currentModuleIdx ? 'active' : ''} ${this.completedModules.has(mod.id) ? 'completed' : ''}" data-idx="${idx}">
        <span><i class="fas ${mod.icon}"></i> ${mod.title}</span>
        <span class="module-check"><i class="fas ${this.completedModules.has(mod.id) ? 'fa-circle-check' : 'fa-circle'}"></i></span>
      </div>
    `).join('');

    listEl.querySelectorAll('.ksm-module-item').forEach(item => {
      item.addEventListener('click', () => {
        this.currentModuleIdx = parseInt(item.dataset.idx);
        this.renderModuleList();
        this.renderModuleContent();
      });
    });
  }

  renderModuleContent() {
    const mod = MODULES_DATA[this.currentModuleIdx];
    const container = document.getElementById('moduleContent');
    container.innerHTML = mod.content;

    document.getElementById('btnMarkComplete').innerHTML = this.completedModules.has(mod.id)
      ? `<i class="fas fa-check-circle"></i> Completed`
      : `<i class="far fa-circle"></i> Mark as Completed`;
  }

  changeModule(delta) {
    const newIdx = this.currentModuleIdx + delta;
    if (newIdx >= 0 && newIdx < MODULES_DATA.length) {
      this.currentModuleIdx = newIdx;
      this.renderModuleList();
      this.renderModuleContent();
    }
  }

  toggleModuleComplete() {
    const modId = MODULES_DATA[this.currentModuleIdx].id;
    if (this.completedModules.has(modId)) {
      this.completedModules.delete(modId);
    } else {
      this.completedModules.add(modId);
    }
    localStorage.setItem('k8s_completed_modules', JSON.stringify([...this.completedModules]));
    this.renderModuleList();
    this.renderModuleContent();
    this.updateStats();
  }

  auditYaml() {
    const yaml = document.getElementById('yamlInput').value;
    const violations = [];
    let score = 100;

    if (yaml.includes('privileged: true')) {
      violations.push({ title: "Privileged Container Detected", desc: "privileged: true gives container full root capabilities on host kernel.", severity: "danger", pts: 30 });
    }
    if (yaml.includes('runAsUser: 0') || !yaml.includes('runAsNonRoot: true')) {
      violations.push({ title: "Container Runs As Root User", desc: "Missing runAsNonRoot: true or explicitly using UID 0.", severity: "danger", pts: 25 });
    }
    if (yaml.includes('hostNetwork: true')) {
      violations.push({ title: "Host Network Attachment", desc: "hostNetwork: true exposes node interface directly.", severity: "danger", pts: 20 });
    }
    if (yaml.includes('hostPID: true')) {
      violations.push({ title: "Host PID Namespace Shared", desc: "Allows container processes to inspect node host PID process tree.", severity: "danger", pts: 15 });
    }
    if (!yaml.includes('readOnlyRootFilesystem: true')) {
      violations.push({ title: "Writable Root Filesystem", desc: "Root filesystem is writable. Set readOnlyRootFilesystem: true.", severity: "warning", pts: 10 });
    }
    if (!yaml.includes('limits:')) {
      violations.push({ title: "Missing Resource CPU/RAM Limits", desc: "Absence of resource limits risks node Denial of Service (OOM).", severity: "warning", pts: 10 });
    }

    violations.forEach(v => score -= v.pts);
    score = Math.max(0, score);

    document.getElementById('yamlScoreVal').innerText = score;
    document.getElementById('yamlScoreVal').style.color = score > 80 ? '#10b981' : (score > 50 ? '#f59e0b' : '#ef4444');
    document.getElementById('yamlScoreText').innerText = score === 100 ? "EXCELLENT SECURITY POSTURE" : "SECURITY RISKS DETECTED";

    const listEl = document.getElementById('yamlViolationsList');
    if (violations.length === 0) {
      listEl.innerHTML = `<div class="ksm-violation-item" style="border-left-color: #10b981; background: rgba(16, 185, 129, 0.1);"><i class="fas fa-shield-check"></i> <strong>Clean Audit!</strong> No security violations detected in manifest.</div>`;
    } else {
      listEl.innerHTML = violations.map(v => `
        <div class="ksm-violation-item ${v.severity}">
          <div class="ksm-violation-title"><i class="fas fa-triangle-exclamation"></i> ${v.title} (-${v.pts} pts)</div>
          <div class="ksm-violation-desc">${v.desc}</div>
        </div>
      `).join('');
    }

    let audited = parseInt(localStorage.getItem('k8s_audited_count') || '0') + 1;
    localStorage.setItem('k8s_audited_count', audited);
    this.updateStats();
  }

  autoFixYaml() {
    document.getElementById('yamlInput').value = PRESET_YAMLS.secure;
    this.auditYaml();
  }

  setMtlsMode(mode) {
    this.mtlsMode = mode;
    document.getElementById('btnModePlain').classList.toggle('active', mode === 'plain');
    document.getElementById('btnModeMtls').classList.toggle('active', mode === 'mtls');

    const sidecarA = document.getElementById('sidecarA');
    const sidecarB = document.getElementById('sidecarB');
    const pipeLabel = document.getElementById('pipeLabel');
    const packet = document.getElementById('trafficPacket');

    if (mode === 'mtls') {
      sidecarA.style.display = 'block';
      sidecarB.style.display = 'block';
      pipeLabel.innerText = "ENCRYPTED mTLS (TLS 1.3 - AES-256-GCM)";
      pipeLabel.style.color = "#10b981";
      packet.style.background = "#10b981";
      packet.innerHTML = '<i class="fas fa-lock"></i>';
      document.getElementById('handshakeLog').innerHTML = `[INFO] Envoy Sidecar A initialized SPIFFE SVID: spiffe://cluster.local/ns/default/sa/frontend\n[INFO] Envoy Sidecar B initialized SPIFFE SVID: spiffe://cluster.local/ns/default/sa/payment\n[SUCCESS] TLS 1.3 Mutual Handshake Completed. Certificates Verified.`;
      document.getElementById('packetPayload').innerText = `Encrypted Frame [TLSv1.3]:\n30 82 03 2a 02 01 03 30 82 02 12 a0 03 02 01 02 02 10 4f...\n(Plaintext invisible on wire)`;
    } else {
      sidecarA.style.display = 'none';
      sidecarB.style.display = 'none';
      pipeLabel.innerText = "UNENCRYPTED HTTP TRAFFIC";
      pipeLabel.style.color = "#ef4444";
      packet.style.background = "#ef4444";
      packet.innerHTML = '<i class="fas fa-unlock"></i>';
      document.getElementById('handshakeLog').innerHTML = `[WARN] Direct App-to-App Plaintext HTTP Connection.\n[SECURITY ALERT] No sidecar proxy active! Traffic subject to wire eavesdropping.`;
      document.getElementById('packetPayload').innerText = `POST /api/v1/checkout HTTP/1.1\nHost: 10.244.2.89:5000\nContent-Type: application/json\n\n{"credit_card":"4532-XXXX-XXXX-9812","cvv":"881"}`;
    }
  }

  animatePacket() {
    const packet = document.getElementById('trafficPacket');
    packet.style.left = '0%';
    setTimeout(() => {
      packet.style.left = 'calc(100% - 32px)';
    }, 50);
  }

  rotateCertificates() {
    if (this.mtlsMode !== 'mtls') {
      alert("Enable Envoy Sidecar mTLS mode first to simulate certificate rotation!");
      return;
    }
    const log = document.getElementById('handshakeLog');
    log.innerHTML += `\n[ACTION] Rotating SPIFFE X.509 SVID Certificates (Valid: 1 Hour)...`;
    setTimeout(() => {
      log.innerHTML += `\n[SUCCESS] New Certificates Issued by Istiod CA. Zero-downtime hot key swap done.`;
      log.scrollTop = log.scrollHeight;
    }, 600);
  }

  renderQuiz() {
    const container = document.getElementById('quizContainer');
    container.innerHTML = QUIZ_QUESTIONS.map((q, qIdx) => `
      <div class="ksm-quiz-question">
        <h4>${qIdx + 1}. ${q.q}</h4>
        <div class="ksm-quiz-options">
          ${q.options.map((opt, oIdx) => `
            <label class="ksm-option-label">
              <input type="radio" name="q_${qIdx}" value="${oIdx}">
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  submitQuiz() {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, qIdx) => {
      const selected = document.querySelector(`input[name="q_${qIdx}"]:checked`);
      if (selected && parseInt(selected.value) === q.answer) {
        score++;
      }
    });

    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    localStorage.setItem('k8s_quiz_score', pct);
    alert(`Quiz Submitted! You scored ${score}/${QUIZ_QUESTIONS.length} (${pct}%).`);
    this.updateStats();
  }

  updateStats() {
    document.getElementById('completedModulesCount').innerText = `${this.completedModules.size} / ${MODULES_DATA.length}`;
    document.getElementById('linterChecksCount').innerText = localStorage.getItem('k8s_audited_count') || '0';
    document.getElementById('quizScoreCount').innerText = (localStorage.getItem('k8s_quiz_score') || '0') + '%';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new K8sSecurityApp();
});
