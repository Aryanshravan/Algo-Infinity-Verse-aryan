/**
 * AI GraphQL AuthZ Field Leak Auditor
 * Schema + resolver heuristics for missing @auth, sensitive leaks, nested bypass paths.
 */
(function () {
  'use strict';

  var TAXONOMY = [
    {
      id: 'email',
      label: 'Email',
      patterns: [/email/i, /e_mail/i, /mailAddress/i],
    },
    {
      id: 'token',
      label: 'Token / secret',
      patterns: [/token/i, /secret/i, /apiKey/i, /api_key/i, /password/i, /passwd/i, /refresh/i, /session/i],
    },
    {
      id: 'role',
      label: 'Role / privilege',
      patterns: [/role/i, /isAdmin/i, /permissions?/i, /scopes?/i, /entitlements?/i],
    },
    {
      id: 'pii',
      label: 'PII',
      patterns: [
        /ssn/i,
        /phone/i,
        /address/i,
        /dob/i,
        /birth/i,
        /nationalId/i,
        /passport/i,
        /creditCard/i,
        /iban/i,
        /taxId/i,
      ],
    },
  ];

  var PRESETS = {
    'user-pii': {
      schema:
        'type Query {\n' +
        '  me: User\n' +
        '  users: [User!]!\n' +
        '}\n\n' +
        'type User {\n' +
        '  id: ID!\n' +
        '  name: String\n' +
        '  email: String\n' +
        '  phone: String\n' +
        '  role: String\n' +
        '  ssn: String\n' +
        '}\n',
      resolvers:
        'const resolvers = {\n' +
        '  Query: {\n' +
        '    me: (_, __, ctx) => ctx.db.user.find(ctx.userId),\n' +
        '    users: () => db.users.findAll(), // no auth\n' +
        '  },\n' +
        '  User: {\n' +
        '    email: (u) => u.email,\n' +
        '    ssn: (parent) => parent.ssn,\n' +
        '    role: (u) => u.role,\n' +
        '  },\n' +
        '};\n',
    },
    'token-nested': {
      schema:
        'type Query {\n' +
        '  organization(id: ID!): Organization\n' +
        '}\n\n' +
        'type Organization {\n' +
        '  id: ID!\n' +
        '  name: String\n' +
        '  owner: User\n' +
        '  members: [User!]!\n' +
        '}\n\n' +
        'type User {\n' +
        '  id: ID!\n' +
        '  email: String\n' +
        '  apiKey: String\n' +
        '  refreshToken: String\n' +
        '}\n',
      resolvers:
        'Query: {\n' +
        '  organization: (_, { id }) => orgs.get(id),\n' +
        '},\n' +
        'Organization: {\n' +
        '  owner: (org) => users.get(org.ownerId),\n' +
        '  members: (org) => users.byOrg(org.id),\n' +
        '},\n' +
        'User: {\n' +
        '  apiKey: (u) => u.apiKey,\n' +
        '  refreshToken: (u) => u.refreshToken,\n' +
        '},\n',
    },
    'admin-bypass': {
      schema:
        'directive @auth(requires: Role = USER) on FIELD_DEFINITION\n\n' +
        'enum Role { USER ADMIN }\n\n' +
        'type Query {\n' +
        '  publicFeed: [Post!]!\n' +
        '  adminStats: Stats @auth(requires: ADMIN)\n' +
        '}\n\n' +
        'type Post {\n' +
        '  id: ID!\n' +
        '  title: String\n' +
        '  author: User\n' +
        '}\n\n' +
        'type User {\n' +
        '  id: ID!\n' +
        '  name: String\n' +
        '  isAdmin: Boolean\n' +
        '  email: String\n' +
        '}\n\n' +
        'type Stats {\n' +
        '  revenue: Float\n' +
        '  secretToken: String\n' +
        '}\n',
      resolvers:
        'Query: {\n' +
        '  publicFeed: () => posts.list(),\n' +
        '  adminStats: (_, __, ctx) => {\n' +
        '    requireAuth(ctx);\n' +
        '    assertRole(ctx, "ADMIN");\n' +
        '    return stats.load();\n' +
        '  },\n' +
        '},\n' +
        'Post: {\n' +
        '  author: (p) => users.get(p.authorId),\n' +
        '},\n' +
        'User: {\n' +
        '  isAdmin: (u) => u.isAdmin,\n' +
        '  email: (u) => u.email,\n' +
        '},\n',
    },
  };

  var state = {
    analyzed: false,
    risk: 0,
    sensitive: [],
    unguarded: [],
    bypasses: [],
    patches: '',
    summary: null,
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

  function setStatus(msg, kind) {
    var el = $('gqlauth-status');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.remove('is-error', 'is-ok');
    if (kind) el.classList.add(kind);
  }

  function classifyField(name) {
    for (var i = 0; i < TAXONOMY.length; i++) {
      var cat = TAXONOMY[i];
      for (var j = 0; j < cat.patterns.length; j++) {
        if (cat.patterns[j].test(name)) return cat.id;
      }
    }
    return null;
  }

  function parseSchema(sdl) {
    var types = [];
    var typeRe = /\b(type|interface)\s+(\w+)\s*(implements\s+[^{]+)?\{([^}]*)\}/g;
    var m;
    var src = String(sdl || '');
    while ((m = typeRe.exec(src))) {
      var typeName = m[2];
      var body = m[4];
      var fieldRe = /(\w+)(\([^)]*\))?\s*:\s*\[?[\w!]+\]?!?(\s+@[^\n]*)?/g;
      var fm;
      var fields = [];
      while ((fm = fieldRe.exec(body))) {
        var fname = fm[1];
        if (fname === 'type' || fname === 'interface') continue;
        var directives = (fm[3] || '').trim();
        var hasAuth =
          /@auth\b/i.test(directives) ||
          /@hasRole\b/i.test(directives) ||
          /@authorized\b/i.test(directives) ||
          /@requiresAuth\b/i.test(directives);
        fields.push({
          type: typeName,
          name: fname,
          directives: directives,
          hasAuthDirective: hasAuth,
          category: classifyField(fname),
        });
      }
      types.push({ name: typeName, fields: fields });
    }
    return types;
  }

  function resolverGuardsSensitive(resolvers, typeName, fieldName) {
    var src = String(resolvers || '');
    // Look for field resolver block mentioning guards nearby
    var patterns = [
      new RegExp(
        typeName +
          '\\s*:\\s*\\{[\\s\\S]{0,800}' +
          fieldName +
          '\\s*:\\s*\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]{0,400}(requireAuth|assertRole|checkAuth|isAuthenticated|ctx\\.user|context\\.user)',
        'i'
      ),
      new RegExp(
        fieldName +
          '\\s*:\\s*(async\\s*)?\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]{0,300}(requireAuth|assertRole|checkAuth|authorize)',
        'i'
      ),
    ];
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i].test(src)) return true;
    }
    // Query-level guard covering the whole Query type for root fields
    if (
      (typeName === 'Query' || typeName === 'Mutation') &&
      new RegExp(
        typeName +
          '\\s*:\\s*\\{[\\s\\S]{0,200}' +
          fieldName +
          '[\\s\\S]{0,250}(requireAuth|assertRole)',
        'i'
      ).test(src)
    ) {
      return true;
    }
    return false;
  }

  function findObjectEdges(types) {
    var byName = {};
    types.forEach(function (t) {
      byName[t.name] = t;
    });
    var edges = [];
    var sdl = $('gqlauth-schema').value;
    var typeRe = /\b(type|interface)\s+(\w+)\s*(implements\s+[^{]+)?\{([^}]*)\}/g;
    var m;
    while ((m = typeRe.exec(sdl))) {
      var typeName = m[2];
      var body = m[4];
      var fieldRe = /(\w+)(\([^)]*\))?\s*:\s*\[?(!?\w+)\]?!?/g;
      var fm;
      while ((fm = fieldRe.exec(body))) {
        var fname = fm[1];
        var ret = fm[3].replace(/^!/, '');
        if (byName[ret] && ret !== typeName) {
          edges.push({ from: typeName, field: fname, to: ret });
        }
      }
    }
    return edges;
  }

  function findBypassPaths(types, sensitiveUnguarded) {
    var paths = [];
    var edges = findObjectEdges(types);
    var sensitiveSet = {};
    sensitiveUnguarded.forEach(function (f) {
      sensitiveSet[f.type + '.' + f.name] = f;
    });

    // Direct public Query → sensitive
    types.forEach(function (t) {
      if (t.name !== 'Query' && t.name !== 'Mutation') return;
      t.fields.forEach(function (f) {
        // Nested: Query.field → Type with sensitive
        edges.forEach(function (e) {
          if (e.from !== t.name || e.field !== f.name) return;
          Object.keys(sensitiveSet).forEach(function (key) {
            var s = sensitiveSet[key];
            if (s.type === e.to) {
              paths.push({
                path: t.name + '.' + f.name + ' → ' + e.to + '.' + s.name,
                query: '{ ' + f.name + ' { ' + s.name + ' } }',
                reason:
                  'Public/root selection reaches unguarded sensitive field ' +
                  s.name +
                  ' (' +
                  s.category +
                  ') via ' +
                  e.to +
                  '.',
              });
            }
          });
        });
      });
    });

    // Two-hop: Query → Mid → SensitiveType
    edges.forEach(function (e1) {
      if (e1.from !== 'Query' && e1.from !== 'Mutation') return;
      edges.forEach(function (e2) {
        if (e2.from !== e1.to) return;
        Object.keys(sensitiveSet).forEach(function (key) {
          var s = sensitiveSet[key];
          if (s.type === e2.to) {
            paths.push({
              path: e1.from + '.' + e1.field + ' → ' + e2.from + '.' + e2.field + ' → ' + s.type + '.' + s.name,
              query:
                '{ ' + e1.field + ' { ' + e2.field + ' { ' + s.name + ' } } }',
              reason:
                'Nested selection bypass: sensitive ' +
                s.category +
                ' field reachable without field-level auth on the leaf.',
            });
          }
        });
      });
    });

    // Deduplicate by path string
    var seen = {};
    return paths.filter(function (p) {
      if (seen[p.path]) return false;
      seen[p.path] = true;
      return true;
    });
  }

  function buildPatches(unguarded) {
    if (!unguarded.length) {
      return '// No unguarded sensitive fields detected.\n// Keep @auth on high-value fields and assert in resolvers.\n';
    }
    var lines = [];
    lines.push('# Suggested SDL field-policy patches');
    lines.push('# Apply directive-based auth (or equivalent shield rules)\n');
    var byType = {};
    unguarded.forEach(function (f) {
      if (!byType[f.type]) byType[f.type] = [];
      byType[f.type].push(f);
    });
    Object.keys(byType).forEach(function (typeName) {
      lines.push('type ' + typeName + ' {');
      byType[typeName].forEach(function (f) {
        var role = f.category === 'role' || f.category === 'token' ? 'ADMIN' : 'USER';
        lines.push('  ' + f.name + ': String @auth(requires: ' + role + ')  # was unguarded ' + f.category);
      });
      lines.push('}\n');
    });
    lines.push('// Resolver guard sketch');
    lines.push('function guardSensitive(ctx, field) {');
    lines.push('  requireAuth(ctx);');
    lines.push('  if (["token","role"].includes(field.category)) assertRole(ctx, "ADMIN");');
    lines.push('}');
    lines.push('');
    unguarded.slice(0, 8).forEach(function (f) {
      lines.push(
        '// ' +
          f.type +
          '.' +
          f.name +
          ': (_, __, ctx) => { guardSensitive(ctx, { category: "' +
          f.category +
          '" }); return load' +
          f.name +
          '(ctx); }'
      );
    });
    return lines.join('\n');
  }

  function updateStats() {
    $('gqlauth-statRisk').textContent = state.analyzed ? String(state.risk) : '—';
    $('gqlauth-statSensitive').textContent = state.analyzed ? String(state.sensitive.length) : '—';
    $('gqlauth-statUnguarded').textContent = state.analyzed ? String(state.unguarded.length) : '—';
    $('gqlauth-statBypass').textContent = state.analyzed ? String(state.bypasses.length) : '—';
  }

  function renderTaxonomyChips() {
    $('gqlauth-taxonomy').innerHTML = TAXONOMY.map(function (c) {
      return (
        '<span class="gqlauth-chip"><i class="fas fa-tag" aria-hidden="true"></i> ' +
        escapeHtml(c.label) +
        '</span>'
      );
    }).join('');
  }

  function runAudit() {
    var schema = $('gqlauth-schema').value.trim();
    var resolvers = $('gqlauth-resolvers').value;
    if (!schema) {
      setStatus('Paste a GraphQL schema (SDL) first.', 'is-error');
      return;
    }

    var types = parseSchema(schema);
    var sensitive = [];
    var unguarded = [];

    types.forEach(function (t) {
      t.fields.forEach(function (f) {
        if (!f.category) return;
        sensitive.push(f);
        var guarded =
          f.hasAuthDirective || resolverGuardsSensitive(resolvers, t.name, f.name);
        if (!guarded) {
          unguarded.push({
            type: f.type,
            name: f.name,
            category: f.category,
            severity: f.category === 'token' || f.category === 'pii' ? 'high' : 'medium',
            detail:
              'Field ' +
              f.type +
              '.' +
              f.name +
              ' looks like ' +
              f.category +
              ' but has no @auth/@hasRole directive and no nearby resolver guard heuristic.',
          });
        }
      });
    });

    var bypasses = findBypassPaths(types, unguarded);
    var risk = 0;
    unguarded.forEach(function (u) {
      risk += u.severity === 'high' ? 18 : 12;
    });
    risk += Math.min(30, bypasses.length * 8);
    if (!/requireAuth|assertRole|@auth/i.test(schema + resolvers) && sensitive.length) {
      risk += 15;
    }
    risk = Math.min(100, risk);

    state.analyzed = true;
    state.risk = risk;
    state.sensitive = sensitive;
    state.unguarded = unguarded;
    state.bypasses = bypasses;
    state.patches = buildPatches(unguarded);
    state.summary = {
      types: types.length,
      fields: types.reduce(function (n, t) {
        return n + t.fields.length;
      }, 0),
      sensitive: sensitive.length,
      unguarded: unguarded.length,
      bypasses: bypasses.length,
      risk: risk,
    };

    renderResults();
    updateStats();
    $('gqlauth-exportBtn').disabled = false;
    setStatus(
      'Audit complete — ' +
        unguarded.length +
        ' unguarded sensitive field(s), ' +
        bypasses.length +
        ' bypass path(s).',
      'is-ok'
    );
  }

  function renderResults() {
    var list = $('gqlauth-sensitiveList');
    if (!state.sensitive.length) {
      list.innerHTML = '<p class="gqlauth-empty">No taxonomy matches in this schema.</p>';
    } else {
      list.innerHTML = state.sensitive
        .map(function (f) {
          return (
            '<div class="gqlauth-field-item"><code>' +
            escapeHtml(f.type) +
            '.' +
            escapeHtml(f.name) +
            '</code><span class="cat">' +
            escapeHtml(f.category) +
            '</span>' +
            (f.hasAuthDirective
              ? ' <span class="cat" style="color:var(--gqlauth-ok)">@auth</span>'
              : '') +
            '</div>'
          );
        })
        .join('');
    }

    var ung = $('gqlauth-unguarded');
    if (!state.unguarded.length) {
      ung.innerHTML =
        '<p class="gqlauth-empty">No missing-guard heuristics fired on sensitive fields.</p>';
    } else {
      ung.innerHTML = state.unguarded
        .map(function (u) {
          return (
            '<article class="gqlauth-finding sev-' +
            (u.severity === 'high' ? 'high' : 'medium') +
            '"><strong><span class="gqlauth-sev">' +
            escapeHtml(u.severity) +
            '</span>' +
            escapeHtml(u.type + '.' + u.name) +
            '</strong><span>' +
            escapeHtml(u.detail) +
            '</span></article>'
          );
        })
        .join('');
    }

    var by = $('gqlauth-bypass');
    if (!state.bypasses.length) {
      by.innerHTML = '<li class="gqlauth-empty">No nested bypass paths inferred.</li>';
    } else {
      by.innerHTML = state.bypasses
        .map(function (p) {
          return (
            '<li><strong>' +
            escapeHtml(p.path) +
            '</strong><br />' +
            escapeHtml(p.reason) +
            '<br /><code>' +
            escapeHtml(p.query) +
            '</code></li>'
          );
        })
        .join('');
    }

    $('gqlauth-patches').textContent = state.patches;

    var s = state.summary;
    $('gqlauth-summary').innerHTML =
      '<dl>' +
      '<dt>Types parsed</dt><dd>' +
      s.types +
      '</dd>' +
      '<dt>Fields scanned</dt><dd>' +
      s.fields +
      '</dd>' +
      '<dt>Sensitive (taxonomy)</dt><dd>' +
      s.sensitive +
      '</dd>' +
      '<dt>Unguarded</dt><dd>' +
      s.unguarded +
      '</dd>' +
      '<dt>Bypass paths</dt><dd>' +
      s.bypasses +
      '</dd>' +
      '<dt>Risk score</dt><dd>' +
      s.risk +
      ' / 100</dd>' +
      '</dl>';
  }

  function exportReport() {
    if (!state.analyzed) return;
    var lines = [];
    lines.push('# GraphQL AuthZ Field Leak Audit Report');
    lines.push('Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('## Hero stats');
    lines.push('- Risk score: ' + state.risk);
    lines.push('- Sensitive fields: ' + state.sensitive.length);
    lines.push('- Unguarded: ' + state.unguarded.length);
    lines.push('- Bypass paths: ' + state.bypasses.length);
    lines.push('');
    lines.push('## Sensitive field taxonomy hits');
    state.sensitive.forEach(function (f) {
      lines.push(
        '- ' +
          f.type +
          '.' +
          f.name +
          ' [' +
          f.category +
          ']' +
          (f.hasAuthDirective ? ' (@auth present)' : '')
      );
    });
    lines.push('');
    lines.push('## Missing @auth / guard findings');
    if (!state.unguarded.length) {
      lines.push('- None');
    } else {
      state.unguarded.forEach(function (u) {
        lines.push('- [' + u.severity.toUpperCase() + '] ' + u.type + '.' + u.name + ' — ' + u.detail);
      });
    }
    lines.push('');
    lines.push('## Nested selection bypass paths');
    if (!state.bypasses.length) {
      lines.push('- None');
    } else {
      state.bypasses.forEach(function (p) {
        lines.push('- ' + p.path);
        lines.push('  Query: ' + p.query);
        lines.push('  ' + p.reason);
      });
    }
    lines.push('');
    lines.push('## Suggested field-policy patches');
    lines.push('```graphql');
    lines.push(state.patches);
    lines.push('```');
    lines.push('');
    lines.push('## Disclaimer');
    lines.push('Heuristic client-side audit only. Validate with schema-aware auth tooling in CI.');

    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'graphql-authz-field-leak-audit.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Audit report downloaded.', 'is-ok');
  }

  function loadPreset(key) {
    var p = PRESETS[key];
    if (!p) return;
    $('gqlauth-schema').value = p.schema;
    $('gqlauth-resolvers').value = p.resolvers;
    setStatus('Loaded demo preset: ' + key, 'is-ok');
  }

  function clearAll() {
    $('gqlauth-schema').value = '';
    $('gqlauth-resolvers').value = '';
    $('gqlauth-preset').value = '';
    state.analyzed = false;
    state.risk = 0;
    state.sensitive = [];
    state.unguarded = [];
    state.bypasses = [];
    state.patches = '';
    state.summary = null;
    $('gqlauth-sensitiveList').innerHTML =
      '<p class="gqlauth-empty">Run an audit to classify schema fields.</p>';
    $('gqlauth-unguarded').innerHTML =
      '<p class="gqlauth-empty">Unguarded sensitive fields appear here.</p>';
    $('gqlauth-bypass').innerHTML =
      '<li class="gqlauth-empty">Bypass paths appear after audit.</li>';
    $('gqlauth-patches').textContent =
      'Run an audit to generate @auth / resolver guard patches.';
    $('gqlauth-summary').innerHTML = '<p class="gqlauth-empty">No audit yet.</p>';
    $('gqlauth-exportBtn').disabled = true;
    updateStats();
    setStatus('Cleared.');
  }

  function bind() {
    renderTaxonomyChips();
    updateStats();

    $('gqlauth-preset').addEventListener('change', function () {
      var key = $('gqlauth-preset').value;
      if (key) loadPreset(key);
    });
    $('gqlauth-auditBtn').addEventListener('click', runAudit);
    $('gqlauth-clearBtn').addEventListener('click', clearAll);
    $('gqlauth-exportBtn').addEventListener('click', exportReport);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
