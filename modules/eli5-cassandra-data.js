/**
 * ELI5 (Explain Like I'm 5) content for Cassandra Learning Hub lessons.
 * Each key is a module `id`. Value is plain-language HTML with real-world analogies.
 */
(function () {
  'use strict';

  var eli5CassandraData = {
    // ─── Module 1: Cassandra Basics & Architecture ───
    basics: `
      <p>Imagine you're running a <strong>huge lemonade stand</strong> on a hot summer day. If you only had one friend helping you, what happens when they get sick? Your stand closes! That's how regular databases work — they have a single point of failure (one boss). If that one server goes down, <em>everybody</em> goes home thirsty.</p>
      <p>Cassandra is different — it's like having <strong>100 friends</strong> all running their own lemonade stands, all selling the same lemonade. If one friend gets sick, no problem! You go to the next stand. Every stand knows exactly what every other stand is doing because they constantly chat with each other (that's the <strong>Gossip Protocol</strong> — like friends passing rumors around the neighborhood).</p>
      <p>Nobody is the boss. Everyone is equal — a <strong>peer-to-peer</strong> team. There is no single leader who can ruin everything if they quit. Every node in Cassandra can accept reads and writes just as well as any other node. This is called a <strong>masterless architecture</strong>.</p>
      <p>When you need more capacity, you just add another friend with a new stand. Cassandra grows linearly — twice the stands, twice the lemonade! You don't need to reconfigure everything or take the system offline. Just plug in a new server and it automatically joins the ring and starts sharing the workload.</p>
      <p>This design means Cassandra can handle <strong>petabytes of data</strong> and <strong>millions of writes per second</strong> across hundreds of servers — all while never having a single point of failure. That's why companies like Netflix, Apple, and Instagram use it for their biggest workloads!</p>
    `,

    // ─── Module 2: Partition Keys & Token Ring ───
    partitioning: `
      <p>Imagine you have <strong>a giant mailroom</strong> with 100 mail sorters standing around a circular table. Letters come pouring in by the millions, and you need to decide which sorter handles each letter. You could read every letter to decide, but that would take forever!</p>
      <p>Instead, you look at the envelope's <strong>zip code</strong> and run it through a special machine that prints a number between 0 and 360. That number tells you exactly where on the <strong>circular table</strong> (the Token Ring) the letter belongs. Mail sorter #1 handles numbers 0–36, sorter #2 handles 36–72, and so on around the circle.</p>
      <p>The <strong>Partition Key</strong> is like the zip code on the envelope. In Cassandra, the partition key is the first part of the primary key — like <code>user_id</code> in a users table. Cassandra takes that key and runs it through a <strong>hashing machine</strong> (Murmur3 is the default — think of it as a blender that always turns the same ingredient into the exact same smoothie). Out comes a token number between -2<sup>63</sup> and 2<sup>63</sup>-1.</p>
      <p>That token tells Cassandra exactly which <strong>node</strong> in the ring owns that piece of data. And here's the magic: <strong>the same key always produces the same token</strong>. So when you want to read that data later, Cassandra knows exactly which node to ask — no searching needed!</p>
      <p>Play with the <strong>Token Ring Visualizer</strong> below! Type in a partition key and click Simulate Write. Watch how the hash lands on a specific position on the ring — just like a dart landing on a dartboard — and then see how the data gets assigned to the nearest node clockwise!</p>
    `,

    // ─── Module 3: Replication & RF ───
    replication: `
      <p>Let's go back to our lemonade stands. Imagine your <strong>best lemonade recipe</strong> is written on a single piece of paper at Stand #3. What if Stand #3 catches fire? Your recipe is gone forever! That's what happens if you store data on only one node and it fails.</p>
      <p>To prevent this, Cassandra makes <strong>photocopies</strong> of your recipe and hands them out to other stands. The <strong>Replication Factor (RF)</strong> tells Cassandra how many total copies to keep. If <strong>RF = 3</strong>, that means there are <strong>3 copies</strong> of the same data living on 3 different nodes in the ring.</p>
      <p>Here's how it works: When data is written, the primary node (the one responsible for that partition key) immediately forwards copies to the next N-1 nodes clockwise around the ring. So if RF=3, the primary keeps one copy and sends copies to the next 2 nodes. If Stand #3 burns down, you just walk to Stand #4 or Stand #5 and grab a copy. Your data is safe!</p>
      <p><strong>Consistency Levels (CL)</strong> are like rules for how many friends must agree before you serve a customer. Think of it as a voting system:</p>
      <ul>
        <li><strong>CL.ONE</strong> — You ask one friend "is this recipe right?" and if they say yes, you serve. Fast as lightning, but that friend might be working from an old, outdated copy of the recipe. Great for speed, risky for accuracy.</li>
        <li><strong>CL.QUORUM</strong> — You ask <em>most</em> of your friends (more than half). If 2 out of 3 agree, you serve. This is the sweet spot — fast enough for most apps, and safe because a majority confirmed the data is correct.</li>
        <li><strong>CL.ALL</strong> — You ask <em>every</em> single friend who has a copy. If all 3 say the recipe is correct, you serve. Super safe, but here's the catch: if even one friend is napping (node down), you can't serve anyone! The request just waits — and waits — until that node wakes up.</li>
      </ul>
      <p>Choosing the right consistency level is all about <strong>trade-offs</strong>. Need speed at massive scale? Go CL.ONE. Need strong guarantees for financial transactions? Go CL.QUORUM. Most production systems use QUORUM for reads AND writes to get the best balance of safety and performance.</p>
    `,

    // ─── Module 4: Cassandra Query Language (CQL) ───
    cql: `
      <p>CQL is like <strong>friendly SQL with training wheels</strong>. If you've ever used SQL before, CQL will look very familiar — it has the same keywords: <code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code>, and even <code>CREATE TABLE</code>. The syntax is almost identical. That's intentional — Cassandra's creators wanted it to be easy for developers already familiar with relational databases.</p>
      <p>But here's the twist: Cassandra's data lives on <strong>100 different computers</strong> spread across a data center, not on a single server. So asking "JOIN these two tables together" would be like asking 100 friends to each run halfway across town to compare papers with each other, then run back with the answer. Way too slow! In Cassandra, JOINs simply do not exist.</p>
      <p>Because of this, CQL has some <strong>house rules</strong> that you need to keep in mind:</p>
      <ul>
        <li><code>WHERE</code> clauses only work on the <strong>Partition Key</strong> or columns that have a special index created on them. You can't just filter on any column like in SQL — Cassandra needs to know exactly which node to ask, and only the partition key tells it that.</li>
        <li>There are <strong>no JOINs</strong> and no <code>GROUP BY</code>. Since data is scattered across many servers, combining it would be too expensive. You must design your tables so that related data lives together in the same row from the start.</li>
        <li>You cannot use <code>ORDER BY</code> on any column you like — only on the <strong>clustering columns</strong> that you defined when you created the table. The sort order is baked into the table design.</li>
      </ul>
      <p>Despite these limits, CQL is incredibly <strong>fast</strong>. Cassandra can handle millions of writes per second because it doesn't need to check locks, maintain complex indexes, or coordinate JOINs across servers. It just writes to the partition — done!</p>
      <p>Try typing <code>SELECT * FROM users</code> in the terminal below! Then try <code>INSERT INTO users (id, username, country) VALUES (4, 'david', 'AU');</code> and read it back. It works just like SQL, but remember — under the hood, Cassandra is doing something much more clever, spreading that data across the ring and replicating it for safety!</p>
    `,

    // ─── Module 5: Data Modeling Basics ───
    modeling: `
      <p>Designing a database for Cassandra is like <strong>organizing a potluck dinner</strong>. In a regular database (SQL), you bring a bag of raw ingredients (individual data points) and then cook dishes on the spot (use JOINs to combine them). In Cassandra, you bring <strong>ready-to-eat dishes</strong> — everything your guests need is already on the plate, fully prepared and served.</p>
      <p><strong>Rule 1 — "Data that is read together must be stored together":</strong> If your app always shows a user's name, email, AND their 10 most recent orders on the same screen, put all that information in <strong>one table</strong> within <strong>one partition</strong>. Don't split them into separate tables like you would in SQL. Cassandra can read that entire partition in one quick trip to one node — no joins, no network hops, no waiting.</p>
      <p><strong>Rule 2 — "Denormalization is your friend":</strong> In SQL, you're taught "normalize your data! Never repeat anything!" In Cassandra, we throw that rule out the window. <strong>Repeat away!</strong> If you need to look up users by their country AND by their signup date, create two separate tables — <code>users_by_country</code> and <code>users_by_signup_date</code> — even if that means the same user data appears in both. Extra storage is cheap; slow queries lose you users.</p>
      <p><strong>Rule 3 — "One table per query pattern":</strong> For every question your app needs to ask the database, create a dedicated table designed to answer just that question. Need to find orders by customer ID? Make an <code>orders_by_customer</code> table. Need to find orders by status? Make an <code>orders_by_status</code> table. The same order data lives in both — and that's perfectly okay!</p>
      <p><strong>The Golden Rule — "Query-first design":</strong> Think about your queries FIRST, then design your tables. In Cassandra, you don't design tables and then figure out what queries you can run against them — it's the other way around! You start by writing down every query your app will make, and for each one, you design a table that serves it with a single, fast read. If that means duplicating data across multiple tables, so be it!</p>
    `,

    // ─── Module 6: Knowledge Check ───
    quiz: `
      <p>Let's review what we've learned with some <strong>super simple examples</strong> that tie everything together:</p>
      <p><strong>Q1: What happens if a node goes down in Cassandra?</strong></p>
      <p>Think of it like a <strong>choir with 10 singers</strong>. If one singer loses their voice, the choir keeps singing! The other 9 carry on without missing a beat. Similarly, if one Cassandra node dies or needs maintenance, the other nodes keep serving data without skipping a beat. Your app doesn't even notice something went wrong — it just gets its data from the next available replica.</p>
      <p>This is only possible because of <strong>replication</strong> — every piece of data has copies on multiple nodes. It's the difference between having one backup singer (single point of failure) and having the whole choir know every song by heart.</p>
      <p><strong>Q2: Why are there no JOINs in Cassandra?</strong></p>
      <p>Imagine asking each of your 100 friends to run to a different library across town, find one specific book, bring it back to you, AND coordinate with each other to combine their findings — <strong>all at the same time</strong>. That would be chaos! JOINs require data to live on the same server so it can be combined locally, but Cassandra deliberately spreads data across many servers to achieve massive scale.</p>
      <p>So instead of JOINing tables, you store everything you need together upfront — like packing a lunchbox with a sandwich, chips, and a drink all together instead of running to three different stores at lunchtime and trying to eat from all three at once.</p>
      <p><strong>You did great!</strong> These are the fundamentals that make Cassandra one of the world's most powerful distributed databases. You now understand masterless architecture, consistent hashing with the token ring, replication and consistency trade-offs, CQL's design philosophy, and query-driven data modeling. That's a solid foundation — go build something amazing!</p>
    `
  };

  window.eli5CassandraData = eli5CassandraData;
})();
