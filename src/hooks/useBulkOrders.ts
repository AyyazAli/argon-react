import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bulkCustomersApi, quotationsApi, invoicesApi, bankAccountsApi } from '@/services'
import { toast } from 'sonner'
import type {
  BulkCustomerInput,
  QuotationInput,
  QuotationStatus,
  InvoiceInput,
  InvoiceStatus,
  BulkBankAccountInput,
} from '@/types'

// ============= BULK CUSTOMERS HOOKS =============

export function useBulkCustomers() {
  return useQuery({
    queryKey: ['bulkCustomers'],
    queryFn: async () => {
      const response = await bulkCustomersApi.getCustomers()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useBulkCustomer(id: string) {
  return useQuery({
    queryKey: ['bulkCustomer', id],
    queryFn: async () => {
      const response = await bulkCustomersApi.getCustomer(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateBulkCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkCustomerInput) => bulkCustomersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkCustomers'] })
      toast.success('Customer created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create customer')
    },
  })
}

export function useUpdateBulkCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BulkCustomerInput }) =>
      bulkCustomersApi.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkCustomers'] })
      toast.success('Customer updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer')
    },
  })
}

export function useDeleteBulkCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bulkCustomersApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkCustomers'] })
      toast.success('Customer deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer')
    },
  })
}

// ============= QUOTATIONS HOOKS =============

export function useQuotations() {
  return useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const response = await quotationsApi.getQuotations()
      return response.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const response = await quotationsApi.getQuotation(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: QuotationInput) => quotationsApi.createQuotation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Quotation created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create quotation')
    },
  })
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: QuotationInput }) =>
      quotationsApi.updateQuotation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Quotation updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update quotation')
    },
  })
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: QuotationStatus; notes?: string }) =>
      quotationsApi.updateQuotationStatus(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success(`Status updated to ${variables.status.replace('_', ' ')}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status')
    },
  })
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => quotationsApi.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Quotation deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete quotation')
    },
  })
}

// ============= INVOICES HOOKS =============

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await invoicesApi.getInvoices()
      return response.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await invoicesApi.getInvoice(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InvoiceInput) => invoicesApi.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Invoice created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice')
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvoiceInput> }) =>
      invoicesApi.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update invoice')
    },
  })
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: InvoiceStatus; notes?: string }) =>
      invoicesApi.updateInvoiceStatus(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success(`Status updated to ${variables.status.replace('_', ' ')}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status')
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => invoicesApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete invoice')
    },
  })
}

// ============= BANK ACCOUNTS HOOKS =============

export function useBankAccounts() {
  return useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const response = await bankAccountsApi.getBankAccounts()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useBankAccount(id: string) {
  return useQuery({
    queryKey: ['bankAccount', id],
    queryFn: async () => {
      const response = await bankAccountsApi.getBankAccount(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkBankAccountInput) => bankAccountsApi.createBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
      toast.success('Bank account created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create bank account')
    },
  })
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BulkBankAccountInput }) =>
      bankAccountsApi.updateBankAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
      toast.success('Bank account updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update bank account')
    },
  })
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bankAccountsApi.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
      toast.success('Bank account deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete bank account')
    },
  })
}

