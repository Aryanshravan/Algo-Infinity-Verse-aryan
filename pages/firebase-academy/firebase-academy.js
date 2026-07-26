/* global checkAnswer, mockLogout, selectCollection, selectDocument */

// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('firebaseHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// Mock Firebase Backend State
const mockFirestore = {
  users: {
    user123: { name: 'Alice', email: 'alice@example.com', role: 'admin' },
    user456: { name: 'Bob', email: 'bob@example.com', role: 'user' },
  },
  posts: {
    post1: { title: 'Hello Firebase', authorId: 'user123', published: true },
  },
};

let mockAuthState = {
  currentUser: null, // null if not logged in, object if logged in
};

let selectedCollection = null;
let selectedDocument = null;

// Curriculum Data
const curriculum = [
  // ─── Module 1: Firebase Authentication ───
  {
    id: 'mod-1',
    title: 'Firebase Authentication',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Email/Password Sign In',
        objectives: [
          'Understand how Firebase Auth v9 modular SDK works',
          'Implement signInWithEmailAndPassword in your app',
          'Handle sign-in success and error responses',
        ],
        takeaway: 'Firebase v9 uses modular imports. signInWithEmailAndPassword is the primary way to authenticate users with email and password credentials.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Understand how Firebase Auth v9 modular SDK works</li>
                                <li>Implement signInWithEmailAndPassword in your app</li>
                                <li>Handle sign-in success and error responses</li>
                            </ul>
                        </div>

                        <h2>Firebase Authentication</h2>
                        <p>Firebase makes it incredibly easy to authenticate users. In modern Firebase <strong>v9 (modular)</strong>, you import specific functions instead of a global object. This is called <strong>tree-shaking</strong> — your app only bundles the Firebase features you actually use!</p>
                        
                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-lightbulb mr-2"></i><strong>Key Concept:</strong> The v9 modular SDK uses named imports. This reduces your app's bundle size because unused code is dropped during build.</p>
                        </div>

                        <h3>Signing In with Email & Password</h3>
                        <pre><code>import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();
signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    const user = userCredential.user;
    console.log("Welcome!", user.email);
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Auth error:", errorCode, errorMessage);
  });</code></pre>
                        
                        <h3>Common Error Codes</h3>
                        <ul>
                            <li><code>auth/user-not-found</code> — No account with this email</li>
                            <li><code>auth/wrong-password</code> — Password doesn't match</li>
                            <li><code>auth/too-many-requests</code> — Too many attempts, account temporarily locked</li>
                            <li><code>auth/weak-password</code> — Password must be at least 6 characters</li>
                        </ul>

                        <p>Go to the <strong>Simulator</strong> tab, run the code to sign in a mock user, and watch the App UI update!</p>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Firebase v9 uses modular imports. <code>signInWithEmailAndPassword</code> is the primary way to authenticate users with email and password credentials. Always handle both success and error cases in your auth flows.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Mocking signInWithEmailAndPassword
const email = "test@example.com";
const password = "password123";

signInWithEmailAndPassword(email, password)
  .then((user) => {
    console.log("Logged in as:", user.email);
    console.log("Auth UID:", user.uid);
  })
  .catch((error) => {
    console.error("Auth error:", error.code || error.message);
  });`,
      },
      {
        id: 'm1-l2',
        title: 'Multi-Provider Auth (Google & GitHub)',
        objectives: [
          'Understand how OAuth providers work with Firebase',
          'Implement Google sign-in with signInWithPopup',
          'Handle provider-specific errors gracefully',
        ],
        takeaway: 'Firebase Auth supports multiple identity providers. Use provider-specific objects like GoogleAuthProvider with signInWithPopup for a seamless OAuth flow.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Understand how OAuth providers work with Firebase</li>
                                <li>Implement Google sign-in with signInWithPopup</li>
                                <li>Handle provider-specific errors gracefully</li>
                            </ul>
                        </div>

                        <h2>Multi-Provider Authentication</h2>
                        <p>Firebase allows users to sign in using accounts they already have with providers like <strong>Google</strong>, <strong>GitHub</strong>, <strong>Facebook</strong>, and <strong>Twitter</strong>. This removes friction — users don't need to create yet another account!</p>
                        
                        <h3>Google Sign-In</h3>
                        <pre><code>import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const auth = getAuth();
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

signInWithPopup(auth, provider)
  .then((result) => {
    const user = result.user;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    console.log("Google user:", user.displayName);
  })
  .catch((error) => {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("User closed the popup");
    }
  });</code></pre>

                        <h3>GitHub Sign-In</h3>
                        <pre><code>import { GithubAuthProvider, signInWithRedirect } from "firebase/auth";

const provider = new GithubAuthProvider();
provider.addScope('repo'); // optional: request additional permissions
signInWithRedirect(auth, provider);</code></pre>

                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg my-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-info-circle mr-2"></i><strong>Popup vs Redirect:</strong> Use <code>signInWithPopup</code> for desktop and <code>signInWithRedirect</code> for mobile or when you need to avoid popup blockers. <code>getRedirectResult</code> retrieves the result after a redirect.</p>
                        </div>

                        <p>Each provider must be <strong>enabled</strong> in the Firebase Console under Authentication > Sign-in method.</p>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Firebase Auth supports multiple identity providers. Use provider-specific objects like <code>GoogleAuthProvider</code> with <code>signInWithPopup</code> for a seamless OAuth flow. Always enable providers in the Firebase Console first.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate multi-provider auth concept
console.log("=== Multi-Provider Auth Demo ===");
console.log("Providers available: Google, GitHub, Facebook");

// Use signInWithEmailAndPassword (available in simulator)
signInWithEmailAndPassword("user@example.com", "password123")
  .then((user) => {
    console.log("
Signed in as:", user.email);
    console.log("User ID:", user.uid);
    console.log("
Tip: In production, use GoogleAuthProvider");
    console.log("with signInWithPopup for OAuth login!");
  })
  .catch((error) => {
    console.error("Auth error:", error.message);
  });`,
      },
      {
        id: 'm1-l3',
        title: 'Auth State & User Profile',
        objectives: [
          'Learn to listen for auth state changes with onAuthStateChanged',
          'Display user profile info from the user object',
          'Implement sign-out with signOut',
        ],
        takeaway: 'Use onAuthStateChanged to react to login/logout events in real-time. The user object provides profile info like displayName, email, and photoURL.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Learn to listen for auth state changes with onAuthStateChanged</li>
                                <li>Display user profile info from the user object</li>
                                <li>Implement sign-out with signOut</li>
                            </ul>
                        </div>

                        <h2>Auth State Management</h2>
                        <p>Firebase provides <code>onAuthStateChanged</code> — a <strong>real-time listener</strong> that fires whenever the user's authentication state changes (signed in, signed out, token refreshed).</p>
                        
                        <h3>Listening for Auth Changes</h3>
                        <pre><code>import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User profile:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    });
  } else {
    // User is signed out
    console.log("User is signed out");
  }
});</code></pre>

                        <h3>Signing Out</h3>
                        <p>One clean call to log the user out:</p>
                        <pre><code>import { signOut } from "firebase/auth";

signOut(auth).then(() => {
  console.log("Signed out successfully");
}).catch((error) => {
  console.error("Sign out error:", error);
});</code></pre>

                        <div class="bg-purple-50 border border-purple-200 p-4 rounded-lg my-6">
                            <p class="text-purple-800 text-sm"><i class="fas fa-rocket mr-2"></i><strong>Best Practice:</strong> Set up <code>onAuthStateChanged</code> once when your app starts. Use it to protect routes — redirect unauthenticated users to the login page automatically.</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Use <code>onAuthStateChanged</code> to react to login/logout events in real time. The <code>user</code> object provides profile info like <code>displayName</code>, <code>email</code>, and <code>photoURL</code>. Call <code>signOut(auth)</code> to log users out.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Auth state listener demo
console.log("Current auth state:");

if (mockAuthState.currentUser) {
  const u = mockAuthState.currentUser;
  console.log("Logged in as:", u.email);
  console.log("Display name:", u.displayName);
} else {
  console.log("Not logged in");
}

// Sign out after 3 seconds, simulating inactivity timeout
setTimeout(() => {
  mockLogout();
  console.log("Session expired — signed out");
}, 3000);`,
      },
    ],
    quiz: [
      {
        id: 'q1-1',
        question: 'In Firebase v9, how do you sign in a user with email and password?',
        options: [
          'firebase.auth().signIn()',
          'signInWithEmailAndPassword(auth, email, pwd)',
          'auth.login(email, pwd)',
          'Firebase.login()',
        ],
        correct: 1,
      },
      {
        id: 'q1-2',
        question: 'Which method should you use to detect when a user signs in or out?',
        options: [
          'setInterval to poll auth state',
          'onAuthStateChanged listener',
          'auth.signIn() callback',
          'window.addEventListener("auth")',
        ],
        correct: 1,
      },
      {
        id: 'q1-3',
        question: 'What does the GoogleAuthProvider do?',
        options: [
          'Creates a Google account for the user',
          'Provides OAuth credentials for Google sign-in',
          'Syncs data with Google Drive',
          'Replaces Firebase Auth with Google Auth',
        ],
        correct: 1,
      },
      {
        id: 'q1-4',
        question: 'What does the auth/user-not-found error code mean?',
        options: [
          'The database was not found',
          'No user account exists with the given email',
          'The user deleted their account',
          'The Firebase project was not found',
        ],
        correct: 1,
      },
      {
        id: 'q1-5',
        question: 'How do you sign a user out of Firebase Auth?',
        options: [
          'auth.logout()',
          'signOut(auth)',
          'auth.signOut()',
          'Firebase.signOut()',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 2: Firestore CRUD ───
  {
    id: 'mod-2',
    title: 'Firestore CRUD',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Writing Data (setDoc & addDoc)',
        objectives: [
          'Understand the difference between setDoc and addDoc',
          'Write documents with specific IDs using setDoc',
          'Add documents with auto-generated IDs using addDoc',
        ],
        takeaway: 'Use setDoc when you know the document ID. Use addDoc when you want Firestore to auto-generate a unique ID for you.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Understand the difference between setDoc and addDoc</li>
                                <li>Write documents with specific IDs using setDoc</li>
                                <li>Add documents with auto-generated IDs using addDoc</li>
                            </ul>
                        </div>

                        <h2>Cloud Firestore — Writing Data</h2>
                        <p>Firestore is a flexible, scalable NoSQL cloud database. Data is stored in <strong>Documents</strong> (like JSON objects), which are organized into <strong>Collections</strong> (like folders).</p>
                        
                        <h3>setDoc() — Write with a Known ID</h3>
                        <p>Use <code>setDoc</code> when you want to control the document ID (e.g., using a user's UID as the document ID):</p>
                        <pre><code>import { doc, setDoc } from "firebase/firestore";

const userRef = doc(db, "users", "user-123");
await setDoc(userRef, {
  name: "Charlie",
  email: "charlie@example.com",
  role: "guest",
  createdAt: serverTimestamp()
});</code></pre>

                        <h3>addDoc() — Auto-Generated ID</h3>
                        <p>Use <code>addDoc</code> when you don't care about the ID (e.g., blog posts, comments):</p>
                        <pre><code>import { collection, addDoc } from "firebase/firestore";

const docRef = await addDoc(collection(db, "posts"), {
  title: "My First Post",
  content: "Firebase is amazing!",
  authorId: "user-123",
  published: false,
  createdAt: serverTimestamp()
});
console.log("New post ID:", docRef.id);</code></pre>

                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-lightbulb mr-2"></i><strong>Pro Tip:</strong> Use <code>setDoc(data, { merge: true })</code> to merge fields into an existing document without overwriting other fields. This is great for updating individual fields!</p>
                        </div>

                        <p>Try running the provided code in the simulator to add documents to Firestore!</p>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Use <code>setDoc</code> when you know the document ID (e.g., user profiles). Use <code>addDoc</code> when you want Firestore to auto-generate a unique ID (e.g., blog posts, comments).</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Write data to Firestore
const userData = {
  name: "Charlie",
  email: "charlie@example.com",
  role: "guest",
  createdAt: new Date().toISOString()
};

// setDoc(collection, docId, data)
setDoc("users", "user789", userData);
console.log("Document written with specific ID!");

// addDoc auto-generates an ID
addDoc("logs", { action: "user_created", timestamp: Date.now() });
console.log("Log entry added with auto-ID!");`,
      },
      {
        id: 'm2-l2',
        title: 'Reading Data (getDoc & getDocs)',
        objectives: [
          'Read a single document with getDoc and extract data via .data()',
          'Read all documents in a collection with getDocs',
          'Understand the DocumentSnapshot and QuerySnapshot objects',
        ],
        takeaway: 'Use getDoc for a single document and getDocs for all documents in a collection. Data comes wrapped in snapshots — call .data() to extract it.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Read a single document with getDoc and extract data via .data()</li>
                                <li>Read all documents in a collection with getDocs</li>
                                <li>Understand the DocumentSnapshot and QuerySnapshot objects</li>
                            </ul>
                        </div>

                        <h2>Reading Data from Firestore</h2>
                        <p>Firestore returns data wrapped in <strong>snapshots</strong>. Think of a snapshot as a photograph of your data at a specific moment in time.</p>
                        
                        <h3>Get a Single Document</h3>
                        <p>Use <code>getDoc</code> with a document reference to read one document:</p>
                        <pre><code>import { doc, getDoc } from "firebase/firestore";

const docRef = doc(db, "users", "user123");
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
  console.log("User data:", docSnap.data());
  console.log("Document ID:", docSnap.id);
} else {
  console.log("No such document!");
}</code></pre>

                        <h3>Get All Documents in a Collection</h3>
                        <p>Use <code>getDocs</code> to read all documents from a collection:</p>
                        <pre><code>import { collection, getDocs } from "firebase/firestore";

const querySnapshot = await getDocs(collection(db, "users"));
querySnapshot.forEach((doc) => {
  console.log(doc.id, " => ", doc.data());
});

// Or use .docs to get an array
const allUsers = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));</code></pre>

                        <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg my-6">
                            <p class="text-orange-800 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i><strong>Important:</strong> Always check <code>docSnap.exists()</code> before calling <code>.data()</code>. If the document doesn't exist, <code>.data()</code> would return <code>undefined</code> and cause errors!</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Use <code>getDoc</code> for a single document and <code>getDocs</code> for all documents in a collection. Data comes wrapped in snapshots — call <code>.data()</code> to extract the fields. Always check <code>.exists()</code> first!</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Read existing mock data
const userId = "user123";
const userData = mockFirestore.users[userId];

if (userData) {
  console.log("Found user:", userData.name);
  console.log("Email:", userData.email);
  console.log("Role:", userData.role);
} else {
  console.log("User not found");
}

// List all users
console.log("\nAll users:");
Object.entries(mockFirestore.users).forEach(([id, data]) => {
  console.log(id, ":", data.name);
});`,
      },
      {
        id: 'm2-l3',
        title: 'Updating & Deleting Data',
        objectives: [
          'Update specific fields with updateDoc without overwriting',
          'Use setDoc with merge option for upsert behavior',
          'Delete documents safely with deleteDoc',
        ],
        takeaway: 'Use updateDoc to change specific fields. Use deleteDoc to remove entire documents. setDoc with { merge: true } combines both create and update.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Update specific fields with updateDoc without overwriting</li>
                                <li>Use setDoc with merge option for upsert behavior</li>
                                <li>Delete documents safely with deleteDoc</li>
                            </ul>
                        </div>

                        <h2>Updating & Deleting Documents</h2>
                        
                        <h3>updateDoc — Partial Updates</h3>
                        <p>Update only specific fields without affecting others:</p>
                        <pre><code>import { doc, updateDoc } from "firebase/firestore";

const userRef = doc(db, "users", "user123");
await updateDoc(userRef, {
  role: "admin",
  lastLogin: serverTimestamp()
});
// Name, email, and other fields remain unchanged!</code></pre>

                        <h3>setDoc with Merge — Upsert</h3>
                        <p>"Upsert" = Update + Insert. Creates the doc if it doesn't exist, or merges fields if it does:</p>
                        <pre><code>import { doc, setDoc } from "firebase/firestore";

await setDoc(doc(db, "users", "user123"), {
  nickname: "Charlie",
  updatedAt: serverTimestamp()
}, { merge: true });</code></pre>

                        <h3>deleteDoc — Remove Entirely</h3>
                        <p>Delete a document and all its subcollections:</p>
                        <pre><code>import { doc, deleteDoc } from "firebase/firestore";

await deleteDoc(doc(db, "users", "user123"));
console.log("Document deleted!");</code></pre>

                        <div class="bg-red-50 border border-red-200 p-4 rounded-lg my-6">
                            <p class="text-red-800 text-sm"><i class="fas fa-skull-crossbones mr-2"></i><strong>Warning:</strong> Deletes are permanent! There's no recycle bin in Firestore. Always confirm before deleting user data.</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Use <code>updateDoc</code> to change specific fields. Use <code>deleteDoc</code> to remove entire documents. <code>setDoc</code> with <code>{ merge: true }</code> combines both create and update behavior.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Update user role
const updatedUser = mockFirestore.users.user123;
updatedUser.role = "premium";
updatedUser.updatedAt = new Date().toISOString();
console.log("Updated user:", updatedUser.name, "role:", updatedUser.role);

// Delete a post
if (mockFirestore.posts) {
  delete mockFirestore.posts.post1;
  console.log("Deleted post: post1");
}

console.log("Remaining collections:", Object.keys(mockFirestore).join(", "));`,
      },
    ],
    quiz: [
      {
        id: 'q2-1',
        question: 'What is the difference between setDoc and addDoc in Firestore?',
        options: [
          'They are exactly the same',
          'setDoc requires you to specify the Document ID, addDoc auto-generates it',
          'addDoc is only for Arrays',
          'setDoc merges data, addDoc replaces it',
        ],
        correct: 1,
      },
      {
        id: 'q2-2',
        question: 'What does .data() return from a DocumentSnapshot?',
        options: [
          'Just the document ID',
          'The document fields as a JavaScript object',
          'A JSON string',
          'A reference to the collection',
        ],
        correct: 1,
      },
      {
        id: 'q2-3',
        question: 'How do you update only specific fields in a Firestore document?',
        options: [
          'setDoc with the full object',
          'updateDoc with only the fields to change',
          'addDoc with merge option',
          'You cannot update specific fields',
        ],
        correct: 1,
      },
      {
        id: 'q2-4',
        question: 'What does { merge: true } do when used with setDoc?',
        options: [
          'Deletes the old document',
          'Merges new fields into existing document without overwriting',
          'Adds a timestamp automatically',
          'Creates a backup of the document',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 3: Firestore Queries & Indexes ───
  {
    id: 'mod-3',
    title: 'Firestore Queries & Indexes',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Simple Queries (where, orderBy, limit)',
        objectives: [
          'Filter documents with where() clauses',
          'Sort results with orderBy()',
          'Limit results and paginate with cursor-based pagination',
        ],
        takeaway: 'Combine where, orderBy, and limit to build powerful queries. Firestore requires composite indexes when querying multiple fields.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Filter documents with where() clauses</li>
                                <li>Sort results with orderBy()</li>
                                <li>Limit results and paginate with cursor-based pagination</li>
                            </ul>
                        </div>

                        <h2>Firestore Queries</h2>
                        <p>Firestore queries let you find exactly the documents you need using <strong>filtering</strong>, <strong>sorting</strong>, and <strong>limiting</strong>.</p>
                        
                        <h3>Filtering with where()</h3>
                        <pre><code>import { collection, query, where, getDocs } from "firebase/firestore";

// Find all published posts
const q = query(
  collection(db, "posts"),
  where("published", "==", true),
  where("authorId", "==", "user123")
);

const snapshot = await getDocs(q);</code></pre>

                        <h3>Available Query Operators</h3>
                        <ul>
                            <li><code>==</code> — Equal to</li>
                            <li><code>!=</code> — Not equal</li>
                            <li><code>&gt;</code>, <code>&gt;=</code> — Greater than (or equal)</li>
                            <li><code>&lt;</code>, <code>&lt;=</code> — Less than (or equal)</li>
                            <li><code>array-contains</code> — Array contains a value</li>
                            <li><code>in</code> — Matches any value in an array</li>
                            <li><code>array-contains-any</code> — Array contains any of the values</li>
                        </ul>

                        <h3>Sorting with orderBy()</h3>
                        <pre><code>// Most recent posts first
const q = query(
  collection(db, "posts"),
  where("published", "==", true),
  orderBy("createdAt", "desc"),
  limit(10)
);</code></pre>

                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-lightbulb mr-2"></i><strong>Important Rule:</strong> If you use <code>where()</code> with an inequality and <code>orderBy()</code>, the first <code>orderBy</code> must be on the same field as the inequality!</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Combine <code>where</code>, <code>orderBy</code>, and <code>limit</code> to build powerful queries. Firestore requires <strong>composite indexes</strong> when querying multiple fields — the error message will include a link to create one automatically.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate querying users by role
const allUsers = mockFirestore.users;
console.log("All users:");
Object.values(allUsers).forEach(u => {
  console.log(" -", u.name, "(", u.email, ") - role:", u.role);
});

console.log("\nFiltered (admin only):");
Object.values(allUsers)
  .filter(u => u.role === 'admin')
  .forEach(u => console.log(" -", u.name));`,
      },
      {
        id: 'm3-l2',
        title: 'Composite Queries & Indexes',
        objectives: [
          'Understand what composite indexes are and why they matter',
          'Learn how to create indexes via Firebase Console or CLI',
          'Identify when a query needs a composite index from error messages',
        ],
        takeaway: 'Composite indexes power queries on multiple fields. Firestore auto-creates single-field indexes but needs manual composite indexes for multi-field queries.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Understand what composite indexes are and why they matter</li>
                                <li>Learn how to create indexes via Firebase Console or CLI</li>
                                <li>Identify when a query needs a composite index from error messages</li>
                            </ul>
                        </div>

                        <h2>Composite Indexes</h2>
                        <p>Think of a <strong>composite index</strong> as a sorted lookup table for your queries. Without it, Firestore would have to scan all documents — which is slow and expensive!</p>
                        
                        <h3>When Do You Need a Composite Index?</h3>
                        <p>Single-field queries work automatically (Firestore creates indexes for each field). But when you query on <strong>multiple fields</strong>, you need a composite index:</p>
                        <pre><code>const q = query(
  collection(db, "posts"),
  where("published", "==", true),     // field 1
  where("category", "==", "tech"),   // field 2
  orderBy("createdAt", "desc")        // field 3
);
// THIS needs a composite index on (published, category, createdAt)</code></pre>

                        <h3>Creating Indexes</h3>
                        <p>Two ways to create composite indexes:</p>
                        <ol>
                            <li><strong>Firebase Console:</strong> Follow the link in the error message — it auto-fills the index definition for you!</li>
                            <li><strong>firebase.json:</strong> Define indexes in <code>firestore.indexes.json</code> and deploy with <code>firebase deploy --only firestore:indexes</code></li>
                        </ol>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Composite indexes power queries on multiple fields. Firestore auto-creates single-field indexes but needs manual composite indexes for multi-field queries. Click the link in error messages to create them instantly.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Demo: Query requires composite index concept
console.log("Query: Find active admins (role=admin AND status=active)");
console.log("This would need a composite index on (users/role, users/status)");

const allUsers = mockFirestore.users;
const filtered = Object.values(allUsers).filter(u => u.role === 'admin');
console.log("\nSimulated result (admins only):", filtered.length, "found");
filtered.forEach(u => console.log(" -", u.name));`,
      },
      {
        id: 'm3-l3',
        title: 'Real-time Queries (onSnapshot)',
        objectives: [
          'Set up real-time listeners with onSnapshot',
          'Handle document changes (added, modified, removed)',
          'Unsubscribe from listeners to prevent memory leaks',
        ],
        takeaway: 'onSnapshot creates a live connection. Always unsubscribe when leaving the page to prevent memory leaks and unnecessary reads.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Set up real-time listeners with onSnapshot</li>
                                <li>Handle document changes (added, modified, removed)</li>
                                <li>Unsubscribe from listeners to prevent memory leaks</li>
                            </ul>
                        </div>

                        <h2>Real-time Queries</h2>
                        <p><code>onSnapshot</code> is the heart of Firestore's real-time capabilities. It opens a <strong>persistent connection</strong> to the server and fires a callback every time data changes.</p>
                        
                        <h3>Listening to a Document</h3>
                        <pre><code>import { doc, onSnapshot } from "firebase/firestore";

const unsubscribe = onSnapshot(doc(db, "users", "user123"), (doc) => {
  if (doc.exists()) {
    console.log("Current data:", doc.data());
  }
});

// Later: stop listening
unsubscribe();</code></pre>

                        <h3>Listening to a Collection Query</h3>
                        <pre><code>import { collection, query, where, onSnapshot } from "firebase/firestore";

const q = query(collection(db, "posts"), where("published", "==", true));

const unsubscribe = onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      console.log("New post:", change.doc.data());
    }
    if (change.type === "modified") {
      console.log("Updated post:", change.doc.data());
    }
    if (change.type === "removed") {
      console.log("Deleted post ID:", change.doc.id);
    }
  });
});</code></pre>

                        <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg my-6">
                            <p class="text-orange-800 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i><strong>Memory Leak Warning!</strong> Every <code>onSnapshot</code> call creates a listener that stays active until you unsubscribe. If you navigate away without calling <code>unsubscribe()</code>, the listener keeps running — wasting reads and memory!</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm"><code>onSnapshot</code> creates a live connection that delivers updates instantly. Always store the returned <code>unsubscribe</code> function and call it when the component unmounts or the user navigates away.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate a real-time listener concept
console.log("Starting real-time listener for 'users' collection...");
console.log("Initial data:", JSON.stringify(mockFirestore.users, null, 2));

// Simulate a change after 2 seconds
setTimeout(() => {
  console.log("\n[REALTIME UPDATE] User 'user123' changed role to 'premium'");
  mockFirestore.users.user123.role = "premium";
  console.log("Updated data:", JSON.stringify(mockFirestore.users.user123));
}, 2000);`,
      },
    ],
    quiz: [
      {
        id: 'q3-1',
        question: 'What happens if you run a query on multiple fields without a composite index?',
        options: [
          'It works, but runs slowly',
          'The query fails with an error linking to create the index',
          'Firestore automatically creates the index',
          'Only the first field condition is applied',
        ],
        correct: 1,
      },
      {
        id: 'q3-2',
        question: 'How do you stop listening to an onSnapshot listener?',
        options: [
          'Call the unsubscribe() function returned by onSnapshot',
          'Refresh the page',
          'Close the browser',
          'Call stopSnapshot()',
        ],
        correct: 0,
      },
      {
        id: 'q3-3',
        question: 'Which of these is a valid Firestore query constraint?',
        options: [
          'array-contains',
          'contains',
          'has',
          'like',
        ],
        correct: 0,
      },
      {
        id: 'q3-4',
        question: 'What does docChanges() return in an onSnapshot callback?',
        options: [
          'The total number of documents',
          'The list of changed documents with their change types',
          'Only the newly added documents',
          'A boolean indicating whether changes happened',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 4: Firestore Security Rules ───
  {
    id: 'mod-4',
    title: 'Firestore Security Rules',
    lessons: [
      {
        id: 'm4-l1',
        title: 'Basic Security Rules Structure',
        objectives: [
          'Understand the match-allow syntax of Firestore Security Rules',
          'Write rules for read and write operations',
          'Start with deny-all and open up selectively',
        ],
        takeaway: 'Security Rules use match-allow syntax. Always start with deny-all and gradually add permissions for specific paths and operations.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Understand the match-allow syntax of Firestore Security Rules</li>
                                <li>Write rules for read and write operations</li>
                                <li>Start with deny-all and open up selectively</li>
                            </ul>
                        </div>

                        <h2>Firestore Security Rules</h2>
                        <p>Security Rules sit between your app and Firestore, acting as a <strong>gatekeeper</strong>. Every request passes through them before being executed.</p>
                        
                        <h3>Basic Structure</h3>
                        <pre><code>rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Deny all by default
    match /{document=**} {
      allow read, write: if false;
    }

    // Allow logged-in users to read users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Allow anyone to read published posts (even unauthenticated)
    match /posts/{postId} {
      allow read: if resource.data.published == true;
      allow create: if request.auth != null;
    }
  }
}</code></pre>

                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-lightbulb mr-2"></i><strong>Key Variables:</strong><br>
                            <code>request.auth</code> — Info about the authenticated user<br>
                            <code>resource.data</code> — The existing document data<br>
                            <code>request.resource.data</code> — The incoming data being written</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Security Rules use <code>match</code>/<code>allow</code> syntax. Always start with <strong>deny-all</strong> and gradually add permissions for specific paths and operations. Test rules in the Firebase Console simulator before deploying.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Security Rules concept demo
console.log("=== Firestore Security Rules Simulator ===");
console.log("Rule: Only authenticated users can read 'users'");

const isLoggedIn = mockAuthState.currentUser !== null;
console.log("User logged in:", isLoggedIn);

if (isLoggedIn) {
  console.log("✓ Access granted — reading users...");
  console.log(mockFirestore.users);
} else {
  console.log("✗ Access denied — permission denied");
}`,
      },
      {
        id: 'm4-l2',
        title: 'Writing Secure Rules',
        objectives: [
          'Validate incoming data with request.resource.data',
          'Restrict access based on user roles and ownership',
          'Write granular rules for create, update, and delete operations',
        ],
        takeaway: 'Use granular rules (create, update, delete) instead of broad write. Validate data types and structure with request.resource.data checks.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Validate incoming data with request.resource.data</li>
                                <li>Restrict access based on user roles and ownership</li>
                                <li>Write granular rules for create, update, and delete operations</li>
                            </ul>
                        </div>

                        <h2>Writing Secure Rules</h2>
                        
                        <h3>Granular Permissions</h3>
                        <p>Instead of a broad <code>allow write</code>, use specific permissions:</p>
                        <pre><code>match /users/{userId} {
  allow read: if request.auth != null;
  allow create: if request.auth.uid == userId;          // can only create own doc
  allow update: if request.auth.uid == userId           // can update own doc
    && request.resource.data.email == resource.data.email; // but can't change email!
  allow delete: if request.auth.uid == userId;          // can delete own doc
}</code></pre>

                        <h3>Data Validation</h3>
                        <p>Validate the structure and types of incoming data:</p>
                        <pre><code>match /posts/{postId} {
  allow create: if request.auth != null
    && request.resource.data.title is string
    && request.resource.data.title.size() > 0
    && request.resource.data.title.size() <= 200
    && request.resource.data.published is bool;
}</code></pre>

                        <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg my-6">
                            <p class="text-orange-800 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i><strong>Rule of Least Privilege:</strong> Give the minimum access necessary. If a user only needs to read their own profile, don't give them write access to everyone's profiles!</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Use granular rules (<code>create</code>, <code>update</code>, <code>delete</code>) instead of broad <code>write</code>. Validate data types and structure with <code>request.resource.data</code> checks.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Data validation demo
console.log("=== Validating Document Write ===");

const newUser = {
  name: "Dave",
  email: "dave@example.com",
  role: "user"
};

console.log("Validating fields:");
console.log(" name exists:", typeof newUser.name === 'string' && newUser.name.length > 0);
console.log(" email exists:", typeof newUser.email === 'string' && newUser.email.includes('@'));
console.log(" role is valid:", ['user', 'admin', 'guest'].includes(newUser.role));

const isValid = newUser.name && newUser.email.includes('@');
console.log("\nValidation passed:", isValid);

if (isValid) {
  setDoc("users", "userDave", newUser);
  console.log("✓ Document written successfully");
}`,
      },
      {
        id: 'm4-l3',
        title: 'Advanced Rules (Custom Claims & Functions)',
        objectives: [
          'Use custom claims for role-based access control',
          'Organize rules with reusable functions',
          'Implement attribute-based access control with document data',
        ],
        takeaway: 'Custom claims (set via Admin SDK) let you assign roles. Functions in rules keep your logic DRY and maintainable.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Use custom claims for role-based access control</li>
                                <li>Organize rules with reusable functions</li>
                                <li>Implement attribute-based access control with document data</li>
                            </ul>
                        </div>

                        <h2>Advanced Security Rules</h2>
                        
                        <h3>Custom Claims</h3>
                        <p>Set custom roles on users via the Admin SDK (from a secure server environment):</p>
                        <pre><code>// Set on server (Node.js Admin SDK)
admin.auth().setCustomUserClaims(uid, { role: 'admin' });

// Check in rules
match /admin-data/{doc} {
  allow read, write: if request.auth.token.role == 'admin';
}</code></pre>

                        <h3>Reusable Functions</h3>
                        <pre><code>rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    function hasRole(role) {
      return request.auth.token.role == role;
    }
    function isAdmin() {
      return hasRole('admin');
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) || isAdmin();
    }

    match /posts/{postId} {
      allow read: if resource.data.published == true || isAdmin();
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.authorId) || isAdmin();
      allow delete: if isAdmin();
    }
  }
}</code></pre>

                        <div class="bg-purple-50 border border-purple-200 p-4 rounded-lg my-6">
                            <p class="text-purple-800 text-sm"><i class="fas fa-rocket mr-2"></i><strong>Pro Tip:</strong> Use functions to keep your rules DRY (Don't Repeat Yourself). Store frequently-used conditions as reusable functions at the top of your rules file.</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Custom claims (set via Admin SDK) let you assign roles like 'admin' or 'premium'. Functions in rules keep your logic DRY and maintainable. Combine ownership checks with role checks for fine-grained access.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Custom claims simulation
console.log("=== Role-Based Access Demo ===");

const currentUser = mockAuthState.currentUser;
const mockClaims = { role: "admin", tier: "premium" };

if (currentUser) {
  console.log("User:", currentUser.email);
  console.log("Custom claims:", JSON.stringify(mockClaims));
  
  if (mockClaims.role === "admin") {
    console.log("✓ Admin access granted — can read/write all data");
  }
  if (mockClaims.tier === "premium") {
    console.log("✓ Premium feature: Unlimited storage");
  }
} else {
  console.log("✗ Not authenticated — access denied");
}`,
      },
    ],
    quiz: [
      {
        id: 'q4-1',
        question: 'What does request.auth contain in Firestore Security Rules?',
        options: [
          'The user\'s password',
          'Information about the authenticated user (uid, email, etc.)',
          'The list of all registered users',
          'The user\'s location',
        ],
        correct: 1,
      },
      {
        id: 'q4-2',
        question: 'What is the safest starting point for Security Rules?',
        options: [
          'Allow all and block specific operations',
          'Deny all and open up selectively',
          'Allow authenticated users only',
          'Use default Firebase rules',
        ],
        correct: 1,
      },
      {
        id: 'q4-3',
        question: 'How do you set a custom claim on a user?',
        options: [
          'From the client-side JavaScript SDK',
          'From the Admin SDK (server-side)',
          'From Firestore directly',
          'Users set their own claims in profile settings',
        ],
        correct: 1,
      },
      {
        id: 'q4-4',
        question: 'What does resource.data represent in a rule?',
        options: [
          'The data being written',
          'The existing document data in Firestore',
          'The user authentication token',
          'The collection name',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 5: Cloud Functions ───
  {
    id: 'mod-5',
    title: 'Cloud Functions',
    lessons: [
      {
        id: 'm5-l1',
        title: 'Introduction to Cloud Functions',
        objectives: [
          'Understand the serverless execution model of Cloud Functions',
          'Write and deploy a basic Cloud Function',
          'Identify use cases for background vs HTTP functions',
        ],
        takeaway: 'Cloud Functions are serverless JavaScript/TypeScript handlers that run in response to Firebase events. Deploy with firebase deploy --only functions.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Understand the serverless execution model of Cloud Functions</li>
                                <li>Write and deploy a basic Cloud Function</li>
                                <li>Identify use cases for background vs HTTP functions</li>
                            </ul>
                        </div>

                        <h2>Cloud Functions for Firebase</h2>
                        <p>Cloud Functions let you run backend code <strong>automatically</strong> in response to Firebase events. No managing servers — Google handles the infrastructure!</p>
                        
                        <h3>Function Types</h3>
                        <ul>
                            <li><strong>Background Functions:</strong> Triggered by Firebase events (Auth, Firestore, Storage)</li>
                            <li><strong>HTTP Functions:</strong> Triggered by HTTP requests (REST APIs, webhooks)</li>
                        </ul>

                        <h3>Basic Setup</h3>
                        <pre><code>// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Simple HTTP function
exports.helloWorld = functions.https.onCall((data, context) => {
  return { message: "Hello from Firebase!" };
});

// Call from client
const result = await httpsCallable(functions, 'helloWorld')();
console.log(result.data.message);</code></pre>

                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-lightbulb mr-2"></i><strong>Cost Model:</strong> You pay only for compute time while functions are running. If a function runs for 100ms, you're charged for 100ms. The free tier includes 2 million invocations per month!</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Cloud Functions are serverless handlers that run in response to Firebase events. Deploy with <code>firebase deploy --only functions</code>. Start with the free tier (2M invocations/month) and scale as needed.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate a cloud function execution
console.log("=== Cloud Function: helloWorld ===");
console.log("Function triggered!");
console.log("Input: { name: 'Firebase Learner' }");

function processRequest(data) {
  const result = {
    status: "success",
    message: "Hello, " + data.name + "! Welcome to Cloud Functions.",
    timestamp: new Date().toISOString()
  };
  return result;
}

const response = processRequest({ name: "Firebase Learner" });
console.log("Response:", JSON.stringify(response, null, 2));
console.log("Execution time: ~45ms");`,
      },
      {
        id: 'm5-l2',
        title: 'Firestore Triggers',
        objectives: [
          'Set up Firestore onCreate, onUpdate, and onDelete triggers',
          'Access the Change object to compare before/after data',
          'Implement a real-world pattern like sending notifications on new documents',
        ],
        takeaway: 'Firestore triggers react to document changes. Use the Change object to access before/after states and implement side effects like notifications.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Set up Firestore onCreate, onUpdate, and onDelete triggers</li>
                                <li>Access the Change object to compare before/after data</li>
                                <li>Implement a real-world pattern like sending notifications on new documents</li>
                            </ul>
                        </div>

                        <h2>Firestore Triggers</h2>
                        <p>Firestore triggers fire Cloud Functions in response to document changes:</p>
                        
                        <h3>Trigger Types</h3>
                        <pre><code>const functions = require("firebase-functions");

// When a new document is created
exports.onNewUser = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const newUser = snap.data();
    console.log("New user created:", newUser.email);
    // Send welcome email, create default settings, etc.
  });

// When a document is updated
exports.onUserUpdate = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    console.log("Updated fields:", Object.keys(after).filter(k => before[k] !== after[k]));
  });

// When a document is deleted
exports.onPostDeleted = functions.firestore
  .document("posts/{postId}")
  .onDelete(async (snap, context) => {
    const deletedPost = snap.data();
    console.log("Post deleted:", deletedPost.title);
    // Clean up related data, images from Storage, etc.
  });</code></pre>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Firestore triggers (<code>onCreate</code>, <code>onUpdate</code>, <code>onDelete</code>) react to document changes. Use the <code>Change</code> object to access before/after states and implement side effects like welcome emails or data cleanup.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate a Firestore trigger
console.log("=== Firestore Trigger Simulation ===");

function simulateOnCreate(collection, docId, data) {
  console.log("[TRIGGER] Document created in", collection + "/" + docId);
  console.log("  New data:", JSON.stringify(data));
  console.log("  Action: Sending welcome email to", data.email);
  console.log("  Action: Creating default settings document");
}

function simulateOnUpdate(before, after) {
  const changes = Object.keys(after).filter(k => before[k] !== after[k]);
  console.log("[TRIGGER] Document updated");
  console.log("  Changed fields:", changes.join(", "));
}

// Trigger simulations
simulateOnCreate("users", "user999", {
  name: "Eve",
  email: "eve@example.com",
  createdAt: new Date().toISOString()
});

console.log("\n---");
simulateOnUpdate(
  { name: "Eve", role: "user" },
  { name: "Eve", role: "admin" }
);`,
      },
      {
        id: 'm5-l3',
        title: 'Auth Triggers & HTTP Functions',
        objectives: [
          'Set up auth triggers for user creation and deletion',
          'Create callable HTTP functions for client-server communication',
          'Handle authentication and validation in callable functions',
        ],
        takeaway: 'Auth triggers run on user creation/deletion. Callable functions provide typed, authenticated client-server communication with built-in auth context.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Set up auth triggers for user creation and deletion</li>
                                <li>Create callable HTTP functions for client-server communication</li>
                                <li>Handle authentication and validation in callable functions</li>
                            </ul>
                        </div>

                        <h2>Auth Triggers & HTTP Functions</h2>
                        
                        <h3>Auth Triggers</h3>
                        <p>Run code when users are created or deleted:</p>
                        <pre><code>// Triggered when a new user account is created
exports.onUserSignup = functions.auth
  .user()
  .onCreate(async (user) => {
    console.log("New user:", user.email);
    
    // Create a user document in Firestore
    await admin.firestore().collection("users").doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || "Anonymous",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: "user"
    });
  });

// Triggered when a user account is deleted
exports.onUserDelete = functions.auth
  .user()
  .onDelete(async (user) => {
    console.log("User deleted:", user.uid);
    // Clean up user data
    await admin.firestore().collection("users").doc(user.uid).delete();
  });</code></pre>

                        <h3>Callable Functions</h3>
                        <p><code>onCall</code> functions are like regular API endpoints but with built-in auth:</p>
                        <pre><code>// Server (functions/index.js)
exports.createUserProfile = functions.https.onCall(async (data, context) => {
  // Context contains auth info automatically
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated", "You must be logged in!"
    );
  }
  
  const { displayName, bio } = data;
  await admin.firestore().collection("profiles").doc(context.auth.uid).set({
    displayName, bio, updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
});

// Client (web app)
const createProfile = httpsCallable(functions, "createUserProfile");
const result = await createProfile({ displayName: "Alice", bio: "Dev" });</code></pre>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Auth triggers (<code>functions.auth.user().onCreate</code>) run when users sign up or delete accounts. Callable functions (<code>onCall</code>) provide typed, authenticated client-server communication with automatic auth context.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate auth trigger + callable function
console.log("=== Auth Trigger Simulation ===");

function simulateOnCreate(user) {
  console.log("[AUTH TRIGGER] New user: " + user.email);
  console.log("  Creating Firestore document for user:", user.uid);
  return { uid: user.uid, email: user.email, role: "user" };
}

function simulateCallable(action, data) {
  console.log("\n[HTTP CALLABLE] Calling:", action);
  console.log("  Auth: ", data.authenticated ? "✓ Authenticated" : "✗ Unauthenticated");
  
  if (!data.authenticated) {
    return { error: "unauthenticated", message: "Login required" };
  }
  return { success: true, result: data.payload };
}

// Run simulations
const newUser = simulateOnCreate({
  uid: "user_abc",
  email: "newuser@example.com"
});
console.log("Created user doc:", JSON.stringify(newUser));

const result = simulateCallable("createProfile", {
  authenticated: true,
  payload: { displayName: "New User", bio: "Learning Firebase!" }
});
console.log("Callable result:", JSON.stringify(result));`,
      },
    ],
    quiz: [
      {
        id: 'q5-1',
        question: 'Which command deploys Cloud Functions to Firebase?',
        options: [
          'firebase deploy',
          'firebase deploy --only functions',
          'npm run functions:deploy',
          'functions:deploy',
        ],
        correct: 1,
      },
      {
        id: 'q5-2',
        question: 'What does the Change object provide in a Firestore onUpdate trigger?',
        options: [
          'Only the new data',
          'Both the before and after snapshots',
          'The document ID only',
          'The collection name only',
        ],
        correct: 1,
      },
      {
        id: 'q5-3',
        question: 'What is the advantage of onCall functions over regular HTTP functions?',
        options: [
          'They are faster',
          'They automatically include Firebase Auth context',
          'They can run for longer',
          'They don\'t need deployment',
        ],
        correct: 1,
      },
      {
        id: 'q5-4',
        question: 'When would you use an Auth trigger (functions.auth.user().onCreate)?',
        options: [
          'To create a user profile in Firestore when someone signs up',
          'To authenticate user passwords',
          'To send password reset emails',
          'To create new user accounts',
        ],
        correct: 0,
      },
    ],
  },

  // ─── Module 6: Firebase Storage ───
  {
    id: 'mod-6',
    title: 'Firebase Storage',
    lessons: [
      {
        id: 'm6-l1',
        title: 'Uploading Files',
        objectives: [
          'Create storage references and upload files with uploadBytes',
          'Track upload progress with uploadBytesResumable',
          'Handle upload errors and manage file metadata',
        ],
        takeaway: 'Use ref() to create references, uploadBytes or uploadBytesResumable to upload. Resumable uploads let you track progress for large files.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Create storage references and upload files with uploadBytes</li>
                                <li>Track upload progress with uploadBytesResumable</li>
                                <li>Handle upload errors and manage file metadata</li>
                            </ul>
                        </div>

                        <h2>Firebase Storage — File Uploads</h2>
                        <p>Firebase Storage stores user-generated content like images, videos, and documents. It integrates with Google Cloud Storage for massive scale.</p>
                        
                        <h3>Creating References</h3>
                        <pre><code>import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage();

// Create a reference to where the file will go
const storageRef = ref(storage, "users/user123/profile.jpg");
const metadata = {
  contentType: "image/jpeg",
  customMetadata: { uploadedBy: "user123" }
};</code></pre>

                        <h3>Uploading a File</h3>
                        <pre><code>// Basic upload
const snapshot = await uploadBytes(storageRef, file, metadata);
console.log("Uploaded:", snapshot.metadata.fullPath);

// Get the download URL
const url = await getDownloadURL(snapshot.ref);
console.log("File available at:", url);</code></pre>

                        <h3>Tracking Progress (for large files)</h3>
                        <pre><code>import { uploadBytesResumable } from "firebase/storage";

const uploadTask = uploadBytesResumable(storageRef, file);

uploadTask.on("state_changed",
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log("Upload progress:", Math.round(progress) + "%");
  },
  (error) => {
    console.error("Upload failed:", error.code);
  },
  () => {
    console.log("Upload complete!");
  }
);</code></pre>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Use <code>ref()</code> to create references, <code>uploadBytes</code> or <code>uploadBytesResumable</code> to upload. Resumable uploads let you track progress for large files. Always store the download URL in Firestore!</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate file upload
console.log("=== File Upload Simulation ===");

function simulateUpload(fileName, fileSize, fileType) {
  console.log("Uploading:", fileName);
  console.log("Size:", (fileSize / 1024).toFixed(1) + " KB");
  console.log("Type:", fileType);
  
  // Simulate progress
  [25, 50, 75, 100].forEach(pct => {
    setTimeout(() => {
      console.log("Progress:", pct + "%");
    }, pct * 10);
  });
  
  // Simulate completion
  setTimeout(() => {
    const downloadUrl = "https://storage.googleapis.com/project-bucket/" + fileName;
    console.log("\n✓ Upload complete!");
    console.log("Download URL:", downloadUrl);
  }, 1000);
}

simulateUpload("profile_photo.jpg", 204800, "image/jpeg");`,
      },
      {
        id: 'm6-l2',
        title: 'Download & Manage Files',
        objectives: [
          'Download files using getDownloadURL',
          'Delete files with deleteObject',
          'Organize storage paths and write effective Storage Security Rules',
        ],
        takeaway: 'Use getDownloadURL for public access, deleteObject for removal. Organize files by user path for simpler security rules.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Download files using getDownloadURL</li>
                                <li>Delete files with deleteObject</li>
                                <li>Organize storage paths and write effective Storage Security Rules</li>
                            </ul>
                        </div>

                        <h2>Managing Files in Storage</h2>
                        
                        <h3>Getting Download URLs</h3>
                        <pre><code>import { ref, getDownloadURL } from "firebase/storage";

const storageRef = ref(storage, "avatars/user123.jpg");
try {
  const url = await getDownloadURL(storageRef);
  document.getElementById("avatar").src = url;
} catch (error) {
  console.error("File not found:", error.code);
}</code></pre>

                        <h3>Deleting Files</h3>
                        <pre><code>import { ref, deleteObject } from "firebase/storage";

const desertRef = ref(storage, "images/old-photo.jpg");
await deleteObject(desertRef);
console.log("File deleted!");</code></pre>

                        <h3>Storage Security Rules</h3>
                        <pre><code>rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Only authenticated users can read files
    match /{allPaths=**} {
      allow read: if request.auth != null;
    }
    
    // Users can only write to their own folder
    match /users/{userId}/{allPaths=**} {
      allow write: if request.auth.uid == userId;
    }
    
    // Admins can manage all files
    match /admins/{allPaths=**} {
      allow write: if request.auth.token.role == 'admin';
    }
  }
}</code></pre>

                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-lightbulb mr-2"></i><strong>Best Practice:</strong> Always organize files using user-based paths like <code>users/{uid}/photos/</code>. This makes security rules SIMPLE and ensures users can only access their own files.</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Use <code>getDownloadURL</code> for public file access, <code>deleteObject</code> for removal. Organize files by user path (<code>users/{uid}/...</code>) for simpler, more secure rules.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate file management
console.log("=== File Management Simulation ===");

const mockStorage = {
  "users/user123/avatar.jpg": "https://storage.example.com/avatars/user123.jpg",
  "users/user123/report.pdf": "https://storage.example.com/reports/user123.pdf",
  "public/banner.png": "https://storage.example.com/public/banner.png"
};

// List all files
console.log("\nAll files in storage:");
Object.entries(mockStorage).forEach(([path, url]) => {
  console.log(" ", path, "→", url);
});

// Simulate file deletion
console.log("\nDeleting: public/banner.png");
delete mockStorage["public/banner.png"];
console.log("✓ File deleted");

console.log("\nRemaining files:");
Object.keys(mockStorage).forEach(p => console.log(" ", p));`,
      },
    ],
    quiz: [
      {
        id: 'q6-1',
        question: 'How do you get a publicly accessible URL for a file in Firebase Storage?',
        options: [
          'getPublicUrl(ref)',
          'getDownloadURL(ref)',
          'ref.getUrl()',
          'storage.getFileUrl(ref)',
        ],
        correct: 1,
      },
      {
        id: 'q6-2',
        question: 'What is the advantage of uploadBytesResumable over uploadBytes?',
        options: [
          'It is faster',
          'It allows tracking upload progress',
          'It supports larger file sizes only',
          'It requires authentication',
        ],
        correct: 1,
      },
      {
        id: 'q6-3',
        question: 'What is the best way to organize files in Firebase Storage for security?',
        options: [
          'Store all files in a single folder',
          'Use user-based paths like users/{uid}/files/',
          'Use random file names',
          'Avoid using folders entirely',
        ],
        correct: 1,
      },
      {
        id: 'q6-4',
        question: 'Which function deletes a file from Firebase Storage?',
        options: [
          'deleteFile(ref)',
          'deleteObject(ref)',
          'storage.remove(ref)',
          'ref.delete()',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 7: Firebase Hosting ───
  {
    id: 'mod-7',
    title: 'Firebase Hosting',
    lessons: [
      {
        id: 'm7-l1',
        title: 'Deploying Your App',
        objectives: [
          'Initialize and configure Firebase Hosting',
          'Deploy static assets with firebase deploy',
          'Preview deployments using hosting channels',
        ],
        takeaway: 'Firebase Hosting provides global CDN hosting with one-command deployment. Use hosting channels for preview deployments before going live.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Initialize and configure Firebase Hosting</li>
                                <li>Deploy static assets with firebase deploy</li>
                                <li>Preview deployments using hosting channels</li>
                            </ul>
                        </div>

                        <h2>Firebase Hosting</h2>
                        <p>Firebase Hosting serves your web app on a <strong>global CDN</strong> (Content Delivery Network) with a single command. Your app loads fast everywhere in the world!</p>
                        
                        <h3>Getting Started</h3>
                        <pre><code># Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting in your project
firebase init hosting

# Follow prompts:
# - Select your Firebase project
# - Set public directory (usually "public" or "build")
# - Configure as single-page app? (Yes for SPAs)
# - Set up automatic builds? (Optional)</code></pre>

                        <h3>Deploying</h3>
                        <pre><code># Deploy to production
firebase deploy --only hosting

# Your app is live at:
# https://your-project.web.app
# https://your-project.firebaseapp.com</code></pre>

                        <h3>Preview Channels</h3>
                        <pre><code># Create a preview channel (great for testing)
firebase hosting:channel:deploy preview-name

# Share the generated URL with your team
# Each channel gets a unique URL like:
# https://project--preview-name-abc123.web.app</code></pre>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Firebase Hosting provides global CDN hosting with one-command deployment. Use <code>firebase hosting:channel:deploy</code> for preview deployments before going live. Free SSL certificate and custom domain support included!</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Hosting deployment simulation
console.log("=== Firebase Hosting Deployment ===");

console.log("\nStep 1: Building app...");
console.log("  ✓ Bundled JavaScript");
console.log("  ✓ Optimized images");
console.log("  ✓ Minified CSS");

console.log("\nStep 2: Uploading to Hosting...");
const files = ["index.html", "styles.css", "app.js", "favicon.ico"];
files.forEach(f => console.log("  ✓ Uploaded:", f));

console.log("\nStep 3: Deploy complete!");
console.log("  Production URL: https://my-app.web.app");
console.log("  CDN regions: 25 global edge locations");
console.log("  SSL: ✓ Active (Let's Encrypt)");`,
      },
      {
        id: 'm7-l2',
        title: 'Advanced Hosting Config',
        objectives: [
          'Configure rewrites for single-page application routing',
          'Set up redirects and custom 404 pages',
          'Connect a custom domain and configure Cloud Functions with Hosting',
        ],
        takeaway: 'Use firebase.json to configure rewrites (for SPA routing), redirects (for moved pages), and custom headers. Connect custom domains for a branded URL.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Configure rewrites for single-page application routing</li>
                                <li>Set up redirects and custom 404 pages</li>
                                <li>Connect a custom domain and configure Cloud Functions with Hosting</li>
                            </ul>
                        </div>

                        <h2>Advanced Hosting Configuration</h2>
                        
                        <h3>firebase.json Configuration</h3>
                        <pre><code>{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      // SPA: All non-file URLs serve index.html
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "redirects": [
      {
        "source": "/old-page",
        "destination": "/new-page",
        "type": 301
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png)",
        "headers": [{
          "key": "Cache-Control",
          "value": "max-age=604800"
        }]
      }
    ]
  }
}</code></pre>

                        <h3>Connecting Cloud Functions</h3>
                        <pre><code>{
  "hosting": {
    "rewrites": [
      // API routes served by Cloud Functions
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  }
}
// Now your API is at: https://your-app.web.app/api/users</code></pre>

                        <h3>Custom Domain Setup</h3>
                        <p>In Firebase Console > Hosting: Add your custom domain and update your DNS records. Firebase provides free SSL certificates via Let's Encrypt.</p>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Use <code>firebase.json</code> to configure <strong>rewrites</strong> (for SPA routing), <strong>redirects</strong> (for moved pages), and <strong>custom headers</strong>. Connect custom domains for a branded URL and serve Cloud Functions from the same domain.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate hosting config
console.log("=== Hosting Configuration Demo ===");

const hostingConfig = {
  public: "dist",
  rewrites: [{ source: "**", destination: "/index.html" }],
  redirects: [{ source: "/old", destination: "/new", type: 301 }],
  headers: [{ source: "*.jpg", headers: [{ key: "Cache-Control", value: "max-age: 604800" }] }]
};

console.log("firebase.json config:");
console.log(JSON.stringify(hostingConfig, null, 2));

console.log("\n✓ SPA: All routes → index.html");
console.log("✓ Redirect: /old → /new (301)");
console.log("✓ Headers: Images cached for 7 days");`,
      },
    ],
    quiz: [
      {
        id: 'q7-1',
        question: 'Which feature in firebase.json handles single-page app routing?',
        options: [
          'redirects',
          'rewrites',
          'headers',
          'cleanUrls',
        ],
        correct: 1,
      },
      {
        id: 'q7-2',
        question: 'What is the command to create a preview deployment?',
        options: [
          'firebase deploy --preview',
          'firebase hosting:channel:deploy my-preview',
          'firebase preview deploy',
          'firebase hosting:preview',
        ],
        correct: 1,
      },
      {
        id: 'q7-3',
        question: 'What SSL certificate does Firebase Hosting provide?',
        options: [
          'Paid SSL through Google Cloud',
          'Free SSL via Let\'s Encrypt',
          'No SSL is included',
          'Self-signed certificate',
        ],
        correct: 1,
      },
      {
        id: 'q7-4',
        question: 'How can you serve a Cloud Function from your Firebase Hosting domain?',
        options: [
          'It happens automatically',
          'Use rewrites in firebase.json to point a path to a function',
          'Use redirects in firebase.json',
          'It\'s not possible',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 8: App Check ───
  {
    id: 'mod-8',
    title: 'App Check',
    lessons: [
      {
        id: 'm8-l1',
        title: 'Introduction to App Check',
        objectives: [
          'Understand what problem App Check solves',
          'Learn about available attestation providers',
          'Identify when to enforce App Check vs debug mode',
        ],
        takeaway: 'App Check verifies that requests come from your real app, not from malicious scripts. It prevents abuse like credential stuffing and unauthorized API calls.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Understand what problem App Check solves</li>
                                <li>Learn about available attestation providers</li>
                                <li>Identify when to enforce App Check vs debug mode</li>
                            </ul>
                        </div>

                        <h2>What is App Check?</h2>
                        <p>App Check is a Firebase security feature that <strong>verifies requests come from your real app</strong>, not from malicious scripts, bots, or unauthorized clients.</p>
                        
                        <div class="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                            <p class="text-red-800 text-sm"><i class="fas fa-shield-halved mr-2"></i><strong>The Problem:</strong> Without App Check, anyone can call your Firebase backend by simply reading your API keys from your app. They can write scripts to abuse your services, costing you money and compromising data!</p>
                        </div>

                        <h3>How It Works</h3>
                        <ol>
                            <li>Your app gets a <strong>token</strong> from an attestation provider</li>
                            <li>Firebase sends this token with every request</li>
                            <li>The server verifies the token is valid</li>
                            <li>Requests without valid tokens are rejected</li>
                        </ol>

                        <h3>Supported Providers</h3>
                        <ul>
                            <li><strong>reCAPTCHA Enterprise</strong> (Web) — Uses Google's risk analysis to verify human users</li>
                            <li><strong>Play Integrity</strong> (Android) — Verifies the device and app integrity</li>
                            <li><strong>DeviceCheck</strong> (iOS) — Apple's attestation service</li>
                        </ul>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">App Check verifies that requests come from your real app, not from malicious scripts. It prevents abuse like credential stuffing and unauthorized API calls. Start with debug mode during development, enforce in production.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// App Check simulation
console.log("=== App Check Flow Simulation ===");

function appCheckRequest(endpoint, hasValidToken) {
  console.log("\nRequest to:", endpoint);
  console.log("App Check token:", hasValidToken ? "✓ Valid" : "✗ Missing/Bad");
  
  if (!hasValidToken) {
    console.log("✗ REJECTED: Request from unauthorized source");
    return { status: 403, error: "app-check/rejected" };
  }
  
  console.log("✓ ACCEPTED: Request from verified app instance");
  return { status: 200, data: { message: "Success" } };
}

console.log("\n--- Without App Check ---");
appCheckRequest("/api/getAllUsers", false);

console.log("\n--- With App Check ---");
appCheckRequest("/api/getAllUsers", true);`,
      },
      {
        id: 'm8-l2',
        title: 'Implementing App Check Providers',
        objectives: [
          'Initialize App Check with reCAPTCHA for web apps',
          'Use debug tokens during local development',
          'Enable App Check enforcement for Firebase services',
        ],
        takeaway: 'Initialize App Check with provider-specific config. Test with debug tokens first, then enforce in production. Without enforcement, App Check logs but doesn\'t block.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Initialize App Check with reCAPTCHA for web apps</li>
                                <li>Use debug tokens during local development</li>
                                <li>Enable App Check enforcement for Firebase services</li>
                            </ul>
                        </div>

                        <h2>Implementing App Check</h2>
                        
                        <h3>Web Setup with reCAPTCHA Enterprise</h3>
                        <pre><code>import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const app = initializeApp(firebaseConfig);

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6L..._your_site_key"),
  isTokenAutoRefreshEnabled: true // Auto-refresh tokens
});</code></pre>

                        <h3>Debug Tokens (for Local Development)</h3>
                        <pre><code>// In development, bypass App Check with debug tokens
// Set this BEFORE initializing App Check
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

// Or set environment variable:
// export FIREBASE_APPCHECK_DEBUG_TOKEN="your-debug-token"

// Check browser console for the debug token on first run
// Register it in Firebase Console > App Check > Manage Debug Tokens</code></pre>

                        <h3>Enforcement</h3>
                        <p>In Firebase Console > App Check:</p>
                        <ol>
                            <li>Go to the <strong>Apps</strong> tab</li>
                            <li>Find your app and click <strong>Manage</strong></li>
                            <li>Toggle enforcement for each service (Firestore, Storage, Functions)</li>
                            <li>Start with <strong>Log only</strong> mode first to monitor for issues</li>
                            <li>Switch to <strong>Enforce</strong> after verifying everything works</li>
                        </ol>

                        <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg my-6">
                            <p class="text-orange-800 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i><strong>Warning:</strong> If you enable enforcement but App Check isn't properly configured in your app, ALL real users will be blocked! Always test with debug tokens first.</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Initialize App Check with provider-specific config. Test with debug tokens first, then enable enforcement. Without enforcement, App Check logs but doesn't block — use this to verify your setup before going live.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// App Check implementation demo
console.log("=== App Check Implementation ===");

console.log("\n1. Initializing reCAPTCHA Enterprise provider...");
console.log("   ✓ App Check initialized");
console.log("   ✓ Token auto-refresh enabled");

console.log("\n2. Debug mode check...");
const isDevelopment = true;
if (isDevelopment) {
  console.log("   Using debug token: [XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX]");
  console.log("   ✓ Register this token in Firebase Console");
}

console.log("\n3. Enforcement status:");
const services = [
  { name: "Firestore", status: "Log Only" },
  { name: "Storage", status: "Log Only" },
  { name: "Functions", status: "Disabled" }
];

services.forEach(s => console.log("   ", s.name + ":", s.status));
console.log("\n   ^ After verifying logs, switch to 'Enforce'");`,
      },
    ],
    quiz: [
      {
        id: 'q8-1',
        question: 'What is the primary purpose of Firebase App Check?',
        options: [
          'To check if the app is installed correctly',
          'To verify requests come from your real app, not scripts',
          'To check app version',
          'To scan for viruses in uploaded files',
        ],
        correct: 1,
      },
      {
        id: 'q8-2',
        question: 'What should you use during local development instead of enforcing App Check?',
        options: [
          'Disable all security',
          'Use debug tokens',
          'Use a different Firebase project',
          'Skip initialization',
        ],
        correct: 1,
      },
      {
        id: 'q8-3',
        question: 'Which provider is used for App Check on web apps?',
        options: [
          'Play Integrity',
          'DeviceCheck',
          'reCAPTCHA Enterprise',
          'SafetyNet',
        ],
        correct: 2,
      },
      {
        id: 'q8-4',
        question: 'What happens if you enable enforcement but App Check is not properly configured?',
        options: [
          'Only unauthenticated users are blocked',
          'All requests from real users are rejected',
          'The app still works but slower',
          'Nothing happens',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 9: Real-time & Offline Features ───
  {
    id: 'mod-9',
    title: 'Real-time & Offline Features',
    lessons: [
      {
        id: 'm9-l1',
        title: 'Offline Persistence',
        objectives: [
          'Enable offline persistence with a single API call',
          'Understand Firestore\'s offline-first architecture',
          'Handle pending writes and offline scenarios gracefully',
        ],
        takeaway: 'Offline persistence lets your app work without internet. Enable with enableMultiTabIndexedDbPersistence. Firestore queues writes locally and syncs when back online.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Enable offline persistence with a single API call</li>
                                <li>Understand Firestore's offline-first architecture</li>
                                <li>Handle pending writes and offline scenarios gracefully</li>
                            </ul>
                        </div>

                        <h2>Offline Persistence</h2>
                        <p>One of Firestore's superpowers: <strong>it works offline!</strong> Firestore caches data locally and syncs changes when connectivity returns.</p>
                        
                        <h3>Enabling Offline Persistence</h3>
                        <pre><code>import { initializeFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const db = initializeFirestore(app, {});

// Enable offline persistence (call before any other Firestore operation)
try {
  await enableMultiTabIndexedDbPersistence(db);
  console.log("Offline persistence enabled!");
} catch (err) {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.log("Multi-tab persistence already active");
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence (e.g., Safari private mode)
    console.log("Persistence not supported in this browser");
  }
}</code></pre>

                        <h3>How Offline Works</h3>
                        <ul>
                            <li><strong>Reads:</strong> Firestore first tries the server, falls back to local cache</li>
                            <li><strong>Writes:</strong> Queued locally, synced when online. <code>SnapshotMetadata.fromCache</code> tells you if data came from cache</li>
                            <li><strong>Conflicts:</strong> Last write wins by default. Use transactions for critical operations</li>
                        </ul>

                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-lightbulb mr-2"></i><strong>Pro Tip:</strong> Use <code>snapshot.metadata.fromCache</code> to show an "offline" indicator to users so they know they're viewing cached data.</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Offline persistence lets your app work without internet. Enable with <code>enableMultiTabIndexedDbPersistence(db)</code>. Firestore queues writes locally and syncs when back online. Handle the <code>failed-precondition</code> and <code>unimplemented</code> errors gracefully.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate offline persistence
console.log("=== Offline Persistence Simulation ===");

const dbState = {
  online: true,
  pendingWrites: [],
  localCache: { users: { "cached-1": { name: "Cached User" } } }
};

function goOffline() {
  dbState.online = false;
  console.log("\n📡 Network: OFFLINE");
  console.log("Reading from local cache...");
  console.log("Cached data:", JSON.stringify(dbState.localCache));
}

function writeWhileOffline(data) {
  dbState.pendingWrites.push(data);
  console.log("📝 Write queued:", JSON.stringify(data));
  console.log("Pending writes:", dbState.pendingWrites.length);
}

function goOnline() {
  dbState.online = true;
  console.log("\n📡 Network: ONLINE");
  console.log("Syncing", dbState.pendingWrites.length, "pending writes...");
  dbState.pendingWrites.forEach(w => console.log(" ✓ Synced:", JSON.stringify(w)));
  dbState.pendingWrites = [];
  console.log("✓ All writes synced!");
}

goOffline();
writeWhileOffline({ name: "New User", email: "test@test.com" });
writeWhileOffline({ name: "Another User" });
goOnline();`,
      },
      {
        id: 'm9-l2',
        title: 'Real-time Sync with onSnapshot',
        objectives: [
          'Set up real-time listeners with onSnapshot for collections',
          'Handle document changes using docChanges()',
          'Understand snapshot metadata for cache vs server data',
        ],
        takeaway: 'onSnapshot syncs data in real-time across all connected clients. Use docChanges() to see exactly what changed and snapshot.metadata to know if data came from cache or server.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Set up real-time listeners with onSnapshot for collections</li>
                                <li>Handle document changes using docChanges()</li>
                                <li>Understand snapshot metadata for cache vs server data</li>
                            </ul>
                        </div>

                        <h2>Real-time Sync</h2>
                        <p><code>onSnapshot</code> creates a live connection between your app and Firestore. When data changes on the server, ALL connected clients receive the update instantly!</p>
                        
                        <h3>Real-time Collection Listener</h3>
                        <pre><code>import { collection, onSnapshot, query, where } from "firebase/firestore";

const q = query(collection(db, "chats"), where("roomId", "==", "room-abc"));

const unsubscribe = onSnapshot(q, (snapshot) => {
  // Check if data is from cache or server
  const source = snapshot.metadata.fromCache ? "local cache" : "server";
  console.log("Data from:", source);

  snapshot.docChanges().forEach((change) => {
    const msg = change.doc.data();
    switch (change.type) {
      case "added":
        console.log("New message:", msg.text);
        break;
      case "modified":
        console.log("Updated:", msg.text);
        break;
      case "removed":
        console.log("Message deleted:", change.doc.id);
        break;
    }
  });
});

// Clean up when leaving
unsubscribe();</code></pre>

                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-lightbulb mr-2"></i><strong>App Idea:</strong> Build a live chat app! Use <code>onSnapshot</code> to listen for new messages in a chat room. When a user sends a message, it appears on all connected devices instantly — no refreshing needed!</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm"><code>onSnapshot</code> syncs data in real time across all connected clients. Use <code>docChanges()</code> to see exactly what changed (added/modified/removed) and <code>snapshot.metadata.fromCache</code> to know if data came from cache or server.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate real-time sync across clients
console.log("=== Real-time Sync Simulation ===");

const chatRoom = {
  messages: [
    { id: "1", user: "Alice", text: "Hi everyone!", timestamp: Date.now() },
    { id: "2", user: "Bob", text: "Hey Alice!", timestamp: Date.now() + 1000 }
  ]
};

console.log("Connected to chat room 'general'");
console.log("Listening for changes...\n");

// Initial state
console.log("Initial messages:");
chatRoom.messages.forEach(m => console.log("  " + m.user + ": " + m.text));

// Simulate new message arriving after 1 second
setTimeout(() => {
  const newMsg = { id: "3", user: "Charlie", text: "Hey team! 👋", timestamp: Date.now() + 2000 };
  chatRoom.messages.push(newMsg);
  console.log("\n🔔 [REALTIME] New message from Charlie:");
  console.log("  " + m.user + ": " + m.text);
  
  console.log("\nUpdated messages:");
  chatRoom.messages.forEach(m => console.log("  " + m.user + ": " + m.text));
}, 2000);`,
      },
      {
        id: 'm9-l3',
        title: 'Conflict Resolution with Transactions',
        objectives: [
          'Understand the last-write-wins conflict model',
          'Use runTransaction for atomic read-modify-write operations',
          'Implement distributed counters and financial operations safely',
        ],
        takeaway: 'Transactions provide atomic read-modify-write. Use them for counters, financial operations, and any case where you need to read data before writing it safely.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Understand the last-write-wins conflict model</li>
                                <li>Use runTransaction for atomic read-modify-write operations</li>
                                <li>Implement distributed counters and financial operations safely</li>
                            </ul>
                        </div>

                        <h2>Conflict Resolution</h2>
                        <p>When multiple users edit the same document simultaneously, Firestore uses <strong>last-write-wins</strong>. For critical operations, use <strong>transactions</strong>.</p>
                        
                        <h3>Basic Transaction</h3>
                        <pre><code>import { runTransaction, doc } from "firebase/firestore";

try {
  await runTransaction(db, async (transaction) => {
    const docRef = doc(db, "counters", "pageViews");
    const docSnap = await transaction.get(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Counter document does not exist!");
    }
    
    const newCount = docSnap.data().count + 1;
    transaction.update(docRef, { count: newCount });
  });
  
  console.log("Transaction completed!");
} catch (error) {
  console.error("Transaction failed:", error);
}</code></pre>

                        <h3>When to Use Transactions</h3>
                        <ul>
                            <li><strong>Counters</strong> — Like counting page views or likes</li>
                            <li><strong>Financial operations</strong> — Checking balance before withdrawal</li>
                            <li><strong>Inventory</strong> — Checking stock before order</li>
                            <li><strong>Reservations</strong> — Ensuring a seat isn't double-booked</li>
                        </ul>

                        <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg my-6">
                            <p class="text-orange-800 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i><strong>Note:</strong> Transactions may retry if another client modifies the data between read and write. Keep transaction logic simple to avoid excessive retries!</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Transactions (<code>runTransaction</code>) provide atomic read-modify-write operations. Use them for counters, financial operations, and any case where you need to read data before writing it safely. Transactions may retry if conflicts occur.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Simulate a transaction (distributed counter)
console.log("=== Transaction Simulation ===");

let likeCounter = 42;

function simulateTransaction(currentValue, increment) {
  return new Promise((resolve) => {
    console.log("Reading current count:", currentValue);
    console.log("Adding:", increment);
    
    // Inside transaction
    const newValue = currentValue + increment;
    console.log("New count:", newValue);
    console.log("✓ Transaction committed!");
    
    resolve(newValue);
  });
}

// Multiple concurrent likes
console.log("User A likes post (concurrent with User B)");
simulateTransaction(likeCounter, 1).then(val => likeCounter = val);

setTimeout(async () => {
  console.log("\nUser B likes post (concurrent with User A)");
  likeCounter = await simulateTransaction(likeCounter, 1);
  console.log("\nFinal count:", likeCounter, "likes");
}, 100);`,
      },
    ],
    quiz: [
      {
        id: 'q9-1',
        question: 'Which function enables offline persistence in Firestore for web?',
        options: [
          'enableOffline(db)',
          'enableMultiTabIndexedDbPersistence(db)',
          'enablePersistence(db)',
          'firestore.enableOffline()',
        ],
        correct: 1,
      },
      {
        id: 'q9-2',
        question: 'What is Firestore\'s default conflict resolution strategy?',
        options: [
          'First write wins',
          'Last write wins',
          'Merge automatically',
          'Prompt user to resolve',
        ],
        correct: 1,
      },
      {
        id: 'q9-3',
        question: 'What type of operations require a transaction?',
        options: [
          'Reading a single document',
          'Read-modify-write operations where consistency matters',
          'Deleting multiple documents',
          'Listening to real-time changes',
        ],
        correct: 1,
      },
      {
        id: 'q9-4',
        question: 'How can you tell if data was returned from the local cache?',
        options: [
          'Check snapshot.metadata.fromCache',
          'Check if snapshot.data() returns undefined',
          'Use snapshot.isCached()',
          'Compare timestamps',
        ],
        correct: 0,
      },
      {
        id: 'q9-5',
        question: 'What error code indicates multi-tab persistence is already active?',
        options: [
          'already-exists',
          'failed-precondition',
          'unimplemented',
          'permission-denied',
        ],
        correct: 1,
      },
    ],
  },

  // ─── Module 10: Choosing a Database ───
  {
    id: 'mod-10',
    title: 'Choosing a Database',
    lessons: [
      {
        id: 'm10-l1',
        title: 'Firestore vs Realtime Database',
        objectives: [
          'Compare Firestore and Realtime Database data models',
          'Understand the querying capabilities of each database',
          'Evaluate scalability and pricing differences',
        ],
        takeaway: 'Firestore is recommended for most new projects with its powerful queries, automatic scaling, and rich data model. Realtime Database excels at ultra-low-latency sync.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Compare Firestore and Realtime Database data models</li>
                                <li>Understand the querying capabilities of each database</li>
                                <li>Evaluate scalability and pricing differences</li>
                            </ul>
                        </div>

                        <h2>Firestore vs Realtime Database</h2>
                        <p>Firebase offers two databases, each with different strengths. Here's a detailed comparison:</p>

                        <table class="w-full border-collapse mb-6">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="border p-2 text-left">Feature</th>
                                    <th class="border p-2 text-left">Cloud Firestore</th>
                                    <th class="border p-2 text-left">Realtime Database</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="border p-2 font-medium">Data Model</td>
                                    <td class="border p-2">Collections → Documents → Fields</td>
                                    <td class="border p-2">Single JSON tree</td>
                                </tr>
                                <tr>
                                    <td class="border p-2 font-medium">Queries</td>
                                    <td class="border p-2">Powerful: compound filters, sorting, pagination</td>
                                    <td class="border p-2">Basic: filter by one field, shallow queries</td>
                                </tr>
                                <tr>
                                    <td class="border p-2 font-medium">Scaling</td>
                                    <td class="border p-2">Automatic, massive scale</td>
                                    <td class="border p-2">Manual sharding for large datasets</td>
                                </tr>
                                <tr>
                                    <td class="border p-2 font-medium">Real-time</td>
                                    <td class="border p-2">Yes (onSnapshot, multi-region)</td>
                                    <td class="border p-2">Yes (native, ultra-low latency)</td>
                                </tr>
                                <tr>
                                    <td class="border p-2 font-medium">Offline</td>
                                    <td class="border p-2">Excellent multi-tab persistence</td>
                                    <td class="border p-2">Good (single-tab persistence)</td>
                                </tr>
                                <tr>
                                    <td class="border p-2 font-medium">Security</td>
                                    <td class="border p-2">Declarative rules with granular access</td>
                                    <td class="border p-2">Rules based on JSON path matching</td>
                                </tr>
                                <tr>
                                    <td class="border p-2 font-medium">Pricing</td>
                                    <td class="border p-2">Per operation (read/write/delete)</td>
                                    <td class="border p-2">Per bandwidth/storage</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg my-6">
                            <p class="text-blue-800 text-sm"><i class="fas fa-lightbulb mr-2"></i><strong>Rule of thumb:</strong> For new projects, start with Firestore. It's more powerful, more scalable, and has a better query system. Only use Realtime Database if you need ultra-low latency real-time features.</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Firestore is recommended for most new projects with its powerful queries, automatic scaling, and rich data model. Realtime Database excels at ultra-low-latency sync and is simpler for small datasets.</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Database comparison demo
console.log("=== Database Selection Guide ===");

console.log("\nYour app needs:");
const requirements = {
  complexQueries: true,
  realtimeSync: true,
  offlineSupport: true,
  massiveScale: false,
  lowLatency: true
};
console.log(JSON.stringify(requirements, null, 2));

console.log("\nRecommendation:");
if (requirements.complexQueries) {
  console.log("✓ Choose Firestore — needs complex queries");
} else if (requirements.lowLatency && !requirements.complexQueries) {
  console.log("→ Consider Realtime Database — ultra low latency");
}
console.log("→ Both can be used together!");`,
      },
      {
        id: 'm10-l2',
        title: 'Use Cases & Best Practices',
        objectives: [
          'Identify best-fit use cases for each Firebase database',
          'Learn how to use both databases together in one app',
          'Apply best practices for data modeling and security',
        ],
        takeaway: 'Match the database to your use case: Firestore for structured, queryable data; Realtime DB for presence and low-latency sync. Using both is a valid and common pattern.',
        content: `
                    <div class="lesson-prose">
                        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
                            <h4 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-bullseye mr-2"></i>Learning Objectives</h4>
                            <ul class="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                                <li>Identify best-fit use cases for each Firebase database</li>
                                <li>Learn how to use both databases together in one app</li>
                                <li>Apply best practices for data modeling and security</li>
                            </ul>
                        </div>

                        <h2>Use Cases & Best Practices</h2>
                        
                        <h3>Firestore Use Cases</h3>
                        <ul>
                            <li><strong>User profiles</strong> — Structured, queryable, need complex security rules</li>
                            <li><strong>Product catalogs</strong> — Need filtering, sorting, and pagination</li>
                            <li><strong>Blog/CMS</strong> — Rich content with categories and tags</li>
                            <li><strong>Analytics dashboards</strong> — Aggregated data with subcollections</li>
                            <li><strong>Multi-player game state</strong> — When you need queries on game data</li>
                        </ul>

                        <h3>Realtime Database Use Cases</h3>
                        <ul>
                            <li><strong>Presence indicators</strong> — Show who's online (built-in onDisconnect)</li>
                            <li><strong>Chat apps</strong> — Simple, fast message delivery</li>
                            <li><strong>Typing indicators</strong> — "User is typing..." notifications</li>
                            <li><strong>Real-time cursors</strong> — Show where other users are on screen</li>
                        </ul>

                        <h3>Using Both Together (Best Practice)</h3>
                        <p>Many production apps use BOTH databases! Example:</p>
                        <ul>
                            <li><strong>Firestore:</strong> User profiles, posts, comments (structured, queryable)</li>
                            <li><strong>Realtime DB:</strong> Who's online, typing indicators, live cursors (transient, high-frequency updates)</li>
                        </ul>

                        <div class="bg-purple-50 border border-purple-200 p-4 rounded-lg my-6">
                            <p class="text-purple-800 text-sm"><i class="fas fa-rocket mr-2"></i><strong>Pro Architecture:</strong> Use Realtime Database for ephemeral, high-frequency data (presence, typing). Use Firestore for persistent, structured data that needs querying. This way you get the best of both worlds!</p>
                        </div>

                        <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-6 rounded-r-lg">
                            <h4 class="font-semibold text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Key Takeaway</h4>
                            <p class="text-green-700 text-sm">Match the database to your use case: Firestore for structured, queryable data; Realtime DB for presence and low-latency sync. Using both together is a valid and common production pattern!</p>
                        </div>
                    </div>
                `,
        defaultCode: `// Architecture planning demo
console.log("=== Firebase Architecture Planner ===");

const appDesign = {
  features: [
    { name: "User Profiles", db: "Firestore", why: "Structured, needs queries" },
    { name: "News Feed", db: "Firestore", why: "Filtering & pagination" },
    { name: "Online Status", db: "Realtime DB", why: "Presence & onDisconnect" },
    { name: "Live Chat", db: "Realtime DB", why: "Ultra low latency" },
    { name: "Search", db: "Firestore + Algolia", why: "Full-text search" }
  ]
};

console.log("Hybrid Architecture Plan:");
appDesign.features.forEach(f => {
  console.log("  📍", f.name, "→", f.db);
  console.log("     Reason:", f.why);
});

console.log("\n✓ Best of both worlds!");`,
      },
    ],
    quiz: [
      {
        id: 'q10-1',
        question: 'Which Firebase database is best for complex queries with filtering and sorting?',
        options: [
          'Realtime Database',
          'Cloud Firestore',
          'Both are equally good',
          'Neither',
        ],
        correct: 1,
      },
      {
        id: 'q10-2',
        question: 'Which database has built-in onDisconnect support for presence detection?',
        options: [
          'Cloud Firestore',
          'Realtime Database',
          'Both',
          'Neither (must use Cloud Functions)',
        ],
        correct: 1,
      },
      {
        id: 'q10-3',
        question: 'Can you use both Firestore and Realtime Database in the same project?',
        options: [
          'No, you must choose one',
          'Yes, many production apps use both',
          'Yes, but it doubles the cost',
          'Only on the Blaze plan',
        ],
        correct: 1,
      },
      {
        id: 'q10-4',
        question: 'Which database uses Collections → Documents → Fields as its data model?',
        options: [
          'Realtime Database (JSON tree)',
          'Cloud Firestore',
          'Both use the same model',
          'MySQL',
        ],
        correct: 1,
      },
      {
        id: 'q10-5',
        question: 'What is Firestore\'s pricing model based on?',
        options: [
          'Storage size only',
          'Bandwidth only',
          'Number of read/write/delete operations',
          'Number of collections',
        ],
        correct: 2,
      },
    ],
  },
];

// DOM Elements
const elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  firebaseEditor: document.getElementById('firebase-editor'),
  runCodeBtn: document.getElementById('run-code-btn'),
  editorConsole: document.getElementById('editor-console'),
  appUiState: document.getElementById('app-ui-state'),
  fsCollections: document.getElementById('fs-collections'),
  fsDocuments: document.getElementById('fs-documents'),
  fsFields: document.getElementById('fs-fields'),
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
  renderFirestoreConsole();
  renderAppUI();
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

  // Delegated click for sidebar lesson buttons
  elements.sidebarContent.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-module]');
    if (btn) {
      loadLesson(parseInt(btn.dataset.module), parseInt(btn.dataset.lesson));
    }
  });

  // Mobile sidebar toggle
  elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
  elements.sidebarOverlay.addEventListener('click', toggleSidebar);

  // Quiz answer delegation
  elements.quizContent.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-quiz-id]');
    if (btn) {
      checkAnswer(btn.dataset.quizId, parseInt(btn.dataset.module), parseInt(btn.dataset.option));
    }
  });

  // Mock logout delegation
  elements.appUiState.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-mock-logout]');
    if (btn) {
      mockLogout();
    }
  });

  // Firestore collection selection
  elements.fsCollections.addEventListener('click', (e) => {
    const el = e.target.closest('[data-collection]');
    if (el) {
      selectCollection(el.dataset.collection);
    }
  });

  // Firestore document selection
  elements.fsDocuments.addEventListener('click', (e) => {
    const el = e.target.closest('[data-document]');
    if (el) {
      selectDocument(el.dataset.document);
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
  // Update buttons UI
  elements.tabBtns.forEach((btn) => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'border-yellow-500', 'text-yellow-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-yellow-500', 'text-yellow-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  // Update panes UI
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
                        <i class="${isCompleted ? 'fas fa-check-circle text-green-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
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
  const lesson = curriculum[mIndex].lessons[lIndex];

  if (!userProgress.completedLessons.includes(lesson.id)) {
    markLessonComplete(lesson.id);
  }

  const eli5Content = window.eli5FirebaseData && window.eli5FirebaseData[lesson.id] ? window.eli5FirebaseData[lesson.id] : '';
  elements.lessonContent.innerHTML = (window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, eli5Content) : lesson.content);
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('firebase', elements.lessonContent);
  }
  elements.firebaseEditor.value = lesson.defaultCode || '';
  copyCode.init(elements.lessonContent);

  // Clear editor console
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
            <div class="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-100 quiz-question" id="q-container-${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
                <div class="space-y-2">
        `;

    q.options.forEach((opt, oIndex) => {
      html += `
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-yellow-600">
                    <span class="text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `
                </div>
                <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
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
    feedback.className = 'mt-3 text-sm font-medium text-green-600 block';
    container.classList.replace('bg-yellow-50', 'bg-green-50');
    container.classList.replace('border-yellow-100', 'border-green-200');

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
  localStorage.setItem('firebaseHubProgress', JSON.stringify(userProgress));
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
// Firebase Simulator Engine
// ----------------------------------------------------

function runSimulation() {
  const code = elements.firebaseEditor.value;
  elements.editorConsole.innerHTML = '';
  elements.editorConsole.classList.add('hidden');

  // Create mock functions to inject into the user's execution scope
  const setDoc = (collectionPath, documentId, data) => {
    if (!mockFirestore[collectionPath]) {
      mockFirestore[collectionPath] = {};
    }
    mockFirestore[collectionPath][documentId] = data;

    // Auto-select to show the change
    selectedCollection = collectionPath;
    selectedDocument = documentId;

    // Trigger UI updates
    renderFirestoreConsole();
    flashElement(document.querySelector('.firestore-console'));
    logToConsole(`Success: Document '${documentId}' written to '${collectionPath}'`, 'success');
  };

  const addDoc = (collectionPath, data) => {
    if (!mockFirestore[collectionPath]) {
      mockFirestore[collectionPath] = {};
    }
    // Generate random ID
    const autoId =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    mockFirestore[collectionPath][autoId] = data;

    selectedCollection = collectionPath;
    selectedDocument = autoId;

    renderFirestoreConsole();
    flashElement(document.querySelector('.firestore-console'));
    logToConsole(`Success: Document added with auto-ID '${autoId}'`, 'success');
    return { id: autoId }; // mock docRef
  };

  const signInWithEmailAndPassword = (email, password) => {
    return new Promise((resolve, reject) => {
      if (email && password.length >= 6) {
        mockAuthState.currentUser = {
          uid: 'simulated_user_123',
          email: email,
          displayName: email.split('@')[0],
        };
        renderAppUI();
        flashElement(document.querySelector('.app-ui-container'));
        logToConsole(`Auth Success: Logged in as ${email}`, 'success');
        resolve(mockAuthState.currentUser);
      } else {
        reject(new Error('auth/weak-password or missing email'));
      }
    });
  };

  const logToConsole = (msg, type = 'log') => {
    elements.editorConsole.classList.remove('hidden');
    const colorClass =
      type === 'error' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-gray-700';
    elements.editorConsole.innerHTML += `<div class="${colorClass} mb-1">> ${msg}</div>`;
  };

  // Override console.log within execution scope
  const mockConsole = {
    log: (...args) => logToConsole(args.join(' ')),
    error: (...args) => logToConsole(args.join(' '), 'error'),
    warn: (...args) => logToConsole(args.join(' '), 'error'),
  };

  try {
    // We use new Function to create an execution scope with our injected mocks
    // Note: We avoid 'import' syntax in the textarea by keeping the code simple in lessons,
    // or we strip them out via regex before execution.
    let executableCode = code.replace(/import .*;?\n/g, ''); // strip imports for the simulator

    const executionScope = new Function(
      'setDoc',
      'addDoc',
      'signInWithEmailAndPassword',
      'console',
      executableCode
    );
    executionScope(setDoc, addDoc, signInWithEmailAndPassword, mockConsole);
  } catch (err) {
    logToConsole(`Execution Error: ${err.message}`, 'error');
  }
}

// Visual feedback helper
function flashElement(el) {
  el.classList.remove('flash-update');
  void el.offsetWidth; // trigger reflow
  el.classList.add('flash-update');
}

// ----------------------------------------------------
// UI Rendering for Simulator
// ----------------------------------------------------

function renderAppUI() {
  if (mockAuthState.currentUser) {
    elements.appUiState.innerHTML = `
            <div class="relative inline-block mb-4">
                <i class="fas fa-user-circle text-6xl text-blue-500"></i>
                <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <h3 class="text-xl font-semibold text-gray-800">Welcome back,</h3>
            <h2 class="text-2xl font-bold text-blue-600 truncate max-w-[200px]">${mockAuthState.currentUser.displayName}</h2>
            <p class="text-gray-500 mt-2 text-sm">${mockAuthState.currentUser.email}</p>
            <button data-mock-logout class="mt-4 px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">Sign Out</button>
        `;
  } else {
    elements.appUiState.innerHTML = `
            <i class="fas fa-user-circle text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-700">Not Logged In</h3>
            <p class="text-gray-500 mt-2 text-sm">Run Firebase Auth code to sign in.</p>
        `;
  }
}

window.mockLogout = function () {
  mockAuthState.currentUser = null;
  renderAppUI();
  flashElement(document.querySelector('.app-ui-container'));
};

function renderFirestoreConsole() {
  // 1. Render Collections
  const collections = Object.keys(mockFirestore);
  let colHtml = '';
  collections.forEach((col) => {
    const isSel = col === selectedCollection;
    colHtml += `
            <div class="fs-item ${isSel ? 'selected' : ''}" data-collection="${col}">
                <i class="fas fa-layer-group fs-icon"></i> ${col}
            </div>
        `;
  });
  elements.fsCollections.innerHTML =
    colHtml || '<div class="text-gray-500 text-xs italic text-center mt-4">No collections</div>';

  // 2. Render Documents (if a collection is selected)
  if (selectedCollection && mockFirestore[selectedCollection]) {
    const docs = Object.keys(mockFirestore[selectedCollection]);
    let docHtml = '';
    docs.forEach((doc) => {
      const isSel = doc === selectedDocument;
      docHtml += `
                <div class="fs-item ${isSel ? 'selected' : ''}" data-document="${doc}">
                    <i class="far fa-file-alt fs-icon text-blue-400"></i> ${doc}
                </div>
            `;
    });
    elements.fsDocuments.innerHTML =
      docHtml || '<div class="text-gray-500 text-xs italic text-center mt-4">No documents</div>';
  } else {
    elements.fsDocuments.innerHTML =
      '<div class="text-gray-500 text-xs italic text-center mt-4">Select a collection</div>';
  }

  // 3. Render Fields (if a document is selected)
  if (
    selectedCollection &&
    selectedDocument &&
    mockFirestore[selectedCollection][selectedDocument]
  ) {
    const data = mockFirestore[selectedCollection][selectedDocument];
    let fieldsHtml = '';
    for (const [key, value] of Object.entries(data)) {
      let type = typeof value;
      let displayVal = value;
      let valClass = 'string';

      if (type === 'string') displayVal = `"${value}"`;
      if (type === 'number') valClass = 'number';
      if (type === 'boolean') valClass = 'boolean';

      fieldsHtml += `
                <div class="fs-field-row">
                    <span class="fs-field-key">${key}</span>
                    <span class="fs-field-type">(${type})</span>
                    <span class="fs-field-value ${valClass}">${displayVal}</span>
                </div>
            `;
    }
    elements.fsFields.innerHTML =
      fieldsHtml ||
      '<div class="text-gray-500 text-xs italic text-center mt-4">Empty document</div>';
  } else {
    elements.fsFields.innerHTML =
      '<div class="text-gray-500 text-xs italic text-center mt-4">Select a document</div>';
  }
}

window.selectCollection = function (colName) {
  selectedCollection = colName;
  selectedDocument = null; // reset doc selection
  renderFirestoreConsole();
};

window.selectDocument = function (docId) {
  selectedDocument = docId;
  renderFirestoreConsole();
};

// Run init on load
document.addEventListener('DOMContentLoaded', init);
