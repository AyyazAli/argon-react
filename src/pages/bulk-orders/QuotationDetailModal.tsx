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
import type { BulkQuotation, BulkCustomer, QuotationStatus } from '@/types'
import { Clock, User } from 'lucide-react'

interface QuotationDetailModalProps {
  open: boolean
  onClose: () => void
  quotation: BulkQuotation | null
}

const getQuotationStatusColor = (status: QuotationStatus) => {
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

export function QuotationDetailModal({
  open,
  onClose,
  quotation,
}: QuotationDetailModalProps) {
  if (!quotation) return null

  const customer = quotation.customer as BulkCustomer

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-[90vw] !max-w-[90vw] sm:!max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Quotation Details</DialogTitle>
              <DialogDescription className="mt-2">
                Quotation #{quotation.quotationNumber}
              </DialogDescription>
            </div>
            <Badge className={cn('px-3 py-1', getQuotationStatusColor(quotation.status))}>
              {quotation.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer & Quotation Info */}
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
                <h3 className="font-semibold mb-2">Quotation Information</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quotation Number:</span>{' '}
                    <span className="font-medium font-mono">{quotation.quotationNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">{formatDate(quotation.dateCreated)}</span>
                  </div>
                  {quotation.validUntil && (
                    <div>
                      <span className="text-muted-foreground">Valid Until:</span>{' '}
                      <span className="font-medium text-destructive">
                        {formatDate(quotation.validUntil)}
                      </span>
                    </div>
                  )}
                  {quotation.createdBy && (
                    <div>
                      <span className="text-muted-foreground">Created By:</span>{' '}
                      <span className="font-medium">
                        {typeof quotation.createdBy === 'string'
                          ? quotation.createdBy
                          : quotation.createdBy.name || quotation.createdBy.email}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Last Modified:</span>{' '}
                    <span className="font-medium">{formatDate(quotation.dateModified)}</span>
                  </div>
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
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
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
                <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
              </div>
              {quotation.deliveryAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Amount:</span>
                  <span className="font-medium">{formatCurrency(quotation.deliveryAmount)}</span>
                </div>
              )}
              {quotation.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">-{formatCurrency(quotation.discountAmount)}</span>
                </div>
              )}
              {quotation.taxPercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({quotation.taxPercent}%):</span>
                  <span className="font-medium">{formatCurrency(quotation.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total:</span>
                <span>{formatCurrency(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="bg-muted/30 rounded-lg p-4 text-sm">{quotation.notes}</div>
            </div>
          )}

          {/* Status History */}
          {quotation.statusHistory && quotation.statusHistory.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="size-4" />
                Status History
              </h3>
              <div className="space-y-3">
                {quotation.statusHistory.map((history, index) => (
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
                              getQuotationStatusColor(history.status as QuotationStatus)
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



