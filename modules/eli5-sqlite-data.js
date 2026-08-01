/**
 * ELI5 (Explain Like I'm 5) content for SQLite Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5SqliteData = {
  // ─── Module 1: SQLite Basics (CREATE & INSERT) ───
  'm1-l1': `
    <p>Think of a database like a <strong>digital filing cabinet</strong>. Each drawer in the cabinet is a <strong>table</strong>, and each file folder inside is a <strong>row</strong> of data.</p>
    <p><strong>SQLite</strong> is a special kind of database that lives in a <strong>single file</strong> on your computer — like keeping all your recipes in one notebook instead of having a whole library!</p>
    <p>To start storing data, you need to create a <strong>table</strong> first. A table is like a <strong>spreadsheet</strong> with columns and rows. You decide what columns you want (like "Name", "Age", "Email") and what type of data each column will hold (text, numbers, etc.).</p>
    <p><code>CREATE TABLE students (id INTEGER, name TEXT, grade INTEGER);</code></p>
    <p>This is like saying: "I want a new drawer called 'students'. It will have an ID number, a name, and a grade for each student."</p>
    <p>The <strong>PRIMARY KEY</strong> is a special column that acts like a <strong>unique barcode</strong> on every row — no two rows can have the same barcode, so you can always find exactly the row you need.</p>
  `,
  'm1-l2': `
    <p>Once you have a table (like a blank spreadsheet), you need to <strong>add data</strong> to it. That's what <code>INSERT INTO</code> does!</p>
    <p>Think of it like <strong>filling out a form</strong>. The form has fields: Name, Age, Email. You fill in the values and submit. That's exactly what INSERT does — it adds a new row to your table.</p>
    <p><code>INSERT INTO students (name, grade) VALUES ('Alice', 95);</code></p>
    <p>This is like writing: "In the students table, add a new entry where the name is 'Alice' and the grade is 95."</p>
    <p>If you don't provide a value for a column, SQLite fills it with <strong>NULL</strong> (which means "unknown" or "empty" — like leaving a blank space on a form).</p>
    <p>After inserting, you can check your data with <code>SELECT * FROM students;</code> — like looking at your completed form to make sure everything was filled in correctly!</p>
  `,
  'm1-l3': `
    <p>When you create a table, you need to think about what <strong>kind of data</strong> each column will hold — like deciding whether a box is for shoes, books, or toys.</p>
    <p>SQLite has several <strong>data types</strong> you can use:</p>
    <ul>
      <li><strong>INTEGER</strong> — Whole numbers like 1, 42, or -7. Like counting apples.</li>
      <li><strong>REAL</strong> — Decimal numbers like 3.14 or 99.99. Like prices or measurements.</li>
      <li><strong>TEXT</strong> — Words and sentences. Like names or descriptions.</li>
      <li><strong>BLOB</strong> — Raw data like images or files. Like putting a photo in an envelope.</li>
      <li><strong>NULL</strong> — "I don't know yet" or "empty". Like a blank space on a form.</li>
    </ul>
    <p>SQLite is <strong>flexible</strong> — it doesn't force you to be super strict about types. You can put text in an INTEGER column if you want (though it's not a great idea, like putting a book in a shoe box!).</p>
    <p>The best practice is to <strong>choose the right type</strong> for each column — like using the right container for each item to keep everything organized!</p>
  `,

  // ─── Module 2: Querying & JOINs ───
  'm2-l1': `
    <p><code>SELECT</code> is like asking a <strong>question to your data</strong>. You're basically saying: "Show me what's in this table!"</p>
    <p><code>SELECT * FROM employees;</code> means "SHOW ME EVERYTHING in the employees drawer!" (The * means "all columns".)</p>
    <p><code>WHERE</code> is like a <strong>filter</strong> — it narrows down what you see. It's like saying "Show me only the employees who are Developers" instead of all employees.</p>
    <p><code>SELECT name FROM employees WHERE role = 'Developer';</code></p>
    <p>This reads like: "Show me only the NAMES of employees WHERE their role is 'Developer'."</p>
    <p>Think of it like using a <strong>search engine</strong> for your data. You type what you're looking for, and the database shows you what matches!</p>
    <p>You can also use comparisons like <code>></code> (greater than), <code><</code> (less than), <code>=</code> (equals), and <code>!=</code> (not equals) to filter even more precisely.</p>
  `,
  'm2-l2': `
    <p><code>JOIN</code> is like <strong>connecting two puzzle pieces</strong> to see the full picture.</p>
    <p>Imagine you have two lists: one list has employee names and their department IDs, and another list has department IDs and department names. Neither list alone tells you "which department does Alice work in?"</p>
    <p>JOIN lets you <strong>combine them</strong> by matching the department ID in both lists. Now you can see "Alice → Engineering" instead of "Alice → Department 1".</p>
    <p><code>SELECT e.name, d.dept_name FROM employees e JOIN departments d ON e.dept_id = d.id;</code></p>
    <p>This reads like: "Show me employee names and their department names by matching the department ID in both tables."</p>
    <p><strong>INNER JOIN</strong> only shows rows that match in BOTH tables. If an employee doesn't have a department, they won't appear. It's like only inviting people who RSVP'd "yes" to the party!</p>
  `,
  'm2-l3': `
    <p>There are different <strong>types of JOINs</strong> — like different ways of inviting people to a party!</p>
    <ul>
      <li><strong>INNER JOIN</strong> — Only people who RSVP'd "yes" come to the party. (Only matching rows from both tables.)</li>
      <li><strong>LEFT JOIN</strong> — Everyone on the guest list comes, even if they didn't RSVP. If someone didn't RSVP, their RSVP column shows "unknown". (All rows from left table, even if no match in right.)</li>
      <li><strong>CROSS JOIN</strong> — You invite everyone, and they each bring a plus-one, creating EVERY possible combination! Like a mixer where everyone meets everyone.</li>
    </ul>
    <p>LEFT JOIN is super useful in real life. For example: "Show me ALL students and any grades they have." Students without grades will still show up — their grade will just say "No grade recorded" (NULL).</p>
    <p>Think of JOINs as your way of <strong>connecting related information</strong> — like looking up someone's address in a phone book using their name.</p>
  `,

  // ─── Module 3: Constraints & Indexes ───
  'm3-l1': `
    <p><strong>Constraints</strong> are like <strong>rules for a game</strong> — they make sure everyone plays by the same rules and the data stays clean and correct.</p>
    <p>Think of a classroom sign-up sheet:</p>
    <ul>
      <li><strong>NOT NULL</strong> — "You MUST fill in your name. No blank entries allowed!"</li>
      <li><strong>UNIQUE</strong> — "No two students can have the same email address."</li>
      <li><strong>PRIMARY KEY</strong> — "Each student gets a unique ID number (like a student ID card)."</li>
      <li><strong>FOREIGN KEY</strong> — "The class you sign up for must actually EXIST in the classes list."</li>
      <li><strong>CHECK</strong> — "Your age must be greater than 0. Can't have negative age!"</li>
      <li><strong>DEFAULT</strong> — "If you don't pick a subscription plan, you get the 'Free' plan automatically."</li>
    </ul>
    <p>Without constraints, your data can get messy — like a library where books are shelved randomly, some have no labels, and two books have the same barcode!</p>
  `,
  'm3-l2': `
    <p><strong>Indexes</strong> are like the <strong>index at the back of a textbook</strong>. Without an index, finding "Photosynthesis" means flipping through every single page until you find it. With an index, you look up "Photosynthesis" and it says "page 142" — you go straight there!</p>
    <p>In a database, an index works the same way. Without an index, if you ask for "all employees named 'Alice'", the database reads every single row — like flipping through every page of a book.</p>
    <p>With an index on the "name" column, the database can jump directly to the rows with "Alice" — much faster!</p>
    <p><strong>Trade-off:</strong> Indexes make <strong>reading</strong> faster but <strong>writing</strong> slower. Every time you add or change data, the database has to update the index too. It's like having a book index that you have to update every time you write a new page!</p>
    <p>Use indexes on columns you search or sort by frequently — like "email" (you often search by email) but probably not "favorite_color".</p>
  `,

  // ─── Module 4: UPDATE & DELETE ───
  'm4-l1': `
    <p><code>UPDATE</code> is like using <strong>white-out to fix a mistake</strong> on a form. You find the entry that has the wrong info, and you change it to the right info.</p>
    <p><code>UPDATE employees SET role = 'Senior Developer' WHERE name = 'Alice';</code></p>
    <p>This says: "Find the employee named 'Alice' and change her role to 'Senior Developer'."</p>
    <p><strong>⚠️ The most important rule of UPDATE: Don't forget the WHERE clause!</strong> Without WHERE, you'll update EVERY row — like pouring white-out over the ENTIRE page instead of just one word!</p>
    <p>You can update multiple columns at once: <code>SET role = 'Manager', salary = 80000</code>. Like fixing both the job title AND the salary in one go.</p>
    <p>You can also update multiple rows at once. For example: "Give everyone in Engineering a 10% raise" — <code>UPDATE employees SET salary = salary * 1.1 WHERE dept_id = 1;</code></p>
  `,
  'm4-l2': `
    <p><code>DELETE</code> is like <strong>throwing something in the trash</strong>. Once you delete a row from a database, it's gone!</p>
    <p><code>DELETE FROM employees WHERE name = 'Bob';</code></p>
    <p>This says: "Find the employee named Bob and remove that row from the table."</p>
    <p><strong>⚠️ Just like UPDATE, be CAREFUL with DELETE!</strong> If you write <code>DELETE FROM employees;</code> without a WHERE clause, you'll delete ALL rows — like emptying the entire filing cabinet instead of just one folder!</p>
    <p><code>DELETE FROM employees;</code> removes all rows but keeps the table structure (like an empty spreadsheet). <code>DROP TABLE employees;</code> removes the WHOLE table (like throwing away the entire drawer!).</p>
    <p>To delete ALL rows quickly, use <code>DELETE FROM employees;</code> (slow for big tables) or <code>TRUNCATE TABLE employees;</code> (faster - SQLite uses DELETE FROM without WHERE).</p>
    <p>Real-world tip: Many apps don't actually DELETE data — they use a "soft delete" by adding a column like <code>is_deleted = 1</code>. It's like putting things in a "hidden" folder instead of the trash, so you can recover them if needed!</p>
  `,

  // ─── Module 5: Aggregate Functions ───
  'm5-l1': `
    <p><strong>Aggregate functions</strong> are like <strong>summary statistics</strong> for your data. Instead of looking at every single row, they give you one number that summarizes everything.</p>
    <p>Think of it like <strong>counting grades in a class</strong>:</p>
    <ul>
      <li><strong>COUNT(*)</strong> — "How many students are in the class?" (Just count everyone!)</li>
      <li><strong>SUM(salary)</strong> — "What's the total payroll for all employees?" (Add up everyone's salary.)</li>
      <li><strong>AVG(price)</strong> — "What's the average price of all products?" (Like calculating the class average on a test.)</li>
      <li><strong>MAX(score)</strong> — "What's the highest score?" (The top performer!)</li>
      <li><strong>MIN(score)</strong> — "What's the lowest score?" (The lowest score.)</li>
    </ul>
    <p><code>SELECT COUNT(*) FROM employees;</code> — "Tell me how many employees there are."</p>
    <p><code>SELECT AVG(salary) FROM employees;</code> — "What's the average salary?"</p>
    <p>These functions <strong>collapse many rows into one number</strong>. Like asking "What's the average height of everyone in this room?" instead of measuring each person individually.</p>
  `,
  'm5-l2': `
    <p>Sometimes you want to <strong>count only the non-empty values</strong> or <strong>only the unique values</strong>. That's where <code>DISTINCT</code> and handling NULL comes in.</p>
    <p><strong>COUNT(DISTINCT column)</strong> — "How many DIFFERENT cities do our customers live in?" instead of "How many customers do we have?"</p>
    <p>Imagine you have a list: New York, New York, London, Paris, London. COUNT(city) = 5 (total entries). COUNT(DISTINCT city) = 3 (only the unique cities).</p>
    <p><strong>NULL values</strong> are tricky with aggregates. COUNT(*) counts ALL rows including those with NULL values. COUNT(column_name) counts only rows where that column has a non-NULL value.</p>
    <p>Think of it like taking attendance: COUNT(*) = total students on the roster. COUNT(grade) = students who actually took the test and got a grade.</p>
    <p><strong>COALESCE</strong> is like a <strong>safety net</strong> — it replaces NULL with a default value. <code>COALESCE(salary, 0)</code> means "Use the salary if it exists, otherwise use 0."</p>
  `,
  'm5-l3': `
    <p>You can combine aggregate functions with <code>CASE</code> expressions to do <strong>conditional counting and summing</strong> — like counting only the items that meet certain conditions.</p>
    <p><code>SELECT COUNT(CASE WHEN role = 'Developer' THEN 1 END) AS dev_count FROM employees;</code></p>
    <p>This says: "Count only the rows where role is 'Developer'."</p>
    <p>Think of it like <strong>counting apples in a basket of mixed fruit</strong>. You don't count everything — you only count the apples!</p>
    <p>You can also do conditional sums: "Add up salaries of only the Managers."</p>
    <p><code>SELECT SUM(CASE WHEN role = 'Manager' THEN salary ELSE 0 END) AS mgr_payroll FROM employees;</code></p>
    <p>Real-world use: In an e-commerce database, you might count "how many orders > $100" vs "how many orders < $10" in a single query!</p>
  `,

  // ─── Module 6: GROUP BY & HAVING ───
  'm6-l1': `
    <p><strong>GROUP BY</strong> is like <strong>sorting LEGO bricks by color</strong> before counting them. You group similar items together and then do something with each group.</p>
    <p>Imagine you have a big pile of LEGO bricks in different colors. If someone asks "How many red bricks do you have?", you'd gather all the red ones together, count them, then do the same for blue, green, etc.</p>
    <p><code>SELECT role, COUNT(*) FROM employees GROUP BY role;</code></p>
    <p>This says: "Group employees by their role, then count how many are in each group." The result might be: Developer → 3, Manager → 2, Designer → 1.</p>
    <p>GROUP BY always works with <strong>aggregate functions</strong> (COUNT, SUM, AVG, etc.). You're basically saying: "Split my data into groups, then calculate something for each group."</p>
    <p>Think of it like <strong>pizza delivery</strong>: GROUP BY would be grouping orders by neighborhood, so you can see how many pizzas each neighborhood ordered!</p>
  `,
  'm6-l2': `
    <p><strong>HAVING</strong> is like <strong>WHERE for groups</strong>. WHERE filters individual rows before grouping, but HAVING filters the groups themselves after grouping.</p>
    <p>Let's use the pizza example:</p>
    <ul>
      <li><strong>WHERE</strong> — "Only include pepperoni pizzas in the count." (Filter individual rows)</li>
      <li><strong>GROUP BY</strong> — "Now group the remaining orders by neighborhood."</li>
      <li><strong>HAVING</strong> — "Only show neighborhoods that ordered more than 10 pizzas." (Filter groups)</li>
    </ul>
    <p><code>SELECT role, AVG(salary) FROM employees GROUP BY role HAVING AVG(salary) > 50000;</code></p>
    <p>This says: "Group employees by role, calculate the average salary for each role, but only show me roles where the average salary is above $50,000."</p>
    <p>The order matters: <code>WHERE</code> → <code>GROUP BY</code> → <code>HAVING</code>. It's like: "Remove stuff you don't want → organize into groups → remove groups you don't want."</p>
    <p>Remember: HAVING is for conditions on <strong>groups</strong> (like average > X, count > Y). WHERE is for conditions on <strong>individual rows</strong> (like role = 'Developer').</p>
  `,

  // ─── Module 7: Subqueries & CTEs ───
  'm7-l1': `
    <p>A <strong>subquery</strong> is like a <strong>question within a question</strong>. It's a SELECT statement inside another SELECT statement.</p>
    <p>Imagine you want to find "employees who earn more than the average salary." You need TWO steps:</p>
    <ol>
      <li>Find out what the average salary is.</li>
      <li>Find employees who earn more than that.</li>
    </ol>
    <p>A subquery lets you do both in one query:</p>
    <p><code>SELECT name FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);</code></p>
    <p>The inner query <code>(SELECT AVG(salary) FROM employees)</code> is like asking "What's the average salary?" first, then using that answer to filter.</p>
    <p>Think of it like a <strong>nested Russian doll</strong> — there's a query inside a query inside a query.</p>
    <p><strong>Types of subqueries:</strong></p>
    <ul>
      <li><strong>Scalar</strong> — Returns a single value (like the average)</li>
      <li><strong>Row</strong> — Returns a single row</li>
      <li><strong>Table</strong> — Returns a whole table of results</li>
    </ul>
  `,
  'm7-l2': `
    <p>A <strong>CTE (Common Table Expression)</strong> is like a <strong>temporary sticky note</strong> where you write down a query result so you can use it later in the same query.</p>
    <p>Imagine you're solving a multi-step math problem. Instead of cramming everything into one giant formula, you break it into steps: "First, calculate X. Then, using X, calculate Y. Then, using Y, get the final answer."</p>
    <p>CTEs work the same way:</p>
    <p><code>WITH dev_avg AS (SELECT AVG(salary) AS avg_sal FROM employees WHERE role = 'Developer')<br>SELECT name, salary FROM employees, dev_avg WHERE salary > dev_avg.avg_sal;</code></p>
    <p>This says: "First, calculate the average salary of Developers and call it 'dev_avg'. Then, use that to find employees earning more than that average."</p>
    <p><strong>Recursive CTEs</strong> are like <strong>a mirror staring at another mirror</strong> — they keep going deeper and deeper until they hit a stopping point. Perfect for things like:</p>
    <ul>
      <li>Organizational charts (who reports to whom, and who reports to those people...)</li>
      <li>Family trees</li>
      <li>Comment threads (replies to replies to replies)</li>
    </ul>
    <p>CTEs make your queries much <strong>easier to read</strong> — like writing a recipe with clear steps instead of one giant paragraph!</p>
  `,

  // ─── Module 8: Views ───
  'm8-l1': `
    <p>A <strong>view</strong> is like a <strong>saved search result</strong> or a <strong>virtual table</strong>. It doesn't store data itself — it's just a saved query that looks like a table when you use it.</p>
    <p>Think of it like a <strong>TV channel</strong>. The TV channel doesn't create its own shows — it just chooses shows from different sources and presents them as a channel. When you turn to the "Sports Channel", you see sports content pulled from various sources.</p>
    <p>Similarly, a view called "developer_view" might combine data from employees and departments tables, but it <strong>looks like a regular table</strong> when you query it:</p>
    <p><code>CREATE VIEW developer_view AS SELECT e.name, e.role, d.dept_name FROM employees e JOIN departments d ON e.dept_id = d.id;</code></p>
    <p>Now you can query it like a table: <code>SELECT * FROM developer_view;</code></p>
    <p>Views are great because they:</p>
    <ul>
      <li><strong>Simplify complex queries</strong> — Run a complex JOIN once, save it as a view, then query the view easily.</li>
      <li><strong>Add security</strong> — You can show users only certain columns (hide salary info, for example).</li>
      <li><strong>Provide consistency</strong> — Everyone uses the same "channel" to see the same data.</li>
    </ul>
  `,
  'm8-l2': `
    <p><strong>Updatable views</strong> are views that let you <strong>edit the underlying data</strong> through the view. But there are some rules — you can't update a view if the database can't figure out which underlying rows to change.</p>
    <p>Think of it like <strong>looking through a window</strong>. If the window is clean and clear (a simple view based on one table), you can reach through and change what's on the other side. But if the window is frosted or shows multiple rooms (a complex view with JOINs and GROUP BY), you can't reach through it.</p>
    <p><strong>Simple views</strong> (one table, no aggregates) can be updated. For example, if you have a view showing only Developers, you can UPDATE salaries through that view.</p>
    <p><strong>Complex views</strong> (multiple tables, GROUP BY, DISTINCT) are <strong>read-only</strong>. You can only SELECT from them, not INSERT, UPDATE, or DELETE.</p>
    <p>To drop a view: <code>DROP VIEW view_name;</code> — Like turning off a TV channel. The original data (the shows) still exists, just not the channel anymore.</p>
    <p><strong>Temporary views</strong> are like <strong>sticky notes</strong> — they disappear when you close the database connection. Perfect for one-time analysis!</p>
  `,

  // ─── Module 9: Transactions ───
  'm9-l1': `
    <p>A <strong>transaction</strong> is like a <strong>bank transfer</strong> — you want BOTH things to happen or NEITHER of them.</p>
    <p>Imagine transferring $100 from your Savings to your Checking. This involves two steps: subtract $100 from Savings, then add $100 to Checking. What if Step 1 succeeds but Step 2 fails? You just lost $100!</p>
    <p>Transactions solve this by grouping operations together: "Do ALL of these steps, and if any one fails, UNDO everything."</p>
    <p>In SQLite:</p>
    <ul>
      <li><strong>BEGIN TRANSACTION</strong> — "Start a new batch of operations." (Like starting a new shopping cart.)</li>
      <li><strong>COMMIT</strong> — "Everything worked! Save all changes." (Like checking out — the purchase is final.)</li>
      <li><strong>ROLLBACK</strong> — "Something went wrong! Undo everything since BEGIN." (Like emptying the shopping cart.)</li>
    </ul>
    <p>SQLite automatically wraps every INSERT/UPDATE/DELETE in a transaction, but for multiple operations, you should use explicit transactions for safety and speed!</p>
  `,
  'm9-l2': `
    <p>ACID is an <strong>acronym for the four guarantees</strong> that transactions provide. Think of it like a <strong>vending machine</strong> that always works correctly.</p>
    <ul>
      <li><strong>A</strong>tomic — "All or nothing." Like a vending machine that either gives you the snack AND takes your money, or does neither. No half-way states!</li>
      <li><strong>C</strong>onsistent — "The data always follows the rules." Like a vending machine that won't sell you a snack if it's empty (constraints are maintained).</li>
      <li><strong>I</strong>solated — "Other people can't see your transaction until it's done." Like a private shopping session — nobody sees what's in your cart until you check out.</li>
      <li><strong>D</strong>urable — "Once you COMMIT, the data is saved forever." Even if the power goes out, the machine remembers your purchase.</li>
    </ul>
    <p><strong>Concurrency</strong> is about <strong>multiple people using the database at the same time</strong>. SQLite uses locks to prevent problems:</p>
    <ul>
      <li><strong>Shared lock</strong> — Many people can read at the same time (like a library).</li>
      <li><strong>Reserved lock</strong> — Someone is about to write, but others can still read.</li>
      <li><strong>Exclusive lock</strong> — Someone is writing, and NOBODY else can do anything (like a construction zone).</li>
    </ul>
    <p><strong>Busy timeout</strong> is like a polite waiting line — if another transaction is in progress, SQLite waits for a while before giving up.</p>
  `,

  // ─── Module 10: Triggers ───
  'm10-l1': `
    <p>A <strong>trigger</strong> is like a <strong>robot assistant</strong> that automatically does something when a specific event happens.</p>
    <p>Think of it like setting up an <strong>automatic email reply</strong>: "When I receive an email (event), automatically send a reply saying I'm on vacation (action)."</p>
    <p>In SQLite, triggers can automatically run when you:</p>
    <ul>
      <li><strong>INSERT</strong> a row — Like updating a "total count" column every time a new item is added.</li>
      <li><strong>UPDATE</strong> a row — Like logging the old value before changing it.</li>
      <li><strong>DELETE</strong> a row — Like archiving deleted data to a backup table.</li>
    </ul>
    <p>Example: Every time a new order is inserted, automatically update the product's stock count!</p>
    <p>Triggers are great for <strong>maintaining consistency</strong> automatically. You don't have to remember to update multiple tables — the trigger does it for you!</p>
  `,
  'm10-l2': `
    <p>Let's look at <strong>real-world trigger examples</strong> in SQLite and understand <strong>best practices</strong>.</p>
    <p><strong>Example 1: Audit Log</strong> — Automatically record who changed what and when.</p>
    <p><code>CREATE TRIGGER log_salary_changes AFTER UPDATE OF salary ON employees<br>BEGIN<br>&nbsp;&nbsp;INSERT INTO salary_audit (emp_id, old_salary, new_salary, changed_at)<br>&nbsp;&nbsp;VALUES (OLD.id, OLD.salary, NEW.salary, datetime('now'));<br>END;</code></p>
    <p>This says: "After someone updates a salary, save the old and new values with a timestamp." Like a black box recorder for your data!</p>
    <p><strong>OLD and NEW</strong> are special keywords in triggers:</p>
    <ul>
      <li><strong>OLD</strong> — The value BEFORE the change (available in UPDATE and DELETE triggers)</li>
      <li><strong>NEW</strong> — The value AFTER the change (available in INSERT and UPDATE triggers)</li>
    </ul>
    <p><strong>Best practices:</strong></p>
    <ul>
      <li>Don't put complex logic in triggers — they run automatically and can slow things down.</li>
      <li>Avoid triggers that call other triggers (cascading triggers) — it gets confusing fast!</li>
      <li>Use triggers for <strong>data validation</strong> and <strong>audit logging</strong>, NOT for business logic.</li>
      <li>Document your triggers well — they're "hidden" code that runs behind the scenes!</li>
    </ul>
  `,

  // ─── Module 11: Window Functions ───
  'm11-l1': `
    <p><strong>Window functions</strong> are like <strong>seeing the whole neighborhood while looking at one house</strong>. Normal queries show you individual rows, but window functions let you also see how each row relates to the group around it.</p>
    <p>Imagine you're in a race, and you know your time (30 seconds). But you also want to know: "What's the fastest time overall?" "What's the average time?" "What's my rank?"</p>
    <p>A window function can answer ALL of these while still showing each runner individually!</p>
    <p><code>SELECT name, salary, AVG(salary) OVER () AS avg_salary FROM employees;</code></p>
    <p>This shows each employee's name, their salary, AND the average salary of ALL employees — all in one row!</p>
    <p>Key window functions:</p>
    <ul>
      <li><strong>ROW_NUMBER()</strong> — "Give each row a number (1, 2, 3...) within its group."</li>
      <li><strong>RANK()</strong> — "What's the ranking of this row?" (Like 1st place, 2nd place, etc.)</li>
      <li><strong>LAG() / LEAD()</strong> — "What was the previous/next row's value?" (Like comparing this month's sales to last month's.)</li>
    </ul>
    <p>The <strong>OVER ()</strong> clause defines the "window" — the set of rows you're comparing against. OVER (PARTITION BY dept_id) means "compare within each department."</p>
  `,
  'm11-l2': `
    <p><strong>PARTITION BY</strong> is like <strong>GROUP BY for window functions</strong> — it splits data into groups, but instead of collapsing each group into one row, it keeps every row and shows the group calculation alongside each row.</p>
    <p>Imagine a classroom with 3 rows of desks. You want to know each student's score AND the average score of their row. PARTITION BY "row_number" would calculate the average for each row separately.</p>
    <p><code>SELECT name, dept_id, salary, AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg FROM employees;</code></p>
    <p>This shows: each employee, their department, their salary, and the average salary of their department — all on the same row!</p>
    <p><strong>ORDER BY inside OVER</strong> creates a <strong>running total</strong>:</p>
    <p><code>SUM(salary) OVER (ORDER BY id) AS running_total</code></p>
    <p>This adds up salaries row by row — like watching a cash register receipt print out, with each new item adding to the running total.</p>
    <p><strong>Window frames</strong> let you get even more specific. <code>ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING</code> means "look at the row before, this row, and the row after." Perfect for calculating moving averages!</p>
  `,

  // ─── Module 12: Date/Time Functions ───
  'm12-l1': `
    <p>SQLite has special functions for working with <strong>dates and times</strong> — like having a <strong>smart calendar and clock</strong> built into your database.</p>
    <p>SQLite stores dates as text, numbers, or real values. The most common format is <strong>ISO-8601</strong>: <code>2024-03-15 14:30:00</code> (Year-Month-Day Hour:Minute:Second).</p>
    <p>Key functions:</p>
    <ul>
      <li><strong>DATE('now')</strong> — "What's today's date?" (Without the time part.)</li>
      <li><strong>TIME('now')</strong> — "What's the current time?" (Without the date part.)</li>
      <li><strong>DATETIME('now')</strong> — "What's the current date AND time?"</li>
      <li><strong>STRFTIME('%Y', 'now')</strong> — "What's the current year?" (Format dates however you want.)</li>
    </ul>
    <p>You can also do <strong>date math</strong>:</p>
    <ul>
      <li><code>DATE('now', '+7 days')</code> — "What's the date one week from now?"</li>
      <li><code>DATE('now', '-1 month')</code> — "What was the date last month?"</li>
      <li><code>DATETIME('now', '+3 hours')</code> — "What time will it be 3 hours from now?"</li>
    </ul>
    <p>Think of it like having a <strong>calendar with a calculator</strong> — you can add, subtract, and format dates however you need!</p>
  `,
  'm12-l2': `
    <p>Let's explore <strong>practical date/time queries</strong> that you'd use in real applications.</p>
    <p><strong>Unix timestamps</strong> are the number of seconds since January 1, 1970. Computers love them because they're just big numbers. <code>STRFTIME('%s', 'now')</code> converts the current date to a Unix timestamp.</p>
    <p><strong>Real-world examples:</strong></p>
    <ul>
      <li><strong>Find orders placed in the last 7 days:</strong> <code>SELECT * FROM orders WHERE order_date >= DATE('now', '-7 days');</code></li>
      <li><strong>Find users who signed up this month:</strong> <code>SELECT * FROM users WHERE STRFTIME('%Y-%m', created_at) = STRFTIME('%Y-%m', 'now');</code></li>
      <li><strong>Calculate age from birthdate:</strong> <code>SELECT (STRFTIME('%Y', 'now') - STRFTIME('%Y', birthdate)) AS age FROM employees;</code></li>
      <li><strong>Format dates nicely:</strong> <code>SELECT STRFTIME('%B %d, %Y', '2024-03-15') AS formatted_date;</code> → "March 15, 2024"</li>
    </ul>
    <p><strong>Time zones:</strong> SQLite's date functions work in UTC by default. To handle time zones, you need to store the offset or use application-level conversion.</p>
    <p>When designing a database, it's best practice to store all dates in <strong>UTC</strong> and convert to local time when displaying. This avoids confusion when users are in different time zones!</p>
  `,

  // ─── Module 13: EXPLAIN QUERY PLAN & Performance ───
  'm13-l1': `
    <p><strong>EXPLAIN QUERY PLAN</strong> is like asking the database <strong>"How are you going to find this data?"</strong> before actually running the query. It shows you the route the database will take.</p>
    <p>Think of it like a <strong>GPS showing your route before you drive</strong>. You can see if the GPS is taking the highway (fast, using an index) or local streets (slow, scanning every row).</p>
    <p><code>EXPLAIN QUERY PLAN SELECT * FROM employees WHERE name = 'Alice';</code></p>
    <p>The output might say:</p>
    <ul>
      <li><strong>SCAN TABLE employees</strong> — "I'll read EVERY row to find 'Alice'." (🚩 Slow — like checking every house on every street!)</li>
      <li><strong>SEARCH TABLE employees USING INDEX idx_name</strong> — "I'll use the name index to jump directly to 'Alice'." (✅ Fast — like going directly to the right address!)</li>
    </ul>
    <p>Always check EXPLAIN QUERY PLAN on your slow queries. It's the first step in <strong>performance tuning</strong>!</p>
  `,
  'm13-l2': `
    <p>Here are <strong>practical performance tips</strong> for making your SQLite queries faster:</p>
    <ul>
      <li><strong>Use indexes wisely</strong> — Index columns you often search by (WHERE, JOIN, ORDER BY). But don't over-index — each index slows down writes!</li>
      <li><strong>LIMIT your results</strong> — If you only need 10 rows, use <code>LIMIT 10</code>. Like asking for just the first page of search results instead of all 10,000.</li>
      <li><strong>EXPLAIN QUERY PLAN before optimizing</strong> — Don't guess what's slow. Check the query plan first, then optimize the slow parts.</li>
      <li><strong>Use transactions for bulk operations</strong> — If you're inserting 1,000 rows, do it in ONE transaction instead of 1,000 separate ones. It's like filling a swimming pool with a bucket vs a hose!</li>
      <li><strong>Avoid SELECT * in production</strong> — Only select the columns you actually need. Less data transferred = faster queries.</li>
      <li><strong>Use covered indexes</strong> — An index that contains ALL the columns your query needs. The database can answer the query from the index alone, without touching the table at all!</li>
    </ul>
    <p><strong>PRAGMA statements</strong> are like <strong>settings for your database engine</strong>. Some useful ones:</p>
    <ul>
      <li><code>PRAGMA journal_mode=WAL;</code> — Write-Ahead Logging. Faster concurrent reads and writes.</li>
      <li><code>PRAGMA synchronous=NORMAL;</code> — Balance between safety and speed.</li>
      <li><code>PRAGMA cache_size=-8000;</code> — Use 8MB of cache for faster reads.</li>
    </ul>
    <p>Remember: <strong>measure before optimizing!</strong> What seems slow might actually be fast enough. Don't waste time optimizing queries that run in 2ms!</p>
  `,

  // ─── Module 14: FTS5 Full-Text Search ───
  'm14-l1': `
    <p><strong>FTS5</strong> (Full-Text Search version 5) is like having <strong>Google search inside your SQLite database</strong>.</p>
    <p>Regular <code>LIKE '%keyword%'</code> searches are slow and limited. They can't handle "find documents similar to this one" or "search for 'running' and also find 'ran' and 'run'."</p>
    <p>FTS5 creates a <strong>special search index</strong> that can:</p>
    <ul>
      <li>Find words instantly (much faster than LIKE)</li>
      <li>Handle <strong>stemming</strong> — searching for "run" also finds "running", "ran", "runs"</li>
      <li>Rank results by relevance (the best matches appear first)</li>
      <li>Handle partial word matches</li>
    </ul>
    <p>Think of it like this: <code>LIKE '%cat%'</code> is like looking at every book on every shelf to find ones with "cat" in the title. FTS5 is like having a card catalog that instantly tells you which books contain the word "cat" and which ones are most relevant!</p>
    <p>To use FTS5, create a virtual table: <code>CREATE VIRTUAL TABLE documents USING fts5(title, body);</code></p>
  `,
  'm14-l2': `
    <p>Let's learn how to <strong>search with FTS5</strong> and see some practical examples.</p>
    <p>Basic search: <code>SELECT * FROM documents WHERE documents MATCH 'sqlite';</code></p>
    <p>This finds all documents containing the word "sqlite". Simple!</p>
    <p><strong>Advanced search operators:</strong></p>
    <ul>
      <li><strong>Phrase search:</strong> <code>MATCH '"full text search"'</code> — Find the EXACT phrase "full text search".</li>
      <li><strong>Prefix search:</strong> <code>MATCH 'sql*'</code> — Find words starting with "sql" (sqlite, sql, sqlquery).</li>
      <li><strong>Boolean operators:</strong> <code>MATCH 'sqlite AND database'</code>, <code>MATCH 'sqlite OR mysql'</code>, <code>MATCH 'sqlite NOT postgresql'</code>.</li>
      <li><strong>Column search:</strong> <code>MATCH 'title: sqlite'</code> — Only search in the title column.</li>
      <li><strong>Near search:</strong> <code>MATCH 'sqlite NEAR/3 database'</code> — Find "sqlite" within 3 words of "database".</li>
    </ul>
    <p>FTS5 also automatically ranks results using <strong>bm25 algorithm</strong>. The <code>rank</code> column in the result tells you how relevant each match is — lower is better!</p>
    <p><code>SELECT *, rank FROM documents WHERE documents MATCH 'sqlite' ORDER BY rank;</code></p>
    <p>This returns the most relevant documents first — just like Google!</p>
    <div class=\"bg-yellow-50 border-l-4 border-yellow-500 p-3 my-4 rounded-r-lg text-sm\">
      <p class=\"text-yellow-800\"><strong>📌 Note:</strong> FTS5 needs to be enabled when compiling SQLite. It's included in most builds, but not all. Check with <code>SELECT sqlite_compileoption_get(0);</code></p>
    </div>
  `,

  // ─── Module 15: SQLite with Drivers ───
  'm15-l1': `
    <p>You can use SQLite from <strong>Python or Node.js</strong> to build real applications. Think of it as <strong>adding a database engine to your code</strong>.</p>
    <p><strong>Python with SQLite:</strong></p>
    <p>Python comes with SQLite built-in! You don't need to install anything extra:</p>
    <p><code>import sqlite3<br>conn = sqlite3.connect('myapp.db')<br>cursor = conn.cursor()<br>cursor.execute('SELECT * FROM users')<br>rows = cursor.fetchall()</code></p>
    <p><strong>Node.js with SQLite (better-sqlite3):</strong></p>
    <p><code>const Database = require('better-sqlite3');<br>const db = new Database('myapp.db');<br>const rows = db.prepare('SELECT * FROM users').all();</code></p>
    <p>The concept is the same in both languages: connect to a database file, run SQL queries, get results back as data structures (lists, dictionaries, objects).</p>
    <p>Think of it like this: your Python/Node.js code is the <strong>chef following a recipe</strong>, and SQLite is the <strong>pantry assistant</strong> who brings you ingredients and stores away leftovers!</p>
  `,
  'm15-l2': `
    <p>Let's explore <strong>best practices</strong> for using SQLite with drivers in real applications.</p>
    <p><strong>Parameterized queries</strong> — NEVER build SQL by concatenating strings!</p>
    <p>❌ Bad: <code>cursor.execute(f\"SELECT * FROM users WHERE name = '{user_input}'\");</code> — This is vulnerable to SQL injection!</p>
    <p>✅ Good (Python): <code>cursor.execute('SELECT * FROM users WHERE name = ?', (user_input,));</code></p>
    <p>✅ Good (Node.js): <code>db.prepare('SELECT * FROM users WHERE name = ?').get(userInput);</code></p>
    <p>Parameterized queries are like using a <strong>sealed envelope</strong> — the user's input is safely contained and can't escape to cause trouble!</p>
    <p><strong>Error handling:</strong> Always wrap database operations in try/catch blocks:</p>
    <p>Python: <code>try: cursor.execute(...); conn.commit()<br>except Exception as e: conn.rollback(); print(f\"Error: {e}\");</code></p>
    <p><strong>Connection management:</strong> Always close connections when done:</p>
    <ul>
      <li>Python: Use <code>with sqlite3.connect('db.sqlite') as conn:</code> (auto-closes)</li>
      <li>Node.js: Call <code>db.close()</code> when the app shuts down</li>
    </ul>
    <p><strong>Real-world use cases for SQLite:</strong></p>
    <ul>
      <li><strong>Mobile apps</strong> — Every Android and iOS app can use SQLite for local storage.</li>
      <li><strong>IoT devices</strong> — Sensors and embedded devices use SQLite to log data locally.</li>
      <li><strong>Desktop apps</strong> — Applications like Firefox, Chrome, and Skype use SQLite internally.</li>
      <li><strong>Development/testing</strong> — Use SQLite as a lightweight stand-in for PostgreSQL/MySQL during development.</li>
    </ul>
    <p>SQLite is the <strong>most widely deployed database engine in the world</strong> — it's literally everywhere, from your smartphone to your web browser!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5SqliteData = eli5SqliteData;
