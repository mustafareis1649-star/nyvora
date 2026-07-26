import { useEffect, useRef, useState } from "react";
import { WorldScene, type InteractionTarget } from "@/scenes/WorldScene";
import type {
  Character,
  PlayerSaveState,
  ResourceType,
  CosmeticOption,
} from "@/types/game";
import { RESOURCE_INFO, EMPTY_INVENTORY } from "@/types/game";
import { savePlayerState, loadPlayerState } from "@/lib/supabaseClient";
import { MarketPanel } from "@/components/MarketPanel";

interface GameCanvasProps {
  character: Character;
  userId?: string;
  onExitToMenu: () => void;
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
  const [activeCosmeticId, setActiveCosmeticId] = useState("default");
  const [appearance, setAppearance] = useState(character.appearance);

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
      character: { ...character, appearance },
      position: pos,
      createdAt: new Date().toISOString(),
      inventory,
      gold,
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

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

      <div style={hudStyle.topLeft}>
        <div style={{ fontWeight: 700 }}>{character.name}</div>
        <div style={{ fontSize: 12, color: "#9497AC", textTransform: "capitalize" }}>
          {character.class} · Lv. {character.level} · Ashfall City
        </div>
      </div>

      <div style={hudStyle.topRight}>
        <button style={hudStyle.button} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Progress"}
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

      {prompt ? (
        <div style={hudStyle.promptCenter}>Press E — {prompt}</div>
      ) : (
        <div style={hudStyle.bottomCenter}>WASD / Arrow keys to move</div>
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
    padding: "10px 16px",
    borderRadius: 10,
    backdropFilter: "blur(6px)",
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
