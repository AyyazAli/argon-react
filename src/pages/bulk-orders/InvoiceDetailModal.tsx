import { formatDate, formatCurrency, cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { BulkInvoice, BulkCustomer, BulkQuotation, InvoiceStatus } from '@/types'
import { X, Clock, User } from 'lucide-react'

interface InvoiceDetailModalProps {
  open: boolean
  onClose: () => void
  invoice: BulkInvoice | null
}

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
    default:
      return 'bg-gray-50 text-gray-700 border border-gray-200'
  }
}

export function InvoiceDetailModal({
  open,
  onClose,
  invoice,
}: InvoiceDetailModalProps) {
  if (!invoice) return null

  const customer = invoice.customer as BulkCustomer
  const quotation = invoice.quotation as BulkQuotation

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-[90vw] !max-w-[90vw] sm:!max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Invoice Details</DialogTitle>
              <DialogDescription className="mt-2">
                Invoice #{invoice.invoiceNumber}
              </DialogDescription>
            </div>
            <Badge className={cn('px-3 py-1', getInvoiceStatusColor(invoice.status))}>
              {invoice.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer & Invoice Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Bill To</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Company:</span>{' '}
                    <span className="font-medium">{customer?.companyName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact:</span>{' '}
                    <span className="font-medium">{customer?.contactName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <span className="font-medium">{customer?.phone}</span>
                  </div>
                  {customer?.email && (
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      <span className="font-medium">{customer.email}</span>
                    </div>
                  )}
                  {customer?.address && (
                    <div>
                      <span className="text-muted-foreground">Address:</span>{' '}
                      <span className="font-medium">
                        {customer.address}
                        {customer.city ? `, ${customer.city}` : ''}
                      </span>
                    </div>
                  )}
                  {customer?.ntn && (
                    <div>
                      <span className="text-muted-foreground">NTN:</span>{' '}
                      <span className="font-medium">{customer.ntn}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Invoice Information</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Invoice Number:</span>{' '}
                    <span className="font-medium font-mono">{invoice.invoiceNumber}</span>
                  </div>
                  {quotation && (
                    <div>
                      <span className="text-muted-foreground">Quotation:</span>{' '}
                      <span className="font-medium font-mono">
                        {typeof quotation === 'string' ? quotation : quotation.quotationNumber}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{formatDate(invoice.dateCreated)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <span className="text-muted-foreground">Due Date:</span>{' '}
                      <span className="font-medium text-destructive">
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                  )}
                  {invoice.paymentTerms && (
                    <div>
                      <span className="text-muted-foreground">Payment Terms:</span>{' '}
                      <span className="font-medium">{invoice.paymentTerms}</span>
                    </div>
                  )}
                  {invoice.createdBy && (
                    <div>
                      <span className="text-muted-foreground">Created By:</span>{' '}
                      <span className="font-medium">
                        {typeof invoice.createdBy === 'string'
                          ? invoice.createdBy
                          : invoice.createdBy.name || invoice.createdBy.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Discount %</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{item.discountPercent}%</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2 bg-muted/30 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.deliveryAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Amount:</span>
                  <span className="font-medium">{formatCurrency(invoice.deliveryAmount)}</span>
                </div>
              )}
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.taxPercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({invoice.taxPercent}%):</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total:</span>
                <span>{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="bg-muted/30 rounded-lg p-4 text-sm">{invoice.notes}</div>
            </div>
          )}

          {/* Status History */}
          {invoice.statusHistory && invoice.statusHistory.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="size-4" />
                Status History
              </h3>
              <div className="space-y-3">
                {invoice.statusHistory.map((history, index) => (
                  <div
                    key={history._id || index}
                    className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={cn(
                              'px-2 py-0.5 text-xs',
                              getInvoiceStatusColor(history.status as InvoiceStatus)
                            )}
                          >
                            {history.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(history.changedAt)}
                          </span>
                        </div>
                        {history.changedBy && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <User className="size-3" />
                            <span>
                              Changed by:{' '}
                              {typeof history.changedBy === 'string'
                                ? history.changedBy
                                : history.changedBy.name || history.changedBy.email}
                            </span>
                          </div>
                        )}
                        {history.notes && (
                          <div className="mt-2 text-sm bg-background rounded p-2 border">
                            <span className="font-medium">Notes: </span>
                            {history.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}



