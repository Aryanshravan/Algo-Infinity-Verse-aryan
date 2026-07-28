// pages/auth/setting.js
// Profile Settings — Form handling, validation, persistence, and interactivity

(function () {
  'use strict';

  // ============================================================
  // CONSTANTS
  // ============================================================
  const STORAGE_KEY = 'algoInfinityVerse';
  const AVATAR_THEMES = {
    default: null,
    ocean: ['#7ab8d4', '#88c8d8', '#98d4c8', '#78b8c8', '#68a8b8'],
    sunset: ['#d4a878', '#d4b878', '#c88868', '#d49868', '#c8a088'],
    midnight: ['#5a5a78', '#686888', '#585878', '#4a4a68', '#6a6a88'],
    forest: ['#78b898', '#68a888', '#88c8a8', '#589878', '#98c8a8'],
    royal: ['#c898c8', '#b888b8', '#d8a8d8', '#a878a8', '#c8a8c8'],
  };
  const AVATAR_BORDERS = {
    none: '',
    gold: '3px solid #d4a848',
    'premium-glow': '3px solid #c8a0d8',
    rainbow: '3px solid transparent',
    'neon-cyan': '3px solid #88c8d8',
    'neon-pink': '3px solid #d888a8',
  };

  // ============================================================
  // DOM REFS
  // ============================================================
  const $ = function (id) { return document.getElementById(id); };
  const $$ = function (sel, ctx) { return (ctx || document).querySelectorAll(sel); };
  const dom = {};

  function cacheDom() {
    dom.tabs = document.querySelectorAll('.stg-tab');
    dom.panels = {
      profile: $('panel-profile'),
      account: $('panel-account'),
      preferences: $('panel-preferences'),
      danger: $('panel-danger'),
    };
    dom.indicator = document.querySelector('.stg-tab-indicator');
    dom.nameInput = $('stgNameInput');
    dom.bioInput = $('stgBioInput');
    dom.bioCount = $('stgBioCount');
    dom.nameHint = $('stgNameHint');
    dom.nameError = $('stgNameError');
    dom.bioError = $('stgBioError');
    dom.langCheckboxes = $$('.stg-lang-chip input[type="checkbox"]');
    dom.avatarInner = $('stgAvatarInner');
    dom.avatarFrame = $('stgAvatarFrame');
    dom.avatarFileInput = $('stgAvatarFileInput');
    dom.avatarUploadBtn = $('stgAvatarUploadBtn');
    dom.borderChips = $$('#stgBorderOptions .stg-chip');
    dom.themeChips = $$('#stgThemeOptions .stg-chip');
    dom.profileSaveBtn = $('stgProfileSaveBtn');
    dom.emailInput = $('stgEmailInput');
    dom.currentPw = $('stgCurrentPassword');
    dom.newPw = $('stgNewPassword');
    dom.confirmPw = $('stgConfirmPassword');
    dom.confirmError = $('stgConfirmError');
    dom.strengthBar = $('stgStrengthBar');
    dom.strengthText = $('stgStrengthText');
    dom.pwRules = $$('.stg-rule');
    dom.pwSaveBtn = $('stgPasswordSaveBtn');
    dom.guestNotice = $('stgGuestNotice');
    dom.notifToggles = $$('.stg-notif-toggle');
    dom.themeCards = $$('.stg-theme-card');
    // Danger zone buttons are handled by auth.js (wireDeactivateAccount, wireDeleteAccount)
    dom.pwToggles = $$('.stg-pw-toggle');
    dom.backBtn = $('stgBackBtn');
  }

  // ============================================================
  // STORAGE HELPERS (compatible with modules/profile-edit.js)
  // ============================================================
  function loadProgress() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Sync with window.userProgress if it exists
      if (typeof window !== 'undefined' && window.userProgress) {
        Object.assign(window.userProgress, data);
      }
    } catch (e) {
      // Storage quota exceeded or unavailable
      notify('Could not save data. Storage may be full.', 'error');
    }
  }

  // ============================================================
  // NOTIFICATION (delegates to global showNotification)
  // ============================================================
  function notify(message, type) {
    if (typeof window !== 'undefined' && typeof window.showNotification === 'function') {
      window.showNotification(message, type || 'info');
    }
  }

  // ============================================================
  // TAB SYSTEM
  // ============================================================
  function switchTab(tabEl) {
    if (!tabEl || tabEl.classList.contains('active')) return;

    var target = tabEl.getAttribute('data-tab');
    if (!target || !dom.panels[target]) return;

    // Deactivate all
    dom.tabs.forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    Object.keys(dom.panels).forEach(function (k) {
      dom.panels[k].hidden = true;
      dom.panels[k].classList.remove('active');
    });

    // Activate target
    tabEl.classList.add('active');
    tabEl.setAttribute('aria-selected', 'true');
    dom.panels[target].hidden = false;
    dom.panels[target].classList.add('active');

    // Move indicator
    moveIndicator(tabEl);
  }

  function moveIndicator(tabEl) {
    if (!dom.indicator) return;
    var parent = tabEl.parentElement;
    if (!parent) return;
    var parentRect = parent.getBoundingClientRect();
    var tabRect = tabEl.getBoundingClientRect();
    dom.indicator.style.left = (tabRect.left - parentRect.left) + 'px';
    dom.indicator.style.width = tabRect.width + 'px';
  }

  function initTabs() {
    dom.tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { switchTab(tab); });
    });

    // Set initial indicator position
    var activeTab = document.querySelector('.stg-tab.active');
    if (activeTab) {
      // Delay to let layout settle
      requestAnimationFrame(function () { moveIndicator(activeTab); });
    }

    // Re-position on resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var at = document.querySelector('.stg-tab.active');
        if (at) moveIndicator(at);
      }, 100);
    });
  }

  // ============================================================
  // AVATAR
  // ============================================================
  function getAvatarThemeBg(theme, initial) {
    if (!theme || theme === 'default') return null;
    var palette = AVATAR_THEMES[theme];
    if (!palette) return null;
    var idx = (initial.charCodeAt(0) - 65) % palette.length;
    return palette[idx >= 0 ? idx : 0];
  }

  function updateAvatarPreview() {
    var progress = loadProgress();
    var custom = progress.avatarCustomization || { border: 'none', theme: 'default' };
    var borderStyle = AVATAR_BORDERS[custom.border] || '';
    var initial = progress.name ? progress.name.charAt(0).toUpperCase() : 'L';

    var avatar = progress.avatar;
    var themeBg = getAvatarThemeBg(custom.theme, initial);

    if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image')) {
      dom.avatarInner.innerHTML = '<img src="' + escapeAttr(avatar) + '" alt="Avatar" />';
    } else {
      var bgColor = themeBg || '#2a2a44';
      dom.avatarInner.innerHTML = '';
      dom.avatarInner.textContent = initial;
      dom.avatarInner.style.background = bgColor;
    }

    dom.avatarInner.style.border = borderStyle || 'none';
    if (custom.border === 'rainbow') {
      dom.avatarFrame.style.background = 'linear-gradient(135deg, var(--stg-primary), var(--stg-warm), var(--stg-green), var(--stg-secondary))';
      dom.avatarFrame.style.padding = '3px';
    } else {
      dom.avatarFrame.style.background = '';
      dom.avatarFrame.style.padding = '';
    }
  }

  function selectBorderChip(chip) {
    dom.borderChips.forEach(function (c) { c.classList.remove('active'); });
    chip.classList.add('active');
    var value = chip.getAttribute('data-border');
    if (!value) return;
    var progress = loadProgress();
    if (!progress.avatarCustomization) progress.avatarCustomization = { border: 'none', theme: 'default' };
    progress.avatarCustomization.border = value;
    saveProgress(progress);
    updateAvatarPreview();
  }

  function selectThemeChip(chip) {
    dom.themeChips.forEach(function (c) { c.classList.remove('active'); });
    chip.classList.add('active');
    var value = chip.getAttribute('data-theme');
    if (!value) return;
    var progress = loadProgress();
    if (!progress.avatarCustomization) progress.avatarCustomization = { border: 'none', theme: 'default' };
    progress.avatarCustomization.theme = value;
    saveProgress(progress);
    updateAvatarPreview();
  }

  function initAvatar() {
    // Border chips
    dom.borderChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (chip.disabled) return;
        selectBorderChip(chip);
      });
    });

    // Theme chips
    dom.themeChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (chip.disabled) return;
        selectThemeChip(chip);
      });
    });

    // Upload
    dom.avatarUploadBtn.addEventListener('click', function () {
      dom.avatarFileInput.click();
    });

    dom.avatarFileInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        notify('Please select an image file.', 'error');
        return;
      }
      var reader = new FileReader();
      reader.onload = function (ev) {
        var progress = loadProgress();
        progress.avatar = ev.target.result;
        saveProgress(progress);
        updateAvatarPreview();
        notify('Avatar updated successfully!', 'success');
      };
      reader.onerror = function () {
        notify('Failed to read the image file.', 'error');
      };
      reader.readAsDataURL(file);
    });

    // Restore saved state
    var progress = loadProgress();
    var custom = progress.avatarCustomization || { border: 'none', theme: 'default' };
    dom.borderChips.forEach(function (c) {
      if (c.getAttribute('data-border') === custom.border) {
        c.classList.add('active');
      }
    });
    dom.themeChips.forEach(function (c) {
      if (c.getAttribute('data-theme') === custom.theme) {
        c.classList.add('active');
      }
    });

    updateAvatarPreview();
  }

  // ============================================================
  // PROFILE FORM
  // ============================================================
  function validateName(name) {
    if (!name || name.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }
    if (name.length > 30) {
      return 'Name cannot exceed 30 characters.';
    }
    return '';
  }

  function validateBio(bio) {
    if (bio && bio.length > 120) {
      return 'Bio cannot exceed 120 characters.';
    }
    return '';
  }

  function saveProfile() {
    var name = dom.nameInput.value.trim();
    var bio = dom.bioInput.value.trim();

    var nameErr = validateName(name);
    var bioErr = validateBio(bio);

    dom.nameError.textContent = nameErr;
    dom.bioError.textContent = bioErr;

    if (nameErr || bioErr) {
      if (nameErr) dom.nameInput.focus();
      else if (bioErr) dom.bioInput.focus();
      return;
    }

    var langs = [];
    dom.langCheckboxes.forEach(function (cb) {
      if (cb.checked) langs.push(cb.value);
    });

    var progress = loadProgress();
    progress.name = name;
    progress.bio = bio;
    progress.languages = langs;
    progress.email = dom.emailInput.value.trim();
    saveProgress(progress);

    // Update global views if available
    if (typeof window.updateProfileViews === 'function') {
      window.updateProfileViews();
    }
    if (typeof window.renderLanguageChips === 'function') {
      window.renderLanguageChips();
    }

    dom.nameError.textContent = '';
    dom.bioError.textContent = '';
    updateAvatarPreview();
    notify('Profile saved successfully!', 'success');
  }

  function initProfileForm() {
    // Load saved data
    var progress = loadProgress();
    dom.nameInput.value = progress.name || '';
    dom.bioInput.value = progress.bio || '';
    dom.emailInput.value = progress.email || '';

    // Bio char count
    function updateBioCount() {
      var len = dom.bioInput.value.length;
      dom.bioCount.textContent = len;
    }
    dom.bioInput.addEventListener('input', updateBioCount);
    updateBioCount();

    // Language checkboxes
    var userLangs = progress.languages || [];
    dom.langCheckboxes.forEach(function (cb) {
      cb.checked = userLangs.indexOf(cb.value) !== -1;
    });

    // Real-time name validation hint
    dom.nameInput.addEventListener('input', function () {
      var err = validateName(dom.nameInput.value);
      dom.nameError.textContent = err;
    });

    // Save button
    dom.profileSaveBtn.addEventListener('click', saveProfile);

    // Enter key support
    dom.nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveProfile();
      }
    });
  }

  // ============================================================
  // PASSWORD
  // ============================================================
  function getPasswordStrength(pw) {
    var score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  function updatePasswordStrength() {
    var pw = dom.newPw.value;
    var score = getPasswordStrength(pw);
    var pct = (score / 5) * 100;

    dom.strengthBar.style.width = pct + '%';

    var colors = ['', 'var(--stg-danger)', '#d4a878', '#c8b878', 'var(--stg-green)', 'var(--stg-green)'];
    var labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    dom.strengthBar.style.background = colors[score] || '';
    dom.strengthText.textContent = pw ? labels[score] || '' : 'Password strength';

    // Update rules
    dom.pwRules.forEach(function (rule) {
      var r = rule.getAttribute('data-rule');
      var met = false;
      switch (r) {
        case 'length': met = pw.length >= 8; break;
        case 'upper': met = /[A-Z]/.test(pw); break;
        case 'lower': met = /[a-z]/.test(pw); break;
        case 'number': met = /[0-9]/.test(pw); break;
        case 'special': met = /[^A-Za-z0-9]/.test(pw); break;
      }
      rule.classList.toggle('met', met);
      var icon = rule.querySelector('.stg-rule-icon i');
      if (icon) {
        icon.className = met ? 'fas fa-check-circle' : 'fas fa-circle';
      }
    });
  }

  function validatePasswords() {
    var current = dom.currentPw.value;
    var newPw = dom.newPw.value;
    var confirm = dom.confirmPw.value;

    if (!current) {
      notify('Please enter your current password.', 'error');
      dom.currentPw.focus();
      return false;
    }
    if (!newPw) {
      notify('Please enter a new password.', 'error');
      dom.newPw.focus();
      return false;
    }
    if (getPasswordStrength(newPw) < 3) {
      notify('Please choose a stronger password.', 'error');
      dom.newPw.focus();
      return false;
    }
    if (newPw !== confirm) {
      dom.confirmError.textContent = 'Passwords do not match.';
      dom.confirmPw.focus();
      return false;
    }
    dom.confirmError.textContent = '';
    return true;
  }

  function savePassword() {
    if (!validatePasswords()) return;

    var progress = loadProgress();
    // In a real app, this would call an API endpoint.
    // For now, store a flag indicating the password was changed.
    progress.passwordLastChanged = new Date().toISOString();
    saveProgress(progress);

    dom.currentPw.value = '';
    dom.newPw.value = '';
    dom.confirmPw.value = '';
    dom.strengthBar.style.width = '0';
    dom.strengthText.textContent = 'Password strength';
    dom.pwRules.forEach(function (r) {
      r.classList.remove('met');
      var icon = r.querySelector('.stg-rule-icon i');
      if (icon) icon.className = 'fas fa-circle';
    });

    notify('Password updated successfully!', 'success');
  }

  function initPasswordForm() {
    // Check if guest
    var isGuest = !(window.algoAuth && (window.algoAuth.user || window.algoAuth.currentUser));
    if (isGuest) {
      dom.guestNotice.hidden = false;
      dom.currentPw.disabled = true;
      dom.newPw.disabled = true;
      dom.confirmPw.disabled = true;
      dom.pwSaveBtn.disabled = true;
    }

    // Password strength meter
    dom.newPw.addEventListener('input', updatePasswordStrength);

    // Confirm match
    dom.confirmPw.addEventListener('input', function () {
      if (dom.confirmPw.value && dom.newPw.value !== dom.confirmPw.value) {
        dom.confirmError.textContent = 'Passwords do not match.';
      } else {
        dom.confirmError.textContent = '';
      }
    });

    dom.pwSaveBtn.addEventListener('click', savePassword);

    // Password visibility toggles
    dom.pwToggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-target');
        var input = $(targetId);
        if (!input) return;
        var icon = btn.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) icon.className = 'fas fa-eye-slash';
        } else {
          input.type = 'password';
          if (icon) icon.className = 'fas fa-eye';
        }
      });
    });
  }

  // ============================================================
  // NOTIFICATION TOGGLES
  // ============================================================
  function initNotificationToggles() {
    var progress = loadProgress();
    var prefs = progress.notificationPreferences || {};

    dom.notifToggles.forEach(function (toggle) {
      var key = toggle.getAttribute('data-key');
      if (!key) return;

      // Restore saved state
      if (prefs[key] !== undefined) {
        toggle.checked = !!prefs[key];
      }

      toggle.addEventListener('change', function () {
        var p = loadProgress();
        if (!p.notificationPreferences) p.notificationPreferences = {};
        p.notificationPreferences[key] = toggle.checked;
        saveProgress(p);
        notify(
          (toggle.checked ? 'Enabled' : 'Disabled') + ' ' + key.replace(/([A-Z])/g, ' $1').toLowerCase(),
          'info'
        );
      });
    });
  }

  // ============================================================
  // THEME SELECTOR
  // ============================================================
  function initThemeSelector() {
    var currentTheme = localStorage.getItem('theme') || 'dark';

    dom.themeCards.forEach(function (card) {
      var theme = card.getAttribute('data-theme');
      if (theme === currentTheme) card.classList.add('active');

      card.addEventListener('click', function () {
        dom.themeCards.forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');

        var newTheme = card.getAttribute('data-theme');
        if (newTheme) {
          try {
            localStorage.setItem('theme', newTheme);
            if (newTheme === 'light') {
              document.documentElement.classList.add('light-mode');
            } else {
              document.documentElement.classList.remove('light-mode');
            }
            notify('Theme switched to ' + newTheme + ' mode.', 'success');
          } catch (e) {
            notify('Could not save theme preference.', 'error');
          }
        }
      });
    });
  }

  // ============================================================
  // BACK BUTTON
  // ============================================================
  function initBackButton() {
    if (!dom.backBtn) return;
    dom.backBtn.addEventListener('click', function () {
      if (document.referrer && document.referrer.indexOf(window.location.origin) === 0) {
        history.back();
      } else {
        window.location.href = '/';
      }
    });
  }

  // ============================================================
  // UTILITY
  // ============================================================
  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    cacheDom();
    initTabs();
    initBackButton();
    initAvatar();
    initProfileForm();
    initPasswordForm();
    initNotificationToggles();
    initThemeSelector();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
