/* ============================================================
   Fix the Bug — Curated Library of Buggy Code Snippets
   Languages: JavaScript, Python, Java, C++
   Bug types: off-by-one, null-reference, infinite-loop,
              wrong-operator, logic-error, type-error,
              uninitialized-variable, edge-case, mutation-bug,
              async-bug, integer-overflow, memory-leak,
              comparison-bug, scope-bug, recursion-bug
   ============================================================ */

const BUGGY_SNIPPETS = [
  // ===================================================================
  // JAVASCRIPT (15 snippets)
  // ===================================================================

  // --- JS-001: Off-by-one in loop ---
  {
    id: "js-001",
    language: "javascript",
    bugType: "off-by-one",
    difficulty: 1,
    title: "Array max with off-by-one",
    tags: ["arrays", "loops"],
    code: [
      "function findMax(arr) {",
      "  let max = 0;",
      "  for (let i = 0; i <= arr.length; i++) {",
      "    if (arr[i] > max) {",
      "      max = arr[i];",
      "    }",
      "  }",
      "  return max;",
      "}"
    ],
    buggyLine: 2,
    explanation: "The loop condition `i <= arr.length` causes an off-by-one error. When `i` equals `arr.length`, accessing `arr[i]` returns `undefined`, and comparing `undefined > max` is `false`, but the real issue surfaces when all array values are negative — the function incorrectly returns 0.",
    fixCode: "  for (let i = 0; i < arr.length; i++) {",
    hint: "What happens in the last iteration when `i` equals the array's length?",
    multipleChoice: [
      "Line 2: `let max = 0;` — wrong initial value, should use `-Infinity`",
      "Line 3: `i <= arr.length` — off-by-one in loop condition",
      "Line 4: `arr[i] > max` — wrong comparison operator",
      "Line 8: `return max;` — should return index instead"
    ],
    correctChoice: 1
  },

  // --- JS-002: Null reference ---
  {
    id: "js-002",
    language: "javascript",
    bugType: "null-reference",
    difficulty: 1,
    title: "Null object property access",
    tags: ["objects", "defensive"],
    code: [
      "function getUsername(user) {",
      "  return user.name.toUpperCase();",
      "}",
      "",
      "const guest = null;",
      "console.log(getUsername(guest));"
    ],
    buggyLine: 1,
    explanation: "When `user` is `null`, accessing `user.name` throws a `TypeError: Cannot read properties of null`. The function should guard against null/undefined before accessing properties.",
    fixCode: "  return user && user.name ? user.name.toUpperCase() : 'GUEST';",
    hint: "What happens when the `user` parameter is `null`? Is there a guard check?",
    multipleChoice: [
      "Line 1: function signature — missing default parameter",
      "Line 2: `user.name.toUpperCase()` — no null check on `user`",
      "Line 5: `const guest = null;` — should not be null",
      "Line 6: `console.log(...)` — missing try/catch"
    ],
    correctChoice: 1
  },

  // --- JS-003: Infinite loop ---
  {
    id: "js-003",
    language: "javascript",
    bugType: "infinite-loop",
    difficulty: 2,
    title: "While loop never terminates",
    tags: ["loops", "conditions"],
    code: [
      "function countDown(n) {",
      "  while (n > 0) {",
      "    console.log(n);",
      "    n++;",
      "  }",
      "  console.log('Done!');",
      "}"
    ],
    buggyLine: 3,
    explanation: "The loop increments `n` with `n++` instead of decrementing with `n--`. Since `n` starts positive and only grows, the condition `n > 0` is always true, creating an infinite loop.",
    fixCode: "    n--;",
    hint: "What direction is the counter moving? Is the operator moving it toward or away from the exit condition?",
    multipleChoice: [
      "Line 1: parameter `n` — should be passed by reference",
      "Line 2: `n > 0` — wrong comparison operator",
      "Line 4: `n++` — incrementing instead of decrementing",
      "Line 5: `console.log('Done!')` — unreachable code"
    ],
    correctChoice: 2
  },

  // --- JS-004: Wrong operator (== vs ===) ---
  {
    id: "js-004",
    language: "javascript",
    bugType: "wrong-operator",
    difficulty: 1,
    title: "Loose equality allows type coercion",
    tags: ["comparison", "equality"],
    code: [
      "function isAdmin(role) {",
      "  if (role == 'admin') {",
      "    return true;",
      "  }",
      "  return false;",
      "}",
      "",
      "console.log(isAdmin(0)); // Unexpectedly prints true"
    ],
    buggyLine: 1,
    explanation: "Using `==` instead of `===` allows type coercion. `0 == 'admin'` evaluates to `false` in this specific case, but the real danger is `false == '0'` (true), `null == undefined` (true), etc. Always use `===` to avoid subtle coercion bugs.",
    fixCode: "  if (role === 'admin') {",
    hint: "Is there a difference between `==` and `===` in JavaScript? What does `0 == '0'` return?",
    multipleChoice: [
      "Line 1: `role` parameter — missing type annotation",
      "Line 2: `role == 'admin'` — loose equality instead of strict",
      "Line 3: `return true;` — hardcoded return",
      "Line 8: `isAdmin(0)` — wrong test case"
    ],
    correctChoice: 1
  },

  // --- JS-005: Logic error in binary search ---
  {
    id: "js-005",
    language: "javascript",
    bugType: "logic-error",
    difficulty: 3,
    title: "Binary search midpoint never moves",
    tags: ["search", "binary-search"],
    code: [
      "function binarySearch(arr, target) {",
      "  let left = 0, right = arr.length - 1;",
      "  while (left < right) {",
      "    const mid = Math.floor((left + right) / 2);",
      "    if (arr[mid] === target) return mid;",
      "    if (arr[mid] < target) left = mid;",
      "    else right = mid;",
      "  }",
      "  return arr[left] === target ? left : -1;",
      "}"
    ],
    buggyLine: 5,
    explanation: "When `arr[mid] < target`, setting `left = mid` can cause an infinite loop because when `left` and `right` are adjacent (e.g., left=3, right=4), `mid` floors to 3, and if `arr[3] < target`, `left` stays 3 forever. It should be `left = mid + 1`.",
    fixCode: "    if (arr[mid] < target) left = mid + 1;",
    hint: "Consider what happens when `left` and `right` are adjacent. Does the midpoint ever exclude already-checked elements?",
    multipleChoice: [
      "Line 2: `arr.length - 1` — wrong right bound",
      "Line 3: `left < right` — loop condition excludes equality",
      "Line 5: `left = mid` — should be `left = mid + 1`",
      "Line 6: `right = mid` — should be `right = mid - 1`"
    ],
    correctChoice: 2
  },

  // --- JS-006: Mutation bug with sort() ---
  {
    id: "js-006",
    language: "javascript",
    bugType: "mutation-bug",
    difficulty: 2,
    title: "Sort mutates original array",
    tags: ["arrays", "immutability"],
    code: [
      "function getTopScores(scores) {",
      "  const sorted = scores.sort((a, b) => b - a);",
      "  return sorted.slice(0, 3);",
      "}",
      "",
      "const myScores = [5, 8, 2, 9, 3];",
      "const top3 = getTopScores(myScores);",
      "console.log(myScores); // [2, 3, 5, 8, 9] — mutated!"
    ],
    buggyLine: 1,
    explanation: "`Array.prototype.sort()` sorts **in place** and mutates the original array. The variable `sorted` is just a reference to the same array. To avoid mutation, create a copy first using `[...scores].sort(...)` or `scores.slice().sort(...)`.",
    fixCode: "  const sorted = [...scores].sort((a, b) => b - a);",
    hint: "Does `sort()` return a new array or modify the existing one? Check the documentation.",
    multipleChoice: [
      "Line 1: `scores` parameter — should be passed by value",
      "Line 2: `scores.sort(...)` — sort mutates the original array",
      "Line 3: `sorted.slice(0, 3)` — slice with no start bound",
      "Line 6: `myScores` — should be declared with `const` differently"
    ],
    correctChoice: 1
  },

  // --- JS-007: Async bug with forEach ---
  {
    id: "js-007",
    language: "javascript",
    bugType: "async-bug",
    difficulty: 3,
    title: "forEach ignores async callbacks",
    tags: ["async", "promises", "loops"],
    code: [
      "async function fetchAll(urls) {",
      "  const results = [];",
      "  urls.forEach(async (url) => {",
      "    const res = await fetch(url);",
      "    const data = await res.json();",
      "    results.push(data);",
      "  });",
      "  return results; // Always returns []!",
      "}"
    ],
    buggyLine: 2,
    explanation: "`forEach` does not await async callbacks — it fires them all and moves on. The `results` array is empty when the function returns. Use `for...of` with `await` or `Promise.all(urls.map(...))` instead.",
    fixCode: "  for (const url of urls) {",
    hint: "Does `forEach` wait for the async callback to complete before moving to the next iteration?",
    multipleChoice: [
      "Line 1: `async function` — should not be async",
      "Line 3: `urls.forEach(async ...)` — forEach doesn't await promises",
      "Line 5: `data = await res.json()` — JSON parsing might fail",
      "Line 7: `return results` — results is a const, can't reassign"
    ],
    correctChoice: 1
  },

  // --- JS-008: Closure bug in loop ---
  {
    id: "js-008",
    language: "javascript",
    bugType: "logic-error",
    difficulty: 4,
    title: "Closure captures same variable",
    tags: ["closures", "scoping", "loops"],
    code: [
      "function createButtons() {",
      "  const buttons = [];",
      "  for (var i = 0; i < 5; i++) {",
      "    buttons.push(function() {",
      "      console.log('Button ' + i);",
      "    });",
      "  }",
      "  return buttons;",
      "}",
      "",
      "const btns = createButtons();",
      "btns[0](); // Prints 'Button 5' instead of 'Button 0'"
    ],
    buggyLine: 2,
    explanation: "Using `var` in a loop creates a single `i` variable scoped to the function, not the block. By the time any closure runs, `i` has already reached 5. Use `let` instead of `var` to create a new binding for each iteration.",
    fixCode: "  for (let i = 0; i < 5; i++) {",
    hint: "What's the difference between `var` and `let` in terms of scoping? How does this affect closures?",
    multipleChoice: [
      "Line 2: `buttons.push(...)` — pushing the wrong value",
      "Line 3: `var i = 0` — should use `let` for block scoping",
      "Line 4: `'Button ' + i` — string concatenation issue",
      "Line 12: `btns[0]()` — calling the wrong button"
    ],
    correctChoice: 1
  },

  // --- JS-009: Type error with parseInt ---
  {
    id: "js-009",
    language: "javascript",
    bugType: "type-error",
    difficulty: 1,
    title: "parseInt without radix",
    tags: ["numbers", "parsing"],
    code: [
      "function parseAndSum(a, b) {",
      "  const numA = parseInt(a);",
      "  const numB = parseInt(b);",
      "  return numA + numB;",
      "}",
      "",
      "console.log(parseAndSum('08', '09')); // 0 instead of 17"
    ],
    buggyLine: 1,
    explanation: "Without a radix argument, `parseInt('08')` in older browsers interprets the leading zero as octal (base 8). Since '8' and '9' are invalid octal digits, it returns 0. Always pass `10` as the second argument.",
    fixCode: "  const numA = parseInt(a, 10);",
    hint: "What does a leading zero in a number typically indicate in programming languages? How does `parseInt` handle it?",
    multipleChoice: [
      "Line 1: `parseInt(a)` — missing radix parameter (should be 10)",
      "Line 2: `parseInt(b)` — same issue but less critical",
      "Line 3: `numA + numB` — string concatenation instead of addition",
      "Line 7: test values '08' and '09' — wrong test input"
    ],
    correctChoice: 0
  },

  // --- JS-010: Edge case with empty array ---
  {
    id: "js-010",
    language: "javascript",
    bugType: "edge-case",
    difficulty: 2,
    title: "Reduce on empty array without initial value",
    tags: ["arrays", "reduce"],
    code: [
      "function average(numbers) {",
      "  const sum = numbers.reduce((acc, n) => acc + n);",
      "  return sum / numbers.length;",
      "}",
      "",
      "console.log(average([])); // TypeError!"
    ],
    buggyLine: 1,
    explanation: "`Array.prototype.reduce()` without an initial value throws a `TypeError` on an empty array. Always provide an initial value when the array could be empty, and handle the division-by-zero case for length.",
    fixCode: "  if (numbers.length === 0) return 0;\n  const sum = numbers.reduce((acc, n) => acc + n, 0);",
    hint: "What does `reduce()` do when called on an empty array without an initial value?",
    multipleChoice: [
      "Line 1: `numbers.reduce(...)` — missing initial value for reduce",
      "Line 2: `sum / numbers.length` — division might be wrong",
      "Line 4: function name `average` — should be `avg`",
      "Line 6: `console.log(average([]))` — shouldn't test with empty"
    ],
    correctChoice: 0
  },

  // --- JS-011: Uninitialized variable ---
  {
    id: "js-011",
    language: "javascript",
    bugType: "uninitialized-variable",
    difficulty: 1,
    title: "Variable used before initialization",
    tags: ["scoping", "hoisting"],
    code: [
      "function greet(name) {",
      "  if (!name) {",
      "    const greeting = 'Hello, stranger!';",
      "  }",
      "  return greeting;",
      "}"
    ],
    buggyLine: 4,
    explanation: "Variables declared with `const` and `let` are block-scoped. The `greeting` variable is only defined inside the `if` block. Accessing it outside the block throws a `ReferenceError`.",
    fixCode: "  let greeting = 'Hello, ' + (name || 'stranger') + '!';",
    hint: "Where exactly is the variable `greeting` declared? Is it accessible outside that block?",
    multipleChoice: [
      "Line 1: `name` parameter — should have a default value",
      "Line 2: `if (!name)` — wrong condition",
      "Line 3: `const greeting = ...` — variable is block-scoped to the if",
      "Line 4: `return greeting;` — return statement is outside if block"
    ],
    correctChoice: 2
  },

  // --- JS-012: Wrong operator in recursive factorial ---
  {
    id: "js-012",
    language: "javascript",
    bugType: "wrong-operator",
    difficulty: 2,
    title: "Recursive factorial decrement error",
    tags: ["recursion", "math"],
    code: [
      "function factorial(n) {",
      "  if (n <= 1) return 1;",
      "  return n * factorial(n++);",
      "}"
    ],
    buggyLine: 2,
    explanation: "Using `n++` (post-increment) passes the original value of `n` to the recursive call instead of `n - 1`. This creates infinite recursion because `factorial(n)` calls `factorial(n)` over and over. Use `n - 1` instead.",
    fixCode: "  return n * factorial(n - 1);",
    hint: "What does `n++` return vs what does `n - 1` return? Is there a difference in this context?",
    multipleChoice: [
      "Line 1: `if (n <= 1)` — base case is wrong",
      "Line 3: `factorial(n++)` — post-increment passes n, not n-1",
      "Line 3: `n * factorial(...)` — wrong mathematical operation",
      "Line 1: `return 1` — wrong base case return value"
    ],
    correctChoice: 1
  },

  // --- JS-013: Logic error with substring ---
  {
    id: "js-013",
    language: "javascript",
    bugType: "logic-error",
    difficulty: 3,
    title: "String reversal with wrong indices",
    tags: ["strings", "manipulation"],
    code: [
      "function reverse(str) {",
      "  let result = '';",
      "  for (let i = str.length; i >= 0; i--) {",
      "    result += str[i];",
      "  }",
      "  return result;",
      "}",
      "",
      "console.log(reverse('abc')); // 'undefinedabc'"
    ],
    buggyLine: 2,
    explanation: "The loop starts at `str.length` which is one past the last valid index (3 for 'abc'). `str[3]` is `undefined`, so the reversed string starts with `'undefined'`. The loop should start at `str.length - 1`.",
    fixCode: "  for (let i = str.length - 1; i >= 0; i--) {",
    hint: "What is the last valid index of a string of length 3? Is it 3 or 2?",
    multipleChoice: [
      "Line 2: `let result = ''` — should initialize to something else",
      "Line 3: `i = str.length` — starts beyond the last character",
      "Line 4: `str[i]` — string indexing not supported",
      "Line 5: `return result` — should return in reverse order"
    ],
    correctChoice: 1
  },

  // --- JS-014: Reference vs value bug ---
  {
    id: "js-014",
    language: "javascript",
    bugType: "mutation-bug",
    difficulty: 4,
    title: "Nested object reference copy",
    tags: ["objects", "immutability", "deep-copy"],
    code: [
      "function updateConfig(config) {",
      "  const newConfig = { ...config };",
      "  newConfig.theme.colors.primary = '#FF0000';",
      "  return newConfig;",
      "}",
      "",
      "const original = { theme: { colors: { primary: '#000' } } };",
      "const updated = updateConfig(original);",
      "console.log(original.theme.colors.primary); // '#FF0000' — mutated!"
    ],
    buggyLine: 2,
    explanation: "Spread operator (`...`) creates a shallow copy. The `theme` object is shared between `original` and `newConfig`. Modifying `newConfig.theme.colors.primary` also modifies `original.theme.colors.primary`. Use `structuredClone()` or deep merge.",
    fixCode: "  const newConfig = structuredClone(config);",
    hint: "Does the spread operator (`...`) copy nested objects by value or by reference?",
    multipleChoice: [
      "Line 1: `config` parameter — should be passed by reference",
      "Line 2: `{ ...config }` — shallow copy doesn't deep-clone nested objects",
      "Line 3: `newConfig.theme.colors.primary` — wrong property path",
      "Line 8: `updateConfig(original)` — shouldn't reuse original variable"
    ],
    correctChoice: 1
  },

  // --- JS-015: Floating point precision ---
  {
    id: "js-015",
    language: "javascript",
    bugType: "type-error",
    difficulty: 2,
    title: "Floating point comparison",
    tags: ["numbers", "comparison", "precision"],
    code: [
      "function isPriceMatch(a, b) {",
      "  return a === b;",
      "}",
      "",
      "console.log(isPriceMatch(0.1 + 0.2, 0.3)); // false!"
    ],
    buggyLine: 1,
    explanation: "Due to IEEE 754 floating point representation, `0.1 + 0.2` equals `0.30000000000000004`, not `0.3`. Direct equality comparison fails. Use an epsilon-based comparison like `Math.abs(a - b) < Number.EPSILON`.",
    fixCode: "  return Math.abs(a - b) < Number.EPSILON;",
    hint: "Is `0.1 + 0.2` exactly equal to `0.3` in JavaScript? Try computing it.",
    multipleChoice: [
      "Line 1: `a === b` — floating point equality requires epsilon tolerance",
      "Line 2: `return a === b` — should return reversed result",
      "Line 4: `0.1 + 0.2` — should use integers instead",
      "Line 5: `false` comment — the comment is wrong"
    ],
    correctChoice: 0
  },

  // ===================================================================
  // PYTHON (15 snippets)
  // ===================================================================

  // --- PY-001: Off-by-one in range ---
  {
    id: "py-001",
    language: "python",
    bugType: "off-by-one",
    difficulty: 1,
    title: "Range stops one element early",
    tags: ["loops", "range"],
    code: [
      "def print_indices(n):",
      "    for i in range(n):",
      "        print(f'Index {i}')",
      "",
      "print_indices(5)  # Prints 0-4, but we want 1-5"
    ],
    buggyLine: 1,
    explanation: "`range(n)` generates numbers from 0 to n-1. The user expected indices starting at 1. If the intent is 1 through n, use `range(1, n+1)` instead.",
    fixCode: "    for i in range(1, n + 1):",
    hint: "What numbers does `range(5)` generate? Does it include 5?",
    multipleChoice: [
      "Line 1: `def print_indices(n)` — parameter name is confusing",
      "Line 2: `range(n)` — range starts at 0, user expected 1-based",
      "Line 2: `for i in` — wrong loop construct",
      "Line 5: `print_indices(5)` — wrong argument"
    ],
    correctChoice: 1
  },

  // --- PY-002: Mutable default argument ---
  {
    id: "py-002",
    language: "python",
    bugType: "mutation-bug",
    difficulty: 2,
    title: "Mutable default argument persists across calls",
    tags: ["functions", "mutability"],
    code: [
      "def add_task(task, tasks=[]):",
      "    tasks.append(task)",
      "    return tasks",
      "",
      "print(add_task('write code'))   # ['write code']",
      "print(add_task('fix bugs'))     # ['write code', 'fix bugs'] — unexpected!"
    ],
    buggyLine: 0,
    explanation: "Default arguments in Python are evaluated once at function definition, not each call. The same list object is shared across all calls. Use `None` and create a new list inside the function instead.",
    fixCode: "def add_task(task, tasks=None):\n    if tasks is None:\n        tasks = []",
    hint: "When are default arguments evaluated in Python — at definition time or at call time?",
    multipleChoice: [
      "Line 1: `tasks=[]` — mutable default arg is shared across calls",
      "Line 2: `tasks.append(task)` — append returns None",
      "Line 4: `print(...)` — should not print the result",
      "Line 5: second call — wrong test case"
    ],
    correctChoice: 0
  },

  // --- PY-003: Infinite while loop ---
  {
    id: "py-003",
    language: "python",
    bugType: "infinite-loop",
    difficulty: 2,
    title: "While loop missing increment",
    tags: ["loops", "conditions"],
    code: [
      "def print_descending(n):",
      "    while n > 0:",
      "        print(n)",
      "        n + 1  # Intent: decrement, but this does nothing"
    ],
    buggyLine: 3,
    explanation: "`n + 1` computes a value but does not assign it back to `n`. It should be `n -= 1` or `n = n - 1`. Without the assignment, `n` never changes and the loop runs forever.",
    fixCode: "        n -= 1",
    hint: "What does `n + 1` do compared to `n -= 1` or `n = n - 1`?",
    multipleChoice: [
      "Line 1: `n` parameter — should be a global variable",
      "Line 2: `n > 0` — wrong comparison operator",
      "Line 4: `n + 1` — expression without assignment, n never changes",
      "Line 1: `def print_descending` — function name is too long"
    ],
    correctChoice: 2
  },

  // --- PY-004: Wrong operator (is vs ==) ---
  {
    id: "py-004",
    language: "python",
    bugType: "wrong-operator",
    difficulty: 2,
    title: "'is' instead of '==' for value comparison",
    tags: ["comparison", "identity"],
    code: [
      "def check_score(score):",
      "    if score is 100:",
      "        return 'Perfect!'",
      "    return 'Keep trying'",
      "",
      "print(check_score(100))    # Works by CPython internment",
      "print(check_score(1000))   # May fail!"
    ],
    buggyLine: 1,
    explanation: "`is` checks object identity, not value equality. Python caches small integers (-5 to 256), so `score is 100` works accidentally. For larger numbers or different objects, `is` fails. Always use `==` for value comparison.",
    fixCode: "    if score == 100:",
    hint: "What does `is` check versus what does `==` check? Is there a difference in Python?",
    multipleChoice: [
      "Line 1: `score` parameter — should have a type hint",
      "Line 2: `score is 100` — 'is' checks identity, not equality",
      "Line 3: `'Perfect!'` — wrong return value",
      "Line 7: `check_score(1000)` — test case is misleading"
    ],
    correctChoice: 1
  },

  // --- PY-005: List mutation during iteration ---
  {
    id: "py-005",
    language: "python",
    bugType: "mutation-bug",
    difficulty: 3,
    title: "Removing items from list while iterating",
    tags: ["lists", "iteration"],
    code: [
      "def remove_negatives(nums):",
      "    for n in nums:",
      "        if n < 0:",
      "            nums.remove(n)",
      "    return nums",
      "",
      "print(remove_negatives([-1, 2, -3, 4]))  # [-1, 2, 4] — wrong!"
    ],
    buggyLine: 1,
    explanation: "Modifying a list while iterating over it shifts indices. When `-1` is removed, `-3` moves to index 0 but the iterator has already moved past it. Use a list comprehension or iterate over a copy.",
    fixCode: "    return [n for n in nums if n >= 0]",
    hint: "What happens to the remaining elements when you remove one from the middle of a list during iteration?",
    multipleChoice: [
      "Line 2: `for n in nums` — iterating over mutable list during modification",
      "Line 3: `n < 0` — wrong comparison",
      "Line 4: `nums.remove(n)` — remove removes first occurrence, not current",
      "Line 6: `remove_negatives([-1, 2, -3, 4])` — wrong test case"
    ],
    correctChoice: 0
  },

  // --- PY-006: Logic error in binary search ---
  {
    id: "py-006",
    language: "python",
    bugType: "logic-error",
    difficulty: 3,
    title: "Binary search infinite loop",
    tags: ["search", "binary-search"],
    code: [
      "def binary_search(arr, target):",
      "    left, right = 0, len(arr) - 1",
      "    while left <= right:",
      "        mid = (left + right) // 2",
      "        if arr[mid] == target:",
      "            return mid",
      "        if arr[mid] < target:",
      "            left = mid",
      "        else:",
      "            right = mid",
      "    return -1"
    ],
    buggyLine: 7,
    explanation: "When `left = mid` and `right = mid`, if `target` is not in the array, `mid` can get stuck at the same value when `left` and `right` are adjacent. Should be `left = mid + 1` and `right = mid - 1`.",
    fixCode: "            left = mid + 1\n        else:\n            right = mid - 1",
    hint: "Consider the case where `mid` equals `left`. Does updating `left = mid` move the search bounds?",
    multipleChoice: [
      "Line 2: `len(arr) - 1` — wrong right bound",
      "Line 3: `left <= right` — loop condition should be `<`",
      "Line 7: `left = mid` — should be `left = mid + 1`",
      "Line 9: `right = mid` — should be `right = mid - 1`"
    ],
    correctChoice: 2
  },

  // --- PY-007: Type error with string + int ---
  {
    id: "py-007",
    language: "python",
    bugType: "type-error",
    difficulty: 1,
    title: "String concatenation with integer",
    tags: ["strings", "types"],
    code: [
      "def greet(age):",
      "    return 'You are ' + age + ' years old'",
      "",
      "print(greet(25))  # TypeError!"
    ],
    buggyLine: 1,
    explanation: "Python does not implicitly convert integers to strings for concatenation. `'You are ' + 25` raises a `TypeError`. Use `str(age)` or an f-string.",
    fixCode: "    return f'You are {age} years old'",
    hint: "Can you concatenate a string and an integer directly in Python?",
    multipleChoice: [
      "Line 1: `age` parameter — should have a type hint",
      "Line 2: `'You are ' + age` — can't concatenate str and int",
      "Line 4: `greet(25)` — should pass a string argument",
      "Line 2: `' years old'` — missing space"
    ],
    correctChoice: 1
  },

  // --- PY-008: Edge case with empty list ---
  {
    id: "py-008",
    language: "python",
    bugType: "edge-case",
    difficulty: 2,
    title: "Max of empty list",
    tags: ["lists", "edge-cases"],
    code: [
      "def find_best_score(scores):",
      "    return max(scores)",
      "",
      "print(find_best_score([]))  # ValueError!"
    ],
    buggyLine: 1,
    explanation: "`max()` raises a `ValueError` when called on an empty sequence. The function should check for empty input and handle it gracefully.",
    fixCode: "    return max(scores) if scores else None",
    hint: "What does `max([])` do in Python? What would be a safe return value?",
    multipleChoice: [
      "Line 1: `scores` parameter — wrong type hint",
      "Line 2: `max(scores)` — max fails on empty sequence",
      "Line 4: `find_best_score([])` — shouldn't test with empty list",
      "Line 1: function name — should be `max_score`"
    ],
    correctChoice: 1
  },

  // --- PY-009: Shallow copy bug ---
  {
    id: "py-009",
    language: "python",
    bugType: "mutation-bug",
    difficulty: 4,
    title: "List of lists reference copy",
    tags: ["lists", "copy", "mutability"],
    code: [
      "def make_grid(rows, cols):",
      "    row = [0] * cols",
      "    grid = [row] * rows",
      "    grid[0][0] = 1",
      "    return grid",
      "",
      "print(make_grid(3, 3))  # [[1,0,0], [1,0,0], [1,0,0]] — wrong!"
    ],
    buggyLine: 2,
    explanation: "`[row] * rows` creates a list of references to the **same** `row` list. Modifying one row modifies all rows. Use a list comprehension: `[[0] * cols for _ in range(rows)]`.",
    fixCode: "    grid = [[0] * cols for _ in range(rows)]",
    hint: "What does `[row] * 3` actually create — three copies or three references to the same list?",
    multipleChoice: [
      "Line 1: `rows, cols` — parameter order is confusing",
      "Line 2: `row = [0] * cols` — wrong initialization",
      "Line 3: `grid = [row] * rows` — creates references, not copies",
      "Line 4: `grid[0][0] = 1` — wrong index being modified"
    ],
    correctChoice: 2
  },

  // --- PY-010: Variable scope in nested function ---
  {
    id: "py-010",
    language: "python",
    bugType: "logic-error",
    difficulty: 3,
    title: "Variable scope in nested function",
    tags: ["scoping", "closures"],
    code: [
      "def make_counter():",
      "    count = 0",
      "    def increment():",
      "        count += 1",
      "        return count",
      "    return increment",
      "",
      "counter = make_counter()",
      "print(counter())  # UnboundLocalError!"
    ],
    buggyLine: 3,
    explanation: "In Python, `count += 1` inside the nested function creates a new local variable `count` rather than modifying the outer one. Use `nonlocal count` to declare intent to modify the enclosing scope variable.",
    fixCode: "    def increment():\n        nonlocal count\n        count += 1",
    hint: "When you assign to a variable inside a function, which scope does Python assume it belongs to?",
    multipleChoice: [
      "Line 1: `make_counter()` — should take an argument",
      "Line 3: `count += 1` — count is treated as local, needs `nonlocal`",
      "Line 5: `return count` — returning the wrong variable",
      "Line 7: `counter = make_counter()` — wrong assignment"
    ],
    correctChoice: 1
  },

  // --- PY-011: Wrong integer division ---
  {
    id: "py-011",
    language: "python",
    bugType: "wrong-operator",
    difficulty: 1,
    title: "Integer division truncation",
    tags: ["math", "division"],
    code: [
      "def average(a, b):",
      "    return (a + b) / 2",
      "",
      "print(average(3, 4))  # 3.5 — correct!",
      "print(average(3, 4))  # Wait, this is Python 2: 3 — wrong!"
    ],
    buggyLine: 1,
    explanation: "In Python 2, `/` with two integers performs floor division (returns 3 instead of 3.5). While Python 3 fixes this, for cross-version compatibility or when integer division is intended, use `//` explicitly.",
    fixCode: "    return (a + b) / 2  # In Python 3, this is fine. Use // for floor.",
    hint: "Does `/` between two integers always return a float in Python?",
    multipleChoice: [
      "Line 1: `a, b` — parameter types should match",
      "Line 2: `(a + b) / 2` — in Python 2, integer division truncates",
      "Line 4: `average(3, 4)` — wrong test case",
      "Line 5: comment says Python 2 — irrelevant"
    ],
    correctChoice: 1
  },

  // --- PY-012: Logic error in palindrome check ---
  {
    id: "py-012",
    language: "python",
    bugType: "logic-error",
    difficulty: 2,
    title: "Palindrome check always returns True",
    tags: ["strings", "palindrome"],
    code: [
      "def is_palindrome(s):",
      "    for i in range(len(s)):",
      "        if s[i] == s[-(i+1)]:",
      "            return True",
      "    return False",
      "",
      "print(is_palindrome('hello'))  # True — wrong!"
    ],
    buggyLine: 2,
    explanation: "The function returns `True` as soon as **any** pair of characters matches, instead of checking that **all** pairs match. It should only return `True` after the entire loop completes without finding a mismatch.",
    fixCode: "        if s[i] != s[-(i+1)]:\n            return False\n    return True",
    hint: "Does the function return `True` only when all characters match, or as soon as any single pair matches?",
    multipleChoice: [
      "Line 2: `range(len(s))` — should iterate half the string",
      "Line 3: `if s[i] == s[-(i+1)]` — should be `!=` and return False",
      "Line 1: `s` parameter — should convert to lowercase",
      "Line 4: `return False` — should be `return True`"
    ],
    correctChoice: 1
  },

  // --- PY-013: Uninitialized variable ---
  {
    id: "py-013",
    language: "python",
    bugType: "uninitialized-variable",
    difficulty: 1,
    title: "Variable referenced before assignment",
    tags: ["variables", "scoping"],
    code: [
      "def get_status(score):",
      "    if score >= 90:",
      "        grade = 'A'",
      "    elif score >= 80:",
      "        grade = 'B'",
      "    elif score >= 70:",
      "        grade = 'C'",
      "    return grade  # What if score < 70?"
    ],
    buggyLine: 7,
    explanation: "If `score < 70`, none of the `if/elif` branches execute, and `grade` is never assigned. Accessing an unassigned variable raises `UnboundLocalError`. Add an `else` clause to handle the fallthrough case.",
    fixCode: "    else:\n        grade = 'F'\n    return grade",
    hint: "What happens if `score` is less than 70? Does every path through the conditional assign `grade`?",
    multipleChoice: [
      "Line 1: `score` parameter — should have a default",
      "Line 7: `return grade` — grade may not be assigned for <70",
      "Line 2: `score >= 90` — wrong threshold",
      "Line 4: `elif score >= 80` — should be `if` instead"
    ],
    correctChoice: 1
  },

  // --- PY-014: Infinite recursion ---
  {
    id: "py-014",
    language: "python",
    bugType: "logic-error",
    difficulty: 3,
    title: "Recursive countdown never reaches base case",
    tags: ["recursion", "base-case"],
    code: [
      "def countdown(n):",
      "    print(n)",
      "    countdown(n - 1)",
      "    if n <= 0:",
      "        return",
      "}"
    ],
    buggyLine: 2,
    explanation: "The recursive call `countdown(n - 1)` happens **before** the base case check. The function recurses infinitely and never hits the `if n <= 0: return` because the recursion is unconditional. Move the base case before the recursion.",
    fixCode: "def countdown(n):\n    print(n)\n    if n <= 0:\n        return\n    countdown(n - 1)",
    hint: "In what order are the statements executed? Does the recursion stop before the base case check happens?",
    multipleChoice: [
      "Line 2: `print(n)` — should print something else",
      "Line 3: `countdown(n - 1)` — recursion happens before base case check",
      "Line 4: `n <= 0` — wrong base case condition",
      "Line 1: `n` parameter — should be a keyword argument"
    ],
    correctChoice: 1
  },

  // --- PY-015: Wrong operator with None check ---
  {
    id: "py-015",
    language: "python",
    bugType: "wrong-operator",
    difficulty: 2,
    title: "'is not None' needed for proper null check",
    tags: ["none", "comparison"],
    code: [
      "def format_value(val):",
      "    if val != None:",
      "        return f'Value: {val}'",
      "    return 'No value'",
      "",
      "class Custom:",
      "    def __ne__(self, other):",
      "        return True  # Always claims inequality",
      "",
      "obj = Custom()",
      "print(format_value(obj))  # Returns 'No value' incorrectly"
    ],
    buggyLine: 1,
    explanation: "Using `!= None` relies on the `__ne__` method which can be overridden. A custom class can make `obj != None` return `True` even when `obj` is not `None`. Use `is not None` for identity-based None checks.",
    fixCode: "    if val is not None:",
    hint: "What does `!=` use to compare values? Can a custom class make `obj != None` return the wrong result?",
    multipleChoice: [
      "Line 2: `val != None` — should use `is not None` for identity check",
      "Line 1: `val` parameter — should have a default",
      "Line 7: `__ne__` method — overwritten equality breaks logic",
      "Line 10: `format_value(obj)` — wrong test case"
    ],
    correctChoice: 0
  },

  // ===================================================================
  // JAVA (12 snippets)
  // ===================================================================

  // --- JAVA-001: Off-by-one in for loop ---
  {
    id: "java-001",
    language: "java",
    bugType: "off-by-one",
    difficulty: 1,
    title: "Array index out of bounds",
    tags: ["arrays", "loops"],
    code: [
      "public class Main {",
      "  public static void main(String[] args) {",
      "    int[] nums = {1, 2, 3, 4, 5};",
      "    for (int i = 0; i <= nums.length; i++) {",
      "      System.out.println(nums[i]);",
      "    }",
      "  }",
      "}"
    ],
    buggyLine: 3,
    explanation: "When `i` equals `nums.length` (5), `nums[5]` is accessed, but valid indices are 0-4. This throws an `ArrayIndexOutOfBoundsException`. The loop condition should be `i < nums.length`.",
    fixCode: "    for (int i = 0; i < nums.length; i++) {",
    hint: "What is the last valid index of an array of length 5? What happens when you access index 5?",
    multipleChoice: [
      "Line 2: `main` method signature — wrong String[] syntax",
      "Line 3: `int[] nums` — array initialization syntax",
      "Line 4: `i <= nums.length` — off-by-one, should be `<`",
      "Line 5: `System.out.println(nums[i])` — wrong print method"
    ],
    correctChoice: 2
  },

  // --- JAVA-002: Null pointer exception ---
  {
    id: "java-002",
    language: "java",
    bugType: "null-reference",
    difficulty: 1,
    title: "Null object method call",
    tags: ["objects", "null-safety"],
    code: [
      "public class Main {",
      "  static String toUpper(String str) {",
      "    return str.toUpperCase();",
      "  }",
      "",
      "  public static void main(String[] args) {",
      "    System.out.println(toUpper(null));",
      "  }",
      "}"
    ],
    buggyLine: 2,
    explanation: "Calling `toUpperCase()` on a `null` reference throws a `NullPointerException`. The method should check if `str` is `null` before calling any methods on it.",
    fixCode: "    return str != null ? str.toUpperCase() : null;",
    hint: "What happens when you call a method on a `null` object reference?",
    multipleChoice: [
      "Line 2: `String str` — wrong parameter type",
      "Line 3: `str.toUpperCase()` — null pointer risk without guard",
      "Line 6: `toUpper(null)` — shouldn't pass null",
      "Line 3: method return — should return void"
    ],
    correctChoice: 1
  },

  // --- JAVA-003: Integer division issue ---
  {
    id: "java-003",
    language: "java",
    bugType: "wrong-operator",
    difficulty: 2,
    title: "Integer division truncates result",
    tags: ["math", "division", "types"],
    code: [
      "public class Main {",
      "  public static void main(String[] args) {",
      "    int scoreA = 7, scoreB = 3;",
      "    double average = scoreA / scoreB;",
      "    System.out.println(average); // 2.0 instead of 2.333...",
      "  }",
      "}"
    ],
    buggyLine: 3,
    explanation: "When both operands of `/` are integers, Java performs integer division and truncates the result to 2 before assigning it to the `double`. Cast one operand to `double`: `(double) scoreA / scoreB`.",
    fixCode: "    double average = (double) scoreA / scoreB;",
    hint: "What type of division does Java perform when both operands are integers? When does it switch to floating-point division?",
    multipleChoice: [
      "Line 2: `main` method — wrong declaration",
      "Line 3: `scoreA / scoreB` — integer division truncates before assignment",
      "Line 4: `System.out.println(average)` — wrong print format",
      "Line 3: `int scoreA, scoreB` — should use double instead"
    ],
    correctChoice: 1
  },

  // --- JAVA-004: Wrong equals() vs == ---
  {
    id: "java-004",
    language: "java",
    bugType: "wrong-operator",
    difficulty: 2,
    title: "String comparison with == instead of equals()",
    tags: ["strings", "comparison"],
    code: [
      "public class Main {",
      "  public static void main(String[] args) {",
      "    String a = \"hello\";",
      "    String b = new String(\"hello\");",
      "    if (a == b) {",
      "      System.out.println(\"Same\");",
      "    }",
      "  }",
      "}"
    ],
    buggyLine: 4,
    explanation: "`==` compares object references, not string content. Since `b` is created with `new String()`, it has a different reference than `a`. Use `a.equals(b)` to compare string content.",
    fixCode: "    if (a.equals(b)) {",
    hint: "What does `==` compare for objects in Java — references or content?",
    multipleChoice: [
      "Line 3: `String a = \"hello\"` — string literal vs object",
      "Line 4: `a == b` — compares references, not content",
      "Line 5: `System.out.println(\"Same\")` — wrong message",
      "Line 6: missing `else` branch"
    ],
    correctChoice: 1
  },

  // --- JAVA-005: Infinite loop ---
  {
    id: "java-005",
    language: "java",
    bugType: "infinite-loop",
    difficulty: 2,
    title: "For loop with wrong update",
    tags: ["loops"],
    code: [
      "public class Main {",
      "  public static void main(String[] args) {",
      "    for (int i = 0; i < 10; i--) {",
      "      System.out.println(i);",
      "    }",
      "  }",
      "}"
    ],
    buggyLine: 2,
    explanation: "The loop decrements `i` with `i--` but the condition checks `i < 10`. Since `i` starts at 0 and decreases, it will always be less than 10, creating an infinite loop. The update should be `i++`.",
    fixCode: "    for (int i = 0; i < 10; i++) {",
    hint: "In what direction does `i--` move the counter? Does the loop condition ever become false?",
    multipleChoice: [
      "Line 2: `for (int i = 0; ...)` — initial value is wrong",
      "Line 3: `i < 10` — condition is wrong",
      "Line 3: `i--` — decrementing when should be incrementing",
      "Line 4: `System.out.println(i)` — wrong output"
    ],
    correctChoice: 2
  },

  // --- JAVA-006: Concurrent modification ---
  {
    id: "java-006",
    language: "java",
    bugType: "mutation-bug",
    difficulty: 4,
    title: "Modifying collection during iteration",
    tags: ["collections", "iteration"],
    code: [
      "import java.util.*;",
      "public class Main {",
      "  public static void main(String[] args) {",
      "    List<String> items = new ArrayList<>();",
      "    items.add(\"A\"); items.add(\"B\"); items.add(\"C\");",
      "    for (String item : items) {",
      "      if (item.equals(\"B\")) {",
      "        items.remove(item);",
      "      }",
      "    }",
      "  }",
      "}"
    ],
    buggyLine: 5,
    explanation: "The enhanced for-each loop creates an iterator internally. Removing an element via `items.remove()` outside the iterator causes a `ConcurrentModificationException`. Use `Iterator.remove()` or collect items to remove and do it afterward.",
    fixCode: "    Iterator<String> it = items.iterator();\n    while (it.hasNext()) {\n      if (it.next().equals(\"B\")) {\n        it.remove();\n      }\n    }",
    hint: "What happens when you modify a collection while iterating over it with a for-each loop?",
    multipleChoice: [
      "Line 4: `new ArrayList<>()` — wrong collection type",
      "Line 6: `items.remove(item)` — concurrent modification during iteration",
      "Line 5: `for (String item : items)` — should use indexed for loop",
      "Line 7: `item.equals(\"B\")` — wrong comparison"
    ],
    correctChoice: 1
  },

  // --- JAVA-007: String comparison with == ---
  {
    id: "java-007",
    language: "java",
    bugType: "wrong-operator",
    difficulty: 1,
    title: "String reference comparison",
    tags: ["strings", "comparison"],
    code: [
      "public class Main {",
      "  public static void main(String[] args) {",
      "    String status = getStatus();",
      "    if (status == \"active\") {",
      "      System.out.println(\"User is active\");",
      "    }",
      "  }",
      "  static String getStatus() {",
      "    return new String(\"active\");",
      "  }",
      "}"
    ],
    buggyLine: 3,
    explanation: "Since `getStatus()` returns `new String(\"active\")`, the `==` comparison checks reference equality, which will be `false`. Use `status.equals(\"active\")` or `\"active\".equals(status)` for content comparison.",
    fixCode: "    if (\"active\".equals(status)) {",
    hint: "When comparing strings in Java, what should you use instead of `==`?",
    multipleChoice: [
      "Line 3: `status == \"active\"` — == compares references, not content",
      "Line 4: `System.out.println(...)` — wrong output method",
      "Line 8: `new String(\"active\")` — should use string literal",
      "Line 1: `Main` class — wrong class name"
    ],
    correctChoice: 0
  },

  // --- JAVA-008: Static variable mutation bug ---
  {
    id: "java-008",
    language: "java",
    bugType: "mutation-bug",
    difficulty: 3,
    title: "Static variable shared across instances",
    tags: ["static", "state"],
    code: [
      "public class Counter {",
      "  private int count = 0;",
      "  public Counter() { count++; }",
      "  public int getCount() { return count; }",
      "",
      "  public static void main(String[] args) {",
      "    Counter a = new Counter();",
      "    Counter b = new Counter();",
      "    System.out.println(b.getCount()); // Prints 1, not 2!",
      "  }",
      "}"
    ],
    buggyLine: 1,
    explanation: "The `count` field is an instance variable, not a static variable. Each `Counter` instance has its own `count`. If a shared counter is intended, `count` should be declared `static`.",
    fixCode: "  private static int count = 0;",
    hint: "Does each object instance have its own copy of `count`, or is it shared across all instances?",
    multipleChoice: [
      "Line 1: `int count` — should be `static` for shared state",
      "Line 2: `count++` — increment in constructor",
      "Line 3: `getCount()` — should return instance count",
      "Line 8: `b.getCount()` — wrong instance being queried"
    ],
    correctChoice: 0
  },

  // --- JAVA-009: Primitive vs wrapper ---
  {
    id: "java-009",
    language: "java",
    bugType: "type-error",
    difficulty: 2,
    title: "Null Integer unboxing throws NPE",
    tags: ["types", "null-safety", "wrappers"],
    code: [
      "public class Main {",
      "  public static void main(String[] args) {",
      "    Integer value = null;",
      "    int result = value * 2;",
      "    System.out.println(result);",
      "  }",
      "}"
    ],
    buggyLine: 3,
    explanation: "Auto-unboxing `null` to `int` throws a `NullPointerException`. When `value` is `null`, the multiplication `value * 2` attempts to unbox `null` to `int`, which is not allowed. Always check for null before unboxing.",
    fixCode: "    int result = value != null ? value * 2 : 0;",
    hint: "What happens when Java tries to auto-unbox a `null` `Integer` to `int`?",
    multipleChoice: [
      "Line 2: `Integer value = null` — should use primitive `int`",
      "Line 3: `value * 2` — auto-unboxing null throws NullPointerException",
      "Line 4: `System.out.println(result)` — wrong print method",
      "Line 2: `null` initialization — should initialize to 0"
    ],
    correctChoice: 1
  },

  // --- JAVA-010: Missing break in switch ---
  {
    id: "java-010",
    language: "java",
    bugType: "logic-error",
    difficulty: 2,
    title: "Switch fall-through without break",
    tags: ["control-flow", "switch"],
    code: [
      "public class Main {",
      "  public static void main(String[] args) {",
      "    int day = 2;",
      "    switch (day) {",
      "      case 1: System.out.println(\"Monday\");",
      "      case 2: System.out.println(\"Tuesday\");",
      "      case 3: System.out.println(\"Wednesday\");",
      "      default: System.out.println(\"Other\");",
      "    }",
      "  }",
      "}"
    ],
    buggyLine: 5,
    explanation: "Without `break` statements, execution falls through from one case to the next. When `day = 2`, it prints \"Tuesday\", \"Wednesday\", and \"Other\". Each case needs a `break` or `return` to prevent fall-through.",
    fixCode: "      case 2: System.out.println(\"Tuesday\"); break;",
    hint: "What happens in a switch statement when a case block doesn't end with `break`?",
    multipleChoice: [
      "Line 4: `switch (day)` — wrong expression type",
      "Line 6: `case 2:` — missing break statement causes fall-through",
      "Line 8: `default:` — default should be at the end",
      "Line 3: `int day = 2` — wrong value"
    ],
    correctChoice: 1
  },

  // --- JAVA-011: Array index out of bounds (beginner) ---
  {
    id: "java-011",
    language: "java",
    bugType: "off-by-one",
    difficulty: 1,
    title: "Accessing array at length position",
    tags: ["arrays", "indexing"],
    code: [
      "public class Main {",
      "  public static void main(String[] args) {",
      "    int[] data = {10, 20, 30, 40, 50};",
      "    int last = data[data.length];",
      "    System.out.println(last);",
      "  }",
      "}"
    ],
    buggyLine: 3,
    explanation: "`data.length` is 5, but valid indices are 0-4. `data[5]` throws `ArrayIndexOutOfBoundsException`. The last element is at `data[data.length - 1]`.",
    fixCode: "    int last = data[data.length - 1];",
    hint: "If an array has 5 elements, what is the index of the last element?",
    multipleChoice: [
      "Line 3: `data[data.length]` — index out of bounds, should be length-1",
      "Line 2: `int[] data` — wrong array declaration",
      "Line 4: `System.out.println(last)` — wrong print statement",
      "Line 1: `Main` class — missing public modifier"
    ],
    correctChoice: 0
  },

  // --- JAVA-012: Overriding equals without hashCode ---
  {
    id: "java-012",
    language: "java",
    bugType: "logic-error",
    difficulty: 5,
    title: "equals() without hashCode() breaks HashMaps",
    tags: ["objects", "hashmap", "contract"],
    code: [
      "public class User {",
      "  String name;",
      "  User(String name) { this.name = name; }",
      "  @Override",
      "  public boolean equals(Object obj) {",
      "    if (!(obj instanceof User)) return false;",
      "    return this.name.equals(((User)obj).name);",
      "  }",
      "  // Missing: hashCode() method",
      "",
      "  public static void main(String[] args) {",
      "    Map<User, String> map = new HashMap<>();",
      "    map.put(new User(\"Alice\"), \"Admin\");",
      "    System.out.println(map.get(new User(\"Alice\"))); // null!",
      "  }",
      "}"
    ],
    buggyLine: 8,
    explanation: "Java's `HashMap` uses `hashCode()` to locate buckets, then `equals()` to find the key. Without overriding `hashCode()`, two `User` objects with the same `name` have different hash codes and land in different buckets, so `get()` returns `null`.",
    fixCode: "  @Override\n  public int hashCode() {\n    return name.hashCode();\n  }",
    hint: "What contract exists between `equals()` and `hashCode()` in Java? What does HashMap use to locate keys?",
    multipleChoice: [
      "Line 4: `equals()` implementation — wrong comparison logic",
      "Line 6: `this.name.equals(...)` — name could be null",
      "Line 9: missing `hashCode()` override — breaks HashMap contract",
      "Line 11: `Map<User, String>` — wrong generic types"
    ],
    correctChoice: 2
  },

  // ===================================================================
  // C++ (12 snippets)
  // ===================================================================

  // --- CPP-001: Off-by-one in array access ---
  {
    id: "cpp-001",
    language: "cpp",
    bugType: "off-by-one",
    difficulty: 1,
    title: "Array index out of bounds",
    tags: ["arrays", "loops"],
    code: [
      "#include <iostream>",
      "int main() {",
      "  int arr[5] = {1, 2, 3, 4, 5};",
      "  for (int i = 0; i <= 5; i++) {",
      "    std::cout << arr[i] << ' ';",
      "  }",
      "}"
    ],
    buggyLine: 3,
    explanation: "The array has 5 elements (indices 0-4), but the loop goes up to index 5. Accessing `arr[5]` reads past the end of the array — undefined behavior that may crash or read garbage. Use `i < 5` as the condition.",
    fixCode: "  for (int i = 0; i < 5; i++) {",
    hint: "If an array has 5 elements, what's the last valid index? What does accessing index 5 do?",
    multipleChoice: [
      "Line 2: `int arr[5]` — array declared wrong size",
      "Line 3: `i <= 5` — off-by-one, accesses index 5 which is out of bounds",
      "Line 4: `std::cout << arr[i]` — wrong output operator",
      "Line 1: `#include <iostream>` — missing .h extension"
    ],
    correctChoice: 1
  },

  // --- CPP-002: Null pointer dereference ---
  {
    id: "cpp-002",
    language: "cpp",
    bugType: "null-reference",
    difficulty: 1,
    title: "Dereferencing null pointer",
    tags: ["pointers", "null-safety"],
    code: [
      "#include <iostream>",
      "int main() {",
      "  int* ptr = nullptr;",
      "  *ptr = 42;",
      "  std::cout << *ptr;",
      "}"
    ],
    buggyLine: 3,
    explanation: "Dereferencing a `nullptr` is undefined behavior and typically causes a segmentation fault. The pointer must point to valid memory before being dereferenced.",
    fixCode: "  int* ptr = new int(42);\n  std::cout << *ptr;\n  delete ptr;",
    hint: "Can you assign a value to the memory location pointed to by a `nullptr`?",
    multipleChoice: [
      "Line 2: `int* ptr` — wrong pointer declaration syntax",
      "Line 3: `*ptr = 42` — dereferencing nullptr is undefined behavior",
      "Line 4: `std::cout << *ptr` — wrong output",
      "Line 1: `#include <iostream>` — should use `stdio.h`"
    ],
    correctChoice: 1
  },

  // --- CPP-003: Infinite loop ---
  {
    id: "cpp-003",
    language: "cpp",
    bugType: "infinite-loop",
    difficulty: 2,
    title: "Missing increment in while loop",
    tags: ["loops"],
    code: [
      "#include <iostream>",
      "int main() {",
      "  int i = 0;",
      "  while (i < 10) {",
      "    std::cout << i << ' ';",
      "  }",
      "}"
    ],
    buggyLine: 4,
    explanation: "The loop prints `i` repeatedly because `i` is never incremented. The loop body should include `i++` to move toward the exit condition.",
    fixCode: "  while (i < 10) {\n    std::cout << i << ' ';\n    i++;\n  }",
    hint: "What value of `i` would make the condition `i < 10` false? Does `i` ever change in the loop?",
    multipleChoice: [
      "Line 2: `int i = 0` — wrong initial value",
      "Line 3: `while (i < 10)` — wrong condition",
      "Line 4: missing increment — i never changes so loop never exits",
      "Line 5: `std::cout << i` — wrong output"
    ],
    correctChoice: 2
  },

  // --- CPP-004: Integer overflow ---
  {
    id: "cpp-004",
    language: "cpp",
    bugType: "integer-overflow",
    difficulty: 3,
    title: "Signed integer overflow",
    tags: ["math", "overflow"],
    code: [
      "#include <iostream>",
      "int main() {",
      "  int x = 2147483647;",
      "  x = x + 1;",
      "  std::cout << x;  // May print -2147483648",
      "}"
    ],
    buggyLine: 3,
    explanation: "Signed integer overflow is undefined behavior in C++. When the maximum `int` value wraps to the minimum negative value, the program's behavior is unpredictable. Use `long long` for larger values or check bounds before adding.",
    fixCode: "  long long x = 2147483647LL;\n  x = x + 1;",
    hint: "What's the largest value a signed 32-bit integer can hold? What happens when you add 1 to it?",
    multipleChoice: [
      "Line 2: `int x` — should use `unsigned` for safety",
      "Line 3: `x + 1` — signed integer overflow is undefined behavior",
      "Line 4: `std::cout << x` — wrong output",
      "Line 1: `#include <iostream>` — missing namespace"
    ],
    correctChoice: 1
  },

  // --- CPP-005: Dangling pointer ---
  {
    id: "cpp-005",
    language: "cpp",
    bugType: "memory-leak",
    difficulty: 4,
    title: "Returning pointer to local variable",
    tags: ["pointers", "memory", "scope"],
    code: [
      "#include <iostream>",
      "int* getValue() {",
      "  int x = 42;",
      "  return &x;",
      "}",
      "int main() {",
      "  int* p = getValue();",
      "  std::cout << *p;  // Undefined behavior!",
      "}"
    ],
    buggyLine: 3,
    explanation: "`x` is a local variable that is destroyed when `getValue()` returns. The pointer `p` becomes a dangling pointer pointing to freed memory. Dereferencing it is undefined behavior. Allocate on the heap or return by value.",
    fixCode: "  return new int(42);",
    hint: "What happens to local variables when a function returns? Does the memory they occupied still belong to you?",
    multipleChoice: [
      "Line 2: `int x = 42` — wrong variable type",
      "Line 3: `return &x` — returning address of local variable (dangling ptr)",
      "Line 6: `getValue()` — should not call this function",
      "Line 7: `std::cout << *p` — wrong output statement"
    ],
    correctChoice: 1
  },

  // --- CPP-006: Wrong comparator in sort ---
  {
    id: "cpp-006",
    language: "cpp",
    bugType: "logic-error",
    difficulty: 3,
    title: "Sort comparator returns wrong order",
    tags: ["sorting", "comparators"],
    code: [
      "#include <algorithm>",
      "#include <vector>",
      "#include <iostream>",
      "bool cmp(int a, int b) { return a <= b; }",
      "int main() {",
      "  std::vector<int> v = {3, 1, 4, 1, 5, 9};",
      "  std::sort(v.begin(), v.end(), cmp);",
      "  for (int x : v) std::cout << x << ' ';",
      "}"
    ],
    buggyLine: 3,
    explanation: "The comparator must return `true` if `a` is **strictly less than** `b`. Using `<=` violates the strict weak ordering requirement because `a <= b` and `b <= a` can both be true when `a == b`, which can cause undefined behavior or crashes.",
    fixCode: "bool cmp(int a, int b) { return a < b; }",
    hint: "What requirement does C++'s `std::sort` have for its comparator? Can `cmp(a, b)` and `cmp(b, a)` both return true?",
    multipleChoice: [
      "Line 3: `bool cmp(int a, int b)` — wrong return type",
      "Line 4: `a <= b` — uses <= instead of <, violates strict weak ordering",
      "Line 6: `std::sort(v.begin(), v.end(), cmp)` — wrong sort call",
      "Line 7: `for (int x : v)` — wrong iteration syntax"
    ],
    correctChoice: 1
  },

  // --- CPP-007: Uninitialized variable ---
  {
    id: "cpp-007",
    language: "cpp",
    bugType: "uninitialized-variable",
    difficulty: 1,
    title: "Uninitialized local variable",
    tags: ["variables", "initialization"],
    code: [
      "#include <iostream>",
      "int main() {",
      "  int sum;",
      "  for (int i = 0; i < 10; i++) {",
      "    sum += i;",
      "  }",
      "  std::cout << sum;  // Garbage value!",
      "}"
    ],
    buggyLine: 2,
    explanation: "Local variables in C++ are not automatically initialized. `sum` holds an indeterminate (garbage) value. Adding to it produces garbage. Always initialize variables: `int sum = 0;`.",
    fixCode: "  int sum = 0;",
    hint: "What initial value does an uninitialized local variable in C++ contain?",
    multipleChoice: [
      "Line 2: `int sum` — sum is uninitialized, contains garbage value",
      "Line 4: `sum += i` — wrong addition operator",
      "Line 6: `std::cout << sum` — should print differently",
      "Line 1: `#include <iostream>` — missing standard namespace"
    ],
    correctChoice: 0
  },

  // --- CPP-008: Memory leak ---
  {
    id: "cpp-008",
    language: "cpp",
    bugType: "memory-leak",
    difficulty: 3,
    title: "Missing delete after new",
    tags: ["memory", "allocation"],
    code: [
      "#include <iostream>",
      "void leak() {",
      "  int* data = new int[100];",
      "  // Use data...",
      "}",
      "int main() {",
      "  leak();  // Memory leak! 100 ints lost",
      "}"
    ],
    buggyLine: 2,
    explanation: "Memory allocated with `new[]` must be freed with `delete[]`. Without it, the memory is leaked forever. In modern C++, prefer smart pointers (`std::unique_ptr`, `std::vector`) to avoid manual memory management.",
    fixCode: "  int* data = new int[100];\n  // Use data...\n  delete[] data;",
    hint: "For every `new` or `new[]` call, what must be called to free the memory? Is that call present here?",
    multipleChoice: [
      "Line 2: `new int[100]` — allocation without corresponding delete[]",
      "Line 4: function ends — missing memory cleanup",
      "Line 6: `leak()` — should not call this function",
      "Line 2: `int* data` — wrong pointer type"
    ],
    correctChoice: 0
  },

  // --- CPP-009: Wrong operator (== vs =) ---
  {
    id: "cpp-009",
    language: "cpp",
    bugType: "wrong-operator",
    difficulty: 1,
    title: "Assignment instead of comparison",
    tags: ["conditions", "assignment"],
    code: [
      "#include <iostream>",
      "int main() {",
      "  int x = 5;",
      "  if (x = 10) {",
      "    std::cout << \"x is 10\";",
      "  }",
      "}"
    ],
    buggyLine: 3,
    explanation: "`x = 10` is an assignment, not a comparison. It sets `x` to 10 and evaluates to 10 (truthy), so the body always executes. The comparison operator is `==`. Many compilers warn about this, but it still compiles.",
    fixCode: "  if (x == 10) {",
    hint: "What does `x = 10` do — compare or assign? What value does it evaluate to?",
    multipleChoice: [
      "Line 2: `int x = 5` — wrong initial value",
      "Line 3: `x = 10` — assignment, not comparison (should be ==)",
      "Line 4: `std::cout << \"x is 10\"` — wrong output",
      "Line 1: `#include <iostream>` — wrong header"
    ],
    correctChoice: 1
  },

  // --- CPP-010: Reference vs pointer confusion ---
  {
    id: "cpp-010",
    language: "cpp",
    bugType: "type-error",
    difficulty: 3,
    title: "Reference vs pointer parameter",
    tags: ["references", "pointers"],
    code: [
      "#include <iostream>",
      "void increment(int* val) {",
      "  val++;",
      "}",
      "int main() {",
      "  int x = 5;",
      "  increment(&x);",
      "  std::cout << x;  // Still 5, not 6!",
      "}"
    ],
    buggyLine: 2,
    explanation: "`val++` increments the pointer (making it point to the next memory location), not the value it points to. To increment the value, use `(*val)++` or pass by reference with `int&`.",
    fixCode: "  (*val)++;",
    hint: "In `void increment(int* val)`, what does `val++` actually increment — the pointer or the value it points to?",
    multipleChoice: [
      "Line 2: `val++` — increments the pointer, not the pointed-to value",
      "Line 6: `increment(&x)` — wrong way to pass address",
      "Line 3: function definition — wrong parameter type",
      "Line 7: `std::cout << x` — should print the pointer address"
    ],
    correctChoice: 0
  },

  // --- CPP-011: Virtual destructor missing ---
  {
    id: "cpp-011",
    language: "cpp",
    bugType: "logic-error",
    difficulty: 5,
    title: "Non-virtual destructor causes partial cleanup",
    tags: ["inheritance", "polymorphism", "destructors"],
    code: [
      "#include <iostream>",
      "struct Base {",
      "  ~Base() { std::cout << \"~Base\\n\"; }",
      "};",
      "struct Derived : Base {",
      "  int* data = new int[100];",
      "  ~Derived() { delete[] data; std::cout << \"~Derived\\n\"; }",
      "};",
      "int main() {",
      "  Base* b = new Derived();",
      "  delete b;  // Only calls ~Base(), not ~Derived()!",
      "}"
    ],
    buggyLine: 2,
    explanation: "When deleting a derived object through a base pointer, if the base destructor is not `virtual`, only the base destructor runs. The derived destructor is never called, causing a memory leak. Always make base destructors `virtual`.",
    fixCode: "  virtual ~Base() { std::cout << \"~Base\\n\"; }",
    hint: "When deleting through a base class pointer, how does C++ know which destructor to call? What keyword ensures the right one runs?",
    multipleChoice: [
      "Line 2: `~Base()` — base destructor should be `virtual`",
      "Line 4: `struct Derived : Base` — wrong inheritance syntax",
      "Line 6: `~Derived()` — derived destructor cleanup might fail",
      "Line 10: `delete b` — should use placement delete"
    ],
    correctChoice: 0
  },

  // --- CPP-012: Using erase in loop ---
  {
    id: "cpp-012",
    language: "cpp",
    bugType: "mutation-bug",
    difficulty: 4,
    title: "Iterator invalidation during erase",
    tags: ["iterators", "vectors"],
    code: [
      "#include <vector>",
      "#include <iostream>",
      "int main() {",
      "  std::vector<int> v = {1, 2, 3, 4, 5};",
      "  for (auto it = v.begin(); it != v.end(); ++it) {",
      "    if (*it % 2 == 0) {",
      "      v.erase(it);", // Iterator invalidated!
      "    }",
      "  }",
      "}"
    ],
    buggyLine: 6,
    explanation: "`v.erase(it)` invalidates `it` (all iterators after the erased element become invalid). Continuing to use `it` after erasing is undefined behavior. Use `it = v.erase(it)` which returns the iterator to the next element.",
    fixCode: "      it = v.erase(it);\n      --it; // Compensate for ++it in loop",
    hint: "What happens to an iterator after the element it points to is erased from a vector? Can you still use it?",
    multipleChoice: [
      "Line 3: `std::vector<int> v` — wrong container type",
      "Line 4: `for (auto it = v.begin()` — wrong loop syntax",
      "Line 6: `v.erase(it)` — erase invalidates the iterator",
      "Line 7: `if (*it % 2 == 0)` — wrong condition"
    ],
    correctChoice: 2
  }
];

// Validation — ensure all snippets have required fields
(function validateSnippets() {
  const required = ['id', 'language', 'bugType', 'difficulty', 'title', 'code', 'buggyLine', 'explanation', 'fixCode', 'hint', 'multipleChoice', 'correctChoice'];
  for (const s of BUGGY_SNIPPETS) {
    for (const field of required) {
      if (s[field] === undefined) {
        console.warn(`Snippet ${s.id || '(unknown)'} missing field: ${field}`);
      }
    }
  }
})();