export function createResourceCardMenu(
  card: HTMLElement,
  resourcePath: string,
  resourceName: string,
  openActions: (path: string) => void
): HTMLDivElement {
  const wrapper = card.ownerDocument.createElement('div');
  wrapper.className = 'resource-card-wrapper';
  wrapper.addEventListener('contextmenu', event => {
    event.preventDefault();
    openActions(resourcePath);
  });

  const menuButton = card.ownerDocument.createElement('button');
  menuButton.className = 'resource-card-menu';
  menuButton.type = 'button';
  menuButton.setAttribute('aria-label', `Más opciones para ${resourceName}`);
  menuButton.title = 'Más opciones';
  menuButton.textContent = '⋯';
  menuButton.addEventListener('click', event => {
    event.stopPropagation();
    openActions(resourcePath);
  });

  wrapper.append(card, menuButton);
  return wrapper;
}
