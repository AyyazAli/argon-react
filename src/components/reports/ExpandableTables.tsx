import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from '@/components/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FileText,
  Receipt,
  Users,
  ArrowUpDown,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type {
  BulkQuotation,
  BulkInvoice,
  SalesPersonPerformance,
  QuotationStatus,
  InvoiceStatus,
  BulkCustomer,
} from '@/types'

// ============= STATUS BADGES =============

const QUOTATION_STATUS_COLORS: Record<QuotationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  sent: 'bg-blue-50 text-blue-700 border border-blue-200',
  invoice_generated: 'bg-violet-50 text-violet-700 border border-violet-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
}

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  sent: 'bg-blue-50 text-blue-700 border border-blue-200',
  pending_payment: 'bg-amber-50 text-amber-700 border border-amber-200',
  payment_received: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  delivered: 'bg-violet-50 text-violet-700 border border-violet-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  sent: 'Sent',
  invoice_generated: 'Invoice Generated',
  cancelled: 'Cancelled',
  pending_payment: 'Pending Payment',
  payment_received: 'Payment Received',
  delivered: 'Delivered',
}

// ============= HELPER COMPONENTS =============

function StatusBadge({
  status,
  type,
}: {
  status: string
  type: 'quotation' | 'invoice'
}) {
  const colors =
    type === 'quotation'
      ? QUOTATION_STATUS_COLORS[status as QuotationStatus]
      : INVOICE_STATUS_COLORS[status as InvoiceStatus]

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', colors)}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function ExpandButton({
  isExpanded,
  onClick,
}: {
  isExpanded: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 hover:bg-slate-100"
      onClick={onClick}
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </Button>
  )
}

type SortDirection = 'asc' | 'desc' | null

function SortableHeader({
  children,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
}: {
  children: React.ReactNode
  sortKey: string
  currentSort: string | null
  currentDirection: SortDirection
  onSort: (key: string) => void
}) {
  const isActive = currentSort === sortKey

  return (
    <TableHead
      className="cursor-pointer hover:bg-slate-50 select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          className={cn(
            'h-3 w-3 transition-colors',
            isActive ? 'text-indigo-600' : 'text-slate-300'
          )}
        />
        {isActive && (
          <span className="text-xs text-indigo-600">
            {currentDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </TableHead>
  )
}

// ============= QUOTATIONS TABLE =============

interface QuotationsTableProps {
  data?: BulkQuotation[]
  isLoading?: boolean
}

export function QuotationsTable({ data, isLoading = false }: QuotationsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<string | null>('dateCreated')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const sortedData = [...(data || [])].sort((a, b) => {
    if (!sortKey) return 0

    let aVal: any, bVal: any

    switch (sortKey) {
      case 'quotationNumber':
        aVal = a.quotationNumber
        bVal = b.quotationNumber
        break
      case 'customer':
        aVal = typeof a.customer === 'object' ? (a.customer as BulkCustomer).companyName : ''
        bVal = typeof b.customer === 'object' ? (b.customer as BulkCustomer).companyName : ''
        break
      case 'grandTotal':
        aVal = a.grandTotal
        bVal = b.grandTotal
        break
      case 'dateCreated':
        aVal = new Date(a.dateCreated).getTime()
        bVal = new Date(b.dateCreated).getTime()
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          Quotations Detail ({sortedData.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No quotations found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10"></TableHead>
                  <SortableHeader
                    sortKey="quotationNumber"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Quotation #
                  </SortableHeader>
                  <SortableHeader
                    sortKey="customer"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Customer
                  </SortableHeader>
                  <TableHead>Sales Person</TableHead>
                  <TableHead>Status</TableHead>
                  <SortableHeader
                    sortKey="grandTotal"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Amount
                  </SortableHeader>
                  <SortableHeader
                    sortKey="dateCreated"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Date
                  </SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((quotation) => {
                  const isExpanded = expandedRows.has(quotation._id)
                  const customer =
                    typeof quotation.customer === 'object'
                      ? quotation.customer
                      : null

                  return (
                    <>
                      <TableRow
                        key={quotation._id}
                        className={cn(
                          'hover:bg-slate-50 cursor-pointer',
                          isExpanded && 'bg-slate-50'
                        )}
                        onClick={() => toggleRow(quotation._id)}
                      >
                        <TableCell>
                          <ExpandButton
                            isExpanded={isExpanded}
                            onClick={() => toggleRow(quotation._id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-indigo-600">
                          {quotation.quotationNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {customer?.companyName || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {customer?.contactName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {quotation.createdBy && typeof quotation.createdBy === 'object'
                            ? quotation.createdBy.name || quotation.createdBy.email
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={quotation.status} type="quotation" />
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(quotation.grandTotal)}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {formatDate(quotation.dateCreated)}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-slate-50/50">
                          <TableCell colSpan={7} className="p-4">
                            <div className="space-y-4 pl-8">
                              {/* Items */}
                              <div>
                                <h4 className="font-medium text-slate-700 mb-2">
                                  Items ({quotation.items?.length || 0})
                                </h4>
                                <div className="grid grid-cols-4 gap-2 text-sm">
                                  {quotation.items?.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-white p-2 rounded border"
                                    >
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-slate-500">
                                        {item.quantity} x {formatCurrency(item.unitPrice)}
                                      </div>
                                      <div className="text-indigo-600 font-medium">
                                        {formatCurrency(item.total)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* Notes */}
                              {quotation.notes && (
                                <div>
                                  <h4 className="font-medium text-slate-700 mb-1">Notes</h4>
                                  <p className="text-sm text-slate-500">{quotation.notes}</p>
                                </div>
                              )}
                              {/* Summary */}
                              <div className="flex gap-4 text-sm">
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-slate-500">Subtotal:</span>{' '}
                                  <span className="font-medium">
                                    {formatCurrency(quotation.subtotal)}
                                  </span>
                                </div>
                                {quotation.discountAmount > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-slate-500">Discount:</span>{' '}
                                    <span className="font-medium text-red-600">
                                      -{formatCurrency(quotation.discountAmount)}
                                    </span>
                                  </div>
                                )}
                                {quotation.taxAmount > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-slate-500">
                                      Tax ({quotation.taxPercent}%):
                                    </span>{' '}
                                    <span className="font-medium">
                                      {formatCurrency(quotation.taxAmount)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============= INVOICES TABLE =============

interface InvoicesTableProps {
  data?: BulkInvoice[]
  isLoading?: boolean
}

export function InvoicesTable({ data, isLoading = false }: InvoicesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<string | null>('dateCreated')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const sortedData = [...(data || [])].sort((a, b) => {
    if (!sortKey) return 0

    let aVal: any, bVal: any

    switch (sortKey) {
      case 'invoiceNumber':
        aVal = a.invoiceNumber
        bVal = b.invoiceNumber
        break
      case 'customer':
        aVal = typeof a.customer === 'object' ? (a.customer as BulkCustomer).companyName : ''
        bVal = typeof b.customer === 'object' ? (b.customer as BulkCustomer).companyName : ''
        break
      case 'grandTotal':
        aVal = a.grandTotal
        bVal = b.grandTotal
        break
      case 'dateCreated':
        aVal = new Date(a.dateCreated).getTime()
        bVal = new Date(b.dateCreated).getTime()
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Receipt className="h-5 w-5 text-violet-600" />
          </div>
          Invoices Detail ({sortedData.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10"></TableHead>
                  <SortableHeader
                    sortKey="invoiceNumber"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Invoice #
                  </SortableHeader>
                  <SortableHeader
                    sortKey="customer"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Customer
                  </SortableHeader>
                  <TableHead>Sales Person</TableHead>
                  <TableHead>Status</TableHead>
                  <SortableHeader
                    sortKey="grandTotal"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Amount
                  </SortableHeader>
                  <SortableHeader
                    sortKey="dateCreated"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Date
                  </SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((invoice) => {
                  const isExpanded = expandedRows.has(invoice._id)
                  const customer =
                    typeof invoice.customer === 'object' ? invoice.customer : null
                  const quotation =
                    typeof invoice.quotation === 'object' ? invoice.quotation : null

                  return (
                    <>
                      <TableRow
                        key={invoice._id}
                        className={cn(
                          'hover:bg-slate-50 cursor-pointer',
                          isExpanded && 'bg-slate-50'
                        )}
                        onClick={() => toggleRow(invoice._id)}
                      >
                        <TableCell>
                          <ExpandButton
                            isExpanded={isExpanded}
                            onClick={() => toggleRow(invoice._id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-violet-600">
                              {invoice.invoiceNumber}
                            </div>
                            {quotation && (
                              <div className="text-xs text-slate-400">
                                from {quotation.quotationNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {customer?.companyName || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {customer?.contactName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.createdBy && typeof invoice.createdBy === 'object'
                            ? invoice.createdBy.name || invoice.createdBy.email
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status} type="invoice" />
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(invoice.grandTotal)}
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {formatDate(invoice.dateCreated)}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-slate-50/50">
                          <TableCell colSpan={7} className="p-4">
                            <div className="space-y-4 pl-8">
                              {/* Items */}
                              <div>
                                <h4 className="font-medium text-slate-700 mb-2">
                                  Items ({invoice.items?.length || 0})
                                </h4>
                                <div className="grid grid-cols-4 gap-2 text-sm">
                                  {invoice.items?.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-white p-2 rounded border"
                                    >
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-slate-500">
                                        {item.quantity} x {formatCurrency(item.unitPrice)}
                                      </div>
                                      <div className="text-violet-600 font-medium">
                                        {formatCurrency(item.total)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* Payment Details */}
                              <div className="flex gap-4 text-sm">
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-slate-500">Subtotal:</span>{' '}
                                  <span className="font-medium">
                                    {formatCurrency(invoice.subtotal)}
                                  </span>
                                </div>
                                {invoice.advanceAmount && invoice.advanceAmount > 0 && (
                                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                                    <span className="text-emerald-600">Advance:</span>{' '}
                                    <span className="font-medium text-emerald-700">
                                      {formatCurrency(invoice.advanceAmount)}
                                    </span>
                                  </div>
                                )}
                                {invoice.dueDate && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-slate-500">Due Date:</span>{' '}
                                    <span className="font-medium">
                                      {formatDate(invoice.dueDate)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {/* Notes */}
                              {invoice.notes && (
                                <div>
                                  <h4 className="font-medium text-slate-700 mb-1">Notes</h4>
                                  <p className="text-sm text-slate-500">{invoice.notes}</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============= SALES PERSON TABLE =============

interface SalesPersonTableProps {
  data?: SalesPersonPerformance[]
  isLoading?: boolean
}

export function SalesPersonTable({ data, isLoading = false }: SalesPersonTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<string | null>('invoices.amount')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const sortedData = [...(data || [])].sort((a, b) => {
    if (!sortKey) return 0

    let aVal: any, bVal: any

    switch (sortKey) {
      case 'name':
        aVal = a.name
        bVal = b.name
        break
      case 'quotations.count':
        aVal = a.quotations.count
        bVal = b.quotations.count
        break
      case 'quotations.amount':
        aVal = a.quotations.amount
        bVal = b.quotations.amount
        break
      case 'invoices.count':
        aVal = a.invoices.count
        bVal = b.invoices.count
        break
      case 'invoices.amount':
        aVal = a.invoices.amount
        bVal = b.invoices.amount
        break
      case 'invoices.receivedAmount':
        aVal = a.invoices.receivedAmount
        bVal = b.invoices.receivedAmount
        break
      case 'conversionRate':
        aVal = parseFloat(String(a.conversionRate)) || 0
        bVal = parseFloat(String(b.conversionRate)) || 0
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Users className="h-5 w-5 text-teal-600" />
          </div>
          Sales Person Performance ({sortedData.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No sales person data found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10"></TableHead>
                  <SortableHeader
                    sortKey="name"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Sales Person
                  </SortableHeader>
                  <SortableHeader
                    sortKey="quotations.count"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Quotations
                  </SortableHeader>
                  <SortableHeader
                    sortKey="quotations.amount"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Quotation Amt
                  </SortableHeader>
                  <SortableHeader
                    sortKey="invoices.count"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Invoices
                  </SortableHeader>
                  <SortableHeader
                    sortKey="invoices.amount"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Invoice Amt
                  </SortableHeader>
                  <SortableHeader
                    sortKey="invoices.receivedAmount"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Received
                  </SortableHeader>
                  <SortableHeader
                    sortKey="conversionRate"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Conversion
                  </SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((sp) => {
                  const isExpanded = expandedRows.has(sp.userId)

                  return (
                    <>
                      <TableRow
                        key={sp.userId}
                        className={cn(
                          'hover:bg-slate-50 cursor-pointer',
                          isExpanded && 'bg-slate-50'
                        )}
                        onClick={() => toggleRow(sp.userId)}
                      >
                        <TableCell>
                          <ExpandButton
                            isExpanded={isExpanded}
                            onClick={() => toggleRow(sp.userId)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-teal-600">{sp.name}</div>
                            <div className="text-xs text-slate-400">{sp.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {sp.quotations.count}
                        </TableCell>
                        <TableCell className="font-medium text-indigo-600">
                          {formatCurrency(sp.quotations.amount)}
                        </TableCell>
                        <TableCell className="font-medium">{sp.invoices.count}</TableCell>
                        <TableCell className="font-medium text-violet-600">
                          {formatCurrency(sp.invoices.amount)}
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          {formatCurrency(sp.invoices.receivedAmount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'px-2 py-1 text-xs font-medium rounded-full',
                              parseFloat(String(sp.conversionRate)) >= 50
                                ? 'bg-emerald-50 text-emerald-700'
                                : parseFloat(String(sp.conversionRate)) >= 25
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                            )}
                          >
                            {sp.conversionRate}%
                          </span>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-slate-50/50">
                          <TableCell colSpan={8} className="p-4">
                            <div className="grid grid-cols-2 gap-6 pl-8">
                              {/* Quotation Breakdown */}
                              <div>
                                <h4 className="font-medium text-slate-700 mb-3">
                                  Quotation Breakdown
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="bg-amber-50 p-2 rounded border border-amber-200">
                                    <span className="text-amber-600">Pending:</span>{' '}
                                    <span className="font-medium">{sp.quotations.pending}</span>
                                  </div>
                                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    <span className="text-blue-600">Sent:</span>{' '}
                                    <span className="font-medium">{sp.quotations.sent}</span>
                                  </div>
                                  <div className="bg-violet-50 p-2 rounded border border-violet-200">
                                    <span className="text-violet-600">Invoice Generated:</span>{' '}
                                    <span className="font-medium">
                                      {sp.quotations.invoiceGenerated}
                                    </span>
                                  </div>
                                  <div className="bg-red-50 p-2 rounded border border-red-200">
                                    <span className="text-red-600">Cancelled:</span>{' '}
                                    <span className="font-medium">{sp.quotations.cancelled}</span>
                                  </div>
                                </div>
                              </div>
                              {/* Invoice Breakdown */}
                              <div>
                                <h4 className="font-medium text-slate-700 mb-3">
                                  Invoice Breakdown
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                                    <span className="text-emerald-600">Received:</span>{' '}
                                    <span className="font-medium">{sp.invoices.received}</span>
                                  </div>
                                  <div className="bg-amber-50 p-2 rounded border border-amber-200">
                                    <span className="text-amber-600">Pending:</span>{' '}
                                    <span className="font-medium">{sp.invoices.pending}</span>
                                  </div>
                                  <div className="bg-violet-50 p-2 rounded border border-violet-200">
                                    <span className="text-violet-600">Delivered:</span>{' '}
                                    <span className="font-medium">{sp.invoices.delivered}</span>
                                  </div>
                                  <div className="bg-red-50 p-2 rounded border border-red-200">
                                    <span className="text-red-600">Cancelled:</span>{' '}
                                    <span className="font-medium">{sp.invoices.cancelled}</span>
                                  </div>
                                </div>
                                <div className="mt-3 p-2 bg-slate-100 rounded text-sm">
                                  <span className="text-slate-600">Pending Amount:</span>{' '}
                                  <span className="font-medium text-amber-600">
                                    {formatCurrency(sp.invoices.pendingAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============= TABBED TABLES COMPONENT =============

interface TabbedTablesProps {
  quotations?: BulkQuotation[]
  invoices?: BulkInvoice[]
  salesPersons?: SalesPersonPerformance[]
  isLoading?: boolean
}

export function TabbedTables({
  quotations,
  invoices,
  salesPersons,
  isLoading = false,
}: TabbedTablesProps) {
  return (
    <Tabs defaultValue="quotations" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-slate-100">
        <TabsTrigger
          value="quotations"
          className="data-[state=active]:bg-white data-[state=active]:text-indigo-600"
        >
          <FileText className="h-4 w-4 mr-2" />
          Quotations
        </TabsTrigger>
        <TabsTrigger
          value="invoices"
          className="data-[state=active]:bg-white data-[state=active]:text-violet-600"
        >
          <Receipt className="h-4 w-4 mr-2" />
          Invoices
        </TabsTrigger>
        <TabsTrigger
          value="salesPersons"
          className="data-[state=active]:bg-white data-[state=active]:text-teal-600"
        >
          <Users className="h-4 w-4 mr-2" />
          Sales Persons
        </TabsTrigger>
      </TabsList>
      <TabsContent value="quotations" className="mt-4">
        <QuotationsTable data={quotations} isLoading={isLoading} />
      </TabsContent>
      <TabsContent value="invoices" className="mt-4">
        <InvoicesTable data={invoices} isLoading={isLoading} />
      </TabsContent>
      <TabsContent value="salesPersons" className="mt-4">
        <SalesPersonTable data={salesPersons} isLoading={isLoading} />
      </TabsContent>
    </Tabs>
  )
}
