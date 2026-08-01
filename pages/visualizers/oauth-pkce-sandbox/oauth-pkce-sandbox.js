/**
 * oauth-pkce-sandbox.js
 * Sandbox for OAuth 2.0 Authorization Code Flow with PKCE.
 */

document.addEventListener('DOMContentLoaded', () => {
  initOAuth();
});

const els = {
  btnStep1: document.getElementById('btnStep1'),
  btnStep2: document.getElementById('btnStep2'),
  btnStep3: document.getElementById('btnStep3'),
  btnStep4: document.getElementById('btnStep4'),

  codeVerifier: document.getElementById('codeVerifier'),
  codeChallenge: document.getElementById('codeChallenge'),

  serverSavedChallenge: document.getElementById('serverSavedChallenge'),
  authLogContent: document.getElementById('authLogContent'),
  resourceLogContent: document.getElementById('resourceLogContent'),

  step1Card: document.getElementById('step1-card'),
  step2Card: document.getElementById('step2-card'),
  step3Card: document.getElementById('step3-card'),
  step4Card: document.getElementById('step4-card'),

  maliciousInterceptCard: document.getElementById('malicious-intercept-card'),
  maliciousExchangeCard: document.getElementById('malicious-exchange-card'),
  btnMaliciousIntercept: document.getElementById('btnMaliciousIntercept'),
  btnMaliciousExchange: document.getElementById('btnMaliciousExchange'),
  maliciousLogContent: document.getElementById('maliciousLogContent'),

  userDataResult: document.getElementById('userDataResult'),
  pkceToggle: document.getElementById('pkceToggle'),
  pkceStatusLabel: document.getElementById('pkceStatusLabel'),
};

// Global state for the simulation
const state = {
  verifier: '',
  challenge: '',
  authCode: '',
  accessToken: '',
  pkceEnabled: true,
};

function initOAuth() {
  els.btnStep1.addEventListener('click', handleStep1);
  els.btnStep2.addEventListener('click', handleStep2);
  els.btnStep3.addEventListener('click', handleStep3);
  els.btnStep4.addEventListener('click', handleStep4);

  els.btnMaliciousIntercept.addEventListener('click', handleMaliciousIntercept);
  els.btnMaliciousExchange.addEventListener('click', handleMaliciousExchange);

  els.pkceToggle.addEventListener('change', handleTogglePKCE);
}

function handleTogglePKCE(e) {
  state.pkceEnabled = e.target.checked;
  if (state.pkceEnabled) {
    els.pkceStatusLabel.textContent = 'PKCE: ON (Secure)';
    els.pkceStatusLabel.className = 'pkce-label secure';
    document.querySelector('.crypto-box').style.opacity = '1';
  } else {
    els.pkceStatusLabel.textContent = 'PKCE: OFF (Vulnerable)';
    els.pkceStatusLabel.className = 'pkce-label vulnerable';
    document.querySelector('.crypto-box').style.opacity = '0.3';
  }
}

// Helper: base64url encoding
function base64urlencode(a) {
  let str = '';
  let bytes = new Uint8Array(a);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generate random string
function generateRandomString(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Generate challenge from verifier using Web Crypto API
async function generateCodeChallenge(code_verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code_verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64urlencode(digest);
}

async function handleStep1() {
  els.btnStep1.disabled = true;

  if (state.pkceEnabled) {
    // Generate verifier and challenge
    state.verifier = generateRandomString(43); // RFC says 43-128 chars
    state.challenge = await generateCodeChallenge(state.verifier);

    els.codeVerifier.value = state.verifier;
    els.codeChallenge.value = state.challenge;

    logToAuth(`<span class="log-method">GET</span> /authorize
?response_type=code
&client_id=SPA_CLIENT
&code_challenge=${state.challenge}
&code_challenge_method=S256`);
  } else {
    state.verifier = '';
    state.challenge = '';
    els.codeVerifier.value = 'N/A';
    els.codeChallenge.value = 'N/A';

    logToAuth(`<span class="log-method">GET</span> /authorize
?response_type=code
&client_id=SPA_CLIENT
<span class="log-method">/* No PKCE provided */</span>`);
  }

  // Enable step 2
  els.step2Card.classList.remove('disabled');
  els.btnStep2.disabled = false;

  // Auth Server saves challenge
  setTimeout(() => {
    els.serverSavedChallenge.textContent = state.challenge;
    els.serverSavedChallenge.classList.remove('text-muted');
    els.serverSavedChallenge.style.color = '#86efac';
  }, 500);
}

function handleStep2() {
  els.btnStep2.disabled = true;

  // Auth Server generates code
  state.authCode = 'auth_' + generateRandomString(20);

  logToAuth(`User Authenticated successfully.
Generated Authorization Code: ${state.authCode}
Redirecting back to Client...`);

  // Enable step 3 (Legit App) & Malicious Intercept (Attacker)
  els.step3Card.classList.remove('disabled');
  els.btnStep3.disabled = false;

  els.maliciousInterceptCard.classList.remove('disabled');
  els.btnMaliciousIntercept.disabled = false;
}

function handleMaliciousIntercept() {
  els.btnMaliciousIntercept.disabled = true;

  logToMalicious(`Intercepting Custom URI Scheme...
<span class="log-status">Success!</span>
Stolen Authorization Code: <span style="color:#fff">${state.authCode}</span>`);

  els.maliciousExchangeCard.classList.remove('disabled');
  els.btnMaliciousExchange.disabled = false;
}

function handleMaliciousExchange() {
  els.btnMaliciousExchange.disabled = true;

  logToMalicious(`---
<span class="log-method">POST</span> /oauth/token
{
  "grant_type": "authorization_code",
  "client_id": "SPA_CLIENT",
  "code": "${state.authCode}"
}`);

  logToAuth(`---
<span class="log-method">POST</span> /oauth/token [FROM ATTACKER]
Code: ${state.authCode}`);

  setTimeout(() => {
    if (state.pkceEnabled) {
      logToAuth(`<span class="log-method">400 Bad Request</span>
PKCE required! Missing code_verifier.`);
      logToMalicious(`<span class="log-method">400 Bad Request</span>
Attack FAILED. Server demands PKCE verifier.`);
    } else {
      state.accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ATTACKER';
      logToAuth(`<span class="log-status">200 OK</span>
Issuing Access Token to Attacker: ${state.accessToken}`);
      logToMalicious(`<span class="log-status">200 OK</span>
Attack SUCCESS!
Access Token: ${state.accessToken}`);

      setTimeout(() => {
        logToResource(`<span class="log-method">GET</span> /api/user_data [FROM ATTACKER]
Authorization: Bearer ${state.accessToken}`);
        setTimeout(() => {
          logToResource(`<span class="log-method">ATTACK SUCCESS!</span>
User data exfiltrated.`);
          logToMalicious(`User Data Stolen!`);
        }, 800);
      }, 1000);
    }
  }, 1000);
}

async function handleStep3() {
  els.btnStep3.disabled = true;

  // Log request
  logToAuth(`---
<span class="log-method">POST</span> /oauth/token
{
  "grant_type": "authorization_code",
  "client_id": "SPA_CLIENT",
  "code": "${state.authCode}",
  "code_verifier": "${state.verifier}"
}`);

  // Auth Server verifies
  setTimeout(async () => {
    if (state.pkceEnabled) {
      const checkChallenge = await generateCodeChallenge(state.verifier);
      if (checkChallenge === els.serverSavedChallenge.textContent) {
        state.accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' + generateRandomString(10);
        logToAuth(`<span class="log-status">200 OK</span>
PKCE Verification Passed!
Issuing Access Token: ${state.accessToken}`);

        // Enable Step 4
        els.step4Card.classList.remove('disabled');
        els.btnStep4.disabled = false;
      } else {
        logToAuth(`<span class="log-method">400 Bad Request</span>
PKCE Verification Failed!`);
      }
    } else {
      // PKCE OFF, just give the token
      state.accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' + generateRandomString(10);
      logToAuth(`<span class="log-status">200 OK</span>
Issuing Access Token: ${state.accessToken}`);
      els.step4Card.classList.remove('disabled');
      els.btnStep4.disabled = false;
    }
  }, 800);
}

function handleStep4() {
  els.btnStep4.disabled = true;

  logToResource(`<span class="log-method">GET</span> /api/user_data
Authorization: Bearer ${state.accessToken}`);

  setTimeout(() => {
    logToResource(`<span class="log-status">200 OK</span>
Serving protected data...`);

    els.userDataResult.classList.remove('hidden');
    els.userDataResult.innerHTML = `{
  "id": 8492,
  "name": "Jane Developer",
  "role": "Admin"
}`;
  }, 600);
}

function logToAuth(msg) {
  if (els.authLogContent.innerHTML === 'Waiting for requests...') {
    els.authLogContent.innerHTML = '';
  }
  els.authLogContent.innerHTML += `<div class="log-entry">${msg}</div>`;
  els.authLogContent.scrollTop = els.authLogContent.scrollHeight;
}

function logToResource(msg) {
  if (els.resourceLogContent.innerHTML === 'Waiting for API calls...') {
    els.resourceLogContent.innerHTML = '';
  }
  els.resourceLogContent.innerHTML += `<div class="log-entry">${msg}</div>`;
  els.resourceLogContent.scrollTop = els.resourceLogContent.scrollHeight;
}

function logToMalicious(msg) {
  if (els.maliciousLogContent.innerHTML === 'Awaiting interception...') {
    els.maliciousLogContent.innerHTML = '';
  }
  els.maliciousLogContent.innerHTML += `<div class="log-entry">${msg}</div>`;
  els.maliciousLogContent.scrollTop = els.maliciousLogContent.scrollHeight;
}
