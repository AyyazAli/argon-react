export interface InventoryItem {
  _id: string
  name: string
  quantity: number
  description?: string
  sku?: string
  createdAt: string
}

export interface VendorInventory {
  _id: string
  vendor: string
  items: {
    item: string
    quantity: number
    price: number
  }[]
  createdAt: string
}




