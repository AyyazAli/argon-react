import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { AlertTriangle, Check, ChevronsUpDown, Search } from 'lucide-react'
import { Button, Input, Label, Spinner } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProducts, useSetStockLinks } from '@/hooks'
import type { InventoryProduct, Variant } from '@/types'
import { ProductThumb } from './ProductThumb'
import { stringifyAttributes } from './inventoryUtils'

interface LinkStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The listing whose variants will sell from another product's stock. */
  product: InventoryProduct
}

const NONE = '__none__'
const MAX_RESULTS = 60

const label = (v: Variant) => (v.attributes || []).map((a) => a.value).join(' / ')
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
const ownStock = (v: Variant) => (v.stock || []).reduce((s, e) => s + (e.quantity || 0), 0)
const activeVariants = (p: InventoryProduct) => p.variants.filter((v) => v.status !== 'archived')

/** Same item if the master has one variant, else the variant with the same attribute values. */
function autoMap(listing: InventoryProduct, master: InventoryProduct): Record<string, string> {
  const masterVariants = activeVariants(master)
  const out: Record<string, string> = {}
  activeVariants(listing).forEach((v) => {
    const match = masterVariants.length === 1
      ? masterVariants[0]
      : masterVariants.find((m) => label(m) && norm(label(m)) === norm(label(v)))
    out[v._id as string] = match?._id ?? NONE
  })
  return out
}

/**
 * Linked listings: make a (marketing) product sell from another product's
 * stock. The listing keeps its own name, SKU and Shopify sync; orders and
 * labels for it deduct / count the master. Mounted fresh per open (keyed by
 * the caller), so state initialises from the current links.
 */
export function LinkStockDialog({ open, onOpenChange, product }: LinkStockDialogProps) {
  const { data: products = [], isLoading } = useProducts({})
  const setLinks = useSetStockLinks()
  const variants = activeVariants(product)
  const currentMasterId = variants.find((v) => v.stockLink?.variant)?.stockLink?.product ?? ''

  const [masterId, setMasterId] = useState(currentMasterId)
  const [mapping, setMapping] = useState<Record<string, string>>(() =>
    Object.fromEntries(variants.map((v) => [v._id as string, v.stockLink?.variant ?? NONE]))
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')

  // A master can't itself be a linked listing, and not this product.
  const candidates = useMemo(
    () => products.filter((p) => p._id !== product._id && !p.isLinkedListing),
    [products, product._id]
  )
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? candidates.filter((p) => p.name.toLowerCase().includes(q) || p.variants.some((v) => v.sku.toLowerCase().includes(q)))
      : candidates
    return list.slice(0, MAX_RESULTS)
  }, [candidates, query])
  const master = products.find((p) => p._id === masterId) ?? null
  const masterVariants = master ? activeVariants(master) : []

  const hasListings = (product.linkedListings?.length ?? 0) > 0
  const anyMapped = Object.values(mapping).some((m) => m !== NONE)
  const blockedByStock = variants.filter((v) => mapping[v._id as string] !== NONE && !v.stockLink?.variant && ownStock(v) > 0)

  const pickMaster = (p: InventoryProduct) => {
    setMasterId(p._id)
    setMapping(autoMap(product, p))
    setPickerOpen(false)
    setQuery('')
  }

  const save = (unlinkAll = false) =>
    setLinks.mutate(
      {
        id: product._id,
        data: {
          masterProductId: unlinkAll ? undefined : masterId || undefined,
          links: variants.map((v) => ({
            variantId: v._id as string,
            masterVariantId: unlinkAll || mapping[v._id as string] === NONE ? null : mapping[v._id as string],
          })),
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share stock with another product</DialogTitle>
          <DialogDescription>
            Use this when several website listings are the same physical item. “{product.name}” keeps its name, SKU and
            labels, but has no stock of its own — orders, scans and stock checks use the product you pick here.
          </DialogDescription>
        </DialogHeader>

        {hasListings ? (
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            Other listings already use this product’s stock, so it can’t use another product’s stock. Link those
            listings to the product you want instead.
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <Label>Uses the stock of</Label>
              <Popover.Root
                open={pickerOpen}
                onOpenChange={(o) => {
                  setPickerOpen(o)
                  if (!o) setQuery('')
                }}
              >
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-left"
                  >
                    {master ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <ProductThumb src={master.imageUrl} alt={master.name} size={24} />
                        <span className="truncate">{master.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{isLoading ? 'Loading products…' : 'Pick the product that holds the stock…'}</span>
                    )}
                    <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    align="start"
                    sideOffset={4}
                    className="z-50 w-[var(--radix-popover-trigger-width)] min-w-72 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none"
                  >
                    <div className="flex items-center gap-2 border-b px-2 py-1.5">
                      <Search className="size-4 shrink-0 opacity-50" />
                      <Input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search product or SKU..."
                        className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                          <Spinner size="sm" /> Loading...
                        </div>
                      ) : filtered.length === 0 ? (
                        <div className="py-4 text-center text-muted-foreground">No products found</div>
                      ) : (
                        filtered.map((p) => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => pickMaster(p)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
                          >
                            <ProductThumb src={p.imageUrl} alt={p.name} size={28} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{p.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {activeVariants(p).length > 1 ? `${activeVariants(p).length} variants` : p.variants[0]?.sku} · {p.totalStock ?? 0} in stock
                              </span>
                            </span>
                            {p._id === masterId && <Check className="size-4 shrink-0" />}
                          </button>
                        ))
                      )}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>

            {master && (
              <div className="space-y-2">
                <Label>Match each variant</Label>
                <div className="space-y-2 rounded-lg border p-3">
                  {variants.map((v) => {
                    const id = v._id as string
                    const own = ownStock(v)
                    return (
                      <div key={id} className="grid items-center gap-2 sm:grid-cols-2">
                        <div className="min-w-0">
                          <p className="truncate font-mono">{v.sku}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {stringifyAttributes(v.attributes) || 'No attributes'}
                            {!v.stockLink?.variant && own > 0 ? ` · ${own} of its own in stock` : ''}
                          </p>
                        </div>
                        <Select value={mapping[id] ?? NONE} onValueChange={(val) => setMapping((m) => ({ ...m, [id]: val }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pick a variant" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Keep its own stock</SelectItem>
                            {masterVariants.map((mv) => (
                              <SelectItem key={mv._id} value={mv._id as string}>
                                {mv.sku}{label(mv) ? ` · ${label(mv)}` : ''} · {mv.totalQuantity ?? 0} in stock
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {blockedByStock.length > 0 && (
              <p className="flex items-start gap-2 text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {blockedByStock.map((v) => v.sku).join(', ')} still {blockedByStock.length === 1 ? 'has' : 'have'} stock of
                its own. Adjust it to 0 (and receive it on the master) before linking.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {currentMasterId && (
              <Button variant="outline" onClick={() => save(true)} disabled={setLinks.isPending}>
                Stop sharing stock
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {!hasListings && (
              <Button onClick={() => save()} disabled={!master || !anyMapped || blockedByStock.length > 0 || setLinks.isPending}>
                {setLinks.isPending && <Spinner size="sm" className="mr-2" />}
                Save
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
