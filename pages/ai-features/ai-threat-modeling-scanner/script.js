// AI Architecture Threat Modeling Scanner Script

const TOPOLOGIES = {
  fintech: {
    name: "Fintech Payment Gateway Topology",
    components: [
      { name: "Public Ingress Gateway", boundary: "DMZ / Internet Edge", protocol: "HTTPS (TLS 1.3)" },
      { name: "Auth & Token Service", boundary: "Internal Mesh", protocol: "gRPC (mTLS)" },
      { name: "Payment Processor Microservice", boundary: "Internal Mesh", protocol: "HTTP/2 (Unencrypted)" },
      { name: "Core Ledger SQL Database", boundary: "Secure Storage Zone", protocol: "TCP (Plaintext)" },
      { name: "Kafka Transaction Queue", boundary: "Internal Mesh", protocol: "SASL/PLAINTEXT" }
    ],
    threats: [
      { stride: "T", category: "Tampering", title: "Unencrypted Payment Microservice Traffic", severity: "CRITICAL", desc: "Inter-service traffic between Payment Processor and Ledger SQL is unencrypted, permitting man-in-the-middle data tampering.", fix: "Enforce Envoy mTLS sidecar proxies or TLS 1.3 encryption on database connections." },
      { stride: "S", category: "Spoofing", title: "Missing Mutual Authentication on Ingress", severity: "HIGH", desc: "Ingress gateway relies solely on API keys without client certificate or JWT signature validation.", fix: "Implement OAuth2 / OIDC JWT validation and IP rate limiting at Ingress Gateway." },
      { stride: "I", category: "Information Disclosure", title: "PLAINTEXT Messaging on Kafka Queue", severity: "CRITICAL", desc: "Kafka cluster uses SASL/PLAINTEXT without TLS payload encryption, exposing sensitive credit card payload events.", fix: "Enable SSL/TLS transport encryption on Kafka broker ports." },
      { stride: "D", category: "Denial of Service", title: "Missing Rate Limiter on Token Service", severity: "MEDIUM", desc: "Auth & Token Service lacks request throttling, vulnerable to credential stuffing DoS attacks.", fix: "Deploy Redis token bucket rate limiting on auth endpoints." }
    ]
  },
  healthcare: {
    name: "EHR Healthcare Data Pipeline",
    components: [
      { name: "Patient Portal Web Client", boundary: "Public Internet", protocol: "HTTPS" },
      { name: "FHIR API Gateway", boundary: "DMZ", protocol: "HTTPS" },
      { name: "EHR Record Microservice", boundary: "Internal Mesh", protocol: "HTTP" },
      { name: "HIPAA Compliant Mongo Store", boundary: "Secure Storage", protocol: "MongoDB Wire Protocol" }
    ],
    threats: [
      { stride: "I", category: "Information Disclosure", title: "Unencrypted PHI Storage at Rest", severity: "CRITICAL", desc: "MongoDB data files are stored on unencrypted EBS volumes without AES-256 disk encryption.", fix: "Enable MongoDB Storage Engine Encryption at Rest (KMS AES-256)." },
      { stride: "R", category: "Repudiation", title: "Missing Audit Logs on Patient Record Access", severity: "HIGH", desc: "EHR Microservice does not emit immutable audit logs for READ queries.", fix: "Stream immutable audit logs to AWS CloudWatch / Elasticsearch with write-once retention." }
    ]
  },
  iot: {
    name: "IoT Edge Stream Ingestion",
    components: [
      { name: "Edge Sensors", boundary: "Physical Field Device", protocol: "MQTT" },
      { name: "MQTT Broker", boundary: "DMZ Edge", protocol: "MQTT / TCP" },
      { name: "Stream Analytics Worker", boundary: "Internal Compute", protocol: "gRPC" }
    ],
    threats: [
      { stride: "E", category: "Elevation of Privilege", title: "Hardcoded Edge Device Credentials", severity: "HIGH", desc: "MQTT Edge sensors share a hardcoded root certificate.", fix: "Provision per-device X.509 client certificates using EST/ACME protocol." }
    ]
  }
};

class ThreatModelingApp {
  constructor() {
    this.currentTopology = TOPOLOGIES.fintech;
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderTopology();
    this.runScan();
  }

  bindEvents() {
    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-mode');
    });

    // Preset selector
    document.querySelectorAll('.tms-btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tms-btn-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTopology = TOPOLOGIES[btn.dataset.preset];
        this.renderTopology();
        this.runScan();
      });
    });

    // Run Scan button
    document.getElementById('btnRunScan').addEventListener('click', () => this.runScan());

    // Print / Export PDF button
    document.getElementById('btnPrintReport').addEventListener('click', () => {
      window.print();
    });

    // Add Component Node
    document.getElementById('btnAddNode').addEventListener('click', () => {
      const name = prompt("Enter Component Name:", "Microservice-X");
      if (name) {
        this.currentTopology.components.push({
          name: name,
          boundary: "Internal Mesh",
          protocol: "HTTP"
        });
        this.renderTopology();
        this.runScan();
      }
    });
  }

  renderTopology() {
    const list = document.getElementById('componentsList');
    list.innerHTML = this.currentTopology.components.map(c => `
      <div class="tms-comp-item">
        <div>
          <div class="tms-comp-title"><i class="fas fa-microchip"></i> ${c.name}</div>
          <div style="font-size: 0.78rem; color: var(--tms-text-muted); margin-top: 2px;">Protocol: ${c.protocol}</div>
        </div>
        <span class="tms-comp-boundary">${c.boundary}</span>
      </div>
    `).join('');
  }

  runScan() {
    const threats = this.currentTopology.threats;
    const counts = { S: 0, T: 0, R: 0, I: 0, D: 0, E: 0 };

    threats.forEach(t => {
      if (counts[t.stride] !== undefined) counts[t.stride]++;
    });

    document.getElementById('cntS').innerText = counts.S;
    document.getElementById('cntT').innerText = counts.T;
    document.getElementById('cntR').innerText = counts.R;
    document.getElementById('cntI').innerText = counts.I;
    document.getElementById('cntD').innerText = counts.D;
    document.getElementById('cntE').innerText = counts.E;

    const criticalCount = threats.filter(t => t.severity === "CRITICAL").length;
    document.getElementById('riskScoreVal').innerText = criticalCount > 0 ? "CRITICAL RISK" : "HIGH RISK";
    document.getElementById('riskScoreVal').style.color = criticalCount > 0 ? "#ef4444" : "#f59e0b";
    document.getElementById('riskScoreSub').innerText = `${threats.length} Threats Identified (${criticalCount} Critical)`;

    // Render Threats List
    const container = document.getElementById('threatsContainer');
    container.innerHTML = threats.map(t => `
      <div class="tms-threat-item ${t.severity.toLowerCase()}">
        <div class="tms-threat-head">
          <span>[STRIDE: ${t.category}] ${t.title}</span>
          <span style="font-size: 0.75rem; background: rgba(239,68,68,0.2); color: #ef4444; padding: 2px 8px; border-radius: 4px;">${t.severity}</span>
        </div>
        <div class="tms-threat-desc">${t.desc}</div>
        <div class="tms-threat-fix"><i class="fas fa-wrench"></i> <strong>Recommended Mitigation:</strong> ${t.fix}</div>
      </div>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ThreatModelingApp();
});
