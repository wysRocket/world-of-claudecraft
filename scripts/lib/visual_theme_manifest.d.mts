export type VisualThemeSpecFile = Readonly<{
  name: string;
  source: string;
}>;

export type GeneratedVisualThemeCatalog = Readonly<
  Partial<Record<'emberwood', Readonly<Record<string, string>>>>
>;

export function buildVisualThemeCatalog(
  files: readonly VisualThemeSpecFile[],
): GeneratedVisualThemeCatalog;

export function serializeVisualThemeCatalog(catalog: GeneratedVisualThemeCatalog): string;

export function resolveVisualThemeTarget(publicDir: string, target: string): string;

export function collectMissingVisualThemeTargetWarnings(
  catalog: GeneratedVisualThemeCatalog,
  publicDir: string,
  targetExists: (targetPath: string) => boolean,
): string[];

export function isVisualThemeCatalogFresh(actual: string, expected: string): boolean;
