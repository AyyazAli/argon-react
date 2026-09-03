import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores'
import penhouseLogo from '@/assets/penhouse-logo.png'

// Map business names to their logo assets. Add more here as logos become available.
const BUSINESS_LOGOS: Record<string, string> = {
  penhouse: penhouseLogo,
}
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  FolderTree,
  Receipt,
  Building2,
  Scale,
  Package,
  Boxes,
  FileText,
  FileCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ScanLine,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { ACCESS } from '@/lib/roles'

interface NavEntry {
  path: string
  title: string
  icon: React.ReactNode
  roles?: readonly string[]
}

interface NavGroup {
  title: string
  icon: React.ReactNode
  roles?: readonly string[]
  children: NavEntry[]
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const navGroups: NavGroup[] = [
  {
    title: 'Main',
    icon: <LayoutDashboard className="size-5" />,
    children: [
      {
        path: '/dashboard',
        title: 'Dashboard',
        icon: <LayoutDashboard className="size-5" />,
      },
      {
        path: '/orders',
        title: 'Orders',
        icon: <ShoppingCart className="size-5" />,
        roles: ACCESS.orders,
      },
    ],
  },
  {
    title: 'Accounts',
    icon: <Wallet className="size-5" />,
    roles: ACCESS.accounts,
    children: [
      {
        path: '/accounts',
        title: 'Accounts',
        icon: <Wallet className="size-5" />,
        roles: ACCESS.accounts,
      },
      {
        path: '/categories',
        title: 'Categories',
        icon: <FolderTree className="size-5" />,
        roles: ACCESS.accounts,
      },
      {
        path: '/transactions',
        title: 'Transactions',
        icon: <Receipt className="size-5" />,
        roles: ACCESS.accounts,
      },
      {
        path: '/vendors',
        title: 'Vendors',
        icon: <Building2 className="size-5" />,
        roles: ACCESS.accounts,
      },
      {
        path: '/liability',
        title: 'Liability',
        icon: <Scale className="size-5" />,
        roles: ACCESS.accounts,
      },
      {
        path: '/accounts-reports',
        title: 'Reports',
        icon: <BarChart3 className="size-5" />,
        roles: ACCESS.accounts,
      },
    ],
  },
  {
    title: 'Inventory',
    icon: <Package className="size-5" />,
    roles: ACCESS.inventory,
    children: [
      {
        path: '/inventory',
        title: 'Dashboard',
        icon: <LayoutDashboard className="size-5" />,
        roles: ACCESS.inventory,
      },
      {
        path: '/inventory/scan',
        title: 'Scan / Stock Actions',
        icon: <ScanLine className="size-5" />,
        roles: ACCESS.inventory,
      },
      {
        path: '/inventory/products',
        title: 'Products',
        icon: <Package className="size-5" />,
        roles: ACCESS.inventory,
      },
      {
        path: '/inventory/order-issues',
        title: 'Order Stock Issues',
        icon: <AlertTriangle className="size-5" />,
        roles: ACCESS.inventory,
      },
      {
        path: '/inventory/movements',
        title: 'Stock Movements',
        icon: <Receipt className="size-5" />,
        roles: ACCESS.inventory,
      },
      {
        path: '/inventory/categories',
        title: 'Categories',
        icon: <FolderTree className="size-5" />,
        roles: ACCESS.inventoryAdmin,
      },
      {
        path: '/inventory/warehouses',
        title: 'Warehouses',
        icon: <Boxes className="size-5" />,
        roles: ACCESS.inventoryAdmin,
      },
    ],
  },
  {
    title: 'Bulk Orders',
    icon: <Boxes className="size-5" />,
    roles: ACCESS.bulkOrders,
    children: [
      {
        path: '/bulk-customers',
        title: 'Bulk Customers',
        icon: <Building2 className="size-5" />,
        roles: ACCESS.bulkOrders,
      },
      {
        path: '/quotations',
        title: 'Quotations',
        icon: <FileText className="size-5" />,
        roles: ACCESS.bulkOrders,
      },
      {
        path: '/invoices',
        title: 'Invoices',
        icon: <FileCheck className="size-5" />,
        roles: ACCESS.bulkOrders,
      },
      {
        path: '/bank-accounts',
        title: 'Bank Accounts',
        icon: <Building2 className="size-5" />,
        roles: ACCESS.bulkBankAccounts,
      },
      {
        path: '/bulk-reports',
        title: 'Reports',
        icon: <BarChart3 className="size-5" />,
        roles: ACCESS.bulkReports,
      },
    ],
  },
  {
    title: 'Administration',
    icon: <Users className="size-5" />,
    roles: ACCESS.users,
    children: [
      {
        path: '/users',
        title: 'Users',
        icon: <Users className="size-5" />,
        roles: ACCESS.users,
      },
      {
        path: '/order-reports',
        title: 'Order Reports',
        icon: <BarChart3 className="size-5" />,
        roles: ACCESS.orderReports,
      },
    ],
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { roles, business, hasRole } = useAuthStore()
  const businessLogo = business ? BUSINESS_LOGOS[business.toLowerCase()] : undefined
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const hasAccess = (allowedRoles?: readonly string[]) => {
    if (!allowedRoles || allowedRoles.length === 0) return true
    return hasRole(...allowedRoles)
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Auto-expand groups that contain the active route
  useEffect(() => {
    const activeGroup = navGroups.find((group) => {
      if (!hasAccess(group.roles)) return false
      return group.children.some(
        (child) => hasAccess(child.roles) && isActive(child.path)
      )
    })

    if (activeGroup) {
      setExpandedGroups((prev) => new Set(prev).add(activeGroup.title))
    }
  }, [location.pathname, roles])

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle)
      } else {
        newSet.add(groupTitle)
      }
      return newSet
    })
  }

  const isGroupExpanded = (groupTitle: string) => {
    return expandedGroups.has(groupTitle)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            businessLogo
              ? <img src={businessLogo} alt={business ?? 'Portal'} className="h-8 w-auto object-contain" />
              : <h2 className="text-lg font-semibold">Argon Portal</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {navGroups.map((group) => {
              if (!hasAccess(group.roles)) return null

              const visibleChildren = group.children.filter((child) =>
                hasAccess(child.roles)
              )

              if (visibleChildren.length === 0) return null

              const isExpanded = isGroupExpanded(group.title)

              return (
                <div key={group.title} className="space-y-1">
                  {!isCollapsed ? (
                    <>
                      <button
                        onClick={() => toggleGroup(group.title)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <span className="flex items-center gap-2">
                          <span className="size-5">{group.icon}</span>
                          <span>{group.title}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="space-y-1">
                          {visibleChildren.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive(item.path)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              <span className={cn(isActive(item.path) && 'text-primary-foreground')}>
                                {item.icon}
                              </span>
                              <span>{item.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1">
                      {visibleChildren.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            'flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive(item.path)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                          title={item.title}
                        >
                          <span className={cn(isActive(item.path) && 'text-primary-foreground')}>
                            {item.icon}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>
      </div>
    </aside>
  )
}
