import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const bootstrapMatch = html.match(/<script id="visual-theme-bootstrap">([\s\S]*?)<\/script>/);

function bootstrapSource(): string {
  expect(bootstrapMatch, 'index.html must contain the visual theme bootstrap').not.toBeNull();
  return bootstrapMatch?.[1] ?? '';
}

function runBootstrap(search: string, buildDefault: string): string | undefined {
  const dataset: Record<string, string> = {};
  const source = bootstrapSource().replaceAll(
    '__VISUAL_THEME_BUILD_DEFAULT__',
    JSON.stringify(buildDefault),
  );
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
});
