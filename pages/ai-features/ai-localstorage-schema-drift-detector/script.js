(function () {
  'use strict';

  var lastReport = null;

  var RENAME_HINTS = [
    ['completed', 'doneIds'],
    ['scores', 'scoreMap'],
    ['version', 'schemaVersion'],
    ['streak', 'dayStreak'],
    ['lastVisit', 'lastActiveAt'],
    ['problemsSolved', 'solvedCount'],
    ['bookmarks', 'savedIds']
  ];

  var PRESETS = {
    renamed: {
      baseline: {
        version: 1,
        userId: 'u-42',
        completed: ['two-sum', 'valid-parens'],
        scores: { 'two-sum': 100, 'valid-parens': 85 },
        streak: 3,
        lastVisit: '2026-02-01T10:00:00Z'
      },
      current: {
        schemaVersion: 2,
        userId: 'u-42',
        doneIds: ['two-sum', 'valid-parens'],
        scoreMap: { 'two-sum': 100, 'valid-parens': 85 },
        dayStreak: 3,
        lastActiveAt: '2026-02-01T10:00:00Z'
      }
    },
    types: {
      baseline: {
        version: 1,
        completed: ['bfs'],
        scores: { bfs: 90 },
        premium: false,
        meta: { level: 2 }
      },
      current: {
        version: 1,
        completed: { bfs: true },
        scores: [['bfs', 90]],
        premium: 'trial',
        meta: { level: '2' }
      }
    },
    removed: {
      baseline: {
        version: 1,
        completed: ['dfs'],
        scores: { dfs: 70 },
        legacyHints: true,
        betaFlags: ['dark', 'coach'],
        cacheBlob: 'obsolete'
      },
      current: {
        version: 2,
        completed: ['dfs'],
        scores: { dfs: 70 },
        theme: 'system'
      }
    },
    mixed: {
      baseline: {
        version: 1,
        userId: 'learner-9',
        completed: ['heap'],
        scores: { heap: 88 },
        streak: 5,
        problemsSolved: 12,
        bookmarks: ['graph-cut'],
        settings: { sound: true, pace: 'normal' }
      },
      current: {
        schemaVersion: 3,
        userId: 'learner-9',
        doneIds: ['heap'],
        scoreMap: { heap: '88' },
        dayStreak: 5,
        solvedCount: 12,
        savedIds: ['graph-cut'],
        settings: { sound: true, pace: 'normal', locale: 'en' },
        xp: 420
      }
    }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, kind) {
    var el = $('driftStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function typeOf(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v;
  }

  function parseJson(raw, label) {
    var text = String(raw || '').trim();
    if (!text) throw new Error(label + ' JSON is empty.');
    var data = JSON.parse(text);
    if (data === null || typeof data !== 'object') {
      throw new Error(label + ' must be a JSON object or array.');
    }
    return data;
  }

  function collectPaths(value, prefix, out) {
    out = out || {};
    var t = typeOf(value);
    out[prefix || '$'] = t;
    if (t === 'object') {
      Object.keys(value).forEach(function (k) {
        collectPaths(value[k], (prefix ? prefix + '.' : '') + k, out);
      });
    } else if (t === 'array' && value.length && typeOf(value[0]) === 'object') {
      collectPaths(value[0], (prefix || '$') + '[]', out);
    }
    return out;
  }

  function leafName(path) {
    var parts = path.split('.');
    return parts[parts.length - 1].replace(/\[\]$/, '');
  }

  function parentPath(path) {
    var i = path.lastIndexOf('.');
    return i === -1 ? '$' : path.slice(0, i);
  }

  function detectRenames(removed, added) {
    var pairs = [];
    var usedAdded = {};
    removed.forEach(function (rPath) {
      var rLeaf = leafName(rPath);
      var rParent = parentPath(rPath);
      added.forEach(function (aPath) {
        if (usedAdded[aPath]) return;
        var aLeaf = leafName(aPath);
        var aParent = parentPath(aPath);
        if (rParent !== aParent) return;
        var hinted = RENAME_HINTS.some(function (pair) {
          return (pair[0] === rLeaf && pair[1] === aLeaf) || (pair[1] === rLeaf && pair[0] === aLeaf);
        });
        var similar =
          hinted ||
          (rLeaf.toLowerCase() !== aLeaf.toLowerCase() &&
            (aLeaf.toLowerCase().indexOf(rLeaf.toLowerCase()) !== -1 ||
              rLeaf.toLowerCase().indexOf(aLeaf.toLowerCase()) !== -1 ||
              levenshtein(rLeaf, aLeaf) <= 3));
        if (similar) {
          pairs.push({ from: rPath, to: aPath, leafFrom: rLeaf, leafTo: aLeaf });
          usedAdded[aPath] = true;
        }
      });
    });
    return pairs;
  }

  function levenshtein(a, b) {
    var m = a.length;
    var n = b.length;
    var dp = [];
    var i;
    var j;
    for (i = 0; i <= m; i++) {
      dp[i] = [i];
    }
    for (j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  function diffSchemas(baseline, current) {
    var basePaths = collectPaths(baseline);
    var currPaths = collectPaths(current);
    var baseKeys = Object.keys(basePaths);
    var currKeys = Object.keys(currPaths);
    var removed = baseKeys.filter(function (k) {
      return !Object.prototype.hasOwnProperty.call(currPaths, k);
    });
    var added = currKeys.filter(function (k) {
      return !Object.prototype.hasOwnProperty.call(basePaths, k);
    });
    var renames = detectRenames(removed, added);
    var renamedFrom = {};
    var renamedTo = {};
    renames.forEach(function (p) {
      renamedFrom[p.from] = true;
      renamedTo[p.to] = true;
    });

    var diffs = [];

    renames.forEach(function (p) {
      diffs.push({
        kind: 'rename',
        classification: 'breaking',
        path: p.from,
        title: 'Field likely renamed',
        detail: p.from + ' → ' + p.to + ' (' + p.leafFrom + ' → ' + p.leafTo + ')'
      });
    });

    removed.forEach(function (path) {
      if (renamedFrom[path]) return;
      diffs.push({
        kind: 'removed',
        classification: 'breaking',
        path: path,
        title: 'Key removed',
        detail: 'Path "' + path + '" existed in baseline (type ' + basePaths[path] + ') but is missing in current.'
      });
    });

    added.forEach(function (path) {
      if (renamedTo[path]) return;
      diffs.push({
        kind: 'added',
        classification: 'additive',
        path: path,
        title: 'Key added',
        detail: 'Path "' + path + '" is new in current (type ' + currPaths[path] + '). Older clients may ignore it.'
      });
    });

    baseKeys.forEach(function (path) {
      if (!Object.prototype.hasOwnProperty.call(currPaths, path)) return;
      if (basePaths[path] !== currPaths[path]) {
        diffs.push({
          kind: 'type',
          classification: 'breaking',
          path: path,
          title: 'Type changed',
          detail: path + ': ' + basePaths[path] + ' → ' + currPaths[path]
        });
      }
    });

    return {
      diffs: diffs,
      renames: renames,
      basePaths: basePaths,
      currPaths: currPaths
    };
  }

  function scoreRisk(diffs) {
    var breaking = diffs.filter(function (d) {
      return d.classification === 'breaking';
    }).length;
    var additive = diffs.filter(function (d) {
      return d.classification === 'additive';
    }).length;
    var score = Math.min(100, breaking * 18 + additive * 4);
    var band = score >= 60 ? 'high' : score >= 25 ? 'mid' : 'low';
    var label = band === 'high' ? 'High' : band === 'mid' ? 'Medium' : 'Low';
    return { score: score, band: band, label: label, breaking: breaking, additive: additive };
  }

  function generateMigrationStub(analysis) {
    var lines = [];
    lines.push('/** Auto-generated migration stub — review before shipping */');
    lines.push('function migrateProgress(raw) {');
    lines.push('  var data = typeof raw === "string" ? JSON.parse(raw) : Object.assign({}, raw);');
    lines.push('  // Ensure schema version marker');
    lines.push('  if (data.schemaVersion == null && data.version != null) {');
    lines.push('    data.schemaVersion = Number(data.version) || 1;');
    lines.push('    delete data.version;');
    lines.push('  }');
    analysis.renames.forEach(function (p) {
      var from = p.leafFrom;
      var to = p.leafTo;
      lines.push('  if (Object.prototype.hasOwnProperty.call(data, "' + from + '") && data.' + to + ' == null) {');
      lines.push('    data.' + to + ' = data.' + from + ';');
      lines.push('    delete data.' + from + ';');
      lines.push('  }');
    });
    analysis.diffs.forEach(function (d) {
      if (d.kind === 'type') {
        lines.push('  // TODO: coerce ' + d.path + ' (' + d.detail + ')');
      }
      if (d.kind === 'removed') {
        lines.push('  // Dropped key: ' + d.path + ' — confirm no reader still depends on it');
        lines.push('  // delete data["' + leafName(d.path) + '"];');
      }
      if (d.kind === 'added') {
        lines.push('  if (data.' + leafName(d.path) + ' == null) {');
        lines.push('    // data.' + leafName(d.path) + ' = /* default */;');
        lines.push('  }');
      }
    });
    lines.push('  data.schemaVersion = data.schemaVersion || 2;');
    lines.push('  return data;');
    lines.push('}');
    lines.push('');
    lines.push('// Usage: localStorage.setItem(KEY, JSON.stringify(migrateProgress(localStorage.getItem(KEY))));');
    return lines.join('\n');
  }

  function defaultRecommendations(analysis, risk) {
    var recs = [];
    if (risk.breaking > 0) {
      recs.push({
        title: 'Ship a one-shot migrator before reading new fields',
        detail: 'Run migrateProgress on load; write back the migrated payload so old keys disappear after one session.'
      });
    }
    if (analysis.renames.length) {
      recs.push({
        title: 'Keep dual-read for one release',
        detail: 'Accept both old and new field names for at least one version window, then delete the aliases.'
      });
    }
    var typeDiffs = analysis.diffs.filter(function (d) {
      return d.kind === 'type';
    });
    if (typeDiffs.length) {
      recs.push({
        title: 'Add runtime type guards at parse time',
        detail: 'Coerce stringified numbers/booleans and normalize arrays↔maps before UI code assumes a shape.'
      });
    }
    var removed = analysis.diffs.filter(function (d) {
      return d.kind === 'removed';
    });
    if (removed.length) {
      recs.push({
        title: 'Audit consumers of removed keys',
        detail: 'Search for localStorage readers of: ' + removed.map(function (d) {
          return leafName(d.path);
        }).join(', ')
      });
    }
    if (risk.band === 'low' && analysis.diffs.length === 0) {
      recs.push({
        title: 'No structural drift detected',
        detail: 'Shapes align. Consider pinning schemaVersion and adding a checksum for corruption detection.'
      });
    } else if (!recs.length) {
      recs.push({
        title: 'Document additive fields',
        detail: 'New keys are safe for older readers if they ignore unknown properties — document defaults in the schema changelog.'
      });
    }
    return recs;
  }

  function renderFindings(listEl, items, emptyMsg) {
    listEl.innerHTML = '';
    if (!items.length) {
      listEl.innerHTML =
        '<li class="drift-finding is-ok"><p class="drift-finding-title">No issues</p>' +
        '<p class="drift-finding-body">' +
        escapeHtml(emptyMsg) +
        '</p></li>';
      return;
    }
    items.forEach(function (item, idx) {
      var li = document.createElement('li');
      var cls = item.kind === 'rename' ? 'rename' : item.kind === 'type' ? 'type' : item.classification === 'breaking' ? 'breaking' : item.classification === 'additive' ? 'additive' : 'rec';
      li.className = 'drift-finding is-' + cls;
      li.style.animationDelay = idx * 0.04 + 's';
      var badgeClass =
        item.kind === 'rename'
          ? 'drift-badge-rename'
          : item.kind === 'type'
            ? 'drift-badge-type'
            : item.classification === 'breaking'
              ? 'drift-badge-breaking'
              : 'drift-badge-additive';
      var badgeLabel = item.kind || item.classification || 'note';
      li.innerHTML =
        '<span class="drift-badge ' +
        badgeClass +
        '">' +
        escapeHtml(badgeLabel) +
        '</span>' +
        '<p class="drift-finding-title">' +
        escapeHtml(item.title) +
        '</p>' +
        '<p class="drift-finding-body">' +
        escapeHtml(item.detail) +
        '</p>';
      listEl.appendChild(li);
    });
  }

  function renderReport(report) {
    $('driftEmpty').hidden = true;
    $('driftResults').hidden = false;

    $('statDiffs').textContent = String(report.analysis.diffs.length);
    $('statBreaking').textContent = String(report.risk.breaking);
    $('statRisk').textContent = report.risk.label;

    $('driftScoreVal').textContent = String(report.risk.score);
    var ring = $('driftScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add('is-' + report.risk.band);
    $('driftRiskBlurb').textContent =
      report.risk.breaking +
      ' breaking and ' +
      report.risk.additive +
      ' additive change(s). ' +
      (report.risk.band === 'high'
        ? 'Migrate before deploying the new reader.'
        : report.risk.band === 'mid'
          ? 'Plan a dual-read window and typed coercion.'
          : 'Low risk — document defaults and bump schemaVersion.');

    renderFindings($('driftDiffList'), report.analysis.diffs, 'Baseline and current shapes match structurally.');

    $('driftClassifier').innerHTML =
      '<div class="drift-class-card is-breaking"><h4>Breaking (' +
      report.risk.breaking +
      ')</h4><p>Removals, renames, and type changes that can crash or silently lose progress for existing localStorage users.</p></div>' +
      '<div class="drift-class-card is-additive"><h4>Additive (' +
      report.risk.additive +
      ')</h4><p>New keys older clients can ignore. Still set defaults on first migrate so UI never reads undefined.</p></div>';

    $('driftMigrationStub').textContent = report.stub;
    renderFindings(
      $('driftRecList'),
      report.recommendations.map(function (r) {
        return { kind: 'rec', classification: 'rec', title: r.title, detail: r.detail };
      }),
      'No recommendations.'
    );

    $('driftExportBtn').disabled = false;
  }

  function analyze() {
    try {
      var baseline = parseJson($('driftBaseline').value, 'Baseline');
      var current = parseJson($('driftCurrent').value, 'Current');
      var analysis = diffSchemas(baseline, current);
      var risk = scoreRisk(analysis.diffs);
      var stub = generateMigrationStub(analysis);
      var recommendations = defaultRecommendations(analysis, risk);
      lastReport = {
        generatedAt: new Date().toISOString(),
        baseline: baseline,
        current: current,
        analysis: analysis,
        risk: risk,
        stub: stub,
        recommendations: recommendations
      };
      renderReport(lastReport);
      setStatus(
        'Detected ' + analysis.diffs.length + ' schema difference(s) (' + risk.breaking + ' breaking).',
        'is-ok'
      );
    } catch (err) {
      setStatus(err.message || String(err), 'is-error');
    }
  }

  function loadPreset(name) {
    var preset = PRESETS[name];
    if (!preset) return;
    $('driftBaseline').value = JSON.stringify(preset.baseline, null, 2);
    $('driftCurrent').value = JSON.stringify(preset.current, null, 2);
    setStatus('Loaded "' + name + '" drift preset.', 'is-ok');
    analyze();
  }

  function clearAll() {
    $('driftBaseline').value = '';
    $('driftCurrent').value = '';
    lastReport = null;
    $('driftEmpty').hidden = false;
    $('driftResults').hidden = true;
    $('driftExportBtn').disabled = true;
    $('statDiffs').textContent = '0';
    $('statBreaking').textContent = '0';
    $('statRisk').textContent = '—';
    setStatus('Cleared.');
  }

  function downloadReport() {
    if (!lastReport) return;
    var payload = {
      tool: 'ai-localstorage-schema-drift-detector',
      generatedAt: lastReport.generatedAt,
      risk: lastReport.risk,
      diffs: lastReport.analysis.diffs,
      renames: lastReport.analysis.renames,
      recommendations: lastReport.recommendations,
      migrationStub: lastReport.stub,
      baseline: lastReport.baseline,
      current: lastReport.current
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'schema-drift-report-' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Schema-drift report downloaded.', 'is-ok');
  }

  function init() {
    $('driftAnalyzeBtn').addEventListener('click', analyze);
    $('driftClearBtn').addEventListener('click', clearAll);
    $('driftExportBtn').addEventListener('click', downloadReport);
    Array.prototype.forEach.call(document.querySelectorAll('.drift-preset-btn'), function (btn) {
      btn.addEventListener('click', function () {
        loadPreset(btn.getAttribute('data-preset'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
