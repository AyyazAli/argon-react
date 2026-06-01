import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import penhouseLogo from '@/assets/penhouse-logo.png'
import type { Order } from '@/types'

// A4 = 595 x 842 pts
// Page paddingVertical: 6  →  available height = 842 - 12 = 830
// 3 labels × 245 + 3 gaps × 5 = 735 + 15 = 750  ← well within 830
const LABEL_H = 245

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  label: {
    height: LABEL_H,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    marginBottom: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'column',
  },
  // ── Header row ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
  },
  logo: {
    width: 75,
    height: 24,
    objectFit: 'contain',
  },
  businessName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: '#111827',
  },
  // ── Data rows ──
  dataRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  fieldLabel: {
    width: 78,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  fieldValue: {
    flex: 1,
    fontSize: 8,
    color: '#111827',
    flexWrap: 'wrap',
  },
  cnValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: 4,
  },
})

// Build the same description string used by Trax / Leopard
function buildDescription(order: Order): { description: string; quantity: number } {
  let description = ''
  let quantity = 0

  order.products.forEach((p) => {
    quantity += p.qty
    description += `[ ${p.name.substring(0, 30)} `
    if (p.nameToPrint) {
      description += `( ${p.nameToPrint}`
      description += p.nameOnOtherSide ? ` Other Side ${p.nameOnOtherSide} )` : ` )`
    }
    if (p.size)        description += `, Size: ${p.size}`
    if (p.color)       description += `, color: ${p.color}`
    if (p.mobileModel) description += `, model: ${p.mobileModel}`
    if (p.refills)     description += p.refills
    if (p.giftWrap === 'Premium Gift Wrap')             description += ', P Wrap'
    else if (p.giftWrap === ' Normal Gift Wrap')        description += ', N Wrap'
    else if (p.giftWrap === 'Luxury Feather Gift Wrap') description += ', LF Wrap'
    description += ' ]'
  })

  return { description, quantity }
}

interface LabelProps {
  order: Order
  businessName: string
}

function Label({ order, businessName }: LabelProps) {
  const { description, quantity } = buildDescription(order)
  const customerName = `${order.billing.first_name} ${order.billing.last_name}`

  return (
    <View style={s.label}>
      {/* Header: logo (left) + business name (right) */}
      <View style={s.headerRow}>
        <Image src={penhouseLogo} style={s.logo} />
        <Text style={s.businessName}>{businessName.toUpperCase()}</Text>
      </View>

      {/* Data rows */}
      <View style={s.dataRow}>
        <Text style={s.fieldLabel}>From:</Text>
        <Text style={s.fieldValue}>{businessName.toUpperCase()}</Text>
      </View>

      <View style={s.dataRow}>
        <Text style={s.fieldLabel}>To:</Text>
        <Text style={s.fieldValue}>{customerName}</Text>
      </View>

      <View style={s.dataRow}>
        <Text style={s.fieldLabel}>Contact:</Text>
        <Text style={s.fieldValue}>{order.billing.phone}</Text>
      </View>

      <View style={s.dataRow}>
        <Text style={s.fieldLabel}>Address:</Text>
        <Text style={s.fieldValue}>{order.billing.address}</Text>
      </View>

      <View style={s.dataRow}>
        <Text style={s.fieldLabel}>City:</Text>
        <Text style={s.fieldValue}>{order.billing.city}</Text>
      </View>

      <View style={s.divider} />

      <View style={s.dataRow}>
        <Text style={s.fieldLabel}>CN:</Text>
        <Text style={s.cnValue}>{order.cn ?? order.orderId}</Text>
      </View>

      <View style={s.dataRow}>
        <Text style={s.fieldLabel}>Description:</Text>
        <Text style={s.fieldValue}>{description || '—'}</Text>
      </View>

      <View style={s.dataRow}>
        <Text style={s.fieldLabel}>Pieces:</Text>
        <Text style={s.fieldValue}>{quantity}</Text>
      </View>
    </View>
  )
}

interface ManualBookingLabelsProps {
  orders: Order[]
  businessName: string
}

export function ManualBookingLabels({ orders, businessName }: ManualBookingLabelsProps) {
  // Split orders into pages of 3
  const pages: Order[][] = []
  for (let i = 0; i < orders.length; i += 3) {
    pages.push(orders.slice(i, i + 3))
  }

  return (
    <Document title="Manual Booking Labels">
      {pages.map((pageOrders, pageIndex) => (
        <Page key={pageIndex} size="A4" style={s.page}>
          {pageOrders.map((order) => (
            <Label key={order._id} order={order} businessName={businessName} />
          ))}
        </Page>
      ))}
    </Document>
  )
}
