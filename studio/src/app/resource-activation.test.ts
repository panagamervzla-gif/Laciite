import { describe, expect, it, vi } from 'vitest';
import { bindResourceActivation } from './resource-activation';

describe('resource activation', () => {
  it('shows the actions menu on Enter when the preference is enabled', () => {
    const card = document.createElement('button');
    const openActions = vi.fn();
    const openDirectly = vi.fn();
    bindResourceActivation(card, () => true, openActions, openDirectly);

    card.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));

    expect(openActions).toHaveBeenCalledOnce();
    expect(openDirectly).not.toHaveBeenCalled();
  });

  it('opens the resource directly on Enter when the preference is disabled', () => {
    const card = document.createElement('button');
    const openActions = vi.fn();
    const openDirectly = vi.fn();
    bindResourceActivation(card, () => false, openActions, openDirectly);

    card.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));

    expect(openDirectly).toHaveBeenCalledOnce();
    expect(openActions).not.toHaveBeenCalled();
  });

  it('opens the resource directly on double-click when the preference is disabled', () => {
    const card = document.createElement('button');
    const openActions = vi.fn();
    const openDirectly = vi.fn();
    bindResourceActivation(card, () => false, openActions, openDirectly);

    card.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));

    expect(openDirectly).toHaveBeenCalledOnce();
    expect(openActions).not.toHaveBeenCalled();
  });

  it('continues to show the actions menu on double-click when enabled', () => {
    const card = document.createElement('button');
    const openActions = vi.fn();
    const openDirectly = vi.fn();
    bindResourceActivation(card, () => true, openActions, openDirectly);

    card.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));

    expect(openActions).toHaveBeenCalledOnce();
    expect(openDirectly).not.toHaveBeenCalled();
  });
});
