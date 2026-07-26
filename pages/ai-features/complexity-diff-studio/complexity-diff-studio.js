(function() {
    'use strict';

    // ----- DOM refs -----
    const beforeEditor = document.getElementById('beforeEditor');
    const afterEditor = document.getElementById('afterEditor');
    const beforeError = document.getElementById('beforeError');
    const afterError = document.getElementById('afterError');
    const beforeBadge = document.getElementById('beforeBadge');
    const afterBadge = document.getElementById('afterBadge');

    const beforeTime = document.getElementById('beforeTime');
    const beforeSpace = document.getElementById('beforeSpace');
    const beforeDepth = document.getElementById('beforeDepth');
    const beforeRecursion = document.getElementById('beforeRecursion');
    const beforeBottleneck = document.getElementById('beforeBottleneck');

    const afterTime = document.getElementById('afterTime');
    const afterSpace = document.getElementById('afterSpace');
    const afterDepth = document.getElementById('afterDepth');
    const afterRecursion = document.getElementById('afterRecursion');
    const afterBottleneck = document.getElementById('afterBottleneck');

    const diffBody = document.getElementById('diffBody');

    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    // ----- theme -----
    function setTheme(dark) {
        document.body.classList.toggle('dark', dark);
        themeIcon.textContent = dark ? '☀️' : '🌙';
        themeLabel.textContent = dark ? 'Light' : 'Dark';
    }
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark');
        setTheme(!isDark);
    });
    // default: system prefers dark?
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme(true);
    }

    // ----- Acorn helpers -----
    function parseJS(code) {
        try {
            const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script' });
            return { ast, error: null };
        } catch (err) {
            return { ast: null, error: err.message };
        }
    }

    // ----- AST analysis -----
    function analyzeAST(ast) {
        let loopCount = 0;
        let maxNesting = 0;
        let recursionCount = 0;
        const loopNodes = [];

        function walk(node, depth) {
            if (!node) return;
            depth = depth || 0;
            // detect loops
            if (node.type === 'ForStatement' || node.type === 'WhileStatement' ||
                node.type === 'DoWhileStatement' || node.type === 'ForInStatement' ||
                node.type === 'ForOfStatement') {
                loopCount++;
                maxNesting = Math.max(maxNesting, depth);
                loopNodes.push(node);
                // walk body with depth+1
                if (node.body) walk(node.body, depth + 1);
                // also walk test/update etc but they don't add nesting depth
                if (node.test) walk(node.test, depth);
                if (node.update) walk(node.update, depth);
                if (node.left) walk(node.left, depth);
                if (node.right) walk(node.right, depth);
                return;
            }
            // recursion: function expression or declaration that calls itself
            if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
                const name = node.id ? node.id.name : null;
                if (name) {
                    // scan body for Identifier with same name (simple recursion detect)
                    let bodyStr = '';
                    try {
                        bodyStr = JSON.stringify(node.body);
                    } catch (_) { /* ignore */ }
                    // crude but works: check if function name appears inside its body (as identifier)
                    // we'll do a more robust AST search inside the function body later
                    // We'll count recursive calls via walk on body
                }
                // walk children
                if (node.body) walk(node.body, depth + 1);
                if (node.params) node.params.forEach(p => walk(p, depth));
                return;
            }
            // detect recursive calls: CallExpression with callee Identifier matching function name
            if (node.type === 'CallExpression' && node.callee && node.callee.type === 'Identifier') {
                // we'll handle recursion count in a separate pass, but we can collect
                // but we need function name context — we'll do it later via stack.
            }
            // walk children
            for (const key in node) {
                if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
                const child = node[key];
                if (Array.isArray(child)) {
                    child.forEach(c => walk(c, depth + 1));
                } else if (child && typeof child === 'object' && child.type) {
                    walk(child, depth + 1);
                }
            }
        }

        walk(ast, 0);

        // Recursion detection via function name and call inside body
        let recCalls = 0;
        function findRecursiveCalls(node, functionName) {
            if (!node) return;
            if (node.type === 'CallExpression' && node.callee && node.callee.type === 'Identifier' && node.callee.name === functionName) {
                recCalls++;
            }
            for (const key in node) {
                if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
                const child = node[key];
                if (Array.isArray(child)) {
                    child.forEach(c => findRecursiveCalls(c, functionName));
                } else if (child && typeof child === 'object' && child.type) {
                    findRecursiveCalls(child, functionName);
                }
            }
        }

        // find all functions
        function gatherFunctions(node) {
            let funcs = [];
            if (!node) return funcs;
            if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
                if (node.id && node.id.name) {
                    funcs.push({ name: node.id.name, body: node.body });
                }
            }
            for (const key in node) {
                if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
                const child = node[key];
                if (Array.isArray(child)) {
                    child.forEach(c => { funcs = funcs.concat(gatherFunctions(c)); });
                } else if (child && typeof child === 'object' && child.type) {
                    funcs = funcs.concat(gatherFunctions(child));
                }
            }
            return funcs;
        }

        const funcs = gatherFunctions(ast);
        funcs.forEach(fn => {
            if (fn.body) {
                findRecursiveCalls(fn.body, fn.name);
            }
        });
        recursionCount = recCalls;

        // determine time complexity based on loop count and nesting
        let time = 'O(1)';
        if (loopCount === 0) time = 'O(1)';
        else if (loopCount === 1 && maxNesting <= 1) time = 'O(n)';
        else if (loopCount === 1 && maxNesting >= 2) time = 'O(n²)';
        else if (loopCount >= 2 && maxNesting >= 2) time = 'O(n²)';
        else if (loopCount >= 2 && maxNesting <= 1) time = 'O(n)';
        else time = 'O(n)';
        // extra: if recursion > 0, time = 'O(n)' or 'O(2^n)' etc. We'll mark as recursive
        if (recursionCount > 0) {
            // if recursion and loops, we mark as O(n) approximate
            if (loopCount > 0) time = 'O(n) (recursive)';
            else time = 'O(n) (recursive)';
        }

        let space = 'O(1)';
        if (loopCount > 0 && maxNesting >= 2) space = 'O(n)';
        else if (recursionCount > 0) space = 'O(n)';
        else space = 'O(1)';

        // bottleneck highlights
        let bottlenecks = [];
        if (loopCount > 0 && maxNesting >= 2) {
            bottlenecks.push('⚠️ nested loops (depth ' + maxNesting + ') may cause O(n²) time');
        }
        if (recursionCount > 1) {
            bottlenecks.push('⚠️ multiple recursive calls — consider memoization');
        } else if (recursionCount === 1) {
            bottlenecks.push('🔁 recursion detected (depth may grow)');
        }
        if (loopCount === 0 && recursionCount === 0) {
            bottlenecks.push('⬡ no loops or recursion — O(1) likely');
        }

        return {
            time,
            space,
            maxNesting,
            recursionCount,
            bottlenecks,
            loopCount
        };
    }

    // ----- compute & render for one side -----
    function computeSide(code, errorEl, badgeEl, timeEl, spaceEl, depthEl, recEl, bottleneckEl) {
        // clear error
        errorEl.textContent = '';
        badgeEl.textContent = 'pending';
        if (!code.trim()) {
            timeEl.textContent = '—';
            spaceEl.textContent = '—';
            depthEl.textContent = '—';
            recEl.textContent = '—';
            bottleneckEl.innerHTML = '⬡ empty code';
            return null;
        }

        const result = parseJS(code);
        if (result.error) {
            errorEl.textContent = '⚠️ ' + result.error;
            badgeEl.textContent = 'error';
            timeEl.textContent = '—';
            spaceEl.textContent = '—';
            depthEl.textContent = '—';
            recEl.textContent = '—';
            bottleneckEl.innerHTML = '⚠️ invalid JavaScript';
            return null;
        }

        badgeEl.textContent = '✅ parsed';
        errorEl.textContent = '';
        const stats = analyzeAST(result.ast);
        timeEl.textContent = stats.time;
        spaceEl.textContent = stats.space;
        depthEl.textContent = stats.maxNesting > 0 ? stats.maxNesting : '0';
        recEl.textContent = stats.recursionCount > 0 ? stats.recursionCount + ' calls' : 'none';
        if (stats.bottlenecks.length === 0) {
            bottleneckEl.innerHTML = '✅ no critical bottlenecks';
        } else {
            bottleneckEl.innerHTML = stats.bottlenecks.map(b => '• ' + b).join('<br>');
        }
        return stats;
    }

    // ----- diff & suggestions -----
    function generateDiff(beforeStats, afterStats) {
        if (!beforeStats || !afterStats) {
            diffBody.innerHTML = '<div class="diff-placeholder">Edit both sides to see comparison insights.</div>';
            return;
        }

        const items = [];
        // time
        if (beforeStats.time !== afterStats.time) {
            items.push({
                icon: '⏱️',
                text: `Time complexity improved from <strong>${beforeStats.time}</strong> → <strong>${afterStats.time}</strong>`,
                tag: 'time',
                type: 'improved'
            });
        } else {
            items.push({
                icon: '⏱️',
                text: `Time complexity unchanged (${beforeStats.time})`,
                tag: 'same',
                type: 'neutral'
            });
        }
        // space
        if (beforeStats.space !== afterStats.space) {
            items.push({
                icon: '💾',
                text: `Space complexity changed from <strong>${beforeStats.space}</strong> → <strong>${afterStats.space}</strong>`,
                tag: 'space',
                type: 'improved'
            });
        } else {
            items.push({
                icon: '💾',
                text: `Space complexity unchanged (${beforeStats.space})`,
                tag: 'same',
                type: 'neutral'
            });
        }
        // depth
        if (beforeStats.maxNesting !== afterStats.maxNesting) {
            const dir = afterStats.maxNesting < beforeStats.maxNesting ? '⬇️ reduced' : '⬆️ increased';
            items.push({
                icon: '📏',
                text: `Nested depth ${dir}: ${beforeStats.maxNesting} → ${afterStats.maxNesting}`,
                tag: 'depth',
                type: afterStats.maxNesting < beforeStats.maxNesting ? 'improved' : 'warning'
            });
        } else {
            items.push({
                icon: '📏',
                text: `Nested depth unchanged (${beforeStats.maxNesting})`,
                tag: 'depth',
                type: 'neutral'
            });
        }
        // recursion
        if (beforeStats.recursionCount !== afterStats.recursionCount) {
            const dir = afterStats.recursionCount < beforeStats.recursionCount ? 'fewer' : 'more';
            items.push({
                icon: '🔄',
                text: `Recursive calls ${dir}: ${beforeStats.recursionCount} → ${afterStats.recursionCount}`,
                tag: 'recursion',
                type: afterStats.recursionCount < beforeStats.recursionCount ? 'improved' : 'warning'
            });
        } else {
            items.push({
                icon: '🔄',
                text: `Recursion count unchanged (${beforeStats.recursionCount})`,
                tag: 'recursion',
                type: 'neutral'
            });
        }

        // Rewrite suggestions
        let suggestions = [];
        if (beforeStats.maxNesting >= 2 && afterStats.maxNesting < beforeStats.maxNesting) {
            suggestions.push('✅ reduced nesting — good!');
        }
        if (beforeStats.recursionCount > 0 && afterStats.recursionCount === 0) {
            suggestions.push('✅ removed recursion, now iterative');
        }
        if (beforeStats.loopCount > 0 && afterStats.loopCount === 0 && afterStats.recursionCount === 0) {
            suggestions.push('✅ eliminated loops — using higher-order functions?');
        }
        if (beforeStats.loopCount > 0 && afterStats.loopCount > 0 && beforeStats.maxNesting === afterStats.maxNesting) {
            suggestions.push('💡 consider flattening nested loops or using memoization');
        }
        if (suggestions.length === 0) {
            suggestions.push('💡 no obvious rewrite hotspots — code structure is similar');
        }

        let html = '';
        items.forEach(item => {
            let cls = '';
            if (item.type === 'improved') cls = 'diff-improved';
            else if (item.type === 'warning') cls = 'diff-warning';
            html += `<div class="diff-item"><span class="diff-icon">${item.icon}</span><span class="diff-text ${cls}">${item.text}</span><span class="diff-tag">${item.tag}</span></div>`;
        });
        html += `<div class="diff-item" style="border-top:1px solid #e2e8f0;margin-top:6px;padding-top:10px;"><span class="diff-icon">💡</span><span class="diff-text"><strong>Suggestions:</strong> ${suggestions.join(' ')}</span></div>`;
        diffBody.innerHTML = html;
    }

    // ----- main update -----
    function updateAll() {
        const beforeCode = beforeEditor.value;
        const afterCode = afterEditor.value;

        const beforeStats = computeSide(
            beforeCode, beforeError, beforeBadge,
            beforeTime, beforeSpace, beforeDepth, beforeRecursion, beforeBottleneck
        );
        const afterStats = computeSide(
            afterCode, afterError, afterBadge,
            afterTime, afterSpace, afterDepth, afterRecursion, afterBottleneck
        );

        generateDiff(beforeStats, afterStats);
    }

    // ----- events -----
    beforeEditor.addEventListener('input', updateAll);
    afterEditor.addEventListener('input', updateAll);

    // initial run
    updateAll();

    // Expose for debugging
    window.__complexityStudio = { updateAll, parseJS, analyzeAST };

})();