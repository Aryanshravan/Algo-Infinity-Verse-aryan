/**
 * tls13-simulator.js
 * Simulate the TLS 1.3 Handshake (1-RTT and 0-RTT).
 * eslint-disable no-unused-vars
 */
/* eslint-disable no-unused-vars */

document.addEventListener('DOMContentLoaded', () => {
  initTLS();
});

const els = {
  btnStart: document.getElementById('btnNextStep'),
  btnReset: document.getElementById('btnReset'),
  modeToggle: document.getElementById('modeToggle'),
  modeLabel: document.getElementById('modeLabel'),
  messagesArea: document.getElementById('messagesArea'),
  explanationText: document.getElementById('explanationText'),

  cKeyShare: document.getElementById('clientKeyShare'),
  sKeyShare: document.getElementById('serverKeyShare'),
  cMaster: document.getElementById('clientMasterSecret'),
  sMaster: document.getElementById('serverMasterSecret'),
};

let is0RTT = false;
let isAnimating = false;

function initTLS() {
  els.btnStart.addEventListener('click', startHandshake);
  els.btnReset.addEventListener('click', resetSimulation);
  els.modeToggle.addEventListener('change', () => {
    is0RTT = els.modeToggle.checked;
    els.modeLabel.innerHTML = is0RTT
      ? 'Mode: <strong style="color:var(--color-early)">0-RTT</strong> (Session Resumption)'
      : 'Mode: <strong>1-RTT</strong> (New Connection)';
    resetSimulation();
  });
}

function resetSimulation() {
  els.messagesArea.innerHTML = '';
  els.cKeyShare.classList.add('hidden');
  els.sKeyShare.classList.add('hidden');
  els.cMaster.classList.add('hidden');
  els.sMaster.classList.add('hidden');

  els.btnStart.disabled = false;
  els.btnStart.innerHTML = 'Start Handshake <i class="fas fa-play"></i>';
  els.explanationText.textContent = is0RTT
    ? '0-RTT mode selected. The client will send early data along with its ClientHello, achieving zero latency overhead.'
    : '1-RTT mode selected. The connection will be secured in a single round trip.';

  isAnimating = false;
}

// Helper to animate messages across the sequence diagram
function animateMessage(options) {
  return new Promise((resolve) => {
    const msg = document.createElement('div');
    msg.className = `message-box ${options.classes || ''}`;
    msg.innerHTML = `${options.icon ? `<i class="${options.icon}"></i> ` : ''}${options.text}`;

    // Positioning
    msg.style.top = `${options.yOffset}px`;

    if (options.dir === 'c2s') {
      msg.classList.add('client-to-server');
      msg.style.left = '0%';
      msg.style.transform = 'translate(-50%, -50%)';
    } else {
      msg.classList.add('server-to-client');
      msg.style.right = '0%';
      msg.style.transform = 'translate(50%, -50%)';
    }

    els.messagesArea.appendChild(msg);

    // Animation
    msg.animate([{ opacity: 1 }, { opacity: 1 }], { duration: options.duration, fill: 'forwards' });

    // Move it across
    const animation = msg.animate(
      [
        { [options.dir === 'c2s' ? 'left' : 'right']: '0%' },
        { [options.dir === 'c2s' ? 'left' : 'right']: '100%' },
      ],
      {
        duration: options.duration,
        easing: 'ease-in-out',
        fill: 'forwards',
      }
    );

    animation.onfinish = () => {
      resolve(msg);
    };
  });
}

async function startHandshake() {
  if (isAnimating) return;
  isAnimating = true;
  els.btnStart.disabled = true;

  els.messagesArea.innerHTML = '';

  if (is0RTT) {
    await run0RTT();
  } else {
    await run1RTT();
  }
}

async function run1RTT() {
  els.explanationText.innerHTML =
    "<strong>Phase 1: ClientHello</strong><br>The Client initiates the connection and crucially, <em>guesses</em> the Server's preferred key exchange algorithm, sending its Key Share (g^a) immediately.";

  // Client generates Key Share
  els.cKeyShare.textContent = 'g^a';
  els.cKeyShare.classList.remove('hidden');

  await animateMessage({
    text: 'ClientHello + Key Share',
    icon: 'fas fa-handshake',
    dir: 'c2s',
    yOffset: 40,
    duration: 1500,
  });

  els.explanationText.innerHTML =
    "<strong>Phase 2: ServerHello & Master Secret</strong><br>The Server receives the Client's share, generates its own (g^b), and immediately computes the Master Secret. It replies with its share and Encrypted Extensions.";

  // Server generates Key Share and Master
  els.sKeyShare.textContent = 'g^b';
  els.sKeyShare.classList.remove('hidden');
  setTimeout(() => {
    els.sMaster.classList.remove('hidden');
    els.sMaster.style.color = 'var(--color-encrypt)';
  }, 500);

  await Promise.all([
    animateMessage({
      text: 'ServerHello + Key Share',
      icon: 'fas fa-server',
      dir: 's2c',
      yOffset: 120,
      duration: 1500,
    }),
    animateMessage({
      text: 'EncryptedExtensions, Finished',
      icon: 'fas fa-lock',
      dir: 's2c',
      yOffset: 160,
      duration: 1500,
      classes: 'encrypted',
    }),
  ]);

  els.explanationText.innerHTML =
    "<strong>Phase 3: Connection Secured!</strong><br>The Client receives the Server's share, computes the same Master Secret, and sends its Finished message. All subsequent data is encrypted. Total overhead: <strong>1 Round Trip</strong>.";

  // Client computes Master
  els.cMaster.classList.remove('hidden');
  els.cMaster.style.color = 'var(--color-encrypt)';

  await animateMessage({
    text: 'Finished',
    icon: 'fas fa-lock',
    dir: 'c2s',
    yOffset: 240,
    duration: 1200,
    classes: 'encrypted',
  });

  // Application Data
  await animateMessage({
    text: 'Application Data (HTTP)',
    icon: 'fas fa-database',
    dir: 'c2s',
    yOffset: 300,
    duration: 1000,
    classes: 'encrypted',
  });

  els.btnStart.innerHTML = '<i class="fas fa-check"></i> Connected';
}

async function run0RTT() {
  els.explanationText.innerHTML =
    '<strong>Phase 1: Session Resumption (0-RTT)</strong><br>The Client remembers a previous session (using a Pre-Shared Key or Session Ticket) and sends encrypted Application Data <em>immediately</em> with the ClientHello.';

  // Client has PSK
  els.cMaster.classList.remove('hidden');
  els.cMaster.style.color = 'var(--color-early)';

  await Promise.all([
    animateMessage({
      text: 'ClientHello + PSK',
      icon: 'fas fa-ticket-alt',
      dir: 'c2s',
      yOffset: 40,
      duration: 1500,
    }),
    animateMessage({
      text: 'Early Data (HTTP Request)',
      icon: 'fas fa-bolt',
      dir: 'c2s',
      yOffset: 80,
      duration: 1500,
      classes: 'early-data',
    }),
  ]);

  els.explanationText.innerHTML =
    '<strong>Phase 2: Server Accepts Early Data</strong><br>The Server validates the PSK ticket. It decrypts the early data immediately and replies with the requested Application Data and ServerHello.';

  // Server has PSK
  els.sMaster.classList.remove('hidden');
  els.sMaster.style.color = 'var(--color-early)';

  await Promise.all([
    animateMessage({
      text: 'ServerHello + EncryptedExtensions',
      icon: 'fas fa-lock',
      dir: 's2c',
      yOffset: 160,
      duration: 1500,
      classes: 'encrypted',
    }),
    animateMessage({
      text: 'Application Data (HTTP Response)',
      icon: 'fas fa-database',
      dir: 's2c',
      yOffset: 200,
      duration: 1500,
      classes: 'early-data',
    }),
  ]);

  els.explanationText.innerHTML =
    '<strong>Zero Round Trips!</strong><br>The HTTP request was fulfilled without waiting for any handshake round trips. This is 0-RTT in action.';

  els.btnStart.innerHTML = '<i class="fas fa-check"></i> Connected';
}
