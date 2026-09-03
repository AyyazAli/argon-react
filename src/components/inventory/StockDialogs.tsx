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
import { useWarehouses, useReceiveStock, useAdjustStock, useCommitBatch, BatchValidationError } from '@/hooks'
import type { InventoryProduct, Variant, ReasonCode } from '@/types'
import { stringifyAttributes, REASON_OPTIONS } from './inventoryUtils'

interface BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: InventoryProduct
  /** When omitted the dialog shows a variant picker (defaults to the first active variant). */
  variant?: Variant | null
}

function variantLabel(variant: Variant): string {
  const attrs = stringifyAttributes(variant.attributes)
  return attrs ? `${variant.sku} (${attrs})` : variant.sku
}

/**
 * Resolve the working variant: the one passed in, else the user's pick from
 * the product's active variants (initialised at mount — dialogs are keyed and
 * mounted fresh, so no effect-based syncing is needed).
 */
function useVariantPick(product: InventoryProduct, fixed?: Variant | null) {
  const options = product.variants.filter((v) => v.status !== 'archived')
  const [pickedId, setPickedId] = useState<string>(fixed?._id ?? options[0]?._id ?? '')
  const variant = fixed ?? options.find((v) => v._id === pickedId) ?? options[0] ?? null
  return { variant, options, pickedId: variant?._id ?? '', setPickedId, showPicker: !fixed && options.length > 1 }
}

function VariantPicker({
  options,
  value,
  onChange,
}: {
  options: Variant[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Variant</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select variant" />
        </SelectTrigger>
        <SelectContent>
          {options.map((v) => (
            <SelectItem key={v._id} value={v._id as string}>
              {variantLabel(v)} · on hand {v.totalQuantity ?? 0}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
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

export function ReceiveStockDialog({ open, onOpenChange, product, variant: fixedVariant }: BaseProps) {
  const { warehouses, warehouseId, setWarehouseId } = useDefaultWarehouse()
  const { variant, options, pickedId, setPickedId, showPicker } = useVariantPick(product, fixedVariant)
  const receive = useReceiveStock()
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState(String(variant?.costPrice ?? ''))
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')

  const submit = () => {
    const qty = Number(quantity)
    if (!(qty > 0) || !variant) return
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
            {product.name}
            {variant && !showPicker ? ` — ${variantLabel(variant)}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {showPicker && <VariantPicker options={options} value={pickedId} onChange={setPickedId} />}
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
          <Button onClick={submit} disabled={receive.isPending || !variant || !(Number(quantity) > 0)}>
            {receive.isPending ? <Spinner size="sm" /> : 'Receive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdjustStockDialog({ open, onOpenChange, product, variant: fixedVariant }: BaseProps) {
  const { warehouses, warehouseId, setWarehouseId } = useDefaultWarehouse()
  const { variant, options, pickedId, setPickedId, showPicker } = useVariantPick(product, fixedVariant)
  const adjust = useAdjustStock()
  const [mode, setMode] = useState<'set' | 'delta'>('set')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  const currentQty =
    variant?.stock?.find((s) => s.warehouse === warehouseId)?.quantity ?? variant?.totalQuantity ?? 0

  const submit = () => {
    if (quantity === '' || !reason.trim() || !variant) return
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
            {product.name}
            {variant && !showPicker ? ` — ${variantLabel(variant)}` : ''} · current on-hand: {currentQty}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {showPicker && <VariantPicker options={options} value={pickedId} onChange={setPickedId} />}
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
            disabled={adjust.isPending || !variant || quantity === '' || !reason.trim()}
          >
            {adjust.isPending ? <Spinner size="sm" /> : 'Adjust'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Deduct stock for one variant with a reason (walk-in sale, damaged, used for
 * an order, ...). Goes through the same batch endpoint as the scan page so
 * every deduction shares one code path and the same ledger types.
 */
export function DeductStockDialog({ open, onOpenChange, product, variant: fixedVariant }: BaseProps) {
  const { warehouses, warehouseId, setWarehouseId } = useDefaultWarehouse()
  const { variant, options, pickedId, setPickedId, showPicker } = useVariantPick(product, fixedVariant)
  const commit = useCommitBatch()
  const [quantity, setQuantity] = useState('1')
  const [reasonCode, setReasonCode] = useState<ReasonCode | ''>('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [lineError, setLineError] = useState<string | null>(null)

  const onHand = variant?.stock?.find((s) => s.warehouse === warehouseId)?.quantity ?? variant?.totalQuantity ?? 0
  const qty = Number(quantity)
  const canSubmit = !!variant && qty > 0 && !!reasonCode && !commit.isPending

  const submit = () => {
    if (!canSubmit || !variant) return
    setLineError(null)
    commit.mutate(
      {
        mode: 'deduct',
        reasonCode: reasonCode as ReasonCode,
        reference: reference || undefined,
        note: note || undefined,
        warehouseId: warehouseId || undefined,
        lines: [{ productId: product._id, variantId: variant._id as string, quantity: qty }],
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) => {
          if (e instanceof BatchValidationError) setLineError(e.errors[0]?.message ?? e.message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deduct Stock</DialogTitle>
          <DialogDescription>
            {product.name}
            {variant && !showPicker ? ` — ${variantLabel(variant)}` : ''} · on hand: {onHand}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {showPicker && <VariantPicker options={options} value={pickedId} onChange={setPickedId} />}
          {warehouses && warehouses.length > 1 && (
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w._id} value={w._id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reasonCode} onValueChange={(v) => setReasonCode(v as ReasonCode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.deduct.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{reasonCode === 'order' ? 'Order no. / CN' : 'Reference (optional)'}</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={reasonCode === 'order' ? 'e.g. #1042 or CN number' : 'Receipt / batch'}
            />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes" />
          </div>
          {variant && qty > onHand && (
            <p className="text-sm text-destructive">
              Only {onHand} on hand — stock cannot go negative. Do a count/adjustment first if the shelf says otherwise.
            </p>
          )}
          {lineError && <p className="text-sm text-destructive">{lineError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={!canSubmit || qty > onHand}>
            {commit.isPending ? <Spinner size="sm" /> : 'Deduct'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Move units of one variant from one warehouse to another. Uses the batch
 * endpoint's transfer mode, which writes a paired transfer_out / transfer_in.
 */
export function TransferStockDialog({ open, onOpenChange, product, variant: fixedVariant }: BaseProps) {
  const { data: warehouses } = useWarehouses()
  const { variant, options, pickedId, setPickedId, showPicker } = useVariantPick(product, fixedVariant)
  const commit = useCommitBatch()
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')
  const [lineError, setLineError] = useState<string | null>(null)

  const defaultId = warehouses?.find((w) => w.isDefault)?._id ?? warehouses?.[0]?._id ?? ''
  const fromId = from || defaultId
  const toId = to || (warehouses?.find((w) => w._id !== fromId)?._id ?? '')
  const onHand = variant?.stock?.find((s) => s.warehouse === fromId)?.quantity ?? 0
  const qty = Number(quantity)
  const enoughWarehouses = (warehouses?.length ?? 0) > 1
  const canSubmit = !!variant && qty > 0 && !!fromId && !!toId && fromId !== toId && qty <= onHand && !commit.isPending

  const submit = () => {
    if (!canSubmit || !variant) return
    setLineError(null)
    commit.mutate(
      {
        mode: 'transfer',
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        note: note || undefined,
        lines: [{ productId: product._id, variantId: variant._id as string, quantity: qty }],
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) => {
          if (e instanceof BatchValidationError) setLineError(e.errors[0]?.message ?? e.message)
        },
      }
    )
  }

  const picker = (label: string, value: string, onChange: (v: string) => void, exclude?: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select warehouse" />
        </SelectTrigger>
        <SelectContent>
          {warehouses
            ?.filter((w) => w._id !== exclude)
            .map((w) => (
              <SelectItem key={w._id} value={w._id}>
                {w.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Stock</DialogTitle>
          <DialogDescription>
            {product.name}
            {variant && !showPicker ? ` — ${variantLabel(variant)}` : ''} · on hand at source: {onHand}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {showPicker && <VariantPicker options={options} value={pickedId} onChange={setPickedId} />}
          {!enoughWarehouses && (
            <p className="text-sm text-destructive">
              Transfers need at least two warehouses. Add one under Inventory → Warehouses.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {picker('From', fromId, setFrom)}
            {picker('To', toId, setTo, fromId)}
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            {variant && qty > onHand && (
              <p className="text-sm text-destructive">Only {onHand} on hand at the source warehouse.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes" />
          </div>
          {lineError && <p className="text-sm text-destructive">{lineError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {commit.isPending ? <Spinner size="sm" /> : 'Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
