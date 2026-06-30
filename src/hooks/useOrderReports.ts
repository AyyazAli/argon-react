import { useQuery } from '@tanstack/react-query'
import { orderReportsApi } from '@/services/orderReports'
import type { OrderReportFilters } from '@/types/orderReports'

const KEYS = {
  summary: (f: OrderReportFilters) => ['order-report-summary', f] as const,
  daily: (f: OrderReportFilters) => ['order-report-daily', f] as const,
  users: (business?: string) => ['order-report-users', business ?? 'all'] as const,
}

export function useOrderActivitySummary(filters: OrderReportFilters = {}, enabled = true) {
  return useQuery({
    queryKey: KEYS.summary(filters),
    queryFn: () => orderReportsApi.getSummary(filters),
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

export function useOrderActivityDaily(filters: OrderReportFilters = {}, enabled = true) {
  return useQuery({
    queryKey: KEYS.daily(filters),
    queryFn: () => orderReportsApi.getDaily(filters),
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

export function useOrderReportUsers(business?: string, enabled = true) {
  return useQuery({
    queryKey: KEYS.users(business),
    queryFn: () => orderReportsApi.getUsers(business),
    enabled,
    staleTime: 1000 * 60 * 30,
  })
}
