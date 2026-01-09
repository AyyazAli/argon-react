import api from '@/lib/api'
import type { InventoryItem, ApiResponse } from '@/types'

export const inventoryApi = {
  // Fetch all items
  fetchAllItems: async (): Promise<ApiResponse<InventoryItem[]>> => {
    const response = await api.get<ApiResponse<InventoryItem[]>>(
      '/api/argon/inventory/'
    )
    return response.data
  },

  // Add item
  addItem: async (data: {
    name: string
    quantity: number
    description?: string
    sku?: string
  }): Promise<ApiResponse<InventoryItem>> => {
    const response = await api.post<ApiResponse<InventoryItem>>(
      '/api/argon/inventory/',
      data
    )
    return response.data
  },

  // Add vendor item
  addVendorItem: async (data: {
    vendor: string
    item: string
    quantity: number
    price: number
  }): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>(
      '/api/argon/inventory/add-vendor-item',
      data
    )
    return response.data
  },

  // Remove vendor item
  removeVendorItem: async (data: {
    vendor: string
    item: string
    quantity: number
  }): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>(
      '/api/argon/inventory/remove-vendor-item',
      data
    )
    return response.data
  },
}




