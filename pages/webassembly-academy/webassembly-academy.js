/* ============================================
   WEBASSEMBLY ACADEMY -- Curriculum, Progress,
   WAT→WASM Simulator (Stack VM + Binary Encoder) & Quiz
   ============================================ */

const STORAGE_KEY = 'webassemblyAcademyProgress';

/* ─── Curriculum Data ─── */
const curriculum = [
    {
        id: 'wasm-basics',
        title: 'WASM Basics & Binary Format',
        lessons: [
            {
                id: 'wasm-basics-1',
                title: 'What is WebAssembly?',
                objectives: [
                    'Explain what WebAssembly is and why it was created',
                    'Contrast WebAssembly with JavaScript execution models',
                    'List the languages and platforms that target WASM',
                    'Identify when a browser runs a JIT vs a precompiled WASM module',
                ],
                content: `
                    <h2>What is WebAssembly?</h2>
                    <p><strong>WebAssembly (WASM)</strong> is a portable, low-level <em>bytecode format</em> designed to run near-native speed on the web and beyond. It is a compilation target: C, C++, Rust, Go, and many other languages can be compiled into a compact binary that browsers (and non-browser hosts like Node.js, Deno, and Cloudflare Workers) can execute deterministically and safely.</p>

                    <p>Unlike JavaScript — which browsers <strong>parse, then JIT-compile</strong> at runtime — a WASM module arrives as a validated binary that the engine can compile and execute almost immediately. There is no garbage-collection pause for most programs, no dynamic types, and no hidden object-shape analysis. The result is startup and throughput that are often within a few percent of native compiled code.</p>

<pre><code>// The classic first WASM module, written in WAT (text format):
(module
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)
  (export "add" (func $add)))
</code></pre>

                    <h3>Why it exists</h3>
                    <ul>
                        <li><strong>Performance ceiling</strong> — asm.js proved that a browser could run low-level code "well enough"; WASM formalized it into a real binary format with a spec and a validation step.</li>
                        <li><strong>Language portability</strong> — you don't have to rewrite your C++ game engine or Rust crypto in JS. You compile it once and ship the <code>.wasm</code>.</li>
                        <li><strong>Predictability</strong> — the binary is validated before execution, so the engine can compile it up front and cache it.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">WASM is not a replacement for JS</div>
                        <p>WebAssembly has <strong>no DOM access</strong>, no built-in I/O, and no garbage collector (GC is arriving via the GC proposal). It is a computation engine. JavaScript remains the glue: it loads the module, imports host functions, and manipulates the DOM. The two are designed to be used together.</p>
                    </div>
                `,
                takeaways: [
                    'WebAssembly is a portable binary instruction format, not a language you hand-write day-to-day',
                    'It executes near-native speed because the engine validates and compiles the binary up front',
                    'Languages like C, C++, Rust, and Go compile to WASM via their toolchains',
                    'WASM has no DOM or host APIs; JS is the host layer that loads and drives modules',
                ],
                revision: [
                    { label: 'WebAssembly Concepts', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts', tag: 'Docs' },
                    { label: 'WebAssembly homepage & spec', url: 'https://webassembly.org/', tag: 'Spec' },
                    { label: 'Rust Academy (a language that targets WASM)', url: '/pages/rust-academy/rust-academy.html', tag: 'Related' },
                ],
                defaultCode: `(module
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)
  (export "add" (func $add)))`,
            },
            {
                id: 'wasm-basics-2',
                title: 'The Binary Format: Magic, Sections & LEB128',
                objectives: [
                    'Identify the magic bytes and version in a .wasm binary',
                    'Explain the role of each core section (type, function, code, memory, export)',
                    'Decode LEB128 unsigned and signed integers',
                    'Read a hex dump of a tiny module end to end',
                ],
                content: `
                    <h2>Reading a .wasm File</h2>
                    <p>A compiled <code>.wasm</code> file is a flat byte sequence. It always begins with the same header:</p>
<pre><code>00 61 73 6d   ; \\0asm  — the magic number
01 00 00 00   ; version 1
</code></pre>
                    <p>After the header come <strong>sections</strong>. Each section is an id byte, an unsigned LEB128 length, then its payload. The sections appear in a fixed order:</p>
                    <ul>
                        <li><strong>Type (1)</strong> — function signatures (<code>(param)(result)</code> combos).</li>
                        <li><strong>Import (2)</strong> — functions/memories the module borrows from the host.</li>
                        <li><strong>Function (3)</strong> — each function's type index.</li>
                        <li><strong>Memory (5)</strong> — declared linear memories and their page counts.</li>
                        <li><strong>Global (6)</strong> — globals and their initial values.</li>
                        <li><strong>Export (7)</strong> — what the module hands back to JS.</li>
                        <li><strong>Code (10)</strong> — the actual instruction bytes for each function body.</li>
                        <li><strong>Data (11)</strong> — static bytes to seed linear memory.</li>
                    </ul>

                    <h3>LEB128 in 30 seconds</h3>
                    <p>Numbers use <strong>LEB128</strong>, a variable-length encoding where each 7-bit group is stored least-significant-first and the high bit marks "more bytes follow".</p>
                    <ul>
                        <li>Unsigned: <code>0x7F</code> → <code>127</code> (fits in one byte because the high bit is 0).</li>
                        <li>Unsigned: <code>0x80 0x01</code> → <code>128</code> (bits 0-6 in first byte, bit 7 in second).</li>
                        <li>Signed: the last byte's most-significant payload bit is the sign; negative numbers get sign-extended groups.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Why variable-length?</div>
                        <p>Small integers are the norm. Encoding <code>127</code> in one byte instead of four keeps binaries compact — exactly what you want when shipping code over a network.</p>
                    </div>

                    <p>Open the <strong>WAT → WASM Simulator</strong> tab, press <strong>wat2wasm</strong>, and inspect the <em>WASM Binary (hex)</em> panel to see these sections in a real hex dump — the simulator even runs <code>WebAssembly.validate()</code> on the bytes it emits.</p>
                `,
                takeaways: [
                    'Every .wasm starts with the \\0asm magic and version 1',
                    'Sections appear in a fixed order and each carries a LEB128 length prefix',
                    'LEB128 packs integers into 1+ bytes using a 7-bit group + continuation-bit scheme',
                    'The type section holds signatures; the code section holds the actual instructions',
                ],
                revision: [
                    { label: 'Binary Format Overview', url: 'https://webassembly.github.io/spec/core/binary/index.html', tag: 'Spec' },
                    { label: 'LEB128 encoding', url: 'https://en.wikipedia.org/wiki/LEB128', tag: 'Reference' },
                    { label: 'WASM Bytecode Debugger', url: '/pages/tools/wasm-bytecode-debugger/index.html', tag: 'Tool' },
                ],
                defaultCode: `(module
  (memory 1)
  (func $init
    i32.const 8
    i32.const 65   ;; 'A'
    i32.store8)
  (export "init" (func $init)))`,
            },
        ],
        quiz: [
            {
                id: 'q-wasm-basics-1',
                question: 'What best describes WebAssembly?',
                options: [
                    'A superset of JavaScript with extra syntax',
                    'A portable low-level binary instruction format executed at near-native speed',
                    'A browser-only markup language',
                    'A server-side runtime like Node.js',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-basics-2',
                question: 'Which four bytes start every WebAssembly binary?',
                options: ['\\0asm', 'wasm', '0xWASM', '\\x00\\x01\\x00\\x00'],
                correct: 0,
            },
            {
                id: 'q-wasm-basics-3',
                question: 'Which section of a .wasm file stores the actual function instructions?',
                options: ['Type section', 'Function section', 'Code section', 'Export section'],
                correct: 2,
            },
            {
                id: 'q-wasm-basics-4',
                question: 'What is the main benefit of LEB128 encoding?',
                options: [
                    'It makes numbers readable by humans',
                    'Small integers use fewer bytes, keeping binaries compact',
                    'It encrypts the binary',
                    'It is required for backwards compatibility',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'wasm-lifecycle',
        title: 'Module Lifecycle',
        lessons: [
            {
                id: 'wasm-lifecycle-1',
                title: 'Compile: From Bytes to a Module',
                objectives: [
                    'Describe the pipeline from .wasm bytes to a usable instance',
                    'Compare WebAssembly.compile vs WebAssembly.instantiate',
                    'Explain validation and why it happens before execution',
                    'Use streaming compile APIs for faster startup',
                ],
                content: `
                    <h2>Compiling a Module</h2>
                    <p>Every WASM journey starts with <strong>bytes</strong>. The first stage is <code>compile</code> — the engine <strong>validates</strong> the binary (type-checks every instruction, every branch, every stack effect) and turns it into a <strong>Module</strong>, an immutable compiled artifact.</p>

<pre><code>const bytes = await fetch('math.wasm').then((r) => r.arrayBuffer());

// 1) Compile → a Module object
const module = await WebAssembly.compile(bytes);

// 2) Instantiate → a live instance with exported functions
const instance = await WebAssembly.instantiate(module, {});
const result = instance.exports.add(20, 22);
console.log(result); // 42
</code></pre>

                    <h3>compile vs instantiate</h3>
                    <ul>
                        <li><code>WebAssembly.compile(bytes)</code> — validate + compile only. Returns a <code>Module</code>. Useful when you want to cache a module and instantiate it many times.</li>
                        <li><code>WebAssembly.instantiate(bytes, imports)</code> — compile and instantiate in one step. Convenient, but recompiles if called repeatedly.</li>
                        <li><code>WebAssembly.instantiateStreaming(fetchPromise, imports)</code> — the fastest path in browsers: it starts compiling as bytes stream in, instead of waiting for the whole download.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Validation is the security gate</div>
                        <p>Before any instruction executes, the engine checks the module against the spec: well-typed stacks, in-bounds control flow, valid sections, no out-of-bounds memory operations. A module that passes validation cannot crash the host or escape the sandbox through malformed bytecode.</p>
                    </div>
                `,
                takeaways: [
                    'compile turns validated bytes into a reusable Module',
                    'instantiate adds imports and produces a live instance with exports',
                    'instantiateStreaming overlaps fetch with compile for faster startup',
                    'Validation happens up front and is the core of WASM safety',
                ],
                revision: [
                    { label: 'WebAssembly.compile()', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/compile', tag: 'Docs' },
                    { label: 'WebAssembly.instantiateStreaming()', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/instantiateStreaming', tag: 'Docs' },
                    { label: 'Load and run WASM', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Loading_and_running', tag: 'Guide' },
                ],
                defaultCode: `(module
  (func $square (param $x i32) (result i32)
    local.get $x
    local.get $x
    i32.mul)
  (export "square" (func $square)))`,
            },
            {
                id: 'wasm-lifecycle-2',
                title: 'Instantiate & Call Exports',
                objectives: [
                    'Create an instance and enumerate its exports',
                    'Call exported functions from JS and read return values',
                    'Explain the start function and module initialization ordering',
                    'Understand that instances are isolated state machines',
                ],
                content: `
                    <h2>From Module to Live Instance</h2>
                    <p>Instantiation allocates the module's runtime state: <strong>linear memory</strong>, <strong>globals</strong>, and a table of function exports. The result is an <strong>Instance</strong> — an isolated execution context with its own memory.</p>

<pre><code>const instance = await WebAssembly.instantiate(bytes, {});
const { square, counter, memory } = instance.exports;

console.log(square(9));          // 81  — calling a WASM function
counter(); counter();
console.log(counter());          // 3   — state lives across calls
console.log(memory.buffer);      // ArrayBuffer backing linear memory
</code></pre>

                    <h3>Start functions</h3>
                    <p>A module may declare a <code>(start $func)</code> directive. That function runs <em>exactly once, automatically, during instantiation</em> — before <code>instantiate</code> even resolves. It is the perfect place to seed memory or globals that the exported functions depend on.</p>

                    <h3>Isolation</h3>
                    <ul>
                        <li>Two instances of the same module have <strong>separate memories</strong> and separate globals.</li>
                        <li>The same compiled <code>Module</code> can be instantiated many times — each instance gets fresh state.</li>
                        <li>Exports are the <em>only</em> way code outside the module can interact with its internals.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Try it in the simulator</div>
                        <p>Use the <code>global_counter</code> preset — it exports a function that mutates a WASM global. Call <code>bump()</code> repeatedly in real JS and watch the instance remember its state between calls.</p>
                    </div>
                `,
                takeaways: [
                    'An instance holds the module\'s memory, globals, and exports',
                    'Exports are the only interface JS has to the module',
                    'A start function runs once at instantiation time',
                    'Instances are isolated; the same module can be instantiated many times with fresh state',
                ],
                revision: [
                    { label: 'WebAssembly.Instance', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Instance', tag: 'Docs' },
                    { label: 'WebAssembly.Module', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Module', tag: 'Docs' },
                    { label: 'Instantiating WASM', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Loading_and_running', tag: 'Guide' },
                ],
                defaultCode: `(module
  (global $count (mut i32) (i32.const 0))
  (func $bump (result i32)
    global.get $count
    i32.const 1
    i32.add
    global.set $count
    global.get $count)
  (export "bump" (func $bump)))`,
            },
        ],
        quiz: [
            {
                id: 'q-wasm-lifecycle-1',
                question: 'What does WebAssembly.compile(bytes) return?',
                options: [
                    'An Instance ready to call',
                    'A validated, compiled Module object',
                    'An ArrayBuffer of source code',
                    'A WebAssembly.Memory',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-lifecycle-2',
                question: 'Which API overlaps downloading and compiling to minimize startup time?',
                options: [
                    'WebAssembly.compile',
                    'WebAssembly.instantiate',
                    'WebAssembly.instantiateStreaming',
                    'WebAssembly.validate',
                ],
                correct: 2,
            },
            {
                id: 'q-wasm-lifecycle-3',
                question: 'When does a (start) function execute?',
                options: [
                    'On every call to an exported function',
                    'Once, automatically, during instantiation',
                    'When the page loads',
                    'Never — it is a comment',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-lifecycle-4',
                question: 'Two instances created from the same module will:',
                options: [
                    'Share the same linear memory',
                    'Share the same globals',
                    'Have isolated memory and globals',
                    'Share every object by reference',
                ],
                correct: 2,
            },
        ],
    },
    {
        id: 'wasm-memory',
        title: 'Memory & the Linear Memory Model',
        lessons: [
            {
                id: 'wasm-memory-1',
                title: 'Linear Memory & Pages',
                objectives: [
                    'Explain the concept of a single flat linear memory',
                    'Describe pages (64 KiB) and memory limits',
                    'Read and write memory from JS through Memory.buffer',
                    'Understand why WASM uses linear memory instead of pointers',
                ],
                content: `
                    <h2>One Big Array of Bytes</h2>
                    <p>WebAssembly's memory model is gloriously simple: each instance has <strong>at most one flat, contiguous byte array</strong> — the <strong>linear memory</strong>. There are no pointers to arbitrary objects; there is only a byte offset into this array, and every load/store is bounds-checked.</p>

                    <p>Memory is measured in <strong>pages</strong> of 64 KiB (65,536 bytes) each:</p>
<pre><code>(module
  (memory 1)          ;; request 1 page = 64 KiB
  (func (export "fill")
    i32.const 0
    i32.const 0x2A
    i32.store8))
</code></pre>

                    <h3>Accessing memory from JS</h3>
                    <p>The memory exports itself as an <code>ArrayBuffer</code>. Use a typed array view to read and write bytes:</p>
<pre><code>const mem = instance.exports.memory;
const bytes = new Uint8Array(mem.buffer);
bytes[0] = 7;                         // write byte 0 from JS
const view = new DataView(mem.buffer);
console.log(view.getUint32(4, true)); // read a little-endian u32 at offset 4
</code></pre>

                    <ul>
                        <li><strong>Little-endian</strong> — WASM reads/writes multi-byte values little-endian, so use <code>true</code> for the <code>DataView</code> endianness flag.</li>
                        <li><strong>Shared with JS</strong> — JS and WASM see the <em>same</em> bytes; writes in one language are visible in the other immediately.</li>
                        <li><strong>Bounded</strong> — every access is checked. Out-of-range access traps instead of corrupting other memory.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">No heap, no pointers</div>
                        <p>Because there is no malloc-based heap or pointer arithmetic you must fear, a memory-safe language like Rust needs no GC to run on WASM — it just reads and writes this byte array under the ownership rules it already enforces.</p>
                    </div>
                `,
                takeaways: [
                    'Linear memory is one flat, bounds-checked byte array per instance',
                    'Memory grows in pages of 64 KiB',
                    'JS shares the same bytes through memory.buffer and typed arrays',
                    'Values are little-endian; every access is validated at runtime',
                ],
                revision: [
                    { label: 'WebAssembly.Memory', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Memory', tag: 'Docs' },
                    { label: 'Memory instructions spec', url: 'https://webassembly.github.io/spec/core/exec/instructions.html#memory-instructions', tag: 'Spec' },
                    { label: 'WASM Memory Simulator', url: '/pages/visualizers/wasm-memory-simulator/wasm-memory-simulator.html', tag: 'Tool' },
                ],
                defaultCode: `(module
  (memory 1)
  (func $write
    i32.const 12
    i32.const 7
    i32.store)
  (export "write" (func $write)))`,
            },
            {
                id: 'wasm-memory-2',
                title: 'Loads, Stores & memory.grow',
                objectives: [
                    'Write and read i32, i16, and i8 values with store/load variants',
                    'Understand store8/store16 masking and load sign-extension',
                    'Grow memory dynamically with memory.grow',
                    'Reason about offsets, alignment, and traps',
                ],
                content: `
                    <h2>Reading and Writing Linear Memory</h2>
                    <p>All memory traffic happens through explicit load and store instructions with an <strong>effective address</strong> computed as <code>base + offset</code>:</p>
<pre><code>(module
  (memory 1)
  (func $demo (result i32)
    i32.const 100      ;; base address
    i32.const 0x11223344
    i32.store          ;; store a full 32-bit word at [100..103]
    i32.const 100
    i32.load)          ;; load it back
  (export "demo" (func $demo)))
</code></pre>

                    <h3>Narrow loads and stores</h3>
                    <ul>
                        <li><code>i32.store8</code> / <code>i32.load8_u</code> — byte-wide access. Stores mask the value to 8 bits; the <code>_u</code> suffix zero-extends, <code>_s</code> sign-extends.</li>
                        <li><code>i32.store16</code> / <code>i32.load16_u</code> — 16-bit half-word access.</li>
                        <li><code>i32.store</code> / <code>i32.load</code> — full 32-bit little-endian word.</li>
                    </ul>

                    <h3>Growing memory</h3>
                    <p>Memory can grow on demand (up to the declared maximum, or a host-imposed limit):</p>
<pre><code>(module
  (memory 1 4)          ;; min 1 page, max 4 pages
  (func $grow (param $delta i32) (result i32)
    memory.grow)        ;; returns old page count, or -1 on failure
  (export "grow" (func $grow)))
</code></pre>
                    <p><code>memory.size</code> returns the current page count; <code>memory.grow</code> requests <code>n</code> extra pages and returns the <em>previous</em> count, or <code>-1</code> if the request is denied. Growing is the only way a module changes its footprint — and the host (your browser tab) is the one that hands over the new pages.</p>

                    <div class="callout">
                        <div class="callout-title">Alignment is a hint</div>
                        <p>The <code>align=</code> hint tells the engine the expected alignment (used to pick fast paths on some platforms). It is not a requirement: misaligned accesses are allowed, and bounds violations always trap.</p>
                    </div>
                `,
                takeaways: [
                    'Loads/stores use effective addresses of base + offset',
                    'store8/store16 mask values; load8_u vs load8_s control sign extension',
                    'memory.grow requests pages and returns the previous size (or -1)',
                    'Bounds violations trap instead of corrupting the sandbox',
                ],
                revision: [
                    { label: 'Memory growth', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format#growing_memory', tag: 'Docs' },
                    { label: 'Linear memory spec', url: 'https://webassembly.github.io/spec/core/syntax/instructions.html#memory-instructions', tag: 'Spec' },
                    { label: 'WASM Bytecode Debugger (watch memory)', url: '/pages/tools/wasm-bytecode-debugger/index.html', tag: 'Tool' },
                ],
                defaultCode: `(module
  (memory 1 4)
  (func $demo (result i32)
    i32.const 16
    i32.const 2024
    i32.store
    i32.const 16
    i32.load)
  (export "demo" (func $demo)))`,
            },
        ],
        quiz: [
            {
                id: 'q-wasm-memory-1',
                question: 'How many bytes are in one WebAssembly memory page?',
                options: ['1,024 bytes', '64 KiB (65,536 bytes)', '1 MiB', '4 KiB'],
                correct: 1,
            },
            {
                id: 'q-wasm-memory-2',
                question: 'What does memory.grow return?',
                options: [
                    'The new page count after growing',
                    'The previous page count, or -1 on failure',
                    'The number of bytes now available',
                    'A boolean indicating success',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-memory-3',
                question: 'What is the effective address of i32.load offset=4 on a stack base of 100?',
                options: ['96', '100', '104', '400'],
                correct: 2,
            },
            {
                id: 'q-wasm-memory-4',
                question: 'An out-of-bounds memory access in WASM results in:',
                options: [
                    'Undefined behavior and possible corruption',
                    'A trap that aborts the current execution safely',
                    'A null pointer being returned',
                    'Silently wrapping around',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'wasm-js-interop',
        title: 'Imports, Exports & JS Interop',
        lessons: [
            {
                id: 'wasm-js-interop-1',
                title: 'Exports: What WASM Hands to JS',
                objectives: [
                    'Export functions, memories, and globals',
                    'Call exported functions with correct argument types',
                    'Explain the JS/WASM value conversion rules (i32↔number, i64↔BigInt)',
                    'Understand that exports are the module\'s public API',
                ],
                content: `
                    <h2>The Module's Public API</h2>
                    <p><strong>Exports</strong> are everything a module intentionally shares with the outside world. Without them, a module is a black box that computes nothing you can reach.</p>
<pre><code>(module
  (func $double (param $x i32) (result i32)
    local.get $x
    i32.const 2
    i32.mul)
  (export "double" (func $double)))
</code></pre>
                    <p>Call it from JS like any promise-free function:</p>
<pre><code>const instance = await WebAssembly.instantiate(bytes, {});
console.log(instance.exports.double(21)); // 42
</code></pre>

                    <h3>Type conversions — the fine print</h3>
                    <ul>
                        <li><strong>i32</strong> → JS <code>number</code> (converted through <code>ToNumber</code> then truncated to 32 bits).</li>
                        <li><strong>i64</strong> → JS <code>BigInt</code>. A plain <code>number</code> will throw a <code>TypeError</code> — a classic interop gotcha.</li>
                        <li><strong>f32/f64</strong> → JS <code>number</code>.</li>
                        <li><strong>v128</strong> → not directly passable to JS yet; SIMD values cross the boundary only in restricted ways.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">The BigInt gotcha</div>
                        <p>If a WASM function returns <code>i64</code>, <code>instance.exports.fn()</code> returns a <code>BigInt</code>. Passing a plain <code>number</code> where an <code>i64</code> is expected throws. Use <code>123n</code> on the JS side.</p>
                    </div>
                `,
                takeaways: [
                    'Exports define the module\'s public interface',
                    'Exported memories appear as memory.buffer on the instance',
                    'i32 maps to JS numbers; i64 maps to BigInt',
                    'Each instance is a separate object exposing its own exports',
                ],
                revision: [
                    { label: 'JS-API type conversion', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/instantiate', tag: 'Docs' },
                    { label: 'Understanding the text format', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format', tag: 'Guide' },
                    { label: 'gRPC Academy (also serializes typed data across a boundary)', url: '/pages/grpc-academy/grpc-academy.html', tag: 'Related' },
                ],
                defaultCode: `(module
  (func $hypot (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $a
    i32.mul
    local.get $b
    local.get $b
    i32.mul
    i32.add)
  (export "hypot" (func $hypot)))`,
            },
            {
                id: 'wasm-js-interop-2',
                title: 'Imports & Calling Back into JS',
                objectives: [
                    'Import host functions and call them from WASM',
                    'Pass the imports object to instantiate',
                    'Understand the shared-memory communication pattern',
                    'Explain the copy vs share tradeoffs for strings and objects',
                ],
                content: `
                    <h2>Calling Back Into JavaScript</h2>
                    <p>WASM has no I/O — so when a module needs to log, draw, fetch, or touch the DOM, it <strong>imports a host function</strong> that JS provides at instantiation time:</p>
<pre><code>(module
  (import "env" "log" (func $log (param i32)))
  (func $double (param $x i32) (result i32)
    local.get $x
    call $log
    local.get $x
    i32.const 2
    i32.mul)
  (export "double" (func $double)))
</code></pre>
<pre><code>const instance = await WebAssembly.instantiate(bytes, {
  env: {
    log: (n) => console.log('WASM says:', n),
  },
});
instance.exports.double(21); // logs 21, returns 42
</code></pre>

                    <p>Imports and exports together form a two-way bridge. WASM calls JS for side effects; JS calls WASM for computation. Values are passed <strong>by value</strong> — JS numbers and BigInts cross the boundary cheaply.</p>

                    <h3>Strings & objects: copy or share?</h3>
                    <ul>
                        <li>There is no native string type in WASM. The standard pattern is to <strong>write bytes into shared linear memory</strong> and pass an <code>(offset, length)</code> pair across the boundary.</li>
                        <li>JS then reads the bytes from <code>memory.buffer</code> with a typed array — <code>TextDecoder</code> turns them into a string.</li>
                        <li>Objects are never passed directly; you serialize (JSON, protobuf) into memory and deserialize on the other side.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">One-directional growth</div>
                        <p>Only the <em>module</em> can grow its memory. If JS allocates inside WASM memory (the C heap pattern), the module exposes an allocator function that JS calls — JS never touches the underlying ArrayBuffer size directly.</p>
                    </div>
                `,
                takeaways: [
                    'Imports let the module call host functions provided by JS',
                    'The imports object keys must match the import module names',
                    'Strings cross the boundary as byte offsets into shared linear memory',
                    'Shared memory is the primary communication channel; values are passed by copy otherwise',
                ],
                revision: [
                    { label: 'Calling JS from WASM', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/instantiate', tag: 'Docs' },
                    { label: 'WebAssembly JavaScript API', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface', tag: 'Docs' },
                    { label: 'WASM Execution Tool', url: '/pages/ai-features/wasm-execution/wasm-execution.html', tag: 'Tool' },
                ],
                defaultCode: `(module
  (import "env" "log" (func $log (param i32)))
  (func $double (param $x i32) (result i32)
    local.get $x
    call $log
    local.get $x
    i32.const 2
    i32.mul)
  (export "double" (func $double)))`,
            },
        ],
        quiz: [
            {
                id: 'q-wasm-interop-1',
                question: 'How does a WASM i64 value cross the JS boundary?',
                options: [
                    'As a plain number',
                    'As a BigInt',
                    'As a string',
                    'As a Uint8Array',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-interop-2',
                question: 'A WASM module that needs to log to the console should:',
                options: [
                    'Use the browser console directly',
                    'Import a host function provided by JS',
                    'Write to stdout',
                    'Throw an error',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-interop-3',
                question: 'How do strings typically cross the WASM/JS boundary?',
                options: [
                    'They are passed as native string objects',
                    'As (offset, length) pairs into shared linear memory',
                    'As Base64 in globals',
                    'They cannot cross the boundary',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-interop-4',
                question: 'Who is allowed to grow a WASM instance\'s memory?',
                options: [
                    'Only JS code',
                    'Only the WASM module (via memory.grow)',
                    'Either side freely',
                    'Nobody — it is fixed forever',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'wasm-toolchains',
        title: 'WAT & Toolchains',
        lessons: [
            {
                id: 'wasm-toolchains-1',
                title: 'Reading & Writing WAT',
                objectives: [
                    'Recognize the S-expression structure of WAT',
                    'Map WAT instructions to their binary opcodes',
                    'Use local variables, globals, and control flow in WAT',
                    'Assemble WAT to binary with wat2wasm',
                ],
                content: `
                    <h2>The WebAssembly Text Format</h2>
                    <p><strong>WAT</strong> (WebAssembly Text format) is the human-readable representation of WASM. It is an <strong>S-expression</strong> language: everything is a parenthesized expression, and every instruction maps 1:1 to a binary opcode.</p>
<pre><code>(module
  (func $max (param $a i32) (param $b i32) (result i32)
    (if (result i32)
      (i32.gt_s (local.get $a) (local.get $b))
      (then (local.get $a))
      (else (local.get $b))))
  (export "max" (func $max)))
</code></pre>

                    <h3>WAT grammar in five bullets</h3>
                    <ul>
                        <li><code>(module ...)</code> is the root. Inside it live <em>fields</em>: <code>func</code>, <code>memory</code>, <code>global</code>, <code>import</code>, <code>export</code>, <code>data</code>, <code>start</code>.</li>
                        <li><code>$name</code> — identifiers for functions, locals, globals, and labels. They are shorthand; the binary only stores indices.</li>
                        <li><code>(param $x i32)</code> / <code>(result i32)</code> — declare signatures and stack types.</li>
                        <li>Instructions are written <em>stack-based</em>: operands are pushed first, then the operator consumes them. <code>local.get $a</code> pushes; <code>i32.add</code> pops two and pushes one.</li>
                        <li><code>(if (result i32) ... (then ...) (else ...))</code> is the folded form; the flat <code>if / else / end</code> form is exactly what gets encoded to bytes.</li>
                    </ul>

                    <h3>wat2wasm</h3>
                    <p>The reference toolchain from the <strong>wabt</strong> project converts text to binary and back:</p>
<pre><code>$ wat2wasm max.wat -o max.wasm
$ wasm2wat max.wasm              # disassemble back to text
$ wasm-validate max.wasm         # type-check the binary
</code></pre>
                    <p>You can reproduce this right here — write WAT in the simulator tab and press <strong>wat2wasm</strong>.</p>

                    <div class="callout">
                        <div class="callout-title">Fold everything</div>
                        <p>The folded style <code>(i32.add (local.get $a) (local.get $b))</code> and the flat style <code>local.get $a / local.get $b / i32.add</code> are the <em>same program</em>. Tools like <code>wat2wasm</code> accept both and normalize to the flat, linear instruction stream.</p>
                    </div>
                `,
                takeaways: [
                    'WAT is a 1:1 text mirror of WASM binary instructions',
                    'S-expressions wrap module fields; instructions use a stack model',
                    '$names are sugar — the binary stores only indices',
                    'wabt (wat2wasm/wasm2wat/wasm-validate) is the reference toolchain',
                ],
                revision: [
                    { label: 'Understanding WAT', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format', tag: 'Guide' },
                    { label: 'wabt (WebAssembly Binary Toolkit)', url: 'https://github.com/WebAssembly/wabt', tag: 'Tool' },
                    { label: 'WASM Bytecode Debugger', url: '/pages/tools/wasm-bytecode-debugger/index.html', tag: 'Tool' },
                ],
                defaultCode: `(module
  (func $max (param $a i32) (param $b i32) (result i32)
    (if (result i32)
      (i32.gt_s (local.get $a) (local.get $b))
      (then (local.get $a))
      (else (local.get $b))))
  (export "max" (func $max)))`,
            },
            {
                id: 'wasm-toolchains-2',
                title: 'Toolchains: wabt, Emscripten & rustc',
                objectives: [
                    'Compare the major WASM toolchains and their targets',
                    'Compile C/C++ with Emscripten or clang and link JS glue',
                    'Compile Rust with cargo build --target wasm32-unknown-unknown',
                    'Choose between bare-wasm and runtime-managed approaches',
                ],
                content: `
                    <h2>From Source Code to .wasm</h2>
                    <p>Nobody writes WASM bytecode by hand for production. You write source, and a <strong>toolchain</strong> lowers it to a <code>.wasm</code> file. Which toolchain you pick depends on your language and how much runtime support you need.</p>

                    <h3>wabt — the text-format toolkit</h3>
                    <p>Pure tooling for the format itself: <code>wat2wasm</code>, <code>wasm2wat</code>, <code>wasm-validate</code>, <code>wasm-strip</code>. Use it when you have WAT or want to inspect binaries — not for compiling C or Rust.</p>

                    <h3>Emscripten & clang — C/C++</h3>
<pre><code>$ emcc fib.c -O3 -o fib.js   # generates fib.wasm + JS glue
</code></pre>
                    <p>Emscripten provides a full POSIX-ish runtime: <code>malloc</code>, libc, the Filesystem API, and threads via SharedArrayBuffer. It is heavy but makes almost any C code portable. Bare <code>clang --target=wasm32</code> skips the runtime for tiny freestanding modules.</p>

                    <h3>rustc & cargo — Rust</h3>
<pre><code>$ cargo build --release --target wasm32-unknown-unknown
$ wasm-bindgen --out-dir pkg target/.../*.wasm
</code></pre>
                    <p>The <code>wasm32-unknown-unknown</code> target emits a <strong>bare module</strong> with no runtime and no std dependencies. Pair it with <code>wasm-bindgen</code> (for the JS glue and TypeScript types) or <code>wasm-pack</code> for the full npm experience.</p>

                    <h3>Choosing a strategy</h3>
                    <ul>
                        <li><strong>Bare module</strong> (Rust <code>-unknown</code>, clang freestanding) — tiny, fast startup, you own the memory. Best for hot functions embedded in a larger app.</li>
                        <li><strong>Runtime-backed</strong> (Emscripten, wasmtime-style hosts) — portable, feature-rich, but bigger binaries and a bootstrap cost.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">The assembly line</div>
                        <p>Whatever the language, the pipeline is the same: source → LLVM/GCC backend → WASM binary → (optionally) JS glue for instantiation. The <strong>Component Model</strong> and tooling like <code>jco</code> are evolving to make these binaries composable building blocks.</p>
                    </div>
                `,
                takeaways: [
                    'wabt manipulates WAT/binary but does not compile high-level languages',
                    'Emscripten compiles C/C++ and ships a POSIX-like runtime + JS glue',
                    'Rust targets wasm32-unknown-unknown for bare modules, with wasm-bindgen for JS interop',
                    'Bare modules start fast and are tiny; runtime-backed modules are more portable',
                ],
                revision: [
                    { label: 'Emscripten docs', url: 'https://emscripten.org/', tag: 'Docs' },
                    { label: 'Rust and WebAssembly (wasm-bindgen)', url: 'https://rustwasm.github.io/', tag: 'Guide' },
                    { label: 'wasm-pack', url: 'https://rustwasm.github.io/wasm-pack/', tag: 'Tool' },
                ],
                defaultCode: `(module
  (func $mul (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.mul)
  (func $add3 (param $a i32) (param $b i32) (param $c i32) (result i32)
    local.get $a
    local.get $b
    i32.add
    local.get $c
    i32.add)
  (export "mul" (func $mul))
  (export "add3" (func $add3)))`,
            },
        ],
        quiz: [
            {
                id: 'q-wasm-toolchains-1',
                question: 'Which tool converts WAT text into a .wasm binary?',
                options: ['wasm-pack', 'wat2wasm', 'cargo', 'emcc'],
                correct: 1,
            },
            {
                id: 'q-wasm-toolchains-2',
                question: 'What does the Rust target wasm32-unknown-unknown produce?',
                options: [
                    'A module bundled with Emscripten\'s runtime',
                    'A bare WASM module with no runtime',
                    'A Node.js package automatically',
                    'JavaScript source code',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-toolchains-3',
                question: 'Which toolchain provides a POSIX-like runtime (malloc, libc) for C/C++?',
                options: ['wabt', 'Emscripten', 'wasm-bindgen', 'LLVM alone'],
                correct: 1,
            },
            {
                id: 'q-wasm-toolchains-4',
                question: 'In the folded WAT form (i32.add (local.get $a) (local.get $b)), what runs first?',
                options: [
                    'i32.add',
                    'The two local.get pushes (operands first)',
                    'The parentheses',
                    'Nothing — the order is undefined',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'wasm-simd',
        title: 'SIMD & Performance',
        lessons: [
            {
                id: 'wasm-simd-1',
                title: 'SIMD 101: v128 & Lanes',
                objectives: [
                    'Explain single-instruction multiple-data (SIMD) at a high level',
                    'Describe the v128 type and its lane layouts (i8x16, i32x4, f64x2)',
                    'Write basic WAT that builds and combines v128 values',
                    'Recognize the speedup from processing multiple lanes per instruction',
                ],
                content: `
                    <h2>One Instruction, Many Values</h2>
                    <p><strong>SIMD</strong> (Single Instruction, Multiple Data) lets one instruction operate on several values at once. WASM's SIMD proposal adds the <strong><code>v128</code></strong> type — a 128-bit register that can be sliced into different <strong>lane</strong> shapes:</p>
                    <ul>
                        <li><code>i8x16</code> — 16 bytes (e.g., pixel RGBA data).</li>
                        <li><code>i16x8</code> — 8 half-words (audio samples).</li>
                        <li><code>i32x4</code> — 4 words (vectors, matrix math).</li>
                        <li><code>f32x4</code> / <code>f64x2</code> — 4 floats / 2 doubles (graphics, physics).</li>
                    </ul>

<pre><code>(module
  (func $add4 (param $a v128) (param $b v128) (result v128)
    local.get $a
    local.get $b
    i32x4.add)          ;; adds 4 pairs of i32 lanes at once
  (export "add4" (func $add4)))
</code></pre>

                    <p>Building a vector in WAT uses <code>v128.const</code> with a shape:</p>
<pre><code>(module
  (func $demo (result v128)
    v128.const i32x4 1 2 3 4
    v128.const i32x4 10 20 30 40
    i32x4.add)
  (export "demo" (func $demo)))
</code></pre>

                    <h3>Why lanes matter</h3>
                    <p>A scalar loop does one add per iteration. An <code>i32x4.add</code> does four adds in one instruction on a CPU with 128-bit SIMD registers — a potential <strong>4× throughput</strong> on that loop (in practice, less than 4× due to overhead, but often dramatically faster). The biggest wins come from video/audio codecs, image filters, string scanning, and numeric kernels.</p>

                    <div class="callout">
                        <div class="callout-title">Try it</div>
                        <p>Load the <code>simd_add</code> preset in the simulator. Watch the interpreter hold a <code>v128</code> value on the operand stack and add the lanes.</p>
                    </div>
                `,
                takeaways: [
                    'v128 is a 128-bit value that can hold many small lanes',
                    'Lane shapes: i8x16, i16x8, i32x4, f32x4, f64x2',
                    'One SIMD instruction performs the same op across all lanes',
                    'Great for codecs, image/audio processing, and numeric kernels',
                ],
                revision: [
                    { label: 'SIMD proposal overview', url: 'https://github.com/webassembly/simd', tag: 'Spec' },
                    { label: 'WebAssembly SIMD guide (MDN)', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface', tag: 'Docs' },
                    { label: 'Rust Academy (safe SIMD via std::simd)', url: '/pages/rust-academy/rust-academy.html', tag: 'Related' },
                ],
                defaultCode: `(module
  (func $add4 (result v128)
    v128.const i32x4 1 2 3 4
    v128.const i32x4 10 20 30 40
    i32x4.add)
  (export "add4" (func $add4)))`,
            },
            {
                id: 'wasm-simd-2',
                title: 'When & How WASM Wins on Performance',
                objectives: [
                    'Identify workloads that benefit from WASM vs plain JS',
                    'Reason about serialization costs and copy overhead',
                    'Explain when JIT warm-up and GC matter',
                    'Measure the difference instead of assuming a win',
                ],
                content: `
                    <h2>Not Everything Is Faster in WASM</h2>
                    <p>WASM is fast, but it is not magic. The rule of thumb: <strong>it wins on compute-bound kernels</strong> and loses on tiny operations where the JS↔WASM boundary overhead dominates.</p>

                    <h3>Where WASM shines</h3>
                    <ul>
                        <li><strong>Compression/decompression</strong> (zlib, brotli), hashing, and crypto primitives.</li>
                        <li><strong>Media codecs</strong> — audio/video decode that must run every frame.</li>
                        <li><strong>Large numeric loops</strong> — image filters, matrix math, simulation, ray tracing.</li>
                        <li><strong>Deterministic code</strong> — games and engines that need consistent timing.</li>
                    </ul>

                    <h3>Where it loses</h3>
                    <ul>
                        <li><strong>Small calls</strong> — each call across the boundary has overhead. A million tiny <code>add()</code> calls from JS may beat a WASM add.</li>
                        <li><strong>DOM-heavy work</strong> — WASM can\'t touch the DOM, so any rendering funnel has to round-trip through JS.</li>
                        <li><strong>Structure copying</strong> — passing large objects requires serializing into memory; the copy can dwarf the computation.</li>
                    </ul>

                    <h3>The engineering discipline</h3>
<pre><code>// Measure first:
const t0 = performance.now();
for (let i = 0; i &lt; 1e7; i++) jsVersion(data);
const jsTime = performance.now() - t0;

const t1 = performance.now();
for (let i = 0; i &lt; 1e7; i++) wasmVersion(data);
const wasmTime = performance.now() - t1;

console.log({ jsTime, wasmTime }); // let the numbers decide
</code></pre>

                    <div class="callout">
                        <div class="callout-title">The warm-up myth, corrected</div>
                        <p>Modern JS engines are remarkably fast once warmed up — JIT-compiled JS is often within 2-3× of native. WASM removes JIT uncertainty and improves startup, which is why it excels for code you run briefly or in bursts (a page-load-time codec, a one-shot hash) as much as for hot loops.</p>
                    </div>
                `,
                takeaways: [
                    'WASM wins on compute-bound kernels; the JS/WASM boundary cost matters for tiny calls',
                    'Serialization and copy overhead can erase performance gains',
                    'Startup predictability is a real advantage of precompiled WASM',
                    'Always benchmark the actual workload before committing to WASM',
                ],
                revision: [
                    { label: 'Why JS and WASM are allies', url: 'https://web.dev/articles/why-js-and-wasm-are-allies', tag: 'Article' },
                    { label: 'WebAssembly performance guide', url: 'https://web.dev/webassembly/', tag: 'Article' },
                    { label: 'Core Web Vitals (perf skill)', url: '/pages/learning/core-web-vitals/core-web-vitals.html', tag: 'Related' },
                ],
                defaultCode: `(module
  (func $fib (param $n i32) (result i32)
    (local $a i32) (local $b i32) (local $i i32) (local $tmp i32)
    i32.const 0
    local.set $a
    i32.const 1
    local.set $b
    block $exit
      loop $again
        local.get $i
        local.get $n
        i32.ge_s
        br_if $exit
        local.get $a
        local.get $b
        i32.add
        local.set $tmp
        local.get $b
        local.set $a
        local.get $tmp
        local.set $b
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $again
      end
    end
    local.get $a)
  (export "fib" (func $fib)))`,
            },
        ],
        quiz: [
            {
                id: 'q-wasm-simd-1',
                question: 'How many bytes is a v128 SIMD value?',
                options: ['64 bytes', '128 bytes', '16 bytes', '32 bytes'],
                correct: 2,
            },
            {
                id: 'q-wasm-simd-2',
                question: 'Which lane shape holds 4 32-bit integers?',
                options: ['i8x16', 'i16x8', 'i32x4', 'f64x2'],
                correct: 2,
            },
            {
                id: 'q-wasm-simd-3',
                question: 'When is WASM most likely to beat JS?',
                options: [
                    'For a few tiny calls into the module',
                    'For compute-bound kernels over large data',
                    'For DOM manipulation',
                    'For string concatenation',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-simd-4',
                question: 'What is a common hidden cost that can erase WASM gains?',
                options: [
                    'The WebAssembly prefix',
                    'Serializing/copying data across the JS boundary',
                    'Using i32 instead of i64',
                    'Disabling SIMD',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'wasm-security',
        title: 'Security & Limitations',
        lessons: [
            {
                id: 'wasm-security-1',
                title: 'The Sandbox & Memory Safety',
                objectives: [
                    'Explain how validation + bounds checks create a memory-safe sandbox',
                    'Describe the isolation model: no direct OS, CPU, or DOM access',
                    'Compare WASM security with native plugins',
                    'Understand what WASM cannot do by design',
                ],
                content: `
                    <h2>Why WASM Is Safe to Ship</h2>
                    <p>WebAssembly's security story rests on two pillars: <strong>validation</strong> and <strong>isolation</strong>. A hostile module is not a virus — it is a guest in a locked room.</p>

                    <h3>Validation-first execution</h3>
                    <ul>
                        <li>The binary is <strong>type-checked</strong> before running: every stack effect, every branch target, every call signature.</li>
                        <li>Malformed or ill-typed modules are rejected at load time — they never execute a single instruction.</li>
                        <li>All memory accesses are <strong>bounds-checked</strong>; an out-of-range access <em>traps</em> instead of corrupting neighboring memory.</li>
                    </ul>

                    <h3>The isolation model</h3>
                    <ul>
                        <li>WASM has <strong>no direct syscalls, no CPU access, no DOM, no network, no filesystem</strong> — every host capability must be explicitly imported by the module and provided by the host.</li>
                        <li>Memory is private to the instance unless explicitly shared (via a shared memory export).</li>
                        <li>This is dramatically safer than native plugins, which historically had full process privileges.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">The remaining attack surface</div>
                        <p>Validation protects against <em>malformed</em> code, not <em>malicious</em> code. A well-formed module can still be a crypto-miner, can probe side channels, or can exploit bugs in the <em>host imports</em> you hand it. Security is a layered system: WASM gives you a strong sandbox, but you still audit what you import and what you hand the module.</p>
                    </div>
                `,
                takeaways: [
                    'Validation happens before execution, so malformed binaries never run',
                    'Bounds-checked memory traps instead of corrupting state',
                    'No host capabilities exist unless the host explicitly imports them',
                    'Sandboxing stops malformed code, not malicious-but-valid code — audit your imports',
                ],
                revision: [
                    { label: 'WebAssembly security docs', url: 'https://webassembly.org/docs/security/', tag: 'Docs' },
                    { label: 'WebAssembly Concepts (safety)', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts', tag: 'Docs' },
                    { label: 'WASM Bytecode Debugger (sandboxed stepping)', url: '/pages/tools/wasm-bytecode-debugger/index.html', tag: 'Tool' },
                ],
                defaultCode: `(module
  (memory 1)
  (func $bounded (param $addr i32) (result i32)
    ;; bounds-checked load: traps if $addr >= 65536
    local.get $addr
    i32.load8_u)
  (export "bounded" (func $bounded)))`,
            },
            {
                id: 'wasm-security-2',
                title: 'Limitations & Attack Surfaces',
                objectives: [
                    'List the practical limits of WASM (no DOM, GC, standard library)',
                    'Explain side-channel risks and how hosts mitigate them',
                    'Discuss supply-chain and code-size concerns',
                    'Identify the traps: traps, DoS via memory growth, and malicious-but-valid code',
                ],
                content: `
                    <h2>The Fine Print: Limits & Risks</h2>
                    <p>WASM is powerful, but it ships with deliberate limitations — and like any technology, it has attack surfaces a security-minded engineer must respect.</p>

                    <h3>Deliberate limitations</h3>
                    <ul>
                        <li><strong>No DOM / host APIs</strong> — everything goes through JS glue.</li>
                        <li><strong>No built-in GC</strong> — the GC proposal is still landing; today, managed languages compile in their own collector.</li>
                        <li><strong>No standard library</strong> — no <code>std</code> like Rust's, no libc unless you link it (Emscripten).</li>
                        <li><strong>Single linear memory</strong> — multi-memory is new; complex apps juggle one big buffer.</li>
                    </ul>

                    <h3>Attack surfaces & mitigations</h3>
                    <ul>
                        <li><strong>Malicious-but-valid modules</strong> — a well-formed module can mine crypto or waste CPU. Mitigate with resource limits (WASM budget), timeouts, and CSP.</li>
                        <li><strong>Memory exhaustion</strong> — <code>memory.grow</code> requests can balloon your tab's RSS. Cap the maximum pages you accept from untrusted modules.</li>
                        <li><strong>Side channels</strong> — speculative-execution vulnerabilities (Spectre-class) cross language boundaries. Browsers respond with <strong>Site Isolation</strong> and per-origin process separation, and harden the JIT.</li>
                        <li><strong>Supply chain</strong> — you ship a binary that is hard to audit by eye. Reproducible builds, pinned toolchains, and integrity checks (SRI) reduce the risk.</li>
                        <li><strong>Traps as DoS</strong> — crafted input that makes a module trap repeatedly is a denial-of-service vector; guard the call sites.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Treat WASM like any untrusted input</div>
                        <p>The sandbox is real, but it is not a pass. Validate inputs before they reach WASM, cap memory, time-box calls, and keep the module's data supply chain clean — the same hygiene you apply to npm packages and native libraries.</p>
                    </div>
                `,
                takeaways: [
                    'WASM has no DOM, no GC by default, and no standard library',
                    'Valid modules can still be malicious — apply resource limits and timeouts',
                    'Side-channel risks exist and are mitigated by process isolation and hardened JITs',
                    'Guard against memory growth, traps, and supply-chain tampering',
                ],
                revision: [
                    { label: 'WebAssembly security docs', url: 'https://webassembly.org/docs/security/', tag: 'Docs' },
                    { label: 'Securing WASM in the wild', url: 'https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts', tag: 'Docs' },
                    { label: 'eBPF Zero-Trust Security (sandboxing patterns)', url: '/pages/academy/ebpf-zero-trust-security/index.html', tag: 'Related' },
                ],
                defaultCode: `(module
  (memory 0 2)
  (func $grow (param $n i32) (result i32)
    local.get $n
    memory.grow)
  (export "grow" (func $grow)))`,
            },
        ],
        quiz: [
            {
                id: 'q-wasm-security-1',
                question: 'Which of these is TRUE about WebAssembly execution?',
                options: [
                    'Malformed binaries run until they crash',
                    'Binaries are validated and bounds-checked before and during execution',
                    'WASM can access the DOM directly',
                    'WASM memory is always shared with every other instance',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-security-2',
                question: 'How does a WASM module get host capabilities?',
                options: [
                    'They are automatic',
                    'Only through explicit imports provided by the host',
                    'Through environment variables',
                    'It cannot ever access host functions',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-security-3',
                question: 'A module that calls memory.grow in a loop can be a:',
                options: [
                    'Buffer overflow',
                    'Memory-exhaustion (DoS) risk',
                    'SQL injection',
                    'No risk at all',
                ],
                correct: 1,
            },
            {
                id: 'q-wasm-security-4',
                question: 'Why is supply-chain hygiene still important with WASM?',
                options: [
                    'WASM binaries are text and easy to tamper with invisibly',
                    'Binaries are opaque and hard to audit by eye',
                    'WASM ignores all security',
                    'It is not important',
                ],
                correct: 1,
            },
        ],
    },
];

/* ─── Simulator presets (reuses the wasm-bytecode-debugger concept) ─── */
const PRESETS = {
    factorial: {
        label: 'Factorial (recursion)',
        entry: 'fact',
        args: [5],
        wat: `(module
  (func $fact (param $n i32) (result i32)
    (local $acc i32)
    i32.const 1
    local.set $acc
    block $exit
      loop $again
        local.get $n
        i32.const 1
        i32.lt_s
        br_if $exit
        local.get $acc
        local.get $n
        i32.mul
        local.set $acc
        local.get $n
        i32.const 1
        i32.sub
        local.set $n
        br $again
      end
    end
    local.get $acc)
  (export "fact" (func $fact)))`,
    },
    add_export: {
        label: 'Add (exported function)',
        entry: 'add',
        args: [40, 2],
        wat: `(module
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)
  (export "add" (func $add)))`,
    },
    memory_store: {
        label: 'Linear memory store',
        entry: 'main',
        args: [],
        wat: `(module
  (memory 1)
  (func $main (result i32)
    i32.const 16
    i32.const 42
    i32.store
    i32.const 16
    i32.load)
  (export "main" (func $main)))`,
    },
    global_counter: {
        label: 'Mutable global',
        entry: 'bump',
        args: [],
        wat: `(module
  (global $count (mut i32) (i32.const 0))
  (func $bump (result i32)
    global.get $count
    i32.const 1
    i32.add
    global.set $count
    global.get $count)
  (export "bump" (func $bump)))`,
    },
    js_interop: {
        label: 'JS interop (import)',
        entry: 'double',
        args: [21],
        wat: `(module
  (import "env" "log" (func $log (param i32)))
  (func $double (param $x i32) (result i32)
    local.get $x
    call $log
    local.get $x
    i32.const 2
    i32.mul)
  (export "double" (func $double)))`,
    },
    simd_add: {
        label: 'SIMD i32x4.add',
        entry: 'add',
        args: [],
        wat: `(module
  (func $add (result v128)
    v128.const i32x4 1 2 3 4
    v128.const i32x4 10 20 30 40
    i32x4.add)
  (export "add" (func $add)))`,
    },
    fibonacci: {
        label: 'Fibonacci (loop)',
        entry: 'fib',
        args: [10],
        wat: `(module
  (func $fib (param $n i32) (result i32)
    (local $a i32) (local $b i32) (local $i i32) (local $tmp i32)
    i32.const 0
    local.set $a
    i32.const 1
    local.set $b
    block $exit
      loop $again
        local.get $i
        local.get $n
        i32.ge_s
        br_if $exit
        local.get $a
        local.get $b
        i32.add
        local.set $tmp
        local.get $b
        local.set $a
        local.get $tmp
        local.set $b
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $again
      end
    end
    local.get $a)
  (export "fib" (func $fib)))`,
    },
};

const DEFAULT_WAT = PRESETS.add_export.wat;

/* ─── App state ─── */
const state = {
    activeModuleId: curriculum[0].id,
    activeLessonId: curriculum[0].lessons[0].id,
    activeTab: 'lesson',
    completedItems: [],
    quizAnswers: {},
    quizSubmitted: false,
};

const DOM = {};

/* ─── DOM cache ─── */
function cacheDOM() {
    DOM.sidebarOverlay = document.getElementById('sidebar-overlay');
    DOM.sidebar = document.getElementById('sidebar');
    DOM.openSidebarBtn = document.getElementById('open-sidebar-btn');
    DOM.closeSidebarBtn = document.getElementById('close-sidebar-btn');
    DOM.moduleList = document.getElementById('module-list');
    DOM.activeModuleTitle = document.getElementById('active-module-title');
    DOM.tabBtns = document.querySelectorAll('.tab-btn');
    DOM.tabContents = document.querySelectorAll('.tab-content');
    DOM.tabLesson = document.getElementById('tab-lesson');
    DOM.tabSimulator = document.getElementById('tab-simulator');
    DOM.tabQuiz = document.getElementById('tab-quiz');
    DOM.lessonContent = document.getElementById('lesson-content');
    DOM.markCompleteBtn = document.getElementById('mark-complete-btn');
    DOM.quizContainer = document.getElementById('quiz-container');
    DOM.progressBar = document.getElementById('progress-bar');
    DOM.progressText = document.getElementById('progress-text');

    DOM.watEditor = document.getElementById('wat-editor');
    DOM.presetSelect = document.getElementById('wat-preset-select');
    DOM.compileBtn = document.getElementById('compile-btn');
    DOM.runBtn = document.getElementById('run-btn');
    DOM.stepFwdBtn = document.getElementById('step-fwd-btn');
    DOM.stepBackBtn = document.getElementById('step-back-btn');
    DOM.clearPgBtn = document.getElementById('clear-pg-btn');
    DOM.terminalWindow = document.getElementById('wat-terminal');
    DOM.bootStatus = document.getElementById('boot-status');
    DOM.showHex = document.getElementById('show-hex');
    DOM.binaryHex = document.getElementById('binary-hex');
    DOM.binarySize = document.getElementById('binary-size');
    DOM.operandStack = document.getElementById('operand-stack');
    DOM.stackDepthBadge = document.getElementById('stack-depth-badge');
    DOM.memoryHex = document.getElementById('memory-hex');
    DOM.memoryPages = document.getElementById('memory-pages');
    DOM.frameView = document.getElementById('frame-view');
}

/* ─── Helpers ─── */
function getActiveModule() {
    return curriculum.find((m) => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
    const mod = getActiveModule();
    return mod.lessons.find((l) => l.id === state.activeLessonId) || mod.lessons[0];
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ─── Progress ─── */
function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) state.completedItems = JSON.parse(saved);
    } catch {
        /* ignore */
    }
}

function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.completedItems));
    } catch {
        /* ignore */
    }
}

function markItemComplete(itemId) {
    if (!state.completedItems.includes(itemId)) {
        state.completedItems.push(itemId);
        saveProgress();
    }
}

function isItemComplete(itemId) {
    return state.completedItems.includes(itemId);
}

function updateProgress() {
    let total = 0;
    curriculum.forEach((mod) => {
        total += mod.lessons.length;
        if (mod.quiz && mod.quiz.length > 0) total++;
    });
    const completed = state.completedItems.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    DOM.progressBar.style.width = pct + '%';
    DOM.progressText.textContent = pct + '%';
}

/* ─── Sidebar ─── */
function renderSidebar() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    DOM.moduleList.innerHTML = curriculum
        .map((mod, idx) => {
            const lessonsCount = mod.lessons.length;
            const lessonsDoneCount = mod.lessons.filter((l) => isItemComplete(l.id)).length;
            const quizCount = (mod.quiz && mod.quiz.length) || 0;
            const quizDone = quizCount > 0 ? isItemComplete(mod.id + '-quiz') : true;

            const allLessonsDone = lessonsDoneCount === lessonsCount;
            const isModuleComplete = allLessonsDone && quizDone;
            const hasPartialProgress = !allLessonsDone && lessonsDoneCount > 0;
            const isActive = mod.id === state.activeModuleId;

            let nodeClass = 'timeline-node--incomplete';
            if (isModuleComplete) nodeClass = 'timeline-node--complete';
            else if (hasPartialProgress) nodeClass = 'timeline-node--partial';
            else if (isActive) nodeClass = 'timeline-node--active';

            const activePart = isModuleComplete
                ? 'module-badge--complete'
                : isActive && !hasPartialProgress
                ? 'module-badge--active'
                : '';

            const checkVisible = isModuleComplete ? 'visible' : '';

            let progressHtml = '';
            if (hasPartialProgress) {
                progressHtml = `<span class="sidebar-lesson-progress">${lessonsDoneCount}/${lessonsCount} lessons done</span>`;
            } else if (allLessonsDone && !quizDone) {
                progressHtml = `<span class="sidebar-quiz-pending">Quiz not completed</span>`;
            }

            return `
                <li style="animation-delay: ${reducedMotion ? '0s' : idx * 0.03}s">
                    <div class="timeline-node ${nodeClass}"></div>
                    <button class="sidebar-module-btn ${isActive ? 'active' : ''}"
                            data-module-id="${mod.id}">
                        <div class="module-content-row">
                            <span class="module-badge ${activePart}">${String(idx + 1).padStart(2, '0')}</span>
                            <div class="module-text-group">
                                <span class="sidebar-module-title">${escHtml(mod.title)}</span>
                                ${progressHtml}
                            </div>
                            <i class="fa-solid fa-check-circle module-check-icon ${checkVisible}"></i>
                        </div>
                    </button>
                </li>
            `;
        })
        .join('');
}

function changeModule(moduleId) {
    const mod = curriculum.find((m) => m.id === moduleId);
    if (!mod) return;
    state.activeModuleId = moduleId;
    state.activeLessonId = mod.lessons[0].id;
    state.quizAnswers = {};
    state.quizSubmitted = false;
    resetPlaygroundState();
    renderSidebar();
    renderActiveContent();
    updateProgress();
    closeSidebar();
}

/* ─── Tabs ─── */
function switchTab(tabId) {
    state.activeTab = tabId;
    DOM.tabBtns.forEach((btn) => {
        const isActive = btn.getAttribute('data-tab') === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    DOM.tabContents.forEach((c) => {
        c.classList.remove('active', 'flex', 'md:flex-row');
    });
    const active = document.getElementById('tab-' + tabId);
    if (tabId === 'simulator') {
        active.classList.add('active', 'flex', 'md:flex-row');
    } else {
        active.classList.add('active');
    }
    renderActiveContent();
}

function renderActiveContent() {
    if (state.activeTab === 'lesson') renderLesson();
    else if (state.activeTab === 'simulator') renderPlayground();
    else if (state.activeTab === 'quiz') renderQuiz();
}

/* ─── Lesson ─── */
function renderLesson() {
    const lesson = getActiveLesson();
    const isComplete = isItemComplete(lesson.id);

    const objectivesHtml =
        lesson.objectives && lesson.objectives.length
            ? `
            <div class="callout">
                <div class="callout-title"><i class="fa-solid fa-bullseye mr-2"></i>Learning Objectives</div>
                <ul>
                    ${lesson.objectives.map((o) => `<li>${escHtml(o)}</li>`).join('')}
                </ul>
            </div>`
            : '';

    const takeawaysHtml =
        lesson.takeaways && lesson.takeaways.length
            ? `
            <div class="callout">
                <div class="callout-title"><i class="fa-solid fa-check-double mr-2"></i>Key Takeaways</div>
                <ul>
                    ${lesson.takeaways.map((t) => `<li>${escHtml(t)}</li>`).join('')}
                </ul>
            </div>`
            : '';

    const revisionHtml =
        lesson.revision && lesson.revision.length
            ? `
            <div class="revision-box">
                <div class="revision-box-title"><i class="fa-solid fa-book-open-reader"></i>Related Revision Material</div>
                <ul class="revision-list">
                    ${lesson.revision
                        .map(
                            (r) => `
                        <li>
                            <i class="fa-solid fa-arrow-right"></i>
                            <a href="${r.url}" target="_blank" rel="noopener noreferrer">
                                <span class="revision-tag">${escHtml(r.tag)}</span>
                                ${escHtml(r.label)}
                            </a>
                        </li>`
                        )
                        .join('')}
                </ul>
            </div>`
            : '';

    const eli5 = window.eli5Toggle;
    const simpleContent =
        window.eli5WebassemblyData && lesson.id ? window.eli5WebassemblyData[lesson.id] || '' : '';
    DOM.lessonContent.innerHTML = eli5
        ? eli5.wrapContent(lesson.content, simpleContent)
        : lesson.content;

    if (eli5) {
        const oldToggle = DOM.lessonContent.querySelector('.eli5-toggle');
        if (oldToggle) oldToggle.remove();
        eli5.initToggle('webassembly', DOM.lessonContent);
    }

    if (window.copyCode) {
        window.copyCode.init(DOM.lessonContent);
    }

    DOM.lessonContent.insertAdjacentHTML('beforeend', objectivesHtml + takeawaysHtml + revisionHtml);

    DOM.markCompleteBtn.innerHTML = isComplete
        ? '<i class="fas fa-check-circle mr-2"></i> Completed'
        : '<i class="fas fa-check-circle mr-2"></i> Mark as Complete';
    DOM.markCompleteBtn.classList.toggle('completed', isComplete);

    DOM.activeModuleTitle.textContent = getActiveModule().title;
}

function setupMarkComplete() {
    DOM.markCompleteBtn.addEventListener('click', () => {
        const lesson = getActiveLesson();
        if (!isItemComplete(lesson.id)) {
            markItemComplete(lesson.id);
            renderLesson();
            renderSidebar();
            updateProgress();
        }
    });
}

/* ═══════════════════════════════════════════
   WAT → WASM SIMULATOR
   ═══════════════════════════════════════════ */

function formatTimestamp() {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function printLine(cls, text) {
    const p = document.createElement('p');
    p.className = 'term-line ' + cls;
    p.innerHTML = `<span class="term-time">[${formatTimestamp()}]</span> ${text}`;
    DOM.terminalWindow.appendChild(p);
    DOM.terminalWindow.scrollTop = DOM.terminalWindow.scrollHeight;
}

function resetTerminal() {
    DOM.terminalWindow.innerHTML = '';
}

function setBootStatus(text, ok, cls) {
    DOM.bootStatus.textContent = text;
    DOM.bootStatus.classList.remove('boot-status--ok', 'boot-status--warn', 'boot-status--error');
    if (ok) DOM.bootStatus.classList.add('boot-status--ok');
    else if (cls === 'warn') DOM.bootStatus.classList.add('boot-status--warn');
    else if (cls === 'error') DOM.bootStatus.classList.add('boot-status--error');
}

/* ─── Tokenizer ─── */
function tokenizeWat(src) {
    const tokens = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
        const c = src[i];
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === ',') {
            i++;
            continue;
        }
        if (c === ';' && src[i + 1] === ';') {
            while (i < n && src[i] !== '\n') i++;
            continue;
        }
        if (c === '(' && src[i + 1] === ';') {
            let depth = 1;
            i += 2;
            while (i < n && depth > 0) {
                if (src[i] === '(' && src[i + 1] === ';') { depth++; i += 2; }
                else if (src[i] === ';' && src[i + 1] === ')') { depth--; i += 2; }
                else i++;
            }
            continue;
        }
        if (c === '(') { tokens.push({ type: 'lparen', value: '(' }); i++; continue; }
        if (c === ')') { tokens.push({ type: 'rparen', value: ')' }); i++; continue; }
        if (c === '"') {
            let j = i + 1;
            let val = '';
            while (j < n && src[j] !== '"') {
                if (src[j] === '\\') {
                    const esc = src[j + 1];
                    if (esc === 'n') val += '\n';
                    else if (esc === 't') val += '\t';
                    else if (esc === 'r') val += '\r';
                    else if (esc === '"') val += '"';
                    else if (esc === '\\') val += '\\';
                    else if (/[0-9a-fA-F]/.test(esc)) {
                        val += String.fromCharCode(parseInt(src.substr(j + 1, 2), 16));
                        j += 2;
                    } else {
                        val += esc;
                    }
                    j += 2;
                } else {
                    val += src[j];
                    j++;
                }
            }
            tokens.push({ type: 'str', value: val });
            i = Math.min(j + 1, n);
            continue;
        }
        let j = i;
        while (j < n && !/[\s()";,]/.test(src[j])) j++;
        tokens.push({ type: 'atom', value: src.slice(i, j) });
        i = j;
    }
    return tokens;
}

/* ─── Parser ─── */
class WatParser {
    constructor(tokens) {
        this.toks = tokens;
        this.pos = 0;
        this.errors = [];
    }
    peek(offset = 0) {
        return this.toks[this.pos + offset] || { type: 'eof', value: '' };
    }
    next() {
        return this.toks[this.pos++] || { type: 'eof', value: '' };
    }
    isLparen() {
        return this.peek().type === 'lparen';
    }
    isRparen() {
        return this.peek().type === 'rparen';
    }
    skipParen() {
        if (this.next().type !== 'lparen') this.err('expected (');
    }
    skipClose() {
        if (this.next().type !== 'rparen') this.err('expected )');
    }
    err(msg) {
        throw new Error(msg + ' near token "' + this.peek().value + '"');
    }
    atom() {
        const t = this.next();
        if (t.type !== 'atom' && t.type !== 'str') this.err('expected token');
        return t.value;
    }
    maybeName() {
        const t = this.peek();
        if (t.type === 'atom' && t.value.startsWith('$')) {
            this.next();
            return t.value;
        }
        return null;
    }
    parseIntValue() {
        const t = this.next();
        if (t.type !== 'atom') this.err('expected number');
        const raw = t.value.toLowerCase();
        const neg = raw.startsWith('-');
        const body = neg ? raw.slice(1) : raw;
        let v = body.startsWith('0x') ? parseInt(body, 16) : parseInt(body, 10);
        if (Number.isNaN(v)) this.err('invalid number "' + raw + '"');
        return neg ? -v : v;
    }
    parseFloatValue() {
        const t = this.next();
        if (t.type !== 'atom') this.err('expected number');
        return parseFloat(t.value);
    }
    /* blocktype: optional (result T) / (param T) annotation */
    parseBlockType() {
        if (this.isLparen()) {
            const inner = this.peek(1);
            if (inner.type === 'atom' && (inner.value === 'result' || inner.value === 'param')) {
                this.skipParen();
                const ann = this.atom();
                if (ann === 'param') this.maybeName();
                const type = this.atom();
                this.skipClose();
                return type;
            }
        }
        return null;
    }
    parseModule() {
        this.skipParen();
        if (this.isAtom('module')) this.next();
        const mod = {
            memory: null,
            globals: [],
            imports: [],
            funcs: [],
            exports: [],
            start: null,
            data: [],
        };
        while (!this.isRparen() && this.peek().type !== 'eof') {
            this.skipParen();
            const name = this.atom();
            if (name === 'memory') this.parseMemory(mod);
            else if (name === 'func') this.parseFunc(mod);
            else if (name === 'global') this.parseGlobal(mod);
            else if (name === 'export') this.parseExport(mod);
            else if (name === 'import') this.parseImport(mod);
            else if (name === 'start') this.parseStart(mod);
            else if (name === 'data') this.parseData(mod);
            else if (name === 'type') this.skipField();
            else this.err('unsupported module field "' + name + '"');
        }
        this.skipClose();
        return mod;
    }
    isAtom(v) {
        const t = this.peek();
        return t.type === 'atom' && t.value === v;
    }
    skipField() {
        let depth = 1;
        while (depth > 0 && this.peek().type !== 'eof') {
            const t = this.next();
            if (t.type === 'lparen') depth++;
            else if (t.type === 'rparen') depth--;
        }
    }
    parseMemory(mod) {
        this.maybeName();
        const mem = { min: 1, max: null, exportName: null };
        if (this.isLparen() && this.peek(1).type === 'atom' && this.peek(1).value === 'export') {
            this.skipParen();
            this.next(); /* export */
            mem.exportName = this.atom();
            this.skipClose();
        }
        if (this.peek().type === 'atom' && /^\d+$/.test(this.peek().value)) mem.min = this.parseIntValue();
        if (this.peek().type === 'atom' && /^\d+$/.test(this.peek().value)) mem.max = this.parseIntValue();
        this.skipClose();
        mod.memory = mem;
    }
    parseGlobal(mod) {
        const g = { name: this.maybeName(), type: 'i32', mut: false, init: 0, initType: 'i32', exportName: null };
        while (this.isLparen() && this.peek(1).type === 'atom' && this.peek(1).value === 'export') {
            this.skipParen();
            this.next();
            g.exportName = this.atom();
            this.skipClose();
        }
        if (this.isAtom('mut')) {
            this.next();
            g.mut = true;
        }
        g.type = this.atom();
        /* init expr */
        if (this.isLparen()) {
            this.skipParen();
            const instr = this.atom();
            this.parseConstInto(g, instr);
            this.skipClose();
        } else {
            const instr = this.atom();
            this.parseConstInto(g, instr);
        }
        this.skipClose();
        mod.globals.push(g);
    }
    parseConstInto(g, instr) {
        const m = instr.match(/^(i32|i64|f32|f64)\.const$/);
        if (!m) this.err('unsupported global init "' + instr + '"');
        g.initType = m[1];
        if (g.initType === 'i64') g.init = BigInt(this.parseIntValue());
        else if (g.initType === 'f32') g.init = Math.fround(this.parseFloatValue());
        else if (g.initType === 'f64') g.init = this.parseFloatValue();
        else g.init = this.parseIntValue();
    }
    parseExport(mod) {
        const name = this.atom();
        if (this.isLparen()) {
            this.skipParen();
            const kind = this.atom();
            const ref = this.maybeName() || this.parseIntValue();
            this.skipClose();
            mod.exports.push({ name, kind, ref });
        }
        this.skipClose();
    }
    parseImport(mod) {
        const imp = { module: this.atom(), name: this.atom() };
        this.skipParen();
        const kind = this.atom();
        if (kind === 'func') {
            imp.kind = 'func';
            imp.funcName = this.maybeName();
            imp.params = [];
            imp.results = [];
            while (this.isLparen()) {
                this.skipParen();
                const ann = this.atom();
                if (ann === 'param') { this.maybeName(); imp.params.push(this.atom()); }
                else if (ann === 'result') { imp.results.push(this.atom()); }
                else this.err('unsupported import annotation "' + ann + '"');
                this.skipClose();
            }
        } else if (kind === 'memory') {
            imp.kind = 'memory';
            imp.min = /^\d+$/.test(this.peek().value) ? this.parseIntValue() : 1;
            imp.max = null;
            if (this.peek().type === 'atom' && /^\d+$/.test(this.peek().value)) imp.max = this.parseIntValue();
        } else {
            this.err('unsupported import kind "' + kind + '"');
        }
        this.skipClose();
        this.skipClose();
        mod.imports.push(imp);
    }
    parseStart(mod) {
        mod.start = this.maybeName() || this.parseIntValue();
        this.skipClose();
    }
    parseData(mod) {
        if (this.isLparen()) {
            this.skipParen();
            this.maybeName();
            if (this.isAtom('i32.const')) this.next();
            const off = this.parseIntValue();
            this.skipClose();
            let bytes = [];
            if (this.peek().type === 'str') {
                const s = this.atom();
                for (let k = 0; k < s.length; k++) bytes.push(s.charCodeAt(k) & 0xff);
            }
            mod.data.push({ offset: off, bytes });
        } else {
            let bytes = [];
            if (this.peek().type === 'str') {
                const s = this.atom();
                for (let k = 0; k < s.length; k++) bytes.push(s.charCodeAt(k) & 0xff);
            }
            mod.data.push({ offset: 0, bytes });
        }
        this.skipClose();
    }
    parseFunc(mod) {
        const fn = {
            name: this.maybeName(),
            paramNames: [],
            localNames: [],
            params: [],
            results: [],
            locals: [],
            instrs: [],
        };
        while (this.isLparen()) {
            this.skipParen();
            const ann = this.atom();
            if (ann === 'param') {
                const nm = this.maybeName();
                fn.paramNames.push(nm);
                fn.params.push(this.atom());
            } else if (ann === 'result') {
                fn.results.push(this.atom());
            } else if (ann === 'local') {
                const nm = this.maybeName();
                fn.localNames.push(nm);
                fn.locals.push(this.atom());
            } else {
                this.err('unexpected annotation "' + ann + '"');
            }
            this.skipClose();
        }
        const body = this.parseInstrs([]);
        fn.instrs = body.instrs;
        fn.instrs.push({ op: 'end' });
        mod.funcs.push(fn);
        this.skipClose();
    }
    /* General flat+folded instruction parser. `stops` is an array of atom
       names that end this list (consumed). Stops at ')' or EOF otherwise. */
    parseInstrs(stops) {
        const out = [];
        for (;;) {
            const t = this.peek();
            if (t.type === 'eof') break;
            if (t.type === 'rparen') break;
            if (t.type === 'atom') {
                const name = t.value;
                if (stops.includes(name)) {
                    this.next();
                    return { instrs: out, terminator: name };
                }
                if (name === 'if' || name === 'block' || name === 'loop') {
                    this.next();
                    const label = this.maybeName();
                    const blockType = this.parseBlockType();
                    out.push({ op: name, label, blockType });
                    if (name === 'if') {
                        const thenPart = this.parseInstrs(['else', 'end']);
                        out.push(...thenPart.instrs);
                        if (thenPart.terminator === 'else') {
                            out.push({ op: 'else' });
                            const elsePart = this.parseInstrs(['end']);
                            out.push(...elsePart.instrs);
                        }
                        out.push({ op: 'end' });
                    } else {
                        const body = this.parseInstrs(['end']);
                        out.push(...body.instrs);
                        out.push({ op: 'end' });
                    }
                    continue;
                }
                this.next();
                out.push(this.buildInstr(name));
            } else if (t.type === 'lparen') {
                const nextTok = this.peek(1);
                if (nextTok.type === 'atom' && (nextTok.value === 'then' || nextTok.value === 'else')) {
                    return { instrs: out, terminator: nextTok.value };
                }
                this.next();
                const nameTok = this.peek();
                if (nameTok.type !== 'atom') this.err('expected instruction name');
                this.next();
                this.parseFoldedInstr(nameTok.value, out);
            } else {
                this.err('unexpected token');
            }
        }
        return { instrs: out, terminator: null };
    }
    parseFoldedInstr(name, out) {
        if (name === 'if') {
            this.parseFoldedIf(out);
            return;
        }
        if (name === 'block' || name === 'loop') {
            const label = this.maybeName();
            const blockType = this.parseBlockType();
            out.push({ op: name, label, blockType });
            const body = this.parseInstrs([]);
            out.push(...body.instrs);
            out.push({ op: 'end' });
            this.skipClose();
            return;
        }
        if (name === 'then' || name === 'else') {
            this.err('unexpected folded ' + name);
        }
        out.push(this.buildInstr(name));
        this.skipClose();
    }
    parseFoldedIf(out) {
        const blockType = this.parseBlockType();
        const cond = this.parseInstrs([]);
        const condInstrs = cond.instrs;
        let thenInstrs = [];
        let elseInstrs = null;
        if (cond.terminator === 'then') {
            this.skipParen();
            this.next(); /* then */
            const thenPart = this.parseInstrs([]);
            thenInstrs = thenPart.instrs;
            this.skipClose();
            if (this.isLparen() && this.peek(1).type === 'atom' && this.peek(1).value === 'else') {
                this.skipParen();
                this.next();
                const elsePart = this.parseInstrs([]);
                elseInstrs = elsePart.instrs;
                this.skipClose();
            }
        } else if (cond.terminator === 'else') {
            this.skipParen();
            this.next();
            const elsePart = this.parseInstrs([]);
            elseInstrs = elsePart.instrs;
            this.skipClose();
        }
        out.push(...condInstrs);
        out.push({ op: 'if', blockType });
        out.push(...thenInstrs);
        if (elseInstrs) {
            out.push({ op: 'else' });
            out.push(...elseInstrs);
        }
        out.push({ op: 'end' });
        this.skipClose();
    }
    parseMemArg() {
        let offset = 0;
        let align = null;
        while (this.peek().type === 'atom' && /^(offset|align)=/.test(this.peek().value)) {
            const raw = this.next().value;
            const eq = raw.indexOf('=');
            const v = parseInt(raw.slice(eq + 1), 10);
            if (raw.slice(0, eq) === 'offset') offset = v;
            else align = v;
        }
        return { offset, align };
    }
    buildInstr(name) {
        if (/^(i32|i64|f32|f64)\.const$/.test(name)) {
            const t = name.split('.')[0];
            let val;
            if (t === 'i64') val = BigInt(this.parseIntValue());
            else if (t === 'f32') val = Math.fround(this.parseFloatValue());
            else if (t === 'f64') val = this.parseFloatValue();
            else val = this.parseIntValue();
            return { op: name, type: t, val };
        }
        if (name === 'v128.const') {
            const shape = this.atom();
            const widths = { i8x16: 1, i16x8: 2, i32x4: 4, i64x2: 8, f32x4: 4, f64x2: 8 };
            const counts = { i8x16: 16, i16x8: 8, i32x4: 4, i64x2: 2, f32x4: 4, f64x2: 2 };
            const count = counts[shape] || 16;
            const lanes = [];
            for (let k = 0; k < count; k++) {
                const t = this.peek();
                if (t.type !== 'atom') break;
                if (shape.startsWith('f')) lanes.push(this.parseFloatValue());
                else if (shape === 'i64x2') lanes.push(BigInt(this.parseIntValue()));
                else lanes.push(this.parseIntValue());
            }
            const bytes = new Uint8Array(16);
            const w = widths[shape] || 1;
            const dv = new DataView(bytes.buffer);
            for (let k = 0; k < lanes.length && k * w < 16; k++) {
                const off = k * w;
                const v = lanes[k];
                if (shape === 'i8x16') bytes[off] = v & 0xff;
                else if (shape === 'i16x8') dv.setUint16(off, v & 0xffff, true);
                else if (shape === 'i32x4') dv.setUint32(off, v >>> 0, true);
                else if (shape === 'i64x2') dv.setBigUint64(off, BigInt(v), true);
                else if (shape === 'f32x4') dv.setFloat32(off, v, true);
                else if (shape === 'f64x2') dv.setFloat64(off, v, true);
            }
            return { op: name, type: 'v128', bytes };
        }
        if (name === 'local.get' || name === 'local.set' || name === 'local.tee') {
            return { op: name, local: this.maybeName() !== null ? this.lastLocal : this.parseIntValue() };
        }
        if (name === 'global.get' || name === 'global.set') {
            const ref = this.maybeName();
            return { op: name, global: ref !== null ? ref : this.parseIntValue() };
        }
        if (name === 'call') {
            const ref = this.maybeName();
            return { op: name, func: ref !== null ? ref : this.parseIntValue() };
        }
        if (name === 'br' || name === 'br_if') {
            const t = this.peek();
            if (t.type === 'atom' && t.value.startsWith('$')) {
                this.next();
                return { op: name, label: t.value };
            }
            this.next();
            return { op: name, depth: /^\d+$/.test(t.value) ? parseInt(t.value, 10) : 0 };
        }
        if (name.includes('load') || name.includes('store')) {
            const arg = this.parseMemArg();
            return { op: name, offset: arg.offset, align: arg.align };
        }
        if (name === 'memory.size' || name === 'memory.grow') {
            if (this.peek().type === 'atom' && /^\d+$/.test(this.peek().value)) this.next();
            return { op: name };
        }
        if (name.includes('extract_lane')) {
            return { op: name, lane: this.parseIntValue() };
        }
        return { op: name };
    }
}
/* capture the name for local.get/set/tee — parse it in buildInstr directly */
const __origBuild = WatParser.prototype.buildInstr;
WatParser.prototype.buildInstr = function patchedBuild(name) {
    if (name === 'local.get' || name === 'local.set' || name === 'local.tee') {
        const ref = this.maybeName();
        return { op: name, local: ref !== null ? ref : this.parseIntValue() };
    }
    return __origBuild.call(this, name);
};
/* re-add the plain version (the patch above already handles locals) */
WatParser.prototype.lastLocal = null;

/* ─── Compile AST → executable module ─── */
function resolveModule(mod) {
    const stripDollar = (s) => (typeof s === 'string' && s.startsWith('$') ? s.slice(1) : s);
    const funcIndexByName = new Map();
    let idx = 0;
    mod.imports.forEach((imp) => {
        if (imp.kind === 'func') {
            funcIndexByName.set(stripDollar(imp.funcName), idx);
            idx++;
        }
    });
    mod.funcs.forEach((f) => {
        if (f.name) funcIndexByName.set(stripDollar(f.name), idx);
        idx++;
    });
    mod.resolveFunc = (ref) => {
        if (typeof ref === 'number') return ref;
        const v = funcIndexByName.get(stripDollar(ref));
        if (v === undefined) throw new Error('unknown function "' + ref + '"');
        return v;
    };
    const globalIndexByName = new Map();
    mod.globals.forEach((g, gi) => {
        if (g.name) globalIndexByName.set(g.name, gi);
    });
    mod.resolveGlobal = (ref) => {
        if (typeof ref === 'number') return ref;
        const v = globalIndexByName.get(ref);
        if (v === undefined) throw new Error('unknown global "' + ref + '"');
        return v;
    };

    mod.funcs.forEach((fn) => {
        /* named locals: params then locals */
        const namedLocals = new Map();
        fn.paramNames.forEach((nm, i) => { if (nm) namedLocals.set(nm, i); });
        fn.localNames.forEach((nm, li) => {
            if (nm) namedLocals.set(nm, fn.params.length + li);
        });
        fn.namedLocals = namedLocals;
        fn.nParams = fn.params.length;
        fn.nLocalsTotal = fn.params.length + fn.locals.length;

        /* assign endPc/elsePc and resolve branch labels */
        const controlStack = [];
        fn.instrs.forEach((instr, pc) => {
            if (instr.op === 'block' || instr.op === 'loop' || instr.op === 'if') {
                controlStack.push({ op: instr.op, pc, label: instr.label });
            } else if (instr.op === 'else') {
                const top = controlStack[controlStack.length - 1];
                if (top && top.op === 'if') top.elsePc = pc;
            } else if (instr.op === 'end') {
                const top = controlStack.pop();
                if (top) fn.instrs[top.pc].endPc = pc;
            }
        });
        /* resolve labels for br/br_if */
        const labelStack = [];
        fn.instrs.forEach((instr) => {
            if (instr.op === 'block' || instr.op === 'loop' || instr.op === 'if') {
                labelStack.push({ label: instr.label, op: instr.op });
            } else if (instr.op === 'end') {
                labelStack.pop();
            } else if (instr.op === 'br' || instr.op === 'br_if') {
                if (typeof instr.label === 'string') {
                    let depth = 0;
                    let found = -1;
                    for (let k = labelStack.length - 1; k >= 0; k--) {
                        if (labelStack[k].label === instr.label) { found = k; break; }
                    }
                    if (found === -1) {
                        throw new Error('unknown label "' + instr.label + '" in function ' + (fn.name || '?'));
                    }
                    instr.depth = labelStack.length - 1 - found;
                }
            }
        });
    });
    return mod;
}

/* ─── Value helpers ─── */
function fmtVal(item) {
    if (!item) return '∅';
    if (item.type === 'i64') return String(item.val);
    if (item.type === 'v128') return [...item.bytes].map((b) => b.toString(16).padStart(2, '0')).join(' ');
    if (item.type === 'f32') return String(Math.fround(item.val));
    return String(item.val);
}

function makeTypedValue(type, raw) {
    switch (type) {
        case 'i32': return { type: 'i32', val: Number(raw) | 0 };
        case 'i64': return { type: 'i64', val: BigInt(raw) };
        case 'f32': return { type: 'f32', val: Math.fround(Number(raw)) };
        case 'f64': return { type: 'f64', val: Number(raw) };
        case 'v128': return { type: 'v128', bytes: raw || new Uint8Array(16) };
        default: return { type: 'i32', val: Number(raw) | 0 };
    }
}

/* ─── Interpreter ─── */
const SIMD_INFO = {
    i8x16: { lanes: 16, size: 1 },
    i16x8: { lanes: 8, size: 2 },
    i32x4: { lanes: 4, size: 4 },
    i64x2: { lanes: 2, size: 8 },
    f32x4: { lanes: 4, size: 4 },
    f64x2: { lanes: 2, size: 8 },
};

class WasmVM {
    constructor(module, host) {
        this.module = module;
        this.host = host || {};
        this.stack = [];
        this.frames = [];
        this.globals = [];
        this.memory = null;
        this.history = [];
        this.recordHistory = true;
        this.steps = 0;
        this.maxSteps = 2000;
        this.running = false;
        this.trap = null;
        const mem = module.memory || {};
        const pages = Math.max(1, mem.min || 0);
        this.memory = new Uint8Array(pages * 65536);
        this.memPages = pages;
        module.globals.forEach((g) => {
            if (g.initType === 'i64') this.globals.push({ type: 'i64', val: BigInt(g.init) });
            else if (g.initType === 'f32') this.globals.push({ type: 'f32', val: Math.fround(g.init) });
            else if (g.initType === 'f64') this.globals.push({ type: 'f64', val: g.init });
            else this.globals.push({ type: 'i32', val: g.init });
        });
        (module.data || []).forEach((d) => {
            d.bytes.forEach((b, k) => {
                const addr = d.offset + k;
                if (addr < this.memory.length) this.memory[addr] = b;
            });
        });
    }
    snapshot() {
        return {
            stack: this.stack.map((s) =>
                s.type === 'v128' ? { type: 'v128', bytes: s.bytes.slice() } : { ...s }
            ),
            frames: this.frames.map((f) => ({
                func: f.func,
                pc: f.pc,
                locals: f.locals.map((l) =>
                    l.type === 'v128' ? { type: 'v128', bytes: l.bytes.slice() } : { ...l }
                ),
            })),
            globals: this.globals.map((g) =>
                g.type === 'v128' ? { type: 'v128', bytes: g.bytes.slice() } : { ...g }
            ),
            memory: this.memory.slice(),
            memPages: this.memPages,
            steps: this.steps,
            trap: this.trap,
        };
    }
    restore(snap) {
        this.stack = snap.stack;
        this.frames = snap.frames;
        this.globals = snap.globals;
        this.memory = snap.memory;
        this.memPages = snap.memPages;
        this.steps = snap.steps;
        this.trap = snap.trap;
    }
    resolveFuncRef(ref) {
        return this.module.resolveFunc(ref);
    }
    getFuncMeta(idx) {
        const nImports = this.module.imports.filter((i) => i.kind === 'func').length;
        if (idx < nImports) return this.module.imports.filter((i) => i.kind === 'func')[idx];
        return this.module.funcs[idx - nImports];
    }
    callEntry(entryName, args) {
        let idx;
        if (entryName) idx = this.resolveFuncRef(entryName);
        else if (this.module.start) idx = this.resolveFuncRef(this.module.start);
        else {
            const exp = this.module.exports.find((e) => e.kind === 'func');
            idx = exp ? this.resolveFuncRef(exp.ref) : 0;
        }
        this.callFuncIndex(idx, args || []);
    }
    callFuncIndex(funcIndex, args) {
        const nImports = this.module.imports.filter((i) => i.kind === 'func').length;
        if (funcIndex < nImports) {
            const imp = this.module.imports.filter((i) => i.kind === 'func')[funcIndex];
            this.callImport(imp, args);
            return;
        }
        const fn = this.module.funcs[funcIndex - nImports];
        if (!fn) throw new Error('no function at index ' + funcIndex);
        const locals = [];
        fn.params.forEach((p, i) => locals.push(makeTypedValue(p, args[i])));
        for (let k = 0; k < fn.locals.length; k++) locals.push(makeTypedValue(fn.locals[k], 0));
        this.frames.push({
            func: fn,
            pc: 0,
            locals,
            control: [{ kind: 'func', height: this.stack.length, arity: fn.results.length }],
        });
    }
    callImport(imp, args) {
        const hostFn = this.host[imp.module] && this.host[imp.module][imp.name];
        if (typeof hostFn === 'function') {
            const typed = args.map((a, i) => (imp.params[i] === 'i64' ? BigInt(a) : a));
            const ret = hostFn(...typed);
            if (imp.results.length > 0) this.stack.push(makeTypedValue(imp.results[0], ret));
            return;
        }
        printLine('term-warn', `// import ${imp.module}.${imp.name} — no host fn, consumed ${args.length} arg(s)`);
    }
    pop() {
        if (this.stack.length === 0) throw new Error('operand stack underflow');
        return this.stack.pop();
    }
    popI32() {
        return Number(this.pop().val) | 0;
    }
    pushI32(v) {
        this.stack.push({ type: 'i32', val: v | 0 });
    }
    step() {
        if (this.trap) return false;
        if (this.frames.length === 0) return false;
        if (this.steps >= this.maxSteps) {
            this.trap = 'step limit (' + this.maxSteps + ') exceeded — possible infinite loop';
            return false;
        }
        if (this.recordHistory) {
            this.history.push(this.snapshot());
            if (this.history.length > 500) this.history.shift();
        }
        const frame = this.frames[this.frames.length - 1];
        const instrs = frame.func.instrs;
        const pc = frame.pc;
        if (pc >= instrs.length) {
            this.frames.pop();
            return true;
        }
        const instr = instrs[pc];
        frame.pc = pc + 1;
        this.steps++;
        this.execInstr(frame, instr);
        return true;
    }
    execInstr(frame, instr) {
        const op = instr.op;
        switch (op) {
            case 'block':
            case 'loop':
            case 'if': {
                frame.control.push({
                    kind: op,
                    startPc: frame.pc,
                    endPc: instr.endPc,
                    elsePc: instr.elsePc !== undefined ? instr.elsePc : -1,
                    height: this.stack.length,
                    arity: instr.blockType ? 1 : 0,
                });
                if (op === 'if') {
                    const cond = this.popI32();
                    if (cond === 0) {
                        const entry = frame.control[frame.control.length - 1];
                        if (entry.elsePc >= 0) frame.pc = entry.elsePc + 1;
                        else frame.pc = entry.endPc;
                    }
                }
                return;
            }
            case 'else': {
                const entry = frame.control[frame.control.length - 1];
                if (entry && entry.kind === 'if') {
                    frame.control.pop();
                    frame.pc = entry.endPc + 1;
                }
                return;
            }
            case 'end': {
                const entry = frame.control.pop();
                if (!entry) { this.trap = 'control stack underflow'; return; }
                if (entry.kind === 'func') {
                    const fn = frame.func;
                    const results = [];
                    for (let k = 0; k < fn.results.length; k++) results.unshift(this.pop());
                    if (this.stack.length > entry.height) this.stack.length = entry.height;
                    results.forEach((r) => this.stack.push(r));
                    this.frames.pop();
                    return;
                }
                const arity = entry.arity;
                let res = null;
                if (arity > 0) res = this.pop();
                if (this.stack.length > entry.height) this.stack.length = entry.height;
                if (res) this.stack.push(res);
                return;
            }
            case 'br':
                this.doBr(frame, instr);
                return;
            case 'br_if': {
                const cond = this.popI32();
                if (cond !== 0) this.doBr(frame, instr);
                return;
            }
            case 'return':
                this.doBr(frame, { depth: frame.control.length - 1 });
                return;
            case 'call': {
                const idx = typeof instr.func === 'number' ? instr.func : this.module.resolveFunc(instr.func);
                const meta = this.getFuncMeta(idx);
                const args = [];
                for (let k = 0; k < meta.params.length; k++) args.unshift(this.pop());
                this.callFuncIndex(idx, args);
                return;
            }
            case 'drop':
                this.pop();
                return;
            case 'nop':
                return;
            case 'unreachable':
                this.trap = 'unreachable instruction executed';
                return;
            case 'i32.const':
                this.stack.push({ type: 'i32', val: instr.val | 0 });
                return;
            case 'i64.const':
                this.stack.push({ type: 'i64', val: BigInt(instr.val) });
                return;
            case 'f32.const':
                this.stack.push({ type: 'f32', val: Math.fround(instr.val) });
                return;
            case 'f64.const':
                this.stack.push({ type: 'f64', val: instr.val });
                return;
            case 'v128.const':
                this.stack.push({ type: 'v128', bytes: instr.bytes.slice() });
                return;
            case 'local.get': {
                const idx = typeof instr.local === 'number' ? instr.local : this.resolveLocal(frame, instr.local);
                this.stack.push(frame.locals[idx]);
                return;
            }
            case 'local.set': {
                const idx = typeof instr.local === 'number' ? instr.local : this.resolveLocal(frame, instr.local);
                frame.locals[idx] = this.pop();
                return;
            }
            case 'local.tee': {
                const idx = typeof instr.local === 'number' ? instr.local : this.resolveLocal(frame, instr.local);
                frame.locals[idx] = this.stack[this.stack.length - 1];
                return;
            }
            case 'global.get': {
                const idx = typeof instr.global === 'number' ? instr.global : this.module.resolveGlobal(instr.global);
                this.stack.push(this.globals[idx]);
                return;
            }
            case 'global.set': {
                const idx = typeof instr.global === 'number' ? instr.global : this.module.resolveGlobal(instr.global);
                this.globals[idx] = this.pop();
                return;
            }
            case 'memory.size':
                this.pushI32(this.memPages);
                return;
            case 'memory.grow': {
                const delta = this.popI32();
                if (delta <= 0) { this.pushI32(this.memPages); return; }
                if (this.memPages + delta > 16) { this.pushI32(-1); return; }
                const old = this.memPages;
                const newMem = new Uint8Array((this.memPages + delta) * 65536);
                newMem.set(this.memory);
                this.memory = newMem;
                this.memPages += delta;
                this.pushI32(old);
                return;
            }
            case 'select': {
                const cond = this.popI32();
                const b = this.pop();
                const a = this.pop();
                this.stack.push(cond !== 0 ? a : b);
                return;
            }
            default:
                if (/^(i32|i64|f32|f64)\./.test(op)) { this.execNumeric(op); return; }
                if (op.includes('load')) { this.execLoad(op, instr); return; }
                if (op.includes('store')) { this.execStore(op, instr); return; }
                if (/^(i8x16|i16x8|i32x4|i64x2|f32x4|f64x2)\./.test(op)) { this.execSimd(op, instr); return; }
                this.trap = 'unsupported instruction: ' + op;
        }
    }
    resolveLocal(frame, ref) {
        if (typeof ref === 'number') return ref;
        if (frame.func.namedLocals && frame.func.namedLocals.has(ref)) return frame.func.namedLocals.get(ref);
        const idx = parseInt(ref.slice(1), 10);
        if (!Number.isNaN(idx) && idx >= 0 && idx < frame.func.nLocalsTotal) return idx;
        return 0;
    }
    doBr(frame, instr) {
        const depth = typeof instr.depth === 'number' ? instr.depth : 0;
        const entry = frame.control[frame.control.length - 1 - depth];
        if (!entry) { this.trap = 'invalid branch depth ' + depth; return; }
        if (entry.kind === 'func') {
            const fn = frame.func;
            const results = [];
            for (let k = 0; k < fn.results.length; k++) results.unshift(this.pop());
            if (this.stack.length > entry.height) this.stack.length = entry.height;
            results.forEach((r) => this.stack.push(r));
            this.frames.pop();
            return;
        }
        const arity = entry.arity;
        let res = null;
        if (arity > 0) res = this.pop();
        if (this.stack.length > entry.height) this.stack.length = entry.height;
        if (res) this.stack.push(res);
        frame.control.length = frame.control.length - 1 - depth;
        if (entry.kind === 'loop') frame.pc = entry.startPc;
        else frame.pc = entry.endPc + 1;
    }
    execNumeric(op) {
        const parts = op.split('.');
        const t = parts[0];
        const name = parts.slice(1).join('.');
        const bin = { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, and: (a, b) => a & b, or: (a, b) => a | b, xor: (a, b) => a ^ b };
        if (bin[name] !== undefined) {
            const b = this.pop();
            const a = this.pop();
            let r;
            if (t === 'i64') r = bin[name](BigInt(a.val), BigInt(b.val));
            else if (t === 'f32') r = bin[name](Math.fround(a.val), Math.fround(b.val));
            else if (t === 'f64') r = bin[name](a.val, b.val);
            else r = toI32(bin[name](a.val | 0, b.val | 0));
            this.stack.push({ type: t, val: r });
            return;
        }
        if (name === 'eqz') {
            const a = this.pop();
            this.pushI32((t === 'i64' ? a.val === 0n : a.val === 0) ? 1 : 0);
            return;
        }
        if (name === 'div_s' || name === 'div_u' || name === 'rem_s' || name === 'rem_u') {
            const b = this.pop();
            const a = this.pop();
            if (Number(b.val) === 0) { this.trap = t + ' div/rem by zero'; return; }
            let r;
            if (t === 'i64') {
                const av = BigInt(a.val);
                const bv = BigInt(b.val);
                r = name.includes('rem') ? av % bv : av / bv;
            } else {
                const av = a.val | 0;
                const bv = b.val | 0;
                r = name.includes('rem') ? av % bv : toI32(av / bv);
            }
            this.stack.push({ type: t, val: r });
            return;
        }
        if (name === 'shl' || name === 'shr_s' || name === 'shr_u' || name === 'rotl' || name === 'rotr') {
            const b = this.pop();
            const a = this.pop();
            const shift = Number(b.val) & (t === 'i64' ? 63 : 31);
            let r;
            if (t === 'i64') {
                const av = BigInt(a.val);
                if (name === 'shl') r = av << BigInt(shift);
                else if (name === 'shr_s') r = av >> BigInt(shift);
                else if (name === 'shr_u') r = BigInt.asUintN(64, av) >> BigInt(shift);
                else r = av;
            } else {
                const av = a.val | 0;
                if (name === 'shl') r = toI32(av << shift);
                else if (name === 'shr_s') r = toI32(av >> shift);
                else if (name === 'shr_u') r = (av >>> shift) >>> 0;
                else r = av;
            }
            this.stack.push({ type: t, val: r });
            return;
        }
        const cmp = {
            eq: (a, b) => a === b, ne: (a, b) => a !== b,
            lt_s: (a, b) => a < b, lt_u: (a, b) => a < b,
            gt_s: (a, b) => a > b, gt_u: (a, b) => a > b,
            le_s: (a, b) => a <= b, le_u: (a, b) => a <= b,
            ge_s: (a, b) => a >= b, ge_u: (a, b) => a >= b,
            lt: (a, b) => a < b, gt: (a, b) => a > b, le: (a, b) => a <= b, ge: (a, b) => a >= b,
        };
        if (cmp[name] !== undefined) {
            const b = this.pop();
            const a = this.pop();
            let av = a.val, bv = b.val;
            if (t === 'i64') { av = BigInt(a.val); bv = BigInt(b.val); }
            else if (t === 'i32') {
                if (name.endsWith('_u')) { av = a.val >>> 0; bv = b.val >>> 0; }
                else { av = a.val | 0; bv = b.val | 0; }
            }
            this.pushI32(cmp[name](av, bv) ? 1 : 0);
            return;
        }
        if (name === 'clz') {
            const a = this.pop();
            this.stack.push({ type: 'i32', val: 31 - Math.clz32(a.val >>> 0) });
            return;
        }
        if (name === 'ctz') {
            const a = this.pop();
            let v = a.val >>> 0;
            let n = 0;
            if (v === 0) n = 32;
            else {
                while ((v & 1) === 0) { n++; v >>>= 1; }
            }
            this.stack.push({ type: 'i32', val: n });
            return;
        }
        if (name === 'popcnt') {
            const a = this.pop();
            let v = a.val >>> 0;
            let n = 0;
            while (v) { v &= v - 1; n++; }
            this.stack.push({ type: 'i32', val: n });
            return;
        }
        if (name === 'wrap_i64') {
            const a = this.pop();
            this.pushI32(Number(BigInt.asIntN(32, BigInt(a.val))));
            return;
        }
        if (name === 'extend_i32_s' || name === 'extend_i32_u') {
            const a = this.pop();
            this.stack.push({ type: 'i64', val: name === 'extend_i32_s' ? BigInt(a.val | 0) : BigInt(a.val >>> 0) });
            return;
        }
        if (name === 'convert_i32_s' || name === 'convert_i32_u') {
            const a = this.pop();
            const v = name.endsWith('_u') ? (a.val >>> 0) : a.val;
            this.stack.push({ type: t, val: t === 'f32' ? Math.fround(v) : v });
            return;
        }
        this.trap = 'unsupported numeric op: ' + op;
    }
    memBounds(addr, size) {
        if (addr < 0 || addr + size > this.memory.length) {
            this.trap = 'out-of-bounds memory access @ ' + addr;
            return true;
        }
        return false;
    }
    execLoad(op, instr) {
        const base = this.popI32();
        const addr = base + (instr.offset || 0);
        const dv = new DataView(this.memory.buffer);
        switch (op) {
            case 'i32.load': if (this.memBounds(addr, 4)) return; this.pushI32(dv.getInt32(addr, true)); return;
            case 'i32.load8_s': if (this.memBounds(addr, 1)) return; this.pushI32(dv.getInt8(addr)); return;
            case 'i32.load8_u': if (this.memBounds(addr, 1)) return; this.pushI32(dv.getUint8(addr)); return;
            case 'i32.load16_s': if (this.memBounds(addr, 2)) return; this.pushI32(dv.getInt16(addr, true)); return;
            case 'i32.load16_u': if (this.memBounds(addr, 2)) return; this.pushI32(dv.getUint16(addr, true)); return;
            case 'i64.load': if (this.memBounds(addr, 8)) return; this.stack.push({ type: 'i64', val: dv.getBigInt64(addr, true) }); return;
            case 'f32.load': if (this.memBounds(addr, 4)) return; this.stack.push({ type: 'f32', val: Math.fround(dv.getFloat32(addr, true)) }); return;
            case 'f64.load': if (this.memBounds(addr, 8)) return; this.stack.push({ type: 'f64', val: dv.getFloat64(addr, true) }); return;
            default: this.trap = 'unsupported load: ' + op;
        }
    }
    execStore(op, instr) {
        const val = this.pop();
        const base = this.popI32();
        const addr = base + (instr.offset || 0);
        const dv = new DataView(this.memory.buffer);
        switch (op) {
            case 'i32.store': if (this.memBounds(addr, 4)) return; dv.setInt32(addr, val.val | 0, true); return;
            case 'i32.store8': if (this.memBounds(addr, 1)) return; dv.setUint8(addr, val.val & 0xff); return;
            case 'i32.store16': if (this.memBounds(addr, 2)) return; dv.setUint16(addr, val.val & 0xffff, true); return;
            case 'i32.store32': if (this.memBounds(addr, 4)) return; dv.setUint32(addr, val.val >>> 0, true); return;
            case 'i64.store': if (this.memBounds(addr, 8)) return; dv.setBigInt64(addr, BigInt(val.val), true); return;
            case 'i64.store8': if (this.memBounds(addr, 1)) return; dv.setUint8(addr, Number(val.val) & 0xff); return;
            case 'i64.store16': if (this.memBounds(addr, 2)) return; dv.setUint16(addr, Number(val.val) & 0xffff, true); return;
            case 'f32.store': if (this.memBounds(addr, 4)) return; dv.setFloat32(addr, val.val, true); return;
            case 'f64.store': if (this.memBounds(addr, 8)) return; dv.setFloat64(addr, val.val, true); return;
            default: this.trap = 'unsupported store: ' + op;
        }
    }
    execSimd(op, instr) {
        const dot = op.indexOf('.');
        const shape = op.slice(0, dot);
        const name = op.slice(dot + 1);
        const info = SIMD_INFO[shape] || { lanes: 4, size: 4 };
        const laneGet = (item, lane) => {
            const dv = new DataView(item.bytes.buffer);
            const off = lane * info.size;
            if (info.size === 1) return item.bytes[off];
            if (info.size === 2) return dv.getUint16(off, true);
            if (info.size === 4) return shape.startsWith('f') ? dv.getFloat32(off, true) : dv.getUint32(off, true);
            return shape.startsWith('f') ? dv.getFloat64(off, true) : dv.getBigUint64(off, true);
        };
        const laneSet = (bytes, lane, v) => {
            const dv = new DataView(bytes.buffer);
            const off = lane * info.size;
            if (info.size === 1) bytes[off] = v & 0xff;
            else if (info.size === 2) dv.setUint16(off, v & 0xffff, true);
            else if (info.size === 4) {
                if (shape.startsWith('f')) dv.setFloat32(off, v, true);
                else dv.setUint32(off, v >>> 0, true);
            } else if (info.size === 8) {
                if (shape.startsWith('f')) dv.setFloat64(off, v, true);
                else dv.setBigUint64(off, BigInt(v), true);
            }
        };
        if (name === 'add') {
            const b = this.pop();
            const a = this.pop();
            const out = new Uint8Array(16);
            for (let k = 0; k < info.lanes; k++) laneSet(out, k, laneGet(a, k) + laneGet(b, k));
            this.stack.push({ type: 'v128', bytes: out });
            return;
        }
        if (name === 'splat') {
            const a = this.pop();
            const out = new Uint8Array(16);
            for (let k = 0; k < info.lanes; k++) laneSet(out, k, a.val);
            this.stack.push({ type: 'v128', bytes: out });
            return;
        }
        if (name === 'extract_lane_u' || name === 'extract_lane_s') {
            const lane = instr.lane || 0;
            const a = this.pop();
            const raw = laneGet(a, lane);
            if (info.size === 1 && name === 'extract_lane_s') this.pushI32(raw < 128 ? raw : raw - 256);
            else this.pushI32(raw);
            return;
        }
        this.trap = 'unsupported SIMD op: ' + op;
    }
}

function toI32(v) {
    return v | 0;
}

/* ─── Binary encoder (real .wasm subset) for the hex dump ─── */
function uleb(n) {
    n = Number(n);
    if (n < 0) n = n >>> 0;
    const out = [];
    do {
        let b = n & 0x7f;
        n = Math.floor(n / 128);
        if (n > 0) b |= 0x80;
        out.push(b);
    } while (n > 0);
    return out;
}

function sleb(n) {
    n = Number(n);
    let more = true;
    const out = [];
    while (more) {
        let byte = n & 0x7f;
        n = n >> 7;
        const signBit = byte & 0x40;
        if ((n === 0 && !signBit) || (n === -1 && signBit)) more = false;
        else byte |= 0x80;
        out.push(byte);
    }
    return out;
}

const VALTYPE = { i32: 0x7f, i64: 0x7e, f32: 0x7d, f64: 0x7c, v128: 0x7b };

const OPCODES = {
    unreachable: 0x00, nop: 0x01, block: 0x02, loop: 0x03, if: 0x04, else: 0x05, end: 0x0b,
    br: 0x0c, br_if: 0x0d, return: 0x0f, call: 0x10, drop: 0x1a, select: 0x1b,
    'local.get': 0x20, 'local.set': 0x21, 'local.tee': 0x22,
    'global.get': 0x23, 'global.set': 0x24,
    'i32.load': 0x28, 'i64.load': 0x29, 'f32.load': 0x2a, 'f64.load': 0x2b,
    'i32.load8_s': 0x2c, 'i32.load8_u': 0x2d, 'i32.load16_s': 0x2e, 'i32.load16_u': 0x2f,
    'i64.load8_s': 0x30, 'i64.load8_u': 0x31, 'i64.load16_s': 0x32, 'i64.load16_u': 0x33,
    'i64.load32_s': 0x34, 'i64.load32_u': 0x35,
    'i32.store': 0x36, 'i64.store': 0x37, 'f32.store': 0x38, 'f64.store': 0x39,
    'i32.store8': 0x3a, 'i32.store16': 0x3b, 'i64.store8': 0x3c, 'i64.store16': 0x3d,
    'i64.store32': 0x3e,
    'memory.size': 0x3f, 'memory.grow': 0x40,
    'i32.const': 0x41, 'i64.const': 0x42, 'f32.const': 0x43, 'f64.const': 0x44,
    'i32.eqz': 0x45, 'i32.eq': 0x46, 'i32.ne': 0x47, 'i32.lt_s': 0x48, 'i32.lt_u': 0x49,
    'i32.gt_s': 0x4a, 'i32.gt_u': 0x4b, 'i32.le_s': 0x4c, 'i32.le_u': 0x4d,
    'i32.ge_s': 0x4e, 'i32.ge_u': 0x4f,
    'i64.eqz': 0x50, 'i64.eq': 0x51, 'i64.ne': 0x52, 'i64.lt_s': 0x53, 'i64.lt_u': 0x54,
    'i64.gt_s': 0x55, 'i64.gt_u': 0x56, 'i64.le_s': 0x57, 'i64.le_u': 0x58,
    'i64.ge_s': 0x59, 'i64.ge_u': 0x5a,
    'f32.eq': 0x5b, 'f32.ne': 0x5c, 'f32.lt': 0x5d, 'f32.gt': 0x5e, 'f32.le': 0x5f, 'f32.ge': 0x60,
    'f64.eq': 0x61, 'f64.ne': 0x62, 'f64.lt': 0x63, 'f64.gt': 0x64, 'f64.le': 0x65, 'f64.ge': 0x66,
    'i32.clz': 0x67, 'i32.ctz': 0x68, 'i32.popcnt': 0x69,
    'i32.add': 0x6a, 'i32.sub': 0x6b, 'i32.mul': 0x6c, 'i32.div_s': 0x6d, 'i32.div_u': 0x6e,
    'i32.rem_s': 0x6f, 'i32.rem_u': 0x70, 'i32.and': 0x71, 'i32.or': 0x72, 'i32.xor': 0x73,
    'i32.shl': 0x74, 'i32.shr_s': 0x75, 'i32.shr_u': 0x76, 'i32.rotl': 0x77, 'i32.rotr': 0x78,
    'i64.clz': 0x79, 'i64.ctz': 0x7a, 'i64.popcnt': 0x7b,
    'i64.add': 0x7c, 'i64.sub': 0x7d, 'i64.mul': 0x7e, 'i64.div_s': 0x7f, 'i64.div_u': 0x80,
    'i64.rem_s': 0x81, 'i64.rem_u': 0x82, 'i64.and': 0x83, 'i64.or': 0x84, 'i64.xor': 0x85,
    'i64.shl': 0x86, 'i64.shr_s': 0x87, 'i64.shr_u': 0x88, 'i64.rotl': 0x89, 'i64.rotr': 0x8a,
    'i32.wrap_i64': 0xa7, 'i32.trunc_f32_s': 0xa8, 'i32.trunc_f32_u': 0xa9, 'i32.trunc_f64_s': 0xaa, 'i32.trunc_f64_u': 0xab,
    'i64.extend_i32_s': 0xac, 'i64.extend_i32_u': 0xad,
    'f32.convert_i32_s': 0xb2, 'f32.convert_i32_u': 0xb3, 'f32.convert_i64_s': 0xb4, 'f32.convert_i64_u': 0xb5,
    'f64.convert_i32_s': 0xb7, 'f64.convert_i32_u': 0xb8,
};

const SIMD_SUBOPCODES = {
    'v128.const': 0x0c, 'i8x16.splat': 0x0e, 'i32x4.splat': 0x11,
    'i8x16.extract_lane_u': 0x13, 'i8x16.extract_lane_s': 0x12,
    'i8x16.add': 0x6e, 'i16x8.add': 0x8a, 'i32x4.add': 0xa4, 'i64x2.add': 0xbe,
};

function encodeInstr(instr, ctx) {
    const out = [];
    if (SIMD_SUBOPCODES[instr.op] !== undefined) {
        out.push(0xfd);
        out.push(...uleb(SIMD_SUBOPCODES[instr.op]));
        if (instr.op === 'v128.const') out.push(...instr.bytes);
        if (instr.op.includes('extract_lane')) out.push(...uleb(instr.lane !== undefined ? instr.lane : 0));
        return out;
    }
    const opcode = OPCODES[instr.op];
    if (opcode === undefined) {
        throw new Error('cannot encode unsupported instruction: ' + instr.op);
    }
    out.push(opcode);
    if (instr.op === 'i32.const') out.push(...sleb(instr.val));
    else if (instr.op === 'i64.const') out.push(...sleb(Number(BigInt.asIntN(64, BigInt(instr.val)))));
    else if (instr.op === 'f32.const') {
        const buf = new ArrayBuffer(4);
        new DataView(buf).setFloat32(0, instr.val, true);
        out.push(...new Uint8Array(buf));
    } else if (instr.op === 'f64.const') {
        const buf = new ArrayBuffer(8);
        new DataView(buf).setFloat64(0, instr.val, true);
        out.push(...new Uint8Array(buf));
    } else if (instr.op === 'block' || instr.op === 'loop' || instr.op === 'if') {
        out.push(instr.blockType ? (VALTYPE[instr.blockType] !== undefined ? VALTYPE[instr.blockType] : 0x40) : 0x40);
    } else if (instr.op === 'br' || instr.op === 'br_if') {
        out.push(...uleb(instr.depth !== undefined ? instr.depth : 0));
    } else if (instr.op === 'call') {
        out.push(...uleb(ctx.resolveFunc(instr.func)));
    } else if (instr.op === 'local.get' || instr.op === 'local.set' || instr.op === 'local.tee') {
        out.push(...uleb(ctx.resolveLocal(instr.local)));
    } else if (instr.op === 'global.get' || instr.op === 'global.set') {
        out.push(...uleb(ctx.resolveGlobal(instr.global)));
    } else if (instr.op === 'memory.size' || instr.op === 'memory.grow') {
        out.push(0x00);
    } else if (instr.op.includes('load') || instr.op.includes('store')) {
        const m = instr.op.match(/store(8|16|32)?$/);
        const bits = m && m[1] ? parseInt(m[1], 10) : /32/.test(instr.op) ? 32 : 32;
        const naturalAlign = bits === 8 ? 0 : bits === 16 ? 1 : 2;
        let align = instr.align !== null && instr.align !== undefined ? Math.log2(instr.align) : naturalAlign;
        out.push(...uleb(Math.max(0, align)));
        out.push(...uleb(instr.offset || 0));
    }
    return out;
}

function strToBytes(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code < 0x80) out.push(code);
        else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        else out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
    return out;
}

function encodeModuleBinary(mod) {
    const bytes = [];
    bytes.push(0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00);

    const typeList = [];
    const typeIndex = new Map();
    const getTypeIndex = (sig) => {
        const key = JSON.stringify(sig);
        if (typeIndex.has(key)) return typeIndex.get(key);
        const idx = typeList.length;
        typeList.push(sig);
        typeIndex.set(key, idx);
        return idx;
    };
    const funcImports = mod.imports.filter((i) => i.kind === 'func');
    const memImports = mod.imports.filter((i) => i.kind === 'memory');
    const funcTypes = [];
    funcImports.forEach((imp) => funcTypes.push(getTypeIndex({ params: imp.params, results: imp.results })));
    mod.funcs.forEach((f) => funcTypes.push(getTypeIndex({ params: f.params, results: f.results })));

    /* type section */
    if (typeList.length > 0) {
        const sec = [];
        sec.push(...uleb(typeList.length));
        typeList.forEach((sig) => {
            sec.push(0x60);
            sec.push(...uleb(sig.params.length));
            sig.params.forEach((p) => sec.push(VALTYPE[p] !== undefined ? VALTYPE[p] : 0x7f));
            sec.push(...uleb(sig.results.length));
            sig.results.forEach((r) => sec.push(VALTYPE[r] !== undefined ? VALTYPE[r] : 0x7f));
        });
        bytes.push(1);
        bytes.push(...uleb(sec.length));
        bytes.push(...sec);
    }

    /* import section */
    const imports = [...funcImports, ...memImports];
    if (imports.length > 0) {
        const sec = [];
        sec.push(...uleb(imports.length));
        imports.forEach((imp) => {
            const modB = strToBytes(imp.module);
            const nameB = strToBytes(imp.name);
            sec.push(...uleb(modB.length), ...modB);
            sec.push(...uleb(nameB.length), ...nameB);
            if (imp.kind === 'func') {
                sec.push(0x00);
                sec.push(...uleb(funcTypes[funcImports.indexOf(imp)]));
            } else {
                sec.push(0x02, 0x00);
                sec.push(...uleb(imp.min || 1));
                if (imp.max !== null && imp.max !== undefined) { sec.push(0x01); sec.push(...uleb(imp.max)); }
                else sec.push(0x00);
            }
        });
        bytes.push(2);
        bytes.push(...uleb(sec.length));
        bytes.push(...sec);
    }

    /* function section */
    if (mod.funcs.length > 0) {
        const sec = [];
        sec.push(...uleb(mod.funcs.length));
        mod.funcs.forEach((f, i) => sec.push(...uleb(funcTypes[funcImports.length + i])));
        bytes.push(3);
        bytes.push(...uleb(sec.length));
        bytes.push(...sec);
    }

    /* memory section */
    if (mod.memory && memImports.length === 0) {
        const sec = [0x01, 0x00];
        sec.push(...uleb(mod.memory.min || 1));
        if (mod.memory.max !== null && mod.memory.max !== undefined) { sec.push(0x01); sec.push(...uleb(mod.memory.max)); }
        bytes.push(5);
        bytes.push(...uleb(sec.length));
        bytes.push(...sec);
    }

    /* global section */
    if (mod.globals.length > 0) {
        const sec = [];
        sec.push(...uleb(mod.globals.length));
        mod.globals.forEach((g) => {
            sec.push(VALTYPE[g.initType] !== undefined ? VALTYPE[g.initType] : 0x7f);
            sec.push(g.mut ? 0x01 : 0x00);
            if (g.initType === 'i32') { sec.push(0x41); sec.push(...sleb(g.init)); sec.push(0x0b); }
            else if (g.initType === 'i64') { sec.push(0x42); sec.push(...sleb(Number(BigInt.asIntN(64, BigInt(g.init))))); sec.push(0x0b); }
            else if (g.initType === 'f32') {
                sec.push(0x43);
                const buf = new ArrayBuffer(4);
                new DataView(buf).setFloat32(0, g.init, true);
                sec.push(...new Uint8Array(buf));
                sec.push(0x0b);
            } else if (g.initType === 'f64') {
                sec.push(0x44);
                const buf = new ArrayBuffer(8);
                new DataView(buf).setFloat64(0, g.init, true);
                sec.push(...new Uint8Array(buf));
                sec.push(0x0b);
            }
        });
        bytes.push(6);
        bytes.push(...uleb(sec.length));
        bytes.push(...sec);
    }

    /* export section */
    const funcExports = mod.exports
        .filter((e) => e.kind === 'func')
        .map((e) => ({ name: e.name, idx: typeof e.ref === 'number' ? e.ref : mod.resolveFunc(e.ref) }));
    const memExport = mod.memory && mod.memory.exportName ? mod.memory.exportName : null;
    const globExport = mod.globals.find((g) => g.exportName);
    const expCount = funcExports.length + (memExport ? 1 : 0) + (globExport ? 1 : 0);
    if (expCount > 0) {
        const sec = [];
        sec.push(...uleb(expCount));
        funcExports.forEach((e) => {
            const nb = strToBytes(e.name);
            sec.push(...uleb(nb.length), ...nb, 0x00, ...uleb(e.idx));
        });
        if (memExport) {
            const nb = strToBytes(memExport);
            sec.push(...uleb(nb.length), ...nb, 0x02, 0x00);
        }
        if (globExport) {
            const nb = strToBytes(globExport.exportName);
            const gidx = mod.globals.indexOf(globExport);
            sec.push(...uleb(nb.length), ...nb, 0x03, ...uleb(gidx));
        }
        bytes.push(7);
        bytes.push(...uleb(sec.length));
        bytes.push(...sec);
    }

    /* code section */
    if (mod.funcs.length > 0) {
        const sec = [];
        sec.push(...uleb(mod.funcs.length));
        mod.funcs.forEach((f) => {
            const body = [];
            const grouped = new Map();
            f.locals.forEach((l) => grouped.set(l, (grouped.get(l) || 0) + 1));
            body.push(...uleb(grouped.size));
            grouped.forEach((count, type) => {
                body.push(...uleb(count));
                body.push(VALTYPE[type] !== undefined ? VALTYPE[type] : 0x7f);
            });
            const ctx = {
                resolveFunc: (ref) => (typeof ref === 'number' ? ref : mod.resolveFunc(ref)),
                resolveGlobal: (ref) => (typeof ref === 'number' ? ref : mod.resolveGlobal(ref)),
                resolveLocal: (ref) => {
                    if (typeof ref === 'number') return ref;
                    const fn = f;
                    if (fn.namedLocals && fn.namedLocals.has(ref)) return fn.namedLocals.get(ref);
                    const idx = parseInt(ref.slice(1), 10);
                    return Number.isNaN(idx) ? 0 : idx;
                },
            };
            f.instrs.forEach((instr) => body.push(...encodeInstr(instr, ctx)));
            body.push(0x0b);
            sec.push(...uleb(body.length));
            sec.push(...body);
        });
        bytes.push(10);
        bytes.push(...uleb(sec.length));
        bytes.push(...sec);
    }

    /* data section */
    if (mod.data.length > 0 && mod.memory) {
        const sec = [];
        sec.push(...uleb(mod.data.length));
        mod.data.forEach((d) => {
            sec.push(0x00, 0x41);
            sec.push(...sleb(d.offset));
            sec.push(0x0b);
            sec.push(...uleb(d.bytes.length));
            sec.push(...d.bytes);
        });
        bytes.push(11);
        bytes.push(...uleb(sec.length));
        bytes.push(...sec);
    }

    return Uint8Array.from(bytes);
}

/* ─── Simulator UI ─── */
let currentVM = null;
let currentModuleAst = null;
let currentBinary = null;
let lastEntry = null;

function resetSimulator() {
    currentVM = null;
    currentModuleAst = null;
    currentBinary = null;
    if (DOM.terminalWindow) resetTerminal();
    if (DOM.bootStatus) setBootStatus('Ready', false);
    if (DOM.binaryHex) {
        DOM.binaryHex.innerHTML = '<div class="inspector-empty">No module assembled yet.</div>';
        DOM.binarySize.textContent = '0 bytes';
    }
    if (DOM.operandStack) DOM.operandStack.innerHTML = '<div class="inspector-empty">Stack is empty.</div>';
    if (DOM.stackDepthBadge) DOM.stackDepthBadge.textContent = 'Depth: 0';
    if (DOM.memoryHex) DOM.memoryHex.innerHTML = '<div class="inspector-empty">No memory declared.</div>';
    if (DOM.memoryPages) DOM.memoryPages.textContent = '0 pages';
    if (DOM.frameView) DOM.frameView.innerHTML = '<div class="inspector-empty">No active call frames.</div>';
}

function renderStackView() {
    if (!currentVM) return;
    const items = currentVM.stack;
    DOM.stackDepthBadge.textContent = 'Depth: ' + items.length;
    if (items.length === 0) {
        DOM.operandStack.innerHTML = '<div class="inspector-empty">Stack is empty.</div>';
        return;
    }
    DOM.operandStack.innerHTML = items
        .map((item, idx) => {
            const isTop = idx === items.length - 1;
            return `
                <div class="stack-item ${isTop ? 'stack-item--top' : ''}">
                    <span class="stack-type">${item.type}</span>
                    <span class="stack-val">${escHtml(fmtVal(item))}</span>
                </div>
            `;
        })
        .join('');
}

function renderMemoryView() {
    if (!currentVM || !currentVM.memory) {
        DOM.memoryHex.innerHTML = '<div class="inspector-empty">No memory declared.</div>';
        DOM.memoryPages.textContent = '0 pages';
        return;
    }
    DOM.memoryPages.textContent = currentVM.memPages + ' pages';
    const bytes = currentVM.memory;
    const rows = Math.min(8, Math.ceil(bytes.length / 16));
    let out = '';
    for (let r = 0; r < rows; r++) {
        const off = r * 16;
        let hex = '';
        let ascii = '';
        for (let c = 0; c < 16; c++) {
            const b = bytes[off + c];
            if (b !== undefined) {
                hex += b.toString(16).padStart(2, '0') + ' ';
                ascii += b >= 32 && b < 127 ? String.fromCharCode(b) : '.';
            }
        }
        out += `<span class="hex-offset">0x${off.toString(16).padStart(4, '0')}:</span> ${hex.padEnd(48)} ${ascii}\n`;
    }
    DOM.memoryHex.innerHTML = out;
}

function renderFrameView() {
    if (!currentVM) return;
    if (currentVM.frames.length === 0) {
        DOM.frameView.innerHTML = '<div class="inspector-empty">No active call frames.</div>';
        return;
    }
    const rows = [];
    currentVM.frames.forEach((f, fi) => {
        const fnName = f.func.name || ('$func_' + fi);
        const locals = f.locals
            .map((l, li) => `<span class="local-chip">${li}:${l.type} <strong>${escHtml(fmtVal(l))}</strong></span>`)
            .join('');
        rows.push(`
            <div class="frame-entry">
                <div class="frame-header">
                    <i class="fa-solid fa-cube"></i> ${escHtml(fnName)}
                    <span class="frame-pc">pc=${f.pc}</span>
                </div>
                <div class="frame-locals">${locals}</div>
            </div>
        `);
    });
    const globs = currentVM.globals.length
        ? `<div class="globals-row">${currentVM.globals
            .map((g, gi) => `<span class="local-chip">global${gi}:${g.type} <strong>${escHtml(fmtVal(g))}</strong></span>`)
            .join('')}</div>`
        : '';
    DOM.frameView.innerHTML = rows.join('') + globs;
}

function renderBinaryView(bytes) {
    if (!DOM.showHex.checked) {
        DOM.binaryHex.innerHTML = '<div class="inspector-empty">Hex dump hidden — tick "Show binary hex dump".</div>';
        DOM.binarySize.textContent = bytes.length + ' bytes';
        return;
    }
    let out = '';
    for (let i = 0; i < bytes.length; i += 16) {
        let hex = '';
        let ascii = '';
        for (let c = 0; c < 16 && i + c < bytes.length; c++) {
            const b = bytes[i + c];
            hex += b.toString(16).padStart(2, '0') + ' ';
            ascii += b >= 32 && b < 127 ? String.fromCharCode(b) : '.';
        }
        const tag = i === 0 ? 'hex-magic' : 'hex-offset';
        out += `<span class="${tag}">0x${i.toString(16).padStart(8, '0')}</span>  ${hex.padEnd(48)} ${ascii}\n`;
    }
    DOM.binaryHex.innerHTML = out;
    DOM.binarySize.textContent = bytes.length + ' bytes';
}

function runLogStep() {
    if (!currentVM) return;
    if (currentVM.frames.length === 0) {
        renderStackView();
        renderFrameView();
        return;
    }
    const frame = currentVM.frames[currentVM.frames.length - 1];
    const instr = frame.func.instrs[frame.pc - 1];
    const fnName = frame.func.name || 'func';
    if (instr) {
        let imm = '';
        if (instr.val !== undefined && instr.val !== null) imm = ' ' + fmtVal({ type: instr.type || 'i32', val: instr.val });
        else if (instr.local !== undefined) imm = ' ' + instr.local;
        else if (instr.func !== undefined) imm = ' ' + instr.func;
        else if (instr.global !== undefined) imm = ' ' + instr.global;
        else if (instr.label !== undefined) imm = ' ' + instr.label;
        else if (instr.offset) imm = ' offset=' + instr.offset;
        printLine('term-opcode', `${fnName}: ${instr.op}${imm}`);
    }
    renderStackView();
    renderMemoryView();
    renderFrameView();
}

function logBinaryValidation(bytes) {
    if (!bytes) return;
    let valid = false;
    try {
        valid = typeof WebAssembly !== 'undefined' && WebAssembly.validate(bytes);
    } catch (e) {
        valid = false;
    }
    if (valid) {
        printLine('term-success', `wasm-validate: OK — ${bytes.length} bytes, WebAssembly.validate() passed`);
    } else {
        printLine('term-warn', `wasm-validate: ${bytes.length} bytes emitted (validate did not pass — subset encoder)`);
    }
}

function compileWat() {
    resetSimulator();
    const src = DOM.watEditor.value;
    if (!src.trim()) {
        printLine('term-error', 'Error: empty editor. Write WAT or pick a preset.');
        setBootStatus('Error', false, 'error');
        return;
    }
    printLine('term-info', 'wat2wasm main.wat -o main.wasm');
    printLine('term-muted', '');
    try {
        const tokens = tokenizeWat(src);
        const parser = new WatParser(tokens);
        const mod = parser.parseModule();
        resolveModule(mod);
        currentModuleAst = mod;

        currentBinary = encodeModuleBinary(mod);
        renderBinaryView(currentBinary);
        printLine('term-log', `parse: ${tokens.length} tokens → ${mod.funcs.length} func(s), ${mod.imports.length} import(s), ${mod.memory ? 'memory ' + mod.memory.min + ' page(s)' : 'no memory'}`);
        printLine('term-log', `assemble: ${currentBinary.length} bytes of binary produced`);
        logBinaryValidation(currentBinary);

        currentVM = new WasmVM(mod, {
            env: {
                log: (n) => printLine('term-result', `// env.log(${n}) called from WASM`),
            },
        });
        printLine('term-success', 'instantiate: VM ready (memory, globals, imports resolved)');
        setBootStatus('Compiled', true);
        renderStackView();
        renderMemoryView();
        renderFrameView();
    } catch (err) {
        printLine('term-error', 'Error: ' + err.message);
        setBootStatus('Error', false, 'error');
    }
}

function determineEntry() {
    const mod = currentModuleAst;
    if (!mod) return null;
    if (mod.start) return { name: mod.start, args: [] };
    const funcExp = mod.exports.find((e) => e.kind === 'func');
    if (funcExp) {
        const idx = typeof funcExp.ref === 'number' ? funcExp.ref : mod.resolveFunc(funcExp.ref);
        const fn = currentVM.getFuncMeta(idx);
        return { name: funcExp.ref, args: fn ? fn.params.map(() => 0) : [] };
    }
    return null;
}

function runToEnd() {
    if (!currentVM) {
        compileWat();
        if (!currentVM) return;
    }
    if (currentVM.running) return;
    currentVM.running = true;
    currentVM.recordHistory = false;
    try {
        const entry = lastEntry ? { name: lastEntry, args: lastEntryArgs || [] } : determineEntry();
        if (entry) {
            printLine('term-muted', '');
            printLine('term-info', `calling ${entry.name || 'entry'}(${(entry.args || []).map(String).join(', ') || ''})`);
            currentVM.history = [];
            currentVM.callEntry(entry.name, entry.args || []);
        }
        let guard = 0;
        while (currentVM.frames.length > 0 && guard < 20000 && !currentVM.trap) {
            if (!currentVM.step()) break;
            if (guard < 60 || guard % 25 === 0) runLogStep();
            guard++;
        }
        if (currentVM.frames.length === 0 && !currentVM.trap) {
            const top = currentVM.stack[currentVM.stack.length - 1];
            if (top) printLine('term-result', `result: ${top.type} ${fmtVal(top)}`);
            printLine('term-success', `finished in ${guard} steps`);
        } else if (currentVM.trap) {
            printLine('term-error', '// TRAP: ' + currentVM.trap);
            setBootStatus('Trapped', false, 'error');
        }
        renderStackView();
        renderMemoryView();
        renderFrameView();
    } finally {
        currentVM.running = false;
    }
}

let lastEntryArgs = null;

function stepForward() {
    if (!currentVM) {
        compileWat();
        if (!currentVM) return;
    }
    currentVM.recordHistory = true;
    if (currentVM.frames.length === 0 && currentModuleAst) {
        const entry = lastEntry ? { name: lastEntry, args: lastEntryArgs || [] } : determineEntry();
        if (entry) {
            printLine('term-info', `calling ${entry.name || 'entry'}(${(entry.args || []).map(String).join(', ') || ''})`);
            currentVM.callEntry(entry.name, entry.args || []);
        }
    }
    const advanced = currentVM.step();
    runLogStep();
    if (currentVM.trap) {
        printLine('term-error', '// TRAP: ' + currentVM.trap);
        setBootStatus('Trapped', false, 'error');
    }
    if (!advanced && currentVM.frames.length === 0) {
        const top = currentVM.stack[currentVM.stack.length - 1];
        if (top) printLine('term-result', `result: ${top.type} ${fmtVal(top)}`);
        printLine('term-success', 'module finished');
    }
}

function stepBack() {
    if (!currentVM) return;
    const prev = currentVM.history.pop();
    if (!prev) {
        printLine('term-muted', '// nothing to step back to');
        return;
    }
    currentVM.restore(prev);
    renderStackView();
    renderMemoryView();
    renderFrameView();
    printLine('term-muted', '// stepped back one instruction');
}

function syncPresetSelect() {
    const src = DOM.watEditor.value.trim();
    let matched = null;
    for (const key in PRESETS) {
        if (PRESETS[key].wat.trim() === src) {
            matched = key;
            break;
        }
    }
    DOM.presetSelect.value = matched || 'custom';
}

function resetPlaygroundState() {
    const lesson = getActiveLesson();
    DOM.watEditor.value = lesson.defaultCode || DEFAULT_WAT;
    lastEntry = null;
    lastEntryArgs = null;
    resetSimulator();
    syncPresetSelect();
    if (DOM.terminalWindow) {
        printLine('term-muted', '// Reset. Pick a preset or write WAT, then press "wat2wasm".');
    }
}

function renderPlayground() {
    if (!DOM.watEditor.value.trim()) {
        const lesson = getActiveLesson();
        DOM.watEditor.value = lesson.defaultCode || DEFAULT_WAT;
        lastEntry = null;
        lastEntryArgs = null;
        resetSimulator();
    }
    syncPresetSelect();
    DOM.activeModuleTitle.textContent = getActiveModule().title + ' — WAT → WASM Simulator';
}

function setupPlayground() {
    resetPlaygroundState();
    DOM.compileBtn.addEventListener('click', compileWat);
    DOM.runBtn.addEventListener('click', runToEnd);
    DOM.stepFwdBtn.addEventListener('click', stepForward);
    DOM.stepBackBtn.addEventListener('click', stepBack);
    DOM.showHex.addEventListener('change', () => {
        if (currentBinary) renderBinaryView(currentBinary);
    });

    DOM.clearPgBtn.addEventListener('click', () => {
        resetPlaygroundState();
    });

    DOM.presetSelect.addEventListener('change', (e) => {
        const preset = PRESETS[e.target.value];
        if (preset) {
            DOM.watEditor.value = preset.wat;
            resetSimulator();
            lastEntry = preset.entry;
            lastEntryArgs = preset.args;
            printLine('term-muted', `// Loaded preset: ${preset.label}`);
        }
    });

    DOM.watEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.substring(0, start) + '  ' + e.target.value.substring(end);
            e.target.selectionStart = e.target.selectionEnd = start + 2;
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            compileWat();
        }
    });

    DOM.watEditor.addEventListener('input', () => {
        syncPresetSelect();
    });
}

/* ─── Quiz ─── */
function renderQuiz() {
    const mod = getActiveModule();
    const quizId = mod.id + '-quiz';
    const isCompleted = isItemComplete(quizId);

    if (!mod.quiz || mod.quiz.length === 0) {
        DOM.quizContainer.innerHTML = `
            <div class="quiz-container" style="text-align:center; padding:3rem;">
                <i class="fa-solid fa-clipboard-check" style="font-size:3rem; color:#654ff0; opacity:0.5; margin-bottom:1rem;"></i>
                <h3 style="font-family:var(--font-display); color:#475569; margin-bottom:0.5rem;">No Quiz Available</h3>
                <p style="color:#94a3b8; font-size:0.9rem;">This module doesn't have a quiz yet. Continue to the next module.</p>
            </div>
        `;
        DOM.activeModuleTitle.textContent = mod.title + ' — Quiz';
        return;
    }

    DOM.activeModuleTitle.textContent = mod.title + ' — Quiz';

    let html = `<h2>${escHtml(mod.title)} Quiz</h2>`;

    mod.quiz.forEach((q, idx) => {
        const selected = state.quizAnswers[q.id];
        const showResult = isCompleted;

        html += `
            <div class="quiz-question-card">
                <div class="quiz-question-number">Question ${idx + 1} of ${mod.quiz.length}</div>
                <div class="quiz-question-text">${escHtml(q.question)}</div>
                <div class="quiz-options">
                    ${q.options
                        .map((opt, optIdx) => {
                            let classes = 'quiz-option';
                            if (selected === optIdx) classes += ' selected';
                            if (showResult && optIdx === q.correct) classes += ' correct';
                            if (showResult && selected === optIdx && optIdx !== q.correct) classes += ' incorrect';
                            return `
                                <div class="${classes}" data-question-id="${q.id}" data-option-index="${optIdx}">
                                    <input type="radio" name="quiz-${q.id}" value="${optIdx}"
                                        ${selected === optIdx ? 'checked' : ''} ${showResult ? 'disabled' : ''}>
                                    <label>${escHtml(opt)}</label>
                                </div>
                            `;
                        })
                        .join('')}
                </div>
            </div>
        `;
    });

    if (!isCompleted) {
        const allAnswered = mod.quiz.every((q) => state.quizAnswers[q.id] !== undefined);
        html += `
            <div class="quiz-submit-section">
                <button id="submit-quiz-btn" class="quiz-submit-btn" ${!allAnswered ? 'disabled' : ''}>
                    <i class="fas fa-paper-plane"></i> Submit Quiz
                </button>
            </div>
        `;
    }

    if (isCompleted) {
        html += `
            <div class="quiz-result quiz-result--pass">
                <i class="fas fa-check-circle"></i> Perfect! Module Complete!
            </div>
        `;
    } else if (state.quizSubmitted) {
        const score = mod.quiz.filter((q) => state.quizAnswers[q.id] === q.correct).length;
        const total = mod.quiz.length;
        html += `
            <div class="quiz-result quiz-result--fail">
                <i class="fas fa-redo-alt"></i> Score: ${score}/${total} — adjust your answers and try again.
            </div>
        `;
    }

    DOM.quizContainer.innerHTML = html;
}

function submitQuiz() {
    const mod = getActiveModule();
    state.quizSubmitted = true;
    let score = 0;

    mod.quiz.forEach((q) => {
        if (state.quizAnswers[q.id] === q.correct) score++;
    });

    const quizId = mod.id + '-quiz';
    if (score === mod.quiz.length) {
        markItemComplete(quizId);
        renderSidebar();
        updateProgress();
    }

    renderQuiz();
}

/* ─── Mobile Sidebar ─── */
function openSidebar() {
    DOM.sidebar.classList.add('open');
    DOM.sidebarOverlay.classList.add('active');
}

function closeSidebar() {
    DOM.sidebar.classList.remove('open');
    DOM.sidebarOverlay.classList.remove('active');
}

function setupSidebar() {
    DOM.openSidebarBtn.addEventListener('click', openSidebar);
    DOM.closeSidebarBtn.addEventListener('click', closeSidebar);
    DOM.sidebarOverlay.addEventListener('click', closeSidebar);

    DOM.moduleList.addEventListener('click', (e) => {
        const btn = e.target.closest('.sidebar-module-btn');
        if (btn && btn.dataset.moduleId) {
            changeModule(btn.dataset.moduleId);
        }
    });
}

function setupQuiz() {
    DOM.quizContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.quiz-option');
        if (option && option.dataset.questionId && option.dataset.optionIndex) {
            const module = getActiveModule();
            const quizId = module.id + '-quiz';
            if (isItemComplete(quizId)) return;
            state.quizSubmitted = false;
            state.quizAnswers[option.dataset.questionId] = parseInt(option.dataset.optionIndex);
            renderQuiz();
            return;
        }

        const submitBtn = e.target.closest('#submit-quiz-btn');
        if (submitBtn && !submitBtn.disabled) {
            submitQuiz();
        }
    });
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    loadProgress();
    setupSidebar();
    setupPlayground();
    setupMarkComplete();
    setupQuiz();

    DOM.tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    renderSidebar();
    renderLesson();
    updateProgress();
});
