import { generateId, type Message } from 'ai';

export interface GitWorkspaceTarget {
  gitUrl: string;
  gitBranch?: string;
}

export function parseGitWorkspaceTarget(target: string): GitWorkspaceTarget {
  const [gitUrl, rawBranch] = target.split('#', 2);
  const gitBranch = rawBranch?.trim() || undefined;

  return {
    gitUrl: gitUrl.trim(),
    gitBranch,
  };
}

export function createGitWorkspaceImportMessage(gitUrl: string, gitBranch?: string): Message {
  const repositoryName = gitUrl.replace(/\.git$/, '').replace(/\/+$/, '').split('/').pop() || 'repository';
  const branchText = gitBranch ? ` on branch ${gitBranch}` : '';

  return {
    role: 'assistant',
    id: generateId(),
    createdAt: new Date(),
    content: `GitHub workspace connected: ${repositoryName}${branchText}. The repository is loaded as a real Git working tree so Chat, Files, Code, Preview and Sync all work on the same project.`,
  };
}
