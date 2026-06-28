import { useEntity } from "@/contexts/EntityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Edit, Trash2, RotateCcw } from "lucide-react";
import { useState } from "react";

const vatStatusLabel: Record<string, string> = {
  not_registered: "Not Registered",
  registered: "Registered",
  pending: "Pending",
};

const Entities = () => {
  const { entities, refetch } = useEntity();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleted, setShowDeleted] = useState(false);

  const visibleEntities = showDeleted ? entities : entities.filter((e: any) => !e.is_deleted);

  const handleSoftDelete = async (id: string) => {
    await supabase.from("entities").update({ is_deleted: true }).eq("id", id);
    toast({ title: "Entity archived" });
    refetch();
  };

  const handleRestore = async (id: string) => {
    await supabase.from("entities").update({ is_deleted: false }).eq("id", id);
    toast({ title: "Entity restored" });
    refetch();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Entities</h1>
          <p className="text-sm text-muted-foreground">Manage your businesses</p>
        </div>
        <div className="flex items-center gap-4">
          {role === "owner" && (
            <div className="flex items-center gap-2">
              <Switch checked={showDeleted} onCheckedChange={setShowDeleted} id="show-deleted-ent" />
              <Label htmlFor="show-deleted-ent" className="text-sm">Show Deleted</Label>
            </div>
          )}
          <Button onClick={() => navigate("/app/entities/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Entity
          </Button>
        </div>
      </div>

      {visibleEntities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="mb-1 text-lg font-medium">No entities yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first business entity to get started.
            </p>
            <Button onClick={() => navigate("/app/entities/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Entity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEntities.map((entity: any) => (
            <Card key={entity.id} className={`hover:shadow-md transition-shadow ${entity.is_deleted ? "opacity-50" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{entity.legal_name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {vatStatusLabel[entity.vat_status] ?? entity.vat_status}
                    </Badge>
                    {entity.is_deleted && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
                  </div>
                </div>
                {entity.trading_name && (
                  <CardDescription>t/a {entity.trading_name}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {entity.bank_name && <p>Bank: {entity.bank_name}</p>}
                  <p>Invoice prefix: {entity.invoice_prefix}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {!entity.is_deleted ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/app/entities/${entity.id}`)}>
                        <Edit className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="mr-1 h-3 w-3" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive entity?</AlertDialogTitle>
                            <AlertDialogDescription>This will archive the entity. It can be restored later by an owner.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleSoftDelete(entity.id)}>Archive</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    role === "owner" && (
                      <Button variant="outline" size="sm" onClick={() => handleRestore(entity.id)}>
                        <RotateCcw className="mr-1 h-3 w-3" /> Restore
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Entities;
