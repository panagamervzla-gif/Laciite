import { beforeEach, describe, expect, it } from 'vitest';
import { bindImageZoomControls } from './image-zoom-controls';

describe('Inspector image zoom controls', () => {
  let stage: HTMLElement;
  let image: HTMLImageElement;
  let decreaseButton: HTMLButtonElement;
  let percentageInput: HTMLInputElement;
  let increaseButton: HTMLButtonElement;
  let fitButton: HTMLButtonElement;
  let setStageSize: (width: number, height: number) => void;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="stage" style="padding: 10px">
        <img id="image">
      </div>
      <button id="decrease"></button>
      <input id="percentage" type="number">
      <button id="increase"></button>
      <button id="fit"></button>
    `;
    stage = document.querySelector<HTMLElement>('#stage')!;
    image = document.querySelector<HTMLImageElement>('#image')!;
    decreaseButton = document.querySelector<HTMLButtonElement>('#decrease')!;
    percentageInput = document.querySelector<HTMLInputElement>('#percentage')!;
    increaseButton = document.querySelector<HTMLButtonElement>('#increase')!;
    fitButton = document.querySelector<HTMLButtonElement>('#fit')!;

    let width = 120;
    let height = 100;
    Object.defineProperties(stage, {
      clientWidth: { configurable: true, get: () => width },
      clientHeight: { configurable: true, get: () => height }
    });
    setStageSize = (nextWidth, nextHeight) => {
      width = nextWidth;
      height = nextHeight;
    };
    Object.defineProperties(image, {
      naturalWidth: { configurable: true, value: 400 },
      naturalHeight: { configurable: true, value: 200 }
    });
  });

  it('updates the displayed image and percentage with the step buttons', () => {
    const zoom = bindImageZoomControls({ stage, image, decreaseButton, percentageInput, increaseButton, fitButton });
    zoom.resetForImage();
    increaseButton.click();

    expect(percentageInput.value).toBe('110');
    expect(image.style.width).toBe('440px');

    decreaseButton.click();
    expect(percentageInput.value).toBe('100');
    expect(image.style.width).toBe('400px');
  });

  it('clamps direct percentage entry and restores the current value for empty input', () => {
    const zoom = bindImageZoomControls({ stage, image, decreaseButton, percentageInput, increaseButton, fitButton });
    zoom.resetForImage();

    percentageInput.value = '125';
    percentageInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(percentageInput.value).toBe('125');
    expect(image.style.width).toBe('500px');

    percentageInput.value = '900';
    percentageInput.dispatchEvent(new Event('change'));
    expect(percentageInput.value).toBe('800');
    expect(image.style.width).toBe('3200px');

    percentageInput.value = '';
    percentageInput.dispatchEvent(new Event('change'));
    expect(percentageInput.value).toBe('800');
    expect(image.style.width).toBe('3200px');
  });

  it('fits the image in the padded stage and recalculates while in Fit mode', () => {
    const zoom = bindImageZoomControls({ stage, image, decreaseButton, percentageInput, increaseButton, fitButton });
    fitButton.click();

    expect(percentageInput.value).toBe('25');
    expect(image.style.width).toBe('100px');

    setStageSize(220, 140);
    zoom.recalculateIfFitting();
    expect(percentageInput.value).toBe('50');
    expect(image.style.width).toBe('200px');
  });

  it('preserves manual zoom when the stage is resized and resets to Fit for another image', () => {
    const zoom = bindImageZoomControls({ stage, image, decreaseButton, percentageInput, increaseButton, fitButton });
    fitButton.click();
    percentageInput.value = '75';
    percentageInput.dispatchEvent(new Event('change'));

    setStageSize(220, 140);
    zoom.recalculateIfFitting();
    expect(percentageInput.value).toBe('75');
    expect(image.style.width).toBe('300px');

    zoom.resetForImage();
    expect(percentageInput.value).toBe('100');
    expect(image.style.width).toBe('');
    zoom.fitToStage();
    expect(percentageInput.value).toBe('50');
  });

  it('disables step controls when the zoom limit is reached', () => {
    const zoom = bindImageZoomControls({ stage, image, decreaseButton, percentageInput, increaseButton, fitButton });
    zoom.resetForImage();
    percentageInput.value = '800';
    percentageInput.dispatchEvent(new Event('change'));

    expect(increaseButton.disabled).toBe(true);
    expect(decreaseButton.disabled).toBe(false);
    decreaseButton.click();
    expect(percentageInput.value).toBe('790');
  });
});
