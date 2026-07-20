# Emberwood render policy modules

Presentation-only: these modules provide theme-aware lighting, terrain, and foliage
color policies. They never mutate the sim, fetch assets, or add new methods to the
renderer coordinator.

## Invariants
- **No sim mutation.** Lighting and palette values are pure data consumed by the
  renderer for aesthetic presentation only.
- **Low-tier information parity.** All policy values preserve readability at every
  graphics tier. A tier knob may shed cosmetic richness but never hides actionable
  gameplay information.
- **No raw asset fetching.** Policies return color/lighting values, never URLs or
  asset handles. Asset replacement is handled by the visual theme catalog.
- **No new renderer methods.** Consumers swap a `lightingForTheme()` call at existing
  construction/assignment points in `renderer.ts`, `terrain.ts`, and `foliage.ts`.
  Add new selectors here, not new methods on the Renderer class.

## Exports
- `lighting.ts`: `lightingForTheme(theme)` returns fog, hemi, and sun values.
- `palette.ts`: `terrainPaletteForTheme(theme)` and `foliagePaletteForTheme(theme)`
  return per-biome color tables with Vale overrides for Emberwood.
