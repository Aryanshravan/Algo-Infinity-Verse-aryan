/**
 * ELI5 (Explain Like I'm 5) content for Supabase Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5SupabaseData = {
  // ─── Module 1: Supabase Auth Basics ───
  'm1-l1': `
    <p>Think of <strong>Supabase Auth</strong> like a <strong>hotel front desk</strong>.</p>
    <p>When you check in (sign up), you give the receptionist your email and a password. They create a room key (a <strong>session</strong>) for you. Any time you come back to the hotel, you show your key and they know who you are. The <code>signUp()</code> method is like filling out the registration form at the front desk!</p>
    <p>Supabase handles everything behind the scenes — keeping your password safe, making sure you are who you say you are, and even sending a confirmation email (like a welcome letter to your room).</p>
  `,
  'm1-l2': `
    <p>A <strong>magic link</strong> is like a <strong>golden ticket</strong> that appears in your email.</p>
    <p>Instead of typing a password (which you might forget!), the website sends a one-time link to your email. Click it, and you're instantly signed in — like using a VIP pass that skips the line!</p>
    <p><code>signInWithOtp()</code> is the method that sends that golden ticket. It's great for apps where you want to make signing in as easy as possible — no passwords to remember or type.</p>
  `,
  'm1-l3': `
    <p>Managing passwords and sessions is like <strong>running a coat check</strong> at a restaurant.</p>
    <p>When you arrive, you hand over your coat (sign in) and get a ticket (your <strong>session token</strong>). While you're eating, you might need something from your coat pocket — you show the ticket and the attendant gets it for you. When you leave, you return the ticket and get your coat back.</p>
    <p>If you lose your coat (forget your password), the manager sends you a reset link (<code>resetPasswordForEmail</code>) — like getting a new ticket printed. The <code>onAuthStateChange</code> listener is like a bell that rings whenever someone checks in or out a coat!</p>
  `,

  // ─── Module 2: PostgreSQL CRUD via JS Client ───
  'm2-l1': `
    <p>Inserting data with Supabase is like <strong>adding a new card to a recipe box</strong>.</p>
    <p>You pick which box (table) to put it in with <code>from('todos')</code>, then hand over the card with <code>insert()</code>. The card has details written on it: "Buy groceries — not done yet." Supabase files it away and even gives you a receipt showing what was added!</p>
    <p>Just like how you can add multiple recipe cards at once, <code>insert()</code> can take an array of items!</p>
  `,
  'm2-l2': `
    <p>Updating data is like using <strong>white-out on a shopping list</strong>.</p>
    <p>You have a list of todos and one of them says "Buy milk — DONE." But wait, you haven't bought it yet! You need to change it to "Buy milk — NOT DONE."</p>
    <p>With Supabase, <code>update()</code> is your white-out. But you MUST point to the exact row with <code>.eq('id', 1)</code> — otherwise you'd white-out your ENTIRE shopping list! The <code>match()</code> method is like saying "only white-out items on the second page that are already checked off."</p>
  `,
  'm2-l3': `
    <p>Selecting and deleting data is like <strong>organizing your backpack</strong>.</p>
    <p><strong>Selecting:</strong> You open your backpack (<code>from('todos')</code>) and look inside. You can say "show me only the unfinished homework" (<code>.eq('is_complete', false)</code>) or "show me the newest items first" (<code>.order('date', { ascending: false })</code>).</p>
    <p><strong>Deleting:</strong> You take something OUT of your backpack. But be careful! If you say "remove everything" without a filter, your backpack will be totally empty! Always point to the exact item: "remove the candy wrapper with <code>.eq('id', 5)</code>."</p>
  `,

  // ─── Module 3: Row Level Security & Realtime ───
  'm3-l1': `
    <p>RLS is like a <strong>bouncer at a club</strong> who checks everyone's ID at the door.</p>
    <p>Your database tables are VIP rooms. Without a bouncer (RLS policy), ANYONE can walk in and grab all the data! With the bouncer, only people on the guest list (<code>auth.uid() = user_id</code>) get in.</p>
    <p>The rule "Users can read own todos" is like the bouncer's instructions: "Only let people see their own coat check ticket. If the ticket number matches, they get their coat." If someone tries to grab a coat that isn't theirs, the bouncer says "Nope, not yours!"</p>
  `,
  'm3-l2': `
    <p>Realtime subscriptions are like having a <strong>walkie-talkie</strong> connected to your database.</p>
    <p>Normally, your app asks the database "Any new data?" over and over (polling) — like calling your friend every 5 seconds to ask "Are we there yet?"</p>
    <p>With realtime, the database <strong>calls YOU</strong> when something changes — like your friend texting you "We're here!" The <code>channel()</code> is your walkie-talkie channel, and <code>on('postgres_changes')</code> is like saying "tell me whenever someone adds, changes, or removes something from this table."</p>
  `,

  // ─── Module 4: Supabase Storage ───
  'm4-l1': `
    <p>Uploading files to Supabase Storage is like <strong>putting photos in a shoebox</strong> under your bed.</p>
    <p>The bucket (<code>'avatars'</code>) is the shoebox. The file path (<code>'public/avatar1.png'</code>) is like writing a label on the photo. The <code>upload()</code> method is your hand putting the photo into the box!</p>
    <p>You can organize photos into folders within the shoebox — like using dividers. "User photos go in this section, product images go in that section." If you use <code>upsert: true</code>, it's like replacing an old photo with a new one of the same name!</p>
  `,
  'm4-l2': `
    <p>Downloading and listing files is like <strong>looking through your photo album</strong>.</p>
    <p><code>list()</code> is like flipping through the album to see what photos are inside. You can say "show me only the vacation photos" by passing a prefix (<code>'vacation/'</code>).</p>
    <p><code>getPublicUrl()</code> gives you a permanent link to a photo — like putting a picture on your fridge where everyone can see it. <code>createSignedUrl()</code> is like giving a friend a temporary key to your locker — it only works for a limited time (like 60 seconds) and then expires!</p>
  `,
  'm4-l3': `
    <p>Public vs Private buckets is like the difference between a <strong>front yard and a locked safe</strong>.</p>
    <p><strong>Public buckets</strong> are like your front yard — anyone walking by can see your garden, the flowers, and the mailbox. You don't mind people looking!</p>
    <p><strong>Private buckets</strong> are like a locked safe in your closet — only people with the key (or a signed permission slip) can open it. The storage policies are the rules you set: "Only family members can put things in the safe. Only mom can take things out."</p>
    <p>Even for the front yard, you still want rules: "Anyone can look, but only I can plant new flowers or remove old ones!"</p>
  `,

  // ─── Module 5: Edge Functions ───
  'm5-l1': `
    <p>Edge Functions are like <strong>food trucks parked all over the city</strong>.</p>
    <p>Instead of having one restaurant in one location (a traditional server), you have many food trucks (edge functions) parked in different neighborhoods around the world. When someone orders food, the <strong>nearest truck</strong> serves them — super fast!</p>
    <p>The <code>serve()</code> handler is like the food truck window where customers place their orders. The function runs on <strong>Deno</strong>, which is like a different type of kitchen — faster startup, built-in TypeScript support, and direct access to your Supabase project's ingredients.</p>
  `,
  'm5-l2': `
    <p>Handling requests in edge functions is like being a <strong>chef taking orders</strong>.</p>
    <p>A customer sends an order (a <strong>Request</strong>). You check if it's a "Can I see the menu?" (GET) or "I want to order food!" (POST). You read what they want (<code>req.json()</code>) and cook it up.</p>
    <p>CORS headers are like <strong>language translation cards</strong> you put on your food truck window. They tell browsers: "It's OK for websites from other neighborhoods to order from my truck!" Without CORS, browsers block requests from other websites — like a picky eater who only eats at restaurants from their own town!</p>
  `,
  'm5-l3': `
    <p>Deploying edge functions is like <strong>launching a new food truck</strong>.</p>
    <p>You design the menu locally (on your computer), then you "deploy" it — which is like driving the food truck to a real street where customers can find it. The <code>supabase functions deploy</code> command is like putting the truck in position!</p>
    <p><strong>Secrets</strong> are like the secret recipes you keep in a locked drawer in the truck. You don't write them on the menu board for everyone to see! You use <code>supabase secrets set</code> to store them, and <code>Deno.env.get()</code> to use them — like pulling out your recipe card when you need it.</p>
  `,

  // ─── Module 6: Realtime Subscriptions ───
  'm6-l1': `
    <p>Channel subscriptions are like <strong>walkie-talkie channels</strong>.</p>
    <p>Each channel has a name (like "Channel 1" or "Room Alfa"). You tune your walkie-talkie to that channel and listen for messages. When something changes in the database, it broadcasts on the channel — like your friend saying "Meeting in 5 minutes!" over the radio.</p>
    <p>The filter is like saying "only tell me about messages related to Room 5" — you ignore everything else on the channel. And when you leave, you switch off your walkie-talkie (<code>unsubscribe</code>) so you stop hearing messages!</p>
  `,
  'm6-l2': `
    <p>Presence and broadcast are like <strong>knowing who's in a club and being able to shout across the room</strong>.</p>
    <p><strong>Presence</strong> tells you who else is in the same room. When someone walks in (<code>join</code>), you see them. When they leave (<code>leave</code>), they disappear. It's like a "Who's Online" list that updates automatically!</p>
    <p><strong>Broadcast</strong> is like shouting "Who wants pizza?" across the room. Everyone on the same channel hears you. This is great for things like typing indicators ("Alice is typing..."), live cursors in collaborative docs, or sending moves in a multiplayer game!</p>
  `,

  // ─── Module 7: Database Migrations & Schema Design ───
  'm7-l1': `
    <p>Database migrations are like <strong>renovation blueprints</strong> for your house.</p>
    <p>You don't just start hammering walls without a plan! Each migration file is a <strong>blueprint</strong> that says "Today we're adding a bathroom" or "This week we're expanding the kitchen."</p>
    <p>The Supabase CLI is like your contractor. You hand them the blueprint (<code>supabase migration new add_bathroom</code>), they review it, and then they do the work (<code>supabase db push</code>). If your whole team has the same blueprints, everyone's house stays the same — no surprises!</p>
  `,
  'm7-l2': `
    <p>Schema design is like <strong>organizing a library</strong>.</p>
    <p>Tables are bookshelves. "Profiles" shelf, "Posts" shelf, "Comments" shelf. Foreign keys are like <strong>cross-reference cards</strong> — "This post was written by this author (see authors shelf, row 5)."</p>
    <p>Indexes are like a <strong>card catalog</strong> at the front of the library. Instead of searching every single book to find "Harry Potter", you look up "H" in the catalog and go straight to the right shelf. Indexes make searching fast, but you can't put EVERYTHING in the catalog — it would take too long to maintain! Index only the columns you search by often.</p>
  `,

  // ─── Module 8: Multi-Provider Auth (OAuth) ───
  'm8-l1': `
    <p>Google OAuth is like using your <strong>hotel key card to enter the gym</strong>.</p>
    <p>Instead of signing up for the gym separately (new username, new password), you just swipe your hotel key card. The gym trusts the hotel's verification — "If the hotel says you're a guest, you're welcome here!"</p>
    <p>In technical terms: Google tells Supabase "Yes, this is Alice (alice@gmail.com)." Supabase trusts Google's word (because you set up the trust in the dashboard) and creates a session for Alice. She never needs to create a new password!</p>
  `,
  'm8-l2': `
    <p>Multiple OAuth providers is like having <strong>several different keys</strong> for different doors in your house.</p>
    <p>Your front door might use a Google key. Your back door might use a GitHub key. Your garage might use an Apple key. They all lead to the same house (your account) but use different keys!</p>
    <p>The <code>signInWithOAuth({ provider: 'github' })</code> method is like choosing which key to use. "Today I'll enter through the GitHub door." Supabase remembers it's still <strong>you</strong> — you just used a different entrance!</p>
  `,
  'm8-l3': `
    <p>Linking accounts is like <strong>connecting all your keys to one keychain</strong>.</p>
    <p>You have a Google key and a GitHub key. They're separate keys, but you put them on the <strong>same keychain</strong> (your account). Now you can unlock the door with either key!</p>
    <p><code>linkIdentity()</code> adds a new key to your keychain. If you were using Google to sign in and now want to also use GitHub, you link them together. Both keys now open the same door to your account. And if you lose one key, <code>unlinkIdentity()</code> lets you remove it from the keychain!</p>
  `,

  // ─── Module 9: Advanced RLS Policies ───
  'm9-l1': `
    <p>Team-based RLS is like a <strong>company building with different departments</strong>.</p>
    <p>Each department (team) has its own floor. The Marketing team can access the Marketing floor, Engineering can access the Engineering floor, and so on. Your ID badge (JWT token) tells the security guard which floors you can visit.</p>
    <p>The <code>team_members</code> table is the <strong>employee directory</strong> at the front desk. When you try to enter the Engineering floor, the guard checks: "Is this person listed as an Engineering team member?" If yes, you get in! Your role (admin, member, viewer) determines what you can do once inside.</p>
  `,
  'm9-l2': `
    <p>Helper functions in RLS are like <strong>customs stamps at the airport</strong>.</p>
    <p>Instead of checking every passenger's documents from scratch each time, customs officers have special stamps that say "Pre-approved: VIP" or "Pre-approved: Crew." Once stamped, the passenger goes through faster.</p>
    <p>A PostgreSQL helper function like <code>auth.user_is_admin()</code> is that stamp. Once you create it, you can use it in many different policies. "Is this user an admin? The stamp says yes!" This is much cleaner than writing the same check over and over in every policy.</p>
  `,
  'm9-l3': `
    <p>Debugging RLS is like being a <strong>detective investigating why someone was denied entry</strong>.</p>
    <p>A user says "I can't see my data!" You need to check: Is the <strong>RLS bouncer even working</strong>? (<code>relrowsecurity</code>). What <strong>rules</strong> does the bouncer follow? (<code>pg_policies</code>). Is the user's ID being checked correctly? (<code>auth.uid()</code>).</p>
    <p>It's like checking a nightclub: "Is the door policy enabled? What's on the list of rules? Is the bouncer checking IDs properly?" Once you check each link in the chain, you'll find where things went wrong!</p>
  `,

  // ─── Module 10: Supabase CLI & Local Dev ───
  'm10-l1': `
    <p>The Supabase CLI is like a <strong>toolbox for building with LEGO</strong>.</p>
    <p>Instead of going to the LEGO store every time you want to try a new piece, you build at home with your own set. The CLI gives you a <strong>complete LEGO workshop on your computer</strong> — all the pieces (PostgreSQL, Auth, Storage, Realtime) are set up locally.</p>
    <p><code>supabase start</code> is like opening your toolbox and laying everything out. <code>supabase stop</code> is like packing it all away. And <code>supabase status</code> tells you what's currently on your workbench!</p>
  `,
  'm10-l2': `
    <p>Generating types is like having an <strong>auto-complete superpower</strong> for your code.</p>
    <p>When you write code, normally you have to remember exact table names and column names: "Is it <code>is_complete</code> or <code>completed</code>? Is the column called <code>inserted_at</code> or <code>created_at</code>?" That's like writing an essay without spellcheck!</p>
    <p>Type generation (<code>supabase gen types typescript</code>) creates a <strong>dictionary</strong> of your database. Your code editor then gives you suggestions: "Did you mean <code>is_complete</code>?" It's like writing with autocorrect and autocomplete — faster and with fewer mistakes!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5SupabaseData = eli5SupabaseData;
