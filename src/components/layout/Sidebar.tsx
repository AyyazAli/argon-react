import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores'
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
} from 'lucide-react'
import { Button } from '@/components/ui'

interface NavEntry {
  path: string
  title: string
  icon: React.ReactNode
  roles?: string[]
}

interface NavGroup {
  title: string
  icon: React.ReactNode
  roles?: string[]
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
        roles: ['superAdmin', 'admin', 'opertaionManager'],
      },
    ],
  },
  {
    title: 'Accounts',
    icon: <Wallet className="size-5" />,
    roles: ['admin', 'superAdmin'],
    children: [
      {
        path: '/accounts',
        title: 'Accounts',
        icon: <Wallet className="size-5" />,
        roles: ['admin', 'superAdmin'],
      },
      {
        path: '/categories',
        title: 'Categories',
        icon: <FolderTree className="size-5" />,
        roles: ['admin', 'superAdmin'],
      },
      {
        path: '/transactions',
        title: 'Transactions',
        icon: <Receipt className="size-5" />,
        roles: ['admin', 'superAdmin'],
      },
      {
        path: '/vendors',
        title: 'Vendors',
        icon: <Building2 className="size-5" />,
        roles: ['admin', 'superAdmin'],
      },
      {
        path: '/liability',
        title: 'Liability',
        icon: <Scale className="size-5" />,
        roles: ['admin', 'superAdmin'],
      },
    ],
  },
  {
    title: 'Inventory',
    icon: <Package className="size-5" />,
    roles: ['admin', 'superAdmin'],
    children: [
      {
        path: '/inventory',
        title: 'Inventory',
        icon: <Package className="size-5" />,
        roles: ['admin', 'superAdmin'],
      },
      {
        path: '/vendor-inventory',
        title: 'Vendor Inventory',
        icon: <Boxes className="size-5" />,
        roles: ['admin', 'superAdmin'],
      },
    ],
  },
  {
    title: 'Bulk Orders',
    icon: <Boxes className="size-5" />,
    roles: ['superAdmin', 'admin', 'bulkOrder'],
    children: [
      {
        path: '/bulk-customers',
        title: 'Bulk Customers',
        icon: <Building2 className="size-5" />,
        roles: ['superAdmin', 'admin', 'bulkOrder'],
      },
      {
        path: '/quotations',
        title: 'Quotations',
        icon: <FileText className="size-5" />,
        roles: ['superAdmin', 'admin', 'bulkOrder'],
      },
      {
        path: '/invoices',
        title: 'Invoices',
        icon: <FileCheck className="size-5" />,
        roles: ['superAdmin', 'admin', 'bulkOrder'],
      },
      {
        path: '/bank-accounts',
        title: 'Bank Accounts',
        icon: <Building2 className="size-5" />,
        roles: ['superAdmin', 'admin'],
      },
      {
        path: '/bulk-reports',
        title: 'Reports',
        icon: <BarChart3 className="size-5" />,
        roles: ['superAdmin', 'admin', 'bulkOrder'],
      },
    ],
  },
  {
    title: 'Administration',
    icon: <Users className="size-5" />,
    roles: ['superAdmin'],
    children: [
      {
        path: '/users',
        title: 'Users',
        icon: <Users className="size-5" />,
        roles: ['superAdmin'],
      },
    ],
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { role } = useAuthStore()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const hasAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true
    return role && roles.includes(role)
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
  }, [location.pathname, role])

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
            <h2 className="text-lg font-semibold">Argon Portal</h2>
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
