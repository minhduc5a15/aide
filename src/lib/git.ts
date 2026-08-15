import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const execFileAsync = promisify(execFile);
const STORAGE_DIR = path.resolve(process.cwd(), 'storage/snippets');

export interface GitFile {
  name: string;
  content: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  date: string;
  author: string;
}

export class GitService {
  static getRepoPath(id: string) {
    return path.join(STORAGE_DIR, `${id}.git`);
  }

  static async initRepo(id: string) {
    const repoPath = this.getRepoPath(id);
    await fs.mkdir(repoPath, { recursive: true });
    await execFileAsync('git', ['init', '--bare'], { cwd: repoPath });
  }

  static async commitFiles(
    id: string,
    files: GitFile[],
    message: string = 'Update snippet',
    author: { name: string; email: string } = { name: 'Anonymous', email: 'anonymous@aide.local' }
  ) {
    const repoPath = this.getRepoPath(id);
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `snippet-${id}-`));

    try {
      for (const file of files) {
        // Sanitize path to prevent Directory Traversal
        const normalizedName = path.normalize(file.name);
        if (normalizedName.includes('..') || path.isAbsolute(normalizedName)) {
          throw new Error('Invalid file name');
        }

        const filePath = path.join(tempDir, normalizedName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, file.content);
      }

      // Force index to exactly match tempDir (handles deleted files too)
      await execFileAsync('git', ['--work-tree', tempDir, '--git-dir', repoPath, 'add', '-A']);

      const { stdout: status } = await execFileAsync('git', [
        '--work-tree',
        tempDir,
        '--git-dir',
        repoPath,
        'status',
        '--porcelain',
      ]);
      if (status.trim()) {
        await execFileAsync('git', [
          '--work-tree',
          tempDir,
          '--git-dir',
          repoPath,
          '-c',
          `user.name=${author.name}`,
          '-c',
          `user.email=${author.email}`,
          'commit',
          '-m',
          message,
        ]);
      }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  static async getFiles(id: string, commitHash: string = 'HEAD'): Promise<GitFile[]> {
    const repoPath = this.getRepoPath(id);
    try {
      const { stdout: tree } = await execFileAsync(
        'git',
        ['ls-tree', '-r', '--name-only', commitHash],
        { cwd: repoPath }
      );
      const filenames = tree.trim().split('\n').filter(Boolean);

      const files: GitFile[] = [];
      for (const name of filenames) {
        const { stdout: content } = await execFileAsync('git', ['show', `${commitHash}:${name}`], {
          cwd: repoPath,
        });
        files.push({ name, content });
      }
      return files;
    } catch {
      return [];
    }
  }

  static async getHistory(id: string): Promise<GitCommit[]> {
    const repoPath = this.getRepoPath(id);
    try {
      const { stdout: log } = await execFileAsync(
        'git',
        [`log`, `-z`, `--pretty=format:%H%x1F%s%x1F%aI%x1F%an`],
        { cwd: repoPath }
      );

      return log
        .split('\0')
        .filter(Boolean)
        .map((commitStr) => {
          const [hash, message, date, author] = commitStr.split('\x1F');
          return { hash, message, date, author };
        });
    } catch {
      return [];
    }
  }
}
