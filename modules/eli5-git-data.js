/**
 * ELI5 (Explain Like I'm 5) content for Git Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */
(function () {
  'use strict';

  const eli5GitData = {
    'm1-l1': `
      <p>Git is like a <strong>giant undo button for your whole project</strong>.</p>
      <p>Imagine you're writing a book. Without Git, it's like using a single sheet of paper — if you make a mistake or want to go back to an earlier version, you're out of luck.</p>
      <p>With Git, it's like your book exists in a <strong>magic notebook</strong> where every time you finish a page, you press a button, and the notebook <strong>remembers every version forever</strong>. You can flip back to any version, see exactly what you wrote, when you wrote it, and even who wrote it (if you're collaborating).</p>
      <p>The <strong>three states</strong> are like your desk:</p>
      <ul>
        <li><strong>Modified</strong> = the page is on your desk with edits, not yet filed</li>
        <li><strong>Staged</strong> = the page is in an envelope, ready to be filed in the cabinet</li>
        <li><strong>Committed</strong> = the page is safely filed in the cabinet forever</li>
      </ul>
      <p>Git stores everything <strong>locally on your computer</strong>, so you don't need internet to save versions!</p>
    `,
    'm1-l2': `
      <p>Making a commit in Git is like <strong>taking a Polaroid photo</strong> of your project.</p>
      <p>First, you <strong>set up the shot</strong> (staging with <code>git add</code>). You decide which files go into the picture. Maybe you don't want that messy draft file in the photo — so you leave it out.</p>
      <p>Then you <strong>take the photo</strong> (<code>git commit</code>). Git instantly saves a snapshot of exactly how every staged file looks at that moment. It writes a label on the photo (<code>-m "message"</code>) so you know what this snapshot is about.</p>
      <p><strong>Good commit messages</strong> are like good photo captions. Instead of "stuff I did" (which is useless later), write "Add login form validation" — so when you look back, you know exactly what this snapshot contains!</p>
      <p>You can take as many Polaroids as you want. Each one is safely stored, and you can look back at any of them anytime.</p>
    `,
    'm1-l3': `
      <p>Think of Git's tracking system as <strong>different colored folders on your desk</strong>.</p>
      <p><strong>Untracked</strong> files are brand new sheets of paper you just brought in — Git doesn't know about them yet. They're like unlabeled papers sitting loose on your desk.</p>
      <p><strong>Tracked</strong> files are in labeled folders. Git is watching them. If you change one, Git sees it's "modified" — like a folder with a sticky note saying "this changed."</p>
      <p><code>git diff</code> is like holding two versions of a page side by side with a <strong>highlighter</strong> that marks exactly what's different. Green for added lines, red for removed lines.</p>
      <p>The <code>.gitignore</code> file is like a <strong>"do not file"</strong> bin. You toss in things like <code>node_modules</code> (downloadable packages) or <code>.env</code> (secret passwords) — and Git knows to never bother tracking them.</p>
    `,
    'm2-l1': `
      <p>Branches in Git are like <strong>parallel universes</strong> for your code.</p>
      <p>Imagine you're writing a story about a detective. In the <code>main</code> universe, the detective solves the case normally. But what if you want to try a version where the detective has a <strong>robot sidekick</strong>?</p>
      <p>With Git, you create a feature branch called <code>robot-sidekick</code>. You're now in a completely separate timeline where you can write robot jokes, add laser guns, and change the ending — without touching the main story at all!</p>
      <p>If the robot sidekick idea turns out great, you <strong>merge</strong> it back into <code>main</code> — combining both timelines. If it's a disaster, just <strong>delete the branch</strong> and the main story is completely untouched.</p>
      <p>The <strong>magic part</strong>: creating a branch takes less than a second because Git doesn't copy files. It just creates a lightweight pointer!</p>
    `,
    'm2-l2': `
      <p>Merging is like <strong>combining two puzzle sets</strong> that were built separately.</p>
      <p>You and a friend each got the same base puzzle (the main branch). You went off and added pieces to make a castle. Your friend went off and added pieces to make a forest.</p>
      <p>Now you want to put both the castle AND the forest into one giant puzzle.</p>
      <p>If you added pieces to different areas, Git is like a <strong>magic puzzle-matcher</strong> — it seamlessly merges all the pieces together. The castle and forest are both there, perfect!</p>
      <p>But if both of you tried to modify the <strong>same puzzle piece</strong> in different ways — that's a <strong>merge conflict</strong>. Git holds up both versions and says, "I don't know which one to keep — you decide!" You pick the right version (or combine them), remove the markers, and commit.</p>
      <p>Merge conflicts aren't failures — they're Git being smart enough to know when it needs your human judgment!</p>
    `,
    'm2-l3': `
      <p>Branching strategies are like <strong>team workflows for a restaurant kitchen</strong>.</p>
      <p><strong>GitHub Flow</strong> is like a small kitchen with one rule: "The main counter always has a finished dish ready to serve." Every chef takes ingredients from the main counter, goes to their station (a branch), prepares their dish, gets the head chef to taste it (code review), and puts the finished dish back on the main counter.</p>
      <p><strong>Git Flow</strong> is like a fancy restaurant with multiple stations:</p>
      <ul>
        <li><code>main</code> = the serving counter (only finished dishes)</li>
        <li><code>develop</code> = the prep station (dishes being assembled)</li>
        <li><code>feature/*</code> = individual chef's stations (each working on one recipe)</li>
        <li><code>release/*</code> = the quality check station (final tasting before serving)</li>
        <li><code>hotfix/*</code> = emergency fix station (when a dish arrives and has a problem)</li>
      </ul>
      <p>For most projects, start simple with GitHub Flow. You can always add more complexity later!</p>
    `,
    'm3-l1': `
      <p>A <strong>remote</strong> repository is like a <strong>shared cloud drive for your project</strong>.</p>
      <p>Imagine you're writing a report with classmates. You all have the same Google Doc URL (the remote). Your local copy is like the document open on your computer. When you make changes and save locally, only YOU can see them.</p>
      <p>When you're ready to share, you <strong>push</strong> your changes — like clicking "Sync" to upload your edits to the Google Doc. Others can now see your work.</p>
      <p>When someone else has edited the Google Doc, you <strong>pull</strong> their changes — like clicking "Refresh" to see their updates.</p>
      <p>The name <code>origin</code> is just the default nickname for the main remote — like calling your best friend "Buddy." You could call it anything (<code>my-server</code>, <code>company-repo</code>), but <code>origin</code> is the convention everyone understands.</p>
    `,
    'm3-l2': `
      <p><strong>Push, Pull, and Fetch</strong> are like <strong>syncing files between your laptop and a USB drive</strong>.</p>
      <p>Imagine you have important files on your laptop (your local repo) and a USB drive (the remote repo).</p>
      <p><strong>Push</strong> = Copy files from your laptop TO the USB drive. Now the USB has your latest changes. But if someone else added files to the USB since you last copied, the USB will say "Hey, you don't have these new files yet!" and refuse.</p>
      <p><strong>Fetch</strong> = Check what's on the USB without actually copying anything to your laptop yet. "Let me see what's new..." This is completely safe — nothing changes on your laptop.</p>
      <p><strong>Pull</strong> = Fetch + immediately copy the new files to your laptop. Now you have everything.</p>
      <p>The two-step process (fetch <em>then</em> merge) is safer when you want to inspect changes before merging. One-step pull is faster when you know everything is fine.</p>
    `,
    'm3-l3': `
      <p>Forking a repository is like <strong>making a photocopy of a library book</strong>.</p>
      <p>You find a great book (the original repo) in the library. You want to write notes and add your own chapters, but you can't write in the library book — other people need to read it too!</p>
      <p>So you <strong>fork</strong> it — make a personal photocopy that belongs to you (your fork). Now you can write all over your copy, add new pages, change the ending — do whatever you want.</p>
      <p>If you make something amazing and think the library should add it to the original book, you create a <strong>Pull Request</strong>. It's like mailing your new pages back to the librarian saying, "Hey, I wrote this great new chapter about dragons — want to add it to the main book?"</p>
      <p>The librarian (the original repo maintainer) can read your changes, suggest edits, and finally click "Merge" to add your pages to the official book!</p>
      <p>The <code>upstream</code> remote is the original library book. You <strong>fetch upstream</strong> to see if the library added new pages since you made your copy, and <strong>merge</strong> them into your version to stay in sync.</p>
    `,
    'm4-l1': `
      <p>Git's undo commands are like having <strong>different types of erasers</strong>.</p>
      <p><strong>git restore</strong> is like using a <strong>pencil eraser</strong> on your working file. It's safe and localized. You changed a file and regret it? <code>git restore file.txt</code> erases those changes and puts the file back exactly as it was.</p>
      <p><strong>git restore --staged</strong> is like <strong>taking something out of a frame</strong> before it hangs on the wall. You already staged the file (put it in the frame), but now you changed your mind. This takes it out of the frame but keeps your edits safe on the table.</p>
      <p><strong>git commit --amend</strong> is like <strong>peeling the sticker off a photo</strong> and putting a better one on. You just committed but the message has a typo, or you forgot to include a change. This lets you fix the most recent commit.</p>
      <p><strong>The Golden Rule:</strong> Only use these on commits you haven't shared yet! Once you've pushed a commit, other people might be building on top of it. Amending would be like yanking a floor tile out from under someone standing on it.</p>
    `,
    'm4-l2': `
      <p><strong>Reset</strong> and <strong>Revert</strong> are like two different ways to <strong>fix a mistake in a movie</strong>.</p>
      <p><strong>Reset</strong> is like using <strong>time travel</strong>. You go back in time and change the past. The movie from that point forward is rewritten. New scenes you shot after that point? Gone. Poof. The actors who performed those scenes? Their work is erased from history.</p>
      <p>This is fine if the movie hasn't been released yet (your commits are local). But if it's already showing in theaters (pushed to a shared branch), other directors (your teammates) have watched those scenes and maybe shot new scenes that depend on them!</p>
      <p><strong>Revert</strong> is like shooting <strong>a new scene that says "actually, forget what I just said."</strong> You don't erase history. You just add a new scene that counteracts the mistake. The original scene is still in the movie (in the archives), but the story now continues correctly.</p>
      <p>This is much safer for shared work because you're not erasing anyone else's foundation.</p>
      <p>The three <code>git reset</code> modes:</p>
      <ul>
        <li><code>--soft</code> = time travel in your head only (your work is still staged)</li>
        <li><code>--mixed</code> = time travel, but your notes are scattered on the floor (changes exist, not staged)</li>
        <li><code>--hard</code> = time travel AND you forget everything you ever knew (changes are DESTROYED)</li>
      </ul>
    `,
    'm4-l3': `
      <p>Git stash is like <strong>a pocket where you can temporarily put things</strong> while you work on something else.</p>
      <p>Imagine you're building a Lego castle (working on a feature). Halfway through, your mom says "Come set the table, right now!" You can't leave your Lego pieces scattered everywhere — your little brother might mess with them.</p>
      <p><strong>git stash</strong> is like sweeping all your Lego pieces into a labeled box and putting it on a shelf. Poof! Your desk is clean. You go set the table (switch branches, fix a bug).</p>
      <p><strong>git stash pop</strong> is like taking the box off the shelf and dumping all your Legos back on the desk. You're right back where you started!</p>
      <p>Now, <strong>git reflog</strong> is like <strong>a security camera that records every single thing you've ever done with Git</strong>. Even if you did a <code>git reset --hard</code> (which normally destroys changes), the reflog remembers what was there before.</p>
      <p>Think of the reflog as a <strong>"get out of jail free" card</strong>. Made a terrible mistake? Check the reflog, find the hash from 5 minutes ago, and jump back to it. As long as you're within ~90 days, almost nothing is truly lost!</p>
    `,
    'm5-l1': `
      <p><code>git log</code> is like <strong>a scrapbook of your project's entire history</strong>.</p>
      <p>Imagine you kept a diary of every single thing you did on a project, with photos, dates, and captions. That's what git log gives you!</p>
      <p>Without flags, <code>git log</code> shows every commit in full detail — like reading every diary entry from start to finish. It's informative but can be overwhelming in a large project.</p>
      <p><code>git log --oneline</code> is like <strong>a table of contents</strong> for your diary. Just one line per entry — enough to know what happened without reading every detail.</p>
      <p><code>git log --graph --all --decorate</code> is like <strong>a family tree</strong> of your commits. You can see branches splitting off and merging back like branches on an actual tree. This is the most beautiful and useful view!</p>
      <p>Aliases make this even easier: set <code>git lg</code> to mean the full graph view. Then you just type two letters to see the entire history visually!</p>
    `,
    'm5-l2': `
      <p>Git's inspection tools are like <strong>being a detective investigating your code's past</strong>.</p>
      <p><strong>git diff</strong> is like holding two versions of a document and running a <strong>highlighter</strong> over the differences. Added lines are green. Removed lines are red. You can compare any two points in time: two commits, two branches, or your working file vs the last commit.</p>
      <p><strong>git blame</strong> is like going through a textbook and seeing <strong>who wrote each sentence in the margin</strong>. "This sentence — written by Alice on June 3rd." "This paragraph — written by Bob on May 20th." It doesn't mean "who's at fault" — it means "who knows about this code and can help if I have questions."</p>
      <p><strong>git bisect</strong> is like a <strong>super-smart game of "hot and cold"</strong> to find where a bug was introduced. You tell Git: "Commit A was good (no bug). Current commit is bad (has a bug)." Git then jumps to the middle commit and asks: "Good or bad?" You answer. It splits again. After about 10 questions (for 1000 commits), Git pinpoints the EXACT commit that introduced the bug!</p>
    `,
    'm6-l1': `
      <p>Rebasing is like <strong>rewriting history to make it look cleaner</strong>.</p>
      <p>Imagine you're keeping a diary. In real life, things happen out of order. You might write: "Woke up. Had cereal for breakfast. ... Oh wait, I forgot: I fed the cat BEFORE breakfast!" Your diary entries are technically accurate but messy.</p>
      <p>With <strong>merge</strong>, you keep the messy but honest timeline. With <strong>rebase</strong>, you go back and edit: "Woke up. Fed the cat. Had cereal." The story is cleaner and easier to read — even if it's not exactly when things happened in real time.</p>
      <p><strong>The golden rule is simple:</strong> If your diary is still in your private notebook (local branch), feel free to rewrite! But if you've already published it (pushed to a shared branch), other people might have read the messy version and started their own stories based on it. Rewriting now would confuse everyone!</p>
      <p>When you rebase and hit conflicts, you resolve them one commit at a time — like fixing each page of the diary one by one rather than trying to fix everything at once.</p>
    `,
    'm6-l2': `
      <p>These advanced Git features are like <strong>specialized tools in a Swiss Army knife</strong>.</p>
      <p><strong>git cherry-pick</strong> is like picking <strong>one specific page from someone else's diary</strong> and adding it to yours. Not the whole diary — just that one perfect page. "That feature branch has a brilliant bug fix in commit abc123. I want ONLY that fix on my branch, nothing else."</p>
      <p><strong>Tags</strong> are like <strong>bookmarks</strong> in your project's history. "Version 1.0 — the first public release!" You can always find this exact spot later, even after 1000 more commits. Annotated tags are like bookmarks WITH a sticky note: "v1.0 — Released to the App Store on June 15, 2024."</p>
      <p><strong>Interactive rebase</strong> is like cleaning up a messy diary before showing it to anyone. You had a messy week: "Add feature", "oops fix typo", "actually fix it properly", "add tests", "remove debug logs". With interactive rebase, you <strong>squash</strong> all 5 of those commits into ONE clean commit: "Add user authentication feature." It looks professional and intentional!</p>
    `,
    'm7-l1': `
      <p>A Pull Request (PR) is like <strong>showing your homework to a friend before turning it in</strong>.</p>
      <p>Imagine you wrote an essay. Before submitting it to the teacher, you send it to a friend: "Hey, I wrote this essay on dinosaurs. Can you look it over?"</p>
      <p>Your friend reads it, highlights a few spelling mistakes, suggests adding a paragraph about the T-Rex, and gives it back with green checkmarks on the good parts. They can even make <strong>specific line comments</strong>: "On line 42, you said 'brontosaurus' isn't a real dinosaur — actually it is again, they reclassified it in 2021!"</p>
      <p>You fix the suggestions and maybe add more commits. Then your friend says "Looks great!" and you submit it together.</p>
      <p>That's a PR: a proposal saying "I want to add my changes." The PR is a space for discussion, review, automated tests (like a spellchecker that runs automatically), and improvements before the change becomes permanent.</p>
      <p>The three merge strategies on GitHub are like different ways to attach your essay:</p>
      <ul>
        <li>Merge commit: adds your whole essay with all its drafts visible</li>
        <li>Squash and merge: combines all drafts into one clean final version</li>
        <li>Rebase and merge: places your changes on top as if you wrote them perfectly in sequence</li>
      </ul>
    `,
    'm7-l2': `
      <p>GitHub Issues and Projects are like <strong>a team's to-do list and bulletin board</strong>.</p>
      <p><strong>Issues</strong> are like sticky notes on a team corkboard. Each sticky note is a task: "Fix login bug 🐛", "Add dark mode ✨", "Update documentation 📝". You can color-code them with labels (red for bugs, green for features), assign them to specific people, and group them into milestones (think: "sprint goals" or "v2.0 release").</p>
      <p>When someone says "Can you add a dark mode?" — you create an issue! Now it's tracked, not forgotten. Anyone can discuss it, add ideas, or volunteer to work on it.</p>
      <p><strong>Projects</strong> are like a <strong>Kanban board with columns</strong>: "To Do", "In Progress", "In Review", "Done". You drag issues across columns as you work on them. Everyone on the team can see the big picture at a glance.</p>
      <p><strong>Branch protection</strong> is like having a security guard at the door of the main branch. The guard checks: "Did your PR get reviewed? Did the automated tests pass? Is your branch up to date?" Only if all checks pass can you merge. This keeps the main branch stable and production-ready!</p>
    `,
    'm8-l1': `
      <p>GitHub Actions is like <strong>hiring a robot assistant for your repository</strong>.</p>
      <p>Imagine every time you finish writing some code and push it to GitHub, a tiny robot appears and automatically:</p>
      <ol>
        <li>Checks if your code follows style rules (linting)</li>
        <li>Runs all your tests to make sure nothing is broken</li>
        <li>Builds your project into a deployable package</li>
        <li>Deploys it to a test server so you can see it live</li>
      </ol>
      <p>And it does all this in about 2 minutes, every time, without complaining, without forgetting steps, without getting tired!</p>
      <p>You tell the robot what to do by writing instructions in a <strong>recipe card (YAML file)</strong> placed in <code>.github/workflows/</code>. Each recipe card describes:</p>
      <ul>
        <li><strong>When</strong> to work (on every push? only on PRs? every night at midnight?)</li>
        <li><strong>What</strong> to do (which tools to run, which commands to execute)</li>
        <li><strong>Where</strong> to work (on Ubuntu? Windows? macOS?)</li>
      </ul>
      <p>The best part: public repositories get <strong>unlimited free robot minutes</strong>!</p>
    `,
    'm8-l2': `
      <p>Advanced GitHub Actions features are like <strong>upgrading your robot assistant with superpowers</strong>.</p>
      <p><strong>Build Matrix</strong> is like having <strong>10 robots instead of 1</strong>. Each robot tests your code on a different setup: one on Node.js 18, one on Node.js 20, one on Windows, one on macOS. All at the same time! In 2 minutes, you know your code works everywhere — not just on your laptop.</p>
      <p><strong>Artifacts</strong> are like <strong>packages the robot prepares and boxes up</strong> for you. The robot builds your app, puts the compiled files in a box (artifact), and stores it. Later, a different robot (the deploy robot) can pick up that box and ship it to a server. This is how professional deployments work — build once, deploy many times.</p>
      <p><strong>Workflow triggers</strong> are like teaching your robot different <strong>events to respond to</strong>:</p>
      <ul>
        <li>"Start when I push code" (<code>on: push</code>)</li>
        <li>"Start when someone creates a PR" (<code>on: pull_request</code>)</li>
        <li>"Start every day at midnight" (<code>on: schedule</code>)</li>
        <li>"Start when I click this button" (<code>on: workflow_dispatch</code>)</li>
      </ul>
      <p>You can chain robots: "Build robot runs first. When it finishes, Deploy robot runs with the artifact." This is called <strong>job dependency</strong> and it creates powerful automated pipelines!</p>
    `,
  };

  /* Expose globally */
  if (typeof window !== 'undefined') {
    window.eli5GitData = eli5GitData;
  }
})();
