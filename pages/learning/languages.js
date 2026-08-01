/* ============================================
   PROGRAMMING LANGUAGES — Data, Search & Filter
   ============================================ */

const languages = [
  // ── General Purpose ──
  {
    name: 'Python',
    path: '/pages/learning/python-learning/python-learning.html',
    category: 'General Purpose',
    icon: 'fa-python',
    isBrandIcon: true,
    langKey: 'python',
    desc: 'Beginner-friendly, versatile, and powerful. Ideal for data science, web development, automation, and AI.',
  },
  {
    name: 'Ruby',
    path: '/pages/learning/ruby-learning/ruby-learning.html',
    category: 'General Purpose',
    icon: 'fa-gem',
    isBrandIcon: false,
    langKey: 'ruby',
    desc: "A language designed for developer happiness — elegant syntax, pure OOP, expressive blocks, and the power of Ruby on Rails.",
  },
  {
    name: 'JavaScript',
    path: '/pages/learning/javascript-learning/javascript-learning.html',
    category: 'Web',
    icon: 'fa-js',
    isBrandIcon: true,
    langKey: 'javascript',
    desc: 'The universal language of the web. Run everywhere — frontend, backend, mobile, and desktop.',
  },

  // ── Enterprise ──
  {
    name: 'C#',
    path: '/pages/learning/csharp-learning/csharp-learning.html',
    category: 'Enterprise',
    icon: 'fa-hashtag',
    isBrandIcon: false,
    langKey: 'csharp',
    desc: 'Modern, type-safe, and object-oriented. The heart of the .NET ecosystem — from web APIs to cloud services.',
  },
  {
    name: 'Java',
    path: '/pages/learning/java-learning/java-learning.html',
    category: 'Enterprise',
    icon: 'fa-java',
    isBrandIcon: true,
    langKey: 'java',
    desc: 'Object-oriented powerhouse for enterprise applications, Android development, and large-scale systems.',
  },

  // ── Systems ──
  {
    name: 'C++',
    path: '/pages/learning/cplusplus-learning/cplusplus-learning.html',
    category: 'Systems',
    icon: 'fa-code-fork',
    isBrandIcon: false,
    langKey: 'cplusplus',
    desc: 'High-performance systems programming with OOP, templates, and manual memory control.',
  },
  {
    name: 'C',
    path: '/pages/learning/c-learning/c-learning.html',
    category: 'Systems',
    icon: 'fa-c',
    isBrandIcon: true,
    langKey: 'c',
    desc: 'The foundation of modern computing. Efficient, portable, and the language that built operating systems.',
  },

  // ── Web ──
  {
    name: 'TypeScript',
    path: '/pages/learning/typescript-learning/typescript-learning.html',
    category: 'Web',
    icon: 'fa-typescript',
    isBrandIcon: true,
    langKey: 'typescript',
    desc: 'A typed superset of JavaScript that compiles to plain JS — scale your code with confidence.',
    svgIcon: `<img src="https://cdn.simpleicons.org/typescript/3178C6" alt="TypeScript" style="width:1em;height:1em;display:block;">`
  },
  {
    name: 'PHP',
    path: '/pages/learning/php-learning/php-learning.html',
    category: 'Web',
    icon: 'fa-php',
    isBrandIcon: true,
    langKey: 'php',
    desc: 'Server-side scripting that powers over 75% of the web — from WordPress to Laravel.',
  },

  // ── Blockchain ──
  {
    name: 'Solidity',
    path: '/pages/learning/solidity-learning/solidity-learning.html',
    category: 'Systems',
    icon: 'fa-link',
    isBrandIcon: false,
    langKey: 'solidity',
    desc: 'The language of Ethereum smart contracts. Statically typed, contract-oriented, and designed for the EVM.',
    svgIcon: `<img src="https://cdn.simpleicons.org/solidity/fbc4ab" alt="Solidity" style="width:1em;height:1em;display:block;">`
  },

  // ── Mobile / JVM ──
  {
    name: 'Kotlin',
    path: '/pages/learning/kotlin-learning/kotlin-learning.html',
    category: 'General Purpose',
    icon: 'fa-code',
    isBrandIcon: false,
    langKey: 'kotlin',
    desc: 'Modern, concise, and safe JVM language. Preferred for Android development with seamless Java interop and coroutines.',
    svgIcon: `<img src="https://cdn.simpleicons.org/kotlin/a8c8f0" alt="Kotlin" style="width:1em;height:1em;display:block;">`
  },

  // ── Apple / Swift ──
  {
    name: 'Swift',
    path: '/pages/learning/swift-learning/swift-learning.html',
    category: 'General Purpose',
    icon: 'fa-swift',
    isBrandIcon: true,
    langKey: 'swift',
    desc: "Apple's modern, type-safe language for iOS, macOS, and beyond. Optionals, protocols, and closures make safe, expressive code the default.",
    svgIcon: `<img src="https://cdn.simpleicons.org/swift/f2a88a" alt="Swift" style="width:1em;height:1em;display:block;">`
  },

  // ── Mobile / Cross-platform ──
  {
    name: 'Flutter',
    path: '/pages/learning/flutter-learning/flutter-learning.html',
    category: 'General Purpose',
    icon: 'fa-mobile-screen',
    isBrandIcon: false,
    langKey: 'flutter',
    desc: 'Google\'s UI toolkit for building beautiful, natively compiled apps for mobile, web, and desktop from a single Dart codebase.',
    svgIcon: `<img src="https://cdn.simpleicons.org/flutter/a8c8dc" alt="Flutter" style="width:1em;height:1em;display:block;">`
  },
  {
    name: 'Dart',
    path: '/pages/learning/dart-learning/dart-learning.html',
    category: 'General Purpose',
    icon: 'fa-code',
    isBrandIcon: false,
    langKey: 'dart',
    langColor: '#0175C2',
    desc: 'Fast, client-optimized language that powers Flutter. Sound null safety, rich collections, and async streams for apps on any platform.',
    svgIcon: `<img src="https://cdn.simpleicons.org/dart/0175C2" alt="Dart" style="width:1em;height:1em;display:block;">`
  },
];

/* ─── Categories ─── */
const categories = ['All', 'General Purpose', 'Systems', 'Web', 'Enterprise'];

/* ─── Language brand colors for icons ─── */
const langColors = {
  python: '#3572A5',
  ruby: '#CC342D',
  javascript: '#f7df1e',
  typescript: '#3178C6',
  java: '#b07219',
  cplusplus: '#f34b7d',
  c: '#888888',
  php: '#777BB4',
  solidity: '#fbc4ab',
  kotlin: '#a8c8f0',
  csharp: '#e8b0b0',
  swift: '#f2a88a',
  flutter: '#a8c8dc',
  dart: '#0175C2',
};

/* ─── DOM refs ─── */
const grid = document.getElementById('langGrid');
const searchInput = document.getElementById('langSearchInput');
const clearBtn = document.getElementById('langClearBtn');
const filterContainer = document.getElementById('langFilters');
const emptyState = document.getElementById('langEmpty');
const countDisplay = document.getElementById('langCountDisplay');

let activeCategory = new URLSearchParams(window.location.search).get('category')
  || localStorage.getItem('langFilterCategory')
  || 'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-filter-chip' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat === 'All' ? 'all' : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === 'All' ? 'true' : 'false');
    btn.textContent = cat + (cat !== 'All' ? ` (${languages.filter(v => v.category === cat).length})` : '');
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.lang-filter-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      localStorage.setItem('langFilterCategory', activeCategory);
      const url = new URL(window.location);
      if (activeCategory === 'all') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', activeCategory);
      }
      history.pushState({}, '', url);
      render();
    });
    filterContainer.appendChild(btn);
  });
}

/* ─── Render cards ─── */
function render() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filtered = languages.filter(v => {
    const matchCategory = activeCategory === 'all' ||
      v.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.desc.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  countDisplay.textContent = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  grid.innerHTML = filtered.map((v, i) => {
    const iconColor = v.langColor || langColors[v.langKey] || 'var(--lang-primary)';
    let iconHtml;
    if (v.svgIcon) {
      iconHtml = v.svgIcon;
    } else {
      const iconClass = v.isBrandIcon ? `fab ${v.icon}` : `fas ${v.icon}`;
      iconHtml = `<i class="${iconClass}"></i>`;
    }
    return `
    <a href="${v.path}" class="lang-card" role="listitem" data-lang="${v.langKey}" style="--lang-card-accent:${iconColor}; animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.035, 0.6)}s">
      <span class="lang-card-icon" style="color:${iconColor}">${iconHtml}</span>
      <span class="lang-card-title">${escHtml(v.name)}</span>
      <span class="lang-card-desc">${escHtml(v.desc)}</span>
      <div class="lang-card-footer">
        <span class="lang-card-category">${escHtml(v.category)}</span>
        <span class="lang-card-arrow"><i class="fas fa-arrow-right"></i></span>
      </div>
    </a>`;
  }).join('');
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ─── Search ─── */
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  clearBtn.classList.toggle('visible', searchQuery.length > 0);
  render();
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearBtn.classList.remove('visible');
  render();
  searchInput.focus();
});

/* ─── Card click: set skip-loading flag before navigating ─── */
grid.addEventListener('click', (e) => {
  const card = e.target.closest('.lang-card');
  if (card && card.href) {
    sessionStorage.setItem('_langSkipLoading', '1');
  }
});

/* ─── Keyboard shortcut: ⌘K / Ctrl+K ─── */
document.addEventListener('keydown', (e) => {
  // Keyboard shortcuts are desktop-only — no-op on mobile viewports (< 768px).
  if (!window.areKeyboardShortcutsEnabled()) return;
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === 'Escape') {
    searchInput.blur();
  }
});

/* ─── Back button ─── */
document.getElementById('langBackBtn')?.addEventListener('click', () => {
  localStorage.removeItem('langFilterCategory');
  if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ═══════════════════════════════════════════
   TERMINAL TITLE: Typing Animation
   ═══════════════════════════════════════════ */

function initTitleTyping() {
  const textSpans = document.querySelectorAll('.lang-title-text');
  const cursor = document.querySelector('.lang-title-cursor');
  if (!textSpans.length || !cursor) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Hide cursor until typing finishes
  cursor.style.opacity = '0';

  // Get the target text from data-content attributes
  const texts = Array.from(textSpans).map(el => el.dataset.content || '');

  let currentSpan = 0;
  let charIndex = 0;

  function typeChar() {
    if (currentSpan >= textSpans.length) {
      // All done — reveal cursor
      cursor.style.opacity = '';
      return;
    }

    const span = textSpans[currentSpan];
    const text = texts[currentSpan];

    if (charIndex < text.length) {
      span.textContent += text[charIndex];
      charIndex++;
      const delay = text[charIndex - 1] === ' ' ? 40 : 25 + Math.random() * 30;
      setTimeout(typeChar, delay);
    } else {
      // Move to next line
      currentSpan++;
      charIndex = 0;
      const delay = currentSpan < textSpans.length ? 100 : 0;
      setTimeout(typeChar, delay);
    }
  }

  // Start typing after a short pause
  setTimeout(typeChar, 400);
}

/* ═══════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════ */

buildFilters();
initTitleTyping();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.lang-filter-chip').forEach(c => {
    const isActive = c.dataset.category === activeCategory;
    c.classList.toggle('active', isActive);
    c.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}
syncChipFromURL();
render();

/* Handle browser back/forward */
window.addEventListener('popstate', () => {
  activeCategory = new URLSearchParams(window.location.search).get('category') || 'all';
  syncChipFromURL();
  render();
});
