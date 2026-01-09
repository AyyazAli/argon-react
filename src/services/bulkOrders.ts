import api from '@/lib/api'
import type {
  BulkCustomer,
  BulkCustomerInput,
  BulkQuotation,
  QuotationInput,
  QuotationStatus,
  BulkInvoice,
  InvoiceInput,
  InvoiceStatus,
  BulkBankAccount,
  BulkBankAccountInput,
  ApiResponse,
} from '@/types'

// ============= BULK CUSTOMERS =============

export const bulkCustomersApi = {
  // Get all bulk customers
  getCustomers: async (): Promise<ApiResponse<BulkCustomer[]>> => {
    const response = await api.get<ApiResponse<BulkCustomer[]>>(
      '/api/bulk-orders/customers'
    )
    return response.data
  },

  // Get single customer
  getCustomer: async (id: string): Promise<ApiResponse<BulkCustomer>> => {
    const response = await api.get<ApiResponse<BulkCustomer>>(
      `/api/bulk-orders/customers/${id}`
    )
    return response.data
  },

  // Create customer
  createCustomer: async (
    data: BulkCustomerInput
  ): Promise<ApiResponse<BulkCustomer>> => {
    const response = await api.post<ApiResponse<BulkCustomer>>(
      '/api/bulk-orders/customers',
      data
    )
    return response.data
  },

  // Update customer
  updateCustomer: async (
    id: string,
    data: BulkCustomerInput
  ): Promise<ApiResponse<BulkCustomer>> => {
    const response = await api.put<ApiResponse<BulkCustomer>>(
      `/api/bulk-orders/customers/${id}`,
      data
    )
    return response.data
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(
      `/api/bulk-orders/customers/${id}`
    )
    return response.data
  },
}

// ============= QUOTATIONS =============

export const quotationsApi = {
  // Get all quotations
  getQuotations: async (): Promise<ApiResponse<BulkQuotation[]>> => {
    const response = await api.get<ApiResponse<BulkQuotation[]>>(
      '/api/bulk-orders/quotations'
    )
    return response.data
  },

  // Get single quotation
  getQuotation: async (id: string): Promise<ApiResponse<BulkQuotation>> => {
    const response = await api.get<ApiResponse<BulkQuotation>>(
      `/api/bulk-orders/quotations/${id}`
    )
    return response.data
  },

  // Create quotation
  createQuotation: async (
    data: QuotationInput
  ): Promise<ApiResponse<BulkQuotation>> => {
    const response = await api.post<ApiResponse<BulkQuotation>>(
      '/api/bulk-orders/quotations',
      data
    )
    return response.data
  },

  // Update quotation
  updateQuotation: async (
    id: string,
    data: QuotationInput
  ): Promise<ApiResponse<BulkQuotation>> => {
    const response = await api.put<ApiResponse<BulkQuotation>>(
      `/api/bulk-orders/quotations/${id}`,
      data
    )
    return response.data
  },

  // Update quotation status
  updateQuotationStatus: async (
    id: string,
    status: QuotationStatus,
    notes?: string
  ): Promise<ApiResponse<BulkQuotation>> => {
    const response = await api.patch<ApiResponse<BulkQuotation>>(
      `/api/bulk-orders/quotations/${id}/status`,
      { status, notes }
    )
    return response.data
  },

  // Delete quotation
  deleteQuotation: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(
      `/api/bulk-orders/quotations/${id}`
    )
    return response.data
  },
}

// ============= INVOICES =============

export const invoicesApi = {
  // Get all invoices
  getInvoices: async (): Promise<ApiResponse<BulkInvoice[]>> => {
    const response = await api.get<ApiResponse<BulkInvoice[]>>(
      '/api/bulk-orders/invoices'
    )
    return response.data
  },

  // Get single invoice
  getInvoice: async (id: string): Promise<ApiResponse<BulkInvoice>> => {
    const response = await api.get<ApiResponse<BulkInvoice>>(
      `/api/bulk-orders/invoices/${id}`
    )
    return response.data
  },

  // Create invoice from quotation
  createInvoice: async (
    data: InvoiceInput
  ): Promise<ApiResponse<BulkInvoice>> => {
    const { quotationId, ...rest } = data
    const response = await api.post<ApiResponse<BulkInvoice>>(
      '/api/bulk-orders/invoices',
      { quotation: quotationId, ...rest }
    )
    return response.data
  },

  // Update invoice status
  updateInvoiceStatus: async (
    id: string,
    status: InvoiceStatus,
    notes?: string
  ): Promise<ApiResponse<BulkInvoice>> => {
    const response = await api.patch<ApiResponse<BulkInvoice>>(
      `/api/bulk-orders/invoices/${id}/status`,
      { status, notes }
    )
    return response.data
  },
}

// ============= BANK ACCOUNTS =============

export const bankAccountsApi = {
  // Get all bank accounts
  getBankAccounts: async (): Promise<ApiResponse<BulkBankAccount[]>> => {
    const response = await api.get<ApiResponse<BulkBankAccount[]>>(
      '/api/bulk-orders/bank-accounts'
    )
    return response.data
  },

  // Get single bank account
  getBankAccount: async (id: string): Promise<ApiResponse<BulkBankAccount>> => {
    const response = await api.get<ApiResponse<BulkBankAccount>>(
      `/api/bulk-orders/bank-accounts/${id}`
    )
    return response.data
  },

  // Create bank account
  createBankAccount: async (
    data: BulkBankAccountInput
  ): Promise<ApiResponse<BulkBankAccount>> => {
    const response = await api.post<ApiResponse<BulkBankAccount>>(
      '/api/bulk-orders/bank-accounts',
      data
    )
    return response.data
  },

  // Update bank account
  updateBankAccount: async (
    id: string,
    data: BulkBankAccountInput
  ): Promise<ApiResponse<BulkBankAccount>> => {
    const response = await api.put<ApiResponse<BulkBankAccount>>(
      `/api/bulk-orders/bank-accounts/${id}`,
      data
    )
    return response.data
  },

  // Delete bank account
  deleteBankAccount: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(
      `/api/bulk-orders/bank-accounts/${id}`
    )
    return response.data
  },
}


