export type VisualThemeId = 'classic' | 'emberwood';
export type VisualThemeCatalog = Readonly<
  Partial<Record<VisualThemeId, Readonly<Record<string, string>>>>
>;

const VALID_THEMES = new Set<VisualThemeId>(['classic', 'emberwood']);

function isVisualTheme(value: unknown): value is VisualThemeId {
  return typeof value === 'string' && VALID_THEMES.has(value as VisualThemeId);
}

export function resolveVisualTheme(search: string, buildDefault: unknown): VisualThemeId {
  const query = new URLSearchParams(search).get('visual');
  if (isVisualTheme(query)) return query;
  return isVisualTheme(buildDefault) ? buildDefault : 'classic';
}

export function themedAssetPath(
  url: string,
  theme: VisualThemeId,
  catalog: VisualThemeCatalog,
): string {
  if (theme === 'classic') return url;
  const leadingSlash = url.startsWith('/') ? '/' : '';
  const logical = url.replace(/^\/+/, '');
  const entries = catalog[theme];
  const replacement = entries && Object.hasOwn(entries, logical) ? entries[logical] : undefined;
  return replacement ? `${leadingSlash}${replacement}` : url;
}
