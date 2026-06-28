import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Search, Download, Filter } from "lucide-react";
import { exportCSV, generateDateFilename } from "@/lib/export-utils";
import type { Tables } from "@/integrations/supabase/types";

type AuditEntry = Tables<"audit_log">;

const AuditLog = () => {
  const { role } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => setEntries(data ?? []));
  }, []);

  if (role !== "owner") {
    return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Only owners can view the audit log.</p></div>;
  }

  const tables = [...new Set(entries.map(e => e.table_name))].sort();
  const actions = [...new Set(entries.map(e => e.action))].sort();

  const filtered = entries.filter(e => {
    if (tableFilter !== "all" && e.table_name !== tableFilter) return false;
    if (actionFilter !== "all" && e.action !== actionFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return e.table_name.toLowerCase().includes(s) || e.action.toLowerCase().includes(s) || (e.reason || "").toLowerCase().includes(s) || e.record_id.toLowerCase().includes(s);
    }
    return true;
  });

  const handleExport = () => {
    const data = filtered.map(e => ({
      Timestamp: format(new Date(e.created_at), "yyyy-MM-dd HH:mm:ss"),
      Table: e.table_name, Action: e.action, Reason: e.reason || "", "Record ID": e.record_id,
    }));
    exportCSV(data, generateDateFilename("Audit_Log"));
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1 h-3 w-3" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search audit log…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="All Tables" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {tables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All Actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Record ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No entries match filters</TableCell></TableRow>
              ) : (
                filtered.slice(0, 200).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{format(new Date(e.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{e.table_name}</Badge></TableCell>
                    <TableCell className="text-sm">{e.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{e.reason ?? "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{e.record_id.substring(0, 8)}…</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {filtered.length > 200 && <p className="text-xs text-center text-muted-foreground py-2">Showing first 200 of {filtered.length} entries</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;
