import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { ManualBookingLabels } from '@/components/pdf/ManualBookingLabels'
import {
  useOrders,
  useOrderStats,
  useFetchLatestOrders,
  useUpdateOrderStatus,
  useBookOrders,
  useBookManual,
  useCreateTraxReceivingSheet,
  useGeneratePrintfileFromCSV,
  useTraxCities,
  useLeopardCities,
  useUpdateOrderCity,
} from '@/hooks'
import { useOrderStore, useAuthStore } from '@/stores'
import { formatDate, cn } from '@/lib/utils'
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
import { CityCombobox } from './CityCombobox'
import type { Order, OrderStatus, CourierCompany, City } from '@/types'
import {
  RefreshCw,
  Search,
  Truck,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertTriangle,
} from 'lucide-react'

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirm', 'printing', 'dispatch', 'delivered',
  'return', 'cancel', 'call again', 'advance pending', 'advance done', 'self collect',
]

const COURIER_COMPANIES: { value: CourierCompany; label: string }[] = [
  { value: 'leopard', label: 'Book By Leopard' },
  { value: 'trax', label: 'Book By Trax' },
  { value: 'postex', label: 'Book By PostEx' },
  { value: 'lahore', label: 'Book By Lahore - excelFile' },
  { value: 'printfile', label: 'Generate Printfile' },
  { value: 'manual', label: 'Manual Booking (Labels PDF)' },
]

const PAGE_SIZE_OPTIONS = [20, 50, 100, 500, 1000, 2000]

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':         return '!bg-sky-400 !text-white border-transparent [&_svg]:!text-white'
    case 'confirm':         return '!bg-green-500 !text-white border-transparent [&_svg]:!text-white'
    case 'dispatch':        return '!bg-orange-400 !text-white border-transparent [&_svg]:!text-white'
    case 'delivered':       return '!bg-teal-500 !text-white border-transparent [&_svg]:!text-white'
    case 'return':          return '!bg-red-500 !text-white border-transparent [&_svg]:!text-white'
    case 'cancel':          return '!bg-red-600 !text-white border-transparent [&_svg]:!text-white'
    case 'printing':        return '!bg-purple-500 !text-white border-transparent [&_svg]:!text-white'
    case 'call again':      return '!bg-yellow-400 !text-black border-transparent [&_svg]:!text-black'
    case 'advance pending': return '!bg-amber-700 !text-white border-transparent [&_svg]:!text-white'
    case 'advance done':    return '!bg-green-600 !text-white border-transparent [&_svg]:!text-white'
    case 'self collect':    return '!bg-slate-500 !text-white border-transparent [&_svg]:!text-white'
    default:                return '!bg-gray-400 !text-white border-transparent [&_svg]:!text-white'
  }
}

export function OrdersPage() {
  const { data: orders, isLoading } = useOrders()
  const { data: stats } = useOrderStats()
  const fetchLatest = useFetchLatestOrders()
  const updateStatus = useUpdateOrderStatus()
  const bookOrders = useBookOrders()
  const bookManual = useBookManual()
  const createReceivingSheet = useCreateTraxReceivingSheet()
  const generateFromCSV = useGeneratePrintfileFromCSV()
  const updateOrderCity = useUpdateOrderCity()
  const { selectedOrders, toggleOrderSelection, clearSelection, setSelectedOrders, traxCities, leopardCities } = useOrderStore()
  const business = useAuthStore((s) => s.business)
  const csvInputRef = useRef<HTMLInputElement>(null)

  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false)
  const [manualCompany, setManualCompany] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCompany, setSelectedCompany] = useState<CourierCompany | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [viewOrderId, setViewOrderId] = useState<string | null>(null)
  // Derived from live orders so dispatch details stay current after booking
  const viewOrder = viewOrderId ? (orders?.find(o => o._id === viewOrderId) ?? null) : null
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [receivingSheetDialog, setReceivingSheetDialog] = useState<{ open: boolean; trackingIds: string[] }>({
    open: false,
    trackingIds: [],
  })

  // City mapping (Trax & Leopard require a courier city id per order before booking)
  const needsCityMapping = selectedCompany === 'trax' || selectedCompany === 'leopard'
  const traxCitiesQuery = useTraxCities(bookingDialogOpen && selectedCompany === 'trax')
  const leopardCitiesQuery = useLeopardCities(bookingDialogOpen && selectedCompany === 'leopard')
  const activeCities = (selectedCompany === 'leopard' ? leopardCities : traxCities) ?? []
  const citiesLoading =
    selectedCompany === 'leopard' ? leopardCitiesQuery.isLoading : traxCitiesQuery.isLoading

  const handleSelectCity = (orderId: string, city: City) => {
    if (!needsCityMapping) return
    updateOrderCity.mutate({ orderId, city, company: selectedCompany })
  }

  const filteredOrders = useMemo(() => {
    if (!orders) return []
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        searchQuery === '' ||
        order.billing.first_name?.toLowerCase().includes(q) ||
        order.billing.last_name?.toLowerCase().includes(q) ||
        `${order.billing.first_name ?? ''} ${order.billing.last_name ?? ''}`.toLowerCase().includes(q) ||
        order.billing.phone?.includes(searchQuery) ||
        order.billing.email?.toLowerCase().includes(q) ||
        order.billing.city?.toLowerCase().includes(q) ||
        order.billing.address?.toLowerCase().includes(q) ||
        String(order.cn ?? '').includes(searchQuery) ||
        String(order.orderId ?? '').toLowerCase().includes(q) ||
        order.remarks?.toLowerCase().includes(q) ||
        order.notes?.toLowerCase().includes(q) ||
        order.dispatchDetails?.some((d) =>
          d.trackingId?.toLowerCase().includes(q)
        )

      const matchesStatus =
        statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const isAllSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((order) => selectedOrders.some((so) => so._id === order._id))

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

  const handleBookOrders = async () => {
    if (!selectedCompany || selectedOrders.length === 0) return

    // Manual booking — call API to set dispatch info, then generate PDF
    if (selectedCompany === 'manual') {
      if (!manualCompany) return          // company must be selected
      setBookingDialogOpen(false)
      setIsGeneratingLabels(true)
      try {
        // 1. Update orders in backend (status → dispatch, add dispatchDetails)
        await new Promise<void>((resolve, reject) => {
          bookManual.mutate(
            { orderIds: selectedOrders.map((o) => o._id), company: manualCompany },
            { onSuccess: () => resolve(), onError: (e) => reject(e) }
          )
        })
        // 2. Generate & download PDF labels
        const blob = await pdf(
          <ManualBookingLabels
            orders={selectedOrders}
            businessName={business || 'portal'}
          />
        ).toBlob()
        saveAs(blob, `manual-labels-${new Date().toISOString().split('T')[0]}.pdf`)
      } catch (e) {
        console.error('Failed during manual booking', e)
      } finally {
        setIsGeneratingLabels(false)
        setManualCompany('')
      }
      return
    }

    const orderIds = selectedOrders.map((o) => o._id)

    bookOrders.mutate(
      { company: selectedCompany, orderIds },
      {
        onSuccess: (data) => {
          if (selectedCompany === 'trax') {
            const orders = Array.isArray(data.data) ? data.data : (data.data as { orders?: Order[] }).orders || []
            const trackingIds: string[] = []
            orders.forEach((order: Order) => {
              if (order.dispatchDetails?.length) {
                const last = order.dispatchDetails[order.dispatchDetails.length - 1]
                if (last.trackingId) trackingIds.push(last.trackingId)
              }
            })
            if (trackingIds.length > 0) {
              setReceivingSheetDialog({ open: true, trackingIds })
            }
          }
        },
      }
    )
    setBookingDialogOpen(false)
  }

  const handleCreateReceivingSheet = () => {
    createReceivingSheet.mutate(receivingSheetDialog.trackingIds)
    setReceivingSheetDialog({ open: false, trackingIds: [] })
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      generateFromCSV.mutate(file)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {[
            { name: 'Total', value: stats.total },
            { name: 'Pending', value: stats.pending },
            { name: 'Confirmed', value: stats.confirmed },
            { name: 'Dispatched', value: stats.dispatched },
            { name: 'Delivered', value: stats.delivered },
            { name: 'Returned', value: stats.returned },
            { name: 'Cancelled', value: stats.cancelled },
          ].map((item) => (
            <Card key={item.name} className="mb-0">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.name}</p>
                <p className="text-2xl font-bold mt-1">{item.value ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">Manage and track all your orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => csvInputRef.current?.click()}
            disabled={generateFromCSV.isPending}
            title="Upload CSV for Print"
          >
            {generateFromCSV.isPending ? (
              <Spinner size="sm" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload CSV for Print
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVUpload}
          />
          <Button onClick={() => fetchLatest.mutate()} disabled={fetchLatest.isPending}>
            <RefreshCw className={cn('size-4', fetchLatest.isPending && 'animate-spin')} />
            Fetch Latest
          </Button>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search Order"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Booking Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedOrders.length > 0 && (
                <span className="text-sm text-muted-foreground">{selectedOrders.length} selected</span>
              )}
              <Select
                value={selectedCompany}
                onValueChange={(v) => setSelectedCompany(v as CourierCompany)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Action" />
                </SelectTrigger>
                <SelectContent>
                  {COURIER_COMPANIES.map((company) => (
                    <SelectItem key={company.value} value={company.value}>{company.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setBookingDialogOpen(true)}
                disabled={!selectedCompany || selectedOrders.length === 0 || isGeneratingLabels}
              >
                {isGeneratingLabels ? <Spinner size="sm" /> : <Truck className="size-4" />}
                {isGeneratingLabels ? 'Generating...' : 'Done'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                      </TableHead>
                      <TableHead className="w-16">CN</TableHead>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="min-w-[260px]">Address</TableHead>
                      <TableHead className="w-24">City</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="w-24">Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Order ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrders.map((order) => (
                        <TableRow key={order._id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                          <TableCell>
                            <Checkbox
                              checked={selectedOrders.some((o) => o._id === order._id)}
                              onCheckedChange={() => toggleOrderSelection(order)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <button
                              className="text-primary hover:underline font-semibold"
                              onClick={() => setViewOrderId(order._id)}
                              title="View order details"
                            >
                              {order.cn ?? '—'}
                            </button>
                          </TableCell>
                          <TableCell className="whitespace-normal break-words">
                            {order.billing.first_name} {order.billing.last_name}
                          </TableCell>
                          <TableCell>{order.billing.phone}</TableCell>
                          <TableCell className="text-sm whitespace-normal break-words align-top">
                            {order.billing.address}, {order.billing.city}
                          </TableCell>
                          <TableCell className="whitespace-normal break-words max-w-[96px]">{order.billing.city}</TableCell>
                          <TableCell>Rs {order.total}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDate(order.dateCreated || order.date_created || '')}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order._id, value)}
                            >
                              <SelectTrigger
                                className={cn(
                                  'w-[130px] h-8 font-medium capitalize rounded-full text-xs shadow-none',
                                  getStatusColor(order.status)
                                )}
                              >
                                <SelectValue>{order.status}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status} className="capitalize">
                                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(status))}>
                                      {status}
                                    </span>
                                  </SelectItem>
                                ))}

                              </SelectContent>
                            </Select>
                            {(order.inventory?.status === 'partial' || order.inventory?.status === 'unmatched') && (
                              <Link
                                to="/inventory/order-issues"
                                className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-200"
                                title={order.inventory.issues?.map((i) => i.message).join('\n')}
                              >
                                <AlertTriangle className="size-3" />
                                Stock issue{(order.inventory.issues?.length ?? 0) > 1 ? 's' : ''}
                              </Link>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-normal break-words max-w-[150px]">
                            {order.remarks || ''}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            Order #{order.orderId}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={String(itemsPerPage)}
                    onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1) }}
                  >
                    <SelectTrigger className="w-[80px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {(currentPage - 1) * itemsPerPage + 1}–
                      {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
                    </p>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {viewOrder && (
        <OrderDetailsModal
          order={viewOrder}
          open={!!viewOrder}
          onClose={() => setViewOrderId(null)}
        />
      )}

      {/* Booking Confirmation Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={(open) => {
        setBookingDialogOpen(open)
        if (!open) setManualCompany('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {COURIER_COMPANIES.find((c) => c.value === selectedCompany)?.label}
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                {/* Manual booking: company picker */}
                {selectedCompany === 'manual' && (
                  <div className="mt-3 mb-2">
                    <p className="text-sm mb-2 font-medium text-foreground">Select courier company:</p>
                    <Select value={manualCompany} onValueChange={setManualCompany}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose company..." />
                      </SelectTrigger>
                      <SelectContent>
                        {['Leopard', 'TCS', 'Daewoo', 'Cargo'].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* City mapping hint */}
                {needsCityMapping && (
                  <p className="mt-3 mb-1 text-xs text-muted-foreground">
                    Select the {selectedCompany} city for each order before booking.
                  </p>
                )}

                {/* Order list */}
                {selectedOrders.length > 0 && (
                  <div className="mt-2 max-h-64 overflow-y-auto text-sm space-y-1">
                    {selectedOrders.map((selected, i) => {
                      // Use the live order from the store so the ✓ updates after mapping
                      const order = orders?.find((o) => o._id === selected._id) ?? selected
                      const ccd = order.billing.cityCompanydetails
                      const mapped = !!ccd && ccd.company === selectedCompany
                      const mappedLabel = mapped
                        ? activeCities.find((c) => c.id === String(ccd!.cityId))?.name ||
                          order.billing.city
                        : undefined
                      return (
                        <div
                          key={order._id}
                          className="flex items-center gap-2 border-b py-1.5 last:border-b-0"
                        >
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span className="flex-1 truncate">
                            {order.billing.first_name} {order.billing.last_name}
                            <span className="text-muted-foreground"> — {order.billing.city}</span>
                          </span>
                          {needsCityMapping && (
                            <CityCombobox
                              cities={activeCities}
                              mapped={mapped}
                              mappedLabel={mappedLabel}
                              loading={citiesLoading}
                              disabled={updateOrderCity.isPending}
                              onSelect={(city) => handleSelectCity(order._id, city)}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBookOrders}
              disabled={
                bookOrders.isPending ||
                (selectedCompany === 'manual' && !manualCompany)
              }
            >
              {bookOrders.isPending ? (
                <><Spinner size="sm" />Processing...</>
              ) : 'Okay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trax Receiving Sheet Dialog */}
      <Dialog
        open={receivingSheetDialog.open}
        onOpenChange={(open) => setReceivingSheetDialog((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Receiving Sheet</DialogTitle>
            <DialogDescription>
              <p className="mb-3">Successfully booked! Create a receiving sheet for these tracking IDs?</p>
              <div className="space-y-1 max-h-40 overflow-y-auto text-sm">
                {receivingSheetDialog.trackingIds.map((id) => (
                  <p key={id} className="font-mono">{id}</p>
                ))}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReceivingSheetDialog({ open: false, trackingIds: [] })}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateReceivingSheet} disabled={createReceivingSheet.isPending}>
              {createReceivingSheet.isPending ? <Spinner size="sm" /> : null}
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
