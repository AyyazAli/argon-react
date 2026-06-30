import type { VariantAttribute, MovementType } from '@/types'

/** Parse "Size: M, Color: Red" into structured attributes. */
export function parseAttributes(input?: string): VariantAttribute[] {
  if (!input) return []
  return input
    .split(',')
    .map((pair) => {
      const idx = pair.indexOf(':')
      if (idx === -1) return null
      const name = pair.slice(0, idx).trim()
      const value = pair.slice(idx + 1).trim()
      return name && value ? { name, value } : null
    })
    .filter((a): a is VariantAttribute => a !== null)
}

/** Render structured attributes back to "Size: M, Color: Red". */
export function stringifyAttributes(attrs?: VariantAttribute[]): string {
  if (!attrs || attrs.length === 0) return ''
  return attrs.map((a) => `${a.name}: ${a.value}`).join(', ')
}

/** Parse a string form field to a number, returning undefined when blank. */
export function toNumber(value?: string): number | undefined {
  if (value === undefined || value === null || value.trim() === '') return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  receipt: 'Receipt',
  adjustment: 'Adjustment',
  opening: 'Opening',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  correction: 'Correction',
}

export function movementBadgeVariant(
  type: MovementType
): 'default' | 'secondary' | 'success' | 'warning' | 'outline' {
  switch (type) {
    case 'receipt':
    case 'opening':
    case 'transfer_in':
      return 'success'
    case 'adjustment':
    case 'correction':
      return 'warning'
    default:
      return 'secondary'
  }
}
