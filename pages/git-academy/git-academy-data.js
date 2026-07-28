/**
 * git-academy-data.js
 * Curriculum data for the Git & GitHub Academy — 8 modules.
 * Each module has 2-3 lessons, 5 quiz questions, and exercises.
 */

const curriculum = [
  // ═══════════════════════════════════════════════
  // Module 1: Git Basics
  // ═══════════════════════════════════════════════
  {
    id: 'mod-1',
    title: 'Git Basics',
    lessons: [
      {
        id: 'm1-l1',
        title: 'What is Git?',
        objectives: [
          'Understand what version control is and why it matters',
          'Learn how Git differs from other VCS tools',
          'Understand the three states: modified, staged, committed',
          'Set up Git for the first time with config',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Introduction to Version Control with Git</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Git is a <strong>distributed version control system</strong> that tracks changes in your files over time. It's like a time machine for your code — you can travel back and forth through your project's history.</p>

          <p class="mb-4 text-gray-700 leading-relaxed">Unlike older systems like SVN or CVS, Git is <strong>distributed</strong>. Every developer has the complete repository on their machine, not just the latest snapshot. This means you can work offline, commit locally, and sync when ready.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The Three States</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Files in a Git repository can be in one of three states:</p>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Modified</strong> — You changed the file but haven't staged it yet.</li>
            <li><strong>Staged</strong> — You marked the file's current version to go into your next commit.</li>
            <li><strong>Committed</strong> — The file's changes are safely stored in Git's database.</li>
          </ul>

          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># First-time setup — identify yourself
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Check your configuration
git config --list

# Initialize a new repository
git init

# Check the status of your files
git status</code></pre>

          <div class="bg-orange-50 border-l-4 border-orange-500 p-4 my-6 rounded-r-lg">
            <p class="text-orange-800"><strong>💡 Tip:</strong> Your name and email are attached to every commit you make. They don't need to match your GitHub account — but it's easier to keep them consistent!</p>
          </div>
        `,
        defaultCommands: [
          'git init',
          'git status',
          'git config --list',
        ],
        takeaways: [
          'Git is a distributed version control system — every developer has the full history locally',
          'Files move through three states: modified → staged → committed',
          'git init creates a new Git repository in the current directory',
          'git config --global sets your identity for commits',
          'git status shows the current state of your working directory and staging area',
        ],
      },
      {
        id: 'm1-l2',
        title: 'Your First Commit',
        objectives: [
          'Create and track files with git add',
          'Commit changes with descriptive messages',
          'Understand the staging area workflow',
          'View commit history with git log',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Making Your First Commit</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">The core Git workflow is simple: <strong>create files → stage changes → commit</strong>. Think of it like taking a photograph: staging is setting up the shot, committing is pressing the shutter.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The Commit Workflow</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Create a new file
echo "# My Project" > README.md

# Stage the file (add to the "photo")
git add README.md

# Or stage all changes at once
git add .

# Commit with a message
git commit -m "Initial commit: add README"

# View the commit history
git log

# See a compact one-line log
git log --oneline</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Writing Good Commit Messages</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Keep it short</strong> — 50 characters or less for the summary line</li>
            <li><strong>Use imperative mood</strong> — "Add feature" not "Added feature" or "Adding feature"</li>
            <li><strong>Explain why</strong> — Not what the code does (that's obvious), but why it was done</li>
          </ul>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>✅ Good:</strong> "Fix login redirect on expired session" vs <strong>❌ Bad:</strong> "Fixed stuff"</p>
          </div>
        `,
        defaultCommands: [
          'echo "# My First Repo" > README.md',
          'git add README.md',
          'git commit -m "Initial commit: add README"',
          'git log --oneline',
        ],
        takeaways: [
          'git add moves changes from the working directory to the staging area',
          'git commit takes a snapshot of the staging area with a message',
          'Commit messages should be imperative and descriptive (50-char summary)',
          'git log shows the commit history; git log --oneline shows a compact view',
          'The staging area lets you group related changes before committing',
        ],
      },
      {
        id: 'm1-l3',
        title: 'Tracking Changes',
        objectives: [
          'Understand the difference between tracked and untracked files',
          'Use git diff to see unstaged and staged changes',
          'Stage changes incrementally with git add -p',
          'Use .gitignore to exclude files from tracking',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Tracking Changes Like a Pro</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Git classifies files into <strong>tracked</strong> (those Git knows about) and <strong>untracked</strong> (new files Git hasn't seen). Tracked files can be unmodified, modified, or staged.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Seeing Changes</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># See unstaged changes (working tree vs staging area)
git diff

# See staged changes (staging area vs last commit)
git diff --staged

# Interactively stage parts of a file
git add -p</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Ignoring Files</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Create a <code>.gitignore</code> file to tell Git which files to never track (like build artifacts, dependencies, and environment files):</p>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># .gitignore example
node_modules/
.env
*.log
dist/
.DS_Store</code></pre>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>📌 Note:</strong> .gitignore only affects untracked files. If a file is already tracked, adding it to .gitignore won't stop Git from tracking it. Use <code>git rm --cached</code> to untrack it first.</p>
          </div>
        `,
        defaultCommands: [
          'echo "node_modules/" > .gitignore',
          'echo ".env" >> .gitignore',
          'git add .gitignore',
          'git commit -m "Add .gitignore"',
        ],
        takeaways: [
          'Tracked files are known to Git; untracked files are not (until you add them)',
          'git diff shows unstaged changes; git diff --staged shows staged changes',
          'git add -p lets you stage changes interactively, hunk by hunk',
          '.gitignore prevents unwanted files from ever being tracked',
          'Already-tracked files are not affected by .gitignore',
        ],
      },
    ],
    quiz: [
      {
        id: 'm1-q1',
        question: 'What are the three states a file can be in within a Git repository?',
        options: [
          'Draft, Review, Published',
          'Modified, Staged, Committed',
          'New, Active, Archived',
          'Local, Remote, Branch',
        ],
        correct: 1,
      },
      {
        id: 'm1-q2',
        question: 'Which command initializes a new Git repository?',
        options: ['git start', 'git new', 'git init', 'git create'],
        correct: 2,
      },
      {
        id: 'm1-q3',
        question: 'What does the staging area allow you to do?',
        options: [
          'Permanently delete files',
          'Group related changes before committing them',
          'Merge two branches together',
          'Push code to a remote server',
        ],
        correct: 1,
      },
      {
        id: 'm1-q4',
        question: 'Which command shows unstaged changes in tracked files?',
        options: ['git status', 'git log', 'git diff', 'git show'],
        correct: 2,
      },
      {
        id: 'm1-q5',
        question: 'What is the purpose of a .gitignore file?',
        options: [
          'To list all the files Git should track',
          'To specify intentionally untracked files that Git should ignore',
          'To configure Git user settings',
          'To store backup copies of important files',
        ],
        correct: 1,
      },
    ],
    exercises: [
      {
        title: 'Initialize and Configure',
        description: 'Initialize a new Git repository, set your user name and email, and verify with git config --list.',
        defaultCommands: ['git init', 'git config user.name "Student"', 'git config user.email "student@example.com"', 'git config --list'],
      },
      {
        title: 'First Commit Chain',
        description: 'Create a README.md, a .gitignore (ignore .log files), stage both, and commit. Then make a second change and commit again.',
        defaultCommands: ['echo "# My Project" > README.md', 'echo "*.log" > .gitignore', 'git add .', 'git commit -m "Initial setup"', 'echo "Hello" >> README.md', 'git add .', 'git commit -m "Add welcome message"'],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 2: Branching & Merging
  // ═══════════════════════════════════════════════
  {
    id: 'mod-2',
    title: 'Branching & Merging',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Understanding Branches',
        objectives: [
          'Understand what branches are and why they are essential',
          'Create, switch, and delete branches',
          'View all branches and see which one is active',
          'Understand HEAD and how it tracks the current branch',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Branches — Your Parallel Universes</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">A branch in Git is a <strong>lightweight movable pointer</strong> to a specific commit. Creating a new branch is nearly instantaneous — no copying files, no server requests. It's one of Git's superpowers.</p>

          <p class="mb-4 text-gray-700 leading-relaxed">Think of branches as <strong>parallel universes</strong> for your code. You can experiment freely in one branch without affecting the main branch. When your experiment works, you merge it back.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Branch Commands</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># List all branches (* marks the active one)
git branch

# Create a new branch
git branch feature-login

# Switch to a branch
git checkout feature-login

# Create and switch in one command (Git 2.23+)
git switch -c feature-login

# Delete a branch (after merging)
git branch -d feature-login

# Force delete (discard unmerged work)
git branch -D feature-login</code></pre>

          <div class="bg-orange-50 border-l-4 border-orange-500 p-4 my-6 rounded-r-lg">
            <p class="text-orange-800"><strong>💡 Tip:</strong> The default branch is named <code>main</code> (historically <code>master</code>). In modern Git, you can rename it: <code>git branch -m master main</code>.</p>
          </div>
        `,
        defaultCommands: [
          'git branch',
          'git branch feature-1',
          'git checkout feature-1',
          'git branch',
        ],
        takeaways: [
          'A branch is just a pointer to a commit — creating one is instant and cheap',
          'git branch lists branches; * marks your current branch',
          'git checkout switches branches; git switch is the newer, safer alternative',
          'Always branch off from a clean working state (no uncommitted changes)',
          'Delete merged branches with git branch -d; force-delete with -D for unmerged work',
        ],
      },
      {
        id: 'm2-l2',
        title: 'Merging Branches',
        objectives: [
          'Merge branches with git merge',
          'Understand fast-forward vs three-way merges',
          'Resolve merge conflicts manually',
          'Use merge tools to resolve conflicts',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Merging — Bringing Changes Together</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Once you've finished working on a branch, you'll want to bring those changes back into the main branch. This is called <strong>merging</strong>.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Types of Merges</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Fast-forward merge</strong> — The branch has not diverged. Git simply moves the pointer forward. No merge commit is created.</li>
            <li><strong>Three-way merge</strong> — Branches have diverged. Git creates a merge commit with two parents.</li>
          </ul>

          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Switch to the branch you want to merge INTO
git checkout main

# Merge the feature branch
git merge feature-login

# Merge without fast-forward (always creates a merge commit)
git merge --no-ff feature-login

# Abort a merge if there are conflicts
git merge --abort</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Handling Merge Conflicts</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">When two branches modify the same part of a file, Git can't automatically merge them. You'll see conflict markers like this:</p>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code><<<<<<< HEAD
This is the current branch's version
=======
This is the incoming branch's version
>>>>>>> feature-login</code></pre>
          <p class="mb-4 text-gray-700 leading-relaxed">To resolve: edit the file to keep the correct version(s), remove the conflict markers, then commit.</p>

          <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
            <p class="text-red-800"><strong>⚠️ Tip:</strong> Conflicts aren't failures! They're Git telling you, "I need your human judgment to decide which version is correct." Always test the resolved code before committing.</p>
          </div>
        `,
        defaultCommands: [
          'git checkout -b feature-update',
          'echo "Updated content" >> README.md',
          'git add .',
          'git commit -m "Update README on feature branch"',
          'git checkout main',
          'git merge feature-update',
        ],
        takeaways: [
          'git merge combines changes from one branch into another',
          'Fast-forward merges happen when branches haven\'t diverged (no merge commit)',
          'Three-way merges create a merge commit with two parents',
          'Merge conflicts occur when the same part of a file is modified on both branches',
          'Resolve conflicts by editing files, removing markers, then committing the resolution',
        ],
      },
      {
        id: 'm2-l3',
        title: 'Branching Strategies',
        objectives: [
          'Understand common branching strategies (Git Flow, GitHub Flow)',
          'Learn when to create short-lived vs long-lived branches',
          'Apply naming conventions for branches',
          'Understand the role of main/master as the stable branch',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Branching Strategies in Practice</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">While Git allows any branching pattern, real teams use structured strategies. The two most common are <strong>Git Flow</strong> and <strong>GitHub Flow</strong>.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">GitHub Flow (Simple)</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li>Anything in <code>main</code> is deployable at all times</li>
            <li>Create a branch from <code>main</code> for each feature or fix</li>
            <li>Open a Pull Request early for discussion</li>
            <li>Merge back to <code>main</code> after review and tests pass</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Git Flow (Complex)</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><code>main</code> — production-ready code only</li>
            <li><code>develop</code> — integration branch for features</li>
            <li><code>feature/*</code> — individual features, branch from <code>develop</code></li>
            <li><code>release/*</code> — preparing a new release</li>
            <li><code>hotfix/*</code> — urgent production fixes, branch from <code>main</code></li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Branch Naming Conventions</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>feature/add-user-authentication
bugfix/fix-login-redirect
hotfix/critical-security-patch
release/v2.1.0
chore/update-dependencies</code></pre>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>📌 Recommendation:</strong> For most projects, start with GitHub Flow. It's simpler and works well with CI/CD. Only adopt Git Flow if you need strict release management.</p>
          </div>
        `,
        defaultCommands: [
          'git checkout -b feature/add-docs',
          'git branch',
        ],
        takeaways: [
          'GitHub Flow is simple: branch from main, commit, PR, merge back to main',
          'Git Flow uses multiple branch types: main, develop, feature, release, hotfix',
          'Consistent branch naming (feature/, bugfix/, hotfix/) keeps repos organized',
          'Short-lived branches (days) are better than long-lived branches (weeks)',
          'Keep main stable and deployable at all times',
        ],
      },
    ],
    quiz: [
      {
        id: 'm2-q1',
        question: 'What is a branch in Git?',
        options: [
          'A copy of the entire repository',
          'A lightweight movable pointer to a commit',
          'A separate Git installation',
          'A backup of your working directory',
        ],
        correct: 1,
      },
      {
        id: 'm2-q2',
        question: 'Which command creates a new branch AND switches to it?',
        options: ['git branch new-branch', 'git checkout -b new-branch', 'git switch new-branch', 'git new-branch new-branch'],
        correct: 1,
      },
      {
        id: 'm2-q3',
        question: 'What happens during a fast-forward merge?',
        options: [
          'Git creates a merge commit with two parents',
          'Git simply moves the branch pointer forward (no merge commit)',
          'Git deletes the source branch automatically',
          'Git creates a backup before merging',
        ],
        correct: 1,
      },
      {
        id: 'm2-q4',
        question: 'What do <<<<<<< and >>>>>>> markers indicate in a file?',
        options: [
          'The file is corrupted',
          'A merge conflict that needs manual resolution',
          'The file was deleted',
          'A syntax error in the code',
        ],
        correct: 1,
      },
      {
        id: 'm2-q5',
        question: 'Which branch naming convention is best for a new feature?',
        options: ['bugfix/fix-typo', 'feature/add-user-authentication', 'hotfix/critical-patch', 'chore/update-deps'],
        correct: 1,
      },
    ],
    exercises: [
      {
        title: 'Branch, Edit, Merge',
        description: 'Create a feature branch, make changes, commit, switch back to main, and merge the feature branch.',
        defaultCommands: ['git checkout -b feature/greeting', 'echo "Hello from feature!" > greeting.txt', 'git add greeting.txt', 'git commit -m "Add greeting file"', 'git checkout main', 'git merge feature/greeting'],
      },
      {
        title: 'Simulate a Conflict',
        description: 'Create two branches that both modify the same line, then merge them to trigger and resolve a conflict.',
        defaultCommands: ['echo "Line 1" > conflict.txt', 'git add conflict.txt', 'git commit -m "Base file"', 'git checkout -b branch-a', 'echo "Branch A change" > conflict.txt', 'git add .', 'git commit -m "Branch A modification"', 'git checkout main', 'git checkout -b branch-b', 'echo "Branch B change" > conflict.txt', 'git add .', 'git commit -m "Branch B modification"'],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 3: Remote & Collaboration
  // ═══════════════════════════════════════════════
  {
    id: 'mod-3',
    title: 'Remote & Collaboration',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Working with Remotes',
        objectives: [
          'Understand what a remote repository is',
          'Clone a remote repository',
          'Add and manage remote connections',
          'View remote URLs and information',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Connecting to Remote Repositories</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">A <strong>remote</strong> is a Git repository hosted on another computer (often a server like GitHub, GitLab, or Bitbucket). Remotes enable collaboration — multiple people can push and pull changes.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Working with Remotes</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Clone a remote repository
git clone https://github.com/user/repo.git

# Add a remote to an existing local repository
git remote add origin https://github.com/user/repo.git

# View remote connections
git remote -v

# Rename a remote
git remote rename origin upstream

# Remove a remote
git remote remove upstream

# Get detailed info about a remote
git remote show origin</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The "origin" Convention</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">By convention, the primary remote is named <code>origin</code>. This is automatic when you clone — Git sets the source URL as origin. You can have multiple remotes (e.g., <code>origin</code> for your fork, <code>upstream</code> for the original repo).</p>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>⚠️ Protocol Choice:</strong> HTTPS (<code>https://...</code>) is simpler for beginners — Git will prompt for credentials. SSH (<code>git@...</code>) requires key setup but is more secure for automation.</p>
          </div>
        `,
        defaultCommands: [
          'git remote -v',
          'git remote add origin https://github.com/student/my-project.git',
          'git remote show origin',
        ],
        takeaways: [
          'A remote is a Git repository hosted on another computer or server',
          'git clone downloads a remote repo and sets up origin automatically',
          'git remote add connects your local repo to a remote',
          'You can have multiple remotes (e.g., origin and upstream)',
          'git remote -v lists all remote URLs (fetch and push)',
        ],
      },
      {
        id: 'm3-l2',
        title: 'Push, Pull, and Fetch',
        objectives: [
          'Push local commits to a remote repository',
          'Pull remote changes into your local branch',
          'Understand the difference between git pull and git fetch',
          'Handle push rejection when remote has new commits',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Synchronizing with Remotes</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Three commands keep your local and remote repositories in sync: <code>push</code>, <code>pull</code>, and <code>fetch</code>.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The Sync Commands</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Push local commits to remote
git push origin main

# Push a new branch to remote (set upstream)
git push -u origin feature-branch

# Fetch remote changes (don't merge)
git fetch origin

# Fetch and merge in one step
git pull origin main

# Pull with rebase instead of merge
git pull --rebase origin main</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">git pull vs git fetch</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>git fetch</strong> — Downloads commits and refs from remote, but doesn't change your working directory. Safe to inspect before merging.</li>
            <li><strong>git pull</strong> — Does a fetch followed by a merge (or rebase). Changes your working directory immediately.</li>
          </ul>

          <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
            <p class="text-red-800"><strong>⚠️ Push Rejection:</strong> If your push is rejected, it means the remote has commits you don't have locally. Pull first, resolve any conflicts, then push again.</p>
          </div>
        `,
        defaultCommands: [
          'git push -u origin main',
          'git fetch origin',
          'git log --oneline origin/main',
        ],
        takeaways: [
          'git push uploads local commits to the remote repository',
          'git fetch downloads remote changes but doesn\'t merge them',
          'git pull = git fetch + git merge (applies remote changes immediately)',
          'Use -u (--set-upstream) the first time you push a new branch',
          'If push is rejected, pull first, resolve conflicts, then push again',
        ],
      },
      {
        id: 'm3-l3',
        title: 'Collaboration Workflows',
        objectives: [
          'Understand the fork-and-PR workflow for open source',
          'Manage multiple remotes (origin and upstream)',
          'Keep your fork synced with the original repo',
          'Use pull requests for code review',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Collaborating with Others</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">There are two main workflows for collaborating on GitHub: the <strong>shared repository model</strong> (team members push to the same repo) and the <strong>fork-and-pull model</strong> (common in open source).</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Fork-and-Pull Workflow</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Add the original repo as "upstream"
git remote add upstream https://github.com/original/repo.git

# Fetch upstream changes
git fetch upstream

# Sync your main branch with upstream
git checkout main
git merge upstream/main

# Push updated main to your fork
git push origin main

# Create a feature branch, work, push, then open a PR
git checkout -b my-feature
# ... make changes, commit ...
git push -u origin my-feature</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Pull Request Best Practices</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li>Keep PRs small and focused on a single concern</li>
            <li>Write a clear title and description explaining what and why</li>
            <li>Reference related issues (e.g., "Closes #42")</li>
            <li>Respond to review comments and make requested changes</li>
            <li>Rebase or merge main into your branch if conflicts arise</li>
          </ul>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>📌 Analogy:</strong> Forking is like making a photocopy of a book. You can write notes in your copy without affecting the original. A pull request is like mailing your annotated pages back to the author suggesting they add them to the next edition.</p>
          </div>
        `,
        defaultCommands: [
          'git remote add upstream https://github.com/original/repo.git',
          'git fetch upstream',
          'git checkout main',
          'git merge upstream/main',
        ],
        takeaways: [
          'The fork-and-pull model is the standard for open-source contributions',
          'Configure origin (your fork) and upstream (original repo) as two remotes',
          'Keep your fork synced: fetch upstream, merge into main, push to origin',
          'Pull requests enable code review and discussion before changes are merged',
          'Reference issues with keywords like "Closes #123" in PR descriptions',
        ],
      },
    ],
    quiz: [
      {
        id: 'm3-q1',
        question: 'What does git fetch do?',
        options: [
          'Downloads changes and merges them into your working branch',
          'Downloads changes but does NOT merge them',
          'Uploads your commits to the remote',
          'Deletes the remote repository',
        ],
        correct: 1,
      },
      {
        id: 'm3-q2',
        question: 'What is the conventional name for the primary remote?',
        options: ['main', 'master', 'origin', 'remote'],
        correct: 2,
      },
      {
        id: 'm3-q3',
        question: 'What should you do if your git push is rejected?',
        options: [
          'Force push with --force',
          'Delete the remote and push again',
          'Pull first, resolve conflicts, then push',
          'Create a new repository',
        ],
        correct: 2,
      },
      {
        id: 'm3-q4',
        question: 'In the fork-and-pull model, what is the role of the "upstream" remote?',
        options: [
          'It is your fork of the original repository',
          'It is the original repository you forked from',
          'It is a backup copy of your local repo',
          'It is the remote that stores your PRs',
        ],
        correct: 1,
      },
      {
        id: 'm3-q5',
        question: 'Which command pushes a branch AND sets the upstream tracking?',
        options: ['git push origin branch', 'git push -u origin branch', 'git push --set branch', 'git push --track branch'],
        correct: 1,
      },
    ],
    exercises: [
      {
        title: 'Remote Setup',
        description: 'Add a remote named "origin" pointing to a mock repository, then add an "upstream" remote.',
        defaultCommands: ['git remote add origin https://github.com/student/my-repo.git', 'git remote add upstream https://github.com/original/my-repo.git', 'git remote -v'],
      },
      {
        title: 'Fetch and Merge Cycle',
        description: 'Simulate fetching upstream changes and merging them into your local main branch.',
        defaultCommands: ['git fetch upstream', 'git checkout main', 'git merge upstream/main'],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 4: Undo & Recovery
  // ═══════════════════════════════════════════════
  {
    id: 'mod-4',
    title: 'Undo & Recovery',
    lessons: [
      {
        id: 'm4-l1',
        title: 'Undoing Changes',
        objectives: [
          'Discard unstaged changes with git restore',
          'Unstage files with git restore --staged',
          'Amend the last commit message or content',
          'Understand the safety differences between undo commands',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Safe Ways to Undo Changes</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Git provides several ways to undo changes, ranging from safe (reversible) to destructive (permanent). Always prefer the least destructive option.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Restoring and Unstaging</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Discard unstaged changes in a file (Git 2.23+)
git restore file.txt

# Older syntax (still works)
git checkout -- file.txt

# Unstage a file (keep changes in working directory)
git restore --staged file.txt

# Alternative: git reset to unstage
git reset HEAD file.txt</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Fixing the Last Commit</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Amend commit message only
git commit --amend -m "Better commit message"

# Add forgotten files to the last commit
git add forgotten-file.js
git commit --amend --no-edit

# WARNING: --amend rewrites commit history!
# Don't use on commits already pushed to shared branches</code></pre>

          <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
            <p class="text-red-800"><strong>⚠️ NEVER amend, rebase, or reset commits that have been pushed to a shared branch.</strong> This rewrites history and causes chaos for your teammates. Only rewrite local commits that haven't been shared.</p>
          </div>
        `,
        defaultCommands: [
          'echo "Temporary change" >> README.md',
          'git restore README.md',
          'echo "Another change" > new-file.txt',
          'git add new-file.txt',
          'git restore --staged new-file.txt',
        ],
        takeaways: [
          'git restore discards unstaged changes; git restore --staged unstages files',
          'git commit --amend lets you fix the last commit\'s message or content',
          'Never rewrite history on commits that have been pushed to shared branches',
          'Always verify there are no uncommitted changes before switching branches',
          'Prefer the least destructive undo option — you can\'t undo an undo!',
        ],
      },
      {
        id: 'm4-l2',
        title: 'Git Reset & Revert',
        objectives: [
          'Understand the three modes of git reset: --soft, --mixed, --hard',
          'Use git revert to safely undo a commit without rewriting history',
          'Choose between reset and revert based on the situation',
          'Recover from accidental hard resets using git reflog',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Rewriting vs Reversing History</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Git gives you two approaches to undo commits: <strong>reset</strong> (rewrites history) and <strong>revert</strong> (creates a new commit that undoes the old one).</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Git Reset — Three Modes</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># --soft: Move HEAD, leave index and working tree unchanged
git reset --soft HEAD~1

# --mixed (default): Move HEAD, reset index, leave working tree
git reset HEAD~1

# --hard: Move HEAD, reset index AND working tree (DESTRUCTIVE!)
git reset --hard HEAD~1</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Git Revert — The Safe Choice</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Revert a specific commit (creates a new "undo" commit)
git revert HEAD

# Revert without creating a commit (useful for reviewing)
git revert --no-commit HEAD

# Revert a range of commits
git revert HEAD~3..HEAD</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">When to Use Which</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>git reset</strong> — For local-only commits you haven't shared. Safe to rewrite.</li>
            <li><strong>git revert</strong> — For commits already pushed to shared branches. Creates a new commit that reverses the changes.</li>
          </ul>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>✅ Rule of Thumb:</strong> If you've pushed it, use revert. If it's only local, you can safely reset.</p>
          </div>
        `,
        defaultCommands: [
          'git log --oneline',
          'git reset --soft HEAD~1',
          'git log --oneline',
        ],
        takeaways: [
          'git reset --soft: moves HEAD, keeps all changes staged',
          'git reset --mixed (default): moves HEAD, unstages changes, keeps working tree',
          'git reset --hard: moves HEAD, discards ALL changes (use with extreme caution)',
          'git revert creates a new commit that undoes a previous one — safe for shared branches',
          'Use reset for local-only commits, revert for commits already pushed',
        ],
      },
      {
        id: 'm4-l3',
        title: 'Stashing and Reflog',
        objectives: [
          'Temporarily save uncommitted work with git stash',
          'Apply, list, and manage stashes',
          'Recover "lost" commits using git reflog',
          'Use reflog to undo a bad reset or rebase',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Stashing and the Reflog Safety Net</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Two Git features act as your safety net: <strong>stash</strong> for temporarily saving work-in-progress, and <strong>reflog</strong> for recovering from almost any mistake.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Git Stash — Save Work for Later</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Save current changes (including untracked files)
git stash -u

# Save with a descriptive message
git stash push -m "WIP: login feature"

# List all stashes
git stash list

# Apply the most recent stash (keep it in stash list)
git stash apply

# Apply and remove from stash list
git stash pop

# Apply a specific stash
git stash apply stash@{2}

# Drop a stash
git stash drop stash@{0}

# Clear all stashes
git stash clear</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Git Reflog — Your Safety Net</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># View the reference log (history of where HEAD has been)
git reflog

# Recover from a bad reset
git reflog  # find the commit hash you lost
git checkout <hash>   # go to that commit
git branch recover-branch  # create a branch to keep it</code></pre>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>💡 Reflog saves the day:</strong> Even <code>git reset --hard</code> isn't the end of the world! Git's reflog records every movement of HEAD for ~90 days. You can almost always recover lost commits — unless the repository was garbage-collected.</p>
          </div>
        `,
        defaultCommands: [
          'echo "Work in progress" >> temp-file.txt',
          'git stash push -m "Temporary work"',
          'git stash list',
          'git stash pop',
        ],
        takeaways: [
          'git stash temporarily saves uncommitted changes so you can work on something else',
          'Use git stash -u to include untracked files in the stash',
          'git reflog records every HEAD movement — your safety net for recovering lost commits',
          'Reflog entries are stored locally and expire after ~90 days',
          'You can recover from a bad reset or rebase by finding the old hash in reflog',
        ],
      },
    ],
    quiz: [
      {
        id: 'm4-q1',
        question: 'Which command discards unstaged changes in a file?',
        options: ['git reset', 'git restore', 'git revert', 'git delete'],
        correct: 1,
      },
      {
        id: 'm4-q2',
        question: 'What does git commit --amend do?',
        options: [
          'Deletes the last commit',
          'Modifies the most recent commit (message and/or content)',
          'Creates a new branch at the last commit',
          'Adds a tag to the last commit',
        ],
        correct: 1,
      },
      {
        id: 'm4-q3',
        question: 'Which is the safest way to undo a commit that has already been pushed to a shared branch?',
        options: ['git reset --hard HEAD~1', 'git revert HEAD', 'git branch -d main', 'git commit --amend'],
        correct: 1,
      },
      {
        id: 'm4-q4',
        question: 'What does git stash do?',
        options: [
          'Permanently deletes all uncommitted changes',
          'Temporarily saves uncommitted changes for later use',
          'Creates a backup of the entire repository',
          'Merges all branches together',
        ],
        correct: 1,
      },
      {
        id: 'm4-q5',
        question: 'How long do reflog entries typically persist?',
        options: ['7 days', '30 days', '90 days', 'Permanently'],
        correct: 2,
      },
    ],
    exercises: [
      {
        title: 'Stash Workflow',
        description: 'Start editing a file, stash the changes, verify the working directory is clean, then pop the stash to restore them.',
        defaultCommands: ['echo "WIP content" >> work.txt', 'git stash push -m "In progress"', 'git status', 'git stash pop', 'git status'],
      },
      {
        title: 'Amend a Commit',
        description: 'Make a commit with a bad message, then amend it with a better message.',
        defaultCommands: ['echo "Some code" > app.js', 'git add app.js', 'git commit -m "fix stuff"', 'git commit --amend -m "Add app.js with core logic"'],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 5: History & Inspection
  // ═══════════════════════════════════════════════
  {
    id: 'mod-5',
    title: 'History & Inspection',
    lessons: [
      {
        id: 'm5-l1',
        title: 'Reading Git History',
        objectives: [
          'Master git log with various formatting options',
          'Filter commits by author, date, and message',
          'Visualize branch history with graph view',
          'Search through commit history efficiently',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Mastering git log</h2>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>git log</code> is your window into the project's history. With the right flags, you can find any commit in seconds — even in repositories with thousands of commits.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Useful Log Formats</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># One line per commit
git log --oneline

# Graph view with branches
git log --oneline --graph --all

# Custom format
git log --pretty=format:"%h - %an, %ar : %s"

# Show statistics (files changed, insertions, deletions)
git log --stat

# Show the actual diff of each commit
git log -p</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Filtering the Log</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Filter by author
git log --author="John"

# Filter by date range
git log --since="2 weeks ago"
git log --after="2024-01-01" --before="2024-06-01"

# Search commit messages
git log --grep="bugfix"

# Filter by file
git log -- README.md

# Show last N commits
git log -5</code></pre>

          <div class="bg-orange-50 border-l-4 border-orange-500 p-4 my-6 rounded-r-lg">
            <p class="text-orange-800"><strong>💡 Pro Tip:</strong> Create an alias: <code>git config --global alias.lg "log --oneline --graph --all --decorate"</code> then just type <code>git lg</code> for a beautiful visual history!</p>
          </div>
        `,
        defaultCommands: [
          'git log --oneline',
          'git log --oneline --graph --all --decorate',
        ],
        takeaways: [
          'git log --oneline --graph --all --decorate gives the most useful history overview',
          'Filter by --author, --since, --grep, or by specific file paths',
          'git log -p shows the actual diff (additions and deletions) of each commit',
          'Create aliases with git config to shorten common commands',
          'Use --all to see commits from every branch, not just the current one',
        ],
      },
      {
        id: 'm5-l2',
        title: 'Comparing Changes',
        objectives: [
          'Compare commits, branches, and files with git diff',
          'See who changed what with git blame',
          'Find the commit that introduced a bug with git bisect',
          'Show detailed information about a commit with git show',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Inspecting Changes in Detail</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Beyond the commit log, Git has powerful tools for drilling into the specifics of what changed and who changed it.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Comparing with git diff</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Compare two branches
git diff main..feature-branch

# Compare two commits
git diff abc123..def456

# Compare a file between two commits
git diff HEAD~2 HEAD -- README.md

# Summary of changes (files only, no content)
git diff --stat main..feature</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">git blame and git show</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># See who last modified each line (and in which commit)
git blame README.md

# Show full details of a commit
git show abc123

# Show a file as it existed in a specific commit
git show abc123:path/to/file.js</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Finding Bugs with git bisect</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Start the bisect
git bisect start

# Mark the current commit as bad
git bisect bad

# Mark a known-good commit
git bisect good v1.0

# Git will checkout a middle commit — test it, then:
git bisect good   # if the bug isn't present
git bisect bad    # if the bug is present

# Git narrows down to the first bad commit!
# End bisect when done
git bisect reset</code></pre>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>💡 git bisect efficiency:</strong> With 1000 commits, bisect finds the buggy commit in just ~10 steps (log₂(1000)). For 1 million commits: ~20 steps. It's magical for regression hunting!</p>
          </div>
        `,
        defaultCommands: [
          'git log --oneline',
          'git show HEAD',
          'git diff HEAD~1 HEAD',
        ],
        takeaways: [
          'git diff compares any two states: branches, commits, files, or working tree vs staging',
          'git blame shows which commit and author last modified each line of a file',
          'git show displays full details (diff, metadata) of a specific commit',
          'git bisect uses binary search to efficiently find the commit that introduced a bug',
          'Automate bisect with git bisect run <script> — great for CI regression detection',
        ],
      },
    ],
    quiz: [
      {
        id: 'm5-q1',
        question: 'Which flag shows git log as a one-line-per-commit format?',
        options: ['--short', '--oneline', '--compact', '--summary'],
        correct: 1,
      },
      {
        id: 'm5-q2',
        question: 'How do you see only commits made in the last 2 weeks?',
        options: ['git log --since="2 weeks ago"', 'git log --until="2 weeks ago"', 'git log --before="2 weeks ago"', 'git log --date="2 weeks"'],
        correct: 0,
      },
      {
        id: 'm5-q3',
        question: 'Which command shows who last modified each line of a file?',
        options: ['git blame', 'git accuse', 'git credit', 'git show'],
        correct: 0,
      },
      {
        id: 'm5-q4',
        question: 'What does git bisect do?',
        options: [
          'Splits a branch into two',
          'Uses binary search to find the commit that introduced a bug',
          'Merges two branches by splitting the difference',
          'Creates a diff of all uncommitted changes',
        ],
        correct: 1,
      },
      {
        id: 'm5-q5',
        question: 'Which git log flag shows a visual graph of branch history?',
        options: ['--graph', '--tree', '--branch', '--network'],
        correct: 0,
      },
    ],
    exercises: [
      {
        title: 'History Exploration',
        description: 'Create a few commits, then use various git log formats to explore the history.',
        defaultCommands: ['echo "v1" > version.txt', 'git add version.txt', 'git commit -m "Version 1"', 'echo "v2" >> version.txt', 'git add .', 'git commit -m "Version 2"', 'git log --oneline --graph --all --decorate'],
      },
      {
        title: 'Find a Change',
        description: 'Use git diff to compare the first and last commits, then use git show to inspect the last commit.',
        defaultCommands: ['git log --oneline', 'git diff HEAD~1 HEAD', 'git show HEAD'],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 6: Advanced Git
  // ═══════════════════════════════════════════════
  {
    id: 'mod-6',
    title: 'Advanced Git',
    lessons: [
      {
        id: 'm6-l1',
        title: 'Rebasing',
        objectives: [
          'Understand rebasing vs merging',
          'Rebase a feature branch onto main',
          'Handle rebase conflicts',
          'Know when NOT to rebase',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Rebasing — Rewriting History Cleanly</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Rebasing is an alternative to merging. Instead of creating a merge commit, rebase <strong>rewrites commit history</strong> to create a linear sequence. Think of it as saying, "I want my changes to start from the latest point on main."</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Rebasing a Feature Branch</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># While on your feature branch:
git checkout feature-branch

# Rebase onto main
git rebase main

# If conflicts occur, resolve them, then:
git add resolved-file.js
git rebase --continue

# Or abort the rebase entirely
git rebase --abort</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Merge vs Rebase</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Merge</strong> — Preserves exact history, shows when branches diverged and merged. "Tell the truth about what happened."</li>
            <li><strong>Rebase</strong> — Creates clean, linear history. "Tell the story of how the code should have been written."</li>
          </ul>

          <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
            <p class="text-red-800"><strong>⚠️ Golden Rule of Rebasing:</strong> Never rebase commits that have been pushed to a shared branch. Rebasing rewrites history — if someone else has based work on the old commits, they'll have conflicts. Only rebase local or personal feature branches.</p>
          </div>
        `,
        defaultCommands: [
          'git checkout -b feature-x',
          'echo "Feature work" > feature.txt',
          'git add feature.txt',
          'git commit -m "Add feature X"',
          'git checkout main',
          'git merge feature-x',
        ],
        takeaways: [
          'Rebase rewrites history to create a linear sequence of commits (no merge bubbles)',
          'Use rebase for local/feature branches; use merge for public/shared branches',
          'Resolve conflicts during rebase one commit at a time, then git rebase --continue',
          'git rebase --abort cancels the entire rebase operation',
          'The golden rule: never rebase commits that exist on shared branches',
        ],
      },
      {
        id: 'm6-l2',
        title: 'Cherry-Pick, Tagging, and Submodules',
        objectives: [
          'Selectively apply commits with git cherry-pick',
          'Create and manage tags for releases',
          'Understand submodules and alternatives',
          'Use interactive rebase for squashing and reordering',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Advanced Git Operations</h2>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Cherry-Picking</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>git cherry-pick</code> applies the changes from a specific commit onto your current branch. It's like saying, "I want that one change from that other branch — but nothing else."</p>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Apply a specific commit to the current branch
git cherry-pick abc123

# Cherry-pick a range of commits
git cherry-pick abc123..def456

# Cherry-pick without committing (useful for review)
git cherry-pick -n abc123</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Tagging</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Create a lightweight tag
git tag v1.0.0

# Create an annotated tag (recommended for releases)
git tag -a v1.0.0 -m "Release version 1.0.0"

# List tags
git tag -l "v1.*"

# Push tags to remote
git push origin v1.0.0
git push origin --tags  # push all tags

# Delete a tag
git tag -d v1.0.0</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Interactive Rebase</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Squash the last 3 commits into 1
git rebase -i HEAD~3

# This opens an editor where you can:
# - pick: keep the commit as-is
# - squash: combine with the previous commit
# - reword: change the commit message
# - edit: stop to amend the commit
# - drop: delete the commit</code></pre>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>💡 Workflow:</strong> Interactive rebase is perfect for cleaning up a messy local branch before pushing: squash "fix typo" and "oops" commits into the main feature commit.</p>
          </div>
        `,
        defaultCommands: [
          'git tag -a v1.0.0 -m "Initial release"',
          'git tag -l',
        ],
        takeaways: [
          'git cherry-pick applies individual commits from anywhere in the repository',
          'Annotated tags (-a -m) store metadata and are recommended for releases',
          'Use git push origin --tags to push all tags to remote',
          'Interactive rebase (git rebase -i) lets you squash, reorder, and edit commits',
          'Clean up your branch with interactive rebase before creating a pull request',
        ],
      },
    ],
    quiz: [
      {
        id: 'm6-q1',
        question: 'What is the golden rule of rebasing?',
        options: [
          'Always rebase before merging',
          'Never rebase commits that have been pushed to a shared branch',
          'Only rebase on Fridays',
          'Rebase is always better than merge',
        ],
        correct: 1,
      },
      {
        id: 'm6-q2',
        question: 'Which command applies a specific commit to your current branch?',
        options: ['git apply', 'git cherry-pick', 'git pick', 'git transfer'],
        correct: 1,
      },
      {
        id: 'm6-q3',
        question: 'What is the difference between a lightweight tag and an annotated tag?',
        options: [
          'Lightweight tags are faster; annotated tags are slower',
          'Annotated tags store metadata (author, date, message); lightweight tags are just pointers',
          'Lightweight tags can be pushed; annotated tags cannot',
          'There is no difference',
        ],
        correct: 1,
      },
      {
        id: 'm6-q4',
        question: 'What does the "squash" option do in interactive rebase?',
        options: [
          'Deletes the commit entirely',
          'Combines the commit with the previous one',
          'Changes the commit message',
          'Stops to let you edit the commit',
        ],
        correct: 1,
      },
      {
        id: 'm6-q5',
        question: 'What command should you use to abort a rebase that has gone wrong?',
        options: ['git rebase stop', 'git rebase --abort', 'git rebase --cancel', 'git abort'],
        correct: 1,
      },
    ],
    exercises: [
      {
        title: 'Tag a Release',
        description: 'Create a few commits, then tag the last commit as v1.0.0 with an annotated tag.',
        defaultCommands: ['echo "Release content" > release.txt', 'git add release.txt', 'git commit -m "Prepare release"', 'git tag -a v1.0.0 -m "First official release"', 'git tag -l'],
      },
      {
        title: 'Interactive Rebase',
        description: 'Create 3 small commits, then squash them into one using interactive rebase (simulated).',
        defaultCommands: ['echo "part1" > file.txt', 'git add file.txt', 'git commit -m "Add part 1"', 'echo "part2" >> file.txt', 'git add .', 'git commit -m "Add part 2"', 'echo "part3" >> file.txt', 'git add .', 'git commit -m "Add part 3"', 'git log --oneline'],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 7: GitHub Workflow
  // ═══════════════════════════════════════════════
  {
    id: 'mod-7',
    title: 'GitHub Workflow',
    lessons: [
      {
        id: 'm7-l1',
        title: 'Pull Requests & Code Review',
        objectives: [
          'Understand the pull request lifecycle',
          'Create and review pull requests',
          'Use PR templates and checklists',
          'Merge PRs with different merge strategies',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Pull Requests — The Heart of Collaboration</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">A <strong>Pull Request (PR)</strong> is a proposal to merge changes from one branch into another. On GitHub, PRs are the primary mechanism for code review, discussion, and collaboration.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">The PR Lifecycle</h3>
          <ol class="list-decimal pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Create a branch</strong> — Branch off main for your feature or fix</li>
            <li><strong>Make changes</strong> — Commit your work with descriptive messages</li>
            <li><strong>Push the branch</strong> — Push to the remote repository</li>
            <li><strong>Open a PR</strong> — Click "New Pull Request" on GitHub</li>
            <li><strong>Discuss and review</strong> — Collaborators leave comments and suggestions</li>
            <li><strong>Update and refine</strong> — Push additional commits in response to feedback</li>
            <li><strong>Merge</strong> — Once approved, merge into the target branch</li>
          </ol>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">PR Best Practices</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li>Keep PRs small and focused — ideally under 400 lines changed</li>
            <li>Write descriptive titles and include context in the description</li>
            <li>Reference related issues with keywords: "Closes #42" or "Fixes #123"</li>
            <li>Add labels (bug, enhancement, documentation) for organization</li>
            <li>Request specific reviewers who know the codebase area</li>
          </ul>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>✅ Merge Strategies on GitHub:</strong> Create a merge commit (preserves all commits), Squash and merge (combines into one commit), or Rebase and merge (linear history without merge commit).</p>
          </div>
        `,
        defaultCommands: [
          'git checkout -b feature/improve-readme',
          'echo "## Documentation" >> README.md',
          'git add README.md',
          'git commit -m "Improve README with doc section"',
          'git push -u origin feature/improve-readme',
        ],
        takeaways: [
          'A Pull Request proposes changes to be merged from one branch into another',
          'PRs enable code review, automated checks, and discussion before merging',
          'Keep PRs small and focused (under 400 lines) for faster, better reviews',
          'Use "Closes #N" or "Fixes #N" in the description to auto-link and close issues',
          'GitHub offers three merge strategies: merge commit, squash-and-merge, rebase-and-merge',
        ],
      },
      {
        id: 'm7-l2',
        title: 'Issues, Projects, and Collaboration',
        objectives: [
          'Create and manage GitHub Issues',
          'Use labels, milestones, and assignees',
          'Understand GitHub Projects for task tracking',
          'Set up branch protection rules',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">GitHub Issues and Project Management</h2>
          <p class="mb-4 text-gray-700 leading-relaxed">Beyond just code hosting, GitHub provides powerful project management tools: <strong>Issues</strong> for tracking bugs and tasks, and <strong>Projects</strong> for organizing work on a board.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Working with Issues</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Create issues</strong> — Bug reports, feature requests, questions, tasks</li>
            <li><strong>Labels</strong> — Categorize issues: <code>bug</code>, <code>enhancement</code>, <code>good first issue</code>, <code>help wanted</code></li>
            <li><strong>Milestones</strong> — Group issues by release version or sprint</li>
            <li><strong>Assignees</strong> — Assign responsibility to specific team members</li>
            <li><strong>Templates</strong> — Create templates for bug reports and feature requests</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Branch Protection Rules</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Common branch protection settings (configured in repo Settings):
# - Require pull request reviews before merging
# - Require status checks to pass (CI tests)
# - Require up-to-date branches (no stale base)
# - Do not allow bypassing protections (even for admins)
# - Restrict who can push to matching branches</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">GitHub Project Boards</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">GitHub Projects use a kanban-style board (To Do, In Progress, Done) to track work. Issues and PRs can be dragged across columns. Modern GitHub Projects also support tables, timelines, and custom fields.</p>

          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>📌 Power Tip:</strong> Use issue templates with YAML frontmatter to create structured, consistent bug reports and feature requests. This ensures every issue has all required information.</p>
          </div>
        `,
        defaultCommands: [],
        takeaways: [
          'GitHub Issues track bugs, features, and tasks with labels, milestones, and assignees',
          'Issue templates ensure consistent and complete bug reports and feature requests',
          'Branch protection rules enforce code review and CI requirements on important branches',
          'GitHub Project boards visualize work using kanban-style columns or table views',
          'Link PRs to issues with keywords like "Closes" to automatically close issues on merge',
        ],
      },
    ],
    quiz: [
      {
        id: 'm7-q1',
        question: 'What is a Pull Request?',
        options: [
          'A request to delete a branch',
          'A proposal to merge changes from one branch into another',
          'A request to create a new repository',
          'A command that pulls code from a remote',
        ],
        correct: 1,
      },
      {
        id: 'm7-q2',
        question: 'Which keyword in a PR description automatically closes an issue on merge?',
        options: ['Related to', 'See also', 'Closes', 'References'],
        correct: 2,
      },
      {
        id: 'm7-q3',
        question: 'What do branch protection rules do?',
        options: [
          'Prevent anyone from creating branches',
          'Enforce policies like required reviews and passing CI checks before merging',
          'Automatically delete branches after they are merged',
          'Send email notifications when branches are created',
        ],
        correct: 1,
      },
      {
        id: 'm7-q4',
        question: 'Which merge strategy on GitHub combines all commits into a single commit?',
        options: ['Create a merge commit', 'Squash and merge', 'Rebase and merge', 'Fast-forward only'],
        correct: 1,
      },
      {
        id: 'm7-q5',
        question: 'What are GitHub Issues used for?',
        options: [
          'Only for reporting bugs',
          'Tracking bugs, features, tasks, and discussions',
          'Storing large files',
          'Hosting documentation websites',
        ],
        correct: 1,
      },
    ],
    exercises: [
      {
        title: 'PR Simulation',
        description: 'Create a feature branch, make changes, push it (conceptually), and prepare for a PR.',
        defaultCommands: ['git checkout -b feature/add-docs', 'echo "# Documentation" > docs.md', 'git add docs.md', 'git commit -m "Add project documentation"', 'git push -u origin feature/add-docs'],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // Module 8: GitHub Actions
  // ═══════════════════════════════════════════════
  {
    id: 'mod-8',
    title: 'GitHub Actions',
    lessons: [
      {
        id: 'm8-l1',
        title: 'Introduction to GitHub Actions',
        objectives: [
          'Understand what GitHub Actions is and how it works',
          'Learn the core concepts: workflows, jobs, steps, actions',
          'Create a basic workflow file',
          'Understand events that trigger workflows',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">GitHub Actions — Automate Everything</h2>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>GitHub Actions</strong> is a CI/CD (Continuous Integration / Continuous Deployment) platform built into GitHub. It automates software workflows — testing, building, deploying — directly from your repository.</p>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Core Concepts</h3>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><strong>Workflow</strong> — A configurable automated process defined in YAML. Lives in <code>.github/workflows/</code>.</li>
            <li><strong>Job</strong> — A set of steps that execute on the same runner. Jobs run in parallel by default.</li>
            <li><strong>Step</strong> — An individual task (a shell command or a reusable action).</li>
            <li><strong>Action</strong> — A reusable unit of code (like <code>actions/checkout</code>). Can be community-built or custom.</li>
            <li><strong>Runner</strong> — A virtual machine (Ubuntu, Windows, macOS) that runs the workflow.</li>
          </ul>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">A Basic Workflow</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test</code></pre>

          <div class="bg-green-50 border-l-4 border-green-600 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>✅ Free Tier:</strong> GitHub provides 2,000 minutes of free Actions runtime per month for private repos, and unlimited for public repos!</p>
          </div>
        `,
        defaultCommands: [
          'mkdir -p .github/workflows',
          'echo \'name: CI\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo "Hello, Actions!"\' > .github/workflows/ci.yml',
        ],
        takeaways: [
          'GitHub Actions is a CI/CD platform for automating builds, tests, and deployments',
          'Workflows are YAML files in .github/workflows/',
          'Jobs run on runners (Ubuntu, Windows, macOS) and can run in parallel',
          'Steps within a job run sequentially and share the runner\'s filesystem',
          'GitHub offers free Actions minutes for both public (unlimited) and private repos',
        ],
      },
      {
        id: 'm8-l2',
        title: 'Advanced Actions — Matrix, Artifacts, Deployment',
        objectives: [
          'Use build matrices to test across multiple versions',
          'Upload and download workflow artifacts',
          'Create and publish custom actions',
          'Deploy applications using GitHub Actions',
        ],
        content: `
          <h2 class="text-2xl font-bold mb-4 text-gray-900">Mastering GitHub Actions Workflows</h2>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Build Matrix — Test Across Versions</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code>jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
      - run: npm test</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Storing and Sharing Artifacts</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Upload build output for later use or download
- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: dist/

# Later, in a deploy job:
- name: Download build artifacts
  uses: actions/download-artifact@v4
  with:
    name: build-output</code></pre>

          <h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">Workflow Triggers</h3>
          <pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4"><code># Common triggers:
on:
  push:                        # run on every push
  pull_request:               # run on every PR
  schedule:                   # run on a schedule
    - cron: "0 0 * * *"       # daily at midnight
  workflow_dispatch:          # manual trigger via GitHub UI
  release:                    # run when a release is published</code></pre>

          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>⚠️ Security:</strong> Be careful with pull_request_target events and secrets. Never run untrusted code in workflows that have access to repository secrets. Use <code>pull_request</code> for untrusted forks.</p>
          </div>
        `,
        defaultCommands: [
          'echo \'name: Matrix Test\non: [push]\njobs:\n  test:\n    strategy:\n      matrix:\n        version: [18, 20]\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: ${{ matrix.version }}\n      - run: echo "Testing on Node ${{ matrix.version }}"\' > .github/workflows/matrix.yml',
        ],
        takeaways: [
          'Build matrices test across multiple OS/version combinations simultaneously',
          'Artifacts allow sharing files between jobs in a workflow (upload/download)',
          'Workflows can be triggered by push, PR, schedule (cron), manual dispatch, and more',
          'Custom actions can be shared on GitHub Marketplace or within your organization',
          'Be security-conscious: workflows with secrets should not run untrusted PR code',
        ],
      },
    ],
    quiz: [
      {
        id: 'm8-q1',
        question: 'Where are GitHub Actions workflow files stored?',
        options: ['.github/actions/', '.github/workflows/', 'workflows/', 'actions/'],
        correct: 1,
      },
      {
        id: 'm8-q2',
        question: 'What file format is used for GitHub Actions workflows?',
        options: ['JSON', 'XML', 'YAML', 'TOML'],
        correct: 2,
      },
      {
        id: 'm8-q3',
        question: 'What is a build matrix used for?',
        options: [
          'Visualizing build outputs',
          'Testing across multiple OS/version combinations',
          'Sorting build artifacts',
          'Generating Matrix code',
        ],
        correct: 1,
      },
      {
        id: 'm8-q4',
        question: 'Which GitHub Action checks out your repository code in a workflow?',
        options: ['actions/setup-node', 'actions/checkout', 'actions/cache', 'actions/github-script'],
        correct: 1,
      },
      {
        id: 'm8-q5',
        question: 'What is an artifact in GitHub Actions?',
        options: [
          'A bug in the workflow',
          'A saved build output or file that can be shared between jobs',
          'A type of GitHub Action',
          'A virtual machine runner',
        ],
        correct: 1,
      },
    ],
    exercises: [
      {
        title: 'Create a Workflow',
        description: 'Create a basic CI workflow YAML file that runs on push and pull_request, checks out code, sets up Node.js, installs deps, and runs tests.',
        defaultCommands: ['mkdir -p .github/workflows', 'echo \'name: Basic CI\non:\n  push:\n  pull_request:\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: npm ci\n      - run: npm test\' > .github/workflows/ci.yml'],
      },
    ],
  },
];

/* Expose globally for script-tag usage */
if (typeof window !== 'undefined') {
  window.gitAcademyCurriculum = curriculum;
}
