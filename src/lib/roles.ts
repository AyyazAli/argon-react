/**
 * Single source of truth for roles and module access.
 *
 * IMPORTANT: these string values must match exactly what the backend stores in
 * `user.businessAccess[].role` and checks in its route middleware. Do not inline
 * role strings elsewhere — import from here so the allow-lists can never drift
 * (a past bug: "operationManager" was checked as the typo "opertaionManager").
 */
export const ROLES = {
  superAdmin: 'superAdmin',
  admin: 'admin',
  operationManager: 'operationManager',
  bulkOrder: 'bulkOrder',
  financeManager: 'financeManager',
  inventoryOperator: 'inventoryOperator',
  user: 'user',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/** Roles that can be assigned to a user in the Users admin UI. */
export const ASSIGNABLE_ROLES: { value: Role; label: string }[] = [
  { value: ROLES.user, label: 'User' },
  { value: ROLES.admin, label: 'Admin' },
  { value: ROLES.superAdmin, label: 'Super Admin' },
  { value: ROLES.bulkOrder, label: 'Bulk Order' },
  { value: ROLES.operationManager, label: 'Operation Manager' },
  { value: ROLES.financeManager, label: 'Finance Manager' },
  { value: ROLES.inventoryOperator, label: 'Inventory Operator' },
]

/**
 * Module → allowed roles. Used by the router (RoleGuard) and the sidebar.
 * Dashboard is intentionally absent (visible to every authenticated user).
 */
export const ACCESS = {
  orders: [ROLES.superAdmin, ROLES.admin, ROLES.operationManager],

  // Bulk Orders core (create quotes/invoices/customers)
  bulkOrders: [ROLES.superAdmin, ROLES.admin, ROLES.bulkOrder],
  // Bulk Orders restricted sub-sections
  bulkBankAccounts: [ROLES.superAdmin, ROLES.admin],
  bulkReports: [ROLES.superAdmin, ROLES.admin],

  // Accounts / Finance (admin intentionally excluded)
  accounts: [ROLES.superAdmin, ROLES.financeManager],

  // Inventory: operators can scan / receive / deduct / count and read;
  // only inventoryAdmin can edit products, prices, categories, warehouses,
  // import/export. Mirrors backend/utils/roles.js.
  inventory: [ROLES.superAdmin, ROLES.admin, ROLES.inventoryOperator],
  inventoryAdmin: [ROLES.superAdmin, ROLES.admin],

  users: [ROLES.superAdmin],

  // Order user-activity reports — superAdmin only.
  orderReports: [ROLES.superAdmin],
} as const
