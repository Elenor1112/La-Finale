export const GAME_TYPES = [
  {
    key: 'trivia',
    label: 'Trivia',
    description: 'Ordered quiz categories',
  },
  {
    key: 'puzzle',
    label: 'Puzzle',
    description: 'Photo puzzle challenges',
  },
] as const;

export type GameType = (typeof GAME_TYPES)[number]['key'];

type HubFlags = {
  enabledGames?: string | string[] | null;
  triviaEnabled?: boolean | null;
  puzzleEnabled?: boolean | null;
};

const knownGameTypes = new Set<string>(GAME_TYPES.map((game) => game.key));

export function normalizeEnabledGames(input: unknown): GameType[] {
  const values = Array.isArray(input) ? input : [];
  const unique = new Set<GameType>();

  for (const value of values) {
    const key = String(value).trim().toLowerCase();
    if (knownGameTypes.has(key)) {
      unique.add(key as GameType);
    }
  }

  return Array.from(unique);
}

export function serializeEnabledGames(games: unknown): string {
  return JSON.stringify(normalizeEnabledGames(games));
}

export function parseEnabledGames(hub: HubFlags): GameType[] {
  if (Array.isArray(hub.enabledGames)) {
    const parsed = normalizeEnabledGames(hub.enabledGames);
    if (parsed.length > 0) return parsed;
  }

  if (typeof hub.enabledGames === 'string' && hub.enabledGames.trim()) {
    try {
      const parsed = normalizeEnabledGames(JSON.parse(hub.enabledGames));
      if (parsed.length > 0) return parsed;
    } catch {
      const parsed = normalizeEnabledGames(hub.enabledGames.split(','));
      if (parsed.length > 0) return parsed;
    }
  }

  const fallback: GameType[] = [];
  if (hub.triviaEnabled) fallback.push('trivia');
  if (hub.puzzleEnabled) fallback.push('puzzle');
  return fallback;
}

export function isGameEnabled(hub: HubFlags, game: GameType) {
  return parseEnabledGames(hub).includes(game);
}
