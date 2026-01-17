import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  Button,
  Input,
  Spinner,
  Checkbox,
} from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { BulkQuotation, BulkInvoice, InvoiceInput, BulkCustomer } from '@/types'
import { useBankAccounts } from '@/hooks'
import { Trash2 } from 'lucide-react'

interface InvoiceFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: InvoiceInput | any) => Promise<void>
  quotation?: BulkQuotation | null
  invoice?: BulkInvoice | null
  isSubmitting: boolean
}

interface ItemForm {
  name: string
  description: string
  quantity: number
  unitPrice: number
}

export function InvoiceFormModal({
  open,
  onClose,
  onSubmit,
  quotation,
  invoice,
  isSubmitting,
}: InvoiceFormModalProps) {
  const [items, setItems] = useState<ItemForm[]>([])
  const [discountAmount, setDiscountAmount] = useState(0)
  const [deliveryAmount, setDeliveryAmount] = useState(0)
  const [taxPercent, setTaxPercent] = useState(0)
  const [advanceAmount, setAdvanceAmount] = useState(0)
  const [paymentTerms, setPaymentTerms] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedBankAccounts, setSelectedBankAccounts] = useState<string[]>([])
  
  const { data: bankAccounts } = useBankAccounts()

  useEffect(() => {
    if (quotation) {
      setItems(
        quotation.items.map((item) => ({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      )
      setDiscountAmount(quotation.discountAmount)
      setDeliveryAmount(quotation.deliveryAmount || 0)
      setTaxPercent(quotation.taxPercent)
      setAdvanceAmount(0)
      setPaymentTerms('')
      setDueDate('')
      setNotes(quotation.notes || '')
      setSelectedBankAccounts([])
    } else if (invoice) {
      // Editing existing invoice
      setItems(
        invoice.items.map((item) => ({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      )
      setDiscountAmount(invoice.discountAmount)
      setDeliveryAmount(invoice.deliveryAmount || 0)
      setTaxPercent(invoice.taxPercent)
      setAdvanceAmount(invoice.advanceAmount || 0)
      setPaymentTerms(invoice.paymentTerms || '')
      setDueDate(invoice.dueDate?.split('T')[0] || '')
      setNotes(invoice.notes || '')
      const bankAccountIds = invoice.bankAccounts?.map(acc => 
        typeof acc === 'string' ? acc : acc._id
      ) || []
      setSelectedBankAccounts(bankAccountIds)
    }
  }, [quotation, invoice, open])

  const handleClose = () => {
    onClose()
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof ItemForm, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateItemTotal = (item: ItemForm): number => {
    return item.quantity * item.unitPrice
  }

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const taxableAmount = subtotal + deliveryAmount - discountAmount
  const taxAmount = taxableAmount * (taxPercent / 100)
  const grandTotal = taxableAmount + taxAmount
  const finalAmount = grandTotal - advanceAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quotation && !invoice) return

    const data: any = {
      items: items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      discountAmount,
      deliveryAmount,
      taxPercent,
      advanceAmount,
      paymentTerms: paymentTerms || undefined,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      bankAccounts: selectedBankAccounts,
    }

    if (quotation) {
      data.quotationId = quotation._id
    }

    await onSubmit(data)
    handleClose()
  }

  const toggleBankAccount = (accountId: string) => {
    setSelectedBankAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    )
  }

  const customer = quotation?.customer as BulkCustomer || invoice?.customer as BulkCustomer

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit Invoice' : 'Generate Invoice'}</DialogTitle>
          <DialogDescription>
            {invoice 
              ? `Edit invoice ${invoice.invoiceNumber}. You can adjust items and amounts.`
              : `Create an invoice from quotation ${quotation?.quotationNumber}. You can adjust items before generating the final invoice.`
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Customer Info */}
            {customer && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2">Customer Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Company:</span>{' '}
                    <span className="font-medium">{customer.companyName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact:</span>{' '}
                    <span className="font-medium">{customer.contactName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <span className="font-medium">{customer.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{customer.email || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="space-y-4">
              <Label>Items (You can adjust before {invoice ? 'updating' : 'generating'})</Label>

              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Name</th>
                      <th className="text-left p-3 text-sm font-medium">Description</th>
                      <th className="text-right p-3 text-sm font-medium w-20">Qty</th>
                      <th className="text-right p-3 text-sm font-medium w-28">Unit Price</th>
                      <th className="text-right p-3 text-sm font-medium w-28">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            required
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="text-right"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="text-right"
                            required
                          />
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(calculateItemTotal(item))}
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment and Totals */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g., Net 30, Due on Receipt"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Bank Accounts</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {bankAccounts && bankAccounts.length > 0 ? (
                      bankAccounts
                        .filter((acc) => acc.isActive)
                        .map((account) => (
                          <div key={account._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`bank-${account._id}`}
                              checked={selectedBankAccounts.includes(account._id)}
                              onCheckedChange={() => toggleBankAccount(account._id)}
                            />
                            <label
                              htmlFor={`bank-${account._id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {account.bankName} - {account.accountTitle} ({account.accountNumber})
                            </label>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No bank accounts available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Delivery Amount:</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryAmount}
                    onChange={(e) => setDeliveryAmount(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Discount:</span>
                  <Input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Tax %:</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax Amount:</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-semibold">Grand Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t pt-3">
                  <span className="text-muted-foreground">Advance Amount:</span>
                  <Input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right"
                  />
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-semibold text-primary">Amount to Pay:</span>
                  <span className="font-bold text-lg text-primary">{formatCurrency(finalAmount)}</span>
                </div>
              </div>
            </div>

            {!invoice && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <strong>Note:</strong> Once the invoice is generated, it can only be edited by admin/superAdmin.
                Please review all details before proceeding.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner size="sm" />}
              {invoice ? 'Update Invoice' : 'Generate Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
