/* ==========================================================================
   COLLABORATIVE CODE PLAYGROUND — CLIENT CONTROLLER & SOCKET SYNC
   ========================================================================== */

(function () {
  'use strict';

  // Language Templates Catalog
  const CODE_TEMPLATES = {
    javascript: `// Real-Time Collaborative Playground (JavaScript)
// All participants in this room see your live edits and execution output.

function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test Execution
console.log("Two Sum Result:", solution([2, 7, 11, 15], 9));
`,
    python: `# Real-Time Collaborative Playground (Python 3)
def solution(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

print("Two Sum Result:", solution([2, 7, 11, 15], 9))
`,
    cpp: `// Real-Time Collaborative Playground (C++ 17)
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int diff = target - nums[i];
        if (seen.count(diff)) return {seen[diff], i};
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> ans = twoSum(nums, 9);
    cout << "Two Sum Result: [" << ans[0] << ", " << ans[1] << "]" << endl;
    return 0;
}
`,
    java: `// Real-Time Collaborative Playground (Java 17)
import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) {
                return new int[]{map.get(diff), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        int[] res = twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println("Two Sum Result: [" + res[0] + ", " + res[1] + "]");
    }
}
`,
    c: `// Real-Time Collaborative Playground (C Language)
#include <stdio.h>

int main() {
    printf("Hello from Collaborative C Playground!\\n");
    return 0;
}
`,
    swift: `// Real-Time Collaborative Playground (Swift)
func twoSum(_ nums: [Int], _ target: Int) -> [Int] {
    var dict = [Int: Int]()
    for (i, num) in nums.enumerated() {
        if let prevIndex = dict[target - num] {
            return [prevIndex, i]
        }
        dict[num] = i
    }
    return []
}

print("Two Sum Result:", twoSum([2, 7, 11, 15], 9))
`,
  };

  // User Color Palette for Cursors
  const USER_COLORS = ['#38bdf8', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

  // Global State
  const state = {
    roomId: null,
    userId: 'user-' + Math.floor(Math.random() * 1000000),
    userName: 'Learner',
    userColor: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
    language: 'javascript',
    isSocketConnected: false,
    participants: new Map(), // socketId -> userObj
    remoteCursors: new Map(), // socketId -> pos
    unreadChatCount: 0,
    isChatOpen: true,
    isLocalTyping: false,
    version: 0,
  };

  let socket = null;
  const DOM = {};

  function initDOM() {
    DOM.roomBadge = document.getElementById('cpeRoomBadge');
    DOM.langSelect = document.getElementById('cpeLangSelect');
    DOM.shareBtn = document.getElementById('cpeShareBtn');
    DOM.forkBtn = document.getElementById('cpeForkBtn');
    DOM.runBtn = document.getElementById('cpeRunBtn');
    DOM.participantsBar = document.getElementById('cpeParticipantsBar');
    DOM.toggleChatBtn = document.getElementById('cpeToggleChatBtn');
    DOM.unreadBadge = document.getElementById('cpeUnreadBadge');
    DOM.gutter = document.getElementById('cpeGutter');
    DOM.codeInput = document.getElementById('cpeCodeInput');
    DOM.remoteCursors = document.getElementById('cpeRemoteCursors');
    DOM.syncIndicator = document.getElementById('cpeSyncIndicator');
    DOM.syncText = document.getElementById('cpeSyncText');
    DOM.posInfo = document.getElementById('cpePosInfo');
    DOM.userCountText = document.getElementById('cpeUserCountText');
    DOM.resetCodeBtn = document.getElementById('cpeResetCodeBtn');
    DOM.execStatusTag = document.getElementById('cpeExecStatusTag');
    DOM.execTime = document.getElementById('cpeExecTime');
    DOM.clearConsoleBtn = document.getElementById('cpeClearConsoleBtn');
    DOM.consoleOutput = document.getElementById('cpeConsoleOutput');
    DOM.chatSidebar = document.getElementById('cpeChatSidebar');
    DOM.closeChatBtn = document.getElementById('cpeCloseChatBtn');
    DOM.chatHistory = document.getElementById('cpeChatHistory');
    DOM.chatInput = document.getElementById('cpeChatInput');
    DOM.sendChatBtn = document.getElementById('cpeSendChatBtn');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    initUserIdentity();
    initRoomId();
    bindEvents();
    initSocketConnection();
    updateLineNumbers();
  });

  // User Identity & Profile Setup
  function initUserIdentity() {
    const up = window.userProgress || {};
    if (up.name) state.userName = up.name;
    if (up.id) state.userId = up.id;
  }

  // Room ID Parsing
  function initRoomId() {
    const params = new URLSearchParams(window.location.search);
    let r = params.get('room');
    if (!r) {
      r = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      window.history.replaceState({}, '', `?room=${r}`);
    }
    state.roomId = r;
    if (DOM.roomBadge) {
      DOM.roomBadge.innerHTML = `<i class="fas fa-door-open"></i> Room: ${r}`;
    }
  }

  // Event Bindings
  function bindEvents() {
    if (DOM.codeInput) {
      DOM.codeInput.addEventListener('input', handleLocalInput);
      DOM.codeInput.addEventListener('keyup', updateCursorPos);
      DOM.codeInput.addEventListener('click', updateCursorPos);
      DOM.codeInput.addEventListener('scroll', syncGutterScroll);
      DOM.codeInput.value = CODE_TEMPLATES.javascript;
    }

    if (DOM.langSelect) {
      DOM.langSelect.addEventListener('change', (e) => {
        state.language = e.target.value;
        const tmpl = CODE_TEMPLATES[state.language] || '';
        if (
          DOM.codeInput &&
          (!DOM.codeInput.value.trim() ||
            confirm('Replace code with template for ' + state.language + '?'))
        ) {
          DOM.codeInput.value = tmpl;
          updateLineNumbers();
          broadcastCodeSync();
        }
      });
    }

    if (DOM.shareBtn) DOM.shareBtn.addEventListener('click', handleShareInvite);
    if (DOM.forkBtn) DOM.forkBtn.addEventListener('click', handleForkSnapshot);
    if (DOM.runBtn) DOM.runBtn.addEventListener('click', handleRunCode);
    if (DOM.clearConsoleBtn) DOM.clearConsoleBtn.addEventListener('click', clearConsole);
    if (DOM.resetCodeBtn) DOM.resetCodeBtn.addEventListener('click', resetTemplate);

    if (DOM.toggleChatBtn) {
      DOM.toggleChatBtn.addEventListener('click', () => {
        state.isChatOpen = !state.isChatOpen;
        DOM.chatSidebar.classList.toggle('collapsed', !state.isChatOpen);
        if (state.isChatOpen) {
          state.unreadChatCount = 0;
          if (DOM.unreadBadge) DOM.unreadBadge.style.display = 'none';
        }
      });
    }

    if (DOM.closeChatBtn) {
      DOM.closeChatBtn.addEventListener('click', () => {
        state.isChatOpen = false;
        DOM.chatSidebar.classList.add('collapsed');
      });
    }

    if (DOM.sendChatBtn && DOM.chatInput) {
      DOM.sendChatBtn.addEventListener('click', sendChatMessage);
      DOM.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
      });
    }
  }

  // Socket Connection Setup
  function initSocketConnection() {
    if (!socket) {
      updateSyncStatus(false, 'Local Offline Mode');
      renderParticipants();
      return;
    }

    // Respond to server heartbeats
    socket.on('webrtc-ping', () => {
      socket.emit('webrtc-pong');
    });

    socket.on('connect', () => {
      state.isSocketConnected = true;
      updateSyncStatus(true, 'Live Connected');

      // Join Room
      socket.emit('webrtc-join', state.roomId, state.userId);
      socket.emit('collab-join', {
        roomId: state.roomId,
        userId: state.userId,
        userName: state.userName,
        userColor: state.userColor,
      });

      appendSystemMsg(`Connected to collaborative room ${state.roomId}`);
    });

    socket.on('disconnect', () => {
      state.isSocketConnected = false;
      updateSyncStatus(false, 'Disconnected');
      appendSystemMsg('Connection lost. Reconnecting...');
    });

    // Handle incoming room state
    socket.on('webrtc-room-info', (info) => {
      if (info && Array.isArray(info.existingPeers)) {
        info.existingPeers.forEach((peer) => {
          state.participants.set(peer.socketId, {
            id: peer.userId || peer.socketId,
            name: peer.userName || 'Peer',
            color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
          });
        });
        renderParticipants();
      }
    });

    socket.on('webrtc-user-joined', (userId, socketId) => {
      state.participants.set(socketId, {
        id: userId,
        name: userId || 'Peer',
        color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
      });
      renderParticipants();
      appendSystemMsg(`Peer (${userId}) joined the room.`);
    });

    socket.on('webrtc-user-left', (userId, socketId) => {
      state.participants.delete(socketId);
      state.remoteCursors.delete(socketId);
      renderParticipants();
      renderRemoteCursors();
      appendSystemMsg(`Peer (${userId}) left the room.`);
    });

    // Real-Time Code Sync via OT
    socket.on('webrtc-ot-operation', (opData) => {
      if (!opData || opData.senderSocketId === socket.id) return;
      if (typeof opData.fullCode === 'string') {
        DOM.codeInput.value = opData.fullCode;
        updateLineNumbers();
        updateSyncStatus(true, 'Synced from peer');
      }
    });

    socket.on('collab-code-sync', (data) => {
      if (data && data.senderId !== state.userId) {
        DOM.codeInput.value = data.code;
        if (data.language && DOM.langSelect) {
          DOM.langSelect.value = data.language;
          state.language = data.language;
        }
        updateLineNumbers();
      }
    });

    // Remote Cursor Tracking
    socket.on('collab-cursor-move', (data) => {
      if (data && data.senderId !== state.userId) {
        state.remoteCursors.set(data.senderId, data);
        renderRemoteCursors();
      }
    });

    // Shared Execution Sync
    socket.on('collab-execute-result', (data) => {
      if (data) {
        displayExecutionOutput(data.logs, data.error, data.executionTime, data.ranBy);
      }
    });

    // Real-Time Chat
    socket.on('collab-chat-msg', (msgData) => {
      if (msgData) {
        appendChatMessage(
          msgData.senderName,
          msgData.text,
          msgData.senderId === state.userId,
          msgData.color
        );
      }
    });
  }

  // Handle Local Code Input & Broadcast Sync
  function handleLocalInput() {
    updateLineNumbers();
    updateCursorPos();
    broadcastCodeSync();
  }

  function broadcastCodeSync() {
    if (!socket || !state.isSocketConnected) return;

    const code = DOM.codeInput.value;
    const opData = {
      fullCode: code,
      language: state.language,
      senderId: state.userId,
      timestamp: Date.now(),
    };

    socket.emit('webrtc-ot-operation', state.roomId, opData);
    socket.emit('collab-code-sync', { roomId: state.roomId, ...opData });
  }

  // Cursor Tracking & Rendering
  function updateCursorPos() {
    if (!DOM.codeInput) return;
    const pos = DOM.codeInput.selectionStart;
    const val = DOM.codeInput.value.substring(0, pos);
    const lines = val.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;

    if (DOM.posInfo) {
      DOM.posInfo.textContent = `Ln ${line}, Col ${col}`;
    }

    if (socket && state.isSocketConnected) {
      socket.emit('collab-cursor-move', {
        roomId: state.roomId,
        senderId: state.userId,
        senderName: state.userName,
        color: state.userColor,
        line,
        col,
        pos,
      });
    }
  }

  function renderRemoteCursors() {
    if (!DOM.remoteCursors) return;
    DOM.remoteCursors.innerHTML = '';

    state.remoteCursors.forEach((c) => {
      const caret = document.createElement('div');
      caret.className = 'cpe-remote-cursor-caret';
      caret.style.borderColor = c.color || '#38bdf8';
      caret.style.top = `${(c.line - 1) * 1.5 + 0.85}rem`;
      caret.style.left = `${c.col * 0.55 + 0.85}rem`;

      const flag = document.createElement('div');
      flag.className = 'cpe-remote-cursor-flag';
      flag.style.background = c.color || '#38bdf8';
      flag.textContent = c.senderName || 'Peer';

      caret.appendChild(flag);
      DOM.remoteCursors.appendChild(caret);
    });
  }

  // Update Gutter Line Numbers
  function updateLineNumbers() {
    if (!DOM.codeInput || !DOM.gutter) return;
    const lines = DOM.codeInput.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += `<div>${i}</div>`;
    }
    DOM.gutter.innerHTML = html;
  }

  function syncGutterScroll() {
    if (DOM.gutter && DOM.codeInput) {
      DOM.gutter.scrollTop = DOM.codeInput.scrollTop;
    }
  }

  // Render Online Participants Bar
  function renderParticipants() {
    if (!DOM.participantsBar) return;
    DOM.participantsBar.innerHTML = '';

    // Add Self
    const selfAv = document.createElement('div');
    selfAv.className = 'cpe-user-avatar';
    selfAv.style.background = state.userColor;
    selfAv.title = `${state.userName} (You)`;
    selfAv.textContent = state.userName.charAt(0).toUpperCase();
    DOM.participantsBar.appendChild(selfAv);

    // Add Remote Peers
    state.participants.forEach((peer) => {
      const av = document.createElement('div');
      av.className = 'cpe-user-avatar';
      av.style.background = peer.color || '#a855f7';
      av.title = peer.name || 'Peer';
      av.textContent = (peer.name || 'P').charAt(0).toUpperCase();
      DOM.participantsBar.appendChild(av);
    });

    const totalCount = state.participants.size + 1;
    if (DOM.userCountText) {
      DOM.userCountText.innerHTML = `<i class="fas fa-users"></i> ${totalCount} Participant${totalCount > 1 ? 's' : ''}`;
    }
  }

  // Shared Code Execution Handler
  async function handleRunCode() {
    const code = DOM.codeInput.value;
    const lang = state.language;

    setExecStatus('running', 'Running code...');
    clearConsole();

    let logs = [],
      error = null,
      executionTime = 0;
    const startTime = performance.now();

    try {
      if (lang === 'javascript' && typeof window.executeSandboxedCode === 'function') {
        logs = await window.executeSandboxedCode(code, 3000);
        executionTime = logs.executionTime || (performance.now() - startTime).toFixed(2);
      } else {
        // Multi-language backend API request
        const res = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language: lang }),
        });
        const result = await res.json();
        logs = result.logs || [result.output || ''];
        error = result.error;
        executionTime = result.executionTime || (performance.now() - startTime).toFixed(2);
      }
    } catch (err) {
      error = err.message || String(err);
      executionTime = (performance.now() - startTime).toFixed(2);
    }

    const execData = {
      logs,
      error,
      executionTime,
      ranBy: state.userName,
    };

    displayExecutionOutput(logs, error, executionTime, state.userName);

    // Broadcast result to room so everyone sees execution output in real time
    if (socket && state.isSocketConnected) {
      socket.emit('collab-execute-result', { roomId: state.roomId, ...execData });
    }
  }

  function displayExecutionOutput(logs, error, executionTime, ranBy) {
    if (!DOM.consoleOutput) return;

    if (error) {
      setExecStatus('error', 'Execution Error');
    } else {
      setExecStatus('success', 'Completed');
    }

    if (DOM.execTime) {
      DOM.execTime.textContent = `${executionTime}ms ${ranBy ? '• Executed by ' + ranBy : ''}`;
    }

    let html = '';
    if (Array.isArray(logs) && logs.length > 0) {
      logs.forEach((log) => {
        let cls = 'cpe-log-line';
        if (log.startsWith('⚠️')) cls += ' cpe-log-warn';
        if (log.startsWith('❌')) cls += ' cpe-log-err';
        html += `<div class="${cls}">${escapeHtml(log)}</div>`;
      });
    }

    if (error) {
      html += `<div class="cpe-log-line cpe-log-err">❌ ${escapeHtml(error)}</div>`;
    }

    if (!html) {
      html = `<div class="cpe-log-line" style="color:#8b949e">(Code executed successfully with no console output)</div>`;
    }

    DOM.consoleOutput.innerHTML = html;
  }

  function setExecStatus(type, label) {
    if (!DOM.execStatusTag) return;
    DOM.execStatusTag.className = `cpe-status-tag ${type}`;
    DOM.execStatusTag.textContent = label;
  }

  function clearConsole() {
    if (DOM.consoleOutput) {
      DOM.consoleOutput.innerHTML = `
        <div class="cpe-console-placeholder">
          <i class="fas fa-play-circle"></i>
          <p>Console cleared. Click "Run Code" to execute again.</p>
        </div>`;
    }
    setExecStatus('ready', 'Ready');
    if (DOM.execTime) DOM.execTime.textContent = '';
  }

  // Fork Snapshot to Personal History
  function handleForkSnapshot() {
    const code = DOM.codeInput.value;
    const snapshot = {
      id: 'fork-' + Date.now(),
      roomId: state.roomId,
      language: state.language,
      code,
      forkedAt: new Date().toISOString(),
      title: `Collab Playground Snapshot (${state.language.toUpperCase()})`,
    };

    try {
      const up = window.userProgress || {};
      if (!Array.isArray(up.recentProblems)) up.recentProblems = [];
      up.recentProblems.unshift(snapshot);
      if (typeof window.saveUserData === 'function') window.saveUserData();

      // Also store in dedicated localStorage array
      const localForks = JSON.parse(localStorage.getItem('collab_snapshots') || '[]');
      localForks.unshift(snapshot);
      localStorage.setItem('collab_snapshots', JSON.stringify(localForks));

      alert('⚡ Snapshot forked successfully! Saved to your personal learning history.');
    } catch (e) {
      alert('Snapshot forked locally!');
    }
  }

  // Share Invite Link Action
  function handleShareInvite() {
    const inviteUrl = window.location.origin + window.location.pathname + '?room=' + state.roomId;
    navigator.clipboard
      .writeText(inviteUrl)
      .then(() => alert(`Room invite link copied to clipboard:\n${inviteUrl}`))
      .catch(() => prompt('Copy this invite link:', inviteUrl));
  }

  // Chat Subsystem
  function sendChatMessage() {
    if (!DOM.chatInput) return;
    const text = DOM.chatInput.value.trim();
    if (!text) return;

    const msgData = {
      roomId: state.roomId,
      senderId: state.userId,
      senderName: state.userName,
      color: state.userColor,
      text,
      timestamp: Date.now(),
    };

    appendChatMessage(state.userName, text, true, state.userColor);
    DOM.chatInput.value = '';

    if (socket && state.isSocketConnected) {
      socket.emit('collab-chat-msg', msgData);
    }
  }

  function appendChatMessage(author, text, isSelf, color) {
    if (!DOM.chatHistory) return;

    const msg = document.createElement('div');
    msg.className = `cpe-chat-msg ${isSelf ? 'self' : ''}`;
    msg.innerHTML = `
      <div class="cpe-msg-author" style="color: ${color || '#c084fc'}">
        <span>${escapeHtml(author)}</span>
      </div>
      <div class="cpe-msg-bubble">${escapeHtml(text)}</div>
    `;

    DOM.chatHistory.appendChild(msg);
    DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;

    if (!isSelf && !state.isChatOpen) {
      state.unreadChatCount++;
      if (DOM.unreadBadge) {
        DOM.unreadBadge.style.display = 'flex';
        DOM.unreadBadge.textContent = state.unreadChatCount;
      }
    }
  }

  function appendSystemMsg(text) {
    if (!DOM.chatHistory) return;
    const sys = document.createElement('div');
    sys.className = 'cpe-system-msg';
    sys.innerHTML = `<i class="fas fa-info-circle"></i> ${escapeHtml(text)}`;
    DOM.chatHistory.appendChild(sys);
    DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
  }

  function resetTemplate() {
    if (confirm('Reset code to default boilerplate? Unsaved changes will be lost.')) {
      DOM.codeInput.value = CODE_TEMPLATES[state.language] || '';
      updateLineNumbers();
      broadcastCodeSync();
    }
  }

  function updateSyncStatus(isSynced, label) {
    if (!DOM.syncIndicator || !DOM.syncText) return;
    DOM.syncText.textContent = label;
    DOM.syncIndicator.style.color = isSynced ? '#22c55e' : '#f87171';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
