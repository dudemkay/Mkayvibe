import { useSearchParams } from '@remix-run/react';
import { generateId, type Message } from 'ai';
import ignore from 'ignore';
import { useCallback, useEffect, useState } from 'react';
import { useGit } from '~/lib/hooks/useGit';
import { useChatHistory } from '~/lib/persistence';
import { formatGitCloneProgress } from '~/lib/git/gitCloneBrowserOptions';
import { createCommandsMessage, detectProjectCommands, escapeBoltTags } from '~/utils/projectCommands';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  '**/*.gif',
  '**/*.webp',
  '**/*.ico',
  '**/*.pdf',
  '**/*.zip',
  '**/*.gz',
  '**/*.woff',
  '**/*.woff2',
  '**/*.ttf',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
];

export function GitUrlImport() {
  const [searchParams] = useSearchParams();
  const { ready: historyReady, importChat } = useChatHistory();
  const { ready: gitReady, error: gitInitializationError, gitClone } = useGit();
  const [imported, setImported] = useState(false);
  const [stage, setStage] = useState('Starting browser coding runtime…');
  const [progress, setProgress] = useState<number | undefined>();
  const [progressText, setProgressText] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const importRepo = useCallback(
    async (repoUrl: string) => {
      if (!gitReady || !historyReady) {
        throw new Error('The browser workspace is not ready yet.');
      }

      const ig = ignore().add(IGNORE_PATTERNS);

      setStage('Connecting to GitHub…');
      setProgress(undefined);
      setProgressText(undefined);

      const { workdir, data } = await gitClone(repoUrl, 0, (event) => {
        const next = formatGitCloneProgress(event);
        setStage(next.phase || 'Cloning repository…');
        setProgress(next.progress);
        setProgressText(next.progressText);
      });

      setStage('Preparing project files…');
      setProgress(undefined);
      setProgressText(undefined);

      const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
      const textDecoder = new TextDecoder('utf-8');
      const fileContents = filePaths
        .map((filePath) => {
          const { data: content, encoding } = data[filePath];

          return {
            path: filePath,
            content: encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
          };
        })
        .filter((file) => file.content);

      setStage('Detecting project setup…');
      const commands = await detectProjectCommands(fileContents);
      const commandsMessage = createCommandsMessage(commands);

      setStage('Saving imported workspace…');
      const filesMessage: Message = {
        role: 'assistant',
        content: `Cloning the repo ${repoUrl} into ${workdir}\n<boltArtifact id="imported-files" title="Git Cloned Files" type="bundled">\n${fileContents
          .map(
            (file) =>
              `<boltAction type="file" filePath="${file.path}">\n${escapeBoltTags(file.content)}\n</boltAction>`,
          )
          .join('\n')}\n</boltArtifact>`,
        id: generateId(),
        createdAt: new Date(),
      };

      const messages: Message[] = [filesMessage];

      if (commandsMessage) {
        messages.push({
          role: 'user',
          id: generateId(),
          content: 'Setup the codebase and Start the application',
        });
        messages.push(commandsMessage);
      }

      setStage('Opening project…');
      await importChat(`Git Project:${repoUrl.split('/').slice(-1)[0]}`, messages, { gitUrl: repoUrl });

      window.setTimeout(() => {
        if (window.location.pathname === '/git') {
          setError('The repository was cloned, but Mkayvibe could not open the imported project. Reload and try again.');
        }
      }, 4000);
    },
    [gitClone, gitReady, historyReady, importChat],
  );

  useEffect(() => {
    if (error || gitInitializationError || imported) {
      return;
    }

    if (!historyReady) {
      setStage('Preparing local workspace storage…');
      return;
    }

    if (!gitReady) {
      setStage('Starting browser coding runtime…');
      return;
    }

    const url = searchParams.get('url');

    if (!url) {
      setError('No Git repository was selected.');
      return;
    }

    setImported(true);
    void importRepo(url).catch((importError) => {
      console.error('Error importing repository:', importError);
      setError(importError instanceof Error ? importError.message : 'Failed to import repository.');
    });
  }, [error, gitInitializationError, gitReady, historyReady, importRepo, imported, searchParams]);

  const visibleError = error || gitInitializationError;

  if (visibleError) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-bolt-elements-background-depth-1 p-5">
        <section className="w-full max-w-md rounded-3xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-5 shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-500">
            <span className="i-ph:warning-circle" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-bolt-elements-textPrimary">Could not import repository</h1>
          <p className="mt-2 text-sm leading-6 text-bolt-elements-textSecondary">{visibleError}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 rounded-xl bg-accent-500 px-4 text-sm font-medium text-white"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="min-h-11 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-4 text-sm font-medium text-bolt-elements-textPrimary"
            >
              Back
            </button>
          </div>
        </section>
      </main>
    );
  }

  return <LoadingOverlay message={stage} progress={progress} progressText={progressText} />;
}
