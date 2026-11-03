import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { AlertTriangle, Check, ChevronsUpDown, Search } from 'lucide-react'
import { Input, Spinner } from '@/components/ui'
import { ProductThumb } from '@/components/inventory/ProductThumb'
import { cn } from '@/lib/utils'
import type { OrderCatalogProduct, OrderCatalogVariant } from '@/types'

interface InventoryItemPickerProps {
  catalog: OrderCatalogProduct[]
  loading?: boolean
  product: OrderCatalogProduct | null
  variant: OrderCatalogVariant | null
  /** Set when the user tried to save a multi-variant product without a variant. */
  variantError?: boolean
  onSelectProduct: (product: OrderCatalogProduct) => void
  onSelectVariant: (variant: OrderCatalogVariant) => void
}

const MAX_RESULTS = 60

const totalOnHand = (p: OrderCatalogProduct) => p.variants.reduce((s, v) => s + v.onHand, 0)

/**
 * Links an order line to an inventory item so stock deducts. Products with
 * several variants must have one picked — a bare product name can't be
 * matched and holds the order back from printing.
 */
export function InventoryItemPicker({
  catalog,
  loading,
  product,
  variant,
  variantError,
  onSelectProduct,
  onSelectVariant,
}: InventoryItemPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? catalog.filter((p) => p.name.toLowerCase().includes(q) || p.variants.some((v) => v.sku.toLowerCase().includes(q)))
      : catalog
    return list.slice(0, MAX_RESULTS)
  }, [catalog, query])

  const needsVariant = !!product && product.variants.length > 1

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Inventory item</p>
        {!loading && !product && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" /> Not linked — stock won't be deducted
          </span>
        )}
      </div>

      <Popover.Root
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setQuery('')
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-left text-sm"
          >
            {product ? (
              <span className="flex min-w-0 items-center gap-2">
                <ProductThumb src={product.imageUrl} alt={product.name} size={24} />
                <span className="truncate">{product.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{loading ? 'Loading inventory…' : 'Pick an inventory product…'}</span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className="z-50 w-[var(--radix-popover-trigger-width)] min-w-72 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none"
          >
            <div className="flex items-center gap-2 border-b px-2 py-1.5">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product or SKU..."
                className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Spinner size="sm" /> Loading inventory...
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No products found</div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      onSelectProduct(p)
                      setOpen(false)
                      setQuery('')
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <ProductThumb src={p.imageUrl} alt={p.name} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.variants.length > 1 ? `${p.variants.length} variants · ` : `${p.variants[0].sku} · `}
                        {totalOnHand(p)} in stock
                      </span>
                    </span>
                    {product?._id === p._id && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))
              )}
              {!loading && query.trim() === '' && catalog.length > MAX_RESULTS && (
                <div className="px-3 py-1.5 text-xs text-muted-foreground">
                  Showing first {MAX_RESULTS} — type to search all {catalog.length}.
                </div>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {needsVariant && (
        <div className="space-y-1">
          <p className={cn('text-xs', variantError && !variant ? 'font-medium text-destructive' : 'text-muted-foreground')}>
            {variant ? 'Variant' : 'Pick the variant — required so stock can be deducted'}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v._id}
                type="button"
                onClick={() => onSelectVariant(v)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-left text-xs',
                  variant?._id === v._id ? 'border-primary bg-primary/10 text-foreground' : 'hover:bg-accent',
                  variantError && !variant && 'border-destructive'
                )}
              >
                <span className="block font-medium">{v.label || v.sku}</span>
                <span className={cn('block', v.onHand > 0 ? 'text-muted-foreground' : 'text-destructive')}>
                  {v.sku} · {v.onHand} in stock
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {product && variant && !needsVariant && (
        <p className={cn('text-xs', variant.onHand > 0 ? 'text-muted-foreground' : 'text-destructive')}>
          {variant.sku} · {variant.onHand} in stock
        </p>
      )}
      {product && variant && variant.onHand <= 0 && (
        <p className="text-xs text-destructive">Out of stock — when stock is deducted on printing, this order is held back until stock is received.</p>
      )}
    </div>
  )
}
