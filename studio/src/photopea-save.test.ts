import { describe, expect, it, vi } from 'vitest';
import { hashBlob, type PhotopeaDocumentSession } from './photopea-session';
import { savePhotopeaDocument } from './photopea-save';
import type { ProjectFile, ProjectRecord } from './types';

const project: ProjectRecord = {
  id: 'source-project',
  name: 'Source project',
  createdAt: 1,
  updatedAt: 1,
  fileCount: 1,
  directories: [],
  dictionaryPath: 'dictionary.json'
};

const makeSession = async (
  source: Blob,
  format: PhotopeaDocumentSession['format'] = 'png',
  mimeType = 'image/png'
): Promise<PhotopeaDocumentSession> => ({
  sourceId: 'document-1',
  projectId: project.id,
  path: 'textures/source.png',
  format,
  mimeType,
  sourceHash: await hashBlob(source)
});

function createStorage(file?: ProjectFile) {
  return {
    getProject: vi.fn(async (projectId: string) => projectId === project.id ? project : undefined),
    getProjectFile: vi.fn(async () => file),
    saveProjectFile: vi.fn(async () => undefined)
  };
}

describe('savePhotopeaDocument', () => {
  it.each([
    ['png', 'image/png'],
    ['jpg', 'image/jpeg'],
    ['webp', 'image/webp'],
    ['gif', 'image/gif']
  ] as const)('saves the active document as %s to its original project and path', async (format, mimeType) => {
    const original = new Blob(['original']);
    const session = await makeSession(original, format, mimeType);
    const sourceFile: ProjectFile = {
      projectId: project.id,
      path: session.path,
      blob: original,
      mimeType,
      kind: 'source'
    };
    const storage = createStorage(sourceFile);
    const edited = await new Blob(['edited']).arrayBuffer();

    const result = await savePhotopeaDocument(session, edited, storage);

    expect(storage.getProject).toHaveBeenCalledWith(project.id);
    expect(storage.getProjectFile).toHaveBeenCalledWith(project.id, session.path);
    expect(storage.saveProjectFile).toHaveBeenCalledWith(project, expect.objectContaining({
      projectId: project.id,
      path: session.path,
      mimeType,
      blob: expect.any(Blob)
    }));
    expect(await result.file.blob.text()).toBe('edited');
    expect(result.file.blob.type).toBe(mimeType);
    expect(result.sourceHash).toBe(await hashBlob(result.file.blob));
  });

  it('rejects a project that no longer exists without writing', async () => {
    const original = new Blob(['original']);
    const session = await makeSession(original);
    const storage = createStorage();
    storage.getProject.mockResolvedValue(undefined);

    await expect(savePhotopeaDocument(session, new ArrayBuffer(0), storage))
      .rejects.toThrow('El proyecto de origen ya no existe.');
    expect(storage.saveProjectFile).not.toHaveBeenCalled();
  });

  it('rejects a missing source file without writing', async () => {
    const original = new Blob(['original']);
    const session = await makeSession(original);
    const storage = createStorage();

    await expect(savePhotopeaDocument(session, new ArrayBuffer(0), storage))
      .rejects.toThrow('El recurso original ya no existe en el proyecto.');
    expect(storage.saveProjectFile).not.toHaveBeenCalled();
  });

  it('rejects a changed source file without writing', async () => {
    const original = new Blob(['original']);
    const session = await makeSession(original);
    const changedFile: ProjectFile = {
      projectId: project.id,
      path: session.path,
      blob: new Blob(['changed']),
      mimeType: session.mimeType,
      kind: 'source'
    };
    const storage = createStorage(changedFile);

    await expect(savePhotopeaDocument(session, new ArrayBuffer(0), storage))
      .rejects.toThrow('El recurso original cambió desde que se abrió.');
    expect(storage.saveProjectFile).not.toHaveBeenCalled();
  });
});
