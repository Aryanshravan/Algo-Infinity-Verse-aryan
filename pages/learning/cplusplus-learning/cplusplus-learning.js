/* ================================================
   C++ LEARNING PAGE -- Interactive Functions
   ================================================
   - Copy-to-clipboard for code blocks
   - Exercise solution toggles
   - Topic pill active tracking (IntersectionObserver)
   - Progress dot updates
   - Hero typing animation
   ================================================ */

(function () {
  'use strict';

  /* --------------------------------------------
     CONSTANTS
     -------------------------------------------- */
  const PROGRESS_KEY = 'cpp_progress';

  /* --------------------------------------------
     UTILITY FUNCTIONS
     -------------------------------------------- */

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
      /* localStorage may be full or unavailable */
    }
  }

  /* --------------------------------------------
     INIT
     -------------------------------------------- */

  function init() {
    initCopyButtons();
    initExerciseToggles();
    initTopicPills();
    initProgressDots();
  }

  /* --------------------------------------------
     COPY-TO-CLIPBOARD
     -------------------------------------------- */

  function initCopyButtons() {
    var buttons = document.querySelectorAll('.cpp-code-copy');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var code = btn.getAttribute('data-code');
        if (!code) return;

        copyText(code).then(function (ok) {
          if (ok) {
            var originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.classList.add('copied');
            setTimeout(function () {
              btn.innerHTML = originalHTML;
              btn.classList.remove('copied');
            }, 2000);
          } else {
            fallbackCopy(code, btn);
          }
        });
      });
    });
  }

  /** Attempt modern clipboard API; returns true on success. */
  function copyText(text) {
    if (!navigator.clipboard) return Promise.resolve(false);
    return navigator.clipboard.writeText(text).then(function () {
      return true;
    }).catch(function () {
      return false;
    });
  }

  /** Fallback using textarea + execCommand. */
  function fallbackCopy(text, btn) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.pointerEvents = 'none';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      }
    } catch (_e) {
      /* ignore */
    }
  }

  /* --------------------------------------------
     EXERCISE TOGGLES
     -------------------------------------------- */

  function initExerciseToggles() {
    var toggles = document.querySelectorAll('.cpp-exercise-toggle');
    if (!toggles.length) return;

    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('aria-controls');
        if (!targetId) return;
        var solution = document.getElementById(targetId);
        if (!solution) return;

        var isVisible = solution.classList.toggle('visible');
        btn.setAttribute('aria-expanded', isVisible);
        btn.textContent = isVisible ? 'Hide Solution' : 'Show Solution';
      });
    });
  }

  /* --------------------------------------------
     TOPIC PILL ACTIVE TRACKING
     -------------------------------------------- */

  function initTopicPills() {
    var pills = document.querySelectorAll('.cpp-topic-pill');
    var lessons = document.querySelectorAll('.cpp-lesson[data-topic]');
    if (!pills.length || !lessons.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var topic = entry.target.getAttribute('data-topic');
            if (topic !== null) {
              setActivePill(topic);
            }
          }
        });
      },
      {
        rootMargin: '0px 0px -40% 0px',
        threshold: 0.1,
      }
    );

    lessons.forEach(function (lesson) {
      observer.observe(lesson);
    });

    // Set initial active pill on load
    setTimeout(function () {
      var firstVisible = getFirstVisibleLesson();
      if (firstVisible !== null) {
        setActivePill(firstVisible);
      }
    }, 100);
  }

  /** Find the first lesson that is on-screen. */
  function getFirstVisibleLesson() {
    var lessons = document.querySelectorAll('.cpp-lesson[data-topic]');
    var min = Infinity;
    var best = null;
    lessons.forEach(function (lesson) {
      var rect = lesson.getBoundingClientRect();
      var dist = Math.abs(rect.top - 100);
      if (dist < min) {
        min = dist;
        best = lesson.getAttribute('data-topic');
      }
    });
    return best;
  }

  /** Update pill active state. */
  function setActivePill(topic) {
    var pills = document.querySelectorAll('.cpp-topic-pill');
    pills.forEach(function (pill, index) {
      if (String(index) === String(topic)) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  /* Progress tracking is handled by initProgressDots() separately. */

  /* --------------------------------------------
     PROGRESS DOTS
     -------------------------------------------- */

  function initProgressDots() {
    var dots = document.querySelectorAll('.cpp-progress-dot');
    var lessons = document.querySelectorAll('.cpp-lesson[data-topic]');
    if (!dots.length || !lessons.length) return;

    // Restore saved progress
    var saved = getProgress();

    dots.forEach(function (dot, index) {
      if (saved.indexOf(index) !== -1) {
        dot.classList.add('active');
      }
    });

    // Also activate progress lines
    updateProgressLines();

    // Track lesson visibility to update progress
    var progressObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var topic = entry.target.getAttribute('data-topic');
            if (topic !== null) {
              var idx = parseInt(topic, 10);
              var saved = getProgress();
              if (saved.indexOf(idx) === -1) {
                saved.push(idx);
                setProgress(saved);
                // Update dot
                if (dots[idx]) {
                  dots[idx].classList.add('active');
                }
                updateProgressLines();
              }
            }
          }
        });
      },
      {
        rootMargin: '0px 0px -40% 0px',
        threshold: 0.1,
      }
    );

    lessons.forEach(function (lesson) {
      progressObserver.observe(lesson);
    });
  }

  /** Sync progress line active states based on dots. */
  function updateProgressLines() {
    var lines = document.querySelectorAll('.cpp-progress-line');
    var dots = document.querySelectorAll('.cpp-progress-dot');
    lines.forEach(function (line, index) {
      // Line i is active if dot i is active
      if (dots[index] && dots[index].classList.contains('active')) {
        line.classList.add('active');
      } else {
        line.classList.remove('active');
      }
    });
  }

  /* --------------------------------------------
     START
     -------------------------------------------- */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
