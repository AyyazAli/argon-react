import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { useBusinessInfo } from '@/hooks'
import { Button } from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, User, LogOut, Settings } from 'lucide-react'

interface NavbarProps {
  onMenuClick: () => void
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/accounts': 'Accounts',
  '/categories': 'Categories',
  '/transactions': 'Transactions',
  '/vendors': 'Vendors',
  '/liability': 'Liability',
  '/inventory': 'Inventory',
  '/vendor-inventory': 'Vendor Inventory',
  '/bulk-customers': 'Bulk Customers',
  '/quotations': 'Quotations',
  '/invoices': 'Invoices',
  '/users': 'Users',
  '/bank-accounts': 'Bank Accounts',
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation()
  const { logout, role } = useAuthStore()
  const { data: businessInfo } = useBusinessInfo()

  const pageTitle = routeTitles[location.pathname] || 'Dashboard'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="size-5" />
      </Button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Business badge */}
        {businessInfo?.business && (
          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
            {businessInfo.business}
          </span>
        )}

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600"
            >
              <User className="size-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {businessInfo?.business || 'User'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {role || 'user'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}




