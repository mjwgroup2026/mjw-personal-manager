import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { sendSentraWebhook } from "@/lib/sentra-webhook";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, CheckCircle, AlertTriangle, Clock, RefreshCw, Ticket,
  Zap, Building2, Crown,
} from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "R 149",
    cycle: "/month",
    icon: Zap,
    features: [
      "1 Entity",
      "Transaction tracking",
      "Expense categorisation",
      "Document uploads",
      "Basic reports",
    ],
  },
  {
    name: "Professional",
    price: "R 299",
    cycle: "/month",
    icon: Building2,
    popular: true,
    features: [
      "Up to 5 Entities",
      "VAT management & VAT201",
      "Income tax preparation",
      "Invoice generation",
      "CSV imports",
      "Audit trail & period locking",
      "Accountant handover packs",
    ],
  },
  {
    name: "Enterprise",
    price: "R 499",
    cycle: "/month",
    icon: Crown,
    features: [
      "Unlimited Entities",
      "All Professional features",
      "Vehicle & property schedules",
      "Budget tracking",
      "Priority support",
      "Custom branding on invoices",
    ],
  },
];

const Subscription = () => {
  const { user } = useAuth();
  const { state, plan, expiresAt, trialDaysRemaining, loading, refetch } = useSubscription();
  const { toast } = useToast();
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: "Active", color: "text-success border-success/30 bg-success/10", icon: CheckCircle },
    trial: { label: "Trial", color: "text-secondary border-secondary/30 bg-secondary/10", icon: Clock },
    expired: { label: "Expired", color: "text-destructive border-destructive/30 bg-destructive/10", icon: AlertTriangle },
    cancelled: { label: "Cancelled", color: "text-muted-foreground border-border", icon: AlertTriangle },
    grace: { label: "Grace Period", color: "text-warning border-warning/30 bg-warning/10", icon: Clock },
    none: { label: "No Plan", color: "text-muted-foreground border-border", icon: AlertTriangle },
  };

  const config = statusConfig[state] ?? statusConfig.active;
  const StatusIcon = config.icon;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !redeemCode.trim()) return;
    setRedeeming(true);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/validate-redeem-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({
            code: redeemCode.trim().toUpperCase(),
            user_id: user.id,
            platform: "ledgera",
          }),
        }
      );

      const data = await res.json();

      if (data.valid) {
        toast({
          title: "Code Redeemed!",
          description: `Your ${data.plan} plan is now active until ${new Date(data.expires_at).toLocaleDateString("en-ZA")}.`,
        });
        setRedeemCode("");
        refetch();
      } else {
        toast({
          title: "Invalid Code",
          description: data.error || "The redeem code is invalid or has already been used.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Could not validate the redeem code. Please try again.",
        variant: "destructive",
      });
    }

    setRedeeming(false);
  };

  const handleCancel = async () => {
    if (!user) return;
    setCancelling(true);

    const { error } = await supabase
      .from("subscription_status")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      sendSentraWebhook("SUBSCRIPTION_CANCELLED", user.id, plan);
      toast({ title: "Subscription cancelled", description: "You'll retain access until your current period ends." });
      refetch();
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground font-body">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight font-display">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground font-body">Manage your Ledgera subscription</p>
      </div>

      <div className="space-y-6">
        {/* Trial Banner */}
        {state === "trial" && trialDaysRemaining !== null && (
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-secondary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground font-body">
                Trial ends in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Subscribe or enter a redeem code before your trial expires to keep full access.
              </p>
            </div>
          </div>
        )}

        {/* Expired / None Banner */}
        {(state === "expired" || state === "none") && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground font-body">
                {state === "expired" ? "Your trial or subscription has expired" : "No active subscription"}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Subscribe or enter a redeem code to regain full access.
              </p>
            </div>
          </div>
        )}

        {/* Current Plan */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-bold font-body">Current Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold font-body capitalize">{plan}</p>
                <p className="text-xs text-muted-foreground font-body">Ledgera accounting platform access</p>
              </div>
              <Badge className={`gap-1.5 ${config.color}`}>
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-body">Status</span>
                <span className="text-sm font-medium font-body capitalize">{state}</span>
              </div>
              {expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-body">
                    {state === "trial" ? "Trial Ends" : "Renewal Date"}
                  </span>
                  <span className="text-sm font-body">{new Date(expiresAt).toLocaleDateString("en-ZA")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Redeem Code */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-bold font-body">Redeem Code</CardTitle>
            </div>
            <CardDescription className="text-xs font-body">
              Enter a redeem code to activate or extend your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="flex gap-2">
              <Input
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="Enter redeem code"
                className="font-mono tracking-widest uppercase h-10"
                maxLength={20}
              />
              <Button
                type="submit"
                disabled={redeeming || !redeemCode.trim()}
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold h-10 px-6 shrink-0"
              >
                {redeeming ? "Validating…" : "Redeem"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Plans */}
        <div>
          <h2 className="text-lg font-bold font-display mb-4">Subscription Plans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.name} className={p.popular ? "border-accent/50 shadow-lg relative" : ""}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground text-[10px] font-body">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-2 pt-5">
                  <div className="flex items-center gap-2">
                    <p.icon className="h-5 w-5 text-accent" />
                    <CardTitle className="text-base font-bold font-body">{p.name}</CardTitle>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-display">{p.price}</span>
                    <span className="text-sm text-muted-foreground font-body">{p.cycle}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs font-body text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={p.popular ? "default" : "outline"}
                    className={`w-full mt-4 text-xs font-body font-semibold ${p.popular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                  >
                    Sign Up
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cancel */}
        {(state === "active" || state === "trial") && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-secondary" />
                <CardTitle className="text-sm font-bold font-body">Manage Subscription</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground font-body mb-3">
                  To cancel your subscription, click below. You'll retain access until the end of your current period.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-body text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling…" : "Cancel Subscription"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Info */}
        <Card>
          <CardContent className="py-5">
            <div className="text-xs text-muted-foreground font-body space-y-2">
              <p>Ledgera subscriptions are processed through app store billing or redeem codes issued by MJW Group. MJW Business Solutions (Pty) Ltd does not directly process payment card information.</p>
              <p>For billing enquiries, contact <a href="mailto:ledgera@mjwgroup.co.za" className="text-secondary hover:underline">ledgera@mjwgroup.co.za</a>.</p>
              <p>Subscription terms are governed by the <a href="/terms" className="text-secondary hover:underline">Terms of Service</a>.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
