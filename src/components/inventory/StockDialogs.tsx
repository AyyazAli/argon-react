import { useState } from 'react'
import {
  Button,
  Input,
  Label,
  Textarea,
  Spinner,
} from '@/components/ui'
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
import { useWarehouses, useReceiveStock, useAdjustStock } from '@/hooks'
import type { InventoryProduct, Variant } from '@/types'
import { stringifyAttributes } from './inventoryUtils'

interface BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: InventoryProduct
  variant: Variant
}

function variantLabel(variant: Variant): string {
  const attrs = stringifyAttributes(variant.attributes)
  return attrs ? `${variant.sku} (${attrs})` : variant.sku
}

/**
 * Default-warehouse picker shared by both dialogs. The effective warehouse is
 * the user's explicit choice, falling back to the default (or first) warehouse —
 * derived during render so no effect is needed to sync the async-loaded list.
 */
function useDefaultWarehouse() {
  const { data: warehouses } = useWarehouses()
  const [selected, setSelected] = useState<string | null>(null)

  const fallback = warehouses?.find((w) => w.isDefault)?._id ?? warehouses?.[0]?._id ?? ''
  const warehouseId = selected ?? fallback

  return { warehouses, warehouseId, setWarehouseId: setSelected }
}

export function ReceiveStockDialog({ open, onOpenChange, product, variant }: BaseProps) {
  const { warehouses, warehouseId, setWarehouseId } = useDefaultWarehouse()
  const receive = useReceiveStock()
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState(String(variant.costPrice ?? ''))
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')

  const submit = () => {
    const qty = Number(quantity)
    if (!(qty > 0)) return
    receive.mutate(
      {
        productId: product._id,
        variantId: variant._id as string,
        warehouseId: warehouseId || undefined,
        quantity: qty,
        unitCost: unitCost === '' ? undefined : Number(unitCost),
        note: note || undefined,
        reference: reference || undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive Stock</DialogTitle>
          <DialogDescription>
            {product.name} — {variantLabel(variant)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map((w) => (
                  <SelectItem key={w._id} value={w._id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reference (optional)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO number / batch"
            />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={receive.isPending || !(Number(quantity) > 0)}>
            {receive.isPending ? <Spinner size="sm" /> : 'Receive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdjustStockDialog({ open, onOpenChange, product, variant }: BaseProps) {
  const { warehouses, warehouseId, setWarehouseId } = useDefaultWarehouse()
  const adjust = useAdjustStock()
  const [mode, setMode] = useState<'set' | 'delta'>('set')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  const currentQty =
    variant.stock?.find((s) => s.warehouse === warehouseId)?.quantity ?? variant.totalQuantity ?? 0

  const submit = () => {
    if (quantity === '' || !reason.trim()) return
    adjust.mutate(
      {
        productId: product._id,
        variantId: variant._id as string,
        warehouseId: warehouseId || undefined,
        mode,
        quantity: Number(quantity),
        reason: reason.trim(),
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {product.name} — {variantLabel(variant)} · current on-hand: {currentQty}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map((w) => (
                  <SelectItem key={w._id} value={w._id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as 'set' | 'delta')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to value</SelectItem>
                  <SelectItem value="delta">Add / subtract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{mode === 'set' ? 'New Quantity' : 'Change (+/-)'}</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={mode === 'set' ? '0' : 'e.g. -5'}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damaged stock, stock count correction"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={adjust.isPending || quantity === '' || !reason.trim()}
          >
            {adjust.isPending ? <Spinner size="sm" /> : 'Adjust'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
