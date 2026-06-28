import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, BookOpen, FileCheck, Car, Receipt, Calculator, Lock, CheckCircle, LayoutDashboard, Heart, Users, NotebookPen, Calendar, Wallet, FolderOpen, Pill, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import mjwLogo from "@/assets/mjw-logo.png";
import { useState } from "react";

const financeFeatures = [
  { icon: Receipt, title: "Transaction Tracking", desc: "Record every income and expense with categorisation, supplier/customer linking, and document attachment. Every edit is versioned with mandatory reasons." },
  { icon: Shield, title: "VAT Management", desc: "Track output and input VAT per transaction. Generate VAT201 support packs, working papers, and exception reports aligned to SARS filing periods." },
  { icon: Calculator, title: "Expense Categorisation", desc: "Classify transactions using a structured chart of accounts with deductible, non-deductible, and capital expense codes built for South African tax rules." },
  { icon: BookOpen, title: "Income Tax Preparation", desc: "Monthly and year-to-date taxable income tracking with provisional tax monitoring, vehicle adjustments, and annual filing readiness for March–February tax years." },
  { icon: FileCheck, title: "Audit-Ready Records", desc: "Non-destructive versioned ledger with period locking, mandatory edit reasons, full audit trail, and exportable accountant handover packs." },
  { icon: Car, title: "Vehicle & Property Schedules", desc: "Business-use vehicle claims with logbook allocation, vehicle rental income tracking, and property rental management with tenant and lease records." },
];

const personalFeatures = [
  { icon: LayoutDashboard, title: "Daily Dashboard", desc: "A single morning view of your top focus tasks, habit streaks, upcoming calendar events, and financial snapshot — so you start every day with clarity." },
  { icon: CheckCircle, title: "Tasks & Projects", desc: "Capture, prioritise, and track personal and professional tasks. Group them into projects with progress tracking and due dates." },
  { icon: Heart, title: "Habits & Routines", desc: "Build consistency with daily habit tracking, streaks, and rhythm scoring across health, work, and personal goals." },
  { icon: NotebookPen, title: "Journal", desc: "A private daily journal linked to your calendar and mood tracking — log reflections, wins, and intentions in one place." },
  { icon: Calendar, title: "Calendar & Scheduling", desc: "Unified personal calendar with focus-time blocking, reminders, and event tracking that connects to your tasks and routines." },
  { icon: Users, title: "People & Relationships", desc: "Track important contacts, birthdays, follow-up reminders, and relationship notes — stay connected to the people that matter." },
  { icon: Wallet, title: "Personal Money", desc: "Monitor your income, spending pressure, financial runway, and net balance alongside your business books — one complete financial picture." },
  { icon: Pill, title: "Medication & Health", desc: "Track medications, supplements, health events, and wellness goals with reminders and a personal health log." },
];

const trustPoints = [
  { title: "South African First", desc: "Tax years, SARS codes, VAT201, ZAR formatting, and POPIA-aware data handling built in." },
  { title: "Multi-Entity Management", desc: "Manage personal, sole prop, PTY Ltd, trust, and landlord entities from one account." },
  { title: "Accountant-Ready", desc: "Printable reports, export packs, and audit trails designed for professional review." },
];

const Landing = () => {
  const navigate = useNavigate();
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formSent, setFormSent] = useState(false);

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Opens default mail client with pre-filled fields
    const subject = encodeURIComponent("Request Access — Ledgera MJW Personal Manager");
    const body = encodeURIComponent(`Name: ${formName}\nEmail: ${formEmail}\n\n${formMessage}`);
    window.location.href = `mailto:info@mjwgroup.co.za?subject=${subject}&body=${body}`;
    setFormSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5" style={{ background: '#0D1B2A', backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src={mjwLogo} alt="Ledgera" className="h-9 w-9" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight font-display">Ledgera</span>
              <span className="text-[10px] text-white/35 font-body -mt-0.5">MJW Personal Manager</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/auth")} variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10 font-body">
              Sign In
            </Button>
            <Button onClick={scrollToContact} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold">
              Request Access
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
                <Lock className="h-3 w-3 text-accent" />
                <span className="text-xs font-medium text-white/60 font-body">One platform. Finance + Life.</span>
              </div>

              <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl lg:text-[2.75rem] leading-[1.15] font-display tracking-[0.04em]">
                Ledgera
              </h1>
              <p className="mb-1 text-lg text-accent font-semibold font-body tracking-wide">MJW Personal Manager</p>
              <p className="mb-5 text-sm text-white/35 font-body">by MJW Group</p>

              <p className="mb-8 text-base text-white/50 leading-relaxed max-w-lg font-body">
                SARS-aligned bookkeeping, VAT tracking, income tax monitoring, and audit-ready exports — combined with personal life management: tasks, habits, journal, calendar, health, and relationships.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={scrollToContact} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold h-12 px-6">
                  Request Access
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
                  <span className="text-[11px] text-white/40 font-body">Dashboard — {new Date().toLocaleString('en-ZA', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: "Income", value: "R 48,250.00", color: "text-green-400" },
                    { label: "Expenses", value: "R 12,830.00", color: "text-red-400" },
                    { label: "Net Profit", value: "R 35,420.00", color: "text-green-400" },
                    { label: "VAT Output", value: "R 7,237.50", color: "text-blue-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] text-white/30 font-body uppercase tracking-wide">{label}</p>
                      <p className={`mt-1 text-sm font-bold font-mono ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] text-white/30 font-body uppercase tracking-wide mb-2">Today's Focus</p>
                  {["Review monthly spending", "Submit VAT return", "Journal entry"].map((t) => (
                    <div key={t} className="flex items-center gap-2 py-1">
                      <div className="h-3 w-3 rounded-sm border border-white/20" />
                      <span className="text-xs text-white/50 font-body">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Features */}
      <section id="features" className="bg-background border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent font-body">Financial Management</p>
            <h2 className="text-2xl font-bold text-foreground font-display tracking-[0.04em]">Audit-ready accounting for South African businesses</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {financeFeatures.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-lg border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-accent/30 hover:border-l-accent hover:border-l-2">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-foreground font-body">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Manager Features */}
      <section className="bg-card border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-secondary font-body">Personal Life Management</p>
            <h2 className="text-2xl font-bold text-foreground font-display tracking-[0.04em]">Your whole life — organised in one place</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {personalFeatures.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-lg border border-border bg-background p-5 transition-all hover:shadow-lg hover:border-secondary/30 hover:border-l-secondary hover:border-l-2">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
                  <Icon className="h-4 w-4 text-secondary" />
                </div>
                <h3 className="mb-1.5 text-sm font-bold text-foreground font-body">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-body">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-border bg-background">
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

      {/* Request Access / Contact */}
      <section id="contact" style={{ background: '#0D1B2A' }}>
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white font-display tracking-[0.04em]">Request Access</h2>
          <p className="mb-8 text-sm text-white/40 max-w-md mx-auto font-body">
            Ledgera — MJW Personal Manager is currently invite-only. Fill in your details and we'll be in touch.
          </p>

          {formSent ? (
            <div className="rounded-xl border border-accent/20 bg-accent/10 px-8 py-10">
              <CheckCircle className="h-10 w-10 text-accent mx-auto mb-3" />
              <p className="text-white font-body font-semibold">Request sent!</p>
              <p className="text-white/50 text-sm font-body mt-1">We'll be in touch at the email you provided.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/5 p-8 text-left space-y-4">
              <div>
                <label className="block text-xs text-white/50 font-body mb-1.5">Full Name</label>
                <Input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 font-body focus-visible:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 font-body mb-1.5">Email Address</label>
                <Input
                  required
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 font-body focus-visible:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 font-body mb-1.5">Tell us about your needs (optional)</label>
                <Textarea
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="e.g. sole proprietor, VAT registered, looking for bookkeeping + personal planner..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 font-body focus-visible:ring-accent resize-none"
                />
              </div>
              <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-body font-semibold h-12">
                Send Request
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          <p className="mt-6 text-xs text-white/25 font-body">
            Already have access?{" "}
            <button onClick={() => navigate("/auth")} className="text-accent hover:text-accent/80 underline underline-offset-2">
              Sign in here
            </button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0D1B2A' }} className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center gap-5 md:flex-row md:justify-between">
            <div className="flex items-center gap-3">
              <img src={mjwLogo} alt="Ledgera" className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white font-display">Ledgera</span>
                <span className="text-[10px] text-white/30 font-body">MJW Personal Manager · by MJW Group</span>
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
              © {new Date().getFullYear()} MJW Group. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
