import { openDB, type DBSchema } from 'idb';
import type {
  ProjectFile,
  ProjectNoteRecord,
  ProjectNotesBundle,
  ProjectRecord,
  ProjectTodoRecord,
  ResourceNoteRecord,
  TextureMappingRecord
} from './types';

interface TextureWorkbenchDB extends DBSchema {
  projects: { key: string; value: ProjectRecord };
  files: { key: [string, string]; value: ProjectFile; indexes: { 'by-project': string } };
  textureMappings: { key: [string, string]; value: TextureMappingRecord; indexes: { 'by-project': string } };
  projectNotes: { key: string; value: { projectId: string; content: string; updatedAt: number } };
  resourceNotes: {
    key: [string, string];
    value: { projectId: string; resourceId: string; lastKnownPath: string; content: string; updatedAt: number };
  };
  projectMemos: { key: [string, string]; value: ProjectNoteRecord; indexes: { 'by-project': string } };
  projectTodos: { key: [string, string]; value: ProjectTodoRecord; indexes: { 'by-project': string } };
  resourceMemos: {
    key: [string, string];
    value: ResourceNoteRecord;
    indexes: { 'by-project': string; 'by-resource': [string, string] };
  };
}

const database = openDB<TextureWorkbenchDB>('texture-workbench', 4, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: ['projectId', 'path'] }).createIndex('by-project', 'projectId');
    if (!db.objectStoreNames.contains('textureMappings')) {
      db.createObjectStore('textureMappings', { keyPath: ['projectId', 'id'] }).createIndex('by-project', 'projectId');
    }
    if (!db.objectStoreNames.contains('projectTodos')) {
      db.createObjectStore('projectTodos', { keyPath: ['projectId', 'id'] }).createIndex('by-project', 'projectId');
    }
    if (oldVersion < 4) {
      if (db.objectStoreNames.contains('projectNotes')) db.deleteObjectStore('projectNotes');
      if (db.objectStoreNames.contains('resourceNotes')) db.deleteObjectStore('resourceNotes');
    }
    if (!db.objectStoreNames.contains('projectMemos')) {
      db.createObjectStore('projectMemos', { keyPath: ['projectId', 'id'] }).createIndex('by-project', 'projectId');
    }
    if (!db.objectStoreNames.contains('resourceMemos')) {
      const store = db.createObjectStore('resourceMemos', { keyPath: ['projectId', 'id'] });
      store.createIndex('by-project', 'projectId');
      store.createIndex('by-resource', ['projectId', 'resourceId']);
    }
  }
});

export interface TextureMappingChanges {
  upsert?: TextureMappingRecord[];
  removeIds?: string[];
}

function ensureResourceId(file: ProjectFile): ProjectFile {
  return file.resourceId ? file : { ...file, resourceId: crypto.randomUUID() };
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const db = await database;
  return (await db.getAll('projects')).sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function getProject(projectId: string): Promise<ProjectRecord | undefined> {
  return (await database).get('projects', projectId);
}

export async function deleteProjectCompletely(projectId: string): Promise<void> {
  const db = await database;
  const transaction = db.transaction(
    ['projects', 'files', 'textureMappings', 'projectMemos', 'projectTodos', 'resourceMemos'],
    'readwrite'
  );
  const fileStore = transaction.objectStore('files');
  const mappingStore = transaction.objectStore('textureMappings');
  const todoStore = transaction.objectStore('projectTodos');
  const projectMemoStore = transaction.objectStore('projectMemos');
  const resourceMemoStore = transaction.objectStore('resourceMemos');
  const [fileKeys, mappingKeys, todoKeys, projectMemoKeys, resourceMemoKeys] = await Promise.all([
    fileStore.index('by-project').getAllKeys(projectId),
    mappingStore.index('by-project').getAllKeys(projectId),
    todoStore.index('by-project').getAllKeys(projectId),
    projectMemoStore.index('by-project').getAllKeys(projectId),
    resourceMemoStore.index('by-project').getAllKeys(projectId)
  ]);
  const deletions: Promise<unknown>[] = [];
  for (const key of fileKeys) deletions.push(fileStore.delete(key));
  for (const key of mappingKeys) deletions.push(mappingStore.delete(key));
  for (const key of todoKeys) deletions.push(todoStore.delete(key));
  for (const key of projectMemoKeys) deletions.push(projectMemoStore.delete(key));
  for (const key of resourceMemoKeys) deletions.push(resourceMemoStore.delete(key));
  deletions.push(transaction.objectStore('projects').delete(projectId));
  await Promise.all(deletions);
  await transaction.done;
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const db = await database;
  const transaction = db.transaction('files', 'readwrite');
  const files = await transaction.store.index('by-project').getAll(projectId);
  const normalizedFiles = files.map(ensureResourceId);
  const migrations = normalizedFiles
    .filter((file, index) => file.resourceId !== files[index].resourceId)
    .map(file => transaction.store.put(file));
  await Promise.all(migrations);
  await transaction.done;
  return normalizedFiles.sort((left, right) => left.path.localeCompare(right.path));
}

export async function getProjectFile(projectId: string, path: string): Promise<ProjectFile | undefined> {
  return (await database).get('files', [projectId, path]);
}

export async function getProjectTextureMappings(projectId: string): Promise<TextureMappingRecord[]> {
  const db = await database;
  return (await db.getAllFromIndex('textureMappings', 'by-project', projectId)).sort((left, right) => left.order - right.order);
}

export async function getProjectNotes(projectId: string): Promise<ProjectNoteRecord[]> {
  const notes = await (await database).getAllFromIndex('projectMemos', 'by-project', projectId);
  return notes.sort((left, right) => left.createdAt - right.createdAt);
}

export async function saveProjectNote(note: ProjectNoteRecord): Promise<void> {
  await (await database).put('projectMemos', { ...note, updatedAt: Date.now() });
}

export async function deleteProjectNotes(projectId: string, noteIds: string[]): Promise<void> {
  const db = await database;
  const transaction = db.transaction('projectMemos', 'readwrite');
  await Promise.all(noteIds.map(id => transaction.store.delete([projectId, id])));
  await transaction.done;
}

export async function getProjectTodos(projectId: string): Promise<ProjectTodoRecord[]> {
  const todos = await (await database).getAllFromIndex('projectTodos', 'by-project', projectId);
  return todos.sort((left, right) => left.createdAt - right.createdAt);
}

export async function saveProjectTodo(todo: ProjectTodoRecord): Promise<void> {
  await (await database).put('projectTodos', { ...todo, updatedAt: Date.now() });
}

export async function deleteProjectTodo(projectId: string, todoId: string): Promise<void> {
  await (await database).delete('projectTodos', [projectId, todoId]);
}

export async function deleteProjectTodos(projectId: string, todoIds: string[]): Promise<void> {
  const db = await database;
  const transaction = db.transaction('projectTodos', 'readwrite');
  await Promise.all(todoIds.map(id => transaction.store.delete([projectId, id])));
  await transaction.done;
}

export async function getResourceNotes(projectId: string, resourceId: string): Promise<ResourceNoteRecord[]> {
  const notes = await (await database).getAllFromIndex('resourceMemos', 'by-resource', [projectId, resourceId]);
  return notes.sort((left, right) => left.createdAt - right.createdAt);
}

export async function getProjectResourceNotes(projectId: string): Promise<ResourceNoteRecord[]> {
  const notes = await (await database).getAllFromIndex('resourceMemos', 'by-project', projectId);
  return notes.sort((left, right) => left.lastKnownPath.localeCompare(right.lastKnownPath)
    || left.createdAt - right.createdAt);
}

export async function saveResourceNote(note: ResourceNoteRecord): Promise<void> {
  await (await database).put('resourceMemos', { ...note, updatedAt: Date.now() });
}

export async function deleteResourceNotes(projectId: string, noteIds: string[]): Promise<void> {
  const db = await database;
  const transaction = db.transaction('resourceMemos', 'readwrite');
  await Promise.all(noteIds.map(id => transaction.store.delete([projectId, id])));
  await transaction.done;
}

export async function createProject(
  project: ProjectRecord,
  files: ProjectFile[],
  mappings: TextureMappingRecord[] = [],
  notes?: ProjectNotesBundle
): Promise<void> {
  const db = await database;
  const transaction = db.transaction(
    ['projects', 'files', 'textureMappings', 'projectMemos', 'projectTodos', 'resourceMemos'],
    'readwrite'
  );
  const writes: Promise<unknown>[] = [transaction.objectStore('projects').put(project)];
  const fileStore = transaction.objectStore('files');
  const mappingStore = transaction.objectStore('textureMappings');
  const todoStore = transaction.objectStore('projectTodos');
  const projectMemoStore = transaction.objectStore('projectMemos');
  const resourceMemoStore = transaction.objectStore('resourceMemos');
  for (const file of files) writes.push(fileStore.put(ensureResourceId(file)));
  for (const mapping of mappings) writes.push(mappingStore.put(mapping));
  for (const note of notes?.projectNotes ?? []) writes.push(projectMemoStore.put({ ...note, projectId: project.id }));
  for (const todo of notes?.projectTodos ?? []) {
    writes.push(todoStore.put({ ...todo, projectId: project.id }));
  }
  for (const note of notes?.resourceNotes ?? []) {
    writes.push(resourceMemoStore.put({ ...note, projectId: project.id }));
  }
  await Promise.all(writes);
  await transaction.done;
}

export async function saveProject(project: ProjectRecord): Promise<void> {
  await (await database).put('projects', { ...project, updatedAt: Date.now() });
}

export async function saveProjectFiles(project: ProjectRecord, files: ProjectFile[]): Promise<void> {
  const db = await database;
  const transaction = db.transaction(['projects', 'files'], 'readwrite');
  const fileStore = transaction.objectStore('files');
  const writes: Promise<unknown>[] = [transaction.objectStore('projects').put({ ...project, updatedAt: Date.now() })];
  for (const file of files) writes.push(fileStore.put(ensureResourceId(file)));
  await Promise.all(writes);
  await transaction.done;
}

export async function saveProjectResources(
  project: ProjectRecord,
  files: ProjectFile[],
  removedPaths: string[] = [],
  mappingChanges?: TextureMappingChanges
): Promise<void> {
  const db = await database;
  const transaction = db.transaction(['projects', 'files', 'textureMappings', 'resourceMemos'], 'readwrite');
  const fileStore = transaction.objectStore('files');
  const mappingStore = transaction.objectStore('textureMappings');
  const resourceMemoStore = transaction.objectStore('resourceMemos');
  const resourceNotes = await resourceMemoStore.index('by-project').getAll(project.id);
  const filesToSave = files.map(ensureResourceId);
  const writes: Promise<unknown>[] = [transaction.objectStore('projects').put({ ...project, updatedAt: Date.now() })];
  for (const path of removedPaths) writes.push(fileStore.delete([project.id, path]));
  for (const file of filesToSave) {
    writes.push(fileStore.put(file));
    for (const note of resourceNotes.filter(item => item.resourceId === file.resourceId && item.lastKnownPath !== file.path)) {
      writes.push(resourceMemoStore.put({ ...note, lastKnownPath: file.path, updatedAt: Date.now() }));
    }
  }
  for (const id of mappingChanges?.removeIds ?? []) writes.push(mappingStore.delete([project.id, id]));
  for (const mapping of mappingChanges?.upsert ?? []) writes.push(mappingStore.put(mapping));
  if (writes.length > 1) {
    await Promise.all(writes);
  } else {
    await writes[0];
  }
  await transaction.done;
}

export async function saveProjectFile(project: ProjectRecord, file: ProjectFile): Promise<void> {
  const db = await database;
  const transaction = db.transaction(['projects', 'files'], 'readwrite');
  await transaction.objectStore('files').put(ensureResourceId(file));
  await transaction.objectStore('projects').put({ ...project, updatedAt: Date.now() });
  await transaction.done;
}