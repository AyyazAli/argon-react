import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { Printer, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input, Label, Spinner, Checkbox } from '@/components/ui'
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
import type { InventoryProduct, LabelGrid, LabelItem, LabelCodeType } from '@/types'
import { generateQrDataUrl, generateCode128DataUrl } from '@/lib/labelCodes'
import { LabelSheetPDF } from './LabelSheetPDF'
import { LABEL_GRIDS, stringifyAttributes } from './inventoryUtils'

const CUSTOM = '__custom__'
const CODE_TYPES: { value: LabelCodeType; label: string; hint: string }[] = [
  { value: 'both', label: 'QR + barcode', hint: 'QR for phones, Code 128 for handheld scanners.' },
  { value: 'qr', label: 'QR code only', hint: 'Best for phone cameras; leaves more room for text.' },
  { value: 'barcode', label: 'Barcode only', hint: 'Code 128 across the full label; best for handheld scanners.' },
]

interface Row {
  key: string
  productName: string
  sku: string
  attributes: string
  selected: boolean
  copies: string
}

interface PrintLabelsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: InventoryProduct[]
  /** Variant ids to tick initially; all variants when omitted. */
  preselectVariantIds?: string[]
}

function buildRows(products: InventoryProduct[], preselect?: string[]): Row[] {
  const pre = preselect ? new Set(preselect) : null
  return products.flatMap((p) =>
    p.variants
      .filter((v) => v.status !== 'archived')
      .map((v) => ({
        key: `${p._id}:${v._id ?? v.sku}`,
        productName: p.name,
        sku: v.sku,
        attributes: stringifyAttributes(v.attributes),
        selected: pre ? pre.has(v._id ?? '') : true,
        copies: '1',
      }))
  )
}

/**
 * Generate an A4 label-sheet PDF for the chosen variants. Mounted fresh each
 * time it opens (parent keys it) so state initialises from props at mount.
 */
export function PrintLabelsDialog({ open, onOpenChange, products, preselectVariantIds }: PrintLabelsDialogProps) {
  const [rows, setRows] = useState<Row[]>(() => buildRows(products, preselectVariantIds))
  const [gridId, setGridId] = useState<string>(LABEL_GRIDS[0].id)
  const [custom, setCustom] = useState<LabelGrid>({ ...LABEL_GRIDS[0], id: CUSTOM, name: 'Custom' })
  const [startOffset, setStartOffset] = useState('0')
  const [codeType, setCodeType] = useState<LabelCodeType>('both')
  const [busy, setBusy] = useState<'download' | 'open' | null>(null)

  const grid = gridId === CUSTOM ? custom : (LABEL_GRIDS.find((g) => g.id === gridId) ?? LABEL_GRIDS[0])
  const perSheet = grid.columns * grid.rows
  const totalLabels = rows.reduce((n, r) => n + (r.selected ? Math.max(0, Number(r.copies) || 0) : 0), 0)
  const sheets = Math.ceil((totalLabels + (Number(startOffset) || 0)) / perSheet)

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const setAll = (selected: boolean) => setRows((rs) => rs.map((r) => ({ ...r, selected })))

  const buildPdf = async (): Promise<Blob> => {
    const chosen = rows.filter((r) => r.selected && (Number(r.copies) || 0) > 0)
    const unique = new Map<string, { qr?: string; bar?: string }>()
    await Promise.all(
      [...new Set(chosen.map((r) => r.sku))].map(async (sku) => {
        unique.set(sku, {
          qr: codeType !== 'barcode' ? await generateQrDataUrl(sku) : undefined,
          bar: codeType !== 'qr' ? generateCode128DataUrl(sku) : undefined,
        })
      })
    )
    const items: LabelItem[] = chosen.flatMap((r) => {
      const codes = unique.get(r.sku)!
      return Array.from({ length: Number(r.copies) }, () => ({
        sku: r.sku,
        productName: r.productName,
        attributes: r.attributes,
        qrDataUrl: codes.qr,
        barcodeDataUrl: codes.bar,
      }))
    })
    return pdf(<LabelSheetPDF grid={grid} items={items} codeType={codeType} startOffset={Number(startOffset) || 0} />).toBlob()
  }

  const run = async (action: 'download' | 'open') => {
    if (totalLabels === 0) return
    setBusy(action)
    try {
      const blob = await buildPdf()
      if (action === 'download') {
        saveAs(blob, `labels-${new Date().toISOString().slice(0, 10)}.pdf`)
      } else {
        const url = URL.createObjectURL(blob)
        const win = window.open(url, '_blank')
        if (!win) saveAs(blob, `labels-${new Date().toISOString().slice(0, 10)}.pdf`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate labels')
    } finally {
      setBusy(null)
    }
  }

  const numField = (label: string, key: keyof LabelGrid) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step="0.01"
        value={String(custom[key])}
        onChange={(e) => setCustom((c) => ({ ...c, [key]: Number(e.target.value) || 0 }))}
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Print Labels</DialogTitle>
          <DialogDescription>
            Codes encode the SKU. Print at 100% scale (no "fit to page").
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Code type</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {CODE_TYPES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCodeType(c.value)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                    codeType === c.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="block font-medium">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Label sheet</Label>
              <Select value={gridId} onValueChange={setGridId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_GRIDS.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>Custom grid…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Skip used labels on first sheet</Label>
              <Input
                type="number"
                min={0}
                max={perSheet - 1}
                value={startOffset}
                onChange={(e) => setStartOffset(e.target.value)}
              />
            </div>
          </div>

          {gridId === CUSTOM && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-4">
              {numField('Columns', 'columns')}
              {numField('Rows', 'rows')}
              {numField('Label width (mm)', 'labelWidth')}
              {numField('Label height (mm)', 'labelHeight')}
              {numField('Top margin (mm)', 'marginTop')}
              {numField('Left margin (mm)', 'marginLeft')}
              {numField('Column gap (mm)', 'gapX')}
              {numField('Row gap (mm)', 'gapY')}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Variants</Label>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAll(true)}>
                Select all
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAll(false)}>
                Clear
              </Button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border">
            {rows.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No variants to print.</p>
            ) : (
              rows.map((r) => (
                <div key={r.key} className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0">
                  <Checkbox checked={r.selected} onCheckedChange={(c) => updateRow(r.key, { selected: c === true })} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      <span className="font-mono">{r.sku}</span>
                      <span className="text-muted-foreground"> · {r.productName}</span>
                    </p>
                    {r.attributes && <p className="truncate text-xs text-muted-foreground">{r.attributes}</p>}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    className="w-20"
                    value={r.copies}
                    onChange={(e) => updateRow(r.key, { copies: e.target.value })}
                    aria-label="Copies"
                  />
                </div>
              ))
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {totalLabels} label(s) · {sheets} sheet(s) of {perSheet}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" variant="outline" disabled={!!busy || totalLabels === 0} onClick={() => run('open')}>
            {busy === 'open' ? <Spinner size="sm" /> : <Printer className="size-4" />}
            Open for print
          </Button>
          <Button type="button" disabled={!!busy || totalLabels === 0} onClick={() => run('download')}>
            {busy === 'download' ? <Spinner size="sm" /> : <Download className="size-4" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
