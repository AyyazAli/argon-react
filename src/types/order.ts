export interface Product {
  _id?: string
  name: string
  price: number
  qty: number
  nameToPrint?: string
  nameOnOtherSide?: string
  giftWrap?: string
  refills?: string
  mobileModel?: string
  size?: string
  color?: string
  printingSide?: string
  language?: string
  picture?: string
  // Inventory link prep (captured from Shopify / WooCommerce when present)
  sku?: string
  externalProductId?: string
  externalVariantId?: string
}

export interface Billing {
  first_name: string
  last_name: string
  address: string
  city: string
  email?: string
  phone: string
  cityCompanydetails?: {
    cityId: number
    company: string
  }
}

export interface DispatchDetail {
  company: string
  trackingId: string
  date?: string
  status?: string
  dispatchDate?: string
  dispatchBy?: string
}

export interface OrderLog {
  action: string
  date?: string
  dateCreated?: string
  user?: string
  updatedBy?: { name: string }
  description?: string
}

export type OrderInventoryStatus = 'none' | 'deducted' | 'partial' | 'unmatched' | 'restored'

export interface OrderInventoryIssue {
  lineIndex: number
  name: string
  sku: string
  qty: number
  remaining: number
  code: 'no_sku' | 'unmatched' | 'short'
  message: string
}

/** Inventory sync state written when an order is dispatched / returned. */
export interface OrderInventory {
  status: OrderInventoryStatus
  deducted?: Array<{ lineIndex: number; name: string; sku: string; qty: number; productId?: string; variantId?: string }>
  issues?: OrderInventoryIssue[]
  sessionId?: string
  deductedAt?: string
  restoredAt?: string
  restoreSessionId?: string
}

/** Compact summary returned by the status-update endpoint. */
export interface OrderInventorySummary {
  status: OrderInventoryStatus
  deductedLines: number
  issues: Array<{ sku: string; name: string; remaining: number; code: string; message: string }>
  sessionId?: string
}

export interface Order {
  _id: string
  orderId: string
  cn?: number
  status: OrderStatus
  billing: Billing
  products: Product[]
  total: number
  dateCreated?: string
  date_created?: string
  dateModified?: string
  date_modified?: string
  source?: string
  notes?: string
  remarks?: string
  lastUpdatedBy?: string
  dispatchDetails?: DispatchDetail[]
  orderLog?: OrderLog[]
  inventory?: OrderInventory
}

export type OrderStatus =
  | 'confirm'
  | 'dispatch'
  | 'return'
  | 'cancel'
  | 'pending'
  | 'delivered'
  | 'call again'
  | 'printing'
  | 'advance pending'
  | 'advance done'
  | 'self collect'

export interface OrderStats {
  total: number
  pending: number
  confirmed: number
  dispatched: number
  delivered: number
  returned: number
  cancelled: number
}

export type CourierCompany = 'trax' | 'leopard' | 'lahore' | 'printfile' | 'postex' | 'manual'

export interface City {
  id: string
  name: string
}

