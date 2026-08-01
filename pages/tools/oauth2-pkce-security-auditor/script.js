/**
 * OAuth2 PKCE Security Auditor
 * Web Crypto PKCE + flow simulator + misconfig/JWT checks (client-side only).
 */
(function () {
  'use strict';

  var SAMPLE_JWT =
    'eyJhbGciOiJub25lInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRlbW8gVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.';

  var state = {
    verifier: '',
    challenge: '',
    oauthState: '',
    authCode: '',
    flowStep: 0,
    findings: [],
    recommendations: [],
    jwtFlags: [],
    riskScore: 0,
    pkceStatus: '—',
    audited: false,
    tokens: null,
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

  function base64UrlEncode(bytes) {
    var bin = '';
    var arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (var i = 0; i < arr.length; i++) {
      bin += String.fromCharCode(arr[i]);
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function base64UrlDecode(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    var pad = s.length % 4;
    if (pad) s += Array(5 - pad).join('=');
    try {
      return decodeURIComponent(
        Array.prototype.map
          .call(atob(s), function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch (e) {
      return null;
    }
  }

  function randomUrlSafe(length) {
    var bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes).slice(0, length);
  }

  function sha256Base64Url(text) {
    var encoder = new TextEncoder();
    return crypto.subtle.digest('SHA-256', encoder.encode(text)).then(function (digest) {
      return base64UrlEncode(digest);
    });
  }

  function updateHero(risk, findingsCount, pkceStatus) {
    $('statRisk').textContent = risk === null || risk === undefined ? '—' : String(risk);
    $('statFindings').textContent =
      findingsCount === null || findingsCount === undefined ? '—' : String(findingsCount);
    $('statPkce').textContent = pkceStatus || '—';
  }

  function setStepUi(step, status) {
    document.querySelectorAll('.oauth-step').forEach(function (el) {
      var n = Number(el.getAttribute('data-step'));
      el.classList.remove('is-active', 'is-done', 'is-error');
      el.setAttribute('aria-current', 'false');
      if (status === 'error' && n === step) {
        el.classList.add('is-error');
      } else if (n < step) {
        el.classList.add('is-done');
      } else if (n === step) {
        el.classList.add('is-active');
        el.setAttribute('aria-current', 'step');
      }
    });
  }

  function generatePkce() {
    if (!window.crypto || !crypto.subtle) {
      $('flowStatus').textContent = 'Web Crypto API unavailable';
      return Promise.reject(new Error('Web Crypto unavailable'));
    }
    var verifier = randomUrlSafe(64);
    var oauthState = randomUrlSafe(32);
    return sha256Base64Url(verifier).then(function (challenge) {
      state.verifier = verifier;
      state.challenge = challenge;
      state.oauthState = oauthState;
      $('codeVerifier').value = verifier;
      $('codeChallenge').value = challenge;
      $('oauthState').value = oauthState;
      $('challengeMethod').value = 'S256';
      $('copyVerifierBtn').disabled = false;
      $('statPkce').textContent = 'Ready';
      state.pkceStatus = 'Ready';
      return state;
    });
  }

  function effectiveStateValue() {
    if (!$('toggleState').checked) return '';
    if ($('toggleWeakState').checked) return '123';
    return state.oauthState || randomUrlSafe(32);
  }

  function runAuthorize() {
    return (state.verifier ? Promise.resolve(state) : generatePkce()).then(function () {
      var usePkce = $('togglePkce').checked;
      var redirect = ($('requestedRedirect').value || '').trim();
      var registered = ($('registeredRedirect').value || '').trim();
      var st = effectiveStateValue();
      if (!$('toggleState').checked) st = '';
      else if ($('toggleWeakState').checked) st = '123';
      else st = state.oauthState;

      var params = new URLSearchParams();
      params.set('response_type', 'code');
      params.set('client_id', ($('clientId').value || '').trim());
      params.set('redirect_uri', redirect);
      params.set('scope', 'openid profile');
      if (st) params.set('state', st);
      if (usePkce) {
        params.set('code_challenge', state.challenge);
        params.set('code_challenge_method', 'S256');
      }

      var url = ($('authEndpoint').value || '').trim() + '?' + params.toString();
      var notes = [];
      if (!usePkce) notes.push('WARNING: PKCE disabled');
      if (!st) notes.push('WARNING: state missing');
      if (st === '123') notes.push('WARNING: weak state');
      if (redirect && registered && redirect !== registered) notes.push('WARNING: redirect_uri mismatch');

      $('stepAuthorizeOut').textContent =
        url + (notes.length ? '\n\n' + notes.join('\n') : '\n\nAuthorize URL built.');
      state.flowStep = 1;
      state._pendingState = st;
      state._pendingRedirect = redirect;
      setStepUi(1);
      $('flowStatus').textContent = 'Authorize URL ready';
      $('stepCallbackBtn').disabled = false;
      $('stepTokenBtn').disabled = true;
      $('stepCallbackOut').textContent = 'Waiting';
      $('stepTokenOut').textContent = 'Waiting';
    });
  }

  function runCallback() {
    if (state.flowStep < 1) return;
    var st = state._pendingState || '';
    var code = 'auth_' + randomUrlSafe(16);
    state.authCode = code;

    var callbackUrl =
      (state._pendingRedirect || 'https://app.example.com/callback') +
      '?code=' +
      encodeURIComponent(code) +
      (st ? '&state=' + encodeURIComponent(st) : '');

    var checks = [];
    if (!st) {
      checks.push('FAIL: no state to validate — CSRF risk');
      setStepUi(2, 'error');
    } else if (st === '123') {
      checks.push('WARN: state is weak / predictable');
      setStepUi(2);
    } else if (st === state.oauthState || st === state._pendingState) {
      checks.push('OK: state matches stored value');
      setStepUi(2);
    } else {
      checks.push('FAIL: state mismatch');
      setStepUi(2, 'error');
    }

    $('stepCallbackOut').textContent = callbackUrl + '\n\n' + checks.join('\n');
    state.flowStep = 2;
    $('flowStatus').textContent = 'Callback simulated';
    $('stepTokenBtn').disabled = false;
    document.querySelector('.oauth-step[data-step="1"]').classList.add('is-done');
    document.querySelector('.oauth-step[data-step="1"]').classList.remove('is-active');
    document.querySelector('.oauth-step[data-step="2"]').classList.add('is-active');
  }

  function runTokenExchange() {
    if (state.flowStep < 2) return;
    var usePkce = $('togglePkce').checked;
    var body = {
      grant_type: 'authorization_code',
      code: state.authCode,
      redirect_uri: state._pendingRedirect,
      client_id: ($('clientId').value || '').trim(),
    };
    if (usePkce) body.code_verifier = state.verifier;

    var ok = true;
    var messages = [];
    if (usePkce) {
      messages.push('OK: code_verifier sent (S256 exchange simulated)');
    } else {
      ok = false;
      messages.push('FAIL: token exchange without PKCE — public clients must use PKCE');
    }

    var accessToken = 'sim_' + randomUrlSafe(24);
    var idTokenHint = SAMPLE_JWT;
    state.tokens = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      id_token: idTokenHint,
      storage: $('toggleTokenLocalStorage').checked
        ? 'localStorage'
        : $('toggleTokenMemory').checked
          ? 'memory'
          : 'unspecified',
    };

    if (state.tokens.storage === 'localStorage') {
      messages.push('WARN: tokens stored in localStorage (XSS-exfiltratable)');
    } else if (state.tokens.storage === 'memory') {
      messages.push('OK: tokens kept in memory only (simulation)');
    }

    var response = {
      endpoint: ($('tokenEndpoint').value || '').trim(),
      request: body,
      response: {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
      },
      notes: messages,
    };

    $('stepTokenOut').textContent = JSON.stringify(response, null, 2);
    state.flowStep = 3;
    setStepUi(ok ? 3 : 3, ok ? undefined : 'error');
    document.querySelectorAll('.oauth-step').forEach(function (el) {
      var n = Number(el.getAttribute('data-step'));
      el.classList.remove('is-active');
      if (n <= 3) el.classList.add('is-done');
      if (!ok && n === 3) {
        el.classList.remove('is-done');
        el.classList.add('is-error');
      }
      if (n === 3 && ok) el.classList.add('is-active');
    });
    $('flowStatus').textContent = ok ? 'Token exchange complete' : 'Token exchange insecure';
  }

  function runAudit() {
    var findings = [];
    var recs = [];
    var score = 0;
    var usePkce = $('togglePkce').checked;
    var useState = $('toggleState').checked;
    var weakState = $('toggleWeakState').checked;
    var ls = $('toggleTokenLocalStorage').checked;
    var mem = $('toggleTokenMemory').checked;
    var registered = ($('registeredRedirect').value || '').trim();
    var requested = ($('requestedRedirect').value || '').trim();

    if (!usePkce) {
      score += 35;
      findings.push({
        severity: 'critical',
        title: 'Missing PKCE',
        detail:
          'Authorization Code flow without PKCE is unsafe for public/SPA clients. Attackers can intercept the code and redeem it.',
      });
      recs.push({
        key: 'pkce',
        html:
          '<strong>Require PKCE (S256)</strong> — always send <code>code_challenge</code> / <code>code_verifier</code>; reject plain method.',
      });
      state.pkceStatus = 'Missing';
    } else {
      findings.push({
        severity: 'ok',
        title: 'PKCE enabled (S256)',
        detail: 'PKCE toggle is on. Ensure the AS enforces S256 and binds verifier at token endpoint.',
      });
      recs.push({
        key: 'pkce-enforce',
        html:
          '<strong>Enforce S256 server-side</strong> — reject token requests missing verifier or using <code>plain</code> challenge method.',
      });
      state.pkceStatus = 'Enabled';
    }

    if (!useState) {
      score += 25;
      findings.push({
        severity: 'high',
        title: 'Missing state parameter',
        detail: 'Without state (or nonce for OIDC), the callback is vulnerable to CSRF / login fixation.',
      });
      recs.push({
        key: 'state',
        html:
          '<strong>Bind state</strong> — generate a high-entropy state, store it (session/memory), and verify exact match on callback.',
      });
    } else if (weakState) {
      score += 20;
      findings.push({
        severity: 'high',
        title: 'Weak / predictable state',
        detail: 'State value "123" is guessable. State must be cryptographically random and tied to the user session.',
      });
      recs.push({
        key: 'state-entropy',
        html:
          '<strong>Strengthen state</strong> — use ≥128 bits of entropy (e.g. <code>crypto.getRandomValues</code>), one-time use.',
      });
    } else {
      findings.push({
        severity: 'ok',
        title: 'Strong state enabled',
        detail: 'High-entropy state toggle is on for CSRF protection.',
      });
    }

    if (registered && requested && registered !== requested) {
      score += 30;
      findings.push({
        severity: 'critical',
        title: 'Open redirect / redirect_uri mismatch',
        detail:
          'Requested redirect_uri does not match the registered value. Exact string match is required to prevent token/code leakage.',
      });
      recs.push({
        key: 'redirect',
        html:
          '<strong>Exact redirect_uri match</strong> — pre-register URIs; never allow wildcards or query-string open redirects.',
      });
    } else {
      findings.push({
        severity: 'ok',
        title: 'redirect_uri matches registration',
        detail: 'Requested and registered redirect URIs are identical in this simulation.',
      });
    }

    if (ls) {
      score += 15;
      findings.push({
        severity: 'high',
        title: 'Tokens in localStorage',
        detail:
          'Access/refresh tokens in localStorage are readable by any XSS. Prefer memory, httpOnly cookies (BFF), or hardened worker storage.',
      });
      recs.push({
        key: 'storage',
        html:
          '<strong>Avoid localStorage for tokens</strong> — use in-memory storage, rotating refresh via BFF, or Secure/HttpOnly cookies.',
      });
    } else if (mem) {
      findings.push({
        severity: 'ok',
        title: 'Tokens kept in memory',
        detail: 'Memory-only storage reduces XSS exfiltration vs localStorage (still protect against XSS).',
      });
    } else {
      score += 8;
      findings.push({
        severity: 'medium',
        title: 'Token storage unspecified',
        detail: 'Decide on a storage strategy; defaulting to localStorage is a common footgun.',
      });
    }

    if (ls && mem) {
      score += 5;
      findings.push({
        severity: 'medium',
        title: 'Conflicting storage toggles',
        detail: 'Both localStorage and memory-only are selected. Pick one strategy and document it.',
      });
    }

    score = Math.min(100, score);
    state.findings = findings;
    state.recommendations = dedupeRecs(recs.concat(defaultHardeningRecs()));
    state.riskScore = score;
    state.audited = true;

    updateHero(score, findings.filter(function (f) {
      return f.severity !== 'ok';
    }).length, state.pkceStatus);
    renderFindings(findings);
    renderRecs(state.recommendations);
    $('exportReportBtn').disabled = false;
  }

  function defaultHardeningRecs() {
    return [
      {
        key: 'audience',
        html:
          '<strong>Validate tokens</strong> — check <code>iss</code>, <code>aud</code>, <code>exp</code>, and signature with AS JWKS.',
      },
      {
        key: 'refresh',
        html:
          '<strong>Rotate refresh tokens</strong> — use refresh token rotation + reuse detection for public clients.',
      },
      {
        key: 'scopes',
        html:
          '<strong>Least privilege scopes</strong> — request only needed scopes; prefer fine-grained APIs over long-lived broad tokens.',
      },
    ];
  }

  function dedupeRecs(list) {
    var seen = {};
    var out = [];
    list.forEach(function (r) {
      if (!seen[r.key]) {
        seen[r.key] = true;
        out.push(r);
      }
    });
    return out;
  }

  function renderFindings(findings) {
    var root = $('findingsList');
    root.innerHTML = '';
    findings.forEach(function (f) {
      var el = document.createElement('article');
      el.className = 'oauth-finding';
      el.setAttribute('data-severity', f.severity);
      el.innerHTML =
        '<p class="oauth-finding-meta">' +
        escapeHtml(f.severity) +
        '</p>' +
        '<h3 class="oauth-finding-title">' +
        escapeHtml(f.title) +
        '</h3>' +
        '<p class="oauth-finding-detail">' +
        escapeHtml(f.detail) +
        '</p>';
      root.appendChild(el);
    });
  }

  function renderRecs(recs) {
    var list = $('recsList');
    list.innerHTML = '';
    recs.forEach(function (r) {
      var li = document.createElement('li');
      li.innerHTML = r.html;
      list.appendChild(li);
    });
  }

  function auditJwt() {
    var raw = ($('jwtInput').value || '').trim();
    var headerOut = $('jwtHeaderOut');
    var payloadOut = $('jwtPayloadOut');
    var flagsEl = $('jwtFlags');
    flagsEl.innerHTML = '';
    state.jwtFlags = [];

    if (!raw) {
      headerOut.textContent = '—';
      payloadOut.textContent = '—';
      return;
    }

    var parts = raw.split('.');
    if (parts.length < 2) {
      headerOut.textContent = 'Invalid JWT structure';
      payloadOut.textContent = '—';
      addJwtFlag('critical', 'JWT must have at least header.payload[.signature]');
      return;
    }

    var headerJson = base64UrlDecode(parts[0]);
    var payloadJson = base64UrlDecode(parts[1]);
    var header = null;
    var payload = null;

    try {
      header = JSON.parse(headerJson);
      headerOut.textContent = JSON.stringify(header, null, 2);
    } catch (e) {
      headerOut.textContent = 'Failed to decode/parse header';
      addJwtFlag('high', 'Header is not valid base64url JSON');
    }

    try {
      payload = JSON.parse(payloadJson);
      payloadOut.textContent = JSON.stringify(payload, null, 2);
    } catch (e) {
      payloadOut.textContent = 'Failed to decode/parse payload';
      addJwtFlag('high', 'Payload is not valid base64url JSON');
    }

    if (header) {
      var alg = String(header.alg || '').toLowerCase();
      if (!header.alg) addJwtFlag('high', 'Missing alg in header');
      if (alg === 'none') addJwtFlag('critical', 'alg "none" — reject unsigned tokens');
      if (alg === 'hs256') {
        addJwtFlag('medium', 'HS256 detected — ensure secrets are not shared with browsers');
      }
      if (!header.typ) addJwtFlag('low', 'Missing typ (recommended: JWT)');
    }

    if (payload) {
      if (payload.exp === undefined || payload.exp === null) {
        addJwtFlag('high', 'Missing exp claim — tokens should expire');
      } else {
        var now = Math.floor(Date.now() / 1000);
        if (Number(payload.exp) < now) addJwtFlag('medium', 'Token exp is in the past (expired)');
      }
      if (payload.nbf !== undefined && Number(payload.nbf) > Math.floor(Date.now() / 1000) + 60) {
        addJwtFlag('low', 'nbf is in the future');
      }
      if (!payload.iss) addJwtFlag('medium', 'Missing iss claim');
      if (!payload.aud) addJwtFlag('medium', 'Missing aud claim');
      if (!payload.sub) addJwtFlag('low', 'Missing sub claim');
    }

    if (parts.length < 3 || !parts[2]) {
      addJwtFlag('critical', 'Missing signature segment');
    }

    if (!state.jwtFlags.length) {
      addJwtFlag('ok', 'No common JWT anti-patterns flagged (signature not verified)');
    }

    mergeJwtIntoRecs();
  }

  function addJwtFlag(severity, text) {
    state.jwtFlags.push({ severity: severity, text: text });
    var li = document.createElement('li');
    li.setAttribute('data-severity', severity);
    li.textContent = '[' + severity + '] ' + text;
    $('jwtFlags').appendChild(li);
  }

  function mergeJwtIntoRecs() {
    var extra = [];
    state.jwtFlags.forEach(function (f) {
      if (f.severity === 'critical' || f.severity === 'high') {
        if (/alg "none"|unsigned/i.test(f.text)) {
          extra.push({
            key: 'alg-none',
            html:
              '<strong>Reject alg=none</strong> — explicitly deny unsigned JWTs and unexpected algorithms via an allow-list.',
          });
        }
        if (/Missing exp/i.test(f.text)) {
          extra.push({
            key: 'exp',
            html:
              '<strong>Require exp</strong> — enforce short-lived access tokens and validate expiration with clock skew tolerance.',
          });
        }
        if (/signature/i.test(f.text)) {
          extra.push({
            key: 'sig',
            html:
              '<strong>Verify signatures</strong> — validate against AS JWKS; never trust decoded claims alone.',
          });
        }
      }
    });
    if (extra.length) {
      state.recommendations = dedupeRecs((state.recommendations || []).concat(extra).concat(defaultHardeningRecs()));
      renderRecs(state.recommendations);
    }
  }

  function buildReport() {
    var lines = [];
    lines.push('# OAuth2 PKCE Security Audit Report');
    lines.push('');
    lines.push('Generated: ' + new Date().toISOString());
    lines.push('Risk score: ' + state.riskScore + ' / 100 (higher = worse)');
    lines.push('PKCE status: ' + state.pkceStatus);
    lines.push(
      'Findings (issues): ' +
        state.findings.filter(function (f) {
          return f.severity !== 'ok';
        }).length
    );
    lines.push('');
    lines.push('## Configuration snapshot');
    lines.push('- client_id: ' + ($('clientId').value || ''));
    lines.push('- authorize: ' + ($('authEndpoint').value || ''));
    lines.push('- token: ' + ($('tokenEndpoint').value || ''));
    lines.push('- registered redirect_uri: ' + ($('registeredRedirect').value || ''));
    lines.push('- requested redirect_uri: ' + ($('requestedRedirect').value || ''));
    lines.push('- PKCE enabled: ' + $('togglePkce').checked);
    lines.push('- state enabled: ' + $('toggleState').checked);
    lines.push('- weak state: ' + $('toggleWeakState').checked);
    lines.push('- tokens in localStorage: ' + $('toggleTokenLocalStorage').checked);
    lines.push('- tokens in memory: ' + $('toggleTokenMemory').checked);
    lines.push('');
    lines.push('## Findings');
    state.findings.forEach(function (f) {
      lines.push('- [' + f.severity + '] ' + f.title + ' — ' + f.detail);
    });
    if (state.jwtFlags.length) {
      lines.push('');
      lines.push('## JWT auditor flags');
      state.jwtFlags.forEach(function (f) {
        lines.push('- [' + f.severity + '] ' + f.text);
      });
    }
    lines.push('');
    lines.push('## Hardening recommendations');
    state.recommendations.forEach(function (r) {
      lines.push('- ' + r.html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    });
    lines.push('');
    lines.push('## Notes');
    lines.push('- This is an educational client-side simulator; it does not contact real authorization servers.');
    lines.push('- Prefer Authorization Code + PKCE, exact redirect_uri match, strong state, and non-XSS-accessible token storage.');
    return lines.join('\n');
  }

  function downloadReport() {
    if (!state.audited && !state.jwtFlags.length) return;
    var blob = new Blob([buildReport()], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'oauth2-pkce-security-audit.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function copyVerifier() {
    var v = $('codeVerifier').value;
    if (!v) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).catch(function () {});
    }
  }

  function init() {
    $('generatePkceBtn').addEventListener('click', function () {
      generatePkce().catch(function () {});
    });
    $('copyVerifierBtn').addEventListener('click', copyVerifier);
    $('stepAuthorizeBtn').addEventListener('click', function () {
      runAuthorize().catch(function () {});
    });
    $('stepCallbackBtn').addEventListener('click', runCallback);
    $('stepTokenBtn').addEventListener('click', runTokenExchange);
    $('runAuditBtn').addEventListener('click', runAudit);
    $('exportReportBtn').addEventListener('click', downloadReport);
    $('auditJwtBtn').addEventListener('click', auditJwt);
    $('loadSampleJwtBtn').addEventListener('click', function () {
      // Intentionally unsafe sample: alg none + missing exp/iss/aud for demos
      var header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'none', typ: 'JWT' })));
      var payload = base64UrlEncode(
        new TextEncoder().encode(JSON.stringify({ sub: '1234567890', name: 'Demo User', iat: 1516239022 }))
      );
      $('jwtInput').value = header + '.' + payload + '.';
      auditJwt();
    });

    // Auto-generate PKCE on load for better UX
    generatePkce().catch(function () {
      $('statPkce').textContent = 'Unavailable';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
