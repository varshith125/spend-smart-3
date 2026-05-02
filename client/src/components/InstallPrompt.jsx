import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  useEffect(() => {
    // Already installed — don't show prompt
    if (isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Check if already dismissed recently
    const dismissedAt = localStorage.getItem('pwa_dismissed');
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < 7 * 24 * 60 * 60 * 1000) { // 7 days
        setDismissed(true);
        return;
      }
    }

    // Android: capture install event
    const handler = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isInStandaloneMode]);

  const handleInstall = async () => {
    if (installEvent) {
      installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === 'accepted') {
        setInstallEvent(null);
        setIsInstalled(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_dismissed', Date.now().toString());
    setDismissed(true);
    setShowIOSGuide(false);
  };

  // Don't show if already installed, dismissed, or not eligible
  if (isInstalled || dismissed) return null;
  if (!installEvent && !isIOS) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-slide-up">
        <div className="glass border border-violet-500/30 rounded-2xl p-4 shadow-2xl shadow-violet-900/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Install SpendSmart</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {isIOS
                  ? 'Add to your home screen for quick access'
                  : 'Install as an app on your device'}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isIOS ? 'How to install' : 'Install'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-slate-400 hover:text-white text-xs rounded-lg transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="glass border border-violet-500/30 rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-white text-lg">Install on iPhone</h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { step: '1', icon: '📤', text: 'Tap the Share button at the bottom of your browser' },
                { step: '2', icon: '📋', text: 'Scroll down and tap "Add to Home Screen"' },
                { step: '3', icon: '✅', text: 'Tap "Add" — SpendSmart appears on your home screen!' },
              ].map(({ step, icon, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-lg">
                    {icon}
                  </div>
                  <p className="text-sm text-slate-300 pt-1">{text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowIOSGuide(false); handleDismiss(); }}
              className="w-full mt-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
