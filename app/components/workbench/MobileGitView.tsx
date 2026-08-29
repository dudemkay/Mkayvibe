export function MobileGitView() {
  return (
    <section className="flex h-full w-full items-center justify-center p-6 text-center">
      <div className="max-w-sm rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-6 shadow-sm">
        <div className="i-ph:git-branch mx-auto mb-3 text-4xl text-bolt-elements-textSecondary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Git</h2>
        <p className="mt-2 text-sm leading-6 text-bolt-elements-textSecondary">
          Repository controls will appear here after GitHub is connected.
        </p>
      </div>
    </section>
  );
}
