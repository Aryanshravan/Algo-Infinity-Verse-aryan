/* ============================================================
   BGP Autonomous System Routing & Route Hijack Simulator JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // DOM ELEMENTS
  const canvas = document.getElementById('bgpCanvas');
  const ctx = canvas.getContext('2d');
  const consoleEl = document.getElementById('bgpConsole');
  const tabBtns = document.querySelectorAll('.bgp-tab-btn');
  const tabContents = document.querySelectorAll('.bgp-tab-content');
  const presetBtns = document.querySelectorAll('.bgp-btn-preset');
  const rpkiToggle = document.getElementById('rpkiToggleCheck');
  const ribTableBody = document.getElementById('ribTableBody');
  const ribFilter = document.getElementById('ribAsnFilter');
  const decisionAsnSelect = document.getElementById('decisionAsnSelect');
  const decisionTreeContainer = document.getElementById('decisionTreeContainer');

  // STATE DATA
  let rpkiEnabled = false;
  let activePackets = [];
  let animationFrameId = null;
  let selectedAsn = 'AS7922';

  // AS TOPOLOGY NODE DEFINITIONS
  const nodes = {
    'AS15169': { id: 'AS15169', name: 'Google (Origin)', type: 'eyeball', x: 0.2, y: 0.3, color: '#10b981', owner: 'Legitimate' },
    'AS701':   { id: 'AS701',   name: 'Verizon Business', type: 'tier1',   x: 0.4, y: 0.2, color: '#3b82f6', owner: 'Tier-1 ISP' },
    'AS3356':  { id: 'AS3356',  name: 'L3 Global Transit', type: 'tier1',   x: 0.6, y: 0.2, color: '#3b82f6', owner: 'Tier-1 ISP' },
    'AS1299':  { id: 'AS1299',  name: 'Telia Regional',  type: 'tier2',   x: 0.4, y: 0.6, color: '#8b5cf6', owner: 'Transit' },
    'AS7922':  { id: 'AS7922',  name: 'Comcast Eyeball', type: 'eyeball', x: 0.7, y: 0.6, color: '#10b981', owner: 'Eyeball' },
    'AS666':   { id: 'AS666',   name: 'Rogue AS',        type: 'rogue',   x: 0.8, y: 0.3, color: '#ef4444', owner: 'Attacker' }
  };

  const links = [
    { from: 'AS15169', to: 'AS701' },
    { from: 'AS15169', to: 'AS1299' },
    { from: 'AS701', to: 'AS3356' },
    { from: 'AS1299', to: 'AS3356' },
    { from: 'AS1299', to: 'AS7922' },
    { from: 'AS3356', to: 'AS7922' },
    { from: 'AS666', to: 'AS3356' },
    { from: 'AS666', to: 'AS7922' }
  ];

  // ROA DATABASE
  const roaDatabase = [
    { prefix: '203.0.113.0/24', maxLen: 24, asn: 'AS15169', trustAnchor: 'ARIN RPKI TA' }
  ];

  // ACTIVE ANNOUNCEMENTS
  let announcements = [
    { prefix: '203.0.113.0/24', origin: 'AS15169', locPref: 100, med: 0, path: ['AS15169'] }
  ];

  // BGP RIB (Routing Information Base) STORE FOR EACH ASN
  let ribStore = {};

  // INITIALIZATION
  function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupEventListeners();
    recalculateRouting();
    startAnimationLoop();
    log('BGP Autonomous System Routing Simulator initialized.', 'info');
  }

  function resizeCanvas() {
    const wrapper = document.getElementById('canvasWrapper');
    if (!wrapper) return;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
  }

  // EVENT LISTENERS
  function setupEventListeners() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadPreset(btn.dataset.preset);
      });
    });

    rpkiToggle.addEventListener('change', (e) => {
      rpkiEnabled = e.target.checked;
      log(`RPKI Route Origin Validation (ROV) is now ${rpkiEnabled ? 'ENABLED (Dropping INVALID announcements)' : 'DISABLED'}`, rpkiEnabled ? 'success' : 'warning');
      recalculateRouting();
    });

    document.getElementById('announcementForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const origin = document.getElementById('advOriginAsn').value;
      const prefix = document.getElementById('advPrefix').value.trim();
      const locPref = parseInt(document.getElementById('advLocalPref').value) || 100;
      const med = parseInt(document.getElementById('advMed').value) || 0;

      announcements.push({ prefix, origin, locPref, med, path: [origin] });
      log(`Manual BGP Update Broadcast: Prefix ${prefix} originated by ${origin} (LocPref: ${locPref}, MED: ${med})`, 'info');
      recalculateRouting();
    });

    document.getElementById('btnLaunchAttack').addEventListener('click', () => {
      const attackType = document.getElementById('attackTypeSelect').value;
      if (attackType === 'exact') {
        announcements.push({
          prefix: '203.0.113.0/24',
          origin: 'AS666',
          locPref: 200, // Higher preference to fool routers
          med: 0,
          path: ['AS666']
        });
        log('ATTACK LAUNCHED: AS666 announcing Exact-Prefix 203.0.113.0/24 with higher Local-Preference (200)!', 'danger');
      } else {
        announcements.push({
          prefix: '203.0.113.0/25', // Sub-prefix (More specific)
          origin: 'AS666',
          locPref: 100,
          med: 0,
          path: ['AS666']
        });
        log('ATTACK LAUNCHED: AS666 announcing Sub-Prefix 203.0.113.0/25! Longest Prefix Match will hijack traffic globally.', 'danger');
      }
      recalculateRouting();
    });

    document.getElementById('btnSendTraffic').addEventListener('click', () => {
      sendTrafficPackets();
    });

    document.getElementById('btnResetTopology').addEventListener('click', () => {
      loadPreset('normal');
      log('Topology and BGP announcements reset to baseline.', 'info');
    });

    document.getElementById('btnClearLog').addEventListener('click', () => {
      consoleEl.innerHTML = '';
    });

    ribFilter.addEventListener('change', renderRibTable);
    decisionAsnSelect.addEventListener('change', (e) => {
      selectedAsn = e.target.value;
      renderDecisionTree();
    });
  }

  // PRESETS
  function loadPreset(preset) {
    announcements = [];
    if (preset === 'normal') {
      rpkiEnabled = false;
      rpkiToggle.checked = false;
      announcements = [
        { prefix: '203.0.113.0/24', origin: 'AS15169', locPref: 100, med: 0, path: ['AS15169'] }
      ];
      log('Loaded Preset: Normal Global BGP Routing.', 'info');
    } else if (preset === 'exact-hijack') {
      rpkiEnabled = false;
      rpkiToggle.checked = false;
      announcements = [
        { prefix: '203.0.113.0/24', origin: 'AS15169', locPref: 100, med: 0, path: ['AS15169'] },
        { prefix: '203.0.113.0/24', origin: 'AS666', locPref: 200, med: 0, path: ['AS666'] }
      ];
      log('Loaded Preset: Exact-Prefix BGP Route Hijack (/24).', 'warning');
    } else if (preset === 'subprefix-hijack') {
      rpkiEnabled = false;
      rpkiToggle.checked = false;
      announcements = [
        { prefix: '203.0.113.0/24', origin: 'AS15169', locPref: 100, med: 0, path: ['AS15169'] },
        { prefix: '203.0.113.0/25', origin: 'AS666', locPref: 100, med: 0, path: ['AS666'] }
      ];
      log('Loaded Preset: Sub-Prefix Hijack (/25) - Longest Prefix Match Routing.', 'warning');
    } else if (preset === 'rpki-enabled') {
      rpkiEnabled = true;
      rpkiToggle.checked = true;
      announcements = [
        { prefix: '203.0.113.0/24', origin: 'AS15169', locPref: 100, med: 0, path: ['AS15169'] },
        { prefix: '203.0.113.0/24', origin: 'AS666', locPref: 200, med: 0, path: ['AS666'] }
      ];
      log('Loaded Preset: RPKI ROV Active Defense against AS666 hijack.', 'success');
    }
    recalculateRouting();
  }

  // RPKI ROV EVALUATOR
  function validateRpki(prefix, originAsn) {
    const prefixLen = parseInt(prefix.split('/')[1] || '24');
    const roa = roaDatabase.find(r => r.prefix.split('/')[0] === prefix.split('/')[0]);
    if (!roa) return 'NOT_FOUND';
    if (originAsn === roa.asn && prefixLen <= roa.maxLen) return 'VALID';
    return 'INVALID';
  }

  // ROUTING CALCULATION ENGINE
  function recalculateRouting() {
    ribStore = {};
    Object.keys(nodes).forEach(asn => { ribStore[asn] = []; });

    // Propagate announcements using BFS path-vector logic across links
    announcements.forEach(ann => {
      const rpkiState = validateRpki(ann.prefix, ann.origin);

      if (rpkiEnabled && rpkiState === 'INVALID') {
        log(`[RPKI ROV DROP] Route ${ann.prefix} from origin ${ann.origin} dropped (State: INVALID)`, 'danger');
        return;
      }

      // BFS to build paths to all ASNs
      const queue = [{ currentAsn: ann.origin, path: [ann.origin] }];
      const visitedPaths = {};

      while (queue.length > 0) {
        const { currentAsn, path } = queue.shift();

        // Add to RIB of currentAsn
        ribStore[currentAsn].push({
          prefix: ann.prefix,
          origin: ann.origin,
          nextHop: path.length > 1 ? path[1] : 'SELF',
          locPref: ann.locPref,
          med: ann.med,
          asPath: [...path],
          rpkiState: rpkiState,
          isBest: false
        });

        // Neighbors propagation
        const neighbors = links
          .filter(l => l.from === currentAsn || l.to === currentAsn)
          .map(l => l.from === currentAsn ? l.to : l.from);

        neighbors.forEach(nbr => {
          if (!path.includes(nbr)) { // BGP Loop Prevention rule (AS-PATH check)
            const newPath = [nbr, ...path];
            const pathKey = `${nbr}-${ann.prefix}-${ann.origin}`;
            if (!visitedPaths[pathKey]) {
              visitedPaths[pathKey] = true;
              queue.push({ currentAsn: nbr, path: newPath });
            }
          }
        });
      }
    });

    // Select Best Route per Prefix for each ASN using BGP Tie-Breaking Rules
    Object.keys(ribStore).forEach(asn => {
      const routesByPrefix = {};
      ribStore[asn].forEach(route => {
        if (!routesByPrefix[route.prefix]) routesByPrefix[route.prefix] = [];
        routesByPrefix[route.prefix].push(route);
      });

      Object.keys(routesByPrefix).forEach(prefix => {
        const candidates = routesByPrefix[prefix];
        candidates.sort((a, b) => {
          // Rule 1: Highest Local Preference
          if (b.locPref !== a.locPref) return b.locPref - a.locPref;
          // Rule 2: Shortest AS-PATH
          if (a.asPath.length !== b.asPath.length) return a.asPath.length - b.asPath.length;
          // Rule 3: Lowest MED
          if (a.med !== b.med) return a.med - b.med;
          return 0;
        });

        if (candidates.length > 0) {
          candidates[0].isBest = true;
        }
      });
    });

    renderRibTable();
    renderDecisionTree();
  }

  // RENDER RIB TABLE
  function renderRibTable() {
    ribTableBody.innerHTML = '';
    const filter = ribFilter.value;

    Object.keys(ribStore).forEach(asn => {
      if (filter !== 'ALL' && filter !== asn) return;
      ribStore[asn].forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${asn}</strong></td>
          <td>${r.isBest ? '<span class="bgp-badge bgp-tier1">*&gt; (Best)</span>' : '<span class="bgp-badge">Valid</span>'}</td>
          <td><code>${r.prefix}</code></td>
          <td>${r.nextHop}</td>
          <td>${r.locPref}</td>
          <td><code>${r.asPath.join(' → ')}</code></td>
          <td><span class="bgp-badge ${r.rpkiState === 'VALID' ? 'bgp-eyeball' : r.rpkiState === 'INVALID' ? 'bgp-rogue' : ''}">${r.rpkiState}</span></td>
        `;
        ribTableBody.appendChild(tr);
      });
    });
  }

  // RENDER DECISION TREE
  function renderDecisionTree() {
    decisionTreeContainer.innerHTML = '';
    const asnRoutes = (ribStore[selectedAsn] || []).filter(r => r.prefix.startsWith('203.0.113.0'));

    if (asnRoutes.length === 0) {
      decisionTreeContainer.innerHTML = '<div class="bgp-callout bgp-callout-info">No candidate BGP routes available for this ASN.</div>';
      return;
    }

    asnRoutes.forEach((route, idx) => {
      const div = document.createElement('div');
      div.className = `bgp-rule-item ${route.isBest ? 'winner' : ''}`;
      div.innerHTML = `
        <div>
          <strong>Candidate #${idx + 1}: ${route.prefix} via ${route.origin}</strong>
          <div>AS-PATH: <code>${route.asPath.join(' → ')}</code> | LocPref: ${route.locPref} | MED: ${route.med}</div>
        </div>
        <div>
          ${route.isBest ? '<span class="bgp-badge bgp-tier1"><i class="fas fa-check"></i> SELECTED BEST</span>' : '<span class="bgp-badge">REJECTED</span>'}
        </div>
      `;
      decisionTreeContainer.appendChild(div);
    });
  }

  // ANIMATED TRAFFIC FLOW
  function sendTrafficPackets() {
    // Find best route for Eyeball AS7922 to reach prefix
    const eyeballRoutes = ribStore['AS7922'] || [];
    
    // Sort by longest prefix match first, then best flag
    eyeballRoutes.sort((a, b) => {
      const lenA = parseInt(a.prefix.split('/')[1] || '24');
      const lenB = parseInt(b.prefix.split('/')[1] || '24');
      if (lenB !== lenA) return lenB - lenA; // Longest prefix match
      return (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0);
    });

    const chosenRoute = eyeballRoutes[0];
    if (!chosenRoute) {
      log('No route available to forward traffic!', 'danger');
      return;
    }

    const path = [...chosenRoute.asPath]; // Path from origin to eyeball
    const travelPath = path.slice().reverse(); // Eyeball -> Next Hop -> Origin

    log(`[TRAFFIC FLOW] AS7922 sending packets to ${chosenRoute.prefix}. Forwarding path: ${travelPath.join(' → ')}`, 'info');

    activePackets.push({
      path: travelPath,
      step: 0,
      progress: 0,
      targetOrigin: chosenRoute.origin
    });
  }

  // CANVAS DRAWING & ANIMATION LOOP
  function startAnimationLoop() {
    function frame() {
      drawCanvas();
      updatePackets();
      animationFrameId = requestAnimationFrame(frame);
    }
    frame();
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Links
    links.forEach(link => {
      const n1 = nodes[link.from];
      const n2 = nodes[link.to];
      if (!n1 || !n2) return;

      const x1 = n1.x * canvas.width;
      const y1 = n1.y * canvas.height;
      const x2 = n2.x * canvas.width;
      const y2 = n2.y * canvas.height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw Packets
    activePackets.forEach(p => {
      if (p.step < p.path.length - 1) {
        const fromNode = nodes[p.path[p.step]];
        const toNode = nodes[p.path[p.step + 1]];
        if (fromNode && toNode) {
          const fx = fromNode.x * canvas.width;
          const fy = fromNode.y * canvas.height;
          const tx = toNode.x * canvas.width;
          const ty = toNode.y * canvas.height;

          const px = fx + (tx - fx) * p.progress;
          const py = fy + (ty - fy) * p.progress;

          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fillStyle = p.targetOrigin === 'AS666' ? '#ef4444' : '#10b981';
          ctx.fill();
          ctx.shadowColor = p.targetOrigin === 'AS666' ? '#ef4444' : '#10b981';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    });

    // Draw AS Nodes
    Object.values(nodes).forEach(n => {
      const nx = n.x * canvas.width;
      const ny = n.y * canvas.height;

      ctx.beginPath();
      ctx.arc(nx, ny, 24, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.id, nx, ny + 4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(n.name, nx, ny + 38);
    });
  }

  function updatePackets() {
    for (let i = activePackets.length - 1; i >= 0; i--) {
      const p = activePackets[i];
      p.progress += 0.02;
      if (p.progress >= 1) {
        p.progress = 0;
        p.step++;
        if (p.step >= p.path.length - 1) {
          log(`[TRAFFIC ARRIVED] Packets reached destination: ${p.path[p.path.length - 1]} (${p.targetOrigin === 'AS666' ? 'HIJACKED BY ATTACKER!' : 'LEGITIMATE ORIGIN'})`, p.targetOrigin === 'AS666' ? 'danger' : 'success');
          activePackets.splice(i, 1);
        }
      }
    }
  }

  // UTILITY LOGGING
  function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `bgp-log-entry ${type}`;
    div.textContent = `[${time}] ${msg}`;
    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  init();
});
