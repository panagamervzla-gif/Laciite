export interface PaneWidthBounds {
  min: number;
  max: number;
}

export function getNotesPaneWidthBounds(
  workbenchWidth: number,
  filesPaneWidth: number,
  overlay: boolean
): PaneWidthBounds {
  const min = 180;
  const max = Math.max(
    min,
    Math.min(520, Math.floor(overlay
      ? workbenchWidth / 2
      : workbenchWidth - filesPaneWidth - 10 - 240))
  );
  return { min, max };
}

export function clampPaneWidth(width: number, bounds: PaneWidthBounds): number {
  return Math.max(bounds.min, Math.min(bounds.max, width));
}
