// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GitHubRepositoryCard } from './GitHubRepositoryCard';

const repo = {
  id: 1,
  name: 'demo-repo',
  full_name: 'demo/demo-repo',
  html_url: 'https://github.com/demo/demo-repo',
  clone_url: 'https://github.com/demo/demo-repo.git',
  description: 'Demo repository',
  private: false,
  language: 'TypeScript',
  updated_at: '2026-08-29T00:00:00Z',
  stargazers_count: 3,
  forks_count: 1,
  watchers_count: 3,
  topics: [],
  fork: false,
  archived: false,
  size: 10,
  default_branch: 'main',
  languages_url: '',
};

describe('GitHubRepositoryCard', () => {
  it('uses separate view and repository-selection controls', () => {
    const onClone = vi.fn();
    const { container } = render(<GitHubRepositoryCard repo={repo} onClone={onClone} />);

    const viewLink = screen.getByRole('link', { name: 'View on GitHub' });
    const selectButton = screen.getByRole('button', { name: 'Select repository' });

    expect(viewLink).toHaveAttribute('href', repo.html_url);
    expect(selectButton).toBeEnabled();
    expect(container.querySelector('a button')).toBeNull();

    fireEvent.click(selectButton);
    expect(onClone).toHaveBeenCalledTimes(1);
    expect(onClone).toHaveBeenCalledWith(repo);
  });
});
