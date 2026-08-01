// GraphQL & REST Schema Performance Profiler Script

const PRESETS = {
  "e-commerce": {
    gql: `query GetProductFeed {
  products(limit: 10) {
    id
    title
    price
    reviews { # <-- N+1 Query Bottleneck!
      id
      rating
      author {
        id
        name
      }
    }
  }
}`,
    rest: `GET /api/v1/products?limit=10\nGET /api/v1/products/{id}/reviews (x10 calls)\nGET /api/v1/users/{authorId} (x30 calls)`
  },
  "social": {
    gql: `query GetTimeline {
  timeline(limit: 5) {
    postId
    content
    likesCount
    comments {
      commentId
      text
      user {
        username
        avatarUrl
      }
    }
  }
}`,
    rest: `GET /api/v1/posts/feed\nGET /api/v1/posts/{id}/comments (x5 calls)`
  },
  "blog": {
    gql: `query GetBlogPosts {
  posts {
    id
    title
    category {
      name
    }
  }
}`,
    rest: `GET /api/v1/posts (Returns 500KB JSON with full post bodies, HTML metadata, draft history - 92% over-fetched)`
  }
};

class SchemaProfilerApp {
  constructor() {
    this.cacheRatio = 20;
    this.useDataLoader = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadPreset("e-commerce");
    this.runProfiler();
  }

  bindEvents() {
    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-mode');
    });

    // Preset selector
    document.querySelectorAll('.grp-btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.grp-btn-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadPreset(btn.dataset.preset);
        this.runProfiler();
      });
    });

    // Slider & Data Loader Toggle
    const slider = document.getElementById('cacheHitSlider');
    slider.addEventListener('input', (e) => {
      this.cacheRatio = parseInt(e.target.value);
      document.getElementById('cacheHitLabel').innerText = `${this.cacheRatio}%`;
      this.runProfiler();
    });

    document.getElementById('chkDataLoader').addEventListener('change', (e) => {
      this.useDataLoader = e.target.checked;
      this.runProfiler();
    });

    document.getElementById('btnRunProfiler').addEventListener('click', () => this.runProfiler());
  }

  loadPreset(key) {
    const data = PRESETS[key];
    document.getElementById('gqlQueryInput').value = data.gql;
    document.getElementById('restEndpointInput').value = data.rest;
  }

  runProfiler() {
    const gqlCode = document.getElementById('gqlQueryInput').value;
    const isN1 = gqlCode.includes('reviews') || gqlCode.includes('comments') || gqlCode.includes('author');

    let gqlQueries = 1;
    if (isN1) {
      gqlQueries = this.useDataLoader ? 2 : 11;
    }

    const uncachedQueries = Math.round(gqlQueries * (1 - this.cacheRatio / 100));
    const latency = uncachedQueries * 18 + 5;
    const payloadSize = isN1 ? 4.2 : 1.8;

    // Update GQL UI
    document.getElementById('gqlDbCalls').innerText = gqlQueries;
    document.getElementById('gqlPayload').innerText = `${payloadSize} KB`;
    document.getElementById('gqlLatency').innerText = `${latency} ms`;

    // REST Metrics
    const restCalls = isN1 ? 11 : 1;
    const restPayloadSize = payloadSize * 4.5;
    const overfetchPct = 78;

    document.getElementById('restRequests').innerText = restCalls;
    document.getElementById('restPayload').innerText = `${restPayloadSize.toFixed(1)} KB`;
    document.getElementById('restOverfetch').innerText = `${overfetchPct}%`;

    // N+1 Tree
    const treeEl = document.getElementById('queryExecutionTree');
    const alertBadge = document.getElementById('n1AlertBadge');

    if (isN1 && !this.useDataLoader) {
      alertBadge.style.display = 'inline-block';
      alertBadge.innerText = 'CRITICAL N+1 RISK';
      alertBadge.style.background = '#ef4444';

      treeEl.innerHTML = `
        <div class="grp-tree-node">SELECT * FROM products LIMIT 10; (1 query)</div>
        <div class="grp-tree-node danger">SELECT * FROM reviews WHERE product_id = 1; (Query #2)</div>
        <div class="grp-tree-node danger">SELECT * FROM reviews WHERE product_id = 2; (Query #3)</div>
        <div class="grp-tree-node danger">SELECT * FROM reviews WHERE product_id = 3; (Query #4)</div>
        <div class="grp-tree-node danger">... repeated for all 10 products! (Total 11 SQL Queries)</div>
      `;
    } else if (this.useDataLoader) {
      alertBadge.style.display = 'inline-block';
      alertBadge.innerText = 'OPTIMIZED (DATALOADER)';
      alertBadge.style.background = '#10b981';

      treeEl.innerHTML = `
        <div class="grp-tree-node">SELECT * FROM products LIMIT 10; (1 query)</div>
        <div class="grp-tree-node" style="border-left-color: #10b981; color: #10b981;">SELECT * FROM reviews WHERE product_id IN (1,2,3,4,5,6,7,8,9,10); (Batched 1 Query!)</div>
      `;
    } else {
      alertBadge.style.display = 'none';
      treeEl.innerHTML = `<div class="grp-tree-node">SELECT * FROM posts; (Single linear query)</div>`;
    }

    // Recommendations
    const recsEl = document.getElementById('recommendationsList');
    recsEl.innerHTML = `
      <div class="grp-rec-item">
        <div class="grp-rec-title"><i class="fas fa-layer-group"></i> ${this.useDataLoader ? 'DataLoader Active' : 'Implement DataLoader Pattern'}</div>
        <div class="grp-rec-desc">Batch and cache nested resolver calls to reduce N+1 SQL overhead from ${gqlQueries} queries down to 2.</div>
      </div>
      <div class="grp-rec-item" style="border-left-color: #e535ab;">
        <div class="grp-rec-title"><i class="fas fa-compress"></i> GraphQL Reduces Payload Bloat by 78%</div>
        <div class="grp-rec-desc">Compared to REST endpoints, GraphQL eliminates over-fetching by allowing clients to request only required JSON keys.</div>
      </div>
      <div class="grp-rec-item" style="border-left-color: #f59e0b;">
        <div class="grp-rec-title"><i class="fas fa-bolt"></i> Redis Query Caching Impact</div>
        <div class="grp-rec-desc">At a ${this.cacheRatio}% cache hit ratio, overall API latency dropped to ${latency} ms.</div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SchemaProfilerApp();
});
