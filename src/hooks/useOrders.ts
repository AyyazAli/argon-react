import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/services'
import { useOrderStore } from '@/stores'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import type { Order, CourierCompany } from '@/types'

/**
 * Surface inventory-sync results at the moment of dispatch: a warning when
 * any order had unmatched SKUs or a stock shortfall, a quiet success otherwise.
 */
type InventoryLike = { status?: string; issues?: Array<unknown> } | null | undefined
function inventoryOf(orders: unknown): InventoryLike[] {
  if (!Array.isArray(orders)) return []
  return orders.map((o) => (o && typeof o === 'object' ? (o as { inventory?: InventoryLike }).inventory : null))
}
function notifyInventory(items: InventoryLike[]) {
  const seen = items.filter((i): i is NonNullable<InventoryLike> => !!i && i.status !== 'none')
  if (seen.length === 0) return
  const withIssues = seen.filter((i) => (i.issues?.length ?? 0) > 0).length
  if (withIssues > 0) {
    toast.warning(
      `Stock deducted, but ${withIssues} order(s) have unmatched SKUs or shortfalls — see Inventory → Order Stock Issues`,
      { duration: 8000 }
    )
  } else if (seen.some((i) => i.status === 'deducted')) {
    toast.success('Inventory deducted for dispatched order(s)')
  } else if (seen.some((i) => i.status === 'restored')) {
    toast.success('Inventory restored')
  }
}

export function useTraxTracking(trackingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['tracking', 'trax', trackingId],
    queryFn: () => ordersApi.traxTrackingHistory(trackingId),
    enabled: enabled && !!trackingId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })
}

export function useLeopardTracking(trackingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['tracking', 'leopard', trackingId],
    queryFn: () => ordersApi.leopardTrackingHistory(trackingId),
    enabled: enabled && !!trackingId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}

export function useBookManual() {
  const { replaceOrder, clearSelection } = useOrderStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderIds, company }: { orderIds: string[]; company: string }) =>
      ordersApi.bookManual(orderIds, company),
    onSuccess: (data) => {
      if (Array.isArray(data.data)) {
        data.data.forEach((order: Order) => replaceOrder(order))
      }
      clearSelection()
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Orders manually booked successfully')
      notifyInventory(inventoryOf(data.data))
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to book orders manually')
    },
  })
}

export function usePostexTracking(trackingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['tracking', 'postex', trackingId],
    queryFn: () => ordersApi.postexTrackingHistory(trackingId),
    enabled: enabled && !!trackingId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}

export function usePostexCities() {
  return useQuery({
    queryKey: ['postexCities'],
    queryFn: async () => {
      const response = await ordersApi.getPostexCities()
      return response.data
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useCreateTraxReceivingSheet() {
  return useMutation({
    mutationFn: (trackingIds: string[]) => ordersApi.createTraxReceivingSheet(trackingIds),
    onSuccess: (data) => {
      toast.success(`Receiving sheet generated. Sheet ID: ${data.data}`)
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create receiving sheet'),
  })
}

export function useGeneratePrintfileFromCSV() {
  const { replaceOrder } = useOrderStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => ordersApi.generatePrintfileFromCSV(file),
    onSuccess: async (data) => {
      if (data.data.orders && data.data.orders.length > 0) {
        data.data.orders.forEach((order: Order) => replaceOrder(order))
      }
      if (data.data.file) {
        const blob = await ordersApi.downloadFile(data.data.file)
        saveAs(blob, `print-file-csv-${new Date().toISOString().split('T')[0]}.xlsx`)
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Print file generated from CSV successfully')
    },
    onError: (error: Error) => toast.error(error.message || 'Error generating print file from CSV'),
  })
}

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
  const { orders, setOrders } = useOrderStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ordersApi.updateStatus(orderId, status),
    onMutate: ({ orderId, status }) => {
      // Optimistic update — reflect the new status in the store immediately
      const updated = orders.map((o) =>
        o._id === orderId ? { ...o, status: status as Order['status'] } : o
      )
      setOrders(updated)
      return { previousOrders: orders }
    },
    onSuccess: (data, variables) => {
      toast.success(`Status updated to ${variables.status}`)
      notifyInventory(data.inventory ? [data.inventory] : [])
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error: Error, _variables, context) => {
      // Revert on failure
      if (context?.previousOrders) setOrders(context.previousOrders)
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
        case 'postex':
          return ordersApi.bookByPostex(orderIds)
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
      notifyInventory(inventoryOf(orders))
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to book orders')
    },
  })
}

export function useTraxCities(enabled = true) {
  const { setTraxCities } = useOrderStore()

  return useQuery({
    queryKey: ['traxCities'],
    queryFn: async () => {
      const response = await ordersApi.getTraxCities()
      const cities = response.data ?? []
      setTraxCities(cities)
      return cities
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

export function useLeopardCities(enabled = true) {
  const { setLeopardCities } = useOrderStore()

  return useQuery({
    queryKey: ['leopardCities'],
    queryFn: async () => {
      const response = await ordersApi.getLeopardCities()
      const cities = response.data ?? []
      setLeopardCities(cities)
      return cities
    },
    enabled,
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

