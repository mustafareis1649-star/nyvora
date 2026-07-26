import { useState } from "react";
import type { Character, CharacterClass } from "@/types/game";
import { CLASS_INFO } from "@/types/game";

interface CharacterCreatorProps {
  onCreate: (character: Character) => void;
}

const BODY_COLORS = ["#8B7CF6", "#4CD9E0", "#F5A623", "#F2545B", "#6BCB77"];

export function CharacterCreator({ onCreate }: CharacterCreatorProps) {
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<CharacterClass>("warrior");
  const [bodyColor, setBodyColor] = useState(BODY_COLORS[0]);
  const [height, setHeight] = useState(1.0);

  const canCreate = name.trim().length >= 3;

  const handleCreate = () => {
    if (!canCreate) return;
    const character: Character = {
      id: crypto.randomUUID(),
      name: name.trim(),
      class: selectedClass,
      appearance: {
        bodyColor,
        accentColor: CLASS_INFO[selectedClass].color,
        height,
      },
      level: 1,
      xp: 0,
    };
    onCreate(character);
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.panel}>
        <div style={styles.eyebrow}>Enter Nyvora</div>
        <h1 style={styles.title}>Create your character</h1>

        <label style={styles.label}>Name</label>
        <input
          style={styles.input}
          value={name}
          maxLength={20}
          placeholder="At least 3 characters"
          onChange={(e) => setName(e.target.value)}
        />

        <label style={styles.label}>Class</label>
        <div style={styles.classRow}>
          {(Object.keys(CLASS_INFO) as CharacterClass[]).map((c) => {
            const info = CLASS_INFO[c];
            const active = c === selectedClass;
            return (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                style={{
                  ...styles.classCard,
                  borderColor: active ? info.color : "rgba(255,255,255,0.12)",
                  background: active ? `${info.color}22` : "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ fontWeight: 700, color: info.color }}>{info.label}</div>
                <div style={{ fontSize: 12, color: "#9497AC", marginTop: 6 }}>
                  {info.description}
                </div>
              </button>
            );
          })}
        </div>

        <label style={styles.label}>Body color</label>
        <div style={styles.swatchRow}>
          {BODY_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setBodyColor(c)}
              style={{
                ...styles.swatch,
                background: c,
                outline: c === bodyColor ? "2px solid #fff" : "none",
                outlineOffset: 2,
              }}
              aria-label={`Body color ${c}`}
            />
          ))}
        </div>

        <label style={styles.label}>Height</label>
        <input
          type="range"
          min={0.9}
          max={1.15}
          step={0.01}
          value={height}
          onChange={(e) => setHeight(parseFloat(e.target.value))}
          style={{ width: "100%" }}
        />

        <button
          style={{ ...styles.createBtn, opacity: canCreate ? 1 : 0.4 }}
          disabled={!canCreate}
          onClick={handleCreate}
        >
          Enter the World
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(ellipse 900px 500px at 20% -10%, rgba(139,124,246,0.16), transparent 60%), #0A0B12",
    fontFamily: "sans-serif",
    color: "#E9EAF2",
  },
  panel: {
    width: 460,
    maxWidth: "90vw",
    background: "#151827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 36,
  },
  eyebrow: {
    fontFamily: "monospace",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#4CD9E0",
    marginBottom: 10,
  },
  title: { fontSize: 26, marginBottom: 24 },
  label: {
    display: "block",
    fontSize: 13,
    color: "#9497AC",
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    background: "#10121C",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 8,
    padding: "12px 14px",
    color: "#E9EAF2",
    fontSize: 14,
  },
  classRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  classCard: {
    border: "1px solid",
    borderRadius: 10,
    padding: 12,
    cursor: "pointer",
    textAlign: "left",
  },
  swatchRow: { display: "flex", gap: 10 },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
  },
  createBtn: {
    width: "100%",
    marginTop: 28,
    padding: "14px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #8B7CF6, #6D5FE0)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
};
