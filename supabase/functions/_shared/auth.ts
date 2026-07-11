import * as jose from 'npm:jose'

const CLERK_JWKS_URL = Deno.env.get('CLERK_JWKS_URL')!

let JWKS: ReturnType<typeof jose.createRemoteJWKSet> | null = null

function getJWKS() {
  if (!JWKS) JWKS = jose.createRemoteJWKSet(new URL(CLERK_JWKS_URL))
  return JWKS
}

export async function verifyClerkJWT(authHeader: string | null): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }
  const token = authHeader.slice(7)
  const { payload } = await jose.jwtVerify(token, getJWKS())
  const userId = payload.sub
  if (!userId) throw new Error('No user ID in token')
  return userId
}
