import type { ResolvedConfig } from 'vite';

const VISUAL_THEME_BUILD_DEFAULT_SENTINEL = '__VISUAL_THEME_BUILD_DEFAULT__';

export function serializeVisualThemeBuildDefault(value: unknown): string {
  const theme = value === 'emberwood' ? 'emberwood' : 'classic';
  return JSON.stringify(theme).replaceAll('<', '\\u003c');
}

export function visualThemeHtmlPlugin() {
  let serializedBuildDefault = serializeVisualThemeBuildDefault(undefined);

  return {
    name: 'woc-visual-theme-bootstrap',
    configResolved(config: Pick<ResolvedConfig, 'env'>): void {
      serializedBuildDefault = serializeVisualThemeBuildDefault(config.env.VITE_VISUAL_THEME);
    },
    transformIndexHtml(html: string): string {
      return html.replaceAll(VISUAL_THEME_BUILD_DEFAULT_SENTINEL, serializedBuildDefault);
    },
  };
}
