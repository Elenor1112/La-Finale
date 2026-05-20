'use client';
// src/app/leaderboard/LeaderboardClient.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Player = {
  id: string;
  name: string;
  score: number;
  createdAt: Date | string;
  _count: { submissions: number };
};

const MEDAL = ['🥇', '🥈', '🥉'];
const RANK_CLASS = ['rank-1', 'rank-2', 'rank-3'];

export default function LeaderboardClient({ initialPlayers }: { initialPlayers: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setPlayers(data);
          setLastUpdated(new Date());
          setPulse(true);
          setTimeout(() => setPulse(false), 500);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="w-10 h-10 quest-card flex items-center justify-center text-purple-300 hover:text-white transition-colors rounded-xl">←</Link>
        <div>
          <h1 className="font-display text-4xl text-amber-400">Leaderboard</h1>
          <p className={`text-purple-400 text-xs transition-all ${pulse ? 'text-emerald-400' : ''}`}>
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="ml-auto text-4xl animate-float">🏆</div>
      </div>

      {/* Top 3 podium */}
      {players.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-8 h-36">
          {/* 2nd */}
          <div className="flex-1 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-12 h-12 rounded-full rank-2 flex items-center justify-center text-lg font-bold mb-2 shadow-lg">
              {players[1]?.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs text-purple-300 font-semibold truncate w-full text-center">{players[1]?.name}</div>
            <div className="text-amber-400 font-display text-sm">{players[1]?.score}pts</div>
            <div className="w-full bg-gradient-to-t from-purple-600/60 to-purple-400/30 rounded-t-lg h-16 mt-1 flex items-center justify-center text-2xl">🥈</div>
          </div>
          {/* 1st */}
          <div className="flex-1 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0s' }}>
            <div className="text-2xl animate-bounce mb-1">👑</div>
            <div className="w-14 h-14 rounded-full rank-1 flex items-center justify-center text-xl font-bold mb-2 shadow-lg glow-gold">
              {players[0]?.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs text-purple-200 font-semibold truncate w-full text-center">{players[0]?.name}</div>
            <div className="text-amber-400 font-display">{players[0]?.score}pts</div>
            <div className="w-full bg-gradient-to-t from-amber-500/60 to-amber-400/30 rounded-t-lg h-24 mt-1 flex items-center justify-center text-2xl">🥇</div>
          </div>
          {/* 3rd */}
          <div className="flex-1 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 rounded-full rank-3 flex items-center justify-center text-lg font-bold mb-2 shadow-lg">
              {players[2]?.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs text-purple-300 font-semibold truncate w-full text-center">{players[2]?.name}</div>
            <div className="text-amber-400 font-display text-sm">{players[2]?.score}pts</div>
            <div className="w-full bg-gradient-to-t from-amber-700/60 to-amber-600/30 rounded-t-lg h-10 mt-1 flex items-center justify-center text-2xl">🥉</div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {players.map((player, i) => (
          <div
            key={player.id}
            className={`quest-card p-4 flex items-center gap-4 animate-slide-up transition-all ${
              i < 3 ? 'border-amber-500/30' : ''
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Rank */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display text-lg font-bold flex-shrink-0 ${
              i < 3 ? RANK_CLASS[i] : 'bg-purple-900/50 text-purple-300'
            }`}>
              {i < 3 ? MEDAL[i] : i + 1}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {player.name.charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">{player.name}</div>
              <div className="text-purple-400 text-xs">{player._count.submissions} puzzles solved</div>
            </div>

            {/* Score */}
            <div className="text-right flex-shrink-0">
              <div className="font-display text-xl text-amber-400">{player.score}</div>
              <div className="text-purple-400 text-xs">points</div>
            </div>
          </div>
        ))}

        {players.length === 0 && (
          <div className="quest-card p-12 text-center">
            <div className="text-5xl mb-4">🌟</div>
            <p className="text-purple-300 font-display text-xl">No players yet!</p>
            <p className="text-purple-500 text-sm mt-2">Be the first to complete a quest</p>
          </div>
        )}
      </div>

      <p className="text-center text-purple-600 text-xs mt-8">Auto-refreshes every 5 seconds</p>
    </main>
  );
}
