'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TriviaCategoryCardProps {
  categoryId: number;
  categoryName: string;
  code: string;
  variant?: 'compact' | 'full';
}

export default function TriviaCategoryCard({ categoryId, categoryName, code, variant = 'compact' }: TriviaCategoryCardProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this category has been completed by querying the API
    const checkCompletion = async () => {
      setIsLoading(true);
      try {
        const playerName = localStorage.getItem('hq_player_name');
        const query = `/api/quest/trivia/category-completion?categoryId=${categoryId}&code=${encodeURIComponent(code)}${playerName ? `&playerName=${encodeURIComponent(playerName)}` : ''}`;
        
        const res = await fetch(query);
        if (res.ok) {
          const data = await res.json();
          setIsCompleted(data.completed);
        }
      } catch (err) {
        // Silently fail - just don't show completion status
        console.error('Failed to check completion status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkCompletion();
  }, [categoryId, code]);

  if (variant === 'full') {
    if (isCompleted) {
      return (
        <div className="block quest-card p-5 border border-gray-700/40 opacity-60 pointer-events-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-500/10 flex items-center justify-center text-2xl">📚</div>
            <div className="flex-1 flex items-center gap-2">
              <div className="font-display text-lg text-gray-400">{categoryName}</div>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 border border-gray-500/40 text-xs text-gray-400">
                ✓ Completed
              </span>
            </div>
            <div className="text-gray-500 text-xl">✕</div>
          </div>
        </div>
      );
    }

    return (
      <Link
        href={`/quest/${code}/trivia/${categoryId}`}
        className="block quest-card p-5 border border-purple-700/20 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📚</div>
          <div className="flex-1">
            <div className="font-display text-lg text-white">{categoryName}</div>
          </div>
          <div className="text-purple-400 group-hover:text-amber-400 text-xl transition-colors">→</div>
        </div>
      </Link>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-700/40 bg-gray-950/20 text-gray-400 opacity-60 cursor-not-allowed">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{categoryName}</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 border border-gray-500/40 text-xs">
            ✓ Completed
          </span>
        </div>
        <span className="text-gray-500 text-lg">✕</span>
      </div>
    );
  }

  return (
    <Link
      href={`/quest/${code}/trivia/${categoryId}`}
      className="flex items-center justify-between p-3 rounded-2xl border border-purple-700/30 bg-purple-950/40 text-white hover:bg-purple-900/50 hover:border-purple-500/50 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{categoryName}</span>
      </div>
      <span className="text-purple-400 group-hover:text-amber-400 transition-colors text-lg">→</span>
    </Link>
  );
}
