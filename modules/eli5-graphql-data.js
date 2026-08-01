/**
 * ELI5 (Explain Like I'm 5) content for GraphQL Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5GraphqlData = {
  // ─── Module 1: SDL & Types ───

  'sdl-types-1': `
    <p><strong>GraphQL's SDL</strong> is like a <strong>restaurant menu</strong>. Before you order food, you need to know what dishes exist, what comes in them, and whether a dish is always available or sometimes "sold out."</p>
    <p>In SDL, you write down every "dish" the API offers. Each dish has a name (like <code>title</code>) and a type (like <code>String</code>).</p>
    <ul>
      <li><strong>Scalars</strong> are the basic ingredients — <code>String</code> (text), <code>Int</code> (whole number), <code>Boolean</code> (yes/no), <code>Float</code> (decimal), and <code>ID</code> (a tag number).</li>
      <li><strong>Object types</strong> are full dishes made of several ingredients — like a <code>Book</code> with a title, genre, and publication year.</li>
      <li><strong>Non-null (<code>!</code>)</strong> is like a kitchen guarantee: "This dish will ALWAYS come with fries." A field with <code>!</code> promises it will never be empty.</li>
      <li><strong>Lists (<code>[Book!]!</code>)</strong> are like a sampler platter — you always get a tray, and every item on it is guaranteed full-size.</li>
    </ul>
    <p><strong>In short:</strong> the SDL is the menu the client reads before ordering data. It tells everyone exactly what they can ask for and what they'll always get back.</p>
  `,

  'sdl-types-2': `
    <p>These extra SDL types are like <strong>special menu features</strong> that make the menu (the schema) easier to understand.</p>
    <ul>
      <li><strong>Enums</strong> are like a <strong>fixed-choice order form</strong> — "Choose one: SMALL, MEDIUM, LARGE." You can only pick from the listed options, so no surprises.</li>
      <li><strong>Interfaces</strong> are like a <strong>base recipe</strong> that several dishes share. A <code>Media</code> interface says "everything in here has a title." A <code>Book</code> adds pages, a <code>Film</code> adds runtime. You ask for the shared part, then use "…on Book" to get the extras.</li>
      <li><strong>Unions</strong> are like a <strong>mystery box</strong> — "This could be a Book OR an Author, we'll find out when it arrives." No shared fields guaranteed, just one of the listed types.</li>
      <li><strong>Inputs</strong> are like a <strong>custom-order card</strong> — when you want to order something with lots of options, you fill in one card instead of shouting every option separately.</li>
    </ul>
    <p><strong>In short:</strong> <code>type</code> = what you can receive. <code>input</code> = how you send a complex order. <code>enum</code> = fixed choices. <code>interface</code>/<code>union</code> = "one of several kinds."</p>
  `,

  // ─── Module 2: Queries & Mutations ───

  'queries-mutations-1': `
    <p><strong>Queries</strong> are like <strong>shopping with a precise list</strong>. Instead of buying the whole store (like a REST API often forces you to), you write exactly what you want: "Give me each book's id and title — and nothing else."</p>
    <ul>
      <li><strong>Field selection</strong> — you only grab the shelves you need.</li>
      <li><strong>Arguments</strong> — like saying "show me book number 2," not every book.</li>
      <li><strong>Aliases</strong> — like labeling two baskets: "box one = all books, box two = just book 1." If both were labeled "results," they'd get mixed up. Aliases give each result its own name so they don't collide.</li>
      <li><strong>Operation names</strong> — naming a query (like <code>query Library</code>) is like putting a sticker on your shopping list so everyone can see what it's for.</li>
      <li><strong>Variables</strong> — keep the list reusable: "give me a book with THIS id," and you swap the id each time without rewriting the whole list.</li>
    </ul>
    <p><strong>In short:</strong> queries are precise shopping lists. One trip to the store gets everything — no running back and forth.</p>
  `,

  'queries-mutations-2': `
    <p><strong>Mutations</strong> are like <strong>changing a library's shelves</strong> — you're adding, fixing, or removing a book. After any change, the librarian (the server) tells you what the shelf now looks like.</p>
    <ul>
      <li><strong>Return the changed thing</strong> — if you add a book, the server should hand you the book (with its new id) so your app knows what just happened. Don't just say "okay!"</li>
      <li><strong>Order matters</strong> — mutations run one at a time, top to bottom, like steps in a recipe. You can't frost the cake before it's baked. That's why a mutation that needs the result of an earlier mutation works — the first one finishes first.</li>
      <li><strong>Name it</strong> — <code>mutation CreateBook</code> makes logs readable, like labeling a workflow step.</li>
      <li><strong>Big orders use <code>input</code></strong> — many arguments is like filling a single form instead of shouting each field separately.</li>
    </ul>
    <p><strong>In short:</strong> queries read, mutations write. Mutations always report back what changed so your app stays in sync.</p>
  `,

  // ─── Module 3: Resolvers & N+1 ───

  'resolvers-n1-1': `
    <p><strong>Resolvers</strong> are like <strong>factory workers</strong> behind a store. When a customer (the client) asks for data, each worker is responsible for one specific shelf and goes to get exactly what was asked for.</p>
    <p>Every field on the schema has a worker. The <code>book(id: 2)</code> worker goes to the database and grabs book 2. Then the <code>title</code> worker reads the label, and the <code>author</code> worker goes to the authors shelf to fetch the author who wrote it.</p>
    <p>Each worker gets three things:</p>
    <ul>
      <li><strong>parent</strong> — what the previous worker handed them (like a note saying "this is book 2").</li>
      <li><strong>args</strong> — the extras in the order ("id: 2!").</li>
      <li><strong>context</strong> — shared info for the whole shift, like who's asking and which database to use.</li>
    </ul>
    <p><strong>In short:</strong> resolvers are the workers who fetch each field. GraphQL sends your selection tree to the right workers, level by level.</p>
  `,

  'resolvers-n1-2': `
    <p>The <strong>N+1 problem</strong> is like a <strong>messy warehouse trip</strong>. Imagine a customer asks for 10 books, and for each book you make a separate trip to the authors' room just to read the author's name. 10 books = 10 extra trips. That's 1 trip for the books + 10 trips for authors = <strong>11 trips</strong> for a tiny order!</p>
    <p><strong>DataLoader</strong> is the <strong>clever warehouse manager</strong>. Instead of making 10 trips, the manager listens for a moment, collects ALL the author ids being asked for ("book 1 needs author 1, book 2 needs author 2, …"), and then takes <strong>ONE single trip</strong> to grab every author at once. Back at the counter, they hand each book its own author.</p>
    <p>The key trick: the manager gathers the requests within one "tick" of time, batches them into one database query, then sorts the results back to the right books.</p>
    <p><strong>Important:</strong> this cleverness is per-request only. You can't reuse last customer's trip — every request gets a fresh manager, so no mix-ups and no stale data.</p>
    <p><strong>In short:</strong> N+1 = one trip per item. DataLoader = one combined trip for everyone, then hand out the results.</p>
  `,

  // ─── Module 4: Subscriptions ───

  'subscriptions-1': `
    <p><strong>Subscriptions</strong> are like <strong>getting a push notification</strong> instead of constantly checking your phone. With polling you'd refresh the page every second to see if anything changed. A subscription is like subscribing to a channel — the moment something happens, you get pinged.</p>
    <p>In the playground, when you click <strong>Subscribe</strong>, you're "joining the channel." Then every time you press <strong>Publish Event</strong>, it's like someone dropping a new book on the shelf — you instantly get notified with the new book's details. No refresh needed!</p>
    <p>A subscription has three parts on the server:</p>
    <ul>
      <li><strong>subscribe</strong> — opens the channel (joins the pub/sub topic).</li>
      <li><strong>resolve</strong> — decides what details each notification carries.</li>
      <li><strong>trigger</strong> — the "news source" that fires the event (like a mailbox where notifications are dropped).</li>
    </ul>
    <p><strong>In short:</strong> subscriptions are push notifications for data. The server tells you when something changes — you don't keep asking.</p>
  `,

  'subscriptions-2': `
    <p>Building subscriptions well is like setting up a <strong>school broadcast system</strong>.</p>
    <p><strong>Pub/Sub</strong> is the PA system: publishers drop announcements into a topic (like "BOOK_ADDED"), and the system forwards them to everyone subscribed. It's a middleman so senders and listeners never have to know each other.</p>
    <p><strong>withFilter</strong> is like telling the PA operator: "Only broadcast this to students in the Art Club." Instead of pinging every subscriber, the filter checks each event against what the subscriber cares about (e.g., "only books by author 2") and only delivers the ones that match.</p>
    <p><strong>Client hooks</strong> are like a student with a special radio. The student sets up the radio (the <code>useSubscription</code> hook), and every time a matching broadcast comes in, the radio automatically adds it to their notepad (the component's state).</p>
    <p>But remember — you don't need a broadcast system for every little thing! If data barely changes, just ask for it fresh when needed (polling). Subscriptions are for when freshness really matters.</p>
    <p><strong>In short:</strong> Pub/Sub = the PA system. withFilter = only notify the interested people. useSubscription = the always-on radio that updates your app live.</p>
  `,

  // ─── Module 5: Apollo Client ───

  'apollo-client-1': `
    <p><strong>Apollo Client</strong> is like a <strong>smart personal shopper</strong> in your app. You tell it which data your screen needs, and it fetches, remembers, and re-serves it automatically.</p>
    <p>The <code>useQuery</code> hook is like telling the shopper a shopping list: "I need all books and their authors." The shopper returns three statuses:</p>
    <ul>
      <li><strong>loading</strong> — "still in the store."</li>
      <li><strong>error</strong> — "there was a problem, here's what happened."</li>
      <li><strong>data</strong> — "here's everything you asked for!"</li>
    </ul>
    <p>Apollo also keeps a <strong>memory</strong> (the cache). It files every returned item under its ID, like a library catalog. If two different screens ask for the same book, Apollo can often answer from memory instead of fetching again — fast!</p>
    <p>With <strong>variables</strong>, you hand the shopper a new note each time: "this time, get book id 7." Change the note, and Apollo fetches the right item.</p>
    <p><strong>In short:</strong> Apollo Client is your personal shopper — you declare what you need, and it fetches, remembers, and keeps your UI in sync.</p>
  `,

  'apollo-client-2': `
    <p>After a mutation (a change), Apollo needs to update its <strong>memory</strong> — otherwise your screen shows stale info, like a price tag that wasn't updated after a sale.</p>
    <p>Three ways to keep things fresh:</p>
    <ul>
      <li><strong>Refetch</strong> — like telling the shopper "go re-buy the same list after the change." Simple and always correct, just a bit slower.</li>
      <li><strong>Update the cache</strong> — like writing the new price on the tag yourself, instantly. Great for snappy apps. You read the current list from memory, add the new item, and write it back.</li>
      <li><strong>Fragments</strong> — like a shared <strong>recipe card</strong>. Instead of retyping "id, title, genre" everywhere, you write it once as a <code>fragment</code> and reuse it in many queries and mutations. Change it in one place, and all users of the fragment stay in sync.</li>
    </ul>
    <p>One catch: Apollo files items under their <strong>ID</strong>. If a mutation doesn't return the item's <code>id</code>, Apollo can't find the right drawer to update — so always ask for the <code>id</code> back.</p>
    <p><strong>In short:</strong> after changes, refetch, update memory directly, or reuse fragments — and always get the id back so the filing system works.</p>
  `,

  // ─── Module 6: Federation & Security ───

  'federation-security-1': `
    <p><strong>Federation</strong> is like <strong>several teams building one giant mall together</strong>. Team Books runs the book store, Team Users runs the review counters. Each team owns and updates its own shop independently — but to customers (clients), it all feels like ONE mall with one entrance.</p>
    <p>Each shop contributes a <strong>subgraph</strong> (its own mini-menu of data). A central router acts as the mall's <strong>directory</strong> — it combines every shop's menu into one big <strong>supergraph</strong>.</p>
    <p>When a customer asks "give me books and their reviews," the router knows: book titles come from the Book shop, reviews come from the Users shop. It asks both shops, gathers the answers, and hands the customer one combined receipt.</p>
    <p>Team Books and Team Users coordinate by sharing a <strong>key</strong> (like a shared customer loyalty number) so the mall can match books to their reviews.</p>
    <p><strong>In short:</strong> federation = one mall, many independently-run shops, one directory at the entrance. Clients never see the walls between shops.</p>
  `,

  'federation-security-2': `
    <p>Keeping a GraphQL API safe is like <strong>securing a library</strong> where patrons can ask any question they want. The problem: a clever visitor might ask a question so deep and huge it makes the librarians work forever!</p>
    <p>Example attack: "show me book → its author → their books → the author → their books → …" — endless nesting. We need <strong>rules</strong>:</p>
    <ul>
      <li><strong>Depth limit</strong> — "questions can only go this deep." Like a sign: no questions beyond 8 levels.</li>
      <li><strong>Cost analysis</strong> — every field costs "effort points." If a question's total points exceed the budget, it's rejected. Like a heavy-order fee.</li>
      <li><strong>Rate limits</strong> — one person can't ask a thousand questions a minute.</li>
      <li><strong>Auth &amp; permissions</strong> — only members can see the rare-book room. Some fields are locked unless you're allowed.</li>
      <li><strong>Persisted queries / allow-list</strong> — only known, pre-approved questions are accepted. Strangers can't invent questions.</li>
      <li><strong>List caps</strong> — "first: 20" — you can't ask for a million books at once.</li>
    </ul>
    <p><strong>In short:</strong> GraphQL gives clients a lot of power. Use depth limits, cost budgets, rate limits, and permissions so nobody can abuse it — like good rules at the library entrance.</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5GraphqlData = eli5GraphqlData;
