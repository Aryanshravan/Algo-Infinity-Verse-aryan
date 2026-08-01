/* ═══════════════════════════════════════════════════════
   API Playground – Mini Postman Tool
   ═══════════════════════════════════════════════════════
   Features:
     - Send GET / POST / PUT / PATCH / DELETE / HEAD requests
     - Custom headers editor (key-value pairs)
     - JSON request body editor with validation
     - Formatted response viewer (JSON syntax highlighting)
     - Response time, status code, and size tracking
     - Response headers viewer
     - Request history with localStorage persistence
     - Copy response, clear/delete history, replay requests
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ============================================================
  //  CONSTANTS
  // ============================================================

  var STORAGE_KEY = 'apiPlayground_history';
  var MAX_HISTORY_ITEMS = 50;
  var PROXY_ENDPOINT = '/api/proxy/request';

  // ============================================================
  //  DOM REFS
  // ============================================================

  var dom = {};

  function cacheDom() {
    dom.methodSelect = document.getElementById('apiMethod');
    dom.urlInput = document.getElementById('apiUrl');
    dom.sendBtn = document.getElementById('apiSendBtn');
    dom.sendBtnText = document.getElementById('apiSendBtnText');

    dom.headersToggle = document.getElementById('headersToggle');
    dom.headersBody = document.getElementById('headersBody');
    dom.headersCount = document.getElementById('headersCount');
    dom.headersContainer = document.getElementById('headersContainer');

    dom.paramsToggle = document.getElementById('paramsToggle');
    dom.paramsBody = document.getElementById('paramsBody');
    dom.paramsContainer = document.getElementById('paramsContainer');

    dom.bodySection = document.getElementById('bodySection');
    dom.bodyEditor = document.getElementById('requestBody');
    dom.bodyHint = document.getElementById('bodyValidationHint');

    dom.responsePanel = document.getElementById('responsePanel');
    dom.responseStatus = document.getElementById('responseStatus');
    dom.responseTime = document.getElementById('responseTime');
    dom.responseSize = document.getElementById('responseSize');
    dom.responseContent = document.getElementById('responseContent');
    dom.responseTabs = document.getElementById('responseTabs');
    dom.copyResponseBtn = document.getElementById('copyResponseBtn');
    dom.prettyPrintBtn = document.getElementById('prettyPrintBtn');

    dom.historyList = document.getElementById('historyList');
    dom.historyEmpty = document.getElementById('historyEmpty');
    dom.clearHistoryBtn = document.getElementById('clearHistoryBtn');

    dom.toastContainer = document.getElementById('toastContainer');
  }

  // ============================================================
  //  STATE
  // ============================================================

  var state = {
    history: [],
    activeTab: 'body',
    sending: false,
    lastResponse: null,
    responseHeaders: null,
    proxyTime: null,
  };

  // ============================================================
  //  LOCAL STORAGE – HISTORY
  // ============================================================

  function loadHistory() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state.history = JSON.parse(raw);
        if (!Array.isArray(state.history)) {
          state.history = [];
        }
      }
    } catch (_e) {
      state.history = [];
    }
  }

  function persistHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
    } catch (_e) {
      // localStorage full or unavailable – silently fail
    }
  }

  function addHistoryEntry(entry) {
    state.history.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      method: entry.method || 'GET',
      url: entry.url || '',
      status: entry.status,
      statusText: entry.statusText,
      time: entry.time,
      size: entry.size,
      // Store full request details for replay
      requestHeaders: entry.requestHeaders || null,
      requestBody: entry.requestBody || null,
    });

    // Enforce max items
    if (state.history.length > MAX_HISTORY_ITEMS) {
      state.history = state.history.slice(0, MAX_HISTORY_ITEMS);
    }

    persistHistory();
    renderHistory();
  }

  function clearHistory() {
    state.history = [];
    persistHistory();
    renderHistory();
    showToast('History cleared', 'info');
  }

  function deleteHistoryEntry(id) {
    state.history = state.history.filter(function (e) {
      return e.id !== id;
    });
    persistHistory();
    renderHistory();
  }

  // ============================================================
  //  RENDER – HISTORY
  // ============================================================

  function renderHistory() {
    if (!dom.historyList) return;

    if (state.history.length === 0) {
      dom.historyList.innerHTML =
        '<div class="history-empty" style="display:flex;padding:32px 16px;">' +
        '<i class="fas fa-inbox"></i>' +
        '<p>No requests yet</p>' +
        '<p class="hint">Send your first request to start tracking history</p>' +
        '</div>';
      if (dom.historyEmpty) dom.historyEmpty.style.display = 'none';
      if (dom.clearHistoryBtn) dom.clearHistoryBtn.style.display = 'none';
      return;
    }

    if (dom.historyEmpty) dom.historyEmpty.style.display = 'none';
    if (dom.clearHistoryBtn) dom.clearHistoryBtn.style.display = 'inline-flex';

    dom.historyList.innerHTML = state.history
      .map(function (entry) {
        var statusClass = getStatusClass(entry.status);
        var timeStr = formatTimestamp(entry.timestamp);
        var methodClass = 'method-' + entry.method.toLowerCase();

        return (
          '<div class="history-item" data-id="' +
          escapeHtml(entry.id) +
          '">' +
          '  <span class="method-badge ' +
          methodClass +
          '">' +
          escapeHtml(entry.method) +
          '</span>' +
          '  <span class="history-url" title="' +
          escapeHtml(entry.url) +
          '">' +
          escapeHtml(entry.url) +
          '</span>' +
          '  <div style="display:flex;align-items:center;gap:4px;">' +
          '    <span class="history-status ' +
          statusClass +
          '">' +
          escapeHtml(entry.statusText || String(entry.status)) +
          '</span>' +
          '    <button type="button" class="kv-remove history-delete-btn" title="Delete entry" aria-label="Delete history entry" style="width:24px;height:24px;font-size:0.65rem;">' +
          '      <i class="fas fa-times"></i>' +
          '    </button>' +
          '  </div>' +
          '  <span class="history-time">' +
          timeStr +
          '</span>' +
          '</div>'
        );
      })
      .join('');

    // Bind click events on history items
    dom.historyList.querySelectorAll('.history-item').forEach(function (item) {
      var id = item.getAttribute('data-id');

      // Delete button
      var deleteBtn = item.querySelector('.history-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          deleteHistoryEntry(id);
          showToast('Request removed from history', 'info');
        });
      }

      // Click to replay (but not on the delete button)
      item.addEventListener('click', function (e) {
        if (e.target.closest('.history-delete-btn')) return;
        var entry = state.history.find(function (e) {
          return e.id === id;
        });
        if (entry) replayRequest(entry);
      });
    });
  }

  function getStatusClass(status) {
    if (!status || status === 'Error') return 's-error';
    if (status >= 200 && status < 300) return 's-2xx';
    if (status >= 300 && status < 400) return 's-3xx';
    if (status >= 400 && status < 500) return 's-4xx';
    if (status >= 500) return 's-5xx';
    return 's-error';
  }

  function formatTimestamp(ts) {
    try {
      var d = new Date(ts);
      var options = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return d.toLocaleDateString('en-US', options);
    } catch (_e) {
      return '';
    }
  }

  // ============================================================
  //  HEADERS & PARAMS – Key-Value Editor
  // ============================================================

  function addKvRow(container, key, value) {
    var row = document.createElement('div');
    row.className = 'kv-row';

    var keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'kv-input';
    keyInput.placeholder = 'Key';
    if (key) keyInput.value = key;

    var valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'kv-input';
    valueInput.placeholder = 'Value';
    if (value) valueInput.value = value;

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'kv-remove';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.setAttribute('aria-label', 'Remove row');
    removeBtn.addEventListener('click', function () {
      row.remove();
      updateToggleCounts();
    });

    row.appendChild(keyInput);
    row.appendChild(valueInput);
    row.appendChild(removeBtn);
    container.appendChild(row);
    updateToggleCounts();
  }

  function getKvData(container) {
    var rows = container.querySelectorAll('.kv-row');
    var data = {};
    rows.forEach(function (row) {
      var inputs = row.querySelectorAll('.kv-input');
      if (inputs.length >= 2) {
        var key = inputs[0].value.trim();
        var val = inputs[1].value.trim();
        if (key) data[key] = val;
      }
    });
    return data;
  }

  function setKvData(container, data) {
    // Clear existing rows
    container.innerHTML = '';
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      Object.keys(data).forEach(function (key) {
        addKvRow(container, key, data[key]);
      });
    } else {
      addKvRow(container, '', '');
    }
    updateToggleCounts();
  }

  function updateToggleCounts() {
    if (dom.headersCount) {
      var hCount = dom.headersContainer.querySelectorAll('.kv-row').length;
      dom.headersCount.textContent = hCount;
    }
  }

  // ============================================================
  //  METHOD HANDLING
  // ============================================================

  function updateMethodUI() {
    var method = dom.methodSelect.value.toUpperCase();
    dom.methodSelect.className = 'method-select method-' + method.toLowerCase();

    // Show/hide body section based on method
    if (method === 'GET' || method === 'HEAD' || method === 'DELETE') {
      dom.bodySection.style.display = 'none';
    } else {
      dom.bodySection.style.display = 'block';
    }
  }

  // ============================================================
  //  BODY JSON VALIDATION
  // ============================================================

  function validateBody() {
    var text = dom.bodyEditor.value.trim();
    if (!text) {
      dom.bodyEditor.className = 'body-editor';
      dom.bodyHint.className = 'body-validation-hint';
      dom.bodyHint.textContent = '';
      return { valid: true, parsed: null };
    }

    try {
      var parsed = JSON.parse(text);
      dom.bodyEditor.className = 'body-editor json-valid';
      dom.bodyHint.className = 'body-validation-hint success';
      dom.bodyHint.innerHTML = '<i class="fas fa-check-circle"></i> Valid JSON';
      return { valid: true, parsed: parsed };
    } catch (e) {
      dom.bodyEditor.className = 'body-editor json-invalid';
      dom.bodyHint.className = 'body-validation-hint error';
      dom.bodyHint.innerHTML =
        '<i class="fas fa-exclamation-circle"></i> ' + escapeHtml(e.message);
      return { valid: false, parsed: undefined };
    }
  }

  // ============================================================
  //  SEND REQUEST
  // ============================================================

  async function sendRequest() {
    if (state.sending) return;

    var method = dom.methodSelect.value.toUpperCase();
    var url = dom.urlInput.value.trim();

    if (!url) {
      showToast('Please enter a URL', 'error');
      dom.urlInput.focus();
      return;
    }

    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      dom.urlInput.value = url;
    }

    // Validate URL and restrict to http/https
    var parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        showToast('Only http:// and https:// URLs are supported', 'error');
        dom.urlInput.focus();
        return;
      }
    } catch (_e) {
      showToast('Invalid URL. Please enter a valid URL.', 'error');
      dom.urlInput.focus();
      return;
    }

    // Get headers
    var headers = getKvData(dom.headersContainer);

    // Get query params and append to URL
    var params = getKvData(dom.paramsContainer);
    var paramKeys = Object.keys(params);
    if (paramKeys.length > 0) {
      paramKeys.forEach(function (k) {
        parsedUrl.searchParams.set(k, params[k]);
      });
      url = parsedUrl.toString();
    }

    // Get body for applicable methods
    var bodyResult = { valid: true, parsed: null };
    if (method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
      bodyResult = validateBody();
      if (!bodyResult.valid) {
        showToast('Invalid JSON in request body', 'error');
        dom.bodyEditor.focus();
        return;
      }
    }

    // Set sending state
    state.sending = true;
    dom.sendBtn.disabled = true;
    dom.sendBtnText.innerHTML = '<span class="spinner"></span> Sending...';

    // Clear previous response
    dom.responsePanel.style.display = 'none';

    var startTime = performance.now();
    var responseData = null;

    try {
      responseData = await executeRequest(method, url, headers, bodyResult.parsed);
    } catch (err) {
      var elapsed = Math.round(performance.now() - startTime);

      // Show error in response panel
      showResponseError(err.message || 'Request failed', elapsed);
      addHistoryEntry({
        method: method,
        url: url,
        status: 'Error',
        statusText: 'Error',
        time: elapsed,
        size: 0,
        requestHeaders: headers,
        requestBody: bodyResult.parsed,
      });

      state.sending = false;
      dom.sendBtn.disabled = false;
      dom.sendBtnText.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
      return;
    }

    // Use proxy-measured time when available, otherwise client-side timing
    var elapsed = responseData.proxyTime != null
      ? responseData.proxyTime
      : Math.round(performance.now() - startTime);

    // Store last response for tab switching
    state.lastResponse = responseData;

    // Display the response
    displayResponse(responseData, elapsed);

    // Add to history
    addHistoryEntry({
      method: method,
      url: url,
      status: responseData.status,
      statusText: responseData.statusText,
      time: elapsed,
      size: responseData.size || 0,
      requestHeaders: headers,
      requestBody: bodyResult.parsed,
    });

    state.sending = false;
    dom.sendBtn.disabled = false;
    dom.sendBtnText.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
  }

  // ============================================================
  //  EXECUTE REQUEST
  // ============================================================

  async function executeRequest(method, url, headers, body) {
    // Try backend proxy first
    try {
      var result = await proxyRequest(method, url, headers, body);
      // If proxy succeeded, use its measured time
      if (result && result.time != null) {
        result.proxyTime = result.time;
      }
      return result;
    } catch (proxyErr) {
      // If proxy fails (e.g. not running), try direct browser fetch
      // The proxy may be unavailable in dev or offline mode
      try {
        return await directRequest(method, url, headers, body);
      } catch (directErr) {
        // Throw a combined informative error
        throw new Error(
          'Request failed. ' +
            (proxyErr.message ? 'Proxy: ' + proxyErr.message + '. ' : '') +
            (directErr.message ? 'Direct: ' + directErr.message : '')
        );
      }
    }
  }

  async function proxyRequest(method, url, headers, body) {
    var payload = {
      method: method,
      url: url,
      headers: headers,
    };

    if (body !== null && body !== undefined) {
      payload.body = body;
    }

    var res = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      var errData = null;
      try {
        errData = await res.json();
      } catch (_e) {
        /* ignore */
      }
      throw new Error(
        (errData && errData.error) || 'Proxy request failed with status ' + res.status
      );
    }

    var data = await res.json();
    return data;
  }

  async function directRequest(method, url, headers, body) {
    var fetchOptions = {
      method: method,
      headers: Object.assign({}, headers),
      mode: 'cors',
    };

    if (body !== null && body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
      if (!fetchOptions.headers['Content-Type']) {
        fetchOptions.headers['Content-Type'] = 'application/json';
      }
    }

    var res = await fetch(url, fetchOptions);

    // Get response headers as plain object
    var respHeaders = {};
    res.headers.forEach(function (value, key) {
      respHeaders[key] = value;
    });

    // Get response body as text
    var bodyText = await res.text();
    var bodyParsed = null;
    var isJson = false;

    // Try to parse as JSON
    if (bodyText.length > 0) {
      try {
        bodyParsed = JSON.parse(bodyText);
        isJson = true;
      } catch (_e) {
        bodyParsed = bodyText;
      }
    }

    return {
      status: res.status,
      statusText: res.status + ' ' + res.statusText,
      headers: respHeaders,
      body: bodyParsed,
      bodyRaw: bodyText,
      isJson: isJson,
      size: bodyText.length,
      proxyTime: null, // No proxy time for direct requests
    };
  }

  // ============================================================
  //  DISPLAY RESPONSE
  // ============================================================

  function displayResponse(data, elapsed) {
    dom.responsePanel.style.display = 'block';

    // Status badge
    var statusCode = data.status || 0;
    var statusText = data.statusText || String(statusCode);
    var statusClass = 'status-error';
    if (statusCode >= 200 && statusCode < 300) statusClass = 'status-2xx';
    else if (statusCode >= 300 && statusCode < 400) statusClass = 'status-3xx';
    else if (statusCode >= 400 && statusCode < 500) statusClass = 'status-4xx';
    else if (statusCode >= 500) statusClass = 'status-5xx';

    dom.responseStatus.className = 'status-badge ' + statusClass;
    dom.responseStatus.innerHTML =
      '<i class="fas fa-circle"></i> ' + escapeHtml(statusText);

    // Response time
    dom.responseTime.textContent = elapsed + 'ms';

    // Response size
    var size = data.size || 0;
    dom.responseSize.textContent = formatSize(size);

    // Store headers for tab switching
    state.responseHeaders = data.headers || {};

    // Render body tab by default
    renderResponseBody(data);

    // Render headers tab content
    renderResponseHeaders(data.headers || {});

    // Activate body tab
    activateResponseTab('body');
  }

  function renderResponseBody(data) {
    if (data.isJson && data.body !== null && data.body !== undefined) {
      dom.responseContent.innerHTML =
        '<pre>' + syntaxHighlightJson(data.body) + '</pre>';
    } else if (typeof data.body === 'string' && data.body.length > 0) {
      dom.responseContent.innerHTML = '<pre>' + escapeHtml(data.body) + '</pre>';
    } else if (data.body && typeof data.body === 'object') {
      dom.responseContent.innerHTML =
        '<pre>' + syntaxHighlightJson(data.body) + '</pre>';
    } else if (data.bodyRaw && data.bodyRaw.length > 0) {
      dom.responseContent.innerHTML = '<pre>' + escapeHtml(data.bodyRaw) + '</pre>';
    } else {
      dom.responseContent.innerHTML =
        '<div class="response-empty">' +
        '<i class="fas fa-check-circle"></i>' +
        '<p>Request completed successfully</p>' +
        '<p class="hint">No response body</p>' +
        '</div>';
    }
  }

  function renderResponseHeaders(headers) {
    var headerKeys = Object.keys(headers);
    var container = document.createElement('div');
    container.id = 'responseHeadersContent';
    container.style.display = 'none';

    if (headerKeys.length === 0) {
      container.innerHTML =
        '<div class="response-empty">' +
        '<i class="fas fa-info-circle"></i>' +
        '<p>No response headers</p>' +
        '</div>';
    } else {
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'font-family: var(--code-font); font-size: 0.82rem;';

      headerKeys.forEach(function (key) {
        var row = document.createElement('div');
        row.style.cssText =
          'display: flex; padding: 6px 0; border-bottom: 1px solid var(--border-color); gap: 12px;';

        var keyEl = document.createElement('span');
        keyEl.style.cssText =
          'color: var(--accent-purple); font-weight: 500; min-width: 200px; flex-shrink: 0;';
        keyEl.textContent = key;

        var valEl = document.createElement('span');
        valEl.style.cssText = 'color: var(--text-secondary); word-break: break-all;';
        valEl.textContent = headers[key];

        row.appendChild(keyEl);
        row.appendChild(valEl);
        wrapper.appendChild(row);
      });

      container.appendChild(wrapper);
    }

    // Remove old headers content if any
    var old = document.getElementById('responseHeadersContent');
    if (old) old.remove();

    dom.responseContent.parentNode.appendChild(container);
  }

  // ============================================================
  //  RESPONSE ERROR
  // ============================================================

  function showResponseError(message, elapsed) {
    dom.responsePanel.style.display = 'block';
    dom.responseStatus.className = 'status-badge status-error';
    dom.responseStatus.innerHTML =
      '<i class="fas fa-exclamation-triangle"></i> Error';
    dom.responseTime.textContent = (elapsed || 0) + 'ms';
    dom.responseSize.textContent = '\u2014';

    dom.responseContent.innerHTML =
      '<div class="response-error">' +
      '<i class="fas fa-exclamation-circle"></i> ' +
      escapeHtml(message) +
      '</div>';

    // Remove old headers content
    var old = document.getElementById('responseHeadersContent');
    if (old) old.remove();
    state.responseHeaders = null;

    activateResponseTab('body');
  }

  // ============================================================
  //  RESPONSE TABS
  // ============================================================

  function activateResponseTab(tabName) {
    if (!dom.responseTabs) return;

    dom.responseTabs.querySelectorAll('.response-tab').forEach(function (tab) {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    state.activeTab = tabName;

    if (tabName === 'body') {
      dom.responseContent.style.display = 'block';
      var headersContent = document.getElementById('responseHeadersContent');
      if (headersContent) headersContent.style.display = 'none';
    } else if (tabName === 'headers') {
      dom.responseContent.style.display = 'none';
      var hc = document.getElementById('responseHeadersContent');
      if (hc) hc.style.display = 'block';
    }
  }

  // ============================================================
  //  COPY RESPONSE
  // ============================================================

  function copyResponse() {
    if (!state.lastResponse) return;

    var text = '';
    if (state.lastResponse.isJson && state.lastResponse.body) {
      text = JSON.stringify(state.lastResponse.body, null, 2);
    } else if (state.lastResponse.bodyRaw) {
      text = state.lastResponse.bodyRaw;
    } else if (state.lastResponse.body) {
      text = String(state.lastResponse.body);
    }

    if (!text) {
      showToast('Nothing to copy', 'error');
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(function () {
        showCopyFeedback();
      })
      .catch(function () {
        // Fallback for older browsers
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showCopyFeedback();
        } catch (_e) {
          showToast('Failed to copy to clipboard', 'error');
        }
      });
  }

  function showCopyFeedback() {
    var el = document.createElement('div');
    el.className = 'copy-feedback';
    el.innerHTML = '<i class="fas fa-check-circle"></i> Copied to clipboard!';
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 700);
  }

  // ============================================================
  //  PRETTY PRINT RESPONSE
  // ============================================================

  function prettyPrintResponse() {
    if (state.lastResponse && state.lastResponse.bodyRaw) {
      try {
        var parsed = JSON.parse(state.lastResponse.bodyRaw);
        state.lastResponse.body = parsed;
        state.lastResponse.isJson = true;
        renderResponseBody(state.lastResponse);
        showToast('Response formatted', 'success');
      } catch (_e) {
        showToast('Response is not valid JSON', 'error');
      }
    }
  }

  // ============================================================
  //  REPLAY REQUEST FROM HISTORY
  // ============================================================

  function replayRequest(entry) {
    dom.methodSelect.value = entry.method;
    dom.urlInput.value = entry.url;

    // Restore headers if stored
    if (entry.requestHeaders) {
      setKvData(dom.headersContainer, entry.requestHeaders);
    }

    // Restore body if stored
    if (entry.requestBody !== null && entry.requestBody !== undefined) {
      dom.bodyEditor.value = JSON.stringify(entry.requestBody, null, 2);
      validateBody();
    } else {
      dom.bodyEditor.value = '';
    }

    // Update UI for method
    updateMethodUI();

    // Ensure headers section is expanded
    dom.headersToggle.classList.add('expanded');
    dom.headersBody.classList.add('open');

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Focus the URL input
    dom.urlInput.focus();

    showToast('Request loaded from history', 'info');
  }

  // ============================================================
  //  TOAST NOTIFICATIONS
  // ============================================================

  function showToast(message, type) {
    if (!dom.toastContainer) return;

    type = type || 'info';

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    var iconMap = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      info: '<i class="fas fa-info-circle"></i>',
    };

    toast.innerHTML = (iconMap[type] || iconMap.info) + ' ' + escapeHtml(message);
    dom.toastContainer.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('toast-leaving');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // ============================================================
  //  SYNTAX HIGHLIGHTING (robust per-value approach)
  // ============================================================

  function syntaxHighlightJson(obj) {
    var json = JSON.stringify(obj, null, 2);
    if (!json) return '';

    // Escape HTML entities first to prevent XSS
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Then apply syntax highlighting via a single regex pass
    return json.replace(
      /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match, key, colon, boolNull, number) {
        if (key) {
          if (colon) {
            return '<span class="json-key">' + key + '</span>:';
          }
          return '<span class="json-string">' + key + '</span>';
        }
        if (boolNull) {
          var cls = boolNull === 'null' ? 'json-null' : 'json-boolean';
          return '<span class="' + cls + '">' + boolNull + '</span>';
        }
        if (number) {
          return '<span class="json-number">' + number + '</span>';
        }
        return match;
      }
    );
  }

  // ============================================================
  //  UTILITY FUNCTIONS
  // ============================================================

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  function formatSize(bytes) {
    if (bytes === 0 || bytes === undefined || bytes === null) return '\u2014';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ============================================================
  //  EVENT BINDING
  // ============================================================

  function bindEvents() {
    // Send button
    dom.sendBtn.addEventListener('click', sendRequest);

    // Enter key in URL input
    dom.urlInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendRequest();
      }
    });

    // Ctrl/Cmd + Enter in body editor
    dom.bodyEditor.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendRequest();
      }
    });

    // Body validation on input
    dom.bodyEditor.addEventListener('input', validateBody);

    // Method change
    dom.methodSelect.addEventListener('change', updateMethodUI);

    // Headers toggle
    dom.headersToggle.addEventListener('click', function () {
      dom.headersToggle.classList.toggle('expanded');
      dom.headersBody.classList.toggle('open');
    });

    // Params toggle
    if (dom.paramsToggle) {
      dom.paramsToggle.addEventListener('click', function () {
        dom.paramsToggle.classList.toggle('expanded');
        dom.paramsBody.classList.toggle('open');
      });
    }

    // Add header row buttons
    document.querySelectorAll('[data-add-header]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addKvRow(dom.headersContainer, '', '');
      });
    });

    // Add param row buttons
    document.querySelectorAll('[data-add-param]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addKvRow(dom.paramsContainer, '', '');
      });
    });

    // Clear history
    if (dom.clearHistoryBtn) {
      dom.clearHistoryBtn.addEventListener('click', function () {
        if (state.history.length === 0) return;
        if (confirm('Clear all request history?')) {
          clearHistory();
        }
      });
    }

    // Copy response
    if (dom.copyResponseBtn) {
      dom.copyResponseBtn.addEventListener('click', copyResponse);
    }

    // Pretty print response
    if (dom.prettyPrintBtn) {
      dom.prettyPrintBtn.addEventListener('click', prettyPrintResponse);
    }

    // Response tabs
    if (dom.responseTabs) {
      dom.responseTabs.querySelectorAll('.response-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var tabName = tab.getAttribute('data-tab');
          if (tabName) activateResponseTab(tabName);
        });
      });
    }
  }

  // ============================================================
  //  KEYBOARD SHORTCUTS
  // ============================================================

  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Ctrl+Enter to send request from anywhere
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        var active = document.activeElement;
        // Don't double-fire if user is in an input that already handles Ctrl+Enter
        if (
          active &&
          (active.tagName === 'TEXTAREA' || active.id === 'apiUrl')
        ) {
          return;
        }
        e.preventDefault();
        sendRequest();
      }
    });
  }

  // ============================================================
  //  INIT
  // ============================================================

  function init() {
    cacheDom();

    // Guard: only run on the API Playground page
    if (!dom.sendBtn || !dom.urlInput) return;

    loadHistory();
    renderHistory();
    updateMethodUI();

    // Add initial empty rows for headers
    addKvRow(dom.headersContainer, 'Content-Type', 'application/json');

    // Add initial empty row for params
    addKvRow(dom.paramsContainer, '', '');

    bindEvents();
    bindKeyboardShortcuts();

    console.log(
      '%c\u26a1 API Playground initialized',
      'color: #8b5cf6; font-weight: bold; font-size: 12px;'
    );
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
