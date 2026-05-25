import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isGameEnabled } from '@/lib/game-hubs';
import TriviaCategoryCard from '@/components/TriviaCategoryCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default async function TriviaIndex({ params }: { params: { code: string } }) {
  const hub = await prisma.gameHub.findUnique({ where: { code: params.code.toUpperCase() } });
  if (!hub) notFound();

  if (!isGameEnabled(hub, 'trivia')) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="quest-card p-8 text-center max-w-sm w-full">
          <p className="text-purple-300 font-display text-xl mb-4">Trivia is not enabled for this Game Hub.</p>
          <Link href={`/quest/${params.code}`} className="inline-block rounded-2xl bg-purple-600/80 px-6 py-3 text-white font-semibold hover:bg-purple-500 transition-colors">
            Back to Hub
          </Link>
        </div>
      </main>
    );
  }

  const categories = await prisma.triviaCategory.findMany({ orderBy: { name: 'asc' } });

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <Link
        href={`/quest/${params.code}`}
        className="inline-flex items-center gap-2 text-purple-400 hover:text-white mb-6 transition-colors text-sm"
      >
        ← Back to Hub
      </Link>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🧠</div>
        <h1 className="font-display text-4xl text-white mb-1">Trivia Quiz</h1>
        <p className="text-purple-400 text-sm">Pick a category and test your knowledge!</p>
      </div>

      {categories.length === 0 ? (
        <div className="quest-card p-8 text-center">
          <p className="text-purple-300 font-display text-xl">No trivia categories available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((c) => (
            <TriviaCategoryCard
              key={c.id}
              categoryId={c.id}
              categoryName={c.name}
              code={params.code}
              variant="full"
            />
          ))}
        </div>
      )}
    </main>
  );
}
