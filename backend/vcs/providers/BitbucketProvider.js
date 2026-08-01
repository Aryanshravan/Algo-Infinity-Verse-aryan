import { VCSProvider } from '../VCSProvider.js';
import * as yaml from 'js-yaml';

export class BitbucketProvider extends VCSProvider {
  constructor(repoUrl) {
    super(repoUrl);
    const match = this.repoUrl.match(/bitbucket\.org\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error('Invalid Bitbucket URL');
    this.workspace = match[1];
    this.repo = match[2].replace(/\.git$/, '');
    this.branches = ['master', 'main'];
  }

  async _fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Bitbucket API returned ${res.status} for ${url}`);
    }
    return res.text();
  }

  async _fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Bitbucket API returned ${res.status} for ${url}`);
    }
    return res.json();
  }

  async getCIConfigFiles() {
    for (const branch of this.branches) {
      const apiUrl = `https://api.bitbucket.org/2.0/repositories/${this.workspace}/${this.repo}/src/${branch}/bitbucket-pipelines.yml`;
      const content = await this._fetchText(apiUrl);
      if (content !== null) {
        return [{ name: 'bitbucket-pipelines.yml', content }];
      }
    }
    return [];
  }

  normalizeCIConfig(rawContent) {
    const doc = yaml.load(rawContent);
    if (!doc || typeof doc !== 'object') return [];

    const commands = [];
    let hasJobs = false;

    if (doc.pipelines) {
      const p = doc.pipelines;

      const extractSteps = (pipelineBlock) => {
        if (!pipelineBlock || !Array.isArray(pipelineBlock)) return;
        for (let item of pipelineBlock) {
          if (item['<<']) {
            item = { ...item['<<'], ...item };
            delete item['<<'];
          }

          if (item.step) {
            hasJobs = true;
            if (item.step.script && Array.isArray(item.step.script)) {
              for (const s of item.step.script) {
                if (typeof s === 'string') commands.push(s);
              }
            }
            if (item.step['after-script'] && Array.isArray(item.step['after-script'])) {
              for (const s of item.step['after-script']) {
                if (typeof s === 'string') commands.push(s);
              }
            }
          }
          if (item.parallel && Array.isArray(item.parallel)) {
            extractSteps(item.parallel);
          }
        }
      };

      if (p.default) extractSteps(p.default);

      if (p.branches) {
        for (const branch of Object.values(p.branches)) {
          extractSteps(branch);
        }
      }
      if (p.custom) {
        for (const custom of Object.values(p.custom)) {
          extractSteps(custom);
        }
      }
      if (p.tags) {
        for (const tag of Object.values(p.tags)) {
          extractSteps(tag);
        }
      }
    }

    if (commands.length === 0 && hasJobs) {
      commands.push('HAS_JOBS');
    }

    return commands;
  }

  /**
   * Fetch the repository file tree from Bitbucket's API.
   * Bitbucket 2.0 API provides a src endpoint with recursive directory listing.
   */
  async getRepoFilePaths(_options = {}) {
    for (const branch of this.branches) {
      const paths = [];
      await this._walkBitbucketTree(branch, '', paths);
      if (paths.length > 0) return paths;
    }
    return [];
  }

  /**
   * Recursively walk the Bitbucket src tree to collect all file paths.
   * @param {string} branch
   * @param {string} dirPath - Current directory path relative to root
   * @param {string[]} paths - Accumulator array of file paths
   */
  async _walkBitbucketTree(branch, dirPath, paths) {
    const url = `https://api.bitbucket.org/2.0/repositories/${this.workspace}/${this.repo}/src/${branch}/${dirPath}`;
    const data = await this._fetchJson(url);
    if (!data || !Array.isArray(data.values)) return;

    for (const entry of data.values) {
      if (entry.type === 'commit_file' && entry.path) {
        paths.push(entry.path);
      } else if (entry.type === 'commit_directory' && entry.path) {
        // Recurse into subdirectories, but limit depth to avoid excessive API calls
        const depth = entry.path.split('/').length;
        if (depth <= 6) {
          await this._walkBitbucketTree(branch, entry.path, paths);
        }
      }
    }
  }

  async getFileContent(filePath) {
    for (const branch of this.branches) {
      const apiUrl = `https://api.bitbucket.org/2.0/repositories/${this.workspace}/${this.repo}/src/${branch}/${filePath}`;
      const content = await this._fetchText(apiUrl);
      if (content !== null) return content;
    }
    return null;
  }
}
