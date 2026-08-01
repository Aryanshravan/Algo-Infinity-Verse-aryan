/* ============================================
   GRAPHQL ACADEMY — Curriculum, State, Live Playground & Quiz
   ============================================ */

const STORAGE_KEY = 'graphqlAcademyProgress';

/* ─── Curriculum Data ─── */
const curriculum = [
    {
        id: 'sdl-types',
        title: 'SDL & Types',
        lessons: [
            {
                id: 'sdl-types-1',
                title: 'The Schema Definition Language',
                content: `
                    <h2>The Schema Definition Language (SDL)</h2>
                    <p>GraphQL APIs are described by a <strong>schema</strong> written in the <strong>Schema Definition Language</strong> (SDL). The schema is the contract between client and server: it declares exactly what data can be fetched and in what shape.</p>

                    <h3>Scalar Types</h3>
                    <p>Every leaf value in GraphQL is one of the built-in <strong>scalars</strong>:</p>
                    <pre><code>Int     # whole number
Float   # decimal number
String  # UTF-8 text
Boolean # true / false
ID      # unique identifier (serialized as a string)</code></pre>

                    <h3>Object Types</h3>
                    <p>An <strong>object type</strong> groups fields together. Each field has a type and may be nullable by default:</p>
                    <pre><code>type Book {
  id: ID!
  title: String!
  genre: String!
  publishedYear: Int
}</code></pre>

                    <h3>Non-Null &amp; List Types</h3>
                    <p>A trailing <code>!</code> means the field can never return <code>null</code>. Square brackets declare a list, and the <code>!</code> can be applied to both the list and its elements:</p>
                    <pre><code>type Query {
  hello: String!        # always returns a string
  books: [Book!]!       # always a list, never null elements
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Schema-First vs Code-First</div>
                        <p>You can author SDL by hand (schema-first, like this playground) or generate it from language decorators (code-first, e.g. TypeGraphQL or NestJS). Both produce the same SDL contract at runtime.</p>
                    </div>

                    <h3>Try it in the Playground</h3>
                    <p>Open the <strong>Playground</strong> tab and run the default query. Then click <strong>SDL Schema</strong> to see the full schema backing this mock server.</p>
                `,
                defaultCode: `{
  hello
  books {
    id
    title
    genre
  }
}`
            },
            {
                id: 'sdl-types-2',
                title: 'Enums, Interfaces, Unions & Inputs',
                content: `
                    <h2>Richer Types in SDL</h2>
                    <p>Beyond objects and scalars, GraphQL ships several type constructs for expressing domain rules in the schema itself.</p>

                    <h3>Enums</h3>
                    <p>An <strong>enum</strong> restricts a field to a fixed set of string values, validated at query time:</p>
                    <pre><code>enum Genre {
  SOFTWARE
  FANTASY
  INTERVIEW_PREP
}

type Book {
  title: String!
  genre: Genre!
}</code></pre>

                    <h3>Interfaces</h3>
                    <p>An <strong>interface</strong> describes a contract that several object types can implement. Clients select type-specific fields with inline fragments:</p>
                    <pre><code>interface Media {
  id: ID!
  title: String!
}

type Book implements Media {
  id: ID!
  title: String!
  pages: Int
}

type Film implements Media {
  id: ID!
  title: String!
  runtimeMinutes: Int
}

type Query {
  catalog: [Media!]!
}</code></pre>

                    <pre><code>{
  catalog {
    title
    ... on Book { pages }
    ... on Film { runtimeMinutes }
  }
}</code></pre>

                    <h3>Unions</h3>
                    <p>A <strong>union</strong> says "this field returns one of several object types, with no shared fields guaranteed":</p>
                    <pre><code>union SearchResult = Book | Author</code></pre>

                    <h3>Input Types</h3>
                    <p>Arguments that need multiple fields use an <strong>input object type</strong>, declared with the <code>input</code> keyword instead of <code>type</code>:</p>
                    <pre><code>input CreateBookInput {
  title: String!
  authorId: ID!
  genre: Genre
}

type Mutation {
  addBook(input: CreateBookInput!): Book!
}</code></pre>

                    <div class="callout callout--violet">
                        <div class="callout-title">Type Keywords Summary</div>
                        <p><code>type</code> defines objects you can query. <code>input</code> defines shapes for arguments. <code>interface</code> &amp; <code>union</code> add polymorphism. <code>enum</code> constrains values. <code>scalar</code> lets you define custom leaf types (e.g. <code>Date</code> or <code>JSON</code>).</p>
                    </div>
                `,
                defaultCode: `{
  book(id: 1) {
    id
    title
    ...bookDetails
  }
}

fragment bookDetails on Book {
  genre
  author {
    name
    country
  }
}`
            }
        ],
        quiz: [
            {
                id: 'q-sdl-types-1',
                question: 'In SDL, what does a trailing exclamation mark (!) on a field type indicate?',
                options: [
                    'The field is required and can never be null',
                    'The field is deprecated',
                    'The field is only available to admins',
                    'The field is hidden from the schema'
                ],
                correct: 0
            },
            {
                id: 'q-sdl-types-2',
                question: 'Which keyword is used to define the shape of an object passed as a mutation argument?',
                options: [
                    'type',
                    'enum',
                    'input',
                    'interface'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'queries-mutations',
        title: 'Queries & Mutations',
        lessons: [
            {
                id: 'queries-mutations-1',
                title: 'Queries, Arguments & Aliases',
                content: `
                    <h2>Queries: Reading Data</h2>
                    <p>A <strong>query</strong> is a read-only operation. The client asks for exactly the fields it needs, and the server returns only those — no over-fetching, no under-fetching.</p>

                    <h3>Field Selection</h3>
                    <pre><code>{
  books {
    id
    title
  }
}</code></pre>

                    <h3>Arguments</h3>
                    <p>Fields can take arguments to filter or look up a single item:</p>
                    <pre><code>{
  book(id: 2) {
    title
    author {
      name
    }
  }
}</code></pre>

                    <h3>Aliases</h3>
                    <p>To request the same field twice with different arguments, use an <strong>alias</strong>. Without it, the two results would collide:</p>
                    <pre><code>query Library {
  allBooks: books {
    id
    title
  }
  firstBook: book(id: 1) {
    title
  }
}</code></pre>

                    <h3>Operation Name &amp; Variables</h3>
                    <p>Name your operations for debugging and reuse. Variables keep queries clean and avoid client-side string interpolation:</p>
                    <pre><code>query BookById($id: Int!) {
  book(id: $id) {
    id
    title
    genre
  }
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">A Single Round Trip</div>
                        <p>A well-designed query pulls all related data in one request. Contrast this with a REST client making N round trips — one per resource — and you see why GraphQL shines for data-dense UIs.</p>
                    </div>
                `,
                defaultCode: `query Library {
  allBooks: books {
    id
    title
  }
  firstBook: book(id: 1) {
    title
    author {
      name
    }
  }
}`
            },
            {
                id: 'queries-mutations-2',
                title: 'Mutations & Best Practices',
                content: `
                    <h2>Mutations: Writing Data</h2>
                    <p>A <strong>mutation</strong> is a write operation — creating, updating, or deleting. Mutations declare side effects, and the server should always respond with the affected data so the client cache stays consistent.</p>

                    <h3>A Basic Mutation</h3>
                    <pre><code>mutation {
  addBook(title: "Design Patterns", authorId: 1, genre: "Software") {
    id
    title
    genre
    author {
      name
    }
  }
}</code></pre>

                    <h3>Return the Affected Object</h3>
                    <p>Always return the object you changed (or the created item) with enough fields for the client to update its cache without a refetch:</p>
                    <pre><code>mutation CreateBook {
  addBook(
    title: "Clean Architecture"
    authorId: 1
    genre: "Software"
  ) {
    id
    title
    genre
    author {
      id
      name
    }
  }
}</code></pre>

                    <h3>Field Order Matters</h3>
                    <p>Unlike queries, mutation root fields execute <strong>serially, top-to-bottom</strong>. If your mutation needs the result of a previous mutation, list them in order.</p>

                    <div class="callout callout--violet">
                        <div class="callout-title">Mutation Best Practices</div>
                        <ul>
                            <li>Name the operation (e.g. <code>CreateBook</code>) for logs &amp; analytics.</li>
                            <li>Return the affected payload, never just a boolean.</li>
                            <li>Use an <code>input</code> object for 3+ arguments.</li>
                            <li>Return a single <code>MutationResult</code> object with a status, not a scalar.</li>
                        </ul>
                    </div>
                `,
                defaultCode: `mutation CreateBook {
  addBook(title: "Design Patterns", authorId: 1, genre: "Software") {
    id
    title
    genre
    author {
      name
    }
  }
}`
            }
        ],
        quiz: [
            {
                id: 'q-queries-1',
                question: 'What is the purpose of an alias in a GraphQL query?',
                options: [
                    'To rename the schema type',
                    'To request the same field twice without clashing results',
                    'To cache a query on the server',
                    'To make a field non-null'
                ],
                correct: 1
            },
            {
                id: 'q-queries-2',
                question: 'How do mutation root fields execute relative to each other?',
                options: [
                    'In parallel, non-deterministically',
                    'Serially, top-to-bottom',
                    'Alphabetically',
                    'They never share an operation'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'resolvers-n1',
        title: 'Resolvers & N+1',
        lessons: [
            {
                id: 'resolvers-n1-1',
                title: 'Resolvers & the Execution Model',
                content: `
                    <h2>Resolvers: Where the Magic Happens</h2>
                    <p>A <strong>resolver</strong> is a function that tells GraphQL how to produce the value for a field. Every field in the schema is backed by one. Resolvers can read from a database, an in-memory array, or another API.</p>

                    <h3>The Resolver Signature</h3>
                    <pre><code>const resolvers = {
  Query: {
    book: (parent, args, context) =&gt; {
      return db.books.find(b =&gt; b.id === args.id);
    },
  },
  Book: {
    // parent is the resolved Book object
    author: (parent, args, context) =&gt; {
      return db.authors.find(a =&gt; a.id === parent.authorId);
    },
  },
};</code></pre>
                    <ul>
                        <li><code>parent</code> — the value returned by the parent resolver.</li>
                        <li><code>args</code> — the field's arguments.</li>
                        <li><code>context</code> — shared per-request state (auth user, db client).</li>
                    </ul>

                    <h3>How a Query Executes</h3>
                    <p>GraphQL walks your selection tree level by level: it resolves <code>book</code>, then for that value resolves <code>title</code> and <code>author</code>, then for the author resolves <code>name</code>. Each step calls exactly one resolver.</p>

                    <div class="callout">
                        <div class="callout-title">Run it live</div>
                        <p>Head to the <strong>Playground</strong> and run a query that nests <code>author</code> and <code>reviews</code>. Watch the <strong>db calls</strong> counter — every resolver that touches the database increments it.</p>
                    </div>
                `,
                defaultCode: `{
  book(id: 2) {
    id
    title
    author {
      name
    }
    reviews {
      rating
      comment
    }
  }
}`
            },
            {
                id: 'resolvers-n1-2',
                title: 'The N+1 Problem & DataLoader',
                content: `
                    <h2>The N+1 Problem</h2>
                    <p>Fetching a list of books, then resolving each book's <code>author</code>, triggers one query per book. With 10 books that is 1 query for the list plus 10 more for authors = <strong>11 database queries</strong>. This is the classic <strong>N+1 problem</strong>.</p>

                    <pre><code>{
  books {
    id
    title
    author {   # resolves once PER BOOK!
      name
    }
  }
}</code></pre>

                    <h3>The Fix: DataLoader</h3>
                    <p><strong>DataLoader</strong> coalesces all individual requests in one tick into a single batched query, then maps results back to the correct parent:</p>
                    <pre><code>const authorLoader = new DataLoader(async (ids) =&gt; {
  const authors = await db.authors.find({ id: { $in: ids } });
  return ids.map(id =&gt; authors.find(a =&gt; a.id === id));
});

// Resolver now delegates to the loader:
Book: {
  author: (parent, args, { authorLoader }) =&gt;
    authorLoader.load(parent.authorId),
},</code></pre>

                    <h3>Loaders Are Per-Request</h3>
                    <p>A loader caches and batches within a single request only. Create a fresh loader for each request (inside your context factory), otherwise data leaks across requests and caches go stale.</p>

                    <div class="callout">
                        <div class="callout-title">Try the toggle</div>
                        <p>In the <strong>Playground</strong>, run <code>books { author { name } }</code>. Flip the <strong>DataLoader</strong> button and re-run: watch the <strong>db calls</strong> drop from 5 to 2. That's the N+1 problem fixed live.</p>
                    </div>
                `,
                defaultCode: `{
  books {
    id
    title
    author {
      name
      country
    }
  }
}`
            }
        ],
        quiz: [
            {
                id: 'q-resolvers-1',
                question: 'Which argument of a resolver gives access to the value returned by the parent resolver?',
                options: [
                    'args',
                    'context',
                    'parent',
                    'info'
                ],
                correct: 2
            },
            {
                id: 'q-resolvers-2',
                question: 'How does DataLoader fix the N+1 problem?',
                options: [
                    'It disables nested resolvers',
                    'It caches queries forever in memory',
                    'It batches individual loads in one tick into a single query',
                    'It moves the database to the client'
                ],
                correct: 2
            }
        ]
    },
    {
        id: 'subscriptions',
        title: 'Subscriptions',
        lessons: [
            {
                id: 'subscriptions-1',
                title: 'Real-Time Updates with Subscriptions',
                content: `
                    <h2>Subscriptions: Push, Don't Poll</h2>
                    <p>A <strong>subscription</strong> is a long-lived GraphQL operation that pushes real-time updates to clients over a persistent connection (typically WebSocket). Instead of polling every second, the client receives an event the instant it happens.</p>

                    <h3>Declaring a Subscription</h3>
                    <pre><code>type Subscription {
  bookAdded: Book!
}

subscription WatchBookAdded {
  bookAdded {
    id
    title
    author {
      name
    }
  }
}</code></pre>

                    <h3>The Anatomy of a Subscription</h3>
                    <p>On the server, a subscription has three parts:</p>
                    <ul>
                        <li><strong>subscribe</strong> — opens the event stream (e.g. a pub/sub topic).</li>
                        <li><strong>resolve</strong> — shapes the payload of each pushed event.</li>
                        <li><strong>trigger</strong> — the event source (Redis Pub/Sub, Kafka, Postgres LISTEN, or an in-memory bus).</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Try it live</div>
                        <p>In the <strong>Playground</strong>, click <strong>Subscribe</strong>, then press <strong>Publish Event</strong> a few times. The mock server pushes new <code>bookAdded</code> events into the feed below the response panel.</p>
                    </div>
                `,
                defaultCode: `subscription WatchBookAdded {
  bookAdded {
    id
    title
    author {
      name
    }
  }
}`
            },
            {
                id: 'subscriptions-2',
                title: 'Pub/Sub, Filtering & Client Hooks',
                content: `
                    <h2>Building Reliable Subscriptions</h2>
                    <p>Subscriptions shine for notifications, collaborative editing, live dashboards, and activity feeds — any place a client should react to server-side state changes without polling.</p>

                    <h3>Pub/Sub in Practice</h3>
                    <pre><code>import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

const resolvers = {
  Mutation: {
    addBook: (parent, args, ctx) =&gt; {
      const book = db.save(args);
      pubsub.publish('BOOK_ADDED', { bookAdded: book });
      return book;
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () =&gt; pubsub.asyncIterator('BOOK_ADDED'),
    },
  },
};</code></pre>

                    <h3>Filtering Events</h3>
                    <p>Use <code>withFilter</code> to only deliver events a specific client cares about — for example, only books by a chosen author:</p>
                    <pre><code>import { withFilter } from 'graphql-subscriptions';

Subscription: {
  bookAdded: {
    subscribe: withFilter(
      () =&gt; pubsub.asyncIterator('BOOK_ADDED'),
      (payload, variables) =&gt; payload.bookAdded.authorId === variables.authorId
    ),
  },
}</code></pre>

                    <h3>Client-Side Hooks (Apollo)</h3>
                    <pre><code>const { data } = useSubscription(GET_BOOK_ADDED);

useEffect(() =&gt; {
  const book = data &amp;&amp; data.bookAdded;
  if (book) setBooks(prev =&gt; [book, ...prev]);
}, [data]);</code></pre>

                    <div class="callout callout--violet">
                        <div class="callout-title">When NOT to Use Subscriptions</div>
                        <p>If data changes less often than users look at it, prefer refetching or polling — subscriptions add WebSocket infrastructure and operational cost. Reach for them when freshness matters more than simplicity.</p>
                    </div>
                `,
                defaultCode: `mutation AddReview {
  addReview(bookId: 1, rating: 5, comment: "A masterpiece!") {
    id
    rating
    comment
    book {
      title
    }
  }
}`
            }
        ],
        quiz: [
            {
                id: 'q-subs-1',
                question: 'What transport is most commonly used to deliver subscription events to browsers?',
                options: [
                    'HTTP polling every second',
                    'WebSocket persistent connection',
                    'Server-Sent request logging',
                    'A shared database trigger'
                ],
                correct: 1
            },
            {
                id: 'q-subs-2',
                question: 'What does withFilter do for a subscription?',
                options: [
                    'It blocks the whole subscription for security',
                    'It only delivers events matching a predicate',
                    'It batches multiple subscriptions together',
                    'It converts a subscription into a query'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'apollo-client',
        title: 'Apollo Client',
        lessons: [
            {
                id: 'apollo-client-1',
                title: 'Apollo Client & useQuery',
                content: `
                    <h2>Apollo Client: GraphQL in Your App</h2>
                    <p><strong>Apollo Client</strong> is the industry-standard GraphQL client for JavaScript. It manages queries, caching, optimistic UI, and error state, letting components declare their data needs declaratively.</p>

                    <h3>Setting Up a Client</h3>
                    <pre><code>import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://api.example.com/graphql',
  cache: new InMemoryCache(),
});</code></pre>

                    <h3>The useQuery Hook</h3>
                    <p>Wrap a query in <code>gql</code> and hand it to the hook. Apollo returns <code>loading</code>, <code>error</code>, and <code>data</code>:</p>
                    <pre><code>import { gql, useQuery } from '@apollo/client';

const GET_BOOKS = gql\`
  query GetBooks {
    books {
      id
      title
      author {
        name
      }
    }
  }
\`;

function BookList() {
  const { loading, error, data } = useQuery(GET_BOOKS);

  if (loading) return &lt;p&gt;Loading...&lt;/p&gt;;
  if (error) return &lt;p&gt;Error: {error.message}&lt;/p&gt;;

  return data.books.map((book) =&gt; (
    &lt;li key={book.id}&gt;{book.title} by {book.author.name}&lt;/li&gt;
  ));
}</code></pre>

                    <h3>Variables</h3>
                    <p>Pass dynamic arguments via the hook's options object — Apollo re-runs the query when variables change:</p>
                    <pre><code>const { data } = useQuery(GET_BOOK, {
  variables: { id: selectedId },
});</code></pre>

                    <div class="callout">
                        <div class="callout-title">Why a Client?</div>
                        <p>Beyond fetching, Apollo normalizes results into a cache keyed by <code>__typename + id</code>, dedupes concurrent requests, and retries on errors — so your components stay fast and consistent without writing plumbing.</p>
                    </div>
                `,
                defaultCode: `{
  authors {
    id
    name
    books {
      id
      title
      genre
    }
  }
}`
            },
            {
                id: 'apollo-client-2',
                title: 'Mutations, Cache & Fragments',
                content: `
                    <h2>Mutations &amp; Cache Consistency</h2>
                    <p>After a mutation, Apollo must update its normalized cache or the UI will show stale data. There are three strategies — each with a sweet spot.</p>

                    <h3>1. Refetch Queries</h3>
                    <p>Simple and safe: tell Apollo to re-run affected queries after the mutation.</p>
                    <pre><code>import { gql, useMutation } from '@apollo/client';

const ADD_BOOK = gql\`
  mutation AddBook($input: CreateBookInput!) {
    addBook(input: $input) {
      id
      title
      genre
    }
  }
\`;

const [addBook, { loading }] = useMutation(ADD_BOOK, {
  refetchQueries: [{ query: GET_BOOKS }],
});

await addBook({
  variables: {
    input: { title: 'Clean Architecture', authorId: 1 },
  },
});</code></pre>

                    <h3>2. Update the Cache Directly</h3>
                    <p>For snappy, optimistic UIs, mutate the cache in <code>update</code>:</p>
                    <pre><code>const [addBook] = useMutation(ADD_BOOK, {
  update(cache, { data }) {
    const existing = cache.readQuery({ query: GET_BOOKS });
    cache.writeQuery({
      query: GET_BOOKS,
      data: {
        books: [data.addBook, ...existing.books],
      },
    });
  },
});</code></pre>

                    <h3>3. Fragments for Reuse</h3>
                    <p><strong>Fragments</strong> share field selections between queries, mutations, and components — a single source of truth for a type's shape:</p>
                    <pre><code>const BOOK_FIELDS = gql\`
  fragment BookFields on Book {
    id
    title
    genre
  }
\`;

const GET_BOOK = gql\`
  query GetBook($id: Int!) {
    book(id: $id) {
      ...BookFields
      author {
        name
      }
    }
  }
  \${BOOK_FIELDS}
\`;</code></pre>

                    <div class="callout callout--violet">
                        <div class="callout-title">Matching the Cache</div>
                        <p>Apollo's cache keys objects by <code>__typename + id</code>. Always request an <code>id</code> on objects you mutate, or provide a <code>keyFields</code> config, or cache updates silently fail.</p>
                    </div>
                `,
                defaultCode: `{
  book(id: 3) {
    id
    title
    genre
    author {
      id
      name
    }
  }
}`
            }
        ],
        quiz: [
            {
                id: 'q-apollo-1',
                question: 'Which Apollo Client hook is used to run a GraphQL query in a React component?',
                options: [
                    'useMutation',
                    'useQuery',
                    'useSubscription',
                    'useFragment'
                ],
                correct: 1
            },
            {
                id: 'q-apollo-2',
                question: 'How does Apollo Client key objects in its normalized cache by default?',
                options: [
                    'By the query text',
                    'By __typename plus id',
                    'By insertion order',
                    'By a random nonce'
                ],
                correct: 1
            }
        ]
    },
    {
        id: 'federation-security',
        title: 'Federation & Security',
        lessons: [
            {
                id: 'federation-security-1',
                title: 'Apollo Federation & the Supergraph',
                content: `
                    <h2>Federation: One Graph, Many Services</h2>
                    <p><strong>Apollo Federation</strong> lets you compose one <strong>supergraph</strong> from many independently deployed <strong>subgraphs</strong>. Each team owns its domain — <em>users</em>, <em>payments</em>, <em>catalog</em> — and the router stitches them together.</p>

                    <h3>Subgraph Example</h3>
                    <p>Each subgraph exposes a federated schema. A key type is shared across subgraphs:</p>
                    <pre><code>// catalog subgraph
extend type Book @key(fields: "id") {
  id: ID! @external
  title: String!
  price: Money
}

// users subgraph
extend type Book @key(fields: "id") {
  id: ID! @external
  reviews: [Review!]!
}</code></pre>

                    <h3>The Supergraph</h3>
                    <p>The federation <strong>router</strong> ingests every subgraph schema and produces a unified graph. A client can now fetch:</p>
                    <pre><code>{
  books {
    title        # catalog subgraph
    reviews {    # users subgraph
      rating
    }
  }
}</code></pre>
                    <p>The router fans the request out to the right subgraphs and merges the responses into a single payload.</p>

                    <div class="callout">
                        <div class="callout-title">Why Federate?</div>
                        <p>Federation lets teams ship independently, avoids a monolith schema bottleneck, and keeps a single contract for clients. It does add a router and more moving parts — start with a monolith graph and federate only when you need it.</p>
                    </div>
                `,
                defaultCode: `{
  authors {
    id
    name
    country
    books {
      title
    }
  }
}`
            },
            {
                id: 'federation-security-2',
                title: 'GraphQL Security in Production',
                content: `
                    <h2>Securing a GraphQL API</h2>
                    <p>GraphQL's flexibility is also its attack surface. One crafted query can read an entire database. A production API needs layered defenses.</p>

                    <h3>The Query Depth Attack</h3>
                    <p>Deeply nested selections are expensive. Enforce a <strong>maximum query depth</strong> and reject deeper operations:</p>
                    <pre><code>{
  books {
    author {
      books {
        author {
          books { title }   # unbounded nesting!
        }
      }
    }
  }
}</code></pre>

                    <h3>Cost &amp; Complexity Limits</h3>
                    <p>Count the fields and arguments a query touches, assign a cost per field, and cap the total. Tools like <code>graphql-cost-analysis</code> do this automatically.</p>

                    <h3>Practical Defense Checklist</h3>
                    <ul>
                        <li><strong>Depth limiting</strong> — cap nesting (e.g. max 8–10 levels).</li>
                        <li><strong>Query cost / complexity analysis</strong> — reject expensive queries.</li>
                        <li><strong>Rate limiting</strong> — per-user and per-IP budgets.</li>
                        <li><strong>Authentication &amp; authorization</strong> — enforce per-field ACLs in resolvers or with directives like <code>@auth</code>.</li>
                        <li><strong>Timeout &amp; persisted queries</strong> — kill runaway queries; allow-list known operations.</li>
                        <li><strong>Field-level throttling</strong> — cap list sizes with arguments (<code>first: 20</code>).</li>
                        <li><strong>Transport security</strong> — TLS, CORS allow-list, CSRF protection, and never <code>introspection</code> in production unless needed.</li>
                    </ul>

                    <div class="callout callout--violet">
                        <div class="callout-title">Defense in Depth</div>
                        <p>No single control is enough. Combine depth limits, cost analysis, auth, and rate limiting. Treat the GraphQL endpoint like any other public API — log it, watch it, and fail closed.</p>
                    </div>
                `,
                defaultCode: `mutation DeleteBook {
  deleteBook(id: 4) {
    id
    title
  }
}`
            }
        ],
        quiz: [
            {
                id: 'q-feder-1',
                question: 'In Apollo Federation, what do you call the unified graph assembled from multiple subgraphs?',
                options: [
                    'The schema registry',
                    'The supergraph',
                    'The monolith graph',
                    'The endpoint mesh'
                ],
                correct: 1
            },
            {
                id: 'q-feder-2',
                question: 'Which of these is an effective defense against a deeply nested query attack?',
                options: [
                    'Disabling caching',
                    'Maximum query depth limiting',
                    'Using only GET requests',
                    'Renaming the endpoint'
                ],
                correct: 1
            }
        ]
    }
];

/* ─── State ─── */
let state = {
    activeModuleId: curriculum[0].id,
    activeLessonId: curriculum[0].lessons[0].id,
    activeTab: 'lesson',
    completedItems: [],
    quizAnswers: {},
    quizSubmitted: false
};

/* ─── DOM Cache ─── */
const DOM = {};

function cacheDOM() {
    DOM.sidebarOverlay = document.getElementById('sidebar-overlay');
    DOM.sidebar = document.getElementById('sidebar');
    DOM.openSidebarBtn = document.getElementById('open-sidebar-btn');
    DOM.closeSidebarBtn = document.getElementById('close-sidebar-btn');
    DOM.moduleList = document.getElementById('module-list');
    DOM.activeModuleTitle = document.getElementById('active-module-title');
    DOM.tabBtns = document.querySelectorAll('.tab-btn');
    DOM.tabContents = document.querySelectorAll('.tab-content');
    DOM.tabLesson = document.getElementById('tab-lesson');
    DOM.tabSimulator = document.getElementById('tab-simulator');
    DOM.tabQuiz = document.getElementById('tab-quiz');
    DOM.lessonContent = document.getElementById('lesson-content');
    DOM.markCompleteBtn = document.getElementById('mark-complete-btn');
    DOM.lessonNav = document.getElementById('lesson-nav');
    DOM.codeEditor = document.getElementById('code-editor');
    DOM.runCodeBtn = document.getElementById('run-code-btn');
    DOM.resetCodeBtn = document.getElementById('reset-code-btn');
    DOM.clearOutputBtn = document.getElementById('clear-output-btn');
    DOM.outputFrame = document.getElementById('output-frame');
    DOM.responseStatus = document.getElementById('response-status');
    DOM.dbCalls = document.getElementById('db-calls');
    DOM.quizContainer = document.getElementById('quiz-container');
    DOM.progressBar = document.getElementById('progress-bar');
    DOM.progressText = document.getElementById('progress-text');
    DOM.dataLoaderToggle = document.getElementById('data-loader-toggle');
    DOM.schemaBtn = document.getElementById('schema-btn');
    DOM.schemaModal = document.getElementById('schema-modal');
    DOM.schemaContent = document.getElementById('schema-content');
    DOM.schemaCloseBtn = document.getElementById('schema-close-btn');
    DOM.subToggleBtn = document.getElementById('sub-toggle-btn');
    DOM.subSimulateBtn = document.getElementById('sub-simulate-btn');
    DOM.subFeedBody = document.getElementById('sub-feed-body');
    DOM.subIndicator = document.getElementById('sub-indicator');
}

/* ─── Helpers ─── */
function getActiveModule() {
    return curriculum.find(m => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
    const mod = getActiveModule();
    return mod.lessons.find(l => l.id === state.activeLessonId) || mod.lessons[0];
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ─── Progress ─── */
function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) state.completedItems = JSON.parse(saved);
    } catch { /* ignore */ }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.completedItems));
}

function markItemComplete(itemId) {
    if (!state.completedItems.includes(itemId)) {
        state.completedItems.push(itemId);
        saveProgress();
    }
}

function isItemComplete(itemId) {
    return state.completedItems.includes(itemId);
}

function updateProgress() {
    let total = 0;
    let completed = 0;
    curriculum.forEach(mod => {
        total += mod.lessons.length;
        if (mod.quiz?.length > 0) total++;
    });
    completed = state.completedItems.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    DOM.progressBar.style.width = pct + '%';
    DOM.progressText.textContent = pct + '%';
}

/* ─── Sidebar ─── */
function renderSidebar() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    DOM.moduleList.innerHTML = curriculum.map((mod, idx) => {
        const lessonsCount = mod.lessons.length;
        const lessonsDoneCount = mod.lessons.filter(l => isItemComplete(l.id)).length;
        const quizCount = mod.quiz?.length || 0;
        const quizDone = quizCount > 0 ? isItemComplete(mod.id + '-quiz') : true;

        const allLessonsDone = lessonsDoneCount === lessonsCount;
        const isModuleComplete = allLessonsDone && quizDone;
        const hasPartialProgress = !allLessonsDone && lessonsDoneCount > 0;
        const isActive = mod.id === state.activeModuleId;

        let nodeClass = 'timeline-node--incomplete';
        if (isModuleComplete) nodeClass = 'timeline-node--complete';
        else if (hasPartialProgress) nodeClass = 'timeline-node--partial';
        else if (isActive) nodeClass = 'timeline-node--active';

        const activePart = isModuleComplete ? 'module-badge--complete'
            : isActive && !hasPartialProgress ? 'module-badge--active'
            : '';

        const checkVisible = isModuleComplete ? 'visible' : '';

        let progressHtml = '';
        if (hasPartialProgress) {
            progressHtml = `<span class="sidebar-lesson-progress">${lessonsDoneCount}/${lessonsCount} lessons done</span>`;
        } else if (allLessonsDone && !quizDone) {
            progressHtml = `<span class="sidebar-quiz-pending">Quiz not completed</span>`;
        }

        const lessonsHtml = mod.lessons.map(lesson => {
            const isActiveLesson = lesson.id === state.activeLessonId;
            const isLessonComplete = isItemComplete(lesson.id);
            return `
                <button class="sidebar-lesson-btn ${isActiveLesson ? 'active' : ''}"
                        data-module-id="${mod.id}"
                        data-lesson-id="${lesson.id}">
                    <i class="fa-solid ${isLessonComplete ? 'fa-check-circle' : 'fa-circle'} sidebar-lesson-dot"></i>
                    <span class="sidebar-lesson-title">${escHtml(lesson.title)}</span>
                </button>
            `;
        }).join('');

        return `
            <li style="animation-delay: ${reducedMotion ? '0s' : idx * 0.03}s">
                <div class="timeline-node ${nodeClass}"></div>
                <button class="sidebar-module-btn ${isActive ? 'active' : ''}"
                        data-module-id="${mod.id}">
                    <div class="module-content-row">
                        <span class="module-badge ${activePart}">${String(idx + 1).padStart(2, '0')}</span>
                        <div class="module-text-group">
                            <span class="sidebar-module-title">${escHtml(mod.title)}</span>
                            ${progressHtml}
                        </div>
                        <i class="fa-solid fa-check-circle module-check-icon ${checkVisible}"></i>
                    </div>
                </button>
                <div class="sidebar-lessons ${isActive ? 'open' : ''}">${lessonsHtml}</div>
            </li>
        `;
    }).join('');
}

function changeModule(moduleId) {
    const mod = curriculum.find(m => m.id === moduleId);
    if (!mod) return;
    state.activeModuleId = moduleId;
    state.activeLessonId = mod.lessons[0].id;
    state.quizAnswers = {};
    state.quizSubmitted = false;
    renderSidebar();
    renderActiveContent();
    updateProgress();
    closeSidebar();
}

function changeLesson(moduleId, lessonId) {
    const mod = curriculum.find(m => m.id === moduleId);
    if (!mod) return;
    const lesson = mod.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    state.activeModuleId = moduleId;
    state.activeLessonId = lessonId;
    state.quizAnswers = {};
    state.quizSubmitted = false;
    renderSidebar();
    renderActiveContent();
    updateProgress();
    closeSidebar();
}

/* ─── Tabs ─── */
function switchTab(tabId) {
    state.activeTab = tabId;
    DOM.tabBtns.forEach(btn => {
        const isActive = btn.getAttribute('data-tab') === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    DOM.tabContents.forEach(c => {
        c.classList.remove('active', 'flex', 'md:flex-row');
    });
    const active = document.getElementById('tab-' + tabId);
    if (tabId === 'simulator') {
        active.classList.add('active', 'flex', 'md:flex-row');
    } else {
        active.classList.add('active');
    }
    renderActiveContent();
}

function renderActiveContent() {
    if (state.activeTab === 'lesson') renderLesson();
    else if (state.activeTab === 'simulator') loadCode();
    else if (state.activeTab === 'quiz') renderQuiz();
}

/* ─── Lesson ─── */
function renderLesson() {
    const lesson = getActiveLesson();
    const isComplete = isItemComplete(lesson.id);

    DOM.lessonContent.innerHTML = (window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, (window.eli5GraphqlData || {})[lesson.id] || '') : lesson.content);
    if (window.eli5Toggle) {
        window.eli5Toggle.initToggle('graphql', DOM.lessonContent);
    }

    if (window.copyCode) {
        window.copyCode.init(DOM.lessonContent);
    }

    DOM.markCompleteBtn.innerHTML = isComplete
        ? '<i class="fas fa-check-circle mr-2"></i> Completed'
        : '<i class="fas fa-check-circle mr-2"></i> Mark as Complete';
    DOM.markCompleteBtn.classList.toggle('completed', isComplete);

    renderLessonNav();

    DOM.activeModuleTitle.textContent = getActiveModule().title;
}

function renderLessonNav() {
    const mod = getActiveModule();
    const lessonIdx = mod.lessons.findIndex(l => l.id === state.activeLessonId);
    const prevLesson = lessonIdx > 0 ? mod.lessons[lessonIdx - 1] : null;
    const nextLesson = lessonIdx < mod.lessons.length - 1 ? mod.lessons[lessonIdx + 1] : null;

    let html = '';
    if (prevLesson) {
        html += `<button class="lesson-nav-btn" id="lesson-prev-btn" data-lesson-id="${prevLesson.id}" title="${escHtml(prevLesson.title)}">
            <i class="fas fa-arrow-left mr-1"></i> Previous
        </button>`;
    }
    if (nextLesson) {
        html += `<button class="lesson-nav-btn lesson-nav-btn--primary" id="lesson-next-btn" data-lesson-id="${nextLesson.id}" title="${escHtml(nextLesson.title)}">
            Next Lesson <i class="fas fa-arrow-right ml-1"></i>
        </button>`;
    }
    DOM.lessonNav.innerHTML = html;

    const prevBtn = document.getElementById('lesson-prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changeLesson(mod.id, prevBtn.dataset.lessonId));
    }
    const nextBtn = document.getElementById('lesson-next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changeLesson(mod.id, nextBtn.dataset.lessonId));
    }
}

function setupMarkComplete() {
    DOM.markCompleteBtn.addEventListener('click', () => {
        const lesson = getActiveLesson();
        if (!isItemComplete(lesson.id)) {
            markItemComplete(lesson.id);
            renderLesson();
            renderSidebar();
            updateProgress();
        }
    });
}

/* ─── Mock GraphQL Engine ─── */
const mockSchemaSDL = `# Mock schema backing this playground
type Query {
  hello: String!
  books: [Book!]!
  book(id: Int!): Book
  authors: [Author!]!
  author(id: Int!): Author
  searchBooks(q: String!): [Book!]!
}

type Mutation {
  addBook(title: String!, authorId: Int!, genre: String): Book!
  addReview(bookId: Int!, rating: Int!, comment: String): Review!
  deleteBook(id: Int!): Book
}

type Subscription {
  bookAdded: Book!
}

type Book {
  id: ID!
  title: String!
  genre: String!
  publishedYear: Int
  author: Author!
  reviews: [Review!]!
}

type Author {
  id: ID!
  name: String!
  country: String!
  books: [Book!]!
}

type Review {
  id: ID!
  rating: Int!
  comment: String
  book: Book!
}`;

const db = {
    authors: [
        { id: 1, name: 'Robert C. Martin', country: 'USA' },
        { id: 2, name: 'Martin Fowler', country: 'UK' },
        { id: 3, name: 'Gayle Laakmann McDowell', country: 'USA' },
        { id: 4, name: 'J.K. Rowling', country: 'UK' }
    ],
    books: [
        { id: 1, title: 'Clean Code', authorId: 1, genre: 'Software', publishedYear: 2008 },
        { id: 2, title: 'Refactoring', authorId: 2, genre: 'Software', publishedYear: 1999 },
        { id: 3, title: 'Cracking the Coding Interview', authorId: 3, genre: 'Interview Prep', publishedYear: 2015 },
        { id: 4, title: "Harry Potter and the Philosopher's Stone", authorId: 4, genre: 'Fantasy', publishedYear: 1997 }
    ],
    reviews: [
        { id: 1, bookId: 1, rating: 5, comment: 'A classic!' },
        { id: 2, bookId: 2, rating: 4, comment: 'Dated but essential.' },
        { id: 3, bookId: 3, rating: 5, comment: 'Gold for interviews.' },
        { id: 4, bookId: 4, rating: 4, comment: 'Magic from page one.' }
    ],
    addedBooks: []
};

db.authors.forEach(a => { a.__typeName = 'Author'; });
db.books.forEach(b => { b.__typeName = 'Book'; });
db.reviews.forEach(r => { r.__typeName = 'Review'; });

let dbCalls = 0;
let useDataLoader = false;
let subscriptionLive = false;
let nextBookEventId = 100;

function loadAuthorsNaive(id) {
    dbCalls++;
    return db.authors.find(a => a.id === id) || null;
}

function loadBookNaive(id) {
    dbCalls++;
    return db.books.find(b => b.id === id) || null;
}

function loadAuthorsBatch(ids) {
    dbCalls++;
    return db.authors.filter(a => ids.includes(a.id));
}

function loadBooksBatch(ids) {
    dbCalls++;
    return db.books.filter(b => ids.includes(b.id));
}

function loadBooksBatchForAuthors(authorIds) {
    dbCalls++;
    return db.books.filter(b => authorIds.includes(b.authorId));
}

const gqlResolvers = {
    Query: {
        hello: () => 'Hello GraphQL!',
        books: () => { dbCalls++; return db.books; },
        book: (_, { id }) => { dbCalls++; return db.books.find(b => b.id === id) || null; },
        authors: () => { dbCalls++; return db.authors; },
        author: (_, { id }) => { dbCalls++; return db.authors.find(a => a.id === id) || null; },
        searchBooks: (_, { q }) => {
            dbCalls++;
            const needle = String(q || '').toLowerCase();
            return db.books.filter(b => b.title.toLowerCase().includes(needle));
        }
    },
    Mutation: {
        addBook: (_, { title, authorId, genre }) => {
            dbCalls++;
            const nextId = db.books.reduce((m, b) => Math.max(m, b.id), 0) + 1;
            const book = { id: nextId, title: String(title), authorId: Number(authorId), genre: genre || 'Unknown', publishedYear: 2026, __typeName: 'Book' };
            db.books.push(book);
            db.addedBooks.push(book);
            return book;
        },
        addReview: (_, { bookId, rating, comment }) => {
            dbCalls++;
            const nextId = db.reviews.reduce((m, r) => Math.max(m, r.id), 0) + 1;
            const review = { id: nextId, bookId: Number(bookId), rating: Number(rating), comment: comment || '', __typeName: 'Review' };
            db.reviews.push(review);
            return review;
        },
        deleteBook: (_, { id }) => {
            dbCalls++;
            const idx = db.books.findIndex(b => b.id === Number(id));
            if (idx === -1) return null;
            const [removed] = db.books.splice(idx, 1);
            return removed;
        }
    },
    Subscription: {
        bookAdded: () => null
    },
    Book: {
        author: (book) => loadAuthorsNaive(book.authorId),
        reviews: (book) => { dbCalls++; return db.reviews.filter(r => r.bookId === book.id); }
    },
    Author: {
        books: (author) => { dbCalls++; return db.books.filter(b => b.authorId === author.id); }
    },
    Review: {
        book: (review) => loadBookNaive(review.bookId)
    }
};

const typeMap = {
    Query: { hello: 'String', books: 'Book', book: 'Book', authors: 'Author', author: 'Author', searchBooks: 'Book' },
    Mutation: { addBook: 'Book', addReview: 'Review', deleteBook: 'Book' },
    Subscription: { bookAdded: 'Book' },
    Book: { author: 'Author', reviews: 'Review' },
    Author: { books: 'Book' },
    Review: { book: 'Book' }
};

const batchableRelations = {
    Book: {
        author: { key: 'authorId', load: loadAuthorsBatch }
    },
    Author: {
        books: { key: 'id', load: loadBooksBatchForAuthors }
    },
    Review: {
        book: { key: 'bookId', load: loadBooksBatch }
    }
};

/* ─── Mini GraphQL tokenizer ─── */
function tokenize(src) {
    const tokens = [];
    let i = 0;
    const n = src.length;
    while (i < n) {
        const ch = src[i];
        if (/\s/.test(ch)) { i++; continue; }
        if (ch === '#') { while (i < n && src[i] !== '\n') i++; continue; }
        if (ch === '/' && src[i + 1] === '*') {
            i += 2;
            while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
            i += 2;
            continue;
        }
        if (ch === '{') { tokens.push({ type: '{', value: '{' }); i++; continue; }
        if (ch === '}') { tokens.push({ type: '}', value: '}' }); i++; continue; }
        if (ch === '(') { tokens.push({ type: '(', value: '(' }); i++; continue; }
        if (ch === ')') { tokens.push({ type: ')', value: ')' }); i++; continue; }
        if (ch === ':') { tokens.push({ type: ':', value: ':' }); i++; continue; }
        if (ch === ',') { i++; continue; }
        if (ch === '!') { tokens.push({ type: '!', value: '!' }); i++; continue; }
        if (ch === '=') { tokens.push({ type: '=', value: '=' }); i++; continue; }
        if (ch === '$') {
            i++;
            let name = '';
            while (i < n && /[\w]/.test(src[i])) { name += src[i]; i++; }
            tokens.push({ type: 'VARIABLE', value: '$' + name });
            continue;
        }
        if (ch === '.') {
            let dots = 0;
            while (i < n && src[i] === '.') { dots++; i++; }
            tokens.push({ type: 'SPREAD', value: '...' });
            continue;
        }
        if (ch === '"') {
            if (src[i + 1] === '"' && src[i + 2] === '"') {
                i += 3;
                let s = '';
                while (i < n && !(src[i] === '"' && src[i + 1] === '"' && src[i + 2] === '"')) { s += src[i]; i++; }
                i += 3;
                tokens.push({ type: 'STRING', value: s });
                continue;
            }
            i++;
            let s = '';
            while (i < n && src[i] !== '"') {
                if (src[i] === '\\' && i + 1 < n) { s += src[i] + src[i + 1]; i += 2; continue; }
                s += src[i]; i++;
            }
            i++;
            tokens.push({ type: 'STRING', value: s });
            continue;
        }
        if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(src[i + 1]))) {
            let num = '';
            while (i < n && /[0-9.eE\-+]/.test(src[i])) { num += src[i]; i++; }
            tokens.push({ type: 'NUMBER', value: num });
            continue;
        }
        if (/[\w_]/.test(ch)) {
            let name = '';
            while (i < n && /[\w_]/.test(src[i])) { name += src[i]; i++; }
            tokens.push({ type: 'NAME', value: name });
            continue;
        }
        throw new Error('Unexpected character: "' + ch + '"');
    }
    return tokens;
}

/* ─── Mini GraphQL parser ─── */
function parseGraphQL(src) {
    const tokens = tokenize(src);
    let pos = 0;

    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }
    function expect(type) {
        const t = next();
        if (!t || t.type !== type) {
            throw new Error('Expected ' + type + ' but got ' + (t ? t.value : 'end of input'));
        }
        return t;
    }
    function expectName(value) {
        const t = next();
        if (!t || t.type !== 'NAME' || t.value !== value) {
            throw new Error('Expected "' + value + '", got ' + (t ? t.value : 'end of input'));
        }
        return t;
    }
    function parseName() {
        const t = next();
        if (!t || t.type !== 'NAME') throw new Error('Expected a name, got ' + (t ? t.value : 'end of input'));
        return t.value;
    }
    function parseValue() {
        const t = peek();
        if (!t) throw new Error('Unexpected end of input inside a value');
        if (t.type === 'STRING') { next(); return t.value; }
        if (t.type === 'NUMBER') { next(); return Number(t.value); }
        if (t.type === 'NAME') {
            next();
            if (t.value === 'true') return true;
            if (t.value === 'false') return false;
            if (t.value === 'null') return null;
            return t.value;
        }
        if (t.type === 'VARIABLE') { next(); return { kind: 'Variable', name: t.value.slice(1) }; }
        if (t.type === '[') {
            next();
            const items = [];
            while (peek() && peek().type !== ']') items.push(parseValue());
            expect(']');
            return items;
        }
        if (t.type === '{') {
            next();
            const obj = {};
            while (peek() && peek().type !== '}') {
                const k = parseName();
                expect(':');
                obj[k] = parseValue();
            }
            expect('}');
            return obj;
        }
        throw new Error('Unexpected token in value: ' + t.value);
    }
    function parseArguments() {
        if (!peek() || peek().type !== '(') return null;
        next();
        const args = {};
        while (peek() && peek().type !== ')') {
            const name = parseName();
            expect(':');
            args[name] = parseValue();
        }
        expect(')');
        return args;
    }
    function parseSelectionSet() {
        expect('{');
        const selections = [];
        while (peek() && peek().type !== '}') {
            if (peek().type === 'SPREAD') {
                next();
                if (peek() && peek().type === 'NAME' && peek().value === 'on') {
                    next();
                    const typeName = parseName();
                    selections.push({ kind: 'InlineFragment', typeName, selectionSet: parseSelectionSet() });
                } else {
                    selections.push({ kind: 'FragmentSpread', name: parseName() });
                }
            } else {
                let name = parseName();
                let alias = null;
                if (peek() && peek().type === ':') {
                    next();
                    alias = name;
                    name = parseName();
                }
                const args = parseArguments();
                let selectionSet = null;
                if (peek() && peek().type === '{') selectionSet = parseSelectionSet();
                selections.push({ kind: 'Field', alias, name, args, selectionSet });
            }
        }
        expect('}');
        return selections;
    }
    function parseTypeRef() {
        let t = next();
        if (!t) throw new Error('Unexpected end in type reference');
        if (t.type === '[') {
            parseTypeRef();
            expect(']');
        } else if (t.type !== 'NAME') {
            throw new Error('Bad type reference: ' + t.value);
        }
        if (peek() && peek().type === '!') next();
    }
    function parseOperation() {
        let operation = 'query';
        let name = null;
        const t = peek();
        if (t && t.type === 'NAME' && (t.value === 'query' || t.value === 'mutation' || t.value === 'subscription')) {
            next();
            operation = t.value;
            if (peek() && peek().type === 'NAME') name = parseName();
            if (peek() && peek().type === '(') {
                next();
                while (peek() && peek().type !== ')') {
                    if (peek().type === 'VARIABLE') {
                        next();
                        expect(':');
                        parseTypeRef();
                        if (peek() && peek().type === '=') { next(); parseValue(); }
                    } else {
                        next();
                    }
                }
                expect(')');
            }
        }
        return { kind: 'Operation', operation, name, selectionSet: parseSelectionSet() };
    }

    const fragments = {};
    let operation = null;
    while (pos < tokens.length) {
        const t = peek();
        if (!t) break;
        if (t.type === 'NAME' && t.value === 'fragment') {
            next();
            const fragName = parseName();
            expectName('on');
            const typeName = parseName();
            fragments[fragName] = { typeName, selectionSet: parseSelectionSet() };
        } else if (t.type === 'NAME' && (t.value === 'query' || t.value === 'mutation' || t.value === 'subscription')) {
            operation = parseOperation();
        } else if (t.type === '{') {
            operation = { kind: 'Operation', operation: 'query', name: null, selectionSet: parseSelectionSet() };
        } else {
            next();
        }
    }
    if (!operation) throw new Error('No GraphQL operation found in the query.');
    return { operation, fragments };
}

/* ─── Executor ─── */
function resolveArgs(args) {
    if (!args) return {};
    const out = {};
    for (const k in args) {
        let v = args[k];
        if (v && v.kind === 'Variable') v = undefined;
        out[k] = v;
    }
    return out;
}

function childTypeName(typeName, fieldName, value) {
    if (typeMap[typeName] && typeMap[typeName][fieldName]) return typeMap[typeName][fieldName];
    if (Array.isArray(value) && value.length > 0 && value[0].__typeName) return value[0].__typeName;
    if (value && value.__typeName) return value.__typeName;
    return 'String';
}

function resolveSelection(value, selectionSet, typeName, fragments) {
    if (!selectionSet) return value;
    if (Array.isArray(value)) {
        if (useDataLoader) return resolveArrayWithBatching(value, selectionSet, typeName, fragments);
        return value.map(item => resolveSelection(item, selectionSet, typeName, fragments));
    }
    if (value === null || value === undefined) return null;

    const result = {};
    const raw = selectionSet;
    for (let i = 0; i < raw.length; i++) {
        const sel = raw[i];
        if (sel.kind === 'Field') {
            const subValue = resolveFieldValue(typeName, sel, value);
            const childType = childTypeName(typeName, sel.name, subValue);
            result[sel.alias || sel.name] = resolveSelection(subValue, sel.selectionSet, childType, fragments);
        } else if (sel.kind === 'InlineFragment') {
            if (sel.typeName === typeName) {
                Object.assign(result, resolveSelection(value, sel.selectionSet, typeName, fragments));
            }
        } else if (sel.kind === 'FragmentSpread') {
            const frag = fragments[sel.name];
            if (frag) Object.assign(result, resolveSelection(value, frag.selectionSet, frag.typeName, fragments));
        }
    }
    return result;
}

function resolveArrayWithBatching(items, selectionSet, typeName, fragments) {
    const results = items.map(() => ({}));

    for (let i = 0; i < selectionSet.length; i++) {
        const sel = selectionSet[i];
        if (sel.kind === 'Field') {
            const rel = batchableRelations[typeName] && batchableRelations[typeName][sel.name];
            if (rel) {
                const keys = items.map(item => item[rel.key]);
                const loaded = rel.load(keys);
                const mapByKey = {};
                loaded.forEach(v => { mapByKey[v.id] = v; });
                const relType = (typeMap[typeName] && typeMap[typeName][sel.name]) || 'String';
                items.forEach((item, idx) => {
                    const val = mapByKey[item[rel.key]] || null;
                    results[idx][sel.alias || sel.name] = resolveSelection(val, sel.selectionSet, relType, fragments);
                });
            } else {
                items.forEach((item, idx) => {
                    const subValue = resolveFieldValue(typeName, sel, item);
                    const childType = childTypeName(typeName, sel.name, subValue);
                    results[idx][sel.alias || sel.name] = resolveSelection(subValue, sel.selectionSet, childType, fragments);
                });
            }
        } else if (sel.kind === 'InlineFragment') {
            if (sel.typeName === typeName) {
                items.forEach((item, idx) => {
                    Object.assign(results[idx], resolveSelection(item, sel.selectionSet, typeName, fragments));
                });
            }
        } else if (sel.kind === 'FragmentSpread') {
            const frag = fragments[sel.name];
            if (frag) {
                items.forEach((item, idx) => {
                    Object.assign(results[idx], resolveSelection(item, frag.selectionSet, frag.typeName, fragments));
                });
            }
        }
    }
    return results;
}

function resolveFieldValue(typeName, sel, parent) {
    const resolver = gqlResolvers[typeName] && gqlResolvers[typeName][sel.name];
    if (resolver) {
        return resolver(parent, resolveArgs(sel.args), {});
    }
    if (parent && sel.name in parent) return parent[sel.name];
    return null;
}

function executeOperation(ast) {
    const { operation, fragments } = ast;

    if (operation.operation === 'subscription') {
        return {
            data: null,
            info: 'Subscriptions are long-lived event streams. Use the Subscribe + Publish Event buttons below the response panel to watch live bookAdded events.'
        };
    }

    const rootType = operation.operation === 'mutation' ? 'Mutation' : 'Query';
    const rootResolver = gqlResolvers[rootType] || {};
    const result = {};
    const errors = [];

    for (let i = 0; i < operation.selectionSet.length; i++) {
        const sel = operation.selectionSet[i];
        if (sel.kind === 'Field') {
            const resolver = rootResolver[sel.name];
            if (!resolver) {
                errors.push('Cannot query field "' + sel.name + '" on type "' + rootType + '".');
                continue;
            }
            try {
                const value = resolver({}, resolveArgs(sel.args), {});
                const childType = childTypeName(rootType, sel.name, value);
                result[sel.alias || sel.name] = resolveSelection(value, sel.selectionSet, childType, fragments);
            } catch (e) {
                errors.push(e.message);
            }
        } else if (sel.kind === 'InlineFragment') {
            if (sel.typeName === rootType) {
                for (let j = 0; j < sel.selectionSet.length; j++) {
                    const inner = sel.selectionSet[j];
                    if (inner.kind === 'Field') {
                        const resolver = rootResolver[inner.name];
                        if (!resolver) {
                            errors.push('Cannot query field "' + inner.name + '" on type "' + rootType + '".');
                            continue;
                        }
                        const value = resolver({}, resolveArgs(inner.args), {});
                        const childType = childTypeName(rootType, inner.name, value);
                        result[inner.alias || inner.name] = resolveSelection(value, inner.selectionSet, childType, fragments);
                    }
                }
            }
        } else if (sel.kind === 'FragmentSpread') {
            const frag = fragments[sel.name];
            if (frag && frag.typeName === rootType) {
                for (let j = 0; j < frag.selectionSet.length; j++) {
                    const inner = frag.selectionSet[j];
                    if (inner.kind === 'Field') {
                        const resolver = rootResolver[inner.name];
                        if (!resolver) {
                            errors.push('Cannot query field "' + inner.name + '" on type "' + rootType + '".');
                            continue;
                        }
                        const value = resolver({}, resolveArgs(inner.args), {});
                        const childType = childTypeName(rootType, inner.name, value);
                        result[inner.alias || inner.name] = resolveSelection(value, inner.selectionSet, childType, fragments);
                    }
                }
            }
        }
    }

    return { data: result, errors };
}

/* ─── Playground ─── */
function loadCode() {
    const lesson = getActiveLesson();
    if (lesson.defaultCode) {
        DOM.codeEditor.value = lesson.defaultCode;
    }
    DOM.activeModuleTitle.textContent = getActiveModule().title + ' — Playground';
    setStatus('idle', false);
    DOM.dbCalls.textContent = '0 db calls';
}

function setStatus(text, isError) {
    DOM.responseStatus.textContent = text;
    DOM.responseStatus.classList.remove('ok', 'err');
    DOM.responseStatus.classList.add(isError ? 'err' : 'ok');
}

function runCode() {
    const code = DOM.codeEditor.value.trim();
    if (!code) {
        DOM.outputFrame.innerHTML = '<div class="output-info">Please enter a GraphQL query or mutation first.</div>';
        setStatus('400 Bad Request', true);
        return;
    }

    let ast;
    try {
        ast = parseGraphQL(code);
    } catch (e) {
        DOM.outputFrame.innerHTML = '<div class="output-error">Syntax Error: ' + escHtml(e.message) + '</div>';
        setStatus('400 Bad Request', true);
        return;
    }

    dbCalls = 0;
    const start = Date.now();
    let response;
    try {
        response = executeOperation(ast);
    } catch (e) {
        DOM.outputFrame.innerHTML = '<div class="output-error">Execution Error: ' + escHtml(e.message) + '</div>';
        setStatus('500 Internal Server Error', true);
        return;
    }
    const elapsed = Date.now() - start;

    let html = '';
    if (response.errors && response.errors.length > 0) {
        html += response.errors.map(e => '<div class="output-error">error: ' + escHtml(e) + '</div>').join('');
    }
    if (response.info) {
        html += '<div class="output-info">' + escHtml(response.info) + '</div>';
    }
    if (response.data && Object.keys(response.data).length > 0) {
        html += '<div class="output-success">' + escHtml(JSON.stringify(response.data, null, 2)) + '</div>';
    }
    if (html === '') {
        html = '<div class="output-info">Empty response.</div>';
    }

    DOM.outputFrame.innerHTML = html;
    setStatus(response.errors && response.errors.length > 0 ? '400 Bad Request' : '200 OK (' + elapsed + ' ms)', !!(response.errors && response.errors.length > 0));
    DOM.dbCalls.textContent = dbCalls + ' db call' + (dbCalls === 1 ? '' : 's');
}

function setupPlayground() {
    DOM.runCodeBtn.addEventListener('click', runCode);
    DOM.resetCodeBtn.addEventListener('click', () => {
        DOM.codeEditor.value = getActiveLesson().defaultCode || '';
    });
    DOM.clearOutputBtn.addEventListener('click', () => {
        DOM.outputFrame.innerHTML = '<div class="output-placeholder"><i class="fa-solid fa-play-circle"></i><p>Write a query or mutation, then click <strong>Run Query</strong></p></div>';
        setStatus('idle', false);
        DOM.dbCalls.textContent = '0 db calls';
    });

    DOM.dataLoaderToggle.addEventListener('click', () => {
        useDataLoader = !useDataLoader;
        DOM.dataLoaderToggle.classList.toggle('off', !useDataLoader);
        DOM.dataLoaderToggle.innerHTML = useDataLoader
            ? '<i class="fa-solid fa-layer-group"></i> DataLoader: ON'
            : '<i class="fa-solid fa-layer-group"></i> DataLoader';
    });

    DOM.codeEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = DOM.codeEditor.selectionStart;
            const end = DOM.codeEditor.selectionEnd;
            DOM.codeEditor.value = DOM.codeEditor.value.substring(0, start) + '  ' + DOM.codeEditor.value.substring(end);
            DOM.codeEditor.selectionStart = DOM.codeEditor.selectionEnd = start + 2;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });
}

/* ─── SDL Schema Modal ─── */
function setupSchemaModal() {
    DOM.schemaBtn.addEventListener('click', () => {
        DOM.schemaContent.innerHTML = '';
        const lines = mockSchemaSDL.split('\n');
        let html = '';
        lines.forEach(line => {
            if (line.trim().startsWith('#')) {
                html += '<span class="schema-comment">' + escHtml(line) + '</span>\n';
            } else {
                html += escHtml(line) + '\n';
            }
        });
        DOM.schemaContent.innerHTML = html;
        DOM.schemaModal.classList.add('active');
    });
    const close = () => DOM.schemaModal.classList.remove('active');
    DOM.schemaCloseBtn.addEventListener('click', close);
    DOM.schemaModal.addEventListener('click', (e) => {
        if (e.target === DOM.schemaModal) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
}

/* ─── Subscriptions Feed ─── */
function renderSubEmpty() {
    DOM.subFeedBody.innerHTML = '<div class="sub-empty">Not subscribed yet. Click <strong>Subscribe</strong> to listen for <code>bookAdded</code> events.</div>';
}

function toggleSubscription() {
    subscriptionLive = !subscriptionLive;
    DOM.subToggleBtn.classList.toggle('off', !subscriptionLive);
    DOM.subIndicator.classList.toggle('live', subscriptionLive);
    DOM.subToggleBtn.innerHTML = subscriptionLive
        ? '<i class="fa-solid fa-rss"></i> Subscribed'
        : '<i class="fa-solid fa-rss"></i> Subscribe';
    if (subscriptionLive) {
        DOM.subFeedBody.innerHTML = '<div class="sub-empty">Listening for <code>bookAdded</code> events... Press <strong>Publish Event</strong> to simulate one.</div>';
    } else {
        renderSubEmpty();
    }
}

function publishSubscriptionEvent() {
    const titles = [
        'The Clean Coder',
        'Domain-Driven Design',
        'Algorithms Unlocked',
        'The GraphQL Guide',
        'Designing Data-Intensive Applications',
        'System Design Interview',
        'A Thousand Splendid Suns',
        'The Pragmatic Programmer'
    ];
    const authorId = Math.floor(Math.random() * db.authors.length) + 1;
    const nextId = db.books.reduce((m, b) => Math.max(m, b.id), 0) + 1;
    const book = {
        id: nextId,
        title: titles[Math.floor(Math.random() * titles.length)],
        authorId,
        genre: 'New Release',
        publishedYear: 2026,
        __typeName: 'Book'
    };

    if (subscriptionLive) {
        const author = db.authors.find(a => a.id === authorId);
        db.books.push(book);
        db.addedBooks.push(book);
        const stamp = new Date().toLocaleTimeString();
        const eventHtml =
            '<div class="sub-event">' +
            '<div class="sub-event-meta">event: bookAdded &nbsp;•&nbsp; ' + escHtml(stamp) + '</div>' +
            escHtml(JSON.stringify({
                bookAdded: {
                    id: book.id,
                    title: book.title,
                    author: author ? { name: author.name } : null
                }
            }, null, 2)) +
            '</div>';
        DOM.subFeedBody.insertAdjacentHTML('afterbegin', eventHtml);
    } else {
        DOM.subFeedBody.innerHTML = '<div class="sub-empty">No subscription active — event not delivered. Click <strong>Subscribe</strong> first.</div>';
    }
}

function setupSubscriptions() {
    DOM.subToggleBtn.addEventListener('click', toggleSubscription);
    DOM.subSimulateBtn.addEventListener('click', publishSubscriptionEvent);
}

/* ─── Quiz ─── */
function renderQuiz() {
    const mod = getActiveModule();
    const quizId = mod.id + '-quiz';
    const isCompleted = isItemComplete(quizId);

    if (!mod.quiz || mod.quiz.length === 0) {
        DOM.quizContainer.innerHTML = `
            <div class="quiz-container" style="text-align:center; padding:3rem;">
                <i class="fa-solid fa-clipboard-check" style="font-size:3rem; color:#e10098; opacity:0.5; margin-bottom:1rem;"></i>
                <h3 style="font-family:var(--font-display); color:#475569; margin-bottom:0.5rem;">No Quiz Available</h3>
                <p style="color:#94a3b8; font-size:0.9rem;">This module doesn't have a quiz yet. Continue to the next module.</p>
            </div>
        `;
        DOM.activeModuleTitle.textContent = mod.title + ' — Quiz';
        return;
    }

    DOM.activeModuleTitle.textContent = mod.title + ' — Quiz';

    let html = `<h2 style="font-family:var(--font-display); font-size:1.5rem; margin-bottom:1.5rem; color:#1e293b;">
        ${escHtml(mod.title)} Quiz
    </h2>`;

    mod.quiz.forEach((q, idx) => {
        const selected = state.quizAnswers[q.id];
        const showResult = isCompleted;

        html += `
            <div class="quiz-question-card">
                <div class="quiz-question-number">Question ${idx + 1} of ${mod.quiz.length}</div>
                <div class="quiz-question-text">${escHtml(q.question)}</div>
                <div class="quiz-options">
                    ${q.options.map((opt, optIdx) => {
                        let classes = 'quiz-option';
                        if (selected === optIdx) classes += ' selected';
                        if (showResult && optIdx === q.correct) classes += ' correct';
                        if (showResult && selected === optIdx && optIdx !== q.correct) classes += ' incorrect';
                        return `
                            <div class="${classes}" data-question-id="${q.id}" data-option-index="${optIdx}">
                                <input type="radio" name="quiz-${q.id}" value="${optIdx}" 
                                    ${selected === optIdx ? 'checked' : ''} ${showResult ? 'disabled' : ''}>
                                <label>${escHtml(opt)}</label>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    if (!isCompleted) {
        const allAnswered = mod.quiz.every(q => state.quizAnswers[q.id] !== undefined);
        html += `
            <div class="quiz-submit-section">
                <button id="submit-quiz-btn" class="quiz-submit-btn" ${!allAnswered ? 'disabled' : ''}>
                    <i class="fas fa-paper-plane"></i> Submit Quiz
                </button>
            </div>
        `;
    }

    if (isCompleted) {
        html += `
            <div class="quiz-result quiz-result--pass">
                <i class="fas fa-check-circle"></i> Perfect! Module Complete!
            </div>
        `;
    } else if (state.quizSubmitted) {
        const score = mod.quiz.filter(q => state.quizAnswers[q.id] === q.correct).length;
        const total = mod.quiz.length;
        html += `
            <div class="quiz-result quiz-result--fail">
                <i class="fas fa-redo-alt"></i> Score: ${score}/${total} — Adjust your answers and try again.
            </div>
        `;
    }

    DOM.quizContainer.innerHTML = html;
}

function submitQuiz() {
    const mod = getActiveModule();
    state.quizSubmitted = true;
    let score = 0;

    mod.quiz.forEach(q => {
        if (state.quizAnswers[q.id] === q.correct) score++;
    });

    const quizId = mod.id + '-quiz';
    if (score === mod.quiz.length) {
        markItemComplete(quizId);
        renderSidebar();
        updateProgress();
    }

    renderQuiz();
}

function setupQuiz() {
    DOM.quizContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.quiz-option');
        if (option && option.dataset.questionId && option.dataset.optionIndex) {
            const module = getActiveModule();
            const quizId = module.id + '-quiz';
            if (isItemComplete(quizId)) return;
            state.quizSubmitted = false;
            state.quizAnswers[option.dataset.questionId] = parseInt(option.dataset.optionIndex);
            renderQuiz();
            return;
        }

        const submitBtn = e.target.closest('#submit-quiz-btn');
        if (submitBtn && !submitBtn.disabled) {
            submitQuiz();
        }
    });
}

/* ─── Mobile Sidebar ─── */
function openSidebar() {
    DOM.sidebar.classList.add('open');
    DOM.sidebarOverlay.classList.add('active');
}

function closeSidebar() {
    DOM.sidebar.classList.remove('open');
    DOM.sidebarOverlay.classList.remove('active');
}

function setupSidebar() {
    DOM.openSidebarBtn.addEventListener('click', openSidebar);
    DOM.closeSidebarBtn.addEventListener('click', closeSidebar);
    DOM.sidebarOverlay.addEventListener('click', closeSidebar);

    DOM.moduleList.addEventListener('click', (e) => {
        const lessonBtn = e.target.closest('.sidebar-lesson-btn');
        if (lessonBtn && lessonBtn.dataset.moduleId && lessonBtn.dataset.lessonId) {
            changeLesson(lessonBtn.dataset.moduleId, lessonBtn.dataset.lessonId);
            return;
        }
        const btn = e.target.closest('.sidebar-module-btn');
        if (btn && btn.dataset.moduleId) {
            changeModule(btn.dataset.moduleId);
        }
    });
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    loadProgress();
    setupSidebar();
    setupPlayground();
    setupSchemaModal();
    setupSubscriptions();
    setupMarkComplete();
    setupQuiz();

    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    renderSubEmpty();
    renderSidebar();
    renderLesson();
    updateProgress();
});
