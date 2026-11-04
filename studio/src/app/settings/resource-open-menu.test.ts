import { afterEach, describe, expect, it } from 'vitest';
import { getShowResourceMenuOnActivation, setShowResourceMenuOnActivation } from './resource-open-menu';

describe('resource menu on activation setting', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('is enabled by default to preserve the current behavior', () => {
    expect(getShowResourceMenuOnActivation()).toBe(true);
  });

  it('persists when disabled and can be enabled again', () => {
    setShowResourceMenuOnActivation(false);
    expect(getShowResourceMenuOnActivation()).toBe(false);

    setShowResourceMenuOnActivation(true);
    expect(getShowResourceMenuOnActivation()).toBe(true);
  });
});
