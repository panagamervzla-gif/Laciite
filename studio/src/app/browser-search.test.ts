import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindBrowserSearch } from './browser-search';

describe('browser search', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reveals and focuses the search field when its icon is activated', () => {
    document.body.innerHTML = `
      <button id="toggle" aria-expanded="false"></button>
      <input id="search" type="search" hidden>
    `;
    const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
    const search = document.querySelector<HTMLInputElement>('#search')!;
    bindBrowserSearch(toggle, search);

    toggle.click();

    expect(search.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(search);
  });

  it('hides the field, clears the query, and refreshes results when closed', () => {
    document.body.innerHTML = `
      <button id="toggle" aria-expanded="false"></button>
      <input id="search" type="search">
    `;
    const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
    const search = document.querySelector<HTMLInputElement>('#search')!;
    const refresh = vi.fn();
    search.value = 'wall';
    search.addEventListener('input', refresh);
    bindBrowserSearch(toggle, search);

    toggle.click();

    expect(search.hidden).toBe(true);
    expect(search.value).toBe('');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('closes on Escape and returns focus to the search icon', () => {
    document.body.innerHTML = `
      <button id="toggle" aria-expanded="false"></button>
      <input id="search" type="search" hidden>
    `;
    const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
    const search = document.querySelector<HTMLInputElement>('#search')!;
    bindBrowserSearch(toggle, search);
    toggle.click();

    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(search.hidden).toBe(true);
    expect(document.activeElement).toBe(toggle);
  });
});
