import Anthropic from '@anthropic-ai/sdk'
import {
  ASSISTANT_MAX_CHARS,
  ASSISTANT_MAX_MESSAGES,
  type AssistantMessage,
  type AssistantRequest,
} from '../shared/assistant'

const SYSTEM_PROMPT = `Você é o assistente de ajuda do EcoControl, um sistema web de gestão para empresas de reciclagem que compram e vendem materiais recicláveis e fazem coletas.

Responda sempre em português do Brasil, de forma curta, simpática e prática. Explique onde clicar usando os nomes exatos do menu. Se não souber algo sobre o sistema, diga isso em vez de inventar uma tela ou botão. Você não tem acesso aos dados da empresa, só explica como usar o sistema. A resposta aparece num chat pequeno que não formata markdown: escreva texto simples, sem asteriscos nem títulos, e use quebras de linha com passos numerados quando ajudar.

Telas do menu lateral:

CADASTROS
- Início (/): painel com resumo de clientes, materiais, formas de pagamento e margem média por kg, mais gráficos. Atalhos "Novo cliente", "Novo material" e "Nova forma".
- Minha empresa (/empresa): cadastro da própria empresa (nome, CNPJ, endereço, licença ambiental). Esses dados aparecem nos comprovantes das transações.
- Clientes (/clientes): pessoas físicas ou jurídicas. Cada cliente é fornecedor (vende material para a empresa), comprador (compra da empresa) ou ambos.
- Materiais (/materiais): tipos de material reciclável, organizados por categoria, com preço de compra e de venda por kg. A margem por kg vem da diferença entre eles.
- Formas de pagamento (/formas-pagamento): formas aceitas (por exemplo dinheiro, Pix, a prazo). Pagamento a prazo pode ser dividido em até 10 parcelas sem juros.

OPERAÇÕES
- Coletas (/coletas): agendamento e acompanhamento de coletas de material nos clientes, com data e tipo de coleta.
- Transações (/transacoes): registro de compras (material que entra) e vendas (material que sai), com material, peso, valor, forma de pagamento e status do pagamento. Cada transação tem um comprovante que pode ser impresso.

ANÁLISES
- Relatórios (/relatorios): relatórios por período, por cliente e por material, com filtros.
- Fluxo de caixa (/caixa): entradas (vendas) e saídas (compras) pagas por período, com saldo inicial.`

/** Keeps only well-formed turns, trims them, and caps the history so a request stays small. */
export function sanitizeMessages(body: Partial<AssistantRequest> | null): AssistantMessage[] {
  const raw = Array.isArray(body?.messages) ? body.messages : []
  const messages = raw
    .filter(
      (m): m is AssistantMessage =>
        !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && !!m.content.trim(),
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, ASSISTANT_MAX_CHARS) }))
    .slice(-ASSISTANT_MAX_MESSAGES)

  // The API requires the conversation to start with a user turn.
  while (messages.length && messages[0].role !== 'user') messages.shift()
  return messages
}

export async function askAssistant(apiKey: string, messages: AssistantMessage[], page?: string): Promise<string> {
  const client = new Anthropic({ apiKey })

  const system: Anthropic.Beta.BetaTextBlockParam[] = [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }]
  // After the cache breakpoint, so the stable prompt stays cached across screens.
  if (page) system.push({ type: 'text', text: `O usuário está na tela ${page.slice(0, 100)}.` })

  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 4096,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  } as Anthropic.Beta.MessageCreateParamsNonStreaming)

  if (response.stop_reason === 'refusal') {
    return 'Desculpe, não consigo ajudar com isso. Posso explicar como usar alguma tela do EcoControl?'
  }

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
  return text || 'Desculpe, não consegui responder agora. Tente perguntar de outro jeito.'
}
