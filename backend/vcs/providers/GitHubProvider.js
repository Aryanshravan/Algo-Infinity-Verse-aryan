import { VCSProvider } from '../VCSProvider.js';
import { processInBatches } from '../../utils/concurrency.js';
import * as yaml from 'js-yaml';

export class GitHubProvider extends VCSProvider {
  constructor(repoUrl) {
    super(repoUrl);
    const match = this.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    this.owner = match[1];
    this.repo = match[2].replace(/\.git$/, '');
  }

  _getHeaders() {
    const headers = {
      'User-Agent': 'Algo-Infinity-Verse-Analyzer',
      Accept: 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
  }

  async _fetchJson(url) {
    const res = await fetch(url, { headers: this._getHeaders() });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`GitHub API returned ${res.status} for ${url}`);
    }
    return res.json();
  }

  async _fetchText(url) {
    const res = await fetch(url, { headers: this._getHeaders() });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`GitHub API returned ${res.status} for ${url}`);
    }
    return res.text();
  }

  async getCIConfigFiles() {
    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/.github/workflows`;
    const data = await this._fetchJson(apiUrl);

    if (!data || !Array.isArray(data)) return [];

    const yamlFiles = data.filter(f => f.name.endsWith('.yml') || f.name.endsWith('.yaml'));

    const workflows = await processInBatches(
      yamlFiles,
      async (file) => {
        const content = await this._fetchText(file.download_url);
        if (content !== null) {
          return { name: file.name, content };
        }
        return null;
      },
      3
    );

    return workflows.filter(w => w !== null);
  }

  normalizeCIConfig(rawContent) {
    const doc = yaml.load(rawContent);
    if (!doc || typeof doc !== 'object') return [];

    const commands = [];
    const jobs = doc.jobs || {};

    for (const jobKey of Object.keys(jobs)) {
      const job = jobs[jobKey];
      const steps = job.steps || [];
      for (const step of steps) {
        if (step.run) commands.push(step.run);
        if (step.uses) commands.push(`uses: ${step.uses}`);
      }
    }

    if (commands.length === 0 && Object.keys(jobs).length > 0) {
      commands.push('HAS_JOBS');
    }

    return commands;
  }

  async getRepoFilePaths(_options = {}) {
    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/HEAD?recursive=1`;
    const data = await this._fetchJson(apiUrl);

    if (!data || !Array.isArray(data.tree)) return [];

    // Cap at a reasonable limit to avoid massive API responses for monorepos
    const MAX_FILES = 5000;
    const paths = [];
    for (const entry of data.tree) {
      if (entry.type === 'blob' && entry.path) {
        paths.push(entry.path);
        if (paths.length >= MAX_FILES) break;
      }
    }
    return paths;
  }

  async getFileContent(filePath) {
    // Encode each path segment individually so slashes remain as path separators
    const encodedPath = filePath
      .split('/')
      .map(function (seg) { return encodeURIComponent(seg); })
      .join('/');
    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${encodedPath}`;
    try {
      const data = await this._fetchJson(apiUrl);
      if (!data || !data.content) return null;
      // GitHub API returns base64-encoded content
      if (data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return data.content;
    } catch {
      return null;
    }
  }
}
