import type { BulkQuotation, BulkInvoice, QuotationStatus, InvoiceStatus } from './bulkOrders'

// ============= REPORT FILTERS =============

export interface ReportFilters {
  startDate?: string
  endDate?: string
  salesPersonId?: string
  status?: string
}

export interface DatePreset {
  label: string
  value: string
  getRange: () => { startDate: string; endDate: string }
}

// ============= SALES PERSON =============

export interface SalesPerson {
  _id: string
  name: string
  email: string
}

// ============= QUOTATION REPORTS =============

export interface QuotationStatusSummary {
  pending: { count: number; amount: number }
  sent: { count: number; amount: number }
  invoice_generated: { count: number; amount: number }
  cancelled: { count: number; amount: number }
}

export interface SalesPersonQuotationSummary {
  userId: string
  name: string
  email: string
  count: number
  amount: number
}

export interface TimeSeriesData {
  date: string
  count: number
  amount: number
}

export interface QuotationReportSummary {
  totalCount: number
  totalAmount: number
  avgAmount: number
  byStatus: Partial<Record<QuotationStatus, { count: number; amount: number }>>
  bySalesPerson: SalesPersonQuotationSummary[]
}

export interface QuotationReportData {
  summary: QuotationReportSummary
  timeSeries: TimeSeriesData[]
  detailed: BulkQuotation[]
}

// ============= INVOICE REPORTS =============

export interface SalesPersonInvoiceSummary {
  userId: string
  name: string
  email: string
  count: number
  amount: number
  receivedAmount: number
  receivedCount: number
}

export interface InvoiceReportSummary {
  totalCount: number
  totalAmount: number
  avgAmount: number
  totalAdvance: number
  receivedAmount: number
  receivedCount: number
  pendingAmount: number
  pendingCount: number
  byStatus: Partial<Record<InvoiceStatus, { count: number; amount: number }>>
  bySalesPerson: SalesPersonInvoiceSummary[]
}

export interface InvoiceReportData {
  summary: InvoiceReportSummary
  timeSeries: TimeSeriesData[]
  detailed: BulkInvoice[]
}

// ============= SALES PERSON REPORTS =============

export interface SalesPersonQuotationStats {
  count: number
  amount: number
  pending: number
  sent: number
  invoiceGenerated: number
  cancelled: number
}

export interface SalesPersonInvoiceStats {
  count: number
  amount: number
  received: number
  receivedAmount: number
  pending: number
  pendingAmount: number
  delivered: number
  cancelled: number
}

export interface SalesPersonPerformance {
  userId: string
  name: string
  email: string
  quotations: SalesPersonQuotationStats
  invoices: SalesPersonInvoiceStats
  totalAmount: number
  conversionRate: number | string
}

export interface SalesPersonReportTotals {
  quotationCount: number
  quotationAmount: number
  invoiceCount: number
  invoiceAmount: number
  receivedAmount: number
  pendingAmount: number
}

export interface SalesPersonReportData {
  salesPersons: SalesPersonPerformance[]
  totals: SalesPersonReportTotals
}

// ============= SUMMARY REPORTS =============

export interface QuotationSummary {
  total: number
  totalAmount: number
  byStatus: QuotationStatusSummary
}

export interface InvoiceSummary {
  total: number
  totalAmount: number
  receivedAmount: number
  pendingAmount: number
  byStatus: Partial<Record<InvoiceStatus, { count: number; amount: number }>>
}

export interface SummaryReportData {
  quotations: QuotationSummary
  invoices: InvoiceSummary
  salesPersons: SalesPerson[]
}

// ============= API RESPONSES =============

export interface QuotationReportsResponse {
  message: string
  data: QuotationReportData
}

export interface InvoiceReportsResponse {
  message: string
  data: InvoiceReportData
}

export interface SalesPersonReportsResponse {
  message: string
  data: SalesPersonReportData
}

export interface SummaryReportsResponse {
  message: string
  data: SummaryReportData
}

// ============= CHART DATA TYPES =============

export interface PieChartData {
  name: string
  value: number
  color: string
}

export interface BarChartData {
  name: string
  quotations: number
  invoices: number
  received: number
}

export interface LineChartData {
  date: string
  quotations: number
  invoices: number
}
