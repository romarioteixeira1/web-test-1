/** Fired when the server answers 401: the session ended, so the app goes back to the login screen. */
export const UNAUTHORIZED_EVENT = 'ecocontrol:unauthorized'

export function notifyIfUnauthorized(res: Response) {
  if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    notifyIfUnauthorized(res)
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Erro ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
