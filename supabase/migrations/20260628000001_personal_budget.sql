-- =============================================================
-- Personal Budget Module — Full Schema
-- =============================================================

-- personal_accounts
create table if not exists personal_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_name text not null,
  account_type text not null check (
    account_type in ('cheque','savings','credit_card','cash','wallet','investment','other')
  ),
  institution_name text,
  account_number_last4 text,
  opening_balance numeric(14,2) not null default 0,
  opening_balance_date date not null default current_date,
  is_active boolean not null default true,
  display_order integer default 0,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table personal_accounts enable row level security;
create policy "personal_accounts_user_policy" on personal_accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- personal_debts
create table if not exists personal_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_name text not null,
  debt_type text not null check (
    debt_type in ('personal_loan','credit_card','vehicle_finance','home_loan','store_account','tax_debt','medical_debt','judgment','family_loan','other')
  ),
  creditor_name text,
  reference_number text,
  opening_balance numeric(14,2) not null default 0,
  opening_balance_date date not null default current_date,
  interest_rate numeric(6,3),
  normal_monthly_payment numeric(14,2),
  payment_day integer check (payment_day between 1 and 31),
  status text not null default 'active' check (status in ('active','settled','written_off','disputed','closed')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table personal_debts enable row level security;
create policy "personal_debts_user_policy" on personal_debts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- personal_categories
create table if not exists personal_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_name text not null,
  category_type text not null check (
    category_type in ('income','expense','debt_payment','transfer','adjustment')
  ),
  parent_category_id uuid references personal_categories(id) on delete set null,
  is_active boolean not null default true,
  display_order integer default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table personal_categories enable row level security;
create policy "personal_categories_user_policy" on personal_categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- personal_recurring_items
create table if not exists personal_recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  item_type text not null check (
    item_type in ('income','expense','debt_payment','savings','transfer')
  ),
  default_amount numeric(14,2) not null,
  category_id uuid references personal_categories(id) on delete set null,
  default_account_id uuid references personal_accounts(id) on delete set null,
  debt_id uuid references personal_debts(id) on delete set null,
  frequency text not null default 'monthly' check (
    frequency in ('weekly','fortnightly','monthly','quarterly','annual')
  ),
  due_day integer check (due_day between 1 and 31),
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  auto_generate boolean not null default true,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table personal_recurring_items enable row level security;
create policy "personal_recurring_items_user_policy" on personal_recurring_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- personal_monthly_obligations
create table if not exists personal_monthly_obligations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_item_id uuid references personal_recurring_items(id) on delete set null,
  obligation_month date not null,
  obligation_name text not null,
  obligation_type text not null check (
    obligation_type in ('income','expense','debt_payment','savings','transfer')
  ),
  expected_amount numeric(14,2) not null,
  paid_amount numeric(14,2) not null default 0,
  due_date date,
  status text not null default 'unpaid' check (
    status in ('unpaid','paid','partial','skipped','cancelled','overdue')
  ),
  account_id uuid references personal_accounts(id) on delete set null,
  debt_id uuid references personal_debts(id) on delete set null,
  category_id uuid references personal_categories(id) on delete set null,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, recurring_item_id, obligation_month)
);

alter table personal_monthly_obligations enable row level security;
create policy "personal_monthly_obligations_user_policy" on personal_monthly_obligations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- personal_transactions
create table if not exists personal_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null,
  transaction_type text not null check (
    transaction_type in ('income','expense','debt_payment','transfer','debt_charge','adjustment')
  ),
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  account_id uuid references personal_accounts(id) on delete set null,
  transfer_to_account_id uuid references personal_accounts(id) on delete set null,
  debt_id uuid references personal_debts(id) on delete set null,
  category_id uuid references personal_categories(id) on delete set null,
  adjustment_direction text check (adjustment_direction in ('increase','decrease')),
  payment_method text,
  reference text,
  notes text,
  recurring_item_id uuid references personal_recurring_items(id) on delete set null,
  monthly_obligation_id uuid references personal_monthly_obligations(id) on delete set null,
  is_reconciled boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table personal_transactions enable row level security;
create policy "personal_transactions_user_policy" on personal_transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- personal_audit_log
create table if not exists personal_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null check (
    action in ('create','edit','soft_delete','restore','permanent_delete','cascade_delete','reassign')
  ),
  old_values jsonb,
  new_values jsonb,
  reason text,
  created_at timestamptz not null default now()
);

alter table personal_audit_log enable row level security;
create policy "personal_audit_log_user_policy" on personal_audit_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- Views
-- =============================================================

create or replace view personal_account_balances as
select
  a.id as account_id,
  a.user_id,
  a.account_name,
  a.account_type,
  a.institution_name,
  a.is_active,
  a.display_order,
  a.opening_balance,
  a.opening_balance
  + coalesce(sum(
      case
        when t.deleted_at is not null then 0
        when t.transaction_type = 'income' and t.account_id = a.id then t.amount
        when t.transaction_type = 'expense' and t.account_id = a.id then -t.amount
        when t.transaction_type = 'debt_payment' and t.account_id = a.id then -t.amount
        when t.transaction_type = 'transfer' and t.account_id = a.id then -t.amount
        when t.transaction_type = 'transfer' and t.transfer_to_account_id = a.id then t.amount
        when t.transaction_type = 'adjustment' and t.account_id = a.id and t.adjustment_direction = 'increase' then t.amount
        when t.transaction_type = 'adjustment' and t.account_id = a.id and t.adjustment_direction = 'decrease' then -t.amount
        else 0
      end
    ), 0) as current_balance
from personal_accounts a
left join personal_transactions t on (t.account_id = a.id or t.transfer_to_account_id = a.id)
where a.deleted_at is null
group by a.id;

create or replace view personal_debt_balances as
select
  d.id as debt_id,
  d.user_id,
  d.debt_name,
  d.debt_type,
  d.creditor_name,
  d.status,
  d.priority,
  d.normal_monthly_payment,
  d.opening_balance,
  d.opening_balance
  + coalesce(sum(
      case
        when t.deleted_at is not null then 0
        when t.transaction_type = 'debt_charge' and t.debt_id = d.id then t.amount
        when t.transaction_type = 'debt_payment' and t.debt_id = d.id then -t.amount
        when t.transaction_type = 'adjustment' and t.debt_id = d.id and t.adjustment_direction = 'increase' then t.amount
        when t.transaction_type = 'adjustment' and t.debt_id = d.id and t.adjustment_direction = 'decrease' then -t.amount
        else 0
      end
    ), 0) as current_balance
from personal_debts d
left join personal_transactions t on t.debt_id = d.id
where d.deleted_at is null
group by d.id;

create or replace view personal_monthly_obligation_summary as
select
  user_id,
  obligation_month,
  sum(expected_amount) filter (where deleted_at is null and status not in ('cancelled','skipped')) as total_expected,
  sum(paid_amount) filter (where deleted_at is null and status not in ('cancelled','skipped')) as total_paid,
  sum(greatest(expected_amount - paid_amount, 0)) filter (where deleted_at is null and status in ('unpaid','partial','overdue')) as total_unpaid,
  count(*) filter (where deleted_at is null and status in ('unpaid','partial','overdue')) as unpaid_count,
  count(*) filter (where deleted_at is null and status = 'paid') as paid_count
from personal_monthly_obligations
where deleted_at is null
group by user_id, obligation_month;

-- =============================================================
-- updated_at trigger
-- =============================================================
create or replace function set_personal_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger personal_accounts_updated_at before update on personal_accounts
  for each row execute function set_personal_updated_at();
create trigger personal_debts_updated_at before update on personal_debts
  for each row execute function set_personal_updated_at();
create trigger personal_categories_updated_at before update on personal_categories
  for each row execute function set_personal_updated_at();
create trigger personal_recurring_items_updated_at before update on personal_recurring_items
  for each row execute function set_personal_updated_at();
create trigger personal_monthly_obligations_updated_at before update on personal_monthly_obligations
  for each row execute function set_personal_updated_at();
create trigger personal_transactions_updated_at before update on personal_transactions
  for each row execute function set_personal_updated_at();
