import { useState, useMemo } from 'react'
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks'
import { formatDate } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Spinner,
  Badge,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User, UserInput, UserUpdateInput } from '@/services/users'
import { Plus, Search, Pencil, Trash2, Users, X } from 'lucide-react'
import { useAuthStore } from '@/stores'

const businesses = [
  { value: 'penhouse', label: 'Pen House' },
  { value: 'shoplik', label: 'Shoplik' },
  { value: 'customhouse', label: 'Custom House' },
]

const roles = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'superAdmin', label: 'Super Admin' },
  { value: 'bulkOrder', label: 'Bulk Order' },
  { value: 'operationManager', label: 'Operation Manager' },
]

const emptyUser: UserInput = {
  email: '',
  password: '',
  name: '',
  businessAccess: [],
}

export function UsersPage() {
  const { data: users, isLoading } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const { userId } = useAuthStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserInput>(emptyUser)
  const [businessAccessList, setBusinessAccessList] = useState<Array<{ name: string; role: string }>>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('user')

  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return []
    const query = searchQuery.toLowerCase()
    return users.filter((user: User) => {
      return (
        user.email.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query) ||
        user.businessAccess.some((ba: { name: string; role: string }) => ba.name.toLowerCase().includes(query)) ||
        user.businessAccess.some((ba: { name: string; role: string }) => ba.role.toLowerCase().includes(query))
      )
    })
  }, [users, searchQuery])

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email,
        password: '', // Don't populate password
        name: user.name || '',
        businessAccess: user.businessAccess,
      })
      setBusinessAccessList(user.businessAccess || [])
    } else {
      setEditingUser(null)
      setFormData(emptyUser)
      setBusinessAccessList([])
    }
    setSelectedBusiness('')
    setSelectedRole('user')
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    setFormData(emptyUser)
    setBusinessAccessList([])
    setSelectedBusiness('')
    setSelectedRole('user')
  }

  const handleAddBusinessAccess = () => {
    if (selectedBusiness && selectedRole) {
      // Check if this business is already added
      if (!businessAccessList.some(ba => ba.name === selectedBusiness)) {
        setBusinessAccessList([...businessAccessList, { name: selectedBusiness, role: selectedRole }])
        setSelectedBusiness('')
        setSelectedRole('user')
      }
    }
  }

  const handleRemoveBusinessAccess = (index: number) => {
    setBusinessAccessList(businessAccessList.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingUser) {
      // Update user
      const updateData: UserUpdateInput = {
        name: formData.name,
        businessAccess: businessAccessList,
      }
      await updateUser.mutateAsync({ id: editingUser._id, data: updateData })
    } else {
      // Create user
      if (!formData.password) {
        alert('Password is required for new users')
        return
      }
      const createData: UserInput = {
        ...formData,
        businessAccess: businessAccessList,
      }
      await createUser.mutateAsync(createData)
    }

    handleCloseDialog()
  }

  const handleDelete = async () => {
    if (userToDelete) {
      await deleteUser.mutateAsync(userToDelete._id)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage system users and their access</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          New User
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-500/20 p-3">
              <Users className="size-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold">{Array.isArray(users) ? users.length : 0}</p>
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Users ({filteredUsers.length})
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Business Access</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.name || '-'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.businessAccess.length > 0 ? (
                              user.businessAccess.map((ba: { name: string; role: string }, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {ba.name}: {ba.role}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No access</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(new Date().toISOString())}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(user)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            {user._id !== userId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(user)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
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

      {/* Create/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Update user information and business access'
                : 'Fill in the details to create a new user'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="User name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  disabled={!!editingUser}
                />
              </div>
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Business Access</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select business" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses
                          .filter(b => !businessAccessList.some(ba => ba.name === b.value))
                          .map((business) => (
                            <SelectItem key={business.value} value={business.value}>
                              {business.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddBusinessAccess}
                      disabled={!selectedBusiness}
                    >
                      Add
                    </Button>
                  </div>
                  {businessAccessList.length > 0 && (
                    <div className="space-y-2">
                      {businessAccessList.map((ba, index) => {
                        const business = businesses.find(b => b.value === ba.name)
                        const role = roles.find(r => r.value === ba.role)
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-md"
                          >
                            <span className="text-sm">
                              {business?.label || ba.name}: {role?.label || ba.role}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveBusinessAccess(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                {createUser.isPending || updateUser.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {editingUser ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingUser ? 'Update User' : 'Create User'
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
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{userToDelete?.email}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending && <Spinner size="sm" className="mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

