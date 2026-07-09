// @vitest-environment jsdom
//
// Behavioral guards for the vendor window painter (the pure sellable/buyback
// decisions are unit-tested in vendor_view.test.ts). These render the real DOM
// through the shared window-frame builder and assert: the frame chrome is
// stamped, the body uses the .list-rows / .item-cell grammar, interpolated item
// names pass through esc(), the empty stock state renders, the footer hosts the
// primary sell action, and the close control routes to the injected onClose dep.

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ItemDef } from '../src/sim/types';
import type { VendorView } from '../src/ui/vendor_view';
import { renderVendorWindow, type VendorWindowDeps } from '../src/ui/vendor_window';
import { isWindowDragHandle } from '../src/ui/window_drag_handle';

// Force a controllable item name so the esc() path is testable without depending
// on the tEntity resolver internals.
vi.mock('../src/ui/entity_i18n', () => ({
  itemDisplayName: () => '<img src=x onerror=alert(1)>',
}));

function item(id: string, quality: ItemDef['quality'] = 'common'): ItemDef {
  return {
    id,
    name: id,
    quality,
    kind: 'junk',
    slot: 'trinket',
    sellValue: 3,
    buyValue: 5,
  } as unknown as ItemDef;
}

function fakeDeps(overrides: Partial<VendorWindowDeps> = {}): VendorWindowDeps {
  return {
    itemIcon: () => '<img class="item-icon" alt="">',
    moneyHtml: (copper: number) => `<span class="money-inline">${copper}</span>`,
    itemTooltip: () => '<div>tt</div>',
    attachTooltip: () => {},
    hideTooltip: () => {},
    onBuy: () => {},
    onBuyBack: () => {},
    onSellJunk: () => {},
    onClose: () => {},
    sellJunk: { enabled: false, proceeds: 0 },
    ...overrides,
  };
}

function vendorEl(): HTMLElement {
  const el = document.createElement('div');
  el.id = 'vendor-window';
  el.className = 'window panel';
  document.body.classList.add('vendor-open');
  return el;
}

// The touch-HUD test toggles body.mobile-touch; clear it so it never leaks into a
// later desktop-path assertion (the shared jsdom document.body persists).
afterEach(() => {
  document.body.classList.remove('mobile-touch');
});

describe('renderVendorWindow: frame adoption', () => {
  it('stamps the window-frame chrome on an INNER mount with titlebar, body, footer, close', () => {
    const el = vendorEl();
    renderVendorWindow(el, 'Gorznak', { goods: [], buyback: [] }, fakeDeps());
    // The shared root never carries builder state (the Heroic Quartermaster is
    // a second tenant of #vendor-window); the frame lives on an inner mount.
    expect(el.classList.contains('window-frame')).toBe(false);
    expect(el.hasAttribute('role')).toBe(false);
    const frame = el.querySelector<HTMLElement>(':scope > .window-frame');
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute('role')).toBe('dialog');
    expect(frame?.getAttribute('aria-labelledby')).toBe('vendor-window-title');
    expect(frame?.querySelector('.window-titlebar')).not.toBeNull();
    expect(frame?.querySelector('.window-body')).not.toBeNull();
    expect(frame?.querySelector('.window-footer')).not.toBeNull();
    expect(frame?.querySelector('[data-window-close]')).not.toBeNull();
    // Shown as a flex column (the Market precedent) so the shared grammar can
    // bound the inner frame and scroll the body internally.
    expect(el.style.display).toBe('flex');
  });

  it('sets the title to the merchant name (the frame builder cannot interpolate it)', () => {
    const el = vendorEl();
    renderVendorWindow(el, 'Gorznak', { goods: [], buyback: [] }, fakeDeps());
    expect(el.querySelector('.window-title')?.textContent).toContain('Gorznak');
  });

  it('reuses the frame on a second render instead of rebuilding it cold', () => {
    const el = vendorEl();
    renderVendorWindow(el, 'V', { goods: [], buyback: [] }, fakeDeps());
    const firstBody = el.querySelector('.window-body');
    renderVendorWindow(el, 'V', { goods: [], buyback: [] }, fakeDeps());
    expect(el.querySelector('.window-body')).toBe(firstBody);
    expect(el.querySelectorAll('.window-titlebar').length).toBe(1);
  });
});

describe('renderVendorWindow: move / resize / fit parity with the World Market', () => {
  it('makes the frame titlebar a drag handle the Hud recognizes, but never the close button', () => {
    const el = vendorEl();
    renderVendorWindow(el, 'Gorznak', { goods: [], buyback: [] }, fakeDeps());
    const titlebar = el.querySelector<HTMLElement>('.window-titlebar');
    const title = el.querySelector<HTMLElement>('.window-title');
    const closeBtn = el.querySelector<HTMLElement>('[data-window-close]');
    expect(titlebar).not.toBeNull();
    // Pressing the titlebar (or the title text within it) starts a window drag,
    // exactly as pressing the Market's .panel-title does.
    expect(isWindowDragHandle(titlebar as HTMLElement, el)).toBe(true);
    expect(isWindowDragHandle(title as HTMLElement, el)).toBe(true);
    // The close control is an excluded interactive target: it must never drag.
    expect(isWindowDragHandle(closeBtn as HTMLElement, el)).toBe(false);
  });

  it('frames a bounded flex column: pinned titlebar then a scrollable body then a pinned footer', () => {
    const el = vendorEl();
    renderVendorWindow(el, 'V', { goods: [], buyback: [] }, fakeDeps());
    const frame = el.querySelector<HTMLElement>(':scope > .window-frame');
    expect(frame).not.toBeNull();
    // The structural classes the shared grammar keys on: .window-body is the one
    // scroll region between the flex:none titlebar and footer. Their DOM order is
    // the flex-column order the CSS (titlebar auto, body flex:1 min-height:0
    // overflow-y:auto, footer auto) relies on.
    const order = Array.from(frame?.children ?? []).map((c) => (c as HTMLElement).className);
    expect(order).toEqual(['window-titlebar', 'window-body', 'window-footer']);
    expect(frame?.querySelectorAll('.window-body').length).toBe(1);
  });

  it('opens display:flex on desktop but display:block on the touch dock (both visible, never none)', () => {
    // Desktop: flex, so the shared grammar can bound the inner frame.
    const desktop = vendorEl();
    renderVendorWindow(desktop, 'V', { goods: [], buyback: [] }, fakeDeps());
    expect(desktop.style.display).toBe('flex');
    expect(desktop.style.display).not.toBe('none');
    // Touch HUD: block, so the inline value matches the 50/50 dock CSS
    // (body.mobile-touch.vendor-open) instead of overriding it. Still !== 'none',
    // so the language-switch re-render guard fires either way.
    document.body.classList.add('mobile-touch');
    const mobile = vendorEl();
    renderVendorWindow(mobile, 'V', { goods: [], buyback: [] }, fakeDeps());
    expect(mobile.style.display).toBe('block');
    expect(mobile.style.display).not.toBe('none');
  });
});

describe('renderVendorWindow: shared-root handoff to the heroic vendor', () => {
  // The Heroic Quartermaster paints the same #vendor-window root with a plain
  // innerHTML replacement (renderHeroicVendorWindow's contract); model that.
  function heroicPaint(root: HTMLElement): void {
    root.innerHTML =
      '<div class="panel-title"><span>Quartermaster</span></div>' +
      '<button type="button" class="vendor-item">offer</button>';
    root.style.display = 'block';
  }

  it('leaves the root pristine after open + close, so a heroic open renders as fresh', () => {
    const el = vendorEl();
    const pristineAttrs = el.getAttributeNames().sort();
    const view: VendorView = {
      goods: [{ itemId: 'blade', item: item('blade'), price: 5, quantity: 1 }],
      buyback: [],
    };
    renderVendorWindow(el, 'V', view, fakeDeps());

    // Even while OPEN the root carries no builder class/attributes: this also
    // covers the direct copper-to-heroic handoff, which never closes the vendor.
    expect(el.className).toBe('window panel');
    expect(el.getAttributeNames().sort()).toEqual([...pristineAttrs, 'style'].sort());

    // Teardown: Hud's closeVendor only hides the window.
    el.style.display = 'none';
    expect(el.className).toBe('window panel');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
    expect(el.hasAttribute('aria-modal')).toBe(false);

    // Heroic takeover renders byte-identical to a fresh session.
    heroicPaint(el);
    const fresh = document.createElement('div');
    fresh.id = 'vendor-window';
    fresh.className = 'window panel';
    heroicPaint(fresh);
    expect(el.outerHTML).toBe(fresh.outerHTML);
    expect(el.querySelector('.window-frame')).toBeNull();
  });

  it('rebuilds the frame cold after heroic content replaced the mount', () => {
    const el = vendorEl();
    renderVendorWindow(el, 'V', { goods: [], buyback: [] }, fakeDeps());
    heroicPaint(el);
    renderVendorWindow(el, 'V', { goods: [], buyback: [] }, fakeDeps());
    const frame = el.querySelector<HTMLElement>(':scope > .window-frame');
    expect(frame?.querySelector('.window-body')).not.toBeNull();
    // The heroic leftovers are gone; the mount is the only child again.
    expect(el.children.length).toBe(1);
    expect(el.querySelector('.panel-title')).toBeNull();
  });
});

describe('renderVendorWindow: body grammar', () => {
  it('renders goods as .list-rows / .item-cell with a rarity border and the money price', () => {
    const el = vendorEl();
    const moneyHtml = vi.fn((copper: number) => `<span class="money-inline">${copper}</span>`);
    const view: VendorView = {
      goods: [{ itemId: 'blade', item: item('blade', 'rare'), price: 25, quantity: 5 }],
      buyback: [],
    };
    renderVendorWindow(el, 'V', view, fakeDeps({ moneyHtml }));
    expect(el.querySelector('.window-body .list-rows')).not.toBeNull();
    const cell = el.querySelector<HTMLElement>('.item-cell');
    expect(cell?.getAttribute('data-quality')).toBe('rare');
    // stacked goods show the count in the cell corner
    expect(cell?.querySelector('.item-cell-count')?.textContent).toBe('5');
    expect(moneyHtml).toHaveBeenCalledWith(25);
    expect(el.querySelector('.vendor-row')?.getAttribute('aria-label')).toContain('Buy');
  });

  it('renders the empty-state for empty stock', () => {
    const el = vendorEl();
    renderVendorWindow(el, 'V', { goods: [], buyback: [] }, fakeDeps());
    expect(el.querySelector('.window-body .empty-state')).not.toBeNull();
  });

  it('escapes interpolated item names through esc() (no live injection)', () => {
    const el = vendorEl();
    const view: VendorView = {
      goods: [{ itemId: 'evil', item: item('evil'), price: 5, quantity: 1 }],
      buyback: [],
    };
    renderVendorWindow(el, 'V', view, fakeDeps());
    const name = el.querySelector('.vendor-row-name');
    expect(name?.querySelector('img')).toBeNull();
    expect(name?.innerHTML).toContain('&lt;img');
  });
});

describe('renderVendorWindow: footer action + callbacks', () => {
  it('styles the primary transactional action with .btn.is-primary in the footer', () => {
    const el = vendorEl();
    renderVendorWindow(
      el,
      'V',
      { goods: [], buyback: [] },
      fakeDeps({ sellJunk: { enabled: true, proceeds: 12 } }),
    );
    const btn = el.querySelector<HTMLButtonElement>('.window-footer .btn.is-primary');
    expect(btn).not.toBeNull();
    expect(btn?.disabled).toBe(false);
  });

  it('fires onBuy, onBuyBack, and onSellJunk through the injected deps', () => {
    const el = vendorEl();
    const onBuy = vi.fn();
    const onBuyBack = vi.fn();
    const onSellJunk = vi.fn();
    const view: VendorView = {
      goods: [{ itemId: 'blade', item: item('blade'), price: 5, quantity: 1 }],
      buyback: [{ itemId: 'ring', item: item('ring'), count: 1, price: 3 }],
    };
    renderVendorWindow(
      el,
      'V',
      view,
      fakeDeps({ onBuy, onBuyBack, onSellJunk, sellJunk: { enabled: true, proceeds: 9 } }),
    );
    el.querySelectorAll<HTMLButtonElement>('.vendor-row')[0].click();
    el.querySelectorAll<HTMLButtonElement>('.vendor-row')[1].click();
    el.querySelector<HTMLButtonElement>('.window-footer .vendor-sell')?.click();
    expect(onBuy).toHaveBeenCalledWith('blade');
    expect(onBuyBack).toHaveBeenCalledWith('ring');
    expect(onSellJunk).toHaveBeenCalledTimes(1);
  });

  it('routes the close control to the injected onClose dep', () => {
    const el = vendorEl();
    const onClose = vi.fn();
    renderVendorWindow(el, 'V', { goods: [], buyback: [] }, fakeDeps({ onClose }));
    el.querySelector<HTMLElement>('[data-window-close]')?.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
