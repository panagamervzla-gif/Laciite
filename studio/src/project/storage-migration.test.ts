import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { describe, expect, it } from 'vitest';

describe('project notes database migration', () => {
  it('discards legacy notes while preserving project tasks', async () => {
    const legacy = await openDB('texture-workbench', 3, {
      upgrade(db) {
        db.createObjectStore('projects', { keyPath: 'id' });
        db.createObjectStore('files', { keyPath: ['projectId', 'path'] }).createIndex('by-project', 'projectId');
        db.createObjectStore('textureMappings', { keyPath: ['projectId', 'id'] }).createIndex('by-project', 'projectId');
        db.createObjectStore('projectNotes', { keyPath: 'projectId' });
        db.createObjectStore('projectTodos', { keyPath: ['projectId', 'id'] }).createIndex('by-project', 'projectId');
        db.createObjectStore('resourceNotes', { keyPath: ['projectId', 'resourceId'] }).createIndex('by-project', 'projectId');
      }
    });
    await legacy.put('projects', {
      id: 'project-1', name: 'Preserved project', createdAt: 1, updatedAt: 1,
      fileCount: 1, directories: [], dictionaryPath: 'dictionary.json'
    });
    await legacy.put('files', {
      projectId: 'project-1', path: 'textures/wall.png', blob: new Blob(['image']),
      mimeType: 'image/png', kind: 'source'
    });
    await legacy.put('textureMappings', {
      projectId: 'project-1', id: 'mapping-1', hash: 'hash-1',
      targetPath: 'textures/wall.png', order: 0
    });
    await legacy.put('projectNotes', { projectId: 'project-1', content: 'Legacy general note', updatedAt: 1 });
    await legacy.put('resourceNotes', {
      projectId: 'project-1', resourceId: 'resource-1', lastKnownPath: 'old.png', content: 'Legacy file note', updatedAt: 1
    });
    await legacy.put('projectTodos', {
      projectId: 'project-1', id: 'todo-1', text: 'Keep this task', completed: false, createdAt: 1, updatedAt: 1
    });
    legacy.close();

    const storage = await import('./storage');

    expect(await storage.getProjectNotes('project-1')).toEqual([]);
    expect(await storage.getProjectResourceNotes('project-1')).toEqual([]);
    expect(await storage.getProjectTodos('project-1')).toMatchObject([{ id: 'todo-1', text: 'Keep this task' }]);
    expect(await storage.getProject('project-1')).toMatchObject({ name: 'Preserved project' });
    expect(await storage.getProjectFiles('project-1')).toMatchObject([{ path: 'textures/wall.png' }]);
    expect(await storage.getProjectTextureMappings('project-1')).toMatchObject([{ id: 'mapping-1' }]);
  });
});
