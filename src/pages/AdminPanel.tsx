import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface UserRequest {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  access_status: string;
  created_at: string;
}

const AdminPanel = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, email, full_name, access_status, created_at")
      .order("created_at", { ascending: false });
    setUsers((data as any[]) ?? []);
    setLoading(false);
  };

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const hashCode = async (code: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleApprove = async (userId: string, userEmail: string | null) => {
    const code = generateAccessCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({ 
        access_status: 'approved', 
        access_code_hash: codeHash, 
        access_code_expires_at: expiresAt 
      } as any)
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "User approved", 
        description: `Access code for ${userEmail}: ${code} (valid 72h). Share this with the user.`,
      });
      fetchUsers();
    }
  };

  const handleReject = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ access_status: 'rejected' } as any)
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User rejected" });
      fetchUsers();
    }
  };

  if (role !== 'owner') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <Shield className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground font-body">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-3.5 w-3.5 text-success" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <Clock className="h-3.5 w-3.5 text-accent" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-success border-success/30';
      case 'rejected': return 'text-destructive border-destructive/30';
      default: return 'text-accent border-accent/30';
    }
  };

  const pendingUsers = users.filter(u => u.access_status === 'pending');
  const otherUsers = users.filter(u => u.access_status !== 'pending');

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight font-display">Access Management</h1>
        <p className="text-sm text-muted-foreground font-body">Review and manage user access requests</p>
      </div>

      {/* Pending Requests */}
      {pendingUsers.length > 0 && (
        <Card className="mb-6 border-accent/20">
          <CardHeader className="py-4 px-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-bold font-body">Pending Requests ({pendingUsers.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Name</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Email</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Requested</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-medium font-body">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-body">{u.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-body">{format(new Date(u.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90 font-body" onClick={() => handleApprove(u.user_id, u.email)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 font-body" onClick={() => handleReject(u.user_id)}>
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card>
        <CardHeader className="py-4 px-5">
          <CardTitle className="text-sm font-bold font-body">All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground font-body">Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Name</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Email</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-medium font-body">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-body">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {statusIcon(u.access_status)}
                        <Badge variant="outline" className={`text-[10px] font-body capitalize ${statusColor(u.access_status)}`}>
                          {u.access_status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-body">{format(new Date(u.created_at), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;
