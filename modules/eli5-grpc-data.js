/**
 * ELI5 (Explain Like I'm 5) content for the gRPC & Protobuf Academy.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5GrpcData = {
    // ─── Module 1: gRPC Fundamentals ───
    'grpc-fundamentals-1': `
        <p>Imagine two friends who live in different buildings. One wants the other to <strong>fetch a book</strong> from their shelf, but they can't just reach across — they're too far apart.</p>
        <p>Instead, they invent a <strong>magic remote control</strong>. Friend A presses a button labeled <strong>"Get Book"</strong>, and Friend B's robot arm instantly grabs the book and hands it back. Friend A doesn't have to think about stairs, doors, or walking — the remote control handles all that.</p>
        <p>That's what <strong>gRPC</strong> is: a magic remote control for computer programs. Your code says <code>getUser(42)</code>, and gRPC secretly packages up your request, sends it over the internet to another computer, waits for the answer, and hands it back to you like nothing happened.</p>
        <p>The recipe cards that describe what you're ordering are written in a special language called <strong>Protocol Buffers</strong> — it's how both computers agree on what a "User" looks like before they even start talking.</p>
        <p>And why "gRPC" instead of "gRPC just works" or "Great RPC"? The "g" originally stood for Google, where the project was born. These days it's a fully open-source project used by companies all over the world.</p>
    `,
    'grpc-fundamentals-2': `
        <p>Why do so many companies pick gRPC? Think of it like choosing between <strong>sending letters</strong> and <strong>using a messenger pigeon</strong> — both deliver messages, but they work very differently.</p>
        <p><strong>1. It's fast.</strong> gRPC packs your data into tiny, super-compressed packages (binary) instead of long text letters (JSON). Less stuff to carry = faster delivery. It also reuses the same delivery route for many messages at once, like a bus carrying many passengers instead of a taxi per person.</p>
        <p><strong>2. It writes code for you.</strong> You write one simple recipe (<code>.proto</code> file) describing your data. Then gRPC magically writes all the boring boilerplate code for you — both the sending side and the receiving side. You never hand-write the "how to pack and unpack" code again.</p>
        <p><strong>3. It can stream.</strong> Imagine watching a live sports match. You don't want to ask "any update?" every second — you want the game to push updates to you. gRPC supports <strong>streaming</strong>: the server just keeps sending updates as they happen.</p>
        <p>When is it <strong>not</strong> the best choice? If a web browser needs to talk directly to your server, JSON over HTTP is easier — browsers and gRPC don't naturally speak the same dialect without a translator (gRPC-Web).</p>
    `,
    'grpc-fundamentals-3': `
        <p>REST and gRPC are like <strong>two different languages</strong> for two computers to talk to each other. Both get the job done, but they're better in different situations.</p>
        <p><strong>REST</strong> is like speaking in <strong>long sentences with lots of words</strong> (JSON text). It's easy for humans to read — you can open a browser and see exactly what's being said. It's great for talking to websites.</p>
        <p><strong>gRPC</strong> is like speaking in <strong>super-efficient shorthand</strong> (binary). It's harder for humans to read directly, but much faster and more compact. It's great for computers talking to other computers at high speed.</p>
        <p>Here's a fun way to remember it:</p>
        <ul>
            <li><strong>REST</strong> = A friendly postcard you can read instantly, but it takes a lot of room.</li>
            <li><strong>gRPC</strong> = A tiny coded message that's super fast to send, but you need a decoder ring (the .proto recipe).</li>
        </ul>
        <p>Real apps often use <strong>both</strong>: REST for the public website (so browsers can read it) and gRPC between their own internal servers (for speed). There's even a magic bridge called <strong>gRPC-Web</strong> that lets browsers talk to gRPC services anyway!</p>
    `,

    // ─── Module 2: Protocol Buffers — Messages ───
    'protobuf-messages-1': `
        <p>Imagine you're packing a suitcase for a trip. <strong>JSON</strong> is like packing with lots of labeled bags: "NAME: Alice", "AGE: 30", "IS_HAPPY: true". Very clear, but bulky.</p>
        <p><strong>Protocol Buffers</strong> is like packing with a <strong>shared secret code</strong>: you and your travel buddy agree beforehand that spot #1 in the suitcase is always the name, spot #2 is always the age, and spot #3 is always "is happy". Then you just pack the values tightly — no labels needed. The suitcase is tiny!</p>
        <p>That agreement is written in a <code>.proto</code> file. It says "here's what a User looks like — a name, an age, and a happy flag, in this exact order." Both the sender and receiver use that recipe to pack and unpack.</p>
        <p>Best of all, the same recipe works in <strong>any language</strong>. One recipe, and you get a ready-made "User" object in Go, Java, Python, JavaScript — wherever you need it.</p>
    `,
    'protobuf-messages-2': `
        <p>When you fill out a form, every box needs a <strong>type</strong>. A phone number box only accepts numbers; a name box only accepts text.</p>
        <p>Protocol Buffers is the same — every field has a type:</p>
        <ul>
            <li><code>int32</code> — a whole number like <strong>7</strong></li>
            <li><code>double</code> — a number with decimals like <strong>3.14</strong></li>
            <li><code>bool</code> — a yes/no like <strong>true</strong></li>
            <li><code>string</code> — text like <strong>"Hello"</strong></li>
            <li><code>bytes</code> — raw stuff like a photo file</li>
        </ul>
        <p>There's a rule in proto3: if you don't fill in a box, it's not "nothing" — it's the <strong>default</strong>. Numbers default to 0, text defaults to empty, yes/no defaults to false. Like a form that auto-fills "N/A" for anything you skip.</p>
        <p>And if you have <strong>many</strong> of the same thing (like a list of friends), you mark it <code>repeated</code> — that's protobuf's way of saying "a whole bunch of these."</p>
    `,
    'protobuf-messages-3': `
        <p>So far we've packed simple things — a name, a number, a flag. But real life has <strong>lists</strong>, <strong>menus of choices</strong>, and <strong>nested boxes</strong>.</p>
        <p><strong>repeated</strong> is like a <strong>shopping list</strong>: <code>repeated string tags</code> means "a list of labels." You can have one tag or a hundred.</p>
        <p><strong>enum</strong> is like a <strong>choice menu</strong>: "Is the package Active, Paused, or Banned?" You can't pick anything off the menu — only the listed options. In proto3 the menu always has an option #0, used as the "not chosen yet" default.</p>
        <p><strong>map</strong> is like a <strong>label → value dictionary</strong>: <code>map&lt;string, int32&gt;</code> pairs product names with quantities — "apples → 3, bananas → 5."</p>
        <p><strong>Nested messages</strong> are like <strong>boxes inside boxes</strong>: a Product box can contain a smaller Price box (currency + amount). And <strong>packages</strong> are like naming your company's folders so nobody's "User" collides with someone else's "User."</p>
    `,
    'protobuf-messages-4': `
        <p>Writing protobuf definitions by hand is easy, but <strong>turning them into working code</strong> is what <code>protoc</code> is for.</p>
        <p>Think of <code>protoc</code> as a <strong>factory machine</strong>. You feed it the recipe (<code>.proto</code> file), press a button, and out pop finished products — ready-made classes and functions in your favorite programming language.</p>
        <p>Before the machine: you'd have to hand-write code to pack your data into binary, unpack it on the other side, and manage the network. That's error-prone and boring.</p>
        <p>After the machine: <code>protoc</code> generates it all. You get:</p>
        <ul>
            <li>A <strong>User</strong> class with save/load helpers</li>
            <li>A <strong>server template</strong> where you just fill in the business logic</li>
            <li>A <strong>client helper</strong> that can call the server with one line</li>
        </ul>
        <p>It's like hiring an <strong>auto-complete fairy</strong>: you describe what you want once, and the fairy writes all the plumbing. There's even a tool called <strong>Buf</strong> that double-checks your recipes for mistakes before they ship!</p>
    `,

    // ─── Module 3: Defining gRPC Services ───
    'grpc-services-1': `
        <p>A <strong>service</strong> in gRPC is like a <strong>restaurant menu</strong> — it lists all the things a client can ask a server to do.</p>
        <p>The menu might say: "Get User", "List Users", "Save Users", "Chat". Each menu item is called an <strong>RPC method</strong>, and it comes with a description of what you hand over (the order) and what you get back (the meal).</p>
        <p>Those "order" and "meal" descriptions are just protobuf messages — the <code>User</code> boxes you learned about earlier.</p>
        <p>The menu has <strong>four styles</strong> of dishes:</p>
        <ul>
            <li><strong>One in, one out</strong> — like ordering a single coffee.</li>
            <li><strong>One in, many out</strong> — like ordering a water and getting refills all afternoon.</li>
            <li><strong>Many in, one out</strong> — like uploading a whole photo album and getting back one "thanks!"</li>
            <li><strong>Many in, many out</strong> — like a two-way walkie-talkie conversation.</li>
        </ul>
        <p>After you write the menu, gRPC's code machine prints a <strong>server apron</strong> (where you cook) and a <strong>client menu card</strong> (what customers use to order).</p>
    `,
    'grpc-services-2': `
        <p><strong>Unary RPC</strong> is the simplest kind of call — just like <strong>ordering one pizza</strong>.</p>
        <p>You call the pizza place (send one request). They make your pizza (process it). They deliver exactly one pizza back (one response). Done! No follow-ups.</p>
        <p>Here's the whole conversation:</p>
        <ul>
            <li><strong>Client:</strong> "One large pepperoni, please."</li>
            <li><strong>Server:</strong> "Here's your large pepperoni!"</li>
        </ul>
        <p>It's one round-trip. This is the default and most common RPC type — perfect when a question has one answer, like "what's user #42's name?"</p>
        <p>In code, the server function receives the request and calls <code>callback(null, reply)</code> to hand back the answer. The client calls the generated method and receives the reply in a callback. Simple as ordering a pizza!</p>
    `,
    'grpc-services-3': `
        <p><strong>Server streaming</strong> is like subscribing to a <strong>live weather alert radio</strong>.</p>
        <p>You tune in once (one request: "tell me about storms near me"). The radio doesn't answer once — it keeps playing updates: "Rain in 10 minutes… rain in 5… lightning nearby!" (many responses).</p>
        <p>You don't keep asking. The server <strong>pushes</strong> updates whenever they happen. That's the superpower of streaming — no annoying "any news yet?" polling.</p>
        <p>Real examples: a live stock ticker pushing price updates, or a big download streaming progress percentages.</p>
        <p>In code, the server calls <code>call.write(update)</code> for each new message, and the client listens with <code>stream.on('data', ...)</code>. When the server finishes, it ends the stream.</p>
    `,
    'grpc-services-4': `
        <p>If server streaming is a live radio, the last two RPC types flip the microphone around.</p>
        <p><strong>Client streaming</strong> is like <strong>recording a voice memo</strong>. You talk for a while (many requests: "first row… second row… third row…") and when you stop, the app replies with ONE summary: "Saved 3 rows!" It's great for uploading or sending lots of data at once.</p>
        <p><strong>Bidirectional streaming</strong> is a <strong>walkie-talkie conversation</strong>. Both people can talk at the same time, and messages flow both ways. In a chat app, you send a message while the server is sending you messages — neither waits for the other.</p>
        <p>The only rule: like two people on walkie-talkies, each side keeps <strong>their own order</strong>. If you say "1, 2, 3", they arrive in that order — but your messages and theirs aren't mixed into one single timeline.</p>
    `,

    // ─── Module 4: How Clients & Servers Communicate ───
    'grpc-communication-1': `
        <p>Under the hood, gRPC rides on a special road called <strong>HTTP/2</strong>. Imagine a superhighway with <strong>many lanes</strong>.</p>
        <p>Old HTTP/1.1 is like a single-lane road: only one car (request) can travel at a time per road. If you need to send 10 requests, they line up single-file — slow!</p>
        <p>HTTP/2 is a <strong>multi-lane highway</strong>: all 10 requests travel at the same time in their own lanes, sharing the same road (one connection). That's called <strong>multiplexing</strong> — many trips, one road, no traffic jam.</p>
        <p>gRPC also wraps each message in a tiny <strong>mailing box</strong> with a label on the outside saying how big the package is. That's the "framing" — a 5-byte tag that says "the real content starts here and is this long."</p>
        <p>Finally, when a call finishes, the server attaches a small <strong>receipt</strong> (trailer) saying "SUCCESS" or "FAILED" — like a delivery note taped to the box. That receipt is how the client knows everything went fine.</p>
    `,
    'grpc-communication-2': `
        <p>When a gRPC client starts up, it builds a <strong>highway toll booth</strong> — that's the <strong>channel</strong>. It's the connection your calls travel through, with fancy extras like automatic re-routing if the road closes.</p>
        <p>On top of the toll booth sits a <strong>menu card</strong> — the <strong>stub</strong>. It lists every RPC method with friendly buttons: "Get User", "Create Order". You just press the button; the stub figures out the road and toll booth for you.</p>
        <p>There's also a cool feature called <strong>interceptors</strong> — think of them as <strong>security guards at the toll booth</strong>. Before any car (request) drives through, the guard checks passports (adds auth token), stamps timesheets (logs the call), or even waves some cars through again if they broke down (retries).</p>
        <p>One pro tip: keep the toll booth open! Creating a new channel for every single call is like closing the road and rebuilding it each time you send a letter. Reuse the channel and calls are super fast.</p>
    `,
    'grpc-communication-3': `
        <p>Have you ever waited forever for a friend who said "be there in 5 minutes"? <strong>Deadlines</strong> are gRPC's way of saying "I won't wait forever."</p>
        <p>When you make a call, you can set a deadline: <strong>"If this takes longer than 5 seconds, give up."</strong> The server even sees your countdown timer and knows how much time is left.</p>
        <p>Why does this matter? Imagine calling a server that has crashed. Without a deadline, your program waits and waits and waits — like calling a phone that never rings, forever. Worse, if lots of programs do this, they pile up like cars stuck in a ghost traffic jam.</p>
        <p>With a deadline, after the time is up, gRPC simply says <strong>"DEADLINE_EXCEEDED — time's up!"</strong> and everyone moves on. The server also gets a signal to stop working on your request — like hanging up the phone so the other person stops talking to nobody.</p>
        <p>Rule of thumb: always set a deadline. It's like wearing a seatbelt — cheap insurance.</p>
    `,
    'grpc-communication-4': `
        <p>When a gRPC call finishes, the server always leaves a <strong>receipt</strong> with a status code — like a thumbs up or thumbs down. These codes are like a <strong>traffic-light system</strong> for errors.</p>
        <ul>
            <li><strong>Green (OK)</strong> — everything worked!</li>
            <li><strong>Yellow (transient)</strong> — UNAVAILABLE (server is having a moment), DEADLINE_EXCEEDED (ran out of time). Try again later.</li>
            <li><strong>Red (permanent)</strong> — NOT_FOUND (that thing doesn't exist), INVALID_ARGUMENT (you sent bad data), PERMISSION_DENIED (you're not allowed). Retrying won't fix these.</li>
        </ul>
        <p>Think of it like ordering from a shop:</p>
        <ul>
            <li>"That item doesn't exist" → NOT_FOUND → you shouldn't reorder.</li>
            <li>"The shop is closed" → UNAVAILABLE → come back in a minute.</li>
            <li>"You don't have an account" → UNAUTHENTICATED → log in first.</li>
        </ul>
        <p>Your code can read the code on the receipt and decide what to do: show a "not found" page, retry a flaky call, or alert a human about a real bug. Reading receipts = robust apps.</p>
    `,

    // ─── Module 5: Protocol Buffers — Advanced ───
    'protobuf-advanced-1': `
        <p>Imagine filling out a form. Most boxes are <strong>"implicit"</strong>: if you leave "favorite color" empty, the system just assumes "none" — it can't tell the difference between "you left it blank" and "you wrote 'none'."</p>
        <p>Sometimes that matters! If you're updating your profile, leaving a box blank should mean "don't change this field," not "set it to nothing." That's when protobuf gives you the <strong>optional</strong> keyword — it adds a checkbox: "Did the person fill this in, or not?"</p>
        <p>Then there's <strong>oneof</strong>, which is like an <strong>either-or</strong> question: "Are you delivering by <strong>truck</strong> or by <strong>ship</strong>?" You must pick exactly one. The moment you pick ship, the truck choice is erased. oneof makes sure you never accidentally send both.</p>
    `,
    'protobuf-advanced-2': `
        <p>Different programmers handle dates, durations, and "nothing" differently — some write "2026-07-31", some write numbers, some write the day of the week in French. Chaos!</p>
        <p><strong>Well-known types</strong> are like <strong>standard plug sockets</strong>: Google made one universal shape everyone plugs into. A <code>Timestamp</code> is the agreed way to say "July 31, 2026 at 3:14 PM UTC" — every language's code turns it into its own friendly date object.</p>
        <p><strong>Wrapper types</strong> are a trick to make a simple value (like a number) able to be "blank" or "filled." It's like a gift box around a single number so the system can ask: "was this box handed over, or not?"</p>
        <p><strong>Any</strong> is the ultimate <strong>mystery box</strong>: it can hold <em>any</em> kind of message, with a label saying what's inside. Super flexible, but risky — like a package labeled "mystery item." Prefer the specific, typed boxes unless you truly don't know what's coming.</p>
    `,
    'protobuf-advanced-3': `
        <p>Writing everything in one giant file is like keeping your whole house in one room — it works but it's a mess. Real projects split <code>.proto</code> files into <strong>organized folders</strong>.</p>
        <p><strong>import</strong> is like saying "let's use the recipe book from the other room." You write <code>import "common.proto"</code> and suddenly all the shared definitions are available.</p>
        <p><strong>packages</strong> are like <strong>last names</strong>. Two families can both have a kid named "Alex" — the last name keeps them from being confused. Packages do that for messages: <code>shop.Order</code> and <code>logistics.Order</code> are different things even though both are called "Order."</p>
        <p>On the wire, the package even shows up in the RPC path: <code>/shop.OrderService/GetOrder</code> — it's the full name + surname of the service.</p>
    `,

    // ─── Module 6: Schema Evolution & Versioning ───
    'proto-versioning-1': `
        <p>Imagine you and a friend share a secret code book. One day you add a <strong>new page</strong> (a new field). Your friend's old book doesn't know about it — but when they read your message, they just <strong>skip the part they don't understand</strong> and keep reading. No crash!</p>
        <p>That's the magic of protobuf's compatibility: old readers ignore new stuff, and new readers handle old stuff gracefully.</p>
        <p>BUT — if you take page #1 and secretly change what it means (put "shoe size" where "name" used to be), your friend reads a name and gets "42"! That's why the rules are strict: <strong>never change a field's number or its meaning</strong>. Add new pages, don't rewrite old ones.</p>
        <p>There's even a safety robot called <strong>buf</strong> that checks your code book against the old one and yells if you'd break your friends' readers.</p>
    `,
    'proto-versioning-2': `
        <p>Field numbers are like <strong>house numbers on a street</strong>. Once a house is built, you can't renumber it — everyone's GPS points to the old number.</p>
        <p>Small house numbers are cheaper to write on envelopes: numbers 1-15 take one tiny "stamp byte," while bigger numbers take two. So put your <strong>most-used fields at 1-15</strong> — they're on every message, so saving a byte there adds up.</p>
        <p><strong>reserved</strong> is like putting a <strong>"do not build here" sign</strong> on an old empty lot. If you tear down a field, you mark its number reserved so nobody builds a new house (field) on that spot and confuses old GPS (old readers).</p>
        <p>And numbers 19000-19999 are like the mayor's private land — protobuf itself owns them, and the compiler refuses to let you build there.</p>
    `,
    'proto-versioning-3': `
        <p>Changing a shared contract is like renovating a building while everyone lives in it. The safe order is: <strong>add, migrate, then remove</strong>.</p>
        <p>Imagine the lobby has a sign that says "John's Bell" but John now goes by "J.D." Instead of repainting the sign (breaking everyone who looks for "John's Bell"), you hang a <strong>second sign</strong> next to it: "J.D.'s Bell." Visitors gradually switch. When everyone has switched, you quietly take down the old one.</p>
        <p>That's adding a new field with a new number, migrating writers, migrating readers, then retiring the old field.</p>
        <p>For big redesigns, you don't renovate in place — you build a <strong>new wing</strong> (<code>user.v2</code> package) and keep the old wing open until the tenants move. Both apartments exist side by side, and nobody is homeless.</p>
    `,

    // ─── Module 7: Production-Ready gRPC ───
    'grpc-production-1': `
        <p>Security is like a <strong>bank vault with three doors</strong>.</p>
        <p><strong>Door 1: TLS.</strong> The armored tunnel between bank and customer. Nobody on the street can read what's inside. (mTLS is like both sides showing ID cards to each other before the door opens.)</p>
        <p><strong>Door 2: Authentication.</strong> "Who are you?" Your <strong>membership card</strong> — a token — is checked at the door. Every request carries it, like a badge you wear all day.</p>
        <p><strong>Door 3: Authorization.</strong> "And what are you allowed to do?" Just because you're a member doesn't mean you can open the vault. The guard checks your permissions for THIS room (this RPC method).</p>
        <p>All three doors are needed. A tunnel without ID checks lets anyone in; ID without the tunnel lets anyone read the messages; permission checks without the first two are pointless.</p>
    `,
    'grpc-production-2': `
        <p>Keeping a service reliable is like running a <strong>food delivery fleet</strong>.</p>
        <p><strong>Retries</strong> are calling the restaurant back when the first order got lost in traffic ("driver unavailable"). But you only call back for <strong>fixable</strong> problems — if the customer said "no ketchup" and got ketchup, ordering again won't help. Retry only when it's safe to send the same order twice.</p>
        <p><strong>Load balancing</strong> is dispatching drivers to the restaurant with the shortest line. With round-robin, you take turns sending to each kitchen so none is overwhelmed; with pick-first, you always use your favorite kitchen until it closes, then switch to the next.</p>
        <p><strong>Health checks</strong> are the fleet dispatcher calling each kitchen: "Are you open?" Kitchens that don't answer get removed from the delivery app until they're ready again. That's how traffic avoids sick servers.</p>
    `,
    'grpc-production-3': `
        <p>Running a service without observability is like <strong>driving with the hood up and no dashboard</strong> — you're moving, but you have no idea if you're about to overheat.</p>
        <p><strong>Logs</strong> are the <strong>black box recorder</strong>: every call leaves a record — "who, what method, how long, what result." Structured logs are like well-organized flight logs instead of scribbles on napkins.</p>
        <p><strong>Metrics</strong> are the <strong>dashboard gauges</strong>: temperature, fuel, RPM. For a service that's requests per second, error rate, and response time (p95/p99).</p>
        <p><strong>Traces</strong> are the <strong>maps-app route replay</strong>: one user's request passes through 5 services, and you can see the whole trip — "ah, the 2-second delay happened at the payments service, not my code!" The context hops along with the request like a relay baton.</p>
        <p>Instrument once at the framework level, and every future RPC is automatically visible. Do it before you need it!</p>
    `,

    // ─── Module 8: gRPC in the Real World ───
    'grpc-integration-1': `
        <p>Browsers and gRPC are like <strong>two people who speak different languages</strong> — they can't just talk directly. Browsers speak "web language" (HTTP/1.1, no special trailers) and gRPC speaks "highway language" (HTTP/2 with secret receipts at the end).</p>
        <p><strong>gRPC-Web</strong> is the <strong>translator standing in the middle</strong>. Your browser talks to the translator in web language, and the translator forwards it to the gRPC server in highway language, then translates the answer back.</p>
        <p>There are a few things the translator can't do, though. Some conversations (talking while the other side talks — bidirectional streaming) just don't work through a browser translator. Those need a real desktop program speaking gRPC directly.</p>
        <p>And there's a newer translator named <strong>Connect</strong> who's even friendlier — it can also just speak plain JSON, so your frontend team can start today without learning binary at all.</p>
    `,
    'grpc-integration-2': `
        <p>Some customers like to order at the <strong>front counter</strong> (REST, JSON — easy to read) and some like to order through the <strong>drive-through speaker</strong> (gRPC — fast, binary). Maintaining two separate restaurants is double the work!</p>
        <p><strong>REST transcoding</strong> is one kitchen with <strong>two order windows</strong>. You write the recipe once (<code>.proto</code> file) and put little stickers on it saying "counter: <code>GET /v1/users/{id}</code>." A magic machine (<code>grpc-gateway</code>) reads those stickers and automatically builds the front counter.</p>
        <p>A customer writes a normal REST request → the gateway catches it → turns it into the binary recipe → hands it to the same kitchen (your gRPC server) → cooks it → serves the answer back as JSON.</p>
        <p>One recipe, two windows, zero double work. That's how big companies like Google run public APIs and internal services off the same definition.</p>
    `,
    'grpc-integration-3': `
        <p>With REST you can poke an API with a browser tab and see JSON instantly. With gRPC everything is binary — you can't just eyeball it. You need <strong>special tools</strong>.</p>
        <p><strong>Server reflection</strong> is like the restaurant posting its <strong>full menu on the door</strong>. Normally you'd need the recipe book (.proto file) to know what to order; reflection lets any tool ask "what do you serve?" and get the whole menu back.</p>
        <p><strong>grpcurl</strong> is the <strong>terminal superhero</strong>: it reads the menu on the door, lets you order (call methods), and prints the answers in readable text. No recipe book required.</p>
        <p>Other tools are like fancier ordering gadgets: <strong>evans</strong> is an interactive conversation, <strong>Bloom RPC</strong> is a pretty graphical app like Postman, and <strong>buf</strong> is the menu-quality inspector who checks recipes for mistakes and catches ones that would break old customers.</p>
        <p>Just remember: posting your full menu on the door is great for testing, but in production you might want to lock that door.</p>
    `,

    // ─── Module 9: Protobuf Wire Format & Performance ───
    'grpc-wire-1': `
        <p>Ever notice how a tiny grocery list with 3 items is shorter than one with 30? Protobuf uses this idea for numbers too: <strong>small numbers take less space</strong> than big ones. That's the <strong>varint</strong> trick — like writing "1" instead of "00000001".</p>
        <p>Each field on the wire is like a <strong>shipping label</strong>: it says "this is item #5" (the field number) and "what kind of item it is" (the wire type — a number, some text, or a big fixed chunk). The label is glued together from one number so it fits in a single tiny code.</p>
        <p>Reading protobuf bytes is like decoding a <strong>secret treasure map</strong>: you read a tag, figure out the field and its kind, then read the value, then repeat until the map ends.</p>
        <p>That's why protobuf is so small — it doesn't write "quantity: " for every field like JSON does. It just writes a tiny number that means "field 2 is coming next."</p>
    `,
    'grpc-wire-2': `
        <p>Imagine parking a car. A <strong>negative number</strong> in protobuf is like a super-long limo — it takes 10 parking spots! <strong>ZigZag</strong> is a trick that folds negative numbers in half (like folding paper so it fits), so -1 becomes a tiny smart car that parks in one spot.</p>
        <p><strong>Packed fields</strong> are like parking cars <strong>bumper-to-bumper</strong> instead of each in its own marked spot. A list of scores packs together into one neat row instead of repeating the "spot number" (tag) for every single score.</p>
        <p>And fields that hold nothing? Protobuf just <strong>skips them entirely</strong> — like leaving the empty parking spots at home. If a field is 0 or empty, it's not even sent. Less to carry!</p>
    `,
    'grpc-wire-3': `
        <p>Protobuf packs your message; gRPC puts it in a <strong>shipping box</strong>. Every box gets a 5-character address label: one character says "is this box vacuum-sealed?" and four characters say how long the box is.</p>
        <p><strong>Compression</strong> is like vacuum-sealing clothes for a suitcase. Squeeze the air out and everything fits in half the space! But vacuum-sealing takes effort — for tiny messages the squeezing work isn't worth it, so you only do it for big, text-heavy loads.</p>
        <p>There's also a <strong>max box size</strong> (usually 4MB). Like a shipping company refusing a giant crate, gRPC refuses messages that are too big. Instead of one huge crate, send lots of small boxes (streaming) — that's how pro systems handle big data.</p>
    `,

    // ─── Module 10: gRPC on Kubernetes & Service Meshes ───
    'grpc-k8s-1': `
        <p>Kubernetes is like running a <strong>delivery fleet</strong>. Each delivery truck is a <strong>pod</strong> running your gRPC server. When one breaks, the fleet manager (Kubernetes) spawns a new one automatically.</p>
        <p>A normal <strong>Service</strong> is like the fleet's single public phone number — everyone calls one number, and someone forwards. A <strong>headless service</strong> is different: it's like publishing a <strong>list of every truck's direct line</strong>. Your gRPC client gets the whole list and can call each truck directly, taking turns (round-robin).</p>
        <p><strong>Health probes</strong> are the fleet manager calling each truck: "Are you alive? Can you take a delivery?" Trucks that don't answer don't get work and get fixed. The gRPC version of that check is a special call the truck knows how to answer: "yes, I'm healthy."</p>
    `,
    'grpc-k8s-2': `
        <p>Imagine every delivery truck now has a <strong>personal assistant</strong> riding along — the "sidecar." You (the driver) just drive; the assistant handles everything else.</p>
        <p>The assistant checks <strong>passports</strong> at every handoff (automatic mTLS — both trucks prove who they are), decides which route to take (traffic shifting — send 10% of trucks down the new road to test it), and calls ahead when a road is closed (retries and timeouts).</p>
        <p>That assistant is the <strong>service mesh</strong>. You didn't change the truck at all — the assistant was just added. That's the magic: no code changes, and suddenly all services have security and smart routing.</p>
        <p>The catch: assistants cost money to hire. Only bring them in when your fleet is big enough that the coordination pays off.</p>
    `,
    'grpc-k8s-3': `
        <p>A <strong>gateway</strong> is the <strong>big post office</strong> of your system. Customers (apps, browsers, other companies) don't mail straight to your kitchen — they mail to the post office, and the post office sorts and delivers.</p>
        <p>The post office can accept <strong>many formats</strong>: letters (JSON REST), special envelopes (gRPC-Web), and express packages (native gRPC) — and translate between them. A customer sends a normal letter, the post office turns it into an express package, and your kitchen never knows the difference.</p>
        <p>It also does <strong>security checks</strong> at the front door (tokens, rate limits) and can <strong>split the mail</strong> — send 5% of deliveries to the new kitchen to make sure it's good before the full switch. That's canary traffic splitting.</p>
        <p>Envoy is a famous post office that speaks all the gRPC languages natively — that's why it's everywhere in the gRPC world.</p>
    `,

    // ─── Module 11: Testing gRPC Services ───
    'grpc-testing-1': `
        <p>Testing without a real network is like <strong>practicing on a flight simulator</strong>. You don't need to actually fly — you just need to exercise the pilot's decisions.</p>
        <p>A gRPC handler is just a function: give it a <strong>fake call</strong> (a pretend phone handset with "who called and what did they say") and a fake callback, and watch what it does. No server, no wires, no waiting.</p>
        <p>For streaming handlers, you hand over a <strong>dummy phone</strong> that records every message "written" into it. Then you can check: "did the server write the right updates in the right order?"</p>
        <p>And interceptors are tested by giving them a <strong>recording assistant</strong> for the next() step — you catch what they pass along (like whether they added the security badge to the request).</p>
    `,
    'grpc-testing-2': `
        <p>Unit tests are the simulator; <strong>integration tests</strong> are the <strong>dress rehearsal</strong>. Real stage, real actors, real lines — but a safe, disposable set.</p>
        <p>You start a real gRPC server on a random empty port (like booking a rehearsal room with a random room number), connect a real generated client, and exchange <strong>real bytes</strong> over a real connection. Bugs that only appear on the wire show up here.</p>
        <p>For databases and message brokers, <strong>Testcontainers</strong> spins up real versions in tiny disposable containers — real Postgres, real Kafka — so you're not testing against fakes that lie to you.</p>
        <p><strong>Contract tests</strong> are the recipe-check: golden fixtures freeze exactly how a message looks in bytes (like a signed photograph of the dish), and <code>buf</code> checks your .proto recipe against the old one to make sure you didn't secretly change a dish your partners depend on.</p>
    `,
    'grpc-testing-3': `
        <p><strong>Load testing</strong> is stress-testing a bridge. You don't drive one car across — you send a <strong>traffic jam</strong> and watch where it cracks.</p>
        <p><strong>ghz</strong> is the traffic generator for gRPC: you tell it how many calls to send and how many cars (workers) to send them concurrently, and it reports: how fast traffic flowed, how long each trip took, and — most importantly — the <strong>p99</strong>: the slowest 1% of trips. The average can look fine while the p99 is terrible.</p>
        <p>Then you test the <strong>bad days</strong>: what happens when a server is slow (deadlines trip), when a replica dies (retries kick in), or when a connection drops mid-conversation (does the stream notice?).</p>
        <p>Like a fire drill, you don't want to find out the exits are blocked during a real fire.</p>
    `,

    // ─── Module 12: Advanced Patterns & Design ───
    'grpc-patterns-1': `
        <p>Streaming is like watering a garden. A <strong>unary</strong> call is a watering can — one pour, done. <strong>Streaming</strong> is a garden hose — water keeps flowing.</p>
        <p><strong>Fan-out</strong> is one sprinkler that sprays <strong>many gardens at once</strong>. The server keeps a list of who's listening (subscribers) and sprays every one of them whenever there's news. If a sprinkler is clogged (slow subscriber), the server can stop spraying that one so it doesn't flood the whole system.</p>
        <p><strong>Resumable streams</strong> are like a bookmark in a book. If you stop reading at page 40, you don't start over — you resume at page 41. Uploads track a "bookmark" (byte offset) so an interrupted download resumes instead of restarting.</p>
        <p>And <strong>heartbeats</strong> are like tapping your foot to check your friend is still listening. If no response, the line's dead — hang up.</p>
    `,
    'grpc-patterns-2': `
        <p>gRPC is a <strong>phone call</strong> — both people are on the line, you ask, you get an answer, you hang up. Perfect when you need the answer <em>now</em>.</p>
        <p>Message queues (Kafka, RabbitMQ) are <strong>voicemail and post-it notes</strong> — you leave a message and walk away; the receiver picks it up whenever they're ready, and it's saved forever. Perfect for events nobody needs answered immediately.</p>
        <p>The <strong>outbox pattern</strong> is a clever mailbox: when you save an order to your notebook (database), you also drop a note in the <strong>outbox tray</strong> in the <em>same</em> writing session. Then a mail robot picks up notes from the tray and delivers them. Because the note was written together with the order, they can't get out of sync.</p>
        <p>Real systems mix both: <strong>phone call for commands</strong> (CreateOrder), <strong>post-it notes for events</strong> (OrderCreated) that other services read when they feel like it.</p>
    `,
    'grpc-patterns-3': `
        <p><strong>Idempotency</strong> is like pressing an elevator button <strong>twice</strong>. You don't want two elevators to arrive — one press per request, no matter how many times you mash it. An idempotency key is a special ticket you show the server: "I already sent this order, it's the same one, don't create a duplicate."</p>
        <p><strong>Long-running operations (LRO)</strong> are like ordering a <strong>custom cake</strong>. The bakery doesn't make you stand at the counter for 3 hours. They give you an order number (the Operation handle) and say "call us or check online later." You check: QUEUED → RUNNING → SUCCEEDED! Same with gRPC: start the job, get a job ID, poll for status.</p>
        <p>And <strong>cancellation cleanup</strong> is like telling the bakery "never mind, stop the cake" — they need to throw out the half-baked cake (clean up resources) so the kitchen doesn't fill up with abandoned desserts.</p>
    `,
};

/* Expose globally for script-tag usage */
window.eli5GrpcData = eli5GrpcData;
