import { createClient } from 'npm:@supabase/supabase-js'

export const FREE_DAILY_LIMIT = 3

function getAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

/**
 * True only if the profile is flagged as premium in the database.
 * Use this to hard-block Premium-only features (Voice Mode, Teach Mode,
 * Create Lesson) for free users — it never lets a free user through,
 * regardless of daily counters.
 *
 * Fails closed: if the check itself errors, the caller is treated as
 * NOT premium (safer default for a paywalled feature than failing open).
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  try {
    const supabase = getAdminClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('clerk_user_id', userId)
      .single()
    return Boolean(profile?.is_premium)
  } catch {
    return false
  }
}

/**
 * Shared daily-quota gate for AI features that are free-but-limited
 * (e.g. analyze-explanation). Premium users always pass. Free users get
 * FREE_DAILY_LIMIT calls/day, tracked server-side in progress.daily_stats.
 *
 * IMPORTANT: this is the only place that should ever write daily_stats.
 * sync-progress must never accept/overwrite this field from the client —
 * doing so lets a free user reset their own counter via DevTools.
 *
 * Fails open on infra errors (matches prior behavior) so a Supabase hiccup
 * doesn't block legitimate usage.
 */
export async function checkAndIncrementDailyQuota(userId: string): Promise<boolean> {
  try {
    const supabase = getAdminClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('clerk_user_id', userId)
      .single()

    if (profile?.is_premium) return true

    const { data: progress } = await supabase
      .from('progress')
      .select('daily_stats')
      .eq('clerk_user_id', userId)
      .single()

    const today = new Date().toDateString()
    const stats = progress?.daily_stats ?? { date: null, aiCalls: 0 }
    const currentCalls = stats.date === today ? (stats.aiCalls ?? 0) : 0

    if (currentCalls >= FREE_DAILY_LIMIT) return false

    await supabase.from('progress').upsert({
      clerk_user_id: userId,
      daily_stats: { date: today, aiCalls: currentCalls + 1 },
      updated_at: new Date().toISOString(),
    })

    return true
  } catch {
    return true
  }
}
