import type { WebContainer } from '@webcontainer/api';
import type { Snapshot } from '~/lib/persistence/types';

function toRelativePath(workdir: string, filePath: string) {
  const withoutWorkdir = filePath.startsWith(workdir) ? filePath.slice(workdir.length) : filePath;
  return withoutWorkdir.replace(/^\/+/, '');
}

function isGitMetadataPath(filePath: string) {
  return filePath === '.git' || filePath.startsWith('.git/');
}

export async function restoreGitWorkspaceSnapshot(
  container: Pick<WebContainer, 'workdir' | 'fs'>,
  snapshot?: Snapshot,
) {
  if (!snapshot?.files) {
    return;
  }

  for (const [filePath, value] of Object.entries(snapshot.files)) {
    if (value?.type !== 'folder') {
      continue;
    }

    const relativePath = toRelativePath(container.workdir, filePath);

    if (!relativePath || isGitMetadataPath(relativePath)) {
      continue;
    }

    await container.fs.mkdir(relativePath, { recursive: true });
  }

  for (const [filePath, value] of Object.entries(snapshot.files)) {
    if (value?.type !== 'file') {
      continue;
    }

    const relativePath = toRelativePath(container.workdir, filePath);

    if (!relativePath || isGitMetadataPath(relativePath)) {
      continue;
    }

    await container.fs.writeFile(relativePath, value.content, { encoding: value.isBinary ? undefined : 'utf8' });
  }
}
