import * as acorn from 'acorn';

export function analyzeComplexity(sourceCode) {
  try {
    const ast = acorn.parse(sourceCode, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    });

    let maxLoopDepth = 0;
    let isRecursive = false;
    let hasMemoization = false;
    let recursiveCallCount = 0;
    let hasAsyncGenerators = false;

    const loopTypes = new Set([
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoWhileStatement',
    ]);

    const walkWithVar = (node, currentLoopDepth, currentFuncName, params) => {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
        if (
          node.init &&
          (node.init.type === 'FunctionExpression' || node.init.type === 'ArrowFunctionExpression')
        ) {
          const funcName = node.id.name;
          const nextParams = new Set(node.init.params.map((p) => p.name).filter(Boolean));
          walk(node.init.body, 0, funcName, nextParams);
          return;
        }
      }
      walk(node, currentLoopDepth, currentFuncName, params);
    };

    const walk = (node, currentLoopDepth, currentFuncName, params) => {
      if (!node || typeof node !== 'object') return;

      let nextLoopDepth = currentLoopDepth;
      let nextFuncName = currentFuncName;
      let nextParams = params;

      if (loopTypes.has(node.type)) {
        nextLoopDepth = currentLoopDepth + 1;
        if (nextLoopDepth > maxLoopDepth) {
          maxLoopDepth = nextLoopDepth;
        }
      }

      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        nextFuncName = node.id ? node.id.name : currentFuncName;
        nextParams = new Set(node.params.map((p) => p.name).filter(Boolean));
        nextLoopDepth = 0;
        if (node.async || node.generator) {
          hasAsyncGenerators = true;
        }
      }

      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        if (currentFuncName && node.callee.name === currentFuncName) {
          isRecursive = true;
          recursiveCallCount++;
        }
      }

      // Memoization check 1: AssignmentExpression (e.g. memo[n] = ..., dp[i][j] = ...)
      if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression') {
        hasMemoization = true;
      }

      // Memoization check 2: MemberExpression property read (e.g. if (memo[n] !== undefined) return memo[n];)
      if (node.type === 'MemberExpression') {
        if (
          node.object &&
          (node.object.name === 'memo' || node.object.name === 'cache' || node.object.name === 'dp')
        ) {
          hasMemoization = true;
        }
      }

      // Memoization check 3: Map/Set method call (e.g. cache.set(n, ...), cache.has(n))
      if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
        const propName = node.callee.property ? node.callee.property.name : '';
        if (['set', 'has', 'get'].includes(propName)) {
          hasMemoization = true;
        }
      }

      for (const key in node) {
        if (key === 'start' || key === 'end' || key === 'loc' || key === 'type') continue;
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((c) => walkWithVar(c, nextLoopDepth, nextFuncName, nextParams));
        } else if (child && typeof child === 'object') {
          walkWithVar(child, nextLoopDepth, nextFuncName, nextParams);
        }
      }
    };

    walkWithVar(ast, 0, null, null);

    let complexity = 'O(1)';
    if (maxLoopDepth === 1) {
      complexity = 'O(n)';
    } else if (maxLoopDepth === 2) {
      complexity = 'O(n²)';
    } else if (maxLoopDepth >= 3) {
      complexity = 'O(n³)';
    }

    if (isRecursive) {
      if (hasMemoization) {
        complexity = 'O(n)'; // Memoized DP recursion scales linearly
      } else if (recursiveCallCount > 1) {
        complexity = 'O(2ⁿ)'; // Branching recursion without memoization
      } else {
        complexity = 'O(n)'; // Single linear recursion
      }
    }

    return {
      complexity,
      maxLoopDepth,
      isRecursive,
      hasMemoization,
      recursiveCallCount,
      hasAsyncGenerators,
    };
  } catch (e) {
    return { complexity: 'Unknown (Parse Error)', error: e.message };
  }
}

if (typeof window !== 'undefined') {
  window.analyzeComplexity = analyzeComplexity;
}
