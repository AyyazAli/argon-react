import { Link } from 'react-router-dom'
import { Button, Badge } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { PrintBlockedOrder } from '@/types'

interface PrintBlockedDialogProps {
  blocked: PrintBlockedOrder[]
  onClose: () => void
}

const CODE_LABEL: Record<PrintBlockedOrder['problems'][number]['code'], string> = {
  short: 'Out of stock',
  unmatched: 'Not in inventory',
  no_sku: 'Not in inventory',
}

/**
 * Orders the server held back from printing ('printing' deduct mode): they
 * stay in their current status until the stock is received or the item is
 * mapped to an inventory product.
 */
export function PrintBlockedDialog({ blocked, onClose }: PrintBlockedDialogProps) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{blocked.length} order(s) not sent to printing</DialogTitle>
          <DialogDescription>
            Stock is deducted when the print file is generated, so these orders stayed as they were. Receive or
            count the stock (or link the item to an inventory product), then generate the print file again.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto text-sm">
          {blocked.map((b) => (
            <div key={b._id} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-medium">Order #{b.orderId || b.cn}</span>
                <Badge variant="outline" className="capitalize">{b.status}</Badge>
              </div>
              <ul className="space-y-1">
                {b.problems.map((p, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <Badge variant={p.code === 'short' ? 'warning' : 'destructive'}>{CODE_LABEL[p.code]}</Badge>
                    <span>{p.name}</span>
                    {p.sku && <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>}
                    {p.code === 'short' && (
                      <span className="text-muted-foreground">
                        needs {p.needed}, {p.onHand} in stock
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" asChild>
            <Link to="/inventory/scan?mode=receive">Receive stock</Link>
          </Button>
          <Button onClick={onClose}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
