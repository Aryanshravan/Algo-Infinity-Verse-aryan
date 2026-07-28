let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('sdAcademyProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

const curriculum = [
  // ─── Module 1: Foundations ───
  {
    id: 'sd-mod-1',
    title: 'Foundations — Load Balancers, DNS, CDNs, Caching',
    lessons: [
      {
        id: 'sd-m1-l1',
        title: 'Load Balancers & Horizontal Scaling',
        objectives: [
          'Understand what load balancers are and why they are needed',
          'Learn common load balancing algorithms: round robin, least connections, IP hash',
          'Understand horizontal vs vertical scaling trade-offs',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Load Balancers — The Traffic Directors of the Internet</h2>
            <p>A <strong>load balancer</strong> distributes incoming network traffic across multiple servers, ensuring no single server bears too much demand. Think of it as a smart traffic cop directing cars to different lanes based on which lane is least congested.</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Why Load Balancers Matter:</strong> Without a load balancer, one server might handle 10,000 requests while another handles 10. The overloaded server crashes, taking down the service. Load balancers ensure uniform resource utilization and high availability.</p>
            </div>

            <h3>Load Balancing Algorithms</h3>
            <p>Different algorithms suit different workloads:</p>
            <ul>
              <li><strong>Round Robin</strong> — Requests are distributed sequentially: Server A, B, C, A, B, C... Simple and works well when servers are roughly identical. Like taking turns.</li>
              <li><strong>Least Connections</strong> — Sends requests to the server with the fewest active connections. Better when request processing times vary. Like the shortest checkout line at a supermarket.</li>
              <li><strong>IP Hash</strong> — Hashes the client's IP address to determine which server handles the request. Ensures the same client always goes to the same server (session persistence). Like assigning each customer a dedicated cashier.</li>
              <li><strong>Weighted Round Robin</strong> — Like round robin, but more powerful servers get more requests. Like giving a faster worker more tasks.</li>
            </ul>

            <h3>Horizontal vs. Vertical Scaling</h3>
            <p><strong>Vertical scaling (scale up):</strong> Adding more power (CPU, RAM) to an existing server. Like upgrading from a sedan to an SUV — bigger but still one vehicle.</p>
            <p><strong>Horizontal scaling (scale out):</strong> Adding more servers to the pool. Like adding more cars to a fleet — you can carry more passengers by having many cars rather than one giant bus.</p>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Trade-off:</strong> Vertical scaling has limits (a server can only be so big) and creates a single point of failure. Horizontal scaling requires load balancers and stateless application design but offers near-infinite scalability.</p>
            </div>

            <h3>L4 vs. L7 Load Balancers</h3>
            <ul>
              <li><strong>Layer 4 (Transport Layer):</strong> Routes based on IP address and TCP/UDP ports. Faster but less intelligent. Like a postal sorter that reads only zip codes.</li>
              <li><strong>Layer 7 (Application Layer):</strong> Routes based on HTTP headers, URLs, cookies, etc. Slower but can make smart routing decisions. Like a mail sorter that reads the entire address and decides "this needs a signature."</li>
            </ul>

            <p><strong>Popular load balancers:</strong> NGINX, HAProxy, AWS ELB/ALB, Google Cloud Load Balancing. Most support health checks — automatically removing unhealthy servers from the pool.</p>

            <div class="architecture-diagram">
    ┌─────────────┐     ┌──────────────┐
    │   Clients    │────▶│   Load       │
    │  (users)     │     │   Balancer   │
    └─────────────┘     └──────┬───────┘
                               │
                  ┌────────────┼────────────┐
                  ▼            ▼            ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ Server A │ │ Server B │ │ Server C │
            └──────────┘ └──────────┘ └──────────┘
                  │            │            │
                  └────────────┼────────────┘
                               ▼
                        ┌──────────┐
                        │ Database │
                        └──────────┘</div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Load balancers distribute traffic across multiple servers for high availability and scalability</li>
              <li>Algorithms: Round Robin (simple), Least Connections (balanced), IP Hash (session persistence)</li>
              <li>Horizontal scaling adds more servers; vertical scaling adds more power to existing servers</li>
              <li>L4 load balancers route on IP/port (fast); L7 route on HTTP content (intelligent)</li>
              <li>Health checks automatically detect and route around failed servers</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce sites during Black Friday use L7 load balancers to route traffic based on URL — "/checkout" traffic goes to payment-optimized servers, "/browse" traffic goes to content servers.</p>
          </div>
        `,
      },
      {
        id: 'sd-m1-l2',
        title: 'DNS & CDNs',
        objectives: [
          'Understand the DNS hierarchy and resolution process',
          'Learn how CDNs accelerate content delivery globally',
          'Understand DNS-based load balancing and geo-routing',
        ],
        content: `
          <div class="lesson-prose">
            <h2>DNS — The Phonebook of the Internet</h2>
            <p>The <strong>Domain Name System (DNS)</strong> translates human-readable domain names (like google.com) into machine-readable IP addresses (like 142.250.80.46). It is a distributed, hierarchical naming system — one of the oldest and most critical components of the internet.</p>

            <h3>DNS Resolution Process</h3>
            <p>When you type a URL, your browser performs a DNS lookup through several layers:</p>
            <ol>
              <li><strong>Browser cache</strong> — Checks if you have visited the site recently.</li>
              <li><strong>OS cache</strong> — Checks the operating system DNS cache.</li>
              <li><strong>ISP recursive resolver</strong> — Your internet provider DNS server.</li>
              <li><strong>Root nameserver</strong> — Directs to the appropriate TLD server (.com, .org).</li>
              <li><strong>TLD nameserver</strong> — Directs to the authoritative nameserver for the domain.</li>
              <li><strong>Authoritative nameserver</strong> — Returns the actual IP address.</li>
            </ol>
            <p>This happens in <strong>milliseconds</strong>. Like calling directory assistance: "Find the number for Google."</p>

            <h3>CDNs — Content Delivery Networks</h3>
            <p>A <strong>CDN</strong> is a geographically distributed network of proxy servers that cache content close to users. Think of it like having local franchise stores instead of one central warehouse.</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Key Insight:</strong> Without a CDN, a user in Tokyo downloading a 5MB image from a server in New York must transfer data across 11,000 km of fiber optic cable. With a CDN, that image is served from a Tokyo edge server — reducing latency from ~150ms to ~5ms.</p>
            </div>

            <h3>DNS-Based Load Balancing and Geo-Routing</h3>
            <p>DNS can return <strong>multiple IP addresses</strong> for the same domain (round-robin DNS). It can also return <strong>different IPs based on the user location</strong> (geo-routing):</p>
            <ul>
              <li>Users in Europe get the IP of the London data center</li>
              <li>Users in Asia get the IP of the Singapore data center</li>
              <li>If one data center fails, DNS updates to route everyone to the remaining centers</li>
            </ul>
            <p>This is why you sometimes cannot access a website immediately after a DNS change — DNS records are cached and it takes time (TTL) for new records to propagate worldwide.</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>DNS translates domain names to IP addresses through a hierarchical resolution process</li>
              <li>CDNs cache content on geographically distributed edge servers for faster delivery</li>
              <li>DNS supports load balancing (multiple A records) and geo-routing (location-based responses)</li>
              <li>TTL determines how long DNS records are cached — shorter TTL = faster updates but more queries</li>
              <li>CDNs handle caching, DDoS protection, SSL termination, and traffic optimization</li>
            </ul>
            <p><strong>Real-world use:</strong> Netflix uses its own CDN (Open Connect) with 17,000+ edge servers. Cloudflare, Akamai, and Fastly are popular commercial CDNs.</p>
          </div>
        `,
      },
      {
        id: 'sd-m1-l3',
        title: 'Caching Strategies Overview',
        objectives: [
          'Understand the caching hierarchy: browser, CDN, application, database',
          'Learn cache invalidation strategies and the cache stampede problem',
          'Understand the difference between local and distributed caching',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Caching — Speed Through Storage</h2>
            <p><strong>Caching</strong> stores frequently accessed data in a fast-access layer so future requests can be served faster. The key insight: there is a <strong>memory hierarchy</strong> — CPU cache (nanoseconds) → RAM (microseconds) → SSD (milliseconds) → Network (seconds). Each level is ~10-100x slower than the previous.</p>

            <h3>The Caching Hierarchy</h3>
            <ul>
              <li><strong>Browser cache</strong> — Stores static assets (images, CSS, JS) locally. HTTP headers (Cache-Control, ETag) control behavior. Like keeping frequently used tools in your pocket.</li>
              <li><strong>CDN cache</strong> — Stores content at edge locations close to users. Reduces load on origin servers. Like having popular items in local storefronts.</li>
              <li><strong>Application cache (Redis/Memcached)</strong> — In-memory data store for frequently queried data. Sub-millisecond access times. Like a chef mise en place — ingredients prepped and ready.</li>
              <li><strong>Database cache</strong> — The database internal buffer pool. Keeps frequently accessed pages in memory. Like a librarian desk with popular books pulled aside.</li>
            </ul>

            <h3>Cache Invalidation — The Hardest Problem</h3>
            <p>There are two hard things in computer science: cache invalidation, naming things, and off-by-one errors. Cache invalidation strategies:</p>
            <ul>
              <li><strong>TTL (Time To Live)</strong> — Data expires after a fixed time. Simple but may serve stale data. Like a newspaper — fine for yesterday news but not for real-time stock prices.</li>
              <li><strong>Write-through</strong> — Update cache and database simultaneously. Ensures cache is always fresh but increases write latency.</li>
              <li><strong>Write-invalidate</strong> — Update the database, then invalidate (delete) the stale cache entry. Next read will miss cache and fetch fresh data.</li>
              <li><strong>Event-driven</strong> — Use database triggers or change data capture (CDC) to invalidate/update cache when data changes.</li>
            </ul>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Cache Stampede:</strong> When a popular cache key expires and thousands of simultaneous requests all hit the database. Mitigations: pre-warming, request coalescing (only one request fetches from DB, others wait), or stale-while-revalidate (serve stale data while asynchronously refreshing).</p>
            </div>

            <h3>Local vs. Distributed Caching</h3>
            <p><strong>Local cache:</strong> Each server has its own in-memory cache. Fast (no network) but each server has a partial view. Memory is duplicated across servers. Like each cashier having their own tip jar.</p>
            <p><strong>Distributed cache (Redis, Memcached):</strong> A shared cache service that all servers access. Consistent view, memory is shared, but adds network latency. Like a shared tip pool that all cashiers contribute to.</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Caching stores frequently accessed data in progressively faster storage tiers</li>
              <li>Cache hierarchy: Browser → CDN → Application (Redis) → Database buffer</li>
              <li>Invalidation strategies: TTL, write-through, write-invalidate, event-driven</li>
              <li>Cache stampede occurs when popular keys expire under high concurrency</li>
              <li>Local caches are faster but fragmented; distributed caches are consistent but add latency</li>
            </ul>
            <p><strong>Real-world use:</strong> Twitter caches each user timeline in Redis. When you tweet, your tweet is pre-inserted into all your followers timeline caches — reads are instant, writes do the heavy lifting.</p>
          </div>
        `,
      },
      {
        id: 'sd-m1-l4',
        title: 'Caching Patterns: Aside, Through, Behind',
        objectives: [
          'Master Cache Aside, Write-Through, Write-Behind caching patterns',
          'Understand when to apply each pattern based on workload characteristics',
          'Learn about eviction policies: LRU, LFU, FIFO, TTL',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Cache Access Patterns</h2>
            <p>Different application needs call for different caching patterns. Choosing the right pattern is critical for performance and data consistency.</p>

            <h3>Cache Aside (Lazy Loading)</h3>
            <p>The most common pattern. The application code manages the cache:</p>
            <ol>
              <li>Check cache for data</li>
              <li>If found (cache hit), return it</li>
              <li>If not found (cache miss), load from database</li>
              <li>Store in cache for future requests</li>
              <li>Return data</li>
            </ol>
            <p><strong>Good for:</strong> Read-heavy workloads. <strong>Risk:</strong> Cache miss penalty (trips to DB) and stale data if database is updated without invalidating cache.</p>

            <h3>Write-Through</h3>
            <p>Data is written to cache AND database in the same transaction. The cache is always consistent with the database.</p>
            <p><strong>Good for:</strong> Write-heavy workloads requiring strong consistency. <strong>Downside:</strong> Every write pays the overhead of both cache and database updates.</p>

            <h3>Write-Behind (Write-Back)</h3>
            <p>Data is written to cache first, then asynchronously batched to the database. Extremely fast writes, but data loss risk if cache fails before flushing.</p>
            <p><strong>Good for:</strong> High-volume write workloads where some data loss is acceptable (analytics, clickstreams). <strong>Downside:</strong> Not suitable for financial data.</p>

            <h3>Eviction Policies</h3>
            <p>Cache has finite space. When full, something must be removed:</p>
            <ul>
              <li><strong>LRU (Least Recently Used)</strong> — Removes items not accessed for the longest time. Most common.</li>
              <li><strong>LFU (Least Frequently Used)</strong> — Removes items accessed the fewest times. Good for content with stable popularity.</li>
              <li><strong>FIFO (First In, First Out)</strong> — Removes oldest items regardless of usage. Simple but inefficient.</li>
              <li><strong>TTL (Time To Live)</strong> — Items automatically expire after a set duration. Often combined with other policies.</li>
            </ul>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Pro Tip:</strong> Redis uses an approximation of LRU (sampled LRU) for performance. It samples a few keys and evicts the oldest among them, rather than scanning all keys. This is 99% as good as true LRU but much faster.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Cache Aside: app manages cache, loads on miss — most common pattern</li>
              <li>Write-Through: cache + database updated together — strong consistency</li>
              <li>Write-Behind: writes go to cache first, batched to DB — fast but risky</li>
              <li>LRU evicts least recently used items; LFU evicts least frequently used</li>
              <li>TTL-based expiration prevents stale data regardless of eviction policy</li>
            </ul>
            <p><strong>Real-world use:</strong> Facebook uses Cache Aside for user profiles (write-through for profile edits, cache-aside for reads). In less than 1% of cases, users see a stale profile for a few seconds — acceptable trade-off for scale.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m1-q1',
        question: 'Which load balancing algorithm ensures the same client always reaches the same server?',
        options: ['Round Robin', 'Least Connections', 'IP Hash', 'Random'],
        correct: 2,
      },
      {
        id: 'sd-m1-q2',
        question: 'What is the primary difference between L4 and L7 load balancers?',
        options: [
          'L4 is slower but more intelligent; L7 is faster but simpler',
          'L4 routes on IP/port; L7 routes on HTTP content (URLs, cookies, headers)',
          'L4 is for cloud; L7 is for on-premises',
          'There is no practical difference',
        ],
        correct: 1,
      },
      {
        id: 'sd-m1-q3',
        question: 'What happens when a cache stampede occurs?',
        options: [
          'All cache entries are simultaneously refreshed',
          'A popular cache key expires and thousands of requests hit the database at once',
          'The cache runs out of memory',
          'The load balancer fails over to a backup server',
        ],
        correct: 1,
      },
      {
        id: 'sd-m1-q4',
        question: 'Which caching pattern writes data to both cache and database simultaneously?',
        options: ['Cache Aside', 'Write-Through', 'Write-Behind', 'Lazy Loading'],
        correct: 1,
      },
      {
        id: 'sd-m1-q5',
        question: 'Which CDN characteristic is most important for global video streaming?',
        options: [
          'Compression algorithms',
          'Geographic distribution of edge servers',
          'Number of SSL certificates',
          'DNS resolution speed',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 2: Databases ───
  {
    id: 'sd-mod-2',
    title: 'Databases — SQL vs NoSQL, Replication, Sharding, Indexing',
    lessons: [
      {
        id: 'sd-m2-l1',
        title: 'SQL vs NoSQL — When to Use What',
        objectives: [
          'Understand the fundamental differences between SQL and NoSQL databases',
          'Learn when to choose each database type based on workload requirements',
          'Understand polyglot persistence — using multiple database types together',
        ],
        content: `
          <div class="lesson-prose">
            <h2>SQL vs. NoSQL — The Right Tool for the Job</h2>
            <p>The choice between SQL and NoSQL is one of the most fundamental decisions in system design. Neither is universally better — each excels in different scenarios.</p>

            <h3>SQL Databases (Relational)</h3>
            <p><strong>Characteristics:</strong> Structured schema, ACID compliance, powerful joins, standardized query language (SQL).</p>
            <p><strong>Examples:</strong> PostgreSQL, MySQL, SQLite, Microsoft SQL Server, Oracle.</p>
            <p><strong>Best for:</strong> Financial systems, ERP, CRM, any system where data integrity and complex relationships are critical.</p>

            <h3>NoSQL Databases</h3>
            <p><strong>Characteristics:</strong> Flexible schema, horizontal scaling built-in, optimized for specific access patterns, typically eventual consistency.</p>
            <p><strong>Types:</strong></p>
            <ul>
              <li><strong>Key-Value (Redis, DynamoDB):</strong> Simple key-value lookups. Extremely fast. Best for caching, sessions, simple lookups.</li>
              <li><strong>Document (MongoDB, Couchbase):</strong> Stores JSON-like documents. Flexible schema. Best for content management, catalogs, user profiles.</li>
              <li><strong>Column-Family (Cassandra, HBase):</strong> Stores data in columns rather than rows. Best for time-series data, analytics, IoT.</li>
              <li><strong>Graph (Neo4j, Amazon Neptune):</strong> Stores nodes and edges. Best for social networks, recommendation engines, fraud detection.</li>
            </ul>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Polyglot Persistence:</strong> Most modern systems use MULTIPLE databases. PostgreSQL for core business logic, Redis for caching, Elasticsearch for search, and Cassandra for analytics logs. Each database does what it does best!</p>
            </div>

            <h3>Decision Framework</h3>
            <ul>
              <li><strong>Use SQL when:</strong> Data is structured with relationships, ACID compliance is required, you need complex queries and joins, data integrity is paramount.</li>
              <li><strong>Use NoSQL when:</strong> Schema is flexible or evolving, you need massive horizontal scale, data access patterns are simple (key lookups), write throughput is extremely high.</li>
              <li><strong>Use both when:</strong> Most real-world systems need both — SQL for transactions, NoSQL for high-throughput operational data.</li>
            </ul>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>SQL: structured schema, ACID, joins — use for core transactions and business logic</li>
              <li>NoSQL types: Key-Value (Redis), Document (MongoDB), Column-Family (Cassandra), Graph (Neo4j)</li>
              <li>Polyglot persistence: use the best database for each workload in the same system</li>
              <li>SQL prioritizes consistency; NoSQL prioritizes availability and partition tolerance</li>
              <li>Choice depends on data structure, consistency needs, query patterns, and scale requirements</li>
            </ul>
            <p><strong>Real-world use:</strong> Instagram used PostgreSQL for core data, Redis for feed caching, and Cassandra for direct messaging.</p>
          </div>
        `,
      },
      {
        id: 'sd-m2-l2',
        title: 'Database Replication — Leaders, Followers and Consensus',
        objectives: [
          'Understand single-leader, multi-leader, and leaderless replication',
          'Learn synchronous vs asynchronous replication trade-offs',
          'Understand replication lag and its consequences',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Database Replication — Keeping Copies in Sync</h2>
            <p><strong>Replication</strong> means keeping a copy of the same data on multiple servers. It provides redundancy (high availability), increases read capacity, and can improve latency by placing copies closer to users.</p>

            <h3>Single-Leader (Primary-Replica) Replication</h3>
            <p>One node (leader/primary) handles all writes. One or more followers (replicas/secondaries) copy data from the leader and handle reads.</p>

            <h3>Synchronous vs. Asynchronous Replication</h3>
            <ul>
              <li><strong>Synchronous:</strong> The leader waits for confirmation from replicas before acknowledging the write. Safer (no data loss if leader crashes) but slower.</li>
              <li><strong>Asynchronous:</strong> The leader acknowledges the write immediately, and replicas catch up in the background. Faster but risks data loss if the leader crashes before replication.</li>
            </ul>

            <h3>Multi-Leader Replication</h3>
            <p>Multiple nodes accept writes. Each leader replicates to other leaders and followers. Common in multi-datacenter deployments.</p>
            <p><strong>Challenge:</strong> Write conflicts. Conflict resolution strategies: last-writer-wins (LWW), CRDTs, or custom merge logic.</p>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Replication Lag:</strong> In async replication, followers lag behind the leader. This causes: stale reads (user sees old data after writing), monotonic read violations (data appears/disappears), and causality violations (comments appear before the post).</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Single-leader: one leader handles writes, replicas handle reads — simple and common</li>
              <li>Synchronous replication: safe but slow; asynchronous: fast but risky</li>
              <li>Multi-leader: multiple write nodes for multi-DC deployments, but introduces conflict resolution</li>
              <li>Replication lag causes read anomalies — mitigate with session consistency guarantees</li>
              <li>Read replicas scale query capacity but may serve stale data</li>
            </ul>
            <p><strong>Real-world use:</strong> GitHub uses MySQL with synchronous replication. Writes go to the primary, reads are distributed across load-balanced replicas.</p>
          </div>
        `,
      },
      {
        id: 'sd-m2-l3',
        title: 'Database Sharding — Horizontal Partitioning at Scale',
        objectives: [
          'Understand what sharding is and when it becomes necessary',
          'Learn sharding strategies: range, hash, directory-based',
          'Understand the challenges of resharding and cross-shard queries',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Sharding — Splitting Data Across Multiple Databases</h2>
            <p><strong>Sharding</strong> (horizontal partitioning) splits a large database into smaller, independent databases called shards. Each shard holds a subset of the data.</p>

            <h3>When to Shard</h3>
            <ul>
              <li>Data size exceeds a single server storage capacity (TB+)</li>
              <li>Write throughput exceeds a single server capacity (10K+ writes/sec)</li>
              <li>Working set (frequently accessed data) does not fit in memory</li>
            </ul>

            <h3>Sharding Strategies</h3>
            <ul>
              <li><strong>Range-based:</strong> Split data by a key range (e.g., users A-M on shard 1, N-Z on shard 2). Simple but can cause hotspots.</li>
              <li><strong>Hash-based:</strong> Hash the shard key, mod by number of shards. More uniform distribution. But changing the number of shards requires rehashing.</li>
              <li><strong>Directory-based:</strong> Maintain a lookup table mapping keys to shards. Most flexible but the directory can become a bottleneck.</li>
            </ul>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ The Resharding Problem:</strong> Adding new shards requires redistributing data. Solutions: consistent hashing (minimizes data movement on resharding), or pre-split into more shards than needed.</p>
            </div>

            <h3>Cross-Shard Challenges</h3>
            <ul>
              <li><strong>JOINs across shards</strong> — Must query each shard and combine results in application code</li>
              <li><strong>Transactions across shards</strong> — Require distributed transactions (2PC), which are slow</li>
              <li><strong>Best practice:</strong> Design shard key so most queries hit a single shard.</li>
            </ul>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Sharding splits data across multiple database servers when a single server is insufficient</li>
              <li>Range sharding: simple but may cause hotspots; Hash sharding: uniform but resharding is painful</li>
              <li>Directory-based sharding: most flexible but adds a lookup indirection</li>
              <li>Consistent hashing minimizes data movement when adding/removing shards</li>
              <li>Cross-shard operations (JOINs, transactions) are complex — design shard keys to keep related data together</li>
            </ul>
            <p><strong>Real-world use:</strong> Discord shards its PostgreSQL database by guild (server) ID. Each guild is self-contained — all data for a guild lives on one shard.</p>
          </div>
        `,
      },
      {
        id: 'sd-m2-l4',
        title: 'Indexing Strategies for Performance',
        objectives: [
          'Understand B-tree, Hash, and specialized index types',
          'Learn composite indexes and the column order trade-off',
          'Master index analysis using EXPLAIN and query planning',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Indexing — Query Speed Through Data Structures</h2>
            <p>An <strong>index</strong> is a data structure that speeds up data retrieval at the cost of additional storage and slower writes.</p>

            <h3>Index Types</h3>
            <ul>
              <li><strong>B-tree:</strong> The default. O(log n) search. Supports equality and range queries.</li>
              <li><strong>Hash index:</strong> O(1) lookups for equality queries only.</li>
              <li><strong>GiST/GIN:</strong> Specialized indexes for full-text search, geometric data, JSONB.</li>
              <li><strong>Bitmap index:</strong> Good for low-cardinality columns. Used in data warehousing.</li>
            </ul>

            <h3>Composite (Multi-Column) Indexes</h3>
            <p>An index on multiple columns. The column order matters — leftmost prefix rule: queries must use the leftmost columns to use the index.</p>
            <p>For a composite index on (A, B, C): queries on A work, on A AND B work, on B only do NOT work.</p>

            <h3>Covering Index</h3>
            <p>An index that contains ALL columns needed by a query. The database can satisfy the query entirely from the index without touching the table.</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Use EXPLAIN:</strong> Use EXPLAIN (PostgreSQL) or EXPLAIN PLAN (MySQL/Oracle) to see how the database executes a query. Look for Index Scan (good) vs Seq Scan on large tables (bad).</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>B-tree indexes are the default — O(log n) for equality and range queries</li>
              <li>Composite indexes follow the leftmost prefix rule — put most selective column first</li>
              <li>Covering indexes eliminate table lookups — all needed columns are in the index</li>
              <li>Indexes speed SELECT but slow INSERT/UPDATE/DELETE — do not over-index</li>
              <li>Use EXPLAIN to verify indexes are being used effectively</li>
            </ul>
            <p><strong>Real-world use:</strong> Instagram uses composite indexes on (user_id, created_at) for the photo feed query.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m2-q1',
        question: 'Which NoSQL type is best suited for storing and querying social graph data (friends, followers)?',
        options: ['Key-Value', 'Document', 'Column-Family', 'Graph'],
        correct: 3,
      },
      {
        id: 'sd-m2-q2',
        question: 'What is the main risk of asynchronous replication?',
        options: [
          'Slower read performance',
          'Potential data loss if the leader crashes before replicas catch up',
          'The database cannot accept writes',
          'Replicas automatically become read-only',
        ],
        correct: 1,
      },
      {
        id: 'sd-m2-q3',
        question: 'What makes resharding difficult with hash-based sharding?',
        options: [
          'Hash functions are slow to compute',
          'Changing the number of shards requires rehashing and moving most data',
          'Hash-based sharding does not support range queries',
          'There is no way to add new shards',
        ],
        correct: 1,
      },
      {
        id: 'sd-m2-q4',
        question: "For a composite index on (country, city, name), which query CANNOT use the index?",
        options: [
          "WHERE country = 'US' AND city = 'NYC'",
          "WHERE city = 'NYC' AND name = 'John'",
          "WHERE country = 'US' AND city = 'NYC' AND name = 'John'",
          "WHERE country = 'US'",
        ],
        correct: 1,
      },
      {
        id: 'sd-m2-q5',
        question: 'What is polyglot persistence?',
        options: [
          'Using multiple programming languages in the same application',
          'Using different types of databases optimized for different workloads in the same system',
          'Storing data in multiple formats within a single database',
          'Translating SQL queries into NoSQL queries',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 3: CAP Theorem and PACELC ───
  {
    id: 'sd-mod-3',
    title: 'CAP Theorem and PACELC — Trade-offs and Consistency Models',
    lessons: [
      {
        id: 'sd-m3-l1',
        title: 'CAP Theorem — Consistency, Availability, Partition Tolerance',
        objectives: [
          'Understand the three properties of the CAP theorem',
          'Learn why you can only guarantee two out of three in a distributed system',
          'Apply CAP trade-offs to real-world database and system design choices',
        ],
        content: `
          <div class="lesson-prose">
            <h2>CAP Theorem — Pick Any Two</h2>
            <p>The <strong>CAP theorem</strong> (Eric Brewer, 2000) states that a distributed data store can only provide two of three guarantees simultaneously:</p>
            <ul>
              <li><strong>C — Consistency:</strong> Every read receives the most recent write or an error.</li>
              <li><strong>A — Availability:</strong> Every request receives a (non-error) response.</li>
              <li><strong>P — Partition Tolerance:</strong> The system continues to operate despite network failures.</li>
            </ul>

            <h3>The Critical Insight</h3>
            <p>Network partitions are <strong>inevitable</strong> in distributed systems. Therefore, you ALWAYS need P. So the real choice is between <strong>CP (Consistency + Partition Tolerance)</strong> and <strong>AP (Availability + Partition Tolerance)</strong>.</p>

            <p><strong>CP Systems:</strong> When a partition occurs, the system stops accepting writes until consistency is restored. Examples: HBase, Zookeeper, etcd.</p>
            <p>"We will shut down some nodes rather than risk serving stale data."</p>

            <p><strong>AP Systems:</strong> When a partition occurs, the system continues accepting writes. Different partitions may have different data temporarily. Examples: Cassandra, DynamoDB.</p>
            <p>"Everyone stays open for business, even if some customers see different data temporarily."</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Nuance:</strong> CAP is not binary. Most systems offer <strong>tunable consistency</strong>. Cassandra lets you configure per-query consistency levels: ONE (fast, weak), QUORUM (balanced), ALL (slow, strong).</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>CAP theorem: Consistency, Availability, Partition Tolerance — pick 2</li>
              <li>Network partitions are inevitable — so P is mandatory</li>
              <li>CP systems sacrifice availability during partitions (HBase, Zookeeper)</li>
              <li>AP systems sacrifice consistency during partitions (Cassandra, DynamoDB)</li>
              <li>Most modern databases offer tunable consistency — not binary CP or AP</li>
            </ul>
            <p><strong>Real-world use:</strong> Amazon DynamoDB is AP by default — your shopping cart always works even if the network has issues.</p>
          </div>
        `,
      },
      {
        id: 'sd-m3-l2',
        title: 'PACELC and Consistency Models',
        objectives: [
          'Understand how PACELC extends CAP with the latency-consistency trade-off',
          'Learn strong, eventual, causal, and read-your-writes consistency models',
          'Map real databases to PACELC categories',
        ],
        content: `
          <div class="lesson-prose">
            <h2>PACELC — CAP Successor</h2>
            <p>The <strong>PACELC</strong> theorem (Daniel Abadi, 2010) extends CAP by adding the "else" — the trade-off that exists even in normal operation:</p>
            <p><strong>P (Partition):</strong> If partitioned, trade-off C (Consistency) vs A (Availability).</p>
            <p><strong>E (Else):</strong> If NOT partitioned (normal operation), trade-off L (Latency) vs C (Consistency).</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Why PACELC matters:</strong> CAP only addresses behavior during failures. PACELC reminds us that the consistency-latency trade-off exists ALL THE TIME — even on a perfectly healthy network!</p>
            </div>

            <h3>Consistency Models (Strongest to Weakest)</h3>
            <ul>
              <li><strong>Strong (Linearizable) Consistency:</strong> All reads return the latest write. Requires consensus.</li>
              <li><strong>Sequential Consistency:</strong> Operations from each client appear in program order.</li>
              <li><strong>Causal Consistency:</strong> Causally related operations are seen in order by all nodes.</li>
              <li><strong>Read-Your-Writes Consistency:</strong> A client reads see their own writes. Others may not.</li>
              <li><strong>Eventual Consistency:</strong> Given enough time, all replicas converge.</li>
            </ul>

            <h3>Database PACELC Categories</h3>
            <ul>
              <li><strong>DynamoDB / Cassandra (PA/EL):</strong> Partition-tolerant, Available. Else prefer Low latency over Consistency.</li>
              <li><strong>HBase / BigTable (PC/EC):</strong> Partition-tolerant, Consistent. Else prefer Consistency over Low latency.</li>
              <li><strong>MongoDB (PA/EC):</strong> Partition-tolerant, Available. Else prefer Consistency.</li>
            </ul>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>PACELC adds the latency vs. consistency trade-off during normal (non-partitioned) operation</li>
              <li>Strong consistency: all reads see latest write — expensive to achieve at scale</li>
              <li>Eventual consistency: replicas converge given enough time — cheap but unpredictable delay</li>
              <li>Causal consistency captures real-world dependencies without the cost of strong consistency</li>
              <li>Read-your-writes is the minimum acceptable consistency for many user-facing apps</li>
            </ul>
            <p><strong>Real-world use:</strong> MongoDB defaults to strong consistency (read from primary), but allows reading from secondaries for lower latency.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m3-q1',
        question: 'According to CAP theorem, which property must distributed systems always include?',
        options: ['Consistency', 'Availability', 'Partition Tolerance', 'All three'],
        correct: 2,
      },
      {
        id: 'sd-m3-q2',
        question: 'What does PACELC add beyond the original CAP theorem?',
        options: [
          'A fourth property called "Else"',
          'The latency vs. consistency trade-off during normal (non-partitioned) operation',
          'The ability to achieve all three CAP properties',
          'A new type of database classification',
        ],
        correct: 1,
      },
      {
        id: 'sd-m3-q3',
        question: 'Which consistency model guarantees that after a client writes a value, their subsequent reads will see that value?',
        options: ['Strong consistency', 'Causal consistency', 'Read-your-writes consistency', 'Eventual consistency'],
        correct: 2,
      },
      {
        id: 'sd-m3-q4',
        question: 'What does PA/EL mean in PACELC terms?',
        options: [
          'Partition-tolerant, Available during partitions; Else Latency over Consistency',
          'Partition-tolerant, Available during partitions; Else Eventually consistent',
          'Partition-tolerant, Always Consistent',
          'Partition-intolerant, Eventually Consistent',
        ],
        correct: 0,
      },
      {
        id: 'sd-m3-q5',
        question: 'Why is strong consistency expensive in distributed systems?',
        options: [
          'It requires more disk space',
          'It requires coordination and consensus across nodes, increasing latency',
          'It is not supported by any database',
          'It only works on a single CPU core',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 4: Distributed Systems ───
  {
    id: 'sd-mod-4',
    title: 'Distributed Systems — Consensus, Gossip, Quorum',
    lessons: [
      {
        id: 'sd-m4-l1',
        title: 'Consensus Algorithms — Raft and Paxos',
        objectives: [
          'Understand the consensus problem in distributed systems',
          'Learn how Raft achieves consensus through leader election and log replication',
          'Understand the basic Paxos protocol and when to use consensus algorithms',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Consensus — Getting Multiple Servers to Agree</h2>
            <p>The <strong>consensus problem</strong>: Multiple servers must agree on a value, despite failures and network issues. This is fundamental to distributed systems.</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 The FLP Impossibility:</strong> In an asynchronous distributed system where messages can be arbitrarily delayed, it is impossible to guarantee consensus with even one faulty node. Real systems use timeouts and randomized delays.</p>
            </div>

            <h3>Raft — Consensus for Engineers</h3>
            <p>Raft is designed for <strong>understandability</strong>. It breaks consensus into three sub-problems:</p>
            <ol>
              <li><strong>Leader Election:</strong> Servers elect a leader. If the leader fails, a new one is elected.</li>
              <li><strong>Log Replication:</strong> The leader accepts client requests, appends them to its log, and replicates them to followers.</li>
              <li><strong>Safety:</strong> If a leader commits a log entry, all future leaders will contain that entry.</li>
            </ol>
            <p>Raft uses <strong>randomized timeouts</strong> for leader election (150-300ms) to prevent simultaneous elections.</p>

            <h3>Paxos — The Classic Consensus Protocol</h3>
            <p>Paxos is more complex than Raft. It uses multiple phases (Prepare, Promise, Accept, Accepted). Most new systems choose Raft over Paxos for implementability.</p>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Performance:</strong> Consensus requires a majority (quorum). With 3 nodes, need 2. With 5, need 3. Higher node counts provide better fault tolerance but increase latency.</p>
            </div>

            <h3>Real-World Use Cases</h3>
            <ul>
              <li><strong>etcd / Zookeeper / Consul:</strong> Distributed coordination using Raft/ZAB/Paxos</li>
              <li><strong>Spanner (Google):</strong> Uses Paxos for synchronous replication across global data centers</li>
              <li><strong>Kafka:</strong> Uses Raft-based KRaft for metadata management</li>
            </ul>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Consensus algorithms enable multiple servers to agree on values despite failures</li>
              <li>Raft breaks consensus into leader election, log replication, and safety</li>
              <li>Paxos is the classic but complex consensus protocol</li>
              <li>A majority (quorum) of nodes is required for progress</li>
              <li>Used in etcd, Zookeeper, Consul for leader election and configuration management</li>
            </ul>
            <p><strong>Real-world use:</strong> Kubernetes uses etcd (Raft-based) to store cluster state.</p>
          </div>
        `,
      },
      {
        id: 'sd-m4-l2',
        title: 'Gossip Protocols and Quorum',
        objectives: [
          'Understand how gossip protocols propagate information in large clusters',
          'Learn the gossip epidemic model and infection-style dissemination',
          'Master quorum-based read/write strategies for consistency tuning',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Gossip — Rumor Mill for Distributed Systems</h2>
            <p><strong>Gossip protocols</strong> are epidemic-style communication where each node periodically exchanges information with a few random peers. Within a bounded number of rounds, every node knows the information.</p>

            <h3>How Gossip Works</h3>
            <p>In each round (typically every 1 second):</p>
            <ol>
              <li>Node A selects a random peer (Node B)</li>
              <li>Node A shares its latest state with Node B</li>
              <li>Node B merges the information with its own</li>
              <li>Node B gossips with other random peers in the next round</li>
            </ol>
            <p>Information spreads exponentially: 1 → 2 → 4 → 8 → 16... A cluster of 10,000 nodes converges in ~14 rounds.</p>

            <h3>Gossip Benefits</h3>
            <ul>
              <li><strong>Scalability:</strong> Each node only talks to a few peers — O(log N) per node</li>
              <li><strong>Fault tolerance:</strong> A few failed nodes do not stop the spread</li>
              <li><strong>Decentralized:</strong> No single point of failure</li>
              <li><strong>Eventual consistency:</strong> All nodes eventually learn the information</li>
            </ul>

            <h3>Quorum — How Many Votes Do You Need?</h3>
            <ul>
              <li><strong>Write Quorum (W):</strong> Minimum nodes confirming a write.</li>
              <li><strong>Read Quorum (R):</strong> Minimum nodes responding to a read.</li>
              <li><strong>W + R > N</strong> guarantees strong consistency.</li>
            </ul>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Tunable Consistency:</strong> Cassandra lets you set W and R per query. W=ALL,R=ONE = strong for reads. W=ONE,R=ONE = fast eventual. W=QUORUM,R=QUORUM = balanced.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Gossip protocols spread information exponentially through random peer exchange</li>
              <li>No central coordinator — fully decentralized and fault-tolerant</li>
              <li>Used in Cassandra, Redis Cluster, Consul for membership dissemination</li>
              <li>W + R > N guarantees strong consistency</li>
              <li>Tunable W/R values let you balance consistency vs. performance per operation</li>
            </ul>
            <p><strong>Real-world use:</strong> Cassandra uses gossip for cluster membership — each node gossips about which nodes are up/down every second.</p>
          </div>
        `,
      },
      {
        id: 'sd-m4-l3',
        title: 'Distributed Systems Challenges — Failure Modes and Mitigations',
        objectives: [
          'Understand partial failure, clock skew, split-brain, and Byzantine failures',
          'Learn fault tolerance patterns: circuit breakers, retries, timeouts, bulkheads',
          'Understand the difference between fail-fast and fail-safe designs',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Distributed Systems — Murphy Law at Scale</h2>
            <p>In distributed systems, everything that can go wrong will go wrong.</p>

            <h3>Common Failure Modes</h3>
            <ul>
              <li><strong>Partial Failure:</strong> Some nodes work, some do not. The system must handle mixed states.</li>
              <li><strong>Network Partition (Split-Brain):</strong> A network break causes two groups that cannot communicate. Both may accept writes. Mitigations: fencing, majority quorum, STONITH.</li>
              <li><strong>Clock Skew:</strong> Server clocks drift apart. Monotonic clocks are safer than wall clocks for measuring intervals.</li>
              <li><strong>Byzantine Failures:</strong> Nodes behave arbitrarily. BFT solutions exist but are expensive (3f+1 nodes).</li>
            </ul>

            <h3>Fault Tolerance Patterns</h3>
            <ul>
              <li><strong>Circuit Breaker:</strong> After N consecutive failures, stop trying and return fallback. Periodically probe for recovery.</li>
              <li><strong>Retry with Backoff:</strong> Retry with increasing delays (1s, 2s, 4s, 8s). Prevents retry storms.</li>
              <li><strong>Bulkhead:</strong> Isolate resources into separate pools. Failure in one pool does not affect others.</li>
              <li><strong>Timeout:</strong> Always set timeouts on network calls. A system without timeouts has no protection.</li>
            </ul>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ The Fallacies of Distributed Computing:</strong> 1) The network is reliable. 2) Latency is zero. 3) Bandwidth is infinite. 4) The network is secure. 5) Topology does not change. 6) There is one administrator. 7) Transport cost is zero. 8) The network is homogeneous. ALL are FALSE.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Partial failures, network partitions (split-brain), and clock skew are common</li>
              <li>Circuit breakers cut off failing services to prevent cascading failures</li>
              <li>Retry with exponential backoff prevents retry storms</li>
              <li>Bulkheads isolate failures — like ship compartments preventing sinking</li>
              <li>Always set timeouts — a system without timeouts has no protection against slow dependencies</li>
            </ul>
            <p><strong>Real-world use:</strong> Netflix Hystrix implements circuit breakers and bulkheads across 500+ microservices.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m4-q1',
        question: 'What is the minimum number of nodes needed for a distributed consensus system to tolerate 1 failure?',
        options: ['2', '3', '4', '5'],
        correct: 1,
      },
      {
        id: 'sd-m4-q2',
        question: 'What property makes gossip protocols scalable to thousands of nodes?',
        options: [
          'Each node communicates with all other nodes in parallel',
          'Each node only communicates with a few random peers each round',
          'Gossip only works on homogeneous hardware',
          'Gossip protocols use a central coordinator',
        ],
        correct: 1,
      },
      {
        id: 'sd-m4-q3',
        question: 'In quorum-based systems, what condition guarantees strong consistency?',
        options: ['W + R = N', 'W + R > N', 'W > R', 'R > W'],
        correct: 1,
      },
      {
        id: 'sd-m4-q4',
        question: 'What is the split-brain problem?',
        options: [
          'A server CPU has two cores that disagree',
          'A network partition causes two groups to each think they are the leader, accepting conflicting writes',
          'A database that stores data in two different formats',
          'A load balancer that routes to two different data centers',
        ],
        correct: 1,
      },
      {
        id: 'sd-m4-q5',
        question: 'Which pattern is equivalent to compartmentalization in shipbuilding?',
        options: ['Circuit Breaker', 'Retry with Backoff', 'Bulkhead', 'Timeout'],
        correct: 2,
      },
    ],
  },

  // ─── Module 5: Microservices ───
  {
    id: 'sd-mod-5',
    title: 'Microservices — Decomposition, Gateways, Service Mesh',
    lessons: [
      {
        id: 'sd-m5-l1',
        title: 'Service Decomposition and Domain-Driven Design',
        objectives: [
          'Understand microservices vs monolithic architecture trade-offs',
          'Learn domain-driven design principles for service boundaries',
          'Apply the database-per-service pattern and its implications',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Microservices — Small Services, Big Benefits</h2>
            <p><strong>Microservices architecture</strong> structures an application as a collection of loosely coupled, independently deployable services.</p>

            <h3>Monolith vs. Microservices</h3>
            <p><strong>Monolith:</strong> All code in one deployment unit. Simple initially, but becomes tightly coupled. Changing one feature requires deploying the entire app.</p>
            <p><strong>Microservices:</strong> Each domain has its own service. Services can be developed, tested, deployed, and scaled independently.</p>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Conway Law:</strong> Organizations design systems that mirror their communication structure. If teams are organized by business capability, microservices aligned to those capabilities work well.</p>
            </div>

            <h3>Domain-Driven Design (DDD) for Service Boundaries</h3>
            <ul>
              <li><strong>Bounded Context:</strong> A boundary within which a particular domain model applies. "Shipping" and "Billing" are different bounded contexts.</li>
              <li><strong>Ubiquitous Language:</strong> The domain language used consistently within a bounded context.</li>
              <li><strong>Aggregate:</strong> A cluster of domain objects treated as a unit for consistency.</li>
            </ul>

            <h3>Database-Per-Service Pattern</h3>
            <p>Each microservice has its own database. No other service directly accesses another service database. This ensures loose coupling. Downside: queries/transactions spanning services become complex.</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Microservices: independently deployable services organized by business capability</li>
              <li>DDD bounded contexts define service boundaries</li>
              <li>Database-per-service ensures loose coupling but complicates cross-service queries</li>
              <li>Conway Law: system architecture mirrors organizational communication</li>
              <li>Start with a monolith for new products; extract microservices as the codebase matures</li>
            </ul>
            <p><strong>Real-world use:</strong> Amazon transitioned from monolith to microservices in 2002 — Bezos mandated API-only communication.</p>
          </div>
        `,
      },
      {
        id: 'sd-m5-l2',
        title: 'API Gateways — The Front Door to Microservices',
        objectives: [
          'Understand the role of an API Gateway in a microservices architecture',
          'Learn about cross-cutting concerns handled by the gateway: auth, rate limiting, routing',
          'Compare API Gateway patterns: BFF, single gateway, gateway mesh',
        ],
        content: `
          <div class="lesson-prose">
            <h2>API Gateway — The Concierge for Your Services</h2>
            <p>An <strong>API Gateway</strong> is a single entry point for client requests to a microservices-based application.</p>

            <h3>What an API Gateway Does</h3>
            <ul>
              <li><strong>Request Routing:</strong> Routes /users/* to User Service, /orders/* to Order Service.</li>
              <li><strong>Authentication:</strong> Validates tokens (JWT, OAuth), enforces RBAC policies.</li>
              <li><strong>Rate Limiting:</strong> Prevents abuse by enforcing per-client quotas.</li>
              <li><strong>Response Aggregation:</strong> Combines responses from multiple services.</li>
              <li><strong>Request/Response Transformation:</strong> Converts between protocols (gRPC to REST).</li>
              <li><strong>Caching:</strong> Caches responses for frequently requested data.</li>
            </ul>

            <h3>API Gateway Patterns</h3>
            <ul>
              <li><strong>Single Gateway:</strong> One gateway for all clients. Simple but can become a bottleneck.</li>
              <li><strong>BFF (Backend For Frontend):</strong> Separate gateways for each client type (web, mobile, IoT). Each optimized for its client.</li>
              <li><strong>Gateway Mesh:</strong> Multiple lightweight gateways that coordinate. Complex but highly scalable.</li>
            </ul>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Popular API Gateways:</strong> Kong, NGINX Plus, AWS API Gateway, Apigee, Zuul (Netflix).</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>API Gateway: single entry point handling routing, auth, rate limiting, and aggregation</li>
              <li>Cross-cutting concerns (auth, logging, rate limiting) centralized in the gateway</li>
              <li>Single gateway is simple but can be a bottleneck; BFF pattern optimizes per-client</li>
              <li>Gateways can transform protocols and aggregate responses from multiple services</li>
              <li>Popular options: Kong, AWS API Gateway, NGINX, Apigee</li>
            </ul>
            <p><strong>Real-world use:</strong> Spotify BFF pattern has different API gateways for desktop, mobile, and web clients.</p>
          </div>
        `,
      },
      {
        id: 'sd-m5-l3',
        title: 'Service Mesh — Istio, Linkerd and Sidecar Proxies',
        objectives: [
          'Understand the service mesh pattern and sidecar proxy architecture',
          'Learn how service meshes provide observability, security, and traffic management',
          'Compare service mesh implementations: Istio vs Linkerd vs Consul Connect',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Service Mesh — The Communication Layer for Microservices</h2>
            <p>A <strong>service mesh</strong> is a dedicated infrastructure layer for handling service-to-service communication.</p>

            <h3>Sidecar Proxy Pattern</h3>
            <p>Each service instance has a <strong>sidecar proxy</strong> (e.g., Envoy) running alongside it. All traffic goes through the sidecar.</p>

            <h3>What Service Mesh Provides</h3>
            <ul>
              <li><strong>Observability:</strong> Automatic metrics, distributed tracing, and access logs.</li>
              <li><strong>Security:</strong> Automatic mTLS between services.</li>
              <li><strong>Traffic Management:</strong> Canary deployments, blue-green, A/B testing, fault injection.</li>
              <li><strong>Resilience:</strong> Automatic retries, circuit breakers, timeouts configured centrally.</li>
            </ul>

            <h3>Control Plane vs. Data Plane</h3>
            <ul>
              <li><strong>Data Plane:</strong> Sidecar proxies handling actual traffic.</li>
              <li><strong>Control Plane:</strong> Manages and configures the data plane.</li>
            </ul>

            <h3>Service Mesh Comparison</h3>
            <ul>
              <li><strong>Istio:</strong> Most feature-rich. Uses Envoy. Complex to operate.</li>
              <li><strong>Linkerd:</strong> Lighter weight. Rust-based proxies. Simpler.</li>
              <li><strong>Consul Connect:</strong> HashiCorp solution. Integrated with Consul.</li>
            </ul>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Added Complexity:</strong> A service mesh adds latency, operational complexity, and resource overhead. Consider the trade-off carefully.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Service mesh: infrastructure layer for secure, observable, resilient communication</li>
              <li>Sidecar proxies (data plane) handle traffic; control plane configures policies</li>
              <li>Provides automatic mTLS, distributed tracing, canary deployments</li>
              <li>Istio: most features, complex; Linkerd: simpler, lighter</li>
              <li>Adds latency and operational complexity — use only if justified</li>
            </ul>
            <p><strong>Real-world use:</strong> Adidas uses Istio to manage 100+ microservices with automatic mTLS and canary deployments.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m5-q1',
        question: 'What is the main advantage of the database-per-service pattern?',
        options: [
          'Faster query performance due to data proximity',
          'Loose coupling — services are not affected by other services schema changes',
          'Reduces the total number of databases needed',
          'Simplifies cross-service joins',
        ],
        correct: 1,
      },
      {
        id: 'sd-m5-q2',
        question: 'What does BFF stand for in API Gateway patterns?',
        options: ['Best Function Framework', 'Backend For Frontend', 'Basic Feature Flag', 'Binary File Format'],
        correct: 1,
      },
      {
        id: 'sd-m5-q3',
        question: 'In a service mesh, what is a sidecar proxy?',
        options: [
          'A service that runs on a separate server alongside the main service',
          'A proxy process that runs alongside each service instance, handling all network traffic',
          'A backup proxy used only when the primary proxy fails',
          'A mobile app that controls the service mesh from a phone',
        ],
        correct: 1,
      },
      {
        id: 'sd-m5-q4',
        question: 'Which service mesh implementation uses Envoy as its data plane proxy by default?',
        options: ['Linkerd', 'Consul Connect', 'Istio', 'Kong'],
        correct: 2,
      },
      {
        id: 'sd-m5-q5',
        question: 'Conway Law suggests that system architecture tends to mirror:',
        options: [
          'The programming language used',
          'The organization communication structure',
          'The database schema design',
          'The user interface design patterns',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 6: Communication ───
  {
    id: 'sd-mod-6',
    title: 'Communication — REST, gRPC, WebSockets, Message Queues',
    lessons: [
      {
        id: 'sd-m6-l1',
        title: 'REST, gRPC and GraphQL — API Design Patterns',
        objectives: [
          'Understand RESTful API design principles and best practices',
          'Learn gRPC and protocol buffers for high-performance internal APIs',
          'Compare REST, gRPC, and GraphQL for different use cases',
        ],
        content: `
          <div class="lesson-prose">
            <h2>API Communication Patterns</h2>
            <p>The choice of communication protocol significantly impacts performance, developer experience, and maintainability.</p>

            <h3>REST — Representational State Transfer</h3>
            <p>Most common API style. Uses HTTP methods on resources identified by URLs. Stateless, cacheable.</p>
            <p><strong>Best for:</strong> Public APIs, CRUD operations, web and mobile clients.</p>
            <p><strong>Trade-offs:</strong> Over-fetching and under-fetching. No built-in validation or code generation.</p>

            <h3>gRPC — Remote Procedure Calls with Protocol Buffers</h3>
            <p>Uses Protocol Buffers (binary format) and HTTP/2. API contract in .proto files, code auto-generated.</p>
            <p><strong>Best for:</strong> Internal microservices, real-time streaming, polyglot environments.</p>
            <p><strong>Characteristics:</strong> Binary (smaller/faster than JSON), HTTP/2 multiplexing, bidirectional streaming, strong typing.</p>

            <h3>GraphQL — Query Language for APIs</h3>
            <p>Clients specify exactly what data they need. Single endpoint. Strongly typed schema.</p>
            <p><strong>Best for:</strong> Complex data requirements, rapidly evolving frontends, mobile APIs.</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Choosing:</strong> REST for simple CRUD and public APIs. gRPC for high-performance internal communication. GraphQL for complex client-driven data. Many systems use all three.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>REST: HTTP-based, stateless, JSON — best for public APIs and CRUD</li>
              <li>gRPC: binary protobuf, HTTP/2, streaming — best for internal services</li>
              <li>GraphQL: client-driven queries, single endpoint — best for complex data needs</li>
              <li>REST over-fetches/under-fetches; gRPC is fastest; GraphQL is most flexible</li>
              <li>Many systems use multiple protocols for different communication scenarios</li>
            </ul>
            <p><strong>Real-world use:</strong> Netflix uses REST for external APIs, gRPC internally, and GraphQL for their TV app.</p>
          </div>
        `,
      },
      {
        id: 'sd-m6-l2',
        title: 'Message Queues — Async Communication and Event-Driven Architecture',
        objectives: [
          'Understand the benefits of asynchronous communication via message queues',
          'Learn about publish-subscribe and point-to-point messaging patterns',
          'Compare RabbitMQ, Apache Kafka, and Amazon SQS',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Message Queues — Decoupling Producers and Consumers</h2>
            <p><strong>Message queues</strong> enable asynchronous communication between services. Producers send messages, consumers process them when ready.</p>

            <h3>Messaging Patterns</h3>
            <ul>
              <li><strong>Point-to-Point (Queue):</strong> Each message consumed by exactly one consumer.</li>
              <li><strong>Publish-Subscribe (Topic):</strong> Each message broadcast to all subscribers.</li>
              <li><strong>Request-Reply:</strong> Producer expects a response on a reply queue.</li>
            </ul>

            <h3>Benefits of Async Communication</h3>
            <ul>
              <li><strong>Decoupling:</strong> Services do not need to know about each other.</li>
              <li><strong>Load Leveling:</strong> Messages pile up in the queue instead of overwhelming services.</li>
              <li><strong>Fault Tolerance:</strong> Messages wait safely if consumer crashes.</li>
              <li><strong>Scalability:</strong> Add more consumers for parallel processing.</li>
            </ul>

            <h3>Message Broker Comparison</h3>
            <ul>
              <li><strong>RabbitMQ:</strong> Smart broker, complex routing. Messages deleted after consumption. Best for task queues.</li>
              <li><strong>Apache Kafka:</strong> Dumb broker, smart consumers. Messages persist and can be replayed. Best for event streaming.</li>
              <li><strong>Amazon SQS:</strong> Fully managed. At-least-once delivery. Best for simple queueing in AWS.</li>
            </ul>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Challenges:</strong> Message ordering, exactly-once processing, dead letter queues, and backpressure.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Message queues enable async communication, decoupling producers from consumers</li>
              <li>Point-to-point: one consumer per message; Pub/sub: all subscribers receive each message</li>
              <li>RabbitMQ: smart broker, complex routing, best for task queues</li>
              <li>Kafka: persistent log, replayable, best for event streaming</li>
              <li>Async patterns improve resilience but introduce ordering and duplication challenges</li>
            </ul>
            <p><strong>Real-world use:</strong> Uber uses Kafka to process millions of trip events daily.</p>
          </div>
        `,
      },
      {
        id: 'sd-m6-l3',
        title: 'Event-Driven Architecture — Event Sourcing and CQRS',
        objectives: [
          'Understand event-driven architecture and event sourcing patterns',
          'Learn Command Query Responsibility Segregation (CQRS)',
          'Know when to apply event-driven patterns and their trade-offs',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Event-Driven Architecture</h2>
            <p>In <strong>event-driven architecture (EDA)</strong>, services communicate by producing and consuming events — significant state changes.</p>

            <h3>Event Sourcing</h3>
            <p>Instead of storing current state, store the <strong>sequence of events</strong>. To know current balance, replay all previous transactions.</p>
            <p><strong>Benefits:</strong> Complete audit trail, temporal queries, rebuildable projections.</p>
            <p><strong>Challenges:</strong> Event schema evolution, replay performance, storage growth.</p>

            <h3>CQRS — Command Query Responsibility Segregation</h3>
            <p>Separates read and write operations into different models, often different databases. Commands go through write path; queries go through read path.</p>
            <p><strong>Benefits:</strong> Optimize reads and writes independently. Scale read replicas independently.</p>
            <p><strong>Challenges:</strong> Eventual consistency between write and read models. More complex code and infrastructure.</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 When to use:</strong> Event sourcing + CQRS is powerful for systems needing audit trails (accounting, compliance), complex workflows, or multiple read views. Adds significant complexity — do not use for simple CRUD.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Event sourcing: store event log, derive state by replaying events</li>
              <li>CQRS: separate read and write models, each optimized for its workload</li>
              <li>Events are immutable facts — challenging to evolve schemas over time</li>
              <li>EDA decouples services but introduces eventual consistency and complexity</li>
              <li>Use for audit trails, workflows, and complex reporting; avoid for simple CRUD</li>
            </ul>
            <p><strong>Real-world use:</strong> Bank transfers use event sourcing — every transfer is an event; balances are derived projections.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m6-q1',
        question: 'Which API protocol uses Protocol Buffers and HTTP/2?',
        options: ['REST', 'SOAP', 'gRPC', 'GraphQL'],
        correct: 2,
      },
      {
        id: 'sd-m6-q2',
        question: 'What is the primary difference between RabbitMQ and Kafka?',
        options: [
          'RabbitMQ is cloud-only; Kafka is on-premises',
          'RabbitMQ deletes messages after consumption; Kafka retains them in a persistent log',
          'Kafka is faster for all use cases',
          'RabbitMQ only works with Java',
        ],
        correct: 1,
      },
      {
        id: 'sd-m6-q3',
        question: 'What does CQRS stand for?',
        options: [
          'Continuous Query Response System',
          'Command Query Responsibility Segregation',
          'Consistent Query Replication Service',
          'Centralized Query Routing System',
        ],
        correct: 1,
      },
      {
        id: 'sd-m6-q4',
        question: 'What is the main advantage of GraphQL over REST?',
        options: [
          'GraphQL is always faster than REST',
          'Clients can request exactly the data they need, eliminating over-fetching and under-fetching',
          'GraphQL does not require HTTP',
          'GraphQL automatically generates the database schema',
        ],
        correct: 1,
      },
      {
        id: 'sd-m6-q5',
        question: 'In event sourcing, how do you determine the current state of an entity?',
        options: [
          'Query the database table directly',
          'Replay all events for that entity since the beginning',
          'Read the most recent snapshot',
          'Ask the event producer for the current state',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 7: Real-Time Systems ───
  {
    id: 'sd-mod-7',
    title: 'Real-Time Systems — WebSockets, SSE, Polling, WebRTC',
    lessons: [
      {
        id: 'sd-m7-l1',
        title: 'Real-Time Communication — WebSockets, SSE, Long Polling',
        objectives: [
          'Understand the different real-time communication mechanisms and their trade-offs',
          'Learn when to use WebSockets, SSE, or polling based on requirements',
          'Understand WebSocket handshake, frame types, and connection lifecycle',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Real-Time Data Delivery Mechanisms</h2>
            <p>"Real-time" means different things to different systems. Choosing the right mechanism depends on latency, directionality, and infrastructure.</p>

            <h3>Short Polling</h3>
            <p>Client repeatedly asks "Got anything new?" at fixed intervals (e.g., every 5 seconds).</p>
            <p><strong>Pros:</strong> Extremely simple. Works with any HTTP infrastructure.</p>
            <p><strong>Cons:</strong> High latency, wasteful (most requests return nothing).</p>

            <h3>Long Polling</h3>
            <p>Client sends request. Server holds connection open until new data available or timeout.</p>
            <p><strong>Pros:</strong> Near-real-time, simpler than WebSockets, works with most HTTP infrastructure.</p>
            <p><strong>Cons:</strong> Server resource consumption (holding connections).</p>

            <h3>Server-Sent Events (SSE)</h3>
            <p>Server pushes events over a single long-lived HTTP connection. Client uses EventSource API.</p>
            <p><strong>Pros:</strong> Simpler than WebSockets, built-in reconnection.</p>
            <p><strong>Cons:</strong> One-way (server to client), limited concurrent connections per browser.</p>

            <h3>WebSockets — Full-Duplex Communication</h3>
            <p>Persistent bidirectional connection over a single TCP socket. Low overhead (2 bytes per message).</p>
            <p><strong>Pros:</strong> Low latency, full-duplex, binary and text messages, efficient.</p>
            <p><strong>Cons:</strong> Stateful infrastructure required, more complex to scale.</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Scaling WebSockets:</strong> A single server handles ~65K connections. Scale horizontally with a pub/sub layer (Redis Pub/Sub or Kafka) to broadcast across WebSocket servers.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Short polling: simple but inefficient</li>
              <li>Long polling: near-real-time, simpler than WebSockets</li>
              <li>SSE: one-way server-to-client streaming</li>
              <li>WebSockets: full-duplex, efficient, persistent connection</li>
              <li>Scale WebSockets with a pub/sub layer for broadcasting</li>
            </ul>
            <p><strong>Real-world use:</strong> Slack uses WebSockets for real-time messaging.</p>
          </div>
        `,
      },
      {
        id: 'sd-m7-l2',
        title: 'WebRTC and Real-Time Architecture Patterns',
        objectives: [
          'Understand WebRTC for peer-to-peer real-time communication',
          'Learn signaling, STUN/TURN, and NAT traversal concepts',
          'Design real-time architectures combining WebSockets, queues, and data stores',
        ],
        content: `
          <div class="lesson-prose">
            <h2>WebRTC — Peer-to-Peer Real-Time Communication</h2>
            <p><strong>WebRTC</strong> enables peer-to-peer audio, video, and data sharing between browsers without a central media server.</p>

            <h3>How WebRTC Works</h3>
            <ol>
              <li><strong>Signaling:</strong> Peers exchange connection metadata via a signaling server (WebSocket/HTTP).</li>
              <li><strong>NAT Traversal (STUN/TURN):</strong> STUN helps discover public IP. TURN relays data if direct connection fails.</li>
              <li><strong>Direct P2P Connection:</strong> Once ICE negotiation completes, media flows directly.</li>
            </ol>

            <h3>Real-Time Architecture Components</h3>
            <ul>
              <li><strong>WebSocket servers</strong> — Presence, typing indicators, signaling for WebRTC</li>
              <li><strong>Message queues (Kafka)</strong> — Reliable delivery and fan-out</li>
              <li><strong>Database (Cassandra)</strong> — Message history, write-optimized</li>
              <li><strong>Redis</strong> — Ephemeral state: sessions, presence, rate limiting</li>
              <li><strong>Media servers (Janus, Mediasoup, LiveKit)</strong> — SFU for group calls</li>
            </ul>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Scaling:</strong> Mesh topology for group calls only works for 4-6 participants. Beyond that, use SFU (Selective Forwarding Unit) where each participant sends once and the SFU distributes.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>WebRTC enables P2P audio/video/data between browsers</li>
              <li>Signaling exchanges connection metadata; STUN/TURN handles NAT traversal</li>
              <li>Group calls use SFU beyond 4-6 participants</li>
              <li>Real-time architecture combines WebSockets, message queues, Redis, databases</li>
              <li>Always have a fallback — if WebSocket fails, degrade to long polling</li>
            </ul>
            <p><strong>Real-world use:</strong> Zoom uses WebRTC for browser video, proprietary media server for group calls.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m7-q1',
        question: 'Which real-time mechanism is best for one-way server-to-client data push (e.g., live sports scores)?',
        options: ['WebSockets', 'Server-Sent Events (SSE)', 'Short Polling', 'Long Polling'],
        correct: 1,
      },
      {
        id: 'sd-m7-q2',
        question: 'What is the primary purpose of a STUN server in WebRTC?',
        options: [
          'To store video recordings of calls',
          'To help a peer discover its own public IP address for NAT traversal',
          'To relay all media between peers',
          'To authenticate users before calls',
        ],
        correct: 1,
      },
      {
        id: 'sd-m7-q3',
        question: 'Why can mesh topology not be used for large group calls?',
        options: [
          'Mesh topology does not support video',
          'Connections grow quadratically (O(n)), overwhelming each participant device',
          'Mesh topology requires all participants to use the same browser',
          'Mesh topology does not work with WebRTC',
        ],
        correct: 1,
      },
      {
        id: 'sd-m7-q4',
        question: 'What is the main advantage of WebSockets over HTTP polling?',
        options: [
          'Supported by all browsers without configuration',
          'Maintains a persistent connection with lower overhead per message',
          'Automatically handles reconnection',
          'Does not require a server',
        ],
        correct: 1,
      },
      {
        id: 'sd-m7-q5',
        question: 'How do you scale WebSocket connections beyond a single server capacity?',
        options: [
          'WebSockets cannot be scaled horizontally',
          'Use a pub/sub layer (Redis/Kafka) to broadcast across multiple WebSocket servers',
          'Increase the server RAM only',
          'Switch to SSE instead of WebSockets',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 8: Observability ───
  {
    id: 'sd-mod-8',
    title: 'Observability — Monitoring, Logging, Tracing, Alerting',
    lessons: [
      {
        id: 'sd-m8-l1',
        title: 'The Three Pillars — Metrics, Logs, Traces',
        objectives: [
          'Understand the three pillars of observability and how they complement each other',
          'Learn the USE and RED methods for monitoring',
          'Design effective dashboards and alerting strategies',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Observability — Understanding System Internals from Outputs</h2>
            <p><strong>Observability</strong> is the ability to understand a system internal state by examining its outputs.</p>

            <h3>The Three Pillars</h3>
            <ul>
              <li><strong>Metrics (What):</strong> Numerical measurements — CPU, request rate, error rate, latency. Tell you WHAT.</li>
              <li><strong>Logs (Why):</strong> Detailed timestamped events. Tell you WHY.</li>
              <li><strong>Traces (Where):</strong> Track requests across services. Tell you WHERE.</li>
            </ul>

            <h3>Monitoring Methodologies</h3>
            <p><strong>USE Method (infrastructure):</strong> For every resource, check Utilization, Saturation, Errors.</p>
            <p><strong>RED Method (services):</strong> For every service, monitor Rate, Errors, Duration.</p>

            <h3>Latency Percentiles — Why p99 Matters</h3>
            <p>Average latency is misleading. Monitor distributions: p50 (typical), p95 (bad), p99 (worst). The "Tail at Scale" problem — the slowest service determines overall latency.</p>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Alerting Best Practices:</strong> Alert on symptoms (error rate > 1%), not causes (CPU > 80%). Every alert must be actionable. Use the "4 golden signals": Latency, Traffic, Errors, Saturation.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Metrics: what (aggregated numbers). Logs: why (detailed events). Traces: where (request paths)</li>
              <li>USE method: Utilization, Saturation, Errors for infrastructure</li>
              <li>RED method: Rate, Errors, Duration for services</li>
              <li>Monitor latency percentiles (p50, p95, p99) — not just averages</li>
              <li>Alert on symptoms, not causes — every alert must be actionable</li>
            </ul>
            <p><strong>Real-world use:</strong> Google SRE monitors the "4 golden signals" for every service.</p>
          </div>
        `,
      },
      {
        id: 'sd-m8-l2',
        title: 'Prometheus, Grafana and ELK Stack',
        objectives: [
          'Understand how Prometheus and Grafana work together for monitoring',
          'Learn the ELK stack for log management',
          'Design an observability infrastructure for microservices',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Observability Infrastructure — The Tools</h2>

            <h3>Prometheus — Metrics Collection and Alerting</h3>
            <p><strong>Prometheus</strong> is a pull-based monitoring system. It scrapes metrics from instrumented services.</p>
            <p><strong>Key concepts:</strong></p>
            <ul>
              <li><strong>Metrics types:</strong> Counter (monotonically increasing), Gauge (up/down), Histogram (bucketed), Summary (quantiles).</li>
              <li><strong>PromQL:</strong> Query language. Example: <code>rate(http_requests_total[5m])</code></li>
              <li><strong>Alertmanager:</strong> Deduplication, grouping, routing to PagerDuty/Slack/email.</li>
            </ul>

            <h3>Grafana — Visualization and Dashboards</h3>
            <p><strong>Grafana</strong> queries Prometheus to build dashboards. Use templated variables, annotate deploys, share via JSON.</p>

            <h3>ELK Stack — Log Management</h3>
            <ul>
              <li><strong>Logstash:</strong> Ingests, transforms, and sends logs to Elasticsearch.</li>
              <li><strong>Elasticsearch:</strong> Distributed search engine. Scales horizontally.</li>
              <li><strong>Kibana:</strong> Web UI for searching and visualizing logs.</li>
            </ul>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Observability at Scale:</strong> Logs are expensive. Use sampling, structured logging (JSON), and log levels. Consider OpenTelemetry for vendor-neutral instrumentation.</p>
            </div>

            <h3>Distributed Tracing with Jaeger/Zipkin</h3>
            <p>Follows requests across service boundaries using trace context propagation (traceparent header). Each trace consists of spans — individual operations within a service.</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Prometheus: pull-based metrics with PromQL and Alertmanager</li>
              <li>Grafana: dashboard visualization for Prometheus and other sources</li>
              <li>ELK Stack: Elasticsearch (storage), Logstash (ingestion), Kibana (visualization)</li>
              <li>Distributed tracing (Jaeger/Zipkin) tracks requests across services</li>
              <li>OpenTelemetry provides unified, vendor-neutral instrumentation</li>
            </ul>
            <p><strong>Real-world use:</strong> Shopify collects 5M+ metrics/sec in Prometheus, 100TB+ logs daily in Elasticsearch.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m8-q1',
        question: 'What does the RED method stand for in service monitoring?',
        options: [
          'Reliability, Efficiency, Durability',
          'Rate, Errors, Duration',
          'Resource, Errors, Dependencies',
          'Read, Execute, Delete',
        ],
        correct: 1,
      },
      {
        id: 'sd-m8-q2',
        question: 'What type of Prometheus metric would you use to count total HTTP requests?',
        options: ['Gauge', 'Histogram', 'Counter', 'Summary'],
        correct: 2,
      },
      {
        id: 'sd-m8-q3',
        question: 'Which component of the ELK stack is responsible for log ingestion and transformation?',
        options: ['Elasticsearch', 'Logstash', 'Kibana', 'Filebeat'],
        correct: 1,
      },
      {
        id: 'sd-m8-q4',
        question: 'Why should you alert on symptoms rather than causes?',
        options: [
          'Symptoms are easier to measure',
          'Cause-based alerts lead to alert fatigue and do not always indicate user-facing impact',
          'Symptoms do not require thresholds',
          'Cause-based alerts are not supported by Prometheus',
        ],
        correct: 1,
      },
      {
        id: 'sd-m8-q5',
        question: 'What is the purpose of distributed tracing (e.g., Jaeger)?',
        options: [
          'To identify which users are accessing the system',
          'To track a single request across multiple services, identifying bottlenecks and failures',
          'To track server hardware inventory across data centers',
          'To monitor CPU and memory usage across the cluster',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 9: Design Case Studies ───
  {
    id: 'sd-mod-9',
    title: 'Design Case Studies — URL Shortener, Chat, YouTube, Uber, Dropbox',
    lessons: [
      {
        id: 'sd-m9-l1',
        title: 'URL Shortener — TinyURL/Bitly Design',
        objectives: [
          'Design a scalable URL shortening service handling billions of URLs',
          'Learn about Base62 encoding, hash collision handling, and distributed ID generation',
          'Understand redirect strategies (301 vs 302) and analytics tracking',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Designing a URL Shortener</h2>
            <p>A URL shortener takes a long URL and returns a short alias. Simple concept, but building it at scale requires careful design.</p>

            <h3>Requirements</h3>
            <ul>
              <li><strong>Functional:</strong> Create short URL, redirect, optional custom aliases, analytics.</li>
              <li><strong>Non-functional:</strong> High availability, low latency (<10ms redirects), billions of URLs.</li>
            </ul>

            <h3>Key Design Decisions</h3>
            <ul>
              <li><strong>Short URL generation:</strong> Base62 encoding (a-z, A-Z, 0-9 = 62 chars). 7 chars = 3.5 trillion unique URLs.</li>
              <li><strong>Storage:</strong> PostgreSQL for mapping, Redis for caching popular URLs, Cassandra for analytics.</li>
              <li><strong>Distributed ID generation:</strong> Snowflake ID (timestamp + worker + sequence) or Redis INCR.</li>
              <li><strong>Redirection:</strong> 301 (permanent, cached by browser) or 302 (temporary, for analytics tracking).</li>
            </ul>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Key Insight:</strong> Use a bloom filter to check for hash collisions efficiently before checking the database.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Base62 encoding: 7 chars yields 3.5 trillion combinations</li>
              <li>Distributed ID generation (Snowflake, Redis INCR) for unique IDs</li>
              <li>301 redirect for permanent links; 302 for analytics</li>
              <li>Cache popular URLs in Redis; Cassandra for click analytics</li>
              <li>Bloom filters detect hash collisions efficiently</li>
            </ul>
            <p><strong>Real-world use:</strong> Bitly processes billions of clicks monthly using PostgreSQL, Redis, and Cassandra.</p>
          </div>
        `,
      },
      {
        id: 'sd-m9-l2',
        title: 'Chat System — WhatsApp/Messenger Design',
        objectives: [
          'Design a real-time chat system supporting billions of users',
          'Learn about message delivery semantics: at-least-once, exactly-once',
          'Understand presence, push notifications, and end-to-end encryption',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Designing a Chat System (WhatsApp-scale)</h2>
            <p>WhatsApp handles 100B+ messages per day. A chat system must deliver messages instantly, reliably, and securely.</p>

            <h3>Core Features</h3>
            <ul>
              <li>One-to-one and group messaging</li>
              <li>Delivery status (sent, delivered, read)</li>
              <li>Online/offline presence</li>
              <li>Push notifications for offline users</li>
              <li>End-to-end encryption (E2EE)</li>
              <li>Multi-device sync</li>
            </ul>

            <h3>Architecture</h3>
            <ul>
              <li><strong>WebSocket Gateway Farm:</strong> Stateless servers behind load balancer. Redis Pub/Sub routes messages between gateways.</li>
              <li><strong>Message Store (Cassandra):</strong> Write-optimized, partitioned by conversation_id.</li>
              <li><strong>User Store (PostgreSQL):</strong> Profiles, contacts.</li>
              <li><strong>Redis:</strong> Presence tracking, typing indicators, rate limiting.</li>
              <li><strong>Kafka:</strong> Message fan-out for group chats.</li>
              <li><strong>Push Notification Service:</strong> APNS (iOS) and FCM (Android) for offline users.</li>
            </ul>

            <h3>Key Challenges</h3>
            <ul>
              <li><strong>E2EE:</strong> Server cannot decrypt messages. Signal Protocol for key exchange.</li>
              <li><strong>Exactly-once delivery:</strong> At-least-once with client-side deduplication.</li>
              <li><strong>Offline messages:</strong> Store for 30 days, sync on reconnection.</li>
              <li><strong>Multi-device:</strong> Each device tracks last synced message ID.</li>
            </ul>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>WebSocket gateways with Redis Pub/Sub for inter-gateway messaging</li>
              <li>Cassandra for message storage (write-optimized)</li>
              <li>Push notifications (APNS/FCM) for offline users</li>
              <li>End-to-end encryption means server never sees message content</li>
              <li>Multi-device sync via last-synced message IDs</li>
            </ul>
            <p><strong>Real-world use:</strong> WhatsApp uses Erlang with custom server built on ejabberd variant and Signal Protocol for E2EE.</p>
          </div>
        `,
      },
      {
        id: 'sd-m9-l3',
        title: 'Video Streaming — YouTube/Netflix Design',
        objectives: [
          'Design a video streaming platform handling billions of views',
          'Understand video transcoding, adaptive bitrate streaming, and CDN delivery',
          'Learn about recommendation systems and video upload pipelines',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Designing a Video Streaming Platform (YouTube-scale)</h2>
            <p>YouTube serves 1B+ hours of video daily. Netflix streams to 200M+ subscribers.</p>

            <h3>Video Upload Pipeline</h3>
            <ol>
              <li><strong>Upload:</strong> Video goes to temporary upload bucket.</li>
              <li><strong>Transcoding:</strong> Convert to multiple resolutions (240p to 4K) and codecs (H.264, VP9, AV1). Chunk into 2-10 second segments.</li>
              <li><strong>Quality control:</strong> Resolution check, audio sync, content ID matching.</li>
              <li><strong>Distribution:</strong> Encoded segments to CDN edge servers worldwide.</li>
            </ol>

            <h3>Adaptive Bitrate Streaming (ABR)</h3>
            <p>Player selects quality based on network conditions using DASH or HLS. Manifest file lists available qualities. Player monitors download speed and buffer health.</p>

            <h3>CDN Strategy</h3>
            <ul>
              <li><strong>Netflix Open Connect:</strong> 17,000+ appliances inside ISP data centers.</li>
              <li><strong>Cache hierarchy:</strong> Popular at edge, less popular at regional caches.</li>
              <li><strong>Proactive caching:</strong> Pre-populate based on predicted popularity.</li>
            </ul>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Key Metrics:</strong> Buffer health, rebuffer rate, start time, delivered bitrate. A 1% rebuffer rate increase measurably reduces user engagement.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Upload to Transcode (multi-resolution) to Quality check to CDN distribution</li>
              <li>ABR: encode at multiple bitrates, player chooses based on network conditions</li>
              <li>CDN caches popular content at edge; proactive caching for predicted hits</li>
              <li>Key metrics: rebuffer rate, start time, delivered bitrate</li>
              <li>Netflix uses Open Connect with 17K+ appliances in ISP data centers</li>
            </ul>
            <p><strong>Real-world use:</strong> YouTube recommendation system drives 70% of watch time using a two-stage ML pipeline.</p>
          </div>
        `,
      },
      {
        id: 'sd-m9-l4',
        title: 'Ride-Hailing — Uber Design',
        objectives: [
          'Design a real-time ride-hailing system handling millions of concurrent trips',
          'Learn about geospatial indexing for driver location queries',
          'Understand surge pricing and ride matching algorithms',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Designing a Ride-Hailing System (Uber-scale)</h2>
            <p>Uber operates in 70+ countries, handling 25M+ trips per day with sub-second ride matching.</p>

            <h3>Geospatial Indexing</h3>
            <p>Core challenge: "Find all drivers within 2km, quickly."</p>
            <ul>
              <li><strong>GeoHash:</strong> Grid-based hash. Nearby locations share prefixes.</li>
              <li><strong>QuadTree:</strong> Recursive quadrant division. Fast range queries.</li>
              <li><strong>Google S2 library:</strong> Hilbert curve mapping. Efficient and accurate.</li>
            </ul>

            <h3>Ride Matching</h3>
            <p>Batch requests every 2-3 seconds and solve global optimization: maximize rider satisfaction, minimize pickup time, balance driver workload.</p>

            <h3>Surge Pricing</h3>
            <p>When demand exceeds supply, prices increase. Multiplier based on real-time supply/demand ratio in each geohash cell.</p>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Scale:</strong> Uber ingests driver locations every 3 seconds from millions of drivers — ~300K writes/second. Uses Redis + Kafka + custom geospatial indexes.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Geospatial indexing (GeoHash, QuadTree, S2) enables fast nearby queries</li>
              <li>Ride matching uses batching and optimization, not just nearest-driver</li>
              <li>Surge pricing based on real-time supply/demand per geohash area</li>
              <li>Driver locations stream every 3 seconds — 300K writes/sec at scale</li>
              <li>Redis + Kafka + custom geospatial index handles the pipeline</li>
            </ul>
            <p><strong>Real-world use:</strong> Uber dispatch filters eligible drivers, then runs bipartite matching to assign the best driver.</p>
          </div>
        `,
      },
      {
        id: 'sd-m9-l5',
        title: 'Cloud Storage — Dropbox/Google Drive Design',
        objectives: [
          'Design a cloud file storage and synchronization system',
          'Learn about delta sync, chunking, and file conflict resolution',
          'Understand deduplication, versioning, and offline sync',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Designing Cloud Storage (Dropbox-scale)</h2>
            <p>Dropbox stores 500B+ files for 700M+ users. Core challenge: sync files across devices.</p>

            <h3>File Sync Architecture</h3>
            <ul>
              <li><strong>Block-level sync (delta sync):</strong> Upload only changed blocks (~4MB chunks). Fast and bandwidth-efficient.</li>
              <li><strong>Content-addressable storage:</strong> Files stored by SHA-256 hash. Deduplication — same file stored once.</li>
              <li><strong>Local file system watcher:</strong> Uses OS APIs (FSEvents, inotify) to detect changes.</li>
            </ul>

            <h3>Conflict Resolution</h3>
            <p>When file edited on two devices simultaneously: create conflict copy. More sophisticated: CRDTs for collaborative editing.</p>

            <h3>Storage Backend</h3>
            <ul>
              <li><strong>Blob storage (S3):</strong> File content.</li>
              <li><strong>Metadata DB (PostgreSQL):</strong> Names, permissions, versions.</li>
              <li><strong>Cache (Redis):</strong> File listings, permissions, quotas.</li>
              <li><strong>Notification service:</strong> WebSocket/polling for sync notifications.</li>
            </ul>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Key Insight:</strong> Dropbox sync is LAN-aware — devices on same network sync locally first, then to cloud.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Block-level sync: upload only changed parts of files</li>
              <li>Content-addressable storage: deduplication by content hash</li>
              <li>Conflict resolution: conflict copies or CRDTs for auto-merge</li>
              <li>LAN sync: same-network devices sync locally first</li>
              <li>Blob storage (S3) for content; PostgreSQL for metadata; Redis for cache</li>
            </ul>
            <p><strong>Real-world use:</strong> Dropbox "Magic Pocket" is custom storage infrastructure managing exabytes across data centers.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m9-q1',
        question: 'What encoding is typically used to generate short URLs in a URL shortener?',
        options: ['Base32', 'Base64', 'Base62', 'Base16'],
        correct: 2,
      },
      {
        id: 'sd-m9-q2',
        question: 'In a chat system, what is the primary purpose of Redis Pub/Sub?',
        options: [
          'To store chat messages permanently',
          'To route messages between WebSocket gateway instances',
          'To generate push notifications',
          'To authenticate users',
        ],
        correct: 1,
      },
      {
        id: 'sd-m9-q3',
        question: 'What does Adaptive Bitrate Streaming (ABR) do?',
        options: [
          'Adjusts video quality based on network conditions',
          'Changes streaming protocol based on device type',
          'Adapts video resolution based on screen size',
          'Adjusts audio volume based on background noise',
        ],
        correct: 0,
      },
      {
        id: 'sd-m9-q4',
        question: 'Which data structure is commonly used for fast nearby driver queries?',
        options: ['B-tree', 'Hash table', 'QuadTree / GeoHash', 'Linked list'],
        correct: 2,
      },
      {
        id: 'sd-m9-q5',
        question: 'What is delta sync in cloud storage systems?',
        options: [
          'Syncing only changed parts of a file instead of the entire file',
          'A special USB drive for syncing files',
          'Syncing files only during off-peak hours',
          'A compression algorithm for reducing file size',
        ],
        correct: 0,
      },
    ],
  },

  // ─── Module 10: Interview Prep ───
  {
    id: 'sd-mod-10',
    title: 'Interview Prep — Estimation, Trade-off Analysis, Mock Scenarios',
    lessons: [
      {
        id: 'sd-m10-l1',
        title: 'Back-of-the-Envelope Estimation for System Design',
        objectives: [
          'Learn to estimate traffic, storage, and bandwidth requirements',
          'Master back-of-the-envelope calculations for system design interviews',
          'Apply estimation to real-world scenarios like Twitter and YouTube',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Back-of-the-Envelope Estimation</h2>
            <p><strong>Back-of-the-envelope estimation</strong> is approximating numbers without a calculator. In system design interviews, you estimate traffic, storage, and bandwidth to guide architecture decisions.</p>

            <h3>Key Estimations to Practice</h3>
            <ul>
              <li><strong>Traffic:</strong> DAU (Daily Active Users), QPS (Queries Per Second). Peak = average x 2-10x.</li>
              <li><strong>Storage:</strong> Data per user per day x users x days.</li>
              <li><strong>Bandwidth:</strong> QPS x average response size.</li>
              <li><strong>Memory:</strong> RAM needed for caching frequently accessed data.</li>
            </ul>

            <h3>Power-of-2 Reference</h3>
            <ul>
              <li>1 byte = 8 bits</li>
              <li>1 KB = 1,024 bytes (~10^3)</li>
              <li>1 MB = 1,024 KB (~10^6)</li>
              <li>1 GB = 1,024 MB (~10^9)</li>
              <li>1 TB = 1,024 GB (~10^12)</li>
              <li>1 PB = 1,024 TB (~10^15)</li>
            </ul>

            <h3>Example: Twitter Estimation</h3>
            <ul>
              <li>500M DAU, each reads 100 tweets/day = 50B reads/day = ~580K QPS reads</li>
              <li>Each tweet ~140 chars + metadata = ~1KB</li>
              <li>Bandwidth: 580 MB/s for reads</li>
              <li>Storage: 500M tweets/day x 1KB = 500GB/day = 180TB/year</li>
            </ul>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Tips:</strong> Use powers of 2 for memory, powers of 10 for everything else. Round numbers aggressively — "~1000 QPS" is fine.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Estimate traffic (DAU, QPS), storage (per user), bandwidth (QPS x size)</li>
              <li>Use powers of 2 for memory, powers of 10 for other quantities</li>
              <li>Round numbers aggressively — approximation is the goal</li>
              <li>Peak traffic is typically 2-10x average</li>
              <li>Practice with real services: Twitter, YouTube, WhatsApp</li>
            </ul>
            <p><strong>Interview tip:</strong> Walk through your assumptions explicitly: "Assuming 500M DAU, each user reads 100 tweets per day..."</p>
          </div>
        `,
      },
      {
        id: 'sd-m10-l2',
        title: 'Trade-off Analysis in System Design',
        objectives: [
          'Learn to identify and articulate design trade-offs clearly',
          'Understand common trade-off pairs in distributed systems',
          'Practice comparing alternative solutions with trade-off analysis',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Trade-off Analysis — Showing Depth in Interviews</h2>
            <p>In system design, every decision is a trade-off. Great candidates show they understand the trade-offs, not just the solution.</p>

            <h3>Common Trade-off Pairs</h3>
            <ul>
              <li><strong>Consistency vs. Availability</strong> (CAP theorem) — Bank needs consistency, social feed can be eventually consistent.</li>
              <li><strong>Latency vs. Throughput</strong> — Batching improves throughput but adds latency (buses vs. taxis).</li>
              <li><strong>Read Performance vs. Write Performance</strong> — Indexes speed reads but slow writes.</li>
              <li><strong>Strong Consistency vs. Performance</strong> — Sync replication safer but slower than async.</li>
              <li><strong>Monolith vs. Microservices</strong> — Monolith simpler but harder to scale at org level.</li>
              <li><strong>SQL vs. NoSQL</strong> — SQL: ACID, joins. NoSQL: flexibility, horizontal scaling.</li>
            </ul>

            <h3>How to Present Trade-offs in Interviews</h3>
            <p>When proposing a solution, immediately follow with the trade-off: "We will use Cassandra because we need high write throughput. The trade-off is that we lose strong consistency and joins — we will handle stale reads in the application layer and denormalize our data."</p>

            <h3>Framework for Trade-off Analysis</h3>
            <ol>
              <li><strong>Identify the requirement:</strong> "We need sub-second read latency."</li>
              <li><strong>Propose a solution:</strong> "Use Redis cache with Cache-Aside pattern."</li>
              <li><strong>State the trade-off:</strong> "This adds cache invalidation complexity and potential stale reads."</li>
              <li><strong>Mitigate:</strong> "Use TTL-based expiration with write-through for critical data."</li>
            </ol>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 What interviewers look for:</strong> They want to see that you understand the consequences of your decisions. Saying "We will use PostgreSQL" is fine. Saying "We will use PostgreSQL because we need ACID transactions, although this means we will need to plan for read replicas at scale" is excellent.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Every design decision has trade-offs — show you understand both sides</li>
              <li>Common pairs: consistency vs. availability, latency vs. throughput, read vs. write perf</li>
              <li>Present trade-offs proactively: "X will work because __, at the cost of __"</li>
              <li>Follow the framework: requirement → proposal → trade-off → mitigation</li>
              <li>Depth of trade-off analysis distinguishes senior candidates</li>
            </ul>
            <p><strong>Interview tip:</strong> When comparing two options, draw a simple table comparing pros and cons. This shows structured thinking.</p>
          </div>
        `,
      },
      {
        id: 'sd-m10-l3',
        title: 'Mock Scenarios and Interview Framework',
        objectives: [
          'Learn the 4-step system design interview framework',
          'Practice common mock scenarios with structured approach',
          'Understand what interviewers evaluate at each stage',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Mock System Design Scenarios</h2>
            <p>System design interviews evaluate your ability to architect scalable systems. Practice with a structured framework and common scenarios.</p>

            <h3>The 4-Step Interview Framework</h3>
            <ol>
              <li><strong>Clarify Requirements (5 min)</strong> — What are we building? What scale? Functional vs. non-functional requirements? Ask clarifying questions.</li>
              <li><strong>High-Level Design (10 min)</strong> — Draw boxes and arrows. Client → API Gateway → Services → Database. Show the big picture.</li>
              <li><strong>Deep Dive (15 min)</strong> — Go deep on interesting parts. Schema design, caching strategy, data flow for a specific request.</li>
              <li><strong>Scale and Wrap-up (10 min)</strong> — How to handle 10x more users? Bottlenecks? What would you do with more time?</li>
            </ol>

            <h3>Common Mock Scenarios</h3>
            <ul>
              <li>Design a URL shortener (TinyURL)</li>
              <li>Design a chat system (WhatsApp)</li>
              <li>Design a video streaming platform (Netflix)</li>
              <li>Design a ride-hailing service (Uber)</li>
              <li>Design a social media feed (Twitter/Instagram)</li>
              <li>Design a collaborative document editor (Google Docs)</li>
              <li>Design a payment system</li>
              <li>Design a web crawler</li>
              <li>Design a search autocomplete system</li>
              <li>Design a real-time gaming leaderboard</li>
            </ul>

            <h3>Interviewer Evaluation Criteria</h3>
            <ul>
              <li><strong>Scalability:</strong> Can the system handle growth?</li>
              <li><strong>Reliability:</strong> How does the system handle failures?</li>
              <li><strong>Trade-off awareness:</strong> Does the candidate understand consequences?</li>
              <li><strong>Communication:</strong> Is the candidate explaining clearly?</li>
              <li><strong>Estimation:</strong> Can the candidate do rough calculations?</li>
            </ul>

            <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-indigo-800"><strong>💡 Final Tip:</strong> Most system design problems are combinations of the same building blocks: load balancers, caching, databases, message queues, CDNs, and sharding. Learn the building blocks, then compose them for any scenario.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>4-step framework: Clarify → High-Level Design → Deep Dive → Scale</li>
              <li>Practice 10+ common scenarios with the same structured approach</li>
              <li>Interviewers evaluate: scalability, reliability, trade-off awareness, communication</li>
              <li>System design = composing building blocks (LB, cache, DB, queues, CDN)</li>
              <li>The more you practice, the more patterns you recognize</li>
            </ul>
            <p><strong>Interview tip:</strong> Draw clear diagrams. Use rectangles for services, cylinders for databases, arrows for data flow. Label everything.</p>
          </div>
        `,
      },
    ],
    quiz: [
      {
        id: 'sd-m10-q1',
        question: 'In back-of-the-envelope estimation, what is the typical peak-to-average traffic ratio?',
        options: ['1x to 2x', '2x to 10x', '10x to 100x', '100x to 1000x'],
        correct: 1,
      },
      {
        id: 'sd-m10-q2',
        question: 'What is the recommended structure for presenting trade-offs in interviews?',
        options: [
          'Only state the solution, never mention downsides',
          'Requirement → Proposal → Trade-off → Mitigation',
          'List all possible technologies and let the interviewer choose',
          'Focus only on scalability, ignore other concerns',
        ],
        correct: 1,
      },
      {
        id: 'sd-m10-q3',
        question: 'Which step of the 4-step interview framework comes first?',
        options: ['Deep Dive', 'Scale and Wrap-up', 'Clarify Requirements', 'High-Level Design'],
        correct: 2,
      },
      {
        id: 'sd-m10-q4',
        question: 'What distinguishes a senior candidate in system design interviews?',
        options: [
          'Drawing the most complex architecture possible',
          'Understanding and articulating trade-offs of each decision',
          'Using the most popular technology for every component',
          'Finishing the design in the shortest time',
        ],
        correct: 1,
      },
      {
        id: 'sd-m10-q5',
        question: 'Most system design problems are:',
        options: [
          'Completely unique scenarios requiring novel solutions',
          'Combinations of the same building blocks (LB, cache, DB, queues, CDN)',
          'Only about database schema design',
          'Solved by choosing the right programming language',
        ],
        correct: 1,
      },
    ],
  },
];

// DOM References
const elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
};

// ─── Tab Switching ───
function switchTab(tabId) {
  elements.tabBtns.forEach(function (btn) {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'border-indigo-600', 'text-indigo-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-indigo-600', 'text-indigo-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  elements.tabPanes.forEach(function (pane) {
    if (pane.id === tabId + '-tab') {
      pane.classList.remove('hidden');
      pane.classList.add('block');
    } else {
      pane.classList.add('hidden');
      pane.classList.remove('block');
    }
  });
}

// ─── Sidebar ───
function renderSidebar() {
  var html = '';
  curriculum.forEach(function (mod, mIndex) {
    html += '<div class="sidebar-module"><h3 class="sidebar-module-title">' +
      mod.title + '</h3><ul class="space-y-1">';

    mod.lessons.forEach(function (lesson, lIndex) {
      var isCompleted = userProgress.completedLessons.indexOf(lesson.id) !== -1;
      var isActive = mIndex === activeModule && lIndex === activeLesson;

      html += '<li><button class="w-full text-left sidebar-lesson ' +
        (isActive ? 'active' : '') + '" data-module="' +
        mIndex + '" data-lesson="' + lIndex + '">' +
        '<i class="' + (isCompleted ? 'fas fa-check-circle text-green-500' : 'far fa-circle text-gray-400') +
        ' mr-2 w-4"></i>' + lesson.title + '</button></li>';
    });

    html += '</ul></div>';
  });

  elements.sidebarContent.innerHTML = html;
}

// ─── Lesson Loading ───
function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;

  var lesson = curriculum[mIndex].lessons[lIndex];

  if (userProgress.completedLessons.indexOf(lesson.id) === -1) {
    markLessonComplete(lesson.id);
  }

  var objectivesHtml = '';
  if (lesson.objectives && lesson.objectives.length > 0) {
    objectivesHtml = '<div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg text-sm lesson-objectives">' +
      '<p class="text-indigo-800 font-semibold mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</p>' +
      '<ul class="list-disc list-inside text-indigo-700 space-y-1">';
    lesson.objectives.forEach(function (obj) {
      objectivesHtml += '<li>' + obj + '</li>';
    });
    objectivesHtml += '</ul></div>';
  }

  var summaryHtml = lesson.summary || '';

  var fullContent = '<div class="lesson-prose">' +
    objectivesHtml +
    lesson.content +
    summaryHtml +
    '</div>';

  var eli5Content = window.eli5SystemDesignData && window.eli5SystemDesignData[lesson.id]
    ? window.eli5SystemDesignData[lesson.id]
    : '';

  elements.lessonContent.innerHTML = (window.eli5Toggle
    ? window.eli5Toggle.wrapContent(fullContent, eli5Content)
    : fullContent);

  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('system-design', elements.lessonContent);
  }

  renderQuiz(mIndex);
  renderSidebar();

  if (window.innerWidth < 768) {
    if (!elements.sidebar.classList.contains('-translate-x-full')) {
      toggleSidebar();
    }
  }
}

// ─── Quiz Rendering ───
function renderQuiz(mIndex) {
  var quiz = curriculum[mIndex].quiz;
  var html = '<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>';

  if (!quiz || quiz.length === 0) {
    elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
    return;
  }

  quiz.forEach(function (q, i) {
    html += '<div class="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-100 quiz-question" id="q-container-' +
      q.id + '"><p class="font-semibold text-lg text-gray-800 mb-4">' +
      (i + 1) + '. ' + q.question + '</p><div class="space-y-2">';

    q.options.forEach(function (opt, oIndex) {
      html += '<label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">' +
        '<input type="radio" name="quiz-' + q.id + '" value="' + oIndex + '" class="mr-3 w-4 h-4 text-indigo-600">' +
        '<span class="text-gray-700">' + opt + '</span></label>';
    });

    html += '</div><button data-quiz-id="' + q.id + '" data-module="' +
      mIndex + '" data-option="' + i +
      '" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Submit Answer</button>' +
      '<div id="q-feedback-' + q.id + '" class="mt-3 hidden text-sm font-medium"></div></div>';
  });

  elements.quizContent.innerHTML = html;
}

// ─── Quiz Answer Checking ───
window.checkAnswer = function (qId, mIndex, qIndex) {
  var selected = document.querySelector('input[name="quiz-' + qId + '"]:checked');
  var feedback = document.getElementById('q-feedback-' + qId);
  var container = document.getElementById('q-container-' + qId);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  var selectedModule = curriculum[mIndex];
  if (!selectedModule || !selectedModule.quiz || !selectedModule.quiz[qIndex]) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Quiz data not found.';
    feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
    return;
  }

  var correctAns = selectedModule.quiz[qIndex].correct;

  if (parseInt(selected.value) === correctAns) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-3 text-sm font-medium text-green-600 block';
    container.classList.replace('bg-indigo-50', 'bg-green-50');
    container.classList.replace('border-indigo-100', 'border-green-200');

    if (userProgress.completedQuizzes.indexOf(qId) === -1) {
      userProgress.completedQuizzes.push(qId);
      saveProgress();
    }
  } else {
    feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
    feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
  }
};

// ─── Progress Tracking ───
function markLessonComplete(lessonId) {
  if (userProgress.completedLessons.indexOf(lessonId) === -1) {
    userProgress.completedLessons.push(lessonId);
    saveProgress();
  }
}

function saveProgress() {
  localStorage.setItem('sdAcademyProgress', JSON.stringify(userProgress));
  updateProgress();
}

function updateProgress() {
  var totalItems = 0;
  curriculum.forEach(function (m) {
    totalItems += m.lessons.length;
    if (m.quiz) totalItems += m.quiz.length;
  });

  var completedItems =
    userProgress.completedLessons.length + userProgress.completedQuizzes.length;
  var percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  elements.progressBar.style.width = percentage + '%';
  elements.progressText.textContent = percentage + '%';
}

// ─── Mobile Sidebar Toggle ───
function toggleSidebar() {
  var isClosed = elements.sidebar.classList.contains('-translate-x-full');
  if (isClosed) {
    elements.sidebar.classList.remove('-translate-x-full');
    elements.sidebarOverlay.classList.remove('hidden');
  } else {
    elements.sidebar.classList.add('-translate-x-full');
    elements.sidebarOverlay.classList.add('hidden');
  }
}

// ─── Event Listeners ───
function setupEventListeners() {
  elements.tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
  elements.sidebarOverlay.addEventListener('click', toggleSidebar);

  elements.sidebarContent.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-module]');
    if (btn) {
      loadLesson(parseInt(btn.dataset.module), parseInt(btn.dataset.lesson));
    }
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-quiz-id]');
    if (btn) {
      checkAnswer(btn.dataset.quizId, parseInt(btn.dataset.module), parseInt(btn.dataset.option));
    }
  });
}

// ─── Init ───
function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
