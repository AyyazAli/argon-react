// Bulk Customer Types
export interface BulkCustomer {
  _id: string
  companyName: string
  contactName: string
  email?: string
  phone: string
  address?: string
  city?: string
  ntn?: string
  notes?: string
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  dateCreated: string
  dateModified: string
}

export interface BulkCustomerInput {
  companyName: string
  contactName: string
  email?: string
  phone: string
  address?: string
  city?: string
  ntn?: string
  notes?: string
}

// Quotation Types
export type QuotationStatus = 'pending' | 'sent' | 'invoice_generated' | 'cancelled'

export interface StatusHistory {
  _id?: string
  status: string
  changedBy: {
    _id: string
    name: string
    email: string
  }
  changedAt: string
  notes?: string
}

export interface QuotationItem {
  _id?: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  total: number
}

export interface BulkQuotation {
  _id: string
  quotationNumber: string
  customer: BulkCustomer | string
  status: QuotationStatus
  items: QuotationItem[]
  subtotal: number
  discountAmount: number
  deliveryAmount: number
  taxPercent: number
  taxAmount: number
  grandTotal: number
  validUntil?: string
  notes?: string
  statusHistory?: StatusHistory[]
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  dateCreated: string
  dateModified: string
}

export interface QuotationInput {
  customer: string
  items: Omit<QuotationItem, '_id' | 'total'>[]
  discountAmount?: number
  deliveryAmount?: number
  taxPercent?: number
  validUntil?: string
  notes?: string
}

// Invoice Types
export type InvoiceStatus = 'sent' | 'pending_payment' | 'payment_received' | 'delivered' | 'cancelled'

export interface InvoiceItem {
  _id?: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  total: number
}

export interface BulkInvoice {
  _id: string
  invoiceNumber: string
  quotation: BulkQuotation | string
  customer: BulkCustomer | string
  status: InvoiceStatus
  items: InvoiceItem[]
  subtotal: number
  discountAmount: number
  deliveryAmount: number
  taxPercent: number
  taxAmount: number
  grandTotal: number
  advanceAmount?: number
  paymentTerms?: string
  dueDate?: string
  notes?: string
  bankAccounts?: BulkBankAccount[] | string[]
  statusHistory?: StatusHistory[]
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  dateCreated: string
}

export interface InvoiceInput {
  quotationId: string
  items?: Omit<InvoiceItem, '_id' | 'total'>[]
  discountAmount?: number
  deliveryAmount?: number
  taxPercent?: number
  advanceAmount?: number
  paymentTerms?: string
  dueDate?: string
  notes?: string
  bankAccounts?: string[]
}

// Bank Account Types
export interface BulkBankAccount {
  _id: string
  bankName: string
  accountTitle: string
  accountNumber: string
  iban?: string
  branch?: string
  swiftCode?: string
  notes?: string
  isActive: boolean
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  dateCreated: string
  dateModified: string
}

export interface BulkBankAccountInput {
  bankName: string
  accountTitle: string
  accountNumber: string
  iban?: string
  branch?: string
  swiftCode?: string
  notes?: string
  isActive?: boolean
}


