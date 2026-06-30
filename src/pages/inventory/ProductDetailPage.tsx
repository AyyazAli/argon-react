import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, PackagePlus, SlidersHorizontal, AlertTriangle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
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
import { useProduct, useMovements } from '@/hooks'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  ProductFormDialog,
  ReceiveStockDialog,
  AdjustStockDialog,
  stringifyAttributes,
  MOVEMENT_LABELS,
  movementBadgeVariant,
} from '@/components/inventory'
import type { Variant } from '@/types'

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { data: product, isLoading } = useProduct(productId)
  const { data: movementsRes } = useMovements({ product: productId, limit: 50 })

  const [editOpen, setEditOpen] = useState(false)
  const [receiveVariant, setReceiveVariant] = useState<Variant | null>(null)
  const [adjustVariant, setAdjustVariant] = useState<Variant | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/inventory/products')}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    )
  }

  const movements = movementsRes?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/inventory/products')}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
            <p className="text-sm text-muted-foreground">
              {product.category?.name || 'Uncategorized'}
              {product.supplier?.name ? ` · ${product.supplier.name}` : ''}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" />
          Edit
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total On Hand</p>
            <p className="text-3xl font-bold">{product.totalStock ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Stock Value</p>
            <p className="text-3xl font-bold">{formatCurrency(product.totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Variants</p>
            <p className="text-3xl font-bold">{product.variants.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>SKU</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-center">On Hand</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.variants.map((variant) => (
                  <TableRow key={variant._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {variant.sku}
                        {variant.isLowStock && (
                          <Badge variant="warning" className="gap-1">
                            <AlertTriangle className="size-3" />
                            Low
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {stringifyAttributes(variant.attributes) || '-'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(variant.costPrice)}</TableCell>
                    <TableCell className="text-center font-medium">
                      {variant.totalQuantity ?? 0}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(variant.stockValue)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => setReceiveVariant(variant)}>
                          <PackagePlus className="size-4" />
                          Receive
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAdjustVariant(variant)}>
                          <SlidersHorizontal className="size-4" />
                          Adjust
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Movement history */}
      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Change</TableHead>
                  <TableHead className="text-center">On Hand After</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No movements yet
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell className="text-muted-foreground">{formatDateTime(m.dateCreated)}</TableCell>
                      <TableCell className="font-mono text-sm">{m.variantSku || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={movementBadgeVariant(m.type)}>{MOVEMENT_LABELS[m.type]}</Badge>
                      </TableCell>
                      <TableCell
                        className={`text-center font-medium ${m.quantityChange >= 0 ? 'text-success' : 'text-destructive'}`}
                      >
                        {m.quantityChange >= 0 ? '+' : ''}
                        {m.quantityChange}
                      </TableCell>
                      <TableCell className="text-center">{m.quantityAfter}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {m.note || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {typeof m.createdBy === 'object' && m.createdBy ? m.createdBy.name : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editOpen && (
        <ProductFormDialog
          key={product._id}
          open
          onOpenChange={(o) => !o && setEditOpen(false)}
          product={product}
        />
      )}
      {receiveVariant && (
        <ReceiveStockDialog
          open={!!receiveVariant}
          onOpenChange={(o) => !o && setReceiveVariant(null)}
          product={product}
          variant={receiveVariant}
        />
      )}
      {adjustVariant && (
        <AdjustStockDialog
          open={!!adjustVariant}
          onOpenChange={(o) => !o && setAdjustVariant(null)}
          product={product}
          variant={adjustVariant}
        />
      )}
    </div>
  )
}
