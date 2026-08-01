/**
 * DSASearchEngine (Web Worker Proxy)
 * Delegates search indexing and querying to a Web Worker to prevent UI blocking.
 */
class DSASearchEngine {
  constructor(problems, cacheKey = 'dsa_search_index_v1') {
    // Note: The path here assumes it's loaded from index.html (root)
    this.worker = new Worker('utils/search-worker.js');
    this.resolvers = {};
    this.messageId = 0;

    this.worker.onmessage = (e) => {
      const { id, payload } = e.data;
      if (this.resolvers[id]) {
        this.resolvers[id](payload);
        delete this.resolvers[id];
      }
    };

    // Initialize the worker with data
    this.initPromise = this._sendMessage('INIT', { problems, cacheKey });
  }

  _sendMessage(type, payload) {
    return new Promise((resolve) => {
      const id = ++this.messageId;
      this.resolvers[id] = resolve;
      this.worker.postMessage({ type, payload, id });
    });
  }

  async search(query) {
    // Await init if it's still running
    await this.initPromise;

    if (!query || query.trim() === '') return [];
    return this._sendMessage('SEARCH', { query });
  }
}

if (typeof window !== 'undefined') {
  window.DSASearchEngine = DSASearchEngine;
}
