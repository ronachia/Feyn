import type { PaymentProvider } from './types.ts'
import { mercadoPagoProvider } from './mercadoPago.ts'

const providers: Record<string, PaymentProvider> = {
  mercado_pago: mercadoPagoProvider,
}

// Único provedor hoje. Quando expandir pra outros países, esta função vira o
// ponto de decisão (ex: por região/moeda do usuário) — o resto do código não muda.
export function getProvider(): PaymentProvider {
  return providers.mercado_pago
}

export function getProviderByName(name: string): PaymentProvider | null {
  return providers[name] ?? null
}
