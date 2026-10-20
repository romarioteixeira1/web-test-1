import { paymentMethodLabels } from '../../shared/customer'
import type { PaymentMethodRecord } from '../../shared/payment-method'

/** Display name for a stored payment method code. */
export function paymentMethodName(
  code: string | null | undefined,
  known?: string | null | PaymentMethodRecord[],
): string {
  if (!code) return '—'
  if (typeof known === 'string') return known
  const match = Array.isArray(known) ? known.find((m) => m.code === code) : undefined
  return match?.name ?? paymentMethodLabels[code] ?? code
}
