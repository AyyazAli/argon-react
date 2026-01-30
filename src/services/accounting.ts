import api from '@/lib/api'
import type {
  Account,
  Category,
  Transaction,
  Vendor,
  Liability,
  TransactionFilters,
  ApiResponse,
} from '@/types'

export const accountingApi = {
  // Accounts
  getAccounts: async (): Promise<ApiResponse<Account[]>> => {
    const response = await api.get<ApiResponse<Account[]>>(
      '/api/argon/ledger/account'
    )
    return response.data
  },

  saveAccount: async (data: {
    accountName: string
    balance: number
    desc?: string
  }): Promise<ApiResponse<Account>> => {
    const response = await api.post<ApiResponse<Account>>(
      '/api/argon/ledger/account',
      data
    )
    return response.data
  },

  // Categories
  getCategories: async (type?: string): Promise<ApiResponse<Category[]>> => {
    const response = await api.get<ApiResponse<Category[]>>(
      '/api/argon/ledger/category',
      { params: type ? { type } : {} }
    )
    return response.data
  },

  saveCategory: async (data: {
    categoryName: string
    type: string
    desc?: string
  }): Promise<ApiResponse<Category>> => {
    const response = await api.post<ApiResponse<Category>>(
      '/api/argon/ledger/category',
      data
    )
    return response.data
  },

  // Transactions
  getTransactions: async (
    filters: TransactionFilters
  ): Promise<{
    message: string
    transaction: Transaction[]
    maxTransaction: number
  }> => {
    const response = await api.get<{
      message: string
      transaction: Transaction[]
      maxTransaction: number
    }>('/api/argon/ledger/', { params: filters })
    return response.data
  },

  getTransaction: async (id: string): Promise<ApiResponse<Transaction>> => {
    const response = await api.get<ApiResponse<Transaction>>(
      `/api/argon/ledger/${id}`
    )
    return response.data
  },

  createTransaction: async (data: {
    balance: number
    type: string
    desc?: string
    account: string
    category: string
  }): Promise<ApiResponse<Transaction>> => {
    const response = await api.post<ApiResponse<Transaction>>(
      '/api/argon/ledger/',
      data
    )
    return response.data
  },

  updateTransaction: async (
    id: string,
    data: {
      balance: number
      type: string
      desc?: string
      account: string
      category: string
    }
  ): Promise<ApiResponse<Transaction>> => {
    const response = await api.put<ApiResponse<Transaction>>(
      `/api/argon/ledger/${id}`,
      { id, ...data }
    )
    return response.data
  },

  getAccountTransactions: async (
    account: string,
    limit: number,
    page: number
  ): Promise<{
    message: string
    transaction: Transaction[]
    maxTransaction: number
  }> => {
    const response = await api.get<{
      message: string
      transaction: Transaction[]
      maxTransaction: number
    }>(`/api/argon/ledger/?limit=${limit}&page=${page}&account=${account}`)
    return response.data
  },

  transferAccounts: async (data: {
    fromAccount: string
    toAccount: string
    amount: number
    description?: string
  }): Promise<ApiResponse<unknown>> => {
    const response = await api.patch<ApiResponse<unknown>>(
      '/api/argon/ledger/transfer-accounts',
      data
    )
    return response.data
  },

  // Vendors
  getVendors: async (): Promise<ApiResponse<Vendor[]>> => {
    const response = await api.get<ApiResponse<Vendor[]>>(
      '/api/argon/ledger/vendor'
    )
    return response.data
  },

  createVendor: async (data: {
    name: string
    contact?: string
    email?: string
    address?: string
    balance?: number
  }): Promise<ApiResponse<Vendor>> => {
    const response = await api.post<ApiResponse<Vendor>>(
      '/api/argon/ledger/vendor',
      data
    )
    return response.data
  },

  // Liabilities
  getLiabilities: async (params?: {
    vendor?: string
    status?: string
  }): Promise<{ message: string; data: { liabilities: Liability[]; max: number } }> => {
    const response = await api.get<{ message: string; data: { liabilities: Liability[]; max: number } }>(
      '/api/argon/ledger/liability',
      { params }
    )
    return response.data
  },

  createLiability: async (data: {
    vendor: string
    amount: number
    description?: string
    dueDate?: string
    status?: string
  }): Promise<ApiResponse<Liability>> => {
    const response = await api.post<ApiResponse<Liability>>(
      '/api/argon/ledger/liability',
      data
    )
    return response.data
  },

  // Delete operations (admin/superAdmin only)
  deleteAccount: async (id: string): Promise<ApiResponse<Account>> => {
    const response = await api.delete<ApiResponse<Account>>(
      `/api/argon/ledger/account/${id}`
    )
    return response.data
  },

  deleteCategory: async (id: string): Promise<ApiResponse<Category>> => {
    const response = await api.delete<ApiResponse<Category>>(
      `/api/argon/ledger/category/${id}`
    )
    return response.data
  },

  deleteTransaction: async (id: string): Promise<ApiResponse<Transaction>> => {
    const response = await api.delete<ApiResponse<Transaction>>(
      `/api/argon/ledger/transaction/${id}`
    )
    return response.data
  },

  deleteVendor: async (id: string): Promise<ApiResponse<Vendor>> => {
    const response = await api.delete<ApiResponse<Vendor>>(
      `/api/argon/ledger/vendor/${id}`
    )
    return response.data
  },

  deleteLiability: async (id: string): Promise<ApiResponse<Liability>> => {
    const response = await api.delete<ApiResponse<Liability>>(
      `/api/argon/ledger/liability/${id}`
    )
    return response.data
  },

  // Reports
  getReportSummary: async (params?: {
    from?: string
    to?: string
  }): Promise<ApiResponse<{
    income: { total: number; count: number }
    expense: { total: number; count: number }
    netIncome: number
    totalBalance: number
    totalPayables: number
    accountCount: number
    vendorCount: number
  }>> => {
    const response = await api.get('/api/argon/ledger/reports/summary', { params })
    return response.data
  },

  getReportIncomeExpense: async (params?: {
    from?: string
    to?: string
    groupBy?: 'day' | 'week' | 'month'
  }): Promise<ApiResponse<Array<{
    period: string
    income: number
    expense: number
    net: number
    incomeCount: number
    expenseCount: number
  }>>> => {
    const response = await api.get('/api/argon/ledger/reports/income-expense', { params })
    return response.data
  },

  getReportByCategory: async (params?: {
    from?: string
    to?: string
  }): Promise<ApiResponse<Array<{
    categoryId: string
    categoryName: string
    categoryType: string
    total: number
    count: number
  }>>> => {
    const response = await api.get('/api/argon/ledger/reports/by-category', { params })
    return response.data
  },

  getReportByAccount: async (params?: {
    from?: string
    to?: string
  }): Promise<ApiResponse<Array<{
    accountId: string
    accountName: string
    currentBalance: number
    periodIncome: number
    periodExpense: number
    transactionCount: number
  }>>> => {
    const response = await api.get('/api/argon/ledger/reports/by-account', { params })
    return response.data
  },

  getReportVendorPayables: async (): Promise<ApiResponse<{
    vendors: Array<{
      _id: string
      name: string
      description?: string
      amountOwed: number
    }>
    totalPayables: number
    vendorCount: number
  }>> => {
    const response = await api.get('/api/argon/ledger/reports/vendor-payables')
    return response.data
  },
}




