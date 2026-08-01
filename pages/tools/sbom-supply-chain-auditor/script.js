/**
 * SBOM Supply Chain Auditor
 * Diff baseline vs candidate lock/SBOM JSON with risk heuristics (client-side).
 */
(function () {
  'use strict';

  var DEMO_BASELINE = JSON.stringify(
    {
      name: 'demo-app',
      lockfileVersion: 3,
      packages: {
        '': { name: 'demo-app', version: '1.0.0' },
        'node_modules/lodash': { version: '4.17.21', dependencies: { /* transitive */ } },
        'node_modules/axios': { version: '0.27.2' },
        'node_modules/react': { version: '17.0.2' },
        'node_modules/left-pad': { version: '1.3.0' },
        'node_modules/minimist': { version: '1.2.5' },
        'node_modules/chalk': { version: '4.1.2' }
      }
    },
    null,
    2
  );

  var DEMO_CANDIDATE = JSON.stringify(
    {
      name: 'demo-app',
      lockfileVersion: 3,
      packages: {
        '': { name: 'demo-app', version: '1.1.0' },
        'node_modules/lodash': { version: '4.17.21' },
        'node_modules/axios': { version: '1.6.8' },
        'node_modules/react': { version: '18.2.0' },
        'node_modules/minimist': { version: '1.2.8' },
        'node_modules/chalk': { version: '5.3.0' },
        'node_modules/uuid': { version: '9.0.1' },
        'node_modules/event-stream': { version: '4.0.1' },
        'node_modules/request': { version: '2.88.2' },
        'node_modules/@types/lodash': { version: '4.14.202' }
      },
      components: [
        { name: 'lodash', version: '4.17.21' },
        { name: 'lodash', version: '4.17.20' }
      ]
    },
    null,
    2
  );

  var RISKY_NAMES = {
    'event-stream': 25,
    'request': 15,
    'left-pad': 10,
    'node-ipc': 30,
    'ua-parser-js': 12,
    'colors': 10,
    'faker': 8
  };

  var lastReport = null;

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

  function normalizeName(raw) {
    var n = String(raw || '').trim();
    n = n.replace(/^node_modules\//, '');
    n = n.replace(/\\/g, '/');
    if (n.indexOf('node_modules/') !== -1) {
      n = n.split('node_modules/').pop();
    }
    return n;
  }

  function parsePackages(text) {
    var data = JSON.parse(text);
    var map = {};
    var duplicates = [];
    var seen = {};

    function add(name, version, meta) {
      var key = normalizeName(name);
      if (!key || key === '') return;
      if (seen[key] && seen[key] !== version) {
        duplicates.push({ name: key, versions: [seen[key], version] });
      }
      seen[key] = version;
      map[key] = {
        version: String(version || '0.0.0').replace(/^[=v~^]/, ''),
        meta: meta || {}
      };
    }

    if (data.packages && typeof data.packages === 'object') {
      Object.keys(data.packages).forEach(function (k) {
        if (!k) return;
        var pkg = data.packages[k] || {};
        add(k, pkg.version || pkg.Version, pkg);
      });
    }

    if (Array.isArray(data.components)) {
      data.components.forEach(function (c) {
        if (!c) return;
        add(c.name || c['bom-ref'], c.version, c);
      });
    }

    if (data.dependencies && typeof data.dependencies === 'object' && !Array.isArray(data.dependencies)) {
      Object.keys(data.dependencies).forEach(function (k) {
        var v = data.dependencies[k];
        if (typeof v === 'string') add(k, v);
        else if (v && v.version) add(k, v.version, v);
      });
    }

    // Flat { name: version }
    if (!Object.keys(map).length) {
      Object.keys(data).forEach(function (k) {
        if (typeof data[k] === 'string' && /^\d/.test(data[k])) add(k, data[k]);
      });
    }

    return { map: map, duplicates: duplicates, raw: data };
  }

  function majorOf(version) {
    var m = String(version || '').match(/^(\d+)/);
    return m ? Number(m[1]) : 0;
  }

  function diffPackages(baseMap, candMap) {
    var added = [];
    var removed = [];
    var updated = [];
    var majors = [];

    Object.keys(candMap).forEach(function (name) {
      if (!baseMap[name]) {
        added.push({ name: name, version: candMap[name].version });
      } else if (baseMap[name].version !== candMap[name].version) {
        var from = baseMap[name].version;
        var to = candMap[name].version;
        updated.push({ name: name, from: from, to: to });
        if (majorOf(to) > majorOf(from)) {
          majors.push({ name: name, from: from, to: to });
        }
      }
    });

    Object.keys(baseMap).forEach(function (name) {
      if (!candMap[name]) {
        removed.push({ name: name, version: baseMap[name].version });
      }
    });

    return { added: added, removed: removed, updated: updated, majors: majors };
  }

  function scoreRisk(diff, duplicates) {
    var score = 0;
    score += diff.added.length * 4;
    score += diff.removed.length * 2;
    score += diff.updated.length * 2;
    score += diff.majors.length * 10;
    score += duplicates.length * 8;

    diff.added.forEach(function (p) {
      if (RISKY_NAMES[p.name]) score += RISKY_NAMES[p.name];
      if (p.name.indexOf('@') === 0 && p.name.split('/').length > 2) score += 3;
    });

    // Transitive heuristic: many adds without matching removes ≈ expanding graph
    if (diff.added.length >= 3 && diff.removed.length <= 1) score += 12;

    return Math.min(100, Math.round(score));
  }

  function buildChecklist(diff, risk, duplicates) {
    var items = [];
    items.push({
      title: 'Review new packages',
      detail: 'Validate license, maintainer reputation, and download trends for ' + diff.added.length + ' added package(s).'
    });
    items.push({
      title: 'Major version jumps',
      detail: diff.majors.length
        ? 'Read changelogs / migration guides for: ' + diff.majors.map(function (m) { return m.name; }).join(', ') + '.'
        : 'No major version jumps detected — still skim release notes for updated packages.'
    });
    items.push({
      title: 'Duplicate versions',
      detail: duplicates.length
        ? 'Resolve duplicate component versions to shrink attack surface.'
        : 'No duplicate name/version conflicts found in parsed SBOM.'
    });
    items.push({
      title: 'Transitive risk',
      detail: 'Heuristic risk score is ' + risk + '/100. Prefer lockfile commits that minimize surprise transitive adds.'
    });
    items.push({
      title: 'CI gates',
      detail: 'Ensure SCA (npm audit / OSV / Dependabot) and SBOM attestation run on this candidate before merge.'
    });
    return items;
  }

  function runAudit() {
    var baseText = ($('sbomBaseline').value || '').trim();
    var candText = ($('sbomCandidate').value || '').trim();
    if (!baseText || !candText) {
      $('sbomStatus').textContent = 'Paste both baseline and candidate JSON.';
      return;
    }

    var base;
    var cand;
    try {
      base = parsePackages(baseText);
      cand = parsePackages(candText);
    } catch (e) {
      $('sbomStatus').textContent = 'JSON parse error: ' + (e.message || e);
      return;
    }

    var diff = diffPackages(base.map, cand.map);
    var duplicates = base.duplicates.concat(cand.duplicates);
    var risk = scoreRisk(diff, duplicates);
    var warnings = [];

    diff.majors.forEach(function (m) {
      warnings.push({
        severity: 'high',
        title: 'Major version jump: ' + m.name,
        detail: m.from + ' → ' + m.to
      });
    });

    duplicates.forEach(function (d) {
      warnings.push({
        severity: 'medium',
        title: 'Duplicate package: ' + d.name,
        detail: 'Versions seen: ' + d.versions.join(', ')
      });
    });

    diff.added.forEach(function (p) {
      if (RISKY_NAMES[p.name]) {
        warnings.push({
          severity: 'critical',
          title: 'Elevated-risk package added: ' + p.name,
          detail: 'Historical supply-chain concern heuristic (+' + RISKY_NAMES[p.name] + ' risk). Version ' + p.version + '.'
        });
      }
    });

    if (!warnings.length) {
      warnings.push({
        severity: 'ok',
        title: 'No major or duplicate warnings',
        detail: 'Still review added packages and run automated SCA.'
      });
    }

    var checklist = buildChecklist(diff, risk, duplicates);
    lastReport = {
      generatedAt: new Date().toISOString(),
      risk: risk,
      diff: diff,
      warnings: warnings,
      checklist: checklist,
      duplicates: duplicates
    };

    renderDiff(diff);
    renderWarnings(warnings);
    renderChecklist(checklist, risk);
    updateHero(diff.added.length, diff.updated.length, risk);
    $('sbomDownloadBtn').disabled = false;
    $('sbomStatus').textContent =
      'Diff complete — ' + diff.added.length + ' added, ' +
      diff.removed.length + ' removed, ' + diff.updated.length + ' updated.';
  }

  function updateHero(added, updated, risk) {
    $('statAdded').textContent = added == null ? '—' : String(added);
    $('statUpdated').textContent = updated == null ? '—' : String(updated);
    $('statRisk').textContent = risk == null ? '—' : String(risk);
  }

  function renderDiff(diff) {
    function list(items, kind, fmt) {
      if (!items.length) return '<p class="sbom-empty">None</p>';
      return (
        '<ul class="sbom-diff-list">' +
        items
          .map(function (it) {
            return '<li data-kind="' + kind + '">' + escapeHtml(fmt(it)) + '</li>';
          })
          .join('') +
        '</ul>'
      );
    }

    $('sbomDiff').innerHTML =
      '<div class="sbom-diff-group"><h3>Added (' + diff.added.length + ')</h3>' +
      list(diff.added, 'added', function (p) { return p.name + '@' + p.version; }) +
      '</div>' +
      '<div class="sbom-diff-group"><h3>Removed (' + diff.removed.length + ')</h3>' +
      list(diff.removed, 'removed', function (p) { return p.name + '@' + p.version; }) +
      '</div>' +
      '<div class="sbom-diff-group"><h3>Updated (' + diff.updated.length + ')</h3>' +
      list(diff.updated, 'updated', function (p) { return p.name + ': ' + p.from + ' → ' + p.to; }) +
      '</div>';
  }

  function renderWarnings(warnings) {
    $('sbomWarnings').innerHTML = warnings
      .map(function (w) {
        return (
          '<article class="sbom-finding" data-severity="' + escapeHtml(w.severity) + '">' +
          '<p class="sbom-finding-meta">' + escapeHtml(w.severity) + '</p>' +
          '<h3 class="sbom-finding-title">' + escapeHtml(w.title) + '</h3>' +
          '<p class="sbom-finding-detail">' + escapeHtml(w.detail) + '</p>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderChecklist(items, risk) {
    $('sbomRiskPill').textContent = 'Risk: ' + risk + '/100';
    $('sbomChecklist').innerHTML = items
      .map(function (it) {
        return '<li><strong>' + escapeHtml(it.title) + ':</strong> ' + escapeHtml(it.detail) + '</li>';
      })
      .join('');
  }

  function downloadReport() {
    if (!lastReport) return;
    var r = lastReport;
    var lines = [];
    lines.push('# SBOM Supply Chain Audit Report');
    lines.push('Generated: ' + r.generatedAt);
    lines.push('Transitive risk score: ' + r.risk + '/100');
    lines.push('');
    lines.push('## Added');
    r.diff.added.forEach(function (p) { lines.push('- ' + p.name + '@' + p.version); });
    lines.push('');
    lines.push('## Removed');
    r.diff.removed.forEach(function (p) { lines.push('- ' + p.name + '@' + p.version); });
    lines.push('');
    lines.push('## Updated');
    r.diff.updated.forEach(function (p) { lines.push('- ' + p.name + ': ' + p.from + ' → ' + p.to); });
    lines.push('');
    lines.push('## Warnings');
    r.warnings.forEach(function (w) { lines.push('- [' + w.severity + '] ' + w.title + ': ' + w.detail); });
    lines.push('');
    lines.push('## Reviewer checklist');
    r.checklist.forEach(function (c) { lines.push('- [ ] ' + c.title + ': ' + c.detail); });
    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'sbom-supply-chain-audit.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadDemo() {
    $('sbomBaseline').value = DEMO_BASELINE;
    $('sbomCandidate').value = DEMO_CANDIDATE;
    $('sbomStatus').textContent = 'Loaded demo baseline vs candidate lockfile snippets.';
  }

  function clearAll() {
    $('sbomBaseline').value = '';
    $('sbomCandidate').value = '';
    $('sbomDiff').innerHTML = '<p class="sbom-empty">Added, removed, and updated packages appear here.</p>';
    $('sbomWarnings').innerHTML = '<p class="sbom-empty">Major version jumps and duplicate warnings appear here.</p>';
    $('sbomChecklist').innerHTML = '<li class="sbom-empty-li">Checklist items appear after a successful audit.</li>';
    $('sbomRiskPill').textContent = 'Risk: —';
    $('sbomDownloadBtn').disabled = true;
    lastReport = null;
    updateHero(null, null, null);
    $('sbomStatus').textContent = 'Cleared.';
  }

  function init() {
    $('sbomDemoBtn').addEventListener('click', loadDemo);
    $('sbomAuditBtn').addEventListener('click', runAudit);
    $('sbomClearBtn').addEventListener('click', clearAll);
    $('sbomDownloadBtn').addEventListener('click', downloadReport);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
