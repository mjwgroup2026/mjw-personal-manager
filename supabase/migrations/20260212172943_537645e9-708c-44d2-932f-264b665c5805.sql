
-- =============================================
-- MJW Group Finance Platform - Phase 1 Schema
-- =============================================

-- 1. App roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'staff');

-- 2. VAT status enum
CREATE TYPE public.vat_status AS ENUM ('not_registered', 'registered', 'pending');

-- 3. Transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense', 'invoice', 'vat_adjustment');

-- 4. VAT treatment enum
CREATE TYPE public.vat_treatment AS ENUM ('none', 'standard');

-- =============================================
-- TABLES
-- =============================================

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Entities (businesses)
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  vat_status vat_status NOT NULL DEFAULT 'not_registered',
  vat_number TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_branch_code TEXT,
  bank_account_type TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'ENT',
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- Entity members (who has access to which entity)
CREATE TABLE public.entity_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_id, user_id)
);
ALTER TABLE public.entity_members ENABLE ROW LEVEL SECURITY;

-- SARS-aligned expense codes
CREATE TABLE public.expense_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_codes ENABLE ROW LEVEL SECURITY;

-- Central transaction ledger
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
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_months INTEGER[] DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  parent_transaction_id UUID REFERENCES public.transactions(id),
  edit_reason TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Budget items
CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  expense_code_id UUID REFERENCES public.expense_codes(id),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  month DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  budget_type transaction_type NOT NULL DEFAULT 'expense',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Audit log
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

-- Period locks
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
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check entity membership
CREATE OR REPLACE FUNCTION public.is_entity_member(_user_id UUID, _entity_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entity_members
    WHERE user_id = _user_id AND entity_id = _entity_id
  )
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- user_roles: users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles: users can read/update their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- entities: members can read their entities
CREATE POLICY "Members can read entities" ON public.entities
  FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), id));
CREATE POLICY "Owners can insert entities" ON public.entities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update entities" ON public.entities
  FOR UPDATE TO authenticated USING (public.is_entity_member(auth.uid(), id) AND public.has_role(auth.uid(), 'owner'));

-- entity_members: members can read, owners can manage
CREATE POLICY "Members can read entity members" ON public.entity_members
  FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Owners can insert entity members" ON public.entity_members
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can delete entity members" ON public.entity_members
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'owner'));

-- expense_codes: all authenticated users can read
CREATE POLICY "Authenticated can read expense codes" ON public.expense_codes
  FOR SELECT TO authenticated USING (true);

-- transactions: entity members can read, authenticated can insert
CREATE POLICY "Members can read transactions" ON public.transactions
  FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert transactions" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (public.is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update transactions" ON public.transactions
  FOR UPDATE TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));

-- budget_items: entity members
CREATE POLICY "Members can read budget items" ON public.budget_items
  FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert budget items" ON public.budget_items
  FOR INSERT TO authenticated WITH CHECK (public.is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update budget items" ON public.budget_items
  FOR UPDATE TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));

-- audit_log: entity-related access via reading only
CREATE POLICY "Owners can read audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "System can insert audit log" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- period_locks: entity members can read, owners can manage
CREATE POLICY "Members can read period locks" ON public.period_locks
  FOR SELECT TO authenticated USING (public.is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Owners can insert period locks" ON public.period_locks
  FOR INSERT TO authenticated WITH CHECK (public.is_entity_member(auth.uid(), entity_id) AND public.has_role(auth.uid(), 'owner'));

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile + owner role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA: SARS Expense Codes
-- =============================================

INSERT INTO public.expense_codes (code, name, description, sort_order) VALUES
  ('ADV', 'Advertising & Marketing', 'Advertising, marketing, and promotional expenses', 1),
  ('BNK', 'Bank Charges', 'Bank fees, card charges, and transaction costs', 2),
  ('CEL', 'Cellphone & Data', 'Mobile phone, data, and communication costs', 3),
  ('CMP', 'Computer & Software', 'Computer equipment, software licenses, and IT expenses', 4),
  ('INS', 'Insurance', 'Business insurance premiums', 5),
  ('INT', 'Interest Paid', 'Interest on business loans and overdrafts', 6),
  ('LEG', 'Legal & Accounting', 'Legal fees, accounting, and professional services', 7),
  ('MVF', 'Motor Vehicle – Fuel', 'Fuel and oil for business vehicles', 8),
  ('MVM', 'Motor Vehicle – Maintenance', 'Vehicle repairs, services, and maintenance', 9),
  ('MVL', 'Motor Vehicle – Licence & Insurance', 'Vehicle licence fees and insurance', 10),
  ('OFF', 'Office Expenses', 'Office supplies, stationery, and consumables', 11),
  ('RPM', 'Repairs & Maintenance', 'General repairs and maintenance of business assets', 12),
  ('RNT', 'Rent', 'Business premises rental and lease payments', 13),
  ('SUB', 'Subscriptions', 'Business subscriptions and memberships', 14),
  ('TRV', 'Travel', 'Business travel, accommodation, and meals', 15),
  ('UTL', 'Utilities', 'Electricity, water, and municipal services', 16),
  ('DEP', 'Depreciation', 'Depreciation of business assets', 17),
  ('SAL', 'Salaries & Wages', 'Employee salaries, wages, and benefits', 18),
  ('OTH', 'Other Expenses', 'Miscellaneous business expenses', 19);

-- Auto-add creator as entity member
CREATE OR REPLACE FUNCTION public.handle_new_entity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.entity_members (entity_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_entity_created
  AFTER INSERT ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_entity();
