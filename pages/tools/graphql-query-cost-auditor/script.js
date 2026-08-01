/**
 * GraphQL Query Cost Auditor
 * Lightweight depth / fan-out / complexity heuristics (client-side only).
 */
(function () {
  'use strict';

  var DEMO_SCHEMA =
    'type Query {\n' +
    '  users(limit: Int): [User!]!\n' +
    '  posts: [Post!]!\n' +
    '}\n\n' +
    'type User {\n' +
    '  id: ID!\n' +
    '  name: String!\n' +
    '  friends: [User!]!\n' +
    '  posts: [Post!]!\n' +
    '  comments: [Comment!]!\n' +
    '}\n\n' +
    'type Post {\n' +
    '  id: ID!\n' +
    '  title: String!\n' +
    '  author: User!\n' +
    '  comments: [Comment!]!\n' +
    '}\n\n' +
    'type Comment {\n' +
    '  id: ID!\n' +
    '  body: String!\n' +
    '  author: User!\n' +
    '}';

  var DEMO_QUERY =
    'fragment FriendFields on User {\n' +
    '  id\n' +
    '  name\n' +
    '  friends {\n' +
    '    ...FriendFields\n' +
    '  }\n' +
    '}\n\n' +
    'query ExpensiveNested {\n' +
    '  a1: users(limit: 100) {\n' +
    '    id\n' +
    '    name\n' +
    '    friends {\n' +
    '      id\n' +
    '      posts {\n' +
    '        title\n' +
    '        comments {\n' +
    '          body\n' +
    '          author {\n' +
    '            friends {\n' +
    '              ...FriendFields\n' +
    '            }\n' +
    '          }\n' +
    '        }\n' +
    '      }\n' +
    '    }\n' +
    '  }\n' +
    '  a2: users(limit: 100) { id name }\n' +
    '  a3: users(limit: 100) { id name }\n' +
    '  a4: users(limit: 100) { id name }\n' +
    '  a5: users(limit: 100) { id name }\n' +
    '  a6: users(limit: 100) { id name }\n' +
    '  a7: users(limit: 100) { id name }\n' +
    '  a8: users(limit: 100) { id name }\n' +
    '}';

  var lastAudit = null;

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

  function stripComments(src) {
    return String(src || '')
      .replace(/#[^\n]*/g, '')
      .replace(/"""[\s\S]*?"""/g, '')
      .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
  }

  function parseListFields(schema) {
    var lists = {};
    var typeBlocks = stripComments(schema).match(/type\s+(\w+)\s*\{[^}]*\}/g) || [];
    typeBlocks.forEach(function (block) {
      var typeMatch = block.match(/type\s+(\w+)/);
      if (!typeMatch) return;
      var typeName = typeMatch[1];
      var fieldRe = /(\w+)\s*(?:\([^)]*\))?\s*:\s*(\[[^\]]+\]|[\w!]+)/g;
      var m;
      while ((m = fieldRe.exec(block))) {
        if (m[2].indexOf('[') !== -1) {
          lists[typeName + '.' + m[1]] = true;
          lists[m[1]] = true;
        }
      }
    });
    return lists;
  }

  function extractFragments(query) {
    var frags = {};
    var re = /fragment\s+(\w+)\s+on\s+\w+\s*\{/g;
    var src = stripComments(query);
    var m;
    while ((m = re.exec(src))) {
      var name = m[1];
      var start = m.index + m[0].length - 1;
      var depth = 0;
      var i = start;
      for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') {
          depth--;
          if (depth === 0) {
            frags[name] = src.slice(start + 1, i);
            break;
          }
        }
      }
    }
    return frags;
  }

  function expandFragments(body, fragments, stack, cycles) {
    stack = stack || [];
    cycles = cycles || [];
    return body.replace(/\.\.\.(\w+)/g, function (_, name) {
      if (!fragments[name]) return '...'+ name;
      if (stack.indexOf(name) !== -1) {
        if (cycles.indexOf(name) === -1) cycles.push(name);
        return '/*CYCLE:' + name + '*/';
      }
      stack.push(name);
      var expanded = expandFragments(fragments[name], fragments, stack, cycles);
      stack.pop();
      return expanded;
    });
  }

  function extractOperationBody(query) {
    var src = stripComments(query);
    var withoutFrags = src.replace(/fragment\s+\w+\s+on\s+\w+\s*\{[\s\S]*?\n\}/g, '');
    var op = withoutFrags.match(/(?:query|mutation|subscription)\s+\w*[^{]*\{/);
    var startIdx;
    if (op) {
      startIdx = withoutFrags.indexOf('{', op.index);
    } else {
      startIdx = withoutFrags.indexOf('{');
    }
    if (startIdx === -1) return withoutFrags;
    var depth = 0;
    for (var i = startIdx; i < withoutFrags.length; i++) {
      if (withoutFrags[i] === '{') depth++;
      else if (withoutFrags[i] === '}') {
        depth--;
        if (depth === 0) return withoutFrags.slice(startIdx + 1, i);
      }
    }
    return withoutFrags.slice(startIdx + 1);
  }

  function analyzeSelection(body, listFields) {
    var maxDepth = 0;
    var maxFanOut = 0;
    var fieldCount = 0;
    var aliasCount = 0;
    var aliases = {};
    var nestedListPaths = [];
    var depth = 0;
    var path = [];
    var siblingCounts = [0];
    var tokens = body.match(/[a-zA-Z_][\w]*\s*:\s*[a-zA-Z_][\w]*|[a-zA-Z_][\w]*|[{}]|\([^)]*\)/g) || [];

    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t === '{') {
        depth++;
        siblingCounts[depth] = 0;
        if (depth > maxDepth) maxDepth = depth;
        continue;
      }
      if (t === '}') {
        if (siblingCounts[depth] > maxFanOut) maxFanOut = siblingCounts[depth];
        depth = Math.max(0, depth - 1);
        path.pop();
        continue;
      }
      if (t.charAt(0) === '(') continue;

      var fieldName = t;
      var isAlias = false;
      if (t.indexOf(':') !== -1) {
        isAlias = true;
        aliasCount++;
        var parts = t.split(':');
        var alias = parts[0].trim();
        fieldName = parts[1].trim();
        aliases[alias] = (aliases[alias] || 0) + 1;
      }

      fieldCount++;
      siblingCounts[depth] = (siblingCounts[depth] || 0) + 1;
      path.push(fieldName);

      var isList = !!(listFields[fieldName] || listFields[path.join('.')]);
      if (isList) {
        var listDepth = path.filter(function (p) {
          return listFields[p];
        }).length;
        if (listDepth >= 2) {
          nestedListPaths.push(path.join('.'));
        }
      }

      var next = tokens[i + 1];
      if (!(next === '{' || (next && next.charAt(0) === '(' && tokens[i + 2] === '{'))) {
        path.pop();
      } else if (next && next.charAt(0) === '(' && tokens[i + 2] === '{') {
        /* keep path for nested block */
      }
    }

    return {
      maxDepth: maxDepth,
      maxFanOut: Math.max(maxFanOut, siblingCounts[0] || 0),
      fieldCount: fieldCount,
      aliasCount: aliasCount,
      aliases: aliases,
      nestedListPaths: nestedListPaths
    };
  }

  function scoreComplexity(metrics) {
    var score =
      metrics.fieldCount * 1 +
      metrics.maxDepth * 8 +
      metrics.maxFanOut * 3 +
      metrics.aliasCount * 2 +
      metrics.nestedListPaths.length * 12;
    return Math.round(score);
  }

  function buildRecommendations(metrics, score) {
    var recs = [];
    var suggestedDepth = Math.max(4, Math.min(metrics.maxDepth, 8));
    var suggestedCost = Math.max(50, Math.ceil(score * 0.6));

    recs.push({
      title: 'maxDepth',
      detail: 'Enforce maxDepth ≈ ' + suggestedDepth + ' (observed ' + metrics.maxDepth + '). Reject deeper selections at the gateway.'
    });
    recs.push({
      title: 'cost limit',
      detail: 'Set a query cost budget around ' + suggestedCost + ' (current score ' + score + '). Use persisted queries for known heavy ops.'
    });
    if (metrics.aliasCount >= 6) {
      recs.push({
        title: 'alias limit',
        detail: 'Cap aliases per operation (e.g. ≤ 5). Observed ' + metrics.aliasCount + ' aliases — likely alias flood.'
      });
    }
    if (metrics.nestedListPaths.length) {
      recs.push({
        title: 'dataloader / batching',
        detail: 'Nested list fields detected. Require DataLoader (or equivalent) and consider pagination on list edges.'
      });
    }
    recs.push({
      title: 'timeouts',
      detail: 'Pair cost limits with execution timeouts and introspection hardening in production.'
    });
    return recs;
  }

  function runAudit() {
    var schema = ($('gqlSchema').value || '').trim();
    var query = ($('gqlQuery').value || '').trim();
    if (!query) {
      $('gqlStatus').textContent = 'Paste a GraphQL query (schema optional but improves N+1 hints).';
      return;
    }

    var listFields = parseListFields(schema);
    var fragments = extractFragments(query);
    var cycles = [];
    var opBody = extractOperationBody(query);
    var expanded = expandFragments(opBody, fragments, [], cycles);
    var metrics = analyzeSelection(expanded, listFields);
    var complexity = scoreComplexity(metrics);

    var warnings = [];
    if (metrics.aliasCount >= 6) {
      warnings.push({
        severity: 'high',
        title: 'Alias flood',
        detail: metrics.aliasCount + ' aliases detected. Attackers use aliases to multiply field resolution cost.'
      });
    }
    if (cycles.length) {
      warnings.push({
        severity: 'critical',
        title: 'Fragment cycle',
        detail: 'Possible recursive fragment spread involving: ' + cycles.join(', ') + '.'
      });
    }
    if (metrics.maxDepth >= 6) {
      warnings.push({
        severity: 'high',
        title: 'Deep selection set',
        detail: 'Max depth ' + metrics.maxDepth + ' can amplify resolver work exponentially.'
      });
    }
    if (metrics.maxFanOut >= 10) {
      warnings.push({
        severity: 'medium',
        title: 'High fan-out',
        detail: 'A single selection set fans out to ' + metrics.maxFanOut + ' siblings.'
      });
    }
    if (metrics.nestedListPaths.length) {
      var unique = [];
      metrics.nestedListPaths.forEach(function (p) {
        if (unique.indexOf(p) === -1) unique.push(p);
      });
      warnings.push({
        severity: 'high',
        title: 'N+1 risk (nested lists)',
        detail: 'Nested list paths: ' + unique.slice(0, 5).join(', ') + (unique.length > 5 ? '…' : '') + '.'
      });
    }
    if (!warnings.length) {
      warnings.push({
        severity: 'ok',
        title: 'No major cost red flags',
        detail: 'Depth and aliasing look reasonable. Still enforce server-side cost limits.'
      });
    }

    var recs = buildRecommendations(metrics, complexity);
    lastAudit = {
      generatedAt: new Date().toISOString(),
      metrics: metrics,
      complexity: complexity,
      warnings: warnings,
      recommendations: recs,
      cycles: cycles
    };

    renderMetrics(metrics, complexity);
    renderWarnings(warnings);
    renderRecs(recs);
    updateHero(metrics.maxDepth, complexity, warnings.filter(function (w) { return w.severity !== 'ok'; }).length);
    $('gqlDownloadBtn').disabled = false;
    $('gqlStatus').textContent = 'Audit complete — complexity score ' + complexity + '.';
  }

  function updateHero(depth, complexity, warnings) {
    $('statDepth').textContent = depth == null ? '—' : String(depth);
    $('statComplexity').textContent = complexity == null ? '—' : String(complexity);
    $('statWarnings').textContent = warnings == null ? '—' : String(warnings);
  }

  function renderMetrics(metrics, complexity) {
    var cards = [
      { label: 'Max depth', val: metrics.maxDepth },
      { label: 'Max fan-out', val: metrics.maxFanOut },
      { label: 'Field count', val: metrics.fieldCount },
      { label: 'Aliases', val: metrics.aliasCount },
      { label: 'Complexity score', val: complexity },
      { label: 'Nested list paths', val: metrics.nestedListPaths.length }
    ];
    $('gqlMetrics').innerHTML = cards
      .map(function (c) {
        return (
          '<div class="gql-metric-card">' +
          '<span class="gql-metric-label">' + escapeHtml(c.label) + '</span>' +
          '<span class="gql-metric-val">' + escapeHtml(String(c.val)) + '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  function renderWarnings(warnings) {
    $('gqlWarnings').innerHTML = warnings
      .map(function (w) {
        return (
          '<article class="gql-finding" data-severity="' + escapeHtml(w.severity) + '">' +
          '<p class="gql-finding-meta">' + escapeHtml(w.severity) + '</p>' +
          '<h3 class="gql-finding-title">' + escapeHtml(w.title) + '</h3>' +
          '<p class="gql-finding-detail">' + escapeHtml(w.detail) + '</p>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderRecs(recs) {
    $('gqlRecs').innerHTML = recs
      .map(function (r) {
        return '<li><strong>' + escapeHtml(r.title) + ':</strong> ' + escapeHtml(r.detail) + '</li>';
      })
      .join('');
  }

  function downloadAudit() {
    if (!lastAudit) return;
    var lines = [];
    lines.push('# GraphQL Query Cost Audit');
    lines.push('Generated: ' + lastAudit.generatedAt);
    lines.push('');
    lines.push('## Metrics');
    lines.push('- Max depth: ' + lastAudit.metrics.maxDepth);
    lines.push('- Max fan-out: ' + lastAudit.metrics.maxFanOut);
    lines.push('- Field count: ' + lastAudit.metrics.fieldCount);
    lines.push('- Aliases: ' + lastAudit.metrics.aliasCount);
    lines.push('- Complexity score: ' + lastAudit.complexity);
    lines.push('');
    lines.push('## Warnings');
    lastAudit.warnings.forEach(function (w) {
      lines.push('- [' + w.severity + '] ' + w.title + ': ' + w.detail);
    });
    lines.push('');
    lines.push('## Recommendations');
    lastAudit.recommendations.forEach(function (r) {
      lines.push('- ' + r.title + ': ' + r.detail);
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'graphql-query-cost-audit.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadDemo() {
    $('gqlSchema').value = DEMO_SCHEMA;
    $('gqlQuery').value = DEMO_QUERY;
    $('gqlStatus').textContent = 'Loaded expensive nested query with aliases + recursive fragment.';
  }

  function clearAll() {
    $('gqlSchema').value = '';
    $('gqlQuery').value = '';
    $('gqlMetrics').innerHTML = '<p class="gql-empty">Run an audit to see depth, fan-out, and complexity.</p>';
    $('gqlWarnings').innerHTML = '<p class="gql-empty">Alias floods, fragment cycles, and N+1 hints appear here.</p>';
    $('gqlRecs').innerHTML = '<li class="gql-empty-li">Recommendations appear after a successful audit.</li>';
    $('gqlDownloadBtn').disabled = true;
    lastAudit = null;
    updateHero(null, null, null);
    $('gqlStatus').textContent = 'Cleared.';
  }

  function init() {
    $('gqlDemoBtn').addEventListener('click', loadDemo);
    $('gqlAuditBtn').addEventListener('click', runAudit);
    $('gqlClearBtn').addEventListener('click', clearAll);
    $('gqlDownloadBtn').addEventListener('click', downloadAudit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
