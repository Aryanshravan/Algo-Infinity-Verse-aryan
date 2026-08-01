/* ================================================
   SOLIDITY LEARNING PAGE — Interactive Functions
   ================================================
   - Terminal-style title typing animation
   - Copy-to-clipboard for code blocks
   - Exercise solution toggles
   - Topic pill active tracking (IntersectionObserver)
   - Progress dot updates
   ================================================ */

(function () {
  'use strict';

  /* ───────────────────────────────────────────
     CONSTANTS
     ─────────────────────────────────────────── */
  const PROGRESS_KEY = 'sl_progress';

  /* ───────────────────────────────────────────
     UTILITY FUNCTIONS
     ─────────────────────────────────────────── */

  /** Safely read progress from localStorage. */
  function getProgress() {
    try {
      var stored = localStorage.getItem(PROGRESS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_e) {
      return [];
    }
  }

  /** Safely write progress to localStorage. */
  function setProgress(topics) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(topics));
    } catch (_e) {
      // localStorage unavailable — fail silently
    }
  }

  /* ───────────────────────────────────────────
     COPY-TO-CLIPBOARD FOR CODE BLOCKS
     ─────────────────────────────────────────── */

  function initCopyButtons() {
    document.querySelectorAll('.sl-code-copy').forEach(function (btn) {
      // Remove any previously attached listener
      btn.removeEventListener('click', handleCopyClick);
      btn.addEventListener('click', handleCopyClick);
    });
  }

  function handleCopyClick(e) {
    // Works for both direct listeners (e.currentTarget) and delegation (e.target.closest)
    var btn = e.currentTarget.classList.contains('sl-code-copy') ? e.currentTarget : e.target.closest('.sl-code-copy');
    if (!btn) return;
    var code = btn.getAttribute('data-code');

    if (!code) {
      // Fallback: try to read from the next sibling <pre> block
      var pre = btn.closest('.sl-code-block').querySelector('pre');
      if (pre) {
        code = pre.textContent || '';
      }
    }

    if (!code) return;

    // Use the Clipboard API with a fallback
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(code).then(
        function () {
          showCopiedFeedback(btn);
        },
        function () {
          fallbackCopy(code, btn);
        }
      );
    } else {
      fallbackCopy(code, btn);
    }
  }

  function fallbackCopy(text, btn) {
    try {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showCopiedFeedback(btn);
    } catch (_e) {
      // Copy failed — silently degrade
    }
  }

  function showCopiedFeedback(btn) {
    var originalText = btn.textContent || 'Copy';
    btn.textContent = 'Copied!';
    btn.classList.add('copied');

    setTimeout(function () {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }

  /* ───────────────────────────────────────────
     EXERCISE SOLUTION TOGGLES
     ─────────────────────────────────────────── */

  function initExerciseToggles() {
    document.querySelectorAll('.sl-exercise-toggle').forEach(function (btn) {
      // Remove old listener to avoid duplicates
      btn.removeEventListener('click', handleExerciseToggle);
      btn.addEventListener('click', handleExerciseToggle);
    });
  }

  function handleExerciseToggle(e) {
    // Works for both direct listeners (e.currentTarget) and delegation (e.target.closest)
    var btn = e.currentTarget.classList.contains('sl-exercise-toggle') ? e.currentTarget : e.target.closest('.sl-exercise-toggle');
    if (!btn) return;
    var solutionId = btn.getAttribute('aria-controls');
    if (!solutionId) return;

    var solution = document.getElementById(solutionId);
    if (!solution) return;

    var isOpen = solution.classList.contains('open');
    if (isOpen) {
      solution.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Show Solution';
    } else {
      solution.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.textContent = 'Hide Solution';
    }
  }

  /* ───────────────────────────────────────────
     TOPIC NAVIGATION — ACTIVE PILL TRACKING
     ─────────────────────────────────────────── */

  function initTopicNav() {
    var pills = document.querySelectorAll('.sl-topic-pill');
    var lessons = document.querySelectorAll('.sl-lesson');
    if (!pills.length || !lessons.length) return;

    // Click handler for pills
    pills.forEach(function (pill) {
      pill.removeEventListener('click', handlePillClick);
      pill.addEventListener('click', handlePillClick);
    });

    // IntersectionObserver for auto-highlight
    if (typeof IntersectionObserver === 'undefined') return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var topicIndex = entry.target.getAttribute('data-topic');
            updateActivePill(topicIndex);
            updateProgressDots(topicIndex);
            markTopicCompleted(topicIndex);
          }
        });
      },
      {
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0,
      }
    );

    lessons.forEach(function (lesson) {
      observer.observe(lesson);
    });
  }

  function handlePillClick(e) {
    e.preventDefault();
    var pill = e.currentTarget;
    var href = pill.getAttribute('href');
    if (!href) return;

    var targetId = href.replace('#', '');
    var target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function updateActivePill(topicIndex) {
    var pills = document.querySelectorAll('.sl-topic-pill');
    pills.forEach(function (pill, i) {
      pill.classList.toggle('active', String(i) === topicIndex);
    });
  }

  function updateProgressDots(topicIndex) {
    var dots = document.querySelectorAll('.sl-progress-dot');
    var lines = document.querySelectorAll('.sl-progress-line');

    dots.forEach(function (dot, i) {
      dot.classList.remove('active');
      if (String(i) === topicIndex) {
        dot.classList.add('active');
      }
    });

    // Mark previous dots + lines as completed
    var idx = parseInt(topicIndex, 10);
    if (!isNaN(idx)) {
      dots.forEach(function (dot, i) {
        if (i < idx) dot.classList.add('completed');
      });
      lines.forEach(function (line, i) {
        if (i < idx) line.classList.add('completed');
      });
    }
  }

  function markTopicCompleted(topicIndex) {
    var progress = getProgress();
    var idx = parseInt(topicIndex, 10);
    if (isNaN(idx)) return;

    if (progress.indexOf(idx) === -1) {
      progress.push(idx);
      setProgress(progress);
    }
  }

  /* ───────────────────────────────────────────
     RESTORE PROGRESS ON PAGE LOAD
     ─────────────────────────────────────────── */

  function restoreProgress() {
    var progress = getProgress();
    if (!progress.length) return;

    var dots = document.querySelectorAll('.sl-progress-dot');
    var lines = document.querySelectorAll('.sl-progress-line');

    progress.forEach(function (idx) {
      if (dots[idx]) dots[idx].classList.add('completed');
      if (lines[idx]) lines[idx].classList.add('completed');
    });
  }

  /* ───────────────────────────────────────────
     INITIALIZATION
     ─────────────────────────────────────────── */

  function init() {
    initTopicNav();
    restoreProgress();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Event delegation: handle copy + toggle clicks at the document level ──
  // This handles dynamically revealed solution content without a MutationObserver.
  document.addEventListener('click', function (e) {
    var copyBtn = e.target.closest('.sl-code-copy');
    if (copyBtn) {
      handleCopyClick(e);
      return;
    }

    var toggleBtn = e.target.closest('.sl-exercise-toggle');
    if (toggleBtn) {
      handleExerciseToggle(e);
      return;
    }
  });

})();
