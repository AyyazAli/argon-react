import { useState, useMemo } from 'react'
import { useAllReports, useSummaryReports } from '@/hooks'
import { Button, Card, CardContent, Skeleton } from '@/components/ui'
import {
  ReportFilters,
  SummaryCards,
  QuotationStatusChart,
  InvoiceStatusChart,
  SalesPersonChart,
  TimeSeriesChart,
  TabbedTables,
} from '@/components/reports'
import { exportReportToPDF } from '@/utils/reportPdfExporter'
import { exportReportToExcel } from '@/utils/reportExcelExporter'
import {
  FileDown,
  FileSpreadsheet,
  BarChart3,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import type { ReportFilters as ReportFiltersType } from '@/types'

// Get default date range (this month)
const getDefaultDateRange = () => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  }
}

export function ReportsPage() {
  const defaultRange = getDefaultDateRange()
  const [filters, setFilters] = useState<ReportFiltersType>({
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
  })
  const [appliedFilters, setAppliedFilters] = useState<ReportFiltersType>(filters)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch all report data
  const {
    quotationReports,
    invoiceReports,
    salesPersonReports,
    summaryReports,
    isLoading,
    isFetching,
    refetchAll,
  } = useAllReports(appliedFilters)

  // Get sales persons for filter dropdown
  const salesPersons = summaryReports.data?.data?.salesPersons || []

  // Memoized data
  const quotationData = useMemo(
    () => quotationReports.data?.data,
    [quotationReports.data]
  )
  const invoiceData = useMemo(
    () => invoiceReports.data?.data,
    [invoiceReports.data]
  )
  const salesPersonData = useMemo(
    () => salesPersonReports.data?.data?.salesPersons,
    [salesPersonReports.data]
  )

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters })
  }

  const handleResetFilters = () => {
    const defaultRange = getDefaultDateRange()
    const newFilters = {
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      salesPersonId: undefined,
      status: undefined,
    }
    setFilters(newFilters)
    setAppliedFilters(newFilters)
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportReportToPDF({
        quotationData,
        invoiceData,
        salesPersonData,
        filters: appliedFilters,
      })
    } catch (error) {
      console.error('Failed to export PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = () => {
    setIsExporting(true)
    try {
      exportReportToExcel({
        quotationData,
        invoiceData,
        salesPersonData,
        filters: appliedFilters,
      })
    } catch (error) {
      console.error('Failed to export Excel:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const hasError =
    quotationReports.isError ||
    invoiceReports.isError ||
    salesPersonReports.isError ||
    summaryReports.isError

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Bulk Orders Reports</h1>
              <p className="text-slate-500">
                Comprehensive analytics for quotations and invoices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => refetchAll()}
              variant="outline"
              disabled={isFetching}
              className="border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isLoading || isExporting}
              className="bg-red-600 hover:bg-red-700 text-white shadow-md"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={isLoading || isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <ReportFilters
          filters={filters}
          salesPersons={salesPersons}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          isLoading={isFetching}
        />

        {/* Error State */}
        {hasError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Error Loading Reports</h3>
                <p className="text-red-600 text-sm">
                  There was an error loading the report data. Please try again.
                </p>
              </div>
              <Button
                onClick={() => refetchAll()}
                variant="outline"
                className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <SummaryCards
          quotationSummary={quotationData?.summary}
          invoiceSummary={invoiceData?.summary}
          isLoading={isLoading}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuotationStatusChart
            summary={quotationData?.summary}
            isLoading={isLoading}
          />
          <InvoiceStatusChart
            summary={invoiceData?.summary}
            isLoading={isLoading}
          />
        </div>

        {/* Time Series Chart */}
        <TimeSeriesChart
          quotationData={quotationData?.timeSeries}
          invoiceData={invoiceData?.timeSeries}
          isLoading={isLoading}
        />

        {/* Sales Person Chart */}
        <SalesPersonChart data={salesPersonData} isLoading={isLoading} />

        {/* Tabbed Tables */}
        <TabbedTables
          quotations={quotationData?.detailed}
          invoices={invoiceData?.detailed}
          salesPersons={salesPersonData}
          isLoading={isLoading}
        />

        {/* Loading Overlay */}
        {isFetching && !isLoading && (
          <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Updating...
          </div>
        )}
      </div>
    </div>
  )
}
