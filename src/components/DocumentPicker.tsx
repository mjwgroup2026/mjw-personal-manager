import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, X, ExternalLink } from "lucide-react";

interface DocumentPickerProps {
  entityId: string;
  documentId: string | null;
  onChange: (documentId: string | null) => void;
}

const DocumentPicker = ({ entityId, documentId, onChange }: DocumentPickerProps) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<{ id: string; file_name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [linkedName, setLinkedName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!entityId) return;
    supabase
      .from("documents")
      .select("id, file_name")
      .eq("entity_id", entityId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setDocuments(data ?? []));
  }, [entityId]);

  useEffect(() => {
    if (documentId) {
      const doc = documents.find(d => d.id === documentId);
      setLinkedName(doc?.file_name ?? "Linked document");
    } else {
      setLinkedName(null);
    }
  }, [documentId, documents]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Only PDF and image files (JPG, PNG, WEBP) are supported.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${entityId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
    if (uploadErr) { alert(uploadErr.message); setUploading(false); return; }

    const { data: docRow, error: insertErr } = await supabase
      .from("documents")
      .insert({
        entity_id: entityId,
        file_name: file.name,
        file_path: path,
        file_type: file.type,
        file_size: file.size,
        created_by: user.id,
        category: "transaction",
      })
      .select("id, file_name")
      .single();

    if (insertErr) { alert(insertErr.message); setUploading(false); return; }

    setDocuments(prev => [docRow, ...prev]);
    onChange(docRow.id);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" /> Supporting Document
      </Label>

      {documentId && linkedName ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium truncate flex-1 font-body">{linkedName}</span>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onChange(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Select value={documentId ?? ""} onValueChange={(v) => onChange(v || null)}>
            <SelectTrigger className="flex-1 text-xs">
              <SelectValue placeholder="Select existing document" />
            </SelectTrigger>
            <SelectContent>
              {documents.map(d => (
                <SelectItem key={d.id} value={d.id} className="text-xs">{d.file_name}</SelectItem>
              ))}
              {documents.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No documents found</div>
              )}
            </SelectContent>
          </Select>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} />
          <Button type="button" variant="outline" size="sm" className="shrink-0 text-xs" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 h-3 w-3" /> {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentPicker;
