import JSZip from 'jszip';
import { describe, expect, it, vi } from 'vitest';
import { exportPackage, importPackage } from './archive';

async function createPackage(files: Record<string, string>, notes?: object): Promise<File> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) zip.file(path, content);
  if (notes) zip.file('laccite-project-notes.json', JSON.stringify(notes));
  const blob = await zip.generateAsync({ type: 'blob' });
  return new File([blob], 'portable-project.zip', { type: 'application/zip' });
}

describe('portable project notes', () => {
  it('exports identities and annotations so a full ZIP round-trip restores them', async () => {
    let output: Blob | undefined;
    vi.stubGlobal('URL', {
      createObjectURL: (blob: Blob) => {
        output = blob;
        return 'blob:project-export';
      },
      revokeObjectURL: () => undefined
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    try {
      await exportPackage(
        [{
          projectId: 'source-project',
          resourceId: 'stable-resource',
          path: 'textures/wall.png',
          blob: new Blob(['image data']),
          mimeType: 'image/png',
          kind: 'source'
        }],
        [],
        'portable-project',
        {
          projectNotes: [
            {
              projectId: 'source-project',
              id: 'memo-1',
              title: 'Palette',
              content: 'Keep the stone palette',
              createdAt: 1,
              updatedAt: 1
            },
            {
              projectId: 'source-project',
              id: 'memo-2',
              title: 'Moodboard',
              content: 'Night lighting',
              createdAt: 2,
              updatedAt: 2
            }
          ],
          projectTodos: [],
          resourceNotes: [
            {
              projectId: 'source-project',
              id: 'resource-memo-1',
              resourceId: 'stable-resource',
              lastKnownPath: 'textures/wall.png',
              title: 'Usage',
              content: 'Used in the cave',
              createdAt: 2,
              updatedAt: 2
            },
            {
              projectId: 'source-project',
              id: 'resource-memo-2',
              resourceId: 'stable-resource',
              lastKnownPath: 'textures/wall.png',
              title: 'Color',
              content: 'Warm stone',
              createdAt: 3,
              updatedAt: 3
            }
          ]
        }
      );
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
    }

    expect(output).toBeDefined();
    const imported = await importPackage(
      new File([output!], 'portable-project.zip', { type: 'application/zip' }),
      'destination-project'
    );
    expect(imported.files.find(file => file.path === 'textures/wall.png')?.resourceId).toBe('stable-resource');
    expect(imported.notes?.projectNotes).toMatchObject([
      { title: 'Palette', content: 'Keep the stone palette' },
      { title: 'Moodboard', content: 'Night lighting' }
    ]);
    expect(imported.notes?.resourceNotes).toHaveLength(2);
    expect(imported.notes?.resourceNotes[0]).toMatchObject({
      projectId: 'destination-project',
      id: 'resource-memo-1',
      resourceId: 'stable-resource',
      lastKnownPath: 'textures/wall.png',
      title: 'Usage',
      content: 'Used in the cave'
    });
  });

  it('imports notes and stable resource identities without exposing the manifest as a project file', async () => {
    const projectId = crypto.randomUUID();
    const resourceId = 'texture-resource-1';
    const file = await createPackage(
      { 'textures/wall.png': 'image data' },
      {
        format: 'laccite-project-notes',
        version: 1,
        resources: [{ path: 'textures/wall.png', resourceId }],
        notes: {
          projectNote: { projectId: 'old-project', content: 'Project context', updatedAt: 1 },
          projectTodos: [{
            projectId: 'old-project',
            id: 'todo-1',
            text: 'Review the wall texture',
            completed: true,
            createdAt: 1,
            updatedAt: 2
          }],
          resourceNotes: [{
            projectId: 'old-project',
            resourceId,
            lastKnownPath: 'textures/wall.png',
            content: 'Used in the cave',
            updatedAt: 3
          }]
        }
      }
    );

    const imported = await importPackage(file, projectId);

    expect(imported.files.find(item => item.path === 'textures/wall.png')?.resourceId).toBe(resourceId);
    expect(imported.files.some(item => item.path === 'laccite-project-notes.json')).toBe(false);
    expect(imported.notes).toEqual({
      projectNotes: [{
        projectId, id: expect.any(String), title: 'Nota importada', content: 'Project context', createdAt: 1, updatedAt: 1
      }],
      projectTodos: [{
        projectId,
        id: 'todo-1',
        text: 'Review the wall texture',
        completed: true,
        createdAt: 1,
        updatedAt: 2
      }],
      resourceNotes: [{
        projectId,
        id: expect.any(String),
        resourceId,
        lastKnownPath: 'textures/wall.png',
        title: 'Nota importada',
        content: 'Used in the cave',
        createdAt: 3,
        updatedAt: 3
      }]
    });
  });

  it('imports older ZIPs without a notes manifest', async () => {
    const imported = await importPackage(await createPackage({ 'textures/old.png': 'image data' }), crypto.randomUUID());

    expect(imported.notes).toBeUndefined();
    expect(imported.files.find(item => item.path === 'textures/old.png')?.resourceId).toBeTruthy();
  });

  it('reports an invalid notes manifest instead of silently importing it as a resource', async () => {
    const file = await createPackage(
      { 'textures/wall.png': 'image data' },
      { format: 'unknown', version: 7 }
    );

    await expect(importPackage(file, crypto.randomUUID())).rejects.toThrow('formato que esta versión no reconoce');
  });
});
