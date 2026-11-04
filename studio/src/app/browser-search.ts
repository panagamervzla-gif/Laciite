export function bindBrowserSearch(trigger: HTMLButtonElement, search: HTMLInputElement): () => void {
  const close = (): void => {
    search.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (search.value) {
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  trigger.addEventListener('click', () => {
    if (!search.hidden) {
      close();
      return;
    }
    search.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    search.focus();
  });

  search.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || search.hidden) return;
    event.preventDefault();
    close();
    trigger.focus();
  });

  return close;
}
