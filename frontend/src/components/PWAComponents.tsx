"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstaller() {
  const [isStandalone] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(display-mode: standalone)").matches
      : false
  );
  const [isIOS] = useState(() =>
    typeof window !== "undefined"
      ? /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as Record<string, unknown>).MSStream
      : false
  );
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    }

    // Listen for beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;
      beforeInstallPromptEvent.preventDefault();
      setDeferredPrompt(beforeInstallPromptEvent);

      // Show modal after a short delay to avoid interrupting user
      setTimeout(() => {
        if (!isStandalone) {
          setShowModal(true);
        }
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowModal(false);
      }
    }
  };

  // Don't show anything if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📱 Install Bill Splitter
          </DialogTitle>
          <DialogDescription>
            Install this app for a better experience and quick access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Chrome/Edge Install Button */}
          {deferredPrompt && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Get native app experience with offline support!
              </p>
              <button
                type="button"
                onClick={handleInstall}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Install App
              </button>
            </div>
          )}

          {/* iOS Instructions */}
          {isIOS && !deferredPrompt && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                To install on iOS:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                    1
                  </span>
                  Tap the share button{" "}
                  <span role="img" aria-label="share icon" className="text-lg">
                    ⎋
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  Select &quot;Add to Home Screen&quot;{" "}
                  <span role="img" aria-label="plus icon" className="text-lg">
                    ➕
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* Generic instructions for other browsers */}
          {!deferredPrompt && !isIOS && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Look for &quot;Install&quot; or &quot;Add to Home Screen&quot;
                option in your browser menu.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Maybe Later
            </button>
            {!deferredPrompt && (
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Got It
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PWAStatus() {
  const [, setIsOnline] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineModal(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineModal(true);
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <Dialog open={showOfflineModal} onOpenChange={setShowOfflineModal}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔌 You&apos;re offline
          </DialogTitle>
          <DialogDescription>
            Your internet connection has been lost. Some features may be limited
            while offline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-1">
                <h4 className="text-sm font-medium text-yellow-800">
                  What you can still do:
                </h4>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>View and edit current bill data</li>
                  <li>Add new items and assign people</li>
                  <li>Calculate totals and splits</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowOfflineModal(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue Offline
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
