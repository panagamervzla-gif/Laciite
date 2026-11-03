import { describe, expect, it } from 'vitest';
import { buildResourceDeletionPlan } from './resource-deletion';

describe('resource deletion plan', () => {
  it('plans deletion of selected files and their texture mappings', () => {
    const plan = buildResourceDeletionPlan(
      [{ path: 'textures/wall.png', directory: false }],
      ['textures/wall.png', 'textures/floor.png'],
      ['textures'],
      [
        { id: 'wall-mapping', resourcePath: 'textures/wall.png' },
        { id: 'floor-mapping', resourcePath: 'textures/floor.png' }
      ]
    );

    expect(plan).toEqual({
      removedPaths: ['textures/wall.png'],
      remainingDirectories: ['textures'],
      removeMappingIds: ['wall-mapping']
    });
  });

  it('includes all descendant files and folders when deleting a directory', () => {
    const plan = buildResourceDeletionPlan(
      [{ path: 'textures/ui', directory: true }],
      ['textures/ui/button.png', 'textures/ui/nested/icon.png', 'textures/background.png'],
      ['textures', 'textures/ui', 'textures/ui/nested'],
      [
        { id: 'button', resourcePath: 'textures/ui/button.png' },
        { id: 'background', resourcePath: 'textures/background.png' }
      ]
    );

    expect(plan).toEqual({
      removedPaths: ['textures/ui/button.png', 'textures/ui/nested/icon.png'],
      remainingDirectories: ['textures'],
      removeMappingIds: ['button']
    });
  });
});
