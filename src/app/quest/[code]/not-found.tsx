// src/app/quest/[code]/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center animate-bounce-in">
        <div className="text-8xl mb-4">🗺️</div>
        <h1 className="font-display text-4xl text-red-400 mb-2">Quest Not Found!</h1>
        <p className="text-purple-300 mb-6">This QR code doesn't match any quest.</p>
        <Link href="/" className="btn-shimmer px-6 py-3 rounded-xl text-white font-display text-xl">
          ← Home
        </Link>
      </div>
    </main>
  );
}
