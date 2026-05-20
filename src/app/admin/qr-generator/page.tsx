'use client';

import { useState } from 'react';

const examples = ['WELCOME', 'GOLDEN_KEY', 'MYSTERY', 'TREASURE'];

export default function AdminQrGeneratorPage() {
  const [code, setCode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [status, setStatus] = useState('');

  async function generateQr() {
    if (!code.trim()) {
      setStatus('Enter a quest code to generate its QR.');
      return;
    }

    setStatus('Generating QR...');
    const url = `${window.location.origin}/quest/${encodeURIComponent(code.trim())}`;
    const res = await fetch(`/api/qr?url=${encodeURIComponent(url)}`);

    if (!res.ok) {
      setStatus('Failed to create QR code.');
      return;
    }

    const body = await res.json();
    setQrUrl(body.dataUrl || '');
    setStatus(body.dataUrl ? 'Scan or download the QR code below.' : 'QR service returned no QR image.');
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl text-white">QR Generator</h1>
          <p className="text-purple-300 mt-2">Create shareable QR codes for in-game quest codes.</p>
        </div>
      </div>

      <div className="quest-card rounded-3xl border border-purple-700/40 bg-slate-950/80 p-6">
        <label className="block text-sm text-purple-300">Quest code</label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter quest code"
            className="w-full rounded-3xl border border-purple-700/50 bg-purple-950/60 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
          />
          <button onClick={generateQr} className="rounded-3xl bg-amber-500/90 px-6 py-3 text-slate-950 transition hover:bg-amber-400">Generate</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-purple-400">Example codes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setCode(example)}
                  className="rounded-full border border-purple-700/40 px-3 py-2 text-sm text-purple-200 transition hover:bg-purple-700/40"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-purple-400">Status</p>
            <p className="mt-3 text-purple-300">{status || 'Enter a code and generate a QR.'}</p>
          </div>
        </div>

        {qrUrl ? (
          <div className="mt-6 rounded-3xl border border-purple-700/40 bg-slate-950/80 p-6 text-center">
            <p className="text-sm text-purple-300">QR code generated for <span className="font-semibold text-white">{code}</span></p>
            <img src={qrUrl} alt={`QR code for ${code}`} className="mx-auto mt-4 h-64 w-64 rounded-3xl border border-white/10 bg-white/5 p-3" />
            <a href={qrUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-2xl bg-purple-600/80 px-5 py-3 text-white transition hover:bg-purple-500/90">Open Image</a>
          </div>
        ) : null}
      </div>
    </main>
  );
}
