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
}

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
