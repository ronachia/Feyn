import { createClient } from 'npm:@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!
const MP_WEBHOOK_SECRET = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET')
const MP_PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments'
const MP_PREAPPROVAL_URL = 'https://api.mercadopago.com/preapproval'

async function verifyMercadoPagoSignature(req: Request, dataId: string): Promise<boolean> {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Mercado Pago webhook:', payload)

    const dataId = payload?.data?.id?.toString() ?? ''
    const valid = await verifyMercadoPagoSignature(req, dataId)
    if (!valid) {
      console.warn('Webhook rejected: invalid HMAC signature')
      return new Response('Unauthorized', { status: 401 })
    }

    // Assinatura autorizada (quando usuário aprova a recorrência)
    if (payload.type === 'preapproval' && payload.data && payload.data.id) {
      const subscriptionId = payload.data.id

      // Buscar detalhes da assinatura
      const subResponse = await fetch(`${MP_PREAPPROVAL_URL}/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        },
      })

      if (!subResponse.ok) {
        console.error('Failed to fetch subscription details')
        return new Response('OK', { status: 200 })
      }

      const subscription = await subResponse.json()
      const userId = subscription.external_reference

      if (!userId) {
        console.error('No external_reference in subscription')
        return new Response('OK', { status: 200 })
      }

      // Assinatura ativa
      if (subscription.status === 'authorized') {
        const isYearly = subscription.auto_recurring?.frequency === 12
        const now = new Date().toISOString()

        const { error } = await supabase.from('profiles').upsert({
          clerk_user_id: userId,
          is_premium: true,
          premium_plan: isYearly ? 'yearly' : 'monthly',
          premium_started_at: now,
          premium_expires_at: subscription.next_payment_date,
          mercado_pago_subscription_id: subscription.id,
          mercado_pago_customer_id: subscription.payer_id,
          updated_at: now,
        }, { onConflict: 'clerk_user_id' })

        if (error) {
          console.error('Supabase error:', error)
          return new Response('Error', { status: 500 })
        }

        console.log(`Subscription activated for user ${userId}`)
      }

      // Assinatura cancelada
      if (subscription.status === 'cancelled') {
        const { error } = await supabase.from('profiles').update({
          is_premium: false,
          premium_cancelled_at: new Date().toISOString(),
        }).eq('clerk_user_id', subscription.external_reference)

        if (error) console.error('Error cancelling subscription:', error)
        else console.log(`Subscription cancelled for user ${subscription.external_reference}`)
      }
    }

    // Pagamento único (fallback)
    if (payload.type === 'payment' && payload.data && payload.data.id) {
      const paymentId = payload.data.id

      // Buscar detalhes do pagamento
      const paymentResponse = await fetch(`${MP_PAYMENTS_URL}/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        },
      })

      if (!paymentResponse.ok) {
        console.error('Failed to fetch payment details')
        return new Response('OK', { status: 200 })
      }

      const payment = await paymentResponse.json()
      const userId = payment.external_reference

      if (!userId) {
        console.error('No external_reference in payment')
        return new Response('OK', { status: 200 })
      }

      // Pagamento aprovado
      if (payment.status === 'approved') {
        const isYearly = payment.transaction_amount >= 70
        const now = new Date().toISOString()
        const expiresAt = isYearly
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const { error } = await supabase.from('profiles').upsert({
          clerk_user_id: userId,
          is_premium: true,
          premium_plan: isYearly ? 'yearly' : 'monthly',
          premium_started_at: now,
          premium_expires_at: expiresAt,
          mercado_pago_payment_id: payment.id.toString(),
          mercado_pago_subscription_id: null, // Pagamento único, não assinatura
          mercado_pago_customer_id: payment.payer?.id,
          updated_at: now,
        }, { onConflict: 'clerk_user_id' })

        if (error) {
          console.error('Supabase error:', error)
          return new Response('Error', { status: 500 })
        }

        console.log(`Premium activated for user ${userId}`)
      }

      // Pagamento cancelado ou estornado
      if (payment.status === 'cancelled' || payment.status === 'refunded') {
        const { error } = await supabase.from('profiles').update({
          is_premium: false,
          premium_cancelled_at: new Date().toISOString(),
        }).eq('clerk_user_id', payment.external_reference)

        if (error) console.error('Error cancelling premium:', error)
        else console.log(`Premium cancelled for user ${payment.external_reference}`)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error', { status: 500 })
  }
})
