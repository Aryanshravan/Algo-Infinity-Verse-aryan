/**
 * ELI5 (Explain Like I'm 5) content for FastAPI Learning Hub lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5FastapiData = {
  // ─── Module 1: FastAPI Basics & Routing ───
  'fa-1': `
    <p>Imagine you're building a <strong>restaurant menu</strong> for computers.</p>
    <p>When a computer (called a "client") visits your restaurant, it asks "What's on the menu?" Your job is to give it back a list of food items. That's what <strong>FastAPI</strong> does — it helps you build these menus (APIs) super fast!</p>
    <p>The <code>@app.get("/")</code> part is like saying: <strong>"When someone walks through the front door, give them the Welcome Mat."</strong></p>
    <p>The <strong>Swagger UI</strong> is like a <strong>free, automatic menu preview</strong> that FastAPI creates for you — it shows all your dishes (endpoints) in a beautiful webpage so other developers can try them out!</p>
    <p>Best part? You write your code once, and FastAPI automatically creates documentation, validates data, and handles all the boring stuff. Like having a robot chef, waiter, and dishwasher all in one!</p>
  `,
  'fa-2': `
    <p>Think of <strong>HTTP methods</strong> as different <strong>actions in a library</strong>:</p>
    <ul>
      <li><strong>GET</strong> = Looking at a book on the shelf (reading data)</li>
      <li><strong>POST</strong> = Adding a new book to the shelf (creating data)</li>
      <li><strong>PUT</strong> = Replacing an old book with a new one (updating everything)</li>
      <li><strong>DELETE</strong> = Removing a book from the library (deleting data)</li>
    </ul>
    <p>In FastAPI, each action gets its own <strong>decorator</strong> — like a sticker on a file folder that says what to do with it. <code>@app.get()</code> = "This folder is for looking, not changing."</p>
    <p>The return value is like handing a note back to the library visitor — FastAPI automatically writes it neatly in JSON format so anyone can read it!</p>
  `,
  'fa-3': `
    <p>Think of FastAPI's metadata like the <strong>name, logo, and description</strong> on a restaurant's front door.</p>
    <p>When you pass <code>title="My Cool API"</code> and <code>version="2.0.0"</code> to FastAPI, it's like putting up a sign that says <strong>"Welcome to Bob's Burger Joint — Version 2.0!"</strong></p>
    <p><strong>Tags</strong> are like <strong>menu sections</strong> — "Appetizers," "Main Courses," "Desserts." Grouping endpoints with tags makes your Swagger docs organized and professional.</p>
    <p>This metadata helps other developers understand your API without reading a single line of code. It's like having a clean menu with pictures instead of a messy handwritten list!</p>
  `,

  // ─── Module 2: Path & Query Parameters ───
  'param-1': `
    <p>Imagine you're a <strong>postal worker</strong> sorting mail.</p>
    <p>A <strong>path parameter</strong> is like a <strong>mail slot number</strong>. If the address says "Apartment {apartment_number}", you look at the actual number and deliver to that specific apartment. In FastAPI, <code>/users/{user_id}</code> means "grab whatever number is in this spot and call it user_id."</p>
    <p>A <strong>query parameter</strong> is like <strong>delivery instructions on the envelope</strong>. <code>?q=test&page=2</code> means "please search for 'test' and give me page 2." These are extra options that filter or change the result.</p>
    <p>Path parameters = <strong>WHAT</strong> you want. Query parameters = <strong>HOW</strong> to filter it.</p>
  `,
  'param-2': `
    <p>Python <strong>type hints</strong> are like <strong>labels on jars</strong> in your kitchen.</p>
    <p>When you label a jar "Sugar" and someone fills it with salt, you know immediately something is wrong! Similarly, when you declare <code>item_id: int</code> and someone sends "abc", FastAPI catches the error before your code even runs.</p>
    <p>Parameters with <strong>default values</strong> (<code>q: str = None</code>) are like optional toppings at a pizza place — you can ask for them, but if you don't, no problem!</p>
    <p>Parameters <strong>without defaults</strong> (<code>item_id: int</code>) are like the pizza dough itself — you MUST have it, or there's no pizza!</p>
  `,
  'param-3': `
    <p><strong>Advanced validation</strong> is like having a <strong>very strict security guard</strong> at the door.</p>
    <p>The guard checks everything: "Is the ID at least 1? Is the search term between 2 and 50 characters? Is the price between $0 and $10,000? Does it match our allowed categories?"</p>
    <p><strong>Enums</strong> are like a <strong>vending machine with buttons</strong>. You can only press A1, A2, or A3 — there's no A4 button! In FastAPI, if you create a SortBy enum with "name", "price", and "date", the API accepts ONLY those three values.</p>
    <p>This saves you from writing lots of "if-else" checks. Let FastAPI's validators do the boring work!</p>
  `,

  // ─── Module 3: Pydantic Models & Validation ───
  'pyd-1': `
    <p>Think of a <strong>Pydantic model</strong> as a <strong>registration form</strong> at a doctor's office.</p>
    <p>The form has fields: <strong>Name</strong> (must be text), <strong>Age</strong> (must be a number), <strong>Email</strong> (must have @ symbol). When you fill it out, the receptionist checks everything before accepting it — if you write "twenty" in the Age field, they'll say "That's not a number, please fix it!"</p>
    <p>In FastAPI, Pydantic models do the same thing for JSON data. You define the fields and their types, and Pydantic automatically checks that incoming data matches. If something is wrong, it sends back a clear error message — like a helpful receptionist!</p>
    <p>Fields with defaults (<code>tax: float = None</code>) are like optional questions: "Do you want to add a tip? (leave blank if not)."</p>
  `,
  'pyd-2': `
    <p><strong>Nested models</strong> are like <strong>Russian nesting dolls</strong> — a big doll contains smaller dolls inside.</p>
    <p>Your API might receive a complex order: an Order contains a Customer (name, email), a List of Items (product, quantity, price), and a Shipping Address (street, city, zip). Instead of one giant flat form, you create smaller forms inside the big form!</p>
    <p><strong>Field validation</strong> (<code>Field(ge=0, le=100)</code>) is like saying "the price must be between $0 and $100." If someone tries to buy something for $1,000,000, FastAPI automatically rejects it before your code runs.</p>
    <p>Special types like <strong>EmailStr</strong> and <strong>HttpUrl</strong> are like specialized stampers — one stamps "This is a valid email!" and the other stamps "This is a valid URL!" They save you from writing validation logic yourself.</p>
  `,
  'pyd-3': `
    <p><strong>Custom validators</strong> are like <strong>special rules</strong> at a hotel.</p>
    <p>A regular registration form checks basic things (name is text, age is number). But a hotel has special rules: "Check-in date must be before check-out date. Minimum stay is 2 nights. No more than 4 guests per room."</p>
    <p>In Pydantic, the <code>@validator</code> decorator lets you add these <strong>custom business rules</strong>. You write a function that checks the data and raises an error if the rule is broken.</p>
    <p>The <strong>Config class</strong> is like the hotel manager's settings: "Don't accept any extra fields not on the form (<code>extra = "forbid"</code>)." It gives you control over how strict your model is!</p>
  `,

  // ─── Module 4: Dependency Injection ───
  'di-1': `
    <p>Imagine a <strong>fast-food restaurant</strong>.</p>
    <p>Every time a customer orders, the cashier needs to know: "Are they a kid or an adult? Do they want a combo? What size drink?" Instead of every cashier figuring this out from scratch, they have a <strong>standard order form</strong> they fill out for every customer.</p>
    <p>In FastAPI, <strong>dependencies</strong> are like those standard forms. Common things like <strong>pagination</strong> (which page, how many items per page), <strong>authentication</strong> (who is this user?), and <strong>database connections</strong> are used by many endpoints.</p>
    <p>Instead of writing the same code in every endpoint, you create a <strong>dependency function</strong> once and plug it in with <code>Depends()</code> wherever needed. Like having a pre-filled form that every cashier uses!</p>
  `,
  'di-2': `
    <p><strong>Class-based dependencies</strong> are like <strong>vending machines that can be configured</strong>.</p>
    <p>A regular vending machine always sells snacks at $1. But a <strong>configurable</strong> vending machine lets you set the price when you install it. "This machine sells snacks for $2, that one for $0.50."</p>
    <p>Similarly, a class dependency lets you configure behavior: <code>Pagination(default_limit=25)</code> creates a pagination dependency that defaults to 25 items per page, while another might default to 10.</p>
    <p>The <strong>yield</strong> keyword in dependencies is like a <strong>library book check-in desk</strong>. When you borrow a book (<code>yield</code>), you promise to return it. After you're done with your request, FastAPI runs the code after <code>yield</code> to "return the book" — like closing a database connection!</p>
  `,
  'di-3': `
    <p><strong>Global dependencies</strong> are like <strong>security cameras</strong> in a shopping mall.</p>
    <p>You don't put cameras only at specific stores — they cover EVERYWHERE. Similarly, you might want to <strong>log every request</strong> or <strong>check every API key</strong> across all your endpoints. Instead of adding the check to each endpoint, you make it a global dependency.</p>
    <p><strong>Dependency overrides</strong> are like <strong>movie stunt doubles</strong>. When you're testing, you can swap out the real dependency (like a real database) with a fake one (like a mock database). This is super useful for testing without touching your real data!</p>
    <p>Think of it as "for testing purposes only, replace the real chef with a cooking robot that follows the recipe perfectly every time."</p>
  `,

  // ─── Module 5: OAuth2 & JWT Authentication ───
  'auth-1': `
    <p>Think of a <strong>theme park</strong>:</p>
    <p><strong>Authentication</strong> is showing your <strong>ticket at the entrance</strong> — the guard checks if your ticket is real and not expired. "Yes, you are who you say you are. Come in!"</p>
    <p><strong>Authorization</strong> is checking what rides you can go on AFTER you're inside. "You have a VIP pass? You can go on all rides! Only a regular ticket? No roller coaster for you."</p>
    <p>FastAPI's <code>OAuth2PasswordBearer</code> is like the <strong>ticket scanner</strong> at the entrance. It reads the <strong>token</strong> from the request header (like scanning a barcode) and gives it to your code to verify.</p>
    <p>Authentication first ("Who are you?"), then authorization ("What can you do?"). Never skip the first step!</p>
  `,
  'auth-2': `
    <p>A <strong>JWT (JSON Web Token)</strong> is like a <strong>stamped hand at a music festival</strong>.</p>
    <p>When you enter, security stamps your hand with a special ink that glows under UV light. Throughout the day, you can leave and re-enter just by showing your hand — no need to show your ID and ticket again.</p>
    <p>A JWT has three parts:</p>
    <ol>
      <li><strong>Header</strong> — "What ink was used?" (the algorithm, like HS256)</li>
      <li><strong>Payload</strong> — "What's written on the hand?" (user ID, role, expiration time)</li>
      <li><strong>Signature</strong> — "Does the glow match?" (cryptographic proof it's real)</li>
    </ol>
    <p>The <strong>secret key</strong> is like the special UV light formula that only the security team knows. If someone steals it, they can forge hand stamps!</p>
    <p>JWTs have an <strong>expiration time</strong> — like hand stamps that fade after 24 hours. This limits damage if a token is stolen.</p>
  `,
  'auth-3': `
    <p><strong>Role-Based Access Control (RBAC)</strong> is like a <strong>school with different access badges</strong>.</p>
    <ul>
      <li><strong>Students</strong> — Can enter classrooms and the cafeteria</li>
      <li><strong>Teachers</strong> — Can also enter the staff room</li>
      <li><strong>Principal</strong> — Can access everything, including the office</li>
      <li><strong>Custodian</strong> — Can access the boiler room but not classrooms</li>
    </ul>
    <p>In your API, each user has a <strong>role</strong> stored inside their JWT. When they try to access a route, a <strong>role-checking dependency</strong> checks: "Is this user's role high enough to access this endpoint?"</p>
    <p>Roles create a <strong>hierarchy</strong>. An admin can do everything a user can do, plus more. This way, you don't need to check "Is the user admin or user or moderator?" — you just check "Is their level high enough?"</p>
  `,

  // ─── Module 6: Background Tasks & Scheduled Jobs ───
  'bt-1': `
    <p>Imagine you're a <strong>waiter at a restaurant</strong>.</p>
    <p>A customer orders a steak. You tell the chef, then bring the steak to the customer. But while the chef is cooking, you don't just stand there — you help other customers, clear tables, etc.</p>
    <p>Similarly, when a user makes a request to your API, you can <strong>respond immediately</strong> and then do extra work in the <strong>background</strong> — like sending a confirmation email or logging the request.</p>
    <p>FastAPI's <code>BackgroundTasks</code> is like a <strong>post-it note</strong> you stick on the order: "After serving the customer, also send them a thank-you email." The customer gets their food instantly, and the email goes out a moment later!</p>
  `,
  'bt-2': `
    <p>If <code>BackgroundTasks</code> is like a <strong>post-it note</strong>, <strong>Celery</strong> is like a <strong>separate delivery service</strong>.</p>
    <p>Imagine you run a bakery. Sometimes someone orders a cake that takes 3 hours to bake. You can't make the customer wait 3 hours! Instead, you write down the order, give it to a <strong>delivery driver (Celery Worker)</strong>, and tell the customer "Your cake will arrive in 3 hours."</p>
    <p>The <strong>Redis broker</strong> is like the <strong>order board</strong> on the wall. FastAPI writes tasks on the board (publishes to Redis), and the Celery workers read tasks from the board and execute them. If you need more workers, just hire more delivery drivers!</p>
    <p>This is called <strong>horizontal scaling</strong> — you can run 1 worker or 100 workers, depending on how busy you are!</p>
  `,
  'bt-3': `
    <p><strong>Scheduled jobs</strong> are like <strong>automatic sprinklers in a garden</strong>.</p>
    <p>You set them to turn on every morning at 6 AM. You don't need to water the plants manually every day — the sprinklers do it automatically.</p>
    <p><strong>Celery Beat</strong> is the timer that triggers scheduled tasks: "Clean up old database records every night at 3 AM. Send daily summary emails at 8 AM. Generate weekly reports on Monday at 9 AM."</p>
    <p><strong>Monitoring</strong> is like checking that the sprinklers actually turned on. <strong>Flower</strong> gives you a web dashboard showing which tasks succeeded, which failed, and how long they took. Like having a smart home system that tells you "Sprinklers ran successfully today!"</p>
  `,

  // ─── Module 7: Middleware & CORS ───
  'mw-1': `
    <p>Imagine a <strong>car wash</strong>. Your car (the HTTP request) drives through a series of stations:</p>
    <ol>
      <li><strong>Soap spray</strong> — Logs the request (adds a timestamp)</li>
      <li><strong>Brush rollers</strong> — Checks the request for security issues</li>
      <li><strong>Rinse</strong> — Adds headers to the response</li>
      <li><strong>Dry</strong> — Measures how long the whole process took</li>
      <li><strong>Exit</strong> — The route handler sends the final response</li>
    </ol>
    <p>Each station is a <strong>middleware</strong>. It does one job and calls <code>call_next</code> to send the request to the next station. Middleware can modify the request BEFORE the route handler and the response AFTER.</p>
    <p>Without middleware, you'd have to add logging, timing, and security checks to EVERY route individually. With middleware, you add them once and they apply to all routes!</p>
  `,
  'mw-2': `
    <p><strong>CORS</strong> is like a <strong>list of approved visitors</strong> at a private club.</p>
    <p>By default, your API (the club) doesn't allow visitors from other websites (strangers) to make requests. This is for security — you don't want random websites to access your API without permission.</p>
    <p>But sometimes you WANT other websites to access your API. Maybe your frontend runs on <code>localhost:3000</code> and your API on <code>localhost:8000</code>. CORS is like adding that address to the approved visitors list!</p>
    <p>The <strong>preflight request</strong> (OPTIONS method) is like a security guard asking: "Who's at the door?" before letting anyone in. The browser sends this first, and if the server says "It's cool, let them in," the real request proceeds.</p>
  `,
  'mw-3': `
    <p><strong>Rate limiting middleware</strong> is like a <strong>bouncer at a busy nightclub</strong>.</p>
    <p>The club can only hold 100 people. If 200 people show up, the bouncer lets in 10 per minute and tells the rest to wait. This prevents overcrowding and gives everyone a good experience.</p>
    <p>Similarly, rate limiting prevents any single user from making too many requests too quickly. This protects your API from abuse — both malicious (DDoS attacks) and accidental (a buggy client sending infinite requests).</p>
    <p><strong>Request IDs</strong> are like <strong>luggage tags</strong>. Every suitcase (request) gets a unique tag when it enters the airport (your API). If something goes wrong, you can find exactly which suitcase had the problem by its tag number!</p>
  `,

  // ─── Module 8: WebSocket Support ───
  'ws-1': `
    <p>Imagine a <strong>walkie-talkie</strong> vs a <strong>letter</strong>.</p>
    <p>HTTP is like sending letters: You write a request, mail it, wait for a response. Each letter is a separate transaction. You can't send 100 letters per second easily.</p>
    <p><strong>WebSocket</strong> is like a walkie-talkie: You press the button, and you have an open line. You can talk (send messages) whenever you want, and the other person can respond instantly. Both sides can talk at any time!</p>
    <p>In FastAPI, the <code>@app.websocket("/ws")</code> decorator sets up this open channel. <code>websocket.accept()</code> is like pressing the "talk" button to start. Then you can send and receive messages in real-time!</p>
  `,
  'ws-2': `
    <p>A <strong>chat room</strong> with WebSockets is like a <strong>group walkie-talkie channel</strong>.</p>
    <p>Everyone on the channel hears what anyone says. When Alice says "Hello!", Bob, Charlie, and everyone else hears it. That's called <strong>broadcasting</strong>.</p>
    <p>The <strong>ConnectionManager</strong> is like a <strong>list of all walkie-talkie users</strong>. When someone joins, you add them to the list. When someone leaves, you remove them. When someone speaks, you broadcast to everyone on the list.</p>
    <p>Without the ConnectionManager, you'd have to manually track each user — like trying to remember everyone who's listening to your walkie-talkie channel!</p>
  `,
  'ws-3': `
    <p><strong>WebSocket authentication</strong> is like a <strong>secret handshake</strong> before entering a club.</p>
    <p>When someone wants to join the WebSocket channel, they first show their membership card (JWT token) as a query parameter: <code>ws://example.com/ws?token=abc123</code>. If the token is valid, they're allowed in.</p>
    <p><strong>Per-connection state</strong> is like giving each member a <strong>name tag</strong> when they enter. You store their username, their role, and what room they're in. This lets you send private messages and know who's who.</p>
    <p>A <strong>heartbeat</strong> is like checking if someone is still alive on the walkie-talkie. Every few seconds, the server sends a "ping" and expects a "pong" back. If no response, the connection is probably dead, and you can clean it up.</p>
  `,

  // ─── Module 9: SQLAlchemy & Database Integration ───
  'sqla-1': `
    <p>Imagine you have a <strong>giant filing cabinet</strong> (a database).</p>
    <p>Without SQLAlchemy, you'd have to speak "filing cabinet language" (SQL) directly: "Open drawer 3, find folder 'Users', give me all files where age > 18." It works, but it's easy to make mistakes!</p>
    <p><strong>SQLAlchemy</strong> is like having a <strong>translator</strong> who converts Python into filing cabinet language. You just say "Give me all users older than 18" in Python, and SQLAlchemy handles the translation.</p>
    <p>The <strong>database session</strong> is like a <strong>temporary library card</strong> you get when you enter the library. You use it to interact with the database, and you return it when you leave. FastAPI dependencies handle this automatically — like a librarian who gives and collects cards at the door!</p>
  `,
  'sqla-2': `
    <p>CRUD operations with SQLAlchemy are like <strong>playing with LEGO blocks</strong>:</p>
    <ul>
      <li><strong>Create</strong> — Grab a new LEGO piece and put it on the board (<code>db.add()</code>)</li>
      <li><strong>Read</strong> — Look at the board and find specific pieces (<code>db.query().all()</code>)</li>
      <li><strong>Update</strong> — Swap a red LEGO for a blue one (<code>setattr()</code> + <code>db.commit()</code>)</li>
      <li><strong>Delete</strong> — Remove a LEGO piece from the board (<code>db.delete()</code>)</li>
    </ul>
    <p>The most important step is <strong>commit</strong> (<code>db.commit()</code>) — like taking a photo of your LEGO creation to save it permanently. If you don't commit, your changes disappear!</p>
    <p><strong>Pagination</strong> (<code>.offset().limit()</code>) is like looking at a long bookshelf. Instead of seeing all 1,000 books at once, you look at 10 books at a time, flipping pages (offset).</p>
  `,
  'sqla-3': `
    <p><strong>Database relationships</strong> are like <strong>connections between family members</strong>.</p>
    <p>A Mom <strong>has many</strong> Children. Each Child <strong>belongs to</strong> one Mom. This is a <strong>one-to-many</strong> relationship.</p>
    <p>In SQLAlchemy, you use a <code>ForeignKey</code> to link tables — like writing the Mom's ID number on each child's birth certificate. Then <code>relationship()</code> lets you navigate the connection naturally: <code>mom.children</code> gives you all children, <code>child.mom</code> gives you the mom.</p>
    <p><strong>Alembic</strong> is like a <strong>home renovation journal</strong>. Every time you move a wall (change your database schema), you write down exactly what you changed. If something breaks, you can go back to a previous version. Without Alembic, changing the database is like renovating without a plan — chaotic and risky!</p>
  `,

  // ─── Module 10: Testing with Pytest ───
  'test-1': `
    <p>Testing is like <strong>checking your homework before turning it in</strong>.</p>
    <p>When you solve a math problem, you double-check: "Does 2 + 2 really equal 4?" In programming, you do the same thing — you write <strong>tests</strong> that check if your code works correctly.</p>
    <p><strong>Pytest</strong> is like a <strong>super-fast robot grader</strong>. You write the questions (tests), and Pytest runs them all at once and tells you which ones passed and which ones failed.</p>
    <p>Instead of manually typing URLs in your browser to test your API, you write a test that does it automatically in 0.1 seconds. And you can run ALL your tests with one command: <code>pytest</code>!</p>
  `,
  'test-2': `
    <p><strong>TestClient</strong> is like a <strong>robot that pretends to be a web browser</strong>.</p>
    <p>You tell the robot: "Send a GET request to <code>/items/1</code>. Check that the response has status 200 and contains the item name 'Widget'." The robot does this instantly, without actually opening a browser or starting a real server.</p>
    <p>This is incredibly fast because everything runs in <strong>memory</strong> — no network, no disk I/O, no waiting for servers to start. A test suite with 100 tests might run in under 1 second!</p>
    <p>You should write tests for both <strong>happy paths</strong> (everything works correctly) and <strong>sad paths</strong> (what happens when something goes wrong). Test that 404 is returned when an item doesn't exist. Test that 422 is returned when validation fails.</p>
  `,
  'test-3': `
    <p><strong>Fixtures</strong> are like <strong>pre-set ingredients</strong> for cooking.</p>
    <p>Before baking a cake, you pre-measure flour, sugar, and eggs. Every cake recipe uses the same pre-measured ingredients. In testing, fixtures are <strong>pre-set data or objects</strong> that multiple tests can use.</p>
    <p><strong>Mocking</strong> is like using a <strong>fake stove</strong> for practice. You don't want to actually set your kitchen on fire while learning to cook! Similarly, you <strong>mock</strong> external services (like payment APIs or databases) so tests are fast, reliable, and don't depend on external systems.</p>
    <p><strong>Parametrized tests</strong> (<code>@pytest.mark.parametrize</code>) are like testing a <strong>vending machine with every coin</strong>. You don't just test with $1 — you test with $0.25, $0.50, $1.00, $5.00, and a wooden nickel! Each test case checks that the machine responds correctly.</p>
  `,

  // ─── Module 11: Deployment (Docker/Gunicorn) ───
  'deploy-1': `
    <p>Think of your <strong>laptop</strong> as a <strong>kitchen in your home</strong>.</p>
    <p>You can cook for yourself just fine. But if you want to open a <strong>restaurant</strong> (production), you need a <strong>commercial kitchen</strong> (a real server) with proper equipment, safety standards, and enough capacity for many customers.</p>
    <p><strong>Gunicorn</strong> is like having <strong>multiple chefs</strong> instead of one. If 100 customers arrive, one chef would be overwhelmed. But 4 chefs (Gunicorn workers) can handle 100 orders efficiently!</p>
    <p><strong>Environment variables</strong> are like the <strong>secret recipes</strong> that change between your home kitchen and the restaurant. Your database password is different at home vs production — environment variables let you change these without modifying your code!</p>
  `,
  'deploy-2': `
    <p><strong>Docker</strong> is like a <strong>lunchbox</strong> for your app.</p>
    <p>You put your app, its ingredients (Python, FastAPI), and cooking instructions (requirements.txt) into the lunchbox. It works ANYWHERE — on your laptop, your friend's computer, or a server in the cloud. No more "but it worked on MY machine!"</p>
    <p><strong>Multi-stage builds</strong> are like <strong>packing a lunch efficiently</strong>. In the first stage, you bring the whole grocery store (build tools, compilers). In the second stage, you only pack the ready-made sandwich (your app and its runtime). The final lunchbox is much smaller!</p>
    <p><strong>Docker Compose</strong> is like having a <strong>lunchbox with compartments</strong>. One compartment has your app, another has the database, another has Redis. Everything fits together neatly and starts up together with one command.</p>
  `,
  'deploy-3': `
    <p><strong>CI/CD</strong> is like an <strong>automatic food delivery pipeline</strong>.</p>
    <p>You cook the food (write code), put it on the conveyor belt (push to GitHub). The machine automatically checks the quality (runs tests), packs it (builds Docker image), and ships it to the customer (deploys to cloud). All without you lifting a finger after pushing!</p>
    <p><strong>Health checks</strong> (<code>/health</code> endpoint) are like a <strong>restaurant's "Open" sign</strong>. The sign tells customers "We're open and ready!" Cloud platforms check this sign periodically — if it's not lit, they restart your app.</p>
    <p><strong>Structured logging</strong> (JSON format) is like writing a <strong>captain's log with consistent columns</strong>. Instead of messy journal entries ("Saw something weird today"), you write clean data ("time: 10:30, level: error, message: DB timeout"). This makes it easy to search, analyze, and alert on!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5FastapiData = eli5FastapiData;
