(function () {
  'use strict';

  var DEMOS = {
    sorting:
      'Quicksort always runs in O(n) time because it divides the array into two halves like binary search. ' +
      'Mergesort uses O(1) extra space and is unstable. ' +
      'Heapsort is a stable comparison sort with O(n log n) worst-case time. ' +
      'Counting sort works on arbitrary comparable objects in O(n) time. ' +
      'The lower bound for comparison-based sorting is O(n), so radix sort cannot beat that.',
    graphs:
      'Dijkstra finds shortest paths with negative edge weights if you simply skip negative edges. ' +
      'BFS always finds the shortest path in a weighted graph. ' +
      'A topological sort exists for every directed graph, including those with cycles. ' +
      'Prim and Kruskal both require a directed graph. ' +
      'DFS visit order guarantees a unique spanning tree on undirected graphs.',
    dp:
      'Dynamic programming always uses O(1) space regardless of the recurrence. ' +
      'Memoization and tabulation are identical — there is no difference in call stack or order. ' +
      'The knapsack 0/1 problem can be solved optimally with a greedy by weight ratio. ' +
      'Longest common subsequence of strings of length n and m is O(n + m) with the classic DP table. ' +
      'Every greedy algorithm is a special case of DP and vice versa.',
    trees:
      'A binary search tree is always perfectly balanced after any sequence of inserts. ' +
      'AVL and Red-Black trees guarantee O(1) search time. ' +
      'Inorder traversal of a BST visits keys in descending order. ' +
      'A complete binary heap is not a binary tree. ' +
      'Tree height is always log2(n) for every binary tree with n nodes.'
  };

  var TOPIC_LABELS = {
    sorting: 'Sorting',
    graphs: 'Graphs',
    dp: 'DP',
    trees: 'Trees',
    general: 'General'
  };

  /* Fact-check rules: if pattern matches text, flag unless okPattern also matches nearby claim */
  var RULES = [
    {
      id: 'qs-linear',
      topic: 'sorting',
      severity: 'false',
      pattern: /quick\s*sort[^.?!]{0,80}(O\s*\(\s*n\s*\)|linear\s+time|always\s+runs\s+in\s+O\s*\(\s*n\s*\))/i,
      claim: 'Quicksort always runs in O(n)',
      note: 'Average O(n log n); worst-case O(n²) for naive pivot choices. Not O(n).',
      rewrite: 'Quicksort averages O(n log n) time; worst case is O(n²) unless measures like median-of-medians or randomization improve the bound in expectation / practice.'
    },
    {
      id: 'qs-binary',
      topic: 'sorting',
      severity: 'false',
      pattern: /quick\s*sort[^.?!]{0,100}binary\s+search/i,
      claim: 'Quicksort divides like binary search',
      note: 'Partitioning does not guarantee equal halves; binary search assumes a sorted array.',
      rewrite: 'Quicksort partitions around a pivot; subarray sizes depend on the pivot and are not guaranteed equal as in binary search.'
    },
    {
      id: 'merge-o1',
      topic: 'sorting',
      severity: 'false',
      pattern: /merge\s*sort[^.?!]{0,60}O\s*\(\s*1\s*\)\s*extra/i,
      claim: 'Mergesort uses O(1) extra space',
      note: 'Classic mergesort needs Θ(n) auxiliary space (in-place variants exist but are atypical).',
      rewrite: 'Standard mergesort uses Θ(n) extra space for merging; it is usually stable.'
    },
    {
      id: 'merge-unstable',
      topic: 'sorting',
      severity: 'false',
      pattern: /merge\s*sort[^.?!]{0,40}unstable/i,
      claim: 'Mergesort is unstable',
      note: 'Mergesort is typically implemented as a stable sort.',
      rewrite: 'Mergesort is commonly stable: equal keys keep their relative order.'
    },
    {
      id: 'heap-stable',
      topic: 'sorting',
      severity: 'false',
      pattern: /heap\s*sort[^.?!]{0,50}stable/i,
      claim: 'Heapsort is stable',
      note: 'Standard heapsort is not stable.',
      rewrite: 'Heapsort runs in O(n log n) worst-case time but is not a stable sort in the usual binary-heap formulation.'
    },
    {
      id: 'counting-objects',
      topic: 'sorting',
      severity: 'false',
      pattern: /counting\s*sort[^.?!]{0,80}(arbitrary|comparable\s+objects)/i,
      claim: 'Counting sort works on arbitrary comparable objects',
      note: 'Counting sort needs small integer (or mapped) keys, not arbitrary objects.',
      rewrite: 'Counting sort applies to integers (or keys mapped to a small range), not arbitrary comparable objects.'
    },
    {
      id: 'comparison-lower',
      topic: 'sorting',
      severity: 'false',
      pattern: /lower\s+bound[^.?!]{0,60}comparison[^.?!]{0,40}O\s*\(\s*n\s*\)/i,
      claim: 'Comparison sorting lower bound is O(n)',
      note: 'Information-theoretic lower bound for comparison sorts is Ω(n log n).',
      rewrite: 'Any comparison-based sort requires Ω(n log n) comparisons in the worst case; radix/counting can do better for restricted keys.'
    },
    {
      id: 'dijkstra-neg',
      topic: 'graphs',
      severity: 'false',
      pattern: /dijkstra[^.?!]{0,80}negative/i,
      claim: 'Dijkstra handles negative edge weights',
      note: 'Dijkstra assumes non-negative weights; use Bellman-Ford (or similar) with negatives.',
      rewrite: 'Dijkstra requires non-negative edge weights. For negatives (no negative cycles), use Bellman-Ford.'
    },
    {
      id: 'bfs-weighted',
      topic: 'graphs',
      severity: 'false',
      pattern: /bfs[^.?!]{0,60}shortest[^.?!]{0,40}weighted/i,
      claim: 'BFS finds shortest paths in weighted graphs',
      note: 'BFS gives shortest paths in unweighted (or unit-weight) graphs.',
      rewrite: 'BFS finds fewest-edge paths in unweighted graphs; for positive weights use Dijkstra (or 0-1 BFS for special weights).'
    },
    {
      id: 'topo-cycles',
      topic: 'graphs',
      severity: 'false',
      pattern: /topological\s*sort[^.?!]{0,80}(every|including)[^.?!]{0,40}cycle/i,
      claim: 'Topological sort exists for cyclic digraphs',
      note: 'A topological order exists iff the digraph is a DAG.',
      rewrite: 'A topological sort exists only for directed acyclic graphs (DAGs).'
    },
    {
      id: 'mst-directed',
      topic: 'graphs',
      severity: 'false',
      pattern: /(prim|kruskal)[^.?!]{0,50}directed/i,
      claim: 'Prim/Kruskal require directed graphs',
      note: 'Classic MST algorithms are for undirected connected graphs.',
      rewrite: 'Prim and Kruskal compute MSTs on undirected weighted graphs; directed analogues use different algorithms (e.g. Chu–Liu/Edmonds).'
    },
    {
      id: 'dp-o1',
      topic: 'dp',
      severity: 'false',
      pattern: /dynamic\s+programming[^.?!]{0,50}O\s*\(\s*1\s*\)\s*space/i,
      claim: 'DP always uses O(1) space',
      note: 'Space depends on the state table; many DPs are O(n) or O(n²).',
      rewrite: 'DP space depends on the state dimension; rolling arrays can reduce space, but it is not always O(1).'
    },
    {
      id: 'memo-tab',
      topic: 'dp',
      severity: 'warn',
      pattern: /memoization\s+and\s+tabulation\s+are\s+identical/i,
      claim: 'Memoization and tabulation are identical',
      note: 'Same answers, different evaluation order and stack/control flow.',
      rewrite: 'Memoization is top-down with a cache; tabulation is bottom-up. Both solve overlapping subproblems but differ in order and call-stack use.'
    },
    {
      id: 'knapsack-greedy',
      topic: 'dp',
      severity: 'false',
      pattern: /knapsack\s*0\s*\/\s*1[^.?!]{0,60}greedy/i,
      claim: '0/1 knapsack solved optimally by greedy',
      note: 'Fractional knapsack is greedy; 0/1 needs DP (or pseudo-poly algorithms).',
      rewrite: 'The 0/1 knapsack problem is not solved optimally by density greedy; use DP (or other combinatorial methods).'
    },
    {
      id: 'lcs-linear',
      topic: 'dp',
      severity: 'false',
      pattern: /longest\s+common\s+subsequence[^.?!]{0,80}O\s*\(\s*n\s*\+\s*m\s*\)/i,
      claim: 'Classic LCS DP is O(n + m)',
      note: 'Standard LCS DP table is Θ(n·m) time and space (space can be optimized).',
      rewrite: 'The classic LCS DP runs in Θ(n·m) time; space can be reduced to O(min(n, m)) with rolling rows.'
    },
    {
      id: 'bst-balanced',
      topic: 'trees',
      severity: 'false',
      pattern: /binary\s+search\s+tree[^.?!]{0,60}(always|perfectly)\s+balanced/i,
      claim: 'BST always stays balanced',
      note: 'Unbalanced BSTs can degenerate to O(n) height.',
      rewrite: 'A plain BST is not self-balancing; skewed inserts yield O(n) height. Use AVL, red-black, or treaps for balanced bounds.'
    },
    {
      id: 'avl-o1',
      topic: 'trees',
      severity: 'false',
      pattern: /(avl|red[-\s]?black)[^.?!]{0,50}O\s*\(\s*1\s*\)\s*search/i,
      claim: 'AVL/Red-Black search is O(1)',
      note: 'Balanced BSTs provide O(log n) search, not O(1).',
      rewrite: 'AVL and red-black trees guarantee O(log n) search, insert, and delete.'
    },
    {
      id: 'inorder-desc',
      topic: 'trees',
      severity: 'false',
      pattern: /inorder[^.?!]{0,40}bst[^.?!]{0,40}descending|inorder[^.?!]{0,40}descending[^.?!]{0,40}bst/i,
      claim: 'BST inorder is descending',
      note: 'Inorder on a BST yields ascending (sorted) order.',
      rewrite: 'Inorder traversal of a BST visits keys in ascending sorted order.'
    },
    {
      id: 'heap-not-tree',
      topic: 'trees',
      severity: 'false',
      pattern: /binary\s+heap[^.?!]{0,40}not\s+a\s+binary\s+tree/i,
      claim: 'A binary heap is not a binary tree',
      note: 'A binary heap is a complete binary tree (array-backed).',
      rewrite: 'A binary heap is a complete binary tree satisfying the heap-order property, often stored in an array.'
    },
    {
      id: 'height-always-log',
      topic: 'trees',
      severity: 'false',
      pattern: /height[^.?!]{0,40}always\s+log\s*2?\s*\(\s*n\s*\)/i,
      claim: 'Every binary tree has height log₂(n)',
      note: 'Only balanced / complete-ish shapes; skewed trees have height n−1.',
      rewrite: 'Height is Θ(log n) for balanced trees; a skewed binary tree can have height n−1.'
    },
    {
      id: 'greedy-eq-dp',
      topic: 'dp',
      severity: 'warn',
      pattern: /every\s+greedy[^.?!]{0,40}special\s+case\s+of\s+dp\s+and\s+vice\s+versa/i,
      claim: 'Greedy ≡ DP always',
      note: 'Related paradigms, not equivalent; greedy needs exchange/optimal-substructure proofs.',
      rewrite: 'Greedy and DP both exploit structure, but not every greedy is DP and not every DP admits a greedy choice.'
    }
  ];

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

  function splitSentences(text) {
    var parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    if (!parts) return text.trim() ? [text.trim()] : [];
    return parts.map(function (s) {
      return s.trim();
    }).filter(Boolean);
  }

  function detectTopic(text, selected) {
    if (selected && selected !== 'general') return selected;
    var t = text.toLowerCase();
    var scores = { sorting: 0, graphs: 0, dp: 0, trees: 0 };
    if (/sort|quicksort|mergesort|heapsort|radix|counting\s*sort/.test(t)) scores.sorting += 2;
    if (/graph|dijkstra|bfs|dfs|topolog|prim|kruskal|shortest\s*path/.test(t)) scores.graphs += 2;
    if (/dynamic\s*programming|\bdp\b|knapsack|memoiz|tabulat|lcs|subsequence/.test(t)) scores.dp += 2;
    if (/binary\s*search\s*tree|\bbst\b|avl|red-?\s*black|heap|inorder|tree\s*height/.test(t)) scores.trees += 2;
    var best = 'general';
    var bestScore = 0;
    Object.keys(scores).forEach(function (k) {
      if (scores[k] > bestScore) {
        bestScore = scores[k];
        best = k;
      }
    });
    return bestScore ? best : 'general';
  }

  function extractClaims(text) {
    return splitSentences(text).map(function (s, i) {
      return { id: 'c' + i, text: s };
    });
  }

  function runRules(text, topic) {
    var flags = [];
    RULES.forEach(function (rule) {
      if (rule.topic !== 'general' && topic !== 'general' && rule.topic !== topic) {
        /* still allow cross-topic if pattern matches — check anyway for demos with mixed text */
      }
      var m = text.match(rule.pattern);
      if (!m) return;
      flags.push({
        id: rule.id,
        severity: rule.severity,
        claim: rule.claim,
        matched: m[0],
        note: rule.note,
        rewrite: rule.rewrite,
        index: m.index,
        length: m[0].length
      });
    });
    return flags;
  }

  function scoreRisk(flags, claimCount) {
    if (!claimCount) return 0;
    var weight = 0;
    flags.forEach(function (f) {
      weight += f.severity === 'false' ? 18 : 8;
    });
    var raw = Math.min(100, Math.round(weight + flags.length * 4));
    if (!flags.length) return Math.min(12, claimCount > 0 ? 5 : 0);
    return raw;
  }

  function riskBand(score) {
    if (score >= 70) return { label: 'High hallucination risk', cls: 'high' };
    if (score >= 35) return { label: 'Moderate hallucination risk', cls: 'med' };
    if (score > 0) return { label: 'Low residual risk', cls: 'low' };
    return { label: 'No flags from ruleset', cls: 'ok' };
  }

  function updateHero(claims, flags, score, topic) {
    if ($('statClaims')) $('statClaims').textContent = String(claims.length);
    if ($('statFlags')) $('statFlags').textContent = String(flags.length);
    if ($('statRisk')) $('statRisk').textContent = claims.length ? String(score) : '—';
    if ($('statTopic')) $('statTopic').textContent = TOPIC_LABELS[topic] || topic;
    if ($('riskFill')) $('riskFill').style.width = (claims.length ? score : 0) + '%';
    if ($('riskLabel')) {
      var band = riskBand(score);
      $('riskLabel').textContent = claims.length
        ? band.label + ' (' + score + '/100)'
        : 'Run analysis to score risk.';
    }
  }

  function renderClaims(claims, flags) {
    var list = $('claimList');
    var empty = $('hallEmpty');
    if (!list) return;

    if (!claims.length) {
      list.hidden = true;
      if (empty) empty.hidden = false;
      list.innerHTML = '';
      return;
    }

    if (empty) empty.hidden = true;
    list.hidden = false;
    list.innerHTML = '';

    claims.forEach(function (c) {
      var related = flags.filter(function (f) {
        return c.text.toLowerCase().indexOf(f.matched.toLowerCase().slice(0, 24)) !== -1 ||
          f.matched.toLowerCase().indexOf(c.text.toLowerCase().slice(0, 20)) !== -1 ||
          c.text.toLowerCase().indexOf(f.claim.toLowerCase().slice(0, 16)) !== -1;
      });
      var li = document.createElement('li');
      li.className = 'hall-claim';
      var sev = related.length
        ? related.some(function (r) {
            return r.severity === 'false';
          })
          ? 'false'
          : 'warn'
        : 'ok';
      var badge =
        sev === 'false'
          ? '<span class="hall-badge hall-badge-false">Flagged</span>'
          : sev === 'warn'
            ? '<span class="hall-badge hall-badge-warn">Caution</span>'
            : '<span class="hall-badge hall-badge-ok">No rule hit</span>';
      var note = related.length
        ? '<p class="hall-claim-note">' + escapeHtml(related[0].note) + '</p>'
        : '';
      li.innerHTML =
        '<div class="hall-claim-head">' +
        badge +
        '</div>' +
        '<div class="hall-claim-text">' +
        escapeHtml(c.text) +
        '</div>' +
        note;
      list.appendChild(li);
    });
  }

  function renderEvidence(text, flags) {
    var host = $('evidenceView');
    if (!host) return;
    if (!text.trim()) {
      host.innerHTML = '<p class="hall-muted">Flagged spans appear here after analysis.</p>';
      return;
    }
    if (!flags.length) {
      host.innerHTML = '<p>' + escapeHtml(text) + '</p><p class="hall-muted">No rule matches.</p>';
      return;
    }

    var ranges = flags
      .map(function (f) {
        return { start: f.index, end: f.index + f.length, severity: f.severity };
      })
      .filter(function (r) {
        return r.start >= 0;
      })
      .sort(function (a, b) {
        return a.start - b.start;
      });

    /* merge overlapping */
    var merged = [];
    ranges.forEach(function (r) {
      var last = merged[merged.length - 1];
      if (last && r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
        if (r.severity === 'false') last.severity = 'false';
      } else {
        merged.push({ start: r.start, end: r.end, severity: r.severity });
      }
    });

    var html = '';
    var cursor = 0;
    merged.forEach(function (r) {
      if (r.start > cursor) {
        html += escapeHtml(text.slice(cursor, r.start));
      }
      var cls = r.severity === 'warn' ? ' hall-mark-warn' : '';
      html +=
        '<mark class="' +
        cls.trim() +
        '">' +
        escapeHtml(text.slice(r.start, r.end)) +
        '</mark>';
      cursor = r.end;
    });
    if (cursor < text.length) html += escapeHtml(text.slice(cursor));
    host.innerHTML = html;
  }

  function renderRewrites(flags) {
    var host = $('rewriteView');
    if (!host) return;
    if (!flags.length) {
      host.innerHTML =
        '<p class="hall-muted">Suggested corrections appear after flags are found.</p>';
      return;
    }
    host.innerHTML = flags
      .map(function (f) {
        return (
          '<div class="hall-rewrite-item">' +
          '<strong>' +
          escapeHtml(f.claim) +
          '</strong>' +
          '<div class="hall-before">' +
          escapeHtml(f.matched) +
          '</div>' +
          '<div class="hall-after">' +
          escapeHtml(f.rewrite) +
          '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function analyze() {
    var text = $('hallText') ? $('hallText').value : '';
    var selected = $('topicSelect') ? $('topicSelect').value : 'general';
    var topic = detectTopic(text, selected);
    var claims = extractClaims(text);
    var flags = text.trim() ? runRules(text, topic) : [];
    var score = scoreRisk(flags, claims.length);

    lastReport = {
      generatedAt: new Date().toISOString(),
      topic: topic,
      topicLabel: TOPIC_LABELS[topic] || topic,
      riskScore: score,
      riskBand: riskBand(score).label,
      claimCount: claims.length,
      flagCount: flags.length,
      claims: claims.map(function (c) {
        return c.text;
      }),
      flags: flags.map(function (f) {
        return {
          id: f.id,
          severity: f.severity,
          claim: f.claim,
          matched: f.matched,
          note: f.note,
          rewrite: f.rewrite
        };
      }),
      sourceText: text
    };

    updateHero(claims, flags, score, topic);
    renderClaims(claims, flags);
    renderEvidence(text, flags);
    renderRewrites(flags);

    if ($('exportBtn')) $('exportBtn').disabled = !text.trim();
    if ($('hallStatus')) {
      $('hallStatus').textContent = text.trim()
        ? 'Extracted ' +
          claims.length +
          ' claim(s); ' +
          flags.length +
          ' rule flag(s); risk ' +
          score +
          '/100.'
        : 'Paste text or load a demo first.';
    }
  }

  function loadDemo() {
    var topic = $('topicSelect') ? $('topicSelect').value : 'sorting';
    if (topic === 'general') topic = 'sorting';
    if ($('hallText')) $('hallText').value = DEMOS[topic] || DEMOS.sorting;
    if ($('hallStatus')) {
      $('hallStatus').textContent =
        'Loaded demo with planted mistakes for ' + (TOPIC_LABELS[topic] || topic) + '.';
    }
    analyze();
  }

  function clearAll() {
    if ($('hallText')) $('hallText').value = '';
    lastReport = null;
    updateHero([], [], 0, $('topicSelect') ? $('topicSelect').value : 'general');
    renderClaims([], []);
    renderEvidence('', []);
    renderRewrites([]);
    if ($('exportBtn')) $('exportBtn').disabled = true;
    if ($('hallEmpty')) $('hallEmpty').hidden = false;
    if ($('hallStatus')) $('hallStatus').textContent = 'Cleared.';
    if ($('riskFill')) $('riskFill').style.width = '0%';
    if ($('riskLabel')) $('riskLabel').textContent = 'Run analysis to score risk.';
  }

  function exportReport() {
    if (!lastReport) {
      analyze();
    }
    if (!lastReport || !lastReport.sourceText.trim()) return;

    var lines = [];
    lines.push('AI DSA Hallucination Verification Report');
    lines.push('Generated: ' + lastReport.generatedAt);
    lines.push('Topic: ' + lastReport.topicLabel);
    lines.push('Risk score: ' + lastReport.riskScore + '/100 (' + lastReport.riskBand + ')');
    lines.push('Claims extracted: ' + lastReport.claimCount);
    lines.push('Flags: ' + lastReport.flagCount);
    lines.push('');
    lines.push('=== Source text ===');
    lines.push(lastReport.sourceText);
    lines.push('');
    lines.push('=== Claims ===');
    lastReport.claims.forEach(function (c, i) {
      lines.push(i + 1 + '. ' + c);
    });
    lines.push('');
    lines.push('=== Flags & rewrites ===');
    if (!lastReport.flags.length) {
      lines.push('(none)');
    } else {
      lastReport.flags.forEach(function (f, i) {
        lines.push(
          i +
            1 +
            '. [' +
            f.severity +
            '] ' +
            f.claim +
            '\n   Matched: ' +
            f.matched +
            '\n   Note: ' +
            f.note +
            '\n   Rewrite: ' +
            f.rewrite
        );
      });
    }
    lines.push('');
    lines.push('Disclaimer: Heuristic client-side ruleset for education only.');

    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'dsa-hallucination-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if ($('hallStatus')) $('hallStatus').textContent = 'Exported verification report.';
  }

  function bind() {
    if ($('loadDemoBtn')) $('loadDemoBtn').addEventListener('click', loadDemo);
    if ($('analyzeBtn')) $('analyzeBtn').addEventListener('click', analyze);
    if ($('clearBtn')) $('clearBtn').addEventListener('click', clearAll);
    if ($('exportBtn')) $('exportBtn').addEventListener('click', exportReport);
    if ($('topicSelect')) {
      $('topicSelect').addEventListener('change', function () {
        if ($('statTopic')) {
          var v = $('topicSelect').value;
          $('statTopic').textContent = TOPIC_LABELS[v] || v;
        }
      });
    }
  }

  function init() {
    bind();
    updateHero([], [], 0, $('topicSelect') ? $('topicSelect').value : 'sorting');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
