import { isAuthConfigured, signInWithGoogle } from "@/lib/supabaseClient";

export function LoginScreen() {
  return (
    <div style={styles.wrap}>
      <div style={styles.panel}>
        <div style={styles.eyebrow}>Nyvora</div>
        <h1 style={styles.title}>Sign in to play</h1>
        <p style={styles.subtitle}>
          Your progress is saved to your account, so you can pick up where you
          left off on any device.
        </p>

        <button style={styles.googleBtn} onClick={signInWithGoogle}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.5 35.4 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.6 5.4C41.9 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"
            />
          </svg>
          Continue with Google
        </button>

        {!isAuthConfigured && (
          <p style={styles.warning}>
            Google sign-in isn't configured yet — add your Supabase
            credentials to <code>.env.local</code> to enable it. Until then,
            progress saves locally in this browser only.
          </p>
        )}
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
    width: 420,
    maxWidth: "90vw",
    background: "#151827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 40,
    textAlign: "center",
  },
  eyebrow: {
    fontFamily: "monospace",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#4CD9E0",
    marginBottom: 10,
  },
  title: { fontSize: 26, marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#9497AC", lineHeight: 1.6, marginBottom: 28 },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "#fff",
    color: "#1f1f1f",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
  },
  warning: {
    marginTop: 20,
    fontSize: 12,
    color: "#F5A623",
    lineHeight: 1.6,
    textAlign: "left",
    background: "rgba(245,166,35,0.08)",
    border: "1px solid rgba(245,166,35,0.25)",
    borderRadius: 8,
    padding: 12,
  },
};
