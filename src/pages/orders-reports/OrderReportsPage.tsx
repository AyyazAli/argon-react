import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
} from '@/components/ui'
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Activity,
  PhoneCall,
  X,
} from 'lucide-react'
import {
  useOrderActivitySummary,
  useOrderActivityDaily,
  useOrderReportUsers,
} from '@/hooks/useOrderReports'
import type { OrderReportFilters } from '@/types/orderReports'
import { formatDate } from '@/lib/utils'

// ---- date presets ---------------------------------------------------------
const iso = (d: Date) => d.toISOString().split('T')[0]

const PRESETS: { label: string; value: string; range: () => { startDate: string; endDate: string } }[] = [
  { label: 'Today', value: 'today', range: () => { const t = new Date(); return { startDate: iso(t), endDate: iso(t) } } },
  { label: 'This Week', value: 'this_week', range: () => { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - t.getDay()); return { startDate: iso(s), endDate: iso(t) } } },
  { label: 'This Month', value: 'this_month', range: () => { const t = new Date(); return { startDate: iso(new Date(t.getFullYear(), t.getMonth(), 1)), endDate: iso(t) } } },
  { label: 'Last Month', value: 'last_month', range: () => { const t = new Date(); return { startDate: iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), endDate: iso(new Date(t.getFullYear(), t.getMonth(), 0)) } } },
  { label: 'This Year', value: 'this_year', range: () => { const t = new Date(); return { startDate: iso(new Date(t.getFullYear(), 0, 1)), endDate: iso(t) } } },
  { label: 'Custom', value: 'custom', range: () => ({ startDate: '', endDate: '' }) },
]

const STATUS_LABELS: Record<string, string> = {
  confirm: 'Confirmed',
  dispatch: 'Dispatched',
  return: 'Returned',
  cancel: 'Cancelled',
  pending: 'Pending',
  delivered: 'Delivered',
  'call again': 'Call Again',
  printing: 'Printing',
  'advance pending': 'Advance Pending',
  'advance done': 'Advance Done',
  'self collect': 'Self Collect',
}
const label = (s: string) => STATUS_LABELS[s] ?? s

const BAR_COLOR = '#6366f1'

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function OrderReportsPage() {
  const thisMonth = PRESETS.find((p) => p.value === 'this_month')!.range()
  const [draft, setDraft] = useState<OrderReportFilters>({ ...thisMonth })
  const [applied, setApplied] = useState<OrderReportFilters>({ ...thisMonth })
  const [preset, setPreset] = useState('this_month')

  const usersQuery = useOrderReportUsers()
  const summaryQuery = useOrderActivitySummary(applied)
  const dailyQuery = useOrderActivityDaily(applied)

  const isLoading = summaryQuery.isLoading || dailyQuery.isLoading
  const isFetching = summaryQuery.isFetching || dailyQuery.isFetching

  const summary = summaryQuery.data?.data
  const daily = dailyQuery.data?.data
  const statusKeys = summary?.statusKeys ?? daily?.statusKeys ?? []
  const users = usersQuery.data?.data ?? []

  // Keep presets in sync with the draft date fields.
  const applyPreset = (value: string) => {
    setPreset(value)
    if (value !== 'custom') {
      const p = PRESETS.find((x) => x.value === value)
      if (p) setDraft((d) => ({ ...d, ...p.range() }))
    }
  }
  const setDate = (field: 'startDate' | 'endDate', value: string) => {
    setPreset('custom')
    setDraft((d) => ({ ...d, [field]: value }))
  }
  const apply = () => setApplied({ ...draft })
  const reset = () => {
    const r = PRESETS.find((p) => p.value === 'this_month')!.range()
    setPreset('this_month')
    setDraft({ ...r })
    setApplied({ ...r })
  }

  // Re-apply when the user filter changes (it's not part of the date "Apply" gesture).
  useEffect(() => {
    setApplied((a) => ({ ...a, userId: draft.userId }))
  }, [draft.userId])

  const userChartData = useMemo(
    () => (summary?.byUser ?? []).map((u) => ({ name: u.userName, total: u.total })),
    [summary]
  )

  const exportSummary = () => {
    if (!summary) return
    const headers = ['User', ...statusKeys.map(label), 'Total']
    const rows = summary.byUser.map((u) => [
      u.userName,
      ...statusKeys.map((k) => u.statusCounts[k] ?? 0),
      u.total,
    ])
    downloadCsv('order-activity-by-user.csv', headers, rows)
  }
  const exportDaily = () => {
    if (!daily) return
    const headers = ['Date', 'User', ...statusKeys.map(label), 'Total']
    const rows = daily.daily.map((r) => [
      r.day,
      r.userName,
      ...statusKeys.map((k) => r.statusCounts[k] ?? 0),
      r.total,
    ])
    downloadCsv('order-activity-daily.csv', headers, rows)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Order Activity Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Who changed what on orders — status changes attributed to each operator.
          </p>
        </div>
        <Button variant="outline" onClick={() => { summaryQuery.refetch(); dailyQuery.refetch() }} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Filter className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Report Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600">Date Range</Label>
              <Select value={preset} onValueChange={applyPreset}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" className="pl-10 bg-white" value={draft.startDate || ''} onChange={(e) => setDate('startDate', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" className="pl-10 bg-white" value={draft.endDate || ''} onChange={(e) => setDate('endDate', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-600">Operator</Label>
              <Select
                value={draft.userId || 'all'}
                onValueChange={(v) => setDraft((d) => ({ ...d, userId: v === 'all' ? undefined : v }))}
              >
                <SelectTrigger className="bg-white"><SelectValue placeholder="All operators" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All operators</SelectItem>
                  {users.map((u) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-transparent">Actions</Label>
              <div className="flex gap-2">
                <Button onClick={apply} disabled={isFetching} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
                <Button onClick={reset} variant="outline" disabled={isFetching}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : summaryQuery.isError || dailyQuery.isError ? (
        <Card><CardContent className="p-10 text-center text-red-600">Failed to load reports. Please try again.</CardContent></Card>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<Activity className="h-5 w-5 text-indigo-600" />} title="Total Actions" value={summary?.totalActions ?? 0} />
            <KpiCard icon={<PhoneCall className="h-5 w-5 text-green-600" />} title="Confirmed" value={summary?.byStatus['confirm'] ?? 0} />
            <KpiCard icon={<PhoneCall className="h-5 w-5 text-amber-600" />} title="Call Again" value={summary?.byStatus['call again'] ?? 0} />
            <KpiCard icon={<PhoneCall className="h-5 w-5 text-red-600" />} title="Cancelled" value={summary?.byStatus['cancel'] ?? 0} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Actions by Operator</CardTitle></CardHeader>
              <CardContent>
                {userChartData.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Daily Activity Volume</CardTitle></CardHeader>
              <CardContent>
                {(daily?.timeSeries.length ?? 0) === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={daily?.timeSeries} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="total" stroke={BAR_COLOR} fill={BAR_COLOR} fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <Tabs defaultValue="by-user">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="by-user">By Operator</TabsTrigger>
                <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="by-user">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Activity by Operator</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportSummary} disabled={!summary?.byUser.length}>
                    <Download className="h-4 w-4 mr-2" />CSV
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {(summary?.byUser.length ?? 0) === 0 ? <Empty /> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Operator</TableHead>
                          {statusKeys.map((k) => <TableHead key={k} className="text-center whitespace-nowrap">{label(k)}</TableHead>)}
                          <TableHead className="text-center font-bold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary!.byUser.map((u) => (
                          <TableRow key={u.userId}>
                            <TableCell className="font-medium">{u.userName}</TableCell>
                            {statusKeys.map((k) => <TableCell key={k} className="text-center">{u.statusCounts[k] || 0}</TableCell>)}
                            <TableCell className="text-center font-bold">{u.total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Daily Activity</CardTitle>
                  <Button variant="outline" size="sm" onClick={exportDaily} disabled={!daily?.daily.length}>
                    <Download className="h-4 w-4 mr-2" />CSV
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {(daily?.daily.length ?? 0) === 0 ? <Empty /> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Operator</TableHead>
                          {statusKeys.map((k) => <TableHead key={k} className="text-center whitespace-nowrap">{label(k)}</TableHead>)}
                          <TableHead className="text-center font-bold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {daily!.daily.map((r) => (
                          <TableRow key={`${r.userId}|${r.day}`}>
                            <TableCell className="whitespace-nowrap">{formatDate(r.day)}</TableCell>
                            <TableCell className="font-medium">{r.userName}</TableCell>
                            {statusKeys.map((k) => <TableCell key={k} className="text-center">{r.statusCounts[k] || 0}</TableCell>)}
                            <TableCell className="text-center font-bold">{r.total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function KpiCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 bg-slate-100 rounded-lg">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Empty() {
  return <div className="py-12 text-center text-sm text-muted-foreground">No activity in the selected range.</div>
}
