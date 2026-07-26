import { useEffect, useRef, useState } from "react";
import { WorldScene, type InteractionTarget } from "@/scenes/WorldScene";
import type {
  Character,
  PlayerSaveState,
  ResourceType,
  CosmeticOption,
  SkillDef,
} from "@/types/game";
import {
  RESOURCE_INFO,
  EMPTY_INVENTORY,
  BASE_MAX_HP,
  BASE_ATTACK_DAMAGE,
  SKILL_TREE,
  xpToNextLevel,
} from "@/types/game";
import { savePlayerState, loadPlayerState } from "@/lib/supabaseClient";
import { MarketPanel } from "@/components/MarketPanel";
import { SkillPanel } from "@/components/SkillPanel";

interface GameCanvasProps {
  character: Character;
  userId?: string;
  onExitToMenu: () => void;
}

function computeMaxHp(unlockedSkills: string[], characterClass: Character["class"]) {
  const bonus = SKILL_TREE[characterClass]
    .filter((s) => unlockedSkills.includes(s.id))
    .reduce((sum, s) => sum + (s.effect.maxHp ?? 0), 0);
  return BASE_MAX_HP + bonus;
}

function computeAttackDamage(unlockedSkills: string[], characterClass: Character["class"]) {
  const bonus = SKILL_TREE[characterClass]
    .filter((s) => unlockedSkills.includes(s.id))
    .reduce((sum, s) => sum + (s.effect.damage ?? 0), 0);
  return BASE_ATTACK_DAMAGE + bonus;
}

function computeDamageReduction(unlockedSkills: string[], characterClass: Character["class"]) {
  return SKILL_TREE[characterClass]
    .filter((s) => unlockedSkills.includes(s.id))
    .reduce((sum, s) => sum + (s.effect.damageReduction ?? 0), 0);
}

export function GameCanvas({ character, userId, onExitToMenu }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<WorldScene | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const [saving, setSaving] = useState(false);
  const [inventory, setInventory] = useState<Record<ResourceType, number>>(EMPTY_INVENTORY);
  const [gold, setGold] = useState(20);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [marketOpen, setMarketOpen] = useState(false);
  const [skillPanelOpen, setSkillPanelOpen] = useState(false);
  const [activeCosmeticId, setActiveCosmeticId] = useState("default");
  const [appearance, setAppearance] = useState(character.appearance);
  const [level, setLevel] = useState(character.level || 1);
  const [xp, setXp] = useState(character.xp || 0);
  const [skillPoints, setSkillPoints] = useState(0);
  const [unlockedSkills, setUnlockedSkills] = useState<string[]>([]);
  const [hp, setHp] = useState(BASE_MAX_HP);
  const [combatMessage, setCombatMessage] = useState<string | null>(null);

  const maxHp = computeMaxHp(unlockedSkills, character.class);

  const showCombatMessage = (msg: string) => {
    setCombatMessage(msg);
    window.setTimeout(() => setCombatMessage((cur) => (cur === msg ? null : cur)), 1400);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new WorldScene(canvasRef.current);
    sceneRef.current = scene;
    scene.setCharacterAppearance({ ...character, appearance });

    loadPlayerState(userId).then((saved) => {
      if (saved && saved.character.id === character.id) {
        scene.setPosition(saved.position.x, saved.position.y, saved.position.z);
        if (saved.inventory) setInventory(saved.inventory);
        if (typeof saved.gold === "number") setGold(saved.gold);
        if (typeof saved.hp === "number") setHp(saved.hp);
        if (typeof saved.skillPoints === "number") setSkillPoints(saved.skillPoints);
        if (saved.unlockedSkills) setUnlockedSkills(saved.unlockedSkills);
        if (saved.character.level) setLevel(saved.character.level);
        if (typeof saved.character.xp === "number") setXp(saved.character.xp);
      }
    });

    scene.onMove((p) => setPos({ x: p.x, y: p.y, z: p.z }));
    scene.onInteractionTargetChange((target: InteractionTarget | null) => {
      setPrompt(target ? target.label : null);
    });
    scene.start();

    return () => scene.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // player damage from enemy contact
  useEffect(() => {
    sceneRef.current?.onPlayerDamage((amount) => {
      const reduction = computeDamageReduction(unlockedSkills, character.class);
      const actual = Math.max(1, Math.round(amount * (1 - reduction)));
      setHp((h) => {
        const next = h - actual;
        if (next <= 0) {
          showCombatMessage("You were defeated — respawning at Ashfall City");
          sceneRef.current?.setPosition(0, 0, 0);
          return Math.round(maxHp * 0.5);
        }
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedSkills, maxHp]);

  const handleLevelUp = (currentXp: number, currentLevel: number) => {
    let newLevel = currentLevel;
    let remainingXp = currentXp;
    let pointsGained = 0;
    while (remainingXp >= xpToNextLevel(newLevel)) {
      remainingXp -= xpToNextLevel(newLevel);
      newLevel += 1;
      pointsGained += 1;
    }
    if (newLevel !== currentLevel) {
      setLevel(newLevel);
      setSkillPoints((p) => p + pointsGained);
      showCombatMessage(`Level up! Now level ${newLevel}`);
    }
    setXp(remainingXp);
  };

  // attack key (Space) and skill panel key (K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        const damage = computeAttackDamage(unlockedSkills, character.class);
        const result = sceneRef.current?.tryAttack(damage);
        if (!result) return;
        if (result.killed) {
          showCombatMessage(`Defeated a Shade! +${result.xp} XP`);
          handleLevelUp(xp + result.xp, level);
        } else if (result.hit) {
          showCombatMessage("Hit!");
        }
      } else if (e.code === "KeyK") {
        setSkillPanelOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockedSkills, xp, level, character.class]);

  // interact key (E)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== "KeyE") return;
      const result = sceneRef.current?.tryInteract();
      if (!result) return;
      if (result.kind === "gather") {
        setInventory((prev) => ({
          ...prev,
          [result.resourceType]: (prev[result.resourceType] ?? 0) + 1,
        }));
      } else if (result.kind === "market") {
        setMarketOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const state: PlayerSaveState = {
      character: { ...character, appearance, level, xp },
      position: pos,
      createdAt: new Date().toISOString(),
      inventory,
      gold,
      hp,
      skillPoints,
      unlockedSkills,
    };
    await savePlayerState(state, userId);
    setSaving(false);
  };

  const handleSell = (type: ResourceType, amount: number) => {
    if (amount <= 0) return;
    const price = RESOURCE_INFO[type].sellPrice;
    setGold((g) => g + price * amount);
    setInventory((prev) => ({ ...prev, [type]: 0 }));
  };

  const handleBuyCosmetic = (option: CosmeticOption) => {
    if (option.id === activeCosmeticId) return;
    if (option.price > 0) {
      if (gold < option.price) return;
      setGold((g) => g - option.price);
    }
    const newAppearance = {
      ...appearance,
      bodyColor: option.bodyColor,
      accentColor: option.accentColor,
    };
    setAppearance(newAppearance);
    setActiveCosmeticId(option.id);
    sceneRef.current?.setCharacterAppearance({ ...character, appearance: newAppearance });
  };

  const handleUnlockSkill = (skill: SkillDef) => {
    if (skillPoints <= 0 || unlockedSkills.includes(skill.id)) return;
    setSkillPoints((p) => p - 1);
    setUnlockedSkills((prev) => [...prev, skill.id]);
    if (skill.effect.maxHp) setHp((h) => h + skill.effect.maxHp!);
  };

  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const xpPct = Math.max(0, Math.min(100, (xp / xpToNextLevel(level)) * 100));

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

      <div style={hudStyle.topLeft}>
        <div style={{ fontWeight: 700 }}>{character.name}</div>
        <div style={{ fontSize: 12, color: "#9497AC", textTransform: "capitalize", marginBottom: 8 }}>
          {character.class} · Lv. {level} · Ashfall City
        </div>
        <div style={hudStyle.barTrack}>
          <div style={{ ...hudStyle.barFill, width: `${hpPct}%`, background: "#F2545B" }} />
        </div>
        <div style={{ fontSize: 10, color: "#6B6E82", marginTop: 2 }}>
          HP {Math.max(0, Math.round(hp))}/{maxHp}
        </div>
        <div style={{ ...hudStyle.barTrack, marginTop: 6 }}>
          <div style={{ ...hudStyle.barFill, width: `${xpPct}%`, background: "#4CD9E0" }} />
        </div>
        <div style={{ fontSize: 10, color: "#6B6E82", marginTop: 2 }}>
          XP {xp}/{xpToNextLevel(level)} · {skillPoints} skill pt
        </div>
      </div>

      <div style={hudStyle.topRight}>
        <button style={hudStyle.button} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Progress"}
        </button>
        <button style={{ ...hudStyle.button, marginTop: 8 }} onClick={() => setSkillPanelOpen(true)}>
          Skills (K)
        </button>
        <button style={{ ...hudStyle.button, marginTop: 8 }} onClick={onExitToMenu}>
          Exit
        </button>
      </div>

      <div style={hudStyle.inventoryBar}>
        <span style={hudStyle.goldChip}>{gold}g</span>
        {(Object.keys(RESOURCE_INFO) as ResourceType[]).map((type) => (
          <span key={type} style={hudStyle.resourceChip}>
            <span style={{ ...hudStyle.dot, background: RESOURCE_INFO[type].color }} />
            {inventory[type] ?? 0}
          </span>
        ))}
      </div>

      <div style={hudStyle.bottomLeft}>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6B6E82" }}>
          x:{pos.x.toFixed(1)} y:{pos.y.toFixed(1)} z:{pos.z.toFixed(1)}
        </div>
      </div>

      {combatMessage ? (
        <div style={hudStyle.combatMessage}>{combatMessage}</div>
      ) : prompt ? (
        <div style={hudStyle.promptCenter}>Press E — {prompt}</div>
      ) : (
        <div style={hudStyle.bottomCenter}>WASD to move · Space to attack · E to interact</div>
      )}

      {marketOpen && (
        <MarketPanel
          inventory={inventory}
          gold={gold}
          activeCosmeticId={activeCosmeticId}
          onSell={handleSell}
          onBuyCosmetic={handleBuyCosmetic}
          onClose={() => setMarketOpen(false)}
        />
      )}

      {skillPanelOpen && (
        <SkillPanel
          characterClass={character.class}
          skillPoints={skillPoints}
          unlockedSkills={unlockedSkills}
          onUnlock={handleUnlockSkill}
          onClose={() => setSkillPanelOpen(false)}
        />
      )}
    </div>
  );
}

const hudStyle: Record<string, React.CSSProperties> = {
  topLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    color: "#E9EAF2",
    fontFamily: "sans-serif",
    background: "rgba(10,11,18,0.55)",
    padding: "12px 16px",
    borderRadius: 10,
    backdropFilter: "blur(6px)",
    width: 200,
  },
  barTrack: {
    width: "100%",
    height: 6,
    borderRadius: 100,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 100,
    transition: "width 0.2s ease",
  },
  topRight: {
    position: "absolute",
    top: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
  },
  inventoryBar: {
    position: "absolute",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 10,
    background: "rgba(10,11,18,0.55)",
    padding: "8px 14px",
    borderRadius: 100,
    backdropFilter: "blur(6px)",
    color: "#E9EAF2",
    fontFamily: "sans-serif",
    fontSize: 13,
    alignItems: "center",
  },
  goldChip: { color: "#F5A623", fontWeight: 700 },
  resourceChip: { display: "flex", alignItems: "center", gap: 6 },
  dot: { width: 9, height: 9, borderRadius: "50%", display: "inline-block" },
  bottomLeft: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  bottomCenter: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#9497AC",
    fontFamily: "sans-serif",
    fontSize: 13,
    background: "rgba(10,11,18,0.55)",
    padding: "8px 16px",
    borderRadius: 100,
    whiteSpace: "nowrap",
  },
  promptCenter: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontFamily: "sans-serif",
    fontSize: 14,
    fontWeight: 600,
    background: "rgba(139,124,246,0.85)",
    padding: "10px 20px",
    borderRadius: 100,
  },
  combatMessage: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontFamily: "sans-serif",
    fontSize: 14,
    fontWeight: 700,
    background: "rgba(242,84,91,0.9)",
    padding: "10px 20px",
    borderRadius: 100,
  },
  button: {
    background: "linear-gradient(135deg, #8B7CF6, #6D5FE0)",
    border: "none",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
};
