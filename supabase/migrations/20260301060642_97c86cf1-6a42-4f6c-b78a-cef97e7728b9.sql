
-- 1. Add entity_type enum
CREATE TYPE public.entity_type AS ENUM ('personal', 'sole_prop', 'pty_ltd', 'trust', 'landlord');

-- 2. Add entity_type column to entities
ALTER TABLE public.entities ADD COLUMN entity_type public.entity_type NOT NULL DEFAULT 'personal';

-- 3. Add 'accountant' and 'viewer' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- 4. Create properties table
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

CREATE POLICY "Members can read properties" ON public.properties
  FOR SELECT USING (public.is_entity_member(auth.uid(), entity_id));

CREATE POLICY "Members can insert properties" ON public.properties
  FOR INSERT WITH CHECK (public.is_entity_member(auth.uid(), entity_id));

CREATE POLICY "Members can update properties" ON public.properties
  FOR UPDATE USING (public.is_entity_member(auth.uid(), entity_id));

-- 5. Create tenants table
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

CREATE POLICY "Members can read tenants" ON public.tenants
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.properties p WHERE p.id = tenants.property_id AND public.is_entity_member(auth.uid(), p.entity_id)
  ));

CREATE POLICY "Members can insert tenants" ON public.tenants
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.properties p WHERE p.id = tenants.property_id AND public.is_entity_member(auth.uid(), p.entity_id)
  ));

CREATE POLICY "Members can update tenants" ON public.tenants
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.properties p WHERE p.id = tenants.property_id AND public.is_entity_member(auth.uid(), p.entity_id)
  ));

-- 6. Create rental_income table
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

CREATE POLICY "Members can read rental_income" ON public.rental_income
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.properties p WHERE p.id = rental_income.property_id AND public.is_entity_member(auth.uid(), p.entity_id)
  ));

CREATE POLICY "Members can insert rental_income" ON public.rental_income
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.properties p WHERE p.id = rental_income.property_id AND public.is_entity_member(auth.uid(), p.entity_id)
  ));

CREATE POLICY "Members can update rental_income" ON public.rental_income
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.properties p WHERE p.id = rental_income.property_id AND public.is_entity_member(auth.uid(), p.entity_id)
  ));

-- 7. Add updated_at triggers
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
