import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { LabelGrid, LabelItem, LabelCodeType } from '@/types'

const MM = 72 / 25.4 // PDF points per millimetre

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', position: 'relative' },
  label: { position: 'absolute', overflow: 'hidden' },
  name: { fontFamily: 'Helvetica', color: '#111111' },
  attrs: { fontFamily: 'Helvetica', color: '#555555' },
  sku: { fontFamily: 'Helvetica-Bold', color: '#000000' },
})

interface LabelSheetPDFProps {
  grid: LabelGrid
  items: LabelItem[]
  codeType: LabelCodeType
  /** Skip this many cells on the first sheet (partially used label sheets). */
  startOffset?: number
}

/**
 * A4 label sheet. Labels are absolutely positioned from the grid definition
 * (mm) so a printed sheet lines up with the physical stickers at 100% scale.
 *
 * Layouts by code type:
 *  - both:    QR on the left; name / attributes / bold SKU / Code 128 strip on the right
 *  - qr:      QR on the left; name / attributes / bold SKU on the right (larger text)
 *  - barcode: name / attributes on top, Code 128 across the full width, SKU beneath
 */
export function LabelSheetPDF({ grid, items, codeType, startOffset = 0 }: LabelSheetPDFProps) {
  const perPage = grid.columns * grid.rows
  const offset = Math.max(0, Math.min(startOffset, perPage - 1))
  const cells: Array<LabelItem | null> = [...Array<null>(offset).fill(null), ...items]
  const pages: Array<Array<LabelItem | null>> = []
  for (let i = 0; i < cells.length; i += perPage) pages.push(cells.slice(i, i + perPage))
  if (pages.length === 0) pages.push([])

  const w = grid.labelWidth * MM
  const h = grid.labelHeight * MM
  const pad = 1.2 * MM
  const small = grid.labelHeight < 28
  const nameSize = small ? 5.5 : 7.5
  const attrSize = small ? 4.8 : 6.5
  const skuSize = small ? 6.5 : 9

  const renderCell = (item: LabelItem) => {
    if (codeType === 'barcode') {
      const barcodeHeight = small ? 7 * MM : 11 * MM
      return (
        <View style={{ position: 'absolute', left: pad, top: pad, width: w - pad * 2, height: h - pad * 2, flexDirection: 'column', justifyContent: 'space-between' }}>
          <View>
            <Text style={[styles.name, { fontSize: nameSize, maxLines: 1 }]}>{item.productName}</Text>
            {item.attributes ? <Text style={[styles.attrs, { fontSize: attrSize, maxLines: 1 }]}>{item.attributes}</Text> : null}
          </View>
          {item.barcodeDataUrl ? (
            <Image src={item.barcodeDataUrl} style={{ width: w - pad * 2, height: barcodeHeight, objectFit: 'fill' }} />
          ) : null}
          <Text style={[styles.sku, { fontSize: skuSize, maxLines: 1, textAlign: 'center' }]}>{item.sku}</Text>
        </View>
      )
    }

    const qrSide = h - pad * 2
    const textLeft = qrSide + pad * 1.5
    const textWidth = w - textLeft - pad
    const barcodeHeight = small ? 4.5 * MM : 7 * MM
    return (
      <>
        {item.qrDataUrl ? (
          <Image src={item.qrDataUrl} style={{ position: 'absolute', left: pad, top: pad, width: qrSide, height: qrSide }} />
        ) : null}
        <View style={{ position: 'absolute', left: textLeft, top: pad, width: textWidth, height: h - pad * 2, flexDirection: 'column', justifyContent: 'space-between' }}>
          <View>
            <Text style={[styles.name, { fontSize: codeType === 'qr' ? nameSize + 1 : nameSize, maxLines: small ? 1 : 2 }]}>{item.productName}</Text>
            {item.attributes ? <Text style={[styles.attrs, { fontSize: attrSize, maxLines: codeType === 'qr' && !small ? 2 : 1 }]}>{item.attributes}</Text> : null}
          </View>
          <View>
            <Text style={[styles.sku, { fontSize: codeType === 'qr' ? skuSize + 1.5 : skuSize, maxLines: 1 }]}>{item.sku}</Text>
            {codeType === 'both' && item.barcodeDataUrl ? (
              <Image src={item.barcodeDataUrl} style={{ width: textWidth, height: barcodeHeight, objectFit: 'fill' }} />
            ) : null}
          </View>
        </View>
      </>
    )
  }

  return (
    <Document title="Inventory labels">
      {pages.map((pageCells, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {pageCells.map((item, index) => {
            if (!item) return null
            const col = index % grid.columns
            const row = Math.floor(index / grid.columns)
            const left = (grid.marginLeft + col * (grid.labelWidth + grid.gapX)) * MM
            const top = (grid.marginTop + row * (grid.labelHeight + grid.gapY)) * MM
            return (
              <View key={index} style={[styles.label, { left, top, width: w, height: h }]}>
                {renderCell(item)}
              </View>
            )
          })}
        </Page>
      ))}
    </Document>
  )
}
