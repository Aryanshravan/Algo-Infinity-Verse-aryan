(function () {
  'use strict';

  var DEMO_HTML =
    '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">\n' +
    '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha256-HtsXJanqjKTc8vZyQny3YAo7hG1vVa0hIGDgJlOLk=">\n' +
    '  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>\n' +
    '  <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js" integrity="sha384-abcdefghijklmnopqrstuvwxyz0123456789ABCDEF" crossorigin="anonymous"></script>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <script src="/local-app.js"></script>\n' +
    '</body>\n' +
    '</html>';

  var TAG_RE = /<(script|link)\b([^>]*)>/gi;
  var ATTR_RE = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gi;

  var state = {
    tags: [],
    findings: [],
    patched: '',
    risk: 0,
    missing: 0,
    weak: 0
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

  function parseAttrs(attrStr) {
    var attrs = {};
    ATTR_RE.lastIndex = 0;
    var m;
    while ((m = ATTR_RE.exec(attrStr)) !== null) {
      var name = m[1].toLowerCase();
      if (name === '/' || name === '') continue;
      attrs[name] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : '';
    }
    return attrs;
  }

  function isRemoteUrl(url) {
    if (!url) return false;
    if (/^https?:\/\//i.test(url)) return true;
    if (/^\/\//.test(url)) return true;
    return false;
  }

  function isCrossOrigin(url) {
    if (!isRemoteUrl(url)) return false;
    try {
      var abs = url.indexOf('//') === 0 ? 'https:' + url : url;
      var u = new URL(abs, window.location.href);
      return u.origin !== window.location.origin;
    } catch (e) {
      return true;
    }
  }

  function parseIntegrity(value) {
    if (!value) return [];
    return String(value)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(function (token) {
        var parts = token.split('-');
        return { alg: (parts[0] || '').toLowerCase(), raw: token };
      });
  }

  function extractTags(html) {
    var tags = [];
    TAG_RE.lastIndex = 0;
    var m;
    while ((m = TAG_RE.exec(html)) !== null) {
      var tagName = m[1].toLowerCase();
      var attrs = parseAttrs(m[2] || '');
      var url = tagName === 'script' ? attrs.src : attrs.href;
      if (!url) continue;
      if (tagName === 'link' && attrs.rel && String(attrs.rel).toLowerCase().indexOf('stylesheet') === -1) {
        continue;
      }
      tags.push({
        tag: tagName,
        raw: m[0],
        index: m.index,
        url: url,
        attrs: attrs,
        remote: isRemoteUrl(url),
        crossOriginUrl: isCrossOrigin(url),
        integrity: parseIntegrity(attrs.integrity),
        crossorigin: attrs.crossorigin
      });
    }
    return tags;
  }

  function audit(html) {
    var tags = extractTags(html);
    var findings = [];
    var missing = 0;
    var weak = 0;
    var risk = 0;

    tags.forEach(function (t, idx) {
      if (!t.remote) {
        findings.push({
          severity: 'low',
          title: 'Local ' + t.tag + ' (SRI optional)',
          detail: 'Same-origin resource — SRI less critical but still useful for build integrity.',
          snip: t.raw,
          tagIndex: idx
        });
        return;
      }

      if (!t.integrity.length) {
        missing += 1;
        risk += 28;
        findings.push({
          severity: 'high',
          title: 'Missing integrity on CDN ' + t.tag,
          detail: 'Cross-origin ' + t.tag + ' without Subresource Integrity can be silently swapped by a compromised CDN.',
          snip: t.raw,
          tagIndex: idx,
          fix: 'integrity'
        });
      } else {
        var algs = t.integrity.map(function (i) {
          return i.alg;
        });
        var hasStrong = algs.indexOf('sha384') !== -1 || algs.indexOf('sha512') !== -1;
        var onlySha256 = algs.indexOf('sha256') !== -1 && !hasStrong;
        if (onlySha256) {
          weak += 1;
          risk += 12;
          findings.push({
            severity: 'medium',
            title: 'Weak / non-preferred hash (sha256 only)',
            detail: 'Browsers accept sha256, but prefer sha384 or sha512 for CDN integrity pins.',
            snip: t.raw,
            tagIndex: idx,
            fix: 'upgrade-alg'
          });
        }
        var weird = algs.filter(function (a) {
          return a !== 'sha256' && a !== 'sha384' && a !== 'sha512';
        });
        if (weird.length) {
          weak += 1;
          risk += 18;
          findings.push({
            severity: 'high',
            title: 'Unrecognized integrity algorithm',
            detail: 'Found: ' + weird.join(', ') + '. Use sha384 or sha512.',
            snip: t.raw,
            tagIndex: idx
          });
        }
      }

      if (t.crossOriginUrl) {
        var co = (t.crossorigin || '').toLowerCase();
        if (t.integrity.length && !co) {
          risk += 16;
          findings.push({
            severity: 'high',
            title: 'Integrity without crossorigin',
            detail: 'Cross-origin SRI requires crossorigin="anonymous" (or use-credentials) or the check fails.',
            snip: t.raw,
            tagIndex: idx,
            fix: 'crossorigin'
          });
        } else if (!t.integrity.length && !co) {
          findings.push({
            severity: 'medium',
            title: 'Missing crossorigin on CDN tag',
            detail: 'Add crossorigin="anonymous" together with integrity when pinning CDN assets.',
            snip: t.raw,
            tagIndex: idx,
            fix: 'crossorigin'
          });
          risk += 8;
        }
      }
    });

    if (!tags.length) {
      findings.push({
        severity: 'low',
        title: 'No script/link URL tags found',
        detail: 'Paste HTML that includes <script src> or <link rel="stylesheet" href> CDN tags.',
        snip: ''
      });
    }

    risk = Math.min(100, risk);
    return { tags: tags, findings: findings, missing: missing, weak: weak, risk: risk };
  }

  function bytesToBase64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function hashSha384Base64(text) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      return Promise.reject(new Error('Web Crypto SubtleCrypto unavailable'));
    }
    var data = new TextEncoder().encode(text);
    return window.crypto.subtle.digest('SHA-384', data).then(function (buf) {
      return 'sha384-' + bytesToBase64(new Uint8Array(buf));
    });
  }

  /** Fallback demo digest when SubtleCrypto is blocked — not cryptographically real. */
  function fallbackDemoDigest(text, label) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    var hex = (h >>> 0).toString(16).padStart(8, '0');
    return 'sha384-demo' + label + hex + btoa(unescape(encodeURIComponent(text))).slice(0, 40);
  }

  function patchTag(raw, integrityValue) {
    var out = raw;
    if (/\bintegrity\s*=/i.test(out)) {
      out = out.replace(/\bintegrity\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, 'integrity="' + integrityValue + '"');
    } else {
      out = out.replace(/>$/, ' integrity="' + integrityValue + '">');
    }
    if (!/\bcrossorigin\s*=/i.test(out)) {
      out = out.replace(/>$/, ' crossorigin="anonymous">');
    }
    return out;
  }

  function generatePatches(html, tags) {
    var patched = html;
    var replacements = [];

    return Promise.all(
      tags.map(function (t, idx) {
        if (!t.remote) {
          return Promise.resolve(null);
        }
        var sample = '/* pinned sample for ' + t.url + ' idx=' + idx + ' */\n';
        return hashSha384Base64(sample)
          .catch(function () {
            return fallbackDemoDigest(sample, String(idx));
          })
          .then(function (digest) {
            var next = patchTag(t.raw, digest);
            replacements.push({ from: t.raw, to: next });
            return null;
          });
      })
    ).then(function () {
      replacements.forEach(function (r) {
        patched = patched.split(r.from).join(r.to);
      });
      return patched;
    });
  }

  function buildDiff(before, after) {
    var a = before.split(/\r?\n/);
    var b = after.split(/\r?\n/);
    var max = Math.max(a.length, b.length);
    var lines = [];
    for (var i = 0; i < max; i++) {
      var L = a[i];
      var R = b[i];
      if (L === R) {
        if (L !== undefined) lines.push('  ' + L);
      } else {
        if (L !== undefined) lines.push('- ' + L);
        if (R !== undefined) lines.push('+ ' + R);
      }
    }
    return lines
      .map(function (line) {
        if (line.indexOf('+ ') === 0) {
          return '<span class="sri-add">' + escapeHtml(line) + '</span>';
        }
        if (line.indexOf('- ') === 0) {
          return '<span class="sri-del">' + escapeHtml(line) + '</span>';
        }
        return escapeHtml(line);
      })
      .join('\n');
  }

  function updateStats() {
    $('statTags').textContent = String(state.tags.length);
    $('statMissing').textContent = String(state.missing);
    $('statWeak').textContent = String(state.weak);
    $('statRisk').textContent = String(state.risk);
  }

  function renderFindings() {
    var wrap = $('sriFindings');
    if (!state.findings.length) {
      wrap.innerHTML = '<p class="sri-empty">No findings.</p>';
      return;
    }
    wrap.innerHTML = state.findings
      .map(function (f) {
        return (
          '<article class="sri-finding">' +
          '<div class="sri-finding-head">' +
          '<span class="sri-sev sri-sev-' +
          f.severity +
          '">' +
          f.severity +
          '</span>' +
          '<span class="sri-finding-title">' +
          escapeHtml(f.title) +
          '</span>' +
          '</div>' +
          '<p class="sri-finding-detail">' +
          escapeHtml(f.detail) +
          '</p>' +
          (f.snip
            ? '<pre class="sri-finding-snip">' + escapeHtml(f.snip) + '</pre>'
            : '') +
          '</article>'
        );
      })
      .join('');
  }

  function buildReport() {
    var lines = [];
    lines.push('# SRI CDN Integrity Security Report');
    lines.push('');
    lines.push('Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('## Summary');
    lines.push('- CDN / URL tags: ' + state.tags.length);
    lines.push('- Missing SRI: ' + state.missing);
    lines.push('- Weak algorithm: ' + state.weak);
    lines.push('- Risk score: ' + state.risk + '/100');
    lines.push('');
    lines.push('## Findings');
    state.findings.forEach(function (f, i) {
      lines.push((i + 1) + '. [' + f.severity + '] ' + f.title);
      lines.push('   ' + f.detail);
      if (f.snip) lines.push('   `' + f.snip + '`');
    });
    lines.push('');
    lines.push('## Patched HTML');
    lines.push('```html');
    lines.push(state.patched || '(generate patches first)');
    lines.push('```');
    lines.push('');
    lines.push('## Recommendations');
    lines.push('- Prefer sha384 or sha512 integrity digests for CDN assets.');
    lines.push('- Always pair cross-origin integrity with crossorigin="anonymous".');
    lines.push('- Pin exact file versions; regenerate hashes on upgrades.');
    lines.push('- Monitor CDN compromise scenarios with SRI failure alerts.');
    return lines.join('\n');
  }

  function downloadReport() {
    var blob = new Blob([buildReport()], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'sri-cdn-integrity-report.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  function runAudit() {
    var html = $('sriInput').value || '';
    var result = audit(html);
    state.tags = result.tags;
    state.findings = result.findings;
    state.missing = result.missing;
    state.weak = result.weak;
    state.risk = result.risk;
    state.patched = '';
    renderFindings();
    updateStats();
    $('sriPatched').textContent = '—';
    $('sriDiff').textContent = '—';
    $('sriPatchBtn').disabled = !state.tags.some(function (t) {
      return t.remote;
    });
    $('sriExportBtn').disabled = false;
    $('sriStatus').textContent =
      'Audit complete — ' +
      state.tags.length +
      ' tag(s), risk ' +
      state.risk +
      '/100.';
  }

  function runPatches() {
    var html = $('sriInput').value || '';
    $('sriStatus').textContent = 'Generating integrity patches…';
    generatePatches(html, state.tags).then(function (patched) {
      state.patched = patched;
      $('sriPatched').textContent = patched;
      $('sriDiff').innerHTML = buildDiff(html, patched);
      $('sriStatus').textContent = 'Patches generated (demo SHA-384 digests from sample pins).';
      $('sriExportBtn').disabled = false;
    });
  }

  function runSwapSim() {
    var expected = $('sriSampleContent').value || '';
    var tampered = $('sriTamperedContent').value || '';
    var box = $('sriSwapResult');
    box.innerHTML = '<p class="sri-empty">Hashing with Web Crypto…</p>';

    Promise.all([
      hashSha384Base64(expected).catch(function () {
        return fallbackDemoDigest(expected, 'E');
      }),
      hashSha384Base64(tampered).catch(function () {
        return fallbackDemoDigest(tampered, 'T');
      })
    ]).then(function (digests) {
      var d1 = digests[0];
      var d2 = digests[1];
      var mismatch = d1 !== d2;
      box.className = 'sri-swap-result ' + (mismatch ? 'is-mismatch' : 'is-match');
      box.innerHTML =
        '<p><strong>' +
        (mismatch
          ? 'Hash mismatch — browser would block the swapped CDN file.'
          : 'Hashes match — payloads are identical.') +
        '</strong></p>' +
        '<p>Expected integrity</p><code class="sri-hash">' +
        escapeHtml(d1) +
        '</code>' +
        '<p>Tampered integrity</p><code class="sri-hash">' +
        escapeHtml(d2) +
        '</code>' +
        '<p class="sri-hint">With SRI present, a CDN content-swap fails closed instead of executing attacker bytes.</p>';
    });
  }

  function init() {
    $('sriLoadDemoBtn').addEventListener('click', function () {
      $('sriInput').value = DEMO_HTML;
      $('sriStatus').textContent = 'Demo HTML without proper SRI loaded.';
    });
    $('sriAuditBtn').addEventListener('click', runAudit);
    $('sriPatchBtn').addEventListener('click', runPatches);
    $('sriExportBtn').addEventListener('click', downloadReport);
    $('sriSimulateBtn').addEventListener('click', runSwapSim);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
