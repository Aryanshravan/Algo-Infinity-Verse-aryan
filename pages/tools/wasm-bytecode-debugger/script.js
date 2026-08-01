/* WebAssembly Bytecode & Stack VM Debugger Logic */

document.addEventListener('DOMContentLoaded', () => {
  const wasmPresetSelect = document.getElementById('wasmPresetSelect');
  const watCodeEditor = document.getElementById('watCodeEditor');
  const operandStackContainer = document.getElementById('operandStackContainer');
  const stackDepthBadge = document.getElementById('stackDepthBadge');
  const hexMemoryGrid = document.getElementById('hexMemoryGrid');

  const btnWasmStepForward = document.getElementById('btnWasmStepForward');
  const btnWasmStepBack = document.getElementById('btnWasmStepBack');
  const btnWasmReset = document.getElementById('btnWasmReset');

  const PRESETS = {
    factorial: `(module\n  (func $factorial (param $n i32) (result i32)\n    local.get $n\n    i32.const 1\n    i32.le_s\n    if (result i32)\n      i32.const 1\n    else\n      local.get $n\n      local.get $n\n      i32.const 1\n      i32.sub\n      call $factorial\n      i32.mul\n    end\n  )\n)`,

    fibonacci: `(module\n  (func $fib (param $n i32) (result i32)\n    local.get $n\n    i32.const 0\n    i32.eq\n    if (result i32)\n      i32.const 0\n    else\n      local.get $n\n      i32.const 1\n      i32.sub\n      call $fib\n    end\n  )\n)`,

    memory_copy: `(module\n  (memory 1)\n  (func $main\n    i32.const 0   ;; Address offset\n    i32.const 42  ;; Byte value '*'\n    i32.store\n  )\n)`
  };

  let operandStack = [
    { type: 'i32', val: 5 },
    { type: 'i32', val: 24 }
  ];

  function renderStack() {
    operandStackContainer.innerHTML = '';
    operandStack.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'stack-item';
      card.innerHTML = `<span>[${idx}] Type: ${item.type}</span> <strong>Value: ${item.val}</strong>`;
      operandStackContainer.appendChild(card);
    });
    stackDepthBadge.textContent = `Depth: ${operandStack.length}`;
  }

  function renderHexMemory() {
    let memoryDump = '';
    for (let offset = 0; offset < 64; offset += 16) {
      let line = `0x${offset.toString(16).padStart(4, '0')}: `;
      for (let i = 0; i < 16; i++) {
        const val = offset + i === 0 ? '2A' : '00';
        line += `${val} `;
      }
      memoryDump += line + '\n';
    }
    hexMemoryGrid.textContent = memoryDump;
  }

  btnWasmStepForward.addEventListener('click', () => {
    operandStack.push({ type: 'i32', val: Math.floor(Math.random() * 100) });
    renderStack();
  });

  btnWasmStepBack.addEventListener('click', () => {
    if (operandStack.length > 0) {
      operandStack.pop();
      renderStack();
    }
  });

  btnWasmReset.addEventListener('click', () => {
    operandStack = [];
    renderStack();
  });

  wasmPresetSelect.addEventListener('change', (e) => {
    watCodeEditor.value = PRESETS[e.target.value] || PRESETS.factorial;
    operandStack = [{ type: 'i32', val: 5 }];
    renderStack();
  });

  watCodeEditor.value = PRESETS.factorial;
  renderStack();
  renderHexMemory();
});
