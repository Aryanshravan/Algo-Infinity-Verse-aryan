/**
 * ELI5 (Explain Like I'm 5) content for WebAssembly Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5WebassemblyData = {
  // ─── Module 1: WASM Basics & Binary Format ───

  'wasm-basics-1': `
    <p><strong>WebAssembly</strong> is like a <strong>universal shipping container</strong> for code. Languages like C, C++, Rust, and Go pack their programs into a standard, sealed box (the <code>.wasm</code> file) that any port in the world — Chrome, Firefox, Safari, Node.js, Deno — knows exactly how to unload and run.</p>
    <ul>
      <li><strong>It's a compilation target</strong> — nobody "writes" it by hand usually; it's the destination your other code gets shipped to, like a factory sending goods to a distribution center.</li>
      <li><strong>Near-native speed</strong> — browsers take the box apart and turn it into real machine code, so it runs almost as fast as an app installed on your computer.</li>
      <li><strong>Safe by design</strong> — the container has reinforced walls (the sandbox): it can't reach into your laptop's files, network, or other tabs unless you hand it the keys.</li>
      <li><strong>Compact</strong> — the box is small and fast to ship over the internet, so pages load quickly.</li>
    </ul>
    <p><strong>In short:</strong> WebAssembly is a fast, safe, portable "shipping container" format that lets compiled code from many languages run in the browser.</p>
  `,

  'wasm-basics-2': `
    <p>A <code>.wasm</code> file is like a <strong>recipe written in a very compact shorthand</strong>. Every instruction in the recipe is a small code number, and the whole file is just a long list of numbers packed tightly together.</p>
    <ul>
      <li><strong>The magic header</strong> — the very first bytes are <code>\\0asm</code>, like the stamp on a passport that says "this is a WebAssembly module."</li>
      <li><strong>LEB128 numbers</strong> — the trick for small files. A recipe that uses small numbers (like "add 3") doesn't waste a full byte slot. Numbers are packed so that small numbers use fewer bytes — like writing "3" instead of "00000003."</li>
      <li><strong>Sections</strong> — the recipe is split into labeled chapters: one for the ingredients (types), one for the functions (code), one for the storage bins (memory), and so on.</li>
      <li><strong>Deterministic</strong> — the same recipe always produces the same dish. No surprises, same output every run.</li>
    </ul>
    <p><strong>In short:</strong> a wasm binary is a compact, numbered recipe book — magic header, packed LEB128 numbers, and labeled sections — designed to be small and predictable.</p>
  `,

  // ─── Module 2: Module Lifecycle ───

  'wasm-lifecycle-1': `
    <p><strong>Compiling WebAssembly</strong> is like a <strong>chef reading a recipe and preparing the kitchen</strong>. You hand the chef the recipe card (the bytes), and the chef doesn't start cooking yet — first they read every line and make sure nothing is missing or confusing.</p>
    <ul>
      <li><strong>Parsing</strong> — reading the recipe, byte by byte, into a structured list of steps.</li>
      <li><strong>Validating</strong> — the safety check. Does every ingredient exist? Are the steps in the right order? Is every number type correct? If any step is fishy, the chef throws the recipe away — the whole module is rejected, not just the one bad line.</li>
      <li><strong>Compiling</strong> — translating the recipe into actual machine code, like pre-chopping all the vegetables before the pan is hot.</li>
    </ul>
    <p><strong>In short:</strong> compiling = read the recipe, verify every step is valid, then translate it into fast machine code before anything actually runs.</p>
  `,

  'wasm-lifecycle-2': `
    <p><strong>Instantiating</strong> is like <strong>starting the kitchen for real</strong>. The recipe (module) is ready, but to cook you need an actual kitchen: stoves, pans, ingredients, and a place to put finished dishes.</p>
    <ul>
      <li><strong>Imports</strong> — the kitchen supplies you must provide. If the recipe says "needs an oven from outside," you must hand one over when you instantiate, or the kitchen can't open.</li>
      <li><strong>Memory</strong> — a blank countertop where the recipe can stack and store things while working.</li>
      <li><strong>Exports</strong> — the finished dishes the recipe says it will hand back to you: functions you can call, memory you can read.</li>
      <li><strong>Instance</strong> — the live, running kitchen. The same recipe can open multiple kitchens at once, each with its own countertop and its own dishes.</li>
    </ul>
    <p><strong>In short:</strong> instantiate = supply the imports, set up the memory, and start the kitchen so you can finally call the exported functions.</p>
  `,

  // ─── Module 3: Memory & the Linear Memory Model ───

  'wasm-memory-1': `
    <p><strong>WASM's linear memory</strong> is like a <strong>single, long shelf of lockers</strong>. Imagine one gigantic row of numbered boxes: box 0, box 1, box 2, and so on, all in a straight line. Each box holds one byte.</p>
    <ul>
      <li><strong>Linear</strong> — no fancy shapes, no pointers with curves. Every address is just a number along one line, from 0 up.</li>
      <li><strong>Pages</strong> — memory comes in fixed-size bundles called pages (64 KiB each). You can't order "half a page" of shelf space — it's all-or-nothing, like buying paper in reams.</li>
      <li><strong>Bound by the shelf</strong> — the code can only reach boxes that actually exist. Reaching past the end is a <em>trap</em>, and the whole program halts safely instead of crashing the browser.</li>
      <li><strong>Shared with JS</strong> — the browser tab owns the shelf too; JavaScript can peek into the same boxes (via <code>ArrayBuffer</code>) to see what the WASM code stored.</li>
    </ul>
    <p><strong>In short:</strong> linear memory is one big numbered shelf of byte-sized boxes, bought in page-size bundles, shared with JavaScript, and guarded so you can never fall off the edge.</p>
  `,

  'wasm-memory-2': `
    <p>Reading and writing memory is like <strong>using the lockers</strong> on that big shelf.</p>
    <ul>
      <li><strong>Loads</strong> (<code>i32.load</code>) — opening locker #10 and taking out 4 bytes to use. You say which locker and how many bytes you want.</li>
      <li><strong>Stores</strong> (<code>i32.store</code>) — putting a value into a locker. The address tells you <em>where</em>, the value is <em>what</em> you put in.</li>
      <li><strong>Offsets</strong> — like a sticky note saying "start at locker 16 but add 4." It lets code read near a base address without recalculating every time.</li>
      <li><strong><code>memory.grow</code></strong> — buying more shelf space. The shelf can extend (a few pages at a time), and grow returns the old size — or -1 if there's no more room, like a storage unit that's full.</li>
    </ul>
    <p><strong>In short:</strong> loads take bytes out of the lockers, stores put bytes in, offsets fine-tune the spot, and memory.grow adds more shelf when you need it.</p>
  `,

  // ─── Module 4: Imports, Exports & JS Interop ───

  'wasm-js-interop-1': `
    <p><strong>Exports</strong> are like <strong>the doors a restaurant leaves open for customers</strong>. The kitchen (WASM) keeps most of its work hidden, but it marks a few doors as public: "Through this door you can call <code>add</code>," "through this one you can reach the counter (memory)."</p>
    <ul>
      <li><strong>Exported functions</strong> — the dishes you can actually order. JavaScript calls them like any normal JS function.</li>
      <li><strong>Exported memory</strong> — a window into the lockers, so JS and WASM can share data by writing bytes back and forth instead of passing big copies.</li>
      <li><strong>No hidden magic</strong> — only what's exported is visible. Everything else stays sealed in the kitchen.</li>
    </ul>
    <p><strong>In short:</strong> exports are the public interface — the specific functions and memory the WASM module chooses to open up to JavaScript.</p>
  `,

  'wasm-js-interop-2': `
    <p><strong>Imports</strong> are like <strong>the outside suppliers a restaurant depends on</strong>. The recipe might say "this dish needs an oven, and the oven comes from the outside world." When you start the kitchen, you hand the oven over — and now the WASM code can use it.</p>
    <ul>
      <li><strong>Calling back into JS</strong> — a WASM function can call an imported JS function, like the chef paging the front desk. Great for logging, DOM updates, or anything WASM can't do alone.</li>
      <li><strong>Supplied at instantiation</strong> — the import object you pass (with <code>env</code> and named functions) is the "supplier list." Missing a supplier and the kitchen refuses to open.</li>
      <li><strong>The BigInt gotcha</strong> — JS numbers top out at 53 safe bits. WASM's 64-bit numbers (<code>i64</code>) are like prices bigger than the cash register can show; the register can't handle them unless you switch to <code>BigInt</code> (the extra-large display). Pass <code>BigInt</code> for <code>i64</code> or numbers get silently wrong.</li>
    </ul>
    <p><strong>In short:</strong> imports are the outside tools you must supply; WASM can call back into JS through them, and <code>i64</code> values need BigInt to cross the border correctly.</p>
  `,

  // ─── Module 5: WAT & Toolchains ───

  'wasm-toolchains-1': `
    <p><strong>WAT</strong> is like <strong>assembly with training wheels and good labels</strong>. The raw binary uses numbers (<code>0x20</code> = get local), which is hard to read. WAT rewrites those as words you can actually read: <code>local.get</code>, <code>i32.add</code>, <code>if</code>, <code>end</code>.</p>
    <ul>
      <li><strong>Readable mnemonics</strong> — instructions get friendly names instead of mystery numbers.</li>
      <li><strong>Text ↔ binary</strong> — the two forms are exact mirrors. A tool like <code>wat2wasm</code> translates the readable text into the compact binary, and <code>wasm2wat</code> does the reverse. It's like a recipe in plain English vs. the same recipe in shorthand symbols.</li>
      <li><strong>Stack machine</strong> — operations push and pop values on a stack, like stacking plates: put 2 on, put 3 on, then "add" takes both and puts one result back.</li>
      <li><strong>Great for debugging</strong> — when you need to see what a module actually does, WAT is the form you read.</li>
    </ul>
    <p><strong>In short:</strong> WAT is the human-readable text form of WebAssembly — same instructions as the binary, but with readable names and stack-based logic.</p>
  `,

  'wasm-toolchains-2': `
    <p><strong>Toolchains</strong> are like <strong>different kitchens that all cook into the same shipping container</strong>. You write in the language you like; the toolchain handles packing it into wasm.</p>
    <ul>
      <li><strong>wabt</strong> — the workbench for working with WAT directly: <code>wat2wasm</code> to compile text to binary, <code>wasm2wat</code> to decompile, <code>wasm-validate</code> to check a file.</li>
      <li><strong>Emscripten (C/C++)</strong> — the big import/export company. It turns C/C++ code into wasm <em>plus</em> a JS "glue" file that handles memory and file systems, so your C program's <code>printf</code> and file calls still work on the web.</li>
      <li><strong>rustc (Rust)</strong> — the lean boutique. Rust can target <code>wasm32-unknown-unknown</code> directly, producing a small wasm with no runtime baggage, perfect for libraries.</li>
    </ul>
    <p><strong>In short:</strong> pick your kitchen: wabt for raw WAT, Emscripten for C/C++ with lots of glue, rustc for small, clean Rust modules.</p>
  `,

  // ─── Module 6: SIMD & Performance ───

  'wasm-simd-1': `
    <p><strong>SIMD</strong> (Single Instruction, Multiple Data) is like a <strong>paint roller instead of a brush</strong>. A normal brush paints one stripe at a time. A roller paints four stripes at once. Same arm movement, four times the wall.</p>
    <ul>
      <li><strong>v128</strong> — a 128-bit-wide "board" that can hold several smaller numbers side by side, like a tray with 4 hot dogs, or 8 fries, or 16 tater tots.</li>
      <li><strong>Lanes</strong> — the compartments in the tray. You decide the lane width: 4 × <code>i32</code>, 8 × <code>i16</code>, or 16 × <code>i8</code>.</li>
      <li><strong>One instruction, all lanes</strong> — <code>i32x4.add</code> adds all four lanes at once, like one sweep of the roller covering four stripes.</li>
      <li><strong>Great for media</strong> — image filters, audio mixing, and vector math process thousands of small numbers, so "one sweep, many results" is a huge win.</li>
    </ul>
    <p><strong>In short:</strong> SIMD = a paint roller for data. One instruction operates on many numbers at once (v128 with lanes), speeding up repetitive math.</p>
  `,

  'wasm-simd-2': `
    <p><strong>When does WASM really win?</strong> Think of it like choosing a <strong>cargo train vs. a delivery van</strong>.</p>
    <ul>
      <li><strong>WASM wins:</strong> compute-heavy, predictable loops that process the same data shape over and over — image processing, game physics, cryptography, compression. It's a cargo train moving millions of identical boxes.</li>
      <li><strong>JS wins:</strong> DOM updates, async I/O, and short one-off computations. The delivery van doesn't need a train station to start moving.</li>
      <li><strong>Beware the crossing gate:</strong> every call from JS to WASM (and back) pays a crossing cost — converting values, marshaling data. Calling tiny WASM functions in a tight loop is like a train stopping at a crossing every block: slower than just driving.</li>
      <li><strong>Measure first:</strong> JIT-compiled JS can already be very fast. Profile before you rewrite.</li>
    </ul>
    <p><strong>In short:</strong> use WASM for heavy, uniform computation; keep DOM and small quick work in JS; and batch your calls to avoid the expensive JS↔WASM boundary.</p>
  `,

  // ─── Module 7: Security & Limitations ───

  'wasm-security-1': `
    <p><strong>The WASM sandbox</strong> is like a <strong>bank teller behind bulletproof glass</strong>. The code can compute, store, and return results, but it cannot reach into your wallet, your phone, or the other customers — unless you deliberately pass something through the slot.</p>
    <ul>
      <li><strong>No direct system access</strong> — no files, no sockets, no process control. Any of that requires a JS host function handed in via imports.</li>
      <li><strong>Bound-checked memory</strong> — reading past the end of the lockers traps safely instead of corrupting memory. No buffer-overflow escapes.</li>
      <li><strong>Validated before running</strong> — the module is checked top to bottom at compile time, so malformed or type-unsafe code never executes.</li>
      <li><strong>Deterministic</strong> — same input, same behavior, making behavior auditable.</li>
    </ul>
    <p><strong>In short:</strong> WASM code runs in a sealed teller booth — it's fast and safe, but it only touches your machine through explicitly provided host functions.</p>
  `,

  'wasm-security-2': `
    <p><strong>Even a well-guarded vault has weak spots</strong> — and WASM's weaknesses are mostly around its <em>edges</em> and <em>people</em>.</p>
    <ul>
      <li><strong>Supply chain risk</strong> — the real danger is what's shipped <em>inside</em> the box. A malicious library compiled to wasm is still malicious once it's running; the sandbox limits damage but doesn't judge the code's intent.</li>
      <li><strong>Side channels</strong> — timing differences and cache behavior can still leak secrets, just like on native CPUs.</li>
      <li><strong>DoS by resource use</strong> — a module that grows memory forever or spins an infinite loop can freeze a tab. The sandbox doesn't stop it from being wasteful.</li>
      <li><strong>Host function trust</strong> — every import you expose is a door. A careless <code>env.fs</code> import reopens access the sandbox was supposed to seal.</li>
    </ul>
    <p><strong>In short:</strong> the sandbox stops memory corruption and raw OS access, but you still need to audit what you compile, which host functions you expose, and how much CPU/memory you let modules consume.</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5WebassemblyData = eli5WebassemblyData;
