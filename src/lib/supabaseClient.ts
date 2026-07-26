import { createClient } from "@supabase/supabase-js";
import type { PlayerSaveState } from "@/types/game";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

// Supabase is optional for local development. If no credentials are provided,
// the game falls back to browser localStorage so the world is still playable.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const LOCAL_SAVE_KEY = "nyvora:save:v1";

export async function savePlayerState(state: PlayerSaveState): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from("player_saves")
      .upsert({ id: state.character.id, data: state }, { onConflict: "id" });
    if (error) {
      console.error("Supabase save failed, falling back to local storage:", error);
      localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state));
    }
    return;
  }
  localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state));
}

export async function loadPlayerState(
  characterId?: string
): Promise<PlayerSaveState | null> {
  if (supabase && characterId) {
    const { data, error } = await supabase
      .from("player_saves")
      .select("data")
      .eq("id", characterId)
      .maybeSingle();
    if (!error && data) return data.data as PlayerSaveState;
  }
  const raw = localStorage.getItem(LOCAL_SAVE_KEY);
  return raw ? (JSON.parse(raw) as PlayerSaveState) : null;
}

/*
  Suggested Supabase table (run in the SQL editor of your project):

  create table player_saves (
    id text primary key,
    data jsonb not null,
    updated_at timestamp with time zone default now()
  );

  alter table player_saves enable row level security;

  -- For a first playtest with anonymous sessions, a permissive policy is fine;
  -- tighten this once you add real authentication.
  create policy "allow all for now" on player_saves
    for all using (true) with check (true);
*/
