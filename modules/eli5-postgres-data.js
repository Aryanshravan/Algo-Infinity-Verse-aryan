/**
 * ELI5 (Explain Like I'm 5) content for PostgreSQL Learning Hub lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5PostgresData = {
  // ─── Module 1: SQL Fundamentals & CRUD ───
  'm1-l1': `
    <p>Think of a database like a <strong>giant filing cabinet</strong> in an office. Each drawer is a <strong>table</strong>, and each file folder inside is a <strong>row</strong> of data.</p>
    <p><strong>PostgreSQL</strong> is like a <strong>super-powered filing cabinet</strong> that multiple people can use at the same time, it never loses files, and it can handle millions of folders!</p>
    <p><code>SELECT</code> is like asking your assistant: <strong>"Show me what's in this drawer!"</strong></p>
    <p><code>SELECT * FROM users;</code> — "Show me EVERYTHING in the users drawer." (The * means "all columns".)</p>
    <p><code>SELECT name, email FROM users;</code> — "Show me ONLY the name and email columns from the users drawer."</p>
    <p>Think of <code>WHERE</code> as a <strong>filter</strong> — like saying "Show me only the files where the name is 'Alice'" instead of showing everything.</p>
    <p>PostgreSQL is special because it's <strong>open-source</strong> (free to use!), <strong>reliable</strong> (it's been around since 1996), and <strong>powerful</strong> (it can do things other databases can't, like store JSON and do full-text search).</p>
  `,
  'm1-l2': `
    <p><code>INSERT INTO</code> is like <strong>adding a new file folder</strong> to your filing cabinet. You decide what information goes on the folder label.</p>
    <p>Think of it like <strong>filling out a registration form</strong> at a doctor's office. The form has fields: Name, Email, Phone. You fill them in and hand it to the receptionist, who files it away.</p>
    <p><code>INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');</code></p>
    <p>This is like saying: "In the users drawer, add a new folder where the name is 'Alice' and the email is 'alice@example.com'."</p>
    <p><strong>PostgreSQL serial/identity columns</strong> are like a <strong>numbering machine</strong> at the deli counter — every time you take a ticket, it gives you the next number automatically. You don't need to think about it!</p>
    <p><strong>Constraints</strong> (like NOT NULL) are like <strong>rules</strong> on the form: "You MUST fill in your name — no blank spaces allowed!"</p>
  `,
  'm1-l3': `
    <p><code>UPDATE</code> is like using <strong>white-out to fix a mistake</strong> on a filed document. You find the right folder, open it, and change the information.</p>
    <p><code>UPDATE users SET email = 'alice@newdomain.com' WHERE id = 1;</code></p>
    <p>This says: "Find the user with ID 1 (like a folder number) and change their email to the new address."</p>
    <p><strong>⚠️ Most important rule: Don't forget the WHERE clause!</strong> Without WHERE, you'd change EVERY folder's email — like using white-out on every page of the entire cabinet!</p>
    <p><code>DELETE</code> is like <strong>throwing a folder in the trash</strong>. Once deleted, it's gone! (Unless you're inside a transaction — think of that as having a trash bag you can untie before taking it out.)</p>
    <p><strong>ON CONFLICT</strong> is like a <strong>safety net</strong>: "Try to add this folder, but if one with the same barcode already exists, update it instead of giving an error."</p>
    <p><strong>RETURNING</strong> is like asking the database <strong>"show me what you just did"</strong> — like the cashier handing you a receipt after a transaction!</p>
  `,

  // ─── Module 2: Relationships & JOINs ───
  'm2-l1': `
    <p><code>JOIN</code> is like <strong>connecting two puzzle pieces</strong> to see the full picture.</p>
    <p>Imagine you have two lists on your desk. List A has employee names and their department numbers. List B has department numbers and department names. Neither alone tells you "Which department does Alice work in?"</p>
    <p>JOIN lets you <strong>combine them</strong> by matching the department numbers. Now you can see: Alice → Engineering!</p>
    <p><code>SELECT users.name, orders.product FROM users INNER JOIN orders ON users.id = orders.user_id;</code></p>
    <p>This says: "Combine the users and orders lists by matching user IDs, then show me the user name and what they ordered."</p>
    <p><strong>INNER JOIN</strong> only shows rows that match in BOTH tables. If a user never ordered anything, they won't appear. It's like only inviting people who RSVP'd "yes"!</p>
    <p>Table aliases (<code>u</code> for users, <code>o</code> for orders) are like <strong>nicknames</strong> — you don't have to say the full name every time!</p>
  `,
  'm2-l2': `
    <p>There are different <strong>types of JOINs</strong> — like different ways of inviting people to a party!</p>
    <ul>
      <li><strong>LEFT JOIN</strong> — Everyone on the guest list comes, even if they didn't RSVP. If someone didn't RSVP, their RSVP info says "unknown" (NULL). "Show ALL users, and their orders if they have any."</li>
      <li><strong>RIGHT JOIN</strong> — Like LEFT JOIN but from the other side. It's like saying "Show ALL orders, and the user info if there is one."</li>
      <li><strong>FULL OUTER JOIN</strong> — Everyone comes to the party, whether they're on the guest list or they just showed up! If there's no match on either side, you still see them with NULL for the missing info.</li>
    </ul>
    <p><code>SELECT u.name, o.product FROM users u LEFT JOIN orders o ON u.id = o.user_id;</code></p>
    <p>This says: "Show me ALL users and their orders. If a user hasn't ordered anything, still show them — the order column will just be empty."</p>
    <p>LEFT JOIN is <strong>extremely common</strong> in real apps. For example: "Show me all blog posts and their comments" — posts without comments still appear!</p>
  `,
  'm2-l3': `
    <p>A <strong>self-join</strong> is like looking at a <strong>family tree</strong> — you're connecting a table to itself to show relationships.</p>
    <p>Imagine a company org chart. Bob manages Alice, and Alice manages Charlie. All this info is in ONE table called "employees". To show "who manages whom", you need to join the employees table to itself!</p>
    <p><code>SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;</code></p>
    <p>This makes a copy of the employees table in your mind — one copy called "employees" and another called "managers" — then matches them up by manager ID.</p>
    <p><strong>CROSS JOIN</strong> is like <strong>pairing every student with every pizza topping</strong> to see all possible combinations! It's rarely used but great for generating test data.</p>
    <p><strong>UNION</strong> is like <strong>stacking two stacks of papers</strong> on top of each other. Each paper must have the same kind of info (same columns), and UNION removes duplicates while UNION ALL keeps them.</p>
    <p>Example: "Show me all names from both the employees table AND the customers table in one list."</p>
  `,

  // ─── Module 3: PostgreSQL Indexes ───
  'm3-l1': `
    <p><strong>Indexes</strong> are like the <strong>index at the back of a textbook</strong>. Without one, finding "Photosynthesis" means flipping through every page. With an index, you look up "Photosynthesis → page 142" and jump straight there!</p>
    <p>PostgreSQL offers <strong>different types of indexes</strong> for different jobs — like having different tools in a toolbox:</p>
    <ul>
      <li><strong>B-tree</strong> — The default, all-purpose index. Great for <code>=</code>, <code>></code>, <code><</code>, <code>ORDER BY</code>. Like a <strong>phone book</strong> — sorted alphabetically for fast lookup.</li>
      <li><strong>GiST</strong> — For <strong>geometric data</strong> and full-text search. Like a <strong>map</strong> — good for "find all restaurants within 5 miles."</li>
      <li><strong>GIN</strong> — For <strong>array and JSONB data</strong>. Like a <strong>catalog of ingredients</strong> — "which recipes contain both 'chocolate' AND 'peanut butter'?"</li>
      <li><strong>BRIN</strong> — For <strong>very large, naturally-ordered data</strong> like timestamps. Like a <strong>table of contents by chapter</strong> instead of an index of every word.</li>
    </ul>
    <p><strong>Trade-off:</strong> Indexes speed up <strong>reading</strong> but slow down <strong>writing</strong>. Like having a card catalog — helpful for finding books, but you must update every card every time you add a new book!</p>
  `,
  'm3-l2': `
    <p>PostgreSQL can store <strong>JSON data</strong> in two ways: <code>json</code> (exact copy of the input text) and <code>jsonb</code> (decomposed binary format). <strong>JSONB is almost always the better choice</strong>.</p>
    <p>Think of it like this: <code>json</code> is like keeping a <strong>photocopy of a receipt</strong> — you can see it, but you can't easily search inside it. <code>jsonb</code> is like entering each item into a <strong>spreadsheet</strong> — you can search, compare, and manipulate individual values!</p>
    <p>Key JSONB operators:</p>
    <ul>
      <li><code>-></code> — Gets a value as JSON. Like "give me the box labeled 'address'."</li>
      <li><code>->></code> — Gets a value as text. Like "open the box labeled 'address' and read me what's inside."</li>
      <li><code>@></code> — "Does this JSON contain that JSON?" Like "does this order include a laptop?"</li>
      <li><code>?</code> — "Does this key exist?" Like "does this profile have a 'twitter' field?"</li>
    </ul>
    <p>PostgreSQL also lets you <strong>index JSONB data</strong> with GIN indexes, making searches on JSON data incredibly fast — even with millions of rows!</p>
  `,
  'm3-l3': `
    <p>Let's dive deeper into <strong>advanced JSONB techniques</strong> and <strong>JSONB schema design</strong>.</p>
    <p><strong>JSONB Path Queries</strong> use the <code>#></code> and <code>#>></code> operators to navigate nested structures:</p>
    <p><code>SELECT metadata #>> '{address, city}' FROM user_profiles;</code> — "Go into the 'address' object, then get the 'city' field as text."</p>
    <p>Think of it like <strong>clicking through folders</strong> on your computer: Documents → Work → Report.pdf — that's a path!</p>
    <p><strong>GIN Indexes on JSONB</strong> let you search JSON data super fast:</p>
    <p><code>CREATE INDEX idx_metadata ON user_profiles USING GIN (metadata);</code></p>
    <p>Now queries like <code>WHERE metadata @> '{"role": "admin"}'</code> will be blazing fast — like having an index of every word in every book in a library!</p>
    <p><strong>When to use JSONB vs. normal columns:</strong></p>
    <ul>
      <li>Use <strong>normal columns</strong> for data you always need and query by (name, email, price).</li>
      <li>Use <strong>JSONB</strong> for flexible, rarely-changed extra data (user preferences, custom fields, metadata).</li>
    </ul>
    <p>Think of it like a <strong>home filing system</strong>: keep important documents (passport, birth certificate) in clearly labeled folders, but throw random receipts and notes in a "miscellaneous" box (JSONB).</p>
  `,

  // ─── Module 4: Aggregate Functions ───
  'm4-l1': `
    <p><strong>Aggregate functions</strong> are like <strong>summary statistics</strong> for your data. Instead of looking at every single row, they give you one number that tells the whole story.</p>
    <p>Think of it like <strong>counting grades in a class</strong>:</p>
    <ul>
      <li><strong>COUNT(*)</strong> — "How many students are in the class?" (Just count everyone!)</li>
      <li><strong>SUM(amount)</strong> — "What's the total of all donations collected?" (Add everything up.)</li>
      <li><strong>AVG(price)</strong> — "What's the average price of all items?" (Like the class average on a test.)</li>
      <li><strong>MAX(score)</strong> — "What's the highest score?" (The top performer!)</li>
      <li><strong>MIN(score)</strong> — "What's the lowest score?" (The bottom score.)</li>
    </ul>
    <p><code>SELECT COUNT(*) FROM orders;</code> — "Tell me how many orders have been placed."</p>
    <p><code>SELECT AVG(amount) FROM orders;</code> — "What's the average order amount?"</p>
    <p>These functions <strong>collapse many rows into one number</strong>. Like asking "What's the average height of everyone in this room?" instead of measuring each person individually!</p>
  `,
  'm4-l2': `
    <p><strong>GROUP BY</strong> is like <strong>sorting LEGO bricks by color</strong> before counting them. You group similar items together and then do something with each group.</p>
    <p>Imagine a big pile of LEGO bricks in different colors. If someone asks "How many red bricks do you have?", you gather all the red ones, count them, then do the same for blue, green, etc.</p>
    <p><code>SELECT status, COUNT(*) FROM orders GROUP BY status;</code></p>
    <p>This says: "Group orders by their status (Pending, Shipped, Delivered), then count how many are in each group."</p>
    <p><strong>HAVING</strong> is like <strong>WHERE for groups</strong>. WHERE filters individual orders (like "only show orders over $100"), but HAVING filters the groups themselves (like "only show status groups that have more than 10 orders").</p>
    <p>The order matters: <strong>WHERE → GROUP BY → HAVING</strong>. Like filtering ingredients → grouping by type → filtering the groups.</p>
  `,
  'm4-l3': `
    <p>PostgreSQL has powerful <strong>advanced aggregate features</strong> for more complex analysis.</p>
    <p><strong>FILTER clause</strong> lets you aggregate only specific rows without a separate WHERE:</p>
    <p><code>SELECT COUNT(*) FILTER (WHERE amount > 100) AS big_orders FROM orders;</code></p>
    <p>This is like having a <strong>clicker counter</strong> that only clicks when the order is over $100!</p>
    <p><strong>HAVING vs. WHERE with aggregates</strong>:</p>
    <ul>
      <li><code>WHERE amount > 50</code> — "Only include orders over $50 before grouping."</li>
      <li><code>HAVING COUNT(*) > 5</code> — "Only show groups that have more than 5 orders, after grouping."</li>
    </ul>
    <p>Think of it like sorting halloween candy: WHERE removes the candy corn before you sort by type ("I don't want any candy corn at all!"). HAVING removes groups after sorting ("I only want to keep the chocolate types if there's at least 5 pieces").</p>
    <p><strong>Multiple aggregates in one query:</strong> You can combine COUNT, SUM, AVG, MIN, MAX in a single GROUP BY query — getting a complete summary in one go!</p>
  `,

  // ─── Module 5: Subqueries & CTEs ───
  'm5-l1': `
    <p>A <strong>subquery</strong> is like a <strong>question within a question</strong> — a SELECT statement inside another SELECT statement.</p>
    <p>Imagine you want to find "employees who earn more than the average salary." You need TWO steps:</p>
    <ol>
      <li>Find out what the average salary is.</li>
      <li>Find employees who earn more than that.</li>
    </ol>
    <p>A subquery lets you do both in one query:</p>
    <p><code>SELECT name FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);</code></p>
    <p>The inner query is like asking "What's the average salary?" and getting the answer, then using it to filter. Like a <strong>Russian nesting doll</strong> — a smaller query inside a bigger query!</p>
    <p><strong>Types of subqueries:</strong></p>
    <ul>
      <li><strong>Scalar</strong> — Returns a single value (like a number or text)</li>
      <li><strong>Row</strong> — Returns a single row with multiple columns</li>
      <li><strong>Table</strong> — Returns a whole result set that can be used like a table</li>
    </ul>
    <p><strong>Correlated subqueries</strong> are like asking a question that depends on each row: "For each employee, is their salary above the average of THEIR department?" Each employee gets a different comparison!</p>
  `,
  'm5-l2': `
    <p>A <strong>CTE (Common Table Expression)</strong> is like a <strong>temporary sticky note</strong> where you write down a query result so you can use it later in the same query.</p>
    <p>Imagine solving a multi-step math problem. Instead of cramming everything into one giant formula, you break it into steps: "First, calculate X. Then, using X, calculate Y. Then, using Y, get the final answer."</p>
    <p><strong>Regular CTEs</strong> work the same way:</p>
    <p><code>WITH high_value_orders AS (SELECT * FROM orders WHERE amount > 1000)<br>SELECT * FROM high_value_orders WHERE status = 'Pending';</code></p>
    <p>This says: "First, create a temporary result called 'high_value_orders' containing all big orders. Then, find the pending ones from that result."</p>
    <p><strong>Recursive CTEs</strong> are like <strong>a mirror staring at another mirror</strong> — they keep going deeper and deeper until they hit a stopping point. Perfect for:</p>
    <ul>
      <li>Org charts (who reports to whom, and who reports to those people...)</li>
      <li>Category trees (Parent → Child → Grandchild)</li>
      <li>Social media threads (reply to reply to reply)</li>
    </ul>
    <p>CTEs make your queries much <strong>easier to read</strong> — like a recipe with clear steps instead of one giant paragraph!</p>
  `,

  // ─── Module 6: Window Functions ───
  'm6-l1': `
    <p><strong>Window functions</strong> are like <strong>seeing the whole neighborhood while looking at one house</strong>. Normal queries show individual rows, but window functions let you also see how each row relates to the group around it.</p>
    <p>Imagine you're in a race, and you know your time (30 seconds). But you also want to know: "What's the fastest time overall?" "What's the average time?" "What's my rank?"</p>
    <p>A window function can answer ALL of these while still showing each runner individually!</p>
    <p><code>SELECT name, amount, AVG(amount) OVER () AS avg_amount FROM orders;</code></p>
    <p>This shows: each order's name, its amount, AND the average amount of ALL orders — all in the same row!</p>
    <p>Key window functions:</p>
    <ul>
      <li><strong>ROW_NUMBER()</strong> — "Give each row a number (1, 2, 3...) within its group."</li>
      <li><strong>RANK()</strong> — "What's the ranking? (1, 2, 2, 4 — ties skip numbers)"</li>
      <li><strong>DENSE_RANK()</strong> — "What's the ranking? (1, 2, 2, 3 — ties don't skip)"</li>
      <li><strong>NTILE(n)</strong> — "Split into n groups and tell me which group each row is in."</li>
    </ul>
    <p>The <strong>OVER ()</strong> clause defines the "window" — like looking through different windows to see different views of your data!</p>
  `,
  'm6-l2': `
    <p><strong>PARTITION BY</strong> is like <strong>GROUP BY for window functions</strong> — it splits data into groups, but instead of collapsing each group into one row, it keeps every row and shows the group calculation alongside.</p>
    <p>Imagine a classroom with 3 rows of desks. You want each student's score AND the average score of their row. PARTITION BY "row_number" calculates the average for each row separately.</p>
    <p><code>SELECT name, dept_id, salary, AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg FROM employees;</code></p>
    <p><strong>LAG and LEAD</strong> — "What was the previous row's value? What's the next row's value?" Like comparing this month's sales to last month's sales:</p>
    <p><code>SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_month_revenue FROM sales;</code></p>
    <p><strong>Window frames</strong> let you be even more specific. <code>ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING</code> means "look at the row before, this row, and the row after" — perfect for <strong>moving averages</strong>!</p>
    <p>Think of window functions as giving your data <strong>superpowers</strong> — they see things that regular queries can't!</p>
  `,

  // ─── Module 7: Full-Text Search ───
  'm7-l1': `
    <p><strong>PostgreSQL full-text search</strong> is like having <strong>Google search built into your database</strong>. Regular <code>LIKE '%keyword%'</code> searches are slow and dumb — they can't understand that "running", "ran", and "runs" are the same word.</p>
    <p><strong>tsvector</strong> is like a <strong>bag of LEGO bricks with labels</strong>. It takes a piece of text and breaks it into words (lexemes), noting where each word appears. "The cat sat on the mat" becomes a bag: 'cat':2 'mat':6 'sat':3</p>
    <p><strong>tsquery</strong> is like a <strong>search instruction card</strong>. It says "find documents that contain 'cat' AND 'mat'."</p>
    <p><code>SELECT to_tsvector('english', 'The cat sat on the mat') @@ to_tsquery('cat & mat');</code></p>
    <p>This returns <code>true</code> — the document contains both words!</p>
    <p>Think of it like this: LIKE search is like <strong>looking at every page of every book manually</strong>. Full-text search is like having a <strong>card catalog index</strong> that instantly tells you which books contain which words!</p>
  `,
  'm7-l2': `
    <p>Let's explore <strong>practical full-text search</strong> and how to make it fast and accurate.</p>
    <p><strong>Creating a search index:</strong></p>
    <p><code>CREATE INDEX idx_fts ON documents USING GIN (to_tsvector('english', body));</code></p>
    <p>This creates a GIN index on the search vectors — like building a <strong>card catalog</strong> that speeds up every search query.</p>
    <p><strong>Search ranking with ts_rank:</strong></p>
    <p><code>SELECT title, ts_rank(to_tsvector('english', body), query) AS rank FROM documents, to_tsquery('search & terms') query WHERE to_tsvector('english', body) @@ query ORDER BY rank DESC;</code></p>
    <p>This orders by <strong>relevance</strong> — the best matches appear first, just like Google!</p>
    <p><strong>Language support:</strong> PostgreSQL supports multiple languages for text search — English, French, German, Spanish, Russian, and more. It knows the grammar rules for each language!</p>
    <p>Think of it like a <strong>smart librarian</strong> who speaks many languages, knows synonyms, and can tell you exactly which books are most relevant to your question!</p>
  `,

  // ─── Module 8: Transactions & MVCC ───
  'm8-l1': `
    <p>A <strong>transaction</strong> is like a <strong>bank transfer</strong> — you want BOTH things to happen or NEITHER of them.</p>
    <p>Imagine transferring $100 from your Savings to your Checking. Step 1: Subtract $100 from Savings. Step 2: Add $100 to Checking. What if Step 1 succeeds but Step 2 fails? You just lost $100!</p>
    <p>Transactions solve this: "Do ALL of these steps, and if any one fails, UNDO everything."</p>
    <p>PostgreSQL transaction commands:</p>
    <ul>
      <li><strong>BEGIN</strong> — "Start a new batch." (Like starting a new shopping cart.)</li>
      <li><strong>COMMIT</strong> — "Everything worked! Save all changes." (Check out — the purchase is final.)</li>
      <li><strong>ROLLBACK</strong> — "Something went wrong! Undo everything since BEGIN." (Empty the shopping cart.)</li>
      <li><strong>SAVEPOINT</strong> — "Mark this spot so I can roll back to here if needed." (Like a save point in a video game!)</li>
    </ul>
    <p>Every operation in PostgreSQL runs inside a transaction — even a single SELECT! If you don't say BEGIN, PostgreSQL wraps it in an invisible transaction automatically.</p>
  `,
  'm8-l2': `
    <p><strong>MVCC</strong> (Multi-Version Concurrency Control) is PostgreSQL's superpower. It's like a <strong>time machine for your data</strong> — every reader sees a snapshot of the database "as it was when they started reading," even if others are changing data at the same time!</p>
    <p>Imagine a library where people can read books while librarians update the catalog. MVCC ensures that readers always see a <strong>consistent view</strong> — they don't see "half-updated" catalogs.</p>
    <p><strong>Isolation Levels</strong> are rules about what "weird things" you're willing to accept for better performance:</p>
    <ul>
      <li><strong>Read Committed</strong> (default) — You only see data that was committed before you started. Like reading yesterday's newspaper — not the latest breaking news, but still perfectly accurate.</li>
      <li><strong>Repeatable Read</strong> — Your view is frozen at the moment your transaction began. Like taking a photograph of the data and looking at the photo for the whole transaction.</li>
      <li><strong>Serializable</strong> — Everything happens as if transactions ran one at a time. Like a single checkout line at the supermarket — slow but perfectly fair.</li>
    </ul>
    <p>MVCC is why PostgreSQL is so good at <strong>handling many users at once</strong> — readers never block writers, and writers never block readers!</p>
  `,

  // ─── Module 9: Views ───
  'm9-l1': `
    <p>A <strong>view</strong> is like a <strong>saved search result</strong> or a <strong>virtual table</strong>. It doesn't store data — it's just a saved query that looks like a table when you use it.</p>
    <p>Think of it like a <strong>TV channel</strong>. The channel doesn't create its own shows — it just picks shows from different sources and presents them as a channel.</p>
    <p><code>CREATE VIEW user_order_summary AS SELECT u.name, COUNT(o.id) AS orders, SUM(o.amount) AS total FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id;</code></p>
    <p>Now you can query it like a regular table: <code>SELECT * FROM user_order_summary;</code></p>
    <p>Views are great because they:</p>
    <ul>
      <li><strong>Simplify complex queries</strong> — Run a complex JOIN once, save it as a view.</li>
      <li><strong>Add security</strong> — Show users only certain columns (hide salary info, for example).</li>
      <li><strong>Provide consistency</strong> — Everyone uses the same "channel" to see the same data.</li>
    </ul>
    <p>Remember: a view is like a <strong>window</strong> — you look through it to see the data, but the data itself lives in the tables behind it!</p>
  `,
  'm9-l2': `
    <p><strong>Materialized views</strong> are like a <strong>photograph of your data</strong> — they actually store the result, making them much faster to query but potentially outdated.</p>
    <p>Regular views are like <strong>live video feeds</strong> — always up-to-date but take work to compute every time. Materialized views are like <strong>printed photos</strong> — instantly available but might be from yesterday.</p>
    <p><code>CREATE MATERIALIZED VIEW monthly_sales AS SELECT DATE_TRUNC('month', order_date), SUM(amount) FROM orders GROUP BY 1;</code></p>
    <p>To refresh the photo: <code>REFRESH MATERIALIZED VIEW monthly_sales;</code></p>
    <p><strong>When to use each:</strong></p>
    <ul>
      <li>Use <strong>regular views</strong> when you need real-time data or the query is simple and fast.</li>
      <li>Use <strong>materialized views</strong> when you have expensive queries (heavy aggregations, complex JOINs) that don't need to be perfectly up-to-the-minute.</li>
    </ul>
    <p>Think of it like weather data: if you're deciding whether to go outside now, you want live radar (regular view). If you're planning a vacation next month, last month's averages (materialized view) are perfectly fine!</p>
  `,

  // ─── Module 10: Triggers & PL/pgSQL ───
  'm10-l1': `
    <p>A <strong>trigger</strong> is like a <strong>robot assistant</strong> that automatically does something when a specific event happens in your database.</p>
    <p>Think of it like setting up an <strong>automatic email reply</strong>: "When I receive an email (event), automatically send a reply saying I'm on vacation (action)."</p>
    <p>PostgreSQL triggers can fire:</p>
    <ul>
      <li><strong>BEFORE/AFTER</strong> — Before or after the event happens. BEFORE is like checking ID before letting someone in. AFTER is like sending a thank-you note after a party.</li>
      <li><strong>INSERT/UPDATE/DELETE</strong> — The event that triggers it.</li>
      <li><strong>FOR EACH ROW</strong> — Runs once for every affected row. Like checking each person's ticket at a concert.</li>
      <li><strong>FOR EACH STATEMENT</strong> — Runs once for the whole statement. Like taking a group photo after everyone's seated.</li>
    </ul>
    <p>Example: Every time a new order is placed, automatically reduce the product's stock count. You don't have to remember to do it — the trigger handles it!</p>
  `,
  'm10-l2': `
    <p><strong>PL/pgSQL</strong> is PostgreSQL's built-in programming language. It's like having <strong>mini-apps running inside your database</strong>.</p>
    <p>While regular SQL is like saying "bring me that book" (one command), PL/pgSQL is like saying "go to the library, find books on dinosaurs, check which ones are available, pick the newest one, and bring it to me" — a whole set of instructions!</p>
    <p><strong>Functions vs. Procedures:</strong></p>
    <ul>
      <li><strong>Functions</strong> — Return a value. Can be used in SELECT queries. Like a vending machine: put in coins, get a snack.</li>
      <li><strong>Procedures</strong> — Don't return a value. Used for complex operations. Like a dishwasher: you load it and start it, but it doesn't hand you back a plate directly.</li>
    </ul>
    <p><code>CREATE FUNCTION get_orders_count(user_id INT) RETURNS INT AS $$<br>DECLARE count INT;<br>BEGIN<br>SELECT COUNT(*) INTO count FROM orders WHERE user_id = user_id;<br>RETURN count;<br>END;<br>$$ LANGUAGE plpgsql;</code></p>
    <p>PL/pgSQL supports variables, IF/THEN, loops, and error handling — all the programming tools you'd expect!</p>
  `,

  // ─── Module 11: EXPLAIN ANALYZE ───
  'm11-l1': `
    <p><strong>EXPLAIN ANALYZE</strong> is like asking the database <strong>"How are you going to find this data?"</strong> and then <strong>"How long did it actually take?"</strong></p>
    <p>Think of it like a <strong>GPS showing your route before you drive</strong>, and then a trip report showing you the actual driving time and any traffic you hit!</p>
    <p><code>EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alice@example.com';</code></p>
    <p>The output might show:</p>
    <ul>
      <li><strong>Seq Scan on users</strong> — "I'll read every single row." (Slow — like checking every house on every street!)</li>
      <li><strong>Index Scan using idx_email</strong> — "I'll use the email index to jump directly to the right row." (Fast — like going to a specific address!)</li>
      <li><strong>Execution time: 0.045 ms</strong> — How long it actually took.</li>
    </ul>
    <p>PostgreSQL creates a <strong>query plan</strong> for every query — like a battle plan. EXPLAIN ANALYZE lets you see that plan and find weak spots!</p>
  `,
  'm11-l2': `
    <p>Let's learn <strong>how to read query plans</strong> and optimize slow queries.</p>
    <p><strong>Reading query plans:</strong> The plan is read <strong>from inside out, bottom to top</strong>. Each step shows:</p>
    <ul>
      <li><strong>cost=0.00..42.15</strong> — Estimated "effort" (lower is better). The first number is startup cost, the second is total cost.</li>
      <li><strong>rows=1000</strong> — Estimated number of rows.</li>
      <li><strong>width=32</strong> — Estimated width of each row in bytes.</li>
      <li><strong>actual time=0.025..0.042</strong> — (With ANALYZE) Actual timing in milliseconds.</li>
    </ul>
    <p><strong>Common optimization techniques:</strong></p>
    <ul>
      <li><strong>Add indexes</strong> on columns used in WHERE, JOIN, and ORDER BY.</li>
      <li><strong>Use covering indexes</strong> — an index that contains ALL columns your query needs. The database never touches the actual table!</li>
      <li><strong>VACUUM and ANALYZE</strong> — Like cleaning your room so you can find things faster. VACUUM reclaims dead space; ANALYZE updates statistics for the query planner.</li>
      <li><strong>Avoid SELECT *</strong> — Only select columns you need. Less data = faster queries.</li>
    </ul>
    <p>Remember: <strong>measure before optimizing!</strong> What seems slow might be fast enough. Don't waste time optimizing queries that run in 0.5ms!</p>
  `,

  // ─── Module 12: Roles & Permissions ───
  'm12-l1': `
    <p><strong>Roles and permissions</strong> in PostgreSQL are like <strong>keycards and security badges</strong> in a office building.</p>
    <p>Different people get different access levels:</p>
    <ul>
      <li><strong>Guests</strong> — Can only enter the lobby (SELECT on some tables).</li>
      <li><strong>Employees</strong> — Can access their floor (INSERT/UPDATE on certain tables).</li>
      <li><strong>Managers</strong> — Can access most areas (can create tables, manage data).</li>
      <li><strong>Admins</strong> — Have keys to every room (full database control).</li>
    </ul>
    <p><strong>Users vs. Groups:</strong> A <strong>login role</strong> is like an employee badge — it's for a person. A <strong>group role</strong> is like a department badge — it defines what "Engineering" or "HR" can do, and you assign people to those groups.</p>
    <p><code>CREATE ROLE app_readonly WITH LOGIN PASSWORD 'secure_pass';<br>GRANT CONNECT ON DATABASE mydb TO app_readonly;<br>GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;</code></p>
    <p>This creates a "read-only guest badge" that can look at data but never change anything!</p>
  `,
  'm12-l2': `
    <p><strong>Row-Level Security (RLS)</strong> is like a <strong>VIP list at a club</strong> — even if you have a keycard to the building, you can only access specific rows based on who you are.</p>
    <p>Normal permissions say "you can access the users table." RLS says "you can access users where user_id = your_user_id." It's <strong>row-level</strong> security!</p>
    <p>Think of a hospital database:</p>
    <ul>
      <li>A <strong>doctor</strong> can see all patients in their department.</li>
      <li>A <strong>nurse</strong> can see patients assigned to them.</li>
      <li>A <strong>patient</strong> can only see their own medical records.</li>
      <li>Even though everyone uses the same "patients" table, RLS ensures they only see the right rows!</li>
    </ul>
    <p><code>CREATE POLICY user_isolation ON users FOR ALL USING (id = current_user_id());</code></p>
    <p>This says: "For ALL operations on the users table, only allow access to rows where the id matches the current user." Powerful stuff!</p>
    <p>Supabase (a popular PostgreSQL hosting service) uses RLS extensively to let you build secure apps directly from the frontend!</p>
  `,

  // ─── Module 13: Backup & Restore ───
  'm13-l1': `
    <p><strong>pg_dump</strong> is like making a <strong>photocopy of your entire filing cabinet</strong>. It creates a file containing all your database structure and data that you can use to restore later.</p>
    <p>Think of it like <strong>backing up your phone</strong> — you create a snapshot of everything so you can restore it if something goes wrong.</p>
    <p><code>pg_dump mydb > mydb_backup.sql</code> — "Make a copy of 'mydb' and save it to a file."</p>
    <p><strong>pg_restore</strong> is the reverse — like <strong>restoring your phone from a backup</strong>:</p>
    <p><code>psql mydb < mydb_backup.sql</code> — "Restore the database from this backup file."</p>
    <p>Different backup formats:</p>
    <ul>
      <li><strong>Plain SQL</strong> (.sql) — Human-readable text. Great for small databases, easy to edit.</li>
      <li><strong>Custom</strong> (.dump) — Compressed, can restore individual tables. Like a zipped backup folder.</li>
      <li><strong>Directory</strong> — Creates multiple files. Fast and parallel.</li>
    </ul>
    <p>Always, always, ALWAYS back up your database! It's like wearing a seatbelt — you hope you never need it, but you'll be glad you have it!</p>
  `,
  'm13-l2': `
    <p><strong>Continuous Archiving and Point-in-Time Recovery (PITR)</strong> is like having a <strong>time machine for your database</strong>. You can restore to any moment in time!</p>
    <p>Think of it like this: pg_dump is a <strong>photo album</strong> — snapshots at specific moments. PITR is a <strong>video recording</strong> — you can rewind to any second!</p>
    <p><strong>WAL (Write-Ahead Log)</strong> is the secret sauce. Every change to PostgreSQL is first written to the WAL (like a <strong>diary entry</strong>), then applied to the actual data files. By saving all the diary entries, you can replay them to restore to any point!</p>
    <p><strong>WAL files</strong> are like <strong>receipts from every transaction</strong> — kept in order, timestamped, and numbered. If the database crashes, PostgreSQL can "replay the receipts" to recover!</p>
    <p>Real-world strategy:</p>
    <ol>
      <li>Take a <strong>full backup</strong> weekly (like a weekly photo).</li>
      <li>Archive <strong>WAL files</strong> continuously (like recording everything that happens).</li>
      <li>To restore to Tuesday at 3:15 PM, restore the weekly backup and replay WAL files up to that exact moment!</li>
    </ol>
    <p>This is why PostgreSQL is trusted for <strong>banking, finance, and government systems</strong> — zero data loss is possible!</p>
  `,

  // ─── Module 14: Table Partitioning ───
  'm14-l1': `
    <p><strong>Table partitioning</strong> is like <strong>dividing a giant filing cabinet into labeled drawers</strong>. Instead of one enormous table with billions of rows, you split it into smaller, manageable pieces.</p>
    <p>Think of a library. Instead of having ALL books in one giant room (imagine finding anything!), they organize books into sections: Fiction, Non-fiction, Science, History. Each section is like a partition.</p>
    <p>PostgreSQL supports three main types:</p>
    <ul>
      <li><strong>Range Partitioning</strong> — Split by ranges. "Orders from January in Drawer 1, February in Drawer 2." Like organizing receipts by month.</li>
      <li><strong>List Partitioning</strong> — Split by specific values. "East region orders in Drawer 1, West region in Drawer 2." Like sorting mail by state.</li>
      <li><strong>Hash Partitioning</strong> — Split by a hash function. "Order #1 goes to Drawer 1, #2 to Drawer 2, #3 to Drawer 1..." Like dealing cards to players!</li>
    </ul>
    <p>Benefits: queries that filter on the partition key only scan the relevant drawer (much faster!), and you can archive old partitions easily.</p>
  `,
  'm14-l2': `
    <p>After setting up partitions, you need to <strong>manage them</strong> properly — like maintaining a filing system.</p>
    <p><strong>Adding new partitions:</strong> As time passes, you need new time-based partitions:</p>
    <p><code>CREATE TABLE orders_2025_q1 PARTITION OF orders FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');</code></p>
    <p>Like adding a new drawer for the new quarter!</p>
    <p><strong>Detaching and archiving old partitions:</strong> Old data can be detached (removed from the partitioned table but kept as a standalone table) or dropped entirely:</p>
    <p><code>ALTER TABLE orders DETACH PARTITION orders_2023;</code> — "Remove this drawer from the cabinet but keep the drawer."</p>
    <p><strong>Partition pruning</strong> is PostgreSQL's smart optimization — when you query <code>WHERE order_date >= '2025-03-01'</code>, PostgreSQL automatically knows to only search the relevant partitions and ignores the rest. Like telling a librarian "only look in the 2025 section"!</p>
    <p><strong>Best practices:</strong></p>
    <ul>
      <li>Partition on columns you frequently filter by (usually date or region).</li>
      <li>Don't create too many partitions — hundreds is fine, thousands can be slow.</li>
      <li>Use partitioning for tables over 100GB or with billions of rows.</li>
      <li>Indexes on partitioned tables automatically apply to each partition.</li>
    </ul>
  `,

  // ─── Module 15: PostgreSQL Drivers ───
  'm15-l1': `
    <p><strong>psycopg2</strong> is the most popular <strong>Python driver for PostgreSQL</strong>. It's like having a <strong>translator</strong> between your Python code and the PostgreSQL database.</p>
    <p>Your Python code speaks Python. PostgreSQL speaks SQL. psycopg2 translates between them!</p>
    <p><code>import psycopg2<br>conn = psycopg2.connect("dbname=mydb user=myuser password=mypass host=localhost")<br>cur = conn.cursor()<br>cur.execute("SELECT * FROM users")<br>rows = cur.fetchall()</code></p>
    <p>Think of it like this: <code>conn = psycopg2.connect()</code> is like <strong>calling the database on the phone</strong> and getting connected. <code>cur.execute()</code> is like <strong>asking a question</strong>. <code>cur.fetchall()</code> is like <strong>writing down the answer</strong>.</p>
    <p><strong>Parameterized queries</strong> prevent SQL injection — always use <code>%s</code> placeholders instead of formatting strings directly!</p>
    <p>✅ Safe: <code>cur.execute("SELECT * FROM users WHERE email = %s", (email,))</code></p>
    <p>❌ Dangerous: <code>cur.execute(f"SELECT * FROM users WHERE email = '{email}'")</code></p>
    <p>It's like the difference between handing someone a sealed envelope (safe) vs. reading the contents out loud (anyone can listen)!</p>
  `,
  'm15-l2': `
    <p><strong>node-postgres</strong> is the most popular <strong>Node.js driver for PostgreSQL</strong>. It's like having a <strong>JavaScript translator</strong> between your Node.js code and PostgreSQL.</p>
    <p><code>const { Pool } = require('pg');<br>const pool = new Pool({ database: 'mydb', user: 'myuser', password: 'mypass' });<br>const { rows } = await pool.query('SELECT * FROM users');</code></p>
    <p><strong>Connection pooling</strong> is like having a <strong>taxi fleet</strong> instead of a single car. Instead of creating a new connection for every request (slow — like calling a taxi from scratch each time), you maintain a pool of ready-to-use connections and just grab one when needed.</p>
    <p>Without pooling: Start car → drive → park → repeat (for every user request).</p>
    <p>With pooling: Fleet of taxis waiting at the stand. Grab one, go, return to the stand (reusable!).</p>
    <p><strong>Best practices for both drivers:</strong></p>
    <ul>
      <li><strong>Always use connection pooling</strong> in web applications.</li>
      <li><strong>Use parameterized queries</strong> to prevent SQL injection.</li>
      <li><strong>Handle errors</strong> with try/catch — network connections can fail!</li>
      <li><strong>Close connections</strong> gracefully when your app shuts down.</li>
    </ul>
    <p>PostgreSQL drivers are how real applications talk to the database. Mastering them is the bridge between knowing SQL and building actual products!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5PostgresData = eli5PostgresData;
