import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  userId: string;
  userEmail: string;
  onAccepted: () => void;
}

const POLICY_VERSION = "1.0";

const ComplianceConsentModal = ({ open, userId, userEmail, onAccepted }: Props) => {
  const { toast } = useToast();
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allChecked = termsChecked && privacyChecked && dataChecked;

  const handleAccept = async () => {
    setSubmitting(true);

    // Get IP address (best effort)
    let ipAddress = "unknown";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      ipAddress = data.ip;
    } catch {
      // fallback
    }

    const { error } = await supabase.from("compliance_consents").insert({
      user_id: userId,
      user_email: userEmail,
      policy_version: POLICY_VERSION,
      consent_status: "accepted",
      ip_address: ipAddress,
    } as any);

    if (error) {
      toast({ title: "Error recording consent", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    onAccepted();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-lg font-display">Compliance Consent</DialogTitle>
          <DialogDescription className="text-sm font-body">
            Please review and accept the following policies before continuing.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-2">
          <div className="space-y-4 py-2">
            {/* Terms */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold font-body">Terms and Conditions</h3>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-3">
                By using Ledgera, you agree to abide by the Terms of Service governing account usage, data ownership, liability limitations, and acceptable use of the platform.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox id="terms" checked={termsChecked} onCheckedChange={(c) => setTermsChecked(c === true)} />
                <label htmlFor="terms" className="text-xs font-body cursor-pointer">
                  I accept the <a href="/terms" target="_blank" className="text-secondary hover:underline">Terms and Conditions</a>
                </label>
              </div>
            </div>

            {/* Privacy */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold font-body">Privacy Policy</h3>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-3">
                We collect and process personal information in accordance with POPIA. This includes your email, name, financial records, and usage data necessary to provide accounting services.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox id="privacy" checked={privacyChecked} onCheckedChange={(c) => setPrivacyChecked(c === true)} />
                <label htmlFor="privacy" className="text-xs font-body cursor-pointer">
                  I accept the <a href="/privacy" target="_blank" className="text-secondary hover:underline">Privacy Policy</a>
                </label>
              </div>
            </div>

            {/* Data Processing */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold font-body">Data Processing Policy</h3>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-3">
                Your financial data is processed and stored to deliver bookkeeping, VAT, and tax preparation services. Data is encrypted at rest and in transit, and retained in accordance with SARS and POPIA requirements.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox id="data" checked={dataChecked} onCheckedChange={(c) => setDataChecked(c === true)} />
                <label htmlFor="data" className="text-xs font-body cursor-pointer">
                  I accept the <a href="/data-protection" target="_blank" className="text-secondary hover:underline">Data Processing Policy</a>
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="pt-2">
          <p className="text-[11px] text-muted-foreground font-body mb-3">
            Version {POLICY_VERSION} · Your consent will be recorded with timestamp and IP address for legal audit purposes.
          </p>
          <Button
            onClick={handleAccept}
            disabled={!allChecked || submitting}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold"
          >
            {submitting ? "Recording…" : "Accept & Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceConsentModal;
