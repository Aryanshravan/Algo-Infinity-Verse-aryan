/**
 * Support Center — Algo Infinity Verse
 * Handles: form validation, ToC scroll-spy, chat bubble, back-to-top,
 *          character counters, submission animations, and smooth scroll.
 */
(function () {
  "use strict";

  /* ── Feature flags (set once) ── */
  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)")
    .matches;

  /* ── Constants ── */
  const VALIDATION_RULES = {
    supportName: { min: 2, max: 100, label: "Name" },
    supportSubject: { min: 3, max: 100, label: "Subject" },
    supportMessage: { min: 10, max: 2000, label: "Message" },
    bugDescription: { min: 10, max: 2000, label: "Description" },
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const ANIMATION_DELAY = 1200; /* ms before success state resolves */

  /* ── DOM refs (populated on DOMContentLoaded) ── */
  const els = {};

  /* ── Initialise ── */
  function init() {
    cacheElements();
    if (!els.supportForm && !els.bugForm) return; /* nothing to do */

    initSupportForm();
    initBugForm();
    initCharCounters();
    initTocScrollSpy();
    initBackToTop();
    initChatFab();
    initFileInput();
    setTimeout(() => initScrollReveal(), 100);

    /* Clean up on navigate away */
    window.addEventListener("beforeunload", function () {
      window.removeEventListener("scroll", updateBackToTop);
    });
  }

  /* ── Cache DOM elements ── */
  function cacheElements() {
    els.supportForm = document.getElementById("supportForm");
    els.bugForm = document.getElementById("bugForm");
    els.supportSubmit = document.getElementById("supportSubmit");
    els.bugSubmit = document.getElementById("bugSubmit");
    els.supportThanks = document.getElementById("supportThanks");
    els.bugThanks = document.getElementById("bugThanks");
    els.chatFab = document.getElementById("chatFab");
    els.chatPreview = document.getElementById("chatPreview");
    els.chatPreviewClose = document.getElementById("chatPreviewClose");
    els.backToTop = document.getElementById("backToTop");
    els.tocLinks = document.querySelectorAll(".toc-link");
    els.sections = document.querySelectorAll(".content-section");
    els.chatQuickBtns = document.querySelectorAll(".chat-quick-btn");
  }

  /* ══════════════════════════════════════════
     SUPPORT FORM
     ══════════════════════════════════════════ */
  function initSupportForm() {
    if (!els.supportForm) return;

    const inputs = els.supportForm.querySelectorAll(
      "input, textarea, select"
    );

    /* Real-time validation on blur + clear on input */
    inputs.forEach(function (field) {
      field.addEventListener("blur", function () {
        validateField(this);
      });
      field.addEventListener("input", function () {
        clearFieldError(this);
      });
    });

    /* Submit */
    els.supportForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm("support")) return;
      handleSubmit(els.supportForm, els.supportSubmit, els.supportThanks);
    });
  }

  /* ══════════════════════════════════════════
     BUG FORM
     ══════════════════════════════════════════ */
  function initBugForm() {
    if (!els.bugForm) return;

    const inputs = els.bugForm.querySelectorAll(
      "input, textarea, select"
    );

    inputs.forEach(function (field) {
      field.addEventListener("blur", function () {
        validateField(this);
      });
      field.addEventListener("input", function () {
        clearFieldError(this);
      });
    });

    els.bugForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm("bug")) return;
      handleSubmit(els.bugForm, els.bugSubmit, els.bugThanks);
    });
  }

  /* ══════════════════════════════════════════
     FIELD VALIDATION
     ══════════════════════════════════════════ */

  /** Validate a single field and show/hide error tooltip. */
  function validateField(field) {
    if (!field || !field.id) return;
    var id = field.id;
    var value = (field.value || "").trim();
    var errorEl = document.getElementById(id + "Error");
    var message = "";

    /* Required check */
    if (field.required && !value) {
      message = getLabel(id) + " is required.";
    } else if (id === "supportEmail") {
      if (value && !EMAIL_REGEX.test(value)) {
        message = "Enter a valid email address.";
      }
    } else if (id === "bugType") {
      if (!value) {
        message = "Select a bug type.";
      }
    } else {
      var rule = VALIDATION_RULES[id];
      if (rule && value) {
        if (value.length < rule.min) {
          message =
            rule.label + " must be at least " + rule.min + " characters.";
        } else if (value.length > rule.max) {
          message =
            rule.label + " must be under " + rule.max + " characters.";
        }
      }
    }

    if (message) {
      showFieldError(field, errorEl, message);
      return false;
    }

    showFieldSuccess(field, errorEl);
    return true;
  }

  /** Validate all fields in a form (formName = "support" | "bug"). */
  function validateForm(formName) {
    var form = formName === "support" ? els.supportForm : els.bugForm;
    var fields = form.querySelectorAll(
      "input, textarea, select"
    );
    var isValid = true;

    fields.forEach(function (field) {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /** Show error tooltip for a field. */
  function showFieldError(field, errorEl, message) {
    field.classList.add("has-error");
    field.classList.remove("has-success");
    field.setAttribute("aria-invalid", "true");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("visible");
    }
  }

  /** Clear error and show success state. */
  function showFieldSuccess(field, errorEl) {
    field.classList.remove("has-error");
    field.classList.add("has-success");
    field.setAttribute("aria-invalid", "false");
    if (errorEl) {
      errorEl.classList.remove("visible");
      errorEl.textContent = "";
    }
  }

  /** Clear all error/success states on input. */
  function clearFieldError(field) {
    field.classList.remove("has-error", "has-success");
    field.setAttribute("aria-invalid", "false");
    var errorEl = document.getElementById(field.id + "Error");
    if (errorEl) {
      errorEl.classList.remove("visible");
      errorEl.textContent = "";
    }
  }

  /** Derive a human-readable label from a field name. */
  function getLabel(id) {
    var map = {
      supportName: "Name",
      supportEmail: "Email",
      supportSubject: "Subject",
      supportMessage: "Message",
      bugType: "Bug type",
      bugDescription: "Description",
    };
    return map[id] || "This field";
  }

  /* ══════════════════════════════════════════
     CHARACTER COUNTERS
     ══════════════════════════════════════════ */
  function initCharCounters() {
    var pairs = [
      { textarea: "supportMessage", fill: "supportCharFill", num: "supportCharCountNum" },
      { textarea: "bugDescription", fill: "bugCharFill", num: "bugCharCountNum" },
    ];

    pairs.forEach(function (pair) {
      var ta = document.getElementById(pair.textarea);
      var fill = document.getElementById(pair.fill);
      var num = document.getElementById(pair.num);
      if (!ta || !fill || !num) return;

      ta.addEventListener("input", function () {
        var len = ta.value.length;
        var max = parseInt(ta.getAttribute("maxlength"), 10) || 2000;
        var pct = Math.min((len / max) * 100, 100);

        num.textContent = len;
        fill.style.width = pct + "%";

        /* Color coding */
        fill.classList.remove("warning", "danger");
        if (pct > 90) fill.classList.add("danger");
        else if (pct > 75) fill.classList.add("warning");

        /* Prevent overflow gracefully */
        if (len >= max) {
          ta.value = ta.value.substring(0, max);
          num.textContent = max;
          fill.style.width = "100%";
        }
      });
    });
  }

  /* ══════════════════════════════════════════
     SUBMIT HANDLER (with micro-animations)
     ══════════════════════════════════════════ */
  function handleSubmit(form, btn, thanksEl) {
    if (!btn || !thanksEl) return;

    /* Disable and show spinner */
    btn.disabled = true;
    btn.classList.remove("is-success");
    btn.classList.add("is-loading");

    /* Reset any previous success */
    thanksEl.hidden = true;

    /* Simulate async submission */
    setTimeout(function () {
      btn.classList.remove("is-loading");
      btn.classList.add("is-success");

      setTimeout(function () {
        /* Show thanks message */
        thanksEl.hidden = false;
        form.querySelectorAll(
          "input, textarea, select"
        ).forEach(function (f) {
          f.value = "";
          f.classList.remove("has-success", "has-error");
        });

        /* Reset char counters */
        var fills = form.querySelectorAll(".char-progress-fill");
        fills.forEach(function (f) {
          f.style.width = "0%";
          f.classList.remove("warning", "danger");
        });
        form.querySelectorAll(".char-count-text span").forEach(function (s) {
          s.textContent = "0";
        });

        /* Reset file input placeholder */
        var filePlaceholder = form.querySelector(
          "#bugFileName"
        );
        if (filePlaceholder) {
          filePlaceholder.textContent = "Choose an image\u2026";
        }

        /* After a delay, reset button */
        setTimeout(function () {
          btn.classList.remove("is-success");
          btn.disabled = false;
        }, 2000);
      }, 600);
    }, ANIMATION_DELAY);
  }

  /* ══════════════════════════════════════════
     ToC SCROLL SPY
     ══════════════════════════════════════════ */
  function initTocScrollSpy() {
    if (!els.tocLinks.length || !els.sections.length) return;

    var ticking = false;

    function updateActiveLink() {
      var scrollPos = window.scrollY + 120; /* offset for sticky navbar */

      var currentId = "";
      els.sections.forEach(function (section) {
        var top = section.offsetTop;
        var bottom = top + section.offsetHeight;
        if (scrollPos >= top && scrollPos < bottom) {
          currentId = section.getAttribute("id");
        }
      });

      /* Fallback to last section if scrolled past everything */
      if (!currentId && els.sections.length) {
        var last = els.sections[els.sections.length - 1];
        if (window.scrollY + window.innerHeight >= last.offsetTop + last.offsetHeight) {
          currentId = last.getAttribute("id");
        }
      }

      els.tocLinks.forEach(function (link) {
        var href = link.getAttribute("href");
        link.classList.toggle(
          "active",
          href === "#" + currentId
        );
      });
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(function () {
          updateActiveLink();
          updateBackToTop();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    /* Initial check */
    setTimeout(updateActiveLink, 150);

    /* Smooth scroll ToC clicks */
    els.tocLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var targetId = link.getAttribute("href");
        if (targetId && targetId.startsWith("#")) {
          e.preventDefault();
          var target = document.querySelector(targetId);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            /* Update URL without jump */
            history.pushState(null, "", targetId);
          }
        }
      });
    });
  }

  /* ══════════════════════════════════════════
     BACK TO TOP
     ══════════════════════════════════════════ */
  function initBackToTop() {
    if (!els.backToTop) return;

    els.backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function updateBackToTop() {
    if (!els.backToTop) return;
    var threshold = 400;
    els.backToTop.classList.toggle("visible", window.scrollY > threshold);
  }

  /* ══════════════════════════════════════════
     CHAT FAB
     ══════════════════════════════════════════ */
  function initChatFab() {
    if (!els.chatFab || !els.chatPreview) return;

    els.chatFab.addEventListener("click", function () {
      var isOpen = !els.chatPreview.hidden;
      els.chatPreview.hidden = isOpen;
      els.chatFab.setAttribute("aria-expanded", !isOpen);
    });

    if (els.chatPreviewClose) {
      els.chatPreviewClose.addEventListener("click", function () {
        els.chatPreview.hidden = true;
        els.chatFab.setAttribute("aria-expanded", "false");
      });
    }

    /* Quick-reply buttons */
    els.chatQuickBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        els.chatPreview.hidden = true;
        els.chatFab.setAttribute("aria-expanded", "false");

        /* Map query to section */
        var queryMap = {
          account: "support-request",
          bug: "bug-report",
          progress: "support-request",
          speak: "support-request",
        };
        var targetId = queryMap[btn.getAttribute("data-query")] || "support-request";
        var target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          /* Open the FAQ category if applicable */
          if (target.tagName === "DETAILS" && !target.open) {
            target.open = true;
          }
        }
      });
    });

    /* Close chat preview on Escape */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && els.chatPreview && !els.chatPreview.hidden) {
        els.chatPreview.hidden = true;
        els.chatFab.setAttribute("aria-expanded", "false");
        els.chatFab.focus();
      }
    });
  }

  /* ══════════════════════════════════════════
     FILE INPUT
     ══════════════════════════════════════════ */
  function initFileInput() {
    var fileInput = document.getElementById("bugFile");
    var fileName = document.getElementById("bugFileName");
    if (!fileInput || !fileName) return;

    fileInput.addEventListener("change", function () {
      if (fileInput.files && fileInput.files.length > 0) {
        fileName.textContent = fileInput.files[0].name;
      } else {
        fileName.textContent = "Choose an image\u2026";
      }
    });
  }

  /* ══════════════════════════════════════════
     SCROLL REVEAL (light fade-in on section visibility)
     ══════════════════════════════════════════ */
  function initScrollReveal() {
    if (REDUCED_MOTION) return;
    /* Sections already have animation: sectionReveal via CSS,
       so we only need to stagger them slightly. */
    els.sections.forEach(function (section, index) {
      section.style.animationDelay = index * 0.08 + "s";
    });
  }

  /* ── Boot ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
