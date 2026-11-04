import { afterEach, describe, expect, it } from 'vitest';
import { bindFileMenu } from './file-menu';

describe('file menu', () => {
  afterEach(() => {
    Reflect.deleteProperty(document.documentElement, 'clientWidth');
    Reflect.deleteProperty(document.documentElement, 'clientHeight');
    document.body.replaceChildren();
  });

  function createMenu(): { details: HTMLDetailsElement; trigger: HTMLElement; action: HTMLButtonElement } {
    document.body.innerHTML = `
      <details>
        <summary>Archivo</summary>
        <div class="file-menu-popover"><button data-file-menu-action>Compilar</button></div>
      </details>
      <button>Outside</button>
    `;
    const details = document.querySelector('details')!;
    const trigger = details.querySelector('summary')!;
    const action = details.querySelector<HTMLButtonElement>('[data-file-menu-action]')!;
    bindFileMenu(details, trigger);
    return { details, trigger, action };
  }

  it('closes after choosing a menu action', () => {
    const { details, action } = createMenu();
    details.open = true;

    action.click();

    expect(details.open).toBe(false);
  });

  it('closes when clicking outside the menu', () => {
    const { details } = createMenu();
    details.open = true;

    document.querySelector<HTMLButtonElement>('body > button')!.click();

    expect(details.open).toBe(false);
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const { details, trigger } = createMenu();
    details.open = true;
    details.querySelector<HTMLButtonElement>('[data-file-menu-action]')!.focus();

    details.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('positions an open menu inside the viewport when its trigger is near the right edge', () => {
    const { details, trigger } = createMenu();
    const popover = details.querySelector<HTMLElement>('.file-menu-popover')!;
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1280 });
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 720 });
    Object.defineProperty(trigger, 'getBoundingClientRect', {
      value: () => new DOMRect(1230, 0, 40, 40)
    });
    Object.defineProperty(popover, 'getBoundingClientRect', {
      value: () => new DOMRect(0, 0, 190, 100)
    });

    details.open = true;
    details.dispatchEvent(new Event('toggle'));

    expect(popover.style.position).toBe('fixed');
    expect(popover.style.left).toBe('1082px');
    expect(popover.style.top).toBe('41px');
  });

  it('shrinks an open menu to fit a narrow viewport', () => {
    const { details, trigger } = createMenu();
    const popover = details.querySelector<HTMLElement>('.file-menu-popover')!;
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 200 });
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 300 });
    Object.defineProperty(trigger, 'getBoundingClientRect', {
      value: () => new DOMRect(14, 0, 60, 40)
    });

    details.open = true;
    details.dispatchEvent(new Event('toggle'));

    expect(popover.style.width).toBe('184px');
    expect(popover.style.left).toBe('8px');
    expect(Number.parseFloat(popover.style.left) + Number.parseFloat(popover.style.width)).toBeLessThanOrEqual(192);
  });
});
