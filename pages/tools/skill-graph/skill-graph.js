(function() {
    'use strict';

    // ----- DOM refs -----
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    const graphContainer = document.getElementById('graphContainer');
    const graphLoading = document.getElementById('graphLoading');
    const tooltip = document.getElementById('nodeTooltip');
    const tooltipTitle = document.getElementById('tooltipTitle');
    const tooltipMastery = document.getElementById('tooltipMastery');
    const tooltipPrereqs = document.getElementById('tooltipPrereqs');
    const tooltipLearnBtn = document.getElementById('tooltipLearnBtn');
    const tooltipQuizBtn = document.getElementById('tooltipQuizBtn');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const resetViewBtn = document.getElementById('resetViewBtn');
    const toggleLabelsBtn = document.getElementById('toggleLabelsBtn');
    const legendBtn = document.getElementById('legendBtn');
    const legendContainer = document.getElementById('legendContainer');
    const topicCount = document.getElementById('topicCount');
    const edgeCount = document.getElementById('edgeCount');
    const avgMastery = document.getElementById('avgMastery');
    const strongCount = document.getElementById('strongCount');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    // ----- State -----
    let nodes = [];
    let edges = [];
    let graphData = null;
    let selectedNode = null;
    let hoveredNode = null;
    let showLabels = true;
    let searchTerm = '';
    let highlightedNodes = [];
    let isDragging = false;
    let dragNode = null;
    let offsetX = 0;
    let offsetY = 0;
    let simulationRunning = true;
    let animationFrame = null;

    // Canvas dimensions
    let width = 0;
    let height = 0;
    let dpr = 1;

    // ----- Theme -----
    function setTheme(dark) {
        document.body.classList.toggle('dark', dark);
        themeIcon.textContent = dark ? '☀️' : '🌙';
        themeLabel.textContent = dark ? 'Light' : 'Dark';
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark');
        setTheme(!isDark);
    });

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme(true);
    }

    // ----- DSA Topics Data (simulates data/dsa-topics.js) -----
    const DSA_TOPICS = [
        // Fundamentals
        { id: 1, name: 'Arrays', category: 'fundamentals', prerequisites: [] },
        { id: 2, name: 'Strings', category: 'fundamentals', prerequisites: [] },
        { id: 3, name: 'Linked Lists', category: 'fundamentals', prerequisites: [1] },
        { id: 4, name: 'Stacks', category: 'fundamentals', prerequisites: [1, 3] },
        { id: 5, name: 'Queues', category: 'fundamentals', prerequisites: [1, 3] },
        { id: 6, name: 'Hash Tables', category: 'fundamentals', prerequisites: [1] },
        
        // Trees
        { id: 7, name: 'Binary Trees', category: 'trees', prerequisites: [3] },
        { id: 8, name: 'BST', category: 'trees', prerequisites: [7] },
        { id: 9, name: 'AVL Trees', category: 'trees', prerequisites: [8] },
        { id: 10, name: 'Red-Black Trees', category: 'trees', prerequisites: [8] },
        { id: 11, name: 'Trie', category: 'trees', prerequisites: [7] },
        { id: 12, name: 'Heap', category: 'trees', prerequisites: [7] },
        { id: 13, name: 'Segment Tree', category: 'trees', prerequisites: [7, 1] },
        
        // Graphs
        { id: 14, name: 'Graph Basics', category: 'graphs', prerequisites: [3] },
        { id: 15, name: 'BFS', category: 'graphs', prerequisites: [14, 5] },
        { id: 16, name: 'DFS', category: 'graphs', prerequisites: [14, 4] },
        { id: 17, name: 'Topological Sort', category: 'graphs', prerequisites: [15, 16] },
        { id: 18, name: 'Dijkstra', category: 'graphs', prerequisites: [15] },
        { id: 19, name: 'Bellman-Ford', category: 'graphs', prerequisites: [18] },
        { id: 20, name: 'Floyd-Warshall', category: 'graphs', prerequisites: [18] },
        { id: 21, name: 'MST', category: 'graphs', prerequisites: [15, 12] },
        { id: 22, name: 'A* Search', category: 'graphs', prerequisites: [18, 16] },
        
        // Dynamic Programming
        { id: 23, name: 'DP Basics', category: 'dp', prerequisites: [1, 2] },
        { id: 24, name: 'Memoization', category: 'dp', prerequisites: [23] },
        { id: 25, name: 'Tabulation', category: 'dp', prerequisites: [23] },
        { id: 26, name: 'Knapsack', category: 'dp', prerequisites: [24, 25] },
        { id: 27, name: 'LCS', category: 'dp', prerequisites: [24, 2] },
        { id: 28, name: 'Edit Distance', category: 'dp', prerequisites: [27] },
        { id: 29, name: 'Rod Cutting', category: 'dp', prerequisites: [25] },
        { id: 30, name: 'Matrix Chain', category: 'dp', prerequisites: [25] },
        { id: 31, name: 'DP on Trees', category: 'dp', prerequisites: [24, 7] },
        { id: 32, name: 'Bitmask DP', category: 'dp', prerequisites: [24, 6] },
        
        // Sorting & Searching
        { id: 33, name: 'Bubble Sort', category: 'sorting', prerequisites: [1] },
        { id: 34, name: 'Selection Sort', category: 'sorting', prerequisites: [1] },
        { id: 35, name: 'Insertion Sort', category: 'sorting', prerequisites: [1] },
        { id: 36, name: 'Merge Sort', category: 'sorting', prerequisites: [1, 7] },
        { id: 37, name: 'Quick Sort', category: 'sorting', prerequisites: [1, 7] },
        { id: 38, name: 'Heap Sort', category: 'sorting', prerequisites: [12] },
        { id: 39, name: 'Binary Search', category: 'searching', prerequisites: [1, 7] },
        { id: 40, name: 'Ternary Search', category: 'searching', prerequisites: [39] },
        
        // Advanced
        { id: 41, name: 'Sliding Window', category: 'advanced', prerequisites: [1] },
        { id: 42, name: 'Two Pointers', category: 'advanced', prerequisites: [1] },
        { id: 43, name: 'Backtracking', category: 'advanced', prerequisites: [16] },
        { id: 44, name: 'N-Queens', category: 'advanced', prerequisites: [43] },
        { id: 45, name: 'Sudoku Solver', category: 'advanced', prerequisites: [43] },
        { id: 46, name: 'Trie + DP', category: 'advanced', prerequisites: [11, 24] },
        { id: 47, name: 'Union-Find', category: 'advanced', prerequisites: [14] },
        { id: 48, name: 'KMP', category: 'advanced', prerequisites: [2] },
        { id: 49, name: 'Rabin-Karp', category: 'advanced', prerequisites: [6, 2] },
        { id: 50, name: 'Fenwick Tree', category: 'advanced', prerequisites: [13, 1] },
    ];

    // ----- User progress (simulates algoInfinityVerse progress) -----
    function getUserProgress() {
        const stored = localStorage.getItem('skillGraphProgress');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch { /* ignore */ }
        }
        // Generate random progress
        const progress = {};
        DSA_TOPICS.forEach(t => {
            progress[t.id] = Math.floor(Math.random() * 100);
        });
        localStorage.setItem('skillGraphProgress', JSON.stringify(progress));
        return progress;
    }

    // ----- Build graph data -----
    function buildGraphData() {
        const progress = getUserProgress();
        
        nodes = DSA_TOPICS.map(topic => ({
            id: topic.id,
            name: topic.name,
            category: topic.category,
            mastery: progress[topic.id] || 0,
            radius: 20 + (progress[topic.id] || 0) / 10,
            x: Math.random() * 800 + 100,
            y: Math.random() * 600 + 100,
            vx: 0,
            vy: 0
        }));

        edges = [];
        DSA_TOPICS.forEach(topic => {
            topic.prerequisites.forEach(prereqId => {
                // Find topic name for prereq id
                const prereqTopic = DSA_TOPICS.find(t => t.id === prereqId);
                if (prereqTopic) {
                    edges.push({
                        source: nodes.find(n => n.id === prereqId),
                        target: nodes.find(n => n.id === topic.id),
                        strength: 1
                    });
                }
            });
        });

        // Add additional prerequisite edges for completeness
        const extraEdges = [
            [1, 41], [1, 42], [7, 43], [16, 43], [24, 46],
            [14, 47], [2, 48], [6, 49], [13, 50]
        ];
        extraEdges.forEach(([src, tgt]) => {
            const source = nodes.find(n => n.id === src);
            const target = nodes.find(n => n.id === tgt);
            if (source && target && !edges.some(e => e.source === source && e.target === target)) {
                edges.push({ source, target, strength: 1 });
            }
        });

        graphData = { nodes, edges };
        updateStats();
        return graphData;
    }

    // ----- Physics simulation (force-directed) -----
    function simulatePhysics() {
        if (!simulationRunning) return;

        const REPULSION = 800;
        const ATTRACTION = 0.05;
        const FRICTION = 0.9;
        const MAX_SPEED = 10;
        const CENTER_STRENGTH = 0.01;

        for (let i = 0; i < nodes.length; i++) {
            let fx = 0;
            let fy = 0;

            // Repulsion between all nodes
            for (let j = 0; j < nodes.length; j++) {
                if (i === j) continue;
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy) + 1;
                const force = REPULSION / (dist * dist);
                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
            }

            // Attraction along edges
            edges.forEach(edge => {
                let nodeA, nodeB;
                if (edge.source === nodes[i]) {
                    nodeA = edge.source;
                    nodeB = edge.target;
                } else if (edge.target === nodes[i]) {
                    nodeA = edge.target;
                    nodeB = edge.source;
                } else return;

                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const dist = Math.sqrt(dx * dx + dy * dy) + 1;
                fx -= (dx / dist) * ATTRACTION * dist * 0.5;
                fy -= (dy / dist) * ATTRACTION * dist * 0.5;
            });

            // Center force
            fx += (width/2 - nodes[i].x) * CENTER_STRENGTH;
            fy += (height/2 - nodes[i].y) * CENTER_STRENGTH;

            // Apply forces
            nodes[i].vx = (nodes[i].vx + fx * 0.1) * FRICTION;
            nodes[i].vy = (nodes[i].vy + fy * 0.1) * FRICTION;

            // Clamp speed
            const speed = Math.sqrt(nodes[i].vx * nodes[i].vx + nodes[i].vy * nodes[i].vy);
            if (speed > MAX_SPEED) {
                nodes[i].vx = (nodes[i].vx / speed) * MAX_SPEED;
                nodes[i].vy = (nodes[i].vy / speed) * MAX_SPEED;
            }

            nodes[i].x += nodes[i].vx;
            nodes[i].y += nodes[i].vy;

            // Keep in bounds
            nodes[i].x = Math.max(50, Math.min(width - 50, nodes[i].x));
            nodes[i].y = Math.max(50, Math.min(height - 50, nodes[i].y));
        }

        render();
        if (simulationRunning) {
            animationFrame = requestAnimationFrame(simulatePhysics);
        }
    }

    // ----- Render -----
    function render() {
        const isDark = document.body.classList.contains('dark');
        const bgColor = isDark ? '#0f172a' : '#fafbfc';
        const textColor = isDark ? '#e2e8f0' : '#0b1b2f';
        const edgeColor = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(148, 163, 184, 0.4)';
        
        ctx.clearRect(0, 0, width, height);
        
        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // Draw edges
        edges.forEach(edge => {
            const isHighlighted = highlightedNodes.includes(edge.source.id) || 
                                  highlightedNodes.includes(edge.target.id);
            ctx.beginPath();
            ctx.moveTo(edge.source.x, edge.source.y);
            ctx.lineTo(edge.target.x, edge.target.y);
            ctx.strokeStyle = isHighlighted ? 'rgba(59, 130, 246, 0.6)' : edgeColor;
            ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
            ctx.stroke();
        });

        // Draw nodes
        nodes.forEach(node => {
            const isHighlighted = highlightedNodes.includes(node.id);
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            
            // Node color based on mastery
            let color;
            if (node.mastery >= 80) color = '#3b82f6';
            else if (node.mastery >= 60) color = '#22c55e';
            else if (node.mastery >= 40) color = '#f59e0b';
            else color = '#ef4444';

            // Highlight
            if (isHighlighted) {
                color = '#8b5cf6';
            }

            // Shadow
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = isHovered || isSelected ? 20 : 10;
            
            // Node circle
            const radius = isHovered || isSelected ? node.radius * 1.2 : node.radius;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Border
            if (isSelected) {
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Label
            if (showLabels) {
                ctx.fillStyle = textColor;
                ctx.font = isHovered ? 'bold 11px system-ui' : '10px system-ui';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const words = node.name.split(' ');
                if (words.length <= 2) {
                    ctx.fillText(node.name, node.x, node.y + radius + 14);
                } else {
                    ctx.fillText(words[0], node.x, node.y + radius + 12);
                    ctx.fillText(words.slice(1).join(' '), node.x, node.y + radius + 24);
                }
            }

            // Mastery percentage on hover
            if (isHovered || isSelected) {
                ctx.fillStyle = textColor;
                ctx.font = 'bold 10px system-ui';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(`${node.mastery}%`, node.x, node.y - radius - 6);
            }
        });
    }

    // ----- Resize canvas -----
    function resizeCanvas() {
        const rect = graphContainer.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        
        // Center nodes
        if (nodes.length > 0) {
            const centerX = width / 2;
            const centerY = height / 2;
            const spread = Math.min(width, height) * 0.35;
            nodes.forEach((node, i) => {
                if (!node._initialized) {
                    const angle = (i / nodes.length) * Math.PI * 2;
                    node.x = centerX + Math.cos(angle) * spread * (0.6 + Math.random() * 0.4);
                    node.y = centerY + Math.sin(angle) * spread * (0.6 + Math.random() * 0.4);
                    node._initialized = true;
                }
            });
        }
        render();
    }

    // ----- Update stats -----
    function updateStats() {
        topicCount.textContent = nodes.length;
        edgeCount.textContent = edges.length;
        const avg = nodes.reduce((sum, n) => sum + n.mastery, 0) / nodes.length;
        avgMastery.textContent = Math.round(avg) + '%';
        const strong = nodes.filter(n => n.mastery >= 60).length;
        strongCount.textContent = strong;
    }

    // ----- Tooltip -----
    function showTooltip(node, x, y) {
        tooltip.style.display = 'block';
        tooltipTitle.textContent = node.name;
        tooltipMastery.textContent = `Mastery: ${node.mastery}%`;
        const prereqs = DSA_TOPICS.find(t => t.id === node.id)?.prerequisites || [];
        const prereqNames = prereqs.map(id => {
            const t = DSA_TOPICS.find(topic => topic.id === id);
            return t ? t.name : '';
        }).filter(Boolean);
        tooltipPrereqs.textContent = `Prerequisites: ${prereqNames.length > 0 ? prereqNames.join(', ') : 'none'}`;
        
        // Position tooltip
        const tooltipRect = tooltip.getBoundingClientRect();
        const containerRect = graphContainer.getBoundingClientRect();
        let left = x - tooltipRect.width / 2;
        let top = y - tooltipRect.height - 10;
        
        if (left < 10) left = 10;
        if (left + tooltipRect.width > width - 10) left = width - tooltipRect.width - 10;
        if (top < 10) top = y + 20;
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        tooltipLearnBtn.dataset.id = node.id;
        tooltipQuizBtn.dataset.id = node.id;
    }

    function hideTooltip() {
        tooltip.style.display = 'none';
    }

    // ----- Get node at position -----
    function getNodeAt(x, y) {
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            const dx = x - node.x;
            const dy = y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < node.radius + 10) {
                return node;
            }
        }
        return null;
    }

    // ----- Mouse events -----
    function onMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const node = getNodeAt(x, y);
        if (node) {
            isDragging = true;
            dragNode = node;
            const dx = x - node.x;
            const dy = y - node.y;
            // Store offset for smooth dragging
            offsetX = dx;
            offsetY = dy;
            selectedNode = node.id;
            showTooltip(node, x, y);
            render();
        } else {
            selectedNode = null;
            hideTooltip();
            render();
        }
    }

    function onMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging && dragNode) {
            dragNode.x = x - offsetX;
            dragNode.y = y - offsetY;
            render();
            return;
        }

        const node = getNodeAt(x, y);
        if (node) {
            canvas.style.cursor = 'pointer';
            if (hoveredNode !== node.id) {
                hoveredNode = node.id;
                showTooltip(node, x, y);
                render();
            } else {
                // Update tooltip position
                showTooltip(node, x, y);
            }
        } else {
            canvas.style.cursor = 'default';
            if (hoveredNode !== null) {
                hoveredNode = null;
                if (!selectedNode) hideTooltip();
                render();
            }
        }
    }

    function onMouseUp(e) {
        if (isDragging) {
            isDragging = false;
            dragNode = null;
        }
    }

    function onMouseLeave(e) {
        if (isDragging) {
            isDragging = false;
            dragNode = null;
        }
        if (!selectedNode) {
            hideTooltip();
        }
        hoveredNode = null;
    }

    // ----- Touch events -----
    function onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const node = getNodeAt(x, y);
        if (node) {
            selectedNode = node.id;
            showTooltip(node, x, y);
            render();
        }
    }

    function onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const node = getNodeAt(x, y);
        if (node) {
            showTooltip(node, x, y);
        }
    }

    // ----- Search -----
    function performSearch() {
        searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            highlightedNodes = DSA_TOPICS
                .filter(t => t.name.toLowerCase().includes(searchTerm))
                .map(t => t.id);
        } else {
            highlightedNodes = [];
        }
        render();
    }

    searchInput.addEventListener('input', performSearch);
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchTerm = '';
        highlightedNodes = [];
        render();
    });

    // ----- Reset view -----
    function resetView() {
        const centerX = width / 2;
        const centerY = height / 2;
        const spread = Math.min(width, height) * 0.35;
        nodes.forEach((node, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 + Math.random() * 0.2;
            node.x = centerX + Math.cos(angle) * spread * (0.7 + Math.random() * 0.3);
            node.y = centerY + Math.sin(angle) * spread * (0.7 + Math.random() * 0.3);
            node.vx = 0;
            node.vy = 0;
        });
        selectedNode = null;
        hoveredNode = null;
        hideTooltip();
        render();
    }

    // ----- Toggle labels -----
    function toggleLabels() {
        showLabels = !showLabels;
        toggleLabelsBtn.textContent = showLabels ? '🏷️ Labels' : '🏷️ Hide';
        render();
    }

    // ----- Legend toggle -----
    function toggleLegend() {
        if (legendContainer.style.display === 'none') {
            legendContainer.style.display = 'block';
            legendBtn.textContent = '📊 Hide';
        } else {
            legendContainer.style.display = 'none';
            legendBtn.textContent = '📊 Legend';
        }
    }

    // ----- Tooltip actions -----
    tooltipLearnBtn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        const topic = DSA_TOPICS.find(t => t.id === id);
        if (topic) {
            alert(`📖 Opening learning page for: ${topic.name}\nCategory: ${topic.category}\nPrerequisites: ${topic.prerequisites.join(', ')}`);
            // In real implementation: window.location.href = `/learn/${topic.id}`
        }
    });

    tooltipQuizBtn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        const topic = DSA_TOPICS.find(t => t.id === id);
        if (topic) {
            alert(`📝 Starting quiz for: ${topic.name}\nTopic ID: ${topic.id}`);
            // In real implementation: window.location.href = `/quiz/${topic.id}`
        }
    });

    // ----- Event listeners -----
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);

    resetViewBtn.addEventListener('click', resetView);
    toggleLabelsBtn.addEventListener('click', toggleLabels);
    legendBtn.addEventListener('click', toggleLegend);

    // ----- Window resize -----
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    // ----- Initialize -----
    function init() {
        graphLoading.style.display = 'block';
        
        // Build graph data
        buildGraphData();
        
        // Setup canvas
        resizeCanvas();
        
        // Hide loading
        setTimeout(() => {
            graphLoading.style.display = 'none';
            // Start simulation
            simulationRunning = true;
            simulatePhysics();
        }, 500);
    }

    // ----- Cleanup -----
    function cleanup() {
        simulationRunning = false;
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    // Handle page unload
    window.addEventListener('beforeunload', cleanup);

    // ----- Expose for debugging -----
    window.__SkillGraph = {
        nodes,
        edges,
        DSA_TOPICS,
        getUserProgress,
        buildGraphData,
        resetView,
        toggleLabels,
        toggleLegend,
        performSearch
    };

    // Start
    init();

    console.log('🧠 Skill Graph Knowledge Map initialized!');
    console.log('💡 Drag nodes to explore, hover for details, search to highlight.');
})();