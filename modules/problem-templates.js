/**
 * modules/problem-templates.js
 * Pure functions for generating starter code and test harness wrappers.
 * No DOM dependencies — usable both client-side and server-side.
 *
 * Extracted and enhanced from modules/editor.js:
 * - getDefaultCode → getStarterCode
 * - buildHarnessCode → buildHarness
 * - All language-specific harness generators
 */

/* ─── Type helpers ─── */

export function inferType(v) {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) {
    if (v.length === 0) return 'int[]';
    const inner = inferType(v[0]);
    return inner === 'null' ? 'int[]' : inner + '[]';
  }
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
  if (typeof v === 'string') return 'string';
  if (typeof v === 'boolean') return 'bool';
  return 'int';
}

export function mapType(jt, lang) {
  const m = {
    'int[]': { java: 'int[]', cpp: 'vector<int>', c: 'int*', swift: '[Int]' },
    'int[][]': { java: 'int[][]', cpp: 'vector<vector<int>>', c: 'int**', swift: '[[Int]]' },
    'float[]': { java: 'double[]', cpp: 'vector<double>', c: 'double*', swift: '[Double]' },
    'string[]': { java: 'String[]', cpp: 'vector<string>', c: 'char**', swift: '[String]' },
    'string[][]': { java: 'String[][]', cpp: 'vector<vector<string>>', c: 'char***', swift: '[[String]]' },
    'bool[]': { java: 'boolean[]', cpp: 'vector<bool>', c: 'int*', swift: '[Bool]' },
    'bool[][]': { java: 'boolean[][]', cpp: 'vector<vector<bool>>', c: 'int**', swift: '[[Bool]]' },
    'int': { java: 'int', cpp: 'int', c: 'int', swift: 'Int' },
    'float': { java: 'double', cpp: 'double', c: 'double', swift: 'Double' },
    'string': { java: 'String', cpp: 'string', c: 'char*', swift: 'String' },
    'bool': { java: 'boolean', cpp: 'bool', c: 'int', swift: 'Bool' },
  };
  return m[jt]?.[lang] || 'auto';
}

function valToLit(v, t) {
  if (t === 'int[]') return '[' + v.map((x) => (x == null ? 0 : x)).join(',') + ']';
  if (t === 'int[][]') return '[' + v.map((row) => '[' + row.join(',') + ']').join(',') + ']';
  if (t === 'float[]') return '[' + v.map((x) => (x == null ? 0 : x)).join(',') + ']';
  if (t === 'string') return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  if (t === 'bool') return v ? 'true' : 'false';
  if (t === 'string[]') return '[' + v.map((x) => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + ']';
  if (t === 'string[][]') return '[' + v.map((row) => '[' + row.map((x) => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + ']').join(',') + ']';
  return String(v);
}

/* ─── Starter code ─── */

export function getStarterCode(lang, problem) {
  if (!problem) return '';
  const fnName = problem.functionName || 'solution';
  const params = problem.params || [];
  const tc = problem.testCases?.[0];
  const isClass = /^[A-Z]/.test(fnName);
  if (isClass) return getClassStarter(lang, problem);

  const paramTypes = tc?.input ? tc.input.map((v) => mapType(inferType(v), lang)) : [];
  const retType = tc?.expected !== undefined ? mapType(inferType(tc.expected), lang) : 'auto';
  const docComment = buildDocComment(problem.guide, lang);

  const paramStr = params.length
    ? params.map((p, i) => {
        const t = paramTypes[i] || 'auto';
        if (lang === 'cpp') return t + ' ' + p;
        if (lang === 'c') {
          const origJt = tc?.input ? inferType(tc.input[i]) : null;
          const is2d = origJt === 'int[][]';
          const isArray = origJt && origJt.endsWith('[]');
          if (is2d) return t + ' ' + p + ', int* ' + p + 'Sizes, int ' + p + 'Size';
          if (isArray) return t + ' ' + p + ', int ' + p + 'Size';
          return t + ' ' + p;
        }
        if (lang === 'java') return t + ' ' + p;
        if (lang === 'swift') return '_ ' + p + ': ' + t;
        return p;
      }).join(', ')
    : 'params';

  const templates = {
    javascript: docComment + 'function ' + fnName + '(' + (params.join(', ') || 'params') + ') {\n    \n}',
    python: docComment + 'def ' + fnName + '(' + (params.join(', ') || 'params') + '):\n    pass\n',
    java: 'class Solution {\n' + docComment.replace(/^(.)/gm, '    $1') + '    public ' + retType + ' ' + fnName + '(' + paramStr + ') {\n        \n    }\n}',
    cpp: '#include <string>\n#include <vector>\n#include <stack>\nusing namespace std;\n\n' + docComment + retType + ' ' + fnName + '(' + paramStr + ') {\n    \n}',
    c: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\n' + docComment + retType + ' ' + fnName + '(' + paramStr + ') {\n    \n}',
    swift: docComment + 'func ' + fnName + '(' + paramStr + ') -> ' + retType + ' {\n    \n}',
  };
  return templates[lang] || templates.javascript;
}

function buildDocComment(guide, lang) {
  return '';
}

function extractMethods(problem) {
  const map = new Map();
  for (const tc of (problem.testCases || [])) {
    if (tc.methods && Array.isArray(tc.methods)) {
      for (const m of tc.methods) {
        const name = m[0];
        const argc = Math.max(0, m.length - 1);
        if (!map.has(name) || map.get(name) < argc) map.set(name, argc);
      }
    }
  }
  return map;
}

function getClassStarter(lang, problem) {
  const fnName = problem.functionName || 'LRUCache';
  const params = problem.params || [];
  const docComment = buildDocComment(problem.guide, lang);
  const paramStr = params.map((p) => { const t = mapType('int', lang); if (lang === 'cpp') return t + ' ' + p; if (lang === 'java') return t + ' ' + p; if (lang === 'swift') return '_ ' + p + ': ' + t; return p; }).join(', ');

  const methods = extractMethods(problem);
  const pn = (n) => n === 0 ? '' : n === 1 ? 'val' : n === 2 ? 'key, value' : Array.from({length: n}, (_, i) => `val${i + 1}`).join(', ');
  const getterSet = new Set(['get', 'getMin', 'getMax', 'top', 'peek', 'peekMin', 'peekMax']);
  for (const tc of (problem.testCases || [])) {
    if (tc.methods && tc.methods.length > 0 && tc.expected !== undefined && tc.expected !== null) {
      getterSet.add(tc.methods[tc.methods.length - 1][0]);
    }
  }
  const getter = (n) => getterSet.has(n);

  const has = methods.size > 0;
  const js = has ? [...methods].map(([n, a]) => `\n\n    ${n}(${pn(a)}) {\n        \n    }`).join('') : '\n\n    get(key) {\n        \n    }\n\n    put(key, value) {\n        \n    }';
  const py = has ? [...methods].map(([n, a]) => {
    const p = a === 0 ? 'self' : a === 1 ? 'self, val' : a === 2 ? 'self, key: int, value: int' : `self, ${Array.from({length: a}, (_, i) => `param${i + 1}: int`).join(', ')}`;
    return `\n\n    def ${n}(${p})${getter(n) ? ' -> int' : ' -> None'}:\n        pass`;
  }).join('') : '\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass';
  const java = has ? [...methods].map(([n, a]) => {
    const rt = getter(n) ? 'int' : 'void';
    const p = a === 0 ? '' : a === 1 ? 'int val' : a === 2 ? 'int key, int value' : Array.from({length: a}, (_, i) => `int val${i + 1}`).join(', ');
    return `\n\n    public ${rt} ${n}(${p})${rt === 'void' ? ' {\n        \n    }' : ' {\n        return 0;\n    }'}`;
  }).join('') : '\n\n    public int get(int key) {\n        return 0;\n    }\n\n    public void put(int key, int value) {\n        \n    }';
  const cpp = has ? [...methods].map(([n, a]) => {
    const rt = getter(n) ? 'int' : 'void';
    const p = a === 0 ? '' : a === 1 ? 'int val' : a === 2 ? 'int key, int value' : Array.from({length: a}, (_, i) => `int val${i + 1}`).join(', ');
    return `\n\n    ${rt} ${n}(${p})${rt === 'void' ? ' {\n        \n    }' : ' {\n        return 0;\n    }'}`;
  }).join('') : '\n\n    int get(int key) {\n        return 0;\n    }\n\n    void put(int key, int value) {\n        \n    }';
  const swift = has ? [...methods].map(([n, a]) => {
    const p = a === 0 ? '' : a === 1 ? '_ val: Int' : a === 2 ? '_ key: Int, _ value: Int' : Array.from({length: a}, (_, i) => `_ val${i + 1}: Int`).join(', ');
    const rt = getter(n) ? ' -> Int' : '';
    return `\n\n    func ${n}(${p})${rt}${rt ? ' {\n        return 0\n    }' : ' {\n        \n    }'}`;
  }).join('') : '\n\n    func get(_ key: Int) -> Int {\n        return 0\n    }\n\n    func put(_ key: Int, _ value: Int) {\n        \n    }';

  const templates = {
    javascript: docComment + 'class ' + fnName + ' {\n    constructor(' + paramStr + ') {\n        \n    }' + js + '\n}',
    python: docComment + 'class ' + fnName + ':\n    def __init__(self, ' + params.join(', ') + '):\n        pass' + py + '\n',
    java: 'class ' + fnName + ' {\n' + docComment.replace(/^(.)/gm, '    $1') + '    public ' + fnName + '(' + paramStr + ') {\n        \n    }' + java + '\n}',
    cpp: '#include <unordered_map>\nusing namespace std;\n\n' + docComment + 'class ' + fnName + ' {\npublic:\n    ' + fnName + '(' + paramStr + ') {\n        \n    }' + cpp + '\n};',
    c: docComment + '// Use a struct with function pointers:\ntypedef struct {\n    int capacity;\n} LRUCache;\n\nLRUCache* createLRUCache(int capacity) {\n    return NULL;\n}\n\nint get(LRUCache* cache, int key) {\n    return 0;\n}\n\nvoid put(LRUCache* cache, int key, int value) {\n    \n}',
    swift: docComment + 'class ' + fnName + ' {\n    init(' + paramStr + ') {' + swift + '\n}',
  };
  return templates[lang] || templates.javascript;
}

/* ─── Harness generation ─── */

export function buildHarness(userCode, lang, problem) {
  if (!problem || !problem.testCases || problem.testCases.length === 0) return userCode;
  const functionName = problem.functionName || 'solution';
  const testCases = problem.testCases;
  const isClass = /^[A-Z]/.test(functionName);
  switch (lang) {
    case 'javascript': return buildJsHarness(userCode, functionName, testCases, isClass, problem);
    case 'python': return buildPythonHarness(userCode, functionName, testCases, isClass);
    case 'cpp': return buildCppHarness(userCode, functionName, testCases, isClass);
    case 'java': return buildJavaHarness(userCode, functionName, testCases, isClass);
    case 'c': return buildCHarness(userCode, functionName, testCases, isClass);
    case 'swift': return buildSwiftHarness(userCode, functionName, testCases, isClass);
    default: return userCode;
  }
}

function buildJsHarness(code, fn, tcs, isClass, problem) {
  const tcJson = JSON.stringify(tcs);
  const clsCheck = isClass ? 'true' : 'false';
  const isLL = !isClass && problem?.category === 'linkedlist';

  let preamble = '';
  let inpConv = '';
  let resultConv = 'result';
  let actualExpr = 'result';

  if (isLL) {
    preamble = `

function __arrayToList(arr) {
  if (!arr || arr.length === 0) return null;
  const head = {val:arr[0],next:null};
  let prev = head;
  for (let i = 1; i < arr.length; i++) { const n = {val:arr[i],next:null}; prev.next = n; prev = n; }
  return head;
}
function __listToArray(head) {
  const res = [];
  for (let cur = head; cur; cur = cur.next) res.push(cur.val);
  return res;
}
function __isListNode(v) {
  return v && typeof v === 'object' && 'val' in v && 'next' in v;
}`;
    inpConv = '    const __inp = tc.input.map(v => Array.isArray(v) ? __arrayToList(v) : v);\n';
    resultConv = '__isListNode(result) ? __listToArray(result) : result';
    actualExpr = resultConv;
  }

  return code + preamble +
    '\n\nconst __TC__ = ' + tcJson + ';\n' +
    'const __RES__ = [];\n' +
    'for (let i = 0; i < __TC__.length; i++) {\n' +
    '  const tc = __TC__[i];\n' +
    '  try {\n' +
    '    let result;\n' +
    inpConv +
    '    if (' + clsCheck + ') {\n' +
    '      const instance = new ' + fn + '(...' + (isLL ? '__inp' : 'tc.input') + ');\n' +
    '      if (tc.methods && Array.isArray(tc.methods)) {\n' +
    '        result = instance;\n' +
    '        for (const m of tc.methods) {\n' +
    '          result = instance[m[0]](...m.slice(1));\n' +
    '        }\n' +
    '      } else {\n' +
    '        result = instance;\n' +
    '      }\n' +
    '    } else {\n' +
    '      result = ' + fn + '(...' + (isLL ? '__inp' : 'tc.input') + ');\n' +
    '    }\n' +
    '    const passed = ' + clsCheck + ' ? (tc.methods ? JSON.stringify(result) === JSON.stringify(tc.expected) : true) : JSON.stringify(' + resultConv + ') === JSON.stringify(tc.expected);\n' +
    '    __RES__.push({ index: i, ran: true, passed, actual: ' + (clsCheck === 'true' ? '(tc.methods ? result : "instance")' : actualExpr) + ', expected: tc.expected, input: tc.input, error: null });\n' +
    '  } catch (e) {\n' +
    '    __RES__.push({ index: i, ran: true, passed: false, actual: null, expected: tc.expected, input: tc.input, error: e.message });\n' +
    '  }\n' +
    '}\n' +
    'console.log("__RESULT__:" + JSON.stringify(__RES__));';
}

function buildPythonHarness(code, fn, tcs, isClass) {
  const tcJson = JSON.stringify(tcs);
  const esc = tcJson.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const clsCheck = isClass ? 'True' : 'False';
  return code +
    '\n\nimport json\n' +
    "__TC__ = json.loads('" + esc + "')\n" +
    '__RES__ = []\n' +
    'for i, tc in enumerate(__TC__):\n' +
    '    try:\n' +
    '        if ' + clsCheck + ':\n' +
    '            instance = ' + fn + '(*tc["input"])\n' +
    '            if tc.get("methods"):\n' +
    '                result = instance\n' +
    '                for m in tc["methods"]:\n' +
    '                    result = getattr(instance, m[0])(*m[1:])\n' +
    '            else:\n' +
    '                result = instance\n' +
    '        else:\n' +
    '            result = ' + fn + '(*tc["input"])\n' +
    '        passed = True if ' + clsCheck + ' and not tc.get("methods") else json.dumps(result, default=str) == json.dumps(tc["expected"], default=str)\n' +
    '        __RES__.append({"index": i, "ran": True, "passed": passed, "actual": str(result) if ' + clsCheck + ' and not tc.get("methods") else result, "expected": tc["expected"], "input": tc["input"], "error": None})\n' +
    '    except Exception as e:\n' +
    '        __RES__.append({"index": i, "ran": True, "passed": False, "actual": None, "expected": tc["expected"], "input": tc["input"], "error": str(e)})\n' +
    'print("__RESULT__:" + json.dumps(__RES__, default=str))';
}

function buildCppHarness(code, fn, tcs, isClass) {
  const outType = inferType(tcs[0].expected);
  const inTypes = tcs[0].input.map((v) => inferType(v));
  let s = '#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\n';
  s += code + '\n\n';
  s += 'string __j(bool v) { return v ? "true" : "false"; }\n';
  s += 'string __j(int v) { return to_string(v); }\n';
  s += 'string __j(const string& v) { return "\\"" + v + "\\""; }\n';
  s += 'template<typename T>\nstring __j(const vector<T>& v) {\n  if (v.empty()) return "[]";\n  stringstream ss;\n  ss << "[" << __j(v[0]);\n  for (size_t i=1;i<v.size();i++) ss << "," << __j(v[i]);\n  ss << "]";\n  return ss.str();\n}\n';
  s += 'int main() {\n  cout << "__RESULT__:";\n  cout << "[";\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '  cout << ",";\n';
    s += '  try {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') callArgs += 'vector<int>{' + tcs[i].input[j].map((x) => (x == null ? 0 : x)).join(',') + '}';
      else if (inTypes[j] === 'int[][]') callArgs += 'vector<vector<int>>{' + tcs[i].input[j].map((row) => '{' + row.join(',') + '}').join(',') + '}';
      else if (inTypes[j] === 'string[]') callArgs += 'vector<string>{' + tcs[i].input[j].map((x) => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}';
      else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    s += '    auto __r = ' + fn + '(' + callArgs + ');\n';
    s += '    cout << "{\\"index\\":" << ' + i + ' << ",\\"ran\\":true,\\"passed\\":";\n';
    s += '    cout << ' + buildCppCompare(outType, tcs[i].expected) + ';\n';
    s += '    cout << ",\\"actual\\":" << __j(__r);\n';
    s += '    cout << "}" << flush;\n';
    s += '  } catch (...) {\n';
    s += '    cout << "{\\"index\\":" << ' + i + ' << ",\\"ran\\":true,\\"passed\\":false,\\"error\\":\\"exception\\"}" << flush;\n';
    s += '  }\n';
  }
  s += '  cout << "]" << endl;\n  return 0;\n}\n';
  return s;
}

function buildCppCompare(outType, expected) {
  if (outType === 'int[]') return '(__r == vector<int>{' + expected.map((x) => (x == null ? 0 : x)).join(',') + '} ? "true" : "false")';
  if (outType === 'int[][]') return '(__r == vector<vector<int>>{' + expected.map((row) => '{' + row.join(',') + '}').join(',') + '} ? "true" : "false")';
  if (outType === 'int' || outType === 'float') return '(__r == ' + valToLit(expected, outType) + ' ? "true" : "false")';
  if (outType === 'string') return '(__r == ' + valToLit(expected, outType) + ' ? "true" : "false")';
  if (outType === 'bool') return '(__r == ' + valToLit(expected, outType) + ' ? "true" : "false")';
  return '"false"';
}

function buildJavaHarness(code, fn, tcs, isClass) {
  const outType = inferType(tcs[0].expected);
  const inTypes = tcs[0].input.map((v) => inferType(v));
  const javaType = outType === 'int[]' ? 'int[]' : outType === 'int[][]' ? 'int[][]' : outType === 'string' ? 'String' : outType === 'bool' ? 'boolean' : 'int';
  let s = code + '\n\nclass Main {\n';
  s += '  static String __j(boolean v) { return String.valueOf(v); }\n';
  s += '  static String __j(int v) { return String.valueOf(v); }\n';
  s += '  static String __j(String v) { return v == null ? "null" : "\\"" + v + "\\""; }\n';
  s += '  static String __j(int[] v) {\n    if (v == null) return "null";\n    StringBuilder sb = new StringBuilder("[");\n    for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(v[i]); }\n    sb.append("]");\n    return sb.toString();\n  }\n';
  s += '  static boolean __eq(int[] a, int[] b) {\n    if (a == null && b == null) return true;\n    if (a == null || b == null || a.length != b.length) return false;\n    for (int i = 0; i < a.length; i++) if (a[i] != b[i]) return false;\n    return true;\n  }\n';
  if (outType === 'int[][]') {
    s += '  static String __j(int[][] v) {\n    if (v == null) return "null";\n    StringBuilder sb = new StringBuilder("[");\n    for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(__j(v[i])); }\n    sb.append("]");\n    return sb.toString();\n  }\n';
    s += '  static boolean __eq(int[][] a, int[][] b) {\n    if (a == null && b == null) return true;\n    if (a == null || b == null || a.length != b.length) return false;\n    for (int i = 0; i < a.length; i++) if (!__eq(a[i], b[i])) return false;\n    return true;\n  }\n';
  }
  s += '  public static void main(String[] args) {\n    StringBuilder __res = new StringBuilder("[");\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '    __res.append(",");\n';
    s += '    try {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') callArgs += 'new int[]{' + tcs[i].input[j].map((x) => (x == null ? 0 : x)).join(',') + '}';
      else if (inTypes[j] === 'int[][]') callArgs += 'new int[][]{' + tcs[i].input[j].map((row) => '{' + row.join(',') + '}').join(',') + '}';
      else if (inTypes[j] === 'string[]') callArgs += 'new String[]{' + tcs[i].input[j].map((x) => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}';
      else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    s += '      ' + javaType + ' __r = new Solution().' + fn + '(' + callArgs + ');\n';
    if (outType === 'int[]') s += '      boolean __p = __eq(__r, new int[]{' + tcs[i].expected.map((x) => (x == null ? 0 : x)).join(',') + '});\n';
    else if (outType === 'int[][]') s += '      boolean __p = __eq(__r, new int[][]{' + tcs[i].expected.map((row) => '{' + row.join(',') + '}').join(',') + '});\n';
    else s += '      boolean __p = __r == ' + valToLit(tcs[i].expected, outType) + ';\n';
    s += '      __res.append("{\\"index\\":" + ' + i + ' + ",\\"ran\\":true,\\"passed\\":" + __p + ",\\"actual\\":" + __j(__r) + "}");\n';
    s += '    } catch (Exception e) {\n';
    s += '      __res.append("{\\"index\\":" + ' + i + ' + ",\\"ran\\":true,\\"passed\\":false,\\"error\\":\\"" + (e.getMessage() != null ? e.getMessage().replace("\\"","\'") : "null") + "\\"}");\n';
    s += '    }\n';
  }
  s += '    __res.append("]");\n    System.out.println("__RESULT__:" + __res.toString());\n  }\n}\n';
  return s;
}

function buildCHarness(code, fn, tcs, isClass) {
  const outType = inferType(tcs[0].expected);
  const inTypes = tcs[0].input.map((v) => inferType(v));
  let s = '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\n';
  s += code + '\n\n';
  if (outType === 'int[]') {
    s += 'void __j(int* v, int n, char* buf) {\n  if (v == NULL) { strcpy(buf, "null"); return; }\n  buf[0] = \'[\'; int pos = 1;\n  for (int i = 0; i < n; i++) { if (i > 0) buf[pos++] = \',\'; pos += sprintf(buf + pos, "%d", v[i]); }\n  buf[pos++] = \']\'; buf[pos] = 0;\n}\n';
    s += 'int __eq(int* a, int* b, int n) {\n  if (n == 0) return 1;\n  if (a == NULL && b == NULL) return 1;\n  if (a == NULL || b == NULL) return 0;\n  for (int i = 0; i < n; i++) if (a[i] != b[i]) return 0;\n  return 1;\n}\n';
  }
  s += 'int main() {\n  printf("__RESULT__:[");\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '  printf(",");\n';
    s += '  {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') {
        const arr = tcs[i].input[j];
        if (arr.length === 0) callArgs += 'NULL, 0';
        else callArgs += '(int[]){' + arr.map((x) => x).join(',') + '}, ' + arr.length;
      } else if (inTypes[j] === 'int[][]') {
        const arr = tcs[i].input[j];
        if (arr.length === 0) callArgs += 'NULL, NULL, 0';
        else {
          const rows = arr.map((row) => (row.length === 0 ? 'NULL' : '(int[]){' + row.join(',') + '}')).join(',');
          const sizes = arr.map((row) => row.length).join(',');
          callArgs += '(int*[]){' + rows + '}, (int[]){' + sizes + '}, ' + arr.length;
        }
      } else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    if (isClass) s += '  printf("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":true,\\"actual\\":\\"instance\\"}");\n';
    else if (outType === 'int[]') {
      const exp = tcs[i].expected;
      const expLen = Array.isArray(exp) ? exp.length : 1;
      s += '  printf("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":");\n';
      s += '  int* __r = ' + fn + '(' + callArgs + ');\n';
      if (expLen === 0) s += '  int __p = __eq(__r, NULL, 0);\n';
      else s += '  int __p = __eq(__r, (int[]){' + exp.map((x) => (x == null ? 0 : x)).join(',') + '}, ' + expLen + ');\n';
      s += '  printf(__p ? "true" : "false");\n  printf(",\\"actual\\":");\n  char __buf[256]; __j(__r, ' + expLen + ', __buf); printf("%s", __buf);\n  printf("}");\n';
    } else {
      const cType = outType === 'string' ? 'char*' : 'int';
      s += '  printf("{\\"index\\":' + i + ',\\"ran\\":true,\\"passed\\":");\n';
      s += '  ' + cType + ' __r = ' + fn + '(' + callArgs + ');\n';
      if (outType === 'string') {
        const expStr = valToLit(tcs[i].expected, outType);
        s += '  int __p = __r && ' + expStr + ' && strcmp(__r, ' + expStr + ') == 0;\n';
      } else s += '  int __p = __r == ' + valToLit(tcs[i].expected, outType) + ';\n';
      s += '  printf(__p ? "true" : "false");\n  printf(",\\"actual\\":");\n';
      if (outType === 'string') s += '  printf(__r ? "\\"%s\\"" : "null", __r);\n';
      else if (outType === 'bool') s += '  printf(__r ? "true" : "false");\n';
      else s += '  printf("%d", __r);\n';
      s += '  printf("}");\n';
    }
    s += '  }\n';
  }
  s += '  printf("]\\n");\n  return 0;\n}\n';
  return s;
}

function buildSwiftHarness(code, fn, tcs, isClass) {
  const outType = inferType(tcs[0].expected);
  const inTypes = tcs[0].input.map((v) => inferType(v));
  let s = 'import Foundation\n\n';
  s += code + '\n\n';
  s += 'func __j(_ v: Int) -> String { return String(v) }\n';
  s += 'func __j(_ v: Bool) -> String { return v ? "true" : "false" }\n';
  s += 'func __j(_ v: String) -> String { return "\\"\\(v)\\"" }\n';
  if (outType === 'int[]' || outType === 'int[][]') s += 'func __j(_ v: [Int]) -> String {\n  if v.isEmpty { return "[]" }\n  return "[" + v.map(String.init).joined(separator: ",") + "]"\n}\n';
  if (outType === 'int[][]') s += 'func __j(_ v: [[Int]]) -> String {\n  return "[" + v.map { __j($0) }.joined(separator: ",") + "]"\n}\n';
  s += 'let __res = "["\n';
  for (let i = 0; i < tcs.length; i++) {
    if (i > 0) s += '__res += ","\n';
    s += 'do {\n';
    let callArgs = '';
    for (let j = 0; j < inTypes.length; j++) {
      if (j > 0) callArgs += ', ';
      if (inTypes[j] === 'int[]') callArgs += '[' + tcs[i].input[j].map((x) => (x == null ? 0 : x)).join(',') + '] as [Int]';
      else if (inTypes[j] === 'int[][]') callArgs += '[' + tcs[i].input[j].map((row) => '[' + row.join(',') + ']').join(',') + '] as [[Int]]';
      else if (inTypes[j] === 'string[]') callArgs += '[' + tcs[i].input[j].map((x) => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '] as [String]';
      else if (inTypes[j] === 'string[][]') callArgs += '[' + tcs[i].input[j].map((row) => '[' + row.map((x) => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + ']').join(',') + '] as [[String]]';
      else callArgs += valToLit(tcs[i].input[j], inTypes[j]);
    }
    s += '  let __r = ' + fn + '(' + callArgs + ')\n';
    if (outType === 'int[]') s += '  let __p = __r == [' + tcs[i].expected.map((x) => (x == null ? 0 : x)).join(',') + ']\n';
    else if (outType === 'int[][]') s += '  let __p = __r == [' + tcs[i].expected.map((row) => '[' + row.join(',') + ']').join(',') + ']\n';
    else s += '  let __p = __r == ' + valToLit(tcs[i].expected, outType) + '\n';
    s += '  __res += "{\\"index\\":" + ' + i + ' + ",\\"ran\\":true,\\"passed\\":" + (__p ? "true" : "false") + ",\\"actual\\":" + __j(__r) + "}"\n';
    s += '} catch {\n';
    s += '  __res += "{\\"index\\":" + ' + i + ' + ",\\"ran\\":true,\\"passed\\":false,\\"error\\":\\"exception\\"}"\n';
    s += '}\n';
  }
  s += '__res += "]"\nprint("__RESULT__:" + __res)\n';
  return s;
}

/* ─── Result parsing ─── */

export function parseTestResults(stdout, testCount) {
  const marker = '__RESULT__:';
  const pos = stdout.lastIndexOf(marker);
  if (pos !== -1) {
    const raw = stdout.substring(0, pos).trim();
    const json = stdout.substring(pos + marker.length).trim();
    try {
      const parsed = JSON.parse(json);
      const testResults = Array.isArray(parsed) ? parsed : [];
      const allPassed = testResults.length > 0 && testResults.every((r) => r.passed);
      return { allPassed, testResults, rawOutput: raw };
    } catch { /* fall through */ }
  }
  return { allPassed: false, testResults: Array.from({ length: testCount }, () => ({ ran: true, passed: false, error: 'No test result marker found' })), rawOutput: stdout };
}

export function getProblemSignature(problem) {
  return JSON.stringify({ fn: problem.functionName, params: problem.params, guide: problem.guide, tc: problem.testCases });
}
