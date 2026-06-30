import { useState } from 'react'
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMovements } from '@/hooks'
import { formatDateTime } from '@/lib/utils'
import { MOVEMENT_LABELS, movementBadgeVariant } from '@/components/inventory'
import type { MovementType } from '@/types'

const ALL = '__all__'
const TYPES: MovementType[] = [
  'receipt',
  'adjustment',
  'opening',
  'transfer_in',
  'transfer_out',
  'correction',
]

export function StockMovementsPage() {
  const [type, setType] = useState<MovementType | ''>('')
  const [page, setPage] = useState(1)
  const limit = 50

  const { data, isLoading } = useMovements({
    type: type || undefined,
    page,
    limit,
  })

  const movements = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Stock Movements</h2>
        <p className="text-muted-foreground">Full audit ledger of every stock change</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Select
            value={type || ALL}
            onValueChange={(v) => {
              setType(v === ALL ? '' : (v as MovementType))
              setPage(1)
            }}
          >
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {MOVEMENT_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

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
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-center">Change</TableHead>
                    <TableHead className="text-center">On Hand After</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                        No movements found
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(m.dateCreated)}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate font-medium">
                          {m.productName || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{m.variantSku || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={movementBadgeVariant(m.type)}>
                            {MOVEMENT_LABELS[m.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {typeof m.warehouse === 'object' && m.warehouse ? m.warehouse.name : '-'}
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
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} movements
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
