const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

let _tokenGetter = null

export function initEdgeFunctions(tokenGetter) {
  _tokenGetter = tokenGetter
}

async function getToken() {
  if (!_tokenGetter) throw new Error('Edge functions not initialized. Call initEdgeFunctions() first.')
  const token = await _tokenGetter()
  if (!token) throw new Error('No auth token available. User may not be signed in.')
  return token
}

export async function callEdgeFunction(name, body) {
  const token = await getToken()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Authorization':  `Bearer ${token}`,
      'apikey':         SUPABASE_ANON_KEY,
      'Content-Type':   'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Edge function "${name}" failed`)
  return data
}

export async function callEdgeFunctionFormData(name, formData) {
  const token = await getToken()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey':        SUPABASE_ANON_KEY,
    },
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Edge function "${name}" failed`)
  return data
}
