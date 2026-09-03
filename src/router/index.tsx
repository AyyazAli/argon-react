import { createHashRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ACCESS } from "@/lib/roles";

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
import { AccountsReportsPage } from "@/pages/accounts/AccountsReportsPage";
import {
  InventoryDashboardPage,
  ProductsPage,
  ProductDetailPage,
  StockMovementsPage,
  InventoryCategoriesPage,
  WarehousesPage,
  ScanPage,
  OrderStockIssuesPage,
} from "@/pages/inventory";
import {
  BulkCustomersPage,
  QuotationsPage,
  InvoicesPage,
  ReportsPage,
} from "@/pages/bulk-orders";
import { BankAccountsPage } from "@/pages/bulk-orders/BankAccountsPage";
import { UsersPage } from "@/pages/users";
import { OrderReportsPage } from "@/pages/orders-reports";

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
          <RoleGuard allowedRoles={ACCESS.orders}>
            <OrdersPage />
          </RoleGuard>
        ),
      },
      {
        path: "bulk-customers",
        element: (
          <RoleGuard allowedRoles={ACCESS.bulkOrders}>
            <BulkCustomersPage />
          </RoleGuard>
        ),
      },
      {
        path: "quotations",
        element: (
          <RoleGuard allowedRoles={ACCESS.bulkOrders}>
            <QuotationsPage />
          </RoleGuard>
        ),
      },
      {
        path: "bank-accounts",
        element: (
          <RoleGuard allowedRoles={ACCESS.bulkBankAccounts}>
            <BankAccountsPage />
          </RoleGuard>
        ),
      },
      {
        path: "invoices",
        element: (
          <RoleGuard allowedRoles={ACCESS.bulkOrders}>
            <InvoicesPage />
          </RoleGuard>
        ),
      },
      {
        path: "bulk-reports",
        element: (
          <RoleGuard allowedRoles={ACCESS.bulkReports}>
            <ReportsPage />
          </RoleGuard>
        ),
      },
      {
        path: "transactions",
        element: (
          <RoleGuard allowedRoles={ACCESS.accounts}>
            <TransactionsPage />
          </RoleGuard>
        ),
      },
      {
        path: "transactions/:transactionId",
        element: (
          <RoleGuard allowedRoles={ACCESS.accounts}>
            <TransactionsPage />
          </RoleGuard>
        ),
      },
      {
        path: "accounts",
        element: (
          <RoleGuard allowedRoles={ACCESS.accounts}>
            <AccountsPage />
          </RoleGuard>
        ),
      },
      {
        path: "categories",
        element: (
          <RoleGuard allowedRoles={ACCESS.accounts}>
            <CategoriesPage />
          </RoleGuard>
        ),
      },
      {
        path: "vendors",
        element: (
          <RoleGuard allowedRoles={ACCESS.accounts}>
            <VendorsPage />
          </RoleGuard>
        ),
      },
      {
        path: "liability",
        element: (
          <RoleGuard allowedRoles={ACCESS.accounts}>
            <LiabilityPage />
          </RoleGuard>
        ),
      },
      {
        path: "accounts-reports",
        element: (
          <RoleGuard allowedRoles={ACCESS.accounts}>
            <AccountsReportsPage />
          </RoleGuard>
        ),
      },
      {
        path: "inventory",
        element: (
          <RoleGuard allowedRoles={ACCESS.inventory}>
            <InventoryDashboardPage />
          </RoleGuard>
        ),
      },
      {
        path: "inventory/scan",
        element: (
          <RoleGuard allowedRoles={ACCESS.inventory}>
            <ScanPage />
          </RoleGuard>
        ),
      },
      {
        path: "inventory/order-issues",
        element: (
          <RoleGuard allowedRoles={ACCESS.inventory}>
            <OrderStockIssuesPage />
          </RoleGuard>
        ),
      },
      {
        path: "inventory/products",
        element: (
          <RoleGuard allowedRoles={ACCESS.inventory}>
            <ProductsPage />
          </RoleGuard>
        ),
      },
      {
        path: "inventory/products/:productId",
        element: (
          <RoleGuard allowedRoles={ACCESS.inventory}>
            <ProductDetailPage />
          </RoleGuard>
        ),
      },
      {
        path: "inventory/movements",
        element: (
          <RoleGuard allowedRoles={ACCESS.inventory}>
            <StockMovementsPage />
          </RoleGuard>
        ),
      },
      {
        path: "inventory/categories",
        element: (
          <RoleGuard allowedRoles={ACCESS.inventoryAdmin}>
            <InventoryCategoriesPage />
          </RoleGuard>
        ),
      },
      {
        path: "inventory/warehouses",
        element: (
          <RoleGuard allowedRoles={ACCESS.inventoryAdmin}>
            <WarehousesPage />
          </RoleGuard>
        ),
      },
      {
        path: "users",
        element: (
          <RoleGuard allowedRoles={ACCESS.users}>
            <UsersPage />
          </RoleGuard>
        ),
      },
      {
        path: "order-reports",
        element: (
          <RoleGuard allowedRoles={ACCESS.orderReports}>
            <OrderReportsPage />
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
