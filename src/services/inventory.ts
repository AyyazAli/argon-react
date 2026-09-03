import api from '@/lib/api'
import type {
  ApiResponse,
  InventoryProduct,
  ProductCategory,
  Warehouse,
  StockMovement,
  InventorySummary,
  LowStockItem,
  ValuationReport,
  ProductInput,
  ReceiptInput,
  AdjustmentInput,
  MovementQuery,
  ProductQuery,
  LookupResult,
  BatchInput,
  BatchResult,
  OrderStockIssue,
  OrderInventorySummary,
} from '@/types'

const BASE = '/api/argon/inventory'

interface PaginatedResponse<T> extends ApiResponse<T> {
  meta?: { page: number; limit: number; total: number }
}

export const inventoryApi = {
  // ---- Products ----
  getProducts: async (query: ProductQuery = {}): Promise<ApiResponse<InventoryProduct[]>> => {
    const params: Record<string, string> = {}
    if (query.search) params.search = query.search
    if (query.category) params.category = query.category
    if (query.supplier) params.supplier = query.supplier
    if (query.status) params.status = query.status
    if (query.lowStock) params.lowStock = 'true'
    const response = await api.get<ApiResponse<InventoryProduct[]>>(`${BASE}/products`, { params })
    return response.data
  },

  getProduct: async (id: string): Promise<ApiResponse<InventoryProduct>> => {
    const response = await api.get<ApiResponse<InventoryProduct>>(`${BASE}/products/${id}`)
    return response.data
  },

  createProduct: async (data: ProductInput): Promise<ApiResponse<InventoryProduct>> => {
    const response = await api.post<ApiResponse<InventoryProduct>>(`${BASE}/products`, data)
    return response.data
  },

  updateProduct: async (id: string, data: ProductInput): Promise<ApiResponse<InventoryProduct>> => {
    const response = await api.put<ApiResponse<InventoryProduct>>(`${BASE}/products/${id}`, data)
    return response.data
  },

  archiveProduct: async (id: string): Promise<ApiResponse<InventoryProduct>> => {
    const response = await api.delete<ApiResponse<InventoryProduct>>(`${BASE}/products/${id}`)
    return response.data
  },

  /** Resolve a scanned / typed SKU or barcode to a variant. 404 when unknown. */
  lookup: async (code: string): Promise<ApiResponse<LookupResult>> => {
    const response = await api.get<ApiResponse<LookupResult>>(`${BASE}/lookup`, {
      params: { code },
    })
    return response.data
  },

  exportProducts: async (): Promise<Blob> => {
    const response = await api.get(`${BASE}/products/export`, { responseType: 'blob' })
    return response.data as Blob
  },

  importProducts: async (
    file: File
  ): Promise<ApiResponse<{ productsCreated: number; variantsSkipped: number; skipped: Array<{ sku: string; reason: string }> }>> => {
    const formData = new FormData()
    formData.append('csvFile', file)
    const response = await api.post(`${BASE}/products/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // ---- Categories ----
  getCategories: async (): Promise<ApiResponse<ProductCategory[]>> => {
    const response = await api.get<ApiResponse<ProductCategory[]>>(`${BASE}/categories`)
    return response.data
  },

  createCategory: async (data: { name: string; description?: string }): Promise<ApiResponse<ProductCategory>> => {
    const response = await api.post<ApiResponse<ProductCategory>>(`${BASE}/categories`, data)
    return response.data
  },

  updateCategory: async (id: string, data: { name: string; description?: string }): Promise<ApiResponse<ProductCategory>> => {
    const response = await api.put<ApiResponse<ProductCategory>>(`${BASE}/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await api.delete<ApiResponse<unknown>>(`${BASE}/categories/${id}`)
    return response.data
  },

  // ---- Warehouses ----
  getWarehouses: async (): Promise<ApiResponse<Warehouse[]>> => {
    const response = await api.get<ApiResponse<Warehouse[]>>(`${BASE}/warehouses`)
    return response.data
  },

  createWarehouse: async (data: { name: string; code?: string; address?: string; isDefault?: boolean }): Promise<ApiResponse<Warehouse>> => {
    const response = await api.post<ApiResponse<Warehouse>>(`${BASE}/warehouses`, data)
    return response.data
  },

  updateWarehouse: async (id: string, data: { name: string; code?: string; address?: string; isDefault?: boolean }): Promise<ApiResponse<Warehouse>> => {
    const response = await api.put<ApiResponse<Warehouse>>(`${BASE}/warehouses/${id}`, data)
    return response.data
  },

  // ---- Stock movements ----
  receiveStock: async (data: ReceiptInput): Promise<ApiResponse<{ product: InventoryProduct; movement: StockMovement }>> => {
    const response = await api.post(`${BASE}/movements/receipt`, data)
    return response.data
  },

  adjustStock: async (data: AdjustmentInput): Promise<ApiResponse<{ product: InventoryProduct; movement: StockMovement }>> => {
    const response = await api.post(`${BASE}/movements/adjustment`, data)
    return response.data
  },

  /** Commit a whole scan session (receive / deduct / count) at once. */
  commitBatch: async (data: BatchInput): Promise<ApiResponse<BatchResult>> => {
    const response = await api.post<ApiResponse<BatchResult>>(`${BASE}/movements/batch`, data)
    return response.data
  },

  getMovements: async (query: MovementQuery = {}): Promise<PaginatedResponse<StockMovement[]>> => {
    const response = await api.get<PaginatedResponse<StockMovement[]>>(`${BASE}/movements`, {
      params: query,
    })
    return response.data
  },

  // ---- Order-driven deductions needing review ----
  getOrderIssues: async (): Promise<ApiResponse<OrderStockIssue[]>> => {
    const response = await api.get<ApiResponse<OrderStockIssue[]>>(`${BASE}/orders/issues`)
    return response.data
  },

  retryOrderDeduction: async (
    orderId: string
  ): Promise<ApiResponse<{ changed: boolean; inventory: OrderInventorySummary | null }>> => {
    const response = await api.post(`${BASE}/orders/${orderId}/retry`)
    return response.data
  },

  // ---- Reports ----
  getSummary: async (): Promise<ApiResponse<InventorySummary>> => {
    const response = await api.get<ApiResponse<InventorySummary>>(`${BASE}/reports/summary`)
    return response.data
  },

  getLowStock: async (): Promise<ApiResponse<LowStockItem[]>> => {
    const response = await api.get<ApiResponse<LowStockItem[]>>(`${BASE}/reports/low-stock`)
    return response.data
  },

  getValuation: async (): Promise<ApiResponse<ValuationReport>> => {
    const response = await api.get<ApiResponse<ValuationReport>>(`${BASE}/reports/valuation`)
    return response.data
  },

  getRecentMovements: async (limit = 10): Promise<ApiResponse<StockMovement[]>> => {
    const response = await api.get<ApiResponse<StockMovement[]>>(`${BASE}/reports/recent-movements`, {
      params: { limit },
    })
    return response.data
  },
}
