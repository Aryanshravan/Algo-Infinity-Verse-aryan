(function () {
  'use strict';

  var STORAGE_KEY = 'ebpf-zero-trust-security-progress';

  var MODULES = [
    {
      id: 'kernel-probes',
      title: 'eBPF Kernel Probes',
      short: 'kprobe / uprobe / tracepoint',
      html:
        '<p>eBPF (extended Berkeley Packet Filter) lets you attach small verified programs to kernel hooks without loading a kernel module. For security observability, the most common attachment points are <code>kprobe</code>/<code>kretprobe</code>, <code>uprobe</code>/<code>uretprobe</code>, and stable <code>tracepoint</code>s.</p>' +
        '<p>Probes run in a restricted virtual machine: the verifier checks memory access, loops, and helper usage before the program is accepted. That safety model is why eBPF became the foundation of modern runtime security agents.</p>' +
        '<ul>' +
        '<li><strong>kprobe</strong> — fire on almost any kernel function entry (flexible, ABI-sensitive).</li>' +
        '<li><strong>tracepoint</strong> — stable ABI events such as <code>sys_enter_*</code> and scheduler hooks.</li>' +
        '<li><strong>uprobe</strong> — instrument user-space binaries (libc, runtimes, apps).</li>' +
        '<li><strong>CO-RE / BTF</strong> — write portable programs that adapt across kernel versions.</li>' +
        '</ul>' +
        '<p>In a zero-trust runtime, probes are sensors: they emit facts about process creation, file access, and network connects that policy engines evaluate continuously.</p>'
    },
    {
      id: 'xdp-filtering',
      title: 'XDP Packet Filtering',
      short: 'eXpress Data Path',
      html:
        '<p>XDP (eXpress Data Path) runs eBPF at the earliest point in the NIC receive path—often before SKBs are allocated. That makes it ideal for dropping volumetric noise, rate-limiting scanners, and steering traffic with minimal CPU cost.</p>' +
        '<p>An XDP program returns an action such as <code>XDP_PASS</code>, <code>XDP_DROP</code>, <code>XDP_TX</code>, or <code>XDP_REDIRECT</code>. Security teams commonly use XDP for synflood mitigation, known-bad CIDR blocks, and early TLS fingerprint filters when combined with higher-layer systems.</p>' +
        '<ul>' +
        '<li>Prefer XDP for high-pps decisions that do not need full socket context.</li>' +
        '<li>Keep maps small and predictable; hot-path lookups must stay O(1).</li>' +
        '<li>Coordinate with TC/cgroup programs for per-pod or per-process policy.</li>' +
        '<li>Log via ring buffers carefully—excessive events can reintroduce DoS risk.</li>' +
        '</ul>' +
        '<p>XDP alone is not zero-trust identity, but it is a powerful outer ring that shrinks the attack surface before packets reach your services.</p>'
    },
    {
      id: 'falco-tracing',
      title: 'Falco Syscall Tracing',
      short: 'Rules over kernel events',
      html:
        '<p>Falco turns syscall streams (historically via a kernel module or eBPF driver) into security alerts using YAML rules. Each rule has a condition expression over event fields such as <code>evt.type</code>, <code>proc.name</code>, <code>fd.name</code>, and container metadata.</p>' +
        '<p>Good Falco rules encode <em>behaviors</em>, not just binaries: “shell in a container”, “write under <code>/etc</code>”, or “ptrace on another process”. Noise control comes from exceptions, priority tiers, and tagging for SIEM routing.</p>' +
        '<ul>' +
        '<li>Start from curated rulesets, then tune for your workloads.</li>' +
        '<li>Use macros and lists to keep conditions readable and DRY.</li>' +
        '<li>Map priorities (<code>NOTICE</code> → <code>CRITICAL</code>) to response playbooks.</li>' +
        '<li>Validate rules against known-good and known-bad traces before production.</li>' +
        '</ul>' +
        '<p>Use the interactive rule tester below to practice matching conditions against sample events.</p>'
    },
    {
      id: 'ring-buffers',
      title: 'Ring Buffers',
      short: 'Kernel → user transport',
      html:
        '<p>eBPF programs cannot freely allocate or call into user space. Instead they push events into maps—most commonly the <code>BPF_MAP_TYPE_RINGBUF</code>—which a user-space consumer reads asynchronously.</p>' +
        '<p>Ring buffers are preferred over classic perf buffers for many security agents because reservation/commit semantics reduce lost events under load and simplify multi-CPU collection.</p>' +
        '<ul>' +
        '<li>Reserve → fill → submit (or discard) for atomic event publication.</li>' +
        '<li>Size the ring for bursty syscall rates; monitor drop counters.</li>' +
        '<li>Keep payloads compact: IDs, hashes, and truncated paths beat huge strings.</li>' +
        '<li>Apply sampling or aggregation in-kernel when volume explodes.</li>' +
        '</ul>' +
        '<p>The trace simulator on this page mimics a consumer printing decoded syscall records as they arrive.</p>'
    },
    {
      id: 'zt-runtime',
      title: 'Zero-Trust Runtime Policy',
      short: 'Never trust, always verify',
      html:
        '<p>Zero-trust at runtime means every process action is authorized against identity, context, and intent—not just network perimeter rules. eBPF supplies the telemetry and, with LSM/cgroup hooks, the enforcement points.</p>' +
        '<p>A practical policy stack combines: workload identity (SPIFFE/K8s SA), allow-listed syscalls and file paths, network egress controls, and continuous detection for deviations.</p>' +
        '<ul>' +
        '<li>Default-deny where feasible; prefer allow-lists over endless deny rules.</li>' +
        '<li>Bind policy to workload identity, not ephemeral IPs.</li>' +
        '<li>Separate detect-mode from enforce-mode during rollout.</li>' +
        '<li>Feed detections into automated response (kill, isolate, rotate secrets).</li>' +
        '</ul>' +
        '<p>eBPF does not replace IAM—it proves and constrains what authenticated workloads actually do on the host.</p>'
    },
    {
      id: 'container-escape',
      title: 'Container Escape Signals',
      short: 'Detect breakout attempts',
      html:
        '<p>Container escapes often leave distinctive syscall footprints: mounting host paths, writing to <code>/proc</code> or cgroup controllers, loading kernel modules, or using <code>ptrace</code>/<code>process_vm_writev</code> across namespaces.</p>' +
        '<p>Detection rules should correlate namespace IDs, capabilities, and mount events. A single <code>openat</code> is rarely enough; sequences matter.</p>' +
        '<ul>' +
        '<li>Watch for <code>unshare</code>, <code>setns</code>, and privileged mount operations.</li>' +
        '<li>Alert on writes to sensitive host paths from containerized PIDs.</li>' +
        '<li>Flag unexpected CAP_SYS_ADMIN / CAP_SYS_PTRACE usage.</li>' +
        '<li>Cross-check with image SBOM and admission-time policy (OPA/Kyverno).</li>' +
        '</ul>' +
        '<p>Combine Falco-style rules with runtime blocking (seccomp/LSM) so detection and prevention reinforce each other.</p>'
    },
    {
      id: 'seccomp-lsm',
      title: 'Seccomp + LSM basics',
      short: 'Syscall & hook enforcement',
      html:
        '<p><strong>seccomp-bpf</strong> filters which syscalls a process may invoke. Profiles (Docker default, Kubernetes <code>RuntimeDefault</code>, or custom) shrink the kernel attack surface dramatically for containers.</p>' +
        '<p>Linux Security Modules (AppArmor, SELinux, Landlock, BPF LSM) attach richer policy to file, network, and mount operations. BPF LSM lets you write eBPF programs that enforce custom zero-trust checks at LSM hooks.</p>' +
        '<ul>' +
        '<li>Start with RuntimeDefault seccomp; tighten per-workload as needed.</li>' +
        '<li>Prefer deny-by-default LSM profiles over permissive modes in prod.</li>' +
        '<li>Use BPF LSM for dynamic policy that classic profiles cannot express.</li>' +
        '<li>Test profiles in complain/audit mode before enforcing.</li>' +
        '</ul>' +
        '<p>Telemetry without enforcement is detection; seccomp/LSM turn policy into hard limits.</p>'
    },
    {
      id: 'threat-hunting',
      title: 'Threat Hunting with eBPF',
      short: 'Hypothesis-driven detection',
      html:
        '<p>Threat hunting uses eBPF telemetry to test hypotheses: “Is any pod spawning an interactive shell?”, “Who opened <code>/etc/shadow</code>?”, “Which processes called <code>connect</code> to rare ASNs?”</p>' +
        '<p>Effective hunts define a question, collect high-fidelity events, baseline normal behavior, then craft durable detections from confirmed anomalies.</p>' +
        '<ul>' +
        '<li>Pivot from one strong signal (e.g. <code>ptrace</code>) to process tree context.</li>' +
        '<li>Keep raw traces short-lived; store enriched alerts and summaries longer.</li>' +
        '<li>Automate repetitive hunts into Falco/Sigma-style rules.</li>' +
        '<li>Measure false-positive rate—hunters lose trust in noisy sensors.</li>' +
        '</ul>' +
        '<p>Complete the modules, practice with the rule tester, then validate knowledge in the quiz.</p>'
    }
  ];

  var SAMPLE_EVENTS = [
    {
      id: 'ev-bash',
      label: 'execve bash',
      data: {
        'evt.type': 'execve',
        'proc.name': 'bash',
        'proc.cmdline': 'bash -i',
        'user.name': 'www-data',
        'container.id': 'abc123'
      }
    },
    {
      id: 'ev-open-etc',
      label: 'openat /etc/shadow',
      data: {
        'evt.type': 'openat',
        'proc.name': 'cat',
        'fd.name': '/etc/shadow',
        'evt.arg.flags': 'O_RDONLY',
        'user.name': 'root'
      }
    },
    {
      id: 'ev-connect',
      label: 'connect to 203.0.113.9:4444',
      data: {
        'evt.type': 'connect',
        'proc.name': 'curl',
        'fd.name': '203.0.113.9:4444',
        'proc.cmdline': 'curl http://203.0.113.9:4444',
        'user.name': 'app'
      }
    },
    {
      id: 'ev-ptrace',
      label: 'ptrace attach',
      data: {
        'evt.type': 'ptrace',
        'proc.name': 'gdb',
        'evt.arg.request': 'PTRACE_ATTACH',
        'proc.pid': 4421,
        'user.name': 'dev'
      }
    },
    {
      id: 'ev-nginx',
      label: 'execve nginx (benign)',
      data: {
        'evt.type': 'execve',
        'proc.name': 'nginx',
        'proc.cmdline': 'nginx -g daemon off;',
        'user.name': 'root',
        'container.id': 'web01'
      }
    },
    {
      id: 'ev-write-etc',
      label: 'openat write /etc/hosts',
      data: {
        'evt.type': 'openat',
        'proc.name': 'vim',
        'fd.name': '/etc/hosts',
        'evt.arg.flags': 'O_WRONLY|O_CREAT',
        'user.name': 'root'
      }
    }
  ];

  var TRACE_EVENTS = [
    { sys: 'execve', detail: 'pid=1204 proc=bash cmdline="bash -c id" container=api-7f', alert: true },
    { sys: 'openat', detail: 'pid=1204 proc=bash fd=/etc/passwd flags=O_RDONLY', alert: false },
    { sys: 'connect', detail: 'pid=2210 proc=python3 fd=198.51.100.20:443', alert: false },
    { sys: 'ptrace', detail: 'pid=3301 proc=strace request=PTRACE_ATTACH target=889', alert: true },
    { sys: 'execve', detail: 'pid=4412 proc=sh cmdline="/bin/sh" container=worker-2', alert: true },
    { sys: 'openat', detail: 'pid=4412 proc=sh fd=/etc/shadow flags=O_RDONLY', alert: true },
    { sys: 'connect', detail: 'pid=5520 proc=nc fd=203.0.113.50:4444', alert: true },
    { sys: 'execve', detail: 'pid=1001 proc=nginx cmdline="nginx -g daemon off;"', alert: false },
    { sys: 'openat', detail: 'pid=1001 proc=nginx fd=/var/log/nginx/access.log flags=O_APPEND', alert: false },
    { sys: 'clone', detail: 'pid=1001 proc=nginx flags=CLONE_FILES|CLONE_FS', alert: false }
  ];

  var QUIZ = [
    {
      id: 'q1',
      question: 'What does the eBPF verifier primarily guarantee before a program is loaded?',
      options: [
        'That the program will always find vulnerabilities',
        'Memory safety, bounded execution, and allowed helper usage',
        'That XDP will drop all packets',
        'Root privileges for the attaching process'
      ],
      answer: 1
    },
    {
      id: 'q2',
      question: 'Which XDP return code drops a packet at the earliest receive path?',
      options: ['XDP_PASS', 'XDP_TX', 'XDP_DROP', 'XDP_ABORTED'],
      answer: 2
    },
    {
      id: 'q3',
      question: 'In Falco, what is the main purpose of a rule condition?',
      options: [
        'Compile the kernel',
        'Express when an event should raise an alert',
        'Replace seccomp profiles',
        'Encrypt ring buffer payloads'
      ],
      answer: 1
    },
    {
      id: 'q4',
      question: 'Why are BPF ring buffers commonly used by security agents?',
      options: [
        'They permanently store all syscalls on disk',
        'They replace the need for policies',
        'They efficiently stream kernel events to user space with lower loss under load',
        'They disable ptrace globally'
      ],
      answer: 2
    },
    {
      id: 'q5',
      question: 'A strong container-escape signal among the following is:',
      options: [
        'Reading /healthz over HTTP',
        'PTRACE_ATTACH from inside a container onto another process',
        'Rotating application logs',
        'A successful liveness probe'
      ],
      answer: 1
    },
    {
      id: 'q6',
      question: 'seccomp-bpf primarily constrains:',
      options: [
        'Which syscalls a process may invoke',
        'TLS certificate validity',
        'DNS TTL values',
        'GPU scheduling priority'
      ],
      answer: 0
    },
    {
      id: 'q7',
      question: 'Zero-trust runtime policy should bind controls to:',
      options: [
        'Only the public IP of the node',
        'Workload identity and continuous behavioral verification',
        'A single static firewall rule forever',
        'Developer laptop MAC addresses only'
      ],
      answer: 1
    }
  ];

  var SAMPLE_RULE =
    '- rule: Detect Shell Spawn\n' +
    '  desc: Alert when a shell is executed\n' +
    '  condition: evt.type = execve and proc.name in (bash, sh, dash)\n' +
    '  output: "Shell spawned (user=%user.name command=%proc.cmdline)"\n' +
    '  priority: WARNING\n' +
    '  tags: [process, shell]';

  var state = {
    completed: {},
    quizBest: null,
    activeModule: 0,
    traceTimer: null,
    traceIndex: 0,
    tracePaused: false
  };

  function $(id) {
    return document.getElementById(id);
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        state.completed = data.completed && typeof data.completed === 'object' ? data.completed : {};
        if (typeof data.quizBest === 'number') state.quizBest = data.quizBest;
      }
    } catch (e) {
      /* ignore corrupt storage */
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          completed: state.completed,
          quizBest: state.quizBest
        })
      );
    } catch (e) {
      /* quota / private mode */
    }
  }

  function completedCount() {
    var n = 0;
    for (var i = 0; i < MODULES.length; i++) {
      if (state.completed[MODULES[i].id]) n += 1;
    }
    return n;
  }

  function updateHeroStats() {
    var done = completedCount();
    var total = MODULES.length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    var doneEl = $('statModulesDone');
    var pctEl = $('statProgressPct');
    var bestEl = $('statQuizBest');
    var fill = $('heroProgressFill');
    var bar = $('heroProgressBar');

    if (doneEl) doneEl.textContent = String(done);
    if ($('statModulesTotal')) $('statModulesTotal').textContent = String(total);
    if (pctEl) pctEl.textContent = pct + '%';
    if (bestEl) {
      bestEl.textContent =
        state.quizBest === null ? '—' : state.quizBest + '/' + QUIZ.length;
    }
    if (fill) fill.style.width = pct + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
  }

  function renderModuleNav() {
    var list = $('moduleList');
    if (!list) return;
    list.innerHTML = '';

    MODULES.forEach(function (mod, index) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ebpf-module-btn';
      btn.setAttribute('data-index', String(index));
      btn.setAttribute('aria-current', index === state.activeModule ? 'true' : 'false');
      if (index === state.activeModule) btn.classList.add('is-active');
      if (state.completed[mod.id]) btn.classList.add('is-complete');

      var check = document.createElement('span');
      check.className = 'ebpf-module-check';
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = state.completed[mod.id]
        ? '<i class="fas fa-circle-check"></i>'
        : '<i class="far fa-circle"></i>';

      var meta = document.createElement('span');
      meta.className = 'ebpf-module-meta';
      meta.innerHTML =
        '<strong>' +
        escapeHtml(mod.title) +
        '</strong><span>Module ' +
        (index + 1) +
        ' · ' +
        escapeHtml(mod.short) +
        '</span>';

      btn.appendChild(check);
      btn.appendChild(meta);
      btn.addEventListener('click', function () {
        showModule(index);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showModule(index) {
    if (index < 0 || index >= MODULES.length) return;
    state.activeModule = index;
    var mod = MODULES[index];
    var title = $('lessonTitle');
    var body = $('lessonBody');
    var badge = $('lessonBadge');
    var markBtn = $('markCompleteBtn');
    var prevBtn = $('prevModuleBtn');
    var nextBtn = $('nextModuleBtn');

    if (title) title.textContent = mod.title;
    if (body) body.innerHTML = mod.html;
    if (badge) {
      var done = !!state.completed[mod.id];
      badge.hidden = !done;
    }
    if (markBtn) {
      markBtn.disabled = false;
      markBtn.innerHTML = state.completed[mod.id]
        ? '<i class="fas fa-rotate-left" aria-hidden="true"></i> Mark incomplete'
        : '<i class="fas fa-check" aria-hidden="true"></i> Mark complete';
    }
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === MODULES.length - 1;
    renderModuleNav();
  }

  function toggleComplete() {
    var mod = MODULES[state.activeModule];
    if (!mod) return;
    if (state.completed[mod.id]) {
      delete state.completed[mod.id];
    } else {
      state.completed[mod.id] = true;
    }
    saveProgress();
    updateHeroStats();
    showModule(state.activeModule);
  }

  /* ---- Falco rule matcher (simple keyword/condition) ---- */

  function normalizeKey(key) {
    return String(key || '')
      .trim()
      .toLowerCase()
      .replace(/[\[\]]/g, '');
  }

  function eventGet(event, field) {
    var want = normalizeKey(field);
    var keys = Object.keys(event);
    for (var i = 0; i < keys.length; i++) {
      if (normalizeKey(keys[i]) === want) return String(event[keys[i]]);
    }
    return '';
  }

  function extractCondition(ruleText) {
    var match = ruleText.match(/condition\s*:\s*(.+)/i);
    if (!match) return '';
    var line = match[1].trim();
    if (
      (line.charAt(0) === '"' && line.charAt(line.length - 1) === '"') ||
      (line.charAt(0) === "'" && line.charAt(line.length - 1) === "'")
    ) {
      line = line.slice(1, -1);
    }
    return line;
  }

  function tokenizeCondition(cond) {
    return cond
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .replace(/,/g, ' , ')
      .split(/\s+/)
      .filter(Boolean);
  }

  function parseValueToken(tok) {
    if (
      (tok.charAt(0) === '"' && tok.charAt(tok.length - 1) === '"') ||
      (tok.charAt(0) === "'" && tok.charAt(tok.length - 1) === "'")
    ) {
      return tok.slice(1, -1);
    }
    return tok;
  }

  function evalCondition(cond, event) {
    if (!cond) return false;
    var lower = cond.toLowerCase();

    /* Heuristic shortcuts for common lab demos */
    var proc = eventGet(event, 'proc.name').toLowerCase();
    var evtType = eventGet(event, 'evt.type').toLowerCase();
    var fd = eventGet(event, 'fd.name').toLowerCase();
    var flags = eventGet(event, 'evt.arg.flags').toLowerCase();

    if (/bash|shell spawn|proc\.name\s+in\s*\(.*bash/i.test(cond)) {
      if (evtType === 'execve' && (proc === 'bash' || proc === 'sh' || proc === 'dash')) {
        return true;
      }
    }
    if (/\/etc|write.*etc|fd\.name.*\/etc/i.test(cond)) {
      if (evtType === 'openat' && fd.indexOf('/etc') === 0) {
        if (/writ|o_wronly|o_creat|o_append/i.test(cond + ' ' + flags)) {
          return /o_wronly|o_creat|o_append|o_rdwr/i.test(flags) || /write/i.test(cond);
        }
        return true;
      }
    }
    if (/ptrace/i.test(cond)) {
      if (evtType === 'ptrace') return true;
    }
    if (/connect|outbound|4444/i.test(cond) && /connect|fd\.name|net/i.test(lower)) {
      if (evtType === 'connect') {
        if (/4444/.test(cond) && fd.indexOf('4444') === -1) return false;
        return true;
      }
    }

    /* Generic: split on and/or at top level (no nested boolean parser) */
    if (/\band\b/i.test(cond) && !/\bor\b/i.test(cond)) {
      var parts = cond.split(/\band\b/i);
      for (var a = 0; a < parts.length; a++) {
        if (!evalSimpleClause(parts[a].trim(), event)) return false;
      }
      return parts.length > 0;
    }
    if (/\bor\b/i.test(cond) && !/\band\b/i.test(cond)) {
      var ors = cond.split(/\bor\b/i);
      for (var o = 0; o < ors.length; o++) {
        if (evalSimpleClause(ors[o].trim(), event)) return true;
      }
      return false;
    }
    return evalSimpleClause(cond, event);
  }

  function evalSimpleClause(clause, event) {
    if (!clause) return false;
    var c = clause.trim();

    /* field in (a, b, c) */
    var inMatch = c.match(/^([a-z0-9_.]+)\s+in\s*\((.+)\)$/i);
    if (inMatch) {
      var val = eventGet(event, inMatch[1]).toLowerCase();
      var items = inMatch[2].split(',').map(function (s) {
        return parseValueToken(s.trim()).toLowerCase();
      });
      return items.indexOf(val) !== -1;
    }

    /* field contains value */
    var containsMatch = c.match(/^([a-z0-9_.]+)\s+contains\s+(.+)$/i);
    if (containsMatch) {
      var hay = eventGet(event, containsMatch[1]).toLowerCase();
      var needle = parseValueToken(containsMatch[2].trim()).toLowerCase();
      return hay.indexOf(needle) !== -1;
    }

    /* field = value / == / != */
    var eq = c.match(/^([a-z0-9_.]+)\s*(!=|=|==)\s*(.+)$/i);
    if (eq) {
      var left = eventGet(event, eq[1]).toLowerCase();
      var right = parseValueToken(eq[3].trim()).toLowerCase();
      if (eq[2] === '!=') return left !== right;
      return left === right;
    }

    /* keyword fallback: all significant tokens must appear in stringified event */
    var blob = JSON.stringify(event).toLowerCase();
    var tokens = tokenizeCondition(c).filter(function (t) {
      return !/^(and|or|not|in|=|==|!=|\(|\)|,)$/i.test(t);
    });
    if (!tokens.length) return false;
    for (var i = 0; i < tokens.length; i++) {
      var t = parseValueToken(tokens[i]).toLowerCase();
      if (t.indexOf('.') !== -1) continue; /* field names */
      if (blob.indexOf(t) === -1) return false;
    }
    return true;
  }

  function analyzeRuleQuality(ruleText) {
    var tips = [];
    var cond = extractCondition(ruleText);
    if (!cond) {
      tips.push('Add a <code>condition:</code> line — without it the rule cannot fire.');
    }
    if (!/^\s*-\s*rule\s*:/m.test(ruleText) && !/\brule\s*:/i.test(ruleText)) {
      tips.push('Include a <code>rule:</code> name so the rule is identifiable in alerts.');
    }
    if (!/\bdesc\s*:/i.test(ruleText)) {
      tips.push('Add a short <code>desc:</code> explaining why the alert matters.');
    }
    if (!/\bpriority\s*:/i.test(ruleText)) {
      tips.push('Set <code>priority:</code> (e.g. WARNING, CRITICAL) for triage routing.');
    }
    if (!/\btags\s*:/i.test(ruleText)) {
      tips.push('Add <code>tags:</code> to group related detections (process, network, file).');
    }
    if (cond && !/\bevt\.type\b/i.test(cond)) {
      tips.push('Anchor the condition on <code>evt.type</code> to avoid matching unrelated syscalls.');
    }
    if (cond && cond.length < 12) {
      tips.push('Condition looks too short — prefer specific fields over bare keywords.');
    }
    if (cond && /\bproc\.name\s*=\s*bash\b/i.test(cond) && !/\bin\s*\(/i.test(cond)) {
      tips.push('Shells vary — consider <code>proc.name in (bash, sh, dash)</code>.');
    }
    if (cond && /\/etc/i.test(cond) && !/openat|write|fd\.name/i.test(cond)) {
      tips.push('For file paths, pair <code>fd.name</code> with <code>evt.type=openat</code> (and write flags if needed).');
    }
    return tips;
  }

  function collectEventsForTest() {
    var events = [];
    var picks = document.querySelectorAll('#eventPicks input[type="checkbox"]:checked');
    picks.forEach(function (cb) {
      var id = cb.value;
      for (var i = 0; i < SAMPLE_EVENTS.length; i++) {
        if (SAMPLE_EVENTS[i].id === id) {
          events.push({
            source: SAMPLE_EVENTS[i].label,
            data: SAMPLE_EVENTS[i].data
          });
        }
      }
    });

    var paste = ($('eventPaste') && $('eventPaste').value) || '';
    var lines = paste.split(/\n/).map(function (l) {
      return l.trim();
    }).filter(Boolean);
    lines.forEach(function (line, idx) {
      try {
        var obj = JSON.parse(line);
        events.push({ source: 'pasted#' + (idx + 1), data: obj });
      } catch (err) {
        events.push({
          source: 'pasted#' + (idx + 1),
          data: null,
          error: 'Invalid JSON'
        });
      }
    });

    return events;
  }

  function evaluateRule() {
    var ruleText = ($('falcoRule') && $('falcoRule').value) || '';
    var cond = extractCondition(ruleText);
    var events = collectEventsForTest();
    var results = $('falcoResults');
    var tipsEl = $('falcoTips');

    if (!events.length) {
      if (results) {
        results.innerHTML =
          '<p class="ebpf-muted">Select at least one sample event or paste JSON lines.</p>';
      }
      return;
    }

    var html = '';
    if (!cond) {
      html +=
        '<p><strong>No condition found.</strong> The matcher could not read a <code>condition:</code> field.</p>';
    }

    events.forEach(function (item) {
      if (item.error || !item.data) {
        html +=
          '<div class="ebpf-result-item"><span class="ebpf-tag ebpf-tag-fire">Error</span><span>' +
          escapeHtml(item.source) +
          ': ' +
          escapeHtml(item.error || 'Bad event') +
          '</span></div>';
        return;
      }
      var fires = cond ? evalCondition(cond, item.data) : false;
      html +=
        '<div class="ebpf-result-item"><span class="ebpf-tag ' +
        (fires ? 'ebpf-tag-fire' : 'ebpf-tag-pass') +
        '">' +
        (fires ? 'FIRE' : 'Quiet') +
        '</span><span><strong>' +
        escapeHtml(item.source) +
        '</strong> — <code>' +
        escapeHtml(JSON.stringify(item.data)) +
        '</code></span></div>';
    });

    if (results) results.innerHTML = html;

    var tips = analyzeRuleQuality(ruleText);
    if (tipsEl) {
      if (tips.length) {
        tipsEl.hidden = false;
        tipsEl.innerHTML =
          '<h4><i class="fas fa-lightbulb" aria-hidden="true"></i> Auto-remediation tips</h4><ul>' +
          tips
            .map(function (t) {
              return '<li>' + t + '</li>';
            })
            .join('') +
          '</ul>';
      } else {
        tipsEl.hidden = false;
        tipsEl.innerHTML =
          '<h4><i class="fas fa-circle-check" aria-hidden="true"></i> Rule structure looks solid</h4>' +
          '<p style="margin:0">Named rule, description, priority, tags, and an <code>evt.type</code>-anchored condition are present.</p>';
      }
    }
  }

  function renderEventPicks() {
    var wrap = $('eventPicks');
    if (!wrap) return;
    wrap.innerHTML = '';
    SAMPLE_EVENTS.forEach(function (ev, i) {
      var label = document.createElement('label');
      label.className = 'ebpf-event-pick';
      var checked = i < 4 ? ' checked' : '';
      label.innerHTML =
        '<input type="checkbox" value="' +
        escapeHtml(ev.id) +
        '"' +
        checked +
        ' />' +
        '<span><strong>' +
        escapeHtml(ev.label) +
        '</strong><br /><code>' +
        escapeHtml(JSON.stringify(ev.data)) +
        '</code></span>';
      wrap.appendChild(label);
    });
  }

  /* ---- Trace simulator ---- */

  function formatTs(d) {
    return (
      String(d.getHours()).padStart(2, '0') +
      ':' +
      String(d.getMinutes()).padStart(2, '0') +
      ':' +
      String(d.getSeconds()).padStart(2, '0') +
      '.' +
      String(d.getMilliseconds()).padStart(3, '0')
    );
  }

  function appendTraceLine(entry) {
    var log = $('traceLog');
    if (!log) return;
    var empty = log.querySelector('.ebpf-trace-empty');
    if (empty) empty.remove();

    var line = document.createElement('div');
    line.className = 'ebpf-trace-line';
    var ts = formatTs(new Date());
    line.innerHTML =
      '<span class="ts">[' +
      ts +
      ']</span> ' +
      '<span class="sys">' +
      escapeHtml(entry.sys) +
      '</span> ' +
      escapeHtml(entry.detail) +
      (entry.alert ? ' <span class="alert">⚠ ALERT</span>' : '');
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  function setTraceStatus(text) {
    var el = $('traceStatus');
    if (el) el.textContent = text;
  }

  function stopTraceTimer() {
    if (state.traceTimer) {
      clearInterval(state.traceTimer);
      state.traceTimer = null;
    }
  }

  function startTrace() {
    var startBtn = $('startTraceBtn');
    var pauseBtn = $('pauseTraceBtn');
    if (state.traceTimer && !state.tracePaused) return;

    if (state.tracePaused && state.traceTimer) {
      state.tracePaused = false;
      setTraceStatus('Streaming…');
      if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Start stream';
      }
      if (pauseBtn) pauseBtn.disabled = false;
      return;
    }

    state.tracePaused = false;
    if (!state.traceTimer) {
      setTraceStatus('Streaming…');
      if (startBtn) startBtn.disabled = true;
      if (pauseBtn) pauseBtn.disabled = false;

      state.traceTimer = setInterval(function () {
        if (state.tracePaused) return;
        var entry = TRACE_EVENTS[state.traceIndex % TRACE_EVENTS.length];
        state.traceIndex += 1;
        appendTraceLine(entry);
      }, 900);
    }
  }

  function pauseTrace() {
    if (!state.traceTimer) return;
    state.tracePaused = true;
    setTraceStatus('Paused');
    var startBtn = $('startTraceBtn');
    var pauseBtn = $('pauseTraceBtn');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Resume';
    }
    if (pauseBtn) pauseBtn.disabled = true;
  }

  function clearTrace() {
    stopTraceTimer();
    state.traceIndex = 0;
    state.tracePaused = false;
    var log = $('traceLog');
    if (log) {
      log.innerHTML = '<div class="ebpf-trace-empty">Log cleared. Start the stream to see sample events.</div>';
    }
    setTraceStatus('Idle');
    var startBtn = $('startTraceBtn');
    var pauseBtn = $('pauseTraceBtn');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Start stream';
    }
    if (pauseBtn) pauseBtn.disabled = true;
  }

  /* ---- Quiz ---- */

  function renderQuiz() {
    var wrap = $('quizQuestions');
    if (!wrap) return;
    wrap.innerHTML = '';

    QUIZ.forEach(function (q, qi) {
      var fieldset = document.createElement('fieldset');
      fieldset.className = 'ebpf-quiz-q';
      fieldset.id = 'quiz-' + q.id;

      var legend = document.createElement('legend');
      legend.textContent = qi + 1 + '. ' + q.question;
      fieldset.appendChild(legend);

      var opts = document.createElement('div');
      opts.className = 'ebpf-quiz-options';
      opts.setAttribute('role', 'radiogroup');
      opts.setAttribute('aria-label', 'Question ' + (qi + 1));

      q.options.forEach(function (opt, oi) {
        var label = document.createElement('label');
        label.className = 'ebpf-quiz-option';
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = q.id;
        input.value = String(oi);
        input.required = true;
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + opt));
        opts.appendChild(label);
      });

      fieldset.appendChild(opts);
      wrap.appendChild(fieldset);
    });
  }

  function submitQuiz(e) {
    e.preventDefault();
    var score = 0;
    var unanswered = 0;

    QUIZ.forEach(function (q) {
      var selected = document.querySelector('input[name="' + q.id + '"]:checked');
      var fieldset = $('quiz-' + q.id);
      if (!fieldset) return;
      var labels = fieldset.querySelectorAll('.ebpf-quiz-option');
      labels.forEach(function (lab) {
        lab.classList.remove('is-correct', 'is-wrong');
      });

      if (!selected) {
        unanswered += 1;
        return;
      }

      var chosen = parseInt(selected.value, 10);
      labels.forEach(function (lab, idx) {
        if (idx === q.answer) lab.classList.add('is-correct');
        if (idx === chosen && chosen !== q.answer) lab.classList.add('is-wrong');
      });
      if (chosen === q.answer) score += 1;
    });

    if (unanswered) {
      var resultEarly = $('quizResult');
      if (resultEarly) {
        resultEarly.hidden = false;
        resultEarly.innerHTML =
          '<p>Please answer all questions before submitting. (' +
          unanswered +
          ' unanswered)</p>';
      }
      return;
    }

    if (state.quizBest === null || score > state.quizBest) {
      state.quizBest = score;
      saveProgress();
      updateHeroStats();
    }

    var pct = Math.round((score / QUIZ.length) * 100);
    var msg =
      score === QUIZ.length
        ? 'Perfect score — you are ready to hunt with eBPF.'
        : score >= Math.ceil(QUIZ.length * 0.7)
          ? 'Solid work. Review missed items and retune your Falco conditions.'
          : 'Keep going — revisit the modules on probes, Falco, and seccomp/LSM.';

    var result = $('quizResult');
    if (result) {
      result.hidden = false;
      result.innerHTML =
        '<p><strong>Score: ' +
        score +
        ' / ' +
        QUIZ.length +
        ' (' +
        pct +
        '%)</strong></p>' +
        '<p>' +
        msg +
        '</p>' +
        '<p>Best saved score: <strong>' +
        state.quizBest +
        ' / ' +
        QUIZ.length +
        '</strong></p>';
    }
  }

  function resetQuiz() {
    var form = $('quizForm');
    if (form) form.reset();
    document.querySelectorAll('.ebpf-quiz-option').forEach(function (lab) {
      lab.classList.remove('is-correct', 'is-wrong');
    });
    var result = $('quizResult');
    if (result) {
      result.hidden = true;
      result.innerHTML = '';
    }
  }

  function bindEvents() {
    var markBtn = $('markCompleteBtn');
    if (markBtn) markBtn.addEventListener('click', toggleComplete);

    var prevBtn = $('prevModuleBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        showModule(state.activeModule - 1);
      });
    }
    var nextBtn = $('nextModuleBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        showModule(state.activeModule + 1);
      });
    }

    var evalBtn = $('evaluateRuleBtn');
    if (evalBtn) evalBtn.addEventListener('click', evaluateRule);

    var sampleBtn = $('loadSampleRuleBtn');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', function () {
        if ($('falcoRule')) $('falcoRule').value = SAMPLE_RULE;
      });
    }

    var startBtn = $('startTraceBtn');
    if (startBtn) startBtn.addEventListener('click', startTrace);
    var pauseBtn = $('pauseTraceBtn');
    if (pauseBtn) pauseBtn.addEventListener('click', pauseTrace);
    var clearBtn = $('clearTraceBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearTrace);

    var quizForm = $('quizForm');
    if (quizForm) quizForm.addEventListener('submit', submitQuiz);
    var resetBtn = $('resetQuizBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetQuiz);
  }

  function init() {
    loadProgress();
    renderModuleNav();
    showModule(0);
    renderEventPicks();
    renderQuiz();
    updateHeroStats();
    bindEvents();

    var log = $('traceLog');
    if (log && !log.children.length) {
      log.innerHTML =
        '<div class="ebpf-trace-empty">Idle — press Start stream to simulate ring-buffer consumption.</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
