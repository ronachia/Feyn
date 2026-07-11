import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'

const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!
const MP_API_URL = 'https://api.mercadopago.com/preapproval'
const APP_URL = Deno.env.get('APP_URL')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const MONTHLY_PLAN_ID = Deno.env.get('MP_MONTHLY_PLAN_ID') ?? ''
const YEARLY_PLAN_ID = Deno.env.get('MP_YEARLY_PLAN_ID') ?? ''

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  let userId: string
  try {
    userId = await verifyClerkJWT(req.headers.get('Authorization'))
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { billing } = await req.json()
    const isYearly = billing === 'yearly'

    // Usar plano predefinido ou criar assinatura com valor direto
    const planId = isYearly ? YEARLY_PLAN_ID : MONTHLY_PLAN_ID
    const amount = isYearly ? 598.80 : 49.90
    const title = isYearly ? 'FeynLearn Premium Anual' : 'FeynLearn Premium Mensal'
    const frequency = isYearly ? 12 : 1 // meses
    const frequencyType = 'months'

    // Se temos plan_id, usamos. Senão, criamos assinatura com valor direto
    const body: any = {
      payer_email: `${userId}@feynlearn.app`,
      external_reference: userId,
      back_url: `${APP_URL}/pricing?payment=success`,
      notification_url: `${SUPABASE_URL}/functions/v1/mercado-pago-webhook`,
      reason: title,
      auto_recurring: {
        frequency,
        frequency_type: frequencyType,
        transaction_amount: amount,
        currency_id: 'BRL',
      },
    }

    if (planId) {
      body.preapproval_plan_id = planId
    }

    const response = await fetch(MP_API_URL, {
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

    return new Response(
      JSON.stringify({
        url: data.init_point, // URL para autorizar assinatura
        subscriptionId: data.id,
        plan: isYearly ? 'yearly' : 'monthly',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create subscription' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
