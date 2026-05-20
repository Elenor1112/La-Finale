'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/QRScanner';

export default function HomePage() {
  const router = useRouter();
  const [showQRModal, setShowQRModal] = useState(false);

  function handleQRSuccess(code: string) {
    setShowQRModal(false);
    router.push(`/quest/${code}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-16 left-8 w-24 h-24 rounded-full bg-purple-600/20 blur-2xl animate-float" />
      <div className="absolute bottom-24 right-8 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-4 w-16 h-16 rounded-full bg-emerald-500/10 blur-xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Hero */}
      <div className="text-center animate-slide-up max-w-sm w-full">
        {/* Logo */}
        <div className="relative inline-block mb-6">
          <div className="w-28 h-28 rounded-3xl btn-shimmer flex items-center justify-center mx-auto shadow-2xl glow-border">
            <span className="text-6xl">🗺️</span>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center animate-bounce text-black font-bold text-xs">✦</div>
        </div>

        <h1 className="font-display text-6xl text-white mb-2 tracking-wide">
          HERTS
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-400">
            QUEST
          </span>
        </h1>
        <p className="text-purple-300 text-lg mb-10 font-body">
          Explore. Solve. Conquer. 🏆
        </p>

        {/* Action cards */}
        <div className="space-y-4 w-full">
          <Link href="/leaderboard" className="block quest-card p-5 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 hover:glow-gold group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🏆</div>
              <div className="text-left">
                <div className="font-display text-xl text-amber-400">Leaderboard</div>
                <div className="text-purple-300 text-sm">See who's winning</div>
              </div>
              <div className="ml-auto text-purple-400 text-xl">→</div>
            </div>
          </Link>

          <button
            onClick={() => setShowQRModal(true)}
            className="quest-card p-5 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 hover:glow-purple group cursor-pointer w-full text-left border"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📱</div>
              <div className="text-left">
                <div className="font-display text-xl text-purple-300">Scan a QR Code</div>
                <div className="text-purple-400 text-sm">Find one around campus</div>
              </div>
              <div className="ml-auto text-purple-400 text-xl">→</div>
            </div>
          </button>
        </div>

        {/* Stats teaser */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            { icon: '🧩', label: 'Puzzles' },
            { icon: '⚡', label: 'Points' },
            { icon: '🎯', label: 'Quests' },
          ].map((item) => (
            <div key={item.label} className="quest-card p-3 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-purple-300 text-xs">{item.label}</div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-purple-500 text-xs">
          Scan QR codes around campus to begin your quest
        </p>
      </div>

      {/* QR Scanner Modal */}
      {showQRModal && (
        <QRScanner
          onSuccess={handleQRSuccess}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </main>
  );
}
