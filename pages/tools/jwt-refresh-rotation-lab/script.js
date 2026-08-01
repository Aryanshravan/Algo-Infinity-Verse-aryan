/**
 * JWT Refresh Rotation Lab
 * Concurrent refresh race simulator + family invalidation walkthrough.
 */
(function () {
  'use strict';

  var state = {
    familyId: 'fam_demo_01',
    currentRefresh: null,
    generation: 0,
    revoked: false,
    accessTokens: [],
    racesRun: 0,
    reuseDetections: 0,
    lastOutcomes: [],
    walkLog: [],
    risk: 0,
    analyzed: false,
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

  function randToken(prefix) {
    var bytes = new Uint8Array(8);
    if (window.crypto && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i++) bytes[i] = (Math.random() * 256) | 0;
    }
    var hex = Array.prototype.map
      .call(bytes, function (b) {
        return ('0' + b.toString(16)).slice(-2);
      })
      .join('');
    return prefix + '_' + hex;
  }

  function policy() {
    return {
      rotation: $('toggleRotation').checked,
      reuseDetect: $('toggleReuseDetect').checked,
      family: $('toggleFamily').checked,
      accessTtl: Number($('accessTtl').value) || 900,
      refreshTtl: Number($('refreshTtl').value) || 604800,
      parallelN: Math.min(20, Math.max(1, Number($('parallelN').value) || 5)),
      familyId: ($('familyId').value || 'fam_demo_01').trim(),
    };
  }

  function seedFamily() {
    var p = policy();
    state.familyId = p.familyId;
    state.generation = 1;
    state.revoked = false;
    state.currentRefresh = randToken('rt');
    state.accessTokens = [];
    state.walkLog = [
      'Seeded family "' +
        state.familyId +
        '" generation ' +
        state.generation +
        ' with refresh ' +
        state.currentRefresh,
    ];
    updateWalk();
    $('raceStatus').textContent = 'Family seeded';
    $('statRaces').textContent = String(state.racesRun);
    $('statReuse').textContent = String(state.reuseDetections);
  }

  function computeRisk(p, outcomes) {
    var risk = 0;
    if (!p.rotation) risk += 35;
    if (!p.reuseDetect) risk += 30;
    if (!p.family) risk += 20;
    var accepted = outcomes.filter(function (o) {
      return o.status === 'accepted';
    }).length;
    if (accepted > 1 && !p.rotation) risk += 20;
    if (accepted > 1 && p.rotation && !p.reuseDetect) risk += 15;
    if (p.accessTtl > 3600) risk += 10;
    if (p.refreshTtl > 2592000) risk += 5;
    return Math.min(100, risk);
  }

  /**
   * Simulate N concurrent refresh attempts sharing the same stolen/old refresh token.
   */
  function runRace() {
    var p = policy();
    if (!state.currentRefresh) seedFamily();

    var stolen = state.currentRefresh;
    var outcomes = [];
    var log = state.walkLog.slice();
    log.push('');
    log.push(
      '--- Race #' +
        (state.racesRun + 1) +
        ': ' +
        p.parallelN +
        ' parallel refreshes with token ' +
        stolen +
        ' ---'
    );

    var firstWinner = null;
    var reuseHits = 0;

    for (var i = 0; i < p.parallelN; i++) {
      var attempt = i + 1;
      var outcome = {
        attempt: attempt,
        status: 'rejected',
        reason: '',
        access: null,
        refresh: null,
        className: 'rejected',
      };

      if (state.revoked && p.family) {
        outcome.reason = 'Family revoked — all tokens in family rejected';
        outcome.className = 'rejected';
        log.push('#' + attempt + ' REJECTED: family already revoked');
      } else if (stolen !== state.currentRefresh) {
        if (p.reuseDetect && p.family) {
          state.revoked = true;
          reuseHits++;
          outcome.status = 'reuse-detected';
          outcome.reason =
            'Refresh reuse detected — invalidating entire token family ' + state.familyId;
          outcome.className = 'reuse';
          log.push(
            '#' +
              attempt +
              ' REUSE DETECTED on stale token → family ' +
              state.familyId +
              ' revoked'
          );
        } else if (p.reuseDetect) {
          reuseHits++;
          outcome.status = 'reuse-detected';
          outcome.reason = 'Stale refresh rejected (reuse detection, no family wipe)';
          outcome.className = 'reuse';
          log.push('#' + attempt + ' REUSE: stale refresh rejected');
        } else {
          outcome.status = 'accepted';
          outcome.reason = 'Replay accepted — no reuse detection (dangerous)';
          outcome.access = randToken('at');
          outcome.refresh = p.rotation ? randToken('rt') : stolen;
          outcome.className = 'accepted';
          state.accessTokens.push(outcome.access);
          if (p.rotation) state.currentRefresh = outcome.refresh;
          log.push(
            '#' +
              attempt +
              ' ACCEPTED replay → access ' +
              outcome.access +
              (p.rotation ? ' + new refresh' : ' (same refresh)')
          );
        }
      } else if (!firstWinner) {
        firstWinner = attempt;
        outcome.status = 'accepted';
        outcome.reason = 'First successful refresh';
        outcome.access = randToken('at');
        outcome.refresh = p.rotation ? randToken('rt') : stolen;
        outcome.className = 'accepted';
        state.accessTokens.push(outcome.access);
        if (p.rotation) {
          state.generation += 1;
          state.currentRefresh = outcome.refresh;
          log.push(
            '#' +
              attempt +
              ' ACCEPTED (winner) → rotated refresh gen ' +
              state.generation +
              ' = ' +
              outcome.refresh
          );
        } else {
          log.push(
            '#' +
              attempt +
              ' ACCEPTED (winner) → access ' +
              outcome.access +
              ' (rotation OFF, refresh reused)'
          );
        }
      } else {
        // Concurrent losers racing the same pre-rotation token
        if (p.rotation && p.reuseDetect) {
          if (p.family) state.revoked = true;
          reuseHits++;
          outcome.status = 'reuse-detected';
          outcome.reason =
            'Concurrent refresh after rotation — treated as reuse' +
            (p.family ? '; family revoked' : '');
          outcome.className = 'reuse';
          log.push(
            '#' +
              attempt +
              ' REUSE (race loser) — presented pre-rotation token after winner rotated'
          );
        } else if (p.rotation && !p.reuseDetect) {
          outcome.status = 'rejected';
          outcome.reason = 'Refresh no longer current (rotation without reuse detection)';
          outcome.className = 'rejected';
          log.push('#' + attempt + ' REJECTED: refresh already rotated');
        } else {
          outcome.status = 'accepted';
          outcome.reason = 'Multiple valid refreshes — race produced extra access tokens';
          outcome.access = randToken('at');
          outcome.refresh = stolen;
          outcome.className = 'accepted';
          state.accessTokens.push(outcome.access);
          log.push(
            '#' + attempt + ' ACCEPTED concurrent → extra access ' + outcome.access
          );
        }
      }

      outcomes.push(outcome);
    }

    state.racesRun += 1;
    state.reuseDetections += reuseHits;
    state.lastOutcomes = outcomes;
    state.walkLog = log;
    state.risk = computeRisk(p, outcomes);
    state.analyzed = true;

    renderAll();
  }

  function updateWalk() {
    var steps = document.querySelectorAll('#walkSteps .jwtrot-step');
    if (steps[0]) steps[0].classList.add('is-done');
    if (state.generation > 1 && steps[1]) steps[1].classList.add('is-done');
    if (state.reuseDetections > 0 && steps[2]) steps[2].classList.add('is-done');
    if (state.revoked && steps[3]) steps[3].classList.add('is-done');
    $('walkLog').textContent = state.walkLog.join('\n') || 'Awaiting simulation…';
  }

  function renderOutcomes() {
    var el = $('outcomesList');
    if (!state.lastOutcomes.length) {
      el.innerHTML =
        '<p class="jwtrot-empty">Configure policy and run the concurrent refresh race.</p>';
      return;
    }
    var multiAccess = state.accessTokens.length;
    el.innerHTML =
      '<p class="jwtrot-hint">Access tokens minted this session: <strong>' +
      multiAccess +
      '</strong> · Family revoked: <strong>' +
      (state.revoked ? 'yes' : 'no') +
      '</strong></p>' +
      state.lastOutcomes
        .map(function (o) {
          return (
            '<div class="jwtrot-outcome ' +
            o.className +
            '">' +
            '<strong>Attempt #' +
            o.attempt +
            '</strong> — ' +
            escapeHtml(o.status) +
            '<br />' +
            escapeHtml(o.reason) +
            (o.access ? '<br /><code>' + escapeHtml(o.access) + '</code>' : '') +
            '</div>'
          );
        })
        .join('');
  }

  function renderChecklist() {
    var p = policy();
    var items = [
      {
        ok: p.rotation,
        cls: p.rotation ? 'pass' : 'fail',
        text: 'Rotate refresh token on every successful refresh',
      },
      {
        ok: p.reuseDetect,
        cls: p.reuseDetect ? 'pass' : 'fail',
        text: 'Detect and reject reused refresh tokens',
      },
      {
        ok: p.family,
        cls: p.family ? 'pass' : 'fail',
        text: 'Track token families and revoke on reuse',
      },
      {
        ok: p.accessTtl <= 900,
        cls: p.accessTtl <= 900 ? 'pass' : 'warn',
        text: 'Keep access token TTL short (≤ 15 minutes recommended)',
      },
      {
        ok: p.refreshTtl <= 1209600,
        cls: p.refreshTtl <= 1209600 ? 'pass' : 'warn',
        text: 'Bound refresh TTL (≤ 14 days recommended for SPAs)',
      },
      {
        ok: !(state.accessTokens.length > 1 && !p.rotation),
        cls: state.accessTokens.length > 1 && !p.rotation ? 'fail' : 'pass',
        text: 'Avoid issuing multiple access tokens from one refresh without rotation',
      },
      {
        ok: true,
        cls: 'pass',
        text: 'Store refresh tokens in httpOnly Secure cookies (checklist reminder)',
      },
      {
        ok: true,
        cls: 'pass',
        text: 'Bind refresh to client/device where feasible (checklist reminder)',
      },
    ];
    $('checklist').innerHTML = items
      .map(function (it) {
        var mark = it.ok ? '✓' : '✗';
        return (
          '<li class="' +
          it.cls +
          '">' +
          mark +
          ' ' +
          escapeHtml(it.text) +
          '</li>'
        );
      })
      .join('');
  }

  function renderStats() {
    $('statRisk').textContent = state.analyzed ? String(state.risk) : '—';
    $('statRaces').textContent = state.racesRun ? String(state.racesRun) : '—';
    $('statReuse').textContent = state.racesRun
      ? String(state.reuseDetections)
      : '—';
  }

  function renderAll() {
    renderStats();
    renderOutcomes();
    updateWalk();
    renderChecklist();
    $('exportBtn').disabled = !state.analyzed;
    $('raceStatus').textContent =
      'Race complete · risk ' + state.risk + ' · reuse hits ' + state.reuseDetections;
  }

  function b64url(buf) {
    var str = '';
    var bytes = new Uint8Array(buf);
    for (var i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function signDemoToken() {
    if (!window.crypto || !crypto.subtle) {
      $('cryptoOut').textContent = 'Web Crypto API unavailable in this context.';
      return;
    }
    var header = { alg: 'HS256', typ: 'JWT' };
    var payload = {
      sub: 'demo-user',
      fam: state.familyId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (Number($('accessTtl').value) || 900),
      demo: true,
    };
    var enc = new TextEncoder();
    var h = b64url(enc.encode(JSON.stringify(header)));
    var p = b64url(enc.encode(JSON.stringify(payload)));
    var data = h + '.' + p;

    crypto.subtle
      .importKey(
        'raw',
        enc.encode('algo-infinity-demo-secret'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      .then(function (key) {
        return crypto.subtle.sign('HMAC', key, enc.encode(data));
      })
      .then(function (sig) {
        var token = data + '.' + b64url(sig);
        $('cryptoOut').textContent =
          'Fake signed access token (HMAC-SHA256 demo):\n\n' +
          token +
          '\n\nHeader: ' +
          JSON.stringify(header) +
          '\nPayload: ' +
          JSON.stringify(payload, null, 2);
      })
      .catch(function (err) {
        $('cryptoOut').textContent = 'Sign failed: ' + (err && err.message ? err.message : err);
      });
  }

  function buildReport() {
    var p = policy();
    var lines = [
      '# JWT Refresh Rotation Lab Report',
      '',
      '## Policy',
      '- Rotation: ' + (p.rotation ? 'ON' : 'OFF'),
      '- Reuse detection: ' + (p.reuseDetect ? 'ON' : 'OFF'),
      '- Token family: ' + (p.family ? 'ON' : 'OFF'),
      '- Access TTL: ' + p.accessTtl + 's',
      '- Refresh TTL: ' + p.refreshTtl + 's',
      '- Parallel attempts: ' + p.parallelN,
      '- Family ID: ' + state.familyId,
      '',
      '## Results',
      '- Risk score: ' + state.risk,
      '- Races run: ' + state.racesRun,
      '- Reuse detections: ' + state.reuseDetections,
      '- Access tokens minted: ' + state.accessTokens.length,
      '- Family revoked: ' + (state.revoked ? 'yes' : 'no'),
      '',
      '## Last race outcomes',
    ];
    state.lastOutcomes.forEach(function (o) {
      lines.push(
        '- #' + o.attempt + ' ' + o.status + ': ' + o.reason + (o.access ? ' [' + o.access + ']' : '')
      );
    });
    lines.push('');
    lines.push('## Walkthrough log');
    lines.push('```');
    lines.push(state.walkLog.join('\n'));
    lines.push('```');
    lines.push('');
    lines.push('## Hardening checklist');
    lines.push('- Enable refresh rotation');
    lines.push('- Detect reuse and revoke the token family');
    lines.push('- Prefer httpOnly Secure cookies for refresh tokens');
    lines.push('- Short access TTLs; bound refresh lifetime');
    lines.push('- Single-flight refresh on the client to reduce races');
    lines.push('');
    lines.push('_Generated by Algo Infinity Verse — JWT Refresh Rotation Lab_');
    return lines.join('\n');
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function init() {
    $('resetFamilyBtn').addEventListener('click', function () {
      seedFamily();
      state.lastOutcomes = [];
      state.analyzed = false;
      renderOutcomes();
      renderChecklist();
      renderStats();
      $('exportBtn').disabled = true;
    });
    $('runRaceBtn').addEventListener('click', runRace);
    $('exportBtn').addEventListener('click', function () {
      download('jwt-refresh-rotation-report.md', buildReport());
    });
    $('signDemoBtn').addEventListener('click', signDemoToken);
    seedFamily();
    renderChecklist();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
