/**
 * Service Worker Cache Auditor
 * Strategy/route simulator with poison/stale/collision/integrity checks.
 */
(function () {
  'use strict';

  var state = {
    analyzed: false,
    risk: 0,
    collisions: 0,
    stalePoison: 0,
    integrityGaps: 0,
    findings: [],
    recs: [],
    simLog: [],
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

  function parseRules(text, defaultStrategy) {
    var rules = [];
    String(text || '')
      .split(/\r?\n/)
      .forEach(function (line) {
        line = line.trim();
        if (!line || line.charAt(0) === '#') return;
        var parts = line.split('|');
        var pattern = (parts[0] || '').trim();
        var strategy = ((parts[1] || defaultStrategy) || 'network-first').trim();
        if (pattern) {
          rules.push({ pattern: pattern, strategy: strategy });
        }
      });
    return rules;
  }

  function matchRule(url, rules, fallback) {
    for (var i = 0; i < rules.length; i++) {
      var pat = rules[i].pattern.replace(/\*/g, '.*');
      try {
        if (new RegExp('^' + pat + '$').test(url) || url.indexOf(rules[i].pattern.replace(/\*$/, '')) === 0) {
          return rules[i];
        }
      } catch (e) {
        if (url.indexOf(rules[i].pattern.replace('*', '')) !== -1) return rules[i];
      }
    }
    return { pattern: '*', strategy: fallback };
  }

  function simulateFetch(url, strategy, opts) {
    var lines = [];
    var result = { url: url, strategy: strategy, source: 'network', poisoned: false, stale: false };

    if (strategy === 'cache-first') {
      lines.push('[' + strategy + '] ' + url + ' → check Cache Storage');
      if (opts.poison && /app\.js|assets/.test(url)) {
        result.source = 'cache';
        result.poisoned = true;
        lines.push('  HIT (poisoned payload served from cache — network never consulted)');
      } else if (opts.stale && /index\.html|app\.js/.test(url)) {
        result.source = 'cache';
        result.stale = true;
        lines.push('  HIT stale shell (pre-deploy version) — network skipped');
      } else {
        result.source = 'cache';
        lines.push('  HIT cache (assumed healthy)');
      }
    } else if (strategy === 'network-first') {
      lines.push('[' + strategy + '] ' + url + ' → try network');
      if (opts.offline) {
        result.source = 'cache';
        result.stale = opts.stale;
        lines.push('  Network fail → fallback cache' + (opts.stale ? ' (may be stale)' : ''));
      } else {
        result.source = 'network';
        lines.push('  Network OK → update cache with fresh response');
      }
    } else {
      // stale-while-revalidate
      lines.push('[' + strategy + '] ' + url + ' → return cache immediately, revalidate in background');
      result.source = 'cache+revalidate';
      if (opts.stale) {
        result.stale = true;
        lines.push('  Served stale while revalidate pending (race window for mixed versions)');
      } else if (opts.poison) {
        result.poisoned = true;
        lines.push('  Cache HIT poisoned asset; revalidate may fix later — users briefly exposed');
      } else {
        lines.push('  Cache HIT + background fetch scheduled');
      }
    }

    return { result: result, lines: lines };
  }

  function runAudit() {
    var version = ($('cacheVersion').value || 'v1').trim();
    var defaultStrategy = $('defaultStrategy').value;
    var rules = parseRules($('routeRules').value, defaultStrategy);
    var poison = $('togglePoison').checked;
    var stale = $('toggleStale').checked;
    var noIntegrity = $('toggleNoIntegrity').checked;
    var forceCollision = $('toggleCollision').checked;

    var findings = [];
    var recs = [];
    var simLog = [];
    var collisions = 0;
    var stalePoison = 0;
    var integrityGaps = 0;

    simLog.push('Cache name: app-shell-' + version);
    simLog.push('Rules loaded: ' + rules.length);
    simLog.push('');

    var sampleUrls = ['/index.html', '/app.js', '/assets/logo.png', '/api/user', '/assets/main.css'];
    var cacheKeys = {};

    sampleUrls.forEach(function (url) {
      var rule = matchRule(url, rules, defaultStrategy);
      var sim = simulateFetch(url, rule.strategy, {
        poison: poison,
        stale: stale,
        offline: false,
      });
      simLog = simLog.concat(sim.lines);

      var key = url;
      var versionedKey = version + ':' + url;
      if (forceCollision || cacheKeys[key]) {
        collisions += 1;
        findings.push({
          severity: 'high',
          title: 'Cache key collision risk for ' + url,
          detail:
            'Unversioned key "' +
            key +
            '" may collide across deploys. Prefer "' +
            versionedKey +
            '" or hashed asset URLs.',
        });
      }
      cacheKeys[key] = true;
      cacheKeys[versionedKey] = true;

      if (sim.result.poisoned || sim.result.stale) {
        stalePoison += 1;
        findings.push({
          severity: sim.result.poisoned ? 'high' : 'medium',
          title: (sim.result.poisoned ? 'Poisoned' : 'Stale') + ' asset via ' + rule.strategy + ': ' + url,
          detail:
            'Strategy "' +
            rule.strategy +
            '" served ' +
            (sim.result.poisoned ? 'tampered' : 'outdated') +
            ' content from cache. Offline packs amplify blast radius.',
        });
      }

      if (rule.strategy === 'cache-first' && /api\//.test(url)) {
        findings.push({
          severity: 'high',
          title: 'cache-first on API route ' + url,
          detail: 'API responses should usually be network-first or network-only to avoid serving stale auth/user data.',
        });
      }
    });

    // Offline pack simulation
    simLog.push('');
    simLog.push('--- Offline pack replay ---');
    sampleUrls.slice(0, 3).forEach(function (url) {
      var rule = matchRule(url, rules, defaultStrategy);
      var sim = simulateFetch(url, rule.strategy, {
        poison: poison,
        stale: stale,
        offline: true,
      });
      simLog = simLog.concat(sim.lines);
      if (sim.result.stale || sim.result.poisoned) stalePoison += 1;
    });

    if (version === 'v1' || !/^v?\d+/.test(version)) {
      findings.push({
        severity: 'low',
        title: 'Weak or static cache version "' + version + '"',
        detail: 'Bump cache version (or use content hashes) on every deploy and delete old caches in activate.',
      });
    }

    if (noIntegrity) {
      integrityGaps = sampleUrls.filter(function (u) {
        return /\.(js|css)$/.test(u) || u === '/app.js';
      }).length;
      findings.push({
        severity: 'high',
        title: 'Missing Subresource Integrity for static assets',
        detail:
          'Without SRI (or hash-named files), a poisoned CDN/cache entry can execute arbitrary JS/CSS under your origin.',
      });
      recs.push(
        'Add <code>integrity="sha384-…"</code> on critical script/link tags, or ship content-hashed filenames.'
      );
      recs.push('Verify integrity inside the service worker before <code>cache.put</code> for precached shells.');
    } else {
      recs.push('Keep SRI or hashed URLs enabled for all executable static assets.');
    }

    if (poison) {
      recs.push('On poison detection, call <code>caches.delete</code> for the active version and force clients to claim a clean SW.');
    }
    if (stale) {
      recs.push(
        'Use <code>skipWaiting</code> + <code>clients.claim</code> carefully; prefer versioned precache manifests (Workbox injectManifest).'
      );
    }
    recs.push('Prefer network-first for HTML navigation requests to reduce sticky stale shells.');
    recs.push('Namespace Cache Storage keys with build ID: <code>' + version + ':url</code>.');

    var risk = Math.min(
      100,
      collisions * 15 +
        stalePoison * 12 +
        integrityGaps * 10 +
        (poison ? 20 : 0) +
        (stale && defaultStrategy === 'cache-first' ? 15 : 0) +
        findings.filter(function (f) {
          return f.severity === 'high';
        }).length *
          5
    );

    state.analyzed = true;
    state.risk = risk;
    state.collisions = collisions;
    state.stalePoison = stalePoison;
    state.integrityGaps = integrityGaps;
    state.findings = findings;
    state.recs = recs;
    state.simLog = simLog;

    render();
  }

  function render() {
    $('statRisk').textContent = String(state.risk);
    $('statCollisions').textContent = String(state.collisions);
    $('statStale').textContent = String(state.stalePoison);
    $('statIntegrity').textContent = String(state.integrityGaps);
    $('auditStatus').textContent = 'Risk ' + state.risk + ' · ' + state.findings.length + ' findings';
    $('exportBtn').disabled = !state.analyzed;

    var list = $('findingsList');
    if (!state.findings.length) {
      list.innerHTML = '<p class="swc-empty">No issues flagged for this configuration.</p>';
    } else {
      list.innerHTML = state.findings
        .map(function (f) {
          return (
            '<article class="swc-finding sev-' +
            escapeHtml(f.severity) +
            '"><strong>[' +
            escapeHtml(f.severity) +
            '] ' +
            escapeHtml(f.title) +
            '</strong>' +
            escapeHtml(f.detail) +
            '</article>'
          );
        })
        .join('');
    }

    $('simLog').textContent = state.simLog.join('\n');
    $('integrityList').innerHTML = state.recs
      .map(function (r) {
        return '<li>' + r + '</li>';
      })
      .join('');
  }

  function buildReport() {
    var lines = [
      '# Service Worker Cache Audit Report',
      '',
      '## Summary',
      '- Offline pack risk score: ' + state.risk,
      '- Key collisions: ' + state.collisions,
      '- Stale / poison hits: ' + state.stalePoison,
      '- Integrity gaps: ' + state.integrityGaps,
      '- Cache version: ' + ($('cacheVersion').value || 'v1'),
      '- Default strategy: ' + $('defaultStrategy').value,
      '',
      '## Findings',
    ];
    state.findings.forEach(function (f, i) {
      lines.push((i + 1) + '. [' + f.severity + '] ' + f.title);
      lines.push('   ' + f.detail);
    });
    lines.push('');
    lines.push('## Simulation log');
    lines.push('```');
    lines.push(state.simLog.join('\n'));
    lines.push('```');
    lines.push('');
    lines.push('## Integrity / versioning recommendations');
    state.recs.forEach(function (r) {
      lines.push('- ' + r.replace(/<[^>]+>/g, ''));
    });
    lines.push('');
    lines.push('_Generated by Algo Infinity Verse — Service Worker Cache Auditor_');
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
    $('auditBtn').addEventListener('click', runAudit);
    $('exportBtn').addEventListener('click', function () {
      download('sw-cache-audit-report.md', buildReport());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
