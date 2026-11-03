import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createProject,
  deleteProjectNotes,
  deleteProjectCompletely,
  deleteResourceNotes,
  getProjectFiles,
  getProjectNotes,
  getProjectTodos,
  getResourceNotes,
  saveProjectResources,
  saveProjectTodo,
  saveProjectNote,
  saveResourceNote
} from './storage';
import type { ProjectFile, ProjectRecord } from './types';

const createdProjectIds: string[] = [];

function createTestProject(): ProjectRecord {
  const projectId = crypto.randomUUID();
  createdProjectIds.push(projectId);
  return {
    id: projectId,
    name: 'Notes test',
    createdAt: 1,
    updatedAt: 1,
    fileCount: 1,
    directories: [],
    dictionaryPath: 'texture-dictionary.txt'
  };
}

function createTestFile(projectId: string, path = 'textures/original.png'): ProjectFile {
  return {
    projectId,
    resourceId: 'stable-resource-id',
    path,
    blob: new Blob(['texture']),
    mimeType: 'image/png',
    kind: 'source'
  };
}

afterEach(async () => {
  await Promise.all(createdProjectIds.splice(0).map(projectId => deleteProjectCompletely(projectId)));
});

describe('project and resource notes storage', () => {
  it('persists multiple project notes and checklist items independently', async () => {
    const project = createTestProject();
    await createProject(project, []);
    await saveProjectNote({
      projectId: project.id,
      id: 'memo-1',
      title: 'Palette',
      content: 'Project notes',
      createdAt: 1,
      updatedAt: 1
    });
    await saveProjectNote({
      projectId: project.id,
      id: 'memo-2',
      title: 'References',
      content: 'Reference notes',
      createdAt: 2,
      updatedAt: 2
    });
    await saveProjectTodo({
      projectId: project.id,
      id: 'todo-1',
      text: 'Review textures',
      completed: false,
      createdAt: 1,
      updatedAt: 1
    });

    expect(await getProjectNotes(project.id)).toMatchObject([
      { id: 'memo-1', title: 'Palette', content: 'Project notes' },
      { id: 'memo-2', title: 'References', content: 'Reference notes' }
    ]);
    expect(await getProjectTodos(project.id)).toEqual([expect.objectContaining({
      id: 'todo-1',
      text: 'Review textures',
      completed: false
    })]);
  });

  it('creates imported annotations under the new project ID', async () => {
    const project = createTestProject();
    const file = createTestFile(project.id);
    await createProject(project, [file], [], {
      projectNotes: [{
        projectId: 'previous-project',
        id: 'memo-1',
        title: 'Imported context',
        content: 'Context',
        createdAt: 1,
        updatedAt: 1
      }],
      projectTodos: [{
        projectId: 'previous-project',
        id: 'todo-1',
        text: 'Check the palette',
        completed: true,
        createdAt: 1,
        updatedAt: 1
      }],
      resourceNotes: [{
        projectId: 'previous-project',
        id: 'resource-memo-1',
        resourceId: file.resourceId!,
        lastKnownPath: file.path,
        title: 'Imported note',
        content: 'Imported file note',
        createdAt: 1,
        updatedAt: 1
      }]
    });

    expect(await getProjectNotes(project.id)).toMatchObject([{ projectId: project.id, title: 'Imported context', content: 'Context' }]);
    expect(await getProjectTodos(project.id)).toMatchObject([expect.objectContaining({ projectId: project.id })]);
    expect(await getResourceNotes(project.id, file.resourceId!)).toMatchObject([{
      projectId: project.id,
      id: 'resource-memo-1',
      title: 'Imported note',
      content: 'Imported file note'
    }]);
  });

  it('assigns and persists a stable identity when migrating an existing file without one', async () => {
    const project = createTestProject();
    const file = createTestFile(project.id);
    const db = await openDB('texture-workbench', 4);
    await db.put('projects', project);
    await db.put('files', { ...file, resourceId: undefined });
    db.close();

    const [firstRead] = await getProjectFiles(project.id);
    const [secondRead] = await getProjectFiles(project.id);

    expect(firstRead.resourceId).toBeTruthy();
    expect(secondRead.resourceId).toBe(firstRead.resourceId);
  });

  it('keeps a file note attached to its stable resource ID after a rename', async () => {
    const project = createTestProject();
    const file = createTestFile(project.id);
    await createProject(project, [file]);
    await saveResourceNote({
      projectId: project.id,
      id: 'memo-1',
      resourceId: file.resourceId!,
      lastKnownPath: file.path,
      title: 'Keep reference',
      content: 'Keep this material for the cave walls',
      createdAt: 1,
      updatedAt: 1
    });
    await saveResourceNote({
      projectId: project.id,
      id: 'memo-2',
      resourceId: file.resourceId!,
      lastKnownPath: file.path,
      title: 'Lighting',
      content: 'Second note',
      createdAt: 2,
      updatedAt: 2
    });

    await saveProjectResources(project, [{ ...file, path: 'materials/cave-wall.png' }], [file.path]);

    const [renamed] = await getProjectFiles(project.id);
    expect(renamed.resourceId).toBe(file.resourceId);
    expect(await getResourceNotes(project.id, file.resourceId!)).toMatchObject([
      { id: 'memo-1', lastKnownPath: 'materials/cave-wall.png', content: 'Keep this material for the cave walls' },
      { id: 'memo-2', lastKnownPath: 'materials/cave-wall.png', content: 'Second note' }
    ]);
  });

  it('does not copy a source file note to a duplicated resource identity', async () => {
    const project = createTestProject();
    const source = createTestFile(project.id);
    const copy = { ...source, resourceId: 'copied-resource-id', path: 'textures/copy.png' };
    await createProject(project, [source]);
    await saveResourceNote({
      projectId: project.id,
      id: 'memo-1',
      resourceId: source.resourceId!,
      lastKnownPath: source.path,
      title: 'Source-only note',
      content: 'Source-only note',
      createdAt: 1,
      updatedAt: 1
    });

    await saveProjectResources(project, [copy]);

    expect(await getResourceNotes(project.id, source.resourceId!)).toMatchObject([{ content: 'Source-only note' }]);
    expect(await getResourceNotes(project.id, copy.resourceId!)).toEqual([]);
  });

  it('retains a deleted resource note as an orphan', async () => {
    const project = createTestProject();
    const file = createTestFile(project.id);
    await createProject(project, [file]);
    await saveResourceNote({
      projectId: project.id,
      id: 'memo-1',
      resourceId: file.resourceId!,
      lastKnownPath: file.path,
      title: 'Original source reference',
      content: 'Original source reference',
      createdAt: 1,
      updatedAt: 1
    });

    await saveProjectResources(project, [], [file.path]);

    expect(await getProjectFiles(project.id)).toHaveLength(0);
    expect(await getResourceNotes(project.id, file.resourceId!)).toMatchObject([{
      lastKnownPath: file.path,
      content: 'Original source reference'
    }]);
  });

  it('deletes only the requested project and resource notes', async () => {
    const project = createTestProject();
    const file = createTestFile(project.id);
    await createProject(project, [file]);
    for (const id of ['memo-1', 'memo-2']) {
      await saveProjectNote({
        projectId: project.id, id, title: id, content: id, createdAt: 1, updatedAt: 1
      });
      await saveResourceNote({
        projectId: project.id, id, resourceId: file.resourceId!, lastKnownPath: file.path,
        title: id, content: id, createdAt: 1, updatedAt: 1
      });
    }

    await deleteProjectNotes(project.id, ['memo-1']);
    await deleteResourceNotes(project.id, ['memo-2']);

    expect(await getProjectNotes(project.id)).toMatchObject([{ id: 'memo-2' }]);
    expect(await getResourceNotes(project.id, file.resourceId!)).toMatchObject([{ id: 'memo-1' }]);
  });

  it('removes a project and all of its notes and tasks together', async () => {
    const project = createTestProject();
    const file = createTestFile(project.id);
    await createProject(project, [file]);
    await saveProjectNote({
      projectId: project.id, id: 'memo-1', title: 'Project note', content: 'Project notes', createdAt: 1, updatedAt: 1
    });
    await saveProjectTodo({
      projectId: project.id,
      id: 'todo-1',
      text: 'Review textures',
      completed: false,
      createdAt: 1,
      updatedAt: 1
    });
    await saveResourceNote({
      projectId: project.id,
      id: 'resource-memo-1',
      resourceId: file.resourceId!,
      lastKnownPath: file.path,
      title: 'Texture note',
      content: 'Texture notes',
      createdAt: 1,
      updatedAt: 1
    });

    await deleteProjectCompletely(project.id);
    createdProjectIds.splice(createdProjectIds.indexOf(project.id), 1);

    expect(await getProjectNotes(project.id)).toEqual([]);
    expect(await getProjectTodos(project.id)).toEqual([]);
    expect(await getResourceNotes(project.id, file.resourceId!)).toEqual([]);
  });
});
