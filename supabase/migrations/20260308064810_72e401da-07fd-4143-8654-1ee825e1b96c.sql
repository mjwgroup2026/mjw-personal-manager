
-- Update existing expense codes with new fields
UPDATE public.expense_codes SET code_type = 'expense', vat_behavior = 'standard', tax_behavior = 'deductible' WHERE true;

-- Insert new codes only (ON CONFLICT skip existing)
-- First, add unique constraint on code if not exists
ALTER TABLE public.expense_codes ADD CONSTRAINT expense_codes_code_unique UNIQUE (code);

-- Income codes
INSERT INTO public.expense_codes (code, name, description, sort_order, is_active, code_type, vat_behavior, tax_behavior, vat201_mapping, provisional_inclusion, audit_note_required) VALUES
('INC-001', 'Professional / contractor income', 'Revenue from professional services or contracting', 1, true, 'income', 'standard', 'non-deductible', 'standard_rated_supplies', true, false),
('INC-002', 'Vehicle rental income', 'Income from renting vehicles', 2, true, 'income', 'standard', 'non-deductible', 'standard_rated_supplies', true, false),
('INC-003', 'Other service income', 'Miscellaneous service revenue', 3, true, 'income', 'standard', 'non-deductible', 'standard_rated_supplies', true, false),
('INC-004', 'Interest received', 'Bank and investment interest', 4, true, 'income', 'exempt', 'non-deductible', 'exempt_supplies', true, false),
('INC-005', 'Recoveries / reimbursements', 'Cost recoveries from clients', 5, true, 'income', 'standard', 'non-deductible', 'standard_rated_supplies', true, false),
('INC-006', 'Asset disposal proceeds', 'Proceeds from sale of assets', 6, true, 'income', 'standard', 'non-deductible', 'standard_rated_supplies', true, true),
('INC-007', 'Non-taxable / out-of-scope receipts', 'Non-taxable income', 7, true, 'income', 'out-of-scope', 'non-deductible', null, false, false),
('CAP-001', 'Computer equipment', 'Computers and peripherals', 30, true, 'capital', 'standard', 'capital', 'capital_goods_services', true, true),
('CAP-002', 'Furniture and fittings', 'Office furniture', 31, true, 'capital', 'standard', 'capital', 'capital_goods_services', true, true),
('CAP-003', 'Vehicle purchase / capital', 'Vehicle acquisition cost', 32, true, 'capital', 'standard', 'capital', 'capital_goods_services', true, true),
('CAP-004', 'Leasehold improvements', 'Improvements to leased premises', 33, true, 'capital', 'standard', 'capital', 'capital_goods_services', true, true),
('CAP-005', 'Deposits paid', 'Refundable deposits', 34, true, 'capital', 'out-of-scope', 'non-deductible', null, false, false),
('CAP-006', 'Loan account drawings introduced', 'Capital introduced by owner', 35, true, 'capital', 'out-of-scope', 'non-deductible', null, false, false),
('VEH-001', 'Vehicle fuel', 'Fuel for business vehicles', 40, true, 'expense', 'standard', 'deductible', 'other_goods_services', true, false),
('VEH-002', 'Vehicle maintenance', 'Vehicle servicing and repairs', 41, true, 'expense', 'standard', 'deductible', 'other_goods_services', true, false),
('VEH-003', 'Vehicle tyres', 'Tyre replacement', 42, true, 'expense', 'standard', 'deductible', 'other_goods_services', true, false),
('VEH-004', 'Vehicle insurance', 'Vehicle insurance premiums', 43, true, 'expense', 'exempt', 'deductible', 'exempt_supplies', true, false),
('VEH-005', 'Vehicle tracking', 'GPS and tracking services', 44, true, 'expense', 'standard', 'deductible', 'other_goods_services', true, false),
('VEH-006', 'Vehicle licence', 'Licence renewal fees', 45, true, 'expense', 'out-of-scope', 'deductible', null, true, false),
('VEH-007', 'Vehicle finance interest', 'Interest on vehicle finance', 46, true, 'expense', 'exempt', 'deductible', 'exempt_supplies', true, false),
('VEH-008', 'Vehicle instalment capital portion', 'Non-deductible capital portion', 47, true, 'expense', 'out-of-scope', 'non-deductible', null, false, false),
('VEH-009', 'Vehicle depreciation / wear-and-tear', 'Wear-and-tear allowance support', 48, true, 'adjustment', 'out-of-scope', 'deductible', null, true, true),
('VEH-010', 'Vehicle rental direct expenses', 'Direct costs for rental vehicles', 49, true, 'expense', 'standard', 'deductible', 'other_goods_services', true, false),
('TAX-001', 'VAT output control', 'VAT collected on sales', 50, true, 'adjustment', 'out-of-scope', 'non-deductible', null, false, false),
('TAX-002', 'VAT input control', 'VAT paid on purchases', 51, true, 'adjustment', 'out-of-scope', 'non-deductible', null, false, false),
('TAX-003', 'VAT non-claimable', 'VAT that cannot be claimed', 52, true, 'adjustment', 'non-claimable', 'non-deductible', null, false, true),
('TAX-004', 'SARS penalties and interest', 'Non-deductible SARS penalties', 53, true, 'expense', 'out-of-scope', 'non-deductible', null, false, true),
('TAX-005', 'Income tax payments', 'Non-deductible income tax', 54, true, 'expense', 'out-of-scope', 'non-deductible', null, false, false),
('TAX-006', 'Provisional tax payments', 'Non-deductible provisional tax', 55, true, 'expense', 'out-of-scope', 'non-deductible', null, false, false),
('PRI-001', 'Owner drawings', 'Private drawings by owner', 60, true, 'private', 'out-of-scope', 'non-deductible', null, false, false),
('PRI-002', 'Private fuel', 'Non-business fuel', 61, true, 'private', 'non-claimable', 'non-deductible', null, false, false),
('PRI-003', 'Private groceries / non-business', 'Personal expenses', 62, true, 'private', 'non-claimable', 'non-deductible', null, false, false),
('PRI-004', 'Private medical', 'Personal medical expenses', 63, true, 'private', 'out-of-scope', 'non-deductible', null, false, false),
('PRI-005', 'Mixed expense awaiting apportionment', 'Expenses pending split', 64, true, 'private', 'standard', 'non-deductible', null, false, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  code_type = EXCLUDED.code_type,
  vat_behavior = EXCLUDED.vat_behavior,
  tax_behavior = EXCLUDED.tax_behavior,
  vat201_mapping = EXCLUDED.vat201_mapping,
  provisional_inclusion = EXCLUDED.provisional_inclusion,
  audit_note_required = EXCLUDED.audit_note_required;
