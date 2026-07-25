/**
 * Bulk Repository Analyzer — Client Logic
 * - Drag-and-drop CSV upload with animated feedback
 * - Live polling with per-row status indicators
 * - Animated stat counters and gradient progress bar
 * - Clean results table with score badges
 */

(function () {
  'use strict';

  /* ── DOM References ─────────────────────────── */
  const dropZone = document.getElementById('dropZone');
  const csvInput = document.getElementById('csvInput');
  const progressSection = document.getElementById('progressSection');
  const totalCount = document.getElementById('totalCount');
  const completedCount = document.getElementById('completedCount');
  const failedCount = document.getElementById('failedCount');
  const progressBar = document.getElementById('progressBar');
  const progressPct = document.getElementById('progressPct');
  const statusList = document.getElementById('statusList');
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsTable = document.getElementById('resultsTable');
  const resultsBody = document.getElementById('resultsBody');
  const resultsCount = document.getElementById('resultsCount');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorBanner = document.getElementById('errorBanner');
  const errorText = document.getElementById('errorText');
  const errorDismiss = document.getElementById('errorDismiss');
  const batchBadge = document.getElementById('batchBadge');

  /* ── State ──────────────────────────────────── */
  let pollTimeoutId = null;
  let isUploading = false;
  let isPollingActive = false;

  /* ── Constants ──────────────────────────────── */
  const POLL_INTERVAL_MS = 1000;
  const API_BULK_URL = '/api/audit/bulk';

  /* ── Utility Functions ──────────────────────── */

  /** Animate a number element from 0 to its target value */
  function animateCounter(element, target, duration) {
    if (!element) return;
    const start = performance.now();
    const initial = 0;

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(initial + (target - initial) * eased);
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  /** Truncate a repo URL to owner/name format */
  function formatRepoName(url) {
    if (typeof url !== 'string') return 'Unknown';
    try {
      const parts = url.split('/').filter(Boolean);
      return parts.slice(-2).join('/');
    } catch (_) {
      return url;
    }
  }

  /** Get the CSS class for a score badge */
  function scoreBadgeClass(score) {
    if (typeof score !== 'number') return 'bra-score-badge--low';
    if (score >= 80) return 'bra-score-badge--high';
    if (score >= 50) return 'bra-score-badge--mid';
    return 'bra-score-badge--low';
  }

  /** Get status dot class based on result state */
  function statusDotClass(result) {
    if (result.error) return 'bra-status-dot--failed';
    if (result.score !== undefined && result.score !== null) return 'bra-status-dot--done';
    return 'bra-status-dot--analyzing';
  }

  /** Get human-readable status label */
  function statusLabel(result) {
    if (result.error) return 'Failed';
    if (result.score !== undefined && result.score !== null) return 'Complete';
    return 'Analyzing';
  }

  /* ── Error Display ──────────────────────────── */

  function showError(message) {
    if (!errorBanner || !errorText) return;
    errorText.textContent = message || 'An unexpected error occurred. Please try again.';
    errorBanner.classList.add('is-visible');
  }

  function hideError() {
    if (!errorBanner) return;
    errorBanner.classList.remove('is-visible');
  }

  if (errorDismiss) {
    errorDismiss.addEventListener('click', hideError);
  }

  /* ── Upload Flow ────────────────────────────── */

  function validateFile(file) {
    if (!file) return 'No file selected.';
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Please upload a file with a .csv extension.';
    }
    if (file.size === 0) {
      return 'The uploaded file is empty.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File is too large. Maximum size is 10 MB.';
    }
    return null;
  }

  async function handleUpload() {
    if (isUploading) return;
    if (!csvInput || !csvInput.files || csvInput.files.length === 0) return;

    const file = csvInput.files[0];
    const validationError = validateFile(file);
    if (validationError) {
      showError(validationError);
      return;
    }

    isUploading = true;
    hideError();

    const formData = new FormData();
    formData.append('csv', file);

    try {
      // Transition UI: hide upload zone, show progress section
      if (dropZone) dropZone.style.display = 'none';
      if (progressSection) {
        progressSection.classList.add('is-visible');
      }
      if (loadingIndicator) loadingIndicator.classList.add('is-visible');

      const response = await fetch(API_BULK_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = 'Upload failed. Please try again.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (_) {
          // Use default error message
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data && data.batchId) {
        if (totalCount) totalCount.textContent = data.totalJobs || 0;

        // Initialize status list with pending rows
        renderPendingRows(data.totalJobs || 0);

        // Clear file input so the same file can be re-uploaded
        if (csvInput) csvInput.value = '';

        // Start polling
        pollProgress(data.batchId);
      } else {
        throw new Error('Invalid server response: missing batch ID.');
      }
    } catch (err) {
      console.error('[BulkAnalyzer] Upload error:', err);
      showError(err.message || 'Upload failed. Please try again.');

      // Reset UI
      if (dropZone) dropZone.style.display = '';
      if (progressSection) progressSection.classList.remove('is-visible');
      if (loadingIndicator) loadingIndicator.classList.remove('is-visible');

      isUploading = false;
    }
  }

  /* ── Polling (recursive setTimeout to avoid overlaps) ── */

  function pollProgress(batchId) {
    if (isPollingActive) {
      cancelPolling();
    }
    isPollingActive = true;
    schedulePoll(batchId);
  }

  function schedulePoll(batchId) {
    if (!isPollingActive) return;

    pollTimeoutId = setTimeout(async function () {
      try {
        const response = await fetch(API_BULK_URL + '/' + encodeURIComponent(batchId));

        if (!response.ok) {
          if (response.status === 404) {
            cancelPolling();
            showError('Analysis batch not found. It may have expired.');
            return;
          }
          throw new Error('Polling request failed with status ' + response.status);
        }

        const data = await response.json();

        if (data) {
          updateDashboard(data);

          if (data.status === 'completed' || data.progress >= 100) {
            cancelPolling();
            if (loadingIndicator) loadingIndicator.classList.remove('is-visible');
            renderResults(data.results || []);
            return;
          }
        }

        // Schedule next poll
        schedulePoll(batchId);
      } catch (err) {
        console.error('[BulkAnalyzer] Polling error:', err);
        // Retry after delay on transient errors
        if (isPollingActive) {
          schedulePoll(batchId);
        }
      }
    }, POLL_INTERVAL_MS);
  }

  function cancelPolling() {
    isPollingActive = false;
    if (pollTimeoutId) {
      clearTimeout(pollTimeoutId);
      pollTimeoutId = null;
    }
  }

  /* ── Dashboard Updates ──────────────────────── */

  function updateDashboard(data) {
    // Update stat counters with animation
    if (data.completed !== undefined && completedCount) {
      animateCounter(completedCount, data.completed, 400);
    }
    if (data.failed !== undefined && failedCount) {
      animateCounter(failedCount, data.failed, 400);
    }
    if (data.total !== undefined && totalCount) {
      totalCount.textContent = data.total;
    }

    // Update progress bar
    const pct = Math.min(Math.max(data.progress || 0, 0), 100);
    if (progressBar) {
      progressBar.style.width = pct + '%';
      progressBar.setAttribute('aria-valuenow', pct);
    }
    if (progressPct) {
      progressPct.textContent = pct + '%';
    }

    // Update per-row status indicators
    if (data.results && Array.isArray(data.results)) {
      updateStatusRows(data.results);
    }

    // Update batch badge
    if (batchBadge && pct < 100) {
      batchBadge.innerHTML = '<i class="fas fa-bolt"></i> <span>' + pct + '%</span>';
    } else if (batchBadge && pct >= 100) {
      batchBadge.innerHTML = '<i class="fas fa-check-circle"></i> <span>Complete</span>';
    }

    // Hide loading spinner once we have real data
    if (loadingIndicator && data.progress > 0) {
      loadingIndicator.classList.remove('is-visible');
    }
  }

  /* ── Status Rows (Live Per-Item Progress) ───── */

  function renderPendingRows(count) {
    if (!statusList) return;
    statusList.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const row = createStatusRow(null, 'queued');
      row.style.animationDelay = (i * 30) + 'ms';
      statusList.appendChild(row);
    }
  }

  function createStatusRow(result, forceState) {
    const row = document.createElement('div');
    row.className = 'bra-status-row';

    const dot = document.createElement('span');
    dot.className = 'bra-status-dot';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'bra-status-repo';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'bra-status-label';

    if (result) {
      const repoName = formatRepoName(result.repoUrl || '');
      nameSpan.textContent = repoName;

      if (result.error) {
        dot.className += ' bra-status-dot--failed';
        labelSpan.textContent = 'Failed';
        labelSpan.className += ' bra-status-label--failed';
      } else if (result.score !== undefined && result.score !== null) {
        dot.className += ' bra-status-dot--done';
        labelSpan.textContent = 'Complete';
        labelSpan.className += ' bra-status-label--done';
      } else {
        dot.className += ' bra-status-dot--analyzing';
        labelSpan.textContent = 'Analyzing';
        labelSpan.className += ' bra-status-label--analyzing';
      }
    } else if (forceState === 'failed') {
      dot.className += ' bra-status-dot--failed';
      nameSpan.textContent = 'Unknown';
      labelSpan.textContent = 'Failed';
      labelSpan.className += ' bra-status-label--failed';
    } else if (forceState === 'done') {
      dot.className += ' bra-status-dot--done';
      nameSpan.textContent = 'Unknown';
      labelSpan.textContent = 'Complete';
      labelSpan.className += ' bra-status-label--done';
    } else {
      dot.className += ' bra-status-dot--queued';
      nameSpan.textContent = 'Waiting...';
      labelSpan.textContent = 'Queued';
    }

    row.appendChild(dot);
    row.appendChild(nameSpan);
    row.appendChild(labelSpan);

    return row;
  }

  function updateStatusRows(results) {
    if (!statusList || !Array.isArray(results) || results.length === 0) return;

    // Only update if we have new data in results
    const existingRows = statusList.querySelectorAll('.bra-status-row');

    results.forEach(function (result, i) {
      let row;
      if (i < existingRows.length) {
        row = existingRows[i];
      } else {
        row = createStatusRow(result);
        statusList.appendChild(row);
      }

      const repoName = formatRepoName(result.repoUrl || '');
      const nameEl = row.querySelector('.bra-status-repo');
      const dotEl = row.querySelector('.bra-status-dot');
      const labelEl = row.querySelector('.bra-status-label');

      if (nameEl) nameEl.textContent = repoName;

      if (dotEl) {
        dotEl.className = 'bra-status-dot ' + statusDotClass(result);
      }

      if (labelEl) {
        const label = statusLabel(result);
        labelEl.textContent = label;
        labelEl.className = 'bra-status-label bra-status-label--' + (result.error ? 'failed' : (result.score !== undefined && result.score !== null ? 'done' : 'analyzing'));
      }
    });
  }

  /* ── Results Table ──────────────────────────── */

  function renderResults(results) {
    if (!resultsBody || !resultsContainer || !resultsTable) return;

    resultsBody.innerHTML = '';
    resultsContainer.classList.add('is-visible');

    if (!results || results.length === 0) {
      // Show empty state
      resultsBody.innerHTML =
        '<tr><td colspan="3" style="text-align:center;padding:2rem;color:var(--bra-text-muted);">No results returned from analysis.</td></tr>';
      if (resultsCount) resultsCount.textContent = '0 repositories';
      return;
    }

    if (resultsCount) {
      resultsCount.textContent = results.length + ' ' + (results.length === 1 ? 'repository' : 'repositories');
    }

    results.forEach(function (res, index) {
      const tr = document.createElement('tr');
      tr.style.animationDelay = (index * 40) + 'ms';

      const repoName = formatRepoName(res.repoUrl || '');
      const scoreClass = scoreBadgeClass(res.score);
      const isError = Boolean(res.error);

      // Repository cell
      const repoCell = document.createElement('td');
      const safeUrl = sanitizeUrl(res.repoUrl);
      repoCell.innerHTML =
        '<div class="bra-repo-cell">' +
          '<span class="bra-repo-icon" aria-hidden="true"><i class="fab fa-github"></i></span>' +
          '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" class="bra-repo-link">' +
            escapeHtml(repoName) +
          '</a>' +
        '</div>';

      // Score cell
      const scoreCell = document.createElement('td');
      scoreCell.className = 'bra-score';
      if (isError) {
        scoreCell.innerHTML = '<span class="bra-score-badge ' + scoreClass + '">N/A</span>';
      } else {
        scoreCell.innerHTML = '<span class="bra-score-badge ' + scoreClass + '">' +
          escapeHtml(String(res.score)) + '/100</span>';
      }

      // Status cell
      const statusCell = document.createElement('td');
      if (isError) {
        statusCell.className = 'bra-status-cell bra-status-cell--error';
        statusCell.innerHTML =
          '<i class="fas fa-times-circle" aria-hidden="true"></i> ' +
          '<span>' + escapeHtml(res.error || 'Failed') + '</span>';
      } else {
        statusCell.className = 'bra-status-cell bra-status-cell--success';
        statusCell.innerHTML =
          '<i class="fas fa-check-circle" aria-hidden="true"></i> ' +
          '<span>Success</span>';
      }

      tr.appendChild(repoCell);
      tr.appendChild(scoreCell);
      tr.appendChild(statusCell);
      resultsBody.appendChild(tr);
    });

    // Scroll results into view smoothly
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── Minimal sanitization helpers ────────────── */

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Validate and sanitize a URL for use in href attributes */
  function sanitizeUrl(url) {
    if (typeof url !== 'string') return '#';
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return escapeAttr(parsed.href);
      }
    } catch (_) {
      // Invalid URL
    }
    return '#';
  }

  /* ── Drag-and-Drop Events ───────────────────── */

  if (dropZone) {
    // Mouse drag events
    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        if (csvInput) {
          csvInput.files = e.dataTransfer.files;
          handleUpload();
        }
      }
    });

    // Click to open file picker
    dropZone.addEventListener('click', function () {
      if (csvInput && !isUploading) csvInput.click();
    });

    // Keyboard accessibility: Enter/Space to activate
    dropZone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (csvInput && !isUploading) csvInput.click();
      }
    });

    // Track mouse position for the radial gradient effect
    dropZone.addEventListener('mousemove', function (e) {
      const rect = dropZone.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      dropZone.style.setProperty('--mouse-x', x + '%');
      dropZone.style.setProperty('--mouse-y', y + '%');
    });
  }

  if (csvInput) {
    csvInput.addEventListener('change', handleUpload);
  }

  /* ── Cleanup on unload ──────────────────────── */

  window.addEventListener('beforeunload', function () {
    cancelPolling();
  });

  window.addEventListener('pagehide', function () {
    cancelPolling();
  });

  /* ── File validation on input change ────────── */

  if (csvInput) {
    csvInput.addEventListener('change', function () {
      hideError();
    });
  }

})();
