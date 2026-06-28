import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import mjwLogo from "@/assets/mjw-logo.png";
import { ArrowRight, CheckCircle } from "lucide-react";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a1628' }}>
        <img src={mjwLogo} alt="Ledgera" className="h-10 w-10 animate-pulse" />
      </div>
    );
  }

  if (user) return <Navigate to="/app" replace />;

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

  if (registrationComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: '#0a1628' }}>
        <div className="w-full max-w-sm rounded-2xl border border-white/8 p-10 text-center" style={{ background: '#0f2040' }}>
          <CheckCircle className="mx-auto mb-4 h-12 w-12" style={{ color: '#C9A84C' }} />
          <h2 className="text-lg font-bold text-white font-body mb-2">Account Created</h2>
          <p className="text-sm text-white/50 font-body mb-4">
            Check your email to verify your account, then sign in.
          </p>
          <p className="text-sm font-semibold text-white/70 font-body mb-6">{email}</p>
          <button
            onClick={() => { setRegistrationComplete(false); setMode('login'); }}
            className="w-full py-3 rounded-lg font-semibold text-sm font-body transition-opacity hover:opacity-90"
            style={{ background: '#C9A84C', color: '#0a1628' }}
          >
            Go to Sign In
          </button>
        </div>
        <FooterLinks navigate={navigate} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: '#0a1628' }}>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-white/8 overflow-hidden" style={{ background: '#0f2040' }}>

        {/* Header — logo + name + tagline */}
        <div className="flex flex-col items-center pt-10 pb-6 px-8 text-center border-b border-white/6">
          <img src={mjwLogo} alt="Ledgera" className="h-16 w-16 mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-bold tracking-widest text-white font-body mb-0.5">LEDGERA</h1>
          <p className="text-[10px] tracking-[0.25em] font-semibold font-body mb-4" style={{ color: '#C9A84C' }}>
            FINANCIAL MANAGEMENT
          </p>
          <p className="text-xs text-white/35 font-body leading-relaxed">
            Audit-ready bookkeeping. SARS-aligned tax. Complete financial control.
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <p className="text-xs font-bold tracking-widest text-white/50 font-body mb-5 uppercase">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </p>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] tracking-widest font-semibold font-body uppercase text-white/40 block mb-1.5">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.co.za"
                  required
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#C9A84C] focus:ring-[#C9A84C]/20 font-body text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-widest font-semibold font-body uppercase text-white/40 block mb-1.5">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#C9A84C] focus:ring-[#C9A84C]/20 font-body text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg font-bold text-sm font-body tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                style={{ background: '#C9A84C', color: '#0a1628' }}
              >
                {submitting ? "Please wait…" : <>SIGN IN <ArrowRight className="h-4 w-4" /></>}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[11px] font-body hover:underline transition-colors"
                  style={{ color: '#C9A84C' }}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  className="text-[11px] font-body text-white/30 hover:text-white/60 transition-colors"
                  onClick={async () => {
                    if (!email) { toast({ title: "Enter your email first", variant: "destructive" }); return; }
                    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                    else toast({ title: "Reset email sent", description: "Check your inbox." });
                  }}
                >
                  Forgot Password
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-[10px] tracking-widest font-semibold font-body uppercase text-white/40 block mb-1.5">Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Mornay Walters" required className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#C9A84C] font-body text-sm" />
              </div>
              <div>
                <label className="text-[10px] tracking-widest font-semibold font-body uppercase text-white/40 block mb-1.5">Email Address</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.co.za" required className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#C9A84C] font-body text-sm" />
              </div>
              <div>
                <label className="text-[10px] tracking-widest font-semibold font-body uppercase text-white/40 block mb-1.5">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#C9A84C] font-body text-sm" />
              </div>
              <div>
                <label className="text-[10px] tracking-widest font-semibold font-body uppercase text-white/40 block mb-1.5">Confirm Password</label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#C9A84C] font-body text-sm" />
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="terms"
                  checked={agreedTerms}
                  onCheckedChange={(c) => setAgreedTerms(c === true)}
                  className="mt-0.5 border-white/20 data-[state=checked]:bg-[#C9A84C] data-[state=checked]:border-[#C9A84C]"
                />
                <label htmlFor="terms" className="text-[11px] text-white/35 font-body leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <button type="button" onClick={() => navigate('/terms')} className="text-[#C9A84C] hover:underline">Terms</button>
                  {" "}and{" "}
                  <button type="button" onClick={() => navigate('/privacy')} className="text-[#C9A84C] hover:underline">Privacy Policy</button>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg font-bold text-sm font-body tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                style={{ background: '#C9A84C', color: '#0a1628' }}
              >
                {submitting ? "Please wait…" : <>CREATE ACCOUNT <ArrowRight className="h-4 w-4" /></>}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-[11px] font-body pt-1 transition-colors"
                style={{ color: '#C9A84C' }}
              >
                Already have an account? Sign In
              </button>
            </form>
          )}
        </div>

        {/* Card footer */}
        <div className="border-t border-white/6 px-8 py-4 flex items-center justify-center gap-4 text-[10px] tracking-wider font-body text-white/20">
          <button onClick={() => navigate('/')} className="hover:text-white/50 transition-colors uppercase">Ledgera</button>
          <span>|</span>
          <button onClick={() => navigate('/privacy')} className="hover:text-white/50 transition-colors uppercase">Privacy</button>
          <span>|</span>
          <button onClick={() => navigate('/terms')} className="hover:text-white/50 transition-colors uppercase">Terms</button>
          <span>|</span>
          <span className="uppercase">MJW Group</span>
        </div>
      </div>

    </div>
  );
};

const FooterLinks = ({ navigate }: { navigate: (path: string) => void }) => (
  <div className="mt-6 flex items-center gap-4 text-[10px] tracking-wider font-body text-white/20">
    <button onClick={() => navigate('/')} className="hover:text-white/50 transition-colors uppercase">Ledgera</button>
    <span>|</span>
    <button onClick={() => navigate('/privacy')} className="hover:text-white/50 transition-colors uppercase">Privacy</button>
    <span>|</span>
    <span className="uppercase">MJW Group</span>
  </div>
);

export default Auth;
