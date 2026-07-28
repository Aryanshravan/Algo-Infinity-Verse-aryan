(function () {
  'use strict';

  /* ---- DOM Cache ---- */
  var dom = {
    analyzeBtn: document.getElementById('analyzeBtn'),
    repoUrlInput: document.getElementById('repoUrlInput'),
    errorBanner: document.getElementById('errorBanner'),
    errorText: document.getElementById('errorText'),
    errorDismiss: document.getElementById('errorDismiss'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    resultsContainer: document.getElementById('resultsContainer'),
    scoreDisplay: document.getElementById('scoreDisplay'),
    scoreCircle: document.getElementById('scoreCircle'),
    scoreLabel: document.getElementById('scoreLabel'),
    depsIcon: document.getElementById('depsIcon'),
    depsText: document.getElementById('depsText'),
    testsIcon: document.getElementById('testsIcon'),
    testsText: document.getElementById('testsText'),
    linterIcon: document.getElementById('linterIcon'),
    linterText: document.getElementById('linterText'),
    formatterIcon: document.getElementById('formatterIcon'),
    formatterText: document.getElementById('formatterText'),
    sastIcon: document.getElementById('sastIcon'),
    sastText: document.getElementById('sastText'),
    depScanIcon: document.getElementById('depScanIcon'),
    depScanText: document.getElementById('depScanText'),
    readmeIcon: document.getElementById('readmeIcon'),
    readmeText: document.getElementById('readmeText'),
    licenseIcon: document.getElementById('licenseIcon'),
    licenseText: document.getElementById('licenseText'),
    ciCdScore: document.getElementById('ciCdScore'),
    codeQualityScore: document.getElementById('codeQualityScore'),
    securityScore: document.getElementById('securityScore'),
    docsScore: document.getElementById('docsScore'),
    recommendationsList: document.getElementById('recommendationsList'),
    warningsBanner: document.getElementById('warningsBanner'),
    warningsList: document.getElementById('warningsList'),
  };

  /* ---- Validation ---- */

  function validateUrl(raw) {
    if (!raw || raw.trim().length === 0) {
      return 'Enter a repository URL to analyze.';
    }
    try {
      var parsed = new URL(raw.trim());
      var host = parsed.hostname.toLowerCase();
      if (
        !host.includes('github.com') &&
        !host.includes('gitlab.com') &&
        !host.includes('bitbucket.org')
      ) {
        return 'URL must point to a GitHub, GitLab, or Bitbucket repository.';
      }
      return null;
    } catch (_) {
      return 'Enter a valid URL (e.g. https://github.com/user/repo).';
    }
  }

  function sanitizeUrl(raw) {
    return raw.trim();
  }

  /* ---- Escape HTML (XSS prevention) ---- */

  function escapeHtml(text) {
    var el = document.createElement('div');
    el.appendChild(document.createTextNode(text));
    return el.innerHTML;
  }

  /* ---- Error Banner ---- */

  function showError(message) {
    dom.errorText.textContent = message;
    dom.errorBanner.classList.add('visible');
  }

  function hideError() {
    dom.errorBanner.classList.remove('visible');
    dom.errorText.textContent = '';
  }

  /* ---- Loading State ---- */

  function setLoading(loading) {
    if (loading) {
      dom.loadingIndicator.classList.add('visible');
      dom.resultsContainer.classList.remove('visible');
      dom.analyzeBtn.disabled = true;
    } else {
      dom.loadingIndicator.classList.remove('visible');
      dom.analyzeBtn.disabled = false;
    }
  }

  /* ---- Score Animation ---- */

  function animateScore(target) {
    var current = 0;
    var frame = 0;
    var totalFrames = 30;
    var step = target / totalFrames;

    dom.scoreDisplay.textContent = '0';

    function tick() {
      frame++;
      if (frame >= totalFrames) {
        dom.scoreDisplay.textContent = target;
        updateScoreColor(target);
        return;
      }
      current = Math.round(step * frame);
      dom.scoreDisplay.textContent = current;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* ---- Score Color ---- */

  function updateScoreColor(score) {
    var circle = dom.scoreCircle;
    // Remove existing color classes
    circle.classList.remove('score-low', 'score-mid', 'score-high', 'score-excellent');

    if (score >= 80) {
      circle.classList.add('score-excellent');
    } else if (score >= 60) {
      circle.classList.add('score-high');
    } else if (score >= 40) {
      circle.classList.add('score-mid');
    } else {
      circle.classList.add('score-low');
    }
  }

  /* ---- Helper: set card status (uses safe DOM methods, no innerHTML for dynamic content) ---- */

  function setCardIcon(iconEl, isSuccess) {
    // Clear previous content
    while (iconEl.firstChild) {
      iconEl.removeChild(iconEl.firstChild);
    }
    var icon = document.createElement('i');
    icon.className = isSuccess
      ? 'fas fa-check-circle icon-success'
      : 'fas fa-times-circle icon-error';
    iconEl.appendChild(icon);
  }

  function setCardStatus(iconEl, textEl, isPresent, presentLabel, missingLabel) {
    setCardIcon(iconEl, isPresent);
    textEl.textContent = isPresent ? (presentLabel || 'Configured') : (missingLabel || 'Missing');
  }

  /* ---- Helper: set category score ---- */

  function setCategoryScore(element, score) {
    if (typeof score === 'number') {
      element.textContent = score + '/100';
    } else {
      element.textContent = '-';
    }
  }

  /* ---- Main Analysis ---- */

  function handleAnalysis() {
    hideError();

    var rawUrl = dom.repoUrlInput.value;
    var error = validateUrl(rawUrl);

    if (error) {
      showError(error);
      return;
    }

    var repoUrl = sanitizeUrl(rawUrl);
    setLoading(true);

    fetch('/api/analyze-repository', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl: repoUrl }),
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (data) {
            throw new Error(data.error || 'Failed to analyze repository.');
          });
        }
        return response.json();
      })
      .then(function (data) {
        // Overall health score
        animateScore(data.overallScore !== undefined ? data.overallScore : 0);

        // ── Category scores ────────────────────────────────────────────────
        setCategoryScore(dom.ciCdScore, data.ciCd ? data.ciCd.score : 0);
        setCategoryScore(dom.codeQualityScore, data.codeQuality ? data.codeQuality.score : 0);
        setCategoryScore(dom.securityScore, data.security ? data.security.score : 0);
        setCategoryScore(dom.docsScore, data.documentation ? data.documentation.score : 0);

        // ── CI/CD details ──────────────────────────────────────────────────
        var ciCd = data.ciCd || {};
        setCardStatus(dom.depsIcon, dom.depsText, ciCd.hasDependencies);
        setCardStatus(dom.testsIcon, dom.testsText, ciCd.hasTests);

        // ── Code Quality details ───────────────────────────────────────────
        var codeQuality = data.codeQuality || {};
        setCardStatus(dom.linterIcon, dom.linterText, codeQuality.hasLinter, 'Configured', 'Missing');
        setCardStatus(dom.formatterIcon, dom.formatterText, codeQuality.hasFormatter, 'Configured', 'Missing');

        // ── Security details ───────────────────────────────────────────────
        var security = data.security || {};
        setCardStatus(dom.sastIcon, dom.sastText, security.hasSast, 'Configured', 'Missing');
        setCardStatus(dom.depScanIcon, dom.depScanText, security.hasDependencyScan, 'Configured', 'Missing');

        // ── Documentation details ──────────────────────────────────────────
        var docs = data.documentation || {};
        setCardStatus(dom.readmeIcon, dom.readmeText, docs.hasReadme, 'Present', 'Missing');
        setCardStatus(dom.licenseIcon, dom.licenseText, docs.hasLicense, 'Present', 'Missing');

        // ── Recommendations ────────────────────────────────────────────────
        if (data.recommendations && data.recommendations.length > 0) {
          dom.recommendationsList.innerHTML = data.recommendations
            .map(function (rec) {
              return (
                '<li><i class="fas fa-arrow-right"></i> ' +
                escapeHtml(rec) +
                '</li>'
              );
            })
            .join('');
        } else {
          dom.recommendationsList.innerHTML =
            '<li><i class="fas fa-check-circle" style="color: var(--ra-emerald)"></i> No recommendations needed — your repository looks solid.</li>';
        }

        // ── Warnings (API errors like rate limiting) ─────────────────────
        if (data.warnings && data.warnings.length > 0) {
          dom.warningsBanner.style.display = 'flex';
          dom.warningsList.innerHTML = data.warnings
            .map(function (w) {
              return '<div class="ra-warning-item">' + escapeHtml(w) + '</div>';
            })
            .join('');
        } else {
          dom.warningsBanner.style.display = 'none';
        }

        dom.resultsContainer.classList.add('visible');
      })
      .catch(function (err) {
        console.error('Analysis error:', err);
        showError(err.message || 'An unexpected error occurred.');
      })
      .finally(function () {
        setLoading(false);
      });
  }

  /* ---- Event Wiring ---- */

  dom.analyzeBtn.addEventListener('click', handleAnalysis);

  dom.repoUrlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      dom.analyzeBtn.click();
    }
  });

  dom.errorDismiss.addEventListener('click', hideError);
})();
