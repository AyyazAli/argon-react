import type { OrderCatalogProduct, OrderCatalogVariant } from '@/types'

/**
 * Client-side mirror of backend `orderInventory.findVariantForLine`, used by the
 * order product picker to show which inventory item a line will deduct from.
 * Order: SKU -> Shopify variant id (name must agree) -> product name, with the
 * variant taken from the part after " - " (attribute values joined by " / ").
 */

export interface LineMatch {
  product: OrderCatalogProduct
  /** null when the product has several variants and the line doesn't say which. */
  variant: OrderCatalogVariant | null
}

const norm = (s?: string) => (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

export function splitLineName(name?: string): { base: string; label: string } {
  const n = name ?? ''
  const i = n.lastIndexOf(' - ')
  return i === -1 ? { base: n, label: '' } : { base: n.slice(0, i), label: n.slice(i + 3) }
}

/** Line name the backend will match: "Product" or "Product - Variant label". */
export function lineNameFor(product: OrderCatalogProduct, variant: OrderCatalogVariant | null): string {
  if (!variant || product.variants.length === 1 || !variant.label) return product.name
  return `${product.name} - ${variant.label}`
}

export function resolveLine(
  catalog: OrderCatalogProduct[],
  line: { name?: string; sku?: string; externalVariantId?: string }
): LineMatch | null {
  const sku = norm(line.sku)
  if (sku) {
    for (const product of catalog) {
      const variant = product.variants.find((v) => norm(v.sku) === sku)
      if (variant) return { product, variant }
    }
  }

  const { base, label } = splitLineName(line.name)
  if (line.externalVariantId) {
    for (const product of catalog) {
      const variant = product.variants.find((v) => v.externalVariantId === line.externalVariantId)
      if (variant && (!base || norm(base) === norm(product.name) || norm(line.name) === norm(product.name))) {
        return { product, variant }
      }
    }
  }

  const byName = (n: string) => catalog.filter((p) => norm(p.name) === norm(n))
  const candidates = base ? byName(base) : []
  if (candidates.length === 1) {
    const product = candidates[0]
    const variant = product.variants.length === 1
      ? product.variants[0]
      : product.variants.find((v) => label && norm(v.label) === norm(label)) ?? null
    return { product, variant }
  }
  // The whole name is the product name (product names may contain " - " themselves).
  const whole = byName(line.name ?? '')
  if (whole.length === 1) {
    const product = whole[0]
    return { product, variant: product.variants.length === 1 ? product.variants[0] : null }
  }
  return null
}
