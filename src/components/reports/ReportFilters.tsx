import { useState, useEffect } from 'react'
import { Button, Card, CardContent, Input, Label } from '@/components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Filter, RefreshCw, X } from 'lucide-react'
import type { ReportFilters as ReportFiltersType, SalesPerson } from '@/types'

interface DatePreset {
  label: string
  value: string
  getRange: () => { startDate: string; endDate: string }
}

const DATE_PRESETS: DatePreset[] = [
  {
    label: 'Today',
    value: 'today',
    getRange: () => {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      return { startDate: dateStr, endDate: dateStr }
    },
  },
  {
    label: 'This Week',
    value: 'this_week',
    getRange: () => {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - dayOfWeek)
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      }
    },
  },
  {
    label: 'This Month',
    value: 'this_month',
    getRange: () => {
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      }
    },
  },
  {
    label: 'Last Month',
    value: 'last_month',
    getRange: () => {
      const today = new Date()
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      return {
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0],
      }
    },
  },
  {
    label: 'This Year',
    value: 'this_year',
    getRange: () => {
      const today = new Date()
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      return {
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      }
    },
  },
  {
    label: 'Custom',
    value: 'custom',
    getRange: () => ({ startDate: '', endDate: '' }),
  },
]

interface ReportFiltersProps {
  filters: ReportFiltersType
  salesPersons: SalesPerson[]
  onFiltersChange: (filters: ReportFiltersType) => void
  onApply: () => void
  onReset: () => void
  isLoading?: boolean
}

export function ReportFilters({
  filters,
  salesPersons,
  onFiltersChange,
  onApply,
  onReset,
  isLoading = false,
}: ReportFiltersProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('this_month')

  // Initialize with this month's dates
  useEffect(() => {
    const preset = DATE_PRESETS.find((p) => p.value === 'this_month')
    if (preset && !filters.startDate && !filters.endDate) {
      const range = preset.getRange()
      onFiltersChange({ ...filters, ...range })
    }
  }, [])

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value)
    if (value !== 'custom') {
      const preset = DATE_PRESETS.find((p) => p.value === value)
      if (preset) {
        const range = preset.getRange()
        onFiltersChange({ ...filters, ...range })
      }
    }
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setSelectedPreset('custom')
    onFiltersChange({ ...filters, [field]: value })
  }

  const handleSalesPersonChange = (value: string) => {
    onFiltersChange({
      ...filters,
      salesPersonId: value === 'all' ? undefined : value,
    })
  }

  const handleReset = () => {
    setSelectedPreset('this_month')
    const preset = DATE_PRESETS.find((p) => p.value === 'this_month')
    if (preset) {
      const range = preset.getRange()
      onFiltersChange({
        startDate: range.startDate,
        endDate: range.endDate,
        salesPersonId: undefined,
        status: undefined,
      })
    }
    onReset()
  }

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Filter className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Report Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Preset */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600">Date Range</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="bg-white border-slate-200 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600">Start Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="pl-10 bg-white border-slate-200 hover:border-indigo-300 transition-colors"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600">End Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="pl-10 bg-white border-slate-200 hover:border-indigo-300 transition-colors"
              />
            </div>
          </div>

          {/* Sales Person */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600">Sales Person</Label>
            <Select
              value={filters.salesPersonId || 'all'}
              onValueChange={handleSalesPersonChange}
            >
              <SelectTrigger className="bg-white border-slate-200 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="All Sales Persons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales Persons</SelectItem>
                {salesPersons.map((sp) => (
                  <SelectItem key={sp._id} value={sp._id}>
                    {sp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-transparent">Actions</Label>
            <div className="flex gap-2">
              <Button
                onClick={onApply}
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isLoading}
                className="border-slate-200 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
