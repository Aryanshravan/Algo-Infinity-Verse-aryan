/* eslint-disable no-unused-vars, no-undef */
var activeModule = 0;
var activeLesson = 0;
var userProgress = JSON.parse(localStorage.getItem('elasticHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

var mockDb = {
  products: [
    { id: '1', name: 'Dell XPS 13 Laptop', category: 'electronics', price: 999.99, tags: ['laptop', 'computer', 'dell'], in_stock: true, rating: 4.5, release_date: '2024-01-15' },
    { id: '2', name: 'Apple MacBook Pro', category: 'electronics', price: 1299.00, tags: ['laptop', 'apple', 'mac'], in_stock: true, rating: 4.8, release_date: '2023-11-20' },
    { id: '3', name: 'Logitech MX Master 3', category: 'accessories', price: 99.99, tags: ['mouse', 'wireless'], in_stock: true, rating: 4.6, release_date: '2024-02-10' },
    { id: '4', name: 'Sony WH-1000XM4 Headphones', category: 'audio', price: 348.00, tags: ['headphones', 'wireless', 'noise-canceling'], in_stock: false, rating: 4.7, release_date: '2023-09-05' },
    { id: '5', name: 'LG 27 inch 4K Monitor', category: 'electronics', price: 399.00, tags: ['monitor', '4k', 'display'], in_stock: true, rating: 4.4, release_date: '2024-03-01' },
    { id: '6', name: 'Samsung Galaxy Tab S9', category: 'electronics', price: 799.99, tags: ['tablet', 'samsung', 'android'], in_stock: true, rating: 4.6, release_date: '2024-01-20' },
    { id: '7', name: 'Bose QuietComfort Earbuds', category: 'audio', price: 279.00, tags: ['earbuds', 'wireless', 'noise-canceling'], in_stock: false, rating: 4.3, release_date: '2023-12-15' },
    { id: '8', name: 'Anker USB-C Hub', category: 'accessories', price: 34.99, tags: ['usb', 'hub', 'adapter'], in_stock: true, rating: 4.2, release_date: '2024-04-01' },
  ],
  orders: [
    { id: 'ORD-001', customer: 'Alice Johnson', total: 1299.00, status: 'completed', date: '2024-01-15', items: [{ sku: 'LAP-002', qty: 1, price: 1299.00, name: 'MacBook Pro' }], region: 'NA' },
    { id: 'ORD-002', customer: 'Bob Smith', total: 447.99, status: 'completed', date: '2024-01-18', items: [{ sku: 'MON-001', qty: 1, price: 399.00, name: 'LG Monitor' }, { sku: 'ACC-003', qty: 1, price: 34.99, name: 'USB Hub' }, { sku: 'ACC-001', qty: 1, price: 99.99, name: 'MX Master 3' }], region: 'NA' },
    { id: 'ORD-003', customer: 'Carol Davis', total: 279.00, status: 'processing', date: '2024-02-01', items: [{ sku: 'AUD-002', qty: 1, price: 279.00, name: 'Bose Earbuds' }], region: 'EU' },
    { id: 'ORD-004', customer: 'Bob Smith', total: 999.99, status: 'shipped', date: '2024-02-05', items: [{ sku: 'LAP-001', qty: 1, price: 999.99, name: 'Dell XPS 13' }], region: 'NA' },
    { id: 'ORD-005', customer: 'Diana Lee', total: 1747.99, status: 'completed', date: '2024-02-10', items: [{ sku: 'LAP-002', qty: 1, price: 1299.00, name: 'MacBook Pro' }, { sku: 'MON-001', qty: 1, price: 399.00, name: 'LG Monitor' }, { sku: 'ACC-001', qty: 1, price: 99.99, name: 'MX Master 3' }], region: 'APAC' },
    { id: 'ORD-006', customer: 'Eve Martinez', total: 629.99, status: 'pending', date: '2024-02-15', items: [{ sku: 'AUD-001', qty: 1, price: 348.00, name: 'Sony Headphones' }, { sku: 'ACC-003', qty: 1, price: 34.99, name: 'USB Hub' }], region: 'EU' },
    { id: 'ORD-007', customer: 'Frank Wilson', total: 799.99, status: 'completed', date: '2024-03-01', items: [{ sku: 'TAB-001', qty: 1, price: 799.99, name: 'Galaxy Tab S9' }], region: 'NA' },
    { id: 'ORD-008', customer: 'Alice Johnson', total: 999.99, status: 'cancelled', date: '2024-03-05', items: [{ sku: 'LAP-001', qty: 1, price: 999.99, name: 'Dell XPS 13' }], region: 'NA' },
  ],
  logs: [
    { id: '1', '@timestamp': '2024-01-15T10:30:00Z', level: 'ERROR', message: 'Connection timeout to upstream service', service: 'api-gateway', duration_ms: 5002, host: 'web-01', env: 'production' },
    { id: '2', '@timestamp': '2024-01-15T10:31:00Z', level: 'INFO', message: 'User login successful', service: 'auth-service', duration_ms: 120, host: 'web-02', env: 'production' },
    { id: '3', '@timestamp': '2024-01-15T10:32:00Z', level: 'WARN', message: 'High memory usage detected', service: 'api-gateway', duration_ms: 15, host: 'web-01', env: 'production' },
    { id: '4', '@timestamp': '2024-01-15T10:33:00Z', level: 'ERROR', message: 'Database query timeout', service: 'user-service', duration_ms: 15000, host: 'db-01', env: 'production' },
    { id: '5', '@timestamp': '2024-01-15T10:34:00Z', level: 'INFO', message: 'Cache refreshed successfully', service: 'cache-service', duration_ms: 340, host: 'cache-01', env: 'production' },
    { id: '6', '@timestamp': '2024-01-15T11:00:00Z', level: 'ERROR', message: 'Payment gateway unavailable', service: 'payment-service', duration_ms: 8000, host: 'pay-01', env: 'production' },
    { id: '7', '@timestamp': '2024-01-15T11:05:00Z', level: 'INFO', message: 'Scheduled task completed', service: 'scheduler', duration_ms: 4500, host: 'worker-01', env: 'staging' },
    { id: '8', '@timestamp': '2024-01-15T11:10:00Z', level: 'WARN', message: 'Disk space below 20%', service: 'monitoring', duration_ms: 8, host: 'mon-01', env: 'production' },
    { id: '9', '@timestamp': '2024-01-15T11:15:00Z', level: 'INFO', message: 'Deployment completed for v2.1.3', service: 'ci-cd', duration_ms: 45000, host: 'build-01', env: 'staging' },
    { id: '10', '@timestamp': '2024-01-15T12:00:00Z', level: 'ERROR', message: 'OutOfMemoryError in worker thread', service: 'worker-service', duration_ms: 60000, host: 'worker-02', env: 'production' },
  ],
  employees: [
    { id: '1', name: 'John Doe', department: 'Engineering', salary: 95000, age: 32, skills: ['Java', 'Python', 'Kubernetes'], joined: '2020-03-15', level: 'senior', location: 'NYC' },
    { id: '2', name: 'Jane Smith', department: 'Engineering', salary: 110000, age: 38, skills: ['Go', 'AWS', 'Terraform'], joined: '2019-06-01', level: 'staff', location: 'SF' },
    { id: '3', name: 'Bob Johnson', department: 'Marketing', salary: 75000, age: 28, skills: ['Content Strategy', 'SEO', 'Analytics'], joined: '2021-09-10', level: 'mid', location: 'NYC' },
    { id: '4', name: 'Alice Williams', department: 'Engineering', salary: 85000, age: 26, skills: ['JavaScript', 'React', 'Node.js'], joined: '2022-01-20', level: 'mid', location: 'SF' },
    { id: '5', name: 'Charlie Brown', department: 'Sales', salary: 65000, age: 30, skills: ['CRM', 'Negotiation', 'Presentation'], joined: '2021-04-05', level: 'mid', location: 'CHI' },
    { id: '6', name: 'Diana Prince', department: 'Engineering', salary: 130000, age: 42, skills: ['Python', 'ML', 'TensorFlow', 'Kubernetes'], joined: '2018-08-12', level: 'principal', location: 'SF' },
    { id: '7', name: 'Eve Davis', department: 'HR', salary: 72000, age: 35, skills: ['Recruiting', 'Payroll', 'Compliance'], joined: '2020-11-01', level: 'senior', location: 'NYC' },
    { id: '8', name: 'Frank Miller', department: 'Marketing', salary: 82000, age: 31, skills: ['PPC', 'Analytics', 'A/B Testing'], joined: '2021-02-15', level: 'senior', location: 'CHI' },
  ],
};

var curriculum = [
  {
    id: 'mod-1',
    title: 'Elasticsearch Basics & Indexing',
    lessons: [
      {
        id: 'm1-l1',
        title: 'What is Elasticsearch?',
        objectives: ['Understand Elasticsearch as a distributed RESTful search engine', 'Explain indices, documents, and fields', 'Run a match_all query to retrieve all documents'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Understand Elasticsearch as a distributed RESTful search engine','Explain indices, documents, and fields','Run a match_all query to retrieve all documents'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Welcome to Elasticsearch</h2><p>Elasticsearch is a <strong>distributed, RESTful search and analytics engine</strong> for use cases like full-text search, log analytics, and real-time monitoring.</p><p>It stores data as <strong>JSON documents</strong>. Each document belongs to an <strong>index</strong>.</p><h3>Core Concepts</h3><ul><li><strong>Index</strong> — Like a database table. Eg. <code>products</code>, <code>orders</code>.</li><li><strong>Document</strong> — A single JSON object (a row). Eg. one product.</li><li><strong>Field</strong> — A key-value pair inside a document (a column). Eg. <code>name</code>, <code>price</code>.</li><li><strong>Mapping</strong> — Schema definition for fields.</li><li><strong>Node</strong> — A single running instance of Elasticsearch.</li><li><strong>Cluster</strong> — A collection of nodes working together.</li></ul><pre><code>GET /products/_search\n{\n  "query": {\n    "match_all": {}\n  }\n}</code></pre><p><code>match_all</code> returns every document — like <code>SELECT * FROM products</code> in SQL.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Elasticsearch stores JSON documents in indices</li><li>It is distributed — data splits across nodes for scale</li><li>Communication via REST APIs (HTTP JSON)</li><li><code>match_all</code> retrieves all documents in an index</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "query": {\n    "match_all": {}\n  }\n}',
      },
      {
        id: 'm1-l2',
        title: 'Creating & Managing Indices',
        objectives: ['Create indices with explicit settings', 'Understand shards, replicas, and index settings', 'Use aliases for zero-downtime index management'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Create indices with explicit settings','Understand shards, replicas, and index settings','Use aliases for zero-downtime index management'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Working with Indices</h2><p>Indices are the primary containers. Create them with specific settings:</p><pre><code>PUT /products\n{\n  "settings": {\n    "number_of_shards": 3,\n    "number_of_replicas": 1\n  },\n  "mappings": {\n    "properties": {\n      "name": { "type": "text" },\n      "price": { "type": "float" },\n      "in_stock": { "type": "boolean" }\n    }\n  }\n}</code></pre><h3>Settings</h3><ul><li><strong>number_of_shards</strong> — How many pieces the index splits into</li><li><strong>number_of_replicas</strong> — Backup copies of each shard</li><li><strong>refresh_interval</strong> — How often new data becomes searchable</li></ul><h3>Aliases</h3><p>Aliases let you refer to an index by a different name — zero-downtime reindexing:</p><pre><code>POST /_aliases\n{\n  "actions": [\n    { "add": { "index": "products-v2", "alias": "products" } },\n    { "remove": { "index": "products-v1", "alias": "products" } }\n  ]\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Create indices with PUT /indexname</li><li>Settings control shards, replicas, refresh interval</li><li>Aliases enable zero-downtime reindexing</li><li>Mappings define the schema of your documents</li></ul></div></div>',
        defaultCode: 'PUT /my-app-logs\n{\n  "settings": {\n    "number_of_shards": 2,\n    "number_of_replicas": 1\n  }\n}',
      },
      {
        id: 'm1-l3',
        title: 'Document CRUD Operations',
        objectives: ['Index, retrieve, update, and delete documents', 'Use bulk API for efficient indexing', 'Understand versioning and optimistic concurrency'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Index, retrieve, update, and delete documents','Use bulk API for efficient indexing','Understand versioning and optimistic concurrency'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>CRUD Operations</h2><h3>Index a Document</h3><pre><code>PUT /products/_doc/10\n{\n  "name": "Google Pixel 9",\n  "category": "electronics",\n  "price": 899.00,\n  "in_stock": true\n}</code></pre><h3>Retrieve a Document</h3><pre><code>GET /products/_doc/1</code></pre><h3>Update a Document</h3><pre><code>POST /products/_update/1\n{\n  "doc": {\n    "price": 949.99\n  }\n}</code></pre><h3>Delete a Document</h3><pre><code>DELETE /products/_doc/3</code></pre><h3>Bulk Indexing</h3><pre><code>POST /products/_bulk\n{"index": {"_id": "20"}}\n{"name": "iPad Air", "category": "electronics", "price": 599.00}\n{"index": {"_id": "21"}}\n{"name": "AirPods Pro", "category": "audio", "price": 249.00}</code></pre><p>Each line is an action line + source line pair using NDJSON format.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>PUT/POST for create, GET for read, POST _update for partial update, DELETE to remove</li><li>Bulk API dramatically improves indexing throughput</li><li>ES uses optimistic concurrency with version numbers</li></ul></div></div>',
        defaultCode: 'GET /products/_doc/1',
      },
    ],
    quiz: [
      { id: 'q1', question: 'In Elasticsearch, what is the equivalent of a relational database table?', options: ['A Cluster', 'A Node', 'A Document', 'An Index'], correct: 3 },
      { id: 'q2', question: 'Which API creates a new index with custom settings?', options: ['POST /_create', 'PUT /my-index', 'PATCH /my-index', 'PUT /_index/my-index'], correct: 1 },
      { id: 'q3', question: 'What is the purpose of an index alias?', options: ['To encrypt the index', 'To provide a secondary name for zero-downtime ops', 'To compress index data', 'To create a copy of the index'], correct: 1 },
      { id: 'q4', question: 'Which HTTP endpoint is used for partial document updates?', options: ['PUT with _doc', 'POST with _update', 'PATCH with _doc', 'DELETE with _update'], correct: 1 },
      { id: 'q5', question: 'What format does the bulk API use?', options: ['A single JSON array', 'NDJSON (action + source per doc)', 'CSV with headers', 'XML in JSON envelope'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Basic Indexing',
      description: 'Use the simulator to index a new product, retrieve, update its price, and verify.',
      steps: ['Index a product with PUT /products/_doc/30', 'Retrieve with GET /products/_doc/30', 'Update price with POST /products/_update/30', 'Verify by retrieving again'],
      hintCode: 'POST /products/_update/30\n{\n  "doc": {\n    "price": 49.99\n  }\n}',
    },
  },
  {
    id: 'mod-2',
    title: 'The Search API (Match & Term)',
    lessons: [
      {
        id: 'm2-l1',
        title: 'The Match Query',
        objectives: ['Perform full-text search with the match query', 'Understand text analysis and tokenization', 'Use fuzziness for typo-tolerant search'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Perform full-text search with the match query','Understand text analysis and tokenization','Use fuzziness for typo-tolerant search'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Full-Text Search with Match</h2><p>The <code>match</code> query is the standard for full-text search. ES analyzes both the query and field text, then scores by relevance.</p><pre><code>GET /products/_search\n{\n  "query": {\n    "match": {\n      "name": "laptop"\n    }\n  }\n}</code></pre><h3>How Match Works</h3><ol><li>Query text is analyzed (lowercased, tokenized: ["laptop"])</li><li>Each token is searched in the inverted index</li><li>Documents with more matches get higher scores</li></ol><h3>Fuzziness</h3><pre><code>GET /products/_search\n{\n  "query": {\n    "match": {\n      "name": {\n        "query": "laptop",\n        "fuzziness": "AUTO"\n      }\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Match performs analyzed full-text search</li><li>Text is tokenized and stored in an inverted index</li><li>Fuzziness handles typos and misspellings</li><li>Documents scored by relevance (BM25)</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "query": {\n    "match": {\n      "name": "laptop"\n    }\n  }\n}',
      },
      {
        id: 'm2-l2',
        title: 'The Term Query',
        objectives: ['Use term queries for exact-value matching', 'Understand keyword vs text field distinction', 'Combine term queries with filters'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Use term queries for exact-value matching','Understand keyword vs text field distinction','Combine term queries with filters'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Exact Value Search</h2><p>The <code>term</code> query finds documents with an exact term match — no analysis.</p><pre><code>GET /products/_search\n{\n  "query": {\n    "term": {\n      "category": "audio"\n    }\n  }\n}</code></pre><h3>keyword vs text</h3><ul><li><strong>text</strong> — Analyzed, tokenized, for full-text search</li><li><strong>keyword</strong> — Not analyzed, for exact match, aggs, sorting</li></ul><p>Use <code>term</code> on keyword fields. Using term on text fields usually returns nothing because the field was tokenized.</p><p>For multiple values, use <code>terms</code> (plural):</p><pre><code>GET /products/_search\n{\n  "query": {\n    "terms": {\n      "category": ["electronics", "audio"]\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Term queries do exact, unanalyzed matching</li><li>Use on keyword fields for categories, IDs, enums</li><li>Terms (plural) matches any of multiple values</li><li>Term queries are fast in filter context</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "query": {\n    "term": {\n      "category": "audio"\n    }\n  }\n}',
      },
      {
        id: 'm2-l3',
        title: 'Multi-match & Phrase Search',
        objectives: ['Search across multiple fields with multi_match', 'Use match_phrase for exact phrase matching', 'Control field relevance with boosting'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Search across multiple fields with multi_match','Use match_phrase for exact phrase matching','Control field relevance with boosting'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Multi-Field & Phrase Search</h2><h3>Multi-Match</h3><pre><code>GET /products/_search\n{\n  "query": {\n    "multi_match": {\n      "query": "wireless mouse",\n      "fields": ["name", "tags"]\n    }\n  }\n}</code></pre><h3>Field Boosting</h3><pre><code>GET /products/_search\n{\n  "query": {\n    "multi_match": {\n      "query": "laptop",\n      "fields": ["name^3", "tags"]\n    }\n  }\n}</code></pre><p><code>^3</code> means the field is 3x more important.</p><h3>Match Phrase</h3><pre><code>GET /products/_search\n{\n  "query": {\n    "match_phrase": {\n      "name": "27 inch 4K"\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>multi_match searches the same query across multiple fields</li><li>Use ^ to boost more important fields</li><li>match_phrase requires exact term order</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "query": {\n    "multi_match": {\n      "query": "wireless",\n      "fields": ["name", "tags"]\n    }\n  }\n}',
      },
    ],
    quiz: [
      { id: 'q6', question: 'Which query type performs full-text analysis and scoring?', options: ['term', 'match', 'prefix', 'range'], correct: 1 },
      { id: 'q7', question: 'What happens using term query on a text field?', options: ['Works same as match', 'May return no results because text is tokenized', 'Throws an error', 'Auto-converts to match'], correct: 1 },
      { id: 'q8', question: 'How to boost a field in multi_match?', options: ['name.boost: 3', 'name:3', 'name^3', 'boost(name, 3)'], correct: 2 },
      { id: 'q9', question: 'Main difference between match_phrase and match?', options: ['match_phrase is faster', 'match_phrase requires exact term order', 'match_phrase handles typos', 'Only works on keyword'], correct: 1 },
      { id: 'q10', question: 'What field type to target with a term query?', options: ['text', 'keyword', 'integer only', 'boolean only'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Search Queries',
      description: 'Find electronics products using different query types and compare results.',
      steps: ['Run match query searching "laptop" in name', 'Run term query filtering category as "electronics"', 'Run multi_match searching "wireless" across name and tags', 'Compare result counts and scores'],
      hintCode: 'GET /products/_search\n{\n  "query": {\n    "multi_match": {\n      "query": "wireless",\n      "fields": ["name", "tags"]\n    }\n  }\n}',
    },
  },
  {
    id: 'mod-3',
    title: 'Basic Aggregations',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Introduction to Aggs',
        objectives: ['Understand aggregations as data summarization', 'Write a terms aggregation for grouping', 'Use size: 0 to suppress document results'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Understand aggregations as data summarization','Write a terms aggregation for grouping','Use size: 0 to suppress document results'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Introduction to Aggregations</h2><p>Aggregations summarize data — like SQL GROUP BY but more powerful.</p><pre><code>GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "categories": {\n      "terms": {\n        "field": "category.keyword"\n      }\n    }\n  }\n}</code></pre><h3>Anatomy</h3><ul><li><code>"aggs"</code> — Top-level key</li><li><code>"categories"</code> — Your custom result name</li><li><code>"terms"</code> — Aggregation type</li></ul><p><code>"size": 0</code> means: "only return aggregation results, skip documents."</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Aggs summarize data without returning documents</li><li>size:0 skips document results</li><li>Terms agg groups by unique field values</li><li>Use .keyword suffix for text fields in aggs</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "categories": {\n      "terms": {\n        "field": "category.keyword"\n      }\n    }\n  }\n}',
      },
      {
        id: 'm3-l2',
        title: 'Metric Aggregations',
        objectives: ['Calculate avg, sum, min, max with metric aggs', 'Use the stats agg for a complete summary', 'Combine metric aggs with queries'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Calculate avg, sum, min, max with metric aggs','Use the stats agg for a complete summary','Combine metric aggs with queries'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Metric Aggregations</h2><h3>Single-Value Metrics</h3><pre><code>GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "avg_price": { "avg": { "field": "price" } },\n    "max_price": { "max": { "field": "price" } },\n    "min_price": { "min": { "field": "price" } },\n    "total_stock_value": { "sum": { "field": "price" } }\n  }\n}</code></pre><h3>Multi-Value: Stats</h3><pre><code>GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "price_stats": { "stats": { "field": "price" } }\n  }\n}</code></pre><p><code>stats</code> returns count, min, max, avg, and sum in one request.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Metric aggs: avg, sum, min, max</li><li>Stats gives count, min, max, avg, sum in one call</li><li>Queries filter which documents are aggregated</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "price_stats": { "stats": { "field": "price" } }\n  }\n}',
      },
      {
        id: 'm3-l3',
        title: 'Bucket Aggregations',
        objectives: ['Create buckets with terms, range, and histogram aggs', 'Nest metric aggs inside bucket aggs', 'Build multi-level reports'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Create buckets with terms, range, and histogram aggs','Nest metric aggs inside bucket aggs','Build multi-level reports'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Bucket Aggregations</h2><h3>Range Aggregation</h3><pre><code>GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "price_ranges": {\n      "range": {\n        "field": "price",\n        "ranges": [\n          { "to": 100 },\n          { "from": 100, "to": 500 },\n          { "from": 500 }\n        ]\n      }\n    }\n  }\n}</code></pre><h3>Histogram</h3><pre><code>GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "price_histogram": {\n      "histogram": {\n        "field": "price",\n        "interval": 200\n      }\n    }\n  }\n}</code></pre><h3>Nested Buckets + Metrics</h3><pre><code>GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "by_category": {\n      "terms": { "field": "category.keyword" },\n      "aggs": {\n        "avg_price": { "avg": { "field": "price" } }\n      }\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Range creates custom buckets by value ranges</li><li>Histogram creates equal-interval buckets</li><li>Nesting metrics inside buckets yields per-group stats</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "price_ranges": {\n      "range": {\n        "field": "price",\n        "ranges": [\n          { "to": 100 },\n          { "from": 100, "to": 500 },\n          { "from": 500 }\n        ]\n      }\n    }\n  }\n}',
      },
    ],
    quiz: [
      { id: 'q11', question: 'What does size: 0 do in an aggregation request?', options: ['Deletes the index', 'Returns 0 aggregations', 'Skips docs, returns only aggs', 'Compresses response'], correct: 2 },
      { id: 'q12', question: 'Which agg returns count, min, max, avg, and sum?', options: ['extended_stats', 'stats', 'composite', 'multi_terms'], correct: 1 },
      { id: 'q13', question: 'How to restrict aggs to only certain documents?', options: ['Use a query alongside the aggs', 'Use "filter" agg param', 'Set "include" on the agg', 'All of the above'], correct: 0 },
      { id: 'q14', question: 'Which agg creates custom-defined numeric buckets?', options: ['terms', 'range', 'histogram', 'date_range'], correct: 1 },
      { id: 'q15', question: 'Where do sub-aggregations go?', options: ['Root level', 'Inside the parent agg object', 'Separate request body', 'Query context'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Aggregation Pipeline',
      description: 'Build a report with count and avg price per category.',
      steps: ['Write terms agg on category.keyword', 'Add nested avg agg for price', 'Add value_count per bucket', 'Set size: 0 and observe aggs only'],
      hintCode: 'GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "by_category": {\n      "terms": { "field": "category.keyword" },\n      "aggs": {\n        "avg_price": { "avg": { "field": "price" } }\n      }\n    }\n  }\n}',
    },
  },
  {
    id: 'mod-4',
    title: 'Mapping & Analysis',
    lessons: [
      {
        id: 'm4-l1',
        title: 'Mapping Basics',
        objectives: ['Define explicit mappings for fields', 'Understand data types (text, keyword, numeric, date)', 'Use multi-fields for text + keyword search'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Define explicit mappings for fields','Understand data types (text, keyword, numeric, date)','Use multi-fields for text + keyword search'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Understanding Mapping</h2><p>Mapping defines how fields are stored and indexed.</p><h3>Core Types</h3><ul><li><strong>text</strong> — Full-text, analyzed</li><li><strong>keyword</strong> — Exact match, sort, aggs</li><li><strong>integer</strong>, <strong>float</strong> — Numeric</li><li><strong>boolean</strong> — true/false</li><li><strong>date</strong> — Date/time</li><li><strong>geo_point</strong> — Lat/lon</li><li><strong>ip</strong> — IP addresses</li></ul><h3>Multi-Fields</h3><pre><code>PUT /employees\n{\n  "mappings": {\n    "properties": {\n      "name": {\n        "type": "text",\n        "fields": {\n          "keyword": { "type": "keyword" }\n        }\n      },\n      "salary": { "type": "integer" },\n      "joined": { "type": "date" }\n    }\n  }\n}</code></pre><p>Now <code>name</code> works with match, <code>name.keyword</code> with term and aggs.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Mapping defines field types and analysis rules</li><li>text for full-text, keyword for exact match</li><li>Multi-fields serve both text and keyword roles</li></ul></div></div>',
        defaultCode: 'PUT /employees\n{\n  "mappings": {\n    "properties": {\n      "name": {\n        "type": "text",\n        "fields": {\n          "keyword": { "type": "keyword" }\n        }\n      },\n      "salary": { "type": "integer" }\n    }\n  }\n}',
      },
      {
        id: 'm4-l2',
        title: 'Analyzers & Tokenizers',
        objectives: ['Understand analysis pipeline (char filters, tokenizer, token filters)', 'Use _analyze API to test analyzers', 'Configure custom analyzers'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Understand analysis pipeline (char filters, tokenizer, token filters)','Use _analyze API to test analyzers','Configure custom analyzers'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Analysis Pipeline</h2><ol><li><strong>Character filters</strong> — Strip HTML, replace chars</li><li><strong>Tokenizer</strong> — Split text into tokens</li><li><strong>Token filters</strong> — Lowercase, remove stop words, stem</li></ol><h3>Testing Analyzers</h3><pre><code>POST /_analyze\n{\n  "analyzer": "standard",\n  "text": "The Quick Brown Foxes"\n}</code></pre><h3>Built-in Analyzers</h3><ul><li><strong>standard</strong> — Grammar-based + lowercase (default)</li><li><strong>simple</strong> — Split on non-letters, lowercase</li><li><strong>whitespace</strong> — Split on spaces</li><li><strong>keyword</strong> — One token (no analysis)</li></ul><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Pipeline: char filters -> tokenizer -> token filters</li><li>Use _analyze to test analyzers</li><li>Custom analyzers combine built-in components</li></ul></div></div>',
        defaultCode: 'POST /_analyze\n{\n  "analyzer": "standard",\n  "text": "The Quick Brown Foxes"\n}',
      },
      {
        id: 'm4-l3',
        title: 'Dynamic vs Explicit Mapping',
        objectives: ['Compare dynamic and explicit mapping approaches', 'Use dynamic templates to control auto-mapping', 'Update mappings with _mapping API'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Compare dynamic and explicit mapping approaches','Use dynamic templates to control auto-mapping','Update mappings with _mapping API'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Dynamic vs Explicit Mapping</h2><h3>Dynamic Mapping</h3><p>ES auto-detects field types. Convenient but risky — a malformed doc can create wrong mappings.</p><h3>Explicit Mapping</h3><pre><code>PUT /products\n{\n  "mappings": {\n    "dynamic": "strict",\n    "properties": {\n      "name": { "type": "text" },\n      "price": { "type": "float" },\n      "tags": { "type": "keyword" }\n    }\n  }\n}</code></pre><p><code>"dynamic": "strict"</code> rejects docs with unknown fields — no surprises.</p><h3>Dynamic Templates</h3><pre><code>PUT /logs\n{\n  "mappings": {\n    "dynamic_templates": [\n      {\n        "strings_as_keyword": {\n          "match_mapping_type": "string",\n          "mapping": { "type": "keyword" }\n        }\n      }\n    ]\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Dynamic mapping auto-detects types (risky for production)</li><li>Explicit mapping gives full control</li><li>Dynamic templates provide rules-based auto-mapping</li></ul></div></div>',
        defaultCode: 'PUT /test-logs\n{\n  "mappings": {\n    "dynamic": "strict",\n    "properties": {\n      "message": { "type": "text" },\n      "severity": { "type": "keyword" },\n      "@timestamp": { "type": "date" }\n    }\n  }\n}',
      },
    ],
    quiz: [
      { id: 'q16', question: 'Which field type for exact-value matching with aggs?', options: ['text', 'keyword', 'match_only_text', 'search_as_you_type'], correct: 1 },
      { id: 'q17', question: 'Correct order of analysis pipeline?', options: ['Tokenizer -> Char -> Token Filter', 'Char Filter -> Tokenizer -> Token Filter', 'Token Filter -> Tokenizer -> Char Filter', 'Char -> Token Filter -> Tokenizer'], correct: 1 },
      { id: 'q18', question: 'Which API tests how text is analyzed?', options: ['GET /_test', 'POST /_analyze', 'PUT /_tokenize', 'POST /_search'], correct: 1 },
      { id: 'q19', question: 'What does "dynamic": "strict" do?', options: ['Allows any field type', 'Rejects docs with unmapped fields', 'Auto-converts to text', 'Only allows strings'], correct: 1 },
      { id: 'q20', question: 'How to support both full-text and exact-match on one field?', options: ['Two separate fields', 'Multi-field with text + keyword', 'Not possible', 'Use keyword_only'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Mapping & Analysis',
      description: 'Create explicit mapping, test analyzer, observe dynamic behavior.',
      steps: ['Create index with text + keyword mapping', 'Test standard analyzer with _analyze', 'Index a doc and view mapping', 'Add dynamic template for string-as-keyword'],
      hintCode: 'POST /_analyze\n{\n  "analyzer": "standard",\n  "text": "Elasticsearch is a distributed search engine"\n}',
    },
  },
  {
    id: 'mod-5',
    title: 'Compound & Boolean Queries',
    lessons: [
      {
        id: 'm5-l1',
        title: 'The Bool Query',
        objectives: ['Combine conditions with bool (must, should, filter, must_not)', 'Understand must vs filter difference', 'Build query/filter combinations'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Combine conditions with bool (must, should, filter, must_not)','Understand must vs filter difference','Build query/filter combinations'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>The Bool Query</h2><ul><li><strong>must</strong> — All must match (contributes to score)</li><li><strong>filter</strong> — All must match (no scoring, cached)</li><li><strong>should</strong> — At least one should match (boosts score)</li><li><strong>must_not</strong> — Exclude matching docs</li></ul><pre><code>GET /products/_search\n{\n  "query": {\n    "bool": {\n      "must": [\n        { "match": { "name": "laptop" } }\n      ],\n      "filter": [\n        { "term": { "in_stock": true } },\n        { "range": { "price": { "lte": 1500 } } }\n      ],\n      "must_not": [\n        { "term": { "category": "accessories" } }\n      ]\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Bool combines must/filter/should/must_not clauses</li><li>Filter is cached and faster than must</li><li>Should clauses boost relevance scores</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "query": {\n    "bool": {\n      "must": [\n        { "match": { "name": "laptop" } }\n      ],\n      "filter": [\n        { "term": { "in_stock": true } }\n      ]\n    }\n  }\n}',
      },
      {
        id: 'm5-l2',
        title: 'Boosting & Disjunction Max',
        objectives: ['Use boosting query to demote results', 'Apply dis_max for best-field matching', 'Control relevance with field boosting'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Use boosting query to demote results','Apply dis_max for best-field matching','Control relevance with field boosting'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Boosting & Dis Max</h2><h3>Boosting</h3><pre><code>GET /products/_search\n{\n  "query": {\n    "boosting": {\n      "positive": { "match": { "name": "headphones" } },\n      "negative": { "term": { "in_stock": false } },\n      "negative_boost": 0.5\n    }\n  }\n}</code></pre><h3>Dis Max</h3><pre><code>GET /products/_search\n{\n  "query": {\n    "dis_max": {\n      "queries": [\n        { "match": { "name": "wireless mouse" } },\n        { "match": { "tags": "wireless mouse" } }\n      ],\n      "tie_breaker": 0.3\n    }\n  }\n}</code></pre><p><code>dis_max</code> takes the best score from any sub-query.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Boosting demotes (not removes) matching docs</li><li>dis_max picks the best single-field score</li><li>Tie_breaker blends in scores from other queries</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "query": {\n    "dis_max": {\n      "queries": [\n        { "match": { "name": "mouse" } },\n        { "match": { "tags": "mouse" } }\n      ]\n    }\n  }\n}',
      },
      {
        id: 'm5-l3',
        title: 'Nested & Parent-Child Queries',
        objectives: ['Understand nested field type and query', 'Use has_child and has_parent for joins', 'Query objects with preserved independence'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Understand nested field type and query','Use has_child and has_parent for joins','Query objects with preserved independence'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Nested & Join Queries</h2><h3>The Nested Problem</h3><p>JSON arrays are flattened. Items in an order lose their boundaries without nested type.</p><h3>Nested Query</h3><pre><code>GET /orders/_search\n{\n  "query": {\n    "nested": {\n      "path": "items",\n      "query": {\n        "bool": {\n          "must": [\n            { "match": { "items.name": "Monitor" } },\n            { "range": { "items.qty": { "gte": 1 } } }\n          ]\n        }\n      }\n    }\n  }\n}</code></pre><h3>Join (Parent-Child)</h3><pre><code>GET /employees/_search\n{\n  "query": {\n    "has_child": {\n      "type": "employee",\n      "query": {\n        "term": { "level": "senior" }\n      }\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Nested preserves object independence in arrays</li><li>has_child / has_parent traverse parent-child relations</li></ul></div></div>',
        defaultCode: 'GET /orders/_search\n{\n  "query": {\n    "nested": {\n      "path": "items",\n      "query": {\n        "match": { "items.name": "Monitor" }\n      }\n    }\n  }\n}',
      },
    ],
    quiz: [
      { id: 'q21', question: 'Which bool clause is best for cached, non-scoring filters?', options: ['must', 'should', 'filter', 'must_not'], correct: 2 },
      { id: 'q22', question: 'What does boosting do to negative-matched docs?', options: ['Excludes them', 'Reduces their score', 'Increases score', 'Moves to separate index'], correct: 1 },
      { id: 'q23', question: 'What problem does nested solve?', options: ['Slow queries', 'Array cross-object matching', 'Indexing speed', 'Data duplication'], correct: 1 },
      { id: 'q24', question: 'Which query finds parents with matching children?', options: ['has_parent', 'has_child', 'parent_id', 'nested'], correct: 1 },
      { id: 'q25', question: 'Purpose of tie_breaker in dis_max?', options: ['Removes ties', 'Adds scores from other queries', 'Breaks query apart', 'Limits results'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Compound Queries',
      description: 'Build a bool query: electronics, under $500, in stock, with name matching "laptop" or "monitor".',
      steps: ['Filter for category: electronics', 'Range filter for price under 500', 'must_not out-of-stock', 'should match name "laptop" or "monitor"'],
      hintCode: 'GET /products/_search\n{\n  "query": {\n    "bool": {\n      "filter": [\n        { "term": { "category": "electronics" } },\n        { "range": { "price": { "lte": 500 } } }\n      ],\n      "should": [\n        { "match": { "name": "laptop" } }\n      ]\n    }\n  }\n}',
    },
  },
  {
    id: 'mod-6',
    title: 'Aggregations Deep Dive',
    lessons: [
      {
        id: 'm6-l1',
        title: 'Pipeline Aggregations',
        objectives: ['Use pipeline aggs on other aggs', 'Calculate derivatives, moving averages', 'Chain bucket_script for custom formulas'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Use pipeline aggs on other aggs','Calculate derivatives, moving averages','Chain bucket_script for custom formulas'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Pipeline Aggregations</h2><p>Pipeline aggs run on the output of other aggs.</p><h3>Parent vs Sibling</h3><ul><li><strong>Parent</strong> — Uses parent output. Eg: derivative, moving_avg</li><li><strong>Sibling</strong> — Uses sibling output. Eg: max_bucket, avg_bucket</li></ul><pre><code>GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "by_category": {\n      "terms": { "field": "category.keyword" },\n      "aggs": {\n        "avg_price": { "avg": { "field": "price" } }\n      }\n    },\n    "highest_avg_category": {\n      "max_bucket": {\n        "buckets_path": "by_category>avg_price"\n      }\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Pipeline aggs compute on results of other aggs</li><li>buckets_path references sibling/parent aggs</li><li>Max_bucket finds bucket with highest value</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "by_category": {\n      "terms": { "field": "category.keyword" },\n      "aggs": {\n        "avg_price": { "avg": { "field": "price" } }\n      }\n    },\n    "highest_avg_category": {\n      "max_bucket": {\n        "buckets_path": "by_category>avg_price"\n      }\n    }\n  }\n}',
      },
      {
        id: 'm6-l2',
        title: 'Nested & Geo Aggregations',
        objectives: ['Aggregate nested fields with nested aggs', 'Use geo_distance and geohash_grid', 'Build location-aware analytics'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Aggregate nested fields with nested aggs','Use geo_distance and geohash_grid','Build location-aware analytics'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Nested & Geo Aggregations</h2><h3>Nested Agg</h3><pre><code>GET /orders/_search\n{\n  "size": 0,\n  "aggs": {\n    "order_items": {\n      "nested": { "path": "items" },\n      "aggs": {\n        "top_products": {\n          "terms": { "field": "items.name.keyword" }\n        },\n        "revenue": {\n          "sum": { "field": "items.price" }\n        }\n      }\n    }\n  }\n}</code></pre><h3>Geo Aggs</h3><pre><code>GET /employees/_search\n{\n  "size": 0,\n  "aggs": {\n    "by_distance": {\n      "geo_distance": {\n        "field": "location",\n        "origin": "40.7128,-74.0060",\n        "ranges": [\n          { "to": 100 },\n          { "from": 100, "to": 500 },\n          { "from": 500 }\n        ]\n      }\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Nested agg aggregates within nested arrays</li><li>Geo_distance groups by proximity to a point</li></ul></div></div>',
        defaultCode: 'GET /orders/_search\n{\n  "size": 0,\n  "aggs": {\n    "order_items": {\n      "nested": { "path": "items" },\n      "aggs": {\n        "top_products": {\n          "terms": { "field": "items.name.keyword" }\n        }\n      }\n    }\n  }\n}',
      },
      {
        id: 'm6-l3',
        title: 'Scripted Aggregations',
        objectives: ['Use Painless scripts for custom calculations', 'Understand script phases and performance', 'Write inline scripts with built-in aggs'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Use Painless scripts for custom calculations','Understand script phases and performance','Write inline scripts with built-in aggs'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Scripted Aggregations</h2><h3>Inline Script</h3><pre><code>GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "discounted": {\n      "sum": {\n        "script": {\n          "source": "doc[\'price\'].value * 0.9"\n        }\n      }\n    }\n  }\n}</code></pre><h3>When to Use Scripts</h3><ul><li>Unit conversions (currency, temperature)</li><li>Conditional calculations</li><li>Complex formulas not covered by built-ins</li></ul><p><strong>Performance tip:</strong> Prefer indexed fields over runtime scripts.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Scripts use Painless language</li><li>Inline scripts work with built-in aggs</li><li>Prefer indexed fields for better performance</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "discounted_sum": {\n      "sum": {\n        "script": { "source": "doc[\'price\'].value * 0.9" }\n      }\n    }\n  }\n}',
      },
    ],
    quiz: [
      { id: 'q26', question: 'What do pipeline aggs operate on?', options: ['Raw docs', 'Output of other aggs', 'Query results', 'External data'], correct: 1 },
      { id: 'q27', question: 'Which pipeline agg finds the bucket with highest average?', options: ['max_bucket', 'highest_bucket', 'top_metrics', 'bucket_sort'], correct: 0 },
      { id: 'q28', question: 'What does reverse_nested do?', options: ['Reverses sort order', 'Returns from nested to root context', 'Inverts booleans', 'Undoes previous agg'], correct: 1 },
      { id: 'q29', question: 'Which phase of scripted_metric processes documents?', options: ['init_script', 'map_script', 'combine_script', 'reduce_script'], correct: 1 },
      { id: 'q30', question: 'Best practice for complex runtime calculations?', options: ['Always use scripts', 'Store pre-computed values', 'Use multiple queries', 'Skip the calculation'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Deep Aggregations',
      description: 'Calculate avg price per category, find which has the highest average.',
      steps: ['Create terms agg on category.keyword', 'Add nested avg agg for price', 'Add max_bucket pipeline agg', 'Observe winner category'],
      hintCode: 'GET /products/_search\n{\n  "size": 0,\n  "aggs": {\n    "by_category": {\n      "terms": { "field": "category.keyword" },\n      "aggs": {\n        "avg_price": { "avg": { "field": "price" } }\n      }\n    },\n    "winner": {\n      "max_bucket": {\n        "buckets_path": "by_category>avg_price"\n      }\n    }\n  }\n}',
    },
  },
  {
    id: 'mod-7',
    title: 'Cluster Architecture & Node Roles',
    lessons: [
      {
        id: 'm7-l1',
        title: 'Node Roles in Elasticsearch',
        objectives: ['Identify node roles (master, data, ingest, coordinating)', 'Understand when to use dedicated node types', 'Configure node roles'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Identify node roles (master, data, ingest, coordinating)','Understand when to use dedicated node types','Configure node roles'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Node Roles</h2><ul><li><strong>Master-eligible</strong> — Cluster management: indices, shard allocation</li><li><strong>Data</strong> — Stores data, executes CRUD, search, aggs</li><li><strong>Ingest</strong> — Pre-processes docs via pipelines</li><li><strong>Coordinating</strong> — Load balancer, routes requests</li><li><strong>Machine Learning</strong> — Anomaly detection, forecasting</li></ul><h3>Production Best Practices</h3><ul><li>Small (<3 nodes): all-in-one</li><li>Medium (3-10): 3 dedicated master, rest data+ingest</li><li>Large (10+): fully separate roles</li></ul><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Master manages cluster state</li><li>Data stores and queries</li><li>Ingest pre-processes</li><li>Coordinating routes requests</li></ul></div></div>',
        defaultCode: 'GET /_cat/nodes?v=true&h=name,node.role,ip,heap.percent,ram.percent',
      },
      {
        id: 'm7-l2',
        title: 'Cluster State & Discovery',
        objectives: ['Explain cluster state maintenance', 'Understand Zen Discovery and elections', 'Troubleshoot common cluster issues'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Explain cluster state maintenance','Understand Zen Discovery and elections','Troubleshoot common cluster issues'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Cluster State & Discovery</h2><p>Cluster state is the global metadata: indices, mappings, shard routing.</p><h3>APIs</h3><pre><code>GET /_cluster/state\nGET /_cluster/health\nGET /_cluster/allocation/explain</code></pre><h3>Discovery</h3><ul><li><strong>Zen Discovery</strong> (pre-8.x) — Unicast/multicast peers, quorum-based election</li><li><strong>Quorum Discovery</strong> (8.x+) — Simpler: automatic quorum = (N/2) + 1</li></ul><h3>Common Issues</h3><ul><li><strong>Split-brain</strong> — Two masters. Prevented by quorum setting.</li><li><strong>Cluster state too large</strong> — Too many indices slow propagation.</li></ul><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Cluster state is replicated to all nodes</li><li>Quorum = (N/2) + 1 prevents split-brain</li></ul></div></div>',
        defaultCode: 'GET /_cluster/health?pretty=true',
      },
      {
        id: 'm7-l3',
        title: 'Shard Allocation & Rebalancing',
        objectives: ['Understand shard allocation across nodes', 'Configure allocation awareness', 'Trigger manual reroute'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Understand shard allocation across nodes','Configure allocation awareness','Trigger manual reroute'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Shard Allocation & Rebalancing</h2><h3>Allocation Settings</h3><pre><code>PUT /_cluster/settings\n{\n  "persistent": {\n    "cluster.routing.allocation.enable": "all"\n  }\n}</code></pre><ul><li><code>all</code> — All shards can be allocated</li><li><code>primaries</code> — Only primaries</li><li><code>none</code> — Maintenance mode</li></ul><h3>Allocation Awareness</h3><pre><code>PUT /_cluster/settings\n{\n  "persistent": {\n    "cluster.routing.allocation.awareness.attributes": "rack_id"\n  }\n}</code></pre><h3>Manual Reroute</h3><pre><code>POST /_cluster/reroute\n{\n  "commands": [\n    {\n      "move": {\n        "index": "products",\n        "shard": 0,\n        "from_node": "node-1",\n        "to_node": "node-2"\n      }\n    }\n  ]\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Allocation assigns shards to nodes</li><li>Awareness distributes across failure zones</li><li>Reroute fixes specific imbalances</li></ul></div></div>',
        defaultCode: 'GET /_cat/shards?v=true',
      },
    ],
    quiz: [
      { id: 'q31', question: 'Which role stores and queries data?', options: ['Master', 'Data', 'Ingest', 'Coordinating'], correct: 1 },
      { id: 'q32', question: 'Minimum master-eligible nodes for production?', options: ['1', '2', '3', '5'], correct: 2 },
      { id: 'q33', question: 'What causes split-brain?', options: ['Too many indices', 'Two masters elected', 'Node runs out of disk', 'Network latency'], correct: 1 },
      { id: 'q34', question: 'Quorum formula for master election?', options: ['N/2', '(N/2) + 1', 'N - 1', 'N + 1'], correct: 1 },
      { id: 'q35', question: 'Which API moves a shard between nodes?', options: ['POST /_cluster/reroute', 'POST /_reindex', 'PUT /_cluster/move', 'GET /_shard/move'], correct: 0 },
    ],
    practice: {
      title: 'Practice: Cluster Management',
      description: 'Simulate checking cluster health, nodes, and shard distribution.',
      steps: ['Check cluster health with _cluster/health', 'List nodes with _cat/nodes', 'View shards with _cat/shards', 'Check disk with _cat/allocation'],
      hintCode: 'GET /_cluster/health?pretty=true',
    },
  },
  {
    id: 'mod-8',
    title: 'Index Lifecycle Management (ILM)',
    lessons: [
      {
        id: 'm8-l1',
        title: 'ILM Phases (Hot, Warm, Cold, Frozen, Delete)',
        objectives: ['Understand the 5 ILM phases', 'Configure phase transitions', 'Use rollover for time-based indices'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Understand the 5 ILM phases','Configure phase transitions','Use rollover for time-based indices'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>ILM Phases</h2><table><tr><th>Phase</th><th>Storage</th><th>Access</th></tr><tr><td><strong>Hot</strong></td><td>SSD</td><td>Fast read/write</td></tr><tr><td><strong>Warm</strong></td><td>HDD</td><td>Read-only</td></tr><tr><td><strong>Cold</strong></td><td>Cheap HDD</td><td>Sparse</td></tr><tr><td><strong>Frozen</strong></td><td>S3/GCS</td><td>Partial</td></tr><tr><td><strong>Delete</strong></td><td>—</td><td>—</td></tr></table><pre><code>PUT /_ilm/policy/logs_policy\n{\n  "policy": {\n    "phases": {\n      "hot": {\n        "actions": {\n          "rollover": {\n            "max_size": "50GB",\n            "max_age": "30d"\n          }\n        }\n      },\n      "warm": {\n        "min_age": "30d",\n        "actions": {\n          "allocate": { "require": { "data_type": "warm" } },\n          "forcemerge": { "max_num_segments": 1 }\n        }\n      },\n      "delete": {\n        "min_age": "365d",\n        "actions": { "delete": {} }\n      }\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>ILM: hot -> warm -> cold -> frozen -> delete</li><li>Phase transitions based on age or size</li><li>Rollover creates new index automatically</li></ul></div></div>',
        defaultCode: 'PUT /_ilm/policy/my_policy\n{\n  "policy": {\n    "phases": {\n      "hot": {\n        "actions": {\n          "rollover": {\n            "max_size": "50GB",\n            "max_age": "30d"\n          }\n        }\n      },\n      "delete": {\n        "min_age": "365d",\n        "actions": { "delete": {} }\n      }\n    }\n  }\n}',
      },
      {
        id: 'm8-l2',
        title: 'Rollover & Shrink Actions',
        objectives: ['Configure automatic rollover for time-series', 'Use shrink to reduce shard count', 'Combine rollover with aliases'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Configure automatic rollover for time-series','Use shrink to reduce shard count','Combine rollover with aliases'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Rollover & Shrink</h2><h3>Rollover</h3><pre><code>POST /logs-write/_rollover\n{\n  "conditions": {\n    "max_age": "7d",\n    "max_size": "50GB",\n    "max_docs": 10000000\n  }\n}</code></pre><h3>Shrink</h3><pre><code>PUT /my-index/_shrink/my-index-shrunk\n{\n  "settings": {\n    "index.number_of_replicas": 1,\n    "index.number_of_shards": 1,\n    "index.codec": "best_compression"\n  }\n}</code></pre><p>Shrink reduces shards on read-only indices. New shard count must be a factor of original.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Rollover by age, size, or doc count</li><li>Shrink reduces shards on read-only indices</li><li>Use best_compression codec for storage savings</li></ul></div></div>',
        defaultCode: 'POST /_rollover/logs-write\n{\n  "conditions": {\n    "max_age": "7d",\n    "max_size": "50GB",\n    "max_docs": 10000000\n  }\n}',
      },
      {
        id: 'm8-l3',
        title: 'ILM Policies in Practice',
        objectives: ['Apply ILM policies with index templates', 'Monitor ILM status', 'Design complete ILM workflow for logs'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Apply ILM policies with index templates','Monitor ILM status','Design complete ILM workflow'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>ILM in Practice</h2><h3>Index Templates + ILM</h3><pre><code>PUT /_index_template/logs_template\n{\n  "index_patterns": ["logs-*"],\n  "template": {\n    "settings": {\n      "number_of_shards": 3,\n      "number_of_replicas": 1,\n      "index.lifecycle.name": "logs_policy",\n      "index.lifecycle.rollover_alias": "logs-write"\n    }\n  }\n}</code></pre><h3>Monitoring</h3><pre><code>GET /logs-*/_ilm/explain\nGET /_ilm/status</code></pre><h3>Common Issues</h3><ul><li><strong>Stuck in phase</strong> — Missing node attributes matching phase</li><li><strong>Rollover not triggering</strong> — Alias must point to current index</li></ul><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Use index templates to auto-apply ILM policies</li><li>Monitor with _ilm/explain</li><li>Test on dev before production</li></ul></div></div>',
        defaultCode: 'GET /_ilm/explain?pretty=true',
      },
    ],
    quiz: [
      { id: 'q36', question: 'Which ILM phase is for actively written data?', options: ['Warm', 'Cold', 'Hot', 'Delete'], correct: 2 },
      { id: 'q37', question: 'Rollover condition based on doc count?', options: ['max_size', 'max_age', 'max_docs', 'max_shards'], correct: 2 },
      { id: 'q38', question: 'What happens to shards during shrink?', options: ['Increase', 'Stay same', 'Decrease to factor of original', 'Eliminated'], correct: 2 },
      { id: 'q39', question: 'How to apply ILM to many indices automatically?', options: ['Apply manually', 'Index template', 'elasticsearch.yml', 'Cron job'], correct: 1 },
      { id: 'q40', question: 'Which API checks stuck ILM indices?', options: ['GET /_ilm/status', 'GET /_ilm/explain', 'GET /_cluster/health', 'GET /_cat/ilm'], correct: 1 },
    ],
    practice: {
      title: 'Practice: ILM Policy Design',
      description: 'Design ILM for app logs: hot 7 days, warm 30, delete after 90.',
      steps: ['Create ILM with hot/warm/delete phases', 'Rollover at 50GB or 7 days', 'Warm: force-merge, reduce replicas', 'Delete after 90 days'],
      hintCode: 'PUT /_ilm/policy/app-logs-policy\n{\n  "policy": {\n    "phases": {\n      "hot": {\n        "actions": {\n          "rollover": { "max_size": "50GB", "max_age": "7d" }\n        }\n      },\n      "warm": {\n        "min_age": "30d",\n        "actions": {\n          "forcemerge": { "max_num_segments": 1 },\n          "allocate": { "number_of_replicas": 0 }\n        }\n      },\n      "delete": {\n        "min_age": "90d",\n        "actions": { "delete": {} }\n      }\n    }\n  }\n}',
    },
  },
  {
    id: 'mod-9',
    title: 'Monitoring & Performance Tuning',
    lessons: [
      {
        id: 'm9-l1',
        title: 'Cluster Health & Stats APIs',
        objectives: ['Use cluster health API for monitoring', 'Interpret node stats for bottlenecks', 'Set up monitoring dashboards'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Use cluster health API for monitoring','Interpret node stats for bottlenecks','Set up monitoring dashboards'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Cluster Health & Stats</h2><pre><code>GET /_cluster/health?pretty=true</code></pre><ul><li><strong>green</strong> — All shards allocated</li><li><strong>yellow</strong> — Replicas unallocated</li><li><strong>red</strong> — Primaries unallocated</li></ul><h3>Node Stats</h3><pre><code>GET /_nodes/stats?pretty=true</code></pre><p>Key: JVM heap (warning at 75%, critical at 90%), CPU, disk usage.</p><h3>Cat APIs</h3><pre><code>GET /_cat/indices?v=true\nGET /_cat/nodes?v=true</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Health provides quick status check</li><li>Monitor JVM heap, CPU, disk</li><li>Green = healthy, Yellow = replicas missing, Red = data unavailable</li></ul></div></div>',
        defaultCode: 'GET /_cluster/health?pretty=true',
      },
      {
        id: 'm9-l2',
        title: 'Slow Logs & Profiling',
        objectives: ['Configure search and indexing slow logs', 'Use Profile API for slow queries', 'Analyze performance bottlenecks'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Configure search and indexing slow logs','Use Profile API for slow queries','Analyze performance bottlenecks'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Slow Logs & Profiling</h2><h3>Slow Log Config</h3><pre><code>PUT /my-index/_settings\n{\n  "index.search.slowlog.threshold.query.warn": "10s",\n  "index.search.slowlog.threshold.query.info": "5s",\n  "index.indexing.slowlog.threshold.index.warn": "10s"\n}</code></pre><h3>Profile API</h3><pre><code>GET /products/_search\n{\n  "profile": true,\n  "query": {\n    "match": { "name": "laptop" }\n  }\n}</code></pre><p>Phases: query preparation, collector, scoring, fetch.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Slow logs catch long queries</li><li>Profile shows per-phase timing</li><li>Optimize the slowest phase</li></ul></div></div>',
        defaultCode: 'GET /products/_search\n{\n  "profile": true,\n  "query": {\n    "match": { "name": "laptop" }\n  }\n}',
      },
      {
        id: 'm9-l3',
        title: 'Indexing & Query Optimization',
        objectives: ['Optimize indexing with bulk and refresh', 'Improve queries with filters and source filtering', 'Use force-merge for read-heavy indices'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Optimize indexing with bulk and refresh','Improve queries with filters and source filtering','Use force-merge for read-heavy indices'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Performance Optimization</h2><h3>Indexing Tips</h3><ul><li><strong>Bulk</strong> — 500-5000 docs per request</li><li><strong>Refresh interval</strong> — Set -1 during bulk loads, restore after</li><li><strong>Translog</strong> — async for faster writes</li></ul><pre><code>PUT /my-index/_settings\n{\n  "index": { "refresh_interval": "-1", "number_of_replicas": 0 }\n}</code></pre><h3>Query Tips</h3><ul><li><strong>Filters</strong> are cached</li><li><strong>Source filtering</strong> — only fetch needed fields</li><li><strong>Keyword for sorting</strong></li></ul><h3>Force Merge</h3><pre><code>POST /my-index/_forcemerge?max_num_segments=1</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Disable refresh and replicas during bulk imports</li><li>Use filter context for cacheable queries</li><li>Force merge read-only indices</li></ul></div></div>',
        defaultCode: 'GET /_nodes/stats?pretty=true',
      },
    ],
    quiz: [
      { id: 'q41', question: 'What does yellow cluster health mean?', options: ['Shutting down', 'Primaries OK, some replicas missing', 'Primaries missing', 'No nodes'], correct: 1 },
      { id: 'q42', question: 'Which API shows per-phase query timing?', options: ['_explain', '_profile', '_validate', '_benchmark'], correct: 1 },
      { id: 'q43', question: 'Refresh interval during bulk import?', options: ['1s', '30s', '-1', '0'], correct: 2 },
      { id: 'q44', question: 'Why use filter context instead of must?', options: ['More accurate', 'Cached, no scoring', 'Must deprecated', 'No difference'], correct: 1 },
      { id: 'q45', question: 'What does max_num_segments=1 do?', options: ['Deletes index', 'Reduces to 1 segment', 'Increases speed', 'Creates replica'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Performance Audit',
      description: 'Check cluster health, node stats, test profiling.',
      steps: ['Check cluster health', 'View node stats', 'Run query with profile:true', 'Analyze slowest phase'],
      hintCode: 'GET /_cluster/health?pretty=true',
    },
  },
  {
    id: 'mod-10',
    title: 'Elasticsearch Security',
    lessons: [
      {
        id: 'm10-l1',
        title: 'Authentication & Authorization',
        objectives: ['Configure built-in users and native realm', 'Understand realms (native, LDAP, SAML)', 'Implement API key authentication'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Configure built-in users and native realm','Understand realms (native, LDAP, SAML)','Implement API key authentication'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Authentication & Authorization</h2><h3>Authentication Realms</h3><ul><li><strong>Native</strong> — Built-in user DB</li><li><strong>LDAP/AD</strong> — Corporate credentials</li><li><strong>SAML/OIDC</strong> — SSO</li><li><strong>Kerberos</strong> — Enterprise auth</li></ul><pre><code>POST /_security/user/johndoe\n{\n  "password": "securePassword123!",\n  "roles": ["analyst"],\n  "full_name": "John Doe"\n}</code></pre><h3>API Keys</h3><pre><code>POST /_security/api_key\n{\n  "name": "my-api-key",\n  "role_descriptors": {\n    "my_role": {\n      "indices": [{\n        "names": ["logs-*"],\n        "privileges": ["read"]\n      }]\n    }\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Authentication verifies identity</li><li>Authorization uses roles for access control</li><li>API keys provide scoped app access</li></ul></div></div>',
        defaultCode: 'POST /_security/user/analyst_user\n{\n  "password": "AnalystPass123!",\n  "roles": ["analyst"],\n  "full_name": "Analyst User"\n}',
      },
      {
        id: 'm10-l2',
        title: 'Role-Based Access Control (RBAC)',
        objectives: ['Create roles with index and cluster privileges', 'Apply principle of least privilege', 'Use field- and document-level security'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Create roles with index and cluster privileges','Apply principle of least privilege','Use field- and document-level security'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>RBAC</h2><pre><code>POST /_security/role/logs_analyst\n{\n  "indices": [\n    {\n      "names": ["logs-*"],\n      "privileges": ["read", "view_index_metadata"]\n    }\n  ]\n}</code></pre><h3>Index Privileges</h3><ul><li><strong>read</strong> — Search, retrieve</li><li><strong>write</strong> — Index, update, delete docs</li><li><strong>create_index</strong> — Create indices</li><li><strong>delete_index</strong> — Delete indices</li><li><strong>manage</strong> — All index ops</li></ul><h3>Field & Document Security</h3><pre><code>POST /_security/role/employee_view\n{\n  "indices": [\n    {\n      "names": ["employees"],\n      "privileges": ["read"],\n      "field_security": {\n        "grant": ["name", "department"],\n        "except": ["salary"]\n      },\n      "query": { "term": { "department": "Engineering" } }\n    }\n  ]\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>Roles combine cluster and index privileges</li><li>Least privilege: grant only necessary permissions</li><li>Field security hides sensitive fields</li></ul></div></div>',
        defaultCode: 'POST /_security/role/read_only\n{\n  "indices": [\n    {\n      "names": ["products"],\n      "privileges": ["read"]\n    }\n  ]\n}',
      },
      {
        id: 'm10-l3',
        title: 'TLS/SSL & Audit Logging',
        objectives: ['Configure TLS for node communication', 'Enable audit logging for compliance', 'Understand certificate management'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Configure TLS for node communication','Enable audit logging for compliance','Understand certificate management'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>TLS/SSL & Audit Logging</h2><h3>TLS Encryption</h3><ul><li><strong>HTTP layer</strong> — Client-to-node HTTPS</li><li><strong>Transport layer</strong> — Node-to-node TLS</li></ul><p>Use <code>elasticsearch-certutil</code> to generate certificates.</p><pre><code>bin/elasticsearch-certutil ca\nbin/elasticsearch-certutil cert --ca elastic-stack-ca.p12</code></pre><h3>Audit Logging</h3><pre><code>PUT /_cluster/settings\n{\n  "persistent": {\n    "xpack.security.audit.enabled": true,\n    "xpack.security.audit.logfile.events.include": [\n      "access_denied",\n      "authentication_failed"\n    ]\n  }\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>TLS encrypts all communication</li><li>Use elasticsearch-certutil for certs</li><li>Audit logs track security events for compliance</li></ul></div></div>',
        defaultCode: 'GET /_security/user\n{\n  "query": {\n    "match_all": {}\n  }\n}',
      },
    ],
    quiz: [
      { id: 'q46', question: 'Which realm stores users within ES itself?', options: ['LDAP', 'Native', 'SAML', 'AD'], correct: 1 },
      { id: 'q47', question: 'Principle of least privilege means?', options: ['All admin access', 'Grant only necessary permissions', 'Deny all access', 'Same password'], correct: 1 },
      { id: 'q48', question: 'What does field-level security do?', options: ['Encrypts fields', 'Hides fields from results', 'Restricts field creation', 'Compresses data'], correct: 1 },
      { id: 'q49', question: 'Which feature records auth failures?', options: ['TLS', 'Field security', 'Audit logging', 'DLS'], correct: 2 },
      { id: 'q50', question: 'Tool for generating ES TLS certs?', options: ['openssl', 'elasticsearch-certutil', 'keytool', 'elasticsearch-keystore'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Security Configuration',
      description: 'Create users, roles, and API keys for a multi-team deployment.',
      steps: ['Create user for developer role', 'Create role with read access', 'Generate API key', 'Verify user has correct role'],
      hintCode: 'POST /_security/role/developer\n{\n  "indices": [\n    {\n      "names": ["products"],\n      "privileges": ["read", "write"]\n    }\n  ]\n}',
    },
  },
  {
    id: 'mod-11',
    title: 'Cross-Cluster Search & CCR',
    lessons: [
      {
        id: 'm11-l1',
        title: 'Cross-Cluster Search (CCS)',
        objectives: ['Configure remote clusters', 'Query across multiple clusters', 'Understand CCS performance'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Configure remote clusters','Query across multiple clusters','Understand CCS performance'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Cross-Cluster Search (CCS)</h2><h3>Configure Remote Clusters</h3><pre><code>PUT /_cluster/settings\n{\n  "persistent": {\n    "cluster.remote": {\n      "cluster_a": {\n        "seeds": ["node1.cluster-a.com:9300"]\n      }\n    }\n  }\n}</code></pre><h3>Search Across Clusters</h3><pre><code>GET /cluster_a:logs-2024-01/_search\n{\n  "query": {\n    "match": { "level": "ERROR" }\n  }\n}</code></pre><p>Prefix with <code>cluster_name:</code> to target remote clusters.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>CCS searches multiple clusters from one endpoint</li><li>Configure with seed nodes</li><li>Prefix index names with cluster name</li></ul></div></div>',
        defaultCode: 'GET /_remote/info',
      },
      {
        id: 'm11-l2',
        title: 'Cross-Cluster Replication (CCR)',
        objectives: ['Configure follower indices', 'Understand active-passive replication', 'Monitor CCR status'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Configure follower indices','Understand active-passive replication','Monitor CCR status'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>Cross-Cluster Replication (CCR)</h2><p>CCR replicates from leader to follower in near real-time.</p><h3>Setup</h3><pre><code>PUT /logs-2024-01/_ccr/follow\n{\n  "remote_cluster": "cluster_a",\n  "leader_index": "logs-2024-01"\n}</code></pre><h3>Monitoring</h3><pre><code>GET /logs-2024-01/_ccr/info\nGET /_ccr/stats</code></pre><h3>Auto-Follow</h3><pre><code>PUT /_ccr/auto_follow/logs_pattern\n{\n  "remote_cluster": "cluster_a",\n  "leader_index_patterns": ["logs-*"]\n}</code></pre><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>CCR uses active-passive pull replication</li><li>Followers are read-only copies</li><li>Auto-follow automates time-series replication</li></ul></div></div>',
        defaultCode: 'GET /_ccr/stats',
      },
      {
        id: 'm11-l3',
        title: 'CCR Use Cases & Disaster Recovery',
        objectives: ['Design multi-region DR with CCR', 'Implement geo-proximity search', 'Build reporting clusters safely'],
        content: '<div class="lesson-prose"><div class="lesson-objectives"><h3>Learning Objectives</h3><ul>'+['Design multi-region DR with CCR','Implement geo-proximity search','Build reporting clusters safely'].map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div><h2>CCR Use Cases</h2><h3>Disaster Recovery</h3><ol><li>Primary in us-east-1, standby in us-west-2</li><li>CCR replicates near real-time</li><li>On failure: pause CCR, re-point apps</li></ol><h3>Geo-Proximity</h3><p>Global e-commerce with clusters in NA, EU, APAC. Users query nearest cluster. Product catalog replicated via CCR.</p><h3>Reporting Cluster</h3><pre><code>PUT /_ccr/auto_follow/reporting\n{\n  "remote_cluster": "production",\n  "leader_index_patterns": ["orders-*", "products-*"]\n}</code></pre><p>Reporting queries on the reporting cluster — zero production impact.</p><div class="lesson-takeaways"><h3>Summary Takeaways</h3><ul><li>CCR enables multi-region DR</li><li>Geo-proximate followers reduce latency</li><li>Dedicated reporting clusters isolate load</li></ul></div></div>',
        defaultCode: 'GET /_remote/info',
      },
    ],
    quiz: [
      { id: 'q51', question: 'What prefix searches a remote cluster index?', options: ['remote:', 'cluster_name:', 'ext:', 'remote_index:'], correct: 1 },
      { id: 'q52', question: 'Is CCR pull-based or push-based?', options: ['Push (leader sends)', 'Pull (follower polls)', 'Both', 'Varies'], correct: 1 },
      { id: 'q53', question: 'CCR uses which replication model?', options: ['Active-Active', 'Active-Passive', 'Peer-to-Peer', 'Multi-Master'], correct: 1 },
      { id: 'q54', question: 'Which API auto-follows new indices?', options: ['_ccr/follow', '_ccr/stats', '_ccr/auto_follow', '_ccr/info'], correct: 2 },
      { id: 'q55', question: 'Key limitation of follower indices?', options: ['Cannot search', 'Read-only', 'Slower', 'No mappings'], correct: 1 },
    ],
    practice: {
      title: 'Practice: Cross-Cluster Architecture',
      description: 'Design two-region DR with CCS for unified search and CCR for replication.',
      steps: ['Configure remote cluster for CCS', 'Search across clusters', 'Set up follower index for CCR', 'Monitor with _ccr/stats'],
      hintCode: 'GET /_ccr/stats',
    },
  },
];

var elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  esEditor: document.getElementById('es-editor'),
  runQueryBtn: document.getElementById('run-query-btn'),
  jsonResults: document.getElementById('json-results'),
  esStatus: document.getElementById('es-status'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
};

function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
}

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
      checkAnswer(btn.dataset.quizId, parseInt(btn.dataset.module), parseInt(btn.dataset.option));
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

function switchTab(tabId) {
  elements.tabBtns.forEach(function (btn) {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'border-teal-600', 'text-teal-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-teal-600', 'text-teal-600');
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

function renderSidebar() {
  var html = '';
  curriculum.forEach(function (mod, mIndex) {
    html += '<div class="sidebar-module"><h3 class="sidebar-module-title">' + mod.title + '</h3><ul class="space-y-1">';

    mod.lessons.forEach(function (lesson, lIndex) {
      var isCompleted = userProgress.completedLessons.indexOf(lesson.id) !== -1;
      var isActive = mIndex === activeModule && lIndex === activeLesson;
      var iconClass = isCompleted ? 'fas fa-check-circle text-teal-500' : 'far fa-circle text-gray-400';

      html += '<li><button class="w-full text-left sidebar-lesson' + (isActive ? ' active' : '') + '" data-module="' + mIndex + '" data-lesson="' + lIndex + '"><i class="' + iconClass + ' mr-2 w-4"></i>' + lesson.title + '</button></li>';
    });

    html += '</ul></div>';
  });

  elements.sidebarContent.innerHTML = html;
}

function getEli5ForLesson(lessonId) {
  if (window.eli5ElasticsearchData && window.eli5ElasticsearchData[lessonId]) {
    return window.eli5ElasticsearchData[lessonId];
  }
  return '';
}

function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;
  var lesson = curriculum[mIndex].lessons[lIndex];

  if (userProgress.completedLessons.indexOf(lesson.id) === -1) {
    markLessonComplete(lesson.id);
  }

  var eli5Html = getEli5ForLesson(lesson.id);
  var wrapped = window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, eli5Html) : lesson.content;
  elements.lessonContent.innerHTML = wrapped;

  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('elasticsearch', elements.lessonContent);
  }

  elements.esEditor.value = lesson.defaultCode || '';
  if (window.copyCode) {
    window.copyCode.init(elements.lessonContent);
  }
  elements.jsonResults.innerHTML = '<span class="text-gray-500 italic">Click Play to run the request...</span>';
  elements.esStatus.textContent = '';

  renderQuiz(mIndex);
  renderSidebar();

  if (window.innerWidth < 768 && !elements.sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
}

function renderPracticeHtml(practice) {
  if (!practice) return '';
  return '<div class="mt-10 p-6 bg-indigo-50 rounded-lg border border-indigo-100"><h3 class="text-xl font-bold text-indigo-900 mb-3"><i class="fas fa-code-branch mr-2"></i>' + practice.title + '</h3><p class="text-gray-700 mb-4">' + practice.description + '</p><h4 class="font-semibold text-gray-800 mb-2">Steps:</h4><ol class="list-decimal list-inside space-y-1 mb-4 text-gray-700">' + practice.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' + (practice.hintCode ? '<details class="mt-3"><summary class="cursor-pointer text-teal-600 font-medium text-sm hover:text-teal-700"><i class="fas fa-lightbulb mr-1"></i> Need a hint?</summary><pre class="mt-2 bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto"><code>' + practice.hintCode + '</code></pre></details>' : '') + '</div>';
}

function renderQuiz(mIndex) {
  var quiz = curriculum[mIndex].quiz;
  var html = '<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>';

  if (!quiz || quiz.length === 0) {
    elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
    return;
  }

  quiz.forEach(function (q, i) {
    html += '<div class="mb-8 p-6 bg-teal-50 rounded-lg border border-teal-100 quiz-question" id="q-container-' + q.id + '"><p class="font-semibold text-lg text-gray-800 mb-4">' + (i + 1) + '. ' + q.question + '</p><div class="space-y-2">';

    q.options.forEach(function (opt, oIndex) {
      html += '<label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors"><input type="radio" name="quiz-' + q.id + '" value="' + oIndex + '" class="mr-3 w-4 h-4 text-teal-600"><span class="text-gray-700">' + opt + '</span></label>';
    });

    html += '</div><button data-quiz-id="' + q.id + '" data-module="' + mIndex + '" data-option="' + i + '" class="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Submit Answer</button><div id="q-feedback-' + q.id + '" class="mt-3 hidden text-sm font-medium"></div></div>';
  });

  html += renderPracticeHtml(curriculum[mIndex].practice);
  elements.quizContent.innerHTML = html;
}

window.checkAnswer = function (qId, mIndex, qIndex) {
  var selected = document.querySelector('input[name="quiz-' + qId + '"]:checked');
  var feedback = document.getElementById('q-feedback-' + qId);
  var container = document.getElementById('q-container-' + qId);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  var correctAns = curriculum[mIndex].quiz[qIndex].correct;

  if (parseInt(selected.value) === correctAns) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-3 text-sm font-medium text-teal-600 block';
    container.classList.replace('bg-teal-50', 'bg-green-50');
    container.classList.replace('border-teal-100', 'border-green-200');

    if (userProgress.completedQuizzes.indexOf(qId) === -1) {
      userProgress.completedQuizzes.push(qId);
      saveProgress();
    }
  } else {
    feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
    feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
  }
};

function markLessonComplete(lessonId) {
  if (userProgress.completedLessons.indexOf(lessonId) === -1) {
    userProgress.completedLessons.push(lessonId);
    saveProgress();
  }
}

function saveProgress() {
  localStorage.setItem('elasticHubProgress', JSON.stringify(userProgress));
  updateProgress();
}

function updateProgress() {
  var totalItems = 0;
  curriculum.forEach(function (m) {
    totalItems += m.lessons.length;
    if (m.quiz) totalItems += m.quiz.length;
  });

  var completedItems = userProgress.completedLessons.length + userProgress.completedQuizzes.length;
  var percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  elements.progressBar.style.width = percentage + '%';
  elements.progressText.textContent = percentage + '%';
}

function runSimulation() {
  var rawInput = elements.esEditor.value.trim();
  if (!rawInput) return;

  elements.esStatus.textContent = 'Executing...';
  elements.esStatus.className = 'text-xs font-mono text-teal-400';

  setTimeout(function () {
    try {
      var lines = rawInput.split('\n');
      var endpointLine = lines[0].trim();
      var jsonStr = lines.slice(1).join('\n').trim();

      var index = 'products';

      if (endpointLine) {
        var parts = endpointLine.split(' ');
        if (parts.length >= 2) {
          var pathParts = parts[1].split('/').filter(function (p) { return p !== ''; });
          if (pathParts.length > 0 && pathParts[0] !== '_search' && pathParts[0] !== '_analyze' && pathParts[0] !== '_cluster' && pathParts[0] !== '_cat' && pathParts[0] !== '_nodes' && pathParts[0] !== '_ilm' && pathParts[0] !== '_security' && pathParts[0] !== '_ccr' && pathParts[0] !== '_remote' && pathParts[0] !== '_rollover') {
            index = pathParts[0];
          }
        }
      }

      var payload = null;
      if (jsonStr && jsonStr.startsWith('{')) {
        payload = JSON.parse(jsonStr);
      }

      var results = [];
      var indexData = mockDb[index] || [];

      if (!payload) {
        results = indexData;
      } else if (payload.query) {
        if (payload.query.match_all) {
          results = indexData;
        } else if (payload.query.match) {
          var field = Object.keys(payload.query.match)[0];
          var mq = payload.query.match[field];
          var value = (typeof mq === 'object' ? mq.query : mq).toString().toLowerCase();
          results = indexData.filter(function (item) {
            if (item[field]) {
              return item[field].toString().toLowerCase().indexOf(value) !== -1;
            }
            return false;
          });
        } else if (payload.query.match_phrase) {
          var mpf = Object.keys(payload.query.match_phrase)[0];
          var mpv = payload.query.match_phrase[mpf].toString().toLowerCase();
          results = indexData.filter(function (item) {
            if (item[mpf]) {
              return item[mpf].toString().toLowerCase().indexOf(mpv) !== -1;
            }
            return false;
          });
        } else if (payload.query.multi_match) {
          var mmq = payload.query.multi_match.query.toString().toLowerCase();
          var mmFields = payload.query.multi_match.fields || [];
          results = indexData.filter(function (item) {
            return mmFields.some(function (f) {
              var cleanField = f.replace(/\^\d+$/, '');
              if (item[cleanField]) {
                return item[cleanField].toString().toLowerCase().indexOf(mmq) !== -1;
              }
              return false;
            });
          });
        } else if (payload.query.term) {
          var tf = Object.keys(payload.query.term)[0];
          var tv = payload.query.term[tf];
          results = indexData.filter(function (item) { return item[tf] === tv; });
        } else if (payload.query.terms) {
          var tsf = Object.keys(payload.query.terms)[0];
          var tsv = payload.query.terms[tsf];
          if (Array.isArray(tsv)) {
            results = indexData.filter(function (item) { return tsv.indexOf(item[tsf]) !== -1; });
          }
        } else if (payload.query.range) {
          var rf = Object.keys(payload.query.range)[0];
          var rq = payload.query.range[rf];
          results = indexData.filter(function (item) {
            var val = parseFloat(item[rf]);
            if (isNaN(val)) return false;
            if (rq.gte !== undefined && val < parseFloat(rq.gte)) return false;
            if (rq.gt !== undefined && val <= parseFloat(rq.gt)) return false;
            if (rq.lte !== undefined && val > parseFloat(rq.lte)) return false;
            if (rq.lt !== undefined && val >= parseFloat(rq.lt)) return false;
            return true;
          });
        } else if (payload.query.bool) {
          var bq = payload.query.bool;
          results = indexData.slice();
          if (bq.filter) {
            bq.filter.forEach(function (f) {
              results = applyFilter(results, f);
            });
          }
          if (bq.must) {
            bq.must.forEach(function (f) {
              results = applyFilter(results, f);
            });
          }
          if (bq.must_not) {
            bq.must_not.forEach(function (f) {
              var matched = applyFilter(indexData.slice(), f);
              results = results.filter(function (item) {
                return matched.indexOf(item) === -1;
              });
            });
          }
          if (bq.should && bq.should.length > 0 && (!bq.minimum_should_match || bq.minimum_should_match > 0)) {
            var shouldResults = [];
            bq.should.forEach(function (f) {
              shouldResults = shouldResults.concat(applyFilter(indexData.slice(), f));
            });
            if (results.length === 0) {
              results = shouldResults;
            }
          }
        } else if (payload.query.boosting) {
          var pos = applyFilter(indexData.slice(), payload.query.boosting.positive);
          var neg = applyFilter(indexData.slice(), payload.query.boosting.negative);
          var negBoost = payload.query.boosting.negative_boost || 0.5;
          results = pos.map(function (item) {
            if (neg.indexOf(item) !== -1) {
              item._score_boost = negBoost;
            } else {
              item._score_boost = 1.0;
            }
            return item;
          });
        } else if (payload.query.dis_max) {
          var dmQueries = payload.query.dis_max.queries || [];
          var seen = {};
          results = [];
          dmQueries.forEach(function (q) {
            applyFilter(indexData.slice(), q).forEach(function (item) {
              if (!seen[item.id]) {
                seen[item.id] = true;
                results.push(item);
              }
            });
          });
        } else if (payload.query.prefix) {
          var pf = Object.keys(payload.query.prefix)[0];
          var pv = payload.query.prefix[pf].toLowerCase();
          results = indexData.filter(function (item) {
            if (item[pf]) {
              return item[pf].toString().toLowerCase().indexOf(pv) === 0;
            }
            return false;
          });
        } else if (payload.query.wildcard) {
          var wf = Object.keys(payload.query.wildcard)[0];
          var wv = payload.query.wildcard[wf].toLowerCase();
          var wRe = new RegExp('^' + wv.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
          results = indexData.filter(function (item) {
            if (item[wf]) {
              return wRe.test(item[wf].toString().toLowerCase());
            }
            return false;
          });
        } else if (payload.query.nested) {
          results = indexData;
        } else if (payload.query.has_child || payload.query.has_parent) {
          results = indexData;
        } else {
          results = indexData;
        }
      }

      var esResponse = {
        took: Math.floor(Math.random() * 5) + 1,
        timed_out: false,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        hits: {
          total: { value: results.length, relation: 'eq' },
          max_score: results.length > 0 ? 1.0 : null,
          hits: results.map(function (item) {
            var source = {};
            for (var k in item) {
              if (k !== '_score_boost') source[k] = item[k];
            }
            var h = { _index: index, _id: item.id, _score: item._score_boost || 1.0, _source: source };
            return h;
          }),
        },
      };

      if (payload && payload.size === 0) {
        esResponse.hits.hits = [];
      }

      if (payload && payload.aggs) {
        var aggs = {};
        for (var aggName in payload.aggs) {
          var aggDef = payload.aggs[aggName];
          if (aggDef.terms && aggDef.terms.field) {
            var tf2 = aggDef.terms.field.replace('.keyword', '');
            var buckets = {};
            indexData.forEach(function (item) {
              var key = item[tf2];
              if (key !== undefined) {
                if (!buckets[key]) buckets[key] = { key: key, doc_count: 0 };
                buckets[key].doc_count++;
              }
            });
            var bucketsArr = Object.keys(buckets).map(function (k) { return buckets[k]; });
            if (aggDef.aggs) {
              bucketsArr.forEach(function (b) {
                var bucketItems = indexData.filter(function (item) { return item[tf2] === b.key; });
                for (var subAggName in aggDef.aggs) {
                  var subAgg = aggDef.aggs[subAggName];
                  if (subAgg.avg) {
                    var sum2 = 0;
                    bucketItems.forEach(function (item) { sum2 += parseFloat(item[subAgg.avg.field]) || 0; });
                    b[subAggName] = { value: bucketItems.length > 0 ? sum2 / bucketItems.length : 0 };
                  } else if (subAgg.sum) {
                    var sum3 = 0;
                    bucketItems.forEach(function (item) { sum3 += parseFloat(item[subAgg.sum.field]) || 0; });
                    b[subAggName] = { value: sum3 };
                  } else if (subAgg.min) {
                    var minV = Infinity;
                    bucketItems.forEach(function (item) { var v = parseFloat(item[subAgg.min.field]); if (v < minV) minV = v; });
                    b[subAggName] = { value: bucketItems.length > 0 ? minV : 0 };
                  } else if (subAgg.max) {
                    var maxV = -Infinity;
                    bucketItems.forEach(function (item) { var v = parseFloat(item[subAgg.max.field]); if (v > maxV) maxV = v; });
                    b[subAggName] = { value: bucketItems.length > 0 ? maxV : 0 };
                  } else if (subAgg.value_count) {
                    b[subAggName] = { value: bucketItems.length };
                  }
                }
              });
            }
            aggs[aggName] = { buckets: bucketsArr };
          } else if (aggDef.avg) {
            var sum4 = 0;
            var count4 = 0;
            indexData.forEach(function (item) { var v = parseFloat(item[aggDef.avg.field]); if (!isNaN(v)) { sum4 += v; count4++; } });
            aggs[aggName] = { value: count4 > 0 ? sum4 / count4 : 0 };
          } else if (aggDef.sum) {
            var sum5 = 0;
            indexData.forEach(function (item) { var v = parseFloat(item[aggDef.sum.field]); if (!isNaN(v)) sum5 += v; });
            aggs[aggName] = { value: sum5 };
          } else if (aggDef.min) {
            var minV2 = Infinity;
            indexData.forEach(function (item) { var v = parseFloat(item[aggDef.min.field]); if (!isNaN(v) && v < minV2) minV2 = v; });
            aggs[aggName] = { value: indexData.length > 0 ? minV2 : 0 };
          } else if (aggDef.max) {
            var maxV2 = -Infinity;
            indexData.forEach(function (item) { var v = parseFloat(item[aggDef.max.field]); if (!isNaN(v) && v > maxV2) maxV2 = v; });
            aggs[aggName] = { value: indexData.length > 0 ? maxV2 : 0 };
          } else if (aggDef.stats) {
            var sSum = 0, sMin = Infinity, sMax = -Infinity, sCount = 0;
            indexData.forEach(function (item) { var v = parseFloat(item[aggDef.stats.field]); if (!isNaN(v)) { sSum += v; if (v < sMin) sMin = v; if (v > sMax) sMax = v; sCount++; } });
            aggs[aggName] = { count: sCount, min: sCount > 0 ? sMin : 0, max: sCount > 0 ? sMax : 0, avg: sCount > 0 ? sSum / sCount : 0, sum: sSum };
          } else if (aggDef.range) {
            var rangeBuckets = (aggDef.range.ranges || []).map(function (r) {
              return { key: (r.from || 0) + '-' + (r.to || '*'), from: r.from, to: r.to, doc_count: 0 };
            });
            indexData.forEach(function (item) {
              var v = parseFloat(item[aggDef.range.field]);
              if (!isNaN(v)) {
                rangeBuckets.forEach(function (b) {
                  var matchFrom = b.from === undefined || v >= parseFloat(b.from);
                  var matchTo = b.to === undefined || v < parseFloat(b.to);
                  if (matchFrom && matchTo) b.doc_count++;
                });
              }
            });
            aggs[aggName] = { buckets: rangeBuckets };
          } else if (aggDef.histogram) {
            var interval = aggDef.histogram.interval || 1;
            var histMap = {};
            indexData.forEach(function (item) {
              var v = parseFloat(item[aggDef.histogram.field]);
              if (!isNaN(v)) {
                var bucket = Math.floor(v / interval) * interval;
                if (!histMap[bucket]) histMap[bucket] = { key: bucket, doc_count: 0 };
                histMap[bucket].doc_count++;
              }
            });
            aggs[aggName] = { buckets: Object.keys(histMap).sort(function (a, b) { return parseFloat(a) - parseFloat(b); }).map(function (k) { return histMap[k]; }) };
          } else if (aggDef.max_bucket) {
            aggs[aggName] = { value: 0, keys: [] };
          }
        }
        esResponse.aggregations = aggs;
      }

      elements.jsonResults.innerHTML = syntaxHighlight(JSON.stringify(esResponse, null, 2));
      elements.esStatus.textContent = '200 OK - ' + esResponse.took + 'ms';
      elements.esStatus.className = 'text-xs font-mono text-green-400';
    } catch (e) {
      elements.jsonResults.innerHTML = '<span class="text-red-400">Error parsing request:\n' + e.message + '\n\nEnsure your JSON payload is valid.</span>';
      elements.esStatus.textContent = '400 Bad Request';
      elements.esStatus.className = 'text-xs font-mono text-red-400';
    }
  }, 300);
}

function applyFilter(data, filter) {
  if (!filter) return data;
  if (filter.term) {
    var f = Object.keys(filter.term)[0];
    var v = filter.term[f];
    return data.filter(function (item) { return item[f] === v; });
  }
  if (filter.terms) {
    var f2 = Object.keys(filter.terms)[0];
    var v2 = filter.terms[f2];
    if (Array.isArray(v2)) return data.filter(function (item) { return v2.indexOf(item[f2]) !== -1; });
  }
  if (filter.match) {
    var f3 = Object.keys(filter.match)[0];
    var m = filter.match[f3];
    var q = (typeof m === 'object' ? m.query : m).toString().toLowerCase();
    return data.filter(function (item) { return item[f3] && item[f3].toString().toLowerCase().indexOf(q) !== -1; });
  }
  if (filter.range) {
    var f4 = Object.keys(filter.range)[0];
    var r = filter.range[f4];
    return data.filter(function (item) {
      var val = parseFloat(item[f4]);
      if (isNaN(val)) return false;
      if (r.gte !== undefined && val < parseFloat(r.gte)) return false;
      if (r.gt !== undefined && val <= parseFloat(r.gt)) return false;
      if (r.lte !== undefined && val > parseFloat(r.lte)) return false;
      if (r.lt !== undefined && val >= parseFloat(r.lt)) return false;
      return true;
    });
  }
  if (filter.prefix) {
    var f5 = Object.keys(filter.prefix)[0];
    var p = filter.prefix[f5].toLowerCase();
    return data.filter(function (item) { return item[f5] && item[f5].toString().toLowerCase().indexOf(p) === 0; });
  }
  if (filter.wildcard) {
    var f6 = Object.keys(filter.wildcard)[0];
    var w = filter.wildcard[f6].toLowerCase();
    var wr = new RegExp('^' + w.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return data.filter(function (item) { return item[f6] && wr.test(item[f6].toString().toLowerCase()); });
  }
  if (filter.bool) {
    var b = filter.bool;
    var result = data.slice();
    if (b.filter) b.filter.forEach(function (f) { result = applyFilter(result, f); });
    if (b.must) b.must.forEach(function (f) { result = applyFilter(result, f); });
    if (b.must_not) {
      b.must_not.forEach(function (f) {
        var matched = applyFilter(data.slice(), f);
        result = result.filter(function (item) { return matched.indexOf(item) === -1; });
      });
    }
    if (b.should && b.should.length > 0) {
      var shouldMatch = [];
      b.should.forEach(function (f) { shouldMatch = shouldMatch.concat(applyFilter(data.slice(), f)); });
      if (result.length === 0) result = shouldMatch;
    }
    return result;
  }
  return data;
}

function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"(\s*:)?|(-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
    var isKey = /:$/.test(match);
    var isNum = /^-?\d/.test(match);
    if (isKey) return '<span class="es-key">' + match.replace(/"/g, '') + '</span>';
    if (isNum) return '<span class="es-number">' + match + '</span>';
    if (/"(true|false)"/.test(match)) return '<span class="es-boolean">' + match + '</span>';
    if (/"(null)"/.test(match)) return '<span class="es-null">' + match + '</span>';
    return '<span class="es-string">' + match + '</span>';
  });
}

document.addEventListener('DOMContentLoaded', init);
