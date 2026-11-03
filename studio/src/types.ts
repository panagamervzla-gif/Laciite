export interface ProjectRecord {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  fileCount: number;
  directories: string[];
  dictionaryPath: string;
  texturesIniPath?: string;
  texturesIniHeader?: string;
}

export interface ProjectFile {
  projectId: string;
  resourceId?: string;
  path: string;
  blob: Blob;
  mimeType: string;
  kind: 'source' | 'dictionary';
}

export interface ProjectNoteRecord {
  projectId: string;
  content: string;
  updatedAt: number;
}

export interface ProjectTodoRecord {
  projectId: string;
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ResourceNoteRecord {
  projectId: string;
  resourceId: string;
  lastKnownPath: string;
  content: string;
  updatedAt: number;
}

export interface ProjectNotesBundle {
  projectNote?: ProjectNoteRecord;
  projectTodos: ProjectTodoRecord[];
  resourceNotes: ResourceNoteRecord[];
}

export interface TextureMappingRecord {
  id: string;
  projectId: string;
  hash: string;
  targetPath: string;
  resourcePath?: string;
  order: number;
}

export interface DictionaryAsset {
  id: string;
  path: string;
  hashes: string[];
  name: string;
  tags: string[];
  description: string;
}

export interface TextureDictionary {
  format: 'texture-workbench-dictionary';
  version: 1;
  assets: DictionaryAsset[];
}

export interface ImportedPackage {
  name: string;
  files: ProjectFile[];
  directories: string[];
  dictionaryPath: string;
  dictionary: TextureDictionary;
  dictionaryText: string;
  textureMappings: TextureMappingRecord[];
  notes?: ProjectNotesBundle;
  texturesIniPath?: string;
  texturesIniHeader?: string;
}