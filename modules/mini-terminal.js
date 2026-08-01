/**
 * MiniTerminal - A reusable Vanilla JS component that intercepts console.log 
 * and renders it elegantly in the UI.
 */
class MiniTerminal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`MiniTerminal: Container #${containerId} not found.`);
      return;
    }

    // Backup native console methods
    this.originalConsoleLog = console.log;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    
    this.initUI();
    this.interceptConsole();
  }

  initUI() {
    this.container.innerHTML = `
      <div class="mini-terminal-wrapper" style="background:#1e293b; color:#e2e8f0; display:flex; flex-direction:column; height:100%; min-height:150px; font-family:monospace; font-size:13px; overflow:hidden;">
        <div style="background:#0f172a; padding:6px 12px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155;">
          <span style="color:#94a3b8; font-weight:bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;"><i class="fa-solid fa-terminal mr-2"></i> Console Output</span>
          <button id="clear-terminal-${this.container.id}" style="background:none; border:none; color:#cbd5e1; cursor:pointer; font-size:11px; font-family: sans-serif;">Clear</button>
        </div>
        <div id="terminal-output-${this.container.id}" style="padding:12px; overflow-y:auto; flex:1; white-space:pre-wrap; word-break:break-all;"></div>
      </div>
    `;
    this.outputElement = document.getElementById(`terminal-output-${this.container.id}`);
    const clearBtn = document.getElementById(`clear-terminal-${this.container.id}`);
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clear());
    }
  }

  formatArg(arg) {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch(e) {
        return String(arg);
      }
    }
    return String(arg);
  }

  appendLog(type, args) {
    if (!this.outputElement) return;

    // Ensure args is always an array
    const argsArray = Array.isArray(args) ? args : [args];
    const msg = argsArray.map(arg => this.formatArg(arg)).join(' ');
    
    const line = document.createElement('div');
    line.style.marginBottom = '4px';
    line.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
    line.style.paddingBottom = '4px';
    line.style.lineHeight = '1.5';

    if (type === 'error') {
      line.style.color = '#fca5a5';
      line.innerHTML = `<span style="color:#ef4444">✖</span> ${this.escapeHtml(msg)}`;
    } else if (type === 'warn') {
      line.style.color = '#fde047';
      line.innerHTML = `<span style="color:#eab308">⚠</span> ${this.escapeHtml(msg)}`;
    } else {
      line.style.color = '#e2e8f0';
      line.innerHTML = `<span style="color:#10b981">›</span> ${this.escapeHtml(msg)}`;
    }

    this.outputElement.appendChild(line);
    
    // Auto scroll to bottom
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }

  interceptConsole() {
    console.log = (...args) => {
      this.appendLog('log', args);
      this.originalConsoleLog.apply(console, args);
    };
    console.error = (...args) => {
      this.appendLog('error', args);
      this.originalConsoleError.apply(console, args);
    };
    console.warn = (...args) => {
      this.appendLog('warn', args);
      this.originalConsoleWarn.apply(console, args);
    };
  }

  clear() {
    if (this.outputElement) {
      this.outputElement.innerHTML = '';
    }
  }

  restore() {
    console.log = this.originalConsoleLog;
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
  }

  escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }
}

window.MiniTerminal = MiniTerminal;
