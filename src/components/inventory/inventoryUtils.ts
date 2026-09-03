import type { VariantAttribute, MovementType, ReasonCode, ScanMode, LabelGrid } from '@/types'

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

/** Must match SKU_PATTERN in backend/utils/inventoryHelpers.js (Code 128-safe). */
export const SKU_PATTERN = /^[A-Za-z0-9._/-]{1,24}$/
export const SKU_HINT = '1-24 characters: letters, digits, . _ / -'

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  receipt: 'Receipt',
  adjustment: 'Adjustment',
  opening: 'Opening',
  sale: 'Sale',
  return: 'Return',
  write_off: 'Write-off',
  internal: 'Internal use',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  correction: 'Correction',
}

export function movementBadgeVariant(
  type: MovementType
): 'default' | 'secondary' | 'success' | 'warning' | 'outline' | 'destructive' {
  switch (type) {
    case 'receipt':
    case 'opening':
    case 'transfer_in':
    case 'return':
      return 'success'
    case 'adjustment':
    case 'correction':
      return 'warning'
    case 'sale':
    case 'write_off':
    case 'internal':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export const REASON_LABELS: Record<ReasonCode, string> = {
  purchase: 'Purchase / received',
  walk_in: 'Sold offline (walk-in)',
  order: 'Used for an order',
  damaged: 'Damaged',
  lost: 'Lost',
  expired: 'Expired',
  sample: 'Sample',
  internal: 'Internal use',
  gift: 'Gift',
  count: 'Stock count',
  manual: 'Manual adjustment',
  transfer: 'Transfer between warehouses',
  order_return: 'Order returned / cancelled',
}

/** Reasons offered per scan mode (deduct requires one). */
export const REASON_OPTIONS: Record<ScanMode, { value: ReasonCode; label: string }[]> = {
  receive: [{ value: 'purchase', label: REASON_LABELS.purchase }],
  deduct: (['walk_in', 'order', 'damaged', 'lost', 'expired', 'sample', 'internal', 'gift'] as ReasonCode[]).map(
    (value) => ({ value, label: REASON_LABELS[value] })
  ),
  count: [{ value: 'count', label: REASON_LABELS.count }],
  transfer: [{ value: 'transfer', label: REASON_LABELS.transfer }],
}

export const SCAN_MODE_LABELS: Record<ScanMode, string> = {
  receive: 'Receive',
  deduct: 'Deduct',
  count: 'Stock Count',
  transfer: 'Transfer',
}

/**
 * A4 label-sheet presets (mm). Every field is numeric so a "Custom" grid can
 * override any of them without code changes.
 */
export const LABEL_GRIDS: LabelGrid[] = [
  { id: 'a4-65', name: '65 per sheet (38.1 × 21.2 mm)', columns: 5, rows: 13, labelWidth: 38.1, labelHeight: 21.2, marginTop: 10.7, marginLeft: 4.75, gapX: 2.5, gapY: 0 },
  { id: 'a4-24', name: '24 per sheet (64 × 34 mm)', columns: 3, rows: 8, labelWidth: 64, labelHeight: 34, marginTop: 12.9, marginLeft: 7.25, gapX: 2.5, gapY: 0 },
  { id: 'a4-21', name: '21 per sheet (63.5 × 38.1 mm)', columns: 3, rows: 7, labelWidth: 63.5, labelHeight: 38.1, marginTop: 15.15, marginLeft: 7.2, gapX: 2.5, gapY: 0 },
]
