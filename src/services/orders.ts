import api from '@/lib/api'
import type { Order, OrderStats, City, ApiResponse } from '@/types'

export const ordersApi = {
  // Fetch all orders
  fetchOrders: async (): Promise<{ message: string; data: Order[] }> => {
    const response = await api.get<{ message: string; data: Order[] }>(
      '/api/argon/orders'
    )
    return response.data
  },

  // Fetch latest orders from external sources
  fetchLatestOrders: async (): Promise<{ message: string; data: Order[] }> => {
    const response = await api.post<{ message: string; data: Order[] }>(
      '/api/argon/orders/fetch',
      {}
    )
    return response.data
  },

  // Update order status
  updateStatus: async (
    orderId: string,
    status: string
  ): Promise<{ message: string; updated: boolean }> => {
    const response = await api.put<{ message: string; updated: boolean }>(
      `/api/argon/orders/status/${orderId}`,
      { status, id: orderId }
    )
    return response.data
  },

  // Update order
  updateOrder: async (
    order: Order,
    historyDescription: string
  ): Promise<ApiResponse<Order>> => {
    const response = await api.put<ApiResponse<Order>>(
      `/api/argon/orders/update?historyDescription=${historyDescription}`,
      order
    )
    return response.data
  },

  // Update order city
  updateOrderCity: async (
    orderId: string,
    city: City,
    company: string
  ): Promise<ApiResponse<Order>> => {
    const response = await api.put<ApiResponse<Order>>(
      `/api/argon/orders/city/${orderId}`,
      {
        orderId,
        city: city.name,
        cityId: city.id,
        company,
      }
    )
    return response.data
  },

  // Fetch stats
  fetchStats: async (): Promise<{ message: string; data: OrderStats }> => {
    const response = await api.get<{ message: string; data: OrderStats }>(
      '/api/argon/orders/fetch-stats'
    )
    return response.data
  },

  // Trax booking
  bookByTrax: async (ids: string[]): Promise<ApiResponse<Order[]>> => {
    const response = await api.put<ApiResponse<Order[]>>(
      '/api/argon/orders/trax/book',
      ids
    )
    return response.data
  },

  // Get Trax cities
  getTraxCities: async (): Promise<ApiResponse<City[]>> => {
    const response = await api.get<ApiResponse<City[]>>(
      '/api/argon/orders/trax/cities'
    )
    return response.data
  },

  // Trax tracking history
  traxTrackingHistory: async (
    trackingId: string
  ): Promise<ApiResponse<unknown>> => {
    const response = await api.get<ApiResponse<unknown>>(
      `/api/argon/orders/trax/track?trackingid=${trackingId}`
    )
    return response.data
  },

  // Create Trax receiving sheet
  createTraxReceivingSheet: async (
    trackingIds: string[]
  ): Promise<ApiResponse<string>> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/argon/orders/trax/create-receiving-sheet',
      trackingIds
    )
    return response.data
  },

  // View Trax receiving sheet
  viewTraxReceivingSheet: async (
    receivingSheetNo: string
  ): Promise<ApiResponse<unknown>> => {
    const response = await api.get<ApiResponse<unknown>>(
      '/api/argon/orders/trax/view-receiving-sheet',
      { params: { receivingSheetNo } }
    )
    return response.data
  },

  // Leopard booking
  bookByLeopard: async (ids: string[]): Promise<ApiResponse<Order[]>> => {
    const response = await api.put<ApiResponse<Order[]>>(
      '/api/argon/orders/leopard/book',
      ids
    )
    return response.data
  },

  // Get Leopard cities
  getLeopardCities: async (): Promise<ApiResponse<City[]>> => {
    const response = await api.get<ApiResponse<City[]>>(
      '/api/argon/orders/leopard/cities'
    )
    return response.data
  },

  // Leopard tracking history
  leopardTrackingHistory: async (
    trackingNumber: string
  ): Promise<ApiResponse<unknown>> => {
    const response = await api.get<ApiResponse<unknown>>(
      `/api/argon/orders/leopard/track?tracking_number=${trackingNumber}`
    )
    return response.data
  },

  // Lahore booking
  bookByLahore: async (
    ids: string[]
  ): Promise<ApiResponse<{ orders: Order[]; file: string }>> => {
    const response = await api.patch<
      ApiResponse<{ orders: Order[]; file: string }>
    >('/api/argon/orders/lahore/book', ids)
    return response.data
  },

  // Generate print file
  generatePrintfile: async (
    ids: string[]
  ): Promise<ApiResponse<{ orders: Order[]; file: string }>> => {
    const response = await api.patch<
      ApiResponse<{ orders: Order[]; file: string }>
    >('/api/argon/orders/generate-print-file', ids)
    return response.data
  },

  // Generate print file from CSV
  generatePrintfileFromCSV: async (
    file: File
  ): Promise<ApiResponse<{ orders: Order[]; file: string }>> => {
    const formData = new FormData()
    formData.append('csvFile', file)

    const response = await api.post<
      ApiResponse<{ orders: Order[]; file: string }>
    >('/api/argon/orders/generate-print-file-from-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Download file
  downloadFile: async (fileName: string): Promise<Blob> => {
    const response = await api.get('/api/argon/download-file', {
      params: { file: fileName },
      responseType: 'blob',
    })
    return response.data
  },

  // Product operations
  deleteProduct: async (
    orderId: string,
    productId: string
  ): Promise<ApiResponse<{ orderId: string; products: unknown[]; orderLog: unknown[] }>> => {
    const response = await api.delete<
      ApiResponse<{ orderId: string; products: unknown[]; orderLog: unknown[] }>
    >('/api/argon/orders/product', {
      params: { orderId, productId },
    })
    return response.data
  },

  editProduct: async (
    values: object,
    product: unknown
  ): Promise<ApiResponse<{ orderId: string; products: unknown[]; orderLog: unknown[] }>> => {
    const response = await api.put<
      ApiResponse<{ orderId: string; products: unknown[]; orderLog: unknown[] }>
    >('/api/argon/orders/product', { values, product })
    return response.data
  },

  addProduct: async (
    orderId: string,
    product: unknown
  ): Promise<ApiResponse<{ orderId: string; products: unknown[]; orderLog: unknown[] }>> => {
    const response = await api.post<
      ApiResponse<{ orderId: string; products: unknown[]; orderLog: unknown[] }>
    >('/api/argon/orders/product', { values: { orderId }, product })
    return response.data
  },
}




