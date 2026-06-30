import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "@react-pdf/renderer";
import type {
  BulkQuotation,
  BulkInvoice,
  BulkCustomer,
  BulkBankAccount,
} from "@/types";
import penhouseLogo from "@/assets/penhouse-logo.png";
import stampImage from "@/assets/Stemp.png";

// Modern Styles - Red & Black Theme
const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    position: "relative",
    // Reserve space for the fixed header/footer on EVERY page so flowing
    // content (and page 2+) never overlaps them.
    paddingTop: 150,
    paddingBottom: 100,
  },
  // Watermark - very light text behind content, diagonal
  watermarkWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  watermarkText: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#000000",
    opacity: 0.02,
    letterSpacing: 10,
    transform: "rotate(-45deg)",
  },
  // Stamp image — flows at the end of the content, right-aligned, so it
  // appears exactly once at the true end of the document (last page only).
  stampContainer: {
    alignItems: "flex-end",
    marginTop: 12,
    marginBottom: 4,
    paddingRight: 5,
    zIndex: 2,
  },
  stampImage: {
    width: 140,
    height: 70,
    objectFit: "contain",
    opacity: 0.9,
  },
  // Modern Header with curve — pinned to the top of every page (fixed)
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 1,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 25,
    paddingHorizontal: 40,
  },
  logoContainer: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: "#f0f0f0",
    marginTop: 15,
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: "contain",
  },
  headerRight: {
    textAlign: "right",
    alignItems: "flex-end",
    paddingTop: 8,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    padding: 12,
    borderRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: 2,
  },
  documentNumber: {
    fontSize: 12,
    color: "#ffffff",
  },
  dateText: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 10,
  },
  // Body content
  bodyContent: {
    paddingHorizontal: 40,
    zIndex: 1,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  customerCard: {
    backgroundColor: "transparent",
    padding: 0,
    marginBottom: 5,
  },
  twoColumnRow: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-start",
  },
  customerColumn: {
    width: "55%",
  },
  docDetailsColumn: {
    width: "45%",
  },
  columnHeading: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  docDetailRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  docDetailLabel: {
    width: 90,
    color: "#6b7280",
    fontSize: 9,
  },
  docDetailValue: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 9,
    color: "#171717",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 100,
    color: "#6b7280",
    fontSize: 9,
  },
  value: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 9,
    color: "#171717",
  },
  // Modern Table
  table: {
    marginTop: 8,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#000000",
    padding: 10,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 9,
    backgroundColor: "#ffffff",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    fontSize: 9,
    color: "#262626",
  },
  colName: { width: "30%" },
  colDesc: { width: "30%" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  // Modern Totals Section
  totalsSection: {
    marginTop: 15,
    marginLeft: "auto",
    width: 250,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#000000",
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  // Modern Footer
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  footerBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContent: {
    position: "absolute",
    bottom: 8,
    left: 40,
    right: 40,
    flexDirection: "column",
    alignItems: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 6,
  },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#ffffff",
    opacity: 0.3,
    marginVertical: 6,
  },
  footerContactContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "flex-start",
  },
  footerContactColumn: {
    flexDirection: "column",
    flex: 1,
    alignItems: "flex-start",
  },
  footerContactColumnCenter: {
    flexDirection: "column",
    flex: 1,
    alignItems: "center",
  },
  footerContactColumnRight: {
    flexDirection: "column",
    flex: 1,
    alignItems: "flex-end",
  },
  footerContactLabel: {
    fontSize: 7,
    color: "#d1d5db",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  footerContactValue: {
    fontSize: 9,
    color: "#ffffff",
    fontWeight: "bold",
  },
  // Notes styling - compact
  notes: {
    marginTop: 6,
    padding: 6,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#dc2626",
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#000000",
  },
  notesText: {
    fontSize: 8,
    color: "#4b5563",
    lineHeight: 1.3,
  },
  validUntil: {
    marginTop: 8,
    fontSize: 9,
    color: "#000000",
    fontWeight: "bold",
    backgroundColor: "#fef2f2",
    padding: 6,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#dc2626",
  },
  bottomNote: {
    marginTop: 8,
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#dc2626",
  },
  bottomNoteTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#000000",
  },
  bottomNoteText: {
    fontSize: 8,
    color: "#262626",
    lineHeight: 1.3,
  },
  // Bank account - compact, does not take whole area
  bankAccountSection: {
    marginBottom: 4,
    maxWidth: 280,
  },
  bankAccountCard: {
    marginBottom: 4,
    padding: 4,
    backgroundColor: "#f9fafb",
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: "#dc2626",
  },
  bankAccountRow: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bankAccountLabel: {
    width: 72,
    color: "#6b7280",
    fontSize: 7,
  },
  bankAccountValue: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 7,
    color: "#171717",
  },
  bottomTwoColumns: {
    flexDirection: "row",
    marginTop: 6,
    alignItems: "flex-start",
  },
  bottomLeftColumn: {
    width: "50%",
    paddingRight: 8,
  },
  bottomRightColumn: {
    width: "50%",
    paddingLeft: 8,
  },
  taxExclusiveNote: {
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic",
  },
  taxExclusiveRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
});

// Header curve component - True black with red accent and upward wave for logo
const HeaderCurve = () => (
  <Svg viewBox="0 0 595 150" style={{ width: 595, height: 150 }}>
    <Defs>
      <LinearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#000000" />
        <Stop offset="50%" stopColor="#171717" />
        <Stop offset="100%" stopColor="#262626" />
      </LinearGradient>
    </Defs>
    {/* Main black background with upward curve on left for logo */}
    <Path
      d="M0 0 L595 0 L595 90 Q450 120 297.5 100 Q145 80 0 65 L0 0 Z"
      fill="url(#headerGradient)"
    />
    {/* Red accent stripe at bottom */}
    <Path
      d="M0 65 Q100 50 200 70 Q300 90 400 75 Q500 60 595 85 L595 90 Q450 120 297.5 100 Q145 80 0 65 Z"
      fill="#dc2626"
      opacity="0.8"
    />
    {/* Subtle highlight wave */}
    <Path
      d="M0 40 Q100 30 200 45 Q300 60 400 50 Q500 40 595 55"
      fill="none"
      stroke="#525252"
      strokeWidth="1"
      opacity="0.3"
    />
  </Svg>
);

// Footer curve component - True black with red accent
const FooterCurve = () => (
  <Svg viewBox="0 0 595 100" style={{ width: 595, height: 100 }}>
    <Defs>
      <LinearGradient id="footerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#262626" />
        <Stop offset="50%" stopColor="#171717" />
        <Stop offset="100%" stopColor="#000000" />
      </LinearGradient>
    </Defs>
    {/* Top wave */}
    <Path
      d="M0 25 Q150 5 297.5 15 Q445 25 595 10 L595 100 L0 100 Z"
      fill="url(#footerGradient)"
    />
    {/* Red accent wave */}
    <Path
      d="M0 25 Q150 5 297.5 15 Q445 25 595 10 L595 20 Q445 35 297.5 25 Q150 15 0 35 Z"
      fill="#dc2626"
      opacity="0.8"
    />
    {/* Subtle highlight line */}
    <Path
      d="M0 30 Q150 10 297.5 20 Q445 30 595 15"
      fill="none"
      stroke="#525252"
      strokeWidth="1"
      opacity="0.3"
    />
  </Svg>
);

const DEFAULT_BOTTOM_NOTE = `For this job 7-10 working day required after final approval.
70% Advance Payment is required for order proceeding
30% on order completion`;

const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Quotation PDF Component
export function QuotationPDF({ quotation }: { quotation: BulkQuotation }) {
  const customer = quotation.customer as BulkCustomer;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark - very light PENHOUSE behind content */}
        <View style={styles.watermarkWrapper} fixed>
          <Text style={styles.watermarkText}>PENHOUSE</Text>
        </View>

        {/* Modern Header with Curve - repeats on every page */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerBackground}>
            <HeaderCurve />
          </View>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image src={penhouseLogo} style={styles.logo} />
            </View>
            <View>
              <Text style={styles.title}>QUOTATION</Text>
            </View>
          </View>
        </View>

        {/* Body Content */}
        <View style={styles.bodyContent}>
          {/* Customer (left) + Document Details (right) - 2 columns */}
          <View style={styles.twoColumnRow}>
            <View style={styles.customerColumn}>
              <Text style={styles.columnHeading}>Bill To</Text>
              <View style={styles.customerCard}>
                <View style={styles.row}>
                  <Text style={styles.label}>Company:</Text>
                  <Text style={styles.value}>{customer?.companyName}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Contact:</Text>
                  <Text style={styles.value}>{customer?.contactName}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{customer?.phone}</Text>
                </View>
                {customer?.email && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{customer.email}</Text>
                  </View>
                )}
                {customer?.address && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>
                      {customer.address}
                      {customer.city ? `, ${customer.city}` : ""}
                    </Text>
                  </View>
                )}
                {customer?.ntn && (
                  <View style={styles.row}>
                    <Text style={styles.label}>NTN:</Text>
                    <Text style={styles.value}>{customer.ntn}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.docDetailsColumn}>
              <View style={styles.docDetailRow}>
                <Text style={styles.docDetailLabel}>Quotation No:</Text>
                <Text style={styles.docDetailValue}>
                  {quotation.quotationNumber}
                </Text>
              </View>
              <View style={styles.docDetailRow}>
                <Text style={styles.docDetailLabel}>Date:</Text>
                <Text style={styles.docDetailValue}>
                  {formatDate(quotation.dateCreated)}
                </Text>
              </View>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ITEMS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader} fixed>
                <Text style={[styles.tableHeaderCell, styles.colName]}>
                  Item
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                  Description
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>
                  Unit Price
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colTotal]}>
                  Total
                </Text>
              </View>
              {quotation.items.map((item, index) => (
                <View
                  key={index}
                  wrap={false}
                  style={[
                    styles.tableRow,
                    ...(index % 2 === 1 ? [styles.tableRowAlt] : []),
                  ]}
                >
                  <Text style={[styles.tableCell, styles.colName]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDesc]}>
                    {item.description || "-"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colQty]}>
                    {item.quantity}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    {formatCurrency(item.unitPrice)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totalsSection} wrap={false}>
            <View style={styles.totalRow}>
              <Text>Subtotal:</Text>
              <Text style={{ fontWeight: "bold" }}>
                {formatCurrency(quotation.subtotal)}
              </Text>
            </View>
            {quotation.deliveryAmount > 0 && (
              <View style={styles.totalRow}>
                <Text>Delivery Amount:</Text>
                <Text style={{ fontWeight: "bold" }}>
                  {formatCurrency(quotation.deliveryAmount)}
                </Text>
              </View>
            )}
            {quotation.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text>Discount:</Text>
                <Text style={{ fontWeight: "bold", color: "#059669" }}>
                  -{formatCurrency(quotation.discountAmount)}
                </Text>
              </View>
            )}
            {quotation.taxPercent > 0 && (
              <View style={styles.totalRow}>
                <Text>Tax ({quotation.taxPercent}%):</Text>
                <Text style={{ fontWeight: "bold" }}>
                  {formatCurrency(quotation.taxAmount)}
                </Text>
              </View>
            )}
            {(!quotation.taxPercent || quotation.taxPercent === 0) && (
              <View style={styles.taxExclusiveRow}>
                <Text style={styles.taxExclusiveNote}>
                  * Prices are exclusive of tax
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(quotation.grandTotal)}
              </Text>
            </View>
          </View>

          {/* Valid Until */}
          {quotation.validUntil && (
            <Text style={styles.validUntil}>
              Valid Until: {formatDate(quotation.validUntil)}
            </Text>
          )}

          {/* Notes */}
          {quotation.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>Notes:</Text>
              <Text style={styles.notesText}>{quotation.notes}</Text>
            </View>
          )}

          {/* Bottom Note - at bottom, editable content */}
          <View style={styles.bottomNote}>
            <Text style={styles.bottomNoteTitle}>Note:</Text>
            <Text style={styles.bottomNoteText}>
              {quotation.bottomNote ?? DEFAULT_BOTTOM_NOTE}
            </Text>
          </View>

          {/* Stamp - flows as the last block, so it lands once at the
              very end of the document (last page only) */}
          <View style={styles.stampContainer} wrap={false}>
            <Image src={stampImage} style={styles.stampImage} />
          </View>
        </View>

        {/* Modern Footer with Curve - repeats on every page */}
        <View style={styles.footerContainer} fixed>
          <View style={styles.footerBackground}>
            <FooterCurve />
          </View>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Thank you for your business! This quotation is valid for the
              period mentioned above.
            </Text>
            <View style={styles.footerDivider} />
            <View style={styles.footerContactContainer}>
              <View style={styles.footerContactColumn}>
                <Text style={styles.footerContactLabel}>Phone</Text>
                <Text style={styles.footerContactValue}>0316-0470401</Text>
              </View>
              <View style={styles.footerContactColumnCenter}>
                <Text style={styles.footerContactLabel}>Email</Text>
                <Text style={styles.footerContactValue}>
                  penhouse.pk@gmail.com
                </Text>
              </View>
              <View style={styles.footerContactColumnRight}>
                <Text style={styles.footerContactLabel}>Address</Text>
                <Text
                  style={[styles.footerContactValue, { fontSize: 8, textAlign: "right" }]}
                >
                  Office no 2, first floor,{"\n"}Al Ghani Plaza, Chowk
                  Chauburji,{"\n"}Lahore
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Invoice PDF Component
export function InvoicePDF({ invoice }: { invoice: BulkInvoice }) {
  const customer = invoice.customer as BulkCustomer;
  const quotation = invoice.quotation as BulkQuotation;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark - very light PENHOUSE behind content */}
        <View style={styles.watermarkWrapper} fixed>
          <Text style={styles.watermarkText}>PENHOUSE</Text>
        </View>

        {/* Modern Header with Curve - repeats on every page */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerBackground}>
            <HeaderCurve />
          </View>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image src={penhouseLogo} style={styles.logo} />
            </View>
            <View>
              <Text style={styles.title}>INVOICE</Text>
            </View>
          </View>
        </View>

        {/* Body Content */}
        <View style={styles.bodyContent}>
          {/* Customer (left) + Document Details (right) - 2 columns */}
          <View style={styles.twoColumnRow}>
            <View style={styles.customerColumn}>
              <Text style={styles.columnHeading}>Bill To</Text>
              <View style={styles.customerCard}>
                <View style={styles.row}>
                  <Text style={styles.label}>Company:</Text>
                  <Text style={styles.value}>{customer?.companyName}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Contact:</Text>
                  <Text style={styles.value}>{customer?.contactName}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{customer?.phone}</Text>
                </View>
                {customer?.email && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{customer.email}</Text>
                  </View>
                )}
                {customer?.address && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>
                      {customer.address}
                      {customer.city ? `, ${customer.city}` : ""}
                    </Text>
                  </View>
                )}
                {customer?.ntn && (
                  <View style={styles.row}>
                    <Text style={styles.label}>NTN:</Text>
                    <Text style={styles.value}>{customer.ntn}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.docDetailsColumn}>
              <View style={styles.docDetailRow}>
                <Text style={styles.docDetailLabel}>Invoice No:</Text>
                <Text style={styles.docDetailValue}>{invoice.invoiceNumber}</Text>
              </View>
              <View style={styles.docDetailRow}>
                <Text style={styles.docDetailLabel}>Date:</Text>
                <Text style={styles.docDetailValue}>
                  {formatDate(invoice.dateCreated)}
                </Text>
              </View>
              {quotation?.quotationNumber && (
                <View style={styles.docDetailRow}>
                  <Text style={styles.docDetailLabel}>Ref:</Text>
                  <Text style={styles.docDetailValue}>
                    {quotation.quotationNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Payment Info */}
          {(invoice.paymentTerms || invoice.dueDate) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
              <View style={{ paddingLeft: 0 }}>
                {invoice.paymentTerms && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Terms:</Text>
                    <Text style={styles.value}>{invoice.paymentTerms}</Text>
                  </View>
                )}
                {invoice.dueDate && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Due Date:</Text>
                    <Text style={[styles.value, { color: "#171717" }]}>
                      {formatDate(invoice.dueDate)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Items Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ITEMS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader} fixed>
                <Text style={[styles.tableHeaderCell, styles.colName]}>
                  Item
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                  Description
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>
                  Unit Price
                </Text>
                <Text style={[styles.tableHeaderCell, styles.colTotal]}>
                  Total
                </Text>
              </View>
              {invoice.items.map((item, index) => (
                <View
                  key={index}
                  wrap={false}
                  style={[
                    styles.tableRow,
                    ...(index % 2 === 1 ? [styles.tableRowAlt] : []),
                  ]}
                >
                  <Text style={[styles.tableCell, styles.colName]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDesc]}>
                    {item.description || "-"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colQty]}>
                    {item.quantity}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    {formatCurrency(item.unitPrice)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totalsSection} wrap={false}>
            <View style={styles.totalRow}>
              <Text>Subtotal:</Text>
              <Text style={{ fontWeight: "bold" }}>
                {formatCurrency(invoice.subtotal)}
              </Text>
            </View>
            {invoice.deliveryAmount > 0 && (
              <View style={styles.totalRow}>
                <Text>Delivery Amount:</Text>
                <Text style={{ fontWeight: "bold" }}>
                  {formatCurrency(invoice.deliveryAmount)}
                </Text>
              </View>
            )}
            {invoice.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text>Discount:</Text>
                <Text style={{ fontWeight: "bold", color: "#059669" }}>
                  -{formatCurrency(invoice.discountAmount)}
                </Text>
              </View>
            )}
            {invoice.taxPercent > 0 && (
              <View style={styles.totalRow}>
                <Text>Tax ({invoice.taxPercent}%):</Text>
                <Text style={{ fontWeight: "bold" }}>
                  {formatCurrency(invoice.taxAmount)}
                </Text>
              </View>
            )}
            {(!invoice.taxPercent || invoice.taxPercent === 0) && (
              <View style={styles.taxExclusiveRow}>
                <Text style={styles.taxExclusiveNote}>
                  * Prices are exclusive of tax
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={{ color: "#171717", fontWeight: "bold" }}>
                Grand Total:
              </Text>
              <Text style={{ color: "#171717", fontWeight: "bold" }}>
                {formatCurrency(invoice.grandTotal)}
              </Text>
            </View>
            {invoice.advanceAmount && invoice.advanceAmount > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={{ color: "#059669" }}>Advance Amount:</Text>
                  <Text style={{ color: "#059669", fontWeight: "bold" }}>
                    -{formatCurrency(invoice.advanceAmount)}
                  </Text>
                </View>
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>Amount to Pay:</Text>
                  <Text style={styles.grandTotalValue}>
                    {formatCurrency(invoice.grandTotal - invoice.advanceAmount)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Notes - compact */}
          {invoice.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>Notes:</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Bank Accounts - compact, does not take whole area */}
          {invoice.bankAccounts &&
            Array.isArray(invoice.bankAccounts) &&
            invoice.bankAccounts.length > 0 && (
              <View style={styles.bankAccountSection}>
                <Text style={[styles.sectionTitle, { marginBottom: 2, fontSize: 9 }]}>
                  BANK ACCOUNT DETAILS
                </Text>
                {(invoice.bankAccounts as BulkBankAccount[]).map(
                  (account, index) => (
                    <View key={index} style={styles.bankAccountCard}>
                      <View style={styles.bankAccountRow}>
                        <Text style={styles.bankAccountLabel}>Bank:</Text>
                        <Text style={styles.bankAccountValue}>
                          {account.bankName}
                        </Text>
                      </View>
                      <View style={styles.bankAccountRow}>
                        <Text style={styles.bankAccountLabel}>
                          Account Title:
                        </Text>
                        <Text style={styles.bankAccountValue}>
                          {account.accountTitle}
                        </Text>
                      </View>
                      <View style={styles.bankAccountRow}>
                        <Text style={styles.bankAccountLabel}>
                          Account Number:
                        </Text>
                        <Text style={styles.bankAccountValue}>
                          {account.accountNumber}
                        </Text>
                      </View>
                      {account.iban && (
                        <View style={styles.bankAccountRow}>
                          <Text style={styles.bankAccountLabel}>IBAN:</Text>
                          <Text style={styles.bankAccountValue}>
                            {account.iban}
                          </Text>
                        </View>
                      )}
                      {account.branch && (
                        <View style={styles.bankAccountRow}>
                          <Text style={styles.bankAccountLabel}>Branch:</Text>
                          <Text style={styles.bankAccountValue}>
                            {account.branch}
                          </Text>
                        </View>
                      )}
                      {account.swiftCode && (
                        <View style={styles.bankAccountRow}>
                          <Text style={styles.bankAccountLabel}>
                            SWIFT Code:
                          </Text>
                          <Text style={styles.bankAccountValue}>
                            {account.swiftCode}
                          </Text>
                        </View>
                      )}
                    </View>
                  )
                )}
              </View>
            )}

          {/* Bottom Note - last content block before footer */}
          <View style={styles.bottomNote}>
            <Text style={styles.bottomNoteTitle}>Note:</Text>
            <Text style={styles.bottomNoteText}>
              {invoice.bottomNote ?? quotation?.bottomNote ?? DEFAULT_BOTTOM_NOTE}
            </Text>
          </View>

          {/* Stamp - flows as the last block, so it lands once at the
              very end of the document (last page only) */}
          <View style={styles.stampContainer} wrap={false}>
            <Image src={stampImage} style={styles.stampImage} />
          </View>
        </View>

        {/* Modern Footer with Curve - repeats on every page */}
        <View style={styles.footerContainer} fixed>
          <View style={styles.footerBackground}>
            <FooterCurve />
          </View>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Thank you for your business! Please make payment by the due date.
            </Text>
            <View style={styles.footerDivider} />
            <View style={styles.footerContactContainer}>
              <View style={styles.footerContactColumn}>
                <Text style={styles.footerContactLabel}>Phone</Text>
                <Text style={styles.footerContactValue}>0316-0470401</Text>
              </View>
              <View style={styles.footerContactColumnCenter}>
                <Text style={styles.footerContactLabel}>Email</Text>
                <Text style={styles.footerContactValue}>
                  penhouse.pk@gmail.com
                </Text>
              </View>
              <View style={styles.footerContactColumnRight}>
                <Text style={styles.footerContactLabel}>Address</Text>
                <Text
                  style={[styles.footerContactValue, { fontSize: 8, textAlign: "right" }]}
                >
                  Office no 2, first floor,{"\n"}Al Ghani Plaza, Chowk
                  Chauburji,{"\n"}Lahore
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
