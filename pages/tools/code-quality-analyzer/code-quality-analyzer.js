document.addEventListener('DOMContentLoaded', function() {
  cqaInit();
});

const CQA_GRADE_CONFIG = {
  'A': { min: 90, label: 'Excellent', icon: 'fa-star', cls: 'cqa-grade-a' },
  'B': { min: 75, label: 'Good', icon: 'fa-thumbs-up', cls: 'cqa-grade-b' },
  'C': { min: 60, label: 'Average', icon: 'fa-meh', cls: 'cqa-grade-c' },
  'D': { min: 40, label: 'Poor', icon: 'fa-frown', cls: 'cqa-grade-d' },
  'F': { min: 0, label: 'Needs Work', icon: 'fa-times-circle', cls: 'cqa-grade-f' },
};

const CQA_READABILITY_WEIGHTS = {
  functionLength: 0.30,
  nestingDepth: 0.25,
  namingQuality: 0.20,
  commentRatio: 0.10,
  paramCount: 0.08,
  lineLength: 0.07,
};

const CQA_SHORT_NAMES = new Set(['i', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'x', 'y', 'z', 'idx', 'fn']);
const CQA_BAD_NAMES = new Set(['temp', 'tmp', 'foo', 'bar', 'baz', 'data', 'stuff', 'thing', 'val', 'value', 'res', 'result', 'ret', 'str', 'arr', 'obj', 'func', 'cb']);

const CQA_PRESETS = [
  {
    label: 'Two Sum Brute Force',
    lang: 'javascript',
    code: [
      'function twoSum(nums, target) {',
      '  for (let i = 0; i < nums.length; i++) {',
      '    for (let j = i + 1; j < nums.length; j++) {',
      '      if (nums[i] + nums[j] === target) {',
      '        return [i, j];',
      '      }',
      '    }',
      '  }',
      '  return [];',
      '}',
    ].join('\n'),
  },
  {
    label: 'Unmemoized Fibonacci',
    lang: 'javascript',
    code: [
      'function fib(n) {',
      '  if (n <= 1) return n;',
      '  return fib(n - 1) + fib(n - 2);',
      '}',
    ].join('\n'),
  },
  {
    label: 'Messy Code',
    lang: 'javascript',
    code: [
      'var x = 10;',
      'var y = 20;',
      'function calc(a,b) {',
      '  var temp = a + b;',
      '  var tmp = a * b;',
      '  if (temp > 10) {',
      '    if (tmp < 100) {',
      '      if (a > 0) {',
      '        if (b > 0) {',
      '          console.log(temp);',
      '        }',
      '      }',
      '    }',
      '  }',
      '  return tmp;',
      '}',
      'debugger;',
      'var result = calc(x, y);',
    ].join('\n'),
  },
  {
    label: 'Python Issues',
    lang: 'python',
    code: [
      'def process(data=[]):',
      '    temp = data',
      '    for i in range(len(data)):',
      '        for j in range(len(data)):',
      '            if data[i] == data[j]:',
      '                return True',
      '    return None',
      '',
      'def bad():',
      '    try:',
      '        x = 1 / 0',
      '    except:',
      '        pass',
      '',
      'def check(val):',
      '    if val == None:',
      '        return True',
      '    return False',
    ].join('\n'),
  },
  {
    label: 'Shift in Loop',
    lang: 'javascript',
    code: [
      'function processQueue(queue) {',
      '  while (queue.length > 0) {',
      '    var item = queue.shift();',
      '    console.log(item);',
      '  }',
      '}',
    ].join('\n'),
  },
  {
    label: 'IndexOf in Loop',
    lang: 'javascript',
    code: [
      'function findDuplicates(arr) {',
      '  var dups = [];',
      '  for (var i = 0; i < arr.length; i++) {',
      '    if (dups.indexOf(arr[i]) === -1) {',
      '      for (var j = i + 1; j < arr.length; j++) {',
      '        if (arr[i] === arr[j]) {',
      '          dups.push(arr[i]);',
      '        }',
      '      }',
      '    }',
      '  }',
      '  return dups;',
      '}',
    ].join('\n'),
  },
];

let cqaIssues = [];
let cqaHighlightTimeout = null;

function cqaInit() {
  var editor = document.getElementById('cqaEditor');
  var analyzeBtn = document.getElementById('cqaAnalyzeBtn');
  var clearBtn = document.getElementById('cqaClearBtn');
  var copyBtn = document.getElementById('cqaCopyBtn');
  var presetWrap = document.getElementById('cqaPresetBtns');
  var langBtns = document.querySelectorAll('.cqa-lang-btn');
  var issuesList = document.getElementById('cqaIssuesList');

  if (presetWrap) {
    CQA_PRESETS.forEach(function(p, i) {
      var btn = document.createElement('button');
      btn.className = 'cqa-preset-btn';
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = p.label;
      btn.addEventListener('click', function() {
        presetWrap.querySelectorAll('.cqa-preset-btn').forEach(function(b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        langBtns.forEach(function(lb) {
          var lang = lb.dataset.lang;
          lb.classList.toggle('active', lang === p.lang);
          lb.setAttribute('aria-pressed', lang === p.lang ? 'true' : 'false');
        });

        if (editor) {
          editor.value = p.code;
          cqaRenderLineNums(p.code);
          document.getElementById('cqaLineNums').dataset.lang = p.lang;
          cqaResetResultsDisplay();
        }
      });
      presetWrap.appendChild(btn);
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', cqaAnalyze);
  }

  if (editor) {
    editor.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        cqaAnalyze();
      }
    });
    editor.addEventListener('input', function() {
      cqaRenderLineNums(editor.value);
    });
    editor.addEventListener('scroll', cqaSyncLineNums);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (editor) editor.value = '';
      cqaClearResults();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      if (!editor) return;
      navigator.clipboard.writeText(editor.value).then(function() {
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(function() {
          copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 1500);
      });
    });
  }

  langBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      langBtns.forEach(function(b) {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      if (editor && editor.value.trim()) {
        document.getElementById('cqaLineNums').dataset.lang = btn.dataset.lang;
      }
    });
  });

  if (issuesList) {
    issuesList.addEventListener('click', function(e) {
      var item = e.target.closest('.cqa-issue-item');
      if (item && item.dataset.line) {
        cqaHighlightLine(parseInt(item.dataset.line, 10));
      }
    });
  }

  if (presetWrap && CQA_PRESETS.length > 0) {
    var firstBtn = presetWrap.querySelector('.cqa-preset-btn');
    if (firstBtn) {
      firstBtn.classList.add('active');
      firstBtn.setAttribute('aria-pressed', 'true');
    }
    if (editor) {
      editor.value = CQA_PRESETS[0].code;
      cqaRenderLineNums(CQA_PRESETS[0].code);
      document.getElementById('cqaLineNums').dataset.lang = CQA_PRESETS[0].lang;
    }
  }
}

function cqaAnalyze() {
  var editor = document.getElementById('cqaEditor');
  if (!editor) return;
  var code = editor.value;
  if (!code || !code.trim()) {
    cqaClearResults();
    return;
  }

  var lineNums = document.getElementById('cqaLineNums');
  var lang = lineNums ? (lineNums.dataset.lang || 'javascript') : 'javascript';

  cqaIssues = [];
  var lintIssues = [];
  var dsaIssues = [];
  var readabilityResult = null;

  if (lang === 'javascript') {
    lintIssues = cqaLintJS(code);
  } else {
    lintIssues = cqaLintPython(code);
  }

  dsaIssues = cqaDSAnalyze(code, lang);
  readabilityResult = cqaGradeReadability(code);

  cqaIssues = lintIssues.concat(dsaIssues);
  cqaIssues.sort(function(a, b) {
    var sev = { error: 0, warning: 1, info: 2 };
    return (sev[a.severity] || 2) - (sev[b.severity] || 2);
  });

  cqaRenderSummary(cqaIssues, readabilityResult);
  cqaRenderIssues(cqaIssues);
  cqaRenderReadability(readabilityResult);
}

function cqaLintJS(code) {
  var issues = [];

  if (typeof acorn === 'undefined') {
    issues.push({
      line: 1, message: 'Acorn parser not loaded. Lint analysis unavailable.', severity: 'warning', category: 'lint',
    });
    return issues;
  }

  var ast;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: 2022,
      locations: true,
      sourceType: 'script',
      allowReturnOutsideFunction: true,
    });
  } catch (e) {
    var line = e.loc ? e.loc.line : 1;
    var col = e.loc ? e.loc.column : 0;
    issues.push({
      line: line,
      message: 'Syntax error: ' + (e.message || 'Unknown parse error'),
      severity: 'error',
      category: 'lint',
    });
    return issues;
  }

  var globalBuiltins = new Set([
    'console', 'Math', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
    'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set', 'Promise',
    'RegExp', 'Date', 'Error', 'Symbol', 'BigInt', 'WeakMap', 'WeakSet',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'fetch', 'localStorage', 'sessionStorage', 'window', 'document',
    'undefined', 'null', 'true', 'false', 'this', 'arguments',
    'atob', 'btoa', 'Blob', 'File', 'FileReader', 'FormData',
    'Int8Array', 'Uint8Array', 'Int16Array', 'Uint16Array', 'Int32Array',
    'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
    'performance', 'navigator', 'location', 'history', 'crypto',
  ]);

  var scopeChain = [{ vars: new Map(), used: new Set(), declared: new Set() }];
  var allDeclarations = [];

  function getCurrentScope() {
    return scopeChain[scopeChain.length - 1];
  }

  function pushScope() {
    scopeChain.push({ vars: new Map(), used: new Set(), declared: new Set() });
  }

  function popScope() {
    scopeChain.pop();
  }

  function declareInScope(name, node, skipUnusedCheck) {
    var scope = getCurrentScope();
    if (!scope.vars.has(name)) {
      scope.vars.set(name, { node: node, line: node.loc.start.line, used: false });
      if (!skipUnusedCheck) {
        allDeclarations.push({ name: name, scope: scope, info: scope.vars.get(name) });
      }
    }
  }

  function isDeclaredInChain(name) {
    for (var i = scopeChain.length - 1; i >= 0; i--) {
      if (scopeChain[i].vars.has(name)) return true;
      if (scopeChain[i].declared.has(name)) return true;
    }
    return false;
  }

  function markUsed(name, line) {
    for (var i = scopeChain.length - 1; i >= 0; i--) {
      if (scopeChain[i].vars.has(name)) {
        scopeChain[i].vars.get(name).used = true;
        return true;
      }
      if (scopeChain[i].declared.has(name)) {
        return true;
      }
    }
    return false;
  }

  function checkIdentifier(node, parent) {
    if (!node || node.type !== 'Identifier') return;

    if (parent && parent.type === 'Property' && parent.key === node && !parent.computed) return;
    if (parent && parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return;

    var isDeclaration = false;
    if (parent) {
      if (parent.type === 'VariableDeclarator' && parent.id === node) isDeclaration = true;
      else if ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression') && parent.id === node) isDeclaration = true;
    }

    if (isDeclaration && parent && parent.type === 'VariableDeclarator') {
      declareInScope(node.name, node);
      return;
    }

    if (isDeclaration && parent && (parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression')) {
      declareInScope(node.name, node, true);
      return;
    }

    markUsed(node.name, node.loc.start.line);

    if (!isDeclaration && !isDeclaredInChain(node.name) && !globalBuiltins.has(node.name) && !hoistedFuncs.has(node.name)) {
      var alreadyReported = false;
      for (var i = 0; i < issues.length; i++) {
        if (issues[i].message === "'" + node.name + "' is not defined" && issues[i].line === node.loc.start.line) {
          alreadyReported = true;
          break;
        }
      }
      if (!alreadyReported) {
        issues.push({
          line: node.loc.start.line,
          message: "'" + node.name + "' is not defined",
          severity: 'error',
          category: 'lint',
        });
      }
    }
  }

  function walk(node, parent) {
    if (!node || typeof node !== 'object') return;

    var nodeType = node.type;

    if (nodeType === 'FunctionDeclaration' || nodeType === 'FunctionExpression' || nodeType === 'ArrowFunctionExpression') {
      if (nodeType === 'FunctionDeclaration') {
        if (!parent || parent.type !== 'VariableDeclarator') {
          if (node.id) declareInScope(node.id.name, node, true);
        }
      }

      pushScope();

      if (nodeType === 'FunctionExpression' && node.id) {
        declareInScope(node.id.name, node, true);
      }
      if (node.params) {
        node.params.forEach(function(p) {
          if (p.type === 'Identifier') {
            declareInScope(p.name, p);
          }
        });
      }
      if (node.body) {
        if (node.body.type === 'BlockStatement') {
          node.body.body.forEach(function(child) { walk(child, node.body); });
        } else {
          walk(node.body, node);
        }
      }
      popScope();
      return;
    }

    if (nodeType === 'VariableDeclaration') {
      if (node.kind === 'var') {
        issues.push({
          line: node.loc.start.line,
          message: 'Use let or const instead of var',
          severity: 'warning',
          category: 'lint',
        });
      }
      if (node.declarations) {
        node.declarations.forEach(function(decl) {
          walk(decl, node);
        });
      }
      return;
    }

    if (nodeType === 'VariableDeclarator') {
      if (node.id && node.id.type === 'Identifier') {
        declareInScope(node.id.name, node);
      }
      if (node.init) walk(node.init, node);
      return;
    }

    if (nodeType === 'BinaryExpression') {
      if (node.operator === '==' || node.operator === '!=') {
        issues.push({
          line: node.loc.start.line,
          message: "Use '" + (node.operator === '==' ? '===' : '!==') + "' instead of '" + node.operator + "'",
          severity: 'warning',
          category: 'lint',
        });
      }
    }

    if (nodeType === 'DebuggerStatement') {
      issues.push({
        line: node.loc.start.line,
        message: 'Remove debugger statement from production code',
        severity: 'warning',
        category: 'lint',
      });
    }

    if (nodeType === 'CallExpression' && node.callee && node.callee.type === 'MemberExpression') {
      if (node.callee.object && node.callee.object.name === 'console' && node.callee.property) {
        if (node.callee.property.name === 'log' || node.callee.property.name === 'debug') {
          issues.push({
            line: node.loc.start.line,
            message: 'Remove console.log() from production code',
            severity: 'info',
            category: 'lint',
          });
        }
      }
    }

    if (nodeType === 'TryStatement' && node.handler) {
      if (node.handler.body) {
        var hasStatement = node.handler.body.body && node.handler.body.body.length > 0;
        if (!hasStatement) {
          issues.push({
            line: node.loc.start.line,
            message: 'Empty catch block — at minimum log the error',
            severity: 'warning',
            category: 'lint',
          });
        }
      }
    }

    checkIdentifier(node, parent);

    for (var key in node) {
      if (key === 'start' || key === 'end' || key === 'loc' || key === 'type' || key === 'parent') continue;
      var child = node[key];
      if (Array.isArray(child)) {
        for (var ci = 0; ci < child.length; ci++) {
          if (child[ci] && typeof child[ci] === 'object' && child[ci].type) {
            walk(child[ci], node);
          }
        }
      } else if (child && typeof child === 'object' && child.type) {
        walk(child, node);
      }
    }
  }

  var hoistedFuncs = new Set();
  (function collectHoisted(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && node.id) {
      hoistedFuncs.add(node.id.name);
    }
    for (var key in node) {
      if (key === 'start' || key === 'end' || key === 'loc' || key === 'type') continue;
      var child = node[key];
      if (Array.isArray(child)) {
        child.forEach(function(c) { if (c && typeof c === 'object' && c.type) collectHoisted(c); });
      } else if (child && typeof child === 'object' && child.type) {
        collectHoisted(child);
      }
    }
  })(ast);

  walk(ast, null);

  for (var di = 0; di < allDeclarations.length; di++) {
    var decl = allDeclarations[di];
    if (!decl.info.used && decl.name !== 'arguments') {
      issues.push({
        line: decl.info.line,
        message: "'" + decl.name + "' is declared but never used",
        severity: 'warning',
        category: 'lint',
      });
    }
  }

  return issues;
}

function cqaLintPython(code) {
  var issues = [];
  var lines = code.split('\n');
  var indents = [];

  lines.forEach(function(raw, idx) {
    var line = raw;
    var lineNum = idx + 1;
    var trimmed = line.trim();

    if (!trimmed) return;

    var leading = line.search(/\S/);
    var indent = leading > 0 ? leading : 0;

    if (indents.length > 0 && indent > 0) {
      var lastIndent = indents[indents.length - 1];
      if (indent % 4 !== 0 && indent % 2 !== 0) {
        issues.push({
          line: lineNum,
          message: 'Inconsistent indentation — expected multiple of 2 or 4 spaces',
          severity: 'warning',
          category: 'lint',
        });
      }
    }

    if (trimmed.match(/^except\s*:/)) {
      issues.push({
        line: lineNum,
        message: 'Bare except clause — catches all exceptions including KeyboardInterrupt. Use except Exception:',
        severity: 'warning',
        category: 'lint',
      });
    }

    if (trimmed.match(/^def\s+\w+\s*\(.*\)\s*:/)) {
      var match = trimmed.match(/^def\s+\w+\s*\((.*)\)\s*:/);
      if (match) {
        var params = match[1];
        if (params.match(/\[\s*\]|\{\s*\}|\{\s*}|\(\s*\)/)) {
          issues.push({
            line: lineNum,
            message: 'Mutable default argument (list/dict/set) — use None instead and initialize inside function',
            severity: 'warning',
            category: 'lint',
          });
        }
      }
    }

    if (trimmed.match(/\b(==|is not)\s+None\b/) && !trimmed.match(/is None/)) {
      if (trimmed.match(/==\s+None/)) {
        issues.push({
          line: lineNum,
          message: 'Use "is None" instead of "== None" for identity comparison',
          severity: 'warning',
          category: 'lint',
        });
      }
    }

    if (trimmed.match(/==\s+(True|False)\b/) && !trimmed.match(/is (True|False)/)) {
      issues.push({
        line: lineNum,
        message: 'Use "is" instead of "==" for boolean comparison',
        severity: 'warning',
        category: 'lint',
      });
    }

    if (trimmed.match(/^from\s+\S+\s+import\s+\*/)) {
      issues.push({
        line: lineNum,
        message: 'Wildcard import — imports all names into namespace. Import only what you need.',
        severity: 'warning',
        category: 'lint',
      });
    }

    if (trimmed.match(/^(import|from)\s+.*print/i)) {
      void 0;
    }

    if (trimmed.match(/^class\s+\w+\s*\(.*\)\s*:/)) {
      var clsMatch = trimmed.match(/^class\s+(\w+)\s*\(.*\)\s*:/);
      if (clsMatch) {
        var clsName = clsMatch[1];
        var hasSelf = false;
        for (var k = idx + 1; k < Math.min(idx + 6, lines.length); k++) {
          if (lines[k].trim().match(/^def\s+\w+\s*\(/)) {
            var defLine = lines[k].trim();
            if (!defLine.match(/\(self/)) {
              issues.push({
                line: idx + 2 + (k - idx - 1),
                message: 'Method definition missing "self" as first parameter',
                severity: 'error',
                category: 'lint',
              });
              break;
            }
          }
        }
      }
    }

    if (trimmed.length > 100) {
      issues.push({
        line: lineNum,
        message: 'Line too long (' + trimmed.length + ' > 100 characters). Consider breaking into multiple lines.',
        severity: 'info',
        category: 'lint',
      });
    }

    indents.push(indent);
  });

  return issues;
}

function cqaDSAnalyze(code, lang) {
  var issues = [];
  var lines = code.split('\n');
  var codeStr = code;
  var lowerCode = codeStr.toLowerCase();

  var hasHashMapSuggestion = false;
  var hasMemoSuggestion = false;
  var hasShiftSuggestion = false;

  lines.forEach(function(raw, idx) {
    var line = raw.trim();
    var lineNum = idx + 1;
    if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*') || line.startsWith('*')) return;

    var nextLines = '';
    for (var k = idx + 1; k < Math.min(idx + 4, lines.length); k++) {
      nextLines += lines[k] + '\n';
    }

    if ((line.match(/for\s*\(/g) || []).length >= 1 && (nextLines.match(/for\s*\(/g) || []).length >= 1) {
      if (!hasHashMapSuggestion) {
        hasHashMapSuggestion = true;
        issues.push({
          line: lineNum,
          message: 'Nested loop detected — O(n\u00B2) complexity. Consider using a hash map (Map/Set) for O(n) lookup.',
          severity: 'warning',
          category: 'dsa',
        });
      }
    }

    if (lang === 'python') {
      var pyForCount = (line.match(/\bfor\s+\w+\s+in\s+/g) || []).length;
      var pyWhileCount = (line.match(/\bwhile\s+/g) || []).length;
      var nextPyFor = (nextLines.match(/\bfor\s+\w+\s+in\s+/g) || []).length;
      var nextPyWhile = (nextLines.match(/\bwhile\s+/g) || []).length;
      if ((pyForCount + pyWhileCount) > 0 && (nextPyFor + nextPyWhile) > 0) {
        if (!hasHashMapSuggestion) {
          hasHashMapSuggestion = true;
          issues.push({
            line: lineNum,
            message: 'Nested loop detected — O(n\u00B2) complexity. Consider using a hash map (dict/set) for O(n) lookup.',
            severity: 'warning',
            category: 'dsa',
          });
        }
      }
    }

    if ((lang === 'javascript' || lang === 'python') && !hasShiftSuggestion) {
      if (line.match(/\.shift\(\)/) && (nextLines.match(/for\s*\(/) || nextLines.match(/\bwhile\s+/) || line.match(/\bwhile\s+/))) {
        hasShiftSuggestion = true;
        issues.push({
          line: lineNum,
          message: 'Array.shift() inside a loop is O(n) per call due to re-indexing. Use a pointer/index for O(1) dequeue.',
          severity: 'warning',
          category: 'dsa',
        });
      }
    }

    if (!hasShiftSuggestion && lang === 'python') {
      if (line.match(/\.pop\(0\)/) && (nextLines.match(/\bfor\s*\(/) || nextLines.match(/\bwhile\s+/) || line.match(/\bwhile\s+/))) {
        hasShiftSuggestion = true;
        issues.push({
          line: lineNum,
          message: 'list.pop(0) inside a loop is O(n) per call. Use collections.deque for O(1) popleft().',
          severity: 'warning',
          category: 'dsa',
        });
      }
    }

    if (!hasHashMapSuggestion && (lang === 'javascript' || lang === 'python')) {
      if ((line.match(/\.indexOf\(/) || line.match(/\.includes\(/)) && (nextLines.match(/for\s*\(/) || nextLines.match(/\bwhile\s+/))) {
        hasHashMapSuggestion = true;
        issues.push({
          line: lineNum,
          message: '.indexOf()/.includes() inside a loop is O(n\u00B2). Use a Set for O(1) lookups.',
          severity: 'warning',
          category: 'dsa',
        });
      }
    }

    if (!hasMemoSuggestion && (line.match(/return\s+\w+\(.*\)\s*[+\-*/]\s*\w+\(/) || line.match(/return\s+\w+\(.*\)\s*\+\s*\w+\(/))) {
      var hasMemoCheck = false;
      for (var m = Math.max(0, idx - 10); m < Math.min(lines.length, idx + 5); m++) {
        if (lines[m].match(/memo|cache|dp\[|Map\.(get|set|has)/)) {
          hasMemoCheck = true;
          break;
        }
      }
      if (!hasMemoCheck) {
        hasMemoSuggestion = true;
        issues.push({
          line: lineNum,
          message: 'Recursive branching without memoization causes exponential O(2\u207F) time. Add memo/cache to cache results.',
          severity: 'warning',
          category: 'dsa',
        });
      }
    }

    var funcMatch = line.match(/^\s*(function\s+\w+|def\s+\w+)/);
    if (funcMatch) {
      var bodyStart = idx + 1;
      var hasReturn = false;
      var hasBaseCase = false;
      for (var bi = bodyStart; bi < Math.min(lines.length, bodyStart + 8); bi++) {
        if (lines[bi].trim().match(/^return\s/)) hasReturn = true;
        if (lines[bi].trim().match(/\bif\s+/) || lines[bi].trim().match(/^\s*if\s/)) hasBaseCase = true;
      }

      var callsSelf = false;
      var funcName = line.match(/^\s*(?:function\s+(\w+)|def\s+(\w+))/);
      var name = funcName ? (funcName[1] || funcName[2]) : null;
      if (name) {
        for (var ci = bodyStart; ci < lines.length; ci++) {
          if (lines[ci].match(new RegExp('\\b' + name + '\\s*\\(', 'g'))) {
            callsSelf = true;
            break;
          }
          if (ci - bodyStart > 25) break;
        }
      }

      if (callsSelf && !hasBaseCase) {
        issues.push({
          line: lineNum,
          message: 'Recursive function "' + (name || 'anonymous') + '" may be missing a base case — could cause infinite recursion.',
          severity: 'error',
          category: 'dsa',
        });
      }
    }

    if (lang === 'javascript') {
      if (line.match(/\+\s*=\s*['"`]/) || line.match(/=\s*['"`]\s*\+/) || (line.match(/\+=\s*[a-zA-Z]/) && !line.match(/\+=\s*[0-9]/))) {
        issues.push({
          line: lineNum,
          message: 'String concatenation with += in a loop is O(n\u00B2). Use array push + join for efficient string building.',
          severity: 'warning',
          category: 'dsa',
        });
      }
    }

    if (line.match(/^\s*{\s*}$/) || line.match(/^\s*{\s*}\s*;?\s*$/)) {
      issues.push({
        line: lineNum,
        message: 'Empty block — likely contains dead code or incomplete implementation',
        severity: 'info',
        category: 'dsa',
      });
    }
  });

  var bigOCheck = codeStr.match(/O\(.*\)/g);
  if (bigOCheck) {
    bigOCheck.forEach(function(m) {
      var idx2 = codeStr.indexOf(m);
      var lineBefore = codeStr.substring(0, idx2).split('\n').length;
      if (m.match(/O\(n\^?2\)|O\(n\^2\)|O\(n\^3\)|O\(2\^n\)|O\(n!\)/)) {
        issues.push({
          line: lineBefore,
          message: 'High complexity ' + m + ' term in code — verify if this is acceptable for the problem constraints.',
          severity: 'info',
          category: 'dsa',
        });
      }
    });
  }

  var issueLines = {};
  issues = issues.filter(function(iss) {
    var key = iss.line + '|' + iss.message;
    if (issueLines[key]) return false;
    issueLines[key] = true;
    return true;
  });

  return issues;
}

function cqaGradeReadability(code) {
  if (!code || !code.trim()) {
    return { grade: 'N/A', score: 0, details: {} };
  }

  var lines = code.split('\n');
  var nonEmptyLines = lines.filter(function(l) { return l.trim().length > 0; });
  var totalLines = lines.length;

  var functions = cqaExtractFunctions(code);
  var maxNesting = cqaMeasureNesting(code);
  var namingScore = cqaScoreNaming(code);
  var commentScore = cqaScoreComments(lines);
  var paramScore = cqaScoreParams(code);
  var lineLengthScore = cqaScoreLineLength(lines);

  var functionScore = cqaScoreFunctionLength(functions);

  var weightedScore = Math.round(
    functionScore * CQA_READABILITY_WEIGHTS.functionLength +
    cqaScoreNesting(maxNesting) * CQA_READABILITY_WEIGHTS.nestingDepth +
    namingScore * CQA_READABILITY_WEIGHTS.namingQuality +
    commentScore * CQA_READABILITY_WEIGHTS.commentRatio +
    paramScore * CQA_READABILITY_WEIGHTS.paramCount +
    lineLengthScore * CQA_READABILITY_WEIGHTS.lineLength
  );

  var grade = cqaScoreToGrade(weightedScore);

  return {
    grade: grade,
    score: weightedScore,
    details: {
      functionScore: functionScore,
      nestingScore: cqaScoreNesting(maxNesting),
      namingScore: namingScore,
      commentScore: commentScore,
      paramScore: paramScore,
      lineLengthScore: lineLengthScore,
    },
    metrics: {
      functionCount: functions.length,
      maxFunctionLength: functions.length > 0 ? Math.max.apply(null, functions.map(function(f) { return f.lineCount; })) : 0,
      maxNesting: maxNesting,
      commentRatio: cqaComputeCommentRatio(lines),
      totalLines: totalLines,
    },
  };
}

function cqaExtractFunctions(code) {
  var funcs = [];
  var funcRegex = /(?:function\s+(\w+)|(\w+)\s*=\s*function|(\w+)\s*\([^)]*\)\s*{)/g;
  var match;
  while ((match = funcRegex.exec(code)) !== null) {
    var name = match[1] || match[2] || match[3] || 'anonymous';
    var startLine = code.substring(0, match.index).split('\n').length;

    var braceCount = 0;
    var started = false;
    var endIdx = match.index + match[0].length;
    var funcLines = 0;

    for (var ci = endIdx; ci < code.length; ci++) {
      if (code[ci] === '{') { braceCount++; started = true; }
      else if (code[ci] === '}') { braceCount--; }
      if (started && braceCount === 0) {
        funcLines = code.substring(match.index, ci + 1).split('\n').length;
        break;
      }
    }

    if (funcLines > 0) {
      funcs.push({ name: name, lineCount: funcLines, startLine: startLine });
    }
  }

  var arrowFuncRegex = /(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g;
  while ((match = arrowFuncRegex.exec(code)) !== null) {
    var aName = match[1];
    var aStartLine = code.substring(0, match.index).split('\n').length;
    var aBraceCount = 0;
    var aStarted = false;
    var aEndIdx = match.index + match[0].length;
    var aFuncLines = 0;

    for (var ci2 = aEndIdx; ci2 < code.length; ci2++) {
      if (code[ci2] === '{') { aBraceCount++; aStarted = true; }
      else if (code[ci2] === '}') { aBraceCount--; }
      if (aStarted && aBraceCount === 0) {
        aFuncLines = code.substring(match.index, ci2 + 1).split('\n').length;
        break;
      }
    }

    if (aFuncLines > 0) {
      funcs.push({ name: aName, lineCount: aFuncLines, startLine: aStartLine });
    }
  }

  return funcs;
}

function cqaScoreFunctionLength(funcs) {
  if (funcs.length === 0) return 100;
  var totalScore = 0;
  funcs.forEach(function(f) {
    var len = f.lineCount;
    if (len <= 15) totalScore += 100;
    else if (len <= 25) totalScore += 85;
    else if (len <= 40) totalScore += 65;
    else if (len <= 60) totalScore += 40;
    else totalScore += 20;
  });
  return Math.round(totalScore / funcs.length);
}

function cqaMeasureNesting(code) {
  var maxDepth = 0;
  var currentDepth = 0;
  var lines = code.split('\n');
  var nestingKeywords = /\b(for|while|if|else if|elif|switch|catch|with)\b/;

  lines.forEach(function(line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;

    var opens = (trimmed.match(/\{/g) || []).length;
    var closes = (trimmed.match(/\}/g) || []).length;

    if (trimmed.match(nestingKeywords) || opens > closes) {
      currentDepth++;
    }

    if (opens < closes) {
      currentDepth -= (closes - opens);
    }

    if (currentDepth > maxDepth) maxDepth = currentDepth;
  });

  return maxDepth;
}

function cqaScoreNesting(depth) {
  if (depth <= 1) return 100;
  if (depth <= 2) return 90;
  if (depth <= 3) return 70;
  if (depth <= 4) return 50;
  if (depth <= 5) return 30;
  return 10;
}

function cqaScoreNaming(code) {
  var penalties = 0;
  var tokens = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
  var seen = {};

  tokens.forEach(function(t) {
    if (seen[t]) return;
    seen[t] = true;

    if (t.length === 1 && !t.match(/^[A-Z]$/) && !CQA_SHORT_NAMES.has(t)) {
      penalties += 3;
    }

    if (CQA_BAD_NAMES.has(t)) {
      penalties += 8;
    }

    if (t.length > 30) {
      penalties += 5;
    }

    if (t.match(/^[a-z]+_[a-z]+/) && !t.match(/^[A-Z]/)) {
      penalties += 2;
    }
  });

  return Math.max(0, Math.min(100, 100 - penalties));
}

function cqaScoreComments(lines) {
  var commentLines = 0;
  var totalNonEmpty = 0;
  var inBlockComment = false;

  lines.forEach(function(line) {
    var trimmed = line.trim();
    if (!trimmed) return;
    totalNonEmpty++;

    if (inBlockComment) {
      commentLines++;
      if (trimmed.includes('*/')) inBlockComment = false;
      return;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      commentLines++;
      return;
    }

    if (trimmed.startsWith('/*')) {
      commentLines++;
      if (!trimmed.includes('*/')) inBlockComment = true;
      return;
    }
  });

  var ratio = totalNonEmpty > 0 ? commentLines / totalNonEmpty : 0;

  if (ratio >= 0.08 && ratio <= 0.30) return 100;
  if (ratio >= 0.04 && ratio < 0.08) return 75;
  if (ratio > 0.30 && ratio <= 0.45) return 65;
  if (ratio < 0.04 && ratio > 0) return 45;
  return 30;
}

function cqaComputeCommentRatio(lines) {
  var commentLines = 0;
  var total = 0;
  var inBlock = false;

  lines.forEach(function(line) {
    var t = line.trim();
    if (!t) return;
    total++;
    if (inBlock) { commentLines++; if (t.includes('*/')) inBlock = false; return; }
    if (t.startsWith('//') || t.startsWith('#')) { commentLines++; return; }
    if (t.startsWith('/*')) { commentLines++; if (!t.includes('*/')) inBlock = true; }
  });

  return total > 0 ? Math.round((commentLines / total) * 100) : 0;
}

function cqaScoreParams(code) {
  if (!code) return 100;
  var funcDefs = code.match(/(?:function|def)\s+\w+\s*\([^)]*\)/g) || [];
  var arrowDefs = code.match(/(?:const|let|var)\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || [];
  var allDefs = funcDefs.concat(arrowDefs);
  if (allDefs.length === 0) return 100;

  var maxParams = 0;
  allDefs.forEach(function(def) {
    var match = def.match(/\(([^)]*)\)/);
    if (match) {
      var count = match[1].split(',').filter(function(p) { return p.trim().length > 0; }).length;
      if (count > maxParams) maxParams = count;
    }
  });

  if (maxParams <= 3) return 100;
  if (maxParams <= 5) return 70;
  if (maxParams <= 7) return 50;
  return 30;
}

function cqaScoreLineLength(lines) {
  var violations = 0;
  lines.forEach(function(line) {
    if (line.length > 100) violations++;
  });
  var deduction = violations * 5;
  return Math.max(0, 100 - deduction);
}

function cqaScoreToGrade(score) {
  var grades = ['A', 'B', 'C', 'D', 'F'];
  var configs = [90, 75, 60, 40, 0];
  for (var i = 0; i < configs.length; i++) {
    if (score >= configs[i]) return grades[i];
  }
  return 'F';
}

function cqaRenderSummary(issues, readability) {
  var el = document.getElementById('cqaSummary');
  if (!el) return;

  var errorCount = 0;
  var warningCount = 0;
  var infoCount = 0;

  issues.forEach(function(iss) {
    if (iss.severity === 'error') errorCount++;
    else if (iss.severity === 'warning') warningCount++;
    else infoCount++;
  });

  var grade = readability ? readability.grade : 'N/A';
  var gradeCls = 'cqa-grade-' + grade;

  el.innerHTML =
    '<div class="cqa-summary-grid">' +
      '<div class="cqa-summary-item">' +
        '<span class="cqa-summary-icon cqa-sev-error"><i class="fas fa-times-circle"></i></span>' +
        '<span class="cqa-summary-count">' + errorCount + '</span>' +
        '<span class="cqa-summary-label">Errors</span>' +
      '</div>' +
      '<div class="cqa-summary-item">' +
        '<span class="cqa-summary-icon cqa-sev-warning"><i class="fas fa-exclamation-triangle"></i></span>' +
        '<span class="cqa-summary-count">' + warningCount + '</span>' +
        '<span class="cqa-summary-label">Warnings</span>' +
      '</div>' +
      '<div class="cqa-summary-item">' +
        '<span class="cqa-summary-icon cqa-sev-info"><i class="fas fa-info-circle"></i></span>' +
        '<span class="cqa-summary-count">' + infoCount + '</span>' +
        '<span class="cqa-summary-label">Info</span>' +
      '</div>' +
      '<div class="cqa-summary-item ' + (gradeCls) + '">' +
        '<span class="cqa-summary-grade">' + cqaEsc(grade) + '</span>' +
        '<span class="cqa-summary-label">Readability</span>' +
      '</div>' +
    '</div>';
}

function cqaRenderIssues(issues) {
  var el = document.getElementById('cqaIssuesList');
  if (!el) return;

  if (issues.length === 0) {
    el.innerHTML =
      '<div class="cqa-issues-empty">' +
        '<i class="fas fa-check-circle"></i>' +
        '<p>No issues found. Clean code!</p>' +
      '</div>';
    return;
  }

  el.innerHTML = issues.map(function(iss) {
    var severityCls = 'cqa-sev-' + iss.severity;
    var iconMap = { error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    var icon = iconMap[iss.severity] || 'fa-info-circle';
    var labelMap = { error: 'Error', warning: 'Warning', info: 'Info' };
    var severityLabel = labelMap[iss.severity] || 'Info';
    var catLabel = iss.category === 'dsa' ? 'DSA' : 'Lint';

    return '<div class="cqa-issue-item ' + severityCls + '" data-line="' + iss.line + '" data-severity="' + iss.severity + '" role="button" tabindex="0" title="Click to jump to line ' + iss.line + '">' +
      '<span class="cqa-issue-line">' + iss.line + '</span>' +
      '<span class="cqa-issue-icon"><i class="fas ' + icon + '"></i></span>' +
      '<span class="cqa-issue-body">' +
        '<span class="cqa-issue-msg">' + cqaEsc(iss.message) + '</span>' +
        '<span class="cqa-issue-meta">' +
          '<span class="cqa-issue-tag ' + severityCls + '">' + severityLabel + '</span>' +
          '<span class="cqa-issue-tag cqa-issue-cat">' + catLabel + '</span>' +
          '<span class="cqa-issue-line-ref">Line ' + iss.line + '</span>' +
        '</span>' +
      '</span>' +
    '</div>';
  }).join('');
}

function cqaRenderReadability(readability) {
  var el = document.getElementById('cqaReadability');
  if (!el || !readability) return;

  var grade = readability.grade;
  var gradeConfig = CQA_GRADE_CONFIG[grade] || CQA_GRADE_CONFIG['F'];
  var gradeCls = 'cqa-grade-' + grade;
  var details = readability.details || {};
  var metrics = readability.metrics || {};

  var detailBars = '';
  var detailItems = [
    { key: 'functionScore', label: 'Function Length', score: details.functionScore || 0 },
    { key: 'nestingScore', label: 'Nesting Depth', score: details.nestingScore || 0 },
    { key: 'namingScore', label: 'Naming Quality', score: details.namingScore || 0 },
    { key: 'commentScore', label: 'Comment Ratio', score: details.commentScore || 0 },
    { key: 'paramScore', label: 'Parameter Count', score: details.paramScore || 0 },
    { key: 'lineLengthScore', label: 'Line Length', score: details.lineLengthScore || 0 },
  ];

  detailItems.forEach(function(item) {
    var barColor = 'cqa-bar-score';
    if (item.score < 40) barColor = 'cqa-bar-low';
    else if (item.score < 70) barColor = 'cqa-bar-mid';
    detailBars +=
      '<div class="cqa-detail-row">' +
        '<span class="cqa-detail-label">' + item.label + '</span>' +
        '<div class="cqa-detail-bar-bg">' +
          '<div class="cqa-detail-bar ' + barColor + '" style="width:' + item.score + '%"></div>' +
        '</div>' +
        '<span class="cqa-detail-score">' + item.score + '</span>' +
      '</div>';
  });

  el.innerHTML =
    '<div class="cqa-readability-header">' +
      '<div class="cqa-grade-badge ' + gradeCls + '">' +
        '<span class="cqa-grade-letter">' + cqaEsc(grade) + '</span>' +
        '<span class="cqa-grade-label">' + cqaEsc(gradeConfig.label) + '</span>' +
      '</div>' +
      '<div class="cqa-grade-icon"><i class="fas ' + gradeConfig.icon + '"></i></div>' +
      '<div class="cqa-grade-score">' + readability.score + '<span class="cqa-grade-total">/100</span></div>' +
    '</div>' +
    '<div class="cqa-readability-metrics">' +
      '<span title="Functions"><i class="fas fa-functions"></i> ' + metrics.functionCount + ' funcs</span>' +
      '<span title="Max nesting"><i class="fas fa-indent"></i> Depth ' + metrics.maxNesting + '</span>' +
      '<span title="Comments"><i class="fas fa-comment"></i> ' + metrics.commentRatio + '% comments</span>' +
      '<span title="Total lines"><i class="fas fa-lines"></i> ' + metrics.totalLines + ' lines</span>' +
    '</div>' +
    '<div class="cqa-readability-details">' + detailBars + '</div>';
}

function cqaHighlightLine(lineNum) {
  var editor = document.getElementById('cqaEditor');
  var lineNums = document.getElementById('cqaLineNums');
  if (!editor || !lineNums) return;

  document.querySelectorAll('.cqa-line-num-highlight').forEach(function(el) {
    el.classList.remove('cqa-line-num-highlight');
  });

  var lineNumEl = lineNums.querySelector('[data-line="' + lineNum + '"]');
  if (lineNumEl) {
    lineNumEl.classList.add('cqa-line-num-highlight');
  }

  var lines = editor.value.split('\n');
  var charPos = 0;
  for (var i = 0; i < lineNum - 1 && i < lines.length; i++) {
    charPos += lines[i].length + 1;
  }

  editor.focus();
  if (typeof editor.selectionStart !== 'undefined') {
    editor.setSelectionRange(charPos, charPos);
  }

  var computedStyle = window.getComputedStyle(editor);
  var lineH = parseFloat(computedStyle.lineHeight) || 25;
  var scrollTarget = Math.max(0, (lineNum - 1) * lineH - editor.clientHeight / 3);
  editor.scrollTop = scrollTarget;

  if (cqaHighlightTimeout) clearTimeout(cqaHighlightTimeout);
  cqaHighlightTimeout = setTimeout(function() {
    document.querySelectorAll('.cqa-line-num-highlight').forEach(function(el) {
      el.classList.remove('cqa-line-num-highlight');
    });
  }, 3000);
}

function cqaRenderLineNums(code) {
  var el = document.getElementById('cqaLineNums');
  if (!el) return;
  var count = code.split('\n').length;
  var html = '';
  for (var i = 0; i < count; i++) {
    html += '<span class="cqa-line-num" data-line="' + (i + 1) + '">' + (i + 1) + '</span>';
  }
  el.innerHTML = html;
}

function cqaSyncLineNums() {
  var editor = document.getElementById('cqaEditor');
  var lineNums = document.getElementById('cqaLineNums');
  if (!editor || !lineNums) return;
  lineNums.scrollTop = editor.scrollTop;
}

function cqaResetResultsDisplay() {
  var summary = document.getElementById('cqaSummary');
  if (summary) {
    summary.innerHTML = '<div class="cqa-placeholder"><i class="fas fa-search"></i><p>Click "Analyze Code" to check for issues.</p></div>';
  }

  var issuesList = document.getElementById('cqaIssuesList');
  if (issuesList) {
    issuesList.innerHTML = '<div class="cqa-placeholder"><p>Issues will appear here after analysis.</p></div>';
  }

  var readability = document.getElementById('cqaReadability');
  if (readability) {
    readability.innerHTML = '<div class="cqa-placeholder"><p>Readability grade will appear here.</p></div>';
  }

  document.querySelectorAll('.cqa-line-num-highlight').forEach(function(el) {
    el.classList.remove('cqa-line-num-highlight');
  });

  cqaIssues = [];
}

function cqaClearResults() {
  var editor = document.getElementById('cqaEditor');
  var lineNums = document.getElementById('cqaLineNums');
  if (lineNums) lineNums.innerHTML = '';

  document.querySelectorAll('.cqa-preset-btn').forEach(function(b) {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });

  cqaResetResultsDisplay();
}

function cqaEsc(str) {
  var d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}
