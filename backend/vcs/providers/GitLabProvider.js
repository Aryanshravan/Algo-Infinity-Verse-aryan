import { VCSProvider } from '../VCSProvider.js';
import * as yaml from 'js-yaml';

export class GitLabProvider extends VCSProvider {
  constructor(repoUrl) {
    super(repoUrl);
    const match = this.repoUrl.match(/gitlab\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('Invalid GitLab URL');
    this.namespace = match[1];
    this.project = match[2].replace(/\.git$/, '');
    this.encodedPath = encodeURIComponent(`${this.namespace}/${this.project}`);
  }

  async _fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`GitLab API returned ${res.status} for ${url}`);
    }
    return res.text();
  }

  async _fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`GitLab API returned ${res.status} for ${url}`);
    }
    return res.json();
  }

  async getCIConfigFiles() {
    const branches = ['main', 'master'];
    for (const branch of branches) {
      const apiUrl = `https://gitlab.com/api/v4/projects/${this.encodedPath}/repository/files/.gitlab-ci.yml/raw?ref=${branch}`;
      const content = await this._fetchText(apiUrl);
      if (content !== null) {
        return [{ name: '.gitlab-ci.yml', content }];
      }
    }
    return [];
  }

  normalizeCIConfig(rawContent) {
    const doc = yaml.load(rawContent);
    if (!doc || typeof doc !== 'object') return [];

    const commands = [];
    let hasJobs = false;

    const reservedKeys = [
      'image',
      'services',
      'stages',
      'types',
      'before_script',
      'after_script',
      'variables',
      'cache',
      'include',
      'default',
      'workflow',
    ];

    if (doc.include) hasJobs = true;

    for (const key of Object.keys(doc)) {
      if (reservedKeys.includes(key)) {
        if (key === 'before_script' || key === 'after_script') {
          const scripts = doc[key] || [];
          if (Array.isArray(scripts)) {
            hasJobs = true;
            commands.push(...scripts);
          }
        }
        continue;
      }

      const job = doc[key];
      if (typeof job === 'object' && job !== null && !Array.isArray(job)) {
        hasJobs = true;
        const scripts = job.script || [];
        if (Array.isArray(scripts)) commands.push(...scripts);
      }
    }

    if (commands.length === 0 && hasJobs) {
      commands.push('HAS_JOBS');
    }

    return commands;
  }

  /**
   * Fetch the repository file tree from GitLab's API.
   * GitLab provides a recursive tree endpoint.
   */
  async getRepoFilePaths(_options = {}) {
    const branches = ['main', 'master'];
    for (const branch of branches) {
      const apiUrl = `https://gitlab.com/api/v4/projects/${this.encodedPath}/repository/tree?recursive=true&per_page=100&ref=${branch}`;
      const data = await this._fetchJson(apiUrl);
      if (data && Array.isArray(data)) {
        const paths = [];
        for (const item of data) {
          if (item.type === 'blob' && item.path) {
            paths.push(item.path);
          }
        }
        return paths;
      }
    }
    return [];
  }

  /**
   * GitLab API requires file paths to be URL-encoded in a specific way:
   * each path segment should be individually encoded, then joined with %2F.
   * See: https://docs.gitlab.com/ee/api/repository_files.html#get-file-from-repository
   */
  async getFileContent(filePath) {
    const encodedFilePath = filePath
      .split('/')
      .map(function (seg) { return encodeURIComponent(seg); })
      .join('%2F');

    const branches = ['main', 'master'];
    for (const branch of branches) {
      const apiUrl = `https://gitlab.com/api/v4/projects/${this.encodedPath}/repository/files/${encodedFilePath}/raw?ref=${branch}`;
      const content = await this._fetchText(apiUrl);
      if (content !== null) return content;
    }
    return null;
  }
}
