export const MIN_IMAGE_ZOOM_PERCENT = 10;
export const MAX_IMAGE_ZOOM_PERCENT = 800;
export const IMAGE_ZOOM_STEP_PERCENT = 10;
export const DEFAULT_IMAGE_ZOOM_PERCENT = 100;

export function clampImageZoom(percent: number): number {
  if (!Number.isFinite(percent)) return DEFAULT_IMAGE_ZOOM_PERCENT;
  return Math.min(MAX_IMAGE_ZOOM_PERCENT, Math.max(MIN_IMAGE_ZOOM_PERCENT, Math.round(percent)));
}

export function parseImageZoomPercent(value: string, currentPercent: number): number {
  const trimmedValue = value.trim();
  if (!trimmedValue) return clampImageZoom(currentPercent);

  const percent = Number(trimmedValue);
  return Number.isFinite(percent) ? clampImageZoom(percent) : clampImageZoom(currentPercent);
}

export function stepImageZoom(currentPercent: number, direction: -1 | 1): number {
  return clampImageZoom(currentPercent + direction * IMAGE_ZOOM_STEP_PERCENT);
}

export function calculateFitImageZoom(
  imageWidth: number,
  imageHeight: number,
  stageWidth: number,
  stageHeight: number
): number {
  if (![imageWidth, imageHeight, stageWidth, stageHeight].every(value => Number.isFinite(value) && value > 0)) {
    return DEFAULT_IMAGE_ZOOM_PERCENT;
  }

  const fitPercent = Math.min(stageWidth / imageWidth, stageHeight / imageHeight) * 100;
  return clampImageZoom(Math.floor(fitPercent));
}
