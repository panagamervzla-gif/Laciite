import { hashBlob, type PhotopeaDocumentSession } from './photopea-session';
import type { ProjectFile, ProjectRecord } from '../project/types';

export interface PhotopeaSaveStorage {
  getProject(projectId: string): Promise<ProjectRecord | undefined>;
  getProjectFile(projectId: string, path: string): Promise<ProjectFile | undefined>;
  saveProjectFile(project: ProjectRecord, file: ProjectFile): Promise<void>;
}

export interface PhotopeaSaveResult {
  project: ProjectRecord;
  file: ProjectFile;
  sourceHash: string;
}

export async function savePhotopeaDocument(
  session: PhotopeaDocumentSession,
  data: ArrayBuffer,
  storage: PhotopeaSaveStorage
): Promise<PhotopeaSaveResult> {
  const project = await storage.getProject(session.projectId);
  if (!project) throw new Error('El proyecto de origen ya no existe.');

  const existing = await storage.getProjectFile(project.id, session.path);
  if (!existing) throw new Error('El recurso original ya no existe en el proyecto.');
  if (await hashBlob(existing.blob) !== session.sourceHash) {
    throw new Error('El recurso original cambió desde que se abrió. Se rechazó el guardado para proteger los cambios.');
  }

  const blob = new Blob([data], { type: session.mimeType });
  const file: ProjectFile = { ...existing, blob };
  const sourceHash = await hashBlob(blob);
  await storage.saveProjectFile(project, file);
  return { project, file, sourceHash };
}
