
-- 1. Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id),
  transaction_id UUID REFERENCES public.transactions(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  category TEXT,
  tax_year TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create document_versions table
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id),
  file_path TEXT NOT NULL,
  replaced_by UUID,
  replaced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edit_reason TEXT NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- 4. Documents RLS policies
CREATE POLICY "Members can read documents"
  ON public.documents FOR SELECT
  USING (is_entity_member(auth.uid(), entity_id));

CREATE POLICY "Members can insert documents"
  ON public.documents FOR INSERT
  WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);

CREATE POLICY "Members can update documents"
  ON public.documents FOR UPDATE
  USING (is_entity_member(auth.uid(), entity_id));

-- No DELETE policy - soft delete only via UPDATE

-- 5. Document versions RLS
CREATE POLICY "Members can read document versions"
  ON public.document_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id AND is_entity_member(auth.uid(), d.entity_id)
  ));

CREATE POLICY "Members can insert document versions"
  ON public.document_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id AND is_entity_member(auth.uid(), d.entity_id)
  ));

-- 6. Audit trigger for documents
CREATE OR REPLACE FUNCTION public.log_document_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, new_values, user_id)
    VALUES ('documents', NEW.id, 'create', to_jsonb(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, user_id)
    VALUES ('documents', NEW.id,
      CASE WHEN NEW.is_deleted AND NOT OLD.is_deleted THEN 'soft_delete'
           WHEN NOT NEW.is_deleted AND OLD.is_deleted THEN 'restore'
           WHEN NEW.version > OLD.version THEN 'replace'
           ELSE 'update' END,
      to_jsonb(OLD), to_jsonb(NEW), COALESCE(NEW.updated_by, NEW.created_by));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_document_change
  AFTER INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_document_change();

-- 7. Updated_at trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create private storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- 9. Storage RLS policies
CREATE POLICY "Members can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Members can read own entity documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Members can update documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
