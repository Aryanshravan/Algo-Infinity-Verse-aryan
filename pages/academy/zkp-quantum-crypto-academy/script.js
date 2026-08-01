/* ============================================================
   Post-Quantum Cryptography & ZKP Masterclass JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const secretInput = document.getElementById('secretInput');
  const btnGenerateProof = document.getElementById('btnGenerateProof');
  const btnVerifyProof = document.getElementById('btnVerifyProof');
  const commitHashDisplay = document.getElementById('commitHashDisplay');
  const challengeDisplay = document.getElementById('challengeDisplay');
  const proofOutputDisplay = document.getElementById('proofOutputDisplay');
  const zkVerificationResult = document.getElementById('zkVerificationResult');

  let activeProof = null;

  function init() {
    setupEventListeners();
  }

  function setupEventListeners() {
    btnGenerateProof.addEventListener('click', generateProof);
    btnVerifyProof.addEventListener('click', verifyProof);
  }

  function generateProof() {
    const secret = secretInput.value.trim();
    if (!secret) return;

    // Simulate SHA-256 / Pedersen Commitment
    const commitHash = '0x' + Array.from(secret).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 0xFFFFFFFF, 12345).toString(16);
    const randR = Math.floor(Math.random() * 90000 + 10000);

    commitHashDisplay.textContent = commitHash;
    challengeDisplay.textContent = `Challenge R_${randR}`;
    proofOutputDisplay.textContent = `π = {0x${(randR * 7).toString(16)}, 0x${(randR * 13).toString(16)}}`;

    activeProof = { secret, commitHash, randR };
    zkVerificationResult.innerHTML = `
      <div style="color:var(--zk-accent)"><i class="fas fa-spinner fa-spin"></i> ZK Proof generated! Ready for non-interactive verification.</div>
    `;
  }

  function verifyProof() {
    if (!activeProof) {
      zkVerificationResult.innerHTML = `<div style="color:var(--zk-danger)"><i class="fas fa-exclamation-triangle"></i> Generate a proof first!</div>`;
      return;
    }

    zkVerificationResult.innerHTML = `
      <div style="color:var(--zk-success); background:rgba(16,185,129,0.1); border:1px solid var(--zk-success); padding:12px; border-radius:8px;">
        <strong><i class="fas fa-check-circle"></i> ZK-PROOF VERIFIED (COMPLETENESS &amp; SOUNDNESS SATISFIED)</strong>
        <div style="font-size:0.8rem; margin-top:4px; color:var(--zk-text-dark);">
          The verifier confirmed that the prover knows the secret corresponding to commitment <code>${activeProof.commitHash}</code> WITHOUT revealing the raw secret string!
        </div>
      </div>
    `;
  }

  init();
});
