import { ACTIVE_VISUAL_THEME, visualAssetPath } from '../../visual_theme';
import { VISUAL_THEME_CATALOG } from '../../visual_theme_catalog.generated';
import { themedAssetPath, type VisualThemeId } from '../../visual_theme_core';
import { MEDIA_ASSETS } from './manifest.generated';

function logicalPath(url: string): string {
  return url.replace(/^\/+/, '');
}

export function resolveMediaLogicalPath(url: string, theme: VisualThemeId): string {
  return logicalPath(themedAssetPath(url, theme, VISUAL_THEME_CATALOG));
}

export function assetUrl(url: string): string {
  const themed = visualAssetPath(url);
  const logical = logicalPath(themed);
  if (import.meta.env.DEV) return `/${logical}`;
  return MEDIA_ASSETS[logical] ?? `/${logical}`;
}

export { ACTIVE_VISUAL_THEME };
