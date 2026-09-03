import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { ScanMode } from '@/types'
import type { ScanLine } from '@/stores/scanSessionStore'

interface ScanLinesTableProps {
  mode: ScanMode
  lines: ScanLine[]
  onQuantity: (variantId: string, quantity: number) => void
  onUnitCost: (variantId: string, unitCost: number | undefined) => void
  onRemove: (variantId: string) => void
}

function variance(line: ScanLine): number {
  return line.quantity - line.onHand
}

/**
 * The lines of the current scan session. Renders as stacked cards so it works
 * on a phone; each card has -/+ steppers plus a direct quantity input.
 */
export function ScanLinesTable({ mode, lines, onQuantity, onUnitCost, onRemove }: ScanLinesTableProps) {
  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nothing scanned yet. Scan a label or type a SKU above.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {lines.map((line) => {
        const v = variance(line)
        return (
          <div
            key={line.variantId}
            className={cn(
              'rounded-lg border bg-card p-3',
              line.error && 'border-destructive bg-destructive/5'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-semibold">{line.sku}</p>
                <p className="truncate text-sm">{line.productName}</p>
                {line.attributes && (
                  <p className="truncate text-xs text-muted-foreground">{line.attributes}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  On hand: <span className="font-medium text-foreground">{line.onHand}</span>
                  {mode === 'count' && (
                    <>
                      {' · '}Variance:{' '}
                      <span
                        className={cn(
                          'font-medium',
                          v > 0 && 'text-success',
                          v < 0 && 'text-destructive',
                          v === 0 && 'text-foreground'
                        )}
                      >
                        {v > 0 ? '+' : ''}
                        {v}
                      </span>
                    </>
                  )}
                  {(mode === 'deduct' || mode === 'transfer') && (
                    <>
                      {' · '}After:{' '}
                      <span className={cn('font-medium', line.onHand - line.quantity < 0 ? 'text-destructive' : 'text-foreground')}>
                        {line.onHand - line.quantity}
                      </span>
                    </>
                  )}
                </p>
                {line.error && <p className="mt-1 text-xs font-medium text-destructive">{line.error}</p>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => onRemove(line.variantId)}
                aria-label="Remove line"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {mode === 'count' ? 'Counted' : 'Quantity'}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onQuantity(line.variantId, line.quantity - 1)}
                    disabled={line.quantity <= (mode === 'count' ? 0 : 1)}
                    aria-label="Decrease"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="w-20 text-center text-base"
                    value={String(line.quantity)}
                    onChange={(e) => onQuantity(line.variantId, Number(e.target.value) || 0)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onQuantity(line.variantId, line.quantity + 1)}
                    aria-label="Increase"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
              {mode === 'receive' && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Unit cost</p>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    className="w-28 text-base"
                    value={line.unitCost ?? ''}
                    onChange={(e) =>
                      onUnitCost(line.variantId, e.target.value === '' ? undefined : Number(e.target.value))
                    }
                    placeholder={String(line.costPrice)}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
