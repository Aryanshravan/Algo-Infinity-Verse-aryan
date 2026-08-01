document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const penaltyValEl = document.getElementById('val-penalty-flap');
  const suppressLimitEl = document.getElementById('val-suppress-limit');
  const reuseLimitEl = document.getElementById('val-reuse-limit');
  const halflifeEl = document.getElementById('val-halflife');

  const penaltyInput = document.getElementById('param-penalty');
  const suppressInput = document.getElementById('param-suppress');
  const reuseInput = document.getElementById('param-reuse');
  const halflifeInput = document.getElementById('param-halflife');

  const btnFlap = document.getElementById('btn-flap');
  const btnReset = document.getElementById('btn-reset');

  const statusText = document.getElementById('status-text');
  const currentPenaltyEl = document.getElementById('current-penalty');
  const penaltyBar = document.getElementById('penalty-bar');
  const lineSuppress = document.getElementById('line-suppress');
  const lineReuse = document.getElementById('line-reuse');

  const lblSuppress = document.getElementById('lbl-suppress');
  const lblReuse = document.getElementById('lbl-reuse');

  const linkState = document.getElementById('link-state');
  const linkLabel = document.getElementById('link-label');
  const networkWrapper = document.getElementById('network-wrapper');

  // State
  let penalty = 0;
  let isSuppressed = false;
  let isFlapping = false;
  let decayInterval = null;
  let maxPenaltyView = 5000;

  // Update labels and threshold lines based on inputs
  function updateConfig() {
    const suppress = parseInt(suppressInput.value);
    const reuse = parseInt(reuseInput.value);

    penaltyValEl.textContent = penaltyInput.value;
    suppressLimitEl.textContent = suppress;
    reuseLimitEl.textContent = reuse;
    halflifeEl.textContent = halflifeInput.value;

    lblSuppress.textContent = suppress;
    lblReuse.textContent = reuse;

    // Ensure max penalty view is at least suppress limit + 1000
    maxPenaltyView = Math.max(5000, suppress + 1000);

    // Update lines position
    lineSuppress.style.bottom = `${(suppress / maxPenaltyView) * 100}%`;
    lineReuse.style.bottom = `${(reuse / maxPenaltyView) * 100}%`;

    updateView();
  }

  function updateView() {
    currentPenaltyEl.textContent = Math.round(penalty);

    const heightPercent = Math.min(100, (penalty / maxPenaltyView) * 100);
    penaltyBar.style.height = `${heightPercent}%`;

    const suppress = parseInt(suppressInput.value);
    const reuse = parseInt(reuseInput.value);

    if (penalty > suppress && !isSuppressed) {
      isSuppressed = true;
      networkWrapper.classList.add('suppressed-state');
      updateStatusText();
    } else if (penalty < reuse && isSuppressed) {
      isSuppressed = false;
      networkWrapper.classList.remove('suppressed-state');
      updateStatusText();
    }
  }

  function updateStatusText() {
    if (isSuppressed) {
      statusText.textContent = 'Suppressed (Dampened)';
      statusText.className = 'status-message text-danger';
    } else if (isFlapping) {
      statusText.textContent = 'Flapping (Unstable)';
      statusText.className = 'status-message text-warning';
    } else {
      statusText.textContent = 'Stable';
      statusText.className = 'status-message text-success';
    }
  }

  function triggerFlap() {
    isFlapping = true;
    linkState.classList.add('link-down');
    linkLabel.textContent = 'DOWN';
    updateStatusText();

    // Add penalty
    penalty += parseInt(penaltyInput.value);
    updateView();

    setTimeout(() => {
      isFlapping = false;
      linkState.classList.remove('link-down');
      linkLabel.textContent = 'UP';
      updateStatusText();
    }, 500);

    startDecay();
  }

  function startDecay() {
    if (decayInterval) return;

    decayInterval = setInterval(() => {
      if (penalty <= 0) {
        penalty = 0;
        clearInterval(decayInterval);
        decayInterval = null;
        updateView();
        return;
      }

      const hl = parseInt(halflifeInput.value);
      // Decay continuously: penalty = penalty * e^(-λt)
      // lambda = ln(2) / halflife
      // dt = 1 second
      const lambda = Math.LN2 / hl;
      penalty = penalty * Math.exp(-lambda); // decay for 1 second

      updateView();
    }, 1000);
  }

  function resetSimulator() {
    penalty = 0;
    isSuppressed = false;
    isFlapping = false;
    if (decayInterval) {
      clearInterval(decayInterval);
      decayInterval = null;
    }
    networkWrapper.classList.remove('suppressed-state');
    linkState.classList.remove('link-down');
    linkLabel.textContent = 'UP';
    updateStatusText();
    updateView();
  }

  // Event Listeners
  penaltyInput.addEventListener('input', updateConfig);
  suppressInput.addEventListener('input', updateConfig);
  reuseInput.addEventListener('input', updateConfig);
  halflifeInput.addEventListener('input', updateConfig);

  btnFlap.addEventListener('click', triggerFlap);
  btnReset.addEventListener('click', resetSimulator);

  // Initial setup
  updateConfig();
});
