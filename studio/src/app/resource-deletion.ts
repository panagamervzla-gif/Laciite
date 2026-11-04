export interface ResourceDeletionEntry {
  path: string;
  directory: boolean;
}

interface ResourceMappingReference {
  id: string;
  resourcePath?: string;
}

export interface ResourceDeletionPlan {
  removedPaths: string[];
  remainingDirectories: string[];
  removeMappingIds: string[];
}

export function buildResourceDeletionPlan(
  entries: ResourceDeletionEntry[],
  filePaths: string[],
  directoryPaths: string[],
  mappings: ResourceMappingReference[]
): ResourceDeletionPlan {
  const removedPaths = filePaths.filter(path => entries.some(entry =>
    entry.directory ? path.startsWith(`${entry.path}/`) : path === entry.path
  ));
  const remainingDirectories = directoryPaths.filter(path => !entries.some(entry =>
    entry.directory && (path === entry.path || path.startsWith(`${entry.path}/`))
  ));
  const removedPathSet = new Set(removedPaths);

  return {
    removedPaths,
    remainingDirectories,
    removeMappingIds: mappings
      .filter(mapping => mapping.resourcePath && removedPathSet.has(mapping.resourcePath))
      .map(mapping => mapping.id)
  };
}
