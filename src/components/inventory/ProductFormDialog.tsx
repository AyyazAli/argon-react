import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import {
  Button,
  Input,
  Label,
  Textarea,
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
import { useCreateProduct, useUpdateProduct, useProductCategories } from '@/hooks'
import { useVendors } from '@/hooks/useAccounting'
import type { InventoryProduct, ProductInput } from '@/types'
import { parseAttributes, stringifyAttributes, toNumber, SKU_PATTERN, SKU_HINT } from './inventoryUtils'

const variantSchema = z.object({
  _id: z.string().optional(),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .regex(SKU_PATTERN, `Invalid SKU — ${SKU_HINT}`),
  barcode: z.string().optional(),
  attributes: z.string().optional(),
  costPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  reorderPoint: z.string().optional(),
  openingQuantity: z.string().optional(),
})

const schema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  reorderPoint: z.string().optional(),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
})

type FormValues = z.infer<typeof schema>

const NONE = '__none__'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: InventoryProduct | null
  /** Called with the saved product after a successful create (e.g. to offer labels). */
  onCreated?: (product: InventoryProduct) => void
}

/**
 * Build the form's default values from a product (or a blank product). The
 * dialog is mounted fresh each time it opens (parent keys it), so these are
 * read once on mount — no effect-based syncing needed.
 */
function toDefaults(product?: InventoryProduct | null): FormValues {
  if (!product) {
    return {
      name: '',
      description: '',
      category: '',
      supplier: '',
      reorderPoint: '0',
      variants: [{ sku: '', attributes: '', costPrice: '0', sellingPrice: '', reorderPoint: '', openingQuantity: '0' }],
    }
  }
  return {
    name: product.name,
    description: product.description || '',
    category: product.category?._id || '',
    supplier: product.supplier?._id || '',
    reorderPoint: String(product.reorderPoint ?? 0),
    variants: product.variants.map((v) => ({
      _id: v._id,
      sku: v.sku,
      barcode: v.barcode || '',
      attributes: stringifyAttributes(v.attributes),
      costPrice: String(v.costPrice ?? 0),
      sellingPrice: v.sellingPrice != null ? String(v.sellingPrice) : '',
      reorderPoint: v.reorderPoint != null ? String(v.reorderPoint) : '',
      openingQuantity: '',
    })),
  }
}

export function ProductFormDialog({ open, onOpenChange, product, onCreated }: ProductFormDialogProps) {
  const isEdit = !!product
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const { data: categories } = useProductCategories()
  const { data: vendors } = useVendors()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(product),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })

  const onSubmit = (values: FormValues) => {
    const payload: ProductInput = {
      name: values.name,
      description: values.description || undefined,
      category: values.category || undefined,
      supplier: values.supplier || undefined,
      reorderPoint: toNumber(values.reorderPoint) ?? 0,
      variants: values.variants.map((v) => ({
        _id: v._id,
        sku: v.sku.trim(),
        barcode: v.barcode || undefined,
        attributes: parseAttributes(v.attributes),
        costPrice: toNumber(v.costPrice) ?? 0,
        sellingPrice: toNumber(v.sellingPrice),
        reorderPoint: toNumber(v.reorderPoint),
        openingQuantity: isEdit ? undefined : toNumber(v.openingQuantity),
      })),
    }

    if (isEdit && product) {
      updateProduct.mutate({ id: product._id, data: payload }, { onSuccess: () => onOpenChange(false) })
    } else {
      createProduct.mutate(payload, {
        onSuccess: (res) => {
          onOpenChange(false)
          onCreated?.(res.data)
        },
      })
    }
  }

  const isPending = createProduct.isPending || updateProduct.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g. Cotton T-Shirt" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watch('category') || NONE}
                onValueChange={(v) => setValue('category', v === NONE ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select
                value={watch('supplier') || NONE}
                onValueChange={(v) => setValue('supplier', v === NONE ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {vendors?.map((v) => (
                    <SelectItem key={v._id} value={v._id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Default Reorder Point</Label>
              <Input id="reorderPoint" type="number" {...register('reorderPoint')} placeholder="0" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" {...register('description')} placeholder="Product description" />
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Variants</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ sku: '', attributes: '', costPrice: '0', sellingPrice: '', reorderPoint: '', openingQuantity: '0' })
                }
              >
                <Plus className="size-4" />
                Add Variant
              </Button>
            </div>
            {errors.variants?.message && (
              <p className="text-sm text-destructive">{errors.variants.message}</p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Variant {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input {...register(`variants.${index}.sku`)} placeholder="SKU-001" />
                    {errors.variants?.[index]?.sku && (
                      <p className="text-sm text-destructive">
                        {errors.variants[index]?.sku?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Attributes</Label>
                    <Input
                      {...register(`variants.${index}.attributes`)}
                      placeholder="Size: M, Color: Red"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Barcode (optional)</Label>
                    <Input
                      {...register(`variants.${index}.barcode`)}
                      placeholder="Leave blank to use the SKU (printed labels encode the SKU)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isEdit ? 'Cost Price' : 'Initial Cost Price'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.costPrice`)}
                      placeholder="0"
                      disabled={isEdit && !!field._id}
                    />
                    {isEdit && field._id && (
                      <p className="text-xs text-muted-foreground">
                        Maintained by receipts (moving average)
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.sellingPrice`)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reorder Point</Label>
                    <Input
                      type="number"
                      {...register(`variants.${index}.reorderPoint`)}
                      placeholder="Uses product default"
                    />
                  </div>
                  {!isEdit && (
                    <div className="space-y-2">
                      <Label>Opening Stock</Label>
                      <Input
                        type="number"
                        {...register(`variants.${index}.openingQuantity`)}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner size="sm" /> : isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
