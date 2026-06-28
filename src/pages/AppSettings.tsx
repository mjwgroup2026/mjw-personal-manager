import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEntity } from "@/contexts/EntityContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  UserCircle, Building2, Shield, Lock, FileText, Settings, Scale, Eye,
  CreditCard, Trash2, Receipt, Calculator, Download, ClipboardList, KeyRound
} from "lucide-react";
import ledgeraLogo from "@/assets/ledgera-logo.png";

const entityTypeLabels: Record<string, string> = {
  personal: "Personal", sole_prop: "Sole Prop", pty_ltd: "PTY Ltd", trust: "Trust", landlord: "Landlord",
};

const AppSettings = () => {
  const { user, role } = useAuth();
  const { selectedEntity } = useEntity();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully" });
      setShowPasswordChange(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight font-display">Settings</h1>
        <p className="text-sm text-muted-foreground font-body">Platform configuration, entity settings, and legal information</p>
      </div>

      <div className="space-y-5">
        {/* Account */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><UserCircle className="h-4 w-4 text-secondary" /><CardTitle className="text-sm font-bold font-body">My Profile</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-body">Email</span>
              <span className="text-sm font-medium font-body">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-body">Role</span>
              <Badge variant="outline" className="text-xs capitalize font-body">{role ?? "—"}</Badge>
            </div>
            <Separator />
            {!showPasswordChange ? (
              <Button variant="outline" size="sm" className="w-full text-xs font-body" onClick={() => setShowPasswordChange(true)}>
                <KeyRound className="mr-1.5 h-3 w-3" /> Change Password
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-body">New Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-body">Confirm Password</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs flex-1" onClick={handleChangePassword} disabled={changingPassword}>
                    {changingPassword ? "Saving..." : "Update Password"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => { setShowPasswordChange(false); setNewPassword(""); setConfirmPassword(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entity Settings */}
        {selectedEntity && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-secondary" /><CardTitle className="text-sm font-bold font-body">Entity — {selectedEntity.trading_name || selectedEntity.legal_name}</CardTitle></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground font-body">Type</span><Badge variant="outline" className="text-xs font-body">{entityTypeLabels[selectedEntity.entity_type]}</Badge></div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground font-body">VAT Status</span><Badge variant="outline" className={`text-xs font-body ${selectedEntity.vat_status === 'registered' ? 'text-success border-success/30' : ''}`}>{selectedEntity.vat_status}</Badge></div>
              {selectedEntity.vat_number && <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground font-body">VAT Number</span><span className="text-sm font-mono">{selectedEntity.vat_number}</span></div>}
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground font-body">Invoice Prefix</span><span className="text-sm font-mono">{selectedEntity.invoice_prefix}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground font-body">Next Invoice #</span><span className="text-sm font-mono">{selectedEntity.next_invoice_number}</span></div>
              <Button variant="outline" size="sm" className="w-full text-xs mt-2 font-body" onClick={() => navigate(`/app/entities/${selectedEntity.id}`)}><Settings className="mr-1.5 h-3 w-3" /> Edit Entity Settings</Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Settings Links */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Settings className="h-4 w-4 text-secondary" /><CardTitle className="text-sm font-bold font-body">Platform Settings</CardTitle></div>
            <CardDescription className="text-xs font-body">Accounting, tax, and platform configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { label: "VAT Settings", to: "/app/vat", icon: Receipt },
                { label: "Income Tax", to: "/app/tax", icon: Calculator },
                { label: "Invoice Settings", to: selectedEntity ? `/app/entities/${selectedEntity?.id}` : "/app/entities", icon: FileText },
                { label: "Documents", to: "/app/documents", icon: FileText },
                { label: "Period Locks", to: "/app/audit-log", icon: Lock },
                { label: "Export Centre", to: "/app/reports", icon: Download },
                { label: "Audit Log", to: "/app/audit-log", icon: ClipboardList },
                { label: "Vehicles", to: "/app/vehicles", icon: Settings },
              ].map(({ label, to, icon: Icon }) => (
                <Button key={label} variant="outline" size="sm" className="justify-start text-xs h-9 font-body" onClick={() => navigate(to)}>
                  <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Administration */}
        {role === 'owner' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-accent" /><CardTitle className="text-sm font-bold font-body">Administration</CardTitle></div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full text-xs font-body" onClick={() => navigate("/app/admin")}>
                <Shield className="mr-1.5 h-3 w-3" /> Access Management
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Subscription & Billing */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-accent" /><CardTitle className="text-sm font-bold font-body">Subscription & Billing</CardTitle></div>
            <CardDescription className="text-xs font-body">Manage your plan, renewal, and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full text-xs font-body" onClick={() => navigate("/app/subscription")}>
              <CreditCard className="mr-1.5 h-3 w-3" /> View Subscription
            </Button>
          </CardContent>
        </Card>

        {/* Legal & Trust */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Scale className="h-4 w-4 text-secondary" /><CardTitle className="text-sm font-bold font-body">Legal & Trust</CardTitle></div>
            <CardDescription className="text-xs font-body">Privacy, data protection, terms, and compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { label: "Privacy Policy", to: "/privacy", icon: Eye },
                { label: "Terms of Service", to: "/terms", icon: FileText },
                { label: "Data Policy", to: "/data-protection", icon: Shield },
                { label: "Security", to: "/security", icon: Lock },
                { label: "Compliance Consent", to: "/app/compliance", icon: Scale },
              ].map(({ label, to, icon: Icon }) => (
                <Button key={to} variant="outline" size="sm" className="justify-start text-xs h-9 font-body" onClick={() => navigate(to)}>
                  <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /><CardTitle className="text-sm font-bold font-body">Account Deletion</CardTitle></div>
            <CardDescription className="text-xs font-body">Request deletion of your account and data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full text-xs font-body text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => navigate("/app/account-deletion")}>
              <Trash2 className="mr-1.5 h-3 w-3" /> Account Deletion
            </Button>
          </CardContent>
        </Card>

        {/* Platform Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><img src={ledgeraLogo} alt="" className="h-4 w-4" /><CardTitle className="text-sm font-bold font-body">Platform</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground font-body">Product</span><span className="text-sm font-bold font-body">Ledgera</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground font-body">Version</span><span className="text-sm font-body">1.0.0</span></div>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1 font-body">
              <p>Ledgera is a product of MJW Group.</p>
              <p>Owned and operated by MJW Business Solutions (Pty) Ltd</p>
              <p>Reg: 2020/924581/07 · t/a MJW Group</p>
              <p>Email: ledgera@mjwgroup.co.za · Tel: 021 180 4244</p>
              <p className="mt-2">© {new Date().getFullYear()} MJW Business Solutions (Pty) Ltd. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppSettings;
