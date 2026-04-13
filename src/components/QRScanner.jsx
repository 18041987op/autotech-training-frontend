import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";

/**
 * QR Code Scanner Component
 * Uses html5-qrcode for camera-based QR scanning.
 *
 * Props:
 *   onScan(decodedText) — called when a QR is successfully scanned
 *   onClose() — called when scanner is dismissed
 */
export function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  // Store onScan in a ref so the scanner effect never needs to restart
  // when the parent re-renders (which would cause clear() to run while scanning)
  const onScanRef = useRef(onScan);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Keep the ref current without triggering scanner restart
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    let scanner;
    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode("qr-reader");
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          async (decodedText) => {
            // Stop first, then call parent via ref (always latest handler)
            try { await scanner.stop(); } catch { /* ignore */ }
            setScanning(false);
            onScanRef.current(decodedText);
          },
          () => { /* QR not found in frame — ignore */ }
        );
        setScanning(true);
      } catch (err) {
        console.error("QR Scanner error:", err);
        setError(
          typeof err === "string"
            ? err
            : err?.message || "Camera access denied. Please enable camera permissions."
        );
      }
    };

    startScanner();

    return () => {
      // Only stop — no clear() needed since the DOM element is being removed
      // clear() throws "Cannot clear while scan is ongoing" if called before stop() resolves
      html5QrRef.current?.stop().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: scanner starts once, never restarts on parent re-renders

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur">
        <div className="flex items-center gap-2 text-white">
          <Camera className="h-5 w-5" />
          <span className="text-sm font-semibold">Scan Tool QR Code</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scanner viewport */}
      <div className="flex-1 flex items-center justify-center relative">
        {error ? (
          <div className="text-center px-6">
            <Camera className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div
              id="qr-reader"
              ref={scannerRef}
              className="w-full max-w-sm mx-auto"
            />
            {/* Scanning overlay hint */}
            {scanning && (
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-white/80 text-xs bg-black/50 inline-block px-4 py-2 rounded-full backdrop-blur">
                  Point camera at the QR code on the tool
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * QR Scanner Button — opens the scanner in a full-screen overlay.
 * Use this in toolbars or FABs.
 */
export function QRScannerButton({ onScan, className = "" }) {
  const [open, setOpen] = useState(false);

  const handleScan = (text) => {
    setOpen(false);
    onScan(text);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition ${className}`}
        title="Scan QR Code"
      >
        <Camera className="h-4 w-4" />
        <span className="hidden sm:inline">Scan QR</span>
      </button>

      {open && <QRScanner onScan={handleScan} onClose={() => setOpen(false)} />}
    </>
  );
}
