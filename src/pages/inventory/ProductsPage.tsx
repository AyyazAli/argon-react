import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveAs } from 'file-saver'
import {
  Plus,
  Search,
  Upload,
  Download,
  Package,
  AlertTriangle,
  Pencil,
  Archive,
  Eye,
} from 'lucide-react'
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Spinner,
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
import { useProducts, useProductCategories, useArchiveProduct } from '@/hooks'
import { inventoryApi } from '@/services'
import { formatCurrency } from '@/lib/utils'
import { ProductFormDialog, ImportCsvDialog } from '@/components/inventory'
import type { InventoryProduct } from '@/types'
import { toast } from 'sonner'

const ALL = '__all__'

export function ProductsPage() {
  const navigate = useNavigate()
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog and stock</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
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
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
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
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/inventory/products/${product._id}`)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                              <Pencil className="size-4" />
                            </Button>
                            {product.status === 'active' && (
                              <Button variant="ghost" size="sm" onClick={() => handleArchive(product)}>
                                <Archive className="size-4 text-destructive" />
                              </Button>
                            )}
                          </div>
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
        />
      )}
      {importOpen && <ImportCsvDialog open onOpenChange={(o) => !o && setImportOpen(false)} />}
    </div>
  )
}
