import api from '@/lib/api'
import type {
  OrderReportFilters,
  SummaryResponse,
  DailyResponse,
  UsersResponse,
} from '@/types/orderReports'

const buildQueryString = (filters: OrderReportFilters): string => {
  const params = new URLSearchParams()
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.business) params.append('business', filters.business)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const orderReportsApi = {
  getSummary: async (filters: OrderReportFilters = {}): Promise<SummaryResponse> => {
    const res = await api.get<SummaryResponse>(
      `/api/argon/orders/reports/summary${buildQueryString(filters)}`
    )
    return res.data
  },

  getDaily: async (filters: OrderReportFilters = {}): Promise<DailyResponse> => {
    const res = await api.get<DailyResponse>(
      `/api/argon/orders/reports/daily${buildQueryString(filters)}`
    )
    return res.data
  },

  getUsers: async (business?: string): Promise<UsersResponse> => {
    const qs = business ? `?business=${encodeURIComponent(business)}` : ''
    const res = await api.get<UsersResponse>(`/api/argon/orders/reports/users${qs}`)
    return res.data
  },
}
