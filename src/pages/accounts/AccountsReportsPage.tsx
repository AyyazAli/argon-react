import { useState } from 'react'
import {
  useReportSummary,
  useReportIncomeExpense,
  useReportByCategory,
  useReportByAccount,
  useReportVendorPayables,
} from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Spinner,
} from '@/components/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  BarChart3,
  PieChart,
  DollarSign,
} from 'lucide-react'

export function AccountsReportsPage() {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({})
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month')

  const { data: summary, isLoading: summaryLoading } = useReportSummary(dateRange)
  const { data: incomeExpense, isLoading: incomeExpenseLoading } = useReportIncomeExpense({
    ...dateRange,
    groupBy,
  })
  const { data: byCategory, isLoading: byCategoryLoading } = useReportByCategory(dateRange)
  const { data: byAccount, isLoading: byAccountLoading } = useReportByAccount(dateRange)
  const { data: vendorPayables, isLoading: vendorPayablesLoading } = useReportVendorPayables()

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value || undefined }))
  }

  const clearFilters = () => {
    setDateRange({})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Accounts Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive financial reports and analytics
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From Date</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from || ''}
                onChange={(e) => handleDateChange('from', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To Date</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to || ''}
                onChange={(e) => handleDateChange('to', e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-green-100 dark:bg-green-900/30 p-3">
                <TrendingUp className="size-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                {summaryLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary?.income?.total || 0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200/50 dark:border-red-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-red-100 dark:bg-red-900/30 p-3">
                <TrendingDown className="size-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expense</p>
                {summaryLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary?.expense?.total || 0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-3">
                <DollarSign className="size-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                {summaryLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <p
                    className={`text-2xl font-bold ${
                      (summary?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(summary?.netIncome || 0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-purple-100 dark:bg-purple-900/30 p-3">
                <Wallet className="size-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                {summaryLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(summary?.totalBalance || 0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different report views */}
      <Tabs defaultValue="income-expense" className="space-y-4">
        <TabsList>
          <TabsTrigger value="income-expense" className="gap-2">
            <BarChart3 className="size-4" />
            Income vs Expense
          </TabsTrigger>
          <TabsTrigger value="by-category" className="gap-2">
            <PieChart className="size-4" />
            By Category
          </TabsTrigger>
          <TabsTrigger value="by-account" className="gap-2">
            <Wallet className="size-4" />
            By Account
          </TabsTrigger>
          <TabsTrigger value="vendor-payables" className="gap-2">
            <Users className="size-4" />
            Vendor Payables
          </TabsTrigger>
        </TabsList>

        {/* Income vs Expense Tab */}
        <TabsContent value="income-expense">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Income vs Expense by Period</CardTitle>
                <Select
                  value={groupBy}
                  onValueChange={(v: 'day' | 'week' | 'month') => setGroupBy(v)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {incomeExpenseLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Income</TableHead>
                        <TableHead className="text-right">Expense</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead className="text-center">Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!incomeExpense?.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-muted-foreground"
                          >
                            No data available for the selected period
                          </TableCell>
                        </TableRow>
                      ) : (
                        incomeExpense.map((row) => (
                          <TableRow key={row.period}>
                            <TableCell className="font-medium">{row.period}</TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(row.income)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCurrency(row.expense)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                row.net >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(row.net)}
                            </TableCell>
                            <TableCell className="text-center">
                              {row.incomeCount + row.expenseCount}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Category Tab */}
        <TabsContent value="by-category">
          <Card>
            <CardHeader>
              <CardTitle>Transactions by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {byCategoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-center">Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!byCategory?.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-12 text-muted-foreground"
                          >
                            No data available for the selected period
                          </TableCell>
                        </TableRow>
                      ) : (
                        byCategory.map((row) => (
                          <TableRow key={row.categoryId}>
                            <TableCell className="font-medium">{row.categoryName}</TableCell>
                            <TableCell>
                              <Badge
                                variant={row.categoryType === 'income' ? 'success' : 'destructive'}
                                className="capitalize"
                              >
                                {row.categoryType}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                row.categoryType === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(row.total)}
                            </TableCell>
                            <TableCell className="text-center">{row.count}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Account Tab */}
        <TabsContent value="by-account">
          <Card>
            <CardHeader>
              <CardTitle>Transactions by Account</CardTitle>
            </CardHeader>
            <CardContent>
              {byAccountLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Current Balance</TableHead>
                        <TableHead className="text-right">Period Income</TableHead>
                        <TableHead className="text-right">Period Expense</TableHead>
                        <TableHead className="text-center">Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!byAccount?.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-muted-foreground"
                          >
                            No accounts found
                          </TableCell>
                        </TableRow>
                      ) : (
                        byAccount.map((row) => (
                          <TableRow key={row.accountId}>
                            <TableCell className="font-medium">{row.accountName}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(row.currentBalance)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(row.periodIncome)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCurrency(row.periodExpense)}
                            </TableCell>
                            <TableCell className="text-center">{row.transactionCount}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Payables Tab */}
        <TabsContent value="vendor-payables">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vendor Payables</CardTitle>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Payables</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(vendorPayables?.totalPayables || 0)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {vendorPayablesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Vendor</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount Owed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!vendorPayables?.vendors?.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-12 text-muted-foreground"
                          >
                            No vendors with outstanding balances
                          </TableCell>
                        </TableRow>
                      ) : (
                        vendorPayables.vendors.map((vendor) => (
                          <TableRow key={vendor._id}>
                            <TableCell className="font-medium">{vendor.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {vendor.description || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-orange-600">
                              {formatCurrency(vendor.amountOwed)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
