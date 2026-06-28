import { useState, useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import mjwLogo from "@/assets/mjw-logo.png";
import { Lock, Shield, ArrowRight, CheckCircle, Clock, XCircle } from "lucide-react";

type AccessStatus = 'pending' | 'approved' | 'rejected' | null;

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register' | 'access'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Check access status after login
  useEffect(() => {
    if (user && !loading) {
      checkAccessStatus();
    }
  }, [user, loading]);

  const checkAccessStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("access_status")
      .eq("user_id", user.id)
      .single();
    
    const status = (data as any)?.access_status as AccessStatus;
    setAccessStatus(status);
    
    if (status === 'approved') {
      // Allow through
    } else if (status === 'pending') {
      setMode('access');
    } else if (status === 'rejected') {
      setMode('access');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0D1B2A' }}>
        <div className="flex items-center gap-3">
          <img src={mjwLogo} alt="Ledgera" className="h-10 w-10 animate-pulse" />
          <p className="text-sm text-white/50 font-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && accessStatus === 'approved') return <Navigate to="/app" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (!agreedTerms) {
      toast({ title: "Please agree to the Terms and Privacy Policy", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      setRegistrationComplete(true);
    }
    setSubmitting(false);
  };

  const handleAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    
    // Hash the code and compare
    const encoder = new TextEncoder();
    const data = encoder.encode(accessCode.trim().toUpperCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_code_hash, access_code_expires_at")
      .eq("user_id", user.id)
      .single();
    
    const p = profile as any;
    if (p?.access_code_hash === hashHex) {
      if (p.access_code_expires_at && new Date(p.access_code_expires_at) < new Date()) {
        toast({ title: "Code expired", description: "Your access code has expired. Please contact support.", variant: "destructive" });
      } else {
        await supabase
          .from("profiles")
          .update({ access_status: 'approved', access_code_hash: null, access_code_expires_at: null } as any)
          .eq("user_id", user.id);
        setAccessStatus('approved');
        navigate("/app");
      }
    } else {
      toast({ title: "Invalid code", description: "The access code is incorrect.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  // Registration complete screen
  if (registrationComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: '#0D1B2A' }}>
        <Card className="w-full max-w-sm border-border shadow-xl">
          <CardContent className="pt-8 pb-6 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-success" />
            <h2 className="text-lg font-bold font-display mb-2">Request Received</h2>
            <p className="text-sm text-muted-foreground font-body mb-1">
              We'll review your application and send your access instructions to
            </p>
            <p className="text-sm font-semibold font-body mb-4">{email}</p>
            <p className="text-xs text-muted-foreground font-body">
              Please check your email to verify your account in the meantime.
            </p>
            <Button className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-body" onClick={() => { setRegistrationComplete(false); setMode('login'); }}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access status screens (pending / rejected)
  if (mode === 'access' && user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: '#0D1B2A' }}>
        <Card className="w-full max-w-sm border-border shadow-xl">
          <CardContent className="pt-8 pb-6">
            <div className="text-center mb-6">
              <img src={mjwLogo} alt="Ledgera" className="mx-auto h-12 w-12 mb-3" />
            </div>
            
            {accessStatus === 'pending' && (
              <div className="text-center">
                <Clock className="mx-auto mb-3 h-10 w-10 text-accent" />
                <h2 className="text-lg font-bold font-display mb-2">Access Under Review</h2>
                <p className="text-sm text-muted-foreground font-body mb-4">
                  Your access request is under review. You'll receive an email when approved.
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  If you have an access code, enter it below.
                </p>
                <form onSubmit={handleAccessCode} className="mt-4 space-y-3">
                  <Input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter access code"
                    className="text-center font-mono tracking-widest h-11 uppercase"
                    maxLength={8}
                  />
                  <Button type="submit" disabled={submitting || !accessCode.trim()} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-body">
                    {submitting ? "Verifying…" : "Activate Account"}
                  </Button>
                </form>
              </div>
            )}

            {accessStatus === 'rejected' && (
              <div className="text-center">
                <XCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
                <h2 className="text-lg font-bold font-display mb-2">Access Not Approved</h2>
                <p className="text-sm text-muted-foreground font-body">
                  Your access request was not approved. Contact <span className="font-semibold">support@mjwgroup.co.za</span> for assistance.
                </p>
              </div>
            )}

            <Button variant="ghost" className="w-full mt-4 text-xs text-muted-foreground font-body" onClick={() => { supabase.auth.signOut(); setMode('login'); setAccessStatus(null); }}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — dark navy branding */}
      <div className="hidden w-1/2 flex-col justify-between lg:flex" style={{ background: '#0D1B2A' }}>
        <div className="p-10">
          <div className="flex items-center gap-3">
            <img src={mjwLogo} alt="Ledgera" className="h-11 w-11" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight font-body">Ledgera</span>
              <span className="text-[10px] text-white/30 font-body">by MJW Group</span>
            </div>
          </div>
        </div>

        {/* Large centred logo */}
        <div className="flex flex-1 flex-col items-center justify-center px-10">
          <img src={mjwLogo} alt="Ledgera" className="h-40 w-40 mb-8 drop-shadow-2xl" />
          <h1 className="mb-4 text-3xl font-bold text-white leading-tight font-display text-center">
            Accounting & Tax<br />Operations Platform
          </h1>
          <p className="mb-8 max-w-md text-sm text-white/40 leading-relaxed font-body text-center">
            SARS-aligned bookkeeping, VAT tracking, income tax monitoring, and audit-ready exports for South African sole proprietors and owner-managed businesses.
          </p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-xs text-white/50 font-body">Audit-Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" />
              <span className="text-xs text-white/50 font-body">SARS-Aligned</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 px-10 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-white/20 font-body">
              MJW Business Solutions (Pty) Ltd · Reg: 2020/924581/07
            </p>
            <div className="flex gap-4">
              <button onClick={() => navigate('/privacy')} className="text-[11px] text-white/25 hover:text-white/50 transition-colors font-body">Privacy</button>
              <button onClick={() => navigate('/terms')} className="text-[11px] text-white/25 hover:text-white/50 transition-colors font-body">Terms</button>
              <button onClick={() => navigate('/data-protection')} className="text-[11px] text-white/25 hover:text-white/50 transition-colors font-body">Data Protection</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <img src={mjwLogo} alt="Ledgera" className="h-24 w-24 mb-2" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground font-body">Ledgera</span>
              <span className="text-[10px] text-muted-foreground font-body">by MJW Group</span>
            </div>
          </div>

          <Card className="w-full max-w-sm border-border shadow-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-display font-bold">
                {mode === 'login' ? 'Sign In' : 'Request Access'}
              </CardTitle>
              <CardDescription className="font-body text-sm">
                {mode === 'login'
                  ? "Access your accounting workspace"
                  : "Create your Ledgera account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium font-body">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium font-body">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-10" />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold">
                    {submitting ? "Please wait…" : "Access Ledgera"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium font-body">Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Josh Stone" required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium font-body">Email Address</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium font-body">Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium font-body">Confirm Password</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-10" />
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(c) => setAgreedTerms(c === true)} className="mt-0.5" />
                    <label htmlFor="terms" className="text-xs text-muted-foreground font-body leading-relaxed cursor-pointer">
                      I agree to the <button type="button" onClick={() => navigate('/terms')} className="text-secondary hover:underline">Terms of Service</button> and <button type="button" onClick={() => navigate('/privacy')} className="text-secondary hover:underline">Privacy Policy</button>
                    </label>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold">
                    {submitting ? "Please wait…" : "Request Access"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground font-body">
                    Access is granted by approval. You will receive a confirmation once your account is reviewed.
                  </p>
                </form>
              )}

              <div className="mt-4 flex items-center justify-between text-xs font-body">
                <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-medium text-secondary hover:underline">
                  {mode === 'login' ? 'Request Access' : 'Sign In Instead'}
                </button>
                {mode === 'login' && (
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" onClick={async () => {
                    if (!email) { toast({ title: "Enter your email first", variant: "destructive" }); return; }
                    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                    else toast({ title: "Reset email sent", description: "Check your inbox for a password reset link." });
                  }}>
                    Forgot Password
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer links on right panel */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground font-body">
            <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">Terms of Service</button>
            <button onClick={() => navigate('/data-protection')} className="hover:text-foreground transition-colors">Data Protection</button>
            <a href="mailto:support@mjwgroup.co.za" className="hover:text-foreground transition-colors">Contact Us</a>
          </div>
        </div>

        <div className="border-t border-border px-6 py-3 text-center lg:hidden">
          <p className="text-[10px] text-muted-foreground font-body">
            MJW Business Solutions (Pty) Ltd · Reg: 2020/924581/07
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
