

# MJW Group Finance Platform — Implementation Plan

## Overview
A clean, professional financial management platform for a South African sole proprietor, built with Lovable Cloud (Supabase backend), supporting SARS-aligned bookkeeping, invoicing, and audit trails.

We'll build this in **Phase 1 (core)** now, with subsequent phases added iteratively.

---

## Phase 1: Core Foundation (This Implementation)

### 1. Authentication & User Management
- Email + password login/signup
- Two roles: **Owner** (full access) and **Staff** (capture/edit only, no delete/export/lock)
- User roles stored in a secure `user_roles` table
- All actions logged with user identity

### 2. Entity Management
- Create and manage multiple entities (sole prop businesses)
- Each entity stores: legal name, trading name, VAT status (Not Registered / Registered / Pending), VAT number, bank details
- Default invoice numbering format: `ENT-YYMM-0001`
- Tax year logic: March–February
- Strict data isolation between entities

### 3. Chart of Accounts (SARS-Aligned Expense Codes)
- Preloaded fixed expense categories (Advertising, Bank Charges, Cellphone, Computer, Insurance, Legal, Motor Vehicle, Office, Rent, Travel, Utilities, etc.)
- Codes cannot be deleted, only deactivated
- Sub-descriptions allowed per transaction
- Every expense transaction must map to one code

### 4. Transaction Engine (Central Ledger)
- Single transaction table powering all dashboards
- Transaction types: Income, Expense, Invoice, VAT Adjustment
- Each transaction captures: entity, date, gross/VAT/net amounts, VAT treatment (None / 15%), expense code, linked documents, created/modified by
- **No destructive edits**: changes create new versions; originals preserved in audit log
- Edit reason mandatory on modifications

### 5. Monthly Budget / Cashflow Dashboard
- Select any custom date range or month
- View: Total Income, Total Expenses, Net Available
- Actual vs Budgeted comparison
- Budget items linked to SARS expense codes with optional recurrence
- Independent of tax/VAT logic — purely a cashflow view

### 6. Income Tax Dashboard
- Default annual view: March–February
- Flexible: pull any custom date range
- Shows income totals, expenses grouped by SARS code, net taxable profit
- Recurring income/expense capture: select which months to auto-generate transactions

### 7. Audit Trail & Controls
- Every create/edit action logged: user, timestamp, before/after values, reason
- No hard deletes anywhere in the system
- Period locking: optional per entity; locked data requires adjustment entries
- Staff users restricted from deleting, closing periods, or exporting

### 8. Dashboard & Navigation
- Clean sidebar navigation with entity selector
- Overview dashboard showing key financial KPIs
- Quick-access cards for transactions, budgets, tax view
- Professional white/gray design with accent colors

---

## Phase 2 (Future Iterations)
These modules will be added after Phase 1 is stable:

- **Invoice Generator & Tracking** — Sequential numbering, PDF generation, multi-client, VAT toggle, auto-posting to ledger
- **VAT Input/Output Dashboard** — Output from invoices, input from expenses, flexible date range reporting, submission marking
- **Vehicle Schedule** — Per-entity vehicle profiles, km tracking, business-use % calculation, SARS-ready export
- **Document Vault** — Entity → Year → Category structure, linked to transactions, searchable
- **Exports & Audit Packs** — CSV/Excel exports, full audit pack per entity per year (P&L, transactions, VAT, vehicle schedule, document register)

---

## Database Structure (Phase 1)
The backend will include tables for:
- Users & roles (with secure role checking)
- Entities (with VAT status, bank details)
- Expense codes (preloaded, non-deletable)
- Transactions (versioned, with full audit fields)
- Budget items (linked to expense codes)
- Audit log (all actions tracked)

All tables will have Row-Level Security policies ensuring entity isolation and role-based access.

