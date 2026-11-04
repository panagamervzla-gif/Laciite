import {
  calculateFitImageZoom,
  clampImageZoom,
  DEFAULT_IMAGE_ZOOM_PERCENT,
  MAX_IMAGE_ZOOM_PERCENT,
  MIN_IMAGE_ZOOM_PERCENT,
  parseImageZoomPercent,
  stepImageZoom
} from './image-zoom';

interface ImageZoomControlElements {
  stage: HTMLElement;
  image: HTMLImageElement;
  decreaseButton: HTMLButtonElement;
  percentageInput: HTMLInputElement;
  increaseButton: HTMLButtonElement;
  fitButton: HTMLButtonElement;
  onZoomChange?: () => void;
}

export function bindImageZoomControls(elements: ImageZoomControlElements) {
  let zoomPercent = DEFAULT_IMAGE_ZOOM_PERCENT;
  let fitMode = true;

  function updateControls(): void {
    elements.percentageInput.value = String(zoomPercent);
    elements.decreaseButton.disabled = zoomPercent <= MIN_IMAGE_ZOOM_PERCENT;
    elements.increaseButton.disabled = zoomPercent >= MAX_IMAGE_ZOOM_PERCENT;
    elements.onZoomChange?.();
  }

  function setZoom(percent: number, fitting: boolean): void {
    zoomPercent = clampImageZoom(percent);
    fitMode = fitting;
    if (elements.image.naturalWidth > 0) {
      elements.image.style.width = `${elements.image.naturalWidth * zoomPercent / 100}px`;
    }
    updateControls();
  }

  function fitToStage(): void {
    fitMode = true;
    if (elements.image.naturalWidth <= 0 || elements.image.naturalHeight <= 0) {
      updateControls();
      return;
    }

    const stageStyle = getComputedStyle(elements.stage);
    const horizontalPadding = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
    const verticalPadding = parseFloat(stageStyle.paddingTop) + parseFloat(stageStyle.paddingBottom);
    const stageWidth = Math.max(0, elements.stage.clientWidth - horizontalPadding);
    const stageHeight = Math.max(0, elements.stage.clientHeight - verticalPadding);

    setZoom(
      calculateFitImageZoom(elements.image.naturalWidth, elements.image.naturalHeight, stageWidth, stageHeight),
      true
    );
  }

  function applyInput(): void {
    setZoom(parseImageZoomPercent(elements.percentageInput.value, zoomPercent), false);
  }

  elements.decreaseButton.addEventListener('click', () => setZoom(stepImageZoom(zoomPercent, -1), false));
  elements.increaseButton.addEventListener('click', () => setZoom(stepImageZoom(zoomPercent, 1), false));
  elements.fitButton.addEventListener('click', fitToStage);
  elements.percentageInput.addEventListener('change', applyInput);
  elements.percentageInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    applyInput();
    elements.percentageInput.blur();
  });
  updateControls();

  return {
    fitToStage,
    recalculateIfFitting(): void {
      if (fitMode) fitToStage();
    },
    resetForImage(): void {
      fitMode = true;
      zoomPercent = DEFAULT_IMAGE_ZOOM_PERCENT;
      elements.image.style.width = '';
      updateControls();
    }
  };
}
