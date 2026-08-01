import { initLoadingScreen as _initLoadingScreen } from './loading.js';
// (Animation already started by the inline script in index.html —
//  this import is kept for the export chain; the guard in splash.js
//  makes initLoadingScreen() a no-op when called from here.)

import { initNavbar } from './navbar.js';
import { initHeroSection } from './hero.js';
import { initTopicOfTheDay } from './topics.js';
import { initQuizSection } from './quiz-game.js';

import { initRoadmap } from './roadmap.js';
import { initDashboard } from './dashboard.js';
import { initGamification, initDailyChallenge } from './gamification.js';
import { initChatbot } from './chatbot.js';
import { initProfile } from './profile.js';
import { initScrollEffects } from './back-to-top.js';
import { initAiInterviewer } from './interview.js';
import { initNewsletterValidation } from './newsletter.js';
import { initFlashcardsRevision } from './flashcards.js';
import { initKeyboardShortcuts } from './keyboard-shortcuts.js';
import { initDidYouKnow } from './did-you-know.js';
import { initLanguageDetect } from './language-detect.js';
import { initActivityFeed } from './activity-feed.js';
import { initModalManager } from './modal-manager.js';
import { initProfileEdit } from './profile-edit.js';
import { initServiceWorker } from './service-worker.js';
import { initHashRouter } from './hash-router.js';
import { initEditor } from './editor.js';
import { initMistakeDna } from './mistake-dna.js';
import { initPersonalityQuiz } from './personality-quiz.js';
import { initBookmarkCollections } from './bookmarkUI.js';
import { initRevisionDuePopup } from './revisionDuePopup.js';
import { initStoreModal } from './xpStore.js';
import { initShareProgress } from './shareProgress.js';

function getDefaultUserProgress() {
  return {
    name: 'Learner',
    avatar: { initial: 'L', bg: '#7c3aed' },
    bio: '',
    completedProblems: [],
    completedDailyChallenges: [],
    codingPersonality: {
      type: 'brute-force first',
      bruteForceCount: 1,
      slowAccurateCount: 0,
      greedyCount: 0,
      overOptimizerCount: 0,
    },
    favoriteProblems: [],
    bookmarkCollections: [],
    bookmarkCollectionMeta: {},
    recentProblems: [],
    problemNotes: {},
    spacedRepetition: {},
    reviewStreak: 0,
    xp: 0,
    level: 1,
    streak: 0,
    freezes: 0,
    freezeHistory: [],
    badges: [],
    avatarCustomization: {
      border: 'none',
      theme: 'default',
    },
    completedRoadmapSteps: [],
    lastActive: null,
    quizScores: {},
    dailyGoals: {},
    bestQuizTimes: {},
    activityData: {},
    xpHistory: [],
    quizAttempts: [],
    practiceEvents: [],
    mistakeDna: { offByOneCount: 0, recursionBaseCaseCount: 0, wrongLogicCount: 0, recentLogs: [] },
    revisionSchedule: {
      arrays: { currentStage: 0, nextReviewDate: null, history: [] },
      strings: { currentStage: 0, nextReviewDate: null, history: [] },
      linkedlist: { currentStage: 0, nextReviewDate: null, history: [] },
      trees: { currentStage: 0, nextReviewDate: null, history: [] },
      graphs: { currentStage: 0, nextReviewDate: null, history: [] },
      dp: { currentStage: 0, nextReviewDate: null, history: [] },
    },
    loaded: false,
  };
}

function loadUserData() {
  if (typeof window.loadUserData === 'function') {
    return window.loadUserData();
  }
  window.userProgress = window.userProgress || getDefaultUserProgress();
  const saved = localStorage.getItem('algoInfinityVerse');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data && typeof data === 'object') {
        Object.assign(window.userProgress, data);
      }
    } catch (e) {
      console.error('Error loading progress:', e);
    }
  }
}
function initFooterCurrentDate() {
  const yearEl = document.getElementById('footer-current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  const dateEl = document.getElementById('footer-current-date');
  if (dateEl)
    dateEl.textContent =
      'Today: ' +
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
}
window.initFooterCurrentDate = initFooterCurrentDate;

function initFooterVisibilityObserver() {
  const checkFooter = () => {
    const footer = document.querySelector('.footer');
    if (!footer) return false;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0].isIntersecting;
        document.body.toggleAttribute('data-footer-visible', isVisible);
      },
      { rootMargin: '0px 0px -20px 0px', threshold: 0 }
    );
    observer.observe(footer);
    return true;
  };

  // Footer may load via partial — retry until it's in the DOM
  if (!checkFooter()) {
    const observer = new MutationObserver(() => {
      if (checkFooter()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Safety timeout — stop watching after 10s to avoid leaks
    setTimeout(() => observer.disconnect(), 10000);
  }
}
window.initFooterVisibilityObserver = initFooterVisibilityObserver;

function initDateDisplay() {
  const currentDateEl = document.getElementById('currentDateDisplay');
  const profileDateEl = document.getElementById('profileCurrentDate');
  const resetTimerEl = document.getElementById('resetTimer');

  const now = new Date();
  const shortDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const fullDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (currentDateEl) currentDateEl.textContent = `📅 ${shortDate}`;
  if (profileDateEl) profileDateEl.textContent = fullDate;

  function getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s`;
  }

  if (resetTimerEl) {
    resetTimerEl.textContent = getTimeUntilMidnight();
    setInterval(() => {
      resetTimerEl.textContent = getTimeUntilMidnight();
    }, 1000);
  }
}
window.initDateDisplay = initDateDisplay;

function initializeApp() {
  loadUserData();
  initNavbar();
  initHeroSection();
  initTopicOfTheDay();
  initQuizSection();

  initRoadmap();
  initDashboard();
  initGamification();
  initDailyChallenge();
  initChatbot();
  initProfile();
  initBookmarkCollections();
  initAiInterviewer();
  initNewsletterValidation();
  initScrollEffects();
  initFlashcardsRevision();
  initKeyboardShortcuts();
  initDidYouKnow();
  initFooterCurrentDate();
  initFooterVisibilityObserver();
  initDateDisplay();
  initLanguageDetect();
  initActivityFeed();
  initModalManager();
  initProfileEdit();
  initServiceWorker();
  initHashRouter();
  initEditor();
  initMistakeDna();
  initPersonalityQuiz();
  initRevisionDuePopup();
  initStoreModal();
  initShareProgress();

  // Ensure page is at top after all modules initialize
  if (window.scrollY !== 0) {
    window.scrollTo(0, 0);
  }
}

if (window.partialsLoadedFlag) {
  initializeApp();
} else {
  document.addEventListener('partialsLoaded', initializeApp);
}
