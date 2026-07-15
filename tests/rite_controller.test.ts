import { describe, expect, it, vi } from 'vitest';
import type { FocusTrapHandle } from '../src/ui/focus_manager';
import { RiteController } from '../src/ui/hud/delve/rite_controller';
import { FakeDocument } from './helpers/fake_dom';

describe('RiteController', () => {
  it('owns one focus trap for the visible lifetime and releases it with the requested policy', () => {
    const document = new FakeDocument();
    const panel = document.element('delve-rite-panel');
    panel.style.display = 'none';
    const focusFirst = vi.fn();
    const release = vi.fn();
    const trap: FocusTrapHandle = { focusFirst, release };
    const openFocusTrap = vi.fn(() => trap);
    const controller = new RiteController({
      panel: panel as unknown as HTMLElement,
      openFocusTrap,
      choose: vi.fn(),
    });

    controller.open();
    controller.open();

    expect(panel.style.display).toBe('block');
    expect(panel.innerHTML).toContain('lp-ante-row');
    expect(openFocusTrap).toHaveBeenCalledTimes(1);
    expect(focusFirst).toHaveBeenCalledWith('.lp-ante-btn');

    controller.close(false);
    controller.close(false);
    expect(panel.style.display).toBe('none');
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith(false);
  });
});
