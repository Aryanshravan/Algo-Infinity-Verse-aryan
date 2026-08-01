/* ============================================
   WEBSOCKET & SSE ACADEMY -- Curriculum, State & Simulator
   ============================================ */

const STORAGE_KEY = 'websocketAcademyProgress';

/* ─── Curriculum Data ─── */
const curriculum = [
    {
        id: 'ws-foundations',
        title: 'Real-Time Communication Basics',
        lessons: [
            {
                id: 'ws-foundations-1',
                title: 'What is Real-Time Communication?',
                content: `
                    <h2>What is Real-Time Communication?</h2>
                    <p>Real-time communication on the web enables data to be exchanged instantly between a client and server without the client having to repeatedly ask for updates. This is fundamentally different from the traditional HTTP request-response model.</p>

                    <h3>The Request-Response Model</h3>
                    <p>In the traditional web model, the browser sends an HTTP request and the server sends back a response. The conversation always starts with the client. This works well for loading pages and submitting forms, but falls short for applications needing live updates.</p>
                    <pre><code>Client: "Give me the data"  -->  HTTP GET /data
Server: "Here is the data"  -->  HTTP 200 OK { ... }</code></pre>

                    <h3>The Real-Time Model</h3>
                    <p>With real-time communication, the connection stays open. Either side can send data at any time. The server can push updates without waiting for a request. This enables features like live chat, collaborative editing, and real-time notifications.</p>
                    <pre><code>Client: "I want real-time updates"  -->  WebSocket Connect
Server: "Connection established"     -->  (persistent connection open)
Server: "New data available!"        -->  push update
Client: "Here's my input"            -->  send update
Server: "Broadcasting to others"     -->  push to all</code></pre>

                    <h3>Common Real-Time Use Cases</h3>
                    <ul>
                        <li><strong>Chat applications</strong> -- messages appear instantly on all devices</li>
                        <li><strong>Collaborative editing</strong> -- multiple users edit a document simultaneously</li>
                        <li><strong>Live notifications</strong> -- alerts for new emails, messages, or events</li>
                        <li><strong>Real-time dashboards</strong> -- live metrics, stock tickers, monitoring</li>
                        <li><strong>Multiplayer games</strong> -- synchronize state across players in real time</li>
                        <li><strong>Live streaming</strong> -- broadcast events, comments, and reactions</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">This Platform Uses Socket.IO</div>
                        <p>The Algo Infinity Verse platform already uses Socket.IO for features like collaborative whiteboards, battle mode, study rooms, and escape rooms. The concepts you learn here power all those features.</p>
                    </div>
                `,
                defaultCode: `// In the Simulator tab, connect to see real-time events in action.
// Click "Connect" to establish a Socket.IO connection,
// then observe the event lifecycle.`
            },
            {
                id: 'ws-foundations-2',
                title: 'Polling vs Persistent Connections',
                content: `
                    <h2>Polling vs Persistent Connections</h2>
                    <p>Before WebSocket became widely supported, developers used workarounds to simulate real-time behavior. Understanding these approaches helps you appreciate why persistent connections are superior.</p>

                    <h3>HTTP Polling</h3>
                    <p>The simplest approach: the client sends HTTP requests at a fixed interval. Each request asks "Do you have new data?" This works but is incredibly inefficient.</p>
                    <pre><code>setInterval(async () => {
    const data = await fetch('/api/updates');
    // process data...
}, 5000); // Poll every 5 seconds</code></pre>
                    <p><strong>Problems with polling:</strong> Most responses return no new data (wasted bandwidth), server load increases with polling frequency, and there's always a delay between when data becomes available and when the client fetches it.</p>

                    <h3>HTTP Long-Polling</h3>
                    <p>An improvement: the client sends a request, and the server holds the response open until new data is available or a timeout occurs. When the client receives data, it immediately sends a new request.</p>
                    <pre><code>async function longPoll() {
    const data = await fetch('/api/wait-for-updates');
    // process data immediately...
    longPoll(); // Start next poll right away
}</code></pre>
                    <p><strong>Problems with long-polling:</strong> Still involves HTTP overhead (headers, cookies) for every message, maintaining many long-held connections uses server resources, and ordering guarantees are difficult.</p>

                    <h3>Persistent Connections (WebSocket)</h3>
                    <p>WebSocket creates a single, long-lived TCP connection. Once established, both client and server can send data freely with minimal overhead.</p>
                    <pre><code>// Client side
const ws = new WebSocket('wss://example.com');
ws.onopen = () => ws.send('Hello Server!');
ws.onmessage = (event) => console.log('Received:', event.data);</code></pre>

                    <div class="callout">
                        <div class="callout-title">Protocol Overhead Comparison</div>
                        <p>An HTTP poll request might use 800+ bytes of headers for a response containing 10 bytes of data. WebSocket adds just 2-6 bytes of framing overhead per message after the initial handshake. That is a dramatic reduction in bandwidth and latency.</p>
                    </div>
                `,
                defaultCode: `// Polling vs WebSocket bandwidth comparison
// HTTP Poll (per request): ~800 bytes headers + data
// WebSocket (per message): ~4 bytes framing + data
// For 1000 updates, polling uses ~800KB vs WebSocket ~4KB`
            }
        ],
        quiz: [
            {
                id: 'q-ws-foundations-1',
                question: 'What is the key limitation of HTTP polling for real-time applications?',
                options: [
                    'It does not work over the internet',
                    'Wasted bandwidth and delayed updates due to fixed intervals',
                    'It only works with JavaScript',
                    'It requires a special browser plugin'
                ],
                correct: 1
            },
            {
                id: 'q-ws-foundations-2',
                question: 'Which pattern allows the server to push data to the client without waiting for a request?',
                options: [
                    'HTTP polling',
                    'Persistent connections like WebSocket',
                    'Server-side rendering',
                    'HTTP pipelining'
                ],
                correct: 1
            },
            {
                id: 'q-ws-foundations-3',
                question: 'What is the primary downside of HTTP long-polling compared to WebSocket?',
                options: [
                    'It only works in modern browsers',
                    'It still incurs HTTP overhead for every message and uses server resources for long-held connections',
                    'It cannot transmit binary data',
                    'It requires a third-party library'
                ],
                correct: 1
            },
            {
                id: 'q-ws-foundations-4',
                question: 'In which scenario is HTTP polling most wasteful?',
                options: [
                    'When data updates are frequent and predictable',
                    'When data rarely changes but the client polls at a high frequency',
                    'When the client needs to send large payloads',
                    'When the server uses caching headers'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'websocket-protocol',
        title: 'WebSocket Protocol',
        lessons: [
            {
                id: 'websocket-protocol-1',
                title: 'WebSocket Handshake',
                content: `
                    <h2>WebSocket Handshake</h2>
                    <p>The WebSocket connection starts with an HTTP handshake. The client sends a standard HTTP request with an <code>Upgrade</code> header, and the server responds with a <code>101 Switching Protocols</code> status code.</p>

                    <h3>The Upgrade Request</h3>
                    <p>The client sends a GET request to the server with these special headers:</p>
                    <pre><code>GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13</code></pre>
                    <p>The <code>Sec-WebSocket-Key</code> is a base64-encoded random value. The server uses it to prove it understands the WebSocket protocol by returning a hashed version.</p>

                    <h3>The Upgrade Response</h3>
                    <p>If the server supports WebSocket, it responds with:</p>
                    <pre><code>HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=</code></pre>
                    <p>Once the client receives this response, the connection upgrades from HTTP to WebSocket. Both sides can now send and receive messages freely.</p>

                    <h3>WS vs WSS</h3>
                    <p>Just like HTTP vs HTTPS, WebSocket has a secure variant:</p>
                    <ul>
                        <li><strong>ws://</strong> -- unencrypted WebSocket (port 80 by default)</li>
                        <li><strong>wss://</strong> -- encrypted WebSocket over TLS (port 443 by default)</li>
                    </ul>
                    <p>Always use WSS in production. It encrypts all message content and prevents man-in-the-middle attacks. Most modern browsers enforce secure origins for WebSocket connections.</p>

                    <div class="callout">
                        <div class="callout-title">The Handshake is Just HTTP</div>
                        <p>One of the elegant aspects of WebSocket is that the initial handshake is a valid HTTP request. This means WebSocket can traverse HTTP proxies, firewalls, and standard infrastructure without special configuration.</p>
                    </div>
                `,
                defaultCode: `// WebSocket handshake lifecycle:
// 1. Client sends HTTP Upgrade request
// 2. Server validates and responds 101
// 3. Connection upgrades to WebSocket
// 4. Full-duplex communication begins`
            },
            {
                id: 'websocket-protocol-2',
                title: 'WebSocket Messages & Events',
                content: `
                    <h2>WebSocket Messages & Events</h2>
                    <p>Once a WebSocket connection is established, data is transmitted in frames. Each frame can be either text (UTF-8) or binary. The browser API provides a clean event-driven interface for handling these messages.</p>

                    <h3>Connection States</h3>
                    <p>A WebSocket connection goes through four distinct states during its lifecycle:</p>
                    <pre><code>WebSocket.CONNECTING (0) --> WebSocket.OPEN (1)
WebSocket.OPEN (1)       --> WebSocket.CLOSING (2)
WebSocket.CLOSING (2)    --> WebSocket.CLOSED (3)</code></pre>
                    <ul>
                        <li><strong>CONNECTING (0)</strong> -- The handshake is in progress</li>
                        <li><strong>OPEN (1)</strong> -- Connection is ready for communication</li>
                        <li><strong>CLOSING (2)</strong> -- Close handshake is in progress</li>
                        <li><strong>CLOSED (3)</strong> -- Connection has ended</li>
                    </ul>

                    <h3>Browser Event API</h3>
                    <pre><code>const socket = new WebSocket('wss://example.com');

// Connection opened
socket.addEventListener('open', (event) => {
    console.log('Connected');
    socket.send('Hello!');
});

// Message received
socket.addEventListener('message', (event) => {
    console.log('Message:', event.data);
});

// Connection closed
socket.addEventListener('close', (event) => {
    console.log('Disconnected:', event.code, event.reason);
});

// Error occurred
socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
});</code></pre>

                    <h3>Sending Messages</h3>
                    <p>The <code>send()</code> method accepts strings, binary blobs, or ArrayBuffers:</p>
                    <pre><code>// Text message (JSON)
socket.send(JSON.stringify({ type: 'chat', text: 'Hello' }));

// Binary data
const buffer = new ArrayBuffer(4);
socket.send(buffer);

// Blob (e.g., file data)
socket.send(new Blob(['Hello']));</code></pre>

                    <div class="callout">
                        <div class="callout-title">Message Ordering Guarantee</div>
                        <p>WebSocket guarantees that messages are delivered in the order they were sent, within the same connection. This is a fundamental property of TCP streams, which WebSocket runs on top of. For most applications, this ordering guarantee is essential.</p>
                    </div>
                `,
                defaultCode: `// WebSocket states in the browser:
// 0 - CONNECTING: handshake in progress
// 1 - OPEN: ready to send/receive
// 2 - CLOSING: closing handshake
// 3 - CLOSED: connection ended`
            }
        ],
        quiz: [
            {
                id: 'q-websocket-1',
                question: 'What HTTP status code indicates a successful WebSocket upgrade?',
                options: [
                    '200 OK',
                    '301 Moved Permanently',
                    '101 Switching Protocols',
                    '204 No Content'
                ],
                correct: 2
            },
            {
                id: 'q-websocket-2',
                question: 'What does the WebSocket state 1 (OPEN) signify?',
                options: [
                    'The connection is closed',
                    'The connection is ready for communication',
                    'The handshake failed',
                    'The connection is being established'
                ],
                correct: 1
            },
            {
                id: 'q-websocket-3',
                question: 'Which HTTP header must the client include in a WebSocket upgrade request?',
                options: [
                    'Sec-WebSocket-Accept',
                    'Sec-WebSocket-Key',
                    'Sec-WebSocket-Protocol',
                    'X-WebSocket-Version'
                ],
                correct: 1
            },
            {
                id: 'q-websocket-4',
                question: 'Which WebSocket state corresponds to a value of 2 in the browser API?',
                options: [
                    'CONNECTING',
                    'OPEN',
                    'CLOSING',
                    'CLOSED'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'socketio-practice',
        title: 'Socket.IO in Practice',
        lessons: [
            {
                id: 'socketio-practice-1',
                title: 'Events, Emitting, and Handling',
                content: `
                    <h2>Events, Emitting, and Handling</h2>
                    <p>Socket.IO builds on top of WebSocket by adding named events, automatic JSON serialization, and built-in reconnection. This makes real-time communication more structured and developer-friendly.</p>

                    <h3>Installing and Connecting</h3>
                    <p>On the server, install Socket.IO and attach it to your HTTP server:</p>
                    <pre><code>// Server-side (Node.js)
import { Server } from 'socket.io';
const io = new Server(httpServer);

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
});</code></pre>
                    <p>On the client, load the Socket.IO client library and connect:</p>
                    <pre><code>// Client-side (browser)
const socket = io(); // Connects to the current host
// or: const socket = io('https://example.com');</code></pre>

                    <h3>Named Events</h3>
                    <p>Unlike raw WebSocket (where you receive all messages through a single <code>onmessage</code> callback), Socket.IO lets you organize communication into named events:</p>
                    <pre><code>// Client sends
socket.emit('chat message', { text: 'Hello', user: 'Alice' });
socket.emit('typing', { user: 'Alice', isTyping: true });

// Client listens
socket.on('chat message', (data) => {
    displayMessage(data);
});
socket.on('user joined', (data) => {
    updateUserList(data.users);
});</code></pre>

                    <h3>How it works</h3>
                    <p>Socket.IO serializes your event name and data into a JSON message and sends it over the WebSocket connection. On the receiving end, it deserializes the message and calls the appropriate event handler. If the WebSocket connection fails, Socket.IO automatically falls back to HTTP long-polling.</p>

                    <div class="callout">
                        <div class="callout-title">Try It in the Simulator</div>
                        <p>Switch to the Simulator tab and click Connect. Then use the Emit Ping and Emit Chat buttons to see real Socket.IO events in action. You will see the connection lifecycle, event data flow, and can toggle auto-reconnect to observe reconnection behavior.</p>
                    </div>
                `,
                defaultCode: `// Socket.IO turns raw WebSocket into structured events:
// Raw WebSocket: one 'message' event for everything
// Socket.IO: named events like 'chat', 'typing', 'join'
//
// socket.emit('event-name', data) --> sends
// socket.on('event-name', fn)     --> receives`
            },
            {
                id: 'socketio-practice-2',
                title: 'Rooms, Namespaces, and Broadcasting',
                content: `
                    <h2>Rooms, Namespaces, and Broadcasting</h2>
                    <p>Socket.IO provides powerful abstractions for organizing connections. Rooms and namespaces let you control exactly which clients receive which messages.</p>

                    <h3>Rooms</h3>
                    <p>A room is an arbitrary channel that sockets can join and leave. It is a server-side concept -- the server controls room membership.</p>
                    <pre><code>// Server-side
io.on('connection', (socket) => {
    // Client joins a room
    socket.join('chat-room-1');

    // Send to everyone in the room
    io.to('chat-room-1').emit('message', 'Hello room!');

    // Send to everyone except sender
    socket.broadcast.to('chat-room-1').emit('message', 'Hi all!');
});</code></pre>

                    <h3>Broadcasting</h3>
                    <p>Broadcasting allows you to send a message to all connected clients except the sender. This is essential for features like chat (where you don't echo the user's own message back to them) and collaborative editing.</p>
                    <pre><code>// Broadcast to all connected clients
socket.broadcast.emit('notification', 'Someone joined!');

// Broadcast to all in a specific room
socket.broadcast.to('room-1').emit('typing', { user: 'Alice' });

// Broadcast to all including sender
io.emit('global-announcement', 'Server maintenance in 5 minutes');</code></pre>

                    <h3>Namespaces</h3>
                    <p>Namespaces are separate communication channels on the same server. Each namespace has its own event handlers, rooms, and middleware. They are like separate applications sharing the same server process.</p>
                    <pre><code>// Server: define namespaces
const chatNamespace = io.of('/chat');
const adminNamespace = io.of('/admin');

chatNamespace.on('connection', (socket) => {
    // Chat logic here
});

adminNamespace.on('connection', (socket) => {
    // Admin logic here
});</code></pre>
                    <p>Namespaces are useful for logically separating concerns. For example, a collaborative whiteboard might use a different namespace than the battle mode, even though they run on the same Socket.IO server.</p>

                    <div class="callout">
                        <div class="callout-title">This Platform Uses Rooms</div>
                        <p>Features like <strong>study rooms</strong> and <strong>escape rooms</strong> each create their own room. When you join a study session, your socket joins that specific room, and only participants in that room receive each other's messages.</p>
                    </div>
                `,
                defaultCode: `// Socket.IO broadcast patterns:
// io.emit()              --> all clients including sender
// socket.broadcast.emit() --> all clients except sender
// io.to('room').emit()    --> all clients in room
// socket.broadcast.to('room').emit() --> room except sender`
            },
            {
                id: 'socketio-practice-3',
                title: 'Reconnection and Resilience',
                content: `
                    <h2>Reconnection and Resilience</h2>
                    <p>Network connections are unreliable. Users switch WiFi networks, servers restart, and internet connections drop. Socket.IO provides sophisticated reconnection strategies out of the box.</p>

                    <h3>Automatic Reconnection</h3>
                    <p>By default, Socket.IO automatically tries to reconnect when the connection drops. You can configure the behavior:</p>
                    <pre><code>const socket = io({
    reconnection: true,           // Enable reconnection
    reconnectionAttempts: 10,     // Max retry attempts
    reconnectionDelay: 1000,      // Start with 1 second delay
    reconnectionDelayMax: 5000,   // Max delay cap at 5 seconds
    randomizationFactor: 0.3      // Add randomness to prevent thundering herd
});</code></pre>

                    <h3>Exponential Backoff</h3>
                    <p>Socket.IO implements exponential backoff with jitter. The delay between reconnection attempts increases exponentially up to a maximum, with randomized jitter to prevent the thundering herd problem (where many clients reconnect simultaneously after a server restart).</p>
                    <pre><code>// Reconnection delay progression (example):
// Attempt 1: 1000ms  (base delay)
// Attempt 2: ~1300ms (with randomization)
// Attempt 3: ~2600ms
// Attempt 4: ~5000ms (capped at max)
// ... continues at ~5000ms until max attempts</code></pre>

                    <h3>Connection State Recovery</h3>
                    <p>Socket.IO v4+ supports connection state recovery. When a client reconnects, the server can replay missed events and restore the client's state:</p>
                    <pre><code>// Server-side setup
const io = new Server(httpServer, {
    connectionStateRecovery: {
        maxDisconnectionDuration: 120000, // 2 minutes
        skipMiddlewares: true
    }
});

// The server remembers the last 1000 events per room
// and replays them to reconnecting clients</code></pre>

                    <h3>Best Practices</h3>
                    <ul>
                        <li>Always handle the <code>disconnect</code> event and clean up UI state</li>
                        <li>Show connection status indicators (like the one in this simulator)</li>
                        <li>Queue outgoing messages during disconnection and replay on reconnect</li>
                        <li>Use idempotent event handlers so replayed events don't cause duplicates</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Try Reconnection in the Simulator</div>
                        <p>Connect in the Simulator tab, then toggle Auto-Reconnect off and disconnect. You will see the connection status change. Toggle Auto-Reconnect back on and observe the automatic reconnection behavior.</p>
                    </div>
                `,
                defaultCode: `// Socket.IO reconnection flow:
// 1. disconnect (network issue)
// 2. Wait (reconnectionDelay)
// 3. Attempt reconnection
// 4. If fail, increase delay (exponential backoff)
// 5. Repeat until success or maxAttempts`
            }
        ],
        quiz: [
            {
                id: 'q-socketio-1',
                question: 'What is the purpose of rooms in Socket.IO?',
                options: [
                    'To store chat messages on the server',
                    'To group sockets for targeted message broadcasting',
                    'To authenticate users',
                    'To encrypt communication'
                ],
                correct: 1
            },
            {
                id: 'q-socketio-2',
                question: 'Why does Socket.IO use exponential backoff with jitter for reconnection?',
                options: [
                    'To reduce battery usage on mobile devices',
                    'To prevent the thundering herd problem during reconnection',
                    'To compress reconnection data',
                    'To prioritize certain clients'
                ],
                correct: 1
            },
            {
                id: 'q-socketio-3',
                question: 'What transport does Socket.IO fall back to when WebSocket connections are blocked?',
                options: [
                    'TCP sockets',
                    'HTTP long-polling',
                    'Server-Sent Events',
                    'UDP datagrams'
                ],
                correct: 1
            },
            {
                id: 'q-socketio-4',
                question: 'What is the primary purpose of namespaces in Socket.IO?',
                options: [
                    'To encrypt messages between clients',
                    'To create separate communication channels with isolated event handlers on the same server',
                    'To limit the number of concurrent connections',
                    'To store chat history on the server'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'sse-basics',
        title: 'Server-Sent Events',
        lessons: [
            {
                id: 'sse-basics-1',
                title: 'SSE Basics and EventSource API',
                content: `
                    <h2>SSE Basics and EventSource API</h2>
                    <p>Server-Sent Events (SSE) provide a simpler alternative to WebSocket for one-way data flow from server to client. If you only need the server to push updates (without the client sending data back), SSE is often the better choice.</p>

                    <h3>EventSource API</h3>
                    <p>The browser's <code>EventSource</code> API makes SSE incredibly simple. You only need a URL pointing to a server endpoint that streams events:</p>
                    <pre><code>// Client-side JavaScript
const eventSource = new EventSource('/api/stream');

eventSource.onopen = () => {
    console.log('SSE connection opened');
};

eventSource.onmessage = (event) => {
    console.log('Received:', event.data);
};

eventSource.onerror = (event) => {
    console.error('SSE error:', event);
};</code></pre>

                    <h3>SSE vs WebSocket</h3>
                    <p>The key difference is directionality:</p>
                    <ul>
                        <li><strong>WebSocket</strong> -- Full-duplex. Both client and server can send messages at any time.</li>
                        <li><strong>SSE</strong> -- Simplex (server-to-client only). The client connects and the server streams data.</li>
                    </ul>
                    <p>SSE is built on standard HTTP and requires no special protocol upgrade. The server sends data with the <code>text/event-stream</code> content type, and the browser automatically handles the streaming connection.</p>

                    <h3>When to Use SSE</h3>
                    <p>SSE is ideal when your application primarily needs server-to-client updates:</p>
                    <ul>
                        <li><strong>Live news feeds and tickers</strong> -- stock prices, sports scores</li>
                        <li><strong>Notification systems</strong> -- new email alerts, system notifications</li>
                        <li><strong>Progress updates</strong> -- file upload progress, build status</li>
                        <li><strong>Monitoring dashboards</strong> -- server metrics, log streams</li>
                        <li><strong>Social media feeds</strong> -- new posts, likes, comments</li>
                    </ul>
                    <p>SSE has automatic reconnection built into the browser. If the connection drops, the browser automatically reconnects and sends the <code>Last-Event-ID</code> header so the server can resume from where it left off.</p>

                    <div class="callout">
                        <div class="callout-title">Built-In Reconnection</div>
                        <p>Unlike WebSocket (where you must implement reconnection yourself), SSE has automatic reconnection built into the browser. The <code>EventSource</code> API handles reconnection transparently, requesting missed events using the <code>Last-Event-ID</code> header.</p>
                    </div>
                `,
                defaultCode: `// SSE vs WebSocket comparison:
// Direction:  SSE = Server to Client only
//             WebSocket = Bidirectional
// Reconnect:  SSE = Built-in
//             WebSocket = Must implement
// Protocol:   SSE = Standard HTTP
//             WebSocket = Custom protocol (ws://)
// Best for:   SSE = Notifications, feeds
//             WebSocket = Chat, gaming, collab`
            },
            {
                id: 'sse-basics-2',
                title: 'SSE Data Formats and Custom Events',
                content: `
                    <h2>SSE Data Formats and Custom Events</h2>
                    <p>SSE uses a simple text-based protocol. Each message from the server consists of one or more lines with field names, separated by blank lines. The format is designed to be human-readable and easy to parse.</p>

                    <h3>Message Format</h3>
                    <p>Each SSE message can contain these fields:</p>
                    <pre><code>event: notification
data: {"message": "You have a new message", "count": 3}
id: 42
retry: 3000</code></pre>
                    <ul>
                        <li><code>data:</code> -- The payload. Multiple data lines are concatenated with newlines.</li>
                        <li><code>event:</code> -- A custom event type. If omitted, the generic <code>message</code> event fires.</li>
                        <li><code>id:</code> -- Sets the last event ID, used for reconnection.</li>
                        <li><code>retry:</code> -- Reconnection time in milliseconds.</li>
                    </ul>

                    <h3>Server Implementation (Node.js)</h3>
                    <pre><code>// Server-side SSE endpoint
app.get('/api/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Send a message every 2 seconds
    const interval = setInterval(() => {
        const data = { time: new Date(), value: Math.random() };
        res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
    }, 2000);

    req.on('close', () => clearInterval(interval));
});</code></pre>

                    <h3>Handling Custom Events on the Client</h3>
                    <pre><code>const source = new EventSource('/api/stream');

// Generic message (no event: field)
source.onmessage = (event) => {
    console.log('Default:', event.data);
};

// Custom event types
source.addEventListener('notification', (event) => {
    const data = JSON.parse(event.data);
    showNotification(data.message);
});

source.addEventListener('score-update', (event) => {
    const data = JSON.parse(event.data);
    updateScoreboard(data);
});</code></pre>

                    <h3>Use Cases in Practice</h3>
                    <p>SSE is particularly valuable when you need to push updates to many clients without the complexity of managing bidirectional WebSocket connections. For example, a live leaderboard during a coding competition can use SSE to stream score updates to all participants.</p>

                    <div class="callout">
                        <div class="callout-title">SSE Limitations</div>
                        <p>SSE has a hard limit on the number of concurrent connections per browser (typically 6 per domain). Also, SSE only works with text data -- if you need to send binary data, you must base64-encode it first. For most notification and feed use cases, these limitations are acceptable.</p>
                    </div>
                `,
                defaultCode: `// SSE message structure:
// event: notification\\n
// data: {"key": "value"}\\n
// id: 42\\n
// retry: 3000\\n
// \\n (empty line = end of message)`
            }
        ],
        quiz: [
            {
                id: 'q-sse-1',
                question: 'What is the key difference between SSE and WebSocket?',
                options: [
                    'SSE uses UDP, WebSocket uses TCP',
                    'SSE is one-way (server to client), WebSocket is bidirectional',
                    'SSE only works with JSON, WebSocket only with XML',
                    'SSE requires a browser plugin, WebSocket does not'
                ],
                correct: 1
            },
            {
                id: 'q-sse-2',
                question: 'What happens automatically when an SSE connection drops?',
                options: [
                    'The page must be refreshed',
                    'The browser automatically reconnects',
                    'The EventSource object throws an error',
                    'The server saves all events for later'
                ],
                correct: 1
            },
            {
                id: 'q-sse-3',
                question: 'Which SSE field specifies a custom event type name?',
                options: [
                    'data:',
                    'event:',
                    'id:',
                    'type:'
                ],
                correct: 1
            },
            {
                id: 'q-sse-4',
                question: 'What is the default maximum number of concurrent SSE connections per browser domain?',
                options: [
                    '2',
                    '6',
                    '10',
                    'Unlimited'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'ws-security',
        title: 'WebSocket Security',
        lessons: [
            {
                id: 'ws-security-1',
                title: 'Authentication and Authorization Patterns',
                content: `
                    <h2>Authentication and Authorization Patterns</h2>
                    <p>Securing a WebSocket connection requires different approaches than traditional HTTP. Since WebSocket connections are long-lived, you must authenticate at connection time and periodically verify authorization.</p>

                    <h3>Token-Based Authentication</h3>
                    <p>The most common approach is to pass an authentication token during the initial handshake. This can be done via query parameters, the URL path, or the initial message:</p>
                    <pre><code>// Client: pass token as query parameter
const socket = io('https://example.com', {
    auth: { token: 'eyJhbGciOiJIUzI1NiIs...' }
});

// Server: verify token in middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return next(new Error('Authentication failed'));
        socket.user = user;
        next();
    });
});</code></pre>

                    <h3>Authorization Middleware</h3>
                    <p>Beyond authentication, you need to authorize access to specific rooms, namespaces, or events. Socket.IO middleware can check permissions before allowing certain operations:</p>
                    <pre><code>io.use((socket, next) => {
    // Verify the user has access to this namespace
    const namespace = socket.nsp.name;
    if (!socket.user.allowedNamespaces.includes(namespace)) {
        return next(new Error('Access denied'));
    }
    next();
});

// Room-level authorization
socket.on('join-room', (roomId, callback) => {
    if (canUserAccessRoom(socket.user.id, roomId)) {
        socket.join(roomId);
        callback({ status: 'ok' });
    } else {
        callback({ status: 'error', message: 'Access denied' });
    }
});</code></pre>

                    <h3>Best Practices</h3>
                    <ul>
                        <li>Always use WSS (TLS) in production to encrypt all communication</li>
                        <li>Validate tokens at connection time and periodically during the session</li>
                        <li>Implement token expiration and refresh mechanisms</li>
                        <li>Never expose internal user IDs or secrets in event payloads</li>
                        <li>Use short-lived access tokens with refresh token rotation</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">This Platform Uses JWT Tokens</div>
                        <p>The Algo Infinity Verse platform uses HMAC-signed JWT tokens for authentication. The same token validation pattern shown here is used to authenticate Socket.IO connections for features like battle mode and study rooms.</p>
                    </div>
                `,
                defaultCode: `// Socket.IO auth token pattern:
// Client:
//   io({ auth: { token: 'jwt-here' } });
// Server middleware:
//   io.use((socket, next) => {
//     const token = socket.handshake.auth.token;
//     // verify token, call next() or next(err)
//   });`
            },
            {
                id: 'ws-security-2',
                title: 'Input Validation and Rate Limiting',
                content: `
                    <h2>Input Validation and Rate Limiting</h2>
                    <p>Real-time applications are vulnerable to the same input validation issues as HTTP APIs, plus additional attack vectors unique to persistent connections. Proper validation and rate limiting are essential for production systems.</p>

                    <h3>Event Input Validation</h3>
                    <p>Every event payload must be validated before processing. Never trust data from clients:</p>
                    <pre><code>socket.on('chat-message', (data, callback) => {
    // Validate payload structure
    if (!data || typeof data !== 'object') {
        return callback({ error: 'Invalid payload' });
    }

    // Sanitize string inputs
    const message = String(data.text || '').trim();
    if (message.length === 0 || message.length > 2000) {
        return callback({ error: 'Message must be 1-2000 characters' });
    }

    // Rate limit per user
    const now = Date.now();
    const userMessages = messageTimestamps.get(socket.user.id) || [];
    const recent = userMessages.filter(t => now - t < 10000);
    if (recent.length >= 10) {
        return callback({ error: 'Rate limit exceeded' });
    }

    // Process valid message
    messageTimestamps.set(socket.user.id, [...recent, now]);
    callback({ status: 'ok' });
});</code></pre>

                    <h3>Rate Limiting Strategies</h3>
                    <p>Several rate limiting approaches work well for WebSocket connections:</p>
                    <ul>
                        <li><strong>Per-connection limits</strong> -- limit events per second per socket (prevents a single bad client from flooding)</li>
                        <li><strong>Per-user limits</strong> -- track limits across multiple connections from the same user</li>
                        <li><strong>Global limits</strong> -- cap total events across all connections (prevents DDoS)</li>
                        <li><strong>Sliding window</strong> -- more accurate than fixed window, counts events in a rolling time window</li>
                    </ul>

                    <h3>Connection Validation</h3>
                    <p>Validate connections before allowing them to consume server resources:</p>
                    <pre><code>io.use((socket, next) => {
    // Check origin header
    const origin = socket.handshake.headers.origin;
    if (!ALLOWED_ORIGINS.includes(origin)) {
        return next(new Error('Origin not allowed'));
    }

    // Check for existing connections from same user
    const existingSockets = [...io.sockets.sockets.values()]
        .filter(s => s.user?.id === socket.user?.id);
    if (existingSockets.length >= MAX_CONNECTIONS_PER_USER) {
        return next(new Error('Too many connections'));
    }

    next();
});</code></pre>

                    <div class="callout">
                        <div class="callout-title">Defense in Depth</div>
                        <p>Security should never rely on a single layer. Combine TLS encryption, token authentication, input validation, rate limiting, and origin checking. Each layer makes your application more resilient to different attack vectors.</p>
                    </div>
                `,
                defaultCode: `// Input validation checklist:
// 1. Validate payload structure and types
// 2. Sanitize and trim string inputs
// 3. Enforce size limits on messages
// 4. Rate limit per user and per connection
// 5. Validate origins at connection time`
            }
        ],
        quiz: [
            {
                id: 'q-ws-security-1',
                question: 'Where should authentication tokens typically be passed in a Socket.IO connection?',
                options: [
                    'In the URL path only',
                    'Through the auth option in the client constructor, validated in server middleware',
                    'As a cookie set by a separate HTTP request',
                    'Authentication is not needed for WebSocket'
                ],
                correct: 1
            },
            {
                id: 'q-ws-security-2',
                question: 'Why should you validate event payloads on the server even if the client validates them?',
                options: [
                    'Client validation is always slower',
                    'Never trust client-side validation, as clients can be compromised or bypass validation entirely',
                    'Server validation replaces client validation automatically',
                    'Payload validation only works on the server'
                ],
                correct: 1
            },
            {
                id: 'q-ws-security-3',
                question: 'What is the purpose of origin validation in WebSocket connections?',
                options: [
                    'To determine the client IP address',
                    'To prevent unauthorized websites from making WebSocket connections to your server',
                    'To enable CORS headers',
                    'To compress the initial handshake data'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'ws-performance',
        title: 'Performance and Optimization',
        lessons: [
            {
                id: 'ws-performance-1',
                title: 'Message Compression and Binary Payloads',
                content: `
                    <h2>Message Compression and Binary Payloads</h2>
                    <p>As real-time applications scale, message size and serialization overhead become critical performance factors. Optimizing how data is transmitted can dramatically reduce latency and bandwidth usage.</p>

                    <h3>WebSocket Per-Message Compression</h3>
                    <p>The WebSocket protocol supports per-message compression using the <code>permessage-deflate</code> extension. This compresses message payloads using the DEFLATE algorithm:</p>
                    <pre><code>// Server: enabling compression in Socket.IO
const io = new Server(httpServer, {
    perMessageDeflate: {
        threshold: 1024, // Only compress messages larger than 1KB
        serverNoContextTakeover: true,
        clientNoContextTakeover: true
    }
});

// Compression ratios vary by content type:
// JSON payloads: 3x-10x compression
// Binary data: minimal compression
// Small messages: compression adds overhead (use threshold)</code></pre>

                    <h3>Binary Payloads vs JSON</h3>
                    <p>JSON is human-readable but verbose. For high-throughput scenarios, consider binary serialization formats:</p>
                    <pre><code>// Text (JSON) - readable but larger
socket.emit('position', { x: 150, y: 300, id: 'player-42' });
// Size: ~52 bytes

// Binary (ArrayBuffer) - compact but needs schema
const buffer = new ArrayBuffer(10);
const view = new DataView(buffer);
view.setUint16(0, 150);  // x
view.setUint16(2, 300);  // y
view.setUint32(4, 42);   // id
socket.emit('position', buffer);
// Size: 10 bytes (5x smaller)

// MessagePack (structured binary)
import { encode, decode } from 'msgpack';
socket.emit('position', encode({ x: 150, y: 300, id: 42 }));
// Size: ~20 bytes (balanced approach)</code></pre>

                    <h3>Batching Multiple Events</h3>
                    <p>When sending frequent updates, batch them into a single message to reduce TCP packet overhead:</p>
                    <pre><code>// Instead of 60 individual emits per second:
// 60 TCP packets = 60x frame headers + 60x message overhead

// Batch updates into a single message every 100ms:
const batch = [];
function queueUpdate(data) {
    batch.push(data);
}

setInterval(() => {
    if (batch.length > 0) {
        socket.emit('batch-update', batch);
        batch.length = 0;
    }
}, 100);
// 10 TCP packets per second vs 60 (6x reduction)</code></pre>

                    <div class="callout">
                        <div class="callout-title">Measure Before Optimizing</div>
                        <p>Always profile your real-time traffic before investing in optimizations. Use browser dev tools and server metrics to identify actual bottlenecks. For most applications, JSON over WebSocket is fast enough -- optimization is only needed at scale.</p>
                    </div>
                `,
                defaultCode: `// Optimization priorities:
// 1. Measure actual performance first
// 2. Batch frequent updates (reduce packet count)
// 3. Enable compression for large payloads
// 4. Consider binary formats at scale
// 5. Profile before and after each change`
            },
            {
                id: 'ws-performance-2',
                title: 'Backpressure and Connection Pooling',
                content: `
                    <h2>Backpressure and Connection Pooling</h2>
                    <p>Real-time servers must handle thousands of concurrent connections while maintaining low latency. Two critical concepts for server performance are backpressure management and efficient connection pooling.</p>

                    <h3>Understanding Backpressure</h3>
                    <p>Backpressure occurs when a producer sends data faster than the consumer can process it. In WebSocket systems, this happens when the server broadcasts to many clients faster than the network can deliver:</p>
                    <pre><code>// Without backpressure handling - may cause memory issues
function broadcastUpdate(data) {
    // If clients can't keep up, data queues in memory
    io.emit('update', data);
}

// With backpressure awareness
function broadcastUpdate(data) {
    const slowClients = [];
    io.sockets.sockets.forEach((socket) => {
        if (socket.bufferedAmount > HIGH_WATER_MARK) {
            slowClients.push(socket.id);
        }
    });

    if (slowClients.length > MAX_SLOW_CLIENTS) {
        // Reduce broadcast frequency or drop non-essential updates
        console.warn('Backpressure detected:', slowClients.length, 'slow clients');
        io.emit('throttled-update', data);
    } else {
        io.emit('update', data);
    }
}</code></pre>

                    <h3>Connection Pooling on the Server</h3>
                    <p>Node.js can handle thousands of concurrent connections on a single process, but you must manage resources efficiently:</p>
                    <pre><code>// Monitor connection count
const CONNECTION_LIMIT = 10000;
let activeConnections = 0;

io.on('connection', (socket) => {
    activeConnections++;

    if (activeConnections > CONNECTION_LIMIT) {
        socket.emit('server-busy', 'Too many connections. Please retry later.');
        socket.disconnect();
        return;
    }

    socket.on('disconnect', () => {
        activeConnections--;
    });
});

// Use worker threads or child processes for CPU-intensive tasks
const { Worker } = require('worker_threads');

socket.on('process-data', (data) => {
    const worker = new Worker('./processor.js');
    worker.postMessage(data);
    worker.on('message', (result) => {
        socket.emit('process-complete', result);
    });
});</code></pre>

                    <h3>Client-Side Optimizations</h3>
                    <ul>
                        <li><strong>Throttle reconnection attempts</strong> -- don't hammer the server when it is restarting</li>
                        <li><strong>Disconnect unused connections</strong> -- clean up when navigating away from real-time features</li>
                        <li><strong>Use volatile events</strong> -- for non-critical updates that can be dropped if the client is behind</li>
                        <li><strong>Implement exponential backoff</strong> -- for both reconnection and message retransmission</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Volatile Events in Socket.IO</div>
                        <p>Socket.IO supports volatile events which are automatically dropped if the underlying transport cannot keep up. This is perfect for cursor positions, typing indicators, or any non-essential real-time data where losing the occasional update is acceptable.</p>
                    </div>
                `,
                defaultCode: `// Backpressure signals in Socket.IO:
// socket.bufferedAmount - bytes queued for this client
// Check before sending large payloads
// Use volatile events for non-essential updates
// Monitor active connection counts`
            }
        ],
        quiz: [
            {
                id: 'q-ws-performance-1',
                question: 'When should you enable WebSocket per-message compression?',
                options: [
                    'Always, without any conditions',
                    'Only for messages larger than a threshold (e.g., 1KB), since small messages may not benefit or may increase overhead',
                    'Never, compression is not supported by WebSocket',
                    'Only for binary data, not text messages'
                ],
                correct: 1
            },
            {
                id: 'q-ws-performance-2',
                question: 'What is backpressure in the context of real-time systems?',
                options: [
                    'A security mechanism to prevent unauthorized access',
                    'When data is produced faster than the consumer can process it, causing memory pressure',
                    'A compression algorithm for WebSocket frames',
                    'A reconnection strategy for dropped connections'
                ],
                correct: 1
            },
            {
                id: 'q-ws-performance-3',
                question: 'What is the main benefit of batching frequent updates into a single WebSocket message?',
                options: [
                    'Improves security by hiding individual events',
                    'Reduces TCP packet overhead and improves throughput',
                    'Makes debugging easier',
                    'Ensures all updates are delivered in order'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'ws-middleware',
        title: 'Socket.IO Middleware',
        lessons: [
            {
                id: 'ws-middleware-1',
                title: 'Middleware Fundamentals',
                content: `
                    <h2>Middleware Fundamentals</h2>
                    <p>Socket.IO middleware functions are executed for every incoming connection or event. They provide a powerful way to implement cross-cutting concerns like authentication, logging, and input validation.</p>

                    <h3>Connection-Level Middleware</h3>
                    <p>Register middleware with <code>io.use()</code> to intercept every socket connection before it is established:</p>
                    <pre><code>// Connection middleware - runs before connection event
io.use((socket, next) => {
    // Access handshake data
    const { token } = socket.handshake.auth;

    if (!token) {
        return next(new Error('Authentication required'));
    }

    try {
        const user = verifyToken(token);
        socket.user = user; // Attach data to socket
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    // socket.user is available here if middleware passed
    console.log('User connected:', socket.user.name);
});</code></pre>

                    <h3>Middleware Execution Order</h3>
                    <p>Middleware functions run in the order they are registered. Each one must call <code>next()</code> to pass control to the next handler:</p>
                    <pre><code>// Order of execution:
// 1. Namespace middleware
// 2. io.use() middleware (in registration order)
// 3. connection event handler
// 4. Individual event handlers

io.use(loggingMiddleware);     // Runs first
io.use(authMiddleware);        // Runs second
io.use(rateLimitMiddleware);   // Runs third

io.on('connection', handler);  // Runs after all middleware pass</code></pre>

                    <h3>Error Handling in Middleware</h3>
                    <p>Pass an Error object to <code>next()</code> to reject a connection. The client receives a <code>connect_error</code> event:</p>
                    <pre><code>// Server: middleware rejects connection
io.use((socket, next) => {
    if (isBlockedIP(socket.handshake.address)) {
        next(new Error('Access denied'));
    }
});

// Client: handles the rejection
socket.on('connect_error', (error) => {
    console.error('Connection rejected:', error.message);
});</code></pre>

                    <div class="callout">
                        <div class="callout-title">Middleware vs Event Handlers</div>
                        <p>Use middleware for concerns that apply to every connection (auth, logging, rate limiting). Use event handlers for specific features. Middleware keeps your code DRY and prevents security gaps where you might forget to add checks to a specific event handler.</p>
                    </div>
                `,
                defaultCode: `// Socket.IO middleware pattern:
// io.use((socket, next) => {
//   // validation, enrichment, logging
//   if (valid) next();
//   else next(new Error('reason'));
// });
// Runs before 'connection' event`
            },
            {
                id: 'ws-middleware-2',
                title: 'Advanced Middleware Patterns',
                content: `
                    <h2>Advanced Middleware Patterns</h2>
                    <p>Beyond basic authentication, middleware can handle complex scenarios like dynamic namespace access control, message transformation, and cross-service integration.</p>

                    <h3>Namespace-Specific Middleware</h3>
                    <p>Different namespaces can have different middleware requirements:</p>
                    <pre><code>const adminNamespace = io.of('/admin');
const chatNamespace = io.of('/chat');

// Admin namespace requires admin role
adminNamespace.use((socket, next) => {
    if (socket.user?.role !== 'admin') {
        return next(new Error('Admin access required'));
    }
    next();
});

// Chat namespace requires active subscription
chatNamespace.use((socket, next) => {
    if (!socket.user?.hasActiveSubscription) {
        return next(new Error('Subscription required'));
    }
    next();
});</code></pre>

                    <h3>Dynamic Middleware with Async Operations</h3>
                    <p>Middleware can perform async operations like database lookups or API calls. Use async/await for clean error handling:</p>
                    <pre><code>// Async middleware for loading user data
io.use(async (socket, next) => {
    try {
        const userData = await db.users.findById(socket.user.id);

        if (!userData) {
            return next(new Error('User not found'));
        }

        // Enrich socket with user data
        socket.userData = userData;
        socket.permissions = userData.permissions;

        // Check rate limits from database
        const usage = await db.usage.count({
            userId: socket.user.id,
            period: '1m'
        });

        if (usage > MAX_EVENTS_PER_MINUTE) {
            return next(new Error('Rate limit exceeded'));
        }

        next();
    } catch (err) {
        next(new Error('Internal error: ' + err.message));
    }
});</code></pre>

                    <h3>Middleware for Event Transformation</h3>
                    <p>Middleware can modify data as it flows through the system. For example, sanitizing messages before broadcasting:</p>
                    <pre><code>// Server-side event middleware
io.on('connection', (socket) => {
    // Wrap event handlers with transformation
    socket.use((packet, next) => {
        // packet[0] = event name, packet[1] = data
        if (packet[0] === 'chat-message' && packet[1]?.text) {
            // Sanitize HTML from messages
            packet[1].text = sanitizeHtml(packet[1].text);
            // Add server timestamp
            packet[1].serverTimestamp = Date.now();
        }
        next();
    });
});</code></pre>

                    <div class="callout">
                        <div class="callout-title">socket.use() for Event-Level Middleware</div>
                        <p>Socket.IO provides <code>socket.use()</code> for intercepting individual events on a specific socket. This is different from <code>io.use()</code> which runs at connection time. Use <code>socket.use()</code> when you need per-event transformations or validation that depends on socket-specific state.</p>
                    </div>
                `,
                defaultCode: `// Middleware types:
// io.use(fn) - connection-level, runs once per socket
// namespace.use(fn) - namespace-level
// socket.use(fn) - event-level, runs for each event
// Use async/await for DB lookups in middleware`
            }
        ],
        quiz: [
            {
                id: 'q-ws-middleware-1',
                question: 'How does a Socket.IO middleware function signal that a connection should be rejected?',
                options: [
                    'By throwing an exception',
                    'By returning false',
                    'By passing an Error object to the next() callback',
                    'By calling socket.disconnect()'
                ],
                correct: 2
            },
            {
                id: 'q-ws-middleware-2',
                question: 'What is the difference between io.use() and socket.use()?',
                options: [
                    'They are identical in behavior',
                    'io.use() runs at connection time for all sockets, while socket.use() intercepts events on a specific socket',
                    'io.use() is for client-side, socket.use() is for server-side',
                    'socket.use() runs before io.use()'
                ],
                correct: 1
            },
            {
                id: 'q-ws-middleware-3',
                question: 'In what order do Socket.IO middleware functions execute?',
                options: [
                    'In reverse registration order',
                    'In the order they are registered with io.use()',
                    'Alphabetically by function name',
                    'Randomly, determined by the event loop'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'ws-architecture',
        title: 'Real-Time Architecture Patterns',
        lessons: [
            {
                id: 'ws-architecture-1',
                title: 'Pub/Sub and Message Brokers',
                content: `
                    <h2>Pub/Sub and Message Brokers</h2>
                    <p>The Publish/Subscribe pattern is the foundation of scalable real-time systems. Publishers send messages to channels without knowing who subscribes, and subscribers receive messages without knowing who publishes.</p>

                    <h3>The Pub/Sub Pattern</h3>
                    <p>Pub/Sub decouples message producers from consumers, enabling flexible and scalable architectures:</p>
                    <pre><code>// Publisher - emits events without knowing subscribers
function publishScoreUpdate(userId, score) {
    io.to('leaderboard').emit('score-update', { userId, score });
}

// Subscriber - listens for events without knowing publishers
socket.on('score-update', (data) => {
    updateLeaderboardUI(data);
});

// Multiple subscribers can listen to the same channel
// Multiple publishers can emit to the same channel
// They never need direct references to each other</code></pre>

                    <h3>Message Brokers for Cross-Server Communication</h3>
                    <p>In a multi-server setup, Socket.IO uses a message broker (like Redis) to broadcast events across servers:</p>
                    <pre><code>// Server 1 emits an event
await socket.emit('chat-message', data);
// Socket.IO with Redis adapter broadcasts to ALL servers

// The flow:
// 1. Server 1 receives emit from client
// 2. Server 1 publishes to Redis Pub/Sub channel
// 3. Redis fans out to all subscribed servers
// 4. Each server broadcasts to its connected clients
// 5. Clients on any server receive the message</code></pre>

                    <h3>Implementing Custom Pub/Sub</h3>
                    <p>You can build custom pub/sub systems on top of Socket.IO using rooms as channels:</p>
                    <pre><code>// Creating a pub/sub system with rooms
const pubSub = {
    subscribe(socket, channel) {
        socket.join('ps:' + channel);
    },

    unsubscribe(socket, channel) {
        socket.leave('ps:' + channel);
    },

    publish(channel, data) {
        io.to('ps:' + channel).emit('message', {
            channel,
            data,
            timestamp: Date.now()
        });
    },

    // Pattern-based subscriptions
    subscribePattern(socket, pattern) {
        socket.patterns = socket.patterns || [];
        socket.patterns.push(pattern);
    }
};

// Usage
pubSub.subscribe(socket, 'notifications');
pubSub.publish('notifications', { type: 'alert', text: 'Server maintenance' });</code></pre>

                    <div class="callout">
                        <div class="callout-title">Redis Pub/Sub in This Platform</div>
                        <p>This platform uses BullMQ with Redis for job processing. The same Redis infrastructure could be extended with the Socket.IO Redis adapter for multi-server real-time broadcasting. This is a common production pattern used by large-scale applications.</p>
                    </div>
                `,
                defaultCode: `// Pub/Sub benefits:
// - Decouples publishers and subscribers
// - Scales horizontally via message brokers
// - Supports multiple subscriber patterns
// - Enables event-driven architectures`
            },
            {
                id: 'ws-architecture-2',
                title: 'Event-Driven Architecture Concepts',
                content: `
                    <h2>Event-Driven Architecture Concepts</h2>
                    <p>Event-driven architecture (EDA) is a software design pattern where components communicate through events. Real-time communication is a natural fit for EDA, and understanding these concepts helps you design better real-time systems.</p>

                    <h3>Events as First-Class Citizens</h3>
                    <p>In an event-driven system, events represent something that happened. They are immutable facts that services can react to:</p>
                    <pre><code>// Events are facts about what happened
const events = [
    { type: 'user.joined', data: { userId: 42 }, time: '2026-07-29T10:00:00Z' },
    { type: 'message.sent', data: { text: 'Hello' }, time: '2026-07-29T10:01:00Z' },
    { type: 'user.left', data: { userId: 42 }, time: '2026-07-29T10:05:00Z' }
];

// Services react to events independently
// Chat service: stores and broadcasts messages
// Analytics service: tracks user activity
// Notification service: sends push notifications
// Each service processes the same event differently</code></pre>

                    <h3>Event Sourcing Concepts</h3>
                    <p>Event sourcing stores the full sequence of events rather than just the current state. This is powerful for real-time applications:</p>
                    <pre><code>// Instead of storing current state only:
// { room: 'abc', users: ['Alice', 'Bob'] }

// Store the sequence of events:
const events = [
    { type: 'room.created', by: 'Alice', at: '10:00:00' },
    { type: 'user.joined', user: 'Bob', at: '10:01:00' },
    { type: 'user.joined', user: 'Charlie', at: '10:02:00' },
    { type: 'user.left', user: 'Bob', at: '10:05:00' }
];

// Current state is derived by replaying events:
// Room: abc, Users: ['Alice', 'Charlie']

// Benefits:
// 1. Full audit trail of every change
// 2. Time travel debugging (replay events to any point)
// 3. New subscribers can catch up by replaying history
// 4. Naturally integrates with real-time event streams</code></pre>

                    <h3>CQRS with Real-Time Updates</h3>
                    <p>Command Query Responsibility Segregation (CQRS) separates read and write operations. This pairs naturally with real-time systems where reads are often served via WebSocket while writes go through HTTP or message queues:</p>
                    <pre><code>// Write path (Command) - through HTTP or message queue
POST /api/orders { item: 'book', quantity: 1 }
// Validates, processes, emits event

// Read path (Query) - through WebSocket
socket.on('order-updates', (data) => {
    // Receive real-time order status updates
});

// The write path produces events
// The read path consumes events via WebSocket
// They are completely separate and can scale independently</code></pre>

                    <div class="callout">
                        <div class="callout-title">EDA Benefits for Real-Time Systems</div>
                        <p>Event-driven architectures make real-time systems more resilient, scalable, and maintainable. Services become loosely coupled, new features can be added by introducing new event consumers without changing existing code, and the system can be audited and debugged by examining the event stream.</p>
                    </div>
                `,
                defaultCode: `// Event-Driven Architecture principles:
// 1. Events are immutable facts
// 2. Services react independently
// 3. State can be derived from event streams
// 4. Reads and writes can scale separately
// 5. New features = new event consumers`
            }
        ],
        quiz: [
            {
                id: 'q-ws-architecture-1',
                question: 'What is the key benefit of the Pub/Sub pattern in real-time systems?',
                options: [
                    'It guarantees message delivery exactly once',
                    'It decouples message producers from consumers, allowing flexible and scalable communication',
                    'It is faster than direct socket-to-socket communication',
                    'It eliminates the need for authentication'
                ],
                correct: 1
            },
            {
                id: 'q-ws-architecture-2',
                question: 'What is event sourcing?',
                options: [
                    'A way to find what caused an error in production',
                    'Storing the full sequence of events instead of only the current state, enabling replay and audit trails',
                    'A technique for compressing event data before transmission',
                    'A method for generating random events for testing'
                ],
                correct: 1
            },
            {
                id: 'q-ws-architecture-3',
                question: 'How does the Socket.IO Redis adapter help scale real-time applications?',
                options: [
                    'It stores chat messages in Redis for persistence',
                    'It broadcasts events across multiple server nodes so clients connected to any server receive messages',
                    'It replaces WebSocket with Redis for better performance',
                    'It caches static assets for faster page loads'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'ws-scaling',
        title: 'Scaling Real-Time Applications',
        lessons: [
            {
                id: 'ws-scaling-1',
                title: 'Horizontal Scaling with Redis Adapter',
                content: `
                    <h2>Horizontal Scaling with Redis Adapter</h2>
                    <p>As your application grows, a single Socket.IO server will eventually hit resource limits. Horizontal scaling across multiple processes or machines requires sharing state and coordinating broadcasts.</p>

                    <h3>Why Scaling is Different for WebSocket</h3>
                    <p>WebSocket connections are stateful and long-lived. Unlike HTTP requests (which can go to any server), a connected WebSocket client is tied to a specific server process. Broadcasting to all clients becomes challenging:</p>
                    <pre><code>// Without scaling: single server handles all connections
// io.emit() reaches all clients immediately

// With multiple servers: each server has its own clients
// Server 1: clients A, B, C
// Server 2: clients D, E, F

// io.emit() on Server 1 only reaches A, B, C
// Clients D, E, F never receive the message
// Solution: use an adapter to forward events between servers</code></pre>

                    <h3>Socket.IO Redis Adapter</h3>
                    <p>The Redis adapter uses Redis Pub/Sub to broadcast events across all server instances:</p>
                    <pre><code>// Install: npm install @socket.io/redis-adapter ioredis
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

const pubClient = new Redis('redis://localhost:6379');
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
    adapter: createAdapter(pubClient, subClient)
});

// Now io.emit() on any server reaches ALL clients on ALL servers
// Redis handles the cross-server event routing</code></pre>

                    <h3>Adapter Architecture</h3>
                    <p>Understanding how the adapter works helps you design better systems:</p>
                    <pre><code>// Adapter flow for io.emit('chat', data) on Server 1:
//
// 1. Server 1: io.emit('chat', data)
// 2. Server 1 delivers to its own connected clients (A, B, C)
// 3. Server 1 publishes to Redis channel 'socket.io#emits#'
// 4. Redis fans out to all other subscribed servers (Server 2, Server 3...)
// 5. Each server re-emits to its own connected clients
// 6. All clients across all servers receive the message
//
// Without Redis adapter: only step 2 happens, clients on other servers miss the message</code></pre>

                    <h3>Best Practices for Scaling</h3>
                    <ul>
                        <li>Use a dedicated Redis instance for the adapter (separate from your app cache)</li>
                        <li>Enable Redis Sentinel or Cluster for high availability</li>
                        <li>Monitor adapter latency to ensure cross-server broadcasts stay fast</li>
                        <li>Consider using namespace-specific adapters for large multi-tenant systems</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Connection State Recovery Across Servers</div>
                        <p>When using the Redis adapter, Socket.IO keeps room membership and socket state in Redis. If a server goes down and a client reconnects to a different server, the new server can restore the client's state from Redis. This makes horizontal scaling resilient to individual server failures.</p>
                    </div>
                `,
                defaultCode: `// Horizontal scaling with Socket.IO:
// 1. Add Redis adapter: @socket.io/redis-adapter
// 2. Each server instance connects to same Redis
// 3. io.emit() now reaches all servers' clients
// 4. Room state is shared across servers
// 5. Clients can connect to any server instance`
            },
            {
                id: 'ws-scaling-2',
                title: 'Load Balancing and Sticky Sessions',
                content: `
                    <h2>Load Balancing and Sticky Sessions</h2>
                    <p>Load balancing WebSocket connections requires special consideration. Unlike HTTP, where any server can handle any request, WebSocket connections must be routed to the same server throughout their lifetime.</p>

                    <h3>Sticky Sessions</h3>
                    <p>Sticky sessions (also called session affinity) ensure that all requests from a client during a session are sent to the same server. This is required for Socket.IO when using multiple servers without the Redis adapter:</p>
                    <pre><code># NGINX configuration for sticky WebSocket sessions
upstream socket_servers {
    ip_hash;  # Hash by client IP for sticky sessions

    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 443 ssl;
    server_name example.com;

    location /socket.io/ {
        proxy_pass http://socket_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Increase timeouts for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}</code></pre>

                    <h3>WebSocket Load Balancing Options</h3>
                    <p>Different load balancers handle WebSocket differently:</p>
                    <ul>
                        <li><strong>NGINX</strong> -- native WebSocket support with <code>ip_hash</code> or <code>sticky</code> directive</li>
                        <li><strong>HAProxy</strong> -- excellent WebSocket support with <code>stick-table</code> for session affinity</li>
                        <li><strong>AWS ALB</strong> -- native WebSocket support, stickiness via cookies</li>
                        <li><strong>Kubernetes</strong> -- Ingress controllers with WebSocket support, session affinity via service configuration</li>
                    </ul>

                    <h3>Scaling Without Sticky Sessions</h3>
                    <p>The Socket.IO Redis adapter actually works better without sticky sessions. Each connection lands on any available server, and the adapter handles cross-server communication:</p>
                    <pre><code>// Without sticky sessions + Redis adapter:
// Client connects to any available server
// All servers share state via Redis
// No single server becomes overloaded
// Auto-scaling works naturally
//
// This is the preferred approach for production deployments
// at scale. Sticky sessions are a workaround, not a solution.</code></pre>

                    <h3>Capacity Planning</h3>
                    <p>Plan your real-time infrastructure based on these approximate numbers per Node.js process:</p>
                    <ul>
                        <li>10,000-20,000 idle WebSocket connections</li>
                        <li>5,000-10,000 actively messaging connections</li>
                        <li>100-500 messages per second (with moderate payload sizes)</li>
                        <li>2-4 server instances for redundancy and maintenance windows</li>
                    </ul>
                    <p>Always load test with your actual use case patterns, as performance varies significantly based on message size, frequency, and processing logic.</p>

                    <div class="callout">
                        <div class="callout-title">Auto-Scaling Considerations</div>
                        <p>When using auto-scaling (like Kubernetes HPA), ensure new server instances can register with the Redis adapter dynamically. Most auto-scaling setups work well because the adapter simply connects to Redis -- no reconfiguration of existing servers is needed when new ones spin up or down.</p>
                    </div>
                `,
                defaultCode: `// Load balancing WebSocket:
// Sticky sessions: client always hits same server
// Redis adapter: any server can serve any client
// NGINX: ip_hash for stickiness
// Production: prefer Redis adapter without stickiness`
            }
        ],
        quiz: [
            {
                id: 'q-ws-scaling-1',
                question: 'Why is horizontal scaling more complex for WebSocket than for HTTP?',
                options: [
                    'WebSocket does not work with load balancers',
                    'WebSocket connections are stateful and long-lived, tied to a specific server process',
                    'WebSocket requires UDP which cannot be load balanced',
                    'Scaling WebSocket is actually simpler than scaling HTTP'
                ],
                correct: 1
            },
            {
                id: 'q-ws-scaling-2',
                question: 'What is the role of the Socket.IO Redis adapter in a multi-server deployment?',
                options: [
                    'It stores chat messages in Redis for persistence',
                    'It broadcasts events from one server to all other servers so all clients receive messages',
                    'It replaces the need for any load balancer',
                    'It compresses WebSocket frames using Redis'
                ],
                correct: 1
            },
            {
                id: 'q-ws-scaling-3',
                question: 'Which approach is preferred for large-scale production Socket.IO deployments?',
                options: [
                    'Single server with more RAM',
                    'Multiple servers with sticky sessions only',
                    'Multiple servers with Redis adapter for cross-server event propagation',
                    'Multiple servers without any connection sharing mechanism'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'ws-collaborative',
        title: 'Collaborative Features at Scale',
        lessons: [
            {
                id: 'ws-collaborative-1',
                title: 'Presence Detection and Cursor Synchronization',
                content: `
                    <h2>Presence Detection and Cursor Synchronization</h2>
                    <p>Collaborative features like seeing who is online, what they are typing, and where their cursor is are powered by real-time event streams. These features create engaging user experiences but require careful design to perform at scale.</p>

                    <h3>Presence Detection</h3>
                    <p>Presence systems track which users are currently online and their status. Socket.IO makes this straightforward with connection and disconnection events:</p>
                    <pre><code>// Server-side presence tracking
const onlineUsers = new Map();

io.on('connection', (socket) => {
    // User comes online
    onlineUsers.set(socket.user.id, {
        id: socket.user.id,
        name: socket.user.name,
        status: 'online',
        lastSeen: Date.now(),
        socketId: socket.id
    });

    // Broadcast presence update to all
    io.emit('presence-update', {
        userId: socket.user.id,
        status: 'online'
    });

    socket.on('disconnect', () => {
        // User goes offline
        onlineUsers.delete(socket.user.id);
        io.emit('presence-update', {
            userId: socket.user.id,
            status: 'offline',
            lastSeen: Date.now()
        });
    });

    // Send current online users to the newly connected client
    socket.emit('presence-list', Array.from(onlineUsers.values()));
});</code></pre>

                    <h3>Typing Indicators</h3>
                    <p>Typing indicators show when another user is composing a message. They should use throttling and volatile events to avoid flooding:</p>
                    <pre><code>// Client: throttle typing events
let typingTimeout = null;

inputElement.addEventListener('input', () => {
    // Throttle: only send every 500ms at most
    if (!typingTimeout) {
        typingTimeout = setTimeout(() => {
            socket.volatile.emit('typing', {
                userId: currentUser.id,
                roomId: currentRoom
            });
            typingTimeout = null;
        }, 500);
    }
});

// Clear typing indicator when user stops
inputElement.addEventListener('blur', () => {
    clearTimeout(typingTimeout);
    typingTimeout = null;
    socket.emit('stop-typing', { roomId: currentRoom });
});</code></pre>

                    <h3>Cursor Synchronization</h3>
                    <p>Cursor positions are sent at high frequency. Use volatile events and throttling to manage the load:</p>
                    <pre><code>// Client: send cursor positions as volatile events
editor.addEventListener('cursor-move', (position) => {
    // Cursor updates can be dropped - volatile is perfect
    socket.volatile.emit('cursor-update', {
        userId: currentUser.id,
        position: { line: position.line, col: position.column },
        roomId: currentRoom
    });
});

// Server: forward to room members (but not the sender)
socket.on('cursor-update', (data) => {
    socket.broadcast.to(data.roomId).emit('cursor-update', {
        userId: data.userId,
        position: data.position
    });
});

// Client: render remote cursors
socket.on('cursor-update', (data) => {
    // Update the remote cursor overlay for this user
    updateRemoteCursor(data.userId, data.position);
});</code></pre>

                    <div class="callout">
                        <div class="callout-title">Cursor Sync in This Platform</div>
                        <p>The collaborative whiteboard and peer coding features in this platform use similar techniques. Cursor and drawing data are broadcast using Socket.IO events with appropriate throttling to balance responsiveness with performance.</p>
                    </div>
                `,
                defaultCode: `// Collaborative event patterns:
// Presence: track connect/disconnect
// Typing: throttle to 500ms intervals
// Cursor: use volatile events, high frequency
// Always broadcast to room, not globally`
            },
            {
                id: 'ws-collaborative-2',
                title: 'Conflict Resolution Strategies',
                content: `
                    <h2>Conflict Resolution Strategies</h2>
                    <p>When multiple users modify the same data concurrently, conflicts arise. Choosing the right conflict resolution strategy is critical for collaborative applications like real-time editors, shared whiteboards, and collaborative coding.</p>

                    <h3>Last Writer Wins (LWW)</h3>
                    <p>The simplest strategy: the most recent write overwrites all previous writes. This is suitable for simple use cases where data loss is acceptable:</p>
                    <pre><code>// LWW strategy - simple but can lose data
const documentState = {};

socket.on('update-field', (data) => {
    // Last write always wins
    documentState[data.field] = {
        value: data.value,
        updatedBy: socket.user.id,
        updatedAt: Date.now()
    };

    // Broadcast new state to all users
    socket.broadcast.to(data.roomId).emit('field-updated', {
        field: data.field,
        value: data.value,
        updatedBy: socket.user.id
    });
});

// Best for: simple attributes, user preferences, status updates
// Avoid for: collaborative text editing, financial transactions</code></pre>

                    <h3>Operational Transform (OT)</h3>
                    <p>OT is used by Google Docs and other collaborative editors. It transforms operations so they apply correctly even when received out of order:</p>
                    <pre><code>// Simplified OT concept:
// User A inserts 'x' at position 3:  insert(3, 'x')
// User B deletes position 1:          delete(1)
// Apply A then B: "abc" -> "abxc" -> "axc"
// Apply B then A: "abc" -> "ac" -> "axc"
// Result is the same regardless of order!
//
// Real OT is much more complex:
// - Position transforms for concurrent edits
// - Multi-user merging
// - Undo/redo support
// - Version vectors for tracking state</code></pre>

                    <h3>CRDT (Conflict-Free Replicated Data Types)</h3>
                    <p>CRDTs are data structures that automatically resolve conflicts without a central server. Each replica can be updated independently and still converge to the same state:</p>
                    <pre><code>// CRDT concepts for collaborative text:
//
// 1. Each character has a unique ID
// 2. Characters have ordering positions (not indices)
// 3. Deletions are tombstones (marked, not removed)
// 4. Concurrent inserts always converge
//
// Benefits over OT:
// - No central ordering server needed
// - Works offline (syncs when reconnected)
// - Simpler to implement correctly
// - Naturally handles multi-user scenarios
//
// Popular CRDT libraries:
// - Yjs (used by this platform's collab features)
// - Automerge
// - Replicated Object Notation (RON)

// Simple CRDT counter (converges to sum of all increments):
let counter = 0;
const increments = new Map();

socket.on('increment', (data) => {
    // Each user has their own count
    const userCount = increments.get(data.userId) || 0;
    increments.set(data.userId, userCount + 1);

    // Always converges regardless of order
    counter = [...increments.values()].reduce((a, b) => a + b, 0);
});</code></pre>

                    <h3>Choosing the Right Strategy</h3>
                    <ul>
                        <li><strong>LWW</strong> -- simple attributes, settings, non-critical data</li>
                        <li><strong>OT</strong> -- collaborative text editing, complex document structures</li>
                        <li><strong>CRDT</strong> -- offline-first apps, P2P systems, multi-master replication</li>
                        <li><strong>Locking</strong> -- when only one user should edit at a time (simplest but least collaborative)</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Offline-First with CRDTs</div>
                        <p>CRDTs are particularly powerful for offline-first applications. Users can make changes while disconnected, and when they reconnect, all changes are merged automatically without conflicts. This is impossible with traditional locking or LWW approaches, which require a central server to coordinate all changes.</p>
                    </div>
                `,
                defaultCode: `// Conflict resolution strategies:
// LWW (Last Writer Wins) - simple, can lose data
// OT (Operational Transform) - Google Docs style
// CRDT (Conflict-Free Replicated Data Types) - offline-first
// Locking - pessimistic, prevents conflicts entirely`
            }
        ],
        quiz: [
            {
                id: 'q-ws-collaborative-1',
                question: 'Why should cursor synchronization events use Socket.IO volatile events?',
                options: [
                    'Volatile events are encrypted, cursor events need encryption',
                    'Cursor updates are non-essential and can be dropped if the client is behind, so volatile events prevent unnecessary queuing',
                    'Volatile events are faster because they skip authentication',
                    'Socket.IO requires volatile events for all binary data'
                ],
                correct: 1
            },
            {
                id: 'q-ws-collaborative-2',
                question: 'What is the main advantage of CRDTs over Operational Transform?',
                options: [
                    'CRDTs are only for text, OT is for any data type',
                    'CRDTs automatically resolve conflicts without a central server and support offline-first workflows',
                    'CRDTs are simpler to implement than OT for all use cases',
                    'CRDTs require less memory than OT'
                ],
                correct: 1
            },
            {
                id: 'q-ws-collaborative-3',
                question: 'When is the Last Writer Wins (LWW) strategy appropriate?',
                options: [
                    'For collaborative text editing with multiple users',
                    'For financial transactions where accuracy is critical',
                    'For simple, non-critical data where occasional data loss is acceptable',
                    'LWW is never appropriate for any production system'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'ws-testing',
        title: 'Testing and Debugging',
        lessons: [
            {
                id: 'ws-testing-1',
                title: 'Debugging Socket.IO Applications',
                content: `
                    <h2>Debugging Socket.IO Applications</h2>
                    <p>Debugging real-time applications requires different tools and techniques than traditional HTTP applications. Understanding how to inspect WebSocket traffic, monitor events, and trace issues is essential for production readiness.</p>

                    <h3>Enabling Debug Logging</h3>
                    <p>Socket.IO uses the debug library for comprehensive logging. Enable it to see all internal events:</p>
                    <pre><code>// Enable all Socket.IO debug logging
localStorage.debug = 'socket.io*';
// Or enable specific namespaces:
localStorage.debug = 'socket.io:client,socket.io:socket';

// In Node.js server (via environment variable):
// DEBUG=socket.io:* node server.js

// What debug logs show:
// - Connection and disconnection events
// - Packet encoding and decoding
// - Transport upgrades (polling to websocket)
// - Reconnection attempts
// - Heartbeat/ping-pong timing</code></pre>

                    <h3>Browser DevTools for WebSocket</h3>
                    <p>Every modern browser has WebSocket inspection tools:</p>
                    <pre><code>// Chrome DevTools:
// 1. Open DevTools (F12)
// 2. Go to Network tab
// 3. Filter by "WS" (WebSocket)
// 4. Select a WebSocket connection
// 5. View Frames tab to see individual messages
//
// Firefox:
// 1. Open DevTools (F12)
// 2. Go to Network tab
// 3. Filter by "WebSocket"
// 4. Click on a connection
// 5. View the messages in the Response panel
//
// What to look for:
// - Message frequency and size
// - Connection timing
// - Upgrade from polling to websocket
// - Close frames with error codes</code></pre>

                    <h3>Server-Side Debugging Techniques</h3>
                    <p>Add strategic logging to understand what your server is doing in real time:</p>
                    <pre><code>// Event logging middleware
io.use((socket, next) => {
    socket.use((packet, next) => {
        console.log({
            event: packet[0],
            data: packet[1],
            user: socket.user?.id,
            time: new Date().toISOString()
        });
        next();
    });
    next();
});

// Monitor room sizes
setInterval(() => {
    const rooms = io.sockets.adapter.rooms;
    const roomSizes = {};
    rooms.forEach((sockets, room) => {
        if (!room.startsWith(socket.io)) { // Skip default rooms
            roomSizes[room] = sockets.size;
        }
    });
    console.log('Room sizes:', roomSizes);
}, 30000);

// Track connection metrics
let connectionCounter = 0;
io.on('connection', (socket) => {
    connectionCounter++;
    console.log('Connections:', connectionCounter, '| Socket:', socket.id);
});</code></pre>

                    <h3>Common Issues and Solutions</h3>
                    <ul>
                        <li><strong>Connection drops immediately</strong> -- check auth middleware errors, verify token validity, check origin headers</li>
                        <li><strong>Messages not reaching clients</strong> -- verify room membership, check for adapter configuration in multi-server setups</li>
                        <li><strong>High latency</strong> -- check message size, enable compression, look for backpressure</li>
                        <li><strong>Memory growth over time</strong> -- check for socket leaks (not cleaning up disconnected sockets), unbounded event listeners</li>
                        <li><strong>Transport downgrade</strong> -- WebSocket is blocked (check firewalls, proxies), falls back to polling</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Monitoring Tools</div>
                        <p>For production monitoring, consider tools like Socket.IO Admin UI (official debugging dashboard), Prometheus metrics export, or custom health-check endpoints that report connection counts, room sizes, and event throughput.</p>
                    </div>
                `,
                defaultCode: `// Debug commands:
// localStorage.debug = 'socket.io*' (browser)
// DEBUG=socket.io:* node server.js  (server)
// Chrome DevTools > Network > WS filter
// Socket.IO Admin UI for production monitoring`
            },
            {
                id: 'ws-testing-2',
                title: 'Testing Real-Time Features',
                content: `
                    <h2>Testing Real-Time Features</h2>
                    <p>Testing real-time applications requires specialized approaches for both unit testing individual components and integration testing the full event flow between client and server.</p>

                    <h3>Unit Testing Event Handlers</h3>
                    <p>Extract event handler logic into pure functions that can be tested independently:</p>
                    <pre><code>// Instead of inline event handlers:
socket.on('chat-message', (data) => {
    // validation, processing, broadcasting all mixed together
});

// Extract into testable functions:
function validateMessage(data) {
    if (!data?.text || typeof data.text !== 'string') {
        return { valid: false, error: 'Invalid message' };
    }
    if (data.text.length > 2000) {
        return { valid: false, error: 'Message too long' };
    }
    return { valid: true, data: { text: data.text.trim() } };
}

function formatMessage(userId, validatedData) {
    return {
        id: generateId(),
        userId,
        text: validatedData.text,
        timestamp: Date.now()
    };
}

// Easily tested with Jest/Mocha:
// test('validateMessage rejects empty text', () => {
//     expect(validateMessage({ text: '' }).valid).toBe(false);
// });</code></pre>

                    <h3>Integration Testing with Socket.IO Test Client</h3>
                    <p>Socket.IO provides a test-friendly client for integration testing:</p>
                    <pre><code>// Integration test using Jest and Socket.IO client
const { createServer } = require('http');
const { Server } = require('socket.io');
const { io: ioc } = require('socket.io-client');

describe('Chat Events', () => {
    let server, io, clientSocket;

    beforeAll((done) => {
        server = createServer();
        io = new Server(server);
        server.listen(() => {
            const port = server.address().port;
            clientSocket = ioc('http://localhost:' + port);
            clientSocket.on('connect', done);
        });

        // Setup server handlers
        io.on('connection', (socket) => {
            socket.on('chat-message', (data, callback) => {
                const validation = validateMessage(data);
                if (!validation.valid) {
                    return callback({ error: validation.error });
                }
                const message = formatMessage(socket.user?.id, data);
                io.emit('new-message', message);
                callback({ success: true, message });
            });
        });
    });

    test('sends and receives messages', (done) => {
        clientSocket.emit('chat-message', { text: 'Hello' }, (response) => {
            expect(response.success).toBe(true);
            expect(response.message.text).toBe('Hello');
            done();
        });
    });

    afterAll(() => {
        clientSocket.close();
        io.close();
        server.close();
    });
});</code></pre>

                    <h3>Load Testing Real-Time Systems</h3>
                    <p>Use specialized tools to simulate hundreds or thousands of concurrent WebSocket connections:</p>
                    <pre><code>// Load testing with k6 (k6.io):
import { Socket } from 'k6/ws';

export default function () {
    const url = 'wss://example.com/socket.io/?EIO=4&transport=websocket';
    const socket = new Socket(url);

    socket.on('open', () => {
        // Send Socket.IO connect packet
        socket.send('40'); // Socket.IO connect packet
        socket.send('42["chat-message",{"text":"Load test message"}]');
    });

    socket.on('message', (data) => {
        // Verify responses
        if (data.startsWith('40')) {
            console.log('Connected successfully');
        }
    });

    socket.on('error', (e) => {
        console.error('Connection error:', e.error());
    });

    socket.setTimeout(() => {
        socket.close();
    }, 10000);
}

// Run: k6 run --vus 100 --duration 60s loadtest.js</code></pre>

                    <div class="callout">
                        <div class="callout-title">Test Isolation</div>
                        <p>Always create a fresh Socket.IO server instance for each test suite. Use random ports to avoid conflicts when tests run in parallel. Clean up all connections in afterEach/afterAll hooks to prevent test pollution.</p>
                    </div>
                `,
                defaultCode: `// Testing strategies:
// Unit: extract pure functions from event handlers
// Integration: use Socket.IO test client
// Load: use k6 or artillery for WS connections
// Always isolate tests with fresh server instances`
            }
        ],
        quiz: [
            {
                id: 'q-ws-testing-1',
                question: 'How do you enable Socket.IO debug logging in the browser?',
                options: [
                    'By setting a breakpoint in the browser DevTools',
                    'By setting localStorage.debug = "socket.io*" in the browser console',
                    'By adding a --debug flag to the browser launch command',
                    'Debug logging is not available for Socket.IO in the browser'
                ],
                correct: 1
            },
            {
                id: 'q-ws-testing-2',
                question: 'What is the recommended approach for testing Socket.IO event handlers?',
                options: [
                    'Only test through manual browser interaction',
                    'Extract event handler logic into pure functions for unit testing, and use Socket.IO test client for integration tests',
                    'Socket.IO cannot be unit tested, only end-to-end tested',
                    'Write tests only for the HTTP API, not for real-time events'
                ],
                correct: 1
            },
            {
                id: 'q-ws-testing-3',
                question: 'Which tool is commonly used for load testing WebSocket connections?',
                options: [
                    'Jest',
                    'Mocha',
                    'k6 with WebSocket support',
                    'Postman'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'ws-deployment',
        title: 'Production Deployment',
        lessons: [
            {
                id: 'ws-deployment-1',
                title: 'Monitoring and Observability',
                content: `
                    <h2>Monitoring and Observability</h2>
                    <p>Running real-time applications in production requires comprehensive monitoring. Unlike HTTP requests (which have clear start and end), WebSocket connections are long-lived and require different observability approaches.</p>

                    <h3>Key Metrics to Monitor</h3>
                    <p>Track these metrics to understand the health of your real-time infrastructure:</p>
                    <pre><code>// Connection metrics
const metrics = {
    activeConnections: 0,        // Current connected sockets
    connectionRate: 0,            // New connections per minute
    disconnectionRate: 0,         // Disconnections per minute
    peakConnections: 0,           // All-time high
    connectionsByTransport: {}     // WebSocket vs polling count

    // Event metrics
    eventsPerSecond: 0,           // Total event throughput
    eventsByType: {},             // Breakdown by event name
    avgEventLatency: 0,           // Time to process events
    broadcastLatency: 0           // Time to broadcast to all clients

    // Resource metrics
    memoryUsage: 0,               // Process memory
    cpuUsage: 0,                  // Process CPU
    bufferedAmountTotal: 0        // Total queued data awaiting delivery
};

// Update metrics on relevant events
io.on('connection', (socket) => {
    metrics.activeConnections++;
    metrics.connectionsByTransport[socket.conn.transport.name] =
        (metrics.connectionsByTransport[socket.conn.transport.name] || 0) + 1;
});</code></pre>

                    <h3>Health Check Endpoints</h3>
                    <p>Expose a health endpoint that reports the status of your real-time server:</p>
                    <pre><code>// Health check endpoint with Socket.IO metrics
app.get('/health', (req, res) => {
    const adapter = io.sockets.adapter;
    const rooms = adapter.rooms;
    const sockets = adapter.sockets;

    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        connections: {
            active: sockets.size,
            rooms: rooms.size,
            transports: {
                websocket: countByTransport(sockets, 'websocket'),
                polling: countByTransport(sockets, 'polling')
            }
        },
        memory: process.memoryUsage(),
        eventLoopLag: getEventLoopLag()
    });
});

// Alert when thresholds are exceeded
function checkThresholds() {
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memUsage > 500) {
        console.warn('Memory usage exceeds threshold:', memUsage, 'MB');
        // Trigger scaling event or alert
    }
}
setInterval(checkThresholds, 30000);</code></pre>

                    <h3>Logging Strategy</h3>
                    <p>Structured logging helps trace issues across distributed systems. Log key lifecycle events with consistent metadata:</p>
                    <pre><code>// Structured log format for real-time events
function logEvent(level, action, metadata) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        service: 'socket-server',
        action,
        ...metadata
    };

    if (level === 'error') {
        console.error(JSON.stringify(entry));
        // Send to error tracking service (Sentry, Datadog, etc.)
    } else {
        console.log(JSON.stringify(entry));
    }
}

// Usage examples
logEvent('info', 'connection.established', {
    socketId: socket.id,
    userId: socket.user?.id,
    transport: socket.conn.transport.name
});

logEvent('error', 'connection.auth_failed', {
    ip: socket.handshake.address,
    error: error.message
});

logEvent('warn', 'backpressure.detected', {
    socketId: socket.id,
    bufferedAmount: socket.bufferedAmount,
    connections: io.engine.clientsCount
});</code></pre>

                    <div class="callout">
                        <div class="callout-title">Observability in Production</div>
                        <p>Invest in observability before you need it. When a production incident happens, you need historical metrics to understand what changed. Track connection counts, event rates, and error rates over time to establish baselines and detect anomalies automatically.</p>
                    </div>
                `,
                defaultCode: `// Production monitoring checklist:
// - Active connection count (with alerts)
// - Event throughput and latency
// - Transport type distribution
// - Memory and CPU usage
// - Error rates and types
// - Room size distribution`
            },
            {
                id: 'ws-deployment-2',
                title: 'CI/CD for Real-Time Applications',
                content: `
                    <h2>CI/CD for Real-Time Applications</h2>
                    <p>Deploying real-time applications requires careful attention to connection draining, zero-downtime deployments, and configuration management. Unlike HTTP services where a brief pause is acceptable, WebSocket users expect seamless connectivity.</p>

                    <h3>Zero-Downtime Deployments</h3>
                    <p>When deploying a new version, existing WebSocket connections must be gracefully migrated rather than abruptly terminated:</p>
                    <pre><code>// Graceful shutdown procedure
// 1. Signal the load balancer to stop sending new connections
// 2. Notify connected clients about the upcoming restart
// 3. Wait for a drain timeout (allow clients to reconnect elsewhere)
// 4. Complete any in-flight message processing
// 5. Close the server

process.on('SIGTERM', async () => {
    console.log('Starting graceful shutdown...');

    // Step 1: Stop accepting new connections
    server.close();

    // Step 2: Notify connected clients
    io.emit('server-shutdown', {
        message: 'Server restarting in 10 seconds',
        reconnectAfter: 10000,
        newServerUrl: BACKUP_SERVER_URL
    });

    // Step 3: Wait for drain
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Step 4: Close Socket.IO
    await io.close();

    // Step 5: Exit
    process.exit(0);
});</code></pre>

                    <h3>Client-Side Reconnection on Deploy</h3>
                    <p>Clients should handle server restarts gracefully by implementing reconnection with backoff:</p>
                    <pre><code>// Client-side reconnection during deployment
const socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity // Keep trying until server is back
});

// Listen for graceful shutdown notifications
socket.on('server-shutdown', (data) => {
    showReconnectingBanner('Server is updating. Reconnecting shortly...');

    // The server will close the connection after data.reconnectAfter
    // Socket.IO automatic reconnection will handle the rest
    // The new server instance will be ready by then
});

socket.on('reconnect', () => {
    hideReconnectingBanner();
    restoreState(); // Restore any lost UI state after reconnect
});</code></pre>

                    <h3>Environment Configuration</h3>
                    <p>Manage Socket.IO configuration across environments with environment variables:</p>
                    <pre><code>// Configuration by environment
const config = {
    development: {
        cors: { origin: '*' },
        transports: ['websocket', 'polling'],
        pingInterval: 25000,
        pingTimeout: 20000,
        allowEIO3: true
    },
    staging: {
        cors: { origin: ['https://staging.example.com'] },
        transports: ['websocket', 'polling'],
        pingInterval: 25000,
        pingTimeout: 20000,
        adapter: redisAdapter
    },
    production: {
        cors: { origin: ['https://example.com'] },
        transports: ['websocket'], // Force WebSocket only
        pingInterval: 30000,
        pingTimeout: 25000,
        adapter: redisAdapter,
        connectionStateRecovery: {
            maxDisconnectionDuration: 120000
        },
        perMessageDeflate: {
            threshold: 2048
        }
    }
};

const env = process.env.NODE_ENV || 'development';
const io = new Server(httpServer, config[env]);</code></pre>

                    <h3>CI/CD Pipeline Checklist</h3>
                    <ul>
                        <li>Run unit and integration tests with isolated Socket.IO server instances</li>
                        <li>Perform load testing before major releases to catch performance regressions</li>
                        <li>Use canary deployments to roll out new versions to a subset of servers first</li>
                        <li>Monitor connection drop rates during and after deployments</li>
                        <li>Have a rollback plan that preserves in-flight connections where possible</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Canary Deployments for Real-Time</div>
                        <p>When using canary deployments with real-time apps, route a percentage of new connections to the canary servers. Existing connections stay on the stable version. This limits the blast radius of any issues while testing the new version with real traffic. Services like AWS App Mesh and Istio support this pattern for WebSocket traffic.</p>
                    </div>
                `,
                defaultCode: `// Deployment best practices:
// - Graceful shutdown with client notification
// - Client-side reconnect with infinite attempts
// - Environment-specific configurations
// - Canary deployments for new versions
// - Monitor connection drop rates during deploy`
            }
        ],
        quiz: [
            {
                id: 'q-ws-deployment-1',
                question: 'What should a Socket.IO server do during a graceful shutdown?',
                options: [
                    'Immediately disconnect all clients and exit',
                    'Stop accepting new connections, notify clients, wait for a drain period, then close',
                    'Ignore shutdown signals and let the process manager force kill',
                    'Only disconnect idle connections'
                ],
                correct: 1
            },
            {
                id: 'q-ws-deployment-2',
                question: 'Which metric is most important to monitor for real-time application health?',
                options: [
                    'Total lines of code in the server',
                    'Active connection count with alerting on sudden drops',
                    'Number of GitHub stars on the repository',
                    'Client-side page load time'
                ],
                correct: 1
            },
            {
                id: 'q-ws-deployment-3',
                question: 'Why should production Socket.IO configurations force WebSocket transport only?',
                options: [
                    'Polling is slower and consumes more server resources for long-lived connections',
                    'WebSocket is more secure than polling',
                    'Polling has a limit of 6 concurrent connections per browser domain',
                    'WebSocket transport cannot be blocked by firewalls'
                ],
                correct: 0
            }
        ]
    }
];

/* ─── State ─── */
let state = {
    activeModuleId: curriculum[0].id,
    activeLessonId: curriculum[0].lessons[0].id,
    activeTab: 'lesson',
    completedItems: [],
    quizAnswers: {},
    quizSubmitted: false
};

/* ─── Socket.IO Connection State ─── */
let socket = null;
let eventCount = 0;
let isConnected = false;

/* ─── DOM Cache ─── */
const DOM = {};

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

    // Socket simulator elements
    DOM.connectBtn = document.getElementById('connect-socket-btn');
    DOM.disconnectBtn = document.getElementById('disconnect-socket-btn');
    DOM.statusIndicator = document.getElementById('status-indicator');
    DOM.statusText = document.getElementById('status-text');
    DOM.socketIdDisplay = document.getElementById('socket-id-display');
    DOM.eventLog = document.getElementById('event-log');
    DOM.eventCount = document.getElementById('event-count');
    DOM.emitPingBtn = document.getElementById('emit-ping-btn');
    DOM.emitChatBtn = document.getElementById('emit-chat-btn');
    DOM.joinRoomBtn = document.getElementById('join-room-btn');
    DOM.clearLogBtn = document.getElementById('clear-log-btn');
    DOM.autoReconnect = document.getElementById('auto-reconnect');
    DOM.showHeartbeat = document.getElementById('show-heartbeat');
}

/* ─── Helpers ─── */
function getActiveModule() {
    return curriculum.find(m => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
    const mod = getActiveModule();
    return mod.lessons.find(l => l.id === state.activeLessonId) || mod.lessons[0];
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
    } catch { /* ignore */ }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.completedItems));
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
    let completed = 0;
    curriculum.forEach(mod => {
        total += mod.lessons.length;
        if (mod.quiz?.length > 0) total++;
    });
    completed = state.completedItems.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    DOM.progressBar.style.width = pct + '%';
    DOM.progressText.textContent = pct + '%';
}

/* ─── Sidebar ─── */
function renderSidebar() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    DOM.moduleList.innerHTML = curriculum.map((mod, idx) => {
        const lessonsCount = mod.lessons.length;
        const lessonsDoneCount = mod.lessons.filter(l => isItemComplete(l.id)).length;
        const quizCount = mod.quiz?.length || 0;
        const quizDone = quizCount > 0 ? isItemComplete(mod.id + '-quiz') : true;

        const allLessonsDone = lessonsDoneCount === lessonsCount;
        const isModuleComplete = allLessonsDone && quizDone;
        const hasPartialProgress = !allLessonsDone && lessonsDoneCount > 0;
        const isActive = mod.id === state.activeModuleId;

        let nodeClass = 'timeline-node--incomplete';
        if (isModuleComplete) nodeClass = 'timeline-node--complete';
        else if (hasPartialProgress) nodeClass = 'timeline-node--partial';
        else if (isActive) nodeClass = 'timeline-node--active';

        const activePart = isModuleComplete ? 'module-badge--complete'
            : isActive && !hasPartialProgress ? 'module-badge--active'
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
    }).join('');
}

function changeModule(moduleId) {
    const mod = curriculum.find(m => m.id === moduleId);
    if (!mod) return;
    state.activeModuleId = moduleId;
    state.activeLessonId = mod.lessons[0].id;
    state.quizAnswers = {};
    state.quizSubmitted = false;
    renderSidebar();
    renderActiveContent();
    updateProgress();
    closeSidebar();
}

/* ─── Tabs ─── */
function switchTab(tabId) {
    state.activeTab = tabId;
    DOM.tabBtns.forEach(btn => {
        const isActive = btn.getAttribute('data-tab') === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    DOM.tabContents.forEach(c => {
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
    else if (state.activeTab === 'simulator') updateSimulatorUI();
    else if (state.activeTab === 'quiz') renderQuiz();
}

/* ─── Lesson ─── */
function renderLesson() {
    const lesson = getActiveLesson();
    const isComplete = isItemComplete(lesson.id);

    DOM.lessonContent.innerHTML = (window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, (window.eli5WebsocketData || {})[lesson.id] || '') : lesson.content);
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('websocket', DOM.lessonContent);
  }

  copyCode.init(DOM.lessonContent);
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

/* ─── Simulator (Socket.IO Connection) ─── */
function formatTimestamp() {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function addLogEntry(badge, text, data) {
    const showHb = DOM.showHeartbeat ? DOM.showHeartbeat.checked : true;
    if (badge === 'heartbeat' && !showHb) return;

    const placeholder = DOM.eventLog.querySelector('.output-placeholder');
    if (placeholder) placeholder.remove();

    eventCount++;
    DOM.eventCount.textContent = eventCount + ' events';

    const entry = document.createElement('div');
    entry.className = 'event-entry';
    entry.innerHTML = `<span class="event-time">${formatTimestamp()}</span><span class="event-badge event-badge--${badge}">${badge}</span><span class="event-detail">${escHtml(text)}</span>` + (data ? `<span class="event-data">${escHtml(data)}</span>` : '');
    DOM.eventLog.appendChild(entry);
    DOM.eventLog.scrollTop = DOM.eventLog.scrollHeight;
}

function connectSocket() {
    if (socket && isConnected) return;

    addLogEntry('state', 'Connecting to Socket.IO server...');
    setConnectionStatus('connecting', 'Connecting');

    try {
        const opts = {
            transports: ['websocket', 'polling'],
            reconnection: DOM.autoReconnect ? DOM.autoReconnect.checked : true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        };

        socket = io(opts);

        socket.on('connect', () => {
            isConnected = true;
            setConnectionStatus('connected', 'Connected');
            DOM.socketIdDisplay.textContent = 'ID: ' + socket.id;
            addLogEntry('info', 'Connected successfully', 'Socket ID: ' + socket.id);
            enableActions(true);
            DOM.connectBtn.style.display = 'none';
            DOM.disconnectBtn.style.display = 'inline-flex';
        });

        socket.on('disconnect', (reason) => {
            isConnected = false;
            setConnectionStatus('disconnected', 'Disconnected');
            DOM.socketIdDisplay.textContent = '';
            addLogEntry('state', 'Disconnected', 'Reason: ' + reason);
            enableActions(false);
            DOM.connectBtn.style.display = 'inline-flex';
            DOM.disconnectBtn.style.display = 'none';

            if (reason === 'io server disconnect' || reason === 'io client disconnect') {
                // Server or manual disconnect, don't auto-reconnect
            }
        });

        socket.on('connect_error', (error) => {
            addLogEntry('error', 'Connection error', error.message || 'Unknown error');
        });

        socket.on('reconnect_attempt', (attempt) => {
            addLogEntry('state', 'Reconnection attempt', 'Attempt #' + attempt);
        });

        socket.on('reconnect', (attempt) => {
            isConnected = true;
            setConnectionStatus('connected', 'Reconnected');
            DOM.socketIdDisplay.textContent = 'ID: ' + socket.id;
            addLogEntry('info', 'Reconnected successfully', 'After ' + attempt + ' attempts. New ID: ' + socket.id);
            enableActions(true);
            DOM.connectBtn.style.display = 'none';
            DOM.disconnectBtn.style.display = 'inline-flex';
        });

        socket.on('reconnect_error', (error) => {
            addLogEntry('error', 'Reconnection error', error.message || 'Unknown error');
        });

        socket.on('reconnect_failed', () => {
            addLogEntry('error', 'Reconnection failed', 'Max attempts reached');
            setConnectionStatus('disconnected', 'Disconnected');
        });

        socket.on('ping', () => {
            addLogEntry('heartbeat', 'Heartbeat (ping)', 'Client sent ping');
        });

        socket.on('pong', (latency) => {
            addLogEntry('heartbeat', 'Heartbeat (pong)', 'Server responded. Latency: ' + latency + 'ms');
        });
    } catch (err) {
        addLogEntry('error', 'Failed to create connection', err.message || 'Socket.IO may not be loaded');
        setConnectionStatus('disconnected', 'Error');
    }
}

function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

function setConnectionStatus(stateClass, text) {
    DOM.statusIndicator.className = 'status-indicator';
    if (stateClass === 'connected') {
        DOM.statusIndicator.classList.add('connected');
    } else if (stateClass === 'connecting') {
        DOM.statusIndicator.classList.add('connecting');
    }
    DOM.statusText.textContent = text;
}

function enableActions(enabled) {
    DOM.emitPingBtn.disabled = !enabled;
    DOM.emitChatBtn.disabled = !enabled;
    DOM.joinRoomBtn.disabled = !enabled;
}

function updateSimulatorUI() {
    DOM.activeModuleTitle.textContent = getActiveModule().title + ' -- Simulator';
}

function setupSimulator() {
    DOM.connectBtn.addEventListener('click', connectSocket);

    DOM.disconnectBtn.addEventListener('click', () => {
        disconnectSocket();
    });

    DOM.emitPingBtn.addEventListener('click', () => {
        if (socket && isConnected) {
            socket.emit('academy-ping', {
                timestamp: Date.now(),
                lesson: getActiveLesson().id
            });
            addLogEntry('sent', 'Emitted: academy-ping', 'Data: { timestamp: ' + Date.now() + ' }');
        }
    });

    DOM.emitChatBtn.addEventListener('click', () => {
        if (socket && isConnected) {
            socket.emit('academy-chat', {
                message: 'Hello from WebSocket Academy!',
                module: getActiveModule().id,
                timestamp: Date.now()
            });
            addLogEntry('sent', 'Emitted: academy-chat', 'Data: { message: "Hello from WebSocket Academy!" }');
        }
    });

    DOM.joinRoomBtn.addEventListener('click', () => {
        if (socket && isConnected) {
            socket.emit('academy-join-room', {
                room: 'ws-academy-' + getActiveModule().id,
                timestamp: Date.now()
            });
            addLogEntry('sent', 'Emitted: academy-join-room', 'Room: ws-academy-' + getActiveModule().id);
        }
    });

    DOM.clearLogBtn.addEventListener('click', () => {
        DOM.eventLog.innerHTML = '<div class="output-placeholder"><i class="fa-solid fa-plug"></i><p>Event log cleared. Connect to see new events.</p></div>';
        eventCount = 0;
        DOM.eventCount.textContent = '0 events';
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
                <i class="fa-solid fa-clipboard-check" style="font-size:3rem; color:#00b4d8; opacity:0.5; margin-bottom:1rem;"></i>
                <h3 style="font-family:var(--font-display); color:#475569; margin-bottom:0.5rem;">No Quiz Available</h3>
                <p style="color:#94a3b8; font-size:0.9rem;">This module doesn't have a quiz yet. Continue to the next module.</p>
            </div>
        `;
        DOM.activeModuleTitle.textContent = mod.title + ' -- Quiz';
        return;
    }

    DOM.activeModuleTitle.textContent = mod.title + ' -- Quiz';

    let html = `<h2 style="font-family:var(--font-display); font-size:1.5rem; margin-bottom:1.5rem; color:#1e293b;">
        ${escHtml(mod.title)} Quiz
    </h2>`;

    mod.quiz.forEach((q, idx) => {
        const selected = state.quizAnswers[q.id];
        const showResult = isCompleted;

        html += `
            <div class="quiz-question-card">
                <div class="quiz-question-number">Question ${idx + 1} of ${mod.quiz.length}</div>
                <div class="quiz-question-text">${escHtml(q.question)}</div>
                <div class="quiz-options">
                    ${q.options.map((opt, optIdx) => {
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
                    }).join('')}
                </div>
            </div>
        `;
    });

    if (!isCompleted) {
        const allAnswered = mod.quiz.every(q => state.quizAnswers[q.id] !== undefined);
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
        const score = mod.quiz.filter(q => state.quizAnswers[q.id] === q.correct).length;
        const total = mod.quiz.length;
        html += `
            <div class="quiz-result quiz-result--fail">
                <i class="fas fa-redo-alt"></i> Score: ${score}/${total} -- Adjust your answers and try again.
            </div>
        `;
    }

    DOM.quizContainer.innerHTML = html;
}

function submitQuiz() {
    const mod = getActiveModule();
    state.quizSubmitted = true;
    let score = 0;

    mod.quiz.forEach(q => {
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
    setupSimulator();
    setupMarkComplete();
    setupQuiz();

    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    renderSidebar();
    renderLesson();
    updateProgress();
});
