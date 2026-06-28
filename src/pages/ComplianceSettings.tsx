import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle } from "lucide-react";

const ComplianceSettings = () => {
  const { user } = useAuth();
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("compliance_consents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setConsents(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return <div className="flex h-full items-center justify-center p-6"><p className="text-sm text-muted-foreground font-body">Loading…</p></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight font-display">Compliance & Consent</h1>
        <p className="text-sm text-muted-foreground font-body">Your policy acceptance records for legal audit trail</p>
      </div>

      <div className="space-y-4">
        {consents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground font-body">No consent records found.</p>
            </CardContent>
          </Card>
        ) : (
          consents.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <CardTitle className="text-sm font-bold font-body">Policy Consent</CardTitle>
                  <Badge className="ml-auto text-success border-success/30 bg-success/10 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {c.consent_status}
                  </Badge>
                </div>
                <CardDescription className="text-xs font-body">Version {c.policy_version}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-body">Email</span>
                  <span className="text-sm font-body">{c.user_email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-body">Accepted At</span>
                  <span className="text-sm font-body">{new Date(c.created_at).toLocaleString("en-ZA")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-body">IP Address</span>
                  <span className="text-sm font-mono-num">{c.ip_address ?? "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ComplianceSettings;
