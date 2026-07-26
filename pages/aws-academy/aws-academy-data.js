window.awsCurriculum = [
  {
    id: 'mod-1',
    title: 'IAM & Security Basics',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Identity and Access Management',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Differentiate between IAM Users, Groups, Roles, and Policies</li>
<li>Apply the principle of least privilege when assigning permissions</li>
<li>Evaluate when to use IAM Roles vs IAM Users for different workloads</li>
</ul>
</div>
<h2>AWS Identity and Access Management (IAM)</h2>
<p>AWS IAM enables you to manage access to AWS services and resources securely. It is the foundation of security in AWS — every API call is authenticated and authorized through IAM.</p>
<h3>Core Concepts</h3>
<ul>
<li><strong>Users:</strong> End users (people or apps) with long-term credentials.</li>
<li><strong>Groups:</strong> A collection of users. Permissions assigned to a group apply to all members.</li>
<li><strong>Roles:</strong> Temporary identities assumed by trusted entities. Roles have no permanent credentials.</li>
<li><strong>Policies:</strong> JSON documents that define permissions (Allow or Deny). Attached to Users, Groups, or Roles.</li>
</ul>
<p>Security in AWS follows the <strong>Shared Responsibility Model</strong>. AWS manages security <em>of</em> the cloud, while you manage security <em>in</em> the cloud.</p>
<div class="architecture-diagram">
<h3>IAM Architecture</h3>
<pre>User -> Group -> Policy (Allow: s3:GetObject)
  |
  +-> Role (assumed by EC2) -> Policy (Allow: dynamodb:PutItem)</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Your application runs on EC2 instances and needs to write logs to S3 and read from DynamoDB.</p>
<ul>
<li><strong>Question:</strong> Should you create IAM Users with access keys and store them on the EC2 instance?</li>
<li><strong>Best Practice:</strong> No. Create an IAM Role with the necessary permissions and attach it to the EC2 instance profile. The SDK will automatically retrieve temporary credentials.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create an IAM user with programmatic access and attach a managed policy</li>
<li>Create an IAM role for EC2 with an S3 read-only policy and launch an instance using that role</li>
<li>Verify that the EC2 instance can list S3 buckets without any hardcoded credentials</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Are IAM Roles preferred over long-term access keys for EC2 and Lambda workloads?</li>
<li>Is the principle of least privilege applied to all policies?</li>
<li>Are IAM groups used to manage permissions for users instead of individual user policies?</li>
<li>Is MFA enabled for all users with console access?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm1-l2',
        title: 'AWS Organizations & Service Control Policies',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Explain how AWS Organizations enables multi-account management</li>
<li>Describe how Service Control Policies (SCPs) act as guardrails for account permissions</li>
<li>Design an OU structure based on common isolation and compliance requirements</li>
</ul>
</div>
<h2>AWS Organizations & SCPs</h2>
<p>AWS Organizations helps you centrally govern multiple AWS accounts. You can create accounts, group them into Organizational Units (OUs), and apply policies across the organization.</p>
<h3>Key Concepts</h3>
<ul>
<li><strong>Management Account:</strong> The master account that manages the organization.</li>
<li><strong>Member Accounts:</strong> Individual AWS accounts under the organization.</li>
<li><strong>Organizational Units (OUs):</strong> Logical groupings of accounts (e.g., Production, Development).</li>
<li><strong>Service Control Policies (SCPs):</strong> JSON policies that define the maximum permissions for accounts in an OU. SCPs set boundaries — they do not grant permissions.</li>
</ul>
<p>SCPs are particularly powerful for compliance: even a full admin in a member account cannot perform actions blocked by an SCP.</p>
<div class="architecture-diagram">
<h3>Multi-Account Structure</h3>
<pre>Management Account
 +-- OU: Security (AWS Config, GuardDuty)
 +-- OU: Infrastructure
 |   +-- Account: Production
 |   +-- Account: Staging
 +-- OU: Development
     +-- Account: Dev-1
     +-- Account: Dev-2</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Your company wants to ensure that developers cannot create resources without encryption.</p>
<ul>
<li>Apply an SCP at the Development OU that denies ec2:RunInstances unless the request includes an encrypted EBS volume.</li>
<li>This SCP cannot be overridden by any admin within the member account.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create an AWS Organization with a management account and two member accounts in different OUs</li>
<li>Apply an SCP that denies access to specific services (e.g., deny DynamoDB in the Development OU)</li>
<li>Verify that the SCP effectively blocks the action in the member account even as the root user</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the account structure aligned with business functions (production, development, security)?</li>
<li>Are SCPs used to enforce compliance guardrails rather than fine-grained permissions?</li>
<li>Is consolidated billing enabled to take advantage of volume discounts?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm1-l3',
        title: 'AWS WAF, Shield & Security Best Practices',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Differentiate between AWS WAF, Shield Standard, and Shield Advanced</li>
<li>Create WAF rules to block common attack patterns (SQL injection, XSS)</li>
<li>Apply the Shared Responsibility Model to real-world security decisions</li>
</ul>
</div>
<h2>AWS WAF, Shield & Security Best Practices</h2>
<p>AWS WAF is a web application firewall that protects your web applications from common web exploits. AWS Shield provides DDoS protection.</p>
<h3>Key Services</h3>
<ul>
<li><strong>AWS WAF:</strong> Deploy at CloudFront, ALB, or API Gateway. Create rules to allow, block, or count requests based on conditions like IP addresses, HTTP headers, URI strings, or SQL injection patterns.</li>
<li><strong>AWS Shield Standard:</strong> Always-on DDoS protection for all AWS customers at no cost.</li>
<li><strong>AWS Shield Advanced:</strong> Enhanced DDoS protection with cost protection, 24/7 DDoS Response Team access, and detailed attack diagnostics.</li>
</ul>
<div class="architecture-diagram">
<h3>WAF Deployment</h3>
<pre>CloudFront / ALB / API Gateway
       |
  [WAF Web ACL]
       |
  Allow / Block / Count</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Your e-commerce site is experiencing a SQL injection attack on the product search endpoint.</p>
<ul>
<li>Create a WAF rule that inspects the query string for SQL patterns (SELECT, UNION, DROP).</li>
<li>Test the rule in COUNT mode first to validate it does not block legitimate traffic.</li>
<li>Switch to BLOCK mode after verification.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Deploy a WAF web ACL associated with an Application Load Balancer</li>
<li>Create a rate-limiting rule that blocks IPs sending more than 100 requests in 5 minutes</li>
<li>Enable AWS Shield Advanced and review the DDoS attack dashboard</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Are all public-facing web endpoints protected by WAF?</li>
<li>Are WAF rules tested in COUNT mode before switching to BLOCK?</li>
<li>Is AWS Shield Standard sufficient, or does the workload require Shield Advanced?</li>
<li>Are rate-limiting rules configured to protect against abusive traffic?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm1-l4',
        title: 'AWS KMS & Secrets Manager',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Differentiate between AWS KMS and Secrets Manager and when to use each</li>
<li>Create and rotate KMS keys automatically</li>
<li>Store and retrieve secrets securely using Secrets Manager</li>
</ul>
</div>
<h2>AWS KMS & Secrets Manager</h2>
<p>AWS KMS lets you create and manage encryption keys. AWS Secrets Manager helps you securely store and rotate secrets like database credentials and API keys.</p>
<h3>AWS KMS</h3>
<ul>
<li><strong>Customer Managed Keys (CMKs):</strong> Keys you create, manage, and control. You can enable/disable, rotate, and define key policies.</li>
<li><strong>Automatic Rotation:</strong> KMS can automatically rotate CMKs every year.</li>
<li><strong>Envelope Encryption:</strong> KMS encrypts a data key, and the data key encrypts your data. This is more efficient than encrypting large data directly with KMS.</li>
</ul>
<h3>AWS Secrets Manager</h3>
<ul>
<li><strong>Secure Storage:</strong> Store database credentials, API keys, and other secrets encrypted with KMS.</li>
<li><strong>Automatic Rotation:</strong> Rotate secrets on a schedule without application downtime.</li>
<li><strong>Cross-Account Access:</strong> Share secrets across accounts using resource-based policies.</li>
</ul>
<div class="architecture-diagram">
<h3>Secrets Manager Flow</h3>
<pre>App -> Secrets Manager -> KMS (decrypt)
                         |
                  [Return secret]</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Your application stores RDS database credentials in a configuration file on EC2.</p>
<ul>
<li>Create a secret in Secrets Manager with the database credentials.</li>
<li>Modify the application to retrieve credentials from Secrets Manager at startup.</li>
<li>Enable automatic 30-day rotation so the database password changes monthly.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a symmetric KMS key and encrypt/decrypt a file using the AWS CLI</li>
<li>Store a database connection string in Secrets Manager and retrieve it using the AWS SDK</li>
<li>Configure automatic rotation of a secret using a Lambda rotation function</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Are all secrets stored in Secrets Manager instead of configuration files or environment variables?</li>
<li>Are KMS key policies restricted to the minimum necessary principals?</li>
<li>Is automatic key rotation enabled for production keys?</li>
<li>Is envelope encryption used for large objects instead of direct KMS encrypt?</li>
</ul>
</div>
</div>`,
      },
    ],
    quiz: [
      { id: 'm1-q1', question: 'Which IAM entity do you attach to an EC2 instance so it can securely access an S3 bucket?', options: ['IAM User', 'IAM Group', 'IAM Role', 'IAM Policy directly to the instance'], correct: 2 },
      { id: 'm1-q2', question: 'What is the primary purpose of Service Control Policies (SCPs) in AWS Organizations?', options: ['Grant permissions to users', 'Set permission boundaries for accounts in an OU', 'Create new AWS accounts', 'Enable consolidated billing'], correct: 1 },
      { id: 'm1-q3', question: 'Which AWS service can automatically rotate database credentials without application changes?', options: ['AWS KMS', 'AWS Secrets Manager', 'IAM Access Analyzer', 'AWS Config'], correct: 1 },
      { id: 'm1-q4', question: 'What type of AWS WAF rule would you use to protect against a SQL injection attack?', options: ['IP rate-limiting rule', 'Geographic match rule', 'SQL injection match condition', 'Size constraint rule'], correct: 2 },
      { id: 'm1-q5', question: 'What is the primary difference between AWS Shield Standard and Shield Advanced?', options: ['Standard is paid, Advanced is free', 'Advanced includes 24/7 DDoS response team and cost protection', 'Advanced only protects S3', 'Standard blocks all DDoS attacks automatically'], correct: 1 },
      { id: 'm1-q6', question: 'In the Shared Responsibility Model, which of the following is the customer responsible for?', options: ['Physical security of data centers', 'Managing the hypervisor layer', 'Encryption of customer data in transit and at rest', 'Replacing failed hardware in Availability Zones'], correct: 2 },
      { id: 'm1-q7', question: 'What encryption technique is recommended when encrypting large objects (over 4KB) with KMS?', options: ['Direct KMS Encrypt', 'Envelope encryption with a data key', 'Client-side encryption only', 'S3 SSE-C only'], correct: 1 },
    ],
  },
  {
    id: 'mod-2',
    title: 'Compute & Networking (EC2 + VPC)',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Virtual Private Cloud (VPC)',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Design a VPC with public and private subnets across multiple Availability Zones</li>
<li>Configure route tables, Internet Gateway, and NAT Gateway</li>
<li>Troubleshoot common VPC connectivity issues using flow logs</li>
</ul>
</div>
<h2>Amazon Virtual Private Cloud (VPC)</h2>
<p>Amazon VPC lets you provision a logically isolated section of the AWS Cloud. You define your own IP address range, create subnets, configure route tables, and attach gateways.</p>
<h3>Core Components</h3>
<ul>
<li><strong>CIDR Blocks:</strong> IP address range for the VPC (e.g., 10.0.0.0/16).</li>
<li><strong>Subnets:</strong> Segments of the VPC CIDR, each in a single AZ. Public subnets route to an Internet Gateway.</li>
<li><strong>Internet Gateway (IGW):</strong> Horizontally scaled gateway allowing VPC-internet communication.</li>
<li><strong>NAT Gateway:</strong> Allows private subnet instances to initiate outbound traffic while blocking inbound traffic.</li>
<li><strong>Security Groups:</strong> Stateful firewalls at the instance level.</li>
<li><strong>Network ACLs:</strong> Stateless firewalls at the subnet level.</li>
</ul>
<div class="architecture-diagram">
<h3>VPC Architecture</h3>
<pre>Internet Gateway
      |
 +--------+
 | Public | Subnet (AZ-a) -> EC2 (Web)
 +--------+
      |
 +--------+
 |Private | Subnet (AZ-b) -> RDS (DB)
 +--------+
      |
 NAT Gateway -> Internet (outbound only)</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Design a VPC for a web app with a public web tier and a private database tier.</p>
<ul>
<li>Create a VPC with CIDR 10.0.0.0/16.</li>
<li>Create public subnets (10.0.1.0/24, 10.0.2.0/24) and private subnets (10.0.3.0/24, 10.0.4.0/24) across 2 AZs.</li>
<li>Attach an Internet Gateway and add a route to it from public subnets.</li>
<li>Add a NAT Gateway in a public subnet and route private subnet traffic through it.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a VPC using the VPC wizard with public and private subnets</li>
<li>Launch EC2 instances in both subnets and test connectivity</li>
<li>Enable VPC Flow Logs to capture IP traffic metadata</li>
<li>Use Reachability Analyzer to debug connectivity between instances</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Are subnets provisioned across at least 2 AZs for high availability?</li>
<li>Is there a NAT Gateway for private subnet outbound access?</li>
<li>Are Security Groups scoped to the minimum required ports and sources?</li>
<li>Are VPC Flow Logs enabled for all VPCs in production?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm2-l2',
        title: 'Elastic Compute Cloud (EC2)',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Choose the right EC2 instance type based on workload requirements</li>
<li>Configure user data scripts for automated instance bootstrapping</li>
<li>Differentiate between On-Demand, Reserved, Spot, and Savings Plans pricing</li>
</ul>
</div>
<h2>Amazon EC2</h2>
<p>Amazon EC2 provides scalable computing capacity in the AWS cloud. You can launch virtual servers, configure security and networking, and manage storage.</p>
<h3>Instance Types</h3>
<ul>
<li><strong>General Purpose (A/M/T):</strong> Balanced compute, memory, networking (web servers).</li>
<li><strong>Compute Optimized (C):</strong> High-performance processors (batch processing, gaming).</li>
<li><strong>Memory Optimized (R/X):</strong> Large in-memory datasets (caches, analytics).</li>
<li><strong>Storage Optimized (I/D):</strong> High sequential read/write (data warehousing).</li>
<li><strong>GPU (P/G):</strong> Graphics-intensive workloads (ML training, rendering).</li>
</ul>
<div class="architecture-diagram">
<h3>EC2 Boot Flow</h3>
<pre>Launch Instance -> AMI + Instance Type
      |
  [User Data Script]
      |
  Install packages + Configure app
      |
  Instance Ready</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A web application needs to handle variable traffic.</p>
<ul>
<li>Use t3.medium instances (burstable, general purpose).</li>
<li>Configure user data to install Apache and start the service.</li>
<li>Use an Auto Scaling group with min=2, max=10 behind an ALB.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Launch an EC2 instance with user data that installs a web server</li>
<li>Attach an IAM role to the instance and verify S3 access</li>
<li>Modify the security group and verify the web server responds</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the instance family appropriate for the workload?</li>
<li>Is user data used for bootstrapping to ensure immutability?</li>
<li>Are instances launched across multiple AZs for high availability?</li>
<li>Is the correct pricing model used (Spot for fault-tolerant, Reserved for steady-state)?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm2-l3',
        title: 'Elastic Load Balancing & Auto Scaling',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Choose the appropriate load balancer type (ALB, NLB, GWLB)</li>
<li>Configure Auto Scaling groups with dynamic scaling policies</li>
<li>Design resilient architectures that self-heal using health checks</li>
</ul>
</div>
<h2>ELB & Auto Scaling</h2>
<p>Elastic Load Balancing distributes incoming traffic across multiple targets. Auto Scaling automatically adjusts capacity to maintain performance at the lowest cost.</p>
<h3>Load Balancer Types</h3>
<ul>
<li><strong>ALB (Layer 7):</strong> Routes based on HTTP/HTTPS headers. Ideal for microservices.</li>
<li><strong>NLB (Layer 4):</strong> Ultra-low latency TCP/UDP routing. Handles millions of requests/second.</li>
<li><strong>Gateway LB:</strong> Deploy and scale third-party virtual appliances (firewalls).</li>
</ul>
<h3>Auto Scaling Strategies</h3>
<ul>
<li><strong>Dynamic Scaling:</strong> Based on CloudWatch metrics (CPU utilization).</li>
<li><strong>Scheduled Scaling:</strong> Predictable traffic patterns (business hours).</li>
<li><strong>Predictive Scaling:</strong> ML-based forecasting of future traffic.</li>
</ul>
<div class="architecture-diagram">
<h3>Auto Scaling + ALB</h3>
<pre>Route 53 -> ALB -> Auto Scaling Group
                    |
              +-----+-----+
            EC2 (AZ-a)  EC2 (AZ-b)
                    |
             [Health Checks]</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> An e-commerce site expects 10x traffic during Black Friday.</p>
<ul>
<li>Configure an ASG with launch template referencing the latest AMI.</li>
<li>Set dynamic scaling policy based on average CPU > 60%.</li>
<li>Set scheduled scaling to pre-warm capacity before the event.</li>
<li>Use an ALB with sticky sessions for shopping cart persistence.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create an ALB with a target group and register EC2 instances</li>
<li>Configure an Auto Scaling group with CPU-based dynamic scaling</li>
<li>Test scale-out by generating load with a stress tool</li>
<li>Observe CloudWatch alarms triggering scaling events</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the correct load balancer type used (ALB for HTTP, NLB for TCP/UDP)?</li>
<li>Does the Auto Scaling group span at least 2 AZs?</li>
<li>Are health checks testing application endpoints, not just instance status?</li>
<li>Is a warm-up period configured for newly launched instances?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm2-l4',
        title: 'Amazon Route 53 & CloudFront',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Configure Route 53 routing policies (weighted, latency, geolocation, failover)</li>
<li>Set up CloudFront distributions with custom origins and cache behaviors</li>
<li>Design global architectures that route users to the nearest healthy endpoint</li>
</ul>
</div>
<h2>Amazon Route 53 & CloudFront</h2>
<p>Route 53 is a scalable DNS service. CloudFront is a global CDN that accelerates content delivery via edge locations.</p>
<h3>Route 53 Routing Policies</h3>
<ul>
<li><strong>Simple:</strong> Route to a single resource.</li>
<li><strong>Weighted:</strong> Distribute traffic based on weights (canary deployments).</li>
<li><strong>Latency-based:</strong> Route to the region with lowest latency for the user.</li>
<li><strong>Failover:</strong> Route to primary; on health check failure, route to secondary (DR).</li>
<li><strong>Geolocation:</strong> Route based on the geographic location of the user.</li>
</ul>
<div class="architecture-diagram">
<h3>Global Architecture</h3>
<pre>Route 53 (Latency-based)
      |
  CloudFront (Edge Caching)
      |
 +----+----+
ALB - EC2 (us-east-1)
ALB - EC2 (eu-west-1)</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A global SaaS platform needs fast content delivery and disaster recovery.</p>
<ul>
<li>Use CloudFront to cache static assets at 400+ edge locations.</li>
<li>Configure Route 53 failover: primary us-east-1, secondary eu-west-1.</li>
<li>Set health checks on the ALB endpoint to detect regional failures.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a Route 53 hosted zone and configure A records pointing to an ALB</li>
<li>Set up a CloudFront distribution with an S3 bucket origin</li>
<li>Configure cache behaviors for different file types</li>
<li>Test failover routing by disabling the primary health check</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is CloudFront used for all static content to reduce origin load?</li>
<li>Are health checks configured for all Route 53 records?</li>
<li>Is the routing policy aligned with availability requirements?</li>
<li>Are TTL values optimized for the expected DNS change frequency?</li>
</ul>
</div>
</div>`,
      },
    ],
    quiz: [
      { id: 'm2-q1', question: 'What is the primary function of a NAT Gateway in a VPC?', options: ['Allow inbound internet traffic to private subnets', 'Allow outbound internet traffic from private subnets', 'Provide DNS resolution for the VPC', 'Encrypt traffic between VPCs'], correct: 1 },
      { id: 'm2-q2', question: 'Which EC2 instance family is best suited for in-memory caching workloads?', options: ['C5 (Compute Optimized)', 'R5 (Memory Optimized)', 'I3 (Storage Optimized)', 'T3 (Burstable General Purpose)'], correct: 1 },
      { id: 'm2-q3', question: 'What is the key difference between a Security Group and a Network ACL?', options: ['Security Groups are stateless, NACLs are stateful', 'Security Groups are stateful, NACLs are stateless', 'Security Groups operate at subnet level', 'NACLs operate at instance level'], correct: 1 },
      { id: 'm2-q4', question: 'Which load balancer is best for routing traffic based on HTTP path patterns?', options: ['Network Load Balancer', 'Application Load Balancer', 'Gateway Load Balancer', 'Classic Load Balancer'], correct: 1 },
      { id: 'm2-q5', question: 'Which Route 53 routing policy is best for directing users to the closest healthy endpoint?', options: ['Simple', 'Weighted', 'Latency-based', 'Failover'], correct: 2 },
      { id: 'm2-q6', question: 'What does CloudFront use to cache content closer to users?', options: ['Availability Zones', 'Edge Locations', 'Direct Connect locations', 'VPC Endpoints'], correct: 1 },
      { id: 'm2-q7', question: 'An Auto Scaling group has min=2, max=10, desired=2. What happens when an instance fails a health check?', options: ['The group scales down to 1', 'A replacement instance is launched automatically', 'The ALB stops routing to it but it runs', 'The instance is terminated and group stays at 2'], correct: 1 },
    ],
  },
  {
    id: 'mod-3',
    title: 'Storage & Databases (S3 + RDS)',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Amazon S3',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Select the appropriate S3 storage class based on access patterns and cost</li>
<li>Configure S3 bucket policies and ACLs for secure access</li>
<li>Implement S3 lifecycle policies to automate data tiering and expiration</li>
</ul>
</div>
<h2>Amazon Simple Storage Service (S3)</h2>
<p>Amazon S3 is object storage with industry-leading scalability, data availability, security, and performance. Objects are stored in buckets and identified by unique keys.</p>
<h3>Storage Classes</h3>
<ul>
<li><strong>S3 Standard:</strong> Frequently accessed data with low latency.</li>
<li><strong>S3 Intelligent-Tiering:</strong> Auto-moves data between tiers based on access patterns.</li>
<li><strong>S3 Standard-IA:</strong> Long-lived, infrequently accessed but needs rapid access.</li>
<li><strong>S3 One Zone-IA:</strong> Replicated in a single AZ (lower cost).</li>
<li><strong>S3 Glacier:</strong> Archive with retrieval times from minutes to 12 hours.</li>
</ul>
<div class="architecture-diagram">
<h3>S3 Access Control Models</h3>
<pre>S3 Bucket
 +-- Bucket Policy (resource-based, cross-account)
 +-- IAM Policies (identity-based, within account)
 +-- ACLs (legacy, object-level)
 +-- Pre-signed URLs (time-limited, temporary)</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A video processing platform needs a cost-optimized storage strategy.</p>
<ul>
<li>Store recent uploads in S3 Standard (frequently accessed for processing).</li>
<li>Move processed videos to Standard-IA after 30 days.</li>
<li>Archive completed projects to Glacier Deep Archive after 1 year.</li>
<li>Automatically delete temporary files after 90 days.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create an S3 bucket with a bucket policy restricting access to a specific IAM role</li>
<li>Enable S3 versioning and explore object versions after overwrites</li>
<li>Create a lifecycle policy transitioning objects to Glacier after 90 days</li>
<li>Generate a pre-signed URL for temporary access to a private object</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is S3 Block Public Access enabled unless there is a specific business need?</li>
<li>Are lifecycle policies configured to transition data to cheaper tiers?</li>
<li>Is bucket versioning enabled to protect against accidental deletions?</li>
<li>Are encryption in transit (HTTPS) and at rest (SSE-S3/KMS) configured?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm3-l2',
        title: 'Amazon RDS',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Choose the right RDS database engine based on application requirements</li>
<li>Configure Multi-AZ deployments for high availability and read replicas</li>
<li>Implement automated backups and point-in-time recovery</li>
</ul>
</div>
<h2>Amazon Relational Database Service (RDS)</h2>
<p>Amazon RDS makes it easy to set up, operate, and scale a relational database. It automates backups, patching, and replication.</p>
<h3>Supported Engines</h3>
<ul>
<li><strong>Amazon Aurora:</strong> MySQL/PostgreSQL-compatible, 5x performance, 128TB auto-scaling.</li>
<li><strong>MySQL / MariaDB:</strong> Widely used open-source.</li>
<li><strong>PostgreSQL:</strong> Advanced open-source with strong compliance support.</li>
<li><strong>Oracle / SQL Server:</strong> Enterprise databases for migration scenarios.</li>
</ul>
<h3>High Availability Features</h3>
<ul>
<li><strong>Multi-AZ:</strong> Synchronous standby replica in another AZ. Automatic failover.</li>
<li><strong>Read Replicas:</strong> Asynchronous copies for read-heavy workloads. Cross-region supported.</li>
<li><strong>Automated Backups:</strong> Daily snapshots, 35-day retention, point-in-time recovery.</li>
</ul>
<div class="architecture-diagram">
<h3>Multi-AZ RDS</h3>
<pre>App Tier
  |
[Primary] (us-east-1a)
  | (sync replication)
[Standby] (us-east-1b)
  |
Auto-failover on AZ outage</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A financial application requires high availability and read scaling.</p>
<ul>
<li>Deploy a Multi-AZ Aurora cluster for automatic failover.</li>
<li>Add 2 read replicas for reporting queries.</li>
<li>Configure automated backups with 30-day retention.</li>
<li>Enable Performance Insights to monitor query performance.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Launch an RDS MySQL instance in a private subnet</li>
<li>Configure a security group allowing MySQL only from the app tier</li>
<li>Create a read replica and verify replication lag</li>
<li>Perform a point-in-time recovery</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is Multi-AZ enabled for production databases?</li>
<li>Are RDS instances placed in private subnets without public access?</li>
<li>Is storage auto-scaling enabled?</li>
<li>Are automated backups enabled with sufficient retention?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm3-l3',
        title: 'Amazon EBS & Instance Store',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Differentiate between EBS volume types (gp3, io2, st1, sc1)</li>
<li>Create EBS snapshots for backup and disaster recovery</li>
<li>Evaluate when to use Instance Store vs EBS</li>
</ul>
</div>
<h2>Amazon EBS & Instance Store</h2>
<p>Amazon EBS provides block-level storage volumes for EC2. Instance Store provides temporary, high-performance storage physically attached to the host.</p>
<h3>EBS Volume Types</h3>
<ul>
<li><strong>gp3 (SSD):</strong> Baseline 3000 IOPS, 125 MB/s. Cost-effective for most.</li>
<li><strong>io2 (Provisioned IOPS SSD):</strong> Up to 256K IOPS, 99.999% durability. For critical databases.</li>
<li><strong>st1 (Throughput HDD):</strong> Low-cost, high-throughput. Big data.</li>
<li><strong>sc1 (Cold HDD):</strong> Lowest cost. Infrequently accessed data.</li>
</ul>
<div class="architecture-diagram">
<h3>EBS Snapshot Flow</h3>
<pre>EC2 + EBS Volume
      |
  [Snapshot]
      |
 +----+----+
 | New Volume (same AZ)
 | Cross-Region Copy
 | Share with other accounts</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A database server needs high IOPS with snapshot-based DR.</p>
<ul>
<li>Use io2 volumes with 10,000 provisioned IOPS.</li>
<li>Schedule daily snapshots with lifecycle to retain 7 daily copies.</li>
<li>Copy snapshots to another region for cross-region DR.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create and attach an EBS volume to EC2, format and mount the filesystem</li>
<li>Create a snapshot, modify data, and restore from snapshot</li>
<li>Modify volume type and observe IOPS changes</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the correct EBS volume type selected for IOPS/throughput requirements?</li>
<li>Are EBS snapshots scheduled for regular backups?</li>
<li>Are snapshots copied to another region for DR?</li>
<li>Are unused EBS volumes identified and deleted?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm3-l4',
        title: 'Amazon ElastiCache & DynamoDB Fundamentals',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Design a caching strategy using ElastiCache to reduce database load</li>
<li>Differentiate between Redis and Memcached</li>
<li>Configure DynamoDB tables with partition keys for optimal performance</li>
</ul>
</div>
<h2>Amazon ElastiCache & DynamoDB</h2>
<p>ElastiCache provides in-memory caching. DynamoDB is a fully managed NoSQL key-value and document database.</p>
<h3>ElastiCache Engines</h3>
<ul>
<li><strong>Redis:</strong> Rich data structures, persistence, replication, pub/sub.</li>
<li><strong>Memcached:</strong> Simple, multi-threaded, no persistence.</li>
</ul>
<h3>Common Caching Patterns</h3>
<ul>
<li><strong>Lazy Loading:</strong> Check cache first. If miss, query DB, update cache.</li>
<li><strong>Write-Through:</strong> Write to cache and DB simultaneously.</li>
<li><strong>TTL:</strong> Set expiration times to auto-refresh cache periodically.</li>
</ul>
<div class="architecture-diagram">
<h3>Caching Architecture</h3>
<pre>App -> ElastiCache (cache hit)
  |
  +-> RDS / DynamoDB (cache miss)
         |
     [Populate cache]
         |
     Return result</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A social media app frequently loads user profiles, causing high RDS load.</p>
<ul>
<li>Add ElastiCache (Redis) in front of RDS.</li>
<li>Cache user profiles with a 1-hour TTL.</li>
<li>On profile update, invalidate the cached entry.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Launch an ElastiCache Redis cluster and connect from EC2</li>
<li>Implement lazy-loading cache and observe latency difference</li>
<li>Create a DynamoDB table and query items</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is cache hit ratio monitored to verify effectiveness?</li>
<li>Is ElastiCache deployed in the same VPC as the application?</li>
<li>Are Redis replication groups configured for high availability?</li>
<li>Is DynamoDB auto-scaling enabled for traffic spikes?</li>
</ul>
</div>
</div>`,
      },
    ],
    quiz: [
      { id: 'm3-q1', question: 'Which S3 storage class should you use for long-term archival data retrievable within 12 hours?', options: ['S3 Standard', 'S3 Standard-IA', 'S3 Glacier Deep Archive', 'S3 Intelligent-Tiering'], correct: 2 },
      { id: 'm3-q2', question: 'What is the primary benefit of RDS Multi-AZ deployments?', options: ['Read scaling', 'Automatic failover during AZ outages', 'Cross-region DR', 'Performance improvement'], correct: 1 },
      { id: 'm3-q3', question: 'Which EBS volume type is best for a high-traffic database requiring 50,000 consistent IOPS?', options: ['gp3', 'io2', 'st1', 'sc1'], correct: 1 },
      { id: 'm3-q4', question: 'What is the recommended caching strategy to ensure cached data is never stale?', options: ['Lazy loading with long TTL', 'Write-through with cache invalidation', 'Lazy loading without TTL', 'No caching'], correct: 1 },
      { id: 'm3-q5', question: 'What is the maximum storage size for an Amazon Aurora database?', options: ['16 TB', '64 TB', '128 TB', 'Unlimited'], correct: 2 },
      { id: 'm3-q6', question: 'How does S3 achieve 99.999999999% durability?', options: ['Encryption at rest', 'Automatic replication across multiple AZs', 'Daily snapshots', 'EBS mirroring'], correct: 1 },
      { id: 'm3-q7', question: 'Which ElastiCache engine supports data persistence and replication?', options: ['Memcached', 'Redis', 'Both', 'Neither'], correct: 1 },
    ],
  },
  {
    id: 'mod-4',
    title: 'Serverless Computing',
    lessons: [
      {
        id: 'm4-l1',
        title: 'AWS Lambda Fundamentals',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Create and configure AWS Lambda functions with appropriate memory and timeout</li>
<li>Identify event sources (S3, API Gateway, SQS, EventBridge)</li>
<li>Optimize Lambda performance using layers and reserved concurrency</li>
</ul>
</div>
<h2>AWS Lambda</h2>
<p>AWS Lambda runs your code in response to events without provisioning or managing servers.</p>
<h3>Key Concepts</h3>
<ul>
<li><strong>Trigger Sources:</strong> S3, API Gateway, SQS, DynamoDB Streams, EventBridge, and 30+ services.</li>
<li><strong>Execution Model:</strong> Cold start (new environment) vs warm start (reused environment).</li>
<li><strong>Reserved Concurrency:</strong> Guarantee execution capacity for critical functions.</li>
<li><strong>Lambda Layers:</strong> Share code and libraries across functions.</li>
<li><strong>Function URL:</strong> HTTPS endpoint directly invocable without API Gateway.</li>
</ul>
<div class="architecture-diagram">
<h3>Lambda Event Sources</h3>
<pre>S3 (new object) -> Lambda (resize) -> S3 (thumbnails)
API Gateway -> Lambda (handler) -> DynamoDB
SQS -> Lambda (batch processor) -> S3
EventBridge (schedule) -> Lambda (cleanup)</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A photo sharing app needs thumbnails on upload.</p>
<ul>
<li>Configure S3 event notification triggering a Lambda function.</li>
<li>The function reads the image, creates a thumbnail, saves to another bucket.</li>
<li>Set timeout to 30s and memory to 512MB for image processing.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a Lambda function using the Node.js runtime</li>
<li>Configure an S3 trigger to invoke on object creation</li>
<li>Add a Lambda layer for image processing</li>
<li>Monitor invocations in CloudWatch Logs</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the timeout set to the minimum needed for the workload?</li>
<li>Are environment variables encrypted with KMS if they contain secrets?</li>
<li>Is reserved concurrency configured for critical functions?</li>
<li>Are dead-letter queues configured for async invocations?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm4-l2',
        title: 'Amazon API Gateway',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Create RESTful and HTTP APIs with Lambda integrations</li>
<li>Implement authentication and rate limiting for API endpoints</li>
<li>Use API Gateway caching to reduce backend load</li>
</ul>
</div>
<h2>Amazon API Gateway</h2>
<p>API Gateway enables you to create, publish, monitor, and secure APIs at any scale.</p>
<h3>API Types</h3>
<ul>
<li><strong>HTTP API:</strong> Lower-latency, simpler. Best for Lambda-focused APIs.</li>
<li><strong>REST API:</strong> Full-featured with API keys, usage plans, request validation.</li>
<li><strong>WebSocket API:</strong> Two-way real-time communication.</li>
</ul>
<h3>Key Features</h3>
<ul>
<li><strong>Authentication:</strong> IAM, Lambda authorizer (JWT), Cognito User Pools.</li>
<li><strong>Throttling:</strong> Per-client rate limiting via usage plans.</li>
<li><strong>Caching:</strong> Cache responses with configurable TTL.</li>
<li><strong>Canary Deployments:</strong> Route % traffic to a new API version.</li>
</ul>
<div class="architecture-diagram">
<h3>Serverless API</h3>
<pre>Client -> CloudFront -> API Gateway -> Lambda -> DynamoDB</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Build a serverless REST API for a task management app.</p>
<ul>
<li>Create an HTTP API with routes: GET /tasks, POST /tasks, DELETE /tasks/{id}.</li>
<li>Integrate each route with a Lambda proxy integration.</li>
<li>Enable CORS for web frontend access.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create an HTTP API with Lambda proxy integration</li>
<li>Configure CORS headers and test cross-origin requests</li>
<li>Enable API caching and measure latency impact</li>
<li>Create a usage plan with rate limiting</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the correct API type used (HTTP for Lambda-focused)?</li>
<li>Is authentication configured (Lambda authorizer, Cognito, IAM)?</li>
<li>Are throttling limits configured to protect the backend?</li>
<li>Is CORS configured correctly for the frontend domain?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm4-l3',
        title: 'AWS Step Functions & EventBridge',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Model multi-step workflows using Step Functions</li>
<li>Create EventBridge rules to route events between services</li>
<li>Design event-driven architectures with pub-sub patterns</li>
</ul>
</div>
<h2>AWS Step Functions & EventBridge</h2>
<p>Step Functions orchestrates multiple AWS services into flexible workflows. EventBridge is a serverless event bus for connecting applications.</p>
<h3>Step Functions</h3>
<ul>
<li><strong>State Machine:</strong> Workflow defined in Amazon States Language (ASL) JSON.</li>
<li><strong>Standard Workflows:</strong> Long-running (up to 1 year), durable, exactly-once.</li>
<li><strong>Express Workflows:</strong> High-volume, short (up to 5 min), at-least-once.</li>
<li><strong>States:</strong> Task (invoke Lambda), Choice (branching), Parallel, Wait, Map.</li>
</ul>
<h3>EventBridge</h3>
<ul>
<li><strong>Default Event Bus:</strong> Receives events from AWS services.</li>
<li><strong>Custom Event Bus:</strong> Events from custom apps or SaaS.</li>
<li><strong>Pipes:</strong> Point-to-point integration with filtering and transformation.</li>
</ul>
<div class="architecture-diagram">
<h3>Order Processing Workflow</h3>
<pre>EventBridge: "OrderPlaced"
      |
Step Functions: OrderProcessor
      |
 +----+----+
 | Validate Payment (Lambda)
 | Check Inventory (DynamoDB)
 | Ship Order (SNS)
 | Update Status (DynamoDB)</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> An e-commerce order processing system needs reliable order fulfillment.</p>
<ul>
<li>EventBridge detects a new order event from the web API.</li>
<li>Step Functions orchestrates: validate payment, check inventory, process shipping.</li>
<li>If payment fails, route to error handling state.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a Step Functions state machine with 3 Lambda tasks</li>
<li>Add a Choice state for conditional branching</li>
<li>Create an EventBridge rule triggering the state machine</li>
<li>Monitor workflow executions in the console</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the workflow type correct (Standard vs Express)?</li>
<li>Are error retries and catch blocks configured for each state?</li>
<li>Is EventBridge used for loose coupling between services?</li>
<li>Are DLQs configured for failed events?</li>
</ul>
</div>
</div>`,
      },
    ],
    quiz: [
      { id: 'm4-q1', question: 'Which AWS service can directly trigger a Lambda when a new object is uploaded to S3?', options: ['CloudWatch Events', 'S3 Event Notification', 'SNS Topic', 'SQS Queue'], correct: 1 },
      { id: 'm4-q2', question: 'What is the purpose of reserved concurrency in Lambda?', options: ['Reduce cold starts', 'Guarantee execution capacity for critical functions', 'Increase function timeout', 'Enable cross-account access'], correct: 1 },
      { id: 'm4-q3', question: 'Which API Gateway type is best for a new serverless API with Lambda proxy integration?', options: ['REST API', 'HTTP API', 'WebSocket API', 'Private API'], correct: 1 },
      { id: 'm4-q4', question: 'What does a Lambda authorizer in API Gateway do?', options: ['Rate limit requests', 'Authenticate/authorize before reaching the backend', 'Cache API responses', 'Transform request bodies'], correct: 1 },
      { id: 'm4-q5', question: 'Which Step Functions type suits high-volume transaction processing?', options: ['Standard Workflow', 'Express Workflow', 'Both', 'Neither'], correct: 1 },
      { id: 'm4-q6', question: 'Which Step Functions state executes a Lambda function?', options: ['Choice', 'Parallel', 'Task', 'Map'], correct: 2 },
      { id: 'm4-q7', question: 'What is EventBridge\'s role in event-driven architecture?', options: ['Execute scheduled tasks', 'Route events with filtering between sources and targets', 'Store event data permanently', 'Replace API Gateway'], correct: 1 },
    ],
  },
  {
    id: 'mod-5',
    title: 'Data & Analytics',
    lessons: [
      {
        id: 'm5-l1',
        title: 'Amazon DynamoDB Deep Dive',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Design DynamoDB tables with appropriate partition keys and sort keys</li>
<li>Differentiate on-demand vs provisioned capacity modes</li>
<li>Implement DynamoDB Streams for downstream processing</li>
</ul>
</div>
<h2>Amazon DynamoDB Deep Dive</h2>
<p>DynamoDB is a fully managed NoSQL database with single-digit millisecond performance at any scale.</p>
<h3>Core Concepts</h3>
<ul>
<li><strong>Partition Key:</strong> Primary key for data partitioning. Choose high-cardinality keys.</li>
<li><strong>Sort Key:</strong> Secondary key enabling range queries.</li>
<li><strong>LSI:</strong> Alternative sort key on the same partition key.</li>
<li><strong>GSI:</strong> Different partition/sort key for alternate query patterns.</li>
<li><strong>DAX:</strong> In-memory cache reducing read latency to microseconds.</li>
</ul>
<h3>Capacity Modes</h3>
<ul>
<li><strong>On-Demand:</strong> Pay-per-request. Best for unpredictable workloads.</li>
<li><strong>Provisioned:</strong> Specify RCU/WCU. Best for predictable workloads with auto-scaling.</li>
</ul>
<div class="architecture-diagram">
<h3>DynamoDB Table Design</h3>
<pre>Table: Orders
 PK: CustomerID (String)
 SK: OrderDate (String)
 +-- GSI1: Status-Date index
 +-- LSI1: PaymentMethod-index</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Design a leaderboard for a gaming platform.</p>
<ul>
<li>PK: GameID, SK: Score#PlayerID for sorted leaderboard.</li>
<li>GSI: PlayerID-index for querying all scores by player.</li>
<li>Use on-demand capacity for unpredictable traffic.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a DynamoDB table with composite primary key</li>
<li>Insert and query items (use Query not Scan)</li>
<li>Create a GSI and query using the alternate key</li>
<li>Enable Streams and trigger Lambda on new items</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the partition key chosen for even traffic distribution?</li>
<li>Are GSIs designed for application query patterns?</li>
<li>Is on-demand used for unpredictable workloads?</li>
<li>Are Scan operations minimized in favor of Query?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm5-l2',
        title: 'Amazon Kinesis',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Differentiate Kinesis Data Streams, Firehose, and Data Analytics</li>
<li>Design real-time streaming data pipelines</li>
<li>Choose shard count and partition keys for data distribution</li>
</ul>
</div>
<h2>Amazon Kinesis</h2>
<p>Amazon Kinesis enables you to collect, process, and analyze real-time streaming data.</p>
<h3>Kinesis Services</h3>
<ul>
<li><strong>Data Streams:</strong> Low-latency ingestion in shards. 24h default retention (up to 365 days).</li>
<li><strong>Data Firehose:</strong> Load streaming data into S3, Redshift, OpenSearch. No shard management.</li>
<li><strong>Data Analytics:</strong> Run SQL or Apache Flink on streaming data in real-time.</li>
</ul>
<div class="architecture-diagram">
<h3>Real-Time Analytics Pipeline</h3>
<pre>IoT Sensors -> Kinesis Data Streams
                 |
           +-----+-----+
    Lambda Consumer  KDA (SQL/Flink)
           |              |
       S3 (raw)    S3 (aggregated)</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Fleet management needs real-time GPS tracking for 10,000 vehicles.</p>
<ul>
<li>Each vehicle sends GPS data every 5 seconds to Kinesis Data Streams.</li>
<li>Use vehicle ID as the partition key for ordering.</li>
<li>Lambda consumer updates DynamoDB with latest location.</li>
<li>Firehose backs up raw data to S3 every 60 seconds.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a Kinesis Data Stream with 2 shards</li>
<li>Configure a Lambda consumer to process stream records</li>
<li>Set up Firehose to deliver data to S3</li>
<li>Monitor stream metrics (IncomingBytes, IteratorAge)</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is shard count sufficient for expected throughput?</li>
<li>Is partition key chosen to avoid hot shards?</li>
<li>Is data retention configured appropriately?</li>
<li>Are consumers using enhanced fan-out for low latency?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm5-l3',
        title: 'Amazon Athena & AWS Glue',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Use Athena to query data in S3 using standard SQL</li>
<li>Configure Glue crawlers to auto-discover schemas</li>
<li>Optimize queries with partitioning, columnar formats, compression</li>
</ul>
</div>
<h2>Amazon Athena & AWS Glue</h2>
<p>Athena is an interactive query service for S3 data. Glue is a serverless data integration service.</p>
<h3>Athena Features</h3>
<ul>
<li>Serverless — pay only per query.</li>
<li>ANSI SQL support. Reads CSV, JSON, Parquet, ORC, Avro.</li>
<li>Integrates with QuickSight for visualization.</li>
<li>Federated queries for DynamoDB, RDS, Redshift.</li>
</ul>
<h3>Glue Capabilities</h3>
<ul>
<li><strong>Crawlers:</strong> Scan sources, infer schemas, populate Data Catalog.</li>
<li><strong>ETL Jobs:</strong> Serverless Spark for data transformation.</li>
<li><strong>Data Catalog:</strong> Central metadata repository for table definitions.</li>
</ul>
<div class="architecture-diagram">
<h3>Serverless Analytics</h3>
<pre>Raw Data (S3: CSV)
      |
[Glue Crawler] -> Data Catalog
      |
[Glue ETL] -> Transformed (S3: Parquet)
      |
[Athena Queries] -> QuickSight Dashboard</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Analyze a year of clickstream data stored as daily CSV files in S3.</p>
<ul>
<li>Partition data: year/month/day.</li>
<li>Run Glue crawler to discover the schema.</li>
<li>Convert CSVs to Parquet via Glue ETL.</li>
<li>Query: SELECT page, COUNT(*) GROUP BY page ORDER BY 2 DESC.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Upload partitioned CSV data to S3</li>
<li>Run a Glue crawler to catalog the data</li>
<li>Run Athena queries and measure cost</li>
<li>Convert to Parquet and compare performance</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is data partitioned by date or high-cardinality columns?</li>
<li>Are columnar formats (Parquet/ORC) used?</li>
<li>Is compression (gzip/snappy) applied?</li>
<li>Are Glue crawlers scheduled when new data arrives?</li>
</ul>
</div>
</div>`,
      },
    ],
    quiz: [
      { id: 'm5-q1', question: 'What is the primary purpose of a DynamoDB GSI?', options: ['Enforce unique constraints', 'Enable querying with a different partition key', 'Provide in-memory caching', 'Enable cross-region replication'], correct: 1 },
      { id: 'm5-q2', question: 'Which Kinesis service auto-loads streaming data into S3 without managing shards?', options: ['Data Streams', 'Data Firehose', 'Data Analytics', 'Video Streams'], correct: 1 },
      { id: 'm5-q3', question: 'What is the default retention period for Kinesis Data Streams?', options: ['1 hour', '24 hours', '7 days', '30 days'], correct: 1 },
      { id: 'm5-q4', question: 'Which file format is most efficient for Athena queries?', options: ['CSV', 'JSON', 'Parquet', 'XML'], correct: 2 },
      { id: 'm5-q5', question: 'What does a Glue crawler do?', options: ['Transform data with Spark', 'Scan sources and populate Data Catalog', 'Query with SQL', 'Visualize data'], correct: 1 },
      { id: 'm5-q6', question: 'Which DynamoDB capacity mode is best for unpredictable traffic?', options: ['Provisioned', 'On-demand', 'DAX caching', 'Reserved'], correct: 1 },
    ],
  },
  {
    id: 'mod-6',
    title: 'DevOps & CI/CD',
    lessons: [
      {
        id: 'm6-l1',
        title: 'AWS CodePipeline',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Create an end-to-end CI/CD pipeline using CodePipeline</li>
<li>Configure source, build, test, and deploy stages</li>
<li>Implement manual approval gates for production deployments</li>
</ul>
</div>
<h2>AWS CodePipeline</h2>
<p>CodePipeline is a fully managed continuous delivery service automating build, test, and deploy phases.</p>
<h3>Pipeline Stages</h3>
<ul>
<li><strong>Source:</strong> GitHub, CodeCommit, S3, ECR. Auto-detects changes.</li>
<li><strong>Build:</strong> CodeBuild, Jenkins. Compiles, tests, creates artifacts.</li>
<li><strong>Test:</strong> Unit, integration, security scanning.</li>
<li><strong>Deploy:</strong> CodeDeploy, ECS, CloudFormation, Elastic Beanstalk, Lambda.</li>
<li><strong>Approval:</strong> Manual sign-off before production deployment.</li>
</ul>
<div class="architecture-diagram">
<h3>CI/CD Pipeline</h3>
<pre>GitHub Push -> Source -> Build -> Staging Deploy
                               |
                       [Manual Approval]
                               |
                       Production Deploy</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A team of 5 needs an automated release pipeline for a Node.js app.</p>
<ul>
<li>Stage 1: Trigger on push to main branch in GitHub.</li>
<li>Stage 2: CodeBuild runs npm install, npm test, npm run build.</li>
<li>Stage 3: CodeDeploy deploys to staging.</li>
<li>Stage 4: Manual approval from senior dev.</li>
<li>Stage 5: Blue/Green deployment to production.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a CodePipeline with GitHub source stage</li>
<li>Add CodeBuild stage running tests</li>
<li>Configure CodeDeploy stage for EC2</li>
<li>Add manual approval step and test end-to-end</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Are all stages configured with failure notifications?</li>
<li>Is there a manual approval gate before production?</li>
<li>Are artifacts stored in S3 with encryption?</li>
<li>Is the pipeline IAM role scoped minimally?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm6-l2',
        title: 'AWS CodeBuild & CodeDeploy',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Configure CodeBuild projects with build specifications</li>
<li>Implement deployment strategies (rolling, blue/green, canary)</li>
<li>Create appspec.yml for CodeDeploy lifecycle hooks</li>
</ul>
</div>
<h2>AWS CodeBuild & CodeDeploy</h2>
<p>CodeBuild compiles code, runs tests, and produces packages. CodeDeploy automates deployments to EC2, Lambda, or ECS.</p>
<h3>CodeBuild Features</h3>
<ul>
<li><strong>buildspec.yml:</strong> Defines build phases: install, pre-build, build, post-build.</li>
<li><strong>Custom Environments:</strong> Docker images with pre-installed tools.</li>
<li><strong>Caching:</strong> Cache dependencies in S3 for faster builds.</li>
</ul>
<h3>CodeDeploy Strategies</h3>
<ul>
<li><strong>In-Place (Rolling):</strong> Update instances one at a time.</li>
<li><strong>Blue/Green:</strong> Launch new instances, test, shift traffic. Zero downtime.</li>
<li><strong>Canary:</strong> Route small % to new version, monitor, full rollout.</li>
</ul>
<div class="architecture-diagram">
<h3>CodeDeploy Lifecycle Hooks</h3>
<pre>ApplicationStop -> DownloadBundle -> BeforeInstall
  -> Install -> AfterInstall -> ApplicationStart -> ValidateService</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Deploy a web app with zero downtime using Blue/Green.</p>
<ul>
<li>Create AppSpec with ApplicationStart hook running health checks.</li>
<li>Configure Blue/Green to an Auto Scaling group.</li>
<li>ValidateService hook checks all instances respond 200 OK.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a CodeBuild project building a Node.js app</li>
<li>Create a CodeDeploy app with EC2 Auto Scaling group</li>
<li>Deploy and observe lifecycle hooks executing</li>
<li>Perform Blue/Green deployment</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the build environment cached for speed?</li>
<li>Are artifacts encrypted in S3?</li>
<li>Is ValidateService configured?</li>
<li>Is deployment strategy appropriate for the app?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm6-l3',
        title: 'Infrastructure as Code (CloudFormation & CDK)',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Write CloudFormation templates to provision resources declaratively</li>
<li>Use AWS CDK in TypeScript/Python with high-level constructs</li>
<li>Implement parameters, outputs, and conditionals for reusable templates</li>
</ul>
</div>
<h2>Infrastructure as Code</h2>
<p>IaC lets you manage AWS resources through code. CloudFormation and CDK are the primary AWS IaC tools.</p>
<h3>CloudFormation</h3>
<ul>
<li><strong>Templates:</strong> JSON/YAML describing AWS resources.</li>
<li><strong>Stacks:</strong> Resources managed as a single unit.</li>
<li><strong>Change Sets:</strong> Preview changes before applying.</li>
<li><strong>Nested Stacks:</strong> Reusable component stacks.</li>
<li><strong>StackSets:</strong> Deploy across accounts and regions.</li>
</ul>
<h3>AWS CDK</h3>
<ul>
<li>Define infrastructure in TypeScript, Python, Java, C#, Go.</li>
<li><strong>Constructs:</strong> High-level building blocks.</li>
<li><strong>Synthesizes</strong> to CloudFormation templates via cdk synth.</li>
</ul>
<div class="architecture-diagram">
<h3>CDK to CloudFormation</h3>
<pre>CDK App (TypeScript) -> cdk synth -> CloudFormation JSON -> cdk deploy -> AWS Resources</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Create a reusable stack for a microservice with ALB, ECS Fargate, RDS.</p>
<ul>
<li>Define parameters: VpcId, InstanceType, DBUsername.</li>
<li>Use CDK constructs: ApplicationLoadBalancer, FargateService, DatabaseCluster.</li>
<li>Output LoadBalancerDNS and DatabaseEndpoint.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Write a CloudFormation template creating S3 + EC2 + Security Group</li>
<li>Create the same with CDK (TypeScript) and compare</li>
<li>Use cdk diff to preview changes</li>
<li>Destroy stack with cdk destroy</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Are templates organized into logical stacks?</li>
<li>Are parameters used instead of hardcoding?</li>
<li>Are stack outputs defined for cross-stack references?</li>
<li>Is termination protection enabled on production stacks?</li>
</ul>
</div>
</div>`,
      },
    ],
    quiz: [
      { id: 'm6-q1', question: 'What triggers a CodePipeline execution by default?', options: ['Manual click', 'Source code change', 'Daily schedule', 'Email notification'], correct: 1 },
      { id: 'm6-q2', question: 'Which file defines CodeBuild build phases?', options: ['package.json', 'buildspec.yml', 'appspec.yml', 'Dockerfile'], correct: 1 },
      { id: 'm6-q3', question: 'Which deployment strategy provides zero downtime?', options: ['In-place', 'Blue/Green', 'Canary', 'Rolling'], correct: 1 },
      { id: 'm6-q4', question: 'What does cdk synth do?', options: ['Deploys the stack', 'Synthesizes CDK to CloudFormation template', 'Destroys the stack', 'Lists stacks'], correct: 1 },
      { id: 'm6-q5', question: 'What does ValidateService hook do in CodeDeploy?', options: ['Validates IAM permissions', 'Verifies deployment success via health checks', 'Validates template syntax', 'Verifies S3 permissions'], correct: 1 },
      { id: 'm6-q6', question: 'Which CloudFormation feature allows previewing changes?', options: ['Stack Policies', 'Change Sets', 'Drift Detection', 'Nested Stacks'], correct: 1 },
    ],
  },
  {
    id: 'mod-7',
    title: 'Container Orchestration',
    lessons: [
      {
        id: 'm7-l1',
        title: 'Amazon ECS & AWS Fargate',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Create ECS task definitions with container settings and resource limits</li>
<li>Deploy containers with Fargate launch type</li>
<li>Configure ECS service auto-scaling</li>
</ul>
</div>
<h2>Amazon ECS & AWS Fargate</h2>
<p>ECS is a fully managed container orchestration service. Fargate is a serverless compute engine for containers.</p>
<h3>Key Concepts</h3>
<ul>
<li><strong>Task Definition:</strong> Blueprint specifying container image, CPU, memory, ports.</li>
<li><strong>Task:</strong> Running instance of a task definition.</li>
<li><strong>Service:</strong> Manages long-running tasks. Integrates with ALB.</li>
<li><strong>Cluster:</strong> Logical grouping of tasks/services.</li>
</ul>
<h3>Fargate vs EC2 Launch Type</h3>
<ul>
<li><strong>Fargate:</strong> No infrastructure. Pay per task. Best for most workloads.</li>
<li><strong>EC2:</strong> Manage instances. More control, GPU support.</li>
</ul>
<div class="architecture-diagram">
<h3>ECS Service with Fargate</h3>
<pre>ALB -> ECS Service (desired=3)
        |
   +----+----+
Fargate Task 1  Fargate Task 2  Fargate Task 3
        |
Auto Scaling (CPU > 70%)</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Deploy a containerized Node.js API with auto-scaling.</p>
<ul>
<li>Task definition: 512 CPU, 1024 MB, port 3000.</li>
<li>ECS service with desired=2 behind ALB.</li>
<li>Auto-scaling: target CPU 70%, min=2, max=10.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create an ECS task definition with a sample image</li>
<li>Launch a Fargate service with ALB</li>
<li>Configure auto-scaling and trigger scale-out</li>
<li>View container logs in CloudWatch</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is Fargate used unless EC2 is specifically needed?</li>
<li>Are CPU/memory limits set to avoid contention?</li>
<li>Is the service integrated with a load balancer?</li>
<li>Are container health checks configured?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm7-l2',
        title: 'Amazon EKS',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Differentiate ECS and EKS for container orchestration</li>
<li>Deploy a Kubernetes cluster with EKS managed node groups</li>
<li>Configure Deployments, Services, ConfigMaps on EKS</li>
</ul>
</div>
<h2>Amazon EKS</h2>
<p>EKS is a managed Kubernetes service. AWS operates the control plane; you manage worker nodes.</p>
<h3>EKS Architecture</h3>
<ul>
<li><strong>Control Plane:</strong> AWS-managed, highly available, auto-upgrades.</li>
<li><strong>Data Plane:</strong> Managed Node Groups (EC2), Fargate, or self-managed nodes.</li>
<li><strong>Cluster Endpoint:</strong> Public or private (VPC-only).</li>
</ul>
<h3>ECS vs EKS Decision</h3>
<ul>
<li><strong>ECS:</strong> Simpler, AWS-native, less overhead.</li>
<li><strong>EKS:</strong> K8s expertise, multi-cloud portability, Helm charts, CRDs.</li>
</ul>
<div class="architecture-diagram">
<h3>EKS Cluster</h3>
<pre>kubectl -> EKS Control Plane (AWS-managed)
            |
       +----+----+
    Node Group 1   Node Group 2
    (us-east-1a)   (us-east-1b)
            |
    Pods -> Service -> ALB</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A K8s-expert team runs microservices architecture.</p>
<ul>
<li>EKS cluster with managed node group of 3 m5.large.</li>
<li>Deploy Kubernetes Deployment with 3 replicas.</li>
<li>Expose via Service type LoadBalancer (ALB).</li>
<li>Use ConfigMap for config, Secret for credentials.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create EKS cluster with eksctl</li>
<li>Deploy sample app with kubectl</li>
<li>Configure HPA based on CPU</li>
<li>Set up Cluster Autoscaler</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Is the cluster endpoint private?</li>
<li>Are node groups deployed across multiple AZs?</li>
<li>Is IRSA configured for pod-level IAM?</li>
<li>Are cluster/node auto-scalers enabled?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm7-l3',
        title: 'Amazon ECR & Container Image Management',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Create ECR repositories and push Docker images</li>
<li>Configure lifecycle policies for automatic image cleanup</li>
<li>Implement image scanning for vulnerability detection</li>
</ul>
</div>
<h2>Amazon ECR & Container Image Management</h2>
<p>Amazon ECR is a fully managed container registry with IAM-controlled access.</p>
<h3>Key Features</h3>
<ul>
<li><strong>Private Repositories:</strong> IAM-controlled image storage.</li>
<li><strong>Image Scanning:</strong> CVE-based vulnerability scanning on push.</li>
<li><strong>Lifecycle Policies:</strong> Auto-expire old images.</li>
<li><strong>Cross-Region Replication:</strong> Faster pulls in other regions.</li>
<li><strong>Pull-Through Caches:</strong> Cache Docker Hub images for reliability.</li>
</ul>
<div class="architecture-diagram">
<h3>ECR Workflow</h3>
<pre>docker build -> docker push -> ECR Repository
                                |
                          [Image Scan]
                                |
                          ECS / EKS Pull
                                |
                          Container Run</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Set up container registry for a team of 10 developers.</p>
<ul>
<li>Create ECR repository per microservice.</li>
<li>Lifecycle: keep 10 tagged images, expire untagged after 7 days.</li>
<li>Enable scan-on-push for vulnerability detection.</li>
<li>IAM policies: push for CI/CD, pull for ECS/EKS.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create an ECR repository and push a Docker image</li>
<li>Configure lifecycle policy to prune old images</li>
<li>Enable image scanning and review vulnerabilities</li>
<li>Pull and run the image to verify access</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Are lifecycle policies configured?</li>
<li>Is image scanning enabled on push?</li>
<li>Are IAM permissions scoped per repository?</li>
<li>Is cross-region replication configured if needed?</li>
</ul>
</div>
</div>`,
      },
    ],
    quiz: [
      { id: 'm7-q1', question: 'What is the primary benefit of AWS Fargate over EC2 launch type?', options: ['Lower cost', 'No EC2 management needed', 'GPU support', 'Faster startup'], correct: 1 },
      { id: 'm7-q2', question: 'What does an ECS task definition specify?', options: ['Desired task count', 'Container image, CPU, memory, ports', 'Load balancer config', 'Scaling policies'], correct: 1 },
      { id: 'm7-q3', question: 'Which CLI tool creates and manages EKS clusters?', options: ['kubectl', 'eksctl', 'docker', 'ecs-cli'], correct: 1 },
      { id: 'm7-q4', question: 'What ECR feature checks images for vulnerabilities?', options: ['Lifecycle policies', 'Image scanning', 'Cross-region replication', 'Tagging'], correct: 1 },
      { id: 'm7-q5', question: 'When should you choose EKS over ECS?', options: ['Simpler setup needed', 'Team has K8s expertise, needs portability', 'Simple web server', 'Cost primary concern'], correct: 1 },
      { id: 'm7-q6', question: 'How does ECS distribute traffic to service tasks?', options: ['Route 53 DNS', 'ALB integration', 'Direct internet', 'CloudFront'], correct: 1 },
    ],
  },
  {
    id: 'mod-8',
    title: 'Advanced Networking',
    lessons: [
      {
        id: 'm8-l1',
        title: 'AWS Transit Gateway',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Design hub-and-spoke network topology with Transit Gateway</li>
<li>Configure route tables for network isolation</li>
<li>Evaluate Transit Gateway vs VPC Peering tradeoffs</li>
</ul>
</div>
<h2>AWS Transit Gateway</h2>
<p>Transit Gateway connects VPCs, VPN, and Direct Connect via a central hub, eliminating mesh peering complexity.</p>
<h3>Key Concepts</h3>
<ul>
<li><strong>Transit Gateway:</strong> Network transit hub in one region.</li>
<li><strong>Attachments:</strong> Connect VPCs, VPN, Direct Connect Gateway.</li>
<li><strong>Route Tables:</strong> Control which attachments communicate.</li>
<li><strong>Multicast:</strong> Supported for media distribution.</li>
</ul>
<h3>Transit Gateway vs VPC Peering</h3>
<ul>
<li><strong>VPC Peering:</strong> Point-to-point. N*(N-1)/2 connections for N VPCs. No transitive routing.</li>
<li><strong>Transit Gateway:</strong> Hub-and-spoke. Each VPC connects once. Transitive routing. Supports VPN/DX.</li>
</ul>
<div class="architecture-diagram">
<h3>Hub-and-Spoke Network</h3>
<pre>  VPN (on-prem)
      |
 [Transit Gateway]
  +---+---+
  |   |   |
VPC-A VPC-B VPC-C
(prod)(dev)(shared)

Route isolation: Prod<->Shared, Dev<->Shared, Prod not Dev</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A company with 10 VPCs needs connectivity and on-prem access.</p>
<ul>
<li>Create a Transit Gateway in the main region.</li>
<li>Attach all 10 VPCs. Isolate Production from Development via route tables.</li>
<li>Connect on-prem via VPN attachment.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a Transit Gateway and attach 2 VPCs</li>
<li>Configure route tables for isolation</li>
<li>Verify cross-VPC communication</li>
<li>Compare with VPC peering complexity</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>TGW used instead of peering for 4+ VPCs?</li>
<li>Separate route tables for environment isolation?</li>
<li>TGW attached in 2+ AZs for HA?</li>
<li>TGW flow logs enabled?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm8-l2',
        title: 'AWS Direct Connect & VPN',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Differentiate Site-to-Site VPN and Direct Connect</li>
<li>Design hybrid networks connecting on-prem to AWS</li>
<li>Configure redundant VPN tunnels for HA</li>
</ul>
</div>
<h2>AWS Direct Connect & VPN</h2>
<p>Site-to-Site VPN provides encrypted tunnels over the internet. Direct Connect provides dedicated private connectivity.</p>
<h3>AWS Site-to-Site VPN</h3>
<ul>
<li>Encrypted over public internet. Quick to provision (minutes).</li>
<li>Two tunnels for HA. BGP dynamic routing support.</li>
<li>Max ~1.25 Gbps per tunnel.</li>
</ul>
<h3>AWS Direct Connect</h3>
<ul>
<li>Dedicated private fiber (1-100 Gbps).</li>
<li>Consistent performance, lower latency.</li>
<li>Provisioning: weeks to months.</li>
<li>Lower data transfer costs. No built-in encryption.</li>
</ul>
<div class="architecture-diagram">
<h3>Hybrid Network</h3>
<pre>On-Premises
  |
 +----+----+
 |Direct Connect (primary)
 |VPN (backup)
      |
 [Transit Gateway / VPC]
      |
  AWS Cloud</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Financial institution needs reliable, low-latency AWS connectivity.</p>
<ul>
<li>Provision 1 Gbps Direct Connect as primary.</li>
<li>Site-to-Site VPN as backup.</li>
<li>BGP routing for automatic failover.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Configure Site-to-Site VPN between simulated on-prem and VPC</li>
<li>Verify tunnel status and route propagation</li>
<li>Test failover by disabling one tunnel</li>
<li>Create Virtual Private Gateway</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Redundant VPN tunnels configured?</li>
<li>Direct Connect only when consistent latency needed?</li>
<li>BGP preferred over static routes?</li>
<li>DX locations geographically diverse?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm8-l3',
        title: 'AWS Global Accelerator',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Explain how Global Accelerator improves performance via AWS global network</li>
<li>Differentiate Global Accelerator from CloudFront</li>
<li>Configure Global Accelerator with ALB/NLB endpoints</li>
</ul>
</div>
<h2>AWS Global Accelerator</h2>
<p>Global Accelerator improves availability and performance by routing traffic through the AWS global network.</p>
<h3>How It Works</h3>
<ul>
<li>Users connect to the nearest edge location via Anycast IPs.</li>
<li>Traffic travels over the AWS global network (not public internet).</li>
<li>Routed to optimal endpoint based on health, latency, geography.</li>
</ul>
<h3>Global Accelerator vs CloudFront</h3>
<ul>
<li><strong>CloudFront:</strong> CDN. Caches content at edges. Best for static + dynamic content.</li>
<li><strong>Global Accelerator:</strong> Network optimization. No caching. Best for APIs, gaming, VoIP.</li>
</ul>
<div class="architecture-diagram">
<h3>Global Traffic Optimization</h3>
<pre>User (Tokyo) -> Tokyo Edge -> AWS Global Network
               |
    +----------+----------+
ALB (us-east-1)   ALB (eu-west-1)
(primary)         (secondary)

Failover on health check failure</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Multiplayer gaming needs low latency worldwide.</p>
<ul>
<li>Deploy game servers behind ALBs in us-east-1, eu-west-1, ap-southeast-1.</li>
<li>Create Global Accelerator with endpoints for each region.</li>
<li>Traffic dials: route based on latency to nearest healthy region.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create a Global Accelerator with ALB endpoint</li>
<li>Compare latency vs direct ALB access</li>
<li>Add second region as failover endpoint</li>
<li>Test failover by simulating regional failure</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>GA preferred over CloudFront for dynamic content?</li>
<li>Endpoint groups configured for all regions?</li>
<li>Health checks configured for endpoints?</li>
<li>Static IPs whitelisted by clients?</li>
</ul>
</div>
</div>`,
      },
    ],
    quiz: [
      { id: 'm8-q1', question: 'What is the primary advantage of Transit Gateway over VPC Peering?', options: ['Lower latency', 'Transitive routing hub-and-spoke', 'Built-in encryption', 'Limit of 10 VPCs peering'], correct: 1 },
      { id: 'm8-q2', question: 'Which service provides a dedicated private fiber connection to AWS?', options: ['Site-to-Site VPN', 'Direct Connect', 'Client VPN', 'Transit Gateway'], correct: 1 },
      { id: 'm8-q3', question: 'How does Global Accelerator route traffic to optimal endpoints?', options: ['DNS round-robin', 'Anycast IPs to nearest edge', 'CloudFront caching', 'Route 53 geolocation'], correct: 1 },
      { id: 'm8-q4', question: 'Key difference between CloudFront and Global Accelerator?', options: ['CloudFront global, GA regional', 'GA does not cache, CloudFront does', 'GA only works with S3', 'CloudFront requires custom domain'], correct: 1 },
      { id: 'm8-q5', question: 'How many VPN tunnels in a standard AWS Site-to-Site VPN?', options: ['1', '2', '4', '8'], correct: 1 },
      { id: 'm8-q6', question: 'Which BGP feature enables automatic failover between Direct Connect and VPN?', options: ['Static routing', 'Route propagation', 'AS_PATH prepending', 'DNS failover'], correct: 2 },
    ],
  },
  {
    id: 'mod-9',
    title: 'Cost Optimization & Governance',
    lessons: [
      {
        id: 'm9-l1',
        title: 'AWS Compute Optimizer & Savings Plans',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Use Compute Optimizer for rightsizing recommendations</li>
<li>Differentiate Compute vs EC2 Instance Savings Plans</li>
<li>Calculate savings across pricing models</li>
</ul>
</div>
<h2>AWS Compute Optimizer & Savings Plans</h2>
<p>Compute Optimizer uses ML to recommend optimal resources. Savings Plans offer discounts for commit-based usage.</p>
<h3>Compute Optimizer</h3>
<ul>
<li>Analyzes CPU, memory, IOPS, network utilization.</li>
<li>Recommends rightsizing: downsizing over-provisioned, upgrading under-provisioned.</li>
<li>Supports EC2, ASG, EBS, Lambda.</li>
</ul>
<h3>Savings Plans</h3>
<ul>
<li><strong>Compute Savings Plans:</strong> Covers EC2, Fargate, Lambda. Up to 66% discount.</li>
<li><strong>EC2 Instance Savings Plans:</strong> Specific instance family. Up to 72%.</li>
<li>Commitment: 1 or 3-year term. Partial/All upfront options.</li>
</ul>
<div class="architecture-diagram">
<h3>Pricing Decision</h3>
<pre>Steady-state workload?
      |
 +----+----+
Yes         No
 |           |
Savings    On-Demand
Plans      + Spot
 |
1-yr vs 3-yr
Compute vs EC2-specific</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> 50 EC2 instances (24/7), 10 Lambdas, 5 Fargate services.</p>
<ul>
<li>Run Compute Optimizer (potential 20% savings).</li>
<li>1-year Compute Savings Plan (covers all compute).</li>
<li>Spot for fault-tolerant batch processing.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Enable Compute Optimizer and review recommendations</li>
<li>Create a Savings Plan (simulate) and calculate savings</li>
<li>Compare On-Demand vs Savings Plan pricing</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Compute Optimizer reviewed monthly?</li>
<li>Savings Plan purchased for predictable workloads?</li>
<li>Spot used for fault-tolerant/batch jobs?</li>
<li>Underutilized resources downsized?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm9-l2',
        title: 'S3 Intelligent-Tiering & Storage Optimization',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Explain S3 Intelligent-Tiering auto-migration based on access</li>
<li>Design lifecycle policies to minimize storage costs</li>
<li>Use S3 Storage Lens for cost analysis</li>
</ul>
</div>
<h2>S3 Intelligent-Tiering & Storage Optimization</h2>
<p>Intelligent-Tiering automatically reduces costs by moving data between tiers based on changing access patterns.</p>
<h3>Intelligent-Tiering Tiers</h3>
<ul>
<li><strong>Frequent Access:</strong> Accessed more than once per 30 days.</li>
<li><strong>Infrequent Access:</strong> Accessed less than once per 30 days.</li>
<li><strong>Archive Instant Access:</strong> Accessed less than once per 90 days.</li>
<li><strong>Deep Archive Access:</strong> Accessed less than once per 365 days.</li>
</ul>
<h3>Cost Optimization Checklist</h3>
<ul>
<li>Lifecycle policies for automatic tier transitions.</li>
<li>Delete incomplete multipart uploads after 7 days.</li>
<li>Remove expired object delete markers.</li>
<li>Use S3 Storage Lens for usage analysis.</li>
</ul>
<div class="architecture-diagram">
<h3>S3 Lifecycle Policy</h3>
<pre>Day 0:   S3 Standard
Day 30:  S3 Standard-IA
Day 120: S3 Glacier Flexible
Day 365: Delete</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Optimize storage for a 500TB data lake with unpredictable access.</p>
<ul>
<li>Enable Intelligent-Tiering on the data lake bucket.</li>
<li>Lifecycle: delete incomplete uploads after 7 days.</li>
<li>Use Storage Lens to identify further optimization.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create an S3 bucket with Intelligent-Tiering enabled</li>
<li>Set up lifecycle policy for transitions and expiration</li>
<li>Use S3 Storage Lens dashboard to analyze costs</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Intelligent-Tiering enabled for variable access patterns?</li>
<li>Lifecycle policies cleaning up incomplete uploads?</li>
<li>Storage Lens configured for organization-wide visibility?</li>
<li>Glacier used for data with >90 day access intervals?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm9-l3',
        title: 'AWS Trusted Advisor & Cost Explorer',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Use Trusted Advisor for cost, performance, security checks</li>
<li>Analyze spending with Cost Explorer</li>
<li>Set budgets and alerts for cost governance</li>
</ul>
</div>
<h2>AWS Trusted Advisor & Cost Explorer</h2>
<p>Trusted Advisor inspects your environment across 5 categories. Cost Explorer visualizes spending trends.</p>
<h3>Trusted Advisor Categories</h3>
<ul>
<li><strong>Cost Optimization:</strong> Idle resources, underutilized instances.</li>
<li><strong>Performance:</strong> Right-sized services, provisioned throughput.</li>
<li><strong>Security:</strong> Open ports, MFA on root, S3 bucket permissions.</li>
<li><strong>Fault Tolerance:</strong> Multi-AZ, backup, aged EBS snapshots.</li>
<li><strong>Service Limits:</strong> Usage vs account limits.</li>
</ul>
<div class="architecture-diagram">
<h3>Cost Governance Framework</h3>
<pre>Trusted Advisor (checks) -> Recommendations -> Actions
                                    |
Cost Explorer (trends) -> Budgets -> Alerts -> Remediation</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> Monthly AWS bill unexpectedly grew 40%.</p>
<ul>
<li>Check Trusted Advisor for idle resources and RI recommendations.</li>
<li>Use Cost Explorer to find cost driver by service and region.</li>
<li>Set budget alert at 80% of projected monthly spend.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Review Trusted Advisor recommendations for security</li>
<li>Use Cost Explorer to filter costs by service and tag</li>
<li>Create a budget with alerts at 50%, 80%, 100% thresholds</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Trusted Advisor reviewed weekly for security checks?</li>
<li>Cost Explorer used to track month-over-month trends?</li>
<li>Budgets configured with action thresholds?</li>
<li>Idle resources identified and terminated?</li>
</ul>
</div>
</div>`,
      },
      {
        id: 'm9-l4',
        title: 'AWS Budgets & Governance Best Practices',
        content: `<div class="lesson-prose">
<div class="learning-objectives">
<h3><i class="fas fa-bullseye"></i> Learning Objectives</h3>
<ul>
<li>Create AWS Budgets with actions and alerts</li>
<li>Implement tagging strategies for cost allocation</li>
<li>Design governance frameworks with AWS Config</li>
</ul>
</div>
<h2>AWS Budgets & Governance Best Practices</h2>
<p>AWS Budgets tracks usage and costs. Governance frameworks ensure compliance and cost control.</p>
<h3>Budget Types</h3>
<ul>
<li><strong>Cost Budget:</strong> Monitor spending against a threshold.</li>
<li><strong>Usage Budget:</strong> Track service usage (EC2 hours, S3 storage).</li>
<li><strong>Savings Plans Budget:</strong> Monitor SP utilization/coverage.</li>
<li><strong>Actions:</strong> Auto-stop EC2, apply IAM policy, send SNS on budget breach.</li>
</ul>
<h3>Governance Best Practices</h3>
<ul>
<li><strong>Tagging:</strong> CostCenter, Project, Environment, Team tags.</li>
<li><strong>AWS Config Rules:</strong> Enforce tagging, encryption, bucket policies.</li>
<li><strong>IAM with MFA:</strong> Require MFA for all console users.</li>
<li><strong>Least Privilege:</strong> Grant minimum permissions needed.</li>
<li><strong>Automated Remediation:</strong> Config + Lambda for auto-fixes.</li>
</ul>
<div class="architecture-diagram">
<h3>Governance Framework</h3>
<pre>AWS Budgets (alerts)
     |
AWS Config (rules) -> SNS -> Lambda (auto-remediation)
     |
IAM (MFA + least privilege)
     |
Tagging (cost allocation)</pre>
</div>
<div class="scenario-exercise">
<h3><i class="fas fa-briefcase"></i> Real-World Scenario</h3>
<p><strong>Scenario:</strong> A company needs to enforce tagging and control costs across 5 teams.</p>
<ul>
<li>Create tagging policy: mandatory Environment and CostCenter tags.</li>
<li>AWS Config rule: non-compliant resources trigger auto-remediation.</li>
<li>Cost budget: $10,000/month with alerts at 80% and 100%.</li>
</ul>
</div>
<div class="lab-takeaways">
<h3><i class="fas fa-flask"></i> Hands-On Lab Takeaways</h3>
<ul>
<li>Create an AWS Budget with cost threshold and alert actions</li>
<li>Set up AWS Config rule for required tags</li>
<li>Create a Lambda auto-remediation function for non-compliant resources</li>
</ul>
</div>
<div class="review-checklist">
<h3><i class="fas fa-clipboard-check"></i> Architecture Review Checklist</h3>
<ul>
<li>Budgets configured with actions (not just alerts)?</li>
<li>Tagging strategy enforced via Config rules?</li>
<li>Auto-remediation for critical compliance violations?</li>
<li>IAM least privilege reviewed quarterly?</li>
</ul>
</div>
</div>`,
      },
    ],
    quiz: [
      { id: 'm9-q1', question: 'What does Compute Optimizer recommend?', options: ['New instance types for performance', 'Rightsizing under/over-provisioned resources', 'Security group rule changes', 'VPC subnet redesign'], correct: 1 },
      { id: 'm9-q2', question: 'Which Savings Plan covers EC2, Fargate, and Lambda?', options: ['EC2 Instance Savings Plan', 'Compute Savings Plan', 'Lambda Savings Plan', 'Container Savings Plan'], correct: 1 },
      { id: 'm9-q3', question: 'What does S3 Intelligent-Tiering do automatically?', options: ['Encrypts objects at rest', 'Moves data between access tiers based on usage', 'Replicates data across regions', 'Backs up to Glacier'], correct: 1 },
      { id: 'm9-q4', question: 'Which Trusted Advisor category checks for open SSH access to 0.0.0.0/32?', options: ['Cost Optimization', 'Performance', 'Security', 'Fault Tolerance'], correct: 2 },
      { id: 'm9-q5', question: 'What can AWS Budgets do when a budget threshold is exceeded?', options: ['Only send email', 'Execute actions like stopping EC2 instances', 'Change IAM policies', 'Modify VPC routes'], correct: 1 },
      { id: 'm9-q6', question: 'Which service can auto-remediate non-compliant resources?', options: ['CloudTrail', 'AWS Config + Lambda', 'CloudWatch', 'VPC Flow Logs'], correct: 1 },
      { id: 'm9-q7', question: 'What is the recommended maximum commitment term for Savings Plans?', options: ['No commitment', '1 year', '3 years', '5 years'], correct: 1 },
    ],
  },
];

window.awsLabGuides = [
  {
    title: 'Lab: IAM & Security',
    description: 'Configure IAM users, roles, and policies. Practice the principle of least privilege.',
    objectives: ['Create IAM users and groups with specific policies', 'Create an EC2 role for S3 access', 'Store secrets in Secrets Manager'],
    steps: [
      'Create an IAM user with console access and assign them to a group with ReadOnlyAccess policy.',
      'Create an IAM role for EC2 with S3 read access. Launch an instance using this role and verify S3 access from EC2.',
      'Create a KMS key. Use Secrets Manager to store a database password encrypted with that key.',
      'Enable CloudTrail and review the IAM-related events.',
    ],
    template: `{
  "Resources": {
    "ReadOnlyGroup": {
      "Type": "AWS::IAM::Group",
      "Properties": {
        "Policies": [{
          "PolicyName": "ReadOnly",
          "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
              {"Effect": "Allow", "Action": "s3:GetObject", "Resource": "*"}
            ]
          }
        }]
      }
    }
  }
}`,
    validation: ['IAM user can log in to console', 'EC2 instance can list S3 buckets without credentials', 'Secret can be retrieved via AWS CLI', 'CloudTrail shows IAM events'],
  },
  {
    title: 'Lab: Compute & Networking',
    description: 'Build a VPC with public/private subnets, launch EC2 instances, and configure ALB with Auto Scaling.',
    objectives: ['Create a VPC with subnets across 2 AZs', 'Launch EC2 instances with user data', 'Configure ALB with Auto Scaling group'],
    steps: [
      'Use the VPC wizard to create a VPC with public and private subnets in 2 AZs, an Internet Gateway, and a NAT Gateway.',
      'Create a security group allowing HTTP on 0.0.0/0 and SSH from your IP.',
      'Launch an EC2 instance in a public subnet with user data installing a web server.',
      'Create an ALB with a target group. Create an Auto Scaling group with min=2, max=6.',
    ],
    template: `{
  "Resources": {
    "VPC": {"Type": "AWS::EC2::VPC", "Properties": {"CidrBlock": "10.0.0.0/16"}},
    "PublicSubnet1": {"Type": "AWS::EC2::Subnet", "Properties": {"VpcId": {"Ref": "VPC"}, "CidrBlock": "10.0.1.0/24", "AvailabilityZone": "us-east-1a"}},
    "PublicSubnet2": {"Type": "AWS::EC2::Subnet", "Properties": {"VpcId": {"Ref": "VPC"}, "CidrBlock": "10.0.2.0/24", "AvailabilityZone": "us-east-1b"}},
    "InternetGateway": {"Type": "AWS::EC2::InternetGateway"},
    "ALB": {"Type": "AWS::ElasticLoadBalancingV2::LoadBalancer", "Properties": {"Scheme": "internet-facing", "Subnets": [{"Ref": "PublicSubnet1"}, {"Ref": "PublicSubnet2"}]}}
  }
}`,
    validation: ['VPC subnets route correctly (public to IGW, private to NAT)', 'EC2 boots with user data installed', 'ALB is accessible on port 80', 'Auto Scaling launches instances across AZs'],
  },
  {
    title: 'Lab: Storage & Databases',
    description: 'Configure S3 with lifecycle policies, launch RDS with Multi-AZ, and set up ElastiCache.',
    objectives: ['Create S3 bucket with lifecycle policy', 'Deploy RDS with Multi-AZ and read replicas', 'Configure ElastiCache Redis caching'],
    steps: [
      'Create an S3 bucket with versioning enabled. Add a lifecycle policy: transition to Standard-IA after 30 days, Glacier after 90, delete after 365.',
      'Launch RDS PostgreSQL with Multi-AZ. Create a read replica in another AZ.',
      'Create an ElastiCache Redis cluster. Connect from an EC2 instance and test caching.',
      'Generate pre-signed URLs for S3 objects and verify time-limited access.',
    ],
    template: `{
  "Resources": {
    "DataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "VersioningConfiguration": {"Status": "Enabled"},
        "LifecycleConfiguration": {
          "Rules": [{
            "Id": "TieringRule", "Status": "Enabled",
            "Transitions": [
              {"StorageClass": "STANDARD_IA", "TransitionInDays": 30},
              {"StorageClass": "GLACIER", "TransitionInDays": 90}
            ],
            "ExpirationInDays": 365
          }]
        }
      }
    },
    "DBInstance": {"Type": "AWS::RDS::DBInstance", "Properties": {"MultiAZ": true, "Engine": "postgres", "DBInstanceClass": "db.t3.medium"}}
  }
}`,
    validation: ['S3 lifecycle transitions objects as expected', 'RDS is Multi-AZ (failure test)', 'Read replica shows replication lag', 'Redis cache hit ratio > 80%'],
  },
  {
    title: 'Lab: Serverless Computing',
    description: 'Build a serverless API with Lambda, API Gateway, and Step Functions.',
    objectives: ['Create Lambda functions with S3 and API Gateway triggers', 'Build a REST API with API Gateway', 'Orchestrate a Step Functions workflow'],
    steps: [
      'Create a Lambda function (Node.js) triggered by S3 object creation. Test by uploading a file.',
      'Create an HTTP API in API Gateway with a Lambda proxy integration. Enable CORS.',
      'Create a Step Functions state machine with 3 sequential Lambda tasks. Add error handling.',
      'Create an EventBridge rule that triggers the state machine on a custom event.',
    ],
    template: `{
  "Resources": {
    "MyFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "MemorySize": 256,
        "Timeout": 30
      }
    },
    "ApiGateway": {"Type": "AWS::ApiGateway::RestApi", "Properties": {"Name": "ServerlessAPI"}},
    "StateMachine": {"Type": "AWS::StepFunctions::StateMachine", "Properties": {"DefinitionString": "{\\"StartAt\\":\\"HelloWorld\\",\\"States\\":{\\"HelloWorld\\":{\\"Type\\":\\"Task\\",\\"Resource\\":\\"arn:aws:lambda:...\\",\\"End\\":true}}}"}}
  }
}`,
    validation: ['Lambda triggers on S3 upload', 'API Gateway returns response from Lambda', 'Step Functions workflow completes successfully', 'EventBridge rule delivers events'],
  },
  {
    title: 'Lab: Data & Analytics',
    description: 'DynamoDB table design, Kinesis streaming, and Athena queries on S3 data.',
    objectives: ['Design DynamoDB tables with GSIs', 'Stream data with Kinesis', 'Query data with Athena using Glue catalog'],
    steps: [
      'Create a DynamoDB table with PK=UserID, SK=Timestamp. Add a GSI on Status.',
      'Create a Kinesis Data Stream with 2 shards. Create a Lambda consumer that writes to DynamoDB.',
      'Upload CSV data to an S3 bucket partitioned by year/month/day.',
      'Run a Glue crawler to catalog the data. Query with Athena: SELECT COUNT(*) ... GROUP BY.',
    ],
    template: `{
  "Resources": {
    "DataTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "AttributeDefinitions": [
          {"AttributeName": "PK", "AttributeType": "S"},
          {"AttributeName": "SK", "AttributeType": "S"}
        ],
        "KeySchema": [
          {"AttributeName": "PK", "KeyType": "HASH"},
          {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "GlobalSecondaryIndexes": [{
          "IndexName": "StatusIndex",
          "KeySchema": [{"AttributeName": "Status", "KeyType": "HASH"}],
          "Projection": {"ProjectionType": "ALL"}
        }]
      }
    }
  }
}`,
    validation: ['DynamoDB queries use Query (not Scan)', 'Kinesis stream delivers records to Lambda', 'Athena query runs in under 5 seconds', 'Glue crawler populates Data Catalog'],
  },
  {
    title: 'Lab: DevOps & CI/CD',
    description: 'Set up a complete CI/CD pipeline with CodePipeline, CodeBuild, and CodeDeploy.',
    objectives: ['Create a pipeline from GitHub to production', 'Configure CodeBuild with test/build phases', 'Implement Blue/Green deployment'],
    steps: [
      'Create a CodePipeline with a GitHub source stage (use CodeStar connection to GitHub).',
      'Create a CodeBuild project with a buildspec that runs npm install, npm test, npm run build.',
      'Create a CodeDeploy application with EC2 Auto Scaling group. Configure appspec.yml.',
      'Add a manual approval stage before production deployment.',
      'Perform a Blue/Green deployment and verify zero downtime.',
    ],
    template: `{
  "Resources": {
    "MyPipeline": {
      "Type": "AWS::CodePipeline::Pipeline",
      "Properties": {
        "Stages": [
          {"Name": "Source", "Actions": [{"Name": "Source", "ActionTypeId": {"Category": "Source", "Provider": "GitHub"}, "Configuration": {"Repo": "myRepo", "Branch": "main"}}]},
          {"Name": "Build", "Actions": [{"Name": "Build", "ActionTypeId": {"Category": "Build", "Provider": "CodeBuild"}, "Configuration": {"ProjectName": {"Ref": "BuildProject"}}}]},
          {"Name": "Deploy", "Actions": [{"Name": "Deploy", "ActionTypeId": {"Category": "Deploy", "Provider": "CodeDeploy"}}]}
        ]
      }
    }
  }
}`,
    validation: ['Pipeline triggers on git push', 'CodeBuild runs all tests', 'CodeDeploy Blue/Green completes with no downtime', 'Canary deployment routes % traffic correctly'],
  },
  {
    title: 'Lab: Container Orchestration',
    description: 'Deploy containers with ECS Fargate, push images to ECR, explore EKS.',
    objectives: ['Containerize an app and push to ECR', 'Deploy to ECS Fargate with ALB', 'Explore EKS cluster with kubectl'],
    steps: [
      'Dockerize a web application. Create an ECR repository, authenticate, and push the image.',
      'Create an ECS task definition (512 CPU, 1024 MB, port 80). Deploy a Fargate service with 2 tasks behind an ALB.',
      'Create an EKS cluster using eksctl. Deploy the same application using kubectl.',
      'Configure auto-scaling: ECS Service Auto Scaling and K8s HPA.',
    ],
    template: `{
  "Resources": {
    "ECRRepository": {"Type": "AWS::ECR::Repository", "Properties": {"RepositoryName": "my-app", "ImageScanningConfiguration": {"ScanOnPush": true}}},
    "ECSCluster": {"Type": "AWS::ECS::Cluster"},
    "TaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Cpu": "512", "Memory": "1024",
        "ExecutionRoleArn": {"Ref": "ECSTaskExecutionRole"},
        "ContainerDefinitions": [{"Name": "my-app", "Image": "my-app:latest", "PortMappings": [{"ContainerPort": 80}]}]
      }
    },
    "ECSService": {"Type": "AWS::ECS::Service", "Properties": {"Cluster": {"Ref": "ECSCluster"}, "TaskDefinition": {"Ref": "TaskDefinition"}, "DesiredCount": 2, "LaunchType": "FARGATE"}}
  }
}`,
    validation: ['Docker image pushes and scans clean', 'Fargate tasks pass health checks', 'EKS cluster accessible via kubectl', 'Auto-scaling reacts to load changes'],
  },
  {
    title: 'Lab: Advanced Networking',
    description: 'Connect multiple VPCs via Transit Gateway, configure VPN and Global Accelerator.',
    objectives: ['Set up Transit Gateway with VPC attachments', 'Configure Site-to-Site VPN', 'Deploy Global Accelerator for multi-region traffic'],
    steps: [
      'Create a Transit Gateway. Create 2 VPCs and attach them to the TGW. Configure route tables for connectivity.',
      'Configure a Site-to-Site VPN connection between a simulated on-prem network and the VPC.',
      'Create a Global Accelerator with an ALB endpoint. Add a second ALB in another region as a failover endpoint.',
      'Test connectivity between VPCs through the Transit Gateway. Test failover by stopping the primary region.',
    ],
    template: `{
  "Resources": {
    "TransitGateway": {"Type": "AWS::EC2::TransitGateway", "Properties": {"Description": "Central hub"}},
    "TGWAttachment1": {"Type": "AWS::EC2::TransitGatewayAttachment", "Properties": {"TransitGatewayId": {"Ref": "TransitGateway"}, "VpcId": {"Ref": "VPC1"}, "SubnetIds": [{"Ref": "Subnet1"}]}},
    "GlobalAccelerator": {"Type": "AWS::GlobalAccelerator::Accelerator", "Properties": {"Name": "GlobalAccel", "Enabled": true}},
    "VPNConnection": {"Type": "AWS::EC2::VPNConnection", "Properties": {"Type": "ipsec.1", "CustomerGatewayId": {"Ref": "CGW"}, "TransitGatewayId": {"Ref": "TransitGateway"}}}
  }
}`,
    validation: ['VPCs can communicate via Transit Gateway', 'VPN tunnel status is UP', 'Global Accelerator endpoints pass health checks', 'Traffic fails over on region failure'],
  },
  {
    title: 'Lab: Cost Optimization & Governance',
    description: 'Use Cost Explorer, Trusted Advisor, Budgets, and enforce tagging with Config.',
    objectives: ['Analyze costs with Cost Explorer', 'Configure budgets with actions', 'Enforce tagging with AWS Config rules'],
    steps: [
      'Use Cost Explorer to filter costs by service for the last 3 months. Identify the top cost driver.',
      'Enable Trusted Advisor (full checks with Business/Enterprise support). Review security and cost optimization recommendations.',
      'Create a monthly cost budget of $100 with alerts at 50%, 80%, and 100%. Configure an action to stop non-critical EC2 at 100%.',
      'Create an AWS Config rule requiring Environment tag on all resources. Create a Lambda function that auto-tags non-compliant resources.',
    ],
    template: `{
  "Resources": {
    "MonthlyBudget": {
      "Type": "AWS::Budgets::Budget",
      "Properties": {
        "Budget": {"BudgetType": "COST", "TimeUnit": "MONTHLY", "BudgetLimit": {"Amount": 100, "Unit": "USD"}},
        "NotificationsWithSubscribers": [{
          "Notification": {"ComparisonOperator": "GREATER_THAN", "Threshold": 80, "ThresholdType": "PERCENTAGE", "NotificationType": "ACTUAL"},
          "Subscribers": [{"SubscriptionType": "EMAIL", "Address": "admin@example.com"}]
        }]
      }
    },
    "RequiredTagsRule": {
      "Type": "AWS::Config::ConfigRule",
      "Properties": {
        "Source": {"Owner": "AWS", "SourceIdentifier": "REQUIRED_TAGS"},
        "InputParameters": "{\\"tag1Key\\":\\"Environment\\",\\"tag2Key\\":\\"CostCenter\\"}"
      }
    }
  }
}`,
    validation: ['Cost Explorer shows top services by spend', 'Trusted Advisor identifies actionable recommendations', 'Budget alert fires at 80% threshold', 'Config rule flags untagged resources'],
  },
];


