/* global initSqlJs, checkAnswer */

// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('sqliteHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// SQLite Database Instance
let db = null;

// Curriculum Data
const curriculum = [
  // ─── Module 1: SQLite Basics (CREATE & INSERT) ───
  {
    id: 'mod-1',
    title: 'SQLite Basics (CREATE & INSERT)',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Creating Tables & Data Types',
        objectives: [
          'Understand what SQLite is and how it differs from client-server databases',
          'Learn the CREATE TABLE syntax with column definitions and data types',
          'Identify the five SQLite storage classes: INTEGER, REAL, TEXT, BLOB, NULL',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What is SQLite?</h2>
            <p>SQLite is a C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine. It is the most widely deployed database engine in the world — found in every smartphone, most browsers, many embedded systems, and countless desktop applications.</p>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Key Insight:</strong> Unlike PostgreSQL or MySQL, SQLite is <strong>serverless</strong> — there is no separate database server process. The database is a single file on disk that your application reads and writes directly.</p>
            </div>
            
            <h3>CREATE TABLE</h3>
            <p>To store data, you first need a table. You define the table name and the columns it will contain, along with their data types.</p>
            <pre><code>CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  grade INTEGER,
  gpa REAL
);</code></pre>
            
            <h3>SQLite Data Types (Storage Classes)</h3>
            <p>SQLite uses <strong>five storage classes</strong> to represent data:</p>
            <ul>
              <li><code>INTEGER</code> — Signed integers from 1 to 8 bytes (e.g., 42, -7, 9000)</li>
              <li><code>REAL</code> — Floating-point decimal values (e.g., 3.14, 99.99, -0.5)</li>
              <li><code>TEXT</code> — String values encoded in UTF-8, UTF-16BE, or UTF-16LE (e.g., 'Alice', 'Hello')</li>
              <li><code>BLOB</code> — Binary Large OBject, raw byte data (e.g., images, files)</li>
              <li><code>NULL</code> — Represents a missing or unknown value</li>
            </ul>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Flexibility:</strong> SQLite uses <strong>type affinity</strong> — it's flexible about what you store. You can put TEXT into an INTEGER column, though it's generally not recommended. This is different from strict SQL databases that reject mismatched types.</p>
            </div>
            
            <p>Go to the <strong>SQLite Playground</strong> tab to run your first query. The database is already seeded with <code>employees</code> and <code>departments</code> tables. Try selecting from them!</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>SQLite is a serverless, self-contained, zero-configuration SQL database engine</li>
              <li>Databases are stored as single files on disk (.sqlite or .db)</li>
              <li>CREATE TABLE defines a new table with column names and storage classes</li>
              <li>Five storage classes: INTEGER, REAL, TEXT, BLOB, NULL</li>
              <li>PRIMARY KEY uniquely identifies each row in a table</li>
              <li>SQLite uses type affinity — flexible but be consistent for best results</li>
            </ul>
            <p><strong>Real-world use:</strong> Mobile apps store user settings and offline data in SQLite. Browsers like Chrome use SQLite for bookmarks, history, and cookies.</p>
          </div>
        `,
        defaultCode: `-- Select all employees
SELECT * FROM employees;

-- Select all departments
SELECT * FROM departments;`,
      },
      {
        id: 'm1-l2',
        title: 'Inserting Data with INSERT INTO',
        objectives: [
          'Master the INSERT INTO statement for adding rows to a table',
          'Understand the difference between INSERT with and without column lists',
          'Learn about AUTOINCREMENT and how SQLite handles primary keys',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Adding Rows with INSERT</h2>
            <p>Use the <code>INSERT INTO</code> statement to add new rows of data to a table. Think of it like filling out a form — you specify which columns to fill and what values to put in them.</p>
            
            <h3>Basic INSERT Syntax</h3>
            <pre><code>-- Specify columns and values (recommended)
INSERT INTO employees (name, role, dept_id) 
VALUES ('Sarah', 'Designer', 2);

-- Insert without column list (order matters!)
INSERT INTO employees VALUES (NULL, 'Eve', 'Intern', 1);</code></pre>
            
            <h3>INSERT with AUTOINCREMENT</h3>
            <p>The <code>AUTOINCREMENT</code> keyword on a PRIMARY KEY column tells SQLite to automatically generate a unique ID for each new row. When you insert, you can pass <code>NULL</code> for that column, and SQLite will assign the next available ID.</p>
            <pre><code>CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO logs (message) VALUES ('Server started');
INSERT INTO logs (message) VALUES ('User logged in');</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> Always specify the column list in INSERT statements. It makes your code self-documenting and protects against errors if the table structure changes later.</p>
            </div>
            
            <h3>Inserting Multiple Rows</h3>
            <p>SQLite supports inserting multiple rows in a single statement, which is much faster than individual INSERTs:</p>
            <pre><code>INSERT INTO employees (name, role, dept_id) VALUES 
  ('Frank', 'Developer', 1),
  ('Grace', 'Manager', 1),
  ('Hank', 'Designer', 2);</code></pre>
            
            <p>Try adding a new employee in the playground, and then run a <code>SELECT * FROM employees;</code> to verify!</p>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>INSERT INTO adds one or more rows to a table</li>
              <li>Always specify the column list for clarity and safety</li>
              <li>AUTOINCREMENT automatically generates unique sequential IDs</li>
              <li>Insert multiple rows in one statement by comma-separating value lists</li>
              <li>Pass NULL or omit the primary key column to get auto-generated IDs</li>
            </ul>
            <p><strong>Real-world use:</strong> IoT devices insert sensor readings (temperature, humidity) into SQLite databases every few seconds. Bulk INSERT reduces overhead.</p>
          </div>
        `,
        defaultCode: `INSERT INTO employees (name, role, dept_id) 
VALUES ('New Hire', 'Intern', 1);

-- Verify the insertion
SELECT * FROM employees;

-- Try a multi-row insert
INSERT INTO employees (name, role, dept_id) VALUES 
  ('Alex', 'Developer', 1),
  ('Jordan', 'Designer', 2);`,
      },
      {
        id: 'm1-l3',
        title: 'SQLite Type Affinity & Storage',
        objectives: [
          'Understand SQLite\'s flexible type affinity system',
          'Learn the five storage classes and their behaviors',
          'Know when to use strict typing vs. flexible typing',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Type Affinity in SQLite</h2>
            <p>Unlike most SQL databases that enforce strict column types, SQLite uses <strong>type affinity</strong>. This means a column declared as <code>INTEGER</code> <em>prefers</em> integers but won't reject text. It's a "suggestion" rather than a "rule".</p>
            
            <h3>The Five Type Affinities</h3>
            <pre><code>CREATE TABLE example (
  col1 INTEGER,    -- INTEGER affinity
  col2 TEXT,       -- TEXT affinity
  col3 REAL,       -- REAL affinity
  col4 BLOB,       -- BLOB affinity (no conversion)
  col5 NUMERIC     -- NUMERIC affinity (flexible numbers)
);</code></pre>
            
            <h3>How Affinity Works in Practice</h3>
            <pre><code>INSERT INTO example VALUES 
  (42, 'hello', 3.14, x'00FF', 100),
  ('123', 456, '2.71', 'raw data', '99.9');</code></pre>
            <p>In the second row, SQLite will try to convert '123' to integer 123 for col1, but if it can't convert, it stores the original value anyway.</p>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Best Practice:</strong> Despite the flexibility, always use the <strong>correct type</strong> for each column. It makes your database self-documenting and prevents subtle bugs. Think of type affinity as a safety net, not a feature to rely on.</p>
            </div>
            
            <h3>When to Use Each Type</h3>
            <ul>
              <li><strong>INTEGER</strong> — IDs, counts, ages, years, quantities</li>
              <li><strong>REAL</strong> — Prices, measurements, coordinates, percentages</li>
              <li><strong>TEXT</strong> — Names, descriptions, emails, dates (as ISO strings), JSON</li>
              <li><strong>BLOB</strong> — Images, encrypted data, binary files</li>
              <li><strong>NULL</strong> — Missing or unknown values (can appear in any column)</li>
            </ul>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>SQLite uses type affinity — flexible typing that suggests rather than enforces</li>
              <li>Five type affinities: INTEGER, TEXT, REAL, BLOB, NUMERIC</li>
              <li>SQLite automatically converts between types when possible</li>
              <li>BLOB is the only type that prevents all conversion</li>
              <li>Always use the correct type for clarity and maintainability</li>
            </ul>
            <p><strong>Real-world use:</strong> SQLite's flexibility is great for prototyping. You can start with flexible types and add constraints later as your schema stabilizes.</p>
          </div>
        `,
        defaultCode: `-- Create a table with various types
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL,
  quantity INTEGER DEFAULT 0,
  description TEXT
);

-- Insert sample data
INSERT INTO inventory (name, price, quantity, description) VALUES 
  ('Widget', 9.99, 100, 'A small mechanical device'),
  ('Gadget', 24.99, 50, 'An electronic tool'),
  ('Thingamajig', 14.99, 75, 'A whatchamacallit');

-- Query the result
SELECT * FROM inventory;

-- Check table schema
SELECT sql FROM sqlite_master WHERE type='table' AND name='inventory';`,
      },
    ],
    quiz: [
      {
        id: 'm1-q1',
        question: 'Which SQL keyword is used to add new rows to a table?',
        options: ['ADD', 'UPDATE', 'INSERT', 'CREATE'],
        correct: 2,
      },
      {
        id: 'm1-q2',
        question: 'Which SQLite storage class would you use to store a person\'s name?',
        options: ['INTEGER', 'REAL', 'TEXT', 'BLOB'],
        correct: 2,
      },
      {
        id: 'm1-q3',
        question: 'What does PRIMARY KEY do?',
        options: [
          'Sorts the table by that column',
          'Uniquely identifies each row in a table',
          'Makes the column required (NOT NULL)',
          'Automatically indexes all columns',
        ],
        correct: 1,
      },
      {
        id: 'm1-q4',
        question: 'What is SQLite\'s unique characteristic compared to PostgreSQL or MySQL?',
        options: [
          'It is the fastest database engine',
          'It is serverless — no separate database server process',
          'It only runs on mobile devices',
          'It does not support SQL',
        ],
        correct: 1,
      },
      {
        id: 'm1-q5',
        question: 'What happens when you insert a row with NULL for an AUTOINCREMENT column?',
        options: [
          'The INSERT fails with an error',
          'SQLite assigns the next available unique ID',
          'The column remains NULL permanently',
          'SQLite assigns a random number',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 2: Querying & JOINs ───
  {
    id: 'mod-2',
    title: 'Querying & JOINs',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Basic SELECT & WHERE Filtering',
        objectives: [
          'Master the SELECT statement with column selection',
          'Learn to use WHERE clauses for filtering data',
          'Understand comparison operators and logical operators (AND, OR, NOT)',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Retrieving Data with SELECT</h2>
            <p>The <code>SELECT</code> statement is how you read data from a database. It's like asking a question: "Show me the data that matches these criteria."</p>
            
            <h3>Basic SELECT Syntax</h3>
            <pre><code>-- Select all columns
SELECT * FROM employees;

-- Select specific columns
SELECT name, role FROM employees;

-- Select with alias
SELECT name AS employee_name, role AS job_title FROM employees;</code></pre>
            
            <h3>Filtering with WHERE</h3>
            <p>The <code>WHERE</code> clause filters results based on conditions. Only rows that satisfy the condition are returned.</p>
            <pre><code>-- Exact match
SELECT name, role FROM employees WHERE role = 'Developer';

-- Comparison operators
SELECT name, salary FROM employees WHERE salary > 50000;
SELECT name FROM employees WHERE dept_id != 2;

-- Text pattern matching (LIKE)
SELECT name FROM employees WHERE name LIKE 'A%';</code></pre>
            
            <h3>Logical Operators: AND, OR, NOT</h3>
            <pre><code>-- AND: Both conditions must be true
SELECT * FROM employees WHERE role = 'Developer' AND dept_id = 1;

-- OR: Either condition can be true
SELECT * FROM employees WHERE role = 'Developer' OR role = 'Manager';

-- NOT: Exclude matching rows
SELECT * FROM employees WHERE NOT role = 'Intern';

-- Combined
SELECT * FROM employees 
WHERE (role = 'Developer' OR role = 'Designer') 
  AND dept_id = 2;</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> Use parentheses to group conditions when mixing AND and OR. Without parentheses, AND has higher precedence than OR, which can lead to unexpected results.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>SELECT retrieves data from one or more tables</li>
              <li>Use * for all columns or specify individual column names</li>
              <li>WHERE filters rows using comparison operators (=, >, <, !=, LIKE, IN)</li>
              <li>AND requires all conditions to be true; OR requires any</li>
              <li>LIKE with % is for pattern matching (% is a wildcard)</li>
              <li>Always use parentheses when mixing AND and OR</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce sites use WHERE extensively — "Show all products in category X with price between $10 and $50 that are in stock."</p>
          </div>
        `,
        defaultCode: `-- Find all Developers
SELECT name, role 
FROM employees 
WHERE role = 'Developer';

-- Find employees in Engineering (dept_id = 1)
SELECT name, role 
FROM employees 
WHERE dept_id = 1;

-- Combined: Developers in Engineering
SELECT name, role 
FROM employees 
WHERE role = 'Developer' AND dept_id = 1;`,
      },
      {
        id: 'm2-l2',
        title: 'INNER JOIN & LEFT JOIN',
        objectives: [
          'Understand how JOINs connect related tables',
          'Master INNER JOIN for matching rows across tables',
          'Learn LEFT JOIN to include non-matching rows',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Combining Tables with JOIN</h2>
            <p>A <code>JOIN</code> clause combines rows from two or more tables based on a related column between them. It's like looking up a reference in one table to get more details from another.</p>
            
            <h3>INNER JOIN</h3>
            <p>Returns only rows that have matching values in both tables. If an employee has no department, they won't appear.</p>
            <pre><code>SELECT e.name, e.role, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;</code></pre>
            
            <h3>LEFT JOIN (aka LEFT OUTER JOIN)</h3>
            <p>Returns ALL rows from the left table, even if there's no match in the right table. Non-matching rows show NULL for the right table's columns.</p>
            <pre><code>SELECT e.name, e.role, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Key Difference:</strong> INNER JOIN = "Only show me employees who belong to a department." LEFT JOIN = "Show me ALL employees, with their department name if they have one, or NULL if they don't."</p>
            </div>
            
            <h3>Table Aliases</h3>
            <p>In JOIN queries, you use <strong>table aliases</strong> (<code>e</code> for employees, <code>d</code> for departments) to write shorter, cleaner SQL. Without aliases, you'd have to write the full table name before each column.</p>
            
            <h3>JOIN with WHERE</h3>
            <pre><code>SELECT e.name, e.role, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE d.dept_name = 'Engineering';</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>JOIN combines rows from two tables based on a related column</li>
              <li>INNER JOIN returns only matching rows from both tables</li>
              <li>LEFT JOIN returns all rows from the left table, with NULL for non-matches</li>
              <li>Table aliases (e, d) make queries shorter and more readable</li>
              <li>You can add WHERE after JOIN to further filter the combined results</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce order systems JOIN orders ↔ customers ↔ products to show complete order history with customer names and product details.</p>
          </div>
        `,
        defaultCode: `-- INNER JOIN: only employees with departments
SELECT e.name, e.role, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.id;

-- LEFT JOIN: all employees, even without departments
SELECT e.name, e.role, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;`,
      },
      {
        id: 'm2-l3',
        title: 'Self-Joins, CROSS JOIN & UNION',
        objectives: [
          'Understand self-joins for hierarchical data (e.g., manager reporting)',
          'Learn CROSS JOIN for Cartesian products',
          'Use UNION and UNION ALL to combine query results',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Advanced JOIN Types</h2>
            
            <h3>Self-Join</h3>
            <p>A self-join joins a table to itself. It's useful for hierarchical data like employee-manager relationships. You use different aliases for the same table.</p>
            <pre><code>-- Create table with manager relationship
CREATE TABLE staff (
  id INTEGER PRIMARY KEY,
  name TEXT,
  manager_id INTEGER REFERENCES staff(id)
);

-- Query each employee and their manager
SELECT e.name AS employee, m.name AS manager
FROM staff e
LEFT JOIN staff m ON e.manager_id = m.id;</code></pre>
            
            <h3>CROSS JOIN</h3>
            <p>A CROSS JOIN creates a <strong>Cartesian product</strong> — every row from table A paired with every row from table B. If A has 3 rows and B has 4 rows, the result has 12 rows.</p>
            <pre><code>SELECT e.name, d.dept_name
FROM employees e
CROSS JOIN departments d;</code></pre>
            
            <h3>UNION and UNION ALL</h3>
            <p>UNION combines results from multiple SELECT queries into one result set. UNION removes duplicates; UNION ALL keeps them.</p>
            <pre><code>SELECT name AS entity FROM employees
UNION
SELECT dept_name AS entity FROM departments
ORDER BY entity;</code></pre>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Note:</strong> CROSS JOINs can be dangerous on large tables — joining two tables with 10,000 rows each creates 100 million rows! Use them sparingly.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Self-joins join a table to itself using different aliases</li>
              <li>Used for hierarchical data like org charts or comment threads</li>
              <li>CROSS JOIN creates a Cartesian product (every × every)</li>
              <li>UNION combines multiple SELECT results; UNION ALL keeps duplicates</li>
              <li>UNION requires the same number of columns in each SELECT</li>
            </ul>
            <p><strong>Real-world use:</strong> Social media comment systems use self-joins to show nested replies. UNION is used to combine data from similar tables (e.g., Q1 sales + Q2 sales).</p>
          </div>
        `,
        defaultCode: `-- Demonstration: UNION
SELECT name AS item, 'Employee' AS type FROM employees
UNION
SELECT dept_name AS item, 'Department' AS type FROM departments
ORDER BY item;

-- CROSS JOIN (small example)
SELECT e.name, d.dept_name
FROM employees e
CROSS JOIN departments d
LIMIT 12;`,
      },
    ],
    quiz: [
      {
        id: 'm2-q1',
        question: 'What does an INNER JOIN do?',
        options: [
          'Returns all rows from both tables',
          'Returns only rows that have matching values in both tables',
          'Returns all rows from the left table',
          'Deletes matching rows',
        ],
        correct: 1,
      },
      {
        id: 'm2-q2',
        question: 'Which JOIN type returns ALL rows from the left table even when there is no match in the right table?',
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
        question: 'What does the LIKE operator with \'A%\' pattern match?',
        options: [
          'Exact match for the letter A',
          'Any value starting with the letter A',
          'Any value ending with the letter A',
          'Any value containing the letter A',
        ],
        correct: 1,
      },
      {
        id: 'm2-q5',
        question: 'A self-join is useful for:',
        options: [
          'Joining two unrelated tables',
          'Hierarchical data like employee-manager relationships',
          'Combining text columns',
          'Creating backups of a table',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 3: Constraints & Indexes ───
  {
    id: 'mod-3',
    title: 'Constraints & Indexes',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Data Integrity with Constraints',
        objectives: [
          'Understand the purpose of constraints for data integrity',
          'Master NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK, DEFAULT',
          'Learn how constraints prevent invalid data from entering the database',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Why Constraints Matter</h2>
            <p>Constraints are <strong>rules</strong> applied to columns to enforce data integrity. Without them, your data can become inconsistent, duplicate, or invalid — like a library where books are randomly shelved with no catalog system.</p>
            
            <h3>Types of Constraints</h3>
            <pre><code>CREATE TABLE products (
  id INTEGER PRIMARY KEY,           -- Unique identifier for each row
  sku TEXT NOT NULL UNIQUE,          -- Must have value AND be unique
  name TEXT NOT NULL,                -- Must have a value
  price REAL CHECK(price > 0),       -- Must be positive
  category TEXT DEFAULT 'General',   -- Default value if not specified
  supplier_id INTEGER REFERENCES suppliers(id)  -- Must exist in suppliers table
);</code></pre>
            
            <h3>Constraint Details</h3>
            <ul>
              <li><strong>PRIMARY KEY</strong> — Uniquely identifies each row. Implies NOT NULL + UNIQUE. A table can have only one primary key, but it can span multiple columns (composite key).</li>
              <li><strong>NOT NULL</strong> — The column cannot contain NULL values. Every row must have a value.</li>
              <li><strong>UNIQUE</strong> — Every value in the column must be different. No duplicates allowed.</li>
              <li><strong>FOREIGN KEY</strong> — Ensures a value in this column matches a value in another table's primary key. This maintains <strong>referential integrity</strong>.</li>
              <li><strong>CHECK</strong> — Validates data against a boolean expression. For example, <code>CHECK(age >= 0)</code> prevents negative ages.</li>
              <li><strong>DEFAULT</strong> — Specifies a default value when no value is provided during INSERT.</li>
            </ul>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Remember:</strong> FOREIGN KEY constraints in SQLite require <strong>foreign key enforcement to be enabled</strong> via <code>PRAGMA foreign_keys = ON;</code> at the start of each connection.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Constraints enforce rules on your data to maintain integrity</li>
              <li>PRIMARY KEY = unique row identifier (implies NOT NULL + UNIQUE)</li>
              <li>NOT NULL prevents missing values; UNIQUE prevents duplicates</li>
              <li>FOREIGN KEY maintains referential integrity between tables</li>
              <li>CHECK validates data (e.g., price > 0, age >= 0)</li>
              <li>DEFAULT provides a fallback value when none is given</li>
              <li>Enable PRAGMA foreign_keys = ON for foreign key enforcement</li>
            </ul>
            <p><strong>Real-world use:</strong> Banking systems use CHECK constraints to ensure transaction amounts are positive. E-commerce uses FOREIGN KEY to ensure every order references a real customer.</p>
          </div>
        `,
        defaultCode: `-- Create a table with various constraints
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  budget REAL CHECK(budget > 0),
  status TEXT DEFAULT 'Planning'
);

-- This should work
INSERT INTO projects (title, budget) VALUES ('Website Redesign', 50000);

-- Try inserting a duplicate title (should fail due to UNIQUE)
INSERT INTO projects (title, budget) VALUES ('Website Redesign', 30000);

-- View the table
SELECT name, sql FROM sqlite_master WHERE type='table';

-- See the inserted data
SELECT * FROM projects;`,
      },
      {
        id: 'm3-l2',
        title: 'Indexes for Performance',
        objectives: [
          'Understand what indexes are and how they speed up queries',
          'Learn when to create indexes and when to avoid them',
          'Practice using EXPLAIN QUERY PLAN to see index usage',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What is an Index?</h2>
            <p>An index is a data structure that improves the speed of data retrieval operations on a table. Think of it like the index at the back of a textbook — without it, you'd flip through every page to find a topic. With it, you go directly to the right page.</p>
            
            <h3>Creating and Using Indexes</h3>
            <pre><code>-- Create an index on a frequently searched column
CREATE INDEX idx_employees_role ON employees(role);

-- Create a unique index (adds a UNIQUE constraint)
CREATE UNIQUE INDEX idx_employees_email ON employees(email);

-- Create a composite index (multiple columns)
CREATE INDEX idx_employees_dept_role ON employees(dept_id, role);</code></pre>
            
            <h3>Checking Index Usage with EXPLAIN QUERY PLAN</h3>
            <pre><code>EXPLAIN QUERY PLAN SELECT * FROM employees WHERE role = 'Developer';</code></pre>
            <p>Without an index, it shows <code>SCAN TABLE employees</code>. With an index, it shows <code>SEARCH TABLE employees USING INDEX idx_employees_role</code>.</p>
            
            <h3>When to Use (and NOT Use) Indexes</h3>
            <p><strong>Good candidates for indexes:</strong></p>
            <ul>
              <li>Columns used frequently in WHERE clauses</li>
              <li>Columns used in JOIN conditions (foreign keys)</li>
              <li>Columns used in ORDER BY or GROUP BY</li>
              <li>Columns with high cardinality (many unique values)</li>
            </ul>
            <p><strong>Bad candidates for indexes:</strong></p>
            <ul>
              <li>Columns rarely used in queries</li>
              <li>Small tables (< 100 rows) — a full scan is faster than an index lookup</li>
              <li>Columns with very few unique values (e.g., boolean flags)</li>
              <li>Tables with very heavy write operations (indexes slow down inserts/updates)</li>
            </ul>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Trade-off:</strong> Indexes speed up <strong>reads</strong> but slow down <strong>writes</strong>. Every INSERT, UPDATE, and DELETE must update all relevant indexes. Like having an index card catalog — helpful for finding books, but you have to update it every time you add a new book.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Indexes dramatically speed up SELECT, WHERE, JOIN, and ORDER BY queries</li>
              <li>CREATE INDEX creates an index; CREATE UNIQUE INDEX adds a uniqueness constraint</li>
              <li>Use EXPLAIN QUERY PLAN to check if your query uses an index</li>
              <li>SCAN TABLE = slow (no index), SEARCH TABLE USING INDEX = fast</li>
              <li>Indexes slow down writes — don't over-index</li>
              <li>Good candidates: WHERE columns, JOIN columns, high-cardinality columns</li>
            </ul>
            <p><strong>Real-world use:</strong> A user database with millions of records would be unusably slow without an index on the email column — every login would scan the entire table!</p>
          </div>
        `,
        defaultCode: `-- Create an index
CREATE INDEX idx_role ON employees(role);

-- Check if the index is used
EXPLAIN QUERY PLAN SELECT * FROM employees WHERE role = 'Developer';

-- The EXPLAIN will show SEARCH TABLE employees USING INDEX idx_role

-- This query would also use the index
SELECT * FROM employees WHERE role = 'Developer' ORDER BY name;

-- List all indexes
SELECT name FROM sqlite_master WHERE type='index';`,
      },
    ],
    quiz: [
      {
        id: 'm3-q1',
        question: 'Which constraint uniquely identifies each record in a database table?',
        options: ['NOT NULL', 'UNIQUE', 'FOREIGN KEY', 'PRIMARY KEY'],
        correct: 3,
      },
      {
        id: 'm3-q2',
        question: 'What is the primary trade-off when adding an index to a column?',
        options: [
          'Faster writes but slower reads',
          'Faster reads but slower writes',
          'Indexes take no extra space',
          'Indexes work only on INTEGER columns',
        ],
        correct: 1,
      },
      {
        id: 'm3-q3',
        question: 'Which constraint ensures a column cannot have a NULL value?',
        options: ['DEFAULT', 'NOT NULL', 'UNIQUE', 'CHECK'],
        correct: 1,
      },
      {
        id: 'm3-q4',
        question: 'What does EXPLAIN QUERY PLAN show you?',
        options: [
          'The estimated execution time of a query',
          'How SQLite will execute a query (index scan vs. full table scan)',
          'The SQL syntax error in your query',
          'A visual diagram of the query',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 4: UPDATE & DELETE ───
  {
    id: 'mod-4',
    title: 'UPDATE & DELETE Operations',
    lessons: [
      {
        id: 'm4-l1',
        title: 'Updating Rows with UPDATE',
        objectives: [
          'Master the UPDATE statement for modifying existing data',
          'Learn to use WHERE with UPDATE to target specific rows',
          'Understand how to update multiple columns in one statement',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Modifying Data with UPDATE</h2>
            <p>The <code>UPDATE</code> statement changes existing data in a table. Think of it like using white-out to fix a mistake on a form — you find the right entry and change the fields that need correcting.</p>
            
            <h3>Basic UPDATE Syntax</h3>
            <pre><code>-- Update a single column for a specific row
UPDATE employees 
SET role = 'Senior Developer' 
WHERE name = 'Alice';

-- Update multiple columns at once
UPDATE employees 
SET role = 'Tech Lead', dept_id = 1 
WHERE name = 'Bob';</code></pre>
            
            <h3>The Most Important Rule: ALWAYS Use WHERE!</h3>
            <div class="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-red-800"><strong>⚠️ CRITICAL:</strong> If you omit the WHERE clause, ALL rows in the table are updated! <code>UPDATE employees SET salary = 100000;</code> would set EVERY employee's salary to $100,000. Always double-check your WHERE clause before running an UPDATE.</p>
            </div>
            
            <h3>UPDATE with Expressions</h3>
            <p>You can use expressions to compute new values:</p>
            <pre><code>-- Give everyone a 10% raise
UPDATE employees 
SET salary = salary * 1.1;

-- Decrease stock after a purchase
UPDATE products 
SET quantity = quantity - 1 
WHERE id = 42;</code></pre>
            
            <h3>UPDATE with Subquery</h3>
            <pre><code>-- Update using a value from another table
UPDATE employees 
SET dept_id = (SELECT id FROM departments WHERE dept_name = 'Engineering')
WHERE role = 'Developer';</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>UPDATE modifies existing rows in a table</li>
              <li>SET specifies which columns to change and their new values</li>
              <li>ALWAYS include a WHERE clause unless you intend to update every row</li>
              <li>You can update multiple columns in a single UPDATE statement</li>
              <li>Expressions like salary * 1.1 can compute new values</li>
              <li>Subqueries in SET allow cross-table updates</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce platforms UPDATE inventory quantities when orders are placed. Social media apps UPDATE user profile information.</p>
          </div>
        `,
        defaultCode: `-- Update a single employee's role
UPDATE employees 
SET role = 'Senior Developer' 
WHERE name = 'Alice';

-- Verify the change
SELECT * FROM employees WHERE name = 'Alice';

-- Give a raise to all Developers
UPDATE employees 
SET role = 'Lead Developer' 
WHERE role = 'Developer';

-- See all changes
SELECT * FROM employees;`,
      },
      {
        id: 'm4-l2',
        title: 'Deleting Rows & Cleaning Up',
        objectives: [
          'Master the DELETE statement for removing data',
          'Understand the difference between DELETE, DROP TABLE, and soft deletes',
          'Learn about referential actions: CASCADE, SET NULL, RESTRICT',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Removing Data with DELETE</h2>
            <p>The <code>DELETE</code> statement removes rows from a table. Unlike UPDATE which changes values, DELETE removes entire rows — like throwing a file folder in the trash.</p>
            
            <h3>Basic DELETE Syntax</h3>
            <pre><code>-- Delete a specific row
DELETE FROM employees WHERE name = 'Bob';

-- Delete multiple rows matching a condition
DELETE FROM employees WHERE dept_id = 3;

-- Delete ALL rows (use with extreme caution!)
DELETE FROM employees;</code></pre>
            
            <div class="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-red-800"><strong>⚠️ CRITICAL:</strong> Just like UPDATE, omitting WHERE from DELETE removes ALL rows. <code>DELETE FROM employees;</code> empties the entire table. There is no "undo" in SQL (unless you're inside a transaction — see Module 9!).</p>
            </div>
            
            <h3>DELETE vs. DROP TABLE vs. TRUNCATE</h3>
            <ul>
              <li><strong>DELETE</strong> — Removes rows but keeps the table structure. Can be rolled back if inside a transaction.</li>
              <li><strong>DROP TABLE</strong> — Removes the entire table (structure + data). Like demolishing the filing cabinet entirely.</li>
              <li><strong>TRUNCATE</strong> — SQLite doesn't support TRUNCATE directly. Use <code>DELETE FROM table</code> without WHERE to remove all rows.</li>
            </ul>
            
            <h3>Soft Deletes</h3>
            <p>Many real applications don't actually DELETE data — they use a <strong>soft delete</strong> pattern:</p>
            <pre><code>-- Add a deleted column
ALTER TABLE employees ADD COLUMN is_deleted INTEGER DEFAULT 0;

-- Instead of deleting, mark as deleted
UPDATE employees SET is_deleted = 1 WHERE name = 'Bob';

-- In queries, exclude deleted rows
SELECT * FROM employees WHERE is_deleted = 0;</code></pre>
            
            <h3>Referential Actions with FOREIGN KEY</h3>
            <p>When a row is deleted, what happens to related rows in other tables?</p>
            <pre><code>CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE   -- Also delete related orders
    -- ON DELETE SET NULL -- Set customer_id to NULL instead
    -- ON DELETE RESTRICT -- Prevent deletion if orders exist
);</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> Soft deletes are great for data recovery and audit trails. Hard deletes save space. Choose based on your requirements — many apps use soft deletes for user data and hard deletes for temporary/cache data.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>DELETE removes rows from a table; without WHERE, it removes ALL rows</li>
              <li>DELETE keeps the table structure; DROP TABLE removes everything</li>
              <li>Soft deletes mark rows as deleted instead of removing them</li>
              <li>FOREIGN KEY actions: CASCADE, SET NULL, RESTRICT control related deletions</li>
              <li>Transactions (BEGIN/COMMIT) allow you to roll back accidental DELETEs</li>
              <li>Always test your DELETE with SELECT first: <code>SELECT * FROM table WHERE condition</code></li>
            </ul>
            <p><strong>Real-world use:</strong> Social networks use soft deletes for user accounts — the account is hidden but can be restored within 30 days. Banking systems use RESTRICT to prevent deleting customers with active accounts.</p>
          </div>
        `,
        defaultCode: `-- Add a new employee first
INSERT INTO employees (name, role, dept_id) VALUES 
  ('Temp Employee', 'Intern', 1);

-- See the new employee
SELECT * FROM employees WHERE name LIKE 'Temp%';

-- Delete the employee
DELETE FROM employees WHERE name = 'Temp Employee';

-- Verify deletion
SELECT * FROM employees;

-- Soft delete demo (add a column, mark as deleted)
ALTER TABLE employees ADD COLUMN is_active INTEGER DEFAULT 1;
UPDATE employees SET is_active = 0 WHERE name = 'Charlie';
SELECT name, is_active FROM employees;`,
      },
    ],
    quiz: [
      {
        id: 'm4-q1',
        question: 'What happens if you run UPDATE without a WHERE clause?',
        options: [
          'Nothing — UPDATE requires WHERE',
          'All rows in the table are updated',
          'Only the first row is updated',
          'An error is thrown',
        ],
        correct: 1,
      },
      {
        id: 'm4-q2',
        question: 'What is a "soft delete"?',
        options: [
          'Deleting data from a temporary table',
          'Marking a row as deleted instead of physically removing it',
          'Using DELETE with a soft WHERE clause',
          'Deleting only NULL values',
        ],
        correct: 1,
      },
      {
        id: 'm4-q3',
        question: 'Which SQL statement removes an entire table including its structure?',
        options: ['DELETE FROM', 'DROP TABLE', 'TRUNCATE TABLE', 'REMOVE TABLE'],
        correct: 1,
      },
      {
        id: 'm4-q4',
        question: 'What does ON DELETE CASCADE do?',
        options: [
          'Prevents deletion if related rows exist',
          'Sets the foreign key to NULL when the parent is deleted',
          'Automatically deletes related rows when the parent is deleted',
          'Creates a backup before deletion',
        ],
        correct: 2,
      },
    ],
  },

  // ─── Module 5: Aggregate Functions ───
  {
    id: 'mod-5',
    title: 'Aggregate Functions',
    lessons: [
      {
        id: 'm5-l1',
        title: 'COUNT, SUM, AVG, MIN, MAX',
        objectives: [
          'Understand how aggregate functions summarize data',
          'Master COUNT, SUM, AVG, MIN, and MAX',
          'Learn the difference between COUNT(*) and COUNT(column)',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What Are Aggregate Functions?</h2>
            <p>Aggregate functions perform a calculation on a set of rows and return a single value. Instead of showing you every row, they summarize the data — like asking "What's the class average?" instead of checking every student's grade.</p>
            
            <h3>The Five Essential Aggregates</h3>
            <pre><code>-- Total number of employees
SELECT COUNT(*) AS total_employees FROM employees;

-- Average salary (if salary column existed)
SELECT AVG(salary) AS avg_salary FROM employees;

-- Total payroll
SELECT SUM(salary) AS total_payroll FROM employees;

-- Highest and lowest values
SELECT MAX(salary) AS highest, MIN(salary) AS lowest FROM employees;

-- All in one query
SELECT 
  COUNT(*) AS total,
  AVG(salary) AS average,
  SUM(salary) AS total_payroll,
  MAX(salary) AS max_salary,
  MIN(salary) AS min_salary
FROM employees;</code></pre>
            
            <h3>COUNT(*) vs. COUNT(column)</h3>
            <p><code>COUNT(*)</code> counts ALL rows including those with NULL values. <code>COUNT(column_name)</code> counts only non-NULL values in that column.</p>
            <pre><code>SELECT 
  COUNT(*) AS all_rows,
  COUNT(salary) AS salaries_recorded,
  COUNT(DISTINCT dept_id) AS unique_departments
FROM employees;</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Important:</strong> Aggregate functions ignore NULL values (except COUNT(*)). If salary is NULL for some employees, AVG(salary) divides by the count of non-NULL salaries only.</p>
            </div>
            
            <h3>Using Aggregates with WHERE</h3>
            <pre><code>-- Average salary of Developers only
SELECT AVG(salary) AS dev_avg_salary 
FROM employees 
WHERE role = 'Developer';</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Aggregate functions summarize multiple rows into a single result</li>
              <li>COUNT counts rows; SUM adds values; AVG calculates average</li>
              <li>MAX finds the largest value; MIN finds the smallest</li>
              <li>COUNT(*) counts all rows; COUNT(col) counts non-NULL values</li>
              <li>COUNT(DISTINCT col) counts unique values</li>
              <li>Aggregates ignore NULLs (except COUNT(*))</li>
            </ul>
            <p><strong>Real-world use:</strong> Dashboards use aggregates everywhere: "Total users this month", "Average order value", "Most popular product", "Revenue by quarter".</p>
          </div>
        `,
        defaultCode: `-- Since employees table doesn't have salary, let's add it
ALTER TABLE employees ADD COLUMN salary REAL;

-- Update some salaries
UPDATE employees SET salary = 80000 WHERE name = 'Alice';
UPDATE employees SET salary = 90000 WHERE name = 'Bob';
UPDATE employees SET salary = 65000 WHERE name = 'Charlie';
UPDATE employees SET salary = 55000 WHERE name = 'Diana';

-- Now use aggregate functions
SELECT 
  COUNT(*) AS total_employees,
  AVG(salary) AS avg_salary,
  SUM(salary) AS total_payroll,
  MAX(salary) AS max_salary,
  MIN(salary) AS min_salary
FROM employees;`,
      },
      {
        id: 'm5-l2',
        title: 'DISTINCT & NULL Handling in Aggregates',
        objectives: [
          'Use DISTINCT to count unique values',
          'Handle NULL values properly in aggregate calculations',
          'Use COALESCE to replace NULLs with defaults',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Working with DISTINCT and NULL</h2>
            
            <h3>DISTINCT with Aggregates</h3>
            <p>Sometimes you want to count unique values, not all values. <code>DISTINCT</code> inside an aggregate function removes duplicates before calculating:</p>
            <pre><code>-- How many different roles exist?
SELECT COUNT(DISTINCT role) AS unique_roles FROM employees;

-- How many different departments have employees?
SELECT COUNT(DISTINCT dept_id) AS depts_with_staff FROM employees;</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Analogy:</strong> Imagine a list: Apple, Banana, Apple, Cherry. COUNT(fruit) = 4. COUNT(DISTINCT fruit) = 3 (Apple, Banana, Cherry).</p>
            </div>
            
            <h3>NULL Handling with COALESCE and IFNULL</h3>
            <p>NULL represents "unknown" or "no value". Aggregates handle NULLs in specific ways:</p>
            <pre><code>-- COUNT(*) includes NULL rows
-- COUNT(column) excludes NULL rows
-- AVG, SUM, MAX, MIN all skip NULLs

-- Replace NULL with a default value
SELECT 
  name,
  COALESCE(salary, 0) AS salary_or_zero,    -- Standard SQL
  IFNULL(salary, 0) AS salary_ifnull       -- SQLite-specific
FROM employees;</code></pre>
            
            <h3>Practical Examples</h3>
            <pre><code>-- Count employees who have a salary recorded
SELECT COUNT(salary) FROM employees;

-- Calculate the average, treating missing salaries as 0
SELECT AVG(IFNULL(salary, 0)) AS avg_including_nulls FROM employees;

-- Total salary paid (NULLs contribute nothing)
SELECT SUM(salary) FROM employees;</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>COUNT(DISTINCT col) counts unique non-NULL values</li>
              <li>Most aggregates skip NULLs — COUNT(*) is the exception</li>
              <li>COALESCE(col, default) replaces NULL with a default value</li>
              <li>IFNULL is SQLite's simpler NULL-replacement function</li>
              <li>Use IFNULL/COALESCE before aggregates to control how NULLs are treated</li>
            </ul>
            <p><strong>Real-world use:</strong> In analytics, you often want to know "how many unique customers" (COUNT DISTINCT) and "what's the average order value excluding returns" (AVG with WHERE).</p>
          </div>
        `,
        defaultCode: `-- Add some NULL salaries
INSERT INTO employees (name, role, dept_id) VALUES 
  ('Eve', 'Intern', 1);

-- See NULL handling
SELECT 
  COUNT(*) AS total_employees,
  COUNT(salary) AS with_salary,
  COUNT(DISTINCT role) AS unique_roles
FROM employees;

-- COALESCE to handle NULLs
SELECT name, COALESCE(salary, 0) AS effective_salary
FROM employees;`,
      },
      {
        id: 'm5-l3',
        title: 'Conditional Aggregation with CASE',
        objectives: [
          'Use CASE expressions inside aggregate functions',
          'Perform conditional counts and sums in a single query',
          'Understand the IIF() function in SQLite',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Conditional Aggregation</h2>
            <p><strong>Conditional aggregation</strong> lets you count or sum only rows that meet specific conditions — all in a single query. It's like having multiple counters running at the same time, each counting different things.</p>
            
            <h3>Using CASE Inside Aggregates</h3>
            <pre><code>-- Count employees by role category
SELECT 
  COUNT(*) AS total,
  SUM(CASE WHEN role = 'Developer' THEN 1 ELSE 0 END) AS developers,
  SUM(CASE WHEN role = 'Manager' THEN 1 ELSE 0 END) AS managers,
  SUM(CASE WHEN role NOT IN ('Developer', 'Manager') THEN 1 ELSE 0 END) AS other
FROM employees;

-- Conditional sum: total salary of Developers only
SELECT 
  SUM(CASE WHEN role = 'Developer' THEN salary ELSE 0 END) AS dev_payroll,
  SUM(CASE WHEN role = 'Manager' THEN salary ELSE 0 END) AS mgr_payroll
FROM employees;</code></pre>
            
            <h3>SQLite's IIF() Function</h3>
            <p>SQLite has a shorthand <code>IIF()</code> function (Immediate IF) that works like CASE:</p>
            <pre><code>-- IIF(condition, true_value, false_value)
SELECT 
  COUNT(*) AS total,
  SUM(IIF(role = 'Developer', 1, 0)) AS developers
FROM employees;</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> Conditional aggregation is much more efficient than running multiple separate queries. One pass through the data answers all questions at once!</p>
            </div>
            
            <h3>Multiple Conditions in CASE</h3>
            <pre><code>SELECT 
  role,
  COUNT(*) AS count,
  AVG(salary) AS avg_salary,
  SUM(IIF(salary > 70000, 1, 0)) AS high_earners
FROM employees
GROUP BY role;</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>CASE expressions inside aggregates enable conditional counting/summing</li>
              <li>SUM(CASE WHEN condition THEN 1 ELSE 0 END) = count of matching rows</li>
              <li>IIF(condition, value_if_true, value_if_false) is SQLite's shorthand for simple CASE</li>
              <li>Conditional aggregation is more efficient than multiple separate queries</li>
              <li>You can combine GROUP BY with conditional aggregates for pivot-like analysis</li>
            </ul>
            <p><strong>Real-world use:</strong> A sales dashboard might show "orders under $50", "orders $50-$100", and "orders over $100" using conditional SUM in a single query.</p>
          </div>
        `,
        defaultCode: `-- Conditional aggregation with CASE
SELECT 
  COUNT(*) AS total_employees,
  SUM(CASE WHEN role = 'Developer' THEN 1 ELSE 0 END) AS developers,
  SUM(CASE WHEN role = 'Manager' THEN 1 ELSE 0 END) AS managers,
  SUM(CASE WHEN role = 'Designer' THEN 1 ELSE 0 END) AS designers,
  SUM(CASE WHEN role = 'Intern' THEN 1 ELSE 0 END) AS interns
FROM employees;

-- Using IIF()
SELECT 
  COUNT(*) AS total,
  SUM(IIF(dept_id = 1, 1, 0)) AS engineering,
  SUM(IIF(dept_id = 2, 1, 0)) AS marketing
FROM employees;`,
      },
    ],
    quiz: [
      {
        id: 'm5-q1',
        question: 'Which aggregate function would you use to find the highest value in a column?',
        options: ['COUNT', 'MAX', 'TOP', 'HIGHEST'],
        correct: 1,
      },
      {
        id: 'm5-q2',
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
        id: 'm5-q3',
        question: 'How do you count unique values in a column?',
        options: ['COUNT(UNIQUE col)', 'COUNT(DISTINCT col)', 'UNIQUE(COUNT col)', 'DISTINCT(COUNT col)'],
        correct: 1,
      },
      {
        id: 'm5-q4',
        question: 'What does the IIF() function do in SQLite?',
        options: [
          'Returns the first non-NULL value',
          'An inline IF-THEN-ELSE: IIF(condition, true_val, false_val)',
          'Converts a value to an integer',
          'Imports an external function',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 6: GROUP BY & HAVING ───
  {
    id: 'mod-6',
    title: 'GROUP BY & HAVING',
    lessons: [
      {
        id: 'm6-l1',
        title: 'Grouping Data with GROUP BY',
        objectives: [
          'Understand how GROUP BY partitions data into groups',
          'Combine GROUP BY with aggregate functions for per-group statistics',
          'Learn the order of operations: WHERE → GROUP BY → HAVING → ORDER BY',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Splitting Data into Groups</h2>
            <p><code>GROUP BY</code> groups rows that have the same values in specified columns into summary rows. It's like sorting LEGO bricks by color — you put all red bricks in one pile, all blue bricks in another, then count each pile.</p>
            
            <h3>Basic GROUP BY</h3>
            <pre><code>-- How many employees in each role?
SELECT role, COUNT(*) AS count
FROM employees
GROUP BY role;

-- Average salary by department
SELECT d.dept_name, AVG(e.salary) AS avg_salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
GROUP BY d.dept_name;</code></pre>
            
            <h3>The ORDER of Operations</h3>
            <p>SQL processes queries in this logical order:</p>
            <ol>
              <li><strong>FROM / JOIN</strong> — Get the source data</li>
              <li><strong>WHERE</strong> — Filter individual rows</li>
              <li><strong>GROUP BY</strong> — Group rows together</li>
              <li><strong>HAVING</strong> — Filter groups</li>
              <li><strong>SELECT</strong> — Choose columns and compute expressions</li>
              <li><strong>ORDER BY</strong> — Sort the final result</li>
            </ol>
            
            <pre><code>SELECT role, COUNT(*) AS emp_count, AVG(salary) AS avg_salary
FROM employees
WHERE dept_id = 1  -- Filter rows first
GROUP BY role       -- Then group
HAVING COUNT(*) > 0 -- Then filter groups
ORDER BY emp_count DESC;  -- Finally sort</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Important:</strong> Every column in the SELECT clause must either appear in GROUP BY or be wrapped in an aggregate function. Otherwise, SQLite doesn't know which value from the group to show.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>GROUP BY groups rows with the same values into summary rows</li>
              <li>Use aggregates (COUNT, SUM, AVG) inside GROUP BY queries</li>
              <li>All non-aggregated columns in SELECT must be in GROUP BY</li>
              <li>Logical order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY</li>
              <li>GROUP BY collapses multiple rows into one row per group</li>
            </ul>
            <p><strong>Real-world use:</strong> "Show me total sales by region" or "Count users by signup month" or "Average response time by support agent."</p>
          </div>
        `,
        defaultCode: `-- Count employees by role
SELECT role, COUNT(*) AS count
FROM employees
GROUP BY role;

-- Average salary by department
SELECT d.dept_name, COUNT(e.id) AS emp_count, AVG(e.salary) AS avg_salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
GROUP BY d.dept_name;

-- Multiple groupings
SELECT role, dept_id, COUNT(*) AS count
FROM employees
GROUP BY role, dept_id
ORDER BY role, dept_id;`,
      },
      {
        id: 'm6-l2',
        title: 'Filtering Groups with HAVING',
        objectives: [
          'Understand the difference between WHERE (filter rows) and HAVING (filter groups)',
          'Use HAVING with aggregate conditions',
          'Combine WHERE, GROUP BY, HAVING, and ORDER BY in a single query',
        ],
        content: `
          <div class="lesson-prose">
            <h2>HAVING: Filtering Groups</h2>
            <p>While <code>WHERE</code> filters individual rows <em>before</em> grouping, <code>HAVING</code> filters groups <em>after</em> grouping. Think of it like:</p>
            <ul>
              <li>WHERE = "Only use red bricks" (filter individual items before sorting)</li>
              <li>HAVING = "Only show piles with more than 10 bricks" (filter the piles after sorting)</li>
            </ul>
            
            <h3>HAVING Examples</h3>
            <pre><code>-- Roles with more than 1 employee
SELECT role, COUNT(*) AS count
FROM employees
GROUP BY role
HAVING COUNT(*) > 1;

-- Departments with average salary above $70,000
SELECT d.dept_name, AVG(e.salary) AS avg_salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
GROUP BY d.dept_name
HAVING AVG(e.salary) > 70000;</code></pre>
            
            <h3>Complete Example: WHERE + GROUP BY + HAVING + ORDER BY</h3>
            <pre><code>SELECT 
  role, 
  COUNT(*) AS emp_count, 
  AVG(salary) AS avg_salary
FROM employees
WHERE salary IS NOT NULL         -- Step 1: Remove rows with no salary
GROUP BY role                     -- Step 2: Group by role
HAVING COUNT(*) >= 1              -- Step 3: Only roles with at least 1 employee
ORDER BY avg_salary DESC;         -- Step 4: Highest average salary first</code></pre>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Common Mistake:</strong> You cannot use aggregate functions in WHERE because WHERE runs before grouping. <code>WHERE COUNT(*) > 1</code> is invalid! Use HAVING for aggregate conditions.</p>
            </div>
            
            <h3>HAVING with Complex Conditions</h3>
            <pre><code>SELECT role, COUNT(*) AS count, AVG(salary) AS avg_salary
FROM employees
GROUP BY role
HAVING COUNT(*) > 1 AND AVG(salary) > 50000;</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>WHERE filters rows BEFORE grouping; HAVING filters groups AFTER grouping</li>
              <li>HAVING can use aggregate functions (COUNT, AVG, SUM, etc.)</li>
              <li>WHERE cannot use aggregate functions</li>
              <li>Logical order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY</li>
              <li>Use HAVING when you need to filter based on group calculations</li>
            </ul>
            <p><strong>Real-world use:</strong> "Show me product categories with more than 100 items in stock" (HAVING COUNT > 100) or "Customers who have spent more than $1000 total" (HAVING SUM > 1000).</p>
          </div>
        `,
        defaultCode: `-- Add more employees for meaningful grouping
INSERT INTO employees (name, role, dept_id, salary) VALUES 
  ('Frank', 'Developer', 1, 85000),
  ('Grace', 'Manager', 2, 72000),
  ('Hank', 'Developer', 1, 78000);

-- Roles with more than 1 employee
SELECT role, COUNT(*) AS count
FROM employees
GROUP BY role
HAVING COUNT(*) > 1;

-- Roles with average salary above 70,000
SELECT role, COUNT(*) AS count, AVG(salary) AS avg_salary
FROM employees
GROUP BY role
HAVING AVG(salary) > 70000;`,
      },
    ],
    quiz: [
      {
        id: 'm6-q1',
        question: 'What is the difference between WHERE and HAVING?',
        options: [
          'WHERE filters rows, HAVING filters groups',
          'There is no difference',
          'WHERE is for SELECT only, HAVING is for INSERT',
          'WHERE runs after GROUP BY, HAVING runs before',
        ],
        correct: 0,
      },
      {
        id: 'm6-q2',
        question: 'Which clause filters groups created by GROUP BY?',
        options: ['WHERE', 'HAVING', 'FILTER', 'LIMIT'],
        correct: 1,
      },
      {
        id: 'm6-q3',
        question: 'In the logical order of operations, which comes first?',
        options: ['GROUP BY', 'HAVING', 'WHERE', 'ORDER BY'],
        correct: 2,
      },
      {
        id: 'm6-q4',
        question: 'What rule applies to non-aggregated columns in a GROUP BY query\'s SELECT clause?',
        options: [
          'They must be NULL',
          'They must be in the GROUP BY clause',
          'They must be unique',
          'They must be indexed',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 7: Subqueries & CTEs ───
  {
    id: 'mod-7',
    title: 'Subqueries & CTEs',
    lessons: [
      {
        id: 'm7-l1',
        title: 'Subqueries (Nested SELECT)',
        objectives: [
          'Understand what a subquery is and how it works',
          'Use scalar, row, and table subqueries in different contexts',
          'Master subqueries with IN, EXISTS, and comparison operators',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What is a Subquery?</h2>
            <p>A <strong>subquery</strong> is a SELECT statement nested inside another SQL statement. It's like asking a question within a question — "Find me employees who earn more than the average salary" requires first calculating the average, then finding who exceeds it.</p>
            
            <h3>Scalar Subqueries (Single Value)</h3>
            <pre><code>-- Find employees earning more than average
SELECT name, salary 
FROM employees 
WHERE salary > (SELECT AVG(salary) FROM employees);</code></pre>
            
            <h3>Row Subqueries (Single Row)</h3>
            <pre><code>-- Find employees with the same role as Alice
SELECT name, role 
FROM employees 
WHERE role = (SELECT role FROM employees WHERE name = 'Alice');</code></pre>
            
            <h3>Table Subqueries (Multiple Rows)</h3>
            <pre><code>-- Find employees in departments with high budgets
SELECT * FROM employees 
WHERE dept_id IN (
  SELECT id FROM departments 
  WHERE dept_name IN ('Engineering', 'Marketing')
);</code></pre>
            
            <h3>Subqueries with EXISTS</h3>
            <pre><code>-- Find departments that have at least one employee
SELECT * FROM departments d
WHERE EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.dept_id = d.id
);</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Performance Tip:</strong> For large datasets, <code>EXISTS</code> is often faster than <code>IN</code> because it stops searching as soon as it finds a match. Use EXISTS when checking for existence, IN when you have a list of specific values.</p>
            </div>
            
            <h3>Subqueries in FROM (Derived Tables)</h3>
            <pre><code>SELECT dept_name, avg_salary
FROM (
  SELECT d.dept_name, AVG(e.salary) AS avg_salary
  FROM employees e
  JOIN departments d ON e.dept_id = d.id
  GROUP BY d.dept_name
)
WHERE avg_salary > 60000;</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>A subquery is a SELECT nested inside another SQL statement</li>
              <li>Scalar subqueries return a single value (used with =, >, <)</li>
              <li>Table subqueries return multiple rows (used with IN, EXISTS)</li>
              <li>EXISTS checks if any rows match; IN checks if a value is in a list</li>
              <li>Subqueries can appear in SELECT, FROM, WHERE, and HAVING clauses</li>
              <li>Subqueries in FROM must have an alias (derived tables)</li>
            </ul>
            <p><strong>Real-world use:</strong> "Find customers who haven't made a purchase in 30 days" uses a subquery with NOT EXISTS. "Find products that cost more than the average" uses a scalar subquery.</p>
          </div>
        `,
        defaultCode: `-- Scalar subquery: find employees earning above average
SELECT name, salary 
FROM employees 
WHERE salary > (SELECT AVG(salary) FROM employees);

-- EXISTS: find departments with employees
SELECT * FROM departments d
WHERE EXISTS (
  SELECT 1 FROM employees e WHERE e.dept_id = d.id
);

-- Subquery in FROM: department averages
SELECT * FROM (
  SELECT d.dept_name, AVG(e.salary) AS avg_salary
  FROM employees e
  JOIN departments d ON e.dept_id = d.id
  GROUP BY d.dept_name
) WHERE avg_salary IS NOT NULL;`,
      },
      {
        id: 'm7-l2',
        title: 'Common Table Expressions (CTEs) & Recursive CTEs',
        objectives: [
          'Understand how WITH (CTE) simplifies complex queries',
          'Write multi-step queries using CTEs',
          'Use recursive CTEs for hierarchical data like org charts',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What is a CTE?</h2>
            <p>A <strong>Common Table Expression</strong> (CTE) is a temporary named result set that you can reference within a query. It's like a <strong>sticky note</strong> where you write down a partial result to use later — making complex queries much easier to read.</p>
            
            <h3>Basic CTE Syntax</h3>
            <pre><code>WITH role_stats AS (
  SELECT role, COUNT(*) AS count, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY role
)
SELECT * FROM role_stats WHERE count > 1;</code></pre>
            
            <h3>Multiple CTEs</h3>
            <pre><code>WITH 
  engineering AS (
    SELECT * FROM employees WHERE dept_id = 1
  ),
  department_info AS (
    SELECT * FROM departments
  )
SELECT e.name, e.role, d.dept_name
FROM engineering e
JOIN department_info d ON e.dept_id = d.id;</code></pre>
            
            <h3>Recursive CTEs</h3>
            <p>Recursive CTEs reference themselves to traverse hierarchical data. They need:</p>
            <ol>
              <li><strong>Anchor member</strong> — The initial query (starting point)</li>
              <li><strong>Recursive member</strong> — The recursive step (UNION ALL with the CTE name)</li>
              <li><strong>Termination condition</strong> — When no more rows are returned</li>
            </ol>
            
            <pre><code>-- Generate a number sequence 1 through 10
WITH RECURSIVE numbers(n) AS (
  SELECT 1                        -- Anchor: start at 1
  UNION ALL
  SELECT n + 1 FROM numbers       -- Recursive: add 1 each time
  WHERE n < 10                    -- Termination: stop at 10
)
SELECT * FROM numbers;</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> CTEs make queries more readable by breaking them into named steps. They're especially useful for the same subquery used multiple times — define it once, reference it many times!</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>CTEs (WITH clause) create temporary named query results</li>
              <li>CTEs make complex queries more readable and maintainable</li>
              <li>Multiple CTEs can be defined in a single WITH clause</li>
              <li>Recursive CTEs use UNION ALL and self-reference for hierarchical data</li>
              <li>Recursive CTEs need an anchor member + recursive member + termination</li>
              <li>Use CTEs when the same subquery appears multiple times in a query</li>
            </ul>
            <p><strong>Real-world use:</strong> Organization charts (who reports to whom), category trees (parent/child categories), route planning, and number/date series generation.</p>
          </div>
        `,
        defaultCode: `-- Basic CTE
WITH dev_stats AS (
  SELECT COUNT(*) AS count, AVG(salary) AS avg_salary
  FROM employees
  WHERE role = 'Developer'
)
SELECT * FROM dev_stats;

-- Recursive CTE: count to 10
WITH RECURSIVE counter(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM counter WHERE n < 10
)
SELECT * FROM counter;

-- Multiple CTEs
WITH 
  dept_counts AS (
    SELECT dept_id, COUNT(*) AS count 
    FROM employees GROUP BY dept_id
  )
SELECT d.dept_name, dc.count
FROM departments d
JOIN dept_counts dc ON d.id = dc.dept_id;`,
      },
    ],
    quiz: [
      {
        id: 'm7-q1',
        question: 'What is a subquery?',
        options: [
          'A query that runs faster than a normal query',
          'A SELECT statement nested inside another SQL statement',
          'A query that returns no results',
          'A query with syntax errors',
        ],
        correct: 1,
      },
      {
        id: 'm7-q2',
        question: 'What does the EXISTS keyword do in a subquery?',
        options: [
          'Checks if a table exists',
          'Returns true if the subquery returns at least one row',
          'Creates a new table if one doesn\'t exist',
          'Checks if a column exists in a table',
        ],
        correct: 1,
      },
      {
        id: 'm7-q3',
        question: 'What is a CTE (Common Table Expression)?',
        options: [
          'A permanent view stored in the database',
          'A temporary named result set defined with WITH',
          'A type of index for faster queries',
          'A constraint that applies to multiple tables',
        ],
        correct: 1,
      },
      {
        id: 'm7-q4',
        question: 'What two parts make up a recursive CTE?',
        options: [
          'SELECT and FROM',
          'Anchor member and recursive member (UNION ALL)',
          'INNER JOIN and OUTER JOIN',
          'WHERE and HAVING',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 8: Views ───
  {
    id: 'mod-8',
    title: 'Views',
    lessons: [
      {
        id: 'm8-l1',
        title: 'Creating & Using Views',
        objectives: [
          'Understand what a view is and why it\'s useful',
          'Create views to simplify complex queries',
          'Use views for security and consistency',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What is a View?</h2>
            <p>A <strong>view</strong> is a virtual table based on the result of a SELECT query. It doesn't store data physically — it's just a saved query that acts like a table. Think of it as a <strong>TV channel</strong> that curates content from various sources into one convenient stream.</p>
            
            <h3>Creating a View</h3>
            <pre><code>-- Create a view that joins employees and departments
CREATE VIEW employee_details AS
SELECT e.id, e.name, e.role, e.salary, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.id;

-- Now query it like a regular table!
SELECT * FROM employee_details;
SELECT * FROM employee_details WHERE dept_name = 'Engineering';</code></pre>
            
            <h3>Why Use Views?</h3>
            <ul>
              <li><strong>Simplify complex queries</strong> — Write that 10-line JOIN once, save it as a view, then SELECT from it easily.</li>
              <li><strong>Security</strong> — Create a view that exposes only certain columns (hide salaries, for example) and give users access to the view instead of the table.</li>
              <li><strong>Consistency</strong> — Everyone on the team uses the same view definition, ensuring consistent results.</li>
              <li><strong>Abstraction</strong> — If the underlying table structure changes, you can modify the view without breaking applications that query it.</li>
            </ul>
            
            <h3>Managing Views</h3>
            <pre><code>-- Drop a view
DROP VIEW IF EXISTS employee_details;

-- View the view definition
SELECT sql FROM sqlite_master WHERE type='view';</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Analogy:</strong> A view is like a <strong>custom lens</strong> through which you see your data. The data stays where it is — the lens just shows you a specific perspective. Different users can have different lenses!</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>A view is a saved SELECT query that behaves like a virtual table</li>
              <li>Views don't store data — they reference the underlying tables</li>
              <li>Use views to simplify complex JOINs and aggregations</li>
              <li>Views provide security by limiting which columns/rows users can see</li>
              <li>CREATE VIEW saves a view; DROP VIEW removes it</li>
              <li>Query sqlite_master to see view definitions</li>
            </ul>
            <p><strong>Real-world use:</strong> A reporting system might have views for "Monthly Sales Summary", "Active Users", or "Inventory Alerts" — each combining data from multiple tables into easy-to-query virtual tables.</p>
          </div>
        `,
        defaultCode: `-- Create a view
CREATE VIEW employee_details AS
SELECT e.id, e.name, e.role, e.salary, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.id;

-- Query the view
SELECT * FROM employee_details;

-- Use the view with filters
SELECT name, role, dept_name 
FROM employee_details 
WHERE dept_name = 'Engineering';

-- See view definition
SELECT sql FROM sqlite_master WHERE type='view';`,
      },
      {
        id: 'm8-l2',
        title: 'Updatable Views & View Best Practices',
        objectives: [
          'Understand when views can be updated (INSERT/UPDATE/DELETE)',
          'Learn the limitations of updatable views',
          'Use TEMP views for session-scoped virtual tables',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Updatable Views</h2>
            <p>Some views allow you to INSERT, UPDATE, or DELETE data through them. But there are <strong>strict rules</strong>:</p>
            
            <h3>When a View is Updatable</h3>
            <p>A view can be updated if it meets ALL these conditions:</p>
            <ul>
              <li>Based on a single table (no JOINs)</li>
              <li>No aggregate functions (COUNT, SUM, AVG, etc.)</li>
              <li>No GROUP BY, HAVING, or DISTINCT</li>
              <li>No subqueries in the SELECT list</li>
              <li>No set operations (UNION, INTERSECT, EXCEPT)</li>
            </ul>
            
            <pre><code>-- This view IS updatable (simple, single table)
CREATE VIEW developer_view AS
SELECT id, name, role, salary
FROM employees
WHERE role = 'Developer';

-- This works! Updates underlying employees table
UPDATE developer_view SET salary = 95000 WHERE name = 'Alice';

-- This view is NOT updatable (has JOIN)
CREATE VIEW dept_summary AS
SELECT d.dept_name, COUNT(e.id) AS emp_count
FROM departments d
LEFT JOIN employees e ON d.id = e.dept_id
GROUP BY d.dept_name;</code></pre>
            
            <h3>Temporary Views</h3>
            <p><strong>Temporary views</strong> exist only for the duration of your database connection. They're like sticky notes that you throw away after you're done:</p>
            <pre><code>CREATE TEMP VIEW high_earners AS
SELECT * FROM employees WHERE salary > 70000;

-- This view disappears when the connection closes</code></pre>
            
            <h3>Best Practices</h3>
            <ul>
              <li>Name views descriptively (e.g., <code>active_customers_v</code> or <code>sales_summary_view</code>)</li>
              <li>Document complex views so others understand what they do</li>
              <li>Don't nest views (a view that queries another view) — it's confusing and slow</li>
              <li>Use views for <strong>presentation</strong> (formatting, joining, filtering) not for <strong>business logic</strong></li>
              <li>Drop views you no longer need to keep the database clean</li>
            </ul>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Limitation:</strong> SQLite views are <strong>read-only</strong> by default for complex views. Simple single-table views can be updated. Check the documentation for your SQLite version.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Simple single-table views can be updated (INSERT/UPDATE/DELETE)</li>
              <li>Complex views (JOINs, aggregates, GROUP BY) are read-only</li>
              <li>Temporary views (CREATE TEMP VIEW) last only for the session</li>
              <li>Use views for presentation and simplicity, not business logic</li>
              <li>Don't nest views — it leads to confusing, poor-performing queries</li>
              <li>Drop unused views with DROP VIEW IF EXISTS</li>
            </ul>
            <p><strong>Real-world use:</strong> A "CustomerOrders" view that shows order details with customer names is a common reporting pattern. A "CurrentInventory" view might filter out discontinued products.</p>
          </div>
        `,
        defaultCode: `-- Create a simple (potentially updatable) view
CREATE VIEW high_salary AS
SELECT id, name, role, salary
FROM employees
WHERE salary > 70000;

-- Query it
SELECT * FROM high_salary;

-- Try updating through the view
UPDATE high_salary SET role = 'Senior Staff' WHERE name = 'Bob';

-- Verify the underlying table was updated
SELECT name, role, salary FROM employees WHERE name = 'Bob';

-- Create a temporary view
CREATE TEMP VIEW role_count AS
SELECT role, COUNT(*) AS count
FROM employees
GROUP BY role;

SELECT * FROM role_count;`,
      },
    ],
    quiz: [
      {
        id: 'm8-q1',
        question: 'What is a view in SQLite?',
        options: [
          'A physical copy of a table',
          'A virtual table based on a saved SELECT query',
          'A special type of index',
          'A constraint that applies to multiple columns',
        ],
        correct: 1,
      },
      {
        id: 'm8-q2',
        question: 'Which of these views would likely be updatable?',
        options: [
          'A view with JOINs',
          'A view with GROUP BY',
          'A simple view based on a single table',
          'A view with aggregate functions',
        ],
        correct: 2,
      },
      {
        id: 'm8-q3',
        question: 'How long does a TEMP VIEW last?',
        options: [
          'Until the database file is deleted',
          'Until the connection closes',
          'For 24 hours',
          'Permanently, until DROP VIEW is called',
        ],
        correct: 1,
      },
      {
        id: 'm8-q4',
        question: 'What is NOT a good use of a view?',
        options: [
          'Simplifying complex JOIN queries',
          'Hiding sensitive columns from certain users',
          'Implementing complex business logic with side effects',
          'Providing a consistent interface to changing table structures',
        ],
        correct: 2,
      },
    ],
  },

  // ─── Module 9: Transactions ───
  {
    id: 'mod-9',
    title: 'Transactions (BEGIN/COMMIT/ROLLBACK)',
    lessons: [
      {
        id: 'm9-l1',
        title: 'BEGIN, COMMIT & ROLLBACK',
        objectives: [
          'Understand what transactions are and why they matter',
          'Use BEGIN, COMMIT, and ROLLBACK to control transactions',
          'Learn how transactions improve performance for bulk operations',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What is a Transaction?</h2>
            <p>A <strong>transaction</strong> is a group of database operations that are executed as a single unit. Either ALL of them succeed, or NONE of them do. It's like a bank transfer — if subtracting $100 from Account A succeeds but adding $100 to Account B fails, the whole operation should be undone.</p>
            
            <h3>Transaction Control Statements</h3>
            <pre><code>-- Start a transaction
BEGIN TRANSACTION;

-- Perform operations
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If everything is good, save the changes
COMMIT;

-- If something went wrong, undo everything
-- ROLLBACK;</code></pre>
            
            <h3>Transactions for Performance</h3>
            <p>Each INSERT/UPDATE/DELETE normally creates a transaction. For bulk operations, wrapping everything in one transaction is dramatically faster:</p>
            <pre><code>-- Slow: 1000 separate transactions
-- (each INSERT creates its own transaction)
INSERT INTO logs VALUES (1, 'entry');
INSERT INTO logs VALUES (2, 'entry');
-- ... 998 more

-- Fast: One transaction for 1000 inserts
BEGIN TRANSACTION;
INSERT INTO logs VALUES (1, 'entry');
-- ... 999 more
COMMIT;</code></pre>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Performance Tip:</strong> Wrapping 1000 INSERTs in a single transaction can be <strong>100x faster</strong> than 1000 separate auto-commit INSERTs! This is because the database only has to write to disk once instead of 1000 times.</p>
            </div>
            
            <h3>Savepoints</h3>
            <p>SQLite supports <strong>savepoints</strong> — named points within a transaction that you can roll back to without ending the whole transaction:</p>
            <pre><code>BEGIN;
INSERT INTO employees (name, role) VALUES ('Test', 'Temp');
SAVEPOINT before_update;
UPDATE employees SET salary = 999999 WHERE name = 'Alice';
-- Oops, that was a mistake!
ROLLBACK TO before_update;
-- The salary update is undone, but the INSERT is still there
COMMIT;</code></pre>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Transactions group operations into an all-or-nothing unit</li>
              <li>BEGIN starts a transaction; COMMIT saves it; ROLLBACK undoes it</li>
              <li>Transactions protect against partial failures (like interrupted bank transfers)</li>
              <li>Bulk operations are much faster inside a single transaction</li>
              <li>Savepoints allow partial rollbacks within a transaction</li>
              <li>SQLite automatically wraps single statements in transactions</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce checkout: deducting inventory + creating order + charging customer should all happen in one transaction. If the payment fails, inventory isn't deducted.</p>
          </div>
        `,
        defaultCode: `-- Demonstrate a transaction
BEGIN TRANSACTION;

INSERT INTO employees (name, role, dept_id, salary) 
VALUES ('Test User', 'Tester', 1, 60000);

SELECT 'After INSERT (before commit)' AS phase, name, role FROM employees WHERE name = 'Test User';

-- Now roll back the insert
ROLLBACK;

SELECT 'After ROLLBACK' AS phase, name, role FROM employees WHERE name = 'Test User';

-- Note: Test User is gone because we rolled back!
-- Now try a real transaction with COMMIT
BEGIN TRANSACTION;
INSERT INTO employees (name, role, dept_id, salary) 
VALUES ('Persistent User', 'Manager', 2, 75000);
COMMIT;

SELECT * FROM employees WHERE name = 'Persistent User';`,
      },
      {
        id: 'm9-l2',
        title: 'ACID Properties & Concurrency',
        objectives: [
          'Understand the four ACID properties that transactions guarantee',
          'Learn how SQLite handles concurrent access with locking',
          'Use PRAGMA statements to configure transaction behavior',
        ],
        content: `
          <div class="lesson-prose">
            <h2>The ACID Properties</h2>
            <p>ACID is an acronym for the four guarantees that database transactions provide:</p>
            
            <h3>Atomicity — All or Nothing</h3>
            <p>Like an atom that cannot be split, a transaction's operations either <strong>all</strong> complete successfully, or <strong>none</strong> of them take effect. If the power fails mid-transaction, the database returns to its previous state.</p>
            
            <h3>Consistency — Always Follow the Rules</h3>
            <p>A transaction brings the database from one valid state to another valid state. All constraints, triggers, and rules are maintained. No transaction can create invalid data.</p>
            
            <h3>Isolation — Invisible Until Done</h3>
            <p>Other users can't see partial results of an uncommitted transaction. If Alice transfers money to Bob, Bob can't see the new balance until Alice's transaction is committed.</p>
            
            <h3>Durability — Once Saved, Forever Saved</h3>
            <p>Once a transaction is COMMITted, the changes are permanent — even if the power goes out immediately after. The data is safely stored on disk.</p>
            
            <h3>SQLite Concurrency & Locking</h3>
            <p>SQLite uses <strong>five locking states</strong> to manage concurrent access:</p>
            <ul>
              <li><strong>UNLOCKED</strong> — No one is accessing the database</li>
              <li><strong>SHARED</strong> — Multiple readers can read simultaneously (like a library — many people can read the same book)</li>
              <li><strong>RESERVED</strong> — A writer is about to write; readers can continue reading</li>
              <li><strong>PENDING</strong> — Writer is waiting to write; no new readers allowed</li>
              <li><strong>EXCLUSIVE</strong> — Writer is writing; nobody else can access (like a construction zone)</li>
            </ul>
            
            <h3>PRAGMA Statements for Transaction Control</h3>
            <pre><code>-- Busy timeout: wait 5 seconds before giving up on a locked database
PRAGMA busy_timeout = 5000;

-- Journal mode: Write-Ahead Logging (better concurrency)
PRAGMA journal_mode = WAL;

-- Synchronous mode: balance safety and speed
PRAGMA synchronous = NORMAL;</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 WAL Mode:</strong> In WAL (Write-Ahead Logging) mode, readers can read from the old data while a writer writes. This gives much better concurrent performance. Without WAL, a writer blocks all readers.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>ACID = Atomicity, Consistency, Isolation, Durability</li>
              <li>Atomicity ensures all-or-nothing execution</li>
              <li>Consistency maintains data integrity rules</li>
              <li>Isolation hides uncommitted changes from other users</li>
              <li>Durability guarantees committed changes survive failures</li>
              <li>SQLite uses a 5-state locking system for concurrency</li>
              <li>WAL mode allows concurrent reads during writes</li>
            </ul>
            <p><strong>Real-world use:</strong> Financial systems absolutely require all four ACID properties. A reservation system uses transactions to prevent double-booking (isolation ensures two people can't book the same seat simultaneously).</p>
          </div>
        `,
        defaultCode: `-- Check journal mode
PRAGMA journal_mode;

-- Set busy timeout (in milliseconds)
PRAGMA busy_timeout = 3000;

-- Set synchronous mode
PRAGMA synchronous = NORMAL;

-- Check current settings
PRAGMA synchronous;
PRAGMA journal_mode;

-- WAL mode demo
PRAGMA journal_mode = WAL;`,
      },
    ],
    quiz: [
      {
        id: 'm9-q1',
        question: 'What does the "A" in ACID stand for?',
        options: ['Atomicity', 'All-or-nothing', 'Automatic', 'Access'],
        correct: 0,
      },
      {
        id: 'm9-q2',
        question: 'Which SQL statement saves a transaction\'s changes permanently?',
        options: ['SAVE', 'COMMIT', 'APPLY', 'FINALIZE'],
        correct: 1,
      },
      {
        id: 'm9-q3',
        question: 'What SQLite feature allows concurrent reads during writes?',
        options: ['SHARED mode', 'WAL (Write-Ahead Logging)', 'EXCLUSIVE mode', 'READ_COMMITTED'],
        correct: 1,
      },
      {
        id: 'm9-q4',
        question: 'Why are bulk INSERTs faster inside a single transaction?',
        options: [
          'Transactions use less CPU',
          'The database only writes to disk once per transaction instead of once per INSERT',
          'Transactions compress the data automatically',
          'They aren\'t faster — they\'re actually slower',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 10: Triggers ───
  {
    id: 'mod-10',
    title: 'Triggers (Automatic Actions)',
    lessons: [
      {
        id: 'm10-l1',
        title: 'Creating Triggers',
        objectives: [
          'Understand what triggers are and when to use them',
          'Create triggers that fire on INSERT, UPDATE, and DELETE',
          'Use OLD and NEW references in triggers',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What is a Trigger?</h2>
            <p>A <strong>trigger</strong> is a set of SQL statements that automatically execute when a specified event occurs on a table. Think of it as a <strong>smart assistant</strong> that watches your database and performs tasks automatically — like a "thank you" auto-reply email when someone sends you a message.</p>
            
            <h3>Trigger Syntax</h3>
            <pre><code>CREATE TRIGGER trigger_name 
[BEFORE | AFTER] [INSERT | UPDATE | DELETE] ON table_name
BEGIN
  -- SQL statements to execute
END;</code></pre>
            
            <h3>Example: Automatic Audit Log</h3>
            <pre><code>-- Create an audit table
CREATE TABLE salary_audit (
  emp_name TEXT,
  old_salary REAL,
  new_salary REAL,
  changed_at TEXT
);

-- Create a trigger to log salary changes
CREATE TRIGGER log_salary_change 
AFTER UPDATE OF salary ON employees
BEGIN
  INSERT INTO salary_audit (emp_name, old_salary, new_salary, changed_at)
  VALUES (OLD.name, OLD.salary, NEW.salary, datetime('now'));
END;</code></pre>
            
            <h3>OLD and NEW References</h3>
            <p>Triggers have access to the row data using <strong>OLD</strong> and <strong>NEW</strong>:</p>
            <ul>
              <li><code>OLD.column</code> — The value BEFORE the change (available in UPDATE and DELETE triggers)</li>
              <li><code>NEW.column</code> — The value AFTER the change (available in INSERT and UPDATE triggers)</li>
            </ul>
            
            <h3>Trigger Types</h3>
            <pre><code>-- BEFORE INSERT: Validate or modify data before it's inserted
CREATE TRIGGER validate_salary 
BEFORE INSERT ON employees
BEGIN
  SELECT CASE 
    WHEN NEW.salary < 0 THEN RAISE(ABORT, 'Salary cannot be negative')
  END;
END;

-- AFTER DELETE: Archive deleted data
CREATE TRIGGER archive_deleted_employee
AFTER DELETE ON employees
BEGIN
  INSERT INTO employees_archive (name, role, deleted_at)
  VALUES (OLD.name, OLD.role, datetime('now'));
END;</code></pre>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Caution:</strong> Triggers run <strong>automatically</strong> and can affect performance. If a trigger runs a slow query, every INSERT/UPDATE/DELETE on that table will be slow. Use triggers judiciously.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>A trigger automatically executes SQL when a table event occurs</li>
              <li>Triggers can fire BEFORE or AFTER INSERT, UPDATE, or DELETE</li>
              <li>OLD references the row before the change; NEW references it after</li>
              <li>Common uses: audit logging, validation, data synchronization</li>
              <li>Triggers can slow down write operations — use sparingly</li>
              <li>RAISE(ABORT) in a BEFORE trigger can prevent an operation</li>
            </ul>
            <p><strong>Real-world use:</strong> E-commerce platforms use triggers to update inventory counts automatically when orders are placed. Banking systems use triggers for compliance logging.</p>
          </div>
        `,
        defaultCode: `-- Create audit table
CREATE TABLE salary_audit (
  old_salary REAL,
  new_salary REAL,
  changed_at TEXT
);

-- Create trigger
CREATE TRIGGER log_salary_change 
AFTER UPDATE OF salary ON employees
BEGIN
  INSERT INTO salary_audit (old_salary, new_salary, changed_at)
  VALUES (OLD.salary, NEW.salary, datetime('now'));
END;

-- Test the trigger
UPDATE employees SET salary = 85000 WHERE name = 'Alice';
UPDATE employees SET salary = 95000 WHERE name = 'Bob';

-- Check audit log
SELECT * FROM salary_audit;

-- List all triggers
SELECT name FROM sqlite_master WHERE type='trigger';`,
      },
      {
        id: 'm10-l2',
        title: 'Trigger Best Practices & Use Cases',
        objectives: [
          'Learn real-world trigger patterns like cascading updates',
          'Understand trigger limitations and debugging approaches',
          'Know when to use triggers vs. application-level logic',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Advanced Trigger Patterns</h2>
            
            <h3>Cascading Updates</h3>
            <p>Keep related data in sync automatically:</p>
            <pre><code>-- When a department name changes, update all employees' dept_name cache
CREATE TRIGGER update_dept_name
AFTER UPDATE OF dept_name ON departments
BEGIN
  UPDATE employees 
  SET dept_name_cache = NEW.dept_name 
  WHERE dept_id = NEW.id;
END;</code></pre>
            
            <h3>Automatic Timestamps</h3>
            <pre><code>-- Automatically set created_at and updated_at
CREATE TRIGGER set_created_at
AFTER INSERT ON employees
BEGIN
  UPDATE employees SET created_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER set_updated_at
AFTER UPDATE ON employees
BEGIN
  UPDATE employees SET updated_at = datetime('now') WHERE id = NEW.id;
END;</code></pre>
            
            <h3>Preventing Deletion</h3>
            <pre><code>-- Prevent deletion of managers
CREATE TRIGGER prevent_manager_deletion
BEFORE DELETE ON employees
BEGIN
  SELECT CASE
    WHEN OLD.role = 'Manager' THEN RAISE(ABORT, 'Cannot delete managers')
  END;
END;</code></pre>
            
            <h3>Best Practices</h3>
            <ul>
              <li><strong>Keep triggers simple</strong> — Complex logic belongs in application code, not triggers</li>
              <li><strong>Avoid cascading triggers</strong> — A trigger that fires another trigger is hard to debug</li>
              <li><strong>Document your triggers</strong> — They're invisible code that runs behind the scenes</li>
              <li><strong>Test thoroughly</strong> — One buggy trigger can corrupt your entire data</li>
              <li><strong>Use triggers for: validation, audit logging, denormalization</strong></li>
              <li><strong>Don't use triggers for: business rules that change frequently, complex multi-step workflows</strong></li>
            </ul>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Debugging Triggers:</strong> Triggers are hard to debug because they run automatically. The best strategy is to test the SQL statements inside the trigger separately first, then add the trigger wrapper.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Triggers can cascade updates to keep related data in sync</li>
              <li>Use triggers for automatic timestamp management</li>
              <li>BEFORE triggers can prevent operations using RAISE(ABORT)</li>
              <li>Keep triggers simple and well-documented</li>
              <li>Avoid cascading triggers (triggers that fire other triggers)</li>
              <li>Application-level code is better for complex business logic</li>
            </ul>
            <p><strong>Real-world use:</strong> Content management systems use triggers to update "last modified" timestamps. E-commerce sites use triggers to maintain running totals in dashboard tables.</p>
          </div>
        `,
        defaultCode: `-- Create trigger to prevent negative salaries
CREATE TRIGGER prevent_negative_salary
BEFORE UPDATE OF salary ON employees
BEGIN
  SELECT CASE
    WHEN NEW.salary < 0 THEN RAISE(ABORT, 'Salary cannot be negative')
  END;
END;

-- Test it (should fail)
UPDATE employees SET salary = -1000 WHERE name = 'Alice';

-- This should work
UPDATE employees SET salary = 88000 WHERE name = 'Alice';

-- Check existing triggers
SELECT name, sql FROM sqlite_master WHERE type='trigger';`,
      },
    ],
    quiz: [
      {
        id: 'm10-q1',
        question: 'When does a trigger execute?',
        options: [
          'When you explicitly call it',
          'Automatically when a specified table event occurs',
          'When the database starts up',
          'When you close the database connection',
        ],
        correct: 1,
      },
      {
        id: 'm10-q2',
        question: 'What does OLD represent in a trigger?',
        options: [
          'The old version of the table schema',
          'The row value BEFORE the triggering change',
          'The row value AFTER the triggering change',
          'The database version number',
        ],
        correct: 1,
      },
      {
        id: 'm10-q3',
        question: 'Which statement inside a BEFORE trigger can prevent an operation?',
        options: ['STOP', 'RAISE(ABORT)', 'CANCEL', 'RETURN'],
        correct: 1,
      },
      {
        id: 'm10-q4',
        question: 'What is a best practice when using triggers?',
        options: [
          'Cascade triggers for maximum automation',
          'Keep triggers simple and well-documented',
          'Use triggers for all business logic',
          'Avoid documenting triggers since they\'re self-explanatory',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 11: Window Functions ───
  {
    id: 'mod-11',
    title: 'Window Functions',
    lessons: [
      {
        id: 'm11-l1',
        title: 'Introduction to Window Functions',
        objectives: [
          'Understand what window functions are and how they differ from GROUP BY',
          'Use ROW_NUMBER, RANK, and DENSE_RANK for ordering within groups',
          'Understand the OVER() clause and PARTITION BY',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What are Window Functions?</h2>
            <p><strong>Window functions</strong> perform calculations across a set of rows related to the current row — but unlike GROUP BY, they <strong>don't collapse rows</strong>. Each row keeps its identity while also seeing the "big picture" around it.</p>
            
            <p>It's like being in a race: you know your own time, but a window function also shows you the fastest time, the average time, and your rank — all while keeping your individual result visible.</p>
            
            <h3>Basic Window Function Syntax</h3>
            <pre><code>SELECT 
  name, 
  salary,
  AVG(salary) OVER () AS overall_avg
FROM employees;</code></pre>
            <p>The <code>OVER ()</code> clause defines the "window" — the set of rows the function looks at.</p>
            
            <h3>Ranking Functions</h3>
            <pre><code>SELECT 
  name, 
  salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
  RANK() OVER (ORDER BY salary DESC) AS rank,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM employees;</code></pre>
            
            <h3>PARTITION BY: Window Within Groups</h3>
            <p><code>PARTITION BY</code> splits the data into groups — like GROUP BY does — but keeps all rows:</p>
            <pre><code>-- Rank employees by salary within each department
SELECT 
  name, 
  dept_id,
  salary,
  RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_salary_rank
FROM employees;</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Key Difference:</strong> GROUP BY collapses rows (one row per group). Window functions preserve every row and add the aggregate result alongside it. Use GROUP BY when you want summary; use window functions when you want detail + context.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Window functions calculate across rows without collapsing them</li>
              <li>OVER() defines the window of rows to include</li>
              <li>ROW_NUMBER() assigns sequential numbers; RANK() handles ties with gaps</li>
              <li>DENSE_RANK() handles ties without gaps</li>
              <li>PARTITION BY divides rows into groups (like GROUP BY for windows)</li>
              <li>ORDER BY inside OVER() defines the ordering within the window</li>
            </ul>
            <p><strong>Real-world use:</strong> Leaderboards use RANK(). Employee lists use ROW_NUMBER() for pagination. "Show me each employee and how their salary compares to their department average" uses AVG() OVER(PARTITION BY dept_id).</p>
          </div>
        `,
        defaultCode: `-- Basic window: overall average salary
SELECT name, salary,
  AVG(salary) OVER () AS overall_avg_salary
FROM employees;

-- Ranking employees by salary
SELECT name, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- Rank within each department
SELECT name, dept_id, salary,
  RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dept_rank
FROM employees
ORDER BY dept_id, dept_rank;`,
      },
      {
        id: 'm11-l2',
        title: 'Analytic Functions: LAG, LEAD & Running Totals',
        objectives: [
          'Use LAG and LEAD to access preceding and following row values',
          'Calculate running totals with SUM() OVER (ORDER BY)',
          'Use window frames for moving averages and custom range calculations',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Accessing Nearby Rows</h2>
            
            <h3>LAG and LEAD</h3>
            <p><code>LAG</code> accesses a previous row's value; <code>LEAD</code> accesses a following row's value. Great for comparing current vs. previous values.</p>
            <pre><code>SELECT 
  name, salary,
  LAG(salary) OVER (ORDER BY salary) AS prev_salary,
  salary - LAG(salary) OVER (ORDER BY salary) AS diff_from_prev
FROM employees
ORDER BY salary;</code></pre>
            
            <h3>Running Totals</h3>
            <p>Adding <code>ORDER BY</code> inside <code>OVER()</code> creates a <strong>running total</strong>:</p>
            <pre><code>SELECT 
  name, salary,
  SUM(salary) OVER (ORDER BY salary) AS running_total
FROM employees
ORDER BY salary;</code></pre>
            
            <h3>Window Frames for Moving Averages</h3>
            <p>Window frames let you define exactly which rows are included relative to the current row:</p>
            <pre><code>-- Moving average: current row + previous 2 rows + next 2 rows
SELECT 
  id, name, salary,
  AVG(salary) OVER (
    ORDER BY id 
    ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
  ) AS moving_avg
FROM employees;</code></pre>
            
            <h3>Frame Specifications</h3>
            <ul>
              <li><code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> — All rows from start to current (default with ORDER BY)</li>
              <li><code>ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING</code> — Current row ± 1 neighbor</li>
              <li><code>ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING</code> — Current row to end</li>
              <li><code>ROWS UNBOUNDED PRECEDING</code> — All rows from start to current (shorthand)</li>
            </ul>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> Moving averages are essential in financial data analysis (stock prices, revenue trends). A 7-day moving average smooths out daily fluctuations to show the underlying trend.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>LAG(column) accesses the previous row's value; LEAD accesses the next</li>
              <li>Running totals use SUM() OVER (ORDER BY column)</li>
              <li>Window frames (ROWS BETWEEN) define exactly which rows are in the window</li>
              <li>Moving averages smooth out fluctuations in time-series data</li>
              <li>Frames can be unbounded (all rows) or bounded (N rows before/after)</li>
            </ul>
            <p><strong>Real-world use:</strong> Stock price analysis uses 50-day moving averages to identify trends. Sales reports use LAG to compare this month's sales to last month's.</p>
          </div>
        `,
        defaultCode: `-- LAG: compare salary to the next lower salary
SELECT name, salary,
  LAG(salary) OVER (ORDER BY salary) AS lower_salary,
  salary - LAG(salary) OVER (ORDER BY salary) AS gap
FROM employees
ORDER BY salary;

-- Running total of salaries
SELECT name, salary,
  SUM(salary) OVER (ORDER BY salary) AS running_total
FROM employees
ORDER BY salary;

-- Moving average (current ± 1)
SELECT name, salary,
  AVG(salary) OVER (
    ORDER BY salary 
    ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING
  ) AS moving_avg
FROM employees
ORDER BY salary;`,
      },
    ],
    quiz: [
      {
        id: 'm11-q1',
        question: 'How do window functions differ from GROUP BY?',
        options: [
          'Window functions are slower',
          'GROUP BY collapses rows; window functions preserve individual rows',
          'Window functions only work with numbers',
          'There is no difference',
        ],
        correct: 1,
      },
      {
        id: 'm11-q2',
        question: 'What does LAG(salary) OVER (ORDER BY id) do?',
        options: [
          'Returns the next row\'s salary value',
          'Returns the previous row\'s salary value',
          'Returns the highest salary',
          'Returns the total salary',
        ],
        correct: 1,
      },
      {
        id: 'm11-q3',
        question: 'What does PARTITION BY do in a window function?',
        options: [
          'Splits the table into separate databases',
          'Divides rows into groups and calculates the function within each group',
          'Creates a new table',
          'Deletes duplicate rows',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 12: Date/Time Functions ───
  {
    id: 'mod-12',
    title: 'Date/Time Functions',
    lessons: [
      {
        id: 'm12-l1',
        title: 'Working with Dates and Times',
        objectives: [
          'Use SQLite\'s built-in date and time functions',
          'Format dates with STRFTIME',
          'Perform date arithmetic (add days, months, years)',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Date and Time in SQLite</h2>
            <p>SQLite doesn't have a dedicated DATE or TIME data type. Instead, dates and times are stored as <strong>TEXT</strong> (ISO-8601 strings), <strong>INTEGER</strong> (Unix timestamps — seconds since 1970), or <strong>REAL</strong> (Julian day numbers). The most common and recommended format is ISO-8601 text: <code>2024-03-15 14:30:00</code>.</p>
            
            <h3>Core Date/Time Functions</h3>
            <pre><code>-- Get current date/time
SELECT date('now');       -- 2024-03-15
SELECT time('now');       -- 14:30:00
SELECT datetime('now');   -- 2024-03-15 14:30:00
SELECT julianday('now');  -- 2460380.5 (days since 4714 BCE)
SELECT strftime('%s', 'now');  -- Unix timestamp (seconds since 1970)</code></pre>
            
            <h3>Date Arithmetic</h3>
            <pre><code>-- Add/subtract time intervals
SELECT date('now', '+7 days');       -- One week from now
SELECT date('now', '-1 month');      -- One month ago
SELECT datetime('now', '+3 hours');  -- Three hours from now
SELECT date('now', 'start of year'); -- First day of this year
SELECT date('now', 'start of month', '+1 month', '-1 day'); -- Last day of this month</code></pre>
            
            <h3>Formatting with STRFTIME</h3>
            <pre><code>SELECT 
  strftime('%Y', 'now') AS year,         -- 2024
  strftime('%m', 'now') AS month,        -- 03
  strftime('%d', 'now') AS day,          -- 15
  strftime('%B', 'now') AS full_month,   -- March
  strftime('%w', 'now') AS weekday_num,  -- 5 (Friday, 0=Sunday)
  strftime('%j', 'now') AS day_of_year;  -- 075</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Best Practice:</strong> Always store dates in <strong>UTC</strong> (Coordinated Universal Time) and convert to local time when displaying to users. This avoids confusion when your users span multiple time zones.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>SQLite stores dates as TEXT (ISO-8601), INTEGER (Unix), or REAL (Julian)</li>
              <li>date(), time(), datetime() retrieve current date/time in various formats</li>
              <li>Date arithmetic uses +N days, -N months, +N hours modifiers</li>
              <li>STRFTIME formats dates with %Y, %m, %d, %B, %w, %j, etc.</li>
              <li>Use 'start of month', 'start of year' for calendar calculations</li>
              <li>Store dates in UTC and convert for display</li>
            </ul>
            <p><strong>Real-world use:</strong> "Show me all orders from the last 30 days" uses date('now', '-30 days'). "Find users who signed up this month" uses STRFTIME to extract year-month.</p>
          </div>
        `,
        defaultCode: `-- Current date and time
SELECT 
  date('now') AS today,
  time('now') AS right_now,
  datetime('now') AS exact_moment;

-- Date arithmetic
SELECT 
  date('now', '+7 days') AS next_week,
  date('now', '-1 month') AS last_month,
  date('now', 'start of month') AS month_start;

-- Formatting
SELECT 
  strftime('%Y-%m-%d', 'now') AS iso_date,
  strftime('%B %d, %Y', 'now') AS pretty_date,
  strftime('%s', 'now') AS unix_timestamp;`,
      },
      {
        id: 'm12-l2',
        title: 'Practical Date Queries & Time Zones',
        objectives: [
          'Write real-world queries using date/time filters',
          'Calculate age and durations from stored dates',
          'Understand time zone handling in SQLite',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Real-World Date Queries</h2>
            
            <h3>Creating a Table with Dates</h3>
            <pre><code>CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer TEXT,
  amount REAL,
  order_date TEXT DEFAULT (datetime('now'))
);

INSERT INTO orders (customer, amount) VALUES ('Alice', 150.00);
INSERT INTO orders (customer, amount) VALUES ('Bob', 250.00);</code></pre>
            
            <h3>Date Filtering Examples</h3>
            <pre><code>-- Orders from the last 7 days
SELECT * FROM orders 
WHERE order_date >= datetime('now', '-7 days');

-- Orders placed in a specific month
SELECT * FROM orders 
WHERE strftime('%Y-%m', order_date) = '2024-03';

-- Orders placed on weekends
SELECT * FROM orders 
WHERE strftime('%w', order_date) IN ('0', '6');</code></pre>
            
            <h3>Calculating Age and Durations</h3>
            <pre><code>-- Calculate age from birthdate
SELECT 
  name,
  birthdate,
  (strftime('%Y', 'now') - strftime('%Y', birthdate)) -
    (strftime('%m-%d', 'now') < strftime('%m-%d', birthdate)) AS age
FROM employees;

-- Duration between two dates
SELECT julianday('now') - julianday('2024-01-01') AS days_since_new_year;

-- Compare timestamps
SELECT 
  name,
  created_at,
  CASE 
    WHEN julianday('now') - julianday(created_at) < 1 THEN 'Today'
    WHEN julianday('now') - julianday(created_at) < 7 THEN 'This week'
    ELSE 'Older'
  END AS recency
FROM users;</code></pre>
            
            <h3>Time Zone Handling</h3>
            <p>SQLite's date functions work in <strong>UTC</strong>. To handle time zones, you can:</p>
            <pre><code>-- Convert UTC to a specific offset
SELECT datetime('now', 'utc') AS utc_time;                     -- Already UTC
SELECT datetime('now', '-5 hours') AS eastern_us;              -- EST (UTC-5)
SELECT datetime('now', '+5 hours', '+30 minutes') AS ist;      -- India (UTC+5:30)

-- Store the timezone offset alongside the timestamp
CREATE TABLE events (
  event_time TEXT,
  timezone TEXT  -- e.g., 'America/New_York'
);</code></pre>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Note:</strong> SQLite doesn't have built-in time zone conversion by name (like "EST" or "America/New_York"). For proper time zone handling, you need to calculate offsets manually or use application-level code.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Use datetime('now', '-N days') for date range filtering</li>
              <li>STRFTIME('%Y-%m', date) extracts year-month for grouping</li>
              <li>Calculate age using year difference minus birthday comparison</li>
              <li>JULIANDAY differences give precise day durations</li>
              <li>SQLite dates are in UTC; apply hour offsets for time zones</li>
              <li>DEFAULT (datetime('now')) auto-timestamps on INSERT</li>
            </ul>
            <p><strong>Real-world use:</strong> "Orders placed in the last 30 days" is the most common date query in e-commerce. "Users active in the last 24 hours" is common for analytics dashboards.</p>
          </div>
        `,
        defaultCode: `-- Create an orders table with dates
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer TEXT,
  amount REAL,
  order_date TEXT DEFAULT (datetime('now'))
);

-- Insert some sample orders
INSERT INTO orders (customer, amount) VALUES ('Alice', 150.00);
INSERT INTO orders (customer, amount) VALUES ('Bob', 250.00);
INSERT INTO orders (customer, amount) VALUES ('Charlie', 99.99);

-- All orders
SELECT * FROM orders;

-- Orders with computed fields
SELECT 
  customer, 
  amount, 
  order_date,
  date(order_date) AS order_date_only
FROM orders;

-- Age calculation demo
SELECT julianday('now') - julianday('2024-01-01') AS days_this_year;`,
      },
    ],
    quiz: [
      {
        id: 'm12-q1',
        question: 'Which SQLite function returns the current date and time?',
        options: ['NOW()', 'datetime(\'now\')', 'CURRENT_TIMESTAMP()', 'GETDATE()'],
        correct: 1,
      },
      {
        id: 'm12-q2',
        question: 'How do you add 7 days to a date in SQLite?',
        options: ["date('now', '+7 days')", "date_add('now', 7)", "now() + 7", "date('now', 'add 7 days')"],
        correct: 0,
      },
      {
        id: 'm12-q3',
        question: 'What format does SQLite recommend for storing dates?',
        options: ['Unix timestamps only', 'ISO-8601 text format', 'Julian day numbers', 'Any format works equally well'],
        correct: 1,
      },
    ],
  },

  // ─── Module 13: EXPLAIN QUERY PLAN & Performance ───
  {
    id: 'mod-13',
    title: 'EXPLAIN QUERY PLAN & Performance Tuning',
    lessons: [
      {
        id: 'm13-l1',
        title: 'Using EXPLAIN QUERY PLAN',
        objectives: [
          'Use EXPLAIN QUERY PLAN to understand query execution',
          'Interpret scan types: SCAN TABLE vs. SEARCH TABLE USING INDEX',
          'Identify performance bottlenecks in queries',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Understanding Query Execution</h2>
            <p><code>EXPLAIN QUERY PLAN</code> shows you <strong>how SQLite will execute a query</strong> without actually running it. It's like looking at a map before a road trip — you can see the route and spot potential traffic jams before you start driving.</p>
            
            <h3>Basic Usage</h3>
            <pre><code>-- See how a query will be executed
EXPLAIN QUERY PLAN SELECT * FROM employees WHERE name = 'Alice';</code></pre>
            
            <h3>Understanding the Output</h3>
            <p>The output tells you what SQLite plans to do:</p>
            <ul>
              <li><strong>SCAN TABLE</strong> — Full table scan. SQLite reads every single row. 🚩 Slow on large tables.</li>
              <li><strong>SEARCH TABLE USING INDEX</strong> — Index lookup. SQLite jumps directly to matching rows. ✅ Fast.</li>
              <li><strong>SEARCH TABLE USING PRIMARY KEY</strong> — Primary key lookup. The fastest possible access. ✅✅ Very fast.</li>
              <li><strong>SCAN SUBQUERY</strong> — Scanning the results of an inner query.</li>
              <li><strong>USE TEMP B-TREE FOR ORDER BY</strong> — SQLite needs to sort results. Extra work, but sometimes necessary.</li>
            </ul>
            
            <h3>Examples</h3>
            <pre><code>-- Without index: full scan
EXPLAIN QUERY PLAN SELECT * FROM employees WHERE role = 'Developer';
-- Output: SCAN TABLE employees

-- After creating index: index lookup
CREATE INDEX idx_role ON employees(role);
EXPLAIN QUERY PLAN SELECT * FROM employees WHERE role = 'Developer';
-- Output: SEARCH TABLE employees USING INDEX idx_role

-- JOIN query
EXPLAIN QUERY PLAN 
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.id;</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Rule of Thumb:</strong> If EXPLAIN QUERY PLAN shows SCAN TABLE on a table with more than a few thousand rows, you probably need an index. SCAN TABLE is fine for tiny tables (under 100 rows) where the index overhead isn't worth it.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>EXPLAIN QUERY PLAN shows how SQLite executes a query without running it</li>
              <li>SCAN TABLE = slow (reads every row); SEARCH TABLE USING INDEX = fast</li>
              <li>Primary key lookups are the fastest access method</li>
              <li>USE TEMP B-TREE indicates sorting is needed</li>
              <li>Always check EXPLAIN QUERY PLAN before optimizing — don't guess!</li>
              <li>Small tables don't benefit much from indexes</li>
            </ul>
            <p><strong>Real-world use:</strong> Before deploying a new query to production, developers check EXPLAIN QUERY PLAN to ensure it will perform well on large datasets.</p>
          </div>
        `,
        defaultCode: `-- Check how a basic query runs
EXPLAIN QUERY PLAN SELECT * FROM employees WHERE role = 'Developer';

-- Create an index and check again
CREATE INDEX IF NOT EXISTS idx_role ON employees(role);
EXPLAIN QUERY PLAN SELECT * FROM employees WHERE role = 'Developer';

-- Check a JOIN query
EXPLAIN QUERY PLAN 
SELECT e.name, d.dept_name 
FROM employees e 
JOIN departments d ON e.dept_id = d.id;

-- Check a query with ORDER BY
EXPLAIN QUERY PLAN 
SELECT * FROM employees ORDER BY salary DESC;`,
      },
      {
        id: 'm13-l2',
        title: 'Performance Best Practices & PRAGMA Tuning',
        objectives: [
          'Apply practical performance optimization techniques',
          'Use PRAGMA statements to tune SQLite behavior',
          'Understand when and how to use WAL mode and other optimizations',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Making SQLite Fast</h2>
            
            <h3>1. Use Indexes Wisely</h3>
            <p>Index columns used in WHERE, JOIN, and ORDER BY. But don't over-index — each index slows down INSERTs and UPDATEs.</p>
            
            <h3>2. Use Transactions for Bulk Operations</h3>
            <p>Wrap multiple INSERTs/UPDATEs in a single transaction. This can be 100x faster because SQLite only writes to disk once at COMMIT time.</p>
            <pre><code>-- SLOW: 1000 separate disk writes
INSERT INTO t VALUES (1);
INSERT INTO t VALUES (2);
-- ...

-- FAST: 1 disk write
BEGIN TRANSACTION;
INSERT INTO t VALUES (1);
INSERT INTO t VALUES (2);
-- ...
COMMIT;</code></pre>
            
            <h3>3. Use PRAGMA Statements for Tuning</h3>
            <pre><code>-- WAL mode: better concurrent read/write performance
PRAGMA journal_mode = WAL;

-- Cache size: more memory = faster reads (default is 2MB)
PRAGMA cache_size = -8000;  -- Use 8MB cache

-- Synchronous mode: balance safety vs. speed
PRAGMA synchronous = NORMAL;  -- Good balance
-- PRAGMA synchronous = OFF;  -- Faster but risky (data corruption possible on crash)

-- Temp storage: keep temp tables/indexes in memory
PRAGMA temp_store = MEMORY;

-- Foreign key enforcement (off by default)
PRAGMA foreign_keys = ON;</code></pre>
            
            <h3>4. Query Optimization Tips</h3>
            <ul>
              <li><strong>Only SELECT needed columns</strong> — Avoid <code>SELECT *</code> in production; fetch only what you need</li>
              <li><strong>Use LIMIT</strong> — If you only need 10 results, say so with <code>LIMIT 10</code></li>
              <li><strong>Use covered indexes</strong> — An index that contains ALL columns the query needs. SQLite can answer the query from the index alone, never touching the table.</li>
              <li><strong>Avoid functions in WHERE</strong> — <code>WHERE function(col) = value</code> prevents index usage. Instead, pre-compute if possible.</li>
              <li><strong>Use EXISTS instead of IN</strong> for subqueries when checking existence</li>
              <li><strong>Beware of implicit type conversion</strong> — Searching <code>WHERE text_col = 123</code> forces SQLite to convert values, preventing index usage</li>
            </ul>
            
            <h3>5. Practical Performance Checklist</h3>
            <ol>
              <li>Run EXPLAIN QUERY PLAN — is it scanning or using an index?</li>
              <li>Are you missing an obvious index?</li>
              <li>Can you wrap multiple operations in a transaction?</li>
              <li>Are you selecting more columns than needed?</li>
              <li>Is WAL mode enabled for concurrent access?</li>
            </ol>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Remember:</strong> Don't optimize prematurely! Measure first, optimize second. A query running in 2ms doesn't need optimization even if it does a full table scan. Focus on queries that are actually slow.</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Index wisely — index WHERE/JOIN/ORDER BY columns, but not too many</li>
              <li>Use transactions for bulk operations (100x speedup possible)</li>
              <li>WAL mode enables concurrent reads during writes</li>
              <li>Only SELECT columns you need; use LIMIT for pagination</li>
              <li>EXISTS is faster than IN for existence checks</li>
              <li>Don't optimize queries that are already fast enough</li>
            </ul>
            <p><strong>Real-world use:</strong> Production apps use WAL mode for better concurrency. ETL (Extract, Transform, Load) processes use transactions to bulk-insert millions of rows efficiently.</p>
          </div>
        `,
        defaultCode: `-- Check current PRAGMA settings
PRAGMA journal_mode;
PRAGMA synchronous;
PRAGMA cache_size;
PRAGMA temp_store;

-- Enable WAL mode (better concurrency)
PRAGMA journal_mode = WAL;

-- Set cache to 8MB
PRAGMA cache_size = -8000;

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Verify changes
PRAGMA journal_mode;
PRAGMA foreign_keys;`,
      },
    ],
    quiz: [
      {
        id: 'm13-q1',
        question: 'What does SCAN TABLE mean in EXPLAIN QUERY PLAN output?',
        options: [
          'SQLite is using an index',
          'SQLite is reading every row in the table (full table scan)',
          'The table has been deleted',
          'SQLite is creating a new table',
        ],
        correct: 1,
      },
      {
        id: 'm13-q2',
        question: 'What SQLite feature provides the best concurrent read/write performance?',
        options: ['EXCLUSIVE mode', 'WAL (Write-Ahead Logging)', 'SHARED mode', 'PENDING mode'],
        correct: 1,
      },
      {
        id: 'm13-q3',
        question: 'Which is faster for bulk INSERTs?',
        options: [
          '1000 separate INSERT statements (auto-commit each)',
          '1 transaction containing all 1000 INSERTs',
          'They are the same speed',
          'INSERTs cannot be batched',
        ],
        correct: 1,
      },
      {
        id: 'm13-q4',
        question: 'What is a "covered index"?',
        options: [
          'An index that covers all columns of a table',
          'An index that contains all columns needed by a query, so the table is never accessed',
          'An index that is encrypted',
          'An index that covers multiple tables',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 14: FTS5 Full-Text Search ───
  {
    id: 'mod-14',
    title: 'FTS5 Full-Text Search',
    lessons: [
      {
        id: 'm14-l1',
        title: 'Introduction to FTS5',
        objectives: [
          'Understand what FTS5 is and why it beats LIKE for text search',
          'Create FTS5 virtual tables',
          'Perform basic full-text searches with the MATCH operator',
        ],
        content: `
          <div class="lesson-prose">
            <h2>What is FTS5?</h2>
            <p><strong>FTS5</strong> (Full-Text Search version 5) is a SQLite extension that provides <strong>powerful search capabilities</strong> — like having Google built into your database. It creates a <strong>virtual table</strong> that indexes text content for fast, flexible searching.</p>
            
            <h3>Why Not Just Use LIKE?</h3>
            <p><code>LIKE '%keyword%'</code> searches are:</p>
            <ul>
              <li><strong>Slow</strong> — Must scan every row and check every character</li>
              <li><strong>Limited</strong> — Can't handle rankings, word variants, or phrases</li>
              <li><strong>Inefficient</strong> — <code>LIKE '%cat%'</code> requires reading all data</li>
            </ul>
            <p>FTS5, by contrast, pre-builds an index of words for instant lookup.</p>
            
            <h3>Creating an FTS5 Table</h3>
            <pre><code>-- Create an FTS5 virtual table
CREATE VIRTUAL TABLE documents USING fts5(
  title,
  body,
  content=''  -- Don't store content externally
);

-- Insert data (use INSERT just like a regular table)
INSERT INTO documents VALUES 
  ('SQLite Guide', 'SQLite is a lightweight embedded database engine.'),
  ('FTS5 Tutorial', 'Full-text search makes finding text fast and easy.'),
  ('Performance Tips', 'Index your columns for better query performance.');</code></pre>
            
            <h3>Basic Searching with MATCH</h3>
            <pre><code>-- Find documents containing the word 'database'
SELECT * FROM documents WHERE documents MATCH 'database';

-- Find documents containing either 'search' OR 'index'
SELECT * FROM documents WHERE documents MATCH 'search OR index';

-- Search in a specific column
SELECT * FROM documents WHERE documents MATCH 'title: SQLite';</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Speed Comparison:</strong> On a table with 100,000 rows, <code>LIKE '%database%'</code> might take 2-3 seconds. FTS5 with a MATCH query on the same data returns results in milliseconds. That's 100-1000x faster!</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>FTS5 is SQLite's full-text search engine — fast, flexible, and feature-rich</li>
              <li>FTS5 is much faster than LIKE for text searching on large datasets</li>
              <li>CREATE VIRTUAL TABLE ... USING fts5(columns) creates a search index</li>
              <li>Use the MATCH operator to search FTS5 tables</li>
              <li>FTS5 supports column-specific searches (title: keyword)</li>
              <li>FTS5 automatically handles word boundaries and punctuation</li>
            </ul>
            <p><strong>Real-world use:</strong> Documentation sites use FTS5 for instant search. Email clients use it to search millions of emails. Note-taking apps use it for quick note retrieval.</p>
          </div>
        `,
        defaultCode: `-- Create an FTS5 table
CREATE VIRTUAL TABLE documents USING fts5(title, body);

-- Insert some sample documents
INSERT INTO documents VALUES 
  ('SQLite Guide', 'SQLite is a lightweight embedded database engine used in mobile apps and browsers.'),
  ('FTS5 Tutorial', 'Full-text search with FTS5 makes finding text fast and efficient.'),
  ('Indexing Guide', 'Database indexes speed up queries but slow down writes.'),
  ('SQL vs NoSQL', 'SQL databases use structured tables while NoSQL databases are more flexible.');

-- Basic search
SELECT * FROM documents WHERE documents MATCH 'database';

-- Search with OR
SELECT * FROM documents WHERE documents MATCH 'fast OR efficient';

-- Search in specific column
SELECT * FROM documents WHERE documents MATCH 'title: SQLite';`,
      },
      {
        id: 'm14-l2',
        title: 'Advanced FTS5 Queries & Best Practices',
        objectives: [
          'Use advanced FTS5 query syntax (prefix, phrase, NEAR)',
          'Understand ranking with the bm25 algorithm',
          'Use FTS5 content tables for external content storage',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Advanced FTS5 Query Syntax</h2>
            
            <h3>Phrase Search</h3>
            <p>Find exact phrases by enclosing them in double quotes:</p>
            <pre><code>-- Find the exact phrase "embedded database"
SELECT * FROM documents WHERE documents MATCH '"embedded database"';</code></pre>
            
            <h3>Prefix Search</h3>
            <p>Match words starting with a prefix using *:</p>
            <pre><code>-- Find words starting with "dat" (database, data, dataless...)
SELECT * FROM documents WHERE documents MATCH 'dat*';</code></pre>
            
            <h3>NEAR Operator</h3>
            <p>Find words near each other within a specified distance:</p>
            <pre><code>-- Find "database" within 10 words of "index"
SELECT * FROM documents WHERE documents MATCH 'database NEAR/10 index';</code></pre>
            
            <h3>Ranking Results with bm25</h3>
            <p>FTS5 automatically calculates a <strong>relevance score</strong> using the <strong>bm25 algorithm</strong>. Lower scores = more relevant:</p>
            <pre><code>SELECT *, rank FROM documents 
WHERE documents MATCH 'database' 
ORDER BY rank;</code></pre>
            
            <h3>Boolean Operators</h3>
            <pre><code>-- AND (default for multiple terms)
SELECT * FROM documents WHERE documents MATCH 'database AND index';

-- OR
SELECT * FROM documents WHERE documents MATCH 'database OR search';

-- NOT (exclude a term)
SELECT * FROM documents WHERE documents MATCH 'database NOT sqlite';</code></pre>
            
            <h3>Content Tables (External Content)</h3>
            <p>Instead of storing content in the FTS5 table (duplicating data), you can point it to an external table:</p>
            <pre><code>-- Regular table with actual data
CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  title TEXT,
  body TEXT
);

-- FTS5 table pointing to external content
CREATE VIRTUAL TABLE articles_fts USING fts5(
  title, body,
  content='articles',
  content_rowid='id'
);

-- Keep the FTS index in sync with triggers
CREATE TRIGGER articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, title, body) 
  VALUES (new.id, new.title, new.body);
END;</code></pre>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-yellow-800"><strong>⚠️ Note:</strong> FTS5 must be enabled when SQLite is compiled. It's included in most builds (including sql.js in the browser), but verify with your SQLite distribution. Check with <code>SELECT sqlite_compileoption_get(0);</code></p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Phrase search: MATCH '"exact phrase"'</li>
              <li>Prefix search: MATCH 'prefix*'</li>
              <li>NEAR/N search: MATCH 'word1 NEAR/N word2'</li>
              <li>Boolean operators: AND, OR, NOT</li>
              <li>Rank results using bm25: ORDER BY rank</li>
              <li>Content tables avoid data duplication but need sync triggers</li>
            </ul>
            <p><strong>Real-world use:</strong> Search engines rank results by relevance. "Find documents about databases near the word 'index'" uses NEAR. "Autocomplete" search boxes use prefix queries (search*).</p>
          </div>
        `,
        defaultCode: `-- Advanced FTS5 queries
-- Prefix search
SELECT * FROM documents WHERE documents MATCH 'sql*';

-- Phrase search
SELECT * FROM documents WHERE documents MATCH '"full-text search"';

-- Boolean operators
SELECT * FROM documents WHERE documents MATCH 'database AND index';

-- Ranked results (lower rank = more relevant)
SELECT *, rank FROM documents 
WHERE documents MATCH 'database' 
ORDER BY rank;

-- Combined: prefix + phrase
SELECT *, rank FROM documents 
WHERE documents MATCH 'dat* AND "search"' 
ORDER BY rank;`,
      },
    ],
    quiz: [
      {
        id: 'm14-q1',
        question: 'What does FTS5 stand for?',
        options: [
          'Fast Table Storage 5',
          'Full-Text Search version 5',
          'File Transfer System 5',
          'Fully Typed Schema 5',
        ],
        correct: 1,
      },
      {
        id: 'm14-q2',
        question: 'Which operator is used to search an FTS5 table?',
        options: ['LIKE', 'SEARCH', 'MATCH', 'FIND'],
        correct: 2,
      },
      {
        id: 'm14-q3',
        question: 'How do you search for an exact phrase in FTS5?',
        options: [
          "MATCH 'exact phrase'",
          'MATCH "exact phrase"',
          "MATCH '(exact phrase)'",
          "MATCH '[exact phrase]'",
        ],
        correct: 1,
      },
      {
        id: 'm14-q4',
        question: 'What does the NEAR operator do in FTS5?',
        options: [
          'Finds documents geographically close to a location',
          'Finds words that appear near each other within a specified distance',
          'Finds similar words based on spelling',
          'Finds documents with nearby IDs',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 15: SQLite with Drivers (Python/Node.js) ───
  {
    id: 'mod-15',
    title: 'SQLite with Python & Node.js Drivers',
    lessons: [
      {
        id: 'm15-l1',
        title: 'Using SQLite with Python (sqlite3)',
        objectives: [
          'Connect to SQLite from Python using the built-in sqlite3 module',
          'Execute queries and fetch results in Python',
          'Understand connection management and error handling',
        ],
        content: `
          <div class="lesson-prose">
            <h2>SQLite in Python</h2>
            <p>Python comes with <strong>SQLite support built-in</strong> via the <code>sqlite3</code> module — no installation required! This makes Python + SQLite the perfect combination for prototyping, data analysis, and small-to-medium applications.</p>
            
            <h3>Basic Python SQLite Usage</h3>
            <pre><code>import sqlite3

# Connect to a database (creates file if it doesn't exist)
conn = sqlite3.connect('myapp.db')

# Create a cursor for executing queries
cursor = conn.cursor()

# Create a table
cursor.execute('''
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )
''')

# Insert data
cursor.execute(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  ('Alice', 'alice@example.com')
)
conn.commit()  # Save changes

# Query data
cursor.execute('SELECT * FROM users')
rows = cursor.fetchall()  # Returns list of tuples
for row in rows:
    print(f"ID: {row[0]}, Name: {row[1]}, Email: {row[2]}")

# Close the connection
conn.close()</code></pre>
            
            <h3>Parameterized Queries (SQL Injection Prevention)</h3>
            <div class="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-red-800"><strong>⚠️ CRITICAL:</strong> NEVER use string formatting (f-strings or % formatting) to build SQL queries! This creates <strong>SQL injection vulnerabilities</strong> where attackers can execute arbitrary SQL. Always use <strong>parameterized queries</strong> with <code>?</code> placeholders.</p>
            </div>
            <pre><code># ❌ DANGEROUS - SQL Injection vulnerability!
user_input = "Alice'; DROP TABLE users; --"
cursor.execute(f"SELECT * FROM users WHERE name = '{user_input}'")

# ✅ SAFE - Parameterized query
cursor.execute(
  'SELECT * FROM users WHERE name = ?',
  (user_input,)
)</code></pre>
            
            <h3>Using Context Managers</h3>
            <pre><code># The 'with' statement automatically commits/rolls back
with sqlite3.connect('myapp.db') as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users')
    print(cursor.fetchall())</code></pre>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Pro Tip:</strong> Use <code>conn.row_factory = sqlite3.Row</code> to access columns by name instead of index: <code>row['name']</code> instead of <code>row[1]</code>. Much more readable!</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>Python's sqlite3 module is built-in — no extra installation needed</li>
              <li>Connect with sqlite3.connect('filename.db')</li>
              <li>Use cursor.execute() for all SQL operations</li>
              <li>ALWAYS use parameterized queries (? placeholders) to prevent SQL injection</li>
              <li>conn.commit() saves changes; conn.close() cleans up</li>
              <li>Use with statement (context manager) for automatic cleanup</li>
              <li>Set row_factory = sqlite3.Row for named column access</li>
            </ul>
            <p><strong>Real-world use:</strong> Python data analysis scripts use SQLite to store and query intermediate results. Flask/Django web apps use SQLite for development before switching to PostgreSQL for production.</p>
          </div>
        `,
        defaultCode: `-- This playground demonstrates the concepts
-- In Python, you'd write:
-- import sqlite3
-- conn = sqlite3.connect('myapp.db')
-- cursor = conn.cursor()
-- cursor.execute('''CREATE TABLE IF NOT EXISTS users (...)...''')
-- conn.commit()
-- conn.close()

-- Create a table similar to what we'd use in Python
CREATE TABLE IF NOT EXISTS python_users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

INSERT INTO python_users (name, email) VALUES 
  ('Alice', 'alice@python.org'),
  ('Bob', 'bob@python.org');

SELECT * FROM python_users;`,
      },
      {
        id: 'm15-l2',
        title: 'Using SQLite with Node.js (better-sqlite3)',
        objectives: [
          'Connect to SQLite from Node.js using better-sqlite3',
          'Execute queries and handle results synchronously',
          'Learn best practices for production Node.js + SQLite apps',
        ],
        content: `
          <div class="lesson-prose">
            <h2>SQLite in Node.js</h2>
            <p><strong>better-sqlite3</strong> is the most popular SQLite library for Node.js. It's <strong>synchronous</strong> (simpler code, better performance) and well-maintained.</p>
            
            <h3>Basic Node.js SQLite Usage</h3>
            <pre><code>// Install: npm install better-sqlite3
const Database = require('better-sqlite3');

// Connect to a database
const db = new Database('myapp.db');

// Create a table
db.exec(\`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE
  )
\`);

// Insert data (with parameterized query)
const insert = db.prepare(
  'INSERT INTO users (name, email) VALUES (?, ?)'
);
insert.run('Alice', 'alice@example.com');

// Query data
const rows = db.prepare('SELECT * FROM users').all();
console.log(rows);
// [{ id: 1, name: 'Alice', email: 'alice@example.com' }]

// Get a single row
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(1);

// Close the connection
db.close();</code></pre>
            
            <h3>Transactions in Node.js</h3>
            <pre><code>// Use a transaction for bulk operations
const insertMany = db.transaction((users) => {
  for (const user of users) {
    db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      .run(user.name, user.email);
  }
});

insertMany([
  { name: 'Charlie', email: 'charlie@example.com' },
  { name: 'Diana', email: 'diana@example.com' }
]);</code></pre>
            
            <h3>Real-World Use Cases for SQLite</h3>
            <ul>
              <li><strong>Mobile Apps</strong> — Android and iOS apps use SQLite for local data storage (contacts, messages, settings)</li>
              <li><strong>Desktop Apps</strong> — Firefox, Chrome, Safari, Skype, Spotify all use SQLite internally</li>
              <li><strong>IoT & Embedded</strong> — Sensors, smart home devices, and embedded systems log data to SQLite</li>
              <li><strong>Development & Testing</strong> — Use SQLite as a lightweight stand-in for PostgreSQL/MySQL during development</li>
              <li><strong>Data Analysis</strong> — Store intermediate results, run queries, export data</li>
              <li><strong>Browser Storage</strong> — Every major browser uses SQLite for bookmarks, history, cookies, and cache</li>
            </ul>
            
            <h3>Best Practices Summary</h3>
            <ul>
              <li>Always use parameterized queries (<code>?</code>) — never concatenate user input into SQL</li>
              <li>Use transactions for bulk operations</li>
              <li>Close the database connection when the app shuts down</li>
              <li>Enable WAL mode for better concurrent performance</li>
              <li>Use EXPLAIN QUERY PLAN to optimize slow queries</li>
              <li>Enable foreign keys with <code>PRAGMA foreign_keys = ON</code></li>
            </ul>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg text-sm">
              <p class="text-blue-800"><strong>💡 Fun Fact:</strong> SQLite is the most widely deployed and used database engine in the world. It's in billions of devices — every smartphone, most computers, countless embedded systems. The SQLite codebase is also one of the most tested open-source projects in existence!</p>
            </div>
          </div>
        `,
        summary: `
          <div class="summary-box">
            <h4>📌 Lesson Summary</h4>
            <ul>
              <li>better-sqlite3 is the leading Node.js SQLite driver (synchronous API)</li>
              <li>db.prepare(sql).all() returns all rows; .get() returns one row; .run() executes</li>
              <li>Use db.transaction() for atomic batch operations</li>
              <li>SQLite is in billions of devices — the most deployed database engine</li>
              <li>Use cases: mobile apps, desktop apps, IoT, development, data analysis</li>
              <li>Best practices: parameterized queries, WAL mode, proper cleanup</li>
            </ul>
            <p><strong>Real-world use:</strong> Electron desktop apps use better-sqlite3 for local storage. IoT devices log sensor readings to SQLite. Mobile apps cache API responses in SQLite for offline access.</p>
          </div>
        `,
        defaultCode: `-- Create tables and data for a Node.js style app
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0
);

INSERT INTO products (name, price, stock) VALUES 
  ('Widget', 19.99, 100),
  ('Gadget', 29.99, 50),
  ('Doohickey', 9.99, 200);

-- In Node.js, you'd query these with:
-- const rows = db.prepare('SELECT * FROM products').all();
SELECT * FROM products;

-- Simulate an inventory check query
SELECT name, price, stock,
  CASE WHEN stock > 50 THEN 'In Stock'
       WHEN stock > 0 THEN 'Low Stock'
       ELSE 'Out of Stock'
  END AS status
FROM products
ORDER BY status;`,
      },
    ],
    quiz: [
      {
        id: 'm15-q1',
        question: 'Which Python module provides SQLite support?',
        options: ['sqlitedb', 'sqlite3', 'pysqlite', 'dbsqlite'],
        correct: 1,
      },
      {
        id: 'm15-q2',
        question: 'What is the correct way to pass user input to a SQL query in Python?',
        options: [
          "f'SELECT * FROM users WHERE name = {user_input}'",
          "cursor.execute('SELECT * FROM users WHERE name = ?', (user_input,))",
          "cursor.execute('SELECT * FROM users WHERE name = ' + user_input)",
          "cursor.execute('SELECT * FROM users', user_input)",
        ],
        correct: 1,
      },
      {
        id: 'm15-q3',
        question: 'Which Node.js library is most commonly used for SQLite?',
        options: ['sqlite3', 'better-sqlite3', 'node-sqlite', 'sql.js'],
        correct: 1,
      },
      {
        id: 'm15-q4',
        question: 'What is SQLite\'s most unique characteristic in the database world?',
        options: [
          'It is the fastest database engine',
          'It is the most widely deployed database engine (billions of devices)',
          'It supports unlimited concurrent users',
          'It can run on a cluster of servers',
        ],
        correct: 1,
      },
    ],
  },
];

// DOM Elements
const elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  sqlEditor: document.getElementById('sql-editor'),
  runQueryBtn: document.getElementById('run-query-btn'),
  resultsPane: document.getElementById('results-pane'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
};

// Initialization
async function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
  await initDatabase();
}

// SQLite Initialization
async function initDatabase() {
  try {
    const SQL = await initSqlJs({
      // Required to load the wasm binary asynchronously
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
    });

    // Create a database
    db = new SQL.Database();

    // Seed database
    const initScript = `
      CREATE TABLE departments (
        id INTEGER PRIMARY KEY,
        dept_name TEXT NOT NULL
      );

      INSERT INTO departments (id, dept_name) VALUES 
        (1, 'Engineering'),
        (2, 'Marketing'),
        (3, 'HR');

      CREATE TABLE employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        dept_id INTEGER,
        salary REAL,
        FOREIGN KEY (dept_id) REFERENCES departments(id)
      );

      INSERT INTO employees (name, role, dept_id, salary) VALUES 
        ('Alice', 'Developer', 1, 80000),
        ('Bob', 'Manager', 1, 90000),
        ('Charlie', 'Designer', 2, 65000),
        ('Diana', 'Recruiter', 3, 55000);
    `;

    db.run(initScript);

    // Enable button
    elements.runQueryBtn.disabled = false;
    elements.runQueryBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Run Query';
  } catch (err) {
    console.error('Failed to initialize SQLite', err);
    elements.runQueryBtn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Engine Error';
  }
}

// Setup Event Listeners
function setupEventListeners() {
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.runQueryBtn.addEventListener('click', runQuery);

  elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
  elements.sidebarOverlay.addEventListener('click', toggleSidebar);

  elements.sidebarContent.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-module]');
    if (btn) {
      loadLesson(parseInt(btn.dataset.module), parseInt(btn.dataset.lesson));
    }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-quiz-id]');
    if (btn) {
      checkAnswer(btn.dataset.quizId, parseInt(btn.dataset.module), parseInt(btn.dataset.option));
    }
  });
}

function toggleSidebar() {
  const isClosed = elements.sidebar.classList.contains('-translate-x-full');
  if (isClosed) {
    elements.sidebar.classList.remove('-translate-x-full');
    elements.sidebarOverlay.classList.remove('hidden');
  } else {
    elements.sidebar.classList.add('-translate-x-full');
    elements.sidebarOverlay.classList.add('hidden');
  }
}

// Tab Management
function switchTab(tabId) {
  elements.tabBtns.forEach((btn) => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'border-blue-600', 'text-blue-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  elements.tabPanes.forEach((pane) => {
    if (pane.id === `${tabId}-tab`) {
      pane.classList.remove('hidden');
      pane.classList.add('block');
    } else {
      pane.classList.add('hidden');
      pane.classList.remove('block');
    }
  });
}

// Sidebar Rendering
function renderSidebar() {
  let html = '';
  curriculum.forEach((mod, mIndex) => {
    html += `
      <div class="sidebar-module">
        <h3 class="sidebar-module-title">${mod.title}</h3>
        <ul class="space-y-1">
    `;

    mod.lessons.forEach((lesson, lIndex) => {
      const isCompleted = userProgress.completedLessons.includes(lesson.id);
      const isActive = mIndex === activeModule && lIndex === activeLesson;

      html += `
        <li>
          <button class="w-full text-left sidebar-lesson ${isActive ? 'active' : ''}" 
                  data-module="${mIndex}" data-lesson="${lIndex}">
            <i class="${isCompleted ? 'fas fa-check-circle text-blue-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
            ${lesson.title}
          </button>
        </li>
      `;
    });

    html += `</ul></div>`;
  });

  elements.sidebarContent.innerHTML = html;
}

// Build lesson HTML with objectives, content, summary
function buildLessonHtml(lesson) {
  let html = '';

  // Learning Objectives (inserted before the lesson-prose content)
  if (lesson.objectives && lesson.objectives.length > 0) {
    html += `
      <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4 rounded-r-lg text-sm">
        <h4 class="font-semibold text-indigo-800 mb-2">🎯 Learning Objectives</h4>
        <ul class="list-disc list-inside text-indigo-700 space-y-1">
    `;
    lesson.objectives.forEach((obj) => {
      html += `<li>${obj}</li>`;
    });
    html += `</ul></div>`;
  }

  // Main content (already wrapped in .lesson-prose)
  html += lesson.content;

  // Summary / Takeaways
  if (lesson.summary) {
    html += lesson.summary;
  }

  return html;
}

// Load specific lesson
function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;
  const lesson = curriculum[mIndex].lessons[lIndex];

  if (!userProgress.completedLessons.includes(lesson.id)) {
    markLessonComplete(lesson.id);
  }

  // Build lesson HTML with objectives and summary
  const lessonHtml = buildLessonHtml(lesson);

  // Look up ELI5 content from global data if available
  const eli5Content = window.eli5SqliteData && window.eli5SqliteData[lesson.id]
    ? window.eli5SqliteData[lesson.id]
    : '';

  // Wrap with ELI5 toggle
  elements.lessonContent.innerHTML = window.eli5Toggle
    ? window.eli5Toggle.wrapContent(lessonHtml, eli5Content)
    : lessonHtml;

  // Initialize ELI5 toggle
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('sqlite', elements.lessonContent);
  }

  // Set default SQL code
  elements.sqlEditor.value = lesson.defaultCode || '';

  // Initialize copy code
  if (window.copyCode && window.copyCode.init) {
    window.copyCode.init(elements.lessonContent);
  }

  renderQuiz(mIndex);
  renderSidebar();

  // Close sidebar on mobile after selection
  if (window.innerWidth < 768 && !elements.sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
}

// Quiz Rendering
function renderQuiz(mIndex) {
  const quiz = curriculum[mIndex].quiz;
  let html = `<h2 class="text-2xl font-bold mb-6 text-gray-800">📝 Module Knowledge Check</h2>`;

  if (!quiz || quiz.length === 0) {
    elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
    return;
  }

  quiz.forEach((q, i) => {
    const isCompleted = userProgress.completedQuizzes.includes(q.id);
    html += `
      <div class="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-100 quiz-question ${isCompleted ? 'bg-green-50 border-green-200' : ''}" id="q-container-${q.id}">
        <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
        <div class="space-y-2">
    `;

    q.options.forEach((opt, oIndex) => {
      html += `
        <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
          <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-blue-600" ${isCompleted ? 'disabled' : ''}>
          <span class="text-gray-700">${opt}</span>
        </label>
      `;
    });

    html += `
        </div>
        <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}" ${isCompleted ? 'disabled' : ''}>
          ${isCompleted ? '✅ Completed' : 'Submit Answer'}
        </button>
        <div id="q-feedback-${q.id}" class="mt-3 text-sm font-medium ${isCompleted ? 'block text-green-600' : 'hidden'}">
          ${isCompleted ? '<i class="fas fa-check-circle mr-1"></i> Previously completed.' : ''}
        </div>
      </div>
    `;
  });

  elements.quizContent.innerHTML = html;
}

// Check Quiz Answer
window.checkAnswer = function (qId, mIndex, qIndex) {
  const selected = document.querySelector(`input[name="quiz-${qId}"]:checked`);
  const feedback = document.getElementById(`q-feedback-${qId}`);
  const container = document.getElementById(`q-container-${qId}`);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  const correctAns = curriculum[mIndex].quiz[qIndex].correct;

  if (parseInt(selected.value) === correctAns) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-3 text-sm font-medium text-green-600 block';
    container.classList.replace('bg-blue-50', 'bg-green-50');
    container.classList.replace('border-blue-100', 'border-green-200');

    if (!userProgress.completedQuizzes.includes(qId)) {
      userProgress.completedQuizzes.push(qId);
      saveProgress();
    }
  } else {
    feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
    feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
  }
};

// Progress Tracking
function markLessonComplete(lessonId) {
  if (!userProgress.completedLessons.includes(lessonId)) {
    userProgress.completedLessons.push(lessonId);
    saveProgress();
  }
}

function saveProgress() {
  localStorage.setItem('sqliteHubProgress', JSON.stringify(userProgress));
  updateProgress();
}

function updateProgress() {
  let totalItems = 0;
  curriculum.forEach((m) => {
    totalItems += m.lessons.length;
    if (m.quiz) totalItems += m.quiz.length;
  });

  const completedItems =
    userProgress.completedLessons.length + userProgress.completedQuizzes.length;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  elements.progressBar.style.width = `${percentage}%`;
  elements.progressText.textContent = `${percentage}%`;
}

// ----------------------------------------------------
// Real SQLite Engine Execution
// ----------------------------------------------------

function runQuery() {
  if (!db) {
    elements.resultsPane.innerHTML =
      '<div class="error-msg">Database not initialized yet. Please wait.</div>';
    return;
  }

  const query = elements.sqlEditor.value.trim();
  if (!query) {
    elements.resultsPane.innerHTML =
      '<div class="absolute inset-0 flex items-center justify-center text-gray-400 italic">Please enter a SQL query.</div>';
    return;
  }

  try {
    // Execute the query using sql.js
    const results = db.exec(query);

    if (results.length === 0) {
      // For operations that don't return data (like INSERT, UPDATE, CREATE)
      elements.resultsPane.innerHTML =
        '<div class="p-4 text-green-600 font-medium"><i class="fas fa-check-circle mr-2"></i>Query executed successfully (no results to display).</div>';
      return;
    }

    // Build HTML Table for the first result set
    const data = results[0];
    let tableHtml = '<div class="data-grid-wrapper"><table class="data-grid"><thead><tr>';

    // Headers
    data.columns.forEach((col) => {
      tableHtml += `<th>${col}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    // Rows
    data.values.forEach((row) => {
      tableHtml += '<tr>';
      row.forEach((val) => {
        let displayVal = val === null ? '<span class="text-gray-400 italic">NULL</span>' : val;
        tableHtml += `<td>${displayVal}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table></div>';
    elements.resultsPane.innerHTML = tableHtml;
  } catch (err) {
    // Catch SQLite syntax errors and display them
    elements.resultsPane.innerHTML = `<div class="error-msg"><i class="fas fa-exclamation-triangle mr-2"></i>SQL Error: ${err.message}</div>`;
  }
}

// Run init on load
document.addEventListener('DOMContentLoaded', init);
