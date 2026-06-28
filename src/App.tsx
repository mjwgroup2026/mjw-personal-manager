import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EntityProvider } from "@/contexts/EntityContext";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Entities from "@/pages/Entities";
import EntityForm from "@/pages/EntityForm";
import Transactions from "@/pages/Transactions";
import TransactionForm from "@/pages/TransactionForm";
import Budget from "@/pages/Budget";
import IncomeTax from "@/pages/IncomeTax";
import VAT from "@/pages/VAT";
import AuditLog from "@/pages/AuditLog";
import Documents from "@/pages/Documents";
import Invoices from "@/pages/Invoices";
import InvoiceForm from "@/pages/InvoiceForm";
import Properties from "@/pages/Properties";
import PropertyForm from "@/pages/PropertyForm";
import Tenants from "@/pages/Tenants";
import TenantForm from "@/pages/TenantForm";
import RentalLedger from "@/pages/RentalLedger";
import Customers from "@/pages/Customers";
import CustomerForm from "@/pages/CustomerForm";
import Suppliers from "@/pages/Suppliers";
import SupplierForm from "@/pages/SupplierForm";
import Vehicles from "@/pages/Vehicles";
import VehicleForm from "@/pages/VehicleForm";
import CSVImport from "@/pages/CSVImport";
import Reports from "@/pages/Reports";
import AppSettings from "@/pages/AppSettings";
import AdminPanel from "@/pages/AdminPanel";
import Subscription from "@/pages/Subscription";
import AccountDeletion from "@/pages/AccountDeletion";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import DataProtection from "@/pages/DataProtection";
import Security from "@/pages/Security";
import NotFound from "@/pages/NotFound";
import Install from "@/pages/Install";
import ComplianceSettings from "@/pages/ComplianceSettings";
import { useSubscription } from "@/hooks/useSubscription";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-sm text-muted-foreground font-body">Loading…</p></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

/** Wrapper that checks subscription state and redirects expired/none users to subscription page */
const SubscriptionGatedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state, loading } = useSubscription();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-sm text-muted-foreground font-body">Loading…</p></div>;

  // Allow subscription page access always
  return <>{children}</>;
};

const OwnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-sm text-muted-foreground font-body">Loading…</p></div>;
  if (role !== "owner") return <Navigate to="/app" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/data-protection" element={<DataProtection />} />
            <Route path="/security" element={<Security />} />
            <Route path="/account-deletion" element={<AccountDeletion />} />
            <Route path="/install" element={<Install />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <EntityProvider>
                    <AppLayout />
                  </EntityProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="entities" element={<Entities />} />
              <Route path="entities/new" element={<EntityForm />} />
              <Route path="entities/:id" element={<EntityForm />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/new" element={<CustomerForm />} />
              <Route path="customers/:id" element={<CustomerForm />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="suppliers/new" element={<SupplierForm />} />
              <Route path="suppliers/:id" element={<SupplierForm />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="transactions/new" element={<TransactionForm />} />
              <Route path="transactions/:id" element={<TransactionForm />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/:id" element={<InvoiceForm />} />
              <Route path="documents" element={<Documents />} />
              <Route path="imports" element={<CSVImport />} />
              <Route path="budget" element={<Budget />} />
              <Route path="vat" element={<VAT />} />
              <Route path="tax" element={<IncomeTax />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="vehicles/new" element={<VehicleForm />} />
              <Route path="vehicles/:id" element={<VehicleForm />} />
              <Route path="properties" element={<Properties />} />
              <Route path="properties/new" element={<PropertyForm />} />
              <Route path="properties/:id" element={<PropertyForm />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="tenants/new" element={<TenantForm />} />
              <Route path="tenants/:id" element={<TenantForm />} />
              <Route path="rental-ledger" element={<RentalLedger />} />
              <Route path="reports" element={<Reports />} />
              <Route path="audit-log" element={<AuditLog />} />
              <Route path="settings" element={<AppSettings />} />
              <Route path="admin" element={<OwnerRoute><AdminPanel /></OwnerRoute>} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="account-deletion" element={<AccountDeletion />} />
              <Route path="compliance" element={<ComplianceSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
