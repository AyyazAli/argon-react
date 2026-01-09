import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from '@/hooks'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Search, Building2 } from 'lucide-react'
import type { BulkBankAccount, BulkBankAccountInput } from '@/types'

const emptyBankAccount: BulkBankAccountInput = {
  bankName: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
  branch: '',
  swiftCode: '',
  notes: '',
  isActive: true,
}

export function BankAccountsPage() {
  const { data: bankAccounts, isLoading } = useBankAccounts()
  const createBankAccount = useCreateBankAccount()
  const updateBankAccount = useUpdateBankAccount()
  const deleteBankAccount = useDeleteBankAccount()

  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BulkBankAccount | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<BulkBankAccount | null>(null)
  const [formData, setFormData] = useState<BulkBankAccountInput>(emptyBankAccount)

  const filteredAccounts = useMemo(() => {
    if (!bankAccounts || !Array.isArray(bankAccounts)) return []
    const query = searchQuery.toLowerCase()
    return bankAccounts.filter((account) => {
      return (
        account.bankName.toLowerCase().includes(query) ||
        account.accountTitle.toLowerCase().includes(query) ||
        account.accountNumber.toLowerCase().includes(query) ||
        account.iban?.toLowerCase().includes(query) ||
        account.branch?.toLowerCase().includes(query)
      )
    })
  }, [bankAccounts, searchQuery])

  const handleOpenDialog = (account?: BulkBankAccount) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        bankName: account.bankName,
        accountTitle: account.accountTitle,
        accountNumber: account.accountNumber,
        iban: account.iban || '',
        branch: account.branch || '',
        swiftCode: account.swiftCode || '',
        notes: account.notes || '',
        isActive: account.isActive,
      })
    } else {
      setEditingAccount(null)
      setFormData(emptyBankAccount)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAccount(null)
    setFormData(emptyBankAccount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingAccount) {
        await updateBankAccount.mutateAsync({
          id: editingAccount._id,
          data: formData,
        })
      } else {
        await createBankAccount.mutateAsync(formData)
      }
      handleCloseDialog()
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleDeleteClick = (account: BulkBankAccount) => {
    setAccountToDelete(account)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (accountToDelete) {
      try {
        await deleteBankAccount.mutateAsync(accountToDelete._id)
        setIsDeleteDialogOpen(false)
        setAccountToDelete(null)
      } catch (error) {
        // Error is handled by the hook
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Accounts</h1>
          <p className="text-muted-foreground">Manage bank accounts for invoices</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-500/20 p-3">
              <Building2 className="size-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bank Accounts</p>
              <p className="text-3xl font-bold">{Array.isArray(bankAccounts) ? bankAccounts.length : 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search bank accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Bank Accounts ({filteredAccounts.length})
          </CardTitle>
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
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Account Title</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>IBAN</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No bank accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map((account) => (
                      <TableRow key={account._id}>
                        <TableCell className="font-medium">{account.bankName}</TableCell>
                        <TableCell>{account.accountTitle}</TableCell>
                        <TableCell>{account.accountNumber}</TableCell>
                        <TableCell>{account.iban || '-'}</TableCell>
                        <TableCell>{account.branch || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={account.isActive ? 'default' : 'secondary'}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(account)}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(account)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? 'Update the bank account details below.'
                : 'Fill in the details to add a new bank account.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountTitle">Account Title *</Label>
                <Input
                  id="accountTitle"
                  value={formData.accountTitle}
                  onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="swiftCode">SWIFT Code</Label>
                <Input
                  id="swiftCode"
                  value={formData.swiftCode}
                  onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBankAccount.isPending || updateBankAccount.isPending}>
                {createBankAccount.isPending || updateBankAccount.isPending ? (
                  <Spinner size="sm" />
                ) : editingAccount ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bank Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bank account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {accountToDelete && (
            <div className="py-4">
              <p className="font-medium">{accountToDelete.bankName}</p>
              <p className="text-sm text-muted-foreground">
                {accountToDelete.accountTitle} - {accountToDelete.accountNumber}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteBankAccount.isPending}
            >
              {deleteBankAccount.isPending ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

