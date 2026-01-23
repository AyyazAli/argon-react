import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { SalesPersonPerformance } from '@/types'

interface SalesPersonChartProps {
  data?: SalesPersonPerformance[]
  isLoading?: boolean
}

export function SalesPersonChart({ data, isLoading = false }: SalesPersonChartProps) {
  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Sales Person Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData =
    data?.map((sp) => ({
      name: sp.name.split(' ')[0] || sp.name, // Use first name for cleaner display
      fullName: sp.name,
      quotations: sp.quotations.amount,
      invoices: sp.invoices.amount,
      received: sp.invoices.receivedAmount,
      quotationCount: sp.quotations.count,
      invoiceCount: sp.invoices.count,
      receivedCount: sp.invoices.received,
    })) || []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200 min-w-[200px]">
          <p className="font-semibold text-slate-800 border-b pb-2 mb-2">
            {data.fullName}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Quotations:</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.quotations)} ({data.quotationCount})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-violet-600">Invoices:</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.invoices)} ({data.invoiceCount})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-600">Received:</span>
              <span className="text-sm font-medium">
                {formatCurrency(data.received)} ({data.receivedCount})
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
          <div className="p-2 bg-teal-100 rounded-lg">
            <Users className="h-5 w-5 text-teal-600" />
          </div>
          Sales Person Performance
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Comparison of quotations, invoices, and received payments by sales person
        </p>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-slate-400">
            No sales person data available
          </div>
        ) : (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="quotationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="invoiceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
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
                    <span className="text-sm text-slate-600 capitalize">{value}</span>
                  )}
                />
                <Bar
                  dataKey="quotations"
                  fill="url(#quotationGradient)"
                  name="Quotations"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="invoices"
                  fill="url(#invoiceGradient)"
                  name="Invoices"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="received"
                  fill="url(#receivedGradient)"
                  name="Received"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
