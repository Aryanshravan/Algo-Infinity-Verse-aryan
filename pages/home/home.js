/* ============================================================
   Algo Infinity Verse — Homepage JS
   Scroll reveals, live stats, progress, facts rotation
   ============================================================ */

(function () {
  'use strict';

  const HP = {
    /* ── Configuration ── */
    config: {
      revealThreshold: 0.12,
      staggerDelay: 100,
      factInterval: 6000,
      statRefreshInterval: 30000,
    },

    /* ── Stats state ── */
    stats: {
      problemsSolved: 0,
      activeLearners: 0,
      xpEarned: 0,
    },

    /* ── Initialization ── */
    init() {
      this.initScrollReveal();
      this.initAnimatedCounters();
      this.initFacts();
      this.initProgress();
      this.initTopicTooltips();
      this.initStatsPolling();
      this.initWelcomeGreeting();
      this.addReducedMotionSupport();
    },

    /* ── Scroll-Triggered Reveals ── */
    initScrollReveal() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const targets = document.querySelectorAll('.hp-reveal');
      if (!targets.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const delay =
                parseInt(entry.target.getAttribute('data-reveal-delay')) || 0;
              setTimeout(() => {
                entry.target.classList.add('visible');
              }, delay);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: HP.config.revealThreshold,
          rootMargin: '0px 0px -60px 0px',
        }
      );

      targets.forEach((el) => observer.observe(el));
    },

    /* ── Animated Counters ── */
    initAnimatedCounters() {
      const counters = document.querySelectorAll('[data-hp-count]');
      counters.forEach((el) => {
        const target = parseInt(el.getAttribute('data-hp-count')) || 0;
        const duration = parseInt(el.getAttribute('data-hp-duration')) || 2000;
        HP.animateCounter(el, target, duration);
      });
    },

    animateCounter(el, target, duration) {
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        if (target >= 1000) {
          el.textContent = HP.formatNumber(current);
        } else {
          el.textContent = current;
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent =
            target >= 1000 ? HP.formatNumber(target) : target;
        }
      }

      requestAnimationFrame(update);
    },

    formatNumber(n) {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    },

    /* ── Facts Rotation ── */
    initFacts() {
      const factText = document.getElementById('hpFactText');
      const factCounter = document.getElementById('hpFactCounter');
      const factBtn = document.getElementById('hpFactNext');

      // Use the global facts array from data/facts.js, with fallback
      const facts = (window.facts && window.facts.length > 0)
        ? window.facts
        : [
            'The term "algorithm" comes from the name of Persian mathematician Al-Khwarizmi, who lived in the 9th century.',
            'Dijkstra originally designed his shortest-path algorithm to demonstrate the power of the ARMAC computer in just 20 minutes.',
            'The first computer bug was a literal moth found trapped in a relay of the Harvard Mark II computer in 1947.',
            'There are more possible iterations of a game of chess (10^120) than atoms in the observable universe.',
            'The concept of a "hash table" was invented by Hans Peter Luhn in 1953 while working at IBM.',
            'Bubble Sort is one of the oldest sorting algorithms, dating back to 1956.',
            'The Travelling Salesman Problem was first formulated in 1930 and remains unsolved for the general case.',
            'JavaScript was created in just 10 days by Brendan Eich in May 1995.',
            'The first algorithm designed specifically for a computer was Ada Lovelace\'s algorithm for the Analytical Engine in 1843.',
            'QuickSort was developed by Tony Hoare in 1959 and is still one of the most widely used sorting algorithms.',
          ];

      if (!factText) return;

      let currentIndex = Math.floor(Math.random() * facts.length);

      const showFact = (index) => {
        factText.style.opacity = '0';
        setTimeout(() => {
          factText.textContent = facts[index];
          factText.style.opacity = '1';
          if (factCounter) factCounter.textContent = `#${index + 1}`;
        }, 200);
      };

      showFact(currentIndex);

      // Auto-rotate
      let factInterval = setInterval(nextFact, HP.config.factInterval);

      function nextFact() {
        currentIndex = (currentIndex + 1) % facts.length;
        showFact(currentIndex);
        // Reset auto-rotate interval on manual click
        clearInterval(factInterval);
        factInterval = setInterval(nextFact, HP.config.factInterval);
      }

      if (factBtn) {
        factBtn.addEventListener('click', nextFact);
      }
    },

    /* ── Progress / XP Simulation with auth-aware state ── */
    initProgress() {
      const progressStrip = document.querySelector('.hp-progress');
      if (!progressStrip) return;

      // Check auth state via localStorage (reliable before partials load)
      const isLoggedIn = !!(localStorage.getItem('sb-user') || localStorage.getItem('supabase.auth.token'));

      if (!isLoggedIn) {
        // Show preview for logged-out users
        progressStrip.innerHTML = `
          <div class="hp-progress-inner" style="justify-content: center;">
            <a href="/signup" class="hp-btn hp-btn-secondary" style="padding: 10px 24px;">
              <i class="fas fa-user-plus"></i>
              Sign in to track your progress
            </a>
            <span style="font-family: 'Inter', sans-serif; font-size: 0.85rem; color: var(--hp-text-tertiary);">
              Keep your streaks, earn XP, unlock badges
            </span>
          </div>
        `;
        return;
      }

      // Logged-in user: trigger XP bar animation
      const xpFill = document.querySelector('.hp-xp-fill');
      if (!xpFill) return;

      const stored = localStorage.getItem('hp_xp_progress');
      const progress = stored ? Math.min(parseInt(stored), 100) : 42;

      setTimeout(() => {
        xpFill.style.width = progress + '%';
      }, 500);

      // Update XP text
      const xpText = document.querySelector('.hp-xp-text');
      if (xpText) {
        const currentXp = Math.round((progress / 100) * 1000);
        xpText.textContent = `${currentXp} / 1000 XP`;
      }
    },

    /* ── Topic Card Hover Preview ── */
    initTopicTooltips() {
      const cards = document.querySelectorAll('.hp-topic-card');
      const tooltip = document.getElementById('hpTopicTooltip');
      if (!cards.length || !tooltip) return;

      const problems = Array.isArray(window.practiceProblems)
        ? window.practiceProblems
        : [];
      const breakdownCache = new Map();

      // Skip hover-preview triggers on coarse-pointer (touch) devices: taps
      // focus the card and navigate away, so the tooltip would only flash.
      const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

      const getBreakdown = (category) => {
        if (breakdownCache.has(category)) return breakdownCache.get(category);

        const list =
          category === 'all'
            ? problems
            : problems.filter((problem) => problem.category === category);

        const breakdown = { easy: 0, medium: 0, hard: 0 };
        list.forEach((problem) => {
          const difficulty = String(problem.difficulty || '').toLowerCase();
          if (difficulty === 'easy') breakdown.easy += 1;
          else if (difficulty === 'medium') breakdown.medium += 1;
          else if (difficulty === 'hard') breakdown.hard += 1;
        });
        breakdown.total = list.length;

        breakdownCache.set(category, breakdown);
        return breakdown;
      };

      const renderTooltip = (card, breakdown) => {
        tooltip.textContent = '';

        const header = document.createElement('div');
        header.className = 'hp-topic-tooltip-header';

        const cardName = card.querySelector('.hp-topic-name');
        const name = document.createElement('span');
        name.className = 'hp-topic-tooltip-name';
        name.textContent = cardName ? cardName.textContent : '';
        header.appendChild(name);

        const total = document.createElement('span');
        total.className = 'hp-topic-tooltip-total';
        total.textContent = `${breakdown.total} problems`;
        header.appendChild(total);

        tooltip.appendChild(header);

        const breakdownList = document.createElement('div');
        breakdownList.className = 'hp-topic-tooltip-breakdown';
        const difficulties = [
          { key: 'easy', label: 'Easy' },
          { key: 'medium', label: 'Medium' },
          { key: 'hard', label: 'Hard' },
        ];
        difficulties.forEach(({ key, label }) => {
          const row = document.createElement('div');
          row.className = `hp-topic-tooltip-row ${key}`;

          const dot = document.createElement('span');
          dot.className = 'hp-topic-tooltip-dot';
          dot.setAttribute('aria-hidden', 'true');

          const text = document.createElement('span');
          text.textContent = `${label} ${breakdown[key]}`;

          row.appendChild(dot);
          row.appendChild(text);
          breakdownList.appendChild(row);
        });
        tooltip.appendChild(breakdownList);
      };

      const positionTooltip = (card) => {
        const gap = 10;
        const cardRect = card.getBoundingClientRect();

        // Constrain the tooltip to the hovered card's own bounds so it never
        // overlaps neighbouring cards, labels, or the section header.
        // min-width must be cleared too: it outranks max-width in CSS.
        const maxWidth = cardRect.width - gap * 2;
        tooltip.style.maxWidth = `${maxWidth}px`;
        tooltip.style.minWidth = '0';

        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        let left = cardRect.left + (cardRect.width - tooltipWidth) / 2;
        left = Math.max(cardRect.left + gap, Math.min(left, cardRect.right - tooltipWidth - gap));
        left = Math.max(gap, Math.min(left, window.innerWidth - tooltipWidth - gap));

        let top = cardRect.bottom - tooltipHeight - gap;
        top = Math.max(cardRect.top + gap, Math.min(top, cardRect.bottom - tooltipHeight - gap));
        top = Math.max(gap, Math.min(top, window.innerHeight - tooltipHeight - gap));

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;

        // Only render the preview if it genuinely fits inside the card.
        // Otherwise it would spill over neighbouring cards and labels.
        return tooltipHeight <= cardRect.height - gap * 2;
      };

      let describedCard = null;

      const showTooltip = (card) => {
        const category = card.getAttribute('data-topic-category');
        if (!category) return;

        const breakdown = getBreakdown(category);
        if (breakdown.total === 0) return;

        renderTooltip(card, breakdown);
        if (!positionTooltip(card)) {
          hideTooltip();
          return;
        }
        tooltip.classList.add('visible');
        tooltip.setAttribute('aria-hidden', 'false');
        describedCard = card;
        describedCard.setAttribute('aria-describedby', tooltip.id);
      };

      const hideTooltip = () => {
        tooltip.classList.remove('visible');
        tooltip.setAttribute('aria-hidden', 'true');
        if (describedCard) {
          describedCard.removeAttribute('aria-describedby');
          describedCard = null;
        }
      };

      cards.forEach((card) => {
        card.addEventListener('mouseenter', () => showTooltip(card));
        card.addEventListener('mouseleave', hideTooltip);
        card.addEventListener('focusin', () => {
          if (isCoarsePointer) return;
          showTooltip(card);
        });
        card.addEventListener('focusout', hideTooltip);
      });

      window.addEventListener('scroll', hideTooltip, { passive: true });
      window.addEventListener('resize', hideTooltip);
      window.addEventListener('blur', hideTooltip);
    },

    /* ── Welcome Back Greeting ── */
    initWelcomeGreeting() {
      const greetingEl = document.getElementById('hpHeroGreeting');
      const greetingName = document.getElementById('hpHeroGreetingName');
      if (!greetingEl || !greetingName) return;

      /**
       * Resolve the user's display name from multiple sources:
       *   1. window.algoAuth.user.name   — JWT session (auth.js)
       *   2. window.userProgress?.name   — localStorage user data
       *   3. 'Learner'                   — ultimate fallback
       */
      function resolveDisplayName() {
        // 1. JWT session name — authoritative auth source from auth.js
        if (window.algoAuth.user.name) return window.algoAuth.user.name;

        // 2. window.userProgress — loaded from localStorage 'algoInfinityVerse'
        //    (set by modules/init.js and settings page saveProgress())
        if (window.userProgress && window.userProgress.name) {
          return window.userProgress.name;
        }

        return 'Learner';
      }

      const applyGreeting = () => {
        if (window.algoAuth && window.algoAuth.authenticated && window.algoAuth.user) {
          const name = resolveDisplayName();
          greetingName.textContent = name;
          greetingEl.hidden = false;
        } else {
          greetingEl.hidden = true;
        }
      };

      // Try immediately — auth.js may have already set window.algoAuth
      if (window.algoAuth) {
        applyGreeting();
        return;
      }

      // Auth not loaded yet — poll until ready (up to 5s)
      let attempts = 0;
      const maxAttempts = 50;
      const interval = setInterval(() => {
        attempts++;
        if (window.algoAuth || attempts >= maxAttempts) {
          clearInterval(interval);
          applyGreeting();
        }
      }, 100);
    },

    /* ── Live Stats Polling ── */
    initStatsPolling() {
      // Start with mock data that looks real
      const els = {
        solved: document.getElementById('hpStatsSolved'),
        learners: document.getElementById('hpStatsLearners'),
        xp: document.getElementById('hpStatsXp'),
      };

      if (!els.solved && !els.learners && !els.xp) return;

      // Seed initial values
      HP.stats.problemsSolved = 1247;
      HP.stats.activeLearners = 892;
      HP.stats.xpEarned = 48530;

      HP.updateStatDisplays(els);

      // Simulate live updates
      setInterval(() => {
        HP.stats.problemsSolved += Math.floor(Math.random() * 3) + 1;
        HP.stats.activeLearners += Math.floor(Math.random() * 2);
        HP.stats.xpEarned += Math.floor(Math.random() * 50) + 10;
        HP.updateStatDisplays(els);
      }, HP.config.statRefreshInterval);
    },

    updateStatDisplays(els) {
      if (els.solved) els.solved.textContent = HP.formatNumber(HP.stats.problemsSolved);
      if (els.learners) els.learners.textContent = HP.formatNumber(HP.stats.activeLearners);
      if (els.xp) els.xp.textContent = HP.formatNumber(HP.stats.xpEarned);
    },

    /* ── Reduced Motion ── */
    addReducedMotionSupport() {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        document.documentElement.classList.add('hp-reduced-motion');
      }
      mediaQuery.addEventListener('change', (e) => {
        document.documentElement.classList.toggle('hp-reduced-motion', e.matches);
      });
    },
  };    /* ── Boot ── */
  function safeBoot() {
    // Guard: only run on the homepage
    if (document.querySelector('.hp-hero')) {
      HP.init();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeBoot);
  } else {
    safeBoot();
  }

  // ── Safety net: re-run greeting after partials + auth are fully settled ──
  // When partials finish loading, auth.js has already set window.algoAuth
  // and updateProfileNames() has populated the [data-auth-user-name] elements.
  // This ensures the greeting resolves correctly even if the initial polling
  // encountered a race condition.
  document.addEventListener('partialsLoaded', () => {
    if (document.querySelector('.hp-hero') && window.HP) {
      window.HP.initWelcomeGreeting();
    }
  });

  // Expose for debugging
  window.HP = HP;
})();
