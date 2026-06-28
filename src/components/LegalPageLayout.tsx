import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import mjwLogo from "@/assets/mjw-logo.png";

const LegalPageLayout = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <img src={mjwLogo} alt="Ledgera" className="h-6 w-6" />
            <span className="text-sm font-bold tracking-tight">Ledgera</span>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground [&_h2]:text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:text-sm [&_ul]:space-y-1 [&_li]:text-sm">
          {children}
        </div>
      </div>
      <footer className="border-t border-border bg-card py-6">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mb-4">
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy Policy</button>
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms of Service</button>
            <button onClick={() => navigate("/data-protection")} className="hover:text-foreground transition-colors">Data Policy</button>
            <button onClick={() => navigate("/security")} className="hover:text-foreground transition-colors">Security</button>
            <a href="mailto:ledgera@mjwgroup.co.za" className="hover:text-foreground transition-colors">Contact Us</a>
          </div>
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Ledgera is part of MJW Group · © {new Date().getFullYear()} MJW Group. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LegalPageLayout;
