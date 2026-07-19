import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { visualThemeHtmlPlugin } from '../scripts/lib/visual_theme_html';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function bootstrapSource(sourceHtml = html): string {
  const match = sourceHtml.match(/<script id="visual-theme-bootstrap">([\s\S]*?)<\/script>/);
  expect(match, 'index.html must contain the visual theme bootstrap').not.toBeNull();
  return match?.[1] ?? '';
}

function transformHtml(value: unknown): string {
  const plugin = visualThemeHtmlPlugin();
  plugin.configResolved({ env: { VITE_VISUAL_THEME: value } });
  return plugin.transformIndexHtml(html);
}

function runBootstrap(search: string, buildDefault: string): string | undefined {
  const dataset: Record<string, string> = {};
  const source = bootstrapSource(transformHtml(buildDefault));
  runInNewContext(source, {
    document: { documentElement: { dataset } },
    location: { search },
    URLSearchParams,
  });
  return dataset.visualTheme;
}

describe('visual theme first-paint bootstrap', () => {
  it('runs in the head before stylesheets and the deferred game module', () => {
    const bootstrapIndex = html.indexOf('<script id="visual-theme-bootstrap">');
    const stylesheetIndex = html.search(/<link[^>]+rel="stylesheet"/);
    const mainIndex = html.indexOf('<script type="module" src="/src/main.ts"></script>');

    expect(bootstrapIndex).toBeGreaterThan(html.indexOf('<head>'));
    expect(bootstrapIndex).toBeLessThan(stylesheetIndex);
    expect(bootstrapIndex).toBeLessThan(mainIndex);
    expect(bootstrapIndex).toBeLessThan(html.indexOf('</head>'));
  });

  it('synchronously stamps the first observed theme from query, default, or classic fallback', () => {
    expect(runBootstrap('?visual=classic', 'emberwood')).toBe('classic');
    expect(runBootstrap('?visual=emberwood', 'classic')).toBe('emberwood');
    expect(runBootstrap('', 'emberwood')).toBe('emberwood');
    expect(runBootstrap('?visual=invalid', 'invalid')).toBe('classic');
  });

  it('uses Vite resolved env values and safely rejects invalid inline values', () => {
    const emberwoodHtml = transformHtml('emberwood');
    expect(emberwoodHtml).toContain('const buildDefault = "emberwood";');
    expect(emberwoodHtml).toContain('new URLSearchParams(location.search)');
    expect(runBootstrap('', 'emberwood')).toBe('emberwood');
    expect(runBootstrap('?visual=classic', 'emberwood')).toBe('classic');

    const malicious = '</script><script>globalThis.injected=true</script>';
    const safeHtml = transformHtml(malicious);
    expect(safeHtml).toContain('const buildDefault = "classic";');
    expect(safeHtml).not.toContain(malicious);
    expect(safeHtml).not.toContain('globalThis.injected');
    expect(safeHtml.match(/<script id="visual-theme-bootstrap">/g)).toHaveLength(1);
  });
});
