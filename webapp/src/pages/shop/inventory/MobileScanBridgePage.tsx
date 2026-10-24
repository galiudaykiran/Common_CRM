import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode';
import {
  ScanBarcode,
  CheckCircle2,
  AlertCircle,
  Zap,
  ZapOff,
  RefreshCw,
  Smartphone,
  Camera,
  Send,
  HelpCircle,
  Check,
} from 'lucide-react';
import { apiClient } from '../../../api/client';

export const MobileScanBridgePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session') || '';

  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [transmitted, setTransmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const qrRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerId = 'mobile-scanner-viewfinder';

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {}
  };

  const handleDetected = async (barcode: string) => {
    const cleanCode = barcode.trim();
    if (!cleanCode) return;

    playBeep();
    setScannedCode(cleanCode);

    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.pause(true);
      } catch (e) {}
    }

    try {
      await apiClient.post(`/shop/inventory/scan-bridge/${sessionId}`, { barcode: cleanCode });
      setTransmitted(true);
    } catch (err: any) {
      setErrorMsg('Failed to transmit barcode to desktop. Check Wi-Fi connection.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetected(manualCode.trim());
      setManualCode('');
    }
  };

  // 1-Tap native camera capture (Works 100% on all mobile devices over HTTP/HTTPS)
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessingFile(true);

    try {
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
      ];

      const sandboxId = 'mobile-file-scan-sandbox';
      let sandboxEl = document.getElementById(sandboxId);
      if (!sandboxEl) {
        sandboxEl = document.createElement('div');
        sandboxEl.id = sandboxId;
        sandboxEl.style.display = 'none';
        document.body.appendChild(sandboxEl);
      }

      const fileScanner = new Html5Qrcode(sandboxId, { formatsToSupport, verbose: false });
      const decodedText = await fileScanner.scanFile(file, true);
      fileScanner.clear();
      handleDetected(decodedText);
    } catch (err: any) {
      setErrorMsg('Could not detect a clear barcode in the photo. Please align closer with good lighting and snap again.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Optional live video stream
  const startLiveCamera = async () => {
    setErrorMsg(null);
    try {
      if (!qrRef.current) {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];
        qrRef.current = new Html5Qrcode(containerId, { formatsToSupport, verbose: false });
      }

      const config = {
        fps: 20,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.333333,
      };

      await qrRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => handleDetected(decodedText),
        () => {}
      );

      setIsLiveScanning(true);

      try {
        const caps = qrRef.current.getRunningTrackCapabilities();
        if (caps && (caps as any).torch) {
          setHasTorch(true);
        }
      } catch (e) {}
    } catch (err: any) {
      setIsLiveScanning(false);
      const isHttpIssue = window.location.protocol !== 'https:';
      if (isHttpIssue) {
        setErrorMsg('Continuous live video streaming is restricted by mobile browsers over plain HTTP. Tap "📸 Snap Barcode with Phone Camera" below — it opens your native phone camera directly with zero restrictions!');
      } else {
        setErrorMsg(err?.message || 'Camera permission denied or camera not accessible.');
      }
    }
  };

  const stopLiveCamera = async () => {
    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.stop();
      } catch (e) {}
      setIsLiveScanning(false);
    }
  };

  const toggleTorch = async () => {
    if (!qrRef.current || !hasTorch) return;
    try {
      const next = !torchOn;
      await qrRef.current.applyVideoConstraints({ advanced: [{ torch: next }] as any });
      setTorchOn(next);
    } catch (e) {}
  };

  const resumeScanning = async () => {
    setScannedCode(null);
    setTransmitted(false);
    setErrorMsg(null);
    if (qrRef.current && isLiveScanning) {
      try {
        qrRef.current.resume();
      } catch (e) {
        startLiveCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090d16',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Hidden file input for native camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handlePhotoCapture}
      />

      {/* Mobile Header */}
      <header
        style={{
          padding: '16px 20px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Smartphone size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Mobile Barcode Scanner</h1>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Connected Session: {sessionId}</span>
          </div>
        </div>

        {hasTorch && isLiveScanning && (
          <button
            onClick={toggleTorch}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: torchOn ? '#eab308' : '#334155',
              color: torchOn ? '#000' : '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {torchOn ? <ZapOff size={14} /> : <Zap size={14} />}
            <span>Flash</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        {/* Error Alert Box */}
        {errorMsg && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '13px',
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Live Camera Viewfinder (if active) */}
        {isLiveScanning && (
          <div
            style={{
              width: '100%',
              minHeight: '280px',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#000',
              position: 'relative',
              boxShadow: '0 0 25px rgba(0,0,0,0.8)',
            }}
          >
            <div id={containerId} style={{ width: '100%', height: '100%' }} />

            {/* Glowing Laser Scan Animation Overlay */}
            {!scannedCode && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '80%',
                    height: '50%',
                    border: '2px solid rgba(16, 185, 129, 0.85)',
                    borderRadius: '8px',
                    position: 'relative',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: '#10b981',
                      boxShadow: '0 0 10px #10b981',
                      animation: 'mobileLaser 1.5s ease-in-out infinite alternate',
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={stopLiveCamera}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Close Live Feed
            </button>
          </div>
        )}

        <style>
          {`
            @keyframes mobileLaser {
              0% { top: 5%; }
              100% { top: 92%; }
            }
            #${containerId} video {
              object-fit: cover !important;
              border-radius: 14px;
            }
          `}
        </style>

        {/* PRIMARY ACTION: 1-Tap Camera Snap Button */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
            border: '2px solid #10b981',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '14px', color: '#a7f3d0', fontWeight: 600 }}>
            {isProcessingFile ? 'Analyzing Barcode Photo...' : 'Recommended for All Mobile Phones:'}
          </div>

          <button
            type="button"
            disabled={isProcessingFile}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              background: isProcessingFile ? '#059669' : '#10b981',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer',
            }}
          >
            {isProcessingFile ? (
              <>
                <RefreshCw size={22} className="animate-spin" />
                <span>Reading Barcode...</span>
              </>
            ) : (
              <>
                <Camera size={22} />
                <span>📸 Open Camera & Snap Barcode</span>
              </>
            )}
          </button>

          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
            Opens your phone camera app directly. Tap the button, aim at the product barcode, take a quick photo, and it beams straight to the desktop!
          </p>
        </div>

        {/* SECONDARY ACTION: Live Video Camera Toggle */}
        {!isLiveScanning && (
          <button
            type="button"
            onClick={startLiveCamera}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <ScanBarcode size={18} />
            <span>📹 Try Live Video Scanner</span>
          </button>
        )}

        {/* TERTIARY ACTION: Manual Barcode Entry */}
        <div
          style={{
            marginTop: 'auto',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
            Or type barcode number manually:
          </span>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. 8901030382910"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: manualCode.trim() ? '#6366f1' : '#334155',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Transmitted Popup Modal */}
        {scannedCode && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(9, 13, 22, 0.95)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              zIndex: 999,
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Check size={40} color="#10b981" />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: '#fff' }}>
              {transmitted ? 'Transmitted to PC!' : 'Sending to Desktop...'}
            </h2>

            <div
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                fontFamily: 'monospace',
                fontSize: '22px',
                fontWeight: 800,
                color: '#34d399',
                marginBottom: '12px',
                letterSpacing: '1px',
              }}
            >
              {scannedCode}
            </div>

            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 28px', maxWidth: '280px' }}>
              The barcode is now filled in the desktop application form!
            </p>

            <button
              onClick={resumeScanning}
              style={{
                width: '100%',
                maxWidth: '320px',
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={18} />
              <span>Scan Next Item</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer
        style={{
          padding: '12px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          fontSize: '11px',
          color: '#64748b',
        }}
      >
        Common CRM Mobile Scan Bridge • Session {sessionId}
      </footer>
    </div>
  );
};
