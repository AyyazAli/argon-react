import { create } from 'zustand'
import type { Order, OrderStats, City } from '@/types'

interface OrderState {
  orders: Order[]
  stats: OrderStats | null
  traxCities: City[]
  leopardCities: City[]
  selectedOrders: Order[]
  isLoading: boolean

  // Actions
  setOrders: (orders: Order[]) => void
  updateOrder: (order: Order) => void
  replaceOrder: (order: Order) => void
  setStats: (stats: OrderStats) => void
  setTraxCities: (cities: City[]) => void
  setLeopardCities: (cities: City[]) => void
  setSelectedOrders: (orders: Order[]) => void
  toggleOrderSelection: (order: Order) => void
  clearSelection: () => void
  setLoading: (loading: boolean) => void
  clearOrders: () => void
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: [],
  stats: null,
  traxCities: [],
  leopardCities: [],
  selectedOrders: [],
  isLoading: false,

  setOrders: (orders) => set({ orders }),

  updateOrder: (updatedOrder) => {
    const { orders } = get()
    const index = orders.findIndex((o) => o._id === updatedOrder._id)
    if (index !== -1) {
      const newOrders = [...orders]
      newOrders[index] = updatedOrder
      set({ orders: newOrders })
    }
  },

  replaceOrder: (order) => {
    const { orders } = get()
    const index = orders.findIndex((o) => o._id === order._id)
    if (index !== -1) {
      const newOrders = [...orders]
      newOrders[index] = {
        ...newOrders[index],
        lastUpdatedBy: order.lastUpdatedBy,
        orderLog: order.orderLog,
        dispatchDetails: order.dispatchDetails,
        status: order.status,
        billing: {
          ...newOrders[index].billing,
          city: order.billing.city,
          cityCompanydetails: order.billing.cityCompanydetails,
        },
      }
      set({ orders: newOrders })
    }
  },

  setStats: (stats) => set({ stats }),

  setTraxCities: (cities) => set({ traxCities: cities }),

  setLeopardCities: (cities) => set({ leopardCities: cities }),

  setSelectedOrders: (orders) => set({ selectedOrders: orders }),

  toggleOrderSelection: (order) => {
    const { selectedOrders } = get()
    const isSelected = selectedOrders.some((o) => o._id === order._id)
    if (isSelected) {
      set({ selectedOrders: selectedOrders.filter((o) => o._id !== order._id) })
    } else {
      set({ selectedOrders: [...selectedOrders, order] })
    }
  },

  clearSelection: () => set({ selectedOrders: [] }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearOrders: () =>
    set({
      orders: [],
      stats: null,
      selectedOrders: [],
    }),
}))




