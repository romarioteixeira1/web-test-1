import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router'
import { ASSISTANT_MAX_CHARS, type AssistantMessage } from '../../../shared/assistant'
import { askAssistant, AssistantNotConfiguredError } from '../../api/assistant'
import { IconChat, IconClose, IconSend } from '../layout/icons'
import { helpTopics, notConfiguredReply } from './helpTopics'

const greeting: AssistantMessage = {
  role: 'assistant',
  content: 'Olá! Sou o assistente do EcoControl. Escolha um assunto abaixo ou escreva sua dúvida.',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Floating "Precisa de ajuda?" button that opens a help chat in the corner of every screen. */
export function HelpChat({ open, onOpenChange }: Props) {
  const { pathname } = useLocation()
  const [messages, setMessages] = useState<AssistantMessage[]>([greeting])
  const [draft, setDraft] = useState('')
  const [waiting, setWaiting] = useState(false)
  const panelId = useId()
  const titleId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onOpenChange(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, waiting, open])

  function pickTopic(question: string, answer: string) {
    setMessages((prev) => [...prev, { role: 'user', content: question }, { role: 'assistant', content: answer }])
  }

  async function send(e?: FormEvent) {
    e?.preventDefault()
    const text = draft.trim()
    if (!text || waiting) return

    const next: AssistantMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setDraft('')
    setWaiting(true)
    try {
      const reply = await askAssistant(next, pathname)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const content =
        err instanceof AssistantNotConfiguredError
          ? notConfiguredReply
          : err instanceof Error
            ? err.message
            : 'Não consegui responder agora. Tente de novo.'
      setMessages((prev) => [...prev, { role: 'assistant', content }])
    } finally {
      setWaiting(false)
      inputRef.current?.focus()
    }
  }

  const showTopics = !waiting && messages[messages.length - 1]?.role === 'assistant'

  return (
    <div className="help-chat">
      {open && (
        <section id={panelId} className="help-panel animate-scale-in" role="dialog" aria-labelledby={titleId}>
          <header className="help-head">
            <span className="help-avatar" aria-hidden="true">
              <IconChat size={20} />
            </span>
            <div>
              <h2 id={titleId}>Assistente EcoControl</h2>
              <span>Tire dúvidas sobre o sistema</span>
            </div>
            <button type="button" className="icon" aria-label="Fechar ajuda" onClick={() => onOpenChange(false)}>
              <IconClose />
            </button>
          </header>

          <div className="help-messages" ref={listRef} aria-live="polite">
            {messages.map((m, i) => (
              <p key={i} className={`help-msg ${m.role}`}>
                {m.content}
              </p>
            ))}
            {waiting && (
              <p className="help-msg assistant help-typing" aria-label="Digitando">
                <span />
                <span />
                <span />
              </p>
            )}
            {showTopics && (
              <div className="help-topics" role="group" aria-label="Assuntos frequentes">
                {helpTopics.map((t) => (
                  <button key={t.question} type="button" className="help-topic" onClick={() => pickTopic(t.question, t.answer)}>
                    {t.question}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form className="help-form" onSubmit={send}>
            <textarea
              ref={inputRef}
              className="inp"
              rows={1}
              placeholder="Escreva sua dúvida…"
              aria-label="Sua dúvida"
              maxLength={ASSISTANT_MAX_CHARS}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
            />
            <button type="submit" className="btn help-send" aria-label="Enviar" disabled={waiting || !draft.trim()}>
              <IconSend />
            </button>
          </form>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        className={`help-toggle ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => onOpenChange(!open)}
      >
        {open ? <IconClose size={20} /> : <IconChat size={20} />}
        {!open && <span>Precisa de ajuda?</span>}
        {open && <span className="sr-only">Fechar ajuda</span>}
      </button>
    </div>
  )
}
