"use client";

import { useEffect, useState } from "react";

export function PWAInstaller() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if running as PWA
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Check if iOS
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    }

    // Listen for beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  };

  // Don't show install prompt if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Install Bill Splitter
          </h3>
          <div className="mt-1 text-sm text-blue-700">
            <p className="mb-2">
              Install this app for a better experience and quick access.
            </p>

            {/* Chrome/Edge Install Button */}
            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Install App
              </button>
            )}

            {/* iOS Instructions */}
            {isIOS && !deferredPrompt && (
              <div className="mt-2">
                <p className="text-sm">
                  To install on iOS: Tap the share button{" "}
                  <span role="img" aria-label="share icon">
                    ⎋
                  </span>{" "}
                  and select "Add to Home Screen"{" "}
                  <span role="img" aria-label="plus icon">
                    ➕
                  </span>
                </p>
              </div>
            )}

            {/* Generic instructions for other browsers */}
            {!deferredPrompt && !isIOS && (
              <div className="mt-2">
                <p className="text-sm">
                  Look for "Install" or "Add to Home Screen" option in your
                  browser menu.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            You're offline
          </h3>
          <div className="mt-1 text-sm text-yellow-700">
            <p>Some features may be limited while offline.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
