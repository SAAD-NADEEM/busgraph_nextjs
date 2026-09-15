"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";

// Extend the global window types for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Hide button if app is already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsVisible(false);
    }

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }

    setDeferredPrompt(null);
    setIsInstalling(false);
  }, [deferredPrompt]);

  if (!isVisible) return null;

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      aria-label="Install Bus Graph app"
      title="Install App"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 50,
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: "none",
        background: "oklch(0.555 0.163 48.998)",
        color: "oklch(0.987 0.022 95.277)",
        cursor: isInstalling ? "wait" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        opacity: isInstalling ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(0, 0, 0, 0.25)";
      }}
    >
      <Download size={22} strokeWidth={2.5} />
    </button>
  );
}
