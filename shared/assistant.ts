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

export type AssistantReply = {
  reply: string
}

/** Limits that keep a single chat request small; the worker enforces them. */
export const ASSISTANT_MAX_MESSAGES = 20
export const ASSISTANT_MAX_CHARS = 2000
