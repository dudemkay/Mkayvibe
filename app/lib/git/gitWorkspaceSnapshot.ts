import type { WebContainer } from '@webcontainer/api';
import type { Snapshot } from '~/lib/persistence/types';
import type { FileMap } from '~/lib/stores/files';

type GitCloneData = Record<string, { data: unknown; encoding?: string }>;

function toRelativePath(workdir: string, filePath: string) {
  const withoutWorkdir = filePath.startsWith(workdir) ? filePath.slice(workdir.length) : filePath;
  return withoutWorkdir.replace(/^\/+/, '');
}

function isGitMetadataPath(filePath: string) {
  return filePath === '.git' || filePath.startsWith('.git/');
}

function absoluteWorkspacePath(workdir: string, relativePath: string) {
  return `${workdir.replace(/\/+$/, '')}/${relativePath.replace(/^\/+/, '')}`;
}

function addParentFolders(files: FileMap, workdir: string, relativePath: string) {
  const parts = relativePath.split('/').filter(Boolean).slice(0, -1);
  let current = workdir.replace(/\/+$/, '');

  for (const part of parts) {
    current = `${current}/${part}`;
    files[current] = { type: 'folder' };
  }
}

function decodeCloneFile(value: { data: unknown; encoding?: string }) {
  if (typeof value.data === 'string') {
    return { content: value.data, isBinary: false };
  }

  if (value.data instanceof Uint8Array) {
    try {
      return { content: new TextDecoder('utf-8', { fatal: true }).decode(value.data), isBinary: false };
    } catch {
      return { content: '', isBinary: true };
    }
  }

  return { content: '', isBinary: true };
}

export function createGitWorkspaceFileMap(
  workdir: string,
  cloneData: GitCloneData = {},
  snapshot?: Snapshot,
  existingFiles: FileMap = {},
): FileMap {
  const files: FileMap = {};

  for (const [filePath, value] of Object.entries(existingFiles)) {
    if (value) {
      files[filePath] = value;
    }
  }

  for (const [filePath, value] of Object.entries(cloneData)) {
    const relativePath = toRelativePath(workdir, filePath);

    if (!relativePath || isGitMetadataPath(relativePath)) {
      continue;
    }

    addParentFolders(files, workdir, relativePath);
    files[absoluteWorkspacePath(workdir, relativePath)] = { type: 'file', ...decodeCloneFile(value) };
  }

  for (const [filePath, value] of Object.entries(snapshot?.files || {})) {
    if (!value) {
      continue;
    }

    const relativePath = toRelativePath(workdir, filePath);

    if (!relativePath || isGitMetadataPath(relativePath)) {
      continue;
    }

    const absolutePath = absoluteWorkspacePath(workdir, relativePath);

    if (value.type === 'folder') {
      files[absolutePath] = { type: 'folder' };
    } else {
      addParentFolders(files, workdir, relativePath);
      files[absolutePath] = { ...value };
    }
  }

  return files;
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
