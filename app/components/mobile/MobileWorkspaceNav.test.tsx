// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileWorkspaceNav } from './MobileWorkspaceNav';

describe('MobileWorkspaceNav', () => {
  it('renders all five mobile workspace destinations', () => {
    render(<MobileWorkspaceNav activeView="chat" onChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Code' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Git' })).toBeInTheDocument();
  });

  it('keeps every destination enabled before a workspace starts', () => {
    render(<MobileWorkspaceNav activeView="chat" onChange={() => undefined} workspaceReady={false} />);

    expect(screen.getByRole('button', { name: 'Chat' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Files' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Code' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Git' })).toBeEnabled();
  });

  it('marks the active destination and emits view changes', () => {
    const onChange = vi.fn();
    render(<MobileWorkspaceNav activeView="code" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Chat' })).not.toHaveAttribute('aria-current');

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(onChange).toHaveBeenCalledWith('preview');
  });

  it('shows an empty section for files before a workspace exists and offers Git import', () => {
    const onChange = vi.fn();
    render(<MobileWorkspaceNav activeView="files" onChange={onChange} workspaceReady={false} />);

    expect(screen.getByRole('heading', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByText(/project files will appear here/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Import from GitHub' }));
    expect(onChange).toHaveBeenCalledWith('git');
  });

  it('does not cover the Git surface with an empty-state overlay before a workspace exists', () => {
    render(<MobileWorkspaceNav activeView="git" onChange={() => undefined} workspaceReady={false} />);

    expect(screen.queryByRole('heading', { name: 'Git' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Git' })).toHaveAttribute('aria-current', 'page');
  });
});
