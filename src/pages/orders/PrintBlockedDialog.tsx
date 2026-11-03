import { useState } from 'react'
import { Link } from 'react-router-dom'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import { CheckCircle2, Download } from 'lucide-react'
import { Button, Badge, Spinner } from '@/components/ui'
import { ordersApi } from '@/services'
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
  /** Orders in the same run that did go to printing (they are in `file`). */
  printed: number
  file: string | null
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
export function PrintBlockedDialog({ blocked, printed, file, onClose }: PrintBlockedDialogProps) {
  const [downloading, setDownloading] = useState(false)

  const downloadAgain = async () => {
    if (!file) return
    setDownloading(true)
    try {
      saveAs(await ordersApi.downloadFile(file), `printfile-${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch {
      toast.error('Could not download the print file')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {printed > 0
              ? `${printed} order(s) sent to printing · ${blocked.length} held back`
              : `No orders sent to printing — ${blocked.length} held back`}
          </DialogTitle>
          <DialogDescription>
            Orders held back stay as they were because their stock isn't available (stock is deducted when the
            print file is generated). Receive or count the stock, or link the item to an inventory product, then
            generate the print file again for just those orders.
          </DialogDescription>
        </DialogHeader>

        {printed > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              {printed} order(s) moved to Printing and their stock was deducted. The print file was downloaded.
            </span>
            {file && (
              <Button size="sm" variant="outline" onClick={downloadAgain} disabled={downloading}>
                {downloading ? <Spinner size="sm" className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                Download again
              </Button>
            )}
          </div>
        )}

        <p className="text-sm font-medium">Held back ({blocked.length})</p>

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
