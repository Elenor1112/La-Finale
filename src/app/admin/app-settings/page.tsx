'use client';

import { useEffect, useState } from 'react';

export default function AdminAppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.leaderboardVisible === 'boolean') setLeaderboardVisible(data.leaderboardVisible);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function toggle() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderboardVisible: !leaderboardVisible }),
      });
      if (res.ok) {
        setLeaderboardVisible(!leaderboardVisible);
        setMessage('Saved');
      } else {
        const data = await res.json();
        setMessage(data?.error || 'Failed');
      }
    } catch (e) {
      setMessage('Failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="min-h-screen px-6 py-8">Loading...</main>;

  return (
    <main className="min-h-screen px-6 py-8 max-w-2xl">
      <h1 className="font-display text-3xl text-amber-400 mb-4">App Settings</h1>
      <div className="quest-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Leaderboard Visibility</div>
            <div className="text-sm text-purple-300">Show or hide the public leaderboard</div>
          </div>
          <div>
            <button onClick={toggle} disabled={saving} className={`px-4 py-2 rounded-xl ${leaderboardVisible ? 'bg-emerald-600' : 'bg-gray-600'}`}>
              {leaderboardVisible ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        {message && <div className="mt-3 text-sm text-purple-300">{message}</div>}
      </div>
    </main>
  );
}
