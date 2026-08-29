export function buildGitImportUrl(repoUrl: string, branch?: string) {
  const cloneTarget = branch ? `${repoUrl}#${branch}` : repoUrl;
  return `/git?url=${encodeURIComponent(cloneTarget)}`;
}
