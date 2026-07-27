// --- Curriculum Data ---
const curriculum = [
  // ─── Module 1: Node.js Basics & Global Objects ───
  {
    id: 'node-basics',
    title: 'Node.js Basics & Global Objects',
    lessons: [
      {
        id: 'nb-1',
        title: 'Introduction to Node.js',
        objectives: [
          'Understand what Node.js is and how it differs from browser JavaScript',
          'Recognize the V8 JavaScript engine and its role in Node.js',
          'Identify key use cases for Node.js in backend development',
          'Appreciate Node.js as an asynchronous, event-driven runtime',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">JavaScript Outside the Browser</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JavaScript on the server, outside of a web browser.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Unlike the browser, Node doesn't have a <code>window</code> or <code>document</code> object. Instead, it provides global objects like <code>process</code>, <code>__dirname</code>, and <code>module</code>.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Node.js is <strong>asynchronous by nature</strong> — it uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. This means it can handle many operations at once without waiting for each one to finish.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> http = <span class="text-blue-600">require</span>(<span class="text-green-600">'http'</span>);</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> server = http.<span class="text-purple-600">createServer</span>((req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">writeHead</span>(<span class="text-orange-500">200</span>, { <span class="text-green-600">'Content-Type'</span>: <span class="text-green-600">'text/plain'</span> });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">end</span>(<span class="text-green-600">'Hello from Node.js!'</span>);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700">server.<span class="text-purple-600">listen</span>(<span class="text-orange-500">3000</span>, () => <span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(<span class="text-green-600">'Server running on port 3000'</span>));</p>
          </div>
          <div class="bg-green-50 border-l-4 border-[#339933] p-4 my-6 rounded-r-lg">
            <p class="text-green-800 font-medium">Head over to the Terminal Simulator tab to try logging global objects!</p>
          </div>
        `,
        defaultCode: `// Log a simple message
console.log("Hello from Node.js!");

// Access the global process object (simulated)
console.log("Process Architecture:", process.arch);
console.log("Process Platform:", process.platform);

// Working with paths
console.log("Current Directory:", __dirname);
console.log("Current File:", __filename);`,
        takeaways: [
          'Node.js is a JavaScript runtime built on the V8 engine, enabling server-side JavaScript',
          'Node provides global objects like process, __dirname, and module instead of window/document',
          'Node.js is asynchronous and non-blocking — it handles I/O efficiently without waiting',
          'Common use cases include web servers, APIs, CLI tools, and real-time applications',
        ],
      },
      {
        id: 'nb-2',
        title: 'Global Objects: process, __dirname, __filename',
        objectives: [
          'Understand the purpose of the process global object',
          'Use __dirname and __filename to resolve file paths',
          'Access environment variables through process.env',
          'Pass command-line arguments to a Node.js program',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Node.js Global Toolkit</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Node.js provides several <strong>global objects</strong> that are available everywhere without needing to require them. These give you access to the runtime environment.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// The process object — info about the running program</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(process.arch); <span class="text-gray-500">// 'x64'</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(process.platform); <span class="text-gray-500">// 'darwin', 'win32', 'linux'</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(process.env.NODE_ENV); <span class="text-gray-500">// Environment variable</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(process.argv); <span class="text-gray-500">// Command-line arguments</span></p>
            <p class="text-gray-700 mb-3"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(process.cwd()); <span class="text-gray-500">// Current working directory</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">// Path globals</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(__dirname); <span class="text-gray-500">// /Users/me/project/src</span></p>
            <p class="text-gray-700"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(__filename); <span class="text-gray-500">// /Users/me/project/src/app.js</span></p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>process.argv</code> is especially useful for building <strong>CLI tools</strong>. The first two elements are the Node path and script path; everything after that is user-provided arguments.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Best Practice:</strong> Use <code>process.env</code> for configuration that changes between environments (development, testing, production). Never hard-code secrets!</p>
          </div>
        `,
        defaultCode: `// Explore global objects
console.log("=== Process Info ===");
console.log("Architecture:", process.arch);
console.log("Platform:", process.platform);
console.log("Node Version:", process.version);
console.log("Current PID:", process.pid);
console.log("Uptime (seconds):", process.uptime());

console.log("");
console.log("=== Path Info ===");
console.log("__dirname:", __dirname);
console.log("__filename:", __filename);

console.log("");
console.log("=== Environment ===");
console.log("NODE_ENV:", process.env.NODE_ENV);`,
        takeaways: [
          'process gives runtime information: arch, platform, env, argv, cwd, memory usage',
          '__dirname is the absolute path of the directory containing the current file',
          '__filename is the absolute path including the file name',
          'process.env provides access to environment variables for configuration',
        ],
      },
      {
        id: 'nb-3',
        title: 'The Module System (CommonJS)',
        objectives: [
          'Understand how Node.js organizes code using modules',
          'Export values from a module using module.exports',
          'Import modules using require() with relative and absolute paths',
          'Distinguish between core modules, local modules, and third-party packages',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Organizing Code with Modules</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Node.js uses the <strong>CommonJS</strong> module system. Each file is its own module with its own scope. Variables and functions defined in one file are not accessible in another file unless explicitly exported.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// math.js — exporting utilities</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> add = (a, b) => a + b;</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> subtract = (a, b) => a - b;</p>
            <p class="text-gray-700 mb-3">module.<span class="text-purple-600">exports</span> = { add, subtract };</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// app.js — importing</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> math = <span class="text-blue-600">require</span>(<span class="text-green-600">'./math'</span>);</p>
            <p class="text-gray-700"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(math.add(<span class="text-orange-500">5</span>, <span class="text-orange-500">3</span>)); <span class="text-gray-500">// 8</span></p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">There are three types of modules: <strong>Core modules</strong> (like <code>fs</code>, <code>http</code>, <code>path</code> — built into Node.js), <strong>local modules</strong> (your own files like <code>./math.js</code>), and <strong>third-party modules</strong> (installed via npm like <code>express</code>).</p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Note:</strong> Node.js also supports ES modules (import/export) with <code>"type": "module"</code> in package.json or the <code>.mjs</code> extension. CommonJS (require/module.exports) is the traditional and still most widely used format.</p>
          </div>
        `,
        defaultCode: `// Simulating module system in one file
// In real Node.js, each require() loads a separate file

const myModule = {
  greet: (name) => "Hello, " + name + "!",
  add: (a, b) => a + b,
  PI: 3.14159
};

// Destructure the imported object
const { greet, add, PI } = myModule;

console.log(greet("Node.js"));
console.log("5 + 3 =", add(5, 3));
console.log("PI =", PI);

console.log("");
console.log("=== Core Modules Available ===");
console.log("fs:", typeof require('fs'));
console.log("http:", typeof require('http'));
console.log("path:", typeof require('path'));`,
        takeaways: [
          'Every file in Node.js is a module with its own scope',
          'Use module.exports to expose values and require() to import them',
          'Core modules, local modules, and npm packages use the same require() syntax',
          'CommonJS is the traditional module system; ES modules (import/export) are also supported',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-nb-1',
        question: 'Which of the following objects is available in a standard browser environment but NOT in Node.js?',
        options: ['console', 'Math', 'window', 'Date'],
        correct: 2,
      },
      {
        id: 'q-nb-2',
        question: 'Which global variable provides the absolute path of the directory containing the currently executing file?',
        options: ['__filename', 'process.cwd()', '__dirname', 'path.dir'],
        correct: 2,
      },
      {
        id: 'q-nb-3',
        question: 'How do you export a function from a CommonJS module so it can be required elsewhere?',
        options: ['export default function()', 'module.exports = myFunction', 'exports.default = myFunction', 'return myFunction'],
        correct: 1,
      },
      {
        id: 'q-nb-4',
        question: 'What does process.argv contain?',
        options: ['Only the script filename', 'Environment variables', 'Command-line arguments as an array', 'The current working directory'],
        correct: 2,
      },
      {
        id: 'q-nb-5',
        question: 'Which of the following is NOT a core module in Node.js?',
        options: ['fs', 'http', 'express', 'path'],
        correct: 2,
      },
    ],
  },
  // ─── Module 2: The File System (fs) ───
  {
    id: 'file-system',
    title: 'The File System (fs)',
    lessons: [
      {
        id: 'fs-1',
        title: 'Reading Files with fs',
        objectives: [
          'Import the fs module and understand its two APIs (async vs sync)',
          'Read file contents asynchronously using fs.readFile()',
          'Read file contents synchronously using fs.readFileSync()',
          'Understand the callback pattern for async file operations',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">The <code>fs</code> Module</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>fs</code> module provides an API for interacting with the file system. You can read, write, update, delete, and rename files.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">To use it, you must require it: <code>const fs = require('fs');</code></p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Async read (preferred — non-blocking)</span></p>
            <p class="text-gray-700 mb-1">fs.<span class="text-purple-600">readFile</span>(<span class="text-green-600">'./hello.txt'</span>, <span class="text-green-600">'utf8'</span>, (err, data) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (err) <span class="text-blue-600">throw</span> err;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(data);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Sync read (blocks execution until done)</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> data = fs.<span class="text-purple-600">readFileSync</span>(<span class="text-green-600">'./hello.txt'</span>, <span class="text-green-600">'utf8'</span>);</p>
            <p class="text-gray-700"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(data);</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">The <strong>async version</strong> takes a callback and returns immediately, allowing your program to do other work. The <strong>sync version</strong> blocks execution until the file is read — useful for startup configuration but avoid it during request handling.</p>
          <div class="bg-green-50 border-l-4 border-[#339933] p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Always prefer async!</strong> In a web server, blocking the event loop means ALL users wait. Async file reads let Node serve other requests while the file is being read.</p>
          </div>
        `,
        defaultCode: `// Require the built-in fs module
const fs = require('fs');

console.log("Reading file asynchronously...");

// Using our simulated fs module
fs.readFile('./hello.txt', 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }
    console.log("File contents:", data);
});

console.log("This logs BEFORE the file is read because fs.readFile is non-blocking!");`,
        takeaways: [
          'fs.readFile() reads files asynchronously with a callback (recommended)',
          'fs.readFileSync() reads files synchronously (use only at startup)',
          'The callback pattern: callback(err, data) — check err first, then use data',
          'Specify encoding (like "utf8") to get a string instead of a Buffer',
        ],
      },
      {
        id: 'fs-2',
        title: 'Writing and Appending to Files',
        objectives: [
          'Write content to files using fs.writeFile() and fs.writeFileSync()',
          'Append content to existing files using fs.appendFile()',
          'Understand the difference between overwriting and appending',
          'Handle errors in file write operations',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Writing to Files</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Writing data to files is a common task — logging, saving user data, creating reports, and more. Node provides <code>fs.writeFile()</code> to overwrite and <code>fs.appendFile()</code> to add to existing content.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Overwrite file content</span></p>
            <p class="text-gray-700 mb-1">fs.<span class="text-purple-600">writeFile</span>(<span class="text-green-600">'notes.txt'</span>, <span class="text-green-600">'Hello World'</span>, (err) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (err) <span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(err);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Append to file</span></p>
            <p class="text-gray-700 mb-1">fs.<span class="text-purple-600">appendFile</span>(<span class="text-green-600">'log.txt'</span>, <span class="text-green-600">'New log entry\n'</span>, (err) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (err) <span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(err);</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>writeFile</code> creates the file if it doesn't exist, or <strong>truncates</strong> (empties) it if it does, then writes the new content. <code>appendFile</code> also creates the file if missing, but adds content to the end without removing existing data.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Warning:</strong> <code>writeFile</code> silently overwrites existing files! Always double-check the file path to avoid accidentally deleting important data.</p>
          </div>
        `,
        defaultCode: `const fs = require('fs');

console.log("=== Writing to files ===");

// Write a new file (overwrites if exists)
fs.writeFile('./notes.txt', 'Hello from Node.js!', (err) => {
    if (err) {
        console.error("Write failed:", err);
        return;
    }
    console.log("File written successfully!");
});

// Append to a file
fs.appendFile('./log.txt', 'Server started at ' + new Date().toISOString() + '\n', (err) => {
    if (err) {
        console.error("Append failed:", err);
        return;
    }
    console.log("Log entry appended!");
});

console.log("Write operations initiated (they complete asynchronously)...");`,
        takeaways: [
          'fs.writeFile() overwrites existing files or creates new ones',
          'fs.appendFile() adds to the end of a file without removing existing content',
          'Both accept a callback that receives only an error (null on success)',
          'Always handle errors in file operations to avoid silent failures',
        ],
      },
      {
        id: 'fs-3',
        title: 'Working with Directories and Paths',
        objectives: [
          'Create directories using fs.mkdir() with recursive option',
          'List directory contents with fs.readdir()',
          'Check file/directory stats with fs.stat()',
          'Use the path module for cross-platform path manipulation',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Directories and Path Utilities</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Beyond individual files, you often need to work with <strong>directories</strong> (folders) and <strong>paths</strong>. The <code>fs</code> module handles directories, while the <code>path</code> module helps build and parse file paths cross-platform.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Create nested directories</span></p>
            <p class="text-gray-700 mb-1">fs.<span class="text-purple-600">mkdir</span>(<span class="text-green-600">'./data/logs'</span>, { recursive: <span class="text-blue-600">true</span> }, (err) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (err) <span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(err);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// List files in a directory</span></p>
            <p class="text-gray-700 mb-1">fs.<span class="text-purple-600">readdir</span>(<span class="text-green-600">'./'</span>, (err, files) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (err) <span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(err);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(files);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Build cross-platform paths</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> path = <span class="text-blue-600">require</span>(<span class="text-green-600">'path'</span>);</p>
            <p class="text-gray-700"><span class="text-blue-600">const</span> fullPath = path.<span class="text-purple-600">join</span>(__dirname, <span class="text-green-600">'data'</span>, <span class="text-green-600">'config.json'</span>);</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>path</code> module is essential for cross-platform compatibility. On macOS/Linux, paths use <code>/</code>; on Windows, they use <code>\</code>. <code>path.join()</code> handles this automatically.</p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Pro Tip:</strong> Always use <code>path.join()</code> instead of string concatenation for file paths. Your code will work on any operating system without modification!</p>
          </div>
        `,
        defaultCode: `const fs = require('fs');
const path = require('path');

console.log("=== Directory Operations ===");

// Create a directory with recursive option
fs.mkdir('./myapp/logs', { recursive: true }, (err) => {
    if (err) console.error("mkdir error:", err);
    else console.log("Directory created: myapp/logs");
});

// List current directory contents
console.log("");
console.log("Reading current directory...");
fs.readdir('./', (err, files) => {
    if (err) {
        console.error("readdir error:", err);
        return;
    }
    console.log("Files in current directory:", files.join(', '));
});

// Path utilities
console.log("");
console.log("=== Path Utilities ===");
console.log("Path to config:", path.join(__dirname, 'config', 'app.json'));
console.log("File extension of app.js:", path.extname('app.js'));
console.log("Base name of path:", path.basename('/usr/src/app/server.js'));`,
        takeaways: [
          'fs.mkdir() creates directories; use { recursive: true } for nested paths',
          'fs.readdir() lists files and directories in a given path',
          'fs.stat() provides metadata about a file or directory (size, permissions, etc.)',
          'The path module is essential for cross-platform path manipulation',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-fs-1',
        question: 'How do you import a core module like fs in a CommonJS Node environment?',
        options: ["import fs from 'fs'", "const fs = require('fs')", "load('fs')", "fetch('fs')"],
        correct: 1,
      },
      {
        id: 'q-fs-2',
        question: 'What is the main advantage of using fs.readFile() over fs.readFileSync()?',
        options: ['It is faster for small files', 'It does not block the event loop', 'It uses less memory', 'It supports more file formats'],
        correct: 1,
      },
      {
        id: 'q-fs-3',
        question: 'Which method adds content to the end of a file without removing existing content?',
        options: ['fs.writeFile()', 'fs.appendFile()', 'fs.createWriteStream()', 'fs.updateFile()'],
        correct: 1,
      },
      {
        id: 'q-fs-4',
        question: 'What does { recursive: true } do in fs.mkdir()?',
        options: ['Deletes the directory if it exists', 'Creates parent directories as needed', 'Makes the directory read-only', 'Copies all files into the directory'],
        correct: 1,
      },
    ],
  },
  // ─── Module 3: Building an HTTP Server ───
  {
    id: 'http-server',
    title: 'Building an HTTP Server',
    lessons: [
      {
        id: 'http-1',
        title: 'The HTTP Module and createServer',
        objectives: [
          'Create a basic HTTP server using http.createServer()',
          'Understand the request (req) and response (res) objects',
          'Read the request URL and HTTP method',
          'Send responses with res.end() and set status codes',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Creating a Web Server</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Node.js has a built-in <code>http</code> module that allows Node.js to transfer data over the Hyper Text Transfer Protocol (HTTP).</p>
          <p class="mb-4 text-gray-700 leading-relaxed">You use <code>http.createServer()</code> to create an HTTP server that listens to server ports and gives a response back to the client.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">const</span> http = <span class="text-blue-600">require</span>(<span class="text-green-600">'http'</span>);</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">const</span> server = http.<span class="text-purple-600">createServer</span>((req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(req.method, req.url);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">writeHead</span>(<span class="text-orange-500">200</span>, { <span class="text-green-600">'Content-Type'</span>: <span class="text-green-600">'text/html'</span> });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">end</span>(<span class="text-green-600">'&lt;h1&gt;Hello World&lt;/h1&gt;'</span>);</p>
            <p class="text-gray-700 mb-2">});</p>
            <p class="text-gray-700">server.<span class="text-purple-600">listen</span>(<span class="text-orange-500">3000</span>, () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(<span class="text-green-600">'Server running on http://localhost:3000'</span>);</p>
            <p class="text-gray-700">});</p>
          </div>
          <div class="bg-green-50 border-l-4 border-[#339933] p-4 my-6 rounded-r-lg">
            <p class="text-green-800 font-medium">The <code>req</code> object contains the request method, URL, headers, and body. The <code>res</code> object sends data back to the client with status codes, headers, and body content.</p>
          </div>
        `,
        defaultCode: `const http = require('http');

const server = http.createServer((req, res) => {
    console.log(\`Received request for: \${req.url}\`);
    
    // Set response header
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    
    // Send response body
    res.end('Hello, World! This is my first Node Server.');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(\`Server is running and listening on port \${PORT}\`);
});`,
        takeaways: [
          'http.createServer() creates a new HTTP server instance',
          'The request callback receives (req, res) — the request and response objects',
          'req.url and req.method tell you what the client requested',
          'res.writeHead() sets status code and headers; res.end() sends the body',
        ],
      },
      {
        id: 'http-2',
        title: 'Handling Requests and Routing',
        objectives: [
          'Read the request method (GET, POST, etc.) and URL',
          'Implement basic routing logic based on req.url and req.method',
          'Parse request bodies for POST submissions',
          'Return appropriate status codes for different scenarios',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Routing Requests</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A web server needs to respond differently based on the URL and HTTP method. This is called <strong>routing</strong>. With the raw <code>http</code> module, you handle routing manually with if/else or switch statements.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">const</span> server = http.<span class="text-purple-600">createServer</span>((req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (req.url === <span class="text-green-600">'/'</span> && req.method === <span class="text-green-600">'GET'</span>) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;res.<span class="text-purple-600">end</span>(<span class="text-green-600">'Home page'</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;} <span class="text-blue-600">else if</span> (req.url === <span class="text-green-600">'/api/users'</span>) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;res.<span class="text-purple-600">end</span>(<span class="text-green-600">'[{"id":1,"name":"Alice"}]'</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;} <span class="text-blue-600">else</span> {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;res.<span class="text-purple-600">writeHead</span>(<span class="text-orange-500">404</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;res.<span class="text-purple-600">end</span>(<span class="text-green-600">'404 Not Found'</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">For POST requests with a body (like form submissions), you need to collect data chunks from the request stream and parse the body when all data has arrived.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Good to know:</strong> Raw Node routing works fine for small apps, but for anything serious, use Express.js. Express handles routing, body parsing, and much more with a cleaner API.</p>
          </div>
        `,
        defaultCode: `const http = require('http');

const server = http.createServer((req, res) => {
    console.log(req.method + ' ' + req.url);

    // Simple router
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Welcome to the Home Page!');

    } else if (req.url === '/api/users' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
        ]));

    } else if (req.url === '/about') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>About Us</h1><p>Learning Node.js!</p>');

    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Page Not Found');
    }
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});`,
        takeaways: [
          'Manual routing uses if/else checks on req.url and req.method',
          'POST request bodies arrive in chunks and must be reassembled',
          'Always send a 404 response for unknown routes',
          'For production apps, Express.js provides a much cleaner routing solution',
        ],
      },
      {
        id: 'http-3',
        title: 'Response Headers and Status Codes',
        objectives: [
          'Set HTTP response headers using res.writeHead() and res.setHeader()',
          'Understand common HTTP status codes and their meanings',
          'Set Content-Type headers for different response types',
          'Implement redirects using the 302 status code',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Headers and Status Codes</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Every HTTP response includes a <strong>status code</strong> (tells the client if the request succeeded) and <strong>headers</strong> (tell the client how to interpret the response).</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Common status codes</span></p>
            <p class="text-gray-700 mb-1"><span class="text-orange-500">200</span> OK <span class="text-gray-500">— "Everything worked!"</span></p>
            <p class="text-gray-700 mb-1"><span class="text-orange-500">201</span> Created <span class="text-gray-500">— "New resource created!"</span></p>
            <p class="text-gray-700 mb-1"><span class="text-orange-500">301</span>/<span class="text-orange-500">302</span> Redirect <span class="text-gray-500">— "Moved to a new URL"</span></p>
            <p class="text-gray-700 mb-1"><span class="text-orange-500">400</span> Bad Request <span class="text-gray-500">— "You sent something wrong"</span></p>
            <p class="text-gray-700 mb-1"><span class="text-orange-500">404</span> Not Found <span class="text-gray-500">— "That page doesn't exist"</span></p>
            <p class="text-gray-700 mb-3"><span class="text-orange-500">500</span> Server Error <span class="text-gray-500">— "Something broke on our end"</span></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Setting headers</span></p>
            <p class="text-gray-700">res.<span class="text-purple-600">setHeader</span>(<span class="text-green-600">'Content-Type'</span>, <span class="text-green-600">'application/json'</span>);</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Common <strong>Content-Type</strong> values: <code>text/plain</code> (plain text), <code>text/html</code> (HTML web pages), <code>application/json</code> (JSON data), <code>text/css</code> (stylesheets), <code>image/png</code> (images).</p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Remember:</strong> Status codes are grouped: 2xx = success, 3xx = redirect, 4xx = client error (your fault), 5xx = server error (our fault).</p>
          </div>
        `,
        defaultCode: `const http = require('http');

const server = http.createServer((req, res) => {
    console.log(req.method + ' ' + req.url);

    // Route: home page
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Home</h1><p>Status codes practice</p>');

    // Route: JSON API
    } else if (req.url === '/api/data') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', code: 200 }));

    // Route: redirect
    } else if (req.url === '/old-page') {
        res.writeHead(302, { 'Location': '/new-page' });
        res.end();

    // Route: 404 catch-all
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404: Resource not found');
    }
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});`,
        takeaways: [
          'HTTP status codes communicate success (2xx), redirects (3xx), client errors (4xx), or server errors (5xx)',
          'Content-Type header tells the browser how to render the response',
          'Use 302 redirects with the Location header to point clients to a new URL',
          'Always set proper status codes — your API consumers depend on them',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-http-1',
        question: 'Which method is used on the http module to instantiate a new web server?',
        options: ['http.startServer()', 'http.newServer()', 'http.createServer()', 'http.listen()'],
        correct: 2,
      },
      {
        id: 'q-http-2',
        question: 'What does the req.url property contain?',
        options: ['The full URL with domain', 'The path portion of the URL', 'The query string only', 'The HTTP method'],
        correct: 1,
      },
      {
        id: 'q-http-3',
        question: 'Which HTTP status code means "Page Not Found"?',
        options: ['200', '301', '404', '500'],
        correct: 2,
      },
      {
        id: 'q-http-4',
        question: 'What Content-Type header should you set when returning JSON data?',
        options: ['text/plain', 'text/html', 'application/json', 'application/javascript'],
        correct: 2,
      },
    ],
  },
  // ─── Module 4: Express.js & REST APIs ───
  {
    id: 'express-rest',
    title: 'Express.js & REST APIs',
    lessons: [
      {
        id: 'ex-1',
        title: 'Introduction to Express.js',
        objectives: [
          'Understand what Express.js is and why it is used with Node.js',
          'Install Express.js via npm',
          'Create a basic Express server with routing',
          'Understand the request-response cycle in Express',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">What is Express.js?</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Express.js is a minimal and flexible Node.js web application framework. It simplifies building web applications and APIs by providing a clean routing API, middleware integration, and many utility methods.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">While the built-in <code>http</code> module works, Express reduces boilerplate significantly. For example, parsing request bodies, handling different HTTP methods, and serving static files are all one-liners with Express.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">const</span> express = <span class="text-blue-600">require</span>(<span class="text-green-600">'express'</span>);</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> app = express();</p>
            <p class="text-gray-700 mb-3"><span class="text-blue-600">const</span> port = <span class="text-orange-500">3000</span>;</p>
            <p class="text-gray-700 mb-2">app.<span class="text-purple-600">get</span>(<span class="text-green-600">'/'</span>, (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">send</span>(<span class="text-green-600">'Hello from Express!'</span>);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2">app.<span class="text-purple-600">get</span>(<span class="text-green-600">'/api/users'</span>, (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>([{ id: <span class="text-orange-500">1</span>, name: <span class="text-green-600">'Alice'</span> }]);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700">app.<span class="text-purple-600">listen</span>(port, () => <span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(<span class="text-green-600">'Server ready'</span>));</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Key Difference:</strong> With raw http, you check <code>req.url</code> manually. With Express, you write <code>app.get('/path', handler)</code> — cleaner, more readable, and easier to maintain.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
const port = 3000;

// Basic GET route
app.get('/', (req, res) => {
  console.log("Received GET request at /");
  res.send('Hello from Express!');
});

// JSON API route
app.get('/api/users', (req, res) => {
  console.log("Fetching users...");
  res.json([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
});

app.listen(port, () => {
  console.log('Express app listening on port ' + port);
});`,
        takeaways: [
          'Express is the most popular Node.js web framework, built on top of the http module',
          'Install with: npm install express',
          'app.get(), app.post(), etc. provide clean routing by method and path',
          'res.send() and res.json() simplify sending responses',
        ],
      },
      {
        id: 'ex-2',
        title: 'REST API Fundamentals',
        objectives: [
          'Understand REST principles and resource-based URL design',
          'Implement CRUD endpoints (GET, POST, PUT, DELETE)',
          'Use route parameters for dynamic URL segments',
          'Understand HTTP methods and their semantic meanings',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Building RESTful APIs</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">REST (Representational State Transfer) is an architectural style for designing networked applications. REST APIs use HTTP methods to perform CRUD operations on resources identified by URLs.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// REST endpoints for a "books" resource</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">GET</span> /books <span class="text-gray-500">— List all books</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">GET</span> /books/:id <span class="text-gray-500">— Get one book</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">POST</span> /books <span class="text-gray-500">— Create a new book</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">PUT</span> /books/:id <span class="text-gray-500">— Update a book</span></p>
            <p class="text-gray-700 mb-3"><span class="text-blue-600">DELETE</span> /books/:id <span class="text-gray-500">— Delete a book</span></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Express route with parameter</span></p>
            <p class="text-gray-700">app.<span class="text-purple-600">get</span>(<span class="text-green-600">'/books/:id'</span>, (req, res) => {</p>
            <p class="text-gray-700 mb-3">&nbsp;&nbsp;<span class="text-blue-600">const</span> bookId = req.<span class="text-purple-600">params</span>.id;</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">REST APIs typically return JSON responses. Use <code>res.status(201)</code> for created resources, <code>res.status(404)</code> for not found, and consistent error formats.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Best Practice:</strong> Keep your API responses consistent. Use a format like <code>{ success: true, data: ... }</code> or <code>{ error: "message" }</code> for errors.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

let books = [
  { id: 1, title: 'Node.js Basics', author: 'Alice' },
  { id: 2, title: 'Express Guide', author: 'Bob' }
];

// GET all books
app.get('/books', (req, res) => {
  res.json(books);
});

// GET a single book
app.get('/books/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

// POST a new book
app.post('/books', (req, res) => {
  const book = { id: books.length + 1, ...req.body };
  books.push(book);
  res.status(201).json(book);
});

app.listen(3000, () => console.log('API running on port 3000'));`,
        takeaways: [
          'REST APIs map HTTP methods to CRUD operations on resources',
          'Use route parameters (:id) to identify specific resources',
          'Return 201 for successful creation, 404 for missing resources',
          'Consistent response formats make APIs easier to consume',
        ],
      },
      {
        id: 'ex-3',
        title: 'Middleware and Static Files',
        objectives: [
          'Understand how middleware functions work in Express',
          'Use express.json() to parse request bodies',
          'Serve static files with express.static()',
          'Create custom middleware for logging and authentication',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Middleware in Express</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Middleware functions are functions that have access to the request object (<code>req</code>), the response object (<code>res</code>), and the <code>next</code> middleware function in the application's request-response cycle.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Custom logging middleware</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> logger = (req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(req.method + <span class="text-green-600">' '</span> + req.url);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;next(); <span class="text-gray-500">// Pass control to next handler</span></p>
            <p class="text-gray-700 mb-3">};</p>
            <p class="text-gray-700 mb-2">app.<span class="text-purple-600">use</span>(logger); <span class="text-gray-500">// Apply globally</span></p>
            <p class="text-gray-700 mb-2">app.<span class="text-purple-600">use</span>(express.<span class="text-purple-600">json</span>()); <span class="text-gray-500">// Parse JSON bodies</span></p>
            <p class="text-gray-700">app.<span class="text-purple-600">use</span>(express.<span class="text-purple-600">static</span>(<span class="text-green-600">'public'</span>)); <span class="text-gray-500">// Serve static files</span></p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Middleware runs in the order it's registered. If a middleware sends a response, the chain stops. Otherwise, it must call <code>next()</code> to pass control to the next middleware or route handler.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Order matters!</strong> Register <code>express.json()</code> before your routes that need to read <code>req.body</code>. If you register it after, the body won't be parsed when the route runs.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Custom logger middleware
const requestLogger = (req, res, next) => {
  console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.url);
  next();
};

// Register middleware (order matters!)
app.use(requestLogger);
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Hello! Check the terminal for request logs.');
});

app.post('/api/data', (req, res) => {
  console.log('Received body:', req.body);
  res.json({ received: true, data: req.body });
});

app.listen(3000, () => console.log('Server with middleware started'));`,
        takeaways: [
          'Middleware functions have access to req, res, and next()',
          'Call next() to pass control — omit it to end the cycle',
          'express.json() parses incoming JSON request bodies onto req.body',
          'express.static() serves files from a directory automatically',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-ex-1',
        question: 'How do you install Express.js in a Node.js project?',
        options: ['npm create express', 'npm install express', 'node install express', 'npm add express-server'],
        correct: 1,
      },
      {
        id: 'q-ex-2',
        question: 'Which Express method sends a JSON response?',
        options: ['res.send()', 'res.json()', 'res.render()', 'res.write()'],
        correct: 1,
      },
      {
        id: 'q-ex-3',
        question: 'What does app.use(express.json()) do?',
        options: ['Serves static JSON files', 'Parses incoming request bodies as JSON', 'Validates JSON schemas', 'Creates a JSON database'],
        correct: 1,
      },
      {
        id: 'q-ex-4',
        question: 'In a REST API, which HTTP method should be used to create a new resource?',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        correct: 1,
      },
    ],
  },
  // ─── Module 5: npm & Package Management ───
  {
    id: 'npm-packages',
    title: 'npm & Package Management',
    lessons: [
      {
        id: 'npm-1',
        title: 'Understanding npm',
        objectives: [
          'Understand what npm is and its role in the Node.js ecosystem',
          'Initialize a project with npm init',
          'Install packages using npm install',
          'Differentiate between dependencies and devDependencies',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">npm: Node Package Manager</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">npm is the default package manager for Node.js. It is a <strong>registry</strong> containing over two million packages, a <strong>command-line tool</strong> to install and manage them, and a <strong>dependency management system</strong> for your projects.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Initialize a new project</span></p>
            <p class="text-gray-700 mb-1">$ npm init -y <span class="text-gray-500">// Creates package.json</span></p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Install packages</span></p>
            <p class="text-gray-700 mb-1">$ npm install express <span class="text-gray-500">// Adds to dependencies</span></p>
            <p class="text-gray-700 mb-3">$ npm install --save-dev jest <span class="text-gray-500">// Adds to devDependencies</span></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Install everything from package.json</span></p>
            <p class="text-gray-700">$ npm install <span class="text-gray-500">// Reads package.json and installs all</span></p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>dependencies</code> are packages your app needs at runtime (express, mongoose, etc.). <code>devDependencies</code> are only needed during development (testing libraries, build tools, etc.).</p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Pro Tip:</strong> Always commit <code>package.json</code> and <code>package-lock.json</code> to Git. Never commit <code>node_modules</code> — it can be regenerated with <code>npm install</code>.</p>
          </div>
        `,
        defaultCode: `// Simulating npm commands in the terminal
console.log("=== npm Commands Demo ===");
console.log("");

console.log("$ npm init -y");
console.log("Created package.json");
console.log("");

console.log("$ npm install express");
console.log("+ express@4.18.2");
console.log("added 57 packages in 3s");
console.log("");

console.log("$ npm install --save-dev jest");
console.log("+ jest@29.7.0");
console.log("added 286 packages in 5s");
console.log("");

console.log("=== package.json contents ===");
const mockPackage = {
  name: "my-app",
  version: "1.0.0",
  dependencies: { express: "^4.18.0" },
  devDependencies: { jest: "^29.0.0" }
};
console.log(JSON.stringify(mockPackage, null, 2));`,
        takeaways: [
          'npm init creates a package.json file for your project',
          'npm install <package> adds it to dependencies, --save-dev adds to devDependencies',
          'dependencies are for runtime; devDependencies are for development',
          'node_modules should be in .gitignore; regenerate with npm install',
        ],
      },
      {
        id: 'npm-2',
        title: 'package.json and SemVer',
        objectives: [
          'Understand the structure of package.json',
          'Read and interpret Semantic Versioning (SemVer)',
          'Use npm scripts for common tasks',
          'Understand version ranges and the caret (^) operator',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">package.json and Semantic Versioning</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>package.json</code> file is the heart of any Node.js project. It contains metadata about your project, lists dependencies, and defines scripts for automation.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// package.json structure</span></p>
            <p class="text-gray-700 mb-1">{</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-green-600">"name"</span>: <span class="text-green-600">"my-app"</span>,</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-green-600">"version"</span>: <span class="text-green-600">"1.0.0"</span>,</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-green-600">"scripts"</span>: {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-green-600">"start"</span>: <span class="text-green-600">"node app.js"</span>,</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-green-600">"test"</span>: <span class="text-green-600">"jest"</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;},</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-green-600">"dependencies"</span>: {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-green-600">"express"</span>: <span class="text-green-600">"^4.18.0"</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-3">}</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// SemVer: MAJOR.MINOR.PATCH</span></p>
            <p class="text-gray-700 mb-1"><span class="text-orange-500">4</span>.<span class="text-orange-500">18</span>.<span class="text-orange-500">0</span></p>
            <p class="text-gray-700 mb-1">^<span class="text-orange-500">4</span> means compatible with 4.x.x</p>
            <p class="text-gray-700">~<span class="text-orange-500">4.18</span> means only patch updates (4.18.x)</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>npm run start</code> executes the <code>start</code> script. <code>npm test</code> executes the <code>test</code> script. You can define any custom scripts you need: <code>npm run build</code>, <code>npm run lint</code>, etc.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>SemVer Rule:</strong> PATCH (1.0.0 → 1.0.1) = bug fixes only. MINOR (1.0.0 → 1.1.0) = new features, backward compatible. MAJOR (1.0.0 → 2.0.0) = breaking changes.</p>
          </div>
        `,
        defaultCode: `// Simulate package.json and npm scripts
console.log("=== Package.json Demo ===");

const pkg = {
  name: "demo-app",
  version: "2.1.3",
  description: "A sample Node.js project",
  main: "index.js",
  scripts: {
    start: "node index.js",
    dev: "nodemon index.js",
    test: "jest --coverage",
    lint: "eslint ."
  },
  dependencies: {
    express: "^4.18.2",
    mongoose: "^7.0.0"
  },
  devDependencies: {
    jest: "^29.0.0",
    eslint: "^8.0.0"
  }
};

console.log(JSON.stringify(pkg, null, 2));
console.log("");
console.log("Version 2.1.3 means:");
console.log("  MAJOR: 2 (breaking changes)");
console.log("  MINOR: 1 (new features)");
console.log("  PATCH: 3 (bug fixes)");
console.log("");
console.log("Caret (^) means: allow minor and patch updates");
console.log("^4.18.2 allows 4.18.3, 4.19.0, but NOT 5.0.0");`,
        takeaways: [
          'package.json defines project metadata, scripts, and dependencies',
          'SemVer: MAJOR.MINOR.PATCH — major = breaking, minor = features, patch = fixes',
          'The caret (^) allows minor and patch updates but not major versions',
          'npm scripts automate common tasks via npm run <script-name>',
        ],
      },
      {
        id: 'npm-3',
        title: 'package-lock.json and npm Security',
        objectives: [
          'Understand the role of package-lock.json in dependency management',
          'Run npm audit to find and fix security vulnerabilities',
          'Use npx to run packages without installing them globally',
          'Understand the difference between global and local packages',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Lock Files and Security</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>package-lock.json</code> file is automatically generated when you modify <code>package.json</code> or run <code>npm install</code>. It <strong>locks</strong> the exact version of every package and its transitive dependencies.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Security audit</span></p>
            <p class="text-gray-700 mb-1">$ npm audit <span class="text-gray-500">// Scans for known vulnerabilities</span></p>
            <p class="text-gray-700 mb-3">$ npm audit fix <span class="text-gray-500">// Auto-fix vulnerabilities</span></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Run a package without installing</span></p>
            <p class="text-gray-700 mb-1">$ npx create-react-app my-app <span class="text-gray-500">// No global install needed!</span></p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// List outdated packages</span></p>
            <p class="text-gray-700">$ npm outdated</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Always commit <code>package-lock.json</code> to version control. It ensures that everyone on your team (and your production servers) uses the <strong>exact same versions</strong> of every dependency.</p>
          <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
            <p class="text-red-800"><strong>Security:</strong> Run <code>npm audit</code> regularly. Vulnerabilities in dependencies are one of the most common attack vectors in Node.js applications!</p>
          </div>
        `,
        defaultCode: `// Simulate npm audit and security commands
console.log("=== npm Security Demo ===");
console.log("");

console.log("$ npm audit");
console.log("# Run 6 audits");
console.log("# Found 2 vulnerabilities (1 low, 1 moderate)");
console.log("");

console.log("$ npm audit fix");
console.log("# Fixed 2 vulnerabilities");
console.log("+ Updated express from 4.18.0 to 4.18.2");
console.log("");

console.log("=== Best Practices ===");
console.log("1. Always commit package-lock.json");
console.log("2. Run npm audit before deployment");
console.log("3. Use npx instead of global installs");
console.log("4. Regularly update with npm update");
console.log("5. Check npm outdated for stale packages");`,
        takeaways: [
          'package-lock.json locks exact dependency versions for reproducible builds',
          'npm audit scans for known security vulnerabilities in your dependencies',
          'npx runs packages without installing them globally (great for CLI tools)',
          'Regularly update outdated packages and fix security vulnerabilities',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-npm-1',
        question: 'What command initializes a new Node.js project with a package.json file?',
        options: ['npm start', 'npm init', 'npm new', 'npm create'],
        correct: 1,
      },
      {
        id: 'q-npm-2',
        question: 'What does the caret (^) in "express": "^4.18.0" mean?',
        options: ['Only version 4.18.0 exactly', 'Any version 4.x.x (minor updates allowed)', 'Any version including 5.x.x', 'Only patch updates (4.18.x)'],
        correct: 1,
      },
      {
        id: 'q-npm-3',
        question: 'Which file should NOT be committed to version control?',
        options: ['package.json', 'package-lock.json', 'node_modules', '.gitignore'],
        correct: 2,
      },
      {
        id: 'q-npm-4',
        question: 'What does npm audit do?',
        options: ['Audits your code for bugs', 'Scans dependencies for security vulnerabilities', 'Checks for unused packages', 'Measures code performance'],
        correct: 1,
      },
      {
        id: 'q-npm-5',
        question: 'Which flag installs a package as a devDependency?',
        options: ['--global', '--save-dev', '--production', '--optional'],
        correct: 1,
      },
    ],
  },
  // ─── Module 6: Async/Await & Promises Deep Dive ───
  {
    id: 'async-await',
    title: 'Async/Await & Promises Deep Dive',
    lessons: [
      {
        id: 'async-1',
        title: 'Understanding Promises',
        objectives: [
          'Understand what a Promise is and its three states (pending, fulfilled, rejected)',
          'Create promises using the Promise constructor',
          'Consume promises using .then(), .catch(), and .finally()',
          'Chain multiple promises for sequential operations',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Promises in JavaScript</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A <strong>Promise</strong> is an object representing the eventual completion or failure of an asynchronous operation. It is a placeholder for a value that isn't known yet but will be resolved in the future.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Creating a Promise</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> myPromise = <span class="text-blue-600">new</span> <span class="text-purple-600">Promise</span>((resolve, reject) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;setTimeout(() => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;resolve(<span class="text-green-600">'Success!'</span>); <span class="text-gray-500">// or reject(new Error('Failed'))</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}, <span class="text-orange-500">1000</span>);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Consuming a Promise</span></p>
            <p class="text-gray-700 mb-1">myPromise</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;.<span class="text-purple-600">then</span>(result => <span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(result))</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;.<span class="text-purple-600">catch</span>(err => <span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(err))</p>
            <p class="text-gray-700">&nbsp;&nbsp;.<span class="text-purple-600">finally</span>(() => <span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(<span class="text-green-600">'Done'</span>));</p>
          </div>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Pending</strong> — Initial state, operation in progress</li>
            <li><strong>Fulfilled</strong> — Operation completed successfully (<code>.then()</code> runs)</li>
            <li><strong>Rejected</strong> — Operation failed (<code>.catch()</code> runs)</li>
          </ul>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Key Insight:</strong> Promises solve "callback hell" by allowing you to chain operations linearly instead of nesting callbacks inside callbacks.</p>
          </div>
        `,
        defaultCode: `console.log("=== Promise Demo ===");

function simulateAsyncTask(name, delay, shouldFail) {
  return new Promise((resolve, reject) => {
    console.log('Starting: ' + name);
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(name + ' failed!'));
      } else {
        resolve(name + ' completed after ' + delay + 'ms');
      }
    }, delay);
  });
}

console.log("Starting async operations...");

simulateAsyncTask('Task 1', 500, false)
  .then(result => {
    console.log(result);
    return simulateAsyncTask('Task 2', 300, false);
  })
  .then(result => {
    console.log(result);
    return simulateAsyncTask('Task 3', 200, true);
  })
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    console.error('Error caught:', err.message);
  })
  .finally(() => {
    console.log('All operations finished (with or without errors).');
  });`,
        takeaways: [
          'A Promise represents an eventual value — pending, fulfilled, or rejected',
          'Use .then() for success, .catch() for errors, .finally() for cleanup',
          'Promises chain — the return value of one .then() feeds into the next',
          'Promises solve callback hell by flattening nested async operations',
        ],
      },
      {
        id: 'async-2',
        title: 'async/await Syntax',
        objectives: [
          'Write async functions using the async keyword',
          'Pause promise execution with await',
          'Handle errors in async functions with try/catch',
          'Understand that async functions always return a Promise',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">async/await — Writing Async Code Like Sync</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>async/await</code> is syntactic sugar built on top of Promises. It lets you write asynchronous code that looks and behaves like synchronous code, making it much easier to read and reason about.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// async function always returns a Promise</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">async function</span> <span class="text-purple-600">fetchUserData</span>(userId) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">try</span> {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">const</span> user = <span class="text-blue-600">await</span> <span class="text-purple-600">getUser</span>(userId);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">const</span> posts = <span class="text-blue-600">await</span> <span class="text-purple-600">getPosts</span>(user.id);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> { user, posts };</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;} <span class="text-blue-600">catch</span> (err) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(<span class="text-green-600">'Failed:'</span>, err);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">throw</span> err; <span class="text-gray-500">// Re-throw for caller to handle</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700">}</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Every <code>async</code> function returns a Promise. If the function returns a value, the Promise resolves with that value. If it throws, the Promise rejects. This means you can <code>await</code> any async function.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Important:</strong> If you forget <code>await</code>, you get a Promise instead of the resolved value! Always use <code>await</code> when you need the actual data.</p>
          </div>
        `,
        defaultCode: `console.log("=== async/await Demo ===");

// Simulate an async API call
function fetchUser(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, name: 'User ' + id, email: 'user' + id + '@example.com' });
    }, 300);
  });
}

function fetchPosts(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, title: 'Post 1 by user ' + userId },
        { id: 2, title: 'Post 2 by user ' + userId }
      ]);
    }, 200);
  });
}

async function loadUserProfile(userId) {
  try {
    console.log('Loading user profile...');
    const user = await fetchUser(userId);
    console.log('User loaded:', user.name);

    const posts = await fetchPosts(user.id);
    console.log('Posts loaded:', posts.length + ' posts');

    return { user, posts };
  } catch (error) {
    console.error('Error loading profile:', error.message);
    throw error;
  }
}

// Call the async function
loadUserProfile(42).then(profile => {
  console.log('Profile complete!');
  console.log('User:', profile.user.name);
  console.log('Posts:', profile.posts.map(p => p.title).join(', '));
});`,
        takeaways: [
          'async/await makes async code read like synchronous code',
          'async functions always return a Promise',
          'Use try/catch to handle errors in async functions',
          'Forgetting await returns a Promise instead of the resolved value',
        ],
      },
      {
        id: 'async-3',
        title: 'Promise Combinators and Async Patterns',
        objectives: [
          'Run multiple promises in parallel with Promise.all()',
          'Handle the first resolved promise with Promise.race()',
          'Use Promise.allSettled() to get results regardless of rejection',
          'Apply async iterators for sequential streaming operations',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Promise Combinators</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">When you have multiple independent async operations, running them <strong>sequentially</strong> (one at a time) is wasteful. Promise combinators let you run them <strong>in parallel</strong> for much better performance.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Run in parallel — ALL must succeed</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> [users, products, orders] = <span class="text-blue-600">await</span> <span class="text-purple-600">Promise.all</span>([</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;fetchUsers(),</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;fetchProducts(),</p>
            <p class="text-gray-700 mb-3">&nbsp;&nbsp;fetchOrders()</p>
            <p class="text-gray-700 mb-3">]);</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// First one to finish wins</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> fastest = <span class="text-blue-600">await</span> <span class="text-purple-600">Promise.race</span>([</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;fetchFromServerA(),</p>
            <p class="text-gray-700 mb-3">&nbsp;&nbsp;fetchFromServerB()</p>
            <p class="text-gray-700 mb-3">]);</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// All complete, even with failures</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> results = <span class="text-blue-600">await</span> <span class="text-purple-600">Promise.allSettled</span>([</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;task1(),</p>
            <p class="text-gray-700">&nbsp;&nbsp;task2()</p>
            <p class="text-gray-700">]);</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Performance Tip:</strong> Use <code>Promise.all()</code> for independent API calls. For a dashboard showing users + products + orders, parallel fetching can be 3x faster!</p>
          </div>
        `,
        defaultCode: `console.log("=== Promise Combinators Demo ===");

function fetchData(name, delay, shouldFail) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(name + ' failed!');
      } else {
        resolve(name + ' data (' + delay + 'ms)');
      }
    }, delay);
  });
}

async function demoPromiseAll() {
  console.log('--- Promise.all (all must succeed) ---');
  try {
    const results = await Promise.all([
      fetchData('Users', 300, false),
      fetchData('Products', 200, false),
      fetchData('Orders', 100, false)
    ]);
    console.log('All results:', results);
  } catch (err) {
    console.error('One failed:', err);
  }
}

async function demoPromiseAllSettled() {
  console.log('');
  console.log('--- Promise.allSettled (all complete) ---');
  const results = await Promise.allSettled([
    fetchData('Task A', 200, false),
    fetchData('Task B', 100, true),
    fetchData('Task C', 300, false)
  ]);
  results.forEach((r, i) => {
    console.log('Task ' + (i + 1) + ':', r.status, r.value || r.reason);
  });
}

async function main() {
  await demoPromiseAll();
  await demoPromiseAllSettled();
  console.log('');
  console.log('Done! Parallel operations are much faster than sequential!');
}

main().catch(console.error);`,
        takeaways: [
          'Promise.all() runs promises in parallel — fails fast if any rejects',
          'Promise.race() returns the first settled promise (fastest wins)',
          'Promise.allSettled() returns all results regardless of success/failure',
          'Running independent tasks in parallel can dramatically improve performance',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-async-1',
        question: 'What are the three states of a Promise?',
        options: ['start, middle, end', 'pending, fulfilled, rejected', 'waiting, done, error', 'open, closed, error'],
        correct: 1,
      },
      {
        id: 'q-async-2',
        question: 'What does an async function always return?',
        options: ['A value', 'A Promise', 'A callback', 'An error'],
        correct: 1,
      },
      {
        id: 'q-async-3',
        question: 'Which Promise combinator runs multiple promises in parallel and fails if any one rejects?',
        options: ['Promise.race()', 'Promise.all()', 'Promise.allSettled()', 'Promise.any()'],
        correct: 1,
      },
      {
        id: 'q-async-4',
        question: 'What happens if you forget the await keyword when calling an async function?',
        options: ['The function throws an error', 'You get a Promise instead of the resolved value', 'The function runs twice', 'The code crashes'],
        correct: 1,
      },
    ],
  },
  // ─── Module 7: Events & Streams ───
  {
    id: 'events-streams',
    title: 'Events & Streams',
    lessons: [
      {
        id: 'ev-1',
        title: 'The EventEmitter Class',
        objectives: [
          'Understand the event-driven architecture of Node.js',
          'Create custom EventEmitters and emit events',
          'Register event listeners with .on() and .once()',
          'Remove event listeners when they are no longer needed',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Events in Node.js</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Node.js is built on an <strong>event-driven architecture</strong>. The <code>events</code> module provides the <code>EventEmitter</code> class, which is the foundation for many Node.js APIs (streams, HTTP servers, file system operations).</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">const</span> EventEmitter = <span class="text-blue-600">require</span>(<span class="text-green-600">'events'</span>);</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">const</span> emitter = <span class="text-blue-600">new</span> EventEmitter();</p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-1"><span class="text-gray-500">// Register a listener</span></p>
            <p class="text-gray-700 mb-1">emitter.<span class="text-purple-600">on</span>(<span class="text-green-600">'greet'</span>, (name) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(<span class="text-green-600">'Hello, '</span> + name + <span class="text-green-600">'!'</span>);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-1"><span class="text-gray-500">// Emit the event</span></p>
            <p class="text-gray-700">emitter.<span class="text-purple-600">emit</span>(<span class="text-green-600">'greet'</span>, <span class="text-green-600">'Node.js'</span>);</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">The EventEmitter follows the <strong>observer pattern</strong>: you create an emitter (the subject), register listeners (observers), and when something happens, the emitter notifies all registered listeners. It's like a radio station — one broadcast, many listeners.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Pro Tip:</strong> Use <code>emitter.once()</code> for one-time listeners, <code>emitter.removeListener()</code> to clean up, and <code>emitter.eventNames()</code> to debug active listeners.</p>
          </div>
        `,
        defaultCode: `const EventEmitter = require('events');

console.log("=== EventEmitter Demo ===");

// Create a custom emitter
const orderSystem = new EventEmitter();

// Register listeners
orderSystem.on('order', (orderId, item) => {
  console.log('New order #' + orderId + ' for: ' + item);
});

orderSystem.on('order', (orderId) => {
  console.log('[Kitchen] Preparing order #' + orderId + '...');
});

// One-time listener
orderSystem.once('order', (orderId) => {
  console.log('[Analytics] Order #' + orderId + ' logged for metrics');
});

orderSystem.on('ready', (orderId) => {
  console.log('Order #' + orderId + ' is ready for pickup!');
});

// Emit events
console.log('');
console.log('Customer places order...');
orderSystem.emit('order', 1001, 'Pizza');

console.log('');
console.log('Kitchen finishes cooking...');
orderSystem.emit('ready', 1001);

console.log('');
console.log('Customer orders again...');
orderSystem.emit('order', 1002, 'Burger');

console.log('');
console.log('Note: Analytics only logged for first order (once)');`,
        takeaways: [
          'EventEmitter implements the observer pattern — one emitter, many listeners',
          'Use .on() to register listeners, .emit() to trigger events',
          '.once() registers a listener that fires at most once',
          'Many Node.js core APIs (http, fs streams) are built on EventEmitter',
        ],
      },
      {
        id: 'ev-2',
        title: 'Understanding Streams',
        objectives: [
          'Understand what streams are and why they matter for performance',
          'Differentiate between Readable, Writable, Transform, and Duplex streams',
          'Read data from a readable stream using events',
          'Write data to a writable stream',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Streams: Processing Data Piece by Piece</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A <strong>stream</strong> is an abstract interface for working with streaming data. Streams let you process data piece by piece instead of loading everything into memory at once.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Reading a file with streams</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> fs = <span class="text-blue-600">require</span>(<span class="text-green-600">'fs'</span>);</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> readStream = fs.<span class="text-purple-600">createReadStream</span>(<span class="text-green-600">'large-file.txt'</span>, <span class="text-green-600">'utf8'</span>);</p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-1">readStream.<span class="text-purple-600">on</span>(<span class="text-green-600">'data'</span>, (chunk) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(<span class="text-green-600">'Received chunk:'</span>, chunk.length + <span class="text-green-600">' bytes'</span>);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-1">readStream.<span class="text-purple-600">on</span>(<span class="text-green-600">'end'</span>, () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(<span class="text-green-600">'File reading complete!'</span>);</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">There are four types of streams in Node.js:</p>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li><strong>Readable</strong> — Source of data (file, HTTP request)</li>
            <li><strong>Writable</strong> — Destination for data (file, HTTP response)</li>
            <li><strong>Transform</strong> — Modifies data as it passes through (compression, encryption)</li>
            <li><strong>Duplex</strong> — Both readable and writable (TCP socket)</li>
          </ul>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Why streams matter:</strong> Without streams, reading a 1GB file uses 1GB of memory. With streams, you process it in small chunks (64KB each), using just 64KB of memory!</p>
          </div>
        `,
        defaultCode: `console.log("=== Streams Demo ===");

// Simulate a readable stream
class SimulatedStream {
  constructor(data) {
    this.data = data;
    this.index = 0;
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    if (event === 'data') this._startReading();
    return this;
  }

  _startReading() {
    const emit = (event, ...args) => {
      (this.listeners[event] || []).forEach(fn => fn(...args));
    };

    const readNext = () => {
      if (this.index >= this.data.length) {
        emit('end');
        return;
      }

      const chunkSize = 20;
      const chunk = this.data.slice(this.index, this.index + chunkSize);
      this.index += chunkSize;

      console.log('[Stream] Emitting chunk: "' + chunk + '"');
      emit('data', chunk);

      // Simulate async reading
      setTimeout(readNext, 200);
    };

    setTimeout(readNext, 100);
  }
}

const largeData = 'Node.js streams are awesome! They process data piece by piece without loading everything into memory at once.';
const stream = new SimulatedStream(largeData);

let totalBytes = 0;

stream.on('data', (chunk) => {
  totalBytes += chunk.length;
  console.log('  Received chunk (' + chunk.length + ' chars), total so far: ' + totalBytes);
});

stream.on('end', () => {
  console.log('Stream complete! Total: ' + totalBytes + ' characters processed.');
});`,
        takeaways: [
          'Streams process data in chunks, not all at once — memory efficient',
          'Four types: Readable, Writable, Transform, Duplex',
          'Listen for data events on readable streams; write to writable streams',
          'Streams are essential for handling large files and network data',
        ],
      },
      {
        id: 'ev-3',
        title: 'Piping Streams',
        objectives: [
          'Connect readable streams to writable streams using pipe()',
          'Chain multiple streams for data transformation',
          'Handle errors in piped streams',
          'Create a simple file copy using streams',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Piping Streams Together</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>.pipe()</code> is the simplest way to consume streams. It automatically reads from a <strong>Readable</strong> stream and writes to a <strong>Writable</strong> stream, managing the flow speed so the destination doesn't get overwhelmed.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Copy a file using pipes</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> fs = <span class="text-blue-600">require</span>(<span class="text-green-600">'fs'</span>);</p>
            <p class="text-gray-700 mb-2">fs.<span class="text-purple-600">createReadStream</span>(<span class="text-green-600">'source.txt'</span>)</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;.<span class="text-purple-600">pipe</span>(fs.<span class="text-purple-600">createWriteStream</span>(<span class="text-green-600">'destination.txt'</span>));</p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Transform pipeline (compress then write)</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> zlib = <span class="text-blue-600">require</span>(<span class="text-green-600">'zlib'</span>);</p>
            <p class="text-gray-700 mb-1">fs.<span class="text-purple-600">createReadStream</span>(<span class="text-green-600">'file.txt'</span>)</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;.<span class="text-purple-600">pipe</span>(zlib.<span class="text-purple-600">createGzip</span>())</p>
            <p class="text-gray-700">&nbsp;&nbsp;.<span class="text-purple-600">pipe</span>(fs.<span class="text-purple-600">createWriteStream</span>(<span class="text-green-600">'file.txt.gz'</span>));</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Piping is like connecting garden hoses: the faucet (readable stream) is connected by a pipe to the sprinkler (writable stream). Water flows automatically. Transform streams are like filters that process the water as it passes through.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Error Handling:</strong> Unpiped streams swallow errors. Use <code>stream.pipeline()</code> (available since Node 10) for automatic error handling and cleanup: <code>pipeline(source, transform, dest, callback)</code>.</p>
          </div>
        `,
        defaultCode: `console.log("=== Stream Piping Demo ===");

// Simulate piping: Readable -> Transform -> Writable

class SimReadable {
  constructor(data) {
    this.data = data;
    this.idx = 0;
  }
  pipe(dest) {
    this.dest = dest;
    this._start();
    return dest;
  }
  _start() {
    const sendNext = () => {
      if (this.idx >= this.data.length) {
        if (this.dest && this.dest.end) this.dest.end();
        return;
      }
      const chunk = this.data[this.idx++];
      console.log('[Source] Sending chunk: ' + chunk);
      if (this.dest && this.dest.write) this.dest.write(chunk);
      setTimeout(sendNext, 200);
    };
    setTimeout(sendNext, 100);
  }
}

class SimWritable {
  constructor(name) {
    this.name = name;
    this.buffer = [];
  }
  write(chunk) {
    this.buffer.push(chunk);
    console.log('[Writable/' + this.name + '] Received: ' + chunk);
  }
  end() {
    console.log('[Writable/' + this.name + '] Complete! Total chunks: ' + this.buffer.length);
  }
}

console.log('--- Basic pipe: Readable -> Writable ---');
const source = new SimReadable(['Hello', 'Node.js', 'Streams', 'Are', 'Awesome']);
source.pipe(new SimWritable('output'));`,
        takeaways: [
          '.pipe() connects readable and writable streams, managing flow control automatically',
          'Transform streams in between can modify data (compress, encrypt, etc.)',
          'Use pipeline() from the stream module for proper error handling',
          'Piping is memory-efficient — data flows in chunks, never fully buffered',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-ev-1',
        question: 'Which method on an EventEmitter registers a one-time listener?',
        options: ['.on()', '.once()', '.one()', '.first()'],
        correct: 1,
      },
      {
        id: 'q-ev-2',
        question: 'Which stream type is both readable and writable?',
        options: ['Readable', 'Writable', 'Transform', 'Duplex'],
        correct: 3,
      },
      {
        id: 'q-ev-3',
        question: 'What is the main advantage of using streams for large file processing?',
        options: ['Faster execution speed', 'Lower memory usage', 'Better error handling', 'Automatic compression'],
        correct: 1,
      },
      {
        id: 'q-ev-4',
        question: 'What does the .pipe() method do?',
        options: ['Measures stream speed', 'Connects readable stream to writable stream', 'Creates a new stream', 'Duplicates stream data'],
        correct: 1,
      },
    ],
  },
  // ─── Module 8: Error Handling & Debugging ───
  {
    id: 'error-debug',
    title: 'Error Handling & Debugging',
    lessons: [
      {
        id: 'err-1',
        title: 'Understanding Errors in Node.js',
        objectives: [
          'Distinguish between operational errors and programmer errors',
          'Use try/catch blocks for synchronous error handling',
          'Handle errors in callback-based APIs',
          'Understand the error-first callback pattern',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Errors in Node.js</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Error handling is crucial in Node.js because an unhandled error can crash your entire application. Understanding the types of errors and how to handle them is essential for building robust applications.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Error-first callback pattern</span></p>
            <p class="text-gray-700 mb-1">fs.<span class="text-purple-600">readFile</span>(<span class="text-green-600">'config.json'</span>, <span class="text-green-600">'utf8'</span>, (err, data) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (err) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(<span class="text-green-600">'Failed to read config:'</span>, err.message);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span>;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">try</span> {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">const</span> config = JSON.<span class="text-purple-600">parse</span>(data);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;startApp(config);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;} <span class="text-blue-600">catch</span> (parseErr) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(<span class="text-green-600">'Invalid JSON:'</span>, parseErr);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Operational errors</strong> are expected problems like file not found or invalid input — handle these gracefully. <strong>Programmer errors</strong> are bugs in your code — fix the code, don't try to catch them.</p>
          <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
            <p class="text-red-800"><strong>Never ignore errors!</strong> An error-first callback that doesn't check the <code>err</code> parameter is a bug waiting to happen. Always handle or at least log errors.</p>
          </div>
        `,
        defaultCode: `const fs = require('fs');

console.log("=== Error Handling Demo ===");
console.log("");

// Simulated file read with error handling
function readConfig(path) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      // Operational error: file not found
      console.error('Error reading config:', err.message);
      console.log('Using default configuration instead...');
      return;
    }

    try {
      const config = JSON.parse(data);
      console.log('Configuration loaded:', JSON.stringify(config, null, 2));
    } catch (parseErr) {
      // Operational error: invalid JSON
      console.error('Invalid JSON in config file:', parseErr.message);
    }
  });
}

// Try reading a file that exists
console.log('Attempt to read config.json:');
readConfig('./config.json');

console.log('');
console.log('Attempt to read missing.json:');
readConfig('./missing.json');`,
        takeaways: [
          'Operational errors (file not found, bad input) should be handled gracefully',
          'Programmer errors (bugs) should be fixed, not caught',
          'Error-first callbacks: always check the err parameter',
          'Use try/catch for JSON.parse() and other throwing operations',
        ],
      },
      {
        id: 'err-2',
        title: 'Error Handling with async/await',
        objectives: [
          'Handle errors in async functions with try/catch',
          'Understand unhandled promise rejections',
          'Use process.on(unhandledRejection) as a global safety net',
          'Create custom error classes for better error categorization',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Async Error Handling</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">With async/await, error handling becomes as simple as wrapping your code in <code>try/catch</code> blocks. But there's a catch: if you forget to handle a Promise rejection, Node.js will warn about an <strong>unhandled promise rejection</strong>.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">async function</span> <span class="text-purple-600">getUserData</span>(id) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">try</span> {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">const</span> user = <span class="text-blue-600">await</span> findUser(id);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> user;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;} <span class="text-blue-600">catch</span> (err) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(<span class="text-green-600">'Failed to get user:'</span>, err);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">throw</span> <span class="text-blue-600">new</span> <span class="text-purple-600">Error</span>(<span class="text-green-600">'User service unavailable'</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700">}</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">For production apps, add a global handler for unhandled rejections: <code>process.on('unhandledRejection', (err) => { logger.error(err); process.exit(1); })</code>. This prevents silent failures.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Warning:</strong> In newer Node.js versions (15+), unhandled promise rejections crash the process. Always handle your rejections!</p>
          </div>
        `,
        defaultCode: `console.log("=== Async Error Handling Demo ===");

// Simulate an unreliable API
function fetchData(shouldFail) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Database connection timeout'));
      } else {
        resolve({ id: 1, data: 'Success!' });
      }
    }, 300);
  });
}

async function loadDashboard() {
  try {
    console.log('Loading dashboard data...');
    const data = await fetchData(true); // Change to false to see success
    console.log('Dashboard loaded:', data);
  } catch (error) {
    console.error('Dashboard error:', error.message);
    console.log('Falling back to cached data...');
  }
}

async function loadWithoutCatch() {
  console.log('');
  console.log('This will fail but we catch it:');
  try {
    const result = await fetchData(true);
    console.log(result);
  } catch (err) {
    console.log('Caught safely:', err.message);
  }
}

loadDashboard();
loadWithoutCatch();`,
        takeaways: [
          'Wrap async/await code in try/catch blocks for error handling',
          'Unhandled promise rejections can crash your Node.js process',
          'Use process.on(unhandledRejection) as a global error safety net',
          'Create custom error classes to categorize and handle different errors',
        ],
      },
      {
        id: 'err-3',
        title: 'Debugging Node.js Applications',
        objectives: [
          'Use console.log() effectively for quick debugging',
          'Use the Node.js built-in debugger with node inspect',
          'Set breakpoints using the debugger statement',
          'Use Chrome DevTools to debug Node.js applications',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Debugging Techniques</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Debugging is an essential skill. Node.js provides several tools to help you find and fix bugs, from simple <code>console.log()</code> to full debugger integration with Chrome DevTools.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Quick debugging with console</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> value = someFunction();</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(<span class="text-green-600">'DEBUG: value ='</span>, value); <span class="text-gray-500">// Quick check</span></p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Using the debugger statement</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">function</span> <span class="text-purple-600">complexFunction</span>(x) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;debugger; <span class="text-gray-500">// Execution pauses here with --inspect</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">return</span> x * <span class="text-orange-500">2</span>;</p>
            <p class="text-gray-700">}</p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Node.js built-in debugger</span></p>
            <p class="text-gray-700">$ node inspect app.js</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">For more advanced debugging, start Node with <code>node --inspect app.js</code>, then open <code>chrome://inspect</code> in Chrome. You get full Chrome DevTools — breakpoints, step-through debugging, memory profiling, and more!</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Pro Tip:</strong> Use <code>console.table()</code> for arrays of objects, <code>console.time()</code>/<code>console.timeEnd()</code> for performance timing, and <code>console.trace()</code> to see the call stack!</p>
          </div>
        `,
        defaultCode: `console.log("=== Debugging Tools Demo ===");

// console.table for arrays
const users = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'moderator' }
];
console.log('Users table:');
console.table(users);

// console.time for performance
console.log('');
console.log('Performance timing:');
console.time('operation');
let sum = 0;
for (let i = 0; i < 1000000; i++) { sum += i; }
console.timeEnd('operation');

// console.trace for call stack
console.log('');
console.log('Call stack trace:');
function a() { b(); }
function b() { c(); }
function c() { console.trace('Here is the trace!'); }
a();

console.log('');
console.log('Useful debugging commands:');
console.log('  node inspect app.js  - Built-in debugger');
console.log('  node --inspect app.js - Chrome DevTools debugging');
console.log('  node --inspect-brk    - Pause on first line');`,
        takeaways: [
          'console.log() is quick for simple debugging but remove logs from production code',
          'node --inspect enables Chrome DevTools for full debugging features',
          'The debugger statement pauses execution when DevTools are attached',
          'Use console.table, console.time, and console.trace for specialized debugging',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-err-1',
        question: 'What is the difference between operational errors and programmer errors?',
        options: ['Operational errors are worse', 'Programmer errors are worse', 'Operational errors are expected (handle gracefully); programmer errors are bugs (fix code)', 'There is no difference'],
        correct: 2,
      },
      {
        id: 'q-err-2',
        question: 'How do you enable Chrome DevTools debugging for a Node.js app?',
        options: ['node debug app.js', 'node --inspect app.js', 'node devtools app.js', 'chrome node app.js'],
        correct: 1,
      },
      {
        id: 'q-err-3',
        question: 'What happens to unhandled promise rejections in Node.js 15+?',
        options: ['They are silently ignored', 'They are logged but continue', 'They crash the process', 'They are automatically retried'],
        correct: 2,
      },
      {
        id: 'q-err-4',
        question: 'Which console method shows a call stack trace?',
        options: ['console.log()', 'console.error()', 'console.trace()', 'console.stack()'],
        correct: 2,
      },
    ],
  },
  // ─── Module 9: Testing (Mocha/Jest) ───
  {
    id: 'testing',
    title: 'Testing (Mocha/Jest)',
    lessons: [
      {
        id: 'test-1',
        title: 'Introduction to Testing',
        objectives: [
          'Understand why automated testing is essential',
          'Distinguish between unit, integration, and end-to-end tests',
          'Write basic test cases with assertions',
          'Understand the testing pyramid concept',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Why Test Your Code?</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Automated testing is the practice of writing code that verifies your application code works correctly. Tests catch bugs before they reach production, document how your code should behave, and give you confidence when refactoring.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// A simple test with Jest</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">function</span> <span class="text-purple-600">add</span>(a, b) { <span class="text-blue-600">return</span> a + b; }</p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-1">test(<span class="text-green-600">'adds 1 + 2 to equal 3'</span>, () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">expect</span>(add(<span class="text-orange-500">1</span>, <span class="text-orange-500">2</span>)).<span class="text-purple-600">toBe</span>(<span class="text-orange-500">3</span>);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Same test with Mocha + Chai</span></p>
            <p class="text-gray-700 mb-1">it(<span class="text-green-600">'should add two numbers'</span>, () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;expect(add(<span class="text-orange-500">1</span>, <span class="text-orange-500">2</span>)).to.equal(<span class="text-orange-500">3</span>);</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Unit tests</strong> test individual functions/classes. <strong>Integration tests</strong> test how components work together. <strong>End-to-end tests</strong> test the full application from the user's perspective. Most of your tests should be unit tests (the base of the testing pyramid).</p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Testing Mindset:</strong> Tests are not optional — they're as important as your application code. A project without tests is like a bridge built without inspections!</p>
          </div>
        `,
        defaultCode: `console.log("=== Testing Concepts Demo ===");

// Functions to test
function add(a, b) { return a + b; }
function multiply(a, b) { return a * b; }
function divide(a, b) {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
}

console.log('Manual test results:');
console.log('  add(1, 2) =', add(1, 2), '(expected: 3)', add(1, 2) === 3 ? 'PASS' : 'FAIL');
console.log('  add(-1, 1) =', add(-1, 1), '(expected: 0)', add(-1, 1) === 0 ? 'PASS' : 'FAIL');
console.log('  multiply(3, 4) =', multiply(3, 4), '(expected: 12)', multiply(3, 4) === 12 ? 'PASS' : 'FAIL');
console.log('  divide(10, 2) =', divide(10, 2), '(expected: 5)', divide(10, 2) === 5 ? 'PASS' : 'FAIL');

console.log('');
console.log('Edge case:');
try {
  divide(5, 0);
  console.log('  divide(5, 0) = No error (UNEXPECTED - FAIL)');
} catch (e) {
  console.log('  divide(5, 0) throws error:', e.message, '(EXPECTED - PASS)');
}

console.log('');
console.log('=== In a real project, you would use Jest or Mocha ===');
console.log('Jest: npm install --save-dev jest');
console.log('Mocha: npm install --save-dev mocha chai');
console.log('Then run: npm test');`,
        takeaways: [
          'Tests verify your code works correctly and prevent regressions',
          'Unit tests test small pieces, integration tests test components together',
          'The testing pyramid: many unit tests, fewer integration tests, few E2E tests',
          'Automated tests give confidence to refactor and add features',
        ],
      },
      {
        id: 'test-2',
        title: 'Testing with Jest',
        objectives: [
          'Install and configure Jest for a Node.js project',
          'Write test cases using describe, it, and expect',
          'Use Jest matchers (toBe, toEqual, toContain, etc.)',
          'Create setup and teardown with beforeEach and afterEach',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Jest Testing Framework</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Jest is a popular JavaScript testing framework developed by Meta. It comes with everything built in: test runner, assertion library, mocking, code coverage, and watch mode.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Basic Jest test file (math.test.js)</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> { add, multiply } = <span class="text-blue-600">require</span>(<span class="text-green-600">'./math'</span>);</p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-1">describe(<span class="text-green-600">'Math utilities'</span>, () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;test(<span class="text-green-600">'adds two numbers'</span>, () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;expect(add(<span class="text-orange-500">2</span>, <span class="text-orange-500">3</span>)).<span class="text-purple-600">toBe</span>(<span class="text-orange-500">5</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;});</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;test(<span class="text-green-600">'multiplies two numbers'</span>, () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;expect(multiply(<span class="text-orange-500">3</span>, <span class="text-orange-500">4</span>)).<span class="text-purple-600">toBe</span>(<span class="text-orange-500">12</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;});</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Jest provides rich matchers: <code>toBe()</code> for primitives, <code>toEqual()</code> for objects/arrays, <code>toContain()</code> for arrays, <code>toThrow()</code> for errors, <code>toBeGreaterThan()</code> for numbers, and many more.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Pro Tip:</strong> Run <code>jest --watch</code> during development — tests re-run automatically when files change. Run <code>jest --coverage</code> to see which lines of code are covered by tests.</p>
          </div>
        `,
        defaultCode: `console.log("=== Jest Testing Demo ===");
console.log("");
console.log('Simulated Jest test output:');
console.log('');

function runTest(description, fn) {
  try {
    fn();
    console.log('  ✓ ' + description);
    return true;
  } catch (e) {
    console.log('  ✗ ' + description);
    console.log('    ' + e.message);
    return false;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
      }
    }
  };
}

// Simulated tests
console.log('Test Suite: Math Utilities');

runTest('adds 2 + 3 = 5', () => { expect(2 + 3).toBe(5); });
runTest('multiplies 3 * 4 = 12', () => { expect(3 * 4).toBe(12); });
runTest('subtracts 10 - 7 = 3', () => { expect(10 - 7).toBe(3); });

console.log('');
console.log('Test Suite: User Objects');
const user = { id: 1, name: 'Alice', roles: ['admin', 'editor'] };

runTest('user has correct name', () => { expect(user.name).toBe('Alice'); });
runTest('user has admin role', () => { expect(user.roles.includes('admin')).toBe(true); });

console.log('');
console.log('All tests simulated. In real project: jest --coverage');`,
        takeaways: [
          'Jest provides a complete testing framework: runner, assertions, mocking, coverage',
          'Use describe() to group tests, test()/it() for individual tests',
          'Jest matchers: toBe, toEqual, toContain, toThrow, toBeGreaterThan, etc.',
          'Use beforeEach/afterEach for test setup and teardown',
        ],
      },
      {
        id: 'test-3',
        title: 'Testing Express APIs with Supertest',
        objectives: [
          'Install and configure Supertest for HTTP testing',
          'Write integration tests for Express routes',
          'Test response status codes and response bodies',
          'Mock external dependencies for isolated testing',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Integration Testing with Supertest</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Supertest is a library for testing Node.js HTTP servers. It allows you to make HTTP requests to your Express app and assert on the responses — all without actually binding to a network port.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Testing an Express API with Supertest</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> request = <span class="text-blue-600">require</span>(<span class="text-green-600">'supertest'</span>);</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> app = <span class="text-blue-600">require</span>(<span class="text-green-600">'../app'</span>);</p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-1">describe(<span class="text-green-600">'GET /api/users'</span>, () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;test(<span class="text-green-600">'returns list of users'</span>, <span class="text-blue-600">async</span> () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">const</span> res = <span class="text-blue-600">await</span> request(app).<span class="text-purple-600">get</span>(<span class="text-green-600">'/api/users'</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;expect(res.statusCode).<span class="text-purple-600">toBe</span>(<span class="text-orange-500">200</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;expect(res.body).<span class="text-purple-600">toBeInstanceOf</span>(Array);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;expect(res.body.length).<span class="text-purple-600">toBeGreaterThan</span>(<span class="text-orange-500">0</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;});</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Supertest works by passing your Express app to <code>request(app)</code>, then chaining HTTP methods and assertions. It's like having a robot that sends HTTP requests to your app and checks the responses!</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Best Practice:</strong> Test both success and failure cases. Test that valid requests return 200, invalid requests return 400, missing resources return 404, and unauthorized requests return 401.</p>
          </div>
        `,
        defaultCode: `console.log("=== API Testing with Supertest Demo ===");
console.log("");

// Simulate an Express app
const mockApp = {
  get: (path, handler) => { mockApp.routes = mockApp.routes || []; mockApp.routes.push({ method: 'GET', path, handler }); },
  routes: []
};

// Define routes (same as in your app)
mockApp.get('/api/users', (req, res) => {
  return { status: 200, body: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] };
});

mockApp.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id > 2) return { status: 404, body: { error: 'User not found' } };
  return { status: 200, body: { id, name: 'User ' + id } };
});

console.log('Running API tests...\n');

// Simulated test runner
function test(description, fn) {
  try { fn(); console.log('  ✓ ' + description); }
  catch (e) { console.log('  ✗ ' + description + ': ' + e.message); }
}

function expect(actual) {
  return {
    toBe(expected) { if (actual !== expected) throw new Error('Expected ' + expected + ' got ' + actual); },
    toEqual(expected) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Mismatch'); }
  };
}

// Simulate request
function request(method, path) {
  const route = mockApp.routes.find(r => r.method === method && r.path === path);
  if (!route) return { status: 404, body: { error: 'Not found' } };
  // Parse params
  const params = {};
  const routeParts = route.path.split('/');
  const urlParts = path.split('/');
  routeParts.forEach((part, i) => {
    if (part.startsWith(':')) params[part.slice(1)] = urlParts[i];
  });
  return route.handler({ params, query: {} });
}

// Tests
test('GET /api/users returns array', () => {
  const res = request('GET', '/api/users');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('GET /api/users returns user list', () => {
  const res = request('GET', '/api/users');
  expect(res.body.length).toBe(2);
});

test('GET /api/users/1 returns single user', () => {
  const res = request('GET', '/api/users/1');
  expect(res.status).toBe(200);
  expect(res.body.name).toBe('User 1');
});

test('GET /api/users/999 returns 404', () => {
  const res = request('GET', '/api/users/999');
  expect(res.status).toBe(404);
});

console.log('\nTests complete!');`,
        takeaways: [
          'Supertest allows HTTP testing without binding to a network port',
          'Test status codes, response bodies, and error scenarios',
          'Always test both happy paths and error cases',
          'Separation of app.js and server.js enables clean testing',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-test-1',
        question: 'Which testing framework comes with a built-in assertion library, mocking, and coverage?',
        options: ['Mocha', 'Jest', 'Chai', 'Supertest'],
        correct: 1,
      },
      {
        id: 'q-test-2',
        question: 'What does the describe() function do in Jest/Mocha?',
        options: ['Runs a single test', 'Groups related tests together', 'Sets up test data', 'Cleans up after tests'],
        correct: 1,
      },
      {
        id: 'q-test-3',
        question: 'What is Supertest used for?',
        options: ['Unit testing functions', 'Testing HTTP servers with fake requests', 'Code formatting and linting', 'Generating test coverage reports'],
        correct: 1,
      },
      {
        id: 'q-test-4',
        question: 'What does the test() or it() function represent?',
        options: ['A test suite', 'A single test case', 'A setup function', 'A mocking utility'],
        correct: 1,
      },
      {
        id: 'q-test-5',
        question: 'What is the testing pyramid?',
        options: ['A way to stack test files', 'Many unit tests, fewer integration tests, few E2E tests', 'A test coverage visualization', 'A CI/CD pipeline structure'],
        correct: 1,
      },
    ],
  },
  // ─── Module 10: Deployment (PM2/Docker) ───
  {
    id: 'deployment',
    title: 'Deployment (PM2/Docker)',
    lessons: [
      {
        id: 'deploy-1',
        title: 'Preparing for Production',
        objectives: [
          'Understand the differences between development and production environments',
          'Use environment variables for configuration',
          'Set NODE_ENV=production for optimized performance',
          'Implement proper logging and error reporting',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Production Readiness</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Moving from development to production requires several changes. Development focuses on convenience (auto-reload, verbose errors, debugging), while production focuses on stability, performance, and security.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Use environment variables for configuration</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> port = process.env.PORT || <span class="text-orange-500">3000</span>;</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> dbUrl = process.env.DATABASE_URL;</p>
            <p class="text-gray-700 mb-3"><span class="text-blue-600">const</span> isProd = process.env.NODE_ENV === <span class="text-green-600">'production'</span>;</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Disable verbose error details in production</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">use</span>((err, req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">status</span>(err.status || <span class="text-orange-500">500</span>).<span class="text-purple-600">json</span>({</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;error: isProd ? <span class="text-green-600">'Internal Server Error'</span> : err.message</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;});</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Key production checklist:</p>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li>Set NODE_ENV=production (Express enables caching, disables debug output)</li>
            <li>Use environment variables for all configuration (never hard-code secrets)</li>
            <li>Implement centralized logging (don't just console.log)</li>
            <li>Add health check endpoints (<code>/health</code> or <code>/api/status</code>)</li>
            <li>Use a process manager (PM2) or container runtime (Docker)</li>
          </ul>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Security:</strong> Never hard-code API keys, database passwords, or JWT secrets. Use a <code>.env</code> file with the <code>dotenv</code> package for development, and real environment variables in production.</p>
          </div>
        `,
        defaultCode: `console.log("=== Production Readiness Demo ===");
console.log("");

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV === 'production'),
  dbUrl: process.env.DATABASE_URL || 'mongodb://localhost/myapp',
  logLevel: process.env.LOG_LEVEL || 'debug'
};

console.log('Configuration:');
console.log('  PORT: ' + config.port);
console.log('  NODE_ENV: ' + config.nodeEnv);
console.log('  Is Production: ' + config.isProduction);
console.log('  DB URL: ' + config.dbUrl);
console.log('  Log Level: ' + config.logLevel);
console.log('');

console.log('Production Checklist:');
console.log('  [ ] Set NODE_ENV=production');
console.log('  [ ] Configure environment variables');
console.log('  [ ] Set up centralized logging');
console.log('  [ ] Add health check endpoint');
console.log('  [ ] Use process manager (PM2)');
console.log('  [ ] Enable HTTPS');
console.log('  [ ] Run npm audit');

if (!config.isProduction) {
  console.log('');
  console.log('⚠️  Current mode: development. Set NODE_ENV=production for deployment.');
}`,
        takeaways: [
          'Use environment variables for all configuration — never hard-code secrets',
          'Set NODE_ENV=production to enable Express optimizations and hide debug details',
          'Implement health check endpoints for monitoring',
          'Use a .env file with dotenv for local development',
        ],
      },
      {
        id: 'deploy-2',
        title: 'Process Management with PM2',
        objectives: [
          'Install and configure PM2 as a process manager',
          'Start, stop, and restart Node.js applications with PM2',
          'Configure PM2 for zero-downtime deployments',
          'Monitor application logs and metrics with PM2',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">PM2: Node.js Process Manager</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">PM2 is a production process manager for Node.js applications. It keeps your app alive forever, reloads it without downtime, and helps you manage application logs and performance.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Install PM2 globally</span></p>
            <p class="text-gray-700 mb-1">$ npm install -g pm2</p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Start your app with PM2</span></p>
            <p class="text-gray-700 mb-1">$ pm2 start app.js --name my-api</p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Useful commands</span></p>
            <p class="text-gray-700 mb-1">$ pm2 list <span class="text-gray-500">// List all running apps</span></p>
            <p class="text-gray-700 mb-1">$ pm2 logs <span class="text-gray-500">// View logs</span></p>
            <p class="text-gray-700 mb-1">$ pm2 monit <span class="text-gray-500">// Monitor CPU/memory</span></p>
            <p class="text-gray-700 mb-1">$ pm2 restart all <span class="text-gray-500">// Restart all apps</span></p>
            <p class="text-gray-700 mb-1">$ pm2 startup <span class="text-gray-500">// Auto-start on server reboot</span></p>
            <p class="text-gray-700">$ pm2 save <span class="text-gray-500">// Save process list for restart</span></p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">One of PM2's best features is <strong>cluster mode</strong>. Run <code>pm2 start app.js -i max</code> to spawn as many worker processes as you have CPU cores. PM2 distributes incoming requests across all workers, and if one crashes, it's automatically restarted.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Zero-downtime deployment:</strong> <code>pm2 reload app</code> restarts workers one by one instead of all at once. Your users experience zero downtime during updates!</p>
          </div>
        `,
        defaultCode: `console.log("=== PM2 Process Manager Demo ===");
console.log("");

console.log('Simulated PM2 commands:');
console.log('');

console.log('$ pm2 start app.js --name my-api -i max');
console.log('  ✓ Starting my-api in cluster mode');
console.log('  ✓ Spawned 4 instances (CPU cores: 4)');
console.log('');

console.log('$ pm2 list');
console.log('  ┌────┬────────┬──────┬────────┬───┬──────┬────────┐');
console.log('  │ id │ name   │ mode │ status │ ↺ │ cpu  │ memory │');
console.log('  ├────┼────────┼──────┼────────┼───┼──────┼────────┤');
console.log('  │ 0  │ my-api │ cluster │ online │ 0 │ 0.1% │ 52.1MB │');
console.log('  │ 1  │ my-api │ cluster │ online │ 0 │ 0.1% │ 48.3MB │');
console.log('  │ 2  │ my-api │ cluster │ online │ 0 │ 0.0% │ 51.7MB │');
console.log('  │ 3  │ my-api │ cluster │ online │ 0 │ 0.2% │ 49.9MB │');
console.log('  └────┴────────┴──────┴────────┴───┴──────┴────────┘');
console.log('');

console.log('$ pm2 monit');
console.log('  CPU: ■■■□□□□□□□□ 12.5%');
console.log('  Memory: ■■■■■■■■□□ 52.1 MB');
console.log('');

console.log('$ pm2 startup');
console.log('  ✓ PM2 configured to start on system boot');
console.log('');

console.log('Key PM2 features:');
console.log('  • Auto-restart on crash');
console.log('  • Cluster mode (multi-core)');
console.log('  • Zero-downtime reloads');
console.log('  • Built-in load balancer');
console.log('  • Log management');
console.log('  • Startup on reboot');`,
        takeaways: [
          'PM2 keeps your app running, restarts it on crash, and starts on server reboot',
          'Cluster mode (-i max) spawns one worker per CPU core for better performance',
          'pm2 reload performs zero-downtime deployments by restarting workers one by one',
          'pm2 monit and pm2 logs help monitor application health',
        ],
      },
      {
        id: 'deploy-3',
        title: 'Docker Containerization',
        objectives: [
          'Understand what Docker is and why containerization matters',
          'Write a Dockerfile for a Node.js application',
          'Use .dockerignore to exclude unnecessary files',
          'Run a Node.js app in a Docker container',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Docker for Node.js</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Docker packages your application and all its dependencies into a <strong>container</strong> — a lightweight, standalone, executable package that includes everything needed to run: code, runtime, system tools, libraries, and settings.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500"># Dockerfile for a Node.js app</span></p>
            <p class="text-gray-700 mb-1">FROM node:20-alpine <span class="text-gray-500"># Base image (small!)</span></p>
            <p class="text-gray-700 mb-1">WORKDIR /usr/src/app <span class="text-gray-500"># Working directory</span></p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-1">COPY package*.json ./ <span class="text-gray-500"># Copy dependency files</span></p>
            <p class="text-gray-700 mb-1">RUN npm ci --only=production <span class="text-gray-500"># Install deps</span></p>
            <p class="text-gray-700 mb-3"></p>
            <p class="text-gray-700 mb-1">COPY . . <span class="text-gray-500"># Copy source code</span></p>
            <p class="text-gray-700 mb-1">EXPOSE 3000 <span class="text-gray-500"># Document port</span></p>
            <p class="text-gray-700 mb-1">CMD ["node", "app.js"] <span class="text-gray-500"># Start command</span></p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Build and run: <code>docker build -t my-app .</code> builds the image. <code>docker run -p 3000:3000 my-app</code> starts the container. Docker ensures it works the same on your laptop, your teammate's machine, and the production server.</p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Why Docker?</strong> "It works on my machine" is not an excuse anymore. Docker guarantees that your app runs identically everywhere — development, staging, and production!</p>
          </div>
        `,
        defaultCode: `console.log("=== Docker Containerization Demo ===");
console.log("");

console.log('Dockerfile for a Node.js app:');
console.log('');
console.log('  FROM node:20-alpine');
console.log('  WORKDIR /usr/src/app');
console.log('  ');
console.log('  # Copy package files separately for better caching');
console.log('  COPY package*.json ./');
console.log('  RUN npm ci --only=production');
console.log('  ');
console.log('  # Copy the rest of the app');
console.log('  COPY . .');
console.log('  EXPOSE 3000');
console.log('  CMD ["node", "app.js"]');
console.log('');

console.log('Build commands:');
console.log('  $ docker build -t my-node-app .');
console.log('  $ docker run -d -p 3000:3000 --name my-app my-node-app');
console.log('  $ docker ps  # List running containers');
console.log('  $ docker logs my-app  # View logs');
console.log('  $ docker stop my-app  # Stop container');
console.log('');

console.log('.dockerignore (prevents sending unnecessary files to Docker):');
console.log('  node_modules');
console.log('  npm-debug.log');
console.log('  .env');
console.log('  .git');
console.log('  .DS_Store');
console.log('');

console.log('Benefits of Docker:');
console.log('  ✓ Consistency across environments');
console.log('  ✓ Easy scaling with container orchestration');
console.log('  ✓ Isolated dependencies per service');
console.log('  ✓ Reproducible builds');`,
        takeaways: [
          'Docker packages your app and all dependencies into a portable container',
          'docker build creates an image; docker run starts a container from that image',
          'Use .dockerignore to exclude node_modules and other unnecessary files',
          'Docker ensures consistent behavior across development, staging, and production',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-deploy-1',
        question: 'What does NODE_ENV=production do in Express?',
        options: ['Enables debugging', 'Enables caching and disables debug output', 'Installs production dependencies', 'Creates a production database'],
        correct: 1,
      },
      {
        id: 'q-deploy-2',
        question: 'What does PM2 do when an app crashes?',
        options: ['Sends you an email', 'Logs the error and stops', 'Automatically restarts the app', 'Deletes the app'],
        correct: 2,
      },
      {
        id: 'q-deploy-3',
        question: 'What does the -i max flag do in pm2 start?',
        options: ['Runs in infinite loop', 'Enables maximum logging', 'Spawns one worker per CPU core', 'Sets maximum memory limit'],
        correct: 2,
      },
      {
        id: 'q-deploy-4',
        question: 'What is the purpose of a Dockerfile?',
        options: ['To format your code', 'To define how to build a Docker container', 'To run tests', 'To manage npm packages'],
        correct: 1,
      },
    ],
  },
];

// --- State & Progress ---
let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson', // lesson, terminal, quiz
  completedItems: [],
  quizAnswers: {},
};

// Load state from local storage
function loadProgress() {
  try {
    const saved = localStorage.getItem('nodeHubProgress');
    if (saved) {
      state.completedItems = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
}

// Save state to local storage and update UI
function saveProgress() {
  try {
    localStorage.setItem('nodeHubProgress', JSON.stringify(state.completedItems));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
  updateProgressBar();
  renderSidebar(); // re-render sidebar to show checkmarks
}

function markItemComplete(id) {
  if (!state.completedItems.includes(id)) {
    state.completedItems.push(id);
    saveProgress();
  }
}

function updateProgressBar() {
  let totalItems = 0;
  curriculum.forEach((mod) => {
    totalItems += mod.lessons.length;
    if (mod.quiz && mod.quiz.length > 0) totalItems += 1;
  });

  if (totalItems === 0) return;
  const progressPercent = Math.round((state.completedItems.length / totalItems) * 100);

  document.getElementById('progress-bar').style.width = `${progressPercent}%`;
  document.getElementById('progress-text').innerText = `${progressPercent}%`;
}

// --- DOM Elements ---
const DOM = {
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  sidebar: document.getElementById('sidebar'),
  openSidebarBtn: document.getElementById('open-sidebar'),
  closeSidebarBtn: document.getElementById('close-sidebar'),
  moduleList: document.getElementById('module-list'),
  activeModuleTitle: document.getElementById('active-module-title'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  tabLesson: document.getElementById('tab-lesson'),
  tabTerminal: document.getElementById('tab-terminal'),
  tabQuiz: document.getElementById('tab-quiz'),
  codeEditor: document.getElementById('code-editor'),
  runCodeBtn: document.getElementById('run-code-btn'),
  clearTerminalBtn: document.getElementById('clear-terminal-btn'),
  simulatedTerminal: document.getElementById('simulated-terminal'),
};

// --- Initialization ---
function init() {
  loadProgress();
  updateProgressBar();

  // Set up event listeners
  setupEventListeners();

  // Initial Render
  renderSidebar();
  renderActiveState();
}

function setupEventListeners() {
  // Sidebar toggles
  DOM.openSidebarBtn.addEventListener('click', () => {
    DOM.sidebar.classList.remove('-translate-x-full');
    DOM.sidebarOverlay.classList.remove('hidden');
  });

  const closeSidebar = () => {
    DOM.sidebar.classList.add('-translate-x-full');
    DOM.sidebarOverlay.classList.add('hidden');
  };

  DOM.closeSidebarBtn.addEventListener('click', closeSidebar);
  DOM.sidebarOverlay.addEventListener('click', closeSidebar);

  // Tabs
  DOM.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Terminal Controls
  DOM.runCodeBtn.addEventListener('click', runSimulation);
  DOM.clearTerminalBtn.addEventListener('click', () => {
    DOM.simulatedTerminal.innerHTML = '';
  });

  // Allow basic tab indentation in textarea
  DOM.codeEditor.addEventListener('keydown', function (e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end); // Node typically 2 spaces
      this.selectionStart = this.selectionEnd = start + 2;
    }
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  DOM.tabBtns.forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  DOM.tabContents.forEach((content) => {
    content.classList.remove('active', 'flex', 'md:flex');
  });

  const activeContent = document.getElementById(`tab-${tabId}`);
  if (tabId === 'terminal') {
    activeContent.classList.add('active', 'flex', 'md:flex-row');
  } else {
    activeContent.classList.add('active');
  }
}

function getActiveModule() {
  return curriculum.find((m) => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
  const mod = getActiveModule();
  return mod.lessons.find((l) => l.id === state.activeLessonId) || mod.lessons[0];
}

function changeModule(moduleId) {
  const mod = curriculum.find((m) => m.id === moduleId);
  if (mod) {
    state.activeModuleId = moduleId;
    state.activeLessonId = mod.lessons[0].id;

    // Optional: clear terminal on module switch
    // DOM.simulatedTerminal.innerHTML = '<div class="text-gray-500 mb-2">Welcome to Node.js v18.16.0. Type commands or run index.js.</div>';

    renderSidebar();
    renderActiveState();
    if (window.innerWidth < 1024) {
      DOM.sidebar.classList.add('-translate-x-full');
      DOM.sidebarOverlay.classList.add('hidden');
    }
  }
}

// --- Rendering Functions ---

function renderSidebar() {
  DOM.moduleList.innerHTML = '';

  curriculum.forEach((mod) => {
    const isActive = mod.id === state.activeModuleId;

    const allLessonsDone = mod.lessons.every((l) => state.completedItems.includes(l.id));
    const quizDone =
      mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
    const isModuleComplete = allLessonsDone && quizDone;

    const li = document.createElement('li');

    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-green-100 text-green-900 font-semibold border-l-4 border-[#339933]' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
    btn.onclick = () => changeModule(mod.id);

    const textSpan = document.createElement('span');
    textSpan.className = 'truncate block';
    textSpan.innerText = mod.title;

    btn.appendChild(textSpan);

    if (isModuleComplete) {
      const checkIcon = document.createElement('i');
      checkIcon.className = 'fa-solid fa-check-circle text-[#339933]';
      btn.appendChild(checkIcon);
    }

    li.appendChild(btn);
    DOM.moduleList.appendChild(li);
  });
}

function renderActiveState() {
  const mod = getActiveModule();
  const lesson = getActiveLesson();

  DOM.activeModuleTitle.innerText = mod.title;

  renderLesson(lesson);
  renderQuiz(mod);

  DOM.codeEditor.value = lesson.defaultCode;
}

function renderLesson(lesson) {
  const isCompleted = state.completedItems.includes(lesson.id);

  // Build objectives HTML
  const objectivesHtml = lesson.objectives && lesson.objectives.length
    ? `
      <div class="bg-indigo-50 border-l-4 border-[#6366f1] p-4 my-6 rounded-r-lg">
        <h4 class="font-semibold text-indigo-800 mb-2"><i class="fa-solid fa-bullseye mr-2"></i>Learning Objectives</h4>
        <ul class="list-disc pl-5 text-indigo-700 space-y-1 text-sm">
          ${lesson.objectives.map(o => `<li>${o}</li>`).join('')}
        </ul>
      </div>`
    : '';

  // Build takeaways HTML
  const takeawaysHtml = lesson.takeaways && lesson.takeaways.length
    ? `
      <div class="mt-10 p-5 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 class="font-semibold text-gray-800 mb-3"><i class="fa-solid fa-check-double mr-2 text-[#339933]"></i>Key Takeaways</h4>
        <ul class="space-y-2">
          ${lesson.takeaways.map(t => `
            <li class="flex items-start gap-2 text-gray-700">
              <i class="fa-solid fa-circle-check text-[#339933] mt-1 text-sm"></i>
              <span>${t}</span>
            </li>
          `).join('')}
        </ul>
      </div>`
    : '';

  // Get ELI5 content
  const eli5Html = (window.eli5Toggle && window.eli5NodeData)
    ? window.eli5NodeData[lesson.id] || ''
    : '';

  DOM.tabLesson.innerHTML = `
        <div class="max-w-3xl mx-auto animate-fade-in">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">${lesson.title}</h2>
            ${objectivesHtml}
            <div class="prose max-w-none text-gray-800">
                ${window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, eli5Html) : lesson.content}
            </div>
            
            ${takeawaysHtml}
            
            <div class="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center">
                <span class="text-sm text-gray-500"><i class="fa-solid fa-lightbulb mr-1"></i> ${lesson.id}</span>
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-green-100 text-green-800 cursor-default' : 'bg-[#339933] text-white hover:bg-[#2d882d] shadow-md'}">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    `;

  /* ELI5 toggle */
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('nodejs', DOM.tabLesson);
  }
  const btn = document.getElementById('mark-lesson-complete');
  if (typeof copyCode !== 'undefined' && copyCode.init) {
    copyCode.init(DOM.tabLesson);
  }
  if (!isCompleted) {
    btn.addEventListener('click', () => {
      markItemComplete(lesson.id);
      renderLesson(lesson);
      switchTab('terminal');
    });
  }
}

function renderQuiz(mod) {
  const quizId = `${mod.id}-quiz`;
  const isCompleted = state.completedItems.includes(quizId);

  if (!mod.quiz || mod.quiz.length === 0) {
    DOM.tabQuiz.innerHTML =
      '<div class="text-center text-gray-500 mt-10">No quiz available for this module.</div>';
    return;
  }

  let html = `
        <div class="max-w-3xl mx-auto animate-fade-in pb-12">
            <div class="mb-8 border-b pb-4">
                <h2 class="text-3xl font-bold text-gray-900">Module Quiz</h2>
                <p class="text-gray-500 mt-1">${mod.quiz.length} questions — score 100% to pass</p>
                ${isCompleted ? '<span class="inline-block mt-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

  mod.quiz.forEach((q, index) => {
    html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-[#339933] mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;

    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;

      html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-green-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `</div></div>`;
  });

  html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-[#339933] hover:bg-[#2d882d] shadow-md transition-all">Submit Answers</button>
                <div id="quiz-feedback" class="mt-4 text-lg font-bold hidden"></div>
            </div>
        </div>
    `;

  DOM.tabQuiz.innerHTML = html;

  document.getElementById('submit-quiz-btn').addEventListener('click', () => {
    let score = 0;
    let allAnswered = true;

    mod.quiz.forEach((q) => {
      if (state.quizAnswers[q.id] === undefined) {
        allAnswered = false;
      } else if (state.quizAnswers[q.id] === q.correct) {
        score++;
      }
    });

    const feedback = document.getElementById('quiz-feedback');
    feedback.classList.remove('hidden', 'text-red-600', 'text-green-600');

    if (!allAnswered) {
      feedback.innerText = 'Please answer all questions.';
      feedback.classList.add('text-red-600');
      return;
    }

    if (score === mod.quiz.length) {
      feedback.innerHTML = '<i class="fa-solid fa-party-horn"></i> Perfect! You passed.';
      feedback.classList.add('text-green-600');
      markItemComplete(quizId);
      renderSidebar();
    } else {
      feedback.innerText = `You scored ${score} out of ${mod.quiz.length}. Try again!`;
      feedback.classList.add('text-red-600');
    }
  });
}

window.handleQuizSelection = function (questionId, optionIndex) {
  state.quizAnswers[questionId] = optionIndex;
  renderQuiz(getActiveModule());
};

// --- Node.js Terminal Simulator Engine (CRITICAL) ---

function printToTerminal(text, type = 'output') {
  const line = document.createElement('div');
  line.className = `terminal-line`;

  // Add specific colors based on output type
  let colorClass = 'term-output';
  if (type === 'error') colorClass = 'term-error';
  if (type === 'warn') colorClass = 'term-warn';
  if (type === 'system') colorClass = 'term-system';

  line.innerHTML = `<span class="${colorClass}">${text}</span>`;
  DOM.simulatedTerminal.appendChild(line);

  // Scroll to bottom
  DOM.simulatedTerminal.scrollTop = DOM.simulatedTerminal.scrollHeight;
}

function printPrompt(command) {
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.innerHTML = `<span class="terminal-prompt">~/project $</span> <span class="term-output">${command}</span>`;
  DOM.simulatedTerminal.appendChild(line);
}

// Utility to stringify objects for console.log simulation
function formatOutput(args) {
  return Array.from(args)
    .map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Object]';
        }
      }
      return String(arg);
    })
    .join(' ');
}

function runSimulation() {
  const userCode = DOM.codeEditor.value;

  printPrompt('node index.js');

  // Simulate slight startup delay
  setTimeout(() => {
    // 1. Store original console functions
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console functions to push to UI
    console.log = function (...args) {
      printToTerminal(formatOutput(args), 'output');
    };
    console.error = function (...args) {
      printToTerminal(formatOutput(args), 'error');
    };
    console.warn = function (...args) {
      printToTerminal(formatOutput(args), 'warn');
    };

    // 2. Mock Global Objects usually found in Node.js
    const __dirname = '/usr/src/app/project';
    const __filename = '/usr/src/app/project/index.js';

    const process = {
      arch: 'x64',
      platform: 'linux',
      cwd: () => '/usr/src/app/project',
      env: { NODE_ENV: 'development' },
    };

    // Mock require() function
    const require = function (moduleName) {
      printToTerminal(`(Simulated require for '${moduleName}')`, 'system');

      // Return fake module objects
      if (moduleName === 'fs') {
        return {
          readFile: (path, encoding, cb) => {
            // Simulate async file read
            setTimeout(() => {
              cb(null, 'Hello from the simulated file system! Node is awesome.');
            }, 400);
          },
          readFileSync: () => 'Sync file content.',
        };
      }
      if (moduleName === 'http') {
        return {
          createServer: (cb) => {
            return {
              listen: (port, callback) => {
                setTimeout(callback, 200);
                // Simulate an incoming request shortly after starting
                setTimeout(() => {
                  const req = { url: '/' };
                  const res = {
                    writeHead: () => {},
                    end: (msg) =>
                      printToTerminal(`[Simulated HTTP Client received]: ${msg}`, 'system'),
                  };
                  cb(req, res);
                }, 800);
              },
            };
          },
        };
      }

      return {}; // Return empty object for unhandled modules
    };

    // 3. Execution using new Function()
    // We pass the mocks as arguments to the generated function so they act as local variables imitating globals
    try {
      const executeNode = new Function(
        'console',
        'require',
        'process',
        '__dirname',
        '__filename',
        userCode
      );
      executeNode(console, require, process, __dirname, __filename);
    } catch (e) {
      console.error('Runtime Exception:', e.message);
    }

    // Restore original console functions immediately after synchronous execution finishes
    // Note: Asynchronous logs (like those inside setTimeout or simulated fs.readFile)
    // will unfortunately use the restored console if they fire later.
    // For a perfectly robust simulator we'd keep the interceptor active, but this suffices for the demo.

    // Wait a brief moment to catch immediate async callbacks, then restore
    setTimeout(() => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }, 1500);
  }, 200);
}

// Start application
init();
