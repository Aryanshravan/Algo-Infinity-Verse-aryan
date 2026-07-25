/* ===========================================================
 *  Apache Kafka & EDA Learning Hub — Curriculum & App Logic
 * ===========================================================
 * 10 modules, 24 lessons total. Each lesson includes:
 *   - Learning objectives
 *   - In-depth content with code examples
 *   - Summary takeaways
 *   - Quiz questions (3-5 per lesson)
 * =========================================================== */

(function () {
  'use strict';

  /* ─── Curriculum Data ─── */

  var CURRICULUM_MODULES = [
    {
      module: 1,
      moduleTitle: 'Introduction to Kafka',
      icon: 'fa-info-circle',
      lessons: [
        {
          id: 'm1-l1',
          title: 'What is Kafka & Event Streaming?',
          objectives: [
            'Define event streaming and explain how it differs from batch processing',
            'Identify the core problems Kafka solves in distributed systems',
            'Describe the publish-subscribe messaging model',
          ],
          content: getLesson1(),
          takeaways: [
            'Kafka is a distributed event streaming platform for high-volume real-time data pipelines',
            'Events are immutable records of something that happened; event streaming captures them continuously',
            'Kafka decouples producers and consumers via a publish-subscribe model',
            'Netflix processes over 700 billion events per day using Kafka',
          ],
        },
        {
          id: 'm1-l2',
          title: 'Kafka Architecture & Core Components',
          objectives: [
            'Identify the key components: Producers, Brokers, Topics, Partitions, Consumers',
            'Explain how ZooKeeper / KRaft manages cluster coordination',
            'Describe how data flows from a producer through brokers to consumers',
          ],
          content: getLesson2(),
          takeaways: [
            'Producers write events; consumers read them; brokers store and serve them',
            'Topics categorize events; partitions enable parallelism within topics',
            'Older Kafka uses ZooKeeper for coordination; newer Kafka uses KRaft (built-in)',
            'Brokers, topics, and partitions work together to provide scalability and fault tolerance',
          ],
        },
        {
          id: 'm1-l3',
          title: 'Use Cases & When to Use Kafka',
          objectives: [
            'List common real-world Kafka use cases (logging, activity tracking, pipelines, CQRS)',
            'Identify scenarios where Kafka is the right choice vs. where it is overkill',
            'Evaluate Kafka trade-offs: throughput vs. latency, complexity vs. capability',
          ],
          content: getLesson3(),
          takeaways: [
            'Kafka excels at log aggregation, activity tracking, data pipelines, CQRS/event sourcing',
            'Use Kafka when you need decoupling, replayability, high throughput, or multi-subscriber fan-out',
            'Don\'t use Kafka for simple point-to-point communication or complex relational queries',
            'Kafka adds operational complexity; choose it when its capabilities justify the overhead',
          ],
        },
      ],
    },
    {
      module: 2,
      moduleTitle: 'Topics & Partitions',
      icon: 'fa-layer-group',
      lessons: [
        {
          id: 'm2-l1',
          title: 'Topics Deep Dive',
          objectives: [
            'Explain what a topic is and how it organizes event streams',
            'Understand retention policies, compaction, and log cleanup strategies',
            'Describe the immutability of events within a topic',
          ],
          content: getLesson4(),
          takeaways: [
            'Topics are named logical channels that categorize and store events',
            'Events within a topic are immutable — they cannot be changed once written',
            'Retention policies (time-based or size-based) control how long events are kept',
            'Log compaction keeps the latest value for each key, useful for state restoration',
          ],
        },
        {
          id: 'm2-l2',
          title: 'Partitions & Partitioning Strategies',
          objectives: [
            'Define partitions and explain their role in parallelism and scalability',
            'Describe key-based partitioning and round-robin distribution',
            'Explain how the number of partitions affects throughput and ordering',
          ],
          content: getLesson5(),
          takeaways: [
            'Partitions split a topic into ordered, append-only segments that enable parallel processing',
            'Key-based partitioning guarantees order for same-key events; round-robin balances load',
            'More partitions = more parallelism, but too many increases overhead and rebalance time',
            'A good starting point is 3-6 partitions per topic; monitor and scale as needed',
          ],
        },
        {
          id: 'm2-l3',
          title: 'Replication & In-Sync Replicas (ISR)',
          objectives: [
            'Explain how replication provides fault tolerance and durability',
            'Describe the role of partition leaders and follower replicas',
            'Understand ISR (In-Sync Replicas) and how Kafka handles broker failures',
          ],
          content: getLesson6(),
          takeaways: [
            'Replication factor (RF) = number of copies of each partition across different brokers',
            'Each partition has one leader (handles all reads/writes) and N-1 followers (replicate data)',
            'ISR = set of fully caught-up followers; slow followers are removed from ISR automatically',
            'Leader failure triggers automatic failover to an in-sync follower with no data loss',
          ],
        },
      ],
    },
    {
      module: 3,
      moduleTitle: 'Producers & Consumers',
      icon: 'fa-exchange-alt',
      lessons: [
        {
          id: 'm3-l1',
          title: 'Producers: Writing Events to Kafka',
          objectives: [
            'Configure and use Kafka producers to publish events to topics',
            'Understand acknowledgment levels (acks=0, acks=1, acks=all) and their trade-offs',
            'Implement custom partitioning, retries, and error handling in producers',
          ],
          content: getLesson7(),
          takeaways: [
            'Producers send events to topics; each event has an optional key and value payload',
            'acks=0 is fastest but can lose data; acks=1 is balanced; acks=all is safest',
            'Producers can specify a partition key or let round-robin distribute events',
            'Retries and idempotent producers help handle transient failures without duplicates',
          ],
        },
        {
          id: 'm3-l2',
          title: 'Consumers: Reading Events from Kafka',
          objectives: [
            'Configure consumers and subscribe to topics with consumer groups',
            'Explain offset management and auto-commit vs. manual commit strategies',
            'Implement consumer error handling and rebalance listeners',
          ],
          content: getLesson8(),
          takeaways: [
            'Consumers subscribe to topics and read events in order within each partition',
            'Offsets track consumer position; can be auto-committed or manually managed',
            'At-least-once (default): commit after processing; safe but may cause duplicates',
            'Consumer groups enable horizontal scaling by splitting partitions across members',
          ],
        },
        {
          id: 'm3-l3',
          title: 'Serialization & Deserialization (SerDes)',
          objectives: [
            'Explain the role of serialization in Kafka event pipelines',
            'Compare common serialization formats: JSON, Avro, Protobuf, plain bytes',
            'Apply SerDes configuration in producer and consumer clients',
          ],
          content: getLesson9(),
          takeaways: [
            'Serialization converts in-memory objects to bytes; deserialization converts them back',
            'Kafka stores raw bytes — it doesn\'t validate or understand the data format',
            'JSON is human-readable but verbose; Avro/Protobuf are compact and schema-aware',
            'Avro with Schema Registry is the most common production setup for Kafka',
          ],
        },
      ],
    },
    {
      module: 4,
      moduleTitle: 'Consumer Groups & Rebalancing',
      icon: 'fa-users',
      lessons: [
        {
          id: 'm4-l1',
          title: 'Consumer Groups & Offset Management',
          objectives: [
            'Define consumer groups and explain how they share partition assignments',
            'Describe offset storage in the __consumer_offsets internal topic',
            'Implement manual offset commits and understand when to use them',
          ],
          content: getLesson10(),
          takeaways: [
            'Consumer groups enable horizontal scaling: partitions are split across group members',
            'Each consumer reads from a unique subset of partitions; no two read the same data',
            'Offsets are stored in the __consumer_offsets internal topic (not in ZooKeeper)',
            'Manual offset commits give fine-grained control over exactly-once processing semantics',
          ],
        },
        {
          id: 'm4-l2',
          title: 'Rebalancing Protocols: Eager vs. Cooperative',
          objectives: [
            'Explain consumer group rebalancing and why it is necessary',
            'Compare eager (stop-the-world) vs. cooperative (incremental) rebalancing',
            'Minimize rebalance impact with static group membership',
          ],
          content: getLesson11(),
          takeaways: [
            'Eager rebalancing revokes ALL partitions from all consumers (stop-the-world pause)',
            'Cooperative rebalancing only revokes partitions that need to move (no global pause)',
            'Kafka 3.1+ defaults to cooperative rebalancing for better large-group performance',
            'Static group membership prevents unnecessary rebalances on temporary disconnects',
          ],
        },
      ],
    },
    {
      module: 5,
      moduleTitle: 'Kafka Connect (Sources & Sinks)',
      icon: 'fa-plug',
      lessons: [
        {
          id: 'm5-l1',
          title: 'Kafka Connect Architecture',
          objectives: [
            'Describe the Kafka Connect framework and its worker-based architecture',
            'Explain connectors, tasks, workers, and converters',
            'Deploy and configure a Kafka Connect cluster',
          ],
          content: getLesson12(),
          takeaways: [
            'Kafka Connect is a framework for streaming data between Kafka and external systems',
            'It runs as a separate cluster of worker processes that execute connector tasks',
            'Connectors use tasks for parallelism; more tasks = faster data movement',
            'Single Message Transforms (SMTs) allow lightweight data transformation without custom code',
          ],
        },
        {
          id: 'm5-l2',
          title: 'Source & Sink Connectors',
          objectives: [
            'Differentiate source connectors (import) from sink connectors (export)',
            'Configure and deploy JDBC Source, S3 Sink, Elasticsearch Sink, and Debezium CDC',
            'Choose the right connector for a given integration scenario',
          ],
          content: getLesson13(),
          takeaways: [
            'Source connectors bring data into Kafka from external systems (databases, logs, APIs)',
            'Sink connectors push data from Kafka to external systems (S3, Elasticsearch, Redis)',
            'Debezium CDC reads database transaction logs for complete change data capture',
            'The connector ecosystem has hundreds of pre-built connectors for common systems',
          ],
        },
      ],
    },
    {
      module: 6,
      moduleTitle: 'Schema Registry & Avro',
      icon: 'fa-database',
      lessons: [
        {
          id: 'm6-l1',
          title: 'Schema Registry & Schema Evolution',
          objectives: [
            'Explain why schema management is critical in event-driven systems',
            'Describe Schema Registry architecture and its compatibility modes',
            'Implement schema evolution safely (backward, forward, full compatibility)',
          ],
          content: getLesson14(),
          takeaways: [
            'Schema Registry provides a central repository for Avro/Protobuf/JSON schemas',
            'Each event carries a schema ID; consumers retrieve the schema from the registry',
            'Backward compatibility: new schema can read data written with old schema',
            'Forward compatibility: old schema can read data written with new schema',
          ],
        },
        {
          id: 'm6-l2',
          title: 'Avro Serialization & Compatibility',
          objectives: [
            'Write Avro schemas and generate Java/Python classes from them',
            'Configure Kafka clients with Avro serializer/deserializer and Schema Registry',
            'Handle schema compatibility in production deployments',
          ],
          content: getLesson15(),
          takeaways: [
            'Avro is a compact binary format with a JSON-based schema definition',
            'Avro schemas are self-describing when embedded; with Schema Registry, only the ID is sent',
            'Required fields must have defaults for backward-compatible schema evolution',
            'Use FULL compatibility in development; use BACKWARD in production for safety',
          ],
        },
      ],
    },
    {
      module: 7,
      moduleTitle: 'Kafka Streams & KSQL',
      icon: 'fa-stream',
      lessons: [
        {
          id: 'm7-l1',
          title: 'Introduction to Kafka Streams',
          objectives: [
            'Explain stream processing and how Kafka Streams differs from consumer-based processing',
            'Describe Kafka Streams architecture: topology, processors, state stores',
            'Set up a basic Kafka Streams application',
          ],
          content: getLesson16(),
          takeaways: [
            'Kafka Streams is a Java library for building real-time stream processing applications',
            'No separate processing cluster needed — runs inside your application JVM',
            'Built-in exactly-once semantics, stateful processing with RocksDB, and fault tolerance',
            'A stream application is a topology of interconnected processor nodes',
          ],
        },
        {
          id: 'm7-l2',
          title: 'Streams DSL & Processor API',
          objectives: [
            'Use the Streams DSL (filter, map, groupBy, aggregate, join) for common operations',
            'Implement custom logic via the lower-level Processor API',
            'Choose between DSL and Processor API based on application requirements',
          ],
          content: getLesson17(),
          takeaways: [
            'Streams DSL provides high-level abstractions: KStream, KTable, GlobalKTable',
            'Common operations: filter, map, flatMap, groupBy, reduce, aggregate, join',
            'Processor API gives full control: implement Processor interface with custom state stores',
            'Most apps start with DSL; drop to Processor API only for fine-grained control needs',
          ],
        },
        {
          id: 'm7-l3',
          title: 'KSQL / ksqlDB for Stream Processing',
          objectives: [
            'Use SQL-like syntax to create streams and tables from Kafka topics',
            'Implement filtering, aggregation, and joins using KSQL',
            'Determine when to use KSQL vs. Kafka Streams DSL vs. Processor API',
          ],
          content: getLesson18(),
          takeaways: [
            'KSQL/ksqlDB provides SQL-based stream processing accessible to non-Java developers',
            'Supports streaming queries (EMIT CHANGES) and pull queries (current state lookup)',
            'Best for simple filtering, transformation, and windowed aggregations',
            'Complex stateful logic is better served by Kafka Streams DSL or Processor API',
          ],
        },
      ],
    },
    {
      module: 8,
      moduleTitle: 'Exactly-Once Semantics',
      icon: 'fa-check-double',
      lessons: [
        {
          id: 'm8-l1',
          title: 'Delivery Semantics: At-Most-Once, At-Least-Once, Exactly-Once',
          objectives: [
            'Differentiate at-most-once, at-least-once, and exactly-once delivery semantics',
            'Identify the trade-offs between performance, reliability, and resource usage',
            'Choose the appropriate semantic for a given use case',
          ],
          content: getLesson19(),
          takeaways: [
            'At-most-once: fire-and-forget, fastest but messages can be lost',
            'At-least-once: retry on failure, no data loss but may cause duplicate processing',
            'Exactly-once: requires idempotent producers + transactions, zero loss, zero duplicates',
            'Most production systems use at-least-once; exactly-once is needed for financial use cases',
          ],
        },
        {
          id: 'm8-l2',
          title: 'Idempotent Producers & Kafka Transactions',
          objectives: [
            'Configure idempotent producers to prevent duplicate writes',
            'Explain how producer IDs (PID) and sequence numbers prevent duplicates',
            'Implement Kafka transactions for atomic writes to multiple partitions',
          ],
          content: getLesson20(),
          takeaways: [
            'Idempotent producers use producer ID + sequence number to detect and discard duplicates',
            'Enable with enable.idempotence=true in producer configuration',
            'Kafka transactions enable atomic multi-partition writes (all or nothing)',
            'Exactly-once semantics in Kafka Streams builds on idempotent producers + transactions',
          ],
        },
      ],
    },
    {
      module: 9,
      moduleTitle: 'Dead Letter Queues & Error Handling',
      icon: 'fa-exclamation-triangle',
      lessons: [
        {
          id: 'm9-l1',
          title: 'Error Handling Strategies in Kafka',
          objectives: [
            'Categorize error types: deserialization, processing, connectivity, transient, fatal',
            'Implement retry strategies with exponential backoff and retry topics',
            'Avoid poison pill messages and consumer stuck scenarios',
          ],
          content: getLesson21(),
          takeaways: [
            'Errors: deserialization (bad data), processing (code errors), connectivity (network), transient (retryable), fatal (never succeeds)',
            'Use exponential backoff for transient errors; separate retry topics with delays for async retries',
            'Poison pill messages cause infinite errors — use DLQs to quarantine them',
            'Always distinguish transient from fatal errors to avoid infinite retry loops',
          ],
        },
        {
          id: 'm9-l2',
          title: 'Dead Letter Queue Architecture',
          objectives: [
            'Design and implement a dead letter queue (DLQ) for failed messages',
            'Enrich DLQ messages with metadata (error cause, original offset, timestamp)',
            'Build monitoring and alerting for DLQ topics',
          ],
          content: getLesson22(),
          takeaways: [
            'DLQ = separate Kafka topic where failed messages are stored with error metadata',
            'Include original message, error reason, source topic/partition/offset in each DLQ message',
            'Set retention policies on DLQ topics (e.g., 30 days) to prevent infinite storage growth',
            'Monitor DLQ metrics and alert when messages appear; build replay tools for reprocessing',
          ],
        },
      ],
    },
    {
      module: 10,
      moduleTitle: 'Kafka Security (SSL/SASL)',
      icon: 'fa-shield-alt',
      lessons: [
        {
          id: 'm10-l1',
          title: 'SSL/TLS Encryption in Kafka',
          objectives: [
            'Explain encryption in transit and why it matters for Kafka',
            'Configure SSL/TLS on Kafka brokers and clients',
            'Set up mutual TLS (mTLS) for broker-to-client authentication',
          ],
          content: getLesson23(),
          takeaways: [
            'SSL/TLS encrypts all data in transit between clients and brokers (and between brokers)',
            'Configure keystore (your identity) and truststore (who you trust) on brokers and clients',
            'mTLS provides both encryption AND client authentication via certificates',
            'Production environments should always use SSL encryption for sensitive data',
          ],
        },
        {
          id: 'm10-l2',
          title: 'SASL Authentication & Authorization',
          objectives: [
            'Compare SASL/PLAIN, SASL/SCRAM, SASL/GSSAPI (Kerberos), and SASL/OAUTHBEARER',
            'Configure ACLs for fine-grained topic-level access control',
            'Implement a defense-in-depth security strategy for Kafka',
          ],
          content: getLesson24(),
          takeaways: [
            'SASL authentication verifies client identity: PLAIN (simple), SCRAM (secure), GSSAPI (enterprise), OAUTHBEARER (cloud)',
            'ACLs control what authenticated users can do (read, write, create, delete) on specific resources',
            'Defense-in-depth: SSL encryption + SASL authentication + ACL authorization + network policies',
            'Start with SSL (always), add SASL for production, and ACLs for multi-team environments',
          ],
        },
      ],
    },
  ];

  /* Note: lesson content functions are defined at the bottom of this IIFE
     (before the init() call) to keep the curriculum declaration readable. */

  /* ─── Flatten lessons into a single ordered array ─── */

  var curriculum = [];
  CURRICULUM_MODULES.forEach(function (mod) {
    mod.lessons.forEach(function (lesson) {
      curriculum.push(lesson);
    });
  });

  /* We also keep the module structure for the grouped sidebar */
  /* quiz questions are embedded per-lesson in the quiz object below */

  /* ─── Quiz questions per lesson ─── */

  var QUIZ_DATA = getQuizData();
  function getQuizData() {
    /* Return an object keyed by lesson id, each containing an array of question objects */
    return {
      'm1-l1': [
        { q: 'What is Apache Kafka primarily designed for?', options: ['Batch data processing', 'Real-time event streaming at scale', 'Relational database queries', 'File storage'], correct: 1 },
        { q: 'In the publish-subscribe model, producers and consumers are:', options: ['Tightly coupled', 'Fully decoupled', 'Directly connected', 'Always in the same application'], correct: 1 },
        { q: 'Which company processes over 700 billion events per day using Kafka?', options: ['Amazon', 'Google', 'Netflix', 'Twitter'], correct: 2 },
        { q: 'An event in Kafka is:', options: ['A mutable record that can be edited', 'An immutable record of something that happened', 'A temporary message that disappears after reading', 'A database transaction'], correct: 1 },
        { q: 'Event streaming differs from batch processing because:', options: ['It processes data in real-time as events occur', 'It only works on weekends', 'It requires more storage', 'It is slower but more accurate'], correct: 0 },
      ],
      'm1-l2': [
        { q: 'Which component in Kafka stores events?', options: ['Producer', 'Broker', 'Consumer', 'Connector'], correct: 1 },
        { q: 'What is the role of ZooKeeper in older Kafka deployments?', options: ['Store event data', 'Cluster coordination and metadata management', 'Serialize events', 'Process streams'], correct: 1 },
        { q: 'What replaced ZooKeeper in newer Kafka versions?', options: ['KRaft', 'Kafka Connect', 'Schema Registry', 'KSQL'], correct: 0 },
        { q: 'Which component PUBLISHES events to Kafka?', options: ['Producer', 'Consumer', 'Broker', 'Connector'], correct: 0 },
      ],
      'm1-l3': [
        { q: 'Which of the following is a good use case for Kafka?', options: ['Storing user profile data with complex SQL queries', 'Centralized log aggregation from thousands of servers', 'Replacing a simple REST API between two services', 'Running transactional SQL workloads'], correct: 1 },
        { q: 'When should you NOT use Kafka?', options: ['When you need to decouple microservices', 'When you need exactly-once guarantees', 'For simple point-to-point communication between two apps', 'For high-throughput data pipelines'], correct: 2 },
        { q: 'What is CQRS?', options: ['Command Query Responsibility Segregation', 'Centralized Query Response System', 'Continuous Queuing and Retrieval Service', 'Compressed Query Response Schema'], correct: 0 },
      ],
      'm2-l1': [
        { q: 'Events within a Kafka topic are:', options: ['Editable after being written', 'Immutable once written', 'Automatically deleted after one read', 'Temporarily stored'], correct: 1 },
        { q: 'What determines how long events stay in a topic?', options: ['Retention policy', 'Number of partitions', 'Consumer group size', 'Producer configuration'], correct: 0 },
        { q: 'Log compaction in Kafka means:', options: ['Compressing event payloads', 'Keeping only the latest value for each key', 'Deleting old topics', 'Merging multiple topics'], correct: 1 },
      ],
      'm2-l2': [
        { q: 'What is the primary purpose of partitions in Kafka?', options: ['Encrypt event data', 'Enable parallelism and scalability', 'Store events in different data centers', 'Filter events by type'], correct: 1 },
        { q: 'If a producer sends events with the same key, they go to:', options: ['Random partitions', 'The same partition (ensuring order)', 'All partitions equally', 'The first partition only'], correct: 1 },
        { q: 'Events sent without a key are distributed using:', options: ['Alphabetical order', 'Round-robin', 'Smallest partition first', 'Reverse order'], correct: 1 },
        { q: 'A good starting number of partitions per topic is:', options: ['1-2', '3-6', '100-200', '1000+'], correct: 1 },
      ],
      'm2-l3': [
        { q: 'What does Replication Factor (RF) define?', options: ['How fast data is replicated', 'Number of copies of each partition', 'How many topics can be created', 'Number of consumers per group'], correct: 1 },
        { q: 'The partition leader is responsible for:', options: ['Only backups', 'Handling all reads and writes', 'Archiving old events', 'Managing consumer offsets'], correct: 1 },
        { q: 'ISR stands for:', options: ['Internal Sequential Replication', 'In-Sync Replicas', 'Inter-Server Routing', 'Indexed Sequential Records'], correct: 1 },
        { q: 'What happens when the leader partition fails?', options: ['The topic becomes read-only', 'An ISR follower becomes the new leader', 'All data in that partition is lost', 'Clients must reconnect manually'], correct: 1 },
      ],
      'm3-l1': [
        { q: 'Which acks setting provides the strongest durability guarantee?', options: ['acks=0', 'acks=1', 'acks=all', 'acks=none'], correct: 2 },
        { q: 'What is a producer ID (PID) used for?', options: ['Identifying the topic', 'Idempotent deduplication', 'Encrypting messages', 'Compressing payloads'], correct: 1 },
        { q: 'A producer sends a message without a key. How does it reach a partition?', options: ['Always partition 0', 'Round-robin across partitions', 'Based on message size', 'Random assignment'], correct: 1 },
      ],
      'm3-l2': [
        { q: 'What is a consumer offset?', options: ['The size of the consumer application', 'The position of the consumer within a partition', 'The number of messages consumed per second', 'The delay between producing and consuming'], correct: 1 },
        { q: 'In at-least-once semantics, the offset is committed:', options: ['Before processing', 'After processing', 'Never', 'Only on consumer shutdown'], correct: 1 },
        { q: 'Consumer groups allow:', options: ['Multiple consumers to read the same partition in parallel', 'Horizontal scaling by splitting partitions across consumers', 'Writing to multiple topics at once', 'Ignoring offset management'], correct: 1 },
      ],
      'm3-l3': [
        { q: 'What does serialization do?', options: ['Deletes old messages', 'Converts objects to bytes for network transmission', 'Encrypts topic names', 'Creates new topics'], correct: 1 },
        { q: 'Which serialization format is most compact and schema-aware?', options: ['JSON', 'XML', 'Avro', 'Plain text'], correct: 2 },
        { q: 'Why is Avro with Schema Registry commonly used in production?', options: ['It is the easiest format for humans to read', 'It stores the schema separately, keeping events small', 'It is required by Kafka', 'It supports SQL queries'], correct: 1 },
      ],
      'm4-l1': [
        { q: 'Where are consumer offsets stored?', options: ['In ZooKeeper', 'In the __consumer_offsets internal topic', 'On the file system of each consumer', 'In a dedicated database'], correct: 1 },
        { q: 'What happens when a consumer in a group crashes?', options: ['The group stops processing', 'Its partitions are reassigned to remaining consumers', 'Kafka deletes unprocessed events', 'The consumer is permanently removed'], correct: 1 },
        { q: 'Consumer groups enable:', options: ['Faster message production', 'Horizontal scaling of consumers', 'Data encryption', 'Automatic topic creation'], correct: 1 },
      ],
      'm4-l2': [
        { q: 'Eager rebalancing means:', options: ['Only some partitions are revoked', 'All consumers stop, partitions are revoked, then reassigned', 'Consumers continue processing during rebalance', 'Only the joining consumer gets partitions'], correct: 1 },
        { q: 'Cooperative rebalancing:', options: ['Requires manual intervention', 'Only revokes partitions that need to move', 'Is slower than eager rebalancing', 'Does not support static membership'], correct: 1 },
        { q: 'Static group membership helps by:', options: ['Holding partitions during temporary disconnects', 'Increasing consumer speed', 'Reducing message size', 'Automatically creating topics'], correct: 0 },
      ],
      'm5-l1': [
        { q: 'Kafka Connect runs as:', options: ['Within the Kafka broker process', 'A separate cluster of worker processes', 'A library included in producers', 'A plugin for ZooKeeper'], correct: 1 },
        { q: 'What is a connector task?', options: ['A worker level of parallelism within a connector', 'A single message transformation', 'A script for monitoring', 'An external API call'], correct: 0 },
        { q: 'Single Message Transforms (SMTs) allow:', options: ['Creating new connectors', 'Lightweight data transformation without custom code', 'Deleting topics', 'Managing consumer groups'], correct: 1 },
      ],
      'm5-l2': [
        { q: 'What does a source connector do?', options: ['Exports data FROM Kafka', 'Imports data INTO Kafka from external systems', 'Deletes events from topics', 'Manages consumer offsets'], correct: 1 },
        { q: 'Debezium CDC works by:', options: ['Polling the database every second', 'Reading database transaction logs', 'Using database triggers', 'Parsing application log files'], correct: 1 },
        { q: 'A sink connector does what?', options: ['Brings data into Kafka', 'Takes data out of Kafka to external systems', 'Creates topics automatically', 'Monitors consumer health'], correct: 1 },
      ],
      'm6-l1': [
        { q: 'What does a schema ID represent in a Kafka event?', options: ['The event payload itself', 'An integer that points to the schema in the registry', 'The partition number', 'The consumer group ID'], correct: 1 },
        { q: 'Backward compatibility means:', options: ['Old schema can read new data', 'New schema can read old data', 'Both schemas are identical', 'Neither schema can read the other\'s data'], correct: 1 },
        { q: 'Schema Registry helps prevent:', options: ['Network failures', 'Breaking changes when schemas evolve', 'Producer crashes', 'Consumer lag'], correct: 1 },
      ],
      'm6-l2': [
        { q: 'Avro schemas are defined using:', options: ['XML', 'JSON', 'YAML', 'Protocol Buffers'], correct: 1 },
        { q: 'When adding a new field to an Avro schema with backward compatibility, the field must:', options: ['Be required', 'Have a default value', 'Be a string type', 'Start with an underscore'], correct: 1 },
        { q: 'Which compatibility mode is safest for production?', options: ['NONE', 'BACKWARD', 'FORWARD', 'ANY'], correct: 1 },
      ],
      'm7-l1': [
        { q: 'Kafka Streams runs:', options: ['On a separate stream processing cluster', 'Inside your application JVM', 'On the Kafka broker nodes', 'As a managed cloud service'], correct: 1 },
        { q: 'What does Kafka Streams use for local state storage?', options: ['MySQL', 'RocksDB', 'Redis', 'Cassandra'], correct: 1 },
        { q: 'A Kafka Streams topology is:', options: ['A network diagram of brokers', 'A graph of interconnected processor nodes', 'A list of topics', 'A consumer group configuration'], correct: 1 },
      ],
      'm7-l2': [
        { q: 'Which Kafka Streams abstraction represents a partitioned, replayable stream?', options: ['KTable', 'KStream', 'GlobalKTable', 'StateStore'], correct: 1 },
        { q: 'The Processor API gives you:', options: ['Simpler code than DSL', 'Full control over event processing', 'Automatic SQL query support', 'Built-in web dashboard'], correct: 1 },
        { q: 'When should you use Processor API over DSL?', options: ['Always — it is more powerful', 'When you need fine-grained control the DSL does not offer', 'Never — DSL is always sufficient', 'Only for simple filter operations'], correct: 1 },
      ],
      'm7-l3': [
        { q: 'KSQL allows you to process Kafka streams using:', options: ['Java code', 'SQL-like syntax', 'Python scripts', 'YAML configuration'], correct: 1 },
        { q: 'EMIT CHANGES in KSQL is used for:', options: ['Pull queries (current state lookup)', 'Streaming queries (continuous output)', 'Deleting topics', 'Creating connectors'], correct: 1 },
        { q: 'When should you choose KSQL over Kafka Streams DSL?', options: ['For complex stateful logic', 'For simple filtering and aggregation', 'Always', 'Never'], correct: 1 },
      ],
      'm8-l1': [
        { q: 'Which delivery semantic provides the highest performance?', options: ['At-most-once', 'At-least-once', 'Exactly-once', 'All are equally fast'], correct: 0 },
        { q: 'At-least-once semantics may produce:', options: ['Data loss', 'Duplicate messages', 'Schema errors', 'Consumer crashes'], correct: 1 },
        { q: 'Exactly-once semantics require:', options: ['Only idempotent producers', 'Only transactions', 'Idempotent producers + transactions', 'A separate database'], correct: 2 },
      ],
      'm8-l2': [
        { q: 'How does an idempotent producer prevent duplicates?', options: ['By encrypting messages', 'Using a PID + sequence number to detect duplicates', 'By sending messages twice', 'By using acks=0'], correct: 1 },
        { q: 'Kafka transactions enable:', options: ['Faster message publishing', 'Atomic writes to multiple partitions', 'Automatic topic creation', 'Consumer rebalancing'], correct: 1 },
        { q: 'Producer ID (PID) is:', options: ['A user-chosen identifier', 'A unique ID assigned by Kafka for deduplication', 'The topic partition ID', 'The consumer group ID'], correct: 1 },
      ],
      'm9-l1': [
        { q: 'A poison pill message is:', options: ['An encrypted message', 'A message that causes infinite processing errors', 'A message with a high priority', 'A deleted message'], correct: 1 },
        { q: 'Exponential backoff means:', options: ['Retrying instantly each time', 'Waiting longer between each retry attempt', 'Not retrying at all', 'Retrying with the same delay'], correct: 1 },
        { q: 'What should you use to handle fatal errors?', options: ['Infinite retry loop', 'Dead Letter Queue', 'Ignore the error', 'Restart the consumer'], correct: 1 },
      ],
      'm9-l2': [
        { q: 'A Dead Letter Queue is:', options: ['A queue deleted messages go to', 'A separate Kafka topic for failed messages with metadata', 'A backup topic for all messages', 'A consumer group for errors'], correct: 1 },
        { q: 'What metadata should a DLQ message include?', options: ['Only the original message', 'Original message, error reason, source topic/partition/offset', 'Only the error stack trace', 'Consumer group ID and timestamp'], correct: 1 },
        { q: 'Why monitor DLQ topics?', options: ['To delete failed messages', 'To detect systemic issues and take corrective action', 'To increase retention policies', 'To create new topics'], correct: 1 },
      ],
      'm10-l1': [
        { q: 'SSL/TLS encryption in Kafka protects:', options: ['Data at rest on disk', 'Data in transit over the network', 'Consumer offsets', 'Schema Registry data'], correct: 1 },
        { q: 'A keystore in SSL configuration contains:', options: ['A list of trusted certificates', 'Your own certificate and private key', 'Consumer group metadata', 'Topic configurations'], correct: 1 },
        { q: 'Mutual TLS (mTLS) provides:', options: ['Only encryption', 'Encryption + client authentication via certificates', 'Only client authentication', 'Data compression'], correct: 1 },
      ],
      'm10-l2': [
        { q: 'SASL/SCRAM is more secure than SASL/PLAIN because:', options: ['It uses longer passwords', 'The password is never sent over the network', 'It requires SSL too', 'It uses Kerberos tickets'], correct: 1 },
        { q: 'What do ACLs control in Kafka?', options: ['Consumer group offsets', 'Who can read/write/create/delete resources', 'Topic partition counts', 'Message retention periods'], correct: 1 },
        { q: 'What is the recommended defense-in-depth strategy?', options: ['SSL only', 'SSL + SASL + ACLs + network policies', 'SASL only', 'ACLs only'], correct: 1 },
      ],
    };
  }

  /* ─── Lesson Content Builder Functions ─── */

  /* Each getLessonX() returns a string of HTML content with
     learning objectives, explanations, code examples, and takeaways */

  function getLesson1() {
    return buildLessonHtml({
      objectives: [
        'Define event streaming and explain how it differs from batch processing',
        'Identify the core problems Kafka solves in distributed systems',
        'Describe the publish-subscribe messaging model',
      ],
      body: `
        <p>Apache Kafka is a <strong>distributed event streaming platform</strong> open-sourced by the Apache Software Foundation. It was originally developed at LinkedIn to handle the massive data pipeline challenges they faced as their platform grew.</p>

        <h4>What is Event Streaming?</h4>
        <p>Event streaming is the practice of capturing data in real-time from event sources like databases, sensors, mobile devices, and software applications. These events are stored durably in a log for later retrieval and processing.</p>

        <p>Examples of events:</p>
        <ul>
          <li>A user clicks "Buy Now" on an e-commerce site</li>
          <li>A temperature sensor reports 72°F every 5 seconds</li>
          <li>A shipping container changes location</li>
          <li>A Netflix user pauses a movie</li>
        </ul>

        <h4>The Publish-Subscribe Model</h4>
        <p>Kafka uses a <strong>publish-subscribe</strong> model where <strong>producers</strong> publish events to <strong>topics</strong>, and <strong>consumers</strong> subscribe to those topics. Producers and consumers are fully decoupled — they never communicate directly.</p>

        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 my-4">
          <p class="font-mono text-sm"><span class="text-green-600">Producer</span> → [Event] → <span class="text-blue-600">Kafka Topic</span> ← [Events] ← <span class="text-purple-600">Consumer</span></p>
        </div>

        <h4>Key Problems Kafka Solves</h4>
        <table class="min-w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Problem</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Kafka Solution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Point-to-point coupling</td>
              <td class="border border-gray-300 px-4 py-2">Decoupled publish-subscribe model</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Data loss on failure</td>
              <td class="border border-gray-300 px-4 py-2">Replication and durable storage</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Scaling reads/writes</td>
              <td class="border border-gray-300 px-4 py-2">Partitioning across brokers</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Backpressure / slow consumers</td>
              <td class="border border-gray-300 px-4 py-2">Consumers control their own read rate</td>
            </tr>
          </tbody>
        </table>

        <h4>Kafka vs. Traditional Message Queues</h4>
        <ul>
          <li><strong>Message retention:</strong> Traditional queues delete messages after consumption; Kafka retains them based on policy</li>
          <li><strong>Replayability:</strong> Kafka consumers can rewind and reprocess events from any point in time</li>
          <li><strong>Multi-subscriber:</strong> Multiple consumer groups can read the same topic independently</li>
          <li><strong>Throughput:</strong> Kafka can handle millions of messages per second with low latency</li>
        </ul>
      `,
      code: `// Minimal producer (Java pseudo-code)
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

Producer<String, String> producer = new KafkaProducer<>(props);
producer.send(new ProducerRecord<>("orders", "key-1", "{\\"user\\": \\"alice\\", \\"amount\\": 42}"));
producer.close();`,
      takeaways: [
        'Kafka is a distributed event streaming platform for high-volume real-time data pipelines',
        'Events are immutable records of something that happened; event streaming captures them continuously',
        'Kafka decouples producers and consumers via a publish-subscribe model',
        'Netflix processes over 700 billion events per day using Kafka',
      ],
    });
  }

  function getLesson2() {
    return buildLessonHtml({
      objectives: [
        'Identify the key components: Producers, Brokers, Topics, Partitions, Consumers',
        'Explain how ZooKeeper / KRaft manages cluster coordination',
        'Describe how data flows from a producer through brokers to consumers',
      ],
      body: `
        <p>Kafka is composed of several key components that work together to provide a scalable, fault-tolerant event streaming platform.</p>

        <h4>Brokers</h4>
        <p>A Kafka cluster consists of one or more <strong>brokers</strong> (servers). Each broker is identified by a unique ID. Brokers store event data, handle client requests, and replicate data for fault tolerance.</p>

        <h4>Topics & Partitions</h4>
        <p>Events are organized into <strong>topics</strong>. Topics are split into <strong>partitions</strong> (the unit of parallelism). Partitions are ordered, immutable sequences of events that are continuously appended to.</p>

        <h4>Producers</h4>
        <p>Producers publish events to a topic. They decide which partition to write to (by key or round-robin) and can control durability via <strong>acknowledgment levels</strong>.</p>

        <h4>Consumers & Consumer Groups</h4>
        <p>Consumers subscribe to topics and read events. Multiple consumers can form a <strong>consumer group</strong> to distribute partition assignments across group members.</p>

        <h4>ZooKeeper / KRaft</h4>
        <p>Older Kafka versions rely on <strong>Apache ZooKeeper</strong> for cluster coordination: leader election, metadata storage, and configuration management. Newer Kafka versions (2.8+) introduced <strong>KRaft</strong>, which replaces ZooKeeper with a built-in consensus protocol based on the Raft algorithm.</p>

        <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200 my-4">
          <p class="text-sm"><strong>Migration Note:</strong> KRaft mode is production-ready in Kafka 3.3+. It simplifies deployment by removing the ZooKeeper dependency, reduces operational overhead, and improves cluster startup time.</p>
        </div>
      `,
      code: `// Kafka cluster topology (3 brokers, 1 topic with 3 partitions)
// Brokers: broker-1 (leader for partition 0), broker-2 (leader for partition 1),
//          broker-3 (leader for partition 2)
// Each partition is replicated on 2 other brokers

// Producer connects to any broker, which routes the event to the partition leader
// Consumer connects to any broker, which redirects to the partition leader

// Producer configuration
props.put("bootstrap.servers", "broker-1:9092,broker-2:9092,broker-3:9092");
props.put("acks", "all"); // Wait for all replicas to confirm`,
      takeaways: [
        'Producers write events; consumers read them; brokers store and serve them',
        'Topics categorize events; partitions enable parallelism within topics',
        'Older Kafka uses ZooKeeper for coordination; newer Kafka uses KRaft (built-in)',
        'Brokers, topics, and partitions work together to provide scalability and fault tolerance',
      ],
    });
  }

  function getLesson3() {
    return buildLessonHtml({
      objectives: [
        'List common real-world Kafka use cases (logging, activity tracking, pipelines, CQRS)',
        'Identify scenarios where Kafka is the right choice vs. where it is overkill',
        'Evaluate Kafka trade-offs: throughput vs. latency, complexity vs. capability',
      ],
      body: `
        <p>Kafka is used in thousands of organizations for a wide variety of use cases. Understanding when to use it — and when NOT to — is critical for designing robust systems.</p>

        <h4>Common Use Cases</h4>

        <h5>1. Log Aggregation & Monitoring</h5>
        <p>Collect log data from thousands of servers into a central pipeline. Tools like the ELK stack consume from Kafka for indexing and visualization.</p>

        <h5>2. Activity Tracking</h5>
        <p>Track user interactions (clicks, page views, searches) across web and mobile applications. Kafka handles millions of events per second with low latency.</p>

        <h5>3. Data Pipelines & ETL</h5>
        <p>Stream data from operational databases to data warehouses, data lakes, or analytics platforms. Kafka Connect provides pre-built connectors for this purpose.</p>

        <h5>4. CQRS & Event Sourcing</h5>
        <p>Implement Command Query Responsibility Segregation (CQRS) and Event Sourcing patterns. Kafka's append-only log is a natural fit for event sourcing.</p>

        <h5>5. Metrics & Real-Time Analytics</h5>
        <p>Collect application and infrastructure metrics in real-time, feeding dashboards and alerting systems.</p>

        <h4>When NOT to Use Kafka</h4>
        <ul>
          <li><strong>Simple point-to-point communication:</strong> Use a REST API or gRPC instead</li>
          <li><strong>Relational data with complex queries:</strong> Use a relational database (PostgreSQL, MySQL)</li>
          <li><strong>Very small projects:</strong> Kafka's operational overhead isn't justified</li>
          <li><strong>Low-throughput, simple pub-sub:</strong> A message broker like RabbitMQ may be simpler</li>
        </ul>
      `,
      code: `// Common deployment topologies for Kafka use cases

// 1. Log Aggregation
App Server → [Log Events] → Kafka Topic "app-logs" → Logstash → Elasticsearch → Kibana

// 2. Activity Tracking
Mobile App → [Click Events] → Kafka Topic "clicks" → Spark Streaming → Analytics DB

// 3. Data Pipeline (CDC)
PostgreSQL → Debezium (CDC) → Kafka Topic "db-changes" → S3 Sink Connector → Amazon S3`,
      takeaways: [
        'Kafka excels at log aggregation, activity tracking, data pipelines, CQRS/event sourcing',
        'Use Kafka when you need decoupling, replayability, high throughput, or multi-subscriber fan-out',
        'Don\'t use Kafka for simple point-to-point communication or complex relational queries',
        'Kafka adds operational complexity; choose it when its capabilities justify the overhead',
      ],
    });
  }

  function getLesson4() {
    return buildLessonHtml({
      objectives: [
        'Explain what a topic is and how it organizes event streams',
        'Understand retention policies, compaction, and log cleanup strategies',
        'Describe the immutability of events within a topic',
      ],
      body: `
        <p>A <strong>topic</strong> is a logical channel to which producers publish events and from which consumers read. Topics are the fundamental unit of organization in Kafka.</p>

        <h4>Topic Characteristics</h4>
        <ul>
          <li><strong>Named:</strong> Each topic has a unique name (e.g., "orders", "page_views")</li>
          <li><strong>Immutable:</strong> Events in a topic cannot be changed after being written</li>
          <li><strong>Durable:</strong> Events persist based on the configured retention policy</li>
          <li><strong>Ordered:</strong> Within a partition, events are strictly ordered by offset</li>
        </ul>

        <h4>Retention Policies</h4>
        <p>Kafka offers several ways to manage event lifecycle:</p>
        <ul>
          <li><strong>Time-based retention:</strong> <code>retention.ms</code> — Keep events for N milliseconds (e.g., 7 days)</li>
          <li><strong>Size-based retention:</strong> <code>retention.bytes</code> — Keep up to N bytes per partition</li>
          <li><strong>Log compaction:</strong> <code>cleanup.policy=compact</code> — Keep the latest value for each key</li>
          <li><strong>Delete:</strong> <code>cleanup.policy=delete</code> — Delete events after retention period</li>
        </ul>

        <h4>Log Compaction</h4>
        <p>Log compaction ensures that for each message key, only the most recent value is retained. This is useful for state restoration: a new consumer can read the compacted topic to get the latest state without processing the entire event history.</p>

        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200 my-4">
          <p class="text-sm"><strong>Example:</strong> A topic storing user profile updates. With compaction enabled, a new consumer can read the latest profile for every user without processing all historical changes.</p>
        </div>
      `,
      code: `# Topic creation with time-based retention
bin/kafka-topics.sh --create \\
  --topic orders \\
  --bootstrap-server localhost:9092 \\
  --partitions 3 \\
  --replication-factor 2 \\
  --config retention.ms=604800000  # 7 days

# Topic with log compaction
bin/kafka-topics.sh --create \\
  --topic user-profiles \\
  --bootstrap-server localhost:9092 \\
  --config cleanup.policy=compact \\
  --config min.cleanable.dirty.ratio=0.5 \\
  --config delete.retention.ms=86400000  # 1 day for tombstone retention`,
      takeaways: [
        'Topics are named logical channels that categorize and store events',
        'Events within a topic are immutable — they cannot be changed once written',
        'Retention policies (time-based or size-based) control how long events are kept',
        'Log compaction keeps the latest value for each key, useful for state restoration',
      ],
    });
  }

  function getLesson5() {
    return buildLessonHtml({
      objectives: [
        'Define partitions and explain their role in parallelism and scalability',
        'Describe key-based partitioning and round-robin distribution',
        'Explain how the number of partitions affects throughput and ordering',
      ],
      body: `
        <p><strong>Partitions</strong> are the backbone of Kafka's scalability. A topic is split into one or more partitions, each of which is an ordered, append-only log.</p>

        <h4>Why Partitions?</h4>
        <p>Partitions enable <strong>parallelism</strong>:</p>
        <ul>
          <li>Different partitions can live on different brokers</li>
          <li>Different consumers can read different partitions simultaneously</li>
          <li>The number of partitions determines the maximum parallelism for consumers</li>
        </ul>

        <h4>Partitioning Strategies</h4>
        <ul>
          <li><strong>Key-based:</strong> same key → same partition (guarantees order for that key)</li>
          <li><strong>Round-robin:</strong> events without a key are distributed evenly across partitions</li>
          <li><strong>Custom partitioner:</strong> implement your own partitioning logic</li>
        </ul>

        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 my-4">
          <p class="font-mono text-sm">Event(key="user_123") → hash("user_123") → Partition 2 (always)</p>
          <p class="font-mono text-sm">Event(no key) → Partition 0 → Partition 1 → Partition 2 → Partition 0 → ...</p>
        </div>

        <h4>Choosing the Number of Partitions</h4>
        <p>More partitions = more parallelism, but each partition adds overhead (file handles, replication traffic, rebalance time). Guidelines:</p>
        <ul>
          <li>Start with <strong>3-6 partitions</strong> per topic</li>
          <li>Monitor throughput; increase if consumers are falling behind</li>
          <li>Consider the maximum parallelism you need (max consumers = number of partitions)</li>
          <li>Avoid changing the partition count unless necessary (it can break key ordering guarantees)</li>
        </ul>
      `,
      code: `# Check partition count for a topic
bin/kafka-topics.sh --describe --topic orders --bootstrap-server localhost:9092

# Sample output:
# Topic: orders   PartitionCount: 3   ReplicationFactor: 2
#   Topic: orders   Partition: 0   Leader: 1   Replicas: 1,2   Isr: 1,2
#   Topic: orders   Partition: 1   Leader: 2   Replicas: 2,3   Isr: 2,3
#   Topic: orders   Partition: 2   Leader: 3   Replicas: 3,1   Isr: 3,1

# Alter partition count (use with caution!)
bin/kafka-topics.sh --alter --topic orders --partitions 6 --bootstrap-server localhost:9092`,
      takeaways: [
        'Partitions split a topic into ordered, append-only segments that enable parallel processing',
        'Key-based partitioning guarantees order for same-key events; round-robin balances load',
        'More partitions = more parallelism, but too many increases overhead and rebalance time',
        'A good starting point is 3-6 partitions per topic; monitor and scale as needed',
      ],
    });
  }

  function getLesson6() {
    return buildLessonHtml({
      objectives: [
        'Explain how replication provides fault tolerance and durability',
        'Describe the role of partition leaders and follower replicas',
        'Understand ISR (In-Sync Replicas) and how Kafka handles broker failures',
      ],
      body: `
        <p>Kafka provides <strong>fault tolerance</strong> through replication. Each partition can be replicated across multiple brokers, ensuring no data loss if a broker fails.</p>

        <h4>Replication Factor (RF)</h4>
        <p>The replication factor determines how many copies of each partition exist. An RF of 3 means the partition data exists on 3 different brokers.</p>

        <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200 my-4">
          <p class="text-sm"><strong>Rule of thumb:</strong> Set RF = 3 in production. This allows you to lose one broker for maintenance and still have a full replica set, and survive a second failure temporarily.</p>
        </div>

        <h4>Leader & Followers</h4>
        <p>For each partition, one replica is the <strong>leader</strong> and the rest are <strong>followers</strong>.</p>
        <ul>
          <li><strong>Leader:</strong> Handles all produce and consume requests for the partition</li>
          <li><strong>Followers:</strong> Replicate data from the leader, staying in sync</li>
        </ul>

        <h4>In-Sync Replicas (ISR)</h4>
        <p>The ISR is the set of followers that are fully caught up with the leader. If a follower is too slow or has lost its connection, it is removed from the ISR. Only replicas in the ISR are eligible to become the new leader.</p>

        <h4>Leader Failover</h4>
        <p>When a leader broker fails, one of the ISR followers is elected as the new leader automatically. This happens transparently to producers and consumers (they may experience a brief pause but will reconnect).</p>

        <h4>Unclean Leader Election</h4>
        <p>If <code>unclean.leader.election.enable=true</code>, a replica that is NOT in the ISR can become leader. This may cause data loss. Disable this in production to ensure consistency.</p>
      `,
      code: `# Topic with RF=3
bin/kafka-topics.sh --create \\
  --topic critical-events \\
  --bootstrap-server localhost:9092 \\
  --partitions 3 \\
  --replication-factor 3

# Check ISR status
bin/kafka-topics.sh --describe --topic critical-events --bootstrap-server localhost:9092

# Broker configuration for replication
# server.properties
default.replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false`,
      takeaways: [
        'Replication factor (RF) = number of copies of each partition across different brokers',
        'Each partition has one leader (handles all reads/writes) and N-1 followers (replicate data)',
        'ISR = set of fully caught-up followers; slow followers are removed from ISR automatically',
        'Leader failure triggers automatic failover to an in-sync follower with no data loss',
      ],
    });
  }

  function getLesson7() {
    return buildLessonHtml({
      objectives: [
        'Configure and use Kafka producers to publish events to topics',
        'Understand acknowledgment levels (acks=0, acks=1, acks=all) and their trade-offs',
        'Implement custom partitioning, retries, and error handling in producers',
      ],
      body: `
        <p><strong>Producers</strong> are client applications that publish events to Kafka topics. They are the entry point for data into the Kafka ecosystem.</p>

        <h4>Producer Architecture</h4>
        <p>A producer works through these steps:</p>
        <ol>
          <li>Serialize the key and value</li>
          <li>Determine the target partition (key-based or round-robin)</li>
          <li>Append to a buffer of pending sends</li>
          <li>A background thread sends batches to the broker</li>
          <li>Receive acknowledgment (based on acks setting)</li>
        </ol>

        <h4>Acknowledgment Levels (acks)</h4>
        <table class="min-w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Setting</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Behavior</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Durability</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Latency</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2"><code>acks=0</code></td>
              <td class="border border-gray-300 px-4 py-2">Fire-and-forget, no acknowledgment</td>
              <td class="border border-gray-300 px-4 py-2 text-red-600">Low</td>
              <td class="border border-gray-300 px-4 py-2 text-green-600">Lowest</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2"><code>acks=1</code></td>
              <td class="border border-gray-300 px-4 py-2">Wait for leader acknowledgment</td>
              <td class="border border-gray-300 px-4 py-2 text-yellow-600">Medium</td>
              <td class="border border-gray-300 px-4 py-2 text-yellow-600">Medium</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2"><code>acks=all</code></td>
              <td class="border border-gray-300 px-4 py-2">Wait for leader + all ISR replicas</td>
              <td class="border border-gray-300 px-4 py-2 text-green-600">Highest</td>
              <td class="border border-gray-300 px-4 py-2 text-red-600">Highest</td>
            </tr>
          </tbody>
        </table>

        <h4>Retries</h4>
        <p>Producers automatically retry on transient errors. Combined with <code>enable.idempotence=true</code>, retries do not produce duplicates.</p>
      `,
      code: `// Java Producer with acks=all and idempotence
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("acks", "all");
props.put("enable.idempotence", "true");
props.put("retries", Integer.MAX_VALUE);
props.put("max.in.flight.requests.per.connection", "5");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

// Send with callback
producer.send(new ProducerRecord<>("orders", "key-1", "{\\"item\\": \\"widget\\", \\"qty\\": 2}"),
  (metadata, exception) -> {
    if (exception != null) {
      System.err.println("Failed to send: " + exception.getMessage());
    } else {
      System.out.println("Written to partition " + metadata.partition() +
        " at offset " + metadata.offset());
    }
  });

producer.close();`,
      takeaways: [
        'Producers send events to topics; each event has an optional key and value payload',
        'acks=0 is fastest but can lose data; acks=1 is balanced; acks=all is safest',
        'Producers can specify a partition key or let round-robin distribute events',
        'Retries and idempotent producers help handle transient failures without duplicates',
      ],
    });
  }

  function getLesson8() {
    return buildLessonHtml({
      objectives: [
        'Configure consumers and subscribe to topics with consumer groups',
        'Explain offset management and auto-commit vs. manual commit strategies',
        'Implement consumer error handling and rebalance listeners',
      ],
      body: `
        <p><strong>Consumers</strong> read events from Kafka topics. They subscribe to topics and pull events from partition leaders.</p>

        <h4>Consumer Architecture</h4>
        <p>A consumer works through these steps:</p>
        <ol>
          <li>Subscribe to one or more topics</li>
          <li>Join a consumer group (or use a standalone consumer)</li>
          <li>The group coordinator assigns partitions</li>
          <li>Poll for new events in a loop</li>
          <li>Process events and commit offsets</li>
        </ol>

        <h4>Offset Management</h4>
        <p>Each consumer tracks its position with <strong>offsets</strong>. Offsets are stored in the <code>__consumer_offsets</code> internal topic.</p>
        <ul>
          <li><strong>Auto-commit (default):</strong> Offset is committed automatically at <code>auto.commit.interval.ms</code></li>
          <li><strong>Manual commit:</strong> You control when offsets are committed for exactly-once semantics</li>
        </ul>

        <h4>Consumer Liveliness</h4>
        <p>Consumers send heartbeats to the group coordinator. If <code>session.timeout.ms</code> passes without a heartbeat, the consumer is considered dead and its partitions are revoked.</p>
      `,
      code: `// Java Consumer with manual offset commit
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "order-processor");
props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("enable.auto.commit", "false");
props.put("max.poll.records", "100");

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(Arrays.asList("orders"));

try {
  while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
      System.out.printf("offset=%d, key=%s, value=%s%n",
        record.offset(), record.key(), record.value());
    }
    consumer.commitSync();  // Manual commit after batch processing
  }
} finally {
  consumer.close();
}`,
      takeaways: [
        'Consumers subscribe to topics and read events in order within each partition',
        'Offsets track consumer position; can be auto-committed or manually managed',
        'At-least-once (default): commit after processing; safe but may cause duplicates',
        'Consumer groups enable horizontal scaling by splitting partitions across members',
      ],
    });
  }

  function getLesson9() {
    return buildLessonHtml({
      objectives: [
        'Explain the role of serialization in Kafka event pipelines',
        'Compare common serialization formats: JSON, Avro, Protobuf, plain bytes',
        'Apply SerDes configuration in producer and consumer clients',
      ],
      body: `
        <p>Kafka stores events as <strong>byte arrays</strong>. Serialization converts objects to bytes; deserialization converts bytes back to objects.</p>

        <h4>Serialization Formats</h4>
        <table class="min-w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Format</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Readable</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Compact</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Schema</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Performance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">JSON</td>
              <td class="border border-gray-300 px-4 py-2">✅ Yes</td>
              <td class="border border-gray-300 px-4 py-2">❌ No (verbose)</td>
              <td class="border border-gray-300 px-4 py-2">❌ No</td>
              <td class="border border-gray-300 px-4 py-2">Low</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Avro</td>
              <td class="border border-gray-300 px-4 py-2">❌ Binary</td>
              <td class="border border-gray-300 px-4 py-2">✅ Yes</td>
              <td class="border border-gray-300 px-4 py-2">✅ Yes</td>
              <td class="border border-gray-300 px-4 py-2">High</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Protobuf</td>
              <td class="border border-gray-300 px-4 py-2">❌ Binary</td>
              <td class="border border-gray-300 px-4 py-2">✅ Yes</td>
              <td class="border border-gray-300 px-4 py-2">✅ Yes</td>
              <td class="border border-gray-300 px-4 py-2">High</td>
            </tr>
          </tbody>
        </table>

        <h4>Avro with Schema Registry</h4>
        <p>In production, <strong>Avro with Schema Registry</strong> is the most common setup. The schema is stored in the registry; each event carries only a 4-byte schema ID. This keeps events compact while enabling schema evolution.</p>
      `,
      code: `// Producer with Avro and Schema Registry
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "io.confluent.kafka.serializers.KafkaAvroSerializer");
props.put("schema.registry.url", "http://localhost:8081");

KafkaProducer<String, GenericRecord> producer = new KafkaProducer<>(props);

// Avro schema
String schemaStr = "{\\"type\\":\\"record\\",\\"name\\":\\"Order\\",\\"fields\\":" +
  "[{\\"name\\":\\"orderId\\",\\"type\\":\\"string\\"}," +
  "{\\"name\\":\\"amount\\",\\"type\\":\\"double\\"}]}";
Schema.Parser parser = new Schema.Parser();
Schema schema = parser.parse(schemaStr);

GenericRecord order = new GenericData.Record(schema);
order.put("orderId", "ORD-12345");
order.put("amount", 299.99);

producer.send(new ProducerRecord<>("orders", "key-1", order));
producer.close();`,
      takeaways: [
        'Serialization converts in-memory objects to bytes; deserialization converts them back',
        'Kafka stores raw bytes — it doesn\'t validate or understand the data format',
        'JSON is human-readable but verbose; Avro/Protobuf are compact and schema-aware',
        'Avro with Schema Registry is the most common production setup for Kafka',
      ],
    });
  }

  function getLesson10() {
    return buildLessonHtml({
      objectives: [
        'Define consumer groups and explain how they share partition assignments',
        'Describe offset storage in the __consumer_offsets internal topic',
        'Implement manual offset commits and understand when to use them',
      ],
      body: `
        <p><strong>Consumer groups</strong> enable horizontal scaling of consumers. Each consumer in a group is assigned a subset of partitions to read from.</p>

        <h4>How Consumer Groups Work</h4>
        <p>When a consumer subscribes with a <code>group.id</code>, it joins a group. The group coordinator (one of the brokers) assigns partitions to group members using a partition assignment strategy.</p>

        <ul>
          <li>Each partition is consumed by exactly <strong>one</strong> consumer in the group</li>
          <li>If there are more consumers than partitions, some consumers are idle</li>
          <li>If there are more partitions than consumers, each consumer reads multiple partitions</li>
        </ul>

        <h4>Offset Storage</h4>
        <p>Consumer offsets are stored in the <code>__consumer_offsets</code> internal topic. This topic is compacted, so only the latest offset for each group-partition is retained.</p>

        <h4>Commit Strategies</h4>
        <ul>
          <li><strong>Auto-commit:</strong> Offsets committed periodically (<code>enable.auto.commit=true</code>). Simple but may cause duplicates on crash.</li>
          <li><strong>Manual sync commit:</strong> <code>commitSync()</code> blocks until the commit succeeds. Reliable but slower.</li>
          <li><strong>Manual async commit:</strong> <code>commitAsync()</code> non-blocking. Faster but may lose commits on shutdown.</li>
        </ul>
      `,
      code: `// Consumer with manual async commit + callback
props.put("group.id", "order-processor");
props.put("enable.auto.commit", "false");

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(Arrays.asList("orders"));

try {
  while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
      process(record);  // Your business logic
    }
    consumer.commitAsync((offsets, exception) -> {
      if (exception != null) {
        System.err.println("Commit failed for offsets: " + offsets);
      }
    });
  }
} finally {
  try { consumer.commitSync(); } finally { consumer.close(); }
}`,
      takeaways: [
        'Consumer groups enable horizontal scaling: partitions are split across group members',
        'Each consumer reads from a unique subset of partitions; no two read the same data',
        'Offsets are stored in the __consumer_offsets internal topic (not in ZooKeeper)',
        'Manual offset commits give fine-grained control over exactly-once processing semantics',
      ],
    });
  }

  function getLesson11() {
    return buildLessonHtml({
      objectives: [
        'Explain consumer group rebalancing and why it is necessary',
        'Compare eager (stop-the-world) vs. cooperative (incremental) rebalancing',
        'Minimize rebalance impact with static group membership',
      ],
      body: `
        <p><strong>Rebalancing</strong> is the process of reassigning partitions among consumers when a consumer joins or leaves a group. It ensures work is evenly distributed.</p>

        <h4>Eager Rebalancing (Stop-the-World)</h4>
        <p>The original rebalance protocol:</p>
        <ol>
          <li>All consumers in the group revoke ALL their partitions</li>
          <li>Processing stops for ALL consumers</li>
          <li>The coordinator reassigns partitions from scratch</li>
          <li>Consumers receive their new assignment and resume</li>
        </ol>
        <p>Problem: during rebalance, <strong>no data is processed</strong>. With large consumer groups, this can take seconds or minutes.</p>

        <h4>Cooperative Rebalancing (Incremental)</h4>
        <p>Introduced in Kafka 2.4, cooperative rebalancing only revokes partitions that need to move:</p>
        <ol>
          <li>Only the partitions that must be reassigned are revoked</li>
          <li>Remaining consumers continue processing uninterrupted</li>
          <li>Multiple rebalance rounds may be needed to reach steady state</li>
        </ol>
        <p>Benefit: <strong>no global pause</strong>. Only the moving partitions experience downtime.</p>

        <h4>Static Group Membership</h4>
        <p>With static group membership (Kafka 2.3+), a consumer that disconnects temporarily (e.g., for a GC pause) keeps its partition assignment for up to <code>session.timeout.ms</code>. This prevents unnecessary rebalances.</p>
      `,
      code: `# Consumer configuration for cooperative rebalancing
# In consumer.properties:
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
session.timeout.ms=45000
heartbeat.interval.ms=15000
max.poll.interval.ms=300000

# For static group membership (Kafka 2.3+):
# Add group.instance.id to consumer config:
props.put("group.instance.id", "consumer-1");`,
      takeaways: [
        'Eager rebalancing revokes ALL partitions from all consumers (stop-the-world pause)',
        'Cooperative rebalancing only revokes partitions that need to move (no global pause)',
        'Kafka 3.1+ defaults to cooperative rebalancing for better large-group performance',
        'Static group membership prevents unnecessary rebalances on temporary disconnects',
      ],
    });
  }

  function getLesson12() {
    return buildLessonHtml({
      objectives: [
        'Describe the Kafka Connect framework and its worker-based architecture',
        'Explain connectors, tasks, workers, and converters',
        'Deploy and configure a Kafka Connect cluster',
      ],
      body: `
        <p><strong>Kafka Connect</strong> is a framework for streaming data between Kafka and external systems. It provides a scalable, fault-tolerant way to integrate without writing custom code.</p>

        <h4>Architecture</h4>
        <ul>
          <li><strong>Workers:</strong> Processes that run connectors and tasks. Workers form a cluster and distribute work among themselves.</li>
          <li><strong>Connectors:</strong> Define which data source/sink to connect to and how to transfer data.</li>
          <li><strong>Tasks:</strong> The actual work units that move data. Tasks provide parallelism within a connector.</li>
          <li><strong>Converters:</strong> Handle serialization/deserialization between Kafka and external formats.</li>
        </ul>

        <h4>Single Message Transforms (SMTs)</h4>
        <p>SMTs allow lightweight data transformation without custom code. Examples:</p>
        <ul>
          <li><code>InsertField</code> — Add metadata fields to messages</li>
          <li><code>MaskField</code> — Mask sensitive data (e.g., credit card numbers)</li>
          <li><code>ReplaceField</code> — Rename, whitelist, or blacklist fields</li>
          <li><code>TimestampConverter</code> — Convert timestamp formats</li>
        </ul>
      `,
      code: `# Kafka Connect worker configuration (connect-standalone.properties)
bootstrap.servers=localhost:9092
key.converter=org.apache.kafka.connect.json.JsonConverter
value.converter=org.apache.kafka.connect.json.JsonConverter
key.converter.schemas.enable=true
value.converter.schemas.enable=true
offset.storage.file.filename=/tmp/connect.offsets
plugin.path=/usr/share/java,/etc/kafka-connect/jars

# Deploy a connector via REST API
POST /connectors HTTP/1.1
Content-Type: application/json

{
  "name": "file-source-connector",
  "config": {
    "connector.class": "FileStreamSourceConnector",
    "file": "/var/log/app.log",
    "topic": "app-logs",
    "tasks.max": "1"
  }
}`,
      takeaways: [
        'Kafka Connect is a framework for streaming data between Kafka and external systems',
        'It runs as a separate cluster of worker processes that execute connector tasks',
        'Connectors use tasks for parallelism; more tasks = faster data movement',
        'Single Message Transforms (SMTs) allow lightweight data transformation without custom code',
      ],
    });
  }

  function getLesson13() {
    return buildLessonHtml({
      objectives: [
        'Differentiate source connectors (import) from sink connectors (export)',
        'Configure and deploy JDBC Source, S3 Sink, Elasticsearch Sink, and Debezium CDC',
        'Choose the right connector for a given integration scenario',
      ],
      body: `
        <p>Kafka Connect has two types of connectors: <strong>source</strong> (import into Kafka) and <strong>sink</strong> (export from Kafka).</p>

        <h4>Source Connectors</h4>
        <p>Source connectors pull data from external systems and produce events to Kafka topics.</p>
        <ul>
          <li><strong>JDBC Source Connector:</strong> Polls a SQL database and streams table changes to Kafka</li>
          <li><strong>Debezium CDC Connector:</strong> Reads database transaction logs for Change Data Capture</li>
          <li><strong>File Source:</strong> Reads lines from a file and sends to Kafka</li>
          <li><strong>MQTT Source:</strong> Bridges MQTT IoT data into Kafka</li>
        </ul>

        <h4>Sink Connectors</h4>
        <p>Sink connectors consume events from Kafka topics and push them to external systems.</p>
        <ul>
          <li><strong>S3 Sink Connector:</strong> Writes Kafka data to Amazon S3 as Parquet/JSON files</li>
          <li><strong>Elasticsearch Sink:</strong> Indexes Kafka data into Elasticsearch for search</li>
          <li><strong>Redis Sink:</strong> Pushes data to Redis for caching and real-time lookups</li>
          <li><strong>JDBC Sink:</strong> Writes Kafka data to a relational database</li>
        </ul>

        <h4>Debezium CDC Deep Dive</h4>
        <p>Debezium is a distributed Change Data Capture platform built on Kafka Connect. It reads database transaction logs (binlog for MySQL, WAL for PostgreSQL, etc.) to capture row-level changes without polling or custom triggers.</p>
        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200 my-4">
          <p class="text-sm">Debezium captures: <strong>INSERT</strong>, <strong>UPDATE</strong>, <strong>DELETE</strong> — and emits each as a structured event with the before/after state of the row.</p>
        </div>
      `,
      code: `// Debezium PostgreSQL Source Connector config
POST /connectors HTTP/1.1
Content-Type: application/json

{
  "name": "pg-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgres.example.com",
    "database.port": "5432",
    "database.user": "debezium",
    "database.password": "secret",
    "database.dbname": "orderdb",
    "topic.prefix": "pg",
    "table.include.list": "public.orders,public.customers",
    "tasks.max": "1"
  }
}

// S3 Sink Connector config
{
  "name": "s3-sink",
  "config": {
    "connector.class": "io.confluent.connect.s3.S3SinkConnector",
    "s3.bucket.name": "my-kafka-data-lake",
    "s3.region": "us-east-1",
    "topics": "orders",
    "format.class": "io.confluent.connect.s3.format.json.JsonFormat",
    "tasks.max": "3"
  }
}`,
      takeaways: [
        'Source connectors bring data into Kafka from external systems (databases, logs, APIs)',
        'Sink connectors push data from Kafka to external systems (S3, Elasticsearch, Redis)',
        'Debezium CDC reads database transaction logs for complete change data capture',
        'The connector ecosystem has hundreds of pre-built connectors for common systems',
      ],
    });
  }

  function getLesson14() {
    return buildLessonHtml({
      objectives: [
        'Explain why schema management is critical in event-driven systems',
        'Describe Schema Registry architecture and its compatibility modes',
        'Implement schema evolution safely (backward, forward, full compatibility)',
      ],
      body: `
        <p><strong>Schema Registry</strong> provides a central repository for managing and validating event schemas. It ensures producers and consumers agree on the data structure.</p>

        <h4>Why Schema Management?</h4>
        <p>Without schema management, a producer could change the event format, silently breaking consumers. Schema Registry prevents this by enforcing compatibility rules.</p>

        <h4>How Schema Registry Works</h4>
        <ol>
          <li>A producer registers a schema with the registry and gets a schema ID</li>
          <li>Events sent to Kafka include the schema ID instead of the full schema</li>
          <li>Consumers read the schema ID and fetch the schema from the registry</li>
          <li>If a producer tries to register an incompatible schema, the registry rejects it</li>
        </ol>

        <h4>Compatibility Modes</h4>
        <table class="min-w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Mode</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Description</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Use Case</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2"><strong>BACKWARD</strong></td>
              <td class="border border-gray-300 px-4 py-2">New schema can read old data</td>
              <td class="border border-gray-300 px-4 py-2">Default for production</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2"><strong>FORWARD</strong></td>
              <td class="border border-gray-300 px-4 py-2">Old schema can read new data</td>
              <td class="border border-gray-300 px-4 py-2">Consumer-first deployments</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2"><strong>FULL</strong></td>
              <td class="border border-gray-300 px-4 py-2">Both backward and forward</td>
              <td class="border border-gray-300 px-4 py-2">Development environments</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2"><strong>NONE</strong></td>
              <td class="border border-gray-300 px-4 py-2">No compatibility checks</td>
              <td class="border border-gray-300 px-4 py-2">Testing only</td>
            </tr>
          </tbody>
        </table>
      `,
      code: `# Schema Registry REST API
# Register a new schema
POST /subjects/orders-value/versions
Content-Type: application/vnd.schemaregistry.v1+json

{
  "schema": "{\\"type\\":\\"record\\",\\"name\\":\\"Order\\",\\"fields\\":[{\\"name\\":\\"orderId\\",\\"type\\":\\"string\\"},{\\"name\\":\\"amount\\",\\"type\\":\\"double\\"}]}"
}

# Check compatibility
POST /compatibility/subjects/orders-value/versions/latest
{
  "schema": "{\\"type\\":\\"record\\",\\"name\\":\\"Order\\",\\"fields\\":[{\\"name\\":\\"orderId\\",\\"type\\":\\"string\\"},{\\"name\\":\\"amount\\",\\"type\\":\\"double\\"},{\\"name\\":\\"status\\",\\"type\\":\\"string\\",\\"default\\":\\"pending\\"}]}"
}`,
      takeaways: [
        'Schema Registry provides a central repository for Avro/Protobuf/JSON schemas',
        'Each event carries a schema ID; consumers retrieve the schema from the registry',
        'Backward compatibility: new schema can read data written with old schema',
        'Forward compatibility: old schema can read data written with new schema',
      ],
    });
  }

  function getLesson15() {
    return buildLessonHtml({
      objectives: [
        'Write Avro schemas and generate Java/Python classes from them',
        'Configure Kafka clients with Avro serializer/deserializer and Schema Registry',
        'Handle schema compatibility in production deployments',
      ],
      body: `
        <p><strong>Avro</strong> is a compact binary serialization format with a JSON-based schema definition language (IDL). It's the most popular format for production Kafka deployments.</p>

        <h4>Avro Schemas</h4>
        <p>Avro schemas are written in JSON. They define the record name, namespace, and fields with types:</p>
        <pre>{
  "type": "record",
  "namespace": "com.example",
  "name": "OrderCreated",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "userId", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "items", "type": {"type": "array", "items": "string"}},
    {"name": "discount", "type": ["null", "double"], "default": null}
  ]
}</pre>

        <h4>Schema Evolution with Avro</h4>
        <p>Avro supports rich schema evolution rules:</p>
        <ul>
          <li><strong>Adding a field:</strong> Must have a default value for backward compatibility</li>
          <li><strong>Removing a field:</strong> Allowed with forward compatibility (old consumers ignore unknown fields)</li>
          <li><strong>Changing a type:</strong> Limited; you can widen types (int → long) but not narrow them</li>
          <li><strong>Renaming a field:</strong> Use aliases to maintain compatibility</li>
        </ul>

        <h4>Production Tips</h4>
        <ul>
          <li>Use <strong>FULL</strong> compatibility in development to catch issues early</li>
          <li>Switch to <strong>BACKWARD</strong> in production for safety</li>
          <li>Always provide defaults for new fields</li>
          <li>Never delete a field without ensuring no consumers depend on it</li>
        </ul>
      `,
      code: `// Java: Avro SerDes with Schema Registry
// Producer config
props.put("value.serializer", "io.confluent.kafka.serializers.KafkaAvroSerializer");
props.put("schema.registry.url", "http://localhost:8081");
props.put("auto.register.schemas", "true");

// Consumer config
props.put("value.deserializer", "io.confluent.kafka.serializers.KafkaAvroDeserializer");
props.put("schema.registry.url", "http://localhost:8081");
props.put("specific.avro.reader", "true");

// Python: Confluent Kafka Avro
from confluent_kafka.avro import AvroProducer
from confluent_kafka import avro

value_schema = avro.loads('''{
  "type": "record",
  "name": "Order",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "amount", "type": "double"}
  ]
}''')

producer = AvroProducer({
  'bootstrap.servers': 'localhost:9092',
  'schema.registry.url': 'http://localhost:8081'
}, default_value_schema=value_schema)

producer.produce(topic='orders', value={'orderId': 'ORD-123', 'amount': 99.99})
producer.flush()`,
      takeaways: [
        'Avro is a compact binary format with a JSON-based schema definition',
        'Avro schemas are self-describing when embedded; with Schema Registry, only the ID is sent',
        'Required fields must have defaults for backward-compatible schema evolution',
        'Use FULL compatibility in development; use BACKWARD in production for safety',
      ],
    });
  }

  function getLesson16() {
    return buildLessonHtml({
      objectives: [
        'Explain stream processing and how Kafka Streams differs from consumer-based processing',
        'Describe Kafka Streams architecture: topology, processors, state stores',
        'Set up a basic Kafka Streams application',
      ],
      body: `
        <p><strong>Kafka Streams</strong> is a client library for building real-time stream processing applications on top of Kafka. Unlike simple consumers, Kafka Streams provides rich processing capabilities with exactly-once semantics.</p>

        <h4>Key Features</h4>
        <ul>
          <li><strong>No separate cluster:</strong> Runs inside your application JVM</li>
          <li><strong>Exactly-once semantics:</strong> Built-in, no duplicate processing</li>
          <li><strong>Stateful processing:</strong> RocksDB for local state; changelog topics for fault tolerance</li>
          <li><strong>One-record-at-a-time:</strong> Processes each event as it arrives (no micro-batching)</li>
          <li><strong>Exactly-once semantics</strong>
        </li></ul>

        <h4>Topology</h4>
        <p>A Kafka Streams application is defined as a <strong>topology</strong> — a DAG (Directed Acyclic Graph) of processor nodes connected by streams. Each processor performs a specific operation (filter, map, aggregate, join).</p>
      `,
      code: `// Simple Kafka Streams application (Word Count)
Properties props = new Properties();
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "wordcount-app");
props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

StreamsBuilder builder = new StreamsBuilder();
KStream<String, String> textLines = builder.stream("text-input");

KTable<String, Long> wordCounts = textLines
  .flatMapValues(line -> Arrays.asList(line.toLowerCase().split("\\\\W+")))
  .groupBy((key, word) -> word)
  .count();

wordCounts.toStream().to("word-count-output", Produced.with(Serdes.String(), Serdes.Long()));

KafkaStreams streams = new KafkaStreams(builder.build(), props);
streams.start();

// Add shutdown hook
Runtime.getRuntime().addShutdownHook(new Thread(streams::close));`,
      takeaways: [
        'Kafka Streams is a Java library for building real-time stream processing applications',
        'No separate processing cluster needed — runs inside your application JVM',
        'Built-in exactly-once semantics, stateful processing with RocksDB, and fault tolerance',
        'A stream application is a topology of interconnected processor nodes',
      ],
    });
  }

  function getLesson17() {
    return buildLessonHtml({
      objectives: [
        'Use the Streams DSL (filter, map, groupBy, aggregate, join) for common operations',
        'Implement custom logic via the lower-level Processor API',
        'Choose between DSL and Processor API based on application requirements',
      ],
      body: `
        <p>Kafka Streams offers two API levels: the high-level <strong>Streams DSL</strong> and the lower-level <strong>Processor API</strong>.</p>

        <h4>Streams DSL</h4>
        <p>The DSL provides high-level abstractions:</p>
        <ul>
          <li><strong>KStream:</strong> A partitioned, replayable stream of events</li>
          <li><strong>KTable:</strong> A changelog stream where each key represents the latest value (like a table)</li>
          <li><strong>GlobalKTable:</strong> A fully replicated table (available on all instances)</li>
        </ul>

        <p>Common DSL operations:</p>
        <ul>
          <li><code>filter</code> — Keep only records matching a predicate</li>
          <li><code>map</code> / <code>mapValues</code> — Transform records</li>
          <li><code>flatMap</code> / <code>flatMapValues</code> — One record → zero or more records</li>
          <li><code>groupBy</code> / <code>groupByKey</code> — Group for aggregation</li>
          <li><code>reduce</code> / <code>aggregate</code> — Rolling aggregations</li>
          <li><code>join</code> — Stream-stream, stream-table, table-table joins</li>
        </ul>

        <h4>Processor API</h4>
        <p>For custom logic that the DSL cannot express, implement the <code>Processor</code> interface. You get access to a <code>ProcessorContext</code> with state stores, punctuation scheduling, and forwarding to downstream processors.</p>
      `,
      code: `// Streams DSL example: enrich orders with user data
KStream<String, Order> orders = builder.stream("orders");
KTable<String, User> users = builder.table("users");  // Compacted topic

KStream<String, EnrichedOrder> enriched = orders
  .join(users,
    (order, user) -> new EnrichedOrder(order, user),
    Joined.with(Serdes.String(), orderSerde, userSerde));

enriched.to("enriched-orders");

// Processor API example: custom processor
class MyProcessor implements Processor<String, String, String, String> {
  private StateStore stateStore;

  @Override
  public void init(ProcessorContext<String, String> context) {
    this.stateStore = context.getStateStore("my-state");
    context.schedule(Duration.ofMinutes(1), PunctuationType.WALL_CLOCK_TIME,
      timestamp -> context.forward(timestamp.toString(), "punctuation!"));
  }

  @Override
  public void process(Record<String, String> record) {
    stateStore.put(record.key(), record.value());
    context().forward(record.withValue(record.value().toUpperCase()));
  }
}

Topology topology = new Topology();
topology.addSource("Source", "input-topic");
topology.addProcessor("MyProcessor", MyProcessor::new, "Source");
topology.addStateStore(Stores.keyValueStore(Stores.inMemoryKeyValueStore("my-state")), "MyProcessor");
topology.addSink("Sink", "output-topic", "MyProcessor");`,
      takeaways: [
        'Streams DSL provides high-level abstractions: KStream, KTable, GlobalKTable',
        'Common operations: filter, map, flatMap, groupBy, reduce, aggregate, join',
        'Processor API gives full control: implement Processor interface with custom state stores',
        'Most apps start with DSL; drop to Processor API only for fine-grained control needs',
      ],
    });
  }

  function getLesson18() {
    return buildLessonHtml({
      objectives: [
        'Use SQL-like syntax to create streams and tables from Kafka topics',
        'Implement filtering, aggregation, and joins using KSQL',
        'Determine when to use KSQL vs. Kafka Streams DSL vs. Processor API',
      ],
      body: `
        <p><strong>KSQL</strong> (now ksqlDB) provides a SQL interface for stream processing. If you know SQL, you can start processing Kafka streams immediately without writing Java code.</p>

        <h4>Streams vs. Tables in KSQL</h4>
        <ul>
          <li><strong>STREAM:</strong> An unbounded sequence of events. Records are immutable and new records are always appended. Represents the present — events flowing through the system.</li>
          <li><strong>TABLE:</strong> A mutable, upsertable view of the latest value for each key. Represents the current state of the world.</li>
        </ul>

        <h4>Query Types</h4>
        <ul>
          <li><strong>Push queries</strong> (<code>EMIT CHANGES</code>): Continuous queries that push results as new data arrives. Used for real-time dashboards and alerting.</li>
          <li><strong>Pull queries</strong>: Point-in-time lookups of current state. Used for request-response patterns (like querying a traditional database).</li>
        </ul>

        <h4>When to Use What</h4>
        <table class="min-w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Tool</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Best For</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Skill Level</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">KSQL / ksqlDB</td>
              <td class="border border-gray-300 px-4 py-2">Simple filtering, aggregation, transformation</td>
              <td class="border border-gray-300 px-4 py-2">SQL knowledge</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Kafka Streams DSL</td>
              <td class="border border-gray-300 px-4 py-2">Complex event processing, stateful operations</td>
              <td class="border border-gray-300 px-4 py-2">Java/Scala</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Processor API</td>
              <td class="border border-gray-300 px-4 py-2">Custom scheduling, fine-grained state control</td>
              <td class="border border-gray-300 px-4 py-2">Advanced Java</td>
            </tr>
          </tbody>
        </table>
      `,
      code: `-- KSQL: Create streams from Kafka topics
CREATE STREAM orders (order_id INTEGER, amount DOUBLE, user_id STRING)
  WITH (KAFKA_TOPIC='orders', VALUE_FORMAT='AVRO');

-- Continuous filter query
CREATE STREAM large_orders AS
  SELECT * FROM orders WHERE amount > 1000
  EMIT CHANGES;

-- Tumbling window aggregation (1-hour windows)
SELECT user_id, COUNT(*) AS order_count, SUM(amount) AS total_spent
  FROM orders
  WINDOW TUMBLING (SIZE 1 HOUR)
  GROUP BY user_id
  EMIT CHANGES;

-- Stream-table join (enrich orders with user info)
CREATE TABLE users (user_id STRING PRIMARY KEY, name STRING, email STRING)
  WITH (KAFKA_TOPIC='users', VALUE_FORMAT='AVRO');

CREATE STREAM enriched_orders AS
  SELECT o.order_id, o.amount, u.name, u.email
  FROM orders o
  JOIN users u ON o.user_id = u.user_id
  EMIT CHANGES;`,
      takeaways: [
        'KSQL/ksqlDB provides SQL-based stream processing accessible to non-Java developers',
        'Supports streaming queries (EMIT CHANGES) and pull queries (current state lookup)',
        'Best for simple filtering, transformation, and windowed aggregations',
        'Complex stateful logic is better served by Kafka Streams DSL or Processor API',
      ],
    });
  }

  function getLesson19() {
    return buildLessonHtml({
      objectives: [
        'Differentiate at-most-once, at-least-once, and exactly-once delivery semantics',
        'Identify the trade-offs between performance, reliability, and resource usage',
        'Choose the appropriate semantic for a given use case',
      ],
      body: `
        <p><strong>Delivery semantics</strong> define how Kafka handles message delivery guarantees. Three levels exist, each with different trade-offs.</p>

        <h4>At-Most-Once</h4>
        <p>Messages may be lost but are never redelivered.</p>
        <ul>
          <li><strong>How:</strong> Producer sends without waiting for ack (acks=0); consumer commits offset before processing</li>
          <li><strong>Pros:</strong> Lowest latency, highest throughput</li>
          <li><strong>Cons:</strong> Data loss is possible</li>
          <li><strong>Use cases:</strong> Non-critical metrics, telemetry, logging where occasional loss is acceptable</li>
        </ul>

        <h4>At-Least-Once (Default)</h4>
        <p>Messages are never lost but may be duplicated.</p>
        <ul>
          <li><strong>How:</strong> Producer waits for ack (acks=1 or all), retries on failure; consumer commits after processing</li>
          <li><strong>Pros:</strong> No data loss, reasonable performance</li>
          <li><strong>Cons:</strong> Duplicates possible due to retries</li>
          <li><strong>Use cases:</strong> Most applications — the default choice</li>
        </ul>

        <h4>Exactly-Once</h4>
        <p>Messages are delivered exactly once — no loss, no duplicates.</p>
        <ul>
          <li><strong>How:</strong> Idempotent producers + Kafka transactions; consumer uses transactional API</li>
          <li><strong>Pros:</strong> Strongest guarantee</li>
          <li><strong>Cons:</strong> Higher latency, more complex configuration</li>
          <li><strong>Use cases:</strong> Financial transactions, billing, inventory management</li>
        </ul>
      `,
      code: `// At-most-once producer (fire and forget)
props.put("acks", "0");
props.put("enable.idempotence", "false");
producer.send(new ProducerRecord<>("topic", "value")); // No callback, no retries

// At-least-once producer (default)
props.put("acks", "all");
props.put("enable.idempotence", "true"); // Prevents duplicates from retries
props.put("retries", Integer.MAX_VALUE);

// Exactly-once in Kafka Streams
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);
// This enables:
//   1. Idempotent producer (PID + sequence numbers)
//   2. Transactions (atomic writes to multiple partitions)
//   3. Transactional consumer (read-committed isolation)`,
      takeaways: [
        'At-most-once: fire-and-forget, fastest but messages can be lost',
        'At-least-once: retry on failure, no data loss but may cause duplicate processing',
        'Exactly-once: requires idempotent producers + transactions, zero loss, zero duplicates',
        'Most production systems use at-least-once; exactly-once is needed for financial use cases',
      ],
    });
  }

  function getLesson20() {
    return buildLessonHtml({
      objectives: [
        'Configure idempotent producers to prevent duplicate writes',
        'Explain how producer IDs (PID) and sequence numbers prevent duplicates',
        'Implement Kafka transactions for atomic writes to multiple partitions',
      ],
      body: `
        <p><strong>Idempotent producers</strong> and <strong>Kafka transactions</strong> provide the foundation for exactly-once semantics.</p>

        <h4>Idempotent Producers</h4>
        <p>When <code>enable.idempotence=true</code>, the producer assigns a unique <strong>Producer ID (PID)</strong> and a monotonically increasing <strong>sequence number</strong> to each message. The broker tracks the highest sequence number received for each PID and partition. If it receives a message with a lower or equal sequence number, it rejects it as a duplicate.</p>

        <div class="bg-green-50 rounded-lg p-4 border border-green-200 my-4">
          <p class="text-sm"><strong>How it prevents duplicates:</strong> If a broker acknowledges a write but the ack is lost, the producer retries. The broker sees the same PID + sequence number and knows it already committed the message. It acknowledges the retry without writing a duplicate.</p>
        </div>

        <h4>Kafka Transactions</h4>
        <p>Transactions extend idempotency to support <strong>atomic writes across multiple partitions</strong>. A transaction can include writes to several partitions across different topics. Either all writes are visible (committed) or none are (aborted).</p>

        <h4>read_committed vs. read_uncommitted</h4>
        <p>Consumers can choose isolation level:</p>
        <ul>
          <li><strong>read_committed:</strong> Only reads committed transactions. Aborted messages are skipped.</li>
          <li><strong>read_uncommitted:</strong> Reads all messages including uncommitted and aborted. Not recommended.</li>
        </ul>
      `,
      code: `// Idempotent producer configuration
Properties props = new Properties();
props.put("enable.idempotence", "true");
props.put("acks", "all");   // Required when idempotence is true
props.put("max.in.flight.requests.per.connection", "5"); // Can be >1 with idempotence
props.put("retries", Integer.MAX_VALUE);

// Producer with transactions
props.put("transactional.id", "my-transactional-producer");
KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.initTransactions();  // Get a PID

try {
  producer.beginTransaction();
  producer.send(new ProducerRecord<>("topic1", "key", "value1"));
  producer.send(new ProducerRecord<>("topic2", "key", "value2"));
  producer.commitTransaction();
} catch (Exception e) {
  producer.abortTransaction();
}

// Consumer with read_committed isolation
props.put("isolation.level", "read_committed");
// This consumer will only see committed messages`,
      takeaways: [
        'Idempotent producers use producer ID + sequence number to detect and discard duplicates',
        'Enable with enable.idempotence=true in producer configuration',
        'Kafka transactions enable atomic multi-partition writes (all or nothing)',
        'Exactly-once semantics in Kafka Streams builds on idempotent producers + transactions',
      ],
    });
  }

  function getLesson21() {
    return buildLessonHtml({
      objectives: [
        'Categorize error types: deserialization, processing, connectivity, transient, fatal',
        'Implement retry strategies with exponential backoff and retry topics',
        'Avoid poison pill messages and consumer stuck scenarios',
      ],
      body: `
        <p>Errors are inevitable in any distributed system. Kafka provides patterns for handling them gracefully.</p>

        <h4>Error Classification</h4>
        <table class="min-w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Error Type</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Example</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Strategy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Deserialization</td>
              <td class="border border-gray-300 px-4 py-2">Corrupt message, mismatched schema</td>
              <td class="border border-gray-300 px-4 py-2">DLQ immediately (will never succeed)</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Processing</td>
              <td class="border border-gray-300 px-4 py-2">Null pointer, business rule violation</td>
              <td class="border border-gray-300 px-4 py-2">Retry with backoff, then DLQ</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Transient</td>
              <td class="border border-gray-300 px-4 py-2">Downstream timeout, DB deadlock</td>
              <td class="border border-gray-300 px-4 py-2">Retry with exponential backoff</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">Fatal</td>
              <td class="border border-gray-300 px-4 py-2">Invalid state, corrupt business data</td>
              <td class="border border-gray-300 px-4 py-2">DLQ immediately; alert operator</td>
            </tr>
          </tbody>
        </table>

        <h4>Retry Strategies</h4>
        <ul>
          <li><strong>Immediate retry:</strong> Simple but can overwhelm downstream systems</li>
          <li><strong>Exponential backoff:</strong> Wait 1s, 2s, 4s, 8s... between retries. Prevents thundering herd.</li>
          <li><strong>Retry topics:</strong> Send failed messages to a retry topic with scheduled delivery. Keeps the main pipeline flowing.</li>
        </ul>

        <h4>Poison Pills</h4>
        <p>A <strong>poison pill</strong> is a message that consistently causes processing errors. Without a DLQ, it blocks the consumer — the consumer retries, fails, retries, fails, in an infinite loop. Always use DLQs to quarantine poison pills.</p>
      `,
      code: `// Consumer error handling with DLQ
try {
  ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
  for (ConsumerRecord<String, String> record : records) {
    try {
      processRecord(record);
    } catch (DeserializationException | FatalError e) {
      // Send to DLQ immediately
      sendToDlq(record, e);
      continue; // Process next record
    } catch (TransientException e) {
      // Will be retried on next poll
      throw e;
    }
  }
  consumer.commitSync();
} catch (Exception e) {
  // Backoff before retrying
  Thread.sleep(calculateBackoff(retryCount++));
}`,
      takeaways: [
        'Errors: deserialization (bad data), processing (code errors), connectivity (network), transient (retryable), fatal (never succeeds)',
        'Use exponential backoff for transient errors; separate retry topics with delays for async retries',
        'Poison pill messages cause infinite errors — use DLQs to quarantine them',
        'Always distinguish transient from fatal errors to avoid infinite retry loops',
      ],
    });
  }

  function getLesson22() {
    return buildLessonHtml({
      objectives: [
        'Design and implement a dead letter queue (DLQ) for failed messages',
        'Enrich DLQ messages with metadata (error cause, original offset, timestamp)',
        'Build monitoring and alerting for DLQ topics',
      ],
      body: `
        <p>A <strong>Dead Letter Queue (DLQ)</strong> is a special topic that stores messages that could not be processed after all retry attempts are exhausted.</p>

        <h4>DLQ Message Structure</h4>
        <p>A DLQ message typically includes:</p>
        <ul>
          <li>The original message payload (key and value)</li>
          <li>Error message and stack trace</li>
          <li>Source topic, partition, and offset</li>
          <li>Timestamp of when the failure occurred</li>
          <li>Number of retry attempts</li>
          <li>Consumer group ID that failed to process it</li>
        </ul>

        <h4>DLQ Design Patterns</h4>
        <ul>
          <li><strong>Per-source-topic DLQ:</strong> One DLQ per source topic (e.g., <code>orders-dlq</code>)</li>
          <li><strong>Shared DLQ:</strong> One DLQ for all topics, with source topic as a discriminator field</li>
          <li><strong>Partitioned DLQ:</strong> Same partition count as the source topic for ordered replay</li>
        </ul>

        <h4>Monitoring</h4>
        <p>A DLQ should <strong>never</strong> be ignored. Set up monitoring and alerting:</p>
        <ul>
          <li>Alert when a DLQ receives new messages</li>
          <li>Track DLQ message count over time (spike detection)</li>
          <li>Build a replay tool to reprocess messages from the DLQ after fixing the root cause</li>
          <li>Set retention policies (e.g., 30 days) and consider archival to object storage</li>
        </ul>
      `,
      code: `// DLQ producer function (conceptual)
void sendToDlq(ConsumerRecord<String, String> record, Exception e, String dlqTopic) {
  DlqMessage dlqMsg = new DlqMessage();
  dlqMsg.setOriginalKey(record.key());
  dlqMsg.setOriginalValue(record.value());
  dlqMsg.setOriginalTopic(record.topic());
  dlqMsg.setOriginalPartition(record.partition());
  dlqMsg.setOriginalOffset(record.offset());
  dlqMsg.setErrorMessage(e.getMessage());
  dlqMsg.setErrorTimestamp(System.currentTimeMillis());
  dlqMsg.setRetryCount(record.headers()
    .lastHeader("retry-count") != null ?
    Integer.parseInt(new String(
      record.headers().lastHeader("retry-count").value())) + 1 : 1);

  dlqProducer.send(new ProducerRecord<>(dlqTopic, dlqMsg));
  dlqProducer.flush();
}

// Kafka Connect DLQ configuration (Sink connector)
{
  "name": "jdbc-sink",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
    "errors.tolerance": "all",   // Don't stop on errors
    "errors.deadletterqueue.topic.name": "jdbc-sink-dlq",
    "errors.deadletterqueue.context.headers.enable": "true",
    "errors.log.enable": "true",
    "errors.log.include.messages": "true"
  }
}`,
      takeaways: [
        'DLQ = separate Kafka topic where failed messages are stored with error metadata',
        'Include original message, error reason, source topic/partition/offset in each DLQ message',
        'Set retention policies on DLQ topics (e.g., 30 days) to prevent infinite storage growth',
        'Monitor DLQ metrics and alert when messages appear; build replay tools for reprocessing',
      ],
    });
  }

  function getLesson23() {
    return buildLessonHtml({
      objectives: [
        'Explain encryption in transit and why it matters for Kafka',
        'Configure SSL/TLS on Kafka brokers and clients',
        'Set up mutual TLS (mTLS) for broker-to-client authentication',
      ],
      body: `
        <p><strong>SSL/TLS</strong> encryption ensures that data flowing between clients and brokers cannot be read or tampered with by unauthorized parties.</p>

        <h4>Why Encrypt Kafka Traffic?</h4>
        <p>Without encryption, anyone with network access to your Kafka cluster can read and modify messages. This is especially critical when:</p>
        <ul>
          <li>Kafka traffic traverses public or untrusted networks</li>
          <li>Messages contain PII, financial data, or other sensitive information</li>
          <li>Compliance standards (PCI-DSS, HIPAA, GDPR) require encryption</li>
        </ul>

        <h4>SSL/TLS Components</h4>
        <ul>
          <li><strong>Keystore:</strong> Contains your own certificate and private key (your identity)</li>
          <li><strong>Truststore:</strong> Contains the CA certificates you trust (who you trust)</li>
          <li><strong>Certificate Authority (CA):</strong> Issues and signs certificates, verifying identity</li>
        </ul>

        <h4>Mutual TLS (mTLS)</h4>
        <p>With mutual TLS, both the broker and the client present certificates. This provides:</p>
        <ul>
          <li><strong>Encryption:</strong> All data is encrypted in transit</li>
          <li><strong>Authentication:</strong> Both sides verify each other's identity</li>
        </ul>
      `,
      code: `# Broker SSL configuration (server.properties)
listeners=SSL://0.0.0.0:9093
ssl.keystore.location=/var/private/ssl/kafka.server.keystore.jks
ssl.keystore.password=keystore_password
ssl.key.password=key_password
ssl.truststore.location=/var/private/ssl/kafka.server.truststore.jks
ssl.truststore.password=truststore_password
ssl.client.auth=required  # Require client certificates (mTLS)
ssl.endpoint.identification.algorithm=https  # Verify hostname

# Client SSL configuration (producer/consumer props)
props.put("security.protocol", "SSL");
props.put("ssl.truststore.location", "/path/to/client.truststore.jks");
props.put("ssl.truststore.password", "truststore_password");

# For mTLS, also provide client certificate
props.put("ssl.keystore.location", "/path/to/client.keystore.jks");
props.put("ssl.keystore.password", "keystore_password");
props.put("ssl.key.password", "key_password");`,
      takeaways: [
        'SSL/TLS encrypts all data in transit between clients and brokers (and between brokers)',
        'Configure keystore (your identity) and truststore (who you trust) on brokers and clients',
        'mTLS provides both encryption AND client authentication via certificates',
        'Production environments should always use SSL encryption for sensitive data',
      ],
    });
  }

  function getLesson24() {
    return buildLessonHtml({
      objectives: [
        'Compare SASL/PLAIN, SASL/SCRAM, SASL/GSSAPI (Kerberos), and SASL/OAUTHBEARER',
        'Configure ACLs for fine-grained topic-level access control',
        'Implement a defense-in-depth security strategy for Kafka',
      ],
      body: `
        <p><strong>Authentication</strong> verifies identity (who you are), while <strong>authorization</strong> controls what you can do. Kafka supports multiple SASL mechanisms and ACL-based authorization.</p>

        <h4>SASL Authentication Mechanisms</h4>
        <table class="min-w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Mechanism</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Security</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Use Case</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-4 py-2">PLAIN</td>
              <td class="border border-gray-300 px-4 py-2">Low (use only with SSL)</td>
              <td class="border border-gray-300 px-4 py-2">Simple username/password</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">SCRAM</td>
              <td class="border border-gray-300 px-4 py-2">High</td>
              <td class="border border-gray-300 px-4 py-2">Password challenge-response (no password in transit)</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">GSSAPI (Kerberos)</td>
              <td class="border border-gray-300 px-4 py-2">Very High</td>
              <td class="border border-gray-300 px-4 py-2">Enterprise environments with Active Directory</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-4 py-2">OAUTHBEARER</td>
              <td class="border border-gray-300 px-4 py-2">High</td>
              <td class="border border-gray-300 px-4 py-2">Cloud-native, token-based auth</td>
            </tr>
          </tbody>
        </table>

        <h4>ACL Authorization</h4>
        <p>Kafka ACLs define <strong>who can do what on which resource</strong>:</p>
        <pre># Grant user alice read access to topic orders
kafka-acls.sh --authorizer-properties zookeeper.connect=localhost:2181 \\
  --add --allow-principal User:alice --operation Read --topic orders

# Grant user bob write access to topic orders
kafka-acls.sh --authorizer-properties zookeeper.connect=localhost:2181 \\
  --add --allow-principal User:bob --operation Write --topic orders

# Allow consumer-group members to read from topic
kafka-acls.sh --add --allow-principal User:consumer-app \\
  --operation Read --topic '*' \\
  --group 'order-processor'</pre>

        <h4>Defense-in-Depth Strategy</h4>
        <ol>
          <li><strong>Network isolation:</strong> Use private networks, security groups, firewalls</li>
          <li><strong>Encryption:</strong> SSL/TLS for data in transit (always)</li>
          <li><strong>Authentication:</strong> SASL/SCRAM or Kerberos for identity verification</li>
          <li><strong>Authorization:</strong> ACLs for fine-grained access control</li>
          <li><strong>Audit logging:</strong> Log all access for compliance and forensics</li>
          <li><strong>Rate limiting:</strong> Prevent abuse and ensure fair resource usage</li>
        </ol>
      `,
      code: `# SASL/SCRAM configuration (server.properties)
listeners=SASL_SSL://0.0.0.0:9093
sasl.mechanism.inter.broker.protocol=SCRAM-SHA-512
sasl.enabled.mechanisms=SCRAM-SHA-512,SCRAM-SHA-256

# Create SCRAM credentials
kafka-configs.sh --bootstrap-server localhost:9093 \\
  --alter --add-config 'SCRAM-SHA-512=[password=alice-secret]' \\
  --entity-type users --entity-name alice

# Client configuration for SASL/SCRAM
props.put("security.protocol", "SASL_SSL");
props.put("sasl.mechanism", "SCRAM-SHA-512");
props.put("sasl.jaas.config",
  "org.apache.kafka.common.security.scram.ScramLoginModule " +
  "required username=\\"alice\\" password=\\"alice-secret\\";");`,
      takeaways: [
        'SASL authentication verifies client identity: PLAIN (simple), SCRAM (secure), GSSAPI (enterprise), OAUTHBEARER (cloud)',
        'ACLs control what authenticated users can do (read, write, create, delete) on specific resources',
        'Defense-in-depth: SSL encryption + SASL authentication + ACL authorization + network policies',
        'Start with SSL (always), add SASL for production, and ACLs for multi-team environments',
      ],
    });
  }

  /* ─── HTML Builder Helper ─── */

  function buildLessonHtml(data) {
    var objectivesHtml = '';
    if (data.objectives && data.objectives.length) {
      objectivesHtml = '<div class="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6">' +
        '<h4 class="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">' +
        '<i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>' +
        '<ul class="list-disc list-inside text-sm text-blue-900 space-y-1">';
      data.objectives.forEach(function (obj) {
        objectivesHtml += '<li>' + escapeHtml(obj) + '</li>';
      });
      objectivesHtml += '</ul></div>';
    }

    var bodyHtml = data.body || '';

    var codeHtml = '';
    if (data.code) {
      codeHtml = '<div class="bg-gray-900 rounded-lg overflow-hidden my-6">' +
        '<div class="bg-gray-800 px-4 py-2 flex items-center justify-between">' +
        '<span class="text-gray-400 text-xs font-mono"><i class="fas fa-code mr-2"></i>Code Example</span>' +
        '</div>' +
        '<pre class="p-4 text-sm text-green-300 overflow-x-auto"><code>' + escapeHtml(data.code) + '</code></pre>' +
        '</div>';
    }

    var takeawaysHtml = '';
    if (data.takeaways && data.takeaways.length) {
      takeawaysHtml = '<div class="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4 mt-6">' +
        '<h4 class="text-sm font-bold text-green-800 uppercase tracking-wider mb-2">' +
        '<i class="fas fa-check-circle mr-2"></i>Key Takeaways</h4>' +
        '<ul class="list-disc list-inside text-sm text-green-900 space-y-1">';
      data.takeaways.forEach(function (t) {
        takeawaysHtml += '<li>' + escapeHtml(t) + '</li>';
      });
      takeawaysHtml += '</ul></div>';
    }

    return objectivesHtml + bodyHtml + codeHtml + takeawaysHtml;
  }

  /* ─── Escape HTML entities ─── */

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ════════════════════════════════════════
     Application State & Runtime
     ════════════════════════════════════════ */

  var currentLessonIndex = 0;
  var activeModuleId = CURRICULUM_MODULES[0].module;
  var completedLessons = [];
  try {
    completedLessons = JSON.parse(localStorage.getItem('kafka-completed')) || [];
  } catch (e) { /* ignore */ }

  /* DOM References */
  var sidebar = document.getElementById('sidebar');
  var sidebarContent = document.getElementById('sidebar-content');
  var lessonTitle = document.getElementById('lesson-title');
  var lessonBody = document.getElementById('lesson-body');
  var prevBtn = document.getElementById('prev-btn');
  var nextBtn = document.getElementById('next-btn');
  var markCompleteBtn = document.getElementById('mark-complete-btn');
  var progressBar = document.getElementById('progress-bar');
  var progressText = document.getElementById('progress-text');
  var tabs = document.querySelectorAll('.tab-btn');
  var tabContents = document.querySelectorAll('.tab-content');

  /* ════════════════════════════════════════
     Initialization
     ════════════════════════════════════════ */

  function init() {
    renderSidebar();
    loadLesson(0);
    updateProgress();
    setupEventListeners();
  }

  /* ════════════════════════════════════════
     Sidebar (Grouped by Module)
     ════════════════════════════════════════ */

  function renderSidebar() {
    var ul = document.createElement('ul');

    CURRICULUM_MODULES.forEach(function (mod) {
      var isActive = mod.module === activeModuleId;

      /* Check if module is complete: all lessons done */
      var allLessonsDone = mod.lessons.every(function (l) {
        return completedLessons.indexOf(l.id) > -1;
      });

      var li = document.createElement('li');
      li.className = 'mb-1';

      var btn = document.createElement('button');
      btn.className = 'sidebar-module-btn' +
        (isActive ? ' active' : '');
      btn.setAttribute('data-module', mod.module);

      var iconHtml = '<i class="fas ' + mod.icon + ' mod-icon"></i>';
      var titleHtml = '<span class="mod-title">Module ' + mod.module + ': ' + mod.moduleTitle + '</span>';
      var checkHtml = allLessonsDone
        ? '<i class="fas fa-check-circle mod-check"></i>'
        : '';

      btn.innerHTML = iconHtml + titleHtml + checkHtml;

      btn.addEventListener('click', function () {
        changeModule(mod.module);
      });

      li.appendChild(btn);
      ul.appendChild(li);
    });

    sidebarContent.innerHTML = '';
    sidebarContent.appendChild(ul);
  }

  function changeModule(moduleId) {
    var mod = CURRICULUM_MODULES.find(function (m) { return m.module === moduleId; });
    if (!mod) return;

    activeModuleId = moduleId;

    /* Find the index of the first lesson in this module */
    var firstLesson = mod.lessons[0];
    var firstIndex = curriculum.indexOf(firstLesson);

    if (firstIndex >= 0) {
      loadLesson(firstIndex);
    }

    /* Close sidebar on mobile */
    if (window.innerWidth < 1024) {
      sidebar.classList.add('-translate-x-full');
      var overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.classList.add('hidden');
    }
  }

  /* ════════════════════════════════════════
     Lesson Loading
     ════════════════════════════════════════ */

  function loadLesson(index) {
    if (index < 0 || index >= curriculum.length) return;
    currentLessonIndex = index;
    var lesson = curriculum[index];

    var currentMod = findModuleByLessonId(lesson.id);
    if (currentMod) {
      activeModuleId = currentMod.module;
    }

    /* Update active module title in header */
    var activeModuleTitleEl = document.getElementById('active-module-title');
    if (activeModuleTitleEl && currentMod) {
      activeModuleTitleEl.textContent = 'Module ' + currentMod.module + ': ' + currentMod.moduleTitle;
    }

    lessonTitle.textContent = lesson.title;

    /* Build the ELI5-wrapped content with fade-in wrapper */
    var simpleContent = '';
    if (window.eli5KafkaData && window.eli5KafkaData[lesson.id]) {
      simpleContent = window.eli5KafkaData[lesson.id];
    }

    var contentHtml = window.eli5Toggle
      ? window.eli5Toggle.wrapContent(lesson.content, simpleContent)
      : lesson.content;

    lessonBody.innerHTML = '<div class="animate-fade-in">' + contentHtml + '</div>';

    if (window.eli5Toggle) {
      window.eli5Toggle.initToggle('kafka', lessonBody);
    }

    /* Initialize copy buttons */
    if (window.copyCode && typeof window.copyCode.init === 'function') {
      window.copyCode.init(lessonBody);
    }

    /* Navigation buttons */
    prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    nextBtn.style.visibility = index === curriculum.length - 1 ? 'hidden' : 'visible';

    /* Mark as Read button */
    var isCompleted = completedLessons.indexOf(lesson.id) > -1;
    markCompleteBtn.innerHTML = isCompleted
      ? '<i class="fa-solid fa-check"></i> Completed'
      : '<i class="fa-solid fa-check-circle"></i> Mark as Read';
    markCompleteBtn.className = isCompleted
      ? 'px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 bg-gray-200 text-gray-800 cursor-default shadow-sm'
      : 'px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 shadow-sm';

    /* Update lesson ID label */
    var idLabel = document.getElementById('lesson-id-label');
    if (idLabel) {
      idLabel.textContent = 'Lesson: ' + lesson.id;
    }

    renderSidebar();
    renderQuiz(lesson.id);
  }

  /* Helper: find module by lesson ID */
  function findModuleByLessonId(lessonId) {
    var found = null;
    CURRICULUM_MODULES.forEach(function (mod) {
      mod.lessons.forEach(function (l) {
        if (l.id === lessonId) found = mod;
      });
    });
    return found;
  }

  /* ════════════════════════════════════════
     Quiz Rendering
     ════════════════════════════════════════ */

  function renderQuiz(lessonId) {
    var container = document.getElementById('quiz-container');
    if (!container) return;

    var questions = (QUIZ_DATA[lessonId]) || [];

    if (questions.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-8">No quiz questions available for this lesson yet.</p>';
      return;
    }

    var html = '<div class="animate-fade-in">';
    html += '<h3 class="text-xl font-bold text-gray-800 mb-1">Knowledge Check</h3>';
    html += '<p class="text-sm text-gray-500 mb-6">' + questions.length + ' questions</p>';

    questions.forEach(function (q, idx) {
      html += '<div class="quiz-question" data-question="' + idx + '">' +
        '<p class="font-semibold text-gray-800 mb-3"><span class="text-red-600 mr-2">' + (idx + 1) + '.</span>' + escapeHtml(q.q) + '</p>' +
        '<div class="quiz-options">';
      q.options.forEach(function (opt, optIdx) {
        html += '<label class="quiz-option">' +
          '<input type="radio" name="q-' + idx + '" value="' + optIdx + '">' +
          '<span>' + escapeHtml(opt) + '</span>' +
          '</label>';
      });
      html += '</div></div>';
    });

    html += '<div class="mt-8 flex flex-col items-center border-t pt-6">' +
      '<button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-all">Submit Answers</button>' +
      '<div id="quiz-feedback" class="mt-4 text-lg font-bold hidden"></div>' +
      '</div>';
    html += '</div>';

    container.innerHTML = html;

    /* Re-bind submit button after re-render */
    var quizSubmitBtn = document.getElementById('submit-quiz-btn');
    var quizFeedback = document.getElementById('quiz-feedback');

    /* Store correct answers */
    var correctAnswers = questions.map(function (q) { return q.correct; });

    if (quizSubmitBtn) {
      quizSubmitBtn.addEventListener('click', function () {
        var score = 0;
        var total = correctAnswers.length;
        var allAnswered = true;

        correctAnswers.forEach(function (correctIdx, qIdx) {
          var selected = document.querySelector('input[name="q-' + qIdx + '"]:checked');
          var qContainer = document.querySelector('.quiz-question[data-question="' + qIdx + '"]');

          if (!selected) {
            allAnswered = false;
            return;
          }

          var val = parseInt(selected.value, 10);

          if (qContainer) {
            qContainer.classList.remove('correct', 'incorrect');
            qContainer.querySelectorAll('.quiz-option').forEach(function (opt) {
              opt.classList.remove('selected', 'correct-highlight', 'wrong-highlight');
            });
          }

          if (val === correctIdx) {
            score++;
            if (qContainer) {
              qContainer.classList.add('correct');
              selected.closest('.quiz-option').classList.add('correct-highlight');
            }
          } else {
            if (qContainer) {
              qContainer.classList.add('incorrect');
              selected.closest('.quiz-option').classList.add('wrong-highlight');
              qContainer.querySelectorAll('.quiz-option')[correctIdx].classList.add('correct-highlight');
            }
          }
        });

        quizFeedback.classList.remove('hidden', 'text-red-600', 'text-green-600');

        if (!allAnswered) {
          quizFeedback.innerText = 'Please answer all questions before submitting.';
          quizFeedback.classList.add('text-red-600');
          return;
        }

        var pct = Math.round((score / total) * 100);
        var grade = pct >= 80 ? 'Excellent! \uD83C\uDF89' : pct >= 60 ? 'Good job! \uD83D\uDC4D' : pct >= 40 ? 'Keep practicing! \uD83D\uDCDA' : 'Review the lesson and try again! \uD83D\uDCAA';

        quizFeedback.innerHTML = 'Score: ' + score + '/' + total + ' (' + pct + '%) &mdash; ' + grade;
        quizFeedback.classList.add(pct >= 60 ? 'text-green-600' : 'text-red-600');
      });
    }
  }

  /* ════════════════════════════════════════
     Progress Tracking
     ════════════════════════════════════════ */

  function updateProgress() {
    var percent = Math.round((completedLessons.length / curriculum.length) * 100);
    progressBar.style.width = percent + '%';
    progressText.textContent = percent + '%';
  }

  /* ════════════════════════════════════════
     Event Listeners
     ════════════════════════════════════════ */

  function setupEventListeners() {
    /* Navigation */
    prevBtn.addEventListener('click', function () {
      if (currentLessonIndex > 0) loadLesson(currentLessonIndex - 1);
    });

    nextBtn.addEventListener('click', function () {
      if (currentLessonIndex < curriculum.length - 1) loadLesson(currentLessonIndex + 1);
    });

    /* Mark as Read */
    markCompleteBtn.addEventListener('click', function () {
      var lessonId = curriculum[currentLessonIndex].id;
      if (completedLessons.indexOf(lessonId) === -1) {
        completedLessons.push(lessonId);
        try {
          localStorage.setItem('kafka-completed', JSON.stringify(completedLessons));
        } catch (e) { /* ignore */ }
        updateProgress();
        loadLesson(currentLessonIndex);
      }
    });

    /* Tab switching - Segmented Control pattern */
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('active');
        });
        tab.classList.add('active');

        tabContents.forEach(function (content) {
          content.classList.remove('active');
          content.classList.add('hidden');
        });
        var target = document.getElementById('tab-' + tab.dataset.tab);
        if (target) {
          target.classList.remove('hidden');
          target.classList.add('active');
          if (tab.dataset.tab === 'simulator') {
            target.classList.add('flex');
          }
          if (tab.dataset.tab === 'quiz') {
            renderQuiz(curriculum[currentLessonIndex].id);
          }
        }
      });
    });

    /* Mobile sidebar overlay */
    var sidebarOverlay = document.getElementById('sidebar-overlay');
    var openSidebarBtn = document.getElementById('open-sidebar');
    var closeSidebarBtn = document.getElementById('close-sidebar');

    if (openSidebarBtn && sidebar) {
      openSidebarBtn.addEventListener('click', function () {
        sidebar.classList.remove('-translate-x-full');
        if (sidebarOverlay) sidebarOverlay.classList.remove('hidden');
      });
    }
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', function () {
        sidebar.classList.add('-translate-x-full');
        if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
      });
    }
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', function () {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
      });
    }

    /* Quiz submit */
    var submitQuiz = document.getElementById('submit-quiz');
    var resultDiv = document.getElementById('quiz-result');
    if (submitQuiz) {
      submitQuiz.addEventListener('click', function () {
        var correctAnswers = submitQuiz._correctAnswers || [];
        if (!correctAnswers.length) return;

        var score = 0;
        var total = correctAnswers.length;

        correctAnswers.forEach(function (correctIdx, qIdx) {
          var selected = document.querySelector('input[name="q-' + qIdx + '"]:checked');
          var qContainer = document.querySelector('.quiz-question[data-question="' + qIdx + '"]');
          if (qContainer) {
            qContainer.querySelectorAll('label').forEach(function (label, optIdx) {
              label.classList.remove('bg-green-50', 'bg-red-50', 'ring-2', 'ring-green-500', 'ring-red-500');
            });
          }
          if (selected) {
            var val = parseInt(selected.value, 10);
            if (val === correctIdx) {
              score++;
              if (qContainer) {
                qContainer.querySelectorAll('label')[correctIdx].classList.add('bg-green-50', 'ring-2', 'ring-green-500');
              }
            } else {
              if (qContainer) {
                qContainer.querySelectorAll('label')[val].classList.add('bg-red-50', 'ring-2', 'ring-red-500');
                qContainer.querySelectorAll('label')[correctIdx].classList.add('bg-green-50', 'ring-2', 'ring-green-500');
              }
            }
          } else {
            /* No answer selected — highlight correct answer */
            if (qContainer) {
              qContainer.querySelectorAll('label')[correctIdx].classList.add('bg-green-50', 'ring-2', 'ring-green-500');
            }
          }
        });

        var pct = Math.round((score / total) * 100);
        var grade = pct >= 80 ? 'Excellent! 🎉' : pct >= 60 ? 'Good job! 👍' : pct >= 40 ? 'Keep practicing! 📚' : 'Review the lesson and try again! 💪';

        resultDiv.className = 'mt-6 p-4 rounded-lg text-center font-bold ' +
          (pct >= 60 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800');
        resultDiv.innerHTML = 'Score: ' + score + '/' + total + ' (' + pct + '%) — ' + grade;
        resultDiv.classList.remove('hidden');
      });
    }

    /* Remove old mobile menu toggle (replaced by overlay) */
  }

  /* ─── Start ─── */
  init();

})();
