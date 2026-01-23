import { createHashRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";

// Layouts
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";

// Pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { OrdersPage } from "@/pages/orders";
import { TransactionsPage } from "@/pages/accounts/TransactionsPage";
import { AccountsPage } from "@/pages/accounts/AccountsPage";
import { CategoriesPage } from "@/pages/accounts/CategoriesPage";
import { VendorsPage } from "@/pages/accounts/VendorsPage";
import { LiabilityPage } from "@/pages/accounts/LiabilityPage";
import { InventoryPage } from "@/pages/inventory/InventoryPage";
import { VendorInventoryPage } from "@/pages/inventory/VendorInventoryPage";
import {
  BulkCustomersPage,
  QuotationsPage,
  InvoicesPage,
  ReportsPage,
} from "@/pages/bulk-orders";
import { BankAccountsPage } from "@/pages/bulk-orders/BankAccountsPage";
import { UsersPage } from "@/pages/users";

export const router = createHashRouter([
  {
    path: "/",
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "orders",
        element: (
          <RoleGuard allowedRoles={["superAdmin", "admin", "opertaionManager"]}>
            <OrdersPage />
          </RoleGuard>
        ),
      },
      {
        path: "bulk-customers",
        element: (
          <RoleGuard allowedRoles={["superAdmin", "admin", "bulkOrder"]}>
            <BulkCustomersPage />
          </RoleGuard>
        ),
      },
      {
        path: "quotations",
        element: (
          <RoleGuard allowedRoles={["superAdmin", "admin", "bulkOrder"]}>
            <QuotationsPage />
          </RoleGuard>
        ),
      },
      {
        path: "bank-accounts",
        element: (
          <RoleGuard allowedRoles={["superAdmin", "admin"]}>
            <BankAccountsPage />
          </RoleGuard>
        ),
      },
      {
        path: "invoices",
        element: (
          <RoleGuard allowedRoles={["superAdmin", "admin", "bulkOrder"]}>
            <InvoicesPage />
          </RoleGuard>
        ),
      },
      {
        path: "bulk-reports",
        element: (
          <RoleGuard allowedRoles={["superAdmin", "admin", "bulkOrder"]}>
            <ReportsPage />
          </RoleGuard>
        ),
      },
      {
        path: "transactions",
        element: (
          <RoleGuard allowedRoles={["admin", "superAdmin"]}>
            <TransactionsPage />
          </RoleGuard>
        ),
      },
      {
        path: "transactions/:transactionId",
        element: (
          <RoleGuard allowedRoles={["admin", "superAdmin"]}>
            <TransactionsPage />
          </RoleGuard>
        ),
      },
      {
        path: "accounts",
        element: (
          <RoleGuard allowedRoles={["admin", "superAdmin"]}>
            <AccountsPage />
          </RoleGuard>
        ),
      },
      {
        path: "categories",
        element: (
          <RoleGuard allowedRoles={["admin", "superAdmin"]}>
            <CategoriesPage />
          </RoleGuard>
        ),
      },
      {
        path: "vendors",
        element: (
          <RoleGuard allowedRoles={["admin", "superAdmin"]}>
            <VendorsPage />
          </RoleGuard>
        ),
      },
      {
        path: "liability",
        element: (
          <RoleGuard allowedRoles={["admin", "superAdmin"]}>
            <LiabilityPage />
          </RoleGuard>
        ),
      },
      {
        path: "inventory",
        element: (
          <RoleGuard allowedRoles={["admin", "superAdmin"]}>
            <InventoryPage />
          </RoleGuard>
        ),
      },
      {
        path: "vendor-inventory",
        element: (
          <RoleGuard allowedRoles={["admin", "superAdmin"]}>
            <VendorInventoryPage />
          </RoleGuard>
        ),
      },
      {
        path: "users",
        element: (
          <RoleGuard allowedRoles={["superAdmin"]}>
            <UsersPage />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
