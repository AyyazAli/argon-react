import { Card, CardContent, Skeleton } from '@/components/ui'
import { cn, formatCurrency } from '@/lib/utils'
import {
  FileText,
  Receipt,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Ban,
  Send,
} from 'lucide-react'
import type { QuotationReportSummary, InvoiceReportSummary } from '@/types'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  className?: string
  iconBgClassName?: string
  valueClassName?: string
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  iconBgClassName,
  valueClassName,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className={cn('text-2xl font-bold text-slate-800', valueClassName)}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-400">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend >= 0 ? 'text-emerald-500' : 'text-red-500'
                  )}
                >
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
          <div className={cn('rounded-xl p-3', iconBgClassName || 'bg-slate-100')}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

interface SummaryCardsProps {
  quotationSummary?: QuotationReportSummary
  invoiceSummary?: InvoiceReportSummary
  isLoading?: boolean
}

export function SummaryCards({
  quotationSummary,
  invoiceSummary,
  isLoading = false,
}: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const quotationStats = {
    total: quotationSummary?.totalCount || 0,
    totalAmount: quotationSummary?.totalAmount || 0,
    pending: quotationSummary?.byStatus?.pending?.count || 0,
    pendingAmount: quotationSummary?.byStatus?.pending?.amount || 0,
    sent: quotationSummary?.byStatus?.sent?.count || 0,
    sentAmount: quotationSummary?.byStatus?.sent?.amount || 0,
    invoiceGenerated: quotationSummary?.byStatus?.invoice_generated?.count || 0,
    invoiceGeneratedAmount: quotationSummary?.byStatus?.invoice_generated?.amount || 0,
    cancelled: quotationSummary?.byStatus?.cancelled?.count || 0,
    cancelledAmount: quotationSummary?.byStatus?.cancelled?.amount || 0,
  }

  const invoiceStats = {
    total: invoiceSummary?.totalCount || 0,
    totalAmount: invoiceSummary?.totalAmount || 0,
    received: invoiceSummary?.receivedCount || 0,
    receivedAmount: invoiceSummary?.receivedAmount || 0,
    pending: invoiceSummary?.pendingCount || 0,
    pendingAmount: invoiceSummary?.pendingAmount || 0,
  }

  return (
    <div className="space-y-6">
      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Quotations"
          value={formatCurrency(quotationStats.totalAmount)}
          subtitle={`${quotationStats.total} quotations`}
          icon={<FileText className="h-6 w-6 text-indigo-600" />}
          iconBgClassName="bg-indigo-100"
          className="bg-gradient-to-br from-indigo-50 to-white"
        />
        <StatCard
          title="Total Invoices"
          value={formatCurrency(invoiceStats.totalAmount)}
          subtitle={`${invoiceStats.total} invoices`}
          icon={<Receipt className="h-6 w-6 text-violet-600" />}
          iconBgClassName="bg-violet-100"
          className="bg-gradient-to-br from-violet-50 to-white"
        />
        <StatCard
          title="Payment Received"
          value={formatCurrency(invoiceStats.receivedAmount)}
          subtitle={`${invoiceStats.received} invoices paid`}
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
          iconBgClassName="bg-emerald-100"
          className="bg-gradient-to-br from-emerald-50 to-white"
          valueClassName="text-emerald-700"
        />
        <StatCard
          title="Pending Payment"
          value={formatCurrency(invoiceStats.pendingAmount)}
          subtitle={`${invoiceStats.pending} invoices pending`}
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          iconBgClassName="bg-amber-100"
          className="bg-gradient-to-br from-amber-50 to-white"
          valueClassName="text-amber-700"
        />
      </div>

      {/* Quotation Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                  Pending Quotations
                </p>
                <p className="text-xl font-bold text-amber-800 mt-1">
                  {quotationStats.pending}
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  {formatCurrency(quotationStats.pendingAmount)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 bg-blue-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                  Sent Quotations
                </p>
                <p className="text-xl font-bold text-blue-800 mt-1">
                  {quotationStats.sent}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {formatCurrency(quotationStats.sentAmount)}
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-violet-200 bg-violet-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
                  Invoice Generated
                </p>
                <p className="text-xl font-bold text-violet-800 mt-1">
                  {quotationStats.invoiceGenerated}
                </p>
                <p className="text-sm text-violet-600 mt-1">
                  {formatCurrency(quotationStats.invoiceGeneratedAmount)}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-red-200 bg-red-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 uppercase tracking-wider">
                  Cancelled
                </p>
                <p className="text-xl font-bold text-red-800 mt-1">
                  {quotationStats.cancelled}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {formatCurrency(quotationStats.cancelledAmount)}
                </p>
              </div>
              <Ban className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
