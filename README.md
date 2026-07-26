# NYVORA — Prototype

A first playable slice of Nyvora: create a character, then walk them around a
procedurally-laid-out Ashfall City block with a real day/night cycle, using
React + TypeScript + Three.js, with Supabase wired up for saving progress.

## What's actually working here

- **Sign in with Google** (via Supabase Auth) gates access to the game —
  falls back to playing locally with no login if Supabase isn't configured
- Character creation (name, class, color, height) → stored in React state
- A live Three.js world: ground, procedurally placed buildings, fixed bright
  daytime lighting (no day/night cycle)
- WASD / arrow-key movement with a camera that follows behind the character,
  and real collision with buildings (slides along walls instead of clipping)
- **Gathering & market**: trees, stone, and iron ore nodes scattered around
  the map — walk up and press **E** to gather; nodes respawn after 20s
- **Ashfall Market stall**: walk up and press **E** to open it, sell
  gathered materials for gold, and spend gold on cosmetic-only outfits
  (color/appearance swaps — never combat power)
- Save / load position, inventory, and gold, scoped to the signed-in user —
  to Supabase if configured, or to the browser's localStorage automatically
  if not

## What this is NOT (yet)

This is a foundation, not the finished game. None of these exist yet:
combat, inventory/crafting, guilds, quests, multiplayer networking,
anti-cheat, or the Solana wallet integration. Each of those is its own
multi-week build — happy to keep going system by system from here.

## Running it locally

This sandbox has no internet access, so dependencies could not be installed
or test-run here. On your own machine:

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically http://localhost:5173).

## Setting up Google sign-in

Without Supabase configured, the game skips login entirely and saves locally,
so you can develop without setting any of this up right away. To turn on
"Continue with Google":

1. **Create a Supabase project** at https://supabase.com (free tier is fine).
2. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (Project Settings → API).
3. **Create Google OAuth credentials:**
   - Go to https://console.cloud.google.com/apis/credentials
   - Create a project (or pick an existing one), then
     "Create Credentials" → "OAuth client ID" → Application type: **Web application**
   - Under "Authorized redirect URIs", add the callback URL Supabase shows you
     on its Google provider settings page (looks like
     `https://<your-project-ref>.supabase.co/auth/v1/callback`)
   - Copy the generated **Client ID** and **Client Secret**
4. **Enable Google in Supabase:** in your Supabase dashboard, go to
   Authentication → Providers → Google, toggle it on, and paste in the
   Client ID and Client Secret from step 3. Save.
5. **Add your site URL:** in Authentication → URL Configuration, add your
   local dev URL (`http://localhost:5173`) and your live Vercel URL to the
   allowed redirect URLs.
6. **Create the saves table** — in the Supabase SQL editor, run the
   `create table player_saves (...)` statement found in the comment at the
   bottom of `src/lib/supabaseClient.ts`. It links each save row to the
   signed-in Google account and locks it down with row-level security so
   players can only read/write their own data.
7. **On Vercel:** add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as
   Environment Variables in your project's Vercel settings, then redeploy.

Once all of this is in place, opening the game shows a "Continue with Google"
screen before character creation, and progress follows the player's Google
account across devices.

## Suggested next steps

1. Replace the placeholder box buildings with real models (glTF via
   `three/examples/jsm/loaders/GLTFLoader`)
2. Add a combat/skill system and an inventory UI
3. Add a second biome (e.g. Glacier Reach) and a way to travel between them
4. Add real authentication (Supabase Auth) before opening saves to real users
5. Multiplayer requires a server component (e.g. Node.js + WebSockets or
   Colyseus) — this prototype is single-player/local only so far
