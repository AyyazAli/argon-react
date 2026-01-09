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
      return response.data
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




