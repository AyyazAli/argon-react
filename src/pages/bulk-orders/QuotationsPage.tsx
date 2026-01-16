import { useState, useMemo } from 'react'
import {
  useQuotations,
  useCreateQuotation,
  useUpdateQuotation,
  useUpdateQuotationStatus,
  useDeleteQuotation,
} from '@/hooks'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { QuotationFormModal } from './QuotationFormModal'
import { QuotationDetailModal } from './QuotationDetailModal'
import { QuotationPDF } from '@/components/pdf/PDFGenerator'
import type { BulkQuotation, QuotationInput, QuotationStatus, BulkCustomer } from '@/types'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  MoreVertical,
  Download,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'

const QUOTATION_STATUSES: { value: QuotationStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'invoice_generated', label: 'Invoice Generated' },
]

const getStatusColor = (status: QuotationStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'sent':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'invoice_generated':
      return 'bg-violet-50 text-violet-700 border border-violet-200'
    default:
      return 'bg-gray-50 text-gray-700 border border-gray-200'
  }
}

export function QuotationsPage() {
  const { data: quotations, isLoading } = useQuotations()
  const createQuotation = useCreateQuotation()
  const updateQuotation = useUpdateQuotation()
  const updateStatus = useUpdateQuotationStatus()
  const deleteQuotation = useDeleteQuotation()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<BulkQuotation | null>(null)
  const [quotationToDelete, setQuotationToDelete] = useState<BulkQuotation | null>(null)
  const [quotationForStatusChange, setQuotationForStatusChange] = useState<BulkQuotation | null>(null)
  const [selectedQuotation, setSelectedQuotation] = useState<BulkQuotation | null>(null)
  const [newStatus, setNewStatus] = useState<QuotationStatus>('pending')
  const [statusNotes, setStatusNotes] = useState('')

  const filteredQuotations = useMemo(() => {
    if (!quotations) return []

    return quotations.filter((quotation) => {
      const customer = quotation.customer as BulkCustomer
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        quotation.quotationNumber.toLowerCase().includes(query) ||
        customer?.companyName?.toLowerCase().includes(query) ||
        customer?.contactName?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || quotation.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [quotations, searchQuery, statusFilter])

  const handleOpenForm = (quotation?: BulkQuotation) => {
    if (quotation) {
      setEditingQuotation(quotation)
    } else {
      setEditingQuotation(null)
    }
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingQuotation(null)
  }

  const handleSubmit = async (data: QuotationInput) => {
    if (editingQuotation) {
      await updateQuotation.mutateAsync({ id: editingQuotation._id, data })
    } else {
      await createQuotation.mutateAsync(data)
    }
  }

  const handleStatusChangeClick = (quotation: BulkQuotation, status: QuotationStatus) => {
    setQuotationForStatusChange(quotation)
    setNewStatus(status)
    setStatusNotes('')
    setIsStatusDialogOpen(true)
  }

  const handleStatusChange = async () => {
    if (quotationForStatusChange) {
      await updateStatus.mutateAsync({ 
        id: quotationForStatusChange._id, 
        status: newStatus,
        notes: statusNotes || undefined
      })
      setIsStatusDialogOpen(false)
      setQuotationForStatusChange(null)
      setStatusNotes('')
    }
  }

  const handleDelete = async () => {
    if (quotationToDelete) {
      await deleteQuotation.mutateAsync(quotationToDelete._id)
      setIsDeleteDialogOpen(false)
      setQuotationToDelete(null)
    }
  }

  const openDeleteDialog = (quotation: BulkQuotation) => {
    setQuotationToDelete(quotation)
    setIsDeleteDialogOpen(true)
  }

  const handleDownloadPDF = async (quotation: BulkQuotation) => {
    const blob = await pdf(<QuotationPDF quotation={quotation} />).toBlob()
    saveAs(blob, `${quotation.quotationNumber}.pdf`)
  }

  const handleViewQuotation = (quotation: BulkQuotation) => {
    setSelectedQuotation(quotation)
    setIsDetailModalOpen(true)
  }

  const getCustomerName = (quotation: BulkQuotation) => {
    const customer = quotation.customer as BulkCustomer
    return customer?.companyName || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground">
            Create and manage bulk order quotations
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="size-4" />
          New Quotation
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search quotations..."
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
                {QUOTATION_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Quotations ({filteredQuotations.length})
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
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No quotations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotations.map((quotation) => (
                      <TableRow key={quotation._id}>
                        <TableCell className="font-medium font-mono">
                          {quotation.quotationNumber}
                        </TableCell>
                        <TableCell>{getCustomerName(quotation)}</TableCell>
                        <TableCell>{quotation.items.length}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(quotation.grandTotal)}
                        </TableCell>
                        <TableCell>
                          {quotation.validUntil
                            ? formatDate(quotation.validUntil)
                            : '-'}
                        </TableCell>
                        <TableCell>{formatDate(quotation.dateCreated)}</TableCell>
                        <TableCell>
                          <Select
                            value={quotation.status}
                            onValueChange={(value) =>
                              handleStatusChangeClick(quotation, value as QuotationStatus)
                            }
                            disabled={quotation.status === 'invoice_generated'}
                          >
                            <SelectTrigger
                              className={cn(
                                'w-[140px] h-8 font-medium capitalize rounded-full text-xs shadow-none',
                                getStatusColor(quotation.status)
                              )}
                            >
                              <SelectValue>
                                {QUOTATION_STATUSES.find((s) => s.value === quotation.status)?.label}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {QUOTATION_STATUSES.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                  disabled={
                                    status.value === 'invoice_generated' ||
                                    quotation.status === 'invoice_generated'
                                  }
                                >
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded-full text-xs font-medium',
                                      getStatusColor(status.value)
                                    )}
                                  >
                                    {status.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewQuotation(quotation)}>
                                <Eye className="size-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(quotation)}>
                                <Download className="size-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              {quotation.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleOpenForm(quotation)}>
                                  <Pencil className="size-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {quotation.status === 'sent' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    (window.location.hash = `/invoices?quotation=${quotation._id}`)
                                  }
                                >
                                  <ArrowRight className="size-4 mr-2" />
                                  Create Invoice
                                </DropdownMenuItem>
                              )}
                              {quotation.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(quotation)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
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

      {/* Quotation Form Modal */}
      <QuotationFormModal
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        editingQuotation={editingQuotation}
        isSubmitting={createQuotation.isPending || updateQuotation.isPending}
      />

      {/* Quotation Detail Modal */}
      <QuotationDetailModal
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedQuotation(null)
        }}
        quotation={selectedQuotation}
      />

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Quotation Status</DialogTitle>
            <DialogDescription>
              Change status for quotation {quotationForStatusChange?.quotationNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as QuotationStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTATION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value} disabled={
                      status.value === 'invoice_generated'
                    }>
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
            <Button onClick={handleStatusChange} disabled={updateStatus.isPending}>
              {updateStatus.isPending && <Spinner size="sm" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quotation "{quotationToDelete?.quotationNumber}"?
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
              disabled={deleteQuotation.isPending}
            >
              {deleteQuotation.isPending && <Spinner size="sm" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
