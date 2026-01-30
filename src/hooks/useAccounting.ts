import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountingApi } from '@/services'
import { toast } from 'sonner'
import type { TransactionFilters } from '@/types'

// Accounts
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountingApi.getAccounts()
      return response.data
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { accountName: string; balance: number; desc?: string }) =>
      accountingApi.saveAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create account')
    },
  })
}

// Categories
export function useCategories(type?: string) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      const response = await accountingApi.getCategories(type)
      return response.data
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { categoryName: string; type: string; desc?: string }) =>
      accountingApi.saveCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category')
    },
  })
}

// Transactions
export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const response = await accountingApi.getTransactions(filters)
      return response
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      balance: number
      type: string
      desc?: string
      account: string
      category: string
    }) => accountingApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transaction created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create transaction')
    },
  })
}

export function useTransferAccounts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      fromAccount: string
      toAccount: string
      amount: number
      description?: string
    }) => accountingApi.transferAccounts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transfer completed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to transfer between accounts')
    },
  })
}

// Vendors
export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await accountingApi.getVendors()
      return response.data
    },
  })
}

export function useCreateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      contact?: string
      email?: string
      address?: string
      balance?: number
    }) => accountingApi.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create vendor')
    },
  })
}

// Liabilities
export function useLiabilities(params?: { vendor?: string; status?: string }) {
  return useQuery({
    queryKey: ['liabilities', params],
    queryFn: async () => {
      const response = await accountingApi.getLiabilities(params)
      return response.data.liabilities
    },
  })
}

export function useCreateLiability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      vendor: string
      amount: number
      description?: string
      dueDate?: string
      status?: string
    }) => accountingApi.createLiability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] })
      toast.success('Liability created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create liability')
    },
  })
}

// Delete operations (admin/superAdmin only)
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => accountingApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account')
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => accountingApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category')
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => accountingApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Transaction deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete transaction')
    },
  })
}

export function useDeleteVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => accountingApi.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vendor')
    },
  })
}

export function useDeleteLiability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => accountingApi.deleteLiability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] })
      toast.success('Liability deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete liability')
    },
  })
}

// Reports
export function useReportSummary(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['report-summary', params],
    queryFn: async () => {
      const response = await accountingApi.getReportSummary(params)
      return response.data
    },
  })
}

export function useReportIncomeExpense(params?: {
  from?: string
  to?: string
  groupBy?: 'day' | 'week' | 'month'
}) {
  return useQuery({
    queryKey: ['report-income-expense', params],
    queryFn: async () => {
      const response = await accountingApi.getReportIncomeExpense(params)
      return response.data
    },
  })
}

export function useReportByCategory(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['report-by-category', params],
    queryFn: async () => {
      const response = await accountingApi.getReportByCategory(params)
      return response.data
    },
  })
}

export function useReportByAccount(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['report-by-account', params],
    queryFn: async () => {
      const response = await accountingApi.getReportByAccount(params)
      return response.data
    },
  })
}

export function useReportVendorPayables() {
  return useQuery({
    queryKey: ['report-vendor-payables'],
    queryFn: async () => {
      const response = await accountingApi.getReportVendorPayables()
      return response.data
    },
  })
}




