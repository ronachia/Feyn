import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { verifyClerkJWT } from '../_shared/auth.ts'
import { getProvider } from '../_shared/payments/registry.ts'

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
    const provider = getProvider()

    const { url, providerSubscriptionId } = await provider.createSubscription({
      userId,
      billing: isYearly ? 'yearly' : 'monthly',
    })

    return new Response(
      JSON.stringify({
        url,
        subscriptionId: providerSubscriptionId,
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
