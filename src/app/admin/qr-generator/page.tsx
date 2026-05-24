import Link from 'next/link';

export default function AdminQrGeneratorPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="quest-card p-8 text-center">
        <h1 className="font-display text-4xl text-white mb-3">QR Codes Moved to Game Hubs</h1>
        <p className="text-purple-300 mb-6">
          Herts Quest now generates one QR code per Game Hub. Create or edit a hub, then use its QR Code action.
        </p>
        <Link
          href="/admin/game-hubs"
          className="inline-flex rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 px-6 py-3 text-white font-semibold"
        >
          Open Game Hubs
        </Link>
      </div>
    </main>
  );
}
