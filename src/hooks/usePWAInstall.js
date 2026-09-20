import { useEffect, useState } from 'react';

// Global listener for beforeinstallprompt
let globalDeferredPrompt = null;
const installListeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    installListeners.forEach((listener) => listener(e));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    installListeners.forEach((listener) => listener(null));
  });
}

/** Tracks PWA install eligibility (beforeinstallprompt) and standalone state. */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
  const [isStandalone, setIsStandalone] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- one-time browser-state probe on mount */
  useEffect(() => {
    // Check if running in standalone mode
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(Boolean(checkStandalone));

    const handlePrompt = (prompt) => {
      setDeferredPrompt(prompt);
    };

    installListeners.add(handlePrompt);
    return () => installListeners.delete(handlePrompt);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const triggerNativePrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
      }
      return outcome;
    }
    return null;
  };

  return {
    deferredPrompt,
    isStandalone,
    triggerNativePrompt,
    canInstallNative: Boolean(deferredPrompt),
  };
}
