import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mainTs = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const hudTs = readFileSync(new URL('../src/ui/hud.ts', import.meta.url), 'utf8');

const REQUIRED_2FA_IDS = ['login-2fa-field', 'login-2fa-code'];
const REQUIRED_HUD_TEMPLATE_IDS = ['perf-overlay', 'tf-castbar', 'actionbar2'];

describe('single game entry login and HUD markup', () => {
  it('contains every 2FA element read by the login flow', () => {
    expect(mainTs).toContain("$('#login-2fa-field')");
    expect(mainTs).toContain("$('#login-2fa-code')");
    for (const id of REQUIRED_2FA_IDS) expect(indexHtml).toContain(`id="${id}"`);
  });

  it('contains every renderer-critical HUD element', () => {
    expect(mainTs).toContain("$('#perf-overlay')");
    expect(hudTs).toContain("$('#tf-castbar')");
    expect(hudTs).toContain("$('#actionbar2')");
    for (const id of REQUIRED_HUD_TEMPLATE_IDS) expect(indexHtml).toContain(`id="${id}"`);
  });
});
