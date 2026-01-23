import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { InvoiceReportSummary } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  sent: '#3b82f6',
  pending_payment: '#f59e0b',
  payment_received: '#10b981',
  delivered: '#8b5cf6',
  cancelled: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  sent: 'Sent',
  pending_payment: 'Pending Payment',
  payment_received: 'Payment Received',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

interface InvoiceStatusChartProps {
  summary?: InvoiceReportSummary
  isLoading?: boolean
}

export function InvoiceStatusChart({
  summary,
  isLoading = false,
}: InvoiceStatusChartProps) {
  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-violet-600" />
            Invoice Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = Object.entries(summary?.byStatus || {})
    .filter(([_, data]) => data && data.count > 0)
    .map(([status, data]) => ({
      name: STATUS_LABELS[status] || status,
      value: data!.count,
      amount: data!.amount,
      color: STATUS_COLORS[status] || '#6b7280',
    }))

  const totalCount = chartData.reduce((sum, item) => sum + item.value, 0)
  const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">Count: {data.value}</p>
          <p className="text-sm text-slate-600">Amount: {formatCurrency(data.amount)}</p>
          <p className="text-xs text-slate-400 mt-1">
            {((data.value / totalCount) * 100).toFixed(1)}% of total
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Receipt className="h-5 w-5 text-violet-600" />
          </div>
          Invoice Status Distribution
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Total: {totalCount} invoices worth {formatCurrency(totalAmount)}
        </p>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            No invoice data available
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={entry.color}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
