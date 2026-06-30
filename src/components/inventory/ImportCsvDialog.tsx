import { useState } from 'react'
import { Button, Label, Spinner } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useImportProducts } from '@/hooks'

interface ImportCsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportCsvDialog({ open, onOpenChange }: ImportCsvDialogProps) {
  const importProducts = useImportProducts()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{
    productsCreated: number
    variantsSkipped: number
    skipped: Array<{ sku: string; reason: string }>
  } | null>(null)

  const submit = () => {
    if (!file) return
    importProducts.mutate(file, {
      onSuccess: (res) => setResult(res.data),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Columns: Product, SKU, Barcode, Attributes, Cost Price, Selling Price, Reorder Point,
            Opening Stock. Rows with the same Product name become variants of one product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {result && (
            <div className="rounded-lg border p-3 text-sm space-y-2">
              <p className="font-medium text-success">
                {result.productsCreated} product(s) created · {result.variantsSkipped} row(s) skipped
              </p>
              {result.skipped.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.skipped.map((s, i) => (
                    <p key={i} className="text-muted-foreground">
                      <span className="font-mono">{s.sku}</span> — {s.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={submit} disabled={!file || importProducts.isPending}>
              {importProducts.isPending ? <Spinner size="sm" /> : 'Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
