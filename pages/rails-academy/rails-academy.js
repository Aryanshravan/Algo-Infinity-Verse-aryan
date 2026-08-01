/* ============================================
   RUBY ON RAILS ACADEMY -- Curriculum, State, Playground & Quiz
   ============================================ */

const STORAGE_KEY = 'railsAcademyProgress';

/* ─── Curriculum Data ─── */
const curriculum = [
    {
        id: 'rails-mvc',
        title: 'Rails MVC Architecture',
        lessons: [
            {
                id: 'rails-mvc-1',
                title: 'What is Ruby on Rails?',
                objectives: [
                    'Understand Rails as a full-stack Ruby web framework',
                    'Explain Convention over Configuration and DRY',
                    'Name the three MVC components and their responsibilities',
                    'Recognize the role of Ruby, gems, and Bundler',
                ],
                content: `
                    <h2>What is Ruby on Rails?</h2>
                    <p>Ruby on Rails (often just <strong>Rails</strong>) is a full-stack web framework written in <strong>Ruby</strong>. It was extracted by David Heinemeier Hansson from the project management tool <em>Basecamp</em> in 2004, and it powers famous products like GitHub, Shopify, Airbnb, and GitLab.</p>

                    <h3>Two guiding philosophies</h3>
                    <ul>
                        <li><strong>Convention over Configuration (CoC)</strong> — Rails makes assumptions about how you want to structure things. If you name your table <code>articles</code>, Rails assumes the model is <code>Article</code>, the controller is <code>ArticlesController</code>, and the views live in <code>app/views/articles/</code>. You write almost zero config because the defaults are already right.</li>
                        <li><strong>Don't Repeat Yourself (DRY)</strong> — every piece of knowledge lives in exactly one place. A model's validations, associations, and callbacks are defined once and reused everywhere.</li>
                    </ul>

                    <h3>The MVC pattern</h3>
                    <p>Rails organizes code into three layers, mirroring Model-View-Controller:</p>
                    <ul>
                        <li><strong>Model</strong> — talks to the database (via ActiveRecord), holds business logic and validations. Lives in <code>app/models/</code>.</li>
                        <li><strong>View</strong> — the HTML (and JSON/XML) templates presented to the user. Lives in <code>app/views/</code>.</li>
                        <li><strong>Controller</strong> — receives requests, coordinates models and views, and returns responses. Lives in <code>app/controllers/</code>.</li>
                    </ul>

                    <h3>Ruby, gems, and Bundler</h3>
                    <p>Ruby is a readable, expressive language — <code>5.times { puts "hello" }</code> is valid Ruby. Rails is distributed as a <strong>gem</strong> (a packaged library), and the app's other libraries are declared in a <code>Gemfile</code>. <strong>Bundler</strong> installs and locks exact versions with <code>bundle install</code> and <code>Gemfile.lock</code>, so every machine runs identical code.</p>
                `,
                takeaways: [
                    'Rails is a Ruby full-stack framework powering Shopify, GitHub, and Basecamp',
                    'Convention over Configuration means smart defaults, not boilerplate config',
                    'MVC splits work into Model (data), View (HTML), and Controller (glue)',
                    'Gems + Bundler keep library versions reproducible across machines',
                ],
                revision: [
                    { label: 'Ruby on Rails Guides — Getting Started', url: 'https://guides.rubyonrails.org/getting_started.html', tag: 'Docs' },
                    { label: 'Express.js Academy (Node backend comparison)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'NestJS Academy (modular backend comparison)', url: '/pages/nestjs-academy/nestjs-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  # One line -> seven RESTful routes
  resources :articles
end`,
            },
            {
                id: 'rails-mvc-2',
                title: 'The MVC Request Cycle',
                objectives: [
                    'Trace a request from URL to response',
                    'Identify the role of the router in dispatching requests',
                    'Explain how the controller coordinates model and view',
                    'Describe how rendering produces the final HTML',
                ],
                content: `
                    <h2>The Request Lifecycle</h2>
                    <p>Every interaction with a Rails app follows the same loop. Let's trace a request to <code>GET /articles/3</code>.</p>

                    <h3>1. The Router dispatches</h3>
                    <p>Rack hands the raw HTTP request to the <strong>Router</strong>, which reads <code>config/routes.rb</code>. It matches <code>GET /articles/3</code> to the <code>show</code> action of <code>ArticlesController</code>, and the <code>:id</code> segment becomes <code>params[:id] = "3"</code>.</p>

                    <h3>2. The Controller coordinates</h3>
                    <p><code>ArticlesController#show</code> calls the model: <code>@article = Article.find(params[:id])</code>. The controller doesn't know (or care) about SQL — it asks the model, and the model queries the database. The result is exposed to the view as an instance variable.</p>

                    <h3>3. The View renders</h3>
                    <p>By default, the controller renders the template matching its action: <code>app/views/articles/show.html.erb</code>. ERB templates mix HTML with embedded Ruby, and the layout (<code>app/views/layouts/application.html.erb</code>) wraps the view at its <code>&lt;%= yield %&gt;</code> line.</p>

                    <h3>4. The response returns</h3>
                    <p>The finished HTML is sent back to the browser as an HTTP response. If the action is a JSON API, the view can render JSON instead with <code>render json: @article</code>.</p>

                    <div class="callout">
                        <div class="callout-title">One mental model</div>
                        <p><code>Request → Router → Controller → Model → Database → Model → Controller → View → Response</code>. Memorize this loop and everything else in Rails is just a variation on it.</p>
                    </div>
                `,
                takeaways: [
                    'The router maps HTTP method + path to a controller action',
                    'The controller is a thin coordinator between model and view',
                    'The view renders HTML, wrapped by the application layout',
                    'The loop is: request → router → controller → model → view → response',
                ],
                revision: [
                    { label: 'Ruby on Rails — Action Controller Overview', url: 'https://guides.rubyonrails.org/action_controller_overview.html', tag: 'Docs' },
                    { label: 'API Design Learning', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'WebSocket & SSE Academy', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  # Nested resource: comments live under their article
  resources :articles do
    resources :comments
  end
end`,
            },
        ],
        quiz: [
            {
                id: 'q-mvc-1',
                question: 'Which layer of MVC is responsible for interacting with the database and holding business logic?',
                options: ['View', 'Controller', 'Model', 'Router'],
                correct: 2,
            },
            {
                id: 'q-mvc-2',
                question: 'What does "Convention over Configuration" mean in Rails?',
                options: [
                    'You must write a config file for every component',
                    'Rails provides sensible defaults so you write less configuration',
                    'Configuration files are generated automatically at runtime',
                    'Rails only works with a specific database',
                ],
                correct: 1,
            },
            {
                id: 'q-mvc-3',
                question: 'In the request lifecycle, what runs between the router and the view?',
                options: ['The layout', 'The controller', 'The Gemfile', 'The database migration'],
                correct: 1,
            },
        ],
    },
    {
        id: 'rails-routing',
        title: 'Routing & RESTful Resources',
        lessons: [
            {
                id: 'rails-routing-1',
                title: 'The Rails Router',
                objectives: [
                    'Read and write routes in config/routes.rb',
                    'Explain how resources generates seven RESTful routes',
                    'Distinguish route matching by HTTP verb and path',
                    'Use custom routes with the to: option',
                ],
                content: `
                    <h2>config/routes.rb</h2>
                    <p>The router is the entry point of every request. It lives in <code>config/routes.rb</code> and maps <em>HTTP verb + path</em> pairs to controller actions.</p>

                    <pre><code>Rails.application.routes.draw do
  get "/about", to: "pages#about"
  resources :articles
end</code></pre>

                    <h3>The resources magic</h3>
                    <p>A single <code>resources :articles</code> generates seven RESTful routes for the <code>articles</code> resource:</p>
                    <table class="compare-table">
                        <thead>
                            <tr><th>Verb</th><th>Path</th><th>Action</th><th>Purpose</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>GET</td><td>/articles</td><td>index</td><td>list all</td></tr>
                            <tr><td>GET</td><td>/articles/new</td><td>new</td><td>render new form</td></tr>
                            <tr><td>POST</td><td>/articles</td><td>create</td><td>save new record</td></tr>
                            <tr><td>GET</td><td>/articles/:id</td><td>show</td><td>display one</td></tr>
                            <tr><td>GET</td><td>/articles/:id/edit</td><td>edit</td><td>render edit form</td></tr>
                            <tr><td>PATCH</td><td>/articles/:id</td><td>update</td><td>save changes</td></tr>
                            <tr><td>DELETE</td><td>/articles/:id</td><td>destroy</td><td>delete record</td></tr>
                        </tbody>
                    </table>

                    <h3>Routing priority</h3>
                    <p>Routes are matched <strong>top to bottom</strong>, and the first match wins. Since <code>/articles/new</code> would also match <code>/articles/:id</code>, Rails declares the fixed <code>new</code> route <em>before</em> the dynamic <code>:id</code> route. As a rule, put specific routes above general ones.</p>

                    <h3>Path helpers</h3>
                    <p>Each route automatically creates helpers like <code>articles_path</code>, <code>article_path(@article)</code>, <code>new_article_path</code>, and <code>edit_article_path</code>. Views and controllers use these instead of hardcoding URLs.</p>
                `,
                takeaways: [
                    'routes.rb maps HTTP verb + path → controller#action',
                    'resources :articles creates seven RESTful routes in one line',
                    'First matching route wins, so order matters',
                    'Path helpers (articles_path, article_path) replace hardcoded URLs',
                ],
                revision: [
                    { label: 'Ruby on Rails — Routing Guide', url: 'https://guides.rubyonrails.org/routing.html', tag: 'Docs' },
                    { label: 'API Design Learning', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                    { label: 'gRPC & Protobuf Academy (REST comparison)', url: '/pages/grpc-academy/grpc-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  # Custom route: /about -> PagesController#about
  get "about", to: "pages#about"

  # RESTful resource
  resources :articles
end`,
            },
            {
                id: 'rails-routing-2',
                title: 'Nested & Custom Routes',
                objectives: [
                    'Nest resources to model parent-child relationships in URLs',
                    'Add member and collection routes for extra actions',
                    'Explain the constraints option for path matching',
                    'Match routes by format (HTML vs JSON)',
                ],
                content: `
                    <h2>Beyond the Basics</h2>
                    <p>Real apps have relationships, and Rails reflects them in the URL structure with <strong>nested resources</strong>.</p>

                    <pre><code>resources :articles do
  resources :comments
  member do
    post :publish
  end
  collection do
    get :search
  end
end</code></pre>

                    <h3>Nested resources</h3>
                    <p>Nesting <code>comments</code> inside <code>articles</code> produces URLs like <code>/articles/3/comments</code>. The parent ID is available as <code>params[:article_id]</code> and the comment ID as <code>params[:id]</code>. The controller can scope its query:</p>
                    <pre><code>@comments = @article.comments</code></pre>

                    <h3>Member vs collection routes</h3>
                    <ul>
                        <li><strong>Member routes</strong> operate on a single resource instance — <code>POST /articles/3/publish</code>. The path contains <code>:id</code>.</li>
                        <li><strong>Collection routes</strong> operate on the whole collection — <code>GET /articles/search</code>. No <code>:id</code>.</li>
                    </ul>
                    <p>Collection routes must be declared <em>before</em> the dynamic show route (which would otherwise capture <code>search</code> as an <code>:id</code>).</p>

                    <h3>Constraints & defaults</h3>
                    <p>Constrain dynamic segments with a regex:</p>
                    <pre><code>get "articles/:id", to: "articles#show", constraints: { id: /[0-9]+/ }</code></pre>
                    <p>Now a request to <code>/articles/abc</code> won't match — Rails keeps looking. You can also scope routes by format so the same path can serve HTML and JSON differently.</p>
                `,
                takeaways: [
                    'Nested resources produce URLs like /articles/3/comments',
                    'Member routes act on one record; collection routes act on the group',
                    'Declare collection routes before the dynamic :id route',
                    'Constraints restrict dynamic segments, e.g. :id => /[0-9]+/',
                ],
                revision: [
                    { label: 'Ruby on Rails — Nested Routes Guide', url: 'https://guides.rubyonrails.org/routing.html#nested-resources', tag: 'Docs' },
                    { label: 'System Design Academy', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                    { label: 'REST API Learning', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles do
    resources :comments
    collection do
      get :search
    end
    member do
      post :publish
    end
  end
end`,
            },
        ],
        quiz: [
            {
                id: 'q-route-1',
                question: 'How many routes does a single `resources :articles` declaration generate?',
                options: ['Four', 'Five', 'Seven', 'Ten'],
                correct: 2,
            },
            {
                id: 'q-route-2',
                question: 'Which URL pattern matches a nested comments resource under articles?',
                options: ['/comments/3/articles', '/articles/3/comments', '/comments?article=3', '/articles-comments/3'],
                correct: 1,
            },
            {
                id: 'q-route-3',
                question: 'A collection route like `get :search` maps to which path?',
                options: ['/articles/:id/search', '/articles/search/:id', '/articles/search', '/search/articles'],
                correct: 2,
            },
        ],
    },
    {
        id: 'rails-controllers',
        title: 'Controllers & Params',
        lessons: [
            {
                id: 'rails-controllers-1',
                title: 'Actions, Params & Strong Parameters',
                objectives: [
                    'Write controller actions that render views',
                    'Read data from params including URL segments and form data',
                    'Apply strong parameters to whitelist form input',
                    'Explain mass assignment protection',
                ],
                content: `
                    <h2>Controller Actions</h2>
                    <p>Controllers inherit from <code>ApplicationController</code>. Each public method is an <strong>action</strong> that the router can dispatch to. Actions typically follow a three-step pattern: fetch data, decide, then hand off to a view.</p>

                    <pre><code>class ArticlesController &lt; ApplicationController
  def index
    @articles = Article.all
  end

  def show
    @article = Article.find(params[:id])
  end

  def create
    @article = Article.new(article_params)
    if @article.save
      redirect_to @article, notice: "Article created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def article_params
    params.require(:article).permit(:title, :body)
  end
end</code></pre>

                    <h3>params</h3>
                    <p>Everything the request carries is available through the <code>params</code> hash: URL segments (<code>params[:id]</code>), query strings (<code>?page=2</code>), and form data submitted under a key like <code>params[:article]</code>.</p>

                    <h3>Strong Parameters</h3>
                    <p>You must <strong>permit</strong> which fields may be mass-assigned to a model. Without this, a malicious form could sneak in <code>admin: true</code> or an unexpected <code>user_id</code>. <code>require(:article).permit(:title, :body)</code> demands an <code>article</code> key and whitelists only <code>title</code> and <code>body</code>; everything else is dropped.</p>

                    <div class="callout">
                        <div class="callout-title">Safety first</div>
                        <p>Rails raises <code>ActionController::ParameterMissing</code> if <code>require(:article)</code> is missing, and silently ignores any field not in <code>permit</code>. Always pass strong parameters when creating or updating records.</p>
                    </div>
                `,
                takeaways: [
                    'A controller action is a public method that renders a matching view by default',
                    'params bundles URL segments, query strings, and form data',
                    'Strong parameters whitelist safe fields and block mass assignment attacks',
                    'render :new with a status shows errors after a failed save',
                ],
                revision: [
                    { label: 'Ruby on Rails — Action Controller Overview', url: 'https://guides.rubyonrails.org/action_controller_overview.html', tag: 'Docs' },
                    { label: 'Express.js Academy (request handling comparison)', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                    { label: 'API Design Learning', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles
end`,
            },
            {
                id: 'rails-controllers-2',
                title: 'Filters, Render & Redirect',
                objectives: [
                    'Use before_action filters to remove duplicated setup',
                    'Differentiate render from redirect_to',
                    'Apply filters conditionally with only and except',
                    'Halt an action early from within a filter',
                ],
                content: `
                    <h2>Controller Filters</h2>
                    <p>When several actions need the same setup — like loading a record or checking login — a <strong>filter</strong> runs code before (or after) actions automatically.</p>

                    <pre><code>class ArticlesController &lt; ApplicationController
  before_action :set_article, only: [:show, :edit, :update, :destroy]

  def show
    # @article is already set by the filter
  end

  private

  def set_article
    @article = Article.find(params[:id])
  end
end</code></pre>

                    <p>Use <code>only</code> to run the filter for a few actions, or <code>except</code> to run it for all but a few. A filter can also <strong>halt</strong> the request by rendering or redirecting — the action below it never runs. That's exactly how a <code>require_login</code> filter protects pages.</p>

                    <h3>render vs redirect_to</h3>
                    <ul>
                        <li><code>render :new</code> — renders a template in the current request (no new request). Use after a failed save to redisplay the form with errors. Set a status like <code>status: :unprocessable_entity</code>.</li>
                        <li><code>redirect_to @article</code> — sends the browser a new request to another URL. Use after a successful save or delete so refreshing the page doesn't resubmit.</li>
                    </ul>

                    <pre><code>def update
  if @article.update(article_params)
    redirect_to @article, notice: "Updated."
  else
    render :edit, status: :unprocessable_entity
  end
end</code></pre>

                    <p>The rule of thumb: <strong>render</strong> shows a page without leaving the current request; <strong>redirect</strong> starts a brand-new request elsewhere.</p>
                `,
                takeaways: [
                    'before_action runs shared setup before listed actions',
                    'A filter can halt the request by rendering or redirecting',
                    'render shows a template in the current request',
                    'redirect_to starts a new request (prevent form resubmission)',
                ],
                revision: [
                    { label: 'Ruby on Rails — Filters Guide', url: 'https://guides.rubyonrails.org/action_controller_overview.html#filters', tag: 'Docs' },
                    { label: 'NestJS Academy (guards comparison)', url: '/pages/nestjs-academy/nestjs-academy.html', tag: 'Related' },
                    { label: 'API Design Learning', url: '/pages/learning/api-design-learning/api-design-learning.html', tag: 'Revision' },
                ],
                defaultCode: `Rails.application.routes.draw do
  get "dashboard", to: "dashboard#show"
  resources :articles
end`,
            },
        ],
        quiz: [
            {
                id: 'q-ctrl-1',
                question: 'Which method extracts and whitelists safe fields from form input?',
                options: ['params.filter', 'params.sanitize', 'params.require(:article).permit(:title)', 'params.allow(:title)'],
                correct: 2,
            },
            {
                id: 'q-ctrl-2',
                question: 'What happens when a before_action filter renders or redirects?',
                options: [
                    'The action runs, then the render is ignored',
                    'The filter halts the request and the action never runs',
                    'Both the filter and the action run twice',
                    'Rails raises a double render error',
                ],
                correct: 1,
            },
            {
                id: 'q-ctrl-3',
                question: 'After a successful create, which is the correct response pattern?',
                options: [
                    'render :new',
                    'render :create, status: :created',
                    'redirect_to @article',
                    'head :no_content',
                ],
                correct: 2,
            },
        ],
    },
    {
        id: 'rails-activerecord',
        title: 'ActiveRecord & Migrations',
        lessons: [
            {
                id: 'rails-activerecord-1',
                title: 'Migrations',
                objectives: [
                    'Generate and run migrations to evolve the schema',
                    'Write create_table and add_column migrations',
                    'Rollback a migration to undo a change',
                    'Understand the role of db/schema.rb',
                ],
                content: `
                    <h2>Migrations — Schema as Code</h2>
                    <p>Migrations are a versioned, Ruby-based way to change the database schema. They live in <code>db/migrate/</code> with a timestamp prefix, forming a history of every change.</p>

                    <pre><code>bin/rails generate migration CreateArticles title:string body:text published:boolean</code></pre>

                    <p>That generates a migration like:</p>

                    <pre><code>class CreateArticles &lt; ActiveRecord::Migration[7.1]
  def change
    create_table :articles do |t|
      t.string :title
      t.text :body
      t.boolean :published, default: false
      t.timestamps
    end
  end
end</code></pre>

                    <p>Run it with <code>bin/rails db:migrate</code>. The <code>change</code> method is smart enough to both apply and reverse the migration — a <code>create_table</code> rolls back by dropping the table, so <code>bin/rails db:rollback</code> undoes the last change automatically.</p>

                    <h3>Changing an existing table</h3>
                    <pre><code>bin/rails generate migration AddAuthorToArticles author:string

class AddAuthorToArticles &lt; ActiveRecord::Migration[7.1]
  def change
    add_column :articles, :author, :string
  end
end</code></pre>

                    <h3>db/schema.rb</h3>
                    <p>After migrating, Rails regenerates <code>db/schema.rb</code> — the authoritative snapshot of the schema. New developers run <code>bin/rails db:create db:migrate</code> and get the exact same structure. Schema changes are coordinated across the team through migrations, not ad-hoc SQL.</p>
                `,
                takeaways: [
                    'Migrations are versioned Ruby files describing schema changes',
                    'bin/rails db:migrate applies them; db:rollback undoes the last one',
                    'The change method is reversible for create_table and add_column',
                    'db/schema.rb is the generated snapshot of your schema',
                ],
                revision: [
                    { label: 'Ruby on Rails — Active Record Migrations', url: 'https://guides.rubyonrails.org/active_record_migrations.html', tag: 'Docs' },
                    { label: 'PostgreSQL Learning', url: '/pages/postgresql-learning/postgresql-learning.html', tag: 'Related' },
                    { label: 'SQLite Academy', url: '/pages/sqlite-academy/sqlite-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles
end`,
            },
            {
                id: 'rails-activerecord-2',
                title: 'ActiveRecord Models & CRUD',
                objectives: [
                    'Define a model that maps to a database table',
                    'Use ActiveRecord query methods like find, where, and all',
                    'Create, update, and destroy records',
                    'Understand validations and how save behaves',
                ],
                content: `
                    <h2>Models that Speak SQL</h2>
                    <p>ActiveRecord is Rails' Object-Relational Mapping (ORM). A model class maps to a table and gives you an English-like query API.</p>

                    <pre><code>class Article &lt; ApplicationRecord
  validates :title, presence: true
  validates :body, length: { minimum: 10 }
end</code></pre>

                    <p>Because the class is <code>Article</code>, ActiveRecord maps it to the <code>articles</code> table — no configuration required (Convention over Configuration again).</p>

                    <h3>Reading records</h3>
                    <pre><code>Article.all                                    # all articles
Article.find(3)                                # article with id 3 (raises if missing)
Article.find_by(title: "Hello")                # first matching, nil if none
Article.where(published: true).order(:title)   # scoped, lazy query
Article.count                                  # number of rows
Article.exists?(5)                             # true/false</code></pre>

                    <h3>Writing records</h3>
                    <pre><code>Article.create(title: "Hi", body: "Hello world!")   # build + save in one call
article = Article.new(title: "Hi")
article.body = "Hello world!"
article.save                                          # persists if valid

article.update(title: "Updated title")                # saves and returns true/false
article.destroy                                       # deletes the row
article.destroyed?                                    # true after destroy</code></pre>

                    <p><code>save</code> runs validations first and returns <code>false</code> if they fail, leaving the object unpersisted with errors at <code>article.errors.full_messages</code>. ActiveRecord also escapes values safely to prevent <strong>SQL injection</strong>.</p>
                `,
                takeaways: [
                    'A model class automatically maps to its pluralized table name',
                    'find raises; find_by returns nil; where returns a chainable relation',
                    'create builds and saves; update persists; destroy deletes',
                    'Validations run on save, and errors live in object.errors',
                ],
                revision: [
                    { label: 'Ruby on Rails — Active Record Basics', url: 'https://guides.rubyonrails.org/active_record_basics.html', tag: 'Docs' },
                    { label: 'MongoDB Academy (NoSQL comparison)', url: '/pages/mongodb-academy/index.html', tag: 'Related' },
                    { label: 'Redis Academy', url: '/pages/redis-academy/redis-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles
end`,
            },
            {
                id: 'rails-activerecord-3',
                title: 'Associations',
                objectives: [
                    'Define has_many and belongs_to associations',
                    'Understand the foreign key convention',
                    'Use association methods like article.comments',
                    'Describe has_one and has_many :through',
                ],
                content: `
                    <h2>Model Relationships</h2>
                    <p>Associations connect models so you can navigate relationships in plain Ruby. Two lines in the models wire up the whole relationship:</p>

                    <pre><code>class Article &lt; ApplicationRecord
  has_many :comments
end

class Comment &lt; ApplicationRecord
  belongs_to :article
end</code></pre>

                    <h3>The foreign key convention</h3>
                    <p>Rails infers that the <code>comments</code> table has an <code>article_id</code> column. The <code>belongs_to</code> side stores the foreign key — if you call <code>comment.article</code>, Rails runs <code>Article.find(comment.article_id)</code>.</p>

                    <h3>Association methods</h3>
                    <pre><code>article.comments               # all comments for this article
article.comments.count
comment.article                # parent article
article.comments.build(body: "Nice!")   # unsaved child
article.comments.create(body: "Nice!")  # build + save child</code></pre>

                    <h3>Other association types</h3>
                    <ul>
                        <li><strong>has_one</strong> — a one-to-one link, e.g. <code>User has_one :profile</code>.</li>
                        <li><strong>has_many :through</strong> — a many-to-many link through a join model, e.g. <code>Doctor has_many :patients, through: :appointments</code>.</li>
                        <li><strong>dependent</strong> — <code>has_many :comments, dependent: :destroy</code> deletes children when the parent is destroyed, avoiding orphaned rows.</li>
                    </ul>
                `,
                takeaways: [
                    'has_many / belongs_to define the link; the foreign key lives on the belongs_to side',
                    'article.comments and comment.article are instant query shortcuts',
                    'has_one models a one-to-one relationship',
                    'dependent: :destroy cleans up children when a parent is removed',
                ],
                revision: [
                    { label: 'Ruby on Rails — Associations Guide', url: 'https://guides.rubyonrails.org/association_basics.html', tag: 'Docs' },
                    { label: 'Neo4j Academy (graph relationships)', url: '/pages/neo4j-academy/neo4j-academy.html', tag: 'Related' },
                    { label: 'PostgreSQL Learning', url: '/pages/postgresql-learning/postgresql-learning.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles do
    resources :comments
  end
end`,
            },
        ],
        quiz: [
            {
                id: 'q-ar-1',
                question: 'Which command runs pending migrations?',
                options: ['bin/rails db:create', 'bin/rails db:migrate', 'bin/rails db:rollback', 'bin/rails db:reset'],
                correct: 1,
            },
            {
                id: 'q-ar-2',
                question: 'What does `Article.find_by(title: "Hello")` return when no record matches?',
                options: ['Raises RecordNotFound', 'An empty array', 'nil', 'false'],
                correct: 2,
            },
            {
                id: 'q-ar-3',
                question: 'For a `has_many :comments` / `belongs_to :article` pair, where does the foreign key column live?',
                options: ['articles table (article_id)', 'comments table (article_id)', 'Both tables', 'A separate join table'],
                correct: 1,
            },
        ],
    },
    {
        id: 'rails-views',
        title: 'Views & ERB Templating',
        lessons: [
            {
                id: 'rails-views-1',
                title: 'ERB Templates & Layouts',
                objectives: [
                    'Write ERB templates mixing HTML and Ruby',
                    'Differentiate execution tags from output tags',
                    'Use layouts with yield to wrap pages',
                    'Create reusable partials',
                ],
                content: `
                    <h2>ERB — Embedded Ruby</h2>
                    <p>Views live in <code>app/views/</code> and use ERB (<code>.html.erb</code>) to inject dynamic content into HTML. ERB adds two tags to plain HTML:</p>

                    <pre><code>&lt;% if @article.published? %&gt;
  &lt;p class="badge"&gt;Published&lt;/p&gt;
&lt;% else %&gt;
  &lt;p class="badge muted"&gt;Draft&lt;/p&gt;
&lt;% end %&gt;

&lt;h1&gt;&lt;%= @article.title %&gt;&lt;/h1&gt;</code></pre>

                    <ul>
                        <li><code>&lt;% ... %&gt;</code> — executes Ruby without output (if/else, loops, variable assignment).</li>
                        <li><code>&lt;%= ... %&gt;</code> — executes Ruby and prints the result into the page.</li>
                    </ul>

                    <h3>Layouts</h3>
                    <p>The layout <code>app/views/layouts/application.html.erb</code> holds the shared page shell. The view's output is inserted where the layout calls <code>&lt;%= yield %&gt;</code>:</p>
                    <pre><code>&lt;html&gt;
  &lt;head&gt;&lt;%= csrf_meta_tags %&gt;&lt;%= csp_meta_tag %&gt;&lt;/head&gt;
  &lt;body&gt;
    &lt;header&gt;&lt;%= render "shared/nav" %&gt;&lt;/header&gt;
    &lt;%= yield %&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>

                    <h3>Partials</h3>
                    <p>A partial is a reusable snippet whose filename starts with an underscore, e.g. <code>_comment.html.erb</code>. Render it anywhere:</p>
                    <pre><code>&lt;%= render "comment", comment: @comment %&gt;</code></pre>
                    <p>Partials enforce DRY: one definition, many call sites. Rails also auto-escapes output, so user content like <code>&lt;script&gt;</code> can't execute in the browser (XSS protection).</p>
                `,
                takeaways: [
                    'ERB injects Ruby into HTML via <% %> (execute) and <%= %> (output)',
                    'The layout wraps every view at its yield call',
                    'Partials (filename with leading underscore) are reusable view snippets',
                    'Rails auto-escapes output to block XSS attacks',
                ],
                revision: [
                    { label: 'Ruby on Rails — Action View Overview', url: 'https://guides.rubyonrails.org/action_view_overview.html', tag: 'Docs' },
                    { label: 'Tailwind CSS Academy (styling)', url: '/pages/tailwind-academy/tailwind-academy.html', tag: 'Related' },
                    { label: 'Bootstrap Academy (UI components)', url: '/pages/bootstrap-learning/bootstrap-learning.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles
end`,
            },
            {
                id: 'rails-views-2',
                title: 'Helpers & Forms',
                objectives: [
                    'Use link_to and path helpers in views',
                    'Build forms with form_with',
                    'Understand how form fields map to params',
                    'Use view helpers to render reusable UI',
                ],
                content: `
                    <h2>View Helpers</h2>
                    <p>Helpers are Ruby methods that generate HTML. They keep templates clean and safe.</p>

                    <h3>link_to</h3>
                    <pre><code>&lt;%= link_to "Read more", article_path(@article) %&gt;
&lt;%= link_to "Back to articles", articles_path %&gt;
&lt;%= link_to "Edit", edit_article_path(@article), class: "btn" %&gt;</code></pre>
                    <p>The path helpers (<code>articles_path</code>, <code>article_path(@article)</code>) generate URLs from the route definitions — update a route and every link updates automatically.</p>

                    <h3>form_with</h3>
                    <p><code>form_with</code> builds standards-compliant forms and figures out the URL itself:</p>
                    <pre><code>&lt;%= form_with model: @article do |form| %&gt;
  &lt;div&gt;
    &lt;%= form.label :title %&gt;
    &lt;%= form.text_field :title %&gt;
  &lt;/div&gt;
  &lt;div&gt;
    &lt;%= form.label :body %&gt;
    &lt;%= form.text_area :body, rows: 6 %&gt;
  &lt;/div&gt;
  &lt;%= form.submit %&gt;
&lt;% end %&gt;</code></pre>

                    <ul>
                        <li>For a <strong>new</strong> record it POSTs to the create action; for an <strong>existing</strong> record it PATCHes to the update action — automatically.</li>
                        <li>Field names become <code>article[title]</code>, so the controller receives a nested <code>params[:article]</code> hash matching strong parameters.</li>
                        <li>It includes a hidden CSRF token automatically, protecting against cross-site request forgery.</li>
                    </ul>

                    <h3>Rendering collections</h3>
                    <pre><code>&lt;% @articles.each do |article| %&gt;
  &lt;%= render article %&gt;
&lt;% end %&gt;</code></pre>
                    <p>Rendering a model directly looks up the matching <code>_article.html.erb</code> partial — collections render themselves.</p>
                `,
                takeaways: [
                    'link_to + path helpers generate safe, route-aware URLs',
                    'form_with auto-selects create vs update based on record persistence',
                    'Field names like article[title] nest into params[:article]',
                    'form_with adds a CSRF token automatically',
                ],
                revision: [
                    { label: 'Ruby on Rails — Form Helpers Guide', url: 'https://guides.rubyonrails.org/form_helpers.html', tag: 'Docs' },
                    { label: 'Frontend Design Skill', url: '/pages/design-patterns/design-patterns.html', tag: 'Related' },
                    { label: 'Angular Academy (forms comparison)', url: '/pages/angular-academy/angular-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles
end`,
            },
        ],
        quiz: [
            {
                id: 'q-view-1',
                question: 'Which ERB tag prints the value of a Ruby expression into the page?',
                options: ['<% ... %>', '<%= ... %>', '<%# ... %>', '<%% ... %>'],
                correct: 1,
            },
            {
                id: 'q-view-2',
                question: 'Where does a view insert its content into the application layout?',
                options: ['At <%= content_for %>', 'At <%= yield %>', 'At <%= render %>', 'At <%= partial %>'],
                correct: 1,
            },
            {
                id: 'q-view-3',
                question: 'When form_with receives an existing record, which HTTP method does it use?',
                options: ['POST', 'PUT', 'PATCH', 'DELETE'],
                correct: 2,
            },
        ],
    },
    {
        id: 'rails-auth',
        title: 'Authentication',
        lessons: [
            {
                id: 'rails-auth-1',
                title: 'Authentication Fundamentals',
                objectives: [
                    'Explain why passwords must be hashed, not stored',
                    'Use has_secure_password with bcrypt',
                    'Understand the password_digest column',
                    'Authenticate a login attempt with user.authenticate',
                ],
                content: `
                    <h2>Password Security</h2>
                    <p>Authentication answers <strong>"who are you?"</strong>. The most common proof is a password — but storing plain-text passwords is catastrophic if the database leaks. The fix is <strong>hashing</strong>.</p>

                    <h3>Hashing vs encryption</h3>
                    <ul>
                        <li><strong>Encryption</strong> is reversible — with the key you can decrypt and read the password.</li>
                        <li><strong>Hashing</strong> is one-way — you can compute the hash from the password, but you cannot recover the password from the hash.</li>
                    </ul>

                    <h3>has_secure_password</h3>
                    <p>Rails ships with <code>has_secure_password</code> (backed by the <code>bcrypt</code> gem). First, add a <code>password_digest</code> column via a migration, then:</p>

                    <pre><code>class User &lt; ApplicationRecord
  has_secure_password
end</code></pre>

                    <p>This one line provides:</p>
                    <ul>
                        <li>Automatic hashing of <code>password</code> into <code>password_digest</code> before save.</li>
                        <li>A <code>user.authenticate("password123")</code> method that returns the user if the password matches, <code>false</code> otherwise.</li>
                        <li>Built-in validation requiring a <code>password</code> and matching <code>password_confirmation</code>.</li>
                    </ul>

                    <pre><code>user = User.new(email: "ada@example.com", password: "hunter2", password_confirmation: "hunter2")
user.save
user.authenticate("hunter2")   # => #&lt;User id: 1, ...&gt;
user.authenticate("wrong")     # => false</code></pre>

                    <h3>Why bcrypt?</h3>
                    <p>bcrypt is deliberately <em>slow</em> — it runs thousands of hash iterations. That slows down legitimate logins by milliseconds but makes offline brute-force attacks against a stolen hash database impractically expensive.</p>
                `,
                takeaways: [
                    'Never store plain-text passwords — store a one-way hash',
                    'has_secure_password (bcrypt) adds hashing and authenticate automatically',
                    'The password_digest column stores the bcrypt hash',
                    'user.authenticate returns the user on success, false on failure',
                ],
                revision: [
                    { label: 'Ruby on Rails — Securing Rails Applications', url: 'https://guides.rubyonrails.org/security.html', tag: 'Docs' },
                    { label: 'Firebase Academy (hosted auth)', url: '/pages/firebase-academy/firebase-academy.html', tag: 'Related' },
                    { label: 'Supabase Academy (managed auth)', url: '/pages/supabase-academy/supabase-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :users
end`,
            },
            {
                id: 'rails-auth-2',
                title: 'Sessions & Current User',
                objectives: [
                    'Store the logged-in user ID in a signed session cookie',
                    'Implement a current_user helper',
                    'Guard actions with a before_action login filter',
                    'Log out by clearing the session',
                ],
                content: `
                    <h2>Sessions Keep You Logged In</h2>
                    <p>HTTP is stateless — each request is brand new. The <strong>session</strong> is a small, signed cookie that persists a bit of data (like <code>user_id</code>) between requests.</p>

                    <h3>Logging in</h3>
                    <pre><code>class SessionsController &lt; ApplicationController
  def create
    user = User.find_by(email: params[:email])
    if user&.authenticate(params[:password])
      session[:user_id] = user.id
      redirect_to root_path, notice: "Welcome back!"
    else
      flash.now[:alert] = "Invalid email or password"
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    session[:user_id] = nil
    redirect_to root_path, notice: "Signed out."
  end
end</code></pre>

                    <h3>Reading it back</h3>
                    <p>Every request carries the cookie, so the current user can be looked up:</p>
                    <pre><code>class ApplicationController &lt; ActionController::Base
  helper_method :current_user

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id])
  end

  def require_login
    return if current_user

    redirect_to login_path, alert: "Please log in first."
  end
end</code></pre>

                    <h3>Protecting pages</h3>
                    <pre><code>class ArticlesController &lt; ApplicationController
  before_action :require_login, except: [:index, :show]
end</code></pre>

                    <p><code>require_login</code> halts the request (redirects) when there's no logged-in user — the action never runs. The cookie is <strong>signed</strong>, so a user can't tamper with <code>user_id</code> without breaking the signature. Logging out is simply clearing the session key.</p>
                `,
                takeaways: [
                    'session[:user_id] persists login across requests via a signed cookie',
                    'current_user memoizes the lookup for the request',
                    'before_action :require_login guards protected actions',
                    'Logging out clears session[:user_id]',
                ],
                revision: [
                    { label: 'Ruby on Rails — Sessions Guide', url: 'https://guides.rubyonrails.org/action_controller_overview.html#session', tag: 'Docs' },
                    { label: 'Auth System Learning', url: '/pages/auth/auth.html', tag: 'Related' },
                    { label: 'System Design Academy (session design)', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                ],
                defaultCode: `Rails.application.routes.draw do
  get "login", to: "sessions#new"
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"
  resources :users
end`,
            },
        ],
        quiz: [
            {
                id: 'q-auth-1',
                question: 'Why are passwords hashed instead of encrypted?',
                options: [
                    'Hashing is faster than encryption',
                    'Hashing is one-way, so stolen hashes can\'t be reversed to plain text',
                    'Encryption is deprecated in Ruby',
                    'Hashes take up less disk space',
                ],
                correct: 1,
            },
            {
                id: 'q-auth-2',
                question: 'Which single line activates bcrypt-based password handling in a User model?',
                options: ['bcrypt_password', 'has_password', 'has_secure_password', 'authenticates_with'],
                correct: 2,
            },
            {
                id: 'q-auth-3',
                question: 'What does `user.authenticate("wrong")` return when the password is incorrect?',
                options: ['nil', 'false', 'Raises an error', 'An empty hash'],
                correct: 1,
            },
        ],
    },
    {
        id: 'rails-deployment',
        title: 'Deployment',
        lessons: [
            {
                id: 'rails-deployment-1',
                title: 'Production Readiness',
                objectives: [
                    'Explain what changes between development and production',
                    'Precompile assets and run migrations during deploy',
                    'Secure secrets with environment variables and credentials',
                    'Force HTTPS and disable on-the-fly asset compilation',
                ],
                content: `
                    <h2>From Laptop to Production</h2>
                    <p>Development mode optimizes for the developer; production optimizes for speed and safety. Moving to production changes several things.</p>

                    <h3>1. Assets</h3>
                    <p>CSS and JavaScript are combined, minified, and fingerprinted:</p>
                    <pre><code>bin/rails assets:precompile</code></pre>
                    <p>Browsers get one optimized bundle with a content-based filename, enabling far-future caching.</p>

                    <h3>2. Database migrations</h3>
                    <p>Production schema changes go through the same <code>bin/rails db:migrate</code> pipeline. On deploy, run migrations before restarting the server so the code and schema stay in sync.</p>

                    <h3>3. Secrets</h3>
                    <p>API keys, database URLs, and <code>secret_key_base</code> must never live in the repo. Options:</p>
                    <ul>
                        <li><strong>Environment variables</strong> — read with <code>ENV.fetch("DATABASE_URL")</code>, injected by the platform.</li>
                        <li><strong>Rails Encrypted Credentials</strong> — <code>config/credentials.yml.enc</code> stores secrets encrypted; the <code>master.key</code> is kept out of version control.</li>
                    </ul>

                    <h3>4. Hardening</h3>
                    <pre><code>config.force_ssl = true      # redirect all traffic to HTTPS
config.assets.compile = false  # never compile assets on demand</code></pre>
                    <p><code>force_ssl</code> encrypts all traffic; <code>assets.compile = false</code> closes a route that could be abused to execute code. Also use a real database server like PostgreSQL in production — not SQLite.</p>
                `,
                takeaways: [
                    'Precompile assets and run migrations as part of every deploy',
                    'Keep secrets in environment variables or encrypted credentials',
                    'force_ssl enforces HTTPS; assets.compile=false closes an attack vector',
                    'Development and production behave differently — never run dev mode live',
                ],
                revision: [
                    { label: 'Ruby on Rails — Configuring Guide', url: 'https://guides.rubyonrails.org/configuring.html', tag: 'Docs' },
                    { label: 'Docker & K8s Academy', url: '/pages/docker-kubernetes-academy/docker-kubernetes-academy.html', tag: 'Related' },
                    { label: 'Deploy to Vercel Skill', url: '/pages/aws-academy/aws-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles
end`,
            },
            {
                id: 'rails-deployment-2',
                title: 'Deploying with Docker',
                objectives: [
                    'Write a Dockerfile for a Rails app',
                    'Run web and database containers with Docker Compose',
                    'Apply the deploy checklist: build, migrate, precompile, serve',
                    'Identify platforms that host Rails containers',
                ],
                content: `
                    <h2>Containerizing Rails</h2>
                    <p>A container packages the app with its entire runtime — Ruby, gems, Node, system libraries — so it runs identically anywhere.</p>

                    <h3>A minimal Dockerfile</h3>
                    <pre><code>FROM ruby:3.2-slim
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY . .
EXPOSE 3000
CMD ["bin/rails", "server"]</code></pre>
                    <p>Read it as a recipe: start from the Ruby base image, set a working directory, install gems (cached as a layer), copy the code, open port 3000, and boot the server with Puma.</p>

                    <h3>Docker Compose</h3>
                    <p>Compose orchestrates multiple containers. A typical setup runs the web app plus a PostgreSQL database as linked services, so <code>docker compose up</code> brings up the whole stack.</p>

                    <h3>The deploy checklist</h3>
                    <ol>
                        <li>Build the image.</li>
                        <li>Run migrations: <code>bin/rails db:migrate</code>.</li>
                        <li>Precompile assets: <code>bin/rails assets:precompile</code>.</li>
                        <li>Serve with Puma, bound to the container's exposed port.</li>
                    </ol>

                    <h3>Hosting options</h3>
                    <p>Platforms like <strong>Fly.io</strong>, <strong>Render</strong>, <strong>Railway</strong>, <strong>Heroku</strong>, and <strong>Kubernetes</strong> run this flow for you. Heroku pioneered the buildpack approach (detect Ruby, run migrations via release phase); the container approach does the same thing but with a fully reproducible image.</p>
                `,
                takeaways: [
                    'A Dockerfile packages the app with its full runtime',
                    'Docker Compose links web and database containers together',
                    'Deploy = build image → run migrations → precompile → start Puma',
                    'Fly.io, Render, Railway, and Kubernetes run Rails containers',
                ],
                revision: [
                    { label: 'Docker & K8s Academy', url: '/pages/docker-kubernetes-academy/docker-kubernetes-academy.html', tag: 'Related' },
                    { label: 'AWS Academy', url: '/pages/aws-academy/aws-academy.html', tag: 'Related' },
                    { label: 'System Design Academy', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Revision' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles
end`,
            },
        ],
        quiz: [
            {
                id: 'q-deploy-1',
                question: 'Which command precompiles CSS/JS for production in Rails?',
                options: [
                    'bin/rails assets:build',
                    'bin/rails assets:precompile',
                    'bin/rails assets:optimize',
                    'npm run build',
                ],
                correct: 1,
            },
            {
                id: 'q-deploy-2',
                question: 'Which config setting forces all traffic over HTTPS?',
                options: [
                    'config.force_https = true',
                    'config.ssl = true',
                    'config.force_ssl = true',
                    'config.https_only = true',
                ],
                correct: 2,
            },
            {
                id: 'q-deploy-3',
                question: 'In a Rails Dockerfile, what does the final CMD do?',
                options: [
                    'Installs Ruby gems',
                    'Precompiles assets',
                    'Starts the Rails/Puma web server',
                    'Runs database migrations',
                ],
                correct: 2,
            },
        ],
    },
    {
        id: 'rails-testing',
        title: 'Testing with RSpec',
        lessons: [
            {
                id: 'rails-testing-1',
                title: 'Test-Driven Development in Rails',
                objectives: [
                    'Explain the red-green-refactor cycle',
                    'Set up rspec-rails in a Rails app',
                    'Write model specs using expectations and matchers',
                    'Generate test data with FactoryBot instead of fixtures',
                ],
                content: `
                    <h2>Red, Green, Refactor</h2>
                    <p>Tests are the safety net that lets you change code fearlessly. <strong>Test-Driven Development (TDD)</strong> is a rhythm:</p>
                    <ol>
                        <li><strong>Red</strong> — write a failing test that describes the behavior you want.</li>
                        <li><strong>Green</strong> — write the smallest amount of code to make it pass.</li>
                        <li><strong>Refactor</strong> — clean up the code while the test keeps you honest.</li>
                    </ol>

                    <h3>Setting up RSpec</h3>
                    <p>Add the gem, then generate the spec helper:</p>
                    <pre><code># Gemfile
group :development, :test do
  gem "rspec-rails"
end

bin/rails generate rspec:install</code></pre>
                    <p>Specs live under <code>spec/</code> mirroring the app structure — <code>spec/models/</code>, <code>spec/requests/</code>, and so on.</p>

                    <h3>A model spec</h3>
                    <pre><code># spec/models/article_spec.rb
RSpec.describe Article, type: :model do
  it "is invalid without a title" do
    article = Article.new(title: nil, body: "Hello")
    expect(article).not_to be_valid
    expect(article.errors[:title]).to include("can't be blank")
  end

  it "updates the slug when saved" do
    article = Article.create!(title: "Hello World", body: "Hi")
    expect(article.slug).to eq("hello-world")
  end
end</code></pre>
                    <p>Run everything with <code>bin/rails spec</code> or a single file with <code>bin/rails spec spec/models/article_spec.rb</code>.</p>

                    <h3>FactoryBot for test data</h3>
                    <p>Fixtures are static YAML and break as models evolve. <strong>FactoryBot</strong> builds fresh, valid records on demand:</p>
                    <pre><code>FactoryBot.define do
  factory :article do
    title { "Hello" }
    body  { "A test body" }
  end
end

article = create(:article)          # saved
draft   = build(:article, title: nil)  # not saved</code></pre>
                `,
                takeaways: [
                    'TDD cycles red → green → refactor with each change',
                    'rspec-rails adds a spec/ folder mirroring the app',
                    'expect(thing).to matcher is the core RSpec assertion',
                    'FactoryBot builds fresh valid records instead of static fixtures',
                ],
                revision: [
                    { label: 'RSpec Docs', url: 'https://rspec.info/', tag: 'Docs' },
                    { label: 'Ruby on Rails — Testing Guide', url: 'https://guides.rubyonrails.org/testing.html', tag: 'Docs' },
                    { label: 'TypeScript Academy', url: '/pages/typescript-academy/typescript-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles
end`,
            },
            {
                id: 'rails-testing-2',
                title: 'Request & Feature Specs',
                objectives: [
                    'Exercise controllers with request specs',
                    'Assert on response codes and JSON bodies',
                    'Drive the full UI with Capybara feature specs',
                    'Understand the difference between spec types',
                ],
                content: `
                    <h2>Testing the HTTP Layer</h2>
                    <p>Model specs check logic; <strong>request specs</strong> check the whole round trip — router, controller, and serializer — by sending real HTTP requests to the app.</p>

                    <h3>A request spec</h3>
                    <pre><code># spec/requests/articles_spec.rb
RSpec.describe "Articles", type: :request do
  it "lists articles as JSON" do
    create(:article, title: "First")
    get "/articles", as: :json

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["articles"].first["title"]).to eq("First")
  end

  it "creates an article" do
    post "/articles", params: { article: { title: "New", body: "Hi" } }, as: :json

    expect(response).to have_http_status(:created)
    expect(Article.count).to eq(1)
  end
end</code></pre>
                    <p>Each request spec boots the app in a test database, so use transactional tests to roll back between examples.</p>

                    <h3>Feature specs with Capybara</h3>
                    <p>For user-facing flows, <strong>Capybara</strong> drives a real (or headless) browser against the app:</p>
                    <pre><code>RSpec.describe "Article creation", type: :feature do
  it "shows the article after creating it" do
    visit "/articles/new"
    fill_in "Title", with: "Hello Rails"
    click_button "Create Article"

    expect(page).to have_content("Hello Rails")
  end
end</code></pre>
                    <p>Different spec types answer different questions: <strong>model specs</strong> verify logic, <strong>request specs</strong> verify HTTP behavior, <strong>feature specs</strong> verify the user experience.</p>
                `,
                takeaways: [
                    'Request specs send real HTTP calls through the whole stack',
                    'Assert with have_http_status and parsed response bodies',
                    'Capybara feature specs drive a browser for user-facing flows',
                    'Pick the spec type based on what you need to verify',
                ],
                revision: [
                    { label: 'RSpec Request Specs', url: 'https://rspec.info/features/7-0/rspec-rails/request-specs/', tag: 'Docs' },
                    { label: 'Capybara Docs', url: 'https://rubydoc.info/github/teamcapybara/capybara/master', tag: 'Docs' },
                    { label: 'Express Academy', url: '/pages/express-academy/express-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles do
    resources :comments
  end
end`,
            },
        ],
        quiz: [
            {
                id: 'q-test-1',
                question: 'In TDD, what does the "red" phase mean?',
                options: [
                    'The app crashed in production',
                    'A test fails because the feature is not implemented yet',
                    'The code is being refactored',
                    'The database has a deadlock',
                ],
                correct: 1,
            },
            {
                id: 'q-test-2',
                question: 'What does FactoryBot do in Rails tests?',
                options: [
                    'Runs migrations automatically',
                    'Builds fresh valid records for test data',
                    'Minifies JavaScript assets',
                    'Boots the Puma web server',
                ],
                correct: 1,
            },
            {
                id: 'q-test-3',
                question: 'Which RSpec spec type sends real HTTP requests through the whole stack?',
                options: [
                    'Model spec',
                    'View spec',
                    'Request spec',
                    'Helper spec',
                ],
                correct: 2,
            },
        ],
    },
    {
        id: 'rails-jobs',
        title: 'Background Jobs & ActiveJob',
        lessons: [
            {
                id: 'rails-jobs-1',
                title: 'ActiveJob & Queues',
                objectives: [
                    'Explain why long work must leave the request cycle',
                    'Create a job and enqueue it with perform_later',
                    'Swap queue backends via ActiveJob adapters',
                    'Pass safe arguments to jobs',
                ],
                content: `
                    <h2>Don't Make the User Wait</h2>
                    <p>Generating a PDF, sending email, or crunching an image can take seconds. Blocking the web request makes the user stare at a spinner. <strong>Background jobs</strong> move that work to a worker process that runs separately from the web server.</p>

                    <h3>Writing a job</h3>
                    <p>Generate one, then implement <code>perform</code>:</p>
                    <pre><code>bin/rails generate job ProcessImage

# app/jobs/process_image_job.rb
class ProcessImageJob < ApplicationJob
  queue_as :default

  def perform(image_id)
    image = Image.find(image_id)
    image.thumbnail = ImageProcessor.resize(image.file, 480)
    image.save!
  end
end</code></pre>

                    <h3>Enqueuing work</h3>
                    <pre><code>ProcessImageJob.perform_later(image.id)   # run in the background
ProcessImageJob.perform_now(image.id)     # run inline (useful in tests)
ProcessImageJob.set(wait: 5.minutes).perform_later(image.id)  # delayed</code></pre>

                    <h3>Choosing a backend</h3>
                    <p>ActiveJob is an adapter layer. Out of the box it uses the async backend (in-process, lost on restart). In production you plug in a real queue like <strong>Sidekiq</strong> (Redis-backed), <strong>Delayed Job</strong> (database-backed), or <strong>Solid Queue</strong> (the new database default). Switching backends means changing one config line — your job code never changes.</p>

                    <h3>Passing records</h3>
                    <p>Jobs serialize arguments to the queue, so pass <code>image.id</code> and re-fetch inside <code>perform</code> — never pass the record object itself.</p>
                `,
                takeaways: [
                    'Background jobs keep slow work out of the request cycle',
                    'perform_later enqueues; a worker runs it separately',
                    'ActiveJob swaps backends (Sidekiq, Delayed Job, Solid Queue) via config',
                    'Pass record IDs, not record objects, as job arguments',
                ],
                revision: [
                    { label: 'Ruby on Rails — ActiveJob Guide', url: 'https://guides.rubyonrails.org/active_job_basics.html', tag: 'Docs' },
                    { label: 'Sidekiq Docs', url: 'https://sidekiq.org/', tag: 'Docs' },
                    { label: 'Redis Academy', url: '/pages/redis-academy/redis-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :images
end`,
            },
            {
                id: 'rails-jobs-2',
                title: 'Recurring Jobs & Monitoring',
                objectives: [
                    'Schedule repeating work with a cron-like scheduler',
                    'Understand retries and failure handling',
                    'Use a monitoring dashboard for queues',
                    'Write idempotent jobs that can safely rerun',
                ],
                content: `
                    <h2>Scheduling and Resilience</h2>
                    <p>Some work should repeat on a schedule — nightly digests, cache warm-ups, cleanup tasks. A scheduler like <strong>Sidekiq Cron</strong> or <strong>GoodJob</strong> runs jobs at set times.</p>

                    <h3>Scheduled jobs</h3>
                    <pre><code># Sidekiq Cron style
schedule:
  send_daily_digest:
    cron: "0 8 * * *"          # every day at 08:00
    class: SendDailyDigestJob
    queue: default</code></pre>
                    <p>The cron expression has five fields: minute, hour, day of month, month, day of week. <code>0 8 * * *</code> means "at minute 0 of hour 8, every day".</p>

                    <h3>Retries and failure</h3>
                    <p>Jobs fail for transient reasons — a DB hiccup, a down API. ActiveJob/Sidekiq retry automatically with exponential backoff. To opt out or bound retries:</p>
                    <pre><code>class SendEmailJob < ApplicationJob
  sidekiq_options retry: 3        # Sidekiq: retry up to 3 times
  retry_on Timeout::Error, wait: 5, attempts: 3
  discard_on ActiveJob::DeserializationError

  def perform(user_id)
    # ...
  end
end</code></pre>

                    <h3>Monitoring</h3>
                    <p>Sidekiq ships a web dashboard (<code>/sidekiq</code>) showing busy, queued, and dead jobs. Watch for a growing queue — it means workers can't keep up and you need more capacity.</p>

                    <h3>Idempotency</h3>
                    <p>A retried job may run twice. Make jobs <strong>idempotent</strong> — safe to run more than once. For example, a charge job should check whether the charge already exists before charging again.</p>
                `,
                takeaways: [
                    'Schedulers run jobs on a cron schedule (e.g. daily digests)',
                    'Retries with backoff handle transient failures automatically',
                    'The Sidekiq dashboard surfaces busy, queued, and dead jobs',
                    'Idempotent jobs are safe to re-run after a retry',
                ],
                revision: [
                    { label: 'Sidekiq Docs', url: 'https://sidekiq.org/', tag: 'Docs' },
                    { label: 'Sidekiq Cron', url: 'https://github.com/sidekiq-cron/sidekiq-cron', tag: 'Docs' },
                    { label: 'System Design Academy', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :users
end`,
            },
        ],
        quiz: [
            {
                id: 'q-jobs-1',
                question: 'Which method enqueues a job to run in the background?',
                options: [
                    'perform_now',
                    'perform_later',
                    'perform_inline',
                    'run_async',
                ],
                correct: 1,
            },
            {
                id: 'q-jobs-2',
                question: 'What should you pass as arguments to a job?',
                options: [
                    'The full Active Record object',
                    'The object class name',
                    'Record IDs, re-fetching inside perform',
                    'Rendered HTML fragments',
                ],
                correct: 2,
            },
            {
                id: 'q-jobs-3',
                question: 'Why must background jobs be idempotent?',
                options: [
                    'They run on a separate process',
                    'Retries may run them more than once',
                    'They cannot access the database',
                    'They are read-only by default',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'rails-hotwire',
        title: 'Hotwire: Turbo & Stimulus',
        lessons: [
            {
                id: 'rails-hotwire-1',
                title: 'Turbo Drive & Frames',
                objectives: [
                    'Explain how Turbo gives SPA-like speed without JavaScript',
                    'Describe Turbo Drive navigation',
                    'Update page regions with turbo-frames',
                    'Understand when to reach for a real SPA instead',
                ],
                content: `
                    <h2>Fast Without a JS Framework</h2>
                    <p><strong>Hotwire</strong> is Rails' answer to modern interactivity — fast, snappy pages without shipping a React or Vue bundle. Its first piece, <strong>Turbo Drive</strong>, intercepts every link click and form submit, fetches the next page over the network, and swaps in only the HTML <code>body</code> (and <code>head</code>) without a full page reload.</p>

                    <h3>Turbo Drive navigation</h3>
                    <pre><code><%= link_to "Articles", articles_path %>   <!-- intercepted automatically --></code></pre>
                    <p>The browser never does a full reload — the URL updates, the body swaps, and your CSS/JS stay loaded. That alone makes navigation feel instant.</p>

                    <h3>Turbo Frames — partial updates</h3>
                    <p>A <strong>turbo-frame</strong> scopes a navigation to a region of the page. Only the frame's content is replaced; the rest of the page is untouched:</p>
                    <pre><code><div id="comments">
  <%= turbo_frame_tag "comments" do %>
    <% @comments.each do |comment| %>
      <p><%= comment.body %></p>
    <% end %>
  <% end %>
</div></code></pre>
                    <p>Any link or form inside the frame that resolves to the same frame keeps its request within the frame — perfect for inline comment forms, tabs, and paginated lists.</p>

                    <h3>When to choose Hotwire vs an SPA</h3>
                    <p>Hotwire shines for server-rendered, content-heavy apps (the classic Rails use case). Reach for a full SPA when you need complex offline behavior, heavy client state, or a rich interactive canvas.</p>
                `,
                takeaways: [
                    'Turbo Drive swaps the body of the page without a full reload',
                    'turbo-frames scope navigation to a single page region',
                    'Hotwire means SPA-like speed with server-rendered HTML',
                    'Choose an SPA when you need heavy client-side state',
                ],
                revision: [
                    { label: 'Hotwire Docs', url: 'https://hotwired.dev/', tag: 'Docs' },
                    { label: 'Turbo Handbook', url: 'https://turbo.hotwired.dev/', tag: 'Docs' },
                    { label: 'WebSocket & SSE Academy', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles do
    resources :comments
  end
end`,
            },
            {
                id: 'rails-hotwire-2',
                title: 'Turbo Streams & Stimulus',
                objectives: [
                    'Broadcast live updates with turbo-streams',
                    'Reuse stream templates for create/update/destroy',
                    'Write small interactive behaviors with Stimulus controllers',
                    'Combine streaming and Stimulus for real-time UIs',
                ],
                content: `
                    <h2>Real-Time Updates</h2>
                    <p><strong>Turbo Streams</strong> push HTML updates to connected browsers in real time. When an ActionCable broadcast fires, every subscribed browser receives fragments and applies them to the page — no polling, no custom WebSocket code.</p>

                    <h3>Broadcasting after create</h3>
                    <pre><code># app/models/comment.rb
class Comment < ApplicationRecord
  belongs_to :article
  after_create_commit { broadcast_append_to article, target: "comments" }
end</code></pre>
                    <p>The <code>comments</code> partial renders the HTML, and the stream <code>appends</code> it to the target element on every connected page:</p>
                    <pre><code><%= turbo_frame_tag "comments" do %>
  <%= render @article.comments %>
<% end %>
<%= turbo_stream_from @article %></code></pre>

                    <h3>Stream actions</h3>
                    <p>Streams support the core DOM verbs — <code>append</code>, <code>prepend</code>, <code>replace</code>, <code>update</code>, <code>remove</code>. For example, a "mark done" toggle can <code>replace</code> just the todo item when the model changes:</p>
                    <pre><code>after_update_commit { broadcast_replace_to todo_list, target: self }</code></pre>

                    <h3>Stimulus for behavior</h3>
                    <p><strong>Stimulus</strong> adds small sprinkles of JavaScript — a controller is a plain JS class bound to a DOM element via <code>data-controller</code>:</p>
                    <pre><code><button data-controller="dropdown" data-action="click->dropdown#toggle">Menu</button></code></pre>
                    <pre><code>// app/javascript/controllers/dropdown_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["panel"]

  toggle() {
    this.panelTarget.classList.toggle("open")
  }
}</code></pre>
                    <p>The pattern: Turbo streams bring the HTML, Stimulus brings the behavior. Together they build real-time, interactive UIs with plain server-rendered Rails.</p>
                `,
                takeaways: [
                    'turbo-streams broadcast HTML fragments to subscribed browsers',
                    'Model callbacks broadcast append/replace/remove actions',
                    'Stimulus controllers add behavior through data-attributes',
                    'Streams move the data, Stimulus moves the interaction',
                ],
                revision: [
                    { label: 'Turbo Streams Docs', url: 'https://turbo.hotwired.dev/handbook/streams', tag: 'Docs' },
                    { label: 'Stimulus Handbook', url: 'https://stimulus.hotwired.dev/', tag: 'Docs' },
                    { label: 'WebSocket & SSE Academy', url: '/pages/websocket-academy/websocket-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles do
    resources :comments
  end
end`,
            },
        ],
        quiz: [
            {
                id: 'q-hotwire-1',
                question: 'What does Turbo Drive do on link clicks?',
                options: [
                    'Forces a full page reload',
                    'Fetches the page and swaps in only the body',
                    'Runs client-side React rendering',
                    'Disables JavaScript entirely',
                ],
                correct: 1,
            },
            {
                id: 'q-hotwire-2',
                question: 'How do Turbo Streams push updates to browsers?',
                options: [
                    'Browser polling every second',
                    'WebSocket broadcasts of HTML fragments',
                    'Restarting the Puma server',
                    'LocalStorage synchronization',
                ],
                correct: 1,
            },
            {
                id: 'q-hotwire-3',
                question: 'What does a Stimulus controller attach to?',
                options: [
                    'A Ruby class in app/models',
                    'A DOM element via data-controller',
                    'The database schema',
                    'An external npm package only',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'rails-api',
        title: 'Building JSON APIs',
        lessons: [
            {
                id: 'rails-api-1',
                title: 'Rails in API Mode',
                objectives: [
                    'Create a Rails app without the view layer',
                    'Render JSON responses from controllers',
                    'Accept and validate JSON input with strong parameters',
                    'Set correct HTTP status codes',
                ],
                content: `
                    <h2>Rails as an API Server</h2>
                    <p>Rails is a great JSON API server. Generate an <strong>API-only</strong> app to skip the view stack entirely:</p>
                    <pre><code>rails new my_api --api</code></pre>
                    <p>API mode excludes views, assets, and cookies middleware, and configures controllers to render JSON.</p>

                    <h3>Rendering JSON</h3>
                    <pre><code>class ArticlesController < ApplicationController
  def index
    articles = Article.order(created_at: :desc)
    render json: articles
  end

  def show
    render json: Article.find(params[:id])
  end

  def create
    article = Article.new(article_params)
    if article.save
      render json: article, status: :created
    else
      render json: { errors: article.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def article_params
    params.require(:article).permit(:title, :body)
  end
end</code></pre>

                    <h3>Status codes as a contract</h3>
                    <ul>
                        <li><code>200 OK</code> — successful read</li>
                        <li><code>201 Created</code> — successful create</li>
                        <li><code>204 No Content</code> — successful delete</li>
                        <li><code>422 Unprocessable Entity</code> — validation errors</li>
                    </ul>
                    <p>Clients rely on these codes, so choose them deliberately.</p>
                `,
                takeaways: [
                    'rails new --api builds an app without the view layer',
                    'render json: sends JSON, with :status controlling the code',
                    'Strong parameters validate JSON input from clients',
                    'HTTP status codes are part of your API contract',
                ],
                revision: [
                    { label: 'Ruby on Rails — API App Guide', url: 'https://guides.rubyonrails.org/api_app.html', tag: 'Docs' },
                    { label: 'gRPC & Protobuf Academy', url: '/pages/grpc-academy/grpc-academy.html', tag: 'Related' },
                    { label: 'NestJS Academy', url: '/pages/nestjs-academy/nestjs-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  resources :articles
end`,
            },
            {
                id: 'rails-api-2',
                title: 'Serialization, Versioning & Tokens',
                objectives: [
                    'Shape API output with serializers',
                    'Version APIs to avoid breaking clients',
                    'Authenticate API calls with bearer tokens',
                    'Rate-limit and paginate for production APIs',
                ],
                content: `
                    <h2>Designing a Robust API</h2>
                    <p>Returning <code>render json: model</code> leaks every attribute. <strong>Serializers</strong> shape exactly what clients see — pick fields, include associations, and hide internals.</p>

                    <h3>Serializers with JSONAPI or ActiveModel::Serializers</h3>
                    <pre><code># app/serializers/article_serializer.rb
class ArticleSerializer < ActiveModel::Serializer
  attributes :id, :title, :body, :published_at
  belongs_to :author, serializer: AuthorSerializer
end

# controller
render json: Article.first, serializer: ArticleSerializer</code></pre>

                    <h3>Versioning</h3>
                    <p>APIs evolve; clients may not. Version with namespaces so old clients keep working while you ship v2:</p>
                    <pre><code># routes.rb
namespace :api do
  namespace :v1 do
    resources :articles
  end
  namespace :v2 do
    resources :articles
  end
end</code></pre>
                    <p>Requests hit <code>/api/v1/articles</code> or <code>/api/v2/articles</code>, each backed by its own controller that can change freely.</p>

                    <h3>Token authentication</h3>
                    <pre><code>class ApplicationController < ActionController::API
  before_action :authenticate

  private

  def authenticate
    token = request.headers["Authorization"]&.split&.last
    @current_user = User.find_by(api_token: token)
    render json: { error: "unauthorized" }, status: :unauthorized unless @current_user
  end
end</code></pre>
                    <p>Clients send <code>Authorization: Bearer &lt;token&gt;</code> on every request. The token acts like a password for that client app.</p>

                    <h3>Pagination & rate limits</h3>
                    <p>Production APIs paginate large collections (e.g. <code>?page=2</code>) and rate-limit clients to stay fair — gems like <code>kaminari</code> and <code>rack-attack</code> handle both with little code.</p>
                `,
                takeaways: [
                    'Serializers control exactly which fields an API exposes',
                    'Namespace versions (api/v1, api/v2) let you evolve safely',
                    'Bearer tokens authenticate API clients on every request',
                    'Paginate and rate-limit production APIs',
                ],
                revision: [
                    { label: 'ActiveModel::Serializers', url: 'https://github.com/rails-api/active_model_serializers', tag: 'Docs' },
                    { label: 'NestJS Academy', url: '/pages/nestjs-academy/nestjs-academy.html', tag: 'Related' },
                    { label: 'System Design Academy', url: '/pages/system-design-academy/system-design-academy.html', tag: 'Related' },
                ],
                defaultCode: `Rails.application.routes.draw do
  namespace :api do
    resources :articles
  end
end`,
            },
        ],
        quiz: [
            {
                id: 'q-api-1',
                question: 'Which command creates a Rails app without the view layer?',
                options: [
                    'rails new my_api',
                    'rails new my_api --api',
                    'rails generate api my_api',
                    'rails init my_api --headless',
                ],
                correct: 1,
            },
            {
                id: 'q-api-2',
                question: 'Why do APIs version with namespaces?',
                options: [
                    'To increase request speed',
                    'To let clients keep working while the API evolves',
                    'To avoid writing tests',
                    'To combine frontend and backend code',
                ],
                correct: 1,
            },
            {
                id: 'q-api-3',
                question: 'How does a client authenticate with a token API?',
                options: [
                    'Through the session cookie only',
                    'By sending an Authorization: Bearer header',
                    'By placing the token in the URL path',
                    'Tokens are not needed for APIs',
                ],
                correct: 1,
            },
        ],
    },
];

/* ─── State ─── */
let state = {
    activeModuleId: curriculum[0].id,
    activeLessonId: curriculum[0].lessons[0].id,
    activeTab: 'lesson',
    completedItems: [],
    quizAnswers: {},
    quizSubmitted: false,
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
    DOM.quizContainer = document.getElementById('quiz-container');
    DOM.progressBar = document.getElementById('progress-bar');
    DOM.progressText = document.getElementById('progress-text');

    // Playground elements
    DOM.routesEditor = document.getElementById('routes-editor');
    DOM.bootServerBtn = document.getElementById('boot-server-btn');
    DOM.clearPgBtn = document.getElementById('clear-pg-btn');
    DOM.terminalWindow = document.getElementById('simulated-terminal');
    DOM.bootStatus = document.getElementById('boot-status');
    DOM.requestMethod = document.getElementById('request-method');
    DOM.requestPath = document.getElementById('request-path');
    DOM.requestBody = document.getElementById('request-body');
    DOM.sendRequestBtn = document.getElementById('send-request-btn');
    DOM.responseStatus = document.getElementById('response-status');
    DOM.responseBody = document.getElementById('response-body');
}

/* ─── Helpers ─── */
function getActiveModule() {
    return curriculum.find((m) => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
    const mod = getActiveModule();
    return mod.lessons.find((l) => l.id === state.activeLessonId) || mod.lessons[0];
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
    } catch {
        /* ignore */
    }
}

function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.completedItems));
    } catch {
        /* ignore */
    }
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
    curriculum.forEach((mod) => {
        total += mod.lessons.length;
        if (mod.quiz && mod.quiz.length > 0) total++;
    });
    completed = state.completedItems.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    DOM.progressBar.style.width = pct + '%';
    DOM.progressText.textContent = pct + '%';
}

/* ─── Sidebar ─── */
function renderSidebar() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    DOM.moduleList.innerHTML = curriculum
        .map((mod, idx) => {
            const lessonsCount = mod.lessons.length;
            const lessonsDoneCount = mod.lessons.filter((l) => isItemComplete(l.id)).length;
            const quizCount = (mod.quiz && mod.quiz.length) || 0;
            const quizDone = quizCount > 0 ? isItemComplete(mod.id + '-quiz') : true;

            const allLessonsDone = lessonsDoneCount === lessonsCount;
            const isModuleComplete = allLessonsDone && quizDone;
            const hasPartialProgress = !allLessonsDone && lessonsDoneCount > 0;
            const isActive = mod.id === state.activeModuleId;

            let nodeClass = 'timeline-node--incomplete';
            if (isModuleComplete) nodeClass = 'timeline-node--complete';
            else if (hasPartialProgress) nodeClass = 'timeline-node--partial';
            else if (isActive) nodeClass = 'timeline-node--active';

            const activePart = isModuleComplete
                ? 'module-badge--complete'
                : isActive && !hasPartialProgress
                ? 'module-badge--active'
                : '';

            const checkVisible = isModuleComplete ? 'visible' : '';

            let progressHtml = '';
            if (hasPartialProgress) {
                progressHtml = `<span class="sidebar-lesson-progress">${lessonsDoneCount}/${lessonsCount} lessons done</span>`;
            } else if (allLessonsDone && !quizDone) {
                progressHtml = `<span class="sidebar-quiz-pending">Quiz not completed</span>`;
            }

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
                </li>
            `;
        })
        .join('');
}

function changeModule(moduleId) {
    const mod = curriculum.find((m) => m.id === moduleId);
    if (!mod) return;
    state.activeModuleId = moduleId;
    state.activeLessonId = mod.lessons[0].id;
    state.quizAnswers = {};
    state.quizSubmitted = false;
    resetPlaygroundState();
    renderSidebar();
    renderActiveContent();
    updateProgress();
    closeSidebar();
}

/* ─── Tabs ─── */
function switchTab(tabId) {
    state.activeTab = tabId;
    DOM.tabBtns.forEach((btn) => {
        const isActive = btn.getAttribute('data-tab') === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    DOM.tabContents.forEach((c) => {
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
    else if (state.activeTab === 'simulator') renderPlayground();
    else if (state.activeTab === 'quiz') renderQuiz();
}

/* ─── Lesson ─── */
function renderLesson() {
    const lesson = getActiveLesson();
    const isComplete = isItemComplete(lesson.id);

    const objectivesHtml =
        lesson.objectives && lesson.objectives.length
            ? `
            <div class="callout">
                <div class="callout-title"><i class="fa-solid fa-bullseye mr-2"></i>Learning Objectives</div>
                <ul>
                    ${lesson.objectives.map((o) => `<li>${escHtml(o)}</li>`).join('')}
                </ul>
            </div>`
            : '';

    const takeawaysHtml =
        lesson.takeaways && lesson.takeaways.length
            ? `
            <div class="callout">
                <div class="callout-title"><i class="fa-solid fa-check-double mr-2"></i>Key Takeaways</div>
                <ul>
                    ${lesson.takeaways.map((t) => `<li>${escHtml(t)}</li>`).join('')}
                </ul>
            </div>`
            : '';

    const revisionHtml =
        lesson.revision && lesson.revision.length
            ? `
            <div class="revision-box">
                <div class="revision-box-title"><i class="fa-solid fa-book-open-reader"></i>Related Revision Material</div>
                <ul class="revision-list">
                    ${lesson.revision
                        .map(
                            (r) => `
                        <li>
                            <i class="fa-solid fa-arrow-right"></i>
                            <a href="${r.url}" target="_blank" rel="noopener noreferrer">
                                <span class="revision-tag">${escHtml(r.tag)}</span>
                                ${escHtml(r.label)}
                            </a>
                        </li>`
                        )
                        .join('')}
                </ul>
            </div>`
            : '';

    const eli5Html = window.eli5Toggle && window.eli5RailsData ? window.eli5RailsData[lesson.id] || '' : '';

    DOM.lessonContent.innerHTML = window.eli5Toggle
        ? window.eli5Toggle.wrapContent(lesson.content, eli5Html)
        : lesson.content;

    if (window.eli5Toggle) {
        window.eli5Toggle.initToggle('rails', DOM.lessonContent);
    }
    if (window.copyCode) {
        window.copyCode.init(DOM.lessonContent);
    }

    const technical = DOM.lessonContent.querySelector('[data-technical]');
    if (technical) {
        technical.insertAdjacentHTML('beforeend', objectivesHtml + takeawaysHtml + revisionHtml);
    }

    DOM.markCompleteBtn.innerHTML = isComplete
        ? '<i class="fas fa-check-circle mr-2"></i> Completed'
        : '<i class="fas fa-check-circle mr-2"></i> Mark as Complete';
    DOM.markCompleteBtn.classList.toggle('completed', isComplete);

    DOM.activeModuleTitle.textContent = getActiveModule().title;
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

/* ═══════════════════════════════════════════
   PLAYGROUND -- Rails server + API client sandbox
   ═══════════════════════════════════════════ */

let serverBooted = false;

function formatTimestamp() {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function printLine(cls, text) {
    const p = document.createElement('p');
    p.className = 'term-line ' + cls;
    p.innerHTML = `<span class="term-time">[${formatTimestamp()}]</span> ${escHtml(text)}`;
    DOM.terminalWindow.appendChild(p);
    DOM.terminalWindow.scrollTop = DOM.terminalWindow.scrollHeight;
}

function resetTerminal() {
    DOM.terminalWindow.innerHTML = '';
}

function setBootStatus(text, ok) {
    DOM.bootStatus.textContent = text;
    DOM.bootStatus.classList.toggle('boot-status--ok', ok);
}

/* Find the matching `end` for a `do`, accounting for nested do/end blocks */
function findBlockEnd(code, startIdx) {
    let depth = 1;
    const re = /\b(?:do|end)\b/g;
    re.lastIndex = startIdx;
    let m;
    while ((m = re.exec(code)) !== null) {
        if (m[0] === 'do') depth++;
        else depth--;
        if (depth === 0) return m.index;
    }
    return code.length;
}

/* Parse a Rails routes.rb snippet into resources + custom routes */
function parseRoutes(code) {
    const routes = { resources: [], custom: [], extra: [], nested: {} };

    // resources blocks: nested resources + member/collection routes
    const blockRe = /resources\s+:([a-z_]+)\s+do/g;
    let m;
    while ((m = blockRe.exec(code)) !== null) {
        const parent = m[1];
        const doStart = m.index + m[0].length;
        const inner = code.slice(doStart, findBlockEnd(code, doStart));

        const innerRes = [...inner.matchAll(/resources\s+:([a-z_]+)/g)].map((x) => x[1]);
        if (innerRes.length) routes.nested[parent] = innerRes;

        const collMatch = /collection\s+do([\s\S]*?)end/g.exec(inner);
        if (collMatch) {
            [...collMatch[1].matchAll(/(get|post|patch|delete)\s+:([a-z_]+)/g)].forEach((a) => {
                routes.extra.push({ method: a[1].toUpperCase(), path: `${parent}/${a[2]}`, target: `${parent}#${a[2]}` });
            });
        }
        const memMatch = /member\s+do([\s\S]*?)end/g.exec(inner);
        if (memMatch) {
            [...memMatch[1].matchAll(/(get|post|patch|delete)\s+:([a-z_]+)/g)].forEach((a) => {
                routes.extra.push({ method: a[1].toUpperCase(), path: `${parent}/:id/${a[2]}`, target: `${parent}#${a[2]}` });
            });
        }
    }

    // every resources mention
    const allRes = [...code.matchAll(/resources\s+:([a-z_]+)/g)].map((x) => x[1]);
    const nestedChildren = new Set(Object.values(routes.nested).flat());
    routes.resources = allRes.filter((r) => !nestedChildren.has(r));

    // custom routes: get/post/patch/delete 'path', to: 'controller#action'
    const customRe = /(get|post|patch|delete)\s+['"]([^'"]+)['"]\s*,\s*to:\s*['"]([^'"]+)['"]/g;
    while ((m = customRe.exec(code)) !== null) {
        routes.custom.push({
            method: m[1].toUpperCase(),
            path: m[2].replace(/^\//, ''),
            target: m[3],
        });
    }

    return routes;
}

/* Match a member/collection route like articles/:id/publish or articles/search */
function matchExtraRoute(extraRoutes, method, pathParts) {
    return (
        extraRoutes.find((r) => {
            if (r.method !== method) return false;
            const rp = r.path.split('/');
            if (rp.length !== pathParts.length) return false;
            return rp.every((seg, i) => seg === pathParts[i] || seg === ':id');
        }) || null
    );
}

const SAMPLE_ROUTES = `Rails.application.routes.draw do
  # One line -> seven RESTful routes
  resources :articles
end`;

const SAMPLE_RESPONSES = {
    articles: [
        { id: 1, title: 'Getting Started with Rails', body: 'Convention over Configuration changes everything.', published: true, created_at: '2026-07-28T09:12:00Z' },
        { id: 2, title: 'ActiveRecord is Magic', body: 'Write Ruby, get safe SQL automatically.', published: true, created_at: '2026-07-29T14:03:00Z' },
        { id: 3, title: 'ERB, Partials, and Layouts', body: 'Views stay DRY with reusable snippets.', published: false, created_at: '2026-07-30T18:44:00Z' },
    ],
    comments: [
        { id: 1, article_id: 1, body: 'This article helped me a lot!' },
        { id: 2, article_id: 1, body: 'The request cycle diagram is gold.' },
        { id: 3, article_id: 2, body: 'I finally understand associations.' },
    ],
    users: [
        { id: 1, email: 'ada@example.com', name: 'Ada Lovelace' },
        { id: 2, email: 'grace@example.com', name: 'Grace Hopper' },
    ],
};

function fakeRecord(resource, id) {
    return { id: Number(id), title: `${resource[0].toUpperCase() + resource.slice(1)} #${id}`, body: 'Sample record body from the Rails sandbox.', published: true, created_at: '2026-08-01T00:00:00Z' };
}

/* Find which route matches a request, or return null */
function matchRoute(routes, method, pathParts) {
    const first = pathParts[0] || '';

    // custom routes first
    const custom = routes.custom.find(
        (c) => c.method === method && c.path === pathParts.join('/')
    );
    if (custom) return { type: 'custom', target: custom.target };

    // member/collection routes (articles/search, articles/:id/publish)
    const extra = matchExtraRoute(routes.extra, method, pathParts);
    if (extra) return { type: 'custom', target: extra.target };

    // nested resource: articles/:id/comments
    if (routes.nested[first] && pathParts.length === 3) {
        const child = pathParts[2];
        if (routes.nested[first].includes(child)) {
            return { type: 'nested-index', parent: first, child, parentId: pathParts[1] };
        }
    }

    // plain resource
    if (routes.resources.includes(first)) {
        if (pathParts.length === 1) {
            if (method === 'GET') return { type: 'index', resource: first };
            if (method === 'POST') return { type: 'create', resource: first };
            return null;
        }
        if (pathParts.length === 2) {
            if (method === 'GET') return { type: 'show', resource: first, id: pathParts[1] };
            if (method === 'PATCH' || method === 'PUT') return { type: 'update', resource: first, id: pathParts[1] };
            if (method === 'DELETE') return { type: 'destroy', resource: first, id: pathParts[1] };
            return null;
        }
    }

    return null;
}

function setResponse(status, codeClass, payload) {
    DOM.responseStatus.textContent = String(status);
    DOM.responseStatus.className = 'response-status ' + codeClass;
    DOM.responseBody.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
}

function bootServer() {
    resetTerminal();
    const code = DOM.routesEditor.value;
    const routes = parseRoutes(code);

    if (
        routes.resources.length === 0 &&
        routes.custom.length === 0 &&
        Object.keys(routes.nested).length === 0
    ) {
        printLine('term-error', 'Could not parse any routes from config/routes.rb.');
        printLine('term-error', 'Tip: use resources :articles or get "about", to: "pages#about".');
        setBootStatus('Error', false);
        serverBooted = false;
        DOM.sendRequestBtn.disabled = true;
        return;
    }

    serverBooted = true;
    DOM.sendRequestBtn.disabled = false;

    printLine('term-info', '=> Booting Puma');
    printLine('term-info', '=> Rails 7.1.4 application starting in development');
    printLine('term-log', '=> Run `bin/rails server --help` for more options');
    printLine('term-log', '=> Ctrl-C to shutdown server');
    printLine('term-muted', 'Exiting');
    printLine('term-success', 'Puma starting in single mode...');
    printLine('term-log', '* Puma version: 6.4.2 (ruby 3.2.2-p53)');
    printLine('term-log', '* Min threads: 5');
    printLine('term-log', '* Max threads: 5');
    printLine('term-log', '* Environment: development');
    printLine('term-success', '* Listening on http://127.0.0.1:3000');
    printLine('term-success', 'Use Ctrl-C to stop');

    printLine('term-muted', '');
    printLine('term-info', 'Routes');
    printLine('term-muted', '  Verb   URI Pattern                 Controller#Action');

    routes.resources.forEach((r) => {
        printLine('term-log', `  GET    /${r}                      ${r}#index`);
        printLine('term-log', `  GET    /${r}/:id                  ${r}#show`);
        printLine('term-log', `  POST   /${r}                      ${r}#create`);
        printLine('term-log', `  PATCH  /${r}/:id                  ${r}#update`);
        printLine('term-log', `  DELETE /${r}/:id                  ${r}#destroy`);
        if (routes.nested[r]) {
            routes.nested[r].forEach((child) => {
                printLine('term-log', `  GET    /${r}/:id/${child}            ${child}#index`);
            });
        }
    });
    routes.custom.forEach((c) => {
        printLine('term-log', `  ${c.method.padEnd(4)}  /${c.path}                  ${c.target}`);
    });
    routes.extra.forEach((c) => {
        printLine('term-log', `  ${c.method.padEnd(4)}  /${c.path}                  ${c.target}`);
    });

    setBootStatus('Running', true);
    setResponse(200, 'ok', { status: 'ok', message: 'Rails server is running on http://localhost:3000' });
}

function sendRequest() {
    if (!serverBooted) return;
    const method = DOM.requestMethod.value;
    const rawPath = DOM.requestPath.value.trim().replace(/^\/+|\/+$/g, '');
    const bodyStr = DOM.requestBody.value.trim();

    const code = DOM.routesEditor.value;
    const routes = parseRoutes(code);
    const pathParts = rawPath.split('/').filter(Boolean);
    const match = matchRoute(routes, method, pathParts);

    if (!match) {
        setResponse(404, 'client-error', {
            status: 404,
            error: 'Not Found',
            message: `No route matches [${method}] "/${rawPath}"`,
        });
        printLine('term-warn', `Started ${method} "/${rawPath}"`);
        printLine('term-warn', `ActionController::RoutingError (No route matches [${method}] "/${rawPath}")`);
        return;
    }

    printLine('term-log', `Started ${method} "/${rawPath}" for 127.0.0.1`);
    printLine('term-log', `Processing by ${match.type === 'custom' ? match.target : match.resource + 's#' + match.type} as JSON`);

    let payload = {};
    let status = 200;

    if (match.type === 'custom') {
        const action = match.target.split('#').pop() || 'show';
        payload = { status: 'ok', controller: match.target, action, message: `Mock response from ${match.target}` };
    } else if (match.type === 'index') {
        payload = SAMPLE_RESPONSES[match.resource] || [];
    } else if (match.type === 'show') {
        const rec = (SAMPLE_RESPONSES[match.resource] || []).find((r) => String(r.id) === match.id) || fakeRecord(match.resource, match.id);
        payload = rec;
    } else if (match.type === 'create') {
        let parsed = {};
        try {
            parsed = bodyStr ? JSON.parse(bodyStr) : {};
        } catch {
            setResponse(400, 'client-error', { status: 400, error: 'Bad Request', message: 'Malformed JSON payload' });
            printLine('term-error', 'Completed 400 Bad Request');
            return;
        }
        const newId = ((SAMPLE_RESPONSES[match.resource] || []).at(-1)?.id || 0) + 1;
        payload = { id: newId, ...parsed, created_at: new Date().toISOString() };
        status = 201;
        printLine('term-success', `Completed 201 Created`);
        setResponse(status, 'ok', payload);
        return;
    } else if (match.type === 'update') {
        let parsed = {};
        try {
            parsed = bodyStr ? JSON.parse(bodyStr) : {};
        } catch {
            setResponse(400, 'client-error', { status: 400, error: 'Bad Request', message: 'Malformed JSON payload' });
            return;
        }
        payload = { id: Number(match.id), ...parsed, updated_at: new Date().toISOString() };
        status = 200;
    } else if (match.type === 'destroy') {
        payload = { message: `Article with id ${match.id} destroyed` };
        status = 204;
        printLine('term-success', `Completed 204 No Content`);
        setResponse(status, 'ok', payload);
        return;
    } else if (match.type === 'nested-index') {
        const rows = (SAMPLE_RESPONSES[match.child] || []).filter(
            (r) => String(r.article_id) === match.parentId
        );
        payload = rows;
    }

    printLine('term-success', `Completed ${status} OK`);
    setResponse(status, 'ok', payload);
}

/* Reset the playground to the active lesson's default routes */
function resetPlaygroundState() {
    serverBooted = false;
    if (DOM.sendRequestBtn) DOM.sendRequestBtn.disabled = true;
    if (DOM.routesEditor) DOM.routesEditor.value = getActiveLesson().defaultCode || SAMPLE_ROUTES;
    if (DOM.terminalWindow) resetTerminal();
    if (DOM.bootStatus) setBootStatus('Offline', false);
    if (DOM.requestBody) DOM.requestBody.value = '';
    if (DOM.responseStatus && DOM.responseBody) {
        DOM.responseStatus.textContent = '000';
        DOM.responseStatus.className = 'response-status';
        DOM.responseBody.textContent = 'Server offline — boot the app first.';
    }
}

function setupPlayground() {
    resetPlaygroundState();
    DOM.bootServerBtn.addEventListener('click', bootServer);

    DOM.clearPgBtn.addEventListener('click', () => {
        serverBooted = false;
        DOM.sendRequestBtn.disabled = true;
        setBootStatus('Offline', false);
        resetTerminal();
        DOM.routesEditor.value = getActiveLesson().defaultCode || SAMPLE_ROUTES;
        DOM.requestBody.value = '';
        setResponse(0, '', 'Server offline — boot the app first.');
        printLine('term-muted', '// Sandbox reset. Press "Boot Server" to start.');
    });

    DOM.sendRequestBtn.addEventListener('click', sendRequest);

    DOM.requestPath.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendRequest();
    });

    // Tab key inserts spaces instead of leaving the textarea
    DOM.routesEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.substring(0, start) + '  ' + e.target.value.substring(end);
            e.target.selectionStart = e.target.selectionEnd = start + 2;
        }
    });
}

function renderPlayground() {
    if (!DOM.routesEditor.value.trim()) {
        DOM.routesEditor.value = getActiveLesson().defaultCode || SAMPLE_ROUTES;
    }
    DOM.activeModuleTitle.textContent = getActiveModule().title + ' — Playground';
}

/* ─── Quiz ─── */
function renderQuiz() {
    const mod = getActiveModule();
    const quizId = mod.id + '-quiz';
    const isCompleted = isItemComplete(quizId);

    if (!mod.quiz || mod.quiz.length === 0) {
        DOM.quizContainer.innerHTML = `
            <div class="quiz-container" style="text-align:center; padding:3rem;">
                <i class="fa-solid fa-clipboard-check" style="font-size:3rem; color:#b91c1c; opacity:0.5; margin-bottom:1rem;"></i>
                <h3 style="font-family:var(--font-display); color:#475569; margin-bottom:0.5rem;">No Quiz Available</h3>
                <p style="color:#94a3b8; font-size:0.9rem;">This module doesn't have a quiz yet. Continue to the next module.</p>
            </div>
        `;
        DOM.activeModuleTitle.textContent = mod.title + ' — Quiz';
        return;
    }

    DOM.activeModuleTitle.textContent = mod.title + ' — Quiz';

    let html = `<h2>${escHtml(mod.title)} Quiz</h2>`;

    mod.quiz.forEach((q, idx) => {
        const selected = state.quizAnswers[q.id];
        const showResult = isCompleted;

        html += `
            <div class="quiz-question-card">
                <div class="quiz-question-number">Question ${idx + 1} of ${mod.quiz.length}</div>
                <div class="quiz-question-text">${escHtml(q.question)}</div>
                <div class="quiz-options">
                    ${q.options
                        .map((opt, optIdx) => {
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
                        })
                        .join('')}
                </div>
            </div>
        `;
    });

    if (!isCompleted) {
        const allAnswered = mod.quiz.every((q) => state.quizAnswers[q.id] !== undefined);
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
        const score = mod.quiz.filter((q) => state.quizAnswers[q.id] === q.correct).length;
        const total = mod.quiz.length;
        html += `
            <div class="quiz-result quiz-result--fail">
                <i class="fas fa-redo-alt"></i> Score: ${score}/${total} — adjust your answers and try again.
            </div>
        `;
    }

    DOM.quizContainer.innerHTML = html;
}

function submitQuiz() {
    const mod = getActiveModule();
    state.quizSubmitted = true;
    let score = 0;

    mod.quiz.forEach((q) => {
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
        const btn = e.target.closest('.sidebar-module-btn');
        if (btn && btn.dataset.moduleId) {
            changeModule(btn.dataset.moduleId);
        }
    });
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

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
    cacheDOM();
    loadProgress();
    setupSidebar();
    setupPlayground();
    setupMarkComplete();
    setupQuiz();

    DOM.tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    renderSidebar();
    renderLesson();
    updateProgress();
});
