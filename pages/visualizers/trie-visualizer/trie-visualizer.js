document.addEventListener('DOMContentLoaded', function () {
  initTrieVisualizer();
});
function initTyping() {
  let el = document.getElementById('typingTextVisualizer');
  if (!el) return;
  let words = [
    'Insert words into Trie',
    'Search words step-by-step',
    'Visualize node creation',
    'Learn prefix trees interactively',
  ];
  let index = 0;
  let charIndex = 0;
  let deleting = false;
  let reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    el.textContent = words[0];
    return;
  }
  function tick() {
    let current = words[index];
    if (deleting) {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
    } else {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
    }
    let delay = deleting ? 45 : 85;
    if (!deleting && charIndex === current.length) {
      deleting = true;
      delay = 1400;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      index = (index + 1) % words.length;
      delay = 250;
    }
    setTimeout(tick, delay);
  }
  tick();
}
function TrieNode(char, id) {
  this.children = {};
  this.isEnd = false;
  this.char = char;
  this.id = id;
  this.x = 0;
  this.y = 0;
}
function Trie() {
  this.root = new TrieNode('', 'root');
  this._id = 0;
  this.steps = [];
}
Trie.prototype.nextId = function () {
  this._id += 1;
  return 'node-' + this._id;
};
Trie.prototype.cloneNode = function (node) {
  if (!node) return null;
  let clone = {
    children: {},
    isEnd: node.isEnd,
    char: node.char,
    id: node.id,
    x: node.x,
    y: node.y,
    isCompressed: node.isCompressed,
  };
  for (let key in node.children) {
    if (Object.prototype.hasOwnProperty.call(node.children, key))
      clone.children[key] = this.cloneNode(node.children[key]);
  }
  return clone;
};
Trie.prototype.cloneTrie = function () {
  let nextTrie = new Trie();
  nextTrie.root = this.cloneNode(this.root);
  nextTrie._id = this._id;
  return nextTrie;
};
Trie.prototype.recordStep = function (message, explanation, type, activePath) {
  this.steps.push({
    trie: this.cloneTrie(),
    message: message,
    explanation: explanation,
    type: type || 'info',
    activePath: (activePath || []).slice(),
  });
};
Trie.prototype.insert = function (word) {
  this.steps = [];
  word = (word || '').trim().toLowerCase();
  if (!word) {
    this.recordStep('Please enter a word.', 'Word input cannot be empty.', 'failed', []);
    return;
  }
  let current = this.root;
  let path = [this.root.id];
  this.recordStep(
    'Starting insertion for "' + word + '"',
    'Root reached. Begin walking character by character.',
    'info',
    path
  );
  for (let i = 0; i < word.length; i++) {
    let ch = word[i];
    let existing = current.children[ch];
    if (!existing) {
      let newNode = new TrieNode(ch, this.nextId());
      current.children[ch] = newNode;
      path.push(newNode.id);
      this.recordStep(
        "Created node '" + ch + "'",
        "Node '" + ch + "' did not exist, so we created it.",
        'created',
        path
      );
      current = newNode;
    } else {
      path.push(existing.id);
      this.recordStep(
        "Node already exists for '" + ch + "'",
        "Traversing to child '" + ch + "'.",
        'info',
        path
      );
      current = existing;
    }
  }
  current.isEnd = true;
  this.recordStep(
    'Mark terminal node',
    'Reached the last character and marked the node as the end of the word.',
    'terminal',
    path
  );
  this.recordStep(
    'Word inserted successfully',
    'Insertion completed without adding extra operations.',
    'info',
    path
  );
};
Trie.prototype.search = function (word) {
  this.steps = [];
  word = (word || '').trim().toLowerCase();
  if (!word) {
    this.recordStep('Please enter a word.', 'Word input cannot be empty.', 'failed', []);
    return false;
  }
  let current = this.root;
  let path = [this.root.id];
  this.recordStep('Starting search for "' + word + '"', 'Begin traversal from root.', 'info', path);

  let i = 0;
  while (i < word.length) {
    let foundChild = false;
    for (let key in current.children) {
      let child = current.children[key];
      // Check if the remaining word starts with this node's char (handles compressed nodes)
      if (word.startsWith(child.char, i)) {
        current = child;
        path.push(current.id);
        this.recordStep(
          "Traversing to child '" + child.char + "'",
          'Matched substring, moving down the path.',
          'current',
          path
        );
        i += child.char.length;
        foundChild = true;
        break;
      }
    }

    if (!foundChild) {
      this.recordStep(
        'Search failed at index ' + i,
        'No matching branch exists for the remaining string.',
        'failed',
        path
      );
      return false;
    }
  }
  if (current.isEnd) {
    this.recordStep('Reached terminal node', 'Word Found', 'terminal', path);
    return true;
  }
  this.recordStep(
    'Reached non-terminal node',
    'Search failed because the path exists but no word ends here.',
    'failed',
    path
  );
  return false;
};
Trie.prototype.delete = function (word) {
  this.steps = [];
  word = (word || '').trim().toLowerCase();
  if (!word) {
    this.recordStep('Please enter a word.', 'Word input cannot be empty.', 'failed', []);
    return false;
  }

  let path = [this.root.id];
  this.recordStep(
    'Starting deletion for "' + word + '"',
    'Begin traversal from root to locate word for deletion.',
    'info',
    path
  );

  let current = this.root;
  let nodesOnPath = [this.root];

  for (let i = 0; i < word.length; i++) {
    let ch = word[i];
    if (!current.children[ch]) {
      this.recordStep(
        "Deletion failed: '" + ch + "' not found",
        "Word '" + word + "' does not exist in the Trie.",
        'failed',
        path
      );
      return false;
    }
    current = current.children[ch];
    nodesOnPath.push(current);
    path.push(current.id);
    this.recordStep(
      "Traversing character '" + ch + "'",
      "Found node for '" + ch + "'.",
      'current',
      path
    );
  }

  if (!current.isEnd) {
    this.recordStep(
      'Deletion failed: non-terminal node',
      "Path for '" + word + "' exists, but it is not marked as a complete word.",
      'failed',
      path
    );
    return false;
  }

  current.isEnd = false;
  this.recordStep(
    'Unmarked terminal node',
    "Removed terminal flag from node '" + current.char + "'.",
    'terminal',
    path
  );

  function hasChildren(node) {
    return Object.keys(node.children).length > 0;
  }

  let prunedPath = path.slice();
  for (let i = nodesOnPath.length - 1; i > 0; i--) {
    let node = nodesOnPath[i];
    let parentNode = nodesOnPath[i - 1];

    if (!node.isEnd && !hasChildren(node)) {
      delete parentNode.children[node.char];
      prunedPath.pop();
      this.recordStep(
        "Pruned unreferenced branch node '" + node.char + "'",
        "Node '" +
          node.char +
          "' has no children and is not a word end. Garbage collecting node from DOM/SVG tree.",
        'failed',
        prunedPath
      );
    } else {
      this.recordStep(
        "Retaining branch node '" + node.char + "'",
        "Node '" + node.char + "' is either part of another word or has child branches.",
        'info',
        prunedPath
      );
      break;
    }
  }

  this.recordStep(
    'Word deleted successfully',
    "Deletion of '" + word + "' and recursive branch pruning completed.",
    'info',
    prunedPath
  );
  return true;
};

Trie.prototype.compressToRadix = function () {
  this.steps = [];
  let path = ['root'];
  this.recordStep(
    'Starting Radix Compression',
    'Scanning for linear, unbranching chains...',
    'info',
    path
  );

  let compressCount = 0;

  const dfsCompress = (node, currentPath) => {
    let keys = Object.keys(node.children);

    // If exact 1 child and not end-of-word (unless it's root, root can't be compressed into)
    if (keys.length === 1 && !node.isEnd && node.id !== 'root') {
      let childKey = keys[0];
      let child = node.children[childKey];

      this.recordStep(
        `Compressing chain: ${node.char} + ${child.char}`,
        'Vacuuming unbranching chain into a single edge.',
        'terminal',
        [...currentPath, child.id]
      );

      node.char += child.char;
      node.isEnd = child.isEnd;
      node.children = child.children;
      node.isCompressed = true;

      compressCount++;

      // Re-evaluate this node again (recursive vacuum)
      dfsCompress(node, currentPath);
    } else {
      for (let k in node.children) {
        dfsCompress(node.children[k], [...currentPath, node.children[k].id]);
      }
    }
  };

  dfsCompress(this.root, path);

  if (compressCount > 0) {
    this.recordStep(
      'Compression Complete',
      `Successfully collapsed ${compressCount} nodes. See Telemetry for bytes saved!`,
      'info',
      []
    );
  } else {
    this.recordStep(
      'No Compression Needed',
      'The Trie is already optimal or has no linear chains.',
      'failed',
      []
    );
  }
};

Trie.prototype.layout = function () {
  let levels = [];
  let queue = [{ node: this.root, depth: 0 }];
  while (queue.length) {
    let item = queue.shift();
    if (!levels[item.depth]) levels[item.depth] = [];
    levels[item.depth].push(item.node);
    let keys = Object.keys(item.node.children).sort();
    for (let i = 0; i < keys.length; i++)
      queue.push({ node: item.node.children[keys[i]], depth: item.depth + 1 });
  }
  let width = Math.max(900, (document.getElementById('trieTreeArea') || {}).clientWidth || 900);
  let levelGap = 110;
  let topPadding = 70;
  for (let d = 0; d < levels.length; d++) {
    let nodes = levels[d];
    let spacing = width / (nodes.length + 1);
    for (let j = 0; j < nodes.length; j++) {
      nodes[j].x = spacing * (j + 1);
      nodes[j].y = topPadding + d * levelGap;
    }
  }
};
Trie.prototype.render = function (snapshot) {
  let area = document.getElementById('trieTreeArea');
  let svg = document.getElementById('trieLinesSvg');
  if (!area || !svg || !snapshot || !snapshot.root) return;
  snapshot.activePath = snapshot.activePath || [];
  area.innerHTML = '';
  svg.innerHTML = '';
  snapshot.layout();
  function collectLevels(node, depth, levels) {
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(node);
    let keys = Object.keys(node.children).sort();
    for (let i = 0; i < keys.length; i++) collectLevels(node.children[keys[i]], depth + 1, levels);
  }
  let levels = [];
  collectLevels(snapshot.root, 0, levels);
  function line(x1, y1, x2, y2, cls) {
    let l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x1);
    l.setAttribute('y1', y1);
    l.setAttribute('x2', x2);
    l.setAttribute('y2', y2);
    l.setAttribute('class', cls);
    svg.appendChild(l);
  }
  function drawNode(node, depth) {
    let keys = Object.keys(node.children).sort();
    if (depth < levels.length - 1) {
      for (let i = 0; i < keys.length; i++) {
        let child = node.children[keys[i]];
        let edgeCls = 'trie-edge';
        if (
          snapshot.activePath.indexOf(node.id) > -1 &&
          snapshot.activePath.indexOf(child.id) > -1
        ) {
          edgeCls += ' current';
        }
        if (child.isCompressed) {
          edgeCls += ' compressed';
        }
        line(node.x, node.y + 30, child.x, child.y - 30, edgeCls);
        drawNode(child, depth + 1);
      }
    }
  }
  drawNode(snapshot.root, 0);
  function renderNode(node) {
    let el = document.createElement('div');
    let cls = 'trie-node';
    if (node.id === 'root') cls += ' root';
    if (node.isCompressed) cls += ' compressed';
    if (node.isEnd) cls += ' terminal';
    if (snapshot.activePath.indexOf(node.id) > -1) {
      if (snapshot.type === 'created') cls += ' created';
      else if (snapshot.type === 'failed') cls += ' failed';
      else if (snapshot.type === 'terminal') cls += ' terminal';
      else cls += ' current';
    }
    el.className = cls;
    el.id = node.id;
    el.style.left = node.x + 'px';
    el.style.top = node.y + 'px';
    let charEl = document.createElement('span');
    charEl.className = 'node-char';
    charEl.textContent = node.char || 'root';
    el.appendChild(charEl);
    if (node.isEnd && node.id !== 'root') {
      let endMarker = document.createElement('span');
      endMarker.className = 'end-marker';
      endMarker.setAttribute('aria-hidden', 'true');
      el.appendChild(endMarker);
    }
    area.appendChild(el);
    let ks = Object.keys(node.children).sort();
    for (let i = 0; i < ks.length; i++) renderNode(node.children[ks[i]]);
  }
  renderNode(snapshot.root);
  svg.setAttribute('width', area.scrollWidth);
  svg.setAttribute('height', area.scrollHeight);
  svg.setAttribute('viewBox', '0 0 ' + area.scrollWidth + ' ' + area.scrollHeight);
};
function initTrieVisualizer() {
  initTyping();
  let trie = new Trie();
  let currentStep = 0;
  let playing = false;
  let timer = null;
  let input = document.getElementById('wordInput');
  let statusBox = document.getElementById('statusBox');
  let explanationBox = document.getElementById('explanationBox');
  let counter = document.getElementById('stepCounter');
  let playPauseBtn = document.getElementById('playPauseBtn');
  if (statusBox) {
    statusBox.setAttribute('role', 'status');
    statusBox.setAttribute('aria-live', 'polite');
    statusBox.setAttribute('aria-atomic', 'true');
  }
  if (explanationBox) explanationBox.setAttribute('aria-live', 'polite');
  if (counter) counter.setAttribute('aria-live', 'polite');
  function renderStep() {
    if (!trie.steps.length) return;
    let step = trie.steps[currentStep];
    step.trie.activePath = step.activePath || [];
    step.trie.type = step.type;
    trie.render(step.trie);
    statusBox.textContent = step.message;
    explanationBox.textContent = step.explanation;
    counter.textContent = 'Step ' + (currentStep + 1) + ' / ' + trie.steps.length;
    playPauseBtn.innerHTML = playing
      ? '<i class="fas fa-pause"></i> Pause'
      : '<i class="fas fa-play"></i> Play';
  }
  function loadSteps() {
    currentStep = 0;
    renderStep();
  }
  function stopPlayback() {
    playing = false;
    clearInterval(timer);
    timer = null;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Play';
  }
  function play() {
    if (!trie.steps.length || playing) return;
    playing = true;
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    timer = setInterval(function () {
      if (currentStep >= trie.steps.length - 1) {
        stopPlayback();
        return;
      }
      currentStep += 1;
      renderStep();
    }, 850);
  }
  function pause() {
    stopPlayback();
  }
  function runInsert() {
    stopPlayback();
    trie.insert(input.value);
    loadSteps();
  }
  function runSearch() {
    stopPlayback();
    trie.search(input.value);
    loadSteps();
  }
  function runDelete() {
    stopPlayback();
    trie.delete(input.value);
    loadSteps();
  }
  function resetTrie() {
    stopPlayback();
    trie = new Trie();
    trie.recordStep('Trie reset', 'Empty Trie ready for a new operation.', 'info', ['root']);
    loadSteps();
  }
  function updateTelemetry(trieRoot) {
    let nodeCount = 0;
    let charCount = 0;
    function traverse(node) {
      if (!node) return;
      if (node.id !== 'root') {
        nodeCount++;
        charCount += (node.char || '').length;
      }
      for (let key in node.children) traverse(node.children[key]);
    }
    traverse(trieRoot);
    const rawBytes = charCount * 24;
    const currentBytes = nodeCount * 24;
    const savedBytes = rawBytes - currentBytes;
    const savedPercentage = rawBytes > 0 ? Math.round((savedBytes / rawBytes) * 100) : 0;

    document.getElementById('telNodes').textContent = nodeCount;
    document.getElementById('telRaw').textContent = rawBytes;
    document.getElementById('telSaved').textContent = `${savedPercentage}%`;
  }

  function attachAutoComplete(trieRef) {
    const dropdown = document.getElementById('autocompleteDropdown');
    input.addEventListener('input', (e) => {
      const prefix = e.target.value.trim().toLowerCase();
      dropdown.innerHTML = '';
      if (!prefix) {
        dropdown.classList.add('hidden');
        return;
      }
      let results = [];
      function dfsFromRoot(node, currentStr) {
        if (results.length >= 5) return;
        if (node.isEnd && node.id !== 'root' && currentStr.startsWith(prefix)) {
          results.push(currentStr);
        }
        // If the current string doesn't start with prefix AND prefix doesn't start with current string, prune branch
        if (
          currentStr.length > 0 &&
          !currentStr.startsWith(prefix) &&
          !prefix.startsWith(currentStr)
        ) {
          return;
        }
        for (let key in node.children) {
          dfsFromRoot(node.children[key], currentStr + node.children[key].char);
        }
      }
      dfsFromRoot(trieRef.root, '');

      if (results.length > 0) {
        dropdown.classList.remove('hidden');
        results.forEach((res) => {
          let div = document.createElement('div');
          div.className = 'ac-item';
          div.textContent = res;
          div.onclick = () => {
            input.value = res;
            dropdown.classList.add('hidden');
          };
          dropdown.appendChild(div);
        });
      } else {
        dropdown.classList.add('hidden');
      }
    });
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  document.getElementById('insertBtn').addEventListener('click', runInsert);
  document.getElementById('searchBtn').addEventListener('click', runSearch);
  let deleteBtn = document.getElementById('deleteBtn');
  if (deleteBtn) deleteBtn.addEventListener('click', runDelete);

  let compressBtn = document.getElementById('compressBtn');
  if (compressBtn) {
    compressBtn.addEventListener('click', () => {
      stopPlayback();
      trie.compressToRadix();
      loadSteps();
    });
  }

  document.getElementById('resetBtn').addEventListener('click', resetTrie);
  document.getElementById('previousBtn').addEventListener('click', function () {
    stopPlayback();
    if (currentStep > 0) {
      currentStep -= 1;
      renderStep();
    }
  });
  document.getElementById('nextBtn').addEventListener('click', function () {
    stopPlayback();
    if (currentStep < trie.steps.length - 1) {
      currentStep += 1;
      renderStep();
    }
  });
  playPauseBtn.addEventListener('click', function () {
    if (playing) pause();
    else play();
  });
  if (input)
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') runInsert();
    });
  window.addEventListener('resize', function () {
    if (trie.steps.length) renderStep();
  });
  resetTrie();
  attachAutoComplete(trie);

  // Patch renderStep to update telemetry
  const originalRenderStep = renderStep;
  renderStep = function () {
    originalRenderStep();
    if (trie.steps.length && trie.steps[currentStep]) {
      updateTelemetry(trie.steps[currentStep].trie.root);
    } else {
      updateTelemetry(trie.root);
    }
  };

  updateTelemetry(trie.root); // Initial call
}
