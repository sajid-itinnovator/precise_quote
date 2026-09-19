import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Apple, Check, Share2, PlusSquare, Monitor, X, ExternalLink, ShieldCheck } from 'lucide-react';
import Modal from './Modal';



/** Mobile platforms without the native install prompt get manual-instructions tabs. */
function getPlatform() {
  if (typeof window === 'undefined') return 'ios';
  const ua = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIOS ? 'ios' : /Android/i.test(ua) ? 'android' : 'ios';
}

export function InstallAppModal({ isOpen, onClose }) {
  const { deferredPrompt, isStandalone, triggerNativePrompt } = usePWAInstall();
  const [activeTab, setActiveTab] = useState(getPlatform());
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAndroidInstallClick = async () => {
    if (deferredPrompt) {
      const outcome = await triggerNativePrompt();
      if (outcome === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => onClose(), 2500);
      }
    }
  };

  return (
    <Modal
      onClose={onClose}
      zLevel={99999}
      className=""
      labelledBy="install-app-modal-title"
      style={{
        background: '#ffffff',
        borderRadius: 20,
        width: '100%',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        animation: 'fadeInUp 0.2s ease-out'
      }}
    >
        {/* Header with App Branding */}
        <div style={{
          background: 'linear-gradient(135deg, #0a1636 0%, #1e40af 100%)',
          padding: '24px 24px 20px',
          color: '#ffffff',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            aria-label="Close install dialog"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src="/icons/icon-192.png"
              alt="App Icon"
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                border: '1.5px solid rgba(255,255,255,0.3)'
              }}
            />
            <div>
              <h2 id="install-app-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#fff' }}>
                Install Precise Quote App
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#bae6fd' }}>
                iOS & Android • No App Store or Play Store account required
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '4px 8px 0'
        }}>
          <button
            onClick={() => setActiveTab('ios')}
            style={{
              flex: 1,
              padding: '12px 10px',
              border: 'none',
              borderBottom: activeTab === 'ios' ? '2.5px solid #1a56ff' : '2.5px solid transparent',
              background: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === 'ios' ? '#1a56ff' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7
            }}
          >
            <Apple size={18} /> iPhone & iPad (iOS)
          </button>
          <button
            onClick={() => setActiveTab('android')}
            style={{
              flex: 1,
              padding: '12px 10px',
              border: 'none',
              borderBottom: activeTab === 'android' ? '2.5px solid #1a56ff' : '2.5px solid transparent',
              background: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: activeTab === 'android' ? '#1a56ff' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7
            }}
          >
            <Smartphone size={18} /> Android & Desktop
          </button>
        </div>

        {/* Tab Contents */}
        <div style={{ padding: '20px 24px 24px' }}>
          {isStandalone ? (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 12,
              padding: '16px',
              textAlign: 'center',
              color: '#065f46'
            }}>
              <Check size={28} style={{ margin: '0 auto 8px', display: 'block', color: '#059669' }} />
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Already Running in Standalone Mode!</div>
              <div style={{ fontSize: '0.82rem', marginTop: 4 }}>
                Precise Quote is already installed on your home screen or system.
              </div>
            </div>
          ) : activeTab === 'ios' ? (
            <div>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.78rem',
                color: '#166534',
                fontWeight: 600
              }}>
                <ShieldCheck size={20} style={{ flexShrink: 0, color: '#16a34a' }} />
                <span>Zero Store Registration: Installs via Apple Web Clips directly from Safari with full offline caching.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#1a56ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    flexShrink: 0
                  }}>1</div>
                  <div style={{ fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.5 }}>
                    Open <strong>precisequote.web.app</strong> in Apple <strong>Safari</strong> on your iPhone or iPad.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#1a56ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    flexShrink: 0
                  }}>2</div>
                  <div style={{ fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.5 }}>
                    Tap the <strong>Share</strong> button at the bottom of Safari <span style={{ display: 'inline-flex', verticalAlign: 'middle', background: '#e2e8f0', padding: '2px 6px', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem' }}><Share2 size={13} style={{ marginRight: 3 }} /> Share</span>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#1a56ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    flexShrink: 0
                  }}>3</div>
                  <div style={{ fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.5 }}>
                    Scroll down and select <strong>"Add to Home Screen"</strong> <span style={{ display: 'inline-flex', verticalAlign: 'middle', background: '#e2e8f0', padding: '2px 6px', borderRadius: 6, fontWeight: 700, fontSize: '0.75rem' }}><PlusSquare size={13} style={{ marginRight: 3 }} /> Add to Home Screen</span>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#1a56ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    flexShrink: 0
                  }}>4</div>
                  <div style={{ fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.5 }}>
                    Tap <strong>"Add"</strong> in the top-right corner. The <strong>Precise Quote</strong> app icon will now appear on your home screen and run standalone!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.78rem',
                color: '#166534',
                fontWeight: 600
              }}>
                <ShieldCheck size={20} style={{ flexShrink: 0, color: '#16a34a' }} />
                <span>Zero Google Play registration needed: Installs directly as a standalone WebAPK application or desktop app.</span>
              </div>

              {deferredPrompt ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: 16 }}>
                    Your browser is ready to install the Precise Quote native app right now with 1 tap:
                  </p>
                  <button
                    onClick={handleAndroidInstallClick}
                    style={{
                      background: '#1a56ff',
                      color: '#fff',
                      border: 'none',
                      padding: '14px 28px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(26, 86, 255, 0.35)',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <Download size={18} /> Install App Directly (1 Tap)
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#1a56ff',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      flexShrink: 0
                    }}>1</div>
                    <div style={{ fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.5 }}>
                      In Google Chrome / Samsung Internet, tap the <strong>three dots (⋮)</strong> menu in the top right.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#1a56ff',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      flexShrink: 0
                    }}>2</div>
                    <div style={{ fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.5 }}>
                      Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#1a56ff',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      flexShrink: 0
                    }}>3</div>
                    <div style={{ fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.5 }}>
                      Confirm by tapping <strong>"Install"</strong>. Android will create an app drawer icon that behaves like a native APK.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {installedSuccess && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              background: '#ecfdf5',
              borderRadius: 8,
              color: '#065f46',
              fontSize: '0.82rem',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              ✓ Installation started! Check your phone home screen.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '12px 24px 16px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Works offline • Instant auto-updates • Zero storage bloat
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              background: '#e2e8f0',
              border: 'none',
              borderRadius: 6,
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </Modal>
  );
}

// Subtle non-intrusive floating banner for mobile visitors
export function InstallAppBanner({ onOpenModal }) {
  const { isStandalone } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- one-time sessionStorage probe on mount */
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('pq_install_banner_dismissed');
    if (isDismissed) setDismissed(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isStandalone || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pq_install_banner_dismissed', 'true');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(var(--bottom-nav-height, 60px) + 12px)',
      left: 12,
      right: 12,
      background: 'linear-gradient(135deg, #0a1636 0%, #1a367c 100%)',
      color: '#fff',
      borderRadius: 14,
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      zIndex: 8888,
      border: '1px solid rgba(255,255,255,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <img
          src="/icons/icon-192.png"
          alt="App Icon"
          style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Install Precise Quote App
          </div>
          <div style={{ fontSize: '0.68rem', color: '#bae6fd' }}>
            Add to home screen for fast 1-tap access
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          onClick={onOpenModal}
          style={{
            background: '#1a56ff',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: '0.74rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(26, 86, 255, 0.4)'
          }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
