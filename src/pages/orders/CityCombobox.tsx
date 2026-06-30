import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { Input, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { City } from '@/types'

interface CityComboboxProps {
  cities: City[]
  /** True when this order already has a city mapped for the active courier. */
  mapped: boolean
  /** Label shown when mapped (e.g. the matched city name). */
  mappedLabel?: string
  loading?: boolean
  disabled?: boolean
  onSelect: (city: City) => void
}

const MAX_RESULTS = 60

export function CityCombobox({
  cities,
  mapped,
  mappedLabel,
  loading,
  disabled,
  onSelect,
}: CityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const all = cities ?? []
    const q = query.trim().toLowerCase()
    const list = q
      ? all.filter((c) => c?.name?.toLowerCase().includes(q))
      : all
    return list.slice(0, MAX_RESULTS)
  }, [cities, query])

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQuery('')
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex h-8 min-w-[150px] items-center justify-between gap-2 rounded-md border px-2 text-xs',
            'disabled:cursor-not-allowed disabled:opacity-50',
            mapped
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-red-400 bg-red-50 text-red-600'
          )}
        >
          <span className="flex items-center gap-1 truncate">
            {mapped ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">
              {mapped ? mappedLabel || 'Mapped' : 'Select city'}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-64 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none"
        >
          <div className="flex items-center gap-2 border-b px-2 py-1.5">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Spinner size="sm" /> Loading cities...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No cities found
              </div>
            ) : (
              filtered.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onSelect(city)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {city.name}
                </button>
              ))
            )}
            {!loading && query.trim() === '' && (cities?.length ?? 0) > MAX_RESULTS && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground">
                Showing first {MAX_RESULTS} — type to search all {cities!.length}.
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
