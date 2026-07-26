export type CharacterClass = "warrior" | "ranger" | "mystic";

export interface CharacterAppearance {
  bodyColor: string;
  accentColor: string;
  height: number; // 0.9 - 1.15 scale multiplier
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  appearance: CharacterAppearance;
  level: number;
  xp: number;
}

export interface PlayerSaveState {
  character: Character;
  position: { x: number; y: number; z: number };
  createdAt: string;
  inventory?: Record<ResourceType, number>;
  gold?: number;
}

export type ResourceType = "wood" | "stone" | "ore";

export interface ResourceItemInfo {
  label: string;
  color: string;
  sellPrice: number;
}

export const RESOURCE_INFO: Record<ResourceType, ResourceItemInfo> = {
  wood: { label: "Wood", color: "#B08A5A", sellPrice: 2 },
  stone: { label: "Stone", color: "#9497AC", sellPrice: 3 },
  ore: { label: "Iron Ore", color: "#D9C24C", sellPrice: 6 },
};

export const EMPTY_INVENTORY: Record<ResourceType, number> = {
  wood: 0,
  stone: 0,
  ore: 0,
};

export interface CosmeticOption {
  id: string;
  label: string;
  bodyColor: string;
  accentColor: string;
  price: number;
}

export const COSMETIC_SHOP: CosmeticOption[] = [
  { id: "default", label: "Traveler", bodyColor: "#8B7CF6", accentColor: "#4CD9E0", price: 0 },
  { id: "ember", label: "Ember Cloak", bodyColor: "#F5A623", accentColor: "#F2545B", price: 40 },
  { id: "verdant", label: "Verdant Ranger", bodyColor: "#6BCB77", accentColor: "#4CD9E0", price: 40 },
  { id: "obsidian", label: "Obsidian Knight", bodyColor: "#2A2C3E", accentColor: "#8B7CF6", price: 75 },
  { id: "gilded", label: "Gilded Mystic", bodyColor: "#D9C24C", accentColor: "#F5A623", price: 120 },
];

export const CLASS_INFO: Record<
  CharacterClass,
  { label: string; description: string; color: string }
> = {
  warrior: {
    label: "Warrior",
    description: "Frontline fighter. High health, melee-focused skill tree.",
    color: "#F2545B",
  },
  ranger: {
    label: "Ranger",
    description: "Mobile scout. Ranged combat and fast traversal.",
    color: "#4CD9E0",
  },
  mystic: {
    label: "Mystic",
    description: "Elemental caster. Area-effect skills and utility magic.",
    color: "#8B7CF6",
  },
};
