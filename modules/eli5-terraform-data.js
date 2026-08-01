/**
 * ELI5 (Explain Like I'm 5) content for Terraform & IaC Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5TerraformData = {
  // ─── Module 1: Introduction to Infrastructure as Code ───

  'tf-iac-intro-1': `
    <p><strong>Infrastructure as Code (IaC)</strong> is like <strong>writing a recipe card for your servers</strong> instead of building them by hand.</p>
    <p>Imagine you run a bakery. The old way to get a new shop: you walk in, put in the ovens, wire the fridges, hang the signs — all by hand, from memory. It takes forever, and every shop you build ends up slightly different (one has the fridge on the left, one on the right, one is missing the sign). Nobody can remember exactly how any of them were built.</p>
    <p>IaC flips that: you write the <strong>recipe</strong> first — a file that says "this shop has 2 ovens, 1 walk-in fridge, these lights" — and then you hand the recipe to a machine that builds the shop <strong>exactly the same way, every time</strong>.</p>
    <p>In cloud terms, instead of clicking "Create EC2 instance" in a web console, you write a tiny file that describes the instance:</p>
    <pre><code>resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}</code></pre>
    <p>Because it's code, it goes into version control (like a recipe book), gets reviewed by teammates, and can be applied over and over to get the same result.</p>
    <p><strong>In short:</strong> IaC means describing your infrastructure in files, then letting tools build it — same recipe, same shop, every time.</p>
  `,

  'tf-iac-intro-2': `
    <p><strong>Declarative vs imperative</strong> is like <strong>ordering pizza vs giving cooking instructions</strong>.</p>
    <p><strong>Declarative</strong> is ordering: "I want a large pepperoni pizza." The kitchen (Terraform) figures out the steps — knead dough, add sauce, bake. If the pizza is already there, it does nothing. If you say "actually, take off the pepperoni," it removes it.</p>
    <p><strong>Imperative</strong> is giving step-by-step instructions: "Roll the dough. Put on sauce. Add cheese. Now put in oven for 15 minutes." You must spell out every step and handle mistakes yourself. Tools like Ansible scripts are mostly like this.</p>
    <p><strong>Comparing tools:</strong></p>
    <ul>
      <li><strong>CloudFormation</strong> — a great recipe book, but it only works in one kitchen (AWS). If you ever move to another cloud, you throw the book away.</li>
      <li><strong>Ansible</strong> — like a handyman who installs apps and sets up the inside of servers you already own. Great for configuring, less great for building the building itself.</li>
      <li><strong>Pulumi</strong> — lets you write your recipe in a real programming language (like TypeScript or Python). Powerful, but you need to be a programmer to read it.</li>
      <li><strong>Terraform</strong> — the recipe book that works in <strong>any kitchen</strong> (AWS, Azure, Google, on-prem). It uses a simple language (HCL) designed just for infrastructure.</li>
    </ul>
    <p><strong>In short:</strong> Terraform won because it works everywhere, is readable, and — best of all — shows you exactly what it will change before it changes anything.</p>
  `,

  // ─── Module 2: HCL Syntax ───

  'tf-hcl-1': `
    <p><strong>HCL</strong> is the language Terraform speaks — like a <strong>shopping list format</strong> designed to be easy for humans to read.</p>
    <p>Everything is built from <strong>blocks</strong>. A block is like a <strong>labeled box</strong>: the label tells you what's inside, and the box holds <code>key = value</code> pairs.</p>
    <pre><code>resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}</code></pre>
    <p>Read it like a sentence: "A resource, specifically an <strong>aws_instance</strong> named <strong>web</strong>, with ami this and instance_type that."</p>
    <p>The main box types you'll meet:</p>
    <ul>
      <li><code>resource</code> — "build me this thing" (the actual cloud object).</li>
      <li><code>data</code> — "look up something that already exists".</li>
      <li><code>provider</code> — "here's how to talk to this cloud".</li>
      <li><code>variable</code> — "a blank on the form the user fills in".</li>
      <li><code>output</code> — "show me this answer after we're done".</li>
      <li><code>module</code> — "reuse this recipe I already made".</li>
    </ul>
    <p>Comments are notes to yourself, like sticky notes on the recipe card: <code>#</code>, <code>//</code>, or <code>/* ... */</code>.</p>
    <p><strong>In short:</strong> HCL is just labeled boxes holding key = value pairs — so readable that code review reads like a grocery list.</p>
  `,

  'tf-hcl-2': `
    <p><strong>Variables, expressions, and functions</strong> are what turn one recipe into many different meals.</p>
    <p>A <strong>variable</strong> is a <strong>blank on a form</strong>. Instead of writing a separate recipe for "dev shop" and "prod shop," you write one recipe with blanks: "Number of ovens: ___, Shop name: ___." Fill in the blanks and you get the right shop.</p>
    <pre><code>variable "instance_count" {
  type    = number
  default = 2
}</code></pre>
    <p>If a blank has a <code>default</code>, it's already filled in unless someone says otherwise. If it has no default, Terraform will nag you to fill it in.</p>
    <p><strong>Expressions</strong> let one part of the recipe refer to another part: "Put this web server in the same network as that one." Terraform looks up the other resource's answer automatically.</p>
    <p><strong>Functions</strong> are small helpers, like kitchen gadgets: <code>upper()</code> makes text loud, <code>join()</code> glues list items together, <code>length()</code> counts things, <code>lookup()</code> safely finds a value in a map.</p>
    <p><strong>count and for_each</strong> are the copy machine — "make 3 of these!" <code>count</code> numbers them 0, 1, 2. <code>for_each</code> copies once per key in a list/map, using nice stable names.</p>
    <p><strong>In short:</strong> variables are form blanks, expressions link things together, functions are gadgets, and count/for_each are copy machines.</p>
  `,

  // ─── Module 3: Providers & Resources ───

  'tf-providers-resources-1': `
    <p><strong>Providers</strong> are like <strong>power adapters</strong> for Terraform.</p>
    <p>Imagine you travel the world with devices that need different plugs — US, UK, Europe. Each country's socket is a different <strong>cloud API</strong>. A provider is the adapter that makes Terraform's instructions work in that country: the <code>aws</code> adapter talks AWS, the <code>google</code> adapter talks Google Cloud.</p>
    <p>When you write:</p>
    <pre><code>resource "aws_instance" "web" { ... }</code></pre>
    <p>Terraform looks at "aws_instance," grabs the <strong>aws adapter</strong>, and asks it: "hey, how do I make an instance in your world?" The adapter translates to the real AWS API calls.</p>
    <p>You tell Terraform which adapter to use and what version in the <code>terraform</code> block:</p>
    <pre><code>terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}</code></pre>
    <p>That's the adapter's name tag (where it lives in the app store) and which version is safe.</p>
    <p>You can even carry <strong>two adapters</strong> for the same country — <code>alias</code> — so one config can build things in two regions at once, like having a US adapter and a UK adapter.</p>
    <p><strong>In short:</strong> Providers are plug adapters between Terraform and each cloud. <code>init</code> downloads them; the provider block configures them.</p>
  `,

  'tf-providers-resources-2': `
    <p><strong>Resources</strong> are the heart of Terraform — each one is a <strong>real thing you want built</strong>: a server, a network, a database.</p>
    <p>Terraform is like a brilliant construction manager who builds things in the right order <strong>automatically</strong>. If the web server needs to be inside a subnet, and the subnet needs to be inside a VPC, the manager figures out: VPC first, then subnet, then web server. That's a <strong>dependency graph</strong>.</p>
    <p>Most dependencies are <strong>implicit</strong> — you just mention another resource and the manager connects the dots:</p>
    <pre><code>resource "aws_instance" "web" {
  subnet_id = aws_subnet.public.id
}</code></pre>
    <p>Sometimes the dependency is invisible — like the app needing to read a config file from a bucket. Then you use <code>depends_on</code> to tell the manager explicitly: "build the bucket before the server, trust me."</p>
    <p><strong>Lifecycle rules</strong> are safety instructions:</p>
    <ul>
      <li><code>prevent_destroy</code> — "NEVER tear this down, even if I ask." Great for databases.</li>
      <li><code>create_before_destroy</code> — "build the new one BEFORE removing the old one," so there's no downtime — like a relay race passing the baton first.</li>
      <li><code>ignore_changes</code> — "don't fuss over this if someone tweaks it outside of Terraform."</li>
    </ul>
    <p><strong>In short:</strong> resources = things to build, dependencies = the right order, lifecycle = safety rules. Terraform handles the ordering for you.</p>
  `,

  // ─── Module 4: State & Backends ───

  'tf-state-1': `
    <p><strong>Terraform state</strong> is Terraform's <strong>memory</strong> — like a little notebook it keeps so it never forgets what it already built.</p>
    <p>Imagine you built a LEGO castle. The state file is a photo + inventory: "Here's the castle, it uses these 5 blue blocks here and 3 red ones there." Next time you ask Terraform to work on it, it checks the photo: "Oh, I already built that — nothing to do." If you moved a tower to the other side by hand, the photo shows the difference, and Terraform says: "Wait, that changed — should I fix it back?"</p>
    <p>That's how Terraform knows what exists, what changed, and what to create. Without the notebook, it would think every server is brand new and try to build duplicates!</p>
    <p>The notebook stores things like:</p>
    <ul>
      <li>The cloud's <strong>ID</strong> for each thing it made (like a serial number).</li>
      <li>The last-known <strong>details</strong> of each thing.</li>
      <li>How the recipe (HCL) maps to the real things.</li>
    </ul>
    <p><strong>Watch out:</strong></p>
    <ul>
      <li>The notebook can hold <strong>secrets</strong> (passwords!). Never commit <code>terraform.tfstate</code> to git.</li>
      <li>It can go <strong>stale</strong> if someone changes the cloud console by hand.</li>
      <li>If two people write in the notebook at once, it can get messy — that's why we lock it (see the next lesson).</li>
    </ul>
    <p><strong>In short:</strong> State = Terraform's memory. It maps your code to the real world, tells you when things drift, and should be treated like a diary — private and carefully kept.</p>
  `,

  'tf-state-2': `
    <p><strong>Remote state</strong> is like keeping your important notebook in a <strong>shared, locked filing cabinet</strong> instead of a paper copy on your desk.</p>
    <p>If each teammate keeps their own photocopy of the notebook, chaos follows: two people build the same server, or edits overwrite each other. A <strong>remote backend</strong> fixes it — everyone reads and writes the SAME notebook, and only one person can write at a time (that's <strong>state locking</strong>, like a library "in use" sign on the study room).</p>
    <p>The classic AWS setup uses an S3 bucket for the notebook and a <strong>DynamoDB table as the "occupied" sign</strong>:</p>
    <pre><code>terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}</code></pre>
    <p>The <code>key</code> is the folder path inside the bucket — like which drawer in the cabinet. The DynamoDB table is the lock that says "someone's writing right now, wait your turn."</p>
    <p>There are other cabinets too: <code>azurerm</code> (Azure), <code>gcs</code> (Google), and Terraform Cloud's own managed state. If you ever switch cabinets, <code>terraform init -migrate-state</code> carries the notebook over without losing anything.</p>
    <p><strong>In short:</strong> Remote backends = one shared, locked, versioned notebook that the whole team uses — no more conflicting photocopies.</p>
  `,

  // ─── Module 5: Modules ───

  'tf-modules-1': `
    <p><strong>Modules</strong> are like <strong>recipe cards you reuse</strong> instead of rewriting the recipe every time.</p>
    <p>Say you build a web shop in dev, stage, and production. Without modules, you copy-paste the same 200 lines of "VPC + subnets + servers + security groups" three times — and the three copies slowly drift apart. With a <strong>module</strong>, you write the recipe ONCE, then just call it: "make me a shop, here's the name."</p>
    <pre><code>module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.8.0"

  name = "main"
  cidr = "10.0.0.0/16"
}</code></pre>
    <p>The <code>source</code> says WHERE the recipe lives — in the public Terraform Registry (like a cookbook library), on GitHub, or in a local folder (<code>./modules/vpc</code>). The <code>version</code> pins which version of the recipe you trust.</p>
    <p>Why bother?</p>
    <ul>
      <li><strong>Don't repeat yourself</strong> — one tested recipe everywhere.</li>
      <li><strong>Consistency</strong> — every environment gets the same defaults and naming.</li>
      <li><strong>Upgrade = version bump</strong> — improve the recipe once, update the version number, done.</li>
    </ul>
    <p><strong>In short:</strong> Modules are reusable recipe cards. Write once, call many times, and upgrade by bumping the version.</p>
  `,

  'tf-modules-2': `
    <p>A good module is like a <strong>vending machine</strong>: buttons on the outside, all the complicated machinery hidden inside.</p>
    <p>The <strong>inputs</strong> are the buttons you press — the module's <code>variable</code> blocks:</p>
    <pre><code>variable "name" {
  type        = string
  description = "A friendly name prefix for all resources"
}</code></pre>
    <p>Good buttons have <strong>types</strong> (string, number, list...) so the machine beeps if you press wrong, and a <strong>description</strong> so everyone knows what the button does.</p>
    <p>The <strong>outputs</strong> are what the machine drops in the tray — results the caller can read:</p>
    <pre><code>output "vpc_id" {
  value = aws_vpc.main.id
}</code></pre>
    <p>The caller never reaches inside the machine; they just read <code>module.vpc.vpc_id</code> like reading the label on the product.</p>
    <p>Best practices that keep modules pleasant:</p>
    <ul>
      <li><strong>Small and single-purpose</strong> — one machine per job (networking, not "everything").</li>
      <li><strong>Type everything</strong> — catch wrong inputs early.</li>
      <li><strong>Describe everything</strong> — descriptions show up in docs and validation.</li>
      <li><strong>Validate</strong> — <code>validation</code> blocks act like a bouncer: "only dev, stg, or prod allowed!"</li>
    </ul>
    <p><strong>In short:</strong> A module's interface is typed inputs (buttons) and documented outputs (results). Keep it small, typed, described, and validated.</p>
  `,

  // ─── Module 6: Workspaces ───

  'tf-workspaces-1': `
    <p><strong>Workspaces</strong> are like <strong>separate save files for the same video game</strong>.</p>
    <p>Same game (same configuration), different save file (different state). In save file "dev," you've built a small village. In save file "prod," the village is much bigger. Play the same game, but each save remembers its own world.</p>
    <p>Commands work like save slots:</p>
    <pre><code>$ terraform workspace new dev   # make a new save slot
$ terraform workspace select prod # switch save slots
$ terraform workspace show        # which am I on?</code></pre>
    <p>With a remote backend, each workspace gets its own folder in the state bucket: <code>env:/dev/terraform.tfstate</code>, <code>env:/prod/terraform.tfstate</code> — so the states never bump into each other.</p>
    <p>You can even make the config <strong>aware of which save file you're in</strong> using <code>terraform.workspace</code>:</p>
    <pre><code>tags = {
  Name = "web-\${terraform.workspace}"
}</code></pre>
    <p>Think of it as the game printing your save slot name on the flag you build.</p>
    <p><strong>In short:</strong> Workspaces = one configuration, many separate save files (states). Perfect for dev / stage / prod with almost identical setups.</p>
  `,

  'tf-workspaces-2': `
    <p>Now that you can make save files (workspaces), the real skill is <strong>running dev, stage, and prod safely</strong> — like a video game speedrunner who never accidentally deletes the main save.</p>
    <p>The pattern is simple: <strong>one configuration + one settings file per environment</strong>.</p>
    <pre><code># dev.tfvars
environment = "dev"
instance_count = 1

# prod.tfvars
environment = "prod"
instance_count = 5</code></pre>
    <pre><code>$ terraform workspace new prod
$ terraform apply -var-file="prod.tfvars"</code></pre>
    <p>Each environment's state lives in its own folder, like <code>env:/prod/network/terraform.tfstate</code>, so switching workspaces never mixes worlds.</p>
    <p><strong>When to use workspaces vs separate folders:</strong></p>
    <ul>
      <li><strong>Workspaces</strong> — environments are almost identical, one team manages them.</li>
      <li><strong>Separate folders</strong> — environments are very different, or different teams/accounts need their own keys to the kingdom.</li>
    </ul>
    <p><strong>Pitfalls to dodge:</strong></p>
    <ul>
      <li>Applying to the <strong>wrong workspace</strong> — always run <code>terraform workspace show</code> first.</li>
      <li><strong>Secrets in committed files</strong> — keep them in workspace variables, never in <code>.tfvars</code> in git.</li>
      <li><strong>Forgotten defaults</strong> — if you don't pass per-env files, every workspace silently uses the same values.</li>
    </ul>
    <p><strong>In short:</strong> One config + per-env variable files + guard rails for prod = safe dev/stage/prod. Double-check which workspace you're on before hitting apply!</p>
  `,

  // ─── Module 7: Terraform Cloud & CI/CD ───

  'tf-cloud-cicd-1': `
    <p><strong>Terraform Cloud</strong> (a.k.a. HCP Terraform) is like <strong>a factory that runs Terraform for your whole team</strong>, instead of everyone running it on their own laptops.</p>
    <p>With a factory, there's:</p>
    <ul>
      <li><strong>One shared notebook</strong> (managed state) that everyone reads from — locked and backed up.</li>
      <li><strong>Robots that do the work</strong> (remote runs) — plans and applies run on the factory floor, not on someone's coffee-spilled laptop.</li>
      <li><strong>Quality checks</strong> (policies) — like a factory inspector that says "no, you can't ship a server with an open door to the internet."</li>
      <li><strong>Approval gates</strong> — "who gets to push the big red APPLY button?" is a permission question, not a free-for-all.</li>
    </ul>
    <p>The magic is the <strong>run lifecycle</strong>, which turns infrastructure changes into a code-review-like flow:</p>
    <pre><code>PR pushed → plan runs → comment on PR ("Plan: 3 to add")
     → human approves → apply runs → done, confirmed</code></pre>
    <p>Connect your GitHub repo, and every pull request automatically gets a <strong>plan</strong> commented on it — before anything is touched. Humans review, then approve.</p>
    <p>You opt in by replacing the <code>backend</code> block with a <code>cloud</code> block:</p>
    <pre><code>terraform {
  cloud {
    organization = "my-org"
    workspaces { name = "networking-prod" }
  }
}</code></pre>
    <p><strong>In short:</strong> Terraform Cloud = a factory with shared state, remote runs, policy checks, and review gates. It turns "terraform apply" from a solo act into a team workflow with a paper trail.</p>
  `,

  'tf-cloud-cicd-2': `
    <p><strong>CI/CD with Terraform</strong> is like a <strong>quality-controlled assembly line</strong>: every change to your infra is checked, reviewed, and only shipped through a secure door.</p>
    <p>The golden rule: <strong>never apply infrastructure straight from your laptop</strong>. Instead, the pipeline does it — and the pipeline has guard rails.</p>
    <p><strong>Step 1 — Plan on every pull request.</strong> When someone opens a PR, GitHub Actions runs <code>terraform plan</code> and posts the result on the PR. Everyone can see "Plan: 3 to add, 1 to change" before anything happens.</p>
    <p><strong>Step 2 — Apply only on merge, behind a locked door.</strong> When a PR merges to <code>main</code>, a separate workflow runs <code>terraform apply</code>. The door is a GitHub <strong>environment</strong> (like <code>production</code>) that requires reviewers and holds the secrets — you can't accidentally stroll into prod.</p>
    <pre><code>jobs:
  apply:
    runs-on: ubuntu-latest
    environment: production   # requires review + secrets
    steps:
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init && terraform apply -auto-approve</code></pre>
    <p><strong>Best practices:</strong></p>
    <ul>
      <li>Credentials come from <strong>GitHub Secrets</strong> — like keys kept in a safe, never written on the recipe.</li>
      <li>Pin the <strong>Terraform version</strong> so everyone uses the same engine.</li>
      <li>Run <code>terraform fmt -check</code> and <code>terraform validate</code> to fail fast on silly mistakes.</li>
      <li>Apply the <strong>exact saved plan</strong> (<code>terraform apply tfplan</code>) so the assembly line does what was reviewed — not something new.</li>
    </ul>
    <p><strong>In short:</strong> Plan on every PR (visible), apply only on merge (gated), secrets in the vault, versions pinned. That's production-safe Terraform.</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5TerraformData = eli5TerraformData;
