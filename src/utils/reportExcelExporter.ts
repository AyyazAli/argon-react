import { saveAs } from 'file-saver'
import type {
  QuotationReportData,
  InvoiceReportData,
  SalesPersonPerformance,
  ReportFilters,
  BulkQuotation,
  BulkInvoice,
  BulkCustomer,
} from '@/types'

// ============= HELPER FUNCTIONS =============

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  sent: 'Sent',
  invoice_generated: 'Invoice Generated',
  cancelled: 'Cancelled',
  pending_payment: 'Pending Payment',
  payment_received: 'Payment Received',
  delivered: 'Delivered',
}

// Escape CSV special characters
const escapeCSV = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ============= CSV GENERATION =============

const generateSummaryCSV = (
  quotationData?: QuotationReportData,
  invoiceData?: InvoiceReportData,
  filters?: ReportFilters
): string => {
  const rows: string[] = []

  // Header
  rows.push('BULK ORDERS REPORT - SUMMARY')
  rows.push('')
  
  // Date Range
  if (filters?.startDate && filters?.endDate) {
    rows.push(`Date Range,${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`)
  }
  rows.push(`Generated On,${new Date().toLocaleString()}`)
  rows.push('')

  // Quotation Summary
  rows.push('QUOTATION SUMMARY')
  rows.push('Metric,Value')
  rows.push(`Total Quotations,${quotationData?.summary?.totalCount || 0}`)
  rows.push(`Total Amount,${formatCurrency(quotationData?.summary?.totalAmount || 0)}`)
  rows.push(`Average Amount,${formatCurrency(quotationData?.summary?.avgAmount || 0)}`)
  rows.push('')

  // Quotation Status Breakdown
  rows.push('QUOTATION STATUS BREAKDOWN')
  rows.push('Status,Count,Amount')
  Object.entries(quotationData?.summary?.byStatus || {}).forEach(([status, data]) => {
    rows.push(`${STATUS_LABELS[status] || status},${data?.count || 0},${formatCurrency(data?.amount || 0)}`)
  })
  rows.push('')

  // Invoice Summary
  rows.push('INVOICE SUMMARY')
  rows.push('Metric,Value')
  rows.push(`Total Invoices,${invoiceData?.summary?.totalCount || 0}`)
  rows.push(`Total Amount,${formatCurrency(invoiceData?.summary?.totalAmount || 0)}`)
  rows.push(`Average Amount,${formatCurrency(invoiceData?.summary?.avgAmount || 0)}`)
  rows.push(`Payment Received,${formatCurrency(invoiceData?.summary?.receivedAmount || 0)}`)
  rows.push(`Pending Payment,${formatCurrency(invoiceData?.summary?.pendingAmount || 0)}`)
  rows.push('')

  // Invoice Status Breakdown
  rows.push('INVOICE STATUS BREAKDOWN')
  rows.push('Status,Count,Amount')
  Object.entries(invoiceData?.summary?.byStatus || {}).forEach(([status, data]) => {
    rows.push(`${STATUS_LABELS[status] || status},${data?.count || 0},${formatCurrency(data?.amount || 0)}`)
  })

  return rows.join('\n')
}

const generateQuotationsCSV = (quotations?: BulkQuotation[]): string => {
  const rows: string[] = []

  // Header
  rows.push('QUOTATIONS DETAIL')
  rows.push('')
  rows.push('Quotation Number,Customer,Contact,Sales Person,Status,Subtotal,Discount,Tax,Grand Total,Date Created,Valid Until,Notes')

  // Data rows
  quotations?.forEach((q) => {
    const customer = typeof q.customer === 'object' ? (q.customer as BulkCustomer) : null
    const createdBy = q.createdBy && typeof q.createdBy === 'object' ? q.createdBy : null

    rows.push([
      escapeCSV(q.quotationNumber),
      escapeCSV(customer?.companyName),
      escapeCSV(customer?.contactName),
      escapeCSV(createdBy?.name || createdBy?.email),
      escapeCSV(STATUS_LABELS[q.status] || q.status),
      formatCurrency(q.subtotal),
      formatCurrency(q.discountAmount),
      formatCurrency(q.taxAmount),
      formatCurrency(q.grandTotal),
      formatDate(q.dateCreated),
      q.validUntil ? formatDate(q.validUntil) : '',
      escapeCSV(q.notes),
    ].join(','))
  })

  return rows.join('\n')
}

const generateInvoicesCSV = (invoices?: BulkInvoice[]): string => {
  const rows: string[] = []

  // Header
  rows.push('INVOICES DETAIL')
  rows.push('')
  rows.push('Invoice Number,Customer,Contact,Sales Person,Status,Subtotal,Discount,Tax,Grand Total,Advance Amount,Due Date,Date Created,Notes')

  // Data rows
  invoices?.forEach((inv) => {
    const customer = typeof inv.customer === 'object' ? (inv.customer as BulkCustomer) : null
    const createdBy = inv.createdBy && typeof inv.createdBy === 'object' ? inv.createdBy : null

    rows.push([
      escapeCSV(inv.invoiceNumber),
      escapeCSV(customer?.companyName),
      escapeCSV(customer?.contactName),
      escapeCSV(createdBy?.name || createdBy?.email),
      escapeCSV(STATUS_LABELS[inv.status] || inv.status),
      formatCurrency(inv.subtotal),
      formatCurrency(inv.discountAmount),
      formatCurrency(inv.taxAmount),
      formatCurrency(inv.grandTotal),
      formatCurrency(inv.advanceAmount || 0),
      inv.dueDate ? formatDate(inv.dueDate) : '',
      formatDate(inv.dateCreated),
      escapeCSV(inv.notes),
    ].join(','))
  })

  return rows.join('\n')
}

const generateSalesPersonCSV = (salesPersons?: SalesPersonPerformance[]): string => {
  const rows: string[] = []

  // Header
  rows.push('SALES PERSON PERFORMANCE')
  rows.push('')
  rows.push('Name,Email,Quotation Count,Quotation Amount,Quote Pending,Quote Sent,Quote Converted,Quote Cancelled,Invoice Count,Invoice Amount,Received Count,Received Amount,Pending Count,Pending Amount,Delivered,Cancelled,Conversion Rate')

  // Data rows
  salesPersons?.forEach((sp) => {
    rows.push([
      escapeCSV(sp.name),
      escapeCSV(sp.email),
      sp.quotations.count,
      formatCurrency(sp.quotations.amount),
      sp.quotations.pending,
      sp.quotations.sent,
      sp.quotations.invoiceGenerated,
      sp.quotations.cancelled,
      sp.invoices.count,
      formatCurrency(sp.invoices.amount),
      sp.invoices.received,
      formatCurrency(sp.invoices.receivedAmount),
      sp.invoices.pending,
      formatCurrency(sp.invoices.pendingAmount),
      sp.invoices.delivered,
      sp.invoices.cancelled,
      `${sp.conversionRate}%`,
    ].join(','))
  })

  return rows.join('\n')
}

// ============= EXPORT FUNCTIONS =============

export interface ExportReportExcelParams {
  quotationData?: QuotationReportData
  invoiceData?: InvoiceReportData
  salesPersonData?: SalesPersonPerformance[]
  filters: ReportFilters
}

/**
 * Export report data to a single CSV file with multiple sections
 */
export const exportReportToExcel = (params: ExportReportExcelParams) => {
  const { quotationData, invoiceData, salesPersonData, filters } = params

  const sections: string[] = []

  // Summary section
  sections.push(generateSummaryCSV(quotationData, invoiceData, filters))

  // Sales Person section
  if (salesPersonData && salesPersonData.length > 0) {
    sections.push('')
    sections.push('')
    sections.push(generateSalesPersonCSV(salesPersonData))
  }

  // Quotations section
  if (quotationData?.detailed && quotationData.detailed.length > 0) {
    sections.push('')
    sections.push('')
    sections.push(generateQuotationsCSV(quotationData.detailed))
  }

  // Invoices section
  if (invoiceData?.detailed && invoiceData.detailed.length > 0) {
    sections.push('')
    sections.push('')
    sections.push(generateInvoicesCSV(invoiceData.detailed))
  }

  const csvContent = sections.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `bulk-orders-report-${dateStr}.csv`

  saveAs(blob, filename)
}

/**
 * Export only quotations to CSV
 */
export const exportQuotationsToExcel = (quotations: BulkQuotation[]) => {
  const csvContent = generateQuotationsCSV(quotations)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `quotations-${dateStr}.csv`

  saveAs(blob, filename)
}

/**
 * Export only invoices to CSV
 */
export const exportInvoicesToExcel = (invoices: BulkInvoice[]) => {
  const csvContent = generateInvoicesCSV(invoices)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `invoices-${dateStr}.csv`

  saveAs(blob, filename)
}

/**
 * Export only sales person data to CSV
 */
export const exportSalesPersonsToExcel = (salesPersons: SalesPersonPerformance[]) => {
  const csvContent = generateSalesPersonCSV(salesPersons)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `sales-persons-${dateStr}.csv`

  saveAs(blob, filename)
}
