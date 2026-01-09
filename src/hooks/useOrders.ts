import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/services'
import { useOrderStore } from '@/stores'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import type { Order, CourierCompany } from '@/types'

export function useOrders() {
  const { setOrders, setLoading } = useOrderStore()

  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      setLoading(true)
      const response = await ordersApi.fetchOrders()
      setOrders(response.data)
      setLoading(false)
      return response.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useOrderStats() {
  const { setStats } = useOrderStore()

  return useQuery({
    queryKey: ['orderStats'],
    queryFn: async () => {
      const response = await ordersApi.fetchStats()
      setStats(response.data)
      return response.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useFetchLatestOrders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => ordersApi.fetchLatestOrders(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Latest orders fetched successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to fetch latest orders')
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: (_, variables) => {
      toast.success(`Order status updated to ${variables.status}`)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order status')
    },
  })
}

export function useBookOrders() {
  const { replaceOrder, clearSelection } = useOrderStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      company,
      orderIds,
    }: {
      company: CourierCompany
      orderIds: string[]
    }) => {
      switch (company) {
        case 'trax':
          return ordersApi.bookByTrax(orderIds)
        case 'leopard':
          return ordersApi.bookByLeopard(orderIds)
        case 'lahore':
          return ordersApi.bookByLahore(orderIds)
        case 'printfile':
          return ordersApi.generatePrintfile(orderIds)
        default:
          throw new Error('Invalid company')
      }
    },
    onSuccess: async (data, variables) => {
      const orders = 'orders' in data.data ? data.data.orders : data.data
      
      if (Array.isArray(orders)) {
        orders.forEach((order: Order) => replaceOrder(order))
      }

      // Download file if available (for lahore and printfile)
      if ('file' in data.data && data.data.file) {
        const blob = await ordersApi.downloadFile(data.data.file)
        const fileName = `${variables.company}-${new Date().toISOString().split('T')[0]}.xlsx`
        saveAs(blob, fileName)
      }

      clearSelection()
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success(`Orders booked successfully via ${variables.company}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to book orders')
    },
  })
}

export function useTraxCities() {
  const { setTraxCities } = useOrderStore()

  return useQuery({
    queryKey: ['traxCities'],
    queryFn: async () => {
      const response = await ordersApi.getTraxCities()
      setTraxCities(response.data)
      return response.data
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

export function useLeopardCities() {
  const { setLeopardCities } = useOrderStore()

  return useQuery({
    queryKey: ['leopardCities'],
    queryFn: async () => {
      const response = await ordersApi.getLeopardCities()
      setLeopardCities(response.data)
      return response.data
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useUpdateOrderCity() {
  const { replaceOrder } = useOrderStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      city,
      company,
    }: {
      orderId: string
      city: { id: string; name: string }
      company: string
    }) => ordersApi.updateOrderCity(orderId, city, company),
    onSuccess: (data) => {
      replaceOrder(data.data)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order city updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order city')
    },
  })
}

export function useUpdateOrder() {
  const { replaceOrder } = useOrderStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      order,
      historyDescription,
    }: {
      order: Order
      historyDescription: string
    }) => ordersApi.updateOrder(order, historyDescription),
    onSuccess: (data) => {
      replaceOrder(data.data)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order')
    },
  })
}

export function useAddProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, product }: { orderId: string; product: unknown }) =>
      ordersApi.addProduct(orderId, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Product added successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add product')
    },
  })
}

export function useEditProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      productId,
      product,
    }: {
      orderId: string
      productId: string
      product: unknown
    }) => ordersApi.editProduct({ orderId, productId }, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Product updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product')
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      productId,
    }: {
      orderId: string
      productId: string
    }) => ordersApi.deleteProduct(orderId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Product deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product')
    },
  })
}

