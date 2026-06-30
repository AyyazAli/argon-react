import { useState } from 'react'
import { Plus, Pencil, Warehouse as WarehouseIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
  Checkbox,
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
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse } from '@/hooks'
import type { Warehouse } from '@/types'

export function WarehousesPage() {
  const { data: warehouses, isLoading } = useWarehouses()
  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setCode('')
    setAddress('')
    setIsDefault(false)
    setOpen(true)
  }
  const openEdit = (warehouse: Warehouse) => {
    setEditing(warehouse)
    setName(warehouse.name)
    setCode(warehouse.code ?? '')
    setAddress(warehouse.address ?? '')
    setIsDefault(warehouse.isDefault)
    setOpen(true)
  }

  const submit = () => {
    if (!name.trim()) return
    const data = {
      name: name.trim(),
      code: code || undefined,
      address: address || undefined,
      isDefault,
    }
    const onDone = { onSuccess: () => setOpen(false) }
    if (editing) updateWarehouse.mutate({ id: editing._id, data }, onDone)
    else createWarehouse.mutate(data, onDone)
  }

  const isPending = createWarehouse.isPending || updateWarehouse.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
          <p className="text-muted-foreground">Stock locations</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Warehouse
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
                    <TableHead>Code</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-center">Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!warehouses || warehouses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                        <WarehouseIcon className="mx-auto mb-2 size-8 opacity-50" />
                        No warehouses yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    warehouses.map((warehouse) => (
                      <TableRow key={warehouse._id}>
                        <TableCell className="font-medium">{warehouse.name}</TableCell>
                        <TableCell className="text-muted-foreground">{warehouse.code || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{warehouse.address || '-'}</TableCell>
                        <TableCell className="text-center">
                          {warehouse.isDefault && <Badge variant="success">Default</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(warehouse)}>
                            <Pencil className="size-4" />
                          </Button>
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
            <DialogTitle>{editing ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wh-name">Name</Label>
              <Input id="wh-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Warehouse" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wh-code">Code (optional)</Label>
                <Input id="wh-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MAIN" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wh-address">Address (optional)</Label>
                <Input id="wh-address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="wh-default"
                checked={isDefault}
                onCheckedChange={(c) => setIsDefault(c === true)}
              />
              <Label htmlFor="wh-default">Set as default warehouse</Label>
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
