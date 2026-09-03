import { lazy, Suspense, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Camera, CameraOff, ClipboardCheck, Trash2, PackagePlus, PackageMinus, ListChecks, ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Spinner,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCommitBatch, useLookupCode, useWarehouses, BatchValidationError } from '@/hooks'
import { useScanSessionStore } from '@/stores'
import {
  ScanInput,
  ScanLinesTable,
  stringifyAttributes,
  REASON_OPTIONS,
  REASON_LABELS,
  SCAN_MODE_LABELS,
} from '@/components/inventory'
import type { ScanMode, ReasonCode, BatchResult } from '@/types'

const CameraScanner = lazy(() => import('@/components/inventory/CameraScanner'))

const MODES: { value: ScanMode; icon: React.ReactNode; hint: string }[] = [
  { value: 'receive', icon: <PackagePlus className="size-4" />, hint: 'Each scan adds one unit received. Set unit cost per line if it differs from the current average.' },
  { value: 'deduct', icon: <PackageMinus className="size-4" />, hint: 'Each scan removes one unit. Pick a reason first — walk-in sales, damaged goods, items used for an order, etc.' },
  { value: 'count', icon: <ListChecks className="size-4" />, hint: 'Scan every unit on the shelf (or type the counted quantity). Differences from the system are posted as adjustments.' },
  { value: 'transfer', icon: <ArrowLeftRight className="size-4" />, hint: 'Move units between warehouses. Each scan moves one unit out of the source and into the destination; cost price is unchanged.' },
]

/**
 * Camera scanning is for phones/tablets. Desktops use a USB/Bluetooth scanner
 * or typed entry, so the camera toggle is hidden there.
 */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches
}

function isScanMode(v: string | null): v is ScanMode {
  return v === 'receive' || v === 'deduct' || v === 'count' || v === 'transfer'
}

/**
 * Session-mode scanning: pick Receive / Deduct / Count, scan repeatedly with a
 * USB/Bluetooth scanner or the phone camera, review the lines, commit once.
 */
export function ScanPage() {
  const [params] = useSearchParams()
  const session = useScanSessionStore()
  const lookup = useLookupCode()
  const commit = useCommitBatch()
  const { data: warehouses } = useWarehouses()

  const [cameraOn, setCameraOn] = useState(false)
  const [cameraAvailable] = useState(isTouchDevice)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [lastResult, setLastResult] = useState<BatchResult | null>(null)

  // `?mode=` deep link (dashboard quick actions) — applied once at mount via a
  // lazy state initialiser so we never sync URL -> store inside an effect.
  useState(() => {
    const m = params.get('mode')
    const st = useScanSessionStore.getState()
    if (isScanMode(m) && m !== st.mode && st.lines.length === 0) st.setMode(m)
    return null
  })

  const { mode, reasonCode, reference, note, unresolved, warehouseId, fromWarehouseId, toWarehouseId } = session
  const modeMeta = MODES.find((m) => m.value === mode)!

  // Effective locations. With a single warehouse everything is implicit; with
  // several, the pickers appear and the on-hand shown per line is for that location.
  const defaultWarehouseId = warehouses?.find((w) => w.isDefault)?._id ?? warehouses?.[0]?._id ?? ''
  const multiWarehouse = (warehouses?.length ?? 0) > 1
  const sourceId = mode === 'transfer' ? fromWarehouseId || defaultWarehouseId : warehouseId || defaultWarehouseId
  const destId = toWarehouseId || (warehouses?.find((w) => w._id !== sourceId)?._id ?? '')
  const warehouseName = (id: string) => warehouses?.find((w) => w._id === id)?.name ?? '—'
  const lines = session.lines.map((l) => ({
    ...l,
    onHand: sourceId ? (l.stockByWarehouse[sourceId] ?? 0) : l.onHand,
  }))

  const totalUnits = lines.reduce((n, l) => n + l.quantity, 0)
  const varianceLines = lines.filter((l) => l.quantity !== l.onHand).length
  const needsReason = mode === 'deduct' && !reasonCode
  const badTransfer = mode === 'transfer' && (!sourceId || !destId || sourceId === destId)
  const hasErrors = lines.some((l) => l.error)
  const canCommit = lines.length > 0 && !needsReason && !badTransfer && !commit.isPending

  const changeMode = (next: string) => {
    if (!isScanMode(next) || next === mode) return
    if (lines.length > 0 && !window.confirm('Switching mode clears the current lines. Continue?')) return
    session.setMode(next)
    setLastResult(null)
  }

  const handleCode = async (code: string) => {
    try {
      const item = await lookup(code)
      session.addOrIncrement(item, stringifyAttributes(item.attributes))
      setLastResult(null)
    } catch {
      session.addUnresolved(code)
      toast.error(`No item matches "${code}"`)
    }
  }

  const doCommit = () => {
    session.clearErrors()
    commit.mutate(
      {
        mode,
        reasonCode: mode === 'deduct' ? (reasonCode as ReasonCode) : undefined,
        reference: reference || undefined,
        note: note || undefined,
        warehouseId: mode === 'transfer' ? undefined : sourceId || undefined,
        fromWarehouseId: mode === 'transfer' ? sourceId : undefined,
        toWarehouseId: mode === 'transfer' ? destId : undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: l.quantity,
          unitCost: mode === 'receive' ? l.unitCost : undefined,
        })),
      },
      {
        onSuccess: (res) => {
          setReviewOpen(false)
          setLastResult(res)
          session.clear()
        },
        onError: (e) => {
          setReviewOpen(false)
          if (e instanceof BatchValidationError) session.applyErrors(e.errors)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Scan</h2>
          <p className="text-muted-foreground">Receive, deduct, or count stock by scanning labels</p>
        </div>
        <Tabs value={mode} onValueChange={changeMode}>
          <TabsList>
            {MODES.map((m) => (
              <TabsTrigger key={m.value} value={m.value} className="gap-1.5">
                {m.icon}
                {SCAN_MODE_LABELS[m.value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {lastResult && (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <span className="font-medium">{SCAN_MODE_LABELS[lastResult.mode]} committed:</span>{' '}
              {lastResult.applied} line(s) applied
              {lastResult.skipped ? `, ${lastResult.skipped} unchanged` : ''}.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to={`/inventory/movements?sessionId=${lastResult.sessionId}`}>View in ledger</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          {/* Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{SCAN_MODE_LABELS[mode]} details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{modeMeta.hint}</p>
              {mode === 'transfer' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Select value={sourceId} onValueChange={session.setFromWarehouseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Source warehouse" />
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
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Select value={destId} onValueChange={session.setToWarehouseId}>
                      <SelectTrigger className={badTransfer ? 'border-destructive' : undefined}>
                        <SelectValue placeholder="Destination warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses
                          ?.filter((w) => w._id !== sourceId)
                          .map((w) => (
                            <SelectItem key={w._id} value={w._id}>
                              {w.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!multiWarehouse && (
                    <p className="text-sm text-destructive sm:col-span-2">
                      Transfers need at least two warehouses. Add one under Inventory → Warehouses.
                    </p>
                  )}
                </div>
              ) : (
                multiWarehouse && (
                  <div className="space-y-2">
                    <Label>Warehouse</Label>
                    <Select value={sourceId} onValueChange={session.setWarehouseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Warehouse" />
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
                )
              )}
              {mode === 'deduct' && (
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={reasonCode} onValueChange={(v) => session.setReasonCode(v as ReasonCode)}>
                    <SelectTrigger className={needsReason ? 'border-destructive' : undefined}>
                      <SelectValue placeholder="Select a reason (required)" />
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
              )}
              {mode !== 'count' && (
                <div className="space-y-2">
                  <Label>
                    {mode === 'deduct' && reasonCode === 'order'
                      ? 'Order no. / CN'
                      : mode === 'receive'
                        ? 'PO / reference (optional)'
                        : 'Reference (optional)'}
                  </Label>
                  <Input
                    value={reference}
                    onChange={(e) => session.setReference(e.target.value)}
                    placeholder={reasonCode === 'order' ? 'e.g. #1042 or CN number' : 'Optional'}
                    className="text-base"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea value={note} onChange={(e) => session.setNote(e.target.value)} placeholder="Notes for the ledger" rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Scanner */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Scanner</CardTitle>
              {cameraAvailable && (
                <Button type="button" variant={cameraOn ? 'default' : 'outline'} size="sm" onClick={() => setCameraOn((v) => !v)}>
                  {cameraOn ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
                  {cameraOn ? 'Stop camera' : 'Use camera'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <ScanInput onCode={handleCode} />
              {!cameraAvailable && (
                <p className="text-xs text-muted-foreground">
                  Use a USB / Bluetooth barcode scanner or type the code. Camera scanning is available on phones and tablets.
                </p>
              )}
              {cameraAvailable && cameraOn && (
                <Suspense
                  fallback={
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
                      <Spinner size="lg" />
                    </div>
                  }
                >
                  <CameraScanner onCode={handleCode} />
                </Suspense>
              )}
              {unresolved.length > 0 && (
                <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Unrecognised codes</span>
                    <Button type="button" variant="ghost" size="sm" onClick={session.clearUnresolved}>
                      Clear
                    </Button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {unresolved.map((c) => (
                      <Badge key={c} variant="outline" className="font-mono">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              Lines <span className="text-muted-foreground">({lines.length})</span>
            </CardTitle>
            {lines.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm('Clear all lines?')) session.clear()
                }}
              >
                <Trash2 className="size-4" />
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ScanLinesTable
              mode={mode}
              lines={lines}
              onQuantity={session.setQuantity}
              onUnitCost={session.setUnitCost}
              onRemove={session.removeLine}
            />
          </CardContent>
        </Card>
      </div>

      {/* Sticky commit bar */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{lines.length}</span> line(s) ·{' '}
            {mode === 'count' ? (
              <>
                <span className="font-medium text-foreground">{varianceLines}</span> with variance
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">{totalUnits}</span> unit(s)
              </>
            )}
            {hasErrors && <span className="ml-2 text-destructive">· fix highlighted lines</span>}
          </p>
          <Button type="button" size="lg" disabled={!canCommit} onClick={() => setReviewOpen(true)}>
            <ClipboardCheck className="size-4" />
            Review &amp; Commit ({lines.length})
          </Button>
        </div>
      </div>

      {reviewOpen && (
        <Dialog open onOpenChange={(o) => !o && setReviewOpen(false)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm {SCAN_MODE_LABELS[mode].toLowerCase()}</DialogTitle>
              <DialogDescription>
                {mode === 'deduct' && reasonCode ? `Reason: ${REASON_LABELS[reasonCode]}. ` : ''}
                {mode === 'transfer' ? `${warehouseName(sourceId)} → ${warehouseName(destId)}. ` : ''}
                {reference ? `Reference: ${reference}. ` : ''}
                This writes {mode === 'count' ? varianceLines : mode === 'transfer' ? lines.length * 2 : lines.length} ledger entr
                {(mode === 'count' ? varianceLines : mode === 'transfer' ? lines.length * 2 : lines.length) === 1 ? 'y' : 'ies'} and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-72 overflow-y-auto rounded-lg border text-sm">
              {lines.map((l) => {
                const delta =
                  mode === 'receive' ? l.quantity : mode === 'deduct' || mode === 'transfer' ? -l.quantity : l.quantity - l.onHand
                return (
                  <div key={l.variantId} className="flex items-center justify-between border-b px-3 py-2 last:border-b-0">
                    <div className="min-w-0">
                      <p className="truncate font-mono font-medium">{l.sku}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className={delta > 0 ? 'text-success' : delta < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                        {delta > 0 ? '+' : ''}
                        {delta}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.onHand} → {l.onHand + delta}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewOpen(false)}>
                Back
              </Button>
              <Button onClick={doCommit} disabled={commit.isPending} variant={mode === 'deduct' ? 'destructive' : 'default'}>
                {commit.isPending ? <Spinner size="sm" /> : 'Commit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
