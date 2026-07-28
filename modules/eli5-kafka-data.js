/**
 * ELI5 (Explain Like I'm 5) content for Kafka Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

(function () {
  'use strict';

  var eli5KafkaData = {

    // ═══════════════════════════════════════════════
    // Module 1: Introduction to Kafka
    // ═══════════════════════════════════════════════

    'm1-l1': `
      <p><strong>Apache Kafka</strong> is like a <strong>giant, super-fast post office</strong> for computer programs.</p>
      <p>Imagine you run a big company with many departments. The Sales team needs to tell the Warehouse team: "We sold 100 widgets!" The Warehouse needs to tell Shipping: "Ship those widgets!" And Shipping needs to tell Accounting: "We spent $50 on shipping!"</p>
      <p>Without a post office, every department would have to call every other department directly. Sales would call Warehouse, Warehouse would call Shipping, Shipping would call Accounting. If a new department (like Customer Support) needs to know about sales too, Sales has to call them as well. It's a <strong>messy phone tree</strong>!</p>
      <p>Kafka is the <strong>central post office</strong>. Instead of calling everyone directly, Sales just drops a letter (called an <strong>event</strong>) in the mailbox (a <strong>topic</strong>). Any department that cares about sales just checks that mailbox whenever they want. New department? They just start checking the same mailbox — no need to reconfigure anything!</p>
      <p><strong>Event streaming</strong> is the idea that things are happening continuously — orders being placed, sensors reporting temperatures, users clicking buttons — and you want to capture and react to those events as they happen, in real time, not by running a report at the end of the day.</p>
      <p>Companies like <strong>Netflix</strong> use Kafka to process over <strong>700 billion events per day</strong>! That's like processing every grain of sand on 100 beaches — every single day!</p>
    `,

    'm1-l2': `
      <p>Let's unpack Kafka's main pieces, like looking inside a <strong>toy car</strong> to see how the gears work.</p>
      <p><strong>Producer</strong> — This is like <strong>you writing a letter</strong> and putting it in the mailbox. You're the "producer" of the message. Any application that sends data to Kafka is a producer.</p>
      <p><strong>Broker</strong> — This is the <strong>post office building itself</strong>. It's a server that stores all the letters (events) and delivers them when someone asks. A Kafka cluster is just a group of these post offices working together. More post offices = more letters you can handle.</p>
      <p><strong>Topic</strong> — This is a specific <strong>mailbox slot</strong> in the post office. You might have one slot for "Orders," another for "Shipping Updates," and another for "Customer Complaints." They're all in the same post office, but letters don't get mixed up because each slot is labeled.</p>
      <p><strong>Partition</strong> — This is like if each mailbox slot was actually <strong>a stack of multiple smaller boxes</strong>. If "Orders" is a super popular topic, Kafka splits it into, say, 3 partitions. Each partition can be handled by a different post office worker, so letters get sorted way faster!</p>
      <p><strong>Consumer</strong> — This is your <strong>neighbor who checks their mailbox</strong> every morning. Any application that reads data from Kafka is a consumer. Thousands of consumers can read from the same topic simultaneously — it's like having a mailbox that automatically photocopies each letter for everyone who wants a copy!</p>
      <p><strong>ZooKeeper / KRaft</strong> — This is the <strong>post office manager</strong> who keeps track of which post offices are open, which mailboxes exist, and which workers are doing what. Older Kafka used ZooKeeper (a separate app) for this; newer Kafka uses KRaft (the managers are built right into the post offices themselves).</p>
    `,

    'm1-l3': `
      <p>When would you use Kafka? Think about these <strong>real-world situations</strong>:</p>
      <p><strong>Logging and Monitoring</strong> — Imagine every single computer in a company writes a diary entry every time something happens. That's millions of diary entries per day! Kafka collects all of them in one place so the IT team can search for problems. Instead of checking 1,000 computers one by one, they just ask Kafka.</p>
      <p><strong>Activity Tracking</strong> — When you use a website like Netflix or Amazon, every click you make is tracked. "User clicked on movie X," "User added item to cart." Kafka processes millions of these clicks per second to figure out what you might like to watch or buy next.</p>
      <p><strong>Data Pipelines</strong> — A company's data might be scattered across 50 different databases. Kafka acts like a <strong>central river</strong> that carries all the data from all those databases to a central lake (a data warehouse) where analysts can study it. No need to connect every database to every other database!</p>
      <p><strong>When NOT to use Kafka?</strong> Don't use Kafka if you have just two applications that need to talk to each other — a simple API call is much easier! Don't use Kafka if you need to store relational data with complex queries (use a regular database). And don't use Kafka for very small projects where the overhead isn't worth it.</p>
    `,

    // ═══════════════════════════════════════════════
    // Module 2: Topics & Partitions
    // ═══════════════════════════════════════════════

    'm2-l1': `
      <p>A <strong>topic</strong> in Kafka is like a <strong>label on a filing cabinet drawer</strong>. You open the "Invoices" drawer, and every document inside is an invoice. You open the "Shipping Labels" drawer, and every document is a shipping label.</p>
      <p>Topics are how Kafka organizes data. Each topic has a <strong>name</strong> (like "orders" or "page_views" or "sensor_readings") and a <strong>retention policy</strong> (how long to keep the data). Some topics keep data for 7 days, others for 30 days, and some keep data forever.</p>
      <p>Events in a topic are <strong>immutable</strong> — once written, they can never be changed or deleted (until the retention period expires). Think of it like a <strong>time capsule</strong>: you put something in, seal it, and it stays exactly as-is until the opening date.</p>
      <p>Multiple applications can write to the same topic, and multiple applications can read from the same topic, all at the same time. It's like a group chat where everyone can post messages and everyone can read them!</p>
    `,

    'm2-l2': `
      <p><strong>Partitions</strong> are how Kafka makes topics <strong>fast and scalable</strong>. Imagine you have a single checkout line at a grocery store — it's slow! Now imagine the store opens 10 checkout lines — customers flow through much faster.</p>
      <p>Each topic is split into one or more partitions. If a topic has 3 partitions, data written to that topic can be handled by 3 different servers at the same time. This is called <strong>parallelism</strong> — doing multiple things at once to go faster.</p>
      <p>When you write an event to a topic, Kafka decides which partition it goes to. If the event has a <strong>key</strong> (like "user_123"), Kafka runs that key through a hashing machine and always puts the same key in the same partition. This guarantees that all events for user_123 are in order!</p>
      <p>If the event has <strong>no key</strong>, Kafka uses a round-robin strategy — first event goes to partition 0, second to partition 1, third to partition 2, fourth back to partition 0, and so on. This spreads the data evenly across all partitions.</p>
      <p><strong>Choosing the number of partitions</strong> is like choosing how many checkout lanes to open. More partitions = more throughput. But too many can cause overhead. A good rule of thumb: start with 3-6 partitions per topic, and monitor whether you need more.</p>
    `,

    'm2-l3': `
      <p><strong>Replication</strong> is Kafka's way of <strong>not losing your data</strong>. Remember our post office analogy? If there's only ONE copy of every letter and the post office burns down, all letters are gone forever!</p>
      <p>So Kafka makes <strong>photocopies</strong> of every event and stores them on multiple servers (brokers). The <strong>Replication Factor</strong> (RF) tells Kafka how many copies to keep. RF = 3 means three copies of every event live on three different servers.</p>
      <p>Each partition has one <strong>leader</strong> and zero or more <strong>followers</strong> (also called In-Sync Replicas or ISR). The leader handles all reads and writes for that partition. Followers just copy data from the leader, staying "in-sync."</p>
      <p>If the leader server crashes, the followers <strong>elect a new leader</strong> automatically. It's like if the captain of a sports team gets injured — the team immediately picks a new captain and keeps playing. Your application doesn't even notice there was a problem!</p>
      <p>The ISR list is the set of followers that are fully caught up with the leader. If a follower is too slow (maybe its server is overloaded), it drops out of the ISR list. The leader won't wait for it. This prevents one slow server from slowing down the entire system!</p>
    `,

    // ═══════════════════════════════════════════════
    // Module 3: Producers & Consumers
    // ═══════════════════════════════════════════════

    'm3-l1': `
      <p>A <strong>producer</strong> is simply <strong>any application that writes data to Kafka</strong>. Think of it as your Instagram app — you take a photo (create data) and upload it (send to Kafka).</p>
      <p>The producer decides <strong>which topic</strong> to write to and <strong>which partition</strong> the data goes to. It can also add a <strong>key</strong> to each event, which determines partitioning. Remember: same key = same partition = events stay in order.</p>
      <p>Producers can choose an <strong>acknowledgment level</strong> (acks):</p>
      <ul>
        <li><strong>acks=0</strong> — The producer fires and forgets. Like tossing a letter in the general direction of the mailbox without checking if it landed inside. Fastest, but you might lose data.</li>
        <li><strong>acks=1</strong> — The producer waits for the leader broker to say "Got it!" Like putting the letter in the mailbox and waiting to hear it thunk inside. Good balance of speed and safety.</li>
        <li><strong>acks=all</strong> — The producer waits for the leader AND all in-sync replicas to confirm. Like hand-delivering the letter and waiting for the recipient to read it and say "I got it!" Slowest, but safest.</li>
      </ul>
    `,

    'm3-l2': `
      <p>A <strong>consumer</strong> is <strong>any application that reads data from Kafka</strong>. Think of it as your Instagram feed — it reads the photos that other people posted.</p>
      <p>Consumers read events from topics in <strong>order within each partition</strong>. They don't read from all partitions in order — that would be like trying to watch 10 movies at once by watching one minute of each movie in sequence! Instead, they read partition 0 from start to finish, then partition 1 from start to finish (or, more commonly, a consumer group splits the partitions among members).</p>
      <p>Each consumer keeps track of its position called an <strong>offset</strong>. It's like a bookmark: "I've read up to position 42 in partition 0." If the consumer crashes and restarts, it reads the bookmark and continues from where it left off.</p>
      <p>Consumers can choose when to commit offsets:</p>
      <ul>
        <li><strong>At-least-once</strong> (default) — Commit offset AFTER processing the event. If the consumer crashes before committing, it re-processes the event. Safe but might cause duplicates.</li>
        <li><strong>At-most-once</strong> — Commit offset BEFORE processing the event. If the consumer crashes, it never processes the event again. Might lose data but no duplicates.</li>
        <li><strong>Exactly-once</strong> — Uses transactions to commit offset and processing results together. Most complex but guarantees no duplicates and no data loss.</li>
      </ul>
    `,

    'm3-l3': `
      <p><strong>Serialization</strong> is how Kafka turns your data into <strong>bytes</strong> (zeros and ones) to send over the network, and <strong>deserialization</strong> is how it turns bytes back into usable data on the other end.</p>
      <p>Think of it like <strong>packing a suitcase for a trip</strong>. You fold your clothes (serialize them) to fit in the suitcase (the network). When you arrive, you unpack (deserialize) and wear them again.</p>
      <p>Kafka <strong>doesn't care</strong> what format your data is in — it just stores bytes. It's up to the producer and consumer to agree on the format. Common formats include:</p>
      <ul>
        <li><strong>String/JSON</strong> — Easy for humans to read. Like packing clothes loosely in the suitcase — takes more space but you can see everything.</li>
        <li><strong>Avro</strong> — Compact binary format with a schema. Like using vacuum-sealed bags — takes less space but you need the schema to unpack.</li>
        <li><strong>Protobuf</strong> — Another compact format from Google. Like using a specific packing cube system.</li>
        <li><strong>Plain bytes</strong> — Raw data. Like just throwing everything in without any organization at all.</li>
      </ul>
      <p>In practice, most production systems use <strong>Avro with Schema Registry</strong> (we'll learn about that later!). Schema Registry is like a shared packing manual that both the packer and unpacker agree on, so they never get confused about what's in the suitcase.</p>
    `,

    // ═══════════════════════════════════════════════
    // Module 4: Consumer Groups & Rebalancing
    // ═══════════════════════════════════════════════

    'm4-l1': `
      <p>A <strong>consumer group</strong> is a <strong>team of consumers</strong> working together to read from a topic. Think of it as a group of friends splitting a pizza: each person gets a fair share (some slices/partitions), and no two people eat the same slice.</p>
      <p>Each consumer in a group is assigned one or more partitions to read from. If you have a topic with 6 partitions and a consumer group with 3 consumers, each consumer gets 2 partitions. The work is split evenly!</p>
      <p>Consumer groups have a <strong>group.id</strong> — a name that identifies the team. All consumers with the same group.id are on the same team.</p>
      <p><strong>Offsets</strong> are stored in a special internal Kafka topic called <code>__consumer_offsets</code>. It records each consumer group's position in each partition. When a consumer restarts, it reads its last committed offset and continues from there — like a bookmark in a book.</p>
      <p>If a consumer in the group crashes, its partitions are <strong>reassigned</strong> to the remaining consumers. The surviving consumers now have more work (more partitions each), but the system keeps running!</p>
    `,

    'm4-l2': `
      <p><strong>Rebalancing</strong> is what happens when a consumer joins or leaves a group. It's like when a new person joins your pizza party — everyone needs to <strong>re-split the pizza</strong> so the new person gets some slices too.</p>
      <p><strong>Eager Rebalancing (the old way):</strong></p>
      <p>Imagine everyone at the pizza party puts down their pizza slices, all the slices get mixed up, and then everyone takes new slices. This is the "stop-the-world" approach. All consumers stop processing, the group coordinator reassigns partitions, and then everyone starts again.</p>
      <p>Problem: during a rebalance, <strong>nobody is processing data</strong>. For a few seconds or even minutes (with large groups), the system is paused. If you have a high-traffic system, those seconds matter!</p>
      <p><strong>Cooperative Rebalancing (the new way):</strong></p>
      <p>Now imagine that instead of everyone putting down their pizza, only the person leaving puts down their slices, and the remaining people just pick up those extra slices. Nobody stops eating!</p>
      <p>This is the cooperative (incremental) approach. Only the partitions that need to move are revoked. The rest keep processing. It may take a few rounds of rebalancing to reach a steady state, but there's <strong>no global pause</strong>. Much better for high-throughput systems!</p>
      <p>Kafka 3.1+ uses cooperative rebalancing by default. You can also use <strong>Static Group Membership</strong> — if a consumer disconnects briefly, the group holds its partitions for up to <code>session.timeout.ms</code> to avoid unnecessary rebalances.</p>
    `,

    // ═══════════════════════════════════════════════
    // Module 5: Kafka Connect
    // ═══════════════════════════════════════════════

    'm5-l1': `
      <p><strong>Kafka Connect</strong> is like a <strong>universal power adapter</strong> for data. You visit a foreign country with your phone. The wall sockets are different, so you need an adapter to plug in. Kafka Connect is the adapter between external systems and Kafka.</p>
      <p>Instead of writing custom code to read data from a database and write it to Kafka (and then more custom code to read from Kafka and write to another database), Kafka Connect provides <strong>ready-made connectors</strong>. You just configure them!</p>
      <p>Kafka Connect runs as a <strong>cluster of worker processes</strong>, separate from your Kafka brokers. These workers execute connectors. If one worker fails, another picks up its connectors — like a substitute teacher taking over a class when the regular teacher is sick.</p>
      <p>Connectors use <strong>tasks</strong> for parallelism. If you have a source connector reading from a database with 10 tables, you can set <code>tasks.max = 10</code> and each table gets its own reader thread. More tasks = faster data transfer!</p>
    `,

    'm5-l2': `
      <p>There are two types of connectors in Kafka Connect, like two directions of a <strong>one-way street</strong>:</p>
      <p><strong>Source Connectors</strong> — These <strong>bring data INTO Kafka</strong> from external systems. They're like importers that bring goods from overseas into your warehouse (Kafka).</p>
      <p>Examples:</p>
      <ul>
        <li><strong>JDBC Source Connector</strong> — Reads from any SQL database and streams changes to Kafka. It's like having a tiny spy in the database that whispers every new row to Kafka.</li>
        <li><strong>Debezium (CDC)</strong> — Reads the database's transaction log (CDC = Change Data Capture). It sees EVERY change — inserts, updates, deletes — even if the application layer doesn't report them. Like having CCTV footage of every change in the database!</li>
        <li><strong>File Source</strong> — Reads lines from a log file and sends them to Kafka. Like having a friend who reads your diary out loud (awkward, but useful for log analysis!).</li>
      </ul>
      <p><strong>Sink Connectors</strong> — These <strong>take data OUT of Kafka</strong> and send it to external systems. They're like exporters that ship your products to customers.</p>
      <p>Examples:</p>
      <ul>
        <li><strong>S3 Sink Connector</strong> — Writes Kafka data to Amazon S3 storage. Every hour, it takes all events from the last hour and saves them as a file in S3.</li>
        <li><strong>Elasticsearch Sink</strong> — Pushes data into Elasticsearch for searching and analytics. When an event hits Kafka, it appears in search results milliseconds later.</li>
        <li><strong>Redis Sink</strong> — Writes data to Redis for caching. Perfect for real-time dashboards!</li>
      </ul>
      <p>There are <strong>hundreds of connectors</strong> available for different systems. The Kafka Connect ecosystem is one of Kafka's superpowers!</p>
    `,

    // ═══════════════════════════════════════════════
    // Module 6: Schema Registry & Avro
    // ═══════════════════════════════════════════════

    'm6-l1': `
      <p><strong>Schema Registry</strong> is like a <strong>library card catalog</strong>. When you go to a library, you don't randomly grab books — you check the card catalog to find out what books exist, where they're located, and what they're about.</p>
      <p>In Kafka, producers and consumers need to agree on the <strong>structure of the data</strong> (the schema). If a producer sends {"name": "Alice", "age": 30} but the consumer expects {"fullName": "Alice", "yearsOld": 30}, you get errors!</p>
      <p>Schema Registry is a central place where producers <strong>register their schemas</strong> and consumers can <strong>look them up</strong>. Every event in Kafka includes a <strong>schema ID</strong>, a small integer that tells consumers which schema to use. The actual schema is stored in the Registry.</p>
      <p>The magic feature: <strong>Schema Evolution</strong>. As your application changes, your data schema will too. Schema Registry lets you evolve schemas with rules that prevent breaking changes:</p>
      <ul>
        <li><strong>Backward compatible</strong> — New schema can read data written with old schema. You can add optional fields.</li>
        <li><strong>Forward compatible</strong> — Old schema can read data written with new schema. You can delete fields.</li>
        <li><strong>Full compatible</strong> — Both directions work.</li>
        <li><strong>No compatibility</strong> — Anything goes (dangerous!).</li>
      </ul>
    `,

    'm6-l2': `
      <p><strong>Avro</strong> is a <strong>data serialization format</strong> — it's how you pack your data into bytes for Kafka. But unlike plain JSON or strings, Avro has a <strong>schema</strong> that describes the structure of the data.</p>
      <p>Think of Avro as a <strong>custom-shaped suitcase with labeled compartments</strong>. One compartment is labeled "name" and fits strings. Another is "age" and fits integers. The suitcase is compact (binary format) but you need the blueprint (schema) to pack and unpack it correctly.</p>
      <p>Avro schemas are written in <strong>JSON</strong>. Here's what a simple one looks like:</p>
      <pre>{
  "type": "record",
  "name": "User",
  "fields": [
    {"name": "name", "type": "string"},
    {"name": "age",  "type": "int"}
  ]
}</pre>
      <p>When used with Schema Registry, Avro events are <strong>very small</strong> (much smaller than JSON) because the schema isn't included in every event — just a 4-byte schema ID. The consumer looks up the schema from the Registry using that ID.</p>
      <p><strong>Compatibility in practice:</strong> Let's say you're adding a <code>phoneNumber</code> field to your User schema. If you set compatibility to BACKWARD, the new schema must be able to read old data. So <code>phoneNumber</code> must have a default value (like null or empty string). This way, old events (without phone numbers) can still be read by the new schema!</p>
    `,

    // ═══════════════════════════════════════════════
    // Module 7: Kafka Streams & KSQL
    // ═══════════════════════════════════════════════

    'm7-l1': `
      <p><strong>Kafka Streams</strong> is a Java library that lets you <strong>process data flowing through Kafka</strong> in real time. Think of it as a <strong>factory assembly line</strong> inside your Kafka system.</p>
      <p>Events come in on one conveyor belt (input topic). Workers along the belt process each event — filter, transform, enrich, aggregate — and then put the result on another conveyor belt (output topic). All of this happens in real-time, as events arrive.</p>
      <p>Why use Kafka Streams instead of a separate stream processing framework?</p>
      <ol>
        <li><strong>No separate cluster needed</strong> — It runs inside your application. Nothing extra to install or manage!</li>
        <li><strong>Exactly-once semantics</strong> — Built-in. Guarantees every event is processed exactly once.</li>
        <li><strong>Stateful processing</strong> — Kafka Streams can maintain local state (like a running count, or a windowed aggregation) in embedded rocksDB databases.</li>
        <li><strong>Fault-tolerant</strong> — If your application crashes, it restarts from the last committed offset and rebuilds its state from changelog topics. Nothing is lost!</li>
      </ol>
      <p>Real-world examples: calculating average order value in real-time, detecting fraudulent transactions within milliseconds of them happening, or enriching clickstream data with user profiles as events flow by.</p>
    `,

    'm7-l2': `
      <p>Kafka Streams gives you two ways to build stream processing applications — like two different tools in a toolbox:</p>
      <p><strong>Streams DSL (Domain Specific Language)</strong> — This is the <strong>easy button</strong>. You chain together high-level operations using Java methods. It's like building with LEGOs — each piece snaps together cleanly:</p>
      <pre>KStream&lt;String, Order&gt; orders = builder.stream("orders");
orders
  .filter((key, order) -> order.amount() > 100)
  .mapValues(order -> order.toUpperCase())
  .to("large-orders");</pre>
      <p>Available operations include <code>filter</code> (keep only matching events), <code>map</code> (transform events), <code>groupBy</code> (group events by key), <code>aggregate</code> (running counts/sums), and <code>join</code> (combine two streams).</p>
      <p><strong>Processor API</strong> — This is the <strong>power tool</strong>. You get full control over every aspect of processing by implementing a <code>Processor</code> interface. It's like building furniture from raw wood instead of using pre-cut pieces.</p>
      <p>You define processors that receive events one at a time, maintain state via KeyValueStores, and forward results downstream. Use the Processor API when the DSL doesn't give you enough control — for example, when you need custom scheduling, complex state management, or unusual event routing.</p>
      <p>Most applications start with DSL and only drop to the Processor API for specific operations that need fine-grained control. Start simple!</p>
    `,

    'm7-l3': `
      <p><strong>KSQL</strong> (now called ksqlDB) is like <strong>SQL for streaming data</strong>. If you know SQL (and you probably do!), you can start processing Kafka streams immediately without learning Java.</p>
      <p>Think of it like this:</p>
      <ul>
        <li>Kafka Streams = Building a custom Lego castle (powerful but takes time)</li>
        <li>KSQL = Using pre-made castle pieces that snap together instantly (fast and easy)</li>
      </ul>
      <p>Simple KSQL examples:</p>
      <pre>-- Create a stream from a Kafka topic
CREATE STREAM orders (order_id INT, amount INT)
  WITH (KAFKA_TOPIC='orders', VALUE_FORMAT='JSON');

-- Filter and create a new stream
CREATE STREAM large_orders AS
  SELECT * FROM orders WHERE amount > 100;

-- Aggregate over time (tumbling window)
SELECT order_id, COUNT(*) AS count
  FROM orders
  WINDOW TUMBLING (SIZE 1 HOUR)
  GROUP BY order_id
  EMIT CHANGES;</pre>
      <p>KSQL is great for simple filtering, transformation, and aggregation. But for complex stateful logic (like joining multiple streams with custom time windows), Kafka Streams DSL or Processor API gives you more power.</p>
      <p>Rule of thumb: try KSQL first. If it can't do what you need, move to Kafka Streams DSL. If that's still not enough, use the Processor API. Always start with the simplest tool!</p>
    `,

    // ═══════════════════════════════════════════════
    // Module 8: Exactly-Once Semantics
    // ═══════════════════════════════════════════════

    'm8-l1': `
      <p><strong>Delivery semantics</strong> answer one question: <strong>how hard does Kafka try to deliver your message?</strong> Think of it like three different mail carriers:</p>
      <p><strong>At-most-once (Fire and Forget)</strong> — The mail carrier tries to deliver your letter once. If nobody's home, they just leave. They don't try again. Your letter might get lost, but it won't be delivered twice.</p>
      <p>In Kafka: The producer sends the message and doesn't wait for confirmation. If the broker crashes, the message is lost. Fast, but data can disappear.</p>
      <p><strong>At-least-once (Keep Trying)</strong> — The mail carrier keeps trying until someone signs for the letter. But if the recipient signs and the carrier's system crashes before recording it, the carrier might deliver the letter AGAIN tomorrow. You might get duplicates, but nothing is lost.</p>
      <p>In Kafka: The producer waits for acknowledgment (acks=1 or acks=all). If the ack is lost (network issue), the producer retries. The message might be written twice, but it's never lost. This is the <strong>default and most common</strong> setting.</p>
      <p><strong>Exactly-once (Perfect Delivery)</strong> — The mail carrier delivers the letter exactly once. No duplicates, no losses. This requires a delivery receipt system where carrier and recipient coordinate perfectly.</p>
      <p>In Kafka: Requires <strong>idempotent producers + transactions</strong> (see next lesson!). Used for financial systems where even one duplicate transaction is unacceptable.</p>
    `,

    'm8-l2': `
      <p><strong>Idempotent producers</strong> are like <strong>stamped letters with tracking numbers</strong>. Each letter has a unique ID. If the post office tries to deliver the same letter twice, it checks the tracking number and says "Already delivered this one!" and ignores the duplicate.</p>
      <p>When a producer has <code>enable.idempotence=true</code>, each message gets a unique <strong>producer ID (PID)</strong> and <strong>sequence number</strong>. The broker tracks the highest sequence number it has seen for each PID. If it receives a message with a sequence number it has already processed, it <strong>silently ignores the duplicate</strong>.</p>
      <p>This prevents duplicates caused by producer retries — the most common source of duplicate messages in Kafka.</p>
      <p><strong>Kafka Transactions</strong> go one step further. They let you write to <strong>multiple topics atomically</strong> — either ALL partitions get the messages, or NONE do. It's like a bank transfer: money leaves Account A and arrives in Account B, or the whole thing rolls back. You never see the money in limbo.</p>
      <p>Transactions are great for:</p>
      <ul>
        <li><strong>Exactly-once processing in Kafka Streams</strong> — Read-process-write exactly once.</li>
        <li><strong>Atomic writes to multiple topics</strong> — All or nothing.</li>
        <li><strong>Exactly-once delivery from Kafka to Kafka</strong> — No duplicates, no data loss.</li>
      </ul>
      <p>Note: exactly-once <strong>end-to-end</strong> (from source system to destination system) is extremely hard. Kafka guarantees exactly-once <strong>within Kafka</strong>, but the source and destination systems need their own idempotency mechanisms too!</p>
    `,

    // ═══════════════════════════════════════════════
    // Module 9: Dead Letter Queues & Error Handling
    // ═══════════════════════════════════════════════

    'm9-l1': `
      <p>In any real-world Kafka system, things <strong>will go wrong</strong>. Messages will be malformed, schemas will mismatch, networks will hiccup. How you handle these errors separates a robust system from a fragile one.</p>
      <p><strong>Common error types:</strong></p>
      <ul>
        <li><strong>Deserialization errors</strong> — A message is corrupt or doesn't match the expected schema. Like receiving a letter written in a language you don't understand.</li>
        <li><strong>Processing errors</strong> — The consumer code throws an exception while processing a valid message. Like a chef getting a valid recipe but burning the food anyway.</li>
        <li><strong>Connectivity errors</strong> — Temporary network blips. Like the phone line cutting out mid-conversation.</li>
        <li><strong>Transient errors</strong> — Errors that might succeed on retry (e.g., a downstream API is temporarily overloaded).</li>
        <li><strong>Fatal errors</strong> — Errors that will NEVER succeed, no matter how many times you retry. Malformed data, invalid schema — don't bother retrying!</li>
      </ul>
      <p><strong>Retry strategies:</strong></p>
      <ul>
        <li><strong>Immediate retry</strong> — Try again right away. Good for transient network blips.</li>
        <li><strong>Exponential backoff</strong> — Wait 1 second, then 2, then 4, then 8, up to a max. Like not calling a busy friend back immediately — you wait a bit longer each time.</li>
        <li><strong>Separate retry topic</strong> — Send the failed message to a retry topic with a delay. A separate consumer reads the retry topic and tries again later. This keeps the main pipeline flowing!</li>
      </ul>
    `,

    'm9-l2': `
      <p>A <strong>Dead Letter Queue (DLQ)</strong> is like a <strong>"return to sender" bin at the post office</strong>. When a letter can't be delivered after multiple attempts, instead of throwing it away, the post office puts it in a special bin labeled "Undeliverable." Someone can later check that bin and decide what to do with each letter.</p>
      <p>In Kafka, a DLQ is just <strong>another topic</strong> where failed messages are sent. The DLQ topic stores the original message <strong>plus metadata</strong> about why it failed — the error message, the stack trace, the original topic and partition, the timestamp, and how many times it was retried.</p>
      <p><strong>Why use a DLQ?</strong></p>
      <ul>
        <li><strong>Prevent message loss</strong> — Failed messages aren't thrown away. They're stored for later investigation.</li>
        <li><strong>Don't block the main pipeline</strong> — A single bad message doesn't stop processing of all other messages. It's moved aside (to the DLQ) and the rest keep flowing.</li>
        <li><strong>Audit trail</strong> — You can analyze DLQ patterns to find systemic issues. If 10,000 messages are failing with the same schema error, you know there's a bug in the producer!</li>
      </ul>
      <p><strong>DLQ best practices:</strong></p>
      <ul>
        <li>Always include the <strong>original message</strong>, the <strong>error reason</strong>, and the <strong>source topic/partition/offset</strong> in the DLQ message.</li>
        <li>Set a <strong>retention policy</strong> on DLQ topics (e.g., 30 days) so old failed messages don't accumulate forever.</li>
        <li>Set up <strong>monitoring and alerts</strong> on DLQ topics. A DLQ with messages means something is wrong!</li>
        <li>Build a <strong>replay tool</strong> that lets you fix failed messages and re-process them from the DLQ.</li>
      </ul>
    `,

    // ═══════════════════════════════════════════════
    // Module 10: Kafka Security (SSL/SASL)
    // ═══════════════════════════════════════════════

    'm10-l1': `
      <p><strong>SSL/TLS encryption</strong> is like <strong>putting your letters in a locked briefcase</strong> before sending them through the mail. Even if someone steals the briefcase, they can't read the letters without the key.</p>
      <p>Without encryption, anyone on the network can read your Kafka messages. That's fine for development, but in production — especially with sensitive data like customer PII or financial transactions — you MUST encrypt everything.</p>
      <p>How SSL/TLS works with Kafka:</p>
      <ol>
        <li><strong>Certificate Authority (CA)</strong> — A trusted third party that issues identity cards (certificates). Like a passport office that verifies who you are.</li>
        <li><strong>Broker certificates</strong> — Each Kafka broker gets a certificate signed by the CA. This proves "I am broker-1.production.example.com."</li>
        <li><strong>Client certificates</strong> — Producers and consumers can also have certificates to prove their identity (mutual TLS, or mTLS).</li>
        <li><strong>Encrypted connection</strong> — When a client connects to a broker, they establish an encrypted tunnel. From then on, all data flowing through that tunnel is scrambled — unreadable to anyone eavesdropping.</li>
      </ol>
      <p>In Kafka broker config, you set <code>ssl.keystore.location</code> (your identity) and <code>ssl.truststore.location</code> (who you trust). Then you configure listeners to use SSL: <code>listeners=SSL://0.0.0.0:9093</code>.</p>
    `,

    'm10-l2': `
      <p>If SSL encryption is about keeping messages <strong>secret</strong>, SASL authentication is about <strong>checking IDs</strong> — making sure only the right people can send and receive messages.</p>
      <p><strong>SASL (Simple Authentication and Security Layer)</strong> is like a <strong>bouncer at a club</strong> checking IDs at the door. Different types of SASL are like different ways to check IDs:</p>
      <ul>
        <li><strong>SASL/PLAIN</strong> — Username and password. Simple, but the bouncer just reads the ID — anyone could make a fake one. Use ONLY with SSL encryption (so the password is encrypted in transit).</li>
        <li><strong>SASL/SCRAM</strong> — Salted Challenge Response Authentication Mechanism. A more secure version of plain passwords. The password is never sent over the network — instead, the server sends a "challenge" and the client proves they know the password by solving it. Like a secret handshake that changes every time!</li>
        <li><strong>SASL/GSSAPI (Kerberos)</strong> — Enterprise-grade authentication, common in large companies. Uses a central ticket authority. Like having a VIP pass that a central office issues and verifies.</li>
        <li><strong>SASL/OAUTHBEARER</strong> — OAuth2 tokens. Used in cloud environments. Like using a digital boarding pass with a QR code that expires after a short time.</li>
      </ul>
      <p><strong>Authorization (ACLs)</strong> — After authentication (proving who you are) comes authorization (what you're allowed to do). Kafka uses Access Control Lists (ACLs) to control who can read, write, create, or delete topics.</p>
      <p>An ACL is like a restaurant job chart: "Chefs can use the stove. Waiters cannot. Waiters can use the POS system. Customers cannot enter the kitchen at all!"</p>
      <p>Example ACL: <code>User:alice has READ access to Topic:orders</code>. Alice can read orders but can't write to them or delete the topic.</p>
      <p>Start with <strong>SSL encryption</strong> (always!). Add <strong>SASL authentication</strong> if you need to identify clients (most production setups). Add <strong>ACLs</strong> when you need fine-grained access control (highly recommended for multi-team environments).</p>
    `
  };

  window.eli5KafkaData = eli5KafkaData;
})();
