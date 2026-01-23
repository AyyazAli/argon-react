import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import type {
  QuotationReportData,
  InvoiceReportData,
  SalesPersonPerformance,
  ReportFilters,
  BulkCustomer,
} from '@/types'

// ============= STYLES =============

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #6366f1',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  dateRange: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
    paddingBottom: 5,
    borderBottom: '1px solid #e2e8f0',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    width: '23%',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
  },
  summaryCardTitle: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryCardSubtext: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 2,
  },
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#334155',
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
  },
  tableCellRight: {
    textAlign: 'right',
  },
  statusBadge: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusSent: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  statusInvoiceGenerated: {
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
  },
  statusReceived: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
  },
})

// ============= HELPER FUNCTIONS =============

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
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

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'pending':
    case 'pending_payment':
      return styles.statusPending
    case 'sent':
      return styles.statusSent
    case 'invoice_generated':
    case 'delivered':
      return styles.statusInvoiceGenerated
    case 'payment_received':
      return styles.statusReceived
    case 'cancelled':
      return styles.statusCancelled
    default:
      return {}
  }
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

// ============= PDF DOCUMENT COMPONENT =============

interface ReportPDFProps {
  quotationData?: QuotationReportData
  invoiceData?: InvoiceReportData
  salesPersonData?: SalesPersonPerformance[]
  filters: ReportFilters
  generatedAt: Date
}

const ReportPDF = ({
  quotationData,
  invoiceData,
  salesPersonData,
  filters,
  generatedAt,
}: ReportPDFProps) => {
  const dateRangeText =
    filters.startDate && filters.endDate
      ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
      : 'All Time'

  return (
    <Document>
      {/* Summary Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Bulk Orders Report</Text>
          <Text style={styles.subtitle}>
            Comprehensive Analytics & Performance Summary
          </Text>
          <Text style={styles.dateRange}>Date Range: {dateRangeText}</Text>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary Overview</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Total Quotations</Text>
              <Text style={styles.summaryCardValue}>
                {formatCurrency(quotationData?.summary?.totalAmount || 0)}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                {quotationData?.summary?.totalCount || 0} quotations
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Total Invoices</Text>
              <Text style={styles.summaryCardValue}>
                {formatCurrency(invoiceData?.summary?.totalAmount || 0)}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                {invoiceData?.summary?.totalCount || 0} invoices
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Payment Received</Text>
              <Text style={[styles.summaryCardValue, { color: '#059669' }]}>
                {formatCurrency(invoiceData?.summary?.receivedAmount || 0)}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                {invoiceData?.summary?.receivedCount || 0} paid
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Pending Payment</Text>
              <Text style={[styles.summaryCardValue, { color: '#d97706' }]}>
                {formatCurrency(invoiceData?.summary?.pendingAmount || 0)}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                {invoiceData?.summary?.pendingCount || 0} pending
              </Text>
            </View>
          </View>
        </View>

        {/* Quotation Status Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quotation Status Breakdown</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellHeader}>Status</Text>
              <Text style={[styles.tableCellHeader, styles.tableCellRight]}>Count</Text>
              <Text style={[styles.tableCellHeader, styles.tableCellRight]}>Amount</Text>
            </View>
            {Object.entries(quotationData?.summary?.byStatus || {}).map(
              ([status, data], index) => (
                <View
                  key={status}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <View style={styles.tableCell}>
                    <Text style={[styles.statusBadge, getStatusStyle(status)]}>
                      {STATUS_LABELS[status] || status}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {data?.count || 0}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {formatCurrency(data?.amount || 0)}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* Invoice Status Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Status Breakdown</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellHeader}>Status</Text>
              <Text style={[styles.tableCellHeader, styles.tableCellRight]}>Count</Text>
              <Text style={[styles.tableCellHeader, styles.tableCellRight]}>Amount</Text>
            </View>
            {Object.entries(invoiceData?.summary?.byStatus || {}).map(
              ([status, data], index) => (
                <View
                  key={status}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <View style={styles.tableCell}>
                    <Text style={[styles.statusBadge, getStatusStyle(status)]}>
                      {STATUS_LABELS[status] || status}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {data?.count || 0}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {formatCurrency(data?.amount || 0)}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        <Text style={styles.footer}>
          Generated on {generatedAt.toLocaleDateString()} at{' '}
          {generatedAt.toLocaleTimeString()}
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>

      {/* Sales Person Performance Page */}
      {salesPersonData && salesPersonData.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Sales Person Performance</Text>
            <Text style={styles.subtitle}>Individual Performance Metrics</Text>
            <Text style={styles.dateRange}>Date Range: {dateRangeText}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { flex: 2 }]}>Name</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellRight]}>
                  Quotations
                </Text>
                <Text style={[styles.tableCellHeader, styles.tableCellRight]}>
                  Invoices
                </Text>
                <Text style={[styles.tableCellHeader, styles.tableCellRight]}>
                  Received
                </Text>
                <Text style={[styles.tableCellHeader, styles.tableCellRight]}>
                  Conv. Rate
                </Text>
              </View>
              {salesPersonData.map((sp, index) => (
                <View
                  key={sp.userId}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <Text style={[styles.tableCell, { flex: 2 }]}>{sp.name}</Text>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {formatCurrency(sp.quotations.amount)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {formatCurrency(sp.invoices.amount)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {formatCurrency(sp.invoices.receivedAmount)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {sp.conversionRate}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.footer}>
            Generated on {generatedAt.toLocaleDateString()} at{' '}
            {generatedAt.toLocaleTimeString()}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </Page>
      )}

      {/* Quotations Detail Page */}
      {quotationData?.detailed && quotationData.detailed.length > 0 && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Quotations Detail</Text>
            <Text style={styles.subtitle}>
              Showing {quotationData.detailed.length} quotations
            </Text>
            <Text style={styles.dateRange}>Date Range: {dateRangeText}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { flex: 1.2 }]}>Quotation #</Text>
              <Text style={[styles.tableCellHeader, { flex: 2 }]}>Customer</Text>
              <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Sales Person</Text>
              <Text style={styles.tableCellHeader}>Status</Text>
              <Text style={[styles.tableCellHeader, styles.tableCellRight]}>Amount</Text>
              <Text style={styles.tableCellHeader}>Date</Text>
            </View>
            {quotationData.detailed.slice(0, 30).map((q, index) => {
              const customer = typeof q.customer === 'object' ? (q.customer as BulkCustomer) : null
              const createdBy =
                q.createdBy && typeof q.createdBy === 'object' ? q.createdBy : null

              return (
                <View
                  key={q._id}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>
                    {q.quotationNumber}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {customer?.companyName || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {createdBy?.name || createdBy?.email || 'N/A'}
                  </Text>
                  <View style={styles.tableCell}>
                    <Text style={[styles.statusBadge, getStatusStyle(q.status)]}>
                      {STATUS_LABELS[q.status] || q.status}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {formatCurrency(q.grandTotal)}
                  </Text>
                  <Text style={styles.tableCell}>{formatDate(q.dateCreated)}</Text>
                </View>
              )
            })}
          </View>

          <Text style={styles.footer}>
            Generated on {generatedAt.toLocaleDateString()} at{' '}
            {generatedAt.toLocaleTimeString()}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </Page>
      )}

      {/* Invoices Detail Page */}
      {invoiceData?.detailed && invoiceData.detailed.length > 0 && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Invoices Detail</Text>
            <Text style={styles.subtitle}>
              Showing {invoiceData.detailed.length} invoices
            </Text>
            <Text style={styles.dateRange}>Date Range: {dateRangeText}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { flex: 1.2 }]}>Invoice #</Text>
              <Text style={[styles.tableCellHeader, { flex: 2 }]}>Customer</Text>
              <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Sales Person</Text>
              <Text style={styles.tableCellHeader}>Status</Text>
              <Text style={[styles.tableCellHeader, styles.tableCellRight]}>Amount</Text>
              <Text style={styles.tableCellHeader}>Date</Text>
            </View>
            {invoiceData.detailed.slice(0, 30).map((inv, index) => {
              const customer =
                typeof inv.customer === 'object' ? (inv.customer as BulkCustomer) : null
              const createdBy =
                inv.createdBy && typeof inv.createdBy === 'object' ? inv.createdBy : null

              return (
                <View
                  key={inv._id}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <Text style={[styles.tableCell, { flex: 1.2 }]}>
                    {inv.invoiceNumber}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {customer?.companyName || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {createdBy?.name || createdBy?.email || 'N/A'}
                  </Text>
                  <View style={styles.tableCell}>
                    <Text style={[styles.statusBadge, getStatusStyle(inv.status)]}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {formatCurrency(inv.grandTotal)}
                  </Text>
                  <Text style={styles.tableCell}>{formatDate(inv.dateCreated)}</Text>
                </View>
              )
            })}
          </View>

          <Text style={styles.footer}>
            Generated on {generatedAt.toLocaleDateString()} at{' '}
            {generatedAt.toLocaleTimeString()}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </Page>
      )}
    </Document>
  )
}

// ============= EXPORT FUNCTION =============

export interface ExportReportPDFParams {
  quotationData?: QuotationReportData
  invoiceData?: InvoiceReportData
  salesPersonData?: SalesPersonPerformance[]
  filters: ReportFilters
}

export const exportReportToPDF = async (params: ExportReportPDFParams) => {
  const { quotationData, invoiceData, salesPersonData, filters } = params
  const generatedAt = new Date()

  const doc = (
    <ReportPDF
      quotationData={quotationData}
      invoiceData={invoiceData}
      salesPersonData={salesPersonData}
      filters={filters}
      generatedAt={generatedAt}
    />
  )

  const blob = await pdf(doc).toBlob()

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `bulk-orders-report-${dateStr}.pdf`

  saveAs(blob, filename)
}
