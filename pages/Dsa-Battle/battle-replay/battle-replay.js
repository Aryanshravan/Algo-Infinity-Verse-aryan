(function() {
    'use strict';

    // ----- DOM refs -----
    const battleIdInput = document.getElementById('battleIdInput');
    const loadBattleBtn = document.getElementById('loadBattleBtn');
    const battleInfo = document.getElementById('battleInfo');
    const battleIdDisplay = document.getElementById('battleIdDisplay');
    const battleDate = document.getElementById('battleDate');
    const battleDuration = document.getElementById('battleDuration');
    const player1Tag = document.getElementById('player1Tag');
    const player2Tag = document.getElementById('player2Tag');
    const player1Result = document.getElementById('player1Result');
    const player2Result = document.getElementById('player2Result');
    const player1Label = document.getElementById('player1Label');
    const player2Label = document.getElementById('player2Label');
    const player1Status = document.getElementById('player1Status');
    const player2Status = document.getElementById('player2Status');
    const player1Submissions = document.getElementById('player1Submissions');
    const player2Submissions = document.getElementById('player2Submissions');
    const player1CodeContent = document.getElementById('player1CodeContent');
    const player2CodeContent = document.getElementById('player2CodeContent');
    const controlsSection = document.getElementById('controlsSection');
    const codeSection = document.getElementById('codeSection');
    const eventsSection = document.getElementById('eventsSection');
    const eventsList = document.getElementById('eventsList');
    const timelineProgress = document.getElementById('timelineProgress');
    const timelineHandle = document.getElementById('timelineHandle');
    const timelineEvents = document.getElementById('timelineEvents');
    const timeCurrent = document.getElementById('timeCurrent');
    const timeTotal = document.getElementById('timeTotal');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const stepBackBtn = document.getElementById('stepBackBtn');
    const stepForwardBtn = document.getElementById('stepForwardBtn');
    const speedSelect = document.getElementById('speedSelect');
    const toggleEventsBtn = document.getElementById('toggleEventsBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const closeErrorBtn = document.getElementById('closeErrorBtn');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    // ----- State -----
    let battleData = null;
    let currentTime = 0;
    let totalDuration = 0;
    let isPlaying = false;
    let speed = 1;
    let animationId = null;
    let lastTimestamp = 0;
    let currentEventIndex = 0;
    let events = [];
    let players = {};

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

    // ----- Mock battle data (simulates API response) -----
    function generateMockBattle(battleId) {
        const players = [
            { id: 'p1', name: 'CodeNinja', result: 'winner' },
            { id: 'p2', name: 'ByteWizard', result: 'loser' }
        ];

        const codeSnippets = [
            'function solve(arr) {\n  let sum = 0;\n  for (let i = 0; i < arr.length; i++) {\n    sum += arr[i];\n  }\n  return sum;\n}',
            'function solve(arr) {\n  return arr.reduce((a, b) => a + b, 0);\n}',
            'function solve(arr) {\n  let sum = 0;\n  for (const num of arr) {\n    sum += num;\n  }\n  return sum;\n}',
            'function solve(arr) {\n  // Optimized with forEach\n  let sum = 0;\n  arr.forEach(num => sum += num);\n  return sum;\n}',
            'function solve(arr) {\n  // Using reduce with initial value\n  return arr.reduce((acc, curr) => acc + curr, 0);\n}'
        ];

        const events = [];
        let time = 0;
        
        // Start event
        events.push({ time: 0, type: 'start', desc: 'Battle started', player: 'system' });
        
        // Player 1 coding events
        const p1Codes = [0, 1, 3, 4];
        p1Codes.forEach((idx, i) => {
            time += 5 + Math.random() * 10;
            events.push({
                time: Math.round(time),
                type: 'code',
                desc: `Player 1 updated code`,
                player: 'p1',
                code: codeSnippets[idx % codeSnippets.length]
            });
            
            // Sometimes add a submission
            if (i % 2 === 0) {
                time += 2;
                events.push({
                    time: Math.round(time),
                    type: 'submit',
                    desc: `Player 1 submitted solution (attempt ${i + 1})`,
                    player: 'p1'
                });
            }
        });

        // Player 2 coding events
        const p2Codes = [2, 0, 4, 1];
        p2Codes.forEach((idx, i) => {
            time += 5 + Math.random() * 10;
            events.push({
                time: Math.round(time),
                type: 'code',
                desc: `Player 2 updated code`,
                player: 'p2',
                code: codeSnippets[idx % codeSnippets.length]
            });
            
            if (i % 2 === 0) {
                time += 2;
                events.push({
                    time: Math.round(time),
                    type: 'submit',
                    desc: `Player 2 submitted solution (attempt ${i + 1})`,
                    player: 'p2'
                });
            }
        });

        // Final events
        time += 3;
        events.push({
            time: Math.round(time),
            type: 'timer',
            desc: '⏰ 5 minutes remaining',
            player: 'system'
        });

        time += 10;
        events.push({
            time: Math.round(time),
            type: 'finish',
            desc: '🏁 Battle finished! Player 1 wins!',
            player: 'system'
        });

        // Sort events by time
        events.sort((a, b) => a.time - b.time);

        return {
            id: battleId,
            startTime: new Date(Date.now() - 3600000).toISOString(),
            duration: time,
            players: players,
            events: events,
            winner: 'p1'
        };
    }

    // ----- Load battle -----
    function loadBattle(battleId) {
        if (!battleId || battleId.trim() === '') {
            showError('Please enter a valid Battle ID');
            return;
        }

        showLoading(true);

        // Simulate API call
        setTimeout(() => {
            try {
                // In real implementation: fetch(`/api/battles/${battleId}/replay`)
                const data = generateMockBattle(battleId.trim());
                battleData = data;
                initializeReplay(data);
                showLoading(false);
                hideError();
            } catch (err) {
                showLoading(false);
                showError('Failed to load battle. Please check the ID and try again.');
            }
        }, 800);
    }

    // ----- Initialize replay -----
    function initializeReplay(data) {
        battleData = data;
        players = {};
        data.players.forEach(p => {
            players[p.id] = p;
        });

        // Update battle info
        battleInfo.style.display = 'block';
        battleIdDisplay.textContent = `Battle #${data.id}`;
        battleDate.textContent = new Date(data.startTime).toLocaleString();
        battleDuration.textContent = `⏱️ ${formatTime(data.duration)}`;

        // Update player tags
        player1Tag.querySelector('.player-name').textContent = players.p1?.name || 'Player 1';
        player2Tag.querySelector('.player-name').textContent = players.p2?.name || 'Player 2';
        player1Result.textContent = data.winner === 'p1' ? '🏆 Winner' : '💔 Lost';
        player2Result.textContent = data.winner === 'p2' ? '🏆 Winner' : '💔 Lost';
        player1Label.textContent = `👤 ${players.p1?.name || 'Player 1'}`;
        player2Label.textContent = `👤 ${players.p2?.name || 'Player 2'}`;

        // Setup events
        events = data.events;
        totalDuration = data.duration;
        currentTime = 0;
        currentEventIndex = 0;

        // Show sections
        controlsSection.style.display = 'block';
        codeSection.style.display = 'block';
        eventsSection.style.display = 'block';

        // Render timeline
        renderTimeline();
        renderEvents();
        updateCodeDisplay(0);
        updateTimeDisplay();

        // Reset controls
        isPlaying = false;
        playPauseBtn.textContent = '▶️';
        playPauseBtn.classList.remove('active');

        // Start at beginning
        currentTime = 0;
        seekTo(0);
    }

    // ----- Timeline rendering -----
    function renderTimeline() {
        timelineEvents.innerHTML = '';
        events.forEach(event => {
            const dot = document.createElement('div');
            dot.className = 'timeline-event-dot';
            if (event.type === 'submit') dot.classList.add('submit');
            if (event.type === 'error') dot.classList.add('error');
            const percentage = (event.time / totalDuration) * 100;
            dot.style.left = percentage + '%';
            dot.title = `${formatTime(event.time)}: ${event.desc}`;
            timelineEvents.appendChild(dot);
        });
    }

    // ----- Seek to time -----
    function seekTo(time) {
        currentTime = Math.max(0, Math.min(totalDuration, time));
        const percentage = (currentTime / totalDuration) * 100;
        timelineProgress.style.width = percentage + '%';
        timelineHandle.style.left = percentage + '%';
        updateTimeDisplay();
        updateCodeDisplay(currentTime);
        highlightEvents(currentTime);
    }

    // ----- Update code display -----
    function updateCodeDisplay(time) {
        // Find latest code event for each player
        let p1LatestCode = '// Waiting for code...';
        let p2LatestCode = '// Waiting for code...';
        let p1Submissions = 0;
        let p2Submissions = 0;
        let p1StatusText = '💻 Coding...';
        let p2StatusText = '💻 Coding...';

        events.forEach(event => {
            if (event.time <= time) {
                if (event.player === 'p1' && event.type === 'code' && event.code) {
                    p1LatestCode = event.code;
                    p1StatusText = '✏️ Writing...';
                }
                if (event.player === 'p2' && event.type === 'code' && event.code) {
                    p2LatestCode = event.code;
                    p2StatusText = '✏️ Writing...';
                }
                if (event.player === 'p1' && event.type === 'submit') {
                    p1Submissions++;
                    p1StatusText = '📤 Submitted!';
                }
                if (event.player === 'p2' && event.type === 'submit') {
                    p2Submissions++;
                    p2StatusText = '📤 Submitted!';
                }
                if (event.type === 'finish') {
                    p1StatusText = '🏁 Finished';
                    p2StatusText = '🏁 Finished';
                }
            }
        });

        player1CodeContent.textContent = p1LatestCode;
        player2CodeContent.textContent = p2LatestCode;
        player1Status.textContent = p1StatusText;
        player2Status.textContent = p2StatusText;
        player1Submissions.textContent = `Submissions: ${p1Submissions}`;
        player2Submissions.textContent = `Submissions: ${p2Submissions}`;
    }

    // ----- Highlight events -----
    function highlightEvents(time) {
        const items = eventsList.querySelectorAll('.event-item');
        items.forEach((item, index) => {
            const eventTime = parseInt(item.dataset.time);
            if (eventTime <= time) {
                item.style.opacity = '1';
                item.style.background = '#eff6ff';
            } else {
                item.style.opacity = '0.5';
                item.style.background = 'transparent';
            }
        });
    }

    // ----- Render events list -----
    function renderEvents() {
        let html = '';
        events.forEach((event, index) => {
            const typeClass = event.type;
            const timeStr = formatTime(event.time);
            const icon = event.type === 'start' ? '🚀' :
                         event.type === 'finish' ? '🏁' :
                         event.type === 'submit' ? '📤' :
                         event.type === 'timer' ? '⏰' :
                         event.type === 'error' ? '❌' : '💻';
            
            html += `
                <div class="event-item" data-time="${event.time}" data-index="${index}">
                    <span class="event-time">${timeStr}</span>
                    <span class="event-type ${typeClass}">${icon} ${event.type.toUpperCase()}</span>
                    <span class="event-desc">${event.desc}</span>
                    ${event.player && event.player !== 'system' ? `<span class="event-player">${players[event.player]?.name || event.player}</span>` : ''}
                </div>
            `;
        });
        eventsList.innerHTML = html;
    }

    // ----- Update time display -----
    function updateTimeDisplay() {
        timeCurrent.textContent = formatTime(currentTime);
        timeTotal.textContent = formatTime(totalDuration);
    }

    // ----- Format time -----
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // ----- Play/Pause -----
    function togglePlay() {
        if (currentTime >= totalDuration) {
            seekTo(0);
        }
        isPlaying = !isPlaying;
        playPauseBtn.textContent = isPlaying ? '⏸️' : '▶️';
        if (isPlaying) {
            playPauseBtn.classList.add('active');
            lastTimestamp = performance.now();
            animateReplay();
        } else {
            playPauseBtn.classList.remove('active');
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }
    }

    // ----- Animate replay -----
    function animateReplay() {
        if (!isPlaying) return;

        const now = performance.now();
        const delta = (now - lastTimestamp) / 1000;
        lastTimestamp = now;

        const step = delta * speed;
        const newTime = currentTime + step;

        if (newTime >= totalDuration) {
            seekTo(totalDuration);
            isPlaying = false;
            playPauseBtn.textContent = '▶️';
            playPauseBtn.classList.remove('active');
            return;
        }

        seekTo(newTime);
        animationId = requestAnimationFrame(animateReplay);
    }

    // ----- Step functions -----
    function stepForward() {
        if (isPlaying) togglePlay();
        const step = 5; // 5 seconds
        seekTo(currentTime + step);
    }

    function stepBackward() {
        if (isPlaying) togglePlay();
        const step = 5; // 5 seconds
        seekTo(currentTime - step);
    }

    function rewind() {
        if (isPlaying) togglePlay();
        seekTo(0);
    }

    function forward() {
        if (isPlaying) togglePlay();
        seekTo(totalDuration);
    }

    // ----- Toggle events -----
    let eventsVisible = true;
    function toggleEvents() {
        eventsVisible = !eventsVisible;
        eventsList.style.display = eventsVisible ? 'block' : 'none';
        toggleEventsBtn.textContent = eventsVisible ? 'Hide Events' : 'Show Events';
    }

    // ----- Timeline click -----
    function handleTimelineClick(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const time = x * totalDuration;
        if (isPlaying) togglePlay();
        seekTo(time);
    }

    // ----- Loading states -----
    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // ----- Error handling -----
    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        setTimeout(() => {
            errorMessage.style.opacity = '1';
        }, 10);
    }

    function hideError() {
        errorMessage.style.display = 'none';
        errorMessage.style.opacity = '0';
    }

    // ----- Event listeners -----
    loadBattleBtn.addEventListener('click', () => {
        loadBattle(battleIdInput.value);
    });

    battleIdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            loadBattle(battleIdInput.value);
        }
    });

    playPauseBtn.addEventListener('click', togglePlay);
    rewindBtn.addEventListener('click', rewind);
    forwardBtn.addEventListener('click', forward);
    stepBackBtn.addEventListener('click', stepBackward);
    stepForwardBtn.addEventListener('click', stepForward);

    speedSelect.addEventListener('change', (e) => {
        speed = parseFloat(e.target.value);
    });

    const timelineTrack = document.getElementById('timelineTrack');
    timelineTrack.addEventListener('click', handleTimelineClick);

    toggleEventsBtn.addEventListener('click', toggleEvents);
    closeErrorBtn.addEventListener('click', hideError);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === ' ') {
            e.preventDefault();
            togglePlay();
        }
        if (e.key === 'ArrowRight') stepForward();
        if (e.key === 'ArrowLeft') stepBackward();
        if (e.key === 'r' || e.key === 'R') rewind();
        if (e.key === 'f' || e.key === 'F') forward();
    });

    // ----- Expose for debugging -----
    window.__BattleReplay = {
        loadBattle,
        seekTo,
        togglePlay,
        speed,
        battleData,
        formatTime
    };

    // Load default battle on init
    setTimeout(() => {
        battleIdInput.value = 'battle_12345';
        loadBattle('battle_12345');
    }, 100);

    console.log('🎮 Battle Replay System initialized!');
    console.log('💡 Use keyboard shortcuts: Space (play/pause), Arrow keys (step), R (rewind), F (forward)');
})();