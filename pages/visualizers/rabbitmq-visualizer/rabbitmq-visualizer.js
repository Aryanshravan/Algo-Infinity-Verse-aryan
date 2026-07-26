/**
 * RabbitMQ Messaging Visualizer
 * Core AMQP Simulation Engine
 * Algo Infinity Verse
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Global State ──
  let isRunning = true;
  let autoConsume = true;
  let simulateFailures = false;
  let simSpeed = 1.0;
  let msgCounter = 0;
  let selectedMsgId = null;

  const MAX_RETRIES = 3;
  const MAX_HOP_COUNT = 10;
  let activeRetryTimers = [];

  function clearAllRetryTimers() {
    activeRetryTimers.forEach((timerId) => clearTimeout(timerId));
    activeRetryTimers = [];
  }

  // Telemetry stats
  const stats = {
    published: 0,
    acked: 0,
    retried: 0,
    dlq: 0,
    recentCount: 0,
  };

  // Queues State
  const queues = {
    orders_queue: [],
    retry_queue: [],
    logs_queue: [],
    notifications_queue: [],
    dlq_queue: [],
  };

  // Active Bindings State
  // { exchange, queue, routingKey, headers, xMatch }
  let bindings = [];

  // Consumers State
  // { id, queueId, name, state: 'idle'|'working'|'failing' }
  let consumers = [];

  // ── Initial Bindings & Setup ──
  function initDefaultBindings() {
    bindings = [
      { exchange: 'amq.direct', queue: 'orders_queue', routingKey: 'orders.created' },
      { exchange: 'amq.direct', queue: 'logs_queue', routingKey: 'logs.info' },
      { exchange: 'amq.topic', queue: 'orders_queue', routingKey: 'orders.*' },
      { exchange: 'amq.topic', queue: 'logs_queue', routingKey: 'logs.*.error' },
      { exchange: 'amq.topic', queue: 'notifications_queue', routingKey: 'logs.#' },
      { exchange: 'amq.fanout', queue: 'orders_queue', routingKey: '' },
      { exchange: 'amq.fanout', queue: 'logs_queue', routingKey: '' },
      { exchange: 'amq.fanout', queue: 'notifications_queue', routingKey: '' },
      {
        exchange: 'amq.headers',
        queue: 'orders_queue',
        xMatch: 'all',
        headers: { format: 'pdf', type: 'invoice' },
      },
      { exchange: 'amq.dlx', queue: 'dlq_queue', routingKey: '' },
    ];
  }

  function initDefaultConsumers() {
    consumers = [
      { id: 'c1', queueId: 'orders_queue', name: 'Order Worker A', state: 'idle' },
      { id: 'c2', queueId: 'logs_queue', name: 'Log Ingestor B', state: 'idle' },
      { id: 'c3', queueId: 'notifications_queue', name: 'Notifier Worker C', state: 'idle' },
    ];
  }

  // ── Element References ──
  const pubExchange = document.getElementById('pubExchange');
  const pubRoutingKey = document.getElementById('pubRoutingKey');
  const pubHeaders = document.getElementById('pubHeaders');
  const pubPayload = document.getElementById('pubPayload');
  const pubTTL = document.getElementById('pubTTL');
  const routingKeyGroup = document.getElementById('routingKeyGroup');
  const headersGroup = document.getElementById('headersGroup');

  const btnPublishMsg = document.getElementById('btnPublishMsg');
  const btnBurstStream = document.getElementById('btnBurstStream');
  const scenarioPreset = document.getElementById('scenarioPreset');
  const btnLoadPreset = document.getElementById('btnLoadPreset');

  const btnPlayPauseSim = document.getElementById('btnPlayPauseSim');
  const lblPlayPause = document.getElementById('lblPlayPause');
  const btnStepSim = document.getElementById('btnStepSim');
  const btnResetSim = document.getElementById('btnResetSim');
  const simSpeedInput = document.getElementById('simSpeed');
  const speedVal = document.getElementById('speedVal');
  const chkAutoConsume = document.getElementById('chkAutoConsume');
  const chkSimulateFailures = document.getElementById('chkSimulateFailures');

  const btnToggleBindingForm = document.getElementById('btnToggleBindingForm');
  const bindingForm = document.getElementById('bindingForm');
  const bindExchange = document.getElementById('bindExchange');
  const bindQueue = document.getElementById('bindQueue');
  const bindRoutingKey = document.getElementById('bindRoutingKey');
  const bindXMatch = document.getElementById('bindXMatch');
  const bindKeyContainer = document.getElementById('bindKeyContainer');
  const bindMatchContainer = document.getElementById('bindMatchContainer');
  const btnCreateBinding = document.getElementById('btnCreateBinding');
  const bindingsList = document.getElementById('bindingsList');

  const btnAddConsumer = document.getElementById('btnAddConsumer');
  const consumersContainer = document.getElementById('consumersContainer');

  const logConsole = document.getElementById('logConsole');
  const btnClearLogs = document.getElementById('btnClearLogs');

  const metricPublished = document.getElementById('metricPublished');
  const metricAcked = document.getElementById('metricAcked');
  const metricRetried = document.getElementById('metricRetried');
  const metricDLQ = document.getElementById('metricDLQ');
  const rateVal = document.getElementById('rateVal');
  const rateFill = document.getElementById('rateFill');

  const inspectMsgId = document.getElementById('inspectMsgId');
  const inspectorContent = document.getElementById('inspectorContent');
  const inspectorActions = document.getElementById('inspectorActions');
  const btnManualAck = document.getElementById('btnManualAck');
  const btnManualNack = document.getElementById('btnManualNack');
  const btnManualReject = document.getElementById('btnManualReject');

  const flowSvgLayer = document.getElementById('flowSvgLayer');

  // ── AMQP Routing Debugger State ──
  const exchangeBreakpoints = new Set();
  let debugFrames = [];
  let currentFrameIdx = -1;
  let isDebugPaused = false;

  // Debugger Toolbar Elements
  const debugStatusBadge = document.getElementById('debugStatusBadge');
  const frameCounter = document.getElementById('frameCounter');
  const btnStepBack = document.getElementById('btnStepBack');
  const btnStepForward = document.getElementById('btnStepForward');
  const btnOpenMatcherModal = document.getElementById('btnOpenMatcherModal');
  const debuggerInfo = document.getElementById('debuggerInfo');

  // Modal Elements
  const patternMatcherModal = document.getElementById('patternMatcherModal');
  const btnCloseMatcherModal = document.getElementById('btnCloseMatcherModal');
  const inspectorExchangeType = document.getElementById('inspectorExchangeType');
  const inspectorRoutingKey = document.getElementById('inspectorRoutingKey');
  const inspectorBindingPattern = document.getElementById('inspectorBindingPattern');
  const inspectorKeyGroup = document.getElementById('inspectorKeyGroup');
  const btnTestPatternMatch = document.getElementById('btnTestPatternMatch');
  const matcherBreakdownOutput = document.getElementById('matcherBreakdownOutput');

  function matchTopicWithBreakdown(pattern, key) {
    const keyTokens = key ? key.split('.') : [];
    const patternTokens = pattern ? pattern.split('.') : [];
    const steps = [];

    if (pattern === '#') {
      steps.push({
        step: 1,
        keyToken: key || '(empty)',
        patternToken: '#',
        rule: 'multi_wildcard',
        matched: true,
        explanation: 'Wildcard "#" matches entire key',
      });
      return { matched: true, keyTokens, patternTokens, steps };
    }
    if (!pattern || !key) {
      const isMatch = pattern === key;
      steps.push({
        step: 1,
        keyToken: key || '(empty)',
        patternToken: pattern || '(empty)',
        rule: isMatch ? 'exact' : 'mismatch',
        matched: isMatch,
        explanation: isMatch ? 'Exact empty string match' : 'Pattern or key missing',
      });
      return { matched: isMatch, keyTokens, patternTokens, steps };
    }
    let stepNum = 0;
    function mh(pi, ki) {
      stepNum++;
      const currentStep = stepNum;
      const pToken = pi < patternTokens.length ? patternTokens[pi] : null;
      const kToken = ki < keyTokens.length ? keyTokens[ki] : null;

      if (pi === patternTokens.length && ki === keyTokens.length) {
        steps.push({
          step: currentStep,
          keyToken: '(end)',
          patternToken: '(end)',
          rule: 'exact',
          matched: true,
          explanation: 'End of pattern and key reached successfully',
        });
        return true;
      }
      if (pi === patternTokens.length) {
        steps.push({
          step: currentStep,
          keyToken: kToken,
          patternToken: '(end)',
          rule: 'length_mismatch',
          matched: false,
          explanation: `Key has remaining token "${kToken}" but pattern ended`,
        });
        return false;
      }
      if (pToken === '#') {
        if (mh(pi + 1, ki)) {
          steps.push({
            step: currentStep,
            keyToken: kToken || '(none)',
            patternToken: '#',
            rule: 'multi_wildcard',
            matched: true,
            explanation: `Wildcard "#" matched 0 words (skipped "#")`,
          });
          return true;
        }
        if (ki < keyTokens.length && mh(pi, ki + 1)) {
          steps.push({
            step: currentStep,
            keyToken: kToken,
            patternToken: '#',
            rule: 'multi_wildcard',
            matched: true,
            explanation: `Wildcard "#" consumed token "${kToken}"`,
          });
          return true;
        }
        steps.push({
          step: currentStep,
          keyToken: kToken || '(none)',
          patternToken: '#',
          rule: 'multi_wildcard',
          matched: false,
          explanation: `Wildcard "#" failed to match remaining sequence`,
        });
        return false;
      }
      if (ki === keyTokens.length) {
        steps.push({
          step: currentStep,
          keyToken: '(end)',
          patternToken: pToken,
          rule: 'length_mismatch',
          matched: false,
          explanation: `Pattern token "${pToken}" remaining but key ended`,
        });
        return false;
      }
      if (pToken === '*' || pToken === kToken) {
        const isStar = pToken === '*';
        const res = mh(pi + 1, ki + 1);
        steps.push({
          step: currentStep,
          keyToken: kToken,
          patternToken: pToken,
          rule: isStar ? 'single_wildcard' : 'exact',
          matched: res,
          explanation: isStar
            ? `Wildcard "*" matched token "${kToken}"`
            : `Exact token match "${kToken}" === "${pToken}"`,
        });
        return res;
      }
      steps.push({
        step: currentStep,
        keyToken: kToken,
        patternToken: pToken,
        rule: 'mismatch',
        matched: false,
        explanation: `Token mismatch: "${kToken}" !== "${pToken}"`,
      });
      return false;
    }
    const isMatched = mh(0, 0);
    steps.sort((a, b) => a.step - b.step);
    const uniqueSteps = [];
    const seen = new Set();
    for (const s of steps) {
      const id = `${s.step}-${s.keyToken}-${s.patternToken}-${s.matched}`;
      if (!seen.has(id)) {
        seen.add(id);
        uniqueSteps.push(s);
      }
    }
    return { matched: isMatched, keyTokens, patternTokens, steps: uniqueSteps };
  }
  // ── Shovel & Federation State ──
  let isShovelActive = false;
  let wanLatency = 200;
  let wanDropRate = 0.05;
  const shovelStats = { shoveled: 0, dropped: 0 };
  let topologyMode = 'single';

  const selTopologyMode = document.getElementById('selTopologyMode');
  const chkEnableShovel = document.getElementById('chkEnableShovel');
  const wanLatencySlider = document.getElementById('wanLatencySlider');
  const wanLatencyVal = document.getElementById('wanLatencyVal');
  const wanDropRateSlider = document.getElementById('wanDropRateSlider');
  const wanDropVal = document.getElementById('wanDropVal');
  const tagShoveledMsgs = document.getElementById('tagShoveledMsgs');
  const tagWanDropped = document.getElementById('tagWanDropped');

  function updateShovelUI() {
    if (tagShoveledMsgs) {
      tagShoveledMsgs.innerHTML = `<i class="fas fa-truck-ramp-box"></i> Shoveled: ${shovelStats.shoveled}`;
    }
    if (tagWanDropped) {
      tagWanDropped.innerHTML = `<i class="fas fa-triangle-exclamation"></i> Dropped: ${shovelStats.dropped}`;
    }
  }

  function runShovelCycle() {
    if (!isShovelActive) return;

    // Source queue: orders_queue (US-East) -> Destination queue: logs_queue (EU-West)
    const srcQueue = queues['orders_queue'];
    if (!srcQueue || srcQueue.length === 0) return;

    const msg = srcQueue.shift();
    renderQueueMessages('orders_queue');

    // Simulate WAN packet drop
    const isDropped = Math.random() < wanDropRate;
    if (isDropped) {
      shovelStats.dropped++;
      updateShovelUI();
      logEvent(
        'dlq',
        `<strong>[SHOVEL WAN LOSS]</strong> Packet <strong>[${msg.id}]</strong> lost over WAN link (${wanLatency}ms latency, ${(wanDropRate * 100).toFixed(0)}% loss rate).`
      );
    } else {
      shovelStats.shoveled++;
      updateShovelUI();
      logEvent(
        'sys',
        `<strong>[SHOVEL TRANSFER]</strong> Dequeued <strong>[${msg.id}]</strong> from US-East. Transferring over WAN pipe (${wanLatency}ms)...`
      );

      setTimeout(() => {
        const destMsg = JSON.parse(JSON.stringify(msg));
        destMsg.history.push('Shoveled over WAN to EU-West');
        queues['logs_queue'].push(destMsg);
        renderQueueMessages('logs_queue');
        logEvent(
          'ack',
          `<strong>[SHOVEL DELIVERED]</strong> Message <strong>[${msg.id}]</strong> successfully shoveled to EU-West Datacenter!`
        );
      }, wanLatency);
    }
  }

  function setupShovelHandlers() {
    if (chkEnableShovel) {
      chkEnableShovel.addEventListener('change', () => {
        isShovelActive = chkEnableShovel.checked;
        logEvent(
          'sys',
          `RabbitMQ Shovel Plugin <strong>${isShovelActive ? 'ENABLED' : 'DISABLED'}</strong>.`
        );
      });
    }

    if (wanLatencySlider) {
      wanLatencySlider.addEventListener('input', () => {
        wanLatency = parseInt(wanLatencySlider.value) || 200;
        if (wanLatencyVal) wanLatencyVal.textContent = `${wanLatency}ms`;
      });
    }

    if (wanDropRateSlider) {
      wanDropRateSlider.addEventListener('input', () => {
        const val = parseInt(wanDropRateSlider.value) || 0;
        wanDropRate = val / 100;
        if (wanDropVal) wanDropVal.textContent = `${val}%`;
      });
    }

    if (selTopologyMode) {
      selTopologyMode.addEventListener('change', () => {
        topologyMode = selTopologyMode.value;
        logEvent(
          'sys',
          `Switched canvas layout to <strong>${topologyMode === 'multi-region' ? 'Multi-Region WAN Mode (US-East ➔ EU-West)' : 'Single Cluster Mode'}</strong>.`
        );
        setTimeout(drawConnectionLines, 200);
      });
    }

    // Run Shovel Engine worker every 2.5 seconds
    setInterval(runShovelCycle, 2500);
  }

  // ── Multi-Node HA Cluster State ──
  const clusterNodes = {
    'node-a': { id: 'node-a', name: 'Node-A', status: 'online' },
    'node-b': { id: 'node-b', name: 'Node-B', status: 'online' },
    'node-c': { id: 'node-c', name: 'Node-C', status: 'online' },
  };

  const queueHA = {
    orders_queue: { leaderNode: 'node-a', followerNodes: ['node-b', 'node-c'] },
    retry_queue: { leaderNode: 'node-b', followerNodes: ['node-a', 'node-c'] },
    logs_queue: { leaderNode: 'node-c', followerNodes: ['node-a', 'node-b'] },
    notifications_queue: { leaderNode: 'node-a', followerNodes: ['node-b', 'node-c'] },
    dlq_queue: { leaderNode: 'node-b', followerNodes: ['node-a', 'node-c'] },
  };

  const clusterElectionBanner = document.getElementById('clusterElectionBanner');
  const clusterElectionMsg = document.getElementById('clusterElectionMsg');

  function renderQueueHATags() {
    Object.keys(queueHA).forEach((qName) => {
      const tagContainerId = `ha-tags-${qName.replace('_queue', '')}`;
      const container = document.getElementById(tagContainerId);
      if (!container) return;

      const ha = queueHA[qName];
      const leaderName = clusterNodes[ha.leaderNode]
        ? clusterNodes[ha.leaderNode].name
        : ha.leaderNode;
      const leaderStatus = clusterNodes[ha.leaderNode]
        ? clusterNodes[ha.leaderNode].status
        : 'online';

      let html = `<span class="ha-badge-leader ${leaderStatus === 'crashed' ? 'crashed' : ''}" title="Queue Leader Node">👑 ${leaderName}</span>`;

      ha.followerNodes.forEach((fId) => {
        const fName = clusterNodes[fId] ? clusterNodes[fId].name : fId;
        const fStatus = clusterNodes[fId] ? clusterNodes[fId].status : 'online';
        if (fStatus === 'online') {
          html += `<span class="ha-badge-follower" title="Mirrored Follower Replica">🛡️ ${fName}</span>`;
        }
      });

      container.innerHTML = html;
    });
  }

  // ── Broker Resource Pressure & Flow Control State ──
  let resourcePressure = 20;
  let isConnectionBlocked = false;
  const outboundBuffer = [];

  const brokerPressureSlider = document.getElementById('brokerPressureSlider');
  const watermarkStatusBadge = document.getElementById('watermarkStatusBadge');
  const outboundBufferTag = document.getElementById('outboundBufferTag');
  const flowBarrierOverlay = document.getElementById('flowBarrierOverlay');
  const producerConfirmBadge = document.getElementById('producerConfirmBadge');

  function updateWatermarkPressure(val) {
    resourcePressure = parseInt(val) || 0;

    if (resourcePressure > 80) {
      const wasNormal = !isConnectionBlocked;
      isConnectionBlocked = true;
      if (watermarkStatusBadge) {
        watermarkStatusBadge.className = 'watermark-status-badge alarm';
        watermarkStatusBadge.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ALARM (${resourcePressure}%)`;
      }
      if (flowBarrierOverlay) flowBarrierOverlay.classList.remove('hidden');

      if (wasNormal) {
        logEvent(
          'dlq',
          `<strong>HIGH WATERMARK ALARM</strong>: Broker memory/disk usage reached <strong>${resourcePressure}%</strong> (>80%). Connection <strong>BLOCKED</strong> (Backpressure active).`
        );
      }
    } else {
      const wasBlocked = isConnectionBlocked;
      isConnectionBlocked = false;
      if (watermarkStatusBadge) {
        watermarkStatusBadge.className = 'watermark-status-badge normal';
        watermarkStatusBadge.innerHTML = `Normal (${resourcePressure}%)`;
      }
      if (flowBarrierOverlay) flowBarrierOverlay.classList.add('hidden');

      if (wasBlocked) {
        logEvent(
          'sys',
          `<strong>FLOW CONTROL RESOLVED</strong>: Watermark alarm cleared (${resourcePressure}%). Connection <strong>UNBLOCKED</strong>! Flushing outbound buffer...`
        );
        flushOutboundBuffer();
      }
    }
  }

  function flushOutboundBuffer() {
    while (outboundBuffer.length > 0) {
      const msg = outboundBuffer.shift();
      updateOutboundBufferUI();
      stats.published++;
      stats.recentCount++;
      updateStatsUI();

      logEvent(
        'pub',
        `Flushed buffered msg <strong>[${msg.id}]</strong> to <em>${msg.exchange}</em>`
      );
      emitPublisherConfirm(msg, 'basic.ack');
      routeMessage(msg);
    }
  }

  function emitPublisherConfirm(msg, type) {
    if (producerConfirmBadge) {
      producerConfirmBadge.textContent = type;
      producerConfirmBadge.classList.add('show-ack');
      setTimeout(() => producerConfirmBadge.classList.remove('show-ack'), 800);
    }
    logEvent(
      'ack',
      `Publisher received <strong>${type}</strong> (Confirm) for message <strong>[${msg.id}]</strong>`
    );
  }

  function updateOutboundBufferUI() {
    if (outboundBufferTag) {
      outboundBufferTag.innerHTML = `<i class="fas fa-box-archive"></i> Outbound Buffer: ${outboundBuffer.length} msgs`;
    }
  }

  const pubPriority = document.getElementById('pubPriority');

  // ── Queue Policies State & Priority Heap Engine ──
  const queuePolicies = {
    orders_queue: {
      queueType: 'classic',
      xMaxPriority: 10,
      xMaxLength: 10,
      overflowPolicy: 'drop-head',
    },
    retry_queue: {
      queueType: 'classic',
      xMaxPriority: 0,
      xMaxLength: 10,
      overflowPolicy: 'drop-head',
    },
    logs_queue: {
      queueType: 'stream',
      xMaxPriority: 0,
      xMaxLength: 20,
      overflowPolicy: 'drop-head',
    },
    notifications_queue: {
      queueType: 'quorum',
      xMaxPriority: 5,
      xMaxLength: 10,
      overflowPolicy: 'drop-head',
    },
    dlq_queue: {
      queueType: 'classic',
      xMaxPriority: 0,
      xMaxLength: 20,
      overflowPolicy: 'drop-head',
    },
  };

  let activeConfigQueue = 'orders_queue';

  const queueConfigModal = document.getElementById('queueConfigModal');
  const btnCloseQueueConfigModal = document.getElementById('btnCloseQueueConfigModal');
  const configQueueNameTitle = document.getElementById('configQueueNameTitle');
  const cfgQueueType = document.getElementById('cfgQueueType');
  const cfgMaxPriority = document.getElementById('cfgMaxPriority');
  const cfgMaxLength = document.getElementById('cfgMaxLength');
  const cfgOverflowPolicy = document.getElementById('cfgOverflowPolicy');
  const btnSaveQueueConfig = document.getElementById('btnSaveQueueConfig');

  function sortQueueByPriority(qName) {
    const policy = queuePolicies[qName];
    if (!policy || policy.xMaxPriority <= 0 || !queues[qName]) return;

    queues[qName].sort((a, b) => {
      const prioA = Math.min(a.priority || 0, policy.xMaxPriority);
      const prioB = Math.min(b.priority || 0, policy.xMaxPriority);
      if (prioA !== prioB) return prioB - prioA;
      return 0;
    });
  }

  function renderQueuePolicyTags() {
    Object.keys(queuePolicies).forEach((qName) => {
      const tagContainerId = `policy-tags-${qName.replace('_queue', '')}`;
      const container = document.getElementById(tagContainerId);
      if (!container) return;

      const p = queuePolicies[qName];
      let html = '';

      if (p.queueType === 'quorum') {
        html += `<span class="tag-policy tag-quorum" title="Quorum Queue (Raft Replicated)">QUORUM</span>`;
      } else if (p.queueType === 'stream') {
        html += `<span class="tag-policy tag-stream" title="Stream Queue (Append-Only Log)">STREAM</span>`;
      }

      if (p.xMaxPriority > 0) {
        html += `<span class="tag-policy tag-priority" title="Max Priority Level">x-max-p:${p.xMaxPriority}</span>`;
      }

      if (p.xMaxLength > 0) {
        html += `<span class="tag-policy tag-max-len" title="Max Queue Length">len:${p.xMaxLength}</span>`;
      }

      container.innerHTML = html;
    });
  }

  function renderClusterNodesUI() {
    Object.keys(clusterNodes).forEach((nId) => {
      const node = clusterNodes[nId];
      const card = document.getElementById(`card-${nId}`);
      const statusBadge = document.getElementById(`status-${nId}`);
      const btn = document.querySelector(`.btn-kill-node[data-node="${nId}"]`);

      if (card && statusBadge && btn) {
        if (node.status === 'online') {
          card.className = 'cluster-node-card online';
          statusBadge.className = 'c-node-badge healthy';
          statusBadge.textContent = 'HEALTHY';
          btn.className = 'btn-kill-node';
          btn.innerHTML =
            '<i class="fas fa-power-off"></i> <span class="lbl-kill">Kill Node</span>';
        } else {
          card.className = 'cluster-node-card crashed';
          statusBadge.className = 'c-node-badge crashed';
          statusBadge.textContent = 'CRASHED';
          btn.className = 'btn-kill-node btn-revive';
          btn.innerHTML = '<i class="fas fa-bolt"></i> <span class="lbl-kill">Revive Node</span>';
        }
      }
    });
  }

  function toggleNodeCrash(nodeId) {
    const node = clusterNodes[nodeId];
    if (!node) return;

    if (node.status === 'online') {
      node.status = 'crashed';
      logEvent(
        'dlq',
        `CRASH ALARM: Node <strong>${node.name}</strong> went OFFLINE! Triggering election protocol...`
      );

      // Election Failover for queues led by this node
      const promotedQueues = [];
      Object.keys(queueHA).forEach((qName) => {
        const ha = queueHA[qName];
        if (ha.leaderNode === nodeId) {
          // Elect first healthy follower
          const nextLeader = ha.followerNodes.find(
            (fId) => clusterNodes[fId] && clusterNodes[fId].status === 'online'
          );
          if (nextLeader) {
            ha.followerNodes = ha.followerNodes.filter((id) => id !== nextLeader);
            ha.followerNodes.push(nodeId);
            ha.leaderNode = nextLeader;
            promotedQueues.push({ queue: qName, newLeader: clusterNodes[nextLeader].name });
          }
        }
      });

      if (promotedQueues.length > 0) {
        const promoText = promotedQueues
          .map(
            (p) =>
              `${clusterNodes[nodeId].name} crashed! ${p.newLeader} promoted to LEADER for ${p.queue}`
          )
          .join('; ');
        showElectionBanner(`${promoText} (Zero Message Loss)`);
        logEvent(
          'ack',
          `ELECTION COMPLETED: Promoted new leaders for ${promotedQueues.length} queues with zero message loss.`
        );
      }
    } else {
      node.status = 'online';
      logEvent(
        'sys',
        `NODE RECOVERED: <strong>${node.name}</strong> rejoined the cluster as a mirrored follower.`
      );
    }

    renderClusterNodesUI();
    renderQueueHATags();
  }

  function showElectionBanner(msg) {
    if (!clusterElectionBanner || !clusterElectionMsg) return;
    clusterElectionMsg.textContent = msg;
    clusterElectionBanner.classList.remove('hidden');
    setTimeout(() => {
      clusterElectionBanner.classList.add('hidden');
    }, 4500);
  }

  function setupClusterNodeHandlers() {
    document.querySelectorAll('.btn-kill-node').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const nodeId = e.currentTarget.getAttribute('data-node');
        toggleNodeCrash(nodeId);
      });
    });
  }

  function openQueueConfigModal(qName) {
    activeConfigQueue = qName;
    const p = queuePolicies[qName] || {
      queueType: 'classic',
      xMaxPriority: 0,
      xMaxLength: 0,
      overflowPolicy: 'drop-head',
    };

    if (configQueueNameTitle) configQueueNameTitle.textContent = `Target Queue: ${qName}`;
    if (cfgQueueType) cfgQueueType.value = p.queueType;
    if (cfgMaxPriority) cfgMaxPriority.value = p.xMaxPriority;
    if (cfgMaxLength) cfgMaxLength.value = p.xMaxLength;
    if (cfgOverflowPolicy) cfgOverflowPolicy.value = p.overflowPolicy;

    if (queueConfigModal) queueConfigModal.classList.remove('hidden');
  }

  function closeQueueConfigModal() {
    if (queueConfigModal) queueConfigModal.classList.add('hidden');
  }

  function saveQueueConfig() {
    if (!activeConfigQueue) return;
    const policy = queuePolicies[activeConfigQueue] || {};

    policy.queueType = cfgQueueType.value;
    policy.xMaxPriority = parseInt(cfgMaxPriority.value) || 0;
    policy.xMaxLength = parseInt(cfgMaxLength.value) || 0;
    policy.overflowPolicy = cfgOverflowPolicy.value;

    queuePolicies[activeConfigQueue] = policy;

    sortQueueByPriority(activeConfigQueue);
    renderAllQueues();
    renderQueuePolicyTags();

    logEvent(
      'sys',
      `Updated policies for <strong>${activeConfigQueue}</strong>: Type=${policy.queueType.toUpperCase()}, MaxPriority=${policy.xMaxPriority}, MaxLen=${policy.xMaxLength}, Overflow=${policy.overflowPolicy}`
    );

    closeQueueConfigModal();
  }

  function setupQueueConfigHandlers() {
    document.querySelectorAll('.btn-queue-config').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const qName = e.currentTarget.getAttribute('data-queue');
        openQueueConfigModal(qName);
      });
    });

    if (btnCloseQueueConfigModal) {
      btnCloseQueueConfigModal.addEventListener('click', closeQueueConfigModal);
    }
    if (btnSaveQueueConfig) {
      btnSaveQueueConfig.addEventListener('click', saveQueueConfig);
    }
  }

  // ── Topic Wildcard Pattern Matcher ──
  function _matchTopic(pattern, key) {
    if (pattern === '#') return true;
    if (!pattern || !key) return pattern === key;
    const p = pattern.split('.');
    const k = key.split('.');
    function mh(pi, ki) {
      if (pi === p.length && ki === k.length) return true;
      if (pi === p.length) return false;
      if (p[pi] === '#') {
        if (mh(pi + 1, ki)) return true;
        if (ki < k.length && mh(pi, ki + 1)) return true;
        return false;
      }
      if (ki === k.length) return false;
      if (p[pi] === '*' || p[pi] === k[ki]) return mh(pi + 1, ki + 1);
      return false;
    }
    return mh(0, 0);
  }

  // ── Headers Matching Logic & Breakdown ──

  function matchHeadersWithBreakdown(bindingHeaders, xMatch) {
    bindingHeaders = bindingHeaders || {};
    const keys = Object.keys(bindingHeaders);
    const comparisons = keys.map((k) => {
      const expected = bindingHeaders[k];
      return { key: k, expected, matched };
    });

    const isAny = xMatch === 'any';
    const matched =
      keys.length > 0 &&
      (isAny ? comparisons.some((c) => c.matched) : comparisons.every((c) => c.matched));

    return { matched, xMatch: isAny ? 'any' : 'all', comparisons };
  }

  // ── Direct Matching Logic & Breakdown ──
  function matchDirectWithBreakdown(msgKey, bindingKey) {
    const matched = msgKey === bindingKey;
    return {
      matched,
      msgKey,
      bindingKey,
      explanation: matched
        ? `Exact key match "${msgKey}" === "${bindingKey}"`
        : `Key mismatch "${msgKey}" !== "${bindingKey}"`,
    };
  }

  // ── Logging Helper ──
  function logEvent(type, message) {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.innerHTML = `<span class="timestamp">[${timeStr}]</span> ${message}`;
    logConsole.appendChild(line);
    logConsole.scrollTop = logConsole.scrollHeight;

    // Keep last 100 lines
    while (logConsole.children.length > 100) {
      logConsole.removeChild(logConsole.firstChild);
    }
  }

  // ── Debugger Stepper Renderer & Controllers ──
  function renderDebugFrame(idx) {
    if (idx < 0 || idx >= debugFrames.length) {
      updateDebuggerUIState();
      return;
    }

    currentFrameIdx = idx;
    const frame = debugFrames[idx];

    // Highlight target exchange node
    document.querySelectorAll('.exchange-node').forEach((node) => {
      node.classList.remove('debug-evaluating');
    });
    const exNode = document.querySelector(`.exchange-node[data-exchange="${frame.exchange}"]`);
    if (exNode) exNode.classList.add('debug-evaluating');

    // Update Debugger UI Info
    debuggerInfo.innerHTML = `Frame ${idx + 1}/${debugFrames.length}: <strong>${frame.exchange}</strong> ➔ <strong>${frame.queue}</strong> (${frame.binding.routingKey || 'all'}) &nbsp; <span class="${frame.matched ? 'text-success' : 'text-danger'}">${frame.matched ? 'MATCH ✓' : 'MISMATCH ✗'}</span>`;

    updateDebuggerUIState();
  }

  function updateDebuggerUIState() {
    if (debugFrames.length === 0) {
      frameCounter.textContent = 'Frame 0 / 0';
      if (btnStepBack) btnStepBack.disabled = true;
      if (btnStepForward) btnStepForward.disabled = true;
      if (debugStatusBadge) {
        debugStatusBadge.className = 'debug-badge';
        debugStatusBadge.innerHTML = '<i class="fas fa-bug"></i> Debugger Idle';
      }
      return;
    }

    frameCounter.textContent = `Frame ${currentFrameIdx + 1} / ${debugFrames.length}`;
    if (btnStepBack) btnStepBack.disabled = currentFrameIdx <= 0;
    if (btnStepForward) btnStepForward.disabled = currentFrameIdx >= debugFrames.length - 1;

    if (debugStatusBadge) {
      if (isDebugPaused) {
        debugStatusBadge.className = 'debug-badge paused';
        debugStatusBadge.innerHTML = '<i class="fas fa-pause-circle"></i> Debugger Paused';
      } else {
        debugStatusBadge.className = 'debug-badge active';
        debugStatusBadge.innerHTML = '<i class="fas fa-circle-play"></i> Debugger Active';
      }
    }
  }

  function stepForwardFrame() {
    if (currentFrameIdx < debugFrames.length - 1) {
      renderDebugFrame(currentFrameIdx + 1);
    }
  }

  function stepBackwardFrame() {
    if (currentFrameIdx > 0) {
      renderDebugFrame(currentFrameIdx - 1);
    }
  }

  function setupBreakpointHandlers() {
    document.querySelectorAll('.btn-breakpoint').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ex = btn.getAttribute('data-ex');
        if (exchangeBreakpoints.has(ex)) {
          exchangeBreakpoints.delete(ex);
          btn.classList.remove('has-breakpoint');
          btn.innerHTML = '<i class="fas fa-circle-dot"></i>';
          logEvent('sys', `Removed breakpoint from <strong>${ex}</strong>`);
        } else {
          exchangeBreakpoints.add(ex);
          btn.classList.add('has-breakpoint');
          btn.innerHTML = '<i class="fas fa-pause-circle"></i>';
          logEvent('nack', `Set breakpoint on exchange <strong>${ex}</strong>`);
        }
      });
    });
  }

  // ── Pattern Inspector Modal Controller ──
  function openMatcherModal(frameData) {
    if (!patternMatcherModal) return;
    patternMatcherModal.classList.remove('hidden');

    if (frameData) {
      if (inspectorExchangeType) inspectorExchangeType.value = frameData.exchange || 'amq.topic';
      if (frameData.msg && inspectorRoutingKey) {
        inspectorRoutingKey.value = frameData.msg.routingKey || '';
      }
      if (frameData.binding && inspectorBindingPattern) {
        inspectorBindingPattern.value = frameData.binding.routingKey || '';
      }
    } else if (currentFrameIdx >= 0 && currentFrameIdx < debugFrames.length) {
      const f = debugFrames[currentFrameIdx];
      if (inspectorExchangeType) inspectorExchangeType.value = f.exchange || 'amq.topic';
      if (f.msg && inspectorRoutingKey) inspectorRoutingKey.value = f.msg.routingKey || '';
      if (f.binding && inspectorBindingPattern)
        inspectorBindingPattern.value = f.binding.routingKey || '';
    }

    runInspectorEvaluation();
  }

  function closeMatcherModal() {
    if (patternMatcherModal) patternMatcherModal.classList.add('hidden');
  }

  function runInspectorEvaluation() {
    if (!matcherBreakdownOutput) return;
    const exType = inspectorExchangeType ? inspectorExchangeType.value : 'amq.topic';
    const key = inspectorRoutingKey ? inspectorRoutingKey.value.trim() : '';
    const pattern = inspectorBindingPattern ? inspectorBindingPattern.value.trim() : '';

    if (exType === 'amq.headers') {
      if (inspectorKeyGroup) inspectorKeyGroup.classList.add('hidden');
      const msgHeaders = { format: 'pdf', type: 'invoice' };
      const bindingHeaders = { format: 'pdf', type: 'invoice' };
      const res = matchHeadersWithBreakdown(msgHeaders, bindingHeaders, 'all');
      renderHeaderBreakdownOutput(res);
      return;
    } else {
      if (inspectorKeyGroup) inspectorKeyGroup.classList.remove('hidden');
    }

    if (exType === 'amq.direct') {
      const res = matchDirectWithBreakdown(key, pattern);
      renderDirectBreakdownOutput(res);
    } else {
      // amq.topic
      const res = matchTopicWithBreakdown(pattern, key);
      renderTopicBreakdownOutput(res, key, pattern);
    }
  }

  function renderTopicBreakdownOutput(res, key, pattern) {
    const keyPills =
      res.keyTokens.length > 0
        ? res.keyTokens
            .map((t) => `<span class="token-pill token-key"><i class="fas fa-tag"></i> ${t}</span>`)
            .join('<span class="token-separator">.</span>')
        : '<span class="text-muted">(empty)</span>';

    const patternPills =
      res.patternTokens.length > 0
        ? res.patternTokens
            .map((t) => {
              const isWildcard = t === '*' || t === '#';
              return `<span class="token-pill ${isWildcard ? 'token-wildcard' : 'token-pattern'}"><i class="fas ${isWildcard ? 'fa-asterisk' : 'fa-filter'}"></i> ${t}</span>`;
            })
            .join('<span class="token-separator">.</span>')
        : '<span class="text-muted">(empty)</span>';

    const stepsRows = res.steps
      .map(
        (s) => `
      <tr>
        <td>Step #${s.step}</td>
        <td><span class="token-pill token-key">${s.keyToken}</span></td>
        <td><span class="token-pill ${s.patternToken === '*' || s.patternToken === '#' ? 'token-wildcard' : 'token-pattern'}">${s.patternToken}</span></td>
        <td><code>${s.rule}</code></td>
        <td><span class="${s.matched ? 'badge-pass' : 'badge-fail'}">${s.matched ? 'PASS ✓' : 'FAIL ✗'}</span></td>
        <td style="font-size: 0.72rem; color: var(--text-secondary);">${s.explanation}</td>
      </tr>
    `
      )
      .join('');

    matcherBreakdownOutput.innerHTML = `
      <div class="token-section-box">
        <div class="token-section-title"><i class="fas fa-font"></i> Published Key Tokenization [${res.keyTokens.length} tokens]</div>
        <div class="token-pills-row">${keyPills}</div>
      </div>
      <div class="token-section-box">
        <div class="token-section-title"><i class="fas fa-sitemap"></i> Binding Pattern Tokenization [${res.patternTokens.length} tokens]</div>
        <div class="token-pills-row">${patternPills}</div>
      </div>
      <div class="token-section-box">
        <div class="token-section-title"><i class="fas fa-list-ol"></i> Step-by-Step Wildcard Token Match Matrix</div>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Step</th>
              <th>Key Token</th>
              <th>Pattern Token</th>
              <th>Rule</th>
              <th>Status</th>
              <th>Evaluation Details</th>
            </tr>
          </thead>
          <tbody>
            ${stepsRows}
          </tbody>
        </table>
      </div>
      <div class="match-summary-banner ${res.matched ? 'success' : 'failed'}">
        <i class="fas ${res.matched ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
        <span>${res.matched ? `ROUTING SUCCESS: Key "${key}" matches pattern "${pattern}"` : `ROUTING FAILED: Key "${key}" does NOT match pattern "${pattern}"`}</span>
      </div>
    `;
  }

  function renderDirectBreakdownOutput(res) {
    matcherBreakdownOutput.innerHTML = `
      <div class="token-section-box">
        <div class="token-section-title"><i class="fas fa-equals"></i> Direct Exact Key Comparison</div>
        <div style="font-family: 'Fira Code', monospace; font-size: 0.85rem; padding: 0.5rem 0;">
          <div>Published Key: <strong style="color: var(--rmq-cyan);">'${res.msgKey}'</strong></div>
          <div>Binding Key: &nbsp;&nbsp;<strong style="color: var(--rmq-purple);">'${res.bindingKey}'</strong></div>
        </div>
      </div>
      <div class="match-summary-banner ${res.matched ? 'success' : 'failed'}">
        <i class="fas ${res.matched ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
        <span>${res.explanation}</span>
      </div>
    `;
  }

  function renderHeaderBreakdownOutput(res) {
    const rows = res.comparisons
      .map(
        (c) => `
      <tr>
        <td><code>${c.key}</code></td>
        <td><code>${c.expected}</code></td>
        <td><code>${c.actual || '(none)'}</code></td>
        <td><span class="${c.matched ? 'badge-pass' : 'badge-fail'}">${c.matched ? 'PASS ✓' : 'FAIL ✗'}</span></td>
      </tr>
    `
      )
      .join('');

    matcherBreakdownOutput.innerHTML = `
      <div class="token-section-box">
        <div class="token-section-title"><i class="fas fa-tags"></i> Header Attributes Comparison (x-match: ${res.xMatch})</div>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Header Key</th>
              <th>Expected Value</th>
              <th>Actual Value</th>
              <th>Match Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="match-summary-banner ${res.matched ? 'success' : 'failed'}">
        <i class="fas ${res.matched ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
        <span>${res.matched ? 'HEADERS MATCH SUCCESS' : 'HEADERS MATCH FAILED'}</span>
      </div>
    `;
  }

  // ── UI Form Handlers ──
  pubExchange.addEventListener('change', () => {
    const ex = pubExchange.value;
    if (ex === 'amq.headers') {
      headersGroup.classList.remove('hidden');
      routingKeyGroup.classList.add('hidden');
    } else if (ex === 'amq.fanout') {
      headersGroup.classList.add('hidden');
      routingKeyGroup.classList.add('hidden');
    } else {
      headersGroup.classList.add('hidden');
      routingKeyGroup.classList.remove('hidden');
    }
  });

  bindExchange.addEventListener('change', () => {
    if (bindExchange.value === 'amq.headers') {
      bindMatchContainer.classList.remove('hidden');
      bindKeyContainer.classList.add('hidden');
    } else {
      bindMatchContainer.classList.add('hidden');
      bindKeyContainer.classList.remove('hidden');
    }
  });

  btnToggleBindingForm.addEventListener('click', () => {
    bindingForm.classList.toggle('hidden');
  });

  btnCreateBinding.addEventListener('click', () => {
    const ex = bindExchange.value;
    const q = bindQueue.value;
    const key = bindRoutingKey.value.trim();
    const xMatch = bindXMatch.value;

    const newBind = { exchange: ex, queue: q, routingKey: key, xMatch };
    if (ex === 'amq.headers') {
      newBind.headers = { format: 'pdf', type: 'invoice' };
    }
    bindings.push(newBind);
    renderBindingsList();
    drawConnectionLines();
    logEvent(
      'sys',
      `Added binding: <strong>${ex}</strong> ➔ <strong>${q}</strong> (${key || 'all'})`
    );
  });

  function renderBindingsList() {
    bindingsList.innerHTML = '';
    bindings.forEach((b, idx) => {
      const item = document.createElement('div');
      item.className = 'binding-item';
      const routeText =
        b.exchange === 'amq.headers' ? `x-match:${b.xMatch}` : b.routingKey || 'broadcast';
      item.innerHTML = `
                <span><strong>${b.exchange}</strong> ➔ ${b.queue}</span>
                <span class="bind-route">[${routeText}]</span>
                <button type="button" class="btn-remove-bind" data-idx="${idx}"><i class="fas fa-trash"></i></button>
            `;
      bindingsList.appendChild(item);
    });

    bindingsList.querySelectorAll('.btn-remove-bind').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        bindings.splice(idx, 1);
        renderBindingsList();
        drawConnectionLines();
      });
    });
  }

  // ── AMQP Publish Engine ──
  function createMessage(exchange, routingKey, payload, headers, ttl) {
    msgCounter++;
    const priority = pubPriority ? parseInt(pubPriority.value) || 0 : 0;
    return {
      id: `msg_${msgCounter}`,
      exchange,
      routingKey,
      payload,
      headers: headers || {},
      priority,
      ttl: parseInt(ttl) || 0,
      retries: 0,
      publishedAt: new Date().toLocaleTimeString(),
      history: [`Published to ${exchange}`],
    };
  }

  function publishMessage() {
    const exchange = pubExchange.value;
    const key = pubRoutingKey.value.trim();
    const payload = pubPayload.value.trim() || `Payload #${msgCounter + 1}`;
    const ttl = pubTTL.value;

    let headers = {};
    if (exchange === 'amq.headers') {
      try {
        headers = JSON.parse(pubHeaders.value);
      } catch (err) {
        headers = { format: 'pdf', type: 'invoice' };
      }
    }

    const msg = createMessage(exchange, key, payload, headers, ttl);

    if (isConnectionBlocked) {
      outboundBuffer.push(msg);
      updateOutboundBufferUI();
      logEvent(
        'nack',
        `<strong>[FLOW CONTROL]</strong> Connection blocked! Message <strong>[${msg.id}]</strong> queued in client outbound buffer.`
      );
      animateProducerPulse();
      return;
    }

    stats.published++;
    stats.recentCount++;
    updateStatsUI();

    logEvent(
      'pub',
      `Published <strong>[${msg.id}]</strong> to <em>${exchange}</em> (Key: '${key}', Priority: ${msg.priority})`
    );
    animateProducerPulse();
    emitPublisherConfirm(msg, 'basic.ack');

    // Evaluate Routing
    routeMessage(msg);
  }

  function routeMessage(msg) {
    msg.hopCount = (msg.hopCount || 0) + 1;
    if (msg.hopCount > MAX_HOP_COUNT) {
      logEvent(
        'dlq',
        `CRITICAL: Message <strong>[${msg.id}]</strong> exceeded max routing hop limit (${MAX_HOP_COUNT})! Routing cycle broken ➔ Moved to <strong>dead_letter_queue</strong>`
      );
      queues.dlq_queue.push(msg);
      stats.dlq++;
      updateStatsUI();
      renderQueueMessages('dlq_queue');
      return;
    }

    const ex = msg.exchange;
    const frames = [];
    const targetQueues = new Set();

    bindings.forEach((b, idx) => {
      if (b.exchange !== ex) return;

      let breakdown;
      let isMatch = false;

      if (ex === 'amq.direct') {
        breakdown = matchDirectWithBreakdown(msg.routingKey, b.routingKey);
        isMatch = breakdown.matched;
      } else if (ex === 'amq.topic') {
        breakdown = matchTopicWithBreakdown(b.routingKey, msg.routingKey);
        isMatch = breakdown.matched;
      } else if (ex === 'amq.fanout') {
        isMatch = true;
        breakdown = { matched: true, explanation: 'Fanout broadcasts to all bound queues' };
      } else if (ex === 'amq.headers') {
        breakdown = matchHeadersWithBreakdown(msg.headers, b.headers, b.xMatch);
        isMatch = breakdown.matched;
      } else if (ex === 'amq.dlx') {
        isMatch = true;
        breakdown = { matched: true, explanation: 'Dead Letter Exchange routes to DLQ' };
      }

      if (isMatch) {
        targetQueues.add(b.queue);
      }

      frames.push({
        frameIdx: frames.length,
        msg,
        exchange: ex,
        binding: b,
        queue: b.queue,
        matched: isMatch,
        matchType: ex,
        breakdown,
        description: `Evaluating binding #${idx + 1}: ${ex} ➔ ${b.queue} (${b.routingKey || 'all'}) -> ${isMatch ? 'MATCH' : 'NO MATCH'}`,
      });
    });

    debugFrames = frames;
    const hasBreakpoint = exchangeBreakpoints.has(ex);

    if (hasBreakpoint && frames.length > 0) {
      isDebugPaused = true;
      currentFrameIdx = 0;
      renderDebugFrame(currentFrameIdx);
      logEvent(
        'nack',
        `<strong>DEBUGGER PAUSED</strong>: Breakpoint hit on exchange <em>${ex}</em>. Stepping frame 1/${frames.length}`
      );
    } else {
      currentFrameIdx = frames.length > 0 ? frames.length - 1 : -1;
      updateDebuggerUIState();
    }

    const exNode = document.querySelector(`.exchange-node[data-exchange="${ex}"]`);
    if (exNode) {
      exNode.classList.add('active');
      setTimeout(() => exNode.classList.remove('active'), 500);
    }

    if (targetQueues.size === 0) {
      logEvent(
        'nack',
        `Message <strong>[${msg.id}]</strong> unrouted (No matching queue bindings for exchange ${ex})`
      );
      return;
    }

    targetQueues.forEach((qName) => {
      const policy = queuePolicies[qName] || { xMaxLength: 0, overflowPolicy: 'drop-head' };

      if (policy.xMaxLength > 0 && queues[qName].length >= policy.xMaxLength) {
        if (policy.overflowPolicy === 'reject-publish') {
          logEvent(
            'nack',
            `OVERFLOW REJECT: Queue <strong>${qName}</strong> is FULL (${queues[qName].length}/${policy.xMaxLength}). Message [${msg.id}] REJECTED!`
          );
          return;
        } else {
          // drop-head: drop oldest message
          const droppedMsg = queues[qName].shift();
          logEvent(
            'dlq',
            `OVERFLOW DROP-HEAD: Queue <strong>${qName}</strong> max-length (${policy.xMaxLength}) reached. Dropped oldest msg [${droppedMsg.id}]`
          );
        }
      }

      const msgClone = JSON.parse(JSON.stringify(msg));
      msgClone.history.push(`Routed to ${qName}`);
      queues[qName].push(msgClone);
      sortQueueByPriority(qName);
      renderQueueMessages(qName);
      animatePacketFlow(ex, qName);
      logEvent(
        'sys',
        `Routed <strong>[${msg.id}]</strong> (P${msg.priority}) ➔ Queue <strong>${qName}</strong>`
      );
    });
  }

  // ── Queue UI Renderer ──
  function renderQueueMessages(qName) {
    const container = document.getElementById(`container-${qName.replace('_queue', '')}`);
    const countBadge = document.getElementById(`count-${qName.replace('_queue', '')}`);
    const fillBar = document.getElementById(`fill-${qName.replace('_queue', '')}`);

    if (!container || !countBadge || !fillBar) return;

    const qList = queues[qName];
    countBadge.textContent = qList.length;
    fillBar.style.width = `${Math.min(qList.length * 10, 100)}%`;

    container.innerHTML = '';
    qList.forEach((msg) => {
      const pill = document.createElement('div');
      pill.className = `msg-pill ${selectedMsgId === msg.id ? 'selected' : ''}`;
      pill.setAttribute('data-id', msg.id);

      let retryTag =
        msg.retries > 0
          ? `<span class="retry-badge" title="Retry attempts">${msg.retries}</span>`
          : '';

      let prioTag = '';
      if (msg.priority && msg.priority > 0) {
        const pClass =
          msg.priority >= 8 ? 'p-badge-high' : msg.priority >= 4 ? 'p-badge-mid' : 'p-badge-low';
        prioTag = `<span class="${pClass}" title="Priority ${msg.priority}">P${msg.priority}</span>`;
      }

      pill.innerHTML = `<i class="fas fa-envelope"></i> ${msg.id} ${prioTag} ${retryTag}`;

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        inspectMessage(qName, msg.id);
      });

      container.appendChild(pill);
    });
  }

  function renderAllQueues() {
    Object.keys(queues).forEach((qName) => renderQueueMessages(qName));
  }

  // ── Consumer Engine ──
  function renderConsumers() {
    consumersContainer.innerHTML = '';
    consumers.forEach((c) => {
      const card = document.createElement('div');
      card.className = `consumer-node ${c.state}`;
      card.innerHTML = `
                <div class="c-head">
                    <span><i class="fas fa-robot"></i> ${c.name}</span>
                    <button type="button" class="btn-remove-bind" data-cid="${c.id}"><i class="fas fa-times"></i></button>
                </div>
                <div class="c-status">Bound to: <strong>${c.queueId}</strong></div>
            `;
      consumersContainer.appendChild(card);
    });

    consumersContainer.querySelectorAll('.btn-remove-bind').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cid = e.currentTarget.getAttribute('data-cid');
        consumers = consumers.filter((c) => c.id !== cid);
        renderConsumers();
        drawConnectionLines();
      });
    });
  }

  function spawnConsumer() {
    const queueNames = ['orders_queue', 'logs_queue', 'notifications_queue'];
    const q = queueNames[consumers.length % queueNames.length];
    const newC = {
      id: `c_${Date.now()}`,
      queueId: q,
      name: `Worker ${String.fromCharCode(65 + consumers.length)}`,
      state: 'idle',
    };
    consumers.push(newC);
    renderConsumers();
    drawConnectionLines();
    logEvent(
      'sys',
      `Spawned consumer <strong>${newC.name}</strong> listening on <strong>${q}</strong>`
    );
  }

  function consumeStep() {
    if (!isRunning || !autoConsume) return;

    consumers.forEach((c) => {
      const qList = queues[c.queueId];
      if (!qList || qList.length === 0) return;

      // Dequeue message (FIFO)
      const msg = qList.shift();
      renderQueueMessages(c.queueId);

      if (simulateFailures) {
        c.state = 'failing';
        renderConsumers();
        setTimeout(() => {
          c.state = 'idle';
          renderConsumers();
        }, 800);

        if (msg.retries < MAX_RETRIES) {
          msg.retries++;
          msg.history.push(`Failed on ${c.name}. Attempt ${msg.retries} sent to retry_queue`);
          queues.retry_queue.push(msg);
          stats.retried++;
          updateStatsUI();
          renderQueueMessages('retry_queue');
          logEvent(
            'nack',
            `Worker <strong>${c.name}</strong> failed processing <strong>[${msg.id}]</strong>. Pushed to <em>retry_queue</em> (Retry ${msg.retries}/${MAX_RETRIES})`
          );

          // Schedule TTL retry timer
          const timerId = setTimeout(() => {
            activeRetryTimers = activeRetryTimers.filter((id) => id !== timerId);
            const idx = queues.retry_queue.findIndex((m) => m.id === msg.id);
            if (idx !== -1) {
              const retryMsg = queues.retry_queue.splice(idx, 1)[0];
              renderQueueMessages('retry_queue');
              queues[c.queueId].push(retryMsg);
              renderQueueMessages(c.queueId);
              logEvent(
                'sys',
                `TTL expired for <strong>[${msg.id}]</strong> in <em>retry_queue</em> ➔ Requeued to <strong>${c.queueId}</strong>`
              );
            }
          }, 3000 / simSpeed);
          activeRetryTimers.push(timerId);
        } else {
          // Exceeded max retries -> DLQ
          msg.history.push(`Exceeded ${MAX_RETRIES} retries. Sent to amq.dlx -> dlq_queue`);
          queues.dlq_queue.push(msg);
          stats.dlq++;
          updateStatsUI();
          renderQueueMessages('dlq_queue');
          logEvent(
            'dlq',
            `CRITICAL: Message <strong>[${msg.id}]</strong> exceeded max retries (${MAX_RETRIES})! Moved to <strong>dead_letter_queue</strong>`
          );
        }
      } else {
        // Success Ack
        c.state = 'working';
        renderConsumers();
        setTimeout(() => {
          c.state = 'idle';
          renderConsumers();
        }, 600);

        stats.acked++;
        updateStatsUI();
        logEvent(
          'ack',
          `Worker <strong>${c.name}</strong> ACKED message <strong>[${msg.id}]</strong>`
        );
      }
    });
  }

  // ── Inspector Handlers ──
  function inspectMessage(qName, msgId) {
    selectedMsgId = msgId;
    const msg = queues[qName].find((m) => m.id === msgId);
    if (!msg) return;

    renderAllQueues();

    inspectMsgId.textContent = msg.id;
    inspectorContent.innerHTML = `
            <div><strong>Queue:</strong> ${qName}</div>
            <div><strong>Exchange:</strong> ${msg.exchange}</div>
            <div><strong>Routing Key:</strong> '${msg.routingKey}'</div>
            <div><strong>Retries:</strong> ${msg.retries} / ${MAX_RETRIES}</div>
            <div><strong>Payload:</strong> "${msg.payload}"</div>
            <div class="mt-2"><strong>Headers:</strong></div>
            <pre style="background: #091120; padding: 0.4rem; border-radius: 4px; overflow-x: auto;">${JSON.stringify(msg.headers, null, 2)}</pre>
            <div><strong>Trace History:</strong></div>
            <ul style="padding-left: 1.2rem; margin: 0.3rem 0;">
                ${msg.history.map((h) => `<li>${h}</li>`).join('')}
            </ul>
        `;
    inspectorActions.classList.remove('hidden');

    btnManualAck.onclick = () => {
      const idx = queues[qName].findIndex((m) => m.id === msgId);
      if (idx !== -1) {
        queues[qName].splice(idx, 1);
        stats.acked++;
        updateStatsUI();
        renderQueueMessages(qName);
        logEvent('ack', `Manual ACK triggered on <strong>[${msgId}]</strong>`);
        clearInspector();
      }
    };

    btnManualNack.onclick = () => {
      const idx = queues[qName].findIndex((m) => m.id === msgId);
      if (idx !== -1) {
        const [m] = queues[qName].splice(idx, 1);
        m.retries++;
        queues.retry_queue.push(m);
        stats.retried++;
        updateStatsUI();
        renderQueueMessages(qName);
        renderQueueMessages('retry_queue');
        logEvent(
          'nack',
          `Manual NACK triggered on <strong>[${msgId}]</strong> ➔ Moved to retry_queue`
        );
        clearInspector();
      }
    };

    btnManualReject.onclick = () => {
      const idx = queues[qName].findIndex((m) => m.id === msgId);
      if (idx !== -1) {
        const [m] = queues[qName].splice(idx, 1);
        queues.dlq_queue.push(m);
        stats.dlq++;
        updateStatsUI();
        renderQueueMessages(qName);
        renderQueueMessages('dlq_queue');
        logEvent(
          'dlq',
          `Manual REJECT triggered on <strong>[${msgId}]</strong> ➔ Moved to dead_letter_queue`
        );
        clearInspector();
      }
    };
  }

  function clearInspector() {
    selectedMsgId = null;
    inspectMsgId.textContent = 'None';
    inspectorContent.innerHTML = `<p class="placeholder-text">Click on any message pill in a queue to inspect payload, headers, routing history, and trigger manual ACK/NACK/REJECT.</p>`;
    inspectorActions.classList.add('hidden');
  }

  // ── Telemetry & Stats UI ──
  function updateStatsUI() {
    metricPublished.textContent = stats.published;
    metricAcked.textContent = stats.acked;
    metricRetried.textContent = stats.retried;
    metricDLQ.textContent = stats.dlq;
  }

  setInterval(() => {
    const rate = stats.recentCount;
    stats.recentCount = 0;
    rateVal.textContent = `${rate.toFixed(1)} msg/s`;
    rateFill.style.width = `${Math.min(rate * 20, 100)}%`;
  }, 1000);

  // ── SVG Canvas Connection Line Drawing ──
  function drawConnectionLines() {
    flowSvgLayer.innerHTML = '';

    const producerEl = document.getElementById('producerNode');
    if (!producerEl) return;

    const producerRect = producerEl.getBoundingClientRect();
    const stageRect = document.getElementById('topologyStage').getBoundingClientRect();

    const pX = producerRect.right - stageRect.left;
    const pY = producerRect.top + producerRect.height / 2 - stageRect.top;

    // Producer to Exchanges
    document.querySelectorAll('.exchange-node').forEach((exEl) => {
      const exRect = exEl.getBoundingClientRect();
      const exX = exRect.left - stageRect.left;
      const exY = exRect.top + exRect.height / 2 - stageRect.top;

      drawSvgPath(pX, pY, exX, exY, 'rgba(255, 102, 0, 0.25)');
    });

    // Exchanges to Queues based on bindings
    bindings.forEach((b) => {
      const exEl = document.querySelector(`.exchange-node[data-exchange="${b.exchange}"]`);
      const qEl = document.querySelector(`.queue-node[data-queue="${b.queue}"]`);

      if (exEl && qEl) {
        const exRect = exEl.getBoundingClientRect();
        const qRect = qEl.getBoundingClientRect();

        const x1 = exRect.right - stageRect.left;
        const y1 = exRect.top + exRect.height / 2 - stageRect.top;
        const x2 = qRect.left - stageRect.left;
        const y2 = qRect.top + qRect.height / 2 - stageRect.top;

        drawSvgPath(x1, y1, x2, y2, 'rgba(6, 182, 212, 0.3)');
      }
    });

    // Queues to Consumers
    consumers.forEach((c) => {
      const qEl = document.querySelector(`.queue-node[data-queue="${c.queueId}"]`);
      const cEl = document.querySelectorAll('.consumer-node')[consumers.indexOf(c)];

      if (qEl && cEl) {
        const qRect = qEl.getBoundingClientRect();
        const cRect = cEl.getBoundingClientRect();

        const x1 = qRect.right - stageRect.left;
        const y1 = qRect.top + qRect.height / 2 - stageRect.top;
        const x2 = cRect.left - stageRect.left;
        const y2 = cRect.top + cRect.height / 2 - stageRect.top;

        drawSvgPath(x1, y1, x2, y2, 'rgba(16, 185, 129, 0.3)');
      }
    });
  }

  function drawSvgPath(x1, y1, x2, y2, color) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const dx = (x2 - x1) * 0.5;
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    flowSvgLayer.appendChild(path);
  }

  function animatePacketFlow(exchangeId, queueId) {
    const exEl = document.querySelector(`.exchange-node[data-exchange="${exchangeId}"]`);
    const qEl = document.querySelector(`.queue-node[data-queue="${queueId}"]`);

    if (!exEl || !qEl) return;

    const stageRect = document.getElementById('topologyStage').getBoundingClientRect();
    const exRect = exEl.getBoundingClientRect();
    const qRect = qEl.getBoundingClientRect();

    const x1 = exRect.right - stageRect.left;
    const y1 = exRect.top + exRect.height / 2 - stageRect.top;
    const x2 = qRect.left - stageRect.left;
    const y2 = qRect.top + qRect.height / 2 - stageRect.top;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x1);
    circle.setAttribute('cy', y1);
    circle.setAttribute('r', '6');
    circle.setAttribute('class', 'animated-packet');
    flowSvgLayer.appendChild(circle);

    const duration = 600 / simSpeed;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const dx = (x2 - x1) * 0.5;
      // Cubic bezier formula
      const t = progress;
      const cx1 = x1 + dx;
      const cy1 = y1;
      const cx2 = x2 - dx;
      const cy2 = y2;

      const currX =
        Math.pow(1 - t, 3) * x1 +
        3 * Math.pow(1 - t, 2) * t * cx1 +
        3 * (1 - t) * Math.pow(t, 2) * cx2 +
        Math.pow(t, 3) * x2;
      const currY =
        Math.pow(1 - t, 3) * y1 +
        3 * Math.pow(1 - t, 2) * t * cy1 +
        3 * (1 - t) * Math.pow(t, 2) * cy2 +
        Math.pow(t, 3) * y2;

      circle.setAttribute('cx', currX);
      circle.setAttribute('cy', currY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        flowSvgLayer.removeChild(circle);
      }
    }

    requestAnimationFrame(animate);
  }

  function animateProducerPulse() {
    const pulse = document.getElementById('producerPulse');
    if (!pulse) return;
    pulse.textContent = 'Publishing...';
    pulse.style.background = 'rgba(255, 102, 0, 0.3)';
    setTimeout(() => {
      pulse.textContent = 'Ready';
      pulse.style.background = 'rgba(16, 185, 129, 0.1)';
    }, 500);
  }

  // ── Scenario Presets Engine ──
  function loadPresetScenario(scenarioKey) {
    clearAllRetryTimers();
    // Reset Queues
    Object.keys(queues).forEach((k) => (queues[k] = []));
    renderAllQueues();
    clearInspector();

    if (scenarioKey === 'direct') {
      pubExchange.value = 'amq.direct';
      pubExchange.dispatchEvent(new Event('change'));
      pubRoutingKey.value = 'orders.created';
      pubPayload.value = 'New Order #9910 - $240.00';
      logEvent('sys', 'Loaded Scenario: <strong>Direct Exchange Exact Match</strong>');
    } else if (scenarioKey === 'topic') {
      pubExchange.value = 'amq.topic';
      pubExchange.dispatchEvent(new Event('change'));
      pubRoutingKey.value = 'logs.europe.error';
      pubPayload.value = 'CRITICAL: EU Region DB Connection Timeout';
      logEvent(
        'sys',
        'Loaded Scenario: <strong>Topic Exchange Wildcard Routing (* and #)</strong>'
      );
    } else if (scenarioKey === 'fanout') {
      pubExchange.value = 'amq.fanout';
      pubExchange.dispatchEvent(new Event('change'));
      pubPayload.value = 'GLOBAL NOTICE: Scheduled Platform Upgrade';
      logEvent('sys', 'Loaded Scenario: <strong>Fanout Broadcast Exchange</strong>');
    } else if (scenarioKey === 'headers') {
      pubExchange.value = 'amq.headers';
      pubExchange.dispatchEvent(new Event('change'));
      pubHeaders.value = '{"format":"pdf", "type":"invoice"}';
      pubPayload.value = 'Invoice_#8841.pdf';
      logEvent('sys', 'Loaded Scenario: <strong>Headers Exchange Attribute Matching</strong>');
    } else if (scenarioKey === 'dlq') {
      pubExchange.value = 'amq.direct';
      pubExchange.dispatchEvent(new Event('change'));
      pubRoutingKey.value = 'orders.created';
      pubPayload.value = 'Corrupted Order #7701';
      chkSimulateFailures.checked = true;
      simulateFailures = true;
      logEvent(
        'sys',
        'Loaded Scenario: <strong>Retry Backoff & Dead Letter Queue (DLQ) Recovery</strong>'
      );
    }
  }

  btnLoadPreset.addEventListener('click', () => {
    loadPresetScenario(scenarioPreset.value);
  });

  // ── Controls & Event Listeners ──
  btnPublishMsg.addEventListener('click', () => publishMessage());

  btnBurstStream.addEventListener('click', () => {
    let count = 0;
    const interval = setInterval(() => {
      publishMessage();
      count++;
      if (count >= 5) clearInterval(interval);
    }, 250 / simSpeed);
  });

  btnPlayPauseSim.addEventListener('click', () => {
    isRunning = !isRunning;
    lblPlayPause.textContent = isRunning ? 'Pause' : 'Resume';
    btnPlayPauseSim.querySelector('i').className = isRunning ? 'fas fa-pause' : 'fas fa-play';
    logEvent('sys', isRunning ? 'Simulation Resumed' : 'Simulation Paused');
  });

  btnStepSim.addEventListener('click', () => {
    consumeStep();
  });

  btnResetSim.addEventListener('click', () => {
    clearAllRetryTimers();
    Object.keys(queues).forEach((k) => (queues[k] = []));
    renderAllQueues();
    stats.published = 0;
    stats.acked = 0;
    stats.retried = 0;
    stats.dlq = 0;
    stats.recentCount = 0;
    updateStatsUI();
    clearInspector();
    logEvent('sys', 'Engine Reset: All queues and stats cleared.');
  });

  simSpeedInput.addEventListener('input', () => {
    simSpeed = parseFloat(simSpeedInput.value) * 0.5 + 0.5;
    speedVal.textContent = `${simSpeed.toFixed(1)}x`;
  });

  chkAutoConsume.addEventListener('change', () => {
    autoConsume = chkAutoConsume.checked;
  });

  chkSimulateFailures.addEventListener('change', () => {
    simulateFailures = chkSimulateFailures.checked;
  });

  btnClearLogs.addEventListener('click', () => {
    logConsole.innerHTML =
      '<div class="log-line sys"><span class="timestamp">[00:00:00]</span> Log cleared.</div>';
  });

  btnAddConsumer.addEventListener('click', () => spawnConsumer());

  // ── Debugger Event Listeners ──
  if (btnStepForward) btnStepForward.addEventListener('click', () => stepForwardFrame());
  if (btnStepBack) btnStepBack.addEventListener('click', () => stepBackwardFrame());
  if (btnOpenMatcherModal) btnOpenMatcherModal.addEventListener('click', () => openMatcherModal());
  if (btnCloseMatcherModal)
    btnCloseMatcherModal.addEventListener('click', () => closeMatcherModal());
  if (btnTestPatternMatch)
    btnTestPatternMatch.addEventListener('click', () => runInspectorEvaluation());
  if (inspectorExchangeType)
    inspectorExchangeType.addEventListener('change', () => runInspectorEvaluation());
  if (brokerPressureSlider) {
    brokerPressureSlider.addEventListener('input', () => {
      updateWatermarkPressure(brokerPressureSlider.value);
    });
  }

  // Main Engine Tick Loop (re-reads simSpeed each tick)
  function scheduleTick() {
    consumeStep();
    setTimeout(scheduleTick, 1200 / simSpeed);
  }
  scheduleTick();

  window.addEventListener('resize', () => {
    drawConnectionLines();
  });

  // ── Initialization ──
  initDefaultBindings();
  initDefaultConsumers();
  renderBindingsList();
  renderConsumers();
  renderAllQueues();
  setupBreakpointHandlers();
  setupShovelHandlers();
  renderClusterNodesUI();
  renderQueueHATags();
  setupClusterNodeHandlers();
  renderQueuePolicyTags();
  setupQueueConfigHandlers();
  setTimeout(drawConnectionLines, 300);

  logEvent('sys', 'RabbitMQ Messaging Engine Ready.');
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    matchTopic: function (pattern, key) {
      if (pattern === '#') return true;
      if (!pattern || !key) return pattern === key;
      const p = pattern.split('.');
      const k = key.split('.');
      function mh(pi, ki) {
        if (pi === p.length && ki === k.length) return true;
        if (pi === p.length) return false;
        if (p[pi] === '#') {
          if (mh(pi + 1, ki)) return true;
          if (ki < k.length && mh(pi, ki + 1)) return true;
          return false;
        }
        if (ki === k.length) return false;
        if (p[pi] === '*' || p[pi] === k[ki]) return mh(pi + 1, ki + 1);
        return false;
      }
      return mh(0, 0);
    },
    matchTopicWithBreakdown: function (pattern, key) {
      const keyTokens = key ? key.split('.') : [];
      const patternTokens = pattern ? pattern.split('.') : [];
      const steps = [];
      if (pattern === '#') {
        steps.push({
          step: 1,
          keyToken: key || '(empty)',
          patternToken: '#',
          rule: 'multi_wildcard',
          matched: true,
          explanation: 'Wildcard "#" matches entire key',
        });
        return { matched: true, keyTokens, patternTokens, steps };
      }
      if (!pattern || !key) {
        const isMatch = pattern === key;
        steps.push({
          step: 1,
          keyToken: key || '(empty)',
          patternToken: pattern || '(empty)',
          rule: isMatch ? 'exact' : 'mismatch',
          matched: isMatch,
          explanation: isMatch ? 'Exact empty string match' : 'Pattern or key missing',
        });
        return { matched: isMatch, keyTokens, patternTokens, steps };
      }
      let stepNum = 0;
      function mh(pi, ki) {
        stepNum++;
        const currentStep = stepNum;
        const pToken = pi < patternTokens.length ? patternTokens[pi] : null;
        const kToken = ki < keyTokens.length ? keyTokens[ki] : null;

        if (pi === patternTokens.length && ki === keyTokens.length) {
          steps.push({
            step: currentStep,
            keyToken: '(end)',
            patternToken: '(end)',
            rule: 'exact',
            matched: true,
            explanation: 'End of pattern and key reached successfully',
          });
          return true;
        }
        if (pi === patternTokens.length) {
          steps.push({
            step: currentStep,
            keyToken: kToken,
            patternToken: '(end)',
            rule: 'length_mismatch',
            matched: false,
            explanation: `Key has remaining token "${kToken}" but pattern ended`,
          });
          return false;
        }
        if (pToken === '#') {
          if (mh(pi + 1, ki)) {
            steps.push({
              step: currentStep,
              keyToken: kToken || '(none)',
              patternToken: '#',
              rule: 'multi_wildcard',
              matched: true,
              explanation: `Wildcard "#" matched 0 words (skipped "#")`,
            });
            return true;
          }
          if (ki < keyTokens.length && mh(pi, ki + 1)) {
            steps.push({
              step: currentStep,
              keyToken: kToken,
              patternToken: '#',
              rule: 'multi_wildcard',
              matched: true,
              explanation: `Wildcard "#" consumed token "${kToken}"`,
            });
            return true;
          }
          steps.push({
            step: currentStep,
            keyToken: kToken || '(none)',
            patternToken: '#',
            rule: 'multi_wildcard',
            matched: false,
            explanation: `Wildcard "#" failed to match remaining sequence`,
          });
          return false;
        }
        if (ki === keyTokens.length) {
          steps.push({
            step: currentStep,
            keyToken: '(end)',
            patternToken: pToken,
            rule: 'length_mismatch',
            matched: false,
            explanation: `Pattern token "${pToken}" remaining but key ended`,
          });
          return false;
        }
        if (pToken === '*' || pToken === kToken) {
          const isStar = pToken === '*';
          const res = mh(pi + 1, ki + 1);
          steps.push({
            step: currentStep,
            keyToken: kToken,
            patternToken: pToken,
            rule: isStar ? 'single_wildcard' : 'exact',
            matched: res,
            explanation: isStar
              ? `Wildcard "*" matched token "${kToken}"`
              : `Exact token match "${kToken}" === "${pToken}"`,
          });
          return res;
        }
        steps.push({
          step: currentStep,
          keyToken: kToken,
          patternToken: pToken,
          rule: 'mismatch',
          matched: false,
          explanation: `Token mismatch: "${kToken}" !== "${pToken}"`,
        });
        return false;
      }
      const isMatched = mh(0, 0);
      steps.sort((a, b) => a.step - b.step);
      const uniqueSteps = [];
      const seen = new Set();
      for (const s of steps) {
        const id = `${s.step}-${s.keyToken}-${s.patternToken}-${s.matched}`;
        if (!seen.has(id)) {
          seen.add(id);
          uniqueSteps.push(s);
        }
      }
      return { matched: isMatched, keyTokens, patternTokens, steps: uniqueSteps };
    },
    matchHeadersWithBreakdown: function (msgHeaders, bindingHeaders, xMatch) {
      msgHeaders = msgHeaders || {};
      bindingHeaders = bindingHeaders || {};
      const keys = Object.keys(bindingHeaders);
      const comparisons = keys.map((k) => {
        const expected = bindingHeaders[k];
        const actual = msgHeaders[k];
        const matched = msgHeaders[k] === bindingHeaders[k];
        return { key: k, expected, actual, matched };
      });
      const isAny = xMatch === 'any';
      const matched =
        keys.length > 0 &&
        (isAny ? comparisons.some((c) => c.matched) : comparisons.every((c) => c.matched));
      return { matched, xMatch: isAny ? 'any' : 'all', comparisons };
    },
    matchDirectWithBreakdown: function (msgKey, bindingKey) {
      const matched = msgKey === bindingKey;
      return {
        matched,
        msgKey,
        bindingKey,
        explanation: matched
          ? `Exact key match "${msgKey}" === "${bindingKey}"`
          : `Key mismatch "${msgKey}" !== "${bindingKey}"`,
      };
    },
  };
}
