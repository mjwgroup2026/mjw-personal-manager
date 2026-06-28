
-- Extend entities with additional fields for invoice branding
ALTER TABLE public.entities
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS physical_address text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS invoice_accent_color text DEFAULT '#D4A853',
  ADD COLUMN IF NOT EXISTS invoice_font text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS invoice_layout text DEFAULT 'classic';

-- Create invoice_clients table
CREATE TABLE public.invoice_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id),
  name text NOT NULL,
  registration_number text,
  vat_number text,
  address text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.invoice_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read invoice clients"
  ON public.invoice_clients FOR SELECT
  TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

CREATE POLICY "Members can insert invoice clients"
  ON public.invoice_clients FOR INSERT
  TO authenticated
  WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);

CREATE POLICY "Members can update invoice clients"
  ON public.invoice_clients FOR UPDATE
  TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

-- Create invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'paid', 'cancelled');

-- Create invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id),
  client_id uuid NOT NULL REFERENCES public.invoice_clients(id),
  invoice_number text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  vat_applicable boolean NOT NULL DEFAULT false,
  vat_percentage numeric NOT NULL DEFAULT 15,
  subtotal numeric NOT NULL DEFAULT 0,
  vat_total numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  notes text,
  payment_terms text DEFAULT 'Due on receipt',
  pdf_url text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_id, invoice_number)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

CREATE POLICY "Members can insert invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);

CREATE POLICY "Members can update invoices"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

-- Create invoice_line_items table
CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  vat_percentage numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read invoice line items"
  ON public.invoice_line_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_line_items.invoice_id
    AND is_entity_member(auth.uid(), i.entity_id)
  ));

CREATE POLICY "Members can insert invoice line items"
  ON public.invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_line_items.invoice_id
    AND is_entity_member(auth.uid(), i.entity_id)
  ));

CREATE POLICY "Members can update invoice line items"
  ON public.invoice_line_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_line_items.invoice_id
    AND is_entity_member(auth.uid(), i.entity_id)
  ));

CREATE POLICY "Members can delete invoice line items"
  ON public.invoice_line_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_line_items.invoice_id
    AND is_entity_member(auth.uid(), i.entity_id)
  ));

-- Audit trigger for invoices
CREATE OR REPLACE FUNCTION public.log_invoice_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, new_values, user_id)
    VALUES ('invoices', NEW.id, 'create', to_jsonb(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, user_id)
    VALUES ('invoices', NEW.id,
      CASE
        WHEN NEW.is_deleted AND NOT OLD.is_deleted THEN 'soft_delete'
        WHEN NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN 'cancel'
        ELSE 'update'
      END,
      to_jsonb(OLD), to_jsonb(NEW), COALESCE(NEW.updated_by, NEW.created_by));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_invoice_change
AFTER INSERT OR UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.log_invoice_change();

-- Updated_at trigger for invoices
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for invoice_clients
CREATE TRIGGER update_invoice_clients_updated_at
BEFORE UPDATE ON public.invoice_clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
