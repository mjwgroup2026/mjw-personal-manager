import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Smartphone, Monitor, CheckCircle, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import mjwLogo from "@/assets/mjw-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "#0D1B2A" }}>
      <div className="w-full max-w-md text-center">
        <img src={mjwLogo} alt="Ledgera" className="h-20 w-20 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white font-display tracking-wide mb-2">
          Install Ledgera
        </h1>
        <p className="text-sm text-white/40 font-body mb-8">
          Add Ledgera to your home screen for quick access — works like a native app.
        </p>

        {isInstalled ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 mb-6">
            <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-green-300 font-body">Ledgera is installed!</p>
            <p className="text-xs text-white/40 font-body mt-1">Open it from your home screen.</p>
          </div>
        ) : deferredPrompt ? (
          <Button
            onClick={handleInstall}
            size="lg"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold h-14 text-base mb-6"
          >
            <Download className="mr-2 h-5 w-5" />
            Install App
          </Button>
        ) : isIOS ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6 text-left">
            <p className="text-sm font-semibold text-white font-body mb-4">To install on iPhone / iPad:</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">1</div>
                <div>
                  <p className="text-sm text-white/70 font-body">
                    Tap the <Share className="inline h-4 w-4 text-accent" /> <span className="text-accent font-semibold">Share</span> button in Safari
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">2</div>
                <p className="text-sm text-white/70 font-body">
                  Scroll down and tap <span className="text-accent font-semibold">"Add to Home Screen"</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">3</div>
                <p className="text-sm text-white/70 font-body">
                  Tap <span className="text-accent font-semibold">"Add"</span> to confirm
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6 text-left">
            <p className="text-sm font-semibold text-white font-body mb-4">To install on Android:</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">1</div>
                <p className="text-sm text-white/70 font-body">
                  Tap the <MoreVertical className="inline h-4 w-4 text-accent" /> <span className="text-accent font-semibold">menu</span> in Chrome
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold">2</div>
                <p className="text-sm text-white/70 font-body">
                  Tap <span className="text-accent font-semibold">"Install app"</span> or <span className="text-accent font-semibold">"Add to Home Screen"</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Smartphone, label: "Works offline" },
            { icon: Download, label: "No app store" },
            { icon: Monitor, label: "Full features" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <Icon className="h-5 w-5 text-accent mx-auto mb-1.5" />
              <p className="text-[10px] text-white/40 font-body">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white font-body"
          >
            Continue to Sign In
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-white/30 hover:text-white/60 hover:bg-transparent font-body text-xs"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
