/* ═══════════════════════════════════════════════
   Terminal Simulator — Interactive Linux Command Learning Tool
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Virtual Filesystem ─── */
  function createFileSystem() {
    return {
      type: 'dir',
      children: {
        home: {
          type: 'dir',
          children: {
            user: {
              type: 'dir',
              children: {
                docs: {
                  type: 'dir',
                  children: {
                    'readme.txt': { type: 'file', content: 'Welcome to the Linux Terminal Simulator!\nPractice commands to navigate and explore.\n' },
                    'notes.md': { type: 'file', content: '# Linux Notes\n- ls: list directory contents\n- cd: change directory\n- pwd: print working directory\n- cat: concatenate files\n' },
                    'project.txt': { type: 'file', content: 'Project Status: IN PROGRESS\nTasks remaining: 3\nDeadline: Next Friday\n' },
                  },
                },
                downloads: { type: 'dir', children: {} },
                '.bashrc': { type: 'file', content: 'alias ll="ls -la"\nexport PATH=$PATH:~/bin\n' },
              },
            },
          },
        },
        var: {
          type: 'dir',
          children: {
            log: {
              type: 'dir',
              children: {
                'syslog': { type: 'file', content: 'Jun 14 10:23:45 kernel: Boot complete\nJun 14 10:23:46 sshd: Started SSH service\nJun 14 10:24:01 cron: Running daily tasks\n' },
                'auth.log': { type: 'file', content: 'Jun 14 10:23:45 login: user authenticated from 192.168.1.10\nJun 14 10:30:12 sudo: command executed by user\n' },
              },
            },
            tmp: { type: 'dir', children: {} },
          },
        },
        etc: {
          type: 'dir',
          children: {
            'hostname': { type: 'file', content: 'algo-infinity-vm\n' },
            'os-release': { type: 'file', content: 'NAME="Algo Linux"\nVERSION="1.0.0"\nID=algo\n' },
            'passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash\n' },
          },
        },
        tmp: { type: 'dir', children: {} },
        data: {
          type: 'dir',
          children: {
            'sample.txt': { type: 'file', content: 'apple\nbanana\ncherry\ndate\nelderberry\nfig\ngrape\n' },
            'numbers.txt': { type: 'file', content: '42\n17\n8\n99\n23\n56\n3\n71\n' },
            'data.csv': { type: 'file', content: 'name,age,city\nAlice,30,NYC\nBob,25,SF\nCharlie,35,LA\n' },
          },
        },
      },
    };
  }

  var STORAGE_KEY = 'ts_simulator_state';

  function saveState() {
    var state = {
      cwd: cwd,
      completed: Array.from(completedChallenges),
      activeIdx: activeChallengeIdx,
      history: commandHistory,
      historyIdx: historyIdx,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full */ }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  var fs = createFileSystem();
  var cwd = ['home', 'user'];
  var completedChallenges = new Set();
  var activeChallengeIdx = null;
  var lastCommand = '';        // track the last raw command entered
  var commandHistory = [];     // input history for up/down arrows
  var historyIdx = -1;

  /* ─── Path Resolution ─── */
  function resolvePath(pathStr) {
    if (!pathStr || pathStr === '.') return { parts: cwd.slice(), name: null };
    var parts;
    if (pathStr.startsWith('/')) {
      parts = [];
      pathStr = pathStr.slice(1);
    } else {
      parts = cwd.slice();
    }
    var segs = pathStr.split('/').filter(Boolean);
    for (var i = 0; i < segs.length; i++) {
      if (segs[i] === '..') { if (parts.length > 0) parts.pop(); }
      else if (segs[i] === '.') { /* noop */ }
      else parts.push(segs[i]);
    }
    return { parts: parts, name: segs.length > 0 ? segs[segs.length - 1] : null, allSegs: segs };
  }

  function getNode(parts) {
    var node = fs;
    for (var i = 0; i < parts.length; i++) {
      if (!node || node.type !== 'dir' || !node.children || !node.children[parts[i]]) return null;
      node = node.children[parts[i]];
    }
    return node;
  }

  function getParentNode(parts) {
    if (parts.length === 0) return null;
    return getNode(parts.slice(0, -1));
  }

  function pwd() { return '/' + cwd.join('/'); }
  function promptStr() {
    if (cwd.length === 0) return 'user@algo:/$';
    var dir = '/' + cwd.join('/');
    if (dir === '/home/user') dir = '~';
    return 'user@algo:' + dir + '$';
  }

  /* ─── Check if a raw command matches a pattern ─── */
  function cmdMatches(patterns) {
    var raw = lastCommand.trim();
    for (var i = 0; i < patterns.length; i++) {
      if (raw === patterns[i] || raw.startsWith(patterns[i] + ' ') || raw.startsWith(patterns[i] + '\t')) {
        return true;
      }
    }
    return false;
  }

  /* ─── Command Definitions ─── */
  var COMMANDS = {
    ls: {
      desc: 'List directory contents',
      usage: 'ls [path]',
      run: function (args) {
        var path = (args.length > 0 && !args[0].startsWith('-')) ? args[0] : '.';
        var showAll = args.indexOf('-a') !== -1 || args.indexOf('-la') !== -1 || args.indexOf('-al') !== -1;
        var long = args.indexOf('-l') !== -1 || args.indexOf('-la') !== -1 || args.indexOf('-al') !== -1;
        var target = resolvePath(path);
        var node = getNode(target.parts);
        if (!node) return { text: 'ls: cannot access \'' + path + '\': No such file or directory', type: 'error' };
        if (node.type !== 'dir') return { text: path, type: 'output' };
        var entries = Object.keys(node.children || {}).sort();
        if (entries.length === 0) return { text: '', type: 'output' };
        var filtered = showAll ? entries : entries.filter(function (e) { return !e.startsWith('.'); });
        if (long) {
          var lines = filtered.map(function (e) {
            var isDir = node.children[e].type === 'dir';
            var perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
            return perms + '  1 user user  ' + (isDir ? '4096' : '128') + '  Jun 14  ' + e;
          });
          return { text: lines.join('\n'), type: 'output' };
        }
        return { text: filtered.join('  '), type: 'output' };
      },
    },
    cd: {
      desc: 'Change current directory',
      usage: 'cd [path]',
      run: function (args) {
        var target = args.length > 0 ? args[0] : '~';
        if (target === '~') { cwd = ['home', 'user']; return { text: '', type: 'output' }; }
        if (target === '/') { cwd = []; return { text: '', type: 'output' }; }
        var parsed = resolvePath(target);
        var node = getNode(parsed.parts);
        if (!node) return { text: 'cd: ' + target + ': No such directory', type: 'error' };
        if (node.type !== 'dir') return { text: 'cd: not a directory: ' + target, type: 'error' };
        cwd = parsed.parts;
        saveState();
        checkChallengeProgress();
        return { text: '', type: 'output' };
      },
    },
    pwd: {
      desc: 'Print working directory',
      usage: 'pwd',
      run: function () { return { text: pwd(), type: 'output' }; },
    },
    cat: {
      desc: 'Concatenate and display file contents',
      usage: 'cat <file>',
      run: function (args) {
        if (args.length === 0) return { text: 'cat: missing operand', type: 'error' };
        var parsed = resolvePath(args[0]);
        var node = getNode(parsed.parts);
        if (!node) return { text: 'cat: ' + args[0] + ': No such file or directory', type: 'error' };
        if (node.type === 'dir') return { text: 'cat: ' + args[0] + ': Is a directory', type: 'error' };
        var content = node.content;
        if (content.endsWith('\n')) content = content.slice(0, -1);
        return { text: content, type: 'output' };
      },
    },
    mkdir: {
      desc: 'Create a new directory',
      usage: 'mkdir <dirname>',
      run: function (args) {
        if (args.length === 0) return { text: 'mkdir: missing operand', type: 'error' };
        var parsed = resolvePath(args[0]);
        var parent = getParentNode(parsed.parts);
        if (!parent || parent.type !== 'dir') return { text: 'mkdir: cannot create directory \'' + args[0] + '\': No such path', type: 'error' };
        var name = parsed.name || parsed.parts[parsed.parts.length - 1];
        if (parent.children[name]) return { text: 'mkdir: cannot create directory \'' + args[0] + '\': File exists', type: 'error' };
        parent.children[name] = { type: 'dir', children: {} };
        return { text: '', type: 'output' };
      },
    },
    touch: {
      desc: 'Create an empty file or update timestamp',
      usage: 'touch <filename>',
      run: function (args) {
        if (args.length === 0) return { text: 'touch: missing operand', type: 'error' };
        var parsed = resolvePath(args[0]);
        var parent = getParentNode(parsed.parts);
        if (!parent || parent.type !== 'dir') return { text: 'touch: cannot touch \'' + args[0] + '\': No such path', type: 'error' };
        var name = parsed.name || parsed.parts[parsed.parts.length - 1];
        if (!parent.children[name]) {
          parent.children[name] = { type: 'file', content: '' };
        }
        return { text: '', type: 'output' };
      },
    },
    echo: {
      desc: 'Display a line of text',
      usage: 'echo <text>',
      run: function (args) {
        if (args.length === 0) return { text: '', type: 'output' };
        return { text: args.join(' '), type: 'output' };
      },
    },
    grep: {
      desc: 'Search for patterns in files',
      usage: 'grep <pattern> <file>',
      run: function (args) {
        var patternIdx = -1;
        for (var i = 0; i < args.length; i++) {
          if (!args[i].startsWith('-')) { patternIdx = i; break; }
        }
        if (patternIdx === -1) return { text: 'grep: missing pattern', type: 'error' };
        var ignoreCase = args.indexOf('-i') !== -1;
        var pattern = args[patternIdx];
        var file = args[patternIdx + 1];
        if (!file) return { text: 'grep: missing file operand', type: 'error' };
        var target = resolvePath(file);
        var node = getNode(target.parts);
        if (!node || node.type !== 'file') return { text: 'grep: ' + file + ': No such file', type: 'error' };
        var lines = node.content.split('\n');
        var flags = ignoreCase ? 'i' : '';
        var matched;
        try {
          var re = new RegExp(pattern, flags);
          matched = lines.filter(function (l) { return re.test(l); });
        } catch (e) {
          return { text: 'grep: invalid pattern', type: 'error' };
        }
        if (matched.length === 0) return { text: '', type: 'output' };
        return { text: matched.join('\n'), type: 'output' };
      },
    },
    find: {
      desc: 'Search for files in a directory hierarchy',
      usage: 'find [path] -name <pattern>',
      run: function (args) {
        var nameIdx = args.indexOf('-name');
        if (nameIdx === -1 || !args[nameIdx + 1]) return { text: 'find: missing -name pattern', type: 'error' };
        var searchPath = nameIdx > 0 ? args[0] : '.';
        var pattern = args[nameIdx + 1];
        var target = resolvePath(searchPath);
        var node = getNode(target.parts);
        if (!node || node.type !== 'dir') return { text: 'find: \'' + searchPath + '\': No such directory', type: 'error' };
        var results = [];
        function walk(n, pathParts, depth) {
          if (!n || n.type !== 'dir' || depth > 8) return;
          for (var name in n.children) {
            if (!Object.prototype.hasOwnProperty.call(n.children, name)) continue;
            var child = n.children[name];
            var fullPath = '/' + pathParts.concat([name]).join('/');
            var wildcard = pattern.replace(/\*/g, '.*');
            try {
              if (new RegExp('^' + wildcard + '$').test(name)) results.push(fullPath);
            } catch (e) { /* skip */ }
            if (child.type === 'dir') walk(child, pathParts.concat([name]), depth + 1);
          }
        }
        walk(node, target.parts, 0);
        if (results.length === 0) return { text: '', type: 'output' };
        return { text: results.join('\n'), type: 'output' };
      },
    },
    wc: {
      desc: 'Count lines, words, and characters',
      usage: 'wc <file>',
      run: function (args) {
        if (args.length === 0) return { text: 'wc: missing operand', type: 'error' };
        // Handle -l flag
        var fileArg = args[args.length - 1];
        var parsed = resolvePath(fileArg);
        var node = getNode(parsed.parts);
        if (!node || node.type !== 'file') return { text: 'wc: ' + fileArg + ': No such file', type: 'error' };
        var content = node.content;
        var lines = content.split('\n');
        var lineCount = content.endsWith('\n') ? lines.length - 1 : lines.length;
        if (args.indexOf('-l') !== -1) {
          return { text: '' + lineCount + '  ' + fileArg, type: 'output' };
        }
        var wordCount = content.split(/\s+/).filter(Boolean).length;
        var charCount = content.length;
        return { text: lineCount + '  ' + wordCount + '  ' + charCount + '  ' + fileArg, type: 'output' };
      },
    },
    sort: {
      desc: 'Sort lines of text files',
      usage: 'sort <file>',
      run: function (args) {
        if (args.length === 0) return { text: 'sort: missing operand', type: 'error' };
        var parsed = resolvePath(args[0]);
        var node = getNode(parsed.parts);
        if (!node || node.type !== 'file') return { text: 'sort: ' + args[0] + ': No such file', type: 'error' };
        var lines = node.content.split('\n').filter(function (l) { return l.length > 0; });
        lines.sort();
        return { text: lines.join('\n'), type: 'output' };
      },
    },
    head: {
      desc: 'Output the first part of files',
      usage: 'head [-n N] <file>',
      run: function (args) {
        var num = 10;
        var fileIdx = 0;
        if (args[0] === '-n' && args[1]) { num = parseInt(args[1], 10); fileIdx = 2; if (isNaN(num)) num = 10; }
        var file = args[fileIdx];
        if (!file) return { text: 'head: missing operand', type: 'error' };
        var parsed = resolvePath(file);
        var node = getNode(parsed.parts);
        if (!node || node.type !== 'file') return { text: 'head: ' + file + ': No such file', type: 'error' };
        var lines = node.content.split('\n');
        return { text: lines.slice(0, num).join('\n'), type: 'output' };
      },
    },
    tail: {
      desc: 'Output the last part of files',
      usage: 'tail [-n N] <file>',
      run: function (args) {
        var num = 10;
        var fileIdx = 0;
        if (args[0] === '-n' && args[1]) { num = parseInt(args[1], 10); fileIdx = 2; if (isNaN(num)) num = 10; }
        var file = args[fileIdx];
        if (!file) return { text: 'tail: missing operand', type: 'error' };
        var parsed = resolvePath(file);
        var node = getNode(parsed.parts);
        if (!node || node.type !== 'file') return { text: 'tail: ' + file + ': No such file', type: 'error' };
        var lines = node.content.split('\n');
        return { text: lines.slice(-num).join('\n'), type: 'output' };
      },
    },
    whoami: {
      desc: 'Display current user name',
      usage: 'whoami',
      run: function () { return { text: 'user', type: 'output' }; },
    },
    clear: {
      desc: 'Clear the terminal screen',
      usage: 'clear',
      run: function () { return { text: '__CLEAR__', type: 'clear' }; },
    },
    help: {
      desc: 'Display help information',
      usage: 'help [command]',
      run: function (args) {
        if (args.length > 0) {
          var cmd = COMMANDS[args[0]];
          if (!cmd) return { text: 'No help available for \'' + args[0] + '\'', type: 'error' };
          return { text: args[0] + ' \u2014 ' + cmd.desc + '\nUsage: ' + cmd.usage, type: 'output' };
        }
        var names = Object.keys(COMMANDS).sort();
        var html = '<div class="ts-output-muted" style="margin-bottom:4px;">Available commands:</div>';
        for (var i = 0; i < names.length; i++) {
          html += '<div class="ts-help-row"><span class="ts-help-cmd">' + names[i] + '</span> <span class="ts-help-desc">' + COMMANDS[names[i]].desc + '</span></div>';
        }
        html += '<div class="ts-output-muted" style="margin-top:4px;">Try: help &lt;command&gt; for details.  Tip: Use | to pipe output between commands.</div>';
        return { text: html, type: 'help' };
      },
    },
  };

  /* ─── Command Parser (handles pipes) ─── */
  function executeLine(input) {
    var trimmed = input.trim();
    if (!trimmed) return [];

    var parts = trimmed.split('|').map(function (s) { return s.trim(); });
    var results = [];
    var pipedData = null;

    for (var i = 0; i < parts.length; i++) {
      var cmdStr = parts[i];
      var tokens = parseTokens(cmdStr);
      if (tokens.length === 0) continue;

      var cmdName = tokens[0].toLowerCase();
      var cmdArgs = tokens.slice(1);

      if (cmdName === 'exit' || cmdName === 'quit') {
        results.push({ text: 'Type help to see available commands.', type: 'output' });
        continue;
      }

      // Pipe data injection
      if (pipedData !== null && cmdName === 'grep') {
        var lines = pipedData.split('\n');
        var pattern = cmdArgs[0] || '';
        var ignoreCase = cmdArgs.indexOf('-i') !== -1;
        var flags = ignoreCase ? 'i' : '';
        var matched;
        try {
          var re = new RegExp(pattern, flags);
          matched = lines.filter(function (l) { return re.test(l); });
        } catch (e) { matched = []; }
        results.push({ text: matched.join('\n'), type: 'output' });
        pipedData = matched.join('\n');
        continue;
      }

      if (pipedData !== null && cmdName === 'wc') {
        var pLines = pipedData.split('\n');
        var pLineCount = pipedData.endsWith('\n') ? pLines.length - 1 : pLines.length;
        var pWordCount = pipedData.split(/\s+/).filter(Boolean).length;
        var pCharCount = pipedData.length;
        if (cmdArgs.indexOf('-l') !== -1) {
          results.push({ text: '' + pLineCount, type: 'output' });
        } else {
          results.push({ text: pLineCount + '  ' + pWordCount + '  ' + pCharCount, type: 'output' });
        }
        pipedData = null;
        continue;
      }

      // For other piped commands, pass piped data as stdin (simplified: just echo it)
      if (pipedData !== null) {
        results.push({ text: pipedData, type: 'output' });
        pipedData = null;
        continue;
      }

      var cmd = COMMANDS[cmdName];
      if (!cmd) {
        results.push({ text: cmdName + ': command not found. Type help for available commands.', type: 'error' });
        return results;
      }

      var result = cmd.run(cmdArgs);
      if (result.type === 'clear') {
        results.push(result);
        return results;
      }
      results.push(result);
      pipedData = (result.text && result.text.length > 0) ? result.text : null;
    }

    return results;
  }

  function parseTokens(str) {
    var tokens = [];
    var current = '';
    var inQuote = false;
    var quoteChar = null;
    for (var i = 0; i < str.length; i++) {
      var c = str[i];
      if (inQuote) {
        if (c === quoteChar) { inQuote = false; }
        else { current += c; }
        continue;
      }
      if (c === '"' || c === "'") { inQuote = true; quoteChar = c; continue; }
      if (c === ' ') {
        if (current) { tokens.push(current); current = ''; }
        continue;
      }
      current += c;
    }
    if (current) tokens.push(current);
    return tokens;
  }

  /* ═══════════════════════════════════════════
     Challenges
     ═══════════════════════════════════════════ */

  var challenges = [
    {
      title: 'Where am I?',
      desc: 'Use <span class="ts-challenge-cmd">pwd</span> to print your current working directory.',
      hint: 'Just type <span class="ts-challenge-cmd">pwd</span> and press Enter.',
      check: function () { return cmdMatches(['pwd']); },
    },
    {
      title: 'Look Around',
      desc: 'Use <span class="ts-challenge-cmd">ls</span> to list the contents of the current directory.',
      hint: 'Type <span class="ts-challenge-cmd">ls</span> and press Enter.',
      check: function () { return cmdMatches(['ls']); },
    },
    {
      title: 'Navigate to docs',
      desc: 'Use <span class="ts-challenge-cmd">cd docs</span> to enter the <span class="ts-challenge-cmd">docs</span> directory.',
      hint: 'Type <span class="ts-challenge-cmd">cd docs</span> then <span class="ts-challenge-cmd">pwd</span> to verify.',
      check: function () {
        return cwd.length >= 3 && cwd[0] === 'home' && cwd[1] === 'user' && cwd[2] === 'docs';
      },
    },
    {
      title: 'Read a File',
      desc: 'Use <span class="ts-challenge-cmd">cat readme.txt</span> to display the contents of the readme file.',
      hint: 'Make sure you\'re in <span class="ts-challenge-cmd">~/docs</span> first (use cd if needed), then type <span class="ts-challenge-cmd">cat readme.txt</span>.',
      check: function () {
        return cmdMatches(['cat readme.txt', 'cat ./readme.txt', 'cat docs/readme.txt', 'cat /home/user/docs/readme.txt']);
      },
    },
    {
      title: 'Go Home',
      desc: 'Navigate back to your home directory using <span class="ts-challenge-cmd">cd ~</span> or <span class="ts-challenge-cmd">cd</span>.',
      hint: 'Type <span class="ts-challenge-cmd">cd ~</span> and then <span class="ts-challenge-cmd">pwd</span> to confirm you\'re at <span class="ts-challenge-cmd">/home/user</span>.',
      check: function () { return cwd.length === 2 && cwd[0] === 'home' && cwd[1] === 'user'; },
    },
    {
      title: 'Search with Grep',
      desc: 'Use <span class="ts-challenge-cmd">grep "kernel" /var/log/syslog</span> to find lines containing "kernel".',
      hint: 'Type <span class="ts-challenge-cmd">grep "kernel" /var/log/syslog</span>',
      check: function () { return cmdMatches(['grep kernel /var/log/syslog', 'grep "kernel" /var/log/syslog']); },
    },
    {
      title: 'Find Text Files',
      desc: 'Use <span class="ts-challenge-cmd">find /home -name "*.txt"</span> to locate all .txt files under /home.',
      hint: 'Type <span class="ts-challenge-cmd">find /home -name "*.txt"</span>',
      check: function () { return cmdMatches(['find /home -name *.txt', 'find /home -name "*.txt"']); },
    },
    {
      title: 'Count Lines',
      desc: 'Use <span class="ts-challenge-cmd">wc -l /var/log/syslog</span> to count the number of lines in syslog.',
      hint: 'Type <span class="ts-challenge-cmd">wc -l /var/log/syslog</span>',
      check: function () { return cmdMatches(['wc -l /var/log/syslog']); },
    },
    {
      title: 'Create a Directory',
      desc: 'Use <span class="ts-challenge-cmd">mkdir myproject</span> to create a new directory called "myproject" in your home folder.',
      hint: 'First <span class="ts-challenge-cmd">cd ~</span> to go home, then <span class="ts-challenge-cmd">mkdir myproject</span>.',
      check: function () {
        var homeNode = getNode(['home', 'user']);
        return homeNode && homeNode.children && !!homeNode.children['myproject'];
      },
    },
    {
      title: 'Pipe It Together',
      desc: 'Use <span class="ts-challenge-cmd">cat /var/log/syslog | grep ssh</span> to find SSH-related log lines.',
      hint: 'Type <span class="ts-challenge-cmd">cat /var/log/syslog | grep ssh</span>',
      check: function () { return cmdMatches(['cat /var/log/syslog | grep ssh']); },
    },
  ];

  /* ─── Check & auto-complete challenges after each command ─── */
  function checkChallengeProgress() {
    if (activeChallengeIdx === null) return;
    var ch = challenges[activeChallengeIdx];
    if (!ch || completedChallenges.has(activeChallengeIdx)) return;

    if (ch.check()) {
      completedChallenges.add(activeChallengeIdx);
      saveState();
      renderChallenges();
      appendOutput('[OK] Challenge completed: ' + ch.title, 'output-success');
      advanceToNextChallenge();
    }
  }

  function advanceToNextChallenge() {
    for (var i = 0; i < challenges.length; i++) {
      if (!completedChallenges.has(i)) {
        activeChallengeIdx = i;
        renderChallenges();
        appendOutput('[>>] Next challenge: ' + challenges[i].title, 'output-warning');
        return;
      }
    }
    activeChallengeIdx = null;
    renderChallenges();
    appendOutput('[**] All challenges completed! Great work!', 'output-success');
  }

  /* ═══════════════════════════════════════════
     UI Controller
     ═══════════════════════════════════════════ */

  var terminalBody = document.getElementById('tsTerminalBody');
  var input = document.getElementById('tsInput');
  var promptLabel = document.getElementById('tsPromptLabel');
  var commandsList = document.getElementById('tsCommandsList');
  var challengesList = document.getElementById('tsChallengesList');
  var cmdSearch = document.getElementById('tsCmdSearch');
  var resetBtn = document.getElementById('tsResetBtn');

  function appendOutput(text, type) {
    if (type === 'clear') {
      var welcome = terminalBody.querySelector('.ts-welcome');
      terminalBody.innerHTML = '';
      if (welcome) terminalBody.appendChild(welcome.cloneNode(true));
      updatePrompt();
      return;
    }
    // Always create a line — even for empty strings (cat shows empty content)
    var line = document.createElement('div');
    line.className = 'ts-line ts-output' + (type ? ' ts-output-' + type : '');
    if (text) {
      line.textContent = text;
    } else {
      line.textContent = '';
      line.style.minHeight = '1.4em';
    }
    terminalBody.insertBefore(line, terminalBody.querySelector('#tsPromptLine'));
  }

  function appendHTML(html, type) {
    var line = document.createElement('div');
    line.className = 'ts-line ts-output' + (type ? ' ts-output-' + type : '');
    line.innerHTML = html;
    terminalBody.insertBefore(line, terminalBody.querySelector('#tsPromptLine'));
  }

  function updatePrompt() {
    promptLabel.textContent = promptStr();
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function handleCommand(raw) {
    // Store for challenge checking
    lastCommand = raw;

    // History management
    commandHistory.push(raw);
    historyIdx = commandHistory.length;

    // Echo the command with prompt
    appendHTML(escapeHtml(promptStr()) + ' ' + escapeHtml(raw), '');

    if (!raw.trim()) { updatePrompt(); return; }

    var results = executeLine(raw);

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.type === 'clear') {
        var welcome = terminalBody.querySelector('.ts-welcome');
        var promptLine = document.getElementById('tsPromptLine');
        terminalBody.innerHTML = '';
        if (welcome) terminalBody.appendChild(welcome.cloneNode(true));
        if (promptLine) terminalBody.appendChild(promptLine);
        input.focus();
      } else if (r.type === 'help') {
        appendHTML(r.text || '', 'help');
      } else {
        appendOutput(r.text || '', r.type === 'error' ? 'error' : '');
      }
    }

    // Check challenges after command execution
    if (results.length > 0) {
      checkChallengeProgress();
    }

    updatePrompt();
  }

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ─── Render Commands Sidebar ─── */
  function renderCommands(filter) {
    if (!commandsList) return;
    var names = Object.keys(COMMANDS).sort();
    if (filter) {
      var lower = filter.toLowerCase();
      names = names.filter(function (n) {
        return n.indexOf(lower) !== -1 || COMMANDS[n].desc.toLowerCase().indexOf(lower) !== -1;
      });
    }
    var html = '';
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var cmd = COMMANDS[name];
      html += '<div class="ts-cmd-item">' +
        '<span class="ts-cmd-name"><i class="fas fa-chevron-right"></i> ' + name + '</span>' +
        '<span class="ts-cmd-desc">' + escapeHtml(cmd.desc) + '</span>' +
        '<span class="ts-cmd-usage">' + escapeHtml(cmd.usage) + '</span>' +
        '</div>';
    }
    commandsList.innerHTML = html;
  }

  /* ─── Render Challenges ─── */
  function renderChallenges() {
    if (!challengesList) return;
    var html = '';
    for (var i = 0; i < challenges.length; i++) {
      var ch = challenges[i];
      var done = completedChallenges.has(i);
      var active = activeChallengeIdx === i;
      var badge = done
        ? '<span class="ts-challenge-badge done"><i class="fas fa-check"></i> Done</span>'
        : active
          ? '<span class="ts-challenge-badge active-badge"><i class="fas fa-arrow-right"></i> Active</span>'
          : '<span class="ts-challenge-badge pending">Pending</span>';
      html += '<div class="ts-challenge-card ' + (done ? 'completed' : '') + ' ' + (active ? 'active' : '') + '" data-idx="' + i + '">' +
        '<div class="ts-challenge-header">' +
        '<span class="ts-challenge-num">#' + (i + 1) + '</span>' +
        badge +
        '</div>' +
        '<div class="ts-challenge-title">' + escapeHtml(ch.title) + '</div>' +
        '<div class="ts-challenge-desc">' + ch.desc + '</div>' +
        '<div class="ts-challenge-hint">Tip: ' + ch.hint + '</div>' +
        '</div>';
    }
    challengesList.innerHTML = html;

    // Click to activate
    var cards = challengesList.querySelectorAll('.ts-challenge-card');
    for (var j = 0; j < cards.length; j++) {
      cards[j].addEventListener('click', (function (idx) {
        return function () {
          if (!completedChallenges.has(idx)) {
            activeChallengeIdx = idx;
            saveState();
            renderChallenges();
            appendOutput('[>>] Active challenge: ' + challenges[idx].title, 'output-warning');
            appendOutput('Tip: ' + challenges[idx].hint, 'output-dim');
            // Navigate home if challenge requires it
            if (idx === 3 || idx === 4 || idx === 8) {
              cwd = ['home', 'user'];
              updatePrompt();
            }
          }
        };
      })(j));
    }
  }

  /* ─── Tab switching ─── */
  var tabs = document.querySelectorAll('.ts-tab');
  for (var t = 0; t < tabs.length; t++) {
    tabs[t].addEventListener('click', function () {
      var allTabs = document.querySelectorAll('.ts-tab');
      for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove('active');
        allTabs[i].setAttribute('aria-selected', 'false');
      }
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      var panels = document.querySelectorAll('.ts-panel');
      for (var j = 0; j < panels.length; j++) {
        panels[j].classList.remove('active');
      }
      var panelId = 'ts' + this.dataset.tab.charAt(0).toUpperCase() + this.dataset.tab.slice(1) + 'Panel';
      document.getElementById(panelId).classList.add('active');
    });
  }

  /* ═══════════════════════════════════════════
     Event Handlers
     ═══════════════════════════════════════════ */

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var raw = input.value;
      input.value = '';
      handleCommand(raw);
    }

    // Tab autocomplete file/directory names
    if (e.key === 'Tab') {
      e.preventDefault();
      var val = input.value;
      var lastWord = val.split(/\s+/).pop() || '';
      if (!lastWord) return;

      // Handle ~ expansion
      if (lastWord.indexOf('~') === 0) {
        lastWord = 'home/user' + lastWord.slice(1);
      }
      // Determine which directory to search in
      var searchDir = cwd.slice();
      if (lastWord.indexOf('/') !== -1) {
        var lastSlash = lastWord.lastIndexOf('/');
        var prefix = lastWord.slice(0, lastSlash);
        lastWord = lastWord.slice(lastSlash + 1);
        if (prefix) {
          var resolved = resolvePath(prefix);
          var dirNode = getNode(resolved.parts);
          if (!dirNode || dirNode.type !== 'dir') return;
          searchDir = resolved.parts;
        }
      }

      var dirForTab = getNode(searchDir);
      if (!dirForTab || dirForTab.type !== 'dir') return;

      var entries = Object.keys(dirForTab.children || {}).filter(function (n) { return !n.startsWith('.'); });
      var matches = entries.filter(function (n) { return n.indexOf(lastWord) === 0; });

      if (matches.length === 1) {
        var completion = matches[0];
        if (dirForTab.children[completion].type === 'dir') completion += '/';
        var tokens = val.split(/\s+/);
        tokens[tokens.length - 1] = completion;
        input.value = tokens.join(' ');
      } else if (matches.length > 1) {
        appendOutput(matches.join('  '), 'muted');
      }
      return;
    }

    // History navigation with arrow keys
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        if (historyIdx > 0) historyIdx--;
        input.value = commandHistory[historyIdx] || '';
        // Move cursor to end
        setTimeout(function () { input.selectionStart = input.selectionEnd = input.value.length; }, 0);
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx < commandHistory.length - 1) {
        historyIdx++;
        input.value = commandHistory[historyIdx] || '';
      } else {
        historyIdx = commandHistory.length;
        input.value = '';
      }
      setTimeout(function () { input.selectionStart = input.selectionEnd = input.value.length; }, 0);
    }
  });

  // Keep focus on input when clicking terminal body
  terminalBody.addEventListener('click', function () { input.focus(); });

  // Command search filter
  if (cmdSearch) {
    cmdSearch.addEventListener('input', function () {
      renderCommands(cmdSearch.value);
    });
  }

  // Reset filesystem — custom confirm modal
  var resetModal = document.getElementById('tsResetModal');
  var modalCancel = document.getElementById('tsModalCancel');
  var modalConfirm = document.getElementById('tsModalConfirm');

  function showResetModal() {
    if (!resetModal) return;
    resetModal.classList.add('open');
  }

  function hideResetModal() {
    if (!resetModal) return;
    resetModal.classList.remove('open');
  }

  function doReset() {
    fs = createFileSystem();
    cwd = ['home', 'user'];
    completedChallenges = new Set();
    activeChallengeIdx = 0;
    commandHistory = [];
    historyIdx = 0;
    lastCommand = '';
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
    terminalBody.innerHTML = '<div class="ts-welcome">Filesystem reset. Type <span class="ts-cmd-inline">help</span> for commands.</div>';
    renderChallenges();
    updatePrompt();
    input.focus();
    appendOutput('[>>] Start with challenge #1: ' + challenges[0].title, 'output-warning');
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', showResetModal);
  }
  if (modalCancel) {
    modalCancel.addEventListener('click', hideResetModal);
  }
  if (modalConfirm) {
    modalConfirm.addEventListener('click', function () {
      hideResetModal();
      doReset();
    });
  }
  if (resetModal) {
    resetModal.addEventListener('click', function (e) {
      if (e.target === resetModal) hideResetModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && resetModal && resetModal.classList.contains('open')) {
      hideResetModal();
    }
  });

  /* ═══════════════════════════════════════════
     Init
     ═══════════════════════════════════════════ */

  // Restore saved state
  var saved = loadState();
  if (saved) {
    cwd = saved.cwd || ['home', 'user'];
    completedChallenges = new Set(saved.completed || []);
    activeChallengeIdx = saved.activeIdx;
    commandHistory = saved.history || [];
    historyIdx = saved.historyIdx || 0;
  }

  if (activeChallengeIdx === null || activeChallengeIdx === undefined) {
    activeChallengeIdx = 0;
  }

  renderCommands();
  renderChallenges();
  updatePrompt();
  input.focus();

  if (!saved) {
    setTimeout(function () {
      appendOutput('[>>] Start with challenge #1: ' + challenges[0].title, 'output-warning');
    }, 300);
  }

})();
