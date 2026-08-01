// Tech Comparisons Data
// Each comparison includes radar dimensions, feature matrix, syntax examples, migration guide, and decision flow
window.techComparisons = [
  // ═══════════════════════════════════════════════════════════
  // 1. React vs Vue (Frontend Frameworks)
  // ═══════════════════════════════════════════════════════════
  {
    id: "react-vs-vue",
    category: "Frontend",
    techA: {
      name: "React",
      icon: "fa-brands fa-react",
      color: "#93c5fd",
      label: "React (Meta)",
    },
    techB: {
      name: "Vue",
      icon: "fa-brands fa-vuejs",
      color: "#a7f3d0",
      label: "Vue.js (Evan You)",
    },
    description:
      "Two of the most popular frontend frameworks. React uses a component-based architecture with JSX, while Vue offers a more template-based approach with a gentler learning curve.",
    dimensions: {
      learningCurve: { a: 3, b: 4 },
      performance: { a: 4, b: 4 },
      ecosystemSize: { a: 5, b: 3 },
      jobDemand: { a: 5, b: 3 },
      communitySupport: { a: 5, b: 4 },
      scalability: { a: 4, b: 3 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Virtual DOM", a: true, b: true, note: "Both use virtual DOM for efficient rendering" },
      { name: "JSX / Templates", a: true, b: false, note: "React uses JSX; Vue uses HTML templates with directives" },
      { name: "TypeScript Support", a: true, b: true, note: "Both have excellent TypeScript integration" },
      { name: "State Management (built-in)", a: false, b: true, note: "Vue has built-in reactivity; React needs external libs" },
      { name: "Server-Side Rendering", a: true, b: true, note: "Next.js for React, Nuxt for Vue" },
      { name: "Mobile Framework", a: true, b: true, note: "React Native vs NativeScript / Quasar" },
      { name: "Corporate Backing", a: true, b: false, note: "React backed by Meta; Vue is community-driven" },
      { name: "Learning Curve", a: false, b: true, note: "Vue is generally considered easier to start with" },
      { name: "Custom Hooks / Composables", a: true, b: true, note: "Hooks in React, Composables in Vue 3" },
    ],
    syntaxExamples: [
      {
        task: "Create a Counter Component",
        a: `// React Counter
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`,
        b: `// Vue Counter
<script setup>
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="count++">
      Increment
    </button>
  </div>
</template>`,
      },
      {
        task: "Fetch and Display Data",
        a: `// React Data Fetching
import { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}`,
        b: `// Vue Data Fetching
<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);

onMounted(async () => {
  const res = await fetch('/api/users');
  users.value = await res.json();
});
</script>

<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </ul>
</template>`,
      },
    ],
    migrationGuide: [
      {
        step: "Understand the Paradigm Shift",
        detail:
          "React uses JSX and functional programming patterns (hooks, immutability). Vue uses templates with directives (v-if, v-for) and a reactive data model. Start by comparing how state and rendering work in each.",
      },
      {
        step: "Component Mapping",
        detail:
          "Map each React component to a Vue SFC (Single File Component). React's useEffect becomes Vue's watchEffect or onMounted. useState becomes ref() or reactive().",
      },
      {
        step: "State Management Migration",
        detail:
          "If using Redux, migrate to Pinia (Vue's official state manager). Pinia follows a similar pattern to Redux Toolkit but integrates natively with Vue's reactivity system.",
      },
      {
        step: "Router & Build Tooling",
        detail:
          "React Router maps to Vue Router. Vite works with both. Webpack configs can be reused with minimal changes. If using Next.js, Nuxt 3 is the Vue equivalent.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your team's primary experience?",
        options: [
          { label: "JavaScript/React developers", result: "React — your team will be productive faster" },
          { label: "HTML/CSS designers", result: "Vue — template syntax feels natural to designers" },
          { label: "Mixed / new to frameworks", result: "Vue — gentler learning curve, better documentation" },
        ],
      },
      {
        question: "What type of application?",
        options: [
          { label: "Large enterprise SPA", result: "React — larger ecosystem, more tooling choices" },
          { label: "Rapid prototype / startup", result: "Vue — faster setup, less boilerplate" },
          { label: "Mobile app needed", result: "React — React Native is mature and widely adopted" },
        ],
      },
      {
        question: "How important is job market access?",
        options: [
          { label: "Very important", result: "React — more job listings globally" },
          { label: "Moderately important", result: "Either — both have strong demand" },
          { label: "Not a factor", result: "Vue — growing rapidly, great community" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 2. MongoDB vs PostgreSQL (Databases)
  // ═══════════════════════════════════════════════════════════
  {
    id: "mongodb-vs-postgresql",
    category: "Databases",
    techA: {
      name: "MongoDB",
      icon: "fa-solid fa-leaf",
      color: "#a7f3d0",
      label: "MongoDB (NoSQL)",
    },
    techB: {
      name: "PostgreSQL",
      icon: "fa-solid fa-database",
      color: "#93c5fd",
      label: "PostgreSQL (SQL)",
    },
    description:
      "MongoDB is a document-oriented NoSQL database offering flexible schemas, while PostgreSQL is a powerful relational database known for ACID compliance and advanced querying capabilities.",
    dimensions: {
      learningCurve: { a: 4, b: 3 },
      performance: { a: 4, b: 4 },
      ecosystemSize: { a: 4, b: 4 },
      jobDemand: { a: 4, b: 4 },
      communitySupport: { a: 4, b: 5 },
      scalability: { a: 5, b: 3 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Schema Flexibility", a: true, b: false, note: "MongoDB is schema-less; PostgreSQL requires defined schemas" },
      { name: "ACID Transactions", a: true, b: true, note: "Both support multi-document/row transactions" },
      { name: "JOIN Operations", a: false, b: true, note: "PostgreSQL has powerful JOINs; MongoDB uses $lookup" },
      { name: "Full-Text Search", a: true, b: true, note: "Both have built-in text search capabilities" },
      { name: "Geospatial Queries", a: true, b: true, note: "Both support geospatial indexing and queries" },
      { name: "JSON/JSONB Support", a: true, b: true, note: "PostgreSQL has excellent JSONB support" },
      { name: "Horizontal Scaling", a: true, b: false, note: "MongoDB native sharding; PostgreSQL needs extensions" },
      { name: "Mature ORMs", a: true, b: true, note: "Mongoose (Mongo), Sequelize/Prisma (Postgres)" },
      { name: "Open Source", a: true, b: true, note: "Both are open source with commercial options" },
    ],
    syntaxExamples: [
      {
        task: "Create a User Record",
        a: `// MongoDB - Insert
db.users.insertOne({
  name: "Alice",
  email: "alice@example.com",
  tags: ["developer", "admin"],
  profile: {
    age: 28,
    location: "NYC"
  }
});`,
        b: `-- PostgreSQL - Insert
INSERT INTO users (name, email, tags, profile)
VALUES (
  'Alice',
  'alice@example.com',
  ARRAY['developer', 'admin'],
  ROW(28, 'NYC')::profile_type
);`,
      },
      {
        task: "Query Users by Tag",
        a: `// MongoDB - Find by tag
db.users.find({
  tags: "developer"
}).sort({ name: 1 }).limit(10);`,
        b: `-- PostgreSQL - Find by tag
SELECT * FROM users
WHERE 'developer' = ANY(tags)
ORDER BY name ASC
LIMIT 10;`,
      },
    ],
    migrationGuide: [
      {
        step: "Schema Design Transformation",
        detail:
          "MongoDB's embedded documents become normalized tables in PostgreSQL. Identify one-to-many and many-to-many relationships. Use junction tables for many-to-many associations.",
      },
      {
        step: "Data Type Mapping",
        detail:
          "MongoDB ObjectId → UUID or SERIAL primary key. MongoDB arrays → PostgreSQL ARRAY type or separate tables. MongoDB embedded objects → JSONB columns or normalized tables.",
      },
      {
        step: "Query Translation",
        detail:
          "MongoDB's find() with projections becomes SELECT with specific columns. Aggregation pipelines become complex SQL queries with CTEs and window functions. Map $lookup to JOINs.",
      },
      {
        step: "Indexing Strategy",
        detail:
          "MongoDB's single-field, compound, and text indexes map directly. MongoDB's TTL indexes become pg_cron or application-level cleanup. Geospatial indexes work in both.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your data structure?",
        options: [
          { label: "Highly relational with complex joins", result: "PostgreSQL — relational model with strong JOIN support" },
          { label: "Flexible / rapidly evolving schema", result: "MongoDB — schema-less design adapts quickly" },
          { label: "Mixed / hybrid workloads", result: "PostgreSQL — JSONB offers best of both worlds" },
        ],
      },
      {
        question: "What's your scale requirement?",
        options: [
          { label: "Massive horizontal scale (100B+ docs)", result: "MongoDB — native sharding for horizontal scaling" },
          { label: "Moderate scale with consistency", result: "PostgreSQL — strong consistency, read replicas" },
          { label: "Small to medium application", result: "Either — both perform excellently at small scale" },
        ],
      },
      {
        question: "What's your team familiar with?",
        options: [
          { label: "SQL and relational modeling", result: "PostgreSQL — natural fit for SQL-skilled teams" },
          { label: "JavaScript/Node.js ecosystem", result: "MongoDB — JSON documents fit JS naturally" },
          { label: "Both equally", result: "PostgreSQL — more versatile long-term" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 3. REST vs GraphQL (API Design)
  // ═══════════════════════════════════════════════════════════
  {
    id: "rest-vs-graphql",
    category: "API Design",
    techA: {
      name: "REST",
      icon: "fa-solid fa-link",
      color: "#fde68a",
      label: "RESTful APIs",
    },
    techB: {
      name: "GraphQL",
      icon: "fa-solid fa-project-diagram",
      color: "#d8b4fe",
      label: "GraphQL APIs",
    },
    description:
      "REST uses multiple endpoints with fixed response structures, while GraphQL uses a single endpoint letting clients query exactly the data they need.",
    dimensions: {
      learningCurve: { a: 4, b: 2 },
      performance: { a: 3, b: 4 },
      ecosystemSize: { a: 5, b: 3 },
      jobDemand: { a: 5, b: 3 },
      communitySupport: { a: 5, b: 3 },
      scalability: { a: 4, b: 3 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Single Endpoint", a: false, b: true, note: "GraphQL uses one endpoint; REST uses multiple" },
      { name: "Caching (HTTP)", a: true, b: false, note: "REST leverages HTTP caching natively; GraphQL needs custom setup" },
      { name: "Over-fetching Prevention", a: false, b: true, note: "GraphQL lets clients specify exact fields needed" },
      { name: "File Upload", a: true, b: true, note: "Both support file uploads, REST is simpler" },
      { name: "Versioning", a: false, b: true, note: "GraphQL evolves without versioning; REST needs /v1, /v2" },
      { name: "Tooling Ecosystem", a: true, b: true, note: "Postman for REST, Apollo/GraphiQL for GraphQL" },
      { name: "Real-time / Subscriptions", a: false, b: true, note: "GraphQL has built-in subscriptions; REST needs WebSocket" },
      { name: "Maturity & Adoption", a: true, b: false, note: "REST is more widely adopted and battle-tested" },
      { name: "Type Safety", a: false, b: true, note: "GraphQL has a built-in type system (SDL)" },
    ],
    syntaxExamples: [
      {
        task: "Fetch User with Posts",
        a: `// REST - Multiple endpoints
GET /api/users/1
GET /api/users/1/posts

// Response (User):
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}

// Response (Posts):
[
  { "id": 101, "title": "Hello", "body": "..." },
  { "id": 102, "title": "World", "body": "..." }
]`,
        b: `# GraphQL - Single query
query {
  user(id: 1) {
    name
    email
    posts {
      id
      title
      body
    }
  }
}

# Response:
{
  "data": {
    "user": {
      "name": "Alice",
      "email": "alice@example.com",
      "posts": [
        { "id": 101, "title": "Hello", "body": "..." },
        { "id": 102, "title": "World", "body": "..." }
      ]
    }
  }
}`,
      },
      {
        task: "Create and Mutate Data",
        a: `// REST - POST request
POST /api/users
Content-Type: application/json

{
  "name": "Bob",
  "email": "bob@example.com"
}

// Response: 201 Created
{
  "id": 2,
  "name": "Bob",
  "email": "bob@example.com"
}`,
        b: `# GraphQL - Mutation
mutation {
  createUser(input: {
    name: "Bob",
    email: "bob@example.com"
  }) {
    id
    name
    email
  }
}

# Response:
{
  "data": {
    "createUser": {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com"
    }
  }
}`,
      },
    ],
    migrationGuide: [
      {
        step: "Define Your Schema First",
        detail:
          "Start by defining your GraphQL schema (SDL) based on your existing REST endpoints. Each REST resource becomes a GraphQL type. Each HTTP method (GET, POST, PUT, DELETE) becomes a query or mutation.",
      },
      {
        step: "Resolvers Map to Controllers",
        detail:
          "Your REST controllers become GraphQL resolvers. Each resolver function returns the data for a specific field or query. Reuse your existing business logic and data access layers.",
      },
      {
        step: "N+1 Problem Mitigation",
        detail:
          "Use DataLoader to batch and cache database queries. This solves the N+1 problem that often appears when migrating from REST's fixed response structure to GraphQL's nested queries.",
      },
      {
        step: "Gradual Rollout Strategy",
        detail:
          "Run REST and GraphQL side by side. Route new features through GraphQL while maintaining existing REST endpoints. Use Apollo Federation or schema stitching if migrating a microservice architecture.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your API complexity?",
        options: [
          { label: "Simple CRUD operations", result: "REST — straightforward, well-understood patterns" },
          { label: "Complex nested data requirements", result: "GraphQL — fetch related data in one request" },
          { label: "Mix of simple and complex", result: "GraphQL — handles both well with field selection" },
        ],
      },
      {
        question: "Who are your API consumers?",
        options: [
          { label: "Public 3rd-party developers", result: "REST — universal compatibility, easier caching" },
          { label: "Internal frontend team", result: "GraphQL — frontend controls data needs" },
          { label: "Mobile & web apps", result: "GraphQL — reduces over-fetching on mobile" },
        ],
      },
      {
        question: "What's your team's timeline?",
        options: [
          { label: "Need to ship fast", result: "REST — faster to set up, less tooling" },
          { label: "Investing in long-term DX", result: "GraphQL — better developer experience over time" },
          { label: "Already have REST APIs", result: "REST — unless you have specific over-fetching issues" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 4. Docker vs Podman (Containerization)
  // ═══════════════════════════════════════════════════════════
  {
    id: "docker-vs-podman",
    category: "DevOps",
    techA: {
      name: "Docker",
      icon: "fa-brands fa-docker",
      color: "#93c5fd",
      label: "Docker Engine",
    },
    techB: {
      name: "Podman",
      icon: "fa-solid fa-cube",
      color: "#fdba74",
      label: "Podman (Red Hat)",
    },
    description:
      "Docker is the industry standard container runtime with a daemon-based architecture. Podman is a daemonless, rootless alternative that is OCI-compliant and Docker-compatible.",
    dimensions: {
      learningCurve: { a: 4, b: 3 },
      performance: { a: 4, b: 4 },
      ecosystemSize: { a: 5, b: 2 },
      jobDemand: { a: 5, b: 2 },
      communitySupport: { a: 5, b: 3 },
      scalability: { a: 4, b: 4 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Daemon Architecture", a: true, b: false, note: "Docker uses a background daemon; Podman is daemonless" },
      { name: "Rootless Mode", a: true, b: true, note: "Both support rootless, but Podman is rootless by default" },
      { name: "Docker CLI Compatibility", a: true, b: true, note: "Podman aliases docker command; drop-in replacement" },
      { name: "Kubernetes YAML Generation", a: false, b: true, note: "Podman can generate K8s YAML from containers" },
      { name: "Pod Support", a: false, b: true, note: "Podman has native pod support (like K8s pods)" },
      { name: "Docker Compose", a: true, b: true, note: "Podman supports docker-compose via podman-compose" },
      { name: "Desktop GUI", a: true, b: true, note: "Docker Desktop; Podman Desktop (recent)" },
      { name: "OCI Compliant Images", a: true, b: true, note: "Both produce OCI-compliant container images" },
      { name: "Systemd Integration", a: false, b: true, note: "Podman integrates natively with systemd" },
    ],
    syntaxExamples: [
      {
        task: "Run a Container",
        a: `# Docker
docker run -d \\
  --name web \\
  -p 8080:80 \\
  -v ./app:/usr/share/nginx/html \\
  nginx:alpine

# View running containers
docker ps

# Stop and remove
docker stop web && docker rm web`,
        b: `# Podman
podman run -d \\
  --name web \\
  -p 8080:80 \\
  -v ./app:/usr/share/nginx/html \\
  nginx:alpine

# View running containers
podman ps

# Stop and remove
podman stop web && podman rm web`,
      },
      {
        task: "Build and Manage Images",
        a: `# Docker
docker build -t myapp:latest .

# List images
docker images

# Push to registry
docker push myapp:latest

# Remove old images
docker image prune -a`,
        b: `# Podman
podman build -t myapp:latest .

# List images
podman images

# Push to registry
podman push myapp:latest

# Remove old images
podman image prune -a`,
      },
    ],
    migrationGuide: [
      {
        step: "Alias docker to podman",
        detail:
          "Start by aliasing docker=podman in your shell. Most Docker commands work identically. Test your CI/CD pipelines with the alias before fully migrating.",
      },
      {
        step: "Rootless Volume Mounts",
        detail:
          "Podman runs rootless by default, which means volume mounts and port bindings may need --userns=keep-id. Update your docker-compose files or scripts accordingly.",
      },
      {
        step: "Systemd Container Management",
        detail:
          "Leverage Podman's systemd integration by generating systemd unit files with 'podman generate systemd'. This replaces docker restart policies with native Linux service management.",
      },
      {
        step: "Kubernetes Migration Path",
        detail:
          "Use 'podman generate kube' to create Kubernetes YAML from your running containers. This makes the transition from development containers to production Kubernetes seamless.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your security posture?",
        options: [
          { label: "Need rootless by default", result: "Podman — rootless architecture is a security advantage" },
          { label: "Standard enterprise setup", result: "Docker — battle-tested, extensive security tooling" },
          { label: "Running on shared infrastructure", result: "Podman — better multi-tenant isolation" },
        ],
      },
      {
        question: "What's your orchestration target?",
        options: [
          { label: "Kubernetes in production", result: "Podman — native K8s YAML generation" },
          { label: "Docker Swarm / Compose", result: "Docker — native Swarm support" },
          { label: "Both or undecided", result: "Podman — generates K8s YAML, works with Compose" },
        ],
      },
      {
        question: "What's your team's experience?",
        options: [
          { label: "Experienced Docker users", result: "Docker — no learning curve, massive ecosystem" },
          { label: "Linux sysadmins", result: "Podman — systemd integration, familiar patterns" },
          { label: "New to containers", result: "Docker — more tutorials, community resources" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 5. Express.js vs FastAPI (Backend Frameworks)
  // ═══════════════════════════════════════════════════════════
  {
    id: "express-vs-fastapi",
    category: "Backend",
    techA: {
      name: "Express.js",
      icon: "fa-solid fa-server",
      color: "#fecaca",
      label: "Express.js (Node.js)",
    },
    techB: {
      name: "FastAPI",
      icon: "fa-solid fa-bolt",
      color: "#99f6e4",
      label: "FastAPI (Python)",
    },
    description:
      "Express.js is the most popular Node.js web framework, known for its minimalism and extensive middleware ecosystem. FastAPI is a modern Python framework offering automatic OpenAPI docs and async support.",
    dimensions: {
      learningCurve: { a: 4, b: 3 },
      performance: { a: 3, b: 5 },
      ecosystemSize: { a: 5, b: 3 },
      jobDemand: { a: 4, b: 3 },
      communitySupport: { a: 5, b: 4 },
      scalability: { a: 3, b: 4 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Automatic API Docs", a: false, b: true, note: "FastAPI auto-generates OpenAPI/Swagger docs" },
      { name: "Async/Native Await", a: true, b: true, note: "Express 5 supports async; FastAPI is async-native" },
      { name: "Middleware Architecture", a: true, b: true, note: "Both have middleware/ dependency injection patterns" },
      { name: "Type Validation", a: false, b: true, note: "FastAPI uses Pydantic; Express needs Joi/Zod" },
      { name: "WebSocket Support", a: true, b: true, note: "Both support WebSockets (ws library / WebSocket)" },
      { name: "ORM Integration", a: true, b: true, note: "Express + Prisma/TypeORM; FastAPI + SQLAlchemy" },
      { name: "Background Tasks", a: false, b: true, note: "FastAPI has built-in BackgroundTasks" },
      { name: "GraphQL Integration", a: true, b: true, note: "Both via Apollo (Express) / Strawberry (FastAPI)" },
      { name: "Dependency Injection", a: false, b: true, note: "FastAPI has built-in DI system" },
    ],
    syntaxExamples: [
      {
        task: "Create a REST API Endpoint",
        a: `// Express.js API
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.findUser(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(3000);`,
        b: `# FastAPI API
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):
    id: int
    name: str
    email: str

@app.get("/api/users/{user_id}")
async def get_user(user_id: int):
    user = await db.find_user(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user`,
      },
      {
        task: "Request Validation Middleware",
        a: `// Express.js with Joi validation
const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(0).max(150)
});

function validateCreateUser(req, res, next) {
  const { error } = createUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  next();
}

app.post('/api/users',
  validateCreateUser,
  async (req, res) => {
    const user = await db.createUser(req.body);
    res.status(201).json(user);
  }
);`,
        b: `# FastAPI with Pydantic validation
from pydantic import BaseModel, Field
from typing import Optional

class CreateUser(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    email: str = Field(pattern=r"[^@]+@[^@]+\.[^@]+")
    age: Optional[int] = Field(ge=0, le=150)

@app.post("/api/users", status_code=201)
async def create_user(data: CreateUser):
    user = await db.create_user(data.model_dump())
    return user`,
      },
    ],
    migrationGuide: [
      {
        step: "Map Middleware to Dependencies",
        detail:
          "Express middleware chains become FastAPI dependencies. Each app.use() call maps to a Depends() in FastAPI. Authentication middleware maps naturally to reusable dependency functions.",
      },
      {
        step: "Route Handler Translation",
        detail:
          "Express route handlers (req, res, next) become async functions with type-annotated parameters in FastAPI. req.params becomes path parameters, req.query becomes query parameters, req.body becomes Pydantic models.",
      },
      {
        step: "Error Handling Migration",
        detail:
          "Express error-handling middleware (err, req, res, next) becomes FastAPI exception handlers. Replace res.status().json() with raise HTTPException() or return responses directly.",
      },
      {
        step: "Testing Strategy Update",
        detail:
          "Express supertest tests map to FastAPI's TestClient. Both follow similar patterns: make requests, assert responses. FastAPI's TestClient is built on httpx and supports async tests natively.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your primary language?",
        options: [
          { label: "JavaScript / TypeScript", result: "Express.js — natural fit for the JS ecosystem" },
          { label: "Python (data science background)", result: "FastAPI — Python-native, great for ML APIs" },
          { label: "Both equally", result: "FastAPI — better DX with auto-docs and validation" },
        ],
      },
      {
        question: "What matters more for your API?",
        options: [
          { label: "Maximum performance", result: "FastAPI — async-native, claims 2-3x faster" },
          { label: "Largest middleware ecosystem", result: "Express.js — npm has everything" },
          { label: "Built-in documentation", result: "FastAPI — automatic OpenAPI/Swagger UI" },
        ],
      },
      {
        question: "What's your team size?",
        options: [
          { label: "Small team / solo", result: "FastAPI — less boilerplate, auto-validation" },
          { label: "Large enterprise team", result: "Express.js — more familiar, easier to hire for" },
          { label: "Startup (moving fast)", result: "FastAPI — faster development turnaround" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 6. AWS vs Google Cloud (Cloud Providers)
  // ═══════════════════════════════════════════════════════════
  {
    id: "aws-vs-gcp",
    category: "Cloud",
    techA: {
      name: "AWS",
      icon: "fa-brands fa-aws",
      color: "#fdba74",
      label: "Amazon Web Services",
    },
    techB: {
      name: "GCP",
      icon: "fa-brands fa-google",
      color: "#93c5fd",
      label: "Google Cloud Platform",
    },
    description:
      "AWS is the market leader with the broadest service catalog and global infrastructure. GCP offers competitive advantages in data analytics, ML, and networking speed via Google's backbone.",
    dimensions: {
      learningCurve: { a: 2, b: 3 },
      performance: { a: 4, b: 4 },
      ecosystemSize: { a: 5, b: 3 },
      jobDemand: { a: 5, b: 3 },
      communitySupport: { a: 5, b: 3 },
      scalability: { a: 5, b: 4 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Global Data Centers", a: true, b: true, note: "AWS: 30+ regions; GCP: 30+ regions" },
      { name: "Kubernetes (Managed)", a: true, b: true, note: "EKS vs GKE (GKE is more mature)" },
      { name: "Serverless Functions", a: true, b: true, note: "Lambda vs Cloud Functions" },
      { name: "AI/ML Services", a: true, b: true, note: "SageMaker vs Vertex AI (GCP is stronger)" },
      { name: "Big Data / Analytics", a: true, b: true, note: "EMR vs BigQuery (BigQuery is faster)" },
      { name: "Free Tier", a: true, b: true, note: "Both offer generous free tiers for 12 months" },
      { name: "Multi-cloud Support", a: true, b: true, note: "Both have multi-cloud tools" },
      { name: "Pricing Model", a: false, b: true, note: "GCP offers simpler pricing and sustained-use discounts" },
      { name: "Certification Program", a: true, b: true, note: "AWS has more recognized certs" },
    ],
    syntaxExamples: [
      {
        task: "Deploy a Serverless Function",
        a: `# AWS Lambda (Serverless Framework)
service: hello-world

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get

# handler.js
exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from AWS Lambda!'
    })
  };
};`,
        b: `# GCP Cloud Functions
# main.py
import functions_framework

@functions_framework.http
def hello(request):
    """HTTP Cloud Function."""
    return {
        'message': 'Hello from GCP Cloud Functions!'
    }

# deploy.sh
gcloud functions deploy hello \\
  --runtime python312 \\
  --trigger-http \\
  --allow-unauthenticated \\
  --region us-central1`,
      },
      {
        task: "Provision a Virtual Machine",
        a: `# AWS EC2 via CLI
aws ec2 run-instances \\
  --image-id ami-0c55b159cbfafe1f0 \\
  --instance-type t3.micro \\
  --key-name my-key \\
  --security-group-ids sg-123 \\
  --subnet-id subnet-456

# Tag the instance
aws ec2 create-tags \\
  --resources i-123456789 \\
  --tags Key=Name,Value=WebServer`,
        b: `# GCP Compute Engine via CLI
gcloud compute instances create web-server \\
  --zone us-central1-a \\
  --machine-type e2-micro \\
  --image-family debian-12 \\
  --image-project debian-cloud \\
  --tags http-server

# SSH into instance
gcloud compute ssh web-server \\
  --zone us-central1-a`,
      },
    ],
    migrationGuide: [
      {
        step: "Service Mapping Discovery",
        detail:
          "Map each AWS service to its GCP equivalent: EC2 → Compute Engine, S3 → Cloud Storage, RDS → Cloud SQL, Lambda → Cloud Functions, EKS → GKE, Route53 → Cloud DNS, IAM → IAM, CloudWatch → Cloud Monitoring.",
      },
      {
        step: "IAM and Security Migration",
        detail:
          "AWS IAM roles/policies map to GCP IAM roles. AWS KMS → Cloud KMS. AWS Security Groups → VPC Firewall Rules. AWS WAF → Cloud Armor. Migrate least-privilege policies carefully.",
      },
      {
        step: "Networking Architecture",
        detail:
          "AWS VPC → GCP VPC (global, not regional). AWS ALB → Cloud Load Balancing (global). AWS Direct Connect → Cloud Interconnect. AWS Route53 → Cloud DNS. GCP's global VPC simplifies multi-region networking.",
      },
      {
        step: "Cost Optimization Migration",
        detail:
          "GCP offers sustained-use discounts (automatic, no commitment) and committed-use discounts (1/3 year). Use Google Cloud's Pricing Calculator to compare costs. Export billing data to BigQuery for analysis.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your organization size?",
        options: [
          { label: "Enterprise (500+ employees)", result: "AWS — more enterprise features, contracts, support tiers" },
          { label: "Startup / SMB", result: "GCP — simpler pricing, startup credits available" },
          { label: "Data-heavy / AI company", result: "GCP — BigQuery and Vertex AI are best-in-class" },
        ],
      },
      {
        question: "What's your primary workload?",
        options: [
          { label: "General web hosting / e-commerce", result: "AWS — broadest services, most tutorials" },
          { label: "Big data & analytics", result: "GCP — BigQuery, Dataflow, Dataproc" },
          { label: "Kubernetes-native applications", result: "GCP — GKE is the most mature managed K8s" },
        ],
      },
      {
        question: "What's your team's experience?",
        options: [
          { label: "Experienced AWS professionals", result: "AWS — leverage existing expertise" },
          { label: "Google ecosystem developers", result: "GCP — integrates well with G-Suite, Firebase" },
          { label: "New to cloud (starting fresh)", result: "GCP — simpler UX, better documentation" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 7. Next.js vs Nuxt (Meta-Frameworks)
  // ═══════════════════════════════════════════════════════════
  {
    id: "nextjs-vs-nuxt",
    category: "Frontend",
    techA: {
      name: "Next.js",
      icon: "fa-solid fa-arrow-right",
      color: "#fcfcfc",
      label: "Next.js (Vercel)",
    },
    techB: {
      name: "Nuxt",
      icon: "fa-solid fa-leaf",
      color: "#48bb78",
      label: "Nuxt (Nuxt Labs)",
    },
    description:
      "Next.js is the leading React meta-framework with hybrid rendering, while Nuxt is the Vue equivalent offering a similar philosophy with auto-imports and a module ecosystem. Both provide SSR, SSG, and ISR out of the box.",
    dimensions: {
      learningCurve: { a: 3, b: 4 },
      performance: { a: 4, b: 4 },
      ecosystemSize: { a: 5, b: 3 },
      jobDemand: { a: 5, b: 2 },
      communitySupport: { a: 5, b: 3 },
      scalability: { a: 4, b: 3 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Server-Side Rendering", a: true, b: true, note: "Both support SSR out of the box" },
      { name: "Static Site Generation", a: true, b: true, note: "Next.js getStaticProps; Nuxt generate + SSG" },
      { name: "Incremental Static Regeneration", a: true, b: false, note: "Next.js ISR; Nuxt uses SWR via nitro" },
      { name: "File-based Routing", a: true, b: true, note: "Both have file-system routing with dynamic routes" },
      { name: "API Routes / Server Routes", a: true, b: true, note: "Next.js API routes; Nuxt server routes via nitro" },
      { name: "App Router / Composition API", a: true, b: true, note: "Next.js App Router (RSC); Nuxt 3 uses Vue 3 Composition API" },
      { name: "Auto-imports", a: false, b: true, note: "Nuxt auto-imports components and composables; Next needs manual imports" },
      { name: "Image Optimization", a: true, b: true, note: "Next.js Image component; Nuxt Image module" },
      { name: "Middleware", a: true, b: true, note: "Both support middleware for route protection" },
    ],
    syntaxExamples: [
      {
        task: "Create a Page with SSR Data Fetching",
        a: `// Next.js App Router (app/page.tsx)
async function getPosts() {
  const res = await fetch('https://api.example.com/posts');
  return res.json();
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <main>
      <h1>Latest Posts</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.body}</p>
        </article>
      ))}
    </main>
  );
}`,
        b: `// Nuxt 3 (pages/index.vue)
<script setup>
const { data: posts } = await useFetch(
  'https://api.example.com/posts'
);
</script>

<template>
  <main>
    <h1>Latest Posts</h1>
    <article v-for="post in posts" :key="post.id">
      <h2>{{ post.title }}</h2>
      <p>{{ post.body }}</p>
    </article>
  </main>
</template>`,
      },
      {
        task: "Define Dynamic Routes",
        a: `// Next.js App Router
// app/posts/[slug]/page.tsx
export default async function PostPage({
  params
}: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}

// Generate static params
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({
    slug: post.slug
  }));
}`,
        b: `// Nuxt 3
// pages/posts/[slug].vue
<script setup>
const route = useRoute();
const { data: post } = await useFetch(
  \`/api/posts/\${route.params.slug}\`
);
</script>

<template>
  <article>
    <h1>{{ post.title }}</h1>
    <div>{{ post.content }}</div>
  </article>
</template>

// Generate static routes in nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/posts/hello', '/posts/world']
    }
  }
});`,
      },
    ],
    migrationGuide: [
      {
        step: "Map Routing Conventions",
        detail:
          "Next.js App Router (app/) and Pages Router (pages/) both map to Nuxt's pages/ directory. Dynamic routes [slug] in Next become [slug] in Nuxt. Next.js layout files (layout.tsx) map to Nuxt's layouts/ directory.",
      },
      {
        step: "Data Fetching Translation",
        detail:
          "Next.js getServerSideProps and getStaticProps become useFetch and useAsyncData in Nuxt 3. Next.js server components become Nuxt's <script setup> with async data fetching. React Query becomes Pinia or useFetch.",
      },
      {
        step: "API Routes Migration",
        detail:
          "Next.js API routes under pages/api/ become server routes under server/api/ in Nuxt 3 (powered by h3). Both support similar patterns: defineEventHandler vs export default handler. Middleware patterns are similar.",
      },
      {
        step: "Module & Plugin Ecosystem",
        detail:
          "Nuxt has a rich module system (Nuxt Auth, Nuxt Content, Nuxt Image, etc.) that replaces Next.js plugins and community packages. Pinia replaces Redux/Zustand for state management. Tailwind CSS works identically in both.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your frontend framework preference?",
        options: [
          { label: "React ecosystem", result: "Next.js — the standard React meta-framework" },
          { label: "Vue ecosystem", result: "Nuxt — purpose-built for Vue 3" },
          { label: "Neither / evaluating", result: "Next.js — larger ecosystem, more job opportunities" },
        ],
      },
      {
        question: "What matters more for your project?",
        options: [
          { label: "Mature ecosystem & plugins", result: "Next.js — more third-party libraries and examples" },
          { label: "Developer experience & conventions", result: "Nuxt — auto-imports, better defaults, less config" },
          { label: "Performance & bundle size", result: "Nuxt — smaller client bundles, tree-shaking built-in" },
        ],
      },
      {
        question: "Who's hosting your app?",
        options: [
          { label: "Vercel", result: "Next.js — first-class support on Vercel" },
          { label: "Cloudflare / Netlify", result: "Nuxt — nitro adapter supports many providers" },
          { label: "Self-hosted / Node server", result: "Either — both support Node.js deployment" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 8. Redis vs Memcached (Caching)
  // ═══════════════════════════════════════════════════════════
  {
    id: "redis-vs-memcached",
    category: "Databases",
    techA: {
      name: "Redis",
      icon: "fa-solid fa-bolt",
      color: "#ff6b6b",
      label: "Redis (in-memory data store)",
    },
    techB: {
      name: "Memcached",
      icon: "fa-solid fa-memory",
      color: "#63b3ed",
      label: "Memcached (distributed cache)",
    },
    description:
      "Redis is a powerful in-memory data store with support for data structures, persistence, and pub/sub. Memcached is a simpler, purely distributed memory caching system focused on simplicity and raw speed for key-value lookups.",
    dimensions: {
      learningCurve: { a: 3, b: 5 },
      performance: { a: 4, b: 5 },
      ecosystemSize: { a: 5, b: 2 },
      jobDemand: { a: 5, b: 2 },
      communitySupport: { a: 5, b: 2 },
      scalability: { a: 4, b: 3 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Data Structures", a: true, b: false, note: "Redis has strings, lists, sets, hashes, sorted sets, streams, geospatial" },
      { name: "Key Expiration (TTL)", a: true, b: true, note: "Both support time-based key expiration" },
      { name: "Persistence (Disk)", a: true, b: false, note: "Redis has RDB snapshots and AOF logs; Memcached is volatile only" },
      { name: "Pub/Sub Messaging", a: true, b: false, note: "Redis has built-in pub/sub; Memcached does not" },
      { name: "Lua Scripting", a: true, b: false, note: "Redis supports server-side Lua scripting" },
      { name: "Multi-threading", a: false, b: true, note: "Memcached uses multi-threading; Redis is single-threaded" },
      { name: "Clustering", a: true, b: true, note: "Redis Cluster vs Memcached distributed client-side sharding" },
      { name: "LRU Eviction", a: true, b: true, note: "Both support LRU and other eviction policies" },
      { name: "Transactions", a: true, b: false, note: "Redis supports multi/exec transactions" },
    ],
    syntaxExamples: [
      {
        task: "Set and Get Cache Values",
        a: `// Redis CLI
> SET user:123:profile '{"name":"Alice","role":"admin"}'
OK
> GET user:123:profile
"{\\"name\\":\\"Alice\\",\\"role\\":\\"admin\\"}"

// With expiration (5 minutes)
> SETEX user:123:profile 300 '{"name":"Alice"}'
OK

// Check TTL
> TTL user:123:profile
(integer) 287`,
        b: `// Memcached CLI
> set user:123:profile 0 300 24
STORED
> get user:123:profile
VALUE user:123:profile 0 24
{"name":"Alice","role":"admin"}
END

// Multiple keys
> get user:123:profile user:456:profile
VALUE user:123:profile 0 24
{"name":"Alice"}
VALUE user:456:profile 0 22
{"name":"Bob"}
END`,
      },
      {
        task: "Work with Complex Data Structures",
        a: `// Redis - List operations
> LPUSH tasks:queue "process-payment"
> LPUSH tasks:queue "send-email"
> LRANGE tasks:queue 0 -1
1) "send-email"
2) "process-payment"

// Redis - Sorted set (leaderboard)
> ZADD leaderboard 100 "player1"
> ZADD leaderboard 85 "player2"
> ZREVRANGE leaderboard 0 2 WITHSCORES
1) "player1"
2) "100"
3) "player2"
4) "85"`,
        b: `// Memcached - Simple key-value only
// Memcached does not support lists, sorted sets,
// or any data structures beyond string values.
// Complex structures must be serialized manually.

> set tasks:queue 0 0 52
["process-payment","send-email"]
STORED
> get tasks:queue
VALUE tasks:queue 0 52
["process-payment","send-email"]
END`,
      },
    ],
    migrationGuide: [
      {
        step: "Identify Data Structure Usage",
        detail:
          "If you use Redis lists, sets, sorted sets, hashes, or streams, those need to be serialized to strings for Memcached. For simple key-value caching with TTL, the migration is straightforward — both use similar get/set patterns.",
      },
      {
        step: "Adapt to Multi-threading Model",
        detail:
          "Memcached is multi-threaded so you can scale within a single node. Redis is single-threaded but uses non-blocking I/O. Connection pooling strategies may need adjustment. Redis pipelining has no direct Memcached equivalent.",
      },
      {
        step: "Handle Missing Features",
        detail:
          "Replace Redis pub/sub with a message broker (RabbitMQ, Kafka). Replace Redis persistence with a separate database for durable storage. Replace Lua scripts with application-level logic. Replace transactions with atomic operations.",
      },
      {
        step: "Update Eviction Strategy",
        detail:
          "Both support LRU eviction, but Memcached defaults to LRU while Redis offers multiple policies (volatile-lru, allkeys-lru, volatile-ttl, noeviction). Review your eviction requirements and set Memcached's memory limits accordingly.",
      },
    ],
    decisionFlow: [
      {
        question: "What do you need beyond key-value caching?",
        options: [
          { label: "Just simple key-value caching", result: "Memcached — simpler, faster for basic caching" },
          { label: "Data structures & persistence", result: "Redis — lists, sets, sorted sets, persistence" },
          { label: "Pub/sub & message queue", result: "Redis — has built-in pub/sub and stream support" },
        ],
      },
      {
        question: "What's your performance requirement?",
        options: [
          { label: "Maximum raw throughput", result: "Memcached — multi-threaded, lower latency for simple lookups" },
          { label: "Best overall capability", result: "Redis — slightly slower but massively more capable" },
          { label: "Both speed and features", result: "Redis — performant enough with much richer feature set" },
        ],
      },
      {
        question: "What's your operational preference?",
        options: [
          { label: "Simple, minimal maintenance", result: "Memcached — virtually zero configuration needed" },
          { label: "Feature-rich with management tools", result: "Redis — Redis CLI, RedisInsight, redis-cli" },
          { label: "Need clustering & high availability", result: "Redis — Redis Cluster, Sentinel for production HA" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 9. Tailwind CSS vs Bootstrap (CSS Frameworks)
  // ═══════════════════════════════════════════════════════════
  {
    id: "tailwind-vs-bootstrap",
    category: "Frontend",
    techA: {
      name: "Tailwind",
      icon: "fa-solid fa-wind",
      color: "#38bdf8",
      label: "Tailwind CSS (utility-first)",
    },
    techB: {
      name: "Bootstrap",
      icon: "fa-brands fa-bootstrap",
      color: "#7c3aed",
      label: "Bootstrap (component library)",
    },
    description:
      "Tailwind CSS is a utility-first framework that provides low-level utility classes for building custom designs. Bootstrap is a mature component library with pre-built components, offering rapid prototyping out of the box.",
    dimensions: {
      learningCurve: { a: 2, b: 4 },
      performance: { a: 4, b: 3 },
      ecosystemSize: { a: 5, b: 5 },
      jobDemand: { a: 4, b: 4 },
      communitySupport: { a: 5, b: 5 },
      scalability: { a: 4, b: 3 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Pre-built Components", a: false, b: true, note: "Bootstrap ships with modals, navbars, carousels, etc.; Tailwind has none" },
      { name: "Utility-first Approach", a: true, b: false, note: "Tailwind is utility-first; Bootstrap uses semantic classes" },
      { name: "Customization", a: true, b: true, note: "Tailwind config vs Bootstrap SASS variables" },
      { name: "Responsive Design", a: true, b: true, note: "Both have responsive breakpoints built in" },
      { name: "Bundle Size (minimal)", a: true, b: false, note: "Tailwind purges unused CSS; Bootstrap ships all components" },
      { name: "Design Consistency", a: true, b: true, note: "Both promote consistent design through their systems" },
      { name: "JavaScript Components", a: false, b: true, note: "Bootstrap includes JS plugins (dropdowns, toasts, etc.)" },
      { name: "Dark Mode", a: true, b: true, note: "Both support dark mode (Tailwind: class-based; Bootstrap 5.3: built-in)" },
      { name: "Rapid Prototyping", a: false, b: true, note: "Bootstrap is faster for prototyping with pre-built components" },
    ],
    syntaxExamples: [
      {
        task: "Create a Card Component",
        a: `<!-- Tailwind CSS Card -->
<div class="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white">
  <img class="w-full h-48 object-cover"
       src="photo.jpg" alt="Card image">
  <div class="px-6 py-4">
    <h3 class="font-bold text-xl mb-2 text-gray-800">
      Card Title
    </h3>
    <p class="text-gray-600 text-base">
      This is a card description using
      Tailwind utility classes directly
      in the markup.
    </p>
  </div>
  <div class="px-6 pt-4 pb-2">
    <span class="inline-block bg-gray-200
      rounded-full px-3 py-1 text-sm
      font-semibold text-gray-700 mr-2">
      #tag
    </span>
  </div>
</div>`,
        b: `<!-- Bootstrap Card -->
<div class="card" style="width: 24rem;">
  <img src="photo.jpg" class="card-img-top"
       alt="Card image">
  <div class="card-body">
    <h5 class="card-title">Card Title</h5>
    <p class="card-text">
      This is a card description using
      Bootstrap's pre-built card component
      with semantic classes.
    </p>
    <a href="#" class="btn btn-primary">
      Go somewhere
    </a>
  </div>
  <div class="card-footer text-muted">
    <span class="badge bg-secondary">#tag</span>
  </div>
</div>`,
      },
      {
        task: "Build a Responsive Navbar",
        a: `<!-- Tailwind Navbar -->
<nav class="bg-white shadow-lg">
  <div class="max-w-6xl mx-auto px-4">
    <div class="flex justify-between items-center h-16">
      <div class="flex items-center space-x-8">
        <a href="#" class="text-xl font-bold
          text-gray-800">Brand</a>
        <div class="hidden md:flex space-x-4">
          <a href="#" class="text-gray-600
            hover:text-gray-900">Home</a>
          <a href="#" class="text-gray-600
            hover:text-gray-900">About</a>
        </div>
      </div>
      <button class="md:hidden">
        <svg class="w-6 h-6" fill="none"
             stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>
  </div>
</nav>`,
        b: `<!-- Bootstrap Navbar -->
<nav class="navbar navbar-expand-lg
     navbar-light bg-light shadow-sm">
  <div class="container">
    <a class="navbar-brand" href="#">Brand</a>
    <button class="navbar-toggler" type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse"
         id="navbarNav">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item">
          <a class="nav-link active" href="#">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">About</a>
        </li>
      </ul>
    </div>
  </div>
</nav>`,
      },
    ],
    migrationGuide: [
      {
        step: "Understand the Paradigm Shift",
        detail:
          "Moving from Bootstrap to Tailwind means shifting from semantic class names (card, btn, nav) to utility classes (flex, p-4, rounded-lg). This is the biggest mental model change. Start by rebuilding small components with utilities.",
      },
      {
        step: "Component Replacement Strategy",
        detail:
          "Bootstrap's pre-built components (modals, carousels, navbars) have no direct Tailwind equivalents. Use Tailwind UI, Headless UI, or Flowbite for component patterns. Alternatively, build custom components using Tailwind utilities.",
      },
      {
        step: "Customization Migration",
        detail:
          "Bootstrap SASS variable overrides become tailwind.config.js theme extensions. Map Bootstrap's $primary, $secondary colors to Tailwind's color palette. Bootstrap's spacing scale (1-5) maps to Tailwind's spacing scale (1-96).",
      },
      {
        step: "JavaScript Plugin Handling",
        detail:
          "Bootstrap's JS plugins (dropdown, modal, toast) need replacement. Options include: vanilla JavaScript, Alpine.js (works great with Tailwind), Headless UI (React/Vue), or Bootstrap JS can be used alongside Tailwind CSS.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your design philosophy?",
        options: [
          { label: "Custom, unique designs", result: "Tailwind — utility classes give total design freedom" },
          { label: "Standard, consistent UIs", result: "Bootstrap — pre-built components look great out of the box" },
          { label: "Mix of both", result: "Tailwind — can replicate Bootstrap looks with custom utilities" },
        ],
      },
      {
        question: "What's your project timeline?",
        options: [
          { label: "Prototype in hours", result: "Bootstrap — components mean instant layout" },
          { label: "Production app with custom design", result: "Tailwind — more effort upfront, more unique result" },
          { label: "Long-term maintenance", result: "Tailwind — easier to maintain consistent design system" },
        ],
      },
      {
        question: "What's your team's CSS experience?",
        options: [
          { label: "Designers who write CSS", result: "Tailwind — direct control, designers understand utilities" },
          { label: "Developers who want speed", result: "Bootstrap — less CSS knowledge needed to get started" },
          { label: "Full-stack devs solo-building", result: "Bootstrap — faster output with pre-built components" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 10. Prisma vs TypeORM (ORM / Database Tools)
  // ═══════════════════════════════════════════════════════════
  {
    id: "prisma-vs-typeorm",
    category: "Backend",
    techA: {
      name: "Prisma",
      icon: "fa-solid fa-database",
      color: "#38bdf8",
      label: "Prisma (next-gen ORM)",
    },
    techB: {
      name: "TypeORM",
      icon: "fa-solid fa-cubes",
      color: "#f97316",
      label: "TypeORM (traditional ORM)",
    },
    description:
      "Prisma is a modern, type-safe ORM with an auto-generated query builder and declarative schema. TypeORM is a mature traditional ORM with a Data Mapper pattern, active record support, and deep TypeScript decorator integration.",
    dimensions: {
      learningCurve: { a: 4, b: 3 },
      performance: { a: 4, b: 3 },
      ecosystemSize: { a: 4, b: 4 },
      jobDemand: { a: 4, b: 3 },
      communitySupport: { a: 4, b: 4 },
      scalability: { a: 4, b: 3 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Type Safety", a: true, b: true, note: "Prisma generates types from schema; TypeORM uses decorators" },
      { name: "Auto-generated Query Builder", a: true, b: false, note: "Prisma generates a fully typed client; TypeORM uses Repository pattern" },
      { name: "Migration System", a: true, b: true, note: "Both have CLI migration tools (prisma migrate vs typeorm migration)" },
      { name: "Schema First vs Code First", a: false, b: true, note: "Prisma is schema-first; TypeORM supports both code-first and schema-first" },
      { name: "Relation Handling", a: true, b: true, note: "Both support one-to-one, one-to-many, many-to-many relations" },
      { name: "Eager / Lazy Loading", a: true, b: true, note: "Prisma uses include/select; TypeORM uses relations and lazy properties" },
      { name: "Raw Queries", a: true, b: true, note: "Both support raw SQL fallback for complex queries" },
      { name: "MongoDB Support", a: true, b: true, note: "Prisma supports MongoDB; TypeORM via mongodb driver" },
      { name: "Edge Runtime Support", a: true, b: false, note: "Prisma works with Edge (Cloudflare, Vercel Edge); TypeORM is Node-only" },
    ],
    syntaxExamples: [
      {
        task: "Define a User Model and Query",
        a: `// Prisma (schema.prisma)
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}

// Query with Prisma Client
const user = await prisma.user.findUnique({
  where: { email: "alice@example.com" },
  include: {
    posts: {
      select: { title: true, createdAt: true }
    }
  }
});`,
        b: `// TypeORM (entities/User.ts)
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  content: string;

  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;
}

// Query with Repository
const user = await userRepo.findOne({
  where: { email: "alice@example.com" },
  relations: {
    posts: true
  }
});`,
      },
      {
        task: "Create and Update with Relations",
        a: `// Prisma - Create post with author
const post = await prisma.post.create({
  data: {
    title: "Hello World",
    content: "My first post",
    author: {
      connect: { id: 1 }
    }
  }
});

// Update with nested write
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: "Alice Smith",
    posts: {
      create: { title: "New post" }
    }
  }
});`,
        b: `// TypeORM - Create post with author
const post = new Post();
post.title = "Hello World";
post.content = "My first post";
post.author = { id: 1 } as User;
await postRepo.save(post);

// Update with new post
const user = await userRepo.findOne({
  where: { id: 1 },
  relations: { posts: true }
});
user.name = "Alice Smith";
user.posts.push(
  postRepo.create({ title: "New post" })
);
await userRepo.save(user);`,
      },
    ],
    migrationGuide: [
      {
        step: "Schema Translation",
        detail:
          "TypeORM entity decorators become Prisma schema models. Each @Entity() maps to 'model' in schema.prisma. @Column() types translate to Prisma types (varchar → String, int → Int, boolean → Boolean). @PrimaryGeneratedColumn() becomes @id @default(autoincrement()).",
      },
      {
        step: "Relation Mapping",
        detail:
          "TypeORM @ManyToOne / @OneToMany become Prisma relations with @relation() directive. @JoinColumn() mappings become explicit fields (authorId) in Prisma. Eager loading in TypeORM becomes Prisma's include option.",
      },
      {
        step: "Query Translation",
        detail:
          "Repository pattern (find, findOne, save) becomes Prisma Client methods (findMany, findUnique, create, update). TypeORM's QueryBuilder becomes Prisma's filter chain (where, orderBy, include, select). Raw queries remain similar.",
      },
      {
        step: "Migration & Workflow Changes",
        detail:
          "TypeORM's synchronize: true for dev becomes prisma db push. typeorm migration:generate becomes prisma migrate dev. TypeORM migration files are editable SQL; Prisma migrations are auto-generated. Prisma Studio replaces TypeORM's CLI for data browsing.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your priority?",
        options: [
          { label: "Type safety & DX", result: "Prisma — auto-generated types, excellent autocomplete" },
          { label: "Traditional ORM patterns", result: "TypeORM — familiar Repository/Active Record patterns" },
          { label: "Learning something new", result: "Prisma — modern approach, growing rapidly" },
        ],
      },
      {
        question: "What's your database?",
        options: [
          { label: "PostgreSQL / MySQL / SQLite", result: "Both — both support all major relational databases" },
          { label: "MongoDB (NoSQL)", result: "Prisma — better MongoDB integration with Prisma 5+" },
          { label: "Edge / Serverless DB", result: "Prisma — works with PlanetScale, Neon, Cloudflare D1" },
        ],
      },
      {
        question: "What framework are you using?",
        options: [
          { label: "NestJS", result: "TypeORM — first-class NestJS integration, deeply integrated" },
          { label: "Next.js / Remix", result: "Prisma — better edge support, smaller bundle impact" },
          { label: "Express / plain Node", result: "Either — both work well; Prisma has better docs" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 11. npm vs yarn vs pnpm (Package Managers)
  // ═══════════════════════════════════════════════════════════
  {
    id: "npm-vs-yarn-pnpm",
    category: "DevOps",
    techA: {
      name: "npm",
      icon: "fa-brands fa-npm",
      color: "#cc3534",
      label: "npm (Node package manager)",
    },
    techB: {
      name: "yarn/pnpm",
      icon: "fa-solid fa-boxes",
      color: "#2c8eec",
      label: "Yarn / pnpm (alternatives)",
    },
    description:
      "npm is the default Node.js package manager with the largest registry. Yarn and pnpm are alternative clients offering faster installs, disk efficiency, and advanced features like workspaces and plug'n'play.",
    dimensions: {
      learningCurve: { a: 5, b: 4 },
      performance: { a: 3, b: 5 },
      ecosystemSize: { a: 5, b: 3 },
      jobDemand: { a: 5, b: 2 },
      communitySupport: { a: 5, b: 3 },
      scalability: { a: 3, b: 5 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Install Speed", a: false, b: true, note: "pnpm/yarn are 2-3x faster than npm for installs" },
      { name: "Disk Space Efficiency", a: false, b: true, note: "pnpm uses content-addressable storage; npm copies per project" },
      { name: "Workspaces (Monorepo)", a: true, b: true, note: "npm workspaces, yarn workspaces, pnpm workspaces" },
      { name: "Offline Cache", a: true, b: true, note: "All three cache downloaded packages for offline installs" },
      { name: "Lockfile Format", a: false, b: true, note: "Yarn/pnpm lockfiles are more deterministic than npm's" },
      { name: "Plug'n'Play (PnP)", a: false, b: true, note: "Yarn PnP eliminates node_modules entirely; pnpm uses strict linking" },
      { name: "Security (Integrity Check)", a: true, b: true, note: "All support integrity verification (npm audit, yarn audit, pnpm audit)" },
      { name: "Script Execution", a: true, b: true, note: "All support lifecycle scripts (pre/post) with subtle differences" },
      { name: "Registry Compatibility", a: true, b: true, note: "All use the npm registry; npm has native GitHub Packages support" },
    ],
    syntaxExamples: [
      {
        task: "Initialize and Install Dependencies",
        a: `# npm
npm init -y
npm install express
npm install -D typescript
npm install react@18

# Update all packages
npm update

# Run script
npm run dev

# Install globally
npm install -g typescript`,
        b: `# Yarn
yarn init -y
yarn add express
yarn add -D typescript
yarn add react@18

# pnpm
pnpm init
pnpm add express
pnpm add -D typescript
pnpm add react@18

# Update all packages (both)
yarn upgrade
pnpm update

# Run script
yarn dev
pnpm dev

# Install globally
yarn global add typescript
pnpm add -g typescript`,
      },
      {
        task: "Workspace / Monorepo Setup",
        a: `// npm workspaces (package.json)
{
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev -w packages/web -w packages/api"
  }
}

// npm workspace commands
npm run test -w packages/web
npm install react -w packages/web --workspace`,
        b: `# pnpm workspace (pnpm-workspace.yaml)
packages:
  - 'packages/*'
  - 'apps/*'

# pnpm workspace commands
pnpm --filter packages/web add react
pnpm --filter packages/api add express
pnpm -r run build

# Yarn berry workspace
yarn workspaces foreach \\
  --include packages/* \\
  run build`,
      },
    ],
    migrationGuide: [
      {
        step: "Lockfile and Cache Migration",
        detail:
          "npm's package-lock.json must be replaced. Yarn generates yarn.lock; pnpm generates pnpm-lock.yaml. Delete node_modules and the old lockfile, then run 'yarn install' or 'pnpm install' to generate the new lockfile. The cache will be rebuilt automatically.",
      },
      {
        step: "Script Compatibility Check",
        detail:
          "Most npm scripts run identically in yarn and pnpm. However, npx commands need translation: yarn dlx, pnpm dlx. Environment variables like npm_package_name need to be checked. PRE and POST lifecycle scripts work similarly across all three.",
      },
      {
        step: "Workspace Configuration",
        detail:
          "npm workspaces defined in package.json translate directly. Yarn uses workspace: protocol for cross-references (workspace:^1.0.0). pnpm uses workspace: protocol and pnpm-workspace.yaml. All three support similar filtering, but syntax differs.",
      },
      {
        step: "CI/CD Pipeline Updates",
        detail:
          "Update CI config to use the new package manager. For pnpm, add 'pnpm install --frozen-lockfile' (equivalent to npm ci). For yarn, use 'yarn install --immutable'. Consider using corepack to manage the package manager version across the team.",
      },
    ],
    decisionFlow: [
      {
        question: "What matters most for your project?",
        options: [
          { label: "Zero config, works everywhere", result: "npm — pre-installed with Node, no setup needed" },
          { label: "Speed & disk efficiency", result: "pnpm — fastest installs, best disk usage" },
          { label: "Monorepo management", result: "pnpm — best workspace implementation with strict isolation" },
        ],
      },
      {
        question: "What's your team size?",
        options: [
          { label: "Solo developer / small team", result: "npm — simple, everyone knows it" },
          { label: "Medium team (5-20 devs)", result: "pnpm — deterministic installs prevent 'works on my machine'" },
          { label: "Large enterprise monorepo", result: "pnpm — strict dependency isolation prevents missing deps" },
        ],
      },
      {
        question: "What's your CI/CD budget?",
        options: [
          { label: "Limited CI time/money", result: "pnpm — faster installs save CI minutes and costs" },
          { label: "Generous CI resources", result: "npm — works fine with adequate CI power" },
          { label: "Want reproducible builds", result: "Yarn Berry — PnP ensures identical node_modules everywhere" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 12. RabbitMQ vs Kafka (Message Brokers / Event Streaming)
  // ═══════════════════════════════════════════════════════════
  {
    id: "rabbitmq-vs-kafka",
    category: "Backend",
    techA: {
      name: "RabbitMQ",
      icon: "fa-solid fa-right-left",
      color: "#ff6600",
      label: "RabbitMQ (message broker)",
    },
    techB: {
      name: "Kafka",
      icon: "fa-solid fa-stream",
      color: "#0a66c2",
      label: "Apache Kafka (event streaming)",
    },
    description:
      "RabbitMQ is a battle-tested message broker focused on routing, queuing, and reliable delivery. Kafka is a distributed event streaming platform designed for high-throughput, durable, replayable event logs.",
    dimensions: {
      learningCurve: { a: 4, b: 2 },
      performance: { a: 3, b: 5 },
      ecosystemSize: { a: 4, b: 4 },
      jobDemand: { a: 4, b: 4 },
      communitySupport: { a: 4, b: 4 },
      scalability: { a: 3, b: 5 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Routing Flexibility", a: true, b: false, note: "RabbitMQ: direct, topic, fanout, headers exchanges; Kafka: topic-based only" },
      { name: "Message Ordering", a: false, b: true, note: "Kafka guarantees partition-level ordering; RabbitMQ ordering is best-effort" },
      { name: "Message Retention", a: false, b: true, note: "Kafka persists messages to disk with configurable retention; RabbitMQ dequeues on ack" },
      { name: "Throughput", a: false, b: true, note: "Kafka handles millions of messages/sec; RabbitMQ is optimized for lower throughput" },
      { name: "Delivery Guarantees", a: true, b: true, note: "Both support at-most-once, at-least-once, and exactly-once semantics" },
      { name: "Consumer Groups", a: true, b: true, note: "Both support competing consumers pattern" },
      { name: "Protocol Support", a: true, b: false, note: "RabbitMQ supports AMQP, MQTT, STOMP; Kafka uses its own binary protocol" },
      { name: "Stream Processing", a: false, b: true, note: "Kafka Streams and ksqlDB for stream processing; RabbitMQ needs external tools" },
      { name: "Management UI", a: true, b: true, note: "Both have web-based management interfaces" },
    ],
    syntaxExamples: [
      {
        task: "Publish and Consume a Message",
        a: `// RabbitMQ (amqplib)
const amqp = require('amqplib');

async function publish() {
  const conn = await amqp.connect('amqp://localhost');
  const ch = await conn.createChannel();

  await ch.assertQueue('tasks', { durable: true });
  ch.sendToQueue('tasks',
    Buffer.from(JSON.stringify({
      task: 'process-payment',
      amount: 100
    })),
    { persistent: true }
  );

  await ch.close();
}

async function consume() {
  const conn = await amqp.connect('amqp://localhost');
  const ch = await conn.createChannel();

  await ch.assertQueue('tasks', { durable: true });
  ch.consume('tasks', (msg) => {
    const data = JSON.parse(msg.content.toString());
    console.log('Processing:', data);
    ch.ack(msg); // Acknowledge
  });
}`,
        b: `// Kafka (kafkajs)
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

async function publish() {
  const producer = kafka.producer();
  await producer.connect();

  await producer.send({
    topic: 'tasks',
    messages: [{
      key: 'payment-1',
      value: JSON.stringify({
        task: 'process-payment',
        amount: 100
      })
    }]
  });

  await producer.disconnect();
}

async function consume() {
  const consumer = kafka.consumer({
    groupId: 'payment-group'
  });
  await consumer.connect();
  await consumer.subscribe({
    topic: 'tasks',
    fromBeginning: true
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('Processing:', JSON.parse(message.value));
    }
  });
}`,
      },
      {
        task: "Topic / Exchange Routing Patterns",
        a: `// RabbitMQ - Topic Exchange
const ch = await conn.createChannel();

await ch.assertExchange('logs', 'topic');

// Publish with routing key
ch.publish('logs',
  'app.payments.success',
  Buffer.from('Payment completed')
);

// Bind queues with patterns
await ch.assertQueue('payment-queue');
await ch.bindQueue('payment-queue',
  'logs', 'app.payments.*'
);

await ch.assertQueue('all-logs');
await ch.bindQueue('all-logs',
  'logs', 'app.#'
);`,
        b: `// Kafka - Topics and Partitions
const admin = kafka.admin();

// Create topic with partitions
await admin.createTopics({
  topics: [{
    topic: 'app-logs',
    numPartitions: 3,
    replicationFactor: 2
  }]
});

// Consumer subscribes with regex
await consumer.subscribe({
  topic: /app\\..*/,
  fromBeginning: false
});

// Kafka routing is simpler:
// - Partition by key (hash)
// - Consumer groups for parallelism
// - No exchange/queue/binding concept`,
      },
    ],
    migrationGuide: [
      {
        step: "Conceptual Model Translation",
        detail:
          "RabbitMQ exchanges/queues/bindings become Kafka topics/partitions/consumer groups. Each RabbitMQ routing key becomes a Kafka topic (or topic pattern). RabbitMQ's push-based delivery becomes Kafka's pull-based consumption with offset tracking.",
      },
      {
        step: "Message Lifecycle Adaptation",
        detail:
          "RabbitMQ messages are removed after acknowledgment. Kafka messages persist based on retention policy (time/size). Implement idempotent consumers to handle replays. Remove ack/nack patterns — use consumer offset commits instead.",
      },
      {
        step: "Architecture Restructuring",
        detail:
          "Replace fanout exchanges with consumer groups reading the same topic. Replace direct exchanges with partition key strategies. Replace headers exchanges with message filtering at the consumer level. Topic exchanges map to Kafka topic patterns.",
      },
      {
        step: "Operational Considerations",
        detail:
          "Kafka requires Zookeeper or KRaft for cluster coordination. RabbitMQ has simpler single-node setup. Kafka is designed for horizontal scaling; add partitions and brokers. Monitor consumer lag (Kafka's strength) vs queue depth (RabbitMQ's strength).",
      },
    ],
    decisionFlow: [
      {
        question: "What's your use case?",
        options: [
          { label: "Task queues & RPC messages", result: "RabbitMQ — excellent routing, dead letter queues, per-message ack" },
          { label: "Event streaming & data pipelines", result: "Kafka — durable event log, replay capability, high throughput" },
          { label: "Both / not sure yet", result: "Kafka — more flexible for future event-driven architectures" },
        ],
      },
      {
        question: "What's your throughput requirement?",
        options: [
          { label: "Moderate (thousands/sec)", result: "RabbitMQ — sufficient, easier to operate" },
          { label: "High (millions/sec)", result: "Kafka — designed for high throughput" },
          { label: "Variable / growing fast", result: "Kafka — scales linearly with partitions" },
        ],
      },
      {
        question: "What's your team's expertise?",
        options: [
          { label: "Familiar with AMQP/MQTT", result: "RabbitMQ — standard protocols, easier to debug" },
          { label: "Data engineers / streaming", result: "Kafka — Kafka Streams, ksqlDB, connectors" },
          { label: "General backend developers", result: "RabbitMQ — simpler mental model, quicker to learn" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 13. Flutter vs React Native (Mobile Frameworks)
  // ═══════════════════════════════════════════════════════════
  {
    id: "flutter-vs-react-native",
    category: "Frontend",
    techA: {
      name: "Flutter",
      icon: "fa-solid fa-flask",
      color: "#2dd4bf",
      label: "Flutter (Dart, Google)",
    },
    techB: {
      name: "React Native",
      icon: "fa-brands fa-react",
      color: "#61dafb",
      label: "React Native (JavaScript, Meta)",
    },
    description:
      "Flutter uses Dart and its own rendering engine (Skia) for pixel-perfect UIs across platforms. React Native bridges JavaScript to native components, leveraging the vast React ecosystem for cross-platform mobile development.",
    dimensions: {
      learningCurve: { a: 3, b: 4 },
      performance: { a: 5, b: 3 },
      ecosystemSize: { a: 3, b: 5 },
      jobDemand: { a: 4, b: 4 },
      communitySupport: { a: 4, b: 5 },
      scalability: { a: 4, b: 4 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Rendering Engine", a: true, b: false, note: "Flutter uses Skia (own engine); React Native uses native platform components" },
      { name: "Hot Reload", a: true, b: true, note: "Both support hot reload / hot restart for fast iteration" },
      { name: "Platform-specific APIs", a: true, b: true, note: "Both access native APIs via platform channels / native modules" },
      { name: "Web Support", a: true, b: true, note: "Flutter Web via CanvasKit; React Native Web" },
      { name: "Desktop Support", a: true, b: true, note: "Flutter Desktop (Windows, macOS, Linux); React Native Desktop (limited)" },
      { name: "State Management", a: true, b: true, note: "Flutter: Provider, Riverpod, Bloc; React Native: Redux, Zustand, MobX" },
      { name: "Native Feel", a: false, b: true, note: "React Native uses native components; Flutter draws its own widgets" },
      { name: "Package Ecosystem", a: false, b: true, note: "React Native has larger npm ecosystem; Flutter's pub.dev is smaller" },
      { name: "Language", a: false, b: true, note: "Flutter uses Dart (compiled); React Native uses JavaScript/TypeScript" },
    ],
    syntaxExamples: [
      {
        task: "Create a Counter App",
        a: `// Flutter Counter App
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: CounterPage(),
    );
  }
}

class CounterPage extends StatefulWidget {
  @override
  State<CounterPage> createState() => _CounterPageState();
}

class _CounterPageState extends State<CounterPage> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Counter')),
      body: Center(
        child: Text(
          'Count: $_count',
          style: TextStyle(fontSize: 24),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _count++),
        child: Icon(Icons.add),
      ),
    );
  }
}`,
        b: `// React Native Counter App
import React, { useState } from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const CounterPage = () => {
  const [count, setCount] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Counter</Text>
      <Text style={styles.count}>Count: {count}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setCount(c => c + 1)}>
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  count: { fontSize: 24, marginVertical: 16 },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontSize: 20 },
});

export default CounterPage;`,
      },
      {
        task: "Fetch Data and Display List",
        a: `// Flutter - List with data fetching
class PostsList extends StatefulWidget {
  @override
  State<PostsList> createState() => _PostsListState();
}

class _PostsListState extends State<PostsList> {
  late Future<List<Post>> _posts;

  @override
  void initState() {
    super.initState();
    _posts = fetchPosts();
  }

  Future<List<Post>> fetchPosts() async {
    final res = await http.get(
      Uri.parse('https://api.example.com/posts')
    );
    return postFromJson(res.body);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Post>>(
      future: _posts,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return ListView.builder(
            itemCount: snapshot.data!.length,
            itemBuilder: (context, index) {
              return ListTile(
                title: Text(snapshot.data![index].title),
              );
            },
          );
        }
        return CircularProgressIndicator();
      },
    );
  }
}`,
        b: `// React Native - FlatList with data
import React, { useState, useEffect } from 'react';
import {
  FlatList, Text, View, ActivityIndicator
} from 'react-native';

const PostsList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.example.com/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16 }}>{item.title}</Text>
        </View>
      )}
    />
  );
};

export default PostsList;`,
      },
    ],
    migrationGuide: [
      {
        step: "Component Model Translation",
        detail:
          "React Native's JSX components become Flutter Widgets. View → Container or SizedBox, Text → Text, ScrollView → ListView or SingleChildScrollView. React Native's StyleSheet becomes Flutter's widget constructors with style parameters.",
      },
      {
        step: "State Management Migration",
        detail:
          "React Native's useState/useReducer becomes Flutter's StatefulWidget + setState. Redux → Bloc or Riverpod. React Query → flutter_query or manual caching. Context API → Provider or InheritedWidget.",
      },
      {
        step: "Navigation Overhaul",
        detail:
          "React Navigation (stack, tab, drawer) becomes Flutter's Navigator 2.0 or go_router. Each screen in React Native becomes a Route in Flutter. Deep linking and URL-based navigation work in both with setup.",
      },
      {
        step: "Native Module Adaptation",
        detail:
          "React Native native modules (Java/Kotlin for Android, ObjC/Swift for iOS) become Flutter platform channels (Dart ↔ native code). MethodChannel in Flutter replaces React Native's bridge. Permissions, camera, and sensors need reimplementation.",
      },
    ],
    decisionFlow: [
      {
        question: "What's your team's background?",
        options: [
          { label: "React / JavaScript developers", result: "React Native — leverage existing React knowledge" },
          { label: "Mobile-native developers (Java/Swift)", result: "Flutter — better performance, closer to native" },
          { label: "New to mobile development", result: "Flutter — single language (Dart), better documentation" },
        ],
      },
      {
        question: "What matters most for your app?",
        options: [
          { label: "Pixel-perfect custom UI", result: "Flutter — Skia engine gives total control over every pixel" },
          { label: "Native platform look & feel", result: "React Native — uses real native components" },
          { label: "Ship fast with existing code", result: "React Native — reuse web JS/TS code, larger ecosystem" },
        ],
      },
      {
        question: "What's your target platform?",
        options: [
          { label: "iOS & Android only", result: "Either — both excel at mobile apps" },
          { label: "Mobile + Web + Desktop", result: "Flutter — more mature multi-platform support" },
          { label: "Primarily mobile, web later", result: "React Native — RN Web provides easy web port" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 14. GitHub Actions vs GitLab CI (CI/CD)
  // ═══════════════════════════════════════════════════════════
  {
    id: "github-actions-vs-gitlab-ci",
    category: "DevOps",
    techA: {
      name: "GitHub Actions",
      icon: "fa-brands fa-github",
      color: "#f0f6fc",
      label: "GitHub Actions",
    },
    techB: {
      name: "GitLab CI",
      icon: "fa-brands fa-gitlab",
      color: "#fc6d26",
      label: "GitLab CI/CD",
    },
    description:
      "GitHub Actions is a tightly integrated CI/CD platform with a vast marketplace of reusable actions. GitLab CI/CD offers a built-in CI pipeline with Auto DevOps, robust security scanning, and comprehensive Kubernetes integration.",
    dimensions: {
      learningCurve: { a: 4, b: 3 },
      performance: { a: 3, b: 4 },
      ecosystemSize: { a: 5, b: 3 },
      jobDemand: { a: 5, b: 3 },
      communitySupport: { a: 5, b: 3 },
      scalability: { a: 4, b: 4 },
    },
    dimensionLabels: {
      learningCurve: "Learning Curve",
      performance: "Performance",
      ecosystemSize: "Ecosystem Size",
      jobDemand: "Job Demand",
      communitySupport: "Community Support",
      scalability: "Scalability",
    },
    features: [
      { name: "Marketplace / Templates", a: true, b: true, note: "GitHub Marketplace; GitLab CI templates and includes" },
      { name: "Self-Hosted Runners", a: true, b: true, note: "Both support self-hosted runners/agents" },
      { name: "Built-in Container Registry", a: true, b: true, note: "GitHub Container Registry vs GitLab Container Registry" },
      { name: "Auto DevOps", a: false, b: true, note: "GitLab Auto DevOps provides automatic CI/CD pipelines" },
      { name: "Security Scanning", a: true, b: true, note: "GitHub Dependabot + CodeQL; GitLab SAST/DAST/Container Scanning" },
      { name: "Multi-Project Pipelines", a: false, b: true, note: "GitLab has native multi-project pipeline orchestration" },
      { name: "Review Apps (Preview Envs)", a: true, b: true, note: "Both support ephemeral environments for PRs/MRs" },
      { name: "Deploy Boards", a: false, b: true, note: "GitLab has built-in deploy boards for Kubernetes" },
      { name: "Minutes / Pricing (Free Tier)", a: true, b: true, note: "GitHub: 2000 min/month free; GitLab: 400 min/month free" },
    ],
    syntaxExamples: [
      {
        task: "Run Tests and Deploy",
        a: `# GitHub Actions (.github/workflows/ci.yml)
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying to production..."`,
        b: `# GitLab CI (.gitlab-ci.yml)
stages:
  - test
  - deploy

variables:
  POSTGRES_VERSION: "15"

test:
  stage: test
  image: node:20
  services:
    - postgres:15
  variables:
    POSTGRES_PASSWORD: postgres
    DATABASE_URL: postgres://postgres:postgres@postgres:5432/test
  before_script:
    - npm ci
  script:
    - npm test

deploy:
  stage: deploy
  image: node:20
  needs: [test]
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  script:
    - echo "Deploying to production..."`,
      },
      {
        task: "Multi-Environment Pipeline with Caching",
        a: `# GitHub Actions - Matrix build + cache
jobs:
  test:
    strategy:
      matrix:
        node: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]

    runs-on: \${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npm test

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: test-results/`,
        b: `# GitLab CI - Parallel matrix + cache
test:
  parallel:
    matrix:
      - NODE_VERSION: ["18", "20", "22"]
        OS_IMAGE: ["ubuntu:latest"]
  image: node:\$NODE_VERSION
  cache:
    key: \$CI_COMMIT_REF_SLUG
    paths:
      - node_modules/
  before_script:
    - npm ci
  script:
    - npm run build
    - npm test
  artifacts:
    when: on_failure
    paths:
      - test-results/`,
      },
    ],
    migrationGuide: [
      {
        step: "YAML Syntax Translation",
        detail:
          "GitHub Actions jobs/steps/uses becomes GitLab stages/jobs/script. GitHub's 'uses: actions/checkout@v4' becomes 'before_script: - git clone' or use GitLab CI job templates. GitHub's matrix strategy becomes GitLab's 'parallel: matrix'.",
      },
      {
        step: "Environment Variables & Secrets",
        detail:
          "GitHub secrets (secrets.MY_KEY) become GitLab CI variables ($MY_KEY). GitHub env context (${{ env.VAR }}) becomes GitLab's $VAR. Repository variables migrate to GitLab's CI/CD Settings → Variables. Environment-specific variables use GitLab environments.",
      },
      {
        step: "Caching Strategy Migration",
        detail:
          "GitHub's actions/cache with key/restore-keys becomes GitLab's cache: key: with paths. GitLab caches are simpler but less flexible. For complex cache strategies, use GitLab's cache: key: files: for dependency-based cache invalidation.",
      },
      {
        step: "Runners & Infrastructure",
        detail:
          "GitHub hosted runners become GitLab SaaS runners (shared) or self-hosted runners. GitLab supports autoscaling runner groups with Docker Machine or Kubernetes. GitLab Runner is more configurable, supporting tags, concurrent jobs, and custom executor.",
      },
    ],
    decisionFlow: [
      {
        question: "Where is your code hosted?",
        options: [
          { label: "GitHub (public/private)", result: "GitHub Actions — seamless integration, no extra cost" },
          { label: "GitLab (self-hosted or SaaS)", result: "GitLab CI — native integration, best performance" },
          { label: "Bitbucket / other platform", result: "GitHub Actions — can trigger from external repos via webhooks" },
        ],
      },
      {
        question: "What's your pipeline complexity?",
        options: [
          { label: "Simple test & deploy", result: "GitHub Actions — easy to start, huge marketplace" },
          { label: "Complex multi-stage pipelines", result: "GitLab CI — DAG pipelines, multi-project, better orchestration" },
          { label: "Kubernetes-heavy deployments", result: "GitLab CI — native K8s integration, deploy boards" },
        ],
      },
      {
        question: "What's your budget?",
        options: [
          { label: "Free tier for small team", result: "GitHub Actions — 2000 free minutes/month (more generous)" },
          { label: "Enterprise with compliance needs", result: "GitLab CI — self-hosted runners, better audit trail" },
          { label: "Need advanced security scanning", result: "GitLab CI — built-in SAST/DAST, container scanning" },
        ],
      },
    ],
  },
];
