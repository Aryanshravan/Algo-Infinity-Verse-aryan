/* ═══════════════════════════════════════════════════════════════
   QUICK NOTES — Algorithm Visualizer Inline Notes Widget
   ═══════════════════════════════════════════════════════════════
   - Self-initializing IIFE (no module imports needed)
   - Detects visualizer from <body data-page="...">
   - Stores notes in localStorage keyed by visualizer name
   - Auto-saves with debounce, shows save status
   - Keyboard accessible (Escape closes panel)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Configuration ─── */
  const STORAGE_PREFIX = 'quick-note-';
  const DEBOUNCE_MS = 800;
  const MAX_NOTE_LENGTH = 5000;

  /* ─── State ─── */
  let isOpen = false;
  let saveTimer = null;
  let currentPage = '';

  /* ─── DOM refs (populated on init) ─── */
  let container, toggleBtn, panel, textarea, statusEl, badgeEl, charCountEl, clearBtn;

  /* ─── Helpers ─── */
  function getStorageKey() {
    return STORAGE_PREFIX + currentPage;
  }

  function loadNote() {
    try {
      return localStorage.getItem(getStorageKey()) || '';
    } catch (_) {
      return '';
    }
  }

  function saveNote(content) {
    try {
      localStorage.setItem(getStorageKey(), content);
      updateBadge(content);
      return true;
    } catch (_) {
      // localStorage full or unavailable
      return false;
    }
  }

  function updateBadge(content) {
    if (!badgeEl) return;
    const hasContent = content && content.trim().length > 0;
    badgeEl.classList.toggle('visible', hasContent);
  }

  function countChars(text) {
    return text.length;
  }

  function updateCharCount() {
    if (!charCountEl || !textarea) return;
    const len = countChars(textarea.value);
    charCountEl.textContent = `${len}${MAX_NOTE_LENGTH ? ' / ' + MAX_NOTE_LENGTH : ''}`;
    if (MAX_NOTE_LENGTH && len >= MAX_NOTE_LENGTH) {
      charCountEl.style.color = '#DC4A4A';
    } else {
      charCountEl.style.color = '';
    }
  }

  function setStatus(text, className) {
    if (!statusEl) return;
    statusEl.className = 'quick-note-status' + (className ? ' ' + className : '');
    statusEl.innerHTML = className === 'saving'
      ? '<span class="dot"></span> Saving...'
      : className === 'saved'
        ? '<span class="dot"></span> ' + text
        : text;
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    setStatus('', 'saving');

    saveTimer = setTimeout(function () {
      const content = textarea.value.slice(0, MAX_NOTE_LENGTH);
      const success = saveNote(content);
      if (success) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setStatus('Saved at ' + timeStr, 'saved');
      } else {
        setStatus('Could not save — storage full', '');
      }
      updateCharCount();
    }, DEBOUNCE_MS);
  }

  /* ─── Create DOM ─── */
  function buildWidget() {
    container = document.createElement('div');
    container.className = 'quick-note-container';
    container.setAttribute('aria-live', 'polite');

    // Badge (note count indicator)
    badgeEl = document.createElement('span');
    badgeEl.className = 'quick-note-badge';
    badgeEl.textContent = '!';

    // Toggle button with custom SVG sticky-note icon
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'quick-note-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle quick notes for ' + currentPage);
    toggleBtn.setAttribute('title', 'Quick Notes');
    toggleBtn.innerHTML =
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />' +
        '<polyline points="14,2 14,8 20,8" />' +
        '<line x1="8" y1="13" x2="16" y2="13" />' +
        '<line x1="8" y1="17" x2="14" y2="17" />' +
      '</svg>';
    toggleBtn.appendChild(badgeEl);

    // Panel
    panel = document.createElement('div');
    panel.className = 'quick-note-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', 'Quick notes');

    // Header
    const header = document.createElement('div');
    header.className = 'quick-note-header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'quick-note-title-group';
    titleGroup.innerHTML =
      '<svg class="quick-note-title-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" fill="#2F2835" stroke="#D4A574" stroke-width="1.2"/>' +
        '<polyline points="14,2 14,8 20,8" fill="none" stroke="#D4A574" stroke-width="1.2"/>' +
      '</svg>' +
      '<span class="quick-note-title">Notes</span>';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'quick-note-close';
    closeBtn.setAttribute('aria-label', 'Close notes');
    closeBtn.innerHTML = '&times;';

    header.appendChild(titleGroup);
    header.appendChild(closeBtn);

    // Textarea
    textarea = document.createElement('textarea');
    textarea.className = 'quick-note-textarea';
    textarea.setAttribute('placeholder', 'Jot down your understanding of this algorithm...');
    textarea.setAttribute('maxlength', String(MAX_NOTE_LENGTH));
    textarea.setAttribute('aria-label', 'Your notes');
    textarea.setAttribute('translate', 'no');

    // Footer
    const footer = document.createElement('div');
    footer.className = 'quick-note-footer';

    const leftGroup = document.createElement('div');
    leftGroup.style.display = 'flex';
    leftGroup.style.alignItems = 'center';
    leftGroup.style.gap = '8px';

    statusEl = document.createElement('span');
    statusEl.className = 'quick-note-status';
    statusEl.textContent = 'Ready';

    clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'quick-note-clear';
    clearBtn.innerHTML = '<i class="fas fa-trash-alt" style="font-size:0.6rem;"></i> Clear';
    clearBtn.setAttribute('aria-label', 'Clear notes');

    charCountEl = document.createElement('span');
    charCountEl.className = 'quick-note-char-count';

    leftGroup.appendChild(statusEl);
    leftGroup.appendChild(clearBtn);
    footer.appendChild(leftGroup);
    footer.appendChild(charCountEl);

    panel.appendChild(header);
    panel.appendChild(textarea);
    panel.appendChild(footer);

    container.appendChild(toggleBtn);
    container.appendChild(panel);

    document.body.appendChild(container);
  }

  /* ─── Event bindings ─── */
  function bindEvents() {
    // Toggle open/close
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleOpen();
    });

    // Close button
    panel.querySelector('.quick-note-close').addEventListener('click', function () {
      closePanel();
    });

    // Auto-save on input
    textarea.addEventListener('input', function () {
      // Enforce max length
      if (textarea.value.length > MAX_NOTE_LENGTH) {
        textarea.value = textarea.value.slice(0, MAX_NOTE_LENGTH);
      }
      debouncedSave();
    });

    // Focus in textarea → mark as active
    textarea.addEventListener('focus', function () {
      panel.classList.add('focused');
    });

    textarea.addEventListener('blur', function () {
      panel.classList.remove('focused');
    });

    // Clear notes
    clearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (textarea.value.trim()) {
        textarea.value = '';
        debouncedSave();
        setStatus('Cleared', '');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
        toggleBtn.focus();
      }
    });

    // Close on click outside
    document.addEventListener('click', function (e) {
      if (isOpen && !container.contains(e.target)) {
        closePanel();
      }
    });
  }

  /* ─── Open / Close ─── */
  function toggleOpen() {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function openPanel() {
    if (isOpen) return;
    isOpen = true;

    // Load latest content
    const saved = loadNote();
    textarea.value = saved;
    updateCharCount();
    updateBadge(saved);

    panel.classList.add('open');
    toggleBtn.classList.add('is-active');
    toggleBtn.setAttribute('aria-expanded', 'true');

    // Focus textarea after animation
    setTimeout(function () {
      textarea.focus();
      // Move cursor to end
      const len = textarea.value.length;
      if (len) {
        textarea.setSelectionRange(len, len);
      }
    }, 150);

    // Show saved status if content exists
    if (saved.trim()) {
      setStatus('Notes loaded', 'saved');
    } else {
      setStatus('Start typing...', '');
    }
  }

  function closePanel() {
    if (!isOpen) return;
    isOpen = false;

    // Force save any pending changes
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      const content = textarea.value.slice(0, MAX_NOTE_LENGTH);
      saveNote(content);
      if (content.trim()) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setStatus('Saved at ' + timeStr, 'saved');
      }
    }

    panel.classList.remove('open');
    toggleBtn.classList.remove('is-active');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  /* ─── Initialization ─── */
  function init() {
    // Determine visualizer name from data-page attribute
    var body = document.body;
    if (!body) {
      // Retry on DOMContentLoaded
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    currentPage = body.getAttribute('data-page') || '';

    // Only activate on visualizer pages (skip index, login, signup, etc.)
    if (!currentPage || currentPage === 'index' || currentPage === 'login' ||
        currentPage === 'signup' || currentPage === 'profile') {
      return;
    }

    // Skip if already initialized
    if (document.querySelector('.quick-note-container')) {
      return;
    }

    buildWidget();
    bindEvents();

    // Load initial content
    var saved = loadNote();
    if (saved) {
      updateBadge(saved);
    }
  }

  /* ─── Start ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
