import { describe, expect, it } from 'vitest';
import { isResizableWindow } from '../src/ui/window_resize';
import {
  isInResizeCorner,
  RESIZE_CORNER_BAND,
  RESIZE_CORNER_BAND_TOUCH,
  resizedWindowSize,
  WINDOW_MIN_HEIGHT,
  WINDOW_MIN_WIDTH,
  WINDOW_RESIZE_MARGIN,
} from '../src/ui/window_resize_core';

const LIMITS = {
  viewportWidth: 1280,
  viewportHeight: 800,
  minWidth: WINDOW_MIN_WIDTH,
  minHeight: WINDOW_MIN_HEIGHT,
  margin: WINDOW_RESIZE_MARGIN,
};

describe('isInResizeCorner', () => {
  const rect = { right: 700, bottom: 500 };

  it('hits inside the SE band and misses outside it', () => {
    expect(isInResizeCorner(rect, 695, 495, RESIZE_CORNER_BAND)).toBe(true);
    expect(
      isInResizeCorner(
        rect,
        700 - RESIZE_CORNER_BAND,
        500 - RESIZE_CORNER_BAND,
        RESIZE_CORNER_BAND,
      ),
    ).toBe(true);
    // Left of the band, above the band, and past the window edge all miss.
    expect(isInResizeCorner(rect, 700 - RESIZE_CORNER_BAND - 1, 495, RESIZE_CORNER_BAND)).toBe(
      false,
    );
    expect(isInResizeCorner(rect, 695, 500 - RESIZE_CORNER_BAND - 1, RESIZE_CORNER_BAND)).toBe(
      false,
    );
    expect(isInResizeCorner(rect, 701, 495, RESIZE_CORNER_BAND)).toBe(false);
    expect(isInResizeCorner(rect, 695, 501, RESIZE_CORNER_BAND)).toBe(false);
  });

  it('the touch band is wider than the fine-pointer band', () => {
    const x = 700 - RESIZE_CORNER_BAND_TOUCH + 1;
    const y = 500 - RESIZE_CORNER_BAND_TOUCH + 1;
    expect(isInResizeCorner(rect, x, y, RESIZE_CORNER_BAND)).toBe(false);
    expect(isInResizeCorner(rect, x, y, RESIZE_CORNER_BAND_TOUCH)).toBe(true);
  });
});

describe('resizedWindowSize', () => {
  const start = { left: 100, top: 80, width: 400, height: 300 };

  it('applies the drag delta directly when unclamped', () => {
    expect(resizedWindowSize(start, 60, -40, LIMITS)).toEqual({ width: 460, height: 260 });
  });

  it('clamps down to the minimum size', () => {
    expect(resizedWindowSize(start, -1000, -1000, LIMITS)).toEqual({
      width: WINDOW_MIN_WIDTH,
      height: WINDOW_MIN_HEIGHT,
    });
  });

  it('clamps up to the viewport minus position and margin', () => {
    expect(resizedWindowSize(start, 5000, 5000, LIMITS)).toEqual({
      width: LIMITS.viewportWidth - start.left - WINDOW_RESIZE_MARGIN,
      height: LIMITS.viewportHeight - start.top - WINDOW_RESIZE_MARGIN,
    });
  });

  it('keeps the minimum when the window sits too close to the edge for it', () => {
    const nearEdge = { left: 1200, top: 760, width: 300, height: 200 };
    expect(resizedWindowSize(nearEdge, 500, 500, LIMITS)).toEqual({
      width: WINDOW_MIN_WIDTH,
      height: WINDOW_MIN_HEIGHT,
    });
  });

  it('rounds fractional author-space sizes to whole pixels', () => {
    expect(resizedWindowSize(start, 10.4, 10.6, LIMITS)).toEqual({ width: 410, height: 311 });
  });
});

describe('isResizableWindow', () => {
  const el = (id: string) => ({ id }) as HTMLElement;

  it('excludes fixed-size boards, popups, and modal prompts', () => {
    for (const id of [
      'map-window',
      'loot-window',
      'confirm-dialog',
      'mobile-extra-controls',
      'lockpick-panel',
      'emote-editor',
    ]) {
      expect(isResizableWindow(el(id))).toBe(false);
    }
  });

  it('allows the content windows', () => {
    for (const id of ['char-window', 'quest-log-window', 'market-window', 'bags', 'spellbook']) {
      expect(isResizableWindow(el(id))).toBe(true);
    }
  });
});
