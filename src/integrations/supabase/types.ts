export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          amount: number
          budget_type: Database["public"]["Enums"]["transaction_type"]
          created_at: string
          created_by: string
          description: string
          entity_id: string
          expense_code_id: string | null
          id: string
          is_deleted: boolean
          is_recurring: boolean
          month: string
          updated_at: string
        }
        Insert: {
          amount?: number
          budget_type?: Database["public"]["Enums"]["transaction_type"]
          created_at?: string
          created_by: string
          description: string
          entity_id: string
          expense_code_id?: string | null
          id?: string
          is_deleted?: boolean
          is_recurring?: boolean
          month: string
          updated_at?: string
        }
        Update: {
          amount?: number
          budget_type?: Database["public"]["Enums"]["transaction_type"]
          created_at?: string
          created_by?: string
          description?: string
          entity_id?: string
          expense_code_id?: string | null
          id?: string
          is_deleted?: boolean
          is_recurring?: boolean
          month?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_expense_code_id_fkey"
            columns: ["expense_code_id"]
            isOneToOne: false
            referencedRelation: "expense_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_consents: {
        Row: {
          consent_status: string
          created_at: string
          id: string
          ip_address: string | null
          policy_version: string
          user_email: string
          user_id: string
        }
        Insert: {
          consent_status?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          policy_version?: string
          user_email: string
          user_id: string
        }
        Update: {
          consent_status?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          policy_version?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      csv_import_batches: {
        Row: {
          bank_format: string | null
          created_at: string
          created_by: string
          entity_id: string
          file_name: string
          id: string
          imported_count: number | null
          row_count: number | null
          status: string
        }
        Insert: {
          bank_format?: string | null
          created_at?: string
          created_by: string
          entity_id: string
          file_name: string
          id?: string
          imported_count?: number | null
          row_count?: number | null
          status?: string
        }
        Update: {
          bank_format?: string | null
          created_at?: string
          created_by?: string
          entity_id?: string
          file_name?: string
          id?: string
          imported_count?: number | null
          row_count?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "csv_import_batches_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_import_rows: {
        Row: {
          batch_id: string
          created_at: string
          duplicate_flag: boolean
          id: string
          mapped_amount: number | null
          mapped_date: string | null
          mapped_description: string | null
          mapped_type: string | null
          posted_transaction_id: string | null
          raw_data: Json
          row_index: number
          status: string
          suggested_code_id: string | null
          suggested_customer_id: string | null
          suggested_supplier_id: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          duplicate_flag?: boolean
          id?: string
          mapped_amount?: number | null
          mapped_date?: string | null
          mapped_description?: string | null
          mapped_type?: string | null
          posted_transaction_id?: string | null
          raw_data?: Json
          row_index?: number
          status?: string
          suggested_code_id?: string | null
          suggested_customer_id?: string | null
          suggested_supplier_id?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          duplicate_flag?: boolean
          id?: string
          mapped_amount?: number | null
          mapped_date?: string | null
          mapped_description?: string | null
          mapped_type?: string | null
          posted_transaction_id?: string | null
          raw_data?: Json
          row_index?: number
          status?: string
          suggested_code_id?: string | null
          suggested_customer_id?: string | null
          suggested_supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "csv_import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "csv_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_rows_posted_transaction_id_fkey"
            columns: ["posted_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_rows_suggested_code_id_fkey"
            columns: ["suggested_code_id"]
            isOneToOne: false
            referencedRelation: "expense_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_rows_suggested_customer_id_fkey"
            columns: ["suggested_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csv_import_rows_suggested_supplier_id_fkey"
            columns: ["suggested_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          email: string | null
          entity_id: string
          id: string
          is_deleted: boolean
          name: string
          notes: string | null
          phone: string | null
          registration_number: string | null
          trading_name: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          entity_id: string
          id?: string
          is_deleted?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          registration_number?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          entity_id?: string
          id?: string
          is_deleted?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          registration_number?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          confirmation_log: Json | null
          created_at: string
          deleted_at: string | null
          id: string
          processed_at: string | null
          reason: string | null
          requested_at: string
          retention_hold_reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          confirmation_log?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          retention_hold_reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          confirmation_log?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          processed_at?: string | null
          reason?: string | null
          requested_at?: string
          retention_hold_reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          document_id: string
          edit_reason: string
          file_path: string
          id: string
          replaced_at: string
          replaced_by: string | null
        }
        Insert: {
          document_id: string
          edit_reason: string
          file_path: string
          id?: string
          replaced_at?: string
          replaced_by?: string | null
        }
        Update: {
          document_id?: string
          edit_reason?: string
          file_path?: string
          id?: string
          replaced_at?: string
          replaced_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          entity_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_deleted: boolean
          tags: string[] | null
          tax_year: string | null
          transaction_id: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          entity_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_deleted?: boolean
          tags?: string[] | null
          tax_year?: string | null
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          entity_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_deleted?: boolean
          tags?: string[] | null
          tax_year?: string | null
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          bank_account_number: string | null
          bank_account_type: string | null
          bank_branch_code: string | null
          bank_name: string | null
          contact_email: string | null
          created_at: string
          created_by: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          income_tax_reference: string | null
          invoice_accent_color: string | null
          invoice_font: string | null
          invoice_layout: string | null
          invoice_prefix: string
          is_deleted: boolean
          legal_name: string
          logo_url: string | null
          next_invoice_number: number
          physical_address: string | null
          registration_number: string | null
          trading_name: string | null
          updated_at: string
          vat_filing_frequency: string | null
          vat_number: string | null
          vat_registration_date: string | null
          vat_status: Database["public"]["Enums"]["vat_status"]
        }
        Insert: {
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch_code?: string | null
          bank_name?: string | null
          contact_email?: string | null
          created_at?: string
          created_by: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          income_tax_reference?: string | null
          invoice_accent_color?: string | null
          invoice_font?: string | null
          invoice_layout?: string | null
          invoice_prefix?: string
          is_deleted?: boolean
          legal_name: string
          logo_url?: string | null
          next_invoice_number?: number
          physical_address?: string | null
          registration_number?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_filing_frequency?: string | null
          vat_number?: string | null
          vat_registration_date?: string | null
          vat_status?: Database["public"]["Enums"]["vat_status"]
        }
        Update: {
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch_code?: string | null
          bank_name?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          income_tax_reference?: string | null
          invoice_accent_color?: string | null
          invoice_font?: string | null
          invoice_layout?: string | null
          invoice_prefix?: string
          is_deleted?: boolean
          legal_name?: string
          logo_url?: string | null
          next_invoice_number?: number
          physical_address?: string | null
          registration_number?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_filing_frequency?: string | null
          vat_number?: string | null
          vat_registration_date?: string | null
          vat_status?: Database["public"]["Enums"]["vat_status"]
        }
        Relationships: []
      }
      entity_members: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_members_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_codes: {
        Row: {
          audit_note_required: boolean
          code: string
          code_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          provisional_inclusion: boolean
          sort_order: number
          tax_behavior: string
          vat_behavior: string
          vat201_mapping: string | null
        }
        Insert: {
          audit_note_required?: boolean
          code: string
          code_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          provisional_inclusion?: boolean
          sort_order?: number
          tax_behavior?: string
          vat_behavior?: string
          vat201_mapping?: string | null
        }
        Update: {
          audit_note_required?: boolean
          code?: string
          code_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          provisional_inclusion?: boolean
          sort_order?: number
          tax_behavior?: string
          vat_behavior?: string
          vat201_mapping?: string | null
        }
        Relationships: []
      }
      income_tax_summaries: {
        Row: {
          capital_items: number | null
          created_at: string
          created_by: string
          deductible_expenses: number | null
          disallowed_expenses: number | null
          entity_id: string
          gross_taxable_income: number | null
          id: string
          month: string
          net_taxable_result: number | null
          notes: string | null
          review_status: string
          tax_year: string
          updated_at: string
          vehicle_adjustments: number | null
        }
        Insert: {
          capital_items?: number | null
          created_at?: string
          created_by: string
          deductible_expenses?: number | null
          disallowed_expenses?: number | null
          entity_id: string
          gross_taxable_income?: number | null
          id?: string
          month: string
          net_taxable_result?: number | null
          notes?: string | null
          review_status?: string
          tax_year: string
          updated_at?: string
          vehicle_adjustments?: number | null
        }
        Update: {
          capital_items?: number | null
          created_at?: string
          created_by?: string
          deductible_expenses?: number | null
          disallowed_expenses?: number | null
          entity_id?: string
          gross_taxable_income?: number | null
          id?: string
          month?: string
          net_taxable_result?: number | null
          notes?: string | null
          review_status?: string
          tax_year?: string
          updated_at?: string
          vehicle_adjustments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "income_tax_summaries_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_clients: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          email: string | null
          entity_id: string
          id: string
          name: string
          registration_number: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          entity_id: string
          id?: string
          name: string
          registration_number?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          entity_id?: string
          id?: string
          name?: string
          registration_number?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_clients_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          description: string
          discount: number
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          sort_order: number
          unit_price: number
          vat_percentage: number
        }
        Insert: {
          description: string
          discount?: number
          id?: string
          invoice_id: string
          line_total?: number
          quantity?: number
          sort_order?: number
          unit_price?: number
          vat_percentage?: number
        }
        Update: {
          description?: string
          discount?: number
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          sort_order?: number
          unit_price?: number
          vat_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          due_date: string | null
          entity_id: string
          grand_total: number
          id: string
          invoice_number: string
          is_deleted: boolean
          issue_date: string
          notes: string | null
          payment_terms: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          updated_at: string
          updated_by: string | null
          vat_applicable: boolean
          vat_percentage: number
          vat_total: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          due_date?: string | null
          entity_id: string
          grand_total?: number
          id?: string
          invoice_number: string
          is_deleted?: boolean
          issue_date?: string
          notes?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          updated_at?: string
          updated_by?: string | null
          vat_applicable?: boolean
          vat_percentage?: number
          vat_total?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          due_date?: string | null
          entity_id?: string
          grand_total?: number
          id?: string
          invoice_number?: string
          is_deleted?: boolean
          issue_date?: string
          notes?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          updated_at?: string
          updated_by?: string | null
          vat_applicable?: boolean
          vat_percentage?: number
          vat_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "invoice_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      period_locks: {
        Row: {
          entity_id: string
          id: string
          locked_at: string
          locked_by: string
          locked_month: string
        }
        Insert: {
          entity_id: string
          id?: string
          locked_at?: string
          locked_by: string
          locked_month: string
        }
        Update: {
          entity_id?: string
          id?: string
          locked_at?: string
          locked_by?: string
          locked_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "period_locks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_code_expires_at: string | null
          access_code_hash: string | null
          access_status: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_code_expires_at?: string | null
          access_code_hash?: string | null
          access_status?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_code_expires_at?: string | null
          access_code_hash?: string | null
          access_status?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          bond_amount: number | null
          bond_interest_rate: number | null
          created_at: string
          entity_id: string
          id: string
          is_deleted: boolean
          municipality: string | null
          notes: string | null
          physical_address: string | null
          property_name: string
          purchase_date: string | null
          purchase_price: number | null
          rates_account_number: string | null
          updated_at: string
        }
        Insert: {
          bond_amount?: number | null
          bond_interest_rate?: number | null
          created_at?: string
          entity_id: string
          id?: string
          is_deleted?: boolean
          municipality?: string | null
          notes?: string | null
          physical_address?: string | null
          property_name: string
          purchase_date?: string | null
          purchase_price?: number | null
          rates_account_number?: string | null
          updated_at?: string
        }
        Update: {
          bond_amount?: number | null
          bond_interest_rate?: number | null
          created_at?: string
          entity_id?: string
          id?: string
          is_deleted?: boolean
          municipality?: string | null
          notes?: string | null
          physical_address?: string | null
          property_name?: string
          purchase_date?: string | null
          purchase_price?: number | null
          rates_account_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_income: {
        Row: {
          arrears: number
          created_at: string
          id: string
          month: string
          property_id: string
          rental_due: number
          rental_received: number
          tenant_id: string | null
        }
        Insert: {
          arrears?: number
          created_at?: string
          id?: string
          month: string
          property_id: string
          rental_due?: number
          rental_received?: number
          tenant_id?: string | null
        }
        Update: {
          arrears?: number
          created_at?: string
          id?: string
          month?: string
          property_id?: string
          rental_due?: number
          rental_received?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_income_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_income_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_status: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          renewed_at: string | null
          started_at: string
          status: string
          store_provider: string | null
          store_transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          renewed_at?: string | null
          started_at?: string
          status?: string
          store_provider?: string | null
          store_transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          renewed_at?: string | null
          started_at?: string
          status?: string
          store_provider?: string | null
          store_transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          email: string | null
          entity_id: string
          id: string
          is_deleted: boolean
          name: string
          notes: string | null
          phone: string | null
          registration_number: string | null
          trading_name: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          entity_id: string
          id?: string
          is_deleted?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          registration_number?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          entity_id?: string
          id?: string
          is_deleted?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          registration_number?: string | null
          trading_name?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          deposit_amount: number | null
          deposit_held: boolean
          escalation_percent: number | null
          id: string
          is_deleted: boolean
          lease_end: string | null
          lease_start: string | null
          monthly_rental: number
          property_id: string
          tenant_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number | null
          deposit_held?: boolean
          escalation_percent?: number | null
          id?: string
          is_deleted?: boolean
          lease_end?: string | null
          lease_start?: string | null
          monthly_rental?: number
          property_id: string
          tenant_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number | null
          deposit_held?: boolean
          escalation_percent?: number | null
          id?: string
          is_deleted?: boolean
          lease_end?: string | null
          lease_start?: string | null
          monthly_rental?: number
          property_id?: string
          tenant_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string | null
          date: string
          description: string
          document_id: string | null
          edit_reason: string | null
          entity_id: string
          expense_code_id: string | null
          gross_amount: number
          id: string
          is_current: boolean
          is_recurring: boolean
          modified_by: string | null
          net_amount: number
          parent_transaction_id: string | null
          payment_status: string
          recurring_months: number[] | null
          reference_number: string | null
          reporting_month: string | null
          source_type: string
          sub_description: string | null
          supplier_id: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          vat_amount: number
          vat_treatment: Database["public"]["Enums"]["vat_treatment"]
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id?: string | null
          date?: string
          description: string
          document_id?: string | null
          edit_reason?: string | null
          entity_id: string
          expense_code_id?: string | null
          gross_amount?: number
          id?: string
          is_current?: boolean
          is_recurring?: boolean
          modified_by?: string | null
          net_amount?: number
          parent_transaction_id?: string | null
          payment_status?: string
          recurring_months?: number[] | null
          reference_number?: string | null
          reporting_month?: string | null
          source_type?: string
          sub_description?: string | null
          supplier_id?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          vat_amount?: number
          vat_treatment?: Database["public"]["Enums"]["vat_treatment"]
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string | null
          date?: string
          description?: string
          document_id?: string | null
          edit_reason?: string | null
          entity_id?: string
          expense_code_id?: string | null
          gross_amount?: number
          id?: string
          is_current?: boolean
          is_recurring?: boolean
          modified_by?: string | null
          net_amount?: number
          parent_transaction_id?: string | null
          payment_status?: string
          recurring_months?: number[] | null
          reference_number?: string | null
          reporting_month?: string | null
          source_type?: string
          sub_description?: string | null
          supplier_id?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          vat_amount?: number
          vat_treatment?: Database["public"]["Enums"]["vat_treatment"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_expense_code_id_fkey"
            columns: ["expense_code_id"]
            isOneToOne: false
            referencedRelation: "expense_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vat_periods: {
        Row: {
          created_at: string
          created_by: string
          entity_id: string
          id: string
          input_vat: number | null
          net_vat: number | null
          notes: string | null
          output_vat: number | null
          period_end: string
          period_start: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          entity_id: string
          id?: string
          input_vat?: number | null
          net_vat?: number | null
          notes?: string | null
          output_vat?: number | null
          period_end: string
          period_start: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          entity_id?: string
          id?: string
          input_vat?: number | null
          net_vat?: number | null
          notes?: string | null
          output_vat?: number | null
          period_end?: string
          period_start?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vat_periods_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_claims: {
        Row: {
          business_km: number | null
          closing_odo: number | null
          created_at: string
          created_by: string
          finance_interest: number | null
          fuel: number | null
          id: string
          insurance: number | null
          licence: number | null
          maintenance: number | null
          month: string
          notes: string | null
          opening_odo: number | null
          parking_tolls: number | null
          private_km: number | null
          tracking: number | null
          tyres: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          business_km?: number | null
          closing_odo?: number | null
          created_at?: string
          created_by: string
          finance_interest?: number | null
          fuel?: number | null
          id?: string
          insurance?: number | null
          licence?: number | null
          maintenance?: number | null
          month: string
          notes?: string | null
          opening_odo?: number | null
          parking_tolls?: number | null
          private_km?: number | null
          tracking?: number | null
          tyres?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          business_km?: number | null
          closing_odo?: number | null
          created_at?: string
          created_by?: string
          finance_interest?: number | null
          fuel?: number | null
          id?: string
          insurance?: number | null
          licence?: number | null
          maintenance?: number | null
          month?: string
          notes?: string | null
          opening_odo?: number | null
          parking_tolls?: number | null
          private_km?: number | null
          tracking?: number | null
          tyres?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_claims_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_rentals: {
        Row: {
          created_at: string
          created_by: string
          finance_interest: number | null
          id: string
          insurance: number | null
          licence: number | null
          maintenance: number | null
          month: string
          notes: string | null
          other_costs: number | null
          rental_income: number | null
          repairs: number | null
          tracking: number | null
          tyres: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          finance_interest?: number | null
          id?: string
          insurance?: number | null
          licence?: number | null
          maintenance?: number | null
          month: string
          notes?: string | null
          other_costs?: number | null
          rental_income?: number | null
          repairs?: number | null
          tracking?: number | null
          tyres?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          finance_interest?: number | null
          id?: string
          insurance?: number | null
          licence?: number | null
          maintenance?: number | null
          month?: string
          notes?: string | null
          other_costs?: number | null
          rental_income?: number | null
          repairs?: number | null
          tracking?: number | null
          tyres?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_rentals_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          created_by: string
          description: string
          entity_id: string
          finance_amount: number | null
          id: string
          is_deleted: boolean
          make: string | null
          model: string | null
          purchase_date: string | null
          purchase_price: number | null
          registration_number: string | null
          updated_at: string
          vehicle_type: string
          year: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          entity_id: string
          finance_amount?: number | null
          id?: string
          is_deleted?: boolean
          make?: string | null
          model?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          registration_number?: string | null
          updated_at?: string
          vehicle_type?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          entity_id?: string
          finance_amount?: number | null
          id?: string
          is_deleted?: boolean
          make?: string | null
          model?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          registration_number?: string | null
          updated_at?: string
          vehicle_type?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_entity_member: {
        Args: { _entity_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "staff" | "accountant" | "viewer"
      entity_type: "personal" | "sole_prop" | "pty_ltd" | "trust" | "landlord"
      invoice_status: "draft" | "issued" | "paid" | "cancelled"
      transaction_type: "income" | "expense" | "invoice" | "vat_adjustment"
      vat_status: "not_registered" | "registered" | "pending"
      vat_treatment: "none" | "standard"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "staff", "accountant", "viewer"],
      entity_type: ["personal", "sole_prop", "pty_ltd", "trust", "landlord"],
      invoice_status: ["draft", "issued", "paid", "cancelled"],
      transaction_type: ["income", "expense", "invoice", "vat_adjustment"],
      vat_status: ["not_registered", "registered", "pending"],
      vat_treatment: ["none", "standard"],
    },
  },
} as const
