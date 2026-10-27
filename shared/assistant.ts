export type AssistantRole = 'user' | 'assistant'

export type AssistantMessage = {
  role: AssistantRole
  content: string
}

export type AssistantRequest = {
  messages: AssistantMessage[]
  /** Path of the screen the user is on, so answers can refer to it. */
  page?: string
}

/** Screens an answer can link to; the chat shows an "Abrir …" button for each. */
export const ASSISTANT_LINKS = [
  '/',
  '/empresa',
  '/clientes',
  '/materiais',
  '/formas-pagamento',
  '/coletas',
  '/transacoes',
  '/relatorios',
  '/caixa',
] as const

export type AssistantLink = (typeof ASSISTANT_LINKS)[number]

export type AssistantReply = {
  reply: string
  /** Screens the answer talks about. */
  links: AssistantLink[]
  /** Short follow-up questions the user can tap. */
  suggestions: string[]
}

export const ASSISTANT_MAX_LINKS = 3
export const ASSISTANT_MAX_SUGGESTIONS = 3

/** Limits that keep a single chat request small; the worker enforces them. */
export const ASSISTANT_MAX_MESSAGES = 20
export const ASSISTANT_MAX_CHARS = 2000
