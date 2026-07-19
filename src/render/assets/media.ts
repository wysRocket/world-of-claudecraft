import { ACTIVE_VISUAL_THEME } from '../../visual_theme';
import { VISUAL_THEME_CATALOG } from '../../visual_theme_catalog.generated';
import {
  themedAssetPath,
  type VisualThemeCatalog,
  type VisualThemeId,
} from '../../visual_theme_core';
import { MEDIA_ASSETS } from './manifest.generated';

function logicalPath(url: string): string {
  return url.replace(/^\/+/, '');
}

export function resolveMediaLogicalPath(
  url: string,
  theme: VisualThemeId,
  catalog: VisualThemeCatalog = VISUAL_THEME_CATALOG,
): string {
  return logicalPath(themedAssetPath(url, theme, catalog));
}

export function resolveMediaAssetUrl(
  logical: string,
  dev: boolean,
  manifest: Readonly<Record<string, string>> = MEDIA_ASSETS,
): string {
  if (dev) return `/${logical}`;
  return manifest[logical] ?? `/${logical}`;
}

export function assetUrl(url: string): string {
  const logical = resolveMediaLogicalPath(url, ACTIVE_VISUAL_THEME);
  return resolveMediaAssetUrl(logical, import.meta.env.DEV);
}

export { ACTIVE_VISUAL_THEME };
