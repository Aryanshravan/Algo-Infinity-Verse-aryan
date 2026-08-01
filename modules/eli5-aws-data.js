const eli5AwsData = {
  'm1-l1': `
    <p><strong>IAM</strong> (Identity and Access Management) is like a <strong>school ID card system</strong>.</p>
    <ul>
      <li><strong>Users</strong> are <strong>students</strong> — each person gets their own ID card with their photo.</li>
      <li><strong>Groups</strong> are like <strong>classes</strong>. All students in the Science Club get the same permissions: "Can enter the Science Lab." All students in the Art Club: "Can enter the Art Studio."</li>
      <li><strong>Roles</strong> are like <strong>visitor badges</strong> at the front desk. A parent visiting gets a temporary badge that says "Visitor — can enter the main office but not classrooms." The badge expires at the end of the day.</li>
      <li><strong>Policies</strong> are the <strong>rulebook</strong>: "Alice can enter Room 201, Bob can only enter the Library, nobody can enter the Staff Lounge."</li>
    </ul>
    <p>The most important idea: an <strong>EC2 instance</strong> (a virtual computer) gets a <strong>Role</strong>, not a User. It's like giving the school robot a temporary badge to fetch attendance records from the office — it doesn't need its own student ID!</p>
  `,
  'm1-l2': `
    <p><strong>AWS Organizations</strong> is like a <strong>school district</strong> managing multiple schools.</p>
    <p>The <strong>management account</strong> is the school district headquarters. It decides the rules for every school in the district.</p>
    <ul>
      <li><strong>Organizational Units (OUs)</strong> are like categories of schools: "Elementary Schools," "Middle Schools," "High Schools." You group similar accounts together.</li>
      <li><strong>Service Control Policies (SCPs)</strong> are like <strong>district-wide rules</strong>. "No school in this district is allowed to serve soda in vending machines." Even if a specific school principal (admin) says "soda is fine," the district rule wins. SCPs set the absolute boundaries.</li>
      <li><strong>Consolidated Billing</strong> is like the district office getting one bill for all schools combined, then figuring out each school's share. You get volume discounts because you're buying for the whole district.</li>
    </ul>
    <p>Think of SCPs as <strong>parental controls</strong> on a phone. Even if the kid knows the password, the parent's restriction "no games after 9 PM" is enforced at the phone system level — the kid can't override it.</p>
  `,
  'm1-l3': `
    <p><strong>AWS WAF and Shield</strong> are like a <strong>castle's defenses</strong>.</p>
    <ul>
      <li><strong>AWS WAF</strong> is the <strong>front gate guard</strong>. You tell the guard: "Only let in people who have a valid invitation (allow list), and block anyone carrying weapons (SQL injection or XSS attacks)." The guard checks EVERY request.</li>
      <li><strong>AWS Shield</strong> is the <strong>castle wall</strong>. <strong>Shield Standard</strong> is the basic stone wall that comes with every castle for free — it blocks common attacks like rocks being thrown (DDoS). <strong>Shield Advanced</strong> adds a magical force field and a dedicated team of defenders.</li>
      <li><strong>Security Best Practices</strong> are like castle rules: "Don't leave the gate open (open SSH to 0.0.0.0/32), use strong locks (multi-factor authentication), and check IDs at every internal door (least privilege)."</li>
    </ul>
    <p>The <strong>Shared Responsibility Model</strong> means: AWS builds the castle walls, but YOU decide who gets keys to the doors.</p>
  `,
  'm1-l4': `
    <p><strong>AWS KMS</strong> (Key Management Service) is like a <strong>master locksmith shop</strong>.</p>
    <ul>
      <li><strong>KMS Keys</strong> are like <strong>special locks</strong>. You tell the locksmith: "Make a lock, and give copies only to people I approve." The locksmith NEVER gives out the master blueprint (the key material stays inside KMS).</li>
      <li><strong>Secrets Manager</strong> is like a <strong>secure safety deposit box</strong> for passwords, API keys, and database credentials. Instead of writing your ATM PIN on a sticky note, you put it in a steel box that only authorized people can open.</li>
      <li><strong>Automatic rotation</strong> is like changing your house locks every month. Secrets Manager can automatically create a new password and update your database — without you lifting a finger.</li>
    </ul>
    <p>Think of it this way: without KMS, you'd be hiding your house key under the doormat (hardcoding secrets in code). With KMS and Secrets Manager, the key is in a bank vault, and only robots with the right badge can check it out.</p>
  `,
  'm2-l1': `
    <p>A <strong>VPC</strong> (Virtual Private Cloud) is like building your own <strong>private, fenced-in neighborhood</strong>.</p>
    <p>You decide:</p>
    <ul>
      <li>Where the houses (EC2 servers) go.</li>
      <li>Which streets (subnets) connect them.</li>
      <li>Who gets to come through the gate (security groups / firewalls).</li>
      <li>Whether the neighborhood has a public park (accessible from the internet) or is completely gated (private only).</li>
    </ul>
    <p><strong>Subnets</strong> are like zoning laws: "Public Subnet" is the commercial district where stores (web servers) can have customers from the internet. "Private Subnet" is the residential area where homes (databases) can't be accessed from the street — you need to go through a store first.</p>
    <p><strong>NAT Gateway</strong> is like a <strong>mailroom</strong> in a gated community. People inside the private area can send mail OUT (download updates), but nobody from outside can knock on their door directly.</p>
  `,
  'm2-l2': `
    <p><strong>EC2</strong> is like <strong>renting an apartment</strong> in that neighborhood you just built (the VPC).</p>
    <ul>
      <li>You choose the <strong>size</strong> (t3.micro = studio apartment, m5.large = two-bedroom, x1e.32xlarge = mansion).</li>
      <li>You pick the <strong>operating system</strong> (Windows apartment or Linux apartment).</li>
      <li>You move your <strong>furniture</strong> in (install software).</li>
      <li>You pay <strong>rent by the hour</strong> (or by the second).</li>
    </ul>
    <p>The magical part: if you need more apartments because your business is growing, you can start 100 more in minutes. And when you're done, you move out and <strong>stop paying</strong>. No long-term lease!</p>
    <p><strong>Security Groups</strong> are the apartment's door locks. You decide: "My apartment door only opens for my friends (specific IP addresses) and only during certain hours (port 443 for HTTPS)."</p>
  `,
  'm2-l3': `
    <p><strong>ELB</strong> (Elastic Load Balancing) and <strong>Auto Scaling</strong> are like a <strong>smart restaurant manager</strong> and a <strong>magic kitchen</strong>.</p>
    <p>The <strong>Load Balancer</strong> is the <strong>host at the front door</strong>. When customers arrive, the host says: "Table 3 is free, please sit there." They spread customers evenly so one waiter (server) doesn't get overwhelmed. If Table 3's waiter is slow, new customers go to Table 5.</p>
    <p><strong>Auto Scaling</strong> is the <strong>magic kitchen</strong> that adds more cooks when it gets busy:</p>
    <ul>
      <li>Lunch rush starts → more customers → Auto Scaling <strong>adds more servers</strong> (cooks).</li>
      <li>Dinner ends → less customers → Auto Scaling <strong>removes extra servers</strong> (sends cooks home).</li>
      <li>You only pay for the cooks that are actually cooking.</li>
    </ul>
    <p>Together, ELB + Auto Scaling is like having a restaurant that automatically hires new waiters when it gets crowded and fires them (politely!) when it's quiet — and you never have to think about it.</p>
  `,
  'm2-l4': `
    <p><strong>Route 53</strong> and <strong>CloudFront</strong> are like a <strong>GPS system</strong> and a <strong>worldwide network of delivery hubs</strong>.</p>
    <p><strong>Route 53</strong> (DNS) is the <strong>GPS</strong>. When you type "mywebsite.com," Route 53 translates that into an IP address — like a GPS translating "123 Main Street" into coordinates. Without it, you'd have to type http://192.168.1.1 to visit any website!</p>
    <p><strong>CloudFront</strong> (CDN) is like having <strong>warehouses in every city</strong>. Instead of every customer in the world traveling to your one factory in Virginia to get a product, CloudFront stores copies (cached files) in warehouses near each customer. Someone in Tokyo gets files from Tokyo's warehouse, not from Virginia.</p>
    <ul>
      <li><strong>Edge Locations</strong> = local warehouses (300+ worldwide).</li>
      <li><strong>Origin</strong> = your main factory (S3 bucket or web server).</li>
      <li><strong>Distribution</strong> = the global delivery network connecting them.</li>
    </ul>
    <p>Result: your website loads <strong>lightning fast</strong> everywhere in the world, and your main servers handle way less traffic.</p>
  `,
  'm3-l1': `
    <p><strong>S3</strong> is like a <strong>giant, magical warehouse</strong> where you can store unlimited boxes.</p>
    <ul>
      <li>Each box has a <strong>label</strong> (the object key, like "photos/vacation/beach.jpg").</li>
      <li>You put <strong>anything</strong> in the boxes — photos, videos, documents, website files.</li>
      <li>The warehouse <strong>never runs out of space</strong>.</li>
      <li>The warehouse <strong>automatically makes copies</strong> of your boxes in different cities (99.999999999% durability).</li>
      <li>You can access any box from anywhere in the world.</li>
    </ul>
    <p><strong>Storage Classes</strong> are like different shelf types:</p>
    <ul>
      <li><strong>S3 Standard</strong> = front shelf, fastest to grab (frequently accessed).</li>
      <li><strong>S3 Glacier</strong> = basement archives, takes hours to retrieve (old backups).</li>
      <li><strong>S3 Intelligent-Tiering</strong> = magic shelf that moves items between front and back based on how often you grab them.</li>
    </ul>
  `,
  'm3-l2': `
    <p><strong>RDS</strong> is like <strong>hiring a team of robot librarians</strong>.</p>
    <p>You tell the robots: "I need a database for my library." They handle everything:</p>
    <ul>
      <li>They set up the <strong>bookshelves</strong> (create the database server).</li>
      <li>They <strong>organize the books alphabetically</strong> (set up the schema).</li>
      <li>They make <strong>backup copies</strong> of all the books every night (automated backups).</li>
      <li>If a bookshelf breaks, they <strong>fix it automatically</strong> (auto-recovery).</li>
      <li>If more people come to the library, they add more <strong>reading tables</strong> (auto-scaling).</li>
    </ul>
    <p>Without RDS, you'd be the librarian yourself: building shelves, fixing broken ones, making copies by hand, staying up late to clean. With RDS, the robots do all the hard work — you just bring the books!</p>
    <p>RDS supports multiple database engines: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, and Amazon Aurora. It's like hiring librarians who speak different languages.</p>
  `,
  'm3-l3': `
    <p><strong>EBS</strong> (Elastic Block Store) is like an <strong>external hard drive</strong> for your EC2 computer.</p>
    <p>Imagine your EC2 instance is a laptop. The laptop has some built-in storage (Instance Store), but if the laptop breaks, you lose everything on it.</p>
    <ul>
      <li><strong>EBS Volumes</strong> are like <strong>external SSDs</strong> that you plug into your laptop via USB. If the laptop breaks, you unplug the SSD and plug it into a new laptop — all your files are safe!</li>
      <li><strong>Snapshots</strong> are like taking a <strong>photo</strong> of your external drive so you can restore it later.</li>
      <li><strong>Instance Store</strong> is the laptop's built-in hard drive. It's very fast (directly attached) but <strong>ephemeral</strong> — if the laptop stops, everything is gone. Good for temporary, high-speed work like video rendering.</li>
    </ul>
    <p><strong>EBS vs Instance Store:</strong> EBS = safe but slightly slower (network drive). Instance Store = super fast but risky (local drive). Choose based on whether you care more about data persistence or raw speed.</p>
  `,
  'm3-l4': `
    <p><strong>ElastiCache</strong> and <strong>DynamoDB</strong> are like a <strong>sticky note on your monitor</strong> and a <strong>magic filing cabinet</strong>.</p>
    <p><strong>ElastiCache</strong> (Redis/Memcached) is the <strong>sticky note</strong>: You write down frequently needed info so you don't have to walk to the filing cabinet every time. Instead of asking the database "What's Bob's favorite color?" 1,000 times per second (slow and expensive), you ask once, write it on the sticky note, and check the sticky note for the next 999 times. Super fast!</p>
    <p><strong>DynamoDB</strong> is a <strong>magic filing cabinet</strong> that:</p>
    <ul>
      <li>Can handle <strong>trillions of files</strong> (NoSQL, key-value + document).</li>
      <li>Can serve <strong>millions of requests per second</strong> without breaking a sweat.</li>
      <li><strong>Automatically grows</strong> — no "we need a bigger cabinet" problems (auto-scaling).</li>
      <li>Works great for <strong>shopping carts, game leaderboards, IoT data</strong> — anything that needs massive scale and low latency.</li>
    </ul>
    <p>Think of it this way: ElastiCache makes things faster by remembering, DynamoDB stores things at planet-scale without complaining.</p>
  `,
  'm4-l1': `
    <p><strong>AWS Lambda</strong> is like <strong>hiring a worker for ONE task</strong>, paying them only for the 5 seconds they work, and then they disappear.</p>
    <ul>
      <li>You don't rent them an office (no servers to manage).</li>
      <li>You don't pay them when they're idle (no cost when not running).</li>
      <li>You can hire <strong>thousands of them instantly</strong> when a million customers all need something at once (auto-scaling to zero).</li>
    </ul>
    <p><strong>Event-Driven:</strong> Lambda is like a fire station. The firefighters (Lambda functions) sleep until the alarm rings (an event happens). Alarm rings → firefighters jump up, handle the fire (process the event), and go back to sleep. You pay only for the minutes they were actively fighting fires.</p>
    <p><strong>Common uses:</strong> Resizing images when uploaded to S3, processing API requests, running scheduled cleanup tasks, transforming data between services.</p>
  `,
  'm4-l2': `
    <p><strong>API Gateway</strong> is like a <strong>fancy restaurant reception desk</strong>.</p>
    <p>Customers (apps, websites) arrive at the restaurant and talk to the receptionist (API Gateway). The receptionist:</p>
    <ul>
      <li><strong>Takes the order</strong> (receives the API request).</li>
      <li><strong>Checks the reservation</strong> (authentication — do you have a valid API key?).</li>
      <li><strong>Checks the menu</strong> (rate limiting — you can only order 3 dishes per minute).</li>
      <li><strong>Sends the order to the kitchen</strong> (routes the request to Lambda or backend).</li>
      <li><strong>Serves the dish to the customer</strong> (returns the API response).</li>
    </ul>
    <p>API Gateway also <strong>caches popular dishes</strong> — if 100 people ask "What's the soup of the day?" in one minute, the receptionist can just say "Tomato soup" from memory instead of asking the kitchen every time.</p>
    <p>Together with Lambda, you get a fully serverless REST API: no servers to manage, auto-scaling, pay-per-request. This combination (API Gateway + Lambda) is the foundation of serverless architectures.</p>
  `,
  'm4-l3': `
    <p><strong>Step Functions</strong> and <strong>EventBridge</strong> are like a <strong>factory assembly line</strong> and a <strong>town crier</strong>.</p>
    <p><strong>Step Functions</strong> is the <strong>assembly line manager</strong>. You define a workflow: "Step 1: Validate order → Step 2: Process payment → Step 3: Ship package → Step 4: Send email." If Step 2 fails, the manager says "Go to the 'Payment Failed' recovery step." If the whole process is done, the manager reports "Order completed." Each step is a Lambda function or other AWS service.</p>
    <ul>
      <li><strong>Standard Workflows</strong> = precise, one-time processes (order fulfillment).</li>
      <li><strong>Express Workflows</strong> = high-volume, short processes (data transformation).</li>
    </ul>
    <p><strong>EventBridge</strong> is the <strong>town crier</strong>: "HEAR YE! A new user just signed up!" Any service that cares about this event can react. The signup service doesn't need to know who's listening — it just shouts the news, and EventBridge delivers the message to whoever subscribed.</p>
    <p>Together: EventBridge hears the event → triggers Step Functions → Step Functions orchestrates the entire multi-step workflow.</p>
  `,
  'm5-l1': `
    <p><strong>DynamoDB</strong> is a <strong>magic filing cabinet that never runs out of space and never slows down</strong>, no matter how many people use it.</p>
    <p>Unlike a regular database (RDS) where you have to organize everything in neat rows and columns (like a spreadsheet), DynamoDB is more like a giant box of index cards. Each card has a unique ID (Primary Key) and can hold anything — text, numbers, lists, or even nested documents.</p>
    <ul>
      <li><strong>Tables</strong> = filing cabinets.</li>
      <li><strong>Items</strong> = index cards in the cabinet.</li>
      <li><strong>Attributes</strong> = what's written on each card (can vary between cards!).</li>
    </ul>
    <p><strong>DAX</strong> (DynamoDB Accelerator) is like putting the most popular index cards on the front desk instead of deep in the cabinet — reading them 10x faster.</p>
    <p><strong>DynamoDB Streams</strong> is like having a camera recording EVERY change to every card, so other services can react immediately.</p>
  `,
  'm5-l2': `
    <p><strong>Amazon Kinesis</strong> is like a <strong>giant water pipe for data</strong>.</p>
    <p>Imagine you have a firehose of data: millions of clicks on a website, thousands of stock market prices per second, GPS location updates from delivery trucks. You can't store all of this in a regular database — it comes too fast!</p>
    <ul>
      <li><strong>Kinesis Data Streams</strong> = the <strong>pipe itself</strong>. Data flows in one end and multiple apps can read from the other end in real-time.</li>
      <li><strong>Kinesis Data Firehose</strong> = the <strong>automatic bottling plant</strong>. It catches the streaming data, optionally transforms it, and drops it into S3 or Redshift for storage/analysis.</li>
      <li><strong>Kinesis Data Analytics</strong> = <strong>quality control sensors</strong> on the pipe that analyze the water as it flows. "Alert! Temperature just spiked!" (run SQL queries on streaming data in real-time).</li>
    </ul>
    <p>Think of Kinesis as a conveyor belt in a factory: items keep coming, you can inspect them as they pass, and you can store them in boxes at the end.</p>
  `,
  'm5-l3': `
    <p><strong>Athena</strong> and <strong>Glue</strong> are like a <strong>super-smart librarian</strong> and a <strong>cleaning crew for messy data</strong>.</p>
    <p><strong>Glue</strong> is the cleaning crew that arrives before the librarian. You dump all your messy files (CSVs, JSONs, logs) into S3 — like throwing a mountain of unsorted books, magazines, and papers into a giant warehouse. Glue crawls through the mess, figures out what's what ("these are all sales records, these are all customer logs"), creates a catalog, and organizes everything neatly.</p>
    <p><strong>Athena</strong> is the super-smart librarian. Once Glue has organized everything, you can ask Athena questions in plain SQL: "How many red shoes did we sell in March?" Athena reads directly from the organized S3 files and answers back in seconds. <strong>You don't need to load data into any database</strong> — Athena queries it right where it sits (in S3).</p>
    <p>You pay only for the queries you run. It's like paying a librarian per question instead of paying rent for a library building.</p>
  `,
  'm6-l1': `
    <p><strong>AWS CodePipeline</strong> is like a <strong>conveyor belt in a toy factory</strong>.</p>
    <p>When you code a new feature for your app, there's a series of steps it needs to go through before reaching customers. CodePipeline automates this whole process:</p>
    <ul>
      <li><strong>Step 1 - Source:</strong> You put your code on GitHub (like placing raw materials on the belt). CodePipeline detects the change automatically.</li>
      <li><strong>Step 2 - Build:</strong> The belt moves your code to the building station (CodeBuild), where it's compiled, dependencies are installed, and tests are run.</li>
      <li><strong>Step 3 - Staging:</strong> The built product moves to a test store (staging environment) for final checks.</li>
      <li><strong>Step 4 - Deploy:</strong> If everything passes, the belt delivers the finished toy to the store shelves (production environment) using CodeDeploy.</li>
    </ul>
    <p>If any step fails — say the tests don't pass — the conveyor belt stops and an alarm goes off. The bad toy never reaches the store shelves!</p>
  `,
  'm6-l2': `
    <p><strong>CodeBuild</strong> and <strong>CodeDeploy</strong> are like a <strong>robot chef</strong> and a <strong>robot waiter</strong> in the CI/CD restaurant.</p>
    <p><strong>CodeBuild</strong> is the <strong>robot chef</strong>. You give it a recipe (buildspec.yml): "Get ingredients from GitHub, mix them together (compile code), cook at 350 degrees (run tests), and plate the dish (create a deployable package)." The robot chef works in a clean, temporary kitchen (build environment) that's destroyed after cooking — so no mess is left behind.</p>
    <p><strong>CodeDeploy</strong> is the <strong>robot waiter</strong>. It takes the finished dish from the chef and delivers it to tables (servers, Lambda, or ECS). The waiter can use different serving strategies:</p>
    <ul>
      <li><strong>Rolling deploy:</strong> Serve new dish to one table at a time, checking if they like it before serving the next table.</li>
      <li><strong>Blue/Green deploy:</strong> Set up a completely new set of tables, serve everyone there, then switch the "open" sign to the new setup.</li>
      <li><strong>Canary deploy:</strong> Serve the new dish to just 5% of tables first, watch for complaints (errors), then serve the rest.</li>
    </ul>
  `,
  'm6-l3': `
    <p><strong>Infrastructure as Code</strong> (CloudFormation & CDK) is like writing <strong>blueprints for a house</strong> instead of building it by hand.</p>
    <p>Normally, to set up a website you'd click around in the AWS console: "Create VPC → click, click. Launch EC2 → click, pick, click." This is like building a house without blueprints — you might forget a window, and you can't easily rebuild the same house twice.</p>
    <p><strong>CloudFormation</strong> is writing the <strong>blueprint in JSON/YAML</strong>. You describe your entire infrastructure: "One VPC with two subnets, one EC2 instance with this security group, one S3 bucket." Then you say "Build it!" and CloudFormation constructs everything exactly as specified. Want to tear it down? Say "Delete" and everything disappears cleanly.</p>
    <p><strong>CDK</strong> (Cloud Development Kit) lets you write the same blueprint in a <strong>real programming language</strong> (TypeScript, Python, Java). Instead of writing raw JSON, you write: <code>new Vpc(this, 'MyVpc', { maxAzs: 2 })</code> — which feels more like writing code than configuring infrastructure.</p>
    <p>The magic: Your infrastructure becomes version-controlled, reviewable, repeatable, and destroyable. No more "works on my machine" problems!</p>
  `,
  'm7-l1': `
    <p><strong>ECS</strong> (Elastic Container Service) with <strong>Fargate</strong> is like using <strong>food trucks instead of building restaurants</strong>.</p>
    <p>A <strong>container</strong> is like a food truck — it has everything needed to operate: the kitchen (code), ingredients (dependencies), and chef (runtime) all packaged into a single, portable truck.</p>
    <ul>
      <li><strong>ECS</strong> is the <strong>food truck management company</strong>. It decides how many trucks to deploy, where to park them, and monitors their health.</li>
      <li><strong>Fargate</strong> is the <strong>"just drive" option</strong>. You tell ECS "Run 3 food trucks," and Fargate handles all the logistics — no need to rent parking spots (EC2 instances), change tires (patch servers), or hire mechanics (manage clusters). You just provide the truck (container image) and Fargate does the rest.</li>
    </ul>
    <p><strong>Task Definitions</strong> are the <strong>menu and staffing plan</strong>: "Each truck needs 2GB of ingredients (memory) and 1 cook (CPU), with the recipe stored at 'myapp:latest'."</p>
    <p>The alternative (EC2 launch type) is like buying a fleet of vans first, <em>then</em> turning them into food trucks. Fargate skips the van-buying step.</p>
  `,
  'm7-l2': `
    <p><strong>EKS</strong> (Elastic Kubernetes Service) is like hiring a <strong>world-class train conductor</strong> for your container trains.</p>
    <p>If ECS/Fargate is a food truck, <strong>Kubernetes</strong> is a <strong>massive train system</strong>. It's more complex but more powerful — you can orchestrate hundreds of containers across multiple locations with fine-grained control.</p>
    <ul>
      <li><strong>Pods</strong> are the <strong>train cars</strong> — each carries one or more containers.</li>
      <li><strong>Nodes</strong> are the <strong>train stations</strong> (EC2 or Fargate instances).</li>
      <li><strong>Services</strong> are the <strong>train schedules</strong> — they route traffic to the right cars.</li>
      <li><strong>Deployments</strong> are the <strong>conductor's orders</strong>: "I want 5 cars running my app at all times."</li>
    </ul>
    <p><strong>EKS</strong> is the <strong>expert conductor</strong> AWS hires for you. Running Kubernetes yourself is like building a train system from scratch — you need special expertise. With EKS, AWS manages the control plane (the train control center), and you just provide the trains and tell them where to go.</p>
    <p>EKS supports both EC2 nodes (you manage the train stations) and Fargate (AWS manages everything — the train is truly driverless).</p>
  `,
  'm7-l3': `
    <p><strong>ECR</strong> (Elastic Container Registry) is like a <strong>giant, secure warehouse for food truck recipes</strong>.</p>
    <p>Remember how ECS/Fargate uses food trucks (containers)? Each food truck needs a recipe (a container image). ECR is where you store all your recipes.</p>
    <ul>
      <li><strong>Repositories</strong> are <strong>recipe boxes</strong> on the shelf — each project gets its own labeled box.</li>
      <li><strong>Images</strong> are the <strong>actual recipes</strong> (blueprints for building food trucks). Each image has a version tag: "myapp:v1.0", "myapp:v2.0".</li>
      <li><strong>Tags</strong> are <strong>sticky notes</strong> on each recipe: "Latest", "Production", "v1.0.0".</li>
    </ul>
    <p><strong>Lifecycle Policies</strong> are the <strong>shelf-cleaner</strong>. You set rules: "Keep only the 10 most recent recipes, toss older ones." This prevents the warehouse from overflowing.</p>
    <p>ECR is fully integrated with ECS and EKS. When you tell ECS "Run my latest app," ECS pulls the recipe from ECR and builds the food truck automatically. It's like having a recipe warehouse directly connected to the kitchen — instant access!</p>
  `,
  'm8-l1': `
    <p><strong>AWS Transit Gateway</strong> is like a <strong>central airport hub</strong> for your VPCs.</p>
    <p>Without Transit Gateway, connecting multiple VPCs is like building a <strong>direct road between every pair of cities</strong>. If you have 10 VPCs, you need 45 separate VPC peering connections! That's a lot of roads.</p>
    <p>Transit Gateway is the <strong>central airport</strong>. Every VPC flies into the same airport (hub-and-spoke model):</p>
    <ul>
      <li>Each VPC connects ONCE to the Transit Gateway (like building one airport per city).</li>
      <li>Any VPC can reach any other VPC through the hub (like flights connecting through the airport).</li>
      <li>Add a new VPC? Just connect it to the airport — it instantly reaches all others!</li>
    </ul>
    <p>Transit Gateway also supports <strong>VPN connections</strong> (international flights from your on-premises data center) and <strong>Direct Connect</strong> (dedicated undersea cable for VIP traffic). It's the central nervous system of a global AWS network.</p>
  `,
  'm8-l2': `
    <p><strong>AWS Direct Connect</strong> and <strong>VPN</strong> are like a <strong>private tunnel</strong> vs a <strong>secure tunnel over a public road</strong>.</p>
    <p><strong>VPN</strong> (Virtual Private Network) is like driving on the regular highway but with your car completely wrapped in an armored shell — nobody can see what's inside, but you still share the road with everyone else. It's encrypted but uses the public internet, so speeds can vary based on traffic.</p>
    <p><strong>Direct Connect</strong> is like building a <strong>private, dedicated tunnel</strong> between your house and your office. No traffic, no sharing, super consistent speed. But it's expensive — you need to rent the tunnel months in advance and pay for it even when you're not using it.</p>
    <p>When to use what:</p>
    <ul>
      <li><strong>VPN:</strong> Good for remote workers, small offices, or as a backup connection. Cheap, easy to set up.</li>
      <li><strong>Direct Connect:</strong> Good for large data transfers (petabytes of data), real-time applications (gaming, trading), or when you need consistent, reliable bandwidth.</li>
    </ul>
    <p>Many companies use <strong>both</strong>: Direct Connect as the main highway, VPN as the emergency backup if the tunnel collapses.</p>
  `,
  'm8-l3': `
    <p><strong>AWS Global Accelerator</strong> is like having a <strong>VIP airport lounge in every city</strong>.</p>
    <p>When a user in Tokyo visits your website hosted in Virginia, their internet request travels across the world, going through dozens of routers, possibly getting stuck in traffic along the way. This means slow loading times.</p>
    <p>Global Accelerator solves this by:</p>
    <ul>
      <li>Giving your app <strong>two static IP addresses</strong> (anycast IPs) that are announced from AWS edge locations worldwide.</li>
      <li>When the user in Tokyo visits your site, their request is <strong>intercepted by the nearest AWS edge location</strong> (in Tokyo) — like entering a VIP lounge at the Tokyo airport.</li>
      <li>From there, the request travels through <strong>AWS's private global network</strong> — a super-fast, dedicated fiber network — directly to your application in Virginia.</li>
    </ul>
    <p>The difference is like driving across town in regular traffic (public internet) vs taking a helicopter (AWS global network). Same destination, completely different experience.</p>
    <p><strong>Global Accelerator vs CloudFront:</strong> CloudFront caches content at edge locations (static content). Global Accelerator optimizes the network path for dynamic content (API calls, live streams) and doesn't cache anything.</p>
  `,
  'm9-l1': `
    <p><strong>AWS Compute Optimizer</strong> and <strong>Savings Plans</strong> are like a <strong>personal finance advisor</strong> and a <strong>subscription discount club</strong> for your cloud services.</p>
    <p><strong>Compute Optimizer</strong> is the <strong>finance advisor</strong> who looks at your spending and says: "Hey, your EC2 instance is only using 10% of its capacity — you're paying for a mansion but living in one room! Switch to a smaller instance and save $50/month." Or: "Your instance is at 95% CPU constantly — upgrade to avoid crashes!"</p>
    <p>It uses machine learning to analyze your usage patterns and gives recommendations like:</p>
    <ul>
      <li>"This t3.large is over-provisioned, switch to t3.medium (−40% cost)."</li>
      <li>"This c5.xlarge is under-provisioned, upgrade to c5.2xlarge for better performance."</li>
    </ul>
    <p><strong>Savings Plans</strong> are the <strong>subscription discount club</strong>. You promise to spend a certain amount per hour ($10/hour for 1 year) and in exchange you get up to 72% discount vs on-demand pricing. It's like a gym membership — you commit to paying $50/month instead of $10 per visit.</p>
  `,
  'm9-l2': `
    <p><strong>S3 Intelligent-Tiering</strong> is like having a <strong>self-organizing closet</strong>.</p>
    <p>Imagine your closet has different sections:</p>
    <ul>
      <li><strong>Front rack:</strong> Clothes you wear every week (frequent access — costs more to store, fast to grab).</li>
      <li><strong>Back rack:</strong> Clothes you wear sometimes (infrequent access — costs less to store).</li>
      <li><strong>Attic:</strong> Clothes you haven't worn in years — winter coats in summer (Glacier — cheapest storage, slow to retrieve).</li>
    </ul>
    <p>Normally, <em>you</em> have to decide where each item goes and move items manually when seasons change. But S3 Intelligent-Tiering is a <strong>magic closet</strong> that moves items automatically:</p>
    <ul>
      <li>Wear a sweater often? It moves to the front rack automatically.</li>
      <li>Haven't touched those shorts in 30 days? They slide to the back rack.</li>
      <li>No access for 90 days? They go to the attic (Glacier tier).</li>
    </ul>
    <p>You get the cost savings of automatic tiering without any manual effort. There's a small monthly monitoring fee, but it's usually much less than what you save.</p>
  `,
  'm9-l3': `
    <p><strong>AWS Trusted Advisor</strong> is like a <strong>home inspector</strong> who checks your AWS house for problems.</p>
    <p>The inspector walks through every room and checks five categories:</p>
    <ul>
      <li><strong>Cost Optimization:</strong> "You have 5 idle load balancers — that's like paying electricity for lights that are always off. Turn them off to save $200/month."</li>
      <li><strong>Performance:</strong> "Your database is running on old hardware. Upgrading would make your app 3x faster for only 10% more cost."</li>
      <li><strong>Security:</strong> "Your front door (S3 bucket) is wide open to the public! Close it immediately!"</li>
      <li><strong>Fault Tolerance:</strong> "You only have one server. If it crashes, your website goes down. Add a second one in a different city (Availability Zone)."</li>
      <li><strong>Service Limits:</strong> "You're about to hit the AWS account limit for EC2 instances — you can't launch new servers until you request a limit increase."</li>
    </ul>
    <p><strong>Cost Explorer</strong> is like a <strong>spending diary</strong>. It shows exactly where every dollar went: "$500 on EC2, $200 on S3, $50 on Lambda." You can see trends ("EC2 costs went up 20% this month because we launched a new service") and forecast future costs.</p>
  `,
  'm9-l4': `
    <p><strong>AWS Budgets</strong> and <strong>Governance Best Practices</strong> are like <strong>parental controls</strong> and a <strong>family rulebook</strong> for your cloud spending.</p>
    <p><strong>AWS Budgets</strong> is the <strong>allowance tracker</strong>. You tell AWS: "I want to spend no more than $1,000 this month." AWS watches your spending daily. When you hit $800 (80%), it sends an email alert: "Hey, you're getting close to your limit!" When you hit $1,000, it can even automatically shut down non-essential services.</p>
    <p><strong>Governance Best Practices</strong> are the <strong>family rules</strong>:</p>
    <ul>
      <li><strong>Tagging:</strong> Give every AWS resource a label: "Project: ShoppingApp", "Environment: Production", "Team: Checkout". This way you can see exactly how much the ShoppingApp production environment costs.</li>
      <li><strong>IAM with MFA:</strong> Two-factor authentication for everyone. Like needing both a house key AND a fingerprint to enter.</li>
      <li><strong>Least Privilege:</strong> Give each person/team only the permissions they absolutely need. The checkout team doesn't need access to user database — just payment processing.</li>
      <li><strong>Automated Remediation:</strong> "If someone opens an S3 bucket to the public, immediately close it and fire an alert." AWS Config + Lambda can enforce this automatically.</li>
    </ul>
    <p>Without governance, cloud costs are like a restaurant where employees eat whatever they want without tracking. With governance, you know exactly who ate what and how much it cost.</p>
  `,
};

window.eli5AwsData = eli5AwsData;
