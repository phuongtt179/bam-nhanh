// In-memory store - works for classroom demos with warm Vercel instances
// For production scale, replace with Redis/Vercel KV

export interface BuzzEntry {
  name: string;
  time: number; // ms since game started
  clickedAt: string; // ISO timestamp
}

interface GameState {
  active: boolean;
  startedAt: number | null;
  buzzes: BuzzEntry[];
}

declare global {
  // eslint-disable-next-line no-var
  var gameState: GameState | undefined;
}

function getStore(): GameState {
  if (!global.gameState) {
    global.gameState = { active: false, startedAt: null, buzzes: [] };
  }
  return global.gameState;
}

export function getGameState(): GameState {
  return getStore();
}

export function startGame(): void {
  const store = getStore();
  store.active = true;
  store.startedAt = Date.now();
  store.buzzes = [];
}

export function resetGame(): void {
  const store = getStore();
  store.active = false;
  store.startedAt = null;
  store.buzzes = [];
}

export function recordBuzz(name: string): BuzzEntry | null {
  const store = getStore();
  if (!store.active) return null;

  // Only record each student once
  if (store.buzzes.find((b) => b.name === name)) return null;

  const entry: BuzzEntry = {
    name,
    time: store.startedAt ? Date.now() - store.startedAt : 0,
    clickedAt: new Date().toISOString(),
  };
  store.buzzes.push(entry);
  return entry;
}
