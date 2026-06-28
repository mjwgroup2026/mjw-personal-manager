import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEntity } from "@/contexts/EntityContext";
import { useSubscription } from "@/hooks/useSubscription";
import {
  LayoutDashboard, ArrowLeftRight, Calculator, Building2, ClipboardList,
  FileText, Receipt, LogOut, Plus, Home, Users, DollarSign, Car, Upload,
  BarChart3, Settings, UserCircle, Menu, ChevronDown, AlertTriangle, Clock, Lock,
} from "lucide-react";
import mjwLogo from "@/assets/mjw-logo.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const entityTypeLabels: Record<string, string> = {
  personal: "Personal", sole_prop: "Sole Prop", pty_ltd: "PTY Ltd", trust: "Trust", landlord: "Landlord",
};

const navSections = [
  {
    label: "Core",
    items: [
      { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
      { to: "/app/entities", icon: Building2, label: "Entities" },
      { to: "/app/customers", icon: UserCircle, label: "Customers" },
      { to: "/app/suppliers", icon: Users, label: "Suppliers" },
    ],
  },
  {
    label: "Accounting",
    items: [
      { to: "/app/transactions", icon: ArrowLeftRight, label: "Transactions" },
      { to: "/app/invoices", icon: Receipt, label: "Invoices" },
      { to: "/app/documents", icon: FileText, label: "Documents" },
      { to: "/app/imports", icon: Upload, label: "Imports" },
    ],
  },
  {
    label: "Tax & Compliance",
    items: [
      { to: "/app/vat", icon: Receipt, label: "VAT" },
      { to: "/app/tax", icon: Calculator, label: "Income Tax" },
      { to: "/app/vehicles", icon: Car, label: "Vehicles" },
    ],
  },
  {
    label: "Landlord",
    landlordOnly: true,
    items: [
      { to: "/app/properties", icon: Home, label: "Properties" },
      { to: "/app/tenants", icon: Users, label: "Tenants" },
      { to: "/app/rental-ledger", icon: DollarSign, label: "Rental Ledger" },
    ],
  },
  {
    label: "Reports & Admin",
    items: [
      { to: "/app/reports", icon: BarChart3, label: "Reports" },
      { to: "/app/audit-log", icon: ClipboardList, label: "Audit Log" },
      { to: "/app/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const AppLayout = () => {
  const { signOut, user } = useAuth();
  const { entities, selectedEntity, setSelectedEntityId } = useEntity();
  const { state: subState, message: subMessage, trialDaysRemaining, isRestricted } = useSubscription();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [entitySelectorOpen, setEntitySelectorOpen] = useState(false);

  const isLandlord = selectedEntity?.entity_type === "landlord";
  const activeEntities = entities.filter((e) => !e.is_deleted);

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col" style={{ background: '#0D1B2A' }}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5">
        <img src={mjwLogo} alt="MJW Personal Manager" className="h-9 w-9" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white tracking-tight font-body">MJW Personal Manager</span>
          <span className="text-[9px] text-white/25 font-body leading-none mt-0.5">by MJW Group</span>
        </div>
      </div>

      {/* Trial countdown in sidebar */}
      {subState === "trial" && trialDaysRemaining !== null && (
        <div className="mx-3 mt-3 rounded-md border border-secondary/20 bg-secondary/10 px-3 py-2 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-secondary shrink-0" />
          <span className="text-[11px] text-white/70 font-body">
            Trial ends in <span className="font-bold text-secondary">{trialDaysRemaining}d</span>
          </span>
        </div>
      )}

      {/* Entity selector */}
      <div className="border-b border-white/5 p-3">
        {activeEntities.length > 0 ? (
          <div>
            <button
              onClick={() => setEntitySelectorOpen(!entitySelectorOpen)}
              className="flex w-full items-center justify-between rounded-md border border-white/8 px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/5"
              style={{ background: '#1A2E45' }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-xs text-white/90 font-body">
                  {selectedEntity?.trading_name || selectedEntity?.legal_name || "Select entity"}
                </p>
                {selectedEntity && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-white/35 font-body">
                      {entityTypeLabels[selectedEntity.entity_type] ?? "Personal"}
                    </span>
                    {selectedEntity.vat_status === 'registered' && (
                      <span className="text-[9px] text-accent font-body font-semibold">VAT</span>
                    )}
                  </div>
                )}
              </div>
              <ChevronDown className={cn("ml-2 h-3.5 w-3.5 shrink-0 text-white/30 transition-transform", entitySelectorOpen && "rotate-180")} />
            </button>

            {entitySelectorOpen && (
              <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto">
                {activeEntities.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { setSelectedEntityId(e.id); setEntitySelectorOpen(false); }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors font-body",
                      selectedEntity?.id === e.id
                        ? "text-accent"
                        : "text-white/50 hover:text-white/80"
                    )}
                    style={selectedEntity?.id === e.id ? { background: '#1A2E45' } : {}}
                  >
                    <span className="truncate">{e.trading_name || e.legal_name}</span>
                    <Badge variant="outline" className="ml-2 shrink-0 text-[9px] px-1.5 py-0 border-white/10 text-white/30">
                      {entityTypeLabels[e.entity_type] ?? ""}
                    </Badge>
                  </button>
                ))}
                <button
                  onClick={() => { navigate("/app/entities/new"); onNavigate?.(); setEntitySelectorOpen(false); }}
                  className="flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-xs text-white/30 hover:text-white/60 font-body transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add Entity
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="outline" size="sm"
            className="w-full border-white/10 bg-white/5 text-white/70 text-xs font-body hover:bg-white/10"
            onClick={() => { navigate("/app/entities/new"); onNavigate?.(); }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Entity
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navSections.map((section) => {
          if (section.landlordOnly && !isLandlord) return null;
          return (
            <div key={section.label} className="mb-4">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20 font-body">
                {section.label}
              </p>
              {section.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to} to={to} end={end} onClick={onNavigate}
                  className={({ isActive }) => cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors font-body",
                    isActive
                      ? "text-accent border-l-2 border-accent"
                      : "text-white/45 hover:text-white/75 hover:bg-white/5"
                  )}
                  style={({ isActive }) => isActive ? { background: '#1A2E45' } : {}}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-white/5 p-3">
        <div className="mb-2 truncate px-2 text-[11px] text-white/25 font-body">
          {user?.email}
        </div>
        <Button
          variant="ghost" size="sm"
          className="w-full justify-start text-xs text-white/35 hover:bg-white/5 hover:text-white/60 font-body"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col lg:flex" style={{ background: '#0D1B2A' }}>
        <NavContent />
      </aside>

      {/* Mobile + Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <img src={mjwLogo} alt="MJW Personal Manager" className="h-8 w-8" />
            <span className="text-sm font-bold tracking-tight font-body">MJW Personal Manager</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0" style={{ background: '#0D1B2A' }}>
              <NavContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          {/* Subscription banners */}
          {isRestricted && (
            <div className="mx-4 mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-foreground font-body flex-1">
                {subMessage || "Your subscription has expired. Please subscribe or enter a redeem code to continue."}
              </p>
              <Button variant="outline" size="sm" className="ml-auto shrink-0 text-xs" onClick={() => navigate("/app/subscription")}>Subscribe</Button>
            </div>
          )}
          {subState === "trial" && subMessage && !isRestricted && (
            <div className="mx-4 mt-3 rounded-lg border border-secondary/20 bg-secondary/5 px-4 py-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-secondary shrink-0" />
              <p className="text-xs text-foreground font-body flex-1">{subMessage}</p>
              <Button variant="outline" size="sm" className="ml-auto shrink-0 text-xs" onClick={() => navigate("/app/subscription")}>View Plans</Button>
            </div>
          )}
          {subState === "grace" && subMessage && (
            <div className="mx-4 mt-3 rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-foreground font-body flex-1">{subMessage}</p>
              <Button variant="outline" size="sm" className="ml-auto shrink-0 text-xs" onClick={() => navigate("/app/subscription")}>Renew</Button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
