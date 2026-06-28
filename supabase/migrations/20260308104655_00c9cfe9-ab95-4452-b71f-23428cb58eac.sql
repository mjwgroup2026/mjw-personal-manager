
-- Create compliance_consents table
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

CREATE POLICY "Users can read own consents"
  ON public.compliance_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent"
  ON public.compliance_consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Truncate all user and financial data for fresh start
TRUNCATE public.audit_log CASCADE;
TRUNCATE public.invoice_line_items CASCADE;
TRUNCATE public.invoices CASCADE;
TRUNCATE public.invoice_clients CASCADE;
TRUNCATE public.vehicle_claims CASCADE;
TRUNCATE public.vehicle_rentals CASCADE;
TRUNCATE public.vehicles CASCADE;
TRUNCATE public.rental_income CASCADE;
TRUNCATE public.tenants CASCADE;
TRUNCATE public.properties CASCADE;
TRUNCATE public.csv_import_rows CASCADE;
TRUNCATE public.csv_import_batches CASCADE;
TRUNCATE public.income_tax_summaries CASCADE;
TRUNCATE public.vat_periods CASCADE;
TRUNCATE public.budget_items CASCADE;
TRUNCATE public.document_versions CASCADE;
TRUNCATE public.documents CASCADE;
TRUNCATE public.transactions CASCADE;
TRUNCATE public.customers CASCADE;
TRUNCATE public.suppliers CASCADE;
TRUNCATE public.deletion_requests CASCADE;
TRUNCATE public.subscription_status CASCADE;
TRUNCATE public.period_locks CASCADE;
TRUNCATE public.entity_members CASCADE;
TRUNCATE public.entities CASCADE;
TRUNCATE public.user_roles CASCADE;
TRUNCATE public.profiles CASCADE;
