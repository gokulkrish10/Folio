"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWARegistration() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The app remains fully usable when service workers are unavailable.
      });
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!installEvent || dismissed) return null;

  const install = async () => {
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#1d1b18] p-3 text-sm text-white shadow-2xl">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-[#1d1b18]">
        <Download size={19} />
      </div>
      <p className="min-w-0 flex-1">
        Add Folio to your home screen for offline reading.
      </p>
      <button
        type="button"
        onClick={install}
        className="min-h-11 rounded-xl bg-white px-3 font-semibold text-[#1d1b18]"
      >
        Install
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="grid size-11 place-items-center"
        aria-label="Dismiss install prompt"
      >
        <X size={18} />
      </button>
    </div>
  );
}
