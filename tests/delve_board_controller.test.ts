import { describe, expect, it, vi } from 'vitest';
import { DELVES } from '../src/sim/data';
import type { FocusTrapHandle } from '../src/ui/focus_manager';
import { DelveBoardController } from '../src/ui/hud/delve/delve_board_controller';
import type { IWorld } from '../src/world_api';
import { FakeDocument } from './helpers/fake_dom';

function makeHarness(validNpc = true) {
  const document = new FakeDocument();
  const enterButton = document.createElement('button');
  const panel = {
    style: { display: 'none' },
    innerHTML: '',
    querySelectorAll: () => [],
    querySelector: (selector: string) => (selector === '[data-delve-enter]' ? enterButton : null),
  } as unknown as HTMLElement;
  const delve = DELVES.collapsed_reliquary;
  const entities = new Map([
    [
      7,
      validNpc
        ? { id: 7, kind: 'npc', templateId: delve.boardNpcId }
        : { id: 7, kind: 'mob', templateId: 'wolf' },
    ],
  ]);
  const enterDelve = vi.fn();
  const companionUpgrade = vi.fn();
  const world = {
    entities,
    player: { level: delve.minLevel, name: 'BoardTester' },
    partyInfo: null,
    delveMarks: 0,
    companionUpgrades: {},
    delveShopOffers: () => [],
    delveBuyShopItem: vi.fn(),
    companionUpgrade,
    enterDelve,
  } as unknown as IWorld;
  const focusFirst = vi.fn();
  const release = vi.fn();
  const trap: FocusTrapHandle = { focusFirst, release };
  const openFocusTrap = vi.fn(() => trap);
  const closeOtherWindows = vi.fn();
  const hideTooltip = vi.fn();
  const preloadInterior = vi.fn();
  const controller = new DelveBoardController({
    element: panel,
    world: () => world,
    openFocusTrap,
    closeOtherWindows,
    hideTooltip,
    attachTooltip: () => {},
    itemIcon: () => '<span class="item-icon"></span>',
    itemTooltip: () => '',
    delveName: () => 'The Test Reliquary',
    preloadInterior,
  });
  return {
    controller,
    panel,
    enterButton,
    entities,
    enterDelve,
    preloadInterior,
    focusFirst,
    release,
    openFocusTrap,
    closeOtherWindows,
    hideTooltip,
  };
}

describe('DelveBoardController', () => {
  it('rejects entities that are not a matching board NPC', () => {
    const test = makeHarness(false);

    test.controller.open(7);

    expect(test.controller.isOpen).toBe(false);
    expect(test.panel.style.display).toBe('none');
    expect(test.openFocusTrap).not.toHaveBeenCalled();
  });

  it('opens one focused board lifetime and renders authoritative requirements', () => {
    const test = makeHarness();

    test.controller.open(7);
    test.controller.open(7);

    expect(test.controller.isOpen).toBe(true);
    expect(test.panel.style.display).toBe('block');
    expect(test.panel.innerHTML).toContain('The Test Reliquary');
    expect(test.closeOtherWindows).toHaveBeenCalledWith('#delve-board');
    expect(test.openFocusTrap).toHaveBeenCalledTimes(1);
    expect(test.focusFirst).toHaveBeenCalledWith('.delve-enter-btn');
  });

  it('sends the selected tier through IWorld and preloads the same interior event', () => {
    const test = makeHarness();
    test.controller.open(7);

    test.enterButton.dispatchEvent(new Event('click'));

    expect(test.enterDelve).toHaveBeenCalledWith('collapsed_reliquary', 'normal');
    expect(test.preloadInterior).toHaveBeenCalledWith({
      type: 'delveEntered',
      delveId: 'collapsed_reliquary',
      tierId: 'normal',
    });
    expect(test.controller.isOpen).toBe(false);
    expect(test.release).toHaveBeenCalledWith(true);
  });

  it('closes and restores focus if the authoritative NPC disappears', () => {
    const test = makeHarness();
    test.controller.open(7);
    test.entities.delete(7);

    test.controller.render();

    expect(test.controller.isOpen).toBe(false);
    expect(test.panel.style.display).toBe('none');
    expect(test.hideTooltip).toHaveBeenCalled();
    expect(test.release).toHaveBeenCalledWith(true);
  });
});
