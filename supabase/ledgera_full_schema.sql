-- =============================================
-- LEDGERA FULL SCHEMA - Run in Supabase SQL Editor
-- Project: areobwivwvfppkrwtwqx
-- =============================================

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('owner', 'staff', 'accountant', 'viewer');
CREATE TYPE public.vat_status AS ENUM ('not_registered', 'registered', 'pending');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense', 'invoice', 'vat_adjustment');
CREATE TYPE public.vat_treatment AS ENUM ('none', 'standard');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'issued', 'paid', 'cancelled');
CREATE TYPE public.entity_type AS ENUM ('personal', 'sole_prop', 'pty_ltd', 'trust', 'landlord');

-- =============================================
-- CORE TABLES
-- =============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  access_status TEXT NOT NULL DEFAULT 'pending',
  access_code_hash TEXT,
  access_code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  entity_type public.entity_type NOT NULL DEFAULT 'personal',
  vat_status vat_status NOT NULL DEFAULT 'not_registered',
  vat_number TEXT,
  vat_registration_date DATE,
  vat_filing_frequency TEXT DEFAULT 'bi-monthly',
  income_tax_reference TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_branch_code TEXT,
  bank_account_type TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'ENT',
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  registration_number TEXT,
  physical_address TEXT,
  contact_email TEXT,
  logo_url TEXT,
  invoice_accent_color TEXT DEFAULT '#D4A853',
  invoice_font TEXT DEFAULT 'default',
  invoice_layout TEXT DEFAULT 'classic',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.entity_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_id, user_id)
);
ALTER TABLE public.entity_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.expense_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  code_type TEXT NOT NULL DEFAULT 'expense',
  vat_behavior TEXT NOT NULL DEFAULT 'standard',
  tax_behavior TEXT NOT NULL DEFAULT 'deductible',
  vat201_mapping TEXT,
  provisional_inclusion BOOLEAN NOT NULL DEFAULT true,
  audit_note_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  transaction_type transaction_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  sub_description TEXT,
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_treatment vat_treatment NOT NULL DEFAULT 'none',
  expense_code_id UUID REFERENCES public.expense_codes(id),
  customer_id UUID,
  supplier_id UUID,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_months INTEGER[] DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  parent_transaction_id UUID REFERENCES public.transactions(id),
  edit_reason TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  reference_number TEXT,
  document_id UUID,
  reporting_month DATE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  expense_code_id UUID REFERENCES public.expense_codes(id),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  month DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  budget_type transaction_type NOT NULL DEFAULT 'expense',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.period_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  locked_month DATE NOT NULL,
  locked_by UUID REFERENCES auth.users(id) NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_id, locked_month)
);
ALTER TABLE public.period_locks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DOCUMENTS
-- =============================================

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
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id),
  file_path TEXT NOT NULL,
  replaced_by UUID,
  replaced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edit_reason TEXT NOT NULL
);
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INVOICES
-- =============================================

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

-- =============================================
-- LANDLORD / PROPERTIES
-- =============================================

CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  physical_address TEXT,
  municipality TEXT,
  rates_account_number TEXT,
  purchase_price NUMERIC DEFAULT 0,
  purchase_date DATE,
  bond_amount NUMERIC DEFAULT 0,
  bond_interest_rate NUMERIC DEFAULT 0,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  lease_start DATE,
  lease_end DATE,
  monthly_rental NUMERIC NOT NULL DEFAULT 0,
  escalation_percent NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  deposit_held BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rental_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  month DATE NOT NULL,
  rental_due NUMERIC NOT NULL DEFAULT 0,
  rental_received NUMERIC NOT NULL DEFAULT 0,
  arrears NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rental_income ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CUSTOMERS & SUPPLIERS
-- =============================================

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trading_name TEXT,
  registration_number TEXT,
  vat_number TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trading_name TEXT,
  registration_number TEXT,
  vat_number TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VEHICLES
-- =============================================

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  registration_number TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT NOT NULL DEFAULT 'business_use',
  purchase_price NUMERIC DEFAULT 0,
  purchase_date DATE,
  finance_amount NUMERIC DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vehicle_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  opening_odo NUMERIC DEFAULT 0,
  closing_odo NUMERIC DEFAULT 0,
  business_km NUMERIC DEFAULT 0,
  private_km NUMERIC DEFAULT 0,
  fuel NUMERIC DEFAULT 0,
  maintenance NUMERIC DEFAULT 0,
  insurance NUMERIC DEFAULT 0,
  licence NUMERIC DEFAULT 0,
  tracking NUMERIC DEFAULT 0,
  tyres NUMERIC DEFAULT 0,
  finance_interest NUMERIC DEFAULT 0,
  parking_tolls NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_claims ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vehicle_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  rental_income NUMERIC DEFAULT 0,
  finance_interest NUMERIC DEFAULT 0,
  insurance NUMERIC DEFAULT 0,
  repairs NUMERIC DEFAULT 0,
  maintenance NUMERIC DEFAULT 0,
  tracking NUMERIC DEFAULT 0,
  licence NUMERIC DEFAULT 0,
  tyres NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_rentals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CSV IMPORTS
-- =============================================

CREATE TABLE public.csv_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  bank_format TEXT DEFAULT 'custom',
  row_count INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.csv_import_batches ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.csv_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.csv_import_batches(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL DEFAULT 0,
  raw_data JSONB NOT NULL DEFAULT '{}',
  mapped_date DATE,
  mapped_description TEXT,
  mapped_amount NUMERIC,
  mapped_type TEXT,
  suggested_code_id UUID REFERENCES public.expense_codes(id),
  suggested_customer_id UUID REFERENCES public.customers(id),
  suggested_supplier_id UUID REFERENCES public.suppliers(id),
  status TEXT NOT NULL DEFAULT 'pending',
  duplicate_flag BOOLEAN NOT NULL DEFAULT false,
  posted_transaction_id UUID REFERENCES public.transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.csv_import_rows ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TAX TABLES
-- =============================================

CREATE TABLE public.income_tax_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  tax_year TEXT NOT NULL,
  gross_taxable_income NUMERIC DEFAULT 0,
  deductible_expenses NUMERIC DEFAULT 0,
  disallowed_expenses NUMERIC DEFAULT 0,
  capital_items NUMERIC DEFAULT 0,
  vehicle_adjustments NUMERIC DEFAULT 0,
  net_taxable_result NUMERIC DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.income_tax_summaries ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vat_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  output_vat NUMERIC DEFAULT 0,
  input_vat NUMERIC DEFAULT 0,
  net_vat NUMERIC DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vat_periods ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SUBSCRIPTION & COMPLIANCE
-- =============================================

CREATE TABLE public.subscription_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  renewed_at timestamptz,
  cancelled_at timestamptz,
  store_provider text,
  store_transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.subscription_status ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  retention_hold_reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  deleted_at timestamptz,
  confirmation_log jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.compliance_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  policy_version text NOT NULL DEFAULT '1.0',
  consent_status text NOT NULL DEFAULT 'accepted',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_consents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_entity_member(_user_id UUID, _entity_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.entity_members WHERE user_id = _user_id AND entity_id = _entity_id)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, access_status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'pending');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.auto_add_entity_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.entity_members (entity_id, user_id) VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_add_entity_member ON public.entities;
CREATE TRIGGER trg_auto_add_entity_member AFTER INSERT ON public.entities FOR EACH ROW EXECUTE FUNCTION public.auto_add_entity_member();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoice_clients_updated_at BEFORE UPDATE ON public.invoice_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicle_claims_updated_at BEFORE UPDATE ON public.vehicle_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicle_rentals_updated_at BEFORE UPDATE ON public.vehicle_rentals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_income_tax_summaries_updated_at BEFORE UPDATE ON public.income_tax_summaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vat_periods_updated_at BEFORE UPDATE ON public.vat_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can read entities" ON public.entities FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), id));
CREATE POLICY "Owners can insert entities" ON public.entities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update entities" ON public.entities FOR UPDATE TO authenticated USING (public.is_entity_member(auth.uid(), id) AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Members can read entity members" ON public.entity_members FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Owners can insert entity members" ON public.entity_members FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can delete entity members" ON public.entity_members FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Authenticated can read expense codes" ON public.expense_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can read transactions" ON public.transactions FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (public.is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read budget items" ON public.budget_items FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert budget items" ON public.budget_items FOR INSERT TO authenticated WITH CHECK (public.is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update budget items" ON public.budget_items FOR UPDATE TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Owners can read audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Authenticated can insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can read period locks" ON public.period_locks FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Owners can insert period locks" ON public.period_locks FOR INSERT TO authenticated WITH CHECK (public.is_entity_member(auth.uid(), entity_id) AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Members can read documents" ON public.documents FOR SELECT USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert documents" ON public.documents FOR INSERT WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update documents" ON public.documents FOR UPDATE USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read document versions" ON public.document_versions FOR SELECT USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND is_entity_member(auth.uid(), d.entity_id)));
CREATE POLICY "Members can insert document versions" ON public.document_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND is_entity_member(auth.uid(), d.entity_id)));
CREATE POLICY "Members can read invoice clients" ON public.invoice_clients FOR SELECT TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert invoice clients" ON public.invoice_clients FOR INSERT TO authenticated WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update invoice clients" ON public.invoice_clients FOR UPDATE TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read invoices" ON public.invoices FOR SELECT TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read invoice line items" ON public.invoice_line_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_line_items.invoice_id AND is_entity_member(auth.uid(), i.entity_id)));
CREATE POLICY "Members can insert invoice line items" ON public.invoice_line_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_line_items.invoice_id AND is_entity_member(auth.uid(), i.entity_id)));
CREATE POLICY "Members can update invoice line items" ON public.invoice_line_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_line_items.invoice_id AND is_entity_member(auth.uid(), i.entity_id)));
CREATE POLICY "Members can delete invoice line items" ON public.invoice_line_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_line_items.invoice_id AND is_entity_member(auth.uid(), i.entity_id)));
CREATE POLICY "Members can read properties" ON public.properties FOR SELECT USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert properties" ON public.properties FOR INSERT WITH CHECK (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can update properties" ON public.properties FOR UPDATE USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read tenants" ON public.tenants FOR SELECT USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = tenants.property_id AND public.is_entity_member(auth.uid(), p.entity_id)));
CREATE POLICY "Members can insert tenants" ON public.tenants FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = tenants.property_id AND public.is_entity_member(auth.uid(), p.entity_id)));
CREATE POLICY "Members can update tenants" ON public.tenants FOR UPDATE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = tenants.property_id AND public.is_entity_member(auth.uid(), p.entity_id)));
CREATE POLICY "Members can read rental_income" ON public.rental_income FOR SELECT USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = rental_income.property_id AND public.is_entity_member(auth.uid(), p.entity_id)));
CREATE POLICY "Members can insert rental_income" ON public.rental_income FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = rental_income.property_id AND public.is_entity_member(auth.uid(), p.entity_id)));
CREATE POLICY "Members can update rental_income" ON public.rental_income FOR UPDATE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = rental_income.property_id AND public.is_entity_member(auth.uid(), p.entity_id)));
CREATE POLICY "Members can read customers" ON public.customers FOR SELECT TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update customers" ON public.customers FOR UPDATE TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read vehicles" ON public.vehicles FOR SELECT TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read vehicle_claims" ON public.vehicle_claims FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_claims.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can insert vehicle_claims" ON public.vehicle_claims FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_claims.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can update vehicle_claims" ON public.vehicle_claims FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_claims.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can read vehicle_rentals" ON public.vehicle_rentals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_rentals.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can insert vehicle_rentals" ON public.vehicle_rentals FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_rentals.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can update vehicle_rentals" ON public.vehicle_rentals FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_rentals.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can read csv_import_batches" ON public.csv_import_batches FOR SELECT TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert csv_import_batches" ON public.csv_import_batches FOR INSERT TO authenticated WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update csv_import_batches" ON public.csv_import_batches FOR UPDATE TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read csv_import_rows" ON public.csv_import_rows FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM csv_import_batches b WHERE b.id = csv_import_rows.batch_id AND is_entity_member(auth.uid(), b.entity_id)));
CREATE POLICY "Members can insert csv_import_rows" ON public.csv_import_rows FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM csv_import_batches b WHERE b.id = csv_import_rows.batch_id AND is_entity_member(auth.uid(), b.entity_id)));
CREATE POLICY "Members can update csv_import_rows" ON public.csv_import_rows FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM csv_import_batches b WHERE b.id = csv_import_rows.batch_id AND is_entity_member(auth.uid(), b.entity_id)));
CREATE POLICY "Members can read income_tax_summaries" ON public.income_tax_summaries FOR SELECT TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert income_tax_summaries" ON public.income_tax_summaries FOR INSERT TO authenticated WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update income_tax_summaries" ON public.income_tax_summaries FOR UPDATE TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can read vat_periods" ON public.vat_periods FOR SELECT TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert vat_periods" ON public.vat_periods FOR INSERT TO authenticated WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update vat_periods" ON public.vat_periods FOR UPDATE TO authenticated USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Users can read own subscription" ON public.subscription_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.subscription_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.subscription_status FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can read own deletion requests" ON public.deletion_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deletion request" ON public.deletion_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own consents" ON public.compliance_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consent" ON public.compliance_consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Members can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Members can read own entity documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Members can update documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- =============================================
-- SEED: EXPENSE CODES
-- =============================================
INSERT INTO public.expense_codes (code, name, description, sort_order, code_type, vat_behavior, tax_behavior) VALUES
  ('ADV', 'Advertising & Marketing', 'Advertising, marketing, and promotional expenses', 1, 'expense', 'standard', 'deductible'),
  ('BNK', 'Bank Charges', 'Bank fees, card charges, and transaction costs', 2, 'expense', 'standard', 'deductible'),
  ('CEL', 'Cellphone & Data', 'Mobile phone, data, and communication costs', 3, 'expense', 'standard', 'deductible'),
  ('CMP', 'Computer & Software', 'Computer equipment, software licenses, and IT expenses', 4, 'expense', 'standard', 'deductible'),
  ('INS', 'Insurance', 'Business insurance premiums', 5, 'expense', 'exempt', 'deductible'),
  ('INT', 'Interest Paid', 'Interest on business loans and overdrafts', 6, 'expense', 'exempt', 'deductible'),
  ('LEG', 'Legal & Accounting', 'Legal fees, accounting, and professional services', 7, 'expense', 'standard', 'deductible'),
  ('MVF', 'Motor Vehicle – Fuel', 'Fuel and oil for business vehicles', 8, 'expense', 'standard', 'deductible'),
  ('MVM', 'Motor Vehicle – Maintenance', 'Vehicle repairs, services, and maintenance', 9, 'expense', 'standard', 'deductible'),
  ('MVL', 'Motor Vehicle – Licence & Insurance', 'Vehicle licence fees and insurance', 10, 'expense', 'out-of-scope', 'deductible'),
  ('OFF', 'Office Expenses', 'Office supplies, stationery, and consumables', 11, 'expense', 'standard', 'deductible'),
  ('RPM', 'Repairs & Maintenance', 'General repairs and maintenance of business assets', 12, 'expense', 'standard', 'deductible'),
  ('RNT', 'Rent', 'Business premises rental and lease payments', 13, 'expense', 'standard', 'deductible'),
  ('SUB', 'Subscriptions', 'Business subscriptions and memberships', 14, 'expense', 'standard', 'deductible'),
  ('TRV', 'Travel', 'Business travel, accommodation, and meals', 15, 'expense', 'standard', 'deductible'),
  ('UTL', 'Utilities', 'Electricity, water, and municipal services', 16, 'expense', 'standard', 'deductible'),
  ('DEP', 'Depreciation', 'Depreciation of business assets', 17, 'adjustment', 'out-of-scope', 'deductible'),
  ('SAL', 'Salaries & Wages', 'Employee salaries, wages, and benefits', 18, 'expense', 'out-of-scope', 'deductible'),
  ('OTH', 'Other Expenses', 'Miscellaneous business expenses', 19, 'expense', 'standard', 'deductible'),
  ('INC-001', 'Professional / contractor income', 'Revenue from professional services or contracting', 1, 'income', 'standard', 'non-deductible'),
  ('INC-002', 'Vehicle rental income', 'Income from renting vehicles', 2, 'income', 'standard', 'non-deductible'),
  ('INC-003', 'Other service income', 'Miscellaneous service revenue', 3, 'income', 'standard', 'non-deductible'),
  ('INC-004', 'Interest received', 'Bank and investment interest', 4, 'income', 'exempt', 'non-deductible'),
  ('INC-005', 'Recoveries / reimbursements', 'Cost recoveries from clients', 5, 'income', 'standard', 'non-deductible'),
  ('INC-006', 'Asset disposal proceeds', 'Proceeds from sale of assets', 6, 'income', 'standard', 'non-deductible'),
  ('INC-007', 'Non-taxable / out-of-scope receipts', 'Non-taxable income', 7, 'income', 'out-of-scope', 'non-deductible'),
  ('CAP-001', 'Computer equipment', 'Computers and peripherals', 30, 'capital', 'standard', 'capital'),
  ('CAP-002', 'Furniture and fittings', 'Office furniture', 31, 'capital', 'standard', 'capital'),
  ('CAP-003', 'Vehicle purchase / capital', 'Vehicle acquisition cost', 32, 'capital', 'standard', 'capital'),
  ('CAP-004', 'Leasehold improvements', 'Improvements to leased premises', 33, 'capital', 'standard', 'capital'),
  ('CAP-005', 'Deposits paid', 'Refundable deposits', 34, 'capital', 'out-of-scope', 'non-deductible'),
  ('CAP-006', 'Loan account drawings introduced', 'Capital introduced by owner', 35, 'capital', 'out-of-scope', 'non-deductible'),
  ('VEH-001', 'Vehicle fuel', 'Fuel for business vehicles', 40, 'expense', 'standard', 'deductible'),
  ('VEH-002', 'Vehicle maintenance', 'Vehicle servicing and repairs', 41, 'expense', 'standard', 'deductible'),
  ('VEH-003', 'Vehicle tyres', 'Tyre replacement', 42, 'expense', 'standard', 'deductible'),
  ('VEH-004', 'Vehicle insurance', 'Vehicle insurance premiums', 43, 'expense', 'exempt', 'deductible'),
  ('VEH-005', 'Vehicle tracking', 'GPS and tracking services', 44, 'expense', 'standard', 'deductible'),
  ('VEH-006', 'Vehicle licence', 'Licence renewal fees', 45, 'expense', 'out-of-scope', 'deductible'),
  ('VEH-007', 'Vehicle finance interest', 'Interest on vehicle finance', 46, 'expense', 'exempt', 'deductible'),
  ('VEH-008', 'Vehicle instalment capital portion', 'Non-deductible capital portion', 47, 'expense', 'out-of-scope', 'non-deductible'),
  ('VEH-009', 'Vehicle depreciation / wear-and-tear', 'Wear-and-tear allowance support', 48, 'adjustment', 'out-of-scope', 'deductible'),
  ('VEH-010', 'Vehicle rental direct expenses', 'Direct costs for rental vehicles', 49, 'expense', 'standard', 'deductible'),
  ('TAX-001', 'VAT output control', 'VAT collected on sales', 50, 'adjustment', 'out-of-scope', 'non-deductible'),
  ('TAX-002', 'VAT input control', 'VAT paid on purchases', 51, 'adjustment', 'out-of-scope', 'non-deductible'),
  ('TAX-003', 'VAT non-claimable', 'VAT that cannot be claimed', 52, 'adjustment', 'non-claimable', 'non-deductible'),
  ('TAX-004', 'SARS penalties and interest', 'Non-deductible SARS penalties', 53, 'expense', 'out-of-scope', 'non-deductible'),
  ('TAX-005', 'Income tax payments', 'Non-deductible income tax', 54, 'expense', 'out-of-scope', 'non-deductible'),
  ('TAX-006', 'Provisional tax payments', 'Non-deductible provisional tax', 55, 'expense', 'out-of-scope', 'non-deductible'),
  ('PRI-001', 'Owner drawings', 'Private drawings by owner', 60, 'private', 'out-of-scope', 'non-deductible'),
  ('PRI-002', 'Private fuel', 'Non-business fuel', 61, 'private', 'non-claimable', 'non-deductible'),
  ('PRI-003', 'Private groceries / non-business', 'Personal expenses', 62, 'private', 'non-claimable', 'non-deductible'),
  ('PRI-004', 'Private medical', 'Personal medical expenses', 63, 'private', 'out-of-scope', 'non-deductible'),
  ('PRI-005', 'Mixed expense awaiting apportionment', 'Expenses pending split', 64, 'private', 'standard', 'non-deductible')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- SETUP ADMIN USER: mornay22@gmail.com
-- Run AFTER creating the user in Auth dashboard
-- =============================================
-- INSERT INTO public.profiles (user_id, email, full_name, access_status)
-- SELECT id, email, 'Mornay Walters', 'approved'
-- FROM auth.users WHERE email = 'mornay22@gmail.com'
-- ON CONFLICT (user_id) DO UPDATE SET access_status = 'approved', email = 'mornay22@gmail.com';
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'owner' FROM auth.users WHERE email = 'mornay22@gmail.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
