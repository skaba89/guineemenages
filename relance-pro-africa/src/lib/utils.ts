import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateRelative(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffTime = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return `En retard de ${Math.abs(diffDays)} jour(s)`
  } else if (diffDays === 0) {
    return "Aujourd'hui"
  } else if (diffDays === 1) {
    return 'Demain'
  } else {
    return `Dans ${diffDays} jour(s)`
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'overdue':
      return 'bg-red-100 text-red-800'
    case 'partially_paid':
      return 'bg-blue-100 text-blue-800'
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    case 'sent':
      return 'bg-green-100 text-green-800'
    case 'delivered':
      return 'bg-blue-100 text-blue-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'opened':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    overdue: 'En retard',
    partially_paid: 'Partiellement payé',
    paid: 'Payé',
    cancelled: 'Annulé',
    sent: 'Envoyé',
    delivered: 'Délivré',
    failed: 'Échec',
    opened: 'Ouvert',
    active: 'Actif',
    inactive: 'Inactif',
  }
  return labels[status] || status
}

export function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `FAC-${timestamp}-${random}`
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  // Accepte les formats africains courants
  const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{8,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function formatPhoneForWhatsApp(phone: string): string {
  // Formate le numéro pour WhatsApp (sans +, espaces, etc.)
  return phone.replace(/[+\s\-().]/g, '')
}
