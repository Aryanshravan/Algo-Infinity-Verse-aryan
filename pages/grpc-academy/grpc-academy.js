/* ============================================
   gRPC & PROTOBUF ACADEMY -- Curriculum, State, Playground & Quiz
   ============================================ */

const STORAGE_KEY = 'grpcAcademyProgress';

/* ─── Curriculum Data ─── */
const curriculum = [
    {
        id: 'grpc-fundamentals',
        title: 'gRPC Fundamentals',
        lessons: [
            {
                id: 'grpc-fundamentals-1',
                title: 'What is gRPC?',
                objectives: [
                    'Understand what gRPC is and the problem it solves',
                    'Recognize gRPC as a modern RPC framework built on HTTP/2',
                    'Identify the role of Protocol Buffers as the default interface language',
                    'Recall how gRPC enables high-performance, polyglot service communication',
                ],
                content: `
                    <h2>What is gRPC?</h2>
                    <p>gRPC is a modern, open-source <strong>Remote Procedure Call (RPC)</strong> framework that lets a program call a function on a different machine as if it were a local call. It was originally developed at Google and now powers thousands of production systems — including Google's own internal infrastructure.</p>

                    <h3>Remote Procedure Calls, explained</h3>
                    <p>In a distributed system, services rarely run on the same machine. An RPC framework abstracts away the networking: your client code calls <code>stub.GetUser(id)</code>, and under the hood gRPC serializes the arguments, sends them over the network, waits for the server to compute the result, and deserializes the reply back into your language's native objects.</p>
                    <pre><code>// What you write on the client:
let user = await client.GetUser({ id: 42 });

// What happens under the hood:
//  1. Serialize GetUserRequest { id: 42 } to binary (Protobuf)
//  2. Open/reuse an HTTP/2 stream to the server
//  3. Send the binary request with metadata
//  4. Wait for the binary response
//  5. Deserialize User { ... } back into a language object</code></pre>

                    <h3>Key Ingredients of gRPC</h3>
                    <ul>
                        <li><strong>Interface Definition Language (IDL)</strong> — Services and messages are declared in <code>.proto</code> files using Protocol Buffers.</li>
                        <li><strong>Code generation</strong> — The <code>protoc</code> compiler generates client stubs and server skeletons in your language of choice.</li>
                        <li><strong>HTTP/2 transport</strong> — Multiplexed streams, header compression (HPACK), and bidirectional flow control make it fast and efficient.</li>
                        <li><strong>Binary serialization</strong> — Protobuf encodes messages in a compact binary format, far smaller than JSON or XML.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">A Contract-First Approach</div>
                        <p>Because the <code>.proto</code> file is the single source of truth, clients and servers across languages (Go, Java, Node, Python, Rust…) can be generated from the same definition. This is why gRPC is a favorite for polyglot microservices.</p>
                    </div>
                `,
                takeaways: [
                    'gRPC is an RPC framework: remote calls feel like local function calls',
                    'It uses Protocol Buffers (.proto) as its default interface language',
                    'It runs on HTTP/2, giving multiplexing, compression, and streaming',
                    'Code generation from .proto files enables polyglot services',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'System Design Academy', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-fundamentals-2',
                title: 'Why gRPC? Benefits & Use Cases',
                objectives: [
                    'List the performance benefits of gRPC over JSON/HTTP',
                    'Explain how code generation improves developer velocity',
                    'Describe the four RPC types gRPC supports',
                    'Identify good use cases for gRPC',
                ],
                content: `
                    <h2>Why Do Teams Choose gRPC?</h2>
                    <p>Modern backends are chatty: microservices talk to each other constantly, often tens or hundreds of times per request. gRPC is designed for this world. Its benefits fall into three buckets: <strong>performance</strong>, <strong>developer experience</strong>, and <strong>streaming</strong>.</p>

                    <h3>1. Performance</h3>
                    <p>Protobuf's binary encoding produces small payloads, and HTTP/2 multiplexing allows many concurrent calls over a single TCP connection. Header compression (HPACK) eliminates repetitive header overhead.</p>
                    <pre><code>// Same data, two encodings:
// JSON (REST):            {"id":12345,"name":"Alice","active":true}   ~55 bytes
// Protobuf (gRPC):        08 39 30 12 05 41 6c 69 63 65 18 01        ~12 bytes</code></pre>

                    <h3>2. Developer Experience</h3>
                    <p>You define the contract once in a <code>.proto</code> file. The compiler generates type-safe client stubs and server skeletons, so you never hand-write serialization or network code. Changes to the contract are caught at compile time.</p>

                    <h3>3. Streaming — Four RPC Types</h3>
                    <ul>
                        <li><strong>Unary</strong> — one request, one response (like a classic call)</li>
                        <li><strong>Server streaming</strong> — one request, many responses</li>
                        <li><strong>Client streaming</strong> — many requests, one response</li>
                        <li><strong>Bidirectional streaming</strong> — both sides stream concurrently</li>
                    </ul>

                    <h3>Great Use Cases</h3>
                    <ul>
                        <li>Internal microservice-to-microservice calls</li>
                        <li>Real-time data feeds (streaming stock ticks, telemetry)</li>
                        <li>Low-latency, high-throughput APIs (ad servers, search)</li>
                        <li>Polyglot teams sharing a single service contract</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">When gRPC Is Not Ideal</div>
                        <p>gRPC is less friendly for browser-only clients (needs gRPC-Web and a proxy), and binary payloads are hard to debug by eye. For simple public CRUD APIs consumed directly by browsers, REST + JSON is often the better fit.</p>
                    </div>
                `,
                takeaways: [
                    'Binary Protobuf payloads and HTTP/2 make gRPC very fast',
                    'Codegen gives type-safe clients and servers from one contract',
                    'gRPC supports unary, server-streaming, client-streaming, and bidi streaming',
                    'It shines for internal services, real-time data, and polyglot teams',
                ],
                revision: [
                    { label: 'WebSocket & SSE Academy (streaming comparison)', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                    { label: 'Express.js Academy (REST comparison)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'API Design Learning', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                ],
            },
            {
                id: 'grpc-fundamentals-3',
                title: 'gRPC vs REST',
                objectives: [
                    'Compare REST and gRPC across transport, payload, and ergonomics',
                    'Explain when each style is the better choice',
                    'Understand gRPC-Web as a bridge for browser clients',
                    'Reason about HTTP/2 benefits that gRPC inherits',
                ],
                content: `
                    <h2>gRPC vs REST</h2>
                    <p>Both are ways for clients and servers to communicate, but they optimize for different things. REST uses HTTP verbs + JSON over HTTP/1.1; gRPC uses generated stubs + binary Protobuf over HTTP/2.</p>

                    <h3>Side-by-Side</h3>
                    <pre><code>// REST (HTTP/1.1 + JSON)
POST /api/users        Body: {"name":"Alice"}        ->  JSON response

// gRPC (HTTP/2 + Protobuf, POST to a pseudo-path)
POST /user.UserService/CreateUser
  content-type: application/grpc+proto
  body: <binary User proto message>                 ->  binary User reply</code></pre>

                    <table class="compare-table">
                        <thead>
                            <tr><th>Dimension</th><th>REST</th><th>gRPC</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Transport</td><td>HTTP/1.1</td><td>HTTP/2</td></tr>
                            <tr><td>Payload</td><td>JSON / XML (text)</td><td>Protobuf (binary)</td></tr>
                            <tr><td>Contract</td><td>Informal, docs</td><td>Strict .proto IDL</td></tr>
                            <tr><td>Codegen</td><td>Optional</td><td>First-class (protoc)</td></tr>
                            <tr><td>Streaming</td><td>Limited (SSE)</td><td>Full duplex native</td></tr>
                            <tr><td>Browser</td><td>Native</td><td>Needs gRPC-Web proxy</td></tr>
                            <tr><td>Debuggability</td><td>Easy (curl)</td><td>Needs grpcurl/bloom</td></tr>
                        </tbody>
                    </table>

                    <h3>Choosing Between Them</h3>
                    <p><strong>Prefer gRPC</strong> for service-to-service communication, low latency, streaming workloads, and polyglot teams. <strong>Prefer REST</strong> for public browser-facing APIs, simple CRUD, and when human-readability and tooling familiarity matter most.</p>

                    <div class="callout">
                        <div class="callout-title">gRPC-Web</div>
                        <p>gRPC-Web lets browsers talk to gRPC services through a proxy (e.g., Envoy) that translates HTTP/1.1 browser requests into HTTP/2 gRPC. This removes the main "browser support" objection while keeping the .proto contract.</p>
                    </div>
                `,
                takeaways: [
                    'REST = text JSON over HTTP/1.1; gRPC = binary Protobuf over HTTP/2',
                    'gRPC is contract-first with generated code; REST is resource/verb oriented',
                    'gRPC offers native streaming; REST streaming is limited',
                    'gRPC-Web + proxy enables browser clients for gRPC services',
                ],
                revision: [
                    { label: 'API Design Learning', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'gRPC & HTTP/2 Multiplexing Visualizer', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-grpc-fundamentals-1',
                question: 'What does gRPC stand for?',
                options: [
                    'Generic Remote Procedural Call',
                    'Google Remote Procedure Call',
                    'Global Remote Process Communication',
                    'General RPC Protocol',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-fundamentals-2',
                question: 'Which transport protocol does gRPC run on?',
                options: [
                    'TCP raw sockets',
                    'HTTP/1.1',
                    'HTTP/2',
                    'UDP',
                ],
                correct: 2,
            },
            {
                id: 'q-grpc-fundamentals-3',
                question: 'What is the default serialization format used by gRPC?',
                options: [
                    'JSON',
                    'XML',
                    'YAML',
                    'Protocol Buffers',
                ],
                correct: 3,
            },
            {
                id: 'q-grpc-fundamentals-4',
                question: 'How many RPC types does gRPC support?',
                options: [
                    'Two: unary and streaming',
                    'Three: unary, client, and server streaming',
                    'Four: unary, server-streaming, client-streaming, and bidirectional',
                    'One: unary only',
                ],
                correct: 2,
            },
        ],
    },
    {
        id: 'protobuf-messages',
        title: 'Protocol Buffers — Messages',
        lessons: [
            {
                id: 'protobuf-messages-1',
                title: 'Introduction to Protocol Buffers',
                objectives: [
                    'Understand what Protocol Buffers are and why they are compact',
                    'Write a simple message definition in a .proto file',
                    'Recognize the proto3 syntax basics',
                    'Know where the generated code comes from',
                ],
                content: `
                    <h2>Protocol Buffers (Protobuf)</h2>
                    <p>Protocol Buffers is Google's language-neutral, platform-neutral mechanism for serializing structured data — like a stricter, binary cousin of JSON. You describe your data once in a <code>.proto</code> file, and the compiler generates classes for many languages.</p>

                    <h3>Your First Message</h3>
                    <p>A <code>.proto</code> file declares messages with typed fields, each with a <strong>field number</strong> used on the wire:</p>
                    <pre><code>// user.proto
syntax = "proto3";          // <-- use proto3 unless you need proto2

message User {
  string name   = 1;        // field number 1, string type
  int32  id     = 2;        // field number 2, 32-bit integer
  bool   active = 3;        // field number 3, boolean
}</code></pre>

                    <h3>Why Field Numbers Matter</h3>
                    <p>Field numbers are <strong>not</strong> just comments — they are part of the wire format. Each field is tagged with <code>(field_number &lt;&lt; 3) | wire_type</code>. Never reuse or rename field numbers once messages are in production; that would corrupt data for old clients.</p>

                    <div class="callout">
                        <div class="callout-title">Compile It</div>
                        <p>Run <code>protoc --go_out=. user.proto</code> (or the equivalent for your language) and you get a generated <code>User</code> class with <code>ParseFrom</code>/<code>SerializeToString</code> helpers. No manual parsing code needed.</p>
                    </div>
                `,
                takeaways: [
                    'Protobuf is a compact, language-neutral binary serialization format',
                    'Messages are declared in .proto files using proto3 syntax',
                    'Each field has a type, a name, and a stable field number',
                    'The protoc compiler generates language classes from the definition',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator (see payload comparison)', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'Node.js Academy', url: '/pages/nodejs-learning/nodejs-learning.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'protobuf-messages-2',
                title: 'Scalar Types & Field Rules',
                objectives: [
                    'Map common protobuf scalar types to language equivalents',
                    'Explain the difference between optional and repeated fields',
                    'Use the default values that proto3 assigns to unset fields',
                    'Handle field numbers and reserved ranges safely',
                ],
                content: `
                    <h2>Scalar Types & Field Rules</h2>
                    <p>Protobuf provides scalar types that map cleanly to most languages. Choosing the right one affects both memory and wire size.</p>

                    <h3>Common Scalars</h3>
                    <pre><code>message Example {
  int32     count   = 1;   // signed 32-bit integer
  int64     big     = 2;   // signed 64-bit integer
  uint32    u        = 3;  // unsigned 32-bit
  float     ratio   = 4;   // 32-bit float
  double    precise = 5;   // 64-bit double
  bool      flag    = 6;   // boolean
  string    label   = 7;   // UTF-8 text
  bytes     payload = 8;   // raw bytes
}</code></pre>
                    <p><strong>Tip:</strong> for negative integers, prefer <code>sint32/sint64</code> — they use ZigZag encoding that keeps small negatives compact, whereas <code>int32</code> encodes negatives as 10 bytes.</p>

                    <h3>Field Rules in proto3</h3>
                    <ul>
                        <li><strong>singular</strong> (default) — at most one value; if unset, the field takes its default (0, empty string, false, …).</li>
                        <li><strong>optional</strong> — explicit presence tracking; you can distinguish "unset" from "set to default".</li>
                        <li><strong>repeated</strong> — a list (like an array); the order is preserved.</li>
                    </ul>

                    <h3>Reserved Fields</h3>
                    <p>When you delete a field, reserve its number and name so nobody accidentally reuses them:</p>
                    <pre><code>message User {
  reserved 5, 9;          // field numbers that are off-limits
  reserved "old_email";   // names that are off-limits
  string email = 1;
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Backward & Forward Compat</div>
                        <p>Adding a new field is safe: old clients simply ignore it. Removing a field is safe only if you reserve its number. This compatibility is why Protobuf is so good for long-lived contracts.</p>
                    </div>
                `,
                takeaways: [
                    'Scalar types map across languages; pick sizes deliberately',
                    'sint32/sint64 use ZigZag encoding for compact negatives',
                    'proto3 fields are singular by default; use repeated for lists',
                    'Reserve field numbers and names when deleting fields',
                ],
                revision: [
                    { label: 'TypeScript Academy (type mapping)', url: '/pages/typescript-academy/typescript-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'protobuf-messages-3',
                title: 'Repeated, Enums & Nested Types',
                objectives: [
                    'Use repeated fields, enums, and maps in messages',
                    'Nest messages and packages to organize large schemas',
                    'Work with default enum values (0) in proto3',
                    'Reference messages from other packages',
                ],
                content: `
                    <h2>Repeated Fields, Enums, Maps & Nesting</h2>
                    <p>Real-world schemas need collections and structure. Protobuf gives you <code>repeated</code>, <code>enum</code>, <code>map</code>, and nesting to model them.</p>

                    <h3>Repeated & Maps</h3>
                    <pre><code>message Order {
  repeated string items = 1;         // list of strings
  repeated LineItem  lines = 2;      // list of messages
  map&lt;string, int32&gt; quantities = 3; // dict key -> value
}</code></pre>

                    <h3>Enums</h3>
                    <p>Enums in proto3 must start at <code>0</code> (the default value). The first value should always be an "unknown" or zero state:</p>
                    <pre><code>enum Status {
  STATUS_UNSPECIFIED = 0;  // always reserve 0
  STATUS_ACTIVE      = 1;
  STATUS_PAUSED      = 2;
  STATUS_BANNED      = 3;
}

message Account {
  Status status = 1;
}</code></pre>

                    <h3>Nested Types & Packages</h3>
                    <p>Messages can be nested, and packages namespace everything to avoid collisions:</p>
                    <pre><code>package shop.catalog;   // like a namespace / module

message Product {
  message Price {          // nested message
    string currency = 1;
    int64  amount   = 2;
  }
  Price price = 1;
  string sku = 2;
}

// Reference across packages:
message CartItem {
  shop.catalog.Product product = 1;  // fully-qualified name
  int32 quantity = 2;
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Imports</div>
                        <p>Large projects split definitions across files and <code>import "common.proto";</code> to reuse shared messages. Generated code follows the import graph automatically.</p>
                    </div>
                `,
                takeaways: [
                    'repeated builds lists; map<k,v> builds dictionaries',
                    'proto3 enums must start at zero and use the first value as default',
                    'Messages and enums can be nested; packages avoid name clashes',
                    'import statements share definitions across .proto files',
                ],
                revision: [
                    { label: 'System Design Academy (data modeling)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'protobuf-messages-4',
                title: 'Compiling with protoc & Code Generation',
                objectives: [
                    'Run the protoc compiler to generate language code',
                    'Describe what the compiler produces for clients and servers',
                    'Understand the role of plugins for different languages',
                    'Know where generated code lives in a project',
                ],
                content: `
                    <h2>The .proto Compiler (protoc)</h2>
                    <p><code>protoc</code> reads your <code>.proto</code> file and generates idiomatic code for your language. It is the engine of the "contract-first" workflow.</p>

                    <h3>Running protoc</h3>
                    <pre><code># Generate Go
protoc --go_out=. --go-grpc_out=. user.proto

# Generate Node.js (JavaScript + type definitions)
protoc --js_out=import_style=commonjs:./out user.proto

# Generate Python
protoc --python_out=. user.proto

# With a plugin for other languages
protoc --plugin=protoc-gen-rust --rust_out=. user.proto</code></pre>

                    <h3>What Gets Generated</h3>
                    <ul>
                        <li><strong>Message classes</strong> — with constructors, getters/setters, and serialize/parse methods.</li>
                        <li><strong>Service base classes</strong> — server skeletons you implement.</li>
                        <li><strong>Client stubs</strong> — typed methods you call, with the networking handled for you.</li>
                    </ul>
                    <pre><code>// Generated client usage (pseudocode)
const client = new UserServiceClient('localhost:50051');
const reply = await client.createUser({ name: 'Alice' });</code></pre>

                    <h3>Build Integration</h3>
                    <p>In real projects, codegen runs as part of the build: <code>buf</code> or a Makefile/script invokes protoc so generated code always matches the <code>.proto</code> source. Commit the generated files (or generate in CI) — teams differ, but consistency is key.</p>

                    <div class="callout">
                        <div class="callout-title">Buf for Modern Workflows</div>
                        <p>Many teams use <strong>Buf</strong>, a modern protoc alternative with linting, breaking-change detection, and a centralized schema registry — great for managing contracts across many services.</p>
                    </div>
                `,
                takeaways: [
                    'protoc generates message classes, server skeletons, and client stubs',
                    'Language plugins extend protoc to any language',
                    'Codegen is wired into the build so contracts stay in sync',
                    'Buf adds linting, breaking-change detection, and a schema registry',
                ],
                revision: [
                    { label: 'Express.js Academy (server building)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-protobuf-messages-1',
                question: 'Which part of a protobuf field is used on the wire to identify the field?',
                options: [
                    'The field name',
                    'The field number',
                    'The data type',
                    'The comment above the field',
                ],
                correct: 1,
            },
            {
                id: 'q-protobuf-messages-2',
                question: 'In proto3, what is the default value of an unset int32 field?',
                options: [
                    'null',
                    'undefined',
                    '0',
                    'It throws an error',
                ],
                correct: 2,
            },
            {
                id: 'q-protobuf-messages-3',
                question: 'Which keyword declares a list/array field in proto3?',
                options: [
                    'list',
                    'array',
                    'collection',
                    'repeated',
                ],
                correct: 3,
            },
            {
                id: 'q-protobuf-messages-4',
                question: 'What is the purpose of the reserved keyword?',
                options: [
                    'To mark fields as private',
                    'To prevent old field numbers/names from being reused',
                    'To cache field values',
                    'To make fields read-only',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'grpc-services',
        title: 'Defining gRPC Services',
        lessons: [
            {
                id: 'grpc-services-1',
                title: 'Service Definitions & RPC Methods',
                objectives: [
                    'Define a service with RPC methods in a .proto file',
                    'List the four RPC method shapes',
                    'Use request/response message types in signatures',
                    'Reason about how the .proto service maps to code',
                ],
                content: `
                    <h2>Defining a gRPC Service</h2>
                    <p>A gRPC service is a set of <strong>RPC methods</strong> that clients can call. You declare it in the same <code>.proto</code> file (or a sibling file) alongside your messages.</p>

                    <h3>Service + Method Shapes</h3>
                    <pre><code>syntax = "proto3";

package user;

// Messages
message GetUserRequest { int32 id = 1; }
message User { int32 id = 1; string name = 2; }
message UserList { repeated User users = 1; }

// The service
service UserService {
  rpc GetUser(GetUserRequest) returns (User);           // unary
  rpc ListUsers(UserList) returns (stream User);        // server streaming
  rpc CreateMany(stream User) returns (UserList);       // client streaming
  rpc Chat(stream User) returns (stream User);          // bidirectional
}</code></pre>

                    <h3>How It Maps to Code</h3>
                    <p>After codegen, the server base class declares a method per RPC that you override, and the client stub exposes matching call methods:</p>
                    <pre><code>// Server (pseudocode)
class UserServiceImpl extends UserServiceBase {
  getUnary(request) { return { id: request.id, name: 'Alice' }; }
}

// Client (pseudocode)
const res = await client.getUser({ id: 7 });   // unary, returns User</code></pre>

                    <div class="callout">
                        <div class="callout-title">Method Names Become Paths</div>
                        <p>On the wire, each RPC maps to an HTTP/2 POST with a pseudo-path like <code>/user.UserService/GetUser</code>. The service name and method name are used to route the call — no custom routing config needed.</p>
                    </div>
                `,
                takeaways: [
                    'A service groups RPC methods declared in a .proto file',
                    'The four shapes: unary, server-stream, client-stream, bidi-stream',
                    'Server base classes and client stubs are generated from the service',
                    'Each RPC maps to an HTTP/2 path: /package.Service/Method',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'System Design Academy', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                ],
            },
            {
                id: 'grpc-services-2',
                title: 'Unary RPC — One Request, One Response',
                objectives: [
                    'Describe a unary RPC call lifecycle',
                    'Write a unary service method and client call',
                    'Understand where latency comes from in unary calls',
                    'Use context/deadline propagation with unary calls',
                ],
                content: `
                    <h2>Unary RPC</h2>
                    <p>Unary RPC is the simplest shape: the client sends one request and receives one response. It feels like a classic function call.</p>

                    <h3>Definition</h3>
                    <pre><code>service Greeter {
  rpc SayHello(HelloRequest) returns (HelloReply);
}

message HelloRequest { string name = 1; }
message HelloReply { string message = 1; }</code></pre>

                    <h3>Server Implementation (Node.js example)</h3>
                    <pre><code>const grpc = require('@grpc/grpc-js');

function sayHello(call, callback) {
  const reply = { message: 'Hello, ' + call.request.name + '!' };
  callback(null, reply);          // return a single reply
}

// register sayHello as the handler for Greeter.SayHello
server.addService(proto.Greeter.service, { sayHello });</code></pre>

                    <h3>Client Call</h3>
                    <pre><code>const client = new proto.Greeter('localhost:50051',
  grpc.credentials.createInsecure());

client.sayHello({ name: 'World' }, (err, reply) => {
  if (err) { console.error('RPC failed:', err); return; }
  console.log('Reply:', reply.message);
});</code></pre>

                    <div class="callout">
                        <div class="callout-title">One Stream, One Message</div>
                        <p>Even unary RPCs use an HTTP/2 stream: HEADERS with the method path, a DATA frame carrying the binary request, then response HEADERS + DATA, and a trailers frame with grpc-status. This uniform framing is what makes all four RPC types consistent.</p>
                    </div>
                `,
                takeaways: [
                    'Unary RPC: one request in, one response out',
                    'Server handlers return a single message via callback',
                    'Client stubs expose typed call methods',
                    'Under the hood it still uses an HTTP/2 stream with grpc-status trailers',
                ],
                revision: [
                    { label: 'Express.js Academy (request/response)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'gRPC & HTTP/2 Simulator', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                ],
            },
            {
                id: 'grpc-services-3',
                title: 'Server Streaming RPC',
                objectives: [
                    'Explain when server streaming is the right fit',
                    'Write a server handler that streams multiple messages',
                    'Iterate over a server stream on the client',
                    'Recognize real-world server-streaming examples',
                ],
                content: `
                    <h2>Server Streaming RPC</h2>
                    <p>The client sends <strong>one</strong> request and the server replies with a <strong>stream of responses</strong>. Use it when a single logical query yields many results over time.</p>

                    <h3>Classic Use Cases</h3>
                    <ul>
                        <li>Live stock ticker — one subscription, many price updates</li>
                        <li>Progress reports — one job request, many status messages</li>
                        <li>Page-through results — one query, a stream of records</li>
                    </ul>

                    <h3>Definition</h3>
                    <pre><code>service StockService {
  rpc StreamPrices(StockRequest) returns (stream PriceUpdate);
}</code></pre>

                    <h3>Server Handler</h3>
                    <pre><code>function streamPrices(call) {
  const symbols = call.request.symbols;
  const timer = setInterval(() => {
    const update = { symbol: symbols[0], price: Math.random() * 100 };
    call.write(update);           // push a message to the client
  }, 1000);

  call.on('cancelled', () => clearInterval(timer)); // clean up
  call.on('end', () => clearInterval(timer));
}

server.addService(proto.StockService.service, { streamPrices });</code></pre>

                    <h3>Client Iteration</h3>
                    <pre><code>const stream = client.streamPrices({ symbols: ['AAPL'] });

stream.on('data', (update) => {
  console.log('Price update:', update.symbol, update.price);
});
stream.on('end', () => console.log('Stream finished'));
stream.on('error', (err) => console.error('Stream error:', err));</code></pre>

                    <div class="callout">
                        <div class="callout-title">Why Not Just Poll?</div>
                        <p>Server streaming gives you <strong>push</strong> semantics: the server decides when new data arrives, so there is no polling latency or wasted requests. The HTTP/2 connection stays open and multiplexes with other calls.</p>
                    </div>
                `,
                takeaways: [
                    'Server streaming: one request in, many messages out',
                    'Handlers call write() repeatedly to push messages',
                    'Clients subscribe to the stream with data/end/error events',
                    'Ideal for live feeds, progress, and paginated results',
                ],
                revision: [
                    { label: 'WebSocket & SSE Academy (push patterns)', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                    { label: 'gRPC & HTTP/2 Simulator', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                ],
            },
            {
                id: 'grpc-services-4',
                title: 'Client & Bidirectional Streaming',
                objectives: [
                    'Explain client-streaming and bidirectional RPC',
                    'Write handlers and clients for both shapes',
                    'Understand the ordering and flow-control semantics',
                    'Pick the right streaming shape for a scenario',
                ],
                content: `
                    <h2>Client Streaming & Bidirectional Streaming</h2>
                    <p>Two more shapes unlock richer interactions: the client streams to the server, or both sides stream concurrently.</p>

                    <h3>Client Streaming — many in, one out</h3>
                    <p>Good for uploads, batch jobs, or aggregations where the client sends many records and the server replies once at the end.</p>
                    <pre><code>service UploadService {
  rpc UploadRows(stream Row) returns (Summary);
}

// Server: accumulate, then reply once
function uploadRows(call, callback) {
  let count = 0;
  call.on('data', (row) => { count++; });
  call.on('end', () => callback(null, { rowsReceived: count }));
}</code></pre>
                    <pre><code>// Client: write many, then end
const call = client.uploadRows((err, summary) => {
  console.log('Uploaded', summary.rowsReceived, 'rows');
});
for (const row of rows) call.write(row);
call.end();</code></pre>

                    <h3>Bidirectional Streaming — many in, many out</h3>
                    <p>Both sides send messages concurrently. Order is preserved per direction, but there is no global ordering between the two directions.</p>
                    <pre><code>service ChatService {
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

// Server: echo + broadcast to other subscribers
function chat(call) {
  call.on('data', (msg) => {
    call.write({ user: msg.user, text: 'Echo: ' + msg.text });
  });
  call.on('end', () => call.end());
}</code></pre>
                    <pre><code>// Client
const call = client.chat();
call.on('data', (msg) => console.log(msg.user + ':', msg.text));
call.write({ user: 'Alice', text: 'Hello!' });
call.end();</code></pre>

                    <div class="callout">
                        <div class="callout-title">Flow Control</div>
                        <p>HTTP/2 flow control prevents a fast sender from overwhelming a slow receiver. gRPC inherits this: <code>write()</code> may buffer until the receiver drains, so producers should respect backpressure in long streams.</p>
                    </div>
                `,
                takeaways: [
                    'Client streaming: many requests in, one response out',
                    'Bidirectional streaming: concurrent both ways, per-direction ordering',
                    'Handlers use on(data)/on(end) and write()/end() symmetrically',
                    'HTTP/2 flow control handles backpressure on long streams',
                ],
                revision: [
                    { label: 'System Design Academy (message queues analogy)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'WebSocket & SSE Academy', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-grpc-services-1',
                question: 'Which RPC shape sends one request and receives many responses?',
                options: [
                    'Unary RPC',
                    'Server streaming RPC',
                    'Client streaming RPC',
                    'Bidirectional streaming RPC',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-services-2',
                question: 'On the wire, how is an RPC method like GetUser routed?',
                options: [
                    'By a custom HTTP header',
                    'By an HTTP/2 pseudo-path such as /user.UserService/GetUser',
                    'By the TCP port number only',
                    'By a JSON body field',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-services-3',
                question: 'Which streaming shape is best for uploading many rows and receiving a single summary?',
                options: [
                    'Unary RPC',
                    'Server streaming RPC',
                    'Client streaming RPC',
                    'Bidirectional streaming RPC',
                ],
                correct: 2,
            },
            {
                id: 'q-grpc-services-4',
                question: 'In bidirectional streaming, what ordering guarantee exists?',
                options: [
                    'Messages are globally ordered across both directions',
                    'Order is preserved per direction, but not across directions',
                    'No ordering is guaranteed in either direction',
                    'Order is guaranteed only for the client side',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'grpc-communication',
        title: 'How Clients & Servers Communicate',
        lessons: [
            {
                id: 'grpc-communication-1',
                title: 'HTTP/2: The Transport Behind gRPC',
                objectives: [
                    'Explain HTTP/2 multiplexing and its performance benefits',
                    'Describe gRPC message framing (length-prefixed messages)',
                    'Understand headers, trailers, and the grpc-status code',
                    'Visualize multiple RPCs sharing one connection',
                ],
                content: `
                    <h2>HTTP/2 Under the Hood</h2>
                    <p>gRPC inherits its performance from HTTP/2. Understanding the transport explains a lot about how gRPC behaves.</p>

                    <h3>Multiplexing</h3>
                    <p>A single HTTP/2 connection carries many <strong>streams</strong> concurrently. Unlike HTTP/1.1 — which queues requests per connection — streams interleave, eliminating head-of-line blocking at the HTTP layer.</p>
                    <pre><code>Client -------- single TCP connection -------- Server
   |-- stream 1: GetUser(1)   ---&gt;
   |-- stream 3: GetUser(2)   ---&gt;   (concurrent!)
   |&lt;-- stream 1: User Alice  ---
   |&lt;-- stream 3: User Bob    ---</code></pre>

                    <h3>gRPC Message Framing</h3>
                    <p>Each gRPC message adds a tiny 5-byte prefix to the protobuf payload so the receiver knows where messages start and stop:</p>
                    <pre><code>+--------+--------------+------------------+
| 0x00   | length (4B)  | protobuf payload |
| flags  | big-endian   | (binary bytes)   |
+--------+--------------+------------------+</code></pre>
                    <ul>
                        <li><strong>1 byte</strong> — compressed flag (0 = uncompressed)</li>
                        <li><strong>4 bytes</strong> — payload length (big-endian)</li>
                        <li><strong>N bytes</strong> — the serialized protobuf message</li>
                    </ul>

                    <h3>Headers & Trailers</h3>
                    <p>Metadata travels in HTTP/2 headers. The final status is sent in <strong>trailers</strong> after the payload — that is how the client learns the call succeeded or failed:</p>
                    <pre><code>HEADERS   :method=POST  :path=/user.UserService/GetUser
          content-type=application/grpc+proto
          authorization=Bearer ...
DATA      &lt;binary GetUserRequest&gt;
DATA      &lt;binary User&gt;
TRAILERS  grpc-status: 0    grpc-message: "OK"</code></pre>

                    <div class="callout">
                        <div class="callout-title">Try It Live</div>
                        <p>Open the <strong>Playground</strong> tab to watch an RPC serialize a message and send it over a simulated HTTP/2 stream — including framing, headers, and trailers.</p>
                    </div>
                `,
                takeaways: [
                    'HTTP/2 multiplexes many streams over one TCP connection',
                    'gRPC frames each message with a 5-byte length prefix',
                    'Metadata goes in HTTP/2 headers; final status goes in trailers',
                    'grpc-status trailers carry success/failure of the call',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'System Design Academy (network layers)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-communication-2',
                title: 'Channels, Stubs & Interceptors',
                objectives: [
                    'Explain channels and their connection reuse',
                    'Use client stubs to issue calls',
                    'Understand interceptors for cross-cutting concerns',
                    'Configure basic channel options (TLS, load balancing)',
                ],
                content: `
                    <h2>Channels, Stubs & Interceptors</h2>
                    <p>When a gRPC client is created, it really creates a <strong>channel</strong> — the abstraction managing connections, load balancing, and TLS. Stubs sit on top of channels and expose typed methods.</p>

                    <h3>Channel Anatomy</h3>
                    <ul>
                        <li><strong>Channel</strong> — holds connection state, reconnects automatically, and can name-resolve a target like <code>dns:///api.internal:50051</code>.</li>
                        <li><strong>Stub</strong> — the typed interface generated from the <code>.proto</code> service; every call goes through the channel.</li>
                        <li><strong>Load balancer</strong> — e.g., round-robin or pick-first, distributes calls across resolved addresses.</li>
                    </ul>

                    <h3>Creating a Channel (Node.js)</h3>
                    <pre><code>const grpc = require('@grpc/grpc-js');
const { GreeterClient } = require('./proto/greeter_grpc_pb');

const channel = new grpc.Channel(
  'localhost:50051',
  grpc.credentials.createSsl(),            // TLS credentials
  { 'grpc.keepalive_time_ms': 30000 }
);

const client = new GreeterClient(channel);  // typed stub
client.sayHello({ name: 'Alice' }, cb);     // call through channel</code></pre>

                    <h3>Interceptors</h3>
                    <p>Interceptors wrap RPCs on the client or server, perfect for cross-cutting concerns:</p>
                    <ul>
                        <li>Attaching auth metadata to every outgoing call</li>
                        <li>Logging latency and payload sizes</li>
                        <li>Retrying idempotent calls on transient failures</li>
                        <li>Rate limiting or feature flags on the server</li>
                    </ul>
                    <pre><code>// Pseudocode: client interceptor adding an auth token
function authInterceptor(next) {
  return (call) => {
    call.metadata.add('authorization', 'Bearer ' + token);
    return next(call);
  };
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Connection Reuse Matters</div>
                        <p>Because a channel multiplexes many RPCs over few connections, creating long-lived channels (not one per call) is critical for performance. Reconnect logic is built in.</p>
                    </div>
                `,
                takeaways: [
                    'A channel manages connections, TLS, and load balancing',
                    'Stubs provide the typed method interface on top of a channel',
                    'Interceptors handle auth, logging, retries, and more',
                    'Reuse long-lived channels; they multiplex many RPCs',
                ],
                revision: [
                    { label: 'System Design Academy (load balancing)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Express.js Academy (middleware analogy)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                ],
            },
            {
                id: 'grpc-communication-3',
                title: 'Deadlines, Timeouts & Cancellation',
                objectives: [
                    'Set deadlines and timeouts on RPC calls',
                    'Explain how deadlines propagate from client to server',
                    'Handle cancelled calls gracefully on the server',
                    'Avoid the hidden bug of long unary calls',
                ],
                content: `
                    <h2>Deadlines, Timeouts & Cancellation</h2>
                    <p>Distributed calls can hang forever if a peer dies. gRPC uses <strong>deadlines</strong> to bound call duration and propagate cancellation across the wire.</p>

                    <h3>Setting a Deadline</h3>
                    <pre><code>// Client: fail if not done within 5 seconds
const deadline = new Date(Date.now() + 5000);
client.getUser({ id: 42 }, { deadline }, (err, user) => {
  if (err && err.code === grpc.status.DEADLINE_EXCEEDED) {
    console.log('Call timed out!');
  }
});</code></pre>

                    <h3>Propagation</h3>
                    <p>The deadline travels with the request as a <code>grpc-timeout</code> header. The server sees the <em>remaining</em> time and should prefer honoring the caller's deadline over its own local timeout.</p>
                    <pre><code>// Server: respect the incoming deadline
const timeout = call.getDeadline() - Date.now();
call.on('cancelled', () => {
  console.log('Client cancelled — stop expensive work');
  cleanup();
});</code></pre>

                    <h3>Why Deadlines Matter</h3>
                    <ul>
                        <li>Prevents resource leaks from hung calls</li>
                        <li>Bubbles up to the user as a clear <code>DEADLINE_EXCEEDED</code> error</li>
                        <li>Lets servers free up work early via cancellation callbacks</li>
                        <li>Composes across service chains (each hop carries the deadline)</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Always Set a Deadline</div>
                        <p>Without a deadline, a dead server means your call waits forever (and can pile up). Set one on every client call — a few seconds is usually plenty for internal services.</p>
                    </div>
                `,
                takeaways: [
                    'Deadlines bound how long a call may run',
                    'The grpc-timeout header propagates deadlines across services',
                    'Servers can detect cancellation to clean up work',
                    'Never skip deadlines — they prevent hung calls',
                ],
                revision: [
                    { label: 'WebSocket & SSE Academy (connection lifecycle)', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-communication-4',
                title: 'Error Handling & Status Codes',
                objectives: [
                    'Map gRPC status codes to their meanings',
                    'Read status codes from errors and trailers',
                    'Distinguish OK from error conditions',
                    'Send rich error messages and details',
                ],
                content: `
                    <h2>Error Handling & Status Codes</h2>
                    <p>Every gRPC call ends with a status: <code>OK</code> or an error code from a small, well-defined set. The status is transmitted in the <code>grpc-status</code> trailer.</p>

                    <h3>The Canonical Codes</h3>
                    <pre><code>OK                = 0   // success
CANCELLED         = 1   // caller cancelled
UNKNOWN           = 2   // unexpected error
INVALID_ARGUMENT  = 3   // bad request data
DEADLINE_EXCEEDED = 4   // timeout
NOT_FOUND         = 5   // resource missing
ALREADY_EXISTS    = 6   // resource already present
PERMISSION_DENIED = 7   // authenticated but not allowed
UNAUTHENTICATED   = 16  // missing/invalid credentials
RESOURCE_EXHAUSTED = 8  // quota / rate limit
UNIMPLEMENTED     = 12  // method not implemented
UNAVAILABLE       = 14  // service down / draining
INTERNAL          = 13  // server bug</code></pre>

                    <h3>Sending Errors from the Server</h3>
                    <pre><code>// Unary handler error
function getUser(call, callback) {
  const user = db.get(call.request.id);
  if (!user) {
    const err = new Error('User not found');
    err.code = grpc.status.NOT_FOUND;
    return callback(err, null);
  }
  callback(null, user);
}

// Streaming handler error
function streamPrices(call) {
  if (!isAuthorized(call.metadata)) {
    call.destroy({ code: grpc.status.UNAUTHENTICATED });
    return;
  }
  // ... stream
}</code></pre>

                    <h3>Handling Errors on the Client</h3>
                    <pre><code>client.getUser({ id: 99 }, (err, user) => {
  if (err) {
    switch (err.code) {
      case grpc.status.NOT_FOUND:
        return console.log('Show 404 page');
      case grpc.status.DEADLINE_EXCEEDED:
        return console.log('Slow down / retry');
      default:
        return console.error('Unexpected:', err.message);
    }
  }
  console.log(user);
});</code></pre>

                    <div class="callout">
                        <div class="callout-title">Retryable vs Not</div>
                        <p>Treat <code>UNAVAILABLE</code>, <code>DEADLINE_EXCEEDED</code>, and <code>RESOURCE_EXHAUSTED</code> as potentially retryable. Treat <code>INVALID_ARGUMENT</code>, <code>NOT_FOUND</code>, and <code>PERMISSION_DENIED</code> as permanent — retrying won't help.</p>
                    </div>
                `,
                takeaways: [
                    'Every RPC ends with a grpc-status trailer',
                    'Use canonical codes to express failures precisely',
                    'Servers set err.code; clients switch on err.code',
                    'Retry transient codes, not permanent ones',
                ],
                revision: [
                    { label: 'System Design Academy (resiliency)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Express.js Academy (error handling)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-grpc-communication-1',
                question: 'Where does gRPC transmit the final status of a call?',
                options: [
                    'In the request headers',
                    'In the HTTP/2 trailers after the payload',
                    'In the TCP FIN packet',
                    'In a separate control stream',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-communication-2',
                question: 'Which gRPC status code means the call exceeded its deadline?',
                options: [
                    'UNAVAILABLE',
                    'NOT_FOUND',
                    'DEADLINE_EXCEEDED',
                    'CANCELLED',
                ],
                correct: 2,
            },
            {
                id: 'q-grpc-communication-3',
                question: 'What does a channel in a gRPC client manage?',
                options: [
                    'Only serialization of messages',
                    'Connections, TLS, and load balancing',
                    'The database queries on the server',
                    'The .proto file parsing',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-communication-4',
                question: 'Why should you always set a deadline on client calls?',
                options: [
                    'To reduce payload size',
                    'To enable server streaming',
                    'To prevent hung calls and free resources when a peer fails',
                    'To disable retries',
                ],
                correct: 2,
            },
        ],
    },
    {
        id: 'protobuf-advanced',
        title: 'Protocol Buffers — Advanced',
        lessons: [
            {
                id: 'protobuf-advanced-1',
                title: 'oneof, optional & Field Presence',
                objectives: [
                    'Explain implicit vs explicit field presence in proto3',
                    'Use the optional keyword to track whether a field was set',
                    'Use oneof for mutually exclusive fields',
                    'Pick the right presence semantics for your contract',
                ],
                content: `
                    <h2>Field Presence & oneof</h2>
                    <p>By default, proto3 fields use <strong>implicit presence</strong>: an unset field is indistinguishable from a field set to its default (0, empty string, false). When the meaning of "not set" matters, you need <strong>explicit presence</strong>.</p>

                    <h3>optional restores explicit presence</h3>
                    <p>Marking a field <code>optional</code> lets you detect "unset" vs "set to default":</p>
                    <pre><code>message Settings {
  optional int32 retries = 1;   // is it "not set" or "set to 0"?
  string api_key = 2;           // default: implicit presence
}</code></pre>
                    <p>Generated code exposes helpers like <code>hasRetries()</code> and <code>clearRetries()</code> so callers can tell the two cases apart.</p>

                    <h3>oneof — exactly one of these fields</h3>
                    <p>Use <code>oneof</code> for fields that are mutually exclusive. Setting any member automatically clears the others:</p>
                    <pre><code>message Request {
  oneof payload {
    string text = 1;            // either a text query...
    bytes   file = 2;           // ...or a file upload
  }
  int32 version = 3;            // a regular field, unaffected
}</code></pre>
                    <ul>
                        <li>Only one member of a oneof may hold a value at a time.</li>
                        <li>Generated code exposes a kind/case selector (e.g., <code>payload == "text"</code>).</li>
                        <li>Enums and maps cannot be oneof members.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Presence Trade-offs</div>
                        <p>Explicit presence costs a little wire space and mental overhead. Default to implicit presence for most fields; reach for <code>optional</code> or <code>oneof</code> when "not set" genuinely means something different from "set to default" — for example, an update API where a missing field means "leave unchanged".</p>
                    </div>
                `,
                takeaways: [
                    'proto3 uses implicit presence by default (0 / "" / false)',
                    'optional adds explicit presence with hasX() / clearX() helpers',
                    'oneof guarantees exactly one of several fields is set',
                    'Presence semantics are a contract decision, not an accident',
                ],
                revision: [
                    { label: 'TypeScript Academy (type mapping)', url: '/pages/typescript-academy/typescript-academy.html', tag: 'Related' },
                    { label: 'API Design Learning (contract design)', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'protobuf-advanced-2',
                title: 'Well-Known Types & Any',
                objectives: [
                    'Use google.protobuf well-known types for common data',
                    'Represent timestamps and durations with proper types',
                    'Explain wrapper types and why they exist',
                    'Use Any for polymorphic payloads with care',
                ],
                content: `
                    <h2>Well-Known Types & Any</h2>
                    <p>Google ships a set of <strong>well-known types</strong> (WKTs) bundled with protoc. They standardize common data shapes so services agree without reinventing them.</p>

                    <h3>Timestamps, Durations & Empty</h3>
                    <pre><code>import "google/protobuf/timestamp.proto";
import "google/protobuf/duration.proto";
import "google/protobuf/empty.proto";

message Event {
  google.protobuf.Timestamp created_at = 1;  // instant in time (seconds + nanos)
  google.protobuf.Duration  ttl        = 2;  // a span of time
}

service Audit {
  rpc Ping(google.protobuf.Empty) returns (google.protobuf.Empty);
}</code></pre>
                    <p>Timestamps avoid the classic date bugs: timezone confusion, ambiguous formats, and fragile string parsing. Generated code maps them to native datetime types in every language.</p>

                    <h3>Wrapper Types</h3>
                    <p>Wrapper messages like <code>google.protobuf.Int32Value</code>, <code>DoubleValue</code>, and <code>StringValue</code> wrap a single scalar so it can distinguish unset from default:</p>
                    <pre><code>import "google/protobuf/wrappers.proto";

message Config {
  google.protobuf.Int32Value max_connections = 1;  // null vs 0
}</code></pre>

                    <h3>Any — dynamic payloads</h3>
                    <p><code>google.protobuf.Any</code> embeds any message with its type URL, enabling polymorphic messages and pluggable extensions:</p>
                    <pre><code>import "google/protobuf/any.proto";

message Envelope {
  google.protobuf.Any payload = 1;   // type_url + packed bytes
}</code></pre>
                    <p>Receivers unpack the Any back into the concrete message. Use it sparingly — it weakens the strict typing that makes gRPC contracts safe, and it requires type registration on both sides.</p>

                    <div class="callout">
                        <div class="callout-title">WKTs Are Codegen-Ready</div>
                        <p>protoc ships the WKT sources, so imports like <code>google/protobuf/timestamp.proto</code> resolve out of the box. Your generated code gets strongly-typed timestamp/duration helpers instead of raw integers or strings.</p>
                    </div>
                `,
                takeaways: [
                    'Well-known types standardize common data (timestamps, durations)',
                    'Wrappers add nullable semantics to scalar values',
                    'Any enables dynamic/polymorphic payloads with type_url',
                    'Prefer strong typing over Any except for genuinely dynamic data',
                ],
                revision: [
                    { label: 'Node.js Academy (date handling)', url: '/pages/nodejs-learning/nodejs-learning.html', tag: 'Related' },
                    { label: 'System Design Academy (data modeling)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'protobuf-advanced-3',
                title: 'Imports, Packages & Multi-File Projects',
                objectives: [
                    'Split .proto files across modules with imports',
                    'Use packages to namespace types and services',
                    'Configure codegen options (go_package, java_package)',
                    'Organize a large schema as a project',
                ],
                content: `
                    <h2>Organizing Real-World Schemas</h2>
                    <p>Single-file schemas don't scale. Real projects split definitions into multiple <code>.proto</code> files and wire them together with imports and packages.</p>

                    <h3>Imports</h3>
                    <pre><code>// common.proto
syntax = "proto3";
package common;

message Money {
  string currency = 1;
  int64  amount   = 2;
}</code></pre>
                    <pre><code>// order.proto
syntax = "proto3";
package shop;
import "common.proto";

message Order {
  string id = 1;
  common.Money total = 2;   // reference the imported type
}</code></pre>

                    <h3>Packages prevent collisions</h3>
                    <p>Every type and service lives in a package namespace. Two teams can both define a <code>User</code> message as long as they live in different packages — and on the wire, the service path reflects the package (<code>/shop.OrderService/GetOrder</code>).</p>

                    <h3>Codegen options</h3>
                    <pre><code>syntax = "proto3";

package user.v1;

option go_package = "example.com/svc/gen/user/v1;userv1";
option java_package = "com.example.svc.user.v1";
option csharp_namespace = "Example.Svc.User.V1";

service UserService {
  rpc Get(GetUserRequest) returns (User);
}</code></pre>
                    <p>These options steer where and how generated code lands in each language. Versioning the package (e.g., <code>user.v1</code>) is a common pattern for evolving APIs side by side.</p>

                    <h3>Project organization</h3>
                    <ul>
                        <li>Group related messages and services into cohesive files.</li>
                        <li>Put truly shared types in a <code>common.proto</code> (or a dedicated package).</li>
                        <li>Run <code>buf lint</code> and <code>buf breaking</code> in CI to keep the schema healthy.</li>
                        <li>Treat <code>.proto</code> files as code: review them, version them, test them.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Imports Are Explicit</div>
                        <p>Protobuf has no global namespace: a file only sees types it explicitly imports. That keeps dependencies visible and makes the schema graph easy to audit.</p>
                    </div>
                `,
                takeaways: [
                    'Imports make schemas composable across files',
                    'Packages namespace types; service paths embed the package',
                    'Codegen options (go_package, java_package) control generated output',
                    'Lint and breaking-change checks belong in CI',
                ],
                revision: [
                    { label: 'TypeScript Academy (modules)', url: '/pages/typescript-academy/typescript-academy.html', tag: 'Related' },
                    { label: 'System Design Academy (service boundaries)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-protobuf-advanced-1',
                question: 'What does the optional keyword add to a proto3 field?',
                options: [
                    'A default value',
                    'Explicit presence tracking (hasX / clearX)',
                    'Automatic encryption',
                    'A unique field number',
                ],
                correct: 1,
            },
            {
                id: 'q-protobuf-advanced-2',
                question: 'Which well-known type should you use to represent an instant in time?',
                options: [
                    'google.protobuf.Duration',
                    'google.protobuf.Empty',
                    'google.protobuf.Timestamp',
                    'google.protobuf.Int32Value',
                ],
                correct: 2,
            },
            {
                id: 'q-protobuf-advanced-3',
                question: 'What happens when you set a second field inside a oneof?',
                options: [
                    'Both values are preserved',
                    'It causes a compile error',
                    'The previously set oneof member is cleared',
                    'The server ignores it',
                ],
                correct: 2,
            },
            {
                id: 'q-protobuf-advanced-4',
                question: 'How do you reference a type defined in another .proto file?',
                options: [
                    'Copy-paste the definition into your file',
                    'Use an import statement for the file',
                    'Declare it again in the same package',
                    'It is globally available without imports',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'proto-versioning',
        title: 'Schema Evolution & Versioning',
        lessons: [
            {
                id: 'proto-versioning-1',
                title: 'Backward & Forward Compatibility',
                objectives: [
                    'Explain backward and forward compatibility',
                    'List the golden rules of evolving a message',
                    'Describe how unknown fields are preserved',
                    'Audit whether a change is safe or breaking',
                ],
                content: `
                    <h2>Compatible Evolution</h2>
                    <p>Protobuf's superpower is that old and new code can talk to each other. Two directions matter:</p>
                    <ul>
                        <li><strong>Backward compatible</strong> — new code can read messages written by old code.</li>
                        <li><strong>Forward compatible</strong> — old code can read messages written by new code.</li>
                    </ul>
                    <p>Both work because parsers skip fields they don't know about instead of failing.</p>

                    <h3>The Golden Rules</h3>
                    <pre><code>message User {
  string name = 1;
  // SAFE: add a brand-new field with a fresh number
  int32  age  = 2;
}

// BREAKING: reuse field number 1 with a different type
// message User { int64 name = 1; }   // NO</code></pre>
                    <ul>
                        <li><strong>Never change</strong> the type or number of an existing field.</li>
                        <li><strong>Never reuse</strong> a deleted field's number (use <code>reserved</code>).</li>
                        <li><strong>Adding</strong> a new field with a new number is always safe.</li>
                        <li>Changing semantics (what a value means) is a breaking change even if it still compiles.</li>
                    </ul>

                    <h3>Unknown Fields Survive</h3>
                    <p>When a parser meets an unknown field number, it stores the raw bytes and re-emits them verbatim if the message is re-serialized. That means a value written by a new client survives a round-trip through an old server — and back. This is what makes gradual rollouts safe.</p>

                    <div class="callout">
                        <div class="callout-title">Test Your Compatibility</div>
                        <p>Automate it: <code>buf breaking --against .git</code> compares your schema against the last committed version and fails the build on breaking changes. CI catches compatibility problems before they reach production.</p>
                    </div>
                `,
                takeaways: [
                    'Backward compat = new code reads old data; forward = old reads new',
                    'Unknown fields are preserved, so skipping is safe',
                    'Add fields with fresh numbers; never change types or reuse numbers',
                    'buf breaking can enforce compatibility in CI',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator (payload evolution)', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'API Design Learning (versioning)', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'proto-versioning-2',
                title: 'Field Numbers: Ranges, Reserved & Planning',
                objectives: [
                    'Explain how field number size affects wire size',
                    'Use reserved to protect deleted numbers and names',
                    'Plan a field number budget',
                    'Avoid the reserved range 19000-19999',
                ],
                content: `
                    <h2>Field Numbers Are a Budget</h2>
                    <p>Every field number is part of the wire format — bigger numbers cost more bytes on every message. Numbers are a scarce, permanent resource, so spend them deliberately.</p>

                    <h3>Number size = wire size</h3>
                    <p>Field numbers 1-15 encode their tag in a <strong>single byte</strong>; 16-2047 take two bytes. Frequently sent fields should get the low numbers:</p>
                    <pre><code>message TrackingEvent {
  string event_id = 1;    // hot path: 1-byte tag
  int64  ts       = 2;    // hot path: 1-byte tag
  string device   = 20;   // less frequent: 2-byte tag
  string region   = 21;
}</code></pre>

                    <h3>reserved protects the past</h3>
                    <pre><code>message User {
  reserved 5, 9, 12;          // never reuse these numbers
  reserved "nickname";        // never reuse this name
  string name = 1;
}</code></pre>
                    <p>After deleting a field, reserve its number and name. Otherwise a future developer may reuse number 5 for something totally different and silently corrupt old data.</p>

                    <h3>The protobuf-owned reserved range</h3>
                    <p>Numbers 19000-19999 are reserved by the protobuf implementation itself. The compiler refuses to compile messages that use them — for good reason: they are used internally.</p>

                    <div class="callout">
                        <div class="callout-title">Plan for Growth</div>
                        <p>Group related fields into ranges (e.g., 1-10 core identity, 11-20 profile, 21-30 settings) so you always know where to allocate the next number. Leave gaps — padding is cheap, collisions are not.</p>
                    </div>
                `,
                takeaways: [
                    'Small field numbers (1-15) produce smaller messages',
                    'reserved blocks reuse of deleted numbers and names',
                    '19000-19999 is reserved by protobuf itself',
                    'Allocate numbers in logical ranges with room to grow',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator (see wire tags)', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'System Design Academy (data modeling)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'proto-versioning-3',
                title: 'Strategies for Safe Schema Changes',
                objectives: [
                    'Apply an additive-first change strategy',
                    'Rename and restructure without breaking clients',
                    'Use deprecation and sunset processes',
                    'Decide between in-place evolution and new API versions',
                ],
                content: `
                    <h2>Evolving a Contract That Ships</h2>
                    <p>Schemas are the shared language between services. The safest evolution is <strong>additive-first</strong>: add new fields and methods, ship consumers, then remove the old stuff on a schedule.</p>

                    <h3>Rename safely</h3>
                    <p>Renaming a field <em>in the .proto source</em> is a breaking wire change if done naively. Instead, add a new field with a new number, migrate writers, migrate readers, then retire the old one:</p>
                    <pre><code>message User {
  string full_name = 1;     // old name, used by old clients
  string display_name = 4;  // new field with a fresh number
}</code></pre>

                    <h3>Deprecate, then sunset</h3>
                    <pre><code>message User {
  string legacy_token = 5 [deprecated = true];
}</code></pre>
                    <p>The <code>[deprecated = true]</code> flag warns tooling and developers without breaking anything. Sunset on a defined schedule: announce, keep compatibility a while, then remove and <code>reserved</code> the number.</p>

                    <h3>Versioning strategies</h3>
                    <ul>
                        <li><strong>Compatible in place</strong> — for additive, non-breaking growth (most cases).</li>
                        <li><strong>New package version</strong> — <code>user.v2</code> alongside <code>user.v1</code> when a truly breaking redesign is unavoidable, running both during migration.</li>
                        <li><strong>New service</strong> — new RPCs in a new service or new method names when the semantics change fundamentally.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Semantics Are the Contract Too</div>
                        <p>Reusing a number with the same type but a different meaning ("1 now means USD cents instead of dollars") is a breaking change that no compiler can catch. Document meaning in the .proto comments and review semantic changes like wire changes.</p>
                    </div>
                `,
                takeaways: [
                    'Prefer additive changes: add, migrate, then remove',
                    'Rename by adding a new field, not editing the old one',
                    'Deprecate before removing; reserve numbers after removal',
                    'Use user.v2-style packages only for truly breaking redesigns',
                ],
                revision: [
                    { label: 'API Design Learning (versioning strategies)', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'Express.js Academy (API migration)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-proto-versioning-1',
                question: 'What does "forward compatible" mean?',
                options: [
                    'New servers can only talk to new clients',
                    'Old code can read messages written by new code',
                    'Messages are compressed for forward transmission',
                    'Field numbers must be sequential',
                ],
                correct: 1,
            },
            {
                id: 'q-proto-versioning-2',
                question: 'What happens when a parser encounters an unknown field number?',
                options: [
                    'It crashes the process',
                    'It silently drops the field',
                    'It stores the raw bytes and preserves them on re-serialization',
                    'It asks the sender to retry',
                ],
                correct: 2,
            },
            {
                id: 'q-proto-versioning-3',
                question: 'Why are field numbers 1-15 preferred for hot-path fields?',
                options: [
                    'They sort first in serialized output',
                    'Their tags encode in a single byte, shrinking messages',
                    'They are reserved for the compiler',
                    'They cannot be changed later',
                ],
                correct: 1,
            },
            {
                id: 'q-proto-versioning-4',
                question: 'After deleting a field, what must you do with its number?',
                options: [
                    'Reassign it to the next new field',
                    'Nothing',
                    'Reserve it so it is never reused',
                    'Convert it to a map key',
                ],
                correct: 2,
            },
        ],
    },
    {
        id: 'grpc-production',
        title: 'Production-Ready gRPC',
        lessons: [
            {
                id: 'grpc-production-1',
                title: 'Security: TLS, AuthN & AuthZ',
                objectives: [
                    'Enable TLS and mutual TLS on channels',
                    'Attach credentials via call metadata and interceptors',
                    'Implement server-side authentication checks',
                    'Apply least-privilege authorization to RPCs',
                ],
                content: `
                    <h2>Securing gRPC Calls</h2>
                    <p>gRPC security has two layers: the <strong>transport</strong> (TLS) and the <strong>application</strong> (authentication and authorization on each call).</p>

                    <h3>Transport security with TLS</h3>
                    <pre><code>// Server: serve with TLS
const grpc = require('@grpc/grpc-js');
const credentials = grpc.ServerCredentials.createSsl(rootCert, [
  { private_key, cert_chain }
]);
server.bindAsync('0.0.0.0:50051', credentials, cb);

// Client: trust the server certificate
const client = new GreeterClient(
  'api.internal:50051',
  grpc.credentials.createSsl(caRoot)
);</code></pre>
                    <p>For strict service-to-service identity, use <strong>mTLS</strong>: both sides present certificates, so a client proves its identity at the transport layer.</p>

                    <h3>Call credentials (AuthN)</h3>
                    <p>Authentication tokens typically ride in <code>authorization</code> metadata, added once per call via an interceptor:</p>
                    <pre><code>// Client interceptor: attach a JWT to every call
function authInterceptor(next) {
  return (call) => {
    call.metadata.set('authorization', 'Bearer ' + token);
    return next(call);
  };
}</code></pre>

                    <h3>Authorization on the server</h3>
                    <pre><code>// Server interceptor: enforce access control per RPC
function authzInterceptor(req, res, next) {
  const user = authenticate(req.metadata);
  if (!user) return res.sendError(grpc.status.UNAUTHENTICATED);
  if (!user.can(req.servicePath)) return res.sendError(grpc.status.PERMISSION_DENIED);
  next();
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Defense in Depth</div>
                        <p>TLS keeps the wire safe; call credentials prove who is calling; server authorization decides what they may do. Each layer answers a different question — use all three.</p>
                    </div>
                `,
                takeaways: [
                    'TLS protects the transport; mTLS proves client identity at the wire level',
                    'Auth tokens travel in call metadata via interceptors',
                    'Servers check authentication, then authorization, per RPC',
                    'Use UNAUTHENTICATED vs PERMISSION_DENIED codes correctly',
                ],
                revision: [
                    { label: 'System Design Academy (security)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Express.js Academy (auth middleware)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-production-2',
                title: 'Retries, Load Balancing & Health Checks',
                objectives: [
                    'Configure retry policies for transient failures',
                    'Explain load balancing strategies on channels',
                    'Implement gRPC health checking',
                    'Design for graceful degradation',
                ],
                content: `
                    <h2>Keeping Services Available</h2>
                    <p>Production gRPC needs resilience: retries for transient failures, load balancing across replicas, and health checks so traffic only reaches healthy instances.</p>

                    <h3>Retries with backoff</h3>
                    <p>Client-side retry is configured via the service config. Only retry <strong>transient</strong> codes (UNAVAILABLE, RESOURCE_EXHAUSTED) and only on safe, idempotent calls:</p>
                    <pre><code>// Client service config
{
  "methodConfig": [{
    "name": [{"service": "shop.OrderService"}],
    "retryPolicy": {
      "maxAttempts": 4,
      "initialBackoff": "0.1s",
      "maxBackoff": "1s",
      "backoffMultiplier": 2,
      "retryableStatusCodes": ["UNAVAILABLE"]
    }
  }]
}</code></pre>

                    <h3>Load balancing</h3>
                    <ul>
                        <li><strong>pick_first</strong> (default) — connect to the first address that works; fail over to the next.</li>
                        <li><strong>round_robin</strong> — spread calls across all resolved addresses.</li>
                        <li>In Kubernetes, client-side LB with a headless service, or server-side LB (Envoy/Linkerd) that exposes a stable VIP.</li>
                    </ul>

                    <h3>Health checking protocol</h3>
                    <p>gRPC has a standard health service (<code>grpc.health.v1.Health</code>) so load balancers can probe liveness:</p>
                    <pre><code>// Server: set your service status
healthService.setStatus('shop.OrderService', 'SERVING');

// LB/probe: single generic Check
rpc Check(HealthCheckRequest) returns (HealthCheckResponse);</code></pre>
                    <p>Combined with readiness gates, unhealthy instances are drained and removed before real traffic suffers.</p>

                    <div class="callout">
                        <div class="callout-title">Idempotency Unlocks Retries</div>
                        <p>Retrying a non-idempotent call (e.g., CreateOrder) can double-create resources. Only enable retries for reads and idempotent writes — or make writes idempotent with client-supplied request IDs.</p>
                    </div>
                `,
                takeaways: [
                    'Retry transient codes with exponential backoff on idempotent calls',
                    'pick_first and round_robin are the core client-side LB strategies',
                    'The grpc.health.v1.Health service standardizes liveness probes',
                    'Drain unhealthy instances before traffic suffers',
                ],
                revision: [
                    { label: 'System Design Academy (load balancing & health)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'WebSocket & SSE Academy (connection lifecycle)', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-production-3',
                title: 'Observability: Logs, Metrics & Traces',
                objectives: [
                    'Capture structured logs per RPC',
                    'Export gRPC metrics for dashboards',
                    'Propagate and analyze distributed traces',
                    'Use status codes and metadata for debugging',
                ],
                content: `
                    <h2>Seeing Inside Your gRPC Service</h2>
                    <p>You can't debug what you can't see. Observability for gRPC = structured <strong>logs</strong>, rich <strong>metrics</strong>, and distributed <strong>traces</strong>.</p>

                    <h3>Structured logs</h3>
                    <pre><code>// Server interceptor: log every RPC with key fields
function loggingInterceptor(req, res, next) {
  const start = Date.now();
  next();
  res.on('finish', () => {
    logger.info('rpc', {
      method: req.servicePath,
      code: res.status.code,
      latency_ms: Date.now() - start,
      peer: req.getPeer(),
    });
  });
}</code></pre>

                    <h3>Metrics</h3>
                    <p>Export counters and histograms per service and method:</p>
                    <ul>
                        <li>Request rate and error rate (by grpc-status code)</li>
                        <li>Latency histograms (p50/p95/p99)</li>
                        <li>Active in-flight RPCs</li>
                        <li>Payload sizes and stream message counts</li>
                    </ul>

                    <h3>Distributed tracing</h3>
                    <p>OpenTelemetry instruments gRPC automatically and propagates trace context through gRPC metadata (<code>traceparent</code>). A single user request crossing five gRPC services becomes one waterfall trace:</p>
                    <pre><code>GET /order/42
 └─ order-service   (server span)
     ├─ inventory.CheckStock   (gRPC client span)
     ├─ pricing.Calculate      (gRPC client span)
     └─ payments.Charge        (gRPC client span)</code></pre>
                    <p>Latency outliers become obvious: you can see exactly which hop added the delay.</p>

                    <div class="callout">
                        <div class="callout-title">Instrument Early</div>
                        <p>Adding interceptors for logging, metrics, and tracing once at the framework level means every new RPC is observable for free. Wire it in before you need it — retrofitting is painful.</p>
                    </div>
                `,
                takeaways: [
                    'Interceptors add per-RPC logging, metrics, and tracing in one place',
                    'Track request/error rates, latency, and in-flight RPCs',
                    'OpenTelemetry propagates trace context through gRPC metadata',
                    'Instrument once at the framework level, benefit everywhere',
                ],
                revision: [
                    { label: 'System Design Academy (monitoring)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Express.js Academy (logging)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-grpc-production-1',
                question: 'Which gRPC status code should a server return when credentials are missing?',
                options: [
                    'INVALID_ARGUMENT',
                    'UNAUTHENTICATED',
                    'NOT_FOUND',
                    'UNAVAILABLE',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-production-2',
                question: 'Why should retries only target idempotent operations?',
                options: [
                    'Idempotent calls are faster',
                    'Retrying non-idempotent calls can duplicate side effects',
                    'Only idempotent calls have deadlines',
                    'The server rejects non-idempotent retries automatically',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-production-3',
                question: 'What is the default client load-balancing strategy in most gRPC implementations?',
                options: [
                    'round_robin',
                    'random',
                    'pick_first',
                    'least_loaded',
                ],
                correct: 2,
            },
            {
                id: 'q-grpc-production-4',
                question: 'How does OpenTelemetry trace a call across multiple gRPC services?',
                options: [
                    'By correlating log timestamps',
                    'By propagating trace context through gRPC metadata',
                    'By reading TCP sequence numbers',
                    'By replaying the request at each hop',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'grpc-integration',
        title: 'gRPC in the Real World',
        lessons: [
            {
                id: 'grpc-integration-1',
                title: 'gRPC-Web & Browser Clients',
                objectives: [
                    'Explain why browsers cannot use native gRPC',
                    'Describe the gRPC-Web protocol and proxy',
                    'Call gRPC services from JavaScript in the browser',
                    'Choose between gRPC-Web and REST for frontends',
                ],
                content: `
                    <h2>Bringing gRPC to the Browser</h2>
                    <p>Browsers can't speak native gRPC: they can't set HTTP/2 trailers, can't push DATA frames reliably, and the gRPC binary protocol isn't exposed to the Fetch/XHR APIs. <strong>gRPC-Web</strong> solves this with a proxy.</p>

                    <h3>How it works</h3>
                    <pre><code>Browser (HTTP/1.1, gRPC-Web)
   │  application/grpc-web+proto
   ▼
Envoy / gRPC-Web proxy ──── native gRPC (HTTP/2) ──── gRPC server</code></pre>
                    <p>The proxy translates browser requests into standard gRPC calls, then translates responses back. Trailers are smuggled to the browser as a final base64-encoded trailer frame.</p>

                    <h3>Calling from JavaScript</h3>
                    <pre><code>import { createPromiseClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { UserService } from './gen/user_pb.js';

const transport = createGrpcWebTransport({ baseUrl: 'https://api.example.com' });
const client = createPromiseClient(UserService, transport);

const user = await client.getUser({ id: 7 });   // promise-based
console.log(user.name);</code></pre>

                    <h3>Trade-offs</h3>
                    <ul>
                        <li><strong>Streaming:</strong> client streaming and bidirectional streaming are not fully supported by gRPC-Web (browsers cannot send trailer-based multi-message requests).</li>
                        <li><strong>Debugging:</strong> traffic is still binary, but gRPC-Web tooling and DevTools extensions help.</li>
                        <li><strong>When to use:</strong> when you already own gRPC backends and want typed, contract-first calls in the frontend.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Connect: A Modern Alternative</div>
                        <p>Connect (connect-es) speaks gRPC, gRPC-Web, and plain JSON over HTTP/1.1 from one client — letting frontend teams choose JSON today and gRPC-Web tomorrow without changing their service definitions.</p>
                    </div>
                `,
                takeaways: [
                    'Browsers lack HTTP/2 trailers, so native gRPC needs a proxy',
                    'gRPC-Web translates browser requests to native gRPC',
                    'Unary and server streaming work; bidi streaming does not',
                    'Connect / connect-es offer JSON + gRPC-Web from one client',
                ],
                revision: [
                    { label: 'WebSocket & SSE Academy (browser streaming)', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                    { label: 'API Design Learning (frontend APIs)', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-integration-2',
                title: 'REST Transcoding & Gateways',
                objectives: [
                    'Annotate .proto methods with google.api.http',
                    'Expose REST endpoints from gRPC services via grpc-gateway',
                    'Understand when to offer both protocols',
                    'Use transcoding to avoid maintaining two APIs',
                ],
                content: `
                    <h2>One Contract, Two Protocols</h2>
                    <p>Maintaining parallel REST and gRPC APIs doubles the work. <strong>Transcoding</strong> lets you define the API once in .proto and generate both gRPC and REST endpoints from the same file.</p>

                    <h3>Annotate with google.api.http</h3>
                    <pre><code>import "google/api/annotations.proto";

service UserService {
  rpc GetUser(GetUserRequest) returns (User) {
    option (google.api.http) = {
      get: "/v1/users/{id}"
    };
  }
  rpc CreateUser(CreateUserRequest) returns (User) {
    option (google.api.http) = {
      post: "/v1/users"
      body: "*"
    };
  }
}</code></pre>
                    <p>Field paths in the URL template (<code>{id}</code>) map request fields to path segments automatically.</p>

                    <h3>grpc-gateway</h3>
                    <pre><code># Generate the REST gateway alongside your gRPC stubs
protoc --grpc-gateway_out=. --go_out=. user.proto

# Run the gateway beside your gRPC server
gateway --grpc-server-endpoint=localhost:50051 --http-port=8080</code></pre>
                    <p>grpc-gateway generates a reverse proxy: it parses the REST request, builds the protobuf request, forwards it over gRPC, and renders the response as JSON.</p>

                    <h3>When to use it</h3>
                    <ul>
                        <li>Public HTTP clients (browsers, mobile, third parties) that need JSON.</li>
                        <li>Internal services that benefit from typed gRPC.</li>
                        <li>One source of truth for the contract.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Same Annotations Power Google APIs</div>
                        <p>The <code>google.api.http</code> annotation is the standard Google uses for its public APIs. grpc-gateway also supports path/query parameter binding, custom HTTP verbs, and response body customization.</p>
                    </div>
                `,
                takeaways: [
                    'google.api.http annotations describe the REST mapping in the .proto',
                    'grpc-gateway generates a JSON/REST proxy for your gRPC service',
                    'Transcoding keeps one contract and two protocols in sync',
                    'REST for external clients; gRPC for internal callers',
                ],
                revision: [
                    { label: 'Express.js Academy (REST patterns)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'API Design Learning (REST design)', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-integration-3',
                title: 'Reflection, grpcurl & Tooling',
                objectives: [
                    'Enable server reflection on your service',
                    'Inspect and invoke services with grpcurl',
                    'Use evans and other GUI/CLI clients',
                    'Apply linting and breaking-change checks with buf',
                ],
                content: `
                    <h2>The gRPC Toolbox</h2>
                    <p>Unlike REST, you can't just curl a gRPC endpoint — the payloads are binary and the contract lives in code. Reflection and dedicated tooling fix that.</p>

                    <h3>Server reflection</h3>
                    <p>The reflection service (<code>grpc.reflection.v1alpha.ServerReflection</code>) lets clients discover services, methods, and message schemas at runtime — no .proto files needed:</p>
                    <pre><code>// Register the reflection service
server.addService(reflectionService);

// Now clients can discover everything:
grpcurl localhost:50051 list
grpcurl localhost:50051 describe shop.OrderService</code></pre>

                    <h3>grpcurl</h3>
                    <pre><code># List services
grpcurl -plaintext localhost:50051 list

# Describe a message shape
grpcurl -plaintext localhost:50051 describe shop.Order

# Call an RPC with JSON input
grpcurl -plaintext -d '{"id":"ord-123"}' \\
  localhost:50051 shop.OrderService/GetOrder

# With TLS
grpcurl -cacert ca.pem api.internal:50051 list</code></pre>

                    <h3>More tooling</h3>
                    <ul>
                        <li><strong>evans</strong> — interactive REPL-style client for exploring and calling services.</li>
                        <li><strong>Bloom RPC</strong> — a desktop GUI client (Postman-style) for gRPC.</li>
                        <li><strong>buf</strong> — schema linting, formatting, breaking-change detection, and a registry.</li>
                        <li><strong>Postman / Insomnia</strong> — modern builds support gRPC and gRPC-Web calls.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Reflection in Prod? Careful</div>
                        <p>Reflection is a debugging superpower and a mild information leak. Consider enabling it in dev/QA and disabling (or auth-protecting) it in production.</p>
                    </div>
                `,
                takeaways: [
                    'Reflection lets clients discover services and schemas at runtime',
                    'grpcurl calls and inspects gRPC endpoints from the CLI',
                    'evans, Bloom RPC, and Postman offer richer interactive clients',
                    'buf enforces schema quality: linting, formatting, breaking checks',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator (interactive practice)', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'System Design Academy (tooling)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-grpc-integration-1',
                question: 'Why can browsers not use native gRPC directly?',
                options: [
                    'Browsers lack the HTTP/2 trailer support that gRPC needs',
                    'Browsers cannot parse binary data at all',
                    'gRPC requires UDP, which browsers block',
                    'Browsers do not support the POST method',
                ],
                correct: 0,
            },
            {
                id: 'q-grpc-integration-2',
                question: 'What does grpc-gateway generate from annotated .proto files?',
                options: [
                    'A database schema',
                    'A REST/JSON reverse proxy for your gRPC service',
                    'A Kubernetes manifest',
                    'A browser extension',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-integration-3',
                question: 'Which annotation maps an RPC method to a REST route?',
                options: [
                    'google.protobuf.http',
                    'google.api.http',
                    'grpc.gateway.route',
                    'rest.api.mapping',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-integration-4',
                question: 'What enables grpcurl to call a service without .proto files?',
                options: [
                    'A database connection',
                    'Server reflection',
                    'HTTP/1.1 fallback',
                    'Base64 encoding',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'grpc-wire',
        title: 'Protobuf Wire Format & Performance',
        lessons: [
            {
                id: 'grpc-wire-1',
                title: 'Varints & Wire Types',
                objectives: [
                    'Decode the field tag structure (field_number << 3 | wire_type)',
                    'Explain varint encoding for integers',
                    'Map the five protobuf wire types to field kinds',
                    'Read raw protobuf bytes by hand',
                ],
                content: `
                    <h2>The Protobuf Wire Format</h2>
                    <p>Protobuf's smallness comes from its wire format. Every field is encoded as a <strong>tag</strong> followed by a <strong>value</strong>. The tag is one varint: <code>(field_number &lt;&lt; 3) | wire_type</code>.</p>

                    <h3>Wire types</h3>
                    <pre><code>0  Varint            int32, int64, uint32, bool, enum
1  64-bit            fixed64, double, sfixed64
2  Length-delimited  string, bytes, embedded messages,
                     packed repeated fields
5  32-bit            fixed32, float, sfixed32</code></pre>

                    <h3>Varints: variable-length integers</h3>
                    <p>Small integers encode in one byte; big ones use more. Each varint byte holds 7 bits, and the top bit says "more bytes follow":</p>
                    <pre><code>300  =  0b100101100  (9 bits)

byte 1:  0101100 | 1  = 0xAC   (continuation bit set)
byte 2:  0000010       = 0x02
Result:  AC 02</code></pre>

                    <h3>Reading a message by hand</h3>
                    <pre><code>// message Example { int32 count = 1; }  with count = 300
08 AC 02

08  = (1 << 3) | 0   -> field 1, wire type 0 (varint)
AC 02                -> varint 300</code></pre>

                    <div class="callout">
                        <div class="callout-title">Why So Small?</div>
                        <p>JSON spells out names like "quantity" for every field. Protobuf sends just the field number — a single byte for fields 1-15. That's the whole trick behind its size advantage.</p>
                    </div>
                `,
                takeaways: [
                    'Every field is tag + value on the wire',
                    'Tag = (field_number << 3) | wire_type, itself a varint',
                    'Varints use 7 bits per byte with a continuation bit',
                    'Fields 1-15 get one-byte tags, keeping payloads tiny',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator (inspect wire bytes)', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'Node.js Academy (buffers & bytes)', url: '/pages/nodejs-learning/nodejs-learning.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-wire-2',
                title: 'ZigZag, Packed Fields & Encoding Tricks',
                objectives: [
                    'Use sint32/sint64 for compact negative integers',
                    'Explain ZigZag encoding',
                    'Understand packed repeated fields',
                    'Optimize schemas for smaller messages',
                ],
                content: `
                    <h2>Encoding Tricks That Save Bytes</h2>
                    <p>Three details make a big difference in payload size: how negatives are encoded, how lists are packed, and how defaults are skipped.</p>

                    <h3>ZigZag for negatives</h3>
                    <p><code>int32</code> encodes a negative number as a 10-byte varint (sign-extended 64 bits). <code>sint32/sint64</code> use <strong>ZigZag</strong>, which maps -1→1, 1→2, -2→3, 2→4:</p>
                    <pre><code>// ZigZag:  n -> (n << 1) ^ (n >> 31)
-1  ->  1    (one byte)
-2  ->  3    (one byte)
 2  ->  4    (one byte)</code></pre>
                    <p>Prefer <code>sint32/sint64</code> anywhere negatives are common (deltas, offsets, balances).</p>

                    <h3>Packed repeated fields</h3>
                    <p>proto3 packs repeated scalar fields by default: instead of repeating the tag for every element, it sends one length-delimited blob containing all values back to back:</p>
                    <pre><code>// repeated int32 scores = 1;  ->  scores = [3, 270, 86942]
// Unpacked:  08 03  08 8E 02  08 9E A6 05
// Packed:    0A 06  03 8E 02 9E A6 05        (single tag, one length)</code></pre>

                    <h3>Defaults are skipped</h3>
                    <p>Fields holding their default value (0, "", false) are simply <strong>omitted</strong> from the message. Unset and default look identical to the decoder — that's the trade-off you make when you choose <code>optional</code>.</p>

                    <div class="callout">
                        <div class="callout-title">Design for Small Payloads</div>
                        <p>Use enums instead of repeated strings, keep hot fields in the 1-15 range, prefer <code>sint</code> for signed data, and let proto3 pack and skip defaults for you. Small wins compound at millions of RPCs.</p>
                    </div>
                `,
                takeaways: [
                    'sint32/sint64 use ZigZag for compact negative integers',
                    'proto3 packs repeated scalar fields automatically',
                    'Default values are omitted from the wire',
                    'Enums over strings + low field numbers = smaller messages',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator (byte-level comparison)', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'System Design Academy (data modeling)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-wire-3',
                title: 'Framing, Compression & Payload Limits',
                objectives: [
                    'Explain the 5-byte gRPC frame prefix',
                    'Enable gzip compression for large payloads',
                    'Manage message size limits',
                    'Decide when compression pays off',
                ],
                content: `
                    <h2>Framing, Compression & Limits</h2>
                    <p>Protobuf encodes the message; gRPC <strong>frames</strong> it for the HTTP/2 stream. Each message gets a 5-byte prefix so the receiver knows where it ends.</p>

                    <h3>The gRPC frame</h3>
                    <pre><code>+--------+------------------+-------------------+
| 0x00   | length (4 bytes) | protobuf payload  |
| flags  | big-endian       | (N bytes)         |
+--------+------------------+-------------------+</code></pre>
                    <ul>
                        <li><strong>Byte 0</strong> — compressed flag (1 = compressed, 0 = plain).</li>
                        <li><strong>Bytes 1-4</strong> — payload length in bytes, big-endian.</li>
                        <li><strong>Rest</strong> — the serialized protobuf message.</li>
                    </ul>

                    <h3>Compression</h3>
                    <pre><code>// Client: compress every outgoing call (Node.js)
const client = new GreeterClient(address, credentials, {
  'grpc.default_compression_algorithm': grpc.compression.gzip,
});

// Or per call
client.sayHello(req, { compression: grpc.compression.gzip }, cb);</code></pre>
                    <p>gzip works best on text-heavy payloads. Binary data and tiny messages compress poorly — and compression costs CPU. Measure before enabling it globally.</p>

                    <h3>Message size limits</h3>
                    <pre><code>// Server: raise the default 4MB ceiling
server = new grpc.Server({
  'grpc.max_send_message_length': 16 * 1024 * 1024,   // 16 MB
  'grpc.max_receive_message_length': 16 * 1024 * 1024,
});</code></pre>
                    <p>Large messages defeat the whole point of gRPC. Prefer streaming, pagination, or chunked uploads for anything above a few megabytes.</p>

                    <div class="callout">
                        <div class="callout-title">Respect the Pipeline</div>
                        <p>Frame → compress → flow control → multiplex. Each layer has a job. Understanding the pipeline helps you reason about latency, memory, and why big payloads hurt.</p>
                    </div>
                `,
                takeaways: [
                    'Every gRPC message has a 5-byte framing prefix',
                    'gzip compresses text-heavy payloads; binary payloads barely gain',
                    'Default message limit is 4MB; raise it only when necessary',
                    'Prefer streaming over oversized single messages',
                ],
                revision: [
                    { label: 'gRPC & HTTP/2 Simulator (framing demo)', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'WebSocket & SSE Academy (binary framing)', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-grpc-wire-1',
                question: 'A field tag is (field_number << 3) | wire_type. What is the tag byte for field 5 with wire type 0?',
                options: [
                    '0x28',
                    '0x50',
                    '0x05',
                    '0x13',
                ],
                correct: 0,
            },
            {
                id: 'q-grpc-wire-2',
                question: 'Which integer types use ZigZag encoding?',
                options: [
                    'int32 and int64',
                    'sint32 and sint64',
                    'uint32 and uint64',
                    'fixed32 and fixed64',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-wire-3',
                question: 'How many bytes make up the gRPC message framing prefix?',
                options: [
                    '2',
                    '4',
                    '5',
                    '8',
                ],
                correct: 2,
            },
            {
                id: 'q-grpc-wire-4',
                question: 'What does a varint use to indicate that more bytes follow?',
                options: [
                    'The low bit of each byte',
                    'The high bit (0x80) of each byte',
                    'A special escape byte',
                    'A length prefix',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'grpc-k8s',
        title: 'gRPC on Kubernetes & Service Meshes',
        lessons: [
            {
                id: 'grpc-k8s-1',
                title: 'Deploying gRPC Services on Kubernetes',
                objectives: [
                    'Run gRPC servers as replicated Deployments',
                    'Use headless Services for client-side load balancing',
                    'Wire gRPC health probes for liveness and readiness',
                    'Configure name resolution to the cluster DNS',
                ],
                content: `
                    <h2>gRPC Meets Kubernetes</h2>
                    <p>Kubernetes is the default home for gRPC services. Getting the deployment details right keeps traffic flowing to healthy replicas.</p>

                    <h3>Deployment + headless Service</h3>
                    <pre><code># Headless service: no ClusterIP, DNS lists every pod
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  clusterIP: None
  selector:
    app: order
  ports:
    - port: 50051
      targetPort: 50051
      name: grpc</code></pre>
                    <p>A headless service lets the client dial <code>dns:///order-service.default.svc.cluster.local:50051</code> and get back all pod IPs for round-robin balancing.</p>

                    <h3>gRPC health probes</h3>
                    <pre><code># Use grpc_health_probe for real liveness checks
livenessProbe:
  exec:
    command: ["/grpc_health_probe", "-addr=:50051"]
readinessProbe:
  exec:
    command: ["/grpc_health_probe", "-addr=:50051"]</code></pre>
                    <p>The probe calls <code>grpc.health.v1.Health/Check</code>. Only healthy pods receive traffic; dead pods are restarted.</p>

                    <h3>Balancing choice</h3>
                    <ul>
                        <li><strong>Client-side</strong> — headless service + round_robin policy in the client (good for many small services).</li>
                        <li><strong>Server-side</strong> — a regular Service in front of a proxy (Envoy) or an ingress that terminates and load-balances.</li>
                        <li><strong>HTTP/2 note</strong> — gRPC multiplexes over long-lived connections, so keep channels reused and keepalives tuned.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Probes Beat Heartbeats</div>
                        <p>Readiness gates drain a pod before terminating it, so in-flight calls finish gracefully during deploys. Combine readiness probes with the health service for zero-downtime rollouts.</p>
                    </div>
                `,
                takeaways: [
                    'Headless Services expose pod IPs for client-side gRPC balancing',
                    'grpc_health_probe drives liveness and readiness checks',
                    'Prefer client-side round_robin or a proxy for distribution',
                    'Health-based readiness enables zero-downtime deploys',
                ],
                revision: [
                    { label: 'System Design Academy (scaling services)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-k8s-2',
                title: 'Service Meshes: Envoy, Linkerd & Istio',
                objectives: [
                    'Explain the service mesh sidecar model',
                    'Get automatic mTLS between services',
                    'Apply mesh-level retries, timeouts, and traffic shifting',
                    'Recognize when a mesh is worth the complexity',
                ],
                content: `
                    <h2>Service Meshes</h2>
                    <p>A <strong>service mesh</strong> injects a sidecar proxy (usually Envoy) next to every pod. All gRPC traffic flows through the sidecars, which handle security and traffic policy centrally.</p>

                    <h3>How it works</h3>
                    <pre><code>Pod A  ── sidecar ──┐      ┌── sidecar ── Pod B
                     ├──────┤   (mTLS between sidecars)
                     └──────┘</code></pre>
                    <p>Applications don't change. gRPC clients still dial a service address; the sidecar transparently intercepts the connection.</p>

                    <h3>What the mesh adds</h3>
                    <ul>
                        <li><strong>Automatic mTLS</strong> — every hop is encrypted and mutually authenticated, no app code.</li>
                        <li><strong>Traffic shifting</strong> — canary, blue-green, and percentage-based rollouts by routing weight.</li>
                        <li><strong>Resilience policy</strong> — mesh-wide retries, timeouts, and circuit breakers for gRPC calls.</li>
                        <li><strong>Observability</strong> — per-route metrics, mTLS-aware tracing, and access logs.</li>
                    </ul>

                    <h3>Choosing a mesh</h3>
                    <ul>
                        <li><strong>Linkerd</strong> — lightweight, Kubernetes-native, easy to adopt.</li>
                        <li><strong>Istio</strong> — feature-rich: traffic management, policies, gateway, multicluster.</li>
                        <li><strong>Consul / Gloo Mesh</strong> — strong for multi-platform and multicloud environments.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Complexity Budget</div>
                        <p>A mesh is infrastructure with real operational cost. Start with client-side retries + mTLS, and add a mesh when you need centralized traffic policy across many services.</p>
                    </div>
                `,
                takeaways: [
                    'A mesh injects sidecar proxies that intercept all gRPC traffic',
                    'mTLS becomes automatic and app-transparent',
                    'Canary traffic shifting and mesh retries are config, not code',
                    'Add a mesh for centralized policy; it has operational cost',
                ],
                revision: [
                    { label: 'System Design Academy (service discovery)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'gRPC & HTTP/2 Simulator (connection model)', url: '/pages/visualizers/grpc-simulator/grpc-simulator.html', tag: 'Visualizer' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-k8s-3',
                title: 'Gateways & Traffic Management',
                objectives: [
                    'Route gRPC through an API gateway',
                    'Use Envoy for gRPC, gRPC-Web, and HTTP/2',
                    'Apply traffic splitting and circuit breaking',
                    'Expose gRPC services to the outside world safely',
                ],
                content: `
                    <h2>Edge Gateways & Traffic Management</h2>
                    <p>Not every caller should hit your gRPC service directly. A <strong>gateway</strong> fronting the cluster handles routing, auth, and protocol translation at the edge.</p>

                    <h3>Envoy as a gRPC gateway</h3>
                    <pre><code># Envoy routes any /shop.OrderService/* call to the backend
routes:
  - match:
      prefix: /shop.OrderService/
    route:
      cluster: order_service

clusters:
  - name: order_service
    type: STRICT_DNS
    http2_protocol_options: {}
    lb_policy: ROUND_ROBIN
    connect_timeout: 5s</code></pre>
                    <p>Envoy natively understands HTTP/2 and gRPC framing — including trailers, gRPC-Web translation, and retry policies.</p>

                    <h3>What a gateway provides</h3>
                    <ul>
                        <li><strong>Protocol translation</strong> — gRPC-Web in, gRPC out; REST/JSON via transcoding annotations.</li>
                        <li><strong>Auth & rate limiting</strong> — validate tokens and quotas before the backend sees traffic.</li>
                        <li><strong>Traffic splitting</strong> — route a percentage of gRPC calls to a canary version.</li>
                        <li><strong>Circuit breaking</strong> — trip the breaker when a backend is failing.</li>
                    </ul>

                    <h3>Exposing to clients</h3>
                    <p>For browser and mobile clients, expose <strong>gRPC-Web</strong> or <strong>REST transcoding</strong> through the gateway and keep native gRPC internal. Combine the gateway with mTLS so only authorized callers reach the mesh.</p>

                    <div class="callout">
                        <div class="callout-title">One Edge, Many Protocols</div>
                        <p>With transcoding annotations and gRPC-Web enabled, a single gateway serves native gRPC, gRPC-Web, and JSON REST from one service definition — no separate API code.</p>
                    </div>
                `,
                takeaways: [
                    'Gateways front gRPC with routing, auth, and rate limiting',
                    'Envoy natively proxies gRPC, gRPC-Web, and transcoded REST',
                    'Traffic splitting enables canary rollouts of gRPC versions',
                    'Keep native gRPC internal; expose gRPC-Web or REST at the edge',
                ],
                revision: [
                    { label: 'API Design Learning (gateway patterns)', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'Express.js Academy (middleware)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-grpc-k8s-1',
                question: 'Why use a headless Service (clusterIP: None) for gRPC?',
                options: [
                    'It disables encryption for speed',
                    'DNS returns every pod IP so clients can round-robin',
                    'It auto-scales the deployment',
                    'It bypasses the kube-proxy entirely',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-k8s-2',
                question: 'What does grpc_health_probe check?',
                options: [
                    'The CPU usage of the pod',
                    'grpc.health.v1.Health/Check on the service',
                    'The TLS certificate expiry',
                    'The number of open connections',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-k8s-3',
                question: 'In a service mesh, where does mTLS get applied?',
                options: [
                    'In the application business logic',
                    'Between the sidecar proxies of each service',
                    'At the client stub only',
                    'It replaces TLS entirely',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-k8s-4',
                question: 'Which proxy natively understands gRPC framing and trailers?',
                options: [
                    'nginx (HTTP/1.1 only)',
                    'Envoy',
                    'HAProxy (default config)',
                    'A plain TCP load balancer',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'grpc-testing',
        title: 'Testing gRPC Services',
        lessons: [
            {
                id: 'grpc-testing-1',
                title: 'Unit Testing Handlers & Interceptors',
                objectives: [
                    'Test server handlers without a network',
                    'Build fake call and response objects',
                    'Test client interceptors in isolation',
                    'Mock dependencies injected into handlers',
                ],
                content: `
                    <h2>Unit Testing gRPC Handlers</h2>
                    <p>Handlers are just functions — you can call them directly with fake request objects, no server or network needed.</p>

                    <h3>Testing a unary handler</h3>
                    <pre><code>function getUser(call, callback) {
  const user = db.get(call.request.id);
  if (!user) return callback(new Error('missing'), null);
  callback(null, user);
}

// Test: no real server required
const call = { request: { id: 7 } };
getUser(call, (err, reply) => {
  assert.equal(err, null);
  assert.equal(reply.name, 'Alice');
});</code></pre>

                    <h3>Streaming handlers need fake streams</h3>
                    <p>Pass a stub stream object implementing <code>write</code>, <code>end</code>, and <code>on</code>:</p>
                    <pre><code>const written = [];
const fakeCall = {
  request: { symbols: ['AAPL'] },
  on(event, cb) { if (event === 'cancelled') this.cancel = cb; },
  write(msg) { written.push(msg); },
  end() {},
};

streamPrices(fakeCall);   // assert written eventually grows</code></pre>

                    <h3>Testing interceptors</h3>
                    <p>Interceptors wrap a next() call — test them by capturing what they pass down:</p>
                    <pre><code>const calls = [];
function next(req, res) { calls.push({ req, res }); }
authzInterceptor(request, response, next);
assert.equal(calls[0].req.metadata, ...);  // token attached, etc.</code></pre>

                    <div class="callout">
                        <div class="callout-title">Pure Logic, Fast Tests</div>
                        <p>Keep handlers thin and dependency-inject the DB, cache, and remote clients. Then unit tests run in milliseconds with full control over failures and edge cases.</p>
                    </div>
                `,
                takeaways: [
                    'Unary handlers are testable with plain fake call objects',
                    'Streaming handlers need a small fake stream object',
                    'Interceptors are tested by wrapping a capturing next()',
                    'Dependency-inject everything a handler touches',
                ],
                revision: [
                    { label: 'Express.js Academy (testing patterns)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-testing-2',
                title: 'Integration & Contract Testing',
                objectives: [
                    'Start a real server on an ephemeral port for tests',
                    'Spin up dependencies with Testcontainers',
                    'Do contract testing with golden fixtures and buf',
                    'Exercise real streaming over the wire',
                ],
                content: `
                    <h2>Integration & Contract Testing</h2>
                    <p>Unit tests prove logic; integration tests prove the wire. Start a real server on an ephemeral port, connect with the generated client, and send real bytes.</p>

                    <h3>Real server, real client</h3>
                    <pre><code>const server = new grpc.Server();
server.addService(OrderService.service, handlers);
await server.bindAsync('127.0.0.1:0', insecure, () => {});
const port = server.getPort();   // kernel-assigned ephemeral port

const client = new OrderServiceClient(
  '127.0.0.1:' + port, insecure
);
const order = await client.createOrder({ id: 'x' });</code></pre>

                    <h3>External dependencies with Testcontainers</h3>
                    <p>For Postgres, Redis, Kafka, etc., start real containers in tests:</p>
                    <pre><code>const pg = await new PostgreSqlContainer('postgres:16').start();
process.env.DATABASE_URL = pg.getConnectionUri();
// now run your service integration tests against real infra</code></pre>

                    <h3>Contract testing</h3>
                    <ul>
                        <li><strong>Golden fixtures</strong> — serialize known messages and assert exact bytes to freeze the wire format.</li>
                        <li><strong>buf lint</strong> — enforce naming and style conventions across the schema.</li>
                        <li><strong>buf breaking</strong> — fail on incompatible schema changes.</li>
                        <li><strong>Consumer-driven tests</strong> — both sides verify against the shared .proto contract.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Test Streaming End to End</div>
                        <p>Streaming bugs (backpressure, cancellation, ordering) only surface over a real connection. Write at least one integration test per streaming shape with real event flow.</p>
                    </div>
                `,
                takeaways: [
                    'Bind a test server to port 0 for ephemeral ports',
                    'Testcontainers bring real databases and brokers into tests',
                    'Golden fixtures freeze the wire format',
                    'buf lint + buf breaking keep the contract healthy in CI',
                ],
                revision: [
                    { label: 'Node.js Academy (integration testing)', url: '/pages/nodejs-learning/nodejs-learning.html', tag: 'Related' },
                    { label: 'System Design Academy (contracts)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-testing-3',
                title: 'Load Testing & Resilience Checks',
                objectives: [
                    'Benchmark gRPC endpoints with ghz',
                    'Measure latency, throughput, and error rates',
                    'Test deadline and cancellation behavior',
                    'Verify retry and circuit-breaker behavior under load',
                ],
                content: `
                    <h2>Load & Resilience Testing</h2>
                    <p>Before you claim your service is fast, prove it. Load testing gRPC needs a generator that speaks the binary protocol — <strong>ghz</strong> is the standard tool.</p>

                    <h3>Benchmark with ghz</h3>
                    <pre><code># 10k requests, 50 concurrent workers
ghz --insecure \\
  --proto order.proto \\
  --call shop.OrderService/GetOrder \\
  -d '{"id":"ord-123"}' \\
  -n 10000 -c 50 \\
  localhost:50051

# Output: count, qps, p50/p95/p99, and error summary</code></pre>
                    <p>Watch for throughput cliffs and latency spikes, not just averages. Percentiles (p95/p99) expose the tail your users feel.</p>

                    <h3>Resilience checks</h3>
                    <ul>
                        <li><strong>Deadline tests</strong> — slow the handler, confirm clients get DEADLINE_EXCEEDED and servers clean up on cancellation.</li>
                        <li><strong>Retry tests</strong> — kill one replica, verify the client retries on UNAVAILABLE and succeeds.</li>
                        <li><strong>Streaming interruption</strong> — drop the connection mid-stream; assert both sides detect it.</li>
                        <li><strong>Backpressure</strong> — a slow consumer must eventually throttle the producer without OOM.</li>
                    </ul>

                    <h3>Serialization benchmarks</h3>
                    <p>Benchmark protobuf encode/decode against JSON for your real messages. Protobuf usually wins on size and decode speed — but verify on your data, on your hardware.</p>

                    <div class="callout">
                        <div class="callout-title">Load Test Like Production</div>
                        <p>Test with production-shaped payloads, real CPU/memory limits (container limits!), and realistic client concurrency. Otherwise the results lie.</p>
                    </div>
                `,
                takeaways: [
                    'ghz generates gRPC load with configurable concurrency',
                    'Watch p95/p99 percentiles, not just averages',
                    'Test deadlines, retries, and mid-stream failures explicitly',
                    'Benchmark serialization on your real message shapes',
                ],
                revision: [
                    { label: 'System Design Academy (load & performance)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'WebSocket & SSE Academy (reliability)', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-grpc-testing-1',
                question: 'How can you unit test a unary gRPC handler?',
                options: [
                    'Start a full Kubernetes cluster',
                    'Call it directly with a fake call object and callback',
                    'Reflection can test handlers automatically',
                    'Only with an HTTP client',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-testing-2',
                question: 'Why bind a test server to port 0?',
                options: [
                    'Port 0 means unencrypted',
                    'The OS assigns a free ephemeral port automatically',
                    'Port 0 is the gRPC default',
                    'It disables TLS checks',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-testing-3',
                question: 'Which tool is purpose-built for load testing gRPC endpoints?',
                options: [
                    'Apache Bench (ab)',
                    'ghz',
                    'curl',
                    'siege',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-testing-4',
                question: 'What do golden fixtures freeze?',
                options: [
                    'The exact serialized bytes of known messages',
                    'The server IP addresses',
                    'The TLS certificates',
                    'The load-test concurrency',
                ],
                correct: 0,
            },
        ],
    },
    {
        id: 'grpc-patterns',
        title: 'Advanced Patterns & Design',
        lessons: [
            {
                id: 'grpc-patterns-1',
                title: 'Streaming Design Patterns',
                objectives: [
                    'Implement fan-out and broadcast with server streaming',
                    'Make streams resumable with chunk offsets',
                    'Respect backpressure and flow control',
                    'Use heartbeats to keep idle streams alive',
                ],
                content: `
                    <h2>Designing Robust Streams</h2>
                    <p>Streams are powerful but demand care. These patterns keep long-lived streams correct under real-world conditions.</p>

                    <h3>Fan-out / broadcast</h3>
                    <p>One producer, many subscribers. The server keeps a registry of active client streams and writes each update to every subscriber:</p>
                    <pre><code>const subscribers = new Set();

function subscribe(call) {
  subscribers.add(call);
  call.on('cancelled', () => subscribers.delete(call));
}

function broadcast(event) {
  for (const call of subscribers) {
    if (!call.write(event)) {          // false = backpressure
      subscribers.delete(call);        // slow consumer, drop or buffer
    }
  }
}</code></pre>

                    <h3>Resumable streams</h3>
                    <p>For large transfers, track an offset so an interrupted stream resumes instead of restarting:</p>
                    <pre><code>message UploadChunk {
  bytes  data      = 1;
  int64  offset    = 2;   // byte offset of this chunk
  string upload_id = 3;   // client-generated ID
}
// Server stores progress per upload_id and validates offsets</code></pre>

                    <h3>Keepalive heartbeats</h3>
                    <p>Long idle streams can be killed by proxies. Send periodic ping messages (or gRPC keepalive pings) so the connection stays alive and dead peers are detected.</p>

                    <div class="callout">
                        <div class="callout-title">Respect write() Return Value</div>
                        <p><code>write()</code> returns a boolean — false means the receiver is behind and you should pause. Ignoring it is how stream-based services run out of memory.</p>
                    </div>
                `,
                takeaways: [
                    'Fan-out with a subscriber registry plus cleanup on cancel',
                    'Resumable uploads track offsets with a client upload_id',
                    'Heartbeats keep idle streams alive and detect dead peers',
                    'Honor write() backpressure or risk memory exhaustion',
                ],
                revision: [
                    { label: 'WebSocket & SSE Academy (stream patterns)', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                    { label: 'System Design Academy (backpressure)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-patterns-2',
                title: 'gRPC & Event-Driven Architecture',
                objectives: [
                    'Choose between synchronous gRPC and async messaging',
                    'Combine gRPC with Kafka/RabbitMQ',
                    'Use the transactional outbox pattern',
                    'Design async callbacks and notifications',
                ],
                content: `
                    <h2>gRPC in Event-Driven Systems</h2>
                    <p>gRPC is a <strong>request/reply</strong> protocol — perfect for synchronous calls. Event-driven flows (queues, pub/sub, eventual consistency) need different machinery.</p>

                    <h3>When to use what</h3>
                    <pre><code>gRPC (sync)          Kafka/RabbitMQ (async)
---------------      ----------------------
Needs the answer     Fire-and-forget events
Immediate result     Decoupled consumers
Low latency RPC      Durable, replayable history
Strong consistency   Eventual consistency</code></pre>

                    <h3>Combining them</h3>
                    <p>A common shape: gRPC for commands (CreateOrder → returns quickly), and a queue for events other services consume (OrderCreated, PaymentSettled):</p>
                    <pre><code>// API service: gRPC handler
async function createOrder(call, callback) {
  const order = await orders.save(call.request);
  await producer.send('orders.created', { id: order.id });
  callback(null, order);
}</code></pre>

                    <h3>The transactional outbox</h3>
                    <p>To avoid "saved to DB but event never sent", write the event to an <strong>outbox table</strong> in the same DB transaction, then a relay publishes it to the broker:</p>
                    <pre><code>BEGIN;
  INSERT INTO orders ...;
  INSERT INTO outbox (topic, payload) VALUES ('orders.created', ...);
COMMIT;
-- relay: SELECT pending, publish, mark done</code></pre>
                    <p>Now DB and events are consistent — no distributed transaction needed.</p>

                    <div class="callout">
                        <div class="callout-title">Async Reply, Not Just Async Fire</div>
                        <p>For long jobs, return immediately with a job ID (see the LRO pattern) and notify via a subscription, webhook, or a query endpoint — don't hold a gRPC call open for minutes.</p>
                    </div>
                `,
                takeaways: [
                    'gRPC for synchronous request/reply; queues for async events',
                    'Commands over gRPC, events over a broker',
                    'The outbox pattern keeps DB writes and events consistent',
                    'Return a job ID for long work; deliver results asynchronously',
                ],
                revision: [
                    { label: 'System Design Academy (message queues)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'WebSocket & SSE Academy (notifications)', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
            {
                id: 'grpc-patterns-3',
                title: 'Idempotency & Long-Running Operations',
                objectives: [
                    'Make unsafe writes idempotent with request IDs',
                    'Implement the Long-Running Operation (LRO) pattern',
                    'Expose job status and results safely',
                    'Clean up when operations are cancelled',
                ],
                content: `
                    <h2>Idempotency & Long-Running Operations</h2>
                    <p>Two patterns tame the hardest production problems: duplicate requests and minutes-long jobs.</p>

                    <h3>Idempotency keys</h3>
                    <p>A client-generated key lets the server deduplicate retries:</p>
                    <pre><code>// Client: attach a key so retries are safe
call.metadata.set('x-request-id', crypto.randomUUID());

// Server: reuse the result of a duplicate request
const existing = await cache.get(key);
if (existing) return existing;
const order = await orders.save(input);
await cache.set(key, order);</code></pre>
                    <p>Paired with retries, idempotency keys make at-least-once delivery feel like exactly-once.</p>

                    <h3>Long-Running Operation pattern</h3>
                    <p>For jobs that take minutes (video encoding, ML training), don't block a call. Return a job handle and let clients poll or subscribe:</p>
                    <pre><code>service JobService {
  rpc Start(StartRequest) returns (Operation);     // returns fast
  rpc GetOperation(GetOperationRequest) returns (Operation);
}

message Operation {
  string id = 1;
  bool done = 2;
  string status = 4;   // QUEUED | RUNNING | SUCCEEDED | FAILED
}</code></pre>
                    <p>Store operation state in a durable store, update it as work progresses, and serve it via GetOperation. This is exactly how Google's long-running APIs work.</p>

                    <h3>Cancellation cleanup</h3>
                    <p>When a client cancels, stop the work and roll back partial state:</p>
                    <pre><code>call.on('cancelled', async () => {
  await jobs.cancel(operationId);
  await cleanupPartialResources(operationId);
});</code></pre>

                    <div class="callout">
                        <div class="callout-title">Design the Cancel Path</div>
                        <p>Every long-running operation needs a defined cancel path — otherwise cancelled jobs leak resources forever. Test cancellation explicitly.</p>
                    </div>
                `,
                takeaways: [
                    'Idempotency keys make retries safe for writes',
                    'LRO returns an Operation handle; clients poll GetOperation',
                    'Persist operation state durably through the job',
                    'Define and test the cancellation cleanup path',
                ],
                revision: [
                    { label: 'System Design Academy (async tasks)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'API Design Learning (async APIs)', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'Revision Hub', url: '/pages/revision/revision.html', tag: 'Spaced Repetition' },
                ],
            },
        ],
        quiz: [
            {
                id: 'q-grpc-patterns-1',
                question: 'What does write() returning false indicate in a server stream?',
                options: [
                    'The message was rejected',
                    'Backpressure: the receiver is behind and you should pause',
                    'The stream ended',
                    'A serialization error',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-patterns-2',
                question: 'What does the transactional outbox pattern solve?',
                options: [
                    'TLS certificate rotation',
                    'Keeping DB writes and published events consistent',
                    'gRPC-Web streaming',
                    'Client load balancing',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-patterns-3',
                question: 'In the LRO pattern, what does the server return for a long-running job?',
                options: [
                    'The final result synchronously',
                    'An Operation handle to poll for status',
                    'A WebSocket URL',
                    'Nothing until completion',
                ],
                correct: 1,
            },
            {
                id: 'q-grpc-patterns-4',
                question: 'What makes a retry safe for a non-idempotent write?',
                options: [
                    'Increasing the deadline',
                    'An idempotency key that lets the server deduplicate',
                    'Disabling compression',
                    'A smaller payload',
                ],
                correct: 1,
            },
        ],
    },
];

/* ─── State ─── */
let state = {
    activeModuleId: curriculum[0].id,
    activeLessonId: curriculum[0].lessons[0].id,
    activeTab: 'lesson',
    completedItems: [],
    quizAnswers: {},
    quizSubmitted: false,
};

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

    // Playground elements
    DOM.protoEditor = document.getElementById('proto-editor');
    DOM.encodeMsgBtn = document.getElementById('encode-msg-btn');
    DOM.clearPgBtn = document.getElementById('clear-pg-btn');
    DOM.eventLog = document.getElementById('event-log');
    DOM.eventCount = document.getElementById('event-count');
    DOM.showWireFormat = document.getElementById('show-wire-format');
    DOM.showStreams = document.getElementById('show-streams');
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
    let completed = 0;
    curriculum.forEach((mod) => {
        total += mod.lessons.length;
        if (mod.quiz && mod.quiz.length > 0) total++;
    });
    completed = state.completedItems.length;
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

    const eli5Html = window.eli5Toggle && window.eli5GrpcData ? window.eli5GrpcData[lesson.id] || '' : '';

    DOM.lessonContent.innerHTML = window.eli5Toggle
        ? window.eli5Toggle.wrapContent(lesson.content, eli5Html)
        : lesson.content;

    if (window.eli5Toggle) {
        window.eli5Toggle.initToggle('grpc', DOM.lessonContent);
    }
    if (window.copyCode) {
        window.copyCode.init(DOM.lessonContent);
    }

    // Append objectives / takeaways / revision AFTER the toggle wraps content,
    // inside the technical container so they stay with the lesson.
    const technical = DOM.lessonContent.querySelector('[data-technical]');
    if (technical) {
        technical.insertAdjacentHTML('beforeend', objectivesHtml + takeawaysHtml + revisionHtml);
    }

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

/* ─── Playground (Protobuf encoder + simulated HTTP/2 call) ─── */
let eventCount = 0;
let streamCounter = 0;

const SAMPLE_PROTO = `syntax = "proto3";

package shop;

// ---- Order message definition (field numbers become wire tags) ----
// message Order {
//   string  id       = 1;
//   int32   quantity = 2;
//   double  price    = 3;
//   bool    priority = 4;
//   repeated string tags = 5;
// }
// RPC: shop.OrderService/CreateOrder(Order) returns (Order)

// ---- Edit the values below, then click Encode ----
string id = "ord-123";
int32 quantity = 4;
double price = 19.99;
bool priority = true;
repeated string tags = "express, fragile";`;

function formatTimestamp() {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function addLogEntry(badge, text, data) {
    const placeholder = DOM.eventLog.querySelector('.output-placeholder');
    if (placeholder) placeholder.remove();

    eventCount++;
    DOM.eventCount.textContent = eventCount + ' events';

    const entry = document.createElement('div');
    entry.className = 'event-entry';
    entry.innerHTML =
        `<span class="event-time">${formatTimestamp()}</span>` +
        `<span class="event-badge event-badge--${badge}">${badge}</span>` +
        `<span class="event-detail">${escHtml(text)}</span>` +
        (data ? `<span class="event-data">${escHtml(data)}</span>` : '');
    DOM.eventLog.appendChild(entry);
    DOM.eventLog.scrollTop = DOM.eventLog.scrollHeight;
}

/* Tiny protobuf wire-format encoder for the playground */
function encodeVarint(value) {
    const bytes = [];
    let v = BigInt(Math.trunc(value));
    if (v < 0n) v = v + 0x10000000000000000n; // two's complement 64-bit
    while (v >= 0x80n) {
        bytes.push(Number(v & 0x7fn) | 0x80);
        v >>= 7n;
    }
    bytes.push(Number(v));
    return bytes;
}

function encodeTag(fieldNumber, wireType) {
    return encodeVarint((fieldNumber << 3) | wireType);
}

function encodeString(s) {
    return new TextEncoder().encode(s);
}

function toHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
}

function buildOrderMessage() {
    const text = DOM.protoEditor ? DOM.protoEditor.textContent.trim() : '';
    if (!text) return null;

    // Parse simple "field = value;" lines from the editor.
    const fields = { quantity: null, price: null, priority: false, tags: [] };
    const tagMap = { id: 1, quantity: 2, price: 3, priority: 4, tags: 5 };
    const seen = new Set();
    const lineRe = /^\s*(?:string|int32|double|bool|repeated\s+string)\s+(\w+)\s*=\s*([^;]+);/gm;

    let match;
    while ((match = lineRe.exec(text)) !== null) {
        const name = match[1];
        const raw = match[2].trim().replace(/^["']|["']$/g, '');
        if (!tagMap.hasOwnProperty(name)) continue;
        seen.add(name);
        if (name === 'id') fields.id = raw;
        else if (name === 'quantity') fields.quantity = parseInt(raw, 10) || 0;
        else if (name === 'price') fields.price = parseFloat(raw) || 0;
        else if (name === 'priority') fields.priority = raw === 'true';
        else if (name === 'tags') fields.tags = raw.split(',').map((t) => t.trim()).filter(Boolean);
    }

    if (!seen.size) return null;
    return { fields, seen };
}

function serializeOrder(fields) {
    const bytes = [];
    // id (field 1, string / wire type 2)
    if (fields.id !== undefined && fields.id !== '') {
        const data = encodeString(fields.id);
        bytes.push(...encodeTag(1, 2), ...encodeVarint(data.length), ...data);
    }
    // quantity (field 2, int32 / wire type 0)
    if (fields.quantity !== null) {
        bytes.push(...encodeTag(2, 0), ...encodeVarint(fields.quantity));
    }
    // price (field 3, double / wire type 1, little-endian)
    if (fields.price !== null) {
        bytes.push(...encodeTag(3, 1));
        const buf = new ArrayBuffer(8);
        new DataView(buf).setFloat64(0, fields.price, true);
        bytes.push(...new Uint8Array(buf));
    }
    // priority (field 4, bool / wire type 0)
    if (fields.priority) {
        bytes.push(...encodeTag(4, 0), ...encodeVarint(1));
    }
    // tags (field 5, repeated string / wire type 2)
    fields.tags.forEach((t) => {
        const data = encodeString(t);
        bytes.push(...encodeTag(5, 2), ...encodeVarint(data.length), ...data);
    });
    return bytes;
}

function buildGrpcFrame(payloadBytes) {
    // 1 byte flag + 4 bytes big-endian length + payload
    const len = payloadBytes.length;
    const frame = [0x00, (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff, ...payloadBytes];
    return frame;
}

function simulateHttp2Call(frameHex) {
    streamCounter += 2;
    const streamId = streamCounter; // keep it even (client-initiated)

    if (DOM.showStreams && DOM.showStreams.checked) {
        addLogEntry(
            'state',
            `OPEN stream ${streamId} on shared HTTP/2 connection`,
            'One TCP connection multiplexes many concurrent RPCs'
        );
        addLogEntry(
            'sent',
            `HEADERS :method=POST  :path=/shop.OrderService/CreateOrder`,
            'content-type: application/grpc+proto\ngrpc-timeout: 5S\nte: trailers'
        );
        addLogEntry(
            'sent',
            `DATA (stream ${streamId}) — gRPC message frame`,
            frameHex
        );
        addLogEntry(
            'sent',
            'END_STREAM — client finished sending',
            ''
        );
    }

    if (DOM.showWireFormat && DOM.showWireFormat.checked) {
        addLogEntry(
            'encode',
            'Protobuf wire-format bytes (field tags + values)',
            frameHex
        );
    }

    setTimeout(() => {
        if (DOM.showStreams && DOM.showStreams.checked) {
            addLogEntry(
                'received',
                `HEADERS (stream ${streamId}) :status=200`,
                'content-type: application/grpc+proto'
            );
            addLogEntry(
                'received',
                `DATA — server reply (same Order message, echoed)`,
                frameHex
            );
            addLogEntry(
                'received',
                `TRAILERS grpc-status: 0  grpc-message: "OK"`,
                'Call completed successfully'
            );
            addLogEntry(
                'state',
                `CLOSE stream ${streamId}`,
                'Stream released back to the connection pool'
            );
        }
    }, 700);
}

function runEncode() {
    const result = buildOrderMessage();
    if (!result) {
        addLogEntry(
            'error',
            'Could not parse the editor.',
            'Tip: keep the sample format — e.g.  id = "abc";  quantity = 3;  tags = "a, b";'
        );
        return;
    }
    const { fields, seen } = result;

    addLogEntry(
        'info',
        'Encoding Order message with protobuf',
        Object.keys(seen).map((k) => `${k} = ${JSON.stringify(fields[k])}`).join('\n')
    );

    const payload = serializeOrder(fields);
    const frame = buildGrpcFrame(payload);

    const payloadHex = toHex(payload);
    const frameHex = toHex(frame);
    const compactHex = payloadHex
        .split(' ')
        .map((b) => b.slice(0, 1) === '0' && b.length === 2 ? b.slice(1) : b)
        .join(' ');

    addLogEntry(
        'encode',
        `Payload: ${payload.length} bytes`,
        payloadHex
    );
    addLogEntry(
        'encode',
        `Framed message (${frame.length} bytes) = 0x00 + 4-byte length + payload`,
        frameHex
    );

    simulateHttp2Call(frameHex);
    void compactHex;
}

function setupPlayground() {
    DOM.protoEditor.textContent = SAMPLE_PROTO;
    DOM.encodeMsgBtn.addEventListener('click', runEncode);
    DOM.clearPgBtn.addEventListener('click', () => {
        DOM.eventLog.innerHTML =
            '<div class="output-placeholder"><i class="fa-solid fa-plug"></i><p>Event log cleared. Edit the message and click <strong>Encode</strong> to start a new call.</p></div>';
        eventCount = 0;
        DOM.eventCount.textContent = '0 events';
    });
}

function renderPlayground() {
    if (!DOM.protoEditor.textContent.trim()) {
        DOM.protoEditor.textContent = SAMPLE_PROTO;
    }
    DOM.activeModuleTitle.textContent = getActiveModule().title + ' — Playground';
}

/* ─── Quiz ─── */
function renderQuiz() {
    const mod = getActiveModule();
    const quizId = mod.id + '-quiz';
    const isCompleted = isItemComplete(quizId);

    if (!mod.quiz || mod.quiz.length === 0) {
        DOM.quizContainer.innerHTML = `
            <div class="quiz-container" style="text-align:center; padding:3rem;">
                <i class="fa-solid fa-clipboard-check" style="font-size:3rem; color:#244c5a; opacity:0.5; margin-bottom:1rem;"></i>
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
