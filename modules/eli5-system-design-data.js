const eli5SystemDesignData = {
  // ─── Module 1: Foundations ───
  'sd-m1-l1': `
    <p><strong>Load balancers</strong> are like the <strong>receptionist at a busy office</strong>. When many visitors arrive, the receptionist directs each person to a different available representative so no single person gets overwhelmed.</p>
    <p>If you have 3 representatives and 9 visitors arrive, the receptionist sends 3 to each rep. If one rep is slower, the receptionist sends fewer people their way. That's <strong>intelligent routing</strong>!</p>
    <p>Common strategies: <strong>Round robin</strong> (take turns), <strong>Least connections</strong> (go to the least busy server), <strong>IP hash</strong> (same visitor always goes to the same server — like having a dedicated personal assistant).</p>
    <p>Without load balancers, one server might get 1000 requests while another gets 5. That's like everyone lining up at one ticket counter while the other counters sit empty!</p>
  `,
  'sd-m1-l2': `
    <p><strong>DNS (Domain Name System)</strong> is like the <strong>phonebook of the internet</strong>. When you type "google.com", your computer doesn't know where that is — it needs to look up the IP address (like a phone number) for Google's servers.</p>
    <p>Imagine calling Information to get a restaurant's phone number. You say "Joe's Pizza", they say "555-1234". DNS does the same thing: "google.com" → "142.250.80.46".</p>
    <p>DNS uses a <strong>hierarchy</strong>: Your computer asks a local server, who asks a regional server, who asks the root server, who directs to the right ".com" server, who finally knows Google's address. Like asking a friend → who asks their parents → who asks the town hall → who has the master directory!</p>
    <p><strong>CDN (Content Delivery Network)</strong> is like having <strong>pizza delivery stores in every neighborhood</strong>. Instead of one central kitchen making all pizzas (slow for far-away customers), each neighborhood has its own kitchen with popular pizzas ready to go!</p>
    <p>CDNs store copies of your website's static files (images, videos, CSS) in servers all around the world. When someone in Japan visits your site, they get files from a server in Tokyo, not from your main server in New York. Much faster!</p>
  `,
  'sd-m1-l3': `
    <p><strong>Caching</strong> is like <strong>sticking a note on your fridge with your girlfriend's phone number</strong>, so you don't have to look through your entire contact list every time you want to text her.</p>
    <p>Instead of going to the database every single time (slow), you keep frequently accessed data in a <strong>fast temporary storage</strong> (RAM/memory) — like a <strong>nightstand drawer</strong> for things you use every day.</p>
    <p><strong>Cache types:</strong></p>
    <ul>
      <li><strong>Browser cache</strong> — Your browser saves images so the next visit loads instantly (like keeping a photo album on your coffee table).</li>
      <li><strong>CDN cache</strong> — Popular content stored closer to you geographically (like a local library branch with bestsellers).</li>
      <li><strong>Application cache (Redis/Memcached)</strong> — The app itself stores frequently queried data in memory (like a chef keeping common ingredients within arm's reach).</li>
      <li><strong>Database cache</strong> — The database keeps frequently queried results in memory (like a librarian memorizing where popular books are).</li>
    </ul>
    <p><strong>Cache invalidation</strong> is the hardest problem — ensuring old/stale data is replaced. Like realizing the note on your fridge has an ex-girlfriend's number — time to update it!</p>
  `,
  'sd-m1-l4': `
    <p><strong>Caching strategies</strong> are different <strong>plans for when to save and when to refresh</strong> cached data. Think of them like different <strong>meal prep strategies</strong>.</p>
    <ul>
      <li><strong>Cache Aside (Lazy Loading)</strong> — The app checks the cache first. If the data is there (cache hit), use it. If not (cache miss), fetch from the database and store in cache. Like checking your fridge before going to the grocery store. If you have eggs, use them. No eggs? Go buy some and put them in the fridge.</li>
      <li><strong>Write-Through</strong> — Data is written to cache AND database at the same time. Every time. Like making a photocopy of every document you file — it's always in both places. Safer but slower for writes.</li>
      <li><strong>Write-Behind (Write-Back)</strong> — Data is written to cache first, then asynchronously to the database later. Like a waiter taking your order and sending it to the kitchen in batches — faster service but risk if the waiter loses the note.</li>
      <li><strong>Cache Invalidation strategies:</strong> TTL (Time To Live — like milk expiration date), LRU (Least Recently Used — like replacing old spices you haven't used), Event-driven (refresh cache when data changes — like getting a notification when a price changes).</li>
    </ul>
    <p><strong>Cache stampede</strong> happens when a popular cache entry expires and thousands of requests all hit the database at once — like everyone rushing to the bathroom at halftime!</p>
  `,

  // ─── Module 2: Databases ───
  'sd-m2-l1': `
    <p><strong>SQL databases</strong> are like <strong>Excel spreadsheets with strict rules</strong>. Every row has the same columns, every column has a defined type, and you can't put text in a number column. They're great for <strong>structured, predictable data</strong> like bank accounts, orders, and employee records.</p>
    <p><strong>NoSQL databases</strong> are like <strong>a pile of index cards</strong> — each card can have different information written on it. Need a "favorite_color" field? Just write it on the card! No need to change every other card to have that field too.</p>
    <p><strong>When to use SQL:</strong> Banking, accounting, any system where data integrity is critical. Think of it like a <strong>formal contract</strong> — everything must be exact.</p>
    <p><strong>When to use NoSQL:</strong> Social media feeds, product catalogs, real-time analytics, IoT data. Think of it like a <strong>bulletin board</strong> — each post can be different and that's okay.</p>
    <p>Many modern systems use <strong>both</strong> (polyglot persistence) — SQL for financial transactions, NoSQL for user sessions and activity feeds. Like using both a filing cabinet AND a whiteboard!</p>
  `,
  'sd-m2-l2': `
    <p><strong>Database replication</strong> is like having <strong>backup singers for a lead singer</strong>. The lead singer (primary/master database) does all the performing (writes), while the backup singers (replica databases) copy everything and handle the less critical parts (reads).</p>
    <p>If the lead singer loses their voice (server crash), one of the backup singers can take over. The show goes on!</p>
    <p><strong>Single-leader replication</strong> — One primary handles all writes, replicas handle reads. Like one teacher lecturing to many students taking notes.</p>
    <p><strong>Multi-leader replication</strong> — Multiple primaries can handle writes. Like multiple managers in different cities who all keep each other updated. Useful for global apps but tricky to handle conflicts ("you changed the price to $10 while I changed it to $12!").</p>
    <p><strong>Synchronous vs. Asynchronous replication</strong> — Sync = wait for confirmation from all replicas (safer but slower). Async = fire and forget (faster but some data might be lost if the primary crashes). Like sending a registered letter vs. a regular postcard.</p>
  `,
  'sd-m2-l3': `
    <p><strong>Database sharding</strong> is like <strong>splitting one giant phonebook into multiple small phonebooks by last name</strong>. A-K in Book 1, L-P in Book 2, Q-Z in Book 3. Now instead of one person looking through 3000 pages, three people each look through 1000 pages. Much faster!</p>
    <p><strong>Why shard?</strong> When a single database can't handle the load. Think of it like adding more checkout lanes at a supermarket when the line gets too long.</p>
    <p><strong>Sharding strategies:</strong></p>
    <ul>
      <li><strong>Range-based</strong> — Split by range: users 1-10000 on shard 1, 10001-20000 on shard 2. Simple but can cause hotspots (if most users are in the 1-10000 range).</li>
      <li><strong>Hash-based</strong> — Take user_id, hash it, mod by number of shards. Like dealing cards evenly to players. More balanced.</li>
      <li><strong>Directory-based</strong> — Keep a lookup table saying which user is on which shard. Most flexible but the lookup table can become a bottleneck.</li>
    </ul>
    <p><strong>The hard part of sharding:</strong> Cross-shard queries (finding data across multiple shards) and resharding (adding more shards later). Imagine splitting Book 1 into two books when it gets too big — you'd need to reorganize!</p>
  `,
  'sd-m2-l4': `
    <p><strong>Database indexing</strong> is like creating the <strong>index at the back of a textbook</strong>. Without it, finding "Photosynthesis" means flipping through every single page. With the index, you look up "P" → "Photosynthesis → page 142" and jump straight there!</p>
    <p>An index is a <strong>separate data structure</strong> (usually a B-tree) that maps column values to their locations. It takes extra space (like the index pages at the back of a book) and makes writes slightly slower (you have to update the index every time you add a page), but makes reads dramatically faster.</p>
    <p><strong>Trade-off:</strong> Indexes speed up reads (SELECT) but slow down writes (INSERT/UPDATE/DELETE). Like having a card catalog — amazing for finding books, but every new book requires writing a new card.</p>
    <p><strong>Types of indexes:</strong></p>
    <ul>
      <li><strong>Primary index</strong> — Automatically created on the primary key. Like the page numbers in a book.</li>
      <li><strong>Secondary index</strong> — Created on other columns you query often. Like an index of topics at the back.</li>
      <li><strong>Composite index</strong> — An index on multiple columns. Like an index sorted by "Last Name, First Name".</li>
      <li><strong>Covering index</strong> — Contains ALL the data a query needs. The database never touches the actual table! Like having all the info you need on the index page itself.</li>
    </ul>
    <p><strong>Good candidate for indexing:</strong> Columns used in WHERE, JOIN, and ORDER BY. <strong>Bad candidate:</strong> Columns with few unique values (like a boolean "is_active" column).</p>
  `,

  // ─── Module 3: CAP Theorem & PACELC ───
  'sd-m3-l1': `
    <p><strong>CAP Theorem</strong> says a distributed system can only guarantee <strong>2 out of 3</strong> properties at any time:</p>
    <ul>
      <li><strong>C — Consistency</strong>: Every user sees the same data at the same time. Like a whiteboard in a meeting — everyone sees the same thing.</li>
      <li><strong>A — Availability</strong>: Every request gets a response (even if it's "I don't know yet"). Like a 24/7 convenience store — always open even if they're out of some items.</li>
      <li><strong>P — Partition Tolerance</strong>: The system keeps working even if network connections between servers break. Like a conference call that continues even if one person's connection drops briefly.</li>
    </ul>
    <p>Think of it like a <strong>triangle with three corners</strong> — you can only be at one edge at a time:</p>
    <ul>
      <li><strong>CP (Consistency + Partition Tolerance):</strong> If the network splits, the system stops accepting writes until consistency is restored. Like saying "nobody can edit the document until we confirm everyone has the latest version." Used by banking systems and Zookeeper.</li>
      <li><strong>AP (Availability + Partition Tolerance):</strong> The system keeps accepting writes even during a network split, but different users might see different data temporarily. Like a social media post — some friends see it immediately, others see it a few seconds later. Used by social media, DNS, and many NoSQL databases.</li>
      <li><strong>CA (Consistency + Availability):</strong> Works when there's no network partition (essentially a single-node system). Traditional SQL databases.</li>
    </ul>
    <p>The big insight: In distributed systems, network partitions WILL happen. So you're really choosing between CP and AP!</p>
  `,
  'sd-m3-l2': `
    <p><strong>PACELC</strong> extends the CAP theorem with a crucial addition: <strong>"Else"</strong>. It says:</p>
    <ul>
      <li><strong>P (Partition):</strong> If the network is partitioned, trade off Consistency vs. Availability (the CAP choice).</li>
      <li><strong>E (Else):</strong> If the network is working normally (no partition), trade off Latency vs. Consistency.</li>
    </ul>
    <p>This is like the difference between <strong>emergency mode</strong> and <strong>normal operations</strong>. During a power outage (partition), you might use candles (CP — reduced service). On a normal day, you might choose between fast checkout (low latency, loosely consistent) or thorough inventory checks (high consistency, slower).</p>
    <p><strong>Examples:</strong></p>
    <ul>
      <li><strong>DynamoDB/Cassandra (PA/EL):</strong> Partition-tolerant + Available during partitions. Else (normal operation): prefer Low latency over strong consistency. Eventually consistent by default.</li>
      <li><strong>BigTable/HBase (PC/EC):</strong> Partition-tolerant + Consistent during partitions. Else (normal operation): prefer Consistency over low latency. Strongly consistent.</li>
      <li><strong>MongoDB (PA/EC):</strong> Partition-tolerant + Available during partitions. Else: prefer Consistency over low latency. Configurable!</li>
    </ul>
    <p><strong>Consistency models</strong> describe how soon different users see the same data:</p>
    <ul>
      <li><strong>Strong consistency</strong> — Everyone sees the latest write immediately. Like a shared Google Doc — everyone sees changes in real-time. Slow but safe.</li>
      <li><strong>Eventual consistency</strong> — Given enough time, all users will see the same data. Like a mailing list update — some people get the email instantly, others get it a minute later. Fast but temporarily inconsistent.</li>
      <li><strong>Read-your-writes consistency</strong> — You can always see your own writes immediately, but others might not see them yet. Like posting on your own Facebook wall — you see it right away, your friends see it eventually.</li>
    </ul>
  `,

  // ─── Module 4: Distributed Systems ───
  'sd-m4-l1': `
    <p><strong>Consensus algorithms (Raft/Paxos)</strong> are like a <strong>group of friends deciding where to eat</strong>. Everyone has an opinion, the network might be spotty, but eventually they need to agree on ONE restaurant.</p>
    <p><strong>Raft</strong> is easier to understand: There's a <strong>leader</strong> (one friend who makes the final decision) and <strong>followers</strong> (everyone else). The leader proposes a restaurant, followers confirm they heard the proposal, and once a majority confirms, the decision is made.</p>
    <p>If the leader goes silent (phone dies), followers notice and elect a new leader. Like when the group's usual decision-maker disappears, someone else steps up and says "OK, I'll pick this time."</p>
    <p><strong>Paxos</strong> is more complex but achieves the same thing. It's like a <strong>voting system with multiple rounds</strong> — first a "prepare" round ("I'm thinking of suggesting Italian, anyone object?"), then an "accept" round ("OK, Italian it is, confirm?").</p>
    <p>Both algorithms solve the same problem: getting multiple servers to agree on something, even when some servers crash or the network is slow. They're used in systems like etcd, Zookeeper, and Consul for leader election and configuration management.</p>
  `,
  'sd-m4-l2': `
    <p><strong>Gossip protocols</strong> are like <strong>office gossip</strong>. When someone hears a piece of news, they tell a few coworkers, who tell a few more, and within minutes the entire office knows. Each person only talks to a few others, but the news spreads to everyone quickly.</p>
    <p>In distributed systems, each server periodically <strong>gossips</strong> with a few random peers, sharing what it knows. Within a few rounds, every server knows everything. This is how systems like Cassandra, Redis Cluster, and Consul maintain cluster state without a central coordinator.</p>
    <p><strong>Quorum</strong> is about <strong>minimum votes needed</strong> to make a decision. In a group of 5 friends deciding on a movie, 3 votes is a quorum (majority).</p>
    <p>In databases, quorum is about read/write consistency:</p>
    <ul>
      <li><strong>Write quorum (W):</strong> Minimum number of replicas that must acknowledge a write. W=3 means "wait for 3 out of 5 replicas to confirm they saved the data."</li>
      <li><strong>Read quorum (R):</strong> Minimum number of replicas that must respond to a read. R=3 means "ask 3 replicas and use the most recent data."</li>
      <li><strong>W + R > N (total replicas)</strong> — Guarantees strong consistency because at least one replica that has the latest data will be in your read set!</li>
    </ul>
    <p>Think of it like <strong>voting in an election</strong>: You need a majority to win (W + R > N). If you have 5 judges and a write requires 3 confirmations, a read must also check at least 3 judges to be sure one of them has the latest info.</p>
  `,
  'sd-m4-l3': `
    <p><strong>Distributed system challenges</strong> are like trying to organize a group project when everyone has unreliable phones.</p>
    <ul>
      <li><strong>Network delays</strong> — Messages take unpredictable time. Some arrive instantly, some take seconds. Like texting a friend who might reply in 2 seconds or 2 hours.</li>
      <li><strong>Partial failures</strong> — Some parts of the system work while others don't. Like when your phone works but your friend's phone is dead. The rest of the group doesn't know who to blame!</li>
      <li><strong>Clock skew</strong> — Different servers have slightly different times. Server A thinks it's 10:00:01 while Server B thinks it's 10:00:02. Event ordering becomes confusing — "Did the write happen at 10:00:01 or 10:00:02?"</li>
      <li><strong>Split-brain</strong> — A network partition causes two groups of servers to each think they're the leaders. Both accept writes, leading to data conflicts. Like two people each thinking they're the team captain and giving contradictory orders.</li>
    </ul>
    <p>Solutions include <strong>timeouts</strong> (if no response in 5 seconds, assume failure), <strong>heartbeats</strong> (periodic "I'm alive" signals), <strong>leader election</strong> (Raft/Paxos), and <strong>idempotency</strong> (processing the same request twice gives the same result — like a vending machine that won't charge you twice even if you press the button twice).</p>
  `,

  // ─── Module 5: Microservices ───
  'sd-m5-l1': `
    <p><strong>Microservices</strong> is like having <strong>specialized food trucks</strong> instead of one giant restaurant. One truck makes tacos, another makes burgers, another makes ice cream. Each truck is independent — if the taco truck breaks down, the burger truck still runs, and customers still get fed.</p>
    <p>In a <strong>monolithic</strong> application, everything is in one big codebase. Like a giant cafeteria that serves everything — if the kitchen catches fire, nobody eats.</p>
    <p><strong>Service decomposition</strong> is figuring out how to split the big app into smaller services. Like deciding what each food truck should sell. Good rules:</p>
    <ul>
      <li><strong>By business capability</strong> — User service, Order service, Payment service (separate concerns like a bakery separate from a butcher).</li>
      <li><strong>By domain (DDD)</strong> — Each bounded context becomes a service. What makes sense for the "Shipping" team to own vs. the "Inventory" team?</li>
      <li><strong>By change frequency</strong> — Things that change together should be in the same service. If the recommendation algorithm changes daily but checkout logic changes yearly, they should be separate services.</li>
    </ul>
    <p>Each microservice has its own database (database-per-service pattern). Like each food truck having its own ingredients — the taco truck doesn't share beef with the ice cream truck!</p>
  `,
  'sd-m5-l2': `
    <p><strong>API Gateway</strong> is like a <strong>concierge desk at a large hotel</strong>. You tell the concierge "I need dinner, a car, and a show" — they handle contacting the restaurant, calling a taxi, and booking tickets. You don't need to know the phone numbers or deal with each service individually.</p>
    <p>In microservices, the API Gateway is a single entry point for all client requests. It routes requests to the right service, handles authentication, rate limiting, and response aggregation.</p>
    <p><strong>What an API Gateway does:</strong></p>
    <ul>
      <li><strong>Routing</strong> — Sends /users/* to the User Service, /orders/* to the Order Service.</li>
      <li><strong>Authentication</strong> — Verifies the user's token once, so individual services don't need to.</li>
      <li><strong>Rate limiting</strong> — "You can only make 100 requests per minute." Like a bouncer controlling how many people enter a club.</li>
      <li><strong>Load balancing</strong> — Distributes requests across multiple instances of each service.</li>
      <li><strong>Response aggregation</strong> — Combines responses from multiple services. Like the concierge returning with your taxi and dinner reservation confirmation at the same time.</li>
    </ul>
    <p>Popular API Gateways: Kong, NGINX, AWS API Gateway, Apigee.</p>
  `,
  'sd-m5-l3': `
    <p><strong>Service mesh</strong> is like having <strong>traffic controllers at every intersection</strong> in a city. Each service doesn't worry about how to talk to other services — the service mesh handles all the communication, security, and monitoring automatically.</p>
    <p>Without a service mesh, every service needs code for retries, timeouts, circuit breakers, tracing, and encryption. That's like every building needing its own road crew and traffic lights!</p>
    <p>A service mesh uses <strong>sidecar proxies</strong> — a helper process that runs alongside each service instance (in the same pod/container). All traffic goes through the sidecar. Think of it as a <strong>personal assistant</strong> for each service that handles all its communication needs.</p>
    <p><strong>Benefits:</strong></p>
    <ul>
      <li><strong>Observability</strong> — Automatic metrics, logging, and tracing for all service-to-service communication.</li>
      <li><strong>Security</strong> — Automatic mTLS encryption between services (like encrypted phone calls between assistants).</li>
      <li><strong>Resilience</strong> — Automatic retries, circuit breakers, and fault injection testing.</li>
      <li><strong>Traffic management</strong> — Canary deployments ("send 5% of traffic to the new version"), A/B testing, blue-green deployments.</li>
    </ul>
    <p>Popular service meshes: Istio, Linkerd, Consul Connect. Think of them as the <strong>WiFi network for your microservices</strong> — it's always there, you don't think about it, but everything depends on it working well!</p>
  `,

  // ─── Module 6: Communication ───
  'sd-m6-l1': `
    <p><strong>REST (Representational State Transfer)</strong> is like a <strong>public library</strong>. You interact with resources (books) using standard operations: GET (borrow/read a book), POST (add a new book), PUT (replace a book), PATCH (update a page), DELETE (remove a book).</p>
    <p>Each book has a unique URL (like <code>/books/123</code>), and the library has standard rules about how to handle requests. REST works over HTTP, uses JSON/XML for data, and is <strong>stateless</strong> — each request contains all the info the server needs.</p>
    <p><strong>gRPC</strong> is like having a <strong>private courier service</strong> instead of the public library. It's faster because it uses Protocol Buffers (binary format — smaller and faster than JSON) and HTTP/2 (multiplexed — multiple requests on one connection).</p>
    <p>gRPC is great for <strong>internal service-to-service communication</strong> where performance matters. It supports streaming (server streaming, client streaming, bidirectional streaming). Like a courier who can carry very small, efficiently packed boxes between warehouse departments.</p>
    <p><strong>When to use what:</strong> REST for public APIs and web apps. gRPC for internal microservices communication and real-time streaming. GraphQL for complex data needs where the client specifies exactly what it needs (like ordering custom sandwich vs. a fixed combo meal).</p>
  `,
  'sd-m6-l2': `
    <p><strong>WebSockets</strong> is like <strong>keeping a phone line open</strong> between two people. Instead of calling, hanging up, calling again (like HTTP request-response), you keep the line open and both people can talk at any time.</p>
    <p>HTTP/REST is like <strong>sending letters</strong> — you write a letter, mail it, wait for a reply. The postal carrier only comes when you send a letter. If the other person wants to tell you something, they have to wait for you to send a letter first (polling) or send their own letter (which is separate).</p>
    <p>WebSockets is like <strong>instant messaging</strong> — once connected, either side can send a message anytime. Push notifications, live chat, real-time stock tickers, collaborative editing — all use WebSockets.</p>
    <p><strong>Message queues</strong> are like <strong>a restaurant order counter</strong>. The waiter (producer) puts orders on the counter (queue). The chefs (consumers) pick up orders when they're ready to cook. If a chef is busy, the order waits on the counter. If a chef gets sick, another chef picks up the next order.</p>
    <p>This <strong>decouples</strong> the producer from the consumer — they don't need to know about each other. Popular message queues: RabbitMQ, Apache Kafka, Amazon SQS, Redis Streams.</p>
    <p>Think of message queues like a <strong>buffered email system</strong> for microservices — Service A sends a message, Service B picks it up whenever it's ready, and if B is down, the message waits safely until B recovers.</p>
  `,
  'sd-m6-l3': `
    <p><strong>Message brokers</strong> (like Kafka and RabbitMQ) are the <strong>post offices of the microservices world</strong>. They manage the routing, storage, and delivery of messages between services.</p>
    <p><strong>Kafka</strong> is like a <strong>newspaper subscription</strong>. Producers write articles (messages) to topics (newspaper sections like "Sports", "Business"). Consumers subscribe to topics they're interested in. Kafka keeps all articles in order and can replay them later — like keeping old newspapers in a library archive.</p>
    <p>Key Kafka concepts:</p>
    <ul>
      <li><strong>Topic</strong> — A category/feed name (like "orders", "user_actions").</li>
      <li><strong>Partition</strong> — A topic is split into partitions for parallel processing. Like having multiple printing presses for the same newspaper section.</li>
      <li><strong>Offset</strong> — A position in the partition (like a bookmark — "I read up to here").</li>
      <li><strong>Consumer group</strong> — A group of consumers that divide the partitions among themselves. Like a team of reporters each covering different beats.</li>
    </ul>
    <p><strong>RabbitMQ</strong> is like a <strong>smart mailroom</strong>. It supports complex routing (direct, topic, fanout exchanges) and message acknowledgments. A message isn't considered "delivered" until the consumer says "got it!" Like registered mail that requires a signature.</p>
    <p><strong>Kafka vs RabbitMQ:</strong> Kafka is better for high-throughput event streaming and data pipelines. RabbitMQ is better for complex routing and task distribution. Kafka is like a highway (fast, linear). RabbitMQ is like a city's road network (complex intersections but more flexible).</p>
  `,

  // ─── Module 7: Real-Time Systems ───
  'sd-m7-l1': `
    <p><strong>Real-time communication methods</strong> are different ways to send and receive data instantly (or near-instantly) between a client and server.</p>
    <p><strong>WebSockets</strong> (covered earlier) — A persistent two-way connection. Like a phone call. Best for: chat apps, live notifications, real-time games, collaborative editing.</p>
    <p><strong>Server-Sent Events (SSE)</strong> — The server can push data to the client anytime, but the client can't send data back over the same connection. Like a <strong>radio broadcast</strong> — the station transmits, you just listen. Simpler than WebSockets but one-way only.</p>
    <p><strong>Polling</strong> — The client asks the server repeatedly "Got anything new?" Like a kid asking "Are we there yet?" every 30 seconds. Simple to implement but inefficient — most requests return nothing.</p>
    <ul>
      <li><strong>Short polling</strong> — Ask every N seconds (e.g., check for new messages every 5 seconds). Simple but wasteful.</li>
      <li><strong>Long polling</strong> — Ask and hold the connection open until there's something new or a timeout. More efficient but complex. Like calling a deli and staying on the line until your sandwich is ready instead of calling back every minute.</li>
    </ul>
    <p><strong>When to use what:</strong></p>
    <ul>
      <li>WebSockets — Bidirectional, real-time (chat, games, trading platforms).</li>
      <li>SSE — Server-to-client updates only (live sports scores, news feeds, stock tickers).</li>
      <li>Polling — Simple implementations, legacy systems, or when real-time isn't critical.</li>
    </ul>
  `,
  'sd-m7-l2': `
    <p><strong>WebRTC (Web Real-Time Communication)</strong> is a technology that lets browsers talk to each other <strong>directly, without going through a server</strong>. Like two kids with walkie-talkies — they don't need their parents to relay messages!</p>
    <p>WebRTC is used for <strong>video calls, voice calls, and peer-to-peer file sharing</strong> in the browser. Zoom, Google Meet, Discord all use WebRTC (or similar technology).</p>
    <p><strong>How it works (simplified):</strong></p>
    <ul>
      <li><strong>Signaling</strong> — A server helps peers find each other and exchange connection info. This is like a <strong>matchmaking service</strong> that introduces two people at a party — once introduced, they talk directly.</li>
      <li><strong>STUN/TURN servers</strong> — Help peers discover their public IP and relay data if direct connection is blocked by firewalls/NAT. Like a friend who tells you your own address (STUN) or a friend who passes messages when you can't talk directly (TURN).</li>
      <li><strong>Peer-to-peer connection</strong> — Once established, audio/video/data flows directly between browsers with low latency.</li>
    </ul>
    <p><strong>Challenges:</strong> NAT traversal (getting through corporate firewalls), bandwidth adaptation (adjusting quality when internet is slow), and mesh scaling (each participant in a group call sends to everyone else — O(n²) connections).</p>
    <p><strong>Real-time architecture patterns:</strong> For a chat app with 100M users, you'd combine WebSockets (for presence/typing indicators), message queues (for delivery), and database replication (for message history). Each piece handles a different real-time need!</p>
  `,

  // ─── Module 8: Observability ───
  'sd-m8-l1': `
    <p><strong>Observability</strong> is like having <strong>dashboard gauges in a car</strong>. You can see speed, fuel level, engine temperature, and RPM. If something goes wrong, the check engine light comes on. Without these gauges, you'd be driving blind!</p>
    <p>In software, observability means being able to understand what's happening inside your system by looking at its outputs. Three pillars:</p>
    <ul>
      <li><strong>Monitoring (Metrics)</strong> — Numbers that show system health. Like your car's speedometer and fuel gauge. Examples: CPU usage, request rate, error rate, latency percentiles.</li>
      <li><strong>Logging</strong> — Detailed records of events. Like a <strong>flight recorder</strong> (black box) that records everything that happens. "User 123 logged in at 10:32:15. Order #4567 failed: payment declined."</li>
      <li><strong>Tracing</strong> — Following a single request through multiple services. Like tracking a package through every sorting facility from the warehouse to your door. "The order request went: Browser → API Gateway → Order Service → Payment Service → Database."</li>
    </ul>
    <p>Without observability, debugging a microservices issue is like finding a needle in a haystack while blindfolded. With it, you can pinpoint exactly which service is slow, which database query is failing, and which server is overloaded!</p>
  `,
  'sd-m8-l2': `
    <p><strong>Prometheus</strong> is a monitoring system that <strong>pulls metrics</strong> from your services at regular intervals. Like a supervisor who walks around every minute checking each worker's output.</p>
    <p><strong>Grafana</strong> is a <strong>dashboard builder</strong> that visualizes metrics from Prometheus (and other sources). Like turning spreadsheet data into beautiful charts and graphs on a big screen.</p>
    <p><strong>Together they solve:</strong> "Is my system healthy right now?" With red/yellow/green statuses, trend lines, and alert thresholds.</p>
    <p><strong>ELK Stack (Elasticsearch, Logstash, Kibana)</strong> is for <strong>log management</strong>. Like having a super-powered search engine for all your log files:</p>
    <ul>
      <li><strong>Logstash</strong> — Collects and processes logs from all servers. Like a mail sorter that reads incoming mail and categorizes it.</li>
      <li><strong>Elasticsearch</strong> — Stores and indexes logs for fast searching. Like a filing cabinet with an incredible search system — "find all errors from the payment service in the last hour."</li>
      <li><strong>Kibana</strong> — Visualizes log data. Like a search interface that shows results as charts and graphs.</li>
    </ul>
    <p><strong>Alerting</strong> is about being <strong>paged when things go wrong</strong>. Like a smoke alarm — you don't watch it all day, but it wakes you up at 3 AM when there's a fire.</p>
    <p>Good alerting rules: Alert on symptoms (error rate > 5%), not causes (CPU > 80%). Too many alerts = alert fatigue (ignoring real issues). Every alert should be <strong>actionable</strong> — if receiving the alert doesn't prompt a specific action, it shouldn't be an alert!</p>
  `,

  // ─── Module 9: Design Case Studies ───
  'sd-m9-l1': `
    <p><strong>URL Shortener (like TinyURL/bit.ly)</strong> is like giving a <strong>short nickname</strong> to a very long person's name. "Christopher Jonathan Smith III" becomes "CJ".</p>
    <p><strong>Key components:</strong></p>
    <ul>
      <li><strong>Encoding</strong> — Convert a unique ID to a short string using Base62 (a-z, A-Z, 0-9). ID 12345 becomes "dnh". Like converting a number to a shorter representation.</li>
      <li><strong>Storage</strong> — A database mapping short codes to original URLs. Like a lookup table for nicknames.</li>
      <li><strong>Redirection</strong> — When someone visits bit.ly/dnh, the server looks up "dnh" and returns a 301/302 redirect to the original URL. Like a signpost that says "CJ's house → 742 Evergreen Terrace."</li>
    </ul>
    <p><strong>Scale considerations:</strong> Billions of URLs need a distributed ID generator (like Snowflake or Redis-based sequence). Analytics track each click (when, where, who). Caching popular URLs in Redis speeds up redirects. Think of it as needing to handle millions of signposts being read per second!</p>
  `,
  'sd-m9-l2': `
    <p><strong>Chat System (like WhatsApp/Messenger)</strong> is like having a <strong>post office + phone system combined</strong>. Messages need to be delivered reliably (post office) but also in real-time (phone calls).</p>
    <p><strong>Key components:</strong></p>
    <ul>
      <li><strong>Presence service</strong> — Tracks who's online/offline. Like a light outside a room showing if someone is inside.</li>
      <li><strong>Message routing</strong> — Routes messages from sender to receiver. If the receiver is on a different server, the message must be forwarded. Like a postal system routing mail between cities.</li>
      <li><strong>Message store</strong> — Stores messages for history and offline delivery. Like voicemail for when someone's phone is off.</li>
      <li><strong>Push notifications</strong> — Alerts users when they receive a message while the app is closed. Like a doorbell ringing to tell you a package arrived.</li>
    </ul>
    <p><strong>Key challenges:</strong> Exactly-once delivery (a message shouldn't be delivered zero times or twice), ordering (messages should appear in the right order), end-to-end encryption (even the chat company shouldn't read messages), and supporting billions of users across the world.</p>
    <p><strong>Architecture:</strong> WebSocket servers for real-time, message queues (Kafka) for reliable delivery, Cassandra for message history (fast writes, eventual consistency is fine for old messages), and Redis for presence/typing indicators.</p>
  `,
  'sd-m9-l3': `
    <p><strong>Video Streaming (like YouTube/Netflix)</strong> is like having a <strong>giant library of movies that anyone can watch instantly</strong>, but instead of shipping DVDs, you stream bits over the internet.</p>
    <p><strong>Key components:</strong></p>
    <ul>
      <li><strong>Upload/Ingestion</strong> — Creators upload videos. The system transcodes them into multiple formats and resolutions (1080p, 720p, 480p, 240p). Like a film lab developing film into different print sizes.</li>
      <li><strong>Storage</strong> — Original videos stored in blob storage (like AWS S3). Transcoded versions cached on CDNs worldwide.</li>
      <li><strong>CDN delivery</strong> — Users stream from the nearest CDN edge server. Popular videos are pre-cached on thousands of edge servers worldwide. Like having local video rental stores in every city stocking the most popular movies.</li>
      <li><strong>Adaptive bitrate streaming</strong> — The player automatically switches between resolutions based on network speed. If your WiFi gets slow, the video quality drops from 1080p to 480p seamlessly (no buffering!). Like a radio that adjusts volume based on road noise.</li>
    </ul>
    <p><strong>Scale:</strong> Netflix uses 3 AWS regions with 100+ CDN locations. They cache popular content strategically and use predictive algorithms to pre-position content. For live streaming (sports events), they use different infrastructure optimized for low latency.</p>
  `,
  'sd-m9-l4': `
    <p><strong>Ride-Hailing (like Uber/Lyft)</strong> is like a <strong>giant matchmaking system for rides</strong> — connecting people who need a ride with drivers who can give one, all in real-time.</p>
    <p><strong>Key components:</strong></p>
    <ul>
      <li><strong>Rider app</strong> — Shows nearby cars, allows booking with one tap.</li>
      <li><strong>Driver app</strong> — Shows ride requests, navigation to pickup/dropoff.</li>
      <li><strong>Dispatch engine</strong> — Matches riders with the best available driver. Like a taxi dispatcher, but automated and optimized globally.</li>
      <li><strong>Geospatial index</strong> — Tracks all driver locations. "Find all drivers within 2km of this rider" — using a data structure like QuadTree or GeoHash (not a simple SQL query for 360 degrees!).</li>
      <li><strong>Pricing engine</strong> — Calculates fare based on distance, time, and surge pricing (higher prices when demand > supply). Like airline ticket pricing but dynamic in real-time.</li>
    </ul>
    <p><strong>Key challenges:</strong> Real-time location updates (every 3 seconds from thousands of drivers), ride matching at scale (like millions of simultaneous matching decisions), surge pricing fairness, and handling both supply AND demand spikes (New Year's Eve!).</p>
    <p><strong>Architecture:</strong> WebSocket connections for real-time location, Redis (geospatial) for driver locations, Kafka for event processing, and machine learning for ETA prediction and surge pricing.</p>
  `,
  'sd-m9-l5': `
    <p><strong>Cloud Storage (like Google Drive/Dropbox)</strong> is like having a <strong>magical folder</strong> on your computer that whatever you put in it automatically appears on all your other devices. The magic is actually a complex distributed system working behind the scenes.</p>
    <p><strong>Key components:</strong></p>
    <ul>
      <li><strong>File sync client</strong> — A background app that watches for changes in the local folder and syncs them to the cloud. Like a personal assistant who instantly makes copies of any document you write.</li>
      <li><strong>Delta sync</strong> — Instead of re-uploading the entire file when you change one paragraph, it only uploads the changed parts. Like updating only the page that changed in a book instead of reprinting the whole thing.</li>
      <li><strong>Conflict resolution</strong> — What happens when you edit the same file on your laptop AND phone before sync completes? Last writer wins? Create both versions? Like a "merge" decision in git.</li>
      <li><strong>Storage backend</strong> — Files stored in blob storage (S3). Small files might be stored together; large files are chunked. Deduplication means if 1000 users upload the same cat video, it's stored once.</li>
      <li><strong>Versioning</strong> — Keeping old versions so users can recover from mistakes. Like a time machine for your files.</li>
    </ul>
    <p><strong>Key challenges:</strong> File conflict resolution, handling very large files efficiently, offline support with sync when reconnected, and scale (exabytes of storage, millions of users).</p>
  `,

  // ─── Module 10: Interview Prep ───
  'sd-m10-l1': `
    <p><strong>Back-of-the-envelope estimation</strong> is <strong>approximating numbers without a calculator</strong>. Like guessing how many pizzas to order for a party by estimating: 20 people × 3 slices each = 60 slices = 60/8 = ~8 pizzas. You don't need exact numbers — rough estimates are good enough!</p>
    <p><strong>Key estimations to practice:</strong></p>
    <ul>
      <li><strong>Traffic</strong>: DAU (Daily Active Users), requests per second (QPS), peak traffic = average × 2-10x.</li>
      <li><strong>Storage</strong>: How much data per user per day? Photos? Videos? Text? Multiply by users × days.</li>
      <li><strong>Bandwidth</strong>: Data transferred per second = QPS × average response size.</li>
      <li><strong>Memory</strong>: How much RAM needed for caching frequently accessed data?</li>
    </ul>
    <p><strong>Example: Twitter estimation</strong></p>
    <ul>
      <li>500M DAU, each reads 100 tweets/day → 50B reads/day → ~580K QPS reads.</li>
      <li>Each tweet ~140 chars + metadata → ~1KB → 580 MB/s bandwidth for reads.</li>
      <li>Storage: 500M tweets/day × 1KB = 500GB/day → 180TB/year.</li>
    </ul>
    <p>Remember: Use powers of 2 for memory (1 GB = 2^30 bytes ≈ 1 billion), powers of 10 for everything else. Round numbers aggressively — "roughly 1000 QPS" is fine, don't worry about "exactly 987 QPS."</p>
  `,
  'sd-m10-l2': `
    <p><strong>Trade-off analysis</strong> is like <strong>choosing between a sports car and a minivan</strong>. The sports car is fast but can't carry 7 people. The minivan carries everyone but is slow. Neither is "better" — it depends on what you need!</p>
    <p>In system design, every decision is a trade-off. <strong>Show the interviewer you understand the trade-offs</strong>, not just the solution.</p>
    <p><strong>Common trade-offs:</strong></p>
    <ul>
      <li><strong>Consistency vs. Availability</strong> (CAP theorem) — Bank needs consistency, social feed can be eventually consistent.</li>
      <li><strong>Latency vs. Throughput</strong> — Batching improves throughput but adds latency (like buses vs. taxis).</li>
      <li><strong>Read performance vs. Write performance</strong> — Indexes speed reads but slow writes. Denormalization speeds reads but takes more storage.</li>
      <li><strong>Strong consistency vs. Performance</strong> — Synchronous replication is safer but slower than async replication.</li>
      <li><strong>Monolith vs. Microservices</strong> — Monolith is simpler to develop/debug but harder to scale. Microservices scale independently but add complexity.</li>
      <li><strong>SQL vs. NoSQL</strong> — SQL gives ACID guarantees, schema enforcement, joins. NoSQL gives flexibility, horizontal scaling, and better performance for specific access patterns.</li>
    </ul>
    <p>When a candidate says "We'll use Cassandra because we need high write throughput", a great candidate adds: "The trade-off is that we lose strong consistency and joins — we'll need to handle stale reads in the application layer and denormalize our data."</p>
  `,
  'sd-m10-l3': `
    <p><strong>Mock system design scenarios</strong> are like <strong>fire drills</strong> — you practice so when the real interview comes, you're not nervous and you know the structure.</p>
    <p><strong>The 4-step interview framework:</strong></p>
    <ol>
      <li><strong>Clarify requirements (5 min)</strong> — What are we building? What are the scale requirements? What are the functional vs. non-functional requirements? Ask questions like a detective!</li>
      <li><strong>High-level design (10 min)</strong> — Draw the boxes and arrows. Client → API Gateway → Services → Database. Show the big picture first.</li>
      <li><strong>Deep dive (15 min)</strong> — Go deep on the interesting parts. How does the database schema look? How does the cache work? How does data flow for a specific request?</li>
      <li><strong>Scale & wrap-up (10 min)</strong> — How do we handle 10x more users? Where are the bottlenecks? What would you do with more time? Mention trade-offs throughout!</li>
    </ol>
    <p><strong>Common mock scenarios to practice:</strong> Design a URL shortener, a chat system (WhatsApp), a video streaming platform (Netflix), a ride-hailing service (Uber), a social media feed (Twitter/Instagram), a collaborative document editor (Google Docs), a payment system, a web crawler, a suggestion/autocomplete system, a real-time gaming leaderboard.</p>
    <p>For each scenario, practice estimating, drawing architecture, discussing database choices, caching strategies, and failure modes. The more you practice, the more patterns you recognize — most system design problems are combinations of the same building blocks!</p>
  `,
};

window.eli5SystemDesignData = eli5SystemDesignData;
