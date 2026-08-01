/**
 * CSP Bypass Auditor
 * Parse CSP headers, flag unsafe directives, suggest hardened policy + diff.
 */
(function () {
  'use strict';

  var WEAK_SAMPLE =
    "default-src *; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src * 'unsafe-inline'; img-src * data:; font-src *; connect-src *; frame-ancestors *; object-src *";

  var state = {
    analyzed: false,
    risk: 0,
    unsafeCount: 0,
    bypassCount: 0,
    directives: {},
    findings: [],
    bypasses: [],
    hardened: '',
    original: '',
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

  function parseCsp(raw) {
    var map = {};
    String(raw || '')
      .replace(/\n/g, ' ')
      .split(';')
      .forEach(function (part) {
        part = part.trim();
        if (!part) return;
        var bits = part.split(/\s+/);
        var name = bits.shift().toLowerCase();
        if (!name) return;
        map[name] = bits;
      });
    return map;
  }

  function hasToken(values, token) {
    return (values || []).some(function (v) {
      return v.toLowerCase() === token.toLowerCase();
    });
  }

  function hasWildcard(values) {
    return (values || []).some(function (v) {
      return v === '*' || /^https?:$/.test(v) || v === 'http:' || v === 'https:';
    });
  }

  function audit(raw) {
    var directives = parseCsp(raw);
    var findings = [];
    var bypasses = [];
    var unsafeCount = 0;

    function flag(sev, title, detail, bypass) {
      findings.push({ severity: sev, title: title, detail: detail });
      if (bypass) {
        bypasses.push(bypass);
      }
      if (sev === 'high' || sev === 'medium') unsafeCount += 1;
    }

    var scriptSrc = directives['script-src'] || directives['default-src'] || [];
    var styleSrc = directives['style-src'] || directives['default-src'] || [];
    var objectSrc = directives['object-src'];
    var baseUri = directives['base-uri'];
    var formAction = directives['form-action'];
    var defaultSrc = directives['default-src'];
    var frameAncestors = directives['frame-ancestors'];

    if (!Object.keys(directives).length) {
      flag('high', 'Empty or unparsable CSP', 'No directives were detected.', 'No CSP → full XSS freedom');
    }

    if (hasToken(scriptSrc, "'unsafe-inline'")) {
      flag(
        'high',
        "script-src allows 'unsafe-inline'",
        'Inline scripts and many XSS gadgets bypass CSP when unsafe-inline is present (unless nonces/hashes only).',
        'Inject <script>alert(1)</script> or inline event handlers if HTML sink exists'
      );
      unsafeCount += 1;
    }

    if (hasToken(scriptSrc, "'unsafe-eval'")) {
      flag(
        'high',
        "script-src allows 'unsafe-eval'",
        'eval, new Function, and some templating engines can execute attacker strings.',
        'Abuse eval/Function via existing library sinks'
      );
    }

    if (hasToken(styleSrc, "'unsafe-inline'")) {
      flag(
        'medium',
        "style-src allows 'unsafe-inline'",
        'Inline styles enable data exfiltration via CSS injection in some contexts.',
        'CSS injection / attribute exfiltration'
      );
    }

    if (hasWildcard(scriptSrc) || hasToken(scriptSrc, '*')) {
      flag(
        'high',
        'script-src uses broad wildcards',
        'Wildcard or scheme sources (https:) allow scripts from vast origins.',
        'Host attacker JS on any allowed CDN/origin and XSS via script src'
      );
    }

    if (hasWildcard(defaultSrc) || hasToken(defaultSrc, '*')) {
      flag(
        'high',
        'default-src is overly permissive (* / https:)',
        'A loose default-src widens every unspecified fetch directive.',
        'Load untrusted resources falling back to default-src'
      );
    }

    if (!objectSrc || hasToken(objectSrc, '*') || hasWildcard(objectSrc)) {
      flag(
        'high',
        'object-src missing or permissive',
        "Set object-src 'none' to block plugins/Flash-style vectors.",
        'Embed plugin/object payloads if object-src not locked down'
      );
    }

    if (!baseUri) {
      flag(
        'medium',
        'Missing base-uri',
        "Without base-uri 'self'/'none', attackers can inject <base> to hijack relative URLs.",
        '<base href="https://evil.example/"> relative navigation/script hijack'
      );
    }

    if (!formAction) {
      flag(
        'medium',
        'Missing form-action',
        "Without form-action, forms may post credentials to attacker origins.",
        'Inject form with action=https://evil.example/steal'
      );
    }

    if (!frameAncestors) {
      flag(
        'low',
        'Missing frame-ancestors',
        'Clickjacking risk — prefer frame-ancestors \'none\' or \'self\' (or X-Frame-Options).',
        'Framing the app for UI redress'
      );
    }

    if (hasToken(directives['script-src'] || [], 'data:')) {
      flag(
        'high',
        'script-src allows data:',
        'data: script URLs are a classic CSP bypass.',
        '<script src="data:text/javascript,…">'
      );
    }

    // Build hardened CSP
    var hardenedParts = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ];

    // Preserve some safe hosts if present
    ['script-src', 'style-src', 'img-src', 'font-src', 'connect-src'].forEach(function (dir) {
      var vals = directives[dir] || [];
      var keep = vals.filter(function (v) {
        var lower = v.toLowerCase();
        if (lower === '*' || lower === 'https:' || lower === 'http:') return false;
        if (lower === "'unsafe-inline'" || lower === "'unsafe-eval'") return false;
        if (lower === 'data:' && dir === 'script-src') return false;
        if (lower.indexOf('http') === 0 || lower.charAt(0) === "'") return true;
        return /^[a-z0-9.-]+\.[a-z]{2,}/i.test(v);
      });
      if (keep.length && dir !== 'default-src') {
        var idx = hardenedParts.findIndex(function (p) {
          return p.indexOf(dir) === 0;
        });
        if (idx >= 0) {
          hardenedParts[idx] = dir + " 'self' " + keep.join(' ');
        }
      }
    });

    var hardened = hardenedParts.join('; ');
    var risk = Math.min(
      100,
      findings.filter(function (f) {
        return f.severity === 'high';
      }).length *
        18 +
        findings.filter(function (f) {
          return f.severity === 'medium';
        }).length *
          10 +
        findings.filter(function (f) {
          return f.severity === 'low';
        }).length *
          4
    );

    state.analyzed = true;
    state.directives = directives;
    state.findings = findings;
    state.bypasses = bypasses;
    state.unsafeCount = unsafeCount;
    state.bypassCount = bypasses.length;
    state.risk = risk;
    state.hardened = hardened;
    state.original = String(raw || '').trim();
  }

  function buildDiff(before, after) {
    var beforeDirs = parseCsp(before);
    var afterDirs = parseCsp(after);
    var lines = [];
    var names = {};
    Object.keys(beforeDirs).forEach(function (k) {
      names[k] = true;
    });
    Object.keys(afterDirs).forEach(function (k) {
      names[k] = true;
    });
    Object.keys(names)
      .sort()
      .forEach(function (name) {
        var b = (beforeDirs[name] || []).join(' ');
        var a = (afterDirs[name] || []).join(' ');
        if (!beforeDirs[name]) {
          lines.push('+ ' + name + ' ' + a);
        } else if (!afterDirs[name]) {
          lines.push('- ' + name + ' ' + b);
        } else if (b !== a) {
          lines.push('- ' + name + ' ' + b);
          lines.push('+ ' + name + ' ' + a);
        } else {
          lines.push('  ' + name + ' ' + a);
        }
      });
    return lines.join('\n');
  }

  function isDirectiveUnsafe(name, values) {
    if (hasToken(values, "'unsafe-inline'") || hasToken(values, "'unsafe-eval'")) return true;
    if (hasWildcard(values) || hasToken(values, '*')) return true;
    if (name === 'script-src' && hasToken(values, 'data:')) return true;
    if (name === 'object-src' && (!values.length || hasToken(values, '*'))) return true;
    return false;
  }

  function render() {
    $('statRisk').textContent = String(state.risk);
    $('statUnsafe').textContent = String(state.unsafeCount);
    $('statBypass').textContent = String(state.bypassCount);
    $('auditStatus').textContent =
      state.findings.length + ' finding(s) · risk ' + state.risk;
    $('exportBtn').disabled = !state.analyzed;

    var dirEl = $('directivesList');
    var keys = Object.keys(state.directives);
    if (!keys.length) {
      dirEl.innerHTML = '<p class="csp-empty">No directives parsed.</p>';
    } else {
      dirEl.innerHTML = keys
        .map(function (name) {
          var vals = state.directives[name];
          var unsafe = isDirectiveUnsafe(name, vals);
          return (
            '<div class="csp-directive ' +
            (unsafe ? 'is-unsafe' : 'is-ok') +
            '">' +
            '<span class="dir-name">' +
            escapeHtml(name) +
            (unsafe ? ' · flagged' : '') +
            '</span>' +
            escapeHtml(vals.join(' ') || '(empty)') +
            '</div>'
          );
        })
        .join('');
    }

    var findEl = $('findingsList');
    if (!state.findings.length) {
      findEl.innerHTML = '<p class="csp-empty">No issues — policy looks tight (heuristic).</p>';
    } else {
      findEl.innerHTML = state.findings
        .map(function (f) {
          return (
            '<article class="csp-finding sev-' +
            escapeHtml(f.severity) +
            '"><strong>[' +
            escapeHtml(f.severity) +
            '] ' +
            escapeHtml(f.title) +
            '</strong><br />' +
            escapeHtml(f.detail) +
            '</article>'
          );
        })
        .join('');
    }

    $('bypassList').innerHTML = state.bypasses
      .map(function (b, i) {
        return '<li><strong>Vector ' + (i + 1) + ':</strong> ' + escapeHtml(b) + '</li>';
      })
      .join('');

    $('hardenedOut').textContent = state.hardened || '—';
    var diffText = buildDiff(state.original, state.hardened);
    $('diffOut').innerHTML = diffText
      .split('\n')
      .map(function (line) {
        var cls = '';
        if (line.charAt(0) === '+') cls = 'diff-add';
        if (line.charAt(0) === '-') cls = 'diff-del';
        return '<span class="' + cls + '">' + escapeHtml(line) + '</span>';
      })
      .join('\n');
  }

  function buildReport() {
    var lines = [
      '# CSP Bypass Security Report',
      '',
      '## Summary',
      '- Risk score: ' + state.risk,
      '- Unsafe / notable directives flagged: ' + state.unsafeCount,
      '- Simulated bypass vectors: ' + state.bypassCount,
      '',
      '## Original CSP',
      '```',
      state.original,
      '```',
      '',
      '## Findings',
    ];
    state.findings.forEach(function (f, i) {
      lines.push((i + 1) + '. [' + f.severity + '] ' + f.title);
      lines.push('   ' + f.detail);
    });
    lines.push('');
    lines.push('## Bypass checklist');
    state.bypasses.forEach(function (b, i) {
      lines.push((i + 1) + '. ' + b);
    });
    lines.push('');
    lines.push('## Hardened CSP');
    lines.push('```');
    lines.push(state.hardened);
    lines.push('```');
    lines.push('');
    lines.push('## Diff');
    lines.push('```');
    lines.push(buildDiff(state.original, state.hardened));
    lines.push('```');
    lines.push('');
    lines.push('_Generated by Algo Infinity Verse — CSP Bypass Auditor_');
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
    $('loadSampleBtn').addEventListener('click', function () {
      $('cspInput').value = WEAK_SAMPLE;
      $('auditStatus').textContent = 'Weak sample loaded';
    });
    $('auditBtn').addEventListener('click', function () {
      var raw = ($('cspInput').value || '').trim();
      if (!raw) {
        $('auditStatus').textContent = 'Paste a CSP first';
        return;
      }
      audit(raw);
      render();
    });
    $('exportBtn').addEventListener('click', function () {
      download('csp-bypass-security-report.md', buildReport());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
