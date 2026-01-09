import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type {
  BulkQuotation,
  BulkInvoice,
  BulkCustomer,
  BulkBankAccount,
} from "@/types";
import penhouseLogo from "@/assets/penhouse-logo.png";

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: "contain",
  },
  headerRight: {
    textAlign: "right",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 4,
  },
  documentNumber: {
    fontSize: 12,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fecaca",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 100,
    color: "#666",
  },
  value: {
    flex: 1,
    fontWeight: "bold",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#dc2626",
    padding: 8,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    padding: 8,
  },
  tableRowAlt: {
    backgroundColor: "#f8f8f8",
  },
  tableCell: {
    fontSize: 9,
  },
  colName: { width: "25%" },
  colDesc: { width: "25%" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "15%", textAlign: "right" },
  colDisc: { width: "10%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  totalsSection: {
    marginTop: 20,
    marginLeft: "auto",
    width: 250,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#dc2626",
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
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerText: {
    fontSize: 8,
    color: "#666",
    textAlign: "center",
  },
  notes: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#666",
  },
  validUntil: {
    marginTop: 10,
    fontSize: 10,
    color: "#e74c3c",
    fontWeight: "bold",
  },
  bottomNote: {
    position: "absolute",
    bottom: 40,
    left: 40,
    width: 300,
    fontSize: 9,
    paddingBottom: 20,
    color: "#666",
    lineHeight: 1.5,
  },
  bottomNoteTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  taxExclusiveNote: {
    fontSize: 9,
    color: "#666",
    fontStyle: "italic",
  },
  taxExclusiveRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
});

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
        {/* Header */}
        <View style={styles.header}>
          <Image src={penhouseLogo} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.title}>QUOTATION</Text>
            <Text style={styles.documentNumber}>
              {quotation.quotationNumber}
            </Text>
            <Text style={{ marginTop: 8, color: "#666" }}>
              Date: {formatDate(quotation.dateCreated)}
            </Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
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

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colName]}>Item</Text>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>
                Unit Price
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colDisc]}>
                Disc %
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>
                Total
              </Text>
            </View>
            {quotation.items.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowAlt : undefined,
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
                <Text style={[styles.tableCell, styles.colDisc]}>
                  {item.discountPercent}%
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(quotation.subtotal)}</Text>
          </View>
          {quotation.deliveryAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Delivery Amount:</Text>
              <Text>{formatCurrency(quotation.deliveryAmount)}</Text>
            </View>
          )}
          {quotation.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-{formatCurrency(quotation.discountAmount)}</Text>
            </View>
          )}
          {quotation.taxPercent > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax ({quotation.taxPercent}%):</Text>
              <Text>{formatCurrency(quotation.taxAmount)}</Text>
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

        {/* Bottom Left Note */}
        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteTitle}>Note:</Text>
          <Text>
            For this job 7-10 working day required after final approval.
            {"\n"}
            70% Advance Payment is required for order proceeding
            {"\n"}
            30% on order completion
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business! This quotation is valid for the period
            mentioned above.
          </Text>
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
        {/* Header */}
        <View style={styles.header}>
          <Image src={penhouseLogo} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.documentNumber}>{invoice.invoiceNumber}</Text>
            <Text style={{ marginTop: 8, color: "#666" }}>
              Date: {formatDate(invoice.dateCreated)}
            </Text>
            {quotation?.quotationNumber && (
              <Text style={{ marginTop: 4, color: "#666", fontSize: 9 }}>
                Ref: {quotation.quotationNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
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

        {/* Payment Info */}
        {(invoice.paymentTerms || invoice.dueDate) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            {invoice.paymentTerms && (
              <View style={styles.row}>
                <Text style={styles.label}>Terms:</Text>
                <Text style={styles.value}>{invoice.paymentTerms}</Text>
              </View>
            )}
            {invoice.dueDate && (
              <View style={styles.row}>
                <Text style={styles.label}>Due Date:</Text>
                <Text style={[styles.value, { color: "#e74c3c" }]}>
                  {formatDate(invoice.dueDate)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colName]}>Item</Text>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>
                Unit Price
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colDisc]}>
                Disc %
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>
                Total
              </Text>
            </View>
            {invoice.items.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowAlt : undefined,
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
                <Text style={[styles.tableCell, styles.colDisc]}>
                  {item.discountPercent}%
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.deliveryAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Delivery Amount:</Text>
              <Text>{formatCurrency(invoice.deliveryAmount)}</Text>
            </View>
          )}
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-{formatCurrency(invoice.discountAmount)}</Text>
            </View>
          )}
          {invoice.taxPercent > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax ({invoice.taxPercent}%):</Text>
              <Text>{formatCurrency(invoice.taxAmount)}</Text>
            </View>
          )}
          {(!invoice.taxPercent || invoice.taxPercent === 0) && (
            <View style={styles.taxExclusiveRow}>
              <Text style={styles.taxExclusiveNote}>
                * Prices are exclusive of tax
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Amount Due:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.grandTotal)}
            </Text>
          </View>
        </View>

        {/* Bank Accounts */}
        {invoice.bankAccounts &&
          Array.isArray(invoice.bankAccounts) &&
          invoice.bankAccounts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bank Account Details</Text>
              {(invoice.bankAccounts as BulkBankAccount[]).map(
                (account, index) => (
                  <View
                    key={index}
                    style={{
                      marginBottom: 12,
                      padding: 8,
                      backgroundColor: "#fef2f2",
                      borderRadius: 4,
                    }}
                  >
                    <View style={styles.row}>
                      <Text style={styles.label}>Bank:</Text>
                      <Text style={styles.value}>{account.bankName}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Account Title:</Text>
                      <Text style={styles.value}>{account.accountTitle}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Account Number:</Text>
                      <Text style={styles.value}>{account.accountNumber}</Text>
                    </View>
                    {account.iban && (
                      <View style={styles.row}>
                        <Text style={styles.label}>IBAN:</Text>
                        <Text style={styles.value}>{account.iban}</Text>
                      </View>
                    )}
                    {account.branch && (
                      <View style={styles.row}>
                        <Text style={styles.label}>Branch:</Text>
                        <Text style={styles.value}>{account.branch}</Text>
                      </View>
                    )}
                    {account.swiftCode && (
                      <View style={styles.row}>
                        <Text style={styles.label}>SWIFT Code:</Text>
                        <Text style={styles.value}>{account.swiftCode}</Text>
                      </View>
                    )}
                  </View>
                )
              )}
            </View>
          )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Bottom Left Note */}
        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteTitle}>Note:</Text>
          <Text>
            For this job 7-10 working day required after final approval.
            {"\n"}
            70% Advance Payment is required for order proceeding
            {"\n"}
            30% on order completion
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business! Please make payment by the due date.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
