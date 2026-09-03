import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ScanMode, ReasonCode, LookupResult, BatchLineError } from '@/types'

export interface ScanLine {
  variantId: string
  productId: string
  productName: string
  sku: string
  attributes: string
  /** Total on hand across warehouses (display fallback). */
  onHand: number
  /** On hand per warehouse id, so the page can show the figure for the selected location. */
  stockByWarehouse: Record<string, number>
  costPrice: number
  /** Units to receive / deduct, or the counted on-hand in count mode. */
  quantity: number
  unitCost?: number
  error?: string
}

interface ScanSessionState {
  mode: ScanMode
  reasonCode: ReasonCode | ''
  reference: string
  note: string
  /** Selected warehouse ('' = default). Transfer uses from/to instead. */
  warehouseId: string
  fromWarehouseId: string
  toWarehouseId: string
  lines: ScanLine[]
  unresolved: string[]

  setWarehouseId: (id: string) => void
  setFromWarehouseId: (id: string) => void
  setToWarehouseId: (id: string) => void
  setMode: (mode: ScanMode) => void
  setReasonCode: (reasonCode: ReasonCode | '') => void
  setReference: (reference: string) => void
  setNote: (note: string) => void
  /** Add a resolved code as a line, or bump its quantity if already present. */
  addOrIncrement: (item: LookupResult, attributes: string) => void
  addUnresolved: (code: string) => void
  clearUnresolved: () => void
  setQuantity: (variantId: string, quantity: number) => void
  setUnitCost: (variantId: string, unitCost: number | undefined) => void
  removeLine: (variantId: string) => void
  applyErrors: (errors: BatchLineError[]) => void
  clearErrors: () => void
  clear: () => void
}

const initial = {
  mode: 'receive' as ScanMode,
  reasonCode: '' as ReasonCode | '',
  reference: '',
  note: '',
  warehouseId: '',
  fromWarehouseId: '',
  toWarehouseId: '',
  lines: [] as ScanLine[],
  unresolved: [] as string[],
}

/**
 * The in-progress scan session. Persisted to sessionStorage so a phone
 * refresh mid-count doesn't lose the work.
 */
export const useScanSessionStore = create<ScanSessionState>()(
  persist(
    (set) => ({
      ...initial,

      setMode: (mode) => set({ mode, reasonCode: '', lines: [], unresolved: [] }),
      setWarehouseId: (warehouseId) => set({ warehouseId }),
      setFromWarehouseId: (fromWarehouseId) => set({ fromWarehouseId }),
      setToWarehouseId: (toWarehouseId) => set({ toWarehouseId }),
      setReasonCode: (reasonCode) => set({ reasonCode }),
      setReference: (reference) => set({ reference }),
      setNote: (note) => set({ note }),

      addOrIncrement: (item, attributes) =>
        set((s) => {
          const stockByWarehouse: Record<string, number> = {}
          for (const e of item.stock || []) stockByWarehouse[String(e.warehouse)] = e.quantity
          const existing = s.lines.find((l) => l.variantId === item.variantId)
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.variantId === item.variantId
                  ? { ...l, quantity: l.quantity + 1, onHand: item.totalQuantity, stockByWarehouse, error: undefined }
                  : l
              ),
            }
          }
          const line: ScanLine = {
            variantId: item.variantId,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            attributes,
            onHand: item.totalQuantity,
            stockByWarehouse,
            costPrice: item.costPrice,
            quantity: 1,
            unitCost: s.mode === 'receive' ? item.costPrice : undefined,
          }
          return { lines: [line, ...s.lines] }
        }),

      addUnresolved: (code) =>
        set((s) => ({ unresolved: s.unresolved.includes(code) ? s.unresolved : [...s.unresolved, code] })),
      clearUnresolved: () => set({ unresolved: [] }),

      setQuantity: (variantId, quantity) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.variantId === variantId ? { ...l, quantity: Math.max(0, quantity), error: undefined } : l
          ),
        })),
      setUnitCost: (variantId, unitCost) =>
        set((s) => ({ lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, unitCost } : l)) })),
      removeLine: (variantId) => set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),

      applyErrors: (errors) =>
        set((s) => ({
          lines: s.lines.map((l, index) => {
            const err = errors.find((e) => e.lineIndex === index || (e.sku && e.sku === l.sku))
            return err ? { ...l, error: err.message } : { ...l, error: undefined }
          }),
        })),
      clearErrors: () => set((s) => ({ lines: s.lines.map((l) => ({ ...l, error: undefined })) })),

      clear: () =>
        set((s) => ({
          ...initial,
          mode: s.mode,
          warehouseId: s.warehouseId,
          fromWarehouseId: s.fromWarehouseId,
          toWarehouseId: s.toWarehouseId,
        })),
    }),
    {
      name: 'inventory-scan-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
