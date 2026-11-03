import { describe, expect, it } from 'vitest';
import {
  PhotopeaSessionRegistry,
  createPhotopeaSource,
  hashBlob,
  parsePhotopeaSource
} from './photopea-session';

describe('PhotopeaSessionRegistry', () => {
  it('keeps independent project and file metadata for each open document', () => {
    let nextId = 0;
    const sessions = new PhotopeaSessionRegistry(() => `doc-${++nextId}`);
    const first = sessions.register({
      projectId: 'project-a',
      path: 'textures/one.png',
      format: 'png',
      mimeType: 'image/png',
      sourceHash: 'hash-one'
    });
    const second = sessions.register({
      projectId: 'project-b',
      path: 'other/two.jpg',
      format: 'jpg',
      mimeType: 'image/jpeg',
      sourceHash: 'hash-two'
    });

    expect(sessions.get(first.sourceId)).toEqual(first);
    expect(sessions.get(second.sourceId)).toEqual(second);
    expect(first.sourceId).not.toBe(second.sourceId);
  });

  it('updates the expected hash after a successful save', () => {
    const sessions = new PhotopeaSessionRegistry(() => 'doc-1');
    const session = sessions.register({
      projectId: 'project-a',
      path: 'texture.png',
      format: 'png',
      mimeType: 'image/png',
      sourceHash: 'before'
    });

    expect(sessions.updateHash(session.sourceId, 'after')).toEqual({
      ...session,
      sourceHash: 'after'
    });
    expect(sessions.get(session.sourceId)?.sourceHash).toBe('after');
    expect(sessions.updateHash('unknown', 'ignored')).toBeUndefined();
  });

  it('removes a session when a document cannot be opened', () => {
    const sessions = new PhotopeaSessionRegistry(() => 'doc-1');
    const session = sessions.register({
      projectId: 'project-a',
      path: 'texture.png',
      format: 'png',
      mimeType: 'image/png',
      sourceHash: 'hash'
    });

    sessions.remove(session.sourceId);

    expect(sessions.get(session.sourceId)).toBeUndefined();
  });
});

describe('Photopea document source', () => {
  it.each([
    ['png', 'image/png'],
    ['jpg', 'image/jpeg'],
    ['webp', 'image/webp'],
    ['gif', 'image/gif']
  ] as const)('round-trips the %s output format', (format, mimeType) => {
    const sessions = new PhotopeaSessionRegistry(() => 'opaque-id');
    const session = sessions.register({
      projectId: 'project-a',
      path: 'texture',
      format,
      mimeType,
      sourceHash: 'hash'
    });

    const source = createPhotopeaSource(session);
    expect(parsePhotopeaSource(source)).toEqual({
      sourceId: session.sourceId,
      format
    });
  });

  it.each(['', 'texture-workbench:', 'texture-workbench:id:psd', 'other:id:png'])(
    'rejects malformed or unsupported source %j',
    source => {
      expect(parsePhotopeaSource(source)).toBeUndefined();
    }
  );
});

describe('hashBlob', () => {
  it('returns a stable SHA-256 hash for blob contents', async () => {
    const first = await hashBlob(new Blob(['same contents']));
    const second = await hashBlob(new Blob(['same contents']));
    const changed = await hashBlob(new Blob(['different contents']));

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
    expect(changed).not.toBe(first);
  });
});
