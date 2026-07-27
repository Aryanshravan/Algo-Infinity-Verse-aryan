/* global vis */

// ─── State Variables ────────────────────────────────────────────────
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('neo4jHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// ─── Mock Graph Database State ──────────────────────────────────────
const mockGraphData = {
  nodes: [
    { id: 1, label: 'Person', name: 'Alice', age: 30, city: 'New York', color: '#93c5fd' },
    { id: 2, label: 'Movie', title: 'The Matrix', released: 1999, genre: 'Sci-Fi', rating: 8.7, color: '#fca5a5' },
    { id: 3, label: 'Person', name: 'Bob', age: 45, city: 'San Francisco', color: '#93c5fd' },
    { id: 4, label: 'Person', name: 'Charlie', age: 28, city: 'New York', color: '#93c5fd' },
    { id: 5, label: 'Movie', title: 'Inception', released: 2010, genre: 'Sci-Fi', rating: 8.8, color: '#fca5a5' },
    { id: 6, label: 'Movie', title: 'The Godfather', released: 1972, genre: 'Drama', rating: 9.2, color: '#fca5a5' },
    { id: 7, label: 'Person', name: 'Diana', age: 35, city: 'London', color: '#93c5fd' },
    { id: 8, label: 'Genre', name: 'Sci-Fi', color: '#86efac' },
    { id: 9, label: 'Genre', name: 'Drama', color: '#86efac' },
  ],
  edges: [
    { id: 'e1', from: 1, to: 2, label: 'ACTED_IN', arrows: 'to' },
    { id: 'e2', from: 3, to: 2, label: 'DIRECTED', arrows: 'to' },
    { id: 'e3', from: 4, to: 5, label: 'ACTED_IN', arrows: 'to' },
    { id: 'e4', from: 1, to: 4, label: 'KNOWS', arrows: 'to' },
    { id: 'e5', from: 1, to: 5, label: 'ACTED_IN', arrows: 'to' },
    { id: 'e6', from: 3, to: 6, label: 'DIRECTED', arrows: 'to' },
    { id: 'e7', from: 7, to: 6, label: 'ACTED_IN', arrows: 'to' },
    { id: 'e8', from: 2, to: 8, label: 'HAS_GENRE', arrows: 'to' },
    { id: 'e9', from: 5, to: 8, label: 'HAS_GENRE', arrows: 'to' },
    { id: 'e10', from: 6, to: 9, label: 'HAS_GENRE', arrows: 'to' },
    { id: 'e11', from: 1, to: 5, label: 'RATED', arrows: 'to' },
  ],
};

// ─── vis.js Network Variables ──────────────────────────────────────
let network = null;
let nodesDataset = null;
let edgesDataset = null;

// ─── Helper: Build lesson content with objectives + takeaways ──────
function buildLessonContent(opts) {
  const { objectives, bodyHtml, takeaways, realWorldExample } = opts;
  const objectivesHtml = objectives && objectives.length
    ? '<div class="lesson-objectives"><h3>🎯 Learning Objectives</h3><ul>'
      + objectives.map(function (o) { return '<li>' + o + '</li>'; }).join('')
      + '</ul></div>'
    : '';
  const realWorldHtml = realWorldExample
    ? '<div class="lesson-callout lesson-callout-realworld"><strong>🌍 Real-World Use Case:</strong> ' + realWorldExample + '</div>'
    : '';
  const takeawaysHtml = takeaways && takeaways.length
    ? '<div class="lesson-takeaways"><h3>📌 Summary Takeaways</h3><ul>'
      + takeaways.map(function (t) { return '<li>' + t + '</li>'; }).join('')
      + '</ul></div>'
    : '';
  return '<div class="lesson-prose">'
    + objectivesHtml
    + bodyHtml
    + realWorldHtml
    + takeawaysHtml
    + '</div>';
}

// ─── Curriculum Data (10 modules, 2-3 lessons each) ────────────────
const curriculum = [
  // ═══ Module 1: Nodes, Labels & Properties ═══
  {
    id: 'mod-1',
    title: 'Nodes, Labels & Properties',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Introduction to Graphs',
        objectives: [
          'Understand graph databases vs relational databases',
          'Identify nodes, labels, and properties',
          'Write a basic MATCH query to retrieve all nodes',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand graph databases vs relational databases',
            'Identify nodes, labels, and properties',
            'Write a basic MATCH query to retrieve all nodes',
          ],
          bodyHtml: `
            <h2>Welcome to Neo4j</h2>
            <p>Unlike relational databases that store data in tables with rows and columns, Neo4j is a <strong>Graph Database</strong>. Data is stored as <strong>Nodes</strong> (entities) and <strong>Relationships</strong> (how they connect).</p>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 Key Insight:</strong> Graphs excel at connected data — social networks, recommendation engines, fraud detection, and knowledge graphs. In a relational DB, a "friend-of-a-friend" query requires multiple JOINs. In Neo4j, it's a simple pattern match.
            </div>
            <h3>Nodes</h3>
            <p>Nodes often have <strong>Labels</strong> to group them (e.g., <code>:Person</code>, <code>:Movie</code>) and <strong>Properties</strong> to store data (e.g., <code>name: 'Alice'</code>, <code>age: 30</code>).</p>
            <p>In Cypher (the query language for Neo4j), nodes are represented by parentheses: <code>()</code>.</p>
            <pre><code>// Find all nodes in the graph\nMATCH (n) RETURN n\nLIMIT 10</code></pre>
            <p>Go to the <strong>Graph Simulator</strong> tab and try running the default query to see the nodes in our database!</p>
          `,
          takeaways: [
            'Neo4j stores data as nodes (entities) and relationships (connections)',
            'Labels group nodes into categories (e.g., :Person, :Movie)',
            'Properties are key-value pairs on nodes or relationships',
            'Cypher uses parentheses () for nodes',
          ],
          realWorldExample: 'Netflix uses a graph database to power its recommendation engine. Every movie and user is a node, and "watched", "liked", and "rated" are relationships. This lets Netflix answer: "What movies did people who liked this movie also watch?"'
        }),
        defaultCode: 'MATCH (n)\nRETURN n\nLIMIT 10',
      },
      {
        id: 'm1-l2',
        title: 'Filtering by Label',
        objectives: [
          'Filter nodes by their label in MATCH clauses',
          'Understand how labels improve query performance',
          'Query multiple node labels in one statement',
        ],
        content: buildLessonContent({
          objectives: [
            'Filter nodes by their label in MATCH clauses',
            'Understand how labels improve query performance',
            'Query multiple node labels in one statement',
          ],
          bodyHtml: `
            <h2>Filtering Nodes by Label</h2>
            <p>You can filter nodes by specifying a Label inside the parentheses. This tells Neo4j to only look at nodes with that label — like searching in one drawer instead of the whole filing cabinet.</p>
            <pre><code>// Find all Person nodes\nMATCH (p:Person) RETURN p</code></pre>
            <p>This query finds all nodes with the label <code>Person</code> and assigns them to the variable <code>p</code>, which is then returned.</p>
            <h3>Why Labels Matter</h3>
            <p>Labels are not just organizational — they're also used for <strong>indexing</strong>. When you create an index on <code>:Person(name)</code>, Neo4j can quickly find people by name without checking every node.</p>
            <pre><code>// Find all Movie nodes\nMATCH (m:Movie) RETURN m.title, m.released</code></pre>
            <p>Try finding all the movies in the simulator, then try finding only the people!</p>
          `,
          takeaways: [
            'Use label filters like :Person or :Movie to narrow queries',
            'Labels improve performance by limiting the search space',
            'Variable names (p, m, n) let you reference matched nodes later',
            'You can access node properties using dot notation: p.name',
          ],
          realWorldExample: 'Amazon\'s product graph uses labels like :Product, :Customer, :Category, and :Order. Filtering by label lets them quickly find "all products in the Electronics category that customers also bought."'
        }),
        defaultCode: 'MATCH (m:Movie)\nRETURN m.title, m.released',
      },
      {
        id: 'm1-l3',
        title: 'Properties & Data Types',
        objectives: [
          'Understand property data types (string, integer, float, boolean, list)',
          'Filter nodes by property values using inline syntax',
          'Use multiple property conditions in one query',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand property data types (string, integer, float, boolean, list)',
            'Filter nodes by property values using inline syntax',
            'Use multiple property conditions in one query',
          ],
          bodyHtml: `
            <h2>Working with Properties</h2>
            <p>Properties are the details that make each node unique. Think of them as fields on an index card. Different data types store different kinds of information:</p>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 Data Types in Neo4j:</strong> 
              <code>String</code> (text), <code>Integer</code> (whole numbers), <code>Float</code> (decimals), 
              <code>Boolean</code> (true/false), <code>List</code> (arrays), <code>Date</code>, <code>DateTime</code>, 
              <code>Point</code> (spatial coordinates).
            </div>
            <p>You can filter by properties directly in the MATCH clause using curly braces <code>{}</code>:</p>
            <pre><code>// Find a person by name\nMATCH (p:Person {name: 'Alice'})\nRETURN p</code></pre>
            <pre><code>// Find movies released after 2000 (using inline property)\nMATCH (m:Movie)\nWHERE m.released > 2000\nRETURN m.title</code></pre>
            <p>The <code>WHERE</code> approach is more flexible — you can use comparison operators (<code>></code>, <code><</code>, <code>=</code>, <code>!=</code>, <code>>=</code>, <code><=</code>) and combine conditions with <code>AND</code> / <code>OR</code>.</p>
          `,
          takeaways: [
            'Properties store typed data on nodes and relationships',
            'Inline property syntax: (n:Label {key: value}) for exact match',
            'WHERE clause allows comparison operators and combined conditions',
            'Use AND/OR to combine multiple property filters',
          ],
          realWorldExample: 'LinkedIn\'s graph uses properties like "skills", "years_of_experience", and "location" on Person nodes. Recruiters can query: "Find engineers in San Francisco with Python skills and 5+ years experience."'
        }),
        defaultCode: "MATCH (p:Person)\nWHERE p.age > 30\nRETURN p.name, p.age",
      },
    ],
    quiz: [
      { id: 'q1', question: 'In Cypher, what syntax represents a node?', options: ['[node]', '{node}', '(node)', '<node>'], correct: 2 },
      { id: 'q2', question: 'What is the purpose of a label in Neo4j?', options: ['To set node color', 'To group and categorize nodes', 'To define relationships', 'To set access permissions'], correct: 1 },
      { id: 'q3', question: 'Which Cypher keyword retrieves data from the graph?', options: ['SELECT', 'GET', 'RETURN', 'FETCH'], correct: 2 },
      { id: 'q4', question: 'What data type would you use for a person\'s age?', options: ['String', 'Integer', 'Boolean', 'List'], correct: 1 },
      { id: 'q5', question: 'How do you filter nodes by a property directly in MATCH?', options: ['MATCH (n) WHERE n.key = val', 'MATCH (n {key: val})', 'MATCH (n) FILTER n.key = val', 'MATCH (n) | key = val'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Explore the Graph',
      description: 'Use the Graph Simulator to explore different nodes, filter by labels and properties.',
      steps: [
        'Run MATCH (n) RETURN n to see all nodes',
        'Run MATCH (p:Person) RETURN p.name, p.age to find all people',
        'Run MATCH (m:Movie) RETURN m.title to find all movies',
        'Filter: MATCH (p:Person {name: \'Alice\'}) RETURN p',
      ],
      hintCode: "MATCH (p:Person)\nWHERE p.age > 30\nRETURN p.name, p.age",
    },
  },

  // ═══ Module 2: Relationships & Directions ═══
  {
    id: 'mod-2',
    title: 'Relationships & Directions',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Understanding Relationships',
        objectives: [
          'Explain relationships as connections between nodes',
          'Write Cypher queries with relationship traversal',
          'Distinguish directed and undirected relationships',
        ],
        content: buildLessonContent({
          objectives: [
            'Explain relationships as connections between nodes',
            'Write Cypher queries with relationship traversal',
            'Distinguish directed and undirected relationships',
          ],
          bodyHtml: `
            <h2>Relationships — The Glue of Graphs</h2>
            <p>Relationships connect nodes and provide context. They are what makes a graph database different from a table! A relationship has a <strong>type</strong> (like <code>ACTED_IN</code>, <code>KNOWS</code>, <code>DIRECTED</code>) and a <strong>direction</strong>.</p>
            <p>In Cypher, relationships are represented with arrows and square brackets:</p>
            <pre><code>// Directed relationship: Person ACTED_IN Movie\nMATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN p.name, m.title</code></pre>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 Read it like a sentence:</strong> "From a Person node, follow the ACTED_IN arrow TO a Movie node, then return the person's name and movie title."
            </div>
            <p>You can also use undirected relationships when direction doesn't matter:</p>
            <pre><code>// Undirected — find all connections to Alice\nMATCH (p:Person {name: 'Alice'})--(connected)\nRETURN connected</code></pre>
          `,
          takeaways: [
            'Relationships connect two nodes with a type and direction',
            'Use -[:TYPE]-> for directed, -- for undirected traversal',
            'Relationships make graph queries intuitive — they read like sentences',
            'Variables let you return relationship data: [r:TYPE]',
          ],
          realWorldExample: 'Facebook\'s social graph uses relationships like FRIENDS_WITH, LIKES, and ATTENDED_EVENT. When Facebook suggests friends, it queries: "People who are FRIENDS_WITH my friends but NOT FRIENDS_WITH me."'
        }),
        defaultCode: "MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN p.name, m.title",
      },
      {
        id: 'm2-l2',
        title: 'Relationship Directions & Types',
        objectives: [
          'Understand incoming vs outgoing relationship directions',
          'Query variable-length relationships',
          'Use multiple relationship types in one query',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand incoming vs outgoing relationship directions',
            'Query variable-length relationships',
            'Use multiple relationship types in one query',
          ],
          bodyHtml: `
            <h2>Directions and Multiple Types</h2>
            <p>Relationship direction is like a one-way street. <code>→</code> means the relationship goes FROM the left node TO the right node. You can reverse it with <code>←</code>.</p>
            <pre><code>// Outgoing: Alice KNOWS someone\nMATCH (p:Person {name: 'Alice'})-[:KNOWS]->(friend)\nRETURN friend.name</code></pre>
            <pre><code>// Incoming: Who DIRECTED movies that Alice ACTED_IN?\nMATCH (p:Person {name: 'Alice'})-[:ACTED_IN]->(m:Movie)<-[:DIRECTED]-(director)\nRETURN director.name</code></pre>
            <h3>Multiple Relationship Types</h3>
            <p>Use the pipe <code>|</code> to match any of several types:</p>
            <pre><code>MATCH (p:Person)-[:ACTED_IN|:DIRECTED]->(m:Movie)\nRETURN p.name, m.title</code></pre>
            <h3>Variable-Length Paths</h3>
            <p>Find friends-of-friends (up to 2 hops away):</p>
            <pre><code>MATCH (p:Person {name: 'Alice'})-[:KNOWS*1..2]->(extended)\nRETURN extended.name</code></pre>
            <p>The <code>*1..2</code> means "1 to 2 hops." Use <code>*</code> for unlimited depth (be careful on large graphs!).</p>
          `,
          takeaways: [
            'Arrow direction matters → outgoing, ← incoming',
            'Use | for "any of these relationship types"',
            'Variable-length paths with *min..max find multi-hop connections',
            'You can chain multiple relationships in one MATCH',
          ],
          realWorldExample: 'PayPal uses graph queries to detect fraud in real-time. A suspicious pattern might be: "Alice sends money to Bob (1 hop), Bob sends to Charlie (2 hops), Charlie sends back to Alice (3 hops)" — this triangle of transactions could indicate money laundering.'
        }),
        defaultCode: "MATCH (p:Person {name: 'Alice'})-[:KNOWS]->(friend)\nRETURN friend.name",
      },
      {
        id: 'm2-l3',
        title: 'Relationship Properties',
        objectives: [
          'Store properties on relationships (not just nodes)',
          'Query based on relationship properties',
          'Use relationship properties in path patterns',
        ],
        content: buildLessonContent({
          objectives: [
            'Store properties on relationships (not just nodes)',
            'Query based on relationship properties',
            'Use relationship properties in path patterns',
          ],
          bodyHtml: `
            <h2>Properties on Relationships</h2>
            <p>Relationships can have their own properties too! Think of a <code>RATED</code> relationship between a Person and a Movie — the relationship itself holds the rating score.</p>
            <pre><code>// Find all ratings, showing the score stored on the relationship\nMATCH (p:Person)-[r:RATED]->(m:Movie)\nRETURN p.name, r.stars, m.title</code></pre>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 When to use relationship properties:</strong> Use them for information that describes the connection itself, not the entities. Examples: rating score, role in a movie (hero, villain), employment period (start_date, end_date), relationship strength.
            </div>
            <p>You can also filter by relationship properties:</p>
            <pre><code>// Find high ratings only\nMATCH (p:Person)-[r:RATED]->(m:Movie)\nWHERE r.stars >= 4\nRETURN p.name, m.title, r.stars</code></pre>
          `,
          takeaways: [
            'Relationships can have properties too — use [r:TYPE {props}] syntax',
            'Relationship properties store info about the connection itself',
            'Filter relationships by their properties with WHERE',
            'Assign a variable (like r) to access relationship properties',
          ],
          realWorldExample: 'In a dating app graph, a MATCHED_WITH relationship between users might have properties like "compatibility_score", "matched_at" (date), and "initial_message". Queries can filter: "Show me my top matches from this week, sorted by compatibility score."'
        }),
        defaultCode: "MATCH (p:Person)-[r:RATED]->(m:Movie)\nWHERE r.stars >= 4\nRETURN p.name, m.title, r.stars",
      },
    ],
    quiz: [
      { id: 'q6', question: 'What syntax represents a relationship type in Cypher?', options: ['(TYPE)', '{TYPE}', '<TYPE>', '[:TYPE]'], correct: 3 },
      { id: 'q7', question: 'What does the arrow → in a relationship indicate?', options: ['The relationship has no properties', 'The direction from source to target', 'The relationship is faster', 'The relationship is bidirectional'], correct: 1 },
      { id: 'q8', question: 'How to match ANY of multiple relationship types?', options: ['(type1 AND type2)', '-[:TYPE1|TYPE2]->', '-[:TYPE1 OR TYPE2]->', 'MATCH (n) WHERE rel.type IN [...]'], correct: 1 },
      { id: 'q9', question: 'What does *1..3 mean in a relationship pattern?', options: ['1 to 3 relationships', 'Multiply by 1.3', 'Only 3 relationships', '1 or 3 exactly'], correct: 0 },
      { id: 'q10', question: 'Can a RATED relationship between Person and Movie have its own properties?', options: ['Yes, relationships support properties too', 'No, only nodes have properties', 'Only if it is a directed relationship', 'Only if explicitly enabled'], correct: 0 },
    ],
    practice: {
      title: 'Practice: Traverse the Graph',
      description: 'Explore relationships between people and movies in the simulator.',
      steps: [
        'Find all ACTED_IN relationships: MATCH (p:Person)-[:ACTED_IN]->(m:Movie)',
        'Find all DIRECTED relationships: MATCH (p:Person)-[:DIRECTED]->(m:Movie)',
        'Find who Alice knows: MATCH (p:Person {name: \'Alice\'})-[:KNOWS]->(f) RETURN f.name',
        'Try a path of 2 hops: MATCH (p:Person {name: \'Alice\'})-[:ACTED_IN]->(m:Movie)<-[:DIRECTED]-(d) RETURN d.name',
      ],
      hintCode: "MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN p.name, m.title",
    },
  },

  // ═══ Module 3: Querying with Cypher — MATCH & RETURN ═══
  {
    id: 'mod-3',
    title: 'MATCH & RETURN Patterns',
    lessons: [
      {
        id: 'm3-l1',
        title: 'The MATCH Clause',
        objectives: [
          'Understand MATCH as the pattern-matching clause',
          'Write MATCH queries with multiple patterns',
          'Use path variables for complex traversals',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand MATCH as the pattern-matching clause',
            'Write MATCH queries with multiple patterns',
            'Use path variables for complex traversals',
          ],
          bodyHtml: `
            <h2>Mastering MATCH</h2>
            <p><code>MATCH</code> is the heart of Cypher. It describes a <strong>pattern</strong> to find in the graph — like drawing a diagram of what you're looking for.</p>
            <pre><code>// Simple: Find all movies\nMATCH (m:Movie)\nRETURN m.title, m.released</code></pre>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 MATCH is like SELECT in SQL, but for patterns.</strong> You describe what shape of data you want, and Neo4j finds all matching subgraphs.
            </div>
            <h3>Multiple Patterns in One MATCH</h3>
            <pre><code>MATCH (p:Person), (m:Movie {title: 'The Matrix'})\nRETURN p.name, m.title</code></pre>
            <p>This finds all people AND the specific movie — two independent patterns combined.</p>
            <h3>Path Variables</h3>
            <pre><code>// Assign the whole path to a variable\nMATCH path = (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN path</code></pre>
          `,
          takeaways: [
            'MATCH finds patterns in the graph, not just individual nodes',
            'Use commas to combine multiple independent patterns',
            'Path variables capture the entire matched subgraph',
            'MATCH with no pattern returns nothing — you must describe the shape',
          ],
          realWorldExample: 'NASA uses Neo4j to map spacecraft and mission dependencies. A MATCH pattern like "(Component)-[:DEPENDS_ON]->(:Component)" helps engineers understand the impact of a faulty part on the entire system.'
        }),
        defaultCode: "MATCH (m:Movie)\nRETURN m.title, m.released, m.genre",
      },
      {
        id: 'm3-l2',
        title: 'Filtering with WHERE',
        objectives: [
          'Use WHERE for advanced property filtering',
          'Combine conditions with AND, OR, NOT',
          'Use comparison operators and string matching',
        ],
        content: buildLessonContent({
          objectives: [
            'Use WHERE for advanced property filtering',
            'Combine conditions with AND, OR, NOT',
            'Use comparison operators and string matching',
          ],
          bodyHtml: `
            <h2>Advanced Filtering with WHERE</h2>
            <p><code>WHERE</code> adds conditions to your pattern matching. It's the most flexible way to filter data.</p>
            <h3>Comparison Operators</h3>
            <pre><code>// People older than 30\nMATCH (p:Person)\nWHERE p.age > 30\nRETURN p.name, p.age</code></pre>
            <h3>Combining Conditions</h3>
            <pre><code>// People from New York who are older than 25\nMATCH (p:Person)\nWHERE p.city = 'New York' AND p.age > 25\nRETURN p.name, p.age, p.city</code></pre>
            <h3>String Matching</h3>
            <pre><code>// Names that contain 'li'\nMATCH (p:Person)\nWHERE p.name CONTAINS 'li'\nRETURN p.name</code></pre>
            <pre><code>// Names starting with A\nMATCH (p:Person)\nWHERE p.name STARTS WITH 'A'\nRETURN p.name</code></pre>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 WHERE vs Inline Properties:</strong> Inline <code>{name: 'Alice'}</code> is shorthand for equality only. WHERE gives you comparisons, string matching, existence checks (<code>IS NOT NULL</code>), and more.
            </div>
          `,
          takeaways: [
            'WHERE adds flexible filtering: comparisons, string ops, existence checks',
            'Combine conditions with AND (all must match) or OR (any can match)',
            'CONTAINS, STARTS WITH, ENDS WITH for partial string matching',
            'WHERE can also filter patterns like relationship existence',
          ],
          realWorldExample: 'Airbnb could use Neo4j for property search: "Find listings in Paris (city filter) with 3+ bedrooms AND WiFi AND rating >= 4.5, where the host has 10+ reviews." This combines property filters on both Listing and Host nodes.'
        }),
        defaultCode: "MATCH (p:Person)\nWHERE p.age > 25 AND p.city = 'New York'\nRETURN p.name, p.age, p.city",
      },
      {
        id: 'm3-l3',
        title: 'Aggregating & Sorting Results',
        objectives: [
          'Use COUNT, SUM, AVG for data aggregation',
          'Sort results with ORDER BY',
          'Limit and skip results for pagination',
        ],
        content: buildLessonContent({
          objectives: [
            'Use COUNT, SUM, AVG for data aggregation',
            'Sort results with ORDER BY',
            'Limit and skip results for pagination',
          ],
          bodyHtml: `
            <h2>Aggregation and Ordering</h2>
            <h3>COUNT — How Many?</h3>
            <pre><code>// Count all people\nMATCH (p:Person)\nRETURN count(p) AS total_people</code></pre>
            <pre><code>// Count movies per person (who acted the most?)\nMATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN p.name, count(m) AS movie_count</code></pre>
            <h3>ORDER BY — Sorting Results</h3>
            <pre><code>// Oldest people first\nMATCH (p:Person)\nRETURN p.name, p.age\nORDER BY p.age DESC</code></pre>
            <p><code>ASC</code> for ascending (smallest first), <code>DESC</code> for descending (largest first).</p>
            <h3>LIMIT and SKIP — Pagination</h3>
            <pre><code>// Top 3 oldest people\nMATCH (p:Person)\nRETURN p.name, p.age\nORDER BY p.age DESC\nLIMIT 3</code></pre>
            <pre><code>// Skip first 2, show next 3 (pagination page 2)\nMATCH (p:Person)\nRETURN p.name, p.age\nORDER BY p.age DESC\nSKIP 2\nLIMIT 3</code></pre>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 Aggregation behavior:</strong> In Cypher, when you use an aggregation function like <code>count()</code>, the non-aggregated columns become grouping keys. <code>RETURN p.name, count(m)</code> groups by <code>p.name</code> automatically.
            </div>
          `,
          takeaways: [
            'COUNT, SUM, AVG aggregate values across matched results',
            'Non-aggregated columns become grouping keys automatically',
            'ORDER BY sorts with ASC (default) or DESC',
            'LIMIT + SKIP work together for pagination',
            'AS keyword aliases result column names',
          ],
          realWorldExample: 'A movie streaming service like Netflix uses aggregation queries to build dashboards: "Count movies by genre, order by popularity, limit to top 5 genres." This helps them decide what content to invest in.'
        }),
        defaultCode: "MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN p.name, count(m) AS acted_in_count\nORDER BY acted_in_count DESC",
      },
    ],
    quiz: [
      { id: 'q11', question: 'What Cypher clause describes the pattern to find in the graph?', options: ['SELECT', 'MATCH', 'FIND', 'SEARCH'], correct: 1 },
      { id: 'q12', question: 'Which operator checks if a string contains a substring?', options: ['INCLUDES', 'CONTAINS', 'HAS', 'LIKE'], correct: 1 },
      { id: 'q13', question: 'How do you get the 5 oldest people in descending order?', options: ['MATCH (p:Person) ORDER p.age DESC LIMIT 5 RETURN p', 'MATCH (p:Person) RETURN p ORDER BY p.age DESC LIMIT 5', 'MATCH (p:Person) RETURN p ORDER p.age DESC TAKE 5', 'MATCH (p:Person) RETURN p SORT BY p.age DESC TOP 5'], correct: 1 },
      { id: 'q14', question: 'What does COUNT(p) return?', options: ['The sum of p values', 'The number of matching nodes/rows', 'The average of p', 'A boolean if p exists'], correct: 1 },
      { id: 'q15', question: 'In RETURN p.name, count(m), what happens to the result?', options: ['All rows returned', 'Grouped by p.name', 'Sorted by p.name', 'Filtered by count'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Query, Aggregate, Sort',
      description: 'Run aggregation and sorting queries in the simulator.',
      steps: [
        'Count total nodes: MATCH (n) RETURN count(n)',
        'Count movies per genre: MATCH (m:Movie) RETURN m.genre, count(m)',
        'Find people sorted by age DESC with LIMIT 2',
        'Combine: count movies each person acted in, ordered by count',
      ],
      hintCode: "MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN p.name, count(m) AS movie_count\nORDER BY movie_count DESC\nLIMIT 3",
    },
  },

  // ═══ Module 4: Cypher — CREATE, MERGE & DELETE ═══
  {
    id: 'mod-4',
    title: 'CREATE, MERGE & DELETE',
    lessons: [
      {
        id: 'm4-l1',
        title: 'Creating Nodes & Relationships',
        objectives: [
          'Create nodes with labels and properties using CREATE',
          'Create relationships between existing nodes',
          'Understand the difference between CREATE and MERGE',
        ],
        content: buildLessonContent({
          objectives: [
            'Create nodes with labels and properties using CREATE',
            'Create relationships between existing nodes',
            'Understand the difference between CREATE and MERGE',
          ],
          bodyHtml: `
            <h2>Adding Data with CREATE</h2>
            <p><code>CREATE</code> is how you add new nodes and relationships to the graph. Think of it as pinning new photos to the corkboard.</p>
            <pre><code>// Create a Person node\nCREATE (p:Person {name: 'Diana', age: 28, city: 'London'})</code></pre>
            <pre><code>// Create a Movie and a relationship in one statement\nCREATE (p:Person {name: 'Eve', age: 32})\nCREATE (m:Movie {title: 'Interstellar', released: 2014})\nCREATE (p)-[:ACTED_IN]->(m)</code></pre>
            <h3>Create Relationships Between Existing Nodes</h3>
            <pre><code>MATCH (p:Person {name: 'Alice'}), (m:Movie {title: 'Inception'})\nCREATE (p)-[:ACTED_IN]->(m)</code></pre>
            <div class="lesson-callout lesson-callout-warning">
              <strong>⚠️ Watch out:</strong> CREATE always makes NEW things. Running CREATE twice for the same person creates two copies! Use MERGE when you want to avoid duplicates.
            </div>
          `,
          takeaways: [
            'CREATE adds new nodes and relationships to the graph',
            'You can create nodes, relationships, or both in one query',
            'CREATE always creates — even if the data already exists',
            'MATCH existing nodes first, then CREATE relationships between them',
          ],
          realWorldExample: 'Eventbrite uses Neo4j to model events, venues, and attendees. When someone RSVPs, a CREATE query adds a new ATTENDED relationship between the User and Event nodes — capturing the connection instantly.'
        }),
        defaultCode: "CREATE (p:Person {name: 'Diana', age: 28})\nRETURN p",
      },
      {
        id: 'm4-l2',
        title: 'Using MERGE — Find or Create',
        objectives: [
          'Use MERGE to avoid duplicate data',
          'Combine MERGE with ON CREATE and ON MATCH',
          'MERGE patterns for idempotent writes',
        ],
        content: buildLessonContent({
          objectives: [
            'Use MERGE to avoid duplicate data',
            'Combine MERGE with ON CREATE and ON MATCH',
            'MERGE patterns for idempotent writes',
          ],
          bodyHtml: `
            <h2>MERGE — The Smart Creator</h2>
            <p><code>MERGE</code> is like "find or create." It first tries to MATCH the pattern. If found, it returns it. If not found, it CREATEs it. This prevents duplicates!</p>
            <pre><code>// If Alice doesn't exist, create her. If she does, just return her.\nMERGE (p:Person {name: 'Alice'})\nRETURN p</code></pre>
            <h3>ON CREATE and ON MATCH</h3>
            <p>You can set different properties depending on whether the node was created or matched:</p>
            <pre><code>MERGE (p:Person {name: 'Frank'})\nON CREATE SET p.created_at = timestamp()\nON MATCH SET p.last_seen = timestamp()\nRETURN p</code></pre>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 Idempotent Writes:</strong> MERGE is "idempotent" — running it multiple times produces the same result. This is crucial for data pipelines that might retry operations.
            </div>
            <h3>MERGE with Relationships</h3>
            <pre><code>MATCH (a:Person {name: 'Alice'}), (b:Person {name: 'Bob'})\nMERGE (a)-[:KNOWS]->(b)\n// CREATEs the relationship only if it doesn't exist</code></pre>
          `,
          takeaways: [
            'MERGE = MATCH + CREATE — finds OR creates, never duplicates',
            'ON CREATE SET for properties only when creating',
            'ON MATCH SET for properties only when existing node is found',
            'MERGE is idempotent — safe for retries in data pipelines',
          ],
          realWorldExample: 'Uber uses MERGE to manage its driver fleet. When a driver goes online, MERGE either creates a new driver record (first time) or updates their status (returning driver). No duplicate drivers, no lost data.'
        }),
        defaultCode: "MERGE (p:Person {name: 'Frank'})\nON CREATE SET p.created = 'new'\nON MATCH SET p.status = 'returning'\nRETURN p.name, p.status",
      },
      {
        id: 'm4-l3',
        title: 'Deleting Data Safely',
        objectives: [
          'Delete nodes with DELETE',
          'Use DETACH DELETE to remove nodes with relationships',
          'Understand the risks of cascading deletions',
        ],
        content: buildLessonContent({
          objectives: [
            'Delete nodes with DELETE',
            'Use DETACH DELETE to remove nodes with relationships',
            'Understand the risks of cascading deletions',
          ],
          bodyHtml: `
            <h2>Safe Data Deletion</h2>
            <p><code>DELETE</code> removes nodes, but only if they have NO relationships. If a node has connections, Neo4j will refuse — this protects your graph's integrity.</p>
            <pre><code>// Delete an isolated node\nMATCH (p:Person {name: 'Eve'})\nDELETE p</code></pre>
            <h3>DETACH DELETE — Cut First, Then Remove</h3>
            <p>When you need to delete a node and all its relationships in one go:</p>
            <pre><code>MATCH (p:Person {name: 'Charlie'})\nDETACH DELETE p</code></pre>
            <p>This removes ALL relationships Charlie has, then removes Charlie himself.</p>
            <div class="lesson-callout lesson-callout-warning">
              <strong>⚠️ Danger Zone:</strong> DETACH DELETE can have cascade effects! Deleting one node might delete relationships that connect other important nodes. Always think: "What else might this affect?"
            </div>
            <pre><code>// Remove a relationship WITHOUT deleting the nodes\nMATCH (p:Person {name: 'Alice'})-[r:KNOWS]->(:Person {name: 'Charlie'})\nDELETE r</code></pre>
          `,
          takeaways: [
            'DELETE removes nodes only if they have no relationships',
            'DETACH DELETE removes a node AND all its relationships',
            'Delete individual relationships with DELETE r (relationship variable)',
            'Be careful with DETACH DELETE — it can cascade unexpectedly',
          ],
          realWorldExample: 'GDPR compliance: If a user requests data deletion, you need to DETACH DELETE their node — removing the user and all their connections from the graph. But sometimes you want to keep the relationships (like "user posted review") while anonymizing the user node.'
        }),
        defaultCode: "MATCH (p:Person {name: 'Charlie'})\nDETACH DELETE p",
      },
    ],
    quiz: [
      { id: 'q16', question: 'What is the main difference between CREATE and MERGE?', options: ['CREATE is faster', 'MERGE avoids duplicates by checking existence first', 'CREATE only works on nodes', 'MERGE can\'t use properties'], correct: 1 },
      { id: 'q17', question: 'What does ON CREATE SET do in a MERGE?', options: ['Sets properties only when a new node is created', 'Sets properties every time', 'Prevents creation', 'Creates an index'], correct: 0 },
      { id: 'q18', question: 'Why might DELETE fail on a node?', options: ['Node has no label', 'Node has relationships attached', 'Node is too large', 'Node is indexed'], correct: 1 },
      { id: 'q19', question: 'What does DETACH DELETE do?', options: ['Removes relationships only', 'Removes the node AND all its relationships', 'Removes the node but keeps relationships', 'Disconnects then reconnects'], correct: 1 },
      { id: 'q20', question: 'How do you delete ONLY a relationship without affecting nodes?', options: ['DELETE r where r is the relationship variable', 'DETACH DELETE both nodes', 'DELETE the nodes connected to it', 'It\'s not possible'], correct: 0 },
    ],
    practice: {
      title: 'Practice: Create, Merge, Delete',
      description: 'Practice data manipulation commands. Note: The simulator has a fixed dataset — these exercises show you the syntax even if the simulator can\'t persist changes.',
      steps: [
        'Write a CREATE query for a new Person node',
        'Write a MERGE query that avoids duplicates',
        'Write a DETACH DELETE for a specific node',
        'Write a query that deletes only a relationship',
      ],
      hintCode: "MERGE (p:Person {name: 'Grace'})\nON CREATE SET p.created = timestamp()\nRETURN p",
    },
  },

  // ═══ Module 5: Graph Data Modeling ═══
  {
    id: 'mod-5',
    title: 'Graph Data Modeling',
    lessons: [
      {
        id: 'm5-l1',
        title: 'Principles of Graph Modeling',
        objectives: [
          'Apply the "nouns → nodes, verbs → relationships" principle',
          'Design node labels and relationship types for clarity',
          'Distinguish graph modeling from relational modeling',
        ],
        content: buildLessonContent({
          objectives: [
            'Apply the "nouns → nodes, verbs → relationships" principle',
            'Design node labels and relationship types for clarity',
            'Distinguish graph modeling from relational modeling',
          ],
          bodyHtml: `
            <h2>Thinking in Graphs</h2>
            <p>Graph data modeling is different from relational modeling. Instead of thinking about tables and foreign keys, you think about <strong>things</strong> and <strong>connections</strong>.</p>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 The Golden Rule of Graph Modeling:</strong> Nouns become Nodes, Verbs become Relationships.
            </div>
            <p>For example, in a movie database:</p>
            <ul>
              <li><strong>Nouns:</strong> Person, Movie, Genre, Studio → These become node labels</li>
              <li><strong>Verbs:</strong> ACTED_IN, DIRECTED, PRODUCED_BY, HAS_GENRE → These become relationship types</li>
            </ul>
            <h3>Query-Driven Design</h3>
            <p>The best approach: start with the questions you need to answer. Ask "What queries will we run?" and design the graph to make those queries natural.</p>
            <p><strong>Example:</strong> If you need to answer "What movies have Alice and Bob both acted in?", design relationships so that traversal from Alice → Movie ← Bob is a straight line.</p>
          `,
          takeaways: [
            'Nouns → Nodes, Verbs → Relationships',
            'Design your graph around the questions you need to answer',
            'Labels categorize nodes, relationship types describe connections',
            'Graph modeling is more intuitive than relational for connected data',
          ],
          realWorldExample: 'The US National Security Agency (NSA) uses graph databases to model complex relationships between entities. A person, phone number, email address, and location are all nodes. CALLED, EMAILED, VISITED are relationship types. This makes it easy to answer "find connections between person A and person B through any number of hops."'
        }),
        defaultCode: "// Model: What labels & relationships do we need?\n// People ACT_IN Movies that HAVE_GENRE Genre\nMATCH (p:Person)-[:ACTED_IN]->(m:Movie)-[:HAS_GENRE]->(g:Genre)\nRETURN p.name, m.title, g.name",
      },
      {
        id: 'm5-l2',
        title: 'Modeling Real-World Domains',
        objectives: [
          'Model a social network, e-commerce, or music app in a graph',
          'Identify key node labels and relationship types for a domain',
          'Write queries that answer business questions from the model',
        ],
        content: buildLessonContent({
          objectives: [
            'Model a social network, e-commerce, or music app in a graph',
            'Identify key node labels and relationship types for a domain',
            'Write queries that answer business questions from the model',
          ],
          bodyHtml: `
            <h2>Domain Modeling in Practice</h2>
            <p>Let's model a <strong>music streaming service</strong> like Spotify:</p>
            <div class="lesson-callout lesson-callout-realworld">
              <strong>Nodes:</strong> User, Artist, Song, Playlist, Album, Genre<br>
              <strong>Relationships:</strong> LIKES (User→Song), FOLLOWS (User→Artist), CREATED (User→Playlist), INCLUDES (Playlist→Song), PERFORMED_BY (Song→Artist), BELONGS_TO (Song→Genre)
            </div>
            <p>With this model, you can answer powerful questions:</p>
            <pre><code>// Recommend songs: what do users with similar taste listen to?\nMATCH (me:User {name: 'Alice'})-[:LIKES]->(s:Song)<-[:LIKES]-(other:User)-[:LIKES]->(rec:Song)\nWHERE NOT EXISTS((me)-[:LIKES]->(rec))\nRETURN DISTINCT rec.title\nLIMIT 10</code></pre>
            <pre><code>// Find the most-followed artists in a genre\nMATCH (g:Genre {name: 'Jazz'})<-[:BELONGS_TO]-(:Song)-[:PERFORMED_BY]->(a:Artist)<-[:FOLLOWS]-(u:User)\nRETURN a.name, count(DISTINCT u) AS followers\nORDER BY followers DESC\nLIMIT 5</code></pre>
          `,
          takeaways: [
            'Start with domain nouns and verbs, then design node labels and relationship types',
            'Use the graph to answer natural questions like "what do users like me enjoy?"',
            'Graph models scale well — adding new node types doesn\'t break existing queries',
            'Leverage variable-length paths for "degrees of separation" queries',
          ],
          realWorldExample: 'Spotify actually uses graph databases for their "Discover Weekly" recommendations! They model songs, artists, users, and listening history as a graph. The recommendation engine traverses paths like "User LIKES Song → PERFORMED_BY Artist → SIMILAR_TO Artist → PERFORMED_BY Song" to find new music you might enjoy.'
        }),
        defaultCode: "// Simulate a music graph query\nMATCH (p:Person)-[:ACTED_IN]->(m:Movie)\n// Treat Person as 'User', Movie as 'Song', ACTED_IN as 'LIKES'\nRETURN p.name, count(m) AS liked_songs\nORDER BY liked_songs DESC",
      },
      {
        id: 'm5-l3',
        title: 'Common Patterns & Anti-Patterns',
        objectives: [
          'Recognize common graph modeling patterns',
          'Avoid modeling anti-patterns that hurt performance',
          'Use intermediate nodes for complex relationships',
        ],
        content: buildLessonContent({
          objectives: [
            'Recognize common graph modeling patterns',
            'Avoid modeling anti-patterns that hurt performance',
            'Use intermediate nodes for complex relationships',
          ],
          bodyHtml: `
            <h2>Patterns to Follow, Pitfalls to Avoid</h2>
            <h3>✅ Good Patterns</h3>
            <ul>
              <li><strong>Use labels as categories:</strong> <code>:Person</code>, <code>:Movie</code> not <code>{type: 'person'}</code>. Labels are indexed and filter faster.</li>
              <li><strong>Use specific relationship types:</strong> <code>ACTED_IN</code>, <code>DIRECTED</code> not <code>RELATED_TO</code>. Specific types make queries self-documenting.</li>
              <li><strong>Intermediate nodes for complex relations:</strong> Instead of a "RATED" relationship with many properties, consider a "Rating" node that connects Person and Movie — giving you a richer model.</li>
            </ul>
            <h3>❌ Anti-Patterns</h3>
            <ul>
              <li><strong>Using a single generic label</strong> — Everything as <code>:Node</code> means you can't efficiently filter or index.</li>
              <li><strong>Overusing relationship properties</strong> — If a relationship has 10+ properties, it might be a hidden node.</li>
              <li><strong>Modeling the same data twice</strong> — Properties on nodes AND relationships that store the same info.</li>
              <li><strong>Chain of many single relationships</strong> — Instead of A→B→C→D, consider direct relationships for frequently-accessed paths.</li>
            </ul>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 When to use an intermediate node:</strong> If you find yourself adding properties like "role" (hero/villain) or "year" to an ACTED_IN relationship, consider creating a separate ROLE node or YEAR node to attach additional context.
            </div>
          `,
          takeaways: [
            'Use labels for categories — they\'re indexed and fast',
            'Specific relationship types make queries self-documenting',
            'Intermediate nodes handle complex relationships with many properties',
            'Avoid generic labels, redundant data, and long single-type chains',
          ],
          realWorldExample: 'In a hospital\'s patient database, the relationship between Doctor and Patient might seem simple (TREATS). But it carries many details: diagnosis, prescriptions, visit dates, insurance codes. Modeling this as a TREATMENT intermediate node (Doctor)-[:PERFORMS]→(Treatment)-[:FOR]→(Patient) is cleaner and more queryable.'
        }),
        defaultCode: "// Good model: specific labels and relationships\nMATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN p.name, m.title\n\n// Bad model: generic\n// MATCH (n)-[:CONNECTED_TO]->(n2)\n// RETURN n.name, n2.name",
      },
    ],
    quiz: [
      { id: 'q21', question: 'What is the golden rule of graph data modeling?', options: ['Use as few nodes as possible', 'Nouns → Nodes, Verbs → Relationships', 'Always use generic labels', 'Avoid relationships'], correct: 1 },
      { id: 'q22', question: 'Why use specific relationship types like ACTED_IN instead of RELATED_TO?', options: ['They\'re faster to query', 'They\'re self-documenting and expressive', 'They take less space', 'They\'re required by Neo4j'], correct: 1 },
      { id: 'q23', question: 'What is an anti-pattern in graph modeling?', options: ['Using labels to categorize nodes', 'Using a single generic label for everything', 'Using specific relationship types', 'Using intermediate nodes'], correct: 1 },
      { id: 'q24', question: 'When should you use an intermediate node?', options: ['When a relationship has 10+ properties', 'When you want to slow queries', 'Never use intermediate nodes', 'Only for hierarchical data'], correct: 0 },
      { id: 'q25', question: 'Why start modeling with queries you need to answer?', options: ['Queries are easier to write', 'It ensures the graph design supports your use cases', 'To reduce storage', 'It reduces query complexity'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Model a Domain',
      description: 'Think about how you would model a domain in a graph, then explore the existing movie graph.',
      steps: [
        'Identify all unique node labels in the dataset',
        'Identify all unique relationship types',
        'Trace: Alice → ACTED_IN → Matrix → HAS_GENRE → Sci-Fi',
        'Think: How would you add "award" relationships to actors?',
      ],
      hintCode: "// Explore the current graph model\nMATCH (n)\nRETURN DISTINCT labels(n) AS node_labels\n\n// Find all relationship types\nMATCH ()-[r]->()\nRETURN DISTINCT type(r) AS rel_types",
    },
  },

  // ═══ Module 6: Indexing & Constraints ═══
  {
    id: 'mod-6',
    title: 'Indexing & Constraints',
    lessons: [
      {
        id: 'm6-l1',
        title: 'Creating Indexes for Performance',
        objectives: [
          'Understand what indexes are and why they matter',
          'Create single-property and composite indexes',
          'Identify when queries are using indexes',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand what indexes are and why they matter',
            'Create single-property and composite indexes',
            'Identify when queries are using indexes',
          ],
          bodyHtml: `
            <h2>Indexes — Speed Up Your Queries</h2>
            <p>An <strong>index</strong> is like a book's index at the back. Instead of scanning every page to find "Neo4j," you look it up in the index and jump straight to the right page.</p>
            <p>Without an index, Neo4j must scan every node of a label — this is called a <strong>label scan</strong>. With an index, it can find nodes directly in O(log n) time.</p>
            <pre><code>// Create a single-property index on Person names\nCREATE INDEX FOR (p:Person) ON (p.name)</code></pre>
            <pre><code>// Create a composite index (for queries filtering by both properties)\nCREATE INDEX FOR (p:Person) ON (p.name, p.age)</code></pre>
            <p>Now queries like <code>MATCH (p:Person {name: 'Alice'})</code> or <code>MATCH (p:Person) WHERE p.name = 'Alice' AND p.age > 25</code> will use the index.</p>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 Index guidelines:</strong> Index properties you search by frequently (usernames, emails, SKUs). Don't index everything — indexes speed up reads but slow down writes slightly.
            </div>
          `,
          takeaways: [
            'Indexes speed up property-based lookups dramatically',
            'Create indexes on properties you filter by frequently',
            'Composite indexes help queries with multiple property conditions',
            'Indexes add small write overhead — don\'t over-index',
          ],
          realWorldExample: 'An e-commerce site with 10 million products. Without an index on product.SKU, finding a product by SKU would scan all 10 million nodes. With an index, it finds it in milliseconds. This is crucial for checkout speed!'
        }),
        defaultCode: "// Syntax to create indexes (run in Neo4j Browser or console)\nCREATE INDEX FOR (m:Movie) ON (m.title)\nCREATE INDEX FOR (p:Person) ON (p.name)",
      },
      {
        id: 'm6-l2',
        title: 'Constraints for Data Integrity',
        objectives: [
          'Create uniqueness constraints',
          'Create node key constraints for mandatory + unique fields',
          'Understand how constraints also create indexes',
        ],
        content: buildLessonContent({
          objectives: [
            'Create uniqueness constraints',
            'Create node key constraints for mandatory + unique fields',
            'Understand how constraints also create indexes',
          ],
          bodyHtml: `
            <h2>Constraints — Rules That Protect Your Data</h2>
            <p><strong>Constraints</strong> are database rules that Neo4j enforces automatically. They prevent bad data from entering your graph.</p>
            <h3>Uniqueness Constraint</h3>
            <p>Ensures no two nodes with the same label have the same property value:</p>
            <pre><code>CREATE CONSTRAINT FOR (p:Person) REQUIRE p.email IS UNIQUE</code></pre>
            <p>If you try to create a second Person with <code>email: 'alice@email.com'</code>, Neo4j rejects it.</p>
            <h3>Node Key Constraint</h3>
            <p>Combines uniqueness with existence — the property MUST exist AND be unique:</p>
            <pre><code>CREATE CONSTRAINT FOR (p:Person) REQUIRE (p.name, p.email) IS NODE KEY</code></pre>
            <p>Every Person must have both <code>name</code> and <code>email</code>, and the combination must be unique.</p>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 Bonus:</strong> Constraints automatically create indexes for the constrained properties. You get data integrity AND performance!
            </div>
          `,
          takeaways: [
            'Uniqueness constraints prevent duplicate property values',
            'Node key constraints enforce both existence and uniqueness',
            'Constraints automatically create backing indexes',
            'Use constraints for business-critical unique fields (emails, IDs)',
          ],
          realWorldExample: 'In a banking system, every Account must have a unique account_number. A uniqueness constraint on Account.number ensures no two accounts can have the same number — even if two transactions try to create the same number simultaneously.'
        }),
        defaultCode: "// Syntax to create constraints\nCREATE CONSTRAINT FOR (p:Person) REQUIRE p.email IS UNIQUE\nCREATE CONSTRAINT FOR (m:Movie) REQUIRE m.title IS UNIQUE",
      },
      {
        id: 'm6-l3',
        title: 'Schema Optimization Strategy',
        objectives: [
          'Plan an indexing strategy for production workloads',
          'Understand TEXT indexes for full-text search',
          'Monitor query performance and adjust indexes',
        ],
        content: buildLessonContent({
          objectives: [
            'Plan an indexing strategy for production workloads',
            'Understand TEXT indexes for full-text search',
            'Monitor query performance and adjust indexes',
          ],
          bodyHtml: `
            <h2>Building an Indexing Strategy</h2>
            <h3>Types of Indexes</h3>
            <ul>
              <li><strong>B-tree index (default):</strong> Best for exact matches, comparisons, range queries.</li>
              <li><strong>TEXT index:</strong> For full-text search within string properties. Lets you search for words, phrases, and fuzzy matches.</li>
              <li><strong>Composite index:</strong> For queries filtering on multiple properties at once.</li>
            </ul>
            <pre><code>// TEXT index for full-text search on movie titles\nCREATE TEXT INDEX FOR (m:Movie) ON (m.title)</code></pre>
            <pre><code>// Then search with CONTAINS (uses TEXT index)\nMATCH (m:Movie)\nWHERE m.title CONTAINS 'Matrix'\nRETURN m.title</code></pre>
            <h3>When to Index</h3>
            <ul>
              <li>✅ Properties used in <code>WHERE</code> or <code>ON MATCH</code> clauses</li>
              <li>✅ Properties used in <code>ORDER BY</code> or aggregations</li>
              <li>✅ Properties used as unique identifiers</li>
              <li>❌ Properties rarely queried</li>
              <li>❌ Properties with very few unique values</li>
            </ul>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 PROFILE your queries:</strong> Use <code>PROFILE</code> before your query to see if it uses an index. Look for "NodeIndexSeek" in the plan — that means an index is being used!
            </div>
          `,
          takeaways: [
            'B-tree indexes for exact/range queries, TEXT for full-text search',
            'PROFILE queries to verify index usage',
            'Index frequently-queried properties, skip rarely-used ones',
            'TEXT indexes enable fast substring and full-text searches',
          ],
          realWorldExample: 'Wikipedia uses Neo4j for its knowledge graph. The TEXT index on article titles lets users search "machine learning" and instantly find connected concepts. Without TEXT indexes, searching through millions of articles would take seconds instead of milliseconds.'
        }),
        defaultCode: "// Create a TEXT index for full-text search\nCREATE TEXT INDEX FOR (m:Movie) ON (m.title)\n\n// Then search\nMATCH (m:Movie)\nWHERE m.title CONTAINS 'Matrix'\nRETURN m.title",
      },
    ],
    quiz: [
      { id: 'q26', question: 'What is the primary purpose of an index in Neo4j?', options: ['To reduce storage', 'To speed up property lookups', 'To enforce data rules', 'To create backups'], correct: 1 },
      { id: 'q27', question: 'What happens when you create a uniqueness constraint?', options: ['It only prevents duplicates', 'It prevents duplicates AND creates an index', 'It creates a backup', 'It only creates an index'], correct: 1 },
      { id: 'q28', question: 'Which index type is best for full-text search on string properties?', options: ['B-tree index', 'TEXT index', 'Composite index', 'Range index'], correct: 1 },
      { id: 'q29', question: 'What does a Node Key constraint enforce?', options: ['Property must exist OR be unique', 'Property must exist AND be unique', 'Node must have a label', 'Relationship must exist'], correct: 1 },
      { id: 'q30', question: 'Which Cypher command shows how a query executes?', options: ['EXPLAIN', 'PROFILE', 'TRACE', 'DEBUG'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Indexes & Constraints',
      description: 'Understand the types of indexes and constraints Neo4j supports.',
      steps: [
        'Write a CREATE INDEX for Movie titles',
        'Write a uniqueness constraint for Person email',
        'Write a composite index on Person (name, age)',
        'Write a TEXT index for full-text on Movie titles',
      ],
      hintCode: "CREATE CONSTRAINT FOR (p:Person) REQUIRE p.email IS UNIQUE\n\nCREATE INDEX FOR (m:Movie) ON (m.title)\n\nCREATE TEXT INDEX FOR (m:Movie) ON (m.title)",
    },
  },

  // ═══ Module 7: APOC Utility Library ═══
  {
    id: 'mod-7',
    title: 'APOC Utility Library',
    lessons: [
      {
        id: 'm7-l1',
        title: 'Introduction to APOC',
        objectives: [
          'Understand what APOC provides (hundreds of procedures and functions)',
          'Install and verify APOC in a Neo4j instance',
          'Browse available APOC procedures using apoc.help',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand what APOC provides (hundreds of procedures and functions)',
            'Install and verify APOC in a Neo4j instance',
            'Browse available APOC procedures using apoc.help',
          ],
          bodyHtml: `
            <h2>APOC — Awesome Procedures On Cypher</h2>
            <p><strong>APOC</strong> is the standard utility library for Neo4j — like a Swiss Army knife with hundreds of pre-built tools. It extends Cypher with procedures and functions for data transformation, graph operations, integration, and more.</p>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 What APOC adds:</strong> Date/time manipulation, string utilities, data import/export, graph refactoring, trigger support, JSON handling, geospatial operations, and much more.
            </div>
            <h3>Installation</h3>
            <p>APOC is available as a plugin. Download the JAR file matching your Neo4j version and place it in the <code>plugins/</code> directory. Restart Neo4j, then verify:</p>
            <pre><code>// Check if APOC is installed\nRETURN apoc.version()</code></pre>
            <h3>Browsing Available Procedures</h3>
            <pre><code>// Search APOC procedures by keyword\nCALL apoc.help('date')\nCALL apoc.help('csv')\nCALL apoc.help('json')</code></pre>
            <p>Each help entry shows the procedure name, description, and signature — making it easy to discover new tools!</p>
          `,
          takeaways: [
            'APOC is a community-contributed library with 450+ procedures and functions',
            'Install by placing the JAR in Neo4j\'s plugins/ directory',
            'Use apoc.help() to browse and search available procedures',
            'APOC covers: data types, strings, dates, geospatial, integration, and more',
          ],
          realWorldExample: 'A logistics company uses APOC to process GPS data. Every truck sends location coordinates, and APOC\'s spatial functions calculate distances between points, find warehouses within a radius, and optimize delivery routes — all from within Cypher queries without external code.'
        }),
        defaultCode: "// Check APOC version and browse available procedures\nRETURN apoc.version() AS apoc_version\n\n// Find date-related procedures\n// CALL apoc.help('date')",
      },
      {
        id: 'm7-l2',
        title: 'APOC for Data Transformation',
        objectives: [
          'Use APOC for date/time parsing and formatting',
          'Convert and manipulate strings with APOC text functions',
          'Load data from CSV and JSON files',
        ],
        content: buildLessonContent({
          objectives: [
            'Use APOC for date/time parsing and formatting',
            'Convert and manipulate strings with APOC text functions',
            'Load data from CSV and JSON files',
          ],
          bodyHtml: `
            <h2>Data Transformation with APOC</h2>
            <h3>Date/Time Functions</h3>
            <p>APOC makes date handling easy:</p>
            <pre><code>// Parse a date string to timestamp (seconds)\nRETURN apoc.date.parse('2024-01-15', 's', 'yyyy-MM-dd') AS timestamp</code></pre>
            <pre><code>// Format a timestamp back to readable date\nRETURN apoc.date.format(1705276800, 's', 'MM/dd/yyyy') AS date_str</code></pre>
            <h3>String Utilities</h3>
            <pre><code>// Join array into string\nRETURN apoc.text.join(['Neo4j', 'Graph', 'Database'], ' - ') AS joined</code></pre>
            <pre><code>// Camel case, URL encode, slug, etc.\nRETURN apoc.text.slug('Hello World') AS slug</code></pre>
            <h3>Loading External Data</h3>
            <pre><code>// Load CSV file\nCALL apoc.load.csv('/data/products.csv') YIELD map AS row\nCREATE (p:Product {name: row.name, price: toFloat(row.price)})</code></pre>
            <pre><code>// Fetch JSON from API\nCALL apoc.load.json('https://api.example.com/users') YIELD value\nCREATE (u:User {name: value.name, email: value.email})</code></pre>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 CSV Loading Pro Tip:</strong> Use <code>apoc.load.jdbc</code> to load data directly from relational databases! Great for migrating from SQL to Neo4j.
            </div>
          `,
          takeaways: [
            'apoc.date.parse/format for date/time conversion',
            'apoc.text functions for string manipulation and cleaning',
            'apoc.load.csv and apoc.load.json import external data',
            'Data can be loaded directly into CREATE or MERGE statements',
          ],
          realWorldExample: 'A financial services firm imports daily transaction CSVs containing millions of rows. APOC\'s apoc.periodic.iterate batches the load in chunks, preventing memory issues. Combined with apoc.date.parse, they convert date strings to proper timestamps during import.'
        }),
        defaultCode: "// Date parsing example\nRETURN apoc.date.parse('2024-06-14', 's', 'yyyy-MM-dd') AS unix_ts\n\n// String join example\nRETURN apoc.text.join(['Alice', 'Bob', 'Charlie'], ', ') AS names",
      },
      {
        id: 'm7-l3',
        title: 'APOC for Graph Operations',
        objectives: [
          'Use APOC for graph-level operations and maintenance',
          'Create virtual nodes and relationships for reporting',
          'Set up triggers for automated graph behavior',
        ],
        content: buildLessonContent({
          objectives: [
            'Use APOC for graph-level operations and maintenance',
            'Create virtual nodes and relationships for reporting',
            'Set up triggers for automated graph behavior',
          ],
          bodyHtml: `
            <h2>Graph Operations with APOC</h2>
            <h3>Graph Refactoring</h3>
            <pre><code>// Merge duplicate nodes (finds and merges nodes with same property)\nCALL apoc.refactor.mergeNodes([node1, node2]) YIELD node\nRETURN node</code></pre>
            <pre><code>// Extract a node from a relationship (makes relationship into a node)\nMATCH (p:Person)-[r:ACTED_IN]->(m:Movie)\nCALL apoc.refactor.extractNode([r], ['Role'], 'HAS_ROLE') YIELD input, output\nRETURN input, output</code></pre>
            <h3>Virtual Nodes & Relationships</h3>
            <p>Create temporary nodes that exist only for the query result (not persisted):</p>
            <pre><code>MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nWITH p, count(m) AS movie_count\nCALL apoc.create.vNode(['Stats'], {name: p.name, movies: movie_count}) YIELD node\nRETURN node</code></pre>
            <h3>Triggers</h3>
            <p>APOC triggers run Cypher code automatically when data changes:</p>
            <pre><code>// Auto-set created_at timestamp when a node is created\nCALL apoc.trigger.add('setTimestamp', 'UNWIND $createdNodes AS n SET n.created_at = timestamp()', {phase:'before'})</code></pre>
          `,
          takeaways: [
            'apoc.refactor helps restructure and clean up your graph',
            'Virtual nodes/render temporary results without saving to DB',
            'Triggers auto-execute Cypher on data changes',
            'Graph refactoring procedures help evolve your schema over time',
          ],
          realWorldExample: 'A social media platform uses APOC triggers to automatically update user activity timestamps. When a User node is connected to a new Post via CREATED relationship, a trigger updates the user\'s "last_active_at" property. No application code needed for this housekeeping!'
        }),
        defaultCode: "// Virtual node example\nCALL apoc.create.vNode(['Stats'], {label: 'Total People', count: 3}) YIELD node\nRETURN node",
      },
    ],
    quiz: [
      { id: 'q31', question: 'What does APOC stand for?', options: ['A Powerful Object Cache', 'Awesome Procedures On Cypher', 'Automated Process On Clusters', 'Additional Protocol Object Container'], correct: 1 },
      { id: 'q32', question: 'How do you search for APOC procedures by keyword?', options: ['CALL apoc.search(\'date\')', 'CALL apoc.help(\'date\')', 'CALL apoc.find(\'date\')', 'CALL apoc.list(\'date\')'], correct: 1 },
      { id: 'q33', question: 'Which APOC procedure loads data from a JSON URL?', options: ['apoc.json.load', 'apoc.load.json', 'apoc.fetch.json', 'apoc.import.json'], correct: 1 },
      { id: 'q34', question: 'What is a virtual node in APOC?', options: ['A permanent node for testing', 'A temporary node that exists only in query results', 'A node with no relationships', 'A node stored in memory cache'], correct: 1 },
      { id: 'q35', question: 'What does apoc.refactor.mergeNodes do?', options: ['Deletes both nodes', 'Combines two nodes into one, merging relationships', 'Copies one node to another', 'Creates a relationship between two nodes'], correct: 1 },
    ],
    practice: {
      title: 'Practice: APOC Tools',
      description: 'APOC procedures typically run in Neo4j Browser. These examples show you the syntax.',
      steps: [
        'Write a query using apoc.date.parse for a date string',
        'Write a query using apoc.text.join with an array of names',
        'Write a query calling apoc.create.vNode to create a virtual stats node',
        'Write a query calling apoc.help to find procedures related to "csv"',
      ],
      hintCode: "// Parse date\nRETURN apoc.date.parse('2024-06-14', 's', 'yyyy-MM-dd') AS ts\n\n// String join\nRETURN apoc.text.join(['Cypher', 'Neo4j', 'Graph'], ' → ') AS result",
    },
  },

  // ═══ Module 8: Graph Algorithms ═══
  {
    id: 'mod-8',
    title: 'Graph Algorithms',
    lessons: [
      {
        id: 'm8-l1',
        title: 'PageRank & Centrality',
        objectives: [
          'Understand PageRank as a measure of node importance',
          'Identify which nodes are most central in a network',
          'Apply centrality in recommendation and fraud detection',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand PageRank as a measure of node importance',
            'Identify which nodes are most central in a network',
            'Apply centrality in recommendation and fraud detection',
          ],
          bodyHtml: `
            <h2>Finding Important Nodes with PageRank</h2>
            <p><strong>PageRank</strong> was Google's original algorithm for ranking web pages. The core idea: a page is important if other important pages link to it.</p>
            <p>In a graph, PageRank measures <strong>influence</strong>. A node with high PageRank is one that many other nodes connect to — especially if THOSE nodes also have high PageRank.</p>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 Think of it like:</strong> A popular Instagram influencer. They're popular because many people follow them (incoming relationships). But their followers are also influential people. PageRank captures both quantity AND quality of connections.
            </div>
            <h3>PageRank in Neo4j GDS</h3>
            <p>Neo4j Graph Data Science (GDS) library provides algorithm implementations:</p>
            <pre><code>// Project graph, run PageRank, and stream results\nCALL gds.pageRank.stream('myGraph') YIELD nodeId, score\nRETURN gds.util.asNode(nodeId).name AS name, score\nORDER BY score DESC</code></pre>
            <h3>Degree Centrality</h3>
            <p>A simpler measure — count how many relationships a node has:</p>
            <pre><code>// Who has the most connections?\nMATCH (p:Person)-[r]-()\nRETURN p.name, count(r) AS connections\nORDER BY connections DESC</code></pre>
          `,
          takeaways: [
            'PageRank measures node importance based on incoming links from important nodes',
            'Degree centrality counts direct connections (simpler measure)',
            'GDS library provides production-ready algorithm implementations',
            'High-PageRank nodes are often influencers, hubs, or fraud targets',
          ],
          realWorldExample: 'Twitter uses a graph algorithm similar to PageRank to recommend who to follow. Accounts followed by many influential users get higher scores — surfacing quality accounts even if they don\'t have millions of followers.'
        }),
        defaultCode: "// Simulate: who has the most movie connections?\nMATCH (p:Person)-[r]-(m:Movie)\nRETURN p.name, count(DISTINCT m) AS connections\nORDER BY connections DESC",
      },
      {
        id: 'm8-l2',
        title: 'Shortest Path Algorithms',
        objectives: [
          'Understand Dijkstra\'s algorithm for weighted shortest paths',
          'Use shortest path for network analysis',
          'Apply shortest path in routing and logistics',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand Dijkstra\'s algorithm for weighted shortest paths',
            'Use shortest path for network analysis',
            'Apply shortest path in routing and logistics',
          ],
          bodyHtml: `
            <h2>Finding the Quickest Route</h2>
            <p><strong>Shortest Path</strong> algorithms find the minimum-distance route between two nodes. <strong>Dijkstra's algorithm</strong> is the most famous — it's how Google Maps finds the fastest driving route!</p>
            <h3>How Dijkstra Works</h3>
            <ol>
              <li>Start at the source node, mark distance as 0</li>
              <li>Visit all neighbors, note their distances from source</li>
              <li>Move to the closest unvisited neighbor</li>
              <li>Repeat until you visit the destination</li>
            </ol>
            <h3>Cypher Built-in Shortest Path</h3>
            <pre><code>// Find shortest path between two nodes\nMATCH path = shortestPath((p1:Person {name: 'Alice'})-[*]-(p2:Person {name: 'Bob'}))\nRETURN path</code></pre>
            <p>This finds the shortest path (fewest relationships) between Alice and Bob.</p>
            <h3>Weighted Shortest Path with GDS</h3>
            <pre><code>// Using GDS Dijkstra with weighted relationships\nCALL gds.shortestPath.dijkstra.stream('myGraph', {\n    sourceNode: source, targetNode: target,\n    relationshipWeightProperty: 'distance'\n}) YIELD nodeIds, totalCost\nRETURN nodeIds, totalCost</code></pre>
            <div class="lesson-callout lesson-callout-realworld">
              <strong>🌍 Real-World:</strong> UPS uses route optimization algorithms to save 10 million gallons of fuel per year. Drivers make fewer left turns because left turns waste time and fuel.
            </div>
          `,
          takeaways: [
            'shortestPath() finds the path with fewest relationships',
            'Dijkstra finds the path with lowest total weight/cost',
            'Use shortestPath for degrees of separation, recommendation paths',
            'Weighted shortest paths model real-world costs (distance, time, price)',
          ],
          realWorldExample: 'LinkedIn uses shortest path to show "How you\'re connected" — the path from you to a potential connection through mutual contacts. "You know Alice, who knows Bob, who works at the company you\'re interested in."'
        }),
        defaultCode: "// Find shortest path between Alice and Bob\nMATCH path = shortestPath(\n    (p1:Person {name: 'Alice'})-[*]-(p2:Person {name: 'Bob'})\n)\nRETURN path",
      },
      {
        id: 'm8-l3',
        title: 'Community Detection',
        objectives: [
          'Understand community detection and clustering',
          'Use Label Propagation and Louvain algorithms',
          'Apply community detection in fraud and social analysis',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand community detection and clustering',
            'Use Label Propagation and Louvain algorithms',
            'Apply community detection in fraud and social analysis',
          ],
          bodyHtml: `
            <h2>Finding Communities in Networks</h2>
            <p><strong>Community detection</strong> finds groups of nodes that are more densely connected to each other than to the rest of the network. At a party, it's like figuring out who's in which conversation group without listening to the words.</p>
            <h3>Louvain Algorithm</h3>
            <p>The Louvain method optimizes "modularity" — a measure of how well the graph is divided into communities. Higher modularity = better separation.</p>
            <pre><code>CALL gds.louvain.stream('myGraph') YIELD nodeId, communityId\nRETURN gds.util.asNode(nodeId).name AS name, communityId\nORDER BY communityId</code></pre>
            <h3>Label Propagation</h3>
            <p>Each node starts with a unique label. Labels "propagate" through the graph as nodes adopt their neighbors' most common label. After enough rounds, communities emerge.</p>
            <pre><code>CALL gds.labelPropagation.stream('myGraph') YIELD nodeId, communityId\nRETURN gds.util.asNode(nodeId).name AS name, communityId</code></pre>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 When to use which?</strong> Louvain is generally more accurate but slower. Label Propagation is faster and works well for large graphs. For graphs under 100K nodes, start with Louvain.
            </div>
          `,
          takeaways: [
            'Community detection finds tightly-knit groups in a network',
            'Louvain optimizes modularity for high-quality communities',
            'Label Propagation is faster for large graphs',
            'Communities reveal fraud rings, friend groups, and topic clusters',
          ],
          realWorldExample: 'Mastercard uses community detection on transaction graphs. If 10 accounts all send money to each other in a closed loop (high internal density, low external connections), they might be part of a money laundering ring. Community detection flags this pattern automatically.'
        }),
        defaultCode: "// Which people are connected to each other?\n// In our small graph, Alice KNOWS Charlie\nMATCH (p1:Person)-[:KNOWS]-(p2:Person)\nRETURN p1.name, p2.name",
      },
    ],
    quiz: [
      { id: 'q36', question: 'What does PageRank measure?', options: ['The distance between nodes', 'Node importance based on incoming links', 'The speed of a query', 'The size of a graph'], correct: 1 },
      { id: 'q37', question: 'Which algorithm is commonly used for finding the shortest weighted path?', options: ['PageRank', 'Dijkstra', 'Louvain', 'Label Propagation'], correct: 1 },
      { id: 'q38', question: 'What does community detection find?', options: ['The fastest route', 'Groups of densely connected nodes', ['The most popular node', 'The graph schema'], 'Groups of densely connected nodes'], correct: 1 },
      { id: 'q39', question: 'Which is generally more accurate but slower: Louvain or Label Propagation?', options: ['Label Propagation', 'Louvain', 'Both are identical', 'Neither finds communities'], correct: 1 },
      { id: 'q40', question: 'In the GDS library, what does gds.util.asNode(nodeId) do?', options: ['Creates a new node', 'Converts internal node ID back to the actual node', 'Deletes the node', 'Checks if a node exists'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Graph Algorithms',
      description: 'Explore the graph and identify relationships, paths, and potential communities.',
      steps: [
        'Find the shortest path between Alice and Diana via shortesPath()',
        'Count each person\'s connections (degree centrality)',
        'Identify which people are connected through MOVIES (potential community)',
        'Try finding Alice\'s "2-hop" neighborhood: MATCH (a:Person {name: \'Alice\'})-[*1..2]-(n)',
      ],
      hintCode: "// Degree centrality (who has the most connections?)\nMATCH (p:Person)-[r]-()\nRETURN p.name, count(r) AS degree\nORDER BY degree DESC\n\n// 2-hop neighborhood of Alice\nMATCH (a:Person {name: 'Alice'})-[*1..2]-(connected)\nRETURN DISTINCT connected",
    },
  },

  // ═══ Module 9: Neo4j with Node.js/Python Drivers ═══
  {
    id: 'mod-9',
    title: 'Neo4j Drivers (Node.js & Python)',
    lessons: [
      {
        id: 'm9-l1',
        title: 'Neo4j JavaScript Driver',
        objectives: [
          'Connect to Neo4j from Node.js using the official driver',
          'Run Cypher queries and process results in JavaScript',
          'Understand session management and connection pooling',
        ],
        content: buildLessonContent({
          objectives: [
            'Connect to Neo4j from Node.js using the official driver',
            'Run Cypher queries and process results in JavaScript',
            'Understand session management and connection pooling',
          ],
          bodyHtml: `
            <h2>Connecting to Neo4j from Node.js</h2>
            <p>The <strong>neo4j-driver</strong> npm package lets your Node.js app communicate with Neo4j over the Bolt protocol.</p>
            <h3>Setup</h3>
            <pre><code>// Install: npm install neo4j-driver\n\nconst neo4j = require('neo4j-driver');\n\n// Create a driver (one per application)\nconst driver = neo4j.driver(\n    'bolt://localhost:7687',\n    neo4j.auth.basic('neo4j', 'password')\n);</code></pre>
            <h3>Running Queries</h3>
            <pre><code>async function findPeople() {\n    const session = driver.session();\n    try {\n        const result = await session.run(\n            'MATCH (p:Person) RETURN p.name AS name, p.age AS age'\n        );\n        result.records.forEach(record => {\n            console.log(record.get('name'), record.get('age'));\n        });\n    } finally {\n        await session.close();\n    }\n}</code></pre>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 Best Practice:</strong> Always use <code>try/finally</code> to close sessions. Use a single driver instance for your app — the driver maintains a connection pool automatically.
            </div>
            <h3>Using Parameters (Security!)</h3>
            <pre><code>await session.run(\n    'MATCH (p:Person {name: $name}) RETURN p',\n    { name: 'Alice' }  // parameter, NOT string concatenation!\n);</code></pre>
            <p>Parameters prevent Cypher injection attacks — just like SQL prepared statements.</p>
          `,
          takeaways: [
            'Use neo4j-driver npm package for Node.js connectivity',
            'Create one driver per app (connection pooling), one session per transaction',
            'Always close sessions in try/finally block',
            'Use parameters ($name) instead of string concatenation for security',
          ],
          realWorldExample: 'A real-time chat app uses Neo4j JavaScript driver to power friend suggestions. When a user opens the app, a Node.js server runs: "Find friends-of-friends that the user doesn\'t already know." The graph query is more intuitive than equivalent SQL with multiple JOINs.'
        }),
        defaultCode: "// JavaScript driver pattern (syntax reference)\n// const neo4j = require('neo4j-driver');\n// const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));\n// const session = driver.session();\n// const result = await session.run('MATCH (n) RETURN count(n) AS count');\n// console.log(result.records[0].get('count'));\n// await session.close();\n// await driver.close();",
      },
      {
        id: 'm9-l2',
        title: 'Neo4j Python Driver',
        objectives: [
          'Connect to Neo4j from Python using the official driver',
          'Run Cypher queries and process results in Python',
          'Integrate Neo4j data with pandas DataFrames',
        ],
        content: buildLessonContent({
          objectives: [
            'Connect to Neo4j from Python using the official driver',
            'Run Cypher queries and process results in Python',
            'Integrate Neo4j data with pandas DataFrames',
          ],
          bodyHtml: `
            <h2>Connecting to Neo4j from Python</h2>
            <p>The <strong>neo4j</strong> pip package provides Python connectivity to Neo4j over Bolt.</p>
            <h3>Setup</h3>
            <pre><code># Install: pip install neo4j\n\nfrom neo4j import GraphDatabase\n\ndriver = GraphDatabase.driver(\n    'bolt://localhost:7687',\n    auth=('neo4j', 'password')\n)</code></pre>
            <h3>Running Queries</h3>
            <pre><code>def get_people(tx):\n    result = tx.run('MATCH (p:Person) RETURN p.name AS name, p.age AS age')\n    return [{'name': r['name'], 'age': r['age']} for r in result]\n\nwith driver.session() as session:\n    people = session.execute_read(get_people)\n    for person in people:\n        print(f\"{person['name']} is {person['age']} years old\")</code></pre>
            <h3>Integration with pandas</h3>
            <pre><code>import pandas as pd\n\ndef get_as_dataframe(tx):\n    result = tx.run('MATCH (p:Person) RETURN p.name AS name, p.age AS age')\n    return pd.DataFrame([r.data() for r in result])\n\nwith driver.session() as session:\n    df = session.execute_read(get_as_dataframe)\n    print(df.describe())  # pandas statistics!</code></pre>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 Python + Neo4j is powerful for data science!</strong> You can run graph algorithms, export results to pandas, and build machine learning models on graph features.
            </div>
          `,
          takeaways: [
            'Use the neo4j pip package for Python connectivity',
            'Use session.execute_read/write for transaction management',
            'Neo4j data integrates naturally with pandas DataFrames',
            'Python\'s context manager (with statement) handles session cleanup',
          ],
          realWorldExample: 'A data science team at a retail company uses Neo4j Python driver to build a recommendation engine. They extract user purchase graphs into pandas, train a model on graph features (PageRank, community membership, purchase history), and deploy the model via a Flask API.'
        }),
        defaultCode: "# Python driver pattern (syntax reference)\n# pip install neo4j\n# from neo4j import GraphDatabase\n# driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'password'))\n# with driver.session() as session:\n#     result = session.run('MATCH (n) RETURN count(n) AS count')\n#     print(result.single()['count'])",
      },
      {
        id: 'm9-l3',
        title: 'Building REST APIs with Neo4j',
        objectives: [
          'Build a REST API endpoint backed by Neo4j queries',
          'Use parameterized Cypher in API endpoints',
          'Return JSON responses from graph queries',
        ],
        content: buildLessonContent({
          objectives: [
            'Build a REST API endpoint backed by Neo4j queries',
            'Use parameterized Cypher in API endpoints',
            'Return JSON responses from graph queries',
          ],
          bodyHtml: `
            <h2>Graph-Backed REST APIs</h2>
            <p>Let's build a Node.js/Express API that uses Neo4j to power a social app:</p>
            <pre><code>const express = require('express');\nconst neo4j = require('neo4j-driver');\nconst app = express();\n\nconst driver = neo4j.driver('bolt://localhost:7687',\n    neo4j.auth.basic('neo4j', 'password'));\n\napp.use(express.json());\n\n// GET /api/users/:name/friends\napp.get('/api/users/:name/friends', async (req, res) => {\n    const session = driver.session();\n    try {\n        const result = await session.run(\n            "MATCH (p:Person {name: $name})-[:KNOWS]->(friend)\n             RETURN friend.name AS name, friend.age AS age",\n            { name: req.params.name }\n        );\n        const friends = result.records.map(r => ({\n            name: r.get('name'),\n            age: r.get('age')\n        }));\n        res.json({ user: req.params.name, friends });\n    } finally {\n        await session.close();\n    }\n});\n\n// POST /api/users (create a user)\napp.post('/api/users', async (req, res) => {\n    const session = driver.session();\n    try {\n        const result = await session.run(\n            'CREATE (p:Person $props) RETURN p.name AS name',\n            { props: req.body }\n        );\n        res.status(201).json({ created: result.records[0].get('name') });\n    } finally {\n        await session.close();\n    }\n});\n\napp.listen(3000, () => console.log('API running on port 3000'));</code></pre>
            <div class="lesson-callout lesson-callout-warning">
              <strong>⚠️ Security:</strong> Never use string concatenation to build Cypher queries from user input! Always use parameters (<code>$name</code>, <code>$props</code>).
            </div>
          `,
          takeaways: [
            'REST API + Neo4j = natural JSON responses from graph queries',
            'Always use parameterized Cypher ($param) from API endpoints',
            'One driver instance per app, one session per API request',
            'Neo4j\'s graph model maps naturally to REST resources',
          ],
          realWorldExample: 'The Washington Post uses Neo4j to power their "Connections" feature — showing how politicians, companies, and lobbyists are connected. Their API serves graph data to an interactive visualization frontend, allowing readers to explore influence networks.'
        }),
        defaultCode: "// Express API pattern with Neo4j\n// app.get('/api/users/:name/friends', async (req, res) => {\n//   const session = driver.session();\n//   try {\n//     const result = await session.run(\n//       'MATCH (p:Person {name: $name})-[:KNOWS]->(friend) RETURN friend.name',\n//       { name: req.params.name }\n//     );\n//     res.json(result.records.map(r => r.get('friend.name')));\n//   } finally { await session.close(); }\n// });",
      },
    ],
    quiz: [
      { id: 'q41', question: 'Which npm package provides Neo4j connectivity for Node.js?', options: ['neo4j-node', 'neo4j-driver', 'node-neo4j', 'cypher-driver'], correct: 1 },
      { id: 'q42', question: 'How should you pass user input into a Cypher query?', options: ['String concatenation', 'Using parameters ($name)', 'Template literals', 'Global variables'], correct: 1 },
      { id: 'q43', question: 'In the Python driver, what pattern manages sessions safely?', options: ['Try/catch', 'Context manager (with)', 'Manual open/close', 'Callback pattern'], correct: 1 },
      { id: 'q44', question: 'How many Neo4j driver instances should an application create?', options: ['One per query', 'One per application (connection pool)', 'One per server restart', 'One per user session'], correct: 1 },
      { id: 'q45', question: 'What does session.execute_read() do in the Python driver?', options: ['Executes a write transaction', 'Executes a read transaction', 'Reads session metadata', 'Creates a new session'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Driver Patterns',
      description: 'Review the driver code patterns for both JavaScript and Python.',
      steps: [
        'Review the JavaScript driver setup code above',
        'Review the Python driver setup code above',
        'Note the parameterized query pattern with $name',
        'Compare driver patterns across both languages',
      ],
      hintCode: "// JS: const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('user', 'pass'))\n// Python: driver = GraphDatabase.driver('bolt://localhost:7687', auth=('user', 'pass'))",
    },
  },

  // ═══ Module 10: Visualization with Neovis.js ═══
  {
    id: 'mod-10',
    title: 'Visualization with Neovis.js',
    lessons: [
      {
        id: 'm10-l1',
        title: 'Introduction to Neovis.js',
        objectives: [
          'Understand what Neovis.js provides for graph visualization',
          'Set up a basic Neovis.js visualization',
          'Connect Neovis.js to a Neo4j instance',
        ],
        content: buildLessonContent({
          objectives: [
            'Understand what Neovis.js provides for graph visualization',
            'Set up a basic Neovis.js visualization',
            'Connect Neovis.js to a Neo4j instance',
          ],
          bodyHtml: `
            <h2>Visualizing Graphs with Neovis.js</h2>
            <p><strong>Neovis.js</strong> is a JavaScript library that turns your Neo4j data into interactive, visually appealing graphs in the browser. It's built on top of vis.js (which powers our simulator!).</p>
            <div class="lesson-callout lesson-callout-info">
              <strong>💡 Why visualize?</strong> A graph visualization lets you see patterns, clusters, and connections instantly — things that are hidden in rows of tabular data. "A picture is worth a thousand JOINs."
            </div>
            <h3>Basic Setup</h3>
            <pre><code>// Include the library\n&lt;script src=\"https://unpkg.com/neovis.js/dist/neovis.js\"&gt;&lt;/script&gt;\n\n// Configure and render\nconst config = {\n    containerId: 'viz',\n    neo4j: {\n        serverUrl: 'bolt://localhost:7687',\n        serverUser: 'neo4j',\n        serverPassword: 'password'\n    },\n    labels: {\n        Person: { title: 'name', color: '#93c5fd' },\n        Movie: { title: 'title', color: '#fca5a5' }\n    },\n    relationships: {\n        ACTED_IN: { color: '#9ca3af' },\n        DIRECTED: { color: '#6b7280' }\n    },\n    initialQuery: 'MATCH (p:Person)-[r:ACTED_IN]->(m:Movie) RETURN p,r,m'\n};\n\nconst viz = new NeoVis.default(config);\nviz.render();</code></pre>
          `,
          takeaways: [
            'Neovis.js renders Neo4j data as interactive browser graphs',
            'Configuration defines node styling, labels, and colors',
            'initialQuery populates the graph on load',
            'Built on vis.js — nodes are draggable, zoomable, clickable',
          ],
          realWorldExample: 'The Pandora Papers investigation (ICIJ) used graph visualization to map 11.9 million documents showing offshore financial connections. Journalists could visually trace connections between shell companies, politicians, and banks — uncovering patterns impossible to see in spreadsheets.'
        }),
        defaultCode: "// Neovis.js config pattern (reference)\n// const viz = new NeoVis.default({\n//   containerId: 'myViz',\n//   neo4j: { serverUrl: 'bolt://localhost:7687', ... },\n//   labels: { Person: { title: 'name', color: '#93c5fd' } },\n//   initialQuery: 'MATCH (n) RETURN n'\n// });\n// viz.render();",
      },
      {
        id: 'm10-l2',
        title: 'Customizing Visualizations',
        objectives: [
          'Style nodes with colors, sizes, shapes, and images',
          'Customize relationship rendering (color, width, caption)',
          'Add interactive behaviors with event handlers',
        ],
        content: buildLessonContent({
          objectives: [
            'Style nodes with colors, sizes, shapes, and images',
            'Customize relationship rendering (color, width, caption)',
            'Add interactive behaviors with event handlers',
          ],
          bodyHtml: `
            <h2>Customizing Your Graph Visualization</h2>
            <p>Neovis.js lets you control every visual aspect of your graph:</p>
            <h3>Node Styling</h3>
            <pre><code>labels: {\n    Person: {\n        title: 'name',           // Property shown in tooltip\n        color: '#93c5fd',        // Node color\n        size: 'age',             // Size by property value\n        shape: 'dot',            // dot, square, star, triangle, image\n        image: '/avatars/user.png',  // Custom image (for 'image' shape)\n        caption: {\n            property: 'name',\n            fontSize: 12\n        }\n    },\n    Movie: {\n        title: 'title',\n        color: '#fca5a5',\n        size: 'rating',          // Larger nodes for higher rating\n        shape: 'diamond'\n    }\n}</code></pre>
            <h3>Relationship Styling</h3>
            <pre><code>relationships: {\n    ACTED_IN: {\n        color: '#9ca3af',\n        width: 2,                // Line thickness\n        caption: true,          // Show relationship type label\n        thickness: 'percentage' // Vary thickness by value\n    }\n}</code></pre>
            <h3>Event Handlers</h3>
            <pre><code>viz.registerOnEvent('click', function(event) {\n    if (event.nodes.length > 0) {\n        const nodeId = event.nodes[0];\n        console.log('Clicked node:', nodeId);\n        // Show details panel, navigate, filter, etc.\n    }\n});</code></pre>
          `,
          takeaways: [
            'Customize node appearance: color, size, shape, image, caption',
            'Relationship styling: color, width, caption text',
            'Nodes can be sized dynamically by property values',
            'Event handlers enable click, hover, and selection interactions',
          ],
          realWorldExample: 'The New York Times uses custom graph visualizations in their data journalism. In an investigation about political donations, nodes representing large donors were sized by donation amount (bigger = more money), colored by party affiliation, and connected to the politicians they funded.'
        }),
        defaultCode: "// Custom styling config reference\n// labels: {\n//   Person: { color: '#93c5fd', size: 'age', shape: 'dot' },\n//   Movie: { color: '#fca5a5', size: 'rating', shape: 'diamond' }\n// }",
      },
      {
        id: 'm10-l3',
        title: 'Building Interactive Graph Dashboards',
        objectives: [
          'Combine Neovis.js with UI controls (search, filter, detail panel)',
          'Update the visualization dynamically based on user input',
          'Design a complete graph dashboard experience',
        ],
        content: buildLessonContent({
          objectives: [
            'Combine Neovis.js with UI controls (search, filter, detail panel)',
            'Update the visualization dynamically based on user input',
            'Design a complete graph dashboard experience',
          ],
          bodyHtml: `
            <h2>Building a Graph Dashboard</h2>
            <p>Let's put it all together with a searchable movie graph dashboard:</p>
            <h3>HTML Structure</h3>
            <pre><code>&lt;div class=\"dashboard\"&gt;\n    &lt;div class=\"sidebar\"&gt;\n        &lt;input id=\"search\" placeholder=\"Search actor...\" /&gt;\n        &lt;div id=\"details\"\&gt;Click a node for details&lt;/div&gt;\n    &lt;/div&gt;\n    &lt;div id=\"viz\"&gt;&lt;/div&gt;\n&lt;/div&gt;</code></pre>
            <h3>Dynamic Query on Search</h3>
            <pre><code>document.getElementById('search').addEventListener('input', (e) => {\n    const name = e.target.value;\n    if (name.length < 2) return;\n    viz.reinitialize({\n        initialQuery: \"MATCH (p:Person)\n            WHERE p.name CONTAINS ' + name + '\n            OPTIONAL MATCH (p)-[r]-(x)\n            RETURN p,r,x\"\n    });\n});</code></pre>
            <h3>Click-Node Detail Panel</h3>
            <pre><code>viz.registerOnEvent('click', function(event) {\n    if (event.nodes.length === 0) return;\n    \n    const session = driver.session();\n    session.run(\n        'MATCH (n) WHERE id(n) = $id RETURN n',\n        { id: parseInt(event.nodes[0]) }\n    ).then(result => {\n        const node = result.records[0].get('n');\n        document.getElementById('details').innerHTML =\n            '&lt;h3&gt;' + node.properties.name + '&lt;/h3&gt;' +\n            '&lt;p&gt;Age: ' + node.properties.age + '&lt;/p&gt;';\n    }).finally(() => session.close());\n});</code></pre>
            <div class="lesson-callout lesson-callout-tip">
              <strong>📝 Dashboard design tip:</strong> Use a detail panel (not a popup/modal) for node information. This lets users explore the graph and see details simultaneously — a hallmark of professional graph interfaces.
            </div>
          `,
          takeaways: [
            'Combine Neovis.js with HTML controls for interactive dashboards',
            'Use viz.reinitialize() to update the graph dynamically',
            'Side panels for node details create professional graph UIs',
            'The Graph Simulator in this very Academy is an example dashboard!',
          ],
          realWorldExample: 'The Neo4j Browser (the web interface that ships with Neo4j) is a graph dashboard! It has a query editor, result visualization, and node detail view. Many companies build custom dashboards like this for domain-specific use — fraud analysts, network engineers, supply chain managers all get tailored views of their connected data.'
        }),
        defaultCode: "// Dynamic reinitialization pattern\n// viz.reinitialize({ initialQuery: 'MATCH (p:Person {name: \"Alice\"})-[r]-(x) RETURN p,r,x' });\n\n// The Graph Simulator tab in this Academy is a working example!",
      },
    ],
    quiz: [
      { id: 'q46', question: 'What library is Neovis.js built on?', options: ['D3.js', 'vis.js', 'Three.js', 'Chart.js'], correct: 1 },
      { id: 'q47', question: 'How do you update a Neovis.js visualization with a new query?', options: ['viz.refresh()', 'viz.reinitialize({...})', 'viz.update({...})', 'viz.render({...})'], correct: 1 },
      { id: 'q48', question: 'What does "size: \'age\'" do in a Neovis.js label config?', options: ['Shows age as text', 'Sizes nodes proportionally to the age property', 'Limits nodes by age', 'Filters by age'], correct: 1 },
      { id: 'q49', question: 'Which Neovis.js config option connects to a Neo4j instance?', options: ['database', 'neo4j', 'connection', 'graph'], correct: 1 },
      { id: 'q50', question: 'How do you handle node clicks in Neovis.js?', options: ['viz.onClick()', 'viz.registerOnEvent(\'click\', fn)', 'element.addEventListener(\'click\', fn)', 'Neovis doesn\'t support clicks'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Visualize the Graph',
      description: 'The Graph Simulator tab is your visualization dashboard! Practice using it.',
      steps: [
        'Click the Graph Simulator tab',
        'Run the default MATCH (n) RETURN n query',
        'Click on nodes in the visualization to see them selected',
        'Try different queries and watch the graph update',
      ],
      hintCode: "// The Graph Simulator uses vis.js (same engine as Neovis.js)!\n// Try: MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\n// RETURN p, m",
    },
  },
];

// ─── DOM Elements ──────────────────────────────────────────────────
const elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  cypherEditor: document.getElementById('cypher-editor'),
  runQueryBtn: document.getElementById('run-query-btn'),
  jsonResults: document.getElementById('json-results'),
  graphNetwork: document.getElementById('graph-network'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
};

// ─── Initialization ────────────────────────────────────────────────
function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
}

// ─── Event Listener Setup ──────────────────────────────────────────
function setupEventListeners() {
  elements.tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.runQueryBtn.addEventListener('click', runSimulation);

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
      checkAnswer(btn.dataset.quizId, parseInt(btn.dataset.module), parseInt(btn.dataset.qindex));
    }
  });
}

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

// ─── Tab Management ────────────────────────────────────────────────
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

      if (tabId === 'simulator') {
        if (!network) {
          // Wait for layout to compute, then init and fit
          requestAnimationFrame(function () {
            initGraph();
            if (network) {
              network.fit();
            }
          });
        } else {
          setTimeout(function () { network.fit(); }, 100);
        }
      }
    } else {
      pane.classList.add('hidden');
      pane.classList.remove('block', 'flex', 'flex-col');
    }
  });
}

// ─── Sidebar Rendering ─────────────────────────────────────────────
function renderSidebar() {
  var html = '';
  curriculum.forEach(function (mod, mIndex) {
    html += '<div class="sidebar-module">' +
      '<h3 class="sidebar-module-title">' + mod.title + '</h3>' +
      '<ul class="space-y-1">';

    mod.lessons.forEach(function (lesson, lIndex) {
      var isCompleted = userProgress.completedLessons.indexOf(lesson.id) !== -1;
      var isActive = mIndex === activeModule && lIndex === activeLesson;

      html += '<li>' +
        '<button class="w-full text-left sidebar-lesson' + (isActive ? ' active' : '') + '" ' +
        'data-module="' + mIndex + '" data-lesson="' + lIndex + '">' +
        '<i class="' + (isCompleted ? 'fas fa-check-circle text-indigo-500' : 'far fa-circle text-gray-400') + ' mr-2 w-4"></i>' +
        lesson.title +
        '</button>' +
        '</li>';
    });

    html += '</ul></div>';
  });

  elements.sidebarContent.innerHTML = html;
}

// ─── Load Lesson ───────────────────────────────────────────────────
function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;
  var lesson = curriculum[mIndex].lessons[lIndex];

  if (userProgress.completedLessons.indexOf(lesson.id) === -1) {
    markLessonComplete(lesson.id);
  }

  // Look up ELI5 content from the global data file if available
  var eli5Html = '';
  if (window.eli5Neo4jData && window.eli5Neo4jData[lesson.id]) {
    eli5Html = window.eli5Neo4jData[lesson.id];
  }

  if (window.eli5Toggle) {
    elements.lessonContent.innerHTML = window.eli5Toggle.wrapContent(lesson.content, eli5Html);
    window.eli5Toggle.initToggle('neo4j', elements.lessonContent);
  } else {
    elements.lessonContent.innerHTML = lesson.content;
  }

  elements.cypherEditor.value = lesson.defaultCode || '';
  if (window.copyCode) {
    window.copyCode.init(elements.lessonContent);
  }
  elements.jsonResults.innerHTML = '<span class="text-gray-400 italic">Run a query to see results...</span>';

  if (network) {
    network.unselectAll();
  }

  renderQuiz(mIndex);
  renderSidebar();

  if (window.innerWidth < 768 && !elements.sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
}

// ─── Quiz ──────────────────────────────────────────────────────────
function renderQuiz(mIndex) {
  var quiz = curriculum[mIndex].quiz;
  var html = '<h2 class="text-2xl font-bold mb-6 text-gray-800">📋 Module Knowledge Check</h2>';

  if (!quiz || quiz.length === 0) {
    elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
    return;
  }

  quiz.forEach(function (q, i) {
    html += '<div class="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-100 quiz-question" id="q-container-' + q.id + '">' +
      '<p class="font-semibold text-lg text-gray-800 mb-4">' + (i + 1) + '. ' + q.question + '</p>' +
      '<div class="space-y-2">';

    q.options.forEach(function (opt, oIndex) {
      html += '<label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">' +
        '<input type="radio" name="quiz-' + q.id + '" value="' + oIndex + '" class="mr-3 w-4 h-4 text-indigo-600">' +
        '<span class="text-gray-700">' + opt + '</span>' +
        '</label>';
    });

    html += '</div>' +
      '<button data-quiz-id="' + q.id + '" data-module="' + mIndex + '" data-qindex="' + i + '" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">' +
      '<i class="fas fa-paper-plane mr-1"></i>Submit Answer</button>' +
      '<div id="q-feedback-' + q.id + '" class="mt-3 hidden text-sm font-medium"></div>' +
      '</div>';
  });

  elements.quizContent.innerHTML = html;
}

// ─── Check Quiz Answer ─────────────────────────────────────────────
window.checkAnswer = function (qId, mIndex, qIndex) {
  var selected = document.querySelector('input[name="quiz-' + qId + '"]:checked');
  var feedback = document.getElementById('q-feedback-' + qId);
  var container = document.getElementById('q-container-' + qId);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  var selectedValue = parseInt(selected.value, 10);
  if (isNaN(selectedValue)) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Invalid selection.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  var correctAns = curriculum[mIndex].quiz[qIndex].correct;

  if (selectedValue === correctAns) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-3 text-sm font-medium text-indigo-600 block';
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

// ─── Progress Tracking ─────────────────────────────────────────────
function markLessonComplete(lessonId) {
  if (userProgress.completedLessons.indexOf(lessonId) === -1) {
    userProgress.completedLessons.push(lessonId);
    saveProgress();
  }
}

function saveProgress() {
  localStorage.setItem('neo4jHubProgress', JSON.stringify(userProgress));
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

// ─── Neo4j Simulator Engine (vis.js) ───────────────────────────────

function initGraph() {
  if (!window.vis) {
    console.error('vis.js not loaded yet');
    return;
  }

  var formattedNodes = mockGraphData.nodes.map(function (n) {
    return {
      id: n.id,
      label: n.name || n.title || n.label,
      group: n.label,
      font: { color: '#1f2937' },
      shape: 'dot',
      size: 20,
      color: n.color,
      borderWidth: 2,
    };
  });

  nodesDataset = new vis.DataSet(formattedNodes);
  edgesDataset = new vis.DataSet(mockGraphData.edges);

  var data = {
    nodes: nodesDataset,
    edges: edgesDataset,
  };

  var options = {
    nodes: {
      borderWidth: 2,
      shadow: true,
      color: {
        border: '#4b5563',
        highlight: { border: '#4f46e5', background: '#e0e7ff' },
      },
    },
    edges: {
      width: 2,
      color: '#9ca3af',
      font: { align: 'top' },
      smooth: { type: 'continuous' },
    },
    physics: {
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.3,
        springLength: 150,
      },
      stabilization: { iterations: 150 },
    },
    interaction: {
      hover: true,
      zoomView: true,
    },
  };

  network = new vis.Network(elements.graphNetwork, data, options);
}

function runSimulation() {
  if (!network) {
    // Graph not initialized yet — try to init now
    initGraph();
    if (!network) {
      elements.jsonResults.innerHTML = '<span class="text-amber-500 italic">Graph is loading… please try again in a moment.</span>';
      return;
    }
  }

  var query = elements.cypherEditor.value.trim();
  if (!query) return;

  var matchedNodes = [];
  var matchedEdges = [];

  // Basic Regex Parsing to simulate a Cypher engine
  var labelMatch = query.match(/\(\w+:(\w+)\)/);
  var propMatch = query.match(/\{(\w+):\s*'([^']+)'\}/);
  var relMatch = query.match(/-\[:(\w+)\]->/);

  // Filter nodes
  matchedNodes = mockGraphData.nodes.filter(function (node) {
    var isMatch = true;
    if (labelMatch && node.label !== labelMatch[1]) isMatch = false;
    if (propMatch && node[propMatch[1]] !== propMatch[2]) isMatch = false;
    return isMatch;
  });

  // Filter edges if explicitly queried
  if (relMatch) {
    matchedEdges = mockGraphData.edges.filter(function (edge) { return edge.label === relMatch[1]; });
    matchedEdges.forEach(function (edge) {
      var fromNode = mockGraphData.nodes.find(function (n) { return n.id === edge.from; });
      var toNode = mockGraphData.nodes.find(function (n) { return n.id === edge.to; });
      if (fromNode && !matchedNodes.find(function (n) { return n.id === edge.from; })) {
        matchedNodes.push(fromNode);
      }
      if (toNode && !matchedNodes.find(function (n) { return n.id === edge.to; })) {
        matchedNodes.push(toNode);
      }
    });
  }

  // If MATCH with no specific pattern, show everything
  if (!labelMatch && !propMatch && !relMatch && query.includes('MATCH')) {
    matchedNodes = [].concat(mockGraphData.nodes);
    matchedEdges = [].concat(mockGraphData.edges);
  }

  // Output to JSON
  var resultObj = {
    nodes: matchedNodes.length > 0 ? matchedNodes : 'No records found',
    relationships: matchedEdges.length > 0 ? matchedEdges : [],
  };
  elements.jsonResults.innerHTML = JSON.stringify(resultObj, null, 2).replace(
    /"([^"]+)":/g,
    '<span class="text-indigo-600">"$1"</span>:'
  );

  // Highlight in vis-network
  network.unselectAll();

  if (matchedNodes.length > 0 || matchedEdges.length > 0) {
    var nodeIds = matchedNodes.map(function (n) { return n.id; });
    var edgeIds = matchedEdges.map(function (e) { return e.id; });

    network.selectNodes(nodeIds);
    network.selectEdges(edgeIds);

    if (nodeIds.length > 0) {
      network.fit({ nodes: nodeIds, animation: true });
    }
  }
}

// ─── Run init on load ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
