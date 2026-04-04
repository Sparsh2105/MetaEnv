const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getState:   ()           => request('GET',  '/state'),
  getActions: ()           => request('GET',  '/actions'),
  reset:      (difficulty) => request('POST', '/reset', { difficulty }),
  step:       (action, tailored_skills) =>
    request('POST', '/step', tailored_skills?.length
      ? { action, tailored_skills }
      : { action }
    ),
}
