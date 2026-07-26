document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initLuaEditor();
  } catch (e) {
    console.error('LuaEditor:', e);
  }
});

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

/* ─── Lua Examples ─── */
const LUA_EXAMPLES = {
  hello: `print("Hello, World!")
print("Welcome to the Lua Language Editor!")
`,

  variables: `-- \`local\` creates a block-scoped variable (Lua's default and idiomatic choice)
local language = "Lua"
local year = 1993

-- Lua is dynamically typed; a variable can be reassigned to any type
local users = 100
users = users + 50

-- Lua has no true constants, but SCREAMING_CASE signals "treat as constant"
local PI = 3.14159

print(string.format("Language: %s", language))
print(string.format("Year Created: %d", year))
print(string.format("Current Users: %d", users))
print(string.format("PI: %.5f", PI))
`,

  loops: `-- Numeric for loop
print("Counting up:")
for i = 1, 5 do
  print("  " .. i)
end

-- While loop
print("")
print("Counting down:")
local count = 3
while count > 0 do
  print("  " .. count)
  count = count - 1
end

-- Iterating over a table (array-like)
local fruits = {"Apple", "Banana", "Cherry"}
print("")
print("Fruits:")
for idx, fruit in ipairs(fruits) do
  print("  " .. idx .. ": " .. fruit:upper())
end
`,

  functions: `-- Basic function
local function greet(name)
  return "Hello, " .. name .. "!"
end

-- Function with a default-style argument (Lua has no native defaults; use \`or\`)
local function power(base, exp)
  exp = exp or 2
  local result = 1
  for _ = 1, exp do
    result = result * base
  end
  return result
end

-- Functions are first-class values and can return multiple results
local function minMax(a, b)
  if a < b then
    return a, b
  else
    return b, a
  end
end

print(greet("Algo Verse"))
print(string.format("3 squared is %d", power(3)))
print(string.format("2 to the 4th is %d", power(2, 4)))

local lo, hi = minMax(10, 3)
print(string.format("Min: %d, Max: %d", lo, hi))
`,

  objects: `-- Lua has no classes -- tables + metatables emulate objects
local Person = {}
Person.__index = Person

function Person.new(name, age, isDeveloper)
  local self = setmetatable({}, Person)
  self.name = name
  self.age = age
  self.isDeveloper = isDeveloper
  return self
end

function Person:introduce()
  local role = "not a developer"
  if self.isDeveloper then role = "a developer" end
  print(string.format("Hi, I'm %s, I am %d years old and %s.", self.name, self.age, role))
end

-- "Inheritance" via metatable chaining
local Animal = {}
Animal.__index = Animal

function Animal.new(name)
  return setmetatable({ name = name }, Animal)
end

function Animal:speak()
  print(self.name .. " makes a noise.")
end

local Dog = setmetatable({}, { __index = Animal })
Dog.__index = Dog

function Dog.new(name, breed)
  local self = Animal.new(name)
  self.breed = breed
  return setmetatable(self, Dog)
end

function Dog:speak()
  print(self.name .. " barks! (Breed: " .. self.breed .. ")")
end

-- Main execution
local alice = Person.new("Alice", 30, true)
alice:introduce()

local rex = Dog.new("Rex", "German Shepherd")
rex:speak()
`,
};

/* ============================================================
   LUA SUBSET INTERPRETER
   Lexer -> recursive-descent Parser -> tree-walking Evaluator.
   Scope is documented in the page's "what's supported" modal.
   ============================================================ */

const LUA_KEYWORDS = new Set([
  'and',
  'break',
  'do',
  'else',
  'elseif',
  'end',
  'false',
  'for',
  'function',
  'goto',
  'if',
  'in',
  'local',
  'nil',
  'not',
  'or',
  'repeat',
  'return',
  'then',
  'true',
  'until',
  'while',
]);

class LuaSyntaxError extends Error {}
class LuaRuntimeError extends Error {}

/* ─── Lexer ─── */
function tokenize(src) {
  const tokens = [];
  let i = 0;
  let line = 1;
  const n = src.length;

  const isDigit = (c) => c >= '0' && c <= '9';
  const isAlpha = (c) => !!c && /[A-Za-z_]/.test(c);
  const isAlnum = (c) => !!c && /[A-Za-z0-9_]/.test(c);

  while (i < n) {
    const c = src[i];

    if (c === '\n') {
      line++;
      i++;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      i++;
      continue;
    }

    // comments (-- line, --[[ block ]])
    if (c === '-' && src[i + 1] === '-') {
      i += 2;
      if (src[i] === '[' && src[i + 1] === '[') {
        i += 2;
        const close = src.indexOf(']]', i);
        if (close === -1) {
          i = n;
        } else {
          for (let k = i; k < close; k++) if (src[k] === '\n') line++;
          i = close + 2;
        }
      } else {
        while (i < n && src[i] !== '\n') i++;
      }
      continue;
    }

    // long strings [[ ... ]] (single-level only — see modal)
    if (c === '[' && src[i + 1] === '[') {
      i += 2;
      const startLine = line;
      let s = '';
      while (i < n && !(src[i] === ']' && src[i + 1] === ']')) {
        if (src[i] === '\n') line++;
        s += src[i];
        i++;
      }
      if (i >= n) throw new LuaSyntaxError('unfinished long string near line ' + startLine);
      i += 2;
      tokens.push({ type: 'STRING', value: s, line: startLine });
      continue;
    }

    // quoted strings
    if (c === '"' || c === "'") {
      const quote = c;
      const startLine = line;
      i++;
      let s = '';
      while (i < n && src[i] !== quote) {
        if (src[i] === '\n') throw new LuaSyntaxError('unfinished string near line ' + startLine);
        if (src[i] === '\\') {
          const esc = src[i + 1];
          const map = {
            n: '\n',
            t: '\t',
            r: '\r',
            '\\': '\\',
            '"': '"',
            "'": "'",
            a: '\x07',
            b: '\b',
            f: '\f',
            v: '\v',
            0: '\0',
          };
          s += esc in map ? map[esc] : esc;
          i += 2;
        } else {
          s += src[i];
          i++;
        }
      }
      if (i >= n) throw new LuaSyntaxError('unfinished string near line ' + startLine);
      i++;
      tokens.push({ type: 'STRING', value: s, line: startLine });
      continue;
    }

    // numbers
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
      const start = i;
      if (c === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
        i += 2;
        while (i < n && /[0-9a-fA-F]/.test(src[i])) i++;
        tokens.push({ type: 'NUMBER', value: parseInt(src.slice(start, i), 16), line });
        continue;
      }
      while (i < n && isDigit(src[i])) i++;
      if (src[i] === '.') {
        i++;
        while (i < n && isDigit(src[i])) i++;
      }
      if (src[i] === 'e' || src[i] === 'E') {
        i++;
        if (src[i] === '+' || src[i] === '-') i++;
        while (i < n && isDigit(src[i])) i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(src.slice(start, i)), line });
      continue;
    }

    // names / keywords
    if (isAlpha(c)) {
      const start = i;
      while (i < n && isAlnum(src[i])) i++;
      const word = src.slice(start, i);
      if (LUA_KEYWORDS.has(word)) tokens.push({ type: word.toUpperCase(), value: word, line });
      else tokens.push({ type: 'NAME', value: word, line });
      continue;
    }

    // operators
    if (src.slice(i, i + 3) === '...') {
      tokens.push({ type: '...', value: '...', line });
      i += 3;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (['==', '~=', '<=', '>=', '..'].includes(two)) {
      tokens.push({ type: two, value: two, line });
      i += 2;
      continue;
    }
    if ('+-*/%^#<>=(){}[];:,.'.includes(c)) {
      tokens.push({ type: c, value: c, line });
      i++;
      continue;
    }

    throw new LuaSyntaxError(`unexpected symbol near '${c}' (line ${line})`);
  }

  tokens.push({ type: 'EOF', value: null, line });
  return tokens;
}

/* ─── Parser ─── */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  peek(o = 0) {
    return this.tokens[this.pos + o];
  }
  at(type) {
    return this.peek().type === type;
  }
  advance() {
    return this.tokens[this.pos++];
  }
  match(...types) {
    if (types.includes(this.peek().type)) return this.advance();
    return null;
  }
  expect(type, msg) {
    if (this.at(type)) return this.advance();
    const t = this.peek();
    throw new LuaSyntaxError(
      (msg || `expected '${type}'`) + ` near line ${t.line} (got '${t.value ?? t.type}')`
    );
  }

  parseChunk() {
    const body = this.parseBlock();
    this.expect('EOF', 'expected end of input');
    return { type: 'Chunk', body };
  }

  parseBlock() {
    const stmts = [];
    while (!this.blockEnd()) {
      if (this.at('RETURN')) {
        stmts.push(this.parseReturn());
        break;
      }
      const s = this.parseStatement();
      if (s) stmts.push(s);
    }
    return stmts;
  }

  blockEnd() {
    return ['EOF', 'END', 'ELSE', 'ELSEIF', 'UNTIL'].includes(this.peek().type);
  }

  parseReturn() {
    this.expect('RETURN');
    let args = [];
    if (!this.blockEnd() && !this.at(';')) args = this.parseExprList();
    this.match(';');
    return { type: 'ReturnStmt', args };
  }

  parseStatement() {
    if (this.match(';')) return null;
    if (this.at('IF')) return this.parseIf();
    if (this.at('WHILE')) return this.parseWhile();
    if (this.at('DO')) {
      this.advance();
      const body = this.parseBlock();
      this.expect('END');
      return { type: 'DoStmt', body };
    }
    if (this.at('FOR')) return this.parseFor();
    if (this.at('REPEAT')) return this.parseRepeat();
    if (this.at('FUNCTION')) return this.parseFunctionStmt();
    if (this.at('LOCAL')) return this.parseLocal();
    if (this.at('BREAK')) {
      this.advance();
      return { type: 'BreakStmt' };
    }
    return this.parseExprStatement();
  }

  parseIf() {
    this.expect('IF');
    const clauses = [];
    const cond = this.parseExpr();
    this.expect('THEN');
    const body = this.parseBlock();
    clauses.push({ cond, body });
    while (this.at('ELSEIF')) {
      this.advance();
      const c = this.parseExpr();
      this.expect('THEN');
      const b = this.parseBlock();
      clauses.push({ cond: c, body: b });
    }
    let elseBody = null;
    if (this.match('ELSE')) elseBody = this.parseBlock();
    this.expect('END');
    return { type: 'IfStmt', clauses, elseBody };
  }

  parseWhile() {
    this.expect('WHILE');
    const cond = this.parseExpr();
    this.expect('DO');
    const body = this.parseBlock();
    this.expect('END');
    return { type: 'WhileStmt', cond, body };
  }

  parseRepeat() {
    this.expect('REPEAT');
    const body = this.parseBlock();
    this.expect('UNTIL');
    const cond = this.parseExpr();
    return { type: 'RepeatStmt', body, cond };
  }

  parseFor() {
    this.expect('FOR');
    const name1 = this.expect('NAME').value;
    if (this.match('=')) {
      const start = this.parseExpr();
      this.expect(',');
      const limit = this.parseExpr();
      let step = null;
      if (this.match(',')) step = this.parseExpr();
      this.expect('DO');
      const body = this.parseBlock();
      this.expect('END');
      return { type: 'NumericForStmt', varName: name1, start, limit, step, body };
    }
    const names = [name1];
    while (this.match(',')) names.push(this.expect('NAME').value);
    this.expect('IN');
    const exprs = this.parseExprList();
    this.expect('DO');
    const body = this.parseBlock();
    this.expect('END');
    return { type: 'GenericForStmt', names, exprs, body };
  }

  parseFunctionStmt() {
    this.expect('FUNCTION');
    let target = { type: 'VarExpr', name: this.expect('NAME').value };
    let isMethod = false;
    while (this.at('.') || this.at(':')) {
      const sep = this.advance().type;
      const key = this.expect('NAME').value;
      target = {
        type: 'IndexExpr',
        object: target,
        key: { type: 'StringLiteral', value: key },
        computed: false,
      };
      if (sep === ':') {
        isMethod = true;
        break;
      }
    }
    const func = this.parseFunctionBody(isMethod);
    return { type: 'AssignStmt', targets: [target], values: [func] };
  }

  parseFunctionBody(isMethod) {
    this.expect('(');
    const params = [];
    if (isMethod) params.push('self');
    if (!this.at(')')) {
      if (this.at('...')) {
        this.advance();
      } else {
        params.push(this.expect('NAME').value);
        while (this.match(',')) {
          if (this.at('...')) {
            this.advance();
            break;
          }
          params.push(this.expect('NAME').value);
        }
      }
    }
    this.expect(')');
    const body = this.parseBlock();
    this.expect('END');
    return { type: 'FunctionExpr', params, body };
  }

  parseLocal() {
    this.expect('LOCAL');
    if (this.match('FUNCTION')) {
      const name = this.expect('NAME').value;
      const func = this.parseFunctionBody(false);
      return { type: 'LocalDecl', names: [name], values: [func] };
    }
    const names = [this.expect('NAME').value];
    while (this.match(',')) names.push(this.expect('NAME').value);
    let values = [];
    if (this.match('=')) values = this.parseExprList();
    return { type: 'LocalDecl', names, values };
  }

  parseExprStatement() {
    const expr = this.parseSuffixedExpr();
    if (this.at('=') || this.at(',')) {
      const targets = [expr];
      while (this.match(',')) targets.push(this.parseSuffixedExpr());
      this.expect('=');
      const values = this.parseExprList();
      return { type: 'AssignStmt', targets, values };
    }
    if (expr.type !== 'CallExpr' && expr.type !== 'MethodCallExpr') {
      throw new LuaSyntaxError(
        'syntax error: expression is not a statement (line ' + this.peek().line + ')'
      );
    }
    return { type: 'CallStmt', expr };
  }

  parseExprList() {
    const list = [this.parseExpr()];
    while (this.match(',')) list.push(this.parseExpr());
    return list;
  }

  parseExpr() {
    return this.parseOr();
  }
  parseOr() {
    let left = this.parseAnd();
    while (this.match('OR')) left = { type: 'LogicalExpr', op: 'or', left, right: this.parseAnd() };
    return left;
  }
  parseAnd() {
    let left = this.parseComparison();
    while (this.match('AND'))
      left = { type: 'LogicalExpr', op: 'and', left, right: this.parseComparison() };
    return left;
  }
  parseComparison() {
    let left = this.parseConcat();
    while (['<', '>', '<=', '>=', '==', '~='].includes(this.peek().type)) {
      const op = this.advance().type;
      left = { type: 'BinaryExpr', op, left, right: this.parseConcat() };
    }
    return left;
  }
  parseConcat() {
    const left = this.parseAdd();
    if (this.at('..')) {
      this.advance();
      return { type: 'BinaryExpr', op: '..', left, right: this.parseConcat() };
    }
    return left;
  }
  parseAdd() {
    let left = this.parseMul();
    while (this.at('+') || this.at('-')) {
      const op = this.advance().type;
      left = { type: 'BinaryExpr', op, left, right: this.parseMul() };
    }
    return left;
  }
  parseMul() {
    let left = this.parseUnary();
    while (['*', '/', '%'].includes(this.peek().type)) {
      const op = this.advance().type;
      left = { type: 'BinaryExpr', op, left, right: this.parseUnary() };
    }
    return left;
  }
  parseUnary() {
    if (this.at('NOT') || this.at('-') || this.at('#')) {
      const op = this.advance().type;
      return { type: 'UnaryExpr', op, arg: this.parseUnary() };
    }
    return this.parsePow();
  }
  parsePow() {
    const left = this.parseSuffixedExpr();
    if (this.at('^')) {
      this.advance();
      return { type: 'BinaryExpr', op: '^', left, right: this.parseUnary() };
    }
    return left;
  }

  parsePrimary() {
    const t = this.peek();
    if (t.type === 'NIL') {
      this.advance();
      return { type: 'NilLiteral' };
    }
    if (t.type === 'TRUE') {
      this.advance();
      return { type: 'BooleanLiteral', value: true };
    }
    if (t.type === 'FALSE') {
      this.advance();
      return { type: 'BooleanLiteral', value: false };
    }
    if (t.type === 'NUMBER') {
      this.advance();
      return { type: 'NumberLiteral', value: t.value };
    }
    if (t.type === 'STRING') {
      this.advance();
      return { type: 'StringLiteral', value: t.value };
    }
    if (t.type === 'FUNCTION') {
      this.advance();
      return this.parseFunctionBody(false);
    }
    if (t.type === '{') return this.parseTable();
    if (t.type === '(') {
      this.advance();
      const e = this.parseExpr();
      this.expect(')');
      return { type: 'ParenExpr', expr: e };
    }
    if (t.type === 'NAME') {
      this.advance();
      return { type: 'VarExpr', name: t.value };
    }
    throw new LuaSyntaxError(`unexpected token '${t.value ?? t.type}' (line ${t.line})`);
  }

  parseSuffixedExpr() {
    let expr = this.parsePrimary();
    for (;;) {
      if (this.at('.')) {
        this.advance();
        const key = this.expect('NAME').value;
        expr = {
          type: 'IndexExpr',
          object: expr,
          key: { type: 'StringLiteral', value: key },
          computed: false,
        };
      } else if (this.at('[')) {
        this.advance();
        const key = this.parseExpr();
        this.expect(']');
        expr = { type: 'IndexExpr', object: expr, key, computed: true };
      } else if (this.at(':')) {
        this.advance();
        const method = this.expect('NAME').value;
        const args = this.parseArgs();
        expr = { type: 'MethodCallExpr', object: expr, method, args };
      } else if (this.at('(') || this.at('STRING') || this.at('{')) {
        const args = this.parseArgs();
        expr = { type: 'CallExpr', callee: expr, args };
      } else {
        break;
      }
    }
    return expr;
  }

  parseArgs() {
    if (this.at('STRING')) {
      const t = this.advance();
      return [{ type: 'StringLiteral', value: t.value }];
    }
    if (this.at('{')) return [this.parseTable()];
    this.expect('(');
    let args = [];
    if (!this.at(')')) args = this.parseExprList();
    this.expect(')');
    return args;
  }

  parseTable() {
    this.expect('{');
    const fields = [];
    while (!this.at('}')) {
      if (this.at('[')) {
        this.advance();
        const key = this.parseExpr();
        this.expect(']');
        this.expect('=');
        fields.push({ kind: 'keyed', key, value: this.parseExpr() });
      } else if (this.at('NAME') && this.peek(1).type === '=') {
        const key = this.advance().value;
        this.advance();
        fields.push({ kind: 'named', key, value: this.parseExpr() });
      } else {
        fields.push({ kind: 'positional', value: this.parseExpr() });
      }
      if (this.at(',') || this.at(';')) this.advance();
      else break;
    }
    this.expect('}');
    return { type: 'TableExpr', fields };
  }
}

/* ─── Runtime values ─── */
let __idCounter = 1;

function normalizeKey(key) {
  if (typeof key === 'number' && Number.isInteger(key)) return key;
  return key;
}

class LuaTable {
  constructor() {
    this.hash = new Map();
    this.metatable = null;
  }
  get(key) {
    key = normalizeKey(key);
    return this.hash.has(key) ? this.hash.get(key) : undefined;
  }
  rawset(key, value) {
    key = normalizeKey(key);
    if (value === undefined) this.hash.delete(key);
    else this.hash.set(key, value);
  }
  length() {
    let n = 0;
    while (this.hash.has(n + 1)) n++;
    return n;
  }
}

class LuaFunction {
  constructor(params, body, closure) {
    this.params = params;
    this.body = body;
    this.closure = closure;
  }
}

class Env {
  constructor(parent) {
    this.vars = new Map();
    this.parent = parent;
  }
  define(name, value) {
    this.vars.set(name, value);
  }
  get(name) {
    let e = this;
    while (e) {
      if (e.vars.has(name)) return e.vars.get(name);
      e = e.parent;
    }
    return undefined;
  }
  set(name, value) {
    let e = this;
    while (e) {
      if (e.vars.has(name)) {
        e.vars.set(name, value);
        return;
      }
      e = e.parent;
    }
    let g = this;
    while (g.parent) g = g.parent;
    g.vars.set(name, value);
  }
}

class BreakSignal {}
class ReturnSignal {
  constructor(values) {
    this.values = values;
  }
}

function luaTruthy(v) {
  return v !== undefined && v !== false;
}
function isLuaTable(v) {
  return v instanceof LuaTable;
}

function luaTypeName(v) {
  if (v === undefined || v === null) return 'nil';
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'number') return 'number';
  if (typeof v === 'string') return 'string';
  if (v instanceof LuaTable) return 'table';
  if (v instanceof LuaFunction || typeof v === 'function') return 'function';
  return 'userdata';
}

function luaNumToStr(n) {
  if (Number.isInteger(n)) return String(n);
  let s = n.toPrecision(14);
  if (s.indexOf('.') !== -1 && s.indexOf('e') === -1) {
    s = s.replace(/0+$/, '').replace(/\.$/, '');
  }
  return s;
}

function luaToDisplayString(v) {
  if (v === undefined || v === null) return 'nil';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return luaNumToStr(v);
  if (typeof v === 'string') return v;
  if (v instanceof LuaTable) {
    if (!v.__id) v.__id = (__idCounter++).toString(16).padStart(8, '0');
    return 'table: 0x' + v.__id;
  }
  if (v instanceof LuaFunction || typeof v === 'function') {
    if (!v.__id) v.__id = (__idCounter++).toString(16).padStart(8, '0');
    return 'function: 0x' + v.__id;
  }
  return String(v);
}

function luaFormat(fmt, args) {
  let ai = 0;
  return fmt.replace(/%([-+ 0#]*)(\d*)(\.\d+)?([sdifgxXo%])/g, (m, flags, width, prec, conv) => {
    if (conv === '%') return '%';
    const arg = args[ai++];
    let out;
    if (conv === 's') out = luaToDisplayString(arg);
    else if (conv === 'd' || conv === 'i') out = String(Math.trunc(Number(arg)));
    else if (conv === 'f') out = Number(arg).toFixed(prec ? parseInt(prec.slice(1), 10) : 6);
    else if (conv === 'g') out = String(Number(arg));
    else if (conv === 'x') out = (Number(arg) >>> 0).toString(16);
    else if (conv === 'X') out = (Number(arg) >>> 0).toString(16).toUpperCase();
    else if (conv === 'o') out = (Number(arg) >>> 0).toString(8);
    else out = String(arg);
    if (width) {
      const w = parseInt(width, 10);
      const padChar = flags.includes('0') && !flags.includes('-') ? '0' : ' ';
      if (out.length < w) out = flags.includes('-') ? out.padEnd(w, ' ') : out.padStart(w, padChar);
    }
    return out;
  });
}

/* ─── Evaluator ─── */
class LuaInterpreter {
  constructor({ onPrint }) {
    this.globals = new Env(null);
    this.onPrint = onPrint || (() => {});
    this.steps = 0;
    this.startTime = 0;
    this.MAX_STEPS = 4000000;
    this.MAX_MS = 4000;
    this.installStdlib();
  }

  run(src) {
    this.steps = 0;
    this.startTime = performance.now();
    const tokens = tokenize(src);
    const parser = new Parser(tokens);
    const chunk = parser.parseChunk();
    const env = new Env(this.globals);
    try {
      this.execBlock(chunk.body, env);
    } catch (e) {
      if (e instanceof ReturnSignal) return;
      throw e;
    }
  }

  tick() {
    this.steps++;
    if (this.steps % 2000 === 0) {
      if (this.steps > this.MAX_STEPS || performance.now() - this.startTime > this.MAX_MS) {
        throw new LuaRuntimeError(
          'script exceeded the maximum execution budget (possible infinite loop)'
        );
      }
    }
  }

  execBlock(stmts, env) {
    for (const s of stmts) this.execStmt(s, env);
  }

  execStmt(stmt, env) {
    this.tick();
    switch (stmt.type) {
      case 'LocalDecl': {
        const values = this.evalExprListExpand(stmt.values, env, stmt.names.length);
        stmt.names.forEach((name, idx) => env.define(name, values[idx]));
        return;
      }
      case 'AssignStmt': {
        const values = this.evalExprListExpand(stmt.values, env, stmt.targets.length);
        stmt.targets.forEach((target, idx) => this.assignTo(target, values[idx], env));
        return;
      }
      case 'CallStmt':
        this.evalExprMulti(stmt.expr, env);
        return;
      case 'DoStmt':
        this.execBlock(stmt.body, new Env(env));
        return;
      case 'IfStmt': {
        for (const clause of stmt.clauses) {
          if (luaTruthy(this.evalExpr(clause.cond, env))) {
            this.execBlock(clause.body, new Env(env));
            return;
          }
        }
        if (stmt.elseBody) this.execBlock(stmt.elseBody, new Env(env));
        return;
      }
      case 'WhileStmt': {
        try {
          while (luaTruthy(this.evalExpr(stmt.cond, env))) {
            this.tick();
            this.execBlock(stmt.body, new Env(env));
          }
        } catch (e) {
          if (!(e instanceof BreakSignal)) throw e;
        }
        return;
      }
      case 'RepeatStmt': {
        try {
          for (;;) {
            this.tick();
            const loopEnv = new Env(env);
            this.execBlock(stmt.body, loopEnv);
            if (luaTruthy(this.evalExpr(stmt.cond, loopEnv))) break;
          }
        } catch (e) {
          if (!(e instanceof BreakSignal)) throw e;
        }
        return;
      }
      case 'NumericForStmt': {
        const start = this.toNumber(this.evalExpr(stmt.start, env), "'for' initial value");
        const limit = this.toNumber(this.evalExpr(stmt.limit, env), "'for' limit");
        const step = stmt.step ? this.toNumber(this.evalExpr(stmt.step, env), "'for' step") : 1;
        if (step === 0) throw new LuaRuntimeError("'for' step is zero");
        try {
          for (let i = start; step > 0 ? i <= limit : i >= limit; i += step) {
            this.tick();
            const loopEnv = new Env(env);
            loopEnv.define(stmt.varName, i);
            this.execBlock(stmt.body, loopEnv);
          }
        } catch (e) {
          if (!(e instanceof BreakSignal)) throw e;
        }
        return;
      }
      case 'GenericForStmt': {
        const vals = this.evalExprListExpand(stmt.exprs, env, 3);
        const [iterFn, state, initialCtl] = vals;
        let ctl = initialCtl;
        try {
          for (;;) {
            this.tick();
            const results = this.callFunction(iterFn, [state, ctl]);
            if (results[0] === undefined) break;
            ctl = results[0];
            const loopEnv = new Env(env);
            stmt.names.forEach((name, idx) => loopEnv.define(name, results[idx]));
            this.execBlock(stmt.body, loopEnv);
          }
        } catch (e) {
          if (!(e instanceof BreakSignal)) throw e;
        }
        return;
      }
      case 'BreakStmt':
        throw new BreakSignal();
      case 'ReturnStmt': {
        const values = this.evalExprListExpand(stmt.args, env, -1);
        throw new ReturnSignal(values);
      }
      default:
        throw new LuaRuntimeError('unknown statement: ' + stmt.type);
    }
  }

  assignTo(target, value, env) {
    if (target.type === 'VarExpr') {
      env.set(target.name, value);
      return;
    }
    if (target.type === 'IndexExpr') {
      const obj = this.evalExpr(target.object, env);
      const key = target.computed ? this.evalExpr(target.key, env) : target.key.value;
      if (!isLuaTable(obj))
        throw new LuaRuntimeError(`attempt to index a ${luaTypeName(obj)} value`);
      obj.rawset(key, value);
      return;
    }
    throw new LuaRuntimeError('cannot assign to this expression');
  }

  toNumber(v, ctxMsg) {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
    throw new LuaRuntimeError((ctxMsg || 'value') + ' must be a number');
  }

  evalExprListExpand(exprs, env, want) {
    const out = [];
    for (let i = 0; i < exprs.length; i++) {
      if (i === exprs.length - 1) out.push(...this.evalExprMulti(exprs[i], env));
      else out.push(this.evalExpr(exprs[i], env));
    }
    if (want >= 0) {
      while (out.length < want) out.push(undefined);
      out.length = want;
    }
    return out;
  }

  evalExprMulti(expr, env) {
    this.tick();
    if (expr.type === 'CallExpr') {
      const callee = this.evalExpr(expr.callee, env);
      const args = this.evalExprListExpand(expr.args, env, -1);
      return this.callFunction(callee, args, this.describeCallee(expr.callee));
    }
    if (expr.type === 'MethodCallExpr') {
      const obj = this.evalExpr(expr.object, env);
      const fn = this.luaIndex(obj, expr.method);
      const args = this.evalExprListExpand(expr.args, env, -1);
      return this.callFunction(fn, [obj, ...args], expr.method);
    }
    return [this.evalExpr(expr, env)];
  }

  describeCallee(calleeExpr) {
    if (calleeExpr.type === 'VarExpr') return calleeExpr.name;
    if (calleeExpr.type === 'IndexExpr' && !calleeExpr.computed) return calleeExpr.key.value;
    return '?';
  }

  callFunction(fn, args, name) {
    if (typeof fn === 'function') {
      const r = fn(args, this);
      return Array.isArray(r) ? r : r === undefined ? [] : [r];
    }
    if (fn instanceof LuaFunction) {
      const callEnv = new Env(fn.closure);
      fn.params.forEach((p, idx) => callEnv.define(p, args[idx]));
      try {
        this.execBlock(fn.body, callEnv);
      } catch (e) {
        if (e instanceof ReturnSignal) return e.values;
        throw e;
      }
      return [];
    }
    throw new LuaRuntimeError(
      `attempt to call a ${luaTypeName(fn)} value` + (name ? ` (global '${name}')` : '')
    );
  }

  evalExpr(expr, env) {
    this.tick();
    switch (expr.type) {
      case 'NilLiteral':
        return undefined;
      case 'BooleanLiteral':
        return expr.value;
      case 'NumberLiteral':
        return expr.value;
      case 'StringLiteral':
        return expr.value;
      case 'VarExpr':
        return env.get(expr.name);
      case 'ParenExpr':
        return this.evalExpr(expr.expr, env);
      case 'FunctionExpr':
        return new LuaFunction(expr.params, expr.body, env);
      case 'TableExpr': {
        const t = new LuaTable();
        let arrIdx = 1;
        expr.fields.forEach((f, idx) => {
          if (f.kind === 'named') t.rawset(f.key, this.evalExpr(f.value, env));
          else if (f.kind === 'keyed')
            t.rawset(this.evalExpr(f.key, env), this.evalExpr(f.value, env));
          else if (idx === expr.fields.length - 1) {
            this.evalExprMulti(f.value, env).forEach((v) => t.rawset(arrIdx++, v));
          } else {
            t.rawset(arrIdx++, this.evalExpr(f.value, env));
          }
        });
        return t;
      }
      case 'IndexExpr': {
        const obj = this.evalExpr(expr.object, env);
        const key = expr.computed ? this.evalExpr(expr.key, env) : expr.key.value;
        return this.luaIndex(obj, key);
      }
      case 'CallExpr':
      case 'MethodCallExpr':
        return this.evalExprMulti(expr, env)[0];
      case 'LogicalExpr': {
        const left = this.evalExpr(expr.left, env);
        if (expr.op === 'and') return luaTruthy(left) ? this.evalExpr(expr.right, env) : left;
        return luaTruthy(left) ? left : this.evalExpr(expr.right, env);
      }
      case 'UnaryExpr': {
        const v = this.evalExpr(expr.arg, env);
        if (expr.op === '-') return -this.toNumber(v, 'unary operand');
        if (expr.op === 'NOT') return !luaTruthy(v);
        if (expr.op === '#') {
          if (typeof v === 'string') return v.length;
          if (isLuaTable(v)) return v.length();
          throw new LuaRuntimeError(`attempt to get length of a ${luaTypeName(v)} value`);
        }
        throw new LuaRuntimeError('bad unary op');
      }
      case 'BinaryExpr':
        return this.evalBinary(expr, env);
      default:
        throw new LuaRuntimeError('unknown expression: ' + expr.type);
    }
  }

  luaIndex(obj, key) {
    if (typeof obj === 'string') return this.stringTable.get(key);
    if (!isLuaTable(obj)) {
      throw new LuaRuntimeError(`attempt to index a ${luaTypeName(obj)} value`);
    }
    if (obj.hash.has(normalizeKey(key))) return obj.get(key);
    if (obj.metatable) {
      const idx = obj.metatable.get('__index');
      if (idx instanceof LuaFunction || typeof idx === 'function') {
        return this.callFunction(idx, [obj, key])[0];
      }
      if (isLuaTable(idx)) return this.luaIndex(idx, key);
    }
    return undefined;
  }

  evalBinary(expr, env) {
    const op = expr.op;
    if (op === '==' || op === '~=') {
      const l = this.evalExpr(expr.left, env);
      const r = this.evalExpr(expr.right, env);
      const eq = l === r;
      return op === '==' ? eq : !eq;
    }
    const l = this.evalExpr(expr.left, env);
    const r = this.evalExpr(expr.right, env);
    switch (op) {
      case '+':
        return this.toNumber(l, 'left operand') + this.toNumber(r, 'right operand');
      case '-':
        return this.toNumber(l, 'left operand') - this.toNumber(r, 'right operand');
      case '*':
        return this.toNumber(l, 'left operand') * this.toNumber(r, 'right operand');
      case '/':
        return this.toNumber(l, 'left operand') / this.toNumber(r, 'right operand');
      case '%': {
        const a = this.toNumber(l, 'left operand');
        const b = this.toNumber(r, 'right operand');
        return a - Math.floor(a / b) * b;
      }
      case '^':
        return Math.pow(this.toNumber(l, 'left operand'), this.toNumber(r, 'right operand'));
      case '..':
        return luaToDisplayString(l) + luaToDisplayString(r);
      case '<':
        return this.compare(l, r) < 0;
      case '>':
        return this.compare(l, r) > 0;
      case '<=':
        return this.compare(l, r) <= 0;
      case '>=':
        return this.compare(l, r) >= 0;
      default:
        throw new LuaRuntimeError('bad binary op: ' + op);
    }
  }

  compare(l, r) {
    if (typeof l === 'number' && typeof r === 'number') return l < r ? -1 : l > r ? 1 : 0;
    if (typeof l === 'string' && typeof r === 'string') return l < r ? -1 : l > r ? 1 : 0;
    throw new LuaRuntimeError(`attempt to compare ${luaTypeName(l)} with ${luaTypeName(r)}`);
  }

  installStdlib() {
    const g = this.globals;
    const interp = this;

    g.define('print', (args) => {
      interp.onPrint(args.map((a) => luaToDisplayString(a)).join('\t'));
      return [];
    });
    g.define('type', (args) => [luaTypeName(args[0])]);
    g.define('tostring', (args) => [luaToDisplayString(args[0])]);
    g.define('tonumber', (args) => {
      const v = args[0];
      if (typeof v === 'number') return [v];
      if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return [Number(v)];
      return [undefined];
    });
    g.define('next', (args) => {
      const [t, key] = args;
      if (!isLuaTable(t)) throw new LuaRuntimeError("bad argument #1 to 'next' (table expected)");
      const keys = Array.from(t.hash.keys());
      if (key === undefined)
        return keys.length === 0 ? [undefined] : [keys[0], t.hash.get(keys[0])];
      const idx = keys.indexOf(normalizeKey(key));
      if (idx === -1 || idx + 1 >= keys.length) return [undefined];
      return [keys[idx + 1], t.hash.get(keys[idx + 1])];
    });
    g.define('pairs', (args) => {
      if (!isLuaTable(args[0]))
        throw new LuaRuntimeError("bad argument #1 to 'pairs' (table expected)");
      return [g.get('next'), args[0], undefined];
    });
    g.define('ipairs', (args) => {
      if (!isLuaTable(args[0]))
        throw new LuaRuntimeError("bad argument #1 to 'ipairs' (table expected)");
      const iter = (iargs) => {
        const [tt, i] = iargs;
        const ni = (i || 0) + 1;
        const v = tt.get(ni);
        return v === undefined ? [undefined] : [ni, v];
      };
      return [iter, args[0], 0];
    });
    g.define('setmetatable', (args) => {
      const [t, mt] = args;
      if (!isLuaTable(t))
        throw new LuaRuntimeError("bad argument #1 to 'setmetatable' (table expected)");
      t.metatable = mt || null;
      return [t];
    });
    g.define('getmetatable', (args) => [
      isLuaTable(args[0]) ? args[0].metatable || undefined : undefined,
    ]);
    g.define('rawget', (args) => [args[0] instanceof LuaTable ? args[0].get(args[1]) : undefined]);
    g.define('rawset', (args) => {
      args[0].rawset(args[1], args[2]);
      return [args[0]];
    });
    g.define('rawequal', (args) => [args[0] === args[1]]);
    g.define('select', (args) => {
      const [sel, ...rest] = args;
      if (sel === '#') return [rest.length];
      return rest.slice(Number(sel) - 1);
    });
    g.define('assert', (args) => {
      if (!luaTruthy(args[0]))
        throw new LuaRuntimeError(
          args[1] !== undefined ? luaToDisplayString(args[1]) : 'assertion failed!'
        );
      return args;
    });
    g.define('error', (args) => {
      throw new LuaRuntimeError(luaToDisplayString(args[0]));
    });
    g.define('pcall', (args, ii) => {
      const [fn, ...rest] = args;
      try {
        return [true, ...ii.callFunction(fn, rest)];
      } catch (e) {
        if (e instanceof BreakSignal || e instanceof ReturnSignal) throw e;
        return [false, e.message || String(e)];
      }
    });

    // string library (also used for `s:method()` sugar on plain JS strings)
    const strTable = new LuaTable();
    strTable.rawset('upper', (args) => [String(args[0]).toUpperCase()]);
    strTable.rawset('lower', (args) => [String(args[0]).toLowerCase()]);
    strTable.rawset('len', (args) => [String(args[0]).length]);
    strTable.rawset('sub', (args) => {
      let [s, i, j] = args;
      s = String(s);
      const len = s.length;
      if (i === undefined) i = 1;
      if (j === undefined) j = -1;
      if (i < 0) i = Math.max(len + i + 1, 1);
      if (j < 0) j = len + j + 1;
      if (i < 1) i = 1;
      if (j > len) j = len;
      return i > j ? [''] : [s.slice(i - 1, j)];
    });
    strTable.rawset('rep', (args) => {
      const [s, cnt, sep] = args;
      const n = Math.max(0, Math.floor(cnt));
      return [
        Array(n)
          .fill(String(s))
          .join(sep !== undefined ? String(sep) : ''),
      ];
    });
    strTable.rawset('byte', (args) => [String(args[0]).charCodeAt((args[1] || 1) - 1)]);
    strTable.rawset('char', (args) => [String.fromCharCode(...args)]);
    strTable.rawset('find', (args) => {
      const [s, pattern, init] = args;
      const idx = String(s).indexOf(String(pattern), init ? init - 1 : 0);
      return idx === -1 ? [undefined] : [idx + 1, idx + String(pattern).length];
    });
    strTable.rawset('format', (args) => [luaFormat(String(args[0]), args.slice(1))]);
    strTable.rawset('reverse', (args) => [String(args[0]).split('').reverse().join('')]);
    g.define('string', strTable);
    this.stringTable = strTable;

    // table library
    const tblTable = new LuaTable();
    tblTable.rawset('insert', (args) => {
      if (args.length >= 3) {
        const [t, pos, v] = args;
        for (let k = t.length(); k >= pos; k--) t.rawset(k + 1, t.get(k));
        t.rawset(pos, v);
      } else {
        const [t, v] = args;
        t.rawset(t.length() + 1, v);
      }
      return [];
    });
    tblTable.rawset('remove', (args) => {
      const [t, pos] = args;
      const n = t.length();
      const p = pos === undefined ? n : pos;
      const removed = t.get(p);
      for (let k = p; k < n; k++) t.rawset(k, t.get(k + 1));
      t.rawset(n, undefined);
      return [removed];
    });
    tblTable.rawset('concat', (args) => {
      const [t, sep] = args;
      const s = sep !== undefined ? String(sep) : '';
      const parts = [];
      for (let k = 1; k <= t.length(); k++) parts.push(luaToDisplayString(t.get(k)));
      return [parts.join(s)];
    });
    g.define('table', tblTable);

    // math library
    const mathTable = new LuaTable();
    mathTable.rawset('floor', (args) => [Math.floor(args[0])]);
    mathTable.rawset('ceil', (args) => [Math.ceil(args[0])]);
    mathTable.rawset('abs', (args) => [Math.abs(args[0])]);
    mathTable.rawset('max', (args) => [Math.max(...args)]);
    mathTable.rawset('min', (args) => [Math.min(...args)]);
    mathTable.rawset('sqrt', (args) => [Math.sqrt(args[0])]);
    mathTable.rawset('random', (args) => {
      if (args.length === 0) return [Math.random()];
      if (args.length === 1) return [Math.floor(Math.random() * args[0]) + 1];
      return [Math.floor(Math.random() * (args[1] - args[0] + 1)) + args[0]];
    });
    mathTable.rawset('pi', Math.PI);
    mathTable.rawset('huge', Infinity);
    g.define('math', mathTable);

    const osTable = new LuaTable();
    osTable.rawset('time', () => [Math.floor(Date.now() / 1000)]);
    osTable.rawset('clock', () => [performance.now() / 1000]);
    g.define('os', osTable);
  }
}

/* ─── Syntax Highlighting for Lua ─── */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightLua(code) {
  const lines = code.split('\n');
  return lines
    .map((line) => {
      const result = escapeHtml(line);
      const regex =
        /(<[^>]+>)|(--.*$)|(\[\[.*?\]\]|"[^"]*"|'[^']*')|(\b(?:and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while|self|print|pairs|ipairs|next|type|tostring|tonumber|pcall|xpcall|error|assert|require|setmetatable|getmetatable|rawget|rawset|rawequal|select|string|table|math|io|os|coroutine)\b)|(\b\w+(?=\s*\())|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;
      return result.replace(regex, (m, tag, comment, str, kw, fn, num) => {
        if (tag) return tag;
        if (comment) return '<span class="token comment">' + comment + '</span>';
        if (str) return '<span class="token string">' + str + '</span>';
        if (kw) return '<span class="token keyword">' + kw + '</span>';
        if (fn) return '<span class="token function">' + fn + '</span>';
        if (num) return '<span class="token number">' + num + '</span>';
        return m;
      });
    })
    .join('\n');
}

/* ─── Init Editor ───
   Mirrors initREditor()'s structure/patterns exactly (element IDs,
   the runSeq staleness guard, single-stream output rendering). The
   one structural addition vs. R is the syntax-highlight overlay —
   R doesn't have one, this editor keeps it since highlighting is a
   required acceptance criterion. */
function initLuaEditor() {
  const editor = document.getElementById('luEditor');
  const highlight = document.getElementById('luHighlight');
  if (!editor) return;

  const outputBody = document.getElementById('luOutputBody');
  const runBtn = document.getElementById('luRunBtn');
  const resetBtn = document.getElementById('luResetBtn');
  const copyBtn = document.getElementById('luCopyBtn');
  const saveBtn = document.getElementById('luSaveBtn');
  const exampleSelect = document.getElementById('luExampleSelect');
  const lineNumbers = document.getElementById('luLineNumbers');
  const statusBadge = document.getElementById('luStatusBadge');
  const openSupportBtn = document.getElementById('luOpenSupportBtn');
  const closeSupportBtn = document.getElementById('luCloseSupportBtn');
  const supportModal = document.getElementById('lu-support-modal');
  const modalBackdrop = document.getElementById('luModalBackdrop');

  const SAVE_KEY = 'lua-editor-draft';
  let runSeq = 0;

  const saved = localStorage.getItem(SAVE_KEY);
  editor.value = saved && saved.trim().length > 0 ? saved : LUA_EXAMPLES.hello;
  editor.scrollTop = 0;
  editor.scrollLeft = 0;
  updateLines();

  exampleSelect.addEventListener('change', () => {
    editor.value = LUA_EXAMPLES[exampleSelect.value];
    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    updateLines();
  });

  runBtn.addEventListener('click', runCode);

  resetBtn.addEventListener('click', () => {
    editor.value = LUA_EXAMPLES[exampleSelect.value] || LUA_EXAMPLES.hello;
    editor.scrollTop = 0;
    editor.scrollLeft = 0;
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
    if (highlight) {
      highlight.scrollTop = editor.scrollTop;
      highlight.scrollLeft = editor.scrollLeft;
    }
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

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="lu-output-placeholder">Running...</span>';

    // Yield one tick so "Running..." actually paints before the
    // (synchronous) interpreter blocks the main thread — same reason
    // R's runRCode() is awaited rather than called inline.
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (seq !== runSeq) return; // a newer run started first — drop this one

    const entries = [];
    const interp = new LuaInterpreter({
      onPrint: (line) => entries.push({ text: line, error: false }),
    });
    let hasError = false;
    try {
      interp.run(editor.value);
    } catch (e) {
      hasError = true;
      entries.push({ text: e && e.message ? e.message : String(e), error: true });
    }

    if (seq !== runSeq) return;
    renderOutput(entries);
    setStatus(hasError ? 'error' : 'ready');
  }

  function renderOutput(entries) {
    if (entries.length === 0) {
      outputBody.innerHTML =
        '<span class="lu-output-placeholder">No output produced. Did you forget a print()?</span>';
      return;
    }
    outputBody.innerHTML = '';
    entries.forEach((entry) => {
      const el = document.createElement('span');
      el.className = 'lu-out-line' + (entry.error ? ' error' : '');
      el.textContent = entry.text;
      outputBody.appendChild(el);
    });
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'lu-status-ready'],
      running: ['Running', 'lu-status-running'],
      error: ['Error', 'lu-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `lu-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
    if (highlight) highlight.innerHTML = highlightLua(editor.value) + '\n';
  }
}
