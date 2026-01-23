import api from '@/lib/api'
import type {
  ReportFilters,
  QuotationReportsResponse,
  InvoiceReportsResponse,
  SalesPersonReportsResponse,
  SummaryReportsResponse,
} from '@/types'

/**
 * Build query string from filters
 */
const buildQueryString = (filters: ReportFilters): string => {
  const params = new URLSearchParams()
  
  if (filters.startDate) {
    params.append('startDate', filters.startDate)
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate)
  }
  if (filters.salesPersonId) {
    params.append('salesPersonId', filters.salesPersonId)
  }
  if (filters.status) {
    params.append('status', filters.status)
  }
  
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

// ============= REPORT API FUNCTIONS =============

export const bulkOrderReportsApi = {
  /**
   * Get quotation reports with aggregated data
   */
  getQuotationReports: async (filters: ReportFilters = {}): Promise<QuotationReportsResponse> => {
    const queryString = buildQueryString(filters)
    const response = await api.get<QuotationReportsResponse>(
      `/api/bulk-orders/reports/quotations${queryString}`
    )
    return response.data
  },

  /**
   * Get invoice reports with aggregated data
   */
  getInvoiceReports: async (filters: ReportFilters = {}): Promise<InvoiceReportsResponse> => {
    const queryString = buildQueryString(filters)
    const response = await api.get<InvoiceReportsResponse>(
      `/api/bulk-orders/reports/invoices${queryString}`
    )
    return response.data
  },

  /**
   * Get sales person performance reports
   */
  getSalesPersonReports: async (filters: ReportFilters = {}): Promise<SalesPersonReportsResponse> => {
    const queryString = buildQueryString(filters)
    const response = await api.get<SalesPersonReportsResponse>(
      `/api/bulk-orders/reports/sales-persons${queryString}`
    )
    return response.data
  },

  /**
   * Get summary reports - overall statistics
   */
  getSummaryReports: async (filters: ReportFilters = {}): Promise<SummaryReportsResponse> => {
    const queryString = buildQueryString(filters)
    const response = await api.get<SummaryReportsResponse>(
      `/api/bulk-orders/reports/summary${queryString}`
    )
    return response.data
  },
}
