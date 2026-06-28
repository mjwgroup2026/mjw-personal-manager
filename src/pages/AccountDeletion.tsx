import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";

const AccountDeletion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [existing, setExisting] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("deletion_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setExisting(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("deletion_requests").insert({
      user_id: user.id,
      reason: reason.trim() || null,
      status: "pending",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deletion request submitted", description: "We will process your request." });
      setExisting({ status: "pending", requested_at: new Date().toISOString(), reason });
      setConfirmStep(false);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground font-body">Loading…</p>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Pending Review", color: "text-warning border-warning/30 bg-warning/10", icon: Clock },
    processing: { label: "Processing", color: "text-secondary border-secondary/30 bg-secondary/10", icon: Clock },
    completed: { label: "Completed", color: "text-success border-success/30 bg-success/10", icon: CheckCircle },
    rejected: { label: "Rejected", color: "text-destructive border-destructive/30 bg-destructive/10", icon: AlertTriangle },
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight font-display">Account Deletion</h1>
        <p className="text-sm text-muted-foreground font-body">Request deletion of your account and associated data</p>
      </div>

      <div className="space-y-5">
        {/* Existing request status */}
        {existing && (
          <Card className="border-warning/20">
            <CardContent className="py-5">
              <div className="flex items-start gap-3">
                {(() => { const cfg = statusConfig[existing.status] ?? statusConfig.pending; const Icon = cfg.icon; return <Icon className="h-5 w-5 text-warning mt-0.5 shrink-0" />; })()}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold font-body">Deletion Request</p>
                    <Badge className={`text-[10px] ${(statusConfig[existing.status] ?? statusConfig.pending).color}`}>
                      {(statusConfig[existing.status] ?? statusConfig.pending).label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    Submitted on {new Date(existing.requested_at).toLocaleDateString("en-ZA")}
                  </p>
                  {existing.reason && (
                    <p className="text-xs text-muted-foreground font-body mt-2">Reason: {existing.reason}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-secondary" />
              <CardTitle className="text-sm font-bold font-body">What happens when you delete your account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm text-muted-foreground font-body">
              <p>When your account deletion request is processed:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Your login credentials and profile will be removed</li>
                <li>Your entities, transactions, invoices, and documents will be scheduled for deletion</li>
                <li>Export your data before requesting deletion — this action cannot be undone</li>
              </ul>
            </div>

            <Separator />

            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
              <p className="text-xs text-muted-foreground font-body">
                <strong className="text-foreground">Retention exceptions:</strong> Certain records may be retained where required by law, including records needed for tax compliance (Tax Administration Act), audit trail integrity, fraud prevention, dispute resolution, or legal obligations. These retention requirements are described in our <a href="/privacy" className="text-secondary hover:underline">Privacy Policy</a> and <a href="/data-protection" className="text-secondary hover:underline">Data Policy</a>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Request form */}
        {!existing && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-bold font-body">Request Account Deletion</CardTitle>
              </div>
              <CardDescription className="text-xs font-body">
                This will submit a request to delete your account and all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!confirmStep ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium font-body">Reason (optional)</label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Let us know why you're leaving (optional)"
                      className="h-20 text-sm font-body"
                    />
                  </div>
                  <Button variant="destructive" className="w-full font-body" onClick={() => setConfirmStep(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Request Account Deletion
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-foreground font-body">Are you sure?</p>
                        <p className="text-xs text-muted-foreground font-body mt-1">
                          This action will submit a permanent deletion request. Your account and data will be removed after processing. This cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 font-body" onClick={() => setConfirmStep(false)}>Cancel</Button>
                    <Button variant="destructive" className="flex-1 font-body" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? "Submitting…" : "Confirm Deletion"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact */}
        <Card>
          <CardContent className="py-5">
            <div className="text-xs text-muted-foreground font-body space-y-1">
              <p>For questions about account deletion, contact:</p>
              <p><strong>Ledgera / MJW Group</strong></p>
              <p>Email: <a href="mailto:ledgera@mjwgroup.co.za" className="text-secondary hover:underline">ledgera@mjwgroup.co.za</a></p>
              <p>Tel: 021 180 4244</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountDeletion;
