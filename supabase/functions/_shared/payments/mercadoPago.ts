import type { CheckoutResult, NormalizedSubscriptionEvent, PaymentProvider } from './types.ts'

const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!
const MP_WEBHOOK_SECRET = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET')
const MP_PREAPPROVAL_URL = 'https://api.mercadopago.com/preapproval'
const MP_PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments'
const APP_URL = Deno.env.get('APP_URL')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const MONTHLY_PLAN_ID = Deno.env.get('MP_MONTHLY_PLAN_ID') ?? ''
const YEARLY_PLAN_ID = Deno.env.get('MP_YEARLY_PLAN_ID') ?? ''

async function createSubscription({ userId, billing }: { userId: string; billing: 'monthly' | 'yearly' }): Promise<CheckoutResult> {
  const isYearly = billing === 'yearly'

  const planId = isYearly ? YEARLY_PLAN_ID : MONTHLY_PLAN_ID
  const amount = isYearly ? 598.80 : 59.90
  const title = isYearly ? 'FeynLearn Premium Anual' : 'FeynLearn Premium Mensal'
  const frequency = isYearly ? 12 : 1 // meses

  const body: any = {
    payer_email: `${userId}@feynlearn.app`,
    external_reference: userId,
    back_url: `${APP_URL}/pricing?payment=success`,
    notification_url: `${SUPABASE_URL}/functions/v1/mercado-pago-webhook`,
    reason: title,
    auto_recurring: {
      frequency,
      frequency_type: 'months',
      transaction_amount: amount,
      currency_id: 'BRL',
    },
  }

  // Se temos plan_id, usamos. Senão, criamos assinatura com valor direto
  if (planId) {
    body.preapproval_plan_id = planId
  }

  const response = await fetch(MP_PREAPPROVAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Mercado Pago error:', error)
    throw new Error('Failed to create subscription')
  }

  const data = await response.json()
  return { url: data.init_point, providerSubscriptionId: data.id }
}

async function verifyWebhookSignature(req: Request, dataId: string): Promise<boolean> {
  if (!MP_WEBHOOK_SECRET) return true // sem secret configurado: permissivo (desenvolvimento)

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  if (!xSignature || !xRequestId) return false

  // Formato: "ts=<timestamp>,v1=<hash>"
  const parts = Object.fromEntries(xSignature.split(',').map((p) => p.split('=')))
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  // Template oficial do Mercado Pago: "id:{dataId};request-id:{xRequestId};ts:{ts}"
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(MP_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const expected = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return expected === v1
}

async function parseWebhookEvent(payload: any): Promise<NormalizedSubscriptionEvent | null> {
  // Assinatura (recorrência)
  if (payload.type === 'preapproval' && payload.data?.id) {
    const subResponse = await fetch(`${MP_PREAPPROVAL_URL}/${payload.data.id}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    })
    if (!subResponse.ok) {
      console.error('Failed to fetch subscription details')
      return null
    }
    const subscription = await subResponse.json()
    const userId = subscription.external_reference
    if (!userId) {
      console.error('No external_reference in subscription')
      return null
    }

    if (subscription.status === 'authorized') {
      const isYearly = subscription.auto_recurring?.frequency === 12
      return {
        userId,
        status: 'active',
        plan: isYearly ? 'yearly' : 'monthly',
        expiresAt: subscription.next_payment_date,
        providerSubscriptionId: subscription.id,
        providerCustomerId: subscription.payer_id,
        providerPaymentId: null,
      }
    }

    if (subscription.status === 'cancelled') {
      return {
        userId,
        status: 'cancelled',
        plan: null,
        expiresAt: null,
        providerSubscriptionId: null,
        providerCustomerId: null,
        providerPaymentId: null,
      }
    }

    return null
  }

  // Pagamento único (fallback, sem assinatura recorrente)
  if (payload.type === 'payment' && payload.data?.id) {
    const paymentResponse = await fetch(`${MP_PAYMENTS_URL}/${payload.data.id}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    })
    if (!paymentResponse.ok) {
      console.error('Failed to fetch payment details')
      return null
    }
    const payment = await paymentResponse.json()
    const userId = payment.external_reference
    if (!userId) {
      console.error('No external_reference in payment')
      return null
    }

    if (payment.status === 'approved') {
      const isYearly = payment.transaction_amount >= 70
      const expiresAt = isYearly
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      return {
        userId,
        status: 'active',
        plan: isYearly ? 'yearly' : 'monthly',
        expiresAt,
        providerSubscriptionId: null,
        providerCustomerId: payment.payer?.id ?? null,
        providerPaymentId: payment.id.toString(),
      }
    }

    if (payment.status === 'cancelled' || payment.status === 'refunded') {
      return {
        userId,
        status: 'cancelled',
        plan: null,
        expiresAt: null,
        providerSubscriptionId: null,
        providerCustomerId: null,
        providerPaymentId: null,
      }
    }

    return null
  }

  return null
}

export const mercadoPagoProvider: PaymentProvider = {
  name: 'mercado_pago',
  createSubscription,
  verifyWebhookSignature,
  parseWebhookEvent,
}
