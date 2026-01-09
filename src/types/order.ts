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
  date: string
  status: string
}

export interface OrderLog {
  action: string
  date: string
  user: string
  description?: string
}

export interface Order {
  _id: string
  orderId: string
  cn?: number
  status: OrderStatus
  billing: Billing
  products: Product[]
  total: number
  date_created: string
  date_modified?: string
  source?: string
  notes?: string
  remarks?: string
  lastUpdatedBy?: string
  dispatchDetails?: DispatchDetail[]
  orderLog?: OrderLog[]
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

export type CourierCompany = 'trax' | 'leopard' | 'lahore' | 'printfile'

export interface City {
  id: string
  name: string
}

