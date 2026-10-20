import type { AssistantMessage, AssistantReply } from '../../shared/assistant'

/** Thrown when the server has no ANTHROPIC_API_KEY, so the chat can fall back to its built-in topics. */
export class AssistantNotConfiguredError extends Error {}

export async function askAssistant(messages: AssistantMessage[], page: string): Promise<string> {
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, page }),
  })

  const body = (await res.json().catch(() => null)) as (Partial<AssistantReply> & { error?: string }) | null
  if (!res.ok) {
    if (body?.error === 'not_configured') throw new AssistantNotConfiguredError()
    throw new Error(body?.error ?? `Erro ${res.status}`)
  }
  return body?.reply ?? ''
}
