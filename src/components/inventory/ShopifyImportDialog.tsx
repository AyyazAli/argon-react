import { useState } from 'react'
import { Button, Checkbox, Label, Spinner } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useShopifyImport } from '@/hooks'
import type { ShopifyImportResult } from '@/types'

interface ShopifyImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Two-step Shopify catalogue pull: Preview (dry run, nothing written) then
 * Import. Safe to re-run — already-imported variants are skipped server-side.
 */
export function ShopifyImportDialog({ open, onOpenChange }: ShopifyImportDialogProps) {
  const shopifyImport = useShopifyImport()
  const [includeStock, setIncludeStock] = useState(true)
  const [result, setResult] = useState<ShopifyImportResult | null>(null)

  const run = (dryRun: boolean) =>
    shopifyImport.mutate({ dryRun, includeStock }, { onSuccess: (res) => setResult(res.data) })

  const done = result && !result.dryRun
  const nothingToDo = result?.dryRun && result.variantsToCreate === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Products from Shopify</DialogTitle>
          <DialogDescription>
            Pulls every Shopify product and variant into inventory. Preview first — nothing is saved
            until you click Import. Already-imported items and existing SKUs are skipped, so it is
            safe to run again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-2">
            <Checkbox
              id="includeStock"
              checked={includeStock}
              disabled={!!done || shopifyImport.isPending}
              onCheckedChange={(v) => {
                setIncludeStock(v === true)
                setResult(null) // preview numbers depend on this option
              }}
            />
            <Label htmlFor="includeStock" className="font-normal leading-snug">
              Use Shopify stock quantities as opening stock (default warehouse). Untick to start at
              0 and count with the Scan page.
            </Label>
          </div>

          {result && (
            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-muted-foreground">
                {result.store} → business <span className="font-medium text-foreground">{result.business}</span>
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Shopify products" value={result.shopifyProducts} />
                <Stat label="Shopify variants" value={result.shopifyVariants} />
                <Stat
                  label={done ? 'Products created' : 'Products to create'}
                  value={done ? (result.productsCreated ?? 0) : result.productsToCreate}
                />
                <Stat label="Opening units" value={result.unitsOpeningStock} />
              </div>

              {result.warnings.map((w, i) => (
                <p key={i} className="text-warning">{w}</p>
              ))}

              {result.flagged.length > 0 && (
                <IssueList
                  title={`${result.flagged.length} variant(s) get a generated SKU — fix these in Shopify so orders auto-deduct`}
                  rows={result.flagged.map((f) => ({
                    key: f.sku,
                    text: `${f.product}: "${f.shopifySku}" → ${f.sku} (${f.reason})`,
                  }))}
                />
              )}
              {result.skipped.length > 0 && (
                <IssueList
                  title={`${result.skipped.length} variant(s) skipped`}
                  rows={result.skipped.map((s, i) => ({ key: `${s.sku}-${i}`, text: `${s.product}: ${s.sku} — ${s.reason}` }))}
                />
              )}
              {nothingToDo && <p className="text-muted-foreground">Nothing new to import.</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {done ? 'Close' : 'Cancel'}
          </Button>
          {!done && (
            <Button variant={result ? 'outline' : 'default'} onClick={() => run(true)} disabled={shopifyImport.isPending}>
              {shopifyImport.isPending && !result ? <Spinner size="sm" /> : result ? 'Refresh preview' : 'Preview'}
            </Button>
          )}
          {result?.dryRun && !nothingToDo && (
            <Button onClick={() => run(false)} disabled={shopifyImport.isPending}>
              {shopifyImport.isPending ? <Spinner size="sm" /> : `Import ${result.variantsToCreate} variant(s)`}
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
      <div className="max-h-40 overflow-y-auto space-y-1 text-muted-foreground">
        {rows.map((r) => (
          <p key={r.key}>{r.text}</p>
        ))}
      </div>
    </div>
  )
}
