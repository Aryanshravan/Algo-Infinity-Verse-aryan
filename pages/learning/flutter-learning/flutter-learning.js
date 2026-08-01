/* ================================================
   FLUTTER LEARNING PAGE -- Interactive Functions
   ================================================
   - Copy-to-clipboard for code blocks
   - Exercise solution toggles
   - Topic pill active tracking (IntersectionObserver)
   - Progress dot updates (auto-saved to localStorage)
   - End-of-page quiz grading
   ================================================ */

(function () {
  'use strict';

  /* --------------------------------------------
     CONSTANTS
     -------------------------------------------- */
  const PROGRESS_KEY = 'flutter_progress';

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
      /* localStorage unavailable -- fail silently */
    }
  }

  /* --------------------------------------------
     COPY-TO-CLIPBOARD FOR CODE BLOCKS
     -------------------------------------------- */

  function handleCopyClick(e) {
    var btn = resolveCopyBtn(e);
    if (!btn) return;
    var code = btn.getAttribute('data-code');

    if (!code) {
      var pre = btn.closest('.fl-code-block').querySelector('pre');
      if (pre) {
        code = pre.textContent || '';
      }
    }

    if (!code) return;

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

  /** Resolve the copy button regardless of how the event was bound. */
  function resolveCopyBtn(e) {
    if (e.currentTarget && e.currentTarget.classList && e.currentTarget.classList.contains('fl-code-copy')) {
      return e.currentTarget;
    }
    return e.target && e.target.closest ? e.target.closest('.fl-code-copy') : null;
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
      /* Copy failed -- silently degrade */
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

  /* --------------------------------------------
     EXERCISE SOLUTION TOGGLES
     -------------------------------------------- */

  function handleExerciseToggle(e) {
    var btn = resolveToggleBtn(e);
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

  /** Resolve the toggle button regardless of how the event was bound. */
  function resolveToggleBtn(e) {
    if (e.currentTarget && e.currentTarget.classList && e.currentTarget.classList.contains('fl-exercise-toggle')) {
      return e.currentTarget;
    }
    return e.target && e.target.closest ? e.target.closest('.fl-exercise-toggle') : null;
  }

  /* --------------------------------------------
     TOPIC NAVIGATION -- ACTIVE PILL TRACKING
     -------------------------------------------- */

  function initTopicNav() {
    var pills = document.querySelectorAll('.fl-topic-pill');
    var lessons = document.querySelectorAll('.fl-lesson');
    if (!pills.length || !lessons.length) return;

    pills.forEach(function (pill) {
      pill.removeEventListener('click', handlePillClick);
      pill.addEventListener('click', handlePillClick);
    });

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
    var pills = document.querySelectorAll('.fl-topic-pill');
    pills.forEach(function (pill, i) {
      pill.classList.toggle('active', String(i) === topicIndex);
    });
  }

  function updateProgressDots(topicIndex) {
    var dots = document.querySelectorAll('.fl-progress-dot');
    var lines = document.querySelectorAll('.fl-progress-line');

    dots.forEach(function (dot, i) {
      dot.classList.remove('active');
      if (String(i) === topicIndex) {
        dot.classList.add('active');
      }
    });

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

  /* --------------------------------------------
     RESTORE PROGRESS ON PAGE LOAD
     -------------------------------------------- */

  function restoreProgress() {
    var progress = getProgress();
    if (!progress.length) return;

    var dots = document.querySelectorAll('.fl-progress-dot');
    var lines = document.querySelectorAll('.fl-progress-line');

    progress.forEach(function (idx) {
      if (dots[idx]) dots[idx].classList.add('completed');
      if (lines[idx]) lines[idx].classList.add('completed');
    });
  }

  /* --------------------------------------------
     QUIZ GRADING
     -------------------------------------------- */

  function initQuiz() {
    var submitBtn = document.getElementById('submitQuizBtn');
    var resetBtn = document.getElementById('resetQuizBtn');
    var scoreBanner = document.getElementById('quizScoreBanner');
    var scoreValue = document.getElementById('quizScoreValue');
    var scorePercent = document.getElementById('quizScorePercent');

    if (!submitBtn) return;

    var correctAnswers = {
      q1: 'b',
      q2: 'c',
      q3: 'b',
      q4: 'c',
      q5: 'a',
    };

    var optionCards = document.querySelectorAll('.fl-quiz-option');
    optionCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var radio = card.querySelector('input[type="radio"]');
        if (!radio || radio.disabled) return;

        radio.checked = true;

        var name = radio.getAttribute('name');
        var siblings = document.querySelectorAll('.fl-quiz-option input[name="' + name + '"]');
        siblings.forEach(function (sib) {
          sib.closest('.fl-quiz-option').classList.remove('selected');
        });

        card.classList.add('selected');
      });
    });

    submitBtn.addEventListener('click', function () {
      var score = 0;
      var keys = Object.keys(correctAnswers);
      var total = keys.length;
      var allAnswered = true;

      keys.forEach(function (key) {
        var selected = document.querySelector('input[name="' + key + '"]:checked');
        if (!selected) allAnswered = false;
      });

      if (!allAnswered) return;

      keys.forEach(function (key) {
        var correctVal = correctAnswers[key];
        var radios = document.querySelectorAll('input[name="' + key + '"]');
        var selectedRadio = document.querySelector('input[name="' + key + '"]:checked');

        radios.forEach(function (r) {
          r.disabled = true;
          var card = r.closest('.fl-quiz-option');
          card.classList.remove('selected');

          if (r.value === correctVal) {
            card.classList.add('correct');
          } else if (r.checked) {
            card.classList.add('incorrect');
          }
        });

        var feedback = document.getElementById('feedback-' + key);
        var explanation = document.getElementById('explanation-' + key);

        if (selectedRadio.value === correctVal) {
          score++;
          if (feedback) {
            feedback.textContent = 'Correct Answer!';
            feedback.className = 'fl-quiz-feedback correct';
          }
        } else {
          if (feedback) {
            feedback.textContent = 'Incorrect Answer.';
            feedback.className = 'fl-quiz-feedback incorrect';
          }
        }

        if (explanation) {
          explanation.classList.add('visible');
        }
      });

      var percent = Math.round((score / total) * 100);
      if (scoreValue) scoreValue.textContent = score + ' / ' + total;
      if (scorePercent) scorePercent.textContent = '(' + percent + '%)';
      if (scoreBanner) scoreBanner.classList.add('visible');

      submitBtn.style.display = 'none';
      if (resetBtn) resetBtn.style.display = 'inline-block';

      if (scoreBanner) {
        scoreBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var radios = document.querySelectorAll('.fl-quiz-option input[type="radio"]');
        radios.forEach(function (r) {
          r.checked = false;
          r.disabled = false;
          var card = r.closest('.fl-quiz-option');
          card.className = 'fl-quiz-option';
        });

        var feedbacks = document.querySelectorAll('.fl-quiz-feedback');
        feedbacks.forEach(function (f) {
          f.textContent = '';
          f.className = 'fl-quiz-feedback';
        });

        var explanations = document.querySelectorAll('.fl-quiz-explanation');
        explanations.forEach(function (e) {
          e.classList.remove('visible');
        });

        if (scoreBanner) scoreBanner.classList.remove('visible');
        if (submitBtn) submitBtn.style.display = 'inline-block';
        resetBtn.style.display = 'none';
      });
    }
  }

  /* --------------------------------------------
     INITIALIZATION
     -------------------------------------------- */

  function init() {
    initTopicNav();
    restoreProgress();
    initQuiz();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* --- Event delegation for dynamically revealed content --- */
  document.addEventListener('click', function (e) {
    var copyBtn = e.target.closest('.fl-code-copy');
    if (copyBtn) {
      handleCopyClick(e);
      return;
    }

    var toggleBtn = e.target.closest('.fl-exercise-toggle');
    if (toggleBtn) {
      handleExerciseToggle(e);
      return;
    }
  });

})();
