/* global checkAnswer */

// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('supabaseHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// Mock Database State for Simulator
const mockDatabase = {
  todos: [
    { id: 1, task: 'Learn Supabase', is_complete: true, user_id: 'uuid-1', inserted_at: new Date().toISOString() },
    {
      id: 2,
      task: 'Build an awesome app',
      is_complete: false,
      user_id: 'uuid-1',
      inserted_at: new Date().toISOString(),
    },
  ],
  users: [{ id: 'uuid-1', email: 'test@example.com', created_at: new Date().toISOString() }],
  profiles: [
    { id: 'uuid-1', username: 'testuser', avatar_url: null, team_id: 'team-1' },
  ],
  teams: [
    { id: 'team-1', name: 'My Team', created_at: new Date().toISOString() },
  ],
};

const mockStorage = {
  avatars: [
    { name: 'default-avatar.png', size: 24576, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  documents: [],
  images: [],
};

let currentTable = 'todos';
let mockAuthState = { user: null };
let lastInsertedRowId = null;

// Curriculum Data
const curriculum = [
  // ─────────────────────────────────────────────
  // Module 1: Supabase Auth Basics
  // ─────────────────────────────────────────────
  {
    id: 'mod-1',
    title: 'Supabase Auth Basics',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Sign Up',
        objectives: [
          'Register new users with email and password',
          'Understand the confirmation flow',
          'Access user session data after sign-up',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Supabase Authentication</h2>
            <p>Supabase provides a complete authentication system out of the box, integrated perfectly with PostgreSQL's Row Level Security. Every project comes with a <code>auth.users</code> table managed entirely by Supabase.</p>
            <h3>Signing Up a User</h3>
            <p>Use <code>supabase.auth.signUp()</code> to create a new user. It accepts an object with <code>email</code> and <code>password</code>. On success it returns a session and the user object.</p>
            <pre><code>const { data, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
})</code></pre>
            <p>After sign-up, Supabase sends a confirmation email by default. You can disable this in the Auth Settings dashboard for development. The returned <code>data.session</code> contains the access and refresh tokens you can use for subsequent requests.</p>
            <div class="callout-info">
              <strong>Why this matters:</strong> Supabase handles password hashing, email confirmation, and session creation automatically — you get a production-grade auth system with zero backend code.
            </div>
            <p>Go to the <strong>Simulator</strong>, run the code to sign up, and watch the Auth status update in the top right of the Studio!</p>
          </div>
        `,
        defaultCode: `// Sign up a new user
const { data, error } = await supabase.auth.signUp({
  email: 'newuser@example.com',
  password: 'securepassword123'
});

if (error) {
  console.error(error);
} else {
  console.log("Signed up successfully:", data.user.email);
  console.log("Session expires at:", data.session?.expires_at);
}`,
        takeaways: [
          'supabase.auth.signUp() creates a new user with email and password',
          'Supabase sends a confirmation email by default after sign-up',
          'The response includes both the user object and an active session',
          'Auth users are stored in Supabase\'s managed auth.users table',
        ],
      },
      {
        id: 'm1-l2',
        title: 'Sign In with Magic Link',
        objectives: [
          'Send a magic link to a user\'s email',
          'Understand passwordless authentication flow',
          'Handle redirect URLs for magic link sign-in',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Passwordless Authentication</h2>
            <p>Supabase supports passwordless authentication via <strong>magic links</strong>. Users receive an email with a one-time link that signs them in without a password — ideal for reducing friction.</p>
            <h3>Signing In with OTP</h3>
            <p>Use <code>supabase.auth.signInWithOtp()</code> with an email to send a magic link. You can optionally pass a <code>redirectTo</code> URL to control where the user lands after clicking the link.</p>
            <pre><code>const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: { redirectTo: 'https://myapp.com/dashboard' },
})</code></pre>
            <p>The magic link contains a hash with the user's tokens. When the user clicks it, Supabase exchanges the hash for a valid session. On the client, you listen for the session using <code>onAuthStateChange</code>.</p>
            <div class="callout-tip">
              <strong>Pro Tip:</strong> Use <code>signInWithOtp()</code> for login forms where you want to avoid password management. Combine it with <code>onAuthStateChange</code> to react to session changes in real time.
            </div>
          </div>
        `,
        defaultCode: `// Send a magic link to the user's email
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'alice@example.com',
  options: { redirectTo: 'https://myapp.com/welcome' }
});

if (error) {
  console.error("Failed to send magic link:", error.message);
} else {
  console.log("Magic link sent to alice@example.com!");
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log("User signed in via magic link:", session.user.email);
  }
});`,
        takeaways: [
          'signInWithOtp() sends a one-time password (magic link) via email',
          'The redirectTo option controls the post-sign-in landing page',
          'Magic link authentication is passwordless — lower friction for users',
          'Use onAuthStateChange to detect when a user completes sign-in',
        ],
      },
      {
        id: 'm1-l3',
        title: 'Password Reset & Session Management',
        objectives: [
          'Send a password reset email',
          'Manage user sessions with getSession and refreshSession',
          'Listen to auth state changes with onAuthStateChange',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Session & Password Management</h2>
            <p>Supabase provides built-in methods for password resets and comprehensive session management. These are essential for any production application.</p>
            <h3>Password Reset</h3>
            <p>Call <code>supabase.auth.resetPasswordForEmail()</code> to send a password reset email. The user clicks the link and you call <code>supabase.auth.updateUser()</code> with the new password.</p>
            <pre><code>await supabase.auth.resetPasswordForEmail('user@example.com')

// After the user clicks the reset link:
await supabase.auth.updateUser({ password: 'newPassword123' })</code></pre>
            <h3>Session Management</h3>
            <p>Use <code>supabase.auth.getSession()</code> to retrieve the current session, and <code>supabase.auth.onAuthStateChange()</code> to subscribe to sign-in, sign-out, and token refresh events.</p>
            <pre><code>const { data: { session } } = await supabase.auth.getSession()

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') console.log('User signed out')
  if (event === 'TOKEN_REFRESHED') console.log('Token refreshed')
})</code></pre>
            <div class="callout-warning">
              <strong>Security Note:</strong> Always validate the current session before performing sensitive operations. Sessions expire based on your project settings — use <code>onAuthStateChange</code> to handle token refreshes gracefully.
            </div>
          </div>
        `,
        defaultCode: `// Send a password reset email
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  { redirectTo: 'https://myapp.com/update-password' }
);

if (error) {
  console.error(error.message);
} else {
  console.log("Password reset email sent!");
}

// Check current session
const { data: sessionData } = await supabase.auth.getSession();
console.log("Current session:", sessionData.session ? "Active" : "None");

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event);
  if (session) console.log("User:", session.user.email);
});`,
        takeaways: [
          'resetPasswordForEmail() sends a password reset link to the user',
          'updateUser() sets the new password after the user clicks the reset link',
          'getSession() retrieves the current active session',
          'onAuthStateChange() lets you react to sign-in, sign-out, and token refresh events',
        ],
      },
    ],
    quiz: [
      {
        id: 'q1',
        question: 'Which method is used to register a new user in Supabase?',
        options: [
          'supabase.register()',
          'supabase.auth.signUp()',
          'supabase.createUser()',
          'supabase.users.insert()',
        ],
        correct: 1,
      },
      {
        id: 'q2',
        question: 'What does supabase.auth.signInWithOtp() do?',
        options: [
          'Creates a new user account',
          'Sends a one-time password or magic link to the user\'s email',
          'Verifies a user\'s phone number',
          'Updates the user\'s password',
        ],
        correct: 1,
      },
      {
        id: 'q3',
        question: 'How do you listen for authentication state changes in Supabase?',
        options: [
          'supabase.auth.onAuthChange()',
          'supabase.auth.listen()',
          'supabase.auth.onAuthStateChange()',
          'supabase.auth.subscribe()',
        ],
        correct: 2,
      },
      {
        id: 'q4',
        question: 'What does supabase.auth.getSession() return?',
        options: [
          'A list of all active sessions',
          'The current user session object',
          'The user\'s profile data',
          'The authentication configuration',
        ],
        correct: 1,
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Module 2: PostgreSQL CRUD via JS Client
  // ─────────────────────────────────────────────
  {
    id: 'mod-2',
    title: 'PostgreSQL CRUD via JS Client',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Inserting Data',
        objectives: [
          'Insert rows into a table using the Supabase JS client',
          'Understand the from().insert() chain',
          'Handle insert responses and errors',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Writing to the Database</h2>
            <p>With Supabase, you can interact with your PostgreSQL database directly from the frontend using the JS Client. The client builds SQL queries for you through a clean chainable API.</p>
            <h3>Using insert()</h3>
            <p>To add a row, specify the table with <code>from()</code> and chain <code>insert()</code> with an array of objects.</p>
            <pre><code>const { data, error } = await supabase
  .from('todos')
  .insert([
    { task: 'Buy groceries', is_complete: false }
  ])
  .select()</code></pre>
            <p>The <code>.select()</code> at the end tells Supabase to return the inserted rows. Without it, only the status is returned. You can insert multiple rows in a single call by passing an array.</p>
            <div class="callout-info">
              <strong>Note:</strong> By default, RLS policies apply to inserts. If your policy uses <code>auth.uid()</code> to set the owner, you may need to include <code>user_id</code> in the inserted object or let the policy handle it.
            </div>
            <p>Try running the simulator code to insert a new todo and watch it appear instantly in the Table Editor!</p>
          </div>
        `,
        defaultCode: `// Insert a new row into the 'todos' table
const { data, error } = await supabase
  .from('todos')
  .insert([
    { task: 'Master Supabase CRUD', is_complete: false, user_id: 'uuid-1' }
  ])
  .select();

if (error) {
  console.error("Insert failed:", error.message);
} else {
  console.log("Inserted row:", data);
}`,
        takeaways: [
          'Use supabase.from("table").insert([...]) to add rows',
          'Append .select() to return the inserted rows in the response',
          'You can insert multiple rows in a single call',
          'RLS policies can automatically assign ownership on insert',
        ],
      },
      {
        id: 'm2-l2',
        title: 'Updating Data',
        objectives: [
          'Update existing rows with the update() method',
          'Apply filters with eq() and match()',
          'Understand the update builder pattern',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Modifying Existing Data</h2>
            <p>To update rows, use the <code>update()</code> method combined with a filter like <code>eq()</code> (equals). The filter determines which rows are affected — without a filter, all rows in the table will be updated!</p>
            <pre><code>const { data, error } = await supabase
  .from('todos')
  .update({ is_complete: true })
  .eq('id', 1)
  .select()</code></pre>
            <p>Supabase uses a <strong>builder pattern</strong>: <code>update()</code> returns an object with filter methods (<code>eq</code>, <code>neq</code>, <code>gt</code>, <code>lt</code>, <code>like</code>, <code>match</code>, etc.) that you chain before executing the query.</p>
            <div class="callout-warning">
              <strong>Always filter your updates!</strong> Calling <code>update()</code> without a filter will update every row in the table. Always chain at least one filter like <code>.eq('id', someValue)</code>.
            </div>
            <p>The <code>.match()</code> filter accepts an object to match multiple columns: <code>.match({ user_id: 'uuid-1', is_complete: false })</code>.</p>
          </div>
        `,
        defaultCode: `// Update the first todo to be complete
const { data, error } = await supabase
  .from('todos')
  .update({ is_complete: true })
  .eq('id', 2)
  .select();

if (error) {
  console.error("Update failed:", error.message);
} else {
  console.log("Updated rows:", data);
}

// Using match() for multi-column filtering
const { data: matchedData } = await supabase
  .from('todos')
  .update({ task: 'Priority task' })
  .match({ user_id: 'uuid-1', is_complete: false })
  .select();

console.log("Matched and updated:", matchedData);`,
        takeaways: [
          'update() modifies existing rows — always chain a filter to scope the update',
          'Use eq(column, value) for single-column matching',
          'Use match({ col1: val1, col2: val2 }) for multi-column matching',
          'Append .select() to return the updated rows in the response',
        ],
      },
      {
        id: 'm2-l3',
        title: 'Selecting & Deleting Data',
        objectives: [
          'Query rows with select() and various filters',
          'Paginate and order results',
          'Delete rows with delete() and proper filters',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Reading and Removing Data</h2>
            <h3>Selecting Rows</h3>
            <p>Use <code>select()</code> to query rows. You can specify columns, add filters, order results, and paginate with <code>range()</code>. By default, <code>select()</code> returns all rows — always use filters in production.</p>
            <pre><code>const { data, error } = await supabase
  .from('todos')
  .select('id, task, is_complete')
  .eq('is_complete', false)
  .order('inserted_at', { ascending: false })
  .range(0, 9)</code></pre>
            <p>This query selects only specific columns, filters for incomplete todos, orders by newest first, and paginates with 10 results per page.</p>
            <h3>Deleting Rows</h3>
            <p>Use <code>delete()</code> with a filter to remove rows. Like <code>update()</code>, deleting without a filter removes everything in the table!</p>
            <pre><code>const { data, error } = await supabase
  .from('todos')
  .delete()
  .eq('id', 1)
  .select()</code></pre>
            <div class="callout-warning">
              <strong>Danger:</strong> Unfiltered <code>delete()</code> is irreversible without a backup. Always double-check your filter before executing deletes in production.
            </div>
          </div>
        `,
        defaultCode: `// Select incomplete todos, ordered by newest first
const { data: todos, error } = await supabase
  .from('todos')
  .select('id, task, is_complete, inserted_at')
  .eq('is_complete', false)
  .order('inserted_at', { ascending: false });

if (error) {
  console.error("Query failed:", error.message);
} else {
  console.log("Incomplete todos:", todos);
}

// Delete a todo by id
const { data: deleted, error: delErr } = await supabase
  .from('todos')
  .delete()
  .eq('id', 2)
  .select();

if (delErr) {
  console.error("Delete failed:", delErr.message);
} else {
  console.log("Deleted:", deleted);
}`,
        takeaways: [
          'select() queries rows — specify columns and filters to limit results',
          'order() sorts results, range() paginates with offset and limit',
          'delete() removes rows — always filter with eq() or match() first',
          'Append .select() to mutation methods to return affected rows',
        ],
      },
    ],
    quiz: [
      {
        id: 'q5',
        question: 'Which method is used to specify the table when building a query?',
        options: [
          'supabase.table("name")',
          'supabase.query("name")',
          'supabase.from("name")',
          'supabase.select("name")',
        ],
        correct: 2,
      },
      {
        id: 'q6',
        question: 'What happens if you call update() or delete() without a filter like eq()?',
        options: [
          'An error is thrown',
          'All rows in the table are affected',
          'Only the first row is affected',
          'Nothing happens — the operation is ignored',
        ],
        correct: 1,
      },
      {
        id: 'q7',
        question: 'How do you return the affected rows after an insert, update, or delete?',
        options: [
          'Call .returning() after the operation',
          'Call .select() after the operation',
          'It always returns the affected rows by default',
          'Use the showResults() helper',
        ],
        correct: 1,
      },
      {
        id: 'q8',
        question: 'Which filter matches multiple columns at once?',
        options: [
          'where()',
          'and()',
          'match()',
          'filter()',
        ],
        correct: 2,
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Module 3: Row Level Security & Realtime
  // ─────────────────────────────────────────────
  {
    id: 'mod-3',
    title: 'Row Level Security & Realtime',
    lessons: [
      {
        id: 'm3-l1',
        title: 'The Power of RLS',
        objectives: [
          'Understand what Row Level Security is and why it matters',
          'Write basic RLS policies for SELECT and INSERT',
          'Use auth.uid() to restrict data to the current user',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Row Level Security (RLS)</h2>
            <p>Because Supabase lets you query the database directly from the client, securing data is critical. Supabase uses PostgreSQL's native Row Level Security to control access at the row level.</p>
            <p>RLS policies act like a <strong>bouncer for your database rows</strong>. Every query is checked against your policies before data is returned or modified.</p>
            <h3>Basic RLS Policy</h3>
            <pre><code>-- Allow users to read only their own todos
CREATE POLICY "Users can read own todos"
ON todos FOR SELECT
USING (auth.uid() = user_id);</code></pre>
            <p>This policy says: "When a user tries to SELECT from the todos table, only return rows where <code>user_id</code> matches their authenticated user ID."</p>
            <div class="callout-info">
              <strong>Key Concept:</strong> Without RLS policies, all client access is denied by default when RLS is enabled. You must explicitly create policies to allow operations.
            </div>
            <p>Policies can be written for <strong>SELECT</strong>, <strong>INSERT</strong> (with CHECK), <strong>UPDATE</strong>, and <strong>DELETE</strong> — each can have its own rules.</p>
          </div>
        `,
        defaultCode: `// Conceptual: RLS runs on the database server
console.log("RLS policies are SQL rules on your Postgres tables.");
console.log("Without policies, RLS denies everything by default.");
console.log("Policy example for SELECT:");
console.log(\`CREATE POLICY "Users can read own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);\`);`,
        takeaways: [
          'RLS is PostgreSQL\'s built-in row-level access control',
          'Policies are SQL rules that run on every query against a table',
          'auth.uid() returns the current authenticated user\'s ID in policies',
          'When RLS is enabled, all access is denied until you create policies',
        ],
      },
      {
        id: 'm3-l2',
        title: 'Realtime Subscriptions Overview',
        objectives: [
          'Subscribe to database changes in real time',
          'Understand the channel subscription model',
          'Use onAuthStateChange to pair auth with realtime',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Realtime in Supabase</h2>
            <p>Supabase extends PostgreSQL with realtime capabilities. You can subscribe to database changes using WebSockets via the <code>channel()</code> API — no additional infrastructure needed.</p>
            <h3>Subscribing to Changes</h3>
            <p>Use <code>supabase.channel()</code> to create a subscription, then listen for <code>postgres_changes</code> events.</p>
            <pre><code>const channel = supabase
  .channel('todos-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'todos' },
    (payload) => {
      console.log('Change received:', payload)
    }
  )
  .subscribe()</code></pre>
            <p>The <code>event</code> can be <code>'INSERT'</code>, <code>'UPDATE'</code>, <code>'DELETE'</code>, or <code>'*'</code> (all). You can also filter by a specific row using a <code>filter</code> parameter: <code>filter: 'user_id=eq.uuid-1'</code>.</p>
            <div class="callout-tip">
              <strong>Pro Tip:</strong> For RLS-enabled tables, realtime subscriptions respect your RLS policies. Users only receive changes for rows they are allowed to see — security is baked in.
            </div>
          </div>
        `,
        defaultCode: `// Subscribe to realtime changes on the todos table
const channel = supabase
  .channel('todos-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'todos' },
    (payload) => {
      console.log('Event type:', payload.eventType);
      console.log('New data:', payload.new);
      console.log('Old data:', payload.old);
    }
  )
  .subscribe();

console.log("Subscribed to todos changes!");

// Subscribe to inserts only
supabase
  .channel('todos-inserts')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'todos' },
    (payload) => console.log('New todo added:', payload.new)
  )
  .subscribe();`,
        takeaways: [
          'Supabase realtime uses WebSockets to stream database changes to clients',
          'Use channel() + on(\'postgres_changes\') to subscribe to table events',
          'Filter by event type: INSERT, UPDATE, DELETE, or * for all',
          'Realtime subscriptions respect RLS policies automatically',
        ],
      },
    ],
    quiz: [
      {
        id: 'q9',
        question: 'What happens if you try to query a table from the client that has RLS enabled, but no policies?',
        options: [
          'You get all the data',
          'You only get data you created',
          'Access is denied (returns empty/error)',
          'The database crashes',
        ],
        correct: 2,
      },
      {
        id: 'q10',
        question: 'Which SQL function returns the current authenticated user\'s ID in an RLS policy?',
        options: [
          'current_user()',
          'user_id()',
          'auth.uid()',
          'session_user()',
        ],
        correct: 2,
      },
      {
        id: 'q11',
        question: 'How do you subscribe to realtime changes on a table?',
        options: [
          'supabase.realtime().subscribe("table")',
          'supabase.from("table").subscribe()',
          'supabase.channel("name").on("postgres_changes", ...).subscribe()',
          'supabase.listen("table", callback)',
        ],
        correct: 2,
      },
      {
        id: 'q12',
        question: 'Do realtime subscriptions respect RLS policies?',
        options: [
          'No, realtime bypasses RLS',
          'Yes, realtime subscriptions respect RLS automatically',
          'Only for SELECT events',
          'Only if you enable RLS for realtime separately',
        ],
        correct: 1,
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Module 4: Supabase Storage
  // ─────────────────────────────────────────────
  {
    id: 'mod-4',
    title: 'Supabase Storage',
    lessons: [
      {
        id: 'm4-l1',
        title: 'Uploading Files',
        objectives: [
          'Upload files to a Supabase storage bucket',
          'Understand the storage.from().upload() API',
          'Handle file upload progress and errors',
        ],
        content: `
          <div class="lesson-prose">
            <h2>File Uploads with Supabase Storage</h2>
            <p>Supabase Storage lets you upload, serve, and manage files — images, documents, videos, and more. Files are stored in <strong>buckets</strong>, which are logical containers with their own security policies.</p>
            <h3>Uploading a File</h3>
            <p>Use <code>supabase.storage.from('bucket').upload(path, file)</code> to upload. The <code>path</code> includes the filename, and the file is a <code>File</code> or <code>Blob</code> object.</p>
            <pre><code>const avatarFile = fileInput.files[0]

const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload('public/avatar1.png', avatarFile)</code></pre>
            <p>You can optionally pass <code>upsert: true</code> to overwrite an existing file at the same path, and set cache control with the <code>cacheControl</code> option.</p>
            <div class="callout-info">
              <strong>Storage Buckets:</strong> By default, buckets are <strong>private</strong> and require RLS-style policies. Make a bucket <strong>public</strong> in the dashboard for files that should be accessible to everyone without authentication.
            </div>
            <p>Files can be organized in folders within a bucket by including the folder in the path: <code>'users/123/avatar.png'</code>.</p>
          </div>
        `,
        defaultCode: `// Upload a file to the avatars bucket
const file = new Blob(['fake image content'], { type: 'image/png' });
file.name = 'avatar.png';

const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload('public/' + file.name, file, {
    upsert: true,
    cacheControl: '3600'
  });

if (error) {
  console.error("Upload failed:", error.message);
} else {
  console.log("Uploaded successfully:", data.path);
}`,
        takeaways: [
          'Use storage.from("bucket").upload(path, file) to upload files',
          'Buckets are logical containers with independent security policies',
          'The path can include folders for organization: "folder/file.png"',
          'Use upsert: true to overwrite an existing file at the same path',
        ],
      },
      {
        id: 'm4-l2',
        title: 'Downloading & Listing Files',
        objectives: [
          'List files in a storage bucket',
          'Download files using the Supabase JS client',
          'Generate signed URLs for temporary access',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Managing Stored Files</h2>
            <h3>Listing Files</h3>
            <p>Use <code>storage.from().list()</code> to list files in a bucket. You can optionally pass a prefix to list files within a specific folder.</p>
            <pre><code>const { data, error } = await supabase
  .storage
  .from('avatars')
  .list('public/', { sortBy: { column: 'created_at', order: 'desc' } })</code></pre>
            <h3>Downloading & Signed URLs</h3>
            <p>For private buckets, generate a temporary signed URL that expires after a set time using <code>createSignedUrl()</code>. For public buckets, use <code>getPublicUrl()</code>.</p>
            <pre><code>// Temporary signed URL (expires in 60 seconds)
const { data: signedUrl } = await supabase
  .storage
  .from('avatars')
  .createSignedUrl('public/avatar1.png', 60)

// Permanent public URL (bucket must be public)
const { data: publicUrl } = supabase
  .storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png')</code></pre>
            <div class="callout-tip">
              <strong>Pro Tip:</strong> Use signed URLs for private files that need temporary access. Use public URLs for assets that should always be accessible, like user avatars on a profile page.
            </div>
          </div>
        `,
        defaultCode: `// List files in the avatars bucket
const { data: files, error: listError } = await supabase
  .storage
  .from('avatars')
  .list('public/', { sortBy: { column: 'created_at', order: 'desc' } });

if (listError) {
  console.error("List failed:", listError.message);
} else {
  console.log("Files:", files.map(f => f.name));
}

// Get a public URL
const { data: publicUrlData } = supabase
  .storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png');

console.log("Public URL:", publicUrlData.publicUrl);`,
        takeaways: [
          'list() returns files in a bucket, optionally filtered by prefix',
          'createSignedUrl() generates a time-limited URL for private files',
          'getPublicUrl() returns a permanent URL for files in public buckets',
          'Use sortBy to control the order of listed files',
        ],
      },
      {
        id: 'm4-l3',
        title: 'Public vs Private Buckets',
        objectives: [
          'Understand the difference between public and private buckets',
          'Configure bucket-level security policies',
          'Move files between buckets and manage access control',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Storage Security & Access Control</h2>
            <p>Supabase Storage uses a policy system similar to RLS for controlling access to files. Every bucket can be <strong>public</strong> (anyone can read) or <strong>private</strong> (requires authenticated access and policies).</p>
            <h3>Bucket Policies</h3>
            <p>You can create storage policies in the Supabase dashboard or via SQL. These policies control who can SELECT (download), INSERT (upload), UPDATE, and DELETE files.</p>
            <pre><code>-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND bucket_id = 'avatars'
);</code></pre>
            <p>When a bucket is public, the <code>getPublicUrl()</code> method returns a directly accessible URL. For private buckets, files are only accessible through signed URLs or by authenticated requests that satisfy your storage policies.</p>
            <div class="callout-warning">
              <strong>Security:</strong> Even for public buckets, you should still set upload and delete policies. "Public" means public read access — not public write access!
            </div>
            <p>Use <code>supabase.storage.from().remove(paths)</code> to delete files, and always verify your policies in the dashboard before deploying.</p>
          </div>
        `,
        defaultCode: `// Check bucket visibility by trying to get a public URL
const bucketName = 'avatars';
const filePath = 'public/avatar1.png';

const { data: urlData } = supabase
  .storage
  .from(bucketName)
  .getPublicUrl(filePath);

console.log("File URL:", urlData.publicUrl);
console.log("Note: Public URLs only work if the bucket is public.");

// Remove outdated files
const { error: removeError } = await supabase
  .storage
  .from(bucketName)
  .remove(['public/old-avatar.png']);

if (removeError) {
  console.error("Remove failed:", removeError.message);
} else {
  console.log("Old avatar removed successfully");
}`,
        takeaways: [
          'Public buckets allow unauthenticated reads via getPublicUrl()',
          'Private buckets require signed URLs or authenticated requests',
          'Storage policies use the same auth.uid() and auth.role() pattern as RLS',
          'Always set upload/delete policies even on public buckets',
        ],
      },
    ],
    quiz: [
      {
        id: 'q13',
        question: 'Which method uploads a file to a Supabase storage bucket?',
        options: [
          'supabase.storage.upload("bucket", path, file)',
          'supabase.storage.from("bucket").upload(path, file)',
          'supabase.storage.from("bucket").put(path, file)',
          'supabase.storage.bucket("bucket").upload(path, file)',
        ],
        correct: 1,
      },
      {
        id: 'q14',
        question: 'How do you generate a time-limited URL for a file in a private bucket?',
        options: [
          'getPublicUrl()',
          'createSignedUrl()',
          'generateUrl()',
          'getTemporaryUrl()',
        ],
        correct: 1,
      },
      {
        id: 'q15',
        question: 'What does getPublicUrl() require to work?',
        options: [
          'An authenticated user session',
          'The bucket must be public',
          'A valid signed token',
          'An admin API key',
        ],
        correct: 1,
      },
      {
        id: 'q16',
        question: 'What does the storage.objects table store policies for?',
        options: [
          'Database table objects',
          'Storage files and folders',
          'User profile objects',
          'Edge function objects',
        ],
        correct: 1,
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Module 5: Edge Functions
  // ─────────────────────────────────────────────
  {
    id: 'mod-5',
    title: 'Edge Functions',
    lessons: [
      {
        id: 'm5-l1',
        title: 'Creating Your First Edge Function',
        objectives: [
          'Understand what Supabase Edge Functions are',
          'Create and serve a basic Deno function',
          'Use the serve() handler from the Supabase library',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Supabase Edge Functions</h2>
            <p>Edge Functions are server-side TypeScript functions that run on <strong>Deno</strong> at the edge — close to your users worldwide. They are perfect for webhooks, integrating third-party APIs, and executing privileged database operations that shouldn't run on the client.</p>
            <h3>Your First Function</h3>
            <p>Edge Functions use the <code>@supabase/supabase-js</code> and <code>std/http/server</code> libraries. Every function exports a <code>serve()</code> handler.</p>
            <pre><code>import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { name } = await req.json()
  const data = { message: \`Hello \${name}!\` }
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})</code></pre>
            <div class="callout-info">
              <strong>Why Edge Functions?</strong> They start in milliseconds (no cold starts like traditional servers), run in 30+ regions worldwide, and have direct access to your Supabase project with the service role key.
            </div>
          </div>
        `,
        defaultCode: `// Conceptual: Edge Function code
console.log("Edge Functions run on Deno at the edge.");
console.log("They use serve() from the Deno HTTP server.");
console.log("");
console.log("Example function handler:");
console.log(\`serve(async (req) => {
  const body = await req.json();
  return new Response(JSON.stringify({ echo: body }), {
    headers: { 'Content-Type': 'application/json' },
  });
});\`);`,
        takeaways: [
          'Edge Functions run on Deno, not Node.js — they use ES modules and TypeScript natively',
          'Functions deploy to the edge (CDN) for low-latency worldwide access',
          'Use serve() from the Deno HTTP standard library to create handlers',
          'Edge Functions have access to the Supabase admin client via service_role key',
        ],
      },
      {
        id: 'm5-l2',
        title: 'Handling Requests & Responses',
        objectives: [
          'Parse different request types (GET, POST) in edge functions',
          'Set CORS headers for browser access',
          'Return structured JSON responses with proper status codes',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Request Handling in Edge Functions</h2>
            <p>Edge functions receive a standard <code>Request</code> object and must return a <code>Response</code> object. You handle different HTTP methods by checking <code>req.method</code>.</p>
            <h3>Handling CORS</h3>
            <p>If your function is called from a browser, you need CORS headers. A common pattern is to handle OPTIONS preflight requests and add CORS headers to every response.</p>
            <pre><code>const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { data, error } = await supabase.from('todos').select('*')

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: error ? 400 : 200,
  })
})</code></pre>
            <div class="callout-tip">
              <strong>Pro Tip:</strong> Use the <code>Authorization</code> header to pass the user's JWT to the edge function, then use <code>supabase.auth.getUser()</code> to verify the user server-side.
            </div>
          </div>
        `,
        defaultCode: `// Conceptual: Edge Function with CORS and method routing
console.log("Edge Functions handle raw Request/Response objects.");
console.log("");
console.log("Method handling pattern:");
console.log("if (req.method === 'GET') { /* read data */ }");
console.log("if (req.method === 'POST') { /* create data */ }");
console.log("");
console.log("Always include CORS headers for browser access:");
console.log("Access-Control-Allow-Origin: *");`,
        takeaways: [
          'Edge functions use the standard Web API Request and Response objects',
          'Always handle CORS preflight (OPTIONS) for browser-invoked functions',
          'Check req.method to route different HTTP methods to different logic',
          'Use supabase.auth.getUser(token) to authenticate requests server-side',
        ],
      },
      {
        id: 'm5-l3',
        title: 'Deploying & Managing Secrets',
        objectives: [
          'Deploy edge functions with the Supabase CLI',
          'Manage environment secrets for edge functions',
          'Invoke deployed functions from the client',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Deploying Edge Functions</h2>
            <p>Edge functions can be deployed using the Supabase CLI, connected to your GitHub repo for automatic deploys, or deployed directly from the dashboard.</p>
            <h3>CLI Commands</h3>
            <pre><code># Create a new function locally
supabase functions new hello-world

# Deploy a function
supabase functions deploy hello-world

# Set secrets for functions
supabase secrets set MY_API_KEY=value

# List all secrets
supabase secrets list</code></pre>
            <h3>Invoking from the Client</h3>
            <p>Use <code>supabase.functions.invoke()</code> to call a deployed function. The client automatically sends the user's JWT for authentication.</p>
            <pre><code>const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'Supabase' },
})</code></pre>
            <div class="callout-warning">
              <strong>Secrets Management:</strong> Never hardcode API keys in your function code. Use <code>supabase secrets set</code> and access them via <code>Deno.env.get()</code> in your function.
            </div>
          </div>
        `,
        defaultCode: `// Invoke a deployed edge function from the client
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'Supabase User' },
  headers: { 'X-Custom-Header': 'value' }
});

if (error) {
  console.error("Function invocation failed:", error.message);
} else {
  console.log("Function response:", data);
}

// In your edge function, access secrets via Deno.env:
// const apiKey = Deno.env.get('MY_API_KEY');
console.log("Tip: Use Deno.env.get() in edge functions for secrets.");`,
        takeaways: [
          'Use supabase functions deploy to deploy edge functions to production',
          'Manage secrets with supabase secrets set — never hardcode them',
          'Use supabase.functions.invoke() to call functions from the client',
          'The client automatically sends the user JWT with the function request',
        ],
      },
    ],
    quiz: [
      {
        id: 'q17',
        question: 'What runtime do Supabase Edge Functions use?',
        options: [
          'Node.js',
          'Deno',
          'Python',
          'Bun',
        ],
        correct: 1,
      },
      {
        id: 'q18',
        question: 'How do you invoke an edge function from the Supabase JS client?',
        options: [
          'supabase.edge.call("function-name")',
          'supabase.functions.invoke("function-name")',
          'supabase.invoke("function-name")',
          'supabase.functions.call("function-name")',
        ],
        correct: 1,
      },
      {
        id: 'q19',
        question: 'How do you access environment secrets inside an edge function?',
        options: [
          'process.env.SECRET_NAME',
          'Deno.env.get("SECRET_NAME")',
          'supabase.secrets.get("SECRET_NAME")',
          'import.meta.env.SECRET_NAME',
        ],
        correct: 1,
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Module 6: Realtime Subscriptions
  // ─────────────────────────────────────────────
  {
    id: 'mod-6',
    title: 'Realtime Subscriptions',
    lessons: [
      {
        id: 'm6-l1',
        title: 'Channel Subscriptions',
        objectives: [
          'Create and manage realtime channels',
          'Filter database changes by event type and row',
          'Handle subscribe and unsubscribe lifecycle',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Realtime Channels in Depth</h2>
            <p>Supabase realtime uses a <strong>channel-based</strong> architecture. A channel is a named communication stream that you can subscribe to for different types of events.</p>
            <h3>Channel Configuration</h3>
            <p>Each channel can listen to <code>postgres_changes</code> (database changes), <code>presence</code> (who is online), and <code>broadcast</code> (custom messages).</p>
            <pre><code>const channel = supabase.channel('room-1', {
  config: {
    broadcast: { self: true },
    presence: { key: 'user-id' },
  },
})

channel
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages',
      filter: 'room_id=eq.room-1' },
    (payload) => console.log('New message:', payload.new)
  )
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to channel!')
    }
  })</code></pre>
            <p>You can create multiple channels for different features (chat, notifications, live updates) and manage them independently.</p>
            <div class="callout-info">
              <strong>Channel Lifecycle:</strong> Call <code>channel.unsubscribe()</code> to clean up when leaving a view or component. Unsubscribed channels stop receiving events and free up resources.
            </div>
          </div>
        `,
        defaultCode: `// Create a channel for realtime updates
const channel = supabase.channel('demo-channel');

// Listen for all changes on todos
channel
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'todos' },
    (payload) => {
      console.log('Change detected:');
      console.log('  Type:', payload.eventType);
      console.log('  New:', JSON.stringify(payload.new, null, 2));
    }
  )
  .subscribe((status) => {
    console.log('Channel status:', status);
  });

console.log("Listening for changes...");
console.log("Run an insert in the simulator to see it in action.");`,
        takeaways: [
          'A channel is a named stream for realtime events',
          'Channels can subscribe to postgres_changes, presence, and broadcast events',
          'Use the filter parameter to narrow which rows trigger events',
          'Always unsubscribe from channels when they are no longer needed',
        ],
      },
      {
        id: 'm6-l2',
        title: 'Presence & Broadcast',
        objectives: [
          'Track online users with presence channels',
          'Send custom messages between clients with broadcast',
          'Combine presence and broadcast for collaborative features',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Beyond Database Changes</h2>
            <p>Supabase realtime isn't limited to database changes — you can also use <strong>Presence</strong> to track online users and <strong>Broadcast</strong> to send custom messages between clients.</p>
            <h3>Presence</h3>
            <p>Presence tracks which users are currently connected to a channel. Each user sends a <code>track()</code> call with their state, and other users receive updates when someone joins or leaves.</p>
            <pre><code>const channel = supabase.channel('room-1')

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', Object.keys(state))
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', newPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user: 'user-1', online_at: new Date() })
    }
  })</code></pre>
            <h3>Broadcast</h3>
            <p>Broadcast sends custom messages to all other clients on the same channel — useful for typing indicators, cursor positions, or game moves.</p>
            <pre><code>channel.send({
  type: 'broadcast',
  event: 'cursor-move',
  payload: { x: 100, y: 200 },
})</code></pre>
            <div class="callout-tip">
              <strong>Pro Tip:</strong> Combine presence + broadcast for collaborative features like live cursors, "User is typing..." indicators, and real-time multiplayer games.
            </div>
          </div>
        `,
        defaultCode: `// Set up a channel with presence tracking
const channel = supabase.channel('room-1');

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Current users:', Object.keys(state));
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', newPresences[0]?.user);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', leftPresences[0]?.user);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user: 'anonymous',
        online_at: new Date().toISOString()
      });
      console.log("You are now tracking presence!");
    }
  });

// Broadcast a custom message
channel.send({
  type: 'broadcast',
  event: 'test-event',
  payload: { message: 'Hello everyone!' }
});`,
        takeaways: [
          'Presence tracks which users are online in a channel',
          'Broadcast sends custom messages to all other channel subscribers',
          'Use channel.track() to share your state with other users',
          'Presence events: sync (full state), join, and leave',
        ],
      },
    ],
    quiz: [
      {
        id: 'q20',
        question: 'How do you track online users in a realtime channel?',
        options: [
          'channel.on("presence", ...) with channel.track()',
          'channel.on("users", ...) with channel.join()',
          'channel.on("online", ...) with channel.presence()',
          'channel.subscribe("presence")',
        ],
        correct: 0,
      },
      {
        id: 'q21',
        question: 'What does broadcast allow you to do?',
        options: [
          'Send database changes to all clients',
          'Send custom messages to all clients on the same channel',
          'Broadcast emails to users',
          'Deploy functions to the edge',
        ],
        correct: 1,
      },
      {
        id: 'q22',
        question: 'How do you stop listening to a channel?',
        options: [
          'channel.destroy()',
          'channel.close()',
          'channel.unsubscribe()',
          'channel.stop()',
        ],
        correct: 2,
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Module 7: Database Migrations & Schema Design
  // ─────────────────────────────────────────────
  {
    id: 'mod-7',
    title: 'Database Migrations & Schema Design',
    lessons: [
      {
        id: 'm7-l1',
        title: 'Migrations with Supabase CLI',
        objectives: [
          'Create and manage database migrations',
          'Apply migrations to local and remote databases',
          'Understand migration workflow for team collaboration',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Database Migrations</h2>
            <p>Migrations are version-controlled SQL files that track changes to your database schema over time. They let you evolve your database predictably and collaborate with team members.</p>
            <h3>Working with Migrations</h3>
            <p>The Supabase CLI provides commands to create and apply migrations.</p>
            <pre><code># Create a new migration file
supabase migration new create_profiles_table

# Apply migrations to local database
supabase db push

# Generate a migration from schema diff
supabase db diff --use-migra -f add_profile_avatars</code></pre>
            <p>Migration files are plain SQL stored in <code>supabase/migrations/</code> with timestamps. Each file represents one logical change: creating a table, adding a column, or setting up an index.</p>
            <div class="callout-info">
              <strong>Best Practice:</strong> Always review auto-generated migrations before committing. Migration files should be added to version control so your entire team stays in sync.
            </div>
            <p>The standard workflow: edit your schema in the dashboard → run <code>supabase db diff</code> → review the generated migration → commit it.</p>
          </div>
        `,
        defaultCode: `// Conceptual: Migration workflow with Supabase CLI
console.log("=== Migration Workflow ===");
console.log("");
console.log("1. Create a migration:");
console.log("   supabase migration new create_profiles");
console.log("");
console.log("2. Edit the SQL file in supabase/migrations/");
console.log("3. Apply to local DB:");
console.log("   supabase db push");
console.log("");
console.log("4. Generate from schema changes:");
console.log("   supabase db diff -f add_avatar_column");
console.log("");
console.log("5. Commit migration files to version control");`,
        takeaways: [
          'Migrations are version-controlled SQL files that track schema changes',
          'Use supabase migration new to create a new migration file',
          'Use supabase db push to apply pending migrations locally',
          'Migration files belong in version control for team collaboration',
        ],
      },
      {
        id: 'm7-l2',
        title: 'Schema Design Best Practices',
        objectives: [
          'Design tables with proper relationships and constraints',
          'Use foreign keys to maintain referential integrity',
          'Add indexes for query performance',
        ],
        content: `
          <div class="lesson-prose">
            <h2>PostgreSQL Schema Design</h2>
            <p>Good schema design is the foundation of a performant and maintainable application. Supabase uses PostgreSQL, which gives you powerful features like foreign keys, constraints, and indexes.</p>
            <h3>Tables & Relationships</h3>
            <p>Define your tables with clear relationships using <strong>foreign keys</strong>. A foreign key ensures that a value in one table exists in another table — preventing orphaned records.</p>
            <pre><code>CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);</code></pre>
            <h3>Indexes</h3>
            <p>Indexes speed up queries on columns you filter or sort by. Create indexes for foreign keys and frequently queried columns.</p>
            <pre><code>CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);</code></pre>
            <div class="callout-warning">
              <strong>Performance Tip:</strong> Don't index every column — indexes speed up reads but slow down writes. Index only the columns used in WHERE clauses, JOINs, and ORDER BY.
            </div>
          </div>
        `,
        defaultCode: `// Conceptual: Schema design
console.log("=== Schema Design Example ===");
console.log("");
console.log("CREATE TABLE profiles (");
console.log("  id UUID PRIMARY KEY REFERENCES auth.users(id),");
console.log("  username TEXT UNIQUE NOT NULL,");
console.log("  avatar_url TEXT,");
console.log("  created_at TIMESTAMPTZ DEFAULT now()");
console.log(");");
console.log("");
console.log("CREATE INDEX idx_profiles_username ON profiles(username);");
console.log("");
console.log("Tip: Use REFERENCES for foreign keys and");
console.log("UNIQUE for columns that must have distinct values.");`,
        takeaways: [
          'Use foreign keys (REFERENCES) to maintain referential integrity',
          'Primary keys can be UUIDs (for auth integration) or BIGSERIAL (auto-increment)',
          'Add indexes on foreign key columns and frequently filtered columns',
          'Use constraints like UNIQUE, NOT NULL, and CHECK to enforce data quality',
        ],
      },
    ],
    quiz: [
      {
        id: 'q23',
        question: 'Which CLI command creates a new migration file?',
        options: [
          'supabase db push',
          'supabase migration new',
          'supabase db diff',
          'supabase migration create',
        ],
        correct: 1,
      },
      {
        id: 'q24',
        question: 'What does a foreign key (REFERENCES) do?',
        options: [
          'Creates an index on the column',
          'Ensures the value exists in another table',
          'Makes the column unique',
          'Sets a default value for the column',
        ],
        correct: 1,
      },
      {
        id: 'q25',
        question: 'When should you add an index to a column?',
        options: [
          'To every column in the table',
          'Only to primary key columns',
          'To columns used in WHERE clauses, JOINs, and ORDER BY',
          'Indexes are not needed in PostgreSQL',
        ],
        correct: 2,
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Module 8: Multi-Provider Auth (OAuth)
  // ─────────────────────────────────────────────
  {
    id: 'mod-8',
    title: 'Multi-Provider Auth (OAuth)',
    lessons: [
      {
        id: 'm8-l1',
        title: 'Google OAuth Setup',
        objectives: [
          'Configure Google as an OAuth provider in Supabase',
          'Implement Google sign-in with signInWithOAuth()',
          'Handle the OAuth redirect and session',
        ],
        content: `
          <div class="lesson-prose">
            <h2>OAuth with Google</h2>
            <p>Supabase supports <strong>Google OAuth</strong> out of the box. Users can sign in with their Google account instead of creating a password — reducing friction and leveraging Google's security.</p>
            <h3>Configuration Steps</h3>
            <p>To enable Google OAuth: (1) Create credentials in the Google Cloud Console, (2) Add the Client ID and Client Secret in Supabase Auth Settings, (3) Configure the redirect URL.</p>
            <h3>Client Implementation</h3>
            <p>On the frontend, call <code>signInWithOAuth()</code> with the provider name. Supabase redirects the user to Google's consent screen and returns them with a valid session.</p>
            <pre><code>const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://myapp.com/auth/callback',
    scopes: 'email profile',
  },
})</code></pre>
            <div class="callout-info">
              <strong>How OAuth Works:</strong> Your app never sees the user's Google password. Google sends Supabase an identity token, Supabase creates or links a local user, and your app gets back a session — all without handling sensitive credentials.
            </div>
          </div>
        `,
        defaultCode: `// Sign in with Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://myapp.com/auth/callback',
    scopes: 'email profile',
  },
});

if (error) {
  console.error("OAuth error:", error.message);
} else {
  console.log("Redirecting to Google...");
  console.log("OAuth URL:", data.url);
}

// After the redirect, check the session:
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  console.log("Signed in with Google:", session.user.email);
}`,
        takeaways: [
          'Configure OAuth providers in the Supabase dashboard Auth Settings',
          'Use signInWithOAuth({ provider: "google" }) to initiate sign-in',
          'The redirectTo option controls where the user lands after OAuth',
          'Supabase handles token exchange — your app never sees the provider secret',
        ],
      },
      {
        id: 'm8-l2',
        title: 'GitHub OAuth & Social Login',
        objectives: [
          'Configure GitHub as an OAuth provider',
          'Add multiple social login providers',
          'Access provider-specific user data',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Multiple Social Providers</h2>
            <p>Supabase supports many OAuth providers: GitHub, Google, Facebook, Twitter, Discord, Apple, Slack, and more. You can enable multiple providers — users choose their preferred method.</p>
            <h3>GitHub OAuth</h3>
            <p>GitHub OAuth is popular for developer tools. Configure it similarly to Google: register an OAuth app in GitHub Settings, add the Client ID and Secret to Supabase, and implement the client-side call.</p>
            <pre><code>const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: 'https://myapp.com/auth/callback',
    scopes: 'read:user repo',
  },
})</code></pre>
            <h3>Multiple Providers UI</h3>
            <p>Build a simple provider selection UI with buttons for each provider. Each button calls <code>signInWithOAuth</code> with a different provider name.</p>
            <div class="callout-tip">
              <strong>Pro Tip:</strong> Use <code>provider</code> as the key and <code>scopes</code> to request additional permissions. Different providers support different scopes — check the provider's OAuth documentation.
            </div>
          </div>
        `,
        defaultCode: `// Sign in with GitHub
const { data: ghData, error: ghError } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: 'https://myapp.com/auth/callback',
    scopes: 'read:user',
  },
});

if (ghError) {
  console.error("GitHub OAuth error:", ghError.message);
} else {
  console.log("Redirecting to GitHub...");
}

// You can also check which providers are enabled
console.log("Common providers: google, github, discord, twitter, apple");
console.log("Use signInWithOAuth({ provider: 'name' }) for each.");`,
        takeaways: [
          'Supabase supports 15+ OAuth providers — enable them in the dashboard',
          'Each provider requires its own Client ID and Client Secret',
          'Scopes request additional permissions from the provider',
          'Build a UI with provider buttons, each calling signInWithOAuth()',
        ],
      },
      {
        id: 'm8-l3',
        title: 'Custom Providers & Linking Accounts',
        objectives: [
          'Link multiple OAuth accounts to a single Supabase user',
          'Use custom tokens for custom authentication flows',
          'Unlink provider accounts when needed',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Account Linking & Custom Auth</h2>
            <h3>Linking Multiple Providers</h3>
            <p>Supabase allows a single user to link multiple OAuth providers to their account. This lets users sign in with Google today and GitHub tomorrow — both pointing to the same profile.</p>
            <pre><code>// Link a GitHub identity to the current user
const { data, error } = await supabase.auth.linkIdentity({
  provider: 'github',
  options: { redirectTo: 'https://myapp.com/auth/callback' },
})</code></pre>
            <h3>Custom Tokens</h3>
            <p>If you have your own authentication system, you can issue <strong>custom tokens</strong> using <code>supabase.auth.admin.createUser()</code> on the server, then sign in with <code>signInWithIdToken()</code> on the client.</p>
            <pre><code>const { data, error } = await supabase.auth.signInWithIdToken({
  provider: 'apple',
  token: 'id-token-from-apple',
})</code></pre>
            <div class="callout-warning">
              <strong>Linking Note:</strong> Account linking requires the user to be authenticated first. Call <code>linkIdentity()</code> from a settings page where users can manage their connected accounts.
            </div>
          </div>
        `,
        defaultCode: `// Link an additional provider to the current user
// User must be signed in first
const { data: sessionData } = await supabase.auth.getSession();

if (sessionData.session) {
  console.log("Current user:", sessionData.session.user.email);
  console.log("To link another provider, call:");
  console.log("await supabase.auth.linkIdentity({ provider: 'github' })");
} else {
  console.log("Please sign in first before linking providers.");
}

// Unlink a provider
// await supabase.auth.unlinkIdentity(identityId);
console.log("Use unlinkIdentity(identityId) to remove a linked provider.");`,
        takeaways: [
          'Use linkIdentity() to add another OAuth provider to an existing user',
          'Use signInWithIdToken() for custom auth flows with third-party tokens',
          'Account linking lets users have multiple sign-in methods for one account',
          'Use unlinkIdentity() to remove a previously linked provider',
        ],
      },
    ],
    quiz: [
      {
        id: 'q26',
        question: 'Which method initiates OAuth sign-in with a provider like Google?',
        options: [
          'supabase.auth.signIn()',
          'supabase.auth.signInWithOAuth()',
          'supabase.auth.oAuth()',
          'supabase.auth.signInWithProvider()',
        ],
        correct: 1,
      },
      {
        id: 'q27',
        question: 'How do you add another OAuth provider to an existing user?',
        options: [
          'supabase.auth.linkIdentity()',
          'supabase.auth.addProvider()',
          'supabase.auth.connectIdentity()',
          'supabase.auth.attachProvider()',
        ],
        correct: 0,
      },
      {
        id: 'q28',
        question: 'Where do you configure OAuth provider credentials (Client ID, Secret)?',
        options: [
          'In the client-side JavaScript code',
          'In the Supabase Dashboard Auth Settings',
          'In the database directly',
          'In the edge function configuration',
        ],
        correct: 1,
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Module 9: Advanced RLS Policies
  // ─────────────────────────────────────────────
  {
    id: 'mod-9',
    title: 'Advanced RLS Policies',
    lessons: [
      {
        id: 'm9-l1',
        title: 'Team-Based Access Policies',
        objectives: [
          'Write RLS policies for multi-tenant applications',
          'Use team membership tables to control access',
          'Implement role-based access within teams',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Multi-Tenant RLS</h2>
            <p>Many applications need <strong>team-based access</strong>: users belong to teams, and data is shared within a team but isolated from other teams.</p>
            <h3>Team Membership Pattern</h3>
            <p>The standard approach uses a <strong>join table</strong> for team membership, then references it in your RLS policies.</p>
            <pre><code>CREATE TABLE team_members (
  user_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES teams(id),
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (user_id, team_id)
);

-- RLS policy for team-scoped access
CREATE POLICY "Team members can read projects"
ON projects FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
);</code></pre>
            <p>This policy checks: "Is the current user a member of the team that owns this project?" If yes, they can read the project. The same pattern works for INSERT, UPDATE, and DELETE.</p>
            <div class="callout-info">
              <strong>Performance Tip:</strong> For frequently accessed policies with subqueries, consider creating a <strong>materialized view</strong> or using <code>auth.jwt()</code> to embed team memberships in the JWT for faster lookups.
            </div>
          </div>
        `,
        defaultCode: `// Conceptual: Team-based RLS
console.log("=== Team-based RLS Policy ===");
console.log("");
console.log("CREATE POLICY team_read_projects ON projects FOR SELECT");
console.log("USING (");
console.log("  team_id IN (");
console.log("    SELECT team_id FROM team_members");
console.log("    WHERE user_id = auth.uid()");
console.log("  )");
console.log(");");
console.log("");
console.log("This allows users to read projects owned by teams they belong to.");
console.log("Add role checks for granular access: 'admin', 'member', 'viewer'.");`,
        takeaways: [
          'Use a team_members join table to model many-to-many user-team relationships',
          'RLS subqueries can check membership in related tables',
          'Include a role column in team_members for role-based access within teams',
          'Consider embedding team memberships in the JWT for performance',
        ],
      },
      {
        id: 'm9-l2',
        title: 'RLS with Joins & Helper Functions',
        objectives: [
          'Use PostgreSQL functions inside RLS policies',
          'Create helper functions for reusable policy logic',
          'Reference related tables in policies with subqueries',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Advanced RLS Techniques</h2>
            <h3>Helper Functions</h3>
            <p>For complex policies, create PostgreSQL <strong>helper functions</strong> that encapsulate reusable logic. Functions keep your policies readable and maintainable.</p>
            <pre><code>CREATE OR REPLACE FUNCTION auth.user_is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql STABLE;

-- Use in a policy
CREATE POLICY "Admins can delete projects"
ON projects FOR DELETE
USING (auth.user_is_admin());</code></pre>
            <h3>Subqueries in Policies</h3>
            <p>RLS policies can contain subqueries that reference any table. This is powerful for complex authorization scenarios.</p>
            <pre><code>CREATE POLICY "Users can view comments on their posts"
ON comments FOR SELECT
USING (
  post_id IN (
    SELECT id FROM posts WHERE author_id = auth.uid()
  )
);</code></pre>
            <div class="callout-warning">
              <strong>Performance:</strong> Complex policies with subqueries can slow down queries. Keep policies simple, add indexes on columns used in policy filters, and test with EXPLAIN ANALYZE.
            </div>
          </div>
        `,
        defaultCode: `// Conceptual: Helper functions for RLS
console.log("=== RLS Helper Function Pattern ===");
console.log("");
console.log("CREATE OR REPLACE FUNCTION auth.is_team_member(team_id UUID)");
console.log("RETURNS BOOLEAN AS $$");
console.log("  SELECT EXISTS (");
console.log("    SELECT 1 FROM team_members");
console.log("    WHERE user_id = auth.uid()");
console.log("    AND team_members.team_id = team_id");
console.log("  );");
console.log("$$ LANGUAGE sql STABLE;");
console.log("");
console.log("CREATE POLICY team_profiles ON profiles");
console.log("FOR ALL USING (auth.is_team_member(team_id));");`,
        takeaways: [
          'Helper functions make complex RLS policies reusable and maintainable',
          'Policies support subqueries referencing any table in the database',
          'Use STABLE functions for performance — they can be inlined',
          'Always test policy performance with EXPLAIN ANALYZE',
        ],
      },
      {
        id: 'm9-l3',
        title: 'Debugging & Testing RLS Policies',
        objectives: [
          'Debug RLS policy issues using the SQL editor',
          'Test policies with different user roles',
          'Use best practices to avoid common RLS pitfalls',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Debugging RLS Policies</h2>
            <p>RLS policies can be tricky to debug. When a user gets an unexpected error or empty result, here's how to systematically identify the issue.</p>
            <h3>Debugging Steps</h3>
            <p>Use the Supabase SQL Editor to test your policies directly:</p>
            <pre><code>-- Test as a specific user
SELECT * FROM your_table
LIMIT 5;

-- Check if RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'your_table';

-- View all policies on a table
SELECT * FROM pg_policies
WHERE tablename = 'your_table';</code></pre>
            <h3>Common Pitfalls</h3>
            <ul>
              <li>Forgetting to enable RLS on the table (it's off by default in SQL!)</li>
              <li>Not accounting for <code>auth.uid()</code> returning null for anonymous users</li>
              <li>Missing policies for specific operations (e.g., UPDATE policy but no DELETE policy)</li>
              <li>Using <code>USING</code> for INSERT instead of <code>WITH CHECK</code></li>
            </ul>
            <div class="callout-tip">
              <strong>Testing Strategy:</strong> Create test users with different roles in the dashboard, then run queries as each user to verify your policies behave correctly. Use <code>set local role</code> in the SQL editor to simulate different users.
            </div>
          </div>
        `,
        defaultCode: `// Conceptual: RLS debugging
console.log("=== RLS Debugging Tips ===");
console.log("");
console.log("1. Check if RLS is enabled:");
console.log("   SELECT relname, relrowsecurity FROM pg_class");
console.log("   WHERE relname = 'todos';");
console.log("");
console.log("2. List all policies:");
console.log("   SELECT * FROM pg_policies");
console.log("   WHERE tablename = 'todos';");
console.log("");
console.log("3. Run queries as different users in the SQL editor.");
console.log("4. Check auth.uid() returns the expected value.");
console.log("5. Remember: INSERT uses WITH CHECK, not USING.");`,
        takeaways: [
          'Use pg_policies and pg_class to inspect RLS configuration',
          'Always verify RLS is enabled on each table',
          'Test policies with multiple user roles to catch edge cases',
          'INSERT policies use WITH CHECK, SELECT/UPDATE/DELETE use USING',
        ],
      },
    ],
    quiz: [
      {
        id: 'q29',
        question: 'Which clause does an INSERT RLS policy use to validate the new row?',
        options: [
          'USING',
          'WITH CHECK',
          'VALIDATE',
          'CHECK',
        ],
        correct: 1,
      },
      {
        id: 'q30',
        question: 'How can you check if RLS is enabled on a table?',
        options: [
          'SELECT * FROM pg_policies WHERE tablename = \'table\'',
          'SELECT relname, relrowsecurity FROM pg_class WHERE relname = \'table\'',
          'SHOW rls_status FOR \'table\'',
          'SELECT has_rls(\'table\')',
        ],
        correct: 1,
      },
      {
        id: 'q31',
        question: 'What does auth.uid() return for an unauthenticated (anonymous) request?',
        options: [
          'The string "anonymous"',
          'null',
          'A random UUID',
          'It throws an error',
        ],
        correct: 1,
      },
    ],
  },
  // ─────────────────────────────────────────────
  // Module 10: Supabase CLI & Local Dev
  // ─────────────────────────────────────────────
  {
    id: 'mod-10',
    title: 'Supabase CLI & Local Dev',
    lessons: [
      {
        id: 'm10-l1',
        title: 'CLI Setup & Local Development',
        objectives: [
          'Install and configure the Supabase CLI',
          'Initialize a local Supabase project',
          'Start local services for development',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Supabase CLI Overview</h2>
            <p>The Supabase CLI is your primary tool for local development, database migrations, and project management. It runs a full Supabase stack locally using Docker.</p>
            <h3>Getting Started</h3>
            <p>Install the CLI and initialize your project:</p>
            <pre><code># Install the Supabase CLI
brew install supabase/tap/supabase

# Initialize a new Supabase project
supabase init

# Start all local services
supabase start

# Link to an existing project
supabase link --project-ref your-project-ref</code></pre>
            <p>When you run <code>supabase start</code>, Docker starts containers for PostgreSQL, GoTrue (auth), Realtime, Storage, and the Edge Functions deno watcher — the entire Supabase stack on your machine.</p>
            <div class="callout-info">
              <strong>Why Local Dev?</strong> Develop and test schema changes, RLS policies, and edge functions locally before touching production. Catch mistakes early and iterate quickly without affecting real users.
            </div>
            <p>Executables like <code>supabase status</code> show you the URLs for each service (Studio, API, DB connection) running locally.</p>
          </div>
        `,
        defaultCode: `// Conceptual: Supabase CLI commands
console.log("=== Supabase CLI Cheat Sheet ===");
console.log("");
console.log("supabase init          # Initialize project");
console.log("supabase start         # Start local services");
console.log("supabase stop          # Stop local services");
console.log("supabase status        # Show service status & URLs");
console.log("supabase link          # Link to remote project");
console.log("supabase db push       # Push migrations to DB");
console.log("supabase db pull        # Pull remote schema locally");
console.log("");
console.log("Local URLs:");
console.log("  Studio:    http://localhost:54323");
console.log("  API:       http://localhost:54321");
console.log("  DB:        postgresql://postgres:postgres@localhost:54322/postgres");`,
        takeaways: [
          'The Supabase CLI runs the full Supabase stack locally via Docker',
          'supabase init creates the supabase/ directory structure',
          'supabase start launches PostgreSQL, Auth, Realtime, Storage, and Edge Functions',
          'Local development lets you iterate safely before deploying to production',
        ],
      },
      {
        id: 'm10-l2',
        title: 'Generating Types & Running Migrations',
        objectives: [
          'Generate TypeScript types from your database schema',
          'Manage and apply database migrations with the CLI',
          'Use type generation for type-safe client queries',
        ],
        content: `
          <div class="lesson-prose">
            <h2>Type Generation & Migration Workflow</h2>
            <h3>Generating Types</h3>
            <p>One of the Supabase CLI's most powerful features is automatic <strong>TypeScript type generation</strong> from your database schema. This gives you full type safety when querying your database from the client.</p>
            <pre><code># Generate types for a local database
supabase gen types typescript --local > lib/database.types.ts

# Generate types for a linked project
supabase gen types typescript --linked > lib/database.types.ts

# Generate types for a specific project ID
supabase gen types typescript --project-id abcdef > types/supabase.ts</code></pre>
            <h3>Using Generated Types</h3>
            <p>Pass the generated type to <code>createClient()</code> for auto-complete on table names and columns:</p>
            <pre><code>import { createClient } from '@supabase/supabase-js'
import { Database } from './lib/database.types'

const supabase = createClient<Database>(supabaseUrl, supabaseKey)</code></pre>
            <div class="callout-tip">
              <strong>Pro Tip:</strong> Regenerate types whenever your schema changes. Add a script to your package.json: <code>"gen-types": "supabase gen types typescript --linked > lib/database.types.ts"</code>
            </div>
          </div>
        `,
        defaultCode: `// Conceptual: Type generation & migrations
console.log("=== Type Generation ===");
console.log("");
console.log("supabase gen types typescript --local > database.types.ts");
console.log("");
console.log("Then use in your app:");
console.log("import { Database } from './database.types';");
console.log("const supabase = createClient<Database>(url, key);");
console.log("");
console.log("=== Migration Workflow ===");
console.log("");
console.log("1. supabase migration new add_user_preferences");
console.log("2. Write SQL in supabase/migrations/<timestamp>.sql");
console.log("3. supabase db push (apply locally)");
console.log("4. supabase db pull (sync if remote changed)");
console.log("5. Commit migration files to git");`,
        takeaways: [
          'supabase gen types generates TypeScript types from your database schema',
          'Pass the generated Database type to createClient for full type safety',
          'Regenerate types after every schema change to keep them in sync',
          'Manage schema changes through migration files, not direct SQL edits',
        ],
      },
    ],
    quiz: [
      {
        id: 'q32',
        question: 'Which command starts the local Supabase development environment?',
        options: [
          'supabase init',
          'supabase start',
          'supabase up',
          'supabase run',
        ],
        correct: 1,
      },
      {
        id: 'q33',
        question: 'How do you generate TypeScript types from your database schema?',
        options: [
          'supabase gen types typescript',
          'supabase types generate',
          'supabase db types',
          'supabase generate:types',
        ],
        correct: 0,
      },
      {
        id: 'q34',
        question: 'What does supabase db push do?',
        options: [
          'Downloads the remote schema',
          'Applies local migration files to the database',
          'Pushes code to GitHub',
          'Deploys edge functions',
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
  supabaseEditor: document.getElementById('supabase-editor'),
  runCodeBtn: document.getElementById('run-code-btn'),
  editorConsole: document.getElementById('editor-console'),
  tableSelector: document.getElementById('table-selector'),
  authStatus: document.getElementById('auth-status'),
  gridHeader: document.getElementById('grid-header'),
  gridBody: document.getElementById('grid-body'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
};

// Initialization
function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  renderStudioUI();
  setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.runCodeBtn.addEventListener('click', runSimulation);

  elements.tableSelector.addEventListener('change', (e) => {
    currentTable = e.target.value;
    renderStudioGrid();
  });

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
      btn.classList.add('active', 'border-emerald-500', 'text-emerald-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-emerald-500', 'text-emerald-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  elements.tabPanes.forEach((pane) => {
    if (pane.id === `${tabId}-tab`) {
      pane.classList.remove('hidden');
      pane.classList.add('block');

      if (tabId === 'simulator') {
        pane.classList.remove('block');
        pane.classList.add('flex', 'flex-col');
      }
    } else {
      pane.classList.add('hidden');
      pane.classList.remove('block', 'flex', 'flex-col');
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
            <i class="${isCompleted ? 'fas fa-check-circle text-emerald-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
            ${lesson.title}
          </button>
        </li>
      `;
    });

    html += `</ul></div>`;
  });

  elements.sidebarContent.innerHTML = html;
}

// Load specific lesson
function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;
  const module = curriculum[mIndex];
  const lesson = module.lessons[lIndex];

  if (!userProgress.completedLessons.includes(lesson.id)) {
    markLessonComplete(lesson.id);
  }

  const objectivesHtml = lesson.objectives && lesson.objectives.length
    ? `
      <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-6 rounded-r-lg">
        <h4 class="font-semibold text-indigo-800 mb-2">
          <i class="fa-solid fa-bullseye mr-2"></i>Learning Objectives
        </h4>
        <ul class="list-disc pl-5 text-indigo-700 space-y-1 text-sm">
          ${lesson.objectives.map(o => `<li>${o}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const takeawaysHtml = lesson.takeaways && lesson.takeaways.length
    ? `
      <div class="mt-10 p-5 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 class="font-semibold text-gray-800 mb-3">
          <i class="fa-solid fa-check-double mr-2 text-green-600"></i>Key Takeaways
        </h4>
        <ul class="space-y-2">
          ${lesson.takeaways.map(t => `
            <li class="flex items-start gap-2 text-gray-700">
              <i class="fa-solid fa-circle-check text-green-500 mt-1 text-sm"></i>
              <span>${t}</span>
            </li>
          `).join('')}
        </ul>
      </div>`
    : '';

  const eli5Html = (window.eli5Toggle && window.eli5SupabaseData)
    ? window.eli5SupabaseData[lesson.id] || ''
    : '';

  const contentHtml = window.eli5Toggle
    ? window.eli5Toggle.wrapContent(lesson.content, eli5Html)
    : lesson.content;

  elements.lessonContent.innerHTML = `
    <div class="max-w-3xl mx-auto">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">${lesson.title}</h2>
      <p class="text-sm text-gray-500 mb-6">Module: ${module.title}</p>
      ${objectivesHtml}
      <div class="lesson-prose">
        ${contentHtml}
      </div>
      ${takeawaysHtml}
      <div class="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center">
        <span class="text-sm text-gray-500">
          <i class="fa-solid fa-lightbulb mr-1"></i> ${lesson.id}
        </span>
      </div>
    </div>
  `;

  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('supabase', elements.lessonContent);
  }

  elements.supabaseEditor.value = lesson.defaultCode || '';
  copyCode.init(elements.lessonContent);

  elements.editorConsole.innerHTML = '';
  elements.editorConsole.classList.add('hidden');

  renderQuiz(mIndex);
  renderSidebar();

  if (window.innerWidth < 768 && !elements.sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
}

// Quiz Rendering
function renderQuiz(mIndex) {
  const quiz = curriculum[mIndex].quiz;
  let html = `<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>`;

  if (!quiz || quiz.length === 0) {
    elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
    return;
  }

  quiz.forEach((q, i) => {
    html += `
      <div class="mb-8 p-6 bg-emerald-50 rounded-lg border border-emerald-100 quiz-question" id="q-container-${q.id}">
        <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
        <div class="space-y-2">
        `;

    q.options.forEach((opt, oIndex) => {
      html += `
        <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
          <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-emerald-600">
          <span class="text-gray-700">${opt}</span>
        </label>
      `;
    });

    html += `
        </div>
        <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
          Submit Answer
        </button>
        <div id="q-feedback-${q.id}" class="mt-3 hidden text-sm font-medium"></div>
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
    feedback.className = 'mt-3 text-sm font-medium text-emerald-600 block';
    container.classList.replace('bg-emerald-50', 'bg-green-50');
    container.classList.replace('border-emerald-100', 'border-green-200');

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
  localStorage.setItem('supabaseHubProgress', JSON.stringify(userProgress));
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
// Supabase Studio Simulator Engine
// ----------------------------------------------------

async function runSimulation() {
  const code = elements.supabaseEditor.value;
  elements.editorConsole.innerHTML = '';
  elements.editorConsole.classList.add('hidden');
  lastInsertedRowId = null;

  const logToConsole = (msg, type = 'log') => {
    elements.editorConsole.classList.remove('hidden');
    const colorClass = type === 'error' ? 'text-red-400' : 'text-emerald-400';
    elements.editorConsole.innerHTML += `<div class="${colorClass} mb-1">> ${msg}</div>`;
    elements.editorConsole.scrollTop = elements.editorConsole.scrollHeight;
  };

  const mockConsole = {
    log: (...args) => logToConsole(args.join(' ')),
    error: (...args) => logToConsole(args.join(' '), 'error'),
  };

  // The Mock Supabase Client
  const supabase = {
    auth: {
      signUp: async ({ email, password }) => {
        if (email && password) {
          const newUser = {
            id: `uuid-${Math.floor(Math.random() * 1000)}`,
            email,
            created_at: new Date().toISOString(),
          };
          mockDatabase.users.push(newUser);
          mockAuthState.user = newUser;

          elements.tableSelector.value = 'users';
          currentTable = 'users';
          lastInsertedRowId = newUser.id;

          renderStudioUI();
          return { data: { user: newUser, session: { expires_at: Date.now() + 3600000 } }, error: null };
        }
        return { data: null, error: { message: 'Invalid email or password' } };
      },
      signInWithOtp: async ({ email, options }) => {
        if (email) {
          logToConsole(`Magic link sent to ${email} (redirect: ${options?.redirectTo || 'default'})`);
          return { data: {}, error: null };
        }
        return { data: null, error: { message: 'Email is required' } };
      },
      resetPasswordForEmail: async (email, options) => {
        if (email) {
          logToConsole(`Password reset email sent to ${email}`);
          return { data: {}, error: null };
        }
        return { data: null, error: { message: 'Email is required' } };
      },
      updateUser: async (attrs) => {
        if (mockAuthState.user) {
          Object.assign(mockAuthState.user, attrs);
          logToConsole(`User updated: ${JSON.stringify(attrs)}`);
          return { data: { user: mockAuthState.user }, error: null };
        }
        return { data: null, error: { message: 'No authenticated user' } };
      },
      getSession: async () => {
        return { data: { session: mockAuthState.user ? { user: mockAuthState.user, expires_at: Date.now() + 3600000 } : null }, error: null };
      },
      onAuthStateChange: (_callback) => {
        logToConsole('Auth state change listener registered');
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithOAuth: async ({ provider, options }) => {
        logToConsole(`OAuth sign-in initiated: ${provider} (redirect: ${options?.redirectTo || 'default'})`);
        const oAuthUser = {
          id: `oauth-${Math.floor(Math.random() * 1000)}`,
          email: `user@${provider}.com`,
          created_at: new Date().toISOString(),
          app_metadata: { provider },
        };
        mockDatabase.users.push(oAuthUser);
        mockAuthState.user = oAuthUser;
        elements.tableSelector.value = 'users';
        currentTable = 'users';
        renderStudioUI();
        return { data: { url: `https://${provider}.com/oauth/authorize?redirect=${options?.redirectTo || ''}`, provider }, error: null };
      },
      linkIdentity: async ({ provider }) => {
        logToConsole(`Identity linked: ${provider}`);
        return { data: {}, error: null };
      },
      signInWithIdToken: async ({ provider, token }) => {
        logToConsole(`ID token sign-in: ${provider}`);
        return { data: { user: { id: 'uuid-idtoken', email: `${provider}_user@example.com` } }, error: null };
      },
    },
    from: (tableName) => {
      return {
        select: async (columns) => {
          return { data: mockDatabase[tableName] || [], error: null };
        },
        insert: async (dataArr) => {
          if (!mockDatabase[tableName]) mockDatabase[tableName] = [];
          const items = Array.isArray(dataArr) ? dataArr : [dataArr];
          let newId = mockDatabase[tableName].length > 0
            ? Math.max(...mockDatabase[tableName].map((r) => (typeof r.id === 'number' ? r.id : 0))) + 1
            : 1;
          const newRows = items.map((item) => {
            const row = { id: newId++, ...item, inserted_at: new Date().toISOString() };
            mockDatabase[tableName].push(row);
            lastInsertedRowId = row.id;
            return row;
          });
          elements.tableSelector.value = tableName;
          currentTable = tableName;
          renderStudioUI();
          return { data: newRows, error: null };
        },
        update: (dataObj) => {
          return {
            eq: async (column, value) => {
              if (mockDatabase[tableName]) {
                mockDatabase[tableName].forEach((row) => {
                  if (row[column] === value) {
                    Object.assign(row, dataObj);
                    lastInsertedRowId = row.id;
                  }
                });
                elements.tableSelector.value = tableName;
                currentTable = tableName;
                renderStudioUI();
                return { data: mockDatabase[tableName].filter((r) => r[column] === value), error: null };
              }
              return { data: null, error: { message: 'Table not found' } };
            },
            match: async (criteria) => {
              if (mockDatabase[tableName]) {
                mockDatabase[tableName].forEach((row) => {
                  const matches = Object.keys(criteria).every((k) => row[k] === criteria[k]);
                  if (matches) {
                    Object.assign(row, dataObj);
                    lastInsertedRowId = row.id;
                  }
                });
                renderStudioUI();
                return { data: mockDatabase[tableName], error: null };
              }
              return { data: null, error: { message: 'Table not found' } };
            },
          };
        },
        delete: () => {
          return {
            eq: async (column, value) => {
              if (mockDatabase[tableName]) {
                const before = mockDatabase[tableName].length;
                mockDatabase[tableName] = mockDatabase[tableName].filter((r) => r[column] !== value);
                renderStudioUI();
                return { data: [{ deleted_count: before - mockDatabase[tableName].length }], error: null };
              }
              return { data: null, error: { message: 'Table not found' } };
            },
          };
        },
        order: (column, { ascending } = {}) => {
          if (mockDatabase[tableName]) {
            mockDatabase[tableName].sort((a, b) => {
              if (ascending) return a[column] > b[column] ? 1 : -1;
              return a[column] < b[column] ? 1 : -1;
            });
          }
          return {
            range: async (from, to) => {
              const data = (mockDatabase[tableName] || []).slice(from, to + 1);
              return { data, error: null };
            },
          };
        },
        range: async (from, to) => {
          const data = (mockDatabase[tableName] || []).slice(from, to + 1);
          return { data, error: null };
        },
      };
    },
    channel: (name) => {
      const listeners = [];
      let subscribed = false;
      const ch = {
        on(type, config, callback) {
          listeners.push({ type, config, callback });
          return ch;
        },
        async subscribe(callback) {
          subscribed = true;
          logToConsole(`Channel '${name}' subscribed`);
          if (callback) callback('SUBSCRIBED');
          return ch;
        },
        unsubscribe() {
          subscribed = false;
          logToConsole(`Channel '${name}' unsubscribed`);
        },
        async send(message) {
          logToConsole(`Broadcast sent: ${message.event}`);
          return 'ok';
        },
        async track(state) {
          logToConsole(`Presence tracked: ${JSON.stringify(state)}`);
          return 'ok';
        },
        presenceState() {
          return { 'user-1': [{ user: 'anonymous', online_at: new Date().toISOString() }] };
        },
      };
      return ch;
    },
    storage: {
      from: (bucket) => {
        return {
          upload: async (path, file, options) => {
            if (!mockStorage[bucket]) mockStorage[bucket] = [];
            const entry = {
              name: path,
              size: file?.size || 1024,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            const existing = mockStorage[bucket].findIndex(f => f.name === path);
            if (existing >= 0 && options?.upsert) {
              mockStorage[bucket][existing] = entry;
            } else if (existing < 0) {
              mockStorage[bucket].push(entry);
            }
            logToConsole(`Uploaded: ${bucket}/${path}`);
            return { data: { path }, error: null };
          },
          list: async (prefix, options) => {
            const files = mockStorage[bucket] || [];
            let result = prefix ? files.filter(f => f.name.startsWith(prefix)) : files;
            if (options?.sortBy) {
              const col = options.sortBy.column;
              const dir = options.sortBy.order === 'desc' ? -1 : 1;
              result = [...result].sort((a, b) => (a[col] > b[col] ? 1 : -1) * dir);
            }
            return { data: result, error: null };
          },
          download: async (path) => {
            const file = (mockStorage[bucket] || []).find(f => f.name === path);
            if (!file) return { data: null, error: { message: 'File not found' } };
            return { data: new Blob(['mock file content'], { type: 'application/octet-stream' }), error: null };
          },
          getPublicUrl: (path) => {
            return { data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/${bucket}/${path}` } };
          },
          createSignedUrl: async (path, expiresIn) => {
            return { data: { signedUrl: `https://mock.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=mock&expires=${expiresIn}` }, error: null };
          },
          remove: async (paths) => {
            if (mockStorage[bucket]) {
              paths.forEach(p => {
                mockStorage[bucket] = mockStorage[bucket].filter(f => f.name !== p);
              });
            }
            logToConsole(`Removed ${paths.length} file(s) from ${bucket}`);
            return { data: [{ bucket_id: bucket }], error: null };
          },
        };
      },
    },
    functions: {
      invoke: async (functionName, { body, headers } = {}) => {
        logToConsole(`Edge function '${functionName}' invoked with body: ${JSON.stringify(body || {})}`);
        const mockResults = {
          'hello-world': { message: 'Hello from the edge!', timestamp: new Date().toISOString() },
        };
        const result = mockResults[functionName] || { message: `Function '${functionName}' executed successfully`, input: body };
        return { data: result, error: null };
      },
    },
  };

  try {
    let executableCode = code.replace(/import .*;?\n/g, '');

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const executionScope = new AsyncFunction('supabase', 'console', executableCode);

    await executionScope(supabase, mockConsole);
  } catch (err) {
    logToConsole(`Execution Error: ${err.message}`, 'error');
  }
}

// Visual feedback helper for rows
function flashRow(rowIdStr) {
  const rowEl = document.getElementById(`row-${rowIdStr}`);
  if (rowEl) {
    rowEl.classList.remove('flash-row');
    void rowEl.offsetWidth;
    rowEl.classList.add('flash-row');
  }
}

// ----------------------------------------------------
// UI Rendering for Supabase Studio Simulator
// ----------------------------------------------------

function renderStudioUI() {
  renderAuthStatus();
  renderStudioGrid();
}

function renderAuthStatus() {
  const dot = elements.authStatus.querySelector('.status-dot');
  const text = elements.authStatus.querySelector('.status-text');

  if (mockAuthState.user) {
    dot.classList.replace('bg-gray-500', 'bg-emerald-500');
    text.textContent = mockAuthState.user.email;
  } else {
    dot.classList.replace('bg-emerald-500', 'bg-gray-500');
    text.textContent = 'Anonymous';
  }
}

function renderStudioGrid() {
  const data = mockDatabase[currentTable] || [];

  let headers = [];
  if (data.length > 0) {
    headers = Object.keys(data[0]);
  } else if (currentTable === 'todos') {
    headers = ['id', 'task', 'is_complete', 'user_id', 'inserted_at'];
  } else if (currentTable === 'users') {
    headers = ['id', 'email', 'created_at'];
  } else if (currentTable === 'profiles') {
    headers = ['id', 'username', 'avatar_url', 'team_id'];
  } else if (currentTable === 'teams') {
    headers = ['id', 'name', 'created_at'];
  }

  let headerHtml = '';
  headers.forEach((h) => {
    let icon = 'fa-font';
    if (h === 'id') icon = 'fa-key';
    else if (h.includes('is_')) icon = 'fa-check-square';
    else if (h.includes('at')) icon = 'fa-clock';
    else if (h === 'user_id') icon = 'fa-user';

    headerHtml += `
      <div class="grid-header-cell" style="width: 150px; min-width: 150px;">
        <i class="fas ${icon} type-icon"></i>
        <span>${h}</span>
      </div>
    `;
  });
  headerHtml += `<div class="flex-1 min-w-[50px] border-b border-gray-700"></div>`;
  elements.gridHeader.innerHTML = headerHtml;

  let bodyHtml = '';
  data.forEach((row) => {
    bodyHtml += `<div class="grid-row" id="row-${row.id}">`;
    headers.forEach((h) => {
      let val = row[h];
      let cellClass = 'cell-string';
      let displayVal = val;

      if (val === null || val === undefined) {
        cellClass = 'cell-null';
        displayVal = 'NULL';
      } else if (typeof val === 'number') {
        cellClass = 'cell-number';
      } else if (typeof val === 'boolean') {
        cellClass = 'cell-boolean';
        displayVal = val ? 'TRUE' : 'FALSE';
      }

      bodyHtml += `
        <div class="grid-cell ${cellClass}" style="width: 150px; min-width: 150px;" title="${displayVal}">
          ${displayVal}
        </div>
      `;
    });
    bodyHtml += `<div class="flex-1 min-w-[50px] border-b border-[#333333]"></div>`;
    bodyHtml += `</div>`;
  });

  if (data.length === 0) {
    bodyHtml = `<div class="p-4 text-gray-500 italic text-sm text-center w-full">No rows found in '${currentTable}'</div>`;
  }

  elements.gridBody.innerHTML = bodyHtml;

  if (lastInsertedRowId !== null) {
    setTimeout(() => flashRow(lastInsertedRowId), 50);
  }
}

// Run init on load
document.addEventListener('DOMContentLoaded', init);
