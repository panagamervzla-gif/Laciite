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
  projectNotes: { key: string; value: ProjectNoteRecord };
  projectTodos: { key: [string, string]; value: ProjectTodoRecord; indexes: { 'by-project': string } };
  resourceNotes: { key: [string, string]; value: ResourceNoteRecord; indexes: { 'by-project': string } };
}

const database = openDB<TextureWorkbenchDB>('texture-workbench', 3, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: ['projectId', 'path'] }).createIndex('by-project', 'projectId');
    if (!db.objectStoreNames.contains('textureMappings')) {
      db.createObjectStore('textureMappings', { keyPath: ['projectId', 'id'] }).createIndex('by-project', 'projectId');
    }
    if (!db.objectStoreNames.contains('projectNotes')) db.createObjectStore('projectNotes', { keyPath: 'projectId' });
    if (!db.objectStoreNames.contains('projectTodos')) {
      db.createObjectStore('projectTodos', { keyPath: ['projectId', 'id'] }).createIndex('by-project', 'projectId');
    }
    if (!db.objectStoreNames.contains('resourceNotes')) {
      db.createObjectStore('resourceNotes', { keyPath: ['projectId', 'resourceId'] }).createIndex('by-project', 'projectId');
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
    ['projects', 'files', 'textureMappings', 'projectNotes', 'projectTodos', 'resourceNotes'],
    'readwrite'
  );
  const fileStore = transaction.objectStore('files');
  const mappingStore = transaction.objectStore('textureMappings');
  const todoStore = transaction.objectStore('projectTodos');
  const resourceNoteStore = transaction.objectStore('resourceNotes');
  const [fileKeys, mappingKeys, todoKeys, resourceNoteKeys] = await Promise.all([
    fileStore.index('by-project').getAllKeys(projectId),
    mappingStore.index('by-project').getAllKeys(projectId),
    todoStore.index('by-project').getAllKeys(projectId),
    resourceNoteStore.index('by-project').getAllKeys(projectId)
  ]);
  const deletions: Promise<unknown>[] = [];
  for (const key of fileKeys) deletions.push(fileStore.delete(key));
  for (const key of mappingKeys) deletions.push(mappingStore.delete(key));
  for (const key of todoKeys) deletions.push(todoStore.delete(key));
  for (const key of resourceNoteKeys) deletions.push(resourceNoteStore.delete(key));
  deletions.push(transaction.objectStore('projectNotes').delete(projectId));
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

export async function getProjectNote(projectId: string): Promise<ProjectNoteRecord | undefined> {
  return (await database).get('projectNotes', projectId);
}

export async function saveProjectNote(projectId: string, content: string): Promise<void> {
  await (await database).put('projectNotes', { projectId, content, updatedAt: Date.now() });
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

export async function getResourceNote(projectId: string, resourceId: string): Promise<ResourceNoteRecord | undefined> {
  return (await database).get('resourceNotes', [projectId, resourceId]);
}

export async function getProjectResourceNotes(projectId: string): Promise<ResourceNoteRecord[]> {
  const notes = await (await database).getAllFromIndex('resourceNotes', 'by-project', projectId);
  return notes.sort((left, right) => left.lastKnownPath.localeCompare(right.lastKnownPath));
}

export async function saveResourceNote(note: ResourceNoteRecord): Promise<void> {
  await (await database).put('resourceNotes', { ...note, updatedAt: Date.now() });
}

export async function createProject(
  project: ProjectRecord,
  files: ProjectFile[],
  mappings: TextureMappingRecord[] = [],
  notes?: ProjectNotesBundle
): Promise<void> {
  const db = await database;
  const transaction = db.transaction(
    ['projects', 'files', 'textureMappings', 'projectNotes', 'projectTodos', 'resourceNotes'],
    'readwrite'
  );
  const writes: Promise<unknown>[] = [transaction.objectStore('projects').put(project)];
  const fileStore = transaction.objectStore('files');
  const mappingStore = transaction.objectStore('textureMappings');
  const todoStore = transaction.objectStore('projectTodos');
  const resourceNoteStore = transaction.objectStore('resourceNotes');
  for (const file of files) writes.push(fileStore.put(ensureResourceId(file)));
  for (const mapping of mappings) writes.push(mappingStore.put(mapping));
  if (notes?.projectNote) {
    writes.push(transaction.objectStore('projectNotes').put({ ...notes.projectNote, projectId: project.id }));
  }
  for (const todo of notes?.projectTodos ?? []) {
    writes.push(todoStore.put({ ...todo, projectId: project.id }));
  }
  for (const note of notes?.resourceNotes ?? []) {
    writes.push(resourceNoteStore.put({ ...note, projectId: project.id }));
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
  const transaction = db.transaction(['projects', 'files', 'textureMappings', 'resourceNotes'], 'readwrite');
  const fileStore = transaction.objectStore('files');
  const mappingStore = transaction.objectStore('textureMappings');
  const resourceNoteStore = transaction.objectStore('resourceNotes');
  const resourceNotes = await resourceNoteStore.index('by-project').getAll(project.id);
  const filesToSave = files.map(ensureResourceId);
  const writes: Promise<unknown>[] = [transaction.objectStore('projects').put({ ...project, updatedAt: Date.now() })];
  for (const path of removedPaths) writes.push(fileStore.delete([project.id, path]));
  for (const file of filesToSave) {
    writes.push(fileStore.put(file));
    const note = resourceNotes.find(item => item.resourceId === file.resourceId);
    if (note && note.lastKnownPath !== file.path) {
      writes.push(resourceNoteStore.put({ ...note, lastKnownPath: file.path, updatedAt: Date.now() }));
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