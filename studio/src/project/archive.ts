import JSZip from 'jszip';
import type {
  DictionaryAsset,
  ImportedPackage,
  ProjectFile,
  ProjectNotesBundle,
  TextureDictionary,
  TextureMappingRecord
} from './types';

const dictionaryFileName = 'texture-dictionary.txt';
const textureIniFileName = 'textures.ini';
const projectNotesFileName = 'laccite-project-notes.json';
const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tga', 'dds']);

interface ProjectNotesArchive {
  format: 'laccite-project-notes';
  version: 2;
  resources: Array<{ path: string; resourceId: string }>;
  notes: ProjectNotesBundle;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizePath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//, '').replace(/^\/+/, '');
}

function parentPath(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash < 0 ? '' : path.slice(0, slash + 1);
}

function isImage(path: string): boolean {
  return imageExtensions.has(path.split('.').at(-1)?.toLowerCase() ?? '');
}

function mimeType(path: string): string {
  const extension = path.split('.').at(-1)?.toLowerCase();
  return ({
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    gif: 'image/gif', bmp: 'image/bmp', tga: 'image/x-tga', dds: 'image/vnd-ms.dds'
  } as Record<string, string>)[extension ?? ''] ?? 'application/octet-stream';
}

function parseTextureIni(text: string): { header: string; mappings: Array<{ hash: string; targetPath: string; order: number }> } {
  const mappings: Array<{ hash: string; targetPath: string; order: number }> = [];
  const lines = text.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? [];
  let section = '';
  let offset = 0;
  let hashesHeaderEnd = -1;
  for (const rawLine of lines) {
    if (!rawLine) continue;
    const line = rawLine.replace(/(?:\r\n|\n|\r)$/, '');
    const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1].toLowerCase();
      if (section === 'hashes' && hashesHeaderEnd < 0) hashesHeaderEnd = offset + rawLine.length;
    } else if (section === 'hashes' && !/^\s*[#;]/.test(line)) {
      const assignment = line.match(/^\s*([^=\s;#]+)\s*=\s*(.*?)\s*$/);
      if (assignment) mappings.push({ hash: assignment[1], targetPath: normalizePath(assignment[2]), order: mappings.length });
    }
    offset += rawLine.length;
  }
  const lineEnding = text.match(/\r\n|\n|\r/)?.[0] ?? '\n';
  const header = hashesHeaderEnd >= 0
    ? text.slice(0, hashesHeaderEnd)
    : `${text}${text && !text.endsWith(lineEnding) ? lineEnding : ''}[hashes]${lineEnding}`;
  return { header, mappings };
}

function resolveMappingPath(targetPath: string, packagePaths: string[], iniPath: string): string | undefined {
  if (!targetPath) return undefined;
  const normalizedTarget = normalizePath(targetPath);
  const iniRoot = parentPath(iniPath);
  const pathLookup = new Map(packagePaths.map(path => [path.toLowerCase(), path]));
  const candidates = [normalizePath(`${iniRoot}${normalizedTarget}`), normalizedTarget];
  const exactMatch = candidates.map(candidate => pathLookup.get(candidate.toLowerCase())).find(Boolean);
  if (exactMatch) return exactMatch;
  const suffix = `/${normalizedTarget.toLowerCase()}`;
  const suffixMatches = packagePaths.filter(path => path.toLowerCase().endsWith(suffix));
  return suffixMatches.length === 1 ? suffixMatches[0] : undefined;
}

export function parseTextureIniForProject(
  text: string,
  projectId: string,
  iniPath: string,
  packagePaths: string[]
): { header: string; mappings: TextureMappingRecord[] } {
  const parsed = parseTextureIni(text);
  return {
    header: parsed.header,
    mappings: parsed.mappings.map(mapping => ({
      ...mapping,
      id: crypto.randomUUID(),
      projectId,
      resourcePath: resolveMappingPath(mapping.targetPath, packagePaths, iniPath)
    }))
  };
}

export function buildTextureIni(header: string, mappings: TextureMappingRecord[]): string {
  const lineEnding = header.match(/\r\n|\n|\r/)?.[0] ?? '\n';
  let prefix = header || `[hashes]${lineEnding}`;
  if (!prefix.endsWith('\n') && !prefix.endsWith('\r')) prefix += lineEnding;
  const entries = [...mappings]
    .sort((left, right) => left.order - right.order)
    .map(mapping => `${mapping.hash} = ${normalizePath(mapping.targetPath)}`);
  return entries.length ? `${prefix}${entries.join(lineEnding)}${lineEnding}` : prefix;
}

function parseDictionary(text: string): TextureDictionary {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object') throw new Error(`${dictionaryFileName} no contiene un objeto JSON válido.`);
  const source = value as Partial<TextureDictionary>;
  if (source.format !== 'texture-workbench-dictionary' || source.version !== 1 || !Array.isArray(source.assets)) {
    throw new Error(`${dictionaryFileName} tiene un formato que esta versión no reconoce.`);
  }
  return {
    format: 'texture-workbench-dictionary',
    version: 1,
    assets: source.assets.map((asset: DictionaryAsset) => ({
      id: typeof asset.id === 'string' && asset.id ? asset.id : crypto.randomUUID(),
      path: normalizePath(typeof asset.path === 'string' ? asset.path : ''),
      hashes: Array.isArray(asset.hashes) ? asset.hashes.filter((hash): hash is string => typeof hash === 'string') : [],
      name: typeof asset.name === 'string' ? asset.name : '',
      tags: Array.isArray(asset.tags) ? asset.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      description: typeof asset.description === 'string' ? asset.description : ''
    }))
  };
}

function createDictionary(mappings: TextureMappingRecord[], packagePaths: string[], existingText?: string): TextureDictionary {
  const existing = existingText
    ? parseDictionary(existingText)
    : { format: 'texture-workbench-dictionary' as const, version: 1 as const, assets: [] };
  const hashesByPath = new Map<string, string[]>();

  for (const mapping of mappings) {
    if (mapping.resourcePath) hashesByPath.set(mapping.resourcePath, [...(hashesByPath.get(mapping.resourcePath) ?? []), mapping.hash]);
  }

  const assets: DictionaryAsset[] = [];
  for (const path of packagePaths) {
    if (!isImage(path) && !hashesByPath.has(path)) continue;
    const hashes = [...new Set(hashesByPath.get(path) ?? [])];
    const previous = existing.assets.find(asset => asset.path.toLowerCase() === path.toLowerCase())
      ?? existing.assets.find(asset => asset.hashes.some(hash => hashes.includes(hash)));
    assets.push({
      id: previous?.id ?? crypto.randomUUID(),
      path,
      hashes,
      name: previous?.name ?? '',
      tags: previous?.tags ?? [],
      description: previous?.description ?? ''
    });
  }
  const currentPaths = new Set(assets.map(asset => asset.path.toLowerCase()));
  for (const previous of existing.assets) {
    if (!currentPaths.has(previous.path.toLowerCase())) assets.push(previous);
  }
  return { format: 'texture-workbench-dictionary', version: 1, assets };
}

function parseProjectNotesArchive(text: string, projectId: string): {
  resources: Map<string, string>;
  notes: ProjectNotesBundle;
} {
  const value: unknown = JSON.parse(text);
  if (!isRecord(value)) throw new Error('El archivo de notas del ZIP no contiene un objeto válido.');
  const archive = value;
  if (
    archive.format !== 'laccite-project-notes'
    || (archive.version !== 1 && archive.version !== 2)
    || !Array.isArray(archive.resources)
    || !isRecord(archive.notes)
  ) {
    throw new Error('El archivo de notas del ZIP tiene un formato que esta versión no reconoce.');
  }
  const noteData = archive.notes;
  const legacy = archive.version === 1;
  const projectNotes = legacy
    ? noteData.projectNote === undefined ? [] : [noteData.projectNote]
    : noteData.projectNotes;
  if (
    archive.resources.some(resource =>
      !isRecord(resource)
      || typeof resource.path !== 'string'
      || !normalizePath(resource.path)
      || typeof resource.resourceId !== 'string'
      || !resource.resourceId
    )
    || !Array.isArray(projectNotes)
    || projectNotes.some(note =>
      !isRecord(note)
      || typeof note.content !== 'string'
      || (!legacy && (typeof note.id !== 'string' || !note.id || typeof note.title !== 'string'))
    )
    || !Array.isArray(noteData.projectTodos)
    || noteData.projectTodos.some(todo =>
      !isRecord(todo)
      || typeof todo.id !== 'string'
      || !todo.id
      || typeof todo.text !== 'string'
      || typeof todo.completed !== 'boolean'
    )
    || !Array.isArray(noteData.resourceNotes)
    || noteData.resourceNotes.some(note =>
      !isRecord(note)
      || (!legacy && (typeof note.id !== 'string' || !note.id || typeof note.title !== 'string'))
      || typeof note.resourceId !== 'string'
      || !note.resourceId
      || typeof note.lastKnownPath !== 'string'
      || typeof note.content !== 'string'
    )
  ) {
    throw new Error('El archivo de notas del ZIP contiene registros incompletos o no válidos.');
  }
  const resources = new Map<string, string>();
  const resourceIds = new Set<string>();
  for (const resource of archive.resources as Array<Record<string, string>>) {
    const path = normalizePath(resource.path);
    if (resources.has(path) || resourceIds.has(resource.resourceId)) {
      throw new Error(`El archivo de notas del ZIP repite la identidad o ruta del recurso ${path}.`);
    }
    resources.set(path, resource.resourceId);
    resourceIds.add(resource.resourceId);
  }
  const now = Date.now();
  const notes: ProjectNotesBundle = {
    projectNotes: (projectNotes as Array<Record<string, unknown>>).map(note => ({
      projectId,
      id: typeof note.id === 'string' ? note.id : crypto.randomUUID(),
      title: typeof note.title === 'string' ? note.title : 'Nota importada',
      content: note.content as string,
      createdAt: Number(note.createdAt ?? note.updatedAt) || now,
      updatedAt: Number(note.updatedAt) || now
    })),
    projectTodos: (noteData.projectTodos as Array<Record<string, unknown>>).map(todo => ({
        projectId,
        id: todo.id as string,
        text: todo.text as string,
        completed: todo.completed as boolean,
        createdAt: Number(todo.createdAt) || now,
        updatedAt: Number(todo.updatedAt) || now
      })),
    resourceNotes: (noteData.resourceNotes as Array<Record<string, unknown>>).map(note => ({
        projectId,
        id: typeof note.id === 'string' ? note.id : crypto.randomUUID(),
        resourceId: note.resourceId as string,
        lastKnownPath: normalizePath(note.lastKnownPath as string),
        title: typeof note.title === 'string' ? note.title : 'Nota importada',
        content: note.content as string,
        createdAt: Number(note.createdAt ?? note.updatedAt) || now,
        updatedAt: Number(note.updatedAt) || now
      }))
  };
  return { resources, notes };
}

export async function importPackage(file: File, projectId: string): Promise<ImportedPackage> {
  const zip = await JSZip.loadAsync(file);
  const projectNotesEntry = zip.file(projectNotesFileName);
  const projectNotesArchive = projectNotesEntry
    ? parseProjectNotesArchive(await projectNotesEntry.async('string'), projectId)
    : undefined;
  const archiveFiles = Object.entries(zip.files).filter(([path, entry]) => !entry.dir && path !== projectNotesFileName);
  const iniEntry = archiveFiles.find(([path]) => path.split('/').at(-1)?.toLowerCase() === textureIniFileName);
  const iniPath = iniEntry?.[0] ?? '';
  const packageRoot = parentPath(iniPath);
  const sidecar = archiveFiles.find(([path]) => path.split('/').at(-1)?.toLowerCase() === dictionaryFileName);
  const dictionaryPath = sidecar?.[0] ?? `${packageRoot}${dictionaryFileName}`;
  const iniText = iniEntry ? await zip.file(iniPath)!.async('string') : '';
  const existingDictionaryText = sidecar ? await zip.file(sidecar[0])!.async('string') : undefined;
  const packagePaths = archiveFiles.map(([path]) => path);
  const parsedIni = parseTextureIniForProject(iniText, projectId, iniPath, packagePaths);
  const textureMappings = parsedIni.mappings;
  const dictionary = createDictionary(textureMappings, packagePaths, existingDictionaryText);
  const dictionaryText = `${JSON.stringify(dictionary, null, 2)}\n`;
  const files: ProjectFile[] = [];

  for (const [path] of archiveFiles) {
    const isDictionary = path === dictionaryPath;
    const blob = isDictionary
      ? new Blob([dictionaryText], { type: 'text/plain;charset=utf-8' })
      : new Blob([await zip.file(path)!.async('arraybuffer')], { type: mimeType(path) });
    files.push({
      projectId,
      resourceId: projectNotesArchive?.resources.get(normalizePath(path)) ?? crypto.randomUUID(),
      path,
      blob,
      mimeType: isDictionary ? 'text/plain' : mimeType(path),
      kind: isDictionary ? 'dictionary' : 'source'
    });
  }
  if (!sidecar) {
    files.push({
      projectId,
      resourceId: crypto.randomUUID(),
      path: dictionaryPath,
      blob: new Blob([dictionaryText], { type: 'text/plain;charset=utf-8' }),
      mimeType: 'text/plain',
      kind: 'dictionary'
    });
  }

  const directories = Object.entries(zip.files).filter(([, entry]) => entry.dir).map(([path]) => path.replace(/\/$/, ''));
  return {
    name: file.name.replace(/\.zip$/i, '') || 'Proyecto importado',
    files,
    directories,
    dictionaryPath,
    dictionary,
    dictionaryText,
    textureMappings,
    notes: projectNotesArchive?.notes,
    texturesIniPath: iniEntry?.[0],
    texturesIniHeader: iniEntry ? parsedIni.header : undefined
  };
}

export function createEmptyDictionary(): TextureDictionary {
  return { format: 'texture-workbench-dictionary', version: 1, assets: [] };
}

export function validateDictionary(text: string): TextureDictionary {
  return parseDictionary(text);
}

export async function exportPackage(
  files: ProjectFile[],
  directories: string[],
  name: string,
  notes?: ProjectNotesBundle
): Promise<void> {
  const zip = new JSZip();
  if (notes && files.some(file => file.path.toLowerCase() === projectNotesFileName.toLowerCase())) {
    throw new Error(`No se puede exportar: ${projectNotesFileName} está reservado para las notas portables.`);
  }
  for (const directory of directories) zip.folder(directory);
  for (const file of files) zip.file(file.path, await file.blob.arrayBuffer());
  if (notes) {
    const archive: ProjectNotesArchive = {
      format: 'laccite-project-notes',
      version: 2,
      resources: files
        .filter((file): file is ProjectFile & { resourceId: string } => Boolean(file.resourceId))
        .map(file => ({ path: file.path, resourceId: file.resourceId })),
      notes
    };
    zip.file(projectNotesFileName, `${JSON.stringify(archive, null, 2)}\n`);
  }
  const output = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 5 } });
  const url = URL.createObjectURL(output);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.replace(/\.zip$/i, '')}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}