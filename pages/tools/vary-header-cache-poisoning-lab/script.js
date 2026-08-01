/**
 * Vary Header Cache Poisoning Lab
 * Content negotiation + Vary gap detector + poisoning outcomes.
 */
(function () {
  'use strict';

  var state = {
    preset: null,
    lastResult: null,
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

  function parseVary(raw) {
    return String(raw || '')
      .split(',')
      .map(function (s) {
        return s.trim().toLowerCase();
      })
      .filter(Boolean);
  }

  function readConfig() {
    return {
      accept: $('vary-accept').value.trim(),
      encoding: $('vary-encoding').value.trim(),
      language: $('vary-language').value.trim(),
      cookie: $('vary-cookie').value.trim(),
      responseVary: $('vary-responseVary').value.trim(),
      cacheKey: $('vary-cacheKey').value,
      depEncoding: $('vary-depEncoding').checked,
      depLanguage: $('vary-depLanguage').checked,
      depAccept: $('vary-depAccept').checked,
      depCookie: $('vary-depCookie').checked,
      preset: state.preset,
    };
  }

  function neededVaryHeaders(cfg) {
    var needed = [];
    if (cfg.depEncoding) needed.push('accept-encoding');
    if (cfg.depLanguage) needed.push('accept-language');
    if (cfg.depAccept) needed.push('accept');
    if (cfg.depCookie) needed.push('cookie');
    return needed;
  }

  function detectGaps(cfg) {
    var vary = parseVary(cfg.responseVary);
    var needed = neededVaryHeaders(cfg);
    var gaps = [];
    var i;

    if (cfg.cacheKey === 'url-only' && needed.length) {
      gaps.push({
        sev: 'high',
        title: 'CDN ignores Vary',
        detail: 'Cache key is URL-only while the body depends on request headers. Cross-user contamination is likely.',
      });
    }

    for (i = 0; i < needed.length; i++) {
      if (vary.indexOf(needed[i]) === -1 && vary.indexOf('*') === -1) {
        gaps.push({
          sev: needed[i] === 'cookie' ? 'high' : 'med',
          title: 'Missing Vary: ' + needed[i],
          detail: 'Response content depends on ' + needed[i] + ' but Vary does not list it.',
        });
      }
    }

    if (vary.indexOf('cookie') !== -1) {
      gaps.push({
        sev: 'med',
        title: 'Vary: Cookie is fragile',
        detail: 'Cookie variance explodes cache cardinality and often leaks personalized HTML. Prefer separate URLs or uncacheable private responses.',
      });
    }

    if (cfg.depCookie && cfg.cacheKey !== 'url-all') {
      gaps.push({
        sev: 'high',
        title: 'Personalized body in shared cache',
        detail: 'Cookie-dependent content should be Cache-Control: private or keyed explicitly — never shared anonymously.',
      });
    }

    if (!gaps.length) {
      gaps.push({
        sev: 'low',
        title: 'Vary looks consistent',
        detail: 'Declared Vary covers declared negotiation dimensions for this scenario.',
      });
    }

    return gaps;
  }

  function simulate(cfg) {
    var log = [];
    var needed = neededVaryHeaders(cfg);
    var vary = parseVary(cfg.responseVary);
    var gaps = detectGaps(cfg);
    var highGaps = gaps.filter(function (g) {
      return g.sev === 'high';
    }).length;
    var medGaps = gaps.filter(function (g) {
      return g.sev === 'med';
    }).length;

    var attackerVariant = 'attacker-payload';
    var victimVariant = 'victim-safe';
    var sharedKey =
      cfg.cacheKey === 'url-only'
        ? 'GET /page'
        : cfg.cacheKey === 'url-vary'
          ? 'GET /page | vary=' + vary.join(';')
          : 'GET /page | full-headers';

    log.push('1. Attacker requests with crafted headers → origin returns ' + attackerVariant);
    log.push('2. Edge stores under key: ' + sharedKey);

    var poisoned = false;
    var reason = '';

    if (cfg.cacheKey === 'url-only' && needed.length) {
      poisoned = true;
      reason = 'URL-only key collapses all variants into one cache object.';
    } else if (cfg.cacheKey === 'url-vary') {
      var missing = needed.filter(function (h) {
        return vary.indexOf(h) === -1 && vary.indexOf('*') === -1;
      });
      if (missing.length) {
        poisoned = true;
        reason = 'Vary omitted ' + missing.join(', ') + ' — victim headers map to the same key as the attacker.';
      } else {
        reason = 'Vary + cache key separate attacker and victim variants.';
      }
    } else {
      reason = 'Full-header keying avoids collapse (at high cardinality cost).';
    }

    log.push(
      poisoned
        ? '3. Victim request hits poisoned object → serves ' + attackerVariant
        : '3. Victim key differs → serves ' + victimVariant
    );
    log.push('4. Outcome: ' + (poisoned ? 'POISONED' : 'SAFE') + ' — ' + reason);

    var risk = Math.min(100, highGaps * 35 + medGaps * 15 + (poisoned ? 25 : 0));
    var verdict = risk >= 70 ? 'Critical' : risk >= 40 ? 'Elevated' : 'Low';

    return {
      cfg: cfg,
      gaps: gaps,
      log: log,
      poisoned: poisoned,
      reason: reason,
      risk: risk,
      verdict: verdict,
      variants: Math.max(1, needed.length + 1),
      gapCount: gaps.filter(function (g) {
        return g.sev !== 'low';
      }).length,
      attackerVariant: attackerVariant,
      victimVariant: victimVariant,
      sharedKey: sharedKey,
    };
  }

  function tipsFor(result) {
    var tips = [
      'List every request header that changes the response body in Vary (Accept-Encoding, Accept-Language, Accept, …).',
      'Prefer Cache-Control: private for personalized / cookie-driven HTML.',
      'Normalize Accept-Encoding at the edge (e.g. always br/gzip) to shrink variant explosion.',
      'Never put unvalidated attacker-controlled headers into the cache key without allowlisting.',
      'Test with two clients (different Accept-Language / Cookie) and assert they never share a poisoned object.',
    ];
    if (result.poisoned) {
      tips.unshift('Immediate: add missing Vary dimensions or switch CDN keying to honor Vary.');
    }
    if (result.cfg.depCookie) {
      tips.unshift('Uncache personalized responses or use a surrogate key that excludes session cookies.');
    }
    return tips;
  }

  function updateStats(result) {
    $('vary-statRisk').textContent = result ? result.risk + '%' : '—';
    $('vary-statGaps').textContent = result ? String(result.gapCount) : '—';
    $('vary-statVariants').textContent = result ? String(result.variants) : '—';
    $('vary-statVerdict').textContent = result ? result.verdict : '—';
  }

  function renderPoison(result) {
    var cls = result.poisoned ? 'is-danger' : 'is-ok';
    var html =
      '<p class="vary-verdict ' +
      cls +
      '">' +
      (result.poisoned ? 'Poisoned shared cache object' : 'Variants isolated') +
      '</p>' +
      '<p><strong>Cache key:</strong> <code>' +
      escapeHtml(result.sharedKey) +
      '</code></p>' +
      '<p><strong>Attacker body:</strong> ' +
      escapeHtml(result.attackerVariant) +
      ' · <strong>Victim body:</strong> ' +
      escapeHtml(result.victimVariant) +
      '</p>' +
      '<p>' +
      escapeHtml(result.reason) +
      '</p>';
    $('vary-poisonOut').innerHTML = html;
    $('vary-eventLog').textContent = result.log.join('\n');
    $('vary-poisonLive').textContent = result.poisoned ? 'Poisoned' : 'Safe';
  }

  function renderGaps(gaps) {
    $('vary-gaps').innerHTML = gaps
      .map(function (g) {
        return (
          '<div class="vary-finding">' +
          '<span class="vary-finding-sev ' +
          escapeHtml(g.sev) +
          '">' +
          escapeHtml(g.sev) +
          '</span>' +
          '<div><strong>' +
          escapeHtml(g.title) +
          '</strong><br />' +
          escapeHtml(g.detail) +
          '</div></div>'
        );
      })
      .join('');
  }

  function renderTips(tips) {
    $('vary-tips').innerHTML = tips
      .map(function (t) {
        return '<li>' + escapeHtml(t) + '</li>';
      })
      .join('');
  }

  function applyResult(result) {
    state.lastResult = result;
    updateStats(result);
    renderPoison(result);
    renderGaps(result.gaps);
    renderTips(tipsFor(result));
    $('vary-exportBtn').disabled = false;
    $('vary-status').textContent =
      'Done — risk ' + result.risk + '% (' + result.verdict + '), ' + result.gapCount + ' actionable gap(s).';
  }

  function applyPreset(name) {
    state.preset = name;
    document.querySelectorAll('.vary-preset-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-preset') === name ? 'true' : 'false');
    });

    if (name === 'encoding') {
      $('vary-accept').value = 'text/html';
      $('vary-encoding').value = 'br';
      $('vary-language').value = 'en';
      $('vary-cookie').value = '';
      $('vary-responseVary').value = '';
      $('vary-cacheKey').value = 'url-only';
      $('vary-depEncoding').checked = true;
      $('vary-depLanguage').checked = false;
      $('vary-depAccept').checked = false;
      $('vary-depCookie').checked = false;
    } else if (name === 'language') {
      $('vary-accept').value = 'text/html';
      $('vary-encoding').value = 'gzip';
      $('vary-language').value = 'fr-FR,fr;q=0.9';
      $('vary-cookie').value = '';
      $('vary-responseVary').value = 'Accept-Encoding';
      $('vary-cacheKey').value = 'url-vary';
      $('vary-depEncoding').checked = true;
      $('vary-depLanguage').checked = true;
      $('vary-depAccept').checked = false;
      $('vary-depCookie').checked = false;
    } else if (name === 'cookie') {
      $('vary-accept').value = 'text/html';
      $('vary-encoding').value = 'gzip';
      $('vary-language').value = 'en';
      $('vary-cookie').value = 'role=admin; session=attacker';
      $('vary-responseVary').value = 'Accept-Encoding';
      $('vary-cacheKey').value = 'url-vary';
      $('vary-depEncoding').checked = true;
      $('vary-depLanguage').checked = false;
      $('vary-depAccept').checked = false;
      $('vary-depCookie').checked = true;
    }
    $('vary-status').textContent = 'Preset "' + name + '" loaded — run negotiation or audit.';
  }

  function exportReport() {
    var r = state.lastResult;
    if (!r) return;
    var lines = [
      '# Vary Header Cache Poisoning Audit',
      'Generated: ' + new Date().toISOString(),
      '',
      '## Summary',
      '- Poison risk: ' + r.risk + '%',
      '- Verdict: ' + r.verdict,
      '- Vary gaps: ' + r.gapCount,
      '- Variants considered: ' + r.variants,
      '- Poisoned: ' + (r.poisoned ? 'yes' : 'no'),
      '',
      '## Config',
      '- Accept: ' + r.cfg.accept,
      '- Accept-Encoding: ' + r.cfg.encoding,
      '- Accept-Language: ' + r.cfg.language,
      '- Cookie: ' + (r.cfg.cookie || '(none)'),
      '- Response Vary: ' + (r.cfg.responseVary || '(empty)'),
      '- Cache key mode: ' + r.cfg.cacheKey,
      '',
      '## Findings',
    ];
    r.gaps.forEach(function (g) {
      lines.push('- [' + g.sev.toUpperCase() + '] ' + g.title + ' — ' + g.detail);
    });
    lines.push('', '## Timeline');
    r.log.forEach(function (l) {
      lines.push('- ' + l);
    });
    lines.push('', '## Safe cache-key tips');
    tipsFor(r).forEach(function (t) {
      lines.push('- ' + t);
    });

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vary-cache-poisoning-audit.md';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function init() {
    document.querySelectorAll('.vary-preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyPreset(btn.getAttribute('data-preset'));
      });
    });

    $('vary-runBtn').addEventListener('click', function () {
      applyResult(simulate(readConfig()));
    });

    $('vary-auditBtn').addEventListener('click', function () {
      applyResult(simulate(readConfig()));
    });

    $('vary-exportBtn').addEventListener('click', exportReport);
    updateStats(null);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
