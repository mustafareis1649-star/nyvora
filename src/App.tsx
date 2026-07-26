import { useState } from "react";
import type { Character } from "@/types/game";
import { CharacterCreator } from "@/components/CharacterCreator";
import { GameCanvas } from "@/components/GameCanvas";

export default function App() {
  const [character, setCharacter] = useState<Character | null>(null);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {character ? (
        <GameCanvas character={character} onExitToMenu={() => setCharacter(null)} />
      ) : (
        <CharacterCreator onCreate={setCharacter} />
      )}
    </div>
  );
}
