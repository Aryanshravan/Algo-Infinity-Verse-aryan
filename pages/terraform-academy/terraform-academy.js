/* ============================================
   TERRAFORM & IaC ACADEMY -- Curriculum, State, HCL Plan Simulator & Quiz
   ============================================ */

const STORAGE_KEY = 'terraformAcademyProgress';

/* ─── Curriculum Data ─── */
const curriculum = [
    {
        id: 'tf-iac-intro',
        title: 'Introduction to Infrastructure as Code',
        lessons: [
            {
                id: 'tf-iac-intro-1',
                title: 'What is Infrastructure as Code?',
                objectives: [
                    'Define Infrastructure as Code (IaC) and its core ideas',
                    'Contrast manual provisioning with IaC workflows',
                    'List the benefits of IaC: speed, consistency, repeatability, reviewability',
                    'Identify the four categories of IaC tools',
                ],
                content: `
                    <h2>What is Infrastructure as Code?</h2>
                    <p><strong>Infrastructure as Code (IaC)</strong> is the practice of managing and provisioning infrastructure — servers, networks, databases, load balancers — through machine-readable definition files, instead of clicking through a web console or typing one-off shell commands.</p>
                    <p>Instead of manually creating an EC2 instance in the AWS console, you write a small file that declares the instance you want:</p>
<pre><code>resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}</code></pre>
                    <p>That file is code. It lives in version control, gets code-reviewed, and can be applied over and over again to produce identical results.</p>

                    <h3>Why infrastructure became code</h3>
                    <p>Manual, click-driven provisioning has fundamental problems:</p>
                    <ul>
                        <li><strong>Drift and snowflakes</strong> — two people building the "same" environment by hand end up with two slightly different environments nobody can reproduce.</li>
                        <li><strong>No audit trail</strong> — a "what changed in prod?" question can only be answered from memory.</li>
                        <li><strong>Slow and error-prone</strong> — humans are slow, and typos in a console form are silent.</li>
                    </ul>
                    <p>IaC turns infrastructure into artifacts that share the same workflow as application code: review, test, tag, version, roll back.</p>

                    <h3>The four categories of IaC tools</h3>
                    <ul>
                        <li><strong>Ad-hoc scripting</strong> — shell scripts or CloudFormation user-data. Fast but not really "code".</li>
                        <li><strong>Configuration management</strong> — Ansible, Puppet, Chef. Great at installing and configuring software on existing servers.</li>
                        <li><strong>Server templating</strong> — Packer, Docker. Bake immutable images/containers.</li>
                        <li><strong>Provisioning tools</strong> — Terraform, CloudFormation, Pulumi. Create and manage the infrastructure itself across your whole stack.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">The mental shift</div>
                        <p>Think of infrastructure as <strong>data + logic</strong>, not as a set of forgotten console clicks. If you can describe your environment in a file, you can version it, review it, and rebuild it.</p>
                    </div>
                `,
                takeaways: [
                    'IaC manages infrastructure through versioned, reviewable definition files',
                    'It eliminates snowflake environments, drift, and the missing audit trail',
                    'Provisioning tools like Terraform create infrastructure; config-management tools configure it',
                    'The workflow mirrors application development: commit, review, plan, apply, roll back',
                ],
                revision: [
                    { label: 'Terraform Overview', url: 'https://developer.hashicorp.com/terraform/intro', tag: 'Docs' },
                    { label: 'What is Infrastructure as Code (HashiCorp Learn)', url: 'https://developer.hashicorp.com/terraform/tutorials/iac-get-started/understand-infrastructure-as-code', tag: 'Tutorial' },
                    { label: 'AWS Academy (compare with click-driven provisioning)', url: '/pages/aws-academy/aws-academy.html', tag: 'Related' },
                ],
                defaultCode: `# main.tf -- declare two resources
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  subnet_id     = aws_vpc.main.id
}`,
            },
            {
                id: 'tf-iac-intro-2',
                title: 'Terraform vs Other IaC Tools',
                objectives: [
                    'Distinguish declarative from imperative IaC approaches',
                    'Compare Terraform with AWS CloudFormation, Ansible, and Pulumi',
                    'Explain what makes Terraform cloud-agnostic',
                    'Understand the role of the Terraform binary and providers',
                ],
                content: `
                    <h2>Choosing Your IaC Tool</h2>
                    <p>Terraform is not the only IaC tool, but it is the most widely adopted <strong>provisioning</strong> tool. Let's compare it against the alternatives you will actually meet in the wild.</p>

                    <h3>Declarative vs imperative</h3>
                    <ul>
                        <li><strong>Declarative</strong> — you describe the <em>desired end state</em> ("I want an instance with this AMI"). Terraform figures out the steps. It can detect drift and destroy things you removed from the file.</li>
                        <li><strong>Imperative</strong> — you describe the <em>steps</em> ("create instance, then attach this disk, then install nginx"). Tools like Ansible and shell scripts are largely imperative. Ordering and error handling are your job.</li>
                    </ul>

                    <h3>Terraform vs the field</h3>
                    <div class="callout">
                        <div class="callout-title">CloudFormation</div>
                        <p><strong>AWS-only.</strong> Declarative JSON/YAML, deeply integrated with AWS IAM and services. If you live 100% in AWS it is excellent — but it locks you to AWS and its template language is verbose.</p>
                    </div>
                    <div class="callout">
                        <div class="callout-title">Ansible</div>
                        <p><strong>Configuration management</strong> first, provisioning second. Agentless over SSH, great at configuring OS packages. Terraform is better at the actual cloud resource graph (networks, IAM, databases). Many teams use both: Terraform to provision, Ansible to configure.</p>
                    </div>
                    <div class="callout">
                        <div class="callout-title">Pulumi</div>
                        <p>Provisioning with <strong>real programming languages</strong> (TypeScript, Python, Go) instead of HCL. Powerful for complex logic; higher learning curve and a different mental model than HCL.</p>
                    </div>

                    <h3>Why Terraform won</h3>
                    <ul>
                        <li><strong>Cloud-agnostic</strong> — one tool and one workflow for AWS, Azure, GCP, and on-prem (vSphere, OpenStack). Providers wrap each platform's API.</li>
                        <li><strong>HCL is purpose-built</strong> — HashiCorp Configuration Language is a readable DSL designed specifically for infrastructure, so code reviews stay productive.</li>
                        <li><strong>Huge provider ecosystem</strong> — thousands of providers for SaaS too: GitHub, Cloudflare, Datadog, Kubernetes, and more.</li>
                        <li><strong>Immutable plan/apply</strong> — Terraform shows you a <em>plan</em> of exactly what it will change before applying. That safety net is unique.</li>
                    </ul>
                `,
                takeaways: [
                    'Declarative tools describe the end state; imperative tools describe the steps',
                    'CloudFormation is AWS-only; Ansible is config-management-first; Pulumi uses real languages',
                    'Terraform is cloud-agnostic because providers wrap each platform API',
                    'Plan-then-apply gives Terraform a built-in safety review gate',
                ],
                revision: [
                    { label: 'Terraform vs. other tools', url: 'https://developer.hashicorp.com/terraform/intro/vs/other', tag: 'Docs' },
                    { label: 'Ansible vs Terraform', url: 'https://developer.hashicorp.com/terraform/intro/vs/ansible', tag: 'Docs' },
                    { label: 'Docker & K8s Academy', url: '/pages/docker-kubernetes-academy/docker-kubernetes-academy.html', tag: 'Related' },
                ],
                defaultCode: `# Same shape of file, different providers
resource "aws_s3_bucket" "storage" {
  bucket = "my-app-bucket"
}

resource "azurerm_resource_group" "rg" {
  name     = "my-app-rg"
  location = "eastus"
}`,
            },
        ],
        quiz: [
            {
                id: 'q-iac-1',
                question: 'Which of these is the core idea of Infrastructure as Code?',
                options: [
                    'Clicking through the cloud console to create resources',
                    'Defining infrastructure in machine-readable, versioned files',
                    'Writing shell scripts that run once',
                    'Manually configuring each server individually',
                ],
                correct: 1,
            },
            {
                id: 'q-iac-2',
                question: 'What is the main difference between declarative and imperative IaC?',
                options: [
                    'Declarative tools are faster than imperative tools',
                    'Imperative tools only work on AWS',
                    'Declarative describes the desired end state; imperative describes the steps',
                    'There is no difference',
                ],
                correct: 2,
            },
            {
                id: 'q-iac-3',
                question: 'Why is Terraform considered cloud-agnostic?',
                options: [
                    'It only works with AWS',
                    'It uses providers that wrap each platform API',
                    'It runs inside every cloud automatically',
                    'It does not talk to any cloud APIs',
                ],
                correct: 1,
            },
            {
                id: 'q-iac-4',
                question: 'Which of the following is a configuration-management tool rather than a provisioning tool?',
                options: ['Terraform', 'CloudFormation', 'Ansible', 'Pulumi'],
                correct: 2,
            },
        ],
    },
    {
        id: 'tf-hcl',
        title: 'HCL Syntax',
        lessons: [
            {
                id: 'tf-hcl-1',
                title: 'Blocks, Arguments & Comments',
                objectives: [
                    'Read and write HCL blocks and arguments',
                    'Understand block types: resource, data, provider, variable, output, module',
                    'Use single-line and block comments',
                    'Recognize identifiers and quoted strings',
                ],
                content: `
                    <h2>The HashiCorp Configuration Language</h2>
                    <p><strong>HCL</strong> (HashiCorp Configuration Language) is Terraform's native configuration language. It is designed to be readable by humans and easy to diff in code review.</p>

                    <h3>Blocks and arguments</h3>
                    <p>An HCL file is a collection of <strong>blocks</strong>. Each block has a <em>type</em> label and a body of <strong>arguments</strong> (<code>key = value</code> pairs):</p>
<pre><code>resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name = "web-server"
  }
}</code></pre>
                    <p>Block types you will use constantly:</p>
                    <ul>
                        <li><code>resource</code> — a real piece of infrastructure ("aws_instance").</li>
                        <li><code>data</code> — read existing infrastructure ("aws_ami").</li>
                        <li><code>provider</code> — configure a provider, e.g. region or profile.</li>
                        <li><code>variable</code> — declare a module or root input.</li>
                        <li><code>output</code> — expose a value after apply.</li>
                        <li><code>module</code> — call a packaged group of resources.</li>
                        <li><code>terraform</code> — required version, backend, and required providers.</li>
                    </ul>

                    <h3>Comments</h3>
                    <pre><code># This is a single-line comment
// This is also a single-line comment

/* This is a
   multi-line comment */</code></pre>

                    <h3>Strings and identifiers</h3>
                    <p><strong>Identifiers</strong> (resource names, variable names) can contain letters, digits, <code>_</code>, and <code>-</code>, and must start with a letter or underscore. <strong>Strings</strong> are double-quoted; use <code>"</code> inside them by escaping: <code>"a \\"quoted\\" word"</code>.</p>

                    <div class="callout">
                        <div class="callout-title">Readability is a feature</div>
                        <p>HCL's job is to make your infrastructure auditable. When every change goes through code review, a language that reads like plain English beats a clever one-liner every time.</p>
                    </div>
                `,
                takeaways: [
                    'Files are collections of labeled blocks with key = value arguments',
                    'The big block types: resource, data, provider, variable, output, module, terraform',
                    'Comments come in #, //, and /* */ flavors',
                    'Identifiers start with a letter/underscore; strings are double-quoted',
                ],
                revision: [
                    { label: 'HCL Configuration Language Syntax', url: 'https://developer.hashicorp.com/terraform/language/syntax/configuration', tag: 'Docs' },
                    { label: 'Terraform Style Guide', url: 'https://developer.hashicorp.com/terraform/language/style', tag: 'Docs' },
                    { label: 'TypeScript Academy (types for the logic-minded)', url: '/pages/typescript-academy/typescript-academy.html', tag: 'Related' },
                ],
                defaultCode: `# Top-level blocks
terraform {
  required_version = ">= 1.5"
}

variable "name" {
  type    = string
  default = "demo"
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name = var.name  # argument with a variable reference
  }
}`,
            },
            {
                id: 'tf-hcl-2',
                title: 'Variables, Expressions & Functions',
                objectives: [
                    'Declare variables with types and defaults',
                    'Use interpolation expressions and references',
                    'Apply built-in functions in expressions',
                    'Loop with count and for_each',
                ],
                content: `
                    <h2>Making HCL Dynamic</h2>
                    <p>Hard-coding values makes your configuration fragile. Variables, expressions, and functions let one configuration produce many environments.</p>

                    <h3>Variables</h3>
                    <pre><code>variable "instance_count" {
  type    = number
  default = 2
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Which environment this applies to"
}</code></pre>
                    <p>Set values via <code>-var</code>, a <code>.tfvars</code> file, or environment variables. Required variables have no <code>default</code> — Terraform will prompt for them.</p>

                    <h3>Expressions and references</h3>
                    <p>Reference other resources and variables with <code>resource.type.name.attribute</code>:</p>
<pre><code>resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type
  subnet_id     = aws_subnet.main.id   # reference to another resource
  user_data     = "server-name: \${var.environment}"
}</code></pre>

                    <h3>Built-in functions</h3>
                    <p>Terraform ships with ~150 functions. Common ones:</p>
                    <ul>
                        <li><code>length(var.instances)</code> — count items in a list/map.</li>
                        <li><code>lower()</code>, <code>upper()</code>, <code>format()</code> — string helpers.</li>
                        <li><code>join(", ", list)</code>, <code>split(",", str)</code> — assemble/decompose strings.</li>
                        <li><code>lookup(map, key, default)</code> — safe map access.</li>
                        <li><code>merge(map1, map2)</code> — combine maps.</li>
                        <li><code>file("path")</code> — read a file's contents.</li>
                    </ul>

                    <h3>count and for_each</h3>
                    <pre><code>resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name = "web-\${count.index}"
  }
}</code></pre>
                    <p><code>count</code> creates N copies addressed by index; <code>for_each</code> iterates a map/set with string keys (safer for reordering).</p>
                `,
                takeaways: [
                    'Variables add type + default; required variables must be supplied',
                    'Expressions reference other resources and variables',
                    'Functions transform strings, collections, and files',
                    'count gives indexed copies; for_each iterates maps/sets with stable keys',
                ],
                revision: [
                    { label: 'Variables and Outputs', url: 'https://developer.hashicorp.com/terraform/language/values/variables', tag: 'Docs' },
                    { label: 'Functions list', url: 'https://developer.hashicorp.com/terraform/language/functions', tag: 'Docs' },
                    { label: 'count and for_each', url: 'https://developer.hashicorp.com/terraform/language/meta-arguments/count', tag: 'Docs' },
                ],
                defaultCode: `variable "environment" {
  type    = string
  default = "dev"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

resource "aws_security_group" "web" {
  name = "web-\${var.environment}"
}

resource "aws_instance" "web" {
  count           = 2
  ami             = "ami-0c55b159cbfafe1f0"
  instance_type   = var.instance_type
  security_groups = [aws_security_group.web.name]
  tags = {
    Name = "\${var.environment}-web-\${count.index}"
  }
}`,
            },
        ],
        quiz: [
            {
                id: 'q-hcl-1',
                question: 'Which block type declares an input to a module or root configuration?',
                options: ['resource', 'output', 'variable', 'data'],
                correct: 2,
            },
            {
                id: 'q-hcl-2',
                question: 'How do you reference an attribute of another resource?',
                options: [
                    'resource.aws_instance.web.id',
                    'aws_instance.web.id',
                    'aws_instance.web.attribute.id',
                    'web.id',
                ],
                correct: 1,
            },
            {
                id: 'q-hcl-3',
                question: 'What does the length() function do?',
                options: [
                    'Creates a new list',
                    'Returns the number of elements in a collection or string',
                    'Formats a string to a fixed length',
                    'Deletes the last element of a list',
                ],
                correct: 1,
            },
            {
                id: 'q-hcl-4',
                question: 'Which meta-argument should you prefer when you need stable string keys for iteration?',
                options: ['count', 'for_each', 'depends_on', 'lifecycle'],
                correct: 1,
            },
        ],
    },
    {
        id: 'tf-providers-resources',
        title: 'Providers & Resources',
        lessons: [
            {
                id: 'tf-providers-resources-1',
                title: 'Providers & Provider Configuration',
                objectives: [
                    'Explain what a provider is and how it wraps cloud APIs',
                    'Configure the required_providers and provider blocks',
                    'Use version constraints and multiple aliases',
                    'Understand implicit provider installation',
                ],
                content: `
                    <h2>Providers: Terraform's Cloud Adapters</h2>
                    <p>A <strong>provider</strong> is a plugin that implements a resource type by calling a cloud or service API. The <code>aws</code> provider knows how to create <code>aws_instance</code>; the <code>google</code> provider knows how to create <code>google_compute_instance</code>. Everything Terraform can manage lives behind a provider.</p>

                    <h3>Declaring providers</h3>
<pre><code>terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}</code></pre>
                    <ul>
                        <li><code>source</code> — where the plugin lives: <code>&lt;registry-namespace&gt;/&lt;provider-name&gt;</code>. <code>hashicorp/aws</code> means the official AWS provider on the Terraform Registry.</li>
                        <li><code>version</code> — a version constraint. <code>~> 5.0</code> allows any 5.x; <code>= 5.31.0</code> pins exactly.</li>
                        <li><code>provider</code> block — config such as <code>region</code>, <code>profile</code>, or credentials. Credentials usually come from environment variables or default chains instead.</li>
                    </ul>

                    <h3>Multiple configurations with aliases</h3>
                    <p>Use <code>alias</code> to manage resources in more than one region or account from a single configuration:</p>
<pre><code>provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

resource "aws_instance" "backup" {
  provider = aws.west
  ami      = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Under the hood</div>
                        <p>On <code>terraform init</code>, Terraform downloads each required provider plugin from the Terraform Registry into a local plugin cache, and records the locked version in <code>.terraform.lock.hcl</code>.</p>
                    </div>
                `,
                takeaways: [
                    'Providers are plugins that map HCL resource types to real APIs',
                    'required_providers pins source and version; provider blocks configure them',
                    'Aliases let one configuration target multiple regions or accounts',
                    'init downloads plugins and creates .terraform.lock.hcl',
                ],
                revision: [
                    { label: 'Providers', url: 'https://developer.hashicorp.com/terraform/language/providers', tag: 'Docs' },
                    { label: 'Provider Requirements', url: 'https://developer.hashicorp.com/terraform/language/providers/requirements', tag: 'Docs' },
                    { label: 'AWS Academy (the API these providers wrap)', url: '/pages/aws-academy/aws-academy.html', tag: 'Related' },
                ],
                defaultCode: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}`,
            },
            {
                id: 'tf-providers-resources-2',
                title: 'Resources, Dependencies & Lifecycle',
                objectives: [
                    'Create resources and use their exported attributes',
                    'Understand implicit and explicit dependencies',
                    'Control ordering and safety with lifecycle rules',
                    'Use count, for_each, and providers with resources',
                ],
                content: `
                    <h2>Resources Are the Heart of Terraform</h2>
                    <p>A <strong>resource</strong> is the most important block: it represents a real piece of infrastructure. Terraform builds a <strong>dependency graph</strong> from resource references and applies them in the correct order.</p>

                    <h3>Implicit dependencies</h3>
                    <p>When one resource references another, the dependency is <em>implicit</em> — Terraform figures it out:</p>
<pre><code>resource "aws_instance" "web" {
  subnet_id = aws_subnet.public.id   # web depends on subnet
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id      # subnet depends on vpc
}</code></pre>
                    <p>Both can be declared in any order; the graph orders creation.</p>

                    <h3>Explicit dependencies</h3>
                    <p>Sometimes a dependency exists that Terraform cannot see (e.g. the app reads a config value). Force ordering with <code>depends_on</code>:</p>
<pre><code>resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}

resource "aws_instance" "app" {
  depends_on = [aws_s3_bucket.data]
  ami        = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}</code></pre>

                    <h3>The lifecycle block</h3>
                    <pre><code>resource "aws_db_instance" "primary" {
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_launch_template" "web" {
  lifecycle {
    create_before_destroy = true
  }
}</code></pre>
                    <ul>
                        <li><code>prevent_destroy</code> — fail the plan if this resource would be destroyed. Use on databases and other precious resources.</li>
                        <li><code>create_before_destroy</code> — create the replacement before removing the old one (zero-downtime updates).</li>
                        <li><code>ignore_changes</code> — stop Terraform from reverting specific out-of-band changes.</li>
                    </ul>

                    <h3>Meta-arguments apply everywhere</h3>
                    <p><code>count</code>, <code>for_each</code>, <code>provider</code>, <code>depends_on</code>, and <code>lifecycle</code> are <strong>meta-arguments</strong>: they work on any resource, data source, or module block.</p>
                `,
                takeaways: [
                    'Resources map 1:1 to real infrastructure and export attributes',
                    'Implicit dependencies come from references; depends_on forces hidden ordering',
                    'lifecycle rules: prevent_destroy, create_before_destroy, ignore_changes',
                    'Meta-arguments (count, for_each, provider, lifecycle) work everywhere',
                ],
                revision: [
                    { label: 'Resource Blocks', url: 'https://developer.hashicorp.com/terraform/language/resources/syntax', tag: 'Docs' },
                    { label: 'Resource Dependencies', url: 'https://developer.hashicorp.com/terraform/language/resources/behavior', tag: 'Docs' },
                    { label: 'Lifecycle Meta-Argument', url: 'https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle', tag: 'Docs' },
                ],
                defaultCode: `resource "aws_s3_bucket" "data" {
  bucket = "analytics-raw"
}

resource "aws_instance" "app" {
  depends_on = [aws_s3_bucket.data]
  ami        = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  lifecycle {
    create_before_destroy = true
  }
  tags = {
    Name = "app-server"
  }
}`,
            },
        ],
        quiz: [
            {
                id: 'q-prov-1',
                question: 'What does the source "hashicorp/aws" in required_providers mean?',
                options: [
                    'The AWS API endpoint',
                    'The provider plugin lives in the hashicorp namespace on the Terraform Registry',
                    'A local path to the AWS SDK',
                    'The version of Terraform to use',
                ],
                correct: 1,
            },
            {
                id: 'q-prov-2',
                question: 'How does Terraform know the order to create resources?',
                options: [
                    'It asks the user for each step',
                    'It uses the order they appear in the file',
                    'It builds a dependency graph from references',
                    'It creates everything in parallel randomly',
                ],
                correct: 2,
            },
            {
                id: 'q-prov-3',
                question: 'Which lifecycle argument prevents a resource from ever being destroyed?',
                options: ['create_before_destroy', 'prevent_destroy', 'ignore_changes', 'depends_on'],
                correct: 1,
            },
            {
                id: 'q-prov-4',
                question: 'When would you use an explicit depends_on?',
                options: [
                    'When Terraform already sees the reference',
                    'When a dependency exists that Terraform cannot infer from references',
                    'When you want to break the dependency graph',
                    'To make resources run in parallel',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'tf-state',
        title: 'State & Backends',
        lessons: [
            {
                id: 'tf-state-1',
                title: 'Understanding Terraform State',
                objectives: [
                    'Explain what the state file is and why it exists',
                    'List what state contains: IDs, attributes, mappings',
                    'Recognize risks: secrets in state, stale state, lock contention',
                    'Use the terraform state commands safely',
                ],
                content: `
                    <h2>terraform.tfstate — Terraform's Memory</h2>
                    <p>After an apply, Terraform writes a <strong>state file</strong> (by default <code>terraform.tfstate</code>) that maps your configuration to the real resources it created. State is Terraform's memory: without it, Terraform would think every resource is brand new.</p>

                    <h3>What state stores</h3>
                    <ul>
                        <li>Each resource's <strong>unique ID</strong> in the cloud (e.g. <code>i-0a1b2c3d</code>).</li>
                        <li>The resource's <strong>attributes</strong> from the last apply.</li>
                        <li>The <strong>mapping</strong> between HCL addresses (<code>aws_instance.web</code>) and real objects.</li>
                        <li>Metadata like dependencies, provider details, and the schema version.</li>
                    </ul>

                    <h3>Why state matters</h3>
                    <pre><code>$ terraform show
# aws_instance.web:
resource "aws_instance" "web" {
  id            = "i-0a1b2c3d4e5f6a7b8"
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
}</code></pre>
                    <p>Terraform reads the state to compute a plan: if the real instance differs from state (drift), Terraform shows a change; if state matches, <code>No changes</code>.</p>

                    <h3>State risks and how to handle them</h3>
                    <ul>
                        <li><strong>Sensitive data</strong> — passwords and keys stored in resource attributes land in state. Never commit <code>terraform.tfstate</code> to git, and use <code>sensitive = true</code> where possible.</li>
                        <li><strong>Stale state</strong> — if someone edits the cloud console directly, state goes stale. Import the change (<code>terraform import</code>) or let a plan show drift.</li>
                        <li><strong>Locking</strong> — two concurrent applies corrupt state. Remote backends provide <strong>state locking</strong>.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Rule of thumb</div>
                        <p>State is a <em>source of truth for the mapping</em>, not for configuration. Configuration (your HCL) always wins; state records what the configuration produced.</p>
                    </div>
                `,
                takeaways: [
                    'State maps HCL addresses to real cloud resource IDs and attributes',
                    'Plans are computed by diffing state against the desired config',
                    'State can contain secrets, drift, and lock contention — protect it',
                    'terraform show / import / state commands inspect and repair state',
                ],
                revision: [
                    { label: 'Terraform State', url: 'https://developer.hashicorp.com/terraform/language/state', tag: 'Docs' },
                    { label: 'State file storage', url: 'https://developer.hashicorp.com/terraform/language/state/backends', tag: 'Docs' },
                    { label: 'Sensitive data in state', url: 'https://developer.hashicorp.com/terraform/language/state/sensitive-data', tag: 'Docs' },
                ],
                defaultCode: `# State example: what terraform.tfstate tracks
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name = "web"
  }
}

# Sensitive attributes should be marked
resource "aws_db_instance" "primary" {
  engine         = "postgres"
  engine_version = "15.4"
  password       = var.db_password
  skip_final_snapshot = false
}`,
            },
            {
                id: 'tf-state-2',
                title: 'Remote State & Backends',
                objectives: [
                    'Compare local and remote state',
                    'Configure an S3 backend with DynamoDB locking',
                    'Understand workspace and state separation',
                    'List backend options: s3, azurerm, gcs, terraform cloud',
                ],
                content: `
                    <h2>Shared, Locked, Versioned State</h2>
                    <p>Local state in a git repo is fine for solo experimentation — and dangerous for teams. The answer is a <strong>remote backend</strong>: state stored centrally, locked during operations, and versioned for recovery.</p>

                    <h3>Why remote state</h3>
                    <ul>
                        <li><strong>Team sharing</strong> — everyone works against the same state file.</li>
                        <li><strong>State locking</strong> — prevents two applies from racing and corrupting state.</li>
                        <li><strong>Versioning & backup</strong> — every state write can be recovered.</li>
                        <li><strong>CI/CD</strong> — pipelines can run plan/apply without a local copy of state.</li>
                    </ul>

                    <h3>The S3 backend (the classic pattern)</h3>
<pre><code>terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}</code></pre>
                    <ul>
                        <li><code>bucket</code> + <code>key</code> — where the state object lives. The <code>key</code> is like a folder path, often <code>env/component</code>.</li>
                        <li><code>dynamodb_table</code> — a DynamoDB table used for <strong>state locking</strong>.</li>
                        <li><code>encrypt</code> — server-side encryption at rest.</li>
                    </ul>

                    <h3>Other backends</h3>
                    <ul>
                        <li><code>azurerm</code> — Azure Storage with blob lease locking.</li>
                        <li><code>gcs</code> — Google Cloud Storage with bucket locking.</li>
                        <li><code>terraform</code> — Terraform Cloud / HCP Terraform managed state with built-in locking and VCS integration.</li>
                        <li><code>local</code> — the default; state on disk.</li>
                    </ul>

                    <h3>Backend migration</h3>
                    <p>Changing backends is non-destructive: run <code>terraform init -migrate-state</code> and Terraform moves the existing state from the old backend to the new one.</p>

                    <div class="callout">
                        <div class="callout-title">Backends vs providers</div>
                        <p>Backends store <em>state</em>; providers manage <em>resources</em>. A common gotcha: backend blocks use static configuration (no variables or references) because they are resolved before Terraform evaluates variables.</p>
                    </div>
                `,
                takeaways: [
                    'Remote backends give shared, locked, versioned state',
                    'S3 backend + DynamoDB lock table is the canonical AWS pattern',
                    'Other options: azurerm, gcs, and the Terraform Cloud backend',
                    'init -migrate-state moves state between backends safely',
                ],
                revision: [
                    { label: 'Backend Configuration', url: 'https://developer.hashicorp.com/terraform/language/settings/backends/configuration', tag: 'Docs' },
                    { label: 'S3 backend details', url: 'https://developer.hashicorp.com/terraform/language/settings/backends/s3', tag: 'Docs' },
                    { label: 'State Locking', url: 'https://developer.hashicorp.com/terraform/language/state/locking', tag: 'Docs' },
                ],
                defaultCode: `terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "main-vpc"
  }
}`,
            },
        ],
        quiz: [
            {
                id: 'q-state-1',
                question: 'Why does Terraform need a state file?',
                options: [
                    'To store the HCL source code',
                    'To map configuration addresses to real resource IDs and attributes',
                    'To cache provider plugins',
                    'To authenticate API calls',
                ],
                correct: 1,
            },
            {
                id: 'q-state-2',
                question: 'Why should you never commit terraform.tfstate to git?',
                options: [
                    'It makes Terraform slower',
                    'It can contain sensitive attribute values and secrets',
                    'Git does not support JSON files',
                    'It is automatically deleted after apply',
                ],
                correct: 1,
            },
            {
                id: 'q-state-3',
                question: 'In the S3 backend pattern, what provides state locking?',
                options: ['The S3 bucket itself', 'A DynamoDB table', 'An RDS instance', 'Lambda functions'],
                correct: 1,
            },
            {
                id: 'q-state-4',
                question: 'Which command migrates state to a newly configured backend?',
                options: ['terraform apply', 'terraform plan', 'terraform init -migrate-state', 'terraform state mv'],
                correct: 2,
            },
        ],
    },
    {
        id: 'tf-modules',
        title: 'Modules',
        lessons: [
            {
                id: 'tf-modules-1',
                title: 'Module Basics & Composition',
                objectives: [
                    'Explain what a module is and why to use them',
                    'Call a module with source and version',
                    'Understand the root module and child modules',
                    'Compose modules to build environments',
                ],
                content: `
                    <h2>Modules: Reusable Building Blocks</h2>
                    <p>A <strong>module</strong> is a self-contained collection of <code>.tf</code> files that create a set of related resources. Any directory with Terraform files is a module — the folder you run <code>terraform apply</code> in is the <strong>root module</strong>.</p>

                    <h3>Calling a module</h3>
<pre><code>module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.8.0"

  name = "main"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
}</code></pre>
                    <ul>
                        <li><code>source</code> — where the module code lives: Terraform Registry (<code>namespace/name/provider</code>), a git URL, or a local path (<code>./modules/vpc</code>).</li>
                        <li><code>version</code> — required when using the registry; pin releases like providers.</li>
                        <li>Everything else — the module's declared <strong>input variables</strong>.</li>
                    </ul>

                    <h3>Why modules</h3>
                    <ul>
                        <li><strong>DRY</strong> — one tested VPC/EC2/EKS pattern reused across every environment.</li>
                        <li><strong>Consistency</strong> — naming, tagging, and security defaults enforced in one place.</li>
                        <li><strong>Reviewability</strong> — complex systems become a readable list of module calls.</li>
                        <li><strong>Versioning</strong> — upgrade infrastructure by bumping a module version.</li>
                    </ul>

                    <h3>Local modules</h3>
                    <p>Before publishing to the registry, extract reusable code into <code>./modules/&lt;name&gt;/</code> and call with a relative source:</p>
<pre><code>module "database" {
  source = "./modules/postgres"
  name   = "app-db"
}</code></pre>

                    <div class="callout">
                        <div class="callout-title">Composition over monoliths</div>
                        <p>Break a large root module into modules per component (networking, compute, data). Each module gets its own variables, outputs, and lifecycle — this is how real Terraform estates stay manageable.</p>
                    </div>
                `,
                takeaways: [
                    'A module is any folder of Terraform files; the one you apply is the root module',
                    'Call modules with source + version, passing input variables',
                    'Registry modules are referenced as namespace/name/provider',
                    'Modules bring DRY, consistency, reviewability, and versioning',
                ],
                revision: [
                    { label: 'Modules Overview', url: 'https://developer.hashicorp.com/terraform/language/modules', tag: 'Docs' },
                    { label: 'Terraform Registry', url: 'https://registry.terraform.io/', tag: 'Docs' },
                    { label: 'Module sources', url: 'https://developer.hashicorp.com/terraform/language/modules/sources', tag: 'Docs' },
                ],
                defaultCode: `# Calling the well-known VPC module from the registry
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.8.0"

  name = "prod"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
}`,
            },
            {
                id: 'tf-modules-2',
                title: 'Module Inputs, Outputs & Best Practices',
                objectives: [
                    'Author a module with variables and outputs',
                    'Document modules with descriptions',
                    'Expose outputs to the caller',
                    'Apply module best practices: small, typed, tested',
                ],
                content: `
                    <h2>Authoring a Good Module</h2>
                    <p>A reusable module exposes a clean interface: <strong>inputs</strong> (variables) and <strong>outputs</strong> (results). Callers never touch the module's internals — they use what the interface allows.</p>

                    <h3>Declaring inputs</h3>
                    <p>Every input gets a <code>type</code> and a <code>description</code>. Use required variables for things callers must supply; provide <code>default</code>s for sensible options:</p>
<pre><code>variable "name" {
  type        = string
  description = "A friendly name prefix for all resources"
}

variable "instance_type" {
  type        = string
  default     = "t3.micro"
  description = "EC2 instance type"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to every resource"
}</code></pre>

                    <h3>Declaring outputs</h3>
                    <p>Outputs are the module's return values — the caller reads them with <code>module.vpc.id</code>:</p>
<pre><code>output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}</code></pre>

                    <h3>Best practices</h3>
                    <ul>
                        <li><strong>Small and single-purpose</strong> — one concern per module (networking, not "everything").</li>
                        <li><strong>Type everything</strong> — <code>string</code>, <code>number</code>, <code>list(string)</code>, <code>map(string)</code> catch errors early.</li>
                        <li><strong>Describe everything</strong> — variables and outputs without <code>description</code> fail the <code>terraform validate</code> on registry publish.</li>
                        <li><strong>Tag everything</strong> — a <code>tags</code> input merged onto all resources helps cost attribution.</li>
                        <li><strong>Version and test</strong> — release module versions with <code>terraform init -upgrade</code> in consumers; test with Terratest/terraform test.</li>
                    </ul>

                    <h3>Validation</h3>
                    <pre><code>variable "env" {
  type        = string
  description = "Environment name"
  validation {
    condition     = contains(["dev", "stg", "prod"], var.env)
    error_message = "Env must be dev, stg, or prod."
  }
}</code></pre>
                `,
                takeaways: [
                    'Module interface = typed input variables + documented outputs',
                    'Callers read outputs as module.<name>.<output>',
                    'Small single-purpose modules with full types and descriptions win',
                    'validation blocks enforce allowed values at plan time',
                ],
                revision: [
                    { label: 'Module composition', url: 'https://developer.hashicorp.com/terraform/language/modules/develop/composition', tag: 'Docs' },
                    { label: 'Custom validation rules', url: 'https://developer.hashicorp.com/terraform/language/values/variables#custom-validation-rules', tag: 'Docs' },
                    { label: 'Publishing modules', url: 'https://developer.hashicorp.com/terraform/registry/modules/publish', tag: 'Docs' },
                ],
                defaultCode: `# Consuming a local module: ./modules/webserver
module "webserver" {
  source        = "./modules/webserver"
  name          = "app"
  instance_type = "t3.micro"
  vpc_id        = "vpc-0a1b2c3d4e5f6a7b8"
}

output "web_public_ip" {
  value = module.webserver.public_ip
}`,
            },
        ],
        quiz: [
            {
                id: 'q-mod-1',
                question: 'What is the root module?',
                options: [
                    'The first module listed in a file',
                    'The directory where you run terraform apply',
                    'The most important child module',
                    'The module that has no outputs',
                ],
                correct: 1,
            },
            {
                id: 'q-mod-2',
                question: 'How do you make a value from a module available to its caller?',
                options: ['variable block', 'output block', 'locals block', 'data source'],
                correct: 1,
            },
            {
                id: 'q-mod-3',
                question: 'Why should module variables be typed?',
                options: [
                    'To make the code slower',
                    'To catch mistakes at plan time and improve documentation',
                    'Because HCL requires it for all variables',
                    'To avoid writing descriptions',
                ],
                correct: 1,
            },
            {
                id: 'q-mod-4',
                question: 'Which source would you use to call a module from the Terraform Registry?',
                options: [
                    '"./modules/vpc"',
                    '"git::https://github.com/org/repo.git"',
                    '"terraform-aws-modules/vpc/aws"',
                    '"/opt/vpc"',
                ],
                correct: 2,
            },
        ],
    },
    {
        id: 'tf-workspaces',
        title: 'Workspaces',
        lessons: [
            {
                id: 'tf-workspaces-1',
                title: 'Workspace Fundamentals',
                objectives: [
                    'Define what a Terraform workspace is',
                    'Use the workspace CLI commands',
                    'Explain how workspaces separate state',
                    'Reference the current workspace in configuration',
                ],
                content: `
                    <h2>Workspaces: Separate States, One Configuration</h2>
                    <p>A <strong>workspace</strong> is a named, isolated state for the same configuration. The default workspace is <code>default</code>. Creating a workspace gives you a separate state file while reusing the same code — a natural fit for dev/stage/prod.</p>

                    <h3>Working with workspaces</h3>
                    <pre><code>$ terraform workspace list
* default

$ terraform workspace new dev
Created and switched to workspace "dev"!

$ terraform workspace select prod
Switched to workspace "prod".

$ terraform workspace show
prod</code></pre>
                    <p>With the S3 backend, each workspace maps to a state key prefix — <code>env:/dev/terraform.tfstate</code> — so states never collide.</p>

                    <h3>Referencing the workspace</h3>
                    <p>Use <code>terraform.workspace</code> to vary values per workspace:</p>
<pre><code>resource "aws_instance" "web" {
  tags = {
    Name = "web-\${terraform.workspace}"
  }
}</code></pre>
                    <p>Be careful: <code>terraform.workspace</code> works anywhere, but a clean design passes it explicitly:</p>
<pre><code>variable "environment" {
  type    = string
  default = "dev"
}
# run with: terraform apply -var="environment=prod"</code></pre>

                    <h3>Two questions to ask</h3>
                    <ul>
                        <li><strong>Are the environments similar?</strong> If they share 90% of the config, workspaces reduce duplication.</li>
                        <li><strong>Do you need separate permission boundaries?</strong> Different teams/accounts may need separate directories instead of workspaces.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Workspaces vs directories</div>
                        <p>Workspaces share <em>one</em> configuration with <em>N</em> states. Separate directories share nothing at all. Choose based on how different your environments really are.</p>
                    </div>
                `,
                takeaways: [
                    'Workspaces are named, isolated state for the same configuration',
                    'CLI: workspace new/list/select/show; each state is env:/<name>',
                    'terraform.workspace references the active workspace in config',
                    'Use workspaces when environments are mostly identical',
                ],
                revision: [
                    { label: 'Workspaces', url: 'https://developer.hashicorp.com/terraform/language/state/workspaces', tag: 'Docs' },
                    { label: 'Workspace commands', url: 'https://developer.hashicorp.com/terraform/cli/commands/workspace', tag: 'Docs' },
                    { label: 'Git & GitHub Academy (branch-per-env analog)', url: '/pages/git-academy/git-academy.html', tag: 'Related' },
                ],
                defaultCode: `# Tags change per workspace
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name        = "web-\${terraform.workspace}"
    Environment = terraform.workspace
  }
}

variable "instance_count" {
  type    = number
  default = 1
}`,
            },
            {
                id: 'tf-workspaces-2',
                title: 'Workspaces in Practice',
                objectives: [
                    'Design workspace-based environments (dev/stg/prod)',
                    'Pass per-workspace variables safely',
                    'Choose between workspaces and separate directories',
                    'Manage state and variables for each workspace',
                ],
                content: `
                    <h2>Real-World Workspace Patterns</h2>
                    <p>Once you master the mechanics, the real challenge is designing environments that are easy to reason about and safe to change.</p>

                    <h3>The dev/stg/prod pattern</h3>
<pre><code># terraform.tfvars (defaults)
environment = "dev"

# prod.tfvars
environment = "prod"
instance_count = 5
</code></pre>
                    <pre><code>$ terraform workspace new prod
$ terraform apply -var-file="prod.tfvars"</code></pre>
                    <p>Each workspace state lives at its own <code>key</code> in the backend. A common naming convention:</p>
<pre><code>key = "env:/prod/network/terraform.tfstate"</code></pre>

                    <h3>Per-workspace variables</h3>
                    <ul>
                        <li><code>-var-file="&lt;env&gt;.tfvars"</code> — simple, explicit, works with any backend.</li>
                        <li>Environment variables (<code>TF_VAR_environment=prod</code>) — great for CI/CD.</li>
                        <li>Terraform Cloud workspace variables — managed per workspace in the UI, optionally sensitive/encrypted.</li>
                    </ul>

                    <h3>Workspaces or directories?</h3>
                    <table class="compare-table">
                        <tr><th>Use workspaces when…</th><th>Use directories when…</th></tr>
                        <tr><td>Environments are near-identical</td><td>Environments differ a lot</td></tr>
                        <tr><td>You want one state area to manage</td><td>Teams/ACLs need isolation</td></tr>
                        <tr><td>Promoting between envs via state copy</td><td>You need distinct backends or credentials</td></tr>
                    </table>

                    <h3>Pitfalls</h3>
                    <ul>
                        <li><strong>Accidentally applying the wrong workspace</strong> — always run <code>terraform workspace show</code> and use guard rails in CI.</li>
                        <li><strong>Secret leakage</strong> — keep secrets in workspace variables, never in <code>.tfvars</code> committed to git.</li>
                        <li><strong>Variable defaults</strong> — without per-workspace values, every workspace silently uses the same defaults.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">Guard rails in CI</div>
                        <p>Block applies to the <code>prod</code> workspace unless the pipeline explicitly approves. Many teams forbid plan/apply from laptops entirely and require all changes to flow through review.</p>
                    </div>
                `,
                takeaways: [
                    'Use one config + per-workspace .tfvars files for dev/stg/prod',
                    'State keys follow env:/<workspace>/<component>/terraform.tfstate',
                    'Workspaces fit near-identical envs; directories fit divergent ones',
                    'Guard prod applies and keep secrets out of committed files',
                ],
                revision: [
                    { label: 'When to use workspaces', url: 'https://developer.hashicorp.com/terraform/cloud-docs/workspaces', tag: 'Docs' },
                    { label: 'Terraform Cloud workspace variables', url: 'https://developer.hashicorp.com/terraform/cloud-docs/workspaces/variables', tag: 'Docs' },
                    { label: 'Continuous Delivery with Terraform Cloud', url: 'https://developer.hashicorp.com/terraform/tutorials/automation/automate-terraform', tag: 'Tutorial' },
                ],
                defaultCode: `variable "environment" {
  type    = string
  default = "dev"
}

variable "instance_count" {
  type    = number
  default = 1
}

resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name        = "\${var.environment}-web-\${count.index}"
    Environment = var.environment
  }
}`,
            },
        ],
        quiz: [
            {
                id: 'q-ws-1',
                question: 'What does a Terraform workspace isolate?',
                options: [
                    'The provider plugins',
                    'The state file for the same configuration',
                    'The HCL source code',
                    'The Terraform binary version',
                ],
                correct: 1,
            },
            {
                id: 'q-ws-2',
                question: 'Which command creates and switches to a new workspace named "prod"?',
                options: [
                    'terraform workspace new prod',
                    'terraform workspace create prod',
                    'terraform init prod',
                    'terraform apply -workspace=prod',
                ],
                correct: 0,
            },
            {
                id: 'q-ws-3',
                question: 'How do you reference the current workspace inside configuration?',
                options: ['workspace.name', 'var.workspace', 'terraform.workspace', 'local.workspace'],
                correct: 2,
            },
            {
                id: 'q-ws-4',
                question: 'When should you prefer separate directories over workspaces?',
                options: [
                    'When environments are near-identical',
                    'When you need strong isolation of teams, credentials, or ACLs',
                    'When using only one environment',
                    'When using the local backend',
                ],
                correct: 1,
            },
        ],
    },
    {
        id: 'tf-cloud-cicd',
        title: 'Terraform Cloud & CI/CD',
        lessons: [
            {
                id: 'tf-cloud-cicd-1',
                title: 'Terraform Cloud Workspaces & Runs',
                objectives: [
                    'Explain what Terraform Cloud (HCP Terraform) provides',
                    'Understand the run lifecycle: plan, review, apply',
                    'Set up a VCS-driven workspace',
                    'Compare local and remote operations',
                ],
                content: `
                    <h2>Centralized, VCS-Driven Terraform</h2>
                    <p><strong>Terraform Cloud</strong> (now HCP Terraform) is HashiCorp's managed service: remote state, remote plan/apply, policy checks, and VCS-driven workflows — so infrastructure changes flow through review like code changes.</p>

                    <h3>What it gives you</h3>
                    <ul>
                        <li><strong>Managed remote state</strong> with locking and encryption built in.</li>
                        <li><strong>Remote runs</strong> — plan and apply execute on Terraform Cloud workers, not your laptop.</li>
                        <li><strong>VCS integration</strong> — connect a GitHub/GitLab repo; a pull request triggers an automatic plan.</li>
                        <li><strong>Sentinel / OPA policies</strong> — enforce rules like "no public S3 buckets" before apply.</li>
                        <li><strong>Team permissions</strong> — separate who can plan, who can apply, who can manage state.</li>
                    </ul>

                    <h3>The run lifecycle</h3>
                    <pre><code>PR pushed → plan queued → plan runs
                         ↓
               comment on PR ("Plan: 3 to add")
                         ↓
          human approves (apply) or auto-apply
                         ↓
                      apply runs → state updated → confirmed</code></pre>
                    <p>Every <strong>run</strong> has phases: <em>queued → planning → plan review → apply</em>. Policies and permissions gate each transition.</p>

                    <h3>Remote backend</h3>
                    <p>Point your configuration at Terraform Cloud's backend to store state there and run operations remotely:</p>
<pre><code>terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "networking-prod"
    }
  }
}</code></pre>
                    <p>Note: the <code>cloud</code> block replaces <code>backend</code> and requires a token / <code>TF_CLOUD_ORGANIZATION</code>.</p>

                    <div class="callout">
                        <div class="callout-title">Why it matters</div>
                        <p>Team-scale Terraform fails without shared state, approvals, and policy. Terraform Cloud turns Terraform from a solo tool into an org-wide platform with a paper trail.</p>
                    </div>
                `,
                takeaways: [
                    'Terraform Cloud = managed state + remote runs + VCS-driven workflow',
                    'Runs flow: queued → plan → review → apply → confirm',
                    'Policies (Sentinel/OPA) and team permissions gate changes',
                    'The cloud block replaces the backend block for remote operations',
                ],
                revision: [
                    { label: 'Terraform Cloud docs', url: 'https://developer.hashicorp.com/terraform/cloud-docs', tag: 'Docs' },
                    { label: 'Run lifecycle', url: 'https://developer.hashicorp.com/terraform/cloud-docs/run/states', tag: 'Docs' },
                    { label: 'GitHub Actions skill / CI-CD reference', url: '/pages/academy/academy.html', tag: 'Related' },
                ],
                defaultCode: `terraform {
  cloud {
    organization = "acme-infra"
    workspaces {
      name = "networking-prod"
    }
  }
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name    = "main-vpc"
    Managed = "terraform-cloud"
  }
}`,
            },
            {
                id: 'tf-cloud-cicd-2',
                title: 'CI/CD with Terraform (GitHub Actions)',
                objectives: [
                    'Build a GitHub Actions workflow for terraform plan/apply',
                    'Store and reuse backend credentials as secrets',
                    'Automate PR plans and require approval for prod applies',
                    'Compare TFC runs with self-hosted CI pipelines',
                ],
                content: `
                    <h2>Pipeline-Driven Terraform</h2>
                    <p>Whether you use Terraform Cloud's VCS workflow or a self-hosted CI/CD pipeline, the goal is the same: <strong>infrastructure changes go through review and automation, never straight from a laptop</strong>. GitHub Actions is the most common self-hosted option.</p>

                    <h3>A minimal plan workflow</h3>
<pre><code>name: terraform-plan
on:
  pull_request:

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9.0"

      - name: terraform fmt
        run: terraform fmt -check -recursive

      - name: terraform init
        run: terraform init
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: terraform plan
        id: plan
        run: terraform plan -out=tfplan

      - name: publish plan comment
        uses: actions/github-script@v7
        with:
          script: |
            const out = process.env.PLAN_OUT
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '#### \\\`terraform plan\\\` ✅\\n\\n\\\`\\\`\\\`\\n' + out + '\\n\\\`\\\`\\\`',
            })
        env:
          PLAN_OUT: \${{ steps.plan.outputs.stdout }}
</code></pre>
                    <p>Run <code>terraform plan</code> on every pull request; apply (with <code>-auto-approve</code> or the saved plan) only on merge to <code>main</code>, ideally gated by an environment with required reviewers.</p>

                    <h3>Apply gated by environment protection</h3>
<pre><code>name: terraform-apply
on:
  push:
    branches: [ main ]

jobs:
  apply:
    runs-on: ubuntu-latest
    environment: production   # requires review + secrets
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init && terraform apply -auto-approve
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          TF_VAR_environment: prod
</code></pre>

                    <h3>Best practices</h3>
                    <ul>
                        <li>Pin <code>setup-terraform</code> and the Terraform version; upgrade deliberately.</li>
                        <li>Always pass credentials as <strong>GitHub secrets</strong> — never inline them.</li>
                        <li>Use the <code>environment</code> feature for prod-apply approval gates.</li>
                        <li>Persist the plan artifact and apply exactly that plan (<code>terraform apply tfplan</code>).</li>
                        <li>Add <code>terraform validate</code> and <code>fmt -check</code> to fail fast.</li>
                    </ul>

                    <div class="callout">
                        <div class="callout-title">TFC vs self-hosted</div>
                        <p>Terraform Cloud gives you plans on every PR with zero pipeline code and managed state. Self-hosted Actions gives you full control and reuses your existing CI. Many orgs start with Actions, then move to TFC as the estate grows.</p>
                    </div>
                `,
                takeaways: [
                    'Plan on every PR; apply only on merge, gated by protected environments',
                    'Credentials come from GitHub secrets; never hard-code them',
                    'Use hashicorp/setup-terraform with a pinned version',
                    'Apply the exact saved plan artifact for deterministic deploys',
                ],
                revision: [
                    { label: 'Setup-Terraform GitHub Action', url: 'https://github.com/hashicorp/setup-terraform', tag: 'Docs' },
                    { label: 'GitHub Actions workflows', url: 'https://docs.github.com/actions', tag: 'Docs' },
                    { label: 'Git & GitHub Academy (branching & Actions)', url: '/pages/git-academy/git-academy.html', tag: 'Related' },
                ],
                defaultCode: `# Backend: state lives on Terraform Cloud
terraform {
  cloud {
    organization = "acme-infra"
    workspaces {
      project = "platform"
      name    = "app-prod"
    }
  }
}

resource "aws_ecs_cluster" "app" {
  name = "app-cluster"
}

resource "aws_instance" "bastion" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  tags = {
    Name = "bastion"
  }
}`,
            },
        ],
        quiz: [
            {
                id: 'q-cicd-1',
                question: 'In a VCS-driven Terraform Cloud workflow, when is a plan triggered?',
                options: [
                    'Only when you run it manually',
                    'On every push or pull request to a connected repo',
                    'Once a day at midnight',
                    'Only after a successful apply',
                ],
                correct: 1,
            },
            {
                id: 'q-cicd-2',
                question: 'Where should cloud credentials live in a GitHub Actions workflow?',
                options: [
                    'Hard-coded in the YAML',
                    'As GitHub Actions secrets referenced via ${{ secrets.* }}',
                    'In a committed .env file',
                    'In the state file',
                ],
                correct: 1,
            },
            {
                id: 'q-cicd-3',
                question: 'What does the cloud block in terraform { } replace?',
                options: ['The provider block', 'The backend block', 'The module block', 'The output block'],
                correct: 1,
            },
            {
                id: 'q-cicd-4',
                question: 'Why apply the exact saved plan file (terraform apply tfplan)?',
                options: [
                    'It is faster than a new plan',
                    'It guarantees the apply matches the reviewed plan',
                    'It avoids needing credentials',
                    'It skips the provider install',
                ],
                correct: 1,
            },
        ],
    },
];

/* ═══════════════════════════════════════════
   HCL PLAN SIMULATOR -- parser + plan renderer
   ═══════════════════════════════════════════ */

const DEFAULT_HCL = `# main.tf
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = {
    Name = "web-server"
  }
}`;

function findMatchingBrace(code, openIdx) {
    let depth = 0;
    let inString = false;
    let esc = false;
    for (let i = openIdx; i < code.length; i++) {
        const c = code[i];
        if (inString) {
            if (esc) esc = false;
            else if (c === '\\') esc = true;
            else if (c === '"') inString = false;
            continue;
        }
        if (c === '"') inString = true;
        else if (c === '{' || c === '[') depth++;
        else if (c === '}' || c === ']') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return code.length - 1;
}

function readValue(code, start) {
    let i = start;
    while (i < code.length && /\s/.test(code[i])) i++;
    const c = code[i];
    if (c === '{' || c === '[') {
        const end = findMatchingBrace(code, i);
        return { value: code.slice(i, end + 1).replace(/\s+/g, ' ').trim(), end: end + 1 };
    }
    let j = i;
    let inString = false;
    let esc = false;
    while (j < code.length) {
        const ch = code[j];
        if (inString) {
            if (esc) esc = false;
            else if (ch === '\\') esc = true;
            else if (ch === '"') inString = false;
        } else {
            if (ch === '"') inString = true;
            else if (ch === '\n' || ch === ',') break;
            else if (ch === '#') break;
            else if (ch === '/' && code[j + 1] === '/') break;
        }
        j++;
    }
    return { value: code.slice(i, j).trim(), end: j };
}

function stripCommentsLine(code) {
    return code.replace(/#[^\n]*/g, '').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractAttrs(body) {
    const attrs = [];
    const code = stripCommentsLine(body);
    let i = 0;
    const n = code.length;
    while (i < n) {
        while (i < n && /\s/.test(code[i])) i++;
        if (i >= n) break;
        const keyMatch = /^[a-zA-Z_][a-zA-Z0-9_-]*/.exec(code.slice(i));
        if (!keyMatch) break;
        const key = keyMatch[0];
        i += key.length;
        while (i < n && code[i] !== '=') i++;
        if (code[i] !== '=') break;
        i++;
        const val = readValue(code, i);
        attrs.push({ key, value: val.value });
        i = val.end;
    }
    return attrs;
}

function parseHCL(code) {
    const resources = [];
    const dataBlocks = [];
    const modules = [];
    const blockRe = /^(resource|data|module|output|variable|locals)\s*("[^"]*")?(\s*"[^"]*")?\s*\{/gm;
    let m;
    while ((m = blockRe.exec(code)) !== null) {
        const kw = m[1];
        const labels = [m[2], m[3]]
            .filter(Boolean)
            .map((s) => s.replace(/"/g, '').trim())
            .filter(Boolean);
        const openIdx = code.indexOf('{', m.index);
        const closeIdx = findMatchingBrace(code, openIdx);
        const body = code.slice(openIdx + 1, closeIdx);
        if (kw === 'resource') resources.push({ type: labels[0], name: labels[1], body });
        else if (kw === 'data') dataBlocks.push({ type: labels[0], name: labels[1], body });
        else if (kw === 'module') modules.push({ name: labels[0], body });
    }
    return { resources, dataBlocks, modules };
}

function isExpression(val) {
    return (
        val.indexOf('${') !== -1 ||
        /^[a-z_][a-z0-9_]*\(/.test(val) ||                                  /* function call */
        /^[a-z_][a-z0-9_]*\.[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*/.test(val)    /* resource/var/local reference */
    );
}

function renderAttrValue(val, showExpressions) {
    if (isExpression(val)) {
        return showExpressions ? val : '(known after apply)';
    }
    if (/^["]/.test(val)) return val;
    if (/^(true|false|null|-?\d+(\.\d+)?)$/.test(val)) return val;
    return val;
}

function planBlocks(code, showExpressions) {
    const { resources, dataBlocks, modules } = parseHCL(code);
    const lines = [];
    const summary = { add: 0, change: 0, destroy: 0, read: 0 };

    resources.forEach((r) => {
        const attrs = extractAttrs(r.body);
        summary.add++;
        lines.push({ cls: 'term-muted', text: '  # ' + r.type + '.' + r.name + ' will be created' });
        lines.push({ cls: 'term-plan-add', text: '  + resource "' + r.type + '" "' + r.name + '" {' });
        const rendered = attrs.map((a) => ({
            key: a.key,
            value: renderAttrValue(a.value, showExpressions),
        }));
        const pad = rendered.reduce((max, a) => Math.max(max, a.key.length), 0);
        rendered.forEach((a) => {
            const dots = ' '.repeat(Math.max(1, pad - a.key.length + 1));
            lines.push({ cls: 'term-plan-add', text: '      + ' + a.key + dots + '= ' + a.value });
        });
        lines.push({ cls: 'term-plan-add', text: '    }' });
        lines.push({ cls: 'term-muted', text: '' });
    });

    dataBlocks.forEach((d) => {
        summary.read++;
        const attrs = extractAttrs(d.body);
        lines.push({ cls: 'term-info', text: '  <= data "' + d.type + '" "' + d.name + '" (read after apply)' });
        const rendered = attrs.map((a) => ({
            key: a.key,
            value: renderAttrValue(a.value, showExpressions),
        }));
        const pad = rendered.reduce((max, a) => Math.max(max, a.key.length), 0);
        rendered.forEach((a) => {
            const dots = ' '.repeat(Math.max(1, pad - a.key.length + 1));
            lines.push({ cls: 'term-plan-add', text: '      + ' + a.key + dots + '= ' + a.value });
        });
        lines.push({ cls: 'term-muted', text: '' });
    });

    modules.forEach((mod) => {
        summary.add++;
        lines.push({ cls: 'term-muted', text: '  # module.' + mod.name + ' will be created' });
        lines.push({ cls: 'term-plan-add', text: '  + module "' + mod.name + '" {' });
        const attrs = extractAttrs(mod.body);
        const rendered = attrs.map((a) => ({
            key: a.key,
            value: renderAttrValue(a.value, showExpressions),
        }));
        const pad = rendered.reduce((max, a) => Math.max(max, a.key.length), 0);
        rendered.forEach((a) => {
            const dots = ' '.repeat(Math.max(1, pad - a.key.length + 1));
            lines.push({ cls: 'term-plan-add', text: '      + ' + a.key + dots + '= ' + a.value });
        });
        lines.push({ cls: 'term-plan-add', text: '    }' });
        lines.push({ cls: 'term-muted', text: '' });
    });

    return { lines, summary };
}

/* ═══════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════ */

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

    // Simulator elements
    DOM.hclEditor = document.getElementById('hcl-editor');
    DOM.planBtn = document.getElementById('plan-btn');
    DOM.clearPgBtn = document.getElementById('clear-pg-btn');
    DOM.terminalWindow = document.getElementById('plan-terminal');
    DOM.bootStatus = document.getElementById('boot-status');
    DOM.showExpressions = document.getElementById('show-expressions');
    DOM.planSummary = document.getElementById('plan-summary');
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

    const eli5 = window.eli5Toggle;
    const simpleContent =
        window.eli5TerraformData && lesson.id ? window.eli5TerraformData[lesson.id] || '' : '';
    DOM.lessonContent.innerHTML = eli5
        ? eli5.wrapContent(lesson.content, simpleContent)
        : lesson.content;

    if (eli5) {
        const oldToggle = DOM.lessonContent.querySelector('.eli5-toggle');
        if (oldToggle) oldToggle.remove();
        eli5.initToggle('terraform', DOM.lessonContent);
    }

    if (window.copyCode) {
        window.copyCode.init(DOM.lessonContent);
    }

    DOM.lessonContent.insertAdjacentHTML('beforeend', objectivesHtml + takeawaysHtml + revisionHtml);

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
   HCL PLAN SIMULATOR
   ═══════════════════════════════════════════ */

function formatTimestamp() {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function printLine(cls, text) {
    const p = document.createElement('p');
    p.className = 'term-line ' + cls;
    p.innerHTML = `<span class="term-time">[${formatTimestamp()}]</span> ${text}`;
    DOM.terminalWindow.appendChild(p);
    DOM.terminalWindow.scrollTop = DOM.terminalWindow.scrollHeight;
}

function resetTerminal() {
    DOM.terminalWindow.innerHTML = '';
}

function setBootStatus(text, ok, cls) {
    DOM.bootStatus.textContent = text;
    DOM.bootStatus.classList.remove('boot-status--ok', 'boot-status--warn');
    if (ok) DOM.bootStatus.classList.add('boot-status--ok');
    else if (cls === 'warn') DOM.bootStatus.classList.add('boot-status--warn');
}

function renderPlanSummary(summary, isEmpty) {
    if (isEmpty) {
        DOM.planSummary.innerHTML = '<div class="plan-summary-empty">No plan run yet.</div>';
        return;
    }
    DOM.planSummary.innerHTML = `
        <div class="plan-stat-grid">
            <div class="plan-stat">
                <span class="plan-stat-label">to add</span>
                <span class="plan-stat-value plan-stat-value--add">${summary.add}</span>
            </div>
            <div class="plan-stat">
                <span class="plan-stat-label">to change</span>
                <span class="plan-stat-value plan-stat-value--change">${summary.change}</span>
            </div>
            <div class="plan-stat">
                <span class="plan-stat-label">to destroy</span>
                <span class="plan-stat-value plan-stat-value--destroy">${summary.destroy}</span>
            </div>
        </div>
        <ul class="plan-resource-list"></ul>
    `;
    const list = DOM.planSummary.querySelector('.plan-resource-list');
    const { resources, dataBlocks, modules } = parseHCL(DOM.hclEditor.value);
    resources.forEach((r) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="plan-op plan-op--add">+</span><span class="plan-addr">${escHtml(r.type)}.${escHtml(r.name)}</span>`;
        list.appendChild(li);
    });
    modules.forEach((mod) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="plan-op plan-op--add">+</span><span class="plan-addr">module.${escHtml(mod.name)}</span>`;
        list.appendChild(li);
    });
    dataBlocks.forEach((d) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="plan-op plan-op--read">&lt;=</span><span class="plan-addr">data.${escHtml(d.type)}.${escHtml(d.name)}</span>`;
        list.appendChild(li);
    });
}

function runPlan() {
    resetTerminal();
    const code = DOM.hclEditor.value;
    const showExpressions = DOM.showExpressions.checked;

    if (!code.trim()) {
        printLine('term-error', 'Error: No configuration files found.');
        printLine('term-error', 'Write HCL blocks in the editor, then run plan again.');
        setBootStatus('Error', false);
        renderPlanSummary(null, true);
        return;
    }

    const { resources, dataBlocks, modules } = parseHCL(code);
    const total = resources.length + dataBlocks.length + modules.length;

    setBootStatus('Planning', true);

    printLine('term-info', 'terraform init -no-color');
    printLine('term-muted', '');
    printLine('term-info', 'Initializing the backend...');
    printLine('term-info', 'Initializing provider plugins...');
    printLine('term-log', '- Installing hashicorp/aws v5.31.0...');
    printLine('term-log', '- Installed hashicorp/aws v5.31.0 (signed by HashiCorp)');
    printLine('term-success', '');
    printLine('term-success', 'Terraform has been successfully initialized!');
    printLine('term-muted', '');
    printLine('term-warn', 'You may now begin working with Terraform. Try running "terraform plan" to see');
    printLine('term-warn', 'any changes that are required for your infrastructure.');
    printLine('term-muted', '');

    setTimeout(() => {
        printLine('term-info', 'Running "terraform plan"');
        printLine('term-muted', '');
        printLine('term-log', 'Refreshing state...');
        printLine('term-log', 'Refreshing the state in-memory prior to plan execution...');
        printLine('term-muted', '');

        if (total === 0) {
            printLine('term-warn', 'No resource blocks were found in the configuration.');
            printLine('term-warn', 'Tip: add blocks like resource "aws_instance" "web" { ... } and try again.');
            printLine('term-muted', '');
            printLine('term-info', 'No changes. Your infrastructure matches the configuration.');
            setBootStatus('No changes', false, 'warn');
            renderPlanSummary({ add: 0, change: 0, destroy: 0, read: 0 }, false);
            return;
        }

        printLine('term-info', 'Terraform used the selected providers to generate the following execution plan.');
        printLine('term-info', 'Resource actions are indicated with the following symbols:');
        printLine('term-plan-add', '  + create');
        printLine('term-info', '  <= read (data sources)');
        printLine('term-muted', '');
        printLine('term-success', 'Terraform will perform the following actions:');
        printLine('term-muted', '');

        const { lines, summary } = planBlocks(code, showExpressions);
        lines.forEach((l) => printLine(l.cls, l.text));

        printLine('term-info', `Plan: ${summary.add} to add, ${summary.change} to change, ${summary.destroy} to destroy.`);
        printLine('term-muted', '');
        printLine('term-muted', '─────────────────────────────────────────────────────────────────────────────');
        printLine('term-muted', '');
        printLine('term-log', 'Note: You did not use the -out option to save this plan, so Terraform cannot');
        printLine('term-log', 'guarantee to take exactly these actions if you run "terraform apply" now.');
        setBootStatus('Complete', true);
        renderPlanSummary(summary, false);
    }, 450);
}

function resetPlaygroundState() {
    if (DOM.hclEditor) DOM.hclEditor.value = getActiveLesson().defaultCode || DEFAULT_HCL;
    if (DOM.terminalWindow) resetTerminal();
    if (DOM.bootStatus) setBootStatus('Ready', false);
    if (DOM.planSummary) renderPlanSummary(null, true);
}

function setupPlayground() {
    resetPlaygroundState();
    DOM.planBtn.addEventListener('click', runPlan);
    DOM.showExpressions.addEventListener('change', () => {
        if (DOM.terminalWindow.textContent.includes('Terraform will perform')) runPlan();
    });

    DOM.clearPgBtn.addEventListener('click', () => {
        resetPlaygroundState();
        printLine('term-muted', '// Sandbox reset. Press "terraform plan" to preview your infrastructure.');
    });

    DOM.hclEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = e.target.value.substring(0, start) + '  ' + e.target.value.substring(end);
            e.target.selectionStart = e.target.selectionEnd = start + 2;
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            runPlan();
        }
    });
}

function renderPlayground() {
    if (!DOM.hclEditor.value.trim()) {
        DOM.hclEditor.value = getActiveLesson().defaultCode || DEFAULT_HCL;
    }
    DOM.activeModuleTitle.textContent = getActiveModule().title + ' — HCL Plan Simulator';
}

/* ─── Quiz ─── */
function renderQuiz() {
    const mod = getActiveModule();
    const quizId = mod.id + '-quiz';
    const isCompleted = isItemComplete(quizId);

    if (!mod.quiz || mod.quiz.length === 0) {
        DOM.quizContainer.innerHTML = `
            <div class="quiz-container" style="text-align:center; padding:3rem;">
                <i class="fa-solid fa-clipboard-check" style="font-size:3rem; color:#7b42bc; opacity:0.5; margin-bottom:1rem;"></i>
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
