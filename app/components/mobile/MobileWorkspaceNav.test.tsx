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

  it('marks the active destination and emits view changes', () => {
    const onChange = vi.fn();
    render(<MobileWorkspaceNav activeView="code" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Chat' })).not.toHaveAttribute('aria-current');

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(onChange).toHaveBeenCalledWith('preview');
  });
});
