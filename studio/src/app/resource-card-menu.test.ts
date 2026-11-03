import { describe, expect, it, vi } from 'vitest';
import { createResourceCardMenu } from './resource-card-menu';

describe('resource card menu', () => {
  it('creates a separate, labeled menu button that opens actions for the resource', () => {
    const card = document.createElement('button');
    const openActions = vi.fn();
    const wrapper = createResourceCardMenu(card, 'textures/a.png', 'a.png', openActions);
    const menuButton = wrapper.querySelector<HTMLButtonElement>('.resource-card-menu')!;

    expect(menuButton.type).toBe('button');
    expect(menuButton.getAttribute('aria-label')).toBe('Más opciones para a.png');
    expect(menuButton.parentElement).toBe(wrapper);
    expect(card.parentElement).toBe(wrapper);

    menuButton.click();

    expect(openActions).toHaveBeenCalledWith('textures/a.png');
  });

  it('opens the same resource actions on right-click without the browser context menu', () => {
    const card = document.createElement('button');
    const openActions = vi.fn();
    const wrapper = createResourceCardMenu(card, 'textures', 'textures', openActions);
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });

    wrapper.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(openActions).toHaveBeenCalledWith('textures');
  });
});
