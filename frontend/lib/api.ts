import { requireEnv } from './env'

export async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const base = requireEnv('NEXT_PUBLIC_API_BASE_URL')
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (data?.detail) msg = data.detail
    } catch {}
    throw new Error(msg)
  }
  return (await res.json()) as T
}
