import { useNavigate } from 'react-router-dom'
import {
  MoreHorizontal,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  Tag,
  ScanLine,
  ArrowLeftRight,
  Pencil,
  Archive,
  Eye,
} from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui'
import { useIsInventoryAdmin } from '@/hooks'
import type { InventoryProduct } from '@/types'

interface StockActionMenuProps {
  product: InventoryProduct
  onReceive: () => void
  onDeduct: () => void
  onAdjust: () => void
  onTransfer: () => void
  onPrintLabels: () => void
  onView?: () => void
  onEdit?: () => void
  onArchive?: () => void
  /** Use a compact icon trigger (table rows) or a labelled button. */
  compact?: boolean
}

/**
 * One menu for every stock action on a product, reused by the products table
 * and the product detail header so Receive / Deduct / Adjust are never more
 * than a click away. Catalogue edits are shown only to inventory admins.
 */
export function StockActionMenu({
  product,
  onReceive,
  onDeduct,
  onAdjust,
  onTransfer,
  onPrintLabels,
  onView,
  onEdit,
  onArchive,
  compact,
}: StockActionMenuProps) {
  const navigate = useNavigate()
  const isAdmin = useIsInventoryAdmin()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" aria-label="Actions">
            <MoreHorizontal className="size-4" />
          </Button>
        ) : (
          <Button variant="outline">
            <SlidersHorizontal className="size-4" />
            Stock Actions
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Stock</DropdownMenuLabel>
        <DropdownMenuItem onClick={onReceive}>
          <PackagePlus className="size-4" />
          Receive stock
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDeduct}>
          <PackageMinus className="size-4" />
          Deduct stock
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAdjust}>
          <SlidersHorizontal className="size-4" />
          Adjust / correct
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTransfer}>
          <ArrowLeftRight className="size-4" />
          Transfer to warehouse
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/inventory/scan')}>
          <ScanLine className="size-4" />
          Open scanner
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPrintLabels}>
          <Tag className="size-4" />
          Print labels
        </DropdownMenuItem>
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="size-4" />
            View details
          </DropdownMenuItem>
        )}
        {isAdmin && (onEdit || onArchive) && (
          <>
            <DropdownMenuSeparator />
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-4" />
                Edit product
              </DropdownMenuItem>
            )}
            {onArchive && product.status === 'active' && (
              <DropdownMenuItem onClick={onArchive} className="text-destructive focus:text-destructive">
                <Archive className="size-4" />
                Archive
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
