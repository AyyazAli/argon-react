import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { inventoryApi } from '@/services'
import { toast } from 'sonner'
import type {
  ProductInput,
  ReceiptInput,
  AdjustmentInput,
  MovementQuery,
  ProductQuery,
} from '@/types'

/** Pull the server-provided message out of an axios error, with a fallback. */
function errMsg(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

const ROOT = ['inventory'] as const

// ---- Products ----
export function useProducts(query: ProductQuery = {}) {
  return useQuery({
    queryKey: ['inventory', 'products', query],
    queryFn: async () => (await inventoryApi.getProducts(query)).data,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['inventory', 'product', id],
    queryFn: async () => (await inventoryApi.getProduct(id as string)).data,
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductInput) => inventoryApi.createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROOT })
      toast.success('Product created successfully')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to create product')),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductInput }) =>
      inventoryApi.updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROOT })
      toast.success('Product updated successfully')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to update product')),
  })
}

export function useArchiveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => inventoryApi.archiveProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROOT })
      toast.success('Product archived')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to archive product')),
  })
}

export function useImportProducts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => inventoryApi.importProducts(file),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ROOT })
      const { productsCreated, variantsSkipped } = res.data
      toast.success(`Imported ${productsCreated} product(s), ${variantsSkipped} row(s) skipped`)
    },
    onError: (e) => toast.error(errMsg(e, 'Import failed')),
  })
}

// ---- Categories ----
export function useProductCategories() {
  return useQuery({
    queryKey: ['inventory', 'categories'],
    queryFn: async () => (await inventoryApi.getCategories()).data,
  })
}

export function useCreateProductCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      inventoryApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'categories'] })
      toast.success('Category created')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to create category')),
  })
}

export function useUpdateProductCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string } }) =>
      inventoryApi.updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'categories'] })
      toast.success('Category updated')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to update category')),
  })
}

export function useDeleteProductCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'categories'] })
      toast.success('Category deleted')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to delete category')),
  })
}

// ---- Warehouses ----
export function useWarehouses() {
  return useQuery({
    queryKey: ['inventory', 'warehouses'],
    queryFn: async () => (await inventoryApi.getWarehouses()).data,
  })
}

export function useCreateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; code?: string; address?: string; isDefault?: boolean }) =>
      inventoryApi.createWarehouse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'warehouses'] })
      toast.success('Warehouse created')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to create warehouse')),
  })
}

export function useUpdateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; code?: string; address?: string; isDefault?: boolean } }) =>
      inventoryApi.updateWarehouse(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'warehouses'] })
      toast.success('Warehouse updated')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to update warehouse')),
  })
}

// ---- Stock movements ----
export function useReceiveStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ReceiptInput) => inventoryApi.receiveStock(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROOT })
      toast.success('Stock received')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to receive stock')),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AdjustmentInput) => inventoryApi.adjustStock(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROOT })
      toast.success('Stock adjusted')
    },
    onError: (e) => toast.error(errMsg(e, 'Failed to adjust stock')),
  })
}

export function useMovements(query: MovementQuery = {}) {
  return useQuery({
    queryKey: ['inventory', 'movements', query],
    queryFn: () => inventoryApi.getMovements(query),
  })
}

// ---- Reports ----
export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => (await inventoryApi.getSummary()).data,
  })
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => (await inventoryApi.getLowStock()).data,
  })
}

export function useValuation() {
  return useQuery({
    queryKey: ['inventory', 'valuation'],
    queryFn: async () => (await inventoryApi.getValuation()).data,
  })
}

export function useRecentMovements(limit = 10) {
  return useQuery({
    queryKey: ['inventory', 'recent-movements', limit],
    queryFn: async () => (await inventoryApi.getRecentMovements(limit)).data,
  })
}
