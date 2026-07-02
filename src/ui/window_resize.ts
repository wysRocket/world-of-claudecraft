// Shared window-resize controller: gives every movable `.window.panel` a
// south-east corner grip, hit-tested on the window's own border box (no handle
// element, so it survives the innerHTML rebuilds every window does and never
// scrolls away with the content; the grip visual is a background layer on
// `.window.window-resizable`, see src/styles/layout.css).
//
// Event-driven chrome like the hud.ts window drag (not a per-frame painter):
// document-level pointer delegation, pointer capture on the window, and the
// same visual-vs-author space correction (see src/ui/ui_scale.ts). Owned state
// is one active session; everything else is injected via deps (never Hud).
import {
  isInResizeCorner,
  RESIZE_CORNER_BAND,
  RESIZE_CORNER_BAND_TOUCH,
  resizedWindowSize,
  WINDOW_MIN_HEIGHT,
  WINDOW_MIN_WIDTH,
  WINDOW_RESIZE_MARGIN,
} from './window_resize_core';

export interface WindowResizeDeps {
  /** Live UI zoom factor (divide visual coords by it for author lengths). */
  getScale(): number;
  /**
   * Convert the window's centering transform into pixel left/top before the
   * first size write, so growing the width extends the right edge instead of
   * both edges (Hud wires this to setWindowPixelPosition).
   */
  pinWindow(el: HTMLElement, rect: DOMRect): void;
  /** Coarse-pointer probe; defaults to a matchMedia check. */
  isCoarsePointer?(): boolean;
}

// Windows whose body is not reflowable content: fixed-size boards/popups and
// the modal prompts. Everything else gets the grip.
const NON_RESIZABLE_WINDOW_IDS = new Set([
  'map-window',
  'loot-window',
  'confirm-dialog',
  'mobile-extra-controls',
  'lockpick-panel',
  'emote-editor',
]);

export function isResizableWindow(el: HTMLElement): boolean {
  return !NON_RESIZABLE_WINDOW_IDS.has(el.id);
}

interface ResizeSession {
  el: HTMLElement;
  pointerId: number;
  /** Author-space rect at pointerdown. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Visual-space pointer origin. */
  startX: number;
  startY: number;
}

/** Install the shared resize behavior. Returns a teardown (for tests). */
export function installWindowResize(deps: WindowResizeDeps): () => void {
  const coarse =
    deps.isCoarsePointer ?? (() => window.matchMedia?.('(pointer: coarse)').matches ?? false);

  const stamp = (el: HTMLElement) => {
    if (isResizableWindow(el)) el.classList.add('window-resizable');
  };
  document.querySelectorAll<HTMLElement>('.window.panel').forEach(stamp);
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches('.window.panel')) stamp(node);
        node.querySelectorAll<HTMLElement>('.window.panel').forEach(stamp);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  let session: ResizeSession | null = null;
  let hotEl: HTMLElement | null = null;

  const bandVisual = () =>
    (coarse() ? RESIZE_CORNER_BAND_TOUCH : RESIZE_CORNER_BAND) * deps.getScale();

  // The window under the pointer when the pointer sits in its SE corner band
  // (and not on a control that must keep the corner click for itself).
  const cornerHit = (ev: PointerEvent): HTMLElement | null => {
    const target = ev.target as HTMLElement | null;
    if (!target?.closest) return null;
    const el = target.closest<HTMLElement>('.window.panel');
    if (!el || !el.classList.contains('window-resizable')) return null;
    if (target.closest('button, input, textarea, select, a, [draggable="true"]')) return null;
    const rect = el.getBoundingClientRect();
    return isInResizeCorner(rect, ev.clientX, ev.clientY, bandVisual()) ? el : null;
  };

  // Touch scrolling cannot be stopped from pointermove; a non-passive touchmove
  // guard is attached only while a resize is active.
  const touchGuard = (ev: TouchEvent) => ev.preventDefault();

  const endSession = () => {
    if (!session) return;
    session.el.classList.remove('window-resizing');
    document.removeEventListener('touchmove', touchGuard);
    session = null;
  };

  const onPointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0 || session) return;
    const el = cornerHit(ev);
    if (!el) return;
    ev.preventDefault();
    const rect = el.getBoundingClientRect();
    deps.pinWindow(el, rect);
    const z = deps.getScale();
    session = {
      el,
      pointerId: ev.pointerId,
      left: rect.left / z,
      top: rect.top / z,
      width: rect.width / z,
      height: rect.height / z,
      startX: ev.clientX,
      startY: ev.clientY,
    };
    el.classList.add('window-resizing');
    // Both flags matter: sized keeps the manual size, moved opts the window into
    // the viewport-resize re-clamp pass hud.ts already runs.
    el.dataset.windowSized = '1';
    el.dataset.windowMoved = '1';
    try {
      el.setPointerCapture?.(ev.pointerId);
    } catch {
      /* synthetic/legacy pointer without active capture */
    }
    document.addEventListener('touchmove', touchGuard, { passive: false });
  };

  const onPointerMove = (ev: PointerEvent) => {
    if (session) {
      if (session.pointerId !== ev.pointerId) return;
      ev.preventDefault();
      const z = deps.getScale();
      const { width, height } = resizedWindowSize(
        session,
        (ev.clientX - session.startX) / z,
        (ev.clientY - session.startY) / z,
        {
          viewportWidth: window.innerWidth / z,
          viewportHeight: window.innerHeight / z,
          minWidth: WINDOW_MIN_WIDTH,
          minHeight: WINDOW_MIN_HEIGHT,
          margin: WINDOW_RESIZE_MARGIN,
        },
      );
      session.el.style.width = `${width}px`;
      session.el.style.height = `${height}px`;
      return;
    }
    // Hover affordance: swap the resize cursor class as the pointer crosses the
    // corner band (event-driven, only while the pointer is over a window).
    const el = cornerHit(ev);
    if (hotEl && hotEl !== el) hotEl.classList.remove('window-resize-hot');
    if (el && el !== hotEl) el.classList.add('window-resize-hot');
    hotEl = el;
  };

  const onPointerEnd = (ev: PointerEvent) => {
    if (session && session.pointerId === ev.pointerId) endSession();
  };

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerEnd);
  document.addEventListener('pointercancel', onPointerEnd);

  return () => {
    endSession();
    hotEl?.classList.remove('window-resize-hot');
    hotEl = null;
    observer.disconnect();
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerEnd);
    document.removeEventListener('pointercancel', onPointerEnd);
  };
}
