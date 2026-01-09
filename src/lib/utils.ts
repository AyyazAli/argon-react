import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'PKR 0'
  }
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '-'
  
  try {
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      return '-'
    }
    return new Intl.DateTimeFormat('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(parsed)
  } catch {
    return '-'
  }
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '-'
  
  try {
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      return '-'
    }
    return new Intl.DateTimeFormat('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed)
  } catch {
    return '-'
  }
}
