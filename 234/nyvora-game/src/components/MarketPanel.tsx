import type { ResourceType, CosmeticOption } from "@/types/game";
import { RESOURCE_INFO, COSMETIC_SHOP } from "@/types/game";

interface MarketPanelProps {
  inventory: Record<ResourceType, number>;
  gold: number;
  activeCosmeticId: string;
  onSell: (type: ResourceType, amount: number) => void;
  onBuyCosmetic: (option: CosmeticOption) => void;
  onClose: () => void;
}

export function MarketPanel({
  inventory,
  gold,
  activeCosmeticId,
  onSell,
  onBuyCosmetic,
  onClose,
}: MarketPanelProps) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Ashfall Market</div>
            <h2 style={styles.title}>Trade & Cosmetics</h2>
          </div>
          <div style={styles.goldBadge}>{gold}g</div>
        </div>

        <h3 style={styles.sectionTitle}>Sell materials</h3>
        <div style={styles.sellList}>
          {(Object.keys(RESOURCE_INFO) as ResourceType[]).map((type) => {
            const info = RESOURCE_INFO[type];
            const qty = inventory[type] ?? 0;
            return (
              <div key={type} style={styles.sellRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ ...styles.dot, background: info.color }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{info.label}</div>
                    <div style={{ fontSize: 12, color: "#9497AC" }}>
                      You have {qty} · {info.sellPrice}g each
                    </div>
                  </div>
                </div>
                <button
                  style={{ ...styles.smallBtn, opacity: qty > 0 ? 1 : 0.35 }}
                  disabled={qty === 0}
                  onClick={() => onSell(type, qty)}
                >
                  Sell all
                </button>
              </div>
            );
          })}
        </div>

        <h3 style={styles.sectionTitle}>Cosmetic outfits</h3>
        <p style={{ fontSize: 12, color: "#6B6E82", marginTop: -8, marginBottom: 14 }}>
          Purely cosmetic — no combat stats are ever sold here.
        </p>
        <div style={styles.cosmeticGrid}>
          {COSMETIC_SHOP.map((option) => {
            const owned = option.price === 0 || option.id === activeCosmeticId;
            const active = option.id === activeCosmeticId;
            const canAfford = gold >= option.price;
            return (
              <button
                key={option.id}
                style={{
                  ...styles.cosmeticCard,
                  borderColor: active ? "#8B7CF6" : "rgba(255,255,255,0.12)",
                }}
                disabled={!owned && !canAfford}
                onClick={() => onBuyCosmetic(option)}
              >
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <span style={{ ...styles.dot, background: option.bodyColor }} />
                  <span style={{ ...styles.dot, background: option.accentColor }} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{option.label}</div>
                <div style={{ fontSize: 12, color: "#9497AC", marginTop: 4 }}>
                  {active ? "Equipped" : option.price === 0 ? "Free" : `${option.price}g`}
                </div>
              </button>
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
    width: 520,
    maxWidth: "92vw",
    maxHeight: "85vh",
    overflowY: "auto",
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
  title: { fontSize: 20, margin: 0 },
  goldBadge: {
    background: "rgba(245,166,35,0.14)",
    color: "#F5A623",
    fontWeight: 700,
    padding: "6px 14px",
    borderRadius: 100,
    fontSize: 14,
  },
  sectionTitle: { fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em", color: "#9497AC", marginTop: 26, marginBottom: 12 },
  sellList: { display: "flex", flexDirection: "column", gap: 8 },
  sellRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#10121C",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "10px 14px",
  },
  dot: { width: 12, height: 12, borderRadius: "50%", display: "inline-block" },
  smallBtn: {
    background: "linear-gradient(135deg, #8B7CF6, #6D5FE0)",
    border: "none",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  cosmeticGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  cosmeticCard: {
    background: "#10121C",
    border: "1px solid",
    borderRadius: 10,
    padding: 12,
    textAlign: "left",
    cursor: "pointer",
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
