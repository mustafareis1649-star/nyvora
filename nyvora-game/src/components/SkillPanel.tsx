import type { CharacterClass, SkillDef } from "@/types/game";
import { SKILL_TREE } from "@/types/game";

interface SkillPanelProps {
  characterClass: CharacterClass;
  skillPoints: number;
  unlockedSkills: string[];
  onUnlock: (skill: SkillDef) => void;
  onClose: () => void;
}

export function SkillPanel({
  characterClass,
  skillPoints,
  unlockedSkills,
  onUnlock,
  onClose,
}: SkillPanelProps) {
  const skills = SKILL_TREE[characterClass];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Skill Tree</div>
            <h2 style={styles.title}>{characterClass} skills</h2>
          </div>
          <div style={styles.pointsBadge}>{skillPoints} pt</div>
        </div>

        <div style={styles.skillList}>
          {skills.map((skill) => {
            const unlocked = unlockedSkills.includes(skill.id);
            const canUnlock = !unlocked && skillPoints > 0;
            return (
              <div key={skill.id} style={styles.skillRow}>
                <div>
                  <div style={{ fontWeight: 600 }}>{skill.label}</div>
                  <div style={{ fontSize: 12, color: "#9497AC" }}>{skill.description}</div>
                </div>
                <button
                  style={{
                    ...styles.unlockBtn,
                    opacity: unlocked || canUnlock ? 1 : 0.35,
                    background: unlocked ? "rgba(139,124,246,0.2)" : styles.unlockBtn.background,
                    color: unlocked ? "#8B7CF6" : "#fff",
                  }}
                  disabled={unlocked || !canUnlock}
                  onClick={() => onUnlock(skill)}
                >
                  {unlocked ? "Unlocked" : "Unlock (1 pt)"}
                </button>
              </div>
            );
          })}
        </div>

        <button style={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(5,6,10,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  panel: {
    width: 460,
    maxWidth: "92vw",
    background: "#151827",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 32,
    color: "#E9EAF2",
    fontFamily: "sans-serif",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: {
    fontFamily: "monospace",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#4CD9E0",
    marginBottom: 4,
  },
  title: { fontSize: 20, margin: 0, textTransform: "capitalize" },
  pointsBadge: {
    background: "rgba(139,124,246,0.16)",
    color: "#8B7CF6",
    fontWeight: 700,
    padding: "6px 14px",
    borderRadius: 100,
    fontSize: 14,
  },
  skillList: { display: "flex", flexDirection: "column", gap: 10, marginTop: 24 },
  skillRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    background: "#10121C",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "12px 16px",
  },
  unlockBtn: {
    background: "linear-gradient(135deg, #8B7CF6, #6D5FE0)",
    border: "none",
    color: "#fff",
    padding: "9px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  closeBtn: {
    width: "100%",
    marginTop: 26,
    padding: "12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "transparent",
    color: "#E9EAF2",
    fontWeight: 600,
    cursor: "pointer",
  },
};
