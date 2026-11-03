export function bindFileMenu(details: HTMLDetailsElement, trigger: HTMLElement): void {
  const document = details.ownerDocument;
  const popover = details.querySelector<HTMLElement>('.file-menu-popover');

  const positionPopover = (): void => {
    if (!details.open || !popover) return;
    const triggerBounds = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    const margin = 8;
    const width = Math.max(0, Math.min(190, viewportWidth - margin * 2));
    const height = popover.getBoundingClientRect().height || popover.offsetHeight;

    popover.style.position = 'fixed';
    popover.style.width = `${width}px`;
    popover.style.maxHeight = `${Math.max(0, viewportHeight - margin * 2)}px`;
    popover.style.left = `${Math.max(margin, Math.min(triggerBounds.left, viewportWidth - width - margin))}px`;
    popover.style.top = `${Math.max(margin, Math.min(triggerBounds.bottom + 1, viewportHeight - height - margin))}px`;
  };

  details.addEventListener('toggle', () => {
    trigger.setAttribute('aria-expanded', String(details.open));
    positionPopover();
  });
  window.addEventListener('resize', positionPopover);

  details.addEventListener('click', event => {
    if (trigger.getAttribute('aria-disabled') === 'true' && event.target instanceof Node && trigger.contains(event.target)) {
      event.preventDefault();
      return;
    }
    if (event.target instanceof Element && event.target.closest('[data-file-menu-action]')) {
      details.open = false;
    }
  });

  details.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !details.open) return;
    event.preventDefault();
    details.open = false;
    trigger.focus();
  });

  document.addEventListener('click', event => {
    if (event.target instanceof Node && !details.contains(event.target)) {
      details.open = false;
    }
  });
}
