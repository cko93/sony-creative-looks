import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Sony field guide', () => {
  it('switches from photo looks to the movie bank', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole('button', { name: 'Movie bank' }));

    expect(screen.getByRole('heading', { name: 'Motion, mapped.' })).toBeInTheDocument();
  });

  it('filters photo-look cards by search term', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByRole('textbox', { name: 'Search recipes' }), 'pacific');

    expect(screen.getByRole('heading', { name: 'Pacific Blues' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Kodachrome 64' })).not.toBeInTheDocument();
  });

  it('expands a recipe card and exposes its attributed source link', async () => {
    const user = userEvent.setup();
    render(<Home />);
    const article = screen
      .getByRole('heading', { name: 'Pacific Blues' })
      .closest('article');
    expect(article).not.toBeNull();
    const card = within(article as HTMLElement).getByRole('button');

    expect(card).toHaveAttribute('aria-expanded', 'false');
    await user.click(card);

    expect(card).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(article as HTMLElement).getByRole('link', {
        name: 'Open photo + source recipe ↗',
      }),
    ).toHaveAttribute('target', '_blank');
  });

  it('defines deployed metadata in the static document', async () => {
    const html = await readFile(resolve(process.cwd(), 'index.html'), 'utf8');
    const document = new DOMParser().parseFromString(html, 'text/html');

    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.querySelector('meta[name="viewport"]')).not.toBeNull();
    expect(document.title).toBe('A7C II Field Looks');
    expect(document.querySelector('meta[name="description"]')).not.toBeNull();
    expect(document.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe(
      '/favicon.svg',
    );
  });
});
