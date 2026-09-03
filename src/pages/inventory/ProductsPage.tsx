import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { saveAs } from 'file-saver'
import {
  Plus,
  Search,
  Upload,
  Download,
  Package,
  AlertTriangle,
  Tag,
  ScanLine,
} from 'lucide-react'
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Spinner,
  Checkbox,
} from '@/components/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProducts, useProductCategories, useArchiveProduct, useIsInventoryAdmin } from '@/hooks'
import { inventoryApi } from '@/services'
import { formatCurrency } from '@/lib/utils'
import {
  ProductFormDialog,
  ImportCsvDialog,
  PrintLabelsDialog,
  ReceiveStockDialog,
  DeductStockDialog,
  AdjustStockDialog,
  TransferStockDialog,
  StockActionMenu,
} from '@/components/inventory'
import type { InventoryProduct } from '@/types'
import { toast } from 'sonner'

const ALL = '__all__'

type StockDialog = { kind: 'receive' | 'deduct' | 'adjust' | 'transfer'; product: InventoryProduct } | null
type LabelTarget = { products: InventoryProduct[]; preselect?: string[]; key: string } | null

export function ProductsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const isAdmin = useIsInventoryAdmin()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    category: category || undefined,
    lowStock: lowStockOnly || undefined,
  })
  const { data: categories } = useProductCategories()
  const archiveProduct = useArchiveProduct()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryProduct | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [stockDialog, setStockDialog] = useState<StockDialog>(null)
  const [labelTarget, setLabelTarget] = useState<LabelTarget>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  // `?labels=1` deep link from the dashboard: the label dialog target is
  // derived from the URL until the user closes it (which clears the param) —
  // no state syncing in effects needed.
  const wantsLabels = params.get('labels') === '1'
  const effectiveLabelTarget: LabelTarget =
    labelTarget ?? (wantsLabels && products && products.length > 0 ? { products, key: 'all' } : null)
  const closeLabels = () => {
    setLabelTarget(null)
    if (wantsLabels) setParams({}, { replace: true })
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (product: InventoryProduct) => {
    setEditing(product)
    setFormOpen(true)
  }

  const handleExport = async () => {
    try {
      const blob = await inventoryApi.exportProducts()
      saveAs(blob, 'inventory-export.xlsx')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleArchive = (product: InventoryProduct) => {
    if (window.confirm(`Archive "${product.name}"? It will be hidden from the active list.`)) {
      archiveProduct.mutate(product._id)
    }
  }

  const toggleSelected = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const allIds = products?.map((p) => p._id) ?? []
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))

  const printSelectedOrAll = () => {
    if (!products) return
    const chosen = selected.size > 0 ? products.filter((p) => selected.has(p._id)) : products
    setLabelTarget({ products: chosen, key: chosen.map((p) => p._id).join(',') })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog and stock</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/inventory/scan')}>
            <ScanLine className="size-4" />
            Scan
          </Button>
          <Button variant="outline" onClick={printSelectedOrAll} disabled={!products || products.length === 0}>
            <Tag className="size-4" />
            Print Labels{selected.size > 0 ? ` (${selected.size})` : ''}
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="size-4" />
                Import
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="size-4" />
                Export
              </Button>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, or barcode"
              className="pl-9"
            />
          </div>
          <Select
            value={category || ALL}
            onValueChange={(v) => setCategory(v === ALL ? '' : v)}
          >
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={lowStockOnly ? 'default' : 'outline'}
            onClick={() => setLowStockOnly((v) => !v)}
          >
            <AlertTriangle className="size-4" />
            Low Stock
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(c) => setSelected(c === true ? new Set(allIds) : new Set())}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Variants</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-center">On Hand</TableHead>
                    <TableHead className="text-right">Stock Value</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!products || products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                        <Package className="mx-auto mb-2 size-8 opacity-50" />
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow
                        key={product._id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/inventory/products/${product._id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected.has(product._id)}
                            onCheckedChange={(c) => toggleSelected(product._id, c === true)}
                            aria-label={`Select ${product.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {product.name}
                            {product.lowStock && (
                              <Badge variant="warning" className="gap-1">
                                <AlertTriangle className="size-3" />
                                Low
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{product.variants.length}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.category?.name || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.supplier?.name || '-'}
                        </TableCell>
                        <TableCell className="text-center font-medium">{product.totalStock ?? 0}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.totalValue)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <StockActionMenu
                            compact
                            product={product}
                            onReceive={() => setStockDialog({ kind: 'receive', product })}
                            onDeduct={() => setStockDialog({ kind: 'deduct', product })}
                            onAdjust={() => setStockDialog({ kind: 'adjust', product })}
                            onTransfer={() => setStockDialog({ kind: 'transfer', product })}
                            onPrintLabels={() => setLabelTarget({ products: [product], key: product._id })}
                            onView={() => navigate(`/inventory/products/${product._id}`)}
                            onEdit={() => openEdit(product)}
                            onArchive={() => handleArchive(product)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {formOpen && (
        <ProductFormDialog
          key={editing?._id ?? 'new'}
          open
          onOpenChange={(o) => !o && setFormOpen(false)}
          product={editing}
          onCreated={(created) =>
            setLabelTarget({
              products: [created],
              preselect: created.variants.map((v) => v._id ?? ''),
              key: `new-${created._id}`,
            })
          }
        />
      )}
      {importOpen && <ImportCsvDialog open onOpenChange={(o) => !o && setImportOpen(false)} />}
      {effectiveLabelTarget && (
        <PrintLabelsDialog
          key={effectiveLabelTarget.key}
          open
          onOpenChange={(o) => !o && closeLabels()}
          products={effectiveLabelTarget.products}
          preselectVariantIds={effectiveLabelTarget.preselect}
        />
      )}
      {stockDialog?.kind === 'receive' && (
        <ReceiveStockDialog
          key={stockDialog.product._id}
          open
          onOpenChange={(o) => !o && setStockDialog(null)}
          product={stockDialog.product}
        />
      )}
      {stockDialog?.kind === 'deduct' && (
        <DeductStockDialog
          key={stockDialog.product._id}
          open
          onOpenChange={(o) => !o && setStockDialog(null)}
          product={stockDialog.product}
        />
      )}
      {stockDialog?.kind === 'adjust' && (
        <AdjustStockDialog
          key={stockDialog.product._id}
          open
          onOpenChange={(o) => !o && setStockDialog(null)}
          product={stockDialog.product}
        />
      )}
      {stockDialog?.kind === 'transfer' && (
        <TransferStockDialog
          key={stockDialog.product._id}
          open
          onOpenChange={(o) => !o && setStockDialog(null)}
          product={stockDialog.product}
        />
      )}
    </div>
  )
}
