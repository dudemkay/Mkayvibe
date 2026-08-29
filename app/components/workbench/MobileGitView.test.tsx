// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MobileGitView } from './MobileGitView';

describe('MobileGitView', () => {
  it('renders a neutral Git workspace shell without fake repository state', () => {
    render(<MobileGitView />);

    expect(screen.getByRole('heading', { name: 'Git' })).toBeInTheDocument();
    expect(screen.getByText(/repository controls will appear here after github is connected/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pull/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /push/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /commit/i })).not.toBeInTheDocument();
  });
});
