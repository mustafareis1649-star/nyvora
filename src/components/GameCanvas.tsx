import { useEffect, useRef, useState } from "react";
import { WorldScene } from "@/scenes/WorldScene";
import type { Character, PlayerSaveState } from "@/types/game";
import { savePlayerState, loadPlayerState } from "@/lib/supabaseClient";

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

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new WorldScene(canvasRef.current);
    sceneRef.current = scene;
    scene.setCharacterAppearance(character);

    loadPlayerState(userId).then((saved) => {
      if (saved && saved.character.id === character.id) {
        scene.setPosition(saved.position.x, saved.position.y, saved.position.z);
      }
    });

    scene.onMove((p) => setPos({ x: p.x, y: p.y, z: p.z }));
    scene.start();

    return () => scene.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const state: PlayerSaveState = {
      character,
      position: pos,
      createdAt: new Date().toISOString(),
    };
    await savePlayerState(state, userId);
    setSaving(false);
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

      <div style={hudStyle.bottomLeft}>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6B6E82" }}>
          x:{pos.x.toFixed(1)} y:{pos.y.toFixed(1)} z:{pos.z.toFixed(1)}
        </div>
      </div>

      <div style={hudStyle.bottomCenter}>WASD / Arrow keys to move</div>
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
