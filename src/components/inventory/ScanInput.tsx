import { useRef, useState } from 'react'
import { ScanLine, Plus } from 'lucide-react'
import { Button, Input } from '@/components/ui'

interface ScanInputProps {
  onCode: (code: string) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Text input tuned for keyboard-wedge barcode scanners (they type the code
 * then press Enter) and for manual entry. Stays focused and clears after
 * each submission. 16px font prevents iOS Safari from zooming on focus.
 */
export function ScanInput({ onCode, disabled, placeholder }: ScanInputProps) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const submit = () => {
    const code = value.trim()
    setValue('')
    if (code) onCode(code)
    ref.current?.focus()
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          autoFocus
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={placeholder ?? 'Scan or type a SKU / barcode, then Enter'}
          className="pl-9 text-base"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          inputMode="text"
        />
      </div>
      <Button type="button" variant="outline" onClick={submit} disabled={disabled || !value.trim()}>
        <Plus className="size-4" />
        Add
      </Button>
    </div>
  )
}
