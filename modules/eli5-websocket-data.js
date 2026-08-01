/**
 * ELI5 (Explain Like I'm 5) content for WebSocket & SSE Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5WebsocketData = {
  // ─── Module 1: Real-Time Communication Basics ───

  'ws-foundations-1': `
    <p><strong>Real-time communication</strong> on the web is like having a <strong>walkie-talkie</strong> instead of a mailbox. With a mailbox (HTTP request-response), you send a letter and wait for the mail carrier to bring a response back later. With a walkie-talkie (WebSocket), you press a button and someone hears you instantly!</p>
    <p>When you visit a website, your browser usually asks the server for things: "Give me this page" or "Save this form." This is called a <strong>request-response</strong> pattern -- like raising your hand in class, asking a question, and then waiting for the teacher to answer.</p>
    <p>But some apps need <strong>instant updates</strong> -- like a chat app where messages appear immediately, or a live sports score that changes without refreshing the page. For these, waiting and asking repeatedly doesn't work well. You need the server to be able to talk to you without you asking first!</p>
    <p>A <strong>persistent connection</strong> is like leaving the door open between two friends' rooms. Instead of running back and forth with notes, you can just shout across the hall whenever you have something to say. Both sides can talk anytime.</p>
  `,

  'ws-foundations-2': `
    <p><strong>Polling</strong> is like calling your friend every 5 seconds to ask "Are we there yet?" It works, but it's annoying for everyone involved. Your friend has to keep answering the phone over and over, even when nothing has changed.</p>
    <p><strong>Long-polling</strong> is a slightly smarter approach. It's like calling your friend and saying "Call me back when something interesting happens." Your friend holds the line open and only responds when there's actual news. But it still uses a lot of phone lines (server resources) just to keep the line open.</p>
    <p><strong>Persistent connections</strong> solve this problem entirely. It's like switching to a walkie-talkie channel. Once you're on the same channel, anyone can speak at any time -- no need to call, wait, or keep asking "Are we there yet?"</p>
    <p>The key difference: with polling, the client always starts the conversation. With persistent connections like WebSocket, the server can start a conversation too. This is called <strong>server push</strong>, and it's what makes real-time apps possible.</p>
  `,

  // ─── Module 2: WebSocket Protocol ───

  'websocket-protocol-1': `
    <p>A <strong>WebSocket handshake</strong> is like a <strong>secret handshake</strong> between two friends. First, you ask "Can we switch to WebSocket mode?" (the HTTP Upgrade request). If the server agrees, it says "Yes, switching protocols!" (the 101 response). After that, you're connected!</p>
    <p>The handshake starts as a regular HTTP request but includes a special header: <code>Upgrade: websocket</code>. It's like walking into a restaurant and saying "I'd like to use the VIP room instead." The host checks your reservation and if everything is good, escorts you to the private room where you can talk freely.</p>
    <p><strong>WS vs WSS</strong> is like HTTP vs HTTPS. WS (WebSocket) is unencrypted, while WSS (WebSocket Secure) uses TLS encryption. Always use WSS in production -- it keeps your data private, just like HTTPS does for regular web traffic.</p>
    <p>The handshake happens very fast -- usually in under a second. After this initial handshake, the connection stays open and both sides can send messages without any additional handshakes or headers.</p>
  `,

  'websocket-protocol-2': `
    <p><strong>WebSocket messages</strong> are like passing <strong>notes in class</strong>. Once you've established the secret handshake (connection), you can pass notes back and forth instantly. Each note can be either <strong>text</strong> (a written note) or <strong>binary</strong> (a drawing or diagram).</p>
    <p>The WebSocket connection has <strong>four states</strong> like the stages of a phone call:</p>
    <ul>
      <li><strong>CONNECTING</strong> (0) -- Dialing the number, waiting for pickup</li>
      <li><strong>OPEN</strong> (1) -- The call is connected, you can talk</li>
      <li><strong>CLOSING</strong> (2) -- Saying "Goodbye, I have to go now"</li>
      <li><strong>CLOSED</strong> (3) -- The call has ended</li>
    </ul>
    <p><strong>Text frames</strong> carry UTF-8 text -- like JSON data, chat messages, or commands. <strong>Binary frames</strong> carry raw bytes -- like images, audio, or file transfers. Most web apps use text frames with JSON because it's easy to read and debug.</p>
    <p>The WebSocket API in the browser provides four key <strong>events</strong>: <code>onopen</code> (call connected), <code>onmessage</code> (new message received), <code>onclose</code> (call ended), and <code>onerror</code> (something went wrong).</p>
  `,

  // ─── Module 3: Socket.IO in Practice ───

  'socketio-practice-1': `
    <p><strong>Socket.IO</strong> is like a <strong>fancy phone system</strong> built on top of regular WebSocket. While WebSocket gives you a raw connection, Socket.IO adds useful features like rooms, automatic reconnection, and named events.</p>
    <p><strong>Named events</strong> are like having different <strong>channels or topics</strong> for your messages. Instead of sending a plain message, you send a message "on the chat channel" or "on the typing indicator channel." This makes it easy to organize different types of messages.</p>
    <p><code>socket.emit('chat message', 'Hello!')</code> sends a message on the 'chat message' channel. <code>socket.on('chat message', (msg) => {...})</code> listens for messages on that channel. It's like tuning a radio to a specific station -- you only hear what's broadcast on that frequency.</p>
    <p>Socket.IO also handles <strong>fallback transports</strong>. If WebSocket isn't available (due to firewalls or proxies), Socket.IO automatically falls back to HTTP long-polling. Your app keeps working even when the fanciest communication method is blocked!</p>
  `,

  'socketio-practice-2': `
    <p><strong>Rooms</strong> in Socket.IO are like <strong>private chat rooms</strong> at a party. Everyone is connected to the same party (the server), but people in different rooms only hear conversations in their room.</p>
    <p>When a client calls <code>socket.join('room-1')</code>, it's like walking into Room 1. Now you only hear messages broadcast to Room 1. Messages sent to Room 2 don't reach you, and vice versa.</p>
    <p><strong>Broadcasting</strong> is like making an announcement to everyone in your room (or to everyone at the party). <code>io.to('room-1').emit('event', data)</code> sends to everyone in Room 1. <code>socket.broadcast.emit('event', data)</code> sends to everyone EXCEPT the sender.</p>
    <p><strong>Namespaces</strong> are like separate parties in different buildings. Each namespace has its own set of rooms and connections. For example, a chat app might use one namespace for public chats and another for admin notifications. They're completely isolated from each other.</p>
  `,

  'socketio-practice-3': `
    <p><strong>Reconnection</strong> is like having a <strong>callback feature</strong> on your phone. If the call drops unexpectedly, you don't give up -- you redial automatically.</p>
    <p>Socket.IO's reconnection works the same way. If the connection drops (network issue, server restart, etc.), Socket.IO automatically tries to reconnect. You can configure:</p>
    <ul>
      <li><strong>How many times</strong> to retry (<code>reconnectionAttempts</code>)</li>
      <li><strong>How long to wait</strong> between retries (<code>reconnectionDelay</code>)</li>
      <li><strong>Whether to increase</strong> the delay each time (<code>reconnectionDelayMax</code>)</li>
    </ul>
    <p><strong>Connection state recovery</strong> is the most advanced feature. When a client reconnects after a temporary disconnect, Socket.IO can recover missed events and restore the client's state -- like a voicemail system that plays back messages you missed while offline.</p>
    <p>For applications like collaborative editing or real-time gaming, reconnection with state recovery is critical. Without it, a user might lose their work or miss important updates when their connection drops.</p>
  `,

  // ─── Module 4: Server-Sent Events ───

  'sse-basics-1': `
    <p><strong>Server-Sent Events (SSE)</strong> are like a <strong>one-way radio broadcast</strong>. The server talks, and your browser listens. Unlike WebSocket, which is two-way (like a phone call), SSE is one-way -- only the server can send messages.</p>
    <p>The <code>EventSource</code> API in the browser makes SSE incredibly simple. You just create an <code>EventSource</code> object pointing to a URL, and the browser handles the connection automatically:</p>
    <p><code>const source = new EventSource('/api/events');</code></p>
    <p>That's it! The browser connects, keeps the connection open, and fires events whenever the server sends data. If the connection drops, <code>EventSource</code> automatically reconnects -- no code needed!</p>
    <p>SSE is ideal for <strong>live feeds, notifications, stock tickers, and progress updates</strong> -- anything where the server needs to push updates to the client, but the client doesn't need to send data back.</p>
  `,

  'sse-basics-2': `
    <p><strong>SSE data</strong> follows a simple text format. The server sends plain text with special fields. It's like receiving a formatted letter where each section has a label:</p>
    <ul>
      <li><code>data:</code> -- The actual message content</li>
      <li><code>event:</code> -- A custom event name (like 'score-update' or 'notification')</li>
      <li><code>id:</code> -- A unique identifier for the message (used for reconnection)</li>
      <li><code>retry:</code> -- How many milliseconds to wait before reconnecting</li>
    </ul>
    <p><strong>Custom events</strong> let you organize your data into different channels within a single SSE connection. For example, a dashboard might have 'stock-price', 'weather-alert', and 'user-count' events -- all flowing through one connection but handled by different listeners in the client.</p>
    <p>SSE's <strong>Last-Event-ID</strong> feature is like a bookmark. When the connection drops, the browser automatically sends the last received ID, and the server can send only the missed messages. This ensures no data is lost during temporary disconnections.</p>
  `,
  // ─── Module 5: WebSocket Security ───

  'ws-security-1': `
    <p><strong>Authentication</strong> on WebSocket is like showing your <strong>ID card</strong> at a secure building entrance. Before you can enter, the security guard checks your ID. In WebSocket terms, you send a token during the handshake, and the server verifies it before allowing the connection.</p>
    <p>Without authentication, anyone could connect to your server and send messages. It's like leaving your front door wide open. The auth token is your electronic keycard -- it proves who you are and what you're allowed to do.</p>
    <p><strong>Authorization</strong> is different from authentication. Authentication proves who you are (like showing your driver's license). Authorization determines what you can do (like a keycard that only opens certain doors). A user might be authenticated but not authorized to join an admin room.</p>
    <p><strong>WSS</strong> (WebSocket Secure) is like using an armored truck instead of a bicycle to deliver messages. Any data sent over regular WS can be read by anyone along the way. WSS encrypts everything so only the intended recipient can read it.</p>
  `,

  'ws-security-2': `
    <p><strong>Input validation</strong> is like checking your groceries before putting them in the fridge. If you just throw everything in without looking, you might put spoiled food next to fresh food, and everything gets ruined. Similarly, you must check every message from a client before processing it.</p>
    <p><strong>Rate limiting</strong> is like a bouncer at a club who only lets a certain number of people in per minute. Without a bouncer, the club gets overcrowded and no one can move. Without rate limiting, a single user could flood your server with millions of messages and bring everything down.</p>
    <p><strong>Origin checking</strong> is like checking the return address on an envelope. If a letter claims to be from your friend but has a suspicious return address, you might not open it. If a WebSocket connection comes from a domain you don't recognize, you can reject it.</p>
    <p>The most important rule: <strong>never trust the client</strong>. Even if your own JavaScript code validates inputs, someone can bypass your client and send raw WebSocket frames directly. Always validate on the server!</p>
  `,

  // ─── Module 6: Performance and Optimization ───

  'ws-performance-1': `
    <p><strong>Message compression</strong> is like vacuum-sealing your clothes for travel. A big, fluffy jacket takes up lots of space in your suitcase, but vacuum-sealing it makes it tiny. Similarly, large JSON messages can be compressed before sending, making them much smaller and faster to transmit.</p>
    <p>But compression has a catch. For tiny messages (like a simple "hello"), the compression overhead is bigger than the savings. It's like using a giant vacuum machine just to seal a single sock -- not worth the effort. That's why we set a <strong>threshold</strong> (only compress messages larger than a certain size).</p>
    <p><strong>Binary payloads</strong> are like using a shorthand code instead of full sentences. Instead of saying "My cursor moved to position X equals 150 and Y equals 300" (which takes 52 letters), you just write down the numbers in a compact code (10 characters). That's 5x faster!</p>
    <p>For most applications, regular JSON over WebSocket is fast enough. Only consider binary formats or compression when you're sending thousands of messages per second and measuring actual bottlenecks.</p>
  `,

  'ws-performance-2': `
    <p><strong>Backpressure</strong> is like a <strong>ketchup bottle</strong> that you squeeze too hard. You squeeze and squeeze, expecting ketchup to come out, but the opening is blocked and nothing comes out -- until suddenly it all bursts out at once. In WebSocket terms, the server might send messages faster than the network can deliver them, causing data to pile up in memory buffers.</p>
    <p>When too much data piles up waiting to be sent (this is called <strong>bufferedAmount</strong>), your server's memory usage grows and everything slows down. Socket.IO's <strong>volatile events</strong> help here. A volatile event is like a sticky note that says "read this if you have time" -- if the network is busy, it's okay to skip it. Regular events are like registered mail -- they must be delivered no matter what.</p>
    <p>Imagine you're in a group chat with 10,000 people. When you send a message, your phone tries to send it to all 10,000 people at once. That's like trying to shout to everyone in a stadium at the same time. Backpressure management makes sure your server doesn't crash from trying to send too many messages too quickly.</p>
  `,

  // ─── Module 7: Socket.IO Middleware ───

  'ws-middleware-1': `
    <p><strong>Middleware</strong> is like a <strong>security checkpoint</strong> at an airport. Before you board a plane (connect to the server), you must pass through security (middleware). Security checks your ID (authentication), scans your bags (validation), and makes sure you're on the right flight (authorization).</p>
    <p>Every passenger goes through the same checkpoint. Similarly, every socket connection goes through your middleware functions. If a passenger doesn't have a valid ticket, security stops them right there. If middleware fails, the connection is rejected immediately -- no message handlers ever run.</p>
    <p>Middleware runs in a specific order, like different checkpoints at the airport. First you show your ID (auth middleware), then you scan your bags (rate limit middleware), then you get your boarding pass (session middleware). If you fail any checkpoint, you don't get on the plane.</p>
    <p>You can also attach useful information to the socket during middleware (like the user's profile data). This is like getting a luggage tag at check-in -- the information follows you through the entire journey, available to every handler along the way.</p>
  `,

  'ws-middleware-2': `
    <p><strong>Advanced middleware</strong> is like having <strong>different security rules</strong> for different parts of a building. The front door might just check your ID, but the server room requires a special badge, and the executive floor needs a fingerprint scan. Each area has its own security level.</p>
    <p>In Socket.IO, different <strong>namespaces</strong> can have different middleware. The chat namespace might only check if you're logged in, but the admin namespace checks if you have admin privileges. It's like having different door policies for different rooms.</p>
    <p><strong>Async middleware</strong> is like a security guard who needs to call your reference before letting you in. They can't finish checking until they get an answer back. In code, this means fetching data from a database or calling an API before deciding whether to allow the connection.</p>
    <p><strong>Event-level middleware</strong> (via socket.use()) is like having rules for specific actions inside the building. Even after you're inside, you might need special permission to enter certain rooms or use certain equipment. Every action can have its own set of checks.</p>
  `,

  // ─── Module 8: Real-Time Architecture Patterns ───

  'ws-architecture-1': `
    <p><strong>Pub/Sub</strong> is like a <strong>radio station</strong>. The radio station (publisher) broadcasts music without knowing who is listening. Listeners (subscribers) tune in to the frequency without knowing where the broadcast comes from. The station and listeners never talk directly to each other.</p>
    <p>This is powerful because you can add more listeners without the station knowing or changing anything. And if a new station starts broadcasting, listeners can tune in without the old station needing to change anything either. Publishers and subscribers are completely independent.</p>
    <p><strong>Message brokers</strong> (like Redis) act as the radio tower that distributes the signal. When you have WebSocket servers in multiple data centers, they all connect to the same message broker. A message sent to Redis in one data center gets forwarded to all other data centers automatically.</p>
    <p>Think of it like a conference call with 100 people. Without a bridge (message broker), you'd need 100 individual phone calls. With a bridge, you dial one number and everyone connected to that bridge hears you. The bridge handles distributing your voice to everyone else.</p>
  `,

  'ws-architecture-2': `
    <p><strong>Event-Driven Architecture</strong> is like a <strong>domino chain reaction</strong>. When one domino falls, it triggers the next one, which triggers the next. In software, an event (like "user joined") triggers other actions (send welcome message, update user list, log activity) without the original code knowing about them.</p>
    <p><strong>Event sourcing</strong> is like keeping a <strong>video recording</strong> of everything that happened instead of just taking a photo of the final result. If you want to know how a document ended up in its current state, you can replay the video. If there's a bug, you can rewind and see exactly what went wrong.</p>
    <p>Imagine you're building with LEGOs with three friends, but you're in different rooms. How do you prevent conflicts? Event-driven architecture lets each person announce what they did ("I placed a red brick at position 5,3") and everyone else reacts accordingly. The sequence of announcements tells the full story.</p>
    <p><strong>CQRS</strong> separates reading from writing. It's like having a library where some people can add new books (writers) and others can only read books (readers). Different desks handle each task, so writers never block readers and vice versa. This is useful when you have millions of people reading data and thousands writing it.</p>
  `,

  // ─── Module 9: Scaling Real-Time Applications ───

  'ws-scaling-1': `
    <p><strong>Horizontal scaling</strong> is like adding more <strong>cash registers</strong> at a supermarket. When one register is overloaded with customers, you open another one. In WebSocket terms, when one server can't handle all the connections, you add more servers.</p>
    <p>But there's a catch: WebSocket connections are like shopping carts that are tied to a specific register. If you switch to a different register, your cart doesn't follow you. Similarly, a WebSocket client is tied to the server it connected to. Broadcasting a message from server 1 doesn't automatically reach clients on server 2.</p>
    <p>The <strong>Redis adapter</strong> solves this by acting as a central switchboard. When server 1 wants to broadcast to everyone, it tells Redis "I have a message for all clients." Redis then tells server 2, server 3, and so on: "Server 1 has a message for your clients too."</p>
    <p>Without the Redis adapter, it's like trying to make an announcement in a mall by only shouting in one store. Customers in other stores never hear it. The adapter is the mall's PA system that carries your announcement to every store.</p>
  `,

  'ws-scaling-2': `
    <p><strong>Sticky sessions</strong> are like having <strong>assigned seats</strong> on a bus. When you get on, you sit in a specific seat, and you stay there for the entire ride. If you got up and moved to a different seat, the bus driver might not know where to find you.</p>
    <p>With WebSocket, sticky sessions mean a client always talks to the same server. This is simpler to set up but creates uneven load. Imagine if some bus seats are always occupied while others are empty -- you're not using all your resources efficiently.</p>
    <p>Without sticky sessions (using the Redis adapter), clients can connect to ANY available server. This is like a subway train where you can sit anywhere. If one car is full, you just walk to the next one. All servers are equally utilized.</p>
    <p>In production, using the Redis adapter without sticky sessions is usually better. It automatically distributes load, handles server failures gracefully, and works well with auto-scaling. When a new server starts (like adding a new subway car during rush hour), clients naturally spread across it.</p>
  `,

  // ─── Module 10: Collaborative Features at Scale ───

  'ws-collaborative-1': `
    <p><strong>Presence detection</strong> is like a <strong>"who's home" board</strong> on a college dormitory. When someone enters the building, they flip their name tag to "in." When they leave, they flip it to "out." Everyone can see who's available at a glance.</p>
    <p>In real-time apps, presence shows you who is online, what they're doing (typing, away, idle), and when they were last seen. Socket.IO makes this easy because you know exactly when someone connects and disconnects.</p>
    <p><strong>Cursor synchronization</strong> is like having a <strong>laser pointer</strong> that everyone in the room can see. When you move your laser pointer across a presentation slide, everyone sees where you're pointing. In collaborative editing, remote cursors show where other people are typing or clicking.</p>
    <p>Cursor positions update VERY frequently -- up to 60 times per second. Sending each one as a guaranteed message would overload the network. That's why we use <strong>volatile events</strong> -- if a cursor update gets dropped, the next one arrives milliseconds later anyway. It's like a laser pointer: if one frame is missed, no one notices because the next frame shows the new position.</p>
  `,

  'ws-collaborative-2': `
    <p><strong>Conflict resolution</strong> is like two people trying to paint the same wall at the same time. If one person paints it blue and the other paints it red, what color does it end up? You need a rule to decide.</p>
    <p><strong>Last Writer Wins (LWW)</strong> is the simplest rule: whoever paints last decides the final color. This is fast and simple, but it means some work gets lost. If you spent 10 minutes painting a beautiful blue sky and someone else paints over it with red one second later, your work is gone. Use LWW for non-critical things like user status or preferences.</p>
    <p><strong>Operational Transform (OT)</strong> is what Google Docs uses. Imagine you and a friend are writing on the same whiteboard. You write "Hello" on the left side, and your friend writes "World" on the right side, at the exact same time. OT figures out how to merge both changes so the board shows "Hello World" instead of one overwriting the other.</p>
    <p><strong>CRDTs</strong> are even smarter. They're designed so that any set of changes, made in any order on any device, always results in the same final state. It's like having multiple friends each build their own LEGO tower following the same instructions. Even if they place bricks in different orders, all towers end up identical. This works offline too -- changes sync up later when devices reconnect.</p>
  `,

  // ─── Module 11: Testing and Debugging ───

  'ws-testing-1': `
    <p><strong>Debugging</strong> real-time apps is like trying to find out why your walkie-talkie isn't working. Is the battery dead? Are you on the wrong channel? Is there interference? You need different tools to check each possibility.</p>
    <p>Socket.IO has a <strong>debug mode</strong> that's like turning on the walkie-talkie's diagnostics screen. It shows you every signal being sent and received, the signal strength, battery level, and any errors. Enable it with <code>localStorage.debug = 'socket.io*'</code> in the browser console.</p>
    <p>Browser DevTools are like a <strong>wiretap</strong> for WebSocket traffic. You can see every message sent and received, along with timestamps and sizes. This helps you spot problems like messages that are too large, too frequent, or arriving in unexpected order.</p>
    <p>Common issues and their fixes: If connections keep dropping, check your authentication middleware. If messages don't reach other clients, check that everyone is in the same room. If the server's memory keeps growing, you might have a socket leak -- sockets that disconnected but weren't properly cleaned up.</p>
  `,

  'ws-testing-2': `
    <p><strong>Testing</strong> real-time apps is like rehearsing for a <strong>theater play</strong> with multiple actors. Each actor has lines to say and cues to respond to. You can practice individually (unit tests) or run a full dress rehearsal (integration tests).</p>
    <p><strong>Unit tests</strong> are like having each actor practice their lines alone. You test one function at a time: "Does this validation function correctly reject empty messages?" These are fast and catch most bugs.</p>
    <p><strong>Integration tests</strong> are like a full dress rehearsal. You start a real Socket.IO server, connect a test client, send events, and verify the responses. This catches problems that only appear when all parts work together -- like "the server processes the message correctly, but the response format is different than what the client expects."</p>
    <p><strong>Load testing</strong> is like opening night with a packed auditorium. You simulate hundreds or thousands of users connecting and sending messages at the same time. This reveals performance bottlenecks that don't appear with just a few test users. Tools like k6 can simulate thousands of WebSocket connections from a single machine.</p>
    <p>The golden rule: create a fresh server for each test, use random ports, and always clean up connections after each test. Otherwise, tests can interfere with each other, like actors from different plays accidentally sharing the same stage.</p>
  `,

  // ─── Module 12: Production Deployment ───

  'ws-deployment-1': `
    <p><strong>Monitoring</strong> a real-time server is like having a <strong>dashboard in a hospital</strong> that shows each patient's heart rate, blood pressure, and temperature. You need to see at a glance if anything is going wrong before it becomes an emergency.</p>
    <p>Key metrics to watch: <strong>Active connections</strong> (how many patients are in the hospital), <strong>event rate</strong> (how many messages per second), and <strong>error rate</strong> (how many things are going wrong). A sudden drop in connections might mean the server crashed. A sudden spike in errors might mean a bug in the latest deployment.</p>
    <p><strong>Health check endpoints</strong> are like a patient's self-assessment. When a monitoring system asks "are you healthy?", the server responds with its vital signs: "I have 5,000 active connections, using 60% of memory, 0 errors in the last minute." If the server doesn't respond or reports bad numbers, the monitoring system raises an alert.</p>
    <p><strong>Structured logging</strong> means writing logs in a consistent format that computers can read. Instead of "Something went wrong!" you write: '{"timestamp":"2026-07-29T10:00:00Z","level":"error","action":"connection.auth_failed","userId":42}' This makes it searchable and analyzable by log management tools.</p>
  `,

  'ws-deployment-2': `
    <p><strong>Zero-downtime deployments</strong> are like changing the tires on a moving car. You can't just stop the car, change the tires, and start again. Instead, you change one tire at a time while the car keeps moving. For WebSocket servers, you need to upgrade without disconnecting all users at once.</p>
    <p>The graceful shutdown process works like this: First, the server tells the load balancer "I'm full, don't send me any more passengers" (stop accepting new connections). Then it announces to all connected clients "I'm closing in 10 seconds, please switch to another server" (client notification). After waiting, the server gently closes all connections before shutting down.</p>
    <p><strong>Canary deployments</strong> are like testing a new recipe on a few friends before serving it to a whole restaurant. You deploy the new version to just one server (the canary) while keeping everyone else on the old version. New connections might go to the canary, but most traffic stays on stable servers. If the canary server has problems, only a small number of users are affected.</p>
    <p>Each environment (development, staging, production) needs different settings. Development might allow connections from anywhere with polling fallback enabled. Production should force WebSocket only, use Redis for scaling, enable compression for large messages, and restrict origins to your actual domain. Never use development settings in production!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5WebsocketData = eli5WebsocketData;
