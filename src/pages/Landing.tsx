import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, BookOpen, FileCheck, Car, Receipt, Calculator, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import mjwLogo from "@/assets/mjw-logo.png";

const features = [
  { icon: Receipt, title: "Transaction Tracking", desc: "Record every income and expense with categorisation, supplier/customer linking, and document attachment. Every edit is versioned with mandatory reasons." },
  { icon: Shield, title: "VAT Management", desc: "Track output and input VAT per transaction. Generate VAT201 support packs, working papers, and exception reports aligned to SARS filing periods." },
  { icon: Calculator, title: "Expense Categorisation", desc: "Classify transactions using a structured chart of accounts with deductible, non-deductible, and capital expense codes built for South African tax rules." },
  { icon: BookOpen, title: "Income Tax Preparation", desc: "Monthly and year-to-date taxable income tracking with provisional tax monitoring, vehicle adjustments, and annual filing readiness for March–February tax years." },
  { icon: FileCheck, title: "Audit-Ready Records", desc: "Non-destructive versioned ledger with period locking, mandatory edit reasons, full audit trail, and exportable accountant handover packs." },
  { icon: Car, title: "Vehicle & Property Schedules", desc: "Business-use vehicle claims with logbook allocation, vehicle rental income tracking, and property rental management with tenant and lease records." },
];

const trustPoints = [
  { title: "South African First", desc: "Tax years, SARS codes, VAT201, ZAR formatting, and POPIA-aware data handling built in." },
  { title: "Multi-Entity Management", desc: "Manage personal, sole prop, PTY Ltd, trust, and landlord entities from one account." },
  { title: "Accountant-Ready", desc: "Printable reports, export packs, and audit trails designed for professional review." },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5" style={{ background: '#0D1B2A', backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src={mjwLogo} alt="MJW Personal Manager" className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-[0.25em] uppercase font-display">MJW Personal Manager</span>
              <span className="text-[10px] text-white/35 font-body -mt-0.5">by MJW Group</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/install")} variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10 font-body">
              📱 Get the App
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline" size="sm" className="border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white font-body">
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth?mode=register")} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: '#0D1B2A' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 75% 50%, hsl(38 66% 48% / 0.25), transparent 55%)' }} />
        
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
                <Lock className="h-3 w-3 text-accent" />
                <span className="text-xs font-medium text-white/60 font-body">Audit-ready financial operations</span>
              </div>
              
              <h1 className="mb-5 text-3xl font-bold text-white md:text-4xl lg:text-[2.75rem] leading-[1.15] font-display tracking-[0.06em]">
                Accounting & Tax Operations for South African Sole Proprietors
              </h1>
              <p className="mb-8 text-base text-white/45 leading-relaxed max-w-lg font-body">
                SARS-aligned bookkeeping, VAT tracking, income tax monitoring, and audit-ready exports — structured for accountant review and compliance confidence.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate("/auth")} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold h-12 px-6">
                  Access MJW Personal Manager
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" size="lg" className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white font-body h-12 px-6">
                  See How It Works
                </Button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                  <span className="text-[11px] text-white/40 font-body">Dashboard — {new Date().toLocaleString('en-ZA', { month: 'long' })}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Income", value: "R 48,250.00", color: "text-green-400" },
                    { label: "Expenses", value: "R 12,830.00", color: "text-red-400" },
                    { label: "Net Profit", value: "R 35,420.00", color: "text-green-400" },
                    { label: "VAT Output", value: "R 7,237.50", color: "text-blue-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] text-white/30 font-body uppercase tracking-wide">{label}</p>
                      <p className={`mt-1 text-sm font-bold font-mono-num ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="bg-background border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent font-body">How It Works</p>
            <h2 className="text-2xl font-bold text-foreground font-display tracking-[0.04em]">Built for real accounting workflows</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-lg border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-accent/30 hover:border-l-accent hover:border-l-2">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <Icon className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-foreground font-body">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-border">
            {trustPoints.map(({ title, desc }, i) => (
              <div key={title} className={i > 0 ? "md:pl-8" : ""}>
                <h3 className="mb-2 text-sm font-bold text-foreground font-body">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0D1B2A' }}>
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white font-display tracking-[0.04em]">Ready to get started?</h2>
          <p className="mb-7 text-sm text-white/40 max-w-md mx-auto font-body">
            Create your account and request access. No credit card required.
          </p>
          <Button onClick={() => navigate("/auth?mode=register")} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold h-12 px-8">
            Create Your Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0D1B2A' }} className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center gap-5 md:flex-row md:justify-between">
            <div className="flex items-center gap-3">
              <img src={mjwLogo} alt="MJW Personal Manager" className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-[0.25em] uppercase font-display">MJW Personal Manager</span>
                <span className="text-[10px] text-white/30 font-body">by MJW Group</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-white/40 font-body">
              <button onClick={() => navigate("/privacy")} className="hover:text-white/70 transition-colors">Privacy Policy</button>
              <button onClick={() => navigate("/terms")} className="hover:text-white/70 transition-colors">Terms of Service</button>
              <button onClick={() => navigate("/data-protection")} className="hover:text-white/70 transition-colors">Data Policy</button>
              <button onClick={() => navigate("/security")} className="hover:text-white/70 transition-colors">Security</button>
              <button onClick={() => navigate("/account-deletion")} className="hover:text-white/70 transition-colors">Account Deletion</button>
              <a href="mailto:info@mjwgroup.co.za" className="hover:text-white/70 transition-colors">Contact Us</a>
            </div>
          </div>
          <div className="mt-6 border-t border-white/5 pt-4 text-center">
            <p className="text-[11px] text-white/20 font-body">
              Built by MJW Group · MJW Business Solutions (Pty) Ltd · Reg: 2020/924581/07 · © {new Date().getFullYear()} MJW Business Solutions (Pty) Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
