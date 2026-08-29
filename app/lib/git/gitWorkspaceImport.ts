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
    content: `GitHub workspace connected: ${repositoryName}${branchText}. The repository is loaded as a real Git working tree, so Chat, Files, Code and Sync all work on the same project. Preview will appear when the project dev server is running.`,
  };
}

export function sanitizeLegacyGitImportMessages(messages: Message[], gitUrl: string, gitBranch?: string): Message[] {
  let legacyImportReplaced = false;

  return messages.map((message) => {
    if (legacyImportReplaced || message.role !== 'assistant' || typeof message.content !== 'string') {
      return message;
    }

    const isLegacyGitFileImport =
      message.content.includes('<boltArtifact id="imported-files"') ||
      message.content.includes("<boltArtifact id='imported-files'") ||
      message.content.includes('title="Git Cloned Files"') ||
      message.content.includes("title='Git Cloned Files'");

    if (!isLegacyGitFileImport) {
      return message;
    }

    legacyImportReplaced = true;
    const replacement = createGitWorkspaceImportMessage(gitUrl, gitBranch);

    return {
      ...message,
      content: replacement.content,
    };
  });
}
