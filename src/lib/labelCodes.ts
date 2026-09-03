import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

/**
 * Both codes encode the plain SKU: a keyboard-wedge scanner then types exactly
 * the lookup key, a phone camera decodes the same string, and a human can type
 * it when the label is damaged.
 */

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 0,
      scale: 8,
    })
  } catch {
    throw new Error(`Could not generate a QR code for "${text}"`)
  }
}

export function generateCode128DataUrl(text: string): string {
  try {
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, text, {
      format: 'CODE128',
      displayValue: false,
      margin: 0,
      width: 2,
      height: 60,
    })
    return canvas.toDataURL('image/png')
  } catch {
    throw new Error(`Could not generate a barcode for "${text}" (unsupported characters)`)
  }
}
