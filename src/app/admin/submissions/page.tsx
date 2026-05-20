'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SubmissionRecord = {
  id: string;
  correct: boolean;
  attempts: number;
  timeSpent: number | null;
  createdAt: string;
  player: { id: string; name: string };
  puzzle: { id: string; code: string; title: string };
};

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const res = await fetch('/api/admin/submissions');
        if (res.ok) {
          setSubmissions(await res.json());
        } else if (res.status === 401) {
          router.push('/admin');
        } else {
          const body = await res.json();
          setError(body?.error || 'Unable to load submissions.');
        }
      } catch {
        setError('Unable to reach the submissions API.');
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, [router]);

  function downloadCsv() {
    const headers = ['Player', 'Puzzle', 'Correct', 'Attempts', 'Time Spent', 'Timestamp'];
    const rows = submissions.map((item) => [
      item.player.name,
      item.puzzle.code,
      item.correct ? 'Correct' : 'Wrong',
      item.attempts.toString(),
      item.timeSpent?.toString() || 'N/A',
      new Date(item.createdAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'submissions.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl text-white">Submission Analytics</h1>
          <p className="text-purple-300 mt-2">Review every answer attempt and export your data.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => router.push('/admin/dashboard')} className="rounded-2xl bg-purple-600/80 px-5 py-3 text-white transition hover:bg-purple-500/90">Back to dashboard</button>
          <button onClick={downloadCsv} className="rounded-2xl bg-amber-500/90 px-5 py-3 text-slate-950 transition hover:bg-amber-400">Export CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="quest-card h-24 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="quest-card p-8 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="quest-card overflow-hidden border border-purple-700/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-slate-950/90">
                <tr>
                  <th className="px-4 py-4 text-purple-300">Player</th>
                  <th className="px-4 py-4 text-purple-300">Puzzle</th>
                  <th className="px-4 py-4 text-purple-300">Correct</th>
                  <th className="px-4 py-4 text-purple-300">Attempts</th>
                  <th className="px-4 py-4 text-purple-300">Time</th>
                  <th className="px-4 py-4 text-purple-300">Created</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => (
                  <tr key={item.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-4 py-4 text-white">{item.player.name}</td>
                    <td className="px-4 py-4 text-purple-200">{item.puzzle.code}</td>
                    <td className={`px-4 py-4 font-semibold ${item.correct ? 'text-emerald-300' : 'text-red-300'}`}>
                      {item.correct ? 'Correct' : 'Wrong'}
                    </td>
                    <td className="px-4 py-4 text-purple-200">{item.attempts}</td>
                    <td className="px-4 py-4 text-purple-200">{item.timeSpent ?? 'N/A'}</td>
                    <td className="px-4 py-4 text-purple-300">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
