import { useQuery } from '@tanstack/react-query'
import { bulkOrderReportsApi } from '@/services/bulkOrderReports'
import type { ReportFilters } from '@/types'

// Query keys for caching
const REPORT_QUERY_KEYS = {
  quotations: (filters: ReportFilters) => ['quotation-reports', filters] as const,
  invoices: (filters: ReportFilters) => ['invoice-reports', filters] as const,
  salesPersons: (filters: ReportFilters) => ['sales-person-reports', filters] as const,
  summary: (filters: ReportFilters) => ['summary-reports', filters] as const,
}

/**
 * Hook to fetch quotation reports
 */
export function useQuotationReports(filters: ReportFilters = {}, enabled = true) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.quotations(filters),
    queryFn: () => bulkOrderReportsApi.getQuotationReports(filters),
    enabled,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

/**
 * Hook to fetch invoice reports
 */
export function useInvoiceReports(filters: ReportFilters = {}, enabled = true) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.invoices(filters),
    queryFn: () => bulkOrderReportsApi.getInvoiceReports(filters),
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Hook to fetch sales person performance reports
 */
export function useSalesPersonReports(filters: ReportFilters = {}, enabled = true) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.salesPersons(filters),
    queryFn: () => bulkOrderReportsApi.getSalesPersonReports(filters),
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Hook to fetch summary reports (includes sales persons list for filter dropdown)
 */
export function useSummaryReports(filters: ReportFilters = {}, enabled = true) {
  return useQuery({
    queryKey: REPORT_QUERY_KEYS.summary(filters),
    queryFn: () => bulkOrderReportsApi.getSummaryReports(filters),
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Combined hook to fetch all report data at once
 */
export function useAllReports(filters: ReportFilters = {}, enabled = true) {
  const quotationReports = useQuotationReports(filters, enabled)
  const invoiceReports = useInvoiceReports(filters, enabled)
  const salesPersonReports = useSalesPersonReports(filters, enabled)
  const summaryReports = useSummaryReports(filters, enabled)

  const isLoading = 
    quotationReports.isLoading || 
    invoiceReports.isLoading || 
    salesPersonReports.isLoading || 
    summaryReports.isLoading

  const isError = 
    quotationReports.isError || 
    invoiceReports.isError || 
    salesPersonReports.isError || 
    summaryReports.isError

  const isFetching = 
    quotationReports.isFetching || 
    invoiceReports.isFetching || 
    salesPersonReports.isFetching || 
    summaryReports.isFetching

  const refetchAll = () => {
    quotationReports.refetch()
    invoiceReports.refetch()
    salesPersonReports.refetch()
    summaryReports.refetch()
  }

  return {
    quotationReports,
    invoiceReports,
    salesPersonReports,
    summaryReports,
    isLoading,
    isError,
    isFetching,
    refetchAll,
  }
}
