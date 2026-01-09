import { useState, useMemo } from 'react'
import { useOrders, useFetchLatestOrders, useUpdateOrderStatus, useBookOrders } from '@/hooks'
import { useOrderStore } from '@/stores'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Checkbox,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OrderDetailsModal } from './OrderDetailsModal'
import type { Order, OrderStatus, CourierCompany } from '@/types'
import {
  RefreshCw,
  Search,
  Eye,
  Truck,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react'

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirm',
  'printing',
  'dispatch',
  'delivered',
  'return',
  'cancel',
  'call again',
  'advance pending',
  'advance done',
  'self collect',
]

const COURIER_COMPANIES: { value: CourierCompany; label: string }[] = [
  { value: 'trax', label: 'Trax' },
  { value: 'leopard', label: 'Leopard' },
  { value: 'lahore', label: 'Lahore' },
  { value: 'printfile', label: 'Print File' },
]

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'confirm':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'dispatch':
      return 'bg-violet-50 text-violet-700 border border-violet-200'
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'return':
      return 'bg-orange-50 text-orange-700 border border-orange-200'
    case 'cancel':
      return 'bg-red-50 text-red-700 border border-red-200'
    case 'printing':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    case 'call again':
      return 'bg-cyan-50 text-cyan-700 border border-cyan-200'
    case 'advance pending':
      return 'bg-pink-50 text-pink-700 border border-pink-200'
    case 'advance done':
      return 'bg-teal-50 text-teal-700 border border-teal-200'
    case 'self collect':
      return 'bg-slate-50 text-slate-700 border border-slate-200'
    default:
      return 'bg-gray-50 text-gray-700 border border-gray-200'
  }
}

export function OrdersPage() {
  const { data: orders, isLoading } = useOrders()
  const fetchLatest = useFetchLatestOrders()
  const updateStatus = useUpdateOrderStatus()
  const bookOrders = useBookOrders()
  const { selectedOrders, toggleOrderSelection, clearSelection, setSelectedOrders } = useOrderStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCompany, setSelectedCompany] = useState<CourierCompany | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

  const itemsPerPage = 20

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    if (!orders) return []

    return orders.filter((order) => {
      const matchesSearch =
        searchQuery === '' ||
        order.billing.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.billing.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.billing.phone?.includes(searchQuery) ||
        order.billing.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.dispatchDetails?.some((d) =>
          d.trackingId?.toLowerCase().includes(searchQuery.toLowerCase())
        )

      const matchesStatus =
        statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const isAllSelected = paginatedOrders.length > 0 && paginatedOrders.every((order) =>
    selectedOrders.some((so) => so._id === order._id)
  )

  const handleSelectAll = () => {
    if (isAllSelected) {
      clearSelection()
    } else {
      setSelectedOrders(paginatedOrders)
    }
  }

  const handleStatusChange = (orderId: string, status: string) => {
    updateStatus.mutate({ orderId, status })
  }

  const handleBookOrders = () => {
    if (!selectedCompany || selectedOrders.length === 0) return
    
    bookOrders.mutate({
      company: selectedCompany,
      orderIds: selectedOrders.map((o) => o._id),
    })
    setBookingDialogOpen(false)
  }

  const getTrackingNumber = (order: Order) => {
    if (!order.dispatchDetails?.length) return '-'
    const latest = order.dispatchDetails[order.dispatchDetails.length - 1]
    return latest.trackingId || '-'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            Manage and track all your orders
          </p>
        </div>
        <Button
          onClick={() => fetchLatest.mutate()}
          disabled={fetchLatest.isPending}
        >
          <RefreshCw className={cn('size-4', fetchLatest.isPending && 'animate-spin')} />
          Fetch Latest
        </Button>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search and Filter */}
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Booking Actions */}
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedOrders.length} selected
                </span>
                <Select
                  value={selectedCompany}
                  onValueChange={(v) => setSelectedCompany(v as CourierCompany)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURIER_COMPANIES.map((company) => (
                      <SelectItem key={company.value} value={company.value}>
                        {company.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setBookingDialogOpen(true)}
                  disabled={!selectedCompany}
                >
                  <Truck className="size-4" />
                  Book Orders
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>CN</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedOrders.some((o) => o._id === order._id)}
                              onCheckedChange={() => toggleOrderSelection(order)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {getTrackingNumber(order)}
                          </TableCell>
                          <TableCell>
                            {order.billing.first_name} {order.billing.last_name}
                          </TableCell>
                          <TableCell>{order.billing.phone}</TableCell>
                          <TableCell>{order.billing.city}</TableCell>
                          <TableCell>{formatCurrency(order.total)}</TableCell>
                          <TableCell>{formatDate(order.date_created)}</TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order._id, value)}
                            >
                              <SelectTrigger 
                                className={cn(
                                  "w-[130px] h-8 font-medium capitalize rounded-full text-xs shadow-none",
                                  getStatusColor(order.status)
                                )}
                              >
                                <SelectValue>{order.status}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status} className="capitalize">
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(status))}>
                                      {status}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewOrder(order)}
                                title="View Order"
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewOrder(order)}
                                title="Edit Order"
                              >
                                <Pencil className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{' '}
                    {filteredOrders.length} orders
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {viewOrder && (
        <OrderDetailsModal
          order={viewOrder}
          open={!!viewOrder}
          onClose={() => setViewOrder(null)}
        />
      )}

      {/* Booking Confirmation Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to book {selectedOrders.length} order(s) via{' '}
              {COURIER_COMPANIES.find((c) => c.value === selectedCompany)?.label}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookOrders} disabled={bookOrders.isPending}>
              {bookOrders.isPending ? (
                <>
                  <Spinner size="sm" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

