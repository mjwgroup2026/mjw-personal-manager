import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Lock } from "lucide-react";
import mjwLogo from "@/assets/mjw-logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if the user arrived via a recovery link (Supabase sets session automatically)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
      setChecking(false);
    };

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(true);
        setChecking(false);
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0D1B2A' }}>
        <p className="text-sm text-white/50 font-body">Verifying…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: '#0D1B2A' }}>
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 pb-6 text-center">
            <Lock className="mx-auto mb-4 h-10 w-10 text-destructive" />
            <h2 className="text-lg font-bold font-display mb-2">Invalid or Expired Link</h2>
            <p className="text-sm text-muted-foreground font-body mb-4">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button className="w-full" onClick={() => navigate("/auth")}>Back to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: '#0D1B2A' }}>
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 pb-6 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-success" />
            <h2 className="text-lg font-bold font-display mb-2">Password Updated</h2>
            <p className="text-sm text-muted-foreground font-body mb-4">Your password has been reset successfully.</p>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/app")}>
              Continue to Ledgera
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: '#0D1B2A' }}>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <img src={mjwLogo} alt="Ledgera — MJW Personal Manager" className="mx-auto h-12 w-12 mb-3" />
          <CardTitle className="text-xl font-display">Set New Password</CardTitle>
          <CardDescription className="font-body text-sm">Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-body">New Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-body">Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-10" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-body">
              {submitting ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
