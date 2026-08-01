/**
 * HTTP/2 Request Smuggling Lab
 * CL.TE / TE.CL ambiguity simulator + H2C / hop-by-hop risk audit (client-side).
 */
(function () {
  'use strict';

  var DEFAULT_PAYLOAD =
    'POST / HTTP/1.1\r\n' +
    'Host: vulnerable.example\r\n' +
    'Content-Length: 13\r\n' +
    'Transfer-Encoding: chunked\r\n' +
    '\r\n' +
    '0\r\n' +
    '\r\n' +
    'SMUGGLED';

  var PRESETS = {
    nginx: {
      proxy: 'te',
      origin: 'cl',
      stripTe: true,
      normalizeHop: true,
      allowH2c: false,
      rejectAbs: true,
      note: 'nginx-style: edge often honors TE; HTTP/1.1 origin may prefer CL when both present.',
    },
    apache: {
      proxy: 'cl',
      origin: 'te',
      stripTe: false,
      normalizeHop: false,
      allowH2c: false,
      rejectAbs: true,
      note: 'Apache-style origin TE preference vs CL-preferring front creates TE.CL desync risk.',
    },
    'cdn-h2': {
      proxy: 'reject',
      origin: 'cl',
      stripTe: true,
      normalizeHop: true,
      allowH2c: false,
      rejectAbs: true,
      note: 'CDN terminates HTTP/2 and rewrites to HTTP/1.1; dual framing on the back-channel is the danger zone.',
    },
    'h2c-open': {
      proxy: 'te',
      origin: 'cl',
      stripTe: false,
      normalizeHop: false,
      allowH2c: true,
      rejectAbs: false,
      note: 'Cleartext H2C upgrade enabled — attacker can speak HTTP/2 past insecure hops.',
    },
  };

  var state = {
    analyzed: false,
    risk: 0,
    ambiguity: 'none',
    findings: [],
    h2cItems: [],
    hopTips: [],
    recs: [],
    proxyView: '',
    originView: '',
    verdict: '',
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

  function radioVal(name) {
    var nodes = document.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked) return nodes[i].value;
    }
    return null;
  }

  function setRadio(name, value) {
    var nodes = document.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].checked = nodes[i].value === value;
    }
  }

  function setStatus(msg, kind) {
    var el = $('h2smug-status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function updateStats() {
    $('h2smug-statRisk').textContent = state.analyzed ? String(state.risk) : '—';
    $('h2smug-statAmbiguity').textContent = state.analyzed ? state.ambiguity : '—';
    $('h2smug-statFindings').textContent = state.analyzed ? String(state.findings.length) : '—';
    var h2cRisk = 'low';
    if (state.analyzed) {
      if ($('h2smug-allowH2c').checked) h2cRisk = 'high';
      else if (state.findings.some(function (f) { return f.id === 'h2c-upgrade'; })) h2cRisk = 'med';
      else h2cRisk = 'ok';
    }
    $('h2smug-statH2c').textContent = state.analyzed ? h2cRisk : '—';
  }

  function applyPreset(key) {
    var p = PRESETS[key];
    if (!p) return;
    setRadio('h2smug-proxyPref', p.proxy);
    setRadio('h2smug-originPref', p.origin);
    $('h2smug-stripTe').checked = !!p.stripTe;
    $('h2smug-normalizeHop').checked = !!p.normalizeHop;
    $('h2smug-allowH2c').checked = !!p.allowH2c;
    $('h2smug-rejectAbs').checked = !!p.rejectAbs;
    setStatus(p.note, 'is-ok');
  }

  function parseFraming(raw) {
    var text = String(raw || '').replace(/\r\n/g, '\n');
    var parts = text.split(/\n\n/);
    var headersBlock = parts[0] || '';
    var body = parts.slice(1).join('\n\n');
    var lines = headersBlock.split('\n');
    var requestLine = lines[0] || '';
    var headers = {};
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i];
      var idx = line.indexOf(':');
      if (idx === -1) continue;
      var name = line.slice(0, idx).trim().toLowerCase();
      var val = line.slice(idx + 1).trim();
      if (!headers[name]) headers[name] = [];
      headers[name].push(val);
    }
    return {
      requestLine: requestLine,
      headers: headers,
      body: body,
      hasCl: !!(headers['content-length'] && headers['content-length'].length),
      hasTe: !!(headers['transfer-encoding'] && headers['transfer-encoding'].length),
      cl: headers['content-length'] ? headers['content-length'][0] : null,
      te: headers['transfer-encoding'] ? headers['transfer-encoding'].join(', ') : null,
    };
  }

  function viewAs(pref, framing, role, stripTe) {
    var lines = [framing.requestLine];
    var keys = Object.keys(framing.headers);
    var dual = framing.hasCl && framing.hasTe;
    var used = 'none';

    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (role === 'proxy' && stripTe && k === 'transfer-encoding') continue;
      if (dual) {
        if (pref === 'cl' && k === 'transfer-encoding') continue;
        if (pref === 'te' && k === 'content-length') continue;
        if (pref === 'reject') {
          return {
            text: role.toUpperCase() + ' REJECTS request: both Content-Length and Transfer-Encoding present.',
            used: 'reject',
            bodyLen: 0,
          };
        }
      }
      framing.headers[k].forEach(function (v) {
        lines.push(k + ': ' + v);
      });
    }

    if (dual) {
      used = pref;
    } else if (framing.hasTe) {
      used = 'te';
    } else if (framing.hasCl) {
      used = 'cl';
    }

    lines.push('');
    var bodySnippet = framing.body;
    var bodyLen = bodySnippet.length;
    if (used === 'cl' && framing.cl != null) {
      var n = parseInt(framing.cl, 10);
      if (!isNaN(n)) {
        bodySnippet = framing.body.slice(0, Math.max(0, n));
        bodyLen = bodySnippet.length;
      }
    } else if (used === 'te') {
      // Educational: treat up to first 0-chunk as end
      var zero = framing.body.search(/(^|\n)0\s*(\n|$)/);
      if (zero >= 0) {
        bodySnippet = framing.body.slice(0, zero) + '0\n';
        bodyLen = bodySnippet.length;
      }
    }

    lines.push(bodySnippet);
    return {
      text: lines.join('\n'),
      used: used,
      bodyLen: bodyLen,
      leftover: framing.body.slice(bodyLen),
    };
  }

  function classifyAmbiguity(proxyPref, originPref, framing, stripTe) {
    if (!(framing.hasCl && framing.hasTe)) return 'none';
    if (proxyPref === 'reject' || originPref === 'reject') return 'blocked';
    var p = proxyPref;
    var o = originPref;
    if (stripTe && p === 'te') {
      // After strip, origin only sees CL
      return p !== 'cl' ? 'CL.TE→stripped' : 'none';
    }
    if (p === 'te' && o === 'cl') return 'CL.TE';
    if (p === 'cl' && o === 'te') return 'TE.CL';
    if (p === o) return 'aligned';
    return 'mixed';
  }

  function runSim() {
    var framing = parseFraming($('h2smug-payload').value);
    var proxyPref = radioVal('h2smug-proxyPref');
    var originPref = radioVal('h2smug-originPref');
    var stripTe = $('h2smug-stripTe').checked;

    var proxyView = viewAs(proxyPref, framing, 'proxy', false);
    var originHeaders = framing;
    if (stripTe) {
      // Simulate stripped TE toward origin
      var cloned = {
        requestLine: framing.requestLine,
        headers: {},
        body: framing.body,
        hasCl: framing.hasCl,
        hasTe: false,
        cl: framing.cl,
        te: null,
      };
      Object.keys(framing.headers).forEach(function (k) {
        if (k === 'transfer-encoding') return;
        cloned.headers[k] = framing.headers[k].slice();
      });
      originHeaders = cloned;
    }
    var originView = viewAs(originPref, originHeaders, 'origin', false);

    state.ambiguity = classifyAmbiguity(proxyPref, originPref, framing, stripTe);
    state.proxyView = proxyView.text;
    state.originView = originView.text;

    $('h2smug-proxyView').textContent = proxyView.text;
    $('h2smug-originView').textContent = originView.text;

    var verdictEl = $('h2smug-verdict');
    verdictEl.classList.remove('is-safe', 'is-danger');
    var msg;
    if (state.ambiguity === 'none' || state.ambiguity === 'aligned' || state.ambiguity === 'blocked') {
      msg =
        state.ambiguity === 'blocked'
          ? 'Safe path: dual CL+TE is rejected at least on one hop — desync unlikely from this vector.'
          : 'No classic CL.TE / TE.CL mismatch for the current preferences (or framing is not dual).';
      verdictEl.classList.add('is-safe');
    } else {
      msg =
        'Ambiguity ' +
        state.ambiguity +
        ': proxy frames with ' +
        proxyView.used.toUpperCase() +
        ' (body ~' +
        proxyView.bodyLen +
        ' B) while origin frames with ' +
        originView.used.toUpperCase() +
        ' (body ~' +
        originView.bodyLen +
        ' B). Leftover bytes can become a smuggled request.';
      verdictEl.classList.add('is-danger');
    }
    state.verdict = msg;
    verdictEl.textContent = msg;
    $('h2smug-simLive').textContent = 'Simulated · ' + state.ambiguity;
    setStatus('Simulator updated (' + state.ambiguity + ').', 'is-ok');
  }

  function buildAudit() {
    var findings = [];
    var h2cItems = [];
    var hopTips = [];
    var recs = [];
    var risk = 0;

    var proxyPref = radioVal('h2smug-proxyPref');
    var originPref = radioVal('h2smug-originPref');
    var stripTe = $('h2smug-stripTe').checked;
    var normalizeHop = $('h2smug-normalizeHop').checked;
    var allowH2c = $('h2smug-allowH2c').checked;
    var rejectAbs = $('h2smug-rejectAbs').checked;
    var framing = parseFraming($('h2smug-payload').value);
    var ambiguity = classifyAmbiguity(proxyPref, originPref, framing, stripTe);

    function add(sev, id, title, detail) {
      findings.push({ severity: sev, id: id, title: title, detail: detail });
      if (sev === 'high') risk += 28;
      else if (sev === 'medium') risk += 16;
      else risk += 6;
    }

    if (ambiguity === 'CL.TE' || ambiguity === 'TE.CL' || ambiguity === 'CL.TE→stripped') {
      add(
        'high',
        'desync',
        ambiguity + ' desync possible',
        'Proxy and origin disagree on request length. Attackers can poison the keep-alive queue with a prefix request.'
      );
    } else if (ambiguity === 'aligned' && framing.hasCl && framing.hasTe) {
      add(
        'medium',
        'dual-headers',
        'Dual CL+TE accepted on both hops',
        'Even aligned preferences are risky — RFC 7230 requires rejecting messages with both CL and TE.'
      );
    }

    if (proxyPref !== 'reject' && originPref !== 'reject' && framing.hasCl && framing.hasTe) {
      add(
        'medium',
        'no-reject',
        'Neither hop rejects dual CL+TE',
        'Harden the front proxy to 400 on conflicting length headers before forwarding.'
      );
    }

    if (!stripTe && proxyPref === 'te' && originPref === 'cl') {
      add(
        'high',
        'te-forward',
        'TE forwarded to CL-preferring origin',
        'Strip or normalize Transfer-Encoding when downgrading HTTP/2 → HTTP/1.1 to the origin.'
      );
    }

    // H2C checklist
    if (allowH2c) {
      h2cItems.push({ cls: 'fail', text: 'H2C upgrade allowed on edge — cleartext HTTP/2 can bypass TLS-only assumptions.' });
      add(
        'high',
        'h2c-upgrade',
        'Cleartext H2C upgrade enabled',
        'Disable h2c on public listeners; only negotiate HTTP/2 over TLS (h2).'
      );
      risk += 10;
    } else {
      h2cItems.push({ cls: 'pass', text: 'H2C upgrade disabled on the configured edge.' });
    }
    h2cItems.push({
      cls: rejectAbs ? 'pass' : 'warn',
      text: rejectAbs
        ? 'Absolute-form request targets rejected on reverse proxy.'
        : 'Absolute-form targets accepted — review for request-line rewriting / cache poisoning.',
    });
    if (!rejectAbs) {
      add(
        'medium',
        'abs-form',
        'Absolute-form targets accepted',
        'Reverse proxies should reject or rewrite absolute-form URIs from clients to prevent target confusion.'
      );
    }
    h2cItems.push({
      cls: 'warn',
      text: 'Confirm Upgrade / Connection: Upgrade, HTTP2-Settings are not blindly forwarded to HTTP/1.1 origins.',
    });
    h2cItems.push({
      cls: 'warn',
      text: 'Ensure internal-only ALPN / prior-knowledge h2 is not reachable from the public internet.',
    });
    h2cItems.push({
      cls: stripTe ? 'pass' : 'fail',
      text: stripTe
        ? 'TE stripped before HTTP/1.1 origin — reduces classic CL.TE.'
        : 'TE may reach origin unchanged — verify origin TE handling.',
    });

    // Hop-by-hop tips
    hopTips.push('Parse Connection and remove every listed hop-by-hop header before forwarding.');
    hopTips.push('Never forward TE, Keep-Alive, Proxy-Connection, Upgrade, or Transfer-Encoding as end-to-end.');
    hopTips.push('When speaking HTTP/2 to clients, map length via DATA frames — do not emit TE: chunked on the H2 side.');
    hopTips.push('Collapse duplicate Content-Length values; reject if they disagree.');
    hopTips.push('Normalize header names (obs-fold, mixed case) before length decisions.');
    if (!normalizeHop) {
      add(
        'high',
        'hop-norm',
        'Hop-by-hop normalization disabled',
        'Without Connection-driven stripping, clients can smuggle hop-by-hop headers to the origin.'
      );
      hopTips.unshift('Enable hop-by-hop normalization — current config leaves Connection-listed headers intact.');
    } else {
      hopTips.unshift('Hop-by-hop normalization is enabled in this scenario — keep it on in production.');
    }

    // Safe reverse-proxy recommendations
    recs.push('Terminate TLS and HTTP/2 at a single trusted reverse proxy; speak HTTP/1.1 or H2 to origin with one framing model.');
    recs.push('Reject any request that includes both Content-Length and Transfer-Encoding (400).');
    recs.push('Disable cleartext h2c; allow only h2 over TLS.');
    recs.push('Use HTTP/2 end-to-end where possible so chunked TE never appears on the back channel.');
    recs.push('Enable request buffering / full message validation before upstream connect (no speculative pipelining).');
    recs.push('Log and alert on dual length headers, malformed chunk sizes, and Upgrade attempts.');
    recs.push('Keep proxy and origin on vendor builds that ship known desync fixes; regression-test with CL.TE / TE.CL fixtures.');

    risk = Math.min(100, risk);
    state.analyzed = true;
    state.risk = risk;
    state.ambiguity = ambiguity;
    state.findings = findings;
    state.h2cItems = h2cItems;
    state.hopTips = hopTips;
    state.recs = recs;
    return state;
  }

  function renderAudit() {
    var findingsEl = $('h2smug-findings');
    if (!state.findings.length) {
      findingsEl.innerHTML = '<p class="h2smug-empty">No critical findings for this configuration.</p>';
    } else {
      findingsEl.innerHTML = state.findings
        .map(function (f) {
          return (
            '<article class="h2smug-finding sev-' +
            escapeHtml(f.severity) +
            '">' +
            '<strong><span class="h2smug-sev">' +
            escapeHtml(f.severity) +
            '</span>' +
            escapeHtml(f.title) +
            '</strong>' +
            '<span>' +
            escapeHtml(f.detail) +
            '</span></article>'
          );
        })
        .join('');
    }

    $('h2smug-h2cList').innerHTML = state.h2cItems
      .map(function (item) {
        return '<li class="' + escapeHtml(item.cls) + '">' + escapeHtml(item.text) + '</li>';
      })
      .join('');

    $('h2smug-hopList').innerHTML = state.hopTips
      .map(function (t) {
        return '<li>' + escapeHtml(t) + '</li>';
      })
      .join('');

    $('h2smug-recs').innerHTML = state.recs
      .map(function (t) {
        return '<li>' + escapeHtml(t) + '</li>';
      })
      .join('');

    $('h2smug-exportBtn').disabled = false;
    updateStats();
  }

  function exportReport() {
    if (!state.analyzed) return;
    var lines = [];
    lines.push('# HTTP/2 Request Smuggling Risk Report');
    lines.push('Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('## Hero stats');
    lines.push('- Risk score: ' + state.risk);
    lines.push('- Ambiguity: ' + state.ambiguity);
    lines.push('- Findings: ' + state.findings.length);
    lines.push('- H2C allowed: ' + ($('h2smug-allowH2c').checked ? 'yes' : 'no'));
    lines.push('');
    lines.push('## Configuration');
    lines.push('- Preset: ' + ($('h2smug-preset').value || 'custom'));
    lines.push('- Proxy preference: ' + radioVal('h2smug-proxyPref'));
    lines.push('- Origin preference: ' + radioVal('h2smug-originPref'));
    lines.push('- Strip TE: ' + $('h2smug-stripTe').checked);
    lines.push('- Normalize hop-by-hop: ' + $('h2smug-normalizeHop').checked);
    lines.push('- Reject absolute-form: ' + $('h2smug-rejectAbs').checked);
    lines.push('');
    lines.push('## Verdict');
    lines.push(state.verdict || '(run simulator)');
    lines.push('');
    lines.push('## Findings');
    if (!state.findings.length) {
      lines.push('- None');
    } else {
      state.findings.forEach(function (f) {
        lines.push('- [' + f.severity.toUpperCase() + '] ' + f.title + ' — ' + f.detail);
      });
    }
    lines.push('');
    lines.push('## H2C checklist');
    state.h2cItems.forEach(function (i) {
      lines.push('- (' + i.cls + ') ' + i.text);
    });
    lines.push('');
    lines.push('## Hop-by-hop tips');
    state.hopTips.forEach(function (t) {
      lines.push('- ' + t);
    });
    lines.push('');
    lines.push('## Safe reverse-proxy recommendations');
    state.recs.forEach(function (t) {
      lines.push('- ' + t);
    });
    lines.push('');
    lines.push('## Disclaimer');
    lines.push('Educational client-side simulation only. Do not probe systems without authorization.');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'http2-smuggling-risk-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Report downloaded.', 'is-ok');
  }

  function bind() {
    $('h2smug-payload').value = DEFAULT_PAYLOAD;

    $('h2smug-preset').addEventListener('change', function () {
      var key = $('h2smug-preset').value;
      if (key !== 'custom') applyPreset(key);
      else setStatus('Custom configuration — adjust quirks manually.');
    });

    $('h2smug-simBtn').addEventListener('click', function () {
      runSim();
      updateStats();
    });

    $('h2smug-auditBtn').addEventListener('click', function () {
      runSim();
      buildAudit();
      renderAudit();
      setStatus('Full risk audit complete. Score ' + state.risk + '/100.', 'is-ok');
    });

    $('h2smug-exportBtn').addEventListener('click', exportReport);

    updateStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
