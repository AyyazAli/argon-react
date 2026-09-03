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
  | 'sale'
  | 'return'
  | 'write_off'
  | 'internal'
  | 'transfer_in'
  | 'transfer_out'
  | 'correction'

export type ReasonCode =
  | 'purchase'
  | 'walk_in'
  | 'order'
  | 'damaged'
  | 'lost'
  | 'expired'
  | 'sample'
  | 'internal'
  | 'gift'
  | 'count'
  | 'manual'
  | 'transfer'
  | 'order_return'

export type ScanMode = 'receive' | 'deduct' | 'count' | 'transfer'

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
  reasonCode?: ReasonCode
  sessionId?: string
  createdBy?: { _id: string; name: string } | string
  dateCreated: string
}

/** Result of resolving a scanned / typed code to a variant. */
export interface LookupResult {
  productId: string
  productName: string
  category?: string
  variantId: string
  sku: string
  barcode?: string
  attributes: VariantAttribute[]
  costPrice: number
  sellingPrice?: number
  reorderPoint?: number
  totalQuantity: number
  isLowStock: boolean
  stock: StockEntry[]
}

// ---- Scan session batch ----

export interface BatchLineInput {
  productId: string
  variantId: string
  /** Units received / deducted; for `count` mode the counted on-hand. */
  quantity: number
  unitCost?: number
}

export interface BatchInput {
  mode: ScanMode
  reasonCode?: ReasonCode
  reference?: string
  note?: string
  warehouseId?: string
  /** Transfer mode only. */
  fromWarehouseId?: string
  toWarehouseId?: string
  lines: BatchLineInput[]
}

export interface BatchLineResult {
  lineIndex: number
  productId: string
  variantId: string
  sku: string
  type: MovementType
  quantityChange: number
  quantityAfter: number
  movementId: string
}

export interface BatchLineError {
  lineIndex: number
  sku?: string
  message: string
}

export interface BatchResult {
  sessionId: string
  mode: ScanMode
  applied: number
  skipped: number
  skippedLines: BatchLineError[]
  results: BatchLineResult[]
}

// ---- Order stock issues ----

export interface OrderStockIssue {
  _id: string
  orderId?: string | number
  cn?: number
  status: string
  customer: string
  dateCreated?: string
  inventory: import('./order').OrderInventory
}

// ---- Labels ----

/** All dimensions in millimetres, on an A4 portrait sheet. */
export interface LabelGrid {
  id: string
  name: string
  columns: number
  rows: number
  labelWidth: number
  labelHeight: number
  marginTop: number
  marginLeft: number
  gapX: number
  gapY: number
}

/** Which machine-readable code(s) to print on a label. */
export type LabelCodeType = 'both' | 'qr' | 'barcode'

export interface LabelItem {
  sku: string
  productName: string
  attributes: string
  qrDataUrl?: string
  barcodeDataUrl?: string
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
  reasonCode?: ReasonCode
  sessionId?: string
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
