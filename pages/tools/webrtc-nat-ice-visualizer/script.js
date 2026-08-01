/* Real-Time WebRTC NAT Traversal & ICE Candidate Gathering Logic */

document.addEventListener('DOMContentLoaded', () => {
  const peerANatSelect = document.getElementById('peerANatSelect');
  const peerBNatSelect = document.getElementById('peerBNatSelect');
  const btnStartGathering = document.getElementById('btnStartGathering');
  const btnResetWebRtc = document.getElementById('btnResetWebRtc');

  const sdpViewer = document.getElementById('sdpViewer');
  const iceCandidateTableBody = document.getElementById('iceCandidateTableBody');
  const webrtcLogBox = document.getElementById('webrtcLogBox');
  const webrtcConnState = document.getElementById('webrtcConnState');

  function logDiagnostic(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    webrtcLogBox.appendChild(div);
    webrtcLogBox.scrollTop = webrtcLogBox.scrollHeight;
  }

  function generateCandidates(natA, natB) {
    iceCandidateTableBody.innerHTML = '';
    sdpViewer.value = '';

    logDiagnostic('Creating RTCPeerConnection instance...', 'info');
    logDiagnostic(`Peer A NAT Config: ${natA} | Peer B NAT Config: ${natB}`, 'info');

    // Candidate List
    const candidates = [
      { type: 'host', proto: 'UDP', ip: '192.168.1.10:54321', priority: '2122260223', status: 'SUCCEEDED' },
      { type: 'srflx (STUN)', proto: 'UDP', ip: '203.0.113.5:61001', priority: '1686052863', status: natA === 'SYMMETRIC' ? 'FAILED' : 'SUCCEEDED' },
      { type: 'relay (TURN)', proto: 'UDP', ip: 'turn.matrix.org:3478', priority: '41819903', status: 'SUCCEEDED' }
    ];

    let sdpOutput = `v=0\r\no=- 482910481 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=ice-ufrag:x7a9\r\na=ice-pwd:K9z8qL2m\r\n`;

    candidates.forEach(c => {
      sdpOutput += `a=candidate:1 1 ${c.proto} ${c.priority} ${c.ip.split(':')[0]} ${c.ip.split(':')[1]} typ ${c.type}\r\n`;

      const tr = document.createElement('tr');
      const badgeClass = c.status === 'SUCCEEDED' ? 'status-success' : 'status-failed';
      tr.innerHTML = `
        <td><strong>${c.type}</strong></td>
        <td>${c.proto}</td>
        <td>${c.ip}</td>
        <td>${c.priority}</td>
        <td><span class="status-badge ${badgeClass}">${c.status}</span></td>
      `;
      iceCandidateTableBody.appendChild(tr);
    });

    sdpViewer.value = sdpOutput;

    if (natA === 'SYMMETRIC' && natB === 'SYMMETRIC') {
      logDiagnostic('[WARN] Direct P2P via STUN failed (Symmetric NAT both sides). Falling back to TURN Relay allocation...', 'warn');
      logDiagnostic('[CONNECTED] WebRTC Connected via TURN Relay Server (P2P Direct Blocked)', 'success');
      webrtcConnState.textContent = 'CONNECTED (TURN RELAY)';
      webrtcConnState.style.color = '#f59e0b';
    } else {
      logDiagnostic('[SUCCESS] ICE Connectivity checks succeeded for srflx pair.', 'success');
      logDiagnostic('[CONNECTED] Direct Peer-to-Peer DataChannel established!', 'success');
      webrtcConnState.textContent = 'CONNECTED (P2P DIRECT)';
      webrtcConnState.style.color = '#10b981';
    }
  }

  btnStartGathering.addEventListener('click', () => {
    generateCandidates(peerANatSelect.value, peerBNatSelect.value);
  });

  btnResetWebRtc.addEventListener('click', () => {
    iceCandidateTableBody.innerHTML = '';
    sdpViewer.value = '';
    webrtcLogBox.innerHTML = '<div class="log-line info">[INIT] Reset WebRTC State.</div>';
    webrtcConnState.textContent = 'DISCONNECTED';
    webrtcConnState.style.color = '#94a3b8';
  });
});
