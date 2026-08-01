import { ActivityHeatmap } from '../../modules/activityHeatmap.js';

document.addEventListener('DOMContentLoaded', () => {
  initStreakDashboard();
});

let timerSeconds = 0;
let timerInterval = null;
let heatmapInstance = null;

async function initStreakDashboard() {
  heatmapInstance = new ActivityHeatmap();

  // Ensure userProgress loaded
  if (window.userProgress && typeof window.updateStreak === 'function') {
    window.updateStreak();
  }

  fetchBackendData();
  renderDashboard();
  setupEventListeners();
  setupTimerControls();
}

async function fetchBackendData() {
  try {
    const [streakRes, goalRes] = await Promise.allSettled([
      fetch('/api/streaks', { headers: { Accept: 'application/json' } }),
      fetch('/api/goals', { headers: { Accept: 'application/json' } }),
    ]);

    if (streakRes.status === 'fulfilled' && streakRes.value.ok) {
      const data = await streakRes.value.json();
      if (data.success && window.userProgress) {
        if (data.streak !== undefined) window.userProgress.streak = data.streak;
        if (data.freezes !== undefined) window.userProgress.freezes = data.freezes;
        if (data.longestStreak !== undefined)
          window.userProgress.longestStreak = data.longestStreak;
        if (data.activityData) {
          window.userProgress.activityData = {
            ...(window.userProgress.activityData || {}),
            ...data.activityData,
          };
        }
      }
    }

    if (goalRes.status === 'fulfilled' && goalRes.value.ok) {
      const gData = await goalRes.value.json();
      if (gData.success && window.userProgress) {
        if (gData.dailyGoals)
          window.userProgress.dailyGoals = {
            ...(window.userProgress.dailyGoals || {}),
            ...gData.dailyGoals,
          };
        if (gData.weeklyGoals)
          window.userProgress.weeklyGoals = {
            ...(window.userProgress.weeklyGoals || {}),
            ...gData.weeklyGoals,
          };
      }
    }
  } catch (e) {
    console.log('Using local userProgress data for streak dashboard');
  }
  renderDashboard();
}

function renderDashboard() {
  const up = window.userProgress || {};
  const streak = up.streak || 0;
  const longest = Math.max(streak, up.longestStreak || 0);
  const freezes = up.freezes || 0;

  // Multiplier calculation
  const multiplier =
    typeof window.getStreakMultiplier === 'function'
      ? window.getStreakMultiplier(streak)
      : streak >= 100
        ? 2.0
        : streak >= 30
          ? 1.5
          : streak >= 7
            ? 1.2
            : 1.0;

  // Update Hero Meta
  const currentStreakEl = document.getElementById('currentStreakVal');
  if (currentStreakEl) currentStreakEl.textContent = streak;

  const multiplierValEl = document.getElementById('multiplierVal');
  if (multiplierValEl) multiplierValEl.textContent = `${multiplier.toFixed(1)}x`;

  const freezeCountValEl = document.getElementById('freezeCountVal');
  if (freezeCountValEl) freezeCountValEl.textContent = freezes;

  const longestStreakValEl = document.getElementById('longestStreakVal');
  if (longestStreakValEl) longestStreakValEl.textContent = longest;

  // Freeze button state
  const useFreezeBtn = document.getElementById('useFreezeBtn');
  if (useFreezeBtn) {
    useFreezeBtn.disabled = freezes <= 0;
    useFreezeBtn.style.opacity = freezes <= 0 ? '0.5' : '1';
  }

  // Render Heatmap
  if (heatmapInstance) {
    heatmapInstance.render('heatmapContainer', up.activityData || {});
  }

  // Render Goals Progress
  renderGoalsProgress();

  // Render Study Stats Summary
  const study = up.studyTime || { todayMinutes: 0, totalMinutes: 0 };
  const todayStudyEl = document.getElementById('todayStudyMins');
  if (todayStudyEl) todayStudyEl.textContent = study.todayMinutes || 0;

  const totalStudyEl = document.getElementById('totalStudyMins');
  if (totalStudyEl) totalStudyEl.textContent = study.totalMinutes || 0;

  // Render Milestones
  renderMilestones(streak);

  // Update Motivational Nudge
  updateMotivationalNudge(streak, freezes);
}

function renderGoalsProgress() {
  const up = window.userProgress || {};
  const dg = up.dailyGoals || {
    targetProblems: 3,
    targetMinutes: 30,
    targetQuizzes: 1,
    completedProblems: 0,
    completedMinutes: 0,
    completedQuizzes: 0,
  };
  const wg = up.weeklyGoals || {
    targetProblems: 15,
    targetMinutes: 150,
    targetQuizzes: 3,
    completedProblems: 0,
    completedMinutes: 0,
    completedQuizzes: 0,
  };

  // Daily Problems
  const dpText = document.getElementById('dailyProblemsText');
  const dpBar = document.getElementById('dailyProblemsBar');
  const dpComp = dg.completedProblems || 0;
  const dpTarg = dg.targetProblems || 3;
  if (dpText) dpText.textContent = `${dpComp} / ${dpTarg}`;
  if (dpBar) dpBar.style.width = `${Math.min(100, Math.round((dpComp / dpTarg) * 100))}%`;

  // Daily Minutes
  const dmText = document.getElementById('dailyMinutesText');
  const dmBar = document.getElementById('dailyMinutesBar');
  const dmComp = up.studyTime?.todayMinutes || dg.completedMinutes || 0;
  const dmTarg = dg.targetMinutes || 30;
  if (dmText) dmText.textContent = `${dmComp} / ${dmTarg} mins`;
  if (dmBar) dmBar.style.width = `${Math.min(100, Math.round((dmComp / dmTarg) * 100))}%`;

  // Daily Quizzes
  const dqText = document.getElementById('dailyQuizzesText');
  const dqBar = document.getElementById('dailyQuizzesBar');
  const dqComp = dg.completedQuizzes || 0;
  const dqTarg = dg.targetQuizzes || 1;
  if (dqText) dqText.textContent = `${dqComp} / ${dqTarg}`;
  if (dqBar) dqBar.style.width = `${Math.min(100, Math.round((dqComp / dqTarg) * 100))}%`;

  // Weekly Problems
  const wpText = document.getElementById('weeklyProblemsText');
  const wpBar = document.getElementById('weeklyProblemsBar');
  const wpComp = wg.completedProblems || 0;
  const wpTarg = wg.targetProblems || 15;
  if (wpText) wpText.textContent = `${wpComp} / ${wpTarg}`;
  if (wpBar) wpBar.style.width = `${Math.min(100, Math.round((wpComp / wpTarg) * 100))}%`;

  // Weekly Minutes
  const wmText = document.getElementById('weeklyMinutesText');
  const wmBar = document.getElementById('weeklyMinutesBar');
  const wmComp = up.studyTime?.totalMinutes || wg.completedMinutes || 0;
  const wmTarg = wg.targetMinutes || 150;
  if (wmText) wmText.textContent = `${wmComp} / ${wmTarg} mins`;
  if (wmBar) wmBar.style.width = `${Math.min(100, Math.round((wmComp / wmTarg) * 100))}%`;
}

function renderMilestones(streak) {
  const m7 = document.getElementById('milestone7');
  const ms7 = document.getElementById('msStatus7');
  if (m7 && ms7) {
    if (streak >= 7) {
      m7.classList.add('unlocked');
      ms7.textContent = 'Unlocked (1.2x Multiplier)';
    } else {
      m7.classList.remove('unlocked');
      ms7.textContent = `Progress: ${streak}/7 Days`;
    }
  }

  const m30 = document.getElementById('milestone30');
  const ms30 = document.getElementById('msStatus30');
  if (m30 && ms30) {
    if (streak >= 30) {
      m30.classList.add('unlocked');
      ms30.textContent = 'Unlocked (1.5x Multiplier)';
    } else {
      m30.classList.remove('unlocked');
      ms30.textContent = `Progress: ${streak}/30 Days`;
    }
  }

  const m100 = document.getElementById('milestone100');
  const ms100 = document.getElementById('msStatus100');
  if (m100 && ms100) {
    if (streak >= 100) {
      m100.classList.add('unlocked');
      ms100.textContent = 'Unlocked (2.0x Multiplier)';
    } else {
      m100.classList.remove('unlocked');
      ms100.textContent = `Progress: ${streak}/100 Days`;
    }
  }
}

function updateMotivationalNudge(streak) {
  const nudgeText = document.getElementById('nudgeText');
  if (!nudgeText) return;

  if (streak === 0) {
    nudgeText.textContent =
      '🚀 Start a new streak today! Complete any problem or quiz to get your fire burning.';
  } else if (streak >= 100) {
    nudgeText.textContent =
      "🏆 Legendary 100+ day streak! You're operating at a 2.0x XP Multiplier. Master class!";
  } else if (streak >= 30) {
    nudgeText.textContent =
      '👑 30-day streak achieved! You have a 1.5x XP Multiplier active. Keep pushing!';
  } else if (streak >= 7) {
    nudgeText.textContent = "⚡ You're on a 7+ day streak! 1.2x XP Multiplier unlocked!";
  } else {
    nudgeText.textContent = `🔥 Day ${streak} streak active! ${7 - streak} more days to unlock your first 1.2x XP Multiplier.`;
  }
}

function setupEventListeners() {
  // Use Freeze Button
  const useFreezeBtn = document.getElementById('useFreezeBtn');
  if (useFreezeBtn) {
    useFreezeBtn.addEventListener('click', async () => {
      let success = false;
      if (typeof window.useStreakFreeze === 'function') {
        success = window.useStreakFreeze();
      }
      if (success) {
        if (typeof showNotification === 'function')
          showNotification('❄️ Streak freeze activated successfully!', 'success');
        syncStreakToBackend();
        renderDashboard();
      } else {
        if (typeof showNotification === 'function')
          showNotification('No streak freezes available.', 'warning');
      }
    });
  }

  // Dismiss Nudge Banner
  const dismissBtn = document.getElementById('dismissNudgeBtn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      const banner = document.getElementById('motivationalNudge');
      if (banner) banner.style.display = 'none';
    });
  }

  // Goal buttons
  document.querySelectorAll('.goal-check-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const goalType = e.currentTarget.getAttribute('data-goal');
      const up = window.userProgress || {};
      if (!up.dailyGoals) up.dailyGoals = {};

      if (goalType === 'dailyProblems') {
        up.dailyGoals.completedProblems = (up.dailyGoals.completedProblems || 0) + 1;
        if (typeof window.recordDailyActivity === 'function') window.recordDailyActivity(1);
        if (typeof window.addXP === 'function') window.addXP(25, 'daily_goal');
      } else if (goalType === 'dailyMinutes') {
        if (typeof window.logStudyTime === 'function') window.logStudyTime(15);
      } else if (goalType === 'dailyQuizzes') {
        up.dailyGoals.completedQuizzes = (up.dailyGoals.completedQuizzes || 0) + 1;
        if (typeof window.recordDailyActivity === 'function') window.recordDailyActivity(1);
        if (typeof window.addXP === 'function') window.addXP(15, 'quiz_goal');
      }

      if (typeof saveUserData === 'function') saveUserData();
      syncGoalsToBackend();
      renderDashboard();
    });
  });

  // Quick Log buttons
  document.querySelectorAll('.quick-log-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const mins = Number(e.currentTarget.getAttribute('data-mins')) || 15;
      if (typeof window.logStudyTime === 'function') {
        window.logStudyTime(mins);
        if (typeof showNotification === 'function')
          showNotification(`⏱️ Logged ${mins} minutes of study time!`, 'success');
      }
      syncGoalsToBackend();
      renderDashboard();
    });
  });

  // Goal Modal logic
  const modal = document.getElementById('goalModal');
  const openModalBtn = document.getElementById('openGoalModalBtn');
  const closeModalBtn = document.getElementById('closeGoalModalBtn');
  const cancelGoalBtn = document.getElementById('cancelGoalBtn');
  const customGoalForm = document.getElementById('customGoalForm');

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  }
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (cancelGoalBtn && modal) {
    cancelGoalBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (customGoalForm && modal) {
    customGoalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('goalTypeSelect').value;
      const targetVal = Number(document.getElementById('goalTargetInput').value) || 1;
      const up = window.userProgress || {};

      if (type.startsWith('daily')) {
        if (!up.dailyGoals) up.dailyGoals = {};
        if (type === 'dailyProblems') up.dailyGoals.targetProblems = targetVal;
        if (type === 'dailyMinutes') up.dailyGoals.targetMinutes = targetVal;
      } else {
        if (!up.weeklyGoals) up.weeklyGoals = {};
        if (type === 'weeklyProblems') up.weeklyGoals.targetProblems = targetVal;
        if (type === 'weeklyMinutes') up.weeklyGoals.targetMinutes = targetVal;
      }

      if (typeof saveUserData === 'function') saveUserData();
      syncGoalsToBackend();
      renderDashboard();
      modal.classList.add('hidden');
      if (typeof showNotification === 'function')
        showNotification('Custom goal updated successfully!', 'success');
    });
  }
}

function setupTimerControls() {
  const startBtn = document.getElementById('startTimerBtn');
  const pauseBtn = document.getElementById('pauseTimerBtn');
  const stopBtn = document.getElementById('stopTimerBtn');
  const timerDisplay = document.getElementById('timerDisplay');

  if (!startBtn || !pauseBtn || !stopBtn || !timerDisplay) return;

  startBtn.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerDisplay(timerDisplay);
    }, 1000);

    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
  });

  pauseBtn.addEventListener('click', () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  });

  stopBtn.addEventListener('click', () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    const elapsedMinutes = Math.max(1, Math.round(timerSeconds / 60));
    if (typeof window.logStudyTime === 'function') {
      window.logStudyTime(elapsedMinutes);
      if (typeof showNotification === 'function')
        showNotification(`🎉 Logged ${elapsedMinutes} minute study session!`, 'success');
    }
    timerSeconds = 0;
    updateTimerDisplay(timerDisplay);

    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;

    syncGoalsToBackend();
    renderDashboard();
  });
}

function updateTimerDisplay(displayEl) {
  const hrs = Math.floor(timerSeconds / 3600);
  const mins = Math.floor((timerSeconds % 3600) / 60);
  const secs = timerSeconds % 60;
  displayEl.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function syncStreakToBackend() {
  const up = window.userProgress || {};
  try {
    await fetch('/api/streaks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streak: up.streak,
        freezes: up.freezes,
        activityData: up.activityData,
        lastActive: up.lastActive,
      }),
    });
  } catch (e) {
    // Silent catch
  }
}

async function syncGoalsToBackend() {
  const up = window.userProgress || {};
  try {
    await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dailyGoals: up.dailyGoals,
        weeklyGoals: up.weeklyGoals,
      }),
    });
  } catch (e) {
    // Silent catch
  }
}
