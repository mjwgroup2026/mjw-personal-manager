
-- Add soft delete support to budget_items
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Add soft delete support to entities (archive capability)
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
