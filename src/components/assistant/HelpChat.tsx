import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ASSISTANT_MAX_CHARS, type AssistantLink, type AssistantMessage } from '../../../shared/assistant'
import { askAssistant, AssistantNotConfiguredError } from '../../api/assistant'
import { IconChat, IconChevron, IconClose, IconHistory, IconSend } from '../layout/icons'
import { findNavItem } from '../layout/navigation'
import {
  findTopicByQuestion,
  matchTopic,
  noMatchReply,
  notConfiguredReply,
  topicsForPage,
  type HelpTopic,
} from './helpTopics'

/** A chat turn plus the buttons shown under an answer. */
type ChatMessage = AssistantMessage & {
  links?: AssistantLink[]
  suggestions?: string[]
}

const greeting: ChatMessage = {
  role: 'assistant',
  content: 'Olá! Sou o assistente do EcoControl. Escolha um assunto abaixo ou escreva sua dúvida.',
}

/** How many topics show before "Ver mais assuntos". */
const TOPICS_PREVIEW = 4

const phoneQuery = '(max-width: 900px)'

function topicReply(topic: HelpTopic): ChatMessage {
  return { role: 'assistant', content: topic.answer, links: topic.links, suggestions: topic.followUps }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Floating "Precisa de ajuda?" button that opens a help chat in the corner of every screen. */
export function HelpChat({ open, onOpenChange }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([greeting])
  const [draft, setDraft] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [showAllTopics, setShowAllTopics] = useState(false)
  // Set once the server says the AI is off, so later questions are answered from the built-in topics.
  const [aiOff, setAiOff] = useState(false)
  const panelId = useId()
  const titleId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const screen = findNavItem(pathname)

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
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
  }, [messages, waiting, open, showAllTopics])

  async function ask(raw: string) {
    const text = raw.trim()
    if (!text || waiting) return
    setShowAllTopics(false)

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setDraft('')

    // Ready answers need no round trip; with the AI off, the closest topic by keywords answers.
    const topic = findTopicByQuestion(text) ?? (aiOff ? matchTopic(text) : undefined)
    if (topic || aiOff) {
      setMessages([...next, topic ? topicReply(topic) : { role: 'assistant', content: noMatchReply }])
      return
    }

    setWaiting(true)
    try {
      const { reply, links, suggestions } = await askAssistant(
        next.map(({ role, content }) => ({ role, content })),
        pathname,
      )
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, links, suggestions }])
    } catch (err) {
      if (err instanceof AssistantNotConfiguredError) {
        setAiOff(true)
        const match = matchTopic(text)
        setMessages((prev) => [...prev, match ? topicReply(match) : { role: 'assistant', content: notConfiguredReply }])
      } else {
        const content = err instanceof Error ? err.message : 'Não consegui responder agora. Tente de novo.'
        setMessages((prev) => [...prev, { role: 'assistant', content }])
      }
    } finally {
      setWaiting(false)
      inputRef.current?.focus()
    }
  }

  function send(e?: FormEvent) {
    e?.preventDefault()
    void ask(draft)
  }

  function openScreen(to: AssistantLink) {
    navigate(to)
    // On phones the panel covers the screen, so get it out of the way.
    if (window.matchMedia(phoneQuery).matches) onOpenChange(false)
  }

  function restart() {
    setMessages([greeting])
    setDraft('')
    setShowAllTopics(false)
    inputRef.current?.focus()
  }

  const last = messages[messages.length - 1]
  const idle = !waiting && last?.role === 'assistant'
  const followUps = idle ? (last.suggestions ?? []) : []
  const pageTopics = topicsForPage(pathname)
  // Right after the greeting (or when asked) show the topic list; otherwise follow-ups plus a way back to it.
  const listTopics = idle && (messages.length === 1 || showAllTopics || !followUps.length)
  const shownTopics = showAllTopics ? pageTopics : pageTopics.slice(0, TOPICS_PREVIEW)

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
              <span>{screen ? `Você está em ${screen.label}` : 'Tire dúvidas sobre o sistema'}</span>
            </div>
            {messages.length > 1 && (
              <button type="button" className="icon" aria-label="Nova conversa" title="Nova conversa" onClick={restart}>
                <IconHistory />
              </button>
            )}
            <button type="button" className="icon" aria-label="Fechar ajuda" onClick={() => onOpenChange(false)}>
              <IconClose />
            </button>
          </header>

          <div className="help-messages" ref={listRef} aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`help-turn ${m.role}`}>
                <p className={`help-msg ${m.role}`}>{m.content}</p>
                {!!m.links?.length && (
                  <div className="help-links">
                    {m.links.map((to) => {
                      const item = findNavItem(to)
                      if (!item) return null
                      const Icon = item.icon
                      const here = item === screen
                      return (
                        <button
                          key={to}
                          type="button"
                          className="help-link"
                          disabled={here}
                          onClick={() => openScreen(to)}
                        >
                          <Icon size={15} />
                          <span>{here ? `Você está em ${item.label}` : `Abrir ${item.label}`}</span>
                          {!here && <IconChevron size={14} />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
            {waiting && (
              <p className="help-msg assistant help-typing" aria-label="Digitando">
                <span />
                <span />
                <span />
              </p>
            )}
            {idle && (
              <div className="help-topics" role="group" aria-label={listTopics ? 'Assuntos frequentes' : 'Perguntas sugeridas'}>
                {!listTopics &&
                  followUps.map((q) => (
                    <button key={q} type="button" className="help-topic" onClick={() => void ask(q)}>
                      {q}
                    </button>
                  ))}
                {listTopics &&
                  shownTopics.map((t) => (
                    <button key={t.question} type="button" className="help-topic" onClick={() => void ask(t.question)}>
                      {t.question}
                    </button>
                  ))}
                {(!listTopics || (!showAllTopics && pageTopics.length > TOPICS_PREVIEW)) && (
                  <button type="button" className="help-topic more" onClick={() => setShowAllTopics(true)}>
                    {listTopics ? 'Ver mais assuntos' : 'Outros assuntos'}
                  </button>
                )}
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
                  send()
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
