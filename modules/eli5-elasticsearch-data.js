const eli5ElasticsearchData = {
  'm1-l1': `
    <p>Imagine a giant <strong>digital filing cabinet</strong> that can search through millions of files in less than a second. That's Elasticsearch!</p>
    <p>Instead of storing things in tables like a spreadsheet, it stores each item as a <strong>JSON document</strong> — like a note card with all the details about one thing.</p>
    <ul>
      <li><strong>Index</strong> = a filing cabinet drawer. All your "products" go in one drawer.</li>
      <li><strong>Document</strong> = one note card in the drawer. "Dell XPS 13 Laptop" is one card.</li>
      <li><strong>Field</strong> = what's written on the card: name, price, color.</li>
      <li><strong>Query</strong> = asking the cabinet a question: "Find all laptops under $1000"</li>
    </ul>
    <p>It's called "search engine" because it can find things even when you don't know the exact words — like a smart librarian who knows what you <em>mean</em> even if you say "notebook computer" instead of "laptop".</p>
  `,
  'm1-l2': `
    <p>An <strong>index</strong> is like a labeled box on a warehouse shelf. You create the box, give it a name, and tell the warehouse how many shelves (shards) it can use.</p>
    <ul>
      <li><strong>PUT /my-index</strong> = "Warehouse, please put a new empty box called 'my-index' on the shelf"</li>
      <li><strong>DELETE /my-index</strong> = "Take that box off the shelf and throw it away"</li>
      <li><strong>GET /my-index</strong> = "Tell me everything about that box — its size, what's inside, settings"</li>
    </ul>
    <p><strong>Settings</strong> are like rules written on the box: "Use 3 shelves" (shards), "Keep 1 backup copy of each shelf" (replicas).</p>
    <p><strong>Aliases</strong> are like sticky notes pointing to a box. You can move the sticky note to point to a different box — like renaming "current-products" without actually moving anything!</p>
  `,
  'm1-l3': `
    <p>Think of documents as <strong>index cards</strong> in a library catalog.</p>
    <ul>
      <li><strong>PUT /products/_doc/1</strong> = "Add a new index card with ID '1' to the products drawer. Here's what's on it: name, price, color"</li>
      <li><strong>GET /products/_doc/1</strong> = "Show me the card with ID '1'"</li>
      <li><strong>POST /products/_doc</strong> = "Add a new card and let the library choose the ID"</li>
      <li><strong>DELETE /products/_doc/1</strong> = "Remove card '1' from the drawer"</li>
    </ul>
    <p><strong>Bulk</strong> operations are like handing a librarian a big stack of cards at once instead of one at a time. Much faster! Use <code>_bulk</code> to add, update, or delete many documents in one request.</p>
  `,
  'm2-l1': `
    <p>The <strong>match</strong> query is like asking a smart search engine: "Find <em>anything about</em> laptops."</p>
    <p>When you type <code>match: { "name": "laptop" }</code>, Elasticsearch doesn't just look for the exact word "laptop". It understands related words too — "notebook", "laptop computer" — because it analyzes text first.</p>
    <p>It works like Google: you can type "running shoes blue size 10" and it figures out which results match best, even if no single product has all those exact words.</p>
    <p><strong>Fuzzy matching</strong> (adding <code>fuzziness: "AUTO"</code>) is like saying "I think it's 'laptop' but maybe it's spelled 'laptap' or 'lapto' — find it anyway!"</p>
  `,
  'm2-l2': `
    <p>A <strong>term</strong> query is the opposite of match. Instead of understanding meaning, it's a <strong>yes/no exact match</strong> check.</p>
    <p>Think of it like scanning a QR code. The scanner doesn't interpret — it just checks: "Is this exactly the right code?"</p>
    <ul>
      <li><strong>match</strong> = search engine understanding (good for text, blog posts, descriptions)</li>
      <li><strong>term</strong> = barcode scanner (good for IDs, categories, exact prices, status flags)</li>
    </ul>
    <p><strong>Important:</strong> Term queries work on <code>keyword</code> fields (like tags, categories). If you try it on a <code>text</code> field, it might not find anything because the text was split into pieces (tokenized) during indexing.</p>
    <p>Think of it like this: <code>term</code> asks "Do you have the exact puzzle piece?", while <code>match</code> asks "Do you have any pieces that fit together?"</p>
  `,
  'm2-l3': `
    <p><strong>Multi-match</strong> is like searching for a book in a library but checking the title, author AND summary all at once.</p>
    <p>Instead of writing three separate match queries, you write one that says: "Search 'wireless mouse' in the name, description, AND tags fields."</p>
    <p><strong>Phrase match</strong> (<code>match_phrase</code>) is like searching for an exact quote in a book. You want "to be or not to be" — not just any document that has "to" and "be" somewhere separately.</p>
    <ul>
      <li><strong>match</strong> = "Find documents with ANY of these words"</li>
      <li><strong>match_phrase</strong> = "Find documents with EXACTLY these words in this ORDER"</li>
      <li><strong>multi_match</strong> = "Search the same words across MULTIPLE fields at once"</li>
    </ul>
    <p>You can even give different fields different importance — like "the title field matters 3x more than the description field."</p>
  `,
  'm3-l1': `
    <p>Aggregations are like asking: <strong>"Give me the summary, not the details."</strong></p>
    <p>Imagine you run a store with 1,000 products. You don't want to see all 1,000 products — you want answers:</p>
    <ul>
      <li>"How many products are in each category?" (<strong>terms</strong> agg)</li>
      <li>"What's the average price?" (<strong>avg</strong> agg)</li>
      <li>"What's the price range?" (<strong>min</strong> to <strong>max</strong>)</li>
    </ul>
    <p>Setting <code>"size": 0</code> means "Don't show me the individual products, just give me the summary." It's like a grocery receipt that shows the total instead of listing every single item.</p>
    <p>Think of aggs as SQL's <code>GROUP BY</code> and <code>COUNT(*)</code> — but way more powerful and flexible.</p>
  `,
  'm3-l2': `
    <p><strong>Metric aggregations</strong> are number crunchers. They take a bunch of numbers and give you one answer.</p>
    <ul>
      <li><strong>avg</strong> = "What's the average test score in the class?"</li>
      <li><strong>sum</strong> = "What's the total revenue from all orders?"</li>
      <li><strong>min</strong> = "What's the cheapest item in the store?"</li>
      <li><strong>max</strong> = "What's the most expensive item?"</li>
      <li><strong>stats</strong> = A report card with ALL the numbers: count, min, max, avg, and sum</li>
    </ul>
    <p>It's like having a calculator that automatically runs a bunch of formulas on your data and hands you the results in one step.</p>
  `,
  'm3-l3': `
    <p><strong>Bucket aggregations</strong> are like sorting toys into bins.</p>
    <p>You tell Elasticsearch: "Put every product into a bin based on its category." Then you get back a list of bins with the count of items in each.</p>
    <ul>
      <li><strong>terms</strong> agg = "Sort all products into their category bins: electronics (15 items), audio (8 items), accessories (12 items)"</li>
      <li><strong>range</strong> agg = "Sort products into price bins: $0-$50 (5 items), $50-$100 (10 items), $100+ (20 items)"</li>
      <li><strong>histogram</strong> agg = "Sort into equal-sized bins like every $100 interval"</li>
    </ul>
    <p>You can even put bucket aggs INSIDE other bucket aggs — like "For each category bin, create sub-bins by price range." That's called a <strong>nested aggregation</strong>.</p>
  `,
  'm4-l1': `
    <p><strong>Mapping</strong> is like telling Elasticsearch what TYPE of data each field contains before you add any data.</p>
    <p>Think of it like labeling jars before a big cooking session:</p>
    <ul>
      <li>"This jar holds <strong>text</strong> (ingredients list)"</li>
      <li>"This jar holds <strong>numbers</strong> (calories)"</li>
      <li>"This jar holds <strong>dates</strong> (expiration date)"</li>
      <li>"This jar holds <strong>geolocations</strong> (store locations)"</li>
    </ul>
    <p>Without mapping, Elasticsearch guesses the type when you add the first document — like guessing what's in a jar just by looking at the outside. Sometimes it guesses wrong, and then you have to start over!</p>
    <p><strong>Key types:</strong> <code>text</code> (full-text search), <code>keyword</code> (exact match, filters), <code>integer</code>/<code>float</code> (numbers), <code>date</code>, <code>boolean</code>, <code>geo_point</code> (lat/lon).</p>
  `,
  'm4-l2': `
    <p><strong>Analyzers</strong> are like a food processor for text. They chop up sentences into smaller pieces (tokens) so Elasticsearch can search them efficiently.</p>
    <p>When you index "The quick brown fox", an analyzer might:</p>
    <ol>
      <li><strong>Character filter</strong> — Remove HTML tags, replace special characters</li>
      <li><strong>Tokenizer</strong> — Split into words: ["The", "quick", "brown", "fox"]</li>
      <li><strong>Token filter</strong> — Lowercase everything, remove common words ("the"), add synonyms</li>
    </ol>
    <p>After analysis, the index stores: ["quick", "brown", "fox"]. Now when you search for "fox", it matches! Without analysis, it would look for the EXACT text "The Quick Brown Fox" and find nothing.</p>
    <p><strong>Standard analyzer</strong> (default) is the all-purpose chopper. <strong>Simple analyzer</strong> just splits on non-letters. <strong>Whitespace analyzer</strong> splits only on spaces. <strong>Keyword analyzer</strong> keeps the whole thing as one piece.</p>
  `,
  'm4-l3': `
    <p><strong>Dynamic mapping</strong> is like elastic-waistband pants — the mapping stretches to fit whatever data you throw at it. You don't need to say "I'll add a price field" beforehand — Elasticsearch sees a number and says "OK, that's a float!"</p>
    <p><strong>Explicit mapping</strong> is like a tailored suit — you specify exact measurements. You say "the price field is a float with 2 decimal places, and the name field uses the English analyzer."</p>
    <p>Dynamic is great for exploring data quickly. Explicit is essential for production because:</p>
    <ul>
      <li>You control the analyzer used</li>
      <li>You can set fields as <code>"index": false</code> for fields you never search (saves space)</li>
      <li>You can disable text analysis for exact-match fields</li>
      <li>You can add <code>fields</code> — like having a field be searchable both as <code>text</code> and <code>keyword</code></li>
    </ul>
    <p>Pro tip: you can use <strong>dynamic templates</strong> — rules like "any field named 'price_*' should automatically be mapped as a float."</p>
  `,
  'm5-l1': `
    <p>A <strong>bool query</strong> is like a police composite sketch: "Find a suspect who is MALE AND has BLUE eyes AND is TALL, but NOT wearing glasses."</p>
    <p>The bool query has four parts:</p>
    <ul>
      <li><strong>must</strong> — ALL conditions must match (AND). "Category IS 'electronics'"</li>
      <li><strong>should</strong> — ANY condition can match (OR). Adds to relevance score. "Has 'laptop' in name OR has 'gaming' in tags"</li>
      <li><strong>filter</strong> — Like must, but doesn't affect score. "Price is BETWEEN $500 and $1500" — this is faster because it doesn't calculate relevance!</li>
      <li><strong>must_not</strong> — EXCLUDE documents. "NOT discontinued"</li>
    </ul>
    <p>Filter is the secret performance trick: use it for yes/no questions (like "price > $100") and use must for relevance questions (like "name matches 'laptop'").</p>
  `,
  'm5-l2': `
    <p><strong>Boosting</strong> is like telling the search engine: "If you find the word in the TITLE, that's more important than finding it in the DESCRIPTION — give those results a higher score."</p>
    <p>Think of a library search. A book whose TITLE contains "dragon" is probably more relevant than a book that mentions dragons once on page 247.</p>
    <p>The <strong>dis_max</strong> (disjunction max) query is like saying "Show me the BEST match from any field, not the average of all fields."</p>
    <p>Example: You search "blue running shoes" across name and description. One shoe has "blue" in the name and nothing in the description. Another has "running shoes" in the description but not the name. Dis_max picks whichever field matched best — it doesn't average them.</p>
    <p><strong>Boosting query</strong> lets you say "Find me laptops, but if any laptop is 'discontinued', reduce its score — don't remove it, just push it lower in results."</p>
  `,
  'm5-l3': `
    <p><strong>Nested queries</strong> handle data within data — like an order that contains multiple items.</p>
    <p>Imagine you have an order with items: "Laptop (quantity: 2)" and "Mouse (quantity: 1)".</p>
    <p>Without nested type, if you search for orders with "laptop quantity > 5", it might match because somewhere in the items array there's a laptop AND somewhere there's a quantity of 2 — but they might be from DIFFERENT items! This is the <strong>array flattening problem</strong>.</p>
    <p>Nested types keep each item separate, like individual index cards inside a folder. Each card is checked independently: "Does THIS specific item have laptop AND qty > 5?"</p>
    <p><strong>Parent-child joins</strong> are like linking two filing cabinets together. You have a "teacher" document and many "student" documents, each connected to a teacher. You can ask: "Find all teachers who have at least one student with a grade of A."</p>
  `,
  'm6-l1': `
    <p><strong>Pipeline aggregations</strong> are like running calculations on your already-calculated results.</p>
    <p>First, you create bucketed results: "Sales by month." Then pipeline aggs calculate NEW numbers FROM those buckets:</p>
    <ul>
      <li><strong>derivative</strong> = "How much did sales CHANGE from last month to this month?"</li>
      <li><strong>moving_avg</strong> = "What's the 3-month average? (smooths out holiday spikes)"</li>
      <li><strong>cumulative_sum</strong> = "Running total: Jan ($100), Feb ($100+$150=$250), Mar ($250+$200=$450)"</li>
      <li><strong>bucket_script</strong> = "For each month, calculate 'revenue minus costs' as a custom formula"</li>
    </ul>
    <p>Think of it as a two-step process: Step 1 — sort the LEGOs into piles by color. Step 2 — for each pile, count how many bricks and calculate the weight.</p>
  `,
  'm6-l2': `
    <p><strong>Nested aggregations</strong> are like asking: "For EACH category bin, give me the average price." That's a metric agg inside a bucket agg.</p>
    <p>You can go deeper: "For each category, create sub-bins by price range (cheap, moderate, expensive), and within those, find the top-rated product." Three levels deep!</p>
    <p><strong>Geo aggregations</strong> are location-based:</p>
    <ul>
      <li><strong>geo_distance</strong> = "Group all stores into bins: within 1 mile, within 5 miles, within 10 miles of my location"</li>
      <li><strong>geohash_grid</strong> = "Bucket stores into a map grid to see density — like a heatmap"</li>
      <li><strong>geo_bounds</strong> = "What's the bounding box that contains all my stores?"</li>
    </ul>
    <p>Great for apps like "Find restaurants near me" or delivery route optimization.</p>
  `,
  'm6-l3': `
    <p><strong>Scripted aggregations</strong> let you write custom formulas when the built-in ones aren't enough.</p>
    <p>Imagine you have product prices in different currencies. A regular avg agg would give you a meaningless number (mixing $10 + €20 + ¥500). With a script, you can convert everything to USD first, then average.</p>
    <p>Scripts use the <strong>Painless</strong> scripting language (designed to be safe and fast). Think of Painless as elasticsearch-safe JavaScript — no file access, no network calls, just math and string operations.</p>
    <p>Use scripts sparingly! They can be slower than built-in aggs because they run on every document. It's like handwriting each calculation instead of using a calculator button.</p>
  `,
  'm7-l1': `
    <p>An Elasticsearch <strong>cluster</strong> is like a team of people working together.</p>
    <p>Each person (node) has a job:</p>
    <ul>
      <li><strong>Master node</strong> = The team leader. Decides where things go and manages the to-do list. Only one leader at a time!</li>
      <li><strong>Data node</strong> = The worker who actually stores boxes (data) on shelves. Does the heavy lifting.</li>
      <li><strong>Ingest node</strong> = The quality inspector at the door. Cleans and processes data before it goes to storage.</li>
      <li><strong>Coordinating node</strong> = The receptionist. Takes requests from outside and routes them to the right worker.</li>
    </ul>
    <p>In small clusters, one person might do multiple jobs. In large clusters, each person specializes.</p>
  `,
  'm7-l2': `
    <p><strong>Cluster state</strong> is like the team's whiteboard that shows: "Which shelves exist? Where is each shelf located? Who's in charge?"</p>
    <p>Every node has a copy of this whiteboard so everyone knows what's happening. When something changes (a new shelf is added), the master updates the whiteboard and tells everyone.</p>
    <p><strong>Discovery</strong> is how new team members find the group:</p>
    <ol>
      <li>A new person joins and shouts "Is anyone here?" (sends a discovery ping)</li>
      <li>An existing member responds "Yeah, follow me! The leader is over there."</li>
      <li>The new person gets introduced to the team and gets a copy of the whiteboard.</li>
    </ol>
    <p>If the leader disappears (master node fails), the team has an election and picks a new leader. Elasticsearch uses <strong>Zen Discovery</strong> (or the newer <strong>Quorum-based</strong> discovery in version 8+) to avoid having two leaders at once.</p>
  `,
  'm7-l3': `
    <p>An Elasticsearch index is split into <strong>shards</strong> — like cutting a big book into chapters and giving each chapter to a different person to read.</p>
    <p><strong>Primary shards</strong> = the original chapters. <strong>Replica shards</strong> = photocopies of each chapter, kept by other team members in case the original is lost.</p>
    <p><strong>Shard allocation</strong> is the master deciding: "Alice, you keep chapter 1. Bob, you keep chapter 2. And both of you give a copy to Charlie for backup."</p>
    <p><strong>Rebalancing</strong> happens when a new node joins. The master says: "Charlie just joined! Bob, give chapter 3 to Charlie so we all have equal work."</p>
    <p>Good shard strategy is like deciding how many slices to cut a pizza into: too few slices (shards) and everyone fights over them. Too many slices and you waste time handling tiny pieces.</p>
    <p>A good rule: about 20-40 GB per shard, and 1-2 shards per GB of heap memory.</p>
  `,
  'm8-l1': `
    <p><strong>Index Lifecycle Management (ILM)</strong> is like a conveyor belt that automatically moves your data through stages as it ages.</p>
    <p>Think of a warehouse for Amazon returns:</p>
    <ul>
      <li><strong>Hot phase</strong> = Today's returns. On the front shelf, quick access. SSDs for speed.</li>
      <li><strong>Warm phase</strong> = This month's returns. On a regular shelf, still accessible but slower.</li>
      <li><strong>Cold phase</strong> = Last year's returns. In the basement. You CAN get them but it takes a minute.</li>
      <li><strong>Frozen phase</strong> = Returns from 5 years ago. Sealed box, takes hours to open. Very cheap storage.</li>
      <li><strong>Delete phase</strong> = Old stuff gets thrown away automatically when it's past the retention date.</li>
    </ul>
    <p>ILM does all this automatically based on the age of the data or the size of the index. No manual moving!</p>
  `,
  'm8-l2': `
    <p><strong>Rollover</strong> is like replacing a full notebook with a new one automatically.</p>
    <p>You start with "logs-000001". When it reaches 50 GB or 30 days old, Elasticsearch automatically creates "logs-000002" and directs new writes there. The old index stays as-is for searching.</p>
    <p><strong>Shrink</strong> is like taking a thick book and making it thinner by combining small chapters. If you had 10 shards for high write speed, after the data stops changing, you can shrink to 1-2 shards for efficient searching.</p>
    <p>Think of it like a party: during the party (hot phase), you need many bartenders (shards) to serve everyone fast. After the party (warm/cold), you only need one bartender since nobody's ordering anymore.</p>
  `,
  'm8-l3': `
    <p>An <strong>ILM policy</strong> is like a set of rules you write for your automated warehouse conveyor belt.</p>
    <p>Example: "For my application logs:"</p>
    <ol>
      <li><strong>Hot</strong> (7 days) — Keep logs on fast SSDs with 3 replicas for fast searching</li>
      <li><strong>Warm</strong> (30 days) — Move to standard storage, reduce to 1 replica</li>
      <li><strong>Cold</strong> (90 days) — Move to cheaper storage, free up memory</li>
      <li><strong>Delete</strong> (after 90 days) — Permanently remove old logs</li>
    </ol>
    <p>You use an <strong>index template</strong> to say "ALL indexes named 'logs-*' should use this policy." Then every new log index automatically follows the rules.</p>
    <p>This saves huge amounts of money — you're not paying for fast storage for 5-year-old data nobody looks at!</p>
  `,
  'm9-l1': `
    <p><strong>Cluster health</strong> is like a car's dashboard check engine light.</p>
    <ul>
      <li><strong>Green</strong> = All good! All primary and replica shards are working.</li>
      <li><strong>Yellow</strong> = Caution! All primary shards work but some replicas are missing (maybe a node went down).</li>
      <li><strong>Red</strong> = Danger! Some primary shards are missing — data is unavailable and possibly lost.</li>
    </ul>
    <p><strong>Node stats</strong> are like checking each worker's vital signs: "Alice has used 70% of her memory, Bob's CPU is at 90%."</p>
    <p>You can check these in real-time with the <code>_cat/health</code>, <code>_cluster/health</code>, and <code>_nodes/stats</code> APIs. It's like having a dashboard for your entire search cluster.</p>
  `,
  'm9-l2': `
    <p><strong>Slow logs</strong> are like Elasticsearch keeping a diary of queries that took too long.</p>
    <p>You set a threshold: "Log any search that takes longer than 500ms." Elasticsearch then writes entries to a special log file whenever a slow query happens.</p>
    <p>It's like a teacher timing students on a math test: anyone who takes more than 10 minutes gets flagged so the teacher can figure out why.</p>
    <p><strong>Profiling</strong> (<code>_profile</code> API) is even more detailed — it's like attaching a stopwatch to each step of a query:</p>
    <ul>
      <li>"Finding matching documents: 50ms"</li>
      <li>"Calculating relevance scores: 20ms"</li>
      <li>"Fetching source data: 10ms"</li>
    </ul>
    <p>This tells you EXACTLY which part is slow so you know what to fix.</p>
  `,
  'm9-l3': `
    <p><strong>Indexing optimization</strong> is about making data arrive faster. Think of a fast-food drive-through:</p>
    <ul>
      <li><strong>Bulk requests</strong> = Ordering for the whole family at once instead of one burger at a time</li>
      <li><strong>Refresh interval</strong> = How often the menu board updates. Default is 1 second. Set to 30 seconds during a bulk import for speed.</li>
      <li><strong>Translog</strong> = The kitchen's notepad. If the power goes out, they use the notepad to remember what orders were in progress.</li>
    </ul>
    <p><strong>Query optimization</strong> is about getting answers faster:</p>
    <ul>
      <li><strong>Use filter context</strong> for yes/no questions (doesn't calculate scores, uses caches)</li>
      <li><strong>Limit fields</strong> with <code>_source</code> — don't fetch 100 fields if you only need 3</li>
      <li><strong>Use keyword fields</strong> for sorting and aggregations</li>
      <li><strong>Avoid wildcard queries</strong> starting with <code>*</code> (like <code>*laptop</code>) — they're very slow</li>
    </ul>
  `,
  'm10-l1': `
    <p>Elasticsearch <strong>security</strong> is like a building with multiple security layers.</p>
    <p><strong>Authentication</strong> = Checking ID at the front desk. "Who are you?" You need a username/password or an API key to enter.</p>
    <p>Built-in users: <code>elastic</code> (super admin — like building owner), <code>kibana_system</code> (for Kibana itself), <code>logstash_system</code> (for Logstash).</p>
    <p><strong>Authorization</strong> = Your ID badge determines which floors you can access. A regular employee can't go into the server room.</p>
    <p>You can authenticate with:</p>
    <ul>
      <li>Username/password (native realm)</li>
      <li>LDAP/Active Directory (your company login)</li>
      <li>SAML / OpenID Connect (single sign-on)</li>
      <li>API Keys (for programs, not people)</li>
    </ul>
  `,
  'm10-l2': `
    <p><strong>RBAC</strong> is like giving employees different key cards based on their job.</p>
    <p>Instead of giving each person individual permissions (which is a nightmare with 1000 employees), you create <strong>roles</strong>:</p>
    <ul>
      <li><strong>admin</strong> = Keys to every room. Can read, write, delete, change settings.</li>
      <li><strong>developer</strong> = Keys to the dev floor. Can read and write, but not delete.</li>
      <li><strong>analyst</strong> = Keys to the reading room only. Can read data but not change anything.</li>
      <li><strong>log-viewer</strong> = Can only access indexes starting with "logs-".</li>
    </ul>
    <p>Permissions are granular: you control who can read/write/delete which indexes, and which cluster operations (like creating users) they can perform.</p>
    <p>It's like a locker room where each locker is an index, and the key card says: "You may open lockers labeled 'sales-*' but not 'hr-*'."</p>
  `,
  'm10-l3': `
    <p><strong>TLS/SSL</strong> is like a secure tunnel between two buildings. Even if someone taps the pipe, they only see scrambled garbage, not your actual data.</p>
    <p>Everything inside the tunnel is encrypted — queries, results, passwords. Without TLS, anyone on the same network can read your Elasticsearch traffic like an open postcard.</p>
    <p>Elasticsearch 8+ enables TLS by default. You need certificates (like digital passports) to set up the encrypted connection.</p>
    <p><strong>Audit logging</strong> is like a security camera that records EVERYTHING:</p>
    <ul>
      <li>Who logged in? When?</li>
      <li>Who ran a DELETE request?</li>
      <li>Who tried to access something they shouldn't?</li>
      <li>Who changed security settings?</li>
    </ul>
    <p>Audit logs are essential for compliance (SOC 2, HIPAA, GDPR) and for catching security breaches.</p>
  `,
  'm11-l1': `
    <p><strong>Cross-Cluster Search (CCS)</strong> is like having a library card that lets you search books from MULTIPLE LIBRARIES in different cities — all from one search box.</p>
    <p>You connect to your local cluster, register remote clusters (by address), and then search like: "Find 'urgent' in the 'logs' index across ALL connected clusters."</p>
    <p>Think of it as a universal remote that controls multiple TVs:</p>
    <ul>
      <li>Local cluster = TV in your living room</li>
      <li>Remote cluster = TV in your neighbor's house (with permission)</li>
      <li>CCS = One remote that can change channels on BOTH TVs at once</li>
    </ul>
    <p>You specify remote indexes like <code>cluster_a:logs-2024-01</code>, <code>cluster_b:logs-2024-01</code>. Results come back combined in one response.</p>
  `,
  'm11-l2': `
    <p><strong>Cross-Cluster Replication (CCR)</strong> is like having a backup generator at a different location.</p>
    <p>If your main cluster goes down (power outage, internet failure, data center fire), your replicated data on another cluster keeps working. You can switch to the backup immediately.</p>
    <p>Two modes:</p>
    <ul>
      <li><strong>Active-Passive (follow)</strong> — One cluster is the leader (read/write). Other clusters only FOLLOW (read-only copies). If the leader dies, you manually promote a follower.</li>
      <li><strong>Active-Active</strong> — NOT directly supported. You need to design your application to write to multiple clusters.</li>
    </ul>
    <p>CCR works in near-real-time. Changes on the leader are sent to followers within seconds — like a walkie-talkie where one person talks and the others listen.</p>
  `,
  'm11-l3': `
    <p><strong>CCR use cases</strong> in real life are everywhere!</p>
    <p><strong>Disaster recovery:</strong> A bank has clusters in New York, London, and Tokyo. If New York goes offline, London takes over. Customers don't even notice.</p>
    <p><strong>Search closer to users:</strong> A global e-commerce site puts a cluster in the US and one in Europe. European users search the European cluster (faster!). Changes from the US are replicated to Europe overnight.</p>
    <p><strong>Reporting without affecting production:</strong> You have a "reporting" cluster that follows your "production" cluster. Your team can run huge reporting queries on the report cluster without slowing down the live website.</p>
    <p><strong>Multi-region compliance:</strong> GDPR requires EU user data to stay in the EU. You set up EU-only clusters with CCR to a global reporting cluster that only sees anonymized data.</p>
    <p>CCR is the seatbelt of Elasticsearch — you hope you never need it, but when things go wrong, you're glad it's there!</p>
  `,
};

window.eli5ElasticsearchData = eli5ElasticsearchData;