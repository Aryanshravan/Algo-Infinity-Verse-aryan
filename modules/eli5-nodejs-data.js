/**
 * ELI5 (Explain Like I'm 5) content for Node.js Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5NodeData = {
  // ─── Module 1: Node.js Basics & Global Objects ───
  'nb-1': `
    <p>Imagine a <strong>car engine</strong>. A normal car engine runs on gasoline. But what if someone made an engine that runs on <strong>JavaScript</strong> instead?</p>
    <p>That's exactly what Node.js is — it's a <strong>JavaScript engine</strong> that runs outside the browser! Instead of running in Chrome or Firefox, Node.js runs directly on your computer, like any other program (Photoshop, Spotify, etc.).</p>
    <p>Normally, JavaScript can only do things inside a web page — like changing text or handling button clicks. But Node.js gives JavaScript <strong>superpowers</strong> — it can read files, talk to databases, create web servers, and much more!</p>
    <p>Think of it this way: Browser JavaScript is like a <strong>goldfish in a bowl</strong> (limited to the browser). Node.js is like a <strong>goldfish in the ocean</strong> (it can go anywhere and do anything on your computer)!</p>
  `,
  'nb-2': `
    <p>Think of <strong>global objects</strong> as the <strong>tools in a Swiss Army knife</strong> that Node.js gives you automatically — you don't need to ask for them, they're just there!</p>
    <ul>
      <li><strong><code>process</code></strong> — Like a <strong>dashboard in a car</strong>. It tells you everything about your running program: what operating system you're on, how much memory you're using, what arguments were passed. "Am I on a Mac or Windows? How much fuel (memory) is left?"</li>
      <li><strong><code>__dirname</code></strong> — Like a <strong>GPS showing your current location</strong>. It tells you the folder path where your JavaScript file lives. "You are here: <code>/Users/alice/project/src/</code>"</li>
      <li><strong><code>__filename</code></strong> — Like a <strong>GPS showing "You are HERE" with the exact file name</strong>. Same as <code>__dirname</code> but includes the file name too.</li>
      <li><strong><code>module</code></strong> — Like a <strong>shipping box</strong>. You put things inside it (<code>module.exports</code>) and send them to other files that need them.</li>
    </ul>
    <p>These are always available, like the steering wheel and pedals in a car — you never need to install or import them!</p>
  `,
  'nb-3': `
    <p>The <strong>module system</strong> in Node.js is like a <strong>kitchen with labeled drawers</strong>.</p>
    <p>Imagine you have a huge kitchen with 100 different tools. You don't keep them all on the counter — that would be chaos! Instead, you organize them into labeled drawers: "Knives", "Measuring Cups", "Mixing Bowls", etc.</p>
    <p>In Node.js, each file is a <strong>drawer</strong>. You use <code>module.exports</code> to put things <strong>into</strong> the drawer, and <code>require('./filename')</code> to take things <strong>out of</strong> another drawer.</p>
    <p>For example:
    <ul>
      <li><code>math.js</code> drawer contains: <code>add</code>, <code>subtract</code>, <code>multiply</code> functions</li>
      <li><code>app.js</code> drawer says: "I need the <code>add</code> tool from the <code>math.js</code> drawer!"</li>
    </ul>
    <p>There are two types of modules: <strong>Core modules</strong> (built into Node.js, like <code>fs</code> and <code>http</code> — like pre-installed appliances in your kitchen) and <strong>your modules</strong> (files you create — like tools you bought yourself).</p>
  `,

  // ─── Module 2: The File System (fs) ───
  'fs-1': `
    <p>The <code>fs</code> module is like a <strong>filing cabinet with a robot arm</strong> attached to it.</p>
    <p>You tell the robot: "Open drawer 2, find the folder labeled 'Invoices', read page 5, and tell me what it says." The robot does it and reports back.</p>
    <p><strong>Reading</strong> a file = The robot opens the file and reads it to you.</p>
    <p><strong>Writing</strong> a file = The robot takes your note and files it in the cabinet.</p>
    <p>The <code>fs</code> module gives you two styles:</p>
    <ul>
      <li><strong>Asynchronous</strong> (<code>fs.readFile</code>) — Like giving the robot instructions and then walking away to do other things. The robot calls you when it's done. <strong>This is the recommended way!</strong></li>
      <li><strong>Synchronous</strong> (<code>fs.readFileSync</code>) — Like standing right next to the robot, watching it do the work, and waiting until it finishes. You can't do anything else while waiting.</li>
    </ul>
    <p><strong>Always prefer async!</strong> It's like a good restaurant — the waiter (Node.js) takes your order and serves other tables while the kitchen cooks your food!</p>
  `,
  'fs-2': `
    <p>Writing to files is like <strong>taking notes in a notebook</strong>.</p>
    <p><strong><code>fs.writeFile()</code></strong> — Like ripping out the old page and writing a completely new one. Everything that was there before is gone!</p>
    <p><strong><code>fs.appendFile()</code></strong> — Like adding a new sentence at the bottom of the page without erasing anything above it.</p>
    <p>Both take a <strong>path</strong> (which notebook/page), the <strong>data</strong> (what to write), and a <strong>callback</strong> that runs when done.</p>
    <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 my-4 rounded-r-lg text-sm">
      <p class="text-yellow-800"><strong>⚠️ Warning:</strong> <code>writeFile</code> overwrites everything! If you want to keep the existing content and add to it, use <code>appendFile</code>. It's the difference between "replace entire document" vs "add one paragraph at the end".</p>
    </div>
    <p>Think of it like a whiteboard: <code>writeFile</code> erases everything first, <code>appendFile</code> adds a new line at the bottom.</p>
  `,
  'fs-3': `
    <p>Working with <strong>directories</strong> in Node.js is like being a <strong>librarian organizing shelves</strong>.</p>
    <p><strong><code>fs.mkdir()</code></strong> — Like <strong>adding a new shelf</strong> to the library. You give it a name (path) and it creates an empty directory.</p>
    <p><strong><code>fs.readdir()</code></strong> — Like <strong>looking at all the books on a shelf</strong> and listing their titles. It returns an array of file/folder names inside a directory.</p>
    <p><strong><code>fs.stat()</code></strong> — Like <strong>checking if a book is a novel or a magazine</strong>. It tells you whether something is a file or a directory, its size, when it was created, etc.</p>
    <p><strong><code>fs.unlink()</code></strong> — Like <strong>throwing a book in the recycling bin</strong>. It deletes a file (but not a directory—use <code>fs.rmdir()</code> for empty directories).</p>
    <p>The <code>path</code> module is your <strong>map and compass</strong>. It helps you build file paths correctly:
    <ul>
      <li><code>path.join('folder', 'file.txt')</code> → <code>folder/file.txt</code> (or <code>folder\\file.txt</code> on Windows — it handles this automatically!)</li>
      <li><code>path.extname('photo.jpg')</code> → <code>.jpg</code></li>
    </ul>
    </p>
  `,

  // ─── Module 3: Building an HTTP Server ───
  'http-1': `
    <p>An HTTP server is like a <strong>fast-food restaurant drive-through</strong>.</p>
    <p><strong>You (the client)</strong> drive up to the speaker and say, "I'd like a #2 with a Coke" (this is your HTTP request).</p>
    <p><strong>The server (Node.js)</strong> takes your order, tells the kitchen to make it, and hands you your food through the window (this is the HTTP response).</p>
    <p>The <code>http.createServer()</code> built the restaurant. The <code>server.listen(3000)</code> opened the doors at address <strong>port 3000</strong>.</p>
    <p>Inside the <code>createServer</code> callback, you get two things:</p>
    <ul>
      <li><strong><code>req</code> (request)</strong> — What the customer said. Contains the URL (<code>req.url</code> — "/menu", "/order"), the method (<code>req.method</code> — "GET", "POST"), and any data they sent.</li>
      <li><strong><code>res</code> (response)</strong> — What you give back to the customer. You set the <code>statusCode</code> (200 = "Got it!", 404 = "Sorry, we don't have that") and send the data with <code>res.end()</code>.</li>
    </ul>
    <p>Think of it like talking to a vending machine — you press a button (request) and a snack drops down (response)!</p>
  `,
  'http-2': `
    <p>Reading the <strong>request body</strong> in Node.js is like <strong>listening to a long voicemail message</strong>.</p>
    <p>The person calling (client) speaks their message (data) into the phone. You can't hear the whole message at once — it arrives in <strong>chunks</strong>, like parts of a voice message being delivered one sentence at a time.</p>
    <p>In Node.js, the request (<code>req</code>) is a <strong>Readable Stream</strong> — it sends data in pieces. You need to listen for each piece and put them together:</p>
    <p><code>req.on('data', chunk => { body += chunk; })</code> — "Every time a new chunk arrives, add it to my collection."</p>
    <p><code>req.on('end', () => { /* use body */ })</code> — "When the last chunk arrives and the message is complete, now I can read the full thing."</p>
    <p>It's like getting a puzzle delivered in pieces — you collect all the pieces first, then put them together to see the full picture!</p>
  `,
  'http-3': `
    <p>Setting <strong>response headers</strong> is like <strong>labeling a package you're sending through the mail</strong>.</p>
    <p>When you mail a package, you write on it: "FRAGILE" (content type), "RETURN SERVICE REQUESTED" (caching), "DO NOT BEND" (encoding). These are instructions for the postal service on how to handle your package.</p>
    <p>HTTP headers do the same thing — they tell the browser how to handle the response:</p>
    <ul>
      <li><code>Content-Type: text/html</code> — "This is a web page, render it!"</li>
      <li><code>Content-Type: application/json</code> — "This is JSON data, parse it!"</li>
      <li><code>Content-Type: text/plain</code> — "This is just plain text."</li>
      <li><code>Location: /new-page</code> — "This page moved! Go here instead." (used for redirects)</li>
    </ul>
    <p>Use <code>res.writeHead(200, { 'Content-Type': 'text/html' })</code> to set the status code and headers together — like writing the address AND the handling instructions on your package at the same time!</p>
  `,

  // ─── Module 4: Express.js & REST APIs ───
  'ex-1': `
    <p>If raw Node.js <code>http</code> is like <strong>building a house with just a hammer and nails</strong>, Express.js is like <strong>building a house with power tools</strong>.</p>
    <p>You <em>can</em> build a house with just a hammer — it will just take forever and be painful. Express gives you a <strong>power drill</strong> (routing), a <strong>table saw</strong> (middleware), and a <strong>nail gun</strong> (response helpers) so you build things much faster!</p>
    <p>With Express:</p>
    <ul>
      <li><code>app.get('/users', handler)</code> instead of checking <code>req.method</code> and <code>req.url</code> manually</li>
      <li><code>res.json(data)</code> instead of <code>res.writeHead + JSON.stringify + res.end</code></li>
      <li>Add features with <code>app.use(something)</code> instead of building everything yourself</li>
    </ul>
    <p>Express is the most popular Node.js framework because it makes the hard things easy — like upgrading from a bicycle to a motorcycle!</p>
  `,
  'ex-2': `
    <p>REST APIs follow a <strong>simple recipe</strong> — like a restaurant menu with four standard sections.</p>
    <p>Imagine a library with books:</p>
    <ul>
      <li><strong>GET /books</strong> — "Show me all the books you have." (List)</li>
      <li><strong>GET /books/3</strong> — "Show me book #3." (Read one)</li>
      <li><strong>POST /books</strong> — "Here's a new book I wrote, please add it." (Create)</li>
      <li><strong>PUT /books/3</strong> — "Here's an updated version of book #3." (Replace/Update)</li>
      <li><strong>DELETE /books/3</strong> — "Book #3 is terrible, please remove it." (Delete)</li>
    </ul>
    <p>This is called <strong>CRUD</strong> — Create, Read, Update, Delete. Every REST API in the world follows this same pattern. Once you learn it for books, you know it for users, products, posts, comments — everything!</p>
    <p>Think of REST as a <strong>universal remote control</strong> — same buttons (GET, POST, PUT, DELETE) work for every device (API)!</p>
  `,
  'ex-3': `
    <p>Building an Express REST API from scratch is like <strong>setting up a lemonade stand</strong>.</p>
    <p><strong>Step 1:</strong> Get your table and pitcher ready — <code>npm init</code> and <code>npm install express</code></p>
    <p><strong>Step 2:</strong> Create the stand — <code>const app = express()</code></p>
    <p><strong>Step 3:</strong> Make a sign listing what you sell — <code>app.get('/lemonade', ...)</code></p>
    <p><strong>Step 4:</strong> Handle orders — parse the request, do the logic, send the response</p>
    <p><strong>Step 5:</strong> Open for business — <code>app.listen(3000)</code></p>
    <p>Each route is a menu item. Each route handler is the recipe for making that item. Middleware (<code>app.use(express.json())</code>) is like having a helper who takes the money and hands out change — it handles the boring common stuff so you can focus on making lemonade!</p>
  `,

  // ─── Module 5: npm & Package Management ───
  'npm-1': `
    <p><strong>npm</strong> is like a <strong>giant app store for JavaScript code</strong>.</p>
    <p>Instead of writing everything from scratch, you can go to the npm store and download packages that other developers have written. Need to send emails? There's a package. Need to format dates? There's a package. Need to validate email addresses? There's definitely a package!</p>
    <p><code>npm install express</code> is like going to the App Store, searching for "Express", and clicking "Install". The package gets downloaded into a folder called <code>node_modules</code> (like your phone's "Apps" folder).</p>
    <p><code>package.json</code> is like the <strong>receipt</strong> that lists everything you installed. When you share your code with someone else, they just run <code>npm install</code> and npm reads the receipt to download all the same packages — like giving someone your shopping list instead of giving them all the groceries!</p>
  `,
  'npm-2': `
    <p><code>package.json</code> is the <strong>ID card</strong> for your project. It tells everyone what your project is called, what version it is, and what other packages it depends on.</p>
    <ul>
      <li><strong><code>dependencies</code></strong> — Packages your app needs to RUN (like milk and eggs for a cake)</li>
      <li><strong><code>devDependencies</code></strong> — Packages your app needs to BUILD (like a mixer and oven — you don't need them to eat the cake, only to make it)</li>
      <li><strong><code>scripts</code></strong> — Shortcut commands like <code>npm start</code> or <code>npm test</code> (like speed dial buttons on your phone)</li>
    </ul>
    <p><strong>Semantic Versioning (SemVer)</strong> is a version-numbering system that tells you how big a change is: <code>MAJOR.MINOR.PATCH</code></p>
    <ul>
      <li><strong>PATCH</strong> (1.0.0 → 1.0.1) — "Bug fix, nothing new." (Like fixing a typo)</li>
      <li><strong>MINOR</strong> (1.0.0 → 1.1.0) — "New feature, but everything old still works." (Like adding a color option)</li>
      <li><strong>MAJOR</strong> (1.0.0 → 2.0.0) — "Big changes, might break your code." (Like completely redesigning the product)</li>
    </ul>
    <p>The <code>^</code> in <code>"express": "^4.18.0"</code> means "I'm OK with minor updates (4.18.1, 4.19.0) but not major ones (5.0.0)".</p>
  `,
  'npm-3': `
    <p><code>package-lock.json</code> is like a <strong>receipt with exact prices</strong>, while <code>package.json</code> is like a <strong>shopping list with approximate amounts</strong>.</p>
    <p><code>package.json</code> says "I need express version 4.x.x" (any minor version is fine).</p>
    <p><code>package-lock.json</code> says "I need EXACTLY express version 4.18.2, which depends on body-parser 1.20.1, which depends on bytes 3.1.2, etc." It locks down the <strong>exact</strong> version of every package and sub-package.</p>
    <p>This is important because: If you install a package today and your teammate installs it next week, the versions might be different (new releases happen!). The lock file ensures everyone gets <strong>exactly the same versions</strong> — like taking a screenshot of your receipt so you can buy the exact same items later.</p>
    <p>Always commit <code>package-lock.json</code> to git! It's the "proof of purchase" for your project.</p>
  `,

  // ─── Module 6: Async/Await & Promises Deep Dive ───
  'async-1': `
    <p>A <strong>Promise</strong> is like <strong>ordering a pizza</strong> on the phone.</p>
    <p>You call the pizza place and order. They say "Your pizza will be ready in 30 minutes." That's a <strong>Promise</strong> — it's not the pizza yet, but a guarantee that the pizza will come eventually.</p>
    <p>The Promise has three states:</p>
    <ul>
      <li><strong>Pending</strong> — Pizza is in the oven. Waiting...</li>
      <li><strong>Fulfilled</strong> — Pizza is ready and delivered! (The <code>.then()</code> part runs)</li>
      <li><strong>Rejected</strong> — The restaurant burned down. No pizza for you! (The <code>.catch()</code> part runs)</li>
    </ul>
    <p>In JavaScript: <code>fetch('/api/users')</code> returns a Promise. You use <code>.then()</code> to say "when the data arrives, do this with it" and <code>.catch()</code> to say "if it fails, handle it this way".</p>
    <p>A Promise is like a gift card — it's not the gift itself, but a promise that you'll get the gift later!</p>
  `,
  'async-2': `
    <p>If Promises are like ordering a pizza with a <strong>callback ringer</strong>, <strong>async/await</strong> is like ordering a pizza and <strong>just waiting at home</strong> until it arrives — no special devices needed!</p>
    <p><code>async function</code> marks a function as "this function works with promises." <code>await</code> says "pause here until the promise is done, then give me the result."</p>
    <p>Without async/await (callback hell):</p>
    <p><code>getUser(id, user => { getPosts(user.id, posts => { displayPosts(posts); }); });</code></p>
    <p>With async/await (clean and readable):</p>
    <p><code>const user = await getUser(id);<br>const posts = await getPosts(user.id);<br>displayPosts(posts);</code></p>
    <p>It's like reading a recipe from top to bottom — step 1, then step 2, then step 3. Much easier to understand than nested callbacks!</p>
    <p>Use <code>try/catch</code> to handle errors: <code>try { const data = await fetchData(); } catch (err) { console.error(err); }</code> — like having a fire extinguisher ready in case something goes wrong!</p>
  `,
  'async-3': `
    <p><strong>Promise.all()</strong> is like <strong>ordering from multiple restaurants at once</strong> instead of one at a time.</p>
    <p>Sequential: Order from Pizza Hut → wait → Pizza arrives → Order from Chinese place → wait → Food arrives → Done. (Slow!)</p>
    <p>Parallel: Order from Pizza Hut AND Chinese place AND Taco Bell at the same time → All food arrives... eventually. (Fast!)</p>
    <p>In code: <code>const [pizza, chinese, tacos] = await Promise.all([orderPizza(), orderChinese(), orderTacos()]);</code></p>
    <p><strong>Async iterators</strong> are like a <strong>conveyor belt of cookies coming out of the oven</strong> — one by one, as they're ready.</p>
    <p>Instead of waiting for ALL cookies to be baked before you can eat them (like Promise.all), you can eat each cookie AS IT COMES OUT of the oven (async iterator). Great for streaming data, processing large files, or handling real-time events!</p>
  `,

  // ─── Module 7: Events & Streams ───
  'ev-1': `
    <p>The <strong>EventEmitter</strong> is like a <strong>doorbell</strong>.</p>
    <p>You install a doorbell (create an EventEmitter). You tell your family "when the doorbell rings, come to the door" (register an event listener with <code>.on()</code>). When someone actually rings the bell (<code>.emit('ring')</code>), everyone comes running!</p>
    <p>In Node.js, many things use events:</p>
    <ul>
      <li>An HTTP server emits a <code>'request'</code> event when someone visits your site</li>
      <li>A file stream emits a <code>'data'</code> event when it reads a chunk of a file</li>
      <li>A database connection emits an <code>'error'</code> event when something breaks</li>
    </ul>
    <p>Events are like <strong>announcements on a train station PA system</strong>: "Train arriving on platform 3!" (event). People who care about that train (listeners) react. People who don't care just ignore it.</p>
    <p>You can have MULTIPLE listeners for the same event — like multiple family members all responding to the same doorbell!</p>
  `,
  'ev-2': `
    <p>A <strong>Stream</strong> in Node.js is like a <strong>water pipe</strong>.</p>
    <p>Imagine you need to drink an entire swimming pool of water. You have two options:</p>
    <ul>
      <li><strong>Old way (no stream):</strong> Wait until the entire pool is emptied into a giant tank, then start drinking. You need a HUGE tank (lots of memory!) and you wait FOREVER.</li>
      <li><strong>Stream way:</strong> Put a pipe from the pool directly into your mouth. You drink water AS IT FLOWS through the pipe — no waiting, no giant tank needed!</li>
    </ul>
    <p>Streams process data <strong>piece by piece</strong> instead of loading everything into memory. This is essential for:</p>
    <ul>
      <li>Reading large files (gigabyte-sized CSVs)</li>
      <li>Receiving video/audio (streaming Netflix)</li>
      <li>Handling file uploads (receiving a file in chunks)</li>
    </ul>
    <p>Streams are like a <strong>straw</strong> vs trying to lift the entire glass to your mouth!</p>
  `,
  'ev-3': `
    <p><strong>Piping</strong> streams is like connecting <strong>garden hoses together</strong>.</p>
    <p>You have a faucet (source stream) and you want to fill a watering can (destination stream). A pipe connects them — water flows automatically!</p>
    <p>In Node.js: <code>readableStream.pipe(writableStream)</code> automatically reads from the source and writes to the destination, managing the flow speed so the destination doesn't get overwhelmed.</p>
    <p>Real example: <code>fs.createReadStream('bigfile.mp4').pipe(fs.createWriteStream('copy.mp4'));</code></p>
    <p>This copies a file without loading the entire file into memory — like connecting two garden hoses and letting the water flow!</p>
    <p>You can chain pipes: <code>readStream.pipe(transformStream).pipe(writeStream)</code> — like connecting a faucet to a filter to a bottle. The filter (transform stream) processes the water as it passes through!</p>
  `,

  // ─── Module 8: Error Handling & Debugging ───
  'err-1': `
    <p>Errors in Node.js are like <strong>warning lights on a car dashboard</strong>.</p>
    <p>When your car has a problem, a light turns on — "Check Engine", "Low Tire Pressure", "Battery". Each light tells you what's wrong and lets you fix it before the car breaks down completely.</p>
    <p>In Node.js, errors are the same. When something goes wrong, Node.js throws an error — like turning on a warning light. If you <strong>catch</strong> the error, you can handle it gracefully (tell the user "Something went wrong, please try again"). If you don't catch it, the program crashes — like ignoring the check engine light until the engine explodes!</p>
    <p>There are two types of errors:</p>
    <ul>
      <li><strong>Operational errors</strong> — Expected problems: file not found, invalid input, network timeout (handle these with try/catch)</li>
      <li><strong>Programmer errors</strong> — Bugs in your code: trying to use a variable that doesn't exist, calling a function wrong (fix these by fixing the code)</li>
    </ul>
  `,
  'err-2': `
    <p>Using <strong>try/catch</strong> with async/await is like wearing a <strong>seatbelt</strong> — you hope you never need it, but you'll be glad it's there when something goes wrong!</p>
    <p><code>try { const data = await riskyOperation(); } catch (error) { console.error('Oops:', error.message); }</code></p>
    <p>The <code>try</code> block is like the safe road you're driving on. The <code>catch</code> block is the airbag that deploys if you crash.</p>
    <p>In Node.js, never let an async error go unhandled. An <strong>unhandled promise rejection</strong> is like a ticking time bomb — it might crash your entire server at any moment!</p>
    <p>Always use <strong>process.on('unhandledRejection', handler)</strong> as a safety net — like having a fire extinguisher in your kitchen just in case!</p>
  `,
  'err-3': `
    <p>Using Node.js's built-in <strong>debugger</strong> is like putting <strong>X-ray goggles</strong> on your code.</p>
    <p>Instead of guessing what your code is doing, you can PAUSE execution at any line and look around:</p>
    <ul>
      <li>"What values do my variables have right now?"</li>
      <li>"Is this function even being called?"</li>
      <li>"What does this object look like at this moment?"</li>
    </ul>
    <p>The simplest debugging tool: <code>console.log()</code> — like leaving sticky notes around your house to see what's happening. "Was I here? Yes ✅"</p>
    <p>More advanced: <code>node inspect app.js</code> starts the built-in debugger — like putting a magnifying glass on your code and watching it run in slow motion!</p>
    <p><strong>Pro tip:</strong> Use <code>console.log</code> like a trail of breadcrumbs — but don't leave them in production code! Remove them when you're done debugging, like cleaning up after a party!</p>
  `,

  // ─── Module 9: Testing (Mocha/Jest) ───
  'test-1': `
    <p>Writing tests is like <strong>checking your math homework</strong> before turning it in.</p>
    <p>You could check all the answers by hand (manual testing) — clicking every button, filling every form, making sure everything works. But that takes forever and you might miss things!</p>
    <p>Instead, you write an <strong>automated test</strong> — a tiny program that checks one specific thing. Your test says "When I call <code>add(2, 3)</code>, I expect <code>5</code>." Then the test runner (Jest or Mocha) runs ALL your tests in seconds and tells you which ones passed and which ones failed!</p>
    <p>Think of tests as a <strong>safety net</strong> for your code. When you make changes, you run your tests to make sure nothing broke. If a test fails, you know EXACTLY what broke — like a smoke detector that tells you which room is on fire!</p>
  `,
  'test-2': `
    <p> <strong>Mocha</strong> and <strong>Jest</strong> are like two different <strong>types of coffee makers</strong> — they both make coffee (run tests), but they work a bit differently.</p>
    <p><strong>Jest</strong> is like a <strong>Keurig</strong> — everything is built in. You install one package and you get a test runner, assertions, mocking, coverage reports — all in one! It's the most popular choice for Node.js apps.</p>
    <p><strong>Mocha</strong> is like a <strong>French press</strong> — it's simpler and you choose your own extras. You need to add assertion libraries (like Chai) and mocking tools separately. It gives you more control but requires more setup.</p>
    <p>Both use a similar syntax:</p>
    <ul>
      <li><code>describe('Calculator', () => { ... })</code> — Group related tests (like a chapter in a book)</li>
      <li><code>it('should add two numbers', () => { ... })</code> — A single test (like a paragraph)</li>
      <li><code>expect(result).toBe(5)</code> — Check if something is true (like "is 2+2 = 4?")</li>
    </ul>
    <p>Tests are like instructions for a robot: "Do this, then check that. If it's right, give a green checkmark. If wrong, show a red X."</p>
  `,
  'test-3': `
    <p>For an Express API, you want to test <strong>real HTTP requests</strong> — like sending an actual letter to your server and checking the reply.</p>
    <p><strong>Supertest</strong> is a tool that does exactly this. It takes your Express app, makes fake HTTP requests to it, and lets you check the responses.</p>
    <p><code>request(app).get('/api/users').expect(200).then(res => { expect(res.body).toHaveLength(3); });</code></p>
    <p>This is like having a <strong>robot mail carrier</strong> who delivers letters to your server and brings back the responses for you to check!</p>
    <p>What to test in a REST API:</p>
    <ul>
      <li>Successful requests return the right status code (200, 201)</li>
      <li>Error cases return the right error codes (400, 404, 500)</li>
      <li>The response body has the right shape (correct fields, correct types)</li>
      <li>Edge cases (empty data, missing fields, invalid IDs)</li>
    </ul>
    <p>Think of testing like quality control at a factory — every product (endpoint) gets checked before it ships!</p>
  `,

  // ─── Module 10: Deployment (PM2/Docker) ───
  'deploy-1': `
    <p>Deploying a Node.js app is like <strong>moving from your college dorm room to your own apartment</strong>.</p>
    <p>Your development computer is the <strong>dorm room</strong> — comfortable, safe, and only you can visit. You can't invite the whole world to your dorm party — the RA (operating system) won't allow it!</p>
    <p>A production server (like AWS, DigitalOcean, or Vercel) is your <strong>own apartment</strong> — it has a real address (IP address/domain) that anyone in the world can visit!</p>
    <p>When you move out, you need:</p>
    <ul>
      <li><strong>Environment variables</strong> — Like a lockbox outside your door. Database passwords, API keys — things that are different in your dorm vs your apartment. Set them with <code>process.env</code>.</li>
      <li><strong>The right door number</strong> — Your app should listen on <code>process.env.PORT</code> (whatever the building gives you), not a hard-coded <code>3000</code>.</li>
      <li><strong>A start command</strong> — <code>npm start</code> or <code>node app.js</code> — the moving instructions for how to run your app.</li>
    </ul>
  `,
  'deploy-2': `
    <p><strong>PM2</strong> is like a <strong>robot babysitter for your Node.js app</strong>.</p>
    <p>Your app is like a toddler — if left alone, it might fall down (crash), wander into traffic (use too much memory), or just decide to take a nap (stop responding).</p>
    <p>PM2 watches your app 24/7 and:</p>
    <ul>
      <li>Restarts it if it crashes ("Get up, you're fine!")</li>
      <li>Starts it automatically when the server reboots ("Wake up, the computer is on!")</li>
      <li>Runs multiple copies for better performance ("Let's train your twin to share the work!")</li>
      <li>Keeps logs of everything your app does ("I wrote down everything that happened!")</li>
    </ul>
    <p><code>pm2 start app.js</code> starts your app with a babysitter. <code>pm2 list</code> shows all apps being watched. <code>pm2 logs</code> shows what your app is printing.</p>
    <p>Without PM2, if your app crashes at 3 AM, nobody is there to restart it until morning — your users see an error page all night!</p>
  `,
  'deploy-3': `
    <p><strong>Docker</strong> is like a <strong>shipping container for your app</strong> — it packages your code AND everything it needs to run into one portable box.</p>
    <p>Imagine you bake amazing cookies at home, and you want to bake them in your friend's kitchen. But your friend has different ovens, different ingredients, different tools! Your cookies might not turn out the same.</p>
    <p>Docker solves this: you put your entire kitchen (Node.js version, all packages, config files) inside a portable container. Your friend just needs to "unpack the container" and everything works perfectly — same Node version, same packages, same settings!</p>
    <p>A <code>Dockerfile</code> is like a <strong>recipe card</strong> for building your container:</p>
    <ul>
      <li>"Start with this base image" (e.g., <code>FROM node:18-alpine</code>)</li>
      <li>"Copy your code into the container" (<code>COPY . /app</code>)</li>
      <li>"Install dependencies" (<code>RUN npm install</code>)</li>
      <li>"Set the start command" (<code>CMD ["node", "app.js"]</code>)</li>
    </ul>
    <p>Docker guarantees: "It works on MY machine" becomes "It works on EVERY machine!"</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5NodeData = eli5NodeData;
