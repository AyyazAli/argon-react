import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate, formatCurrency } from '@/lib/utils'
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
  Badge,
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Order, Product } from '@/types'
import {
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Truck,
  History,
  Pencil,
  X,
  Check,
  Plus,
  Trash2,
} from 'lucide-react'

interface OrderDetailsModalProps {
  order: Order
  open: boolean
  onClose: () => void
}

// Form types
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
  nameToPrint?: string
  nameOnOtherSide?: string
  mobileModel?: string
  size?: string
  color?: string
  refills?: string
  giftWrap?: string
}

// Form schemas
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
  nameToPrint: z.string().optional(),
  nameOnOtherSide: z.string().optional(),
  mobileModel: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  refills: z.string().optional(),
  giftWrap: z.string().optional(),
})

export function OrderDetailsModal({
  order,
  open,
  onClose,
}: OrderDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddingProduct, setIsAddingProduct] = useState(false)

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
      name: '',
      price: 0,
      qty: 1,
      nameToPrint: '',
      nameOnOtherSide: '',
      mobileModel: '',
      size: '',
      color: '',
      refills: '',
      giftWrap: '',
    },
  })

  const handleSaveBilling = (data: BillingFormData) => {
    const historyDescription = `Changed order details: Name from ${order.billing.first_name} ${order.billing.last_name} to ${data.first_name} ${data.last_name}, City from ${order.billing.city} to ${data.city}, Amount from ${order.total} to ${data.total}, Remarks from ${order.remarks || ''} to ${data.remarks || ''}`

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

    updateOrder.mutate(
      { order: updatedOrder, historyDescription },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      }
    )
  }

  const handleAddProduct = (data: ProductFormData) => {
    addProduct.mutate(
      { orderId: order._id, product: data },
      {
        onSuccess: () => {
          setIsAddingProduct(false)
          productForm.reset()
        },
      }
    )
  }

  const handleEditProduct = (data: ProductFormData) => {
    if (!editingProduct?._id) return
    editProduct.mutate(
      { orderId: order._id, productId: editingProduct._id, product: data },
      {
        onSuccess: () => {
          setEditingProduct(null)
          productForm.reset()
        },
      }
    )
  }

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct.mutate({ orderId: order._id, productId })
    }
  }

  const startEditProduct = (product: Product) => {
    setEditingProduct(product)
    productForm.reset({
      name: product.name,
      price: product.price,
      qty: product.qty,
      nameToPrint: product.nameToPrint || '',
      nameOnOtherSide: product.nameOnOtherSide || '',
      mobileModel: product.mobileModel || '',
      size: product.size || '',
      color: product.color || '',
      refills: product.refills || '',
      giftWrap: product.giftWrap || '',
    })
  }

  const cancelProductEdit = () => {
    setEditingProduct(null)
    setIsAddingProduct(false)
    productForm.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="size-5" />
              Order #{order.orderId}
              {order.cn && (
                <Badge variant="outline" className="ml-2">
                  CN: {order.cn}
                </Badge>
              )}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Order Details</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Order Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="flex justify-end">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      billingForm.reset()
                    }}
                  >
                    <X className="size-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => billingForm.handleSubmit((data) => handleSaveBilling(data as BillingFormData))()}
                    disabled={updateOrder.isPending}
                  >
                    {updateOrder.isPending ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <Check className="size-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      {...billingForm.register('first_name')}
                    />
                    {billingForm.formState.errors.first_name && (
                      <p className="text-xs text-destructive">
                        {billingForm.formState.errors.first_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      {...billingForm.register('last_name')}
                    />
                    {billingForm.formState.errors.last_name && (
                      <p className="text-xs text-destructive">
                        {billingForm.formState.errors.last_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...billingForm.register('phone')} />
                    {billingForm.formState.errors.phone && (
                      <p className="text-xs text-destructive">
                        {billingForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...billingForm.register('email')}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...billingForm.register('address')}
                    />
                    {billingForm.formState.errors.address && (
                      <p className="text-xs text-destructive">
                        {billingForm.formState.errors.address.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...billingForm.register('city')} />
                    {billingForm.formState.errors.city && (
                      <p className="text-xs text-destructive">
                        {billingForm.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total">Total Amount</Label>
                    <Input
                      id="total"
                      type="number"
                      {...billingForm.register('total')}
                    />
                    {billingForm.formState.errors.total && (
                      <p className="text-xs text-destructive">
                        {billingForm.formState.errors.total.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      {...billingForm.register('remarks')}
                      rows={3}
                    />
                  </div>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="size-4 text-primary" />
                    Customer Details
                  </h4>
                  <div className="space-y-2 text-sm rounded-lg bg-muted/50 p-3 border border-border/50">
                    <p className="font-medium text-foreground">
                      {order.billing.first_name} {order.billing.last_name}
                    </p>
                    <p className="flex items-center gap-2 text-foreground">
                      <Phone className="size-3 text-muted-foreground" />
                      {order.billing.phone}
                    </p>
                    {order.billing.email && (
                      <p className="flex items-center gap-2 text-foreground">
                        <Mail className="size-3 text-muted-foreground" />
                        {order.billing.email}
                      </p>
                    )}
                    <p className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">Total:</span>
                      <strong className="text-lg text-primary">{formatCurrency(order.total)}</strong>
                    </p>
                    {order.remarks && (
                      <p className="pt-2 border-t border-border/50">
                        <span className="text-muted-foreground block mb-1">Remarks:</span>
                        <span className="text-foreground">{order.remarks}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    Shipping Address
                  </h4>
                  <div className="space-y-2 text-sm rounded-lg bg-muted/50 p-3 border border-border/50">
                    {order.billing.address && (
                      <p className="font-medium text-foreground">{order.billing.address}</p>
                    )}
                    <p className="text-foreground">
                      <span className="font-medium">{order.billing.city}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dispatch Details */}
            {order.dispatchDetails && order.dispatchDetails.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Truck className="size-4 text-primary" />
                    Dispatch Details
                  </h4>
                  <div className="space-y-2">
                    {order.dispatchDetails.map((dispatch, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <p className="font-medium capitalize">
                            {dispatch.company}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tracking: {dispatch.trackingId}
                          </p>
                        </div>
                        <Badge variant="outline">{dispatch.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Order Notes */}
            {order.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              </>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium flex items-center gap-2">
                <Package className="size-4 text-primary" />
                Products ({order.products.length})
              </h4>
              {!isAddingProduct && !editingProduct && (
                <Button size="sm" onClick={() => setIsAddingProduct(true)}>
                  <Plus className="size-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>

            {/* Add/Edit Product Form */}
            {(isAddingProduct || editingProduct) && (
              <div className="rounded-lg border p-4 space-y-4">
                <h5 className="font-medium">
                  {isAddingProduct ? 'Add New Product' : 'Edit Product'}
                </h5>
                <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs">
                      Product Name *
                    </Label>
                    <Input
                      id="name"
                      {...productForm.register('name')}
                      placeholder="Product name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="price" className="text-xs">
                      Price *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      {...productForm.register('price')}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty" className="text-xs">
                      Quantity *
                    </Label>
                    <Input
                      id="qty"
                      type="number"
                      {...productForm.register('qty')}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nameToPrint" className="text-xs">
                      Name to Print
                    </Label>
                    <Input
                      id="nameToPrint"
                      {...productForm.register('nameToPrint')}
                      placeholder="Name to print"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nameOnOtherSide" className="text-xs">
                      Name on Other Side
                    </Label>
                    <Input
                      id="nameOnOtherSide"
                      {...productForm.register('nameOnOtherSide')}
                      placeholder="Other side name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mobileModel" className="text-xs">
                      Model
                    </Label>
                    <Input
                      id="mobileModel"
                      {...productForm.register('mobileModel')}
                      placeholder="Model"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="size" className="text-xs">
                      Size
                    </Label>
                    <Input
                      id="size"
                      {...productForm.register('size')}
                      placeholder="Size"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="color" className="text-xs">
                      Color
                    </Label>
                    <Input
                      id="color"
                      {...productForm.register('color')}
                      placeholder="Color"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="refills" className="text-xs">
                      Refills
                    </Label>
                    <Input
                      id="refills"
                      {...productForm.register('refills')}
                      placeholder="Refills"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="giftWrap" className="text-xs">
                      Gift Wrap
                    </Label>
                    <Input
                      id="giftWrap"
                      {...productForm.register('giftWrap')}
                      placeholder="Gift wrap"
                    />
                  </div>
                </form>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={cancelProductEdit}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => productForm.handleSubmit((data) => 
                      isAddingProduct 
                        ? handleAddProduct(data as ProductFormData) 
                        : handleEditProduct(data as ProductFormData)
                    )()}
                    disabled={addProduct.isPending || editProduct.isPending}
                  >
                    {(addProduct.isPending || editProduct.isPending) && (
                      <Spinner size="sm" className="mr-2" />
                    )}
                    {isAddingProduct ? 'Add Product' : 'Update Product'}
                  </Button>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.products.map((product, index) => (
                    <TableRow key={product._id || index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.nameToPrint && (
                            <p className="text-xs text-muted-foreground">
                              Print: {product.nameToPrint}
                            </p>
                          )}
                          {product.nameOnOtherSide && (
                            <p className="text-xs text-muted-foreground">
                              Other Side: {product.nameOnOtherSide}
                            </p>
                          )}
                          {product.mobileModel && (
                            <p className="text-xs text-muted-foreground">
                              Model: {product.mobileModel}
                            </p>
                          )}
                          {product.size && (
                            <p className="text-xs text-muted-foreground">
                              Size: {product.size}
                            </p>
                          )}
                          {product.color && (
                            <p className="text-xs text-muted-foreground">
                              Color: {product.color}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{product.qty}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.price * product.qty)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => startEditProduct(product)}
                            disabled={isAddingProduct || !!editingProduct}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() =>
                              product._id && handleDeleteProduct(product._id)
                            }
                            disabled={
                              deleteProduct.isPending ||
                              isAddingProduct ||
                              !!editingProduct
                            }
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <History className="size-4 text-primary" />
              Order History
            </h4>

            {order.orderLog && order.orderLog.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {order.orderLog.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between text-sm border-l-2 border-primary/30 pl-3 py-2 bg-muted/30 rounded-r-lg"
                  >
                    <div>
                      <p className="font-medium">{log.action}</p>
                      {log.description && (
                        <p className="text-muted-foreground">{log.description}</p>
                      )}
                      {log.user && (
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {log.user}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatDate(log.date)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No history available
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
