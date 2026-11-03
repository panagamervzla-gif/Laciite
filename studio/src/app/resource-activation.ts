export function bindResourceActivation(
  card: HTMLElement,
  shouldShowMenu: () => boolean,
  openActions: () => void,
  openDirectly: () => void
): void {
  const activate = (): void => {
    if (shouldShowMenu()) openActions();
    else openDirectly();
  };

  card.addEventListener('click', event => {
    if (event.detail !== 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    activate();
  });

  card.addEventListener('dblclick', event => {
    event.preventDefault();
    activate();
  });
}
