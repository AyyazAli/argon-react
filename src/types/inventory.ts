// ---- Inventory management module types ----

export interface VariantAttribute {
  name: string
  value: string
}

export interface StockEntry {
  warehouse: string
  quantity: number
}

export interface Variant {
  _id?: string
  sku: string
  barcode?: string
  attributes: VariantAttribute[]
  costPrice: number
  sellingPrice?: number
  reorderPoint?: number
  stock: StockEntry[]
  status?: 'active' | 'archived'
  // Computed server-side (present on read):
  totalQuantity?: number
  stockValue?: number
  isLowStock?: boolean
}

export interface ProductCategoryRef {
  _id: string
  name: string
}

export interface SupplierRef {
  _id: string
  name: string
}

export interface InventoryProduct {
  _id: string
  name: string
  description?: string
  imageUrl?: string
  status: 'active' | 'archived'
  category?: ProductCategoryRef | null
  supplier?: SupplierRef | null
  reorderPoint: number
  variants: Variant[]
  business: string
  dateCreated: string
  dateModified?: string
  // Computed server-side:
  totalStock?: number
  totalValue?: number
  lowStock?: boolean
}

export interface ProductCategory {
  _id: string
  name: string
  description?: string
  dateCreated: string
}

export interface Warehouse {
  _id: string
  name: string
  code?: string
  address?: string
  isDefault: boolean
  dateCreated: string
}

export type MovementType =
  | 'receipt'
  | 'adjustment'
  | 'opening'
  | 'transfer_in'
  | 'transfer_out'
  | 'correction'

export interface StockMovement {
  _id: string
  product: string
  variantId: string
  variantSku?: string
  productName?: string
  warehouse?: { _id: string; name: string } | string
  type: MovementType
  quantityChange: number
  quantityAfter: number
  unitCost?: number
  note?: string
  reference?: string
  createdBy?: { _id: string; name: string } | string
  dateCreated: string
}

// ---- Report DTOs ----

export interface InventorySummary {
  productCount: number
  skuCount: number
  totalUnits: number
  totalValue: number
  lowStockCount: number
}

export interface LowStockItem {
  productId: string
  productName: string
  category: string | null
  supplier: string | null
  variantId: string
  sku: string
  costPrice: number
  quantity: number
  value: number
  reorderPoint: number
  isLowStock: boolean
}

export interface ValuationReport {
  categories: Array<{ category: string; value: number; units: number }>
  grandTotal: number
}

// ---- Request payloads ----

export interface VariantInput {
  _id?: string
  sku: string
  barcode?: string
  attributes: VariantAttribute[]
  costPrice: number
  sellingPrice?: number
  reorderPoint?: number
  openingQuantity?: number
}

export interface ProductInput {
  name: string
  description?: string
  imageUrl?: string
  category?: string
  supplier?: string
  reorderPoint?: number
  variants: VariantInput[]
}

export interface ReceiptInput {
  productId: string
  variantId: string
  warehouseId?: string
  quantity: number
  unitCost?: number
  note?: string
  reference?: string
}

export interface AdjustmentInput {
  productId: string
  variantId: string
  warehouseId?: string
  mode: 'set' | 'delta'
  quantity: number
  reason: string
}

export interface MovementQuery {
  product?: string
  variantId?: string
  warehouse?: string
  type?: MovementType
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface ProductQuery {
  search?: string
  category?: string
  supplier?: string
  status?: 'active' | 'archived'
  lowStock?: boolean
}
