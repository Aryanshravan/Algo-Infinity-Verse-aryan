/**
 * ELI5 (Explain Like I'm 5) content for the Ruby on Rails Academy.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5RailsData = {
    // ─── Module 1: Rails MVC Architecture ───
    'rails-mvc-1': `
        <p>Imagine you're building a <strong>restaurant</strong>. You need three teams: someone to <strong>take orders</strong>, a <strong>chef</strong> to cook the food, and a <strong>menu designer</strong> to make things look nice for the customer.</p>
        <p><strong>Ruby on Rails</strong> is a toolkit that sets up those three teams for you. It splits every web app into three clear jobs:</p>
        <ul>
            <li><strong>Model</strong> = the chef — knows the recipes and the ingredients (your data and business rules).</li>
            <li><strong>View</strong> = the menu designer — decides exactly how the dish looks when served (your HTML pages).</li>
            <li><strong>Controller</strong> = the waiter — takes the order, tells the chef, then brings the finished plate back to the customer.</li>
        </ul>
        <p>Rails also loves rules called <strong>conventions</strong>. If you name your table <code>articles</code>, Rails just assumes the model is called <code>Article</code> and the controller is called <code>ArticlesController</code>. No configuration needed — it's like a restaurant where everyone already agreed where the cutlery goes.</p>
        <p>And the "Ruby" part? Ruby is the programming language — famous for being readable like English. Rails is written in Ruby, so you write commands like <code>Article.create(title: "Hello")</code> which reads almost like a sentence.</p>
    `,
    'rails-mvc-2': `
        <p>Let's follow a customer's <strong>plate of spaghetti</strong> through the restaurant — except the customer is a <strong>browser</strong> and the dish is a <strong>webpage</strong>.</p>
        <p><strong>Step 1:</strong> You type <code>localhost:3000/articles</code> in the browser. That's like walking in and saying "I'd like to see all the articles."</p>
        <p><strong>Step 2:</strong> The <strong>Router</strong> (a host at the door) reads the address and says "that goes to the <code>articles</code> table, action <code>index</code>!" It sends you to the right waiter.</p>
        <p><strong>Step 3:</strong> The <strong>controller</strong> (waiter) receives the order and calls the <strong>model</strong> (chef): "give me all the articles."</p>
        <p><strong>Step 4:</strong> The model fetches every article from the <strong>database</strong> (the pantry) and hands them back to the controller.</p>
        <p><strong>Step 5:</strong> The controller passes the articles to the <strong>view</strong> (menu designer), who bakes them into a nice HTML page.</p>
        <p><strong>Step 6:</strong> The finished page is served back to your browser. Enjoy your meal! 🍝</p>
        <p>This loop — request → router → controller → model → view → response — happens hundreds of times a second on every Rails app.</p>
    `,

    // ─── Module 2: Routing ───
    'rails-routing-1': `
        <p>Think of the router as the <strong>reception desk</strong> of a big office building. Every visitor (request) walks in with an address and a mood (the HTTP method like GET or POST), and the receptionist decides exactly which office to send them to.</p>
        <p>The desk's instruction manual lives in one file: <code>config/routes.rb</code>. It's written in a mini-language:</p>
        <pre><code>get "/about", to: "pages#about"</code></pre>
        <p>Translation: "When someone says 'I want to see /about', send them to the <code>about</code> action of the <code>pages</code> controller."</p>
        <p>GET is like asking "please show me something" — a read-only question. POST is like handing over a filled-in form — "please create something." Rails matches BOTH the path <em>and</em> the method, just like the reception desk checks the address and the reason for your visit.</p>
        <p>The best part: you rarely write routes by hand. A single magic word — <code>resources :articles</code> — automatically creates <strong>seven</strong> standard routes for you (show all, show one, create, edit, update, delete). It's like hiring a full reception team with one sentence.</p>
    `,
    'rails-routing-2': `
        <p>Websites are full of relationships: an article <strong>has many</strong> comments, a user <strong>has many</strong> posts. Rails lets your URLs reflect those relationships, like an address that includes both the street and the apartment number.</p>
        <p>Instead of flat URLs like <code>/comments/5</code>, you get <strong>nested</strong> ones:</p>
        <pre><code>resources :articles do
  resources :comments
end</code></pre>
        <p>Now the URL becomes <code>/articles/3/comments</code> — "the comments that belong to article #3." The URL itself tells you the whole story.</p>
        <p>Rails also gives you two handy tools for non-standard actions:</p>
        <ul>
            <li><strong>member</strong> routes act on <em>one</em> item — like a "publish" button on a single article: <code>POST /articles/3/publish</code>.</li>
            <li><strong>collection</strong> routes act on the <em>whole group</em> — like a "search all articles" page: <code>GET /articles/search</code>.</li>
        </ul>
        <p>Remember the order matters: Rails checks routes <strong>top to bottom</strong>, so put specific routes (like <code>/articles/search</code>) above catch-all ones (like <code>/articles/:id</code>) or the search term might be mistaken for an article ID!</p>
    `,

    // ─── Module 3: Controllers ───
    'rails-controllers-1': `
        <p>If the router is the receptionist, the <strong>controller</strong> is the manager. It receives the visitor's request and decides what to do with it.</p>
        <p>Every public method in a controller is an <strong>action</strong>. An action has a simple three-step recipe:</p>
        <ul>
            <li><strong>Grab</strong> what you need (usually from the database).</li>
            <li><strong>Decide</strong> what the user should see next.</li>
            <li><strong>Pass</strong> that info to a matching view.</li>
        </ul>
        <p>Data arrives in the <code>params</code> hash — a big bag that holds everything the browser sent: URL segments like <code>params[:id]</code>, query strings, and form data.</p>
        <p>Rails has an important safety rule called <strong>strong parameters</strong>. When a user submits a form, you can't just dump everything into the database — a hacker might sneak in extra fields like <code>admin = true</code>! Instead you <strong>permit</strong> only the safe fields:</p>
        <pre><code>params.require(:article).permit(:title, :body)</code></pre>
        <p>Translation: "I require an <code>article</code> from the form, and I'll only trust these two fields." Everything else is quietly ignored. Like a bouncer who checks each bag before it enters the club.</p>
    `,
    'rails-controllers-2': `
        <p>Controllers often have to do the same check before <strong>every</strong> action — like verifying the user is logged in, or finding the record that matches the URL. Copy-pasting that into 10 actions would be messy, so Rails has <strong>filters</strong>.</p>
        <p>A filter is a method that runs automatically before (or after) your actions:</p>
        <pre><code>before_action :set_article, only: [:show, :edit, :update]</code></pre>
        <p>Translation: "Before showing, editing, or updating, go find the right article first." One line, and the boilerplate is gone.</p>
        <p>Once an action finishes, the controller makes a choice — and it's usually one of two words:</p>
        <ul>
            <li><strong>render</strong> — show a page. The default: render the view with the same name as the action.</li>
            <li><strong>redirect_to</strong> — send the browser to a <em>different</em> URL (a fresh request). Used after saving or deleting something, so a page refresh doesn't resubmit the form.</li>
        </ul>
        <p>Think of <code>render</code> as "serve this dish right now" and <code>redirect</code> as "send the customer to another table." If a filter needs to stop things early (like "not logged in!"), it can halt the action by rendering or redirecting itself — the action below never runs.</p>
    `,

    // ─── Module 4: ActiveRecord & Migrations ───
    'rails-activerecord-1': `
        <p>Databases are strict and speak a formal language called SQL. Ruby is friendly and chatty. <strong>Migrations</strong> are the translator that lets Rails describe database changes in Ruby, then converts them into SQL for you.</p>
        <p>When you want to add a table, you generate a migration:</p>
        <pre><code>bin/rails generate migration CreateArticles title:string body:text</code></pre>
        <p>Rails writes a file that looks like:</p>
        <pre><code>create_table :articles do |t|
  t.string :title
  t.text :body
  t.timestamps
end</code></pre>
        <p>It reads like plain English: "make a table of articles with a title, a body, and timestamps."</p>
        <p>Two important ideas:</p>
        <ul>
            <li><strong>Migration</strong> — a single step that changes the schema. You run it with <code>bin/rails db:migrate</code>.</li>
            <li><strong>Rollback</strong> — if you made a mistake, Rails can usually undo the last migration: <code>bin/rails db:rollback</code>. It's like a time machine for your database structure.</li>
        </ul>
        <p>Every migration is saved in the <code>db/migrate</code> folder with a timestamp — that's your database's history book. Team members run <code>db:migrate</code> on their machines and get the exact same schema.</p>
    `,
    'rails-activerecord-2': `
        <p><strong>ActiveRecord</strong> is Rails' magic translator between Ruby code and database rows. It lets you do database things using natural sentences.</p>
        <p>One tiny class connects to a whole table:</p>
        <pre><code>class Article &lt; ApplicationRecord
end</code></pre>
        <p>Because the model is named <code>Article</code>, ActiveRecord automatically knows it talks to the <code>articles</code> table. That's <strong>convention over configuration</strong> in action.</p>
        <p>Now the everyday operations read like English:</p>
        <ul>
            <li><code>Article.all</code> → "give me every article"</li>
            <li><code>Article.find(5)</code> → "find the article with id 5"</li>
            <li><code>Article.where(published: true)</code> → "all published articles"</li>
            <li><code>Article.create(title: "Hi")</code> → "make and save a new article"</li>
            <li><code>article.update(title: "Bye")</code> → "change this article's title"</li>
            <li><code>article.destroy</code> → "delete it"</li>
        </ul>
        <p>ActiveRecord also handles the safety details for you. It protects against <strong>SQL injection</strong> (when a hacker types code into a form field) by safely quoting values, and it gives every row a <code>id</code> plus automatic <code>created_at</code> / <code>updated_at</code> timestamps. You get a full data toolbox without writing a single line of SQL.</p>
    `,
    'rails-activerecord-3': `
        <p>Real apps are full of relationships: a user <strong>owns</strong> articles, an article <strong>has</strong> comments. ActiveRecord makes these relationships one typed line in the model.</p>
        <pre><code>class Article &lt; ApplicationRecord
  has_many :comments
end

class Comment &lt; ApplicationRecord
  belongs_to :article
end</code></pre>
        <p>That's it — now Rails understands the link and gives you instant shortcuts:</p>
        <ul>
            <li><code>article.comments</code> → "every comment on this article"</li>
            <li><code>comment.article</code> → "which article this comment belongs to"</li>
            <li><code>article.comments.create(body: "Nice!")</code> → "add a new comment to this article"</li>
        </ul>
        <p>Under the hood it works because the <code>comments</code> table has an <code>article_id</code> column — the foreign key. That's the "glue" that links each comment to its parent article.</p>
        <p>There are other relationship types too:</p>
        <ul>
            <li><strong>has_one</strong> — a profile that belongs to exactly one user (like a passport to one person).</li>
            <li><strong>has_many :through</strong> — a connection through a middle table (like "books through a reading list").</li>
        </ul>
        <p>And the golden rule: if you add <code>has_many :comments</code>, the table that stores the link gets a column called <code>article_id</code> — Rails always puts the foreign key on the side with <code>belongs_to</code>. No guessing required.</p>
    `,

    // ─── Module 5: Views & Templating ───
    'rails-views-1': `
        <p>Views are how Rails writes the HTML your browser sees. They use a magic ingredient called <strong>ERB</strong> (Embedded Ruby) — HTML files with a few Ruby sprinkles inside.</p>
        <p>The two sprinkles are:</p>
        <pre><code>&lt;% if @article.published? %&gt;
  This is published!
&lt;% end %&gt;</code></pre>
        <ul>
            <li><code>&lt;% ... %&gt;</code> runs Ruby code but shows nothing (the "thinking" tag).</li>
            <li><code>&lt;%= ... %&gt;</code> runs Ruby and <strong>prints</strong> the result (the "speaking" tag). The equals sign means "show me this!"</li>
        </ul>
        <p>Just remember: <strong>no equals = think only, equals sign = speak</strong>.</p>
        <p>Every page also has a <strong>layout</strong> — the shared shell around all your pages (header, nav, footer). The view's content is dropped into the layout at the <code>&lt;%= yield %&gt;</code> line, like a puzzle piece clicking into place.</p>
        <p>And to avoid repeating yourself, Rails has <strong>partials</strong> — small reusable chunks named with an underscore, like <code>_comment.html.erb</code>. Render it anywhere with one line: <code>&lt;%= render "comment", comment: @comment %&gt;</code>. Write once, reuse everywhere.</p>
    `,
    'rails-views-2': `
        <p>Writing forms and links by hand is tedious — and error-prone. Rails gives you <strong>helpers</strong>, tiny functions that write the HTML for you.</p>
        <p>Links are the simplest:</p>
        <pre><code>&lt;%= link_to "Read more", article_path(@article) %&gt;</code></pre>
        <p>Instead of guessing URLs, you call a named <strong>path helper</strong> like <code>article_path(@article)</code> — Rails figures out the correct URL (<code>/articles/5</code>) for you. Change a route once and every link in the app updates automatically.</p>
        <p>Forms use <code>form_with</code>, which is clever in two ways:</p>
        <pre><code>&lt;%= form_with model: @article do |form| %&gt;
  &lt;%= form.text_field :title %&gt;
  &lt;%= form.submit %&gt;
&lt;% end %&gt;</code></pre>
        <ul>
            <li>It <strong>auto-detects the URL</strong> — a new article goes to the create action, an existing one goes to the update action.</li>
            <li>It generates safe, standards-compliant HTML with correct <code>name</code> attributes like <code>article[title]</code>, so the controller receives a tidy <code>params[:article]</code> hash.</li>
        </ul>
        <p>Helpers are all about <strong>Don't Repeat Yourself</strong>: you describe what you want at a high level, and Rails handles the fiddly HTML details — including escaping dangerous characters so user input can't break your page.</p>
    `,

    // ─── Module 6: Authentication ───
    'rails-auth-1': `
        <p>Authentication answers one question: <strong>"Who are you?"</strong> On the web, the most common way to prove it is a username plus a password.</p>
        <p>Rails makes the safe parts easy. The first rule of passwords: <strong>never store the real password</strong>. If your database leaked, every user's password would be public. Instead, you store a scrambled fingerprint called a <strong>hash</strong>.</p>
        <p>Rails ships with <code>has_secure_password</code> — a single line that activates this whole safety system:</p>
        <pre><code>class User &lt; ApplicationRecord
  has_secure_password
end</code></pre>
        <p>Add a <code>password_digest</code> column via a migration, and Rails automatically:</p>
        <ul>
            <li>Hashes the password before saving (using the <code>bcrypt</code> gem).</li>
            <li>Never stores the plain text version.</li>
            <li>Gives you <code>user.authenticate("password123")</code> to check a login attempt — returns the user if correct, <code>false</code> if not.</li>
            <li>Requires a <code>password</code> and <code>password_confirmation</code> when creating the user.</li>
        </ul>
        <p>Why hashing and not encryption? <strong>Encryption</strong> is reversible — someone with the key can read the password. <strong>Hashing</strong> is a one-way street: you can compute the hash from the password, but you can't compute the password from the hash. Even if an attacker steals the database, all they get is scrambled goop.</p>
    `,
    'rails-auth-2': `
        <p>Passwords get checked once, at login. But how does the app remember you on the next request? A cookie called the <strong>session</strong>.</p>
        <p>When you log in, Rails stores your user ID in a small, signed cookie in your browser:</p>
        <pre><code>session[:user_id] = @user.id</code></pre>
        <p>Every request after that carries the cookie back, so the app knows "this is user #3." Signing the cookie means nobody can tamper with it — change the ID to 99 and the signature breaks.</p>
        <p>To read it back, a common pattern is a <code>current_user</code> helper:</p>
        <pre><code>def current_user
  @current_user ||= User.find_by(id: session[:user_id])
end</code></pre>
        <p>Translation: "look up the user whose ID is in the session; remember the result." If there's no logged-in user, it returns <code>nil</code>.</p>
        <p>Then you guard protected pages with a filter that halts unauthenticated visitors:</p>
        <pre><code>before_action :require_login

def require_login
  redirect_to login_path, alert: "Please log in" unless current_user
end</code></pre>
        <p>And logging out is as simple as wiping the session clean: <code>session[:user_id] = nil</code>. That's the whole dance: set it on login, read it per request, clear it on logout.</p>
    `,

    // ─── Module 7: Deployment ───
    'rails-deployment-1': `
        <p>Your app runs great on your laptop. But the internet is a different restaurant — busy, noisy, and full of strangers. <strong>Production</strong> is the word for the live environment, and it needs extra care.</p>
        <p>Three things change the most:</p>
        <ul>
            <li><strong>Assets.</strong> CSS and JavaScript files get squashed and fingerprinted (<code>bin/rails assets:precompile</code>), so browsers load one small optimized file with a version in its name.</li>
            <li><strong>Secrets.</strong> API keys and your <code>secret_key_base</code> must live in environment variables — never in the code. Rails reads them with <code>ENV.fetch("DATABASE_URL")</code>, and tools like Rails Encrypted Credentials keep them locked in an encrypted file.</li>
            <li><strong>Database.</strong> Production uses a real server (like PostgreSQL), and schema changes are applied with migrations — the exact same <code>db:migrate</code> you used locally.</li>
        </ul>
        <p>Rails also has a special safety mode: <code>config.force_ssl = true</code> forces every connection onto HTTPS, and <code>config.assets.compile = false</code> turns off on-the-fly asset compiling (which is a security risk in production).</p>
        <p>The golden rule: <strong>never run in development mode in production</strong>. Development mode shows detailed error pages and skips caching — perfect for coding, terrible and dangerous for a live site.</p>
    `,
    'rails-deployment-2': `
        <p>The modern way to ship a Rails app is in a <strong>container</strong> — a portable box that includes the app and everything it needs (Ruby, gems, Node). If it runs on your machine, it runs identically in the cloud.</p>
        <p>A <code>Dockerfile</code> is the recipe for that box:</p>
        <pre><code>FROM ruby:3.2-slim
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY . .
EXPOSE 3000
CMD ["bin/rails", "server"]</code></pre>
        <p>Read it like a checklist: start with Ruby, make a workspace, install the gems, copy the code, open port 3000, run the server. Each line is a layer that Docker caches, so rebuilds are fast.</p>
        <p>Containers are coordinated by <strong>Docker Compose</strong>, which runs all the pieces together — your web container plus a PostgreSQL database container:</p>
        <pre><code>docker compose up</code></pre>
        <p>The deployment checklist stays the same every time:</p>
        <ol>
            <li>Build the container image.</li>
            <li>Run database migrations.</li>
            <li>Precompile assets.</li>
            <li>Start the web server (Puma).</li>
        </ol>
        <p>Big platforms (Fly.io, Render, Railway, Kubernetes) run this exact flow for you. The app you built locally — recipes, waiters, and all — packs up into a box and opens the same restaurant anywhere in the world.</p>
    `,
    // ─── Module 8: Testing with RSpec ───
    'rails-testing-1': `
        <p>Imagine writing a recipe. A <strong>test</strong> is a tiny robot chef that follows your recipe and tells you if the dish came out right — every single time, in seconds. If you change the recipe, the robot re-checks the whole thing so you never accidentally serve a broken meal.</p>
        <p><strong>TDD</strong> (Test-Driven Development) is a rhythm that professional chefs use:</p>
        <ol>
            <li><strong>Red.</strong> First you write the robot's expectation for a dish you haven't made yet. The test fails — of course it does, the dish doesn't exist!</li>
            <li><strong>Green.</strong> Then you cook just enough to make the robot happy. Test passes.</li>
            <li><strong>Refactor.</strong> Now you tidy the kitchen. The robot still passes, so you know you didn't break anything.</li>
        </ol>
        <p>In Rails, the robot chef is called <strong>RSpec</strong>. You ask it things like "is this article invalid without a title?" and it answers true or false. If you later change how articles work, the robot instantly tells you whether you broke the old rules.</p>
        <p>For test data, you don't want to hand-write fake articles every time. <strong>FactoryBot</strong> is a little machine that produces fresh, valid articles on demand — like an ingredient dispenser that always gives you exactly what a recipe needs.</p>
    `,
    'rails-testing-2': `
        <p>Model tests are like checking that the stove knobs work. <strong>Request tests</strong> are like ordering a full meal from the restaurant — a waiter (HTTP request) goes to the kitchen, gets the plate, and brings it back. You check the plate arrived and looks right.</p>
        <p>A request test actually sends <code>GET /articles</code> to your app and inspects the response:</p>
        <ul>
            <li>Did the kitchen say "OK" (status 200)?</li>
            <li>Did the plate (JSON body) contain the article title?</li>
            <li>When you POST a new order, did the kitchen create it and reply "Created" (status 201)?</li>
        </ul>
        <p><strong>Feature tests</strong> go one step further. They open a real browser and act like a customer: type a title, click the button, and confirm the new article appears on screen. It's the closest thing to having a human tester who never gets tired.</p>
        <p>Think of the three levels as an onion: model tests check the core logic, request tests check the plumbing to the kitchen, and feature tests check the whole dining experience.</p>
    `,
    // ─── Module 9: Background Jobs & ActiveJob ───
    'rails-jobs-1': `
        <p>Imagine you're a cashier. A customer pays, and then asks you to also bake their wedding cake (takes 30 minutes). If you bake the cake right there, every customer behind them waits forever. That's what happens when slow work blocks a web request.</p>
        <p><strong>Background jobs</strong> fix this: you write the order on a ticket and drop it in a queue. A different worker — in another room, at your own pace — picks it up and bakes the cake. The customer goes home happy, and the line keeps moving.</p>
        <p>In Rails, a job is just a class with a <code>perform</code> method. You say <code>ProcessImageJob.perform_later(image.id)</code> — that's "drop the ticket in the queue." The worker later runs it.</p>
        <p>The queue itself is like a different restaurant kitchen. Out of the box Rails uses a small in-process kitchen that forgets everything on restart. In production you plug in a real kitchen — <strong>Sidekiq</strong> (uses Redis), <strong>Delayed Job</strong> (uses the database), or <strong>Solid Queue</strong>. Switching kitchens is a one-line config change; your recipes don't change at all.</p>
        <p>One golden rule: hand the worker a ticket number (the record <em>id</em>), not the cake itself. The worker looks up the record when it starts, so the data is always fresh.</p>
    `,
    'rails-jobs-2': `
        <p>Some chores repeat — like taking out the trash every morning. A <strong>scheduler</strong> is an alarm clock that reminds the worker to do the job at a set time. A cron expression like <code>0 8 * * *</code> just means "every day at 8:00 AM."</p>
        <p>Workers are human too — sometimes the electricity goes out (a database hiccup) or the supplier is unreachable (a down API). Instead of giving up, the worker tries again. <strong>Retries</strong> mean the job is attempted again after a short wait, each time a bit later (exponential backoff). You can say "try at most 3 times, then give up."</p>
        <p>A <strong>dashboard</strong> (like Sidekiq's) is the manager's window into the kitchen: how many jobs are waiting, how many are being worked, and which ones failed completely. If the waiting line keeps growing, you know the workers can't keep up.</p>
        <p>Because a job may run twice after a retry, jobs should be <strong>idempotent</strong> — like a recipe that's safe to cook twice. If the first run already charged the customer, the second run should notice "already paid" and stop, instead of charging them again.</p>
    `,
    // ─── Module 10: Hotwire: Turbo & Stimulus ───
    'rails-hotwire-1': `
        <p>Imagine a waiter who, every time you ask for something, runs back to the kitchen, brings the full menu, and takes you to a brand-new table. That's how old websites worked — every click reloaded everything. <strong>Turbo Drive</strong> is a smarter waiter: when you click a link, it fetches only what changed and slides it into place. The page feels instant, and the CSS/JS stay loaded.</p>
        <p><strong>Turbo Frames</strong> make it even smarter. Say the page has a comments section. With a frame around it, submitting a new comment only refreshes that section — the rest of the page (the article, the sidebar, the header) doesn't move. It's like swapping only the coffee cup on the table instead of re-setting the entire dinner table.</p>
        <p>The magic: you get this "app feel" without writing any JavaScript framework. The server still sends plain HTML. Rails 7+ ships Hotwire out of the box, so your existing knowledge of views, controllers, and forms all still applies.</p>
        <p>Sometimes a full SPA (React/Vue) is still the right choice — when you need heavy client-side state, offline support, or a canvas-heavy app. But for classic server-rendered apps, Hotwire gets you 90% of the way with a fraction of the complexity.</p>
    `,
    'rails-hotwire-2': `
        <p>Now the page doesn't even need a refresh. <strong>Turbo Streams</strong> are like walkie-talkies: when a new comment is created, a broadcast message goes out to every open browser, and each one quietly adds the new comment to the list. No reloading, no polling every second — the update just appears.</p>
        <p>Streams speak a small set of actions — <code>append</code> (add to the end), <code>prepend</code> (add to the start), <code>replace</code> (swap one item), <code>remove</code> (delete). Rails even broadcasts automatically from model callbacks: "when a comment is created, append it to the article's comment list."</p>
        <p><strong>Stimulus</strong> is for the tiny bits of behavior that HTML can't do alone — dropdowns, toggles, lazy-loaded panels. A Stimulus <em>controller</em> is a small JavaScript class attached to an element with <code>data-controller</code>. It's not a framework that owns the page; it just sprinkles interactivity on top of the HTML Rails already rendered.</p>
        <p>Working together: Turbo Streams decide <em>what HTML arrives</em>, Stimulus decides <em>how the page behaves</em>. That combo covers most real-time features — chat, to-do lists, live notifications — while your server stays the single source of truth.</p>
    `,
    // ─── Module 11: Building JSON APIs ───
    'rails-api-1': `
        <p>Imagine a restaurant that only serves takeout — no dining room, no tables, no waiters. That's <strong>API mode</strong>: Rails skips the view layer entirely and only serves data (JSON), which other apps — mobile phones, SPAs, other servers — can consume.</p>
        <p>When a client asks for articles, your controller replies with <code>render json: articles</code> — a tidy box of data instead of a rendered web page. The client decides how to display it.</p>
        <p>Status codes are like the restaurant's replies:</p>
        <ul>
            <li><code>200 OK</code> — "Here's your food."</li>
            <li><code>201 Created</code> — "I made that for you, here it is."</li>
            <li><code>204 No Content</code> — "Done, nothing to hand back."</li>
            <li><code>422 Unprocessable Entity</code> — "I can't serve that — the order is invalid."</li>
        </ul>
        <p><strong>Strong parameters</strong> act like a bouncer: the kitchen only accepts the ingredients it expects. Even if a client tries to sneak in extra fields, they're ignored. Data in and data out stay clean and predictable.</p>
    `,
    'rails-api-2': `
        <p>A raw <code>render json: model</code> hands over the whole fridge — every attribute, including secrets. <strong>Serializers</strong> are like a catering menu: they decide exactly which dishes (fields) the client is allowed to see, and how to plate them.</p>
        <p>APIs grow and change, but clients may be running old versions. <strong>Versioning</strong> solves this like hotel floors: <code>/api/v1/articles</code> and <code>/api/v2/articles</code> are separate kitchens. You can renovate v2 all you want, while v1 keeps serving old clients exactly as before.</p>
        <p><strong>Bearer tokens</strong> are like a VIP key card. The client presents <code>Authorization: Bearer &lt;token&gt;</code> on every request, and the server checks whether the card is valid before letting them in. If the key is wrong, they get a polite "unauthorized" and are turned away.</p>
        <p>Finally, big APIs don't hand over every record at once — they <strong>paginate</strong> (page 1, page 2, like chapters of a book) and <strong>rate-limit</strong> (a customer can't order 1,000 cakes at once). These keep the API fast and fair for everyone.</p>
    `,
};

/* Expose globally for script-tag usage */
window.eli5RailsData = eli5RailsData;
