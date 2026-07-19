import { VISUAL_THEME_CATALOG } from './visual_theme_catalog.generated';
import { resolveVisualTheme, themedAssetPath, type VisualThemeId } from './visual_theme_core';

const search = typeof location === 'undefined' ? '' : location.search;
const stampedDefault =
  typeof document === 'undefined' ? undefined : document.documentElement.dataset.visualTheme;
const buildDefault =
  stampedDefault === 'classic' || stampedDefault === 'emberwood'
    ? stampedDefault
    : import.meta.env.VITE_VISUAL_THEME;

export const ACTIVE_VISUAL_THEME: VisualThemeId = resolveVisualTheme(search, buildDefault);

export function visualAssetPath(url: string): string {
  return themedAssetPath(url, ACTIVE_VISUAL_THEME, VISUAL_THEME_CATALOG);
}

export function applyVisualTheme(root: HTMLElement): void {
  root.dataset.visualTheme = ACTIVE_VISUAL_THEME;
}
