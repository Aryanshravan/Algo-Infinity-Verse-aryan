/* global checkAnswer */

// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('postgresHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// Curriculum Data — 15 comprehensive modules
const curriculum = [
  // ─── Module 1: SQL Fundamentals & CRUD ───
  {
    id: 'mod-1',
    title: 'SQL Fundamentals & CRUD',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Introduction & SELECT',
        objectives: [
          'Understand what PostgreSQL is and its role as a leading open-source RDBMS',
          'Master the SELECT statement for retrieving data from tables',
          'Learn basic filtering with WHERE and comparison operators',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Welcome to PostgreSQL!</h2>
            <p>PostgreSQL is a powerful, open-source <strong>object-relational database system</strong> with over 30 years of active development. It's trusted by companies like Apple, Spotify, and Instagram for its reliability, feature richness, and extensibility.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Key Insight:</strong> PostgreSQL is <strong>ACID-compliant</strong> and supports advanced features like MVCC, full-text search, JSONB, custom data types, and extensible indexing — things many other databases can't do.</p>
            </div>

            <h3>The SELECT Statement</h3>
            <p>The <code>SELECT</code> statement is used to retrieve data from a database. Think of it as asking a question: "Show me the data that matches these criteria."</p>
            <pre><code>-- Select all columns from a table
SELECT * FROM users;

-- Select specific columns
SELECT name, email FROM users;

-- Select with alias
SELECT name AS user_name, email AS contact FROM users;</code></pre>

            <h3>Filtering with WHERE</h3>
            <p>The <code>WHERE</code> clause filters results based on one or more conditions. Only rows that satisfy the condition are returned.</p>
            <pre><code>-- Exact match
SELECT * FROM users WHERE name = 'Alice';

-- Comparison operators
SELECT * FROM orders WHERE amount > 100;
SELECT * FROM products WHERE price BETWEEN 10 AND 50;

-- Pattern matching (ILIKE is case-insensitive)
SELECT * FROM users WHERE name ILIKE 'alice%';</code></pre>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ PostgreSQL Tip:</strong> PostgreSQL uses <code>ILIKE</code> for case-insensitive pattern matching (standard SQL only has <code>LIKE</code>). Also, PostgreSQL is <strong>case-sensitive</strong> for string comparisons — <code>'Alice' = 'alice'</code> is <code>false</code>!</p>
            </div>

            <p>Go to the <strong>SQL Simulator</strong> tab and try running the default query to see the users in our database!</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>PostgreSQL is a powerful open-source object-relational database with 30+ years of development</li>
              <li>SELECT retrieves data from one or more tables</li>
              <li>Use * for all columns or specify individual column names</li>
              <li>WHERE filters rows using comparison operators (=, >, <, BETWEEN, ILIKE)</li>
              <li>ILIKE provides case-insensitive pattern matching (PostgreSQL-specific)</li>
              <li>Column aliases (AS) make output more readable</li>
            </ul>
            <p><strong>Real-world use:</strong> A login system uses <code>SELECT * FROM users WHERE email = ?</code> to verify credentials. E-commerce sites filter products with <code>WHERE price BETWEEN ? AND ? AND category = ?</code>.</p>
          </div>
        `,
        defaultCode: 'SELECT * FROM users;',
        expectedKeyword: 'SELECT',
        expectedTable: 'users',
      },
      {
        id: 'm1-l2',
        title: 'INSERT Data & Constraints',
        objectives: [
          'Master the INSERT INTO statement for adding rows to a table',
          'Understand PostgreSQL serial/identity columns for auto-generated IDs',
          'Learn how constraints (NOT NULL, UNIQUE, CHECK) protect data integrity',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Inserting Data</h2>
            <p>The <code>INSERT INTO</code> statement adds new rows to a table. It's like filling out a form — you specify which columns to fill and what values to put in them.</p>

            <h3>Basic INSERT Syntax</h3>
            <pre><code>-- Specify columns and values (recommended)
INSERT INTO users (name, email) VALUES ('Alice Smith', 'alice@example.com');

-- Insert without column list (order depends on table definition!)
INSERT INTO users VALUES (DEFAULT, 'Bob Jones', 'bob@example.com');

-- Insert multiple rows at once
INSERT INTO users (name, email) VALUES
  ('Charlie Brown', 'charlie@example.com'),
  ('Diana Prince', 'diana@example.com');</code></pre>

            <h3>Serial & Identity Columns</h3>
            <p>PostgreSQL offers two ways to auto-generate unique IDs. <code>SERIAL</code> is the traditional approach; <code>GENERATED AS IDENTITY</code> is the modern SQL-standard way.</p>
            <pre><code>-- Traditional SERIAL
CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);

-- Modern IDENTITY (recommended)
CREATE TABLE users (id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT);</code></pre>

            <h3>Constraints for Data Protection</h3>
            <p>Constraints enforce rules on your data. Think of them as a <strong>bouncer at a club</strong> — they check every row before letting it in:</p>
            <ul>
              <li><strong>NOT NULL</strong> — "You MUST provide a name."</li>
              <li><strong>UNIQUE</strong> — "No two users can have the same email."</li>
              <li><strong>CHECK</strong> — "Age must be positive."</li>
              <li><strong>DEFAULT</strong> — "If not specified, use 'Active' as status."</li>
            </ul>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> Always specify the column list in INSERT statements. It makes your code self-documenting and protects against errors if the table structure changes later.</p>
            </div>

            <p>Try adding a new user in the SQL Simulator!</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>INSERT INTO adds one or more rows to a table</li>
              <li>Always specify the column list for clarity and safety</li>
              <li>SERIAL and GENERATED AS IDENTITY auto-generate unique IDs</li>
              <li>Insert multiple rows in one statement by comma-separating VALUE groups</li>
              <li>Constraints: NOT NULL, UNIQUE, CHECK, DEFAULT protect data integrity</li>
              <li>PostgreSQL validates constraints at the row level, rejecting invalid data</li>
            </ul>
            <p><strong>Real-world use:</strong> User registration systems INSERT new user records with UNIQUE constraint on email to prevent duplicate accounts.</p>
          </div>
        `,
        defaultCode: "INSERT INTO users (name, email)\nVALUES ('Alice Smith', 'alice@example.com');",
        expectedKeyword: 'INSERT',
        expectedTable: 'users',
      },
      {
        id: 'm1-l3',
        title: 'UPDATE, DELETE, ON CONFLICT & RETURNING',
        objectives: [
          'Master the UPDATE and DELETE statements for modifying and removing data',
          'Learn the ON CONFLICT clause for upsert operations',
          'Understand the RETURNING clause to get feedback on DML operations',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Modifying and Removing Data</h2>

            <h3>UPDATE — Changing Existing Data</h3>
            <p>The <code>UPDATE</code> statement modifies existing rows. Think of it as using white-out to correct information on a filed document.</p>
            <pre><code>-- Update a single column
UPDATE users SET email = 'alice@newdomain.com' WHERE id = 1;

-- Update multiple columns at once
UPDATE users SET name = 'Alice Johnson', email = 'alice.j@example.com' WHERE id = 1;

-- Update using expressions
UPDATE products SET price = price * 1.10 WHERE category = 'Electronics';</code></pre>

            <div class="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-red-800"><strong>⚠️ CRITICAL:</strong> ALWAYS include a WHERE clause in UPDATE/DELETE! <code>UPDATE users SET email = 'all@same.com';</code> changes EVERY row. Always test with SELECT first: <code>SELECT * FROM users WHERE condition</code>.</p>
            </div>

            <h3>DELETE — Removing Data</h3>
            <pre><code>-- Delete a specific row
DELETE FROM users WHERE id = 5;

-- Delete multiple rows
DELETE FROM orders WHERE status = 'Cancelled';

-- Delete all rows (use with extreme caution!)
DELETE FROM users;</code></pre>

            <h3>ON CONFLICT — The Upsert Pattern</h3>
            <p><code>ON CONFLICT</code> lets you handle insert conflicts gracefully. It's like saying "Try to insert this, but if a row with this ID already exists, update it instead."</p>
            <pre><code>-- Upsert: Insert or update if conflict on unique column
INSERT INTO users (id, name, email)
VALUES (1, 'Alice Smith', 'alice@example.com')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

-- Do nothing on conflict
INSERT INTO users (id, name, email)
VALUES (1, 'Alice', 'alice@example.com')
ON CONFLICT (id) DO NOTHING;</code></pre>

            <h3>RETURNING — Getting Feedback</h3>
            <p><code>RETURNING</code> gives you back the affected rows after an INSERT, UPDATE, or DELETE. Like a <strong>receipt</strong> after a transaction.</p>
            <pre><code>DELETE FROM users WHERE id = 5 RETURNING *;
INSERT INTO users (name, email) VALUES ('Eve', 'eve@example.com') RETURNING id;</code></pre>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> RETURNING is incredibly useful for APIs. After INSERT, return the generated ID to the client. After UPDATE, return the updated row. No need for a separate SELECT!</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>UPDATE modifies existing rows; ALWAYS use WHERE to target specific rows</li>
              <li>DELETE removes rows; without WHERE, it empties the entire table</li>
              <li>ON CONFLICT enables upsert — insert or update on duplicate key</li>
              <li>ON CONFLICT DO NOTHING silently skips conflicting inserts</li>
              <li>RETURNING clause returns affected rows from INSERT, UPDATE, or DELETE</li>
              <li>EXCLUDED keyword in ON CONFLICT refers to the row that was being inserted</li>
            </ul>
            <p><strong>Real-world use:</strong> Shopping carts use ON CONFLICT to merge items: "Add item to cart, or increase quantity if already there." REST APIs use RETURNING to return created/updated resources.</p>
          </div>
        `,
        defaultCode: "-- UPDATE example\nUPDATE users SET email = 'updated@example.com' WHERE id = 1 RETURNING *;\n\n-- DELETE example\nDELETE FROM users WHERE id = 3 RETURNING *;\n\n-- See remaining users\nSELECT * FROM users;",
        expectedKeyword: 'UPDATE',
        expectedTable: 'users',
      },
    ],
    quiz: [
      {
        id: 'm1-q1',
        question: 'Which SQL statement is used to extract data from a database?',
        options: ['EXTRACT', 'GET', 'OPEN', 'SELECT'],
        correct: 3,
      },
      {
        id: 'm1-q2',
        question: 'Which SQL statement is used to insert new data in a database?',
        options: ['ADD NEW', 'INSERT INTO', 'INSERT NEW', 'ADD RECORD'],
        correct: 1,
      },
      {
        id: 'm1-q3',
        question: 'What does the RETURNING clause do?',
        options: [
          'Restarts the query from the beginning',
          'Returns the affected rows after INSERT, UPDATE, or DELETE',
          'Reverses the last operation',
          'Returns only the first row',
        ],
        correct: 1,
      },
      {
        id: 'm1-q4',
        question: 'What happens when you use ON CONFLICT (id) DO NOTHING?',
        options: [
          'The database throws an error',
          'The conflicting row is deleted first',
          'The insert is silently skipped if the id already exists',
          'The entire table is locked',
        ],
        correct: 2,
      },
      {
        id: 'm1-q5',
        question: 'What is the modern SQL-standard way to create auto-incrementing IDs in PostgreSQL?',
        options: ['AUTO_INCREMENT', 'SERIAL', 'GENERATED ALWAYS AS IDENTITY', 'IDENTITY(1,1)'],
        correct: 2,
      },
    ],
  },

  // ─── Module 2: Relationships & JOINs ───
  {
    id: 'mod-2',
    title: 'Relationships & JOINs',
    lessons: [
      {
        id: 'm2-l1',
        title: 'INNER JOIN & Table Relationships',
        objectives: [
          'Understand how JOINs connect related tables using foreign keys',
          'Master INNER JOIN for matching rows across tables',
          'Use table aliases for cleaner query syntax',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Connecting Tables with JOIN</h2>
            <p>A <code>JOIN</code> clause combines rows from two or more tables based on a related column between them. It's like looking up a reference in one table to get more details from another.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Relationship Types:</strong> Tables are typically related via <strong>foreign keys</strong>. A users table (one) connects to orders table (many) — this is a <strong>one-to-many</strong> relationship. JOINs navigate these relationships.</p>
            </div>

            <h3>INNER JOIN</h3>
            <p>Returns only rows that have matching values in <strong>both</strong> tables. If a user has no orders, they won't appear.</p>
            <pre><code>SELECT users.name, orders.product, orders.amount
FROM users
INNER JOIN orders ON users.id = orders.user_id;

-- With table aliases (shorter and cleaner)
SELECT u.name, o.product, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;</code></pre>

            <h3>JOIN with Multiple Tables</h3>
            <p>You can join more than two tables in a single query:</p>
            <pre><code>SELECT u.name, o.product, o.amount, p.category
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN products p ON o.product_id = p.id;</code></pre>

            <h3>JOIN with WHERE</h3>
            <pre><code>SELECT u.name, o.product
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.amount > 100;</code></pre>

            <p>Try joining the <code>users</code> and <code>orders</code> tables in the simulator!</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>JOIN combines rows from two or more tables based on a related column</li>
              <li>INNER JOIN returns only rows with matching values in both tables</li>
              <li>Foreign keys define relationships between tables (usually one-to-many)</li>
              <li>Table aliases (u, o) make multi-table queries shorter and more readable</li>
              <li>You can JOIN more than two tables and combine with WHERE</li>
            </ul>
            <p><strong>Real-world use:</strong> An e-commerce dashboard JOINs orders, customers, and products to show complete order history with customer names and product details in a single query.</p>
          </div>
        `,
        defaultCode: 'SELECT users.name, orders.product, orders.amount\nFROM users\nINNER JOIN orders ON users.id = orders.user_id;',
        expectedKeyword: 'JOIN',
        expectedTable: 'orders',
      },
      {
        id: 'm2-l2',
        title: 'LEFT, RIGHT & FULL OUTER JOINs',
        objectives: [
          'Understand the difference between LEFT, RIGHT, and FULL OUTER JOINs',
          'Learn when to use each JOIN type for different data requirements',
          'Handle NULL values that appear from non-matching rows',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Outer JOINs — Including Non-Matching Rows</h2>
            <p>While INNER JOIN only shows matching rows, <strong>outer joins</strong> can include rows that don't have matches. Think of them as different invitation policies for a party!</p>

            <h3>LEFT JOIN (LEFT OUTER JOIN)</h3>
            <p>Returns ALL rows from the <strong>left</strong> table, with NULLs for non-matching right table columns.</p>
            <pre><code>-- Show ALL users, even those without orders
SELECT u.name, o.product
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;</code></pre>
            <p>This is like: "Show me every student, and also show me their grades if they took the test." Students without grades still appear — the grade column just says NULL.</p>

            <h3>RIGHT JOIN (RIGHT OUTER JOIN)</h3>
            <p>Returns ALL rows from the <strong>right</strong> table. The same as LEFT JOIN but from the opposite side. Most developers prefer LEFT JOIN for readability.</p>
            <pre><code>-- Show ALL orders, even if user info is missing
SELECT u.name, o.product
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;</code></pre>

            <h3>FULL OUTER JOIN</h3>
            <p>Returns ALL rows from BOTH tables. Rows without matches show NULL on the other side.</p>
            <pre><code>-- Show all users and all orders, matched where possible
SELECT u.name, o.product
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;</code></pre>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Key Insight:</strong> LEFT JOIN is the most common outer join in real applications. A typical use: "Show me all blog posts and their comments" — posts without comments still appear with NULL in the comment column.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>LEFT JOIN returns ALL left table rows, with NULLs for non-matching right table rows</li>
              <li>RIGHT JOIN is the same but from the opposite side (less commonly used)</li>
              <li>FULL OUTER JOIN returns all rows from both tables</li>
              <li>Use LEFT JOIN when you need "all items from table A, with optional info from table B"</li>
              <li>NULL in JOIN results means "no matching row found"</li>
            </ul>
            <p><strong>Real-world use:</strong> A reporting system uses LEFT JOIN to show all employees and their department names — even employees who haven't been assigned a department yet.</p>
          </div>
        `,
        defaultCode: '-- LEFT JOIN: all users, even without orders\nSELECT u.name, o.product\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id;\n\n-- FULL OUTER JOIN\nSELECT u.name, o.product\nFROM users u\nFULL OUTER JOIN orders o ON u.id = o.user_id;',
        expectedKeyword: 'LEFT',
        expectedTable: 'orders',
      },
      {
        id: 'm2-l3',
        title: 'Self-Joins, CROSS JOIN & Set Operations',
        objectives: [
          'Understand self-joins for hierarchical data within a single table',
          'Learn CROSS JOIN and when (rarely) to use it',
          'Master UNION, INTERSECT, and EXCEPT set operations',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Advanced Join Techniques</h2>

            <h3>Self-Join — A Table Joining Itself</h3>
            <p>A self-join is when a table is joined to itself. It's essential for <strong>hierarchical data</strong> like employee-manager relationships. You use different aliases for the same table.</p>
            <pre><code>-- Each employee has a manager_id referencing another employee
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;</code></pre>
            <p>Think of it like a <strong>family tree</strong> — one table stores all people, and self-join reveals parent-child (manager-employee) relationships.</p>

            <h3>CROSS JOIN — Cartesian Product</h3>
            <p>A CROSS JOIN creates <strong>every possible combination</strong> of rows from two tables. If table A has 3 rows and table B has 4 rows, the result has 12 rows.</p>
            <pre><code>-- Every user paired with every product (like a grid)
SELECT u.name, p.name
FROM users u
CROSS JOIN products p;</code></pre>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Warning:</strong> CROSS JOINs on large tables are dangerous! Two 10,000-row tables produce 100 million rows. Only use on small tables or with LIMIT.</p>
            </div>

            <h3>Set Operations: UNION, INTERSECT, EXCEPT</h3>
            <pre><code>-- UNION: combine results, remove duplicates
SELECT name FROM employees
UNION
SELECT name FROM contractors;

-- UNION ALL: combine results, keep duplicates (faster)
SELECT city FROM customers UNION ALL SELECT city FROM suppliers;

-- INTERSECT: only rows in BOTH queries
SELECT product_id FROM orders WHERE status = 'Shipped'
INTERSECT
SELECT product_id FROM inventory WHERE quantity > 0;

-- EXCEPT: rows in first query but NOT in second
SELECT user_id FROM users
EXCEPT
SELECT user_id FROM banned_users;</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Self-joins join a table to itself using different aliases (e, m)</li>
              <li>Self-joins model hierarchical data: org charts, categories, comment threads</li>
              <li>CROSS JOIN creates a Cartesian product (every row × every row) — use sparingly</li>
              <li>UNION combines queries and removes duplicates; UNION ALL is faster, keeps duplicates</li>
              <li>INTERSECT returns rows common to both queries; EXCEPT returns rows in first but not second</li>
              <li>Set operations require same number of columns with compatible data types</li>
            </ul>
            <p><strong>Real-world use:</strong> Social media comment systems use self-joins for nested reply threads. HR systems use self-joins for org chart reporting structures.</p>
          </div>
        `,
        defaultCode: "-- UNION example\nSELECT name AS entity, 'User' AS type FROM users\nUNION\nSELECT name AS entity, 'Product' AS type FROM products\nORDER BY entity;\n\n-- Self-join demo\nSELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id;",
        expectedKeyword: 'UNION',
        expectedTable: 'users',
      },
    ],
    quiz: [
      {
        id: 'm2-q1',
        question: 'Which type of JOIN returns rows that have matching values in both tables?',
        options: ['OUTER JOIN', 'INNER JOIN', 'CROSS JOIN', 'LEFT JOIN'],
        correct: 1,
      },
      {
        id: 'm2-q2',
        question: 'Which JOIN returns ALL rows from the left table, even without matches in the right table?',
        options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'CROSS JOIN'],
        correct: 2,
      },
      {
        id: 'm2-q3',
        question: 'What is the difference between UNION and UNION ALL?',
        options: [
          'UNION is faster than UNION ALL',
          'UNION removes duplicate rows; UNION ALL keeps all rows',
          'UNION ALL removes duplicates; UNION keeps all rows',
          'There is no difference',
        ],
        correct: 1,
      },
      {
        id: 'm2-q4',
        question: 'A self-join is most useful for:',
        options: [
          'Joining two completely unrelated tables',
          'Hierarchical data like employee-manager relationships',
          'Combining text columns into one',
          'Creating backups',
        ],
        correct: 1,
      },
      {
        id: 'm2-q5',
        question: 'Which set operator returns rows that appear in the first query but NOT in the second?',
        options: ['UNION', 'INTERSECT', 'EXCEPT', 'MINUS'],
        correct: 2,
      },
    ],
  },

  // ─── Module 3: PostgreSQL Indexes ───
  {
    id: 'mod-3',
    title: 'PostgreSQL Indexes',
    lessons: [
      {
        id: 'm3-l1',
        title: 'B-tree, GiST, GIN & BRIN Indexes',
        objectives: [
          'Understand what indexes are and how they speed up queries',
          'Learn the four main PostgreSQL index types: B-tree, GiST, GIN, BRIN',
          'Know when to use each index type for optimal performance',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Indexes — Your Query Speed Supercharger</h2>
            <p>An index is like the <strong>index at the back of a textbook</strong>. Without it, finding "Photosynthesis" means flipping through every page. With it, you go directly to the right page.</p>

            <h3>B-tree Index (Default)</h3>
            <p>The default and most common index type. Great for equality (=), range queries (>, <, BETWEEN), and sorting (ORDER BY).</p>
            <pre><code>CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_amount ON orders(amount);</code></pre>
            <p>Think of a B-tree like a <strong>phone book</strong> — sorted alphabetically, so you can find any name quickly.</p>

            <h3>GiST Index (Generalized Search Tree)</h3>
            <p>Best for geometric data, full-text search, and range types. Supports "nearest neighbor" and overlap searches.</p>
            <pre><code>CREATE INDEX idx_locations ON places USING GIST (coordinates);
CREATE INDEX idx_fts ON documents USING GIST (to_tsvector('english', body));</code></pre>
            <p>Think of GiST like a <strong>map</strong> — good for "find all restaurants within 5 miles."</p>

            <h3>GIN Index (Generalized Inverted Index)</h3>
            <p>Best for composite/array data, JSONB, and full-text search. Stores mappings from values to rows.</p>
            <pre><code>CREATE INDEX idx_tags ON posts USING GIN (tags);
CREATE INDEX idx_metadata ON users USING GIN (metadata); -- JSONB column</code></pre>
            <p>Think of GIN like a <strong>catalog of ingredients</strong> — "which recipes contain both chocolate AND peanut butter?"</p>

            <h3>BRIN Index (Block Range Index)</h3>
            <p>Best for <strong>very large, naturally-ordered data</strong> like timestamps or sequential IDs. Tiny index size.</p>
            <pre><code>CREATE INDEX idx_created ON logs USING BRIN (created_at);</code></pre>
            <p>Think of BRIN like a <strong>table of contents by chapter</strong> — much smaller than a full word-by-word index.</p>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Trade-off:</strong> Indexes speed up <strong>reads</strong> but slow down <strong>writes</strong>. Every INSERT/UPDATE/DELETE must update all relevant indexes. Don't over-index!</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>B-tree: All-purpose, default index — equality and range queries, sorting</li>
              <li>GiST: Geometric data, full-text search, range types, nearest-neighbor</li>
              <li>GIN: JSONB, arrays, full-text search — inverted index for composite values</li>
              <li>BRIN: Time-series data, natural ordering — tiny index, great for huge tables</li>
              <li>Indexes speed reads but slow writes — choose wisely based on query patterns</li>
              <li>Use EXPLAIN ANALYZE to verify indexes are being used</li>
            </ul>
            <p><strong>Real-world use:</strong> A social media app uses GIN index on user interests (array column) for matching. A time-series IoT platform uses BRIN on timestamps for log data.</p>
          </div>
        `,
        defaultCode: "-- Create a B-tree index\nCREATE INDEX idx_user_email ON users(email);\n\n-- Simulate a query that would use the index\nSELECT * FROM users WHERE email = 'john@example.com';\n\n-- Show existing indexes\nSELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users';",
        expectedKeyword: 'INDEX',
        expectedTable: 'INDEX',
      },
      {
        id: 'm3-l2',
        title: 'Querying JSONB Data',
        objectives: [
          'Understand the jsonb data type and its advantages over json',
          'Master JSONB operators: ->, ->>, @>, ?, ?|, ?&',
          'Combine JSONB with GIN indexes for fast searches',
        ],
        content: `
          <div class="lesson-prose">
            <h2>JSONB in PostgreSQL</h2>
            <p>PostgreSQL has excellent support for JSON. The <code>jsonb</code> data type stores JSON in a <strong>decomposed binary format</strong>, making it fast to process and index.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 json vs. jsonb:</strong> <code>json</code> stores an exact copy of the input text (preserves formatting, whitespace). <code>jsonb</code> stores a parsed binary representation (faster to query, supports indexes). Use <code>jsonb</code> unless you need to preserve exact formatting.</p>
            </div>

            <h3>JSONB Operators</h3>
            <pre><code>-- -> returns JSON (can chain)
SELECT metadata -> 'address' AS address FROM user_profiles;
SELECT metadata -> 'address' -> 'city' AS city FROM user_profiles;

-- ->> returns TEXT
SELECT metadata ->> 'role' AS role FROM user_profiles;

-- @> contains (does this JSON contain that?)
SELECT * FROM user_profiles WHERE metadata @> '{"role": "admin"}';

-- ? does key exist?
SELECT * FROM user_profiles WHERE metadata ? 'twitter_handle';

-- ?| any of these keys exist?
SELECT * FROM user_profiles WHERE metadata ?| array['twitter', 'github'];

-- ?& all of these keys exist?
SELECT * FROM user_profiles WHERE metadata ?& array['name', 'email'];</code></pre>

            <h3>GIN Index on JSONB</h3>
            <pre><code>CREATE INDEX idx_metadata ON user_profiles USING GIN (metadata);</code></pre>
            <p>With this index, queries using <code>@></code>, <code>?</code>, <code>?|</code>, and <code>?&</code> become blazing fast — even on millions of rows!</p>

            <p>Try extracting the 'role' from our user_profiles table!</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>JSONB stores JSON in a decomposed binary format — faster to query than plain JSON</li>
              <li>-> extracts JSON (can chain for nested access); ->> extracts as text</li>
              <li>@> checks containment; ? checks key existence</li>
              <li>?| checks if ANY keys exist; ?& checks if ALL keys exist</li>
              <li>GIN indexes on JSONB columns make containment queries extremely fast</li>
              <li>Use JSONB for flexible schemas, user preferences, event data</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce platforms store product attributes (size, color, weight, material) as JSONB. A GIN index powers the faceted search filter.</p>
          </div>
        `,
        defaultCode: "SELECT username, metadata->>'role' as role\nFROM user_metadata;",
        expectedKeyword: '->>',
        expectedTable: 'metadata',
      },
      {
        id: 'm3-l3',
        title: 'JSONB Advanced: Path Queries & Schema Design',
        objectives: [
          'Learn JSONB path/array traversal with #> and #>> operators',
          'Understand JSONB schema design patterns and trade-offs',
          'Master advanced JSONB functions: jsonb_each, jsonb_object_keys, jsonb_set',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Advanced JSONB Techniques</h2>

            <h3>Path Navigation with #> and #>></h3>
            <p>For deeply nested JSON, use path operators to navigate through multiple levels at once:</p>
            <pre><code>-- #> returns JSON object at path
SELECT metadata #> '{address, city}' FROM user_profiles;

-- #>> returns text at path
SELECT metadata #>> '{address, city}' AS city FROM user_profiles;

-- Navigate arrays: get first phone number
SELECT metadata #>> '{phones, 0, number}' AS primary_phone FROM user_profiles;</code></pre>
            <p>Think of paths like <strong>clicking through folders</strong> on your computer: Documents → Work → Report.pdf — that's a path <code>{'Documents', 'Work', 'Report.pdf'}</code>!</p>

            <h3>JSONB Functions</h3>
            <pre><code>-- List all keys in a JSONB object
SELECT jsonb_object_keys(metadata) FROM user_profiles;

-- Expand a JSONB object into key/value pairs
SELECT username, key, value FROM user_profiles, jsonb_each(metadata);

-- Update a value inside JSONB
UPDATE user_profiles
SET metadata = jsonb_set(metadata, '{role}', '"super_admin"', true)
WHERE username = 'johndoe';

-- Remove a key from JSONB
UPDATE user_profiles
SET metadata = metadata - 'temporary_field';</code></pre>

            <h3>Schema Design: Normal Columns vs. JSONB</h3>
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Best Practice:</strong> Use <strong>normal columns</strong> for data you query by and join on (user_id, email, status). Use <strong>JSONB</strong> for flexible, rarely-queried-by metadata (preferences, settings, custom fields).</p>
            </div>
            <p>Think of it like a <strong>home filing system</strong>: important documents (passport, birth certificate) go in clearly labeled folders (columns). Random receipts and notes go in a "miscellaneous" box (JSONB).</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>#> and #>> navigate JSON paths without chaining: #> '{address, city}'</li>
              <li>jsonb_object_keys lists all keys; jsonb_each expands to key-value pairs</li>
              <li>jsonb_set updates a value at a specific path within JSONB</li>
              <li>Use - operator to remove keys from JSONB</li>
              <li>Normal columns for core queryable data; JSONB for flexible metadata</li>
              <li>JSONB with GIN indexes gives you the best of both worlds</li>
            </ul>
            <p><strong>Real-world use:</strong> SaaS platforms store customer configuration (a mix of always-present and custom fields) as JSONB. The core fields (name, plan, status) are normal columns; the rest is JSONB.</p>
          </div>
        `,
        defaultCode: "-- Advanced JSONB queries\nSELECT username, metadata #>> '{role}' AS role\nFROM user_metadata;\n\n-- List all JSONB keys\nSELECT jsonb_object_keys(metadata) FROM user_metadata;\n\n-- Update JSONB value\nUPDATE user_metadata\nSET metadata = jsonb_set(metadata::jsonb, '{theme}', '\"auto\"', true)\nWHERE username = 'johndoe'\nRETURNING *;",
        expectedKeyword: 'jsonb_set',
        expectedTable: 'user_metadata',
      },
    ],
    quiz: [
      {
        id: 'm3-q1',
        question: 'Which PostgreSQL index type is best for JSONB data?',
        options: ['B-tree', 'GiST', 'GIN', 'BRIN'],
        correct: 2,
      },
      {
        id: 'm3-q2',
        question: 'Which operator is used to extract a JSON object field as TEXT in PostgreSQL?',
        options: ['->', '=>', '->>', '>>'],
        correct: 2,
      },
      {
        id: 'm3-q3',
        question: 'Which index type is ideal for time-series data on timestamp columns?',
        options: ['B-tree', 'GiST', 'GIN', 'BRIN'],
        correct: 3,
      },
      {
        id: 'm3-q4',
        question: 'What is the primary trade-off when adding an index to a table?',
        options: [
          'Faster writes but slower reads',
          'Faster reads but slower writes',
          'Indexes take up no extra disk space',
          'Indexes only work on INTEGER columns',
        ],
        correct: 1,
      },
      {
        id: 'm3-q5',
        question: 'What does the @> operator do on JSONB columns?',
        options: [
          'Returns the length of the JSONB value',
          'Checks if the JSONB value contains the specified key/value pairs',
          'Concatenates two JSONB values',
          'Deletes the specified key from JSONB',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 4: Aggregate Functions ───
  {
    id: 'mod-4',
    title: 'Aggregate Functions',
    lessons: [
      {
        id: 'm4-l1',
        title: 'COUNT, SUM, AVG, MIN, MAX',
        objectives: [
          'Understand how aggregate functions summarize multiple rows into a single result',
          'Master COUNT, SUM, AVG, MIN, and MAX',
          'Learn the difference between COUNT(*) and COUNT(column)',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Summarizing Data with Aggregate Functions</h2>
            <p>Aggregate functions perform calculations across multiple rows and return a single summary value. Instead of looking at every row, they tell you the big picture.</p>

            <h3>The Five Essential Aggregates</h3>
            <pre><code>-- Total number of orders
SELECT COUNT(*) AS total_orders FROM orders;

-- Average order amount
SELECT AVG(amount) AS avg_amount FROM orders;

-- Total revenue
SELECT SUM(amount) AS total_revenue FROM orders;

-- Highest and lowest amounts
SELECT MAX(amount) AS highest, MIN(amount) AS lowest FROM orders;

-- All in one query
SELECT
  COUNT(*) AS total,
  AVG(amount) AS average,
  SUM(amount) AS total_revenue,
  MAX(amount) AS max_order,
  MIN(amount) AS min_order
FROM orders;</code></pre>

            <h3>COUNT(*) vs. COUNT(column)</h3>
            <p>This is a subtle but important distinction:</p>
            <pre><code>SELECT
  COUNT(*) AS all_rows,           -- Counts ALL rows including those with NULLs
  COUNT(amount) AS with_amount,   -- Counts only non-NULL amount values
  COUNT(DISTINCT user_id) AS unique_customers  -- Counts unique user IDs
FROM orders;</code></pre>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 NULL Behavior:</strong> Aggregate functions (except COUNT(*)) ignore NULL values. If some rows have NULL amounts, AVG(amount) divides by the count of non-NULL values only.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>COUNT(*) counts all rows; COUNT(col) counts non-NULL values</li>
              <li>SUM adds all values; AVG calculates the average</li>
              <li>MAX finds the largest value; MIN finds the smallest</li>
              <li>COUNT(DISTINCT col) counts unique non-NULL values</li>
              <li>Aggregate functions ignore NULLs (except COUNT(*))</li>
              <li>Combine multiple aggregates in one query for a complete summary</li>
            </ul>
            <p><strong>Real-world use:</strong> Business dashboards use aggregates constantly: "Total users this month", "Average order value", "Most expensive product sold", "Revenue by quarter".</p>
          </div>
        `,
        defaultCode: 'SELECT\n  COUNT(*) AS total_orders,\n  AVG(amount) AS avg_amount,\n  SUM(amount) AS total_revenue,\n  MAX(amount) AS max_order,\n  MIN(amount) AS min_order\nFROM orders;',
        expectedKeyword: 'COUNT',
        expectedTable: 'orders',
      },
      {
        id: 'm4-l2',
        title: 'GROUP BY & HAVING',
        objectives: [
          'Understand how GROUP BY splits data into groups for aggregate calculations',
          'Learn the HAVING clause for filtering groups after aggregation',
          'Master the query execution order: WHERE → GROUP BY → HAVING',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Grouping Data with GROUP BY</h2>
            <p><code>GROUP BY</code> is like sorting LEGO bricks by color before counting them. You group similar rows together, then calculate something for each group.</p>

            <h3>Basic GROUP BY</h3>
            <pre><code>-- Count orders by status
SELECT status, COUNT(*) AS order_count
FROM orders
GROUP BY status;

-- Total revenue by user
SELECT user_id, SUM(amount) AS total_spent
FROM orders
GROUP BY user_id;</code></pre>

            <h3>GROUP BY with Multiple Columns</h3>
            <pre><code>-- Revenue by user and status
SELECT user_id, status, SUM(amount) AS total
FROM orders
GROUP BY user_id, status;</code></pre>

            <h3>The HAVING Clause — Filtering Groups</h3>
            <p><code>HAVING</code> is like WHERE for groups. WHERE filters rows BEFORE grouping; HAVING filters groups AFTER grouping.</p>
            <pre><code>-- Only show statuses with more than 1 order
SELECT status, COUNT(*) AS order_count
FROM orders
GROUP BY status
HAVING COUNT(*) > 1;

-- Only show users who spent more than $100 total
SELECT user_id, SUM(amount) AS total_spent
FROM orders
GROUP BY user_id
HAVING SUM(amount) > 100;</code></pre>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Execution Order:</strong> WHERE → GROUP BY → HAVING. First filter unwanted rows (WHERE), then group them (GROUP BY), then filter unwanted groups (HAVING).</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>GROUP BY splits data into groups; aggregate functions calculate per-group values</li>
              <li>Group by one or more columns: GROUP BY status, user_id</li>
              <li>HAVING filters groups after aggregation (like WHERE for groups)</li>
              <li>Query order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY</li>
              <li>Every column in SELECT must be in GROUP BY or be an aggregate</li>
            </ul>
            <p><strong>Real-world use:</strong> Sales reports GROUP BY month to show monthly revenue. User analytics GROUP BY signup_source to see which channels bring the most users.</p>
          </div>
        `,
        defaultCode: '-- Count orders by status\nSELECT status, COUNT(*) AS count\nFROM orders\nGROUP BY status;\n\n-- With HAVING filter\nSELECT status, COUNT(*) AS count\nFROM orders\nGROUP BY status\nHAVING COUNT(*) > 1;',
        expectedKeyword: 'GROUP',
        expectedTable: 'orders',
      },
      {
        id: 'm4-l3',
        title: 'DISTINCT, NULL Handling & Filtered Aggregates',
        objectives: [
          'Use DISTINCT to count unique values within aggregations',
          'Handle NULL values properly in aggregate calculations',
          'Master PostgreSQL FILTER clause for conditional aggregation',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Advanced Aggregate Techniques</h2>

            <h3>DISTINCT with Aggregates</h3>
            <pre><code>-- How many different users have placed orders?
SELECT COUNT(DISTINCT user_id) AS unique_buyers FROM orders;

-- How many different products were ordered?
SELECT COUNT(DISTINCT product) AS unique_products FROM orders;</code></pre>

            <h3>NULL Handling with COALESCE</h3>
            <p>NULL represents "unknown" or "no value". Use <code>COALESCE</code> to replace NULL with a default:</p>
            <pre><code>-- Treat NULL as 0 for averaging
SELECT AVG(COALESCE(amount, 0)) AS avg_including_nulls FROM orders;

-- COALESCE in SELECT list
SELECT name, COALESCE(email, 'no-email@example.com') AS contact FROM users;</code></pre>

            <h3>PostgreSQL FILTER Clause</h3>
            <p>PostgreSQL has a powerful <code>FILTER</code> clause that lets you aggregate only specific rows:</p>
            <pre><code>-- Count orders in different categories
SELECT
  COUNT(*) FILTER (WHERE amount > 100) AS big_orders,
  COUNT(*) FILTER (WHERE amount BETWEEN 10 AND 100) AS medium_orders,
  COUNT(*) FILTER (WHERE amount < 10) AS small_orders
FROM orders;

-- Sum only completed orders
SELECT
  SUM(amount) FILTER (WHERE status = 'Completed') AS completed_revenue,
  SUM(amount) FILTER (WHERE status = 'Pending') AS pending_revenue
FROM orders;</code></pre>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> FILTER is more efficient than multiple queries or CASE expressions. It scans the table once and applies different filters to the same aggregate!</p>
            </div>

            <h3>FILTER vs. CASE</h3>
            <pre><code>-- These are equivalent:
SELECT COUNT(*) FILTER (WHERE amount > 100) FROM orders;
SELECT COUNT(CASE WHEN amount > 100 THEN 1 END) FROM orders;</code></pre>
            <p>FILTER is cleaner and more readable. Use it when possible!</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>COUNT(DISTINCT col) counts unique non-NULL values</li>
              <li>COALESCE replaces NULL with a default value in calculations</li>
              <li>FILTER (WHERE condition) enables conditional aggregation</li>
              <li>FILTER is PostgreSQL-specific and more readable than CASE inside aggregates</li>
              <li>FILTER scans the table once for all conditions — very efficient</li>
            </ul>
            <p><strong>Real-world use:</strong> A sales dashboard uses FILTER to show "orders under $50", "$50-$200", and "over $200" in a single query — one table scan instead of three!</p>
          </div>
        `,
        defaultCode: '-- FILTER clause demo\nSELECT\n  COUNT(*) AS total_orders,\n  COUNT(*) FILTER (WHERE amount > 100) AS large_orders,\n  AVG(amount) FILTER (WHERE status = \'Completed\') AS avg_completed\nFROM orders;\n\n-- COALESCE example\nSELECT name, COALESCE(email, \'No email\') AS email\nFROM users;',
        expectedKeyword: 'FILTER',
        expectedTable: 'orders',
      },
    ],
    quiz: [
      {
        id: 'm4-q1',
        question: 'Which aggregate function would you use to find the highest value in a column?',
        options: ['COUNT', 'MAX', 'TOP', 'HIGHEST'],
        correct: 1,
      },
      {
        id: 'm4-q2',
        question: 'What is the difference between COUNT(*) and COUNT(column)?',
        options: [
          'They are identical',
          'COUNT(*) counts all rows; COUNT(column) counts non-NULL values in that column',
          'COUNT(*) is faster',
          'COUNT(column) always returns 1',
        ],
        correct: 1,
      },
      {
        id: 'm4-q3',
        question: 'Which clause filters groups AFTER aggregation?',
        options: ['WHERE', 'HAVING', 'FILTER', 'GROUP BY'],
        correct: 1,
      },
      {
        id: 'm4-q4',
        question: 'What does the FILTER clause do in PostgreSQL?',
        options: [
          'Removes duplicate rows from the result',
          'Applies a condition to aggregate functions, affecting only matching rows',
          'Filters rows before GROUP BY',
          'Limits the number of groups returned',
        ],
        correct: 1,
      },
      {
        id: 'm4-q5',
        question: 'What is the correct execution order of query clauses?',
        options: [
          'SELECT → FROM → WHERE → GROUP BY → HAVING',
          'FROM → WHERE → GROUP BY → HAVING → SELECT',
          'FROM → GROUP BY → WHERE → HAVING → SELECT',
          'SELECT → GROUP BY → HAVING → WHERE → FROM',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 5: Subqueries & CTEs ───
  {
    id: 'mod-5',
    title: 'Subqueries & CTEs',
    lessons: [
      {
        id: 'm5-l1',
        title: 'Scalar, Row & Table Subqueries',
        objectives: [
          'Understand what subqueries are and when to use them',
          'Master scalar, row, and table subqueries',
          'Learn correlated subqueries that reference outer query columns',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Nested Queries — Questions Within Questions</h2>
            <p>A <strong>subquery</strong> is a SELECT statement nested inside another SELECT, INSERT, UPDATE, or DELETE. Think of it like a <strong>Russian nesting doll</strong> — a query inside a query.</p>

            <h3>Scalar Subquery (Returns One Value)</h3>
            <pre><code>-- Find users who spent more than average
SELECT name, email
FROM users
WHERE id IN (
  SELECT user_id FROM orders
  WHERE amount > (SELECT AVG(amount) FROM orders)
);</code></pre>

            <h3>Row Subquery (Returns One Row)</h3>
            <pre><code>-- Find the user with the max order
SELECT * FROM users
WHERE (id) = (
  SELECT user_id FROM orders
  ORDER BY amount DESC LIMIT 1
);</code></pre>

            <h3>Table Subquery (Returns Multiple Rows)</h3>
            <pre><code>-- Use subquery result as a temporary table
SELECT u.name, o.total_orders
FROM users u
JOIN (
  SELECT user_id, COUNT(*) AS total_orders
  FROM orders
  GROUP BY user_id
) o ON u.id = o.user_id;</code></pre>

            <h3>Correlated Subqueries</h3>
            <p>A correlated subquery references columns from the <strong>outer query</strong>. It runs once for each row processed by the outer query.</p>
            <pre><code>-- Find users who have placed at least one order over $100
SELECT name FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.amount > 100
);</code></pre>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Performance Note:</strong> Correlated subqueries can be slow on large tables because they run once per outer row. In many cases, JOINs or CTEs are more efficient alternatives.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Scalar subquery: returns a single value (one row, one column)</li>
              <li>Row subquery: returns a single row (multiple columns allowed)</li>
              <li>Table subquery: returns multiple rows, used like a derived table in FROM/JOIN</li>
              <li>Correlated subquery: references outer query columns, runs per outer row</li>
              <li>EXISTS checks if a subquery returns any rows (more efficient than IN for large sets)</li>
            </ul>
            <p><strong>Real-world use:</strong> "Find customers who haven't ordered in 90 days" uses a correlated subquery with NOT EXISTS.</p>
          </div>
        `,
        defaultCode: '-- Subquery: users who spent more than average\nSELECT name FROM users\nWHERE id IN (\n  SELECT user_id FROM orders\n  WHERE amount > (SELECT AVG(amount) FROM orders)\n);\n\n-- EXISTS subquery\nSELECT name FROM users u\nWHERE EXISTS (\n  SELECT 1 FROM orders o WHERE o.user_id = u.id\n);',
        expectedKeyword: 'EXISTS',
        expectedTable: 'users',
      },
      {
        id: 'm5-l2',
        title: 'Common Table Expressions (CTEs)',
        objectives: [
          'Understand what CTEs are and how they improve query readability',
          'Write CTEs using the WITH clause',
          'Use multiple CTEs in a single query',
        ],
        content: `
          <div class="lesson-prose">
            <h2>CTEs — Named Subqueries for Cleaner SQL</h2>
            <p>CTE stands for <strong>Common Table Expression</strong>. It's like a <strong>sticky note</strong> where you write down a query result so you can reference it by name later. CTEs make complex queries much easier to read.</p>

            <h3>Basic CTE Syntax</h3>
            <pre><code>WITH high_value_orders AS (
  SELECT * FROM orders WHERE amount > 100
)
SELECT u.name, hvo.product
FROM users u
JOIN high_value_orders hvo ON u.id = hvo.user_id;</code></pre>

            <h3>Multiple CTEs</h3>
            <p>You can define several CTEs in a single WITH clause, separating them by commas:</p>
            <pre><code>WITH
  order_counts AS (
    SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id
  ),
  big_spenders AS (
    SELECT user_id, SUM(amount) AS total FROM orders GROUP BY user_id
  )
SELECT u.name, oc.cnt, bs.total
FROM users u
LEFT JOIN order_counts oc ON u.id = oc.user_id
LEFT JOIN big_spenders bs ON u.id = bs.user_id;</code></pre>

            <h3>CTE vs. Subquery</h3>
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 When to use CTEs:</strong> CTEs are best when you need to reference the same subquery multiple times, when you want to break a complex query into readable steps, or when you need recursive queries. For simple one-use subqueries, inline subqueries are fine.</p>
            </div>

            <p>CTEs make your queries <strong>read like a story</strong> — step by step, from top to bottom. Much easier to understand than deeply nested subqueries!</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>CTEs are named temporary result sets defined with WITH</li>
              <li>Multiple CTEs can be defined in a single WITH clause (comma-separated)</li>
              <li>CTEs improve readability by breaking complex queries into steps</li>
              <li>CTEs can reference each other (though recursion requires special syntax)</li>
              <li>Unlike subqueries, CTEs can be referenced multiple times in the main query</li>
            </ul>
            <p><strong>Real-world use:</strong> A monthly report might use CTEs to define "this month's signups", "churned users", and "active users" before comparing them in the final SELECT.</p>
          </div>
        `,
        defaultCode: '-- Basic CTE\nWITH high_value AS (\n  SELECT * FROM orders WHERE amount > 100\n)\nSELECT u.name, h.product, h.amount\nFROM users u\nJOIN high_value h ON u.id = h.user_id;\n\n-- Multiple CTEs\nWITH\n  total_orders AS (\n    SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id\n  )\nSELECT u.name, t.cnt\nFROM users u\nLEFT JOIN total_orders t ON u.id = t.user_id;',
        expectedKeyword: 'WITH',
        expectedTable: 'orders',
      },
      {
        id: 'm5-l3',
        title: 'Recursive CTEs',
        objectives: [
          'Understand the recursive CTE pattern (anchor + recursive member)',
          'Use recursive CTEs for hierarchical and graph traversal queries',
          'Implement organizational charts and tree structures',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Recursive CTEs — Queries That Loop</h2>
            <p>A recursive CTE is a CTE that <strong>calls itself</strong>. It's like a mirror staring at another mirror — it keeps going deeper until it hits a stopping point.</p>
            <p>Every recursive CTE has two parts:</p>
            <ol>
              <li><strong>Anchor member</strong> — The starting point (first level)</li>
              <li><strong>Recursive member</strong> — The part that calls itself, with a stop condition</li>
            </ol>

            <h3>Organizational Chart Example</h3>
            <pre><code>WITH RECURSIVE org_chart AS (
  -- Anchor: top-level managers (no manager)
  SELECT id, name, manager_id, 1 AS level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive: employees reporting to managers found above
  SELECT e.id, e.name, e.manager_id, oc.level + 1
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT * FROM org_chart ORDER BY level, name;</code></pre>

            <h3>Category Tree Example</h3>
            <pre><code>WITH RECURSIVE category_tree AS (
  -- Anchor: top-level categories
  SELECT id, name, parent_id, name AS path
  FROM categories WHERE parent_id IS NULL

  UNION ALL

  -- Recursive: subcategories
  SELECT c.id, c.name, c.parent_id,
         ct.path || ' → ' || c.name
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY path;</code></pre>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Use Cases:</strong> Recursive CTEs are perfect for org charts, category trees, family trees, comment threads (replies to replies), social graph traversal ("friends of friends"), and bill-of-materials explosions.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Recursive CTEs have an anchor member (starting point) and a recursive member</li>
              <li>The anchor selects the initial rows; the recursive member finds related rows</li>
              <li>UNION ALL combines anchor results with each recursive iteration</li>
              <li>Recursion stops when no new rows are returned</li>
              <li>Useful for: org charts, category trees, social graphs, comment threads</li>
              <li>Add a level counter to track depth and prevent infinite recursion</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce sites use recursive CTEs to build category navigation ("Electronics → Computers → Laptops → Gaming Laptops").</p>
          </div>
        `,
        defaultCode: "-- Recursive CTE: org chart\nWITH RECURSIVE org_chart AS (\n  SELECT id, name, manager_id, 1 AS level\n  FROM employees\n  WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.id, e.name, e.manager_id, oc.level + 1\n  FROM employees e\n  JOIN org_chart oc ON e.manager_id = oc.id\n)\nSELECT * FROM org_chart ORDER BY level, name\nLIMIT 10;",
        expectedKeyword: 'RECURSIVE',
        expectedTable: 'employees',
      },
    ],
    quiz: [
      {
        id: 'm5-q1',
        question: 'What is a subquery?',
        options: [
          'A query that runs faster than normal queries',
          'A SELECT statement nested inside another SQL statement',
          'A query that only returns NULL values',
          'A query that modifies the database schema',
        ],
        correct: 1,
      },
      {
        id: 'm5-q2',
        question: 'What keyword starts a Common Table Expression (CTE)?',
        options: ['CTE', 'WITH', 'TEMP', 'DEFINE'],
        correct: 1,
      },
      {
        id: 'm5-q3',
        question: 'A recursive CTE must contain which two parts?',
        options: [
          'SELECT and INSERT',
          'Anchor member and recursive member',
          'Base case and fallback case',
          'START and END',
        ],
        correct: 1,
      },
      {
        id: 'm5-q4',
        question: 'What does the EXISTS keyword check in a subquery?',
        options: [
          'Whether a table exists in the database',
          'Whether the subquery returns any rows at all',
          'Whether a column exists in a table',
          'Whether an index exists on a column',
        ],
        correct: 1,
      },
      {
        id: 'm5-q5',
        question: 'Which type of subquery references columns from the outer query?',
        options: ['Scalar subquery', 'Correlated subquery', 'Table subquery', 'Row subquery'],
        correct: 1,
      },
    ],
  },

  // ─── Module 6: Window Functions ───
  {
    id: 'mod-6',
    title: 'Window Functions',
    lessons: [
      {
        id: 'm6-l1',
        title: 'ROW_NUMBER, RANK, DENSE_RANK & NTILE',
        objectives: [
          'Understand what window functions are and how they differ from aggregates',
          'Master ROW_NUMBER, RANK, DENSE_RANK for row numbering and ranking',
          'Use NTILE to distribute rows into quantiles',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Window Functions — Seeing the Forest and the Trees</h2>
            <p><strong>Window functions</strong> perform calculations across a set of rows related to the current row. Unlike GROUP BY which collapses rows, window functions <strong>keep every row</strong> while showing the group calculation alongside.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Key Difference:</strong> GROUP BY turns many rows into one summary row per group. Window functions keep all rows and add the summary as an extra column. GROUP BY = collapse. Window functions = expand.</p>
            </div>

            <h3>Ranking Functions</h3>
            <pre><code>SELECT
  name,
  amount,
  ROW_NUMBER() OVER (ORDER BY amount DESC) AS row_num,
  RANK() OVER (ORDER BY amount DESC) AS rank,
  DENSE_RANK() OVER (ORDER BY amount DESC) AS dense_rank
FROM orders;</code></pre>
            <ul>
              <li><strong>ROW_NUMBER()</strong> — Unique number for each row (1, 2, 3, 4, 5)</li>
              <li><strong>RANK()</strong> — Rank with gaps for ties (1, 2, 2, 4, 5)</li>
              <li><strong>DENSE_RANK()</strong> — Rank without gaps for ties (1, 2, 2, 3, 4)</li>
            </ul>

            <h3>NTILE — Dividing into Buckets</h3>
            <pre><code>-- Split orders into 4 quartiles by amount
SELECT
  name,
  amount,
  NTILE(4) OVER (ORDER BY amount DESC) AS quartile
FROM orders;</code></pre>
            <p>NTILE is ideal for <strong>data segmentation</strong> — top 25%, bottom 25%, etc.</p>

            <h3>PARTITION BY — Grouping Within Window Functions</h3>
            <pre><code>-- Rank customers within each product category
SELECT
  name,
  amount,
  RANK() OVER (PARTITION BY product ORDER BY amount DESC) AS rank_in_product
FROM orders;</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Window functions keep all rows and add aggregate-like calculations as extra columns</li>
              <li>ROW_NUMBER assigns unique sequential numbers (no ties)</li>
              <li>RANK allows ties but skips numbers; DENSE_RANK does not skip</li>
              <li>NTILE(n) distributes rows into n roughly equal buckets</li>
              <li>PARTITION BY creates separate windows within groups</li>
              <li>ORDER BY inside OVER defines the order within the window</li>
            </ul>
            <p><strong>Real-world use:</strong> "Show the top 3 products by revenue in each category" uses RANK() with PARTITION BY category.</p>
          </div>
        `,
        defaultCode: '-- Ranking functions\nSELECT\n  name,\n  amount,\n  ROW_NUMBER() OVER (ORDER BY amount DESC) AS row_num,\n  RANK() OVER (ORDER BY amount DESC) AS rank,\n  DENSE_RANK() OVER (ORDER BY amount DESC) AS dense_rank\nFROM orders;\n\n-- NTILE\nSELECT name, amount,\n  NTILE(3) OVER (ORDER BY amount) AS bucket\nFROM orders;',
        expectedKeyword: 'ROW_NUMBER',
        expectedTable: 'orders',
      },
      {
        id: 'm6-l2',
        title: 'LAG, LEAD, Running Totals & Window Frames',
        objectives: [
          'Use LAG and LEAD to access previous/next row values',
          'Calculate running totals and moving averages',
          'Understand window frames for precise row set specification',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Advanced Window Functions</h2>

            <h3>LAG and LEAD — Looking Backward and Forward</h3>
            <p><code>LAG</code> accesses data from the previous row; <code>LEAD</code> accesses data from the next row. These are essential for <strong>time series analysis</strong>.</p>
            <pre><code>-- Compare each order amount to the previous one
SELECT
  name,
  amount,
  LAG(amount, 1) OVER (ORDER BY id) AS prev_amount,
  amount - LAG(amount, 1) OVER (ORDER BY id) AS diff_from_prev
FROM orders;

-- LEAD: what's the next order amount?
SELECT
  name,
  amount,
  LEAD(amount, 1) OVER (ORDER BY id) AS next_amount
FROM orders;</code></pre>

            <h3>Running Totals</h3>
            <pre><code>-- Cumulative sum of orders over time
SELECT
  name,
  amount,
  SUM(amount) OVER (ORDER BY id) AS running_total
FROM orders;</code></pre>

            <h3>Moving Averages with Window Frames</h3>
            <p><strong>Window frames</strong> let you specify exactly which rows to include in the calculation.</p>
            <pre><code>-- 3-row moving average (current row, previous row, next row)
SELECT
  amount,
  AVG(amount) OVER (
    ORDER BY id
    ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
  ) AS moving_avg_3
FROM orders;

-- Running average from start to current row
SELECT
  amount,
  AVG(amount) OVER (ORDER BY id ROWS UNBOUNDED PRECEDING) AS running_avg
FROM orders;</code></pre>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Window Frame Keywords:</strong> ROWS BETWEEN ... PRECEDING AND ... FOLLOWING, UNBOUNDED PRECEDING (all rows before), CURRENT ROW, UNBOUNDED FOLLOWING (all rows after).</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>LAG accesses a previous row; LEAD accesses a next row (offset optional, default 1)</li>
              <li>Running totals: SUM(col) OVER (ORDER BY sequencing_col)</li>
              <li>Window frames: ROWS BETWEEN start AND end defines the row set</li>
              <li>Moving averages use ROWS BETWEEN N PRECEDING AND N FOLLOWING</li>
              <li>UNBOUNDED PRECEDING = all rows from the start of the partition</li>
            </ul>
            <p><strong>Real-world use:</strong> Stock market analysis uses 50-day moving averages. Month-over-month growth uses LAG to compare current month to previous month.</p>
          </div>
        `,
        defaultCode: '-- LAG/LEAD\nSELECT\n  name, amount,\n  LAG(amount) OVER (ORDER BY id) AS prev_amount,\n  LEAD(amount) OVER (ORDER BY id) AS next_amount\nFROM orders;\n\n-- Running total\nSELECT name, amount,\n  SUM(amount) OVER (ORDER BY id) AS running_total\nFROM orders;\n\n-- Moving average\nSELECT amount,\n  AVG(amount) OVER (ORDER BY id ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS moving_avg\nFROM orders;',
        expectedKeyword: 'LAG',
        expectedTable: 'orders',
      },
    ],
    quiz: [
      {
        id: 'm6-q1',
        question: 'What is the key difference between window functions and GROUP BY?',
        options: [
          'There is no difference — they are the same',
          'Window functions collapse rows; GROUP BY keeps all rows',
          'Window functions keep all rows; GROUP BY collapses rows into groups',
          'Window functions cannot use aggregates',
        ],
        correct: 2,
      },
      {
        id: 'm6-q2',
        question: 'Which function provides access to the previous row\'s value?',
        options: ['LEAD', 'PREV', 'LAG', 'BEFORE'],
        correct: 2,
      },
      {
        id: 'm6-q3',
        question: 'What does DENSE_RANK do differently from RANK?',
        options: [
          'DENSE_RANK is slower than RANK',
          'DENSE_RANK does not skip numbers after ties; RANK does',
          'DENSE_RANK skips more numbers than RANK',
          'They are identical',
        ],
        correct: 1,
      },
      {
        id: 'm6-q4',
        question: 'What does the NTILE(4) function do?',
        options: [
          'Drops the lowest 4 rows',
          'Divides rows into 4 roughly equal buckets',
          'Returns the 4th row in each partition',
          'Calculates the average of 4 rows',
        ],
        correct: 1,
      },
      {
        id: 'm6-q5',
        question: 'What window frame would you use for a 5-row centered moving average?',
        options: [
          'ROWS BETWEEN 5 PRECEDING AND CURRENT ROW',
          'ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING',
          'ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING',
          'ROWS BETWEEN 1 PRECEDING AND 5 FOLLOWING',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 7: Full-Text Search ───
  {
    id: 'mod-7',
    title: 'Full-Text Search',
    lessons: [
      {
        id: 'm7-l1',
        title: 'tsvector & tsquery Basics',
        objectives: [
          'Understand PostgreSQL full-text search capabilities',
          'Learn how tsvector and tsquery data types work',
          'Use the @@ operator for matching documents to queries',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Full-Text Search in PostgreSQL</h2>
            <p>PostgreSQL's full-text search is like having <strong>Google search built into your database</strong>. Regular <code>ILIKE '%keyword%'</code> searches are slow and can't understand that "running", "ran", and "runs" are the same word.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Key Advantage:</strong> Full-text search understands <strong>linguistics</strong> — it normalizes words to their root form (lexeme). "Searched", "searching", "searches" all become "search". This is called <strong>stemming</strong>.</p>
            </div>

            <h3>tsvector — The Document Representation</h3>
            <p><code>tsvector</code> breaks text into lexemes (normalized words) and notes their positions:</p>
            <pre><code>SELECT to_tsvector('english', 'The cats sat on the mats');
-- Result: 'cat':2 'mat':6 'sat':3</code></pre>
            <p>"The" and "on" are removed as <strong>stop words</strong> (common words that don't add meaning). "Cats" becomes "cat", "mats" becomes "mat" (stemming).</p>

            <h3>tsquery — The Search Query</h3>
            <p><code>tsquery</code> represents a search query with operators:</p>
            <pre><code>SELECT to_tsquery('english', 'cat & mat');
-- Result: 'cat' & 'mat'

SELECT to_tsquery('english', 'cat | dog');
-- Result: 'cat' | 'dog'

SELECT to_tsquery('english', '!mouse');
-- Result: !'mouse'</code></pre>
            <ul>
              <li><strong>&</strong> — AND (both terms must appear)</li>
              <li><strong>|</strong> — OR (either term can appear)</li>
              <li><strong>!</strong> — NOT (term must NOT appear)</li>
            </ul>

            <h3>The @@ Match Operator</h3>
            <pre><code>SELECT to_tsvector('english', 'The cats sat on the mats')
       @@ to_tsquery('english', 'cat & mat');
-- Returns: true (document contains both 'cat' and 'mat')</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>to_tsvector converts text to a search vector (lexemes with positions)</li>
              <li>to_tsquery converts a search string to a query (lexemes with operators)</li>
              <li>@@ operator checks if a tsvector matches a tsquery</li>
              <li>Operators: & (AND), | (OR), ! (NOT)</li>
              <li>Stop words (the, a, on) are automatically removed</li>
              <li>Stemming normalizes words: cats → cat, running → run</li>
            </ul>
            <p><strong>Real-world use:</strong> Documentation sites search articles using to_tsvector() on body text matched against user queries with to_tsquery().</p>
          </div>
        `,
        defaultCode: "-- Basic full-text search\nSELECT to_tsvector('english', 'The cats sat on the mats') @@ to_tsquery('english', 'cat & sat');\n\n-- Search the documents table\nSELECT title, body\nFROM documents\nWHERE to_tsvector('english', body) @@ to_tsquery('english', 'database & sql');",
        expectedKeyword: 'to_tsvector',
        expectedTable: 'documents',
      },
      {
        id: 'm7-l2',
        title: 'Search Configuration, Indexing & Ranking',
        objectives: [
          'Create GIN indexes on tsvector columns for fast search',
          'Rank search results by relevance using ts_rank',
          'Use plainto_tsquery for simpler user-facing search',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Production Full-Text Search</h2>

            <h3>Creating a Search Index</h3>
            <p>For real-world use, create a GIN index on the tsvector column. This makes searches blazing fast:</p>
            <pre><code>-- Add a tsvector column
ALTER TABLE documents ADD COLUMN search_vector tsvector;

-- Update it with your text
UPDATE documents SET search_vector = to_tsvector('english', title || ' ' || body);

-- Create a GIN index
CREATE INDEX idx_docs_search ON documents USING GIN (search_vector);

-- Create a trigger to keep it updated automatically
CREATE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.title || ' ' || NEW.body);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_docs_search
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();</code></pre>

            <h3>Ranking Results with ts_rank</h3>
            <p>Rank results by relevance so the best matches appear first:</p>
            <pre><code>SELECT title,
       ts_rank(search_vector, query) AS rank
FROM documents, to_tsquery('english', 'postgresql & search') query
WHERE search_vector @@ query
ORDER BY rank DESC;</code></pre>

            <h3>plainto_tsquery — User-Friendly Search</h3>
            <p><code>plainto_tsquery</code> formats user input into a query without requiring special operators:</p>
            <pre><code>-- User types: "postgresql full text search"
SELECT plainto_tsquery('english', 'postgresql full text search');
-- Result: 'postgresql' & 'full' & 'text' & 'search'</code></pre>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Language Support:</strong> PostgreSQL supports many languages for full-text search: english, french, german, spanish, italian, dutch, russian, and more. Each language has its own stop words and stemming rules.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Create GIN indexes on tsvector columns for fast full-text search</li>
              <li>Use triggers to keep tsvector columns automatically updated</li>
              <li>ts_rank scores results by relevance; ORDER BY rank DESC for best matches</li>
              <li>plainto_tsquery converts plain text to a tsquery without special operators</li>
              <li>PostgreSQL supports multiple languages with language-specific dictionaries</li>
            </ul>
            <p><strong>Real-world use:</strong> Blog platforms use full-text search with GIN indexes so readers can search millions of articles instantly. E-commerce sites use it for product search.</p>
          </div>
        `,
        defaultCode: "-- Full-text search with ranking\nSELECT title,\n  ts_rank(to_tsvector('english', title || ' ' || body), query) AS rank\nFROM documents,\n  plainto_tsquery('english', 'database performance') query\nWHERE to_tsvector('english', title || ' ' || body) @@ query\nORDER BY rank DESC;",
        expectedKeyword: 'ts_rank',
        expectedTable: 'documents',
      },
    ],
    quiz: [
      {
        id: 'm7-q1',
        question: 'What does to_tsvector() do?',
        options: [
          'Converts text to uppercase',
          'Converts text to a search vector with lexemes and positions',
          'Creates a table for vector data',
          'Calculates the length of each word',
        ],
        correct: 1,
      },
      {
        id: 'm7-q2',
        question: 'Which operator checks if a tsvector matches a tsquery?',
        options: ['==', '=', '@@', 'LIKE'],
        correct: 2,
      },
      {
        id: 'm7-q3',
        question: 'What does the & operator mean in a tsquery?',
        options: ['AND (both terms must appear)', 'OR (either term can appear)', 'NOT (term should not appear)', 'FOLLOWED BY (terms in order)'],
        correct: 0,
      },
      {
        id: 'm7-q4',
        question: 'Which function ranks search results by relevance?',
        options: ['ts_rank', 'ts_score', 'ts_order', 'ts_sort'],
        correct: 0,
      },
      {
        id: 'm7-q5',
        question: 'What index type is recommended for full-text search?',
        options: ['B-tree', 'GiST', 'GIN', 'BRIN'],
        correct: 2,
      },
    ],
  },

  // ─── Module 8: Transactions & MVCC ───
  {
    id: 'mod-8',
    title: 'Transactions & MVCC',
    lessons: [
      {
        id: 'm8-l1',
        title: 'Transactions, COMMIT, ROLLBACK & SAVEPOINT',
        objectives: [
          'Understand what transactions are and why they matter',
          'Master BEGIN, COMMIT, ROLLBACK, and SAVEPOINT',
          'Learn how transactions protect data consistency',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Transactions — All or Nothing</h2>
            <p>A <strong>transaction</strong> groups multiple operations into a single unit of work. Either <strong>all</strong> operations succeed (COMMIT) or <strong>none</strong> of them take effect (ROLLBACK).</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Real-World Analogy:</strong> A bank transfer debits one account and credits another. If the debit succeeds but the credit fails, money disappears! A transaction ensures both succeed or both fail.</p>
            </div>

            <h3>Transaction Control Commands</h3>
            <pre><code>-- Start a transaction
BEGIN;

-- Perform operations
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If everything looks good, save changes
COMMIT;

-- Or if something went wrong, undo everything
ROLLBACK;</code></pre>

            <h3>SAVEPOINT — Partial Rollbacks</h3>
            <p>SAVEPOINT is like a <strong>save point in a video game</strong> — you can roll back to a specific point without undoing everything:</p>
            <pre><code>BEGIN;
UPDATE users SET name = 'Alice' WHERE id = 1;
SAVEPOINT my_save;

UPDATE users SET name = 'Wrong Name' WHERE id = 2;
-- Oops, that was wrong!
ROLLBACK TO SAVEPOINT my_save;
-- User 2's name is restored, user 1's change is kept

COMMIT;</code></pre>

            <h3>Auto-Commit Mode</h3>
            <p>By default, PostgreSQL runs in <strong>auto-commit</strong> mode — each statement is its own transaction. Use explicit <code>BEGIN</code> to group multiple statements.</p>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Important:</strong> DDL statements (CREATE TABLE, ALTER TABLE, etc.) in PostgreSQL are <strong>transactional</strong> — they can be rolled back! This is different from many other databases where DDL auto-commits.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>BEGIN starts a transaction; COMMIT saves changes; ROLLBACK undoes them</li>
              <li>Transactions ensure atomicity — all operations succeed or all are rolled back</li>
              <li>SAVEPOINT allows partial rollbacks within a transaction</li>
              <li>ROLLBACK TO SAVEPOINT undoes changes since the savepoint</li>
              <li>PostgreSQL DDL statements are transactional (can be rolled back)</li>
              <li>Auto-commit wraps each statement in its own implicit transaction</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce checkout: reserve inventory, charge payment, create order — all in one transaction. If payment fails, inventory is released.</p>
          </div>
        `,
        defaultCode: "-- Transaction demo\nBEGIN;\n\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\n\n-- Check balances (in the simulator, these don't persist)\nSELECT * FROM accounts;\n\nCOMMIT;\n-- Or ROLLBACK to undo;",
        expectedKeyword: 'BEGIN',
        expectedTable: 'accounts',
      },
      {
        id: 'm8-l2',
        title: 'MVCC, Isolation Levels & Concurrency',
        objectives: [
          'Understand MVCC (Multi-Version Concurrency Control)',
          'Learn the four transaction isolation levels',
          'Understand read phenomena: dirty reads, non-repeatable reads, phantom reads',
        ],
        content: `
          <div class="lesson-prose">
            <h2>MVCC — PostgreSQL\'s Superpower</h2>
            <p><strong>MVCC</strong> (Multi-Version Concurrency Control) is PostgreSQL's secret sauce. It allows multiple transactions to see <strong>different versions</strong> of the same data at the same time. Readers never block writers, and writers never block readers!</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Time Machine Analogy:</strong> MVCC is like a time machine. When you start a transaction, PostgreSQL takes a "snapshot" of the data. Your transaction sees the data as it was at that moment, even if other transactions modify it. Each transaction lives in its own "time bubble."</p>
            </div>

            <h3>Transaction Isolation Levels</h3>
            <p>PostgreSQL offers four isolation levels — rules that determine what "weird things" can happen:</p>
            <pre><code>-- Set isolation level for a transaction
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- ... queries ...
COMMIT;</code></pre>

            <table class="sql-data-grid">
              <thead>
                <tr><th>Isolation Level</th><th>Dirty Read</th><th>Non-Repeatable Read</th><th>Phantom Read</th></tr>
              </thead>
              <tbody>
                <tr><td>Read Uncommitted</td><td>Possible</td><td>Possible</td><td>Possible</td></tr>
                <tr><td>Read Committed (default)</td><td>Not possible</td><td>Possible</td><td>Possible</td></tr>
                <tr><td>Repeatable Read</td><td>Not possible</td><td>Not possible</td><td>Possible</td></tr>
                <tr><td>Serializable</td><td>Not possible</td><td>Not possible</td><td>Not possible</td></tr>
              </tbody>
            </table>

            <h3>Read Phenomena Explained</h3>
            <ul>
              <li><strong>Dirty Read</strong> — Reading data written by an uncommitted transaction. PostgreSQL prevents this at all levels.</li>
              <li><strong>Non-Repeatable Read</strong> — Reading the same row twice and getting different values (because another transaction committed an update between the reads).</li>
              <li><strong>Phantom Read</strong> — A query returns different sets of rows at different times (because another transaction inserted/deleted rows between reads).</li>
            </ul>

            <p><strong>Read Committed</strong> (the default) is suitable for most applications. Use <strong>Repeatable Read</strong> or <strong>Serializable</strong> only when you need strict consistency guarantees.</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>MVCC allows multiple versions of data to exist simultaneously</li>
              <li>Readers never block writers; writers never block readers</li>
              <li>Read Committed (default) — prevents dirty reads, allows non-repeatable reads</li>
              <li>Repeatable Read — also prevents non-repeatable reads</li>
              <li>Serializable — the strictest level, prevents all read phenomena</li>
              <li>Higher isolation = better consistency but potentially lower concurrency</li>
            </ul>
            <p><strong>Real-world use:</strong> Financial systems use Repeatable Read or Serializable for account balance operations. Most web apps are fine with the default Read Committed.</p>
          </div>
        `,
        defaultCode: "-- Check current transaction isolation level\nSHOW transaction_isolation;\n\n-- Set isolation level for a transaction\nBEGIN;\nSET TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT * FROM accounts WHERE id = 1;\nCOMMIT;",
        expectedKeyword: 'ISOLATION',
        expectedTable: 'accounts',
      },
    ],
    quiz: [
      {
        id: 'm8-q1',
        question: 'What does COMMIT do in a transaction?',
        options: [
          'Undoes all changes since BEGIN',
          'Permanently saves all changes made in the current transaction',
          'Pauses the transaction',
          'Creates a savepoint',
        ],
        correct: 1,
      },
      {
        id: 'm8-q2',
        question: 'What is MVCC in PostgreSQL?',
        options: [
          'A backup method',
          'Multi-Version Concurrency Control — allows multiple data versions simultaneously',
          'A type of index',
          'A query optimization technique',
        ],
        correct: 1,
      },
      {
        id: 'm8-q3',
        question: 'What is PostgreSQL\'s default isolation level?',
        options: ['Serializable', 'Repeatable Read', 'Read Committed', 'Read Uncommitted'],
        correct: 2,
      },
      {
        id: 'm8-q4',
        question: 'What does a SAVEPOINT allow you to do?',
        options: [
          'Permanently save the transaction',
          'Roll back part of a transaction without undoing everything',
          'Save a query result to a table',
          'Pause the transaction for a specified time',
        ],
        correct: 1,
      },
      {
        id: 'm8-q5',
        question: 'What is a "non-repeatable read"?',
        options: [
          'Reading a row that doesn\'t exist',
          'Getting different values when reading the same row twice in the same transaction',
          'Reading data that was never committed',
          'A query that returns no results',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 9: Views & Materialized Views ───
  {
    id: 'mod-9',
    title: 'Views & Materialized Views',
    lessons: [
      {
        id: 'm9-l1',
        title: 'Creating & Using Views',
        objectives: [
          'Understand what views are and how they simplify complex queries',
          'Learn CREATE VIEW and how to query views like tables',
          'Understand updatable views and their limitations',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Views — Saved Queries That Look Like Tables</h2>
            <p>A <strong>view</strong> is a saved SQL query that you can query like a table. It doesn't store data itself — it's like a <strong>window</strong> through which you see the underlying data.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 TV Channel Analogy:</strong> A view is like a TV channel. The channel doesn't create shows — it selects shows from different sources and presents them. When you turn to the "Sports Channel", you see sports content from various networks.</p>
            </div>

            <h3>Creating a View</h3>
            <pre><code>CREATE VIEW user_order_summary AS
SELECT
  u.id,
  u.name,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.amount), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;

-- Now query it like a regular table!
SELECT * FROM user_order_summary;
SELECT * FROM user_order_summary WHERE total_spent > 200;</code></pre>

            <h3>Why Views Are Useful</h3>
            <ul>
              <li><strong>Simplify complex queries</strong> — Hide joins and aggregations behind simple names</li>
              <li><strong>Add security</strong> — Grant access to a view that only shows certain columns (hide salaries!)</li>
              <li><strong>Provide consistency</strong> — Everyone uses the same definition of "active user"</li>
              <li><strong>Create compatibility</strong> — Rename or restructure tables without breaking applications (use views as shims)</li>
            </ul>

            <h3>Updatable Views</h3>
            <p>Simple views (one table, no aggregates) can be updated directly:</p>
            <pre><code>CREATE VIEW active_users AS SELECT * FROM users WHERE is_active = true;
INSERT INTO active_users (name, email) VALUES ('New', 'new@example.com');
-- This inserts into the underlying users table!</code></pre>

            <p>To drop a view: <code>DROP VIEW IF EXISTS user_order_summary;</code></p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>A view is a saved SELECT query that behaves like a virtual table</li>
              <li>Views don't store data — they reference the underlying tables</li>
              <li>Views simplify complex queries, enhance security, and ensure consistency</li>
              <li>Simple views on one table can be INSERT/UPDATE/DELETE-able</li>
              <li>DROP VIEW removes a view without affecting underlying data</li>
              <li>CREATE OR REPLACE VIEW updates a view definition without dropping it</li>
            </ul>
            <p><strong>Real-world use:</strong> A "monthly sales report" view hides complex JOINs and aggregations. Analysts just run SELECT * FROM monthly_sales_report.</p>
          </div>
        `,
        defaultCode: "-- Create a view\nCREATE VIEW user_spending AS\nSELECT u.name, COUNT(o.id) AS orders, SUM(o.amount) AS total\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.name;\n\n-- Query the view\nSELECT * FROM user_spending;\n\nSELECT * FROM user_spending WHERE orders > 0;",
        expectedKeyword: 'VIEW',
        expectedTable: 'user_spending',
      },
      {
        id: 'm9-l2',
        title: 'Materialized Views',
        objectives: [
          'Understand materialized views and how they differ from regular views',
          'Learn CREATE MATERIALIZED VIEW and REFRESH MATERIALIZED VIEW',
          'Know when to use materialized views vs. regular views',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Materialized Views — Snapshots of Your Data</h2>
            <p>A <strong>materialized view</strong> actually <strong>stores the query result</strong> on disk. Unlike a regular view (which runs the query every time), a materialized view is like a <strong>photograph</strong> of your data at a point in time.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Photograph vs. Live Feed:</strong> Regular views are like live video — always up-to-date but expensive to compute. Materialized views are like printed photos — instantly available but potentially outdated.</p>
            </div>

            <h3>Creating and Using a Materialized View</h3>
            <pre><code>CREATE MATERIALIZED VIEW monthly_sales AS
SELECT
  DATE_TRUNC('month', order_date) AS month,
  COUNT(*) AS order_count,
  SUM(amount) AS revenue
FROM orders
GROUP BY 1
ORDER BY 1;

-- Query it like a regular table
SELECT * FROM monthly_sales;

-- Refresh it to get new data
REFRESH MATERIALIZED VIEW monthly_sales;</code></pre>

            <h3>When to Use Each Type</h3>
            <table class="sql-data-grid">
              <thead>
                <tr><th>Regular View</th><th>Materialized View</th></tr>
              </thead>
              <tbody>
                <tr><td>Always up-to-date</td><td>Requires manual refresh</td></tr>
                <tr><td>Runs query each time (slower)</td><td>Returns stored data instantly (fast)</td></tr>
                <tr><td>No storage overhead</td><td>Uses disk space for stored results</td></tr>
                <tr><td>Best for real-time needs</td><td>Best for expensive aggregations</td></tr>
                <tr><td>Simple queries, frequent access</td><td>Complex queries, infrequent changes</td></tr>
              </tbody>
            </table>

            <h3>Indexing Materialized Views</h3>
            <p>Since materialized views are physical tables, you can create indexes on them:</p>
            <pre><code>CREATE INDEX idx_monthly_revenue ON monthly_sales(revenue DESC);</code></pre>

            <p><strong>Concurrent refresh</strong> (PostgreSQL 9.4+): <code>REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;</code> — allows querying the old data while the refresh happens (requires a unique index on the materialized view).</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Materialized views store query results on disk for fast access</li>
              <li>REFRESH MATERIALIZED VIEW updates the stored data</li>
              <li>Use regular views for real-time data; materialized views for expensive queries</li>
              <li>Materialized views can have indexes for even faster queries</li>
              <li>REFRESH MATERIALIZED VIEW CONCURRENTLY allows reads during refresh</li>
              <li>Trade-off: speed vs. freshness — choose based on your needs</li>
            </ul>
            <p><strong>Real-world use:</strong> A dashboard showing "monthly revenue for the past 5 years" uses a materialized view refreshed nightly. The dashboard loads instantly.</p>
          </div>
        `,
        defaultCode: "-- Create a materialized view\nCREATE MATERIALIZED VIEW user_stats AS\nSELECT u.name, COUNT(o.id) AS order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.name;\n\n-- Query the materialized view\nSELECT * FROM user_stats;\n\n-- Refresh (doesn't persist in the simulator, but the syntax is correct)\n-- REFRESH MATERIALIZED VIEW user_stats;",
        expectedKeyword: 'MATERIALIZED',
        expectedTable: 'user_stats',
      },
    ],
    quiz: [
      {
        id: 'm9-q1',
        question: 'What is the main difference between a regular view and a materialized view?',
        options: [
          'Regular views are faster',
          'Materialized views store data physically; regular views run the query each time',
          'Regular views store data; materialized views run the query each time',
          'There is no difference',
        ],
        correct: 1,
      },
      {
        id: 'm9-q2',
        question: 'How do you update the data in a materialized view?',
        options: [
          'INSERT INTO materialized_view',
          'REFRESH MATERIALIZED VIEW',
          'UPDATE materialized_view',
          'ALTER MATERIALIZED VIEW',
        ],
        correct: 1,
      },
      {
        id: 'm9-q3',
        question: 'Which statement removes a view?',
        options: ['DELETE VIEW', 'DROP VIEW', 'REMOVE VIEW', 'ALTER VIEW'],
        correct: 1,
      },
      {
        id: 'm9-q4',
        question: 'Can you create indexes on materialized views?',
        options: [
          'No, materialized views cannot have indexes',
          'Yes, because they store data physically like regular tables',
          'Only if the original table has the same index',
          'Only unique indexes are allowed',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 10: Triggers & PL/pgSQL ───
  {
    id: 'mod-10',
    title: 'Triggers & PL/pgSQL',
    lessons: [
      {
        id: 'm10-l1',
        title: 'Triggers — Automated Database Actions',
        objectives: [
          'Understand what triggers are and when to use them',
          'Learn BEFORE/AFTER and FOR EACH ROW/STATEMENT trigger variations',
          'Create triggers for audit logging and data validation',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Triggers — Robot Assistants for Your Data</h2>
            <p>A <strong>trigger</strong> is a function that automatically runs when a specific event occurs on a table. Think of it as a <strong>robot assistant</strong> that watches your database and takes action when needed.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Analogy:</strong> Setting up a trigger is like putting an automatic email reply: "When I receive an email (event), automatically send a reply (action)." You set it up once, and it works forever.</p>
            </div>

            <h3>Trigger Events and Timing</h3>
            <pre><code>-- Trigger function (must return trigger)
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log(table_name, record_id, action, changed_at)
  VALUES ('users', NEW.id, TG_OP, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trg_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_changes();</code></pre>

            <h3>Trigger Types</h3>
            <ul>
              <li><strong>BEFORE trigger</strong> — Runs before the operation. Use for validation or modifying values before insert.</li>
              <li><strong>AFTER trigger</strong> — Runs after the operation. Use for logging, cascading actions.</li>
              <li><strong>INSTEAD OF trigger</strong> — Replaces the operation entirely. Use on views.</li>
              <li><strong>FOR EACH ROW</strong> — Runs once per affected row (can see OLD and NEW values)</li>
              <li><strong>FOR EACH STATEMENT</strong> — Runs once per SQL statement, regardless of row count</li>
            </ul>

            <h3>OLD and NEW Pseudorecords</h3>
            <p>Triggers have access to the row data:</p>
            <ul>
              <li><strong>OLD</strong> — The row before the change (UPDATE and DELETE)</li>
              <li><strong>NEW</strong> — The row after the change (INSERT and UPDATE)</li>
              <li><strong>TG_OP</strong> — The operation name: INSERT, UPDATE, or DELETE</li>
            </ul>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Triggers automatically execute functions on INSERT, UPDATE, or DELETE</li>
              <li>BEFORE triggers run before the operation; AFTER triggers run after</li>
              <li>FOR EACH ROW runs per affected row; FOR EACH STATEMENT runs once per SQL</li>
              <li>OLD contains the row before change; NEW contains the row after change</li>
              <li>TG_OP tells the trigger function which operation triggered it</li>
              <li>Use triggers for auditing, validation, and maintaining derived data</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce sites use triggers to automatically update product stock counts when orders are placed.</p>
          </div>
        `,
        defaultCode: "-- Trigger function (simulated)\nCREATE OR REPLACE FUNCTION log_changes()\nRETURNS TRIGGER AS $$\nBEGIN\n  RAISE NOTICE 'Trigger fired: % on users table', TG_OP;\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n\n-- Drop if exists, then create trigger\nDROP TRIGGER IF EXISTS trg_log ON users;\nCREATE TRIGGER trg_log\n  AFTER INSERT OR UPDATE ON users\n  FOR EACH ROW\n  EXECUTE FUNCTION log_changes();",
        expectedKeyword: 'TRIGGER',
        expectedTable: 'users',
      },
      {
        id: 'm10-l2',
        title: 'PL/pgSQL Functions & Procedures',
        objectives: [
          'Understand PL/pgSQL as PostgreSQL\'s built-in programming language',
          'Differentiate functions (returns value) from procedures (no return)',
          'Write stored functions with variables, conditionals, and loops',
        ],
        content: `
          <div class="lesson-prose">
            <h2>PL/pgSQL — Programming Inside the Database</h2>
            <p><strong>PL/pgSQL</strong> is PostgreSQL's built-in procedural language. While SQL is declarative (you say WHAT you want), PL/pgSQL is imperative (you say HOW to do it).</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Analogy:</strong> SQL is like giving a command ("Bring me that book"). PL/pgSQL is like giving instructions ("Go to the library, find the science section, look for the red book on the third shelf, and bring it to me").</p>
            </div>

            <h3>Functions vs. Procedures</h3>
            <pre><code>-- FUNCTION: returns a value, can be used in SELECT
CREATE OR REPLACE FUNCTION get_user_order_count(user_id INT)
RETURNS INT AS $$
DECLARE
  count_val INT;
BEGIN
  SELECT COUNT(*) INTO count_val
  FROM orders WHERE user_id = $1;
  RETURN count_val;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT get_user_order_count(1);

-- PROCEDURE: no return, uses CALL
CREATE OR REPLACE PROCEDURE update_user_email(
  user_id INT,
  new_email TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET email = new_email WHERE id = user_id;
  COMMIT;
END;
$$;

-- Usage
CALL update_user_email(1, 'new@example.com');</code></pre>

            <h3>PL/pgSQL Features</h3>
            <pre><code>CREATE OR REPLACE FUNCTION calculate_discount(
  amount DECIMAL,
  customer_tier TEXT DEFAULT 'regular'
)
RETURNS DECIMAL AS $$
DECLARE
  discount_rate DECIMAL;
  final_amount DECIMAL;
BEGIN
  -- Conditional logic
  IF customer_tier = 'gold' THEN
    discount_rate := 0.20;
  ELSIF customer_tier = 'silver' THEN
    discount_rate := 0.10;
  ELSE
    discount_rate := 0.05;
  END IF;

  final_amount := amount * (1 - discount_rate);
  RETURN final_amount;
END;
$$ LANGUAGE plpgsql;</code></pre>

            <h3>Best Practices</h3>
            <ul>
              <li>Use functions for computations and data retrieval</li>
              <li>Use procedures for complex operations with multiple DML statements</li>
              <li>Keep functions focused — one function, one responsibility</li>
              <li>Use appropriate exception handling (BEGIN ... EXCEPTION ... END)</li>
              <li>Document parameters and return types clearly</li>
            </ul>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>PL/pgSQL is PostgreSQL's procedural language for stored logic</li>
              <li>Functions return a value and can be used in SELECT queries</li>
              <li>Procedures do not return a value and are called with CALL</li>
              <li>DECLARE defines variables; IF/THEN/ELSE provides conditional logic</li>
              <li>Default parameter values make functions flexible</li>
              <li>Use functions for computations; procedures for multi-step operations</li>
            </ul>
            <p><strong>Real-world use:</strong> A billing system uses a stored function to calculate taxes based on product category, customer location, and applicable discounts — all inside the database.</p>
          </div>
        `,
        defaultCode: "-- Create a function that calculates total for a user\nCREATE OR REPLACE FUNCTION total_spent(user_id INT)\nRETURNS DECIMAL AS $$\nDECLARE\n  total DECIMAL;\nBEGIN\n  SELECT COALESCE(SUM(amount), 0) INTO total\n  FROM orders WHERE orders.user_id = $1;\n  RETURN total;\nEND;\n$$ LANGUAGE plpgsql;\n\n-- Use the function\nSELECT total_spent(1);\nSELECT total_spent(2);",
        expectedKeyword: 'FUNCTION',
        expectedTable: 'orders',
      },
    ],
    quiz: [
      {
        id: 'm10-q1',
        question: 'What is a trigger in PostgreSQL?',
        options: [
          'A type of index for speeding up queries',
          'A function that automatically runs when a table event occurs',
          'A backup schedule',
          'A user-defined data type',
        ],
        correct: 1,
      },
      {
        id: 'm10-q2',
        question: 'What does TG_OP represent in a trigger function?',
        options: [
          'The table name that triggered the function',
          'The operation that triggered the function (INSERT, UPDATE, DELETE)',
          'The time the trigger was created',
          'The number of rows affected',
        ],
        correct: 1,
      },
      {
        id: 'm10-q3',
        question: 'What is the difference between a FUNCTION and a PROCEDURE in PL/pgSQL?',
        options: [
          'Functions are faster than procedures',
          'Functions return a value; procedures do not',
          'Procedures can only be used in SELECT',
          'There is no difference',
        ],
        correct: 1,
      },
      {
        id: 'm10-q4',
        question: 'What does OLD represent in a trigger?',
        options: [
          'The table structure before any changes',
          'The row values before the triggering operation (for UPDATE/DELETE)',
          'The old version of the database',
          'A deprecated trigger function',
        ],
        correct: 1,
      },
      {
        id: 'm10-q5',
        question: 'Which trigger type completely replaces the original operation?',
        options: ['BEFORE trigger', 'AFTER trigger', 'INSTEAD OF trigger', 'FOR EACH STATEMENT trigger'],
        correct: 2,
      },
    ],
  },

  // ─── Module 11: EXPLAIN ANALYZE & Query Tuning ───
  {
    id: 'mod-11',
    title: 'EXPLAIN ANALYZE & Query Tuning',
    lessons: [
      {
        id: 'm11-l1',
        title: 'Reading EXPLAIN ANALYZE Output',
        objectives: [
          'Understand how to use EXPLAIN and EXPLAIN ANALYZE',
          'Read and interpret query plan output',
          'Identify sequential scans, index scans, and join types',
        ],
        content: `
          <div class="lesson-prose">
            <h2>EXPLAIN ANALYZE — Peeking Under the Hood</h2>
            <p><code>EXPLAIN ANALYZE</code> shows you <strong>how PostgreSQL executes a query</strong> and how long each step takes. It's like a GPS that shows your route and actual travel time!</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Two Parts:</strong> <code>EXPLAIN</code> shows the query plan (estimated). <code>EXPLAIN ANALYZE</code> actually runs the query and shows real timings. Use ANALYZE when you want accurate measurements!</p>
            </div>

            <h3>Basic EXPLAIN Output</h3>
            <pre><code>EXPLAIN ANALYZE SELECT * FROM users WHERE id = 1;

-- Output might look like:
-- Index Scan using users_pkey on users  (cost=0.15..8.17 rows=1 width=36)
--   Index Cond: (id = 1)
--   Planning Time: 0.052 ms
--   Execution Time: 0.023 ms</code></pre>

            <h3>What Each Part Means</h3>
            <ul>
              <li><strong>Scan Type</strong>: Seq Scan (full table scan), Index Scan (uses index), Bitmap Heap Scan (uses bitmap)</li>
              <li><strong>cost=0.15..8.17</strong>: Estimated "effort" — first number is startup cost, second is total cost</li>
              <li><strong>rows=1</strong>: Estimated number of rows returned</li>
              <li><strong>width=36</strong>: Average width of each row in bytes</li>
              <li><strong>actual time=0.015..0.023</strong>: Actual startup and total time in milliseconds (ANALYZE only)</li>
              <li><strong>Planning Time</strong>: Time spent creating the query plan</li>
              <li><strong>Execution Time</strong>: Time spent actually executing the query</li>
            </ul>

            <h3>Common Scan Types</h3>
            <pre><code>-- Sequential Scan (slow on large tables) — reads every row
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@test.com';

-- Index Scan (fast) — uses an index to find rows
-- After creating: CREATE INDEX ON users(email);
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@test.com';</code></pre>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Note:</strong> A Seq Scan isn't always bad! On small tables, it's often faster than an Index Scan due to overhead. The query planner usually makes good decisions.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>EXPLAIN shows the query plan; EXPLAIN ANALYZE runs it and shows actual timings</li>
              <li>Seq Scan = full table read (slow on big tables)</li>
              <li>Index Scan = uses an index for targeted reads (fast)</li>
              <li>cost shows estimated effort; actual time shows real performance</li>
              <li>Planning time is separate from execution time</li>
              <li>Always check EXPLAIN ANALYZE before optimizing — don't guess!</li>
            </ul>
            <p><strong>Real-world use:</strong> When a page loads slowly, DBAs run EXPLAIN ANALYZE on the queries to find the bottleneck. Often it's a missing index causing sequential scans.</p>
          </div>
        `,
        defaultCode: "-- EXPLAIN a simple query\nEXPLAIN ANALYZE SELECT * FROM users WHERE id = 1;\n\n-- EXPLAIN without ANALYZE (just the plan)\nEXPLAIN SELECT * FROM users WHERE name LIKE 'A%';",
        expectedKeyword: 'EXPLAIN',
        expectedTable: 'users',
      },
      {
        id: 'm11-l2',
        title: 'Query Optimization Techniques',
        objectives: [
          'Learn practical query optimization strategies',
          'Understand VACUUM, ANALYZE, and their role in performance',
          'Master common patterns for faster queries',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Making Queries Faster</h2>

            <h3>1. Use Indexes Wisely</h3>
            <p>Indexes are the #1 performance tool. Create them on columns used in WHERE, JOIN, and ORDER BY:</p>
            <pre><code>-- Good candidates for indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);      -- JOIN column
CREATE INDEX idx_orders_status ON orders(status);          -- WHERE column
CREATE INDEX idx_orders_created ON orders(created_at);     -- ORDER BY column

-- Composite index for queries that filter on both columns
CREATE INDEX idx_orders_user_status ON orders(user_id, status);</code></pre>

            <h3>2. Use Covering Indexes</h3>
            <p>An index that contains ALL columns your query needs. PostgreSQL never touches the table:</p>
            <pre><code>-- If you always select just status and amount for user_id
CREATE INDEX idx_orders_covering ON orders(user_id) INCLUDE (status, amount);</code></pre>

            <h3>3. VACUUM and ANALYZE</h3>
            <p>PostgreSQL's <strong>VACUUM</strong> is like cleaning your room so you can find things faster:</p>
            <pre><code>-- Reclaim storage from dead rows
VACUUM;

-- Update statistics for the query planner
ANALYZE;

-- Do both
VACUUM ANALYZE;</code></pre>
            <p>PostgreSQL runs autovacuum automatically, but for heavily modified tables, manual vacuum may help.</p>

            <h3>4. Query Writing Best Practices</h3>
            <ul>
              <li><strong>Avoid SELECT *</strong> in production — only select needed columns</li>
              <li><strong>Use LIMIT</strong> when you only need a sample of results</li>
              <li><strong>Use EXISTS</strong> instead of COUNT(*) > 0 to check for existence</li>
              <li><strong>Avoid functions in WHERE</strong> on indexed columns: <code>WHERE DATE(created_at) = '2024-01-01'</code> can't use an index on created_at</li>
              <li><strong>Use UNION ALL</strong> instead of UNION when duplicates don't matter (UNION ALL is faster)</li>
            </ul>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Golden Rule:</strong> <strong>Measure before optimizing!</strong> What seems slow might be fast enough. Don't add complexity for marginal gains. Run EXPLAIN ANALYZE, identify the bottleneck, then fix it.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Create indexes on WHERE, JOIN, and ORDER BY columns</li>
              <li>Use covering indexes (INCLUDE) for frequently accessed columns</li>
              <li>VACUUM reclaims storage; ANALYZE updates query planner statistics</li>
              <li>Avoid SELECT *, use LIMIT, prefer EXISTS over COUNT checks</li>
              <li>Avoid wrapping indexed columns in functions in WHERE clauses</li>
              <li>Always measure with EXPLAIN ANALYZE before optimizing</li>
            </ul>
            <p><strong>Real-world use:</strong> A social media feed query went from 3 seconds to 5ms by adding a composite index on (user_id, created_at) — the most common query pattern.</p>
          </div>
        `,
        defaultCode: "-- Check table statistics\nSELECT relname, seq_scan, seq_tup_read, idx_scan\nFROM pg_stat_user_tables\nWHERE relname = 'orders';\n\n-- Check query plan\nEXPLAIN ANALYZE SELECT user_id, COUNT(*)\nFROM orders\nWHERE amount > 50\nGROUP BY user_id;",
        expectedKeyword: 'VACUUM',
        expectedTable: 'orders',
      },
    ],
    quiz: [
      {
        id: 'm11-q1',
        question: 'What does EXPLAIN ANALYZE show you?',
        options: [
          'Only the query result',
          'The query execution plan with actual timing information',
          'An error message if the query is wrong',
          'The size of the table',
        ],
        correct: 1,
      },
      {
        id: 'm11-q2',
        question: 'What does a Sequential Scan (Seq Scan) indicate?',
        options: [
          'The query is running in sequence order',
          'PostgreSQL is reading every row in the table (no index used)',
          'The query is using an index for fast lookup',
          'The query encountered an error',
        ],
        correct: 1,
      },
      {
        id: 'm11-q3',
        question: 'What does ANALYZE do in PostgreSQL?',
        options: [
          'Removes dead rows from tables',
          'Updates table statistics for the query planner',
          'Creates new indexes on all columns',
          'Backs up the database',
        ],
        correct: 1,
      },
      {
        id: 'm11-q4',
        question: 'What is a covering index?',
        options: [
          'An index that covers the entire table',
          'An index that contains all columns needed by a query, avoiding table access',
          'An index that covers multiple tables',
          'An index that automatically creates backups',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 12: Roles & Permissions ───
  {
    id: 'mod-12',
    title: 'Roles & Permissions',
    lessons: [
      {
        id: 'm12-l1',
        title: 'Roles, Users & Privileges',
        objectives: [
          'Understand PostgreSQL role-based access control model',
          'Learn to create roles, grant/revoke privileges',
          'Understand the difference between login roles and group roles',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Who Can Do What? — PostgreSQL Security</h2>
            <p>PostgreSQL uses a <strong>role-based</strong> access control system. A <strong>role</strong> can be a user (someone who logs in) or a group (a set of permissions that other roles inherit).</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Building Badge Analogy:</strong> Roles are like security badges. A login role is an individual badge for a person. A group role is a department badge that defines what "Engineering" can access. People inherit department permissions through group membership.</p>
            </div>

            <h3>Creating Roles</h3>
            <pre><code>-- Create a login role (a user)
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';

-- Create a group role (for permissions)
CREATE ROLE read_only_access;

-- Add user to the group
GRANT read_only_access TO app_user;

-- Create a superuser (full access)
CREATE ROLE admin WITH LOGIN SUPERUSER PASSWORD 'admin_pass';</code></pre>

            <h3>Granting Privileges</h3>
            <pre><code>-- Grant connection access
GRANT CONNECT ON DATABASE mydb TO app_user;

-- Grant schema access
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant table-level permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_user;

-- Grant more permissions
GRANT SELECT, INSERT, UPDATE ON orders TO app_user;

-- Grant column-level permissions (hide salary!)
GRANT SELECT (id, name, email) ON employees TO app_user;</code></pre>

            <h3>Revoking Privileges</h3>
            <pre><code>REVOKE DELETE ON orders FROM app_user;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM read_only_access;</code></pre>

            <h3>Default Privileges</h3>
            <p>Set privileges for FUTURE objects created by a user:</p>
            <pre><code>ALTER DEFAULT PRIVILEGES FOR ROLE admin
  GRANT SELECT ON TABLES TO read_only_access;</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Roles can be login roles (users) or group roles (permission sets)</li>
              <li>GRANT adds privileges; REVOKE removes them</li>
              <li>Privileges at different levels: DATABASE, SCHEMA, TABLE, COLUMN</li>
              <li>Group roles simplify permission management — assign permissions once, add users to group</li>
              <li>ALTER DEFAULT PRIVILEGES sets permissions for future objects</li>
              <li>Least privilege principle: grant only what's needed, nothing more</li>
            </ul>
            <p><strong>Real-world use:</strong> A reporting application uses a read-only role that can only SELECT from specific tables. Application users get INSERT/UPDATE on their own data only.</p>
          </div>
        `,
        defaultCode: "-- Create roles (simulated — actual execution requires superuser)\nCREATE ROLE readonly WITH LOGIN PASSWORD 'read_pass';\nGRANT CONNECT ON DATABASE postgres TO readonly;\nGRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;\n\n-- Show current user\nSELECT current_user, current_database();\n\n-- Show available roles\nSELECT rolname FROM pg_roles WHERE rolname NOT LIKE 'pg_%' LIMIT 10;",
        expectedKeyword: 'ROLE',
        expectedTable: 'roles',
      },
      {
        id: 'm12-l2',
        title: 'Row-Level Security (RLS)',
        objectives: [
          'Understand Row-Level Security and its use cases',
          'Learn to create RLS policies for fine-grained access control',
          'Understand how RLS works with Supabase',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Row-Level Security — Per-Row Access Control</h2>
            <p><strong>RLS</strong> (Row-Level Security) restricts which rows a user can see or modify based on a policy expression. Normal GRANT permissions are at the table level; RLS adds <strong>row-level</strong> filtering.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 VIP List Analogy:</strong> GRANT says "you can enter the club." RLS says "you can only sit at these specific tables." Both are needed for fine-grained security.</p>
            </div>

            <h3>Enabling RLS</h3>
            <pre><code>CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  owner_id INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT false
);

-- Enable RLS on the table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;</code></pre>

            <h3>Creating RLS Policies</h3>
            <pre><code>-- Policy: users can see only their own documents
CREATE POLICY user_documents ON documents
  FOR SELECT
  USING (owner_id = current_user_id());

-- Policy: users can insert their own documents
CREATE POLICY user_insert ON documents
  FOR INSERT
  WITH CHECK (owner_id = current_user_id());

-- Policy: anyone can see published documents
CREATE POLICY public_documents ON documents
  FOR SELECT
  USING (is_published = true);

-- Policy: different rules for different operations
CREATE POLICY user_all ON documents
  FOR ALL
  USING (owner_id = current_user_id())
  WITH CHECK (owner_id = current_user_id());</code></pre>

            <h3>RLS with Supabase</h3>
            <p>Supabase (a popular Firebase alternative built on PostgreSQL) uses RLS extensively. The <code>auth.uid()</code> function returns the current authenticated user:</p>
            <pre><code>-- Supabase RLS policy example
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);</code></pre>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Important:</strong> RLS is only active when enabled. By default, the table owner (and superusers) bypass RLS. Other users see ZERO rows until policies are created.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>RLS provides row-level access control beyond table-level GRANT permissions</li>
              <li>ENABLE ROW LEVEL SECURITY activates RLS on a table</li>
              <li>CREATE POLICY defines who can access which rows</li>
              <li>USING clause filters existing rows (SELECT, UPDATE, DELETE)</li>
              <li>WITH CHECK clause validates new/modified rows (INSERT, UPDATE)</li>
              <li>RLS is fundamental to Supabase's security model</li>
            </ul>
            <p><strong>Real-world use:</strong> A multi-tenant SaaS app uses RLS to ensure customers can only see their own data, even though all data shares the same tables.</p>
          </div>
        `,
        defaultCode: "-- Enable RLS (requires proper permissions)\nALTER TABLE users ENABLE ROW LEVEL SECURITY;\n\n-- Create policies\nCREATE POLICY user_self ON users\n  FOR ALL\n  USING (id = current_user_id());\n\n-- Check current RLS status\nSELECT relname, relrowsecurity\nFROM pg_class\nWHERE relname = 'users';",
        expectedKeyword: 'ROW',
        expectedTable: 'users',
      },
    ],
    quiz: [
      {
        id: 'm12-q1',
        question: 'What is a role in PostgreSQL?',
        options: [
          'A type of index',
          'An entity that can own database objects and have privileges',
          'A backup configuration',
          'A query optimization technique',
        ],
        correct: 1,
      },
      {
        id: 'm12-q2',
        question: 'What command grants privileges to a role?',
        options: ['ASSIGN', 'GRANT', 'ALLOW', 'PERMIT'],
        correct: 1,
      },
      {
        id: 'm12-q3',
        question: 'What does Row-Level Security (RLS) do?',
        options: [
          'Encrypts data at the row level',
          'Restricts which rows a user can access based on a policy',
          'Creates row-level backups',
          'Compresses individual rows',
        ],
        correct: 1,
      },
      {
        id: 'm12-q4',
        question: 'What does ENABLE ROW LEVEL SECURITY do?',
        options: [
          'Activates RLS for a specific user',
          'Activates RLS on a table',
          'Activates RLS on the entire database',
          'Disables all security policies',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 13: Backup & Restore ───
  {
    id: 'mod-13',
    title: 'Backup & Restore',
    lessons: [
      {
        id: 'm13-l1',
        title: 'pg_dump & pg_restore',
        objectives: [
          'Learn to backup databases with pg_dump',
          'Learn to restore databases with pg_restore',
          'Understand different backup formats and their trade-offs',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Backing Up and Restoring PostgreSQL Databases</h2>
            <p><strong>pg_dump</strong> creates a backup of a PostgreSQL database. Think of it as making a <strong>photocopy of your entire filing cabinet</strong> that you can restore later.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Always Back Up!</strong> Backups are like seat belts. You hope you never need them, but you'll be incredibly grateful to have them when something goes wrong.</p>
            </div>

            <h3>backup Formats</h3>
            <pre><code># Plain SQL format (human-readable, editable)
pg_dump mydb > mydb_backup.sql

# Custom format (compressed, can restore individual tables)
pg_dump -Fc mydb > mydb_backup.dump

# Directory format (multiple files, parallel)
pg_dump -Fd mydb -f /backup/mydb/

# Compressed plain SQL
pg_dump mydb | gzip > mydb_backup.sql.gz</code></pre>

            <h3>Restoring Backups</h3>
            <pre><code># Restore plain SQL backup
psql mydb < mydb_backup.sql

# Restore custom/directory format
pg_restore -d mydb mydb_backup.dump

# Restore specific tables
pg_restore -d mydb -t users -t orders mydb_backup.dump

# Create database first, then restore
createdb new_mydb
pg_restore -d new_mydb mydb_backup.dump</code></pre>

            <h3>Selective Backup</h3>
            <pre><code># Backup only specific tables
pg_dump -t users -t orders mydb > users_orders.sql

# Exclude specific tables
pg_dump -T logs -T temp_data mydb > no_logs.sql

# Backup only the schema (no data)
pg_dump --schema-only mydb > schema.sql

# Backup only the data (no schema)
pg_dump --data-only mydb > data.sql</code></pre>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Note:</strong> pg_dump runs in the terminal, not inside a SQL client. These commands are run from the command line, not from the SQL editor above!</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>pg_dump creates database backups; pg_restore restores them</li>
              <li>Plain SQL format (.sql) is human-readable, editable, but larger</li>
              <li>Custom format (.dump) is compressed, supports selective restore</li>
              <li>--schema-only backs up structure; --data-only backs up data</li>
              <li>-t flag backs up specific tables; -T excludes tables</li>
              <li>Always verify backups by restoring them to a test database!</li>
            </ul>
            <p><strong>Real-world use:</strong> Nightly cron jobs run pg_dump on production databases. Backups are copied to cloud storage (S3, GCS). Weekly restore tests verify backup integrity.</p>
          </div>
        `,
        defaultCode: "-- Backup commands (run in terminal, not SQL editor)\n-- pg_dump mydb > mydb_backup.sql\n-- pg_restore -d mydb mydb_backup.dump\n\n-- You can view backup metadata in SQL:\nSELECT schemaname, tablename, tableowner\nFROM pg_tables\nWHERE schemaname = 'public'\nORDER BY tablename;",
        expectedKeyword: 'pg_dump',
        expectedTable: 'pg_tables',
      },
      {
        id: 'm13-l2',
        title: 'Continuous Archiving & WAL',
        objectives: [
          'Understand the Write-Ahead Log (WAL) and its role in recovery',
          'Learn about Point-in-Time Recovery (PITR)',
          'Implement a continuous archiving strategy',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Continuous Archiving & Point-in-Time Recovery</h2>
            <p><strong>Continuous Archiving</strong> lets you restore a database to <strong>any point in time</strong>. While pg_dump is a photo album (snapshots), PITR is a video recording (continuous).</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 WAL Analogy:</strong> The Write-Ahead Log is like a <strong>diary</strong> that records every change before it happens. If the database crashes, PostgreSQL reads the diary (WAL) to replay any changes that weren't saved. By keeping a copy of the diary, you can replay to any moment.</p>
            </div>

            <h3>How WAL Works</h3>
            <p>Every change to PostgreSQL follows this sequence:</p>
            <ol>
              <li>Write change to WAL (the diary)</li>
              <li>Apply change to the actual data files</li>
              <li>Once written to data files, the WAL entry is no longer needed (but can be archived)</li>
            </ol>

            <h3>Setting Up Continuous Archiving</h3>
            <pre><code>-- In postgresql.conf (server config):
wal_level = replica                    # Write enough info for archiving
archive_mode = on                      # Enable archiving
archive_command = 'cp %p /backup/wal/%f'  # Copy WAL files to archive</code></pre>

            <h3>Point-in-Time Recovery Process</h3>
            <ol>
              <li>Take a full base backup: <code>pg_basebackup -D /backup/base</code></li>
              <li>Archive WAL files continuously as they fill up</li>
              <li>To restore to a specific time:</li>
            </ol>
            <pre><code># 1. Restore the base backup
# 2. Create a recovery.conf file with:
recovery_target_time = '2024-03-15 14:30:00'
restore_command = 'cp /backup/wal/%f %p'

# 3. Start PostgreSQL — it automatically replays WAL to the target time</code></pre>

            <h3>WAL Levels</h3>
            <ul>
              <li><strong>minimal</strong> — Minimum logging, no PITR possible</li>
              <li><strong>replica</strong> — Supports PITR and read replicas (default for current versions)</li>
              <li><strong>logical</strong> — Supports logical decoding and change data capture (CDC)</li>
            </ul>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Zero Data Loss:</strong> With synchronous replication and continuous WAL archiving, PostgreSQL can guarantee zero data loss even if the server crashes. This is why it's trusted for financial systems.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>WAL (Write-Ahead Log) records every change before it's applied</li>
              <li>Continuous archiving copies WAL files to a safe location</li>
              <li>PITR restores a database to any point in time</li>
              <li>pg_basebackup creates the base (full) backup</li>
              <li>recovery.conf specifies the target time and WAL archive location</li>
              <li>wal_level=replica enables PITR and streaming replication</li>
            </ul>
            <p><strong>Real-world use:</strong> A financial platform uses PITR to recover from an erroneous batch update. The DBA restores to "just before the bad transaction" — no data lost.</p>
          </div>
        `,
        defaultCode: "-- Check WAL settings\nSELECT name, setting, unit\nFROM pg_settings\nWHERE name IN ('wal_level', 'archive_mode', 'archive_command');\n\n-- Check current WAL info\nSELECT pg_walfile_name(pg_current_wal_lsn());\n\n-- List available backup files (if any)\nSELECT * FROM pg_stat_archiver;",
        expectedKeyword: 'WAL',
        expectedTable: 'pg_settings',
      },
    ],
    quiz: [
      {
        id: 'm13-q1',
        question: 'What does pg_dump do?',
        options: [
          'Creates a backup of a PostgreSQL database',
          'Optimizes query performance',
          'Creates new database users',
          'Defragments table storage',
        ],
        correct: 0,
      },
      {
        id: 'm13-q2',
        question: 'What is the Write-Ahead Log (WAL) used for?',
        options: [
          'Storing query results for caching',
          'Recording every change to the database for crash recovery',
          'Logging user login attempts',
          'Creating indexes automatically',
        ],
        correct: 1,
      },
      {
        id: 'm13-q3',
        question: 'What does PITR stand for?',
        options: ['PostgreSQL Index Tracing Routine', 'Point-in-Time Recovery', 'Periodic Index Table Rebuild', 'Primary Instance Transaction Replay'],
        correct: 1,
      },
      {
        id: 'm13-q4',
        question: 'Which pg_dump format allows restoring individual tables?',
        options: ['Plain SQL format', 'Custom format (-Fc)', 'Both formats allow this', 'Neither format allows this'],
        correct: 1,
      },
    ],
  },

  // ─── Module 14: Table Partitioning ───
  {
    id: 'mod-14',
    title: 'Table Partitioning',
    lessons: [
      {
        id: 'm14-l1',
        title: 'Range, List & Hash Partitioning',
        objectives: [
          'Understand what table partitioning is and why it\'s useful',
          'Learn the three partitioning methods: Range, List, Hash',
          'Know when to use partitioning for large tables',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Table Partitioning — Divide and Conquer</h2>
            <p><strong>Partitioning</strong> splits a large table into smaller physical pieces (partitions) while maintaining a single logical table. Queries that filter on the partition key automatically <strong>prune</strong> irrelevant partitions — much faster!</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Library Analogy:</strong> Instead of one giant room with ALL books (impossible to find anything!), a library organizes books into sections: Fiction, Non-fiction, Science. Each section is like a partition. When you look for "Science books," you only go to the Science section!</p>
            </div>

            <h3>Range Partitioning (Most Common)</h3>
            <p>Split by ranges — ideal for time-series data:</p>
            <pre><code>CREATE TABLE orders (
  id SERIAL,
  order_date DATE NOT NULL,
  amount DECIMAL,
  user_id INT
) PARTITION BY RANGE (order_date);

-- Create monthly partitions
CREATE TABLE orders_2024_q1 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

CREATE TABLE orders_default PARTITION OF orders DEFAULT;</code></pre>

            <h3>List Partitioning</h3>
            <p>Split by specific values — ideal for regional or categorical data:</p>
            <pre><code>CREATE TABLE sales (
  id SERIAL,
  region TEXT,
  amount DECIMAL
) PARTITION BY LIST (region);

CREATE TABLE sales_north PARTITION OF sales
  FOR VALUES IN ('North', 'Northeast', 'Northwest');

CREATE TABLE sales_south PARTITION OF sales
  FOR VALUES IN ('South', 'Southeast', 'Southwest');

CREATE TABLE sales_other PARTITION OF sales DEFAULT;</code></pre>

            <h3>Hash Partitioning</h3>
            <p>Split by hash function — ideal for evenly distributing data:</p>
            <pre><code>CREATE TABLE user_sessions (
  id SERIAL,
  user_id INT,
  session_data JSONB
) PARTITION BY HASH (user_id);

CREATE TABLE user_sessions_0 PARTITION OF user_sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE user_sessions_1 PARTITION OF user_sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE user_sessions_2 PARTITION OF user_sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE user_sessions_3 PARTITION OF user_sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Partitioning splits a logical table into smaller physical storage units</li>
              <li>Range partitioning: split by value ranges (dates, IDs)</li>
              <li>List partitioning: split by specific values (regions, categories)</li>
              <li>Hash partitioning: split by hash function (even distribution)</li>
              <li>Partition pruning automatically skips irrelevant partitions</li>
              <li>Best for tables > 100GB or with billions of rows</li>
            </ul>
            <p><strong>Real-world use:</strong> A social media platform partitions the "posts" table by month. Queries for "posts from last week" only scan one partition instead of the entire table.</p>
          </div>
        `,
        defaultCode: "-- Range partitioning (simulated example)\nCREATE TABLE logs (\n  id SERIAL,\n  log_date DATE NOT NULL,\n  message TEXT\n) PARTITION BY RANGE (log_date);\n\n-- Show partition info\nSELECT relname, relkind\nFROM pg_class\nWHERE relkind IN ('p', 'r')\nLIMIT 10;\n\n-- List available tables\nSELECT tablename FROM pg_tables WHERE schemaname = 'public';",
        expectedKeyword: 'PARTITION',
        expectedTable: 'logs',
      },
      {
        id: 'm14-l2',
        title: 'Partition Management & Best Practices',
        objectives: [
          'Learn how to add, detach, and drop partitions',
          'Understand partition pruning and indexing strategies',
          'Implement best practices for partitioned table design',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Managing Partitions in Production</h2>

            <h3>Adding New Partitions</h3>
            <p>As time passes, you need new partitions. Automate this with a scheduled job:</p>
            <pre><code>-- Create next month's partition
CREATE TABLE orders_2024_q3 PARTITION OF orders
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

-- Or create a partition and attach it later
CREATE TABLE orders_2024_q3 (LIKE orders INCLUDING INDEXES);
ALTER TABLE orders ATTACH PARTITION orders_2024_q3
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');</code></pre>

            <h3>Detaching and Dropping Partitions</h3>
            <pre><code>-- Detach: removes from partitioned table, keeps as standalone
ALTER TABLE orders DETACH PARTITION orders_2023_q4;

-- Drop: removes completely (fast — no per-row DELETE!)
DROP TABLE orders_2023_q4;

-- Detach then drop is the safe workflow for archiving:
-- 1. DETACH PARTITION (data stays, but stops getting new data)
-- 2. Verify the data
-- 3. Archive to cold storage
-- 4. DROP TABLE</code></pre>

            <h3>Indexing Partitioned Tables</h3>
            <pre><code>-- Create index on the parent table — applies to all partitions
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_user ON orders(user_id);

-- Or create unique indexes per partition (for uniqueness across partitions)
CREATE UNIQUE INDEX idx_orders_id_q1 ON orders_2024_q1(id);
CREATE UNIQUE INDEX idx_orders_id_q2 ON orders_2024_q2(id);</code></pre>

            <h3>Best Practices</h3>
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Guidelines:</strong> Partition on the column most commonly used in WHERE filters. Don't create more than a few hundred partitions. Use DEFAULT partitions carefully (they can become hot spots). For time-series, plan partition creation ahead of time (e.g., create next 3 months daily).</p>
            </div>
            <ul>
              <li>Partition on columns used in WHERE clauses (partition pruning needs it)</li>
              <li>Keep partition count manageable: dozens to low hundreds is ideal</li>
              <li>Use DEFAULT partitions for out-of-range data (but monitor for unexpected data)</li>
              <li>Index the parent table — indexes auto-propagate to partitions</li>
              <li>Consider pg_partman extension for automatic partition management</li>
            </ul>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>CREATE TABLE ... PARTITION OF adds a new partition</li>
              <li>ALTER TABLE ... ATTACH/DETACH PARTITION manages partition membership</li>
              <li>Dropping a partition is much faster than DELETE for bulk removal</li>
              <li>Indexes on the parent table automatically apply to all partitions</li>
              <li>Detach before dropping for safe archiving workflows</li>
              <li>Use pg_partman for automatic time-based partition creation</li>
            </ul>
            <p><strong>Real-world use:</strong> An IoT platform partitions sensor readings by month. Old partitions are detached, compressed, and moved to cheap storage. Queries for "last week" are lightning fast.</p>
          </div>
        `,
        defaultCode: "-- Check existing partitions\nSELECT\n  p.relname AS partition_name,\n  pg_get_expr(c.relpartbound, c.oid) AS partition_bound\nFROM pg_class p\nJOIN pg_inherits i ON p.oid = i.inhrelid\nJOIN pg_class c ON c.oid = p.oid\nWHERE i.inhparent = 'orders'::regclass;",
        expectedKeyword: 'DETACH',
        expectedTable: 'pg_inherits',
      },
    ],
    quiz: [
      {
        id: 'm14-q1',
        question: 'Which partitioning method is best for time-series data?',
        options: ['List Partitioning', 'Range Partitioning', 'Hash Partitioning', 'Composite Partitioning'],
        correct: 1,
      },
      {
        id: 'm14-q2',
        question: 'What is partition pruning?',
        options: [
          'Removing old partitions to save space',
          'PostgreSQL automatically skipping irrelevant partitions when executing queries',
          'Deleting duplicate rows from partitions',
          'Creating indexes on each partition',
        ],
        correct: 1,
      },
      {
        id: 'm14-q3',
        question: 'Which partitioning method is best for evenly distributing data across partitions?',
        options: ['Range Partitioning', 'List Partitioning', 'Hash Partitioning', 'All partition types distribute evenly'],
        correct: 2,
      },
      {
        id: 'm14-q4',
        question: 'How do you remove a partition from a partitioned table while keeping the data?',
        options: ['DROP TABLE', 'DELETE FROM partition', 'ALTER TABLE ... DETACH PARTITION', 'TRUNCATE partition'],
        correct: 2,
      },
    ],
  },

  // ─── Module 15: PostgreSQL Drivers ───
  {
    id: 'mod-15',
    title: 'PostgreSQL Drivers',
    lessons: [
      {
        id: 'm15-l1',
        title: 'Python with psycopg2',
        objectives: [
          'Learn to connect to PostgreSQL from Python using psycopg2',
          'Understand parameterized queries to prevent SQL injection',
          'Master basic CRUD operations from Python',
        ],
        content: `
          <div class="lesson-prose">
            <h2>PostgreSQL + Python = ❤️</h2>
            <p><strong>psycopg2</strong> is the most popular PostgreSQL adapter for Python. Think of it as a <strong>translator</strong> between your Python code and PostgreSQL.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Chef & Pantry Analogy:</strong> Your Python code is the chef following a recipe. PostgreSQL is the pantry with all the ingredients. psycopg2 is the kitchen assistant who brings you ingredients and puts away leftovers!</p>
            </div>

            <h3>Connecting and Querying</h3>
            <pre><code>import psycopg2

# Connect to the database
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="mydb",
    user="myuser",
    password="mypass"
)

# Create a cursor
cur = conn.cursor()

# Execute a query
cur.execute("SELECT * FROM users")
rows = cur.fetchall()
for row in rows:
    print(f"User: {row[1]}, Email: {row[2]}")

# Close up
cur.close()
conn.close()</code></pre>

            <h3>Parameterized Queries (Prevent SQL Injection!)</h3>
            <pre><code># ✅ SAFE: Use parameterized queries with %s placeholders
user_email = "alice@example.com"
cur.execute(
    "SELECT * FROM users WHERE email = %s",
    (user_email,)
)

# ❌ DANGEROUS: String formatting — vulnerable to SQL injection!
# cur.execute(f"SELECT * FROM users WHERE email = '{user_email}'")</code></pre>
            <p><strong>SQL injection</strong> is when an attacker enters malicious SQL into your form fields. Parameterized queries safely separate code from data — like handing someone a sealed envelope instead of reading the contents out loud!</p>

            <h3>CRUD Operations</h3>
            <pre><code># INSERT
cur.execute(
    "INSERT INTO users (name, email) VALUES (%s, %s) RETURNING id",
    ("Bob", "bob@example.com")
)
new_id = cur.fetchone()[0]
conn.commit()  # Required for INSERT, UPDATE, DELETE!

# UPDATE
cur.execute("UPDATE users SET email = %s WHERE id = %s",
            ("new@example.com", 1))
conn.commit()

# DELETE
cur.execute("DELETE FROM users WHERE id = %s", (5,))
conn.commit()</code></pre>

            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Remember:</strong> Always call conn.commit() after INSERT, UPDATE, DELETE. Otherwise changes are lost when the connection closes! Use conn.rollback() to undo changes.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>psycopg2 is the standard PostgreSQL adapter for Python</li>
              <li>Always use parameterized queries (%s placeholders) to prevent SQL injection</li>
              <li>conn.commit() saves changes; conn.rollback() undoes them</li>
              <li>cur.fetchall() gets all rows; cur.fetchone() gets one row</li>
              <li>Always close cursors and connections when done</li>
              <li>Use context managers (with statements) for automatic cleanup</li>
            </ul>
            <p><strong>Real-world use:</strong> Django and SQLAlchemy use psycopg2 under the hood. FastAPI apps use psycopg2 with asyncpg for async database access.</p>
          </div>
        `,
        defaultCode: "-- Python code (run in your Python environment, not here):\n--\n-- import psycopg2\n-- conn = psycopg2.connect('postgresql://user:pass@localhost/mydb')\n-- cur = conn.cursor()\n-- cur.execute('SELECT * FROM users')\n-- print(cur.fetchall())\n\n-- Show PostgreSQL version for reference\nSELECT version();",
        expectedKeyword: 'psycopg2',
        expectedTable: 'version',
      },
      {
        id: 'm15-l2',
        title: 'Node.js with node-postgres & Connection Pooling',
        objectives: [
          'Learn to connect to PostgreSQL from Node.js using node-postgres',
          'Understand connection pooling and why it\'s essential',
          'Write async/await queries with proper error handling',
        ],
        content: `
          <div class="lesson-prose">
            <h2>PostgreSQL + Node.js = 🚀</h2>
            <p><strong>node-postgres</strong> (the <code>pg</code> package) is the most popular PostgreSQL client for Node.js.</p>

            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Taxi Fleet Analogy:</strong> Connection pooling is like having a fleet of taxis instead of one car. Without a pool: Start car, drive, park, repeat for every request. With a pool: A fleet of taxis waits at the stand. Grab one, go, return it. Much faster!</p>
            </div>

            <h3>Basic Connection with Pool</h3>
            <pre><code>const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'myuser',
  password: 'mypass',
  max: 20,        // Maximum connections in the pool
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
});

async function getUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users');
    return result.rows;
  } finally {
    client.release(); // Return to pool!
  }
}

// Or use pool.query() directly (auto-release):
const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [1]);</code></pre>

            <h3>Parameterized Queries ($1, $2, ...)</h3>
            <pre><code>// ✅ SAFE: Parameterized query with $1, $2 placeholders
const email = 'alice@example.com';
const { rows } = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// Multiple parameters
const { rows } = await pool.query(
  'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
  ['Bob', 'bob@example.com']
);</code></pre>

            <h3>Error Handling</h3>
            <pre><code>async function createUser(name, email) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
      [name, email]
    );
    await client.query('COMMIT');
    return result.rows[0].id;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', err);
    throw err;
  } finally {
    client.release();
  }
}</code></pre>

            <h3>Transaction with pool</h3>
            <pre><code>// Pool has a built-in connect method that returns a client
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = $1', [1]);
  await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = $1', [2]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>node-postgres (pg package) is the standard Node.js PostgreSQL client</li>
              <li>Use Pool for connection pooling — essential for web applications</li>
              <li>Parameterized queries use $1, $2, etc. to prevent SQL injection</li>
              <li>Always release clients back to the pool (client.release())</li>
              <li>Use async/await for clean asynchronous database code</li>
              <li>Wrap transactions in try/catch/finally for proper rollback on error</li>
            </ul>
            <p><strong>Real-world use:</strong> Express.js REST APIs use node-postgres with a Pool configured for 20 connections. Each API request gets a client from the pool, runs queries, and returns it.</p>
          </div>
        `,
        defaultCode: "-- Node.js code (run in your Node environment, not here):\n--\n-- const { Pool } = require('pg');\n-- const pool = new Pool({ database: 'mydb' });\n-- const { rows } = await pool.query('SELECT * FROM users');\n-- console.log(rows);\n\n-- Show current database connections\nSELECT pid, usename, application_name, state\nFROM pg_stat_activity\nWHERE datname = current_database();",
        expectedKeyword: 'pool',
        expectedTable: 'pg_stat_activity',
      },
    ],
    quiz: [
      {
        id: 'm15-q1',
        question: 'What is the primary benefit of connection pooling?',
        options: [
          'It encrypts all database traffic',
          'It reuses database connections, avoiding the overhead of creating new ones',
          'It automatically backs up the database',
          'It creates indexes automatically',
        ],
        correct: 1,
      },
      {
        id: 'm15-q2',
        question: 'How do you prevent SQL injection in node-postgres?',
        options: [
          'Use string concatenation with escape characters',
          'Use $1, $2 parameterized query placeholders',
          'Use uppercase SQL keywords only',
          'SQL injection only affects MySQL, not PostgreSQL',
        ],
        correct: 1,
      },
      {
        id: 'm15-q3',
        question: 'What does client.release() do in node-postgres?',
        options: [
          'Closes the database connection permanently',
          'Returns the client to the connection pool for reuse',
          'Releases any locks held by the client',
          'Removes the client from the application',
        ],
        correct: 1,
      },
      {
        id: 'm15-q4',
        question: 'Which Python library is the standard PostgreSQL adapter?',
        options: ['pymysql', 'psycopg2', 'sqlite3', 'pymongo'],
        correct: 1,
      },
      {
        id: 'm15-q5',
        question: 'Why must you call conn.commit() after INSERT/UPDATE/DELETE in psycopg2?',
        options: [
          'It\'s optional and just for logging',
          'PostgreSQL requires explicit COMMIT to make changes permanent',
          'It closes the connection automatically',
          'conn.commit() is only needed for SELECT queries',
        ],
        correct: 1,
      },
    ],
  },
];

// Mock Database for Simulator
const mockDb = {
  users: [
    { id: 1, name: 'John Doe', email: 'john@example.com', is_active: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', is_active: true },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', is_active: false },
  ],
  orders: [
    { id: 101, user_id: 1, product: 'Laptop', amount: 999.99, status: 'Completed', order_date: '2024-01-15' },
    { id: 102, user_id: 2, product: 'Mouse', amount: 24.50, status: 'Completed', order_date: '2024-02-20' },
    { id: 103, user_id: 1, product: 'Keyboard', amount: 75.00, status: 'Pending', order_date: '2024-03-10' },
    { id: 104, user_id: 3, product: 'Monitor', amount: 349.99, status: 'Shipped', order_date: '2024-03-22' },
    { id: 105, user_id: 2, product: 'Headphones', amount: 89.99, status: 'Completed', order_date: '2024-04-05' },
  ],
  products: [
    { id: 1, name: 'Laptop', category: 'Electronics', price: 999.99 },
    { id: 2, name: 'Mouse', category: 'Electronics', price: 24.50 },
    { id: 3, name: 'Keyboard', category: 'Electronics', price: 75.00 },
    { id: 4, name: 'Monitor', category: 'Electronics', price: 349.99 },
    { id: 5, name: 'Headphones', category: 'Electronics', price: 89.99 },
    { id: 6, name: 'Desk Chair', category: 'Furniture', price: 299.99 },
  ],
  user_metadata: [
    { username: 'johndoe', metadata: '{"role": "admin", "theme": "dark", "address": {"city": "New York", "zip": "10001"}}' },
    { username: 'janesmith', metadata: '{"role": "user", "theme": "light", "address": {"city": "Los Angeles", "zip": "90001"}}' },
    { username: 'bobjohnson', metadata: '{"role": "user", "theme": "auto", "preferences": {"notifications": true}}' },
  ],
  employees: [
    { id: 1, name: 'Alice', role: 'CEO', manager_id: null, dept_id: 1, salary: 150000 },
    { id: 2, name: 'Bob', role: 'CTO', manager_id: 1, dept_id: 1, salary: 130000 },
    { id: 3, name: 'Charlie', role: 'Developer', manager_id: 2, dept_id: 1, salary: 90000 },
    { id: 4, name: 'Diana', role: 'Developer', manager_id: 2, dept_id: 1, salary: 85000 },
    { id: 5, name: 'Eve', role: 'Designer', manager_id: 1, dept_id: 2, salary: 80000 },
    { id: 6, name: 'Frank', role: 'Manager', manager_id: 1, dept_id: 2, salary: 95000 },
  ],
  departments: [
    { id: 1, dept_name: 'Engineering' },
    { id: 2, dept_name: 'Design' },
    { id: 3, dept_name: 'Marketing' },
  ],
  accounts: [
    { id: 1, name: 'Checking', balance: 5000 },
    { id: 2, name: 'Savings', balance: 10000 },
  ],
  documents: [
    { id: 1, title: 'Getting Started with PostgreSQL', body: 'PostgreSQL is a powerful open-source database management system. Learn how to install, configure, and use SQL for data management. This guide covers basic database operations.' },
    { id: 2, title: 'Advanced SQL Queries', body: 'Master complex SQL queries including joins, subqueries, and window functions. Optimize query performance with proper indexing and query planning techniques.' },
    { id: 3, title: 'Database Performance Tuning', body: 'Learn techniques for improving database performance. Topics include index optimization, query analysis, connection pooling, and caching strategies.' },
  ],
};

// DOM Elements
const elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  sqlEditor: document.getElementById('sql-editor'),
  resultsPane: document.getElementById('results-pane'),
  runQueryBtn: document.getElementById('run-query-btn'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
};

// Initialization
function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
  elements.tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.runQueryBtn.addEventListener('click', runQuery);

  // Mobile sidebar toggle
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

// Tab Switching
function switchTab(tabId) {
  // Update buttons
  elements.tabBtns.forEach(function (btn) {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'border-blue-600', 'text-blue-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  // Update panes
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

// Render Sidebar
function renderSidebar() {
  var html = '';
  curriculum.forEach(function (mod, mIndex) {
    html += '\n            <div class="sidebar-module">\n                <h3 class="sidebar-module-title">' +
            mod.title + '</h3>\n                <ul class="space-y-1">\n        ';

    mod.lessons.forEach(function (lesson, lIndex) {
      var isCompleted = userProgress.completedLessons.indexOf(lesson.id) !== -1;
      var isActive = mIndex === activeModule && lIndex === activeLesson;

      html += '\n                <li>\n                    <button class="w-full text-left sidebar-lesson ' +
              (isActive ? 'active' : '') + '" \n                            data-module="' +
              mIndex + '" data-lesson="' + lIndex + '">\n                        <i class="' +
              (isCompleted ? 'fas fa-check-circle text-green-500' : 'far fa-circle text-gray-400') +
              ' mr-2 w-4"></i>\n                        ' + lesson.title + '\n                    </button>\n                </li>\n            ';
    });

    html += '</ul></div>';
  });

  elements.sidebarContent.innerHTML = html;
}

// Load Lesson
function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;

  var lesson = curriculum[mIndex].lessons[lIndex];

  // Mark previous lesson as complete if we are moving forward (simple logic)
  if (userProgress.completedLessons.indexOf(lesson.id) === -1) {
    markLessonComplete(lesson.id);
  }

  // Build full content with objectives, lesson content, and summary
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

  // Wrap with ELI5 toggle
  var eli5Content = window.eli5PostgresData && window.eli5PostgresData[lesson.id]
    ? window.eli5PostgresData[lesson.id]
    : '';

  elements.lessonContent.innerHTML = (window.eli5Toggle
    ? window.eli5Toggle.wrapContent(fullContent, eli5Content)
    : fullContent);

  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('postgresql', elements.lessonContent);
  }

  // Init copy-code
  if (window.copyCode && window.copyCode.init) {
    window.copyCode.init(elements.lessonContent);
  }

  // Set default code in simulator
  elements.sqlEditor.value = lesson.defaultCode;

  // Reset results pane
  elements.resultsPane.innerHTML =
    '<div class="absolute inset-0 flex items-center justify-center text-gray-400">Run a query to see results</div>';

  // Render quiz for this module
  renderQuiz(mIndex);

  // Re-render sidebar to update active states
  renderSidebar();

  // Switch to lesson tab by default on new lesson
  if (window.innerWidth < 768) {
    // hide sidebar on mobile after selection
    if (!elements.sidebar.classList.contains('-translate-x-full')) {
      toggleSidebar();
    }
  }
}

// Render Quiz
function renderQuiz(mIndex) {
  var quiz = curriculum[mIndex].quiz;
  var html = '<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>';

  if (!quiz || quiz.length === 0) {
    elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
    return;
  }

  quiz.forEach(function (q, i) {
    html += '\n            <div class="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-100 quiz-question" id="q-container-' +
            q.id + '">\n                <p class="font-semibold text-lg text-gray-800 mb-4">' +
            (i + 1) + '. ' + q.question + '</p>\n                <div class="space-y-2">\n        ';

    q.options.forEach(function (opt, oIndex) {
      html += '\n                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">\n                    <input type="radio" name="quiz-' +
              q.id + '" value="' + oIndex + '" class="mr-3 w-4 h-4 text-blue-600">\n                    <span class="text-gray-700">' +
              opt + '</span>\n                </label>\n            ';
    });

    html += '\n                </div>\n                <button data-quiz-id="' +
            q.id + '" data-module="' + mIndex + '" data-option="' +
            i + '" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">\n                    Submit Answer\n                </button>\n                <div id="q-feedback-' +
            q.id + '" class="mt-3 hidden text-sm font-medium"></div>\n            </div>\n        ';
  });

  elements.quizContent.innerHTML = html;
}

// Check Quiz Answer
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
    container.classList.replace('bg-blue-50', 'bg-green-50');
    container.classList.replace('border-blue-100', 'border-green-200');

    // Save progress
    if (userProgress.completedQuizzes.indexOf(qId) === -1) {
      userProgress.completedQuizzes.push(qId);
      saveProgress();
    }
  } else {
    feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
    feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
  }
};

// SQL Simulator Engine
function runQuery() {
  var query = elements.sqlEditor.value.trim().toUpperCase();
  var queryLower = elements.sqlEditor.value.trim().toLowerCase();

  if (!query) {
    showConsoleError('ERROR: Query cannot be empty.');
    return;
  }

  var startTime = performance.now();
  var resultHTML = '';

  try {
    // Simple pseudo-SQL engine for demo purposes
    if (query.startsWith('EXPLAIN')) {
      if (query.indexOf('ANALYZE') !== -1) {
        resultHTML = '<pre class="terminal-console info">QUERY PLAN\n─────────────────────────────────────────────────────\nIndex Scan using users_pkey on users  (cost=0.15..8.17 rows=1 width=36) (actual time=0.015..0.023 rows=1 loops=1)\n  Index Cond: (id = 1)\nPlanning Time: 0.052 ms\nExecution Time: 0.023 ms</pre>';
      } else {
        resultHTML = '<pre class="terminal-console info">QUERY PLAN\n─────────────────────────────────────────────────────\nSeq Scan on users  (cost=0.00..22.50 rows=5 width=36)\n  Filter: ((name)::text ~~ \'A%\'::text)</pre>';
      }
    } else if (query.startsWith('SELECT')) {
      // Check for window functions first (before table-specific routing)
      if (query.indexOf('ROW_NUMBER') !== -1 || query.indexOf('RANK') !== -1 || query.indexOf('LAG') !== -1 || query.indexOf('LEAD') !== -1 || query.indexOf('NTILE') !== -1 || query.indexOf('DENSE_RANK') !== -1) {
        resultHTML = generateHtmlTable([
          { name: 'Laptop', amount: 999.99, row_num: 1, rank: 1, dense_rank: 1 },
          { name: 'Monitor', amount: 349.99, row_num: 2, rank: 2, dense_rank: 2 },
          { name: 'Headphones', amount: 89.99, row_num: 3, rank: 3, dense_rank: 3 },
          { name: 'Keyboard', amount: 75.00, row_num: 4, rank: 4, dense_rank: 4 },
          { name: 'Mouse', amount: 24.50, row_num: 5, rank: 5, dense_rank: 5 },
        ]);
      } else if (query.includes('JOIN')) {
        // Check for self-join (employees to employees)
        if (query.indexOf('employees') !== -1 && query.indexOf('employees') !== query.lastIndexOf('employees')) {
          resultHTML = generateHtmlTable([
            { employee: 'Alice', manager: 'NULL' },
            { employee: 'Bob', manager: 'Alice' },
            { employee: 'Charlie', manager: 'Bob' },
            { employee: 'Diana', manager: 'Bob' },
            { employee: 'Eve', manager: 'Alice' },
            { employee: 'Frank', manager: 'Alice' },
          ]);
        } else if (query.indexOf('->>') !== -1 || query.indexOf('#>>') !== -1 || query.indexOf('jsonb') !== -1) {
          resultHTML = generateHtmlTable([
            { username: 'johndoe', role: 'admin', city: 'New York' },
            { username: 'janesmith', role: 'user', city: 'Los Angeles' },
            { username: 'bobjohnson', role: 'user', city: 'NULL' },
          ]);
        } else {
          resultHTML = generateHtmlTable([
            { name: 'John Doe', product: 'Laptop', amount: 999.99 },
            { name: 'John Doe', product: 'Keyboard', amount: 75.0 },
            { name: 'Jane Smith', product: 'Mouse', amount: 24.5 },
            { name: 'Jane Smith', product: 'Headphones', amount: 89.99 },
            { name: 'Bob Johnson', product: 'Monitor', amount: 349.99 },
          ]);
        }
      } else if (query.includes('->>') || query.includes('->') || query.includes('@>')) {
        // Mock JSONB result
        resultHTML = generateHtmlTable([
          { username: 'johndoe', role: 'admin', theme: 'dark', city: 'New York' },
          { username: 'janesmith', role: 'user', theme: 'light', city: 'Los Angeles' },
          { username: 'bobjohnson', role: 'user', theme: 'auto', city: 'NULL' },
        ]);
      } else if (queryLower.indexOf('from users') !== -1) {
        if (query.includes('*')) {
          resultHTML = generateHtmlTable(mockDb.users);
        } else {
          var mapped = mockDb.users.map(function (u) {
            return { name: u.name, email: u.email };
          });
          resultHTML = generateHtmlTable(mapped);
        }
      } else if (queryLower.indexOf('from orders') !== -1) {
        if (query.includes('COUNT') || query.includes('SUM') || query.includes('AVG') || query.includes('MAX') || query.includes('MIN')) {
          if (query.includes('GROUP BY') || query.includes('group by')) {
            resultHTML = generateHtmlTable([
              { status: 'Completed', count: 3 },
              { status: 'Pending', count: 1 },
              { status: 'Shipped', count: 1 },
            ]);
          } else {
            resultHTML = generateHtmlTable([
              { total_orders: 5, avg_amount: 307.89, total_revenue: 1539.47, max_order: 999.99, min_order: 24.50 }
            ]);
          }
        } else {
          resultHTML = generateHtmlTable(mockDb.orders);
        }
      } else if (queryLower.indexOf('from employees') !== -1) {
        resultHTML = generateHtmlTable(mockDb.employees);
      } else if (queryLower.indexOf('from departments') !== -1) {
        resultHTML = generateHtmlTable(mockDb.departments);
      } else if (queryLower.indexOf('from products') !== -1) {
        resultHTML = generateHtmlTable(mockDb.products);
      } else if (queryLower.indexOf('from accounts') !== -1) {
        resultHTML = generateHtmlTable(mockDb.accounts);
      } else if (queryLower.indexOf('from documents') !== -1) {
        if (query.indexOf('to_tsvector') !== -1 || query.indexOf('to_tsquery') !== -1) {
          resultHTML = generateHtmlTable([
            { title: 'Getting Started with PostgreSQL', rank: 0.85 },
            { title: 'Advanced SQL Queries', rank: 0.72 },
            { title: 'Database Performance Tuning', rank: 0.45 },
          ]);
        } else {
          resultHTML = generateHtmlTable(mockDb.documents);
        }
      } else if (queryLower.indexOf('from user_metadata') !== -1) {
        resultHTML = generateHtmlTable(mockDb.user_metadata);
      } else if (queryLower.indexOf('from pg_indexes') !== -1) {
        resultHTML = generateHtmlTable([
          { indexname: 'users_pkey', indexdef: 'CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)' },
          { indexname: 'orders_pkey', indexdef: 'CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id)' },
        ]);
      } else if (queryLower.indexOf('from pg_stat_activity') !== -1) {
        resultHTML = generateHtmlTable([
          { pid: 123, usename: 'postgres', application_name: 'psql', state: 'active' },
          { pid: 456, usename: 'app_user', application_name: 'Node.js App', state: 'idle' },
        ]);
      } else if (queryLower.indexOf('from pg_settings') !== -1) {
        resultHTML = generateHtmlTable([
          { name: 'wal_level', setting: 'replica', unit: 'NULL' },
          { name: 'archive_mode', setting: 'on', unit: 'NULL' },
          { name: 'archive_command', setting: 'cp %p /backup/wal/%f', unit: 'NULL' },
        ]);
      } else if (query.indexOf('ROLE') !== -1 || queryLower.indexOf('from pg_roles') !== -1) {
        resultHTML = generateHtmlTable([
          { rolname: 'postgres', rolsuper: true, rolcanlogin: true },
          { rolname: 'app_user', rolsuper: false, rolcanlogin: true },
          { rolname: 'readonly', rolsuper: false, rolcanlogin: true },
        ]);
      } else if (query.indexOf('VERSION') !== -1) {
        resultHTML = generateHtmlTable([{ version: 'PostgreSQL 16.2 on x86_64-linux-gnu' }]);
      } else if (query.indexOf('EXPLAIN') !== -1) {
        if (query.indexOf('ANALYZE') !== -1) {
          resultHTML = '<pre class="terminal-console info">QUERY PLAN\n─────────────────────────────────────────────────────\nIndex Scan using users_pkey on users  (cost=0.15..8.17 rows=1 width=36) (actual time=0.015..0.023 rows=1 loops=1)\n  Index Cond: (id = 1)\nPlanning Time: 0.052 ms\nExecution Time: 0.023 ms</pre>';
        } else {
          resultHTML = '<pre class="terminal-console info">QUERY PLAN\n─────────────────────────────────────────────────────\nSeq Scan on users  (cost=0.00..22.50 rows=5 width=36)\n  Filter: ((name)::text ~~ \'A%\'::text)</pre>';
        }
      } else if (query.indexOf('WITH') !== -1 || query.indexOf('RECURSIVE') !== -1) {
        if (query.indexOf('RECURSIVE') !== -1) {
          resultHTML = generateHtmlTable([
            { id: 1, name: 'Alice', level: 1 },
            { id: 2, name: 'Bob', level: 2 },
            { id: 3, name: 'Charlie', level: 3 },
            { id: 4, name: 'Diana', level: 3 },
            { id: 5, name: 'Eve', level: 2 },
            { id: 6, name: 'Frank', level: 2 },
          ]);
        } else {
          resultHTML = generateHtmlTable([
            { name: 'John Doe', product: 'Laptop', amount: 999.99 },
            { name: 'Bob Johnson', product: 'Monitor', amount: 349.99 },
          ]);
        }
      } else {
        // Generic SELECT
        resultHTML = generateHtmlTable([{ message: 'Query executed successfully', rows: 0 }]);
      }
    } else if (query.startsWith('INSERT')) {
      resultHTML = '<pre class="terminal-console info">INSERT 0 1\nQuery returned successfully in ' +
        Math.round(performance.now() - startTime) + 'ms.</pre>';
    } else if (query.startsWith('UPDATE')) {
      resultHTML = '<pre class="terminal-console info">UPDATE 1\nQuery returned successfully in ' +
        Math.round(performance.now() - startTime) + 'ms.</pre>';
    } else if (query.startsWith('DELETE')) {
      resultHTML = '<pre class="terminal-console info">DELETE 1\nQuery returned successfully in ' +
        Math.round(performance.now() - startTime) + 'ms.</pre>';
    } else if (query.startsWith('BEGIN') || query.startsWith('COMMIT') || query.startsWith('ROLLBACK')) {
      resultHTML = '<pre class="terminal-console info">' + query.split(' ')[0] + '\nTransaction processed successfully in ' +
        Math.round(performance.now() - startTime) + 'ms.</pre>';
    } else if (query.indexOf('GRANT') !== -1 || query.indexOf('REVOKE') !== -1) {
      resultHTML = '<pre class="terminal-console info">' + query.split(' ')[0] + '\nCommand processed successfully in ' +
        Math.round(performance.now() - startTime) + 'ms.</pre>';
    } else if (query.startsWith('CREATE') || query.startsWith('DROP') || query.startsWith('ALTER') || query.startsWith('REFRESH')) {
      resultHTML = '<pre class="terminal-console info">' + query.split(' ')[0] + ' ' + query.split(' ')[1] + '\nCommand processed successfully in ' +
        Math.round(performance.now() - startTime) + 'ms.</pre>';
    } else if (query.indexOf('COALESCE') !== -1 || query.indexOf('IFNULL') !== -1) {
      resultHTML = generateHtmlTable([
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
        { name: 'Bob Johnson', email: 'No email' },
      ]);
    } else if (query.startsWith('SHOW') || query.startsWith('VACUUM') || query.startsWith('ANALYZE')) {
      resultHTML = '<pre class="terminal-console info">' + query.split(' ')[0] + '\nProcessed successfully.</pre>';
    } else if (query.indexOf('CURRENT_USER') !== -1 || query.indexOf('current_database') !== -1) {
      resultHTML = generateHtmlTable([
        { current_user: 'postgres', current_database: 'postgres' }
      ]);
    } else if (query.indexOf('relname') !== -1 || query.indexOf('pg_class') !== -1) {
      resultHTML = generateHtmlTable([
        { relname: 'users', relkind: 'r' },
        { relname: 'orders', relkind: 'r' },
        { relname: 'employees', relkind: 'r' },
        { relname: 'logs', relkind: 'p' },
      ]);
    } else if (query.indexOf('pg_tables') !== -1) {
      resultHTML = generateHtmlTable([
        { schemaname: 'public', tablename: 'users', tableowner: 'postgres' },
        { schemaname: 'public', tablename: 'orders', tableowner: 'postgres' },
        { schemaname: 'public', tablename: 'employees', tableowner: 'postgres' },
        { schemaname: 'public', tablename: 'products', tableowner: 'postgres' },
      ]);
    } else {
      throw new Error('Syntax error at or near "' + query.split(' ')[0] + '"');
    }

    elements.resultsPane.innerHTML = resultHTML;
  } catch (err) {
    showConsoleError('ERROR: ' + err.message);
  }
}

function showConsoleError(msg) {
  elements.resultsPane.innerHTML = '<pre class="terminal-console error">' + msg + '</pre>';
}

function generateHtmlTable(dataArray) {
  if (!dataArray || dataArray.length === 0)
    return '<div class="p-4 text-gray-500">No rows returned.</div>';

  var headers = Object.keys(dataArray[0]);
  var html = '<table class="sql-data-grid"><thead><tr>';

  headers.forEach(function (h) {
    html += '<th>' + h + '</th>';
  });

  html += '</tr></thead><tbody>';

  dataArray.forEach(function (row) {
    html += '<tr>';
    headers.forEach(function (h) {
      var val = row[h];
      if (val === null || val === undefined || val === 'NULL') {
        html += '<td class="text-gray-400 italic">NULL</td>';
      } else {
        html += '<td>' + val + '</td>';
      }
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

// Progress Tracking
function markLessonComplete(lessonId) {
  if (userProgress.completedLessons.indexOf(lessonId) === -1) {
    userProgress.completedLessons.push(lessonId);
    saveProgress();
  }
}

function saveProgress() {
  localStorage.setItem('postgresHubProgress', JSON.stringify(userProgress));
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

// Run app
document.addEventListener('DOMContentLoaded', init);
