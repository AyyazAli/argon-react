import { useState, useEffect } from 'react'
import { useBulkCustomers } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import {
  Button,
  Input,
  Spinner,
} from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { BulkQuotation, QuotationInput } from '@/types'
import { Plus, Trash2 } from 'lucide-react'

interface QuotationFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: QuotationInput) => Promise<void>
  editingQuotation?: BulkQuotation | null
  isSubmitting: boolean
}

interface ItemForm {
  name: string
  description: string
  quantity: number
  unitPrice: number
  discountPercent: number
}

const emptyItem: ItemForm = {
  name: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
}

export function QuotationFormModal({
  open,
  onClose,
  onSubmit,
  editingQuotation,
  isSubmitting,
}: QuotationFormModalProps) {
  const { data: customers } = useBulkCustomers()
  
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }])
  const [discountAmount, setDiscountAmount] = useState(0)
  const [deliveryAmount, setDeliveryAmount] = useState(0)
  const [taxPercent, setTaxPercent] = useState(0)
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setCustomerId('')
    setItems([{ ...emptyItem }])
    setDiscountAmount(0)
    setDeliveryAmount(0)
    setTaxPercent(0)
    setValidUntil('')
    setNotes('')
  }

  useEffect(() => {
    if (editingQuotation) {
      const customer = typeof editingQuotation.customer === 'string' 
        ? editingQuotation.customer 
        : editingQuotation.customer._id
      setCustomerId(customer)
      setItems(editingQuotation.items.map(item => ({
        name: item.name,
        description: item.description || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      })))
      setDiscountAmount(editingQuotation.discountAmount)
      setDeliveryAmount(editingQuotation.deliveryAmount || 0)
      setTaxPercent(editingQuotation.taxPercent)
      setValidUntil(editingQuotation.validUntil?.split('T')[0] || '')
      setNotes(editingQuotation.notes || '')
    } else {
      resetForm()
    }
  }, [editingQuotation, open])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const addItem = () => {
    setItems([...items, { ...emptyItem }])
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
    return item.quantity * item.unitPrice * (1 - item.discountPercent / 100)
  }

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const taxableAmount = subtotal + deliveryAmount - discountAmount
  const taxAmount = taxableAmount * (taxPercent / 100)
  const grandTotal = taxableAmount + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const data: QuotationInput = {
      customer: customerId,
      items: items.map(item => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      })),
      discountAmount,
      deliveryAmount,
      taxPercent,
      validUntil: validUntil || undefined,
      notes: notes || undefined,
    }

    await onSubmit(data)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!w-[70vw] !max-w-[70vw] sm:!max-w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
          </DialogTitle>
          <DialogDescription>
            {editingQuotation
              ? 'Update the quotation details below.'
              : 'Fill in the details to create a new quotation.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Customer Selection */}
            <div className="grid gap-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.companyName} - {customer.contactName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="size-4" />
                  Add Item
                </Button>
              </div>
              
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">Name</th>
                      <th className="text-left p-4 text-sm font-medium">Description</th>
                      <th className="text-right p-4 text-sm font-medium w-24">Qty</th>
                      <th className="text-right p-4 text-sm font-medium w-32">Unit Price</th>
                      <th className="text-right p-4 text-sm font-medium w-24">Disc %</th>
                      <th className="text-right p-4 text-sm font-medium w-32">Total</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t hover:bg-muted/20">
                        <td className="p-3">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            placeholder="Item name"
                            required
                            className="min-w-[150px]"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Description"
                            className="min-w-[150px]"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="text-right"
                            required
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="text-right"
                            required
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) => updateItem(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(calculateItemTotal(item))}
                        </td>
                        <td className="p-3">
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

            {/* Totals and Additional Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
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
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !customerId}>
              {isSubmitting && <Spinner size="sm" />}
              {editingQuotation ? 'Update Quotation' : 'Create Quotation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

