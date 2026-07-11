import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'

const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!
const MP_API_URL = 'https://api.mercadopago.com/checkout/preferences'
const APP_URL = Deno.env.get('APP_URL')!

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

    // Valores em reais
    const unitPrice = isYearly ? 79.90 : 9.90
    const title = isYearly ? 'FeynLearn Premium Anual' : 'FeynLearn Premium Mensal'

    // Criar preferência no Mercado Pago
    const response = await fetch(MP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          title,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: 'BRL',
        }],
        payer: {
          email: `${userId}@feynlearn.app`, // Email fictício baseado no userId
        },
        external_reference: userId, // Identifica o usuário no webhook
        back_urls: {
          success: `${APP_URL}/pricing?payment=success`,
          failure: `${APP_URL}/pricing?payment=failure`,
          pending: `${APP_URL}/pricing?payment=pending`,
        },
        auto_return: 'approved',
        payment_methods: {
          installments: 12, // Até 12x
          default_installments: 1,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Mercado Pago error:', error)
      throw new Error('Failed to create checkout')
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({
        url: data.init_point, // URL do checkout Mercado Pago
        preferenceId: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create checkout' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
