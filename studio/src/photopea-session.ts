export type PhotopeaImageFormat = 'png' | 'jpg' | 'webp' | 'gif';

export interface PhotopeaDocumentSession {
  sourceId: string;
  projectId: string;
  path: string;
  format: PhotopeaImageFormat;
  mimeType: string;
  sourceHash: string;
}

export type NewPhotopeaDocumentSession = Omit<PhotopeaDocumentSession, 'sourceId'>;

const sourcePrefix = 'texture-workbench';

function isPhotopeaImageFormat(format: string): format is PhotopeaImageFormat {
  return format === 'png' || format === 'jpg' || format === 'webp' || format === 'gif';
}

export class PhotopeaSessionRegistry {
  private readonly sessions = new Map<string, PhotopeaDocumentSession>();

  constructor(private readonly createId: () => string = () => crypto.randomUUID()) {}

  register(session: NewPhotopeaDocumentSession): PhotopeaDocumentSession {
    const sourceId = this.createId();
    if (!sourceId || this.sessions.has(sourceId)) {
      throw new Error('No se pudo asignar un identificador único al documento de Photopea.');
    }
    const registered = Object.freeze({ ...session, sourceId });
    this.sessions.set(sourceId, registered);
    return registered;
  }

  get(sourceId: string): PhotopeaDocumentSession | undefined {
    return this.sessions.get(sourceId);
  }

  remove(sourceId: string): void {
    this.sessions.delete(sourceId);
  }

  updateHash(sourceId: string, sourceHash: string): PhotopeaDocumentSession | undefined {
    const session = this.sessions.get(sourceId);
    if (!session) return undefined;
    const updated = Object.freeze({ ...session, sourceHash });
    this.sessions.set(sourceId, updated);
    return updated;
  }
}

export function createPhotopeaSource(session: PhotopeaDocumentSession): string {
  return `${sourcePrefix}:${session.sourceId}:${session.format}`;
}

export function parsePhotopeaSource(source: string): {
  sourceId: string;
  format: PhotopeaImageFormat;
} | undefined {
  const [prefix, sourceId, format, ...extra] = source.split(':');
  if (prefix !== sourcePrefix || !sourceId || !format || extra.length > 0) return undefined;
  if (!isPhotopeaImageFormat(format)) return undefined;
  return { sourceId, format };
}

export async function hashBlob(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
