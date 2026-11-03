import { useState } from 'react'
import { Button, Spinner } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useShopifySync } from '@/hooks'
import type { ShopifySyncResult } from '@/types'

interface ShopifySyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * "Sync from Shopify": check what Shopify has that inventory doesn't (dry
 * run), then add it — new products and variants at 0 stock. Existing items,
 * stock, prices and categories are not changed. Safe to run any time.
 */
export function ShopifySyncDialog({ open, onOpenChange }: ShopifySyncDialogProps) {
  const sync = useShopifySync()
  const [result, setResult] = useState<ShopifySyncResult | null>(null)

  const run = (dryRun: boolean) => sync.mutate({ dryRun }, { onSuccess: (res) => setResult(res.data) })

  const done = result && !result.dryRun
  const changes = result ? result.variantsToCreate + result.variantsAdded.length + result.linked.length : 0
  const upToDate = result?.dryRun && changes === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sync products from Shopify</DialogTitle>
          <DialogDescription>
            Adds products and variants that are on Shopify but not in inventory yet (at 0 stock — receive or count them
            afterwards). Nothing already in inventory is changed. Check first; nothing is saved until you click Sync.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {result && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Shopify products" value={result.shopifyProducts} />
                <Stat label={done ? 'Products added' : 'New products'} value={result.productsToCreate} />
                <Stat label={done ? 'Variants added' : 'New variants'} value={result.variantsAdded.length} />
                <Stat label="Links restored" value={result.linked.length} />
              </div>

              {result.warnings.map((w, i) => (
                <p key={i} className="text-warning">{w}</p>
              ))}
              {result.newProducts.length > 0 && (
                <IssueList
                  title={`${done ? 'Added' : 'Will add'} ${result.newProducts.length} product(s)`}
                  rows={result.newProducts.map((p, i) => ({ key: `${p.name}-${i}`, text: `${p.name} (${p.variants.length} variant${p.variants.length === 1 ? '' : 's'})` }))}
                />
              )}
              {result.variantsAdded.length > 0 && (
                <IssueList
                  title={`${done ? 'Added' : 'Will add'} ${result.variantsAdded.length} variant(s) to existing products`}
                  rows={result.variantsAdded.map((v) => ({ key: v.sku, text: `${v.product}: ${v.sku}` }))}
                />
              )}
              {result.flagged.length > 0 && (
                <IssueList
                  title={`${result.flagged.length} variant(s) have no usable SKU in Shopify — they get an SH- SKU`}
                  rows={result.flagged.map((f) => ({ key: f.sku, text: `${f.product}: "${f.shopifySku}" → ${f.sku}` }))}
                />
              )}
              {result.skipped.length > 0 && (
                <IssueList
                  title={`${result.skipped.length} skipped`}
                  rows={result.skipped.map((s, i) => ({ key: `${s.sku}-${i}`, text: `${s.product}: ${s.sku} — ${s.reason}` }))}
                />
              )}
              {upToDate && <p className="text-muted-foreground">Inventory is up to date with Shopify.</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {done ? 'Close' : 'Cancel'}
          </Button>
          {!done && (
            <Button variant={result ? 'outline' : 'default'} onClick={() => run(true)} disabled={sync.isPending}>
              {sync.isPending && !result ? <Spinner size="sm" /> : result ? 'Check again' : 'Check Shopify'}
            </Button>
          )}
          {result?.dryRun && !upToDate && (
            <Button onClick={() => run(false)} disabled={sync.isPending}>
              {sync.isPending ? <Spinner size="sm" /> : 'Sync'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  )
}

function IssueList({ title, rows }: { title: string; rows: Array<{ key: string; text: string }> }) {
  return (
    <div className="space-y-1">
      <p className="font-medium">{title}</p>
      <div className="max-h-40 space-y-1 overflow-y-auto text-muted-foreground">
        {rows.map((r) => (
          <p key={r.key}>{r.text}</p>
        ))}
      </div>
    </div>
  )
}
