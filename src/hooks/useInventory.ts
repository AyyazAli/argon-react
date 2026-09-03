import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useCallback } from 'react'
import { inventoryApi } from '@/services'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores'
import { ACCESS } from '@/lib/roles'
import type {
  ProductInput,
  ReceiptInput,
  AdjustmentInput,
  MovementQuery,
  ProductQuery,
  BatchInput,
  BatchLineError,
  LookupResult,
} from '@/types'

/** Pull the server-provided message out of an axios error, with a fallback. */
function errMsg(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

const ROOT = ['inventory'] as const

/** True when the user may edit the catalogue (products, prices, categories, warehouses). */
export function useIsInventoryAdmin(): boolean {
  return useAuthStore((s) => s.hasRole(...ACCESS.inventoryAdmin))
}

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

/** Error thrown by useCommitBatch when the server rejects the batch (400). */
export class BatchValidationError extends Error {
  errors: BatchLineError[]
  constructor(message: string, errors: BatchLineError[]) {
    super(message)
    this.name = 'BatchValidationError'
    this.errors = errors
  }
}

/**
 * Commit a scan session. A 400 with per-line `errors[]` is rethrown as a
 * BatchValidationError so the page can mark the offending lines; other
 * failures are toasted like every other mutation.
 */
export function useCommitBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BatchInput) => {
      try {
        return (await inventoryApi.commitBatch(data)).data
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 400 && Array.isArray(e.response.data?.errors)) {
          throw new BatchValidationError(e.response.data.message || 'Batch validation failed', e.response.data.errors)
        }
        throw e
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ROOT })
      toast.success(
        res.applied > 0
          ? `Committed ${res.applied} line(s)${res.skipped ? `, ${res.skipped} unchanged` : ''}`
          : 'Nothing to apply — no changes'
      )
    },
    onError: (e) => {
      if (e instanceof BatchValidationError) {
        toast.error(`${e.errors.length} line(s) need attention`)
      } else {
        toast.error(errMsg(e, 'Failed to commit'))
      }
    },
  })
}

/**
 * Imperative code lookup for the scanner. Cached per code for a minute so
 * re-scanning the same label doesn't hit the server again.
 */
export function useLookupCode() {
  const qc = useQueryClient()
  return useCallback(
    (code: string): Promise<LookupResult> =>
      qc.fetchQuery({
        queryKey: ['inventory', 'lookup', code.trim().toLowerCase()],
        queryFn: async () => (await inventoryApi.lookup(code.trim())).data,
        staleTime: 60_000,
      }),
    [qc]
  )
}

export function useMovements(query: MovementQuery = {}) {
  return useQuery({
    queryKey: ['inventory', 'movements', query],
    queryFn: () => inventoryApi.getMovements(query),
  })
}

// ---- Order stock issues ----
export function useOrderStockIssues() {
  return useQuery({
    queryKey: ['inventory', 'order-issues'],
    queryFn: async () => (await inventoryApi.getOrderIssues()).data,
  })
}

export function useRetryOrderDeduction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => inventoryApi.retryOrderDeduction(orderId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ROOT })
      qc.invalidateQueries({ queryKey: ['orders'] })
      const remaining = res.data.inventory?.issues.length ?? 0
      if (!res.data.changed) toast.info(res.message)
      else if (remaining === 0) toast.success('All lines deducted')
      else toast.warning(`${remaining} line(s) still need attention`)
    },
    onError: (e) => toast.error(errMsg(e, 'Retry failed')),
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
