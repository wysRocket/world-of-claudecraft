// Pure conflict / unbound / duplicate computation for the Esc menu's Keybinds and
// Controller categories (esc-menu-redesign-spec section 7). DOM-free, i18n-runtime-free,
// deterministic: it reads plain-data snapshots of the two input tables and returns the
// state the UI surfaces three ways: inline on the affected row, as the top-of-pane error
// banner, and as the aggregate warning dot on the rail category. Registered in
// tests/architecture.test.ts UI_PURE_CORES (and BARE_NAMED, the name being bare).
//
// It deliberately does NOT import the Keybinds / GamepadBindings classes (those are
// localStorage-backed and live in src/game, a forbidden layer for a ui pure core): the
// caller adapts them into the plain rows below, exactly as options_ia stays decoupled
// from the live GameSettings. The keyboard invariant it models is the classic one Keybinds
// enforces: one code lives on at most one action, up to two codes per action, with
// allowShared actions (Attack Move) exempt from the uniqueness sweep. The controller map
// has no uniqueness sweep (a pad may point several buttons at one action by design), so
// duplicates there are surfaced, not prevented.

/** The unbound-button sentinel in the controller map. Mirrors gamepad_map's GAMEPAD_NONE
 *  without importing across the layer boundary; an empty string is treated the same. A
 *  rename there is caught by the controller-duplicate tests. */
const CONTROLLER_UNBOUND = 'none';

/** One keyboard action's binding state, adapted from a live Keybinds row: the action id,
 *  its bind category, its up-to-two code slots (null = empty), and whether it is exempt
 *  from the one-code-per-action uniqueness sweep (Attack Move). The caller passes only the
 *  rows currently VISIBLE (e.g. it omits Attack Move while that setting is off). */
export interface KeyboardBindRow {
  id: string;
  category: string;
  codes: readonly (string | null)[];
  allowShared?: boolean;
}

/** One controller button's binding, adapted from GamepadBindings.entries(): the button
 *  index, its bound action id (CONTROLLER_UNBOUND / '' = unbound), and the button's
 *  localized/brand glyph name (resolved by the caller, so this core stays i18n-free). */
export interface ControllerBindRow {
  button: number;
  action: string;
  label: string;
}

/** The eviction a just-performed keyboard steal caused: the moved key, the action that
 *  gained it, and the action it was removed from. Feeds the "Bound {key} to {action};
 *  removed from {evicted}" announce/chip. */
export interface EvictionNotice {
  code: string;
  gained: string;
  evicted: string;
}

/** A set of controller buttons pointing at one non-Unbound action: the shared action id,
 *  the button indices (ascending), and their glyph names (parallel to buttons), so the
 *  warning chip can name the duplicate. */
export interface ControllerDuplicate {
  action: string;
  buttons: number[];
  labels: string[];
}

export interface KeybindConflicts {
  /** Keyboard action ids with no bound code, in input order (banner + inline cue). */
  unbound: string[];
  /** Codes held by two or more non-shared keyboard actions, ascending unique. Under the
   *  steal invariant a rebind never creates one; a genuine default-layout collision (or a
   *  loaded profile) can still surface here. */
  duplicateCodes: string[];
  /** Controller actions bound to more than one button, one named group each. */
  controllerDuplicates: ControllerDuplicate[];
  /** Aggregate for the rail's Keybinds category dot: any keyboard unbound or duplicate. */
  keyboardWarning: boolean;
  /** Aggregate for the rail's Controller category dot: any controller duplicate. */
  controllerWarning: boolean;
  /** Either aggregate (the Overview alert row). */
  anyWarning: boolean;
}

function isBoundController(action: string): boolean {
  return action !== '' && action !== CONTROLLER_UNBOUND;
}

/** Compute the full conflict state from the two adapted tables. Pure. */
export function computeKeybindConflicts(
  keyboard: readonly KeyboardBindRow[],
  controller: readonly ControllerBindRow[],
): KeybindConflicts {
  // Unbound keyboard actions: every code slot empty.
  const unbound = keyboard.filter((row) => row.codes.every((c) => c === null)).map((row) => row.id);

  // Duplicate codes: a code carried by 2+ NON-shared actions. Shared actions (Attack Move)
  // deliberately overlap another action's key, so they are excluded from both sides.
  const holders = new Map<string, Set<string>>();
  for (const row of keyboard) {
    if (row.allowShared) continue;
    for (const code of row.codes) {
      if (code === null) continue;
      let set = holders.get(code);
      if (!set) {
        set = new Set<string>();
        holders.set(code, set);
      }
      set.add(row.id);
    }
  }
  const duplicateCodes = [...holders.entries()]
    .filter(([, ids]) => ids.size > 1)
    .map(([code]) => code)
    .sort();

  // Controller duplicates: group bound buttons by action, keep the 2+ groups. Buttons are
  // grouped in the row order given, then sorted ascending with labels kept parallel.
  const byAction = new Map<string, ControllerBindRow[]>();
  for (const row of controller) {
    if (!isBoundController(row.action)) continue;
    const list = byAction.get(row.action);
    if (list) list.push(row);
    else byAction.set(row.action, [row]);
  }
  const controllerDuplicates: ControllerDuplicate[] = [];
  for (const [action, rows] of byAction) {
    if (rows.length < 2) continue;
    const sorted = [...rows].sort((a, b) => a.button - b.button);
    controllerDuplicates.push({
      action,
      buttons: sorted.map((r) => r.button),
      labels: sorted.map((r) => r.label),
    });
  }

  const keyboardWarning = unbound.length > 0 || duplicateCodes.length > 0;
  const controllerWarning = controllerDuplicates.length > 0;
  return {
    unbound,
    duplicateCodes,
    controllerDuplicates,
    keyboardWarning,
    controllerWarning,
    anyWarning: keyboardWarning || controllerWarning,
  };
}

/**
 * Describe the eviction a keyboard steal just performed: given the BEFORE table, the
 * action that gained `code`, and `code` itself, return which action lost it. Mirrors the
 * real Keybinds.bind() sweep exactly: it runs only when the GAINING action is not shared,
 * and it never evicts a shared holder (Attack Move keeps its intentionally shared key).
 * Returns null when nothing was evicted.
 */
export function describeEviction(
  before: readonly KeyboardBindRow[],
  gained: string,
  code: string,
): EvictionNotice | null {
  const gainedRow = before.find((row) => row.id === gained);
  if (gainedRow?.allowShared) return null; // the steal sweep is skipped for a shared gainer
  const loser = before.find(
    (row) => row.id !== gained && !row.allowShared && row.codes.includes(code),
  );
  return loser ? { code, gained, evicted: loser.id } : null;
}
