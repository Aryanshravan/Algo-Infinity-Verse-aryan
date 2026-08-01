document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initJuliaEditor();
  } catch (e) {
    console.error('JuliaEditor:', e);
  }
});

/* ---------------------------------------------------------------------- */
/* Page boilerplate — copied to match r-editor.js / python-editor.js      */
/* ---------------------------------------------------------------------- */
function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById('loading-screen');
    if (s) s.classList.add('hidden');
  }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initNavbar() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains('active');
    navLinks.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen);
    overlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const icon = menuToggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars', !isOpen);
      icon.classList.toggle('fa-times', isOpen);
    }
  };
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  overlay.addEventListener('click', () => toggleMenu(false));
  navLinks
    .querySelectorAll('a')
    .forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
  const isMobile = () => window.matchMedia('(max-width: 1024px)').matches;
  document.querySelectorAll('.dropdown-toggle').forEach((toggle) => {
    const parent = toggle.closest('.has-dropdown');
    const menu = parent?.querySelector('.dropdown-menu');
    if (!parent || !menu) return;
    let t;
    parent.addEventListener('mouseenter', () => {
      if (!isMobile()) {
        clearTimeout(t);
        parent.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
    parent.addEventListener('mouseleave', () => {
      if (!isMobile()) {
        t = setTimeout(() => {
          parent.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }, 250);
      }
    });
    toggle.addEventListener('click', (e) => {
      if (isMobile()) {
        e.preventDefault();
        e.stopPropagation();
        const o = parent.classList.toggle('open');
        toggle.setAttribute('aria-expanded', o);
      }
    });
  });
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav)
      nav.style.background = window.scrollY > 100 ? 'rgba(10,10,26,0.95)' : 'rgba(10,10,26,0.85)';
  });
}

/* ---------------------------------------------------------------------- */
/* Example snippets                                                       */
/* ---------------------------------------------------------------------- */
const JULIA_EXAMPLES = {
  basics: `x = 5\ny = 3\nz = x * y + 2\nprintln(z)\nprintln("x + y = $(x + y)")`,
  control: `function classify(n)\n  if n < 0\n    return "negative"\n  elseif n == 0\n    return "zero"\n  else\n    return "positive"\n  end\nend\n\nfor n in [-2, 0, 7]\n  println("$(n) is $(classify(n))")\nend`,
  loops: `total = 0\nfor i in 1:10\n  total += i\nend\nprintln("sum 1..10 = $(total)")\n\ni = 1\nwhile i <= 5\n  println("i = $(i)")\n  i += 1\nend`,
  functions: `function factorial(n)\n  if n <= 1\n    return 1\n  end\n  return n * factorial(n - 1)\nend\n\nsquare(x) = x^2\n\nprintln("factorial(6) = $(factorial(6))")\nprintln("square(9) = $(square(9))")`,
  arrays: `numbers = [4, 8, 15, 16, 23, 42]\nprintln("length = $(length(numbers))")\nprintln("sum = $(sum(numbers))")\nprintln("mean = $(mean(numbers))")\n\nsquares = []\nfor n in numbers\n  push!(squares, n^2)\nend\nprintln(squares)`,
  plot: `x = collect(1:10)\ny = [2, 4, 3, 6, 8, 7, 9, 12, 11, 15]\nplot(x, y)`,
  histogram: `values = [4, 8, 15, 16, 23, 42, 4, 8, 15, 16, 23, 8, 15]\nhistogram(values)`,
};

/* ---------------------------------------------------------------------- */
/* NOTE ON EXECUTION ENGINE: this runs entirely client-side. Julia has no */
/* production-ready in-browser runtime (no WASM equivalent to Pyodide),   */
/* and the backend's live execution path (Judge0 CE, called from          */
/* apiController.js) does not include Julia in its supported languages.   */
/* This interpreter evaluates a genuine, real subset of Julia — variables, */
/* control flow, functions/closures, arrays, ranges, string interpolation, */
/* and a small standard-library subset — the same approach already used   */
/* by the R editor and the Lua editor in this codebase. Package installs  */
/* (Pkg.add) are not supported: there's no registry to install from       */
/* client-side, and the execution sandbox that backs other editors runs   */
/* with --network none even where it is live. Plotting is simulated via   */
/* canvas rendering of your actual data, not real Plots.jl.               */
/* ---------------------------------------------------------------------- */

class JuliaError extends Error {}
class BreakSignal extends Error {}
class ContinueSignal extends Error {}
class ReturnSignal extends Error {
  constructor(value) {
    super('return');
    this.value = value;
  }
}

const KEYWORDS = new Set([
  'function',
  'end',
  'if',
  'elseif',
  'else',
  'for',
  'in',
  'while',
  'return',
  'break',
  'continue',
  'true',
  'false',
]);

/* ---------------------------------------------------------------------- */
/* Lexer                                                                  */
/* ---------------------------------------------------------------------- */
function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  let parenDepth = 0;

  const peekCh = (o = 0) => src[i + o];

  while (i < n) {
    const ch = src[i];

    if (ch === '\n') {
      if (parenDepth === 0) {
        if (tokens.length && tokens[tokens.length - 1].type !== 'NEWLINE') {
          tokens.push({ type: 'NEWLINE' });
        }
      }
      i++;
      continue;
    }
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++;
      continue;
    }
    if (ch === '#') {
      if (peekCh(1) === '=') {
        i += 2;
        while (i < n && !(src[i] === '=' && src[i + 1] === '#')) i++;
        i += 2;
      } else {
        while (i < n && src[i] !== '\n') i++;
      }
      continue;
    }
    if (ch === ';') {
      if (tokens.length && tokens[tokens.length - 1].type !== 'NEWLINE') {
        tokens.push({ type: 'NEWLINE' });
      }
      i++;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(peekCh(1) || ''))) {
      let j = i;
      let isFloat = false;
      while (j < n && /[0-9]/.test(src[j])) j++;
      if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) {
        isFloat = true;
        j++;
        while (j < n && /[0-9]/.test(src[j])) j++;
      }
      if (src[j] === 'e' || src[j] === 'E') {
        isFloat = true;
        j++;
        if (src[j] === '+' || src[j] === '-') j++;
        while (j < n && /[0-9]/.test(src[j])) j++;
      }
      const raw = src.slice(i, j);
      tokens.push({ type: 'NUM', value: isFloat ? parseFloat(raw) : parseInt(raw, 10), isFloat });
      i = j;
      continue;
    }

    if (ch === '"') {
      const { parts, end } = lexString(src, i + 1);
      tokens.push({ type: 'STR', parts });
      i = end;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      while (src[j] === '!') j++;
      const word = src.slice(i, j);
      if (KEYWORDS.has(word)) {
        tokens.push({ type: 'KW', value: word });
      } else {
        tokens.push({ type: 'IDENT', value: word });
      }
      i = j;
      continue;
    }

    const two = src.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '&&', '||', '+=', '-=', '*=', '/='].includes(two)) {
      tokens.push({ type: 'OP', value: two });
      i += 2;
      continue;
    }

    if ('()[]'.includes(ch)) {
      if (ch === '(' || ch === '[') parenDepth++;
      if (ch === ')' || ch === ']') parenDepth = Math.max(0, parenDepth - 1);
      tokens.push({ type: ch, value: ch });
      i++;
      continue;
    }
    if ('+-*/^%=<>:,!'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    throw new JuliaError(`Unexpected character '${ch}'`);
  }
  if (tokens.length && tokens[tokens.length - 1].type !== 'NEWLINE') {
    tokens.push({ type: 'NEWLINE' });
  }
  tokens.push({ type: 'EOF' });
  return tokens;
}

function lexString(src, start) {
  const parts = [];
  let buf = '';
  let i = start;
  const n = src.length;
  while (i < n && src[i] !== '"') {
    const ch = src[i];
    if (ch === '\\') {
      const next = src[i + 1];
      const map = { n: '\n', t: '\t', '\\': '\\', '"': '"', $: '$' };
      buf += map[next] !== undefined ? map[next] : next;
      i += 2;
      continue;
    }
    if (ch === '$') {
      if (buf) {
        parts.push({ type: 'text', value: buf });
        buf = '';
      }
      if (src[i + 1] === '(') {
        let depth = 1;
        let j = i + 2;
        while (j < n && depth > 0) {
          if (src[j] === '(') depth++;
          else if (src[j] === ')') depth--;
          if (depth > 0) j++;
        }
        parts.push({ type: 'expr', src: src.slice(i + 2, j) });
        i = j + 1;
      } else {
        let j = i + 1;
        while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        parts.push({ type: 'expr', src: src.slice(i + 1, j) });
        i = j;
      }
      continue;
    }
    buf += ch;
    i++;
  }
  if (buf) parts.push({ type: 'text', value: buf });
  return { parts, end: i + 1 };
}

/* ---------------------------------------------------------------------- */
/* Parser (recursive descent, precedence climbing)                        */
/* ---------------------------------------------------------------------- */
function parse(tokens) {
  let pos = 0;
  const peek = (o = 0) => tokens[pos + o];
  const at = (type, value) => {
    const t = peek();
    return t.type === type && (value === undefined || t.value === value);
  };
  const advance = () => tokens[pos++];
  const expect = (type, value) => {
    if (!at(type, value)) {
      throw new JuliaError(`Expected ${value || type} but got '${peek().value ?? peek().type}'`);
    }
    return advance();
  };
  const skipNewlines = () => {
    while (at('NEWLINE')) advance();
  };

  function parseProgram() {
    const stmts = [];
    skipNewlines();
    while (!at('EOF')) {
      stmts.push(parseStatement());
      skipNewlines();
    }
    return { type: 'block', body: stmts };
  }

  function parseBlockUntil(...enders) {
    const stmts = [];
    skipNewlines();
    while (!enders.some((e) => at('KW', e)) && !at('EOF')) {
      stmts.push(parseStatement());
      skipNewlines();
    }
    return stmts;
  }

  function parseStatement() {
    if (at('KW', 'function')) return parseFunctionDef();
    if (at('KW', 'if')) return parseIf();
    if (at('KW', 'for')) return parseFor();
    if (at('KW', 'while')) return parseWhile();
    if (at('KW', 'return')) {
      advance();
      const value = at('NEWLINE') || at('EOF') ? null : parseExpr();
      return { type: 'return', value };
    }
    if (at('KW', 'break')) {
      advance();
      return { type: 'break' };
    }
    if (at('KW', 'continue')) {
      advance();
      return { type: 'continue' };
    }

    const start = pos;
    if (at('IDENT') && peek(1).type === '(') {
      const savedPos = pos;
      try {
        const name = advance().value;
        advance(); // (
        const params = [];
        if (!at(')')) {
          params.push(expect('IDENT').value);
          while (at('OP', ',')) {
            advance();
            params.push(expect('IDENT').value);
          }
        }
        expect(')');
        if (at('OP', '=')) {
          advance();
          const body = parseExpr();
          return { type: 'funcdef', name, params, body: [{ type: 'return', value: body }] };
        }
      } catch {
        /* not a short-form function def — fall through to normal parse */
      }
      pos = savedPos;
    }

    pos = start;
    const assignOps = ['=', '+=', '-=', '*=', '/='];
    const lhs = parseExpr();
    if (at('OP') && assignOps.includes(peek().value)) {
      const op = advance().value;
      const rhs = parseExpr();
      if (lhs.type !== 'ident' && lhs.type !== 'index') {
        throw new JuliaError('Invalid assignment target');
      }
      return { type: 'assign', op, target: lhs, value: rhs };
    }
    return { type: 'exprstmt', expr: lhs };
  }

  function parseFunctionDef() {
    advance(); // function
    const name = expect('IDENT').value;
    expect('(');
    const params = [];
    if (!at(')')) {
      params.push(expect('IDENT').value);
      while (at('OP', ',')) {
        advance();
        params.push(expect('IDENT').value);
      }
    }
    expect(')');
    const body = parseBlockUntil('end');
    expect('KW', 'end');
    return { type: 'funcdef', name, params, body };
  }

  function parseIf() {
    advance(); // if
    const cond = parseExpr();
    const thenBody = parseBlockUntil('elseif', 'else', 'end');
    const clauses = [{ cond, body: thenBody }];
    while (at('KW', 'elseif')) {
      advance();
      const c = parseExpr();
      const b = parseBlockUntil('elseif', 'else', 'end');
      clauses.push({ cond: c, body: b });
    }
    let elseBody = null;
    if (at('KW', 'else')) {
      advance();
      elseBody = parseBlockUntil('end');
    }
    expect('KW', 'end');
    return { type: 'if', clauses, elseBody };
  }

  function parseFor() {
    advance(); // for
    const varName = expect('IDENT').value;
    expect('KW', 'in');
    const iterable = parseExpr();
    const body = parseBlockUntil('end');
    expect('KW', 'end');
    return { type: 'for', varName, iterable, body };
  }

  function parseWhile() {
    advance(); // while
    const cond = parseExpr();
    const body = parseBlockUntil('end');
    expect('KW', 'end');
    return { type: 'while', cond, body };
  }

  function parseExpr() {
    return parseOr();
  }
  function parseOr() {
    let left = parseAnd();
    while (at('OP', '||')) {
      advance();
      left = { type: 'logical', op: '||', left, right: parseAnd() };
    }
    return left;
  }
  function parseAnd() {
    let left = parseEquality();
    while (at('OP', '&&')) {
      advance();
      left = { type: 'logical', op: '&&', left, right: parseEquality() };
    }
    return left;
  }
  function parseEquality() {
    let left = parseRelational();
    while (at('OP', '==') || at('OP', '!=')) {
      const op = advance().value;
      left = { type: 'binop', op, left, right: parseRelational() };
    }
    return left;
  }
  function parseRelational() {
    let left = parseRange();
    while (['<', '>', '<=', '>='].some((o) => at('OP', o))) {
      const op = advance().value;
      left = { type: 'binop', op, left, right: parseRange() };
    }
    return left;
  }
  function parseRange() {
    const start = parseAdditive();
    if (at('OP', ':')) {
      advance();
      const mid = parseAdditive();
      if (at('OP', ':')) {
        advance();
        const stop = parseAdditive();
        return { type: 'range', from: start, step: mid, to: stop };
      }
      return { type: 'range', from: start, step: null, to: mid };
    }
    return start;
  }
  function parseAdditive() {
    let left = parseMultiplicative();
    while (at('OP', '+') || at('OP', '-')) {
      const op = advance().value;
      left = { type: 'binop', op, left, right: parseMultiplicative() };
    }
    return left;
  }
  function parseMultiplicative() {
    let left = parseUnary();
    while (at('OP', '*') || at('OP', '/') || at('OP', '%')) {
      const op = advance().value;
      left = { type: 'binop', op, left, right: parseUnary() };
    }
    return left;
  }
  function parseUnary() {
    if (at('OP', '-') || at('OP', '+') || at('OP', '!')) {
      const op = advance().value;
      return { type: 'unary', op, arg: parseUnary() };
    }
    return parsePow();
  }
  function parsePow() {
    const base = parsePostfix();
    if (at('OP', '^')) {
      advance();
      return { type: 'binop', op: '^', left: base, right: parseUnary() };
    }
    return base;
  }
  function parsePostfix() {
    let node = parsePrimary();
    for (;;) {
      if (at('(')) {
        advance();
        const args = [];
        if (!at(')')) {
          args.push(parseExpr());
          while (at('OP', ',')) {
            advance();
            args.push(parseExpr());
          }
        }
        expect(')');
        node = { type: 'call', callee: node, args };
      } else if (at('[')) {
        advance();
        const index = parseExpr();
        expect(']');
        node = { type: 'index', target: node, index };
      } else {
        break;
      }
    }
    return node;
  }
  function parsePrimary() {
    if (at('NUM')) {
      const t = advance();
      return { type: 'num', value: t.value };
    }
    if (at('STR')) {
      const t = advance();
      return { type: 'strinterp', parts: t.parts };
    }
    if (at('KW', 'true')) {
      advance();
      return { type: 'bool', value: true };
    }
    if (at('KW', 'false')) {
      advance();
      return { type: 'bool', value: false };
    }
    if (at('IDENT')) {
      return { type: 'ident', name: advance().value };
    }
    if (at('(')) {
      advance();
      const e = parseExpr();
      expect(')');
      return e;
    }
    if (at('[')) {
      advance();
      const elements = [];
      if (!at(']')) {
        elements.push(parseExpr());
        while (at('OP', ',')) {
          advance();
          elements.push(parseExpr());
        }
      }
      expect(']');
      return { type: 'array', elements };
    }
    throw new JuliaError(`Unexpected token '${peek().value ?? peek().type}'`);
  }

  return parseProgram();
}

/* ---------------------------------------------------------------------- */
/* Evaluator                                                              */
/* ---------------------------------------------------------------------- */
const MAX_STEPS = 300000;

function makeEnv(parent) {
  return { vars: Object.create(null), parent };
}
function envGet(env, name) {
  let e = env;
  while (e) {
    if (name in e.vars) return e.vars[name];
    e = e.parent;
  }
  throw new JuliaError(`UndefVarError: ${name} not defined`);
}
function envSet(env, name, value) {
  let e = env;
  while (e) {
    if (name in e.vars) {
      e.vars[name] = value;
      return;
    }
    e = e.parent;
  }
  env.vars[name] = value;
}
function envDefine(env, name, value) {
  env.vars[name] = value;
}

function run(src) {
  const outputEntries = [];
  let steps = 0;
  const tick = () => {
    steps++;
    if (steps > MAX_STEPS) {
      throw new JuliaError('Execution aborted: step limit exceeded (possible infinite loop)');
    }
  };

  function evalExprNode(node, env) {
    tick();
    switch (node.type) {
      case 'num':
        return node.value;
      case 'bool':
        return node.value;
      case 'ident':
        return envGet(env, node.name);
      case 'strinterp':
        return node.parts
          .map((p) => {
            if (p.type === 'text') return p.value;
            const subTokens = tokenize(p.src);
            const subAst = parse(subTokens);
            const exprNode =
              subAst.body[0] && subAst.body[0].expr ? subAst.body[0].expr : subAst.body[0];
            return formatValue(evalExprNode(exprNode, env));
          })
          .join('');
      case 'array':
        return node.elements.map((e) => evalExprNode(e, env));
      case 'range': {
        const from = evalExprNode(node.from, env);
        const step = node.step !== null ? evalExprNode(node.step, env) : 1;
        const to = evalExprNode(node.to, env);
        return materializeRange(from, step, to);
      }
      case 'unary': {
        const v = evalExprNode(node.arg, env);
        if (node.op === '-') return -v;
        if (node.op === '+') return v;
        if (node.op === '!') return !truthy(v);
        break;
      }
      case 'binop':
        return evalBinOp(node.op, evalExprNode(node.left, env), evalExprNode(node.right, env));
      case 'logical': {
        const l = evalExprNode(node.left, env);
        if (node.op === '&&') return truthy(l) ? evalExprNode(node.right, env) : l;
        return truthy(l) ? l : evalExprNode(node.right, env);
      }
      case 'index': {
        const target = evalExprNode(node.target, env);
        const idx = evalExprNode(node.index, env);
        if (!Array.isArray(target)) throw new JuliaError('Cannot index a non-array value');
        if (idx < 1 || idx > target.length) {
          throw new JuliaError(
            `BoundsError: index ${idx} out of range for length ${target.length}`
          );
        }
        return target[idx - 1];
      }
      case 'call':
        return evalCallNode(node, env);
      default:
        throw new JuliaError(`Cannot evaluate node type '${node.type}'`);
    }
    return undefined;
  }

  function evalCallNode(node, env) {
    if (node.callee.type !== 'ident') throw new JuliaError('Only named functions can be called');
    const name = node.callee.name;
    const args = node.args.map((a) => evalExprNode(a, env));

    if (BUILTINS[name]) return BUILTINS[name](args, outputEntries);

    const fn = envGet(env, name);
    if (!fn || fn.__type !== 'function') throw new JuliaError(`'${name}' is not a function`);
    if (args.length !== fn.params.length) {
      throw new JuliaError(
        `MethodError: ${name} expects ${fn.params.length} argument(s), got ${args.length}`
      );
    }
    const callEnv = makeEnv(fn.closureEnv);
    fn.params.forEach((p, i) => envDefine(callEnv, p, args[i]));
    try {
      execBlock(fn.body, callEnv);
    } catch (sig) {
      if (sig instanceof ReturnSignal) return sig.value;
      throw sig;
    }
    return null;
  }

  function execStatement(node, env) {
    tick();
    switch (node.type) {
      case 'funcdef':
        envDefine(env, node.name, {
          __type: 'function',
          params: node.params,
          body: node.body,
          closureEnv: env,
        });
        return;
      case 'assign': {
        let value = evalExprNode(node.value, env);
        if (node.op !== '=') {
          const baseOp = node.op[0];
          const current =
            node.target.type === 'ident'
              ? envGet(env, node.target.name)
              : evalExprNode(node.target, env);
          value = evalBinOp(baseOp, current, value);
        }
        if (node.target.type === 'ident') {
          envSet(env, node.target.name, value);
        } else {
          const arr = evalExprNode(node.target.target, env);
          const idx = evalExprNode(node.target.index, env);
          if (!Array.isArray(arr)) throw new JuliaError('Cannot index-assign a non-array value');
          if (idx < 1 || idx > arr.length) {
            throw new JuliaError(`BoundsError: index ${idx} out of range for length ${arr.length}`);
          }
          arr[idx - 1] = value;
        }
        return;
      }
      case 'exprstmt':
        evalExprNode(node.expr, env);
        return;
      case 'if': {
        for (const clause of node.clauses) {
          if (truthy(evalExprNode(clause.cond, env))) {
            execBlock(clause.body, makeEnv(env));
            return;
          }
        }
        if (node.elseBody) execBlock(node.elseBody, makeEnv(env));
        return;
      }
      case 'for': {
        const iterable = evalExprNode(node.iterable, env);
        const items = Array.isArray(iterable) ? iterable : materializeRange(iterable, 1, iterable);
        for (const item of items) {
          const loopEnv = makeEnv(env);
          envDefine(loopEnv, node.varName, item);
          try {
            execBlock(node.body, loopEnv);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return;
      }
      case 'while': {
        while (truthy(evalExprNode(node.cond, env))) {
          tick();
          const loopEnv = makeEnv(env);
          try {
            execBlock(node.body, loopEnv);
          } catch (sig) {
            if (sig instanceof BreakSignal) break;
            if (sig instanceof ContinueSignal) continue;
            throw sig;
          }
        }
        return;
      }
      case 'return':
        throw new ReturnSignal(node.value ? evalExprNode(node.value, env) : null);
      case 'break':
        throw new BreakSignal();
      case 'continue':
        throw new ContinueSignal();
      default:
        throw new JuliaError(`Cannot execute statement type '${node.type}'`);
    }
  }

  function execBlock(stmts, env) {
    for (const s of stmts) execStatement(s, env);
  }

  const globalEnv = makeEnv(null);
  try {
    const tokens = tokenize(src);
    const ast = parse(tokens);
    execBlock(ast.body, globalEnv);
    return { entries: outputEntries, hasError: false };
  } catch (e) {
    if (e instanceof BreakSignal || e instanceof ContinueSignal) {
      outputEntries.push({
        kind: 'error',
        text: `${e instanceof BreakSignal ? 'break' : 'continue'} used outside a loop`,
      });
    } else {
      outputEntries.push({ kind: 'error', text: e.message || String(e) });
    }
    return { entries: outputEntries, hasError: true };
  }
}

function materializeRange(from, step, to) {
  const items = [];
  const MAX = 100000;
  if (step === 0) throw new JuliaError('range step cannot be zero');
  if (step > 0) {
    for (let v = from; v <= to; v += step) {
      items.push(v);
      if (items.length > MAX) throw new JuliaError('Range too large to materialize');
    }
  } else {
    for (let v = from; v >= to; v += step) {
      items.push(v);
      if (items.length > MAX) throw new JuliaError('Range too large to materialize');
    }
  }
  return items;
}

function truthy(v) {
  return v === true || (v !== false && v !== null && v !== undefined && v !== 0 && v !== '');
}

function evalBinOp(op, a, b) {
  switch (op) {
    case '+':
      if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => v + b[i]);
      return a + b;
    case '-':
      if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => v - b[i]);
      return a - b;
    case '*':
      if (Array.isArray(a) && typeof b === 'number') return a.map((v) => v * b);
      if (Array.isArray(b) && typeof a === 'number') return b.map((v) => v * a);
      return a * b;
    case '/':
      return a / b;
    case '%':
      return a % b;
    case '^':
      return Math.pow(a, b);
    case '==':
      return arrEq(a, b);
    case '!=':
      return !arrEq(a, b);
    case '<':
      return a < b;
    case '>':
      return a > b;
    case '<=':
      return a <= b;
    case '>=':
      return a >= b;
    default:
      throw new JuliaError(`Unknown operator '${op}'`);
  }
}
function arrEq(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => arrEq(v, b[i]));
  }
  return a === b;
}

/* ---------------------------------------------------------------------- */
/* Built-ins — a small, fixed standard-library subset (this is the        */
/* "pre-baked package set" stand-in: Base + LinearAlgebra/Statistics-style */
/* helpers, since live Pkg.add() has no network path in any real sandbox) */
/* ---------------------------------------------------------------------- */
function requireArray(v, fname) {
  if (!Array.isArray(v)) throw new JuliaError(`MethodError: ${fname} expects an array`);
  return v;
}

const BUILTINS = {
  println: (args, out) => {
    out.push({ kind: 'text', text: args.map(formatValue).join('') });
    return null;
  },
  print: (args, out) => {
    out.push({ kind: 'text', text: args.map(formatValue).join('') });
    return null;
  },
  length: (args) => {
    const v = args[0];
    if (Array.isArray(v)) return v.length;
    if (typeof v === 'string') return v.length;
    throw new JuliaError('MethodError: length expects an array or string');
  },
  sum: (args) => requireArray(args[0], 'sum').reduce((a, b) => a + b, 0),
  mean: (args) => {
    const arr = requireArray(args[0], 'mean');
    if (arr.length === 0) throw new JuliaError('mean of empty array is undefined');
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  },
  maximum: (args) => Math.max(...requireArray(args[0], 'maximum')),
  minimum: (args) => Math.min(...requireArray(args[0], 'minimum')),
  abs: (args) => Math.abs(args[0]),
  sqrt: (args) => {
    if (args[0] < 0) throw new JuliaError('DomainError: sqrt requires a non-negative number');
    return Math.sqrt(args[0]);
  },
  round: (args) => {
    if (args.length > 1) {
      const digits = args[1];
      const factor = Math.pow(10, digits);
      return Math.round(args[0] * factor) / factor;
    }
    return Math.round(args[0]);
  },
  floor: (args) => Math.floor(args[0]),
  ceil: (args) => Math.ceil(args[0]),
  collect: (args) => requireArray(args[0], 'collect').slice(),
  reverse: (args) => requireArray(args[0], 'reverse').slice().reverse(),
  sort: (args) =>
    requireArray(args[0], 'sort')
      .slice()
      .sort((a, b) => a - b),
  zeros: (args) => new Array(args[0] || 0).fill(0),
  ones: (args) => new Array(args[0] || 0).fill(1),
  string: (args) => args.map(formatValue).join(''),
  typeof: (args) => juliaTypeName(args[0]),
  Int: (args) => Math.trunc(args[0]),
  Float64: (args) => args[0] * 1.0,
  rand: (args) => {
    if (args.length === 0) return Math.random();
    return Math.floor(Math.random() * args[0]) + 1;
  },
  plot: (args, out) => {
    let x, y;
    if (args.length >= 2) {
      x = requireArray(args[0], 'plot');
      y = requireArray(args[1], 'plot');
    } else {
      y = requireArray(args[0], 'plot');
      x = y.map((_, i) => i + 1);
    }
    out.push({ kind: 'plot', plotType: 'scatter', x, y });
    return null;
  },
  scatter: (args, out) => BUILTINS.plot(args, out),
  bar: (args, out) => {
    out.push({ kind: 'plot', plotType: 'bar', data: requireArray(args[0], 'bar') });
    return null;
  },
  histogram: (args, out) => {
    out.push({ kind: 'plot', plotType: 'hist', data: requireArray(args[0], 'histogram') });
    return null;
  },
};
// 'push!' and 'pop!' contain a character that isn't valid in a JS identifier
// used as an object-literal key above without quoting, so they're added here.
BUILTINS['push!'] = (args) => {
  const arr = requireArray(args[0], 'push!');
  arr.push(args[1]);
  return arr;
};
BUILTINS['pop!'] = (args) => {
  const arr = requireArray(args[0], 'pop!');
  if (arr.length === 0) throw new JuliaError('ArgumentError: array must be non-empty');
  return arr.pop();
};

function juliaTypeName(v) {
  if (typeof v === 'boolean') return 'Bool';
  if (typeof v === 'number') return Number.isInteger(v) ? 'Int64' : 'Float64';
  if (typeof v === 'string') return 'String';
  if (Array.isArray(v)) return 'Vector';
  if (v && v.__type === 'function') return 'Function';
  return 'Any';
}

function formatValue(v) {
  if (v === null || v === undefined) return 'nothing';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return formatNumber(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return `[${v.map(formatValue).join(', ')}]`;
  return String(v);
}
function formatNumber(v) {
  if (Number.isNaN(v)) return 'NaN';
  if (v === Infinity) return 'Inf';
  if (v === -Infinity) return '-Inf';
  if (Number.isInteger(v)) return String(v);
  const rounded = Math.round(v * 1e6) / 1e6;
  return String(rounded);
}

/* ---------------------------------------------------------------------- */
/* Output rendering — same entry-kind model (text/error/plot) as the R    */
/* editor, so a print statement and a plot can appear in the order the    */
/* code actually produced them.                                          */
/* ---------------------------------------------------------------------- */
function renderOutput(outputBody, entries) {
  outputBody.innerHTML = '';
  if (entries.length === 0) {
    outputBody.innerHTML = '<span class="je-output-placeholder">Ran with no output.</span>';
    return;
  }
  const frag = document.createDocumentFragment();
  for (const entry of entries) frag.appendChild(renderEntry(entry));
  outputBody.appendChild(frag);
}

function renderEntry(entry) {
  if (entry.kind === 'text') {
    const div = document.createElement('div');
    div.className = 'je-out-line';
    div.textContent = entry.text;
    return div;
  }
  if (entry.kind === 'error') {
    const div = document.createElement('div');
    div.className = 'je-out-line error';
    div.textContent = entry.text;
    return div;
  }
  if (entry.kind === 'plot') return renderPlot(entry);
  return document.createElement('div');
}

const PLOT_COLORS = {
  primary: '#9558b2',
  accent: '#c9a4dd',
  axis: 'rgba(255,255,255,0.35)',
  text: '#9ca3af',
};

function renderPlot(entry) {
  const wrap = document.createElement('div');
  wrap.className = 'je-out-plot';
  const canvas = document.createElement('canvas');
  canvas.width = 560;
  canvas.height = 260;
  wrap.appendChild(canvas);
  if (entry.plotType === 'scatter') drawScatter(canvas, entry.x, entry.y);
  else if (entry.plotType === 'hist') drawHist(canvas, entry.data);
  else if (entry.plotType === 'bar') drawBar(canvas, entry.data);
  const caption = document.createElement('div');
  caption.className = 'je-out-plot-caption';
  caption.textContent = "Simulated locally from your code's data — not real Plots.jl rendering.";
  wrap.appendChild(caption);
  return wrap;
}

function plotFrame(ctx, w, h, pad) {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = PLOT_COLORS.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();
}

function drawScatter(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height,
    pad = 36;
  plotFrame(ctx, w, h, pad);
  if (!x.length || !y.length) return;
  const xMin = Math.min(...x),
    xMax = Math.max(...x);
  const yMin = Math.min(...y),
    yMax = Math.max(...y);
  const xRange = xMax - xMin || 1,
    yRange = yMax - yMin || 1;
  const toPx = (vx, vy) => [
    pad + ((vx - xMin) / xRange) * (w - 2 * pad),
    h - pad - ((vy - yMin) / yRange) * (h - 2 * pad),
  ];
  ctx.strokeStyle = PLOT_COLORS.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  x.forEach((vx, i) => {
    const [px, py] = toPx(vx, y[i]);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.fillStyle = PLOT_COLORS.primary;
  x.forEach((vx, i) => {
    const [px, py] = toPx(vx, y[i]);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  drawMinMaxLabels(ctx, w, h, pad, xMin, xMax, yMin, yMax);
}

function drawHist(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height,
    pad = 36;
  plotFrame(ctx, w, h, pad);
  if (!data.length) return;
  const min = Math.min(...data),
    max = Math.max(...data);
  const binCount = Math.max(4, Math.min(12, Math.round(Math.sqrt(data.length))));
  const binSize = (max - min || 1) / binCount;
  const bins = new Array(binCount).fill(0);
  data.forEach((v) => {
    let idx = Math.floor((v - min) / binSize);
    idx = Math.max(0, Math.min(binCount - 1, idx));
    bins[idx]++;
  });
  const maxCount = Math.max(...bins) || 1;
  const barW = (w - 2 * pad) / binCount;
  ctx.fillStyle = PLOT_COLORS.primary;
  bins.forEach((count, i) => {
    const barH = (count / maxCount) * (h - 2 * pad);
    ctx.fillRect(pad + i * barW + 2, h - pad - barH, barW - 4, barH);
  });
  ctx.fillStyle = PLOT_COLORS.text;
  ctx.font = '10px Poppins, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(formatValue(min), pad, h - pad + 14);
  ctx.textAlign = 'right';
  ctx.fillText(formatValue(max), w - pad, h - pad + 14);
}

function drawBar(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height,
    pad = 36;
  plotFrame(ctx, w, h, pad);
  if (!data.length) return;
  const maxVal = Math.max(...data, 0),
    minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;
  const barW = (w - 2 * pad) / data.length;
  const zeroY = h - pad - ((0 - minVal) / range) * (h - 2 * pad);
  ctx.fillStyle = PLOT_COLORS.accent;
  data.forEach((v, i) => {
    const barY = h - pad - ((v - minVal) / range) * (h - 2 * pad);
    ctx.fillRect(pad + i * barW + 3, Math.min(barY, zeroY), barW - 6, Math.abs(zeroY - barY));
  });
}

function drawMinMaxLabels(ctx, w, h, pad, xMin, xMax, yMin, yMax) {
  ctx.fillStyle = PLOT_COLORS.text;
  ctx.font = '10px Poppins, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(formatValue(xMin), pad, h - pad + 14);
  ctx.textAlign = 'right';
  ctx.fillText(formatValue(xMax), w - pad, h - pad + 14);
  ctx.save();
  ctx.translate(10, h - pad);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.fillText(formatValue(yMin), 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(10, pad);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.fillText(formatValue(yMax), 0, 0);
  ctx.restore();
}

/* ---------------------------------------------------------------------- */
/* Editor init — mirrors initREditor()'s structure                        */
/* ---------------------------------------------------------------------- */
function initJuliaEditor() {
  const editor = document.getElementById('jeEditor');
  if (!editor) return;

  const outputBody = document.getElementById('jeOutputBody');
  const runBtn = document.getElementById('jeRunBtn');
  const resetBtn = document.getElementById('jeResetBtn');
  const copyBtn = document.getElementById('jeCopyBtn');
  const saveBtn = document.getElementById('jeSaveBtn');
  const exampleSelect = document.getElementById('jeExampleSelect');
  const lineNumbers = document.getElementById('jeLineNumbers');
  const statusBadge = document.getElementById('jeStatusBadge');
  const openSupportBtn = document.getElementById('jeOpenSupportBtn');
  const closeSupportBtn = document.getElementById('jeCloseSupportBtn');
  const supportModal = document.getElementById('je-support-modal');
  const modalBackdrop = document.getElementById('jeModalBackdrop');

  const SAVE_KEY = 'julia-editor-draft';
  let runSeq = 0;

  const saved = localStorage.getItem(SAVE_KEY);
  editor.value = saved && saved.trim().length > 0 ? saved : JULIA_EXAMPLES.basics;
  updateLines();

  exampleSelect.addEventListener('change', () => {
    editor.value = JULIA_EXAMPLES[exampleSelect.value];
    updateLines();
  });

  runBtn.addEventListener('click', runCode);

  resetBtn.addEventListener('click', () => {
    editor.value = JULIA_EXAMPLES[exampleSelect.value] || JULIA_EXAMPLES.basics;
    updateLines();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      }, 2000);
    } catch {
      /* clipboard permission denied — non-fatal */
    }
  });

  saveBtn.addEventListener('click', () => {
    localStorage.setItem(SAVE_KEY, editor.value);
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      saveBtn.innerHTML = '<i class="fas fa-save"></i>';
    }, 2000);
  });

  editor.addEventListener('input', updateLines);
  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value =
        editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
      updateLines();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      localStorage.setItem(SAVE_KEY, editor.value);
    }
  });

  openSupportBtn?.addEventListener('click', () => {
    supportModal.hidden = false;
  });
  closeSupportBtn?.addEventListener('click', () => {
    supportModal.hidden = true;
  });
  modalBackdrop?.addEventListener('click', () => {
    supportModal.hidden = true;
  });

  function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="je-output-placeholder">Running...</span>';

    setTimeout(() => {
      const { entries, hasError } = run(editor.value);
      if (seq !== runSeq) return; // stale run — a newer one started first
      renderOutput(outputBody, entries);
      setStatus(hasError ? 'error' : 'ready');
    }, 10);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'je-status-ready'],
      running: ['Running', 'je-status-running'],
      error: ['Error', 'je-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `je-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }
}
