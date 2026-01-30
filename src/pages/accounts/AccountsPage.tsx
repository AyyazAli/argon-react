import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccounts, useCreateAccount, useDeleteAccount } from '@/hooks'
import { useAuthStore } from '@/stores'
import { formatCurrency, formatDate } from '@/lib/utils'
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
  DialogDescription,
} from '@/components/ui/dialog'
import { Plus, Wallet, Trash2 } from 'lucide-react'

const accountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  balance: z.string().transform((val) => Number(val) || 0),
  desc: z.string().optional(),
})

export function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts()
  const createAccount = useCreateAccount()
  const deleteAccount = useDeleteAccount()
  const { role } = useAuthStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)

  const canDelete = role === 'admin' || role === 'superAdmin'

  const handleDeleteClick = (id: string) => {
    setAccountToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (accountToDelete) {
      deleteAccount.mutate(accountToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setAccountToDelete(null)
        },
      })
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: { accountName: '', balance: '0', desc: '' },
  })

  const onSubmit = (data: z.output<typeof accountSchema>) => {
    createAccount.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false)
        reset()
      },
    })
  }

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">Manage your payment accounts</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="size-4" />
          Add Account
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/20 p-3">
              <Wallet className="size-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Accounts ({accounts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Account Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Created</TableHead>
                    {canDelete && <TableHead className="w-[80px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canDelete ? 5 : 4} className="text-center py-12 text-muted-foreground">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts?.map((account) => (
                      <TableRow key={account._id}>
                        <TableCell className="font-medium">{account.accountName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {account.desc || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(account.balance)}
                        </TableCell>
                        <TableCell>{formatDate(account.createdAt)}</TableCell>
                        {canDelete && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(account._id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" {...register('accountName')} placeholder="e.g., Cash, Bank" />
              {errors.accountName && (
                <p className="text-sm text-destructive">{errors.accountName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Initial Balance</Label>
              <Input id="balance" type="number" {...register('balance')} placeholder="0" />
              {errors.balance && (
                <p className="text-sm text-destructive">{errors.balance.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description (Optional)</Label>
              <Input id="desc" {...register('desc')} placeholder="Account description" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAccount.isPending}>
                {createAccount.isPending ? <Spinner size="sm" /> : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

