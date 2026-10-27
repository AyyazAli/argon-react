import { Printer, Truck, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Spinner } from '@/components/ui'
import { useInventorySettings, useUpdateInventorySettings, useIsInventoryAdmin } from '@/hooks'
import { cn } from '@/lib/utils'
import type { DeductOn } from '@/types'

const OPTIONS: Array<{ value: DeductOn; title: string; icon: React.ReactNode; points: string[] }> = [
  {
    value: 'printing',
    title: 'When the print file is generated',
    icon: <Printer className="size-5" />,
    points: [
      'Stock is deducted as soon as an order moves to Printing.',
      'Orders whose items are out of stock or not in inventory are not sent to printing — they stay Confirmed and you are told why.',
      'Moving a printed order back to Confirm / Pending, or cancelling or returning it, puts the stock back.',
    ],
  },
  {
    value: 'dispatch',
    title: 'When the order is dispatched',
    icon: <Truck className="size-5" />,
    points: [
      'Stock is deducted when the order is booked with a courier, self-collected or delivered.',
      'Printing is never blocked; shortfalls are listed under Order Stock Issues.',
      'Cancelled / returned orders put the stock back.',
    ],
  },
]

export function InventorySettingsPage() {
  const { data, isLoading } = useInventorySettings()
  const update = useUpdateInventorySettings()
  const isAdmin = useIsInventoryAdmin()
  const current = data?.deductOn

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory Settings</h2>
        <p className="text-sm text-muted-foreground">Settings apply to the business you are signed in to.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deduct order stock</CardTitle>
          <CardDescription>Choose the point at which an order takes its items out of stock.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2" role="radiogroup" aria-label="Deduct order stock">
              {OPTIONS.map((o) => {
                const selected = current === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!isAdmin || update.isPending}
                    onClick={() => !selected && update.mutate(o.value)}
                    className={cn(
                      'rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed',
                      selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50',
                      !isAdmin && !selected && 'opacity-60'
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        {o.icon}
                        {o.title}
                      </div>
                      {selected && (update.isPending ? <Spinner size="sm" /> : <Check className="size-5 text-primary" />)}
                    </div>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {o.points.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </button>
                )
              })}
            </div>
          )}
          {!isAdmin && <p className="mt-4 text-sm text-muted-foreground">Only admins can change this setting.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
