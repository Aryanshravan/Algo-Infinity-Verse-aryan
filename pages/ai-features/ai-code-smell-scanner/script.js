/**
 * AI Code Smell Scanner
 * Acorn AST when available; regex/heuristic AST-lite fallback.
 */
(function () {
  'use strict';

  var DEMO_CODE =
    'class OrderManager {\n' +
    '  constructor(db, cache, logger, mailer, metrics, auth, billing, inventory) {\n' +
    '    this.db = db;\n' +
    '    this.cache = cache;\n' +
    '    this.logger = logger;\n' +
    '    this.mailer = mailer;\n' +
    '    this.metrics = metrics;\n' +
    '    this.auth = auth;\n' +
    '    this.billing = billing;\n' +
    '    this.inventory = inventory;\n' +
    '  }\n\n' +
    '  processOrder(userId, productId, qty, price, tax, discount, coupon, note, flag) {\n' +
    '    if (userId) {\n' +
    '      if (this.auth.isValid(userId)) {\n' +
    '        if (qty > 0) {\n' +
    '          if (this.inventory.has(productId, qty)) {\n' +
    '            if (price > 0) {\n' +
    '              var total = price * qty;\n' +
    '              if (discount > 0) {\n' +
    '                total = total - discount;\n' +
    '                if (coupon) {\n' +
    '                  total = total - this.billing.applyCoupon(coupon, total);\n' +
    '                  if (tax > 0) {\n' +
    '                    total = total + tax;\n' +
    '                    this.logger.info("tax applied");\n' +
    '                    this.metrics.inc("tax");\n' +
    '                    this.db.saveOrder(userId, productId, total);\n' +
    '                    this.cache.set("order:" + userId, total);\n' +
    '                    this.mailer.send(userId, "Order ok");\n' +
    '                    this.inventory.reserve(productId, qty);\n' +
    '                    this.billing.charge(userId, total);\n' +
    '                  }\n' +
    '                }\n' +
    '              }\n' +
    '            }\n' +
    '          }\n' +
    '        }\n' +
    '      }\n' +
    '    }\n' +
    '    var status = "pending";\n' +
    '    var code = 200;\n' +
    '    var retries = 3;\n' +
    '    return { status: status, code: code, retries: retries, total: total };\n' +
    '  }\n\n' +
    '  validateA(x) { if (x > 0) { return true; } return false; }\n' +
    '  validateB(x) { if (x > 0) { return true; } return false; }\n' +
    '  validateC(x) { if (x > 0) { return true; } return false; }\n' +
    '  checkA(x) { if (x > 0) { return true; } return false; }\n' +
    '  checkB(x) { if (x > 0) { return true; } return false; }\n' +
    '}\n\n' +
    'function helper(a, b, c, d, e, f) {\n' +
    '  return a + b + c + d + e + f;\n' +
    '}\n';

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

  function hasAcorn() {
    return typeof acorn !== 'undefined' && acorn && typeof acorn.parse === 'function';
  }

  function setEngineBadge() {
    var badge = $('smellEngineBadge');
    if (!badge) return;
    badge.textContent = hasAcorn() ? 'Engine: Acorn AST' : 'Engine: Heuristic AST-lite';
  }

  function setStatus(msg, kind) {
    var el = $('smellStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'smell-status' + (kind ? ' is-' + kind : '');
  }

  function countMatches(src, re) {
    var m = src.match(re);
    return m ? m.length : 0;
  }

  function maxNesting(src) {
    var max = 0;
    var depth = 0;
    for (var i = 0; i < src.length; i++) {
      var ch = src.charAt(i);
      if (ch === '{') {
        depth++;
        if (depth > max) max = depth;
      } else if (ch === '}') {
        depth = Math.max(0, depth - 1);
      }
    }
    return max;
  }

  function heuristicComplexity(src) {
    var decision =
      countMatches(src, /\bif\b/g) +
      countMatches(src, /\belse\s+if\b/g) +
      countMatches(src, /\bfor\b/g) +
      countMatches(src, /\bwhile\b/g) +
      countMatches(src, /\bcase\b/g) +
      countMatches(src, /\bcatch\b/g) +
      countMatches(src, /\?\s*[^:]/g) +
      countMatches(src, /&&|\|\|/g);
    var cyclo = 1 + decision;
    var nesting = maxNesting(src);
    var cognitive = Math.round(decision * 1.15 + Math.max(0, nesting - 2) * 2.5);
    return { cyclo: cyclo, cognitive: cognitive, nesting: nesting };
  }

  function walkAcorn(node, visitor) {
    if (!node || typeof node !== 'object') return;
    visitor(node);
    for (var key in node) {
      if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
      if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
      var child = node[key];
      if (Array.isArray(child)) {
        for (var i = 0; i < child.length; i++) {
          if (child[i] && typeof child[i].type === 'string') walkAcorn(child[i], visitor);
        }
      } else if (child && typeof child.type === 'string') {
        walkAcorn(child, visitor);
      }
    }
  }

  function acornComplexity(ast) {
    var cyclo = 1;
    var cognitive = 0;
    var nestingStack = [];

    walkAcorn(ast, function (node) {
      var t = node.type;
      var isDecision =
        t === 'IfStatement' ||
        t === 'ForStatement' ||
        t === 'ForInStatement' ||
        t === 'ForOfStatement' ||
        t === 'WhileStatement' ||
        t === 'DoWhileStatement' ||
        t === 'SwitchCase' ||
        t === 'CatchClause' ||
        t === 'ConditionalExpression' ||
        t === 'LogicalExpression';

      if (isDecision) {
        cyclo += 1;
        var nestBonus = nestingStack.length;
        cognitive += 1 + nestBonus;
      }

      if (
        t === 'IfStatement' ||
        t === 'ForStatement' ||
        t === 'ForInStatement' ||
        t === 'ForOfStatement' ||
        t === 'WhileStatement' ||
        t === 'DoWhileStatement' ||
        t === 'SwitchStatement' ||
        t === 'TryStatement' ||
        t === 'FunctionDeclaration' ||
        t === 'FunctionExpression' ||
        t === 'ArrowFunctionExpression' ||
        t === 'ClassMethod' ||
        t === 'MethodDefinition'
      ) {
        nestingStack.push(t);
      }
    });

    // nestingStack above is approximate (push-only); recompute max brace nesting from source length heuristic
    return { cyclo: cyclo, cognitive: Math.max(cognitive, cyclo) };
  }

  function analyzeWithAcorn(src) {
    var ast = acorn.parse(src, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowReturnOutsideFunction: true,
      locations: true
    });

    var functions = [];
    var classes = [];
    var externalAccess = {};
    var paramHeavy = [];
    var primitiveLocals = 0;
    var methodBodies = [];

    walkAcorn(ast, function (node) {
      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        var methods = 0;
        var body = node.body && node.body.body ? node.body.body : [];
        for (var i = 0; i < body.length; i++) {
          if (body[i].type === 'MethodDefinition' || body[i].type === 'PropertyDefinition') methods++;
        }
        classes.push({
          name: node.id && node.id.name ? node.id.name : '(anonymous)',
          methods: methods,
          loc: node.loc
        });
      }

      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'MethodDefinition'
      ) {
        var params = node.params || (node.value && node.value.params) || [];
        var name =
          (node.id && node.id.name) ||
          (node.key && node.key.name) ||
          '(anonymous)';
        var start = node.start != null ? node.start : 0;
        var end = node.end != null ? node.end : start;
        var slice = src.slice(start, end);
        var lines = slice.split('\n').length;
        functions.push({ name: name, params: params.length, lines: lines, slice: slice });
        if (params.length >= 5) {
          paramHeavy.push({ name: name, params: params.length, slice: slice });
        }
        methodBodies.push(slice);
      }

      if (node.type === 'MemberExpression' && !node.computed) {
        var obj = node.object;
        if (obj && obj.type === 'MemberExpression' && obj.object && obj.object.type === 'ThisExpression') {
          var ext = obj.property && obj.property.name;
          if (ext) externalAccess[ext] = (externalAccess[ext] || 0) + 1;
        } else if (obj && obj.type === 'Identifier' && obj.name !== 'console' && obj.name !== 'Math') {
          externalAccess[obj.name] = (externalAccess[obj.name] || 0) + 1;
        }
      }

      if (node.type === 'VariableDeclarator' && node.id && node.id.type === 'Identifier') {
        if (!node.init || node.init.type === 'Literal') primitiveLocals++;
      }
    });

    var complexity = acornComplexity(ast);
    complexity.nesting = maxNesting(src);
    return buildSmells(src, {
      engine: 'acorn',
      functions: functions,
      classes: classes,
      externalAccess: externalAccess,
      paramHeavy: paramHeavy,
      primitiveLocals: primitiveLocals,
      methodBodies: methodBodies,
      complexity: complexity
    });
  }

  function analyzeHeuristic(src) {
    var functions = [];
    var fnRe = /(?:function\s+([A-Za-z0-9_$]+)|([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)|([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{)/g;
    var m;
    while ((m = fnRe.exec(src))) {
      var name = m[1] || m[2] || m[3] || '(anonymous)';
      var start = m.index;
      var snippet = src.slice(start, Math.min(src.length, start + 800));
      var paramsMatch = snippet.match(/\(([^)]*)\)/);
      var params = paramsMatch && paramsMatch[1].trim()
        ? paramsMatch[1].split(',').filter(Boolean).length
        : 0;
      functions.push({
        name: name,
        params: params,
        lines: snippet.split('\n').length,
        slice: snippet
      });
    }

    var classes = [];
    var classRe = /class\s+([A-Za-z0-9_$]+)/g;
    while ((m = classRe.exec(src))) {
      var cName = m[1];
      var methods = countMatches(src, new RegExp('\\b' + cName + '\\b[\\s\\S]{0,2000}?\\b([A-Za-z0-9_$]+)\\s*\\(', 'g'));
      classes.push({ name: cName, methods: Math.max(methods, 3), loc: null });
    }

    var externalAccess = {};
    var memRe = /this\.([A-Za-z0-9_$]+)\.([A-Za-z0-9_$]+)/g;
    while ((m = memRe.exec(src))) {
      externalAccess[m[1]] = (externalAccess[m[1]] || 0) + 1;
    }

    var paramHeavy = functions.filter(function (f) {
      return f.params >= 5;
    });

    var primitiveLocals = countMatches(src, /\b(?:var|let|const)\s+[A-Za-z0-9_$]+\s*=\s*(?:['"`]|[0-9])/g);
    var methodBodies = functions.map(function (f) {
      return f.slice;
    });

    return buildSmells(src, {
      engine: 'heuristic',
      functions: functions,
      classes: classes,
      externalAccess: externalAccess,
      paramHeavy: paramHeavy,
      primitiveLocals: primitiveLocals,
      methodBodies: methodBodies,
      complexity: heuristicComplexity(src)
    });
  }

  function normalizeBody(body) {
    return body
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .replace(/[A-Za-z0-9_$]+/g, 'ID')
      .trim()
      .slice(0, 180);
  }

  function detectShotgun(methodBodies) {
    var buckets = {};
    methodBodies.forEach(function (body) {
      if (!body || body.length < 40) return;
      var key = normalizeBody(body);
      if (key.length < 20) return;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(body);
    });
    var dupes = [];
    Object.keys(buckets).forEach(function (k) {
      if (buckets[k].length >= 3) {
        dupes.push({ count: buckets[k].length, sample: buckets[k][0] });
      }
    });
    return dupes;
  }

  function severityRank(s) {
    if (s === 'high') return 3;
    if (s === 'medium') return 2;
    return 1;
  }

  function overallSeverity(smells) {
    if (!smells.length) return 'none';
    var max = 0;
    smells.forEach(function (s) {
      max = Math.max(max, severityRank(s.severity));
    });
    if (max >= 3) return 'high';
    if (max === 2) return 'medium';
    return 'low';
  }

  function buildSmells(src, ctx) {
    var smells = [];
    var patches = [];

    ctx.functions.forEach(function (fn) {
      if (fn.lines >= 40 || (fn.slice && fn.slice.length > 900)) {
        smells.push({
          id: 'god-fn-' + fn.name,
          type: 'God Object',
          severity: 'high',
          title: 'God function / oversized method: ' + fn.name,
          detail:
            'Function "' +
            fn.name +
            '" spans ~' +
            fn.lines +
            ' lines. Large units mix concerns and resist testing.',
          snippet: fn.slice
        });
        patches.push({
          kind: 'Extract Method',
          title: 'Extract Method from ' + fn.name,
          text:
            'Split "' +
            fn.name +
            '" into smaller named helpers (validation, pricing, persistence, notifications).',
          code:
            '// Suggested Extract Method sketch\n' +
            'function validateOrder(ctx) { /* guards */ }\n' +
            'function computeTotal(ctx) { /* pricing */ }\n' +
            'function persistOrder(ctx) { /* db + cache */ }\n' +
            'function ' +
            fn.name +
            '(ctx) {\n' +
            '  validateOrder(ctx);\n' +
            '  var total = computeTotal(ctx);\n' +
            '  persistOrder(Object.assign({}, ctx, { total: total }));\n' +
            '  return total;\n' +
            '}\n'
        });
      }
    });

    ctx.classes.forEach(function (cls) {
      if (cls.methods >= 8) {
        smells.push({
          id: 'god-class-' + cls.name,
          type: 'God Object',
          severity: 'high',
          title: 'God Object class: ' + cls.name,
          detail:
            'Class "' +
            cls.name +
            '" appears to own many responsibilities (~' +
            cls.methods +
            ' members). Prefer cohesive collaborators.',
          snippet: src.slice(0, Math.min(src.length, 600))
        });
      }
    });

    var extKeys = Object.keys(ctx.externalAccess);
    var envyHits = extKeys.filter(function (k) {
      return ctx.externalAccess[k] >= 3;
    });
    if (envyHits.length >= 3) {
      smells.push({
        id: 'feature-envy',
        type: 'Feature Envy',
        severity: 'medium',
        title: 'Feature Envy on collaborators',
        detail:
          'Many external member accesses (' +
          envyHits
            .map(function (k) {
              return k + '×' + ctx.externalAccess[k];
            })
            .join(', ') +
          '). Logic may belong on those objects instead.',
        snippet: src.match(/this\.\w+\.\w+[\s\S]{0,120}/)
          ? src.match(/this\.\w+\.\w+[\s\S]{0,120}/)[0]
          : ''
      });
      patches.push({
        kind: 'Move Method',
        title: 'Reduce Feature Envy',
        text: 'Move pricing / inventory / billing steps onto the envied collaborators; keep orchestration thin.',
        code:
          '// Instead of this.billing.charge(...); this.inventory.reserve(...)\n' +
          '// orderService.fulfill(orderCtx);\n'
      });
    }

    ctx.paramHeavy.forEach(function (fn) {
      smells.push({
        id: 'long-params-' + fn.name,
        type: 'Long Parameter List',
        severity: fn.params >= 7 ? 'high' : 'medium',
        title: 'Long Parameter List: ' + fn.name + ' (' + fn.params + ')',
        detail: 'Functions with many positional args are hard to call and extend safely.',
        snippet: fn.slice
      });
      patches.push({
        kind: 'Introduce Parameter Object',
        title: 'Parameter Object for ' + fn.name,
        text: 'Bundle related arguments into a single options / context object.',
        code:
          '/** @typedef {{ userId: string, productId: string, qty: number, price: number, tax: number, discount: number, coupon?: string, note?: string, flag?: boolean }} OrderRequest */\n' +
          'function ' +
          fn.name +
          '(req /*: OrderRequest */) {\n' +
          '  const { userId, productId, qty, price, tax, discount, coupon } = req;\n' +
          '  // ...\n' +
          '}\n'
      });
    });

    if (ctx.complexity.nesting >= 5) {
      smells.push({
        id: 'deep-nesting',
        type: 'Deep Nesting',
        severity: ctx.complexity.nesting >= 7 ? 'high' : 'medium',
        title: 'Deep Nesting (depth ~' + ctx.complexity.nesting + ')',
        detail: 'High brace nesting increases cognitive load. Prefer early returns and extracted predicates.',
        snippet: src
      });
      patches.push({
        kind: 'Extract Method',
        title: 'Flatten nesting with guards',
        text: 'Replace nested if pyramids with guard clauses and extracted helpers.',
        code:
          'function processOrder(req) {\n' +
          '  if (!req.userId) return;\n' +
          '  if (!auth.isValid(req.userId)) return;\n' +
          '  if (req.qty <= 0) return;\n' +
          '  // happy path only\n' +
          '}\n'
      });
    }

    if (ctx.primitiveLocals >= 6) {
      smells.push({
        id: 'primitive-obsession',
        type: 'Primitive Obsession',
        severity: 'low',
        title: 'Primitive Obsession',
        detail:
          'Many bare string/number locals (~' +
          ctx.primitiveLocals +
          '). Domain small types / value objects clarify intent.',
        snippet: ''
      });
      patches.push({
        kind: 'Introduce Parameter Object',
        title: 'Replace primitives with value objects',
        text: 'Group status/code/retries (or money amounts) into small typed structures.',
        code:
          'const OrderStatus = Object.freeze({ PENDING: "pending", PAID: "paid" });\n' +
          'function money(amount, currency) { return { amount, currency }; }\n'
      });
    }

    var shotgun = detectShotgun(ctx.methodBodies);
    if (shotgun.length) {
      smells.push({
        id: 'shotgun-surgery',
        type: 'Shotgun Surgery',
        severity: 'medium',
        title: 'Shotgun Surgery / duplicated blocks',
        detail:
          'Found ' +
          shotgun.length +
          ' near-duplicate method shape(s) repeated ≥3 times. A change may require edits in many places.',
        snippet: shotgun[0].sample
      });
      patches.push({
        kind: 'Extract Method',
        title: 'Deduplicate similar validators',
        text: 'Extract a shared predicate / helper used by validateA/B/C and checkA/B.',
        code:
          'function isPositive(x) { return x > 0; }\n' +
          '// validateA/B/C and checkA/B all call isPositive\n'
      });
    }

    smells.sort(function (a, b) {
      return severityRank(b.severity) - severityRank(a.severity);
    });

    var primary = smells[0] || null;
    var before = primary && primary.snippet ? primary.snippet.slice(0, 1200) : src.slice(0, 800);
    var after =
      patches[0] && patches[0].code
        ? patches[0].code
        : '// No primary refactor suggestion — code looks relatively clean.';

    return {
      engine: ctx.engine,
      smells: smells,
      patches: patches,
      complexity: ctx.complexity,
      severity: overallSeverity(smells),
      before: before,
      after: after,
      primaryType: primary ? primary.type : null
    };
  }

  function scan(src) {
    if (hasAcorn()) {
      try {
        return analyzeWithAcorn(src);
      } catch (err) {
        setStatus('Acorn parse failed — using heuristic AST-lite. ' + (err && err.message ? err.message : ''), 'warn');
        return analyzeHeuristic(src);
      }
    }
    return analyzeHeuristic(src);
  }

  function renderReport(report) {
    lastReport = report;

    $('statSmells').textContent = String(report.smells.length);
    $('statComplexity').textContent =
      'C' + report.complexity.cyclo + ' / G' + report.complexity.cognitive;
    $('statSeverity').textContent = report.severity;

    $('smellEmpty').hidden = true;
    $('smellComplexityCard').hidden = false;
    $('smellList').hidden = false;

    $('cycloVal').textContent = String(report.complexity.cyclo);
    $('cogVal').textContent = String(report.complexity.cognitive);
    $('parserVal').textContent = report.engine === 'acorn' ? 'Acorn' : 'Heuristic';

    var list = $('smellList');
    list.innerHTML = '';
    if (!report.smells.length) {
      list.innerHTML = '<li class="smell-empty-li">No classic smells over thresholds. Nice.</li>';
    } else {
      report.smells.forEach(function (s) {
        var li = document.createElement('li');
        li.className = 'smell-finding';
        li.dataset.severity = s.severity;
        li.innerHTML =
          '<div class="smell-finding-head">' +
          '<h3 class="smell-finding-title">' +
          escapeHtml(s.title) +
          '</h3>' +
          '<span class="smell-badge ' +
          escapeHtml(s.severity) +
          '">' +
          escapeHtml(s.severity) +
          '</span>' +
          '<span class="smell-badge">' +
          escapeHtml(s.type) +
          '</span>' +
          '</div>' +
          '<p>' +
          escapeHtml(s.detail) +
          '</p>';
        list.appendChild(li);
      });
    }

    $('smellBefore').innerHTML = '<code>' + escapeHtml(report.before) + '</code>';
    $('smellAfter').innerHTML = '<code>' + escapeHtml(report.after) + '</code>';

    var patches = $('smellPatches');
    patches.innerHTML = '';
    if (!report.patches.length) {
      patches.innerHTML = '<li class="smell-empty-li">No refactor patches suggested.</li>';
    } else {
      report.patches.forEach(function (p) {
        var li = document.createElement('li');
        li.className = 'smell-patch';
        li.innerHTML =
          '<h3>' +
          escapeHtml(p.kind) +
          ': ' +
          escapeHtml(p.title) +
          '</h3>' +
          '<p>' +
          escapeHtml(p.text) +
          '</p>' +
          '<pre>' +
          escapeHtml(p.code) +
          '</pre>';
        patches.appendChild(li);
      });
    }

    $('exportChecklistBtn').disabled = false;
    setEngineBadge();
    setStatus(
      'Found ' +
        report.smells.length +
        ' smell(s). Cyclomatic ' +
        report.complexity.cyclo +
        ', cognitive ' +
        report.complexity.cognitive +
        ' (' +
        report.engine +
        ').',
      'ok'
    );
  }

  function buildChecklist(report) {
    var lines = [];
    lines.push('# Refactoring checklist — AI Code Smell Scanner');
    lines.push('');
    lines.push('- Engine: ' + report.engine);
    lines.push('- Smells: ' + report.smells.length);
    lines.push('- Cyclomatic: ' + report.complexity.cyclo);
    lines.push('- Cognitive: ' + report.complexity.cognitive);
    lines.push('- Overall severity: ' + report.severity);
    lines.push('');
    lines.push('## Smells');
    report.smells.forEach(function (s, i) {
      lines.push('- [ ] ' + (i + 1) + '. [' + s.severity + '] ' + s.type + ' — ' + s.title);
      lines.push('  ' + s.detail);
    });
    lines.push('');
    lines.push('## Suggested patches');
    report.patches.forEach(function (p, i) {
      lines.push('- [ ] ' + (i + 1) + '. ' + p.kind + ': ' + p.title);
      lines.push('  ' + p.text);
    });
    lines.push('');
    lines.push('## Primary before/after');
    lines.push('### Before');
    lines.push('```js');
    lines.push(report.before);
    lines.push('```');
    lines.push('### After');
    lines.push('```js');
    lines.push(report.after);
    lines.push('```');
    lines.push('');
    return lines.join('\n');
  }

  function downloadText(filename, text) {
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

  function onScan() {
    var src = ($('smellCode').value || '').trim();
    if (!src) {
      setStatus('Paste JS/TS code or load the demo first.', 'error');
      return;
    }
    try {
      var report = scan(src);
      renderReport(report);
    } catch (err) {
      setStatus('Scan failed: ' + (err && err.message ? err.message : String(err)), 'error');
    }
  }

  function init() {
    setEngineBadge();

    var loadDemoBtn = $('loadDemoBtn');
    var scanBtn = $('scanBtn');
    var clearBtn = $('clearBtn');
    var exportBtn = $('exportChecklistBtn');

    if (loadDemoBtn) {
      loadDemoBtn.addEventListener('click', function () {
        $('smellCode').value = DEMO_CODE;
        setStatus('Demo smell-heavy code loaded.', 'ok');
      });
    }
    if (scanBtn) scanBtn.addEventListener('click', onScan);
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        $('smellCode').value = '';
        lastReport = null;
        $('statSmells').textContent = '0';
        $('statComplexity').textContent = '—';
        $('statSeverity').textContent = '—';
        $('smellEmpty').hidden = false;
        $('smellComplexityCard').hidden = true;
        $('smellList').hidden = true;
        $('smellList').innerHTML = '';
        $('smellBefore').innerHTML = '<code>Run a scan to see the original snippet.</code>';
        $('smellAfter').innerHTML = '<code>Refactor suggestions appear here.</code>';
        $('smellPatches').innerHTML = '<li class="smell-empty-li">Patches appear after a successful scan.</li>';
        $('exportChecklistBtn').disabled = true;
        setStatus('Cleared.', '');
      });
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        if (!lastReport) return;
        downloadText('refactoring-checklist.md', buildChecklist(lastReport));
        setStatus('Checklist exported.', 'ok');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
