import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createProject,
  deleteProjectCompletely,
  getProjectFiles,
  getProjectNote,
  getProjectTodos,
  getResourceNote,
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
  it('persists project notes and checklist items independently', async () => {
    const project = createTestProject();
    await createProject(project, []);
    await saveProjectNote(project.id, 'Project notes');
    await saveProjectTodo({
      projectId: project.id,
      id: 'todo-1',
      text: 'Review textures',
      completed: false,
      createdAt: 1,
      updatedAt: 1
    });

    expect(await getProjectNote(project.id)).toMatchObject({
      projectId: project.id,
      content: 'Project notes'
    });
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
      projectNote: { projectId: 'previous-project', content: 'Imported context', updatedAt: 1 },
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
        resourceId: file.resourceId!,
        lastKnownPath: file.path,
        content: 'Imported file note',
        updatedAt: 1
      }]
    });

    expect(await getProjectNote(project.id)).toMatchObject({ projectId: project.id, content: 'Imported context' });
    expect(await getProjectTodos(project.id)).toMatchObject([expect.objectContaining({ projectId: project.id })]);
    expect(await getResourceNote(project.id, file.resourceId!)).toMatchObject({
      projectId: project.id,
      content: 'Imported file note'
    });
  });

  it('assigns and persists a stable identity when migrating an existing file without one', async () => {
    const project = createTestProject();
    const file = createTestFile(project.id);
    const db = await openDB('texture-workbench', 3);
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
      resourceId: file.resourceId!,
      lastKnownPath: file.path,
      content: 'Keep this material for the cave walls',
      updatedAt: 1
    });

    await saveProjectResources(project, [{ ...file, path: 'materials/cave-wall.png' }], [file.path]);

    const [renamed] = await getProjectFiles(project.id);
    expect(renamed.resourceId).toBe(file.resourceId);
    expect(await getResourceNote(project.id, file.resourceId!)).toMatchObject({
      resourceId: file.resourceId,
      lastKnownPath: 'materials/cave-wall.png',
      content: 'Keep this material for the cave walls'
    });
  });

  it('does not copy a source file note to a duplicated resource identity', async () => {
    const project = createTestProject();
    const source = createTestFile(project.id);
    const copy = { ...source, resourceId: 'copied-resource-id', path: 'textures/copy.png' };
    await createProject(project, [source]);
    await saveResourceNote({
      projectId: project.id,
      resourceId: source.resourceId!,
      lastKnownPath: source.path,
      content: 'Source-only note',
      updatedAt: 1
    });

    await saveProjectResources(project, [copy]);

    expect(await getResourceNote(project.id, source.resourceId!)).toMatchObject({ content: 'Source-only note' });
    expect(await getResourceNote(project.id, copy.resourceId!)).toBeUndefined();
  });

  it('retains a deleted resource note as an orphan', async () => {
    const project = createTestProject();
    const file = createTestFile(project.id);
    await createProject(project, [file]);
    await saveResourceNote({
      projectId: project.id,
      resourceId: file.resourceId!,
      lastKnownPath: file.path,
      content: 'Original source reference',
      updatedAt: 1
    });

    await saveProjectResources(project, [], [file.path]);

    expect(await getProjectFiles(project.id)).toHaveLength(0);
    expect(await getResourceNote(project.id, file.resourceId!)).toMatchObject({
      lastKnownPath: file.path,
      content: 'Original source reference'
    });
  });

  it('removes a project and all of its notes and tasks together', async () => {
    const project = createTestProject();
    const file = createTestFile(project.id);
    await createProject(project, [file]);
    await saveProjectNote(project.id, 'Project notes');
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
      resourceId: file.resourceId!,
      lastKnownPath: file.path,
      content: 'Texture notes',
      updatedAt: 1
    });

    await deleteProjectCompletely(project.id);
    createdProjectIds.splice(createdProjectIds.indexOf(project.id), 1);

    expect(await getProjectNote(project.id)).toBeUndefined();
    expect(await getProjectTodos(project.id)).toEqual([]);
    expect(await getResourceNote(project.id, file.resourceId!)).toBeUndefined();
  });
});
