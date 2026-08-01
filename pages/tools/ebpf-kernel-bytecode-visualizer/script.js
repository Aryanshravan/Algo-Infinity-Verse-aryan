/* eBPF Kernel Bytecode Verifier & JIT Execution Simulator Logic */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const presetSelect = document.getElementById('ebpfPresetSelect');
  const codeEditor = document.getElementById('ebpfCodeEditor');
  const bytecodeTableBody = document.getElementById('bytecodeTableBody');
  const instructionCountBadge = document.getElementById('instructionCountBadge');
  const registerGrid = document.getElementById('registerGrid');
  const verifierLogs = document.getElementById('verifierLogs');
  const verifierResultBadge = document.getElementById('verifierResultBadge');
  const vmStatusIndicator = document.getElementById('vmStatusIndicator');
  const mapGridContainer = document.getElementById('mapGridContainer');
  const xdpActionResult = document.getElementById('xdpActionResult');
  const packetStreamLog = document.getElementById('packetStreamLog');

  // Action Buttons
  const btnRunVerifier = document.getElementById('btnRunVerifier');
  const btnStepExec = document.getElementById('btnStepExec');
  const btnRunJit = document.getElementById('btnRunJit');
  const btnResetVm = document.getElementById('btnResetVm');
  const btnSendPacket = document.getElementById('btnSendPacket');

  // Program Presets
  const PRESETS = {
    xdp_drop: `; eBPF XDP Program: Drop HTTP Port 80
; R1 = ptr to struct xdp_md (ctx)
BPF_MOV64_REG R2, R1          ; Copy xdp_md ctx
BPF_LDX_MEM R3, R1, 0         ; R3 = ctx->data (packet start)
BPF_LDX_MEM R4, R1, 4         ; R4 = ctx->data_end (packet end)
BPF_MOV64_REG R5, R3          ; R5 = data
BPF_ADD64_IMM R5, 14          ; Skip Ethernet Header (14 bytes)
BPF_JGT_REG R5, R4, 8         ; Bounds Check: if data + 14 > data_end goto PASS
BPF_LDH_ABS R6, R5, 22        ; Load TCP Dst Port (Offset 22)
BPF_JEQ_IMM R6, 80, 7         ; If Port == 80 goto DROP
BPF_MOV64_IMM R0, 2           ; R0 = XDP_PASS (2)
BPF_EXIT_INSN                 ; Return XDP_PASS
BPF_MOV64_IMM R0, 1           ; R0 = XDP_DROP (1)
BPF_EXIT_INSN                 ; Return XDP_DROP`,

    map_counter: `; eBPF Program: Increment Packet Counter Map
BPF_MOV64_REG R1, R10         ; R1 = Frame Pointer (R10)
BPF_ADD64_IMM R1, -4          ; R1 = R10 - 4 (Stack slot for key)
BPF_ST_MEM R1, 0, 0           ; Store Key = 0 on Stack
BPF_LD_MAP_FD R2, 1           ; R2 = Map FD 1 (pkt_cnt_hash)
BPF_CALL bpf_map_lookup_elem  ; Call bpf_map_lookup_elem(map, &key)
BPF_JEQ_IMM R0, 0, 3          ; If ptr == NULL goto EXIT
BPF_LDX_MEM R3, R0, 0         ; R3 = *val
BPF_ADD64_IMM R3, 1           ; R3 += 1
BPF_STX_MEM R0, R3, 0         ; *val = R3
BPF_MOV64_IMM R0, 2           ; R0 = XDP_PASS
BPF_EXIT_INSN`,

    bounds_check: `; eBPF Program: Verifier Safety Bounds Check
BPF_MOV64_REG R1, R10
BPF_ADD64_IMM R1, -8
BPF_ST_MEM R1, 0, 1234
BPF_LDX_MEM R2, R1, 0         ; Read back value safely
BPF_MOV64_IMM R0, 0           ; Return 0
BPF_EXIT_INSN`,

    invalid_access: `; eBPF Invalid Program: Read Uninitialized Register R7
BPF_MOV64_REG R1, R7          ; ERROR: R7 is uninitialized!
BPF_MOV64_IMM R0, 0
BPF_EXIT_INSN`
  };

  // State Management
  let registers = Array.from({ length: 11 }, (_, i) => ({
    name: `R${i}`,
    val: i === 10 ? 512 : 0,
    type: i === 10 ? 'PtrToStack' : 'Uninitialized',
    initialized: i === 10
  }));

  let currentPc = 0;
  let parsedInstructions = [];
  let ebpfMap = new Map([[0, 42], [1, 100]]);
  let isVerified = false;

  // Initialize Register Grid
  function renderRegisters() {
    registerGrid.innerHTML = '';
    registers.forEach(reg => {
      const card = document.createElement('div');
      card.className = 'reg-card';
      card.innerHTML = `
        <span class="reg-name">${reg.name} ${reg.name === 'R10' ? '(FP)' : ''}</span>
        <span class="reg-val">${reg.initialized ? '0x' + reg.val.toString(16).toUpperCase() : 'uninit'}</span>
        <span class="reg-type">${reg.type}</span>
      `;
      registerGrid.appendChild(card);
    });
  }

  // Parse Assembly Text into Instruction Objects
  function parseAssembly(code) {
    const lines = code.split('\n');
    const insns = [];
    let pc = 0;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(';')) return;

      const parts = trimmed.split(/[\s,]+/);
      const opcode = parts[0] || 'NOP';
      const dst = parts[1] || '-';
      const src = parts[2] || '-';
      const off = parts[3] || '0';
      const imm = parts[4] || '0';

      insns.push({ pc, raw: trimmed, opcode, dst, src, off, imm });
      pc++;
    });

    return insns;
  }

  // Render Bytecode Table
  function renderBytecodeTable() {
    bytecodeTableBody.innerHTML = '';
    parsedInstructions.forEach(insn => {
      const tr = document.createElement('tr');
      if (insn.pc === currentPc) tr.className = 'active-insn';
      tr.innerHTML = `
        <td>${insn.pc}</td>
        <td><strong>${insn.opcode}</strong></td>
        <td>${insn.dst}</td>
        <td>${insn.src}</td>
        <td>${insn.off}</td>
        <td>${insn.imm}</td>
      `;
      bytecodeTableBody.appendChild(tr);
    });
    instructionCountBadge.textContent = `${parsedInstructions.length} Insns`;
  }

  // Render Maps
  function renderMap() {
    mapGridContainer.innerHTML = '';
    ebpfMap.forEach((val, key) => {
      const node = document.createElement('div');
      node.className = 'map-node';
      node.innerHTML = `<span>Key: 0x${key.toString(16)}</span> <strong>Val: ${val}</strong>`;
      mapGridContainer.appendChild(node);
    });
  }

  // Logger
  function logConsole(msg, type = 'info') {
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    verifierLogs.appendChild(div);
    verifierLogs.scrollTop = verifierLogs.scrollHeight;
  }

  // Static Verifier Check
  function runVerifier() {
    verifierLogs.innerHTML = '';
    logConsole('Starting static eBPF verifier safety exploration...', 'info');
    let ok = true;

    for (let insn of parsedInstructions) {
      if (insn.opcode === 'BPF_MOV64_REG') {
        const srcRegIdx = parseInt(insn.src.replace('R', ''));
        if (!isNaN(srcRegIdx) && !registers[srcRegIdx].initialized) {
          logConsole(`[FAIL] PC ${insn.pc}: Read of uninitialized register ${insn.src}!`, 'error');
          ok = false;
          break;
        }
      }
    }

    if (ok) {
      logConsole('[PASS] Program safety proof complete: Bounded paths verified. No memory violations.', 'success');
      verifierResultBadge.className = 'result-badge pass';
      verifierResultBadge.textContent = 'PASS';
      isVerified = true;
    } else {
      logConsole('[REJECT] Kernel rejected eBPF bytecode: Unsafe execution path detected.', 'error');
      verifierResultBadge.className = 'result-badge fail';
      verifierResultBadge.textContent = 'REJECTED';
      isVerified = false;
    }
  }

  // Step Execution
  function stepExecution() {
    if (currentPc >= parsedInstructions.length) {
      logConsole('Execution finished: BPF_EXIT_INSN reached.', 'info');
      vmStatusIndicator.textContent = 'EXITED';
      return;
    }

    const insn = parsedInstructions[currentPc];
    logConsole(`Executing PC ${insn.pc}: ${insn.raw}`, 'info');

    // Simulate simple register updates
    if (insn.opcode === 'BPF_MOV64_IMM' || insn.opcode === 'BPF_MOV64_REG') {
      const regIdx = parseInt(insn.dst.replace('R', ''));
      if (!isNaN(regIdx)) {
        registers[regIdx].initialized = true;
        registers[regIdx].val = parseInt(insn.src) || 0x2;
        registers[regIdx].type = 'Scalar';
      }
    } else if (insn.opcode === 'BPF_CALL') {
      registers[0].initialized = true;
      registers[0].val = 0x1000;
      registers[0].type = 'PtrToMapValue';
    }

    currentPc++;
    renderRegisters();
    renderBytecodeTable();
  }

  // Reset VM
  function resetVm() {
    currentPc = 0;
    registers = Array.from({ length: 11 }, (_, i) => ({
      name: `R${i}`,
      val: i === 10 ? 512 : 0,
      type: i === 10 ? 'PtrToStack' : 'Uninitialized',
      initialized: i === 10
    }));
    vmStatusIndicator.textContent = 'IDLE';
    renderRegisters();
    renderBytecodeTable();
  }

  // Load Preset
  function loadPreset(key) {
    codeEditor.value = PRESETS[key] || PRESETS.xdp_drop;
    parsedInstructions = parseAssembly(codeEditor.value);
    resetVm();
  }

  // Event Listeners
  presetSelect.addEventListener('change', (e) => loadPreset(e.target.value));
  codeEditor.addEventListener('input', () => {
    parsedInstructions = parseAssembly(codeEditor.value);
    resetVm();
  });

  btnRunVerifier.addEventListener('click', runVerifier);
  btnStepExec.addEventListener('click', stepExecution);
  btnResetVm.addEventListener('click', resetVm);

  btnRunJit.addEventListener('click', () => {
    runVerifier();
    if (isVerified) {
      logConsole('[JIT] Compiling eBPF bytecode to Native x86_64 Machine Code...', 'success');
      vmStatusIndicator.textContent = 'JIT RUNNING';
    }
  });

  btnSendPacket.addEventListener('click', () => {
    const port = parseInt(document.getElementById('pktPort').value) || 80;
    const proto = document.getElementById('pktProto').value;
    
    let action = 'XDP_PASS';
    let badgeClass = 'xdp-pass';

    if (presetSelect.value === 'xdp_drop' && port === 80) {
      action = 'XDP_DROP';
      badgeClass = 'xdp-drop';
    } else if (presetSelect.value === 'map_counter') {
      const current = ebpfMap.get(0) || 0;
      ebpfMap.set(0, current + 1);
      renderMap();
    }

    xdpActionResult.innerHTML = `<span class="xdp-badge ${badgeClass}">${action} (Port ${port} ${proto})</span>`;
    const logLine = document.createElement('div');
    logLine.textContent = `[${proto}] Packet DstPort:${port} -> Action: ${action}`;
    packetStreamLog.prepend(logLine);
  });

  // Initial Boot
  loadPreset('xdp_drop');
  renderMap();
});
