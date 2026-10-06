export const PAYMENT_METHODS = ['Cash', 'Card', 'GPay', 'Credit'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map((method) => ({
  label: method,
  value: method,
}));

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  const method = String(value ?? '');
  return (PAYMENT_METHODS as readonly string[]).includes(method)
    ? (method as PaymentMethod)
    : 'Cash';
}
