// ============================================================
// modules/shareProgress.js
// Share Progress Link — encode DSA progress into a shareable URL
// without any personal details. Opens a modal with copy, WhatsApp,
// Instagram, and Facebook share links.
//
// Usage:  import { initShareProgress } from './shareProgress.js';
//         initShareProgress();  // wires the share button & modal
// ============================================================

const SHARE_BASE = window.location.origin;

// ── data: which fields to share (no personal info) ──────────
const SHARE_FIELDS = [
  'completedProblems',
  'level',
  'xp',
  'streak',
  'quizScores',
  'completedRoadmapSteps',
];

// ── encoding / decoding helpers ─────────────────────────────

/**
 * Extract only the non-personal, shareable subset of user progress.
 */
function extractShareData(progress = {}) {
  const data = { v: 1 }; // version for forward compat
  for (const key of SHARE_FIELDS) {
    if (key === 'completedProblems' && Array.isArray(progress[key])) {
      data.c = progress[key];
    } else if (key === 'level') {
      data.l = progress.level || 1;
    } else if (key === 'xp') {
      data.x = progress.xp || 0;
    } else if (key === 'streak') {
      data.s = progress.streak || 0;
    } else if (key === 'quizScores' && progress.quizScores) {
      // Summarise quizzes: only include topic -> bestScore
      const qs = {};
      for (const [topic, record] of Object.entries(progress.quizScores)) {
        qs[topic] = { b: record.bestScore || 0 };
      }
      if (Object.keys(qs).length) data.q = qs;
    } else if (key === 'completedRoadmapSteps' && Array.isArray(progress[key])) {
      data.r = progress[key];
    }
  }
  data.t = (Array.isArray(progress.completedProblems) ? progress.completedProblems.length : 0);
  return data;
}

/**
 * Build a sortable stats summary object from the share data.
 */
function computeStats(data) {
  const completedCount = data.t || (Array.isArray(data.c) ? data.c.length : 0);
  return {
    completedCount,
    level: data.l || 1,
    xp: data.x || 0,
    streak: data.s || 0,
    quizCount: data.q ? Object.keys(data.q).length : 0,
  };
}

/**
 * Encode share data into a URL-safe string.
 * Uses safe base64 via btoa + encodeURIComponent to handle Unicode.
 */
function encodeShareData(data) {
  try {
    const json = JSON.stringify(data);
    // Unicode-safe base64
    const utf8 = encodeURIComponent(json);
    return btoa(utf8);
  } catch (e) {
    return '';
  }
}

/**
 * Decode a share string back into data object.
 */
function decodeShareData(encoded) {
  try {
    const utf8 = atob(encoded);
    const json = decodeURIComponent(utf8);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

/**
 * Build the full shareable URL.
 */
function buildShareUrl(data) {
  const encoded = encodeShareData(data);
  if (!encoded) return '';
  return `${SHARE_BASE}/share-progress?d=${encoded}`;
}

/**
 * Check if the current page has a `?d=` parameter and decode it.
 * Returns null if no valid share data is found.
 */
export function readShareDataFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('d');
  if (!encoded) return null;
  return decodeShareData(encoded);
}

// ── social share links ─────────────────────────────────────

function socialLinks(url) {
  const encodedUrl = encodeURIComponent(url);
  return {
    whatsapp: `https://wa.me/?text=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    instagram: null,
    copy: url,
  };
}

// ── build the modal DOM ────────────────────────────────────

let modalEl = null;
let generatedUrl = '';

function buildModal(stats) {
  const el = document.createElement('div');
  el.className = 'modal share-progress-modal';
  el.id = 'shareProgressModal';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'shareProgressTitle');
  el.setAttribute('aria-describedby', 'shareProgressSubtitle');

  const shareData = extractShareData(window.userProgress || {});
  const url = buildShareUrl(shareData);
  generatedUrl = url;
  const links = socialLinks(url);

  el.innerHTML = `
    <div class="share-progress-content">
      <!-- Close button — top-right corner -->
      <button
        type="button"
        class="share-progress-close-btn"
        id="shareCloseBtn"
        aria-label="Close share dialog"
      >
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>

      <!-- Decorative top -->
      <div class="share-progress-deco" aria-hidden="true">
        <div class="share-progress-deco-icon">
          <i class="fas fa-share-nodes"></i>
        </div>
      </div>

      <!-- Header -->
      <div class="share-progress-header">
        <h2 id="shareProgressTitle" class="share-progress-title">Share your DSA progress!</h2>
        <p id="shareProgressSubtitle" class="share-progress-subtitle">
          Share your achievements with friends and study groups.
        </p>
      </div>

      <!-- Stats preview -->
      <div class="share-progress-stats">
        <div class="share-progress-stat">
          <span class="share-progress-stat-value" id="shareStatProblems">${stats.completedCount}</span>
          <span class="share-progress-stat-label">Problems solved</span>
        </div>
        <div class="share-progress-stat">
          <span class="share-progress-stat-value" id="shareStatLevel">${stats.level}</span>
          <span class="share-progress-stat-label">Level</span>
        </div>
        <div class="share-progress-stat">
          <span class="share-progress-stat-value" id="shareStatXp">${stats.xp.toLocaleString()}</span>
          <span class="share-progress-stat-label">Total XP</span>
        </div>
        <div class="share-progress-stat">
          <span class="share-progress-stat-value" id="shareStatStreak">${stats.streak}</span>
          <span class="share-progress-stat-label">Day streak</span>
        </div>
      </div>

      <!-- URL field + copy -->
      <div class="share-progress-url-wrap">
        <label for="shareProgressUrlInput" class="visually-hidden">Share URL</label>
        <div class="share-progress-url-row">
          <input
            type="text"
            id="shareProgressUrlInput"
            class="share-progress-url-input"
            value="${url}"
            readonly
            aria-label="Share URL"
          />
          <button
            type="button"
            class="share-progress-copy-btn"
            id="shareCopyBtn"
            aria-label="Copy share URL"
            title="Copy to clipboard"
          >
            <i class="fas fa-copy" aria-hidden="true"></i>
            <span class="share-progress-copy-label">Copy</span>
          </button>
        </div>
      </div>

      <!-- Social share buttons -->
      <div class="share-progress-social" role="group" aria-label="Share on social media">
        <a
          href="${links.whatsapp}"
          target="_blank"
          rel="noopener noreferrer"
          class="share-progress-social-btn share-progress-social-btn--wa"
          data-share="whatsapp"
          aria-label="Share on WhatsApp"
        >
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
          <span>WhatsApp</span>
        </a>
        <a
          href="${links.facebook}"
          target="_blank"
          rel="noopener noreferrer"
          class="share-progress-social-btn share-progress-social-btn--fb"
          data-share="facebook"
          aria-label="Share on Facebook"
        >
          <i class="fa-brands fa-facebook-f" aria-hidden="true"></i>
          <span>Facebook</span>
        </a>
        <button
          type="button"
          class="share-progress-social-btn share-progress-social-btn--ig"
          id="shareInstagramBtn"
          aria-label="Share on Instagram — copies link to clipboard"
        >
          <i class="fa-brands fa-instagram" aria-hidden="true"></i>
          <span>Instagram</span>
        </button>
      </div>

      <!-- Footer -->
      <div class="share-progress-footer">
        <p class="share-progress-footer-text">
          <i class="fas fa-shield-alt" aria-hidden="true"></i>
          No personal details are included in the link.
        </p>
      </div>
    </div>
  `;

  return el;
}

function injectStyles() {
  if (document.getElementById('share-progress-styles')) return;
  const style = document.createElement('style');
  style.id = 'share-progress-styles';
  style.textContent = `
    /* ── Share Progress Modal ── */

    .share-progress-modal {
      display: flex !important;
      align-items: center;
      justify-content: center;
      position: fixed;
      inset: 0;
      z-index: 5000;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.35s ease, visibility 0.35s ease;
    }

    .share-progress-modal.active {
      opacity: 1;
      visibility: visible;
    }

    .share-progress-content {
      position: relative;
      width: 100%;
      max-width: 440px;
      max-height: 90vh;
      overflow-y: auto;
      margin: 20px;
      padding: 48px 32px 28px;
      background: var(--hp-card, #1C1C26);
      border: 1px solid var(--hp-card-border, rgba(212, 196, 240, 0.08));
      border-radius: 24px;
      box-shadow:
        0 32px 80px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(212, 196, 240, 0.04);
      transform: translateY(16px) scale(0.97);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      opacity: 0;
    }

    .share-progress-modal.active .share-progress-content {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    /* Close button — top-right */
    .share-progress-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 50%;
      color: var(--hp-text-tertiary, #7A7298);
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 1;
    }

    .share-progress-close-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--hp-text, #E8E4F2);
    }

    .share-progress-close-btn:focus-visible {
      outline: 2px solid var(--hp-lavender, #D4C4F0) !important;
      outline-offset: 2px !important;
    }

    /* Decorative top */
    .share-progress-deco {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .share-progress-deco-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(212, 196, 240, 0.10), rgba(188, 200, 240, 0.06));
      border: 1.5px solid rgba(212, 196, 240, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      color: var(--hp-lavender, #D4C4F0);
      animation: shareDecoPulse 3s ease-in-out infinite;
    }

    @keyframes shareDecoPulse {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.06); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .share-progress-deco-icon { animation: none; }
      .share-progress-content { transition: none; }
      .share-progress-modal { transition: none; }
    }

    /* Header */
    .share-progress-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .share-progress-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.5rem;
      font-weight: 400;
      margin: 0 0 8px;
      letter-spacing: -0.01em;
      color: var(--hp-lavender, #D4C4F0);
      background: linear-gradient(135deg, var(--hp-lavender, #D4C4F0), var(--hp-periwinkle, #BCC8F0));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .share-progress-subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 0.88rem;
      color: var(--hp-text-secondary, #A398C0);
      margin: 0;
      line-height: 1.5;
    }

    /* Stats grid */
    .share-progress-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .share-progress-stat {
      padding: 14px 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      text-align: center;
      transition: background 0.2s ease;
    }

    .share-progress-stat:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .share-progress-stat-value {
      display: block;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 1.6rem;
      font-weight: 500;
      color: var(--hp-lavender, #D4C4F0);
      line-height: 1.2;
    }

    .share-progress-stat-label {
      display: block;
      font-family: 'Inter', sans-serif;
      font-size: 0.72rem;
      color: var(--hp-text-tertiary, #7A7298);
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* URL row */
    .share-progress-url-wrap {
      margin-bottom: 20px;
    }

    .share-progress-url-row {
      display: flex;
      gap: 8px;
      align-items: stretch;
    }

    .share-progress-url-input {
      flex: 1;
      min-width: 0;
      padding: 10px 14px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.78rem;
      color: var(--hp-text-secondary, #A398C0);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .share-progress-url-input:focus {
      border-color: var(--hp-lavender, #D4C4F0);
    }

    .share-progress-copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--hp-bg, #0E0E14);
      background: linear-gradient(135deg, var(--hp-lavender, #D4C4F0), var(--hp-periwinkle, #BCC8F0));
      border: none;
      border-radius: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .share-progress-copy-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(212, 196, 240, 0.3);
    }

    .share-progress-copy-btn:active {
      transform: translateY(0);
    }

    .share-progress-copy-btn.copied {
      background: linear-gradient(135deg, var(--hp-mint, #C4E2D0), var(--hp-mint, #C4E2D0));
      color: #0E0E14;
    }

    .share-progress-copy-btn:focus-visible {
      outline: 2px solid var(--hp-lavender, #D4C4F0) !important;
      outline-offset: 2px !important;
    }

    /* Social buttons */
    .share-progress-social {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
    }

    .share-progress-social-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 8px;
      font-family: 'Inter', sans-serif;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--hp-text, #E8E4F2);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .share-progress-social-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
    }

    .share-progress-social-btn:active {
      transform: translateY(0);
    }

    .share-progress-social-btn:focus-visible {
      outline: 2px solid var(--hp-lavender, #D4C4F0) !important;
      outline-offset: 2px !important;
    }

    .share-progress-social-btn i {
      font-size: 1.1rem;
    }

    .share-progress-social-btn--wa i { color: #25D366; }
    .share-progress-social-btn--fb i { color: #1877F2; }
    .share-progress-social-btn--ig i { color: #E4405F; }

    .share-progress-social-btn--wa:hover i { color: #1EBE5B; }
    .share-progress-social-btn--fb:hover i { color: #1666D9; }
    .share-progress-social-btn--ig:hover i { color: #D7365E; }

    /* Footer */
    .share-progress-footer {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .share-progress-footer-text {
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem;
      color: var(--hp-text-tertiary, #7A7298);
      margin: 0;
    }

    .share-progress-footer-text i {
      margin-right: 4px;
    }

    /* ── Responsive ── */
    @media (max-width: 480px) {
      .share-progress-content {
        margin: 12px;
        padding: 44px 20px 24px;
      }
      .share-progress-stats {
        gap: 8px;
      }
      .share-progress-stat {
        padding: 10px 8px;
      }
      .share-progress-stat-value {
        font-size: 1.3rem;
      }
      .share-progress-deco-icon {
        width: 48px;
        height: 48px;
        font-size: 1.1rem;
      }
      .share-progress-social-btn span {
        display: none;
      }
      .share-progress-social-btn {
        flex: 0 1 auto;
        padding: 10px 14px;
      }
    }
  `;
  document.head.appendChild(style);
}

// ── close modal ────────────────────────────────────────────

let _escHandler = null;

function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove('active');

  // Clean up escape key listener
  if (_escHandler) {
    document.removeEventListener('keydown', _escHandler);
    _escHandler = null;
  }

  // Restore focus
  const trigger = modalEl._triggerEl;
  if (trigger && trigger.focus) {
    setTimeout(() => trigger.focus(), 100);
  }
  modalEl._triggerEl = null;
  // Clean up after transition
  setTimeout(() => {
    if (modalEl && modalEl.parentNode) {
      modalEl.parentNode.removeChild(modalEl);
      modalEl = null;
    }
  }, 350);
}

// ── open modal ─────────────────────────────────────────────

function openModal(triggerEl) {
  if (modalEl) {
    closeModal();
    setTimeout(() => openModal(triggerEl), 400);
    return;
  }

  const stats = computeStats(extractShareData(window.userProgress || {}));
  modalEl = buildModal(stats);
  modalEl._triggerEl = triggerEl;
  document.body.appendChild(modalEl);

  // Force reflow before adding active class for animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modalEl.classList.add('active');
    });
  });

  // ── wire events ──

  // Close button
  const closeBtn = modalEl.querySelector('#shareCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Click overlay to close
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });

  // Escape key
  _escHandler = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', _escHandler);

  // Copy button
  const copyBtn = modalEl.querySelector('#shareCopyBtn');
  const urlInput = modalEl.querySelector('#shareProgressUrlInput');
  if (copyBtn && urlInput) {
    copyBtn.addEventListener('click', async () => {
      try {
        urlInput.select();
        urlInput.setSelectionRange(0, 99999);
        await navigator.clipboard.writeText(urlInput.value);
        copyBtn.classList.add('copied');
        const label = copyBtn.querySelector('.share-progress-copy-label');
        if (label) label.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (label) label.textContent = 'Copy';
        }, 2000);
      } catch {
        urlInput.select();
        document.execCommand('copy');
        const label = copyBtn.querySelector('.share-progress-copy-label');
        if (label) label.textContent = 'Copied!';
        setTimeout(() => {
          if (label) label.textContent = 'Copy';
        }, 2000);
      }
    });
  }

  // Instagram button
  const igBtn = modalEl.querySelector('#shareInstagramBtn');
  if (igBtn) {
    igBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(generatedUrl);
        const label = igBtn.querySelector('span');
        const orig = label ? label.textContent : '';
        if (label) label.textContent = 'Copied!';
        igBtn.style.borderColor = 'rgba(228, 64, 95, 0.4)';
        setTimeout(() => {
          if (label) label.textContent = orig;
          igBtn.style.borderColor = '';
        }, 2000);
        if (typeof showNotification === 'function') {
          showNotification('Link copied! Paste it in your Instagram story.', 'success');
        }
      } catch {
        urlInput.select();
        document.execCommand('copy');
        if (typeof showNotification === 'function') {
          showNotification('Link copied! Paste it in your Instagram story.', 'success');
        }
      }
    });
  }

  // WhatsApp & Facebook — close modal immediately
  modalEl.querySelectorAll('[data-share]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });
}

// ── public API ─────────────────────────────────────────────

export function openShareModal(triggerEl) {
  openModal(triggerEl || document.activeElement);
}

export function initShareProgress() {
  injectStyles();

  const settingsDropdown = document.getElementById('settingsDropdown');
  if (!settingsDropdown) {
    document.addEventListener('partialsLoaded', () => {
      injectShareButton();
    });
    return;
  }
  injectShareButton();
}

function injectShareButton() {
  const settingsDropdown = document.getElementById('settingsDropdown');
  if (!settingsDropdown) return;
  if (document.getElementById('shareProgressNavBtn')) return;

  const xpStoreItem = document.getElementById('xpStoreNavBtn');
  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'dropdown-item';
  shareBtn.id = 'shareProgressNavBtn';
  shareBtn.setAttribute('role', 'menuitem');
  // Auth-gate: only show when signed in
  shareBtn.setAttribute('data-auth-required', '');
  shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share Progress';

  shareBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const parent = settingsDropdown.closest('.has-dropdown');
    if (parent) {
      parent.classList.remove('open');
      const toggle = parent.querySelector('.dropdown-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
    openShareModal(shareBtn);
  });

  if (xpStoreItem && xpStoreItem.parentNode) {
    xpStoreItem.parentNode.insertBefore(shareBtn, xpStoreItem.nextSibling);
  } else {
    const tier1 = settingsDropdown.querySelector('.tier-1');
    if (tier1) {
      tier1.appendChild(shareBtn);
    } else {
      settingsDropdown.appendChild(shareBtn);
    }
  }
}

// Legacy global export
window.openShareModal = openShareModal;
window.initShareProgress = initShareProgress;
