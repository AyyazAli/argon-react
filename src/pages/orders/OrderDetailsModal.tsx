import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate, cn as cx } from '@/lib/utils'
import {
  useUpdateOrder,
  useAddProduct,
  useEditProduct,
  useDeleteProduct,
} from '@/hooks'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Label } from '@/components/ui/label'
import { TrackingModal } from './TrackingModal'
import type { Order, Product } from '@/types'
import {
  Pencil,
  X,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'

interface OrderDetailsModalProps {
  order: Order
  open: boolean
  onClose: () => void
}

interface BillingFormData {
  first_name: string
  last_name: string
  phone: string
  email?: string
  address: string
  city: string
  total: number
  remarks?: string
}

interface ProductFormData {
  name: string
  price: number
  qty: number
  size?: string
  nameToPrint?: string
  nameOnOtherSide?: string
  giftWrap?: string
  refills?: string
  color?: string
  mobileModel?: string
  printingSide?: string
  language?: string
  picture?: string
}

const billingSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  total: z.number().min(0, 'Total must be positive'),
  remarks: z.string().optional(),
})

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().min(0, 'Price must be positive'),
  qty: z.number().min(1, 'Quantity must be at least 1'),
  size: z.string().optional(),
  nameToPrint: z.string().optional(),
  nameOnOtherSide: z.string().optional(),
  giftWrap: z.string().optional(),
  refills: z.string().optional(),
  color: z.string().optional(),
  mobileModel: z.string().optional(),
  printingSide: z.string().optional(),
  language: z.string().optional(),
  picture: z.string().optional(),
})

// Canonical product column order + labels (mirrors Angular generateProductColumns)
const PRODUCT_FIELD_ORDER: (keyof Product)[] = [
  'name', 'price', 'qty', 'nameToPrint', 'nameOnOtherSide',
  'giftWrap', 'size', 'color', 'mobileModel', 'printingSide',
  'language', 'picture', 'refills',
]
const PRODUCT_FIELD_LABELS: Record<string, string> = {
  name: 'Name', price: 'Price', qty: 'Quantity',
  nameToPrint: 'Name To Print', nameOnOtherSide: 'Name On Other Side',
  giftWrap: 'Gift Wrap', size: 'Size', color: 'Color',
  mobileModel: 'Model', printingSide: 'Printing Side',
  language: 'Language', picture: 'Picture', refills: 'Refills',
}

// Product edit/add form fields (order + labels from Angular order-modal)
const PRODUCT_FORM_FIELDS: { id: keyof ProductFormData; label: string; type?: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'price', label: 'Price', type: 'number' },
  { id: 'qty', label: 'Quantity', type: 'number' },
  { id: 'size', label: 'Size' },
  { id: 'nameToPrint', label: 'Name to Be Printed' },
  { id: 'nameOnOtherSide', label: 'Name on other side' },
  { id: 'giftWrap', label: 'Gift Wrap Options' },
  { id: 'refills', label: 'Refill Options' },
  { id: 'color', label: 'Color' },
  { id: 'mobileModel', label: 'Model' },
  { id: 'printingSide', label: 'Printing Side' },
  { id: 'language', label: 'Language' },
  { id: 'picture', label: 'Picture' },
]

const getStatusBarColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'return':
    case 'cancel':
      return 'bg-red-500 text-white'
    case 'confirm':
    case 'advance done':
      return 'bg-emerald-500 text-white'
    case 'pending':
      return 'bg-sky-400 text-white'
    case 'printing':
      return 'bg-purple-500 text-white'
    case 'call again':
      return 'bg-yellow-400 text-black'
    case 'dispatch':
      return 'bg-orange-400 text-black'
    case 'advance pending':
      return 'bg-amber-700 text-white'
    case 'delivered':
      return 'bg-teal-500 text-white'
    default:
      return 'bg-slate-400 text-white'
  }
}

export function OrderDetailsModal({ order, open, onClose }: OrderDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [trackingModal, setTrackingModal] = useState<{ trackingId: string; company: string } | null>(null)

  const updateOrder = useUpdateOrder()
  const addProduct = useAddProduct()
  const editProduct = useEditProduct()
  const deleteProduct = useDeleteProduct()

  const billingForm = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      first_name: order.billing.first_name,
      last_name: order.billing.last_name,
      phone: order.billing.phone,
      email: order.billing.email || '',
      address: order.billing.address,
      city: order.billing.city,
      total: order.total,
      remarks: order.remarks || '',
    },
  })

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', price: 0, qty: 1, size: '',
      nameToPrint: '', nameOnOtherSide: '', giftWrap: '', refills: '',
      color: '', mobileModel: '', printingSide: '', language: '', picture: '',
    },
  })

  // Dynamic product columns: include a field if any product has a non-empty value
  const productColumns = PRODUCT_FIELD_ORDER.filter((key) => {
    if (key === 'name' || key === 'price' || key === 'qty') return true
    return order.products.some((p) => {
      const v = p[key]
      return v !== undefined && v !== null && v !== ''
    })
  })

  const handleSaveBilling = (data: BillingFormData) => {
    const historyDescription =
      `Changed the order details ::: Name From: ${order.billing.first_name} ${order.billing.last_name} to ${data.first_name} ${data.last_name}, City From: ${order.billing.city} to ${data.city}, Amount From: ${order.total} to ${data.total}, Remarks From:${order.remarks ?? ''} to ${data.remarks ?? ''}`

    const updatedOrder: Order = {
      ...order,
      billing: {
        ...order.billing,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        city: data.city,
      },
      total: data.total,
      remarks: data.remarks,
    }

    updateOrder.mutate({ order: updatedOrder, historyDescription }, {
      onSuccess: () => setIsEditing(false),
    })
  }

  const handleAddProduct = (data: ProductFormData) => {
    addProduct.mutate({ orderId: order._id, product: data }, {
      onSuccess: () => {
        setIsAddingProduct(false)
        productForm.reset()
      },
    })
  }

  const handleEditProduct = (data: ProductFormData) => {
    if (!editingProduct?._id) return
    editProduct.mutate({ orderId: order._id, productId: editingProduct._id, product: data }, {
      onSuccess: () => {
        setEditingProduct(null)
        productForm.reset()
      },
    })
  }

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct.mutate({ orderId: order._id, productId })
    }
  }

  const startEditProduct = (product: Product) => {
    setIsAddingProduct(false)
    setEditingProduct(product)
    productForm.reset({
      name: product.name, price: product.price, qty: product.qty,
      size: product.size || '', nameToPrint: product.nameToPrint || '',
      nameOnOtherSide: product.nameOnOtherSide || '', giftWrap: product.giftWrap || '',
      refills: product.refills || '', color: product.color || '',
      mobileModel: product.mobileModel || '', printingSide: product.printingSide || '',
      language: product.language || '', picture: product.picture || '',
    })
  }

  const startAddProduct = () => {
    setEditingProduct(null)
    setIsAddingProduct(true)
    productForm.reset({
      name: '', price: 0, qty: 1, size: '',
      nameToPrint: '', nameOnOtherSide: '', giftWrap: '', refills: '',
      color: '', mobileModel: '', printingSide: '', language: '', picture: '',
    })
  }

  const cancelProductEdit = () => {
    setEditingProduct(null)
    setIsAddingProduct(false)
    productForm.reset()
  }

  const lastUpdatedByName =
    typeof order.lastUpdatedBy === 'object' && order.lastUpdatedBy !== null
      ? (order.lastUpdatedBy as { name?: string }).name
      : (order.lastUpdatedBy as string | undefined)

  const showProductForm = isAddingProduct || !!editingProduct

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Cn No: {order.cn ?? '—'}</DialogTitle>
          </DialogHeader>

          {/* ───────── Customer Information ───────── */}
          <section className="rounded-2xl border-2 border-foreground/80 overflow-hidden">
            <div className="relative p-5">
              <div className="absolute right-4 top-4">
                {!isEditing ? (
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="size-4 mr-2" />Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setIsEditing(false); billingForm.reset() }}
                    >
                      <X className="size-4 mr-1" />Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => billingForm.handleSubmit((d) => handleSaveBilling(d as BillingFormData))()}
                      disabled={updateOrder.isPending}
                    >
                      {updateOrder.isPending ? <Spinner size="sm" className="mr-1" /> : <Check className="size-4 mr-1" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <h3 className="text-center text-2xl font-semibold mb-6">Customer Information</h3>

              {!isEditing ? (
                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3 text-sm">
                  <p><strong>First Name: </strong>{order.billing.first_name}</p>
                  <p><strong>Last Name: </strong>{order.billing.last_name}</p>
                  <p className="text-lg"><strong>Amount: </strong>Rs {order.total}</p>

                  <p><strong>Phone No: </strong>{order.billing.phone}</p>
                  <p><strong>Email: </strong>{order.billing.email || '—'}</p>
                  <p><strong>Last Updated By: </strong>{lastUpdatedByName || '—'}</p>

                  <p className="sm:col-span-2"><strong>Address: </strong>{order.billing.address}</p>
                  <p><strong>City: </strong>{order.billing.city}</p>

                  {order.notes && (
                    <p className="sm:col-span-2"><strong>Customer Notes: </strong>{order.notes}</p>
                  )}
                  {order.remarks && (
                    <p className="sm:col-span-3"><strong>Remarks: </strong>{order.remarks}</p>
                  )}
                </div>
              ) : (
                <form className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" {...billingForm.register('first_name')} />
                    {billingForm.formState.errors.first_name && (
                      <p className="text-xs text-destructive">{billingForm.formState.errors.first_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" {...billingForm.register('last_name')} />
                    {billingForm.formState.errors.last_name && (
                      <p className="text-xs text-destructive">{billingForm.formState.errors.last_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="total">Amount</Label>
                    <Input id="total" type="number" {...billingForm.register('total', { valueAsNumber: true })} />
                    {billingForm.formState.errors.total && (
                      <p className="text-xs text-destructive">{billingForm.formState.errors.total.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone No</Label>
                    <Input id="phone" {...billingForm.register('phone')} />
                    {billingForm.formState.errors.phone && (
                      <p className="text-xs text-destructive">{billingForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...billingForm.register('email')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...billingForm.register('city')} />
                    {billingForm.formState.errors.city && (
                      <p className="text-xs text-destructive">{billingForm.formState.errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...billingForm.register('address')} />
                    {billingForm.formState.errors.address && (
                      <p className="text-xs text-destructive">{billingForm.formState.errors.address.message}</p>
                    )}
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Input id="remarks" {...billingForm.register('remarks')} />
                  </div>
                </form>
              )}
            </div>

            {/* Status bar */}
            <div className={cx('py-2 text-center font-semibold capitalize', getStatusBarColor(order.status))}>
              {order.status}
            </div>
          </section>

          {/* ───────── Order Details (Products) ───────── */}
          <section className="space-y-3">
            <h3 className="text-center text-2xl font-semibold">Order Details</h3>

            <Button size="sm" onClick={startAddProduct}>
              <Plus className="size-4 mr-2" />Add
            </Button>

            {/* Products table — dynamic columns */}
            <div className="rounded-lg border">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    {productColumns.map((col) => (
                      <TableHead
                        key={col}
                        className={cx(
                          'whitespace-normal break-words text-xs',
                          col === 'name' ? 'w-[22%]' :
                          col === 'price' || col === 'qty' ? 'w-[7%]' :
                          'w-[12%]'
                        )}
                      >
                        {PRODUCT_FIELD_LABELS[col]}
                      </TableHead>
                    ))}
                    <TableHead className="w-[10%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={productColumns.length + 1} className="text-center py-6 text-muted-foreground">
                        No products
                      </TableCell>
                    </TableRow>
                  ) : (
                    order.products.map((product, index) => (
                      <TableRow key={product._id || index}>
                        {productColumns.map((col) => (
                          <TableCell
                            key={col}
                            className={cx(
                              'whitespace-normal break-words text-sm align-top',
                              col === 'name' ? 'font-medium' : ''
                            )}
                          >
                            {col === 'price'
                              ? product.price
                              : (product[col] as string | number | undefined) ?? ''}
                          </TableCell>
                        ))}
                        <TableCell className="text-right whitespace-nowrap align-top">
                          <button
                            className="text-primary hover:underline disabled:opacity-50"
                            onClick={() => startEditProduct(product)}
                          >
                            Edit
                          </button>
                          <span className="mx-2 text-muted-foreground">|</span>
                          <button
                            className="text-destructive hover:underline disabled:opacity-50"
                            onClick={() => product._id && handleDeleteProduct(product._id)}
                            disabled={deleteProduct.isPending}
                          >
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* ───────── Dispatch Information ───────── */}
          {order.dispatchDetails && order.dispatchDetails.length > 0 && (
            <section className="rounded-2xl border-2 border-dashed border-foreground/70 p-5">
              <h3 className="text-center text-2xl font-semibold mb-4">Dispatch Information</h3>
              {order.dispatchDetails.map((detail, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-2 text-sm mb-4 last:mb-0">
                  <p>
                    <strong>Tracking ID: </strong>
                    <button
                      className="text-primary hover:underline inline-flex items-center gap-1"
                      onClick={() => setTrackingModal({ trackingId: detail.trackingId, company: detail.company })}
                    >
                      {detail.trackingId}
                      <ExternalLink className="size-3" />
                    </button>
                  </p>
                  <p><strong>Dispatch Date: </strong>{(detail.dispatchDate || detail.date) ? formatDate(detail.dispatchDate || detail.date || '') : '—'}</p>
                  <p><strong>Company: </strong><span className="capitalize">{detail.company}</span></p>
                  <p><strong>Dispatched By: </strong>{detail.dispatchBy || '—'}</p>
                </div>
              ))}
            </section>
          )}

          {/* ───────── History ───────── */}
          <section className="space-y-3">
            <h3 className="text-center text-2xl font-semibold">History</h3>
            <div className="rounded-lg border">
              <button
                className="flex w-full items-center justify-between p-4 text-left"
                onClick={() => setHistoryOpen((o) => !o)}
              >
                <span className="font-medium">Change History</span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  Click here to check the change history of this order
                  {historyOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </span>
              </button>

              {historyOpen && (
                <div className="border-t">
                  {order.orderLog && order.orderLog.length > 0 ? (
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60%]">Action</TableHead>
                          <TableHead className="w-[20%]">Name</TableHead>
                          <TableHead className="w-[20%]">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.orderLog.map((log, index) => {
                          const logUser = log.updatedBy?.name || log.user || '—'
                          const logDate = log.dateCreated || log.date
                          return (
                            <TableRow key={index}>
                              <TableCell className="whitespace-normal break-words text-sm align-top">{log.action}{log.description ? ` ${log.description}` : ''}</TableCell>
                              <TableCell className="text-muted-foreground text-sm whitespace-normal break-words align-top">{logUser}</TableCell>
                              <TableCell className="whitespace-nowrap text-sm align-top">{logDate ? formatDate(logDate) : '—'}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">No history available</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onClose}>Okay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Add / Edit dialog */}
      <Dialog open={showProductForm} onOpenChange={(open) => { if (!open) cancelProductEdit() }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddingProduct ? 'Add Product' : 'Edit Product'}</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_FORM_FIELDS.map((field) => (
              <div key={field.id} className="space-y-1">
                <Label htmlFor={`pf-${field.id}`} className="text-xs text-muted-foreground">
                  {field.label}
                </Label>
                <Input
                  id={`pf-${field.id}`}
                  type={field.type || 'text'}
                  placeholder={field.label}
                  {...productForm.register(
                    field.id,
                    field.type === 'number' ? { valueAsNumber: true } : {}
                  )}
                />
              </div>
            ))}
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={cancelProductEdit}>Cancel</Button>
            <Button
              onClick={() => productForm.handleSubmit((d) =>
                isAddingProduct
                  ? handleAddProduct(d as ProductFormData)
                  : handleEditProduct(d as ProductFormData)
              )()}
              disabled={addProduct.isPending || editProduct.isPending}
            >
              {(addProduct.isPending || editProduct.isPending) && <Spinner size="sm" className="mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {trackingModal && (
        <TrackingModal
          trackingId={trackingModal.trackingId}
          company={trackingModal.company}
          open={!!trackingModal}
          onClose={() => setTrackingModal(null)}
        />
      )}
    </>
  )
}
