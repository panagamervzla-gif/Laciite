import { describe, expect, it } from 'vitest';
import {
  calculateFitImageZoom,
  clampImageZoom,
  parseImageZoomPercent,
  stepImageZoom
} from './image-zoom';

describe('image zoom', () => {
  it('clamps zoom values to the supported range', () => {
    expect(clampImageZoom(5)).toBe(10);
    expect(clampImageZoom(850)).toBe(800);
    expect(clampImageZoom(125)).toBe(125);
  });

  it('keeps the current value when percentage input is empty or invalid', () => {
    expect(parseImageZoomPercent('', 125)).toBe(125);
    expect(parseImageZoomPercent('  ', 125)).toBe(125);
    expect(parseImageZoomPercent('not a number', 125)).toBe(125);
  });

  it('rounds and clamps a valid percentage input', () => {
    expect(parseImageZoomPercent('125.6', 100)).toBe(126);
    expect(parseImageZoomPercent('2', 100)).toBe(10);
    expect(parseImageZoomPercent('900', 100)).toBe(800);
  });

  it('steps zoom in increments of ten without crossing the bounds', () => {
    expect(stepImageZoom(100, 1)).toBe(110);
    expect(stepImageZoom(100, -1)).toBe(90);
    expect(stepImageZoom(800, 1)).toBe(800);
    expect(stepImageZoom(10, -1)).toBe(10);
  });

  it('fits landscape and portrait images within the available stage', () => {
    expect(calculateFitImageZoom(1600, 900, 800, 600)).toBe(50);
    expect(calculateFitImageZoom(900, 1600, 600, 800)).toBe(50);
  });

  it('rounds fit down so the image never exceeds a fractional stage boundary', () => {
    expect(calculateFitImageZoom(3, 2, 2, 2)).toBe(66);
  });

  it('respects zoom limits when fitting very small or large images', () => {
    expect(calculateFitImageZoom(50, 50, 800, 600)).toBe(800);
    expect(calculateFitImageZoom(50000, 50000, 100, 100)).toBe(10);
  });

  it('uses the safe default when image or stage dimensions are unusable', () => {
    expect(calculateFitImageZoom(0, 100, 800, 600)).toBe(100);
    expect(calculateFitImageZoom(100, 100, Number.NaN, 600)).toBe(100);
  });
});
