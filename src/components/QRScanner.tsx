'use client';
import { useRef, useEffect, useState } from 'react';

export default function QRScanner({ onSuccess, onClose }: {
  onSuccess: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermission(true);
      }
    } catch (err) {
      console.log('Camera error:', err);
      setError('Camera access denied or not available');
      setPermission(false);
    }
  }

  function handleManualEntry(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      onSuccess(e.currentTarget.value.trim());
    }
  }

  function handleSubmit() {
    if (inputRef.current?.value.trim()) {
      onSuccess(inputRef.current.value.trim());
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-purple-700/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-display text-2xl">Scan QR Code</h2>
          <button 
            onClick={onClose} 
            className="text-purple-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {permission === true && (
          <div className="mb-4 bg-purple-900/30 rounded-xl overflow-hidden border-2 border-purple-700/50">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-purple-900/20">
              <div className="absolute inset-4 border-2 border-purple-400/30 rounded-lg" />
            </div>
          </div>
        )}

        {permission === null && (
          <div className="mb-4 bg-purple-900/30 rounded-xl h-60 flex items-center justify-center border-2 border-purple-700/50">
            <div className="text-center">
              <div className="text-4xl mb-2">📱</div>
              <p className="text-purple-300 text-sm">Requesting camera access...</p>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded-lg">{error}</p>}

        {/* Manual entry section */}
        <div className="space-y-3 border-t border-purple-700/30 pt-4 mt-4">
          <label className="block text-purple-300 text-sm font-semibold">Or enter quest code:</label>
          <div className="flex gap-2">
            <input 
              ref={inputRef}
              type="text"
              placeholder="e.g. QUEST-001"
              maxLength={20}
              onKeyDown={handleManualEntry}
              className="flex-1 bg-purple-900/30 border border-purple-700/50 rounded-xl px-4 py-2 text-white placeholder-purple-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-sm"
              autoFocus={permission === false}
            />
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-colors"
            >
              Go
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
