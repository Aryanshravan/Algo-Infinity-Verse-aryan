/**
 * javascript-learning.js
 * Interactivity for the redesigned JavaScript Learning page:
 *  - Copy-to-clipboard for code blocks
 *  - Exercise solution toggles
 *  - Topic pill active tracking (IntersectionObserver)
 *  - Progress bar tracking with localStorage persistence
 */

(function () {
  'use strict';

  /* --------------------------------------------
     CONSTANTS
     -------------------------------------------- */
  const PROGRESS_KEY = 'jl_progress';
  const TOTAL_TOPICS = 12;

  /* --------------------------------------------
     UTILITY: safe querySelector helper
     -------------------------------------------- */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }

  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* --------------------------------------------
     CODE COPY BUTTONS
     -------------------------------------------- */
  function initCopyButtons() {
    qsa('.jl-code-copy').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var code = btn.getAttribute('data-code');
        if (!code) return;

        try {
          await navigator.clipboard.writeText(code);
          setCopied(btn);
        } catch (_err) {
          // Fallback for older browsers
          var ta = document.createElement('textarea');
          ta.value = code;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (_e2) { /* ignore */ }
          document.body.removeChild(ta);
          setCopied(btn);
        }
      });
    });
  }

  function setCopied(btn) {
    var original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.innerHTML = original;
      btn.classList.remove('copied');
    }, 2000);
  }

  /* --------------------------------------------
     EXERCISE SOLUTION TOGGLES
     -------------------------------------------- */
  function initExerciseToggles() {
    qsa('.jl-exercise-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('aria-controls');
        var solution = document.getElementById(targetId);
        if (!solution) return;

        var isVisible = solution.classList.toggle('open');
        btn.setAttribute('aria-expanded', isVisible);
        btn.textContent = isVisible ? 'Hide Solution' : 'Show Solution';
      });
    });
  }

  /* --------------------------------------------
     TOPIC PILL ACTIVE TRACKING
     Uses IntersectionObserver to highlight the
     pill corresponding to the lesson closest to
     the top of the viewport.
     -------------------------------------------- */
  function initTopicPills() {
    var pills = qsa('.jl-topic-pill');
    var lessons = qsa('.jl-lesson');
    if (!pills.length || !lessons.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = [];
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            visible.push({
              id: entry.target.getAttribute('id'),
              ratio: entry.intersectionRatio,
              top: entry.boundingClientRect.top
            });
          }
        });

        if (!visible.length) return;

        // Pick the lesson closest to the top of the viewport
        visible.sort(function (a, b) {
          var aDist = Math.abs(a.top);
          var bDist = Math.abs(b.top);
          if (Math.abs(aDist - bDist) < 50) {
            return b.ratio - a.ratio;
          }
          return aDist - bDist;
        });

        var activeId = visible[0].id;
        pills.forEach(function (pill) {
          var href = pill.getAttribute('href');
          if (href === '#' + activeId) {
            pill.classList.add('active');
          } else {
            pill.classList.remove('active');
          }
        });
      },
      {
        threshold: [0, 0.15, 0.3],
        rootMargin: '-80px 0px -30% 0px'
      }
    );

    lessons.forEach(function (lesson) { observer.observe(lesson); });
  }

  /* --------------------------------------------
     PROGRESS TRACKER
     Marks topics as completed when scrolled past.
     Persists to localStorage.
     -------------------------------------------- */
  function initProgressTracker() {
    var fill = document.getElementById('progressFill');
    var count = document.getElementById('progressCount');
    if (!fill || !count) return;

    // Load saved progress
    var completed = new Set();
    try {
      var saved = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      if (Array.isArray(saved)) completed = new Set(saved);
    } catch (_e) { /* ignore */ }

    function updateUI() {
      var pct = Math.round((completed.size / TOTAL_TOPICS) * 100);
      fill.style.width = pct + '%';
      count.textContent = completed.size;

      var progressEl = document.getElementById('jlProgress');
      if (progressEl) progressEl.setAttribute('aria-valuenow', pct);
    }

    updateUI();

    // Observe lessons entering viewport
    var lessons = qsa('.jl-lesson');
    var observer = new IntersectionObserver(
      function (entries) {
        var changed = false;
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var topic = entry.target.getAttribute('data-topic');
            if (topic !== null && !completed.has(topic)) {
              completed.add(topic);
              changed = true;
            }
          }
        });
        if (changed) {
          try {
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(completed)));
          } catch (_e) { /* ignore */ }
          updateUI();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -20% 0px' }
    );

    lessons.forEach(function (l) { observer.observe(l); });
  }

  /* --------------------------------------------
     INITIALIZATION
     -------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initCopyButtons();
    initExerciseToggles();
    initTopicPills();
    initProgressTracker();
  });

})();
