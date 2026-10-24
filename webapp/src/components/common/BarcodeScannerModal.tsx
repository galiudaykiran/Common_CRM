import React, { useEffect, useRef, useState } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  CameraDevice,
} from 'html5-qrcode';
import {
  Camera,
  X,
  Upload,
  RefreshCw,
  Zap,
  ZapOff,
  AlertCircle,
  CheckCircle2,
  ScanBarcode,
  Keyboard,
  Smartphone,
  QrCode,
  Copy,
  Check,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

// Crisp POS register scanner beep using native Web Audio API
export const playBarcodeBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1850, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    if ('vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch (e) {
    // Audio playback policy fallback
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Barcode / EAN',
}) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [mode, setMode] = useState<'CAMERA' | 'IMAGE'>('CAMERA');
  const [activeTab, setActiveTab] = useState<'LOCAL_CAMERA' | 'MOBILE_BRIDGE' | 'HARDWARE'>('LOCAL_CAMERA');
  const [bridgeSessionId, setBridgeSessionId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerId = 'barcode-reader-container';

  // Wireless Mobile Scanner Bridge Polling
  useEffect(() => {
    if (!isOpen || activeTab !== 'MOBILE_BRIDGE' || !bridgeSessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/shop/inventory/scan-bridge/${bridgeSessionId}`);
        if (res.data?.data?.scanned && res.data?.data?.barcode) {
          handleSuccessfulScan(res.data.data.barcode);
        }
      } catch (e) {
        // quiet retry
      }
    }, 900);

    return () => clearInterval(interval);
  }, [isOpen, activeTab, bridgeSessionId]);

  // Listen to physical Bluetooth / USB hardware barcode scanner (wedge mode)
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inputs if user is typing in standard form fields
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.trim().length >= 3) {
          e.preventDefault();
          const code = buffer.trim();
          buffer = '';
          handleSuccessfulScan(code);
        } else {
          buffer = '';
        }
      } else if (e.key.length === 1) {
        // Hardware barcode scanners send keystrokes with < 50ms intervals
        if (diff > 100) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSuccessfulScan = (decodedText: string) => {
    playBarcodeBeep();
    setLastScannedCode(decodedText);
    stopScanner().finally(() => {
      setTimeout(() => {
        onScan(decodedText);
        onClose();
      }, 500);
    });
  };

  const startScanner = async (cameraId?: string) => {
    setErrorMessage(null);
    try {
      if (!html5QrCodeRef.current) {
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
        html5QrCodeRef.current = new Html5Qrcode(readerId, {
          formatsToSupport,
          verbose: false,
        });
      }

      const qr = html5QrCodeRef.current;
      if (qr.isScanning) {
        await qr.stop();
      }

      const config = {
        fps: 20,
        qrbox: { width: 320, height: 180 },
        aspectRatio: 1.777778,
      };

      const cameraParam = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

      await qr.start(
        cameraParam,
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Frame scan error / no barcode in current frame
        }
      );

      setIsScanning(true);

      // Check for torch capability
      try {
        const capabilities = qr.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Camera barcode scanning error:', err);
      setIsScanning(false);
      setErrorMessage(
        err?.message ||
          'Unable to access camera sensor. Please ensure camera permissions are granted or use manual entry / photo upload.'
      );
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }] as any,
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Failed to toggle camera flash/torch', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerId, { verbose: false });
      }
      const decodedResult = await html5QrCodeRef.current.scanFile(file, true);
      handleSuccessfulScan(decodedResult);
    } catch (err: any) {
      setErrorMessage('Could not detect a valid barcode in the uploaded image. Please try a clearer picture.');
    }
  };

  // Initialize camera list and start scanner when modal opens in LOCAL_CAMERA tab
  useEffect(() => {
    if (isOpen && activeTab === 'LOCAL_CAMERA') {
      setLastScannedCode(null);
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length) {
            setCameras(devices);
            // Default to back camera if found
            const backCam = devices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            );
            const targetId = backCam ? backCam.id : devices[0].id;
            setSelectedCameraId(targetId);
            startScanner(targetId);
          } else {
            startScanner();
          }
        })
        .catch(() => {
          startScanner();
        });
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(99, 102, 241, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <ScanBarcode size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Live Camera Sensor • Mobile Device • Hardware Scanner
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 16px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('LOCAL_CAMERA')}
            style={{
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'LOCAL_CAMERA' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'LOCAL_CAMERA' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Camera size={15} />
            <span>Webcam / Device Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopScanner();
              if (!bridgeSessionId) {
                setBridgeSessionId('SCAN-' + Math.floor(1000 + Math.random() * 9000));
              }
              setActiveTab('MOBILE_BRIDGE');
            }}
            style={{
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'MOBILE_BRIDGE' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'MOBILE_BRIDGE' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Smartphone size={15} />
            <span>📱 Mobile Phone (QR Sync)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopScanner();
              setActiveTab('HARDWARE');
            }}
            style={{
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'HARDWARE' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'HARDWARE' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Keyboard size={15} />
            <span>Handheld Scanner</span>
          </button>
        </div>

        {/* TAB 1: LOCAL WEBCAM / DEVICE CAMERA */}
        {activeTab === 'LOCAL_CAMERA' && (
        <div style={{ padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Target Box & Camera Element */}
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              minHeight: '260px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#090d16',
              position: 'relative',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div id={readerId} style={{ width: '100%', height: '100%' }} />

            {/* Glowing Laser Scan Animation Overlay */}
            {isScanning && !lastScannedCode && (
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
                    height: '55%',
                    border: '2px solid rgba(16, 185, 129, 0.85)',
                    borderRadius: '8px',
                    position: 'relative',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {/* Laser Line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: '#10b981',
                      boxShadow: '0 0 10px #10b981',
                      animation: 'scanLaser 1.8s ease-in-out infinite alternate',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Success Feedback Overlay */}
            {lastScannedCode && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(16, 185, 129, 0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  zIndex: 10,
                }}
              >
                <CheckCircle2 size={48} style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '18px' }}>Barcode Scanned!</h4>
                <div
                  style={{
                    padding: '4px 12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                >
                  {lastScannedCode}
                </div>
              </div>
            )}
          </div>

          <style>
            {`
              @keyframes scanLaser {
                0% { top: 5%; opacity: 0.6; }
                100% { top: 92%; opacity: 1; }
              }
              #${readerId} video {
                object-fit: cover !important;
                border-radius: 12px;
              }
            `}
          </style>

          {/* Controls Bar */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '14px',
              gap: '10px',
            }}
          >
            {/* Camera Switcher */}
            {cameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startScanner(e.target.value);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  flex: 1,
                  maxWidth: '220px',
                }}
              >
                {cameras.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              {/* Flashlight toggle */}
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  title={torchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: torchOn ? '#eab308' : 'var(--bg-primary)',
                    color: torchOn ? '#000' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {torchOn ? <ZapOff size={15} /> : <Zap size={15} />}
                  <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                </button>
              )}

              {/* Upload image fallback */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Scan from a photo file or mobile camera snapshot"
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <Upload size={15} />
                <span>Upload Photo</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Scanner Instructions & Connected Mobile / Hardware Support */}
          <div
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              <Smartphone size={14} />
              <span>Mobile Sensor & Connected Hardware Support Active</span>
            </div>
            <div>
              • <strong>Mobile / Camera Sensor:</strong> Center the barcode in the green viewfinder box with sufficient lighting.
            </div>
            <div>
              • <strong>Wireless / Bluetooth Scanner:</strong> Point your connected handheld barcode gun and pull the trigger. It will auto-populate with confirmation beep.
            </div>
          </div>
        </div>
        )}

        {/* TAB 2: MOBILE CAMERA WIRELESS BRIDGE (QR SYNC) */}
        {activeTab === 'MOBILE_BRIDGE' && (() => {
          const mobileHost = window.location.hostname === 'localhost' ? '192.168.0.106' : window.location.hostname;
          const mobileUrl = `${window.location.protocol}//${mobileHost}:5173/scan-bridge?session=${bridgeSessionId}`;
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}`;

          return (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '20px',
                  alignItems: 'center',
                  background: 'var(--bg-primary)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {/* QR Code */}
                <div
                  style={{
                    background: '#fff',
                    padding: '8px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={qrCodeUrl}
                    alt="Scan with phone"
                    style={{ width: '140px', height: '140px', display: 'block' }}
                  />
                </div>

                {/* Instructions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                      }}
                    />
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      Wireless Mobile Scanner
                    </strong>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {bridgeSessionId}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Use your phone as a high-speed wireless barcode scanner. No app download needed!
                  </p>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><strong>1.</strong> Open your phone camera or Google Lens.</div>
                    <div><strong>2.</strong> Scan this QR code to open the scanner page.</div>
                    <div><strong>3.</strong> Aim phone at any product barcode; it beams directly into this form!</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(mobileUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedLink ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
                    </button>
                    <a
                      href={mobileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '11px',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        textDecoration: 'none',
                      }}
                    >
                      <span>Open Link</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Status Listening Indicator */}
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#10b981',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <Radio size={14} className="animate-pulse" />
                <span>Listening for barcode transmission from mobile...</span>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: PHYSICAL HARDWARE / BLUETOOTH SCANNER */}
        {activeTab === 'HARDWARE' && (
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 700 }}>
                <Keyboard size={18} />
                <span>USB & Wireless Bluetooth Handheld Barcode Guns</span>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                All standard retail barcode scanners (Zebra, Honeywell, Netum, Eyoyo, Inateck) work in <strong>HID Keyboard Wedge</strong> mode automatically.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div>• <strong>Plug & Play:</strong> Connect the USB dongle or pair the scanner via Bluetooth to your computer.</div>
                <div>• <strong>Zero Configuration:</strong> Pull the trigger on any barcode label. The platform detects the high-speed keystrokes and immediately inputs the barcode with a POS chime.</div>
                <div>• <strong>Manual Entry:</strong> You can also type directly into the Barcode / EAN field if the label is damaged or worn out.</div>
              </div>
            </div>
          </div>
        )}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--bg-primary)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
