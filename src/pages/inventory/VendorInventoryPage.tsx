import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useInventoryItems, useVendors, useAddVendorItem, useRemoveVendorItem } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Spinner,
} from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Minus, Warehouse, Package } from 'lucide-react'

const addItemSchema = z.object({
  vendor: z.string().min(1, 'Vendor is required'),
  item: z.string().min(1, 'Item is required'),
  quantity: z.string().transform((val) => Number(val) || 0),
  price: z.string().transform((val) => Number(val) || 0),
})

const removeItemSchema = z.object({
  vendor: z.string().min(1, 'Vendor is required'),
  item: z.string().min(1, 'Item is required'),
  quantity: z.string().transform((val) => Number(val) || 0),
})

export function VendorInventoryPage() {
  const { data: items, isLoading: itemsLoading } = useInventoryItems()
  const { data: vendors, isLoading: vendorsLoading } = useVendors()
  const addVendorItem = useAddVendorItem()
  const removeVendorItem = useRemoveVendorItem()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  const addForm = useForm({
    resolver: zodResolver(addItemSchema),
    defaultValues: { vendor: '', item: '', quantity: '1', price: '0' },
  })

  const removeForm = useForm({
    resolver: zodResolver(removeItemSchema),
    defaultValues: { vendor: '', item: '', quantity: '1' },
  })

  const onAddSubmit = (data: z.output<typeof addItemSchema>) => {
    addVendorItem.mutate(data, {
      onSuccess: () => {
        setIsAddDialogOpen(false)
        addForm.reset()
      },
    })
  }

  const onRemoveSubmit = (data: z.output<typeof removeItemSchema>) => {
    removeVendorItem.mutate(data, {
      onSuccess: () => {
        setIsRemoveDialogOpen(false)
        removeForm.reset()
      },
    })
  }

  const isLoading = itemsLoading || vendorsLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vendor Inventory</h2>
          <p className="text-muted-foreground">Manage vendor stock and inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="size-4" />
            Add Stock
          </Button>
          <Button variant="outline" onClick={() => setIsRemoveDialogOpen(true)}>
            <Minus className="size-4" />
            Remove Stock
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-indigo-500/20 p-3">
                <Warehouse className="size-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                <p className="text-3xl font-bold">{vendors?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-cyan-500/20 p-3">
                <Package className="size-8 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold">{items?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vendors?.map((vendor) => (
                <Card key={vendor._id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Balance: {formatCurrency(vendor.balance)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          addForm.setValue('vendor', vendor.name)
                          setIsAddDialogOpen(true)
                        }}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          removeForm.setValue('vendor', vendor.name)
                          setIsRemoveDialogOpen(true)
                        }}
                      >
                        <Minus className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {vendors?.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No vendors found. Add vendors first.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Stock Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor Stock</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select
                value={addForm.watch('vendor')}
                onValueChange={(v) => addForm.setValue('vendor', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor._id} value={vendor.name}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addForm.formState.errors.vendor && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.vendor.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Item</Label>
              <Select onValueChange={(v) => addForm.setValue('item', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items?.map((item) => (
                    <SelectItem key={item._id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addForm.formState.errors.item && (
                <p className="text-sm text-destructive">
                  {addForm.formState.errors.item.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-quantity">Quantity</Label>
                <Input
                  id="add-quantity"
                  type="number"
                  {...addForm.register('quantity')}
                  placeholder="1"
                />
                {addForm.formState.errors.quantity && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.quantity.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per unit</Label>
                <Input
                  id="price"
                  type="number"
                  {...addForm.register('price')}
                  placeholder="0"
                />
                {addForm.formState.errors.price && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.price.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addVendorItem.isPending}>
                {addVendorItem.isPending ? <Spinner size="sm" /> : 'Add Stock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Stock Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Vendor Stock</DialogTitle>
          </DialogHeader>
          <form onSubmit={removeForm.handleSubmit(onRemoveSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select
                value={removeForm.watch('vendor')}
                onValueChange={(v) => removeForm.setValue('vendor', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor._id} value={vendor.name}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {removeForm.formState.errors.vendor && (
                <p className="text-sm text-destructive">
                  {removeForm.formState.errors.vendor.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Item</Label>
              <Select onValueChange={(v) => removeForm.setValue('item', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items?.map((item) => (
                    <SelectItem key={item._id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {removeForm.formState.errors.item && (
                <p className="text-sm text-destructive">
                  {removeForm.formState.errors.item.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="remove-quantity">Quantity</Label>
              <Input
                id="remove-quantity"
                type="number"
                {...removeForm.register('quantity')}
                placeholder="1"
              />
              {removeForm.formState.errors.quantity && (
                <p className="text-sm text-destructive">
                  {removeForm.formState.errors.quantity.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRemoveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={removeVendorItem.isPending}
              >
                {removeVendorItem.isPending ? <Spinner size="sm" /> : 'Remove Stock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

