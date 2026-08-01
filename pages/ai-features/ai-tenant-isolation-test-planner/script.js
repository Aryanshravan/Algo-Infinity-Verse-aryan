(function () {
  'use strict';

  var lastPlan = null;

  var DEMO_ROUTES =
    'GET /api/orders/:orderId\n' +
    'POST /api/orders\n' +
    'GET /api/orders/:orderId/items\n' +
    'PATCH /api/invoices/:invoiceId\n' +
    'GET /api/invoices/:invoiceId/pdf\n' +
    'DELETE /api/documents/:docId\n' +
    'GET /api/admin/tenants/:tenantId/users\n' +
    'POST /api/webhooks/stripe\n' +
    'GET /api/search?q=:query\n' +
    'PUT /api/users/:userId/profile';

  var DEMO_OWNERSHIP = 'tenantId, orgId, accountId, ownerUserId';

  var TENANTS = ['T-alpha', 'T-beta', 'T-gamma'];

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

  function setStatus(msg, kind) {
    var el = $('tenantStatus');
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function parseOwnership(raw) {
    return String(raw || '')
      .split(/[\n,]+/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function parseRoutes(raw) {
    return String(raw || '')
      .split(/\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .map(function (line) {
        var m = line.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/i);
        if (m) {
          return { method: m[1].toUpperCase(), path: m[2] };
        }
        return { method: 'GET', path: line };
      });
  }

  function inferResource(path) {
    var parts = path.replace(/^\//, '').split('/').filter(Boolean);
    var skip = { api: 1, v1: 1, v2: 1, admin: 1 };
    for (var i = 0; i < parts.length; i++) {
      if (skip[parts[i].toLowerCase()]) continue;
      if (parts[i].charAt(0) === ':') continue;
      if (parts[i].indexOf('?') === 0) continue;
      return parts[i].replace(/\?.*$/, '');
    }
    return 'unknown';
  }

  function hasPathId(path) {
    return /:[a-zA-Z_][\w]*/.test(path);
  }

  function isAdminRoute(path) {
    return /\/admin\b/i.test(path);
  }

  function isPublicish(path) {
    return /webhook|health|public|search/i.test(path);
  }

  function gapRisk(route) {
    if (isAdminRoute(route.path) && hasPathId(route.path)) return 'high';
    if (hasPathId(route.path) && /DELETE|PATCH|PUT/i.test(route.method)) return 'high';
    if (hasPathId(route.path)) return 'medium';
    if (isPublicish(route.path)) return 'medium';
    return 'low';
  }

  function expectedScope(route, ownership) {
    if (isAdminRoute(route.path)) return 'platform-admin + tenant boundary';
    if (isPublicish(route.path) && !hasPathId(route.path)) return 'authn only / rate-limit';
    if (ownership.length) {
      return ownership.slice(0, 2).join(' + ') + ' filter on ' + inferResource(route.path);
    }
    return 'tenantId (or org) must scope query';
  }

  function blastRadius(route) {
    var resource = inferResource(route.path);
    if (isAdminRoute(route.path)) return { level: 'critical', label: 'Cross-tenant admin blast', score: 95 };
    if (/invoice|payment|charge|billing/i.test(resource)) return { level: 'critical', label: 'Financial data exposure', score: 90 };
    if (/DELETE/i.test(route.method)) return { level: 'high', label: 'Destructive cross-tenant delete', score: 85 };
    if (/document|file|pdf/i.test(resource + route.path)) return { level: 'high', label: 'Confidential document leak', score: 80 };
    if (/user|profile/i.test(resource)) return { level: 'high', label: 'PII / profile IDOR', score: 75 };
    if (/order|item/i.test(resource)) return { level: 'medium', label: 'Order data IDOR', score: 60 };
    if (isPublicish(route.path)) return { level: 'medium', label: 'Info disclosure via search/webhook', score: 45 };
    return { level: 'low', label: 'Limited tenant leakage', score: 30 };
  }

  function buildIdorMatrix(routes) {
    var cases = [];
    routes.forEach(function (route) {
      if (!hasPathId(route.path) && !isAdminRoute(route.path)) return;
      var resource = inferResource(route.path);
      var blast = blastRadius(route);
      TENANTS.forEach(function (actor, i) {
        var target = TENANTS[(i + 1) % TENANTS.length];
        cases.push({
          actor: actor,
          target: target + ' / ' + resource + ' id',
          action: route.method + ' ' + route.path,
          expect: '403 Forbidden or 404 (no existence leak)',
          blast: blast.level,
          blastScore: blast.score
        });
      });
    });
    return cases.slice(0, 24);
  }

  function buildNegatives(routes, ownership) {
    var tests = [];
    var own = ownership.length ? ownership[0] : 'tenantId';

    routes.forEach(function (route) {
      var resource = inferResource(route.path);
      if (hasPathId(route.path)) {
        tests.push({
          title: 'Cross-tenant ' + route.method + ' ' + resource,
          arrange: 'Auth as tenant A; obtain resource id belonging to tenant B.',
          act: route.method + ' ' + route.path + ' with B\'s id; omit or spoof ' + own + '.',
          assert: 'Response is 403/404; no body fields from tenant B; audit log records denied access.'
        });
      }
    });

    tests.push({
      title: 'Missing ownership filter on list',
      arrange: 'Seed two tenants with overlapping resource shapes.',
      act: 'GET collection endpoint without ' + own + ' query; rely only on JWT sub.',
      assert: 'Result set contains only caller tenant rows; count matches tenant-scoped seed.'
    });

    tests.push({
      title: 'Header / claim spoof of tenant',
      arrange: 'Valid JWT for tenant A; craft X-Tenant-Id / org header for B.',
      act: 'Call mutating route with spoofed header while JWT stays A.',
      assert: 'Server derives tenant from verified token/session only; spoof ignored.'
    });

    if (routes.some(function (r) { return isAdminRoute(r.path); })) {
      tests.push({
        title: 'Non-admin hits admin tenant switcher',
        arrange: 'User role = member in tenant A.',
        act: 'GET /api/admin/tenants/:tenantId/users for tenant B.',
        assert: '403; no user list leakage; no timing oracle between existing/missing tenants.'
      });
    }

    return tests.slice(0, 12);
  }

  function prioritizeRisks(routes) {
    var seen = {};
    var items = routes.map(function (route) {
      var blast = blastRadius(route);
      var key = blast.label + '|' + route.method;
      return {
        key: key,
        title: blast.label,
        route: route.method + ' ' + route.path,
        level: blast.level === 'critical' ? 'high' : blast.level,
        score: blast.score,
        why: 'Failure isolates poorly: attacker on another tenant can reach ' + inferResource(route.path) +
          '. Prioritize authz checks that bind path id → ' + (route.path.match(/tenantId/) ? 'path tenant' : 'session tenant') + '.'
      };
    });

    items.sort(function (a, b) { return b.score - a.score; });
    return items.filter(function (it) {
      if (seen[it.key]) return false;
      seen[it.key] = true;
      return true;
    }).slice(0, 8);
  }

  function scorePlan(routes, idorCount, highCount) {
    var base = Math.min(100, 20 + routes.length * 4 + idorCount * 2 + highCount * 8);
    return Math.max(5, Math.min(99, base));
  }

  function buildPlan(routesRaw, ownershipRaw) {
    var routes = parseRoutes(routesRaw);
    var ownership = parseOwnership(ownershipRaw);
    if (!routes.length) {
      throw new Error('Add at least one API route (METHOD /path).');
    }

    var mapped = routes.map(function (route) {
      return {
        method: route.method,
        path: route.path,
        resource: inferResource(route.path),
        scope: expectedScope(route, ownership),
        gap: gapRisk(route)
      };
    });

    var idor = buildIdorMatrix(routes);
    var negatives = buildNegatives(routes, ownership);
    var risks = prioritizeRisks(routes);
    var highCount = risks.filter(function (r) { return r.level === 'high'; }).length;
    var score = scorePlan(routes, idor.length, highCount);

    return {
      routes: mapped,
      ownership: ownership,
      idor: idor,
      negatives: negatives,
      risks: risks,
      score: score,
      highCount: highCount,
      generatedAt: new Date().toISOString()
    };
  }

  function updateHero(plan) {
    $('statRoutes').textContent = String(plan.routes.length);
    $('statIdor').textContent = String(plan.idor.length);
    $('statNegatives').textContent = String(plan.negatives.length);
    $('statHighRisk').textContent = String(plan.highCount);
  }

  function renderPlan(plan) {
    $('tenantEmpty').hidden = true;
    $('tenantResults').hidden = false;
    $('tenantDetailPanels').hidden = false;

    var blurb = plan.score >= 70
      ? 'High isolation pressure — many IDOR vectors and elevated blast-radius routes. Treat authz as a release blocker.'
      : plan.score >= 40
        ? 'Moderate risk — cover path-id routes and list filters before expanding tenant count.'
        : 'Lower surface — still verify negative tests and claim-spoof resistance.';

    $('tenantRiskBlurb').textContent = blurb;
    $('tenantScoreVal').textContent = String(plan.score);

    var ring = $('tenantScoreRing');
    ring.classList.remove('is-low', 'is-mid', 'is-high');
    ring.classList.add(plan.score >= 70 ? 'is-high' : plan.score >= 40 ? 'is-mid' : 'is-low');

    $('tenantMapBody').innerHTML = plan.routes.map(function (r) {
      return '<tr>' +
        '<td><code>' + escapeHtml(r.method) + '</code></td>' +
        '<td><code>' + escapeHtml(r.path) + '</code></td>' +
        '<td>' + escapeHtml(r.resource) + '</td>' +
        '<td>' + escapeHtml(r.scope) + '</td>' +
        '<td><span class="tenant-gap is-' + escapeHtml(r.gap) + '">' + escapeHtml(r.gap) + '</span></td>' +
        '</tr>';
    }).join('');

    $('tenantIdorBody').innerHTML = plan.idor.map(function (c) {
      return '<tr>' +
        '<td>' + escapeHtml(c.actor) + '</td>' +
        '<td>' + escapeHtml(c.target) + '</td>' +
        '<td><code>' + escapeHtml(c.action) + '</code></td>' +
        '<td>' + escapeHtml(c.expect) + '</td>' +
        '<td><span class="tenant-gap is-' + (c.blast === 'critical' ? 'high' : escapeHtml(c.blast)) + '">' +
        escapeHtml(c.blast) + '</span></td>' +
        '</tr>';
    }).join('');

    $('tenantNegList').innerHTML = plan.negatives.map(function (t) {
      return '<li class="tenant-neg-item">' +
        '<h4>' + escapeHtml(t.title) + '</h4>' +
        '<p><strong>Arrange:</strong> <span class="tenant-aaa">' + escapeHtml(t.arrange) + '</span></p>' +
        '<p><strong>Act:</strong> <span class="tenant-aaa">' + escapeHtml(t.act) + '</span></p>' +
        '<p><strong>Assert:</strong> <span class="tenant-aaa">' + escapeHtml(t.assert) + '</span></p>' +
        '</li>';
    }).join('');

    $('tenantRiskList').innerHTML = plan.risks.map(function (r) {
      return '<li class="tenant-risk-item is-' + escapeHtml(r.level) + '">' +
        '<h4>' + escapeHtml(r.title) + ' <span class="tenant-gap is-' + escapeHtml(r.level) + '">' +
        escapeHtml(r.level) + ' · ' + r.score + '</span></h4>' +
        '<p><code>' + escapeHtml(r.route) + '</code></p>' +
        '<p>' + escapeHtml(r.why) + '</p>' +
        '</li>';
    }).join('');

    updateHero(plan);
    $('tenantExportBtn').disabled = false;
  }

  function exportPlan(plan) {
    var lines = [];
    lines.push('# Tenant Isolation Test Plan');
    lines.push('Generated: ' + plan.generatedAt);
    lines.push('Risk score: ' + plan.score + '/100');
    lines.push('Ownership fields: ' + (plan.ownership.join(', ') || '(none specified)'));
    lines.push('');
    lines.push('## Route / resource ownership map');
    plan.routes.forEach(function (r) {
      lines.push('- [' + r.gap.toUpperCase() + '] ' + r.method + ' ' + r.path +
        ' → resource=' + r.resource + '; scope=' + r.scope);
    });
    lines.push('');
    lines.push('## IDOR / cross-tenant matrix');
    plan.idor.forEach(function (c, i) {
      lines.push((i + 1) + '. Actor ' + c.actor + ' → ' + c.target);
      lines.push('   Action: ' + c.action);
      lines.push('   Expect: ' + c.expect + ' | Blast: ' + c.blast);
    });
    lines.push('');
    lines.push('## Negative tests (Arrange–Act–Assert)');
    plan.negatives.forEach(function (t, i) {
      lines.push((i + 1) + '. ' + t.title);
      lines.push('   Arrange: ' + t.arrange);
      lines.push('   Act: ' + t.act);
      lines.push('   Assert: ' + t.assert);
    });
    lines.push('');
    lines.push('## Risk prioritization by blast radius');
    plan.risks.forEach(function (r, i) {
      lines.push((i + 1) + '. [' + r.level + '/' + r.score + '] ' + r.title + ' — ' + r.route);
      lines.push('   ' + r.why);
    });
    lines.push('');
    lines.push('## Checklist');
    lines.push('- [ ] Path id always joined with session tenant/org');
    lines.push('- [ ] List endpoints never return cross-tenant rows');
    lines.push('- [ ] Admin routes require platform role + explicit tenant scope');
    lines.push('- [ ] Error codes do not oracle resource existence across tenants');
    lines.push('- [ ] Webhooks/search cannot pivot into foreign tenant objects');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'tenant-isolation-test-plan.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function runAnalyze() {
    try {
      var plan = buildPlan($('tenantRoutesInput').value, $('tenantOwnershipInput').value);
      lastPlan = plan;
      renderPlan(plan);
      setStatus('Isolation plan ready — ' + plan.routes.length + ' routes, ' +
        plan.idor.length + ' IDOR cases, ' + plan.negatives.length + ' negatives.', 'is-ok');
    } catch (err) {
      setStatus(err.message || 'Unable to build plan.', 'is-error');
    }
  }

  function clearAll() {
    $('tenantRoutesInput').value = '';
    $('tenantOwnershipInput').value = '';
    lastPlan = null;
    $('tenantEmpty').hidden = false;
    $('tenantResults').hidden = true;
    $('tenantDetailPanels').hidden = true;
    $('tenantExportBtn').disabled = true;
    $('statRoutes').textContent = '0';
    $('statIdor').textContent = '0';
    $('statNegatives').textContent = '0';
    $('statHighRisk').textContent = '0';
    setStatus('Cleared.');
  }

  function init() {
    $('tenantLoadDemoBtn').addEventListener('click', function () {
      $('tenantRoutesInput').value = DEMO_ROUTES;
      $('tenantOwnershipInput').value = DEMO_OWNERSHIP;
      setStatus('Loaded multi-tenant API preset. Click Build isolation plan.', 'is-ok');
    });
    $('tenantAnalyzeBtn').addEventListener('click', runAnalyze);
    $('tenantClearBtn').addEventListener('click', clearAll);
    $('tenantExportBtn').addEventListener('click', function () {
      if (!lastPlan) return;
      exportPlan(lastPlan);
      setStatus('Downloaded tenant-isolation-test-plan.md', 'is-ok');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
