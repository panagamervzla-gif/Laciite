import { describe, expect, it } from 'vitest';
import { clampPaneWidth, getNotesPaneWidthBounds } from './notes-pane-resize';

describe('notes pane resizing', () => {
  it('reserves enough width for the file tree and browser on desktop', () => {
    expect(getNotesPaneWidthBounds(980, 240, false)).toEqual({ min: 180, max: 490 });
  });

  it('limits the overlay pane to half the available viewport', () => {
    expect(getNotesPaneWidthBounds(800, 240, true)).toEqual({ min: 180, max: 400 });
  });

  it('keeps the minimum width when the available layout is narrow', () => {
    expect(getNotesPaneWidthBounds(620, 280, false)).toEqual({ min: 180, max: 180 });
  });

  it('clamps a requested width to the allowed range', () => {
    expect(clampPaneWidth(120, { min: 180, max: 420 })).toBe(180);
    expect(clampPaneWidth(500, { min: 180, max: 420 })).toBe(420);
    expect(clampPaneWidth(300, { min: 180, max: 420 })).toBe(300);
  });
});
