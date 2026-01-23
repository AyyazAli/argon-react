import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { TimeSeriesData } from '@/types'

interface TimeSeriesChartProps {
  quotationData?: TimeSeriesData[]
  invoiceData?: TimeSeriesData[]
  isLoading?: boolean
}

export function TimeSeriesChart({
  quotationData,
  invoiceData,
  isLoading = false,
}: TimeSeriesChartProps) {
  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-600" />
            Time Series
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Merge quotation and invoice data by date
  const dateMap = new Map<
    string,
    { quotationCount: number; quotationAmount: number; invoiceCount: number; invoiceAmount: number }
  >()

  quotationData?.forEach((item) => {
    const existing = dateMap.get(item.date) || {
      quotationCount: 0,
      quotationAmount: 0,
      invoiceCount: 0,
      invoiceAmount: 0,
    }
    dateMap.set(item.date, {
      ...existing,
      quotationCount: item.count,
      quotationAmount: item.amount,
    })
  })

  invoiceData?.forEach((item) => {
    const existing = dateMap.get(item.date) || {
      quotationCount: 0,
      quotationAmount: 0,
      invoiceCount: 0,
      invoiceAmount: 0,
    }
    dateMap.set(item.date, {
      ...existing,
      invoiceCount: item.count,
      invoiceAmount: item.amount,
    })
  })

  const chartData = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      displayDate: new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      ...data,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 min-w-[200px]">
          <p className="font-semibold text-slate-800 border-b pb-2 mb-2">
            {new Date(data.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Quotations:</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.quotationAmount)} ({data.quotationCount})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-violet-600">Invoices:</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.invoiceAmount)} ({data.invoiceCount})
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-cyan-600" />
          </div>
          Activity Over Time
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Quotation and invoice amounts over the selected date range
        </p>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-slate-400">
            No time series data available
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="quotationAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="invoiceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-slate-600">{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="quotationAmount"
                  name="Quotations"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#quotationAreaGradient)"
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="invoiceAmount"
                  name="Invoices"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#invoiceAreaGradient)"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
