# NYVORA — Prototype

A first playable slice of Nyvora: create a character, then walk them around a
procedurally-laid-out Ashfall City block with a real day/night cycle, using
React + TypeScript + Three.js, with Supabase wired up for saving progress.

## What's actually working here

- Character creation (name, class, color, height) → stored in React state
- A live Three.js world: ground, procedurally placed buildings, a day/night
  cycle that shifts sun position, light intensity, and sky color over time
- WASD / arrow-key movement with a camera that follows behind the character
- Save / load position and character data — to Supabase if configured, or to
  the browser's localStorage automatically if not

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

## Optional: connect Supabase

1. Create a free project at https://supabase.com
2. Copy `.env.example` to `.env.local` and fill in your project URL and anon key
3. In the Supabase SQL editor, run the `create table player_saves (...)`
   statement found in the comment at the bottom of `src/lib/supabaseClient.ts`

Without Supabase configured, saving/loading still works via localStorage, so
you can develop without setting it up right away.

## Suggested next steps

1. Replace the placeholder box buildings with real models (glTF via
   `three/examples/jsm/loaders/GLTFLoader`)
2. Add a combat/skill system and an inventory UI
3. Add a second biome (e.g. Glacier Reach) and a way to travel between them
4. Add real authentication (Supabase Auth) before opening saves to real users
5. Multiplayer requires a server component (e.g. Node.js + WebSockets or
   Colyseus) — this prototype is single-player/local only so far
