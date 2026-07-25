/**
 * ELI5 Neo4j Data — "Explain Like I'm 5" simplified explanations
 * for every lesson in the Neo4j Academy.
 *
 * Each key is a lesson id (e.g. "m1-l1") and the value is HTML
 * with plain‑language, analogy‑driven explanations.
 */

const eli5Neo4jData = {
  /* ─── Module 1: Nodes, Labels & Properties ─── */
  'm1-l1': `
    <p>Imagine a <strong>giant corkboard</strong> with photos of people and movies pinned to it, connected by pieces of string. That's a graph database!</p>
    <p>Each photo on the board is a <strong>node</strong> — it represents one thing, like a person ("Alice") or a movie ("The Matrix").</p>
    <p>Nodes have <strong>labels</strong> (like a sticky note saying "this is a Person" or "this is a Movie") and <strong>properties</strong> (like writing a person's age or a movie's release year on the back of the photo).</p>
    <p>In Neo4j's language (Cypher), a node looks like <code>()</code> — just a pair of parentheses. Inside them you can add labels and info.</p>
    <p><strong>Think of it like this:</strong> If a spreadsheet is a grid of rows and columns, a graph is a web of connected dots. The dots are your data, and the strings between them are the relationships!</p>
  `,
  'm1-l2': `
    <p>Think of <strong>labels</strong> like colored stickers on boxes. All the "Person" boxes have a blue sticker. All the "Movie" boxes have a red sticker. When you want to find only the people, you just look for blue stickers!</p>
    <p>In Cypher, you write <code>(p:Person)</code> — the <code>:Person</code> part is like saying "only show me boxes with the blue Person sticker." The <code>p</code> is a short name you give to each person you find, like a nickname.</p>
    <p>Labels help you group things so you don't have to look at EVERY box in the warehouse. It's like sorting LEGOs by color before building!</p>
  `,
  'm1-l3': `
    <p><strong>Properties</strong> are the details written on an index card for each node. If a node is a person, the index card says: name = "Alice", age = 30, city = "New York".</p>
    <p>Different <strong>data types</strong> are like different kinds of information on the card:</p>
    <ul>
      <li><strong>String</strong> = Words/text (like a name or address)</li>
      <li><strong>Integer</strong> = Whole numbers (like age: 30)</li>
      <li><strong>Float</strong> = Numbers with decimals (like price: 19.99)</li>
      <li><strong>Boolean</strong> = True/False (like "is student? Yes")</li>
      <li><strong>List</strong> = A list of things (like favorite colors: ["blue", "green"])</li>
    </ul>
    <p>In Cypher, you can filter by properties using curly braces <code>{}</code>:</p>
    <p><code>(p:Person {name: 'Alice'})</code> — like saying "find the folder labeled 'Person' and inside it, find the one with 'Alice' written on it."</p>
  `,

  /* ─── Module 2: Relationships & Directions ─── */
  'm2-l1': `
    <p><strong>Relationships</strong> are the strings connecting two photos on the corkboard. They explain HOW two things are connected.</p>
    <p>Imagine you have two photos: "Alice" and "The Matrix." The string between them has a label: "ACTED_IN." That means Alice acted in The Matrix!</p>
    <p>In Cypher, relationships look like arrows: <code>--></code> or <code><--</code>. The arrow shows the direction.</p>
    <p><code>(p:Person)-[:ACTED_IN]->(m:Movie)</code> — read this as: "From a Person, FOLLOW the ACTED_IN arrow TO reach a Movie."</p>
    <p><strong>Real-world example:</strong> In a social network like Facebook, a relationship connects you to your friends. "Alice KNOWS Bob" means there's a string between Alice and Bob labeled "KNOWS."</p>
  `,
  'm2-l2': `
    <p>Think of relationships like <strong>one-way streets</strong> and <strong>two-way streets</strong>.</p>
    <p><code>--></code> means the relationship goes FROM one node TO another. Like "Alice ACTED_IN The Matrix" — the arrow points from Alice to the movie.</p>
    <p><code><--</code> means the relationship goes the other way. "The Matrix was ACTED_IN BY Alice" — the arrow points from the movie to the person.</p>
    <p>You can also write a relationship without direction using <code>--</code>, which means "I don't care which direction it goes."</p>
    <p><strong>Important:</strong> The direction matters for your query! If you use the wrong arrow, you might find nothing. It's like walking the wrong way down a one-way street!</p>
  `,
  'm2-l3': `
    <p>Sometimes the connections themselves have extra info. Think of a <strong>friendship bracelet</strong> — it's not just that two people are connected; it also has details like when they became friends or how they met.</p>
    <p>In Neo4j, relationships can have <strong>properties</strong> too! A "RATED" relationship between a person and a movie might have a property: rating = 5 (stars).</p>
    <p>In Cypher, relationship properties go inside the square brackets:</p>
    <p><code>(p:Person)-[r:RATED {stars: 5}]->(m:Movie)</code></p>
    <p>This reads as: "Find a Person who rated a Movie 5 stars." The relationship itself holds the rating info, not the person or the movie.</p>
    <p><strong>Think of it like this:</strong> A relationship property is a sticky note on the string connecting two photos, not on either photo itself!</p>
  `,

  /* ─── Module 3: Querying with Cypher — MATCH & RETURN ─── */
  'm3-l1': `
    <p><strong>MATCH</strong> is like saying "FIND" — it tells Neo4j what pattern to look for in the graph.</p>
    <p><strong>RETURN</strong> is like saying "SHOW ME" — it tells Neo4j what information to give you back.</p>
    <p>Together: <code>MATCH (n) RETURN n</code> means "Find ALL nodes and show them to me."</p>
    <p>Think of it like a library search:</p>
    <ul>
      <li><strong>MATCH</strong> = "Find all books that are fiction"</li>
      <li><strong>RETURN</strong> = "Show me their titles and authors"</li>
    </ul>
    <p>You can MATCH more complex patterns too:</p>
    <p><code>MATCH (p:Person)-[:ACTED_IN]->(m:Movie) RETURN p.name, m.title</code></p>
    <p>This is like saying: "Find all people who acted in movies, and show me each person's name and the movie title."</p>
  `,
  'm3-l2': `
    <p><strong>WHERE</strong> is like a filter — it helps you narrow down your search.</p>
    <p>Think of shopping online: you search for "shoes" (that's MATCH), then you filter by "size 10, color black, under $100" (that's WHERE!).</p>
    <p>In Cypher:</p>
    <p><code>MATCH (p:Person) WHERE p.age > 30 RETURN p.name</code></p>
    <p>This means: "Find all people, BUT only show me those older than 30."</p>
    <p>You can use WHERE with:</p>
    <ul>
      <li><code>></code>, <code><</code>, <code>=</code>, <code>>=</code>, <code><=</code> — comparison operators</li>
      <li><code>WHERE p.name CONTAINS 'Ali'</code> — partial text match</li>
      <li><code>WHERE p.name STARTS WITH 'A'</code> — starts with a letter</li>
      <li><code>WHERE p.age IS NOT NULL</code> — check if a property exists</li>
    </ul>
    <p><strong>Real-world example:</strong> A Netflix recommendation system uses WHERE to filter movies you haven't watched yet!</p>
  `,
  'm3-l3': `
    <p><strong>COUNT</strong> is like tallying up how many things match. "How many people acted in The Matrix?"</p>
    <p><code>MATCH (p:Person)-[:ACTED_IN]->(m:Movie {title: 'The Matrix'}) RETURN count(p)</code></p>
    <p><strong>ORDER BY</strong> sorts your results, like putting test scores from highest to lowest:</p>
    <p><code>MATCH (p:Person) RETURN p.name, p.age ORDER BY p.age DESC</code> — shows oldest people first.</p>
    <p><strong>LIMIT</strong> caps how many results you get, like saying "only show me the top 5":</p>
    <p><code>MATCH (p:Person) RETURN p.name LIMIT 5</code></p>
    <p><strong>SKIP</strong> jumps past some results, useful for pagination (like "show me results 6-10"):</p>
    <p><code>MATCH (p:Person) RETURN p.name SKIP 5 LIMIT 5</code></p>
    <p><strong>Think of it like this:</strong> COUNT is counting jellybeans in a jar. ORDER BY is lining them up by color. LIMIT is taking only the first few. SKIP is ignoring the first ones you counted!</p>
  `,

  /* ─── Module 4: Cypher — CREATE, MERGE & DELETE ─── */
  'm4-l1': `
    <p><strong>CREATE</strong> is like adding a new photo to the corkboard and tying some strings to it.</p>
    <p>To add a new person:</p>
    <p><code>CREATE (p:Person {name: 'Diana', age: 28})</code></p>
    <p>This pins a new photo (node) labeled "Person" with "Diana, 28" written on the back (properties).</p>
    <p>To add a relationship between two things at the same time:</p>
    <p><code>MATCH (p:Person {name: 'Diana'}), (m:Movie {title: 'The Matrix'}) CREATE (p)-[:ACTED_IN]->(m)</code></p>
    <p>This first finds Diana and The Matrix, then ties a string labeled "ACTED_IN" from Diana to the movie.</p>
    <p><strong>Warning:</strong> CREATE always tries to make NEW things. If Diana already exists, it will create a duplicate! For that, use MERGE instead.</p>
  `,
  'm4-l2': `
    <p><strong>MERGE</strong> is the smart cousin of CREATE. It checks first: "Does this thing already exist?" If yes, it does nothing. If no, it creates it.</p>
    <p>Think of it like checking into a hotel. The clerk says: "Let me check if you already have a reservation... No? OK, I'll create one now." That's MERGE!</p>
    <p><code>MERGE (p:Person {name: 'Eve'})</code> — "Is there already a Person named Eve? If not, create one. If yes, just use the existing one."</p>
    <p>You can combine MERGE with relationships too:</p>
    <p><code>MATCH (p:Person {name: 'Alice'}), (m:Movie {title: 'Inception'}) MERGE (p)-[:ACTED_IN]->(m)</code></p>
    <p>"Find Alice and Inception. If there's no ACTED_IN relationship between them, create one. If there is, leave it alone."</p>
    <p><strong>Best practice:</strong> Use MERGE for most of your creates to avoid duplicate data!</p>
  `,
  'm4-l3': `
    <p><strong>DELETE</strong> removes things from the graph, like taking a photo off the corkboard.</p>
    <p><code>MATCH (p:Person {name: 'Charlie'}) DELETE p</code></p>
    <p>But there's a catch! If the node has ANY strings (relationships) attached to it, Neo4j will say: "I can't delete this — it still has connections!"</p>
    <p>That's where <strong>DETACH DELETE</strong> comes in. It's like cutting ALL the strings first, THEN removing the photo:</p>
    <p><code>MATCH (p:Person {name: 'Charlie'}) DETACH DELETE p</code></p>
    <p><strong>Think of it this way:</strong> DELETE is like removing a knot from a net. DETACH DELETE is like cutting all the ropes first so the knot can fall out freely.</p>
    <p><strong>Warning:</strong> Be careful with DETACH DELETE! It can remove many relationships at once and break connections in your graph.</p>
  `,

  /* ─── Module 5: Graph Data Modeling ─── */
  'm5-l1': `
    <p><strong>Data modeling</strong> is like planning how you'd organize photos on a corkboard BEFORE pinning them up.</p>
    <p>You need to decide:</p>
    <ul>
      <li>What are the <strong>node labels</strong>? (Person, Movie, Product, Store...)</li>
      <li>What are the <strong>relationship types</strong>? (ACTED_IN, PURCHASED, LOCATED_IN...)</li>
      <li>What <strong>properties</strong> go on each? (A Person has a name and age; a Movie has a title and year...)</li>
    </ul>
    <p>A good rule: <strong>nouns become nodes, verbs become relationships.</strong></p>
    <p>For example: "Alice (noun/person) ACTED_IN (verb/relationship) The Matrix (noun/movie)"</p>
    <p><strong>Think of it like this:</strong> If you were building a family tree, each person is a node and the lines between them are relationships like "PARENT_OF" or "MARRIED_TO."</p>
  `,
  'm5-l2': `
    <p>Let's model a <strong>real-world example: a music streaming service</strong> like Spotify.</p>
    <ul>
      <li><strong>Nodes:</strong> User, Artist, Song, Playlist, Album</li>
      <li><strong>Relationships:</strong> LIKES (User -> Song), FOLLOWS (User -> Artist), CREATED (User -> Playlist), INCLUDES (Playlist -> Song), PERFORMED_BY (Song -> Artist)</li>
    </ul>
    <p>With this model, you can answer questions like:</p>
    <ul>
      <li>"Find all songs liked by users who also like the same artist as Alice" (recommendation engine!)</li>
      <li>"What playlists include songs from this album?"</li>
      <li>"Which artists are most followed by users in New York?"</li>
    </ul>
    <p><strong>Think of it like this:</strong> Designing a graph model is like drawing a map of a city. You decide what landmarks to put on the map (nodes) and what roads connect them (relationships). A good map makes it easy to find your way!</p>
  `,
  'm5-l3': `
    <p>Here are some <strong>common modeling patterns</strong> (and mistakes to avoid):</p>
    <p><strong>✅ DO: Use labels for categories, not properties.</strong> Use <code>:Person</code> not <code>{type: 'person'}</code>. Labels make queries faster and cleaner.</p>
    <p><strong>✅ DO: Name relationships clearly.</strong> Use verbs like <code>ACTED_IN</code>, <code>PURCHASED</code>, <code>LIVES_IN</code>. Avoid generic names like <code>RELATED_TO</code>.</p>
    <p><strong>❌ DON'T: Create too many relationship types.</strong> Having 5-10 well-chosen types is better than 50 confusing ones.</p>
    <p><strong>❌ DON'T: Put everything in one node label.</strong> Splitting data into meaningful labels makes the graph easier to work with.</p>
    <p><strong>💡 Real-world example — Fraud Detection:</strong> Banks model transactions as relationships between accounts. A fraudulent pattern might be: "Many accounts sending money to one account then to another" — which is easy to spot in a graph but hard in SQL!</p>
  `,

  /* ─── Module 6: Indexing & Constraints ─── */
  'm6-l1': `
    <p>An <strong>index</strong> is like the index at the back of a textbook. Instead of reading every page to find "Neo4j," you look it up in the index and jump straight to the right page!</p>
    <p>Without an index, Neo4j checks every single node — like reading every page of the book. With an index, it knows exactly where to look. Much faster!</p>
    <p><code>CREATE INDEX FOR (p:Person) ON (p.name)</code></p>
    <p>This creates an index on Person names. Now searching for <code>MATCH (p:Person {name: 'Alice'})</code> is super fast because Neo4j uses the index.</p>
    <p><strong>Think of it like this:</strong> If your closet is organized by color, finding a red shirt is instant. That's an index! Without it, you'd have to dig through the whole pile.</p>
    <p>Indexes are great for properties you search by frequently — like usernames, email addresses, or product IDs.</p>
  `,
  'm6-l2': `
    <p>A <strong>constraint</strong> is like a rule that Neo4j enforces to keep your data clean. It's like having a bouncer at the door who checks IDs.</p>
    <p><strong>Unique constraint</strong> — "There can only be ONE Person with email 'alice@email.com':"</p>
    <p><code>CREATE CONSTRAINT FOR (p:Person) REQUIRE p.email IS UNIQUE</code></p>
    <p>If you try to add another person with the same email, Neo4j says "Nope, that's a duplicate!"</p>
    <p><strong>Node key constraint</strong> — "Every Person MUST have a name AND the name must be unique:"</p>
    <p><code>CREATE CONSTRAINT FOR (p:Person) REQUIRE (p.name, p.email) IS NODE KEY</code></p>
    <p>Constraints also automatically create indexes for the constrained properties. Two for the price of one!</p>
    <p><strong>Real-world example:</strong> In a social media app, every username must be unique. A constraint on username ensures no two people can have the same handle.</p>
  `,
  'm6-l3': `
    <p><strong>Schema design</strong> is the blueprint of your graph. A good schema makes queries fast and data clean.</p>
    <p><strong>Composite indexes</strong> — for queries on multiple properties at once:</p>
    <p><code>CREATE INDEX FOR (p:Person) ON (p.name, p.age)</code></p>
    <p>This helps queries like: "Find all people named Alice who are older than 25."</p>
    <p><strong>Text indexes</strong> — for searching within text (like a Google search for your graph):</p>
    <p><code>CREATE TEXT INDEX FOR (m:Movie) ON (m.title)</code></p>
    <p>Now you can search for movies whose title CONTAINS "Matrix" or starts with "The."</p>
    <p><strong>Performance tip:</strong> 
    <ul>
      <li>Index properties you search by frequently</li>
      <li>Don't index everything — indexes slow down writes</li>
      <li>Use constraints for data that MUST be unique (emails, IDs, usernames)</li>
      <li>Monitor slow queries and add indexes where needed</li>
    </ul>
    <p><strong>Think of it like this:</strong> Indexes are like a library's card catalog. A good catalog helps you find books fast. A bad one or no catalog means searching the shelves forever.</p>
  `,

  /* ─── Module 7: APOC Utility Library ─── */
  'm7-l1': `
    <p><strong>APOC</strong> (Awesome Procedures On Cypher) is like a giant toolbox full of special tools for Neo4j. Instead of writing complex code yourself, you just pick the right tool from the toolbox!</p>
    <p>Think of APOC as the "swiss army knife" for Neo4j. Need to convert a date format? APOC has a tool for that. Need to call a REST API from inside Neo4j? APOC has a tool for that too!</p>
    <p>To install APOC, you add it to the plugins folder of your Neo4j database and restart. Then hundreds of new procedures become available.</p>
    <p>Example: <code>CALL apoc.help('date')</code> — "Show me all APOC tools related to dates."</p>
    <p><strong>Think of it like this:</strong> Cypher is like basic LEGO bricks. APOC adds special pre-built pieces like wheels, windows, and doors that make building much faster!</p>
  `,
  'm7-l2': `
    <p>APOC is great at transforming and converting data.</p>
    <p><strong>Date/Time conversion:</strong></p>
    <p><code>CALL apoc.date.parse('2024-01-15', 's', 'yyyy-MM-dd')</code> — converts a date string to a timestamp.</p>
    <p><strong>String manipulation:</strong></p>
    <p><code>CALL apoc.text.join(['Hello', 'World'], ' ')</code> — joins words together like "Hello World."</p>
    <p><code>CALL apoc.text.urlencode('hello world')</code> — converts text to a URL-friendly format.</p>
    <p><strong>Data import from CSV/JSON:</strong></p>
    <p><code>CALL apoc.load.csv('/path/to/file.csv')</code> — loads a CSV file into Neo4j.</p>
    <p><code>CALL apoc.load.json('https://api.example.com/data')</code> — fetches JSON from a URL and loads it.</p>
    <p><strong>Real-world example:</strong> You have a CSV file with 10,000 customer records. Instead of writing complex import code, use APOC to load the CSV and create nodes in one command!</p>
  `,
  'm7-l3': `
    <p>APOC helps with graph operations and database maintenance too.</p>
    <p><strong>Graph operations:</strong></p>
    <p><code>CALL apoc.nodes.get(node_ids)</code> — get nodes by their internal IDs.</p>
    <p><code>CALL apoc.graph.fromData(nodes, relationships, 'myGraph')</code> — creates an in-memory graph projection.</p>
    <p><strong>Virtual nodes and relationships:</strong> You can create temporary, virtual connections that don't save to the database — great for visualizations!</p>
    <p><strong>Triggers:</strong> APOC lets you set up triggers that automatically run when data changes, like firing an event when a new person node is created.</p>
    <p><strong>Database maintenance:</strong></p>
    <p><code>CALL apoc.meta.graph()</code> — shows you what your graph looks like: what labels and relationship types exist, and how they connect.</p>
    <p><code>CALL apoc.schema.assert({}, {})</code> — validates or updates your schema.</p>
    <p><strong>Think of it like this:</strong> If Cypher queries are the instructions, APOC procedures are the power tools that get the job done faster!</p>
  `,

  /* ─── Module 8: Graph Algorithms ─── */
  'm8-l1': `
    <p><strong>PageRank</strong> is the algorithm Google used to rank web pages. It answers: "Which nodes are the most important?"</p>
    <p>Think of it like a popularity contest in a school. A person is "popular" if:</p>
    <ol>
      <li>Many people follow them (many incoming relationships)</li>
      <li>The people who follow them are ALSO popular</li>
    </ol>
    <p>That's exactly how PageRank works! A node is important if many other important nodes link to it.</p>
    <p><strong>In Neo4j:</strong></p>
    <p><code>CALL gds.pageRank.stream('myGraph') YIELD nodeId, score RETURN gds.util.asNode(nodeId).name, score</code></p>
    <p><strong>Real-world example: Fraud detection</strong> — In a network of bank accounts, the most central accounts (high PageRank) might be the ones money flows through the most — possibly fraud rings!</p>
  `,
  'm8-l2': `
    <p><strong>Shortest Path</strong> algorithms find the quickest route between two nodes. It's like Google Maps finding the fastest driving route!</p>
    <p><code>MATCH (start:City {name: 'New York'}), (end:City {name: 'Los Angeles'}) CALL gds.shortestPath.dijkstra.stream('roadNetwork', {sourceNode: start, targetNode: end, relationshipWeightProperty: 'distance'}) YIELD nodeIds, totalCost RETURN nodeIds, totalCost</code></p>
    <p>The algorithm (Dijkstra's) works like this:</p>
    <ol>
      <li>Start at the source node</li>
      <li>Look at all neighbors, note the distance to each</li>
      <li>Move to the closest unvisited neighbor</li>
      <li>Repeat until you reach the destination</li>
    </ol>
    <p><strong>Real-world example: Delivery route optimization</strong> — A company like Amazon uses shortest path algorithms to find the most efficient delivery routes, saving millions in fuel costs!</p>
  `,
  'm8-l3': `
    <p><strong>Community detection</strong> algorithms find groups of nodes that are tightly connected to each other. It's like figuring out which friend groups exist in a school — the jocks, the artists, the gamers.</p>
    <p><strong>Louvain algorithm:</strong> One of the most popular community detection methods. It finds clusters by looking for nodes that are more connected within their group than to the rest of the network.</p>
    <p><strong>Label Propagation:</strong> Each node starts with a unique label, then nodes "vote" by adopting their neighbors' most common label. After enough rounds, community labels emerge.</p>
    <p><strong>Real-world examples:</strong></p>
    <ul>
      <li><strong>Social networks:</strong> Find groups of friends who all know each other</li>
      <li><strong>Fraud detection:</strong> Detect organized fraud rings by finding suspicious clusters</li>
      <li><strong>Recommendation engines:</strong> "People in this community also liked..."</li>
      <li><strong>Biology:</strong> Find protein interaction groups in medical research</li>
    </ul>
    <p><strong>Think of it like this:</strong> At a party, people naturally form small groups to talk. Community detection is like looking down from above and figuring out who's in which conversation group!</p>
  `,

  /* ─── Module 9: Neo4j with Node.js/Python Drivers ─── */
  'm9-l1': `
    <p>The <strong>Neo4j JavaScript Driver</strong> lets your website or app talk to Neo4j using JavaScript (Node.js).</p>
    <p>Think of it like a phone line between your app and the database. Your app dials the number (connects), asks a question (runs a query), and gets an answer (processes results).</p>
    <pre><code>const neo4j = require('neo4j-driver');\nconst driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));\nconst session = driver.session();\nconst result = await session.run('MATCH (p:Person) RETURN p.name');\nresult.records.forEach(record => console.log(record.get('p.name')));\nawait session.close();\nawait driver.close();</code></pre>
    <p>Steps: 1) Create a driver (dial the number), 2) Open a session (start a call), 3) Run a query (ask a question), 4) Process the result (listen to the answer), 5) Close everything (hang up).</p>
  `,
  'm9-l2': `
    <p>The <strong>Neo4j Python Driver</strong> is the same idea as the JavaScript driver but for Python.</p>
    <pre><code>pip install neo4j</code></pre>
    <pre><code>from neo4j import GraphDatabase\n\ndriver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'password'))\nwith driver.session() as session:\n    result = session.run('MATCH (p:Person) RETURN p.name, p.age')\n    for record in result:\n        print(f\"{record['p.name']} is {record['p.age']} years old\")\n\ndriver.close()</code></pre>
    <p>The pattern is the same as JavaScript: connect, run query, process results, close.</p>
    <p>Python is especially popular for data science. You can load Neo4j data into pandas DataFrames:</p>
    <pre><code>import pandas as pd\nwith driver.session() as session:\n    result = session.run('MATCH (p:Person) RETURN p.name AS name, p.age AS age')\n    df = pd.DataFrame([r.data() for r in result])</code></pre>
    <p><strong>Real-world use:</strong> Data scientists use Neo4j + Python to build recommendation systems, fraud detection models, and graph ML pipelines!</p>
  `,
  'm9-l3': `
    <p>Now let's put it all together with a <strong>REST API</strong> using Node.js and Express:</p>
    <pre><code>const express = require('express');\nconst neo4j = require('neo4j-driver');\nconst app = express();\n\nconst driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));\n\napp.get('/api/users/:name/friends', async (req, res) => {\n    const session = driver.session();\n    try {\n        const result = await session.run(\n            'MATCH (p:Person {name: $name})-[:KNOWS]->(friend) RETURN friend.name',\n            { name: req.params.name }\n        );\n        const friends = result.records.map(r => r.get('friend.name'));\n        res.json({ name: req.params.name, friends });\n    } finally {\n        await session.close();\n    }\n});\n\napp.listen(3000);</code></pre>
    <p>This API endpoint: <code>GET /api/users/Alice/friends</code> returns: <code>{"name": "Alice", "friends": ["Charlie"]}</code></p>
    <p><strong>Note the <code>$name</code> syntax:</strong> Use parameters instead of string concatenation! Parameters prevent Cypher injection attacks (like SQL injection but for graph databases).</p>
    <p><strong>Think of it like this:</strong> Building a REST API with Neo4j is like building a restaurant. Your app is the waiter (taking orders), the REST API is the kitchen window (where orders go in and food comes out), and Neo4j is the chef (actually preparing the food)!</p>
  `,

  /* ─── Module 10: Visualization with Neovis.js ─── */
  'm10-l1': `
    <p><strong>Neovis.js</strong> is a tool that turns your Neo4j graph into a beautiful, interactive picture that you can show on a website.</p>
    <p>Think of it like a photo album for your graph. Instead of looking at raw data like <code>{id: 1, label: "Person", name: "Alice"}</code>, you see colored dots with names connected by lines. Much easier to understand!</p>
    <pre><code>const viz = new NeoVis.default({\n    container: document.getElementById('viz'),\n    neo4j: { uri: 'bolt://localhost:7687', password: 'password' },\n    labels: { Person: { title: 'name', color: '#93c5fd' } },\n    relationships: { ACTED_IN: { color: '#fca5a5' } },\n    initialQuery: 'MATCH (p:Person)-[r:ACTED_IN]->(m:Movie) RETURN p,r,m'\n});\nviz.render();</code></pre>
    <p>This single command finds all people who acted in movies and draws them as a colorful interactive graph!</p>
    <p><strong>Think of it like this:</strong> Neovis.js is the artist that paints your data as a beautiful picture that you can click, drag, and explore!</p>
  `,
  'm10-l2': `
    <p>Neovis.js lets you customize how your graph looks. It's like having a paintbox for your data!</p>
    <p><strong>Node styling:</strong></p>
    <ul>
      <li><code>color</code> — Make Person nodes blue, Movie nodes red</li>
      <li><code>size</code> — Bigger nodes for more important things (like using PageRank scores)</li>
      <li><code>shape</code> — Circles for people, squares for movies, stars for places</li>
      <li><code>image</code> — Use actual photos instead of colored circles!</li>
    </ul>
    <p><strong>Relationship styling:</strong></p>
    <ul>
      <li><code>color</code> — Different colors for different relationship types</li>
      <li><code>width</code> — Thicker lines for stronger relationships</li>
      <li><code>caption</code> — Show relationship properties as labels on the lines</li>
    </ul>
    <p><strong>Interactive features:</strong> Users can click on nodes to see details, drag them to rearrange, zoom in and out, and hover to see tooltips.</p>
  `,
  'm10-l3': `
    <p>Now let's build something like a <strong>movie database dashboard</strong> with a search box and interactive graph.</p>
    <p>Step 1: Add a search box where users type an actor's name.</p>
    <p>Step 2: When they search, a JavaScript function runs a Neo4j query to find that actor and everything they're connected to.</p>
    <p>Step 3: Neovis.js draws the result as an interactive graph.</p>
    <p>Step 4: Clicking a movie node shows movie details (year, rating, genre) in a sidebar.</p>
    <pre><code>function searchActor(name) {\n    viz.reinitialize({\n        initialQuery: 'MATCH (p:Person {name: \"' + name + '\"})-[r]-(x) RETURN p,r,x'\n    });\n}</code></pre>
    <p><strong>Real-world example: Investigative journalism</strong> — Journalists use Neo4j + Neovis.js to map connections between people, companies, and politicians to uncover corruption. The graph makes it easy to see relationships that would be hidden in spreadsheets!</p>
    <p><strong>Think of it like this:</strong> A graph visualization dashboard is like having a map of a city where you can search for any address and instantly see all the roads connecting to it!</p>
  `,
};

/* Expose globally for the academy JS */
window.eli5Neo4jData = eli5Neo4jData;
