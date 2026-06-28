
-- ============================================================
-- LEDGERA SCHEMA EXPANSION
-- ============================================================

-- 1. Customers table
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

CREATE POLICY "Members can read customers" ON public.customers FOR SELECT TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert customers" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update customers" ON public.customers FOR UPDATE TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Suppliers table
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

CREATE POLICY "Members can read suppliers" ON public.suppliers FOR SELECT TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert suppliers" ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update suppliers" ON public.suppliers FOR UPDATE TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Vehicles table
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

CREATE POLICY "Members can read vehicles" ON public.vehicles FOR SELECT TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert vehicles" ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update vehicles" ON public.vehicles FOR UPDATE TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Vehicle claims table
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

CREATE POLICY "Members can read vehicle_claims" ON public.vehicle_claims FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_claims.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can insert vehicle_claims" ON public.vehicle_claims FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_claims.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can update vehicle_claims" ON public.vehicle_claims FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_claims.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));

CREATE TRIGGER update_vehicle_claims_updated_at BEFORE UPDATE ON public.vehicle_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Vehicle rentals table
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

CREATE POLICY "Members can read vehicle_rentals" ON public.vehicle_rentals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_rentals.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can insert vehicle_rentals" ON public.vehicle_rentals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_rentals.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));
CREATE POLICY "Members can update vehicle_rentals" ON public.vehicle_rentals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_rentals.vehicle_id AND is_entity_member(auth.uid(), v.entity_id)));

CREATE TRIGGER update_vehicle_rentals_updated_at BEFORE UPDATE ON public.vehicle_rentals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. CSV import batches
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

CREATE POLICY "Members can read csv_import_batches" ON public.csv_import_batches FOR SELECT TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert csv_import_batches" ON public.csv_import_batches FOR INSERT TO authenticated
  WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update csv_import_batches" ON public.csv_import_batches FOR UPDATE TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

-- 7. CSV import rows (staged)
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

CREATE POLICY "Members can read csv_import_rows" ON public.csv_import_rows FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM csv_import_batches b WHERE b.id = csv_import_rows.batch_id AND is_entity_member(auth.uid(), b.entity_id)));
CREATE POLICY "Members can insert csv_import_rows" ON public.csv_import_rows FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM csv_import_batches b WHERE b.id = csv_import_rows.batch_id AND is_entity_member(auth.uid(), b.entity_id)));
CREATE POLICY "Members can update csv_import_rows" ON public.csv_import_rows FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM csv_import_batches b WHERE b.id = csv_import_rows.batch_id AND is_entity_member(auth.uid(), b.entity_id)));

-- 8. Income tax summaries
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

CREATE POLICY "Members can read income_tax_summaries" ON public.income_tax_summaries FOR SELECT TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert income_tax_summaries" ON public.income_tax_summaries FOR INSERT TO authenticated
  WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update income_tax_summaries" ON public.income_tax_summaries FOR UPDATE TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

CREATE TRIGGER update_income_tax_summaries_updated_at BEFORE UPDATE ON public.income_tax_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. VAT periods
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

CREATE POLICY "Members can read vat_periods" ON public.vat_periods FOR SELECT TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));
CREATE POLICY "Members can insert vat_periods" ON public.vat_periods FOR INSERT TO authenticated
  WITH CHECK (is_entity_member(auth.uid(), entity_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update vat_periods" ON public.vat_periods FOR UPDATE TO authenticated
  USING (is_entity_member(auth.uid(), entity_id));

CREATE TRIGGER update_vat_periods_updated_at BEFORE UPDATE ON public.vat_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Add customer_id and supplier_id columns to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reporting_month DATE;

-- 11. Add expanded fields to expense_codes
ALTER TABLE public.expense_codes ADD COLUMN IF NOT EXISTS code_type TEXT NOT NULL DEFAULT 'expense';
ALTER TABLE public.expense_codes ADD COLUMN IF NOT EXISTS vat_behavior TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE public.expense_codes ADD COLUMN IF NOT EXISTS tax_behavior TEXT NOT NULL DEFAULT 'deductible';
ALTER TABLE public.expense_codes ADD COLUMN IF NOT EXISTS vat201_mapping TEXT;
ALTER TABLE public.expense_codes ADD COLUMN IF NOT EXISTS provisional_inclusion BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.expense_codes ADD COLUMN IF NOT EXISTS audit_note_required BOOLEAN NOT NULL DEFAULT false;

-- 12. Add VAT fields to entities
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS vat_registration_date DATE;
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS vat_filing_frequency TEXT DEFAULT 'bi-monthly';
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS income_tax_reference TEXT;
