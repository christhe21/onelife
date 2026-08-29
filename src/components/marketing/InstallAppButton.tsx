import { useEffect, useState } from "react";
import { Check, Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Install-to-home-screen button.
 * - Uses the native install prompt when Chrome/Edge fire `beforeinstallprompt`.
 * - Otherwise shows manual instructions (iOS Share sheet, browser menu).
 * - Renders a subtle "Installed" state when already running as an app.
 */
export function InstallAppButton({
  className,
  size = "lg",
}: {
  className?: string;
  size?: "sm" | "lg";
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-primary" /> App installed
      </span>
    );
  }

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowHelp((v) => !v);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      <Button
        type="button"
        size={size}
        variant="outline"
        onClick={handleClick}
        className={className ?? "h-12 rounded-full px-7"}
      >
        <Download className="mr-2 h-4 w-4" /> Install app
      </Button>
      {showHelp && (
        <div className="absolute top-full z-10 mt-2 w-64 rounded-xl border border-border bg-card p-4 text-left text-xs leading-relaxed text-muted-foreground shadow-lg">
          {isIOS() ? (
            <p className="flex items-start gap-2">
              <Share className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <span>
                In Safari, tap the <strong className="text-foreground">Share</strong> button, then
                choose <strong className="text-foreground">Add to Home Screen</strong>.
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-2">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <span>
                Open your browser menu (<strong className="text-foreground">⋮</strong>) and choose{" "}
                <strong className="text-foreground">Add to Home screen</strong> or{" "}
                <strong className="text-foreground">Install app</strong>. On desktop Chrome, use the
                install icon in the address bar.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
