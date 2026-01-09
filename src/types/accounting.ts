export interface Account {
  _id: string
  accountName: string
  balance: number
  desc?: string
  createdAt: string
}

export interface Category {
  _id: string
  categoryName: string
  type: 'income' | 'expense'
  desc?: string
}

export interface Transaction {
  _id: string
  category: string
  amount: number
  type: 'income' | 'expense'
  description?: string
  account: string
  balance: number
  lastUpdatedBy?: string
  createdAt: string
}

export interface Vendor {
  _id: string
  name: string
  contact?: string
  email?: string
  address?: string
  balance: number
  createdAt: string
}

export interface Liability {
  _id: string
  vendor: string
  amount: number
  description?: string
  dueDate?: string
  status: 'pending' | 'paid' | 'partial'
  createdAt: string
}

export interface TransactionFilters {
  type?: 'income' | 'expense'
  account?: string
  category?: string
  limit?: number
  page?: number
}




