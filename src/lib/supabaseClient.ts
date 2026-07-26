import { createClient, type Session, type User } from "@supabase/supabase-js";
import type { PlayerSaveState } from "@/types/game";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

// Supabase is optional for local development. If no credentials are provided,
// auth is disabled and saves fall back to browser localStorage so the world
// is still playable without any setup.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isAuthConfigured = supabase !== null;

/** Starts the Google sign-in redirect flow. No-op if Supabase isn't configured. */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) {
    console.warn("Supabase is not configured — cannot sign in with Google.");
    return;
  }
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Subscribes to auth state changes; returns an unsubscribe function. */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

const LOCAL_SAVE_KEY = "nyvora:save:v1";

export async function savePlayerState(
  state: PlayerSaveState,
  userId?: string
): Promise<void> {
  if (supabase && userId) {
    const { error } = await supabase
      .from("player_saves")
      .upsert({ id: userId, data: state }, { onConflict: "id" });
    if (error) {
      console.error("Supabase save failed, falling back to local storage:", error);
      localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state));
    }
    return;
  }
  localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state));
}

export async function loadPlayerState(
  userId?: string
): Promise<PlayerSaveState | null> {
  if (supabase && userId) {
    const { data, error } = await supabase
      .from("player_saves")
      .select("data")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) return data.data as PlayerSaveState;
  }
  const raw = localStorage.getItem(LOCAL_SAVE_KEY);
  return raw ? (JSON.parse(raw) as PlayerSaveState) : null;
}

/*
  Supabase setup for Google sign-in + user-scoped saves (run once in your
  project's SQL editor):

  create table player_saves (
    id uuid primary key references auth.users(id) on delete cascade,
    data jsonb not null,
    updated_at timestamp with time zone default now()
  );

  alter table player_saves enable row level security;

  -- each player can only read/write their own save row
  create policy "users manage their own save" on player_saves
    for all using (auth.uid() = id) with check (auth.uid() = id);

  Then enable the Google provider under
  Authentication -> Providers -> Google in the Supabase dashboard, using a
  Google Cloud OAuth Client ID/Secret (see README.md for the full walkthrough).
*/
