import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Character } from "@/types/game";
import { CharacterCreator } from "@/components/CharacterCreator";
import { GameCanvas } from "@/components/GameCanvas";
import { LoginScreen } from "@/components/LoginScreen";
import {
  getCurrentSession,
  isAuthConfigured,
  onAuthStateChange,
  signOut,
} from "@/lib/supabaseClient";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    if (!isAuthConfigured) {
      // No Supabase configured — skip the login screen entirely and play locally.
      setAuthChecked(true);
      return;
    }
    getCurrentSession().then((session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    const unsubscribe = onAuthStateChange((u) => setUser(u));
    return unsubscribe;
  }, []);

  const handleExitToMenu = async () => {
    setCharacter(null);
    if (isAuthConfigured) await signOut();
  };

  if (!authChecked) {
    return <div style={{ width: "100vw", height: "100vh", background: "#0A0B12" }} />;
  }

  // If auth is configured, require sign-in before anything else.
  if (isAuthConfigured && !user) {
    return (
      <div style={{ width: "100vw", height: "100vh" }}>
        <LoginScreen />
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {character ? (
        <GameCanvas
          character={character}
          userId={user?.id}
          onExitToMenu={handleExitToMenu}
        />
      ) : (
        <CharacterCreator onCreate={setCharacter} />
      )}
    </div>
  );
}
