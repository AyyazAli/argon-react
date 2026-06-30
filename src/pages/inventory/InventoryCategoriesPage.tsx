import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Textarea,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useProductCategories,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
} from '@/hooks'
import { formatDate } from '@/lib/utils'
import type { ProductCategory } from '@/types'

export function InventoryCategoriesPage() {
  const { data: categories, isLoading } = useProductCategories()
  const createCategory = useCreateProductCategory()
  const updateCategory = useUpdateProductCategory()
  const deleteCategory = useDeleteProductCategory()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProductCategory | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setOpen(true)
  }
  const openEdit = (category: ProductCategory) => {
    setEditing(category)
    setName(category.name)
    setDescription(category.description ?? '')
    setOpen(true)
  }

  const submit = () => {
    if (!name.trim()) return
    const data = { name: name.trim(), description: description || undefined }
    const onDone = { onSuccess: () => setOpen(false) }
    if (editing) updateCategory.mutate({ id: editing._id, data }, onDone)
    else createCategory.mutate(data, onDone)
  }

  const handleDelete = (category: ProductCategory) => {
    if (window.confirm(`Delete category "${category.name}"?`)) {
      deleteCategory.mutate(category._id)
    }
  }

  const isPending = createCategory.isPending || updateCategory.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">Organize products into categories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!categories || categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        <Tag className="mx-auto mb-2 size-8 opacity-50" />
                        No categories yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category._id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>{formatDate(category.dateCreated)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(category)}>
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apparel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description (optional)</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={isPending || !name.trim()}>
              {isPending ? <Spinner size="sm" /> : editing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
