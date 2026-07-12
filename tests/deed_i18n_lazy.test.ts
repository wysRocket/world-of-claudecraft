// The deed-locale lazy loader seam (the i18n_lazy_loader shape scoped to the
// Book of Deeds): the 21 release-fill deed tables live in ONE dynamically
// imported chunk (deed_i18n.newlocales.ts), so a default-English player
// downloads zero deed locale bytes. Every lookup (deedName/deedDesc/
// deedTitleText) stays SYNCHRONOUS: before the chunk is resident a non-en
// read falls back to the authored English (the documented absent-table
// behavior), and ensureDeedLocalesLoaded makes the localized tables resident
// behind the same awaits as ensureLocaleLoaded. A failed chunk fetch rejects
// (the caller owns the UI) without crashing, leaving English in place and a
// retry possible.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEED_LOCALE_CHUNK,
  deedDesc,
  deedName,
  ensureDeedLocalesLoaded,
} from '../src/ui/deed_i18n';
import { setLanguage } from '../src/ui/i18n';

describe('lazy deed locales: lookups stay synchronous around ensureDeedLocalesLoaded', () => {
  afterEach(() => setLanguage('en'));

  it('falls back to English pre-load, rejects a failed chunk softly, and a retry lands Czech', async () => {
    setLanguage('cs_CZ');

    // Pre-load: the deed chunk is not resident, so the lookup renders the
    // authored English synchronously; it never blocks and never throws.
    expect(deedName('prog_first_steps')).toBe('First Steps');

    // Simulate a 404 / network failure on the chunk: the await rejects (the
    // caller owns the UI), English persists, and the cleared in-flight
    // promise leaves a retry possible.
    const failSpy = vi
      .spyOn(DEED_LOCALE_CHUNK, 'load')
      .mockRejectedValueOnce(new Error('simulated 404'));
    await expect(ensureDeedLocalesLoaded('cs_CZ')).rejects.toThrow(/simulated 404/);
    failSpy.mockRestore();
    expect(deedName('prog_first_steps')).toBe('First Steps');

    // Retry: two concurrent loads coalesce onto ONE import (spy-through, the
    // real chunk still resolves), then the Czech release-fill values (pinned
    // literals from deed_i18n.newlocales.ts) resolve synchronously.
    const loadSpy = vi.spyOn(DEED_LOCALE_CHUNK, 'load');
    try {
      await Promise.all([ensureDeedLocalesLoaded('cs_CZ'), ensureDeedLocalesLoaded('cs_CZ')]);
      expect(loadSpy).toHaveBeenCalledTimes(1);
    } finally {
      loadSpy.mockRestore();
    }
    expect(deedName('prog_first_steps')).toBe('První kroky');
    expect(deedDesc('prog_first_steps')).toBe(
      'Dosáhni úrovně 2 a udělej první krok na dlouhé cestě.',
    );
  });

  it('assembles the es_ES / fr_CA dialect merges on load (inherit base, override delve vocabulary)', async () => {
    await ensureDeedLocalesLoaded('es_ES');
    setLanguage('es_ES');
    // The dialect's own delve noun (the shipped delveUi vocabulary) proves the
    // override layer applied; a non-overridden entry inherits the base table
    // byte-identically (the talent_i18n localeText dialect model).
    expect(deedDesc('dlv_clears_50')).toContain('Profundidades');
    const dialectName = deedName('prog_first_steps');
    setLanguage('es');
    expect(deedName('prog_first_steps')).toBe(dialectName);
    expect(deedDesc('dlv_clears_50')).not.toContain('Profundidades');
  });

  it('is an instant no-op for en / en_CA and for an already-resident load', async () => {
    const spy = vi.spyOn(DEED_LOCALE_CHUNK, 'load');
    try {
      await expect(ensureDeedLocalesLoaded('en')).resolves.toBeUndefined();
      await expect(ensureDeedLocalesLoaded('en_CA')).resolves.toBeUndefined();
      // Resident from the earlier tests in this file: never re-fetches.
      await ensureDeedLocalesLoaded('de_DE');
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('deed_i18n.ts carries no static VALUE import of the newlocales chunk (the eager-bundle regression guard)', () => {
    const src = readFileSync(new URL('../src/ui/deed_i18n.ts', import.meta.url), 'utf8');
    // Only a type-only import (erased at build) or the dynamic import() (the
    // lazy chunk) may reference the module; a static value import would pull
    // all 21 tables back into the eager renderer bundle via hud.ts and
    // render/nameplate_painter.ts.
    expect(src).not.toMatch(
      /(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+'\.\/deed_i18n\.newlocales'/,
    );
    expect(src).toContain("import('./deed_i18n.newlocales')");
  });
});
