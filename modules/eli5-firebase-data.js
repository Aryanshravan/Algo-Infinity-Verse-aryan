/**
 * ELI5 (Explain Like I'm 5) content for Firebase Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5FirebaseData = {
  // ─── Module 1: Firebase Authentication ───

  'm1-l1': `
    <p><strong>Signing in</strong> is like showing your <strong>library card</strong> to prove who you are.</p>
    <p>When you go to a library, you show your card and the librarian knows it's you! In Firebase, <code>signInWithEmailAndPassword</code> is like showing your email (your name) and password (your secret handshake) to prove it's really you.</p>
    <p>The computer checks: "Does this email exist? Does the password match?" If yes, you get a <strong>digital ID card</strong> called a <code>userCredential</code> that says "This person is logged in!"</p>
    <p>Think of it like a <strong>secret treehouse</strong> — you need to know the secret password to get in. Once you say the right password, the door opens and you're inside!</p>
  `,

  'm1-l2': `
    <p>Imagine you have <strong>one keychain with many different keys</strong>. One key opens your house door. Another key opens your car. Another opens your locker at school.</p>
    <p><strong>Multi-Provider Auth</strong> is like that! Instead of creating a NEW account with a new password for every app, you can use the accounts you already have — your <strong>Google account</strong>, <strong>Facebook account</strong>, or <strong>GitHub account</strong>.</p>
    <p>Firebase has a special helper called a <strong>provider object</strong> (like <code>GoogleAuthProvider</code>) that talks to Google and says: "Hey, is this person really who they say they are?" Google checks and says "Yes, it's Alice!" — then Firebase lets Alice in.</p>
    <p>It's like using your <strong>school ID card</strong> to get into the school gym — you don't need a separate gym membership card because your school ID already proves you're a student!</p>
  `,

  'm1-l3': `
    <p>Once you log in, Firebase doesn't forget you! It's like a <strong>friendly store owner</strong> who remembers your name after you visit a few times.</p>
    <p><strong>Auth state</strong> is simply: Are you logged in or not? Firebase has a special listener called <code>onAuthStateChanged</code> that <strong>watches</strong> your login status 24/7. It's like a security camera at the door — when someone walks in (logs in), it says "Hey, Alice arrived!" When someone walks out (logs out), it says "Alice left."</p>
    <p>Your <strong>user profile</strong> is like a <strong>name tag sticker</strong> you wear at a party. It shows your name, email, and maybe a photo. Firebase stores this info in the <code>user</code> object so you can display "Welcome, Alice!" anywhere in your app.</p>
    <p>When you log out, Firebase throws away the name tag and goes back to "Welcome, Guest!" mode!</p>
  `,

  // ─── Module 2: Firestore CRUD ───

  'm2-l1': `
    <p><code>setDoc</code> and <code>addDoc</code> are like <strong>two ways to put a book on a shelf</strong>.</p>
    <p><strong>setDoc</strong> is like saying: "I want this book to go in this EXACT spot on the shelf, with this exact label." You give it the collection (which shelf), the document ID (the label), and the data (the book itself). The book goes EXACTLY where you put it.</p>
    <p><strong>addDoc</strong> is like dropping a book into a return bin at the library. The librarian gives it a <strong>random ID number</strong> and puts it on the shelf. You don't care where it goes — you just want it in the system!</p>
    <p>Use <code>setDoc</code> when you want a SPECIFIC spot (like a user profile with a specific user ID). Use <code>addDoc</code> when you just want to add something (like a blog post) and let Firebase create the ID.</p>
  `,

  'm2-l2': `
    <p><strong>Reading data</strong> is like <strong>finding a book in a library</strong>.</p>
    <p><code>getDoc</code> lets you read ONE document — like asking a librarian: "I want the book with this exact call number." You say "Give me document 'user123'" and you get back that one document's data.</p>
    <p><code>getDocs</code> lets you read ALL documents in a collection — like asking: "What books do you have on the 'History' shelf?" You get back a list of ALL the books in that collection.</p>
    <p>The data comes back wrapped in a <strong>special package</strong> called a <code>DocumentSnapshot</code>. You have to unwrap it with <code>.data()</code> to see what's inside — like opening a birthday present to see the toy inside!</p>
    <p><code>onSnapshot</code> is like telling a librarian: "Every time a new book arrives on this shelf, come tell me!" It <strong>listens</strong> for changes and automatically gives you the updated data.</p>
  `,

  'm2-l3': `
    <p><strong>Updating and deleting</strong> is like <strong>editing or throwing away a notebook page</strong>.</p>
    <p><code>updateDoc</code> lets you change ONLY specific fields — like using a white-out pen to change just your phone number on a form, without rewriting the whole thing. Say you have a user document with name, email, and age. You can change just the age without touching name or email!</p>
    <p><code>deleteDoc</code> is like tearing out a page and throwing it in the trash. POOF — it's gone forever! Be careful — there's no "undo" button!</p>
    <p><strong>Important difference:</strong> <code>setDoc</code> with merge: true is like updating specific fields too. But <code>setDoc</code> without merge replaces the ENTIRE document — like throwing away the old page and writing a completely new one. Use <code>updateDoc</code> when you want to change just a few things!</p>
  `,

  // ─── Module 3: Firestore Queries & Indexes ───

  'm3-l1': `
    <p><strong>Queries</strong> are like <strong>asking a librarian for specific books</strong>.</p>
    <p>Instead of getting ALL books, you can ask: "Show me only books by Roald Dahl" (that's <code>where('author', '==', 'Roald Dahl')</code>). Or "Show me the newest 10 books" (<code>orderBy('publishedDate', 'desc').limit(10)</code>).</p>
    <p><code>where</code> is like a <strong>filter</strong> — it keeps only the items that match your condition. <code>orderBy</code> is like <strong>sorting</strong> — it arranges the results in a specific order. <code>limit</code> is like saying "I only want 5, not all 5,000!"</p>
    <p>These are like <strong>building blocks</strong> you can combine: "Find me 10 books by Roald Dahl, sorted by publish date, newest first!" That's <code>where('author', '==', 'Roald Dahl')</code> + <code>orderBy('publishedDate', 'desc')</code> + <code>limit(10)</code>.</p>
  `,

  'm3-l2': `
    <p><strong>Indexes</strong> are like the <strong>index at the back of a textbook</strong> — it tells you exactly where to find things.</p>
    <p>When you search for "elephants" in a textbook, the index says "see page 42, 87, 123." You don't read every page — you go straight to the right ones!</p>
    <p>Firestore <strong>automatically</strong> creates simple indexes for single-field queries (like "find all books by Roald Dahl"). But when you combine multiple fields in a query — like "find books by Roald Dahl published after 1980, sorted by title" — Firestore needs a <strong>composite index</strong>.</p>
    <p>A <strong>composite index</strong> is like a special spreadsheet that lists author + publish date + title together, so Firestore can look things up super fast. Without it, the query would be like reading the entire library to find what you need!</p>
    <p>If a query fails with a message about a missing index, just click the link in the error message and Firebase creates it for you automatically!</p>
  `,

  'm3-l3': `
    <p><strong>Real-time queries</strong> with <code>onSnapshot</code> are like <strong>watching a live sports game</strong> on TV instead of checking the score later.</p>
    <p>With <code>getDocs</code>, you ask "What's the score right NOW?" and get one answer. But with <code>onSnapshot</code>, you TUNE IN and the TV keeps showing you updates as they happen!</p>
    <p>When someone adds a new document, changes an existing one, or deletes one, <code>onSnapshot</code> <strong>automatically</strong> fires with the new data. It's like having a live news reporter at the database who calls you whenever something changes!</p>
    <p><strong>Important:</strong> Always <strong>unsubscribe</strong> when you leave the page! Not unsubscribing is like leaving the TV on in an empty room — it's wasteful. The <code>onSnapshot</code> function returns an unsubscribe function — call it when you're done: <code>const unsubscribe = onSnapshot(...); // ... later: unsubscribe();</code></p>
  `,

  // ─── Module 4: Firestore Security Rules ───

  'm4-l1': `
    <p><strong>Security Rules</strong> are like <strong>bouncers at a nightclub</strong> — they decide who gets in and what they can do.</p>
    <p>Imagine a club with a VIP section. The bouncer checks: "Are you on the list? Are you over 21? Can you afford the cover charge?" If yes, you get in!</p>
    <p>Firestore Security Rules work the same way. Every time someone tries to read or write data, the rules check: "Is this person allowed to do this?"</p>
    <p>Rules are written in a special language that looks like JavaScript. You write rules for <code>read</code> and <code>write</code> operations. Think of them as <strong>gatekeepers</strong> that check <code>request.auth</code> (who is asking?) and <code>resource.data</code> (what data are they trying to access?).</p>
    <p>The safest rule: start with <strong>deny all</strong> (<code>match /{document=**} { allow read, write: if false; }</code>), then open up only what you need!</p>
  `,

  'm4-l2': `
    <p><strong>Writing secure rules</strong> is like setting <strong>house rules</strong> for your kids and their friends.</p>
    <p>You might say:</p>
    <ul>
      <li>"Only family members can enter the house" — <code>allow read: if request.auth != null</code> (any logged-in user can read)</li>
      <li>"Only John can enter his own room" — <code>allow write: if request.auth.uid == resource.data.userId</code> (only the owner can edit)</li>
      <li>"Guests can only use the bathroom, not the bedrooms" — <code>allow read: if request.auth.token.role == 'guest'</code></li>
    </ul>
    <p>The special variable <code>request.auth</code> is like the person's ID card — it tells you who they are. <code>resource.data</code> is like what's written on the document they're trying to change.</p>
    <p><strong>Key rule types:</strong></p>
    <ul>
      <li><code>read</code> — can they see it? (includes get + list)</li>
      <li><code>write</code> — can they change it? (includes create + update + delete)</li>
    </ul>
    <p>Always use the <strong>Firebase Rules Simulator</strong> in the console to test your rules before deploying!</p>
  `,

  'm4-l3': `
    <p><strong>Advanced rules</strong> are like <strong>special access cards</strong> that give different permissions to different people.</p>
    <p><strong>Custom claims</strong> are like giving someone a special badge: "VIP Access" or "Staff Only." You can set custom claims on users from your server (Cloud Functions or Admin SDK): <code>admin.auth().setCustomUserClaims(uid, {role: 'admin'})</code>.</p>
    <p>Then in your rules, you check the badge: <code>allow write: if request.auth.token.role == 'admin'</code>. Only users with the "admin" badge can write!</p>
    <p><strong>Functions in rules</strong> let you reuse logic. Instead of writing the same condition over and over:</p>
    <pre><code>function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    allow write: if isAuthenticated() && isOwner(resource.data.userId);</code></pre>
    <p>It's like creating your own <strong>rule book with chapters</strong> — clean, organized, and reusable!</p>
  `,

  // ─── Module 5: Cloud Functions ───

  'm5-l1': `
    <p><strong>Cloud Functions</strong> are like <strong>automatic helpers</strong> that work behind the scenes.</p>
    <p>Imagine you own a bakery. When a customer orders a cake online, you want to automatically: (1) send them a confirmation email, (2) update your inventory, and (3) print the order in the kitchen. You don't want to do these things manually!</p>
    <p>A Cloud Function is like a <strong>robot assistant</strong> that listens for events and does the work automatically. You write the code once, deploy it to Google's servers, and it runs whenever the event happens.</p>
    <p>Cloud Functions are written in JavaScript/TypeScript and run on Google's servers. You don't need to manage your own server — Google handles all that. It's called <strong>serverless</strong> — you just write the code and it runs!</p>
    <p>Common uses: sending emails when a user signs up, resizing images when uploaded, cleaning up data, or calling external APIs.</p>
  `,

  'm5-l2': `
    <p><strong>Firestore Triggers</strong> are like <strong>tripwires</strong> that activate when something happens in your database.</p>
    <p>You set up a tripwire: "When a new document is created in the 'orders' collection, do something!" When someone places an order, the tripwire activates and your function runs automatically.</p>
    <p>There are three types of Firestore triggers:</p>
    <ul>
      <li><strong>onCreate</strong> — when a new document appears (like a new customer order)</li>
      <li><strong>onUpdate</strong> — when a document changes (like when an order status changes to "shipped")</li>
      <li><strong>onDelete</strong> — when a document is removed (like when an order is cancelled)</li>
    </ul>
    <p>The function receives a <code>Change</code> object that tells you what the document looked like BEFORE and AFTER. This is great for things like keeping a history log or sending notifications!</p>
  `,

  'm5-l3': `
    <p><strong>Auth triggers and HTTP functions</strong> are two more ways Cloud Functions can help.</p>
    <p><strong>Auth triggers</strong> activate when users sign up or delete their accounts. When a new user creates an account, you can automatically create a welcome document in Firestore, send a welcome email, or add them to a mailing list.</p>
    <p><strong>HTTP functions</strong> are like <strong>vending machines</strong>. You send a request (put in money + press a button), and the function responds (gives you a snack). You can call them directly from your app using a URL like <code>https://us-central1-your-project.cloudfunctions.net/functionName</code>.</p>
    <p>These are great for: building REST APIs, handling webhooks (like Stripe payment notifications), or processing data that doesn't fit neatly into Firestore triggers.</p>
    <p>Think of Cloud Functions as your <strong>Swiss Army knife</strong> — they can do almost anything in response to almost any event!</p>
  `,

  // ─── Module 6: Firebase Storage ───

  'm6-l1': `
    <p><strong>Firebase Storage</strong> is like a <strong>giant digital filing cabinet</strong> for your files.</p>
    <p>While Firestore stores data like text and numbers, Storage stores <strong>files</strong>: pictures, videos, audio recordings, PDFs, and more!</p>
    <p><strong>Uploading</strong> a file is like putting a document into a filing cabinet drawer. You get a <strong>reference</strong> to where it should go: <code>const ref = ref(storage, 'images/profile_pic.jpg')</code> — that's like saying "Put this in the 'images' folder and call it 'profile_pic.jpg'".</p>
    <p>Then you use <code>uploadBytes</code> or <code>uploadBytesResumable</code> to actually send the file. <code>uploadBytesResumable</code> is better for big files because you can track the <strong>progress</strong> — like watching a progress bar show "35% uploaded..."</p>
    <p>When the upload is done, you get a <strong>download URL</strong> — a special link that lets anyone view the file. Store this URL in Firestore so you can show the image later!</p>
  `,

  'm6-l2': `
    <p><strong>Downloading and managing files</strong> is like <strong>getting photos from a cloud album</strong>.</p>
    <p>To get a download URL for a file: <code>getDownloadURL(storageRef)</code>. This gives you a link you can put in an <code>&lt;img&gt;</code> tag or share with users.</p>
    <p><strong>Deleting files:</strong> <code>deleteObject(storageRef)</code> — like throwing a file in the trash. Be careful, it's gone forever!</p>
    <p><strong>Security Rules</strong> for Storage work just like Firestore rules. You can say: "Only the user who uploaded a file can delete it." Or "Anyone can view profile pictures, but only admins can delete them."</p>
    <p>Rules check <code>request.auth</code> (who is asking?) and the file path. For example: <code>allow read: if request.auth != null;</code> means only logged-in users can see files.</p>
    <p>Pro tip: Organize your files with <strong>user-based paths</strong> like <code>users/{uid}/photos/photo1.jpg</code>. This makes security rules much easier to write!</p>
  `,

  // ─── Module 7: Firebase Hosting ───

  'm7-l1': `
    <p><strong>Firebase Hosting</strong> is like putting your app on a <strong>public bookshelf</strong> where anyone can see it.</p>
    <p>You've built your app on your computer — but nobody can see it except you. Hosting is like <strong>publishing your book</strong> so the whole world can read it!</p>
    <p>Firebase Hosting gives you:</p>
    <ul>
      <li>A <strong>free URL</strong> like <code>your-app.web.app</code></li>
      <li><strong>Global CDN</strong> — your app loads fast everywhere in the world (like having copies of your book in libraries worldwide)</li>
      <li><strong>Free SSL certificate</strong> (the lock icon in the browser — it means data is encrypted and safe)</li>
    </ul>
    <p>To deploy: you run <code>firebase deploy --only hosting</code> in your terminal. Firebase takes your files, puts them on their servers, and within seconds your app is live!</p>
    <p>You can also <strong>preview</strong> your app before making it public using <code>firebase hosting:channel:deploy preview-name</code> — like showing a draft of your book to a few friends before publishing!</p>
  `,

  'm7-l2': `
    <p><strong>Advanced Hosting</strong> features are like having a <strong>custom storefront</strong> with cool extras.</p>
    <p><strong>Custom domains:</strong> Instead of <code>your-app.web.app</code>, you can use <code>www.yourcoolapp.com</code>. You buy a domain name and tell Firebase: "When someone visits this domain, show my app!"</p>
    <p><strong>Rewrites and redirects:</strong> You can configure your app in <code>firebase.json</code>:</p>
    <ul>
      <li><strong>Redirects:</strong> "Anyone who visits <code>old-page.html</code> should be sent to <code>new-page.html</code>" — like forwarding mail when you move houses.</li>
      <li><strong>Rewrites:</strong> "Any URL that doesn't match a file should load <code>index.html</code>" — essential for single-page apps!</li>
    </ul>
    <p><strong>Cloud Functions + Hosting:</strong> You can serve a Cloud Function from your custom domain! Instead of a complex URL, your API can be at <code>www.yourcoolapp.com/api</code>. This is like having your store's warehouse in the same building as the shop — everything is connected!</p>
  `,

  // ─── Module 8: App Check ───

  'm8-l1': `
    <p><strong>App Check</strong> is like a <strong>VIP wristband</strong> at a music festival.</p>
    <p>Anyone can try to call your Firebase backend — even bad guys writing scripts! App Check adds a <strong>special wristband</strong> that only REAL copies of your app have.</p>
    <p>How it works: When someone uses your app, App Check gets a <strong>proof</strong> from the device: "This is the real app, not a fake copy!" Only requests WITH the wristband get through.</p>
    <p>App Check uses services like:</p>
    <ul>
      <li><strong>reCAPTCHA Enterprise</strong> — a Google service that can tell humans from robots</li>
      <li><strong>Device attestation</strong> (Android/iOS) — checks that the app hasn't been tampered with</li>
    </ul>
    <p>Without App Check, your Firebase project is like a party with NO guest list — anyone can walk in! With App Check, only invited guests (your real app) can enter.</p>
  `,

  'm8-l2': `
    <p><strong>Implementing App Check</strong> is like giving out VIP wristbands at the door.</p>
    <p>Step by step:</p>
    <ol>
      <li><strong>Register your app</strong> with an App Check provider (like reCAPTCHA for web, or Play Integrity for Android).</li>
      <li><strong>Add the SDK</strong> to your app and initialize it.</li>
      <li><strong>Enforce App Check</strong> in your Firebase console — turn on the enforcement toggle.</li>
    </ol>
    <p>Here's the web code: <code>const appCheck = initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider('your-site-key'), isTokenAutoRefreshEnabled: true });</code></p>
    <p><strong>Important:</strong> Test without enforcement first! If something's wrong, you don't want to lock ALL users out of your app. Use <strong>debug tokens</strong> during development to bypass App Check on your local machine.</p>
    <p>Think of enforcement like turning on the metal detectors at the airport — once they're on, everyone gets checked. Make sure they work properly BEFORE turning them on!</p>
  `,

  // ─── Module 9: Real-time & Offline Features ───

  'm9-l1': `
    <p><strong>Offline persistence</strong> is like having a <strong>notebook copy</strong> of your data.</p>
    <p>Imagine you're taking notes in class. If the Wi-Fi goes out, you don't stop writing — you just write in your notebook. When the Wi-Fi comes back, you copy your notes to Google Docs.</p>
    <p>Firestore's offline persistence works the same way! It keeps a <strong>local copy</strong> of your data on the user's device. If the internet goes down:</p>
    <ul>
      <li>Reads still work — you see the cached data from the local copy</li>
      <li>Writes still work — they're saved locally and sent to the server when internet returns</li>
    </ul>
    <p>Enable it with ONE line: <code>enableMultiTabIndexedDbPersistence(db)</code> (for web). That's it! Everything else is automatic.</p>
    <p>Your app becomes <strong>offline-first</strong> — it works even without internet, like a good old-fashioned paper notebook!</p>
  `,

  'm9-l2': `
    <p><strong>Real-time sync</strong> is like having a <strong>group chat where everyone sees updates instantly</strong>.</p>
    <p>You send a message in the group chat. Everyone sees it immediately without refreshing. THAT is real-time sync!</p>
    <p>Firestore's <code>onSnapshot</code> creates a <strong>live connection</strong> between your app and the database. When anything changes — someone adds a comment, edits a document, or deletes a record — the update appears on all connected devices instantly.</p>
    <p>It's like a <strong>walkie-talkie</strong> instead of a mailbox. With a mailbox (one-time reads), you have to go check for new mail. With a walkie-talkie (real-time listener), messages come to you automatically!</p>
    <p>This is perfect for: chat apps, collaborative editing, live dashboards, and multiplayer games!</p>
  `,

  'm9-l3': `
    <p><strong>Conflict resolution</strong> is like two people trying to edit the same document at the same time.</p>
    <p>You and your friend are writing a school report together on Google Docs. You both edit the same paragraph at the exact same time. What happens?</p>
    <p>Firestore uses <strong>"last write wins"</strong> strategy — whoever saves their change LAST is the one that sticks. This is simple but can cause problems!</p>
    <p>To handle conflicts better, use <strong>transactions</strong> (<code>runTransaction</code>). A transaction is like borrowing a library book: you take it, read it, make changes, and return it. During that time, NO ONE else can change it.</p>
    <p>Transactions are great for:</p>
    <ul>
      <li><strong>Counters</strong> — like a voting system where you read the current count, add 1, and save it back</li>
      <li><strong>Banking</strong> — checking the balance BEFORE making a withdrawal</li>
    </ul>
    <p>Think of transactions as saying "Dibs!" on a toy — while you're using it, no one else can take it or change it.</p>
  `,

  // ─── Module 10: Choosing a Database ───

  'm10-l1': `
    <p><strong>Firestore vs Realtime Database</strong> is like choosing between a <strong>filing cabinet</strong> and a <strong>whiteboard</strong>.</p>
    <p><strong>Firestore (filing cabinet):</strong> Data is organized in folders (collections) and files (documents). Each file has labeled fields. You can search, filter, and sort. Great for apps that need organized, queryable data.</p>
    <p><strong>Realtime Database (whiteboard):</strong> Data is one big JSON blob — like writing everything on a single whiteboard. It's super fast for real-time syncing but harder to organize and query.</p>
    <table>
      <tr><th>Feature</th><th>Firestore</th><th>Realtime DB</th></tr>
      <tr><td>Data model</td><td>Collections & Documents</td><td>JSON Tree</td></tr>
      <tr><td>Queries</td><td>Powerful (compound, filters)</td><td>Basic (filter by one field)</td></tr>
      <tr><td>Scaling</td><td>Automatic, massive scale</td><td>Manual sharding needed</td></tr>
      <tr><td>Real-time</td><td>Yes (onSnapshot)</td><td>Yes (native, lower latency)</td></tr>
      <tr><td>Offline</td><td>Excellent</td><td>Good</td></tr>
    </table>
    <p><strong>Rule of thumb:</strong> If you're building something NEW, pick Firestore. It's more powerful and scales better. Only pick Realtime Database if you need extremely fast real-time sync (like in a chat app) and don't need complex queries.</p>
  `,

  'm10-l2': `
    <p><strong>Choosing the right database</strong> is like picking the right <strong>tool for the job</strong>.</p>
    <p>You wouldn't use a hammer to cut a board, or a saw to pound a nail. Each tool has its best use!</p>
    <p><strong>When to use Firestore:</strong></p>
    <ul>
      <li>Your app needs <strong>complex queries</strong> (filter by multiple fields, sort, paginate)</li>
      <li>Data has a <strong>structured format</strong> (user profiles, products, blog posts)</li>
      <li>You need <strong>automatic scaling</strong> with millions of users</li>
      <li>You want <strong>multi-region replication</strong> (data available everywhere)</li>
    </ul>
    <p><strong>When to use Realtime Database:</strong></p>
    <ul>
      <li>You need <strong>extremely low latency</strong> (real-time games, live chat)</li>
      <li>You have <strong>simple, flat data</strong> (presence indicators, typing indicators)</li>
      <li>You want the <strong>simplest possible setup</strong></li>
    </ul>
    <p><strong>When to use both!</strong> You CAN use both together! Use Firestore for your main app data and Realtime Database for real-time features like presence indicators. They work great together — like using both a filing cabinet AND a whiteboard in the same office!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5FirebaseData = eli5FirebaseData;
