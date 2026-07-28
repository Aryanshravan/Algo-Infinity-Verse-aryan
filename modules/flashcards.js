/* global quizQuestions */
import { playFlipSound, toggleSound, isSoundEnabled } from './audio.js';

// CATEGORY_LABELS reserved for future i18n use
// const CATEGORY_LABELS = { arrays:'Arrays', strings:'Strings', linkedlist:'Linked List', trees:'Trees', graphs:'Graphs', dp:'Dynamic Programming' };

let currentCategory = 'arrays';
let currentCardIndex = 0;
let flashcards = [];
let revealedCards = new Set();
let isCardFlipped = false;

/* ── Helpers ── */

function updateProgressBar() {
  const fill = document.getElementById('fpProgressFill');
  if (!fill) return;
  const pct = flashcards.length > 0 ? (revealedCards.size / flashcards.length) * 100 : 0;
  fill.style.width = `${Math.min(pct, 100)}%`;
}

function updateShellCategory(category) {
  const shell = document.getElementById('fpFlashcardShell');
  if (shell) shell.dataset.currentCategory = category;
}

function updateHeroStats() {
  const statCards = document.getElementById('fpStatCards');
  if (statCards) statCards.textContent = revealedCards.size;
}

function populateTopicCounts() {
  const countEls = document.querySelectorAll('[data-topic-count]');
  if (!countEls.length) return;
  const qs = window.quizQuestions || quizQuestions || {};
  countEls.forEach((el) => {
    const cat = el.dataset.topicCount;
    const questions = qs[cat];
    const count = questions && Array.isArray(questions) ? questions.length : 0;
    el.textContent = `${count} questions`;
  });
}

/* ── Core Logic ── */

function buildFlashcards(category) {
  const source = (window.quizQuestions || quizQuestions);
  const questions = source ? source[category] : null;
  if (!questions || questions.length === 0) {
    flashcards = [];
    return;
  }
  flashcards = questions.map((q, idx) => ({
    id: `${category}-${idx}`,
    question: q.question,
    answer: q.options[q.correct] + (q.explanation ? ' — ' + q.explanation : ''),
    options: q.options,
    correctIndex: q.correct,
    explanation: q.explanation || ''
  }));
}

function getQuestionTextEl() {
  const el = document.getElementById('flashcardQuestion');
  return el ? el.querySelector('.fp-flashcard-question-text') : null;
}

function renderFlashcard() {
  const questionEl = document.getElementById('flashcardQuestion');
  const answerEl = document.getElementById('flashcardAnswer');
  const revealBtn = document.getElementById('flashcardsRevealBtn');
  const prevBtn = document.getElementById('flashcardsPrevBtn');
  const nextBtn = document.getElementById('flashcardsNextBtn');
  const progressText = document.getElementById('flashcardsProgressText');
  const totalText = document.getElementById('flashcardsTotalText');
  const hintEl = document.getElementById('flashcardsSmallHint');

  if (!questionEl) return;

  const flashcard = document.querySelector('.fp-flashcard');
  if (flashcard) flashcard.classList.remove('is-revealed');

  if (flashcards.length === 0) {
    const textEl = getQuestionTextEl();
    if (textEl) textEl.textContent = 'No flashcards available for this category.';
    answerEl.textContent = '';
    if (hintEl) hintEl.textContent = '';
    if (progressText) progressText.textContent = 'Reviewed 0 / 0';
    if (totalText) totalText.textContent = '';
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (revealBtn) { revealBtn.disabled = true; revealBtn.style.display = ''; }
    updateProgressBar();
    updateHeroStats();
    return;
  }

  isCardFlipped = false;
  const card = flashcards[currentCardIndex];

  const textEl = getQuestionTextEl();
  if (textEl) textEl.textContent = card.question;
  answerEl.textContent = '';

  if (revealBtn) {
    revealBtn.disabled = false;
    revealBtn.style.display = '';
    revealBtn.innerHTML = '<i class="fas fa-eye"></i> Reveal Options';
  }

  if (totalText) totalText.textContent = `Card ${currentCardIndex + 1} of ${flashcards.length}`;
  if (progressText) progressText.textContent = `Reviewed ${revealedCards.size} / ${flashcards.length}`;
  if (hintEl) hintEl.textContent = revealedCards.has(currentCardIndex) ? '✓ Already reviewed' : '';

  if (prevBtn) prevBtn.disabled = currentCardIndex <= 0;
  if (nextBtn) nextBtn.disabled = currentCardIndex >= flashcards.length - 1;

  updateProgressBar();
  updateHeroStats();
}

function revealAnswer() {
  if (isCardFlipped) return;
  playFlipSound();

  const answerEl = document.getElementById('flashcardAnswer');
  const revealBtn = document.getElementById('flashcardsRevealBtn');
  const hintEl = document.getElementById('flashcardsSmallHint');

  if (!answerEl || !revealBtn) return;

  const card = flashcards[currentCardIndex];
  if (!card) return;

  revealedCards.add(currentCardIndex);

  const optionsHtml = card.options.map((opt, i) =>
    `<div class="fp-option" data-option-index="${i}">
      <span class="fp-option-indicator">${String.fromCharCode(65 + i)}</span>${opt}
    </div>`
  ).join('');
  answerEl.innerHTML = `<div class="fp-options">${optionsHtml}</div>`;

  revealBtn.style.display = 'none';
  if (hintEl) hintEl.textContent = '';
  isCardFlipped = true;

  const flashcard = document.querySelector('.fp-flashcard');
  if (flashcard) flashcard.classList.add('is-revealed');

  const progressText = document.getElementById('flashcardsProgressText');
  if (progressText) progressText.textContent = `Reviewed ${revealedCards.size} / ${flashcards.length}`;

  updateProgressBar();
  updateHeroStats();
  updateFlashcardProgress();
}

function handleOptionClick(e) {
  const optionEl = e.target.closest('.fp-option');
  if (!optionEl) return;
  if (optionEl.classList.contains('correct') || optionEl.classList.contains('incorrect')) return;

  const card = flashcards[currentCardIndex];
  if (!card) return;
  const answerEl = document.getElementById('flashcardAnswer');

  const selectedIndex = parseInt(optionEl.dataset.optionIndex, 10);
  const isCorrect = selectedIndex === card.correctIndex;

  if (isCorrect) {
    optionEl.classList.add('correct');
  } else {
    optionEl.classList.add('incorrect');
    document.querySelectorAll('.fp-option').forEach((el) => {
      if (parseInt(el.dataset.optionIndex, 10) === card.correctIndex) {
        el.classList.add('correct');
      }
    });
  }

  const explanationHtml = card.explanation
    ? `<div class="fp-explanation"><strong>Explanation:</strong> ${card.explanation}</div>`
    : '';
  answerEl.insertAdjacentHTML('beforeend', explanationHtml);
}

function navigateFlashcard(direction) {
  const newIndex = currentCardIndex + direction;
  if (newIndex < 0 || newIndex >= flashcards.length) return;
  playFlipSound();

  const inner = document.querySelector('.fp-flashcard-inner');
  if (!inner) {
    currentCardIndex = newIndex;
    renderFlashcard();
    return;
  }

  const rotation = direction > 0 ? '-180deg' : '180deg';
  const reverseRotation = direction > 0 ? '180deg' : '-180deg';

  inner.style.transition = 'transform 0.25s ease';
  inner.style.transform = `rotateY(${rotation})`;

  setTimeout(() => {
    currentCardIndex = newIndex;
    renderFlashcard();

    inner.style.transition = 'none';
    inner.style.transform = `rotateY(${reverseRotation})`;

    requestAnimationFrame(() => {
      inner.style.transition = 'transform 0.25s ease';
      inner.style.transform = 'rotateY(0deg)';

      setTimeout(() => {
        inner.style.transition = '';
        inner.style.transform = '';
      }, 300);
    });
  }, 280);
}

function switchFlashcardCategory(category) {
  currentCategory = category;
  currentCardIndex = 0;
  buildFlashcards(category);
  updateShellCategory(category);
  renderFlashcard();
}

function updateFlashcardProgress() {
  if (!userProgress) return;
  if (!userProgress.flashcardProgress) userProgress.flashcardProgress = {};
  const key = currentCategory;
  userProgress.flashcardProgress[key] = {
    lastReviewed: new Date().toISOString(),
    reviewedCount: revealedCards.size,
    totalCount: flashcards.length
  };
  if (typeof saveUserData === 'function') saveUserData();
}

function getStreak() {
  try {
    const stored = localStorage.getItem('fpStreak');
    return stored ? parseInt(stored, 10) : 0;
  } catch (e) {
    return 0;
  }
}

function updateStreak() {
  const statStreak = document.getElementById('fpStatStreak');
  if (!statStreak) return;
  const streak = getStreak();
  statStreak.textContent = streak;
  // Persist a simple daily streak
  const today = new Date().toDateString();
  try {
    const lastVisit = localStorage.getItem('fpLastVisit');
    if (lastVisit !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = lastVisit === yesterday ? streak + 1 : 1;
      localStorage.setItem('fpStreak', String(newStreak));
      localStorage.setItem('fpLastVisit', today);
      statStreak.textContent = newStreak;
    }
  } catch (e) { /* localStorage may be unavailable */ }
}/* ── Exported Init ── */

let _keyHandler = null;

export function initFlashcardsRevision() {
  const root = document.getElementById('flashcardRoot');
  if (!root) return;

  populateTopicCounts();
  updateStreak();

  revealedCards.clear();
  isCardFlipped = false;

  buildFlashcards(currentCategory);
  updateShellCategory(currentCategory);
  renderFlashcard();

  const revealBtn = document.getElementById('flashcardsRevealBtn');
  const prevBtn = document.getElementById('flashcardsPrevBtn');
  const nextBtn = document.getElementById('flashcardsNextBtn');
  const filterBtns = document.querySelectorAll('.fp-topic-card[data-category]');

  if (revealBtn) revealBtn.addEventListener('click', revealAnswer);
  if (prevBtn) prevBtn.addEventListener('click', () => navigateFlashcard(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateFlashcard(1));

  const answerEl = document.getElementById('flashcardAnswer');
  if (answerEl) answerEl.addEventListener('click', handleOptionClick);

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      switchFlashcardCategory(btn.dataset.category);
    });
  });

  const soundToggle = document.getElementById('flashcardsSoundToggle');
  if (soundToggle) {
    const updateSoundIcon = () => {
      const enabled = isSoundEnabled();
      soundToggle.innerHTML = enabled
        ? '<i class="fas fa-volume-up"></i>'
        : '<i class="fas fa-volume-mute"></i>';
      soundToggle.classList.toggle('muted', !enabled);
    };
    updateSoundIcon();
    soundToggle.addEventListener('click', () => {
      toggleSound();
      updateSoundIcon();
      if (typeof window.showNotification === 'function') {
        window.showNotification(isSoundEnabled() ? 'Sound on' : 'Sound off', 'info');
      }
    });
  }

  // Remove any previous keyboard listener to prevent duplicate accumulation
  if (_keyHandler) {
    document.removeEventListener('keydown', _keyHandler);
  }
  _keyHandler = (e) => {
    // Don't intercept when focus is inside an input/textarea/button
    if (e.target.closest('input, textarea, button, [contenteditable]')) return;
    if (e.key === 'ArrowLeft') navigateFlashcard(-1);
    if (e.key === 'ArrowRight') navigateFlashcard(1);
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); revealAnswer(); }
  };
  document.addEventListener('keydown', _keyHandler);
}
// Auto-initialize when DOM is ready (module is deferred, runs after parsing completes)
(function autoInit() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('flashcardRoot')) initFlashcardsRevision();
    });
  } else {
    if (document.getElementById('flashcardRoot')) initFlashcardsRevision();
  }
})();

// Legacy global exports for non-module callers
window.initFlashcardsRevision = initFlashcardsRevision;
