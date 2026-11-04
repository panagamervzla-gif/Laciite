import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindImagePanControls } from './image-pan-controls';

describe('Inspector image panning', () => {
  let stage: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="stage" tabindex="0"><img alt=""></div>';
    stage = document.querySelector<HTMLElement>('#stage')!;
    Object.defineProperties(stage, {
      clientWidth: { configurable: true, value: 200 },
      clientHeight: { configurable: true, value: 150 },
      scrollWidth: { configurable: true, value: 600 },
      scrollHeight: { configurable: true, value: 450 },
      scrollLeft: { configurable: true, writable: true, value: 100 },
      scrollTop: { configurable: true, writable: true, value: 80 }
    });
    stage.setPointerCapture = vi.fn();
    stage.hasPointerCapture = vi.fn(() => true);
    stage.releasePointerCapture = vi.fn();
  });

  function pointerEvent(type: string, values: { button?: number; pointerId?: number; clientX?: number; clientY?: number }): Event {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, {
      button: { value: values.button ?? 0 },
      isPrimary: { value: true },
      pointerId: { value: values.pointerId ?? 1 },
      clientX: { value: values.clientX ?? 0 },
      clientY: { value: values.clientY ?? 0 }
    });
    return event;
  }

  it('pans horizontally and vertically by dragging and captures the active pointer', () => {
    bindImagePanControls(stage);

    stage.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    stage.dispatchEvent(pointerEvent('pointermove', { clientX: 70, clientY: 120 }));

    expect(stage.scrollLeft).toBe(130);
    expect(stage.scrollTop).toBe(60);
    expect(stage.classList.contains('is-panning')).toBe(true);
    expect(stage.setPointerCapture).toHaveBeenCalledWith(1);

    stage.dispatchEvent(pointerEvent('pointerup', { clientX: 70, clientY: 120 }));
    expect(stage.classList.contains('is-panning')).toBe(false);
    expect(stage.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it('pans the viewport with arrow keys and uses a larger step with Shift', () => {
    bindImagePanControls(stage);

    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    stage.dispatchEvent(right);
    expect(stage.scrollLeft).toBe(140);
    expect(right.defaultPrevented).toBe(true);

    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }));
    expect(stage.scrollTop).toBe(200);
  });

  it('does not start dragging when the image fits or a non-primary button is used', () => {
    bindImagePanControls(stage);
    Object.defineProperties(stage, {
      scrollWidth: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 150 }
    });

    stage.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(stage.classList.contains('is-panning')).toBe(false);

    Object.defineProperty(stage, 'scrollWidth', { configurable: true, value: 600 });
    stage.dispatchEvent(pointerEvent('pointerdown', { button: 2, clientX: 100, clientY: 100 }));
    expect(stage.classList.contains('is-panning')).toBe(false);
  });

  it('keeps panning within the scrollable image bounds', () => {
    bindImagePanControls(stage);
    stage.scrollLeft = 0;
    stage.scrollTop = 0;

    stage.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    stage.dispatchEvent(pointerEvent('pointermove', { clientX: 200, clientY: 200 }));
    expect(stage.scrollLeft).toBe(0);
    expect(stage.scrollTop).toBe(0);

    stage.dispatchEvent(pointerEvent('pointermove', { clientX: -500, clientY: -500 }));
    expect(stage.scrollLeft).toBe(400);
    expect(stage.scrollTop).toBe(300);
  });

  it('refreshes whether the stage can be panned after zoom changes', () => {
    const pan = bindImagePanControls(stage);
    pan.refresh();
    expect(stage.classList.contains('is-pannable')).toBe(true);

    Object.defineProperties(stage, {
      scrollWidth: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 150 }
    });
    pan.refresh();
    expect(stage.classList.contains('is-pannable')).toBe(false);
  });
});
