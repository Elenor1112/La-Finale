'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/QRScanner';

function useAppSettings(setLeaderboardVisible: (visible: boolean) => void) {
  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && typeof data.leaderboardVisible === 'boolean') {
          setLeaderboardVisible(data.leaderboardVisible);
        }
      } catch {
        // Use the default setting if the API is unavailable.
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, [setLeaderboardVisible]);
}

function extractQuestCode(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return '';

  try {
    const url = new URL(value, window.location.origin);
    const parts = url.pathname.split('/').filter(Boolean);
    const questIndex = parts.findIndex((part) => part.toLowerCase() === 'quest');

    if (questIndex >= 0 && parts[questIndex + 1]) {
      return decodeURIComponent(parts[questIndex + 1]).trim().toUpperCase();
    }

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
      return decodeURIComponent(parts[parts.length - 1] || '').trim().toUpperCase();
    }
  } catch {
    // Fall through to plain code parsing.
  }

  const withoutQuery = value.split('?')[0].split('#')[0];
  const parts = withoutQuery.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || withoutQuery).trim().toUpperCase();
}

export default function HomePage() {
  const router = useRouter();
  const [showQRModal, setShowQRModal] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useAppSettings(setLeaderboardVisible);

  async function openHub(code: string) {
    const cleanCode = extractQuestCode(code);
    if (!cleanCode) {
      setShowQRModal(false);
      setErrorMsg('That QR code does not contain a Herts Quest hub code.');
      return;
    }

    const res = await fetch(`/api/quest/hub?code=${encodeURIComponent(cleanCode)}`);
    if (!res.ok) {
      setShowQRModal(false);
      setErrorMsg(`Invalid Quest Code "${cleanCode}". Please scan an active campus QR code.`);
      return;
    }

    const data = await res.json();
    if (!data.valid || !data.hub?.code) {
      setShowQRModal(false);
      setErrorMsg(`Invalid Quest Code "${cleanCode}". Please scan an active campus QR code.`);
      return;
    }

    setShowQRModal(false);
    router.push(`/quest/${data.hub.code}`);
  }

  async function handleQRSuccess(rawCode: string) {
    if (isValidating) return;
    setIsValidating(true);
    setErrorMsg('');

    try {
      await openHub(rawCode);
    } catch {
      setShowQRModal(false);
      setErrorMsg('Network error validating the QR code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  }

  async function handlePlayNow() {
    setShowQRModal(true);
    setErrorMsg('');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-16 left-8 w-24 h-24 rounded-full bg-purple-600/20 blur-2xl animate-float" />
      <div className="absolute bottom-24 right-8 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-4 w-16 h-16 rounded-full bg-emerald-500/10 blur-xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="text-center animate-slide-up max-w-sm w-full">
        <div className="relative inline-block mb-6">
          <div className="w-28 h-28 rounded-3xl btn-shimmer flex items-center justify-center mx-auto shadow-2xl glow-border">
            <span className="font-display text-4xl text-white">HQ</span>
          </div>
        </div>

        <h1 className="font-display text-6xl text-white mb-2 tracking-wide">
          HERTS
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-400">
            QUEST
          </span>
        </h1>
        <p className="text-purple-300 text-lg mb-10 font-body">
          Explore. Solve. Conquer.
        </p>

        <div className="space-y-4 w-full">
          <button
            onClick={handlePlayNow}
            className="block w-full quest-card p-5 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 group text-left border border-purple-700/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-xl font-display text-emerald-300 group-hover:scale-110 transition-transform">Go</div>
              <div className="text-left">
                <div className="font-display text-xl text-white">Play Now</div>
                <div className="text-purple-300 text-sm">Scan a QR code to enter a Game Hub</div>
              </div>
              <div className="ml-auto text-purple-400 text-xl">-&gt;</div>
            </div>
          </button>

          {leaderboardVisible && (
            <Link href="/leaderboard" className="block quest-card p-5 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 hover:glow-gold group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-xl font-display text-amber-300 group-hover:scale-110 transition-transform">#1</div>
                <div className="text-left">
                  <div className="font-display text-xl text-amber-400">Leaderboard</div>
                  <div className="text-purple-300 text-sm">See the rankings</div>
                </div>
                <div className="ml-auto text-purple-400 text-xl">-&gt;</div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {showQRModal && (
        <QRScanner
          onSuccess={handleQRSuccess}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {errorMsg && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-red-500/40 text-center shadow-2xl relative">
            <h3 className="font-display text-2xl text-white mb-2">Game Hub Unavailable</h3>
            <p className="text-purple-300 text-sm mb-6 leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={() => setErrorMsg('')}
              className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 py-3 text-white font-semibold shadow-lg hover:brightness-110 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {isValidating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className="quest-card p-8 rounded-3xl max-w-xs w-full text-center shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mb-4" />
            <p className="text-purple-300 font-display text-lg animate-pulse">Loading Game Hub...</p>
          </div>
        </div>
      )}
    </main>
  );
}
