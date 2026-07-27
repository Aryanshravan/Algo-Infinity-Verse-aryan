/* global cytoscape, dagre, cytoscapeDagre */
(function () {
  'use strict';

  var GROUP_BORDER = [
    '#fca5a5',
    '#93c5fd',
    '#fde68a',
    '#a7f3d0',
    '#fed7aa',
    '#fbcfe8',
    '#c4b5fd',
    '#bfdbfe',
    '#fce7f3',
  ];

  var EXPLAIN_MAP = {
    '\\d': 'matches any digit (0-9)',
    '\\w': 'matches any word character (a-z, A-Z, 0-9, _)',
    '\\s': 'matches any whitespace (space, tab, newline)',
    '\\D': 'matches any non-digit character',
    '\\W': 'matches any non-word character',
    '\\S': 'matches any non-whitespace character',
    '\\b': 'word boundary assertion',
    '\\B': 'non-word boundary assertion',
    '.': 'matches any character (except newline)',
    '^': 'asserts start of string',
    $: 'asserts end of string',
    '|': 'alternation (OR)',
    '*': 'zero or more times (Kleene star)',
    '+': 'one or more times',
    '?': 'zero or one time (optional)',
  };

  var CATASTROPHIC_PATTERNS = [
    /\(\.[*+]\)[*+]/,
    /\(\w\+\)\+/,
    /\(\w\*\)\*/,
    /\(\w\*\)\+/,
    /\(\w\+\)\*/,
    /\+\+/,
    /\*\*/,
    /\?\?/,
    /\([^)]+\)\+\([^)]+\)\+/,
    /\(\w+\|[^)]+\)\+/,
  ];

  var EXERCISES = [
    {
      id: 'ex1',
      level: 'beginner',
      title: 'Match Literal Text',
      desc: 'Write a pattern that matches the word "cat" exactly.',
      answer: 'cat',
      test: 'The cat sat on the mat.',
      hint: 'Just type the characters you want to match.',
    },
    {
      id: 'ex2',
      level: 'beginner',
      title: 'Match Any Vowel',
      desc: 'Create a character class that matches any single vowel (a, e, i, o, u).',
      answer: '[aeiou]',
      test: 'hello world and universe',
      hint: 'Use square brackets [ ] to create a character class.',
    },
    {
      id: 'ex3',
      level: 'beginner',
      title: 'Match a Digit',
      desc: 'Use a shorthand class to match any single digit character.',
      answer: '\\d',
      test: 'Room 101 is on floor 2.',
      hint: 'Use the backslash-d shorthand.',
    },
    {
      id: 'ex4',
      level: 'beginner',
      title: 'Match Exactly Three Digits',
      desc: 'Use a quantifier to match exactly three digits in a row.',
      answer: '\\d{3}',
      test: 'Codes: 123, 45, 6789, 0.',
      hint: 'Use curly braces {n} for exact count.',
    },
    {
      id: 'ex5',
      level: 'beginner',
      title: 'Match Any Three Characters',
      desc: 'Use the wildcard to match any three characters in a row.',
      answer: '...',
      test: 'abc 123 !@# xyz',
      hint: 'The dot matches any single character.',
    },
    {
      id: 'ex6',
      level: 'intermediate',
      title: 'Repeating Pattern with Groups',
      desc: 'Match one or more repetitions of "ha" using a group and quantifier.',
      answer: '(ha)+',
      test: 'ha haha hahaha he hehe',
      hint: 'Use parentheses to group and + for one or more.',
    },
    {
      id: 'ex7',
      level: 'intermediate',
      title: 'Alternation',
      desc: 'Match either "cat" or "dog" using alternation.',
      answer: 'cat|dog',
      test: 'I have a cat and a dog and a bird.',
      hint: 'Use the pipe | for OR.',
    },
    {
      id: 'ex8',
      level: 'intermediate',
      title: 'Start Anchor',
      desc: 'Match "Hello" only if it appears at the start of a line.',
      answer: '^Hello',
      test: 'Hello world\nSay Hello again',
      hint: 'Use the caret ^ to anchor to the start.',
    },
    {
      id: 'ex9',
      level: 'intermediate',
      title: 'Whole Word Match',
      desc: 'Match the word "the" only as a whole word, not part of other words.',
      answer: '\\bthe\\b',
      test: 'the them there other the',
      hint: 'Use \\b for word boundaries.',
    },
    {
      id: 'ex10',
      level: 'intermediate',
      title: 'Optional Character',
      desc: 'Match both "color" and "colour" (British spelling).',
      answer: 'colou?r',
      test: 'The color is red. The colour is blue.',
      hint: 'Use ? to make the preceding character optional.',
    },
    {
      id: 'ex11',
      level: 'advanced',
      title: 'Positive Lookahead',
      desc: 'Match any character that is followed by a digit, without including the digit in the match.',
      answer: '.(?=\\d)',
      test: 'a1 b2 c3 xyz',
      hint: 'Use (?=...) for positive lookahead.',
    },
    {
      id: 'ex12',
      level: 'advanced',
      title: 'Positive Lookbehind',
      desc: 'Match digits that follow a dollar sign, without including the $ in the match.',
      answer: '(?<=\\$)\\d+',
      test: 'Total: $42.50, Price: $9.99',
      hint: 'Use (?<=...) for positive lookbehind.',
    },
    {
      id: 'ex13',
      level: 'advanced',
      title: 'Backreference',
      desc: 'Match a repeated word (a word followed by a space and the same word again).',
      answer: '\\b(\\w+)\\s+\\1\\b',
      test: 'the the is repeated but not this',
      hint: 'Use \\1 to reference the first captured group.',
    },
    {
      id: 'ex14',
      level: 'advanced',
      title: 'Non-capturing Group',
      desc: 'Match repeated "abc" without creating a capture group.',
      answer: '(?:abc)+',
      test: 'abc abcabc xyzabc',
      hint: 'Use (?:...) for non-capturing groups.',
    },
    {
      id: 'ex15',
      level: 'advanced',
      title: 'Named Capture Group',
      desc: 'Capture a year (4 digits) in a named group called "year".',
      answer: '(?<year>\\d{4})',
      test: 'Born in 1990, graduated in 2012.',
      hint: 'Use (?<name>...) for named groups.',
    },
  ];

  var PATTERNS = [
    {
      id: 'p1',
      category: 'validation',
      title: 'IP Address (IPv4)',
      desc: 'Validates a standard IPv4 address.',
      pattern: '^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$',
      test: '192.168.1.1',
    },
    {
      id: 'p2',
      category: 'validation',
      title: 'Email Address',
      desc: 'Extracts or validates common email address formats.',
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      test: 'user@example.com first.last@domain.co',
    },
    {
      id: 'p3',
      category: 'validation',
      title: 'URL Parsing',
      desc: 'Matches HTTP/HTTPS URLs with domain and path.',
      pattern: 'https?://[^\\s/$.?#].[^\\s]*',
      test: 'Visit https://example.com/path?q=1 for more.',
    },
    {
      id: 'p4',
      category: 'validation',
      title: 'Date (YYYY-MM-DD)',
      desc: 'Validates dates in ISO 8601 format.',
      pattern: '^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$',
      test: '2024-03-15',
    },
    {
      id: 'p5',
      category: 'validation',
      title: 'Hex Color Code',
      desc: 'Matches 3 or 6 digit hex color codes.',
      pattern: '#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b',
      test: 'Colors: #fff, #123456, #abc, not #xyz',
    },
    {
      id: 'p6',
      category: 'extraction',
      title: 'Phone Number',
      desc: 'Extracts phone numbers in various formats.',
      pattern: '\\+?\\d{1,3}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}',
      test: 'Call +1 (555) 123-4567 or 555-1234',
    },
    {
      id: 'p7',
      category: 'extraction',
      title: 'Extract Numbers',
      desc: 'Extracts integers and decimals from text.',
      pattern: '-?\\d+(?:\\.\\d+)?',
      test: 'Values: 42, -17, 3.14, 1000.',
    },
    {
      id: 'p8',
      category: 'extraction',
      title: 'Sentence Extraction',
      desc: 'Matches complete sentences starting with a capital letter.',
      pattern: '[A-Z][^.!?]*[.!?]',
      test: 'Hello world. This is a test! Are you ready? Yes.',
    },
    {
      id: 'p9',
      category: 'extraction',
      title: 'Extract Hashtags',
      desc: 'Matches hashtags from social media text.',
      pattern: '#\\w+',
      test: 'Loving #coding and #javascript! #100DaysOfCode',
    },
    {
      id: 'p10',
      category: 'formatting',
      title: 'Whitespace Normalizer',
      desc: 'Matches leading/trailing spaces and multiple spaces between words.',
      pattern: '^\\s+|\\s+$|\\s+(?=\\s)',
      test: '  Too   many   spaces  ',
    },
    {
      id: 'p11',
      category: 'formatting',
      title: 'SSN Format',
      desc: 'Matches US Social Security Number format (XXX-XX-XXXX).',
      pattern: '\\d{3}-\\d{2}-\\d{4}',
      test: 'SSN: 123-45-6789, not 123-456-789',
    },
    {
      id: 'p12',
      category: 'validation',
      title: 'Password Strength',
      desc: 'Validates passwords with at least 8 chars, one uppercase, one digit.',
      pattern: '^(?=.*[A-Z])(?=.*\\d).{8,}$',
      test: 'Password1',
    },
  ];

  var state = {
    currentTab: 'playground',
    lastPattern: '',
    lastFlags: 'gm',
    lastTest: '',
    exerciseCompleted: {},
    savedPatterns: [],
  };

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function qsa(sel, ctx) {
    return (ctx || document).querySelectorAll(sel);
  }

  var dom = {};

  function cacheDoms() {
    dom = {
      patternInput: qs('#rgPatternInput'),
      flagsInput: qs('#rgFlagsInput'),
      matchBtn: qs('#rgMatchBtn'),
      clearBtn: qs('#rgClearBtn'),
      testInput: qs('#rgTestInput'),
      highlightOverlay: qs('#rgHighlightOverlay'),
      charCount: qs('#rgCharCount'),
      matchCount: qs('#rgMatchCount'),
      groupCount: qs('#rgGroupCount'),
      stepEstimate: qs('#rgStepEstimate'),
      backtrackWarn: qs('#rgBacktrackWarn'),
      matchDetails: qs('#rgMatchDetails'),
      explanation: qs('#rgExplanation'),
      groupDetails: qs('#rgGroupDetails'),
      savedBtn: qs('#rgSavedListBtn'),
      saveBtn: qs('#rgSaveBtn'),
      shareBtn: qs('#rgShareBtn'),
      savedModal: qs('#rgSavedModal'),
      saveModal: qs('#rgSaveModal'),
      savedList: qs('#rgSavedList'),
      saveName: qs('#rgSaveName'),
      saveConfirm: qs('#rgSaveConfirmBtn'),
      shareToast: qs('#rgShareToast'),
      exGrid: qs('#rgExGrid'),
      exProgress: qs('#rgExProgress'),
      patGrid: qs('#rgPatGrid'),
      nfaPattern: qs('#rgNfaPattern'),
      nfaCompile: qs('#rgNfaCompileBtn'),
      nfaString: qs('#rgNfaString'),
      nfaStep: qs('#rgNfaStepBtn'),
      nfaRun: qs('#rgNfaRunBtn'),
      nfaReset: qs('#rgNfaResetBtn'),
      nfaSpeed: qs('#rgNfaSpeed'),
      nfaSpeedVal: qs('#rgNfaSpeedVal'),
      nfaLogs: qs('#rgNfaLogs'),
      nfaChars: qs('#rgNfaChars'),
      nfaVerdict: qs('#rgNfaVerdict'),
      nfaEpsilonInfo: qs('#rgNfaEpsilonInfo'),
      nfaStateCount: qs('#rgNfaStateCount'),
      nfaCy: qs('#rgCy'),
      nfaEmpty: qs('#rgNfaEmpty'),
    };
  }

  var tabs = qsa('.rg-tab');
  var panels = {
    playground: qs('#rg-playground-panel'),
    exercises: qs('#rg-exercises-panel'),
    patterns: qs('#rg-patterns-panel'),
    nfa: qs('#rg-nfa-panel'),
  };

  function switchTab(tabId) {
    state.currentTab = tabId;
    tabs.forEach(function (t) {
      var isActive = t.id === 'rg-tab-' + tabId;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    Object.keys(panels).forEach(function (key) {
      panels[key].hidden = key !== tabId;
      panels[key].classList.toggle('rg-panel-active', key === tabId);
    });
    if (tabId === 'nfa' && nfaCy) {
      nfaCy.resize();
      nfaCy.fit(undefined, 50);
    }
  }

  function debounce(fn, ms) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        fn.apply(ctx, args);
      }, ms);
    };
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  var toastTimer = null;
  function showToast(msg, duration) {
    duration = duration || 2500;
    if (toastTimer) clearTimeout(toastTimer);
    dom.shareToast.textContent = msg;
    dom.shareToast.hidden = false;
    toastTimer = setTimeout(function () {
      dom.shareToast.hidden = true;
      toastTimer = null;
    }, duration);
  }

  function closeModals() {
    dom.savedModal.hidden = true;
    dom.saveModal.hidden = true;
  }

  function modalsClick(e) {
    if (
      e.target.closest('.rg-modal-backdrop') ||
      e.target.closest('.rg-modal-close') ||
      e.target.closest('.rg-modal-cancel')
    ) {
      closeModals();
    }
  }

  function parsePattern(raw, flags) {
    try {
      return new RegExp(raw, flags);
    } catch (e) {
      return null;
    }
  }

  function renderHighlight(text, matches) {
    if (!matches || matches.length === 0) return escHtml(text);
    var handled = new Array(text.length).fill(null);

    matches.forEach(function (m) {
      var matchStart = m.index;
      var matchEnd = matchStart + m[0].length;
      for (var i = matchStart; i < matchEnd; i++) {
        handled[i] = handled[i] || 'rg-hl-g0';
      }
      var prevGroupEnd = 0;
      for (var gi = 1; gi < m.length; gi++) {
        if (m[gi] === undefined || m[gi].length === 0) continue;
        var gRel = m[0].indexOf(m[gi], prevGroupEnd);
        if (gRel < 0) gRel = m[0].indexOf(m[gi]);
        if (gRel < 0) continue;
        var gStart = matchStart + gRel;
        var gEnd = gStart + m[gi].length;
        prevGroupEnd = gRel + m[gi].length;
        for (var j = gStart; j < gEnd && j < text.length; j++) {
          handled[j] = 'rg-hl-g' + Math.min(gi, 8);
        }
      }
    });

    var container = document.createElement('div');
    var i = 0;
    var segStart;
    while (i < text.length) {
      if (handled[i]) {
        var cls = handled[i];
        segStart = i;
        while (i < text.length && handled[i] === cls) i++;
        var span = document.createElement('span');
        span.className = cls;
        span.textContent = text.slice(segStart, i);
        container.appendChild(span);
      } else {
        segStart = i;
        while (i < text.length && !handled[i]) i++;
        container.appendChild(document.createTextNode(text.slice(segStart, i)));
      }
    }
    return container.innerHTML;
  }

  function computeMatches() {
    var raw = dom.patternInput.value;
    var flags = dom.flagsInput.value || '';
    var test = dom.testInput.value;

    if (!raw) {
      dom.highlightOverlay.innerHTML = '';
      dom.matchCount.innerHTML = '<i class="fas fa-check-circle"></i> Matches: <strong>0</strong>';
      dom.groupCount.innerHTML = '<i class="fas fa-layer-group"></i> Groups: <strong>0</strong>';
      dom.stepEstimate.innerHTML = '<i class="fas fa-gauge"></i> Steps: <strong>0</strong>';
      dom.backtrackWarn.style.display = 'none';
      dom.matchDetails.innerHTML = '';
      dom.explanation.innerHTML =
        '<p class="rg-placeholder-text">Enter a regex pattern and click Match to see an explanation.</p>';
      dom.groupDetails.innerHTML =
        '<p class="rg-placeholder-text">Matched groups will appear here.</p>';
      dom.charCount.textContent = test.length + ' chars';
      return;
    }

    var re = parsePattern(raw, flags);
    if (!re) {
      dom.highlightOverlay.innerHTML = '';
      dom.matchDetails.innerHTML =
        '<div class="rg-match-item" style="border-color:var(--rg-rose);color:var(--rg-rose);">Invalid regex pattern</div>';
      return;
    }

    var matches = [];
    var m;
    var maxSteps = 10000;
    var steps = 0;
    re.lastIndex = 0;
    while ((m = re.exec(test)) !== null) {
      if (steps >= maxSteps) break;
      matches.push(m);
      steps++;
      if (!re.global && !re.sticky) break;
      if (m.index === re.lastIndex) re.lastIndex++;
    }

    var allMatches = matches;
    var groupCount = allMatches.length > 0 ? allMatches[0].length - 1 : 0;

    dom.highlightOverlay.innerHTML = renderHighlight(test, allMatches);
    dom.charCount.textContent = test.length + ' chars';
    dom.matchCount.innerHTML =
      '<i class="fas fa-check-circle"></i> Matches: <strong>' + allMatches.length + '</strong>';
    dom.groupCount.innerHTML =
      '<i class="fas fa-layer-group"></i> Groups: <strong>' + groupCount + '</strong>';
    dom.stepEstimate.innerHTML =
      '<i class="fas fa-gauge"></i> Steps: <strong>~' + (steps * test.length || 1) + '</strong>';

    var risk = checkCatastrophic(raw);
    if (risk) {
      dom.backtrackWarn.style.display = 'flex';
      dom.backtrackWarn.className = 'rg-result-item rg-warn';
    } else {
      dom.backtrackWarn.style.display = 'none';
    }

    var detailsHtml = '';
    allMatches.forEach(function (match, idx) {
      var displayStr = match[0].length > 50 ? match[0].slice(0, 50) + '...' : match[0];
      detailsHtml +=
        '<div class="rg-match-item" style="border-left-color:' + GROUP_BORDER[0] + ';">';
      detailsHtml += '<span class="rg-match-idx">#' + (idx + 1) + '</span>';
      detailsHtml += escHtml(displayStr);
      detailsHtml += ' <span class="rg-match-idx">[' + match.index + ']</span>';
      detailsHtml += '</div>';
    });
    dom.matchDetails.innerHTML =
      detailsHtml ||
      '<div class="rg-match-item" style="border-color:transparent;color:var(--rg-muted);">No matches</div>';

    dom.explanation.innerHTML = generateExplanation(raw);
    renderGroupDetails(allMatches);
  }

  function generateExplanation(pattern) {
    if (!pattern)
      return '<p class="rg-placeholder-text">Enter a regex pattern and click Match to see an explanation.</p>';

    var fragments = [];
    var i = 0;
    while (i < pattern.length) {
      var c = pattern[i];

      if (c === '\\' && i + 1 < pattern.length) {
        var esc = '\\' + pattern[i + 1];

        if (EXPLAIN_MAP[esc]) {
          fragments.push({ pat: esc, desc: EXPLAIN_MAP[esc] });
          i += 2;
        } else if (esc === '\\d' || esc === '\\w' || esc === '\\s') {
          var quant = '';
          if (
            i + 2 < pattern.length &&
            (pattern[i + 2] === '+' || pattern[i + 2] === '*' || pattern[i + 2] === '?')
          ) {
            quant = pattern[i + 2];
          }
          if (quant) {
            fragments.push({
              pat: esc + quant,
              desc: EXPLAIN_MAP[esc] + ', ' + explainQuant(quant),
            });
            i += 3;
          } else {
            fragments.push({ pat: esc, desc: EXPLAIN_MAP[esc] });
            i += 2;
          }
        } else if (
          pattern[i + 1] === 'd' ||
          pattern[i + 1] === 'w' ||
          pattern[i + 1] === 's' ||
          pattern[i + 1] === 'D' ||
          pattern[i + 1] === 'W' ||
          pattern[i + 1] === 'S' ||
          pattern[i + 1] === 'b' ||
          pattern[i + 1] === 'B'
        ) {
          fragments.push({
            pat: esc,
            desc: EXPLAIN_MAP[esc] || 'escaped character: ' + escHtml(esc),
          });
          i += 2;
        } else {
          fragments.push({ pat: esc, desc: 'escaped literal: ' + escHtml(pattern[i + 1]) });
          i += 2;
        }
        continue;
      }

      if (c === '[') {
        var clsEnd = pattern.indexOf(']', i);
        if (clsEnd > i) {
          var cls = pattern.slice(i, clsEnd + 1);
          var negated = cls[1] === '^' ? 'negated ' : '';
          var clsContent = negated ? cls.slice(2, -1) : cls.slice(1, -1);
          fragments.push({ pat: cls, desc: negated + 'character class: ' + escHtml(clsContent) });
          i = clsEnd + 1;
          continue;
        }
      }

      if (c === '(') {
        if (pattern.slice(i, i + 3) === '(?:') {
          var ngEnd = findGroupEnd(pattern, i);
          if (ngEnd > i) {
            fragments.push({ pat: pattern.slice(i, ngEnd + 1), desc: 'non-capturing group' });
            i = ngEnd + 1;
            continue;
          }
        } else if (pattern.slice(i, i + 3) === '(?=') {
          var laEnd = findGroupEnd(pattern, i);
          if (laEnd > i) {
            fragments.push({
              pat: pattern.slice(i, laEnd + 1),
              desc: 'positive lookahead assertion',
            });
            i = laEnd + 1;
            continue;
          }
        } else if (pattern.slice(i, i + 3) === '(?!') {
          var naEnd = findGroupEnd(pattern, i);
          if (naEnd > i) {
            fragments.push({
              pat: pattern.slice(i, naEnd + 1),
              desc: 'negative lookahead assertion',
            });
            i = naEnd + 1;
            continue;
          }
        } else if (pattern.slice(i, i + 4) === '(?<=') {
          var lbEnd = findGroupEnd(pattern, i);
          if (lbEnd > i) {
            fragments.push({
              pat: pattern.slice(i, lbEnd + 1),
              desc: 'positive lookbehind assertion',
            });
            i = lbEnd + 1;
            continue;
          }
        } else if (pattern.slice(i, i + 4) === '(?<!') {
          var nbEnd = findGroupEnd(pattern, i);
          if (nbEnd > i) {
            fragments.push({
              pat: pattern.slice(i, nbEnd + 1),
              desc: 'negative lookbehind assertion',
            });
            i = nbEnd + 1;
            continue;
          }
        } else if (pattern.slice(i, i + 3) === '(?<') {
          var namedEnd = findGroupEnd(pattern, i);
          if (namedEnd > i) {
            var nameMatch = pattern.slice(i + 3, namedEnd).match(/(\w+)>/);
            var groupName = nameMatch ? nameMatch[1] : 'unknown';
            fragments.push({
              pat: pattern.slice(i, namedEnd + 1),
              desc: 'named capturing group "' + escHtml(groupName) + '"',
            });
            i = namedEnd + 1;
            continue;
          }
        } else {
          var gEnd = findGroupEnd(pattern, i);
          if (gEnd > i) {
            fragments.push({ pat: pattern.slice(i, gEnd + 1), desc: 'capturing group' });
            i = gEnd + 1;
            continue;
          }
        }
      }

      if (c === ')' || c === ']') {
        fragments.push({ pat: c, desc: c === ')' ? 'closing group' : 'closing character class' });
        i++;
        continue;
      }

      if (c === '+' || c === '*' || c === '?') {
        if (fragments.length > 0) {
          var last = fragments[fragments.length - 1];
          var lastPatChar = last.pat.charAt(last.pat.length - 1);
          if (c === '?' && (lastPatChar === '+' || lastPatChar === '*' || lastPatChar === '?')) {
            last.pat = last.pat + c;
            last.desc = last.desc.replace(/, [^,]+$/, '') + ', ' + explainQuant(lastPatChar + '?');
          } else {
            last.pat = last.pat + c;
            last.desc = last.desc + ', ' + explainQuant(c);
          }
        } else {
          fragments.push({ pat: c, desc: explainQuant(c) });
        }
        i++;
        continue;
      }

      if (c === '{') {
        var braceEnd = pattern.indexOf('}', i);
        if (braceEnd > i) {
          var quantStr = pattern.slice(i, braceEnd + 1);
          if (fragments.length > 0) {
            var lastF = fragments[fragments.length - 1];
            lastF.pat = lastF.pat + quantStr;
            lastF.desc = lastF.desc + ', ' + explainQuant(quantStr);
          } else {
            fragments.push({ pat: quantStr, desc: explainQuant(quantStr) });
          }
          i = braceEnd + 1;
          continue;
        }
      }

      if (EXPLAIN_MAP[c]) {
        fragments.push({ pat: c, desc: EXPLAIN_MAP[c] });
      } else {
        fragments.push({ pat: c, desc: 'literal character: ' + escHtml(c) });
      }
      i++;
    }

    if (fragments.length === 0)
      return '<p class="rg-placeholder-text">Enter a pattern to see its explanation.</p>';

    var html = '';
    fragments.forEach(function (f) {
      html +=
        '<div class="rg-explain-item"><span class="rg-explain-pat">' +
        escHtml(f.pat) +
        '</span><span class="rg-explain-desc">' +
        escHtml(f.desc) +
        '</span></div>';
    });
    return html;
  }

  function findGroupEnd(s, start) {
    var depth = 1;
    var i = start + 1;
    while (i < s.length && depth > 0) {
      if (s[i] === '(' && s[i - 1] !== '\\') depth++;
      else if (s[i] === ')' && s[i - 1] !== '\\') depth--;
      if (depth === 0) return i;
      i++;
    }
    return -1;
  }

  function explainQuant(q) {
    if (q === '+') return 'one or more times';
    if (q === '*') return 'zero or more times';
    if (q === '?') return 'zero or one time (optional)';
    if (q === '+?') return 'one or more (lazy)';
    if (q === '*?') return 'zero or more (lazy)';
    if (q === '??') return 'zero or one (lazy)';
    if (q.charAt(0) === '{') {
      var inner = q.slice(1, -1);
      if (inner.indexOf(',') === -1) return 'exactly ' + inner + ' times';
      var parts = inner.split(',');
      if (parts[1] === '') return parts[0] + ' or more times';
      return 'between ' + parts[0] + ' and ' + parts[1] + ' times';
    }
    return 'quantifier: ' + escHtml(q);
  }

  function checkCatastrophic(pattern) {
    return CATASTROPHIC_PATTERNS.some(function (re) {
      return re.test(pattern);
    });
  }

  function renderGroupDetails(matches) {
    if (!matches || matches.length === 0) {
      dom.groupDetails.innerHTML =
        '<p class="rg-placeholder-text">Matched groups will appear here.</p>';
      return;
    }

    var html = '';
    matches.forEach(function (match, mi) {
      for (var gi = 1; gi < match.length; gi++) {
        if (match[gi] !== undefined) {
          var colorIdx = Math.min(gi, GROUP_BORDER.length - 1);
          html +=
            '<div class="rg-group-row" style="border-left:3px solid ' +
            GROUP_BORDER[colorIdx] +
            ';padding-left:0.5rem;margin-bottom:0.25rem;">';
          html += '<span class="rg-group-num">#' + (mi + 1) + ' G' + gi + '</span>';
          html += '<span class="rg-group-val">' + escHtml(match[gi]) + '</span>';
          html += '</div>';
        }
      }
    });

    if (!html) {
      html = '<p class="rg-placeholder-text">No capture groups in matches.</p>';
    }
    dom.groupDetails.innerHTML = html;
  }

  function runMatch() {
    computeMatches();
    syncURL();
  }

  function syncURL() {
    var pattern = dom.patternInput.value;
    var flags = dom.flagsInput.value;
    var test = dom.testInput.value;
    if (pattern || test) {
      var params = new URLSearchParams();
      if (pattern) params.set('p', pattern);
      if (flags && flags !== 'gm') params.set('f', flags);
      if (test) params.set('s', test);
      var url = window.location.pathname + '?' + params.toString();
      history.replaceState(null, '', url);
    }
  }

  function loadFromURL() {
    var params = new URLSearchParams(window.location.search);
    var p = params.get('p');
    var f = params.get('f');
    var s = params.get('s');
    if (p) dom.patternInput.value = p;
    if (f) dom.flagsInput.value = f;
    if (s) dom.testInput.value = s;
    if (p || s) computeMatches();
  }

  function loadSavedPatterns() {
    try {
      var data = localStorage.getItem('rg_saved_patterns');
      state.savedPatterns = data ? JSON.parse(data) : [];
    } catch (e) {
      state.savedPatterns = [];
    }
  }

  function savePatterns() {
    try {
      localStorage.setItem('rg_saved_patterns', JSON.stringify(state.savedPatterns));
    } catch (e) {
      /* localStorage unavailable or full */
    }
  }

  function renderSavedList() {
    dom.savedList.innerHTML = '';
    if (state.savedPatterns.length === 0) {
      dom.savedList.innerHTML = '<p class="rg-placeholder-text">No saved patterns yet.</p>';
      return;
    }
    state.savedPatterns.forEach(function (sp, idx) {
      var item = document.createElement('div');
      item.className = 'rg-saved-item';
      item.innerHTML =
        '<div style="flex:1;min-width:0;">' +
        '<div class="rg-saved-name">' +
        escHtml(sp.name) +
        '</div>' +
        '<div class="rg-saved-pat">/' +
        escHtml(sp.pattern) +
        '/' +
        escHtml(sp.flags || '') +
        '</div>' +
        '</div>' +
        '<div class="rg-saved-actions">' +
        '<button type="button" data-action="load" data-idx="' +
        idx +
        '" aria-label="Load pattern"><i class="fas fa-upload"></i></button>' +
        '<button type="button" data-action="delete" data-idx="' +
        idx +
        '" aria-label="Delete pattern"><i class="fas fa-trash-can"></i></button>' +
        '</div>';
      dom.savedList.appendChild(item);
    });
  }

  function handleSavedAction(e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    var idx = parseInt(btn.dataset.idx, 10);
    var action = btn.dataset.action;
    if (action === 'load') {
      var sp = state.savedPatterns[idx];
      if (sp) {
        dom.patternInput.value = sp.pattern;
        dom.flagsInput.value = sp.flags || '';
        dom.testInput.value = sp.test || '';
        runMatch();
        closeModals();
        switchTab('playground');
      }
    } else if (action === 'delete') {
      state.savedPatterns.splice(idx, 1);
      savePatterns();
      renderSavedList();
    }
  }

  function handleSave() {
    var pattern = dom.patternInput.value;
    if (!pattern) {
      showToast('Enter a pattern first');
      return;
    }
    dom.saveName.value = pattern;
    dom.saveModal.hidden = false;
  }

  function confirmSave() {
    var name = dom.saveName.value.trim();
    var pattern = dom.patternInput.value;
    var flags = dom.flagsInput.value;
    var test = dom.testInput.value;
    if (!name) {
      showToast('Enter a name for the pattern');
      return;
    }
    if (!pattern) {
      showToast('Enter a pattern first');
      return;
    }
    state.savedPatterns.push({ name: name, pattern: pattern, flags: flags, test: test });
    savePatterns();
    renderSavedList();
    closeModals();
    showToast('Pattern saved!');
  }

  function handleShare() {
    var pattern = dom.patternInput.value;
    var test = dom.testInput.value;
    if (!pattern && !test) {
      showToast('Enter a pattern to share');
      return;
    }
    var params = new URLSearchParams();
    if (pattern) params.set('p', pattern);
    var flags = dom.flagsInput.value;
    if (flags && flags !== 'gm') params.set('f', flags);
    if (test) params.set('s', test);
    var url = window.location.origin + window.location.pathname + '?' + params.toString();
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(function () {
          showToast('URL copied to clipboard!');
        })
        .catch(function () {
          fallbackCopy(url);
        });
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('URL copied to clipboard!');
    } catch (e) {
      showToast('Could not copy URL');
    }
    document.body.removeChild(ta);
  }

  function loadExerciseProgress() {
    try {
      var data = localStorage.getItem('rg_exercise_progress');
      state.exerciseCompleted = data ? JSON.parse(data) : {};
    } catch (e) {
      state.exerciseCompleted = {};
    }
  }

  function saveExerciseProgress() {
    try {
      localStorage.setItem('rg_exercise_progress', JSON.stringify(state.exerciseCompleted));
    } catch (e) {
      /* localStorage unavailable or full */
    }
  }

  function renderExercises(filterLevel) {
    filterLevel = filterLevel || 'all';
    var filtered =
      filterLevel === 'all'
        ? EXERCISES
        : EXERCISES.filter(function (e) {
            return e.level === filterLevel;
          });
    var completed = 0;
    var html = '';
    filtered.forEach(function (ex) {
      var isDone = !!state.exerciseCompleted[ex.id];
      if (isDone) completed++;
      html += '<div class="rg-ex-card">';
      html += '<div class="rg-ex-card-header">';
      html += '<span class="rg-ex-level ' + ex.level + '">' + ex.level + '</span>';
      if (isDone)
        html += '<span class="rg-ex-completed"><i class="fas fa-check-circle"></i> Done</span>';
      html += '</div>';
      html += '<h4 class="rg-ex-title">' + escHtml(ex.title) + '</h4>';
      html += '<p class="rg-ex-desc">' + escHtml(ex.desc) + '</p>';
      html += '<p class="rg-ex-hint"><i class="fas fa-lightbulb"></i> ' + escHtml(ex.hint) + '</p>';
      if (isDone) {
        html += '<div class="rg-ex-pattern">/' + escHtml(ex.answer) + '/</div>';
      } else {
        html +=
          '<div class="rg-ex-pattern" style="color:var(--rg-muted);font-style:italic;">Pattern hidden — try it!</div>';
      }
      html += '<div class="rg-ex-actions">';
      html +=
        '<button type="button" class="rg-btn rg-btn-primary rg-btn-sm rg-ex-try" data-id="' +
        ex.id +
        '" data-answer="' +
        escHtml(ex.answer) +
        '" data-test="' +
        escHtml(ex.test) +
        '"><i class="fas fa-play"></i> Try</button>';
      if (!isDone) {
        html +=
          '<button type="button" class="rg-btn rg-btn-ghost rg-btn-sm rg-ex-reveal" data-id="' +
          ex.id +
          '"><i class="fas fa-eye"></i> Show</button>';
      }
      html += '</div>';
      html += '</div>';
    });
    dom.exGrid.innerHTML =
      html || '<p class="rg-placeholder-text">No exercises for this level.</p>';

    dom.exProgress.textContent = completed + ' / ' + filtered.length + ' completed';
  }

  function handleExerciseClick(e) {
    var tryBtn = e.target.closest('.rg-ex-try');
    if (tryBtn) {
      var answer = tryBtn.dataset.answer;
      var testStr = tryBtn.dataset.test;
      dom.patternInput.value = answer;
      dom.testInput.value = testStr;
      dom.flagsInput.value = 'gm';
      runMatch();
      switchTab('playground');
      return;
    }
    var revealBtn = e.target.closest('.rg-ex-reveal');
    if (revealBtn) {
      var exId = revealBtn.dataset.id;
      state.exerciseCompleted[exId] = true;
      saveExerciseProgress();
      renderExercises(document.querySelector('.rg-ex-filter.active')?.dataset?.level || 'all');
      return;
    }
  }

  function renderPatterns(filterCat) {
    filterCat = filterCat || 'all';
    var filtered =
      filterCat === 'all'
        ? PATTERNS
        : PATTERNS.filter(function (p) {
            return p.category === filterCat;
          });
    var html = '';
    filtered.forEach(function (p) {
      html += '<div class="rg-pat-card">';
      html += '<div class="rg-pat-card-header">';
      html += '<span class="rg-pat-card-cat">' + escHtml(p.category) + '</span>';
      html += '</div>';
      html += '<h4 class="rg-pat-title">' + escHtml(p.title) + '</h4>';
      html += '<p class="rg-pat-desc">' + escHtml(p.desc) + '</p>';
      html += '<pre class="rg-pat-code">' + escHtml(p.pattern) + '</pre>';
      html += '<div class="rg-pat-actions">';
      html +=
        '<button type="button" class="rg-btn rg-btn-primary rg-btn-sm rg-pat-use" data-pattern="' +
        escHtml(p.pattern) +
        '" data-test="' +
        escHtml(p.test) +
        '"><i class="fas fa-play"></i> Use</button>';
      html +=
        '<button type="button" class="rg-btn rg-btn-ghost rg-btn-sm rg-pat-copy" data-pattern="' +
        escHtml(p.pattern) +
        '"><i class="fas fa-copy"></i> Copy</button>';
      html += '</div>';
      html += '</div>';
    });
    dom.patGrid.innerHTML =
      html || '<p class="rg-placeholder-text">No patterns in this category.</p>';
  }

  function handlePatternClick(e) {
    var useBtn = e.target.closest('.rg-pat-use');
    if (useBtn) {
      dom.patternInput.value = useBtn.dataset.pattern;
      dom.testInput.value = useBtn.dataset.test;
      dom.flagsInput.value = 'gm';
      runMatch();
      switchTab('playground');
      return;
    }
    var copyBtn = e.target.closest('.rg-pat-copy');
    if (copyBtn) {
      var text = copyBtn.dataset.pattern;
      var origHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
      copyBtn.disabled = true;
      (function doCopy() {
        if (navigator.clipboard) {
          navigator.clipboard
            .writeText(text)
            .then(function () {
              setTimeout(function () {
                copyBtn.innerHTML = origHtml;
                copyBtn.disabled = false;
              }, 1800);
            })
            .catch(function () {
              copyBtn.innerHTML = origHtml;
              copyBtn.disabled = false;
            });
        } else {
          fallbackCopy(text);
          setTimeout(function () {
            copyBtn.innerHTML = origHtml;
            copyBtn.disabled = false;
          }, 1800);
        }
      })();
    }
  }

  var stateCounter = 0;

  function NFAState(isEnd) {
    this.id = 'S' + stateCounter++;
    this.isEnd = !!isEnd;
    this.transitions = {};
  }

  NFAState.prototype.addTransition = function (symbol, state) {
    if (!this.transitions[symbol]) this.transitions[symbol] = [];
    this.transitions[symbol].push(state);
  };

  function NFA(start, end) {
    this.start = start;
    this.end = end;
  }

  function insertExplicitConcat(exp) {
    var res = '';
    for (var i = 0; i < exp.length; i++) {
      var c1 = exp[i];
      res += c1;
      if (i + 1 < exp.length) {
        var c2 = exp[i + 1];
        if (/[a-zA-Z0-9*+?)]/.test(c1) && /[a-zA-Z0-9(]/.test(c2)) {
          res += '.';
        }
      }
    }
    return res;
  }

  function toPostfix(exp) {
    var postfix = '';
    var stack = [];
    var prec = { '*': 3, '+': 3, '?': 3, '.': 2, '|': 1, '(': 0 };
    for (var i = 0; i < exp.length; i++) {
      var c = exp[i];
      if (/[a-zA-Z0-9]/.test(c)) {
        postfix += c;
      } else if (c === '(') {
        stack.push(c);
      } else if (c === ')') {
        while (stack.length > 0 && stack[stack.length - 1] !== '(') {
          postfix += stack.pop();
        }
        stack.pop();
      } else {
        while (stack.length > 0 && prec[stack[stack.length - 1]] >= prec[c]) {
          postfix += stack.pop();
        }
        stack.push(c);
      }
    }
    while (stack.length > 0) postfix += stack.pop();
    return postfix;
  }

  function compileNFA(postfix) {
    var stack = [];
    stateCounter = 0;
    for (var i = 0; i < postfix.length; i++) {
      var c = postfix[i];
      if (/[a-zA-Z0-9]/.test(c)) {
        var s = new NFAState();
        var e = new NFAState();
        s.addTransition(c, e);
        stack.push(new NFA(s, e));
      } else if (c === '.') {
        if (stack.length < 2) throw new Error("Operator '.' lacks operands");
        var nfa2 = stack.pop();
        var nfa1 = stack.pop();
        nfa1.end.addTransition('\u03B5', nfa2.start);
        stack.push(new NFA(nfa1.start, nfa2.end));
      } else if (c === '|') {
        if (stack.length < 2) throw new Error("Operator '|' lacks operands");
        nfa2 = stack.pop();
        nfa1 = stack.pop();
        var ns = new NFAState();
        var ne = new NFAState();
        ns.addTransition('\u03B5', nfa1.start);
        ns.addTransition('\u03B5', nfa2.start);
        nfa1.end.addTransition('\u03B5', ne);
        nfa2.end.addTransition('\u03B5', ne);
        stack.push(new NFA(ns, ne));
      } else if (c === '*') {
        if (stack.length < 1) throw new Error("Operator '*' lacks operand");
        nfa1 = stack.pop();
        ns = new NFAState();
        ne = new NFAState();
        ns.addTransition('\u03B5', nfa1.start);
        ns.addTransition('\u03B5', ne);
        nfa1.end.addTransition('\u03B5', nfa1.start);
        nfa1.end.addTransition('\u03B5', ne);
        stack.push(new NFA(ns, ne));
      } else if (c === '+') {
        if (stack.length < 1) throw new Error("Operator '+' lacks operand");
        nfa1 = stack.pop();
        ns = new NFAState();
        ne = new NFAState();
        ns.addTransition('\u03B5', nfa1.start);
        nfa1.end.addTransition('\u03B5', nfa1.start);
        nfa1.end.addTransition('\u03B5', ne);
        stack.push(new NFA(ns, ne));
      } else if (c === '?') {
        if (stack.length < 1) throw new Error("Operator '?' lacks operand");
        nfa1 = stack.pop();
        ns = new NFAState();
        ne = new NFAState();
        ns.addTransition('\u03B5', nfa1.start);
        ns.addTransition('\u03B5', ne);
        nfa1.end.addTransition('\u03B5', ne);
        stack.push(new NFA(ns, ne));
      }
    }
    if (stack.length !== 1) throw new Error('Malformed expression');
    var finalNfa = stack.pop();
    finalNfa.end.isEnd = true;
    return finalNfa;
  }

  function extractGraphData(nfa) {
    var nodes = [];
    var edges = [];
    var visited = {};
    var queue = [nfa.start];
    while (queue.length > 0) {
      var curr = queue.shift();
      if (visited[curr.id]) continue;
      visited[curr.id] = true;
      nodes.push({
        data: {
          id: curr.id,
          label: curr.id,
          isStart: curr.id === nfa.start.id,
          isEnd: curr.isEnd,
        },
      });
      for (var sym in curr.transitions) {
        curr.transitions[sym].forEach(function (nextState) {
          edges.push({
            data: {
              id: curr.id + '-' + nextState.id + '-' + sym + '-' + Math.random(),
              source: curr.id,
              target: nextState.id,
              label: sym === '\u03B5' ? '\u03B5' : sym,
            },
          });
          if (!visited[nextState.id]) queue.push(nextState);
        });
      }
    }
    return { nodes: nodes, edges: edges, startState: nfa.start };
  }

  var nfaCy = null;
  var nfaGraphData = null;
  var nfaRunTimer = null;
  var nfaSimState = {
    testString: '',
    currentIndex: 0,
    activeStates: new Set(),
    deadStates: new Set(),
  };

  function nfaLog(msg, type) {
    type = type || 'info';
    var div = document.createElement('div');
    div.className = 'rg-log-line ' + type;
    div.textContent = '> ' + msg;
    dom.nfaLogs.appendChild(div);
    dom.nfaLogs.scrollTop = dom.nfaLogs.scrollHeight;
  }

  function renderNfaGraph(graphData) {
    dom.nfaEmpty.style.display = 'none';
    if (nfaCy) {
      nfaCy.destroy();
      nfaCy = null;
    }
    if (
      typeof cytoscape !== 'undefined' &&
      typeof dagre !== 'undefined' &&
      typeof cytoscapeDagre !== 'undefined'
    ) {
      cytoscape.use(cytoscapeDagre);
    }
    nfaCy = cytoscape({
      container: dom.nfaCy,
      elements: { nodes: graphData.nodes, edges: graphData.edges },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1e293b',
            'border-width': 2,
            'border-color': '#64748b',
            label: 'data(label)',
            color: '#f8fafc',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '11px',
            width: 36,
            height: 36,
            'transition-property': 'background-color, border-color',
            'transition-duration': '0.2s',
          },
        },
        {
          selector: 'node[?isStart]',
          style: { 'background-color': '#93c5fd', 'border-color': '#bfdbfe' },
        },
        {
          selector: 'node[?isEnd]',
          style: { 'border-style': 'double', 'border-width': 4, 'border-color': '#6ee7b7' },
        },
        {
          selector: '.active-state',
          style: {
            'background-color': '#fda4af',
            'border-color': '#fecdd3',
            'box-shadow': '0 0 12px #fda4af',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            color: '#93c5fd',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '11px',
            'text-background-opacity': 1,
            'text-background-color': '#020617',
            'text-background-padding': 2,
          },
        },
        { selector: 'edge[label="\u03B5"]', style: { 'line-style': 'dashed', color: '#c4b5fd' } },
        {
          selector: '.active-edge',
          style: { 'line-color': '#fda4af', 'target-arrow-color': '#fda4af', width: 3 },
        },
      ],
      layout: { name: 'dagre', rankDir: 'LR', nodeSep: 40, edgeSep: 8, rankSep: 70 },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });
  }

  function getEpsilonClosure(states) {
    var closure = new Set(states);
    var stack = Array.from(states);
    while (stack.length > 0) {
      var curr = stack.pop();
      var epsTrans = curr.transitions['\u03B5'];
      if (epsTrans) {
        epsTrans.forEach(function (ns) {
          if (!closure.has(ns)) {
            closure.add(ns);
            stack.push(ns);
          }
        });
      }
    }
    return closure;
  }

  function resetNfaSim() {
    if (!nfaGraphData) return;
    nfaSimState.testString = dom.nfaString.value;
    nfaSimState.currentIndex = 0;
    dom.nfaChars.innerHTML = '';
    if (nfaSimState.testString.length === 0) {
      dom.nfaChars.innerHTML = '<span class="rg-nfa-char placeholder">Type a string...</span>';
    } else {
      for (var i = 0; i < nfaSimState.testString.length; i++) {
        var span = document.createElement('span');
        span.className = 'rg-nfa-char';
        span.textContent = nfaSimState.testString[i];
        dom.nfaChars.appendChild(span);
      }
    }
    nfaSimState.activeStates = getEpsilonClosure([nfaGraphData.startState]);
    dom.nfaStep.disabled = nfaSimState.testString.length === 0;
    dom.nfaStep.innerHTML = 'Step <i class="fas fa-step-forward"></i>';
    updateNfaUI();
    setNfaVerdict('processing', '<i class="fas fa-spinner fa-spin"></i> Reset. Ready to step.');
  }

  function updateNfaUI() {
    if (!nfaCy) return;
    nfaCy.nodes().removeClass('active-state dead-state');
    nfaSimState.activeStates.forEach(function (state) {
      nfaCy.getElementById(state.id).addClass('active-state');
    });
    if (nfaSimState.activeStates.size === 0 && nfaSimState.currentIndex > 0) {
      // All paths died — show dead state on all previously active nodes
      nfaCy.nodes().filter(function(n){ return n.data('label') !== undefined; }).forEach(function(n){
        n.addClass('dead-state');
      });
    }
    // Update active state count badge
    if (dom.nfaStateCount) {
      var cnt = nfaSimState.activeStates.size;
      dom.nfaStateCount.textContent = cnt > 0 ? cnt + ' active path' + (cnt > 1 ? 's' : '') : '';
    }
  }

  function setNfaVerdict(type, html) {
    dom.nfaVerdict.className = 'rg-nfa-verdict ' + type;
    dom.nfaVerdict.innerHTML = html;
  }  function handleNfaStep() {
    if (nfaSimState.currentIndex >= nfaSimState.testString.length) return;
    var charToConsume = nfaSimState.testString[nfaSimState.currentIndex];
    var nextStates = new Set();
    var activeEdges = [];
    var epsilonEdges = [];
    var activeStateArray = Array.from(nfaSimState.activeStates);
    activeStateArray.forEach(function (state) {
      if (state.transitions[charToConsume]) {
        state.transitions[charToConsume].forEach(function (nextState) {
          nextStates.add(nextState);
          var edge = nfaGraphData.edges.find(function (e) {
            return (
              e.data.source === state.id &&
              e.data.target === nextState.id &&
              e.data.label === charToConsume
            );
          });
          if (edge) activeEdges.push(edge.data.id);
        });
      }
    });

    // Compute epsilon closure and track ε-edges for visualization
    var rawNext = Array.from(nextStates);
    var closure = getEpsilonClosure(nextStates);
    closure.forEach(function(state) {
      if (!nextStates.has(state)) {
        // This state was reached via ε-transitions
        var epEdge = nfaGraphData.edges.find(function(e) {
          return e.data.target === state.id && e.data.label === 'ε';
        });
        if (epEdge) epsilonEdges.push(epEdge.data.id);
      }
    });
    nfaSimState.activeStates = closure;

    var charEls = dom.nfaChars.children;
    if (charEls[nfaSimState.currentIndex]) {
      charEls[nfaSimState.currentIndex].classList.add('consumed');
    }
    nfaSimState.currentIndex++;
    if (
      nfaSimState.currentIndex < nfaSimState.testString.length &&
      charEls[nfaSimState.currentIndex]
    ) {
      charEls[nfaSimState.currentIndex].classList.add('active');
    }

    // Highlight edges on graph
    if (nfaCy) {
      nfaCy.edges().removeClass('active-edge epsilon-edge');
      activeEdges.forEach(function (id) {
        nfaCy.getElementById(id).addClass('active-edge');
      });
      epsilonEdges.forEach(function (id) {
        nfaCy.getElementById(id).addClass('epsilon-edge');
      });
      setTimeout(function () {
        if (nfaCy) nfaCy.edges().removeClass('active-edge epsilon-edge');
      }, 500);
    }

    // Show epsilon info
    var epCount = closure.size - rawNext.length;
    if (dom.nfaEpsilonInfo) {
      if (epCount > 0) {
        dom.nfaEpsilonInfo.style.display = 'block';
        dom.nfaEpsilonInfo.innerHTML = '<i class="fas fa-arrows-alt-h"></i> ε-closure added ' + epCount + ' state(s) via epsilon transitions';
      } else {
        dom.nfaEpsilonInfo.style.display = 'none';
      }
    }

    updateNfaUI();
    if (nfaSimState.currentIndex >= nfaSimState.testString.length) {
      dom.nfaStep.disabled = true;
      if (dom.nfaRun) dom.nfaRun.disabled = true;
      dom.nfaStep.innerHTML = '<i class="fas fa-flag-checkered"></i> Finished';
      checkNfaVerdict();
    } else {
      if (nfaSimState.activeStates.size === 0) {
        dom.nfaStep.disabled = true;
        if (dom.nfaRun) dom.nfaRun.disabled = true;
        checkNfaVerdict();
      } else {
        setNfaVerdict(
          'processing',
          '<i class="fas fa-cog fa-spin"></i> Consumed \'' +
            charToConsume +
            "'. Active paths: " +
            nfaSimState.activeStates.size
        );
      }
    }
  } }

  function checkNfaVerdict() {
    var accepted = false;
    nfaSimState.activeStates.forEach(function (state) {
      if (state.isEnd) accepted = true;
    });
    if (accepted && nfaSimState.currentIndex === nfaSimState.testString.length) {
      setNfaVerdict('success', '<i class="fas fa-check-circle"></i> ACCEPTED!');
    } else {
      setNfaVerdict('error', '<i class="fas fa-times-circle"></i> REJECTED.');
    }
  }

  function handleNfaCompile() {
    var raw = dom.nfaPattern.value.trim();
    if (!raw) {
      nfaLog('Enter a regex pattern.', 'error');
      return;
    }
    dom.nfaLogs.innerHTML = '';
    nfaLog('Compiling: ' + raw);
    try {
      var formatted = insertExplicitConcat(raw);
      nfaLog('Concat inserted: ' + formatted);
      var postfix = toPostfix(formatted);
      nfaLog('Postfix: ' + postfix);
      var nfa = compileNFA(postfix);
      nfaLog('NFA compiled successfully.', 'success');
      nfaGraphData = extractGraphData(nfa);
      nfaLog(
        'Graph: ' +
          nfaGraphData.nodes.length +
          ' states, ' +
          nfaGraphData.edges.length +
          ' transitions.',
        'success'
      );
      renderNfaGraph(nfaGraphData);
      dom.nfaString.disabled = false;
      dom.nfaReset.disabled = false;
      dom.nfaStep.disabled = false;
      if (dom.nfaRun) dom.nfaRun.disabled = false;
      resetNfaSim();
    } catch (e) {
      nfaLog(e.message, 'error');
    }
  }

  function init() {
    cacheDoms();

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var tabId = this.id.replace('rg-tab-', '');
        switchTab(tabId);
      });
    });

    dom.matchBtn.addEventListener('click', runMatch);
    dom.clearBtn.addEventListener('click', function () {
      dom.patternInput.value = '';
      dom.flagsInput.value = 'gm';
      dom.testInput.value = '';
      dom.highlightOverlay.innerHTML = '';
      runMatch();
    });

    dom.patternInput.addEventListener('input', debounce(runMatch, 300));
    dom.flagsInput.addEventListener('input', debounce(runMatch, 300));
    dom.testInput.addEventListener('input', function () {
      runMatch();
    });

    dom.patternInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') runMatch();
    });

    dom.saveBtn.addEventListener('click', handleSave);
    dom.saveConfirm.addEventListener('click', confirmSave);
    dom.shareBtn.addEventListener('click', handleShare);
    dom.savedBtn.addEventListener('click', function () {
      renderSavedList();
      dom.savedModal.hidden = false;
    });
    dom.savedList.addEventListener('click', handleSavedAction);

    document.addEventListener('click', modalsClick);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModals();
    });

    dom.nfaCompile.addEventListener('click', handleNfaCompile);
    dom.nfaStep.addEventListener('click', handleNfaStep);
    dom.nfaReset.addEventListener('click', resetNfaSim);
    dom.nfaString.addEventListener('input', resetNfaSim);

    // Run All — auto-steps through the whole string
    if (dom.nfaRun) {
      dom.nfaRun.addEventListener('click', function () {
        if (nfaRunTimer) {
          clearInterval(nfaRunTimer);
          nfaRunTimer = null;
          dom.nfaRun.innerHTML = '<i class="fas fa-play"></i> Run All';
          return;
        }
        dom.nfaRun.innerHTML = '<i class="fas fa-pause"></i> Pause';
        var speed = dom.nfaSpeed ? parseInt(dom.nfaSpeed.value) : 700;
        nfaRunTimer = setInterval(function () {
          if (
            nfaSimState.currentIndex >= nfaSimState.testString.length ||
            nfaSimState.activeStates.size === 0
          ) {
            clearInterval(nfaRunTimer);
            nfaRunTimer = null;
            if (dom.nfaRun) dom.nfaRun.innerHTML = '<i class="fas fa-play"></i> Run All';
            return;
          }
          handleNfaStep();
        }, speed);
      });
    }

    // Speed slider
    if (dom.nfaSpeed) {
      dom.nfaSpeed.addEventListener('input', function () {
        var v = dom.nfaSpeed.value;
        if (dom.nfaSpeedVal) dom.nfaSpeedVal.textContent = v + 'ms';
        if (nfaRunTimer) {
          clearInterval(nfaRunTimer);
          nfaRunTimer = setInterval(function () {
            if (
              nfaSimState.currentIndex >= nfaSimState.testString.length ||
              nfaSimState.activeStates.size === 0
            ) {
              clearInterval(nfaRunTimer);
              nfaRunTimer = null;
              if (dom.nfaRun) dom.nfaRun.innerHTML = '<i class="fas fa-play"></i> Run All';
              return;
            }
            handleNfaStep();
          }, parseInt(v));
        }
      });
    }

    dom.nfaPattern.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleNfaCompile();
    });

    dom.exGrid.addEventListener('click', handleExerciseClick);

    document.querySelector('.rg-ex-filter-group').addEventListener('click', function (e) {
      var filter = e.target.closest('.rg-ex-filter');
      if (!filter) return;
      qsa('.rg-ex-filter').forEach(function (f) {
        f.classList.remove('active');
        f.setAttribute('aria-selected', 'false');
      });
      filter.classList.add('active');
      filter.setAttribute('aria-selected', 'true');
      renderExercises(filter.dataset.level);
    });

    dom.patGrid.addEventListener('click', handlePatternClick);

    document.querySelector('.rg-pat-filter-group').addEventListener('click', function (e) {
      var filter = e.target.closest('.rg-pat-filter');
      if (!filter) return;
      qsa('.rg-pat-filter').forEach(function (f) {
        f.classList.remove('active');
        f.setAttribute('aria-selected', 'false');
      });
      filter.classList.add('active');
      filter.setAttribute('aria-selected', 'true');
      renderPatterns(filter.dataset.cat);
    });

    dom.testInput.addEventListener('scroll', function () {
      dom.highlightOverlay.style.transform = 'translateY(' + -this.scrollTop + 'px)';
    });

    loadSavedPatterns();
    loadExerciseProgress();
    loadFromURL();
    renderExercises('all');
    renderPatterns('all');

    if (!dom.patternInput.value && !dom.testInput.value) {
      dom.patternInput.value = '\\d{3}-\\d{2}-\\d{4}';
      dom.testInput.value = 'SSN: 123-45-6789 and 987-65-4321';
      runMatch();
    }

    dom.nfaPattern.value = '(a|b)*abb';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
