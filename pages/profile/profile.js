// pages/profile/profile.js

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ===============================================================
  // CONFIG & STATE
  // ===============================================================
  const ITEMS_PER_PAGE = 12;
  let currentPage = 1;
  let filteredProblems = [];

  // ===============================================================
  // DOM REFS
  // ===============================================================
  const $ = id => document.getElementById(id);

  const grid = $('solvedGrid');
  const emptyState = $('emptyState');
  const pagination = $('profilePagination');
  const prevBtn = $('prevPageBtn');
  const nextBtn = $('nextPageBtn');
  const pageInfo = $('pageInfo');
  const searchInput = $('searchSolved');
  const difficultyFilter = $('difficultyFilter');

  const userNameEl = $('userName');
  const userLevelEl = $('userLevel');
  const userStreakEl = $('userStreak');
  const userXPEl = $('userXP');
  const solvedCountEl = $('solvedCount');

  const avatarUploadOverlay = $('avatarUploadOverlay');
  const avatarFileInput = $('avatarFileInput');
  const profileAvatarImage = $('profileAvatarImage');
  const profileAvatarEmoji = $('profileAvatarEmoji');

  const profileBioEl = $('profileBio');
  const profileFreezesEl = $('profileFreezesSection');
  const profileProblemsEl = $('profileProblems');
  const profileBadgesEl = $('profileBadges');
  const profileProgressFill = $('profileProgressBar');
  const profileProgressLabel = $('profileLevelProgress');
  const joinDateSectionEl = $('joinDateSection');
  const recentActivityEl = $('recentActivityList');
  const skillsMasteryEl = $('skillsMasteryGrid');

  // Sync saved data from localStorage into userProgress before init
  (function syncSavedProgress() {
    try {
      var saved = localStorage.getItem('algoInfinityVerse');
      if (saved) {
        var data = JSON.parse(saved);
        if (data && typeof data === 'object' && typeof window.userProgress === 'object') {
          Object.assign(window.userProgress, data);
        }
      }
    } catch(e) { /* localStorage read failed, use defaults */ }
  })();

  // Load userProgress and init
  setTimeout(function() {
    try { initProfile(); }
    catch (err) { console.warn('Profile init error:', err); }
  }, 100);

  // ===============================================================
  // AVATAR UPLOAD
  // ===============================================================
  if (avatarUploadOverlay && avatarFileInput) {
    avatarUploadOverlay.addEventListener('click', () => avatarFileInput.click());

    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        if (typeof showNotification === 'function') showNotification('Please select an image file.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        if (profileAvatarImage) { profileAvatarImage.src = dataUrl; profileAvatarImage.style.display = 'block'; }
        if (profileAvatarEmoji) profileAvatarEmoji.style.display = 'none';
        if (typeof userProgress !== 'undefined') {
          userProgress.avatar = dataUrl;
          if (typeof saveUserData === 'function') saveUserData();
          else localStorage.setItem('algoInfinityVerse', JSON.stringify(userProgress));
        }
        const cardAvatar = $('cardAvatar');
        if (cardAvatar) {
          cardAvatar.innerHTML = '';
          const img = document.createElement('img');
          img.src = dataUrl; img.alt = 'Avatar';
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
          cardAvatar.appendChild(img);
        }
        if (typeof showNotification === 'function') showNotification('Avatar updated!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  // ===============================================================
  // BUTTON WIRING
  // ===============================================================
  const langEditBtn = $('languagesEditBtn');
  if (langEditBtn) {
    langEditBtn.addEventListener('click', () => {
      if (typeof window.openProfileModal === 'function') window.openProfileModal();
    });
  }

  // Wire edit profile button — initProfileEdit() from profile-edit.js handles this
  if (typeof window.initProfileEdit === 'function') window.initProfileEdit();

  const profileSaveBtn = $('profileSaveBtn');
  const profileCancelBtn = $('profileCancelBtn');
  if (profileSaveBtn) profileSaveBtn.addEventListener('click', () => { if (typeof window.saveProfileChanges === 'function') window.saveProfileChanges(); });
  if (profileCancelBtn) profileCancelBtn.addEventListener('click', () => { if (typeof window.closeProfileModal === 'function') window.closeProfileModal(); });

  // ===============================================================
  // LOCAL USER ID HELPER
  // ===============================================================
  function getCurrentUserIdLocal() {
    return (window.algoAuth?.user?.sub || window.algoAuth?.user?.id || null);
  }

  // ===============================================================
  // INIT PROFILE
  // ===============================================================
  function initProfile() {
    const u = window.userProgress;
    if (!u) { console.error('userProgress not defined'); return; }

    userNameEl.textContent = u.name || 'Learner';
    userLevelEl.textContent = 'Level ' + (u.level || 1);
    userStreakEl.textContent = u.streak || 0;
    userXPEl.textContent = u.xp || 0;

    if (profileProblemsEl) profileProblemsEl.textContent = (u.completedProblems || []).length;
    if (profileFreezesEl) profileFreezesEl.textContent = u.freezes || 0;
    if (profileBadgesEl) {
      const c = (u.completedProblems || []).length;
      profileBadgesEl.textContent = [
        c >= 1, (u.streak || 0) >= 7, (u.xp || 0) >= 5000, c >= 50, c >= 100,
        c >= 25 && (u.xp || 0) >= 2500, (u.battlesWon || 0) >= 1, (u.battlesWon || 0) >= 5,
        !!(u.inventory?.exclusiveBadge)
      ].filter(Boolean).length;
    }

    if (joinDateSectionEl) {
      const d = u.joinDate ? new Date(u.joinDate) : new Date();
      joinDateSectionEl.textContent = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    updateLevelProgressLocal();
    renderBio();
    renderRecentActivity();
    renderSkillsMastery();
    renderBookmarkSection();
    renderAvatar();

    // Load data for solved grid
    if (typeof window.practiceProblems !== 'undefined') {
      filteredProblems = (u.completedProblems || []).map(id => {
        const p = window.practiceProblems.find(pp => pp.id === id);
        return p ? { ...p, completedAt: 'Unknown' } : null;
      }).filter(Boolean);
    }
    solvedCountEl.textContent = filteredProblems.length;
    applyFilters();

    // Identity card
    initIdentityCard();

    // New sections
    renderActivityHeatmap();
    renderPersonalityCard();
    updateReviewQueue();
    renderFreezeHistory();
    renderRecommendations();
    renderRecentlyViewed();
    renderBadges();

    // Languages
    if (typeof window.renderLanguageChips === 'function') window.renderLanguageChips();
  }

  function updateLevelProgressLocal() {
    const u = window.userProgress || {};
    const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
    const cl = u.level || 1;
    const base = levels[Math.max(0, cl - 1)];
    const next = levels[cl] || 100000;
    const pct = Math.min(Math.max((((u.xp || 0) - base) / (next - base)) * 100, 0), 100);
    if (profileProgressFill) profileProgressFill.style.width = pct + '%';
    if (profileProgressLabel) profileProgressLabel.textContent = Math.round(pct) + '%';
  }

  function renderBio() {
    if (!profileBioEl) return;
    if (window.userProgress?.bio) {
      profileBioEl.textContent = window.userProgress.bio;
      profileBioEl.classList.remove('empty-state');
    } else {
      profileBioEl.textContent = 'No bio yet. Click edit to add one!';
      profileBioEl.classList.add('empty-state');
    }
  }

  function renderAvatar() {
    const u = window.userProgress;
    if (!u) return;
    if (u.avatar && typeof u.avatar === 'string' && u.avatar.startsWith('data:image')) {
      if (profileAvatarImage) { profileAvatarImage.src = u.avatar; profileAvatarImage.style.display = 'block'; }
      if (profileAvatarEmoji) profileAvatarEmoji.style.display = 'none';
    } else if (profileAvatarEmoji && typeof window.renderProfileAvatar === 'function') {
      if (profileAvatarImage) profileAvatarImage.style.display = 'none';
      const av = u.avatar || { initial: (u.name || 'L').charAt(0).toUpperCase(), bg: '#a8c8f0' };
      profileAvatarEmoji.style.display = '';
      profileAvatarEmoji.innerHTML = '';
      window.renderProfileAvatar(profileAvatarEmoji, av);
    }
  }

  // ===============================================================
  // ACTIVITY HEATMAP
  // ===============================================================
  function getActivityLevel(count) {
    if (!count || count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  }

  function renderActivityHeatmap() {
    const container = $('activityHeatmap');
    if (!container) return;
    const u = window.userProgress || {};
    const data = u.activityData || {};
    const today = new Date(); today.setHours(23, 59, 59, 999);
    const WEEKS = 26;
    const dow = today.getDay();
    const start = new Date(today);
    start.setDate(start.getDate() - ((WEEKS * 7 - 1) - dow));
    start.setHours(0, 0, 0, 0);

    const weeks = [];
    let cur = [];
    const d2 = new Date(start);

    for (let i = 0; i < WEEKS * 7; i++) {
      if (d2.getDay() === 0 && cur.length > 0) { weeks.push(cur); cur = []; }
      cur.push(new Date(d2));
      d2.setDate(d2.getDate() + 1);
    }
    if (cur.length > 0) weeks.push(cur);

    // Detect month boundaries for labels
    const monthBoundaries = [];
    let lastMonth = -1;
    weeks.forEach((w, wi) => {
      const mid = w[Math.min(3, w.length - 1)];
      const m = mid.getMonth();
      if (m !== lastMonth) {
        monthBoundaries.push({ weekIdx: wi, label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m] });
        lastMonth = m;
      }
    });

    const wdLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    const fmt = (date) => {
      const y = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return y + '-' + mm + '-' + dd;
    };

    // Compute total contributions in range
    let total = 0;
    const iter = new Date(start);
    while (iter <= today) {
      total += data[fmt(iter)] || 0;
      iter.setDate(iter.getDate() + 1);
    }

    let html = '<div class="heatmap-stats"><strong>' + total + '</strong> problems solved in the last 6 months</div>';
    html += '<div class="heatmap-legend"><span>Less</span><div class="legend-swatches">';
    for (var l = 0; l <= 4; l++) { html += '<div class="legend-swatch" data-level="' + l + '"></div>'; }
    html += '</div><span>More</span></div>';
    html += '<div class="heatmap-months-row">';
    monthBoundaries.forEach(function(mb, i) {
      var span = i < monthBoundaries.length - 1 ? monthBoundaries[i + 1].weekIdx - mb.weekIdx : weeks.length - mb.weekIdx;
      html += '<span class="heatmap-month-label" style="flex:' + span + '">' + mb.label + '</span>';
    });
    html += '</div><div class="heatmap-grid"><div class="heatmap-weekday-labels">';
    wdLabels.forEach(function(l) { html += '<span class="heatmap-weekday-label">' + l + '</span>'; });
    html += '</div>';

    weeks.forEach(function(w) {
      html += '<div class="heatmap-week">';
      for (var di = 0; di < 7; di++) {
        if (di < w.length) {
          var date = w[di];
          var key = fmt(date);
          var cnt = data[key] || 0;
          var lvl = getActivityLevel(cnt);
          var isFut = date > today;
          html += '<div class="heatmap-day" data-level="' + (isFut ? -1 : lvl) + '" data-date="' + key + '" data-count="' + cnt + '" data-future="' + isFut + '"></div>';
        } else {
          html += '<div class="heatmap-day" data-future="true"></div>';
        }
      }
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
    attachHeatmapTooltips();
  }

  function attachHeatmapTooltips() {
    const tip = $('heatmapTooltip');
    if (!tip) return;
    if (tip.parentElement !== document.body) document.body.appendChild(tip);
    document.querySelectorAll('.heatmap-day:not([data-future="true"])').forEach(day => {
      day.addEventListener('mouseenter', (e) => {
        const cnt = parseInt(day.dataset.count) || 0;
        try {
          const parts = day.dataset.date.split('-').map(Number);
          const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
          tip.innerHTML = '<strong>' + parsed.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }) + '</strong>' + cnt + ' problem' + (cnt !== 1 ? 's' : '') + ' solved';
        } catch (_) { tip.innerHTML = '<strong>' + day.dataset.date + '</strong>' + cnt + ' problems'; }
        tip.classList.add('visible');
        posTip(e, tip);
      });
      day.addEventListener('mousemove', (e) => posTip(e, tip));
      day.addEventListener('mouseleave', () => tip.classList.remove('visible'));
    });
  }

  function posTip(e, tip) {
    const r = tip.getBoundingClientRect();
    let l = e.clientX + 14, t = e.clientY - r.height - 12;
    if (l + r.width + 8 > window.innerWidth) l = e.clientX - r.width - 14;
    if (t < 8) t = e.clientY + 12;
    if (l < 8) l = 8;
    tip.style.left = l + 'px'; tip.style.top = t + 'px';
  }

  // ===============================================================
  // CODING PERSONALITY
  // ===============================================================
  function renderPersonalityCard() {
    const u = window.userProgress || {};
    const cp = u.codingPersonality || { type: 'brute-force first', bruteForceCount: 1, slowAccurateCount: 0, greedyCount: 0, overOptimizerCount: 0 };
    const total = (cp.bruteForceCount||0) + (cp.slowAccurateCount||0) + (cp.greedyCount||0) + (cp.overOptimizerCount||0) || 1;
    const pctB = Math.round(((cp.bruteForceCount||0)/total)*100);
    const pctO = Math.round(((cp.overOptimizerCount||0)/total)*100);
    const pctS = Math.round(((cp.slowAccurateCount||0)/total)*100);
    const pctG = Math.round(((cp.greedyCount||0)/total)*100);

    let icon = '🔍', desc = 'Take the profiler quiz to discover your coding style.', adapt = '';
    if (cp.type === 'brute-force first') { icon = '🔴'; desc = 'You jump straight into writing code! You get solutions quickly, but can overlook edge cases.'; adapt = 'Focus: Easy/Medium with boundary checks'; }
    else if (cp.type === 'over-optimizer') { icon = '💜'; desc = 'You love optimal space/time tricks! You always reach for hashes and pointers.'; adapt = 'Focus: Medium/Hard, clean code'; }
    else if (cp.type === 'slow but accurate') { icon = '💙'; desc = 'You take your time to design solutions. You have low error rates.'; adapt = 'Focus: Medium, speed practice'; }
    else if (cp.type === 'greedy thinker') { icon = '💚'; desc = 'You look for immediate local optimizations.'; adapt = 'Focus: Greedy & DP concepts'; }

    const content = $('personalityContent');
    if (!content) return;
    content.innerHTML =
      '<div class="personality-header-info">' +
        '<div class="personality-badge-icon">' + icon + '</div>' +
        '<div class="personality-type-group"><h4>' + cp.type.replace('-', ' ') + '</h4>' + (adapt ? '<span class="adaptation-badge">' + adapt + '</span>' : '') + '</div>' +
      '</div>' +
      '<p class="personality-description">' + desc + '</p>' +
      '<div class="style-progress-bars">' +
        '<div class="style-bar-group"><span class="style-label">Brute-Force First (' + pctB + '%)</span><div class="style-bar-track"><div class="style-bar-fill" style="width:' + pctB + '%;background:var(--pf-rose);"></div></div></div>' +
        '<div class="style-bar-group"><span class="style-label">Over-Optimizer (' + pctO + '%)</span><div class="style-bar-track"><div class="style-bar-fill" style="width:' + pctO + '%;background:var(--pf-blue);"></div></div></div>' +
        '<div class="style-bar-group"><span class="style-label">Slow but Accurate (' + pctS + '%)</span><div class="style-bar-track"><div class="style-bar-fill" style="width:' + pctS + '%;background:var(--pf-amber);"></div></div></div>' +
        '<div class="style-bar-group"><span class="style-label">Greedy Thinker (' + pctG + '%)</span><div class="style-bar-track"><div class="style-bar-fill" style="width:' + pctG + '%;background:var(--pf-green);"></div></div></div>' +
      '</div>' +
      '<div class="personality-actions"><button class="pf-btn-mini" id="personalityQuizBtn"><i class="fas fa-redo"></i> Retake Profiler Quiz</button></div>';

    const quizBtn = $('personalityQuizBtn');
    if (quizBtn) quizBtn.addEventListener('click', function() {
      if (typeof window.openPersonalityQuiz === 'function') window.openPersonalityQuiz();
      else if (typeof showNotification === 'function') {
        showNotification('Personality quiz module not available on this page. Visit the dashboard to retake the quiz.', 'info');
      }
    });
  }

  // ===============================================================
  // SMART REVIEW QUEUE
  // ===============================================================
  function updateReviewQueue() {
    const el = $('reviewQueueCount');
    if (!el) return;
    try {
      if (window.spacedRepetition && typeof window.spacedRepetition.getDueItems === 'function') {
        el.textContent = window.spacedRepetition.getDueItems().length;
      } else {
        el.textContent = (window.userProgress?.completedProblems || []).length > 0 ? Math.min(5, Math.ceil((window.userProgress.completedProblems.length || 0) * 0.2)) : 0;
      }
    } catch (_) { el.textContent = 0; }
  }

  // ===============================================================
  // FREEZE HISTORY
  // ===============================================================
  function renderFreezeHistory() {
    const el = $('freezeHistoryList');
    if (!el) return;
    const history = window.userProgress?.freezeHistory || [];
    if (history.length === 0) { el.innerHTML = '<p class="pf-empty">No freezes used yet.</p>'; return; }
    el.innerHTML = history.slice(-5).reverse().map(h =>
      '<div class="freeze-item"><i class="fas fa-snowflake"></i><span>' + esc(h.reason) + '</span><span class="freeze-date">' + new Date(h.date).toLocaleDateString() + '</span></div>'
    ).join('');
  }

  // ===============================================================
  // RECOMMENDATIONS
  // ===============================================================
  function renderRecommendations() {
    const el = $('recommendationsContainer');
    if (!el) return;
    const u = window.userProgress || {};
    const pp = window.practiceProblems || [];
    const completed = new Set((u.completedProblems || []).map(String));
    const recent = new Set((u.recentProblems || []).map(String));
    const personalityType = u.codingPersonality?.type || 'brute-force first';
    const diffMap = { 'brute-force first': 'Easy', 'slow but accurate': 'Medium', 'greedy thinker': 'Medium', 'over-optimizer': 'Hard' };
    const prefDiff = diffMap[personalityType] || 'Easy';

    const recs = pp.filter(p => !completed.has(String(p.id)))
      .sort((a, b) => {
        const aR = recent.has(String(a.id)) ? 1 : 0;
        const bR = recent.has(String(b.id)) ? 1 : 0;
        return (aR - bR) || (a.difficulty === prefDiff ? 0 : 1) - (b.difficulty === prefDiff ? 0 : 1) || a.id - b.id;
      }).slice(0, 4);

    if (recs.length === 0) { el.innerHTML = '<p class="pf-empty">No recommendations available. You solved everything!</p>'; return; }
    el.innerHTML = recs.map(p =>
      '<button type="button" class="recommendation-item" data-id="' + p.id + '"><span class="rec-title">' + esc(p.title) + '</span><span class="rec-meta">' + esc(p.difficulty) + ' &middot; ' + esc(p.category || 'practice') + '</span></button>'
    ).join('');
    el.querySelectorAll('.recommendation-item').forEach(btn => {
      btn.addEventListener('click', function() {
        const p = pp.find(x => x.id === Number(this.dataset.id));
        if (p && typeof window.openQuizEditor === 'function') window.openQuizEditor(p);
      });
    });
  }

  // ===============================================================
  // RECENTLY VIEWED
  // ===============================================================
  function renderRecentlyViewed() {
    const el = $('recentProblemsList');
    if (!el) return;
    const u = window.userProgress || {};
    const pp = window.practiceProblems || [];
    const ids = u.recentProblems || [];
    const items = ids.map(id => pp.find(p => p.id === id)).filter(Boolean);
    if (items.length === 0) { el.innerHTML = '<p class="pf-empty">No recently viewed problems.</p>'; return; }
    el.innerHTML = items.slice(0, 6).map(p =>
      '<button type="button" class="recent-problem" data-id="' + p.id + '">' + esc(p.title) + '</button>'
    ).join('');
    el.querySelectorAll('.recent-problem').forEach(btn => {
      btn.addEventListener('click', function() {
        const p = pp.find(x => x.id === Number(this.dataset.id));
        if (p && typeof window.openQuizEditor === 'function') window.openQuizEditor(p);
      });
    });
  }

  // ===============================================================
  // BADGES
  // ===============================================================
  function renderBadges() {
    const container = $('badgesContainer');
    const el = $('badgesEarnedCount');
    if (!container) return;
    const u = window.userProgress || {};
    const c = (u.completedProblems || []).length;
    const badges = [
      { id: 1, icon: '<i class="fas fa-star"></i>', name: 'First Steps', desc: 'Solve 1 problem', earned: c >= 1 },
      { id: 2, icon: '<i class="fas fa-fire"></i>', name: 'On Fire', desc: '7-day streak', earned: (u.streak || 0) >= 7 },
      { id: 3, icon: '<i class="fas fa-gem"></i>', name: 'Diamond', desc: '5,000 XP', earned: (u.xp || 0) >= 5000 },
      { id: 4, icon: '<i class="fas fa-rocket"></i>', name: 'Rocket', desc: '50 problems', earned: c >= 50 },
      { id: 5, icon: '<i class="fas fa-crown"></i>', name: 'Master', desc: '100 problems', earned: c >= 100 },
      { id: 6, icon: '<i class="fas fa-bullseye"></i>', name: 'Sharpshooter', desc: '25 problems + 2,500 XP', earned: c >= 25 && (u.xp || 0) >= 2500 },
      { id: 7, icon: '<i class="fas fa-shield-alt"></i>', name: 'Gladiator', desc: 'Win 1 battle', earned: (u.battlesWon || 0) >= 1 },
      { id: 8, icon: '<i class="fas fa-bolt"></i>', name: 'Speed Demon', desc: 'Win 5 battles', earned: (u.battlesWon || 0) >= 5 },
      { id: 9, icon: '<i class="fas fa-trophy"></i>', name: 'Exclusive', desc: 'XP Store badge', earned: !!(u.inventory?.exclusiveBadge) },
    ];
    const earned = badges.filter(b => b.earned).length;
    if (el) el.textContent = earned + ' / ' + badges.length + ' earned';

    container.innerHTML = badges.map(b =>
      '<div class="badge-pill ' + (b.earned ? 'earned' : 'locked') + '" tabindex="0" aria-label="' + b.name + '">' +
        '<span class="badge-tooltip"><strong>' + b.name + '</strong>' + b.desc + '</span>' +
        b.icon +
      '</div>'
    ).join('');
  }

  // ===============================================================
  // RECENT ACTIVITY
  // ===============================================================
  function renderRecentActivity() {
    if (!recentActivityEl) return;
    const u = window.userProgress || {};
    const pp = window.practiceProblems || [];
    const ids = u.completedProblems || [];
    if (!ids.length) { recentActivityEl.innerHTML = '<p class="pf-empty">No problems solved yet. Start practicing!</p>'; return; }

    const XP = { easy: 100, medium: 250, hard: 500 };
    const subs = u.submittedSolutions || {};

    const entries = ids.slice(-5).reverse().map(id => {
      const p = pp.find(x => x.id === id);
      if (!p) return null;
      const d = subs[id]?.date ? new Date(subs[id].date) : null;
      return { id, title: p.title, diff: (p.difficulty || 'easy').toLowerCase(), xp: XP[(p.difficulty || 'easy').toLowerCase()] || 100, date: d };
    }).filter(Boolean);

    recentActivityEl.innerHTML = entries.map(e =>
      '<button type="button" class="recent-activity-item" data-id="' + e.id + '">' +
        '<span class="recent-activity-title">' + esc(e.title) + '</span>' +
        '<span class="difficulty-badge ' + e.diff + '">' + e.diff + '</span>' +
        '<span class="recent-activity-xp">+' + e.xp + ' XP</span>' +
      '</button>'
    ).join('');
    recentActivityEl.querySelectorAll('.recent-activity-item').forEach(btn => {
      btn.addEventListener('click', function() {
        const p = pp.find(x => x.id === Number(this.dataset.id));
        if (p && typeof window.openQuizEditor === 'function') window.openQuizEditor(p);
      });
    });
  }

  // ===============================================================
  // SKILLS MASTERY
  // ===============================================================
  function renderSkillsMastery() {
    if (!skillsMasteryEl) return;
    const topics = window.dsaTopics || [];
    if (!topics.length || typeof window.getTopicProgress !== 'function') {
      skillsMasteryEl.innerHTML = '<p class="pf-empty">No topics available yet.</p>';
      return;
    }
    // Clean topic names — no emojis, no purplish backgrounds
    skillsMasteryEl.innerHTML = topics.map(function(t) {
      var p = window.getTopicProgress(t.name);
      if (!p || !p.total) return '';
      return '<div class="skill-mastery-item">' +
        '<div class="mastery-header"><span class="mastery-label">' + t.name + '</span><span class="mastery-stats">' + p.completed + '/' + p.total + '</span></div>' +
        '<div class="mastery-bar"><div class="mastery-fill" style="width:' + p.percentage + '%"></div></div>' +
        '<span class="mastery-percentage">' + p.percentage + '%</span>' +
      '</div>';
    }).join('');
  }

  // ===============================================================
  // BOOKMARK SECTION
  // ===============================================================
  function renderBookmarkSection() {
    const panel = $('bookmarkCollectionsPanel');
    if (!panel) return;
    if (typeof window.renderBookmarkCollectionsPanel === 'function') {
      window.renderBookmarkCollectionsPanel();
    } else {
      const collections = window.userProgress?.bookmarkCollections || [];
      if (collections.length === 0) { panel.innerHTML = '<p class="pf-empty">No bookmark collections yet.</p>'; return; }
      panel.innerHTML = collections.slice(0, 4).map(c =>
        '<div class="pf-card-content" style="padding:0.4rem 0.6rem;font-size:0.78rem;color:var(--pf-text);border-bottom:1px solid var(--pf-border);">' + esc(c.name || 'Collection') + '</div>'
      ).join('');
    }
  }

  // ===============================================================
  // SOLVED GRID
  // ===============================================================
  function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const diff = difficultyFilter.value;
    const u = window.userProgress || {};
    const pp = window.practiceProblems || [];
    let list = (u.completedProblems || []).map(id => pp.find(p => p.id === id)).filter(Boolean);
    if (term) list = list.filter(p => p.title.toLowerCase().includes(term) || (p.tags && p.tags.some(t => t.toLowerCase().includes(term))));
    if (diff !== 'all') list = list.filter(p => p.difficulty === diff);
    filteredProblems = list;
    currentPage = 1;
    renderGrid();
  }

  function renderGrid() {
    grid.innerHTML = '';
    if (filteredProblems.length === 0) { grid.classList.add('hidden'); emptyState.classList.remove('hidden'); pagination.classList.add('hidden'); return; }
    grid.classList.remove('hidden'); emptyState.classList.add('hidden');
    const total = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const batch = filteredProblems.slice(start, start + ITEMS_PER_PAGE);

    batch.forEach(p => {
      const card = document.createElement('div');
      card.className = 'problem-card';
      const tags = p.tags ? p.tags.slice(0, 3).map(t => '<span class="tag">' + esc(t) + '</span>').join('') : '';
      card.innerHTML =
        '<div class="problem-header" style="display:flex;justify-content:space-between;align-items:start;">' +
          '<div><h3 class="problem-title">' + esc(p.title) + '</h3><span class="difficulty-badge ' + (p.difficulty||'easy').toLowerCase() + '">' + esc(p.difficulty||'Easy') + '</span></div>' +
          '<button class="export-md-btn" title="Export Markdown" style="background:transparent;border:none;color:var(--pf-text-muted);cursor:pointer;font-size:1rem;"><i class="fas fa-file-download"></i></button>' +
        '</div>' +
        '<div class="problem-tags">' + tags + '</div>' +
        '<div class="problem-meta"><span><i class="fas fa-folder"></i> ' + esc(p.category||'General') + '</span></div>';
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.export-md-btn')) {
          const sol = window.userProgress?.submittedSolutions?.[p.id] || null;
          if (typeof window.exportProblemAsMarkdown === 'function') window.exportProblemAsMarkdown(p, sol);
          else console.warn('Export utility not available on this page.');
          return;
        }
        window.location.href = '../../pages/practice/problems.html?problem=' + p.id;
      });
      grid.appendChild(card);
    });

    if (total > 1) {
      pagination.classList.remove('hidden');
      pageInfo.textContent = 'Page ' + currentPage + ' of ' + total;
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = currentPage === total;
    } else { pagination.classList.add('hidden'); }
  }

  // Event listeners for solved grid
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (difficultyFilter) difficultyFilter.addEventListener('change', applyFilters);
  if (prevBtn) prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderGrid(); window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' }); } });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    const total = Math.ceil(filteredProblems.length / ITEMS_PER_PAGE);
    if (currentPage < total) { currentPage++; renderGrid(); window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' }); }
  });

  // ===============================================================
  // ESCAPE HTML
  // ===============================================================
  function esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  // ===============================================================
  // IDENTITY CARD
  // ===============================================================
  async function initIdentityCard() {
    try {
      const u = window.userProgress;
      if (!u) return;

      const cardAvatar = $('cardAvatar');
      const cardUserName = $('cardUserName');
      const cardUserLevelBadge = $('cardUserLevelBadge');
      const cardUserTitle = $('cardUserTitle');
      const cardRank = $('cardRank');
      const cardXP = $('cardXP');
      const cardStreak = $('cardStreak');
      const cardSkills = $('cardSkills');

      const levelNames = ['Beginner','Novice','Intermediate','Advanced','Expert','Master','Grandmaster','Legend'];
      const levelTitle = levelNames[Math.min(u.level - 1, levelNames.length - 1)] || 'Beginner';

      if (cardAvatar) {
        cardAvatar.textContent = '';
        cardAvatar.style.fontSize = '0';
        const rawAv = u.avatar;
        const cust = u.avatarCustomization || { border: 'none', theme: 'default' };
        if (rawAv && typeof rawAv === 'string' && rawAv.startsWith('data:image')) {
          const bs = window.AVATAR_BORDER_STYLES?.[cust.border] || '';
          const img = document.createElement('img');
          img.src = rawAv; img.alt = 'Avatar';
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
          cardAvatar.appendChild(img);
          if (bs) cardAvatar.style.border = bs;
        } else {
          const av = (rawAv && typeof rawAv === 'object') ? rawAv : { initial: (u.name || 'L').charAt(0).toUpperCase(), bg: '#a8c8f0' };
          const init = av.initial || 'L';
          const themeBg = typeof window.getAvatarThemeBg === 'function' ? window.getAvatarThemeBg(cust.theme, init) : null;
          const bg = themeBg || av.bg || '#a8c8f0';
          const bs = window.AVATAR_BORDER_STYLES?.[cust.border] || '';
          const span = document.createElement('span');
          span.textContent = init;
          span.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;background:' + bg + ';color:#fff;font-size:1.8rem;font-weight:600;font-family:Poppins,sans-serif;' + (bs ? 'border:' + bs + ';' : '');
          if (cust.border === 'rainbow') span.className = 'avatar-border-rainbow';
          cardAvatar.style.fontSize = '0';
          cardAvatar.appendChild(span);
        }
      }
      if (cardUserName) cardUserName.textContent = u.name || 'Learner';
      if (cardUserLevelBadge) cardUserLevelBadge.textContent = 'Level ' + (u.level || 1);
      if (cardUserTitle) cardUserTitle.textContent = levelTitle;
      if (cardXP) cardXP.textContent = (u.xp || 0) > 0 ? (u.xp || 0).toLocaleString() : '-';
      if (cardStreak) cardStreak.textContent = (u.streak || 0) > 0 ? u.streak : '-';

      if (cardRank) {
        cardRank.textContent = '...';
        getLeaderboardRank().then(r => { if (cardRank) cardRank.textContent = r; });
      }

      if (cardSkills) {
        const skills = getTopSkills();
        cardSkills.innerHTML = skills.map(s => '<span class="skill-pill">' + esc(s) + '</span>').join('');
      }

      // QR Code
      const qr = $('cardQrCode');
      if (qr) {
        qr.innerHTML = '';
        const uid = getCurrentUserIdLocal();
        if (uid) {
          const url = window.location.origin + window.location.pathname.replace('profile.html', 'public-profile.html') + '?uid=' + uid;
          try {
            if (typeof QRCode !== 'undefined') {
              new QRCode(qr, { text: url, width: 100, height: 100, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
            } else {
              qr.innerHTML = '<span style="color:var(--pf-text-muted);font-size:0.7rem;">QR library not loaded.</span>';
            }
          } catch (_) { qr.innerHTML = '<span style="color:var(--pf-text-muted);font-size:0.7rem;">QR unavailable</span>'; }
        } else {
          qr.innerHTML = '<span style="color:var(--pf-text-muted);font-size:0.65rem;">Sign in for shareable profile link.</span>';
        }
      }
    } catch (err) {
      console.warn('initIdentityCard error:', err);
    }
  }

  async function getLeaderboardRank() {
    const u = window.userProgress || {};
    const hasProgress = (u.xp || 0) > 0 || (u.streak || 0) > 0;
    if (!hasProgress) return '-';
    try {
      if (typeof window.loadLeaderboard === 'function') {
        const res = await window.loadLeaderboard();
        const leaders = res.leaders || [];
        const currentUserId = getCurrentUserIdLocal() || 'local-user';
        if (typeof window.buildLeaderboardRows === 'function') {
          const rows = window.buildLeaderboardRows(leaders, currentUserId);
          const userRow = rows.find(r => r.id === currentUserId);
          if (userRow?.rank) return '#' + userRow.rank;
        }
      }
    } catch (_) { /* ignore */ }
    return '-';
  }

  function getTopSkills() {
    const ids = window.userProgress?.completedProblems || [];
    if (!ids.length || !window.practiceProblems) return ['General'];
    const counts = {};
    ids.forEach(id => {
      const p = window.practiceProblems.find(x => x.id === id);
      if (p?.category) counts[p.category] = (counts[p.category] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    if (!sorted.length) return ['General'];
    const map = { arrays: 'Arrays', strings: 'Strings', linkedlist: 'Linked List', graphs: 'Graphs', dp: 'Dynamic Programming', trees: 'Trees' };
    return sorted.slice(0, 3).map(c => map[c] || c.charAt(0).toUpperCase() + c.slice(1));
  }

  // ===============================================================
  // THEME BUTTONS & CARD EXPORT
  // ===============================================================
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const card = $('codingIdentityCard');
      if (card) card.className = 'coding-card theme-' + btn.getAttribute('data-theme');
    });
  });

  window.initIdentityCard = initIdentityCard;

  // PNG Export
  const downloadPngBtn = $('downloadPngBtn');
  if (downloadPngBtn) {
    downloadPngBtn.addEventListener('click', async () => {
      const prev = downloadPngBtn.innerHTML;
      downloadPngBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
      downloadPngBtn.disabled = true;
      try {
        window.getSelection().removeAllRanges();
        document.activeElement && document.activeElement.blur();
        const canvas = await captureCardImage();
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = (window.userProgress?.name || 'learner') + '_coding_card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) { console.error('PNG export error:', e); }
      finally { downloadPngBtn.innerHTML = prev; downloadPngBtn.disabled = false; }
    });
  }

  // PDF Export
  const downloadPdfBtn = $('downloadPdfBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async () => {
      const prev = downloadPdfBtn.innerHTML;
      downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
      downloadPdfBtn.disabled = true;
      try {
        window.getSelection().removeAllRanges();
        document.activeElement && document.activeElement.blur();
        const canvas = await captureCardImage();
        if (!canvas) return;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'mm', 'a4');
        const iw = 200;
        const ih = (canvas.height * iw) / canvas.width;
        const x = (pdf.internal.pageSize.getWidth() - iw) / 2;
        const y = (pdf.internal.pageSize.getHeight() - ih) / 2;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, iw, ih);
        pdf.save((window.userProgress?.name || 'learner') + '_coding_card.pdf');
      } catch (e) { console.error('PDF export error:', e); }
      finally { downloadPdfBtn.innerHTML = prev; downloadPdfBtn.disabled = false; }
    });
  }

  async function captureCardImage() {
    if (typeof html2canvas === 'undefined') {
      if (typeof showNotification === 'function') showNotification('Export library (html2canvas) not loaded.', 'error');
      return null;
    }
    const original = $('codingIdentityCard');
    if (!original) return null;
    const clone = original.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('exporting');

    // Copy canvas contents
    original.querySelectorAll('canvas').forEach((oc, i) => {
      const dc = clone.querySelectorAll('canvas')[i];
      if (dc) { dc.width = oc.width; dc.height = oc.height; dc.getContext('2d').drawImage(oc, 0, 0); }
    });

    // Clean up for html2canvas
    const glow = clone.querySelector('.card-glow');
    if (glow) glow.remove();
    const cgrid = clone.querySelector('.card-grid');
    if (cgrid) cgrid.remove();
    clone.querySelectorAll('*').forEach(el => el.setAttribute('style', (el.getAttribute('style') || '') + ';backdrop-filter:none!important;-webkit-backdrop-filter:none!important;'));
    clone.style.backgroundColor = '#0c0b1a';
    const logo = clone.querySelector('.logo-icon');
    if (logo) { logo.style.background = 'none'; logo.style.webkitBackgroundClip = 'unset'; logo.style.webkitTextFillColor = 'unset'; }

    clone.style.cssText += ';position:fixed;left:-9999px;top:0;z-index:-1;width:480px;height:380px;';
    document.body.appendChild(clone);
    try { return await html2canvas(clone, { scale: 3, useCORS: true, backgroundColor: null, logging: false }); }
    finally { if (clone.parentNode) clone.parentNode.removeChild(clone); }
  }

});
