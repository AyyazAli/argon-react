import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Package, Boxes, DollarSign, AlertTriangle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  useInventorySummary,
  useLowStock,
  useValuation,
  useRecentMovements,
} from '@/hooks'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { MOVEMENT_LABELS, movementBadgeVariant } from '@/components/inventory'

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  accent: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`rounded-xl p-3 ${accent}`}>{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function InventoryDashboardPage() {
  const navigate = useNavigate()
  const { data: summary, isLoading } = useInventorySummary()
  const { data: lowStock } = useLowStock()
  const { data: valuation } = useValuation()
  const { data: recent } = useRecentMovements(8)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h2>
        <p className="text-muted-foreground">Stock levels, valuation, and recent activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Products"
          value={summary?.productCount ?? 0}
          icon={<Package className="size-6 text-blue-600" />}
          accent="bg-blue-500/15"
        />
        <StatCard
          label="Total Units"
          value={summary?.totalUnits ?? 0}
          icon={<Boxes className="size-6 text-emerald-600" />}
          accent="bg-emerald-500/15"
        />
        <StatCard
          label="Stock Value"
          value={formatCurrency(summary?.totalValue)}
          icon={<DollarSign className="size-6 text-violet-600" />}
          accent="bg-violet-500/15"
        />
        <StatCard
          label="Low Stock SKUs"
          value={summary?.lowStockCount ?? 0}
          icon={<AlertTriangle className="size-6 text-amber-600" />}
          accent="bg-amber-500/15"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Valuation chart */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Value by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {valuation && valuation.categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={valuation.categories}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-muted-foreground">No valuation data</p>
            )}
          </CardContent>
        </Card>

        {/* Recent movements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!recent || recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No activity yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(m.dateCreated)}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {m.productName || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={movementBadgeVariant(m.type)}>
                            {MOVEMENT_LABELS[m.type]}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-center font-medium ${m.quantityChange >= 0 ? 'text-success' : 'text-destructive'}`}
                        >
                          {m.quantityChange >= 0 ? '+' : ''}
                          {m.quantityChange}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">On Hand</TableHead>
                  <TableHead className="text-center">Reorder Point</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!lowStock || lowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Everything is well stocked
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStock.map((item) => (
                    <TableRow
                      key={item.variantId}
                      className="cursor-pointer"
                      onClick={() => navigate(`/inventory/products/${item.productId}`)}
                    >
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="text-muted-foreground">{item.category || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="warning">{item.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {item.reorderPoint}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
