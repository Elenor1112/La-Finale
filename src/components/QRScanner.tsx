'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

export default function QRScanner({ onSuccess, onClose }: {
  onSuccess: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);
  const handledRef = useRef(false);

  // ── init detector once ──────────────────────────────────────────────────────
  useEffect(() => {
    if ('BarcodeDetector' in window) {
      // @ts-ignore
      detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
    }
    // jsQR fallback is loaded dynamically below if needed
  }, []);

  // ── camera startup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => startCamera(), 100);
    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setPermission(true);
        setScanning(true);
        startScanLoop();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available');
      setPermission(false);
    }
  }

  // ── core scan loop ──────────────────────────────────────────────────────────
  const startScanLoop = useCallback(() => {
    const tick = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const { videoWidth: w, videoHeight: h } = video;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, w, h);

      try {
        // ── Path 1: native BarcodeDetector (Chrome, Edge, Samsung Browser) ──
        if (detectorRef.current) {
          const results = await detectorRef.current.detect(canvas);
          if (results.length > 0) {
            handleDetected(results[0].rawValue);
            return;
          }
        } else {
          // ── Path 2: jsQR fallback (Firefox, Safari, older browsers) ──
          // Lazy-load jsQR only when needed
          if (!(window as any).jsQR) {
            await loadJsQR();
          }
          const imageData = ctx.getImageData(0, 0, w, h);
          const result = (window as any).jsQR(imageData.data, w, h, {
            inversionAttempts: 'dontInvert',
          });
          if (result) {
            handleDetected(result.data);
            return;
          }
        }
      } catch (e) {
        // detection errors are non-fatal; keep looping
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  function handleDetected(value: string) {
    if (handledRef.current) return;
    handledRef.current = true;
    setScanning(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    // Brief flash feedback before calling onSuccess
    navigator.vibrate?.(100); // haptic on mobile if supported
    onSuccess(value);
  }

  // Dynamically inject jsQR from CDN as a fallback
  function loadJsQR(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).jsQR) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ── manual entry ────────────────────────────────────────────────────────────
  function handleManualEntry(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && e.currentTarget.value.trim() && !handledRef.current) {
      handledRef.current = true;
      onSuccess(e.currentTarget.value.trim());
    }
  }

  function handleSubmit() {
    if (inputRef.current?.value.trim() && !handledRef.current) {
      handledRef.current = true;
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
          >✕</button>
        </div>

        <div className="mb-4 relative bg-purple-900/30 rounded-xl overflow-hidden border-2 border-purple-700/50">
          {/* Hidden canvas — used only for frame capture, never shown */}
          <canvas ref={canvasRef} className="hidden" />

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ display: permission === true ? 'block' : 'none' }}
            className="w-full aspect-square object-cover"
          />

          {permission === null && (
            <div className="h-60 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-purple-300 text-sm">Requesting camera access...</p>
              </div>
            </div>
          )}

          {permission === true && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Targeting reticle */}
              <div className="w-48 h-48 relative">
                <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-purple-400 rounded-tl" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-400 rounded-tr" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-purple-400 rounded-bl" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br" />
                {scanning && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-purple-400/70 animate-[scan_2s_linear_infinite]" />
                )}
              </div>
            </div>
          )}
        </div>

        {scanning && permission === true && (
          <p className="text-purple-400 text-xs text-center mb-3 animate-pulse">
            Point camera at a QR code…
          </p>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded-lg">{error}</p>
        )}

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
            >Go</button>
          </div>
        </div>
      </div>
    </div>
  );
}
