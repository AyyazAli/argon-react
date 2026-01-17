import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInvoices, useQuotations, useCreateInvoice, useUpdateInvoice, useUpdateInvoiceStatus, useDeleteInvoice } from '@/hooks'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { InvoiceFormModal } from './InvoiceFormModal'
import { InvoiceDetailModal } from './InvoiceDetailModal'
import { InvoicePDF } from '@/components/pdf/PDFGenerator'
import type { BulkInvoice, BulkQuotation, InvoiceInput, BulkCustomer, InvoiceStatus } from '@/types'
import { Search, FileText, MoreVertical, Download, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { useAuthStore } from '@/stores'

const INVOICE_STATUSES: { value: InvoiceStatus; label: string }[] = [
  { value: 'sent', label: 'Sent' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const getInvoiceStatusColor = (status: InvoiceStatus) => {
  switch (status) {
    case 'sent':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'pending_payment':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'payment_received':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'delivered':
      return 'bg-violet-50 text-violet-700 border border-violet-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border border-red-200'
    default:
      return 'bg-gray-50 text-gray-700 border border-gray-200'
  }
}

export function InvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: invoices, isLoading } = useInvoices()
  const { data: quotations } = useQuotations()
  const { role } = useAuthStore()
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const updateInvoiceStatus = useUpdateInvoiceStatus()
  const deleteInvoice = useDeleteInvoice()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [salesPersonFilter, setSalesPersonFilter] = useState<string>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<BulkQuotation | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<BulkInvoice | null>(null)
  const [invoiceForStatusChange, setInvoiceForStatusChange] = useState<BulkInvoice | null>(null)
  const [invoiceToDelete, setInvoiceToDelete] = useState<BulkInvoice | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<BulkInvoice | null>(null)
  const [newStatus, setNewStatus] = useState<InvoiceStatus>('sent')
  const [statusNotes, setStatusNotes] = useState('')

  const isAdmin = role === 'admin' || role === 'superAdmin'

  // Handle quotation param from URL (when clicking "Create Invoice" from Quotations page)
  useEffect(() => {
    const quotationId = searchParams.get('quotation')
    if (quotationId && quotations) {
      const quotation = quotations.find((q) => q._id === quotationId)
      if (quotation && quotation.status === 'sent') {
        setSelectedQuotation(quotation)
        setIsFormOpen(true)
        // Clear the URL param
        setSearchParams({})
      }
    }
  }, [searchParams, quotations, setSearchParams])

  // Get unique sales persons from invoices
  const salesPersons = useMemo(() => {
    if (!invoices) return []
    const uniquePersons = new Map<string, { _id: string; name: string; email: string }>()
    invoices.forEach((invoice) => {
      if (invoice.createdBy) {
        uniquePersons.set(invoice.createdBy._id, invoice.createdBy)
      }
    })
    return Array.from(uniquePersons.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    if (!invoices) return []

    return invoices.filter((invoice) => {
      const customer = invoice.customer as BulkCustomer
      const quotation = invoice.quotation as BulkQuotation
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        customer?.companyName?.toLowerCase().includes(query) ||
        customer?.contactName?.toLowerCase().includes(query) ||
        quotation?.quotationNumber?.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

      const matchesSalesPerson =
        salesPersonFilter === 'all' ||
        (invoice.createdBy && invoice.createdBy._id === salesPersonFilter)

      return matchesSearch && matchesStatus && matchesSalesPerson
    })
  }, [invoices, searchQuery, statusFilter, salesPersonFilter])

  // Get sent quotations that don't have invoices yet and are not cancelled
  const availableQuotations = useMemo(() => {
    if (!quotations || !invoices) return []
    const invoicedQuotationIds = new Set(
      invoices.map((inv) =>
        typeof inv.quotation === 'string' ? inv.quotation : inv.quotation._id
      )
    )
    return quotations.filter(
      (q) => q.status === 'sent' && !invoicedQuotationIds.has(q._id)
    )
  }, [quotations, invoices])

  const handleOpenForm = (quotation: BulkQuotation) => {
    setSelectedQuotation(quotation)
    setEditingInvoice(null)
    setIsFormOpen(true)
  }

  const handleEditInvoice = (invoice: BulkInvoice) => {
    setEditingInvoice(invoice)
    setSelectedQuotation(null)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedQuotation(null)
    setEditingInvoice(null)
  }

  const handleSubmit = async (data: InvoiceInput | any) => {
    if (editingInvoice) {
      await updateInvoice.mutateAsync({ id: editingInvoice._id, data })
    } else {
      await createInvoice.mutateAsync(data)
    }
  }

  const handleDownloadPDF = async (invoice: BulkInvoice) => {
    const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob()
    saveAs(blob, `${invoice.invoiceNumber}.pdf`)
  }

  const handleViewInvoice = (invoice: BulkInvoice) => {
    setSelectedInvoice(invoice)
    setIsDetailModalOpen(true)
  }

  const handleDeleteClick = (invoice: BulkInvoice) => {
    setInvoiceToDelete(invoice)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (invoiceToDelete) {
      await deleteInvoice.mutateAsync(invoiceToDelete._id)
      setIsDeleteDialogOpen(false)
      setInvoiceToDelete(null)
    }
  }

  const getCustomerName = (invoice: BulkInvoice) => {
    const customer = invoice.customer as BulkCustomer
    return customer?.companyName || 'Unknown'
  }

  const getQuotationNumber = (invoice: BulkInvoice) => {
    const quotation = invoice.quotation as BulkQuotation
    return quotation?.quotationNumber || '-'
  }

  const getFinalAmount = (invoice: BulkInvoice) => {
    return invoice.grandTotal - (invoice.advanceAmount || 0)
  }

  const getSalesPersonName = (invoice: BulkInvoice) => {
    return invoice.createdBy?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            Manage generated invoices from bulk orders
          </p>
        </div>
        {availableQuotations.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="size-4" />
                New Invoice
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {availableQuotations.map((quotation) => {
                const customer = quotation.customer as BulkCustomer
                return (
                  <DropdownMenuItem
                    key={quotation._id}
                    onClick={() => handleOpenForm(quotation)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{quotation.quotationNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {customer?.companyName} - {formatCurrency(quotation.grandTotal)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
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
                {INVOICE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={salesPersonFilter} onValueChange={setSalesPersonFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by sales person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales Persons</SelectItem>
                {salesPersons.map((person) => (
                  <SelectItem key={person._id} value={person._id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Invoices ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Advance</TableHead>
                    <TableHead className="text-right">Final Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Sales Person</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell className="font-medium font-mono">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {getQuotationNumber(invoice)}
                        </TableCell>
                        <TableCell>{getCustomerName(invoice)}</TableCell>
                        <TableCell>{invoice.items.length}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.grandTotal)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {invoice.advanceAmount ? formatCurrency(invoice.advanceAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(getFinalAmount(invoice))}
                        </TableCell>
                        <TableCell>
                          {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                        </TableCell>
                        <TableCell>{getSalesPersonName(invoice)}</TableCell>
                        <TableCell>
                          <Select
                            value={invoice.status}
                            onValueChange={(value) => {
                              setInvoiceForStatusChange(invoice)
                              setNewStatus(value as InvoiceStatus)
                              setStatusNotes('')
                              setIsStatusDialogOpen(true)
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                'w-[150px] h-8 font-medium capitalize rounded-full text-xs shadow-none',
                                getInvoiceStatusColor(invoice.status)
                              )}
                            >
                              <SelectValue>
                                {INVOICE_STATUSES.find((s) => s.value === invoice.status)?.label}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {INVOICE_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded-full text-xs font-medium',
                                      getInvoiceStatusColor(status.value)
                                    )}
                                  >
                                    {status.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{formatDate(invoice.dateCreated)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="size-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {isAdmin && invoice.status !== 'cancelled' && (
                                <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                  <Pencil className="size-4 mr-2" />
                                  Edit Invoice
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                                <Download className="size-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              {isAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(invoice)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Invoice Form Modal */}
      <InvoiceFormModal
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        quotation={selectedQuotation}
        invoice={editingInvoice}
        isSubmitting={createInvoice.isPending || updateInvoice.isPending}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedInvoice(null)
        }}
        invoice={selectedInvoice}
      />

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Status</DialogTitle>
            <DialogDescription>
              Change status for invoice {invoiceForStatusChange?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as InvoiceStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (invoiceForStatusChange) {
                  await updateInvoiceStatus.mutateAsync({
                    id: invoiceForStatusChange._id,
                    status: newStatus,
                    notes: statusNotes || undefined,
                  })
                  setIsStatusDialogOpen(false)
                  setInvoiceForStatusChange(null)
                  setStatusNotes('')
                }
              }}
              disabled={updateInvoiceStatus.isPending}
            >
              {updateInvoiceStatus.isPending && <Spinner size="sm" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice "{invoiceToDelete?.invoiceNumber}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteInvoice.isPending}
            >
              {deleteInvoice.isPending && <Spinner size="sm" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
