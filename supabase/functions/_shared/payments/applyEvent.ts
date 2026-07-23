import { createClient } from 'npm:@supabase/supabase-js'
import type { NormalizedSubscriptionEvent } from './types.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Escreve o resultado normalizado de um evento de pagamento em `profiles`,
// independente de qual provedor gerou o evento.
export async function applySubscriptionEvent(providerName: string, event: NormalizedSubscriptionEvent) {
  const now = new Date().toISOString()

  if (event.status === 'active') {
    const { error } = await supabase.from('profiles').upsert({
      clerk_user_id: event.userId,
      is_premium: true,
      premium_plan: event.plan,
      premium_started_at: now,
      premium_expires_at: event.expiresAt,
      payment_provider: providerName,
      payment_provider_subscription_id: event.providerSubscriptionId,
      payment_provider_customer_id: event.providerCustomerId,
      payment_provider_payment_id: event.providerPaymentId,
      updated_at: now,
    }, { onConflict: 'clerk_user_id' })

    if (error) throw error
    console.log(`Subscription activated for user ${event.userId} via ${providerName}`)
    return
  }

  if (event.status === 'cancelled') {
    const { error } = await supabase.from('profiles').update({
      is_premium: false,
      premium_cancelled_at: now,
    }).eq('clerk_user_id', event.userId)

    if (error) throw error
    console.log(`Subscription cancelled for user ${event.userId} via ${providerName}`)
  }
}
