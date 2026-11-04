import { describe, expect, it } from 'vitest';
import { setExplorerMenuEnabled } from './explorer-menu';
import { bindFileMenu } from './file-menu';

describe('explorer menu availability', () => {
  function createMenu(): { details: HTMLDetailsElement; trigger: HTMLElement } {
    document.body.innerHTML = `
      <details>
        <summary aria-disabled="false">Explorador</summary>
        <div class="file-menu-popover"><button>Crear carpeta</button></div>
      </details>
    `;
    const details = document.querySelector('details')!;
    const trigger = document.querySelector('summary')!;
    bindFileMenu(details, trigger);
    return { details, trigger };
  }

  it('disables and closes the menu outside the manager view', () => {
    const { details, trigger } = createMenu();
    details.open = true;

    setExplorerMenuEnabled(details, trigger, false);

    expect(details.open).toBe(false);
    expect(details.inert).toBe(true);
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
  });

  it('prevents opening the menu while it is disabled', () => {
    const { details, trigger } = createMenu();
    setExplorerMenuEnabled(details, trigger, false);

    trigger.click();

    expect(details.open).toBe(false);
  });

  it('restores menu interaction in the manager view', () => {
    const { details, trigger } = createMenu();
    setExplorerMenuEnabled(details, trigger, false);

    setExplorerMenuEnabled(details, trigger, true);
    trigger.click();

    expect(details.inert).toBe(false);
    expect(trigger.getAttribute('aria-disabled')).toBe('false');
    expect(details.open).toBe(true);
  });
});
