import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '@/services'
import { toast } from 'sonner'

export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await inventoryApi.fetchAllItems()
      return response.data
    },
  })
}

export function useAddInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      quantity: number
      description?: string
      sku?: string
    }) => inventoryApi.addItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Item added successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add item')
    },
  })
}

export function useAddVendorItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      vendor: string
      item: string
      quantity: number
      price: number
    }) => inventoryApi.addVendorItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Vendor item added successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add vendor item')
    },
  })
}

export function useRemoveVendorItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { vendor: string; item: string; quantity: number }) =>
      inventoryApi.removeVendorItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Vendor item removed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove vendor item')
    },
  })
}




