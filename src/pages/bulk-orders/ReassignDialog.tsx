import { useState, useEffect, useMemo, useRef } from 'react'
import { useUsers } from '@/hooks'
import { cn } from '@/lib/utils'
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
import { ChevronDown, Check } from 'lucide-react'

interface ReassignDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (userId: string) => Promise<void>
  currentUserId?: string
  title: string
  description: string
}

export function ReassignDialog({
  open,
  onClose,
  onConfirm,
  currentUserId,
  title,
  description,
}: ReassignDialogProps) {
  const { data: users, isLoading } = useUsers()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userDropdownRef = useRef<HTMLDivElement>(null)
  const userSearchInputRef = useRef<HTMLInputElement>(null)

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedUserId(currentUserId || '')
      setUserSearchQuery('')
      setIsUserDropdownOpen(false)
    }
  }, [open, currentUserId])

  // User dropdown click-outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false)
      }
    }

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      setTimeout(() => {
        userSearchInputRef.current?.focus()
      }, 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users) return []
    if (!userSearchQuery) return users

    const query = userSearchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query)
    )
  }, [users, userSearchQuery])

  // Get selected user for display
  const selectedUser = useMemo(() => {
    if (!selectedUserId || !users) return null
    return users.find((u) => u._id === selectedUserId) || null
  }, [selectedUserId, users])

  const handleConfirm = async () => {
    if (!selectedUserId) return

    setIsSubmitting(true)
    try {
      await onConfirm(selectedUserId)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User</label>
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={cn(
                    "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    !selectedUserId && "text-muted-foreground",
                    isUserDropdownOpen && "ring-[3px] ring-ring/50"
                  )}
                >
                  <span className="flex-1 text-left truncate">
                    {selectedUser
                      ? selectedUser.name
                        ? `${selectedUser.name} (${selectedUser.email})`
                        : selectedUser.email
                      : "Select a user"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 opacity-50 transition-transform",
                      isUserDropdownOpen && "rotate-180"
                    )}
                  />
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-hidden">
                    <div className="p-2 border-b">
                      <Input
                        ref={userSearchInputRef}
                        placeholder="Search by email or name..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="h-8"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto max-h-[250px]">
                      {filteredUsers.length === 0 ? (
                        <div className="p-4 text-sm text-center text-muted-foreground">
                          No users found
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => {
                              setSelectedUserId(user._id)
                              setIsUserDropdownOpen(false)
                              setUserSearchQuery('')
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                              selectedUserId === user._id && "bg-accent"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium text-sm truncate">
                                  {user.name || user.email}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {user.email}
                                </span>
                              </div>
                              {selectedUserId === user._id && (
                                <Check className="size-4 text-primary ml-2 shrink-0" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedUserId || isSubmitting}
          >
            {isSubmitting && <Spinner size="sm" className="mr-2" />}
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
