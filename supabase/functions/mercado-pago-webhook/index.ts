import { corsHeaders } from '../_shared/cors.ts'
import { mercadoPagoProvider } from '../_shared/payments/mercadoPago.ts'
import { applySubscriptionEvent } from '../_shared/payments/applyEvent.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Mercado Pago webhook:', payload)

    const dataId = payload?.data?.id?.toString() ?? ''
    const valid = await mercadoPagoProvider.verifyWebhookSignature(req, dataId)
    if (!valid) {
      console.warn('Webhook rejected: invalid HMAC signature')
      return new Response('Unauthorized', { status: 401 })
    }

    const event = await mercadoPagoProvider.parseWebhookEvent(payload)
    if (event) {
      await applySubscriptionEvent(mercadoPagoProvider.name, event)
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error', { status: 500 })
  }
})
