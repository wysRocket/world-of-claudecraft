// Phase 10 profession materials: dedicated corpse-harvest components, their
// rare Pristine specimen counterparts, and the cheap master-stocked craft
// reagents. Merged into ITEMS by data.ts (mergeItems), same pattern as
// ZONE2_ITEMS.
//
// Crafting materials are common (white): they are reagents, not vendor trash,
// so they must never fall into the junk sweep (sellAllJunk in src/sim/items.ts
// vendors every quality 'poor' item). Enforced by
// tests/crafting_materials_quality.test.ts.
import type { ItemDef } from '../types';

export const PROFESSION_ITEMS: Record<string, ItemDef> = {
  // --- Corpse-harvest components (HARVEST_COMPONENT_ITEMS) -----------------
  // One material per component tag; never vendor-stocked (no buyValue), so
  // the only supply is harvesting tagged corpses. The old quest items
  // (boar_hide/webwood_silk/widow_venom_sac) keep their quest roles only.
  rough_hide: {
    id: 'rough_hide',
    name: 'Rough Hide',
    kind: 'junk',
    quality: 'common',
    sellValue: 5,
  },
  spider_silk: {
    id: 'spider_silk',
    name: 'Spider Silk',
    kind: 'junk',
    quality: 'common',
    sellValue: 5,
  },
  venom_gland: {
    id: 'venom_gland',
    name: 'Venom Gland',
    kind: 'junk',
    quality: 'common',
    sellValue: 6,
  },
  game_meat: {
    id: 'game_meat',
    name: 'Game Meat',
    kind: 'junk',
    quality: 'common',
    sellValue: 4,
  },
  homespun_cloth: {
    id: 'homespun_cloth',
    name: 'Homespun Cloth',
    kind: 'junk',
    quality: 'common',
    sellValue: 4,
  },

  // --- Pristine specimens (HARVEST_COMPONENT_SPECIMENS) --------------------
  // The signed jackpot a rare-or-better corpse-harvest rarity roll grants IN
  // ADDITION to the plain component (src/sim/interaction.ts harvestCorpse).
  // Rare so they read as a find, sellValue modest so they never outearn real
  // drops.
  pristine_hide: {
    id: 'pristine_hide',
    name: 'Pristine Hide',
    kind: 'junk',
    quality: 'rare',
    sellValue: 25,
  },
  pristine_silk: {
    id: 'pristine_silk',
    name: 'Pristine Silk',
    kind: 'junk',
    quality: 'rare',
    sellValue: 25,
  },
  pristine_venom_gland: {
    id: 'pristine_venom_gland',
    name: 'Pristine Venom Gland',
    kind: 'junk',
    quality: 'rare',
    sellValue: 30,
  },
  prime_cut: {
    id: 'prime_cut',
    name: 'Prime Cut',
    kind: 'junk',
    quality: 'rare',
    sellValue: 20,
  },

  // --- Vendor craft reagents ----------------------------------------------
  // Cheap staples each deep-craft master stocks at their own station hub
  // (forge/loom/tannery/kitchens/apothecary). buyValue is what the player
  // pays; sellValue is the floor(buyValue / 4) staple ratio used by the
  // premium reagents above this file's merge (thorium_ore and friends).
  smithing_flux: {
    id: 'smithing_flux',
    name: 'Smithing Flux',
    kind: 'junk',
    quality: 'common',
    sellValue: 5,
    buyValue: 20,
  },
  spool_of_thread: {
    id: 'spool_of_thread',
    name: 'Spool of Thread',
    kind: 'junk',
    quality: 'common',
    sellValue: 3,
    buyValue: 12,
  },
  tanning_agent: {
    id: 'tanning_agent',
    name: 'Tanning Agent',
    kind: 'junk',
    quality: 'common',
    sellValue: 4,
    buyValue: 16,
  },
  cooking_salt: {
    id: 'cooking_salt',
    name: 'Cooking Salt',
    kind: 'junk',
    quality: 'common',
    sellValue: 2,
    buyValue: 8,
  },
  glass_vial: {
    id: 'glass_vial',
    name: 'Glass Vial',
    kind: 'junk',
    quality: 'common',
    sellValue: 3,
    buyValue: 12,
  },

  // --- Phase 10 crafted weapon ladder (weaponcrafting) ---------------------
  // Trainer-taught outputs of LADDER_RECIPES (content/recipes.ts), three rungs
  // at skillReq 0/25/50. Stats and values were budgeted against real weapon
  // comparables; never vendor-stocked (no buyValue), and every crafted output's
  // sellValue clears strictly below its summed reagent value per the economy
  // invariant.
  copper_bearded_axe: {
    id: 'copper_bearded_axe',
    name: 'Copper Bearded Axe',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'common',
    weapon: { min: 6, max: 11, speed: 2.7 },
    sellValue: 40,
  },
  copper_flanged_mace: {
    id: 'copper_flanged_mace',
    name: 'Copper Flanged Mace',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'common',
    weapon: { min: 7, max: 11, speed: 2.9 },
    sellValue: 42,
  },
  ironbark_boar_spear: {
    id: 'ironbark_boar_spear',
    name: 'Ironbark Boar Spear',
    kind: 'weapon',
    slot: 'mainhand',
    hand: 'twohand',
    quality: 'common',
    weapon: { min: 8, max: 14, speed: 3.2 },
    sellValue: 36,
  },
  ironedge_longsword: {
    id: 'ironedge_longsword',
    name: 'Ironedge Longsword',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'uncommon',
    weapon: { min: 8, max: 13, speed: 2.4 },
    stats: { str: 2, sta: 1 },
    sellValue: 52,
  },
  ironshod_maul: {
    id: 'ironshod_maul',
    name: 'Ironshod Maul',
    kind: 'weapon',
    slot: 'mainhand',
    hand: 'twohand',
    quality: 'uncommon',
    weapon: { min: 14, max: 22, speed: 3.3 },
    stats: { str: 3, sta: 2 },
    sellValue: 95,
  },
  whetted_iron_dirk: {
    id: 'whetted_iron_dirk',
    name: 'Whetted Iron Dirk',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'uncommon',
    weapon: { min: 5, max: 9, speed: 1.8, dagger: true },
    stats: { agi: 2, sta: 1 },
    sellValue: 45,
  },
  thorium_warblade: {
    id: 'thorium_warblade',
    name: 'Thorium Warblade',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'rare',
    weapon: { min: 20, max: 32, speed: 2.5 },
    stats: { str: 4, sta: 2 },
    sellValue: 275,
  },
  arcanite_war_axe: {
    id: 'arcanite_war_axe',
    name: 'Arcanite War Axe',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'rare',
    weapon: { min: 22, max: 34, speed: 2.7 },
    stats: { agi: 4, sta: 2 },
    sellValue: 300,
  },
  elderwood_battle_staff: {
    id: 'elderwood_battle_staff',
    name: 'Elderwood Battle Staff',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'rare',
    weapon: { min: 19, max: 31, speed: 3.0 },
    stats: { int: 4, spi: 2 },
    sellValue: 285,
  },

  // --- Phase 10 crafted armor ladder (armorcrafting) -----------------------
  // Trainer-taught outputs of LADDER_RECIPES, three rungs at skillReq 0/25/50.
  // All mail. Armor and primary stats sit on the repo budget formula
  // (src/sim/item_budget.ts) per the ladder design notes; common-rung pieces
  // are armor-only (common quality carries no primary-stat budget). Never
  // vendor-stocked, sellValue below summed reagent value.
  riveted_copper_girdle: {
    id: 'riveted_copper_girdle',
    name: 'Riveted Copper Girdle',
    kind: 'armor',
    armorType: 'mail',
    slot: 'waist',
    quality: 'common',
    stats: { armor: 33 },
    sellValue: 42,
  },
  coppermail_sabatons: {
    id: 'coppermail_sabatons',
    name: 'Coppermail Sabatons',
    kind: 'armor',
    armorType: 'mail',
    slot: 'feet',
    quality: 'common',
    stats: { armor: 38 },
    sellValue: 40,
  },
  coppermail_gauntlets: {
    id: 'coppermail_gauntlets',
    name: 'Coppermail Gauntlets',
    kind: 'armor',
    armorType: 'mail',
    slot: 'gloves',
    quality: 'common',
    stats: { armor: 36 },
    sellValue: 26,
  },
  ironlink_hauberk: {
    id: 'ironlink_hauberk',
    name: 'Ironlink Hauberk',
    kind: 'armor',
    armorType: 'mail',
    slot: 'chest',
    quality: 'uncommon',
    stats: { armor: 88, str: 3, sta: 3 },
    sellValue: 80,
  },
  ironlink_legguards: {
    id: 'ironlink_legguards',
    name: 'Ironlink Legguards',
    kind: 'armor',
    armorType: 'mail',
    slot: 'legs',
    quality: 'uncommon',
    stats: { armor: 78, agi: 3, sta: 3 },
    sellValue: 78,
  },
  ironlink_spaulders: {
    id: 'ironlink_spaulders',
    name: 'Ironlink Spaulders',
    kind: 'armor',
    armorType: 'mail',
    slot: 'shoulder',
    quality: 'uncommon',
    stats: { armor: 66, str: 3, sta: 2 },
    sellValue: 48,
  },
  thoriumscale_greathelm: {
    id: 'thoriumscale_greathelm',
    name: 'Thoriumscale Greathelm',
    kind: 'armor',
    armorType: 'mail',
    slot: 'helmet',
    quality: 'rare',
    stats: { armor: 102, str: 6, sta: 5 },
    sellValue: 340,
  },
  thoriumscale_cuirass: {
    id: 'thoriumscale_cuirass',
    name: 'Thoriumscale Cuirass',
    kind: 'armor',
    armorType: 'mail',
    slot: 'chest',
    quality: 'rare',
    stats: { armor: 122, str: 6, sta: 7 },
    sellValue: 420,
  },
  thoriumscale_leggings: {
    id: 'thoriumscale_leggings',
    name: 'Thoriumscale Leggings',
    kind: 'armor',
    armorType: 'mail',
    slot: 'legs',
    quality: 'rare',
    stats: { armor: 110, str: 6, sta: 6 },
    sellValue: 350,
  },

  // --- Phase 10 crafted cloth ladder (tailoring) ---------------------------
  // Trainer-taught outputs of LADDER_RECIPES (content/recipes.ts), three rungs
  // at skillReq 0/25/50, loom-bound at weaver_ottilie. Caster cloth (int/spi)
  // plus one bag upgrade; common-rung pieces are armor-only (common quality
  // carries no primary-stat budget). Never vendor-stocked (no buyValue), and
  // every crafted output's sellValue clears strictly below its summed reagent
  // value per the economy invariant. Budgets read from src/sim/item_budget.ts.
  homespun_hood: {
    id: 'homespun_hood',
    name: 'Homespun Hood',
    kind: 'armor',
    armorType: 'cloth',
    slot: 'helmet',
    quality: 'common',
    stats: { armor: 22 },
    sellValue: 28,
  },
  homespun_mitts: {
    id: 'homespun_mitts',
    name: 'Homespun Mitts',
    kind: 'armor',
    armorType: 'cloth',
    slot: 'gloves',
    quality: 'common',
    stats: { armor: 17 },
    sellValue: 20,
  },
  silverthread_slippers: {
    id: 'silverthread_slippers',
    name: 'Silverthread Slippers',
    kind: 'armor',
    armorType: 'cloth',
    slot: 'feet',
    quality: 'common',
    stats: { armor: 18 },
    sellValue: 24,
  },
  goldweave_robe: {
    id: 'goldweave_robe',
    name: 'Goldweave Robe',
    kind: 'armor',
    armorType: 'cloth',
    slot: 'chest',
    quality: 'uncommon',
    stats: { armor: 41, int: 4, spi: 2 },
    sellValue: 140,
  },
  goldweave_leggings: {
    id: 'goldweave_leggings',
    name: 'Goldweave Leggings',
    kind: 'armor',
    armorType: 'cloth',
    slot: 'legs',
    quality: 'uncommon',
    stats: { armor: 37, int: 3, spi: 2 },
    sellValue: 125,
  },
  silkspun_satchel: {
    id: 'silkspun_satchel',
    name: 'Silkspun Satchel',
    kind: 'bag',
    quality: 'uncommon',
    bagSlots: 10,
    sellValue: 150,
  },
  silkbinders_raiment: {
    id: 'silkbinders_raiment',
    name: "Silkbinder's Raiment",
    kind: 'armor',
    armorType: 'cloth',
    slot: 'chest',
    quality: 'rare',
    stats: { armor: 52, int: 8, spi: 5 },
    sellValue: 340,
  },
  sunweave_mantle: {
    id: 'sunweave_mantle',
    name: 'Sunweave Mantle',
    kind: 'armor',
    armorType: 'cloth',
    slot: 'shoulder',
    quality: 'rare',
    stats: { armor: 40, int: 6, spi: 4 },
    sellValue: 175,
  },
  sunweave_treads: {
    id: 'sunweave_treads',
    name: 'Sunweave Treads',
    kind: 'armor',
    armorType: 'cloth',
    slot: 'feet',
    quality: 'rare',
    stats: { armor: 34, int: 5, spi: 3 },
    sellValue: 260,
  },

  // --- Phase 10 crafted leather ladder (leatherworking) --------------------
  // Trainer-taught outputs of LADDER_RECIPES, three rungs at skillReq 0/25/50,
  // tannery-bound at tanner_hesk. Agi/sta melee leather, complementing the
  // existing int/spi leather pieces. Common-rung pieces are armor-only. Never
  // vendor-stocked, sellValue below summed reagent value; budgets read from
  // src/sim/item_budget.ts.
  fenbridge_hide_leggings: {
    id: 'fenbridge_hide_leggings',
    name: 'Fenbridge Hide Leggings',
    kind: 'armor',
    armorType: 'leather',
    slot: 'legs',
    quality: 'common',
    stats: { armor: 36 },
    sellValue: 32,
  },
  fenbridge_hide_boots: {
    id: 'fenbridge_hide_boots',
    name: 'Fenbridge Hide Boots',
    kind: 'armor',
    armorType: 'leather',
    slot: 'feet',
    quality: 'common',
    stats: { armor: 26 },
    sellValue: 22,
  },
  fenbridge_hide_belt: {
    id: 'fenbridge_hide_belt',
    name: 'Fenbridge Hide Belt',
    kind: 'armor',
    armorType: 'leather',
    slot: 'waist',
    quality: 'common',
    stats: { armor: 28 },
    sellValue: 25,
  },
  marshstalker_jerkin: {
    id: 'marshstalker_jerkin',
    name: 'Marshstalker Jerkin',
    kind: 'armor',
    armorType: 'leather',
    slot: 'chest',
    quality: 'uncommon',
    stats: { armor: 58, agi: 4, sta: 2 },
    sellValue: 40,
  },
  marshstalker_hood: {
    id: 'marshstalker_hood',
    name: 'Marshstalker Hood',
    kind: 'armor',
    armorType: 'leather',
    slot: 'helmet',
    quality: 'uncommon',
    stats: { armor: 38, agi: 3, sta: 2 },
    sellValue: 34,
  },
  marshstalker_spaulders: {
    id: 'marshstalker_spaulders',
    name: 'Marshstalker Spaulders',
    kind: 'armor',
    armorType: 'leather',
    slot: 'shoulder',
    quality: 'uncommon',
    stats: { armor: 44, agi: 3, sta: 2 },
    sellValue: 34,
  },
  mirewarden_jerkin: {
    id: 'mirewarden_jerkin',
    name: 'Mirewarden Jerkin',
    kind: 'armor',
    armorType: 'leather',
    slot: 'chest',
    quality: 'rare',
    stats: { armor: 72, agi: 8, sta: 5 },
    sellValue: 120,
  },
  mirewarden_leggings: {
    id: 'mirewarden_leggings',
    name: 'Mirewarden Leggings',
    kind: 'armor',
    armorType: 'leather',
    slot: 'legs',
    quality: 'rare',
    stats: { armor: 64, agi: 7, sta: 5 },
    sellValue: 88,
  },
  mirewarden_treads: {
    id: 'mirewarden_treads',
    name: 'Mirewarden Treads',
    kind: 'armor',
    armorType: 'leather',
    slot: 'feet',
    quality: 'rare',
    stats: { armor: 44, agi: 5, sta: 3 },
    sellValue: 78,
  },
};
